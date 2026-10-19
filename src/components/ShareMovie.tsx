export default function ShareMovie({ type, id, title }: { type: string; id: string; title: string }) {
  const url = `https://ghzm.us/metadata/${type === 'movie' ? 'movie' : 'series'}/tmdb:${id.replace('tmdb:', '')}`;
  return <div className="space-y-2 text-sm">
    <button className="rounded-lg border border-white/20 px-4 py-2 text-white hover:bg-white/10" onClick={async () => {
      try {
        if (navigator.share) await navigator.share({ title, url });
        else { await navigator.clipboard.writeText(url); window.alert('Link film disalin'); }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) window.prompt('Salin link film:', url);
      }
    }}>Bagikan film</button>
    <p className="text-gray-300">Disarankan memakai <a className="underline text-orange-300" href="https://brave.com/download/" target="_blank" rel="noopener noreferrer">Browser Brave</a> untuk membantu memblokir iklan dan pelacak. Jika player bermasalah, periksa pengaturan Shields.</p>
  </div>;
}
