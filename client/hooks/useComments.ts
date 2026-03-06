import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { queryKeys } from "../lib/queryKeys";
import type { Comment, ApiResponse } from "shared/types";
import { toast } from "sonner";

export function useComments(
  tripId: string,
  targetType: string,
  targetId: string,
) {
  return useQuery({
    queryKey: queryKeys.tripComments(tripId, targetType, targetId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Comment[]>>(
        `/api/v1/trips/${tripId}/comments?targetType=${targetType}&targetId=${targetId}`,
      );
      return data.data;
    },
    enabled: !!tripId && !!targetId,
    refetchInterval: 30_000,
  });
}

export function useCreateComment(
  tripId: string,
  targetType: string,
  targetId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { body: string; parentId?: string }) => {
      const { data } = await api.post<ApiResponse<Comment>>(
        `/api/v1/trips/${tripId}/comments`,
        {
          body: payload.body,
          targetType,
          targetId,
          ...(payload.parentId && { parentId: payload.parentId }),
        },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripComments(tripId, targetType, targetId),
      });
    },
  });
}

export function useUpdateComment(
  tripId: string,
  targetType: string,
  targetId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      payload,
    }: {
      commentId: string;
      payload: Partial<Comment>;
    }) => {
      const { data } = await api.patch<ApiResponse<Comment>>(
        `/api/v1/trips/${tripId}/comments/${commentId}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripComments(tripId, targetType, targetId),
      });
      toast.success("Comment updated");
    },
  });
}

export function useDeleteComment(
  tripId: string,
  targetType: string,
  targetId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/api/v1/trips/${tripId}/comments/${commentId}`);
      return commentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripComments(tripId, targetType, targetId),
      });
      toast.success("Comment deleted");
    },
  });
}
