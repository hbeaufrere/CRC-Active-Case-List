import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cases, caseHistory } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireAuth();
    const { id } = await params;
    const caseId = parseInt(id, 10);

    const caseResult = await db.select().from(cases).where(eq(cases.id, caseId));
    if (caseResult.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const history = await db
      .select()
      .from(caseHistory)
      .where(eq(caseHistory.caseId, caseId))
      .orderBy(desc(caseHistory.changedAt));

    return NextResponse.json({ case: caseResult[0], history });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const caseId = parseInt(id, 10);
    const body = await request.json();

    // Fetch current case for diff
    const currentResult = await db.select().from(cases).where(eq(cases.id, caseId));
    if (currentResult.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    const current = currentResult[0];

    // Build update object and track changes
    const updates: Record<string, unknown> = {
      updatedAt: sql`(datetime('now'))`,
      updatedBy: session.initials,
    };

    const fieldsToTrack = [
      'species', 'commonName', 'bandNumber', 'wrmdCaseNumber', 'location',
      'activeProblems', 'currentTreatments', 'plan', 'nextFollowUpDate',
      'followUpNotes', 'otherNotes',
      'status', 'urgency', 'intakeDate', 'intakeReason', 'category', 'externalLink',
    ] as const;

    const historyEntries: { caseId: number; fieldChanged: string; oldValue: string | null; newValue: string | null; changedBy: string }[] = [];

    for (const field of fieldsToTrack) {
      if (field in body && body[field] !== current[field]) {
        updates[field] = body[field] ?? null;
        historyEntries.push({
          caseId,
          fieldChanged: field,
          oldValue: current[field] != null ? String(current[field]) : null,
          newValue: body[field] != null ? String(body[field]) : null,
          changedBy: session.initials,
        });
      }
    }

    if (Object.keys(updates).length <= 2) {
      // Only updatedAt and updatedBy — nothing actually changed
      return NextResponse.json(current);
    }

    await db.update(cases).set(updates).where(eq(cases.id, caseId));

    // Log changes
    for (const entry of historyEntries) {
      await db.insert(caseHistory).values(entry);
    }

    const updated = await db.select().from(cases).where(eq(cases.id, caseId));
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Update case error:', error);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const caseId = parseInt(id, 10);

    const caseResult = await db.select().from(cases).where(eq(cases.id, caseId));
    if (caseResult.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Log deletion
    await db.insert(caseHistory).values({
      caseId,
      fieldChanged: 'case_deleted',
      oldValue: caseResult[0].caseNumber,
      changedBy: session.initials,
    });

    await db.delete(caseHistory).where(eq(caseHistory.caseId, caseId));
    await db.delete(cases).where(eq(cases.id, caseId));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 });
  }
}
