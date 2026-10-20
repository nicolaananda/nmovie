import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import type { StreamingContent } from '../types/metadata';

export default function ContentActions({content, season, episode}: {content:StreamingContent;season?:number;episode?:number}) {
 const {user,isApproved}=useAuth(); const toast=useToast(); const cache=useQueryClient();
 const [open,setOpen]=useState(false); const [reason,setReason]=useState('SOURCE'); const [message,setMessage]=useState('');
 const tmdbId=String(content.tmdbId || content.id.replace('tmdb:',''));
 const follows=useQuery<{tmdbId:string}[]>({queryKey:['follows',user?.id],queryFn:async()=>(await apiClient.get('/workflows/follows')).data,enabled:!!user && isApproved && content.type==='series'});
 const following=follows.data?.some(f=>f.tmdbId===tmdbId);
 const follow=useMutation({mutationFn:()=>following ? apiClient.delete(`/workflows/follows/${tmdbId}`) : apiClient.put(`/workflows/follows/${tmdbId}`,{title:content.name}),onSuccess:()=>{cache.invalidateQueries({queryKey:['follows',user?.id]});toast.success(following?'Berhenti mengikuti serial':'Serial diikuti. Notifikasi untuk episode yang sudah tayang, bukan jaminan sumber tersedia.');},onError:()=>toast.error('Gagal memperbarui serial. Coba lagi.')});
 const report=useMutation({mutationFn:()=>apiClient.post('/workflows/reports',{tmdbId,mediaType:content.type,title:content.name,season,episode,reason,message}),onSuccess:()=>{setOpen(false);setMessage('');toast.success('Laporan terkirim ke admin.');},onError:(e:any)=>toast.error(e.response?.data?.error || 'Laporan gagal dikirim. Coba lagi.')});
 if (!user || !isApproved) return <p className="text-sm text-gray-400">Masuk dengan akun disetujui untuk mengikuti serial dan melaporkan masalah.</p>;
 return <div className="space-y-3">
  <div className="flex flex-wrap gap-3">
   {content.type==='series' && <button className="px-4 py-2 rounded border border-white/20 disabled:opacity-50" disabled={follow.isPending || follows.isLoading || follows.isError} onClick={()=>follow.mutate()}>{follows.isError?'Gagal memuat status serial':following?'Berhenti ikuti serial':'Ikuti serial'}</button>}
   <button className="px-4 py-2 rounded border border-white/20" aria-expanded={open} onClick={()=>setOpen(!open)}>Laporkan masalah</button>
  </div>
  {follows.isError && <button onClick={()=>follows.refetch()}>Coba muat status lagi</button>}
  {open && <form className="p-4 rounded-xl bg-zinc-900 space-y-3" onSubmit={e=>{e.preventDefault();report.mutate();}}>
   <p className="text-sm">{content.name}{content.type==='series'?` · S${season}E${episode}`:''}</p>
   <label className="block">Masalah<select className="block w-full bg-zinc-800 p-2 rounded mt-1" value={reason} onChange={e=>setReason(e.target.value)}><option value="SOURCE">Sumber tidak bisa diputar</option><option value="WRONG_TITLE">Film salah</option><option value="SUBTITLE">Subtitle salah</option><option value="EPISODE">Episode tidak lengkap</option><option value="OTHER">Lainnya</option></select></label>
   <label className="block">Keterangan<textarea maxLength={2000} rows={3} className="block w-full bg-zinc-800 p-2 rounded mt-1" value={message} onChange={e=>setMessage(e.target.value)} placeholder="Contoh: nama sumber dan pesan error. Jangan kirim password." /></label>
   <button disabled={report.isPending} className="bg-primary-600 px-4 py-2 rounded disabled:opacity-50">{report.isPending?'Mengirim…':'Kirim laporan'}</button>
  </form>}
 </div>;
}
