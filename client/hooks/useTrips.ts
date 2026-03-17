import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import api from "../lib/axios";
import { queryKeys } from "../lib/queryKeys";
import type {
  Trip,
  DashboardTrip,
  ApiResponse,
  PublicTrip,
} from "shared/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useTrips() {
  const { isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.trips(),
    queryFn: async () => {
      const { data } =
        await api.get<ApiResponse<DashboardTrip[]>>("/api/v1/trips");
      return data.data;
    },
    enabled: isLoaded && !!isSignedIn,
  });
}

export function usePublicTrip(id: string) {
  return useQuery({
    queryKey: [...queryKeys.trip(id), "public"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PublicTrip>>(
        `/api/v1/trips/public/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
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
      router.push(`/trips/${newTrip._id}`);
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
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tripDays(id) });
      queryClient.removeQueries({ queryKey: queryKeys.tripDays(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trip(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tripDays(id) });
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
      await queryClient.cancelQueries({ queryKey: ["trips", id] });
      queryClient.removeQueries({ queryKey: ["trips", id] });
      await api.delete(`/api/v1/trips/${id}`);
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: ["trips", id] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.trips(),
        exact: true,
      });
      toast.success("Trip deleted successfully!");
      router.push("/dashboard");
    },
  });
}

export function useUploadTripCoverImage(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("cover", file);
      const { data } = await api.post<ApiResponse<Trip>>(
        `/api/v1/trips/${id}/cover`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trip(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      toast.success("Cover image updated!");
    },
    onError: () => {
      toast.error("Failed to upload cover image.");
    },
  });
}

export interface DiscoverTrip {
  _id: string;
  title: string;
  description?: string;
  destination?: string;
  startDate: string;
  endDate: string;
  coverImageUrl?: string;
  tags?: string[];
  memberCount: number;
  createdAt: string;
}

interface DiscoverTripsResponse {
  trips: DiscoverTrip[];
  total: number;
  hasMore: boolean;
}

interface DiscoverFilters {
  search?: string;
  destination?: string;
  tags?: string[];
  minDuration?: number;
  maxDuration?: number;
}

export function useDiscoverTrips(filters: DiscoverFilters) {
  return useInfiniteQuery({
    queryKey: ["trips", "discover", filters],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("skip", String(pageParam));

      if (filters.search) params.set("search", filters.search);
      if (filters.destination) params.set("destination", filters.destination);
      if (filters.tags?.length) params.set("tags", filters.tags.join(","));
      if (filters.minDuration !== undefined)
        params.set("minDuration", String(filters.minDuration));
      if (filters.maxDuration !== undefined)
        params.set("maxDuration", String(filters.maxDuration));

      const { data } = await api.get<ApiResponse<DiscoverTripsResponse>>(
        `/api/v1/trips/discover?${params.toString()}`,
      );
      return data.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.hasMore) return undefined;
      return allPages.reduce((acc, page) => acc + page.trips.length, 0);
    },
    initialPageParam: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
  });
}
