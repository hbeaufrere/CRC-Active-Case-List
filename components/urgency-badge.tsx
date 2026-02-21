import type { Urgency } from '@/types';
import { URGENCY_CONFIG } from '@/lib/constants';

export default function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const config = URGENCY_CONFIG[urgency];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${urgency === 'critical' ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  );
}
