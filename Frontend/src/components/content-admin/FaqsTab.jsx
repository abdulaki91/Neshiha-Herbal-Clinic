import { useTranslation } from "react-i18next";
import ContentCollectionList from "./ContentCollectionList";
import FaqForm from "./FaqForm";
import {
  useFaqs,
  useDeleteFaq,
  useSetFaqStatus,
  useReorderFaq,
} from "../../hooks/useFaqs";

const FaqsTab = () => {
  const { t } = useTranslation();

  return (
    <ContentCollectionList
      title={t("contentAdmin.faqs.title")}
      subtitle={t("contentAdmin.faqs.subtitle")}
      addButtonLabel={t("contentAdmin.faqs.addButton")}
      searchPlaceholder={t("contentAdmin.faqs.searchPlaceholder")}
      useListHook={useFaqs}
      useDeleteHook={useDeleteFaq}
      useSetStatusHook={useSetFaqStatus}
      useReorderHook={useReorderFaq}
      getItemLabel={(item) => item.question?.en}
      FormComponent={FaqForm}
      renderItem={(item) => (
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 truncate">{item.question?.en}</p>
          <p className="text-sm text-gray-500 truncate">{item.answer?.en}</p>
        </div>
      )}
    />
  );
};

export default FaqsTab;
