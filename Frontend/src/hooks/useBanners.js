import { createContentHooks } from "./contentHooks";

export const {
  useList: useBanners,
  useCreate: useCreateBanner,
  useUpdate: useUpdateBanner,
  useDelete: useDeleteBanner,
  useSetStatus: useSetBannerStatus,
  useReorder: useReorderBanner,
} = createContentHooks("banners");
