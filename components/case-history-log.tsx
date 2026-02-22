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
  if (history.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">No changes recorded yet.</p>
    );
  }

  return (
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
  );
}
