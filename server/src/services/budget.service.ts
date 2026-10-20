import mongoose from "mongoose";
import {
  BudgetSettings,
  Expense,
  Settlement,
  TripMember,
  Trip,
  User,
  Activity,
  File,
} from "../models/index.ts";
import {
  LimitExceededError,
  NotFoundError,
  ValidationError,
} from "../lib/errors.ts";
import { TripMemberStatus } from "../../../shared/types/index.ts";
import { LIMITS } from "../../../shared/constants.ts";
import {
  notificationEvents,
  NotificationEvents,
} from "../lib/notificationEmitter.ts";
import logger from "../lib/logger.ts";
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
  return Expense.find({ tripId })
    .populate<{
      paidBy: { _id: string; name: string; email: string };
    }>("paidBy", "name email")
    .sort({ createdAt: -1 })
    .lean();
}

async function assertActiveMember(tripId: string, userId: string) {
  const member = await TripMember.exists({
    tripId,
    userId,
    status: TripMemberStatus.ACTIVE,
  });
  if (!member) {
    throw new ValidationError("paidBy must be an active member of this trip");
  }
}

async function assertLinksBelongToTrip(
  tripId: string,
  links: { activityId?: string; fileId?: string },
) {
  const [activity, file] = await Promise.all([
    links.activityId
      ? Activity.exists({ _id: links.activityId, tripId })
      : true,
    links.fileId ? File.exists({ _id: links.fileId, tripId }) : true,
  ]);
  if (!activity) {
    throw new NotFoundError("Activity not found in this trip");
  }
  if (!file) {
    throw new NotFoundError("File not found in this trip");
  }
}

/**
 * Users who can take part in a settlement: active members plus anyone who
 * still appears in the trip's expenses (former members keep their balances).
 */
async function getLedgerUserIds(tripId: string): Promise<Set<string>> {
  const [activeIds, payers, sharers] = await Promise.all([
    TripMember.find({ tripId, status: TripMemberStatus.ACTIVE }).distinct(
      "userId",
    ),
    Expense.find({ tripId }).distinct("paidBy"),
    Expense.find({ tripId }).distinct("splitAmong"),
  ]);
  return new Set([...activeIds, ...payers, ...sharers].map(String));
}

/**
 * Create a new expense for a trip.
 */
export async function createExpense(
  tripId: string,
  userId: string,
  payload: CreateExpensePayload,
) {
  const expenseCount = await Expense.countDocuments({ tripId });
  if (expenseCount >= LIMITS.EXPENSES_PER_TRIP) {
    throw new LimitExceededError(
      `A trip can have at most ${LIMITS.EXPENSES_PER_TRIP} expenses (${expenseCount}/${LIMITS.EXPENSES_PER_TRIP})`,
    );
  }

  await Promise.all([
    assertActiveMember(tripId, payload.paidBy),
    assertLinksBelongToTrip(tripId, payload),
  ]);

  const activeMemberIds = await TripMember.find({
    tripId,
    status: TripMemberStatus.ACTIVE,
  }).distinct("userId");

  const expense = await Expense.create({
    ...payload,
    splitAmong: activeMemberIds,
    tripId: new mongoose.Types.ObjectId(tripId),
    paidBy: new mongoose.Types.ObjectId(payload.paidBy),
    activityId: payload.activityId
      ? new mongoose.Types.ObjectId(payload.activityId)
      : null,
    createdBy: new mongoose.Types.ObjectId(userId),
  });

  try {
    const trip = await Trip.findById(tripId).lean();
    if (trip) {
      notificationEvents.emit(NotificationEvents.EXPENSE_ADDED, {
        tripId,
        tripTitle: trip.title,
        expenseId: expense._id.toString(),
        addedByUserId: userId,
        amount: payload.amount,
        description: payload.description,
      });
    }
  } catch (error) {
    logger.error("Failed to emit expense added event", {
      error,
      expenseId: expense._id,
    });
  }

  return expense;
}

/**
 * Update an existing expense.
 */
