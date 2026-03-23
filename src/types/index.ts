import type { Route } from "next";

export type Tone = "emerald" | "zinc" | "amber" | "slate" | "danger" | "success";

export type BillStatus = "pending" | "paid" | "warning";

export type ResidentRole = "ADMIN" | "MEMBER";

export type HouseAuditEventType =
  | "HOUSE_CREATED"
  | "MEMBER_JOINED"
  | "INVITE_ROTATED"
  | "ADMIN_TRANSFERRED"
  | "MEMBER_REMOVED"
  | "MEMBER_LEFT";

export interface HouseContribution {
  id: string;
  contributionId?: string;
  residentName: string;
  amount: number;
  status: "confirmed" | "pending";
  avatar: string;
  role: ResidentRole;
  month: number;
  year: number;
  isCurrentUser?: boolean;
}

export interface HouseBill {
  id: string;
  title: string;
  category: string;
  amount: number;
  dueLabel: string;
  dueDate: string;
  status: BillStatus;
  note?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  dateLabel: string;
  badge: {
    label: string;
    tone: Tone;
  };
  detailsHref?: Route;
  detailsLabel?: string;
  canMarkAsPaid?: boolean;
  houseBillId?: string;
  canMarkPersonalAsPaid?: boolean;
  personalBillId?: string;
}

export interface BudgetGoal {
  id: string;
  label: string;
  icon: string;
  spent: number;
  limit: number;
  tone: Tone;
  month: number;
  year: number;
}

export interface IncomeRecord {
  id: string;
  title: string;
  amount: number;
  receivedDate: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
}

export interface PersonalBillRecord {
  id: string;
  title: string;
  category: string;
  amount: number;
  dueLabel: string;
  dueDate: string;
  status: BillStatus;
  note?: string;
}

export interface HouseCycleSummary {
  month: number;
  year: number;
  startingBalance: number;
  endingBalance: number;
  netChange: number;
}

export interface HouseAuditEvent {
  id: string;
  type: HouseAuditEventType;
  title: string;
  description: string;
  createdAtLabel: string;
}

export interface Resident {
  id: string;
  name: string;
  avatar: string;
  role: ResidentRole;
  isCurrentUser?: boolean;
  online?: boolean;
}

export interface DashboardSnapshot {
  monthLabel: string;
  houseCash: number;
  pendingBills: number;
  privateWallet: number;
  goalsHit: string;
  activity: ActivityItem[];
  insight: {
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
  };
}

export interface HouseSnapshot {
  monthLabel: string;
  houseName: string;
  totalDeclared: number;
  totalCommitted: number;
  freeBalance: number;
  cycle: HouseCycleSummary;
  healthStatus: string;
  reviewDate: string;
  contributions: HouseContribution[];
  pendingBills: HouseBill[];
  paidBills: HouseBill[];
}

export interface PersonalSnapshot {
  monthLabel: string;
  totalMonthly: number;
  salary: number;
  freelance: number;
  declaredContribution: number;
  weeklyBills: HouseBill[];
  goals: BudgetGoal[];
  incomes: IncomeRecord[];
  personalBills: PersonalBillRecord[];
  expenses: ExpenseRecord[];
}

export interface ResidentsSnapshot {
  monthLabel: string;
  houseName: string;
  inviteCode: string;
  currentUserRole: ResidentRole;
  canManageResidents: boolean;
  residents: Resident[];
  auditLog: HouseAuditEvent[];
}
