'use strict';
/* ===== data: player profile, economy, persistence, and the Firebase online layer ===== */
const BOOSTS={
  mut2:{name:_t("Sorte de Mutação ×2"),desc:_t("Dobra a chance de mutação na próxima partida."),price:1500},
  mut15:{name:_t("Sorte de Mutação ×1,5"),desc:_t("+50% de chance de mutação na próxima partida."),price:700},
  var2:{name:_t("Sorte de Variante ×2"),desc:_t("Variantes raras saem com o dobro de peso."),price:1200},
  var15:{name:_t("Sorte de Variante ×1,5"),desc:_t("Variantes raras saem com +50% de peso."),price:600},
  comfort:{name:_t("Barriga Blindada"),desc:_t("Cólicas e paredes tiram metade do conforto."),price:500},
  zone:{name:_t("Faixa Verde Larga"),desc:_t("A faixa verde do trono fica 35% mais larga."),price:400},
  lock:{name:_t("Tranca Extra"),desc:_t("Se você perder uma batida, a porta aguenta uma vez."),price:900}
};
const INSTANT_SELL=.7,MAX_LVL=50;
const PROTO=4; // data format version; older clients can't receive Verities that use it
const itemBase=it=>VARS[it.v].base*MUT_BY[it.m].mult*FUSE[it.f||0].val;
const itemValue=it=>Math.round(itemBase(it)*(1+.08*((it.lvl||1)-1)));
const upCost=it=>Math.round(itemBase(it)*.12*Math.pow(1.09,(it.lvl||1)-1));
const sellPrice=it=>Math.round(itemValue(it)*INSTANT_SELL);
const itemRank=it=>(it.f||0)*1000+MUT_BY[it.m].i*100+VARS[it.v].r*10+VARS[it.v].base/100000;
const itemPower=it=>Math.round(POW_BY_RAR[VARS[it.v].r]*(MUT_POW[it.m]||1)*(1+.06*((it.lvl||1)-1))*FUSE[it.f||0].pow);
const xpAt=L=>Math.round(60*Math.pow(L-1,1.8));
function levelOf(xp){let L=1;while(L<200&&xp>=xpAt(L+1))L++;return L}

/* ---------- profile ---------- */
const PKEY='verity-perfil';
let P=null;
function newProfile(){return{ver:3,uid:null,username:'',money:0,xp:0,best:0,runs:0,items:[],unknown:[],feat:null,featManual:false,pets:[],world:{max:1,beaten:[],cur:1},rolos:0,rebirths:0,title:'',daily:{last:'',streak:0},missions:{day:'',list:[],bonus:false},museum:{ids:[],last:0},ach:{},codes:[],seen:[],ann:{t:'',at:0},
  owned:{skin:[],hair:[],hat:[],glasses:[],shirt:[],bath:[1],intr:[]},eq:{...DEFAULT_EQ},boosts:{},friends:[],settled:[],updatedAt:0,
  stats:{maxCombo:0,invaded:0,importedClaude:false}}}
