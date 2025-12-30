/**
 * Vidsrc.me Scraper
 * 
 * Vidsrc.me is another popular embed-based streaming provider
 * Supports TMDB IDs for movies and TV shows
 */

async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        const streams = [];

        // Base URL for Vidsrc.me embeds
        const baseUrl = 'https://vidsrc.me';

        // Build embed URL based on media type
        let embedUrl;
        if (mediaType === 'movie') {
            // Movie format: https://vidsrc.me/embed/movie?tmdb={tmdb_id}
            embedUrl = `${baseUrl}/embed/movie?tmdb=${tmdbId}`;
        } else if (mediaType === 'tv' && season && episode) {
            // TV format: https://vidsrc.me/embed/tv?tmdb={tmdb_id}&season={season}&episode={episode}
            embedUrl = `${baseUrl}/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
        } else {
            return [];
        }

        // Create stream object
        const stream = {
            url: embedUrl,
            title: 'Vidsrc.me - HD',
            name: 'Vidsrc.me HD',
            quality: 'HD',
            type: 'embed',
            provider: 'vidsrc-me',
            providerName: 'Vidsrc.me',
            description: 'Watch on Vidsrc.me - High quality streaming',
            headers: {
                'Referer': 'https://vidsrc.me/',
                'Origin': 'https://vidsrc.me'
            }
        };

        streams.push(stream);

        console.log(`[Vidsrc.me] Generated ${streams.length} streams for ${mediaType}:${tmdbId}`);
        return streams;

    } catch (error) {
        console.error('[Vidsrc.me] Error generating streams:', error.message);
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
