import { apiClient } from './apiClient';

export interface FeaturedContent {
  id: number;
  tmdbId: string;
  mediaType: string;
  title: string;
  description?: string;
  banner?: string;
  poster?: string;
  badge?: string;
  startsAt?: string;
  endsAt?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const featuredService = {
  async getActive(): Promise<FeaturedContent | null> {
    const { data } = await apiClient.get<FeaturedContent | null>('/featured');
    return data ?? null;
  },

  async adminList(): Promise<FeaturedContent[]> {
    const { data } = await apiClient.get<FeaturedContent[]>('/admin/featured');
    return data;
  },

  async adminCreate(payload: Partial<FeaturedContent>) {
    const { data } = await apiClient.post<FeaturedContent>('/admin/featured', payload);
    return data;
  },

  async adminUpdate(id: number, payload: Partial<FeaturedContent>) {
    const { data } = await apiClient.put<FeaturedContent>(`/admin/featured/${id}`, payload);
    return data;
  },

  async adminDelete(id: number) {
    await apiClient.delete(`/admin/featured/${id}`);
  },

  async adminSetSupporter(userId: number, isSupporter: boolean) {
    const { data } = await apiClient.put(`/admin/users/${userId}/supporter`, { isSupporter });
    return data;
  },
};
