# 🎬 Cara Pakai Nuvio Web - Panduan Lengkap

## ✅ Status: Streaming Sudah Berfungsi!

Provider streaming dari GitHub sudah terintegrasi. Aplikasi web sekarang bisa streaming movies dan TV shows seperti di aplikasi mobile Anda!

## 🚀 Quick Start (3 Langkah)

### 1️⃣ Install Dependencies

```bash
cd web
npm install
```

### 2️⃣ Setup TMDB API Key

Buat file `.env` di folder `web`:

```bash
# Copy template
cp .env.example .env
```

Edit file `.env` dan tambahkan TMDB API key:

```env
VITE_TMDB_API_KEY=isi_dengan_api_key_anda
VITE_PROVIDER_URL=https://raw.githubusercontent.com/tapframe/nuvio-providers/refs/heads/main
```

**Cara dapat TMDB API Key:**
1. Daftar gratis di https://www.themoviedb.org/
2. Settings → API → Request API Key (pilih "Developer")
3. Copy API Key (v3 auth)
4. Paste ke `.env`

### 3️⃣ Jalankan Aplikasi

```bash
npm run dev
```

Buka browser: http://localhost:3000

**Selesai!** 🎉 Aplikasi sudah bisa dipakai untuk streaming!

---

## 📱 Cara Menggunakan Aplikasi

### 1. Browse Movies & TV Shows

**Home Page** menampilkan:
- Trending Movies (populer hari ini)
- Popular TV Shows
- Semua data real dari TMDB

### 2. Search Content

**Search Page** untuk cari konten:
1. Klik icon Search di navigation
2. Ketik nama film/series (contoh: "Avengers")
3. Hasil muncul otomatis (debounced search)

### 3. Lihat Detail Content

**Click poster** untuk ke detail page:
- Melihat banner, rating, year, genres
- Baca description/overview
- Info runtime & release date

### 4. Watch/Streaming (BARU!)

**Flow streaming:**

1. **Di Detail Page** → Click tombol **"Play"** (biru)
   
2. **Streams Page** muncul dengan list streams tersedia
   - Setiap stream menampilkan:
     - Quality badge (4K, 1080p, 720p, 480p)
     - File size
     - Provider name
     - Description
   
3. **Pilih stream** yang diinginkan → Click tombol **"Play"**
   
4. **Video Player** terbuka dan video langsung play!

**Contoh lengkap:**
```
Home → Click "Avengers" poster → Detail Avengers → 
Click "Play" → List 5 streams muncul → 
Pilih "1080p BluRay" → Video play! 🎬
```

### 5. Library Management

**Add to Library:**
- Di detail page, click tombol **"Add to Library"**
- Content tersimpan di browser localStorage
- Bisa diakses kapan saja di Library page

**View Library:**
- Click icon Library di navigation
- Lihat semua movies & TV shows yang sudah disimpan
- Terpisah per kategori (Movies / TV Shows)

**Remove from Library:**
- Di detail page, click **"In Library"** (sudah di-add)
- Content dihapus dari library

### 6. Change Theme

**Settings Page:**
- Click icon Settings di navigation
- Pilih dari 6 tema built-in:
  - Default Dark (biru)
  - Ocean Blue
  - Sunset (orange)
  - Moonlight (purple)
  - Emerald (hijau)
  - Ruby (merah)

---

## 🎯 Fitur Utama

### ✅ Yang Sudah Berfungsi

| Fitur | Status | Keterangan |
|-------|--------|------------|
| Browse Movies | ✅ | Trending & Popular dari TMDB |
| Browse TV Shows | ✅ | Real-time data |
| Search | ✅ | Debounced, real-time results |
| Content Details | ✅ | Banner, rating, genres, description |
| **Streaming** | ✅ **BARU!** | Dari Nuvio Providers GitHub |
| Video Player | ✅ | React Player dengan controls |
| Library Add/Remove | ✅ | LocalStorage persistence |
| Multiple Themes | ✅ | 6 tema built-in |
| Responsive Design | ✅ | Mobile, tablet, desktop |

### 🎬 Provider Integration

**URL Provider:**
```
https://raw.githubusercontent.com/tapframe/nuvio-providers/refs/heads/main
```

**Fitur Provider:**
- ✅ Multiple stream sources per content
- ✅ Quality detection (4K, 1080p, 720p, 480p, SD)
- ✅ File size information
- ✅ Provider name display
- ✅ Automatic quality badge
- ✅ Error handling untuk failed providers
- ✅ Support movies & TV series

---

## 🔧 Troubleshooting

### Problem: Movies kosong / tidak muncul

**Solusi:**
1. Pastikan TMDB API key sudah correct di `.env`
2. Restart dev server: `Ctrl+C` → `npm run dev`
3. Clear browser cache
4. Check browser console untuk error

