import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { academicYear, annualExamsEnabled, setWnvLot } from '@/lib/annual-exams';

// PUT: the WNV vaccine lot used this exam season (set once, stamped on each booster recorded).
export async function PUT(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  if (!(await annualExamsEnabled())) return NextResponse.json({ error: 'Not available' }, { status: 404 });
  const b = await request.json();
  await setWnvLot(b.year || academicYear(), String(b.lot || '').trim());
  return NextResponse.json({ ok: true });
}
