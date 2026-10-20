const axios = require('axios');
const prisma = require('./prisma');
const {episodeKey} = require('./workflows');
let running = false;
async function checkEpisodes() {
 if (running || !process.env.TMDB_API_KEY) return;
 running = true;
 try {
  const follows = await prisma.seriesFollow.findMany({where:{checkedAt:{lt:new Date(Date.now()-3600000)},user:{status:'APPROVED'}},orderBy:{checkedAt:'asc'},take:200});
  const cache = new Map();
  for (const f of follows) {
   try {
    if (!cache.has(f.tmdbId)) cache.set(f.tmdbId,(await axios.get(`https://api.themoviedb.org/3/tv/${f.tmdbId}`,{params:{api_key:process.env.TMDB_API_KEY},timeout:10000})).data);
    const e = cache.get(f.tmdbId).last_episode_to_air;
    const key = episodeKey(e);
    await prisma.$transaction(async tx => {
     const claim = await tx.seriesFollow.updateMany({where:{id:f.id,checkedAt:f.checkedAt},data:{checkedAt:new Date(),...(key ? {lastEpisode:key} : {})}});
     if (!claim.count || !key || key === f.lastEpisode) return;
     // ponytail: first check establishes a baseline; later aired episodes notify, not stream availability.
     if (!f.lastEpisode && (!e.air_date || e.air_date < f.createdAt.toISOString().slice(0,10))) return;
     await tx.notification.create({data:{userId:f.userId,type:'NEW_CONTENT',title:`Episode baru: ${f.title}`,message:`S${e.season_number}E${e.episode_number} sudah tayang menurut TMDB. Ketersediaan sumber belum diverifikasi.`,href:`/metadata/series/tmdb:${f.tmdbId}?season=${e.season_number}&episode=${e.episode_number}`}});
    });
   } catch { console.warn('Episode check failed for follow',f.id); }
  }
 } finally {running=false;}
}
function startEpisodeChecks() {
 const run=()=>checkEpisodes().catch(()=>console.warn('Episode notification scan failed'));
 run();setInterval(run,300000).unref();
}
module.exports={checkEpisodes,startEpisodeChecks};
