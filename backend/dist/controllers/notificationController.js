"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.addNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getUserNotifications = void 0;
const database_1 = __importDefault(require("../db/database"));
// Generate a simple ID
const generateId = () => Math.random().toString(36).substr(2, 9);
const getUserNotifications = (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const notifications = database_1.default.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(userId);
        // Convert SQLite format to expected format
        const formattedNotifications = notifications.map((notification) => ({
            id: notification.id,
            userId: notification.user_id,
            message: notification.message,
            type: notification.type,
            isRead: Boolean(notification.is_read),
            link: notification.link,
            createdAt: notification.created_at
        }));
        return res.json({ data: { notifications: formattedNotifications } });
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};
exports.getUserNotifications = getUserNotifications;
const markNotificationAsRead = (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // Check if notification belongs to user
        const notification = database_1.default.prepare(`
      SELECT user_id FROM notifications 
      WHERE id = ?
    `).get(notificationId);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        if (notification.user_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Mark as read
        database_1.default.prepare(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE id = ?
    `).run(notificationId);
        return res.json({ message: 'Notification marked as read' });
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        database_1.default.prepare(`
      UPDATE notifications 
      SET is_read = 1 
      WHERE user_id = ? AND is_read = 0
    `).run(userId);
        return res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Error marking all notifications as read:', error);
        return res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
const addNotification = (userId, message, type, link) => {
    try {
        const notificationId = generateId();
        const now = new Date().toISOString();
        database_1.default.prepare(`
      INSERT INTO notifications (id, user_id, message, type, is_read, link, created_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(notificationId, userId, message, type, link || null, now);
        return {
            id: notificationId,
            userId,
            message,
            type,
            isRead: false,
            link,
            createdAt: now
        };
    }
    catch (error) {
        console.error('Error adding notification:', error);
        throw error;
    }
};
exports.addNotification = addNotification;
const deleteNotification = (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // Check if notification belongs to user
        const notification = database_1.default.prepare(`
      SELECT user_id FROM notifications 
      WHERE id = ?
    `).get(notificationId);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        if (notification.user_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Delete notification
        database_1.default.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId);
        return res.json({ message: 'Notification deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({ error: 'Failed to delete notification' });
    }
};
exports.deleteNotification = deleteNotification;
//# sourceMappingURL=notificationController.js.map