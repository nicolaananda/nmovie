# Provider Integration - Nuvio Web

## Overview

Aplikasi web Nuvio sekarang sudah terintegrasi dengan Nuvio Providers dari GitHub untuk streaming movies dan TV shows.

## Provider URL

```
https://raw.githubusercontent.com/tapframe/nuvio-providers/refs/heads/main
```

Provider ini menyediakan:
- 🎬 Stream sources untuk movies
- 📺 Stream sources untuk TV series
- 🔍 Search functionality
- 📚 Catalog browsing

## Cara Kerja

### 1. Provider Service

File `src/services/providerService.ts` menangani:
- Loading provider manifests
- Fetching streams untuk content
- Search content
- Catalog browsing

### 2. Stream Flow

```
User clicks "Play" 
  → Navigate to MetadataPage 
  → Click "Play" button 
  → Navigate to StreamsPage 
  → Fetch streams from provider 
  → Display available streams 
  → User selects stream 
  → Navigate to PlayerPage 
  → Play video
```

### 3. Data Format

Provider mengembalikan streams dalam format:

```typescript
{
  url: string;              // Stream URL
  title?: string;           // Stream title
  name?: string;            // Stream name
  quality?: string;         // Quality (1080p, 720p, etc)
  size?: number;            // File size in bytes
  lang?: string;            // Language
  addon?: string;           // Provider ID
  addonName?: string;       // Provider name
  description?: string;     // Description
}
```

## File Structure

```
src/
├── services/
│   └── providerService.ts    # Provider integration
├── hooks/
│   └── useStreams.ts         # React Query hooks for streams
├── screens/
│   ├── MetadataPage.tsx      # Content details + Play button
│   ├── StreamsPage.tsx       # Available streams list
│   └── PlayerPage.tsx        # Video player
```

## Usage Examples

### Fetch Streams for Movie

```typescript
import { providerService } from './services/providerService';

// Get streams for a movie
const streams = await providerService.getStreams(
  'tt1234567',  // IMDB ID or TMDB ID
  'movie'
);
```

### Fetch Streams for TV Episode

```typescript
// Get streams for TV series episode
const streams = await providerService.getStreams(
  'tt1234567',  // Series ID
  'series',
  1,           // Season
  1            // Episode
);
```

### Using React Hook

```typescript
import { useStreams } from './hooks/useStreams';

function StreamsComponent() {
  const { data: streams, isLoading, error } = useStreams(
    'tt1234567',
    'movie'
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  return (
    <div>
      {streams?.map(stream => (
        <StreamCard key={stream.url} stream={stream} />
      ))}
    </div>
  );
}
```

## Features

### ✅ Implemented

- [x] Provider service integration
- [x] Stream fetching for movies
- [x] Stream fetching for TV series
- [x] Quality badges (4K, 1080p, 720p, etc)
- [x] File size display
- [x] Multiple provider support
- [x] Error handling
- [x] Loading states
- [x] Stream playback

### 🚧 Future Enhancements

- [ ] Subtitle support
- [ ] Multiple audio tracks
- [ ] Stream quality auto-selection
- [ ] Download functionality
- [ ] Torrent streaming support
- [ ] Provider settings/preferences
- [ ] Cache stream information
- [ ] Offline viewing

## Error Handling

Provider service menangani berbagai error scenarios:

1. **Provider not available**: Fallback ke default provider
2. **Stream not found**: Menampilkan "No streams available"
3. **Network error**: Retry functionality
4. **Timeout**: 10 detik timeout per request
5. **Invalid data**: Skip invalid streams

## CORS Issues

Jika ada CORS error, provider URL harus support CORS atau gunakan proxy.

### Solution 1: Provider with CORS enabled
Provider sudah setup dengan GitHub raw content yang support CORS.

### Solution 2: Use CORS Proxy (jika diperlukan)

```typescript
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const streamUrl = `${CORS_PROXY}${originalUrl}`;
```

## Testing

### Test Stream Fetching

```bash
# Open browser console
# Navigate to metadata page
# Click "Play" button
# Check StreamsPage for available streams
```

### Debug Mode

Enable debug logging di browser console:

```javascript
localStorage.setItem('debug', 'provider:*');
```

## Performance

### Caching

React Query automatically caches:
- Provider manifests: 10 minutes
- Streams data: 5 minutes
- Content details: 5 minutes

### Optimization

- Parallel provider requests
- Request timeout (10s)
- Failed provider skip (continue with others)
- Automatic retry on network error

## Provider Structure

Expected provider structure di GitHub:

```
nuvio-providers/
├── manifest.json           # Provider list
├── stream/
│   ├── movie/
│   │   └── {id}.json      # Movie streams
│   └── series/
│       └── {id}/
│           └── {season}/
│               └── {episode}.json
├── catalog/
│   ├── movie/
│   │   └── top.json
│   └── series/
│       └── top.json
└── search/
    └── {query}.json
```

## Configuration

Update provider URL di `providerService.ts`:

```typescript
const PROVIDER_BASE_URL = 'https://your-provider-url.com';
```

## Troubleshooting

### No streams showing

1. Check network tab di DevTools
2. Verify provider URL accessible
3. Check console for errors
4. Verify content ID format

### Stream won't play

1. Check stream URL valid
2. Test URL directly in browser
3. Check CORS headers
4. Verify video format supported

### Slow loading

1. Check network speed
2. Verify provider response time
3. Enable caching
4. Consider using CDN

## API Reference

### ProviderService Methods

```typescript
class ProviderService {
  // Load available providers
  loadProviders(): Promise<Provider[]>
  
  // Get streams for content
  getStreams(
    contentId: string,
    type: 'movie' | 'series',
    season?: number,
    episode?: number
  ): Promise<Stream[]>
  
  // Search content
  searchContent(query: string): Promise<any[]>
  
  // Get catalog
  getCatalog(
    type: 'movie' | 'series',
    catalogId: string
  ): Promise<any[]>
  
  // Get loaded providers
  getProviders(): Provider[]
}
```

## Security

⚠️ **Important Security Notes**:

1. Provider URLs harus dari trusted sources
2. Validate stream URLs sebelum play
3. Tidak simpan sensitive data di provider files
4. Use HTTPS untuk semua requests
5. Implement rate limiting untuk prevent abuse

## License

Provider integration mengikuti lisensi project utama.

## Support

Untuk issues terkait provider:
1. Check provider repository
2. Verify provider URL masih aktif
3. Test provider response manually
4. Check browser console errors

---

**Provider successfully integrated! 🎉**

Sekarang aplikasi web Anda bisa streaming movies dan TV shows menggunakan Nuvio Providers!

