import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb() {
  const location = useLocation();
  const path = location.pathname;

  // Map known routes to human-friendly labels
  const segments: { label: string; to?: string }[] = [];
  // Home always first
  segments.push({ label: 'Home', to: '/' });

  if (path.startsWith('/search')) segments.push({ label: 'Search', to: '/search' });
  else if (path.startsWith('/library')) segments.push({ label: 'Library', to: '/library' });
  else if (path.startsWith('/history')) segments.push({ label: 'History', to: '/history' });
  else if (path.startsWith('/profile')) segments.push({ label: 'Profile', to: '/profile' });
  else if (path.startsWith('/settings')) segments.push({ label: 'Settings', to: '/settings' });
  else if (path.startsWith('/admin')) segments.push({ label: 'Admin', to: '/admin' });
  else if (path.startsWith('/player') || path.startsWith('/streams') || path.startsWith('/metadata')) {
    segments.push({ label: path.startsWith('/metadata') ? 'Content Details' : path.startsWith('/streams') ? 'Select Stream' : 'Player' });
  }

  return (
    <nav className="pt-4 pb-2 px-4 md:px-0" aria-label="Breadcrumb">
      <div className="max-w-7xl mx-auto flex items-center space-x-2 text-sm text-gray-500">
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1;
          if (isLast) {
            return (
              <span key={idx} className="text-xs text-gray-500 uppercase tracking-wider">
                {seg.label}
              </span>
            );
          }
          return (
            <span key={idx} className="flex items-center space-x-2">
              <Link to={seg.to || '#'} className="text-gray-500 hover:text-white text-sm">
                {seg.label}
              </Link>
              <ChevronRight size={14} />
            </span>
          );
        })}
      </div>
    </nav>
  );
}
