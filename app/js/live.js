'use strict';
/* ===== live: Todo Dia + Mundo Vivo — daily reward, missions, Rolos de Papel, museum, marmitas,
   achievements, codes, events, rebirth and the global feed ===== */
const todayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dayDiff=(a,b)=>Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/864e5);
const ROLO='🧻';

/* ---------- events (by date, no server needed) ---------- */
const EVENTS=[
  {k:'festa',name:_t("Festa Mundo Vivo"),from:'2026-11-16',to:'2026-12-07',v:'festivity',money:1.5,desc:_t("Festivity aparece nas partidas e nas marmitas. Dinheiro dos chefes ×1,5.")},
  {k:'natal',name:_t("Natal no Trono"),md:[12,10,1,6],v:'papaiverity',money:1.3,desc:_t("Papai Verity aparece nas partidas e nas marmitas.")},
  {k:'carnaval',name:_t("Carnaval do Trono"),md:[2,1,3,10],v:'carnavality',money:1.3,desc:_t("Carnavality aparece nas partidas e nas marmitas.")},
  {k:'junina',name:_t("Arraiá do Trono"),md:[6,1,7,15],v:'caipirity',money:1.3,desc:_t("Caipirity aparece nas partidas e nas marmitas.")},
  {k:'halloween',name:_t("Halloween Assombrado"),md:[10,20,11,3],v:'abobority',money:1.3,desc:_t("Abobority aparece nas partidas e nas marmitas.")},
  {k:'fds',name:_t("Fim de Semana da Sorte"),weekly:[0,6],mut:2,desc:_t("Chance de mutação ×2 o fim de semana inteiro.")}
];
for(const e of EVENTS)if(e.v)VARS[e.v].hint=_t("Evento: {0}",e.name);
function inMD(d,[m1,d1,m2,d2]){const v=(d.getMonth()+1)*100+d.getDate(),a=m1*100+d1,b=m2*100+d2;return a<=b?v>=a&&v<=b:v>=a||v<=b}
function activeEvents(d=new Date()){
  const k=todayKey(d);
  return EVENTS.filter(e=>e.from?k>=e.from&&k<=e.to:e.md?inMD(d,e.md):e.weekly?e.weekly.includes(d.getDay()):false);
}
function evMods(){const ev=activeEvents();return{mut:ev.reduce((m,e)=>m*(e.mut||1),1),money:ev.reduce((m,e)=>m*(e.money||1),1),vars:ev.map(e=>e.v).filter(Boolean),list:ev}}

/* ---------- rebirth ---------- */
const rbPow=()=>1+.5*(P.rebirths||0), rbIncome=()=>1+.5*(P.rebirths||0), rbLuck=()=>1+.1*(P.rebirths||0), rbCash=()=>1+.25*(P.rebirths||0);
// each rebirth needs a further world (8 more each time) until the very last one; after that it is always world 260
const rebirthReq=()=>Math.min(WORLDS.length,10+8*(P.rebirths||0));
// after rebirth n you start at world 1+5×(n−1): later rebirths skip the worlds that are trivial by then
const rebirthStart=n=>clamp(1+5*(n-1),1,200);
const canRebirth=()=>P.world.beaten.includes(rebirthReq())||P.world.max>rebirthReq();
function doRebirth(){
  if(!canRebirth())return _t("Derrote o chefe do mundo {0} primeiro.",rebirthReq());
  P.rebirths=(P.rebirths||0)+1; const gift=25*P.rebirths; P.rolos+=gift;
  P.money=0; P.owned.bath=[1]; P.eq.bath=1; const st=rebirthStart(P.rebirths); P.world={max:st,beaten:Array.from({length:st-1},(_,i)=>i+1),cur:st};
  P.stats.rebirths=P.rebirths; announce(_t("renasceu pela {0}ª vez!",P.rebirths)); checkAch(); saveProfile(); return '';
}

