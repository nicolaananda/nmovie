import ShareMovie from '../components/ShareMovie';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { ArrowLeft, AlertCircle, Subtitles, X } from 'lucide-react';
import type { Subtitle } from '../types/metadata';
import Skeleton from '../components/Skeleton';
import { useVidrockProgress } from '../hooks/useVidrockProgress';
import { useNextEpisode } from '../hooks/useNextEpisode';
import NextEpisodeOverlay from '../components/NextEpisodeOverlay';
import SubtitleOverlay from '../components/SubtitleOverlay';
import { parseSrt, shiftCues, type SubtitleCue } from '../utils/srtParser';
import { customSubtitleService, type ApprovedSubtitle } from '../services/customSubtitleService';
import { useToast } from '../contexts/ToastContext';
import { useT } from '../i18n/I18nContext';
import { readPlayerPayload } from '../utils/playerPayload';
import { isAllowedPlayerUrl } from '../constants';

export default function PlayerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const t = useT();
  const [playing, setPlaying] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [cssFull, setCssFull] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const embedContainerRef = useRef<HTMLDivElement>(null);

  // The address bar carries an opaque token (`?t=...`) when the user
  // arrives via the in-app navigation. The actual stream URL and other
  // payload live in sessionStorage so the URL doesn't leak the source.
  // For backward compat (external links, older bookmarks), we still
  // accept the legacy `?url=...&title=...` params.
  const payload = useMemo(() => {
    const token = searchParams.get('t');
    if (token) return readPlayerPayload(token);
    return null;
  }, [searchParams]);

  const effectiveUrl = payload?.url ?? searchParams.get('url');
  const effectiveType = payload?.type ?? searchParams.get('type');

  // Validate the URL against the allowlist. For `type=embed` this means
  // the host must be in EMBED_HOST_ALLOWLIST (currently just vidrock.net).
  // Anything else — non-https schemes, foreign embed host, garbage
  // payload — is rejected so we don't render attacker-controlled content
  // in our app shell.
  const validatedUrl = useMemo(() => {
    if (!effectiveUrl) return null;
    return isAllowedPlayerUrl(effectiveUrl, effectiveType) ? effectiveUrl : null;
  }, [effectiveUrl, effectiveType]);

  const title = payload?.title ?? searchParams.get('title') ?? 'Video Player';
  const tmdbId = payload?.tmdbId ?? searchParams.get('tmdbId') ?? '';
  const mediaType = payload?.mediaType ?? searchParams.get('mediaType') ?? '';
  const poster = payload?.poster ?? searchParams.get('poster') ?? '';
  const season = payload?.season
    ?? (searchParams.get('season') ? parseInt(searchParams.get('season')!) : undefined);
  const episode = payload?.episode
    ?? (searchParams.get('episode') ? parseInt(searchParams.get('episode')!) : undefined);
  const subtitlesJson = searchParams.get('subtitles');
  // Subtitles can come from either the in-memory payload (preferred) or
  // from the URL fallback. The downstream parser only knows about strings,
  // so we serialize the payload variant.
  const subtitlesSource: string | null = useMemo(() => {
    if (payload?.subtitles) {
      try {
        return JSON.stringify(payload.subtitles);
      } catch {
        return null;
      }
    }
    return subtitlesJson;
  }, [payload, subtitlesJson]);

  const isVidrockEmbed = effectiveType === 'embed' && (effectiveUrl?.includes('vidrock.net') ?? false);

  const { ready: progressSeeded } = useVidrockProgress({
    tmdbId,
    mediaType,
    title,
    poster: poster || undefined,
    season,
    episode,
    enabled: isVidrockEmbed,
  });

  const [srtCues, setSrtCues] = useState<SubtitleCue[]>([]);
  const [srtFileName, setSrtFileName] = useState('');
  // Subtitle sync offset in seconds; positive = subtitle muncul lebih lambat.
  const [subOffset, setSubOffset] = useState(0);
  // Subtitle font scale (1 = default, range 0.7–1.6).
  const [subScale, setSubScale] = useState(1);
  const [vidrockTime, setVidrockTime] = useState(0);
  const [vidrockDuration, setVidrockDuration] = useState(0);
  const [approvedSubs, setApprovedSubs] = useState<ApprovedSubtitle[]>([]);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-play next episode state
  const { data: nextEpisode } = useNextEpisode(tmdbId, season, episode);
  const [showNextOverlay, setShowNextOverlay] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [autoPlayCancelled, setAutoPlayCancelled] = useState(false);

  useEffect(() => {
    if (!isVidrockEmbed || !tmdbId) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://vidrock.net') return;
      if (event.data?.type === 'PLAYER_EVENT') {
        const { currentTime, duration } = event.data.data;
        if (typeof currentTime === 'number') {
          setVidrockTime(currentTime);
        }
        if (typeof duration === 'number' && duration > 0) {
          setVidrockDuration(duration);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isVidrockEmbed, tmdbId]);

  // Decide when to surface the "next episode" overlay. We show it during
  // the last 30 seconds (or 5% of duration, whichever is shorter) of the
  // current episode, only for series with a known next episode, and only
  // until the user explicitly cancels it.
  useEffect(() => {
    if (!nextEpisode || vidrockDuration <= 0 || autoPlayCancelled) {
      setShowNextOverlay(false);
      return;
    }
    const threshold = Math.min(30, vidrockDuration * 0.05);
    const remaining = vidrockDuration - vidrockTime;
    if (remaining > 0 && remaining <= threshold) {
      setShowNextOverlay(true);
      setCountdown(Math.max(1, Math.ceil(remaining)));
    } else {
      setShowNextOverlay(false);
    }
  }, [nextEpisode, vidrockDuration, vidrockTime, autoPlayCancelled]);

  const goToNextEpisode = useCallback(() => {
    if (!nextEpisode) return;
    // Navigate to the metadata page of the same series with the new
    // season/episode pre-selected via search params. The user picks the
    // source; we don't auto-launch the iframe to keep behavior predictable
    // when stream URLs differ between episodes.
    const params = new URLSearchParams({
      season: String(nextEpisode.seasonNumber),
      episode: String(nextEpisode.episodeNumber),
    });
    navigate(`/metadata/series/${tmdbId}?${params.toString()}`);
  }, [navigate, tmdbId, nextEpisode]);

  // When the countdown reaches 0, jump.
  useEffect(() => {
    if (!showNextOverlay) return;
    if (vidrockDuration > 0 && vidrockTime >= vidrockDuration - 0.5) {
      goToNextEpisode();
    }
  }, [showNextOverlay, vidrockTime, vidrockDuration, goToNextEpisode]);

  // Skip-intro: best-effort. Only meaningful for direct streams where we
  // own the <video> element. For series we surface a button between
  // 30s and 90s that seeks +75s — the rough length of a typical opening.
  // The cross-origin embed case (vidrock) can't be seeked from outside
  // the iframe, so the button is hidden there.
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const directVideoTime = useRef(0);
  useEffect(() => {
    if (effectiveType === 'embed') return; // embed: can't seek the iframe
    if (!season || !episode) return; // not a series episode
    const internal = playerRef.current?.getInternalPlayer() as HTMLVideoElement | undefined;
    if (!internal) return;
    const onTime = () => {
      const t = internal.currentTime;
      directVideoTime.current = t;
      setShowSkipIntro(t >= 30 && t <= 90);
    };
    internal.addEventListener('timeupdate', onTime);
    return () => internal.removeEventListener('timeupdate', onTime);
  }, [effectiveType, season, episode, validatedUrl]);

  const handleSkipIntro = () => {
    const internal = playerRef.current?.getInternalPlayer() as HTMLVideoElement | undefined;
    if (internal) {
      internal.currentTime = Math.min(
        (internal.duration || 0) - 1,
        directVideoTime.current + 75,
      );
      setShowSkipIntro(false);
    }
  };

  useEffect(() => {
    if (!isVidrockEmbed || !tmdbId) return;
    customSubtitleService.getApproved(tmdbId, season, episode)
      .then(setApprovedSubs)
      .catch(() => {});
  }, [isVidrockEmbed, tmdbId, season, episode]);

  const loadApprovedSub = useCallback((sub: ApprovedSubtitle) => {
    const cues = parseSrt(sub.content);
    setSrtCues(cues);
    setSrtFileName(`${sub.language} - ${sub.user.name}`);
    setShowSubMenu(false);
  }, []);

  const handleSrtUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      if (!content) return;
      const cues = parseSrt(content);
      setSrtCues(cues);
      setSrtFileName(file.name);

      if (tmdbId) {
        const lang = await toast.prompt({
          title: 'Subtitle language',
          message: 'Language code for this subtitle? (e.g. id, en, ja)',
          defaultValue: 'id',
          placeholder: 'id',
        });
        if (lang) {
          setUploadStatus('Uploading...');
          customSubtitleService.upload({
            tmdbId,
            mediaType: mediaType || 'movie',
            seasonNumber: season,
            episodeNumber: episode,
            language: lang,
            fileName: file.name,
            content,
          }).then(() => {
            setUploadStatus('Uploaded! Pending admin approval.');
            setTimeout(() => setUploadStatus(''), 3000);
          }).catch(() => {
            setUploadStatus('Upload failed');
            setTimeout(() => setUploadStatus(''), 3000);
          });
        }
      }
    };
    reader.readAsText(file);

    e.target.value = '';
  }, [tmdbId, mediaType, season, episode, toast]);

  const clearSrt = useCallback(() => {
    setSrtCues([]);
    setSrtFileName('');
  }, []);

  // Parse subtitles from JSON and convert to tracks
  const tracks = useMemo(() => {
    if (!subtitlesSource) return [];

    try {
      const subtitles: Subtitle[] = JSON.parse(subtitlesSource);
      let firstIndonesianFound = false;

      return subtitles.map((sub, idx) => {
        const code = (sub.lang || 'en').toLowerCase();
        let label = 'Unknown';

        if (code === 'en') label = 'English';
        else if (code === 'id') label = 'Indonesian';
        else if (code === 'it') label = 'Italian';
        else if (code === 'es') label = 'Spanish';
        else if (code === 'fr') label = 'French';
        else if (code === 'de') label = 'German';
        else if (code === 'pt') label = 'Portuguese';
        else if (code === 'ar') label = 'Arabic';
        else if (code === 'zh') label = 'Chinese';
        else if (code === 'ja') label = 'Japanese';
        else if (code === 'ko') label = 'Korean';
        else label = code.toUpperCase();

        const sameLangCount = subtitles.filter((s, i) => i < idx && s.lang === sub.lang).length;
        if (sameLangCount > 0) {
          label = `${label} ${sameLangCount + 1}`;
        }

        const isFirstIndonesian = code === 'id' && !firstIndonesianFound;
        if (isFirstIndonesian) {
          firstIndonesianFound = true;
        }

        return {
          kind: 'subtitles' as const,
          src: sub.url,
          srcLang: code,
          label,
          default: isFirstIndonesian,
        };
      });
    } catch (error) {
      console.error('[PlayerPage] Failed to parse subtitles:', error);
      return [];
    }
  }, [subtitlesSource]);

  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => { document.title = prev; };
  }, [title]);

  // Preserve native iframe fullscreen. While anything is fullscreen, lock scrolling on
  // both <html> and <body> so Safari doesn't render its overlay scroll
  // bars next to the player. (Chromium hides them automatically; Safari
  // doesn't unless body is explicitly locked.)
  useEffect(() => {
    if (!isVidrockEmbed) return;

    const lockScroll = () => {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    };
    const unlockScroll = () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        lockScroll();
      } else {
        unlockScroll();
        setCssFull(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    // Safari fires the prefixed event in addition to (or instead of) the
    // standard one in some versions. Bind both to be safe.
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      unlockScroll();
    };
  }, [isVidrockEmbed]);

  useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === ' ' || key === 'spacebar') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (key === 'f') {
        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
            setCssFull(false);
          } else {
            const el = embedContainerRef.current || document.querySelector('video') as HTMLElement;
            if (el?.requestFullscreen) {
              await el.requestFullscreen();
            } else {
              setCssFull(f => !f);
            }
          }
        } catch {
          setCssFull(f => !f);
        }
      } else if (key === 'escape') {
        navigate(-1);
      } else if (key === 'arrowleft') {
        const internal = playerRef.current?.getInternalPlayer() as HTMLVideoElement | undefined;
        if (internal?.currentTime !== undefined) {
          internal.currentTime = Math.max(0, internal.currentTime - 10);
        }
      } else if (key === 'arrowright') {
        const internal = playerRef.current?.getInternalPlayer() as HTMLVideoElement | undefined;
        if (internal?.currentTime !== undefined) {
          internal.currentTime += 10;
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate]);

  // Steal focus back from cross-origin iframe so window-level keyboard
  // shortcuts (F for fullscreen, Space, arrows, Esc) work without first
  // clicking on a parent element. The iframe captures focus once it loads,
  // and because it's cross-origin, key events inside it never bubble out.
  useEffect(() => {
    if (!isVidrockEmbed) return;

    const reclaimFocus = () => {
      // Defer one tick so the browser finishes its focus transition first.
      setTimeout(() => {
        const active = document.activeElement;
        if (active && active.tagName === 'IFRAME') {
          (active as HTMLElement).blur();
          embedContainerRef.current?.focus({ preventScroll: true });
        }
      }, 0);
    };

    // `blur` on window fires when focus moves into a child iframe, which
    // is exactly the symptom we're fixing. This replaces the previous
    // 400ms poll with a precise, event-driven trigger.
    window.addEventListener('blur', reclaimFocus);
    // When the user alt-tabs back to the page, also pull focus to wrapper.
    window.addEventListener('focus', reclaimFocus);

    return () => {
      window.removeEventListener('blur', reclaimFocus);
      window.removeEventListener('focus', reclaimFocus);
    };
  }, [isVidrockEmbed]);

  const handlePiP = async () => {
    try {
      const video = document.querySelector('video') as HTMLVideoElement | null;
      if (video && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await video.requestPictureInPicture();
        }
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Top gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-[5]" />
      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-[5]" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-none flex justify-between items-start pt-6 px-6">
        {/* Floating Island: Back + Title + Subs */}
        <div className="pointer-events-auto flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-2 py-1.5 transition-all hover:bg-black/60 shadow-lg">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="flex flex-col pr-4 border-l border-white/10 pl-3">
            <h1 className="text-sm font-bold text-white max-w-[200px] truncate leading-tight">
              {title}
            </h1>
            {tracks.length > 0 && (
              <span className="text-[9px] text-gray-300">
                {tracks.length} Subs
              </span>
            )}
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {isVidrockEmbed && (
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".srt,.vtt"
                onChange={handleSrtUpload}
                className="hidden"
              />
              {srtFileName ? (
                <div className="relative">
                  <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md border border-green-500/30 rounded-full px-3 py-1.5">
                    <Subtitles size={14} className="text-green-400" />
                    <span className="text-[11px] text-green-300 max-w-[100px] truncate">{srtFileName}</span>
                    <button
                      onClick={() => setShowSubMenu((v) => !v)}
                      className="ml-1 text-gray-400 hover:text-white"
                      aria-label="Subtitle settings"
                      title="Subtitle settings"
                    >
                      <span className="text-[10px]">⚙</span>
                    </button>
                    <button onClick={clearSrt} className="ml-1 text-gray-400 hover:text-white">
                      <X size={12} />
                    </button>
                  </div>
                  {showSubMenu && (
                    <div className="absolute top-full mt-2 right-0 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-3 min-w-[260px] z-30 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                            Sync ({subOffset >= 0 ? '+' : ''}{subOffset.toFixed(1)}s)
                          </label>
                          <button
                            onClick={() => setSubOffset(0)}
                            className="text-[10px] text-gray-500 hover:text-white"
                          >
                            Reset
                          </button>
                        </div>
                        <input
                          type="range"
                          min={-10}
                          max={10}
                          step={0.1}
                          value={subOffset}
                          onChange={(e) => setSubOffset(parseFloat(e.target.value))}
                          className="w-full accent-primary-500"
                        />
                        <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
                          <span>-10s</span>
                          <span>+10s</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                            Size ({Math.round(subScale * 100)}%)
                          </label>
                          <button
                            onClick={() => setSubScale(1)}
                            className="text-[10px] text-gray-500 hover:text-white"
                          >
                            Reset
                          </button>
                        </div>
                        <input
                          type="range"
                          min={0.7}
                          max={1.6}
                          step={0.05}
                          value={subScale}
                          onChange={(e) => setSubScale(parseFloat(e.target.value))}
                          className="w-full accent-primary-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowSubMenu(!showSubMenu)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md hover:bg-white/20 border border-white/10 text-white text-xs font-medium transition-colors"
                  title="Subtitles"
                >
                  <Subtitles size={14} />
                  <span>SUB{approvedSubs.length > 0 ? ` (${approvedSubs.length})` : ''}</span>
                </button>
              )}
              {uploadStatus && (
                <div className="absolute top-full mt-1 right-0 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-green-300 whitespace-nowrap">
                  {uploadStatus}
                </div>
              )}
              {showSubMenu && !srtFileName && (
                <div className="absolute top-full mt-2 right-0 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-2 min-w-[200px] z-30">
                  {approvedSubs.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[10px] text-gray-500 uppercase px-2 mb-1">Community Subtitles</div>
                      {approvedSubs.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => loadApprovedSub(sub)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 flex items-center justify-between"
                        >
                          <span>{sub.language.toUpperCase()} — {sub.user.name}</span>
                          <span className="text-[10px] text-gray-500">{sub.fileName}</span>
                        </button>
                      ))}
                      <div className="border-t border-white/10 my-1" />
                    </div>
                  )}
                  <button
                    onClick={() => { fileInputRef.current?.click(); setShowSubMenu(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10"
                  >
                    Upload SRT file...
                  </button>
                </div>
              )}
            </div>
          )}
          {effectiveType !== 'embed' && (
            <button
              onClick={handlePiP}
              className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-white/20 border border-white/10 text-white text-xs font-medium transition-colors"
              title="Picture-in-Picture"
            >
              PiP
            </button>
          )}
        </div>
      </div>

      {/* Player Area */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center bg-black">
        {validatedUrl ? (
          <div className="w-full h-full">
            {effectiveType === 'embed' ? (
              <div
                ref={embedContainerRef}
                tabIndex={-1}
                className={`w-full h-full relative overflow-hidden bg-black outline-none ${cssFull ? 'fixed inset-0 z-[9999]' : ''}`}
                onMouseEnter={() => {
                  // Pull focus back from the cross-origin iframe so F /
                  // Space / arrow keys are received by the parent window.
                  const active = document.activeElement;
                  if (active && active.tagName === 'IFRAME') {
                    (active as HTMLElement).blur();
                  }
                  embedContainerRef.current?.focus({ preventScroll: true });
                }}
                onDoubleClick={async () => {
                  try {
                    if (document.fullscreenElement) {
                      await document.exitFullscreen();
                      setCssFull(false);
                    } else if (embedContainerRef.current?.requestFullscreen) {
                      await embedContainerRef.current.requestFullscreen();
                    } else {
                      setCssFull(f => !f);
                    }
                  } catch {
                    setCssFull(f => !f);
                  }
                }}
              >
                {progressSeeded ? (
                  <iframe
                    src={validatedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    // We deliberately don't set a `sandbox` attribute.
                    //
                    // Vidrock loads its actual video stream via deeply
                    // nested iframes (cloudnestra, vidsrcme, ...) and
                    // does cross-origin XHR to its own API. Any sandbox
                    // narrower than "all permissions" reliably breaks
                    // playback on at least one of those layers, and
                    // there is no stable subset of tokens that keeps
                    // them all working as the upstream rotates hosts.
                    //
                    // The host is still pinned by the EMBED_HOST_ALLOWLIST
                    // check above, so a malicious URL cannot reach this
                    // iframe in the first place.
                    style={{ position: 'absolute', top: 0, left: 0 }}
                    onLoad={() => {
                      setIframeLoaded(true);
                      // Force focus back to wrapper after iframe finishes
                      // loading. Without this, vidrock's player auto-focuses
                      // its own video element and swallows key events.
                      setTimeout(() => {
                        const active = document.activeElement;
                        if (active && active.tagName === 'IFRAME') {
                          (active as HTMLElement).blur();
                        }
                        embedContainerRef.current?.focus({ preventScroll: true });
                      }, 100);
                    }}
                  />
                ) : null}
                {(!iframeLoaded || !progressSeeded) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <Skeleton variant="card" className="w-1/2 h-1/2" />
                  </div>
                )}
                {srtCues.length > 0 && (
                  <SubtitleOverlay
                    cues={subOffset !== 0 ? shiftCues(srtCues, subOffset) : srtCues}
                    currentTime={vidrockTime}
                    fontScale={subScale}
                  />
                )}
                {showNextOverlay && nextEpisode && (
                  <NextEpisodeOverlay
                    next={nextEpisode}
                    countdown={countdown}
                    onPlayNow={goToNextEpisode}
                    onCancel={() => {
                      setShowNextOverlay(false);
                      setAutoPlayCancelled(true);
                    }}
                  />
                )}
              </div>
            ) : (
              <>
                <ReactPlayer
                  ref={playerRef}
                  url={validatedUrl}
                  playing={playing}
                  controls
                  width="100%"
                  height="100%"
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  config={{
                    file: {
                      tracks,
                      attributes: {
                        crossOrigin: 'anonymous',
                      },
                    },
                  }}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                />
                {showSkipIntro && (
                  <button
                    onClick={handleSkipIntro}
                    className="absolute right-6 bottom-24 z-30 px-4 py-2 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-white text-sm font-semibold hover:bg-black/90"
                  >
                    {t('player.skipIntro')} →
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500 space-y-4 p-8 max-w-lg mx-auto text-center">
            <div className="p-4 rounded-full bg-white/5">
              <AlertCircle size={48} className="opacity-50" />
            </div>
            <p className="text-xl font-medium text-white">
              {effectiveUrl ? 'This stream link is no longer valid' : 'No video source provided'}
            </p>
            {effectiveUrl && (
              <p className="text-sm text-gray-500 leading-relaxed">
                The cached link may have expired or the host is not on the
                allowed list. Pick a fresh source from the metadata page.
              </p>
            )}
            <div className="flex gap-2">
              {tmdbId && (
                <button
                  onClick={() =>
                    navigate(
                      `/metadata/${mediaType === 'series' ? 'series' : 'movie'}/${tmdbId}` +
                        (season && episode ? `?season=${season}&episode=${episode}` : ''),
                    )
                  }
                  className="px-6 py-2 rounded-lg bg-primary-600 text-white text-sm font-bold hover:bg-primary-700"
                >
                  Pick a source
                </button>
              )}
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-bold"
              >
                Go back
              </button>
            </div>
          </div>
        )}
      </div>
      {tmdbId && !cssFull && <div className="p-4"><ShareMovie type={mediaType} id={tmdbId} title={title} /></div>}
    </div>
  );
}
