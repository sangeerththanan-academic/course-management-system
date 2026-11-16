const db = require("../config/db");
const Notification = require("../models/notificationModel");

const normalizeInternalLink = (link) => {
  if (typeof link !== "string") {
    return "/";
  }

  const trimmed = link.trim();

  if (!trimmed || trimmed.startsWith("//") || !trimmed.startsWith("/")) {
    return "/";
  }

  return trimmed;
};

const sendNotification = async ({
  userId,
  notificationType,
  title,
  message,
  internalLink = "/",
}) => {
  if (!userId || !notificationType || !title || !message) {
    return null;
  }

  try {
    const id = await Notification.create({
      user_id: Number(userId),
      notification_type: notificationType,
      title: String(title).trim(),
      message: String(message).trim(),
      internal_link: normalizeInternalLink(internalLink),
    });

    return id;
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
};

const notifyUsers = async (userIds, payload) => {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean).map(Number))];

  if (uniqueUserIds.length === 0) {
    return [];
  }

  const sent = [];

  for (const userId of uniqueUserIds) {
    const createdId = await sendNotification({
      userId,
      ...payload,
    });

    if (createdId) {
      sent.push(createdId);
    }
  }

  return sent;
};

const notifyAdmins = async ({
  notificationType,
  title,
  message,
  internalLink = "/",
}) => {
  try {
    const [rows] = await db.execute(
      `SELECT id
       FROM users
       WHERE role = 'admin'`
    );

    const adminIds = rows.map((row) => row.id);

    return notifyUsers(adminIds, {
      notificationType,
      title,
      message,
      internalLink,
    });
  } catch (error) {
    console.error("Failed to notify admins:", error.message);
    return [];
  }
};

module.exports = {
  sendNotification,
  notifyUsers,
  notifyAdmins,
  normalizeInternalLink,
};
