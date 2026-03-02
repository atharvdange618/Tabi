import { z } from "zod";

// ============================================================
// Shared Zod Schemas for Tabi
// ============================================================

// --- Enum Values ---

export const tripMemberRoles = ["owner", "editor", "viewer"] as const;
export const inviteRoles = ["editor", "viewer"] as const;
export const tripMemberStatuses = ["active", "pending"] as const;
export const activityTypes = [
  "sightseeing",
  "food",
  "transport",
  "accommodation",
  "activity",
  "other",
] as const;
export const commentTargetTypes = ["day", "activity"] as const;
export const reservationTypes = [
  "flight",
  "hotel",
  "car_rental",
  "restaurant",
  "activity",
  "other",
] as const;
export const expenseCategories = [
  "accommodation",
  "food",
  "transport",
  "activities",
  "shopping",
  "misc",
] as const;

// --- Trip Schemas ---

export const createTripSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  startDate: z.string().datetime({ message: "Invalid start date" }),
  endDate: z.string().datetime({ message: "Invalid end date" }),
  travelerCount: z.number().int().positive().optional(),
  coverImageUrl: z.string().url().optional(),
});

export const updateTripSchema = createTripSchema.partial();

export type CreateTripPayload = z.infer<typeof createTripSchema>;
export type UpdateTripPayload = z.infer<typeof updateTripSchema>;

// --- Invite Schemas ---

export const inviteMemberSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(inviteRoles),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(tripMemberRoles),
});

export type InviteMemberPayload = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRolePayload = z.infer<typeof updateMemberRoleSchema>;

// --- Day Schemas ---

export const updateDaySchema = z.object({
  label: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export type UpdateDayPayload = z.infer<typeof updateDaySchema>;

// --- Activity Schemas ---

export const createActivitySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  type: z.enum(activityTypes),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
  estimatedCost: z.number().nonnegative().optional(),
});

export const updateActivitySchema = createActivitySchema.partial();

export const reorderActivitiesSchema = z.object({
  activities: z.array(
    z.object({
      _id: z.string(),
      position: z.number(),
    }),
  ),
});

export type CreateActivityPayload = z.infer<typeof createActivitySchema>;
export type UpdateActivityPayload = z.infer<typeof updateActivitySchema>;
export type ReorderActivitiesPayload = z.infer<typeof reorderActivitiesSchema>;

// --- Comment Schemas ---

export const createCommentSchema = z.object({
  targetType: z.enum(commentTargetTypes),
  targetId: z.string().min(1),
  body: z.string().min(1, "Comment cannot be empty").max(2000),
  parentId: z.string().optional(),
});

export const updateCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty").max(2000),
});

export type CreateCommentPayload = z.infer<typeof createCommentSchema>;
export type UpdateCommentPayload = z.infer<typeof updateCommentSchema>;

// --- Checklist Schemas ---

export const createChecklistSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
});

export const updateChecklistSchema = createChecklistSchema.partial();

export const createChecklistItemSchema = z.object({
  label: z.string().min(1, "Label is required").max(200),
});

export const updateChecklistItemSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  isChecked: z.boolean().optional(),
});

export type CreateChecklistPayload = z.infer<typeof createChecklistSchema>;
export type UpdateChecklistPayload = z.infer<typeof updateChecklistSchema>;
export type CreateChecklistItemPayload = z.infer<
  typeof createChecklistItemSchema
>;
export type UpdateChecklistItemPayload = z.infer<
  typeof updateChecklistItemSchema
>;

// --- Reservation Schemas ---

export const createReservationSchema = z.object({
  type: z.enum(reservationTypes),
  title: z.string().min(1, "Title is required").max(200),
  confirmationNumber: z.string().max(100).optional(),
  provider: z.string().max(200).optional(),
  datetime: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
  fileId: z.string().optional(),
});

export const updateReservationSchema = createReservationSchema.partial();

export type CreateReservationPayload = z.infer<typeof createReservationSchema>;
export type UpdateReservationPayload = z.infer<typeof updateReservationSchema>;

// --- Budget Schemas ---

export const updateBudgetSettingsSchema = z.object({
  totalBudget: z.number().nonnegative(),
  currency: z.string().length(3, "Currency must be a 3-letter ISO code"),
});

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required").max(300),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3).optional(),
  category: z.enum(expenseCategories),
  paidBy: z.string().min(1),
  date: z.string().datetime().optional(),
  activityId: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type UpdateBudgetSettingsPayload = z.infer<
  typeof updateBudgetSettingsSchema
>;
export type CreateExpensePayload = z.infer<typeof createExpenseSchema>;
export type UpdateExpensePayload = z.infer<typeof updateExpenseSchema>;
