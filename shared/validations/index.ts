import { z } from "zod";
import { LIMITS } from "../constants.ts";

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
export const reservationStatuses = ["confirmed", "pending"] as const;
export const expenseCategories = [
  "accommodation",
  "food",
  "transport",
  "activities",
  "shopping",
  "misc",
] as const;

// --- Trip Schemas ---

export const tripBaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  destination: z.string().max(200).optional(),
  startDate: z.string().datetime({ message: "Invalid start date" }),
  endDate: z.string().datetime({ message: "Invalid end date" }),
  travelerCount: z.number().int().positive().optional(),
  coverImageUrl: z.string().url().optional(),
  isPublic: z.boolean().optional(),
  initialBudget: z.number().nonnegative().optional(),
  tags: z
    .array(z.string().min(1).max(20))
    .max(10, "Maximum 10 tags allowed")
    .optional(),
});

export const createTripSchema = tripBaseSchema.refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays + 1 <= LIMITS.TRIP_MAX_DAYS;
  },
  {
    message: `Trip duration cannot exceed ${LIMITS.TRIP_MAX_DAYS} days`,
    path: ["endDate"],
  },
);

export const updateTripSchema = tripBaseSchema.partial().refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays + 1 <= LIMITS.TRIP_MAX_DAYS;
  },
  {
    message: `Trip duration cannot exceed ${LIMITS.TRIP_MAX_DAYS} days`,
    path: ["endDate"],
  },
);

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

export const transferOwnershipSchema = z.object({
  targetUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
});

export type InviteMemberPayload = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRolePayload = z.infer<typeof updateMemberRoleSchema>;
export type TransferOwnershipPayload = z.infer<typeof transferOwnershipSchema>;

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

export const toggleCommentReactionSchema = z.object({
  emoji: z.string().min(1).max(10),
});

export type CreateCommentPayload = z.infer<typeof createCommentSchema>;
export type UpdateCommentPayload = z.infer<typeof updateCommentSchema>;
export type ToggleCommentReactionPayload = z.infer<
  typeof toggleCommentReactionSchema
>;

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
  status: z.enum(reservationStatuses).optional(),
});

export const updateReservationSchema = createReservationSchema.partial();

export type CreateReservationPayload = z.infer<typeof createReservationSchema>;
export type UpdateReservationPayload = z.infer<typeof updateReservationSchema>;

// --- Budget Schemas ---

export const updateBudgetSettingsSchema = z.object({
  totalBudget: z.number().nonnegative(),
});

export const createExpenseSchema = z.object({
  description: z.string().min(1, "Description is required").max(300),
  amount: z.number().positive("Amount must be positive"),
  category: z.enum(expenseCategories),
  paidBy: z.string().min(1),
  date: z.string().datetime().optional(),
  activityId: z.string().optional(),
  fileId: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const createSettlementSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amount: z.number().positive(),
});

export type UpdateBudgetSettingsPayload = z.infer<
  typeof updateBudgetSettingsSchema
>;
export type CreateExpensePayload = z.infer<typeof createExpenseSchema>;
export type UpdateExpensePayload = z.infer<typeof updateExpenseSchema>;
export type CreateSettlementPayload = z.infer<typeof createSettlementSchema>;

// --- Notification Schemas ---

export const notificationQuerySchema = z.object({
  isRead: z
    .string()
    .optional()
    .transform((val) =>
      val === "true" ? true : val === "false" ? false : undefined,
    ),
  tripId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().positive().max(100)),
  skip: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().nonnegative()),
});

// --- Poll Schemas ---

export const createPollSchema = z.object({
  question: z.string().min(1, "Question is required").max(500),
  options: z
    .array(z.string().min(1, "Option cannot be empty").max(200))
    .min(2, "At least 2 options required")
    .max(10, "At most 10 options allowed"),
});

export const votePollSchema = z.object({
  optionId: z.string().min(1, "Option ID is required"),
});

export const closePollSchema = z.object({
  winningOptionId: z.string().min(1, "Winning option is required"),
});

export type CreatePollPayload = z.infer<typeof createPollSchema>;
export type VotePollPayload = z.infer<typeof votePollSchema>;
export type ClosePollPayload = z.infer<typeof closePollSchema>;

export type NotificationQueryPayload = z.infer<typeof notificationQuerySchema>;
