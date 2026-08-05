import { createContentHooks } from "./contentHooks";

export const {
  useList: usePartners,
  useCreate: useCreatePartner,
  useUpdate: useUpdatePartner,
  useDelete: useDeletePartner,
  useSetStatus: useSetPartnerStatus,
  useReorder: useReorderPartner,
} = createContentHooks("partners");
