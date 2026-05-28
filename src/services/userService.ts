import { apiClient } from './apiClient';

export const userService = {
    async getProfile() {
        const { data } = await apiClient.get('/user/profile');
        return data;
    },

    async updateProfile(name: string) {
        const { data } = await apiClient.put('/user/profile', { name });
        return data;
    },

    async changePassword(currentPassword: string, newPassword: string) {
        const { data } = await apiClient.post('/user/change-password', {
            currentPassword,
            newPassword,
        });
        return data;
    },

    async getDevices() {
        const { data } = await apiClient.get('/user/devices');
        return data;
    },

    async removeDevice(deviceId: string) {
        const { data } = await apiClient.delete(`/user/devices/${deviceId}`);
        return data;
    },
};
