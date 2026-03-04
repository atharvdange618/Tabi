import mongoose from "mongoose";
import { BudgetSettings, Expense } from "../models/index.ts";
import { NotFoundError } from "../lib/errors.ts";
import type {
  UpdateBudgetSettingsPayload,
  CreateExpensePayload,
  UpdateExpensePayload,
} from "../../../shared/validations/index.ts";
import type {
  BudgetSummary,
  ExpenseCategory,
} from "../../../shared/types/index.ts";

/**
 * Get budget settings for a trip. Returns null if not yet configured.
 */
export async function getBudgetSettings(tripId: string) {
  return BudgetSettings.findOne({ tripId }).lean();
}

/**
 * Create or update (upsert) budget settings for a trip.
 */
export async function upsertBudgetSettings(
  tripId: string,
  payload: UpdateBudgetSettingsPayload,
) {
  return BudgetSettings.findOneAndUpdate(
    { tripId },
    { $set: payload },
    { new: true, upsert: true, runValidators: true },
  ).lean();
}

/**
 * Get all expenses for a trip, sorted newest-first.
 */
export async function getExpenses(tripId: string) {
  return Expense.find({ tripId }).sort({ createdAt: -1 }).lean();
}

/**
 * Create a new expense for a trip.
 */
export async function createExpense(
  tripId: string,
  userId: string,
  payload: CreateExpensePayload,
) {
  return Expense.create({
    ...payload,
    tripId: new mongoose.Types.ObjectId(tripId),
    paidBy: new mongoose.Types.ObjectId(payload.paidBy),
    activityId: payload.activityId
      ? new mongoose.Types.ObjectId(payload.activityId)
      : null,
    createdBy: new mongoose.Types.ObjectId(userId),
  });
}

/**
 * Update an existing expense.
 */
export async function updateExpense(
  tripId: string,
  expId: string,
  payload: UpdateExpensePayload,
) {
  const update: Record<string, unknown> = { ...payload };

  if (payload.paidBy) {
    update.paidBy = new mongoose.Types.ObjectId(payload.paidBy);
  }
  if (payload.activityId) {
    update.activityId = new mongoose.Types.ObjectId(payload.activityId);
  }

  const expense = await Expense.findOneAndUpdate(
    { _id: expId, tripId },
    { $set: update },
    { new: true, runValidators: true },
  ).lean();

  if (!expense) {
    throw new NotFoundError("Expense not found");
  }

  return expense;
}

/**
 * Delete an expense.
 */
export async function deleteExpense(tripId: string, expId: string) {
  const result = await Expense.deleteOne({ _id: expId, tripId });
  if (result.deletedCount === 0) {
    throw new NotFoundError("Expense not found");
  }
}

/**
 * Compute a budget summary for a trip:
 * - Pulls totalBudget and currency from BudgetSettings (defaults to 0 / "INR")
 * - Sums all expenses and breaks them down by category
 */
export async function getBudgetSummary(tripId: string): Promise<BudgetSummary> {
  const [settings, expenses] = await Promise.all([
    BudgetSettings.findOne({ tripId }).lean(),
    Expense.find({ tripId }).lean(),
  ]);

  const totalBudget = settings?.totalBudget ?? 0;
  const currency = "INR" as const;

  const byCategory = expenses.reduce(
    (acc, expense) => {
      const cat = expense.category as ExpenseCategory;
      const current = acc[cat] as number | undefined;
      acc[cat] = (current ?? 0) + expense.amount;
      return acc;
    },
    {} as Record<ExpenseCategory, number>,
  );

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    totalBudget,
    totalSpent,
    remaining: totalBudget - totalSpent,
    currency,
    byCategory,
  };
}
