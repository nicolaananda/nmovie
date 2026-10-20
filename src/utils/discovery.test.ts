import { describe, it, expect } from 'vitest';
import { filterSearch } from './discovery';
const items = [
 { id:'1', name:'A', type:'movie', poster:'', genreIds:[28], originalLanguage:'en', year:2020, popularity:2, imdbRating:'8' },
 { id:'2', name:'B', type:'series', poster:'', genreIds:[18], originalLanguage:'ko', year:2021, popularity:5, imdbRating:'9' },
];
describe('search filters', () => {
 it('applies genre and language together', () => expect(filterSearch(items,{type:'all',year:'',genreId:'28',language:'en',sort:'popularity.desc'}).map(x=>x.id)).toEqual(['1']));
 it('sorts without mutating input', () => { expect(filterSearch(items,{type:'all',year:'',genreId:'',language:'',sort:'vote_average.desc'})[0].id).toBe('2'); expect(items[0].id).toBe('1'); });
});
