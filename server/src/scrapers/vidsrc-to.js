/**
 * Vidsrc.to Scraper
 * 
 * Vidsrc.to is a popular embed-based streaming provider
 * Supports TMDB IDs for movies and TV shows
 */

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        const streams = [];

        // Base URL for Vidsrc.to embeds
        const baseUrl = 'https://vidsrc.to';

        // Build embed URL based on media type
        let embedUrl;
        if (mediaType === 'movie') {
            // Movie format: https://vidsrc.to/embed/movie/{tmdb_id}
            embedUrl = `${baseUrl}/embed/movie/${tmdbId}`;
        } else if (mediaType === 'tv' && season && episode) {
            // TV format: https://vidsrc.to/embed/tv/{tmdb_id}/{season}/{episode}
            embedUrl = `${baseUrl}/embed/tv/${tmdbId}/${season}/${episode}`;
        } else {
            return [];
        }

        // Create stream object
        const stream = {
            url: embedUrl,
            title: 'Vidsrc.to - HD',
            name: 'Vidsrc.to HD',
            quality: 'HD',
            type: 'embed',
            provider: 'vidsrc-to',
            providerName: 'Vidsrc.to',
            description: 'Watch on Vidsrc.to - High quality streaming',
            headers: {
                'Referer': 'https://vidsrc.to/',
                'Origin': 'https://vidsrc.to'
            }
        };

        streams.push(stream);

        console.log(`[Vidsrc.to] Generated ${streams.length} streams for ${mediaType}:${tmdbId}`);
        return streams;

    } catch (error) {
        console.error('[Vidsrc.to] Error generating streams:', error.message);
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
