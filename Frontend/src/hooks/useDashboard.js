import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";
import useAuthStore from "../store/authStore";

export const useDashboard = () => {
  const role = useAuthStore((s) => s.user?.role);
  const endpoint =
    role === "doctor"
      ? "/dashboard/doctor"
      : role === "data_clerk"
        ? "/dashboard/clerk"
        : role === "cashier"
          ? "/dashboard/cashier"
          : "/dashboard/admin";

  return useQuery({
    queryKey: ["dashboard", role],
    queryFn: () => axiosInstance.get(endpoint),
    select: (res) => res.data || res,
    enabled: !!role,
  });
};

export const useNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: () => axiosInstance.get("/notifications", { params: { pageSize: 20 } }),
    select: (res) => res.data || [],
  });

export const useReportsRevenue = (period = "daily", date) =>
  useQuery({
    queryKey: ["reports", "revenue", period, date],
    queryFn: () => axiosInstance.get("/reports/revenue", { params: { period, date } }),
    select: (res) => res.data || res,
    enabled: !!period,
  });
