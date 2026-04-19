import { useEffect, useState } from 'react';
import { customSubtitleService, type AdminSubtitle } from '../../services/customSubtitleService';

export default function CustomSubtitleManager() {
  const [subtitles, setSubtitles] = useState<AdminSubtitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [previewId, setPreviewId] = useState<number | null>(null);

  useEffect(() => {
    load();
  }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await customSubtitleService.adminGetAll(filter || undefined);
      setSubtitles(data.subtitles);
    } catch (e) {
      console.error('Failed to load custom subtitles', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await customSubtitleService.adminUpdateStatus(id, status);
      await load();
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this subtitle?')) return;
    try {
      await customSubtitleService.adminDelete(id);
      await load();
    } catch (e) {
      console.error('Failed to delete', e);
    }
  };

  if (loading) return <div className="text-white">Loading subtitles...</div>;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Custom Subtitles</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1 bg-black/20 border border-white/20 rounded text-white text-sm"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      {subtitles.length === 0 && (
        <div className="text-gray-400 text-center py-8">No subtitles found</div>
      )}

      <div className="space-y-3">
        {subtitles.map((sub) => (
          <div key={sub.id} className="p-4 rounded-lg border bg-white/5 border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white">{sub.fileName}</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {sub.language}
                  </span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                    sub.status === 'APPROVED' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    sub.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  TMDB: {sub.tmdbId} • {sub.mediaType}
                  {sub.seasonNumber ? ` • S${sub.seasonNumber}E${sub.episodeNumber}` : ''}
                  {' • by '}{sub.user.name || sub.user.email}
                  {' • '}{new Date(sub.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setPreviewId(previewId === sub.id ? null : sub.id)}
                  className="px-2 py-1 text-xs rounded bg-white/10 text-gray-300 border border-white/10 hover:bg-white/20"
                >
                  Preview
                </button>
                {sub.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleStatus(sub.id, 'APPROVED')}
                      className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatus(sub.id, 'REJECTED')}
                      className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleDelete(sub.id)}
                  className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                >
                  Delete
                </button>
              </div>
            </div>
            {previewId === sub.id && (
              <pre className="mt-3 p-3 bg-black/40 rounded text-xs text-gray-300 max-h-48 overflow-auto whitespace-pre-wrap">
                {sub.content.slice(0, 2000)}{sub.content.length > 2000 ? '\n...(truncated)' : ''}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
