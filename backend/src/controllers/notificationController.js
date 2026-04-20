import Notification from "../models/notification.js";

/**
api/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user.id,
    })
      .populate("sender", "username avatar")
      .populate("post", "mediaUrl")
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/**
 api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification" });
  }
};

/**
api/notifications/read-all
 */
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to update notifications" });
  }
};
