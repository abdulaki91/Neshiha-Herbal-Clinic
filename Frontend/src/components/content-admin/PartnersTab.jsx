import { useTranslation } from "react-i18next";
import ContentCollectionList from "./ContentCollectionList";
import PartnerForm from "./PartnerForm";
import {
  usePartners,
  useDeletePartner,
  useSetPartnerStatus,
  useReorderPartner,
} from "../../hooks/usePartners";

const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(
  "/api/v1",
  "",
);

const PartnersTab = () => {
  const { t } = useTranslation();

  return (
    <ContentCollectionList
      title={t("contentAdmin.partners.title")}
      subtitle={t("contentAdmin.partners.subtitle")}
      addButtonLabel={t("contentAdmin.partners.addButton")}
      searchPlaceholder={t("contentAdmin.partners.searchPlaceholder")}
      useListHook={usePartners}
      useDeleteHook={useDeletePartner}
      useSetStatusHook={useSetPartnerStatus}
      useReorderHook={useReorderPartner}
      getItemLabel={(item) => item.name}
      FormComponent={PartnerForm}
      renderItem={(item) => (
        <div className="flex items-center gap-3">
          {item.logo ? (
            <img
              src={`${backendBase}/${item.logo}`}
              alt=""
              className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-200 flex-shrink-0 p-1"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">{item.name}</p>
            {item.websiteUrl && (
              <p className="text-sm text-gray-500 truncate">{item.websiteUrl}</p>
            )}
          </div>
        </div>
      )}
    />
  );
};

export default PartnersTab;
