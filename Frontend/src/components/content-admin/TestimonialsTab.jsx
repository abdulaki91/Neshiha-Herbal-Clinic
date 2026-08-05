import { useTranslation } from "react-i18next";
import ContentCollectionList from "./ContentCollectionList";
import TestimonialForm from "./TestimonialForm";
import {
  useTestimonials,
  useDeleteTestimonial,
  useSetTestimonialStatus,
  useReorderTestimonial,
} from "../../hooks/useTestimonials";

const backendBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(
  "/api/v1",
  "",
);

const TestimonialsTab = () => {
  const { t } = useTranslation();

  return (
    <ContentCollectionList
      title={t("contentAdmin.testimonials.title")}
      subtitle={t("contentAdmin.testimonials.subtitle")}
      addButtonLabel={t("contentAdmin.testimonials.addButton")}
      searchPlaceholder={t("contentAdmin.testimonials.searchPlaceholder")}
      useListHook={useTestimonials}
      useDeleteHook={useDeleteTestimonial}
      useSetStatusHook={useSetTestimonialStatus}
      useReorderHook={useReorderTestimonial}
      getItemLabel={(item) => item.clientName}
      FormComponent={TestimonialForm}
      renderItem={(item) => (
        <div className="flex items-center gap-3">
          {item.clientPhoto ? (
            <img
              src={`${backendBase}/${item.clientPhoto}`}
              alt=""
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
              {item.clientName?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 truncate">
              {item.clientName}
              {item.company && (
                <span className="font-normal text-gray-400"> · {item.company}</span>
              )}
            </p>
            <p className="text-sm text-gray-500 truncate">{item.text?.en}</p>
          </div>
        </div>
      )}
    />
  );
};

export default TestimonialsTab;
