/**
 * End-to-end probe for the EduMathAI AI routes.
 *
 *   node scripts/check-ai-services.mjs
 *
 * Registers a throwaway student (to obtain a real session cookie), then calls
 * the chat route in English and Telugu and reports the real server outcome.
 * Also exercises the two vision routes with a real image when one is present.
 * Never prints secrets.
 */
import { readFileSync } from 'node:fs';

const BASE = 'http://localhost:3000';

async function registerStudent({ email, board, medium }) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'AI Probe',
      email,
      password: 'Test@12345',
      confirmPassword: 'Test@12345',
      role: 'STUDENT',
      phone: '9876543210',
      className: 'Class 9',
      board,
      medium,
      parentGuardianName: 'G',
      schoolName: 'S',
    }),
  });
  const cookie = (res.headers.getSetCookie?.() || [])
    .map((c) => c.split(';')[0])
    .join('; ');
  return { status: res.status, cookie };
}

const TELUGU = (s) => (s.match(/[\u0C00-\u0C7F]/g) || []).length;

async function chat(cookie, newMessage, context) {
  const res = await fetch(`${BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ messages: [], newMessage, context }),
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = { error: '(non-JSON response)' };
  }
  return { status: res.status, body };
}

const stamp = Date.now();

if (process.env.HW_ONLY === '1') {
  // Retry just the handwritten route (used after hitting a provider rate limit).
  const image =
    'data:image/png;base64,' + readFileSync(`${process.env.TEMP}\\math-test.png`).toString('base64');
  const reg = await registerStudent({
    email: `aiprobe_hw_${stamp}@example.com`,
    board: 'CBSE',
    medium: 'ENGLISH',
  });
  const res = await fetch(`${BASE}/api/ai/handwritten-checker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: reg.cookie },
    body: JSON.stringify({ image, language: 'ENGLISH' }),
  });
  let b;
  try {
    b = await res.json();
  } catch {
    b = { error: '(non-JSON response)' };
  }
  console.log(`register HTTP ${reg.status}`);
  console.log(`/api/ai/handwritten-checker -> HTTP ${res.status}`);
  if (b.error) {
    console.log(`  error: ${b.error}`);
  } else {
    console.log(`  response keys: ${Object.keys(b).join(', ')}`);
    console.log(`  detectedSteps: ${Array.isArray(b.detectedSteps) ? 'array(' + b.detectedSteps.length + ')' : 'NOT AN ARRAY -> ' + typeof b.detectedSteps}`);
    console.log(`  overallStatus: ${b.overallStatus}`);
    console.log(`  finalVerdict: ${String(b.finalVerdict).slice(0, 100)}`);
    if (!Array.isArray(b.detectedSteps)) process.exitCode = 1;
    if (!['CORRECT', 'PARTIAL', 'INCORRECT'].includes(b.overallStatus)) process.exitCode = 1;
  }
} else {

// 1) English chat
const en = await registerStudent({
  email: `aiprobe_en_${stamp}@example.com`,
  board: 'AP_STATE_BOARD',
  medium: 'ENGLISH',
});
console.log(`register(EN) HTTP ${en.status}`);
const enChat = await chat(en.cookie, 'Explain Factor Theorem with an example', {
  board: 'AP_STATE_BOARD',
  class: 'Class 9',
  language: 'ENGLISH',
});
console.log(`\n=== CHAT (English) HTTP ${enChat.status} ===`);
if (enChat.body.error) {
  console.log('  ERROR: ' + enChat.body.error);
} else {
  const c = enChat.body.content || '';
  console.log('  reply length      : ' + c.length);
  console.log('  mentions factor  : ' + /factor/i.test(c));
  console.log('  has LaTeX         : ' + /\\\(|\\\[/.test(c));
  console.log('  has example       : ' + /example/i.test(c));
  console.log('  preview           : ' + c.slice(0, 160).replace(/\n/g, ' '));
}

// 2) Telugu chat
const te = await registerStudent({
  email: `aiprobe_te_${stamp}@example.com`,
  board: 'CBSE',
  medium: 'TELUGU',
});
console.log(`\nregister(TE) HTTP ${te.status}`);
const teQuestion =
  '\u0C39\u0C46\u0C30\u0C28\u0C4D \u0C38\u0C42\u0C24\u0C4D\u0C30\u0C02 \u0C35\u0C3F\u0C35\u0C30\u0C23\u0C21\u0C3F';
const teChat = await chat(te.cookie, teQuestion, {
  board: 'CBSE',
  class: 'Class 9',
  language: 'TELUGU',
});
console.log(`=== CHAT (Telugu) HTTP ${teChat.status} ===`);
if (teChat.body.error) {
  console.log('  ERROR: ' + teChat.body.error);
} else {
  const c = teChat.body.content || '';
  const count = TELUGU(c);
  console.log('  reply length         : ' + c.length);
  console.log('  Telugu codepoints    : ' + count);
  console.log('  real Telugu reply    : ' + (count > 50 ? 'YES' : 'NO'));
  console.log('  preview              : ' + c.slice(0, 160).replace(/\n/g, ' '));
}

// 3) Vision routes: send a REAL image with readable content so the provider is
//    genuinely exercised (not just reachable).
console.log('\n=== IMAGE ROUTES (vision model) ===');
const imagePath = process.env.TEMP
  ? `${process.env.TEMP}\\math-test.png`
  : null;
let visionImage = null;
if (imagePath) {
  try {
    visionImage = 'data:image/png;base64,' + readFileSync(imagePath).toString('base64');
  } catch {
    visionImage = null;
  }
}
if (!visionImage) {
  console.log('  (no test image on disk - cannot exercise vision)');
} else {
  console.log(`  test image ready (${visionImage.length} b64 chars)`);
  for (const route of ['/api/ai/solver', '/api/ai/handwritten-checker']) {
    const res = await fetch(`${BASE}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: en.cookie },
      body: JSON.stringify({ image: visionImage, language: 'ENGLISH' }),
    });
    let b;
    try {
      b = await res.json();
    } catch {
      b = { error: '(non-JSON response)' };
    }
    console.log(`  ${route} -> HTTP ${res.status}`);
    if (b.error) {
      console.log(`      error: ${b.error}`);
    } else {
      const keys = Object.keys(b);
      console.log(`      response keys: ${keys.join(', ')}`);
      if (b.extractedQuestion) {
        console.log(`      extracted: ${String(b.extractedQuestion).slice(0, 120)}`);
      }
      if (b.finalAnswer) {
        console.log(`      finalAnswer: ${String(b.finalAnswer).slice(0, 120)}`);
      }
      // These MUST be arrays: the pages call .map() on them. A regression here
      // crashed /student/ai-solver with "stepByStepSolution.map is not a function".
      for (const field of ['stepByStepSolution', 'similarQuestions', 'detectedSteps']) {
        if (field in b) {
          const ok = Array.isArray(b[field]);
          console.log(`      ${field}: ${ok ? 'array(' + b[field].length + ')' : 'NOT AN ARRAY -> ' + typeof b[field]}`);
          if (!ok) process.exitCode = 1;
        }
      }
      if (b.stepByStepSolution?.length > 0) {
        const first = b.stepByStepSolution[0];
        console.log(
          `      first step: step=${first.step} textLen=${String(first.text ?? '').length}`
        );
      }
      if (b.overallStatus) {
        const valid = ['CORRECT', 'PARTIAL', 'INCORRECT'].includes(b.overallStatus);
        console.log(`      overallStatus: ${b.overallStatus}${valid ? '' : '  <-- INVALID'}`);
        if (!valid) process.exitCode = 1;
      }
    }
  }
}
}