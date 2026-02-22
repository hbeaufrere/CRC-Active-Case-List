import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const cases = sqliteTable('cases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  caseNumber: text('case_number').notNull().unique(),
  category: text('category').notNull().$type<'rehab' | 'ambassador'>(),
  species: text('species').notNull(),
  commonName: text('common_name'),
  bandNumber: text('band_number'),
  activeProblems: text('active_problems').notNull(),
  currentTreatments: text('current_treatments').notNull(),
  plan: text('plan').notNull(),
  nextFollowUpDate: text('next_follow_up_date'),
  followUpNotes: text('follow_up_notes'),
  status: text('status').notNull().$type<'active' | 'released' | 'deceased' | 'transferred' | 'permanent'>().default('active'),
  urgency: text('urgency').notNull().$type<'critical' | 'high' | 'moderate' | 'stable' | 'routine'>().default('moderate'),
  intakeDate: text('intake_date'),
  intakeReason: text('intake_reason'),
  wrmdCaseNumber: text('wrmd_case_number'),
  location: text('location'),
  otherNotes: text('other_notes'),
  externalLink: text('external_link'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  updatedBy: text('updated_by').notNull(),
  createdBy: text('created_by').notNull(),
});

export const caseHistory = sqliteTable('case_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  caseId: integer('case_id').notNull().references(() => cases.id),
  fieldChanged: text('field_changed').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  changedBy: text('changed_by').notNull(),
  changedAt: text('changed_at').default(sql`(datetime('now'))`),
  note: text('note'),
});

export const species = sqliteTable('species', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  commonName: text('common_name').notNull().unique(),
  scientificName: text('scientific_name'),
});

export const necropsies = sqliteTable('necropsies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dateDied: text('date_died').notNull(),
  vmthId: text('vmth_id').notNull(),
  wrmdId: text('wrmd_id'),
  species: text('species').notNull(),
  clinicalProblems: text('clinical_problems').notNull(),
  results: text('results'),
  isFinal: integer('is_final', { mode: 'boolean' }).default(false),
  necropsyLink: text('necropsy_link'),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedBy: text('updated_by').notNull(),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  initials: text('initials').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  expiresAt: text('expires_at').notNull(),
});
