import { useEffect, useRef, useState } from 'react';
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
  const [ready, setReady] = useState(!enabled);

  // Seed localStorage with server-side progress before iframe mounts
  useEffect(() => {
    if (!enabled || !tmdbId) {
      setReady(true);
      return;
    }

    let cancelled = false;

    const seedProgress = async () => {
      try {
        const serverProgress = await watchHistoryService.getProgress(tmdbId, season, episode);

        if (cancelled) return;
        if (!serverProgress || serverProgress.progress <= 0) {
          setReady(true);
          return;
        }

        const existing = JSON.parse(localStorage.getItem('vidRockProgress') || '[]');
        const items = Array.isArray(existing) ? existing : [];
        const tmdbNum = parseInt(tmdbId);
        const vidType = mediaType === 'series' || mediaType === 'tv' ? 'tv' : 'movie';

        const idx = items.findIndex((item: any) => item.id === tmdbNum);
        const entry: any = {
          id: tmdbNum,
          type: vidType,
          title: title || '',
          poster_path: poster?.replace('https://image.tmdb.org/t/p/w500', '') || '',
          progress: {
            watched: serverProgress.progress,
            duration: serverProgress.duration || 0,
          },
          last_updated: Date.now(),
        };

        if (vidType === 'tv' && season && episode) {
          const key = `s${season}e${episode}`;
          entry.last_season_watched = String(season);
          entry.last_episode_watched = String(episode);
          entry.show_progress = {
            [key]: {
              season: String(season),
              episode: String(episode),
              progress: {
                watched: serverProgress.progress,
                duration: serverProgress.duration || 0,
              },
              last_updated: Date.now(),
            },
          };
        }

        if (idx >= 0) {
          items[idx] = { ...items[idx], ...entry };
        } else {
          items.push(entry);
        }

        localStorage.setItem('vidRockProgress', JSON.stringify(items));
      } catch (err) {
        console.warn('[useVidrockProgress] Failed to seed progress from server:', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    seedProgress();
    return () => { cancelled = true; };
  }, [enabled, tmdbId, mediaType, title, poster, season, episode]);

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

  return { ready };
}
