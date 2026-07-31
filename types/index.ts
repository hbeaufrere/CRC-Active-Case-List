export type Category = 'rehab' | 'ambassador';
export type Status = 'active' | 'released' | 'deceased' | 'transferred' | 'permanent';
export type Urgency = 'critical' | 'high' | 'moderate' | 'stable' | 'routine';
export type FollowUpStatus = 'overdue' | 'due_today' | 'upcoming' | 'scheduled' | 'none';

export interface Case {
  id: number;
  caseNumber: string;
  category: Category;
  species: string;
  commonName: string | null;
  bandNumber: string | null;
  activeProblems: string;
  currentTreatments: string;
  plan: string;
  nextFollowUpDate: string | null;
  followUpNotes: string | null;
  status: Status;
  urgency: Urgency;
  intakeDate: string | null;
  intakeReason: string | null;
  wrmdCaseNumber: string | null;
  location: string | null;
  otherNotes: string | null;
  externalLink: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  updatedBy: string;
  createdBy: string;
}

export interface CaseWithDisplay extends Case {
  displayUrgency: Urgency;
  followUpStatus: FollowUpStatus;
  followUpLabel: string;
  /** Whole days since intake, or null when no intake date is recorded. */
  daysInCare: number | null;
}

export type SortColumn =
  | 'caseNumber'
  | 'wrmdCaseNumber'
  | 'species'
  | 'daysInCare'
  | 'urgency'
  | 'followUp'
  | 'updated';
export type SortDirection = 'asc' | 'desc';

export interface CaseHistory {
  id: number;
  caseId: number;
  fieldChanged: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedAt: string | null;
  note: string | null;
}

export interface Species {
  id: number;
  commonName: string;
  scientificName: string | null;
}

export interface Necropsy {
  id: number;
  dateDied: string;
  vmthId: string;
  wrmdId: string | null;
  species: string;
  clinicalProblems: string;
  results: string | null;
  isFinal: boolean | null;
  necropsyLink: string | null;
  createdBy: string;
  createdAt: string | null;
  updatedBy: string;
  updatedAt: string | null;
}

export interface StatusChangeEntry {
  caseId: number;
  caseNumber: string;
  species: string;
  commonName: string | null;
  oldStatus: string | null;
  newStatus: string | null;
  changedBy: string;
  changedAt: string | null;
}

export interface Session {
  id: string;
  initials: string;
  createdAt: string | null;
  expiresAt: string;
}
