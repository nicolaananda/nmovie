import { StreamingContent } from './metadata';

export interface StreamingAddon {
  id: string;
  name: string;
  version: string;
  description: string;
  types: string[];
  catalogs: {
    type: string;
    id: string;
    name: string;
    extraSupported?: string[];
    extra?: Array<{ name: string; options?: string[] }>;
  }[];
  resources: {
    name: string;
    types: string[];
    idPrefixes?: string[];
  }[];
  url?: string;
  originalUrl?: string;
  transportUrl?: string;
  transportName?: string;
}

export interface CatalogContent {
  addon: string;
  type: string;
  id: string;
  name: string;
  genre?: string;
  items: StreamingContent[];
}

export interface AddonSearchResults {
  addonId: string;
  addonName: string;
  results: StreamingContent[];
}

export interface GroupedSearchResults {
  byAddon: AddonSearchResults[];
  allResults: StreamingContent[];
}

export enum DataSource {
  STREMIO_ADDONS = 'stremio_addons',
  TMDB = 'tmdb',
}

