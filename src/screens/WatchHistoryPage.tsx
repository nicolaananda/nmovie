import { useState, useEffect } from 'react';
import { watchHistoryService, WatchProgress } from '../services/watchHistoryService';
import { History, Trash2, Play } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import { useNavigate } from 'react-router-dom';
import { resolvePosterUrl } from '../utils/posterUrl';
import { useToast } from '../contexts/ToastContext';
import { useT } from '../i18n/I18nContext';

export default function WatchHistoryPage() {
    const [history, setHistory] = useState<WatchProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const navigate = useNavigate();
    const toast = useToast();
    const t = useT();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await watchHistoryService.getHistory();
            setHistory(data.history);
            setTotal(data.total);
        } catch (error) {
            console.error('Failed to fetch watch history', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = async () => {
        const ok = await toast.confirm({
            title: t('history.clearTitle'),
            message: t('history.clearMessage'),
            confirmLabel: t('common.delete'),
            destructive: true,
        });
        if (!ok) return;

        try {
            await watchHistoryService.clearHistory();
            setHistory([]);
            setTotal(0);
            toast.success(t('history.cleared'));
        } catch (error) {
            console.error('Failed to clear history', error);
            toast.error(t('error.generic'));
        }
    };

    const handlePlay = (item: WatchProgress) => {
        const base = item.type === 'movie'
            ? `/metadata/movie/${item.tmdbId}`
            : `/metadata/series/${item.tmdbId}`;
        const params = new URLSearchParams();
        if (item.seasonNumber) params.set('season', String(item.seasonNumber));
        if (item.episodeNumber) params.set('episode', String(item.episodeNumber));
        const qs = params.toString();
        navigate(qs ? `${base}?${qs}` : base);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <Skeleton variant="card" className="w-96 h-52" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f] pt-24 px-4 md:px-8 pb-32 md:pb-20">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <History size={32} className="text-primary-500" />
                        <div>
                            <h1 className="text-3xl font-bold text-white">{t('history.title')}</h1>
                            <p className="text-gray-400 mt-1">{t('history.itemsCount', { count: total })}</p>
                        </div>
                    </div>

                    {history.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/30"
                        >
                            <Trash2 size={18} />
                            {t('common.delete')}
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <EmptyState
                      icon={History}
                      title={t('history.empty')}
                      description={t('history.emptyDesc')}
                      actionLabel={t('common.search')}
                      actionTo="/search"
                    />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {history.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handlePlay(item)}
                                aria-label={`Play ${item.name}`}
                                className="group relative cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
                            >
                                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5">
                                    {item.poster ? (
                                        <img
                                            src={resolvePosterUrl(item.poster) ?? ''}
                                            alt={item.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                                            No Image
                                        </div>
                                    )}

                                    {/* Progress Bar */}
                                    {item.duration && item.progress > 0 && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
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

                                    {/* Completed Badge */}
                                    {item.completed && (
                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                            ✓ Completed
                                        </div>
                                    )}
                                </div>

                                <div className="mt-2">
                                    <h3 className="text-white text-sm font-medium line-clamp-2">{item.name}</h3>
                                    {item.seasonNumber && item.episodeNumber && (
                                        <p className="text-gray-400 text-xs mt-1">
                                            S{item.seasonNumber} E{item.episodeNumber}
                                        </p>
                                    )}
                                    <p className="text-gray-500 text-xs mt-1">
                                        {new Date(item.lastWatchedAt!).toLocaleDateString()}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
