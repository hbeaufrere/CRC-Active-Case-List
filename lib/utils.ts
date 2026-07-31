import { differenceInDays, format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Urgency, FollowUpStatus, Status, Case, CaseWithDisplay, SortColumn, SortDirection } from '@/types';
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

/**
 * Whole days a bird has been in care, counted in California local time so the
 * count rolls over at local midnight rather than at UTC midnight.
 * Returns null when no intake date is recorded.
 */
export function calculateDaysInCare(intakeDate: string | null): number | null {
  if (!intakeDate) return null;
  try {
    const laNow = toZonedTime(new Date(), LA_TZ);
    const today = new Date(laNow.getFullYear(), laNow.getMonth(), laNow.getDate());
    const intake = parseISO(intakeDate);
    if (isNaN(intake.getTime())) return null;
    const intakeDay = new Date(intake.getFullYear(), intake.getMonth(), intake.getDate());
    return differenceInDays(today, intakeDay);
  } catch {
    return null;
  }
}

export function enrichCaseWithDisplay(c: Case): CaseWithDisplay {
  const { displayUrgencyModifier, followUpStatus, followUpLabel } = calculateFollowUp(c.nextFollowUpDate);
  return {
    ...c,
    displayUrgency: displayUrgencyModifier(c.urgency),
    followUpStatus,
    followUpLabel,
    daysInCare: calculateDaysInCare(c.intakeDate),
  };
}

const STATUS_SORT_ORDER: Record<Status, number> = {
  active: 0,
  permanent: 1,
  transferred: 2,
  released: 3,
  deceased: 4,
};

/**
 * The order cases appear in before anyone clicks a column header:
 * status (active first), then most recently updated, then WRMD case number.
 */
export function sortCasesByDefault(cases: CaseWithDisplay[]): CaseWithDisplay[] {
  return [...cases].sort((a, b) => {
    const statusDiff = (STATUS_SORT_ORDER[a.status] ?? 99) - (STATUS_SORT_ORDER[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;

    // Most recently updated first.
    const updatedDiff = (b.updatedAt || '').localeCompare(a.updatedAt || '');
    if (updatedDiff !== 0) return updatedDiff;

    return compareCaseNumbers(a.wrmdCaseNumber, b.wrmdCaseNumber);
  });
}

const FOLLOW_UP_SORT_ORDER: Record<FollowUpStatus, number> = {
  overdue: 0,
  due_today: 1,
  upcoming: 2,
  scheduled: 3,
  none: 4,
};

/**
 * Applies a column sort chosen from a table header. A null column means "leave
 * the default order alone". Shared by the case table and the PDF export so the
 * printed sheet always matches what is on screen.
 */
export function sortCases(
  cases: CaseWithDisplay[],
  column: SortColumn | null,
  direction: SortDirection
): CaseWithDisplay[] {
  if (!column) return cases;
  const flip = direction === 'desc' ? -1 : 1;

  return [...cases].sort((a, b) => {
    switch (column) {
      case 'caseNumber':
      case 'wrmdCaseNumber': {
        const aVal = column === 'caseNumber' ? a.caseNumber : a.wrmdCaseNumber;
        const bVal = column === 'caseNumber' ? b.caseNumber : b.wrmdCaseNumber;
        // Cases without a number stay at the bottom in both directions.
        if (!(aVal || '').trim() || !(bVal || '').trim()) return compareCaseNumbers(aVal, bVal);
        return flip * compareCaseNumbers(aVal, bVal);
      }
      case 'daysInCare': {
        // Birds with no intake date stay at the bottom in both directions.
        if (a.daysInCare == null || b.daysInCare == null) {
          if (a.daysInCare == null && b.daysInCare == null) return 0;
          return a.daysInCare == null ? 1 : -1;
        }
        return flip * (a.daysInCare - b.daysInCare);
      }
      case 'species':
        return flip * a.species.localeCompare(b.species);
      case 'urgency':
        return flip * (URGENCY_ORDER.indexOf(a.displayUrgency) - URGENCY_ORDER.indexOf(b.displayUrgency));
      case 'followUp':
        return flip * (FOLLOW_UP_SORT_ORDER[a.followUpStatus] - FOLLOW_UP_SORT_ORDER[b.followUpStatus]);
      case 'updated':
        return flip * (a.updatedAt || '').localeCompare(b.updatedAt || '');
      default:
        return 0;
    }
  });
}

// Case numbers mix letters and digits (e.g. "25-0432", "V24-9"), so compare
// them numerically-aware: "25-100" must sort after "25-99", not before it.
const caseNumberCollator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/**
 * Compares two case numbers. Blank values always sort last, regardless of the
 * requested direction, so callers should apply their asc/desc flip only when
 * both values are present.
 */
export function compareCaseNumbers(a: string | null | undefined, b: string | null | undefined): number {
  const aVal = (a || '').trim();
  const bVal = (b || '').trim();
  if (!aVal && !bVal) return 0;
  if (!aVal) return 1;
  if (!bVal) return -1;
  return caseNumberCollator.compare(aVal, bVal);
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