function sanitizeItem(it){
  if(!it||typeof it!=='object'||!VARS[it.v]||VARS[it.v].hidden||!MUT_BY[it.m])return null;
  return{id:String(it.id||rid()).replace(/[^a-z0-9]/gi,'').slice(0,24)||rid(),v:it.v,m:it.m,lvl:clamp(Math.round(+it.lvl||1),1,MAX_LVL),f:clamp(Math.round(+it.f||0),0,2),s:Math.max(0,Math.round(+it.s||0)),t:+it.t||Date.now(),...(it.fav?{fav:1}:{})};
}
function sanitizeProfile(d){
  const p=newProfile(); if(!d||typeof d!=='object')return p;
  for(const k of['uid','username'])if(typeof d[k]==='string')p[k]=d[k].slice(0,40);
  if(d.uid===null)p.uid=null;
  for(const k of['money','xp','best','runs','updatedAt'])p[k]=Math.max(0,Math.round(+d[k]||0));
  // Verities this version doesn't know (from a newer version) are kept untouched in p.unknown, never dropped.
  const seen=new Set(),keepRaw=x=>x&&typeof x==='object'&&typeof x.v==='string'&&typeof x.m==='string';
  if(Array.isArray(d.items))for(const raw of d.items){const it=sanitizeItem(raw);if(it){if(!seen.has(it.id)){seen.add(it.id);p.items.push(it)}}else if(keepRaw(raw))p.unknown.push(raw)}
  if(Array.isArray(d.unknown))for(const raw of d.unknown){const it=sanitizeItem(raw);if(it){if(!seen.has(it.id)){seen.add(it.id);p.items.push(it)}}else if(keepRaw(raw))p.unknown.push(raw)}
  p.unknown=p.unknown.slice(0,500);
  p.feat=typeof d.feat==='string'?d.feat:null; p.featManual=!!d.featManual;
  if(d.owned&&typeof d.owned==='object')for(const c of Object.keys(p.owned))if(Array.isArray(d.owned[c]))p.owned[c]=d.owned[c].filter(x=>typeof x==='string'||typeof x==='number');
  if(d.eq&&typeof d.eq==='object')for(const c of Object.keys(p.eq))if(d.eq[c]!=null)p.eq[c]=d.eq[c];
  if(d.boosts&&typeof d.boosts==='object')for(const k of Object.keys(BOOSTS))p.boosts[k]=Math.max(0,Math.round(+d.boosts[k]||0));
  if(Array.isArray(d.pets))p.pets=d.pets.filter(x=>typeof x==='string'&&p.items.some(i=>i.id===x)).slice(0,5);
  if(d.world&&typeof d.world==='object'){p.world.max=clamp(Math.round(+d.world.max||1),1,WORLDS.length);p.world.cur=clamp(Math.round(+d.world.cur||1),1,p.world.max);if(Array.isArray(d.world.beaten))p.world.beaten=[...new Set(d.world.beaten.map(Number).filter(n=>n>=1&&n<=WORLDS.length))];if(p.world.beaten.length)p.world.max=clamp(Math.max(p.world.max,Math.max(...p.world.beaten)+1),1,WORLDS.length)}
  if(Array.isArray(d.friends))p.friends=d.friends.filter(x=>typeof x==='string').slice(0,200);
  if(Array.isArray(d.settled))p.settled=d.settled.filter(x=>typeof x==='string').slice(-400);
  if(d.stats&&typeof d.stats==='object')Object.assign(p.stats,d.stats);
  p.rolos=Math.max(0,Math.round(+d.rolos||0)); p.rebirths=clamp(Math.round(+d.rebirths||0),0,999); p.title=typeof d.title==='string'?d.title.slice(0,30):'';
  if(d.daily&&typeof d.daily==='object')p.daily={last:String(d.daily.last||'').slice(0,10),streak:Math.max(0,Math.round(+d.daily.streak||0))};
  if(d.missions&&typeof d.missions==='object'&&Array.isArray(d.missions.list))p.missions={day:String(d.missions.day||''),bonus:!!d.missions.bonus,list:d.missions.list.filter(m=>m&&typeof m.k==='string').slice(0,3).map(m=>({k:m.k,n:+m.n||1,prog:+m.prog||0,claimed:!!m.claimed}))};
  if(d.museum&&typeof d.museum==='object')p.museum={ids:(Array.isArray(d.museum.ids)?d.museum.ids:[]).filter(x=>typeof x==='string'&&p.items.some(i=>i.id===x)).slice(0,20),last:+d.museum.last||0};
  if(d.ach&&typeof d.ach==='object')for(const [k,v] of Object.entries(d.ach))if(typeof k==='string'&&v)p.ach[k]=+v||1;
  if(Array.isArray(d.codes))p.codes=d.codes.filter(x=>typeof x==='string').slice(0,200);
  if(Array.isArray(d.seen))p.seen=d.seen.filter(x=>typeof x==='string'&&VARS[x]).slice(0,200);
  if(d.ann&&typeof d.ann==='object')p.ann={t:String(d.ann.t||'').slice(0,90),at:+d.ann.at||0};
  ensureFree(p); return p;
}
function ensureFree(p){
  for(const c of Object.keys(COS))for(const [k,it] of Object.entries(COS[c].items))if(it.price===0&&!p.owned[c].includes(k))p.owned[c].push(k);
  if(!p.owned.bath.includes(1))p.owned.bath.unshift(1);
  for(const [k,it] of Object.entries(INTRUDERS))if(it.price===0&&!p.owned.intr.includes(k))p.owned.intr.push(k);
  for(const c of Object.keys(COS))if(!p.owned[c].includes(p.eq[c]))p.eq[c]=DEFAULT_EQ[c];
  if(!p.owned.bath.includes(p.eq.bath))p.eq.bath=1;
  if(!p.owned.intr.includes(p.eq.intr))p.eq.intr='irmao';
}
function loadProfile(){
  let d=null; try{d=JSON.parse(localStorage.getItem(PKEY)||'null')}catch(e){}
  P=sanitizeProfile(d);
  if(!P.pets.length&&P.items.length)autoTeam();
  if(!d){
    try{
      const old=JSON.parse(localStorage.getItem('verity-colecao')||'null');
      if(old&&Array.isArray(old.items)){P.items=old.items.map(sanitizeItem).filter(Boolean);P.best=Math.max(0,+old.best||0)}
      const ob=parseInt(localStorage.getItem('verity-best')||'0',10)||0; if(ob>P.best)P.best=ob;
    }catch(e){}
  }
}
function saveProfile(){
  P.updatedAt=Date.now();
  if(!SMOKE_RUN)try{localStorage.setItem(PKEY,JSON.stringify(P))}catch(e){}
  schedulePush();
  if(typeof onProfileChange==='function')onProfileChange();
}
const featured=()=>P.items.find(i=>i.id===P.feat)||mostValuable();
const mostValuable=()=>P.items.reduce((b,i)=>!b||itemValue(i)>itemValue(b)?i:b,null);
const rarest=()=>P.items.reduce((b,i)=>!b||itemRank(i)>itemRank(b)?i:b,null);
const totalValue=(items=P.items)=>items.reduce((s,i)=>s+itemValue(i),0);
const level=()=>levelOf(P.xp);
const petSlots=()=>{const b=Math.max(P.world.beaten.length,P.stats.maxBeaten||0);return 3+[3,6,20,40].filter(n=>b>=n).length};
const team=()=>P.pets.map(id=>P.items.find(i=>i.id===id)).filter(Boolean).slice(0,petSlots());
const teamPower=(items=team())=>Math.round(items.reduce((s,i)=>s+itemPower(i),0)*rbPow());
function petBonus(items=team()){
  const b={speed:0,xp:0,zone:0,comfort:0,door:0,mutluck:0,varluck:0,dmg:0,regen:0,income:0};
  for(const it of items){const a=VARS[it.v].abil;if(!a)continue;const k=1+(it.f||0)*.5;
    if(a[0]==='all'){for(const t of['speed','xp','zone','comfort','mutluck','varluck','dmg'])b[t]+=a[1]*k}else b[a[0]]+=a[1]*k}
  b.comfort=Math.min(b.comfort,.6); return b;
}
function autoTeam(){P.pets=[...P.items].sort((a,b)=>itemPower(b)-itemPower(a)).slice(0,petSlots()).map(i=>i.id)}
function togglePet(id){
  if(P.pets.includes(id)){P.pets=P.pets.filter(x=>x!==id);saveProfile();return _t("Saiu da equipe.")}
  const it=P.items.find(i=>i.id===id); if(!it)return _t("Verity não encontrada.");
  let msg=_t("Entrou na equipe!");
  if(team().length>=petSlots()){const weak=team().reduce((w,i)=>!w||itemPower(i)<itemPower(w)?i:w,null);P.pets=P.pets.filter(x=>x!==weak.id);msg=_t("Entrou no lugar de {0}.",fullName(weak.v,weak.m,weak.f))}
  P.pets.push(id); saveProfile(); return msg;
}
const sameKind=(a,b)=>a.v===b.v&&a.m===b.m&&(a.f||0)===(b.f||0);
const fuseCost=it=>Math.round(itemBase(it)*.5);
function fuseGroup(it){return P.items.filter(x=>sameKind(x,it))}
// the 5 that a fusion uses: this one plus the 4 least important copies (not favorites, not in the team, lowest level first)
function fuseUsed(it){const rest=fuseGroup(it).filter(x=>x.id!==it.id).sort((a,b)=>((a.fav?1:0)-(b.fav?1:0))||(P.pets.includes(a.id)-P.pets.includes(b.id))||(a.lvl-b.lvl));return[it,...rest.slice(0,4)]}
function fuseItem(id){
  const it=P.items.find(i=>i.id===id); if(!it)return _t("Verity não encontrada.");
  if((it.f||0)>=2)return _t("Essa já está no nível máximo de fusão.");
  const grp=fuseGroup(it); if(grp.length<5)return _t("Precisa de 5 iguais. Você tem {0}.",grp.length);
  const cost=fuseCost(it); if(P.money<cost)return _t("Dinheiro insuficiente.");
  const used=fuseUsed(it),ids=used.map(x=>x.id);
  P.money-=cost; P.items=P.items.filter(x=>!ids.includes(x.id));
  const wasPet=ids.some(x=>P.pets.includes(x)); P.pets=P.pets.filter(x=>!ids.includes(x));
  if(ids.includes(P.feat)){P.feat=null;P.featManual=false}
  const out={id:rid(),v:it.v,m:it.m,f:(it.f||0)+1,lvl:Math.max(...used.map(x=>x.lvl)),s:Math.max(...used.map(x=>x.s)),t:Date.now(),...(used.some(x=>x.fav)?{fav:1}:{})};
  P.items.push(out); if(wasPet||team().length<petSlots())P.pets.push(out.id);
  track('fuse'); saveProfile(); LAST_FUSED=out.id; return '';
}
let LAST_FUSED=null;

