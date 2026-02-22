'use client';

import { useRouter } from 'next/navigation';
import type { CaseWithDisplay, Category } from '@/types';
import { URGENCY_CONFIG } from '@/lib/constants';
import UrgencyBadge from './urgency-badge';
import FollowUpIndicator from './follow-up-indicator';
import { formatDateTime } from '@/lib/utils';

export default function CaseTable({ cases, category }: { cases: CaseWithDisplay[]; category?: Category }) {
  const router = useRouter();
  const showLocation = category !== 'ambassador';

  if (cases.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
        <p className="text-slate-500 text-lg">No active cases</p>
        <p className="text-slate-400 text-sm mt-1">
          Click &quot;+ New Case&quot; to add one
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-3"></th>
              <th className="px-3 py-3 text-left font-semibold text-slate-600">Case #</th>
              <th className="px-3 py-3 text-left font-semibold text-slate-600">Species</th>
              {showLocation && <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Location</th>}
              <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Active Problems</th>
              <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Treatments</th>
              <th className="px-3 py-3 text-left font-semibold text-slate-600">Urgency</th>
              <th className="px-3 py-3 text-left font-semibold text-slate-600">Follow-up</th>
              <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden sm:table-cell">Updated</th>
            </tr>
          </thead>
          <tbody>
            {cases.map(c => {
              const config = URGENCY_CONFIG[c.displayUrgency];
              return (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/cases/${c.id}`)}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer border-l-4 ${config.borderColor}`}
                >
                  <td className="px-1 py-3">
                    <span className={`block w-2.5 h-2.5 rounded-full ${config.dotColor} ${c.displayUrgency === 'critical' ? 'animate-pulse' : ''}`} />
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-blue-700 font-medium">
                      {c.caseNumber}
                    </span>
                    {c.commonName && (
                      <div className="text-xs text-slate-400 mt-0.5">{c.commonName}</div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {c.species}
                  </td>
                  {showLocation && (
                    <td className="px-3 py-3 hidden md:table-cell">
                      <div className="text-slate-600">{c.location || '—'}</div>
                    </td>
                  )}
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="max-w-xs truncate text-slate-600" title={c.activeProblems}>
                      {c.activeProblems}
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <div className="max-w-xs truncate text-slate-600" title={c.currentTreatments}>
                      {c.currentTreatments}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <UrgencyBadge urgency={c.displayUrgency} />
                  </td>
                  <td className="px-3 py-3">
                    <FollowUpIndicator status={c.followUpStatus} label={c.followUpLabel} />
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <div className="text-xs text-slate-500">
                      {formatDateTime(c.updatedAt)}
                    </div>
                    <div className="text-xs text-slate-400">
                      by {c.updatedBy}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
