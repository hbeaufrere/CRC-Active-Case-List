import { db } from '@/db';
import { cases, caseHistory, necropsies } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { enrichCaseWithDisplay, sortCasesByAttention } from '@/lib/utils';
import type { Case, Category, Urgency, StatusChangeEntry } from '@/types';
import Navbar from '@/components/navbar';
import CaseTable from '@/components/case-table';
import DashboardTabs from '@/components/dashboard-tabs';
import SearchFilterBar from '@/components/search-filter-bar';
import SummaryStats from '@/components/summary-stats';
import RecentStatusChanges from '@/components/recent-status-changes';
import NecropsyTab from '@/components/necropsy-tab';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tab?: string; search?: string; urgency?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const activeTab = params.tab || params.category || 'rehab';
  const category = (params.category as Category) || 'rehab';
  const search = params.search || '';
  const urgencyFilter = params.urgency as Urgency | undefined;

  // Build query conditions for case lists
  const conditions = [
    eq(cases.category, category),
    sql`${cases.status} IN ('active', 'permanent')`,
  ];

  if (urgencyFilter) {
    conditions.push(eq(cases.urgency, urgencyFilter));
  }

  if (search) {
    conditions.push(
      sql`(${cases.caseNumber} LIKE ${`%${search}%`} OR ${cases.wrmdCaseNumber} LIKE ${`%${search}%`} OR ${cases.species} LIKE ${`%${search}%`} OR ${cases.commonName} LIKE ${`%${search}%`} OR ${cases.activeProblems} LIKE ${`%${search}%`} OR ${cases.currentTreatments} LIKE ${`%${search}%`} OR ${cases.plan} LIKE ${`%${search}%`})`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allCases: any[] = [];
  let rehabCountNum = 0;
  let ambassadorCountNum = 0;
  let statusChanges: StatusChangeEntry[] = [];
  let necropsyCountNum = 0;

  try {
    allCases = await db.select().from(cases).where(and(...conditions));
  } catch (error) {
    console.error('Failed to fetch cases:', error);
  }

  try {
    // Get counts for tabs (unfiltered)
    const rehabCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(cases)
      .where(and(eq(cases.category, 'rehab'), sql`${cases.status} IN ('active', 'permanent')`));

    const ambassadorCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(cases)
      .where(and(eq(cases.category, 'ambassador'), sql`${cases.status} IN ('active', 'permanent')`));

    rehabCountNum = Number(rehabCount[0]?.count) || 0;
    ambassadorCountNum = Number(ambassadorCount[0]?.count) || 0;
  } catch (error) {
    console.error('Failed to fetch case counts:', error);
  }

  try {
    // Get recent status changes (last 10 cases changed to non-active)
    const recentStatusChanges = await db
      .select({
        caseId: caseHistory.caseId,
        caseNumber: cases.caseNumber,
        species: cases.species,
        commonName: cases.commonName,
        oldValue: caseHistory.oldValue,
        newValue: caseHistory.newValue,
        changedBy: caseHistory.changedBy,
        changedAt: caseHistory.changedAt,
      })
      .from(caseHistory)
      .innerJoin(cases, eq(caseHistory.caseId, cases.id))
      .where(
        and(
          eq(caseHistory.fieldChanged, 'status'),
          sql`${caseHistory.newValue} NOT IN ('active', 'permanent')`
        )
      )
      .orderBy(desc(caseHistory.changedAt))
      .limit(10);

    statusChanges = recentStatusChanges.map(r => ({
      caseId: r.caseId,
      caseNumber: r.caseNumber,
      species: r.species,
      commonName: r.commonName,
      oldStatus: r.oldValue,
      newStatus: r.newValue,
      changedBy: r.changedBy,
      changedAt: r.changedAt,
    }));
  } catch (error) {
    console.error('Failed to fetch recent status changes:', error);
  }

  try {
    // Get necropsy count
    const necropsyCountResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(necropsies);
    necropsyCountNum = Number(necropsyCountResult[0]?.count) || 0;
  } catch (error) {
    console.error('Failed to fetch necropsy count:', error);
  }

  const enrichedCases = allCases.map(c => enrichCaseWithDisplay(c as Case));
  const sortedCases = sortCasesByAttention(enrichedCases);

  const isCaseTab = activeTab === 'rehab' || activeTab === 'ambassador';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar initials={session.initials} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <DashboardTabs
            rehabCount={rehabCountNum}
            ambassadorCount={ambassadorCountNum}
            recentCount={statusChanges.length}
            necropsyCount={necropsyCountNum}
          />
          {isCaseTab && (
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors no-print"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Case
            </Link>
          )}
        </div>

        {/* Tab content */}
        {isCaseTab && (
          <>
            {/* Summary stats */}
            <div className="mb-4">
              <SummaryStats cases={sortedCases} />
            </div>

            {/* Search and filters */}
            <div className="mb-4 no-print">
              <SearchFilterBar />
            </div>

            {/* Case table */}
            <CaseTable cases={sortedCases} category={category} />
          </>
        )}

        {activeTab === 'recent' && (
          <RecentStatusChanges changes={statusChanges} />
        )}

        {activeTab === 'necropsies' && (
          <NecropsyTab />
        )}
      </main>
    </div>
  );
}
