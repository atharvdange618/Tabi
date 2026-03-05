import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { queryKeys } from "../lib/queryKeys";
import type {
  TripMember,
  PopulatedTripMember,
  PendingInvite,
  ApiResponse,
} from "../../shared/types";
import { toast } from "sonner";

export function useMembers(tripId: string) {
  return useQuery({
    queryKey: queryKeys.tripMembers(tripId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PopulatedTripMember[]>>(
        `/api/v1/trips/${tripId}/members`,
      );
      return data.data;
    },
    select: (members) => ({
      active: members.filter((m) => m.status === "active"),
      pending: members.filter((m) => m.status === "pending"),
    }),
    enabled: !!tripId,
  });
}

export function useInviteMember(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      email: string;
      role: "editor" | "viewer";
    }) => {
      const { data } = await api.post<ApiResponse<PendingInvite>>(
        `/api/v1/trips/${tripId}/members/invite`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripMembers(tripId),
      });
      toast.success("Invitation sent!");
    },
  });
}

export function useUpdateMemberRole(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "editor" | "viewer";
    }) => {
      const { data } = await api.patch<ApiResponse<TripMember>>(
        `/api/v1/trips/${tripId}/members/${userId}`,
        { role },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripMembers(tripId),
      });
      toast.success("Member role updated");
    },
  });
}

export function useRemoveMember(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/api/v1/trips/${tripId}/members/${userId}`);
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tripMembers(tripId),
      });
      toast.success("Member removed");
    },
  });
}

// Global actions for invitations
export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post(`/api/v1/invites/${token}/accept`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trips() });
      toast.success("Invitation accepted! Welcome to the trip.");
    },
  });
}

export function useDeclineInvite() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post(`/api/v1/invites/${token}/decline`);
      return data;
    },
    onSuccess: () => {
      toast.success("Invitation declined.");
    },
  });
}
