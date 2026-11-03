import http from 'node:http';
import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync} from 'node:fs';
import {randomBytes,createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {createDefaultBuilding,getContestState,toDateKey,toMonthKey} from './data.mjs';
const dir=resolve(process.env.DATA_DIR||'./data');mkdirSync(dir,{recursive:true,mode:0o700});const file=dir+'/state.json';
let db=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{profiles:[],contests:[],building:createDefaultBuilding(),credentials:{}};
function save(){writeFileSync(file+'.tmp',JSON.stringify(db),{mode:0o600});renameSync(file+'.tmp',file)}
function settle(c){if(c.winnerId||getContestState(c)!=='closed')return;const counts={};Object.values(c.votes).forEach(id=>counts[id]=(counts[id]||0)+1);const id=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]||a.localeCompare(b))[0];if(id){c.winnerId=id;const p=db.profiles.find(p=>p.id===id);if(p){p.stars++;p.wins++}}}
function reconcile(){db.offWorkTime='18:00';db.contests.forEach(c=>{c.offWorkTime=db.offWorkTime;c.startsAt=new Date(c.date+(c.period==='morning'?'T09:00:00+08:00':'T14:00:00+08:00')).toISOString();c.endsAt=c.customDeadline??c.deadlineOverride??new Date(c.date+'T'+(c.period==='morning'?'12:00':'18:00')+':00+08:00').toISOString()});db.contests.forEach(settle);save()}
const hash=s=>createHash('sha256').update(s).digest('hex');
const normalizeName=s=>s.normalize('NFKC').replace(/\s+/gu,'').toLowerCase();
db.nicknameOwners??={};for(const p of db.profiles)db.nicknameOwners[hash(normalizeName(p.nickname))]??=p.id;
function nameTaken(name,id){const owner=db.nicknameOwners[hash(normalizeName(name))];return owner&&owner!==id}

