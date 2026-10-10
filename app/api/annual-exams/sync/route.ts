import { NextRequest, NextResponse } from 'next/server';
import { academicYear, applySync, isSyncRequest } from '@/lib/annual-exams';

// PUT (CRC Control Board only): the plan for the year, plus any items or exam sheets recorded there.
// Birds are matched by case number (the VMACS number). Newer changes win; nothing recorded here is overwritten by older data.
export async function PUT(request: NextRequest) {
  if (!isSyncRequest(request)) return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  const b = await request.json();
  const out = await applySync(b.year || academicYear(), Array.isArray(b.cells) ? b.cells : [], Array.isArray(b.sheets) ? b.sheets : []);
  return NextResponse.json({ ok: true, ...out });
}
