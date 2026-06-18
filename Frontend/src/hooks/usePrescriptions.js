import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";

export const usePrescriptions = (params = {}) =>
  useQuery({
    queryKey: ["prescriptions", params],
    queryFn: () => axiosInstance.get("/prescriptions", { params }),
    select: (res) => res.data || [],
  });

export const usePrescription = (id) =>
  useQuery({
    queryKey: ["prescriptions", id],
    queryFn: () => axiosInstance.get(`/prescriptions/${id}`),
    select: (res) => res.data || res,
    enabled: !!id,
  });

export const useCreatePrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => axiosInstance.post("/prescriptions", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prescriptions"] }),
  });
};

export const useDispenseMedicine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }) =>
      axiosInstance.post(`/prescriptions/${id}/dispense`, { quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prescriptions"] }),
  });
};

export const useStopPrescription = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) =>
      axiosInstance.patch(`/prescriptions/${id}/stop`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prescriptions"] }),
  });
};
