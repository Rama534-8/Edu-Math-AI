/** Quick diagnostic for session minting (no accounts created). */
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'data', 'edumathai.db');
const line = fs
  .readFileSync('.env.local', 'utf8')
  .split('\n')
  .find((l) => l.startsWith('SESSION_SECRET='));
const secret = line.slice(line.indexOf('=') + 1).trim();

console.log('dev NODE_ENV      :', process.env.NODE_ENV);
console.log('secret length     :', secret.length);
console.log('server NODE_ENV   : production (next start)');
console.log('production rule   : needs >=32 chars, else throws -> 500/401');

const db = new Database(DB_PATH);
const admin = db
  .prepare("SELECT id, email, role, status, school_id FROM users WHERE role = 'PLATFORM_ADMIN' AND status = 'ACTIVE' LIMIT 1")
  .get();
console.log('admin row         :', JSON.stringify(admin));

const { SignJWT } = await import('jose');
const { v4: uuidv4 } = await import('uuid');
const sessionId = uuidv4();
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 1);
db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(
  sessionId,
  admin.id,
  expiresAt.toISOString()
);
console.log('session inserted  :', sessionId, 'expires', expiresAt.toISOString());

const check = db
  .prepare("SELECT COUNT(*) AS c FROM sessions WHERE id = ? AND user_id = ? AND expires_at > datetime('now')")
  .get(sessionId, admin.id);
console.log('session matches   :', JSON.stringify(check));

const token = await new SignJWT({
  userId: admin.id,
  email: admin.email,
  role: admin.role,
  sessionId,
})
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime('1d')
  .setIssuedAt()
  .sign(new TextEncoder().encode(secret));

const res = await fetch('http://localhost:3111/api/auth/me', {
  headers: { cookie: `edumathai_session=${token}` },
});
console.log('auth/me status    :', res.status, await res.text());

db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
db.close();
