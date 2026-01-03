import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { StreamingContent } from '../types/metadata';
import { StreamingAddon } from '../types/catalog';

interface CatalogContextProps {
  addons: StreamingAddon[];
  setAddons: (addons: StreamingAddon[]) => void;
  library: StreamingContent[];
  addToLibrary: (content: StreamingContent) => Promise<void>;
  removeFromLibrary: (contentId: string) => Promise<void>;
  isInLibrary: (contentId: string) => boolean;
  isLoading: boolean;
}

const CatalogContext = createContext<CatalogContextProps | undefined>(undefined);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [addons, setAddons] = useState<StreamingAddon[]>([]);
  const [library, setLibrary] = useState<StreamingContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch library on mount or user change
  useEffect(() => {
    if (user) {
      fetchLibrary();
    } else {
      setLibrary([]);
    }
  }, [user]);

  const fetchLibrary = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/library`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Transform backend items to StreamingContent if necessary, 
      // but backend should return format compatible enough or we map it.
      // Backend returns LibraryItem model. We need to map it back to StreamingContent-like structure.
      const mappedLibrary = response.data.map((item: any) => ({
        id: item.tmdbId,
        type: item.type,
        name: item.name,
        poster: item.poster,
        // Add other fields if needed, but these are crucial for display
      }));

      setLibrary(mappedLibrary);
    } catch (error) {
      console.error('Failed to fetch library:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToLibrary = async (content: StreamingContent) => {
    if (!user) {
      alert('Please login to add to library');
      return;
    }

    // Optimistic update
    const newItem = { ...content, addedToLibraryAt: Date.now() };
    setLibrary(prev => [...prev, newItem]);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/library`, {
        tmdbId: content.id,
        type: content.type,
        name: content.name,
        poster: content.poster
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to add to library:', error);
      // Revert on error
      setLibrary(prev => prev.filter(item => item.id !== content.id));
      alert('Failed to save to library');
    }
  };

  const removeFromLibrary = async (contentId: string) => {
    if (!user) return;

    // Optimistic update
    const previousLibrary = [...library];
    setLibrary(prev => prev.filter(item => item.id !== contentId));

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/library/${contentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to remove from library:', error);
      // Revert
      setLibrary(previousLibrary);
      alert('Failed to remove from library');
    }
  };

  const isInLibrary = (contentId: string) => {
    return library.some((item) => item.id === contentId);
  };

  return (
    <CatalogContext.Provider
      value={{
        addons,
        setAddons,
        library,
        addToLibrary,
        removeFromLibrary,
        isInLibrary,
        isLoading,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}

