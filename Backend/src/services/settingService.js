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