function state(id){reconcile();return {profiles:db.profiles,contests:db.contests,building:db.building,offWorkTime:db.offWorkTime,currentUserId:id&&db.userPhones?.[id]?id:null}}
const root=resolve('dist');const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'};
const attempts=new Map();
http.createServer(async(req,res)=>{const json=(v,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(v))};try{
db.devices??={};
let deviceToken=(req.headers.cookie??'').split(';').map(s=>s.trim()).find(s=>s.startsWith('moyu-device='))?.slice(12);
if(!deviceToken||!/^[-_a-zA-Z0-9]{43}$/.test(deviceToken)){deviceToken=randomBytes(32).toString('base64url');res.setHeader('Set-Cookie',`moyu-device=${deviceToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000`)}
const deviceKey=hash(deviceToken);const boundUser=db.devices[deviceKey];
const url=new URL(req.url,'http://localhost');const credential=(req.headers.authorization||'').replace(/^Bearer /,'');const tokenUser=db.credentials[hash(credential)];if(boundUser&&tokenUser&&boundUser!==tokenUser)return json({error:'此浏览器已绑定其他账号，请使用原账号'},403);
const id=boundUser??tokenUser;if(tokenUser&&!boundUser){db.devices[deviceKey]=tokenUser;save()}
if(url.pathname.startsWith('/api/')){
 if(req.method==='GET'&&url.pathname==='/api/state')return json(state(id));
 if(req.method!=='POST')return json({error:'方法不支持'},405);
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>65536)return json({error:'请求过大'},413)}const body=JSON.parse(raw||'{}');
 if(url.pathname==='/api/login'){
 const ip=req.socket.remoteAddress;const bucket=attempts.get(ip)||{n:0,t:Date.now()};if(Date.now()-bucket.t>60000){bucket.n=0;bucket.t=Date.now()}attempts.set(ip,bucket);if(++bucket.n>30)return json({error:'请稍后重试'},429);
 const phone=String(body.phone??'').trim().replace(/^\+86[ -]?/,'').replace(/[ -]/g,'');if(!/^1[3-9]\d{9}$/.test(phone))return json({error:'请输入有效的11位手机号'},400);
 db.phones??={};db.userPhones??={};const phoneKey=hash(phone);const existingId=db.phones[phoneKey];
 if(id&&db.userPhones[id]&&db.userPhones[id]!==phoneKey)return json({error:'本浏览器已绑定其他手机号，请使用原手机号登录'},403);
 if(id&&!db.userPhones[id]&&existingId&&existingId!==id)return json({error:'此手机号已有账号，不能覆盖本浏览器原有身份'},409);
 let uid=existingId??(id&&!db.userPhones[id]?id:null);
 const prefixes=['云游','午后','悠闲','慢半拍','隐身','放空'];const animals=['墨鱼','海獭','水母','海豹','狐狸','小熊'];let name='';do{name=prefixes[randomBytes(1)[0]%prefixes.length]+animals[randomBytes(1)[0]%animals.length]+randomBytes(2).readUInt16BE().toString().padStart(5,'0')}while(nameTaken(name));
 if(!uid){uid=randomBytes(12).toString('hex');db.profiles.push({id:uid,nickname:name,code:'',timeSlots:[],locations:[],bestSpot:'',avoidanceTip:'',motto:'今天也要优雅地墨鱼。',color:'#84988a',stars:0,wins:0,starMonth:toMonthKey(new Date()),joinedAt:toDateKey(new Date())});db.nicknameOwners[hash(normalizeName(name))]=uid;}
 else if(!db.userPhones[uid]){db.profiles.find(p=>p.id===uid).nickname=name;db.nicknameOwners[hash(normalizeName(name))]=uid;}
 db.phones[phoneKey]=uid;db.userPhones[uid]=phoneKey;db.devices[deviceKey]=uid;const token=randomBytes(32).toString('base64url');db.credentials[hash(token)]=uid;save();return json({credential:token,data:state(uid)})}
 if(!id||!db.userPhones?.[id])return json({error:'请先使用手机号登录'},401);reconcile();const p=body.payload,c=db.contests.find(c=>c.id===p?.id);
 switch(body.action){
 case 'deleteContest':{
 if(!c)return json({error:'评比不存在或已删除'},404);
 if(c.createdBy!==id)return json({error:'只有发起人可以删除该评比'},403);
 (db.deletedContests??=[]).push({...c,deletedAt:new Date().toISOString(),deletedBy:id});
 if(c.winnerId){const winner=db.profiles.find(p=>p.id===c.winnerId);if(winner){winner.wins=Math.max(0,winner.wins-1);if(c.date.slice(0,7)===winner.starMonth)winner.stars=Math.max(0,winner.stars-1)}}
 db.contests=db.contests.filter(item=>item.id!==c.id);save();return json(state(id));
 } 
 case 'settings':return json({error:'场次截止时间固定为上午12:00、下午18:00'},400);
 case 'rename':{const name=String(p.nickname??'').trim();if(name.length<2||name.length>16)return json({error:'昵称需要2—16个字'},400);if(nameTaken(name,id))return json({error:'该昵称已被使用，请换一个'},409);db.profiles.find(p=>p.id===id).nickname=name;db.nicknameOwners[hash(normalizeName(name))]=id;break;}
 case 'profile':{if(typeof p.nickname==='string'){const name=p.nickname.trim();if(name.length<2||name.length>16||nameTaken(name,id))return json({error:'昵称无效或已被使用'},409);p.nickname=name;db.nicknameOwners[hash(normalizeName(name))]=id;}const user=db.profiles.find(p=>p.id===id);for(const key of ['nickname','bestSpot','avoidanceTip','motto'])if(typeof p[key]==='string')user[key]=p[key].slice(0,key==='nickname'?16:500);for(const key of ['timeSlots','locations'])if(Array.isArray(p[key]))user[key]=p[key].slice(0,12).map(v=>String(v).slice(0,80));if(/^#[0-9a-f]{6}$/i.test(p.color))user.color=p.color;break}
 case 'join':{
 if(!c||!['live','upcoming'].includes(getContestState(c)))return json({error:'本场报名已截止'},400);
 const e=p.entry;if(!e||typeof e.location!=='string'||!e.location.trim()||e.location.length>80||typeof e.time!=='string'||!e.time.trim()||e.time.length>80||!Number.isInteger(e.avoidanceCount)||e.avoidanceCount<0||e.avoidanceCount>9999||typeof e.content!=='string'||!e.content.trim()||e.content.length>1000)return json({error:'请完整填写地点、时间、躲避领导次数和墨鱼内容'},400);
 const alias=String(e.nickname??db.profiles.find(p=>p.id===id).nickname).trim();if(alias.length<2||alias.length>16)return json({error:'参赛昵称需要2—16个字'},400);if(Object.entries(c.entries??{}).some(([uid,entry])=>uid!==id&&normalizeName(entry.nickname??db.profiles.find(p=>p.id===uid)?.nickname??'')===normalizeName(alias)))return json({error:'本场已有相同参赛昵称，请换一个'},409);
 c.entries??={};c.entries[id]={nickname:alias,location:e.location.trim(),time:e.time.trim(),avoidanceCount:e.avoidanceCount,content:e.content.trim(),submittedAt:new Date().toISOString()};break;
 }
 case 'vote':if(!c||!c.entries?.[id]||!c.entries?.[p.candidateId]||getContestState(c)!=='live'||p.candidateId===id||!db.profiles.some(x=>x.id===p.candidateId))return json({error:'当前无法投票'},400);c.votes[id]=p.candidateId;break;
 case 'contest':{
 const title=String(p.title||'').trim();if(title.length<4||title.length>28)return json({error:'评比名称需要4—28个字'},400);
 const normalizeTitle=s=>s.normalize('NFKC').replace(/\s+/gu,'').toLowerCase();
 const existing=[...db.contests,...(db.deletedContests??[])].find(c=>normalizeTitle(c.title)===normalizeTitle(title));if(existing)return json({error:'该名称已被使用，请进入已有评比，或使用其他名称',existingId:existing.id},409);
 if(p.id)return json({error:'创建接口不允许修改已有评比'},403);
 const date=String(p.date);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!['morning','afternoon'].includes(p.period)||date<toDateKey(new Date()))return json({error:'请选择今天或以后的有效日期'},400);
 const midnight=new Date(date+'T00:00:00+08:00');if(!Number.isFinite(midnight.getTime()))return json({error:'日期无效'},400);
 const key=date+'-'+p.period+'-'+randomBytes(8).toString('hex');
 const startsAt=new Date(date+(p.period==='morning'?'T09:00:00+08:00':'T14:00:00+08:00')).toISOString();
 const cutoff=p.cutoff??(p.period==='morning' ? '12:00' : '18:00');
 if(typeof cutoff!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(cutoff))return json({error:'截止时间格式无效'},400);
 const endsAt=new Date(date+'T'+cutoff+':00+08:00').toISOString();
 if(Date.parse(endsAt)<=Math.max(Date.parse(startsAt),Date.now()))return json({error:'已过本场截止时间，请选择其他场次或未来日期'},400);
 db.contests.unshift({id:key,date,period:p.period,title,startsAt,endsAt,customDeadline:endsAt,entries:{},votes:{},createdBy:id});save();return json({id:key,data:state(id)});
 }
 case 'settle':if(c)settle(c);break;
 case 'building':if(!Number.isSafeInteger(p.floors)||p.floors<1||!Number.isInteger(p.companyFloor)||p.companyFloor<1||p.companyFloor>p.floors||!Array.isArray(p.spots)||p.spots.length>100)return json({error:'楼宇参数无效'},400);if(p.companyFloors!==undefined&&(!Array.isArray(p.companyFloors)||!p.companyFloors.length||p.companyFloors.some(f=>!Number.isSafeInteger(f)||f<1||f>p.floors)))return json({error:'公司楼层无效'},400);if(p.excludedPlaces!==undefined&&(!Array.isArray(p.excludedPlaces)||p.excludedPlaces.some(n=>typeof n!=='string'||!n.trim())))return json({error:'删除地点记录无效'},400);if(p.spots.some(s=>typeof s.id!=='string'||typeof s.name!=='string'||!s.name.trim()||!Number.isSafeInteger(s.floor)||s.floor<1||s.floor>p.floors||!Number.isFinite(s.x)||!Number.isFinite(s.z)))return json({error:'藏点参数无效'},400);db.building={...p,companyFloors:[...new Set(p.companyFloors??[p.companyFloor])]};break;
 default:return json({error:'未知操作'},400)
 }save();return json(state(id));
}
if(req.method!=='GET')return json({error:'方法不支持'},405);let path=resolve(root,'.'+decodeURIComponent(url.pathname));if(!path.startsWith(root+'/')&&path!==root)return json({error:'禁止访问'},403);if(!existsSync(path)||!extname(path))path=root+'/index.html';const content=readFileSync(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':path.includes('/assets/')?'public,max-age=31536000,immutable':'no-cache'});res.end(content);
}catch{json({error:'请求处理失败'},400)}}).listen(Number(process.env.PORT||3088),'0.0.0.0');
