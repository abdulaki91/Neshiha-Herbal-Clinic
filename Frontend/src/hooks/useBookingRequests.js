import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";

export const useBookingRequests = (params = {}) =>
  useQuery({
    queryKey: ["booking-requests", params],
    queryFn: () => axiosInstance.get("/booking-requests", { params }),
    select: (res) => ({ items: res.data || [], pagination: res.pagination }),
    placeholderData: (prev) => prev,
  });

export const usePendingBookingCount = (options = {}) =>
  useQuery({
    queryKey: ["booking-requests", "pending-count"],
    queryFn: () => axiosInstance.get("/booking-requests/pending-count"),
    select: (res) => res.data?.count || 0,
    refetchInterval: 60 * 1000,
    ...options,
  });

export const useUpdateBookingStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) =>
      axiosInstance.patch(`/booking-requests/${id}/status`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["booking-requests"] }),
  });
};