/* ---------- daily reward ---------- */
const DAILY=[{money:500},{rolos:3},{money:1500},{boost:'mut2'},{rolos:8},{money:5000},{marmita:'chef',rolos:15}];
function dailyState(){
  const d=todayKey(),last=P.daily.last;
  if(last===d)return{claimed:true,day:P.daily.streak};
  const cont=last&&dayDiff(last,d)===1;
  return{claimed:false,day:cont?P.daily.streak+1:1};
}
const dailyMoney=n=>Math.round(n*(1+P.world.max*.1)*rbIncome());
function claimDaily(){
  const st=dailyState(); if(st.claimed)return null;
  P.daily={last:todayKey(),streak:st.day}; P.stats.streakMax=Math.max(P.stats.streakMax||0,st.day);
  const r={...DAILY[(st.day-1)%7]};
  if(r.money){r.money=dailyMoney(r.money);P.money+=r.money}
  if(r.rolos)P.rolos+=r.rolos;
  if(r.boost)P.boosts[r.boost]=(P.boosts[r.boost]||0)+1;
  checkAch(); saveProfile(); return r;
}
const rewardText=r=>[r.money&&money(r.money),r.rolos&&`${r.rolos} ${ROLO}`,r.boost&&BOOSTS[r.boost].name,r.marmita&&MARMITAS.find(m=>m.k===r.marmita).name].filter(Boolean).join(' + ');

/* ---------- missions ---------- */
const MISSION_T=[
  {k:'runs',t:n=>_t("Termine {0} partidas",n),n:[2,3,4]},
  {k:'combo',t:n=>_t("Faça um combo ×{0}",n),n:[6,9,12],max:true},
  {k:'knocks',t:n=>_t("Responda {0} batidas na porta",n),n:[3,5,8]},
  {k:'fibers',t:n=>_t("Pegue {0} fibras",n),n:[8,14,20]},
  {k:'boss',t:n=>_t("Derrote {0} chefe{1}",n,n>1?'s':''),n:[1,2,3]},
  {k:'rare',t:()=>_t("Tire uma Verity Rara ou melhor"),n:[1]},
  {k:'upgrade',t:n=>_t("Dê {0} upgrades",n),n:[2,4,6]},
  {k:'fuse',t:()=>_t("Faça uma fusão"),n:[1]},
  {k:'marmita',t:n=>_t("Abra {0} marmita{1}",n,n>1?'s':''),n:[1,2]},
  {k:'comfort',t:n=>_t("Chegue ao trono com {0}% de conforto",n),n:[70,85,95],max:true}
];
const STAT_OF={runs:'runs',knocks:'knocks',fibers:'fibers',boss:'bossWins',upgrade:'upgrades',fuse:'fusions',marmita:'marmitas'};
function seedRand(str){let h=2166136261;for(const c of str)h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h=Math.imul(h^h>>>15,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return(h>>>0)/4294967296}}
function ensureMissions(){
  const d=todayKey(); if(P.missions.day===d&&P.missions.list.length)return;
  const r=seedRand(d+(P.uid||P.username||'x')),pool=[...MISSION_T],list=[];
  while(list.length<3&&pool.length){const T=pool.splice(Math.floor(r()*pool.length),1)[0];list.push({k:T.k,n:T.n[Math.floor(r()*T.n.length)],prog:0,claimed:false})}
  P.missions={day:d,list,bonus:false};
}
const missionText=m=>MISSION_T.find(T=>T.k===m.k).t(m.n);
const missionReward=m=>{const T=MISSION_T.find(x=>x.k===m.k),hard=T.n.indexOf(m.n);return{rolos:4+2*Math.max(0,hard),money:dailyMoney(400)}};
function track(k,v=1){
  ensureMissions();
  const T=MISSION_T.find(t=>t.k===k);
  for(const m of P.missions.list)if(m.k===k&&!m.claimed)m.prog=T&&T.max?Math.max(m.prog,v):m.prog+v;
  if(STAT_OF[k])P.stats[STAT_OF[k]]=(P.stats[STAT_OF[k]]||0)+v;
  if(k==='combo')P.stats.maxCombo=Math.max(P.stats.maxCombo||0,v);
  checkAch();
}
function claimMission(i){
  const m=P.missions.list[i]; if(!m||m.claimed||m.prog<m.n)return null;
  m.claimed=true; const r=missionReward(m); P.rolos+=r.rolos; P.money+=r.money;
  if(P.missions.list.every(x=>x.claimed)&&!P.missions.bonus){P.missions.bonus=true;P.rolos+=10;r.bonus=10}
  saveProfile(); return r;
}

