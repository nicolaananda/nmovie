import { Heart, ExternalLink, Mail, Server, Globe, Database } from 'lucide-react';
import { useT } from '../i18n/I18nContext';
import { DONATION_PLATFORMS, ADMIN_EMAIL } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export default function DonatePage() {
  const t = useT();
  const { user } = useAuth();

  useDocumentMeta({
    title: t('donate.title'),
    description: t('donate.subtitle'),
  });

  const platforms = DONATION_PLATFORMS.filter((p) => p.url);

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-24 pb-32 md:pb-20 px-6 md:px-16">
      <div className="max-w-3xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex p-4 rounded-full bg-primary-500/10 text-primary-400 mb-4">
            <Heart size={32} className="fill-current" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
            {t('donate.title')}
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto leading-relaxed">
            {t('donate.subtitle')}
          </p>
        </div>

        {/* Why box */}
        <div className="glass-panel p-6 md:p-8 rounded-2xl bg-white/5 border border-white/5 mb-8">
          <h2 className="text-xl font-bold text-white mb-3">{t('donate.why')}</h2>
          <p className="text-gray-300 leading-relaxed">{t('donate.whyDesc')}</p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-lg bg-black/20 border border-white/5">
              <Server className="mx-auto text-primary-400 mb-2" size={20} />
              <div className="text-xs text-gray-400">VPS · Bandwidth</div>
            </div>
            <div className="p-4 rounded-lg bg-black/20 border border-white/5">
              <Globe className="mx-auto text-primary-400 mb-2" size={20} />
              <div className="text-xs text-gray-400">Domain · CDN</div>
            </div>
            <div className="p-4 rounded-lg bg-black/20 border border-white/5">
              <Database className="mx-auto text-primary-400 mb-2" size={20} />
              <div className="text-xs text-gray-400">TMDB · API quota</div>
            </div>
          </div>
        </div>

        {/* Platforms */}
        {platforms.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4">{t('donate.platforms')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group glass-panel p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-lg font-bold bg-gradient-to-r ${p.color} bg-clip-text text-transparent`}>
                      {p.name}
                    </div>
                    <ExternalLink size={16} className="text-gray-500 group-hover:text-white" />
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{p.description}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary-400 group-hover:text-primary-300">
                    {t('donate.donateOn', { platform: p.name })}
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-8 p-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 text-sm">
            Donation links aren't configured yet. Set <code className="px-1.5 py-0.5 rounded bg-black/30">VITE_DONATE_TRAKTEER</code>,
            <code className="px-1.5 py-0.5 rounded bg-black/30 mx-1">VITE_DONATE_SAWERIA</code>, or
            <code className="px-1.5 py-0.5 rounded bg-black/30 ml-1">VITE_DONATE_KOFI</code> in your env.
          </div>
        )}

        {/* Thanks + supporter badge contact */}
        <div className="glass-panel p-6 rounded-2xl bg-primary-900/10 border border-primary-500/20">
          <p className="text-gray-300 leading-relaxed">{t('donate.thanks')}</p>
          <a
            href={`mailto:${ADMIN_EMAIL}?subject=N-Movie%20Supporter%20-%20${encodeURIComponent(user?.email ?? '')}`}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium border border-white/10"
          >
            <Mail size={16} />
            {t('donate.contactAdmin')} · {ADMIN_EMAIL}
          </a>
        </div>

        {/* If already a supporter, show their status */}
        {user?.isSupporter && (
          <div className="mt-6 flex items-center justify-center gap-2 text-primary-400 text-sm">
            <Heart size={14} className="fill-current" />
            <span className="font-semibold">{t('donate.supporterBadge')}</span>
            {user.supporterSince && (
              <span className="text-gray-500">
                · {t('donate.supporterSince', { date: new Date(user.supporterSince).toLocaleDateString() })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
