
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Notification, NotificationType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import * as notificationService from '../../services/notificationService';
import LoadingSpinner from '../../components/LoadingSpinner';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const userNotifications = notificationService.getNotificationsByUserId(user.id);
        setNotifications(userNotifications);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        setError('Gagal memuat notifikasi.');
      } finally {
        setLoading(false);
      }
    } else {
      setNotifications([]);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = (notificationId: string) => {
    const updatedNotification = notificationService.markNotificationAsRead(notificationId);
    if (updatedNotification) {
      setNotifications(prev => prev.map(n => n.id === notificationId ? updatedNotification : n));
    }
  };
  
  const handleMarkAllAsRead = () => {
    if(!user) return;
    notificationService.markAllNotificationsAsRead(user.id);
    fetchNotifications(); // Refresh
  };

  const handleDeleteNotification = (notificationId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus notifikasi ini?")) {
        const success = notificationService.deleteNotification(notificationId);
        if (success) {
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } else {
            alert("Gagal menghapus notifikasi.");
        }
    }
  };


  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ORDER_STATUS: return 'fas fa-receipt text-blue-500';
      case NotificationType.PROMO: return 'fas fa-tags text-yellow-500';
      case NotificationType.WALLET: return 'fas fa-wallet text-green-500';
      case NotificationType.GENERAL: return 'fas fa-info-circle text-gray-500';
      default: return 'fas fa-bell text-gray-500';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Memuat notifikasi..." />;
  }
  if (error) {
    return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }
  if (!user) {
     return <div className="text-center py-10"><p>Silakan <Link to="/signin" state={{from: location}} className="text-primary-600 hover:underline">masuk</Link> untuk melihat notifikasi Anda.</p></div>;
  }
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Notifikasi Saya</h1>
        {unreadCount > 0 && (
            <button 
                onClick={handleMarkAllAsRead}
                className="text-sm text-primary-600 hover:underline font-medium"
            >
                Tandai semua sudah dibaca ({unreadCount})
            </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <i className="far fa-bell-slash text-6xl text-gray-300 mb-6"></i>
          <h2 className="text-2xl font-semibold text-gray-700 mb-3">Tidak Ada Notifikasi</h2>
          <p className="text-gray-500">Semua pemberitahuan penting akan muncul di sini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 border rounded-lg shadow-sm flex items-start space-x-4 transition-all duration-300
                          ${notification.isRead ? 'bg-gray-50 opacity-70' : 'bg-white hover:shadow-md'}`}
            >
              <div className={`mt-1 ${getNotificationIcon(notification.type)} text-xl w-6 text-center`}></div>
              <div className="flex-grow">
                <p className={`text-gray-700 ${!notification.isRead ? 'font-semibold' : ''}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                {!notification.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="text-xs text-blue-500 hover:underline whitespace-nowrap"
                    title="Tandai sudah dibaca"
                  >
                    Tandai Dibaca
                  </button>
                )}
                {notification.link && (
                  <Link to={notification.link} className="text-xs text-primary-600 hover:underline whitespace-nowrap">
                    Lihat Detail
                  </Link>
                )}
                 <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline whitespace-nowrap"
                    title="Hapus notifikasi"
                  >
                   <i className="fas fa-trash-alt"></i>
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
