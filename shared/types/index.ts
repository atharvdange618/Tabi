import type { CloudinaryResourceType } from "../../server/src/models/File.ts";
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

export const ReservationStatus = {
  CONFIRMED: "confirmed",
  PENDING: "pending",
} as const;
export type ReservationStatus =
  (typeof ReservationStatus)[keyof typeof ReservationStatus];

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

export const NotificationType = {
  OWNERSHIP_TRANSFERRED: "ownership_transferred",
  MEMBER_LEFT: "member_left",
  MEMBER_INVITED: "member_invited",
  COMMENT_CREATED: "comment_created",
  EXPENSE_ADDED: "expense_added",
  ROLE_CHANGED: "role_changed",
  ACTIVITY_UPDATED: "activity_updated",
  RESERVATION_ADDED: "reservation_added",
  TRIP_UPDATED: "trip_updated",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

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
  destination?: string;
  startDate: string;
  endDate: string;
  initialBudget?: number;
  travelerCount?: number;
  coverImageUrl?: string;
  isPublic?: boolean;
  createdBy: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardTripMember {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface DashboardTrip extends Trip {
  memberCount: number;
  activityCount: number;
  members: DashboardTripMember[];
}

export interface TripMember {
  _id: string;
  tripId: string;
  userId: string;
  role: TripMemberRole;
  status: TripMemberStatus;
  invitedBy: string;
  joinedAt?: string;
  pendingOwnershipTransfer?: {
    fromUserId: string;
    transferredAt: string;
  };
  createdAt: string;
}

export interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface PopulatedTripMember extends Omit<
  TripMember,
  "userId" | "invitedBy" | "pendingOwnershipTransfer"
> {
  userId: PopulatedUser | null;
  invitedBy: PopulatedUser;
  pendingOwnershipTransfer?: {
    fromUserId: PopulatedUser;
    transferredAt: string;
  };
  email?: string;
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

export interface CommentReaction {
  emoji: string;
  users: string[];
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
  reactions: CommentReaction[];
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
  resourceType: CloudinaryResourceType;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
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
  status?: ReservationStatus;
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
  fileId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PopulatedExpense extends Omit<Expense, "paidBy"> {
  paidBy: PopulatedUser;
}

export interface Notification {
  _id: string;
  userId: string;
  tripId: string;
  type: NotificationType;
  actorId: string;
  message: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface PopulatedNotification extends Omit<
  Notification,
  "userId" | "actorId" | "tripId"
> {
  userId: PopulatedUser;
  actorId: PopulatedUser;
  tripId: { _id: string; title: string };
}

// --- Event Payload Types ---

export interface OwnershipTransferredPayload {
  tripId: string;
  tripTitle: string;
  oldOwnerId: string;
  newOwnerId: string;
  actorId: string;
}

export interface MemberLeftPayload {
  tripId: string;
  tripTitle: string;
  userId: string;
  userName: string;
}

export interface MemberInvitedPayload {
  tripId: string;
  tripTitle: string;
  invitedEmail: string;
  invitedById: string;
  role: TripMemberRole;
}

export interface CommentCreatedPayload {
  tripId: string;
  tripTitle: string;
  commentId: string;
  authorId: string;
  targetType: CommentTargetType;
  targetId: string;
}

export interface ExpenseAddedPayload {
  tripId: string;
  tripTitle: string;
  expenseId: string;
  createdById: string;
  amount: number;
  description: string;
}

export interface RoleChangedPayload {
  tripId: string;
  tripTitle: string;
  userId: string;
  oldRole: TripMemberRole;
  newRole: TripMemberRole;
  changedById: string;
}

export interface ActivityUpdatedPayload {
  tripId: string;
  tripTitle: string;
  activityId: string;
  updatedById: string;
  action: "created" | "updated" | "deleted";
}

export interface ReservationAddedPayload {
  tripId: string;
  tripTitle: string;
  reservationId: string;
  createdById: string;
  type: ReservationType;
  title: string;
}

export interface TripUpdatedPayload {
  tripId: string;
  tripTitle: string;
  updatedById: string;
  changes: string[];
}

// --- Public Trip Types ---

export interface PublicActivity {
  _id: string;
  dayId: string;
  title: string;
  type: ActivityType;
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
  position: number;
}

export interface PublicDay {
  _id: string;
  date: string;
  label?: string;
  notes?: string;
}

export interface PublicTrip {
  _id: string;
  title: string;
  description?: string;
  destination?: string;
  startDate: string;
  endDate: string;
  coverImageUrl?: string;
  members: { initials: string }[];
  days: PublicDay[];
  activities: PublicActivity[];
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

// --- Splits & Settlements ---

export interface SplitBalance {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export interface Settlement {
  _id: string;
  tripId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
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
