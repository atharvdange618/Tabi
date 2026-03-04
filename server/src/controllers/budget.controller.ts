import type { Request, Response } from "express";
import * as budgetService from "../services/budget.service.ts";
import type {
  UpdateBudgetSettingsPayload,
  CreateExpensePayload,
  UpdateExpensePayload,
} from "../../../shared/validations/index.ts";

/**
 * GET /api/v1/trips/:id/budget/settings
 * Retrieve the budget settings for a trip.
 */
export async function getBudgetSettings(
  req: Request,
  res: Response,
): Promise<void> {
  const settings = await budgetService.getBudgetSettings(
    req.params.id as string,
  );
  res.json({ data: settings });
}

/**
 * PUT /api/v1/trips/:id/budget/settings
 * Create or update budget settings for a trip (upsert).
 */
export async function upsertBudgetSettings(
  req: Request,
  res: Response,
): Promise<void> {
  const settings = await budgetService.upsertBudgetSettings(
    req.params.id as string,
    req.body as UpdateBudgetSettingsPayload,
  );
  res.json({ data: settings });
}

/**
 * GET /api/v1/trips/:id/budget/expenses
 * Retrieve all expenses for a trip.
 */
export async function getExpenses(req: Request, res: Response): Promise<void> {
  const expenses = await budgetService.getExpenses(req.params.id as string);
  res.json({ data: expenses });
}

/**
 * POST /api/v1/trips/:id/budget/expenses
 * Create a new expense for a trip.
 */
export async function createExpense(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.dbUserId) {
    res.status(401).json({ error: "Unauthorized: Missing user ID" });
    return;
  }

  const expense = await budgetService.createExpense(
    req.params.id as string,
    req.dbUserId,
    req.body as CreateExpensePayload,
  );
  res.status(201).json({ data: expense });
}

/**
 * PATCH /api/v1/trips/:id/budget/expenses/:expId
 * Update an existing expense.
 */
export async function updateExpense(
  req: Request,
  res: Response,
): Promise<void> {
  const expense = await budgetService.updateExpense(
    req.params.id as string,
    req.params.expId as string,
    req.body as UpdateExpensePayload,
  );
  res.json({ data: expense });
}

/**
 * DELETE /api/v1/trips/:id/budget/expenses/:expId
 * Delete an expense.
 */
export async function deleteExpense(
  req: Request,
  res: Response,
): Promise<void> {
  await budgetService.deleteExpense(
    req.params.id as string,
    req.params.expId as string,
  );
  res.status(204).send();
}

/**
 * GET /api/v1/trips/:id/budget/summary
 * Retrieve an aggregated budget summary for a trip.
 */
export async function getBudgetSummary(
  req: Request,
  res: Response,
): Promise<void> {
  const summary = await budgetService.getBudgetSummary(req.params.id as string);
  res.json({ data: summary });
}
