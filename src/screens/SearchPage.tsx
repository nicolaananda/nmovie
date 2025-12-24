import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useSearchContent } from '../hooks/useContent';
import ContentCard from '../components/ContentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const { data: results, isLoading: loading, error, refetch: handleSearch } = useSearchContent(debouncedQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 px-6 md:px-16 pb-20 overflow-x-hidden">

      {/* Search Header */}
      <div className="max-w-7xl mx-auto mb-12 animate-fade-in">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-8 w-8 text-gray-500 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-20 pr-6 py-6 border-b-2 border-gray-800 bg-transparent text-4xl md:text-6xl font-black text-white placeholder-gray-700 focus:border-primary-600 focus:outline-none focus:ring-0 transition-all caret-primary-500"
            placeholder="Search titles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      <div className="max-w-8xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <ErrorMessage
            message="An error occurred while searching."
            onRetry={() => handleSearch()}
          />
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
            ) : query.length > 2 && !loading ? (
              <div className="text-center py-20 text-gray-500 text-xl font-light">
                No results found for "{query}".
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-gray-800 space-y-4">
                <Search size={64} className="opacity-20" />
                <p className="text-2xl font-black opacity-20 uppercase tracking-widest">Start Typing</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
