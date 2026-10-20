function matches(c,f={}) {
 if(f.type && f.type!=='all' && c.type!==f.type)return false;
 if(f.language && c.language!==f.language)return false;
 if(f.maxRuntime && (!Number.isFinite(c.runtime)||c.runtime<=0||c.runtime>f.maxRuntime))return false;
 if(f.year && Number(c.year)!==Number(f.year))return false;
 const ids=(c.genres||[]).map(g=>g.id);
 if(f.genreId && !ids.includes(Number(f.genreId)))return false;
 if((f.excludeGenres||[]).some(id=>ids.includes(Number(id))))return false;
 return true;
}
module.exports={matches};
