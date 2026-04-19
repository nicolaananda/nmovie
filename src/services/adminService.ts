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

    async updateUserStatus(id: number, status: string, durationDays?: number, subscriptionEndsAt?: string) {
        const { data } = await axios.put(`${API_URL}/admin/users/${id}/status`, {
            status,
            durationDays,
            subscriptionEndsAt,
        });
        return data;
    },

    async bulkApproveUsers(userIds: number[], durationDays: number) {
        const { data } = await axios.post(`${API_URL}/admin/users/bulk-approve`, {
            userIds,
            durationDays,
        });
        return data;
    },

    // Bulk notify users
    async bulkNotify(title: string, message: string, target: string, selectedUserIds?: number[]) {
        const payload: any = { title, message, target };
        if (target === 'SELECTED') payload.selectedUserIds = selectedUserIds || [];
        const { data } = await axios.post(`${API_URL}/admin/bulk-notify`, payload);
        return data;
    },

    async deleteUser(id: number) {
        const { data } = await axios.delete(`${API_URL}/admin/users/${id}`);
        return data;
    },

    // Update user role
    async updateUserRole(userId: number, role: string) {
        const { data } = await axios.put(`${API_URL}/admin/users/${userId}/role`, {
            role,
        });
        return data;
    },

    // Subscription Plans
    async getSubscriptionPlans() {
        const { data } = await axios.get(`${API_URL}/admin/subscription-plans`);
        return data;
    },
    async createSubscriptionPlan(plan: { name: string; durationDays: number; price: number; features: string[]; isActive: boolean }) {
        const { data } = await axios.post(`${API_URL}/admin/subscription-plans`, plan);
        return data;
    },
    async updateSubscriptionPlan(planId: number, plan: { name?: string; durationDays?: number; price?: number; features?: string[]; isActive?: boolean }) {
        const { data } = await axios.put(`${API_URL}/admin/subscription-plans/${planId}`, plan);
        return data;
    },
    async deleteSubscriptionPlan(planId: number) {
        const { data } = await axios.delete(`${API_URL}/admin/subscription-plans/${planId}`);
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
