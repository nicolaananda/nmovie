import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import { useTheme } from '../contexts/ThemeContext';

export default function Layout() {
  const { currentTheme } = useTheme();

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: currentTheme.colors.darkBackground }}
    >
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

