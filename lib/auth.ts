import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq, lt } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import type { Session } from '@/types';

const SESSION_COOKIE = 'session_token';
const SESSION_DURATION_DAYS = 7;

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.APP_PASSWORD_HASH;
  if (!hash) return false;
  return compare(password, hash);
}

export async function createSession(initials: string): Promise<string> {
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db.insert(sessions).values({
    id,
    initials: initials.toUpperCase(),
    expiresAt,
  });

  return id;
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const results = await db.select().from(sessions).where(eq(sessions.id, token));
  const session = results[0];

  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, token));
    return null;
  }

  return session as Session;
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  return session;
}

/**
 * Removes every session row whose expiry has passed.
 *
 * A row is otherwise only cleared on explicit logout, or when someone happens to
 * make a request with an already-expired cookie — so every login from a tab that
 * was simply closed used to linger forever. Called on login, which is infrequent
 * enough to be free and frequent enough to keep the table small.
 *
 * expiresAt is stored as an ISO-8601 UTC string, so a lexicographic comparison
 * is also a chronological one.
 */
export async function deleteExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date().toISOString()));
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }
}

export function setSessionCookie(token: string): { name: string; value: string; options: Record<string, unknown> } {
  return {
    name: SESSION_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    },
  };
}
