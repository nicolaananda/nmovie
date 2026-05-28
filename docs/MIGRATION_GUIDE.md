# Migration Guide: React Native to React Web

This document explains the migration from the React Native mobile app to the React web application.

## Overview

The Nuvio web app is a complete rewrite of the mobile app using modern web technologies while maintaining the core functionality and user experience.

## Key Changes

### 1. Framework & Build Tool
- **From**: React Native with Expo
- **To**: React with Vite
- **Why**: Vite provides fast development, optimized builds, and better TypeScript support for web

### 2. Styling
- **From**: React Native StyleSheet
- **To**: Tailwind CSS + CSS-in-JS (inline styles for theming)
- **Why**: Tailwind provides utility-first CSS, better responsive design, and faster development

### 3. Navigation
- **From**: React Navigation (@react-navigation/native)
- **To**: React Router (react-router-dom)
- **Why**: React Router is the standard for web navigation with better URL handling

### 4. State Management
- **From**: React Context + useState
- **To**: React Context + React Query (TanStack Query)
- **Why**: React Query provides better data fetching, caching, and server state management

### 5. Storage
- **From**: MMKV (react-native-mmkv)
- **To**: LocalStorage with AsyncStorage-compatible API
- **Why**: LocalStorage is the standard web storage API

### 6. Video Player
- **From**: React Native Video + Expo LibVLC Player
- **To**: React Player
- **Why**: React Player supports multiple video sources and is optimized for web

### 7. Icons
- **From**: @expo/vector-icons
- **To**: Lucide React
- **Why**: Lucide provides beautiful, consistent icons optimized for React

## Architecture Comparison

### Mobile App Structure
```
/
├── src/
│   ├── components/    # React Native components
│   ├── screens/       # Screen components
│   ├── contexts/      # React contexts
│   ├── services/      # API & services
│   ├── hooks/         # Custom hooks
│   └── navigation/    # React Navigation config
├── ios/              # iOS native code
├── android/          # Android native code
└── App.tsx          # Root component
```

### Web App Structure
```
web/
├── src/
│   ├── components/    # React web components
│   ├── screens/       # Page components
│   ├── contexts/      # React contexts (migrated)
│   ├── services/      # API & services (adapted for web)
│   ├── hooks/         # Custom hooks (migrated)
│   ├── types/         # TypeScript types
│   ├── utils/         # Utility functions
│   ├── styles/        # Global styles & themes
│   ├── App.tsx        # Root component with routing
│   └── main.tsx       # Entry point
├── public/           # Static assets
└── index.html       # HTML template
```

## Component Migration Examples

### Example 1: View → div

**React Native**:
```tsx
<View style={styles.container}>
  <Text>Hello World</Text>
</View>
```

**React Web**:
```tsx
<div className="container">
  <p>Hello World</p>
</div>
```

### Example 2: TouchableOpacity → button

**React Native**:
```tsx
<TouchableOpacity onPress={handlePress}>
  <Text>Click me</Text>
</TouchableOpacity>
```

**React Web**:
```tsx
<button onClick={handlePress}>
  Click me
</button>
```

### Example 3: ScrollView → div with overflow

**React Native**:
```tsx
<ScrollView>
  <Content />
</ScrollView>
```

**React Web**:
```tsx
<div className="overflow-auto">
  <Content />
</div>
```

## Services Migration

### Storage Service

**Mobile (MMKV)**:
```typescript
import { mmkvStorage } from './mmkvStorage';
await mmkvStorage.setItem('key', 'value');
```

**Web (LocalStorage)**:
```typescript
import { webStorage } from './storage';
await webStorage.setItem('key', 'value');
```

Both maintain the same AsyncStorage-compatible API for easy migration.

### TMDB Service

The TMDB service was adapted to work with web by:
1. Removing React Native specific dependencies
2. Using standard axios for HTTP requests
3. Adapting image URL handling for web

## Contexts Migration

All contexts were successfully migrated:

1. **ThemeContext**: Theme management with CSS variable support
2. **CatalogContext**: Content and library management
3. Other contexts can be added following the same pattern

## Screens Migration

All main screens were recreated:

1. **HomePage**: Browse and discover content
2. **SearchPage**: Search with debouncing
3. **LibraryPage**: Personal library management
4. **MetadataPage**: Content details (needs more work)
5. **StreamsPage**: Available streams (placeholder)
6. **PlayerPage**: Video player
7. **SettingsPage**: App settings with theme selector

## What's Not Migrated (Yet)

The following features from the mobile app need additional work:

1. **Trakt Integration**: Requires OAuth flow adaptation for web
2. **Download Feature**: Not applicable for web (consider offline mode instead)
3. **Advanced Player Controls**: Needs custom player UI
4. **Native Modules**: All native-specific features removed
5. **Push Notifications**: Requires Web Push API implementation
6. **Stremio Integration**: Needs adaptation for web environment

## Next Steps

To complete the migration, you should:

1. **Add TMDB API Key**: Get one from https://www.themoviedb.org/settings/api
2. **Implement Metadata Details**: Enhance MetadataPage with full details
3. **Add Stream Sources**: Integrate actual streaming sources
4. **Implement User Authentication**: If needed
5. **Add More Features**: Based on your requirements
6. **Optimize Performance**: Implement lazy loading, code splitting
7. **Add Error Boundaries**: Better error handling
8. **Implement Analytics**: Track user behavior
9. **Add SEO**: Meta tags, sitemap, etc.
10. **Deploy**: Choose a hosting platform

## Testing

To test the web app:

```bash
cd web
npm install
npm run dev
```

Visit http://localhost:3000

## Deployment Options

- **Vercel**: Easy deployment with GitHub integration
- **Netlify**: Great for static sites with serverless functions
- **GitHub Pages**: Free hosting for static sites
- **AWS S3 + CloudFront**: Scalable hosting
- **Your own server**: Using nginx or similar

## Performance Considerations

1. **Code Splitting**: Vite automatically splits code
2. **Image Optimization**: Use next-gen formats (WebP, AVIF)
3. **Lazy Loading**: Implement for images and components
4. **Caching**: React Query handles API caching
5. **Bundle Size**: Monitor with `npm run build`

## Browser Support

The app supports modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Conclusion

This migration provides a solid foundation for the Nuvio web app. The architecture is scalable, maintainable, and follows modern React best practices.

