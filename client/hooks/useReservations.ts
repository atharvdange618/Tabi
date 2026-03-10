import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { queryKeys } from "../lib/queryKeys";
import type { Reservation, ApiResponse } from "shared/types";
import { toast } from "sonner";

export function useReservations(tripId: string) {
  return useQuery({
    queryKey: queryKeys.tripReservations(tripId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Reservation[]>>(
        `/api/v1/trips/${tripId}/reservations`,
      );
      return data.data;
    },
    enabled: !!tripId,
    refetchInterval: 10_000,
  });
}

export function useCreateReservation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Reservation>) => {
      const { data } = await api.post<ApiResponse<Reservation>>(
        `/api/v1/trips/${tripId}/reservations`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripReservations(tripId),
      });
      toast.success("Reservation added!");
    },
  });
}

export function useUpdateReservation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resId,
      payload,
    }: {
      resId: string;
      payload: Partial<Reservation>;
    }) => {
      const { data } = await api.patch<ApiResponse<Reservation>>(
        `/api/v1/trips/${tripId}/reservations/${resId}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripReservations(tripId),
      });
      toast.success("Reservation updated");
    },
  });
}

export function useDeleteReservation(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resId: string) => {
      await api.delete(`/api/v1/trips/${tripId}/reservations/${resId}`);
      return resId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripReservations(tripId),
      });
      toast.success("Reservation deleted");
    },
  });
}