/* ---------- economy actions (return an error string, or '' on success) ---------- */
function spend(n){if(P.money<n)return _t("Dinheiro insuficiente.");P.money-=n;return ''}
function buyCos(cat,k){const it=COS[cat].items[k];if(!it||P.owned[cat].includes(k))return _t("Indisponível.");const e=spend(it.price);if(e)return e;P.owned[cat].push(k);P.eq[cat]=k;saveProfile();return ''}
function equipCos(cat,k){if(!P.owned[cat].includes(k))return _t("Você não tem esse item.");P.eq[cat]=k;saveProfile();return ''}
function buyBoost(k,n=1){const b=BOOSTS[k];n=Math.max(1,Math.floor(n));if(!b)return _t("Indisponível.");const e=spend(b.price*n);if(e)return e;P.boosts[k]=(P.boosts[k]||0)+n;saveProfile();return ''}
function buyBath(n){const b=bathOf(n);if(P.owned.bath.includes(n))return _t("Você já tem.");if(!P.owned.bath.includes(n-1))return _t("Compre o banheiro anterior primeiro.");const e=spend(b.price);if(e)return e;P.owned.bath.push(n);P.eq.bath=n;saveProfile();return ''}
function equipBath(n){if(!P.owned.bath.includes(n))return _t("Você não tem esse banheiro.");P.eq.bath=n;saveProfile();return ''}
function buyIntr(k){const it=INTRUDERS[k];if(!it||P.owned.intr.includes(k))return _t("Indisponível.");const e=spend(it.price);if(e)return e;P.owned.intr.push(k);P.eq.intr=k;saveProfile();return ''}
function equipIntr(k){if(!P.owned.intr.includes(k))return _t("Você não tem esse invasor.");P.eq.intr=k;saveProfile();return ''}
function sellItem(id){const i=P.items.findIndex(x=>x.id===id);if(i<0)return _t("Verity não encontrada.");const it=P.items[i],v=sellPrice(it);P.items.splice(i,1);P.pets=P.pets.filter(x=>x!==id);P.museum.ids=P.museum.ids.filter(x=>x!==id);if(P.feat===id){P.feat=null;P.featManual=false}P.money+=v;P.stats.sold=(P.stats.sold||0)+1;saveProfile();return ''}
/* cost of n upgrades in a row, and how many levels the money can buy right now */
function upCostN(it,n){let c=0;for(let l=it.lvl;l<Math.min(MAX_LVL,it.lvl+n);l++)c+=upCost({...it,lvl:l});return c}
function upMax(it){let n=0,c=0;for(let l=it.lvl;l<MAX_LVL;l++){const k=upCost({...it,lvl:l});if(c+k>P.money)break;c+=k;n++}return n}
function upgradeItem(id,n=1){const it=P.items.find(x=>x.id===id);if(!it)return _t("Verity não encontrada.");if(it.lvl>=MAX_LVL)return _t("Nível máximo.");n=Math.min(Math.max(1,Math.floor(n)),MAX_LVL-it.lvl);const e=spend(upCostN(it,n));if(e)return e;it.lvl+=n;track('upgrade',n);saveProfile();return ''}
function sellMany(ids){let total=0,n=0;const set=new Set(ids);for(const it of P.items)if(set.has(it.id)){total+=sellPrice(it);n++}
  P.items=P.items.filter(x=>!set.has(x.id));P.pets=P.pets.filter(x=>!set.has(x));P.museum.ids=P.museum.ids.filter(x=>!set.has(x));if(set.has(P.feat)){P.feat=null;P.featManual=false}
  P.money+=total;P.stats.sold=(P.stats.sold||0)+n;saveProfile();return{n,total}}
