import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSession, setSessionCookie, deleteExpiredSessions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password, initials } = await request.json();

    if (!password || !initials) {
      return NextResponse.json({ error: 'Password and initials are required' }, { status: 400 });
    }

    if (initials.length < 2 || initials.length > 4) {
      return NextResponse.json({ error: 'Initials must be 2-4 characters' }, { status: 400 });
    }

    const valid = await verifyPassword(password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Housekeeping — never block a login on it.
    await deleteExpiredSessions().catch(err => console.error('Session cleanup failed:', err));

    const token = await createSession(initials);
    const cookie = setSessionCookie(token);

    const response = NextResponse.json({ success: true, initials: initials.toUpperCase() });
    response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2]);

    return response;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
