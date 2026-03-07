/**
 * Tabi Platform Limits
 *
 * Single source of truth for all per-entity record count guardrails.
 */
export const LIMITS = {
  TRIPS_PER_USER: 25,

  TRIP_MAX_DAYS: 30,

  ACTIVITIES_PER_DAY: 20,

  COMMENTS_PER_TARGET: 100,

  CHECKLISTS_PER_TRIP: 10,

  ITEMS_PER_CHECKLIST: 50,

  FILES_PER_TRIP: 50,

  EXPENSES_PER_TRIP: 200,

  RESERVATIONS_PER_TRIP: 50,

  /**
   * Max active + pending members per trip combined.
   * Includes the owner.
   */
  MEMBERS_PER_TRIP: 20,
} as const;

export type Limits = typeof LIMITS;
