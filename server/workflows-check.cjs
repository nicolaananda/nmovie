const assert = require('node:assert/strict');
const { validateReport, episodeKey } = require('./src/workflows');
assert.throws(()=>validateReport({tmdbId:'../1',mediaType:'movie',title:'A',reason:'SOURCE'}));
assert.throws(()=>validateReport({tmdbId:'1',mediaType:'movie',title:'A',reason:'OTHER',message:'x'.repeat(2001)}));
assert.equal(validateReport({tmdbId:'1',mediaType:'movie',title:'A',reason:'SOURCE'}).tmdbId,'1');
assert.equal(episodeKey({season_number:1,episode_number:2,air_date:'2020-01-01'},new Date('2020-01-02')), '1:2');
assert.equal(episodeKey({season_number:1,episode_number:2,air_date:'2030-01-01'},new Date('2020-01-02')), null);
console.log('Workflow validation passed');
