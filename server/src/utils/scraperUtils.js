const axios = require('axios');
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

// executeScraper removed: remote sandboxing is not used in this codebase

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
    extractQuality,
    convertSrtToVtt,
};
