import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

export interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export const notificationService = {
    async getNotifications(limit = 20, offset = 0, unreadOnly = false) {
        const { data } = await axios.get(`${API_URL}/notifications`, {
            params: { limit, offset, unreadOnly },
        });
        return data;
    },

    async markAsRead(id: number) {
        const { data } = await axios.put(`${API_URL}/notifications/${id}/read`);
        return data;
    },

    async markAllAsRead() {
        const { data } = await axios.put(`${API_URL}/notifications/read-all`);
        return data;
    },

    async deleteNotification(id: number) {
        const { data } = await axios.delete(`${API_URL}/notifications/${id}`);
        return data;
    },
};
