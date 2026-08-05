import { useTranslation } from "react-i18next";
import ContentCollectionList from "./ContentCollectionList";
import TeamMemberForm from "./TeamMemberForm";
import {
  useTeamMembers,
  useDeleteTeamMember,
  useSetTeamMemberStatus,
  useReorderTeamMember,
} from "../../hooks/useTeamMembers";

const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(
  "/api/v1",
  "",
);

const TeamMembersTab = () => {
  const { t } = useTranslation();

  return (
    <ContentCollectionList
      title={t("contentAdmin.teamMembers.title")}
      subtitle={t("contentAdmin.teamMembers.subtitle")}
      addButtonLabel={t("contentAdmin.teamMembers.addButton")}
      searchPlaceholder={t("contentAdmin.teamMembers.searchPlaceholder")}
      useListHook={useTeamMembers}
      useDeleteHook={useDeleteTeamMember}
      useSetStatusHook={useSetTeamMemberStatus}
      useReorderHook={useReorderTeamMember}
      getItemLabel={(item) => item.name}
      FormComponent={TeamMemberForm}
      renderItem={(item) => (
        <div className="flex items-center gap-3">
          {item.photo ? (
            <img
              src={`${backendBase}/${item.photo}`}
              alt=""
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
              {item.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">{item.name}</p>
            <p className="text-sm text-gray-500 truncate">{item.role?.en}</p>
          </div>
        </div>
      )}
    />
  );
};

export default TeamMembersTab;
