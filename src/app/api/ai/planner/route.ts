import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/session';
import { CLASS_9_CHAPTERS } from '@/lib/curriculum-data';
import { groqJson } from '@/lib/groq';
import { withAiAudit } from '@/lib/ai-audit';

async function handleGeneratePlan(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSessionFromRequest();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users JOIN student_profiles ON users.id = student_profiles.uid WHERE users.id = ?').get(session.userId) as any;
    
    if (!user || user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Student access required.' }, { status: 403 });
    }

    const { board, class_name, medium } = user;
    const curriculum = CLASS_9_CHAPTERS.filter(c => c.board === board);

    if (curriculum.length === 0) {
       return NextResponse.json({ error: 'No curriculum found for your board.' }, { status: 400 });
    }

    const snapshots = db.prepare('SELECT snapshot_json FROM assessment_snapshots WHERE student_id = ? ORDER BY created_at DESC LIMIT 5').all(session.userId) as any[];

    let weakAreas: string[] = [];
    if (snapshots.length > 0) {
       try {
           const latest = JSON.parse(snapshots[0].snapshot_json);
           if (latest.weakAreas && Array.isArray(latest.weakAreas)) {
               weakAreas = latest.weakAreas;
           }
       } catch {}
    }

    const prompt = `You are the EduMathAI Study Planner.
Create a daily study plan for a ${class_name} student studying in ${board} board (${medium} medium).
Their known weak areas are: ${weakAreas.length > 0 ? weakAreas.join(', ') : 'None recorded yet. Start with basics.'}.

Here is the valid curriculum they must follow:
${curriculum.map(c => `Chapter: ${c.title} (ID: ${c.id}) - Topics: ${c.topics.map(t => t.title + ' (ID: ' + t.id + ')').join(', ')}`).join('\n')}

Create a study plan for today with 1 to 3 activities. 
For each activity, you MUST use an exact Chapter ID and Topic ID from the provided curriculum list above. Do NOT invent chapters or topics.

Return valid JSON in this exact structure:
{
  "date": "Today's Date",
  "goal": "A short motivational daily goal",
  "estimatedMinutes": 60,
  "activities": [
    {
      "type": "LEARN" | "PRACTICE" | "REVISION",
      "chapterId": "...",
      "topicId": "...",
      "chapterTitle": "...",
      "topicTitle": "...",
      "minutes": 20
    }
  ]
}
`;

    const result = await groqJson<any>([{ role: 'user', content: prompt }]);

    const validPlan = {
      date: result.date || new Date().toLocaleDateString(),
      goal: result.goal || 'Keep practicing!',
      estimatedMinutes: result.estimatedMinutes || 60,
      activities: [] as any[]
    };

    if (Array.isArray(result.activities)) {
      for (const act of result.activities) {
         const validChapter = curriculum.find(c => c.id === act.chapterId || c.title === act.chapterTitle);
         if (validChapter) {
            const validTopic = validChapter.topics.find(t => t.id === act.topicId || t.title === act.topicTitle) || validChapter.topics[0];
            validPlan.activities.push({
               type: ['LEARN', 'PRACTICE', 'REVISION'].includes(act.type) ? act.type : 'LEARN',
               chapterId: validChapter.id,
               topicId: validTopic.id,
               chapterTitle: validChapter.title,
               topicTitle: validTopic.title,
               minutes: typeof act.minutes === 'number' ? act.minutes : 20
            });
         }
      }
    }

    if (validPlan.activities.length === 0) {
      validPlan.activities.push({
         type: 'LEARN',
         chapterId: curriculum[0].id,
         topicId: curriculum[0].topics[0].id,
         chapterTitle: curriculum[0].title,
         topicTitle: curriculum[0].topics[0].title,
         minutes: 30
      });
    }

    const planDate = new Date().toISOString().split('T')[0];
    
    const existing = db.prepare('SELECT id FROM study_plans WHERE student_id = ? AND plan_date = ?').get(session.userId, planDate) as any;
    
    if (existing) {
       db.prepare('UPDATE study_plans SET plan_json = ? WHERE id = ?').run(JSON.stringify(validPlan), existing.id);
    } else {
       const id = 'plan-' + Date.now();
       db.prepare('INSERT INTO study_plans (id, student_id, plan_date, plan_json) VALUES (?, ?, ?, ?)').run(id, session.userId, planDate, JSON.stringify(validPlan));
    }

    return NextResponse.json({ plan: validPlan });
  } catch (error: any) {
    console.error('Study Planner Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate study plan.' }, { status: 500 });
  }
}

/**
 * Audited entry point: identical behaviour, plus one metadata-only row in
 * ai_audit_logs for the Admin AI Moderation dashboard.
 */
export async function POST(req: NextRequest) {
  return withAiAudit('AI_STUDY_PLANNER', () => handleGeneratePlan(req));
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const db = getDb();
    const planDate = new Date().toISOString().split('T')[0];
    const existing = db.prepare('SELECT plan_json FROM study_plans WHERE student_id = ? AND plan_date = ?').get(session.userId, planDate) as any;
    
    if (existing) {
      return NextResponse.json({ plan: JSON.parse(existing.plan_json) });
    }
    return NextResponse.json({ plan: null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch study plan.' }, { status: 500 });
  }
}
