# Nuvio Web - Streaming Platform

A modern web application for streaming movies and TV shows, built with React, TypeScript, and Vite.

## Features

- 🎬 Browse movies and TV shows (powered by TMDB)
- 🔍 Search functionality with real-time results
- 📚 Personal library management
- 🎨 Multiple theme options (6 built-in themes)
- 📱 Responsive design (mobile, tablet, desktop)
- 🎥 Integrated video player with React Player
- 🎯 Streaming integration with Nuvio Providers
- ⚡ Fast and optimized with Vite
- 💾 Local storage for user preferences
- 🔄 React Query for efficient data fetching

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **Zustand** - State management
- **React Player** - Video playback
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Navigate to the web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open your browser and visit `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
web/
├── src/
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React contexts
│   ├── screens/        # Page components
│   ├── services/       # API and storage services
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   ├── styles/         # Global styles and themes
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # App entry point
│   └── index.css       # Global CSS
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory, ready to be deployed to any static hosting service.

## Deployment

You can deploy this app to various platforms:

- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **GitHub Pages**: Configure in repository settings
- **Any static hosting**: Upload the `dist` folder

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required: TMDB API Key for movie/TV data
VITE_TMDB_API_KEY=your_tmdb_api_key

# Provider URL (default: Nuvio Providers GitHub)
VITE_PROVIDER_URL=https://raw.githubusercontent.com/tapframe/nuvio-providers/refs/heads/main

# App Configuration
VITE_APP_NAME=Nuvio
VITE_APP_VERSION=1.0.0
```

### Getting TMDB API Key

1. Sign up at https://www.themoviedb.org/ (free)
2. Go to Settings → API
3. Request an API Key (select "Developer")
4. Copy your API Key (v3 auth)
5. Add it to your `.env` file

## Provider Integration

The app uses Nuvio Providers for streaming:
- Source: https://github.com/tapframe/nuvio-providers
- Provides streams for movies and TV shows
- Automatic quality detection
- Multiple provider support

For more details, see [PROVIDER_INTEGRATION.md](./PROVIDER_INTEGRATION.md)

## Documentation

- **README.md** - This file (general information)
- **SETUP.md** - Detailed setup guide
- **DEPLOYMENT_GUIDE.md** - Production deployment guide (LiteSpeed/Apache/Nginx)
- **POSTGRESQL_VPS_SETUP.md** - PostgreSQL setup guide for VPS
- **POSTGRES_QUICKSTART.md** - PostgreSQL quick reference
- **MIGRATION_GUIDE.md** - Technical migration details
- **PROVIDER_INTEGRATION.md** - Provider integration guide
- **RINGKASAN_INDONESIA.md** - Indonesian summary
- **setup-postgres.sh** - Automated PostgreSQL setup script

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the documentation files
- Open an issue on GitHub
- Review browser console for errors

