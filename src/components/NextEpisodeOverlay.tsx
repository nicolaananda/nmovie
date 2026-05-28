import { useEffect, useState } from 'react';
import { Play, X } from 'lucide-react';
import { useT } from '../i18n/I18nContext';
import type { NextEpisode } from '../hooks/useNextEpisode';

interface NextEpisodeOverlayProps {
  next: NextEpisode;
  /** Seconds remaining before auto-play kicks in. */
  countdown: number;
  onPlayNow: () => void;
  onCancel: () => void;
}

/**
 * Bottom-right overlay that shows up near the end of an episode and
 * counts down before automatically jumping to the next one. Mirrors the
 * familiar Netflix / Disney+ pattern.
 */
export default function NextEpisodeOverlay({
  next,
  countdown,
  onPlayNow,
  onCancel,
}: NextEpisodeOverlayProps) {
  const t = useT();
  const [progress, setProgress] = useState(100);

  // Drive a smooth shrinking progress bar based on the countdown prop.
  useEffect(() => {
    const total = countdown;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const elapsedMs = Date.now() - start;
      const remainingSec = total - elapsedMs / 1000;
      setProgress(Math.max(0, (remainingSec / total) * 100));
      if (remainingSec > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [countdown]);

  return (
    <div className="absolute right-6 bottom-24 md:bottom-16 z-30 max-w-[360px] w-[calc(100vw-3rem)]">
      <div className="bg-black/85 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
              {t('player.nextEpisode')}
            </div>
            <button
              onClick={onCancel}
              aria-label={t('player.cancel')}
              className="text-white/40 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <h3 className="text-white font-semibold text-sm leading-tight">
            S{next.seasonNumber} · E{next.episodeNumber} — {next.name}
          </h3>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onPlayNow}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-gray-200"
            >
              <Play size={14} fill="currentColor" />
              {t('home.watchNow')}
            </button>
            <span className="text-[11px] text-gray-400">
              {t('player.playingNextIn', { seconds: Math.max(0, Math.ceil(countdown * (progress / 100))) })}
            </span>
          </div>
        </div>
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-primary-500 transition-[width] duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
