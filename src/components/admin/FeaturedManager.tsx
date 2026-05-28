import { useEffect, useState } from 'react';
import { Plus, Trash2, Star } from 'lucide-react';
import { featuredService, type FeaturedContent } from '../../services/featuredService';
import { useToast } from '../../contexts/ToastContext';

/**
 * Admin-only manager for the homepage hero banner. Each featured row
 * has a TMDB id, banner override, optional description, and optional
 * scheduling window (startsAt / endsAt). HomePage picks the most recent
 * active row that's currently in its window.
 */
export default function FeaturedManager() {
  const toast = useToast();
  const [items, setItems] = useState<FeaturedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Partial<FeaturedContent>>({
    mediaType: 'movie',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await featuredService.adminList();
      setItems(data);
    } catch (e) {
      console.error('Failed to load featured', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.tmdbId || !draft.title) {
      toast.warning('TMDB ID and title are required');
      return;
    }
    setSubmitting(true);
    try {
      await featuredService.adminCreate(draft);
      toast.success('Featured entry created');
      setDraft({ mediaType: 'movie', isActive: true });
      await load();
    } catch (err) {
      console.error(err);
      toast.error('Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (item: FeaturedContent) => {
    try {
      await featuredService.adminUpdate(item.id, { isActive: !item.isActive });
      await load();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update');
    }
  };

  const remove = async (item: FeaturedContent) => {
    const ok = await toast.confirm({
      title: 'Delete featured entry?',
      message: `Remove "${item.title}" from the homepage banner pool?`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await featuredService.adminDelete(item.id);
      await load();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="text-yellow-400" size={18} />
          <h3 className="text-lg font-semibold text-white">Featured / Hero Banner</h3>
        </div>
      </div>

      {/* Create form */}
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 md:grid-cols-6 gap-2 p-3 rounded-lg bg-black/30 border border-white/5 mb-4 text-xs"
      >
        <select
          value={draft.mediaType ?? 'movie'}
          onChange={(e) => setDraft((d) => ({ ...d, mediaType: e.target.value }))}
          className="bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white"
        >
          <option value="movie">Movie</option>
          <option value="tv">TV</option>
        </select>
        <input
          type="text"
          placeholder="TMDB ID"
          value={draft.tmdbId ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, tmdbId: e.target.value }))}
          className="bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white md:col-span-1"
        />
        <input
          type="text"
          placeholder="Title"
          value={draft.title ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          className="bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white md:col-span-2"
        />
        <input
          type="text"
          placeholder="Badge (optional)"
          value={draft.badge ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, badge: e.target.value }))}
          className="bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white"
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-1 bg-primary-600 hover:bg-primary-700 text-white rounded px-3 py-1.5 font-semibold disabled:opacity-50"
        >
          <Plus size={14} /> Add
        </button>
        <input
          type="text"
          placeholder="Banner URL (override, optional)"
          value={draft.banner ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, banner: e.target.value }))}
          className="bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white md:col-span-3"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={draft.description ?? ''}
          onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          className="bg-black/40 border border-white/10 rounded px-2 py-1.5 text-white md:col-span-3"
        />
      </form>

      {loading ? (
        <div className="text-xs text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-gray-500">
          No featured entries yet. The homepage falls back to trending[0].
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-white/5 border-white/10"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/30 text-gray-400 shrink-0">
                  {item.mediaType}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{item.title}</div>
                  <div className="text-[10px] text-gray-500">
                    TMDB: {item.tmdbId}
                    {item.badge ? ` · ${item.badge}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(item)}
                  className={`px-2 py-1 text-[10px] font-bold rounded border ${
                    item.isActive
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : 'bg-white/5 text-gray-400 border-white/10'
                  }`}
                >
                  {item.isActive ? 'ACTIVE' : 'INACTIVE'}
                </button>
                <button
                  onClick={() => remove(item)}
                  aria-label="Delete"
                  className="p-1.5 rounded text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
