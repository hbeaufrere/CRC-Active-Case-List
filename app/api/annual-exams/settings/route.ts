import { NextRequest, NextResponse } from 'next/server';
import { annualExamsEnabled, isSyncRequest, setAnnualExamsEnabled } from '@/lib/annual-exams';

// The on/off switch of the Annual exams section — only the CRC Control Board (sync token) can read or change it.
export async function GET(request: NextRequest) {
  if (!isSyncRequest(request)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  return NextResponse.json({ enabled: await annualExamsEnabled() });
}

export async function PUT(request: NextRequest) {
  if (!isSyncRequest(request)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const b = await request.json();
  await setAnnualExamsEnabled(!!b.enabled);
  return NextResponse.json({ ok: true, enabled: !!b.enabled });
}
