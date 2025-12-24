# Nuvio Scraper Proxy Server

Backend server untuk menjalankan JavaScript scrapers dari GitHub repository dan mengembalikan streams ke web application.

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server akan berjalan di `http://localhost:7001`

## API Endpoints

### Health Check
```
GET /health
```

### Get Streams
```
POST /api/scrapers/streams
Content-Type: application/json

{
  "tmdbId": "575265",
  "mediaType": "movie",  // or "tv"
  "season": 1,          // optional, for TV shows
  "episode": 1          // optional, for TV shows
}
```

Response:
```json
{
  "streams": [
    {
      "url": "https://...",
      "title": "1080p BluRay",
      "name": "1080p",
      "quality": "1080p",
      "size": "2.5 GB",
      "provider": "scraper-id",
      "providerName": "Scraper Name"
    }
  ],
  "errors": [] // optional, if any scrapers failed
}
```

## How It Works

1. Server download `manifest.json` dari GitHub
2. Load enabled scrapers berdasarkan mediaType
3. Download scraper JavaScript files dari GitHub
4. Execute scrapers di VM2 sandbox (secure)
5. Collect streams dari semua scrapers
6. Return streams ke web app

## Environment Variables

```env
PORT=7001  # Server port (default: 7001)
```

## Security

- Scrapers dieksekusi di VM2 sandbox untuk isolasi
- Timeout 20 detik per scraper
- Limited access ke Node.js APIs

## Troubleshooting

### Scrapers tidak berjalan
- Check console logs untuk error messages
- Verify GitHub repository accessible
- Check scraper code format

### Timeout errors
- Increase timeout di `executeScraper` function
- Check network connection ke GitHub

### CORS errors
- Server sudah setup CORS untuk semua origins
- Jika masih error, check browser console

## Development

Untuk development dengan auto-reload:
```bash
npm run dev
```

Install nodemon globally jika belum:
```bash
npm install -g nodemon
```

