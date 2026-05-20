'use client';

import { useState } from 'react';
import type { CaseHistory } from '@/types';
import { formatDateTime } from '@/lib/utils';

const FIELD_LABELS: Record<string, string> = {
  species: 'Species',
  commonName: 'Nickname',
  bandNumber: 'Band/ID Number',
  wrmdCaseNumber: 'WRMD Case Number',
  location: 'Location',
  activeProblems: 'Active Problems',
  currentTreatments: 'Current Treatments',
  plan: 'Plan/Follow-up',
  nextFollowUpDate: 'Next Follow-up',
  followUpNotes: 'Follow-up Notes',
  otherNotes: 'Other Notes',
  status: 'Status',
  urgency: 'Urgency',
  intakeDate: 'Intake Date',
  intakeReason: 'Intake Reason',
  category: 'Category',
  case_created: 'Case Created',
  case_deleted: 'Case Deleted',
};

export default function CaseHistoryLog({ history }: { history: CaseHistory[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex items-center justify-between w-full text-left group"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors">
          Change History
          {history.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-600 normal-case tracking-normal">
              {history.length}
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-4">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No changes recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map(entry => (
                <div key={entry.id} className="flex gap-3 text-sm border-l-2 border-slate-200 pl-4 py-1">
                  <div className="flex-1">
                    <span className="font-medium text-slate-700">
                      {FIELD_LABELS[entry.fieldChanged] || entry.fieldChanged}
                    </span>
                    {entry.fieldChanged === 'case_created' ? (
                      <span className="text-slate-500 ml-2">
                        {entry.newValue}
                      </span>
                    ) : (
                      <>
                        {entry.oldValue && (
                          <span className="text-red-500 line-through ml-2">{entry.oldValue}</span>
                        )}
                        {entry.newValue && (
                          <span className="text-green-600 ml-2">{entry.newValue}</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    {formatDateTime(entry.changedAt)} &middot; {entry.changedBy}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
