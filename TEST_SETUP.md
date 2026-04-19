Performance and code quality: Vitest setup for frontend tests

Overview
- This document describes a lightweight frontend test setup using Vitest and React Testing Library for a Vite + React + TS project.

What you need to run locally
- Node.js 18+ and npm/yarn/pnpm
- The following dev dependencies (to be installed by you):
- vitest, @testing-library/react, @testing-library/jest-dom, jsdom

Steps to enable tests (no runtime dependencies added automatically)
1) Add devDependencies in package.json (manually or via your package manager):
- "vitest": "^X.Y.Z",
- "@testing-library/react": "^13.0.0",
- "@testing-library/jest-dom": "^5.0.0",
- "jsdom": "^20.0.0"
2) Add a test script to package.json:
"test": "vitest run --config vitest.config.ts"
3) Create vitest.config.ts at project root with basic config for TS and React:
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  plugins: [react()],
})
4) Create a simple setup file at src/test/setup.ts to configure testing-library:
import '@testing-library/jest-dom'
5) Example tests:
- A simple component test in src/components/__tests__/Hello.test.tsx
- A hook test in src/hooks/__tests__/useCounter.test.ts

Example test: a basic React component
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../../App'

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    // basic assertion to ensure mount works; adjust to actual UI
    expect(screen.getByText(/Nuvio/i)).toBeTruthy()
  })
})

Notes
- Do not modify production behavior just to satisfy tests. Tests should be non-invasive and safe.
