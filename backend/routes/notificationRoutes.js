const express = require("express");

const router = express.Router();
const {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markNotificationAsRead);
router.post("/read-all", markAllNotificationsAsRead);

module.exports = router;
