import { db } from '@/db';
import { annualExamTests, cases } from '@/db/schema';
import { and, asc, eq, sql } from 'drizzle-orm';

// Annual exams of the ambassador birds: the plan is made in the CRC Control Board and sent here; residents and
// technicians record each item (done / tried, failed / deferred) and a short exam sheet per bird, with their initials.
export const DEFAULT_TESTS = [
  { name: 'Exam at CRC', grp: 'Exams', frequency: 'Every year — birds that do not need hospital work', note: 'Physical exam and weight, on site.' },
  { name: 'Exam at CEAMS', grp: 'Exams', frequency: 'When blood work, X-rays or consults are needed', note: 'Physical exam and weight at the VMTH.' },
  { name: 'WNV booster', grp: 'Preventive', frequency: 'Every year, all birds', note: 'Zoetis killed vaccine: 1 ml; 0.5 ml for birds under 300 g.' },
  { name: 'Fecal float', grp: 'Preventive', frequency: 'Every year, if a sample is obtained', note: '' },
  { name: 'Beak / talon trim', grp: 'Preventive', frequency: 'As needed', note: '' },
  { name: 'CBC + Chem III', grp: 'Diagnostics', frequency: 'Every other year, birds over 5 years', note: '' },
  { name: 'Radiographs', grp: 'Diagnostics', frequency: 'Not routinely more often than every 4 years', note: '' },
  { name: 'Ophthalmology', grp: 'Consults', frequency: 'As indicated', note: '' },
  { name: 'Cardiology (echo)', grp: 'Consults', frequency: 'As indicated', note: '' },
];

export const STATUSES = ['done', 'failed', 'deferred'] as const;

