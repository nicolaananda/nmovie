import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { StreamingContent } from '../types/metadata';
import { StreamingAddon } from '../types/catalog';

export type LibraryCategory = 'WATCHLIST' | 'FAVORITE' | 'WATCHED';

export interface LibraryEntry extends StreamingContent {
  category: LibraryCategory;
}

interface CatalogContextProps {
  addons: StreamingAddon[];
  setAddons: (addons: StreamingAddon[]) => void;
  library: LibraryEntry[];
  addToLibrary: (content: StreamingContent, category?: LibraryCategory) => Promise<void>;
  setItemCategory: (contentId: string, category: LibraryCategory) => Promise<void>;
  removeFromLibrary: (contentId: string) => Promise<void>;
  isInLibrary: (contentId: string) => boolean;
  getItemCategory: (contentId: string) => LibraryCategory | null;
  isLoading: boolean;
}

const CatalogContext = createContext<CatalogContextProps | undefined>(undefined);

interface RawLibraryItem {
  tmdbId: string;
  type: string;
  name: string;
  poster?: string;
  category?: LibraryCategory;
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [addons, setAddons] = useState<StreamingAddon[]>([]);
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
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

      const response = await apiClient.get('/library');

      // Map backend LibraryItem rows to the StreamingContent shape the UI expects.
      const mappedLibrary: LibraryEntry[] = response.data.map((item: RawLibraryItem) => ({
        id: item.tmdbId,
        type: item.type,
        name: item.name,
        poster: item.poster,
        category: item.category ?? 'WATCHLIST',
      }));

      setLibrary(mappedLibrary);
    } catch (error) {
      console.error('Failed to fetch library:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToLibrary = async (content: StreamingContent, category: LibraryCategory = 'WATCHLIST') => {
    if (!user) {
      toast.warning('Please login to add to library');
      return;
    }

    // Optimistic update — replace existing entry for the same id (so a
    // re-add with a new category moves the item between buckets).
    const optimistic: LibraryEntry = {
      ...content,
      category,
    } as LibraryEntry;
    setLibrary((prev) => {
      const without = prev.filter((item) => item.id !== content.id);
      return [...without, optimistic];
    });

    try {
      await apiClient.post('/library', {
        tmdbId: content.id,
        type: content.type,
        name: content.name,
        poster: content.poster,
        category,
      });
    } catch (error) {
      console.error('Failed to add to library:', error);
      setLibrary((prev) => prev.filter((item) => item.id !== content.id));
      toast.error('Failed to save to library');
    }
  };

  const setItemCategory = async (contentId: string, category: LibraryCategory) => {
    if (!user) return;
    const previous = library;
    setLibrary((prev) =>
      prev.map((item) => (item.id === contentId ? { ...item, category } : item)),
    );
    try {
      await apiClient.put(`/library/${contentId}`, { category });
    } catch (error) {
      console.error('Failed to update library category:', error);
      setLibrary(previous);
      toast.error('Failed to update library');
    }
  };

  const removeFromLibrary = async (contentId: string) => {
    if (!user) return;

    const previousLibrary = [...library];
    setLibrary((prev) => prev.filter((item) => item.id !== contentId));

    try {
      await apiClient.delete(`/library/${contentId}`);
    } catch (error) {
      console.error('Failed to remove from library:', error);
      setLibrary(previousLibrary);
      toast.error('Failed to remove from library');
    }
  };

  const isInLibrary = (contentId: string) => library.some((item) => item.id === contentId);

  const getItemCategory = (contentId: string): LibraryCategory | null => {
    const found = library.find((item) => item.id === contentId);
    return found?.category ?? null;
  };

  return (
    <CatalogContext.Provider
      value={{
        addons,
        setAddons,
        library,
        addToLibrary,
        setItemCategory,
        removeFromLibrary,
        isInLibrary,
        getItemCategory,
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
