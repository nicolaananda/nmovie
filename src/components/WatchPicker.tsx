import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '../services/tmdbService';
import { useCatalog } from '../contexts/CatalogContext';
import ContentCard from './ContentCard';

export default function WatchPicker() {
 const {library}=useCatalog();
 const [type,setType]=useState<'movie'|'tv'>('movie');const [genre,setGenre]=useState('');const [duration,setDuration]=useState('120');const [exclude,setExclude]=useState(true);const [page,setPage]=useState(1);const [started,setStarted]=useState(false);
 const genres=useQuery({queryKey:['picker-genres',type],queryFn:()=>tmdbService.getGenres(type)});
 const result=useQuery({queryKey:['picker',type,genre,duration,page],queryFn:()=>tmdbService.discover(type,{include_adult:false,sort_by:'popularity.desc','vote_count.gte':50,'with_runtime.lte':Number(duration),'with_runtime.gte':1,...(genre?{with_genres:genre}:{}),page}),enabled:started});
 const items=(result.data || []).filter(c=>!exclude || !library.some(l=>l.id===c.id && l.type===c.type && l.category==='WATCHED')).slice(0,6);
 const reset=()=>{setStarted(false);setPage(1);};
 return <section className="rounded-2xl border border-white/10 bg-zinc-900 p-5 space-y-4">
  <h2 className="text-2xl font-bold">Mau nonton apa?</h2>
  <div className="flex flex-wrap gap-3 text-sm">
   <label>Jenis<select className="block bg-zinc-800 p-2 rounded" value={type} onChange={e=>{setType(e.target.value as 'movie'|'tv');setGenre('');reset();}}><option value="movie">Film</option><option value="tv">Serial</option></select></label>
   <label>Genre<select className="block bg-zinc-800 p-2 rounded" value={genre} onChange={e=>{setGenre(e.target.value);reset();}}><option value="">Semua genre</option>{genres.data?.map(g=><option value={g.id} key={g.id}>{g.name}</option>)}</select></label>
   <label>{type==='tv'?'Maks. durasi per episode':'Maks. durasi'}<select className="block bg-zinc-800 p-2 rounded" value={duration} onChange={e=>{setDuration(e.target.value);reset();}}>{[30,60,90,120,180,240].map(m=><option key={m} value={m}>{m} menit</option>)}</select></label>
  </div>
  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={exclude} onChange={e=>setExclude(e.target.checked)} />Sembunyikan yang ditandai selesai di library</label>
  <button disabled={result.isFetching} className="bg-primary-600 rounded px-4 py-2 disabled:opacity-50" onClick={()=>{if(started)setPage(p=>p>=20?1:p+1);setStarted(true);}}>{result.isFetching?'Mencari…':started?'Pilihan lainnya':'Carikan tontonan'}</button>
  {result.isError && <p role="alert">Gagal memuat rekomendasi. <button className="underline" onClick={()=>result.refetch()}>Coba lagi</button></p>}
  {started && !result.isFetching && !result.isError && !items.length && <p>Tidak ada pilihan yang cocok. Ubah genre/durasi atau cari pilihan lainnya.</p>}
  {!!items.length && <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">{items.map(c=><ContentCard key={`${c.type}:${c.id}`} content={c}/>)}</div>}
  <p className="text-xs text-gray-400">Pilihan berdasarkan metadata TMDB; ketersediaan sumber dicek di detail film.</p>
 </section>;
}
