import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { SPECIES_LIST } from '../lib/constants';

async function seed() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const db = drizzle(client, { schema });

  console.log('Seeding species table...');
  for (const s of SPECIES_LIST) {
    await db.insert(schema.species).values({
      commonName: s.commonName,
      scientificName: s.scientificName,
    }).onConflictDoNothing();
  }
  console.log(`Seeded ${SPECIES_LIST.length} species.`);

  client.close();
}

seed().catch(console.error);
