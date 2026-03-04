// ============================================================
// Shared Type Definitions for Tabi
// Used by both client and server
// ============================================================

// --- Enums ---

export const TripMemberRole = {
  OWNER: "owner",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;
export type TripMemberRole =
  (typeof TripMemberRole)[keyof typeof TripMemberRole];

export const TripMemberStatus = {
  ACTIVE: "active",
  PENDING: "pending",
} as const;
export type TripMemberStatus =
  (typeof TripMemberStatus)[keyof typeof TripMemberStatus];

export const ActivityType = {
  SIGHTSEEING: "sightseeing",
  FOOD: "food",
  TRANSPORT: "transport",
  ACCOMMODATION: "accommodation",
  ACTIVITY: "activity",
  OTHER: "other",
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export const CommentTargetType = {
  DAY: "day",
  ACTIVITY: "activity",
} as const;
export type CommentTargetType =
  (typeof CommentTargetType)[keyof typeof CommentTargetType];

export const ReservationType = {
  FLIGHT: "flight",
  HOTEL: "hotel",
  CAR_RENTAL: "car_rental",
  RESTAURANT: "restaurant",
  ACTIVITY: "activity",
  OTHER: "other",
} as const;
export type ReservationType =
  (typeof ReservationType)[keyof typeof ReservationType];

export const ExpenseCategory = {
  ACCOMMODATION: "accommodation",
  FOOD: "food",
  TRANSPORT: "transport",
  ACTIVITIES: "activities",
  SHOPPING: "shopping",
  MISC: "misc",
} as const;
export type ExpenseCategory =
  (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

// --- Document Types ---

export interface User {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
}

export interface Trip {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  travelerCount?: number;
  coverImageUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripMember {
  _id: string;
  tripId: string;
  userId: string;
  role: TripMemberRole;
  status: TripMemberStatus;
  invitedBy: string;
  joinedAt?: string;
  createdAt: string;
}

export interface PendingInvite {
  _id: string;
  tripId: string;
  email: string;
  role: Exclude<TripMemberRole, "owner">;
  invitedBy: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface Day {
  _id: string;
  tripId: string;
  date: string;
  label?: string;
  notes?: string;
  createdAt: string;
}

export interface Activity {
  _id: string;
  dayId: string;
  tripId: string;
  title: string;
  type: ActivityType;
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
  estimatedCost?: number;
  position: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  tripId: string;
  targetType: CommentTargetType;
  targetId: string;
  body: string;
  authorId: string;
  parentId?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  _id: string;
  tripId: string;
  title: string;
  position: number;
  createdBy: string;
  createdAt: string;
}

export interface ChecklistItem {
  _id: string;
  checklistId: string;
  label: string;
  isChecked: boolean;
  checkedBy?: string;
  checkedAt?: string;
  position: number;
  createdAt: string;
}

export interface FileDoc {
  _id: string;
  tripId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  cloudinaryId: string;
  cloudinaryUrl: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Reservation {
  _id: string;
  tripId: string;
  type: ReservationType;
  title: string;
  confirmationNumber?: string;
  provider?: string;
  datetime?: string;
  notes?: string;
  fileId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSettings {
  _id: string;
  tripId: string;
  totalBudget: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  _id: string;
  tripId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  paidBy: string;
  date?: string;
  activityId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// --- API Response Types ---

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string | Record<string, unknown>;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// --- Budget Summary ---

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  currency: "INR";
  byCategory: Record<ExpenseCategory, number>;
}

// --- Types for Clerk webhook payloads ---

export interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

export interface ClerkUserPayload {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string;
}

export interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserPayload;
}
