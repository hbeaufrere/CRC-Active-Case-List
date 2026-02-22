import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cases, caseHistory } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import type { Category, Status, Urgency } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as Category | null;
    const status = searchParams.get('status') as Status | null;
    const urgency = searchParams.get('urgency') as Urgency | null;
    const search = searchParams.get('search');

    const conditions = [];
    if (category) conditions.push(eq(cases.category, category));
    if (status) {
      conditions.push(eq(cases.status, status));
    } else {
      // Default: show active and permanent cases
      conditions.push(
        sql`${cases.status} IN ('active', 'permanent')`
      );
    }
    if (urgency) conditions.push(eq(cases.urgency, urgency));
    if (search) {
      conditions.push(
        sql`(${cases.caseNumber} LIKE ${`%${search}%`} OR ${cases.wrmdCaseNumber} LIKE ${`%${search}%`} OR ${cases.species} LIKE ${`%${search}%`} OR ${cases.commonName} LIKE ${`%${search}%`} OR ${cases.activeProblems} LIKE ${`%${search}%`} OR ${cases.currentTreatments} LIKE ${`%${search}%`} OR ${cases.plan} LIKE ${`%${search}%`})`
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const results = await db.select().from(cases).where(where).orderBy(desc(cases.updatedAt));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const caseNumber = body.caseNumber;
    if (!caseNumber) {
      return NextResponse.json({ error: 'Case number is required' }, { status: 400 });
    }

    // Check for duplicate case number
    const existing = await db.select({ id: cases.id }).from(cases).where(eq(cases.caseNumber, caseNumber));
    if (existing.length > 0) {
      return NextResponse.json({ error: `Case number "${caseNumber}" already exists` }, { status: 409 });
    }

    const result = await db.insert(cases).values({
      caseNumber,
      category: body.category || 'rehab',
      species: body.species || '',
      commonName: body.commonName || null,
      bandNumber: body.bandNumber || null,
      wrmdCaseNumber: body.wrmdCaseNumber || null,
      location: body.location || null,
      activeProblems: body.activeProblems || '',
      currentTreatments: body.currentTreatments || '',
      plan: body.plan || '',
      nextFollowUpDate: body.nextFollowUpDate || null,
      followUpNotes: body.followUpNotes || null,
      otherNotes: body.otherNotes || null,
      status: body.status || 'active',
      urgency: body.urgency || 'moderate',
      intakeDate: body.intakeDate || null,
      intakeReason: body.intakeReason || null,
      externalLink: body.externalLink || null,
      updatedBy: session.initials,
      createdBy: session.initials,
    }).returning();

    const newCase = result[0];

    // Log creation in history
    await db.insert(caseHistory).values({
      caseId: newCase.id,
      fieldChanged: 'case_created',
      newValue: caseNumber,
      changedBy: session.initials,
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error('Create case error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('UNIQUE') || message.includes('unique')) {
      return NextResponse.json({ error: 'A case with this number already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: `Failed to create case: ${message}` }, { status: 500 });
  }
}
