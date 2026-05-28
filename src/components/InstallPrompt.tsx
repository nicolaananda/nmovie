import { useEffect, useState } from 'react';
import { Download, X, Share2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ identifies itself as Macintosh; sniff for the touch flag.
  const iOSUA = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = ua.includes('Macintosh') && 'ontouchend' in document;
  return iOSUA || iPadOS;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // Safari-only legacy flag
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

/**
 * PWA install prompt with two flavors:
 *
 *  - Chromium / Edge / Android: trigger the native `beforeinstallprompt`
 *    flow when the browser fires that event.
 *  - iOS Safari: that event never fires there, so we instead show a
 *    short banner explaining the manual Share → "Add to Home Screen"
 *    flow. Suppressed when the app is already running standalone.
 *
 * Both variants remember dismissals for 7 days so we don't pester users.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosVariant, setIosVariant] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = parseInt(localStorage.getItem(DISMISS_KEY) || '0');
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) {
      return;
    }

    // iOS path: no event, just show the manual instruction after a small
    // delay so it doesn't pop up immediately on first paint.
    if (isIos()) {
      const t = window.setTimeout(() => {
        setIosVariant(true);
        setVisible(true);
      }, 4000);
      return () => window.clearTimeout(t);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!visible) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[9000] max-w-[calc(100vw-2rem)] w-[360px]">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-4 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="shrink-0 p-2 rounded-lg bg-primary-500/20 text-primary-400">
            {iosVariant ? <Share2 size={20} /> : <Download size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">Install N-Movie</h3>
            {iosVariant ? (
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                Tap{' '}
                <span className="inline-flex items-center align-text-bottom">
                  <Share2 size={12} className="mx-0.5" />
                </span>{' '}
                <b className="text-gray-200">Share</b> di Safari, lalu pilih{' '}
                <b className="text-gray-200">"Add to Home Screen"</b>. App akan jalan fullscreen
                seperti aplikasi asli.
              </p>
            ) : (
              <p className="text-gray-400 text-xs mt-0.5">
                Get a faster, full-screen experience right from your home screen.
              </p>
            )}
            <div className="flex gap-2 mt-3">
              {!iosVariant && deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium"
                >
                  Install
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:bg-white/5 text-xs"
              >
                {iosVariant ? 'Got it' : 'Not now'}
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="shrink-0 text-white/40 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
