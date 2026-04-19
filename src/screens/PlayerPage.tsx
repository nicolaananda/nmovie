import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { ArrowLeft, AlertCircle, Subtitles, X } from 'lucide-react';
import type { Subtitle } from '../types/metadata';
import Skeleton from '../components/Skeleton';
import { useVidrockProgress } from '../hooks/useVidrockProgress';
import SubtitleOverlay from '../components/SubtitleOverlay';
import { parseSrt, type SubtitleCue } from '../utils/srtParser';
import { customSubtitleService, type ApprovedSubtitle } from '../services/customSubtitleService';

export default function PlayerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const embedContainerRef = useRef<HTMLDivElement>(null);

  // Get URL and type from parameters
  const effectiveUrl = searchParams.get('url');
  const effectiveType = searchParams.get('type');

  // Validate URL safely
  const validatedUrl = useMemo(() => {
    if (!effectiveUrl) return null;
    try {
      const u = new URL(effectiveUrl);
      if (u.protocol === 'http:' || u.protocol === 'https:') {
        return effectiveUrl;
      }
    } catch {
      return null;
    }
    return null;
  }, [effectiveUrl]);

  const title = searchParams.get('title') || 'Video Player';
  const tmdbId = searchParams.get('tmdbId') || '';
  const mediaType = searchParams.get('mediaType') || '';
  const poster = searchParams.get('poster') || '';
  const season = searchParams.get('season') ? parseInt(searchParams.get('season')!) : undefined;
  const episode = searchParams.get('episode') ? parseInt(searchParams.get('episode')!) : undefined;
  const subtitlesJson = searchParams.get('subtitles');

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
  const [vidrockTime, setVidrockTime] = useState(0);
  const [approvedSubs, setApprovedSubs] = useState<ApprovedSubtitle[]>([]);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isVidrockEmbed || !tmdbId) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://vidrock.net') return;
      if (event.data?.type === 'PLAYER_EVENT') {
        const { currentTime } = event.data.data;
        if (typeof currentTime === 'number') {
          setVidrockTime(currentTime);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isVidrockEmbed, tmdbId]);

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
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (!content) return;
      const cues = parseSrt(content);
      setSrtCues(cues);
      setSrtFileName(file.name);

      if (tmdbId) {
        const lang = prompt('Language code for this subtitle? (e.g. id, en, ja)', 'id');
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
  }, [tmdbId, mediaType, season, episode]);

  const clearSrt = useCallback(() => {
    setSrtCues([]);
    setSrtFileName('');
  }, []);

  // Parse subtitles from JSON and convert to tracks
  const tracks = useMemo(() => {
    if (!subtitlesJson) return [];

    try {
      const subtitles: Subtitle[] = JSON.parse(subtitlesJson);
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
  }, [subtitlesJson]);

  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => { document.title = prev; };
  }, [title]);

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
          } else {
            const el = embedContainerRef.current || document.querySelector('video') as HTMLElement;
            if (el?.requestFullscreen) {
              await el.requestFullscreen();
            }
          }
        } catch { /* ignore */ }
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
                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md border border-green-500/30 rounded-full px-3 py-1.5">
                  <Subtitles size={14} className="text-green-400" />
                  <span className="text-[11px] text-green-300 max-w-[100px] truncate">{srtFileName}</span>
                  <button onClick={clearSrt} className="ml-1 text-gray-400 hover:text-white">
                    <X size={12} />
                  </button>
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
                className="w-full h-full relative overflow-hidden bg-black"
                onDoubleClick={async () => {
                  try {
                    if (document.fullscreenElement) {
                      await document.exitFullscreen();
                    } else {
                      await embedContainerRef.current?.requestFullscreen();
                    }
                  } catch { /* ignore */ }
                }}
              >
                {progressSeeded ? (
                  <iframe
                    src={validatedUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0 }}
                    onLoad={() => setIframeLoaded(true)}
                  />
                ) : null}
                {(!iframeLoaded || !progressSeeded) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <Skeleton variant="card" className="w-1/2 h-1/2" />
                  </div>
                )}
                {srtCues.length > 0 && (
                  <SubtitleOverlay cues={srtCues} currentTime={vidrockTime} />
                )}
              </div>
            ) : (
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
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500 space-y-4 p-8">
            <div className="p-4 rounded-full bg-white/5">
              <AlertCircle size={48} className="opacity-50" />
            </div>
            <p className="text-xl font-medium">No video source provided</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 rounded-lg bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
