/**
 * FluxoCasa Repository — Barrel Composer
 *
 * This file composes the domain-specific repositories into a single
 * backward-compatible interface. All services continue importing
 * `fluxoCasaRepository` from here without any changes.
 *
 * Domain repositories:
 *   - auth.repository.ts      → User auth (create, find, sync)
 *   - house.repository.ts     → House management, bills, contributions
 *   - personal.repository.ts  → Income, personal bills, expenses, goals
 *   - residents.repository.ts → Resident management, admin transfer
 *   - dashboard.repository.ts → Dashboard snapshot, activity feed
 *
 * Shared code lives in:
 *   - _shared.ts  → Constants, helpers, query utilities
 *   - _types.ts   → Input/output interfaces
 */

import type {
  ActivityItem,
  BudgetGoal,
  DashboardSnapshot,
  HouseBill,
  HouseContribution,
  HouseSnapshot,
  PersonalSnapshot,
  ResidentsSnapshot
} from "@/types";

import type {
  CreateExpenseInput,
  CreateHouseBillInput,
  CreateHouseInput,
  CreateIncomeInput,
  CreatePersonalBillInput,
  CreateUserInput,
  JoinHouseInput,
  LeaveHouseResult,
  UpdateBudgetGoalInput,
  UpdateExpenseInput,
  UpdateHouseBillInput,
  UpdateIncomeInput,
  UpdatePersonalBillInput,
  UpsertBudgetGoalInput,
  UpsertContributionInput
} from "./_types";

import { authRepository } from "./auth.repository";
import { houseRepository } from "./house.repository";
import { personalRepository } from "./personal.repository";
import { residentsRepository } from "./residents.repository";
import { dashboardRepository } from "./dashboard.repository";

export interface FluxoCasaRepository {
  createUser(input: CreateUserInput): Promise<{ id: string }>;
  findUserByAuthUserId(authUserId: string): Promise<{
    id: string;
    nome: string;
    email: string;
    casaId: string | null;
  } | null>;
  findUserByEmail(email: string): Promise<{
    id: string;
    nome: string;
    email: string;
    senhaHash: string;
    casaId: string | null;
  } | null>;
  syncUserIdentity(input: {
    authUserId: string;
    email: string;
    nome: string;
  }): Promise<{ id: string; casaId: string | null }>;
  createHouseForUser(userId: string, input: CreateHouseInput): Promise<{ casaId: string }>;
  joinHouseByInviteCode(userId: string, input: JoinHouseInput): Promise<{ casaId: string }>;
  leaveCurrentHouse(userId: string): Promise<LeaveHouseResult>;
  rotateInviteCode(userId: string): Promise<{ codigoConvite: string }>;
  upsertContribution(userId: string, input: UpsertContributionInput): Promise<void>;
  deleteContribution(userId: string, contributionId: string): Promise<void>;
  createHouseBill(userId: string, input: CreateHouseBillInput): Promise<void>;
  updateHouseBill(userId: string, billId: string, input: UpdateHouseBillInput): Promise<void>;
  deleteHouseBill(userId: string, billId: string): Promise<void>;
  markHouseBillAsPaid(userId: string, billId: string): Promise<void>;
  createIncome(userId: string, input: CreateIncomeInput): Promise<void>;
  updateIncome(userId: string, incomeId: string, input: UpdateIncomeInput): Promise<void>;
  markIncomeAsReceived(userId: string, incomeId: string): Promise<void>;
  deleteIncome(userId: string, incomeId: string): Promise<void>;
  createPersonalBill(userId: string, input: CreatePersonalBillInput): Promise<void>;
  updatePersonalBill(userId: string, billId: string, input: UpdatePersonalBillInput): Promise<void>;
  markPersonalBillAsPaid(userId: string, billId: string): Promise<void>;
  deletePersonalBill(userId: string, billId: string): Promise<void>;
  createExpense(userId: string, input: CreateExpenseInput): Promise<void>;
  updateExpense(userId: string, expenseId: string, input: UpdateExpenseInput): Promise<void>;
  deleteExpense(userId: string, expenseId: string): Promise<void>;
  upsertBudgetGoal(userId: string, input: UpsertBudgetGoalInput): Promise<void>;
  updateBudgetGoal(userId: string, goalId: string, input: UpdateBudgetGoalInput): Promise<void>;
  deleteBudgetGoal(userId: string, goalId: string): Promise<void>;
  getDashboardSnapshot(userId: string): Promise<DashboardSnapshot>;
  getHouseSnapshot(userId: string): Promise<HouseSnapshot>;
  getPersonalSnapshot(userId: string): Promise<PersonalSnapshot>;
  getResidentsSnapshot(userId: string): Promise<ResidentsSnapshot>;
  transferHouseAdmin(userId: string, residentId: string): Promise<void>;
  removeHouseResident(userId: string, residentId: string): Promise<void>;
  getHouseBills(userId: string): Promise<HouseBill[]>;
  getHouseContributions(userId: string): Promise<HouseContribution[]>;
  getPersonalGoals(userId: string): Promise<BudgetGoal[]>;
  getRecentActivity(userId: string): Promise<ActivityItem[]>;
}

export const fluxoCasaRepository: FluxoCasaRepository = {
  ...authRepository,
  ...houseRepository,
  ...personalRepository,
  ...residentsRepository,
  ...dashboardRepository,
};

export type { FluxoCasaWriteInput } from "./_types";
