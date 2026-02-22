import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { necropsies } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();
    const results = await db.select().from(necropsies).orderBy(desc(necropsies.updatedAt));
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

    if (!body.vmthId) {
      return NextResponse.json({ error: 'VMACS ID is required' }, { status: 400 });
    }
    if (!body.dateDied) {
      return NextResponse.json({ error: 'Date died/euthanized is required' }, { status: 400 });
    }
    if (!body.species) {
      return NextResponse.json({ error: 'Species is required' }, { status: 400 });
    }

    const result = await db.insert(necropsies).values({
      dateDied: body.dateDied,
      vmthId: body.vmthId,
      wrmdId: body.wrmdId || null,
      species: body.species,
      clinicalProblems: body.clinicalProblems || '',
      results: body.results || null,
      isFinal: body.isFinal || false,
      necropsyLink: body.necropsyLink || null,
      createdBy: session.initials,
      updatedBy: session.initials,
    }).returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create necropsy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to create necropsy record: ${message}` }, { status: 500 });
  }
}
