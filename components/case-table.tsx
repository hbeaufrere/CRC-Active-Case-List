'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { CaseWithDisplay, Category } from '@/types';
import { URGENCY_CONFIG, URGENCY_ORDER } from '@/lib/constants';
import UrgencyBadge from './urgency-badge';
import FollowUpIndicator from './follow-up-indicator';
import TruncatedCell from './truncated-cell';
import { compareCaseNumbers, formatDateTime } from '@/lib/utils';
import type { FollowUpStatus } from '@/types';

type SortColumn = 'caseNumber' | 'wrmdCaseNumber' | 'species' | 'urgency' | 'followUp' | 'updated';
type SortDirection = 'asc' | 'desc';

const FOLLOW_UP_ORDER: Record<FollowUpStatus, number> = {
  overdue: 0,
  due_today: 1,
  upcoming: 2,
  scheduled: 3,
  none: 4,
};

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
  const showLocation = category !== 'ambassador';
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        // Third click: reset to default order
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  const sortedCases = useMemo(() => {
    if (!sortColumn) return cases;

    return [...cases].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'caseNumber':
        case 'wrmdCaseNumber': {
          const aVal = sortColumn === 'caseNumber' ? a.caseNumber : a.wrmdCaseNumber;
          const bVal = sortColumn === 'caseNumber' ? b.caseNumber : b.wrmdCaseNumber;
          // Cases without a number stay at the bottom in both directions.
          const aBlank = !(aVal || '').trim();
          const bBlank = !(bVal || '').trim();
          if (aBlank || bBlank) return compareCaseNumbers(aVal, bVal);
          cmp = compareCaseNumbers(aVal, bVal);
          break;
        }
        case 'species':
          cmp = a.species.localeCompare(b.species);
          break;
        case 'urgency':
          cmp = URGENCY_ORDER.indexOf(a.displayUrgency) - URGENCY_ORDER.indexOf(b.displayUrgency);
          break;
        case 'followUp':
          cmp = FOLLOW_UP_ORDER[a.followUpStatus] - FOLLOW_UP_ORDER[b.followUpStatus];
          break;
        case 'updated':
          cmp = (a.updatedAt || '').localeCompare(b.updatedAt || '');
          break;
      }
      return sortDirection === 'desc' ? -cmp : cmp;
    });
  }, [cases, sortColumn, sortDirection]);

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
              <th className={sortableThClass} onClick={() => handleSort('caseNumber')}>
                Case #
                <SortIcon active={sortColumn === 'caseNumber'} direction={sortDirection} />
              </th>
              <th className={`${sortableThClass} hidden sm:table-cell`} onClick={() => handleSort('wrmdCaseNumber')}>
                WRMD #
                <SortIcon active={sortColumn === 'wrmdCaseNumber'} direction={sortDirection} />
              </th>
              <th className={sortableThClass} onClick={() => handleSort('species')}>
                Species
                <SortIcon active={sortColumn === 'species'} direction={sortDirection} />
              </th>
              {showLocation && <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Location</th>}
              <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Active Problems</th>
              <th className="px-3 py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Treatments</th>
              <th className={sortableThClass} onClick={() => handleSort('urgency')}>
                Urgency
                <SortIcon active={sortColumn === 'urgency'} direction={sortDirection} />
              </th>
              <th className={sortableThClass} onClick={() => handleSort('followUp')}>
                Follow-up
                <SortIcon active={sortColumn === 'followUp'} direction={sortDirection} />
              </th>
              <th className={`${sortableThClass} hidden sm:table-cell`} onClick={() => handleSort('updated')}>
                Updated
                <SortIcon active={sortColumn === 'updated'} direction={sortDirection} />
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
                  {showLocation && (
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
