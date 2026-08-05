import { useMutation, useQuery } from "@tanstack/react-query";
import axiosInstance from "../lib/axios";

// Public content hooks — no auth required, always refetched fresh
// (staleTime 0) so the public site reflects admin changes on the next
// load/reload rather than serving a stale cached response.
const usePublicList = (path) =>
  useQuery({
    queryKey: ["public", path],
    queryFn: () => axiosInstance.get(`/public/${path}`),
    select: (res) => res.data || [],
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

export const usePublicTestimonials = () => usePublicList("testimonials");
export const usePublicSuccessStories = () => usePublicList("success-stories");
export const usePublicFaqs = () => usePublicList("faqs");
export const usePublicTeamMembers = () => usePublicList("team-members");
export const usePublicPartners = () => usePublicList("partners");
export const usePublicBanners = () => usePublicList("banners");
export const usePublicServices = () => usePublicList("services");

export const usePublicSiteInfo = () =>
  useQuery({
    queryKey: ["public", "site-info"],
    queryFn: () => axiosInstance.get("/public/site-info"),
    select: (res) => res.data || {},
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

// "Book Appointment" submission — no auth, public write.
export const useSubmitBookingRequest = () =>
  useMutation({
    mutationFn: (data) => axiosInstance.post("/booking-requests", data),
  });
