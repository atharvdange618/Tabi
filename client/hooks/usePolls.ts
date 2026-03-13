import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { queryKeys } from "../lib/queryKeys";
import type { Poll, ApiResponse } from "shared/types";
import { toast } from "sonner";

export function usePolls(tripId: string) {
  return useQuery({
    queryKey: queryKeys.tripPolls(tripId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Poll[]>>(
        `/api/v1/trips/${tripId}/polls`,
      );
      return data.data;
    },
    enabled: !!tripId,
    refetchInterval: 10_000,
  });
}

export function useCreatePoll(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { question: string; options: string[] }) => {
      const { data } = await api.post<ApiResponse<Poll>>(
        `/api/v1/trips/${tripId}/polls`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripPolls(tripId),
      });
      toast.success("Poll created!");
    },
  });
}

export function useVotePoll(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pollId,
      optionId,
    }: {
      pollId: string;
      optionId: string;
    }) => {
      const { data } = await api.post<ApiResponse<Poll>>(
        `/api/v1/trips/${tripId}/polls/${pollId}/vote`,
        { optionId },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripPolls(tripId),
      });
    },
    onError: () => {
      toast.error("Could not register vote");
    },
  });
}

export function useClosePoll(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pollId,
      winningOptionId,
    }: {
      pollId: string;
      winningOptionId: string;
    }) => {
      const { data } = await api.patch<ApiResponse<Poll>>(
        `/api/v1/trips/${tripId}/polls/${pollId}/close`,
        { winningOptionId },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripPolls(tripId),
      });
      toast.success("Poll closed");
    },
  });
}

export function useDeletePoll(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pollId: string) => {
      await api.delete(`/api/v1/trips/${tripId}/polls/${pollId}`);
      return pollId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripPolls(tripId),
      });
      toast.success("Poll deleted");
    },
  });
}
