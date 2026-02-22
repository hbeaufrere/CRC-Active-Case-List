import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { necropsies } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  let session;
  try {
    session = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const necropsyId = parseInt(id, 10);
    const body = await request.json();

    const existing = await db.select().from(necropsies).where(eq(necropsies.id, necropsyId));
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Necropsy record not found' }, { status: 404 });
    }

    await db.update(necropsies).set({
      dateDied: body.dateDied,
      vmthId: body.vmthId,
      wrmdId: body.wrmdId || null,
      species: body.species,
      clinicalProblems: body.clinicalProblems || '',
      results: body.results || null,
      isFinal: body.isFinal || false,
      necropsyLink: body.necropsyLink || null,
      updatedBy: session.initials,
      updatedAt: sql`(datetime('now'))`,
    }).where(eq(necropsies.id, necropsyId));

    const updated = await db.select().from(necropsies).where(eq(necropsies.id, necropsyId));
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Update necropsy error:', error);
    return NextResponse.json({ error: 'Failed to update necropsy record' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const necropsyId = parseInt(id, 10);

    const existing = await db.select().from(necropsies).where(eq(necropsies.id, necropsyId));
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Necropsy record not found' }, { status: 404 });
    }

    await db.delete(necropsies).where(eq(necropsies.id, necropsyId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete necropsy error:', error);
    return NextResponse.json({ error: 'Failed to delete necropsy record' }, { status: 500 });
  }
}
