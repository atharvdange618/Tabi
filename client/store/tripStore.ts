import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TabValue =
  | "overview"
  | "itinerary"
  | "budget"
  | "files"
  | "checklists"
  | "reservations"
  | "members"
  | "polls"
  | "settings";

interface TripStore {
  activeDayId: string | null;
  setActiveDay: (id: string | null) => void;
  activeTabs: Record<string, TabValue>;
  setActiveTab: (tripId: string, tab: TabValue) => void;
  getActiveTab: (tripId: string) => TabValue;
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      activeDayId: null,
      setActiveDay: (id) => set({ activeDayId: id }),
      activeTabs: {},
      setActiveTab: (tripId, tab) =>
        set((s) => ({ activeTabs: { ...s.activeTabs, [tripId]: tab } })),
      getActiveTab: (tripId) => get().activeTabs[tripId] ?? "overview",
    }),
    {
      name: "tabi-trip-store",
      partialize: (s) => ({ activeTabs: s.activeTabs }),
    },
  ),
);
