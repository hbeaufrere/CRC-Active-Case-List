import { db } from '@/db';
import { cases, caseHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { enrichCaseWithDisplay, formatDateTime, formatDate } from '@/lib/utils';
import { URGENCY_CONFIG, STATUS_CONFIG } from '@/lib/constants';
import type { Case, CaseHistory as CaseHistoryType } from '@/types';
import Navbar from '@/components/navbar';
import UrgencyBadge from '@/components/urgency-badge';
import FollowUpIndicator from '@/components/follow-up-indicator';
import CaseHistoryLog from '@/components/case-history-log';
import Link from 'next/link';
import DeleteCaseButton from '@/components/delete-case-button';

export const dynamic = 'force-dynamic';

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { id } = await params;
  const caseId = parseInt(id, 10);

  const caseResult = await db.select().from(cases).where(eq(cases.id, caseId));
  if (caseResult.length === 0) notFound();

  const caseData = caseResult[0] as Case;
  const enriched = enrichCaseWithDisplay(caseData);

  const history = await db
    .select()
    .from(caseHistory)
    .where(eq(caseHistory.caseId, caseId))
    .orderBy(desc(caseHistory.changedAt));

  const statusConfig = STATUS_CONFIG[caseData.status];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar initials={session.initials} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-blue-700 hover:text-blue-900">
            &larr; Back to Dashboard
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {caseData.caseNumber}
                {caseData.commonName && (
                  <span className="text-slate-400 font-normal ml-2">&mdash; {caseData.commonName}</span>
                )}
              </h1>
              <p className="text-lg text-slate-600">{caseData.species}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/cases/${caseId}/edit`}
                className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
              >
                Edit Case
              </Link>
              <DeleteCaseButton caseId={caseId} />
            </div>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-3 mb-6">
          <UrgencyBadge urgency={enriched.displayUrgency} />
          <FollowUpIndicator status={enriched.followUpStatus} label={enriched.followUpLabel} />
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
            {caseData.category === 'rehab' ? 'Rehabilitation' : 'Ambassador'}
          </span>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Active Problems</h2>
            <p className="text-slate-700 whitespace-pre-wrap">{caseData.activeProblems}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Current Treatments</h2>
            <p className="text-slate-700 whitespace-pre-wrap">{caseData.currentTreatments}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Plan/Follow-up</h2>
            <p className="text-slate-700 whitespace-pre-wrap">{caseData.plan}</p>
            {caseData.nextFollowUpDate && (
              <p className="text-slate-500 text-sm mt-2">Next follow-up: {formatDate(caseData.nextFollowUpDate)}</p>
            )}
          </div>
          {caseData.otherNotes && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Other Notes</h2>
              <p className="text-slate-700 whitespace-pre-wrap">{caseData.otherNotes}</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {caseData.category !== 'ambassador' && (
              <div>
                <span className="text-slate-500">Intake Date</span>
                <p className="text-slate-700 font-medium">{formatDate(caseData.intakeDate) || 'N/A'}</p>
              </div>
            )}
            {caseData.category !== 'ambassador' && (
              <div>
                <span className="text-slate-500">Intake Reason</span>
                <p className="text-slate-700 font-medium">{caseData.intakeReason || 'N/A'}</p>
              </div>
            )}
            <div>
              <span className="text-slate-500">WRMD #</span>
              <p className="text-slate-700 font-medium">{caseData.wrmdCaseNumber || 'N/A'}</p>
            </div>
            {caseData.category !== 'ambassador' && (
              <div>
                <span className="text-slate-500">Location</span>
                <p className="text-slate-700 font-medium">{caseData.location || 'N/A'}</p>
              </div>
            )}
            <div>
              <span className="text-slate-500">Created By</span>
              <p className="text-slate-700 font-medium">{caseData.createdBy}</p>
            </div>
          </div>
          {caseData.externalLink && (
            <div className="border-t border-slate-100 mt-4 pt-3">
              <span className="text-slate-500 text-sm">External System Link</span>
              <p className="mt-1">
                <a
                  href={caseData.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:text-blue-900 underline text-sm break-all"
                >
                  {caseData.externalLink}
                </a>
              </p>
            </div>
          )}
          <div className="border-t border-slate-100 mt-4 pt-3 text-xs text-slate-400">
            Last updated: {formatDateTime(caseData.updatedAt)} by {caseData.updatedBy}
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Change History</h2>
          <CaseHistoryLog history={history as CaseHistoryType[]} />
        </div>
      </main>
    </div>
  );
}
