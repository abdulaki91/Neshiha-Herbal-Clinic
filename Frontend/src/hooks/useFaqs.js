import { createContentHooks } from "./contentHooks";

export const {
  useList: useFaqs,
  useCreate: useCreateFaq,
  useUpdate: useUpdateFaq,
  useDelete: useDeleteFaq,
  useSetStatus: useSetFaqStatus,
  useReorder: useReorderFaq,
} = createContentHooks("faqs");