/* ---------- museum (idle income) ---------- */
const museumSlots=()=>2+Math.max(...P.owned.bath);
const museumItems=()=>P.museum.ids.map(id=>P.items.find(i=>i.id===id)).filter(Boolean);
/* Each displayed Verity earns 3% of its value per hour, so it pays itself back in about a day and a half. */
const MUSEUM_PCT=.03;
const museumMult=()=>rbIncome()*(1+petBonus().income)*evMods().money;
const museumItemRate=it=>Math.round(itemValue(it)*MUSEUM_PCT*museumMult());
function museumRate(){return museumItems().reduce((s,i)=>s+museumItemRate(i),0)}
const MUSEUM_CAP=12;
function museumPending(){if(!P.museum.last||!P.museum.ids.length)return 0;const h=Math.min(MUSEUM_CAP,(Date.now()-P.museum.last)/36e5);return Math.floor(museumRate()*h)}
function collectMuseum(){const v=museumPending();P.money+=v;P.museum.last=Date.now();P.stats.museumEarned=(P.stats.museumEarned||0)+v;saveProfile();return v}
function toggleMuseum(id){
  if(P.museum.ids.includes(id)){collectMuseum();P.museum.ids=P.museum.ids.filter(x=>x!==id);saveProfile();return _t("Saiu do Museu.")}
  if(P.museum.ids.length>=museumSlots())return _t("O Museu está cheio ({0} vagas). Banheiros melhores dão mais vagas.",museumSlots());
  if(P.museum.ids.length)collectMuseum(); else P.museum.last=Date.now();
  P.museum.ids.push(id); saveProfile(); return _t("Exposta no Museu!");
}

/* ---------- marmitas (gacha) ---------- */
const marmitaCan=M=>Math.min(500,Math.floor(M.rolos?P.rolos/M.rolos:P.money/M.money));
/* opens n at once (no roulette); returns the items, best first */
function openMarmitas(k,n){
  const M=MARMITAS.find(m=>m.k===k); if(!M)return{err:_t("Marmita desconhecida.")};
  n=Math.max(1,Math.floor(n)); if(marmitaCan(M)<n)return{err:M.rolos?_t("Faltam {0} {1}.",M.rolos*n-P.rolos,ROLO):_t("Dinheiro insuficiente.")};
  const out=[];for(let i=0;i<n;i++){const r=openMarmita(k,false,true);if(r.err)break;out.push(r)}
  out.sort((a,b)=>itemRank(b.item)-itemRank(a.item));
  const top=out[0]&&out[0].item; if(top&&(VARS[top.v].r>=5||MUT_BY[top.m].i>=6||VARS[top.v].ev))announce(_t("abriu uma marmita e tirou {0}!",fullName(top.v,top.m)));
  saveProfile(); return{list:out};
}
const MARMITAS=[
  {k:'pastel',name:_t("Pastel"),col:'#d89a3a',money:800,w:[60,30,10,0,0,0,0],mut:.05,desc:_t("Comuns e Incomuns. Às vezes uma Rara.")},
  {k:'coxinha',name:_t("Coxinha"),col:'#c8702a',money:4000,w:[25,35,28,10,2,0,0],mut:.1,desc:_t("Até Épica, com chance de Lendária.")},
  {k:'feijoada',name:_t("Feijoada Completa"),col:'#c8804a',money:20000,w:[0,20,40,30,9,1,0],mut:.18,desc:_t("Raras e Épicas. Pode vir Mítica.")},
  {k:'chef',name:_t("Marmita do Chef"),col:'#2a8aa8',rolos:25,w:[0,0,15,50,28,6,1],mut:.3,desc:_t("Épica ou melhor quase sempre.")},
  {k:'banquete',name:_t("Banquete dos Deuses"),col:'#c9a24a',rolos:80,w:[0,0,0,25,45,24,6],mut:.5,desc:_t("Lendárias, Míticas e até Divinas.")}
];
function marmitaPool(){
  const reg=WORLDS[clamp(P.world.max,1,WORLDS.length)-1].region,ev=evMods().vars;
  return VAR_ORDER.filter(v=>{const V=VARS[v];if(V.hidden||V.b)return false;if(V.ev)return ev.includes(v);if(V.reg)return V.reg<=reg;return true}).map(v=>({k:v,r:VARS[v].r}));
}
const ALBU_BANQUETE=1/800;
function openMarmita(k,free,batch){
  const M=MARMITAS.find(m=>m.k===k); if(!M)return{err:_t("Marmita desconhecida.")};
  if(!free){if(M.rolos){if(P.rolos<M.rolos)return{err:_t("Faltam {0} {1}.",M.rolos-P.rolos,ROLO)};P.rolos-=M.rolos}else{if(P.money<M.money)return{err:_t("Dinheiro insuficiente.")};P.money-=M.money}}
  const pool=marmitaPool(),ws=M.w.map((w,r)=>[r,pool.some(p=>p.r===r)?w:0]).filter(x=>x[1]>0);
  const r=+weighted(ws.map(([r,w])=>[String(r),w])),opts=pool.filter(p=>p.r===r);let v=pick(opts).k;
  if(k==='banquete'&&Math.random()<ALBU_BANQUETE*rbLuck())v='albuquerque';
  const m=Math.random()<M.mut*rbLuck()*evMods().mut?rollMut(900,1):'none';
  const isNew=!P.items.some(i=>i.v===v),item={id:rid(),v,m,f:0,lvl:1,s:0,t:Date.now()};
  P.items.push(item); if(team().length<petSlots())P.pets.push(item.id);
  track('marmita'); if(!batch&&(VARS[v].r>=5||MUT_BY[m].i>=6||VARS[v].ev))announce(_t("abriu uma marmita e tirou {0}!",fullName(v,m)));
  if(!batch)saveProfile(); return{item,isNew};
}

