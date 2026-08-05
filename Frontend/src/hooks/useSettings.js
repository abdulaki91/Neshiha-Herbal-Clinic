import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";

export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: () => axiosInstance.get("/settings"),
    select: (res) => res.data || res,
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => axiosInstance.put("/settings", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
};

export const useUploadLogo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append("logo", file);
      return axiosInstance.post("/settings/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
};
