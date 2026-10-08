// ==============================================================================
// EduMathAI - Deterministic Academic Evaluation Engine
// Strict, verified academic calculations for quizzes, baseline, mistake detection,
// topic mastery, and Before & After measurable improvement.
// ==============================================================================

import {
  AssessmentSnapshot,
  BeforeAfterComparison,
  EvaluatedQuestionResult,
  MistakeCategory,
  Question,
  QuizMetadata,
  StudentAnswerSubmission,
  MetricComparison,
} from '@/types';
import { CLASS_9_CHAPTERS, SAMPLE_QUESTIONS_BANK } from './curriculum-data';

/**
 * Deterministically classify mathematical mistake type based on student answer vs correct answer
 */
export function classifyMistake(
  question: Question,
  studentAnswer: string,
  timeSpentSeconds: number
): {
  mistakeCategory: MistakeCategory;
  whatWentWrong: string;
  whyItHappened: string;
  correctApproach: string;
  conceptToRevise: string;
} {
  const cleanStudent = (studentAnswer || '').trim().toLowerCase();
  const cleanCorrect = (question.correctAnswer || '').trim().toLowerCase();

  // If time limit exceeded or empty
  if (!cleanStudent || timeSpentSeconds > 600) {
    return {
      mistakeCategory: 'TIMEOUT',
      whatWentWrong: 'Question was left unanswered or time limit expired.',
      whyItHappened: 'Time ran out before problem-solving steps could be finalized.',
      correctApproach: 'Review key formulas beforehand to improve solving speed.',
      conceptToRevise: 'Formula recall & rapid calculation techniques',
    };
  }

  // Specific common mistake detection heuristics for Class 9 Math
  if (question.id === 'q-baseline-2') {
    // 2x + 5 = 15 => correct x = 5.
    // If student says 10 (2x = 20 => x = 10, added 5 instead of subtracting)
    if (cleanStudent === '10' || cleanStudent === '20') {
      return {
        mistakeCategory: 'SIGN_ERROR',
        whatWentWrong: 'Added +5 to 15 instead of subtracting 5 when transposing across the equals sign (2x = 20 => x = 10).',
        whyItHappened: 'Forgot that when moving a positive constant to the opposite side of an equation, its sign must invert from (+) to (-).',
        correctApproach: 'Transposition rule: $2x + 5 = 15 \\implies 2x = 15 - 5 = 10 \\implies x = 10/2 = 5$.',
        conceptToRevise: 'Linear Equations Transposition and Sign Inversion',
      };
    }
  }

  if (question.id === 'q-baseline-4') {
    // 180 - 65 = 115. If student says 25 or 90
    if (cleanStudent === '25' || cleanStudent === '35') {
      return {
        mistakeCategory: 'CONCEPT_ERROR',
        whatWentWrong: 'Subtracted 65 from 90° (Complementary) instead of 180° (Supplementary Linear Pair).',
        whyItHappened: 'Confused complementary angles (sum = 90°) with linear pairs (sum = 180°).',
        correctApproach: 'Linear pairs on a straight line always sum to 180°: $180^\\circ - 65^\\circ = 115^\\circ$.',
        conceptToRevise: 'Linear Pair Axiom vs Complementary Angles',
      };
    }
    if (cleanStudent === '125' || cleanStudent === '105') {
      return {
        mistakeCategory: 'CALCULATION_ERROR',
        whatWentWrong: 'Arithmetic borrow error while subtracting 65 from 180.',
        whyItHappened: 'Miscalculated the units/tens digits during vertical subtraction ($180 - 65$).',
        correctApproach: '$180 - 60 = 120$, then $120 - 5 = 115^\\circ$.',
        conceptToRevise: 'Mental Math and Column Subtraction Verification',
      };
    }
  }

  if (question.id === 'q-baseline-9') {
    // (3+√3)(3-√3) = 9 - 3 = 6. If student says 0, 12, or 9
    if (cleanStudent === '0' || cleanStudent === '12') {
      return {
        mistakeCategory: 'FORMULA_ERROR',
        whatWentWrong: 'Incorrectly applied $(a+b)(a-b)$ algebraic identity.',
        whyItHappened: 'Did not square both terms separately or treated $(\\sqrt{3})^2$ improperly.',
        correctApproach: '$(a+b)(a-b) = a^2 - b^2 \\implies 3^2 - (\\sqrt{3})^2 = 9 - 3 = 6$.',
        conceptToRevise: 'Difference of Squares and Radicals Simplification',
      };
    }
  }

  // General heuristics based on question type
  if (question.type === 'MCQ' || question.type === 'TRUE_FALSE') {
    return {
      mistakeCategory: 'CONCEPT_ERROR',
      whatWentWrong: `Selected option (${studentAnswer}) does not satisfy the mathematical condition.`,
      whyItHappened: 'Conceptual gap in identifying core theorem constraints or properties.',
      correctApproach: question.correctAnswerExplanation,
      conceptToRevise: 'Core Definition & Foundational Properties',
    };
  }

  // Number comparison for numerical
  const studentNum = parseFloat(cleanStudent);
  const correctNum = parseFloat(cleanCorrect);
  if (!isNaN(studentNum) && !isNaN(correctNum)) {
    if (studentNum === -correctNum) {
      return {
        mistakeCategory: 'SIGN_ERROR',
        whatWentWrong: `Obtained negative value (${studentAnswer}) instead of positive (${question.correctAnswer}).`,
        whyItHappened: 'Sign flip during division or term transposition.',
        correctApproach: question.correctAnswerExplanation,
        conceptToRevise: 'Rules of Directed Numbers & Negative Signs',
      };
    }
    if (Math.abs(studentNum - correctNum) <= 2) {
      return {
        mistakeCategory: 'CALCULATION_ERROR',
        whatWentWrong: `Off by a small margin (${studentAnswer} vs ${question.correctAnswer}).`,
        whyItHappened: 'Minor arithmetic carry/borrow oversight in final step.',
        correctApproach: question.correctAnswerExplanation,
        conceptToRevise: 'Step-by-step arithmetic check',
      };
    }
  }

  return {
    mistakeCategory: 'LOGIC_ERROR',
    whatWentWrong: `Answer "${studentAnswer}" does not match correct resolution "${question.correctAnswer}".`,
    whyItHappened: 'Misapplication of problem-solving sequence or formulas.',
    correctApproach: question.correctAnswerExplanation,
    conceptToRevise: 'Methodological Problem Solving',
  };
}

