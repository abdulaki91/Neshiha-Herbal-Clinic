import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";

export const useStaff = (params = {}) =>
  useQuery({
    queryKey: ["staff", params],
    queryFn: () => axiosInstance.get("/staff", { params }),
    select: (res) => ({
      staff: res.data || [],
      pagination: res.pagination,
    }),
    // v5 equivalent of keepPreviousData — avoids a flash of empty rows when paging
    placeholderData: (prev) => prev,
  });

export const useStaffMember = (id) =>
  useQuery({
    queryKey: ["staff", "detail", id],
    queryFn: () => axiosInstance.get(`/staff/${id}`),
    select: (res) => res.data || res,
    enabled: !!id,
  });

export const useStaffStats = (opts = {}) =>
  useQuery({
    queryKey: ["staff", "stats"],
    queryFn: () => axiosInstance.get("/staff/stats"),
    select: (res) => res.data || res,
    ...opts,
  });

const invalidateStaff = (qc) => qc.invalidateQueries({ queryKey: ["staff"] });

export const useCreateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => axiosInstance.post("/staff", data),
    onSuccess: () => invalidateStaff(qc),
  });
};

export const useUpdateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => axiosInstance.put(`/staff/${id}`, data),
    onSuccess: () => invalidateStaff(qc),
  });
};

export const useDeleteStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => axiosInstance.delete(`/staff/${id}`),
    onSuccess: () => invalidateStaff(qc),
  });
};

export const useActivateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => axiosInstance.patch(`/staff/${id}/activate`),
    onSuccess: () => invalidateStaff(qc),
  });
};

export const useDeactivateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => axiosInstance.patch(`/staff/${id}/deactivate`),
    onSuccess: () => invalidateStaff(qc),
  });
};

export const useResetStaffPassword = () =>
  useMutation({
    mutationFn: ({ id, password }) =>
      axiosInstance.post(`/staff/${id}/reset-password`, { password }),
  });
