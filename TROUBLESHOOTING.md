# Troubleshooting - Provider Streaming

## Problem: "No streams available for this content"

Jika Anda melihat pesan ini, ikuti langkah-langkah berikut:

### 1. Check Browser Console

Buka browser console (F12 atau Right Click → Inspect → Console) dan cari:
- Error messages dengan prefix `[ProviderService]`
- Network requests yang gagal
- CORS errors

### 2. Verify Provider URL

Pastikan `.env` file memiliki:
```env
VITE_PROVIDER_URL=https://raw.githubusercontent.com/tapframe/nuvio-providers/refs/heads/main
```

Atau provider URL akan menggunakan default jika tidak di-set.

### 3. Check Content ID Format

Provider service mencoba berbagai format ID:
- Original ID (contoh: `123456`)
- IMDB format (contoh: `tt123456`)
- TMDB format (contoh: `tmdb:123456`)

**Debug Info:**
- Buka StreamsPage
- Click tombol "Debug" (hanya muncul di development mode)
- Lihat Content ID yang digunakan

### 4. Test Provider URL Manual

Coba akses provider URL langsung di browser:

**Untuk Movie:**
```
https://raw.githubusercontent.com/tapframe/nuvio-providers/refs/heads/main/stream/movie/{MOVIE_ID}.json
```

**Untuk TV Series:**
```
https://raw.githubusercontent.com/tapframe/nuvio-providers/refs/heads/main/stream/series/{SERIES_ID}/{SEASON}/{EPISODE}.json
```

Ganti `{MOVIE_ID}`, `{SERIES_ID}`, `{SEASON}`, `{EPISODE}` dengan ID yang benar.

### 5. Check Network Tab

1. Buka DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Click "Play" button di aplikasi
5. Lihat request yang dibuat
6. Check response status dan data

### 6. Common Issues

#### Issue: 404 Not Found
**Cause:** Content ID tidak ada di provider
**Solution:** 
- Coba content lain yang lebih populer
- Verify content ID format
- Check provider repository untuk struktur yang benar

#### Issue: CORS Error
**Cause:** Provider tidak allow cross-origin requests
**Solution:**
- GitHub raw content biasanya support CORS
- Jika masih error, mungkin perlu proxy

#### Issue: Timeout
**Cause:** Provider response terlalu lama
**Solution:**
- Timeout sudah di-set ke 15 detik
- Check internet connection
- Provider mungkin sedang down

#### Issue: Invalid JSON Response
**Cause:** Provider mengembalikan format yang tidak expected
**Solution:**
- Check console untuk response format
- Provider service sudah handle berbagai format
- Mungkin perlu update provider service

### 7. Enable Detailed Logging

Provider service sudah log semua activity ke console:
- `[ProviderService] Fetching streams:` - Parameters yang digunakan
- `[ProviderService] Trying URLs:` - List URL yang dicoba
- `[ProviderService] Found X streams` - Jumlah streams ditemukan
- `[ProviderService] Error:` - Error messages

### 8. Verify Provider Structure

Provider GitHub harus memiliki struktur:
```
nuvio-providers/
├── stream/
│   ├── movie/
│   │   └── {id}.json
│   └── series/
│       └── {id}/
│           └── {season}/
│               └── {episode}.json
```

Atau format alternatif yang didukung.

### 9. Test dengan Content Populer

Coba dengan content yang sangat populer:
- Avengers Endgame (TMDB ID: 299534)
- Breaking Bad (TMDB ID: 1396)
- The Dark Knight (TMDB ID: 155)

### 10. Check Provider Repository

Visit provider repository:
https://github.com/tapframe/nuvio-providers

Lihat struktur file dan format yang digunakan.

## Debug Mode

Di development mode, StreamsPage memiliki tombol "Debug" yang menampilkan:
- Provider URL yang digunakan
- Content ID
- Type (movie/series)
- Season & Episode (jika series)
- Jumlah streams ditemukan

## Still Not Working?

1. **Check Console Logs** - Semua error ada di console
2. **Test Provider URL Manual** - Pastikan URL accessible
3. **Verify Content ID** - Pastikan ID format benar
4. **Check Network Tab** - Lihat actual HTTP requests
5. **Try Different Content** - Mungkin content tertentu tidak ada

## Report Issue

Jika masih tidak bekerja, siapkan informasi berikut:
1. Browser console logs (copy semua error)
2. Network tab screenshot
3. Content ID yang digunakan
4. Provider URL yang digunakan
5. Browser & OS version

---

**Provider Service sudah mencoba berbagai format URL secara otomatis!**

Jika masih tidak bekerja, kemungkinan:
- Provider structure berbeda dari yang di-expect
- Content ID format tidak match
- Provider repository structure berubah

Check console untuk detail error messages!

