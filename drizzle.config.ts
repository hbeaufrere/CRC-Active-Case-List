import { defineConfig } from 'drizzle-kit';

const isTurso = process.env.TURSO_DATABASE_URL?.startsWith('libsql://');

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: isTurso ? 'turso' : 'sqlite',
  dbCredentials: isTurso
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      },
});
