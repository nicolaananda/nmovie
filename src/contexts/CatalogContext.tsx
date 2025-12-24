import { createContext, useState, useContext, ReactNode } from 'react';
import { StreamingContent } from '../types/metadata';
import { StreamingAddon } from '../types/catalog';

interface CatalogContextProps {
  addons: StreamingAddon[];
  setAddons: (addons: StreamingAddon[]) => void;
  library: StreamingContent[];
  addToLibrary: (content: StreamingContent) => void;
  removeFromLibrary: (contentId: string) => void;
  isInLibrary: (contentId: string) => boolean;
}

const CatalogContext = createContext<CatalogContextProps | undefined>(undefined);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [addons, setAddons] = useState<StreamingAddon[]>([]);
  const [library, setLibrary] = useState<StreamingContent[]>([]);

  const addToLibrary = (content: StreamingContent) => {
    setLibrary((prev) => {
      if (prev.find((item) => item.id === content.id)) {
        return prev;
      }
      return [...prev, { ...content, addedToLibraryAt: Date.now() }];
    });
  };

  const removeFromLibrary = (contentId: string) => {
    setLibrary((prev) => prev.filter((item) => item.id !== contentId));
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

