import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";

// Forms pass a plain data object plus two reserved keys — `imageFile`
// (single File) and `imagesFiles` (File[]) — when the admin picked a new
// image. If neither is present we send plain JSON (matches routes with no
// multer middleware, e.g. FAQs/Services); otherwise we build multipart
// form data, JSON-stringifying any object/array field since multipart
// always sends strings and the backend parses known JSONB fields back out.
const buildRequestBody = (data) => {
  const { imageFile, imagesFiles, ...rest } = data;

  if (!imageFile && !imagesFiles) {
    return { body: rest, headers: undefined };
  }

  const formData = new FormData();
  if (imageFile) formData.append("image", imageFile);
  if (imagesFiles) imagesFiles.forEach((f) => formData.append("images", f));

  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || value === null) continue;
    formData.append(key, typeof value === "object" ? JSON.stringify(value) : value);
  }

  return { body: formData, headers: { "Content-Type": "multipart/form-data" } };
};

/**
 * Builds the standard set of React Query hooks for a content-collection
 * admin resource (Testimonials, FAQs, Team Members, ...) — list/create/
 * update/delete/status-toggle/reorder — mirroring the shape of
 * useStaff.js so every resource behaves identically across the app.
 */
export const createContentHooks = (resourceKey) => {
  const invalidate = (qc) => qc.invalidateQueries({ queryKey: [resourceKey] });

  const useList = (params = {}) =>
    useQuery({
      queryKey: [resourceKey, params],
      queryFn: () => axiosInstance.get(`/${resourceKey}`, { params }),
      select: (res) => ({ items: res.data || [], pagination: res.pagination }),
      placeholderData: (prev) => prev,
    });

  const useCreate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (data) => {
        const { body, headers } = buildRequestBody(data);
        return axiosInstance.post(`/${resourceKey}`, body, { headers });
      },
      onSuccess: () => invalidate(qc),
    });
  };

  const useUpdate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, ...data }) => {
        const { body, headers } = buildRequestBody(data);
        return axiosInstance.put(`/${resourceKey}/${id}`, body, { headers });
      },
      onSuccess: () => invalidate(qc),
    });
  };

  const useDelete = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id) => axiosInstance.delete(`/${resourceKey}/${id}`),
      onSuccess: () => invalidate(qc),
    });
  };

  const useSetStatus = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, status }) =>
        axiosInstance.patch(`/${resourceKey}/${id}/status`, { status }),
      onSuccess: () => invalidate(qc),
    });
  };

  const useReorder = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, direction }) =>
        axiosInstance.patch(`/${resourceKey}/${id}/reorder`, { direction }),
      onSuccess: () => invalidate(qc),
    });
  };

  return { useList, useCreate, useUpdate, useDelete, useSetStatus, useReorder };
};
