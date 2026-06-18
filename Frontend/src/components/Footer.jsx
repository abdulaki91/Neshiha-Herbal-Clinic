import React from "react";
import { useTranslation } from "react-i18next";

/** Footer */
export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-white border-t border-[#f0f4f0] mt-10 py-8 text-center text-[#638863]">
      <div className="flex flex-wrap justify-center gap-6 mb-4">
        <a href="#">{t("footer.privacy")}</a>
        <a href="#">{t("footer.terms")}</a>
        <a href="#">{t("footer.quickLinks")}</a>
      </div>
      <p>{t("footer.copyright")}</p>
    </footer>
  );
}
