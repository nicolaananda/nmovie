const router=require('express').Router();
const rateLimit=require('express-rate-limit');
const {protect,approved,admin}=require('../middleware/authMiddleware');
const {answer,validInput}=require('../ai');
router.use(protect,approved,rateLimit({windowMs:3600000,max:20,keyGenerator:req=>String(req.user.id),message:{error:'Batas AI 20 permintaan per jam. Gunakan pencarian biasa.'}}));
const metrics=require('../aiMetrics');
router.get('/stats',admin,async(req,res)=>res.json(await metrics.read()));
router.post('/feedback',async(req,res)=>{if(!['positive','negative'].includes(req.body.rating))return res.status(400).json({error:'Invalid feedback'});await metrics.record({[req.body.rating]:1});res.json({ok:true});});
let active=0;
router.post('/',async(req,res)=>{
 let input;try{input=validInput(req.body);}catch(e){return res.status(400).json({error:e.message});}
 if(active>=4)return res.status(429).json({error:'AI sedang sibuk. Coba lagi sebentar.'});
 const start=Date.now();active++;
 try{const data=await answer(input);await metrics.record({requests:1,hits:data.cached?1:0,ms:Date.now()-start});res.json(data);}catch{await metrics.record({requests:1,failures:1,ms:Date.now()-start});res.status(503).json({error:'AI belum dapat menjawab. Coba lagi atau gunakan pencarian biasa.'});}finally{active--;}
});
module.exports=router;