function toggleFav(id){const it=P.items.find(x=>x.id===id);if(!it)return;if(it.fav)delete it.fav;else it.fav=1;saveProfile();return !!it.fav}
function setFeatured(id){P.feat=id;P.featManual=true;saveProfile()}
function takeItems(ids){const out=[];for(const id of ids){const i=P.items.findIndex(x=>x.id===id);if(i<0)return null;out.push(P.items[i])}P.items=P.items.filter(x=>!ids.includes(x.id));P.pets=P.pets.filter(x=>!ids.includes(x));P.museum.ids=P.museum.ids.filter(x=>!ids.includes(x));if(ids.includes(P.feat)){P.feat=null;P.featManual=false}return out}
function giveItems(items,foreign){for(const raw of items){const it=sanitizeItem(raw);if(it&&foreign)delete it.fav;if(!it){if(raw&&typeof raw==='object'&&typeof raw.v==='string')P.unknown.push(raw);continue}if(P.items.some(x=>x.id===it.id))it.id=rid();P.items.push(it)}}
const hasUnknown=items=>(items||[]).some(i=>!sanitizeItem(i));
const UPDATE_MSG=_t("Essa oferta tem uma Verity de uma versão mais nova do jogo. Atualize o jogo pra aceitar.");

/* ======================================================================
   ONLINE (Firebase). Each player signs in anonymously; their public profile
   lives in players/{uid}, their collection in inv/{uid}. Trades and market
   listings hold the offered Verities in escrow until the other side settles.
   ====================================================================== */
