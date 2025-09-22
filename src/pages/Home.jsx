import React from "react";
import Hero from "../components/Hero";
import Services from "../components/Services";
import Testimonials from "../components/Testimonials";
import About from "../components/About";
import Contact from "../components/Contact";
import Blog from "../components/Blog";

export default function Home() {
  return (
    <>
      {/* ✅ React 19 hoists these into <head> automatically */}
      <title>Neshiha Herbal Clinic</title>
      <meta
        name="description"
        content="Neshiha Herbal Clinic: Your trusted herbal health solutions. Visit us for natural remedies and wellness tips."
      />

      {/* Open Graph / Social Sharing */}
      <meta property="og:title" content="Neshiha Herbal Clinic" />
      <meta
        property="og:description"
        content="Your trusted herbal health solutions."
      />
      <meta property="og:url" content="https://nesihaherbalclinic.com" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="/logo.png" />

      {/* Twitter */}
      <meta name="twitter:title" content="Neshiha Herbal Clinic" />
      <meta
        name="twitter:description"
        content="Your trusted herbal health solutions."
      />
      <meta name="twitter:image" content="/logo.png" />

      {/* Schema.org Structured Data */}
      <script type="application/ld+json">{`
        {
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          "name": "Neshiha Herbal Clinic",
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
          "url": "https://nesihaherbalclinic.com"
        }
      `}</script>

      {/* Page content */}
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
