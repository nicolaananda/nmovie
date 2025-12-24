import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Library, Settings, Menu, X, LogIn, LogOut, Shield } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/search', icon: Search, label: 'Search' },
    { to: '/library', icon: Library, label: 'Library' },
  ];

  if (user) {
    navItems.push({ to: '/settings', icon: Settings, label: 'Settings' });
  }

  if (isAdmin) {
    navItems.push({ to: '/admin', icon: Shield, label: 'Admin' });
  }

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent',
          isScrolled || isMobileMenuOpen
            ? 'bg-[#0f0f0f]/80 backdrop-blur-xl border-white/5 shadow-2xl'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group z-50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center shadow-lg shadow-primary-900/40 group-hover:scale-105 transition-transform duration-300">
                <span className="text-xl font-black text-white">N</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Movie
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 bg-white/5 p-1.5 rounded-full border border-white/5 backdrop-blur-sm">
              {navItems.map(({ to, icon: Icon, label }) => {
                const isActive = currentPath === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      'relative px-6 py-2.5 rounded-full flex items-center gap-2 transition-all duration-300',
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon size={18} className={cn('transition-transform', isActive && 'scale-110')} />
                    <span className="font-medium text-sm">{label}</span>
                  </Link>
                );
              })}

              {/* Auth Button */}
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="relative px-6 py-2.5 rounded-full flex items-center gap-2 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  <LogOut size={18} />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="relative px-6 py-2.5 rounded-full flex items-center gap-2 text-white bg-primary-600 hover:bg-primary-700 transition-all duration-300 shadow-lg shadow-primary-900/30"
                >
                  <LogIn size={18} />
                  <span className="font-medium text-sm">Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors z-50"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-[#0f0f0f] md:hidden transition-all duration-300 flex items-center justify-center',
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        )}
      >
        <div className="flex flex-col gap-4 w-full px-8">
          {navItems.map(({ to, icon: Icon, label }, idx) => (
            <Link
              key={to}
              to={to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border border-white/5 transition-all duration-300 transform',
                currentPath === to
                  ? 'bg-primary-600 text-white border-primary-500/50 shadow-lg shadow-primary-900/40 translate-x-2'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:translate-x-2'
              )}
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              <Icon size={24} />
              <span className="text-lg font-bold">{label}</span>
            </Link>
          ))}

          {user ? (
            <button
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
                navigate('/login');
              }}
              className="flex items-center gap-4 p-4 rounded-xl border border-white/5 transition-all duration-300 transform bg-white/5 text-red-400 hover:bg-red-500/10 hover:translate-x-2 mt-4"
            >
              <LogOut size={24} />
              <span className="text-lg font-bold">Logout</span>
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-4 p-4 rounded-xl border border-white/5 transition-all duration-300 transform bg-primary-600 text-white shadow-lg shadow-primary-900/40 translate-x-2 mt-4"
            >
              <LogIn size={24} />
              <span className="text-lg font-bold">Login</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
