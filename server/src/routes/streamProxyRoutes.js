const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * Stream Proxy Route
 * Proxy video streams to bypass CORS restrictions
 */
router.get('/stream', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL parameter required' });
        }

        console.log('[StreamProxy] Proxying stream:', url);

        // Parse headers from query if provided
        let headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
        };

        // Add referer and origin from URL params if exists
        const urlParams = new URL(`http://dummy.com${req.url}`);
        const headersParam = urlParams.searchParams.get('headers');
        if (headersParam) {
            try {
                const customHeaders = JSON.parse(decodeURIComponent(headersParam));
                headers = { ...headers, ...customHeaders };
            } catch (e) {
                console.warn('[StreamProxy] Failed to parse headers:', e.message);
            }
        }

        // Fetch stream
        const response = await axios({
            method: 'GET',
            url: decodeURIComponent(url),
            responseType: 'stream',
            headers,
            timeout: 30000,
        });

        // Set CORS headers
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Range, Content-Type',
            'Content-Type': response.headers['content-type'] || 'application/octet-stream',
            'Content-Length': response.headers['content-length'],
            'Accept-Ranges': 'bytes',
        });

        // Handle range requests
        if (req.headers.range) {
            res.status(206);
        }

        // Pipe stream to response
        response.data.pipe(res);

    } catch (error) {
        console.error('[StreamProxy] Error:', error.message);
        
        if (!res.headersSent) {
            res.status(error.response?.status || 500).json({ 
                error: 'Failed to proxy stream',
                message: error.message 
            });
        }
    }
});

// Handle OPTIONS for CORS preflight
router.options('/stream', (req, res) => {
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
    });
    res.sendStatus(204);
});

module.exports = router;