### Problem: Streams tidak muncul

**Solusi:**
1. Provider URL harus accessible
2. Check network tab di DevTools (F12)
3. Pastikan content ID valid
4. Test provider URL manual di browser

### Problem: Video tidak play

**Solusi:**
1. Check stream URL valid (klik langsung di browser)
2. CORS issue? Check console errors
3. Video format mungkin tidak supported browser
4. Try stream source yang lain

### Problem: Port 3000 sudah dipakai

**Solusi:**
```bash
npm run dev -- --port 3001
```

### Problem: "Module not found"

**Solusi:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Struktur Aplikasi

```
web/
├── src/
│   ├── components/          # UI Components
│   │   ├── ContentCard.tsx    → Poster cards
│   │   ├── LoadingSpinner.tsx → Loading indicator
│   │   ├── ErrorMessage.tsx   → Error display
│   │   ├── Navigation.tsx     → Top nav bar
│   │   └── Layout.tsx         → Page layout
│   │
│   ├── screens/            # Pages
│   │   ├── HomePage.tsx       → Browse content
│   │   ├── SearchPage.tsx     → Search
│   │   ├── LibraryPage.tsx    → User library
│   │   ├── MetadataPage.tsx   → Content details
│   │   ├── StreamsPage.tsx    → Stream list 🎬
│   │   ├── PlayerPage.tsx     → Video player
│   │   └── SettingsPage.tsx   → Settings
│   │
│   ├── services/           # Services
│   │   ├── storage.ts         → LocalStorage wrapper
│   │   ├── tmdbService.ts     → TMDB API
│   │   └── providerService.ts → Stream provider 🎬
│   │
│   ├── contexts/           # State Management
│   │   ├── ThemeContext.tsx   → Theme state
│   │   └── CatalogContext.tsx → Library state
│   │
│   ├── hooks/              # Custom Hooks
│   │   ├── useContent.ts      → Fetch content
│   │   └── useStreams.ts      → Fetch streams 🎬
│   │
│   └── types/              # TypeScript Types
│       ├── metadata.ts        → Content & stream types
│       └── catalog.ts         → Provider types
```

---

## 🎓 Tips & Best Practices

### Development
- Dev server dengan HMR (Hot Module Replacement) - perubahan langsung terlihat
- TypeScript errors muncul di editor
- Install React DevTools extension untuk debugging
- Check browser console untuk logs/errors

### Production Build
```bash
npm run build       # Build untuk production
npm run preview     # Preview build locally
```

Output di folder `dist/` siap deploy!

### Deployment
```bash
# Vercel (recommended)
npm install -g vercel
vercel deploy

# Netlify
npm install -g netlify-cli
netlify deploy --prod

# Manual
# Upload folder dist/ ke hosting
```

---

## 📱 Responsive Design

Aplikasi otomatis responsive:
- **Mobile** (320px+): Single column, touch-friendly
- **Tablet** (768px+): 2-4 columns
- **Desktop** (1024px+): 4-6 columns, full features

---

## 🎯 Roadmap / Fitur Mendatang

### Priority High
- [ ] Subtitle support
- [ ] Quality switching dalam player
- [ ] Continue watching feature
- [ ] Watch history

### Priority Medium
- [ ] User authentication
- [ ] Multi-profile support
- [ ] Watchlist sync
- [ ] Advanced search filters

### Priority Low
- [ ] Download for offline
- [ ] Trakt integration
- [ ] Social features
- [ ] Recommendations engine

---

## 📞 Support

Jika ada masalah:
1. Baca dokumentasi ini & file lainnya
2. Check browser console (F12)
3. Verify TMDB API key valid
4. Ensure dependencies installed: `npm install`
5. Try fresh start: restart dev server

## 📚 Dokumentasi Lengkap

1. **CARA_PAKAI.md** ← Anda di sini (panduan lengkap)
2. **RINGKASAN_INDONESIA.md** - Ringkasan fitur
3. **PROVIDER_INTEGRATION.md** - Detail provider integration
4. **SETUP.md** - Setup guide detail
5. **README.md** - General info

---

## 🎉 Kesimpulan

Aplikasi web Nuvio sudah **fully functional** untuk:
- ✅ Browse content dari TMDB
- ✅ Search movies & TV shows
- ✅ View detailed information
- ✅ **Stream/watch content** (provider terintegrasi)
- ✅ Manage personal library
- ✅ Customize themes

**Tinggal 3 langkah:**
1. `npm install`
2. Setup TMDB API key di `.env`
3. `npm run dev`

**Selamat streaming!** 🎬🍿✨

---

*Provider sama seperti yang Anda pakai di HP, sekarang bisa di web browser!*

