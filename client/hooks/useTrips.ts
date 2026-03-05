import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import api from "../lib/axios";
import { queryKeys } from "../lib/queryKeys";
import type { Trip, ApiResponse } from "../../shared/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useTrips() {
  const { isLoaded } = useAuth();

  return useQuery({
    queryKey: queryKeys.trips(),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Trip[]>>("/api/v1/trips");
      return data.data;
    },
    enabled: isLoaded,
  });
}

export function useTrip(id: string) {
  const { isLoaded } = useAuth();

  return useQuery({
    queryKey: queryKeys.trip(id),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Trip>>(`/api/v1/trips/${id}`);
      return data.data;
    },
    enabled: isLoaded && !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: Partial<Trip>) => {
      const { data } = await api.post<ApiResponse<Trip>>(
        "/api/v1/trips",
        payload,
      );
      return data.data;
    },
    onSuccess: (newTrip) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      toast.success("Trip created successfully!");
      router.push(`/trips/${newTrip._id}/itinerary`);
    },
  });
}

export function useUpdateTrip(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<Trip>) => {
      const { data } = await api.patch<ApiResponse<Trip>>(
        `/api/v1/trips/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trip(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      toast.success("Trip updated successfully!");
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/trips/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      toast.success("Trip deleted successfully!");
      router.push("/dashboard");
    },
  });
}
