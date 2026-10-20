const router=require('express').Router();
const rateLimit=require('express-rate-limit');
const {protect,approved}=require('../middleware/authMiddleware');
const {answer,validInput}=require('../ai');
router.use(protect,approved,rateLimit({windowMs:3600000,max:20,keyGenerator:req=>String(req.user.id),message:{error:'Batas AI 20 permintaan per jam. Gunakan pencarian biasa.'}}));
let active=0;
router.post('/',async(req,res)=>{
 let input;try{input=validInput(req.body);}catch(e){return res.status(400).json({error:e.message});}
 if(active>=4)return res.status(429).json({error:'AI sedang sibuk. Coba lagi sebentar.'});
 active++;
 try{res.json(await answer(input));}catch{res.status(503).json({error:'AI belum dapat menjawab. Coba lagi atau gunakan pencarian biasa.'});}finally{active--;}
});
module.exports=router;
