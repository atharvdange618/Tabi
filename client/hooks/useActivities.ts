import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { queryKeys } from "../lib/queryKeys";
import type { Activity, ApiResponse } from "shared/types";
import { toast } from "sonner";

export function useActivities(tripId: string, dayId: string) {
  return useQuery({
    queryKey: [...queryKeys.tripDays(tripId), dayId, "activities"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Activity[]>>(
        `/api/v1/trips/${tripId}/days/${dayId}/activities`,
      );
      return data.data;
    },
    enabled: !!tripId && !!dayId,
    refetchInterval: 10_000,
  });
}

export function useAllActivities(tripId: string) {
  return useQuery({
    queryKey: queryKeys.tripAllActivities(tripId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Activity[]>>(
        `/api/v1/trips/${tripId}/activities`,
      );
      return data.data;
    },
    enabled: !!tripId,
    refetchInterval: 10_000,
  });
}

export function useCreateActivity(tripId: string, dayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Activity>) => {
      const { data } = await api.post<ApiResponse<Activity>>(
        `/api/v1/trips/${tripId}/days/${dayId}/activities`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tripDays(tripId), dayId, "activities"],
      });
      toast.success("Activity added!");
    },
  });
}

export function useUpdateActivity(tripId: string, dayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      actId,
      payload,
    }: {
      actId: string;
      payload: Partial<Activity>;
    }) => {
      const { data } = await api.patch<ApiResponse<Activity>>(
        `/api/v1/trips/${tripId}/days/${dayId}/activities/${actId}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tripDays(tripId), dayId, "activities"],
      });
      toast.success("Activity updated");
    },
  });
}

export function useDeleteActivity(tripId: string, dayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (actId: string) => {
      await api.delete(
        `/api/v1/trips/${tripId}/days/${dayId}/activities/${actId}`,
      );
      return actId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tripDays(tripId), dayId, "activities"],
      });
      toast.success("Activity removed");
    },
  });
}

export function useReorderActivities(tripId: string, dayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityIds: string[]) => {
      const activities = activityIds.map((id, index) => ({
        _id: id,
        position: (index + 1) * 1024,
      }));

      const { data } = await api.patch(
        `/api/v1/trips/${tripId}/days/${dayId}/activities/reorder`,
        {
          activities,
        },
      );
      return data;
    },
    onMutate: async (newOrder) => {
      const queryKey = [...queryKeys.tripDays(tripId), dayId, "activities"];
      await queryClient.cancelQueries({ queryKey });

      const prev = queryClient.getQueryData<Activity[]>(queryKey);

      if (prev) {
        const reordered = newOrder
          .map((id) => prev.find((act) => act._id === id))
          .filter(Boolean) as Activity[];

        queryClient.setQueryData(queryKey, reordered);
      }

      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(
        [...queryKeys.tripDays(tripId), dayId, "activities"],
        ctx?.prev,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tripDays(tripId), dayId, "activities"],
      });
    },
  });
}
