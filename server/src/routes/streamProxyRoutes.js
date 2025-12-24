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

        // Parse URL and headers
        const targetUrl = decodeURIComponent(url);
        const urlObj = new URL(targetUrl);
        
        // Build comprehensive headers to bypass provider restrictions
        let headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
        };

        // Parse custom headers from query params
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
        
        // If no referer provided, use the video host as referer
        if (!headers.referer && !headers.Referer) {
            headers.referer = `${urlObj.protocol}//${urlObj.host}/`;
        }
        
        // If no origin provided, use the video host as origin
        if (!headers.origin && !headers.Origin) {
            headers.origin = `${urlObj.protocol}//${urlObj.host}`;
        }

        // Fetch stream with retry logic
        let response;
        try {
            response = await axios({
                method: 'GET',
                url: targetUrl,
                responseType: 'stream',
                headers,
                timeout: 30000,
                maxRedirects: 5,
                validateStatus: (status) => status >= 200 && status < 400,
            });
        } catch (error) {
            // If 403, try with minimal headers (some providers block too many headers)
            if (error.response?.status === 403) {
                console.log('[StreamProxy] 403 detected, retrying with minimal headers...');
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': headers.referer || headers.Referer,
                    'Origin': headers.origin || headers.Origin,
                };
                
                response = await axios({
                    method: 'GET',
                    url: targetUrl,
                    responseType: 'stream',
                    headers,
                    timeout: 30000,
                    maxRedirects: 5,
                    validateStatus: (status) => status >= 200 && status < 400,
                });
            } else {
                throw error;
            }
        }

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