const NET={status:'off',msg:'',uid:null,fs:null,unsubs:[],reqIn:[],reqOut:[],tradesIn:[],tradesOut:[],myListings:[],pushTimer:null,pushing:false,again:false};
const online=()=>NET.status==='online';
function netChanged(){if(typeof onNetChange==='function')onNetChange()}
function netErr(e){NET.msg=String(e&&e.message||e);netChanged()}
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error(_t("não carregou ")+src));document.head.append(s)})}
async function netInit(){
  const cfg=typeof FIREBASE_CONFIG!=='undefined'?FIREBASE_CONFIG:null;
  if(SMOKE_RUN&&!/[?&]net=1/.test(location.search)){NET.status='off';netChanged();return}
  if(!IS_APP){NET.status='web';netChanged();await importClaudeLegacy();return}
  if(!cfg||!cfg.apiKey){NET.status='sem-config';netChanged();return}
  NET.status='conectando'; netChanged();
  // Never go online on an outdated build: wait for the update check first.
  if(window.desktop.waitUpdateCheck){
    const u=await window.desktop.waitUpdateCheck().catch(()=>'error');
    if(u==='available'||u==='downloading'||u==='ready'){NET.status='atualizando';netChanged();return}
  }
  try{
    if(!window.firebase){await loadScript('vendor/firebase-app-compat.js');await loadScript('vendor/firebase-auth-compat.js');await loadScript('vendor/firebase-firestore-compat.js')}
    if(!firebase.apps.length)firebase.initializeApp(cfg);
    NET.fs=firebase.firestore(); try{NET.fs.settings({experimentalAutoDetectLongPolling:true,merge:true})}catch(e){}
    const auth=firebase.auth();
    const user=await new Promise((res,rej)=>{const un=auth.onAuthStateChanged(u=>{un();if(u)res(u);else auth.signInAnonymously().then(c=>res(c.user),rej)},rej)});
    NET.uid=user.uid;
    await pullProfile();
    NET.status='online'; NET.msg='';
    if(P.username){try{await claimUsername(P.username)}catch(e){P.username='';NET.msg=e.message;saveProfile()}}
    subscribeAll(); pushNow();
  }catch(e){NET.status='erro';NET.msg=String(e&&e.message||e)}
  netChanged();
}
async function pullProfile(){
  const fs=NET.fs,uid=NET.uid;
  const [pd,id]=await Promise.all([fs.collection('players').doc(uid).get(),fs.collection('inv').doc(uid).get()]);
  if(pd.exists){
    const r=pd.data(),remoteNewer=(+r.updatedAt||0)>(P.updatedAt||0)||P.uid!==uid;
    if(remoteNewer){
      const inv=id.exists?id.data():{};
      P=sanitizeProfile({...r,uid,pets:r.petIds,world:r.worldState,ann:r.annObj,items:inv.items||[],feat:inv.feat||null,featManual:!!inv.featManual});
      if(!P.pets.length&&P.items.length)autoTeam();
      try{localStorage.setItem(PKEY,JSON.stringify(P))}catch(e){}
    }
  }
  P.uid=uid;
}
function playerDoc(){
  const f=featured(),r=rarest();
  return{username:P.username,uname_lc:P.username.toLowerCase(),xp:P.xp,level:level(),money:P.money,best:P.best,runs:P.runs,
    totalValue:totalValue(),count:P.items.length,rolos:P.rolos,rebirths:P.rebirths,title:P.title,ann:P.ann.t,annAt:P.ann.at||0,bestV:f?{v:f.v,m:f.m,lvl:f.lvl,val:itemValue(f)}:null,rareV:r?{v:r.v,m:r.m,lvl:r.lvl}:null,
    power:teamPower(),world:P.world.max,proto:PROTO,pets:team().map(i=>({v:i.v,m:i.m,f:i.f||0,lvl:i.lvl})),
    eq:P.eq,owned:P.owned,boosts:P.boosts,friends:P.friends,petIds:P.pets,worldState:P.world,settled:P.settled.slice(-300),stats:P.stats,daily:P.daily,missions:P.missions,museum:P.museum,ach:P.ach,codes:P.codes,seen:P.seen,annObj:P.ann,updatedAt:P.updatedAt};
}
function schedulePush(){if(!online())return;clearTimeout(NET.pushTimer);NET.pushTimer=setTimeout(pushNow,700)}
async function pushNow(){
  if(!online()||!P.username)return;
  if(NET.pushing){NET.again=true;return}
  NET.pushing=true;
  try{
    const b=NET.fs.batch();
    b.set(NET.fs.collection('players').doc(NET.uid),playerDoc());
    b.set(NET.fs.collection('inv').doc(NET.uid),{items:[...P.items,...P.unknown],feat:P.feat,featManual:P.featManual,username:P.username,updatedAt:P.updatedAt});
    await b.commit();
  }catch(e){netErr(e)}
  NET.pushing=false; if(NET.again){NET.again=false;pushNow()}
}
async function claimUsername(name){
  name=String(name||'').trim(); const lc=name.toLowerCase();
  if(!/^[a-z0-9_]{3,16}$/.test(lc))throw new Error(_t("Use de 3 a 16 letras, números ou _ (sem espaço nem acento)."));
  if(!online()){P.username=name;saveProfile();return}
  const ref=NET.fs.collection('usernames').doc(lc);
  await NET.fs.runTransaction(async tx=>{const d=await tx.get(ref);if(d.exists&&d.data().uid!==NET.uid)throw new Error(_t("O nome \"")+name+_t("\" já tem dono."));tx.set(ref,{uid:NET.uid,name})});
  const old=P.username&&P.username.toLowerCase(); if(old&&old!==lc){try{const o=await NET.fs.collection('usernames').doc(old).get();if(o.exists&&o.data().uid===NET.uid)await o.ref.delete()}catch(e){}}
  P.username=name; saveProfile(); pushNow();
}
const settledHas=k=>P.settled.includes(k);
function settle(k){P.settled.push(k);if(P.settled.length>400)P.settled=P.settled.slice(-400)}
function subscribeAll(){
  const fs=NET.fs,uid=NET.uid,mapDocs=s=>s.docs.map(d=>({id:d.id,...d.data()}));
  NET.unsubs.forEach(u=>u()); NET.unsubs=[];
  NET.unsubs.push(fs.collection('friendReqs').where('to','==',uid).onSnapshot(s=>{NET.reqIn=mapDocs(s).filter(r=>r.status==='pending');netChanged()},netErr));
  NET.unsubs.push(fs.collection('friendReqs').where('from','==',uid).onSnapshot(s=>{
    NET.reqOut=mapDocs(s).filter(r=>r.status==='pending');
    for(const r of mapDocs(s))if(r.status==='accepted'){
      if(!P.friends.includes(r.to)){P.friends.push(r.to);saveProfile()}
      fs.collection('friendReqs').doc(r.id).update({status:'done'}).catch(()=>{});
    }
    netChanged();
  },netErr));
  NET.unsubs.push(fs.collection('trades').where('to','==',uid).onSnapshot(s=>{NET.tradesIn=mapDocs(s).sort((a,b)=>(b.at||0)-(a.at||0));netChanged()},netErr));
  NET.unsubs.push(fs.collection('trades').where('from','==',uid).onSnapshot(s=>{
    NET.tradesOut=mapDocs(s).sort((a,b)=>(b.at||0)-(a.at||0));
    for(const t of NET.tradesOut){
      const k='t:'+t.id; if(settledHas(k)||t.fromSettled)continue;
      if(t.status==='accepted'){giveItems(t.want||[],true);settle(k);P.stats.trades=(P.stats.trades||0)+1;saveProfile();toastSafe(_t("{0} aceitou sua troca!",t.toName));fs.collection('trades').doc(t.id).update({fromSettled:true}).catch(()=>{})}
      else if(t.status==='declined'){giveItems(t.give||[]);P.money+=Math.max(0,+t.money||0);settle(k);saveProfile();toastSafe(_t("{0} recusou sua troca. Suas Verities voltaram.",t.toName));fs.collection('trades').doc(t.id).update({fromSettled:true}).catch(()=>{})}
    }
    netChanged();
  },netErr));
  NET.unsubs.push(fs.collection('market').where('seller','==',uid).onSnapshot(s=>{
    NET.myListings=mapDocs(s).sort((a,b)=>(b.at||0)-(a.at||0));
    for(const l of NET.myListings){
      const k='m:'+l.id; if(l.status!=='sold'||l.paid||settledHas(k))continue;
      P.money+=Math.max(0,+l.price||0); settle(k); P.stats.mkSales=(P.stats.mkSales||0)+1; saveProfile(); toastSafe(_t("{0} comprou sua {1} por {2}!",l.buyerName||_t("Alguém"),fullName(l.item.v,l.item.m),money(l.price)));
      fs.collection('market').doc(l.id).update({paid:true}).catch(()=>{});
    }
    netChanged();
  },netErr));
}
function toastSafe(m){if(typeof toast==='function')toast(m)}
const needOnline=()=>online()?'':_t("Você precisa estar online pra isso.");

