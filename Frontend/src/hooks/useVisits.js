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

/**
 * Upload single attachment to a visit during consultation
 */
export const useUploadVisitAttachment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) =>
      axiosInstance.post(`/visits/${id}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: (_, { id, patientId }) => {
      qc.invalidateQueries({ queryKey: ["visits", id] });
      qc.invalidateQueries({ queryKey: ["visits", id, "attachments"] });
      if (patientId) {
        qc.invalidateQueries({
          queryKey: ["patients", patientId, "attachments"],
        });
        qc.invalidateQueries({ queryKey: ["patients", patientId, "history"] });
      }
    },
  });
};

/**
 * Upload multiple attachments to a visit during consultation
 */
export const useUploadMultipleVisitAttachments = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }) =>
      axiosInstance.post(`/visits/${id}/attachments/multiple`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: (_, { id, patientId }) => {
      qc.invalidateQueries({ queryKey: ["visits", id] });
      qc.invalidateQueries({ queryKey: ["visits", id, "attachments"] });
      if (patientId) {
        qc.invalidateQueries({
          queryKey: ["patients", patientId, "attachments"],
        });
        qc.invalidateQueries({ queryKey: ["patients", patientId, "history"] });
      }
    },
  });
};

/**
 * Get all attachments for a specific visit
 */
export const useVisitAttachments = (visitId) =>
  useQuery({
    queryKey: ["visits", visitId, "attachments"],
    queryFn: () => axiosInstance.get(`/visits/${visitId}/attachments`),
    select: (res) => res.data || res,
    enabled: !!visitId,
  });

/**
 * Get completed consultations for the logged-in doctor
 */
export const useCompletedConsultations = (params = {}) =>
  useQuery({
    queryKey: ["visits", "completed", params],
    queryFn: () => axiosInstance.get("/visits/completed", { params }),
    select: (res) => ({
      consultations: res.data || [],
      pagination: res.pagination,
    }),
    staleTime: 30_000, // 30 seconds
  });
