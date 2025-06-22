import { Notification, NotificationType } from '../types';
import { getData, saveData, addItem } from './db';

export const getNotificationsByUserId = (userId: string): Notification[] => {
  const notifications = getData('notifications');
  return notifications.filter(n => n.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addNotification = (
  userId: string, 
  message: string, 
  type: NotificationType, 
  link?: string
): Notification => {
  const newNotificationData: Omit<Notification, 'id' | 'createdAt'> = {
    userId,
    message,
    type,
    link,
    isRead: false, // isRead is part of Notification and should be initialized
  };
  return addItem('notifications', newNotificationData);
};

export const markNotificationAsRead = (notificationId: string): Notification | null => {
  const notifications = getData('notifications');
  const notificationIndex = notifications.findIndex(n => n.id === notificationId);
  if (notificationIndex > -1) {
    notifications[notificationIndex].isRead = true;
    // Note: Notification type doesn't have updatedAt. If it should, update types.ts and db.ts logic.
    saveData('notifications', notifications);
    return notifications[notificationIndex];
  }
  return null;
};

export const markAllNotificationsAsRead = (userId: string): void => {
  const notifications = getData('notifications');
  notifications.forEach(n => {
    if (n.userId === userId && !n.isRead) {
      n.isRead = true;
    }
  });
  saveData('notifications', notifications);
};

export const deleteNotification = (notificationId: string): boolean => {
    const notifications = getData('notifications');
    const initialLength = notifications.length;
    const filteredNotifications = notifications.filter(n => n.id !== notificationId);
    if (filteredNotifications.length < initialLength) {
        saveData('notifications', filteredNotifications);
        return true;
    }
    return false;
};