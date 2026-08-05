import { createContentHooks } from "./contentHooks";

export const {
  useList: useSuccessStories,
  useCreate: useCreateSuccessStory,
  useUpdate: useUpdateSuccessStory,
  useDelete: useDeleteSuccessStory,
  useSetStatus: useSetSuccessStoryStatus,
  useReorder: useReorderSuccessStory,
} = createContentHooks("success-stories");
