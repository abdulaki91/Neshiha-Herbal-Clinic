import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";

export const usePatients = (params = {}) =>
  useQuery({
    queryKey: ["patients", params],
    queryFn: () => axiosInstance.get("/patients", { params }),
    select: (res) => ({
      patients: res.data || [],
      pagination: res.pagination,
    }),
  });

export const usePatient = (id) =>
  useQuery({
    queryKey: ["patients", id],
    queryFn: () => axiosInstance.get(`/patients/${id}`),
    select: (res) => res.data || res,
    enabled: !!id,
  });

export const usePatientHistory = (id) =>
  useQuery({
    queryKey: ["patients", id, "history"],
    queryFn: () => axiosInstance.get(`/patients/${id}/history`),
    select: (res) => res.data || res,
    enabled: !!id,
  });

export const useCreatePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => axiosInstance.post("/patients", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
};

export const useUpdatePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => axiosInstance.put(`/patients/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
};

export const useDeletePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => axiosInstance.delete(`/patients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
};
