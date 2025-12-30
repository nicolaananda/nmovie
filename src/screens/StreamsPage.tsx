import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useStreams } from '../hooks/useStreams';
import { Play, Download, AlertCircle, Code } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { providerService } from '../services/providerService';
import { useState, useEffect } from 'react';

export default function StreamsPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  // Get season and episode from query params (for series)
  const season = searchParams.get('season') ? parseInt(searchParams.get('season')!) : undefined;
  const episode = searchParams.get('episode') ? parseInt(searchParams.get('episode')!) : undefined;
  const title = searchParams.get('title') || 'Content';

  const mediaType = type === 'movie' ? 'movie' : 'series';
  // Extract ID - handle both tmdb:123456 and plain 123456 formats
  const contentId = id?.includes(':') ? id.split(':')[1] : id || '';

  // Log for debugging
  console.log('[StreamsPage] Fetching streams:', {
    contentId,
    type: mediaType,
    season,
    episode,
    fullId: id,
  });

  const { data: streams, isLoading, isLoadingMore, error, refetch } = useStreams(contentId, mediaType, season, episode);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Show debug info in development
    if (import.meta.env.DEV) {
      const info = `
Provider URL: ${providerService.getProviderUrl()}
Content ID: ${contentId}
Type: ${mediaType}
Season: ${season || 'N/A'}
Episode: ${episode || 'N/A'}
Streams Found: ${streams?.length || 0}
      `.trim();
      setDebugInfo(info);
    }
  }, [contentId, mediaType, season, episode, streams]);

  const handlePlayStream = (streamUrl: string, streamType?: string) => {
    const params = new URLSearchParams({
      url: streamUrl,
      title: title,
      tmdbId: contentId,
      mediaType: mediaType,
    });

    if (season) params.append('season', season.toString());
    if (episode) params.append('episode', episode.toString());

    // Add type parameter if it's an embed
    if (streamType === 'embed') {
      params.append('type', 'embed');
    }

    navigate(`/player?${params.toString()}`);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getQualityBadge = (stream: any) => {
    const quality = stream.quality || stream.title || stream.name || '';
    if (quality.includes('4K') || quality.includes('2160')) return '4K';
    if (quality.includes('1080')) return '1080p';
    if (quality.includes('720')) return '720p';
    if (quality.includes('480')) return '480p';
    return 'SD';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <ErrorMessage
          message="Failed to load streams"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: currentTheme.colors.text }}
          >
            Available Streams
          </h1>
          <p
            className="mt-2"
            style={{ color: currentTheme.colors.textSecondary }}
          >
            {title}
            {type === 'series' && season && episode && ` - S${season}E${episode}`}
          </p>
        </div>
        {import.meta.env.DEV && (
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: currentTheme.colors.cardBackground,
              color: currentTheme.colors.text,
            }}
          >
            <Code size={16} />
            Debug
          </button>
        )}
      </div>

      {showDebug && debugInfo && (
        <div
          className="p-4 rounded-lg font-mono text-xs overflow-auto"
          style={{
            backgroundColor: currentTheme.colors.cardBackground,
            color: currentTheme.colors.textSecondary
          }}
        >
          <pre>{debugInfo}</pre>
        </div>
      )}

      {!streams || streams.length === 0 ? (
        <div
          className="p-8 rounded-lg text-center space-y-4"
          style={{ backgroundColor: currentTheme.colors.cardBackground }}
        >
          <AlertCircle
            size={48}
            className="mx-auto mb-4"
            style={{ color: currentTheme.colors.textSecondary }}
          />
          <div>
            <p style={{ color: currentTheme.colors.text }}>
              No streams available for this content
            </p>
            <p
              className="mt-2 text-sm"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              Content ID: {contentId} | Type: {mediaType}
            </p>
            <p
              className="mt-2 text-xs"
              style={{ color: currentTheme.colors.textSecondary }}
            >
              Check browser console (F12) for detailed error messages
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              backgroundColor: currentTheme.colors.primary,
              color: '#ffffff',
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {streams
            .sort((a, b) => {
              // Sort Vidrock and Vidlink/VidLink to top
              const aName = (a.providerName || a.provider || '').toLowerCase();
              const bName = (b.providerName || b.provider || '').toLowerCase();
              const aIsVidrock = aName.includes('vidrock');
              const bIsVidrock = bName.includes('vidrock');
              const aIsVidlink = aName.includes('vidlink');
              const bIsVidlink = bName.includes('vidlink');

              // Vidrock first
              if (aIsVidrock && !bIsVidrock) return -1;
              if (!aIsVidrock && bIsVidrock) return 1;
              // Then Vidlink
              if (aIsVidlink && !bIsVidlink) return -1;
              if (!aIsVidlink && bIsVidlink) return 1;
              return 0;
            })
            .map((stream, index) => {
              const streamName = (stream.providerName || stream.provider || '').toLowerCase();
              const isVidrock = streamName.includes('vidrock');
              const isVidlink = streamName.includes('vidlink');
              const isPriority = isVidrock || isVidlink;
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg transition-all hover:scale-[1.02] ${isVidrock
                      ? 'border-2 border-green-500/60 relative overflow-hidden bg-gradient-to-br from-green-500/10 to-transparent'
                      : isPriority
                        ? 'border border-primary-500/50 relative overflow-hidden'
                        : ''
                    }`}
                  style={{ backgroundColor: isVidrock ? undefined : currentTheme.colors.cardBackground }}
                >
                  {isVidrock && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-green-600 to-green-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg shadow-lg flex items-center gap-1">
                      <span>⚡ Less Ads</span>
                      <span className="opacity-60">•</span>
                      <span>Recommended</span>
                    </div>
                  )}
                  {isVidlink && !isVidrock && (
                    <div className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-bl-lg shadow-lg">
                      Recommended
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className="font-semibold"
                          style={{ color: currentTheme.colors.text }}
                        >
                          {stream.title || stream.name || 'Stream'}
                        </h3>
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: currentTheme.colors.primary + '20',
                            color: currentTheme.colors.primary
                          }}
                        >
                          {getQualityBadge(stream)}
                        </span>
                        {stream.type === 'embed' && (
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              backgroundColor: '#10b981' + '20',
                              color: '#10b981'
                            }}
                          >
                            Embed Player
                          </span>
                        )}
                        {stream.addonName && (
                          <span
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: currentTheme.colors.border,
                              color: currentTheme.colors.textSecondary
                            }}
                          >
                            {stream.addonName}
                          </span>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-4 text-sm flex-wrap"
                        style={{ color: currentTheme.colors.textSecondary }}
                      >
                        {stream.size && (
                          <span className="flex items-center gap-1">
                            <Download size={14} />
                            {formatFileSize(stream.size)}
                          </span>
                        )}
                        {stream.lang && (
                          <span>Language: {stream.lang}</span>
                        )}
                      </div>

                      {stream.description && (
                        <p
                          className="text-sm line-clamp-2"
                          style={{ color: currentTheme.colors.textSecondary }}
                        >
                          {stream.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handlePlayStream(stream.url || '', stream.type)}
                      disabled={!stream.url}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: currentTheme.colors.primary,
                        color: '#ffffff'
                      }}
                    >
                      <Play size={16} fill="white" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              );
            })}

          {isLoadingMore && (
            <div className="flex items-center justify-center gap-3 p-4 text-gray-400 bg-white/5 rounded-lg animate-pulse">
              <LoadingSpinner size="small" />
              <span className="text-sm font-medium">Searching other providers...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

