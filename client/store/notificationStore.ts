import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),
      incrementUnreadCount: () =>
        set((state) => ({ unreadCount: state.unreadCount + 1 })),
      decrementUnreadCount: () =>
        set((state) => ({
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),
    }),
    {
      name: "tabi-notification-store",
    },
  ),
);
