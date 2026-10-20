const assert=require('node:assert/strict');
if (!process.env.DATABASE_URL?.endsWith('/nmovie_test') || !process.env.DATABASE_URL.includes('127.0.0.1')) throw Error('Isolated test database required');
process.env.JWT_SECRET='isolated-workflow-test';
const prisma=require('./src/prisma');const jwt=require('jsonwebtoken');const axios=require('axios');
const app=require('./src/app');
(async()=>{
 const stamp=Date.now();const users=[];let server;
 try {
  for (const role of ['ADMIN','USER','USER']) users.push(await prisma.user.create({data:{email:`workflow-${stamp}-${users.length}@example.invalid`,password:'unused',role,status:'APPROVED'}}));
  server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const call=async(user,path,method='GET',body)=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+jwt.sign({id:user.id},process.env.JWT_SECRET)}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};};
  const [admin,user,other]=users;
  assert.equal((await call(null,'/workflows/follows')).status,401);
  assert.equal((await call(user,'/workflows/summary')).status,403);
  assert.equal((await call(user,'/workflows/reports','POST',{tmdbId:'bad'})).status,400);
  const body={tmdbId:'1399',mediaType:'series',title:'Fixture Series',season:1,episode:2,reason:'SOURCE',message:'Fixture only'};
  const report=await call(user,'/workflows/reports','POST',body);assert.equal(report.status,201);
  assert.equal((await call(user,'/workflows/reports','POST',body)).status,409);
  assert.equal((await call(other,`/workflows/reports/${report.data.id}`,'PATCH',{status:'DONE'})).status,403);
  assert.equal((await call(admin,`/workflows/reports/${report.data.id}`,'PATCH',{status:'IN_PROGRESS'})).status,200);
  assert.ok((await call(admin,'/workflows/reports?status=IN_PROGRESS')).data.some(r=>r.id===report.data.id));
  assert.equal((await call(user,'/workflows/follows/1399','PUT',{title:'Fixture Series'})).status,200);
  await call(user,'/workflows/follows/1399','PUT',{title:'Fixture Series'});
  assert.equal((await call(user,'/workflows/follows')).data.length,1);
  await call(other,'/workflows/follows/1399','DELETE');assert.equal((await call(user,'/workflows/follows')).data.length,1);
  for (const category of ['WATCHING','DROPPED','WATCHED']) {
   const r=await call(user,'/library','POST',{tmdbId:'tmdb:1399',type:'series',name:'Fixture Series',category});assert.ok([200,201].includes(r.status));assert.equal((await call(user,'/library')).data[0].category,category);
  }
  process.env.TMDB_API_KEY='fixture';const originalGet=axios.get;
  axios.get=async()=>({data:{last_episode_to_air:{season_number:1,episode_number:2,air_date:'2020-01-01'}}});
  await prisma.seriesFollow.updateMany({where:{userId:user.id},data:{lastEpisode:'1:1',checkedAt:new Date(0)}});
  const {checkEpisodes}=require('./src/episodeNotifications');
  await Promise.all([checkEpisodes(),checkEpisodes()]);
  await prisma.seriesFollow.updateMany({where:{userId:user.id},data:{checkedAt:new Date(0)}});await checkEpisodes();axios.get=originalGet;
  const notes=await prisma.notification.findMany({where:{userId:user.id,type:'NEW_CONTENT'}});assert.equal(notes.length,1);assert.ok(notes[0].href.includes('season=1&episode=2'));assert.ok(notes[0].message.includes('belum diverifikasi'));
  assert.equal((await call(admin,'/workflows/summary')).status,200);
  await call(user,'/workflows/follows/1399','DELETE');assert.equal((await call(user,'/workflows/follows')).data.length,0);
  console.log('PASS: real isolated PostgreSQL; auth, validation, report lifecycle, follow ownership/idempotency, library persistence, episode notification dedupe/link');
 } finally {if(server)server.close();await prisma.user.deleteMany({where:{id:{in:users.map(u=>u.id)}}});await prisma.$disconnect();}
})().catch(e=>{console.error(e);process.exitCode=1;});
