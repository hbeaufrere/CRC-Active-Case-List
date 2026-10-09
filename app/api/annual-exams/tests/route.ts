import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { annualExamsEnabled, isSyncRequest, replaceAnnualExamTests } from '@/lib/annual-exams';

// PUT: replace the list of tests (the current strategy) — it also sets the columns of the grid.
// Sent by the CRC Control Board when the strategy is saved there, or edited by a logged-in user when the section is on.
export async function PUT(request: NextRequest) {
  if (!isSyncRequest(request)) {
    if (!(await getSession())) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    if (!(await annualExamsEnabled())) return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  const b = await request.json();
  await replaceAnnualExamTests(Array.isArray(b.tests) ? b.tests : []);
  return NextResponse.json({ ok: true });
}
