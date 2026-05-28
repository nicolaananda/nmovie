import { useState, useEffect, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSearchContent } from '../hooks/useContent';
import { tmdbService } from '../services/tmdbService';
import ContentCard from '../components/ContentCard';
import ContentCardSkeleton from '../components/ContentCardSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import BottomSheet from '../components/BottomSheet';
import { useT } from '../i18n/I18nContext';
import type { StreamingContent } from '../types/metadata';

type ContentType = 'all' | 'movie' | 'tv';
type SortKey = 'popularity.desc' | 'vote_average.desc' | 'release_date.desc' | 'first_air_date.desc';

interface Filters {
  type: ContentType;
  year: string; // empty = all
  genreId: string; // empty = all
  language: string; // empty = all
  sort: SortKey;
}

const DEFAULT_FILTERS: Filters = {
  type: 'all',
  year: '',
  genreId: '',
  language: '',
  sort: 'popularity.desc',
};

const LANGUAGES = [
  { code: 'id', label: 'Indonesian' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
];

// TMDB has separate genre lists for movie/tv but the IDs that overlap are fine.
// We use the combined movie list here; users picking a TV-only genre is rare
// and the API silently ignores unknown IDs.
const COMMON_GENRES = [
  { id: '28', label: 'Action' },
  { id: '12', label: 'Adventure' },
  { id: '16', label: 'Animation' },
  { id: '35', label: 'Comedy' },
  { id: '80', label: 'Crime' },
  { id: '99', label: 'Documentary' },
  { id: '18', label: 'Drama' },
  { id: '10751', label: 'Family' },
  { id: '14', label: 'Fantasy' },
  { id: '36', label: 'History' },
  { id: '27', label: 'Horror' },
  { id: '10402', label: 'Music' },
  { id: '9648', label: 'Mystery' },
  { id: '10749', label: 'Romance' },
  { id: '878', label: 'Sci-Fi' },
  { id: '53', label: 'Thriller' },
  { id: '10752', label: 'War' },
  { id: '37', label: 'Western' },
];

function buildYears(): string[] {
  const now = new Date().getFullYear();
  const years: string[] = [];
  for (let y = now; y >= 1970; y--) years.push(String(y));
  return years;
}

const YEARS = buildYears();

const filtersAreActive = (f: Filters): boolean =>
  f.type !== 'all' || !!f.year || !!f.genreId || !!f.language || f.sort !== 'popularity.desc';

export default function SearchPage() {
  const t = useT();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const hasFilters = useMemo(() => filtersAreActive(filters), [filters]);
  const hasQuery = debouncedQuery.trim().length > 0;

  // Two modes:
  //  1. User typed a query -> /search/multi (TMDB doesn't support filters here,
  //     so we filter client-side post-fetch).
  //  2. No query, but filters set -> TMDB /discover with the filter params.
  //     We run two parallel discover calls when type=all so we can mix
  //     movies and series in one result set.
  const search = useSearchContent(debouncedQuery);

  const discoverMovies = useQuery<StreamingContent[]>({
    queryKey: ['discover', 'movie', filters],
    queryFn: () => {
      const params: Record<string, string | number> = {
        sort_by: filters.sort.replace('first_air_date', 'release_date'),
        include_adult: 'false',
      };
      if (filters.year) params['primary_release_year'] = filters.year;
      if (filters.genreId) params['with_genres'] = filters.genreId;
      if (filters.language) params['with_original_language'] = filters.language;
      return tmdbService.discover('movie', params);
    },
    enabled: !hasQuery && hasFilters && (filters.type === 'all' || filters.type === 'movie'),
  });

  const discoverSeries = useQuery<StreamingContent[]>({
    queryKey: ['discover', 'tv', filters],
    queryFn: () => {
      const params: Record<string, string | number> = {
        sort_by: filters.sort.replace('release_date', 'first_air_date'),
        include_adult: 'false',
      };
      if (filters.year) params['first_air_date_year'] = filters.year;
      if (filters.genreId) params['with_genres'] = filters.genreId;
      if (filters.language) params['with_original_language'] = filters.language;
      return tmdbService.discover('tv', params);
    },
    enabled: !hasQuery && hasFilters && (filters.type === 'all' || filters.type === 'tv'),
  });

  // Build the displayed result set from whichever mode is active.
  const results: StreamingContent[] | undefined = useMemo(() => {
    if (hasQuery) {
      let list = search.data ?? [];
      if (filters.type === 'movie') list = list.filter((c) => c.type === 'movie');
      if (filters.type === 'tv') list = list.filter((c) => c.type === 'series');
      if (filters.year) {
        list = list.filter((c) => c.year && String(c.year) === filters.year);
      }
      // Other filters (genre, language) aren't reliably present on /search/multi
      // results, so we skip them in query mode rather than dropping items.
      return list;
    }
    if (!hasFilters) return undefined;
    const movies = filters.type !== 'tv' ? (discoverMovies.data ?? []) : [];
    const series = filters.type !== 'movie' ? (discoverSeries.data ?? []) : [];
    // Interleave so the user sees a mix instead of all movies, then all series.
    const merged: StreamingContent[] = [];
    const max = Math.max(movies.length, series.length);
    for (let i = 0; i < max; i++) {
      if (movies[i]) merged.push(movies[i]);
      if (series[i]) merged.push(series[i]);
    }
    return merged;
  }, [hasQuery, hasFilters, search.data, discoverMovies.data, discoverSeries.data, filters]);

  const isLoading = hasQuery ? search.isLoading : (discoverMovies.isLoading || discoverSeries.isLoading);
  const error = hasQuery ? search.error : (discoverMovies.error || discoverSeries.error);

  const retry = () => {
    if (hasQuery) search.refetch();
    else {
      discoverMovies.refetch();
      discoverSeries.refetch();
    }
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 px-6 md:px-16 pb-20 overflow-x-hidden">
      {/* Search Header */}
      <div className="max-w-7xl mx-auto mb-6 animate-fade-in">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-8 w-8 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-20 pr-6 py-6 border-b-2 border-gray-800 bg-transparent text-4xl md:text-6xl font-black text-white placeholder-gray-700 focus:border-primary-600 focus:outline-none focus:ring-0 transition-all caret-primary-500"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            aria-label={t('search.title')}
          />
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
              showFilters || hasFilters
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal size={16} />
            {t('search.filters')}
            {hasFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-white/20">
                {[
                  filters.type !== 'all' ? 1 : 0,
                  filters.year ? 1 : 0,
                  filters.genreId ? 1 : 0,
                  filters.language ? 1 : 0,
                  filters.sort !== 'popularity.desc' ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-full text-sm text-gray-400 hover:text-white hover:bg-white/5"
            >
              <X size={14} /> {t('search.clearFilters')}
            </button>
          )}
        </div>

        {/* Desktop: inline grid. Mobile: bottom sheet (rendered below). */}
        {showFilters && (
          <div className="hidden md:grid mt-4 grid-cols-5 gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <FiltersBody
              t={t}
              filters={filters}
              updateFilter={updateFilter}
            />
          </div>
        )}
      </div>

      {/* Mobile filters: bottom sheet variant */}
      <div className="md:hidden">
        <BottomSheet
          open={showFilters}
          onClose={() => setShowFilters(false)}
          title={t('search.filters')}
        >
          <div className="grid grid-cols-1 gap-3 mb-4">
            <FiltersBody
              t={t}
              filters={filters}
              updateFilter={updateFilter}
            />
          </div>
          <div className="flex gap-2 sticky bottom-0 bg-[#1a1a1a] pt-3 pb-2 -mx-5 px-5 border-t border-white/10">
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-300 border border-white/10 hover:bg-white/5"
              >
                {t('search.clearFilters')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white"
            >
              {t('search.applyFilters')}
            </button>
          </div>
        </BottomSheet>
      </div>

      {/* Results */}
      <div className="max-w-8xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, idx) => (
              <ContentCardSkeleton key={idx} />
            ))}
          </div>
        ) : error ? (
          <ErrorMessage message={t('error.failedToLoad')} onRetry={retry} />
        ) : (
          <>
            {results && results.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-slide-up">
                {results.map((item) => (
                  <div key={item.id} className="transition-transform duration-300 hover:-translate-y-2">
                    <ContentCard content={item} />
                  </div>
                ))}
              </div>
            ) : hasQuery || hasFilters ? (
              <EmptyState
                icon={Search}
                title={t('search.noResults')}
                description={t('search.startTyping')}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-gray-800 space-y-4">
                <Search size={64} className="opacity-20" />
                <p className="text-2xl font-black opacity-20 uppercase tracking-widest">
                  {t('search.startTyping')}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="block text-xs">
      <span className="block text-gray-400 mb-1 uppercase tracking-wider font-semibold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

interface FiltersBodyProps {
  t: (key: string, vars?: Record<string, string | number>) => string;
  filters: Filters;
  updateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
}

function FiltersBody({ t, filters, updateFilter }: FiltersBodyProps) {
  return (
    <>
      <FilterSelect
        label={t('search.type')}
        value={filters.type}
        onChange={(v) => updateFilter('type', v as ContentType)}
        options={[
          { value: 'all', label: t('search.allTypes') },
          { value: 'movie', label: t('search.movies') },
          { value: 'tv', label: t('search.series') },
        ]}
      />
      <FilterSelect
        label={t('search.year')}
        value={filters.year}
        onChange={(v) => updateFilter('year', v)}
        options={[
          { value: '', label: t('search.allYears') },
          ...YEARS.map((y) => ({ value: y, label: y })),
        ]}
      />
      <FilterSelect
        label={t('search.genre')}
        value={filters.genreId}
        onChange={(v) => updateFilter('genreId', v)}
        options={[
          { value: '', label: t('search.allGenres') },
          ...COMMON_GENRES.map((g) => ({ value: g.id, label: g.label })),
        ]}
      />
      <FilterSelect
        label={t('search.language')}
        value={filters.language}
        onChange={(v) => updateFilter('language', v)}
        options={[
          { value: '', label: t('search.allLanguages') },
          ...LANGUAGES.map((l) => ({ value: l.code, label: l.label })),
        ]}
      />
      <FilterSelect
        label={t('search.sort')}
        value={filters.sort}
        onChange={(v) => updateFilter('sort', v as SortKey)}
        options={[
          { value: 'popularity.desc', label: t('search.sortPopularity') },
          { value: 'vote_average.desc', label: t('search.sortRating') },
          { value: 'release_date.desc', label: t('search.sortNewest') },
        ]}
      />
    </>
  );
}
