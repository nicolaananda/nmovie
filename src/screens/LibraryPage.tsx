import { useCatalog, type LibraryCategory } from '../contexts/CatalogContext';
import ContentCard from '../components/ContentCard';
import { AlertCircle, Film, Tv, Bookmark, Heart, CheckCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useT } from '../i18n/I18nContext';

import EmptyState from '../components/EmptyState';
import { Library } from 'lucide-react';
import ContentCardSkeleton from '../components/ContentCardSkeleton';

type CategoryTab = 'all' | LibraryCategory;
type TypeTab = 'all' | 'movie' | 'tv';

export default function LibraryPage() {
  const { library, isLoading } = useCatalog();
  const t = useT();
  const [categoryTab, setCategoryTab] = useState<CategoryTab>('all');
  const [typeTab, setTypeTab] = useState<TypeTab>('all');

  const counts = useMemo(() => {
    const c = { all: library.length, WATCHLIST: 0, FAVORITE: 0, WATCHED: 0 };
    for (const item of library) c[item.category]++;
    return c;
  }, [library]);

  const filtered = library.filter((item) => {
    if (categoryTab !== 'all' && item.category !== categoryTab) return false;
    if (typeTab === 'movie' && item.type !== 'movie') return false;
    if (typeTab === 'tv' && item.type !== 'series') return false;
    return true;
  });

  const categoryTabs: Array<{ id: CategoryTab; label: string; icon: typeof Library; count: number }> = [
    { id: 'all', label: t('library.allItems'), icon: Library, count: counts.all },
    { id: 'WATCHLIST', label: t('library.watchlist'), icon: Bookmark, count: counts.WATCHLIST },
    { id: 'FAVORITE', label: t('library.favorites'), icon: Heart, count: counts.FAVORITE },
    { id: 'WATCHED', label: t('library.watched'), icon: CheckCircle2, count: counts.WATCHED },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-28 px-6 md:px-16 pb-20">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{t('library.title')}</h1>
        <p className="text-gray-400">{t('library.emptyDesc')}</p>
      </div>

      {/* Category tabs (Watchlist / Favorites / Watched) */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
        {categoryTabs.map((tab) => {
          const Icon = tab.icon;
          const active = categoryTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                active
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <Icon size={14} />
              {tab.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                active ? 'bg-white/20' : 'bg-black/30 text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Type sub-tabs (movies / series / all) */}
      <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm self-start mb-8 inline-flex">
        {[
          { id: 'all' as TypeTab, label: t('search.allTypes'), icon: null },
          { id: 'movie' as TypeTab, label: t('search.movies'), icon: Film },
          { id: 'tv' as TypeTab, label: t('search.series'), icon: Tv },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setTypeTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                typeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {Icon && <Icon size={14} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-slide-up">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="w-full"><ContentCardSkeleton /></div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-slide-up">
          {filtered.map((item) => (
            <div key={item.id} className="transition-transform duration-300 hover:-translate-y-2">
              <ContentCard content={item} />
            </div>
          ))}
        </div>
      ) : library.length === 0 ? (
        <EmptyState
          icon={Library}
          title={t('library.empty')}
          description={t('library.emptyDesc')}
          actionLabel={t('common.search')}
          actionTo="/search"
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500 space-y-6">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
            <AlertCircle size={40} className="opacity-50" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-300 mb-1">No items in this view</h2>
            <p className="max-w-xs mx-auto">Try a different category or add titles from the metadata page.</p>
          </div>
        </div>
      )}
    </div>
  );
}
