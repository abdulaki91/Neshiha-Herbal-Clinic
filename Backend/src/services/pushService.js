import fs from "fs";
import { Op } from "sequelize";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { DeviceToken, Notification, User } from "../models/index.js";
import { translatePush } from "../config/pushMessages.js";
import logger from "../config/logger.js";

/**
 * Firebase Cloud Messaging for the staff mobile app.
 *
 * Configure ONE of these in .env (the service-account key is a secret —
 * keep the file outside the repo):
 *   FIREBASE_SERVICE_ACCOUNT_PATH=/home/<user>/secrets/firebase-adminsdk.json
 *   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
 *
 * Without either, pushes are silently disabled and everything else works
 * as before (the app still gets live alerts over Socket.IO while open).
 */

// Must match the channel the app creates (lib/core/notification_service.dart):
// high importance = sound + heads-up popup.
const ANDROID_CHANNEL_ID = "nhc_alerts";

// FCM errors meaning the token is gone for good (app uninstalled, data
// cleared, token rotated) — those rows are deleted.
const DEAD_TOKEN_ERRORS = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

let messaging = null;
let initTried = false;

const getClient = () => {
  if (initTried) return messaging;
  initTried = true;
  try {
    let credentials = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      credentials = JSON.parse(
        fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8"),
      );
    }
    if (!credentials) {
      logger.info("Push notifications disabled (no Firebase service account configured)");
      return null;
    }
    const app = getApps()[0] || initializeApp({ credential: cert(credentials) });
    messaging = getMessaging(app);
    logger.info(`✅ Firebase push enabled (project ${credentials.project_id})`);
  } catch (error) {
    logger.error("Firebase push init failed:", error);
    messaging = null;
  }
  return messaging;
};

export const isPushEnabled = () => getClient() !== null;

/** Register (or move) a device token to the signed-in user. */
export const registerDevice = async (userId, { token, platform, language }) => {
  const values = {
    userId,
    token,
    platform: platform || "android",
    language: language || "en",
  };
  const existing = await DeviceToken.findOne({ where: { token } });
  if (existing) {
    // Same phone, maybe a different staff member signed in now.
    await existing.update(values);
    return existing;
  }
  return DeviceToken.create(values);
};

export const unregisterDevice = async (userId, token) =>
  DeviceToken.destroy({ where: { userId, token } });

const send = async (devices, key, params, data) => {
  const client = getClient();
  if (!client || devices.length === 0) return;

  // One multicast per language so each phone gets its own translation.
  const byLanguage = new Map();
  for (const d of devices) {
    const list = byLanguage.get(d.language) || [];
    list.push(d.token);
    byLanguage.set(d.language, list);
  }

  const dead = [];
  for (const [language, tokens] of byLanguage) {
    const title = translatePush(language, "title");
    const body = translatePush(language, key, params);
    // FCM multicast accepts at most 500 tokens per call.
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      try {
        const res = await client.sendEachForMulticast({
          tokens: batch,
          notification: { title, body },
          data: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v ?? "")]),
          ),
          android: {
            priority: "high",
            notification: {
              channelId: ANDROID_CHANNEL_ID,
              sound: "default",
              defaultVibrateTimings: true,
            },
          },
          apns: { payload: { aps: { sound: "default" } } },
        });
        res.responses.forEach((r, idx) => {
          if (!r.success && DEAD_TOKEN_ERRORS.has(r.error?.code)) dead.push(batch[idx]);
        });
      } catch (error) {
        logger.error("Push send failed:", error);
      }
    }
  }
  if (dead.length) {
    await DeviceToken.destroy({ where: { token: { [Op.in]: dead } } }).catch(() => {});
  }
};

/**
 * Store the alert in each recipient's notification inbox (the bell in the
 * web portal and the app), so it has a badge and stays listed after a
 * refresh. The text is saved in English; `metadata.key/params` let each
 * client show it in the user's own language. A quiet
 * "notifications:changed" socket event refreshes open bells — not
 * "notification:new", which would toast a second time on top of the live
 * event that already alerted them.
 */
const saveToInbox = async (userIds, key, params, data) => {
  const text = translatePush("en", key, params);
  await Notification.bulkCreate(
    userIds.map((userId) => ({
      userId,
      type: data.event || key,
      title: text,
      message: text,
      priority: data.priority || "medium",
      link: data.link || null,
      metadata: { key, params, destination: data.destination || null },
    })),
  );
  const { emitToUser } = await import("../config/socket.js");
  for (const id of userIds) emitToUser(id, "notifications:changed", {});
};

/**
 * Alert specific users: save to their notification inbox and (if Firebase
 * is configured) push to their phones. Fire-and-forget: never throws, never
 * delays the request that triggered it.
 */
const alertUsers = async (userIds, key, params, data) => {
  if (userIds.length === 0) return;
  try {
    await saveToInbox(userIds, key, params, data);
  } catch (error) {
    logger.error("Saving notifications failed:", error);
  }
  if (!getClient()) return;
  const devices = await DeviceToken.findAll({
    where: { userId: { [Op.in]: userIds } },
    attributes: ["token", "language"],
  });
  // FCM data must be strings and only carries what the app needs.
  await send(devices, key, params, { event: data.event, destination: data.destination });
};

/** Alert every active staff member with one of [roles]. */
export const pushToRoles = (roles, key, params = {}, data = {}) => {
  User.findAll({
    where: { role: { [Op.in]: roles }, status: "active", deletedAt: null },
    attributes: ["id"],
  })
    .then((users) => alertUsers(users.map((u) => u.id), key, params, data))
    .catch((error) => logger.error("Alert failed:", error));
};

/** Alert specific users (e.g. the doctor who requested a lab test). */
export const pushToUsers = (userIds, key, params = {}, data = {}) => {
  const ids = [...new Set(userIds.filter(Boolean))];
  alertUsers(ids, key, params, data).catch((error) => logger.error("Alert failed:", error));
};

/** Push a free-text notification (already written in one language). */
export const pushTextToUser = (userId, title, body, data = {}) => {
  const client = getClient();
  if (!client || !userId) return;
  DeviceToken.findAll({ where: { userId }, attributes: ["token", "language"] })
    .then(async (devices) => {
      if (!devices.length) return;
      await client.sendEachForMulticast({
        tokens: devices.map((d) => d.token),
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v ?? "")])),
        android: {
          priority: "high",
          notification: { channelId: ANDROID_CHANNEL_ID, sound: "default" },
        },
        apns: { payload: { aps: { sound: "default" } } },
      });
    })
    .catch((error) => logger.error("Push send failed:", error));
};
