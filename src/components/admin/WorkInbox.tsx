import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../contexts/ToastContext';
interface Report {id:number;tmdbId:string;mediaType:string;title:string;reason:string;message:string;season?:number;episode?:number;status:string;createdAt:string}
const statuses=[['NEW','Baru'],['IN_PROGRESS','Diproses'],['DONE','Selesai']];
const reasons:Record<string,string>={SOURCE:'Sumber mati',WRONG_TITLE:'Judul salah',SUBTITLE:'Subtitle salah',EPISODE:'Episode tidak lengkap',OTHER:'Lainnya'};
export default function WorkInbox({onUsers,onSubtitles}: {onUsers:()=>void;onSubtitles:()=>void}) {
 const [status,setStatus]=useState('NEW'); const [open,setOpen]=useState(false);const cache=useQueryClient();const toast=useToast();
 const summary=useQuery<{pendingUsers:number;reports:number;pendingSubtitles:number}>({queryKey:['work-summary'],queryFn:async()=>(await apiClient.get('/workflows/summary')).data,refetchInterval:30000});
 const reports=useQuery<Report[]>({queryKey:['reports',status],queryFn:async()=>(await apiClient.get('/workflows/reports',{params:{status}})).data,enabled:open});
 const update=useMutation({mutationFn:({id,status}:{id:number;status:string})=>apiClient.patch(`/workflows/reports/${id}`,{status}),onSuccess:()=>{cache.invalidateQueries({queryKey:['reports']});cache.invalidateQueries({queryKey:['work-summary']});},onError:()=>toast.error('Gagal mengubah status laporan.')});
 return <section className="mb-6 rounded-xl border border-white/10 p-4 space-y-4">
  <h2 className="text-lg font-bold">Perlu ditangani</h2>
  {summary.isError ? <button onClick={()=>summary.refetch()}>Gagal memuat ringkasan. Coba lagi</button> : <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{[
   ['Akun menunggu',summary.data?.pendingUsers,onUsers],['Laporan terbuka',summary.data?.reports,()=>setOpen(!open)],['Subtitle menunggu',summary.data?.pendingSubtitles,onSubtitles],
  ].map(([label,count,click])=><button key={String(label)} className="text-left bg-white/5 hover:bg-white/10 rounded-lg p-3" onClick={click as ()=>void}><span className="block text-2xl font-bold">{count === undefined?'…':String(count)}</span>{String(label)} →</button>)}</div>}
  <button className="underline text-sm" onClick={()=>setOpen(!open)} aria-expanded={open}>{open?'Tutup laporan':'Kelola semua laporan'}</button>
  {open && <div className="space-y-3"><label>Status <select className="bg-zinc-800 p-2 rounded" value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
   {reports.isLoading && <p>Memuat laporan…</p>}{reports.isError && <button onClick={()=>reports.refetch()}>Gagal memuat laporan. Coba lagi</button>}
   {reports.data?.length===0 && <p className="text-gray-400">Tidak ada laporan pada status ini.</p>}
   {reports.data?.map(r=><article className="border border-white/10 rounded p-3 space-y-2" key={r.id}>
    <Link className="font-semibold underline" to={`/metadata/${r.mediaType}/tmdb:${r.tmdbId}${r.season?`?season=${r.season}&episode=${r.episode || 1}`:''}`}>{r.title}{r.season?` · S${r.season}E${r.episode}`:''}</Link>
    <p className="text-sm text-gray-400">{reasons[r.reason] || r.reason} · {new Date(r.createdAt).toLocaleString()}</p><p className="break-words whitespace-pre-wrap">{r.message}</p>
    <label className="text-sm">Status laporan <select disabled={update.isPending} aria-label={`Status laporan ${r.id}`} className="bg-zinc-800 p-2 rounded" value={r.status} onChange={e=>update.mutate({id:r.id,status:e.target.value})}>{statuses.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
   </article>)}
   {reports.data?.length===100 && <p>Menampilkan 100 laporan terbaru. Selesaikan laporan untuk menampilkan antrean berikutnya.</p>}
  </div>}
 </section>;
}
