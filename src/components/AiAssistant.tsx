import { useState } from 'react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import ContentCard from './ContentCard';
import type { StreamingContent } from '../types/metadata';
type Result={summary:string;pace?:string;mood?:string;warning?:string;cached?:boolean;items:(StreamingContent&{reason:string})[];sources:{title:string;url:string}[]};
export default function AiAssistant({id,type}:{id?:number;type?:'movie'|'tv'}) {
 const {user,isApproved}=useAuth();const [mode,setMode]=useState('search');const [query,setQuery]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [result,setResult]=useState<Result|null>(null);
 async function submit(){setBusy(true);setError('');setResult(null);try{const r=await apiClient.post('/ai',id?{mode:'guide',id,type}:{mode,query},{timeout:240000});setResult(r.data);}catch(e:any){setError(e.response?.data?.error||'AI tidak tersedia. Pencarian biasa tetap bisa dipakai.');}finally{setBusy(false);}}
 return <section className="rounded-xl border border-white/10 bg-zinc-900 p-4 space-y-3 text-white">
 <h2 className="text-xl font-bold">{id?'Panduan AI tanpa spoiler':'Asisten tontonan AI'}</h2>
 <p className="text-xs text-gray-400">TMDB + penelusuran web. Jawaban AI bisa keliru. Pertanyaan dikirim ke layanan AI/pencarian; jangan masukkan data pribadi. Riwayat tontonan tidak dikirim.</p>
 {!user||!isApproved?<p>Masuk dengan akun disetujui untuk memakai AI.</p>:<form onSubmit={e=>{e.preventDefault();submit();}} className="space-y-3">
 {!id&&<><label className="block text-sm">Mode<select disabled={busy} className="block bg-zinc-800 rounded p-2 w-full" value={mode} onChange={e=>{setMode(e.target.value);setResult(null);}}><option value="search">Cari dengan bahasa sehari-hari</option><option value="mood">Rekomendasi suasana</option><option value="memory">Cari dari ingatan adegan</option></select></label><label className="block text-sm">Ceritakan yang kamu cari<textarea disabled={busy} required minLength={3} maxLength={500} rows={3} className="block bg-zinc-800 rounded p-2 w-full" value={query} onChange={e=>setQuery(e.target.value)} placeholder={mode==='memory'?'Film tentang orang terjebak di bandara':mode==='mood'?'Lagi capek, ingin film ringan dan lucu':'Thriller Korea, film saja, jangan horor'} /></label></>}
 <button disabled={busy} className="bg-primary-600 px-4 py-2 rounded disabled:opacity-50">{busy?'Mencari dan memeriksa sumber…':id?'Buat panduan':'Tanya AI'}</button></form>}
 {error&&<p role="alert" className="text-red-300">{error}</p>}
 {result&&<div aria-live="polite" className="space-y-3"><p className="whitespace-pre-wrap">{result.summary}</p>{result.pace&&<p>Tempo (perkiraan AI): {result.pace}</p>}{result.mood&&<p>Suasana (perkiraan AI): {result.mood}</p>}{result.warning&&<p className="text-amber-200 text-sm">{result.warning}</p>}
 {!!result.items.length&&<div className="grid grid-cols-2 md:grid-cols-3 gap-4">{result.items.map(c=><div key={c.type+c.id}><ContentCard content={c}/><p className="text-sm text-gray-300 mt-2">{c.reason}</p></div>)}</div>}
 <details><summary className="cursor-pointer text-sm">Sumber & transparansi{result.cached?' · hasil cache':''}</summary><p className="text-xs text-gray-400 my-2">Identitas judul diverifikasi di TMDB. Tautan berikut adalah sumber penelusuran, bukan jaminan semua klaim AI benar. Cache publik berlaku 24 jam.</p>{result.sources.map(s=><a className="block text-sm underline break-words my-2" key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>)}</details></div>}
 </section>;
}
