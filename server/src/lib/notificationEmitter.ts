import { EventEmitter } from "events";

/**
 * Event type constants for the notification system.
 */
export const NotificationEvents = {
  OWNERSHIP_TRANSFERRED: "ownership.transferred",
  MEMBER_LEFT: "member.left",
  MEMBER_INVITED: "member.invited",
  COMMENT_CREATED: "comment.created",
  EXPENSE_ADDED: "expense.added",
  ROLE_CHANGED: "role.changed",
  ACTIVITY_UPDATED: "activity.updated",
  RESERVATION_ADDED: "reservation.added",
  TRIP_UPDATED: "trip.updated",
} as const;

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
  invitedUserId: string;
  invitedByUserId: string;
}

export interface CommentCreatedPayload {
  tripId: string;
  tripTitle: string;
  commentId: string;
  authorId: string;
  targetType: "day" | "activity";
  targetId: string;
}

export interface ExpenseAddedPayload {
  tripId: string;
  tripTitle: string;
  expenseId: string;
  addedByUserId: string;
  amount: number;
  description: string;
}

export interface RoleChangedPayload {
  tripId: string;
  tripTitle: string;
  userId: string;
  oldRole: string;
  newRole: string;
  changedByUserId: string;
}

export interface ActivityUpdatedPayload {
  tripId: string;
  tripTitle: string;
  activityId: string;
  updatedByUserId: string;
}

export interface ReservationAddedPayload {
  tripId: string;
  tripTitle: string;
  reservationId: string;
  addedByUserId: string;
}

export interface TripUpdatedPayload {
  tripId: string;
  tripTitle: string;
  updatedByUserId: string;
  changes: string[];
}

/**
 * Type map for event names to their payloads.
 */
export interface NotificationEventMap {
  [NotificationEvents.OWNERSHIP_TRANSFERRED]: OwnershipTransferredPayload;
  [NotificationEvents.MEMBER_LEFT]: MemberLeftPayload;
  [NotificationEvents.MEMBER_INVITED]: MemberInvitedPayload;
  [NotificationEvents.COMMENT_CREATED]: CommentCreatedPayload;
  [NotificationEvents.EXPENSE_ADDED]: ExpenseAddedPayload;
  [NotificationEvents.ROLE_CHANGED]: RoleChangedPayload;
  [NotificationEvents.ACTIVITY_UPDATED]: ActivityUpdatedPayload;
  [NotificationEvents.RESERVATION_ADDED]: ReservationAddedPayload;
  [NotificationEvents.TRIP_UPDATED]: TripUpdatedPayload;
}

/**
 * Type-safe EventEmitter for notifications.
 */
class TypedNotificationEmitter extends EventEmitter {
  override emit<K extends keyof NotificationEventMap>(
    event: K,
    payload: NotificationEventMap[K],
  ): boolean {
    return super.emit(event, payload);
  }

  override on<K extends keyof NotificationEventMap>(
    event: K,
    listener: (payload: NotificationEventMap[K]) => void | Promise<void>,
  ): this {
    return super.on(event, listener);
  }

  override once<K extends keyof NotificationEventMap>(
    event: K,
    listener: (payload: NotificationEventMap[K]) => void | Promise<void>,
  ): this {
    return super.once(event, listener);
  }
}

/**
 * Singleton instance of the notification event emitter.
 *
 * Note: This EventEmitter works within a single Node.js process.
 * For horizontal scaling across multiple server instances, migrate to
 * Redis Pub/Sub, RabbitMQ, or another distributed message broker.
 */
export const notificationEvents = new TypedNotificationEmitter();

notificationEvents.setMaxListeners(20);
