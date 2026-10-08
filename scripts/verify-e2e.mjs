/**
 * End-to-end verification of EduMathAI against a running server.
 *
 * Exercises real HTTP flows: registration, login (including wrong-role and
 * bad-password rejection), session persistence, logout, role isolation, the
 * parent -> student linking flow, and the Student / Teacher / School Admin /
 * Parent / Curriculum API surfaces.
 *
 * Accounts are created on the synthetic @example.com domain and removed again at
 * the end (scripts/cleanup-test-accounts.mjs also catches them if a run aborts).
 *
 * Usage:
 *   node --experimental-strip-types scripts/verify-e2e.mjs
 *   BASE_URL=http://localhost:3000 node --experimental-strip-types scripts/verify-e2e.mjs
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

register('./ts-alias-loader.mjs', pathToFileURL(path.join(import.meta.dirname, '/')));

const BASE = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const RUN = String(Date.now());
const PASSWORD = 'Passw0rd!23';
const SCHOOL = 'EduMathAI School';
const SCHOOL_ADMIN_CODE = process.env.SCHOOL_ADMIN_INVITE_CODE ?? 'your_school_admin_invite_code';
const PLATFORM_ADMIN_CODE = process.env.ADMIN_INVITE_CODE ?? 'your_admin_invite_code';
const ROLES = ['STUDENT', 'TEACHER', 'PARENT', 'SCHOOL_ADMIN', 'PLATFORM_ADMIN'];

let passed = 0;
let failed = 0;
const failures = [];

function ok(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}${detail ? ` (${detail})` : ''}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  FAIL  ${label}${detail ? ` (${detail})` : ''}`);
  }
}

/** Cookie-aware fetch wrapper; one instance per simulated browser. */
function createClient() {
  const jar = new Map();
  const client = {
    async request(method, urlPath, body) {
      const headers = {};
      const cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
      if (cookie) headers.Cookie = cookie;
      if (body !== undefined) headers['Content-Type'] = 'application/json';

      const res = await fetch(`${BASE}${urlPath}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'manual',
      });

      for (const raw of res.headers.getSetCookie?.() ?? []) {
        const pair = raw.split(';')[0];
        const idx = pair.indexOf('=');
        if (idx > 0) jar.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
      }
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* non-JSON page */ }
      return { status: res.status, json, text };
    },
    get: (p) => client.request('GET', p),
    post: (p, b) => client.request('POST', p, b ?? {}),
  };
  return client;
}

const { getDb } = await import('../src/lib/db/index.ts');
const db = getDb();

const emailFor = (role) => `e2e_${role.toLowerCase()}_${RUN}@example.com`;
const createdEmails = [];

async function registerRole(client, role) {
  const email = emailFor(role);
  const body = {
    name: `E2E ${role}`, email, password: PASSWORD, confirmPassword: PASSWORD,
    role, schoolName: SCHOOL,
  };
  if (role === 'STUDENT') {
    Object.assign(body, {
      parentGuardianName: 'E2E Guardian', phone: '9876543210',
      board: 'CBSE', medium: 'ENGLISH', className: 'Class 9',
    });
  }
  if (role === 'SCHOOL_ADMIN') body.inviteCode = SCHOOL_ADMIN_CODE;
  if (role === 'PLATFORM_ADMIN') body.inviteCode = PLATFORM_ADMIN_CODE;
  const res = await client.post('/api/auth/register', body);
  createdEmails.push(email);
  return res;
}

const login = (client, role, email) =>
  client.post('/api/auth/login', { email, password: PASSWORD, selectedRole: role });

const clients = {};
for (const role of ROLES) clients[role] = createClient();
const anon = createClient();

console.log(`=== EduMathAI E2E verification against ${BASE} ===\n`);
console.log('Server reachability');
ok('GET / responds', (await anon.get('/')).status === 200);

console.log('\n1. Registration (all five roles)');
for (const role of ROLES) {
  const res = await registerRole(clients[role], role);
  ok(`register ${role}`, res.status === 201, `status ${res.status}`);
}
console.log('\n2. Login + session persistence');
for (const role of ROLES) {
  const res = await login(clients[role], role, emailFor(role));
  ok(`login ${role}`, res.status === 200 && res.json?.user?.role === role, `status ${res.status}`);
  const me = await clients[role].get('/api/auth/me');
  ok(`session persists for ${role}`, me.status === 200 && me.json?.user?.role === role, `status ${me.status}`);
}

console.log('\n3. Login rejection paths');
ok('student cannot log in as teacher',
  (await login(createClient(), 'TEACHER', emailFor('STUDENT'))).status === 403);
ok('wrong password rejected',
  (await createClient().post('/api/auth/login', { email: emailFor('STUDENT'), password: 'wrong', selectedRole: 'STUDENT' })).status === 401);
ok('unknown account rejected',
  (await createClient().post('/api/auth/login', { email: 'nobody-here@example.com', password: PASSWORD, selectedRole: 'STUDENT' })).status === 401);
ok('missing role rejected',
  (await createClient().post('/api/auth/login', { email: emailFor('STUDENT'), password: PASSWORD })).status === 400);

console.log('\n4. Logout');
const logoutClient = createClient();
await login(logoutClient, 'STUDENT', emailFor('STUDENT'));
ok('authenticated before logout', (await logoutClient.get('/api/auth/me')).status === 200);
ok('logout succeeds', (await logoutClient.post('/api/auth/logout')).status === 200);
ok('session invalidated after logout', (await logoutClient.get('/api/auth/me')).status === 401);

console.log('\n5. Role isolation (expected 401/403)');
const isolation = [
  ['unauthenticated -> admin overview', anon, '/api/admin/overview'],
  ['unauthenticated -> school-admin students', anon, '/api/school-admin/students'],
  ['unauthenticated -> teacher dashboard', anon, '/api/teacher/dashboard'],
  ['student -> admin overview', clients.STUDENT, '/api/admin/overview'],
  ['student -> school-admin students', clients.STUDENT, '/api/school-admin/students'],
  ['student -> teacher dashboard', clients.STUDENT, '/api/teacher/dashboard'],
  ['student -> curriculum staff API', clients.STUDENT, '/api/curriculum?level=chapters'],
  ['teacher -> admin overview', clients.TEACHER, '/api/admin/overview'],
  ['teacher -> school-admin reports', clients.TEACHER, '/api/school-admin/reports'],
  ['school admin -> platform user list', clients.SCHOOL_ADMIN, '/api/admin/users'],
  ['parent -> teacher dashboard', clients.PARENT, '/api/teacher/dashboard'],
  ['parent -> admin overview', clients.PARENT, '/api/admin/overview'],
];
for (const [label, client, url] of isolation) {
  const res = await client.get(url);
  ok(`blocked: ${label}`, res.status === 401 || res.status === 403, `status ${res.status}`);
}
console.log('\n6. Student module APIs');
// NOTE: /api/users/profile is a typed endpoint (only ?type=leaderboard today).
// The signed-in student's own profile comes from /api/auth/me.
for (const url of [
  '/api/auth/me', '/api/student/achievements', '/api/student/daily-goals',
  '/api/student/revision', '/api/users/snapshots', '/api/notifications',
  '/api/users/chapters', '/api/mock-exam/history', '/api/student/assignments',
  '/api/users/profile?type=leaderboard',
]) {
  const res = await clients.STUDENT.get(url);
  ok(`student GET ${url}`, res.status === 200, `status ${res.status}`);
}

console.log('\n7. Teacher module APIs');
for (const url of [
  '/api/teacher/dashboard', '/api/teacher/classes', '/api/teacher/assignments',
  '/api/teacher/quizzes', '/api/teacher/attendance', '/api/teacher/announcements',
  '/api/users/students', '/api/curriculum?level=chapters',
]) {
  const res = await clients.TEACHER.get(url);
  ok(`teacher GET ${url}`, res.status === 200, `status ${res.status}`);
}
const teacherSections = (await clients.TEACHER.get('/api/teacher/classes')).json;
ok('new teacher is scoped to school sections', (teacherSections?.classes?.length ?? 0) > 0,
  `${teacherSections?.classes?.length ?? 0} sections`);

console.log('\n8. School Admin module APIs');
for (const url of [
  '/api/admin/overview', '/api/admin/classes', '/api/admin/teachers', '/api/admin/analytics',
  '/api/school-admin/students', '/api/school-admin/reports', '/api/school-admin/attendance',
  '/api/school-admin/announcements', '/api/school-admin/assignments',
  '/api/school-admin/quizzes', '/api/school-admin/school',
]) {
  const res = await clients.SCHOOL_ADMIN.get(url);
  ok(`school admin GET ${url}`, res.status === 200, `status ${res.status}`);
}
const overview = (await clients.SCHOOL_ADMIN.get('/api/admin/overview')).json;
ok('school admin resolves a school scope',
  typeof overview?.schoolId === 'string' && overview.schoolId.length > 0, String(overview?.schoolId));
ok('school admin sees real student counts',
  (overview?.users?.students ?? 0) > 0, `${overview?.users?.students} students`);

console.log('\n9. Curriculum APIs');
const curOverview = (await clients.TEACHER.get('/api/curriculum')).json;
const cbse = curOverview?.boards?.find((b) => b.board === 'CBSE');
const ap = curOverview?.boards?.find((b) => b.board === 'AP_STATE_BOARD');
ok('CBSE curriculum is 15 chapters / 93 topics',
  cbse?.chapters === 15 && cbse?.topics === 93, `${cbse?.chapters}/${cbse?.topics}`);
ok('AP curriculum is 12 chapters / 52 topics',
  ap?.chapters === 12 && ap?.topics === 52, `${ap?.chapters}/${ap?.topics}`);
const chapters = (await clients.TEACHER.get('/api/curriculum?level=chapters')).json;
const firstChapter = chapters?.chapters?.[0];
ok('chapter list returned', Boolean(firstChapter));
const detail = await clients.TEACHER.get(`/api/curriculum?chapterId=${firstChapter?.id}`);
ok('chapter detail includes topics',
  detail.status === 200 && (detail.json?.chapter?.topics?.length ?? 0) > 0);
ok('unknown chapter returns 404',
  (await clients.TEACHER.get('/api/curriculum?chapterId=nope')).status === 404);
console.log('\n10. Parent module + parent-student link');
const empty = await clients.PARENT.get('/api/parent/children');
ok('parent children list starts empty',
  empty.status === 200 && (empty.json?.children?.length ?? 0) === 0);
const profile = (await clients.STUDENT.get('/api/auth/me')).json;
const studentCode = profile?.user?.studentCode;
ok('student exposes a student code for linking',
  typeof studentCode === 'string' && /^EDU-/.test(studentCode), String(studentCode));
ok('invalid student code rejected',
  (await clients.PARENT.post('/api/parent/children', { studentCode: 'NOT-A-CODE' })).status === 400);
ok('unknown student code returns 404',
  (await clients.PARENT.post('/api/parent/children', { studentCode: 'EDU-AAAAAA' })).status === 404);
ok('parent links the student',
  (await clients.PARENT.post('/api/parent/children', { studentCode })).status === 201);
const linked = await clients.PARENT.get('/api/parent/children');
const children = linked.json?.children ?? [];
ok('linked student appears for the parent',
  linked.status === 200 && children.length === 1, `${children.length} child(ren)`);
ok('linked student is identifiable by name', Boolean(children[0]?.displayName), children[0]?.displayName);
ok('duplicate link rejected',
  (await clients.PARENT.post('/api/parent/children', { studentCode })).status === 409);
ok('link survives repeated reads',
  (await clients.PARENT.get('/api/parent/children')).json?.children?.length === 1);

console.log('\n10b. Quiz evaluation flow');
const { SAMPLE_QUESTIONS_BANK } = await import('../src/lib/curriculum-data.ts');
ok('question bank is populated', SAMPLE_QUESTIONS_BANK.length > 0, `${SAMPLE_QUESTIONS_BANK.length} questions`);
ok('every bank question has a board chapter/topic',
  SAMPLE_QUESTIONS_BANK.every((q) => typeof q.chapterId === 'string' && q.chapterId.length > 0));

const answerFor = (q) => {
  if (q.type === 'MCQ' && Array.isArray(q.options) && q.options.length) {
    const correct = q.options.find((o) => o.id === q.correctAnswer);
    return correct ? correct.id : (q.options[0]?.id ?? '');
  }
  return typeof q.correctAnswer === 'string' ? q.correctAnswer : '';
};

const quizSubmission = SAMPLE_QUESTIONS_BANK.slice(0, 3).map((q) => ({
  questionId: q.id,
  studentAnswer: answerFor(q),
}));

const quizRes = await clients.STUDENT.post('/api/evaluate-quiz', {
  quizId: 'verify-quiz',
  submissions: quizSubmission,
});
ok('quiz submission is evaluated', quizRes.status === 200 && quizRes.json?.success === true,
  `status ${quizRes.status}`);
const snap = quizRes.json?.snapshot;
ok('evaluation returns a score',
  typeof snap?.percentage === 'number' && typeof snap?.score === 'number',
  `${snap?.score}/${snap?.maxScore} = ${snap?.percentage}%`);
ok('evaluation records correct/incorrect counts',
  typeof snap?.correctCount === 'number' && typeof snap?.totalQuestions === 'number',
  `${snap?.correctCount}/${snap?.totalQuestions}`);
ok('evaluation awards XP', typeof quizRes.json?.xpAwarded === 'number', `${quizRes.json?.xpAwarded} XP`);
// The evaluate response returns the typed snapshot (no raw JSON column), so read
// the persisted attempt from the snapshots endpoint, which returns parsed JSON.
const snapStore = await clients.STUDENT.get('/api/users/snapshots');
const stored = snapStore.json?.snapshots ?? [];
ok('evaluation stores per-question detail',
  Array.isArray(stored[0]?.evaluatedQuestions) && stored[0].evaluatedQuestions.length > 0,
  `${stored[0]?.evaluatedQuestions?.length} graded questions`);
ok('per-question detail marks correctness',
  Array.isArray(stored[0]?.evaluatedQuestions) &&
  stored[0].evaluatedQuestions.every((entry) => 'isCorrect' in entry || 'studentAnswer' in entry));

const badQuiz = await clients.STUDENT.post('/api/evaluate-quiz', { submissions: 'not-an-array' });
ok('malformed quiz payload rejected', badQuiz.status === 400, `status ${badQuiz.status}`);
const teacherQuiz = await clients.TEACHER.post('/api/evaluate-quiz', { submissions: quizSubmission });
ok('non-student cannot use quiz evaluation', teacherQuiz.status === 403, `status ${teacherQuiz.status}`);

const snapAfter = await clients.STUDENT.get('/api/users/snapshots');
ok('quiz attempt is persisted as a snapshot',
  Array.isArray(snapAfter.json?.snapshots) && snapAfter.json.snapshots.length > 0,
  `${snapAfter.json?.snapshots?.length} snapshots`);

console.log('\n11. Page rendering (HTTP 200 for the server-rendered shell)');
const pageMatrix = [
  ['STUDENT', ['/', '/student/dashboard', '/student/syllabus', '/student/learn', '/student/practice',
    '/student/quizzes', '/student/progress', '/student/assignments', '/student/ai-chatbot',
    '/student/ai-solver', '/student/handwritten-checker', '/student/mistake-detective',
    '/student/revision', '/student/mock-exams', '/student/formulas', '/student/achievements',
    '/student/before-after', '/student/profile', '/student/settings']],
  ['TEACHER', ['/teacher/dashboard', '/teacher/students', '/teacher/classes', '/teacher/curriculum',
    '/teacher/questions', '/teacher/quizzes', '/teacher/assignments', '/teacher/attendance',
    '/teacher/student-progress', '/teacher/announcements', '/teacher/analytics', '/teacher/profile']],
  ['SCHOOL_ADMIN', ['/school-admin/dashboard', '/school-admin/students', '/school-admin/classes',
    '/school-admin/teachers', '/school-admin/curriculum', '/school-admin/assignments',
    '/school-admin/quizzes', '/school-admin/attendance', '/school-admin/reports',
    '/school-admin/announcements', '/school-admin/school-profile', '/school-admin/settings',
    '/school-admin/analytics']],
  ['PARENT', ['/parent/dashboard', '/parent/children', '/parent/settings']],
];
for (const [role, pages] of pageMatrix) {
  const bad = [];
  for (const page of pages) {
    const res = await clients[role].get(page);
    if (res.status !== 200) bad.push(`${page}=${res.status}`);
  }
  ok(`${role} pages render`, bad.length === 0,
    bad.length ? bad.join(', ') : `${pages.length}/${pages.length}`);
}
for (const page of ['/auth/login', '/auth/register']) {
  ok(`public page ${page}`, (await anon.get(page)).status === 200);
}
console.log('\n12. Cleanup of verification accounts');
const emails = createdEmails.map((e) => e.toLowerCase());
const placeholders = emails.map(() => '?').join(',');
const rows = db.prepare(`SELECT id FROM users WHERE email IN (${placeholders})`).all(...emails);
const remove = db.transaction((list) => {
  for (const row of list) {
    db.prepare('DELETE FROM parent_student_links WHERE parent_user_id = ? OR student_user_id = ?').run(row.id, row.id);
    db.prepare('DELETE FROM teacher_assignments WHERE teacher_id = ?').run(row.id);
    db.prepare('DELETE FROM student_enrollments WHERE student_id = ?').run(row.id);
    db.prepare('DELETE FROM attendance WHERE student_id = ?').run(row.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(row.id);
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(row.id);
    db.prepare('DELETE FROM assessment_snapshots WHERE student_id = ?').run(row.id);
    db.prepare('DELETE FROM activity_log WHERE student_id = ?').run(row.id);
    db.prepare('DELETE FROM student_profiles WHERE uid = ?').run(row.id);
    db.prepare('DELETE FROM teacher_profiles WHERE uid = ?').run(row.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(row.id);
  }
});
remove(rows);
ok('verification accounts removed',
  db.prepare(`SELECT COUNT(*) AS c FROM users WHERE email IN (${placeholders})`).get(...emails).c === 0,
  `${rows.length} removed`);
const linksLeft = db.prepare('SELECT COUNT(*) AS c FROM parent_student_links').get().c;
ok('pre-existing parent links still intact', linksLeft >= 3, `${linksLeft} links`);

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
if (failures.length) {
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failed === 0 ? 0 : 1);