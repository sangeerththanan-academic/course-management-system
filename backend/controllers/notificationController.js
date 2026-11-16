const Notification = require("../models/notificationModel");

const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const result = await Notification.getByUser(userId, { page, limit });

    res.status(200).json({
      message: "Notifications retrieved successfully",
      notifications: result.notifications,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("Error retrieving notifications:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user.id);

    res.status(200).json({
      message: "Unread count retrieved successfully",
      unreadCount,
    });
  } catch (error) {
    console.error("Error retrieving unread notification count:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id, req.user.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await Notification.markAsRead(id, req.user.id);

    return res.status(200).json({
      message: "Notification marked as read",
      notification: {
        ...notification,
        is_read: true,
      },
    });
  } catch (error) {
    console.error("Error marking notification as read:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user.id);

    res.status(200).json({
      message: "All notifications marked as read",
      updatedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
