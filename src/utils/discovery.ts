import type { StreamingContent } from '../types/metadata';
export function filterSearch(items: StreamingContent[], f: {type:string;year:string;genreId:string;language:string;sort:string}) {
 return items.filter(c => (f.type === 'all' || c.type === (f.type === 'tv' ? 'series' : f.type)) && (!f.year || String(c.year) === f.year) && (!f.genreId || c.genreIds?.includes(Number(f.genreId))) && (!f.language || c.originalLanguage === f.language))
 .sort((a,b) => f.sort === 'vote_average.desc' ? Number(b.imdbRating || 0)-Number(a.imdbRating || 0) : f.sort.includes('date') ? (b.released || '').localeCompare(a.released || '') : (b.popularity || 0)-(a.popularity || 0));
}
