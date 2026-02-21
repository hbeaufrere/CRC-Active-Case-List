import type { FollowUpStatus } from '@/types';

const STATUS_STYLES: Record<FollowUpStatus, string> = {
  overdue: 'text-red-700 bg-red-50 border-red-200 font-semibold',
  due_today: 'text-orange-700 bg-orange-50 border-orange-200 font-semibold',
  upcoming: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  scheduled: 'text-green-700 bg-green-50 border-green-200',
  none: 'text-gray-500 bg-gray-50 border-gray-200',
};

export default function FollowUpIndicator({
  status,
  label,
}: {
  status: FollowUpStatus;
  label: string;
}) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs ${STATUS_STYLES[status]}`}>
      {label}
    </span>
  );
}
