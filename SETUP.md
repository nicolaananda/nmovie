# Setup Guide - Nuvio Web

## Quick Start

### 1. Prerequisites

Make sure you have installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**

Check your versions:
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

### 2. Installation

Navigate to the web directory and install dependencies:

```bash
cd web
npm install
```

This will install all required packages including:
- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- React Query
- And more...

### 3. Environment Configuration

Create a `.env` file in the `web` directory:

```bash
# Copy the example file
cp .env.example .env

# Then edit .env and add your TMDB API key
```

Your `.env` file should look like:
```env
VITE_TMDB_API_KEY=your_actual_api_key_here
VITE_APP_NAME=Nuvio
VITE_APP_VERSION=1.0.0
```

**How to get TMDB API Key:**

1. Go to https://www.themoviedb.org/
2. Create an account (free)
3. Go to Settings → API
4. Request an API Key (choose "Developer" option)
5. Copy your API Key (v3 auth)
6. Paste it in your `.env` file

### 4. Start Development Server

```bash
npm run dev
```

The app will open automatically at http://localhost:3000

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### 5. Verify Everything Works

1. **Home Page**: Should load with trending movies and popular TV shows
2. **Search Page**: Try searching for "Avengers" or any movie
3. **Library Page**: Should be empty initially
4. **Settings Page**: Try changing themes
5. **Navigation**: All navigation links should work

## Common Issues & Solutions

### Issue: "Module not found" errors

**Solution**: 
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "API key is invalid"

**Solution**: 
1. Check your `.env` file exists in the `web` directory
2. Verify the API key is correct (no extra spaces)
3. Make sure the variable name is exactly `VITE_TMDB_API_KEY`
4. Restart the dev server after changing `.env`

### Issue: Port 3000 is already in use

**Solution**:
```bash
# Use a different port
npm run dev -- --port 3001
```

Or kill the process using port 3000:
```bash
# On macOS/Linux
lsof -ti:3000 | xargs kill -9

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Styles not loading

**Solution**: 
```bash
# Make sure Tailwind CSS is properly configured
npm run dev
```

If still not working, check:
1. `tailwind.config.js` exists
2. `postcss.config.js` exists
3. `src/index.css` has the Tailwind directives

## Project Structure

```
web/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── Navigation.tsx
│   │   ├── ContentCard.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorMessage.tsx
│   ├── contexts/         # React contexts for state
│   │   ├── ThemeContext.tsx
│   │   └── CatalogContext.tsx
│   ├── screens/          # Page components
│   │   ├── HomePage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── LibraryPage.tsx
│   │   ├── MetadataPage.tsx
│   │   ├── StreamsPage.tsx
│   │   ├── PlayerPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/         # API and storage services
│   │   ├── storage.ts
│   │   └── tmdbService.ts
│   ├── hooks/            # Custom React hooks
│   │   └── useContent.ts
│   ├── utils/            # Utility functions
│   │   ├── cn.ts
│   │   └── logger.ts
│   ├── types/            # TypeScript definitions
│   │   ├── metadata.ts
│   │   └── catalog.ts
│   ├── styles/           # Global styles
│   │   └── colors.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global CSS
├── public/               # Static assets
├── index.html            # HTML template
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite config
├── tailwind.config.js    # Tailwind config
└── README.md             # Documentation
```

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Development Tips

### 1. Hot Module Replacement (HMR)

Vite supports HMR, so your changes will reflect instantly without page reload.

### 2. TypeScript

The project uses TypeScript for type safety. VS Code will show type errors inline.

### 3. React DevTools

Install React DevTools browser extension for better debugging:
- Chrome: https://chrome.google.com/webstore
- Firefox: https://addons.mozilla.org/en-US/firefox/

### 4. Network Requests

Open DevTools → Network tab to inspect API calls to TMDB.

### 5. Console Logging

Check the browser console for any errors or logs.

## Building for Production

```bash
# Build the app
npm run build

# Preview the build locally
npm run preview
```

The build output will be in the `dist` directory.

## Deployment

### Deploy to Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel deploy
```

### Deploy to Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
netlify deploy --prod
```

### Deploy to GitHub Pages

1. Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/your-repo-name/',
  // ... rest of config
})
```

2. Build and deploy:
```bash
npm run build
# Then push the dist folder to gh-pages branch
```

## Next Steps

1. **Get TMDB API Key** (if not done)
2. **Customize Themes** in Settings
3. **Add More Features** as needed
4. **Deploy to Production**

## Need Help?

- Check the `MIGRATION_GUIDE.md` for detailed migration info
- Check the `README.md` for general information
- Open an issue on GitHub

## License

MIT License - See LICENSE file for details

