import { useNavigate } from 'react-router-dom';
import { useTrendingContent, usePopularContent, useIndonesianContent, useGenreContent } from '../hooks/useContent';
import ContentCard from '../components/ContentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// Reusable Row Component to avoid duplication
const CategoryRow = ({ title, fetcher, mediaType }: { title: string, fetcher: any, mediaType: 'movie' | 'tv' }) => {
  const { data, isLoading, error, refetch } = fetcher(mediaType);

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner size="large" /></div>;
  if (error) return <ErrorMessage message={`Failed to load ${title}`} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6 relative group/row">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="w-1.5 h-8 bg-gradient-to-b from-primary-500 to-primary-800 rounded-full shadow-[0_0_15px_rgba(229,9,20,0.5)]"></span>
          {title}
        </h2>
        <button className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider flex items-center gap-2 group/btn">
          Explore <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      <div className="relative">
        {/* Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0f0f0f] to-transparent z-10 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-500" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0f0f0f] to-transparent z-10 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-500" />

        <div className="flex gap-5 overflow-x-auto pb-8 hide-scrollbar scroll-pl-6 px-2">
          {data?.slice(0, 20).map((content: any, idx: number) => (
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
    </div>
  );
};

export default function HomePage() {
  // Theme customized directly in this file for N-Movie look
  const navigate = useNavigate();

  const {
    data: trendingMovies,
    isLoading: loadingTrending,
    error: errorTrending,
    refetch: refetchTrending,
  } = useTrendingContent('movie');

  const {
    data: popularTV,
    isLoading: loadingPopular,
    error: errorPopular,
    refetch: refetchPopular,
  } = usePopularContent('tv');

  const hero = trendingMovies && trendingMovies.length > 0 ? trendingMovies[0] : null;

  const handleHeroPlay = () => {
    if (!hero) return;
    navigate(`/metadata/${hero.type}/${hero.id}`);
  };

  const handleHeroMoreInfo = () => {
    if (!hero) return;
    navigate(`/metadata/${hero.type}/${hero.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20 overflow-x-hidden">
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
          <div className="absolute inset-0 bg-[#0f0f0f]" />
        )}

        {/* Hero content */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 space-y-8 max-w-4xl pt-24">
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center space-x-3 mb-2">
              <div className="px-3 py-1 bg-primary-600/90 backdrop-blur-md rounded-md text-white text-xs font-bold tracking-wider uppercase shadow-lg shadow-primary-900/40">
                N-Movie Exclusive
              </div>
              <span className="text-gray-300 text-sm font-medium tracking-wide uppercase px-2 border-l border-gray-600">
                Series
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl leading-[0.9] tracking-tight">
              {hero?.name ?? 'Loading...'}
            </h1>

            {/* Meta info row */}
            {hero && (
              <div className="flex items-center space-x-6 text-gray-200 text-base font-medium">
                <div className="flex items-center space-x-2 text-green-400">
                  <span className="font-bold">98% Match</span>
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
              Watch Now
            </button>

            <button
              onClick={handleHeroMoreInfo}
              className="flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 text-white font-semibold text-lg hover:bg-white/20 transition-all border border-white/10 backdrop-blur-xl"
            >
              <span className="mr-3">ℹ️</span>
              Details
            </button>
          </div>
        </div>
      </section>

      {/* ROWS */}
      <section className="space-y-16 px-6 md:px-16 -mt-32 relative z-10">
        {/* Trending Movies Row */}
        <div className="space-y-6 relative group/row">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-b from-primary-500 to-primary-800 rounded-full shadow-[0_0_15px_rgba(229,9,20,0.5)]"></span>
              Trending Movies
            </h2>
            <button className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider flex items-center gap-2 group/btn">
              Explore <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {loadingTrending ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : errorTrending ? (
            <ErrorMessage
              message="Failed to load trending movies"
              onRetry={() => refetchTrending()}
            />
          ) : (
            <div className="relative">
              {/* Left Gradient Mask */}
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0f0f0f] to-transparent z-10 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-500" />

              {/* Right Gradient Mask */}
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0f0f0f] to-transparent z-10 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-500" />

              <div className="flex gap-5 overflow-x-auto pb-8 hide-scrollbar scroll-pl-6 px-2">
                {trendingMovies?.slice(0, 20).map((content, idx) => (
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

        {/* Popular TV Shows Row */}
        <div className="space-y-6 relative group/row">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-b from-primary-500 to-primary-800 rounded-full shadow-[0_0_15px_rgba(229,9,20,0.5)]"></span>
              Popular TV Shows
            </h2>
            <button className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider flex items-center gap-2 group/btn">
              Explore <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {loadingPopular ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : errorPopular ? (
            <ErrorMessage
              message="Failed to load popular TV shows"
              onRetry={() => refetchPopular()}
            />
          ) : (
            <div className="relative">
              {/* Left Gradient Mask */}
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0f0f0f] to-transparent z-10 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-500" />

              {/* Right Gradient Mask */}
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0f0f0f] to-transparent z-10 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-500" />

              <div className="flex gap-5 overflow-x-auto pb-8 hide-scrollbar scroll-pl-6 px-2">
                {popularTV?.slice(0, 20).map((content, idx) => (
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

        {/* Indonesian Movies Row */}
        <CategoryRow title="Trending in Indonesia" fetcher={useIndonesianContent} mediaType="movie" />

        {/* Indonesian Series Row */}
        <CategoryRow title="Indonesian Series" fetcher={useIndonesianContent} mediaType="tv" />

        {/* Action Movies Row */}
        <CategoryRow title="Action Hits" fetcher={(type: 'movie' | 'tv') => useGenreContent(type, '28')} mediaType="movie" />
      </section>
    </div>
  );
}
