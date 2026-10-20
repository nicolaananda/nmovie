const fs=require('fs/promises');const path=require('path');
const dir=process.env.AI_CACHE_DIR||'/tmp/nmovie-ai-cache';const file=path.join(dir,'metrics.json');let queue=Promise.resolve();
async function read(){try{return JSON.parse(await fs.readFile(file,'utf8'));}catch{return {requests:0,hits:0,failures:0,ms:0,modelCalls:0,promptTokens:0,completionTokens:0,usageMissing:0,positive:0,negative:0};}}
function record(delta){queue=queue.then(async()=>{const data=await read();for(const [k,v] of Object.entries(delta))data[k]=(data[k]||0)+v;await fs.mkdir(dir,{recursive:true,mode:0o700});await fs.writeFile(file+'.tmp',JSON.stringify(data),{mode:0o600});await fs.rename(file+'.tmp',file);}).catch(()=>{});return queue;}
module.exports={record,read:async()=>{await queue;return read();}};
