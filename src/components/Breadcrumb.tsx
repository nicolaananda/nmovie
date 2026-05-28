import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useT } from '../i18n/I18nContext';

/**
 * Page-level breadcrumb shown in the layout under the navbar.
 *
 * Hidden on the root path so we don't render a lone "Home" pill on the
 * home screen (which already has the navigation surface). Otherwise we
 * show `Home → Section` and translate the labels.
 */
export default function Breadcrumb() {
  const location = useLocation();
  const t = useT();
  const path = location.pathname;

  // Don't show the breadcrumb on the home page — there's nothing to
  // navigate up to and it just creates a duplicate "Home" label.
  if (path === '/' || path === '') return null;

  const sections: { match: (p: string) => boolean; label: string; to?: string }[] = [
    { match: (p) => p.startsWith('/search'), label: t('nav.search'), to: '/search' },
    { match: (p) => p.startsWith('/library'), label: t('nav.library'), to: '/library' },
    { match: (p) => p.startsWith('/history'), label: t('nav.history'), to: '/history' },
    { match: (p) => p.startsWith('/profile'), label: t('nav.profile'), to: '/profile' },
    { match: (p) => p.startsWith('/settings'), label: t('nav.settings'), to: '/settings' },
    { match: (p) => p.startsWith('/admin'), label: t('nav.admin'), to: '/admin' },
    { match: (p) => p.startsWith('/genres'), label: t('nav.genres'), to: '/genres' },
    { match: (p) => p.startsWith('/donate'), label: t('nav.donate'), to: '/donate' },
    { match: (p) => p.startsWith('/metadata'), label: 'Details' },
    { match: (p) => p.startsWith('/streams'), label: 'Sources' },
    { match: (p) => p.startsWith('/player'), label: 'Player' },
  ];

  const current = sections.find((s) => s.match(path));
  if (!current) return null;

  const segments: { label: string; to?: string }[] = [
    { label: t('nav.home'), to: '/' },
    { label: current.label, to: current.to },
  ];

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
