import { db } from '@/db';
import { cases } from '@/db/schema';
import { eq, and, like, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { enrichCaseWithDisplay, sortCasesByAttention } from '@/lib/utils';
import type { Case, Category, Urgency } from '@/types';
import Navbar from '@/components/navbar';
import CaseTable from '@/components/case-table';
import DashboardTabs from '@/components/dashboard-tabs';
import SearchFilterBar from '@/components/search-filter-bar';
import SummaryStats from '@/components/summary-stats';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; urgency?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const category = (params.category as Category) || 'rehab';
  const search = params.search || '';
  const urgencyFilter = params.urgency as Urgency | undefined;

  // Build query conditions
  const conditions = [
    eq(cases.category, category),
    sql`${cases.status} IN ('active', 'permanent')`,
  ];

  if (urgencyFilter) {
    conditions.push(eq(cases.urgency, urgencyFilter));
  }

  if (search) {
    conditions.push(
      sql`(${cases.caseNumber} LIKE ${`%${search}%`} OR ${cases.species} LIKE ${`%${search}%`} OR ${cases.commonName} LIKE ${`%${search}%`} OR ${cases.activeProblems} LIKE ${`%${search}%`} OR ${cases.currentTreatments} LIKE ${`%${search}%`} OR ${cases.plan} LIKE ${`%${search}%`})`
    );
  }

  const allCases = await db.select().from(cases).where(and(...conditions));

  // Get counts for tabs (unfiltered)
  const rehabCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(cases)
    .where(and(eq(cases.category, 'rehab'), sql`${cases.status} IN ('active', 'permanent')`));

  const ambassadorCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(cases)
    .where(and(eq(cases.category, 'ambassador'), sql`${cases.status} IN ('active', 'permanent')`));

  const enrichedCases = allCases.map(c => enrichCaseWithDisplay(c as Case));
  const sortedCases = sortCasesByAttention(enrichedCases);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar initials={session.initials} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <DashboardTabs
            rehabCount={Number(rehabCount[0]?.count) || 0}
            ambassadorCount={Number(ambassadorCount[0]?.count) || 0}
          />
          <Link
            href="/cases/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 text-white text-sm font-medium rounded-lg hover:bg-amber-800 transition-colors no-print"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Case
          </Link>
        </div>

        {/* Summary stats */}
        <div className="mb-4">
          <SummaryStats cases={sortedCases} />
        </div>

        {/* Search and filters */}
        <div className="mb-4 no-print">
          <SearchFilterBar />
        </div>

        {/* Case table */}
        <CaseTable cases={sortedCases} />
      </main>
    </div>
  );
}
