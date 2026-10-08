import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRoles, teacherCanAccessStudent } from '@/lib/authz';

const VALID_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;
type AttendanceStatus = (typeof VALID_STATUSES)[number];

function isValidStatus(value: unknown): value is AttendanceStatus {
  return typeof value === 'string' && (VALID_STATUSES as readonly string[]).includes(value);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SectionOption {
  sectionId: string;
  sectionName: string;
  className: string;
}

/** Sections the signed-in teacher is assigned to (or every section for admins). */
function listSections(userId: string, role: string, schoolId: string | null): SectionOption[] {
  const db = getDb();
  if (role === 'TEACHER') {
    return db
      .prepare(
        `SELECT s.id AS sectionId, s.name AS sectionName, c.name AS className
         FROM teacher_assignments ta
         JOIN sections s ON s.id = ta.section_id
         JOIN classes c ON c.id = s.class_id
         WHERE ta.teacher_id = ?
         ORDER BY c.name, s.name`
      )
      .all(userId) as SectionOption[];
  }
  if (schoolId) {
    return db
      .prepare(
        `SELECT s.id AS sectionId, s.name AS sectionName, c.name AS className
         FROM sections s JOIN classes c ON c.id = s.class_id
         WHERE c.school_id = ? ORDER BY c.name, s.name`
      )
      .all(schoolId) as SectionOption[];
  }
  return db
    .prepare(
      `SELECT s.id AS sectionId, s.name AS sectionName, c.name AS className
       FROM sections s JOIN classes c ON c.id = s.class_id ORDER BY c.name, s.name`
    )
    .all() as SectionOption[];
}
/**
 * Teacher attendance register.
 *
 * GET  ?sectionId=&date=  -> roster with the status already recorded for that day
 * PUT                      -> { sectionId, date, records: [{ studentId, status, remarks }] }
 *
 * Authorization: a teacher may only touch sections they are assigned to and
 * students enrolled in them.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRoles(['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;
    const db = getDb();

    const url = new URL(req.url);
    const sectionId = url.searchParams.get('sectionId') ?? '';
    const date = url.searchParams.get('date') ?? today();

    const sections = listSections(auth.actor.userId, auth.actor.role, auth.actor.schoolId);
    if (sections.length === 0) {
      return NextResponse.json({ sections: [], sectionId: null, date, roster: [] });
    }

    const allowedIds = new Set(sections.map((section) => section.sectionId));
    const target = sectionId && allowedIds.has(sectionId) ? sectionId : sections[0].sectionId;

    const roster = db
      .prepare(
        `SELECT se.student_id AS studentId,
                COALESCE(sp.display_name, u.email) AS studentName,
                sp.student_code AS studentCode,
                a.status, a.remarks, a.updated_at AS updatedAt
         FROM student_enrollments se
         JOIN users u ON u.id = se.student_id AND u.role = 'STUDENT'
         LEFT JOIN student_profiles sp ON sp.uid = se.student_id
         LEFT JOIN attendance a
           ON a.student_id = se.student_id AND a.section_id = se.section_id AND a.attendance_date = ?
         WHERE se.section_id = ?
         ORDER BY sp.display_name COLLATE NOCASE`
      )
      .all(date, target) as Record<string, unknown>[];

    return NextResponse.json({ sections, sectionId: target, date, roster });
  } catch (error) {
    console.error('[Teacher Attendance API] Error:', error);
    return NextResponse.json({ error: 'Failed to load attendance.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireRoles(['TEACHER', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN']);
    if ('error' in auth) return auth.error;

    const body = (await req.json()) as {
      sectionId?: string;
      date?: string;
      records?: { studentId?: string; status?: string; remarks?: string | null }[];
    };

    const sectionId = body.sectionId ?? '';
    const date = body.date ?? today();
    const records = Array.isArray(body.records) ? body.records : [];

    if (!sectionId) {
      return NextResponse.json({ error: 'sectionId is required.' }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'date must be YYYY-MM-DD.' }, { status: 400 });
    }
    if (records.length === 0) {
      return NextResponse.json({ error: 'records is required.' }, { status: 400 });
    }
    if (records.some((record) => !isValidStatus(record.status))) {
      return NextResponse.json(
        { error: `status must be one of ${VALID_STATUSES.join(', ')}.` },
        { status: 400 }
      );
    }

    const sections = listSections(auth.actor.userId, auth.actor.role, auth.actor.schoolId);
    if (!sections.some((section) => section.sectionId === sectionId)) {
      return NextResponse.json({ error: 'You are not assigned to this section.' }, { status: 403 });
    }
    if (auth.actor.role === 'TEACHER') {
      const unauthorized = records.find(
        (record) =>
          typeof record.studentId === 'string' &&
          record.studentId.length > 0 &&
          !teacherCanAccessStudent(auth.actor.userId, record.studentId)
      );
      if (unauthorized) {
        return NextResponse.json(
          { error: 'One or more students are outside your assigned sections.' },
          { status: 403 }
        );
      }
    }

    const db = getDb();
    const upsert = db.prepare(
      `INSERT INTO attendance (id, student_id, section_id, attendance_date, status, remarks, marked_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(student_id, attendance_date) DO UPDATE SET
         status = excluded.status,
         remarks = excluded.remarks,
         marked_by = excluded.marked_by,
         section_id = excluded.section_id,
         updated_at = datetime('now')`
    );

    let saved = 0;
    const apply = db.transaction(() => {
      for (const record of records) {
        if (typeof record.studentId !== 'string' || !record.studentId) continue;
        upsert.run(
          `att-${record.studentId}-${date}`,
          record.studentId,
          sectionId,
          date,
          record.status as AttendanceStatus,
          record.remarks?.trim() || null,
          auth.actor.userId
        );
        saved += 1;
      }
    });
    apply();

    return NextResponse.json({ success: true, saved, sectionId, date });
  } catch (error) {
    console.error('[Teacher Attendance API] Error:', error);
    return NextResponse.json({ error: 'Failed to save attendance.' }, { status: 500 });
  }
}