/* friends */
async function lookupUser(name){
  const lc=String(name||'').trim().toLowerCase(); if(!lc)throw new Error(_t("Digite um nome."));
  const d=await NET.fs.collection('usernames').doc(lc).get(); if(!d.exists)throw new Error(_t("Ninguém com o nome \"")+name+'".');
  return d.data();
}
async function sendFriendRequest(name){
  const e=needOnline();if(e)throw new Error(e);
  const u=await lookupUser(name);
  if(u.uid===NET.uid)throw new Error(_t("Esse é você."));
  if(P.friends.includes(u.uid))throw new Error(u.name+_t(" já é seu amigo."));
  if(NET.reqOut.some(r=>r.to===u.uid))throw new Error(_t("Pedido já enviado."));
  const back=NET.reqIn.find(r=>r.from===u.uid); if(back){await acceptFriend(back);return 'accepted'}
  await NET.fs.collection('friendReqs').add({from:NET.uid,fromName:P.username,to:u.uid,toName:u.name,status:'pending',at:Date.now()});
  return 'sent';
}
async function acceptFriend(r){if(!P.friends.includes(r.from))P.friends.push(r.from);saveProfile();await NET.fs.collection('friendReqs').doc(r.id).update({status:'accepted'})}
async function declineFriend(r){await NET.fs.collection('friendReqs').doc(r.id).update({status:'declined'})}
function removeFriend(uid){P.friends=P.friends.filter(x=>x!==uid);saveProfile()}
async function fetchPlayer(uid){
  const [p,i]=await Promise.all([NET.fs.collection('players').doc(uid).get(),NET.fs.collection('inv').doc(uid).get()]);
  if(!p.exists)return null;
  const d=p.data(),items=(i.exists&&Array.isArray(i.data().items)?i.data().items:[]).map(sanitizeItem).filter(Boolean);
  const pets=(Array.isArray(d.pets)?d.pets:[]).map(x=>sanitizeItem({...x,id:'p'+Math.random()})).filter(Boolean);
  return{uid,username:String(d.username||'?').slice(0,20),level:levelOf(+d.xp||0),xp:+d.xp||0,money:+d.money||0,best:+d.best||0,power:+d.power||0,world:+d.world||1,proto:+d.proto||0,rebirths:+d.rebirths||0,title:typeof d.title==='string'?d.title:'',pets,eq:sanitizeProfile({eq:d.eq,owned:d.owned}).eq,items,feat:i.exists?i.data().feat:null};
}
async function fetchFriends(){return(await Promise.all(P.friends.map(u=>fetchPlayer(u).catch(()=>null)))).filter(Boolean)}

