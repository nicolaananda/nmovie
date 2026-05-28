import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTrendingContent, usePopularContent, useIndonesianContent, useGenreContent } from '../hooks/useContent';
import { usePersonalRecommendations } from '../hooks/useRecommendations';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../i18n/I18nContext';
import { featuredService } from '../services/featuredService';
import ContentCard from '../components/ContentCard';
import ContentCardSkeleton from '../components/ContentCardSkeleton';
import ContinueWatching from '../components/ContinueWatching';
import ErrorMessage from '../components/ErrorMessage';
import type { StreamingContent } from '../types/metadata';

interface CategoryRowProps {
  title: string;
  data: StreamingContent[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
}

function CategoryRow({ title, data, isLoading, error, onRetry }: CategoryRowProps) {
  const t = useT();
  return (
    <div className="space-y-6 relative group/row">
      <div className="flex items-center justify-between px-2">
        <h2 className="section-title mb-2 flex items-center gap-3">
          <span className="w-1.5 h-8 bg-gradient-to-b from-primary-500 to-primary-800 rounded-full shadow-[0_0_15px_rgba(229,9,20,0.5)]"></span>
          {title}
        </h2>
        <button className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider flex items-center gap-2 group/btn">
          {t('common.explore')} <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      {error ? (
        <ErrorMessage message={`${t('error.failedToLoad')}: ${title}`} onRetry={onRetry} />
      ) : (
        <div className="relative">
          {/* Edge masks */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0f0f0f] to-transparent z-10 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-500" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0f0f0f] to-transparent z-10 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-500" />

          <div className="flex gap-5 overflow-x-auto pb-8 hide-scrollbar scroll-pl-6 px-2">
            {isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="flex-shrink-0 w-[160px] md:w-[220px]">
                    <ContentCardSkeleton />
                  </div>
                ))
              : data?.slice(0, 20).map((content, idx) => (
                  <div
                    key={content.id}
                    className="flex-shrink-0 w-[160px] md:w-[220px] transition-all duration-500 ease-out"
                    style={{ transitionDelay: `${idx * 50}ms` }}
                  >
                    <ContentCard content={content} />
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const t = useT();

  const trending = useTrendingContent('movie');
  const popular = usePopularContent('tv');
  const indonesianMovies = useIndonesianContent('movie');
  const indonesianSeries = useIndonesianContent('tv');
  const action = useGenreContent('movie', '28');
  const recommendations = usePersonalRecommendations(Boolean(user));

  // Admin-curated hero. Falls back to trending[0] when there isn't an
  // active featured row, or when the endpoint is unavailable (e.g. the
  // FeaturedContent migration hasn't been deployed yet). We disable the
  // retry so a single 500 doesn't spam the network tab.
  const featured = useQuery({
    queryKey: ['featured-active'],
    queryFn: () => featuredService.getActive(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Compose the hero either from the featured row or the trending fallback.
  const hero = featured.data
    ? {
        id: `tmdb:${featured.data.tmdbId}`,
        type: featured.data.mediaType === 'tv' ? 'series' : 'movie',
        name: featured.data.title,
        banner: featured.data.banner || trending.data?.[0]?.banner,
        description: featured.data.description,
        badge: featured.data.badge,
      }
    : trending.data && trending.data.length > 0
      ? { ...trending.data[0], badge: undefined as string | undefined }
      : null;

  const handleHeroPlay = () => {
    if (!hero) return;
    navigate(`/metadata/${hero.type}/${hero.id}`);
  };

  const handleHeroMoreInfo = () => {
    if (!hero) return;
    navigate(`/metadata/${hero.type}/${hero.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-32 md:pb-20 overflow-x-hidden">
      {/* PARALLAX HERO SECTION */}
      <section className="relative h-[95vh] w-full overflow-hidden">
        {hero && hero.banner ? (
          <div className="absolute inset-0">
            <img
              src={hero.banner}
              alt={hero.name}
              className="w-full h-full object-cover animate-fade-in scale-105"
            />
            {/* Complex Gradient Overlay for "Maroon depth" */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent" />
            <div className="absolute inset-0 bg-primary-900/10 mix-blend-overlay" /> {/* Maroon Tint */}
          </div>
        ) : (
          // Show skeleton hero while data loads
          trending.isLoading ? (
            <div className="absolute inset-0 bg-[#0f0f0f] flex items-center justify-center">
              <ContentCardSkeleton />
            </div>
          ) : (
            <div className="absolute inset-0 bg-[#0f0f0f]" />
          )
        )}

        {/* Hero content */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 space-y-8 max-w-4xl pt-24">
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center space-x-3 mb-2">
              <div className="px-3 py-1 bg-primary-600/90 backdrop-blur-md rounded-md text-white text-xs font-bold tracking-wider uppercase shadow-lg shadow-primary-900/40">
                {hero?.badge ?? 'N-Movie Exclusive'}
              </div>
              <span className="text-gray-300 text-sm font-medium tracking-wide uppercase px-2 border-l border-gray-600">
                Series
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl leading-[0.9] tracking-tight">
              {hero?.name ?? t('common.loading')}
            </h1>

            {/* Meta info row */}
            {hero && (
              <div className="flex items-center space-x-6 text-gray-200 text-base font-medium">
                <div className="flex items-center space-x-2 text-green-400">
                  <span className="font-bold">{t('home.percentMatch', { value: 98 })}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span>2024</span>
                <span className="text-gray-400">•</span>
                <span className="border border-gray-500/50 px-2 py-0.5 rounded text-xs bg-black/20 backdrop-blur-sm">4K Ultra HD</span>
              </div>
            )}
          </div>

          {hero?.description && (
            <p className="text-gray-300 text-lg md:text-xl font-light leading-relaxed max-w-2xl drop-shadow-lg line-clamp-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {hero.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-5 pt-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={handleHeroPlay}
              className="group flex items-center justify-center px-8 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <span className="mr-3 text-2xl group-hover:pl-1 transition-all">▶</span>
              {t('home.watchNow')}
            </button>

            <button
              onClick={handleHeroMoreInfo}
              className="flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 text-white font-semibold text-lg hover:bg-white/20 transition-all border border-white/10 backdrop-blur-xl"
            >
              <span className="mr-3">ℹ️</span>
              {t('home.details')}
            </button>
          </div>
        </div>
      </section>

      {/* ROWS */}
      <section className="space-y-16 px-6 md:px-16 -mt-32 relative z-10">
        {/* Continue Watching - Only show for logged in users */}
        {user && <ContinueWatching />}

        {/* Personal recommendations - only when we have results */}
        {user && recommendations.data && recommendations.data.length > 0 && (
          <CategoryRow
            title={t('home.recommended')}
            data={recommendations.data}
            isLoading={recommendations.isLoading}
            error={recommendations.error}
            onRetry={() => recommendations.refetch()}
          />
        )}

        <CategoryRow
          title={t('home.trendingMovies')}
          data={trending.data}
          isLoading={trending.isLoading}
          error={trending.error}
          onRetry={() => trending.refetch()}
        />

        <CategoryRow
          title={t('home.popularTv')}
          data={popular.data}
          isLoading={popular.isLoading}
          error={popular.error}
          onRetry={() => popular.refetch()}
        />

        <CategoryRow
          title={t('home.indonesianMovies')}
          data={indonesianMovies.data}
          isLoading={indonesianMovies.isLoading}
          error={indonesianMovies.error}
          onRetry={() => indonesianMovies.refetch()}
        />

        <CategoryRow
          title={t('home.indonesianSeries')}
          data={indonesianSeries.data}
          isLoading={indonesianSeries.isLoading}
          error={indonesianSeries.error}
          onRetry={() => indonesianSeries.refetch()}
        />

        <CategoryRow
          title={t('home.actionHits')}
          data={action.data}
          isLoading={action.isLoading}
          error={action.error}
          onRetry={() => action.refetch()}
        />
      </section>
    </div>
  );
}
