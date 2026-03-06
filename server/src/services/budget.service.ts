import mongoose from "mongoose";
import {
  BudgetSettings,
  Expense,
  Settlement,
  TripMember,
} from "../models/index.ts";
import { NotFoundError } from "../lib/errors.ts";
import type {
  UpdateBudgetSettingsPayload,
  CreateExpensePayload,
  UpdateExpensePayload,
  CreateSettlementPayload,
} from "../../../shared/validations/index.ts";
import type {
  BudgetSummary,
  ExpenseCategory,
  SplitBalance,
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
 * Compute pairwise split balances for a trip.
 * Each expense is split equally among all active members.
 * Pairwise balances are netted out and existing settlements are subtracted.
 */
export async function computeSplits(tripId: string): Promise<SplitBalance[]> {
  const [expenses, activeMembers, settlements] = await Promise.all([
    Expense.find({ tripId }).lean(),
    TripMember.find({ tripId, status: "active" })
      .populate<{
        userId: { _id: mongoose.Types.ObjectId; name: string; email: string };
      }>("userId", "name email")
      .lean(),
    Settlement.find({ tripId }).lean<
      {
        fromUserId: mongoose.Types.ObjectId;
        toUserId: mongoose.Types.ObjectId;
        amount: number;
      }[]
    >(),
  ]);

  const memberCount = activeMembers.length;
  if (memberCount <= 1) {
    return [];
  }

  const memberMap = new Map<string, string>();
  for (const m of activeMembers) {
    const uid = m.userId as {
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
    };
    memberMap.set(uid._id.toString(), uid.name || uid.email);
  }

  const memberIds = [...memberMap.keys()];

  // balance[debtor][creditor] = total amount debtor owes creditor
  const balance: Record<string, Record<string, number>> = {};

  for (const expense of expenses) {
    const paidById = expense.paidBy.toString();
    // Only split among members who are still active; skip if payer not in members
    if (!memberMap.has(paidById)) {
      continue;
    }
    const share = expense.amount / memberCount;

    for (const memberId of memberIds) {
      if (memberId === paidById) {
        continue;
      }
      balance[memberId] ??= {};
      balance[memberId][paidById] ??= 0;
      balance[memberId][paidById] += share;
    }
  }

  const splits: SplitBalance[] = [];

  for (let i = 0; i < memberIds.length; i++) {
    for (let j = i + 1; j < memberIds.length; j++) {
      const a = memberIds[i] as string;
      const b = memberIds[j] as string;

      const aOwesB = balance[a]?.[b] ?? 0;
      const bOwesA = balance[b]?.[a] ?? 0;
      const net = aOwesB - bOwesA;

      if (net > 0.005) {
        const alreadySettled = settlements
          .filter(
            (s) => s.fromUserId.toString() === a && s.toUserId.toString() === b,
          )
          .reduce((sum, s) => sum + s.amount, 0);
        const remaining = Math.round((net - alreadySettled) * 100) / 100;
        if (remaining > 0.005) {
          splits.push({
            fromUserId: a,
            fromUserName: memberMap.get(a) as string,
            toUserId: b,
            toUserName: memberMap.get(b) as string,
            amount: remaining,
          });
        }
      } else if (net < -0.005) {
        const absNet = -net;
        const alreadySettled = settlements
          .filter(
            (s) => s.fromUserId.toString() === b && s.toUserId.toString() === a,
          )
          .reduce((sum, s) => sum + s.amount, 0);
        const remaining = Math.round((absNet - alreadySettled) * 100) / 100;
        if (remaining > 0.005) {
          splits.push({
            fromUserId: b,
            fromUserName: memberMap.get(b) as string,
            toUserId: a,
            toUserName: memberMap.get(a) as string,
            amount: remaining,
          });
        }
      }
    }
  }

  return splits;
}

/**
 * Get all settlements recorded for a trip.
 */
export async function getSettlements(tripId: string) {
  return Settlement.find({ tripId }).sort({ createdAt: -1 }).lean();
}

/**
 * Record a new settlement (one member paying another back).
 */
export async function createSettlement(
  tripId: string,
  payload: CreateSettlementPayload,
) {
  const { fromUserId, toUserId, amount } = payload;
  return Settlement.create({
    tripId: new mongoose.Types.ObjectId(tripId),
    fromUserId: new mongoose.Types.ObjectId(fromUserId),
    toUserId: new mongoose.Types.ObjectId(toUserId),
    amount,
  });
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
