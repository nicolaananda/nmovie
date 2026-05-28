import { useState, useEffect } from 'react';
import { Palette, Info, Code, User, Save, Loader2, Globe } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { supportedLocales } from '../i18n/translations';

/* Since we moved to Tailwind only, we don't strictly need useTheme for colors, 
   but if we want to support switching back to a different theme, we might keep it.
   For now, we are forcing the Premium Maroon theme. */

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const [name, setName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);
    try {
      await updateProfile(name);
      setMessage({ type: 'success', text: t('settings.profileUpdated') });
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.profileUpdateFailed') });
    } finally {
      setIsUpdating(false);
    }
  };

  const { currentTheme, availableThemes, setCurrentTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-28 px-6 md:px-16 pb-20 max-w-5xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{t('settings.title')}</h1>
      <p className="text-gray-400 mb-12">{t('settings.subtitle')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ACCOUNT SECTION */}
        <div className="glass-panel p-8 rounded-2xl bg-white/5 border border-white/5 md:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-full bg-primary-900/30 text-primary-400">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('settings.account')}</h2>
              <p className="text-sm text-gray-500">{t('settings.accountDesc')}</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">{t('settings.fullName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                placeholder={t('settings.fullName')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">{t('settings.email')}</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-black/20 border border-white/5 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
              />
            </div>

            {user?.subscriptionEndsAt && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">{t('settings.subscriptionExpires')}</label>
                <input
                  type="text"
                  value={new Date(user.subscriptionEndsAt).toLocaleDateString()}
                  disabled
                  className="w-full bg-black/20 border border-primary-900/30 rounded-lg px-4 py-2 text-primary-400 cursor-not-allowed font-medium"
                />
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdating}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {t('settings.saveChanges')}
            </button>
          </form>
        </div>

        {/* LANGUAGE SECTION */}
        <div className="glass-panel p-8 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-full bg-sky-900/30 text-sky-400">
              <Globe size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('settings.language')}</h2>
              <p className="text-sm text-gray-500">{t('settings.languageDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {supportedLocales.map((loc) => {
              const active = loc.code === locale;
              return (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => setLocale(loc.code)}
                  aria-pressed={active}
                  className={`glass-panel p-4 rounded-lg border text-left flex items-center gap-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    active ? 'border-primary-600 bg-primary-900/10' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-2xl" aria-hidden>{loc.flag}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm">{loc.name}</div>
                    <div className="text-[11px] text-gray-500 uppercase">{loc.code}</div>
                  </div>
                  {active && (
                    <span className="text-[10px] font-bold bg-primary-600 px-1.5 py-0.5 rounded text-white">
                      ACTIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* THEME SECTION (Theme Selector) */}
        <div className="glass-panel p-8 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-full bg-purple-900/30 text-purple-400">
              <Palette size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('settings.appearance')}</h2>
              <p className="text-sm text-gray-500">{t('settings.appearanceDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {availableThemes.map((t) => {
              const active = t.id === currentTheme.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCurrentTheme(t.id)}
                  aria-pressed={active}
                  aria-label={`Use ${t.name} theme`}
                  className={`glass-panel p-4 rounded-lg border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                    active ? 'border-primary-600 bg-primary-900/10' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2 w-full justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.primary }} />
                      <span className="font-semibold text-white">{t.name}</span>
                    </div>
                    {active && (
                      <span className="text-[10px] font-bold bg-primary-600 px-1.5 py-0.5 rounded text-white">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.primary }} />
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.secondary }} />
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.darkBackground }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ABOUT SECTION */}
        <div className="glass-panel p-8 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-full bg-blue-900/30 text-blue-400">
              <Info size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('settings.about')}</h2>
              <p className="text-sm text-gray-500">{t('settings.aboutDesc')}</p>
            </div>
          </div>

          <div className="space-y-4 text-gray-300">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span>{t('settings.version')}</span>
              <span className="font-mono text-gray-500">2.0.0 (Maroon)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span>{t('settings.build')}</span>
              <span className="font-mono text-gray-500">Production</span>
            </div>
            <div className="pt-4 text-sm text-gray-500 leading-relaxed">
              Redesigned for a premium immersive experience. <br />
              Powered by TMDB and scraped providers.
            </div>
          </div>
        </div>

        {/* DEV INFO */}
        <div className="glass-panel p-8 rounded-2xl bg-white/5 border border-white/5 md:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-full bg-green-900/30 text-green-400">
              <Code size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Developer</h2>
              <p className="text-sm text-gray-500">Tech stack details</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['React', 'Vite', 'Tailwind', 'Typescript'].map(tech => (
              <div key={tech} className="bg-black/40 rounded-lg p-3 text-center text-gray-400 text-sm font-medium border border-white/5">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
