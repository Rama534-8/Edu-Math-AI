import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const UNSAFE_DEV_SESSION_SECRET = 'edumathai-local-dev-secret-change-in-production-please';
const COOKIE_NAME = 'edumathai_session';
const SESSION_DURATION_DAYS = 30;

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED';

export interface Actor {
  userId: string;
  email: string;
  role: string;
  schoolId: string | null;
  status: AccountStatus;
  sessionId: string;
}

/** @deprecated Use Actor. Kept so existing imports of SessionPayload still type-check. */
export type SessionPayload = Actor;

export type SessionLookup =
  | { type: 'ok'; actor: Actor }
  | { type: 'unauthenticated' }
  | { type: 'inactive'; status: AccountStatus };

export function resolveSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === UNSAFE_DEV_SESSION_SECRET || secret.length < 32) {
      throw new Error(
        'SESSION_SECRET must be set to a unique value of at least 32 characters in production.'
      );
    }
    return secret;
  }
  return secret && secret.length >= 16 ? secret : UNSAFE_DEV_SESSION_SECRET;
}

function jwtSecretBytes(): Uint8Array {
  return new TextEncoder().encode(resolveSessionSecret());
}

export async function createSession(userId: string, email: string, role: string): Promise<string> {
  const sessionId = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const db = getDb();
  db.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ).run(sessionId, userId, expiresAt.toISOString());

  const token = await new SignJWT({ userId, email, role, sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .setIssuedAt()
    .sign(jwtSecretBytes());

  return token;
}

function loadActor(userId: string, sessionId: string): Actor | 'missing' | 'inactive' {
  const db = getDb();
  const user = db.prepare(
    'SELECT id, email, role, status, school_id FROM users WHERE id = ?'
  ).get(userId) as
    | { id: string; email: string; role: string; status: string | null; school_id: string | null }
    | undefined;

  if (!user) return 'missing';
  const status = (user.status || 'ACTIVE') as AccountStatus;
  if (status !== 'ACTIVE') return 'inactive';

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    schoolId: user.school_id ?? null,
    status,
    sessionId,
  };
}

export async function verifySession(token: string): Promise<Actor | null> {
  const lookup = await verifySessionLookup(token);
  return lookup.type === 'ok' ? lookup.actor : null;
}

export async function verifySessionLookup(token: string): Promise<SessionLookup> {
  try {
    const { payload } = await jwtVerify(token, jwtSecretBytes());
    const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId : '';
    const jwtUserId = typeof payload.userId === 'string' ? payload.userId : '';
    if (!sessionId || !jwtUserId) return { type: 'unauthenticated' };

    const db = getDb();
    const session = db.prepare(
      `SELECT id, user_id FROM sessions WHERE id = ? AND expires_at > datetime('now')`
    ).get(sessionId) as { id: string; user_id: string } | undefined;

    if (!session || session.user_id !== jwtUserId) return { type: 'unauthenticated' };

    const actor = loadActor(session.user_id, sessionId);
    if (actor === 'missing') return { type: 'unauthenticated' };
    if (actor === 'inactive') {
      const row = db.prepare('SELECT status FROM users WHERE id = ?').get(session.user_id) as
        | { status: AccountStatus }
        | undefined;
      return { type: 'inactive', status: row?.status === 'DISABLED' ? 'DISABLED' : 'SUSPENDED' };
    }
    return { type: 'ok', actor };
  } catch {
    return { type: 'unauthenticated' };
  }
}

export async function lookupSession(): Promise<SessionLookup> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return { type: 'unauthenticated' };
  return verifySessionLookup(token);
}

export async function getSessionFromRequest(): Promise<Actor | null> {
  const lookup = await lookupSession();
  return lookup.type === 'ok' ? lookup.actor : null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export { COOKIE_NAME, SESSION_DURATION_DAYS };
