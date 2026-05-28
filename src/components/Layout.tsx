import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import { useTheme } from '../contexts/ThemeContext';
import Breadcrumb from './Breadcrumb';
import Onboarding from './Onboarding';
import ErrorBoundary from './ErrorBoundary';

export default function Layout() {
  const { currentTheme } = useTheme();
  const location = useLocation();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: currentTheme.colors.darkBackground }}
    >
      <Navigation />
      {/* Onboarding overlay for first-time approved users */}
      <Onboarding />
      <Breadcrumb />
      <main className="container mx-auto px-4 py-6">
        {/* Per-route boundary: a thrown error in one screen no longer
            unmounts the navigation, breadcrumb, or onboarding shell.
            The `key` resets the boundary state on navigation. */}
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
