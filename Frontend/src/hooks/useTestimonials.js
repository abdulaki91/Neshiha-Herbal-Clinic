import { createContentHooks } from "./contentHooks";

export const {
  useList: useTestimonials,
  useCreate: useCreateTestimonial,
  useUpdate: useUpdateTestimonial,
  useDelete: useDeleteTestimonial,
  useSetStatus: useSetTestimonialStatus,
  useReorder: useReorderTestimonial,
} = createContentHooks("testimonials");
