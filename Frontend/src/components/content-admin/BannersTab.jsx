import { useTranslation } from "react-i18next";
import ContentCollectionList from "./ContentCollectionList";
import BannerForm from "./BannerForm";
import {
  useBanners,
  useDeleteBanner,
  useSetBannerStatus,
  useReorderBanner,
} from "../../hooks/useBanners";

const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(
  "/api/v1",
  "",
);

const BannersTab = () => {
  const { t } = useTranslation();

  return (
    <ContentCollectionList
      title={t("contentAdmin.banners.title")}
      subtitle={t("contentAdmin.banners.subtitle")}
      addButtonLabel={t("contentAdmin.banners.addButton")}
      useListHook={useBanners}
      useDeleteHook={useDeleteBanner}
      useSetStatusHook={useSetBannerStatus}
      useReorderHook={useReorderBanner}
      getItemLabel={(item) => item.title?.en}
      FormComponent={BannerForm}
      searchable={false}
      renderItem={(item) => (
        <div className="flex items-center gap-3">
          {item.image ? (
            <img
              src={`${backendBase}/${item.image}`}
              alt=""
              className="w-14 h-10 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-10 rounded bg-emerald-100 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">{item.title?.en}</p>
            <p className="text-sm text-gray-500 truncate">{item.subtitle?.en}</p>
          </div>
        </div>
      )}
    />
  );
};

export default BannersTab;
