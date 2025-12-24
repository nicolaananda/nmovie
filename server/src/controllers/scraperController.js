const axios = require('axios');
const { loadManifest, loadScraperCode, executeScraper, extractQuality, convertSrtToVtt } = require('../utils/scraperUtils');

const rawBase = process.env.SUBSOURCE_ADDON_URL ||
    'https://subdl.strem.top/b3RuM0VFc3RSS3VCcTNTY05LQllyR1lhMWN6NlI0WUMvRU4sSUQsSkEvaGlJbmNsdWRlLw==/manifest.json';

const SUBSOURCE_ADDON_BASE = rawBase.endsWith('manifest.json')
    ? rawBase.replace('manifest.json', '')
    : rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

// In-memory cache for streams (DISABLED - always fetch fresh)
const streamCache = new Map();
const CACHE_TTL = 0; // 0 = No cache, always fresh

exports.getStreams = async (req, res) => {
    try {
        const { tmdbId, mediaType, season, episode } = req.body;
        // Filter based on requested mode (default: all scrapers)
        const mode = req.body.mode || 'all'; // 'all', 'vidlink', 'others'

        // Check cache (DISABLED - always fetch fresh)
        // const cacheKey = `${tmdbId}:${mediaType}:${season || ''}:${episode || ''}:${mode}`;
        // if (streamCache.has(cacheKey)) {
        //     const { data, timestamp } = streamCache.get(cacheKey);
        //     if (Date.now() - timestamp < CACHE_TTL) {
        //         console.log(`[Server] Serving cached streams for ${cacheKey}`);
        //         return res.json(data);
        //     } else {
        //         streamCache.delete(cacheKey); // Expired
        //     }
        // }

        if (!tmdbId || !mediaType) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        console.log('[Server] Requesting streams:', { tmdbId, mediaType, season, episode });

        const allStreams = [];
        const errors = [];

        // Add Vidrock streams (local scraper - always fast)
        try {
            const vidrockScraper = require('../scrapers/vidrock');
            const vidrockStreams = await vidrockScraper.getStreams(tmdbId, mediaType, season, episode);
            if (vidrockStreams && vidrockStreams.length > 0) {
                console.log(`[Server] Vidrock returned ${vidrockStreams.length} streams`);
                allStreams.push(...vidrockStreams);
            }
        } catch (error) {
            console.error('[Server] Vidrock scraper error:', error.message);
            errors.push('Vidrock: ' + error.message);
        }

        // REMOTE SCRAPERS DISABLED - Only using Vidrock
        // To re-enable remote scrapers (VidLink, etc.), uncomment the code below
        
        // Return only Vidrock streams
        const responseData = {
            streams: allStreams,
            count: allStreams.length,
            errors: errors.length > 0 ? errors : undefined,
        };

        console.log('[Server] Returning Vidrock streams only (remote scrapers disabled)');
        return res.json(responseData);

        /* REMOTE SCRAPERS CODE (DISABLED)
        // Load manifest
        const manifest = await loadManifest();
        if (!manifest || !manifest.scrapers) {
            return res.status(500).json({ error: 'Failed to load scraper manifest' });
        }

        // Get enabled scrapers
        const enabledScrapers = manifest.scrapers.filter(
            (s) => s.enabled && s.supportedTypes.includes(mediaType)
        );

        if (enabledScrapers.length === 0) {
            return res.json({ streams: [] });
        }

        // Prioritize VidLink scraper first
        const vidlinkScrapers = enabledScrapers.filter(
            (s) =>
                (s.id && s.id.toLowerCase().includes('vidlink')) ||
                (s.name && s.name.toLowerCase().includes('vidlink')) ||
                (s.filename && s.filename.toLowerCase().includes('vidlink')),
        );
        const otherScrapers = enabledScrapers.filter(
            (s) => !vidlinkScrapers.includes(s),
        );

        let scrapersToRun = [];

        if (mode === 'vidlink') {
            scrapersToRun = vidlinkScrapers;
        } else if (mode === 'others') {
            scrapersToRun = otherScrapers;
        } else {
            scrapersToRun = enabledScrapers;
        }

        if (scrapersToRun.length === 0 && allStreams.length === 0) {
            return res.json({ streams: [] });
        }

        // allStreams and errors already initialized above

        async function runScraperBatches(scrapers) {
            const batchSize = 5;
            for (let i = 0; i < scrapers.length; i += batchSize) {
                const batch = scrapers.slice(i, i + batchSize);

                const batchPromises = batch.map(async (scraper) => {
                    try {
                        const code = await loadScraperCode(scraper.filename);
                        if (!code) {
                            errors.push(`Failed to load ${scraper.name}`);
                            return [];
                        }

                        const streams = await executeScraper(
                            code,
                            tmdbId,
                            mediaType,
                            season,
                            episode,
                        );

                        if (streams && Array.isArray(streams) && streams.length > 0) {
                            // Add scraper info to streams
                            const enrichedStreams = streams
                                .map((stream) => {
                                    const url = stream.url || stream.src || stream.link || stream.playlist;

                                    if (!url) {
                                        console.warn(`[Server] Stream from ${scraper.name} missing URL:`, stream);
                                        return null;
                                    }

                                    return {
                                        url,
                                        title: stream.title || stream.name || stream.label || `${scraper.name} Stream`,
                                        name: stream.name || stream.title || `${scraper.name} Stream`,
                                        quality: stream.quality || extractQuality(stream.title || stream.name || ''),
                                        size: stream.size,
                                        lang: stream.lang || stream.language || 'en',
                                        description: stream.description,
                                        provider: scraper.id,
                                        providerName: scraper.name,
                                        headers: stream.headers || {},
                                        ...stream,
                                    };
                                })
                                .filter((s) => s !== null && s.url);

                            if (enrichedStreams.length > 0) {
                                console.log(`[Server] ${scraper.name} returned ${enrichedStreams.length} valid streams`);
                            }

                            return enrichedStreams;
                        }
                        return [];
                    } catch (error) {
                        console.error(`[Server] Scraper ${scraper.name} failed:`, error.message);
                        errors.push(`${scraper.name}: ${error.message}`);
                        return [];
                    }
                });

                const batchResults = await Promise.all(batchPromises);
                batchResults.forEach((streams) => {
                    if (streams && streams.length > 0) {
                        allStreams.push(...streams);
                    }
                });

                if (scrapers === vidlinkScrapers && allStreams.length > 0) {
                    console.log(`[Server] VidLink returned ${allStreams.length} streams. Fetching others...`);
                }
            }
        }

        if (mode === 'all') {
            // Original prioritized logic for 'all' mode
            if (vidlinkScrapers.length > 0) {
                console.log(`[Server] Prioritizing VidLink scrapers: ${vidlinkScrapers.map((s) => s.name).join(', ')}`);
                await runScraperBatches(vidlinkScrapers);
            }
            console.log(`[Server] Fetching from other providers...`);
            await runScraperBatches(otherScrapers);
        } else {
            // Focused run for specific mode
            console.log(`[Server] Running scrapers in mode '${mode}': ${scrapersToRun.map(s => s.name).join(', ')}`);
            await runScraperBatches(scrapersToRun);
        }

        console.log(`[Server] Found ${allStreams.length} streams from ${enabledScrapers.length} scrapers`);

        if (allStreams.length > 0) {
            console.log('[Server] Stream details:');
            allStreams.forEach((stream, index) => {
                console.log(`  ${index + 1}. ${stream.providerName || 'Unknown'}: ${stream.title || stream.name} (${stream.quality || 'Unknown quality'})`);
            });
        }

        const responseData = {
            streams: allStreams,
            errors: errors.length > 0 ? errors : undefined,
            totalScrapers: enabledScrapers.length,
            successfulScrapers: enabledScrapers.length - errors.length,
        };

        // Cache the result (DISABLED - no caching)
        // if (allStreams.length > 0) {
        //     streamCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
        // }

        console.log('[Server] Returning fresh streams (no cache)');
        res.json(responseData);
        END OF REMOTE SCRAPERS CODE */

    } catch (error) {
        console.error('[Server] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getSubtitleProxy = async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send('Missing url parameter');
    }

    try {
        console.log('[Server] Proxying subtitle file from:', url);

        const resp = await axios.get(url, {
            responseType: 'text',
            timeout: 15000,
            headers: { Accept: '*/*' },
        });

        let text = resp.data || '';
        const contentType = resp.headers['content-type'] || '';

        if (!/text\/vtt/i.test(contentType) && !text.startsWith('WEBVTT')) {
            text = convertSrtToVtt(text);
        }

        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
        res.send(text);
    } catch (err) {
        console.error('[Server] Subtitle proxy error:', err.message);
        res.status(500).send('Failed to proxy subtitle');
    }
};

exports.getSubtitles = async (req, res) => {
    const { imdbId, mediaType, season, episode } = req.body;

    console.log('[Server] Requesting subtitles:', { imdbId, mediaType, season, episode });

    if (!imdbId) {
        return res.status(400).json({ error: 'Missing imdbId' });
    }

    try {
        const cleanImdbId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
        let stremioId = cleanImdbId;
        const type = mediaType === 'series' || mediaType === 'tv' ? 'series' : 'movie';

        if (type === 'series' && season !== undefined && episode !== undefined) {
            stremioId = `${cleanImdbId}:${season}:${episode}`;
        }

        const encodedId = encodeURIComponent(stremioId);
        const addonUrl = `${SUBSOURCE_ADDON_BASE}subtitles/${type}/${encodedId}.json`;

        console.log(`[Server] Fetching subtitles from SubDL addon: ${addonUrl}`);

        const response = await axios.get(addonUrl, {
            timeout: 15000,
            headers: { 'Accept': 'application/json' },
        });

        const data = response.data;
        const rawSubs = data?.subtitles || (Array.isArray(data) ? data : []);

        console.log(`[Server] Found ${rawSubs.length} raw subtitles from SubDL addon`);

        const subtitles = rawSubs
            .filter((s) => s && s.url)
            .map((s, idx) => {
                const originalUrl = s.url;
                const rawLang = String(s.lang || s.language || '').trim().toLowerCase();

                let code = 'en';
                if (rawLang.includes('indo') || rawLang === 'id' || rawLang === 'ind') {
                    code = 'id';
                } else if (rawLang.startsWith('en') || rawLang.includes('english')) {
                    code = 'en';
                } else if (rawLang.length === 2 && /^[a-z]{2}$/.test(rawLang)) {
                    code = rawLang;
                } else if (rawLang) {
                    code = rawLang;
                }

                const proxiedUrl = `${req.protocol}://${req.get('host')}/api/subtitles/proxy?url=${encodeURIComponent(originalUrl)}`;

                return {
                    id: s.id || `sub-${idx}`,
                    url: proxiedUrl,
                    originalUrl,
                    lang: code,
                    fps: s.fps,
                    addon: 'subdl',
                    addonName: 'SubDL',
                    format: (s.format || 'srt').toLowerCase(),
                };
            });

        console.log(`[Server] Returning ${subtitles.length} normalized subtitles`);
        res.json({ subtitles });
    } catch (error) {
        console.error('[Server] Error fetching subtitles:', error.response?.status || error.message);
        res.status(500).json({
            error: 'Failed to fetch subtitles from Stremio addon',
            details: error.response?.data || error.message
        });
    }
};
