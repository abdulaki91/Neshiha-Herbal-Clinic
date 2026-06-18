import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";

export const usePendingPayments = (search = "") =>
  useQuery({
    queryKey: ["payments", "pending", search],
    queryFn: () => axiosInstance.get("/payments/pending", { params: { search } }),
    select: (res) => res.data?.data?.visits || res.data?.visits || [],
  });

export const usePaymentHistory = (params = {}) =>
  useQuery({
    queryKey: ["payments", "history", params],
    queryFn: () => axiosInstance.get("/payments/history", { params }),
    select: (res) => res.data?.data?.payments || res.data?.payments || [],
  });

export const useProcessPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, ...data }) =>
      axiosInstance.post(`/payments/${visitId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};
