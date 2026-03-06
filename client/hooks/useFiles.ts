import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { queryKeys } from "../lib/queryKeys";
import type { FileDoc, ApiResponse } from "../../shared/types";
import { toast } from "sonner";

export function useFiles(tripId: string) {
  return useQuery({
    queryKey: queryKeys.tripFiles(tripId),
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FileDoc[]>>(
        `/api/v1/trips/${tripId}/files`,
      );
      return data.data;
    },
    enabled: !!tripId,
  });
}

export function useUploadFile(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post<ApiResponse<FileDoc>>(
        `/api/v1/trips/${tripId}/files`,
        formData,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tripFiles(tripId) });
      toast.success("File uploaded successfully");
    },
  });
}

export function useDeleteFile(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      await api.delete(`/api/v1/trips/${tripId}/files/${fileId}`);
      return fileId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tripFiles(tripId) });
      toast.success("File deleted");
    },
  });
}
