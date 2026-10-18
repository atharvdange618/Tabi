import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { queryKeys } from "../lib/queryKeys";
import type { Checklist, ChecklistItem, ApiResponse } from "shared/types";
import { toast } from "sonner";

export function useChecklists(tripId: string) {
  return useQuery({
    queryKey: queryKeys.tripChecklists(tripId),
    queryFn: async () => {
      const { data } = await api.get<
        ApiResponse<(Checklist & { items: ChecklistItem[] })[]>
      >(`/api/v1/trips/${tripId}/checklists`);
      return data.data;
    },
    enabled: !!tripId,
  });
}

export function useCreateChecklist(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Checklist>) => {
      const { data } = await api.post<ApiResponse<Checklist>>(
        `/api/v1/trips/${tripId}/checklists`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripChecklists(tripId),
      });
      toast.success("Checklist added!");
    },
  });
}

export function useUpdateChecklist(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clId,
      payload,
    }: {
      clId: string;
      payload: Partial<Checklist>;
    }) => {
      const { data } = await api.patch<ApiResponse<Checklist>>(
        `/api/v1/trips/${tripId}/checklists/${clId}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripChecklists(tripId),
      });
    },
  });
}

export function useDeleteChecklist(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clId: string) => {
      await api.delete(`/api/v1/trips/${tripId}/checklists/${clId}`);
      return clId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripChecklists(tripId),
      });
      toast.success("Checklist removed");
    },
  });
}

export function useCreateChecklistItem(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clId,
      payload,
    }: {
      clId: string;
      payload: Partial<ChecklistItem>;
    }) => {
      const { data } = await api.post<ApiResponse<ChecklistItem>>(
        `/api/v1/trips/${tripId}/checklists/${clId}/items`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripChecklists(tripId),
      });
    },
  });
}

export function useUpdateChecklistItem(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clId,
      itemId,
      payload,
    }: {
      clId: string;
      itemId: string;
      payload: Partial<ChecklistItem>;
    }) => {
      const { data } = await api.patch<ApiResponse<ChecklistItem>>(
        `/api/v1/trips/${tripId}/checklists/${clId}/items/${itemId}`,
        payload,
      );
      return data.data;
    },
    onMutate: async ({ clId, itemId, payload }) => {
      const queryKey = queryKeys.tripChecklists(tripId);
      await queryClient.cancelQueries({ queryKey });

      const prev = queryClient.getQueryData<ChecklistWithItems[]>(queryKey);

      if (prev) {
        queryClient.setQueryData(
          queryKey,
          patchChecklistItem(prev, clId, itemId, payload),
        );
      }

      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(queryKeys.tripChecklists(tripId), ctx?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripChecklists(tripId),
      });
    },
  });
}

type ChecklistWithItems = Checklist & { items: ChecklistItem[] };

export function patchChecklistItem(
  lists: ChecklistWithItems[],
  clId: string,
  itemId: string,
  payload: Partial<ChecklistItem>,
): ChecklistWithItems[] {
  return lists.map((cl) =>
    cl._id !== clId
      ? cl
      : {
          ...cl,
          items: cl.items.map((item) =>
            item._id === itemId ? { ...item, ...payload } : item,
          ),
        },
  );
}

export function useDeleteChecklistItem(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clId, itemId }: { clId: string; itemId: string }) => {
      await api.delete(
        `/api/v1/trips/${tripId}/checklists/${clId}/items/${itemId}`,
      );
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripChecklists(tripId),
      });
    },
  });
}
