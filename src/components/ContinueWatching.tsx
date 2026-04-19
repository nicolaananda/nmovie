import { useState, useEffect } from 'react';
import { watchHistoryService, WatchProgress } from '../services/watchHistoryService';
import { Play, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ContinueWatching() {
    const [items, setItems] = useState<WatchProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchContinueWatching();
    }, []);

    const fetchContinueWatching = async () => {
        try {
            const data = await watchHistoryService.getContinueWatching();
            setItems(data);
        } catch (error) {
            console.error('Failed to fetch continue watching', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlay = (item: WatchProgress) => {
        if (item.type === 'movie') {
            navigate(`/metadata/movie/${item.tmdbId}`);
        } else {
            navigate(`/metadata/series/${item.tmdbId}`);
        }
    };

    if (loading || items.length === 0) {
        return null;
    }

    return (
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
                <Clock size={24} className="text-primary-500" />
                <h2 className="text-2xl font-bold text-white">Continue Watching</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="group relative cursor-pointer"
                    >
                        {/* Remove button */}
                        <button
                            aria-label="Remove from continue watching"
                            title="Remove"
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm('Remove from Continue Watching?')) {
                                    try {
                                        if (typeof item.id === 'number') {
                                            await watchHistoryService.removeWatchHistory(item.id);
                                            setItems((curr) => curr.filter((x) => x.id !== item.id));
                                        }
                                    } catch (err) {
                                        console.error('Failed to remove', err);
                                    }
                                }
                            }}
                            className="absolute top-1 right-1 z-10 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/90"
                        >
                            <span className="text-xs">✕</span>
                        </button>

                        <div onClick={() => handlePlay(item)} className="group cursor-pointer">
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
                            {item.poster ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${item.poster}`}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                    No Image
                                </div>
                            )}

                            {/* Progress Bar */}
                            {item.duration && item.progress > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                                    <div
                                        className="h-full bg-primary-500"
                                        style={{
                                            width: `${Math.min((item.progress / item.duration) * 100, 100)}%`,
                                        }}
                                    />
                                </div>
                            )}

                            {/* Play Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play size={48} className="text-white" fill="white" />
                            </div>

                            {/* Progress Percentage */}
                            {item.duration && (
                                <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                    {Math.round((item.progress / item.duration) * 100)}%
                                </div>
                            )}
                        </div>
                        </div>

                        <div className="mt-2">
                            <h3 className="text-white text-sm font-medium line-clamp-2">{item.name}</h3>
                            {item.seasonNumber && item.episodeNumber && (
                                <p className="text-gray-400 text-xs mt-1">
                                    S{item.seasonNumber} E{item.episodeNumber}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