/* ---------- achievements & titles ---------- */
const has=fn=>P.items.some(fn);
const ACH=[
  ['primeira',_t("Primeira Cagada"),_t("Termine sua primeira partida."),()=>P.stats.runs||0,1,5],
  ['cagador',_t("Cagador Profissional"),_t("Termine 50 partidas."),()=>P.stats.runs||0,50,20],
  ['lenda',_t("Lenda do Trono"),_t("Termine 300 partidas."),()=>P.stats.runs||0,300,60],
  ['combo10',_t("Mão Firme"),_t("Faça um combo ×10."),()=>P.stats.maxCombo||0,10,10],
  ['combo25',_t("Intestino de Aço"),_t("Faça um combo ×25."),()=>P.stats.maxCombo||0,25,30],
  ['porta50',_t("Mestre da Porta"),_t("Responda 50 batidas."),()=>P.stats.knocks||0,50,15],
  ['porta300',_t("Segurança do Banheiro"),_t("Responda 300 batidas."),()=>P.stats.knocks||0,300,40],
  ['invadido',_t("Sem Privacidade"),_t("Seja invadido 10 vezes."),()=>P.stats.invaded||0,10,10],
  ['chefe1',_t("Desentupidor"),_t("Derrote um chefe."),()=>P.stats.bossWins||0,1,10],
  ['chefe25',_t("Caçador de Chefes"),_t("Derrote 25 chefes."),()=>P.stats.bossWins||0,25,30],
  ['chefe100',_t("Exterminador de Entupimentos"),_t("Derrote 100 chefes."),()=>P.stats.bossWins||0,100,80],
  ['mundo20',_t("Explorador Intestinal"),_t("Chegue ao mundo 20."),()=>Math.max(P.world.max,P.stats.maxWorld||0),20,30],
  ['mundo60',_t("Zerou o Intestino"),_t("Derrote O Vazio, o chefe do mundo 60."),()=>P.stats.beat60?1:0,1,200],
  ['fibra500',_t("Vegano Radical"),_t("Pegue 500 fibras."),()=>P.stats.fibers||0,500,20],
  ['fusao1',_t("Alquimista"),_t("Faça uma fusão."),()=>P.stats.fusions||0,1,10],
  ['fusao25',_t("Fusão Nuclear"),_t("Faça 25 fusões."),()=>P.stats.fusions||0,25,40],
  ['arco',_t("Arco-íris no Vaso"),_t("Tenha uma Verity Arco-íris."),()=>has(i=>i.f===2)?1:0,1,50],
  ['upgrade100',_t("Personal Trainer"),_t("Dê 100 upgrades."),()=>P.stats.upgrades||0,100,25],
  ['god',_t("Visto por Deus"),_t("Tenha uma Verity God."),()=>has(i=>i.m==='god')?1:0,1,100],
  ['divino',_t("Divindade"),_t("Tenha uma Verity Divina."),()=>has(i=>VARS[i.v].r===6)?1:0,1,100],
  ['mundo100',_t("Viajante Dimensional"),_t("Chegue ao mundo 100."),()=>Math.max(P.world.max,P.stats.maxWorld||0),100,80],
  ['mundo260',_t("Fim de Todas as Dimensões"),_t("Derrote o chefe do mundo 260."),()=>P.world.beaten.includes(260)||P.stats.beat260?1:0,1,500],
  ['renasce15',_t("Imortal"),_t("Renasça 15 vezes."),()=>P.rebirths||0,15,150],
  ['albu',_t("Lenda Viva"),_t("Tenha o Albuquerque."),()=>has(i=>i.v==='albuquerque')?1:0,1,300],
  ['exu',_t("Laroyê"),_t("Tenha um Exu."),()=>has(i=>i.v==='exu')?1:0,1,30],
  ['col20',_t("Colecionador"),_t("Encontre 20 variantes diferentes."),()=>new Set(P.items.map(i=>i.v)).size,20,30],
  ['col45',_t("Museu Nacional"),_t("Encontre 45 variantes diferentes."),()=>new Set(P.items.map(i=>i.v)).size,45,80],
  ['marmita50',_t("Comilão"),_t("Abra 50 marmitas."),()=>P.stats.marmitas||0,50,30],
  ['rico',_t("Milionário"),_t("Tenha V$ 1.000.000 de uma vez."),()=>P.money,1e6,30],
  ['renasce1',_t("Renascido"),_t("Renasça uma vez."),()=>P.rebirths||0,1,50],
  ['renasce5',_t("Fênix do Trono"),_t("Renasça 5 vezes."),()=>P.rebirths||0,5,150],
  ['streak7',_t("Viciado"),_t("Pegue a recompensa diária 7 dias seguidos."),()=>P.stats.streakMax||0,7,20],
  ['streak30',_t("Sem Vida Social"),_t("Pegue a recompensa diária 30 dias seguidos."),()=>P.stats.streakMax||0,30,80],
  ['amigos5',_t("Popular"),_t("Tenha 5 amigos."),()=>P.friends.length,5,20],
  ['troca10',_t("Negociante"),_t("Faça 10 trocas."),()=>P.stats.trades||0,10,25],
  ['evento',_t("Festeiro"),_t("Consiga uma Verity de evento."),()=>has(i=>!!VARS[i.v].ev)?1:0,1,30]
].map(([k,name,desc,val,goal,rolos])=>({k,name,desc,val,goal,rolos}));
let achReady=false;
function checkAch(){
  if(!P||!achReady)return;
  for(const a of ACH)if(!P.ach[a.k]&&a.val()>=a.goal){P.ach[a.k]=Date.now();P.rolos+=a.rolos;if(typeof toast==='function')toast(_t("Conquista: {0}! +{1} {2}",a.name,a.rolos,ROLO));sfx.up()}
}
function setTitle(k){if(k&&!P.ach[k])return _t("Você ainda não tem esse título.");P.title=k||'';saveProfile();return ''}
const titleName=k=>{const a=ACH.find(x=>x.k===k);return a?a.name:''};