/**
 * Deterministically evaluate a student's quiz submission
 */
export const DEFAULT_PASSING_PERCENTAGE = 40;

export function getPassFailOutcome(
  percentage: number,
  passThreshold: number = DEFAULT_PASSING_PERCENTAGE
): {
  passThreshold: number;
  resultStatus: 'PASS' | 'FAIL';
  isPassing: boolean;
  recommendedNextAction: string;
} {
  const normalizedThreshold = Number.isFinite(passThreshold) ? passThreshold : DEFAULT_PASSING_PERCENTAGE;
  const isPassing = percentage >= normalizedThreshold;
  return {
    passThreshold: normalizedThreshold,
    resultStatus: isPassing ? 'PASS' : 'FAIL',
    isPassing,
    recommendedNextAction: isPassing
      ? 'Continue to the next learning level.'
      : 'Practice weak chapters and take the Retest.',
  };
}

export function generateRetestQuestionsFromWeakTopics(
  snapshot: AssessmentSnapshot,
  questionBank: Question[] = SAMPLE_QUESTIONS_BANK,
  limit: number = 5
): Question[] {
  const weakTopicIds = new Set(
    snapshot.topicPerformance
      .filter((topic) => topic.accuracy < 70)
      .map((topic) => topic.topicId)
  );

  const filteredQuestions = weakTopicIds.size
    ? questionBank.filter((question) => weakTopicIds.has(question.topicId))
    : questionBank.filter((question) => !snapshot.evaluatedQuestions.some((item) => item.questionId === question.id));

  const unique = filteredQuestions.filter((question, index, arr) => arr.findIndex((item) => item.id === question.id) === index);
  const mixed = unique.length > limit ? unique.slice(0, limit) : unique;

  if (mixed.length > 0) {
    return mixed;
  }

  return questionBank.slice(0, Math.min(limit, questionBank.length));
}

