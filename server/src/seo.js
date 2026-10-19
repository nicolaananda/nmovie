const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function renderMeta(html, data, path, type) {
    const title = `${data.title || data.name || 'Film dan Serial'} | N-Movie`;
    const description = data.overview || 'Temukan informasi film dan serial favorit di N-Movie.';
    const image = /^\/[\w./-]+$/.test(data.poster_path || '') ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : 'https://ghzm.us/favicon.png';
    const url = `https://ghzm.us${path}`;
    const tags = `<title>${escape(title)}</title>
<meta name="description" content="${escape(description)}">
<link rel="canonical" href="${escape(url)}">
<meta property="og:site_name" content="N-Movie">
<meta property="og:type" content="${type === 'movie' ? 'video.movie' : 'video.tv_show'}">
<meta property="og:title" content="${escape(title)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:image" content="${escape(image)}">
<meta property="og:image:alt" content="${escape(title)}">
<meta property="og:url" content="${escape(url)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(title)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${escape(image)}">`;
    return html.replace(/<title>[\s\S]*?<\/title>/gi, '').replace(/<meta\b[^>]*(?:name="(?:description|twitter:[^"]*)"|property="og:[^"]*")[^>]*>/gi, '').replace(/<link\b[^>]*rel="canonical"[^>]*>/gi, '').replace('</head>', `${tags}\n</head>`);
}
// Public catalog only; session-scoped player tokens are intentionally never resolved here.
async function metadataPage(req, res, next) {
    const { type, id } = req.params;
    if (!['movie', 'series', 'tv'].includes(type) || !/^(?:tmdb:)?[1-9]\d{0,9}$/.test(id)) return res.status(404).send('Not found');
    try {
        const key = process.env.TMDB_API_KEY;
        if (!key) throw new Error('TMDB key unavailable');
        const upstream = new URL(`https://api.themoviedb.org/3/${type === 'movie' ? 'movie' : 'tv'}/${id.replace('tmdb:', '')}`);
        upstream.searchParams.set('api_key', key);
        const [details, shell] = await Promise.all([
            fetch(upstream, { signal: AbortSignal.timeout(8000) }),
            fetch('http://frontend:7781/index.html', { signal: AbortSignal.timeout(3000) }),
        ]);
        if (details.status === 404) return res.status(404).send('Not found');
        if (!details.ok || !shell.ok) throw new Error('Metadata upstream unavailable');
        const data = await details.json();
        const path = `/metadata/${type === 'movie' ? 'movie' : 'series'}/tmdb:${id.replace('tmdb:', '')}`;
        res.set('Cache-Control', 'public, max-age=300').type('html').send(renderMeta(await shell.text(), data, path, type));
    } catch {
        // Fail open to the SPA; do not cache a transient generic preview.
        res.set('Cache-Control', 'no-store');
        res.status(503).send('Metadata temporarily unavailable');
    }
}
module.exports = { renderMeta, metadataPage };
