/**
 * 2Embed Scraper
 * 
 * 2Embed is a popular embed-based streaming provider
 * Supports TMDB IDs for movies and TV shows
 */

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        const streams = [];

        // Base URL for 2Embed
        const baseUrl = 'https://www.2embed.cc';

        // Build embed URL based on media type
        let embedUrl;
        if (mediaType === 'movie') {
            // Movie format: https://www.2embed.cc/embed/{tmdb_id}
            embedUrl = `${baseUrl}/embed/${tmdbId}`;
        } else if (mediaType === 'tv' && season && episode) {
            // TV format: https://www.2embed.cc/embedtv/{tmdb_id}&s={season}&e={episode}
            embedUrl = `${baseUrl}/embedtv/${tmdbId}&s=${season}&e=${episode}`;
        } else {
            return [];
        }

        // Create stream object
        const stream = {
            url: embedUrl,
            title: '2Embed - HD',
            name: '2Embed HD',
            quality: 'HD',
            type: 'embed',
            provider: '2embed',
            providerName: '2Embed',
            description: 'Watch on 2Embed - Multiple server options',
            headers: {
                'Referer': 'https://www.2embed.cc/',
                'Origin': 'https://www.2embed.cc'
            }
        };

        streams.push(stream);

        console.log(`[2Embed] Generated ${streams.length} streams for ${mediaType}:${tmdbId}`);
        return streams;

    } catch (error) {
        console.error('[2Embed] Error generating streams:', error.message);
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
