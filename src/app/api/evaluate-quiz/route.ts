import { NextRequest, NextResponse } from 'next/server';
import {
  evaluateAssessmentSubmission,
  generateRetestQuestionsFromWeakTopics,
} from '@/lib/deterministic-evaluator';
import {
  BASELINE_QUIZ_METADATA,
  COMPARABLE_POST_ASSESSMENT_METADATA,
  SAMPLE_QUESTIONS_BANK,
} from '@/lib/curriculum-data';
import { AssessmentSnapshot, QuizMetadata, StudentAnswerSubmission } from '@/types';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const user = getDb()
      .prepare('SELECT role FROM users WHERE id = ?')
      .get(session.userId) as { role: string } | undefined;
    if (user?.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Student access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { quizId, submissions, previousAttemptId, isRetest } = body;

    if (!submissions || !Array.isArray(submissions)) {
      return NextResponse.json(
        { error: 'Invalid submissions payload' },
        { status: 400 }
      );
    }

    if (submissions.length > SAMPLE_QUESTIONS_BANK.length || submissions.some((submission) =>
      !submission || typeof submission.questionId !== 'string' || typeof submission.studentAnswer !== 'string'
    )) {
      return NextResponse.json({ error: 'Invalid submissions payload.' }, { status: 400 });
    }

    const db = getDb();
    let previousSnapshot: AssessmentSnapshot | null = null;
    let previousAttemptNumber = 0;
    let questionBank = SAMPLE_QUESTIONS_BANK;

    if (isRetest) {
      if (typeof previousAttemptId !== 'string') {
        return NextResponse.json({ error: 'A previous failed attempt is required for a retest.' }, { status: 400 });
      }
      const previousRow = db.prepare(`
        SELECT snapshot_json, result_status, attempt_number, is_retest
        FROM assessment_snapshots WHERE id = ? AND student_id = ?
      `).get(previousAttemptId, session.userId) as {
        snapshot_json: string;
        result_status: string;
        attempt_number: number;
        is_retest: number;
      } | undefined;
      if (!previousRow || previousRow.result_status !== 'FAIL') {
        return NextResponse.json({ error: 'Retests require a saved failed attempt belonging to your account.' }, { status: 403 });
      }
      try {
        previousSnapshot = JSON.parse(previousRow.snapshot_json) as AssessmentSnapshot;
      } catch {
        return NextResponse.json({ error: 'The previous attempt is invalid.' }, { status: 400 });
      }
      previousAttemptNumber = previousRow.attempt_number;
      questionBank = generateRetestQuestionsFromWeakTopics(previousSnapshot, SAMPLE_QUESTIONS_BANK, 5);
    }

    // Determine target quiz metadata
    let quizMeta: QuizMetadata = BASELINE_QUIZ_METADATA;
    if (isRetest) {
      quizMeta = {
        ...BASELINE_QUIZ_METADATA,
        id: 'retest-weaker-topics',
        title: 'Weak Topic Retest',
        type: 'RETEST',
      };
    } else if (quizId === 'retest-weaker-topics') {
      return NextResponse.json({ error: 'Retest assessments must reference a prior failed attempt.' }, { status: 400 });
    } else if (quizId === 'comparable-post-retest-class9') {
      quizMeta = COMPARABLE_POST_ASSESSMENT_METADATA;
    } else if (typeof quizId === 'string' && quizId.startsWith('exam-')) {
      quizMeta = {
        ...BASELINE_QUIZ_METADATA,
        id: quizId,
        title: 'Class 9 Mathematics Timed Assessment',
        type: 'MOCK_EXAM',
      };
    } else if (quizId) {
      quizMeta = {
        ...BASELINE_QUIZ_METADATA,
        id: quizId,
        title: `Class 9 Assessment (${quizId})`,
        type: 'CHAPTER_QUIZ',
      };
    }

    const evaluatedSnapshot = evaluateAssessmentSubmission(
      quizMeta,
      questionBank,
      submissions as StudentAnswerSubmission[],
      session.userId,
      previousSnapshot?.id ?? null,
      previousAttemptNumber + 1,
      Boolean(isRetest)
    );

    const persistSnapshot = db.transaction(() => {
      const insert = db.prepare(`
        INSERT INTO assessment_snapshots
          (id, student_id, quiz_id, quiz_title, type, board, grade, chapter_id, topic_id,
           total_questions, correct_count, incorrect_count, unanswered_count, score, max_score,
           percentage, accuracy, time_spent_seconds, pass_threshold, result_status,
           attempt_number, is_retest, previous_attempt_id, completed_at, is_baseline, snapshot_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO NOTHING
      `).run(
        evaluatedSnapshot.id,
        session.userId,
        evaluatedSnapshot.quizId,
        evaluatedSnapshot.quizTitle,
        evaluatedSnapshot.type,
        evaluatedSnapshot.board,
        evaluatedSnapshot.grade,
        evaluatedSnapshot.chapterId ?? null,
        evaluatedSnapshot.topicId ?? null,
        evaluatedSnapshot.totalQuestions,
        evaluatedSnapshot.correctCount,
        evaluatedSnapshot.incorrectCount,
        evaluatedSnapshot.unansweredCount,
        evaluatedSnapshot.score,
        evaluatedSnapshot.maxScore,
        evaluatedSnapshot.percentage,
        evaluatedSnapshot.accuracy,
        evaluatedSnapshot.timeSpentSeconds,
        evaluatedSnapshot.passThreshold,
        evaluatedSnapshot.resultStatus,
        evaluatedSnapshot.attemptNumber,
        evaluatedSnapshot.isRetest ? 1 : 0,
        evaluatedSnapshot.previousAttemptId,
        evaluatedSnapshot.createdAt,
        evaluatedSnapshot.isBaseline ? 1 : 0,
        JSON.stringify(evaluatedSnapshot)
      );

      if (insert.changes === 0) return 0;

      const addedXP = evaluatedSnapshot.correctCount * 15 + (evaluatedSnapshot.isBaseline ? 100 : 50);
      const student = db.prepare('SELECT xp FROM student_profiles WHERE uid = ?').get(session.userId) as
        | { xp: number }
        | undefined;
      if (!student) throw new Error('Student profile not found while saving assessment.');
      const newXP = student.xp + addedXP;
      db.prepare(`
        UPDATE student_profiles
        SET xp = ?, level = ?, questions_solved = questions_solved + ?,
            baseline_completed = CASE WHEN ? = 1 THEN 1 ELSE baseline_completed END,
            baseline_score = CASE WHEN ? = 1 THEN ? ELSE baseline_score END
        WHERE uid = ?
      `).run(
        newXP,
        Math.floor(newXP / 1000) + 1,
        evaluatedSnapshot.correctCount,
        evaluatedSnapshot.isBaseline ? 1 : 0,
        evaluatedSnapshot.isBaseline ? 1 : 0,
        evaluatedSnapshot.percentage,
        session.userId
      );
      return addedXP;
    });
    const xpAwarded = persistSnapshot();

    return NextResponse.json({
      success: true,
      snapshot: evaluatedSnapshot,
      xpAwarded,
    });
  } catch (error) {
    console.error('Quiz Evaluation Error:', error);
    return NextResponse.json(
      { error: 'Internal evaluation error' },
      { status: 500 }
    );
  }
}