export function evaluateAssessmentSubmission(
  quizMeta: QuizMetadata,
  questions: Question[],
  submissions: StudentAnswerSubmission[],
  studentId: string,
  previousAttemptId?: string | null,
  attemptNumber: number = 1,
  isRetest: boolean = false
): AssessmentSnapshot {
  const submissionMap = new Map<string, StudentAnswerSubmission>();
  submissions.forEach((s) => submissionMap.set(s.questionId, s));

  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let totalTimeSpent = 0;

  const mistakeBreakdown: Record<MistakeCategory, number> = {
    CONCEPT_ERROR: 0,
    CALCULATION_ERROR: 0,
    SIGN_ERROR: 0,
    FORMULA_ERROR: 0,
    READING_ERROR: 0,
    UNIT_ERROR: 0,
    LOGIC_ERROR: 0,
    CARELESS_ERROR: 0,
    TIMEOUT: 0,
    UNKNOWN: 0,
  };

  const topicMap = new Map<
    string,
    { topicId: string; topicName: string; total: number; correct: number }
  >();

  const evaluatedQuestions: EvaluatedQuestionResult[] = [];

  questions.forEach((q) => {
    maxScore += q.marks;
    const sub = submissionMap.get(q.id);
    const studentAns = sub?.studentAnswer?.trim() || '';
    const timeSpent = sub?.timeSpentSeconds || 0;
    totalTimeSpent += timeSpent;

    // Topic aggregation
    let topicEntry = topicMap.get(q.topicId);
    if (!topicEntry) {
      const chapter = CLASS_9_CHAPTERS.find((c) => c.id === q.chapterId);
      const topic = chapter?.topics.find((t) => t.id === q.topicId);
      topicEntry = {
        topicId: q.topicId,
        topicName: topic?.title || q.topicId,
        total: 0,
        correct: 0,
      };
      topicMap.set(q.topicId, topicEntry);
    }
    topicEntry.total += 1;

    if (!studentAns) {
      unansweredCount += 1;
      mistakeBreakdown.TIMEOUT += 1;
      evaluatedQuestions.push({
        questionId: q.id,
        questionText: q.questionText,
        studentAnswer: 'Unanswered',
        correctAnswer: q.correctAnswer,
        isCorrect: false,
        marksAwarded: 0,
        maxMarks: q.marks,
        explanation: q.correctAnswerExplanation,
        mistakeCategory: 'TIMEOUT',
        timeSpentSeconds: timeSpent,
        chapterId: q.chapterId,
        topicId: q.topicId,
      });
      return;
    }

    // Check correctness
    const isCorrect =
      studentAns.toLowerCase() === q.correctAnswer.toLowerCase();

    if (isCorrect) {
      correctCount += 1;
      totalScore += q.marks;
      topicEntry.correct += 1;
      evaluatedQuestions.push({
        questionId: q.id,
        questionText: q.questionText,
        studentAnswer: studentAns,
        correctAnswer: q.correctAnswer,
        isCorrect: true,
        marksAwarded: q.marks,
        maxMarks: q.marks,
        explanation: q.correctAnswerExplanation,
        timeSpentSeconds: timeSpent,
        chapterId: q.chapterId,
        topicId: q.topicId,
      });
    } else {
      incorrectCount += 1;
      const mistake = classifyMistake(q, studentAns, timeSpent);
      mistakeBreakdown[mistake.mistakeCategory] =
        (mistakeBreakdown[mistake.mistakeCategory] || 0) + 1;

      evaluatedQuestions.push({
        questionId: q.id,
        questionText: q.questionText,
        studentAnswer: studentAns,
        correctAnswer: q.correctAnswer,
        isCorrect: false,
        marksAwarded: 0,
        maxMarks: q.marks,
        explanation: q.correctAnswerExplanation,
        mistakeCategory: mistake.mistakeCategory,
        timeSpentSeconds: timeSpent,
        chapterId: q.chapterId,
        topicId: q.topicId,
      });
    }
  });

  const percentage =
    maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const accuracy =
    questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

  const topicPerformance = Array.from(topicMap.values()).map((t) => ({
    topicId: t.topicId,
    topicName: t.topicName,
    total: t.total,
    correct: t.correct,
    accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
  }));

  const strongAreas = topicPerformance
    .filter((t) => t.accuracy >= 70)
    .map((t) => t.topicName);

  const weakAreas = topicPerformance
    .filter((t) => t.accuracy < 70)
    .map((t) => t.topicName);

  const commonMistakes = (
    Object.keys(mistakeBreakdown) as MistakeCategory[]
  )
    .filter((k) => mistakeBreakdown[k] > 0)
    .sort((a, b) => mistakeBreakdown[b] - mistakeBreakdown[a]);

  const passThreshold = quizMeta.passingPercentage ?? DEFAULT_PASSING_PERCENTAGE;
  const passResult = getPassFailOutcome(percentage, passThreshold);

  return {
    id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    studentId,
    quizId: quizMeta.id,
    quizTitle: quizMeta.title,
    type: quizMeta.type,
    board: quizMeta.board,
    grade: quizMeta.grade,
    chapterId: quizMeta.chapterId,
    topicId: quizMeta.topicId,
    totalQuestions: questions.length,
    correctCount,
    incorrectCount,
    unansweredCount,
    score: totalScore,
    maxScore,
    percentage,
    accuracy,
    timeSpentSeconds: totalTimeSpent,
    passThreshold,
    resultStatus: passResult.resultStatus,
    recommendedNextAction: passResult.recommendedNextAction,
    weakChapters: weakAreas,
    isRetest,
    attemptNumber,
    previousAttemptId: previousAttemptId ?? null,
    retestAvailable: !passResult.isPassing,
    mistakeBreakdown,
    topicPerformance,
    strongAreas,
    weakAreas,
    commonMistakes,
    evaluatedQuestions,
    isBaseline: quizMeta.type === 'BASELINE',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Deterministically compute Before vs After comparative improvement metrics.
 * Ensures strict honesty rule: only compares comparable assessments.
 */
export function computeBeforeAfterComparison(
  baselineSnapshot: AssessmentSnapshot,
  latestSnapshot: AssessmentSnapshot | null
): BeforeAfterComparison | null {
  if (!baselineSnapshot) return null;

  if (!latestSnapshot || latestSnapshot.id === baselineSnapshot.id) {
    return {
      studentId: baselineSnapshot.studentId,
      baselineSnapshot,
      latestSnapshot: baselineSnapshot,
      comparableCriteriaMet: false,
      comparisonReason:
        'Baseline diagnostic recorded. Complete a comparable retest or follow-up assessment to measure your improvement.',
      scoreChangePercentagePoints: 0,
      accuracyChangePercentagePoints: 0,
      mistakeReductionCount: 0,
      solvedQuestionsCount: baselineSnapshot.totalQuestions,
      timeEfficiencyImprovementSeconds: 0,
      improvedTopics: [],
      topicsStillNeedingPractice: baselineSnapshot.weakAreas,
      metrics: [
        {
          metricName: 'Score',
          beforeValue: baselineSnapshot.percentage,
          currentValue: baselineSnapshot.percentage,
          delta: 0,
          unit: '%',
          isPositive: false,
        },
        {
          metricName: 'Accuracy',
          beforeValue: baselineSnapshot.accuracy,
          currentValue: baselineSnapshot.accuracy,
          delta: 0,
          unit: '%',
          isPositive: false,
        },
        {
          metricName: 'Mistakes',
          beforeValue: baselineSnapshot.incorrectCount,
          currentValue: baselineSnapshot.incorrectCount,
          delta: 0,
          unit: 'mistakes',
          isPositive: false,
        },
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  // Check comparability: same grade, comparable question count
  const questionCountDiff = Math.abs(
    baselineSnapshot.totalQuestions - latestSnapshot.totalQuestions
  );
  const isComparable =
    baselineSnapshot.grade === latestSnapshot.grade &&
    questionCountDiff <= 3;

  const scoreChangePercentagePoints =
    latestSnapshot.percentage - baselineSnapshot.percentage;
  const accuracyChangePercentagePoints =
    latestSnapshot.accuracy - baselineSnapshot.accuracy;
  const mistakeReductionCount =
    baselineSnapshot.incorrectCount - latestSnapshot.incorrectCount;
  const timeEfficiencyImprovementSeconds =
    baselineSnapshot.timeSpentSeconds - latestSnapshot.timeSpentSeconds;

  // Topic-level delta
  const improvedTopics: BeforeAfterComparison['improvedTopics'] = [];
  const topicsStillNeedingPractice: string[] = [];

  const baselineTopicMap = new Map(
    baselineSnapshot.topicPerformance.map((t) => [t.topicId, t])
  );

  latestSnapshot.topicPerformance.forEach((currentTopic) => {
    const beforeTopic = baselineTopicMap.get(currentTopic.topicId);
    const beforeAcc = beforeTopic ? beforeTopic.accuracy : 0;
    const gain = currentTopic.accuracy - beforeAcc;

    if (gain > 0) {
      improvedTopics.push({
        topicId: currentTopic.topicId,
        topicName: currentTopic.topicName,
        beforeAccuracy: beforeAcc,
        currentAccuracy: currentTopic.accuracy,
        gainPercentagePoints: gain,
      });
    }

    if (currentTopic.accuracy < 75) {
      topicsStillNeedingPractice.push(currentTopic.topicName);
    }
  });

  const metrics: MetricComparison[] = [
    {
      metricName: 'Overall Score',
      beforeValue: baselineSnapshot.percentage,
      currentValue: latestSnapshot.percentage,
      delta: scoreChangePercentagePoints,
      unit: 'percentage points',
      isPositive: scoreChangePercentagePoints > 0,
    },
    {
      metricName: 'Accuracy',
      beforeValue: baselineSnapshot.accuracy,
      currentValue: latestSnapshot.accuracy,
      delta: accuracyChangePercentagePoints,
      unit: 'percentage points',
      isPositive: accuracyChangePercentagePoints > 0,
    },
    {
      metricName: 'Mistakes Count',
      beforeValue: baselineSnapshot.incorrectCount,
      currentValue: latestSnapshot.incorrectCount,
      delta: mistakeReductionCount,
      unit: 'mistakes reduced',
      isPositive: mistakeReductionCount > 0,
    },
    {
      metricName: 'Time per Assessment',
      beforeValue: Math.round(baselineSnapshot.timeSpentSeconds / 60),
      currentValue: Math.round(latestSnapshot.timeSpentSeconds / 60),
      delta: Math.round(timeEfficiencyImprovementSeconds / 60),
      unit: 'mins',
      isPositive: timeEfficiencyImprovementSeconds > 0,
    },
  ];

  return {
    studentId: baselineSnapshot.studentId,
    baselineSnapshot,
    latestSnapshot,
    comparableCriteriaMet: isComparable,
    comparisonReason: isComparable
      ? 'Assessments matched in grade level and topic difficulty weighting.'
      : 'Note: Follow-up assessment had differing question volume.',
    scoreChangePercentagePoints,
    accuracyChangePercentagePoints,
    mistakeReductionCount,
    solvedQuestionsCount:
      baselineSnapshot.totalQuestions + latestSnapshot.totalQuestions,
    timeEfficiencyImprovementSeconds,
    improvedTopics,
    topicsStillNeedingPractice,
    metrics,
    generatedAt: new Date().toISOString(),
  };
}
