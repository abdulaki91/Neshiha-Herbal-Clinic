import { createContentHooks } from "./contentHooks";

export const {
  useList: useServices,
  useCreate: useCreateService,
  useUpdate: useUpdateService,
  useDelete: useDeleteService,
  useSetStatus: useSetServiceStatus,
  useReorder: useReorderService,
} = createContentHooks("services");
