import axios from 'axios';
import { Stream } from '../types/metadata';
import { scraperProxyService } from './scraperProxyService';

// Scraper Proxy URL - Backend server that executes scrapers
const SCRAPER_PROXY_URL = import.meta.env.VITE_SCRAPER_PROXY_URL ||
  'http://localhost:7001';

const PROVIDER_BASE_URL = 'https://nuvio-providers.vercel.app';

// Helper function removed - using jsDelivr directly to avoid CORS

export interface Provider {
  id: string;
  name: string;
  version: string;
  manifest?: string;
  catalogUrl?: string;
  streamUrl?: string;
}

class ProviderService {
  private providers: Provider[] = [];

  async loadProviders(): Promise<Provider[]> {
    try {
      // Use jsDelivr CDN only (no fallback to avoid CORS)
      const manifestUrl = `${PROVIDER_BASE_URL}/manifest.json`;
      console.log('[ProviderService] Loading manifest from:', manifestUrl);

      const response = await axios.get(manifestUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
        },
      });

      this.providers = response.data.providers || [];
      console.log('[ProviderService] Loaded providers:', this.providers.length);
      return this.providers;
    } catch (error: any) {
      console.warn('[ProviderService] Could not load manifest, using default provider:', error.message);
      // Fallback to default provider (skip manifest)
      this.providers = [
        {
          id: 'nuvio-main',
          name: 'Nuvio Provider',
          version: '1.0.0',
        },
      ];
      return this.providers;
    }
  }

  async getStreams(contentId: string, type: 'movie' | 'series', season?: number, episode?: number, mode: 'all' | 'vidlink' | 'others' = 'all'): Promise<Stream[]> {
    try {
      console.log('[ProviderService] Fetching streams:', { contentId, type, season, episode });

      // Use scraper proxy service to execute scrapers
      // The proxy server will download scrapers from GitHub and execute them
      const streams = await scraperProxyService.getStreams(
        contentId,
        type === 'series' ? 'tv' : 'movie',
        season,
        episode,
        mode
      );

      console.log('[ProviderService] Got', streams.length, 'streams from proxy');
      return streams;

      return streams;
    } catch (error: any) {
      console.error('[ProviderService] Error fetching streams:', error);
      return [];
    }
  }



  async searchContent(query: string): Promise<any[]> {
    try {
      const response = await axios.get(`${PROVIDER_BASE_URL}/search/${encodeURIComponent(query)}.json`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
        },
      });

      return response.data.results || response.data || [];
    } catch (error) {
      console.error('[ProviderService] Error searching content:', error);
      return [];
    }
  }

  async getCatalog(type: 'movie' | 'series', catalogId: string = 'top'): Promise<any[]> {
    try {
      const response = await axios.get(`${PROVIDER_BASE_URL}/catalog/${type}/${catalogId}.json`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
        },
      });

      return response.data.metas || response.data || [];
    } catch (error) {
      console.error('[ProviderService] Error fetching catalog:', error);
      return [];
    }
  }

  getProviders(): Provider[] {
    return this.providers;
  }

  getProviderUrl(): string {
    return SCRAPER_PROXY_URL;
  }
}

export const providerService = new ProviderService();

