import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";

export const useVisits = (params = {}) =>
  useQuery({
    queryKey: ["visits", params],
    queryFn: () => axiosInstance.get("/visits", { params }),
    select: (res) => ({
      visits: res.data || [],
      pagination: res.pagination,
    }),
  });

export const useVisit = (id) =>
  useQuery({
    queryKey: ["visits", id],
    queryFn: () => axiosInstance.get(`/visits/${id}`),
    select: (res) => res.data || res,
    enabled: !!id,
  });

export const useQueue = (opts = {}) =>
  useQuery({
    queryKey: ["queue"],
    queryFn: () => axiosInstance.get("/visits/queue"),
    select: (res) => res.data || [],
    refetchInterval: 15_000,
    staleTime: 5_000,
    ...opts,
  });

export const useCreateVisit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => axiosInstance.post("/visits", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
    },
  });
};

export const useUpdateVisit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => axiosInstance.put(`/visits/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
    },
  });
};

export const useAssignDoctor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, doctorId }) =>
      axiosInstance.patch(`/visits/${id}/assign-doctor`, { doctorId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["queue"] });
    },
  });
};
