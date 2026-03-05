import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { queryKeys } from "../lib/queryKeys";
import type {
  BudgetSettings,
  Expense,
  BudgetSummary,
  ApiResponse,
} from "../../shared/types";
import { toast } from "sonner";

export function useBudgetSettings(tripId: string) {
  return useQuery({
    queryKey: queryKeys.tripBudget(tripId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BudgetSettings>>(
        `/api/v1/trips/${tripId}/budget/settings`,
      );
      return data.data;
    },
    enabled: !!tripId,
  });
}

export function useUpdateBudgetSettings(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<BudgetSettings>) => {
      const { data } = await api.put<ApiResponse<BudgetSettings>>(
        `/api/v1/trips/${tripId}/budget/settings`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tripBudget(tripId) });
      toast.success("Budget settings updated");
    },
  });
}

export function useExpenses(tripId: string) {
  return useQuery({
    queryKey: queryKeys.tripExpenses(tripId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Expense[]>>(
        `/api/v1/trips/${tripId}/budget/expenses`,
      );
      return data.data;
    },
    enabled: !!tripId,
  });
}

export function useBudgetSummary(tripId: string) {
  return useQuery({
    queryKey: [...queryKeys.tripBudget(tripId), "summary"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BudgetSummary>>(
        `/api/v1/trips/${tripId}/budget/summary`,
      );
      return data.data;
    },
    enabled: !!tripId,
  });
}

export function useCreateExpense(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Expense>) => {
      const { data } = await api.post<ApiResponse<Expense>>(
        `/api/v1/trips/${tripId}/budget/expenses`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripExpenses(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tripBudget(tripId), "summary"],
      });
      toast.success("Expense added");
    },
  });
}

export function useUpdateExpense(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      expId,
      payload,
    }: {
      expId: string;
      payload: Partial<Expense>;
    }) => {
      const { data } = await api.patch<ApiResponse<Expense>>(
        `/api/v1/trips/${tripId}/budget/expenses/${expId}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripExpenses(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tripBudget(tripId), "summary"],
      });
      toast.success("Expense updated");
    },
  });
}

export function useDeleteExpense(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expId: string) => {
      await api.delete(`/api/v1/trips/${tripId}/budget/expenses/${expId}`);
      return expId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripExpenses(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tripBudget(tripId), "summary"],
      });
      toast.success("Expense deleted");
    },
  });
}
