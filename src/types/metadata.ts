// Types for route params
export type RouteParams = {
  id: string;
  type: string;
  episodeId?: string;
};

// Stream related types - aligned with Stremio protocol
export interface Subtitle {
  id: string;
  url: string;
  lang: string;
  fps?: number;
  addon?: string;
  addonName?: string;
  format?: 'srt' | 'vtt' | 'ass' | 'ssa';
}

export interface Stream {
  // Primary stream source
  url?: string;
  ytId?: string;
  infoHash?: string;
  externalUrl?: string;

  // Display information
  name?: string;
  title?: string;
  description?: string;

  // Provider info
  provider?: string;
  providerName?: string;

  // Addon identification
  addon?: string;
  addonId?: string;
  addonName?: string;

  // Stream properties
  size?: number;
  isFree?: boolean;
  isDebrid?: boolean;
  quality?: string;
  type?: string;
  lang?: string;
  fileIdx?: number;

  headers?: {
    Referer?: string;
    'User-Agent'?: string;
    Origin?: string;
    [key: string]: string | undefined;
  };

  files?: {
    file: string;
    type: string;
    quality: string;
    lang: string;
  }[];

  subtitles?: Subtitle[];
  sources?: string[];

  behaviorHints?: {
    bingeGroup?: string;
    notWebReady?: boolean;
    countryWhitelist?: string[];
    cached?: boolean;
    proxyHeaders?: {
      request?: Record<string, string>;
      response?: Record<string, string>;
    };
    videoHash?: string;
    videoSize?: number;
    filename?: string;
    [key: string]: any;
  };
}

export interface GroupedStreams {
  [addonId: string]: {
    addonName: string;
    streams: Stream[];
  };
}

// Episode related types
export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  air_date: string;
  runtime?: number;
  vote_average?: number;
  stremioId?: string;
  episodeString: string;
}

export interface GroupedEpisodes {
  [seasonNumber: number]: Episode[];
}

// Cast related types
export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  biography?: string;
  birthday?: string;
  place_of_birth?: string;
  known_for_department?: string;
}

// Streaming content type
export interface StreamingContent {
  id: string;
  type: string;
  name: string;
  tmdbId?: number;
  poster: string;
  posterShape?: 'poster' | 'square' | 'landscape';
  banner?: string;
  logo?: string;
  imdbRating?: string;
  year?: number;
  genres?: string[];
  description?: string;
  runtime?: string;
  released?: string;
  trailerStreams?: any[];
  videos?: any[];
  inLibrary?: boolean;
  directors?: string[];
  creators?: string[];
  certification?: string;
  country?: string;
  writer?: string[];
  links?: Array<{
    name: string;
    category: string;
    url: string;
  }>;
  behaviorHints?: {
    defaultVideoId?: string;
    hasScheduledVideos?: boolean;
    [key: string]: any;
  };
  imdb_id?: string;
  slug?: string;
  releaseInfo?: string;
  traktSource?: 'watchlist' | 'continue-watching' | 'watched';
  addonCast?: Cast[];
  networks?: Array<{
    id: number | string;
    name: string;
    logo?: string;
  }>;
  addedToLibraryAt?: number;
}

