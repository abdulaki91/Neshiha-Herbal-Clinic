import { useState } from "react";
import { useTranslation } from "react-i18next";
import TestimonialsTab from "../../components/content-admin/TestimonialsTab";
import SuccessStoriesTab from "../../components/content-admin/SuccessStoriesTab";
import FaqsTab from "../../components/content-admin/FaqsTab";
import TeamMembersTab from "../../components/content-admin/TeamMembersTab";
import PartnersTab from "../../components/content-admin/PartnersTab";
import BannersTab from "../../components/content-admin/BannersTab";
import ServicesTab from "../../components/content-admin/ServicesTab";

const ContentManagementPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("testimonials");

  const tabs = [
    { key: "testimonials", label: t("contentAdmin.tabs.testimonials"), Component: TestimonialsTab },
    { key: "successStories", label: t("contentAdmin.tabs.successStories"), Component: SuccessStoriesTab },
    { key: "faqs", label: t("contentAdmin.tabs.faqs"), Component: FaqsTab },
    { key: "teamMembers", label: t("contentAdmin.tabs.teamMembers"), Component: TeamMembersTab },
    { key: "partners", label: t("contentAdmin.tabs.partners"), Component: PartnersTab },
    { key: "banners", label: t("contentAdmin.tabs.banners"), Component: BannersTab },
    { key: "services", label: t("contentAdmin.tabs.services"), Component: ServicesTab },
  ];

  const ActiveComponent = tabs.find((tab) => tab.key === activeTab)?.Component;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {t("contentAdmin.title")}
        </h1>
        <p className="text-gray-500 mt-1">{t("contentAdmin.subtitle")}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm shadow-slate-200/60 mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-1 px-4 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-3 px-3 border-b-2 font-medium text-sm transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {ActiveComponent && <ActiveComponent />}
    </div>
  );
};

export default ContentManagementPage;
