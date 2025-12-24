const express = require('express');
const axios = require('axios');
const router = express.Router();

/**
 * Proxy endpoint untuk stream video
 * Bypass CORS dengan proxy melalui backend
 */
router.get('/stream', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'URL parameter required' });
        }

        console.log('[Proxy] Streaming from:', url);

        // Parse headers dari query jika ada
        let headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
        };

        // Decode headers dari URL jika ada
        try {
            const urlObj = new URL(url);
            const headersParam = urlObj.searchParams.get('headers');
            if (headersParam) {
                const customHeaders = JSON.parse(headersParam);
                headers = { ...headers, ...customHeaders };
            }
        } catch (e) {
            // Ignore header parsing errors
        }

        // Request ke video provider
        const response = await axios({
            method: 'GET',
            url: url,
            headers: headers,
            responseType: 'stream',
            timeout: 30000,
            maxRedirects: 5,
            validateStatus: (status) => status < 500, // Accept any status < 500
        });

        // Forward headers dari upstream
        res.set('Content-Type', response.headers['content-type'] || 'application/vnd.apple.mpegurl');
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Range, Content-Type');
        
        if (response.headers['content-length']) {
            res.set('Content-Length', response.headers['content-length']);
        }
        
        if (response.headers['accept-ranges']) {
            res.set('Accept-Ranges', response.headers['accept-ranges']);
        }

        // Pipe response ke client
        response.data.pipe(res);

    } catch (error) {
        console.error('[Proxy] Error:', error.message);
        console.error('[Proxy] URL was:', req.query.url);
        
        if (error.response) {
            console.error('[Proxy] Response status:', error.response.status);
            console.error('[Proxy] Response data:', error.response.data);
        }
        
        res.status(500).json({ 
            error: 'Proxy failed',
            message: error.message,
            url: req.query.url 
        });
    }
});

/**
 * Handle OPTIONS for CORS preflight
 */
router.options('/stream', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.status(204).send();
});

module.exports = router;

