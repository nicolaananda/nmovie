import axios from 'axios';
import { Subtitle } from '../types/metadata';

// Backend proxy URL (same as scraper proxy)
const PROXY_BASE_URL = (import.meta as any).env.VITE_SCRAPER_PROXY_URL || 'https://be-mov.nicola.id';

class SubtitleService {
  async getSubtitles(
    imdbId: string,
    type: 'movie' | 'series',
    season?: number,
    episode?: number,
  ): Promise<Subtitle[]> {
    if (!imdbId) return [];

    try {
      // Clean IMDB ID (ensure it has 'tt' prefix)
      const cleanImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;

      console.log('[SubtitleService] Fetching subtitles via backend proxy:', {
        imdbId: cleanImdbId,
        type,
        season,
        episode,
      });

      // Call backend proxy endpoint
      const response = await axios.post(
        `${PROXY_BASE_URL}/api/subtitles`,
        {
          imdbId: cleanImdbId,
          mediaType: type === 'series' ? 'series' : 'movie',
          season,
          episode,
        },
        {
          timeout: 20000, // 20 seconds timeout
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      const data = response.data;
      const rawSubs: Subtitle[] = data?.subtitles || [];

      console.log('[SubtitleService] Got', rawSubs.length, 'subtitles from backend');
      console.log('[SubtitleService] Languages:', rawSubs.map((s) => s.lang));

      return rawSubs;
    } catch (error: any) {
      console.error('[SubtitleService] Error fetching subtitles via proxy:', error.response?.data || error.message || error);
      
      // If proxy is not available, return empty array
      if (error.code === 'ERR_NETWORK' || error.response?.status === 404) {
        console.warn('[SubtitleService] Backend proxy not available. Make sure server is running on', PROXY_BASE_URL);
      }
      
      return [];
    }
  }
}

export const subtitleService = new SubtitleService();
