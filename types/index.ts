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
}

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

export interface Session {
  id: string;
  initials: string;
  createdAt: string | null;
  expiresAt: string;
}
