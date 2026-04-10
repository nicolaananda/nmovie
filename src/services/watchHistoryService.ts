import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

export interface WatchProgress {
    id?: number;
    tmdbId: string;
    type: string;
    name: string;
    poster?: string;
    seasonNumber?: number;
    episodeNumber?: number;
    progress: number;
    duration?: number;
    completed: boolean;
    lastWatchedAt?: string;
}

export const watchHistoryService = {
    async getHistory(limit = 50, offset = 0) {
        const { data } = await axios.get(`${API_URL}/watch-history`, {
            params: { limit, offset },
        });
        return data;
    },

    async getContinueWatching() {
        const { data } = await axios.get(`${API_URL}/watch-history/continue`);
        return data;
    },

    async updateProgress(progress: WatchProgress) {
        const { data } = await axios.post(`${API_URL}/watch-history/progress`, progress);
        return data;
    },

    async getProgress(tmdbId: string, seasonNumber?: number, episodeNumber?: number) {
        const { data } = await axios.get(`${API_URL}/watch-history/progress/${tmdbId}`, {
            params: { seasonNumber, episodeNumber },
        });
        return data;
    },

    async clearHistory() {
        const { data } = await axios.delete(`${API_URL}/watch-history`);
        return data;
    },
};
