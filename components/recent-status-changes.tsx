import Link from 'next/link';
import type { StatusChangeEntry } from '@/types';
import { STATUS_CONFIG } from '@/lib/constants';
import type { Status } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function RecentStatusChanges({ changes }: { changes: StatusChangeEntry[] }) {
  if (changes.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg border border-slate-200">
        <p className="text-slate-500">No recent status changes</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-3 text-left font-semibold text-slate-600">Case #</th>
              <th className="px-3 py-3 text-left font-semibold text-slate-600">Species</th>
              <th className="px-3 py-3 text-left font-semibold text-slate-600">From</th>
              <th className="px-3 py-3 text-left font-semibold text-slate-600">To</th>
              <th className="px-3 py-3 text-left font-semibold text-slate-600">Changed By</th>
              <th className="px-3 py-3 text-left font-semibold text-slate-600">Date</th>
            </tr>
          </thead>
          <tbody>
            {changes.map((c, i) => {
              const oldConfig = c.oldStatus && c.oldStatus in STATUS_CONFIG
                ? STATUS_CONFIG[c.oldStatus as Status]
                : null;
              const newConfig = c.newStatus && c.newStatus in STATUS_CONFIG
                ? STATUS_CONFIG[c.newStatus as Status]
                : null;

              return (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3">
                    <Link href={`/cases/${c.caseId}`} className="text-blue-700 hover:text-blue-900 font-medium hover:underline">
                      {c.caseNumber}
                    </Link>
                    {c.commonName && (
                      <div className="text-xs text-slate-400 mt-0.5">{c.commonName}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{c.species}</td>
                  <td className="px-3 py-3">
                    {oldConfig ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${oldConfig.bgColor} ${oldConfig.color}`}>
                        {oldConfig.label}
                      </span>
                    ) : (
                      <span className="text-slate-400">{c.oldStatus || '—'}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {newConfig ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${newConfig.bgColor} ${newConfig.color}`}>
                        {newConfig.label}
                      </span>
                    ) : (
                      <span className="text-slate-400">{c.newStatus || '—'}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{c.changedBy}</td>
                  <td className="px-3 py-3 text-xs text-slate-500">{formatDateTime(c.changedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