/** Initials in one style everywhere: letters only, upper case ("k.m." → "KM"). */
export function cleanInitials(s: string | null | undefined): string {
  return String(s || '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4);
}

function utcNow(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowsOf = (r: any): any[] => (r?.rows ?? []);

let ready = false;

/** Creates / upgrades the tables the first time they are needed (no manual migration on the hosted database). */
export async function ensureAnnualExamTables() {
  if (ready) return;
  await db.run(sql`CREATE TABLE IF NOT EXISTS annual_exam_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, frequency TEXT, note TEXT, sort INTEGER DEFAULT 0)`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS annual_exam_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT, year TEXT NOT NULL, case_id INTEGER NOT NULL REFERENCES cases(id), test TEXT NOT NULL,
    done_date TEXT, done_by TEXT, note TEXT, updated_at TEXT DEFAULT (datetime('now')))`);
  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS annual_exam_cell ON annual_exam_records (year, case_id, test)`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT)`);
  // v2 (plan → record → review): planned flag and status on each box, a group per item, one exam sheet per bird and year
  for (const stmt of [
    sql`ALTER TABLE annual_exam_records ADD COLUMN planned INTEGER DEFAULT 0`,
    sql`ALTER TABLE annual_exam_records ADD COLUMN status TEXT DEFAULT ''`,
    sql`ALTER TABLE annual_exam_records ADD COLUMN abnormal INTEGER DEFAULT 0`,
    sql`ALTER TABLE annual_exam_tests ADD COLUMN grp TEXT DEFAULT ''`,
  ]) {
    try { await db.run(stmt); } catch { /* column already there */ }
  }
  await db.run(sql`CREATE TABLE IF NOT EXISTS annual_exam_sheets (
    year TEXT NOT NULL, case_id INTEGER NOT NULL REFERENCES cases(id), plan_note TEXT DEFAULT '', prev_weight TEXT DEFAULT '',
    weight_g TEXT DEFAULT '', bcs TEXT DEFAULT '', findings TEXT DEFAULT '', abnormal INTEGER DEFAULT 0, exam_date TEXT DEFAULT '',
    done_by TEXT DEFAULT '', updated_at TEXT DEFAULT '', PRIMARY KEY (year, case_id))`);
  const n = await db.select({ c: sql<number>`COUNT(*)` }).from(annualExamTests);
  if (!Number(n[0]?.c)) {
    for (const [i, t] of DEFAULT_TESTS.entries()) {
      await db.run(sql`INSERT INTO annual_exam_tests (name, grp, frequency, note, sort) VALUES (${t.name}, ${t.grp}, ${t.frequency}, ${t.note}, ${i})`);
    }
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
  const tests = rowsOf(await db.run(sql`SELECT id, name, grp, frequency, note FROM annual_exam_tests ORDER BY sort, id`))
    .map(r => ({ id: Number(r.id), name: String(r.name), group: String(r.grp || ''), frequency: (r.frequency as string) || '', note: (r.note as string) || '' }));
  const birds = await db
    .select({ id: cases.id, caseNumber: cases.caseNumber, name: cases.commonName, species: cases.species, location: cases.location })
    .from(cases)
    .where(and(eq(cases.category, 'ambassador'), sql`${cases.status} IN ('active', 'permanent')`))
    .orderBy(asc(cases.commonName));
  const records = rowsOf(await db.run(sql`SELECT case_id, test, done_date, done_by, note, planned, status, abnormal, updated_at
    FROM annual_exam_records WHERE year = ${year}`)).map(r => ({
      caseId: Number(r.case_id), test: String(r.test), doneDate: (r.done_date as string) || null, doneBy: (r.done_by as string) || null,
      note: (r.note as string) || null, planned: !!Number(r.planned), status: String(r.status || (r.done_date ? 'done' : '')),
      abnormal: !!Number(r.abnormal), updatedAt: String(r.updated_at || '') }));
  const sheets = rowsOf(await db.run(sql`SELECT * FROM annual_exam_sheets WHERE year = ${year}`)).map(r => ({
    caseId: Number(r.case_id), planNote: String(r.plan_note || ''), prevWeightG: String(r.prev_weight || ''), weightG: String(r.weight_g || ''),
    bcs: String(r.bcs || ''), findings: String(r.findings || ''), abnormal: !!Number(r.abnormal), examDate: String(r.exam_date || ''),
    doneBy: String(r.done_by || ''), updatedAt: String(r.updated_at || '') }));
  const lot = rowsOf(await db.run(sql`SELECT value FROM app_settings WHERE key = ${'annual_wnv_lot_' + year}`))[0];
  return { year, tests, birds, records, sheets, wnvLot: lot ? String(lot.value ?? '') : '' };
}

/** A box recorded by someone logged in (status '' clears it; the plan flag is left alone). */
export async function recordAnnualExamCell(year: string, caseId: number, test: string, status: string, doneDate: string | null,
  doneBy: string, note: string | null, abnormal: boolean) {
  await ensureAnnualExamTables();
  const st = (STATUSES as readonly string[]).includes(status) ? status : '';
  await db.run(sql`INSERT INTO annual_exam_records (year, case_id, test, done_date, done_by, note, status, abnormal, planned, updated_at)
    VALUES (${year}, ${caseId}, ${test}, ${st ? doneDate : null}, ${st ? cleanInitials(doneBy) : ''}, ${note}, ${st}, ${st && abnormal ? 1 : 0}, 0, ${utcNow()})
    ON CONFLICT(year, case_id, test) DO UPDATE SET done_date=excluded.done_date, done_by=excluded.done_by, note=excluded.note,
    status=excluded.status, abnormal=excluded.abnormal, updated_at=excluded.updated_at`);
}

/** The bird's exam sheet for the year (weight, body condition, findings), recorded by someone logged in. */
export async function recordAnnualExamSheet(year: string, caseId: number,
  f: { weightG?: string; bcs?: string; findings?: string; abnormal?: boolean; examDate?: string }, doneBy: string) {
  await ensureAnnualExamTables();
  await db.run(sql`INSERT INTO annual_exam_sheets (year, case_id, weight_g, bcs, findings, abnormal, exam_date, done_by, updated_at)
    VALUES (${year}, ${caseId}, ${f.weightG || ''}, ${f.bcs || ''}, ${f.findings || ''}, ${f.abnormal ? 1 : 0}, ${f.examDate || ''}, ${cleanInitials(doneBy)}, ${utcNow()})
    ON CONFLICT(year, case_id) DO UPDATE SET weight_g=excluded.weight_g, bcs=excluded.bcs, findings=excluded.findings,
    abnormal=excluded.abnormal, exam_date=excluded.exam_date, done_by=excluded.done_by, updated_at=excluded.updated_at`);
}

export async function setWnvLot(year: string, lot: string) {
  await ensureAnnualExamTables();
  await db.run(sql`INSERT INTO app_settings (key, value) VALUES (${'annual_wnv_lot_' + year}, ${lot.slice(0, 40)})
    ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
}

type SyncCell = { caseNumber: string; test: string; planned?: boolean; status?: string; doneDate?: string; doneBy?: string; note?: string; abnormal?: boolean; updatedAt?: string };
type SyncSheet = { caseNumber: string; planNote?: string; prevWeightG?: string; weightG?: string; bcs?: string; findings?: string; abnormal?: boolean; examDate?: string; doneBy?: string; updatedAt?: string };

/** From the CRC Control Board. The plan (planned flag, plan note, previous weight) always follows the Control Board;
 *  recorded fields are applied only when the Control Board's change is newer, so nothing recorded here is lost. */
export async function applySync(year: string, cells: SyncCell[], sheets: SyncSheet[]) {
  await ensureAnnualExamTables();
  const birds = await db.select({ id: cases.id, caseNumber: cases.caseNumber }).from(cases).where(eq(cases.category, 'ambassador'));
  const byNo = new Map(birds.map(b => [String(b.caseNumber || '').replace(/\D/g, ''), b.id]));
  const unmatched = new Set<string>();
  let applied = 0;
  for (const c of cells) {
    const id = byNo.get(String(c.caseNumber || '').replace(/\D/g, ''));
    if (!id || !c.test) { unmatched.add(String(c.caseNumber)); continue; }
    await db.run(sql`INSERT INTO annual_exam_records (year, case_id, test, planned, status, updated_at) VALUES (${year}, ${id}, ${c.test}, ${c.planned ? 1 : 0}, '', '')
      ON CONFLICT(year, case_id, test) DO UPDATE SET planned = excluded.planned`);
    if (c.status !== undefined) {
      const st = (STATUSES as readonly string[]).includes(c.status || '') ? (c.status as string) : '';
      const when = (c.updatedAt || utcNow()).slice(0, 19).replace('T', ' ');
      await db.run(sql`UPDATE annual_exam_records SET status=${st}, done_date=${st ? c.doneDate || null : null}, done_by=${st ? cleanInitials(c.doneBy) : ''},
        note=${c.note || null}, abnormal=${st && c.abnormal ? 1 : 0}, updated_at=${when}
        WHERE year=${year} AND case_id=${id} AND test=${c.test} AND COALESCE(updated_at, '') <= ${when}`);
    }
    applied++;
  }
  for (const s of sheets) {
    const id = byNo.get(String(s.caseNumber || '').replace(/\D/g, ''));
    if (!id) { unmatched.add(String(s.caseNumber)); continue; }
    await db.run(sql`INSERT INTO annual_exam_sheets (year, case_id, updated_at) VALUES (${year}, ${id}, '') ON CONFLICT(year, case_id) DO NOTHING`);
    if (s.planNote !== undefined) await db.run(sql`UPDATE annual_exam_sheets SET plan_note=${s.planNote} WHERE year=${year} AND case_id=${id}`);
    if (s.prevWeightG !== undefined) await db.run(sql`UPDATE annual_exam_sheets SET prev_weight=${s.prevWeightG} WHERE year=${year} AND case_id=${id}`);
    if (s.updatedAt && s.weightG !== undefined) {
      const when = s.updatedAt.slice(0, 19).replace('T', ' ');
      await db.run(sql`UPDATE annual_exam_sheets SET weight_g=${s.weightG || ''}, bcs=${s.bcs || ''}, findings=${s.findings || ''}, abnormal=${s.abnormal ? 1 : 0},
        exam_date=${s.examDate || ''}, done_by=${cleanInitials(s.doneBy)}, updated_at=${when}
        WHERE year=${year} AND case_id=${id} AND COALESCE(updated_at, '') <= ${when}`);
    }
    applied++;
  }
  return { applied, unmatched: [...unmatched] };
}

export async function replaceAnnualExamTests(tests: { name: string; group?: string; frequency?: string; note?: string }[]) {
  await ensureAnnualExamTables();
  const clean = tests.filter(t => t.name && t.name.trim());
  if (!clean.length) return;
  await db.delete(annualExamTests);
  for (const [i, t] of clean.entries()) {
    await db.run(sql`INSERT INTO annual_exam_tests (name, grp, frequency, note, sort)
      VALUES (${t.name.trim()}, ${t.group?.trim() || ''}, ${t.frequency?.trim() || ''}, ${t.note?.trim() || ''}, ${i})`);
  }
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
