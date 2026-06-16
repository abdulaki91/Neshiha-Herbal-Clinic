import React from "react";
import { Helmet } from "react-helmet-async";
import Hero from "../components/Hero";
import Services from "../components/Services";
import Testimonials from "../components/Testimonials";
import About from "../components/About";
import Contact from "../components/Contact";
import Blog from "../components/Blog";

export default function Home() {
  return (
    <>
      <Helmet>
        {/* Title & Meta */}
        <title>Nesihah Herbal Clinic | Mana Qorichaa Aadaa Nasiiha</title>
        <meta
          name="description"
          content="Nesihah Herbal Clinic (Mana Qorichaa Aadaa Nasiiha): Your trusted source for traditional herbal medicine, natural remedies, and holistic healing in Ethiopia."
        />
        <meta
          name="keywords"
          content="Nesihah Herbal Clinic, Mana Qorichaa Aadaa Nasiiha, herbal medicine, natural remedies, traditional healing, Ethiopia"
        />
        <link rel="canonical" href="https://www.nesihaherbalclinic.com/" />

        {/* Open Graph / Facebook */}
        <meta property="og:title" content="Nesihah Herbal Clinic" />
        <meta
          property="og:description"
          content="Trusted herbal health solutions and traditional healing in Ethiopia."
        />
        <meta property="og:url" content="https://www.nesihaherbalclinic.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/logo.png" />

        {/* Twitter */}
        <meta name="twitter:title" content="Nesihah Herbal Clinic" />
        <meta
          name="twitter:description"
          content="Trusted herbal health solutions and traditional healing in Ethiopia."
        />
        <meta name="twitter:image" content="/logo.png" />

        {/* Schema.org Structured Data */}
        <script type="application/ld+json">{`
          {
            "@context": "https://schema.org",
            "@type": "MedicalBusiness",
            "name": "Nesihah Herbal Clinic (Mana Qorichaa Aadaa Nasiiha)",
            "image": "/logo.png",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "AshewaMeda",
              "addressLocality": "Shegar",
              "addressRegion": "Oromia",
              "postalCode": "0000",
              "addressCountry": "Ethiopia"
            },
            "telephone": "+251912166549",
            "url": "https://www.nesihaherbalclinic.com"
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
