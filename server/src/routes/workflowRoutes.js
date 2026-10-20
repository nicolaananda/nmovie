const router = require('express').Router();
const prisma = require('../prisma');
const {protect,approved,admin} = require('../middleware/authMiddleware');
const {validateReport} = require('../workflows');
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
router.use(protect, approved);
router.post('/reports', wrap(async(req,res) => {
 const data = validateReport(req.body);
 const recent = await prisma.contentReport.findFirst({where:{userId:req.user.id,tmdbId:data.tmdbId,mediaType:data.mediaType,reason:data.reason,status:{not:'DONE'},season:data.season ?? null,episode:data.episode ?? null}});
 if (recent) return res.status(409).json({error:'Laporan serupa masih diproses.'});
 const count = await prisma.contentReport.count({where:{userId:req.user.id,createdAt:{gte:new Date(Date.now()-3600000)}}});
 if (count >= 10) return res.status(429).json({error:'Maksimal 10 laporan per jam.'});
 res.status(201).json(await prisma.contentReport.create({data:{...data,userId:req.user.id}}));
}));
router.get('/reports',admin,wrap(async(req,res) => {
 const status = req.query.status || 'NEW';
 if (!['NEW','IN_PROGRESS','DONE'].includes(status)) return res.status(400).json({error:'Invalid status'});
 res.json(await prisma.contentReport.findMany({where:{status},orderBy:{createdAt:'desc'},take:100}));
}));
router.patch('/reports/:id',admin,wrap(async(req,res) => {
 const id = Number(req.params.id); const status = req.body.status;
 if (!Number.isSafeInteger(id) || id<1 || !['NEW','IN_PROGRESS','DONE'].includes(status)) return res.status(400).json({error:'Invalid report status'});
 const result = await prisma.contentReport.updateMany({where:{id},data:{status}});
 if (!result.count) return res.status(404).json({error:'Report not found'});
 res.json({status});
}));
router.get('/summary',admin,wrap(async(req,res) => {
 const [pendingUsers,reports,pendingSubtitles] = await Promise.all([
 prisma.user.count({where:{status:'PENDING'}}),prisma.contentReport.count({where:{status:{not:'DONE'}}}),prisma.customSubtitle.count({where:{status:'PENDING'}})]);
 res.json({pendingUsers,reports,pendingSubtitles});
}));
router.get('/follows',wrap(async(req,res) => res.json(await prisma.seriesFollow.findMany({where:{userId:req.user.id},orderBy:{createdAt:'desc'}}))));
router.put('/follows/:tmdbId',wrap(async(req,res) => {
 const {tmdbId} = req.params; const {title} = req.body;
 if (!/^\d{1,10}$/.test(tmdbId) || typeof title !== 'string' || !title.trim() || title.length >250) return res.status(400).json({error:'Invalid series'});
 if (await prisma.seriesFollow.count({where:{userId:req.user.id}})>=200) return res.status(400).json({error:'Maksimal mengikuti 200 serial.'});
 res.json(await prisma.seriesFollow.upsert({where:{userId_tmdbId:{userId:req.user.id,tmdbId}},create:{userId:req.user.id,tmdbId,title:title.trim()},update:{title:title.trim()}}));
}));
router.delete('/follows/:tmdbId',wrap(async(req,res) => {
 await prisma.seriesFollow.deleteMany({where:{userId:req.user.id,tmdbId:req.params.tmdbId}});res.json({ok:true});
}));
module.exports = router;
