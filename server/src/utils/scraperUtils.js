const axios = require('axios');
const { VM } = require('vm2');
const cheerio = require('cheerio');
const CryptoJS = require('crypto-js');

// GitHub repository URL
const GITHUB_REPO_URL = 'https://raw.githubusercontent.com/tapframe/nuvio-providers/refs/heads/main';
const MANIFEST_URL = `${GITHUB_REPO_URL}/manifest.json`;

// Cache for scrapers
const scraperCache = new Map();
const scraperCodeCache = new Map();

/**
 * Load manifest from GitHub
 */
async function loadManifest() {
    try {
        const response = await axios.get(MANIFEST_URL, {
            timeout: 10000,
        });
        return response.data;
    } catch (error) {
        console.error('[Server] Failed to load manifest:', error.message);
        return null;
    }
}

/**
 * Load scraper code from GitHub
 */
async function loadScraperCode(filename) {
    if (scraperCodeCache.has(filename)) {
        return scraperCodeCache.get(filename);
    }

    try {
        const url = `${GITHUB_REPO_URL}/${filename}`;
        console.log('[Server] Loading scraper:', url);

        const response = await axios.get(url, {
            timeout: 15000,
        });

        const code = response.data;
        scraperCodeCache.set(filename, code);
        return code;
    } catch (error) {
        console.error(`[Server] Failed to load scraper ${filename}:`, error.message);
        return null;
    }
}

/**
 * Execute scraper in sandboxed environment
 */
function executeScraper(code, tmdbId, mediaType, seasonNum, episodeNum) {
    return new Promise((resolve, reject) => {
        try {
            // Wrap code to expose getStreams function
            const wrappedCode = `
        ${code}
        
        // Export getStreams if using module.exports
        if (typeof module !== 'undefined' && module.exports && module.exports.getStreams) {
          global.getStreams = module.exports.getStreams;
        }
      `;

            // Create VM sandbox with all necessary APIs
            const vm = new VM({
                timeout: 45000, // 45 seconds timeout (scrapers need time)
                sandbox: {
                    // Provide fetch (using axios)
                    fetch: (url, options = {}) => {
                        return new Promise((fetchResolve, fetchReject) => {
                            axios({
                                url,
                                method: options.method || 'GET',
                                headers: options.headers || {},
                                data: options.body,
                                timeout: 25000,
                            })
                                .then((response) => {
                                    fetchResolve({
                                        ok: response.status >= 200 && response.status < 300,
                                        status: response.status,
                                        statusText: response.statusText,
                                        text: () => Promise.resolve(String(response.data)),
                                        json: () => Promise.resolve(response.data),
                                        headers: response.headers,
                                    });
                                })
                                .catch((error) => {
                                    fetchResolve({
                                        ok: false,
                                        status: error.response?.status || 500,
                                        statusText: error.message,
                                        text: () => Promise.resolve(''),
                                        json: () => Promise.resolve(null),
                                    });
                                });
                        });
                    },
                    // Provide cheerio for HTML parsing
                    cheerio: cheerio,
                    // Console for logging
                    console: {
                        log: (...args) => console.log('[Scraper]', ...args),
                        warn: (...args) => console.warn('[Scraper]', ...args),
                        error: (...args) => console.error('[Scraper]', ...args),
                    },
                    // Provide Promise
                    Promise: Promise,
                    // Provide module for compatibility
                    module: { exports: {} },
                    // Provide global context
                    global: {},
                    // Browser APIs that scrapers might need
                    btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
                    atob: (str) => Buffer.from(str, 'base64').toString('binary'),
                    URLSearchParams: URLSearchParams,
                    URL: URL,
                    TextEncoder: TextEncoder,
                    TextDecoder: TextDecoder,
                    // Provide require for scrapers that need it (limited)
                    require: (moduleName) => {
                        // Only allow specific modules
                        const allowedModules = {
                            'crypto-js': CryptoJS,
                        };
                        if (allowedModules[moduleName]) {
                            return allowedModules[moduleName];
                        }
                        throw new Error(`Module ${moduleName} is not allowed in sandbox`);
                    },
                    // Provide CryptoJS directly
                    CryptoJS: CryptoJS,
                },
            });

            // Execute scraper code
            vm.run(wrappedCode);

            // Get getStreams function from global or module.exports
            let getStreams;
            try {
                getStreams = vm.run('global.getStreams || (typeof module !== "undefined" && module.exports && module.exports.getStreams ? module.exports.getStreams : null)');
            } catch (e) {
                // Try alternative way
                const context = vm.run('({ getStreams: global.getStreams || (typeof module !== "undefined" && module.exports && module.exports.getStreams ? module.exports.getStreams : null) })');
                getStreams = context.getStreams;
            }

            if (!getStreams || typeof getStreams !== 'function') {
                throw new Error('getStreams function not found in scraper');
            }

            // Call getStreams (returns Promise)
            const result = getStreams(tmdbId, mediaType, seasonNum, episodeNum);

            // Handle Promise result
            if (result && typeof result.then === 'function') {
                result
                    .then((streams) => {
                        resolve(Array.isArray(streams) ? streams : []);
                    })
                    .catch((error) => {
                        reject(error);
                    });
            } else {
                resolve(Array.isArray(result) ? result : []);
            }
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to extract quality from text
function extractQuality(text) {
    if (!text) return '';
    const qualityMatch = text.match(/(\d+)p|(\d+)k|4K|1080p|720p|480p/i);
    return qualityMatch ? qualityMatch[0].toUpperCase() : '';
}

// Simple SRT → VTT converter (for browser HTML5 tracks)
function convertSrtToVtt(srtText) {
    if (!srtText) return 'WEBVTT\n\n';

    let vtt = srtText.replace(/\r\n/g, '\n');

    // Remove BOM if present
    if (vtt.charCodeAt(0) === 0xfeff) {
        vtt = vtt.slice(1);
    }

    // Replace comma in timestamps: 00:00:01,000 → 00:00:01.000
    vtt = vtt.replace(/(\d+:\d+:\d+),(\d+)/g, '$1.$2');

    if (!vtt.startsWith('WEBVTT')) {
        vtt = 'WEBVTT\n\n' + vtt;
    }

    return vtt;
}

module.exports = {
    loadManifest,
    loadScraperCode,
    executeScraper,
    extractQuality,
    convertSrtToVtt,
};