/* trades */
async function proposeTrade(to,toName,giveIds,want,cash){
  const e=needOnline();if(e)throw new Error(e);
  cash=Math.max(0,Math.round(+cash||0));
  if(!giveIds.length&&!cash)throw new Error(_t("Ofereça pelo menos uma Verity ou dinheiro."));
  if(!want.length)throw new Error(_t("Escolha o que você quer receber."));
  if(cash>P.money)throw new Error(_t("Dinheiro insuficiente."));
  const peer=await NET.fs.collection('players').doc(to).get();
  if(!peer.exists||(+peer.data().proto||0)<PROTO)throw new Error(toName+_t(" está numa versão antiga do jogo. Peça pra instalar a versão nova pelo link do GitHub."));
  const give=takeItems(giveIds); if(!give)throw new Error(_t("Alguma Verity sua não está mais na coleção."));
  P.money-=cash; saveProfile();
  try{await NET.fs.collection('trades').add({from:NET.uid,fromName:P.username,to,toName,give,want:want.map(sanitizeItem),money:cash,status:'open',at:Date.now(),fromSettled:false})}
  catch(err){giveItems(give);P.money+=cash;saveProfile();throw err}
}
async function acceptTrade(t){
  if(hasUnknown(t.give))throw new Error(UPDATE_MSG);
  const ids=(t.want||[]).map(i=>i.id); if(!ids.every(id=>P.items.some(x=>x.id===id)))throw new Error(_t("Você não tem mais alguma das Verities pedidas."));
  const ref=NET.fs.collection('trades').doc(t.id);
  await NET.fs.runTransaction(async tx=>{const d=await tx.get(ref);if(!d.exists||d.data().status!=='open')throw new Error(_t("Essa troca não está mais aberta."));tx.update(ref,{status:'accepted'})});
  takeItems(ids); giveItems(t.give||[],true); P.money+=Math.max(0,+t.money||0); settle('t:'+t.id); P.stats.trades=(P.stats.trades||0)+1; saveProfile();
}
async function declineTrade(t){const ref=NET.fs.collection('trades').doc(t.id);await NET.fs.runTransaction(async tx=>{const d=await tx.get(ref);if(!d.exists||d.data().status!=='open')throw new Error(_t("Essa troca não está mais aberta."));tx.update(ref,{status:'declined'})})}
async function cancelTrade(t){
  const ref=NET.fs.collection('trades').doc(t.id);
  await NET.fs.runTransaction(async tx=>{const d=await tx.get(ref);if(!d.exists||d.data().status!=='open')throw new Error(_t("Essa troca não está mais aberta."));tx.update(ref,{status:'canceled',fromSettled:true})});
  if(!settledHas('t:'+t.id)){giveItems(t.give||[]);P.money+=Math.max(0,+t.money||0);settle('t:'+t.id);saveProfile()}
}

