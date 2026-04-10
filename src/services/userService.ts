import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

export const userService = {
    async getProfile() {
        const { data } = await axios.get(`${API_URL}/user/profile`);
        return data;
    },

    async updateProfile(name: string) {
        const { data } = await axios.put(`${API_URL}/user/profile`, { name });
        return data;
    },

    async changePassword(currentPassword: string, newPassword: string) {
        const { data } = await axios.post(`${API_URL}/user/change-password`, {
            currentPassword,
            newPassword,
        });
        return data;
    },

    async getDevices() {
        const { data } = await axios.get(`${API_URL}/user/devices`);
        return data;
    },

    async removeDevice(deviceId: string) {
        const { data } = await axios.delete(`${API_URL}/user/devices/${deviceId}`);
        return data;
    },
};
