import { Router } from "express";
import * as budgetController from "../controllers/budget.controller.ts";
import { requireAuthentication, resolveDbUser } from "../middleware/auth.ts";
import { requireRole, requireMembership } from "../middleware/permissions.ts";
import { validate } from "../middleware/validate.ts";
import {
  updateBudgetSettingsSchema,
  createExpenseSchema,
  updateExpenseSchema,
} from "../../../shared/validations/index.ts";

const router = Router({ mergeParams: true });

const auth = [requireAuthentication, resolveDbUser] as const;

// GET /api/v1/trips/:id/budget/settings
router.get(
  "/settings",
  ...auth,
  requireMembership(),
  budgetController.getBudgetSettings,
);

// PUT /api/v1/trips/:id/budget/settings
router.put(
  "/settings",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(updateBudgetSettingsSchema),
  budgetController.upsertBudgetSettings,
);

// GET /api/v1/trips/:id/budget/expenses
router.get(
  "/expenses",
  ...auth,
  requireMembership(),
  budgetController.getExpenses,
);

// POST /api/v1/trips/:id/budget/expenses
router.post(
  "/expenses",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(createExpenseSchema),
  budgetController.createExpense,
);

// PATCH /api/v1/trips/:id/budget/expenses/:expId
router.patch(
  "/expenses/:expId",
  ...auth,
  requireRole(["owner", "editor"]),
  validate(updateExpenseSchema),
  budgetController.updateExpense,
);

// DELETE /api/v1/trips/:id/budget/expenses/:expId
router.delete(
  "/expenses/:expId",
  ...auth,
  requireRole(["owner", "editor"]),
  budgetController.deleteExpense,
);

// GET /api/v1/trips/:id/budget/summary
router.get(
  "/summary",
  ...auth,
  requireMembership(),
  budgetController.getBudgetSummary,
);

export default router;