/* market */
async function listItem(id,price){
  const e=needOnline();if(e)throw new Error(e);
  price=Math.round(+price||0); if(price<1||price>1e9)throw new Error(_t("Preço inválido."));
  const got=takeItems([id]); if(!got)throw new Error(_t("Verity não encontrada."));
  saveProfile();
  try{await NET.fs.collection('market').add({seller:NET.uid,sellerName:P.username,item:got[0],price,proto:PROTO,status:'open',at:Date.now(),paid:false})}
  catch(err){giveItems(got);saveProfile();throw err}
}
async function fetchMarket(){const s=await NET.fs.collection('market').where('status','==','open').limit(200).get();return s.docs.map(d=>({id:d.id,...d.data()})).filter(l=>l.item&&VARS[l.item.v]&&MUT_BY[l.item.m])}
async function buyListing(l){
  if(l.seller===NET.uid)throw new Error(_t("Esse anúncio é seu."));
  if(hasUnknown([l.item]))throw new Error(UPDATE_MSG);
  if(P.money<l.price)throw new Error(_t("Dinheiro insuficiente."));
  const ref=NET.fs.collection('market').doc(l.id);
  await NET.fs.runTransaction(async tx=>{const d=await tx.get(ref);if(!d.exists||d.data().status!=='open')throw new Error(_t("Alguém comprou antes."));tx.update(ref,{status:'sold',buyer:NET.uid,buyerName:P.username,soldAt:Date.now()})});
  P.money-=l.price; giveItems([l.item],true); saveProfile();
}
async function cancelListing(l){
  const ref=NET.fs.collection('market').doc(l.id);
  await NET.fs.runTransaction(async tx=>{const d=await tx.get(ref);if(!d.exists||d.data().status!=='open')throw new Error(_t("Esse anúncio já foi vendido ou cancelado."));tx.update(ref,{status:'canceled'})});
  if(!settledHas('m:'+l.id)){giveItems([l.item]);settle('m:'+l.id);saveProfile()}
}

/* ranking */
const RANK_FIELDS={xp:_t("Nível"),power:_t("Poder"),best:_t("Recorde"),money:_t("Dinheiro"),totalValue:_t("Coleção")};
async function fetchRanking(field){
  const s=await NET.fs.collection('players').orderBy(field,'desc').limit(50).get();
  return s.docs.map(d=>{const x=d.data();return{uid:d.id,username:String(x.username||'?').slice(0,20),level:levelOf(+x.xp||0),xp:+x.xp||0,best:+x.best||0,money:+x.money||0,totalValue:+x.totalValue||0,count:+x.count||0,power:+x.power||0,world:+x.world||1,rebirths:+x.rebirths||0,title:typeof x.title==='string'?x.title:'',
    bestV:x.bestV&&VARS[x.bestV.v]&&MUT_BY[x.bestV.m]?x.bestV:null,eq:sanitizeProfile({eq:x.eq,owned:x.owned}).eq}}).filter(r=>r.username&&r.username!=='?');
}

/* one-time import of the collection the web version kept in claude.ai */
async function importClaudeLegacy(){
  if(P.stats.importedClaude||!window.claude||typeof window.claude.use!=='function')return;
  try{
    const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]); if(!db||!user)return;
    const uid=await user.id(); if(!uid)return;
    const s=await db.doc(`data/users/${uid}/colecao`).get();
    if(s.exists){const d=s.data()||{};giveItems((d.items||[]).filter(i=>!P.items.some(x=>x.id===i.id)));P.best=Math.max(P.best,+d.best||0)}
    P.stats.importedClaude=true; saveProfile();
  }catch(e){}
}
