import { Setting } from "../models/index.js";

export const getSettings = async () => {
  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({});
  }

  return settings;
};

export const updateSettings = async (data, updatedBy) => {
  // Never let a client rewrite the row identity or audit columns
  const { id, createdAt, updatedAt, ...payload } = data;

  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({ ...payload, updatedBy });
  } else {
    await settings.update({ ...payload, updatedBy });
  }

  return settings;
};

// Explicit whitelist for the public (unauthenticated) website — operational
// fields like lowStockThreshold or notification toggles must never leak
// here, so this only ever returns business/contact info, never the raw row.
export const getPublicSiteInfo = async () => {
  const settings = await getSettings();

  return {
    clinicName: settings.clinicName,
    clinicLogo: settings.clinicLogo,
    clinicPhone: settings.clinicPhone,
    clinicEmail: settings.clinicEmail,
    clinicAddress: settings.clinicAddress,
    whatsappNumber: settings.whatsappNumber,
    facebookUrl: settings.facebookUrl,
    instagramUrl: settings.instagramUrl,
    tiktokUrl: settings.tiktokUrl,
    twitterUrl: settings.twitterUrl,
    googleMapsEmbedUrl: settings.googleMapsEmbedUrl,
    workingHoursStart: settings.workingHoursStart,
    workingHoursEnd: settings.workingHoursEnd,
    workingDays: settings.workingDays,
    tagline: settings.tagline,
    mission: settings.mission,
    vision: settings.vision,
    aboutText: settings.aboutText,
    yearsExperience: settings.yearsExperience,
    patientsServed: settings.patientsServed,
    treatmentsOffered: settings.treatmentsOffered,
  };
};
