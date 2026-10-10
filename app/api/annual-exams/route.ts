import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { academicYear, annualExamsEnabled, cleanInitials, getAnnualExamGrid, isSyncRequest, recordAnnualExamCell } from '@/lib/annual-exams';

// GET: the year's plan and records — for logged-in users when the section is switched on, and always for the CRC Control Board.
export async function GET(request: NextRequest) {
  const bySync = isSyncRequest(request);
  const session = bySync ? null : await getSession();
  if (!bySync) {
    if (!session) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    if (!(await annualExamsEnabled())) return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  const year = request.nextUrl.searchParams.get('year') || academicYear();
  return NextResponse.json({ ...(await getAnnualExamGrid(year)), enabled: await annualExamsEnabled(), me: cleanInitials(session?.initials) });
}

// PUT: record one item — status done / failed / deferred ('' clears), date, note, abnormal; "by" is the person logged in.
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  if (!(await annualExamsEnabled())) return NextResponse.json({ error: 'Not available' }, { status: 404 });
  const b = await request.json();
  const caseId = Number(b.caseId);
  if (!caseId || !b.test) return NextResponse.json({ error: 'Missing bird or item' }, { status: 400 });
  const status = String(b.status ?? (b.doneDate ? 'done' : ''));
  if ((status === 'failed' || status === 'deferred') && !String(b.note || '').trim())
    return NextResponse.json({ error: 'Please give the reason in the note' }, { status: 400 });
  await recordAnnualExamCell(b.year || academicYear(), caseId, String(b.test), status, (b.doneDate || '').trim() || null,
    session.initials, (b.note || '').trim() || null, !!b.abnormal);
  return NextResponse.json({ ok: true, doneBy: status ? cleanInitials(session.initials) : '' });
}
