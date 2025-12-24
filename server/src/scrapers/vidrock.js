/**
 * Vidrock Scraper
 * 
 * Vidrock is an embed-based streaming provider that supports TMDB/IMDB IDs
 * API Documentation: https://vidrock.net
 * 
 * Features:
 * - Direct TMDB/IMDB ID support
 * - Movies and TV shows
 * - Multiple quality options
 * - Auto-next episode support
 * - Customizable player
 */

async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    const streams = [];
    
    // Base URL for Vidrock embeds
    const baseUrl = 'https://vidrock.net';
    
    // Build embed URL based on media type
    let embedUrl;
    if (mediaType === 'movie') {
      // Movie format: https://vidrock.net/movie/{tmdb_id}
      embedUrl = `${baseUrl}/movie/${tmdbId}`;
    } else if (mediaType === 'tv' && season && episode) {
      // TV format: https://vidrock.net/tv/{tmdb_id}/{season}/{episode}
      embedUrl = `${baseUrl}/tv/${tmdbId}/${season}/${episode}`;
    } else {
      return [];
    }
    
    // Add customization parameters for better UX
    const params = new URLSearchParams({
      autoplay: 'false',
      theme: 'FF6B6B', // Nice red theme
      download: 'true',
      nextbutton: 'true',
      episodeselector: 'true',
      lang: 'id', // Indonesian subtitles by default
    });
    
    const finalUrl = `${embedUrl}?${params.toString()}`;
    
    // Create stream object
    const stream = {
      url: finalUrl,
      title: 'Vidrock - HD',
      name: 'Vidrock HD',
      quality: 'HD',
      type: 'embed',
      provider: 'vidrock',
      providerName: 'Vidrock',
      description: `Watch on Vidrock - High quality streaming with auto-next support`,
      headers: {
        'Referer': 'https://vidrock.net/',
        'Origin': 'https://vidrock.net'
      }
    };
    
    streams.push(stream);
    
    // Add additional quality options (if available)
    // Vidrock auto-selects quality based on user connection
    streams.push({
      ...stream,
      title: 'Vidrock - Auto Quality',
      name: 'Vidrock Auto',
      quality: 'AUTO',
      description: 'Auto quality selection based on your connection speed'
    });
    
    console.log(`[Vidrock] Generated ${streams.length} streams for ${mediaType}:${tmdbId}`);
    return streams;
    
  } catch (error) {
    console.error('[Vidrock] Error generating streams:', error.message);
    return [];
  }
}

// Export for CommonJS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams };
}

// Export for VM2 sandbox
if (typeof global !== 'undefined') {
  global.getStreams = getStreams;
}

