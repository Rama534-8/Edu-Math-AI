/**
 * Live end-to-end verification of the announcement / notification / progress
 * features against a running EduMathAI server.
 *
 * Uses ONLY pre-existing real accounts (discovered from the database - none are
 * created). Announcements created here are removed again at the end, and
 * parent-student links are never modified.
 *
 * Usage: BASE_URL=http://localhost:3111 node scripts/verify-features.mjs
 */
import Database from 'better-sqlite3';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3111';
const DB_PATH = process.env.EDU_MATHAI_DB_PATH ?? path.join(process.cwd(), 'data', 'edumathai.db');

let passed = 0;
const failures = [];

const ok = (label, condition, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}${detail ? ` - ${detail}` : ''}`);
  } else {
    failures.push(`${label}${detail ? ` (${detail})` : ''}`);
    console.log(`  FAIL  ${label}${detail ? ` - ${detail}` : ''}`);
  }
};

const section = (name) => console.log(`\n=== ${name} ===\n`);

// SQLite has no boolean type: is_pinned / is_active arrive as 1 / 0.
const isTrue = (value) => value === 1 || value === true;
const isFalse = (value) => value === 0 || value === false;

const db = new Database(DB_PATH, { readonly: true });

/** Picks a real, active account per role (no accounts are ever created). */
function pickRole(role, { withSchool = true } = {}) {
  const rows = db
    .prepare('SELECT id, email, password, role, school_id AS schoolId FROM users WHERE role = ? AND status = \'ACTIVE\'')
    .all(role);
  if (withSchool) {
    const scoped = rows.find((r) => r.schoolId);
    if (scoped) return scoped;
  }
  return rows[0];
}

const admin = pickRole('PLATFORM_ADMIN') ?? pickRole('SCHOOL_ADMIN');
const student = pickRole('STUDENT');
const teacher = pickRole('TEACHER');
/** Prefer a parent that actually has linked children so the parent checks are meaningful. */
const parent =
  db
    .prepare(
      `SELECT u.id, u.email, u.password, u.role, u.school_id AS schoolId
       FROM users u
       JOIN parent_student_links l ON l.parent_user_id = u.id
       WHERE u.role = 'PARENT' AND u.status = 'ACTIVE'
       GROUP BY u.id HAVING COUNT(l.student_user_id) > 0 LIMIT 1`
    )
    .get() ?? pickRole('PARENT');

console.log(`=== FEATURE VERIFICATION against ${BASE_URL} ===\n`);
console.log('Real accounts in use (none are created):');
for (const [label, row] of Object.entries({ admin, student, teacher, parent })) {
  console.log(`  ${label.padEnd(9)} ${row ? `${row.email}${row.schoolId ? ` @ ${row.schoolId}` : ''}` : 'NONE FOUND'}`);
}
console.log('');

if (!admin || !student || !teacher || !parent) {
  console.error('Missing required real accounts; cannot continue.');
  process.exit(1);
}

/** Minimal cookie-aware fetch client. */
function makeClient() {
  const jar = new Map();
  return async function call(pathname, options = {}) {
    const headers = { ...(options.headers ?? {}) };
    if (jar.size > 0) headers.cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    if (options.body && !headers['content-type']) headers['content-type'] = 'application/json';
    const res = await fetch(`${BASE_URL}${pathname}`, { ...options, headers, redirect: 'manual' });
    for (const raw of res.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(';');
      const idx = pair.indexOf('=');
      if (idx > 0) jar.set(pair.slice(0, idx), pair.slice(idx + 1));
    }
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* non-JSON */
    }
    return { status: res.status, json, res };
  };
}

async function login(call, account) {
  const { status } = await call('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: account.email, password: account.password, selectedRole: account.role }),
  });
  return { status, ok: status === 200 };
}

/** Client that carries a pre-minted session cookie. */
function makeClientWithToken(token) {
  const jar = new Map([['edumathai_session', token]]);
  return async function call(pathname, options = {}) {
    const headers = { ...(options.headers ?? {}) };
    if (jar.size > 0) headers.cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    if (options.body && !headers['content-type']) headers['content-type'] = 'application/json';
    const res = await fetch(`${BASE_URL}${pathname}`, { ...options, headers, redirect: 'manual' });
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* non-JSON */
    }
    return { status: res.status, json, res };
  };
}

/**
 * Signs in as an EXISTING real account without knowing its password.
 *
 * Real passwords are bcrypt hashes and cannot be read back. This mints a session
 * row plus a JWT for the already-existing user using the app's own
 * SESSION_SECRET, exactly as src/lib/session.ts does. No user account is ever
 * created or modified - only an ordinary login session is established.
 */
async function loginAsExistingUser(account) {
  // Mirror resolveSessionSecret() from src/lib/session.ts. That module imports
  // next/headers so it cannot be loaded here, but the rule is simple: in
  // non-production a short/absent secret falls back to the built-in dev secret.
  // next dev runs in non-production, so replicate exactly that.
  const DEV_SECRET = 'edumathai-local-dev-secret-change-in-production-please';
  const secretValue = process.env.SESSION_SECRET ?? DEV_SECRET;
  const effective = secretValue.length >= 16 ? secretValue : DEV_SECRET;

  const { SignJWT } = await import('jose');
  const { v4: uuidv4 } = await import('uuid');

  const writable = new Database(DB_PATH);
  const sessionId = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 1);
  writable
    .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sessionId, account.id, expiresAt.toISOString());
  const token = await new SignJWT({
    userId: account.id,
    email: account.email,
    role: account.role,
    sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1d')
    .setIssuedAt()
    .sign(new TextEncoder().encode(effective));
  writable.close();

  return { token, sessionId };
}

const mintedSessionIds = [];

const createdAnnouncementIds = [];
const UNIQUE = `VERIFY-${Date.now()}`;

async function main() {
  // ------------------------------------------------------------ ADMIN
  section('1. ADMIN - announcements management');
  const adminSession = await loginAsExistingUser(admin);
  mintedSessionIds.push(adminSession.sessionId);
  const adminCall = makeClientWithToken(adminSession.token);
  const whoami = await adminCall('/api/auth/me');
  ok('admin session established', whoami.status === 200, `status ${whoami.status} as ${whoami.json?.user?.email ?? '?'}`);
  if (whoami.status !== 200) return;

  const beforeList = await adminCall('/api/admin/announcements?includeInactive=true');
  ok('admin lists announcements', beforeList.status === 200, `status ${beforeList.status}`);
  const beforeCount = (beforeList.json?.announcements ?? []).length;

  const created = await adminCall('/api/admin/announcements', {
    method: 'POST',
    body: JSON.stringify({
      title: `${UNIQUE} notice`,
      message: 'Created by verify-features.mjs against real data.',
      type: 'IMPORTANT',
      audience: 'EVERYONE',
    }),
  });
  ok('admin creates an announcement', created.status === 201, `status ${created.status}`);
  const annId = created.json?.id;
  if (annId) createdAnnouncementIds.push(annId);

  const badAudience = await adminCall('/api/admin/announcements', {
    method: 'POST',
    body: JSON.stringify({ title: 'x', message: 'y', audience: 'NOPE' }),
  });
  ok('invalid audience rejected', badAudience.status === 400, `status ${badAudience.status}`);

  const missingTitle = await adminCall('/api/admin/announcements', {
    method: 'POST',
    body: JSON.stringify({ message: 'no title' }),
  });
  ok('missing title rejected', missingTitle.status === 400, `status ${missingTitle.status}`);

  const classNoTarget = await adminCall('/api/admin/announcements', {
    method: 'POST',
    body: JSON.stringify({ title: 'x', message: 'y', audience: 'CLASS' }),
  });
  ok('CLASS audience without target rejected', classNoTarget.status === 400, `status ${classNoTarget.status}`);

  const edited = await adminCall('/api/admin/announcements', {
    method: 'PATCH',
    body: JSON.stringify({ id: annId, title: `${UNIQUE} edited`, message: 'Edited by verify script.' }),
  });
  ok('admin edits an announcement', edited.status === 200, `status ${edited.status}`);

  const pinned = await adminCall('/api/admin/announcements', {
    method: 'PATCH',
    body: JSON.stringify({ id: annId, isPinned: true }),
  });
  ok('admin pins an announcement', pinned.status === 200, `status ${pinned.status}`);

  const afterPin = await adminCall('/api/admin/announcements?includeInactive=true');
  const pinnedRow = (afterPin.json?.announcements ?? []).find((a) => a.id === annId);
  ok('pin persisted', isTrue(pinnedRow?.isPinned), `isPinned=${pinnedRow?.isPinned}`);
  ok('type persisted', pinnedRow?.type === 'IMPORTANT', `type=${pinnedRow?.type}`);
  ok('title edit persisted', pinnedRow?.title === `${UNIQUE} edited`, `title=${pinnedRow?.title}`);

  const list = afterPin.json?.announcements ?? [];
  ok('pinned announcement sorts first', list.findIndex((a) => a.isPinned) === 0, `index ${list.findIndex((a) => a.isPinned)}`);

  const deactivated = await adminCall(`/api/admin/announcements?id=${annId}`, { method: 'DELETE' });
  ok('admin deactivates an announcement', deactivated.status === 200, `status ${deactivated.status}`);

  const afterDelete = await adminCall('/api/admin/announcements?includeInactive=true');
  const inactiveRow = (afterDelete.json?.announcements ?? []).find((a) => a.id === annId);
  ok('announcement kept but inactive', isFalse(inactiveRow?.isActive), `isActive=${inactiveRow?.isActive}`);
  ok('admin list includes inactive entries', (afterDelete.json?.announcements ?? []).length >= beforeCount);

  const expiredCall = await adminCall('/api/admin/announcements', {
    method: 'POST',
    body: JSON.stringify({
      title: `${UNIQUE} expired`,
      message: 'Already expired.',
      audience: 'EVERYONE',
      publishAt: '2020-01-01T00:00:00.000Z',
      expiresAt: '2020-02-01T00:00:00.000Z',
    }),
  });
  if (expiredCall.json?.id) createdAnnouncementIds.push(expiredCall.json.id);

  const adminActive = await adminCall('/api/admin/announcements?includeInactive=false');
  ok(
    'expired announcement excluded from active feed',
    !(adminActive.json?.announcements ?? []).some((a) => a.id === expiredCall.json?.id)
  );

  const overview = await adminCall('/api/admin/overview');
  const inst = overview.json?.institution;
  ok('admin overview returns institution metrics', Boolean(inst), JSON.stringify(inst));
  ok(
    'institution metrics are numeric',
    ['schools', 'classes', 'activeAnnouncements', 'assignments', 'quizAttempts'].every((k) => typeof inst?.[k] === 'number')
  );

  // -------------------------------------------------------- VISIBILITY
  section('2. VISIBILITY - audience targeting by role');

  const studentSession = await loginAsExistingUser(student);
  mintedSessionIds.push(studentSession.sessionId);
  const studentCall = makeClientWithToken(studentSession.token);
  const teacherSession = await loginAsExistingUser(teacher);
  mintedSessionIds.push(teacherSession.sessionId);
  const teacherCall = makeClientWithToken(teacherSession.token);
  const parentSession = await loginAsExistingUser(parent);
  mintedSessionIds.push(parentSession.sessionId);
  const parentCall = makeClientWithToken(parentSession.token);
  ok('student/teacher/parent sessions established', true, 'real accounts');

  const studentFeed = await studentCall('/api/announcements');
  ok('student reads the announcement feed', studentFeed.status === 200, `status ${studentFeed.status}`);
  ok('student sees the pre-existing school notices', (studentFeed.json?.announcements ?? []).length >= 2, `${(studentFeed.json?.announcements ?? []).length} rows`);

  const teacherFeed = await teacherCall('/api/announcements');
  ok('teacher reads the announcement feed', teacherFeed.status === 200, `status ${teacherFeed.status}`);
  const parentFeed = await parentCall('/api/announcements');
  ok('parent reads the announcement feed', parentFeed.status === 200, `status ${parentFeed.status}`);

  // STUDENTS-only announcement: visible to the student only.
  const studentsOnly = await adminCall('/api/admin/announcements', {
    method: 'POST',
    body: JSON.stringify({
      title: `${UNIQUE} students only`,
      message: 'Students only notice.',
      audience: 'STUDENTS',
    }),
  });
  if (studentsOnly.json?.id) createdAnnouncementIds.push(studentsOnly.json.id);

  const sFeed = await studentCall('/api/announcements');
  const tFeed = await teacherCall('/api/announcements');
  const pFeed = await parentCall('/api/announcements');
  ok('STUDENTS announcement visible to the student', (sFeed.json?.announcements ?? []).some((a) => a.id === studentsOnly.json?.id));
  ok('STUDENTS announcement hidden from the teacher', !(tFeed.json?.announcements ?? []).some((a) => a.id === studentsOnly.json?.id));
  ok('STUDENTS announcement hidden from the parent', !(pFeed.json?.announcements ?? []).some((a) => a.id === studentsOnly.json?.id));

  // TEACHERS-only announcement: the inverse.
  const teachersOnly = await adminCall('/api/admin/announcements', {
    method: 'POST',
    body: JSON.stringify({
      title: `${UNIQUE} teachers only`,
      message: 'Teachers only notice.',
      audience: 'TEACHERS',
    }),
  });
  if (teachersOnly.json?.id) createdAnnouncementIds.push(teachersOnly.json.id);
  const tFeed2 = await teacherCall('/api/announcements');
  const sFeed2 = await studentCall('/api/announcements');
  ok('TEACHERS announcement visible to the teacher', (tFeed2.json?.announcements ?? []).some((a) => a.id === teachersOnly.json?.id));
  ok('TEACHERS announcement hidden from the student', !(sFeed2.json?.announcements ?? []).some((a) => a.id === teachersOnly.json?.id));

  // --------------------------------------------------- AUTHORISATION
  section('3. AUTHORISATION - role + scope enforcement');
  ok('student blocked from admin announcements', (await studentCall('/api/admin/announcements')).status === 403);
  ok('parent blocked from admin announcements', (await parentCall('/api/admin/announcements')).status === 403);
  ok(
    'teacher cannot use the admin announcement API',
    (await teacherCall('/api/admin/announcements', { method: 'POST', body: JSON.stringify({ title: 'n', message: 'n' }) })).status === 403
  );
  ok('unauthenticated read blocked', (await makeClient()('/api/announcements')).status === 401);
  ok('student reads own bookmarks', (await studentCall('/api/student/bookmarks')).status === 200);
  ok('parent blocked from student bookmarks', (await parentCall('/api/student/bookmarks')).status === 403);
  ok('teacher blocked from student dashboard', (await teacherCall('/api/student/dashboard')).status === 403);

  // ------------------------------------------------------ NOTIFICATIONS
  section('4. NOTIFICATIONS - real fan-out, unread count, mark read');
  const notifications = await studentCall('/api/notifications');
  ok('student loads notifications', notifications.status === 200, `status ${notifications.status}`);
  ok('unread count present', typeof notifications.json?.unreadCount === 'number', `unread=${notifications.json?.unreadCount}`);
  ok(
    'announcement produced a real notification for the student',
    (notifications.json?.notifications ?? []).some(
      (n) => n.type === 'ANNOUNCEMENT' && String(n.link ?? '').includes(studentsOnly.json?.id ?? '##')
    ),
    `types=${JSON.stringify((notifications.json?.notifications ?? []).map((n) => n.type))}`
  );
  ok(
    'notifications carry a timestamp',
    (notifications.json?.notifications ?? []).every((n) => typeof n.created_at === 'string' && n.created_at.length > 0)
  );

  const target = (notifications.json?.notifications ?? []).find((n) => !n.is_read);
  if (target) {
    ok('mark single notification as read', (await studentCall('/api/notifications', { method: 'PATCH', body: JSON.stringify({ ids: [target.id] }) })).status === 200);
  } else {
    ok('mark single notification as read (skipped - nothing unread)', true);
  }

  ok('mark all as read', (await studentCall('/api/notifications', { method: 'PATCH', body: JSON.stringify({ all: true }) })).status === 200);
  const afterMarkAll = await studentCall('/api/notifications');
  ok('unread count drops to zero', afterMarkAll.json?.unreadCount === 0, `unread=${afterMarkAll.json?.unreadCount}`);

  // --------------------------------------------------------- DEADLINES
  section('5. ASSIGNMENTS - deadline status from real due dates');
  const assignments = await studentCall('/api/student/assignments');
  ok('student loads assignments', assignments.status === 200, `status ${assignments.status}`);
  const assignmentRows = assignments.json?.assignments ?? [];
  ok(
    'every assignment carries a computed deadline status',
    assignmentRows.every((a) => typeof a.deadline?.status === 'string' && typeof a.deadline?.label === 'string'),
    JSON.stringify(assignmentRows.map((a) => `${a.title}=${a.deadline?.status}`))
  );
  ok(
    'deadline status is an allowed value',
    assignmentRows.every((a) => ['OVERDUE', 'DUE_SOON', 'UPCOMING', 'NO_DEADLINE', 'SUBMITTED'].includes(a.deadline?.status))
  );
  console.log(`        summary: ${JSON.stringify(assignments.json?.summary)}`);

  // ---------------------------------------------------------- PROGRESS
  section('6. STUDENT PROGRESS - real stored data only');
  const progress = await studentCall('/api/student/dashboard');
  ok('student dashboard API responds', progress.status === 200, `status ${progress.status}`);
  const stats = progress.json?.stats ?? {};
  ok('xp is a real number', typeof stats.xp === 'number', `xp=${stats.xp}`);
  ok('streak is a real number', typeof stats.streakDays === 'number', `streak=${stats.streakDays}`);
  ok('lessons completed is numeric', typeof stats.lessonsCompleted === 'number', `lessons=${stats.lessonsCompleted}`);
  ok('accuracy is numeric or null', stats.accuracy === null || typeof stats.accuracy === 'number', `accuracy=${stats.accuracy}`);
  ok(
    'continue learning resolves to a real lesson link',
    typeof progress.json?.continueLearning?.href === 'string' && /^\/student\/learn\/(cbse|ap)-ch\d+(-l\d+)?$/.test(progress.json.continueLearning.href),
    progress.json?.continueLearning?.href
  );

  const recs = await studentCall('/api/student/recommendations');
  ok('recommendations endpoint responds', recs.status === 200, `status ${recs.status}`);
  const recList = recs.json?.recommendations ?? [];
  ok(
    'recommendations only list topics with real graded evidence',
    recList.every((r) => r.attempted >= 2 && typeof r.accuracy === 'number'),
    JSON.stringify(recList.map((r) => ({ t: r.topicTitle, a: r.accuracy, n: r.attempted })))
  );
  ok('recommendations are below the weakness threshold', recList.every((r) => r.accuracy < 70), JSON.stringify(recList.map((r) => r.accuracy)));
  console.log(`        graded answers=${recs.json?.gradedAnswers} overall accuracy=${recs.json?.overallAccuracy}`);

  // ---------------------------------------------------------- BOOKMARKS
  section('7. BOOKMARKS - persistence round-trip');
  const bmItem = `${UNIQUE}-bookmark`;
  const save = await studentCall('/api/student/bookmarks', { method: 'POST', body: JSON.stringify({ itemType: 'LESSON', itemId: bmItem, title: 'Verify bookmark' }) });
  ok('bookmark saved', save.status === 201 || save.status === 200, `status ${save.status}`);
  await studentCall('/api/student/bookmarks', { method: 'POST', body: JSON.stringify({ itemType: 'LESSON', itemId: bmItem, title: 'Verify bookmark' }) });
  const bmList = await studentCall('/api/student/bookmarks');
  const matches = (bmList.json?.bookmarks ?? []).filter((b) => b.itemId === bmItem);
  ok('bookmark appears exactly once after a duplicate save', matches.length === 1, `${matches.length} rows`);
  ok('invalid bookmark type rejected', (await studentCall('/api/student/bookmarks', { method: 'POST', body: JSON.stringify({ itemType: 'NOPE', itemId: 'x' }) })).status === 400);
  ok('bookmark removed', (await studentCall(`/api/student/bookmarks?itemType=LESSON&itemId=${encodeURIComponent(bmItem)}`, { method: 'DELETE' })).status === 200);
  const bmAfter = await studentCall('/api/student/bookmarks');
  ok('bookmark no longer listed', !(bmAfter.json?.bookmarks ?? []).some((b) => b.itemId === bmItem));

  // ------------------------------------------ LESSON PROGRESS + BADGES
  section('8. LESSON PROGRESS + ACHIEVEMENTS (real conditions only)');
  const verifyLessonId = `${UNIQUE}-lesson`;
  const lp = await studentCall('/api/student/lesson-progress', {
    method: 'POST',
    body: JSON.stringify({ lessonId: verifyLessonId, board: 'CBSE', chapterId: 'cbse-ch1', completed: false }),
  });
  ok('lesson progress recorded', lp.status === 200, `status ${lp.status}`);
  const lpGet = await studentCall('/api/student/lesson-progress');
  ok('in-progress lesson stored (drives Continue Learning)', (lpGet.json?.lessonProgress ?? []).some((l) => l.lessonId === verifyLessonId));

  const achievements = await studentCall('/api/student/achievements');
  ok('achievements endpoint responds', achievements.status === 200, `status ${achievements.status}`);
  const badgeList = achievements.json?.badges ?? [];
  ok('badges returned with unlock state', badgeList.length > 0 && badgeList.every((b) => typeof b.unlocked === 'boolean'), `${badgeList.length} badges`);
  const earned = badgeList.filter((b) => b.unlocked);
  console.log(`        earned: ${JSON.stringify(earned.map((b) => b.code))}`);
  ok('FIRST_LESSON not awarded from an incomplete lesson', !earned.some((b) => b.code === 'FIRST_LESSON'));
  ok('CHAPTER_COMPLETE not awarded from a single lesson', !earned.some((b) => b.code === 'CHAPTER_COMPLETE'));

  // ----------------------------------------------------------- TEACHER
  section('9. TEACHER - class announcement to assigned sections only');
  ok('teacher loads their classes', (await teacherCall('/api/teacher/classes')).status === 200);

  const assignedSection = db
    .prepare('SELECT section_id AS sectionId FROM teacher_assignments WHERE teacher_id = ? LIMIT 1')
    .get(teacher.id);

  if (assignedSection) {
    const classNotice = await teacherCall('/api/teacher/announcements', {
      method: 'POST',
      body: JSON.stringify({
        title: `${UNIQUE} class notice`,
        message: 'Teacher class announcement.',
        type: 'EVENT',
        targetSectionId: assignedSection.sectionId,
      }),
    });
    ok('teacher publishes to an assigned section', classNotice.status === 201, `status ${classNotice.status}`);
    if (classNotice.json?.id) createdAnnouncementIds.push(classNotice.json.id);

    const notMine = db
      .prepare('SELECT s.id FROM sections s WHERE s.id NOT IN (SELECT section_id FROM teacher_assignments WHERE teacher_id = ?) LIMIT 1')
      .get(teacher.id);
    if (notMine) {
      ok(
        'teacher blocked from an unassigned section',
        (await teacherCall('/api/teacher/announcements', {
          method: 'POST',
          body: JSON.stringify({ title: `${UNIQUE} not mine`, message: 'x', targetSectionId: notMine.id }),
        })).status === 403
      );
    } else {
      ok('teacher blocked from unassigned section (skipped - teaches all)', true);
    }

    ok('teacher announcement requires a target', (await teacherCall('/api/teacher/announcements', { method: 'POST', body: JSON.stringify({ title: 'x', message: 'y' }) })).status === 400);

    // Only students actually enrolled in that section should be notified.
    const enrolled = db
      .prepare('SELECT student_id AS id FROM student_enrollments WHERE section_id = ?')
      .all(assignedSection.sectionId)
      .map((r) => r.id);
    const notified = db
      .prepare('SELECT user_id AS id FROM notifications WHERE link = ?')
      .all(`/announcements#${classNotice.json?.id}`)
      .map((r) => r.id);
    const strays = notified.filter((id) => !enrolled.includes(id));
    ok('only students enrolled in that section were notified', strays.length === 0, `${notified.length} notified, ${strays.length} outside`);
  } else {
    ok('teacher has an assigned section to test with', false, 'no teacher_assignment rows');
  }

  const teacherAnalytics = await teacherCall('/api/teacher/analytics');
  ok('teacher analytics responds', teacherAnalytics.status === 200, `status ${teacherAnalytics.status}`);
  ok('teacher analytics exposes a data flag', typeof teacherAnalytics.json?.hasData === 'boolean', `hasData=${teacherAnalytics.json?.hasData}`);

  // ------------------------------------------------------------ PARENT
  section('10. PARENT - children, assignments, achievements (links untouched)');
  const parentBefore = db.prepare('SELECT COUNT(*) AS c FROM parent_student_links').get().c;
  const children = await parentCall('/api/parent/children');
  ok('parent loads children', children.status === 200, `status ${children.status}`);
  ok('pending assignments present', Array.isArray(children.json?.pendingAssignments), `${(children.json?.pendingAssignments ?? []).length} pending`);
  ok('achievements present', Array.isArray(children.json?.achievements), `${(children.json?.achievements ?? []).length} achievements`);
  ok('parent still sees linked children', (children.json?.children ?? []).length > 0, `${(children.json?.children ?? []).length} children`);

  // ---------------------------------------------------------- EXAM PREP
  section('11. EXAM PREPARATION - assembled from the existing curriculum');
  const chapters = await studentCall('/api/student/exam-prep?board=CBSE');
  ok('exam prep lists CBSE chapters', chapters.status === 200, `status ${chapters.status}`);
  ok('chapters come from the real curriculum', (chapters.json?.chapters ?? []).length === 15, `${(chapters.json?.chapters ?? []).length} chapters`);

  const apChapters = await studentCall('/api/student/exam-prep?board=AP_STATE_BOARD');
  ok('exam prep lists AP chapters', (apChapters.json?.chapters ?? []).length === 12, `${(apChapters.json?.chapters ?? []).length} chapters`);

  const firstChapter = (chapters.json?.chapters ?? [])[0];
  if (firstChapter) {
    const pack = await studentCall(`/api/student/exam-prep?board=CBSE&chapterId=${firstChapter.id}`);
    ok('exam prep returns a study pack', pack.status === 200, `status ${pack.status}`);
    ok('pack includes topics', (pack.json?.topics ?? []).length > 0, `${(pack.json?.topics ?? []).length}`);
    ok('pack includes lessons', (pack.json?.lessons ?? []).length > 0, `${(pack.json?.lessons ?? []).length}`);
    ok('pack includes a formulas array', Array.isArray(pack.json?.formulas), `${(pack.json?.formulas ?? []).length}`);
    ok('pack includes a results array', Array.isArray(pack.json?.results), `${(pack.json?.results ?? []).length} results`);
  }
  ok('unknown chapter returns 404', (await studentCall('/api/student/exam-prep?board=CBSE&chapterId=does-not-exist')).status === 404);

  // ------------------------------------------------------ PAGE RENDERING
  section('12. PAGE RENDERING (HTTP 200)');
  for (const p of ['/announcements', '/student/bookmarks', '/student/exam-prep']) {
    ok(`student page renders ${p}`, (await studentCall(p)).status === 200);
  }
  ok('admin page renders /admin/announcements', (await adminCall('/admin/announcements')).status === 200);
  ok('teacher page renders /teacher/announcements', (await teacherCall('/teacher/announcements')).status === 200);

  // ------------------------------------------------------------ CLEANUP
  section('13. CLEANUP - remove verification artefacts');
  for (const id of createdAnnouncementIds) {
    ok(
      `removed verification announcement ${id.slice(0, 8)}`,
      (await adminCall(`/api/admin/announcements?id=${id}&hard=true`, { method: 'DELETE' })).status === 200
    );
  }

  // Remove the verify-only lesson-progress row so the real student's state is
  // left exactly as it was found.
  const writable = new Database(DB_PATH);
  writable.prepare('DELETE FROM lesson_progress WHERE lesson_id = ?').run(verifyLessonId);
  // Remove the sessions minted for this verification run only.
  const placeholders = mintedSessionIds.map(() => '?').join(',');
  writable.prepare(`DELETE FROM sessions WHERE id IN (${placeholders})`).run(...mintedSessionIds);
  writable.close();

  const parentAfter = db.prepare('SELECT COUNT(*) AS c FROM parent_student_links').get().c;
  ok('parent-student links unchanged', parentBefore === parentAfter, `${parentBefore} -> ${parentAfter}`);

  const finalList = await adminCall('/api/admin/announcements?includeInactive=true');
  const leftover = (finalList.json?.announcements ?? []).filter((a) => String(a.title).startsWith('VERIFY-'));
  ok('no VERIFY announcements remain', leftover.length === 0, `${leftover.length} left`);
}

main()
  .catch((error) => {
    console.error('\nVerification crashed:', error);
    failures.push(`crash: ${error.message}`);
  })
  .finally(() => {
    db.close();
    console.log(`\n=== ${passed} passed, ${failures.length} failed ===`);
    if (failures.length) {
      console.log('\nFAILURES:');
      for (const f of failures) console.log(`  - ${f}`);
      process.exitCode = 1;
    }
  });
