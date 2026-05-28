import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCatalog } from '../contexts/CatalogContext';
import type { LibraryCategory } from '../contexts/CatalogContext';
import { Play, Plus, Check, Star, Lock, Layers, Tv, CheckCircle2, Bookmark, Heart } from 'lucide-react';
import { useContentDetails, useTVSeasons, useTVEpisodes, useSimilarContent } from '../hooks/useContent';
import { useStreams } from '../hooks/useStreams';
import { useSeriesProgress } from '../hooks/useSeriesProgress';
import { useItemProgress } from '../hooks/useItemProgress';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { subtitleService } from '../services/subtitleService';
import ContentCard from '../components/ContentCard';
import type { Subtitle } from '../types/metadata';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useT } from '../i18n/I18nContext';
import { stashPlayerPayload } from '../utils/playerPayload';
import { rememberLastStream } from '../utils/lastStreamCache';
import { formatTime } from '../utils/formatTime';

export default function MetadataPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isInLibrary, addToLibrary, removeFromLibrary, getItemCategory, setItemCategory } = useCatalog();
  const { user, isApproved } = useAuth();
  const toast = useToast();
  const t = useT();

  // Extract TMDB ID from id (format: tmdb:123456)
  const tmdbId = id?.includes(':') ? parseInt(id.split(':')[1]) : parseInt(id || '0');
  const mediaType = type === 'movie' ? 'movie' : 'tv';
  const streamType = type === 'movie' ? 'movie' : 'series';

  const { data: content, isLoading, error, refetch } = useContentDetails(tmdbId, mediaType);

  // For series: fetch seasons and episodes. Default to S1E1 unless the
  // caller passed `?season=&episode=` (e.g. continue-watching deep links).
  const isSeries = type === 'series';
  const initialSeason = parseInt(searchParams.get('season') || '1') || 1;
  const initialEpisode = parseInt(searchParams.get('episode') || '1') || 1;
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(initialEpisode);
  const [activeTab, setActiveTab] = useState<'episodes' | 'sources'>(type === 'series' ? 'episodes' : 'sources');

  const { data: seasons } = useTVSeasons(isSeries ? tmdbId : 0);
  const { data: episodes } = useTVEpisodes(
    isSeries ? tmdbId : 0,
    selectedSeason,
  );

  // Update selected episode when episodes load (default to E1)
  useEffect(() => {
    if (episodes && episodes.length > 0 && selectedEpisode > episodes.length) {
      setSelectedEpisode(1);
    }
  }, [episodes, selectedEpisode]);

  // Fetch streams with season/episode for series, or without for movies
  const { data: streams, isLoading: loadingStreams, refetch: refetchStreams } = useStreams(
    String(tmdbId),
    (mediaType === 'tv' ? 'series' : mediaType) as 'movie' | 'series',
    selectedSeason,
    selectedEpisode
  );

  const primaryStream = streams && streams.length > 0 ? streams[0] : null;

  // Per-episode progress map for the watched/in-progress markers in
  // the episode list. Empty for movies.
  const seriesProgress = useSeriesProgress(String(tmdbId), isSeries && Boolean(user));

  // Progress for the *currently selected* item (movie or specific S/E),
  // used to drive the Resume banner.
  const itemProgress = useItemProgress(
    String(tmdbId),
    Boolean(user),
    isSeries ? selectedSeason : undefined,
    isSeries ? selectedEpisode : undefined,
  );
  const resumeAt = itemProgress.data?.progress ?? 0;
  const resumeDuration = itemProgress.data?.duration ?? 0;
  const resumeCompleted = itemProgress.data?.completed ?? false;
  const showResume = resumeAt > 30 && !resumeCompleted;
  const resumePct = resumeDuration > 0
    ? Math.min(100, Math.round((resumeAt / resumeDuration) * 100))
    : 0;

  // Per-route document title + OG tags so link previews on Discord,
  // WhatsApp, etc. show the actual title and banner instead of the
  // generic site default.
  useDocumentMeta({
    title: content?.name,
    description: content?.description,
    image: content?.banner ?? content?.poster,
    type: isSeries ? 'video.tv_show' : 'video.movie',
  });

  // Similar content section — cached by react-query so it doesn't refire
  // on every mount.
  const { data: similar = [] } = useSimilarContent(mediaType, tmdbId);

  // Fetch subtitles (all will be loaded in player)
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);

  useEffect(() => {
    const loadSubtitles = async () => {
      if (!content?.imdb_id) return;
      try {
        const subs = await subtitleService.getSubtitles(
          content.imdb_id,
          streamType,
          isSeries ? selectedSeason : undefined,
          isSeries ? selectedEpisode : undefined,
        );
        setSubtitles(subs);
      } catch (error) {
        console.error('[MetadataPage] Error loading subtitles:', error);
      }
    };

    loadSubtitles();
  }, [content?.imdb_id, streamType, isSeries, selectedSeason, selectedEpisode]);

  const handlePlay = () => {
    if (!content) return;

    // If streams are available, use primary stream
    if (primaryStream?.url) {
      handlePlayStream(primaryStream.url, primaryStream.type);
    } else {
      // Show message if no streams available
      console.warn('[MetadataPage] No streams available to play');
    }
  };

  const handlePlayStream = (streamUrl: string, sourceType?: string) => {
    if (!content) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (!isApproved) {
      toast.warning('Your account is pending approval. Playback unlocks once an admin approves it.');
      return;
    }

    const title = isSeries
      ? `${content.name} - S${selectedSeason}E${selectedEpisode}`
      : content.name;

    // Stash the actual stream payload in sessionStorage so the address
    // bar shows only an opaque token. Cleaner UX, and the URL no longer
    // leaks the underlying provider.
    const playerPayload = {
      url: streamUrl,
      type: sourceType === 'embed' ? 'embed' : undefined,
      title,
      tmdbId: String(tmdbId),
      imdbId: content.imdb_id,
      mediaType: streamType,
      poster: content.poster,
      season: isSeries ? selectedSeason : undefined,
      episode: isSeries ? selectedEpisode : undefined,
      subtitles: subtitles && subtitles.length > 0 ? subtitles : undefined,
    };

    // Persist the resolved source so Continue Watching can launch the
    // player in one click without re-resolving.
    rememberLastStream(playerPayload);

    const token = stashPlayerPayload(playerPayload);

    if (token) {
      navigate(`/player?t=${token}`);
      return;
    }

    // Fallback to legacy URL-param flow if sessionStorage is unavailable.
    const params = new URLSearchParams({
      url: streamUrl,
      title,
      tmdbId: String(tmdbId),
    });

    if (content.imdb_id) {
      params.set('imdbId', content.imdb_id);
    }

    params.set('mediaType', streamType);

    if (content.poster) {
      params.set('poster', content.poster);
    }

    if (isSeries) {
      params.set('season', String(selectedSeason));
      params.set('episode', String(selectedEpisode));
    }

    // Pass all subtitles as JSON
    if (subtitles && subtitles.length > 0) {
      params.set('subtitles', JSON.stringify(subtitles));
    }

    // Add type parameter if it's an embed
    if (sourceType === 'embed') {
      params.set('type', 'embed');
    }

    navigate(`/player?${params.toString()}`);
  };

  const handleEpisodeSelect = (season: number, episode: number) => {
    setSelectedSeason(season);
    setSelectedEpisode(episode);
    setActiveTab('sources');
  };

  const handleLibraryToggle = () => {
    if (content) {
      if (isInLibrary(content.id)) {
        removeFromLibrary(content.id);
      } else {
        addToLibrary(content);
      }
    }
  };

  const handleCategoryPick = (category: LibraryCategory) => {
    if (!content) return;
    if (isInLibrary(content.id)) {
      setItemCategory(content.id, category);
    } else {
      addToLibrary(content, category);
    }
    setShowCategoryMenu(false);
  };

  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <ErrorMessage
          message="Failed to load content details"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const inLibrary = isInLibrary(content.id);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 font-sans pb-20 relative overflow-x-hidden">
      {/* IMMERSIVE BACKGROUND */}
      <div className="fixed inset-0 z-0">
        {content.banner || content.poster ? (
          <>
            <img
              src={content.banner || content.poster}
              alt={content.name}
              className="w-full h-full object-cover opacity-60 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent" />
            <div className="absolute inset-0 bg-primary-900/20 mix-blend-overlay" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[#0f0f0f]" />
        )}
      </div>

      {/* Similar Content Section */}
      {similar && similar.length > 0 && (
        <section className="px-4 md:px-12 mx-auto max-w-7xl py-6">
          <h3 className="text-2xl font-bold mb-3 text-white">You Might Also Like</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
            {similar.slice(0, 12).map((s) => (
              <ContentCard key={s.id} content={s as any} />
            ))}
          </div>
        </section>
      )}

      {/* CONTENT LAYER */}
      <div className="relative z-10 pt-24 px-4 md:px-12 max-w-7xl mx-auto flex flex-col md:flex-row gap-10">

        {/* LEFT COLUMN: Poster & Actions */}
        <div className="w-full md:w-[350px] flex-shrink-0 space-y-6">
          <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 group relative aspect-[2/3]">
            {content.poster ? (
              <img src={content.poster} alt={content.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500">No Image</div>
            )}
          </div>

          <div className="space-y-3">
            {showResume && (
              <div className="rounded-xl bg-primary-900/15 border border-primary-500/30 p-3">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-primary-300 font-semibold uppercase tracking-wider">
                    {isSeries
                      ? `S${selectedSeason} · E${selectedEpisode}`
                      : 'Continue'}
                  </span>
                  {resumeDuration > 0 && (
                    <span className="text-gray-400">{resumePct}%</span>
                  )}
                </div>
                {resumeDuration > 0 && (
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-primary-500"
                      style={{ width: `${resumePct}%` }}
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handlePlay}
                    className="flex-1 px-3 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    {t('metadata.resume', { time: formatTime(resumeAt) })}
                  </button>
                  <button
                    onClick={handlePlay}
                    title={t('metadata.startOver')}
                    className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs"
                  >
                    {t('metadata.startOver')}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handlePlay}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
              style={{
                backgroundColor: '#ffffff',
                color: '#000000'
              }}
            >
              <Play size={24} fill="black" />
              <span>{showResume ? t('metadata.startOver') : 'Play Now'}</span>
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  if (inLibrary) setShowCategoryMenu((v) => !v);
                  else handleLibraryToggle();
                }}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-bold bg-white/10 border border-white/10 backdrop-blur-md transition-colors hover:bg-white/20"
              >
                {inLibrary ? <Check size={20} /> : <Plus size={20} />}
                <span>
                  {inLibrary
                    ? (() => {
                        const c = getItemCategory(content.id);
                        if (c === 'FAVORITE') return 'Favorited';
                        if (c === 'WATCHED') return 'Watched';
                        return 'In Watchlist';
                      })()
                    : 'Add to Library'}
                </span>
              </button>

              {inLibrary && showCategoryMenu && (
                <div
                  className="absolute top-full mt-2 left-0 right-0 bg-[#1a1a1a] border border-white/10 rounded-xl p-1 shadow-2xl z-20"
                  onMouseLeave={() => setShowCategoryMenu(false)}
                >
                  <button
                    onClick={() => handleCategoryPick('WATCHLIST')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5"
                  >
                    <Bookmark size={14} /> Move to Watchlist
                  </button>
                  <button
                    onClick={() => handleCategoryPick('FAVORITE')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5"
                  >
                    <Heart size={14} /> Mark as Favorite
                  </button>
                  <button
                    onClick={() => handleCategoryPick('WATCHED')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5"
                  >
                    <CheckCircle2 size={14} /> Mark as Watched
                  </button>
                  <div className="border-t border-white/5 my-1" />
                  <button
                    onClick={() => {
                      removeFromLibrary(content.id);
                      setShowCategoryMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10"
                  >
                    Remove from Library
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Details */}
        <div className="flex-1 space-y-8 pt-4">
          {/* Header Info */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-xl">
              {content.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base font-medium text-gray-300">
              <div className="flex items-center space-x-1 text-[#46d369]">
                <Star size={18} fill="#46d369" />
                <span className="font-bold">{content.imdbRating || 'N/A'}</span>
              </div>
              <span>•</span>
              <span>{content.year || 'Unknown'}</span>
              {content.runtime && (
                <>
                  <span>•</span>
                  <span>{content.runtime}</span>
                </>
              )}
              {content.genres && content.genres.length > 0 && (
                <div className="flex gap-2 ml-2">
                  {content.genres.slice(0, 3).map(g => (
                    <span key={g} className="px-2 py-0.5 rounded border border-white/20 text-xs text-gray-300">
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Plot */}
          <div className="glass-panel p-6 rounded-2xl bg-black/20 backdrop-blur-md border border-white/5 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
            <p className="text-gray-300 leading-relaxed text-base md:text-lg font-light">
              {content.description || 'No description available for this title.'}
            </p>
          </div>

          {/* Layout for Series (Episodes) or Movies (Streams) */}
          <div className="space-y-6">

            {/* TABS NAVIGATION */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-1">
              {isSeries && (
                <button
                  onClick={() => setActiveTab('episodes')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'episodes'
                    ? 'border-primary-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                >
                  <Layers size={16} />
                  Episodes
                </button>
              )}
              <button
                onClick={() => setActiveTab('sources')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'sources'
                  ? 'border-primary-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
                  }`}
              >
                <Tv size={16} />
                Sources
              </button>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="min-h-[400px]">

              {/* EPISODES TAB */}
              {activeTab === 'episodes' && isSeries && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-white">Season {selectedSeason}</h3>
                    {seasons && seasons.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto md:max-w-[70%] custom-scrollbar justify-start md:justify-end">
                        {seasons.filter(s => s.season_number > 0).map(s => (
                          <button
                            key={s.id}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedSeason === s.season_number
                              ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                              }`}
                            onClick={() => { setSelectedSeason(s.season_number); setSelectedEpisode(1); }}
                          >
                            Season {s.season_number}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="glass-panel rounded-xl overflow-hidden bg-black/20 border border-white/5">
                    <div className="max-h-[600px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {episodes?.map(ep => {
                        const epProgress = seriesProgress.data?.[`s${selectedSeason}e${ep.episode_number}`];
                        const isWatched = epProgress?.completed === true;
                        const inProgress = !!epProgress && !isWatched && epProgress.progress > 0;
                        const pct = epProgress?.duration && epProgress.duration > 0
                          ? Math.min(100, Math.round((epProgress.progress / epProgress.duration) * 100))
                          : 0;
                        const isSelected = selectedEpisode === ep.episode_number;
                        return (
                          <button
                            key={ep.id}
                            onClick={() => handleEpisodeSelect(selectedSeason, ep.episode_number)}
                            className={`w-full flex items-center justify-between p-4 rounded-lg transition-all group relative overflow-hidden ${
                              isSelected
                                ? 'bg-primary-900/20 border border-primary-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                : 'hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative ${
                                isWatched
                                  ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/40'
                                  : isSelected
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-white/10 text-gray-400 group-hover:bg-white/20'
                              }`}>
                                {isWatched ? <CheckCircle2 size={16} /> : ep.episode_number}
                              </div>
                              <div className="text-left">
                                <div className={`font-medium text-sm ${
                                  isWatched ? 'text-gray-400' : isSelected ? 'text-white' : 'text-gray-300'
                                }`}>
                                  {ep.name || `Episode ${ep.episode_number}`}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2">
                                  {ep.air_date?.substring(0, 4)}
                                  {inProgress && (
                                    <span className="text-primary-400">{pct}% watched</span>
                                  )}
                                  {isWatched && <span className="text-green-400">Watched</span>}
                                </div>
                              </div>
                            </div>

                            {isSelected ? (
                              <div className="flex items-center gap-2 text-primary-400 text-xs font-bold px-3 py-1 rounded-full bg-primary-500/10">
                                <span>Selected</span>
                              </div>
                            ) : (
                              <Play size={16} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}

                            {/* Progress bar at the bottom of the row for in-progress episodes */}
                            {inProgress && (
                              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                                <div className="h-full bg-primary-500" style={{ width: `${pct}%` }} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SOURCES TAB */}
              {activeTab === 'sources' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-white">Select Source</h3>
                      {isSeries && (
                        <span className="text-xs font-bold text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                          S{selectedSeason}:E{selectedEpisode}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => refetchStreams()}
                      className="text-xs font-bold text-primary-400 hover:text-white uppercase tracking-wider px-3 py-1 rounded hover:bg-white/5 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="glass-panel p-1 rounded-2xl bg-black/20 backdrop-blur-md border border-white/5 min-h-[500px]">
                    {loadingStreams ? (
                      <div className="flex flex-col justify-center items-center h-[300px] gap-4">
                        <LoadingSpinner />
                        <span className="text-sm text-gray-500 animate-pulse">Searching best streams...</span>
                      </div>
                    ) : !streams || streams.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 gap-2">
                        <Tv size={48} className="opacity-20" />
                        <p>No streams found for this content.</p>
                        <button onClick={() => refetchStreams()} className="text-primary-400 hover:underline">Try Refreshing or Login first </button>
                      </div>
                    ) : (
                      <div className="space-y-4 p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {[...streams].sort((a, b) => {
                          const aName = (a.providerName || a.provider || a.addonName || '').toLowerCase();
                          const bName = (b.providerName || b.provider || b.addonName || '').toLowerCase();
                          const aVidrock = aName.includes('vidrock') || (a.url || '').includes('vidrock.net');
                          const bVidrock = bName.includes('vidrock') || (b.url || '').includes('vidrock.net');
                          if (aVidrock && !bVidrock) return -1;
                          if (!aVidrock && bVidrock) return 1;
                          return 0;
                        }).map((stream, idx) => {
                          const sName = (stream.providerName || stream.provider || stream.addonName || '').toLowerCase();
                          const isVidrock = sName.includes('vidrock') || (stream.url || '').includes('vidrock.net');
                          return (
                          <div
                            key={idx}
                            className={`flex flex-col md:flex-row items-center justify-between p-4 rounded-xl transition-all gap-4 group ${isVidrock
                              ? 'bg-green-500/10 hover:bg-green-500/15 border-2 border-green-500/40'
                              : 'bg-white/5 hover:bg-white/10 border border-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0 w-full md:w-auto">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${isVidrock
                                ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                                : 'bg-white/5 border border-white/5 text-gray-500'
                              }`}>
                                {idx + 1}
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-white text-base truncate">
                                    {stream.title || stream.name || `Server ${idx + 1}`}
                                  </span>
                                  {stream.quality && (
                                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${stream.quality.includes('4K') ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                                      stream.quality.includes('1080') ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                                        'bg-white/10 text-gray-400 border-white/10'
                                      }`}>
                                      {stream.quality}
                                    </span>
                                  )}
                                  {stream.type === 'embed' && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                      Embed
                                    </span>
                                  )}
                                  {isVidrock && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-500/20 text-green-400 border border-green-500/30">
                                      ▶ Supports Resume
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 truncate">
                                  {stream.description || stream.addonName || 'Direct Stream'} • {stream.size ? (stream.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown Size'}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handlePlayStream(stream.url || stream.sources?.[0] || '', stream.type)}
                              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-transform active:scale-95 shadow-lg w-full md:w-auto justify-center ${!user || !isApproved
                                ? 'bg-white/5 text-gray-400 cursor-not-allowed'
                                : isVidrock
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-white text-black hover:bg-primary-500 hover:text-white'
                                }`}
                            >
                              {!user ? (
                                <>
                                  <Lock size={14} />
                                  <span>Login required</span>
                                </>
                              ) : !isApproved ? (
                                <>
                                  <Lock size={14} />
                                  <span>Approval required</span>
                                </>
                              ) : (
                                <>
                                  <Play size={16} fill={user && isApproved ? "currentColor" : "none"} />
                                  <span>Play Stream</span>
                                </>
                              )}
                            </button>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
