import { useTranslation } from "react-i18next";
import ContentCollectionList from "./ContentCollectionList";
import ServiceForm from "./ServiceForm";
import {
  useServices,
  useDeleteService,
  useSetServiceStatus,
  useReorderService,
} from "../../hooks/useServices";

const ServicesTab = () => {
  const { t } = useTranslation();

  return (
    <ContentCollectionList
      title={t("contentAdmin.services.title")}
      subtitle={t("contentAdmin.services.subtitle")}
      addButtonLabel={t("contentAdmin.services.addButton")}
      useListHook={useServices}
      useDeleteHook={useDeleteService}
      useSetStatusHook={useSetServiceStatus}
      useReorderHook={useReorderService}
      getItemLabel={(item) => item.title?.en}
      FormComponent={ServiceForm}
      searchable={false}
      renderItem={(item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 text-xl">
            {item.icon}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">{item.title?.en}</p>
            <p className="text-sm text-gray-500 truncate">{item.description?.en}</p>
          </div>
        </div>
      )}
    />
  );
};

export default ServicesTab;
