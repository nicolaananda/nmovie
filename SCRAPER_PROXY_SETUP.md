# Setup Scraper Proxy Server

## Overview

Karena browser tidak bisa langsung execute JavaScript scrapers dari GitHub, kita perlu backend proxy server yang:
1. Download scrapers dari GitHub
2. Execute scrapers di Node.js environment
3. Return streams ke web app

## Quick Start

### 1. Install Server Dependencies

```bash
cd web/server
npm install
```

### 2. Start Proxy Server

```bash
# Terminal 1: Start proxy server
cd web/server
npm start

# Atau dengan auto-reload untuk development
npm run dev
```

Server akan berjalan di `http://localhost:3001`

### 3. Update Web App .env

Pastikan file `.env` di folder `web` memiliki:

```env
VITE_SCRAPER_PROXY_URL=http://localhost:3001
```

### 4. Start Web App

```bash
# Terminal 2: Start web app
cd web
npm run dev
```

## How It Works

```
Web App (Browser)
    ↓ POST /api/scrapers/streams
Proxy Server (Node.js)
    ↓ Download manifest.json
GitHub Repository
    ↓ Download scraper.js files
    ↓ Execute in VM2 sandbox
    ↓ Return streams
Web App receives streams
```

## API Usage

### Request
```javascript
POST http://localhost:3001/api/scrapers/streams
Content-Type: application/json

{
  "tmdbId": "575265",
  "mediaType": "movie",  // or "tv"
  "season": 1,          // optional
  "episode": 1          // optional
}
```

### Response
```json
{
  "streams": [
    {
      "url": "https://stream.url",
      "title": "1080p BluRay",
      "name": "1080p",
      "quality": "1080p",
      "size": "2.5 GB",
      "provider": "scraper-id",
      "providerName": "Scraper Name"
    }
  ]
}
```

## Testing

### Test Server Health
```bash
curl http://localhost:3001/health
```

### Test Streams Endpoint
```bash
curl -X POST http://localhost:3001/api/scrapers/streams \
  -H "Content-Type: application/json" \
  -d '{
    "tmdbId": "575265",
    "mediaType": "movie"
  }'
```

## Troubleshooting

### Server tidak start
- Check apakah port 3001 sudah digunakan
- Install dependencies: `npm install`
- Check Node.js version (need v14+)

### Scrapers tidak berjalan
- Check server console untuk error messages
- Verify GitHub repository accessible
- Check scraper code format

### Web app tidak connect ke server
- Verify `VITE_SCRAPER_PROXY_URL` di `.env`
- Check CORS settings di server
- Restart web app setelah update `.env`

### Timeout errors
- Scrapers mungkin butuh waktu lebih lama
- Increase timeout di server code
- Check network connection

## Production Deployment

Untuk production, deploy server ke:
- Railway
- Render
- Heroku
- Vercel (serverless functions)
- Your own server

Update `VITE_SCRAPER_PROXY_URL` di production `.env` dengan URL server Anda.

## Security Notes

- Scrapers dieksekusi di VM2 sandbox untuk isolasi
- Timeout 20 detik per scraper
- Limited access ke Node.js APIs
- CORS enabled untuk web app domain

---

**Setup selesai!** Sekarang web app bisa streaming menggunakan scrapers dari GitHub! 🎉

