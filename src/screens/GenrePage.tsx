import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdbService } from '../services/tmdbService';

type Genre = { id: number; name: string };

export default function GenrePage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const list = await tmdbService.getGenres();
      // Fallback to a common set if API unavailable
      if (list.length === 0) {
        setGenres([
          { id: 28, name: 'Action' },
          { id: 35, name: 'Comedy' },
          { id: 18, name: 'Drama' },
          { id: 27, name: 'Horror' },
          { id: 878, name: 'Sci-Fi' },
          { id: 10749, name: 'Romance' },
          { id: 53, name: 'Thriller' },
          { id: 16, name: 'Animation' },
          { id: 99, name: 'Documentary' },
          { id: 14, name: 'Fantasy' },
          { id: 9648, name: 'Mystery' },
          { id: 12, name: 'Adventure' },
        ]);
      } else {
        setGenres(list);
      }
    };
    load();
  }, []);

  const openGenre = (g: Genre) => {
    // Use query parameter as a simple filter on search page
    navigate(`/search?genre=${g.id}`);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {genres.map((g) => (
        <button key={g.id} onClick={() => openGenre(g)} className="h-40 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center hover:shadow-lg hover:scale-105 transition-transform">
          <span className="text-xl font-semibold">{g.name}</span>
        </button>
      ))}
    </div>
  );
}
