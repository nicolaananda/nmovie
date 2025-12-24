import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import type { Subtitle } from '../types/metadata';

export default function PlayerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(true);

  const originalUrl = searchParams.get('url');
  const title = searchParams.get('title') || 'Video Player';
  const subtitlesJson = searchParams.get('subtitles');

  // Proxy video URL through backend to bypass CORS
  const url = useMemo(() => {
    if (!originalUrl) return null;
    
    // Get API base URL from environment
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7001/api';
    const baseUrl = apiUrl.replace('/api', '');
    
    // Encode original URL
    const encodedUrl = encodeURIComponent(originalUrl);
    
    // Return proxied URL
    return `${baseUrl}/api/proxy/stream?url=${encodedUrl}`;
  }, [originalUrl]);

  // Parse subtitles from JSON and convert to tracks
  const tracks = useMemo(() => {
    if (!subtitlesJson) return [];

    try {
      const subtitles: Subtitle[] = JSON.parse(subtitlesJson);

      // Track if we've found the first Indonesian subtitle
      let firstIndonesianFound = false;

      // Convert subtitles to track format
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

        // If multiple subtitles have same language, add index
        const sameLangCount = subtitles.filter((s, i) => i < idx && s.lang === sub.lang).length;
        if (sameLangCount > 0) {
          label = `${label} ${sameLangCount + 1}`;
        }

        // Auto-select first Indonesian subtitle
        const isFirstIndonesian = code === 'id' && !firstIndonesianFound;
        if (isFirstIndonesian) {
          firstIndonesianFound = true;
        }

        return {
          kind: 'subtitles' as const,
          src: sub.url,
          srcLang: code,
          label,
          default: isFirstIndonesian, // Auto-select first Indonesian subtitle
        };
      });
    } catch (error) {
      console.error('[PlayerPage] Failed to parse subtitles:', error);
      return [];
    }
  }, [subtitlesJson]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Top bar overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-none flex justify-center pt-6">
        {/* Floating Island: Back + Title + Subs */}
        <div className="pointer-events-auto flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-2 py-1.5 transition-all hover:bg-black/60 shadow-lg animate-slide-down">
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
      </div>

      {/* Player Area */}
      <div className="flex-1 w-full h-full relative flex items-center justify-center bg-black">
        {url ? (
          <div className="w-full h-full">
            <ReactPlayer
              url={url}
              playing={playing}
              controls={true}
              width="100%"
              height="100%"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              config={{
                file: {
                  tracks,
                  attributes: {
                    crossOrigin: "anonymous" // crucial for subtitles
                  }
                },
              }}
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
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
