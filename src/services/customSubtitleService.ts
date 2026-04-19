import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';

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
    const { data: result } = await axios.post(`${API_URL}/custom-subtitles`, data);
    return result;
  },

  async getApproved(tmdbId: string, seasonNumber?: number, episodeNumber?: number) {
    const { data } = await axios.get(`${API_URL}/custom-subtitles/approved`, {
      params: { tmdbId, seasonNumber, episodeNumber },
    });
    return data as ApprovedSubtitle[];
  },

  async adminGetAll(status?: string, limit = 50, offset = 0) {
    const { data } = await axios.get(`${API_URL}/custom-subtitles/admin`, {
      params: { status, limit, offset },
    });
    return data as { subtitles: AdminSubtitle[]; total: number };
  },

  async adminUpdateStatus(id: number, status: 'APPROVED' | 'REJECTED') {
    const { data } = await axios.put(`${API_URL}/custom-subtitles/admin/${id}/status`, { status });
    return data;
  },

  async adminDelete(id: number) {
    const { data } = await axios.delete(`${API_URL}/custom-subtitles/admin/${id}`);
    return data;
  },
};
