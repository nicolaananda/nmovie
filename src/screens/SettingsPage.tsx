import { useState, useEffect } from 'react';
import { Palette, Info, Code, User, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/* Since we moved to Tailwind only, we don't strictly need useTheme for colors, 
   but if we want to support switching back to a different theme, we might keep it.
   For now, we are forcing the Premium Maroon theme. */

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
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
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-28 px-6 md:px-16 pb-20 max-w-5xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Settings</h1>
      <p className="text-gray-400 mb-12">Manage your preferences and app info.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ACCOUNT SECTION */}
        <div className="glass-panel p-8 rounded-2xl bg-white/5 border border-white/5 md:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-full bg-primary-900/30 text-primary-400">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Account</h2>
              <p className="text-sm text-gray-500">Manage your personal details</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-black/20 border border-white/5 rounded-lg px-4 py-2 text-gray-500 cursor-not-allowed"
              />
            </div>

            {user?.subscriptionEndsAt && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Subscription Expires</label>
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
              Save Changes
            </button>
          </form>
        </div>

        {/* THEME SECTION (Just for show as we enforced Maroon) */}
        <div className="glass-panel p-8 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-full bg-purple-900/30 text-purple-400">
              <Palette size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Appearance</h2>
              <p className="text-sm text-gray-500">Customize look and feel</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-primary-600/50 bg-primary-900/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#720e1e]"></div>
                <span className="font-semibold text-white">Premium Maroon</span>
              </div>
              <span className="text-xs font-bold bg-primary-600 px-2 py-1 rounded text-white">ACTIVE</span>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E50914]"></div>
                <span className="font-semibold text-gray-400">Netflix Red</span>
              </div>
            </div>
          </div>
        </div>

        {/* ABOUT SECTION */}
        <div className="glass-panel p-8 rounded-2xl bg-white/5 border border-white/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-full bg-blue-900/30 text-blue-400">
              <Info size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">About N-Movie</h2>
              <p className="text-sm text-gray-500">Version info</p>
            </div>
          </div>

          <div className="space-y-4 text-gray-300">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span>Version</span>
              <span className="font-mono text-gray-500">2.0.0 (Maroon)</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span>Build</span>
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
