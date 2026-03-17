import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import api from "../lib/axios";
import { queryKeys } from "../lib/queryKeys";
import type { PopulatedNotification, ApiResponse } from "shared/types";
import { toast } from "sonner";
import { useNotificationStore } from "../store/notificationStore";

interface NotificationFilters {
  isRead?: boolean;
  tripId?: string;
  limit?: number;
  skip?: number;
}

export function useNotifications(filters?: NotificationFilters) {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.notifications(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isRead !== undefined) {
        params.append("isRead", String(filters.isRead));
      }
      if (filters?.tripId) {
        params.append("tripId", filters.tripId);
      }
      if (filters?.limit) {
        params.append("limit", String(filters.limit));
      }
      if (filters?.skip) {
        params.append("skip", String(filters.skip));
      }

      const { data } = await api.get<ApiResponse<PopulatedNotification[]>>(
        `/api/v1/notifications?${params.toString()}`,
      );
      return data.data;
    },
    refetchInterval: 10_000,
    enabled: isSignedIn === true,
  });
}

export function useUnreadCount() {
  const { isSignedIn } = useAuth();
  const { setUnreadCount } = useNotificationStore();

  return useQuery({
    queryKey: queryKeys.notificationUnreadCount(),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ count: number }>>(
        "/api/v1/notifications/unread-count",
      );
      const count = data.data.count;
      setUnreadCount(count);
      return count;
    },
    refetchInterval: 10_000,
    enabled: isSignedIn === true,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { decrementUnreadCount } = useNotificationStore();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data } = await api.patch<ApiResponse<PopulatedNotification>>(
        `/api/v1/notifications/${notificationId}/read`,
      );
      return data.data;
    },
    onSuccess: () => {
      decrementUnreadCount();
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationUnreadCount(),
      });
    },
    onError: () => {
      toast.error("Failed to mark notification as read");
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const { setUnreadCount } = useNotificationStore();

  return useMutation({
    mutationFn: async (tripId?: string) => {
      const params = tripId ? `?tripId=${tripId}` : "";
      await api.patch(`/api/v1/notifications/read-all${params}`);
    },
    onSuccess: () => {
      setUnreadCount(0);
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationUnreadCount(),
      });
    },
    onError: () => {
      toast.error("Failed to mark all notifications as read");
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { decrementUnreadCount } = useNotificationStore();

  return useMutation({
    mutationFn: async ({
      notificationId,
      wasUnread,
    }: {
      notificationId: string;
      wasUnread: boolean;
    }) => {
      await api.delete(`/api/v1/notifications/${notificationId}`);
      return { notificationId, wasUnread };
    },
    onSuccess: ({ wasUnread }) => {
      if (wasUnread) {
        decrementUnreadCount();
      }
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationUnreadCount(),
      });
    },
    onError: () => {
      toast.error("Failed to delete notification");
    },
  });
}
