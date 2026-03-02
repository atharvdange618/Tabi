/**
 * Centralized query key factory for TanStack Query.
 */
export const queryKeys = {
  trips: () => ["trips"] as const,
  trip: (id: string) => ["trips", id] as const,
  tripDays: (id: string) => ["trips", id, "days"] as const,
  tripMembers: (id: string) => ["trips", id, "members"] as const,
  tripBudget: (id: string) => ["trips", id, "budget"] as const,
  tripExpenses: (id: string) => ["trips", id, "expenses"] as const,
  tripFiles: (id: string) => ["trips", id, "files"] as const,
  tripChecklists: (id: string) => ["trips", id, "checklists"] as const,
  tripReservations: (id: string) => ["trips", id, "reservations"] as const,
  tripComments: (id: string, targetType?: string, targetId?: string) =>
    ["trips", id, "comments", targetType, targetId].filter(Boolean) as string[],
};
