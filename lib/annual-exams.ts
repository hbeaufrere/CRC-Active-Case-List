import { db } from '@/db';
import { annualExamTests, annualExamRecords, cases } from '@/db/schema';
import { and, asc, eq, sql } from 'drizzle-orm';

// The CRC "long term plan" for resident birds (shared annual exam workbook, 2026). Editable on the Annual exams tab.
export const DEFAULT_TESTS = [
  { name: 'Physical exam and weight', frequency: 'Every year, all resident birds', note: '' },
  { name: 'WNV booster', frequency: 'Every year, all birds', note: 'Zoetis killed vaccine: 1 ml; 0.5 ml for birds under 300 g.' },
  { name: 'Fecal float', frequency: 'Every year, if a sample is obtained', note: 'Processed by a student, resident or technician.' },
  { name: 'CBC and Chem III', frequency: 'Every other year, birds over 5 years', note: 'Birds split into two groups that alternate years.' },
  { name: 'Radiographs', frequency: "Clinician's discretion — not routinely more often than every 4 years", note: 'If the bird comes in for radiographs, do any consults at the same visit.' },
  { name: 'Consults', frequency: 'As indicated (ophthalmology, cardiology…)', note: '' },
];

let ready = false;

/** Creates the two tables the first time they are needed (no manual migration on the hosted database). */
export async function ensureAnnualExamTables() {
  if (ready) return;
  await db.run(sql`CREATE TABLE IF NOT EXISTS annual_exam_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, frequency TEXT, note TEXT, sort INTEGER DEFAULT 0)`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS annual_exam_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT, year TEXT NOT NULL, case_id INTEGER NOT NULL REFERENCES cases(id), test TEXT NOT NULL,
    done_date TEXT, done_by TEXT, note TEXT, updated_at TEXT DEFAULT (datetime('now')))`);
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS annual_exam_cell ON annual_exam_records (year, case_id, test)`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT)`);
  const n = await db.select({ c: sql<number>`COUNT(*)` }).from(annualExamTests);
  if (!Number(n[0]?.c)) {
    await db.insert(annualExamTests).values(DEFAULT_TESTS.map((t, i) => ({ ...t, sort: i })));
  }
  ready = true;
}

/** Academic year July–June, e.g. 2026-27 (annual exams usually run January–March). */
export function academicYear(d = new Date()): string {
  const y = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String(y + 1).slice(2)}`;
}

export async function getAnnualExamGrid(year: string) {
  await ensureAnnualExamTables();
  const tests = await db.select().from(annualExamTests).orderBy(asc(annualExamTests.sort), asc(annualExamTests.id));
  const birds = await db
    .select({ id: cases.id, caseNumber: cases.caseNumber, name: cases.commonName, species: cases.species, location: cases.location })
    .from(cases)
    .where(and(eq(cases.category, 'ambassador'), sql`${cases.status} IN ('active', 'permanent')`))
    .orderBy(asc(cases.commonName));
  const records = await db.select().from(annualExamRecords).where(eq(annualExamRecords.year, year));
  return { year, tests, birds, records };
}

export async function setAnnualExamCell(year: string, caseId: number, test: string, doneDate: string | null, doneBy: string, note: string | null) {
  await ensureAnnualExamTables();
  await db.run(sql`INSERT INTO annual_exam_records (year, case_id, test, done_date, done_by, note, updated_at)
    VALUES (${year}, ${caseId}, ${test}, ${doneDate}, ${doneBy}, ${note}, datetime('now'))
    ON CONFLICT(year, case_id, test) DO UPDATE SET done_date=excluded.done_date, done_by=excluded.done_by,
    note=excluded.note, updated_at=excluded.updated_at`);
}

export async function replaceAnnualExamTests(tests: { name: string; frequency?: string; note?: string }[]) {
  await ensureAnnualExamTables();
  const clean = tests.filter(t => t.name && t.name.trim()).map((t, i) => ({ name: t.name.trim(), frequency: t.frequency?.trim() || '', note: t.note?.trim() || '', sort: i }));
  if (!clean.length) return;
  await db.delete(annualExamTests);
  await db.insert(annualExamTests).values(clean);
}


// ── On/off switch and the link with the CRC Control Board ─────────────────────────────────────────
// The Annual exams section is OFF (hidden from users) until switched on from the Control Board.

/** True when the request comes from the CRC Control Board (Authorization: Bearer <ANNUAL_EXAM_SYNC_TOKEN>). */
export function isSyncRequest(request: Request): boolean {
  const token = process.env.ANNUAL_EXAM_SYNC_TOKEN;
  return !!token && request.headers.get('authorization') === `Bearer ${token}`;
}

export async function annualExamsEnabled(): Promise<boolean> {
  try {
    await ensureAnnualExamTables();
    const r = await db.run(sql`SELECT value FROM app_settings WHERE key = 'annual_exams_enabled'`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = (r as any).rows?.[0];
    return !!row && String(row.value ?? row[0]) === '1';
  } catch {
    return false;
  }
}

export async function setAnnualExamsEnabled(on: boolean) {
  await ensureAnnualExamTables();
  await db.run(sql`INSERT INTO app_settings (key, value) VALUES ('annual_exams_enabled', ${on ? '1' : '0'})
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
}
