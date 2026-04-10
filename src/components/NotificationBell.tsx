import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { notificationService, Notification } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll for new notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications(10, 0);
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        setLoading(true);
        try {
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await notificationService.deleteNotification(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    if (!user) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-96 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 max-h-[600px] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-white font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    disabled={loading}
                                    className="text-primary-500 text-sm hover:text-primary-400 transition-colors disabled:opacity-50"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <Bell size={48} className="mx-auto mb-3 opacity-50" />
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-white/5 transition-colors ${
                                                !notification.isRead ? 'bg-primary-500/5' : ''
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-white font-medium text-sm">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.isRead && (
                                                            <span className="w-2 h-2 bg-primary-500 rounded-full" />
                                                        )}
                                                    </div>
                                                    <p className="text-gray-400 text-sm">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-gray-600 text-xs mt-2">
                                                        {new Date(notification.createdAt).toLocaleString()}
                                                    </p>
                                                </div>

                                                <div className="flex gap-1">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(notification.id)}
                                                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
