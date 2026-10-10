import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { academicYear, annualExamsEnabled, recordAnnualExamSheet } from '@/lib/annual-exams';

// PUT: a bird's exam sheet for the year — weight (g), body condition, findings, abnormal flag, exam date.
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  if (!(await annualExamsEnabled())) return NextResponse.json({ error: 'Not available' }, { status: 404 });
  const b = await request.json();
  const birdNo = String(b.birdNo || '').replace(/\D/g, '');
  if (!birdNo) return NextResponse.json({ error: 'Missing bird' }, { status: 400 });
  await recordAnnualExamSheet(b.year || academicYear(), birdNo, {
    weightG: String(b.weightG || '').replace(/[^\d.]/g, ''), bcs: String(b.bcs || '').trim(), findings: String(b.findings || '').trim(),
    abnormal: !!b.abnormal, examDate: String(b.examDate || '').trim() }, session.initials);
  return NextResponse.json({ ok: true });
}
