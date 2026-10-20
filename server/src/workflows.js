function validateReport(b) {
 if (!b || !/^\d{1,10}$/.test(b.tmdbId) || !['movie','series'].includes(b.mediaType) || typeof b.title !== 'string' || !b.title.trim() || b.title.length > 250 || !['SOURCE','WRONG_TITLE','SUBTITLE','EPISODE','OTHER'].includes(b.reason) || (b.message != null && (typeof b.message !== 'string' || b.message.length > 2000))) throw Object.assign(new Error('Invalid report'), {status:400});
 for (const k of ['season','episode']) if (b[k] != null && (!Number.isInteger(b[k]) || b[k] < 1 || b[k] > 10000)) throw Object.assign(new Error('Invalid episode'),{status:400});
 return {tmdbId:String(b.tmdbId),mediaType:b.mediaType,title:b.title.trim(),reason:b.reason,message:b.message || '',season:b.mediaType === 'series' ? b.season : null,episode:b.mediaType === 'series' ? b.episode : null};
}
function episodeKey(e, now = new Date()) {
 if (!e || !Number.isInteger(e.season_number) || !Number.isInteger(e.episode_number) || e.season_number < 1 || e.episode_number < 1 || !/^\d{4}-\d{2}-\d{2}$/.test(e.air_date || '') || e.air_date > now.toISOString().slice(0,10)) return null;
 return `${e.season_number}:${e.episode_number}`;
}
module.exports = {validateReport,episodeKey};
