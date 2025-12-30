/**
 * Embedsu Scraper
 * 
 * Embedsu (embed.su) is a streaming embed provider
 * Supports TMDB IDs for movies and TV shows
 */

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        const streams = [];

        // Base URL for Embedsu
        const baseUrl = 'https://embed.su';

        // Build embed URL based on media type
        let embedUrl;
        if (mediaType === 'movie') {
            // Movie format: https://embed.su/embed/movie/{tmdb_id}
            embedUrl = `${baseUrl}/embed/movie/${tmdbId}`;
        } else if (mediaType === 'tv' && season && episode) {
            // TV format: https://embed.su/embed/tv/{tmdb_id}/{season}/{episode}
            embedUrl = `${baseUrl}/embed/tv/${tmdbId}/${season}/${episode}`;
        } else {
            return [];
        }

        // Create stream object
        const stream = {
            url: embedUrl,
            title: 'Embedsu - HD',
            name: 'Embedsu HD',
            quality: 'HD',
            type: 'embed',
            provider: 'embedsu',
            providerName: 'Embedsu',
            description: 'Watch on Embedsu - Fast streaming',
            headers: {
                'Referer': 'https://embed.su/',
                'Origin': 'https://embed.su'
            }
        };

        streams.push(stream);

        console.log(`[Embedsu] Generated ${streams.length} streams for ${mediaType}:${tmdbId}`);
        return streams;

    } catch (error) {
        console.error('[Embedsu] Error generating streams:', error.message);
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
