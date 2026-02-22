import type { CaseWithDisplay } from '@/types';

export default function SummaryStats({ cases }: { cases: CaseWithDisplay[] }) {
  const overdue = cases.filter(c => c.followUpStatus === 'overdue').length;
  const dueToday = cases.filter(c => c.followUpStatus === 'due_today').length;
  const criticalHigh = cases.filter(c => c.displayUrgency === 'critical' || c.displayUrgency === 'high').length;

  return (
    <div className="flex flex-wrap gap-4 text-sm">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border">
        <span className="font-semibold text-slate-700">{cases.length}</span>
        <span className="text-slate-500">total</span>
      </div>
      {overdue > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg border border-red-200">
          <span className="font-semibold">{overdue}</span>
          <span>overdue</span>
        </div>
      )}
      {dueToday > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg border border-orange-200">
          <span className="font-semibold">{dueToday}</span>
          <span>due today</span>
        </div>
      )}
      {criticalHigh > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
          <span className="font-semibold">{criticalHigh}</span>
          <span>critical/high</span>
        </div>
      )}
    </div>
  );
}
