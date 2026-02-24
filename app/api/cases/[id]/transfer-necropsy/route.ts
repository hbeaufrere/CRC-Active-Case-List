import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cases, caseHistory, necropsies } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const caseId = parseInt(id, 10);

    const caseResult = await db.select().from(cases).where(eq(cases.id, caseId));
    if (caseResult.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const caseData = caseResult[0];

    if (caseData.status === 'deceased') {
      return NextResponse.json({ error: 'Case is already marked as deceased' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const dateDied = body.dateDied || new Date().toISOString().split('T')[0];

    // Update case status to deceased
    const oldStatus = caseData.status;
    await db.update(cases).set({
      status: 'deceased',
      updatedAt: sql`(datetime('now'))`,
      updatedBy: session.initials,
    }).where(eq(cases.id, caseId));

    // Log status change
    await db.insert(caseHistory).values({
      caseId,
      fieldChanged: 'status',
      oldValue: oldStatus,
      newValue: 'deceased',
      changedBy: session.initials,
    });

    // Create necropsy record
    await db.insert(necropsies).values({
      dateDied,
      vmthId: caseData.caseNumber,
      wrmdId: caseData.wrmdCaseNumber || null,
      species: caseData.species,
      clinicalProblems: caseData.activeProblems,
      results: null,
      isFinal: false,
      necropsyLink: null,
      createdBy: session.initials,
      updatedBy: session.initials,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transfer to necropsy error:', error);
    return NextResponse.json({ error: 'Failed to transfer to necropsy' }, { status: 500 });
  }
}
