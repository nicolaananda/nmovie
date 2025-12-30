/**
 * Multiembed Scraper
 * 
 * Multiembed.mov is a streaming embed provider with multiple sources
 * Supports TMDB IDs for movies and TV shows
 */

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        const streams = [];

        // Base URL for Multiembed
        const baseUrl = 'https://multiembed.mov';

        // Build embed URL based on media type
        let embedUrl;
        if (mediaType === 'movie') {
            // Movie format: https://multiembed.mov/?video_id={tmdb_id}&tmdb=1
            embedUrl = `${baseUrl}/?video_id=${tmdbId}&tmdb=1`;
        } else if (mediaType === 'tv' && season && episode) {
            // TV format: https://multiembed.mov/?video_id={tmdb_id}&tmdb=1&s={season}&e={episode}
            embedUrl = `${baseUrl}/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
        } else {
            return [];
        }

        // Create stream object
        const stream = {
            url: embedUrl,
            title: 'Multiembed - HD',
            name: 'Multiembed HD',
            quality: 'HD',
            type: 'embed',
            provider: 'multiembed',
            providerName: 'Multiembed',
            description: 'Watch on Multiembed - Multiple server options',
            headers: {
                'Referer': 'https://multiembed.mov/',
                'Origin': 'https://multiembed.mov'
            }
        };

        streams.push(stream);

        console.log(`[Multiembed] Generated ${streams.length} streams for ${mediaType}:${tmdbId}`);
        return streams;

    } catch (error) {
        console.error('[Multiembed] Error generating streams:', error.message);
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
