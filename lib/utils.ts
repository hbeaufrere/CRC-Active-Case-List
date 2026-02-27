import { differenceInDays, format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Urgency, FollowUpStatus, Case, CaseWithDisplay } from '@/types';
import { URGENCY_ORDER } from './constants';

const LA_TZ = 'America/Los_Angeles';

export function escalateUrgency(current: Urgency): Urgency {
  const idx = URGENCY_ORDER.indexOf(current);
  return idx > 0 ? URGENCY_ORDER[idx - 1] : current;
}

export function atLeastUrgency(current: Urgency, minimum: Urgency): Urgency {
  const currentIdx = URGENCY_ORDER.indexOf(current);
  const minimumIdx = URGENCY_ORDER.indexOf(minimum);
  return currentIdx > minimumIdx ? minimum : current;
}

export function calculateFollowUp(nextFollowUpDate: string | null): {
  displayUrgencyModifier: (manual: Urgency) => Urgency;
  followUpStatus: FollowUpStatus;
  followUpLabel: string;
} {
  if (!nextFollowUpDate) {
    return {
      displayUrgencyModifier: (manual) => manual,
      followUpStatus: 'none',
      followUpLabel: 'No follow-up set',
    };
  }

  const laNow = toZonedTime(new Date(), LA_TZ);
  const today = new Date(laNow.getFullYear(), laNow.getMonth(), laNow.getDate());
  const followUp = parseISO(nextFollowUpDate);
  const followUpDay = new Date(followUp.getFullYear(), followUp.getMonth(), followUp.getDate());
  const daysUntil = differenceInDays(followUpDay, today);

  if (daysUntil < 0) {
    const overdueDays = Math.abs(daysUntil);
    return {
      displayUrgencyModifier: (manual) => escalateUrgency(manual),
      followUpStatus: 'overdue',
      followUpLabel: `OVERDUE ${overdueDays}d`,
    };
  }
  if (daysUntil === 0) {
    return {
      displayUrgencyModifier: (manual) => atLeastUrgency(manual, 'high'),
      followUpStatus: 'due_today',
      followUpLabel: 'DUE TODAY',
    };
  }
  if (daysUntil <= 3) {
    return {
      displayUrgencyModifier: (manual) => manual,
      followUpStatus: 'upcoming',
      followUpLabel: `in ${daysUntil}d`,
    };
  }
  return {
    displayUrgencyModifier: (manual) => manual,
    followUpStatus: 'scheduled',
    followUpLabel: `in ${daysUntil}d`,
  };
}

export function enrichCaseWithDisplay(c: Case): CaseWithDisplay {
  const { displayUrgencyModifier, followUpStatus, followUpLabel } = calculateFollowUp(c.nextFollowUpDate);
  return {
    ...c,
    displayUrgency: displayUrgencyModifier(c.urgency),
    followUpStatus,
    followUpLabel,
  };
}

export function sortCasesByAttention(cases: CaseWithDisplay[]): CaseWithDisplay[] {
  const statusOrder: Record<FollowUpStatus, number> = {
    overdue: 0,
    due_today: 1,
    upcoming: 2,
    scheduled: 3,
    none: 4,
  };

  return [...cases].sort((a, b) => {
    const statusDiff = statusOrder[a.followUpStatus] - statusOrder[b.followUpStatus];
    if (statusDiff !== 0) return statusDiff;

    const urgencyDiff = URGENCY_ORDER.indexOf(a.displayUrgency) - URGENCY_ORDER.indexOf(b.displayUrgency);
    if (urgencyDiff !== 0) return urgencyDiff;

    if (a.nextFollowUpDate && b.nextFollowUpDate) {
      return a.nextFollowUpDate.localeCompare(b.nextFollowUpDate);
    }
    if (a.nextFollowUpDate) return -1;
    if (b.nextFollowUpDate) return 1;
    return 0;
  });
}

export function formatDateTime(isoString: string | null): string {
  if (!isoString) return '';
  try {
    const utcDate = parseISO(isoString.endsWith('Z') ? isoString : isoString + 'Z');
    const laDate = toZonedTime(utcDate, LA_TZ);
    return format(laDate, 'MMM d, yyyy h:mm a');
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string | null): string {
  if (!isoString) return '';
  try {
    return format(parseISO(isoString), 'MMM d, yyyy');
  } catch {
    return isoString;
  }
}
