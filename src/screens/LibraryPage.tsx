import { useCatalog } from '../contexts/CatalogContext';
import ContentCard from '../components/ContentCard';
import { AlertCircle, Film, Tv } from 'lucide-react';
import { useState } from 'react';

export default function LibraryPage() {
  const { library } = useCatalog();
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv'>('all');

  const filteredLibrary = library.filter(
    (item) => activeTab === 'all' || item.type === (activeTab === 'tv' ? 'series' : 'movie')
  );

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-28 px-6 md:px-16 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">My Library</h1>
          <p className="text-gray-400">Your curated list of favorites.</p>
        </div>

        {/* TABS */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm self-start md:self-auto">
          {[
            { id: 'all', label: 'All', icon: null },
            { id: 'movie', label: 'Movies', icon: Film },
            { id: 'tv', label: 'Series', icon: Tv },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {Icon && <Icon size={16} />}
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {filteredLibrary.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-slide-up">
          {filteredLibrary.map((item) => (
            <div key={item.id} className="transition-transform duration-300 hover:-translate-y-2">
              <ContentCard content={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500 space-y-6">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
            <AlertCircle size={40} className="opacity-50" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-300 mb-1">It's empty here</h2>
            <p className="max-w-xs mx-auto">
              Start adding movies and shows to your library to track what you want to watch.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
