import { useTranslation } from "react-i18next";
import ContentCollectionList from "./ContentCollectionList";
import SuccessStoryForm from "./SuccessStoryForm";
import {
  useSuccessStories,
  useDeleteSuccessStory,
  useSetSuccessStoryStatus,
  useReorderSuccessStory,
} from "../../hooks/useSuccessStories";

const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(
  "/api/v1",
  "",
);

const SuccessStoriesTab = () => {
  const { t } = useTranslation();

  return (
    <ContentCollectionList
      title={t("contentAdmin.successStories.title")}
      subtitle={t("contentAdmin.successStories.subtitle")}
      addButtonLabel={t("contentAdmin.successStories.addButton")}
      searchPlaceholder={t("contentAdmin.successStories.searchPlaceholder")}
      useListHook={useSuccessStories}
      useDeleteHook={useDeleteSuccessStory}
      useSetStatusHook={useSetSuccessStoryStatus}
      useReorderHook={useReorderSuccessStory}
      getItemLabel={(item) => item.title?.en}
      FormComponent={SuccessStoryForm}
      renderItem={(item) => (
        <div className="flex items-center gap-3">
          {item.images?.[0] ? (
            <img
              src={`${backendBase}/${item.images[0]}`}
              alt=""
              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">
              {item.title?.en}
              {item.featured && (
                <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold align-middle">
                  {t("contentAdmin.successStories.featured")}
                </span>
              )}
            </p>
            <p className="text-sm text-gray-500 truncate">{item.category}</p>
          </div>
        </div>
      )}
    />
  );
};

export default SuccessStoriesTab;
