const db = require("../config/db");

const normalizeNotification = (notification) => ({
  ...notification,
  is_read: Boolean(notification.is_read),
});

const Notification = {
  async create({ user_id, notification_type, title, message, internal_link = null }) {
    const [result] = await db.execute(
      `INSERT INTO notifications
       (user_id, notification_type, title, message, internal_link, is_read)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [user_id, notification_type, title, message, internal_link]
    );

    return result.insertId;
  },

  async getByUser(userId, { page = 1, limit = 10 } = {}) {
    const pageValue = Math.max(1, Number(page) || 1);
    const limitValue = Math.max(1, Number(limit) || 10);
    const offset = (pageValue - 1) * limitValue;

    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM notifications
       WHERE user_id = ?`,
      [userId]
    );

    const [rows] = await db.execute(
      `SELECT *
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limitValue, offset]
    );

    const total = Number(countRows[0]?.total ?? 0);

    return {
      notifications: rows.map(normalizeNotification),
      total,
      page: pageValue,
      limit: limitValue,
      totalPages: Math.max(1, Math.ceil(total / limitValue)),
    };
  },

  async getUnreadCount(userId) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = ?
       AND is_read = FALSE`,
      [userId]
    );

    return Number(rows[0]?.unread_count ?? 0);
  },

  async markAsRead(id, userId) {
    const [result] = await db.execute(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = ?
       AND user_id = ?`,
      [id, userId]
    );

    return result;
  },

  async markAllAsRead(userId) {
    const [result] = await db.execute(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = ?
       AND is_read = FALSE`,
      [userId]
    );

    return result;
  },

  async findById(id, userId) {
    const [rows] = await db.execute(
      `SELECT *
       FROM notifications
       WHERE id = ?
       AND user_id = ?
       LIMIT 1`,
      [id, userId]
    );

    return rows[0] ? normalizeNotification(rows[0]) : null;
  },
};

module.exports = Notification;