/* ---------- secret codes ---------- */
const CODES={CAGADA2026:{rolos:20,money:3000},LAROYE:{rolos:15},PLOFT:{boost:'mut2'},MUNDOVIVO:{rolos:30,marmita:'coxinha'},VERITY:{money:5000},CINEMA:{cuts:true}};
async function redeemCode(raw){
  const c=String(raw||'').trim().toUpperCase().replace(/[^A-Z0-9]/g,''); if(!c)throw new Error(_t("Digite um código."));
  if(P.codes.includes(c))throw new Error(_t("Você já usou esse código."));
  let r=CODES[c];
  if(!r&&online()){try{const d=await NET.fs.collection('meta').doc('codes').get();const x=d.exists&&d.data()[c];if(x&&(!x.until||Date.now()<+x.until))r=x}catch(e){}}
  if(!r)throw new Error(_t("Código inválido ou expirado."));
  const out={money:Math.max(0,+r.money||0),rolos:Math.max(0,+r.rolos||0),boost:BOOSTS[r.boost]?r.boost:null,marmita:MARMITAS.some(m=>m.k===r.marmita)?r.marmita:null,cuts:!!r.cuts};
  P.money+=out.money; P.rolos+=out.rolos; if(out.boost)P.boosts[out.boost]=(P.boosts[out.boost]||0)+1;
  P.codes.push(c); saveProfile(); return out;
}

/* ---------- global feed (each player's latest big moment, read from players/) ---------- */
function announce(text){P.ann={t:String(text).slice(0,90),at:Date.now()}}
let FEED=[],feedAt=0;
async function refreshFeed(force){
  if(!online()||(!force&&Date.now()-feedAt<45000))return FEED;
  feedAt=Date.now();
  try{const s=await NET.fs.collection('players').orderBy('annAt','desc').limit(15).get();
    FEED=s.docs.map(d=>d.data()).filter(x=>x.ann&&x.annAt).map(x=>({name:String(x.username||'?').slice(0,20),t:String(x.ann).slice(0,90),at:+x.annAt,rb:+x.rebirths||0}))}catch(e){}
  return FEED;
}
