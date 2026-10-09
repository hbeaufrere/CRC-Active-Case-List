import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { academicYear, annualExamsEnabled, getAnnualExamGrid, isSyncRequest, setAnnualExamCell } from '@/lib/annual-exams';

// GET: the grid for a year — for logged-in users when the section is switched on, and always for the CRC Control Board.
export async function GET(request: NextRequest) {
  const bySync = isSyncRequest(request);
  if (!bySync) {
    if (!(await getSession())) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    if (!(await annualExamsEnabled())) return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  const year = request.nextUrl.searchParams.get('year') || academicYear();
  return NextResponse.json({ ...(await getAnnualExamGrid(year)), enabled: await annualExamsEnabled() });
}

// PUT: record (or clear) one box of the grid; "done by" is the initials of the person logged in.
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  if (!(await annualExamsEnabled())) return NextResponse.json({ error: 'Not available' }, { status: 404 });
  const b = await request.json();
  const caseId = Number(b.caseId);
  if (!caseId || !b.test) return NextResponse.json({ error: 'Missing bird or test' }, { status: 400 });
  const done = (b.doneDate || '').trim() || null;
  await setAnnualExamCell(b.year || academicYear(), caseId, String(b.test), done, done ? session.initials : '', (b.note || '').trim() || null);
  return NextResponse.json({ ok: true, doneBy: done ? session.initials : '' });
}
