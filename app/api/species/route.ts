import { NextResponse } from 'next/server';
import { db } from '@/db';
import { species } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await requireAuth();
    const allSpecies = await db.select().from(species).orderBy(asc(species.commonName));
    return NextResponse.json(allSpecies);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
