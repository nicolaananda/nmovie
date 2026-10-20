import { apiClient } from './apiClient';

export interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    href?: string;
    isRead: boolean;
    createdAt: string;
}

export const notificationService = {
    async getNotifications(limit = 20, offset = 0, unreadOnly = false) {
        const { data } = await apiClient.get('/notifications', {
            params: { limit, offset, unreadOnly },
        });
        return data;
    },

    async markAsRead(id: number) {
        const { data } = await apiClient.put(`/notifications/${id}/read`);
        return data;
    },

    async markAllAsRead() {
        const { data } = await apiClient.put('/notifications/read-all');
        return data;
    },

    async deleteNotification(id: number) {
        const { data } = await apiClient.delete(`/notifications/${id}`);
        return data;
    },
};
