# Stremio Addon Setup untuk Web

## Masalah

Provider GitHub (`tapframe/nuvio-providers`) berisi **JavaScript scrapers** yang perlu di-host sebagai **Stremio addon server**, bukan file JSON statis.

## Solusi

Ada beberapa opsi untuk menggunakan provider ini di web:

### Opsi 1: Gunakan Stremio Addon Server yang Sudah Hosted (Recommended)

Jika ada Stremio addon server yang sudah menjalankan scrapers ini, update `.env`:

```env
VITE_STREMIO_ADDON_URL=https://your-stremio-addon-server.com
```

Format URL Stremio:
- Movies: `{baseUrl}/stream/movie/{id}.json`
- Series: `{baseUrl}/stream/series/{id}:{season}:{episode}.json`

### Opsi 2: Setup Stremio Addon Server Sendiri

1. Install Stremio addon SDK
2. Host scrapers dari GitHub sebagai Stremio addon
3. Deploy ke hosting (Vercel, Railway, dll)
4. Update `.env` dengan URL server Anda

### Opsi 3: Gunakan Proxy/Backend

Setup backend proxy yang:
1. Mengambil request dari web app
2. Memanggil Stremio addon server
3. Return streams ke web app

## Format ID Stremio

Stremio menggunakan format ID:
- **TMDB**: `tmdb:123456`
- **IMDB**: `tt123456`
- **Series Episode**: `tmdb:123456:1:1` (id:season:episode)

## Testing

Untuk test apakah Stremio addon server accessible:

```bash
# Test movie streams
curl "https://your-addon-server.com/stream/movie/tmdb:575265.json"

# Test series streams  
curl "https://your-addon-server.com/stream/series/tmdb:1396:1:1.json"
```

Response format:
```json
{
  "streams": [
    {
      "url": "https://...",
      "title": "1080p",
      "name": "1080p BluRay",
      "quality": "1080p"
    }
  ]
}
```

## Current Implementation

Provider service sudah di-update untuk menggunakan format Stremio API. Tinggal setup Stremio addon server URL di `.env`.

---

**Note**: Provider GitHub ini adalah scrapers JavaScript yang perlu dijalankan sebagai Stremio addon server, bukan file statis.

