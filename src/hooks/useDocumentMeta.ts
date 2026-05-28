import { useEffect } from 'react';

interface Meta {
  /** Page <title>. Falls back to the global default when absent. */
  title?: string;
  /** Description for both search engines and og:description. */
  description?: string;
  /** Absolute image URL for og:image / twitter:image (e.g. a hero banner). */
  image?: string;
  /** Override the og:url; defaults to the current location. */
  url?: string;
  /** og:type — "website" by default, "video.movie" / "video.tv_show" for content pages. */
  type?: string;
}

const DEFAULT_TITLE = 'N-Movie';
const DEFAULT_DESCRIPTION = 'Watch unlimited movies, TV shows, and more.';

function setNamed(name: string, content: string | undefined) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setProperty(prop: string, content: string | undefined) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${prop}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', prop);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Set per-route document title + Open Graph / Twitter card meta tags.
 *
 * Vite/React doesn't have built-in head management, so we mutate
 * document.head directly. Tags added here are removed (or overwritten)
 * when the next page calls the hook with new values.
 *
 * Crawlers that don't run JavaScript won't see these — we'd need SSR or
 * a prerender step for that. But link previews on Discord, WhatsApp,
 * Twitter, and Slack all execute JS sufficiently to pick them up.
 */
export function useDocumentMeta(meta: Meta) {
  const { title, description, image, url, type } = meta;

  useEffect(() => {
    const fullTitle = title ? `${title} · ${DEFAULT_TITLE}` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESCRIPTION;
    const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    const previousTitle = document.title;
    document.title = fullTitle;

    setNamed('description', desc);
    setProperty('og:title', fullTitle);
    setProperty('og:description', desc);
    setProperty('og:type', type || 'website');
    setProperty('og:url', pageUrl);
    setProperty('og:site_name', DEFAULT_TITLE);
    setProperty('og:image', image);
    setNamed('twitter:card', image ? 'summary_large_image' : 'summary');
    setNamed('twitter:title', fullTitle);
    setNamed('twitter:description', desc);
    setNamed('twitter:image', image);

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, image, url, type]);
}
