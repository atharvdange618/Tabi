import { create } from "zustand";

interface TripStore {
  activeDayId: string | null;
  sidebarOpen: boolean;
  setActiveDay: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useTripStore = create<TripStore>((set) => ({
  activeDayId: null,
  sidebarOpen: true,
  setActiveDay: (id) => set({ activeDayId: id }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