export async function updateExpense(
  tripId: string,
  expId: string,
  payload: UpdateExpensePayload,
) {
  await Promise.all([
    payload.paidBy ? assertActiveMember(tripId, payload.paidBy) : undefined,
    assertLinksBelongToTrip(tripId, payload),
  ]);

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
 * Each expense is split equally among its `splitAmong` snapshot, so members
 * who join later owe nothing for it and members who leave stay in the ledger
 * (flagged as former members). Expenses created before the snapshot existed
 * fall back to the current active members; run `backfillSplitAmong` to fix
 * them in place.
 * Settlements are folded into the same balance matrix as ledger entries,
 * so netting handles overpayments correctly without a separate subtraction pass.
 */
export async function computeSplits(tripId: string): Promise<SplitBalance[]> {
  const [expenses, activeMemberIds, settlements] = await Promise.all([
    Expense.find({ tripId }).lean(),
    TripMember.find({ tripId, status: TripMemberStatus.ACTIVE }).distinct(
      "userId",
    ),
    Settlement.find({ tripId }).lean(),
  ]);

  const activeIds = activeMemberIds.map(String);
  const activeSet = new Set(activeIds);

  // balance[debtor][creditor] = net amount debtor owes creditor
  const balance: Record<string, Record<string, number>> = {};
  const addDebt = (from: string, to: string, amount: number) => {
    balance[from] ??= {};
    balance[from][to] = (balance[from][to] ?? 0) + amount;
  };

  for (const expense of expenses) {
    const paidById = expense.paidBy.toString();
    const participants = expense.splitAmong?.length
      ? expense.splitAmong.map(String)
      : activeIds;
    if (participants.length === 0) {
      continue;
    }
    const share = expense.amount / participants.length;

    for (const memberId of participants) {
      if (memberId !== paidById) {
        addDebt(memberId, paidById, share);
      }
    }
  }

  for (const settlement of settlements) {
    addDebt(
      settlement.fromUserId.toString(),
      settlement.toUserId.toString(),
      -settlement.amount,
    );
  }

  const ledgerIds = new Set<string>();
  for (const [from, row] of Object.entries(balance)) {
    ledgerIds.add(from);
    for (const to of Object.keys(row)) {
      ledgerIds.add(to);
    }
  }
  const userIds = [...ledgerIds].sort();

  const users = await User.find({ _id: { $in: userIds } })
    .select("name email")
    .lean();
  const nameById = new Map(
    users.map((u) => [u._id.toString(), u.name || u.email]),
  );
  const nameOf = (id: string) => nameById.get(id) ?? "Deleted user";

  const splits: SplitBalance[] = [];

  for (let i = 0; i < userIds.length; i++) {
    for (let j = i + 1; j < userIds.length; j++) {
      const a = userIds[i] as string;
      const b = userIds[j] as string;

      const net = (balance[a]?.[b] ?? 0) - (balance[b]?.[a] ?? 0);
      if (Math.abs(net) <= 0.005) {
        continue; // fully settled
      }
      const [from, to] = net > 0 ? [a, b] : [b, a];
      splits.push({
        fromUserId: from,
        fromUserName: nameOf(from),
        fromIsFormerMember: !activeSet.has(from),
        toUserId: to,
        toUserName: nameOf(to),
        toIsFormerMember: !activeSet.has(to),
        amount: Math.round(Math.abs(net) * 100) / 100,
      });
    }
  }

  return splits;
}

/**
 * One-off migration: give every expense without `splitAmong` the active
 * members who had joined by the time it was created. Members who already
 * left have no TripMember row, so they can't be recovered.
 * Returns the number of expenses updated.
 */
export async function backfillSplitAmong(): Promise<number> {
  const legacy = await Expense.find({ splitAmong: { $exists: false } })
    .select("tripId createdAt")
    .lean();
  if (legacy.length === 0) {
    return 0;
  }

  const members = await TripMember.find({
    tripId: { $in: [...new Set(legacy.map((e) => e.tripId.toString()))] },
    status: TripMemberStatus.ACTIVE,
  })
    .select("tripId userId joinedAt")
    .lean();

  const ops = legacy.map((expense) => {
    const splitAmong = members
      .filter(
        (m) =>
          m.tripId.equals(expense.tripId) &&
          (!m.joinedAt || m.joinedAt <= expense.createdAt),
      )
      .map((m) => m.userId);
    return {
      updateOne: {
        filter: { _id: expense._id },
        update: { $set: { splitAmong } },
      },
    };
  });

  const result = await Expense.bulkWrite(ops);
  return result.modifiedCount;
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
  userId: string,
  payload: CreateSettlementPayload,
) {
  const { fromUserId, toUserId, amount } = payload;

  const ledgerIds = await getLedgerUserIds(tripId);
  if (!ledgerIds.has(fromUserId) || !ledgerIds.has(toUserId)) {
    throw new ValidationError(
      "Both people must be trip members or appear in its expenses",
    );
  }

  return Settlement.create({
    tripId: new mongoose.Types.ObjectId(tripId),
    fromUserId: new mongoose.Types.ObjectId(fromUserId),
    toUserId: new mongoose.Types.ObjectId(toUserId),
    amount,
    createdBy: new mongoose.Types.ObjectId(userId),
  });
}

/**
 * Delete a settlement, e.g. one recorded by mistake.
 */
export async function deleteSettlement(tripId: string, settlementId: string) {
  const result = await Settlement.deleteOne({ _id: settlementId, tripId });
  if (result.deletedCount === 0) {
    throw new NotFoundError("Settlement not found");
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
      const cat = expense.category;
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
