import { create } from "zustand";

interface TripStore {
  activeDayId: string | null;
  setActiveDay: (id: string | null) => void;
}

export const useTripStore = create<TripStore>((set) => ({
  activeDayId: null,
  setActiveDay: (id) => set({ activeDayId: id }),
}));
