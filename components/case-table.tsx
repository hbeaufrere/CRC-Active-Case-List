'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { CaseWithDisplay, Category, SortColumn, SortDirection } from '@/types';
import { URGENCY_CONFIG } from '@/lib/constants';
import UrgencyBadge from './urgency-badge';
import FollowUpIndicator from './follow-up-indicator';
import TruncatedCell from './truncated-cell';
import { useCaseSort } from './case-sort-context';
import { formatDateTime, sortCases } from '@/lib/utils';

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <svg className={`inline w-3.5 h-3.5 ml-1 ${active ? 'text-blue-700' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {direction === 'asc' || !active ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={active && direction === 'desc' ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'} />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      )}
    </svg>
  );
}

export default function CaseTable({ cases, category }: { cases: CaseWithDisplay[]; category?: Category }) {
  const router = useRouter();
  // Location and days-in-care are rehab-only concepts.
  const isRehab = category !== 'ambassador';
  const { column, direction, toggleSort } = useCaseSort();

  // Ignore a days-in-care sort carried over from the rehab tab.
  const sortColumn: SortColumn | null = !isRehab && column === 'daysInCare' ? null : column;

  const sortedCases = useMemo(
    () => sortCases(cases, sortColumn, direction),
    [cases, sortColumn, direction]
  );

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

  const sortableThClass = 'px-3 py-3 text-left font-semibold text-slate-600 cursor-pointer select-none hover:text-blue-700 transition-colors';

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-3"></th>
              <th className={sortableThClass} onClick={() => toggleSort('caseNumber')}>
                Case #
                <SortIcon active={sortColumn === 'caseNumber'} direction={direction} />
              </th>
              <th className={`${sortableThClass} hidden sm:table-cell`} onClick={() => toggleSort('wrmdCaseNumber')}>
                WRMD #
                <SortIcon active={sortColumn === 'wrmdCaseNumber'} direction={direction} />
              </th>
              <th className={sortableThClass} onClick={() => toggleSort('species')}>
                Species
                <SortIcon active={sortColumn === 'species'} direction={direction} />
              </th>
              {isRehab && (
                <th className={sortableThClass} onClick={() => toggleSort('daysInCare')} title="Days since intake">
                  Days
                  <SortIcon active={sortColumn === 'daysInCare'} direction={direction} />
                </th>
              )}
              {isRehab && <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Location</th>}
              <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Active Problems</th>
              <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Treatments</th>
              <th className={sortableThClass} onClick={() => toggleSort('urgency')}>
                Urgency
                <SortIcon active={sortColumn === 'urgency'} direction={direction} />
              </th>
              <th className={sortableThClass} onClick={() => toggleSort('followUp')}>
                Follow-up
                <SortIcon active={sortColumn === 'followUp'} direction={direction} />
              </th>
              <th className={`${sortableThClass} hidden sm:table-cell`} onClick={() => toggleSort('updated')}>
                Updated
                <SortIcon active={sortColumn === 'updated'} direction={direction} />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCases.map(c => {
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
                  <td className="px-3 py-3 hidden sm:table-cell text-slate-600">
                    {c.wrmdCaseNumber || '—'}
                  </td>
                  <td className="px-3 py-3">
                    {c.species}
                  </td>
                  {isRehab && (
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                      {c.daysInCare == null ? '—' : `${c.daysInCare}d`}
                    </td>
                  )}
                  {isRehab && (
                    <td className="px-3 py-3 hidden md:table-cell">
                      <div className="text-slate-600">{c.location || '—'}</div>
                    </td>
                  )}
                  <td className="px-3 py-3 hidden md:table-cell">
                    <TruncatedCell text={c.activeProblems} className="max-w-[200px] text-slate-600" />
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <TruncatedCell text={c.currentTreatments} className="max-w-[200px] text-slate-600" />
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
