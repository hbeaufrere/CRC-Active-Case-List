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
  try {
    const session = await requireAuth();
    const body = await request.json();

    const caseNumber = body.caseNumber;
    if (!caseNumber) {
      return NextResponse.json({ error: 'Case number is required' }, { status: 400 });
    }

    const result = await db.insert(cases).values({
      caseNumber,
      category: body.category,
      species: body.species,
      commonName: body.commonName || null,
      bandNumber: body.bandNumber || null,
      wrmdCaseNumber: body.wrmdCaseNumber || null,
      location: body.location || null,
      activeProblems: body.activeProblems,
      currentTreatments: body.currentTreatments,
      plan: body.plan,
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

    // Log creation in history
    await db.insert(caseHistory).values({
      caseId: result[0].id,
      fieldChanged: 'case_created',
      newValue: caseNumber,
      changedBy: session.initials,
    });

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create case error:', error);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}
