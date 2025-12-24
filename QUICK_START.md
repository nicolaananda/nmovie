# 🚀 Quick Start - Nuvio Web dengan Scrapers

## Setup Lengkap (2 Terminal)

### Terminal 1: Start Proxy Server

```bash
cd web/server
npm install
npm start
```

Server akan berjalan di `http://localhost:3001`

### Terminal 2: Start Web App

```bash
cd web
npm install
npm run dev
```

Web app akan berjalan di `http://localhost:3000`

## Setup .env

Pastikan file `web/.env` ada dengan:

```env
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_SCRAPER_PROXY_URL=http://localhost:3001
```

## Test Flow

1. ✅ Proxy server running (Terminal 1)
2. ✅ Web app running (Terminal 2)
3. ✅ Buka browser: http://localhost:3000
4. ✅ Browse movies di Home page
5. ✅ Click poster → Detail page
6. ✅ Click "Play" → Streams page
7. ✅ List streams muncul! 🎉

## Troubleshooting

### Proxy server tidak start
```bash
cd web/server
npm install
npm start
```

### Web app tidak connect
- Check `.env` file ada `VITE_SCRAPER_PROXY_URL=http://localhost:3001`
- Restart web app setelah update `.env`

### No streams muncul
- Check Terminal 1 (server) untuk error messages
- Check browser console (F12) untuk network errors
- Verify TMDB API key valid

## Production

Untuk production, deploy:
1. **Proxy Server** ke Railway/Render/Heroku
2. **Web App** ke Vercel/Netlify
3. Update `VITE_SCRAPER_PROXY_URL` dengan production URL

---

**Selamat streaming!** 🎬✨

