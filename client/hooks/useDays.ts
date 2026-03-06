import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { queryKeys } from "../lib/queryKeys";
import type { Day, ApiResponse } from "shared/types";
import { toast } from "sonner";

export function useDays(tripId: string) {
  return useQuery({
    queryKey: queryKeys.tripDays(tripId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Day[]>>(
        `/api/v1/trips/${tripId}/days`,
      );
      return data.data;
    },
    enabled: !!tripId,
  });
}

export function useUpdateDay(tripId: string, dayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Day>) => {
      const { data } = await api.patch<ApiResponse<Day>>(
        `/api/v1/trips/${tripId}/days/${dayId}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tripDays(tripId) });
      toast.success("Day notes updated");
    },
  });
}
