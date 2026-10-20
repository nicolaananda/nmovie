import axios from 'axios';
import { StreamingContent } from '../types/metadata';
import { TMDB_IMAGE_BASE_URL, TMDB_DEFAULT_POSTER_SIZE } from '../constants';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

class TMDBService {
  private api = axios.create({
    baseURL: TMDB_BASE_URL,
    params: {
      api_key: TMDB_API_KEY,
    },
  });

  getImageUrl(path: string | null, size: string = TMDB_DEFAULT_POSTER_SIZE): string {
    if (!path) return '/placeholder-poster.jpg';
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  async getTrending(mediaType: 'movie' | 'tv' = 'movie', timeWindow: 'day' | 'week' = 'day'): Promise<StreamingContent[]> {
    try {
      const response = await this.api.get(`/trending/${mediaType}/${timeWindow}`);
      return response.data.results.map((item: any) => this.transformToStreamingContent(item, mediaType));
    } catch (error) {
      console.error('Error fetching trending content:', error);
      return [];
    }
  }

  async getPopular(mediaType: 'movie' | 'tv' = 'movie'): Promise<StreamingContent[]> {
    try {
      const response = await this.api.get(`/${mediaType}/popular`);
      return response.data.results.map((item: any) => this.transformToStreamingContent(item, mediaType));
    } catch (error) {
      console.error('Error fetching popular content:', error);
      return [];
    }
  }

  async getGenres(mediaType: 'movie' | 'tv' = 'movie'): Promise<{ id: number; name: string }[]> {
    try {
      const response = await this.api.get(`/genre/${mediaType}/list`);
      // Normalize to common shape
      return response.data.genres || [];
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
  }

  async search(query: string): Promise<StreamingContent[]> {
    try {
      const response = await this.api.get('/search/multi', {
        params: { query },
      });
      return response.data.results
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => this.transformToStreamingContent(item, item.media_type));
    } catch (error) {
      console.error('Error searching content:', error);
      throw error;
    }
  }

  async getDetails(id: number, mediaType: 'movie' | 'tv'): Promise<StreamingContent | null> {
    try {
      const response = await this.api.get(`/${mediaType}/${id}`, {
        params: { append_to_response: 'credits,videos,external_ids' },
      });
      return this.transformToStreamingContent(response.data, mediaType);
    } catch (error) {
      console.error('Error fetching content details:', error);
      return null;
    }
  }

  async getSimilar(type: 'movie' | 'tv', id: number): Promise<StreamingContent[]> {
    try {
      const response = await this.api.get(`/${type}/${id}/similar`);
      return response.data.results.map((item: any) => this.transformToStreamingContent(item, type));
    } catch (error) {
      console.error('Error fetching similar content:', error);
      return [];
    }
  }

  async getRecommendations(type: 'movie' | 'tv', id: number): Promise<StreamingContent[]> {
    try {
      const response = await this.api.get(`/${type}/${id}/recommendations`);
      return response.data.results.map((item: any) => this.transformToStreamingContent(item, type));
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  }

  async discover(mediaType: 'movie' | 'tv', params: Record<string, any>): Promise<StreamingContent[]> {
    try {
      const response = await this.api.get(`/discover/${mediaType}`, { params });
      return response.data.results.map((item: any) => this.transformToStreamingContent(item, mediaType));
    } catch (error) {
      console.error('Error discovering content:', error);
      throw error;
    }
  }

  async getTVSeasons(tvId: number): Promise<any[]> {
    try {
      const response = await this.api.get(`/tv/${tvId}`);
      return response.data.seasons || [];
    } catch (error) {
      console.error('Error fetching TV seasons:', error);
      return [];
    }
  }

  async getTVEpisodes(tvId: number, seasonNumber: number): Promise<any[]> {
    try {
      const response = await this.api.get(`/tv/${tvId}/season/${seasonNumber}`);
      return response.data.episodes || [];
    } catch (error) {
      console.error('Error fetching TV episodes:', error);
      return [];
    }
  }

  private transformToStreamingContent(item: any, mediaType: string): StreamingContent {
    const isMovie = mediaType === 'movie';

    // Get IMDB ID from either direct property (movies) or external_ids (TV series)
    const imdbId = item.imdb_id || item.external_ids?.imdb_id;

    return {
      id: `tmdb:${item.id}`,
      type: isMovie ? 'movie' : 'series',
      name: item.title || item.name,
      tmdbId: item.id,
      poster: this.getImageUrl(item.poster_path),
      banner: this.getImageUrl(item.backdrop_path, 'original'),
      imdbRating: item.vote_average ? item.vote_average.toFixed(1) : undefined,
      year: item.release_date ? new Date(item.release_date).getFullYear() :
        item.first_air_date ? new Date(item.first_air_date).getFullYear() : undefined,
      genres: item.genres?.map((g: any) => g.name) || [],
      genreIds: item.genre_ids || item.genres?.map((g: any) => g.id) || [],
      popularity: item.popularity,
      status: item.status,
      nextEpisode: item.next_episode_to_air,
      trailerStreams: (item.videos?.results || []).filter((v: any) => v.site === 'YouTube' && v.type === 'Trailer' && /^[\w-]{11}$/.test(v.key)),
      description: item.overview,
      runtime: item.runtime ? `${item.runtime} min` : undefined,
      released: item.release_date || item.first_air_date,
      imdb_id: imdbId,
      originalLanguage: item.original_language,
    };
  }
}

export const tmdbService = new TMDBService();
