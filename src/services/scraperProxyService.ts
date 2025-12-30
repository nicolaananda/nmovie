import axios from 'axios';
import { Stream } from '../types/metadata';

/**
 * Scraper Proxy Service
 * 
 * Since browser cannot directly execute JavaScript scrapers from GitHub,
 * we need a backend proxy/server that:
 * 1. Downloads scrapers from GitHub
 * 2. Executes them in a Node.js environment
 * 3. Returns streams to the web app
 * 
 * For now, this service tries to call a proxy endpoint.
 * You need to setup a backend server to handle scraper execution.
 */

const PROXY_BASE_URL = import.meta.env.VITE_SCRAPER_PROXY_URL ||
  'http://localhost:7001'; // Default to local proxy server

export interface ScraperProxyResponse {
  streams: Stream[];
  scraperId?: string;
  scraperName?: string;
  error?: string;
}

class ScraperProxyService {
  /**
   * Get streams using scraper proxy
   * The proxy server should execute scrapers and return streams
   */
  async getStreams(
    tmdbId: string,
    mediaType: 'movie' | 'tv',
    season?: number,
    episode?: number,
    mode: 'all' | 'vidlink' | 'others' = 'all'
  ): Promise<Stream[]> {
    try {
      console.log('[ScraperProxyService] Fetching streams:', { tmdbId, mediaType, season, episode, mode });

      // Get token from storage
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${PROXY_BASE_URL}/api/scrapers/streams`,
        {
          tmdbId,
          mediaType,
          season,
          episode,
          mode,
        },
        {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }
      );

      if (response.data) {
        const streams = response.data.streams || [];
        console.log('[ScraperProxyService] Got', streams.length, 'streams');

        if (response.data.errors && response.data.errors.length > 0) {
          console.warn('[ScraperProxyService] Some scrapers failed:', response.data.errors);
        }

        // Normalize and filter out invalid streams
        const normalizedStreams = streams
          .map((stream: any) => this.normalizeStream(stream))
          .filter((stream: Stream | null) => stream !== null && stream.url);

        console.log('[ScraperProxyService] Returning', normalizedStreams.length, 'valid streams');
        return normalizedStreams;
      }

      return [];
    } catch (error: any) {
      console.error('[ScraperProxyService] Error:', error.message);

      // If proxy is not available, return empty array
      if (error.code === 'ERR_NETWORK' || error.response?.status === 404) {
        console.warn('[ScraperProxyService] Proxy server not available. Please setup backend proxy.');
      }

      return [];
    }
  }

  /**
   * Normalize stream format from scraper to app format
   */
  private normalizeStream(stream: any): Stream {
    // Ensure URL exists
    const url = stream.url || stream.src || stream.link || stream.playlist;
    if (!url) {
      console.warn('[ScraperProxyService] Stream missing URL:', stream);
      return null as any; // Will be filtered out
    }

    // Detect if this is an embed URL (iframe-compatible)
    const isEmbedUrl = this.isEmbedUrl(url);
    const streamType = stream.type || (isEmbedUrl ? 'embed' : undefined);

    return {
      url,
      title: stream.title || stream.name || stream.label || 'Stream',
      name: stream.name || stream.title || 'Stream',
      quality: stream.quality || this.extractQuality(stream.title || stream.name || ''),
      size: stream.size ? this.parseSize(stream.size) : undefined,
      lang: stream.language || stream.lang || stream.lang || 'en',
      description: stream.description,
      headers: stream.headers || {},
      addon: stream.provider || stream.addon || 'local-scraper',
      addonName: stream.providerName || stream.addonName || 'Local Scraper',
      type: streamType, // Add type for iframe detection
      // Keep original properties
      ...stream,
    };
  }

  /**
   * Check if URL is an embed/iframe URL
   */
  private isEmbedUrl(url: string): boolean {
    const embedDomains = [
      'vidrock.net',
      'vidsrc.to',
      'vidsrc.me',
      'vidsrc.xyz',
      'embedsu.com',
      'embed.su',
      '2embed.cc',
      'multiembed.mov',
      'autoembed.cc',
      'player.autoembed.cc',
      'embed.smashystream.com',
      'player.smashy.stream',
      'frembed.pro',
      'vidlink.pro',
      'vidsrc.pro',
    ];

    const urlLower = url.toLowerCase();
    return embedDomains.some(domain => urlLower.includes(domain));
  }

  private extractQuality(text: string): string {
    if (!text) return '';
    const qualityMatch = text.match(/(\d+)p|(\d+)k|4K|1080p|720p|480p/i);
    return qualityMatch ? qualityMatch[0].toUpperCase() : '';
  }

  private parseSize(size: string | number): number | undefined {
    if (typeof size === 'number') return size;
    if (typeof size !== 'string') return undefined;

    const sizeStr = size.toLowerCase().trim();
    const gbMatch = sizeStr.match(/([\d.]+)\s*gb/);
    if (gbMatch) {
      return parseFloat(gbMatch[1]) * 1024 * 1024 * 1024;
    }

    const mbMatch = sizeStr.match(/([\d.]+)\s*mb/);
    if (mbMatch) {
      return parseFloat(mbMatch[1]) * 1024 * 1024;
    }

    return undefined;
  }

  /**
   * Check if proxy server is available
   */
  async checkProxyHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${PROXY_BASE_URL}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const scraperProxyService = new ScraperProxyService();

