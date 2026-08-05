import { createContentHooks } from "./contentHooks";

export const {
  useList: useTeamMembers,
  useCreate: useCreateTeamMember,
  useUpdate: useUpdateTeamMember,
  useDelete: useDeleteTeamMember,
  useSetStatus: useSetTeamMemberStatus,
  useReorder: useReorderTeamMember,
} = createContentHooks("team-members");
