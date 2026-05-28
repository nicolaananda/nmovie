import { apiClient } from './apiClient';

export interface CustomSubtitleUpload {
  tmdbId: string;
  mediaType: string;
  seasonNumber?: number;
  episodeNumber?: number;
  language: string;
  fileName: string;
  content: string;
}

export interface ApprovedSubtitle {
  id: number;
  language: string;
  fileName: string;
  content: string;
  user: { name: string };
  createdAt: string;
}

export interface AdminSubtitle {
  id: number;
  tmdbId: string;
  mediaType: string;
  seasonNumber?: number;
  episodeNumber?: number;
  language: string;
  fileName: string;
  content: string;
  status: string;
  user: { name: string; email: string };
  createdAt: string;
}

export const customSubtitleService = {
  async upload(data: CustomSubtitleUpload) {
    const { data: result } = await apiClient.post('/custom-subtitles', data);
    return result;
  },

  async getApproved(tmdbId: string, seasonNumber?: number, episodeNumber?: number) {
    const { data } = await apiClient.get('/custom-subtitles/approved', {
      params: { tmdbId, seasonNumber, episodeNumber },
    });
    return data as ApprovedSubtitle[];
  },

  async adminGetAll(status?: string, limit = 50, offset = 0) {
    const { data } = await apiClient.get('/custom-subtitles/admin', {
      params: { status, limit, offset },
    });
    return data as { subtitles: AdminSubtitle[]; total: number };
  },

  async adminUpdateStatus(id: number, status: 'APPROVED' | 'REJECTED') {
    const { data } = await apiClient.put(`/custom-subtitles/admin/${id}/status`, { status });
    return data;
  },

  async adminDelete(id: number) {
    const { data } = await apiClient.delete(`/custom-subtitles/admin/${id}`);
    return data;
  },
};
