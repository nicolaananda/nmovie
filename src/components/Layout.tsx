import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import { useTheme } from '../contexts/ThemeContext';
import Breadcrumb from './Breadcrumb';
import Onboarding from './Onboarding';

export default function Layout() {
  const { currentTheme } = useTheme();

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
        <Outlet />
      </main>
    </div>
  );
}
