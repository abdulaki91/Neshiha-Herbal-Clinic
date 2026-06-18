import React from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import Hero from "../components/Hero";
import Services from "../components/Services";
import Testimonials from "../components/Testimonials";
import About from "../components/About";
import Contact from "../components/Contact";
import Blog from "../components/Blog";

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        {/* Title & Meta */}
        <title>{t("home.title")}</title>
        <meta
          name="description"
          content={t("home.metaDescription")}
        />
        <meta
          name="keywords"
          content={t("home.metaKeywords")}
        />
        <link rel="canonical" href="https://www.nesihaherbalclinic.com/" />

        {/* Open Graph / Facebook */}
        <meta property="og:title" content={t("home.ogTitle")} />
        <meta
          property="og:description"
          content={t("home.ogDescription")}
        />
        <meta property="og:url" content="https://www.nesihaherbalclinic.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/logo.png" />

        {/* Twitter */}
        <meta name="twitter:title" content={t("home.twitterTitle")} />
        <meta
          name="twitter:description"
          content={t("home.twitterDescription")}
        />
        <meta name="twitter:image" content="/logo.png" />

        {/* Schema.org Structured Data */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "MedicalBusiness",
            "name": "${t("home.schema.name")}",
            "image": "/logo.png",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "${t("home.schema.streetAddress")}",
              "addressLocality": "${t("home.schema.addressLocality")}",
              "addressRegion": "${t("home.schema.addressRegion")}",
              "postalCode": "${t("home.schema.postalCode")}",
              "addressCountry": "${t("home.schema.addressCountry")}"
            },
            "telephone": "${t("home.schema.telephone")}",
            "url": "${t("home.schema.url")}"
          }
        `}</script>
      </Helmet>

      {/* Page Content */}
      <div className="space-y-12">
        <Hero />
        <Services />
        <Testimonials />
        <About />
        <Contact />
        <Blog />
      </div>
    </>
  );
}
