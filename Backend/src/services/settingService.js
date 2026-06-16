import { Setting } from "../models/index.js";

export const getSettings = async () => {
  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({});
  }

  return settings;
};

export const updateSettings = async (data, updatedBy) => {
  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({ ...data, updatedBy });
  } else {
    await settings.update({ ...data, updatedBy });
  }

  return settings;
};
