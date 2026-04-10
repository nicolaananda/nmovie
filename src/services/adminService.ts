import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

export const adminService = {
    async getAnalytics() {
        const { data } = await axios.get(`${API_URL}/admin/analytics`);
        return data;
    },

    async getUsers(params?: { status?: string; role?: string; search?: string; limit?: number; offset?: number }) {
        const { data } = await axios.get(`${API_URL}/admin/users`, { params });
        return data;
    },

    async getUserDetails(id: number) {
        const { data } = await axios.get(`${API_URL}/admin/users/${id}`);
        return data;
    },

    async updateUserStatus(id: number, status: string, durationMonths?: number, subscriptionEndsAt?: string) {
        const { data } = await axios.put(`${API_URL}/admin/users/${id}/status`, {
            status,
            durationMonths,
            subscriptionEndsAt,
        });
        return data;
    },

    async bulkApproveUsers(userIds: number[], durationMonths: number) {
        const { data } = await axios.post(`${API_URL}/admin/users/bulk-approve`, {
            userIds,
            durationMonths,
        });
        return data;
    },

    async deleteUser(id: number) {
        const { data } = await axios.delete(`${API_URL}/admin/users/${id}`);
        return data;
    },

    async getActivityLogs(params?: { userId?: number; type?: string; limit?: number; offset?: number }) {
        const { data } = await axios.get(`${API_URL}/admin/activity-logs`, { params });
        return data;
    },

    async getAdminActions(params?: { limit?: number; offset?: number }) {
        const { data } = await axios.get(`${API_URL}/admin/admin-actions`, { params });
        return data;
    },
};
