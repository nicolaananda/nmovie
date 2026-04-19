import { useEffect, useRef } from 'react';
import { watchHistoryService } from '../services/watchHistoryService';

interface VidrockMediaData {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path?: string;
  backdrop_path?: string;
  progress: { watched: number; duration: number };
  last_updated: number;
  number_of_episodes?: number;
  number_of_seasons?: number;
  last_season_watched?: string;
  last_episode_watched?: string;
  show_progress?: Record<string, {
    season: string;
    episode: string;
    progress: { watched: number; duration: number };
    last_updated: number;
  }>;
}

interface PlayerEventData {
  event: 'play' | 'pause' | 'seeked' | 'ended' | 'timeupdate';
  currentTime: number;
  duration: number;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

interface UseVidrockProgressOptions {
  tmdbId: string;
  mediaType: string;
  title: string;
  poster?: string;
  season?: number;
  episode?: number;
  enabled: boolean;
}

const VIDROCK_ORIGIN = 'https://vidrock.net';
const SAVE_INTERVAL_MS = 15_000;

export function useVidrockProgress(options: UseVidrockProgressOptions) {
  const { tmdbId, mediaType, title, poster, season, episode, enabled } = options;
  const lastSaveRef = useRef<number>(0);
  const progressRef = useRef<{ watched: number; duration: number }>({ watched: 0, duration: 0 });

  useEffect(() => {
    if (!enabled || !tmdbId) return;

    const saveProgress = (watched: number, duration: number, completed: boolean) => {
      if (duration <= 0) return;

      const now = Date.now();
      if (!completed && now - lastSaveRef.current < SAVE_INTERVAL_MS) return;
      lastSaveRef.current = now;

      const normalizedType = mediaType === 'tv' || mediaType === 'series' ? 'series' : 'movie';

      watchHistoryService.updateProgress({
        tmdbId,
        type: normalizedType,
        name: title,
        poster: poster || undefined,
        seasonNumber: season,
        episodeNumber: episode,
        progress: watched,
        duration,
        completed,
      }).catch((err) => {
        console.error('[useVidrockProgress] Failed to save progress:', err);
      });
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== VIDROCK_ORIGIN) return;

      const data = event.data;
      if (!data?.type) return;

      if (data.type === 'MEDIA_DATA') {
        const media = data.data as VidrockMediaData;
        if (!media?.progress) return;

        localStorage.setItem('vidRockProgress', JSON.stringify(media));

        const { watched, duration } = media.progress;
        progressRef.current = { watched, duration };

        const completed = duration > 0 && (watched / duration) > 0.9;
        saveProgress(watched, duration, completed);
      }

      if (data.type === 'PLAYER_EVENT') {
        const ev = data.data as PlayerEventData;
        if (!ev) return;

        progressRef.current = { watched: ev.currentTime, duration: ev.duration };

        if (ev.event === 'ended') {
          saveProgress(ev.currentTime, ev.duration, true);
        } else if (ev.event === 'pause' || ev.event === 'timeupdate') {
          const completed = ev.duration > 0 && (ev.currentTime / ev.duration) > 0.9;
          saveProgress(ev.currentTime, ev.duration, completed);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);

      const { watched, duration } = progressRef.current;
      if (watched > 0 && duration > 0) {
        const completed = (watched / duration) > 0.9;
        lastSaveRef.current = 0;
        saveProgress(watched, duration, completed);
      }
    };
  }, [enabled, tmdbId, mediaType, title, poster, season, episode]);
}
