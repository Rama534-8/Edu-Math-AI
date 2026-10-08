/**
 * Verifies the school / class / section provisioning layer and the database
 * relationships the Teacher and School Admin modules depend on.
 *
 * Runs standalone because `src/lib/db/index.ts` deliberately avoids the "@/"
 * alias, so no bundler or resolve hook is required:
 *
 *   node --experimental-strip-types scripts/verify-school.mts
 */
const { getDb } = await import('../src/lib/db/index.ts');
const { backfillSchoolMembership, needsSchoolBackfill } = await import('../src/lib/school.ts');

const db = getDb();
let failures = 0;

function check(label: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

const one = (sql: string, ...params: unknown[]) =>
  db.prepare(sql).get(...params) as Record<string, number>;

// --- Repair anything left over from before school assignment existed ----------
if (needsSchoolBackfill(db)) {
  console.log('Repairing school membership...\n');
  backfillSchoolMembership(db);
}

// --- Structural integrity -----------------------------------------------------
const schools = one('SELECT COUNT(*) AS c FROM schools').c;
const classes = one('SELECT COUNT(*) AS c FROM classes').c;
const sections = one('SELECT COUNT(*) AS c FROM sections').c;

check('schools exist', schools > 0, `${schools}`);
check('every class belongs to a school',
  one('SELECT COUNT(*) AS c FROM classes WHERE school_id IS NULL OR school_id NOT IN (SELECT id FROM schools)').c === 0);
check('every section belongs to a class',
  one('SELECT COUNT(*) AS c FROM sections WHERE class_id IS NULL OR class_id NOT IN (SELECT id FROM classes)').c === 0);
check('classes have sections', classes === 0 || sections > 0, `${sections} sections`);

// --- Account scoping ----------------------------------------------------------
const unscoped = one("SELECT COUNT(*) AS c FROM users WHERE school_id IS NULL AND role <> 'PLATFORM_ADMIN'").c;
check('every non-platform account has a school', unscoped === 0, `${unscoped} unscoped`);

check('student profiles resolve to a user',
  one('SELECT COUNT(*) AS c FROM student_profiles sp LEFT JOIN users u ON u.id = sp.uid WHERE u.id IS NULL').c === 0);
check('teacher profiles resolve to a user',
  one('SELECT COUNT(*) AS c FROM teacher_profiles tp LEFT JOIN users u ON u.id = tp.uid WHERE u.id IS NULL').c === 0);

// --- Relationships ------------------------------------------------------------
const enrollments = one('SELECT COUNT(*) AS c FROM student_enrollments').c;
const teacherAssignments = one('SELECT COUNT(*) AS c FROM teacher_assignments').c;
const parentLinks = one('SELECT COUNT(*) AS c FROM parent_student_links').c;

check('student enrollments reference valid students',
  one('SELECT COUNT(*) AS c FROM student_enrollments se LEFT JOIN users u ON u.id = se.student_id WHERE u.id IS NULL OR u.role <> \'STUDENT\'').c === 0,
  `${enrollments} enrollments`);
check('teacher assignments reference valid teachers',
  one('SELECT COUNT(*) AS c FROM teacher_assignments ta LEFT JOIN users u ON u.id = ta.teacher_id WHERE u.id IS NULL OR u.role <> \'TEACHER\'').c === 0,
  `${teacherAssignments} assignments`);

// --- Parent / student links (must never be broken) ---------------------------
check('parent-student links reference real users',
  one(`SELECT COUNT(*) AS c FROM parent_student_links l
       LEFT JOIN users p ON p.id = l.parent_user_id
       LEFT JOIN users s ON s.id = l.student_user_id
       WHERE p.id IS NULL OR s.id IS NULL OR p.role <> 'PARENT' OR s.role <> 'STUDENT'`).c === 0,
  `${parentLinks} links`);

// --- Idempotency --------------------------------------------------------------
const again = backfillSchoolMembership(db, { assignTeachers: true });
check('backfill is idempotent',
  again.schoolsCreated === 0 && again.classesCreated === 0 &&
  again.sectionsCreated === 0 && again.enrollmentsCreated === 0 && again.usersAssigned === 0,
  JSON.stringify(again));

console.log(`\n${failures === 0 ? 'All school/database checks passed.' : `${failures} check(s) FAILED.`}`);
process.exit(failures === 0 ? 0 : 1);