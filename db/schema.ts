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

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  initials: text('initials').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  expiresAt: text('expires_at').notNull(),
});
