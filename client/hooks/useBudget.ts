import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { queryKeys } from "../lib/queryKeys";
import type {
  BudgetSettings,
  Expense,
  BudgetSummary,
  SplitBalance,
  Settlement,
  ApiResponse,
} from "shared/types";
import type { CreateSettlementPayload } from "shared/validations";
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
    refetchInterval: 10_000,
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
    refetchInterval: 10_000,
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripSplits(tripId),
      });
      toast.success("Expense added");
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripSplits(tripId),
      });
      toast.success("Expense deleted");
    },
  });
}

export function useSplits(tripId: string) {
  return useQuery({
    queryKey: queryKeys.tripSplits(tripId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SplitBalance[]>>(
        `/api/v1/trips/${tripId}/budget/splits`,
      );
      return data.data;
    },
    enabled: !!tripId,
  });
}

export function useSettlements(tripId: string) {
  return useQuery({
    queryKey: queryKeys.tripSettlements(tripId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Settlement[]>>(
        `/api/v1/trips/${tripId}/budget/settlements`,
      );
      return data.data;
    },
    enabled: !!tripId,
    refetchInterval: 10_000,
  });
}

export function useCreateSettlement(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSettlementPayload) => {
      const { data } = await api.post<ApiResponse<Settlement>>(
        `/api/v1/trips/${tripId}/budget/settlements`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripSplits(tripId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripSettlements(tripId),
      });
      toast.success("Settlement recorded");
    },
  });
}
