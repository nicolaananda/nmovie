import { apiClient } from './apiClient';

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

export interface EpisodeProgress {
    progress: number;
    duration?: number;
    completed: boolean;
    lastWatchedAt?: string;
}

/** Map keyed by `s{season}e{episode}`. */
export type SeriesProgressMap = Record<string, EpisodeProgress>;

export const watchHistoryService = {
    async getHistory(limit = 50, offset = 0) {
        const { data } = await apiClient.get('/watch-history', {
            params: { limit, offset },
        });
        return data;
    },

    async getContinueWatching() {
        const { data } = await apiClient.get('/watch-history/continue');
        return data;
    },

    async updateProgress(progress: WatchProgress) {
        const { data } = await apiClient.post('/watch-history/progress', progress);
        return data;
    },

    async getProgress(tmdbId: string, seasonNumber?: number, episodeNumber?: number) {
        const { data } = await apiClient.get(`/watch-history/progress/${tmdbId}`, {
            params: { seasonNumber, episodeNumber },
        });
        return data;
    },

    async getSeriesProgress(tmdbId: string): Promise<SeriesProgressMap> {
        const { data } = await apiClient.get<SeriesProgressMap>(
            `/watch-history/series/${tmdbId}/episodes`,
        );
        return data ?? {};
    },

    async clearHistory() {
        const { data } = await apiClient.delete('/watch-history');
        return data;
    },

    async removeWatchHistory(id: number) {
        const { data } = await apiClient.delete(`/watch-history/${id}`);
        return data;
    },
};
