'use strict';
/* ===== Battle (turn-based PvP): the Throne Room scene, the turn controls, and the online side =====
   Rules live in btlcore.js. Online, a fight is one doc in battles/: the two teams, a seed and the list of actions.
   Each game replays that list on its own, so only the choices travel. */
const BTL_TEST=/[?&]arena=1/.test(location.search); // test build: local practice mode and the menu button
const PVP_K=32,BTL_ONLINE_SEC=120,BTL_STALE_MS=3*60*1000;
let B=null;

/* ---------- sounds ---------- */
const bsfx={
  whoosh(){noise({dur:.16,vol:.16,f:900,f2:2600,type:'bandpass',q:.8})},
  hit(c){tone({f:c?220:160,f2:50,type:'square',dur:.22,vol:.2,lp:900});noise({dur:.12,vol:.28,f:c?2500:600,type:c?'highpass':'lowpass'});if(c)tone({f:1400,f2:500,type:'triangle',dur:.25,vol:.12})},
  boom(){tone({f:110,f2:28,type:'sine',dur:.6,vol:.5});noise({dur:.5,vol:.32,f:180,type:'lowpass'})},
  heal(){[660,880,1320].forEach((f,i)=>tone({f,type:'sine',dur:.25,vol:.1,delay:i*.07}))},
  zap(){tone({f:1600,f2:300,type:'sawtooth',dur:.3,vol:.06,lp:4000})},
  shield(){tone({f:440,f2:880,type:'triangle',dur:.3,vol:.12})},
  bad(){tone({f:300,f2:120,type:'sawtooth',dur:.3,vol:.08,lp:1200})},
  ko(){tone({f:520,f2:90,type:'sawtooth',dur:.5,vol:.13,lp:1500})},
  turn(){tone({f:880,type:'sine',dur:.08,vol:.08});tone({f:1320,type:'sine',dur:.12,vol:.07,delay:.07})},
  special(){tone({f:300,f2:1200,type:'sawtooth',dur:.35,vol:.08,lp:2500});noise({dur:.35,vol:.14,f:2000,type:'highpass'})},
  win(){[523,659,784,1046].forEach((f,i)=>tone({f,type:'square',dur:.2,vol:.1,lp:3000,delay:i*.12}))},
  lose(){[392,330,262].forEach((f,i)=>tone({f,type:'triangle',dur:.3,vol:.12,delay:i*.18}))},
  tick(){tone({f:1000,type:'square',dur:.04,vol:.05,lp:3000})}
};

/* ---------- the Throne Room (static part painted once into an offscreen canvas) ---------- */
let BTL_BG=null;
function paintThroneRoom(){
  const c=document.createElement('canvas');c.width=W;c.height=H;const g0=c.getContext('2d');
  withCtx(g0,()=>{
    let g=ctx.createLinearGradient(0,0,0,430);g.addColorStop(0,'#120e22');g.addColorStop(1,'#2a2140');ctx.fillStyle=g;ctx.fillRect(0,0,W,430);
    ctx.strokeStyle='rgba(255,255,255,.035)';ctx.lineWidth=2;
    for(let y=20;y<430;y+=38){line([[0,y],[W,y]],'rgba(0,0,0,.25)',2);for(let x=(y/38%2)*40;x<W;x+=80)line([[x,y],[x,y+38]],'rgba(0,0,0,.2)',2)}
    // tall windows with moonlight
    for(const x of[210,1070]){rr(x-46,40,92,250,46);ctx.fillStyle='#0a1830';ctx.fill();const wg=ctx.createLinearGradient(0,40,0,290);wg.addColorStop(0,'rgba(140,190,255,.55)');wg.addColorStop(1,'rgba(80,120,200,.15)');rr(x-38,48,76,236,38);ctx.fillStyle=wg;ctx.fill();
      line([[x,48],[x,284]],'#1a1430',6);line([[x-38,150],[x+38,150]],'#1a1430',6)}
    // pillars
    for(const x of[70,380,900,1210]){const pg=ctx.createLinearGradient(x-42,0,x+42,0);pg.addColorStop(0,'#2a2238');pg.addColorStop(.45,'#5a4c70');pg.addColorStop(1,'#1a1428');ctx.fillStyle=pg;ctx.fillRect(x-40,0,80,430);
      for(let i=0;i<5;i++)line([[x-28+i*14,10],[x-28+i*14,420]],'rgba(0,0,0,.18)',2);
      rr(x-52,0,104,30,6);ctx.fillStyle='#c9a24a';ctx.fill();rr(x-52,396,104,34,6);ctx.fillStyle='#b08a3a';ctx.fill()}
    // banners with the Verity crest
    for(const x of[225,1055]){poly([[x-60,0],[x+60,0],[x+60,250],[x,290],[x-60,250]],'#8a1424');poly([[x-60,0],[x+60,0],[x+60,12],[x-60,12]],'#c9a24a');
      line([[x-52,0],[x-52,246]],'rgba(201,162,74,.8)',3);line([[x+52,0],[x+52,246]],'rgba(201,162,74,.8)',3);
      circ(x,130,36,'#ffd726');circ(x-12,122,4.5,'#3a2a00');circ(x+12,122,4.5,'#3a2a00');ctx.strokeStyle='#3a2a00';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,132,16,.15*Math.PI,.85*Math.PI);ctx.stroke()}
    // stairs to the throne
    for(let i=0;i<5;i++){const w=300+i*70,y=300+i*24;rr(W/2-w/2,y,w,26,4);ctx.fillStyle=i%2?'#3a3050':'#463a60';ctx.fill();line([[W/2-w/2,y],[W/2+w/2,y]],'rgba(255,255,255,.12)',2)}
    // red carpet
    poly([[W/2-70,300],[W/2+70,300],[W/2+260,H],[W/2-260,H]],'#7a1020');poly([[W/2-62,300],[W/2+62,300],[W/2+240,H],[W/2-240,H]],'#9a1a2a');
    line([[W/2-62,300],[W/2-240,H]],'#c9a24a',4);line([[W/2+62,300],[W/2+240,H]],'#c9a24a',4);
    // the throne: a golden toilet with a royal back
    const tx=W/2,ty=205;
    let hg=ctx.createRadialGradient(tx,ty,10,tx,ty,230);hg.addColorStop(0,'rgba(255,220,120,.35)');hg.addColorStop(1,'rgba(255,220,120,0)');ctx.fillStyle=hg;ctx.fillRect(tx-240,ty-240,480,480);
    rr(tx-78,ty-150,156,190,40);ctx.fillStyle='#a8781e';ctx.fill();rr(tx-64,ty-136,128,160,32);ctx.fillStyle='#8a1424';ctx.fill();
    for(let i=0;i<4;i++)circ(tx-36+i*24,ty-60,4,'#c9a24a');
    poly([[tx-50,ty-150],[tx-50,ty-196],[tx-25,ty-172],[tx,ty-210],[tx+25,ty-172],[tx+50,ty-196],[tx+50,ty-150]],'#ffd23a');circ(tx,ty-180,8,'#ff3a5a');
    rr(tx-60,ty+20,120,40,12);g=ctx.createLinearGradient(tx-60,0,tx+60,0);g.addColorStop(0,'#b8862a');g.addColorStop(.5,'#ffe08a');g.addColorStop(1,'#a8781e');ctx.fillStyle=g;ctx.fill();
    ell(tx,ty+66,92,30,'#c9962e');ell(tx,ty+62,78,22,'#ffe08a');ell(tx,ty+62,60,15,'#3a5a7a');
    poly([[tx-60,ty+70],[tx+60,ty+70],[tx+40,ty+100],[tx-40,ty+100]],'#b8862a');
    // marble floor
    g=ctx.createLinearGradient(0,400,0,H);g.addColorStop(0,'#3a3452');g.addColorStop(1,'#1a1628');ctx.fillStyle=g;ctx.fillRect(0,400,W,H-400);
    ctx.save();ctx.beginPath();ctx.rect(0,400,W,H-400);ctx.clip();
    for(let i=-14;i<=14;i++)line([[W/2+i*60,400],[W/2+i*190,H]],'rgba(255,255,255,.06)',2);
    for(let k=0;k<7;k++){const y=400+Math.pow(k/7,1.6)*320;line([[0,y],[W,y]],'rgba(255,255,255,.06)',2)}
    ctx.restore();
    poly([[W/2-70,400],[W/2+70,400],[W/2+260,H],[W/2-260,H]],'rgba(154,26,42,.85)');
    line([[0,400],[W,400]],'rgba(201,162,74,.5)',3);
  });
  return c;
}
function drawThroneLive(){
  // torches on the pillars
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const x of[70,380,900,1210]){const fl=Math.sin(S.time*13+x)*3+Math.sin(S.time*7.3+x*.3)*2,y=170;
    const g=ctx.createRadialGradient(x,y,4,x,y,110);g.addColorStop(0,'rgba(255,170,60,.45)');g.addColorStop(1,'rgba(255,120,40,0)');ctx.fillStyle=g;ctx.fillRect(x-110,y-110,220,220);
    ctx.fillStyle='#ffb43a';ctx.beginPath();ctx.moveTo(x-9,y+6);ctx.quadraticCurveTo(x,y-26-fl,x+9,y+6);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff0a0';ctx.beginPath();ctx.moveTo(x-4,y+6);ctx.quadraticCurveTo(x,y-10-fl*.5,x+4,y+6);ctx.closePath();ctx.fill()}
  // moonbeams
  for(const x of[210,1070]){ctx.save();ctx.translate(x,60);ctx.rotate(x<W/2?-.35:.35);const g=ctx.createLinearGradient(0,0,0,620);g.addColorStop(0,'rgba(140,190,255,.14)');g.addColorStop(1,'rgba(140,190,255,0)');ctx.fillStyle=g;ctx.fillRect(-40,0,80,620);ctx.restore()}
  // rune circles under each team
  for(const s of[0,1]){const cx=s===0?375:W-375,cy=505,col=s===0?'79,227,176':'255,90,95';
    ctx.save();ctx.translate(cx,cy);ctx.scale(1,.32);ctx.rotate(S.time*.25*(s?-1:1));
    ctx.strokeStyle=`rgba(${col},.55)`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,230,0,TAU);ctx.stroke();ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,196,0,TAU);ctx.stroke();
    for(let i=0;i<12;i++){ctx.rotate(TAU/12);rr(200,-6,18,12,3);ctx.fillStyle=`rgba(${col},.6)`;ctx.fill()}ctx.restore()}
  // floating dust
  for(let i=0;i<26;i++){const x=(i*97+S.time*14*(1+i%3))%W,y=80+((i*53)%300)+Math.sin(S.time+i)*10;circ(x,y,1.6,'rgba(255,230,180,.45)')}
  ctx.restore();
}

/* ---------- view of a fight ---------- */
const BTL_SLOTS=[[470,452],[450,566],[300,430],[285,540]];
function btlOpen(cfg){
  // cfg: {mode:'local'|'online', teams:[a,b], seed, names:[a,b], ratings:[a,b], me (my side; local: -1 = both), id, doc}
  if(!BTL_BG)BTL_BG=paintThroneRoom();
  const S0=btlNew(cfg.teams[0],cfg.teams[1],cfg.seed);
  const view=S0.units.map(u=>{const [sx,sy]=BTL_SLOTS[u.slot],x=u.side===0?sx:W-sx,depth=.88+(sy-430)/140*.16;return{id:u.id,x,y:sy,r:Math.round(48*depth),hp:u.hp,hpG:u.hp,ox:0,oy:0,kb:0,sq:0,flash:0,ko:-1,alive:true,ph:Math.random()*6,drop:-700}});
  B={...cfg,S:S0,view,applied:0,evq:[...S0.pre],ev:null,et:0,phase:'intro',it:0,fx:[],cam:{x:W/2,y:H/2,z:1},punch:null,shake:0,flash:0,slow:0,stop:0,banner:null,
    sel:'atk',hover:null,sending:false,turnShownAt:0,ended:false,endT:0,actor:null,cues:{},result:null};
  closeAllPanels(); showOnly(null); S.mode='battle'; S.parts=[]; S.floats=[];
  $('btlBar').hidden=true; $('btlEnd').hidden=true;
  if(cfg.mode===_t("online")&&cfg.doc)btlSync(cfg.doc);
}
function btlClose(){
  B=null; $('btlBar').hidden=true; $('btlEnd').hidden=true;
  if(SET.track!=='off'&&MUS.track!==wantedTrack())playTrack(wantedTrack());
}
const bV=id=>B.view.find(v=>v.id===id);
const vx=v=>v.x+v.ox+v.kb,vy=v=>v.y+v.oy;
const myTurn=()=>B&&B.S.cur!=null&&!B.S.over&&(B.me===-1||bU(B.S,B.S.cur).side===B.me);
const bcue=(k,fn)=>{if(!B.cues[k]){B.cues[k]=1;fn()}};

/* ---------- effects ---------- */
const bfx=o=>B.fx.push({life:o.max,...o});
function bpop(x,y,t,col,size,big){bfx({type:'num',x:x+rand(-8,8),y,t,col,size,max:big?1.1:.95,vy:-60})}
function bsparks(x,y,n,col,dir){for(let i=0;i<n;i++){const a=(dir>0?0:Math.PI)+rand(-1.1,1.1),s=rand(300,800);bfx({type:'spark',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,col,max:rand(.2,.42),w:rand(2,4)})}}
function bring(x,y,R,col,max=.35,w=6){bfx({type:'ring',x,y,R,col,max,w})}
function bglow(x,y,R,col,max=.4){bfx({type:'glow',x,y,R,col,max})}
const rgbOf=hex=>{const c=hexc(hex);return `${c[0]},${c[1]},${c[2]}`};
function bpunch(x,y,z,t=.4){B.punch={x,y,z,t}}

/* each event from the rules gets a short animation; dur is in seconds */
function btlEventStart(e){
  const S0=B.S;let dur=.05;
  switch(e.k){
    case 'round':bfx({type:'roundban',r:e.r,max:.9});dur=.75;break;
    case 'turn':{B.actor=e.u;const v=bV(e.u);bring(v.x,v.y+v.r*.9,v.r*1.6,'#ffd21f',.5,4);bsfx.turn();dur=.25;break}
    case 'act':{
      const u=bV(e.u);B.act={u:e.u,a:e.a,t:e.t,melee:false};
      if(e.a==='skill'){const sk=bU(S0,e.u).sk;B.banner={u:e.u,sk,t:0};bsfx.special();dur=.85;
        B.act.melee=sk.ops.some(op=>op.o==='dmg'&&op.to==='t')&&e.t!=null&&sk.tg==='enemy'}
      else if(e.a==='atk'){B.act.melee=e.t!=null;dur=.02}
      if(e.auto)bpop(u.x,u.y-u.r-60,_t("AUTOMÁTICO"),'#cfd6d4',18);
      break}
    case 'skill':B.banner=null;{const v=bV(e.u),c=e.sk.c;bglow(vx(v),vy(v),140,rgbOf(c),.5);bring(vx(v),vy(v),120,c,.4,6)}dur=.25;break;
    case 'defend':{const v=bV(e.u);bring(v.x,v.y,v.r*1.6,'#5fb4ff',.5,8);bpop(v.x,v.y-v.r-40,_t("DEFENDENDO"),'#5fb4ff',24);bsfx.shield();dur=.5;break}
    case 'dmg':{const s=bV(e.s),t=bV(e.t);
      if(B.act&&B.act.melee&&B.act.u===e.s){dur=.42;e.mode='melee'}else{dur=.45;e.mode='shot'}
      e.from=[vx(s),vy(s)];e.dirSide=bU(S0,e.s).side;break}
    case 'miss':{const t=bV(e.t),s=bV(e.s);if(B.act&&B.act.melee&&B.act.u===e.s){dur=.42;e.mode='melee'}else{dur=.4;e.mode='shot'}e.from=[vx(s),vy(s)];break}
    case 'heal':{const t=bV(e.t);t.hp=e.hp;bfx({type:'pillar',x:t.x,y:t.y,max:.6,col:'111,224,138'});bpop(t.x,t.y-t.r-20,'+'+fmt(e.h),'#6fe08a',30);for(let i=0;i<8;i++)bfx({type:'plus',x:t.x+rand(-t.r,t.r),y:t.y+rand(-t.r*.5,t.r*.5),vy:rand(-90,-50),max:rand(.6,1)});bsfx.heal();dur=.35;break}
    case 'shield':{const t=bV(e.t);bring(t.x,t.y,t.r*1.7,'#86e0c8',.45,8);bpop(t.x,t.y-t.r-24,_t("ESCUDO {0}",fmt(e.v)),'#86e0c8',22);bsfx.shield();dur=.3;break}
    case 'st':{const t=bV(e.t),I=ST_INFO[e.s];bring(t.x,t.y,t.r*1.5,I.c,.4,5);bpop(t.x,t.y-t.r-42,I.ic+' '+stLabel(e.s),I.c,20);if(I.bad)bsfx.bad();dur=.28;break}
    case 'cleanse':{const t=bV(e.t);for(let i=0;i<10;i++)bfx({type:'star',x:t.x,y:t.y,vx:rand(-200,200),vy:rand(-300,0),max:rand(.5,.8),col:'#ffffff'});bpop(t.x,t.y-t.r-42,_t("LIMPO!"),'#ffffff',20);dur=.3;break}
    case 'revive':{const t=bV(e.t);t.alive=true;t.ko=-1;t.hp=e.hp;t.hpG=e.hp;bfx({type:'pillar',x:t.x,y:t.y,max:.8,col:'255,240,160'});bpop(t.x,t.y-t.r-30,_t("REVIVEU!"),'#ffd21f',34,true);bsfx.heal();dur=.7;break}
    case 'tick':{const t=bV(e.t),I=ST_INFO[e.s];if(e.d){t.hp=e.hp;t.flash=.6;bpop(t.x,t.y-t.r-18,'-'+fmt(e.d),I.c,26)}else{t.hp=e.hp;bpop(t.x,t.y-t.r-18,'+'+fmt(e.h),'#6fe08a',24)}bring(t.x,t.y,t.r*1.3,I.c,.35,4);dur=.4;break}
    case 'stunned':{const t=bV(e.u);bpop(t.x,t.y-t.r-40,_t("ATORDOADO"),'#ffd21f',26);bsfx.bad();dur=.6;break}
    case 'ko':{const t=bV(e.t);t.alive=false;t.ko=0;bpop(t.x,t.y-t.r-110,'K.O.!','#ff5a5f',62,true);bring(t.x,t.y,170,'#ff5a5f',.5,10);B.slow=.5;bpunch(t.x,t.y,1.15,.6);B.flash=.35;bsfx.ko();dur=.75;break}
    case 'end':{B.phase='end';B.endT=0;dur=0;break}
  }
  B.ev=e;B.et=0;e.dur=dur;
}
function btlEventTick(e,t){
  // melee and projectile hits land partway through the event
  if(e.k==='dmg'||e.k==='miss'){
    const s=bV(e.s),tg=bV(e.t),dirS=bU(B.S,e.s).side===0?1:-1;
    if(e.mode==='melee'){
      const fx=tg.x-dirS*(tg.r+s.r*.85),fy=tg.y,k=clamp(t/.18,0,1),ke=easeIn(k);
      if(t<.18){s.ox=(fx-s.x)*ke;s.oy=(fy-s.y)*ke-Math.sin(ke*Math.PI)*30;if(Math.random()<.8)bfx({type:'ghost',x:vx(s),y:vy(s),v:s,id:e.s,max:.15})}
      else{s.ox=fx-s.x;s.oy=fy-s.y}
      if(t>=.18&&!e.hitDone){e.hitDone=true;btlLand(e)}
    }else{
      const k=clamp(t/.22,0,1);if(!e.shot){e.shot=true;bsfx.zap()}
      if(k<1)bfx({type:'orb',x:lerp(e.from[0],vx(tg),k),y:lerp(e.from[1],vy(tg),k)-Math.sin(k*Math.PI)*40,col:(B.banner&&B.banner.sk.c)||(B.act&&B.act.u===e.s&&B.act.a==='skill'?bU(B.S,e.s).sk.c:'#ffffff'),max:.12});
      if(k>=1&&!e.hitDone){e.hitDone=true;btlLand(e)}
    }
  }
}
function btlLand(e){
  const tg=bV(e.t),dir=bU(B.S,e.s).side===0?1:-1;
  if(e.k==='miss'){bpop(vx(tg),tg.y-tg.r-20,_t("ERROU!"),'#cfd6d4',26);tg.ox+=dir*24;bsfx.whoosh();return}
  tg.hp=e.hp;tg.flash=1;tg.kb=dir*(e.crit?40:22);tg.sq=.4;
  const x=vx(tg)-dir*tg.r*.55,y=vy(tg);
  bsparks(x,y,e.crit?24:12,e.crit?'#ffd21f':'#ffffff',dir);bring(x,y,e.crit?110:60,e.crit?'#ffd21f':'#ffffff');bglow(x,y,e.crit?140:80,e.crit?'255,210,31':'255,255,255',.25);
  if(e.abs)bpop(vx(tg),tg.y-tg.r-46,_t("ESCUDO -{0}",fmt(e.abs)),'#86e0c8',20);
  if(e.def)bpop(vx(tg),tg.y-tg.r-46,_t("DEFENDEU!"),'#5fb4ff',22);
  bpop(vx(tg),tg.y-tg.r-16,fmt(e.d),e.crit?'#ffd21f':'#ffffff',e.crit?50:34,true);
  B.shake=Math.max(B.shake,e.crit?16:8);B.stop=Math.max(B.stop,e.crit?.12:.06);bsfx.hit(e.crit);
  if(e.crit){B.slow=Math.max(B.slow,.3);bpunch(vx(tg),vy(tg),1.12);bpop(vx(tg),tg.y-tg.r-70,_t("CRÍTICO!"),'#ff5a5f',30);B.flash=Math.max(B.flash,.25)}
}
function btlEventEnd(e){
  // a melee attacker walks back once its last hit of the action has landed
  if(!B.act||!B.act.melee||(e.k!=='dmg'&&e.k!=='miss')||e.s!==B.act.u)return;
  const nx=B.evq[0];if(nx&&(nx.k==='dmg'||nx.k==='miss')&&nx.s===B.act.u)return;
  const v=bV(B.act.u);if(v&&(v.ox||v.oy))v.back={ox:v.ox,oy:v.oy,t:0};
}
function stLabel(s){return({stun:_t("ATORDOADO"),poison:_t("VENENO"),burn:_t("QUEIMANDO"),regen:_t("REGENERANDO"),atkUp:_t("ATAQUE ↑"),atkDown:_t("ATAQUE ↓"),defUp:_t("DEFESA ↑"),defDown:_t("DEFESA ↓"),spdUp:_t("VELOCIDADE ↑"),spdDown:_t("VELOCIDADE ↓"),dodge:_t("ESQUIVA"),taunt:_t("PROVOCANDO"),shield:_t("ESCUDO")})[s]||s}

/* ---------- update ---------- */
function updBattle(dt){
  if(!B)return;
  B.shake=Math.max(0,B.shake-dt*50);B.flash=Math.max(0,B.flash-dt*2.2);
  const P0=B.punch,tz=P0?P0.z:1,tx=P0?lerp(W/2,P0.x,.5):W/2,ty=P0?lerp(H/2,P0.y,.4):H/2;
  if(P0){P0.t-=dt;if(P0.t<=0)B.punch=null}
  B.cam.z=lerp(B.cam.z,tz,Math.min(1,dt*9));B.cam.x=lerp(B.cam.x,tx,Math.min(1,dt*9));B.cam.y=lerp(B.cam.y,ty,Math.min(1,dt*9));
  if(B.stop>0){B.stop-=dt;return}
  if(B.slow>0)B.slow-=dt;
  const g=dt*(B.slow>0?.35:1);
  for(const v of B.view){
    v.kb*=Math.pow(.0005,g);v.sq*=Math.pow(.002,g);v.flash=Math.max(0,v.flash-g*4);v.hpG=v.hpG>v.hp?Math.max(v.hp,v.hpG-(bU(B.S,v.id).max)*g*.7):v.hp;
    if(v.ko>=0)v.ko+=g;
    if(v.back){v.back.t+=g;const k=easeOut(clamp(v.back.t/.25,0,1));v.ox=v.back.ox*(1-k);v.oy=v.back.oy*(1-k)-Math.sin(k*Math.PI)*18;if(k>=1){v.back=null;v.ox=v.oy=0}}
  }
  if(B.phase==='intro'){
    B.it+=g;
    if(B.it>.45)bcue('vs',()=>{bsfx.boom();B.shake=20;B.flash=.5});
    B.view.forEach((v,i)=>{const s=1.9+(i%4)*.07+(v.id>=10?.04:0),k=clamp((B.it-s)/.4,0,1);v.drop=-700*(1-easeOut(k))});
    if(B.it>2.5){B.phase='play';for(const v of B.view)v.drop=0;if(SET.track!=='off')playTrack('rock')}
  }else if(B.phase==='play'){
    if(B.banner)B.banner.t+=g;
    if(!B.ev&&B.evq.length)btlEventStart(B.evq.shift());
    if(B.ev){B.et+=g;btlEventTick(B.ev,B.et);if(B.et>=B.ev.dur){const e=B.ev;B.ev=null;btlEventEnd(e)}}
    if(!B.ev&&!B.evq.length)btlIdle();
  }else if(B.phase==='end'){
    B.endT+=g;
    bcue('endsnd',()=>{const w=B.me===-1?true:B.S.win===B.me;(w?bsfx.win:bsfx.lose)();if(w)for(let i=0;i<120;i++)bfx({type:'conf',x:rand(0,W),y:rand(-200,-10),vx:rand(-60,60),vy:rand(120,300),rot:rand(0,6),vr:rand(-8,8),col:pick(['#ffd21f','#ff7ad9','#86e0c8','#5fb4ff','#ff5a5f']),max:rand(2.2,3.4)})});
    if(B.endT>2.2&&!B.ended){B.ended=true;btlShowEnd()}
  }
  for(const f of B.fx){f.life-=g;if(f.vx!=null){f.x+=f.vx*g;f.y+=f.vy*g}
    if(f.type==='spark'){f.vx*=Math.pow(.02,g);f.vy*=Math.pow(.02,g)}
    if(f.type==='num'||f.type==='plus')f.y+=f.vy*g;
    if(f.type==='conf')f.rot+=f.vr*g;
    if(f.type==='star')f.vy+=900*g}
  B.fx=B.fx.filter(f=>f.life>0);
}
// nothing left to animate: show the controls, or run the clock on the other player
function btlIdle(){
  const S0=B.S;
  if(S0.over){if(B.phase!=='end'){B.phase='end';B.endT=0}return}
  if(B.idleFor!==S0.n){B.idleFor=S0.n;B.turnShownAt=Date.now();B.sel='atk';B.hover=null;btlRenderBar()}
  const left=BTL_TURN_SEC-(Date.now()-B.turnShownAt)/1000;
  if(left<=5&&left>0)bcue('tick'+S0.n+'_'+Math.ceil(left),bsfx.tick);
  if(myTurn()){if(left<=0&&!B.sending)btlSubmit({...btlAuto(S0),auto:true})}
  else if(B.mode===_t("online")&&B.doc&&!B.sending){const late=Date.now()-(+B.doc.turnAt||B.turnShownAt);if(late>(BTL_TURN_SEC+6)*1000)btlSubmit({...btlAuto(S0),auto:true},true)}
}

/* ---------- choosing and sending actions ---------- */
function btlSubmit(a,forOther){
  if(!B||B.sending||B.S.over)return;
  if(B.mode==='local'){btlApply(a);return}
  B.sending=true;btlRenderBar();
  pvpSendAct(B.id,B.applied,a,forOther).catch(e=>{if(!/stale/.test(e.message))toast(e.message)}).finally(()=>{if(B){B.sending=false;btlRenderBar()}});
}
function btlApply(a){
  const ev=btlAct(B.S,a);B.applied++;B.evq.push(...ev);btlRenderBar();
}
function btlPickTarget(id){
  if(!myTurn()||B.sending||B.ev||B.evq.length)return;
  const u=bU(B.S,B.S.cur),ok=btlTargets(B.S,u,B.sel);
  if(!ok.includes(id)){bsfx.bad();return}
  btlSubmit({u:u.id,k:B.sel,t:id});
}
function btlUnitAt(x,y){
  let best=null,bd=1e9;
  for(const v of B.view){if(!v.alive)continue;const d=Math.hypot(x-v.x,y-v.y);if(d<v.r*1.25&&d<bd){bd=d;best=v.id}}
  return best;
}
function btlLocal(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]}
function btlPointer(e){
  if(!B)return;
  if(B.phase==='intro'){B.it=Math.max(B.it,2.5);return}
  const [x,y]=btlLocal(e),id=btlUnitAt(x,y);if(id!=null)btlPickTarget(id);
}
cv.addEventListener('pointermove',e=>{if(S.mode!=='battle'||!B)return;const [x,y]=btlLocal(e);B.hover=btlUnitAt(x,y)});
function btlRenderBar(){
  if(!B)return;
  const bar=$('btlBar');bar.textContent='';
  if(B.phase==='end'||B.S.over){bar.hidden=true;return}
  bar.hidden=false;
  const S0=B.S,u=S0.cur!=null?bU(S0,S0.cur):null;
  if(!u||B.ev||B.evq.length){bar.append(el('span','btlwait',_t("…")));return}
  const left=el('div','btlwho');left.append(thumbVerity(u.it.v,u.it.m,3.4,{f:u.it.f,badge:false}));
  const nm=el('div');nm.append(el('b',null,u.name),el('small',null,_t("Vida {0}/{1}",fmt(u.hp),fmt(u.max))));left.append(nm);bar.append(left);
  if(!myTurn()){bar.append(el('span','btlwait',_t("Vez de {0}. Esperando a escolha...",B.names[u.side])));const q=el('button','btn ghost sm',_t("Desistir"));q.onclick=btlQuitAsk;if(B.mode===_t("online"))bar.append(q);return}
  const acts=el('div','btlacts');
  const mk=(k,label,sub,dis)=>{const b=el('button','btn sm'+(B.sel===k?'':' ghost'),label);if(sub)b.append(el('small',null,sub));b.disabled=!!dis||B.sending;return b};
  const atk=mk('atk',_t("⚔ Atacar"),_t("100% de dano"));atk.onclick=()=>{B.sel='atk';btlRenderBar()};
  const def=mk('def',_t("🛡 Defender"),_t("metade do dano até a próxima vez"));def.onclick=()=>btlSubmit({u:u.id,k:'def'});
  const sk=u.sk,ready=u.cd===0,skb=mk('skill','✨ '+sk.n,ready?_t("pronta"):_t("em {0} turno(s)",u.cd),!ready);
  skb.style.setProperty('--skc',sk.c);skb.classList.add('skill');skb.title=skillDesc(sk,u.it.f);
  skb.onclick=()=>{if(sk.tg==='none')btlSubmit({u:u.id,k:'skill'});else{B.sel='skill';btlRenderBar()}};
  acts.append(atk,def,skb);bar.append(acts);
  const hint=el('div','btlhint');
  hint.append(el('b',null,B.sel==='skill'?(sk.tg==='ally'?_t("Escolha um aliado"):_t("Escolha um inimigo")):_t("Escolha quem atacar")),el('small',null,skillDesc(sk,u.it.f)));
  bar.append(hint);
  if(B.mode===_t("online")){const q=el('button','btn ghost sm',_t("Desistir"));q.onclick=btlQuitAsk;bar.append(q)}
  else{const q=el('button','btn ghost sm',_t("Sair"));q.onclick=()=>{btlClose();goMenu();openPanel('pvp')};bar.append(q)}
}
function btlQuitAsk(){confirmDo(_t("Desistir da luta?"),_t("Desistir conta como derrota no ranking."),_t("Desistir"),async()=>{if(B&&B.mode===_t("online"))await pvpForfeit(B.id,B.me)},'danger')}

/* ---------- drawing ---------- */
function drawBattleUnit(v,u){
  if(v.ko>1.3)return;
  const side=u.side,dir=side===0?1:-1;let x=vx(v),y=vy(v)+v.drop,a=1,rot=0;
  if(v.ko>=0){const k=Math.min(1,v.ko/1.3);x-=dir*k*260;y-=Math.sin(k*Math.PI)*160;rot=-dir*k*9;a=1-k}
  if(v.drop>-650&&v.ko<0){const sh=clamp(1+v.drop/700,0,1);ell(v.x+v.ox+v.kb,v.y+v.r*.95,v.r*.95*sh,v.r*.26*sh,'rgba(0,0,0,.45)')}
  const active=B.phase==='play'&&B.S.cur===u.id&&!B.S.over;
  if(active&&v.ko<0){ctx.save();ctx.translate(v.x,v.y+v.r*.92);ctx.scale(1,.3);ctx.strokeStyle='#ffd21f';ctx.lineWidth=6;ctx.globalAlpha=.6+Math.sin(S.time*6)*.3;ctx.beginPath();ctx.arc(0,0,v.r*1.25,0,TAU);ctx.stroke();ctx.restore()}
  const targetable=myTurn()&&!B.ev&&!B.evq.length&&!B.sending&&btlTargets(B.S,bU(B.S,B.S.cur),B.sel).includes(u.id);
  if(targetable&&v.alive){const col=B.sel==='skill'&&bU(B.S,B.S.cur).sk.tg==='ally'?'#6fe08a':'#ff5a5f',hov=B.hover===u.id;
    ctx.save();ctx.strokeStyle=col;ctx.lineWidth=hov?5:3;ctx.globalAlpha=hov?1:.55+Math.sin(S.time*5)*.25;ctx.beginPath();ctx.arc(x,y,v.r*(hov?1.4:1.3),0,TAU);ctx.stroke();
    for(let i=0;i<4;i++){const an=i*Math.PI/2+S.time*(hov?2:.8);line([[x+Math.cos(an)*v.r*1.15,y+Math.sin(an)*v.r*1.15],[x+Math.cos(an)*v.r*1.6,y+Math.sin(an)*v.r*1.6]],col,3)}ctx.restore()}
  const bob=v.alive&&B.phase!=='intro'?Math.sin(S.time*3+v.ph)*3:0;
  ctx.save();ctx.globalAlpha=a;ctx.translate(x,y+bob);ctx.rotate(rot);ctx.scale(1+v.sq*.3,1-v.sq*.3);
  if(u.def&&v.alive){ctx.save();ctx.globalAlpha=.35;circ(0,0,v.r*1.25,'#5fb4ff');ctx.restore()}
  drawVariant(0,0,v.r,u.it.v,u.it.m,{f:u.it.f,glow:.5,badge:false,hurt:v.flash>.35||v.ko>=0});
  if(v.flash>0)circ(0,0,v.r,`rgba(255,255,255,${v.flash*.7})`);
  ctx.restore();
  if(!v.alive||B.phase==='intro')return;
  if(active){const ay=v.y-v.r-70+Math.sin(S.time*5)*6;poly([[v.x-12,ay],[v.x+12,ay],[v.x,ay+16]],'#ffd21f')}
  // nameplate: life bar, skill readiness and statuses
  const bw=v.r*2.3,bx=v.x-bw/2,by=v.y-v.r-34;
  rr(bx-3,by-3,bw+6,16,6);ctx.fillStyle='rgba(0,0,0,.7)';ctx.fill();
  rr(bx,by,bw*v.hpG/u.max,10,5);ctx.fillStyle='#ffffff';ctx.fill();rr(bx,by,bw*v.hp/u.max,10,5);ctx.fillStyle=side===0?'#4fe3b0':'#ff5a5f';ctx.fill();
  const sh=u.st.find(e=>e.s==='shield');if(sh){rr(bx,by-5,Math.min(bw,bw*sh.v/u.max),4,2);ctx.fillStyle='#86e0c8';ctx.fill()}
  circ(bx-12,by+5,8,u.cd===0?u.sk.c:'rgba(255,255,255,.15)');if(u.cd>0)txt(String(u.cd),bx-12,by+5,11,'#fff',{font:'b',stroke:false});else txt('✨',bx-12,by+5,10,'#fff',{stroke:false});
  u.st.filter(e=>e.s!=='shield').forEach((e,i)=>{const I=ST_INFO[e.s];if(!I)return;const sx=bx+i*20+8,sy=by+24;circ(sx,sy,9,'rgba(0,0,0,.65)');ctx.strokeStyle=I.c;ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,9,0,TAU);ctx.stroke();txt(I.ic,sx,sy+1,10,I.c,{font:'b',stroke:false})});
}
function drawBattleFx(){
  for(const f of B.fx){const k=clamp(f.life/f.max,0,1);ctx.globalAlpha=1;
    switch(f.type){
      case 'spark':ctx.save();ctx.globalCompositeOperation='lighter';line([[f.x,f.y],[f.x-f.vx*.03,f.y-f.vy*.03]],f.col,f.w*k+.5);ctx.restore();break;
      case 'ring':ctx.save();ctx.globalAlpha=k;ctx.strokeStyle=f.col;ctx.lineWidth=f.w*k+1;ctx.beginPath();ctx.ellipse(f.x,f.y,f.R*(1-k*.8),f.R*(1-k*.8)*.7,0,0,TAU);ctx.stroke();ctx.restore();break;
      case 'glow':{ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,f.R);g.addColorStop(0,`rgba(${f.col},${.55*k})`);g.addColorStop(1,`rgba(${f.col},0)`);ctx.fillStyle=g;ctx.fillRect(f.x-f.R,f.y-f.R,f.R*2,f.R*2);ctx.restore();break}
      case 'num':{const age=f.max-f.life,sc=age<.12?1.5-age/.12*.5:1;ctx.globalAlpha=Math.min(1,k*2);ctx.save();ctx.translate(f.x,f.y);ctx.scale(sc,sc);txt(f.t,0,0,f.size,f.col,{sc:'rgba(0,0,0,.85)'});ctx.restore();break}
      case 'ghost':{const u=bU(B.S,f.id);ctx.globalAlpha=k*.35;drawVariant(f.x,f.y,f.v.r,u.it.v,u.it.m,{f:u.it.f,noFx:true,glow:0,badge:false});break}
      case 'orb':{ctx.save();ctx.globalCompositeOperation='lighter';circ(f.x,f.y,10*k+4,f.col);circ(f.x,f.y,5*k+2,'#ffffff');ctx.restore();break}
      case 'conf':ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.rot);ctx.fillStyle=f.col;ctx.fillRect(-6,-3,12,6);ctx.restore();break;
      case 'plus':ctx.globalAlpha=k;txt('+',f.x,f.y,22,'#6fe08a',{sc:'rgba(0,40,10,.8)'});break;
      case 'star':ctx.globalAlpha=k;star4(f.x,f.y,10,f.col);break;
      case 'pillar':{ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createLinearGradient(f.x-44,0,f.x+44,0);g.addColorStop(0,`rgba(${f.col},0)`);g.addColorStop(.5,`rgba(${f.col},${.75*k})`);g.addColorStop(1,`rgba(${f.col},0)`);ctx.fillStyle=g;ctx.fillRect(f.x-44,-100,88,f.y+150);ctx.restore();break}
    }
  }
  ctx.globalAlpha=1;
}
function drawBattleHUD(){
  const S0=B.S;
  for(const s of[0,1]){
    const x=s===0?30:W-30,al=s===0?'left':'right',mine=B.me===s;
    txt(B.names[s]+(mine?' '+_t("(você)"):''),x,30,24,s===0?'#4fe3b0':'#ff8a90',{align:al});
    if(B.ratings&&B.ratings[s]!=null)txt('🏆 '+fmt(B.ratings[s]),x,56,15,'#ffd21f',{align:al,font:'b'});
  }
  rr(W/2-120,8,240,54,12);ctx.fillStyle='rgba(5,8,10,.75)';ctx.fill();ctx.strokeStyle='rgba(255,210,31,.6)';ctx.lineWidth=2;ctx.stroke();
  txt(_t("RODADA {0}/{1}",Math.max(1,Math.min(S0.round,BTL_ROUNDS)),BTL_ROUNDS),W/2,26,16,'#ffd21f',{font:'b',stroke:false});
  // turn order
  const order=[S0.cur,...S0.queue].filter(id=>id!=null&&bU(S0,id).alive).slice(0,8);
  order.forEach((id,i)=>{const u=bU(S0,id),xx=W/2-((order.length-1)*26)/2+i*26,yy=46;circ(xx,yy,11,u.side===0?'#1f6a5a':'#7a1a2a');if(i===0){ctx.strokeStyle='#ffd21f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(xx,yy,12,0,TAU);ctx.stroke()}drawVariant(xx,yy,8,u.it.v,u.it.m,{noFx:true,glow:0,badge:false,f:u.it.f})});
  // turn clock
  if(B.phase==='play'&&!S0.over&&S0.cur!=null&&!B.ev&&!B.evq.length){
    const left=clamp(BTL_TURN_SEC-(Date.now()-B.turnShownAt)/1000,0,BTL_TURN_SEC),cx=W/2+150,cy=34;
    circ(cx,cy,20,'rgba(0,0,0,.7)');ctx.strokeStyle=left<6?'#ff5a5f':'#ffd21f';ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,18,-Math.PI/2,-Math.PI/2+TAU*left/BTL_TURN_SEC);ctx.stroke();
    txt(String(Math.ceil(left)),cx,cy+1,15,'#fff',{font:'b',stroke:false});
  }
}
function drawBattleBanner(b){
  const u=bU(B.S,b.u),v=bV(b.u),dir=u.side===0?1:-1,inK=easeOut(clamp(b.t/.15,0,1)),outK=easeIn(clamp((b.t-.65)/.2,0,1));
  ctx.fillStyle=`rgba(0,0,0,${.45*(1-outK)})`;ctx.fillRect(0,0,W,H);
  ctx.save();ctx.translate(W/2+(-(1-inK)*1500+outK*1500)*dir,H/2-20);ctx.rotate(-.08*dir);
  const g=ctx.createLinearGradient(-W,0,W,0);g.addColorStop(0,'rgba(0,0,0,.92)');g.addColorStop(.5,b.sk.c);g.addColorStop(1,'rgba(0,0,0,.92)');
  ctx.fillStyle=g;ctx.fillRect(-W,-95,W*2,190);ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(-W,-102,W*2,6);ctx.fillRect(-W,96,W*2,6);
  ctx.save();ctx.globalAlpha=.3;for(let i=0;i<14;i++){const yy=-85+((i*37)%170),xx=((S.time*2400*dir+i*271)%(W*2))-W;ctx.fillStyle='#fff';ctx.fillRect(xx,yy,180,3)}ctx.restore();
  drawVariant(-dir*390,0,96,u.it.v,u.it.m,{f:u.it.f,glow:1,badge:false});
  txt(b.sk.n.toUpperCase(),dir*110,-14,64,'#ffffff',{sc:'rgba(0,0,0,.9)'});
  txt(u.name,dir*110,46,24,'#ffd21f',{sc:'rgba(0,0,0,.9)'});
  ctx.restore();
}
function drawBattleIntro(){
  const it=B.it,kin=easeOut(clamp(it/.35,0,1)),kout=easeIn(clamp((it-1.85)/.3,0,1));
  if(it>2.2)return;
  for(const s of[0,1]){
    const d=s===0?-1:1,off=d*((1-kin)*W*.6+kout*W*.7);
    ctx.save();ctx.translate(off,0);
    const pts=s===0?[[0,0],[W*.57,0],[W*.43,H],[0,H]]:[[W*.57,0],[W,0],[W,H],[W*.43,H]];
    const g=ctx.createLinearGradient(s===0?0:W,0,W/2,0);g.addColorStop(0,s===0?'#0d3a33':'#3a0d14');g.addColorStop(1,s===0?'#1f7a6a':'#a8233a');poly(pts,g);
    const cx=s===0?W*.25:W*.75;
    txt(B.names[s],cx,215,54,'#ffffff');
    if(B.ratings&&B.ratings[s]!=null)txt('🏆 '+fmt(B.ratings[s]),cx,262,22,'#ffd21f',{font:'b'});
    const us=B.S.units.filter(u=>u.side===s);us.forEach((u,i)=>drawVariant(cx+(i-(us.length-1)/2)*96,380+(i%2)*60,38,u.it.v,u.it.m,{f:u.it.f,glow:.6,badge:false}));
    ctx.restore();
  }
  if(it>.45){const k=clamp((it-.45)/.15,0,1),sc=lerp(3,1,easeOut(k));ctx.save();ctx.globalAlpha=1-kout;ctx.translate(W/2,H/2);ctx.scale(sc,sc);ctx.rotate(-.08);txt('VS',0,0,150,'#ffd21f',{sc:'#3a0000'});ctx.restore()}
}
function drawBattle(){
  if(!B)return;
  ctx.save();
  const c=B.cam,sh=RM?0:B.shake;
  ctx.translate(W/2+(Math.random()-.5)*sh,H/2+(Math.random()-.5)*sh);ctx.scale(c.z,c.z);ctx.translate(-c.x,-c.y);
  ctx.drawImage(BTL_BG,0,0,W,H);drawThroneLive();
  for(const u of [...B.S.units].sort((a,b)=>bV(a.id).y-bV(b.id).y))drawBattleUnit(bV(u.id),u);
  drawBattleFx();
  ctx.restore();
  if(B.phase!=='intro')drawBattleHUD();
  for(const f of B.fx)if(f.type==='roundban'){const k=clamp(f.life/f.max,0,1),a=Math.min(1,k*3);ctx.save();ctx.globalAlpha=a;ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(0,H/2-50,W,100);txt(_t("RODADA {0}",f.r),W/2,H/2,64,'#ffd21f',{sc:'#3a2a00'});ctx.restore()}
  if(B.banner)drawBattleBanner(B.banner);
  if(B.phase==='intro')drawBattleIntro();
  if(B.phase==='end'){
    const w=B.me===-1?null:B.S.win===B.me,k=easeOut(clamp(B.endT/.3,0,1));
    ctx.fillStyle=`rgba(0,0,0,${.35*k})`;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.translate(W/2,H/2-40);ctx.scale(lerp(2.4,1,k),lerp(2.4,1,k));ctx.globalAlpha=k;
    txt(w==null?_t("{0} VENCEU!",B.names[B.S.win].toUpperCase()):w?_t("VITÓRIA!"):_t("DERROTA"),0,0,w==null?90:140,w===false?'#ff5a5f':'#ffd21f',{sc:'#2a1a00'});ctx.restore();
  }
  if(B.flash>0){ctx.fillStyle=`rgba(255,255,255,${B.flash})`;ctx.fillRect(0,0,W,H)}
}

/* ---------- end screen ---------- */
function btlShowEnd(){
  const S0=B.S,w=B.me===-1?null:S0.win===B.me;
  $('beEyebrow').textContent=_t("Batalha · {0} contra {1}",B.names[0],B.names[1]);
  $('beTitle').textContent=w==null?_t("{0} venceu!",B.names[S0.win]):w?_t("Vitória!"):_t("Derrota");
  const by={ko:_t("Nocaute: o outro time caiu inteiro."),rounds:_t("Acabaram as {0} rodadas: venceu quem tinha mais vida.",BTL_ROUNDS),quit:_t("O outro jogador desistiu.")}[S0.by||B.by]||'';
  $('beSub').textContent=by;
  const rd=$('beRating');rd.textContent='';
  if(B.mode===_t("online")&&B.result){const d=B.result.delta;rd.append(el('b',d>=0?'up':'down',(d>=0?'+':'')+d+' 🏆'),el('span',null,_t("Agora: {0} pontos",fmt(P.pvp.r))))}
  $('beAgain').hidden=B.mode!==_t("online"); $('btlBar').hidden=true; $('btlEnd').hidden=false;
}
$('beAgain').onclick=()=>{if(!B)return;const other=B.me===0?{uid:B.doc.b,name:B.names[1]}:{uid:B.doc.a,name:B.names[0]};btlClose();goMenu();pvpChallengeFlow(other.uid,other.name)};
$('beBack').onclick=()=>{btlClose();goMenu();openPanel('pvp')};

/* ======================================================================
   ONLINE: challenges, the fight doc, ratings, presence and the Rei do Morro
   ====================================================================== */
const PVP={inv:[],mine:[],king:null,list:null,loading:false,waiting:null,hb:null,seenOpen:{}};
const pvpOnlineNow=t=>Date.now()-(+t||0)<BTL_ONLINE_SEC*1000;
const pvpTeamDefault=()=>[...team()].sort((a,b)=>itemPower(b)-itemPower(a)).slice(0,BTL_N).map(i=>({v:i.v,m:i.m,f:i.f||0,lvl:i.lvl}));
const kingLuck=()=>PVP.king&&PVP.king.day===todayKey()&&NET.uid&&PVP.king.uid===NET.uid?1.3:1;
function pvpElo(me,other,score){const exp=1/(1+Math.pow(10,(other-me)/400));return Math.round(PVP_K*(score-exp))}

function pvpSubscribe(){
  if(!online())return;
  const fs=NET.fs,uid=NET.uid,mapDocs=s=>s.docs.map(d=>({id:d.id,...d.data()}));
  NET.unsubs.push(fs.collection('battles').where('b','==',uid).onSnapshot(s=>{PVP.inv=mapDocs(s);pvpHandle()},()=>{}));
  NET.unsubs.push(fs.collection('battles').where('a','==',uid).onSnapshot(s=>{PVP.mine=mapDocs(s);pvpHandle()},()=>{}));
  clearInterval(PVP.hb); PVP.hb=setInterval(pvpHeartbeat,60000); pvpHeartbeat(); kingSync();
}
function pvpHeartbeat(){if(online()&&P.username)NET.fs.collection('players').doc(NET.uid).set({seenAt:Date.now()},{merge:true}).catch(()=>{})}
// reacts to every change in my battles: new challenges, accepted ones, finished ones, cleanup
function pvpHandle(){
  const all=[...PVP.inv,...PVP.mine];
  for(const d of all){
    const meSide=d.a===NET.uid?0:1;
    if(d.status==='invite'&&meSide===1&&Date.now()-(+d.at||0)<60000&&!PVP.seenOpen['i'+d.id]){PVP.seenOpen['i'+d.id]=1;pvpInvitePrompt(d)}
    if(d.status==='active'){
      if(B&&B.id===d.id){btlSync(d);continue}
      if(Date.now()-(+d.turnAt||+d.at||0)>BTL_STALE_MS){pvpFinishStale(d);continue}
      if(!B&&!PVP.seenOpen['a'+d.id]&&(S.mode==='menu'||S.mode==='boot')){PVP.seenOpen['a'+d.id]=1;pvpOpen(d)}
    }
    if(d.status==='done'){if(B&&B.id===d.id)btlSync(d);pvpSettle(d,meSide)}
    if(d.status==='declined'&&meSide===0&&PVP.waiting===d.id){PVP.waiting=null;closeModal();toast(_t("{0} recusou o desafio.",d.bn))}
    if(['done','declined','canceled'].includes(d.status)&&Date.now()-(+d.at||0)>86400000&&meSide===0)NET.fs.collection('battles').doc(d.id).delete().catch(()=>{});
  }
  if(PVP.waiting){const w=all.find(x=>x.id===PVP.waiting);if(w&&w.status==='active'){PVP.waiting=null;closeModal()}}
  if(typeof updateBadges==='function')updateBadges();
}
function pvpOpen(d){
  const meSide=d.a===NET.uid?0:1;
  btlOpen({mode:_t("online"),id:d.id,doc:d,teams:[d.ta,d.tb],seed:d.seed,names:[d.an,d.bn],ratings:[d.ra,d.rb],me:meSide});
}
// catches the local fight up with the actions in the doc
function btlSync(d){
  if(!B||B.id!==d.id)return; B.doc=d;
  const acts=d.acts||[];
  while(B.applied<acts.length&&!B.S.over)btlApply(acts[B.applied]);
  if(d.status==='done'&&d.by==='quit'&&!B.S.over){B.S.over=true;B.S.win=d.win;B.S.by='quit';B.by='quit';B.evq.push({k:'end',win:d.win,by:'quit'})}
  if(d.status==='done'){const meSide=B.me;const r=pvpSettle(d,meSide);if(r)B.result=r}
  btlRenderBar();
}
async function pvpSendAct(id,expected,a,forOther){
  const ref=NET.fs.collection('battles').doc(id);
  await NET.fs.runTransaction(async tx=>{
    const s=await tx.get(ref); if(!s.exists)throw new Error(_t("Essa luta não existe mais."));
    const d=s.data(); if(d.status!=='active')throw new Error('stale');
    const acts=d.acts||[]; if(acts.length!==expected)throw new Error('stale');
    if(forOther&&Date.now()-(+d.turnAt||0)<(BTL_TURN_SEC+4)*1000)throw new Error('stale');
    const next=[...acts,{u:a.u,k:a.k,t:a.t??null,...(a.auto?{auto:true}:{})}];
    const Sx=btlReplay(d.ta,d.tb,d.seed,next);
    const up={acts:next,turnAt:Date.now()};
    if(Sx.over){up.status='done';up.win=Sx.win;up.by=Sx.by;up.endAt=Date.now()}
    tx.update(ref,up);
  });
}
async function pvpForfeit(id,meSide){
  const ref=NET.fs.collection('battles').doc(id);
  await NET.fs.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists)return;const d=s.data();if(d.status!=='active')return;tx.update(ref,{status:'done',win:1-meSide,by:'quit',endAt:Date.now()})});
}
// nobody played for minutes: whoever opens the game finishes it with automatic moves
async function pvpFinishStale(d){
  if(PVP.seenOpen['s'+d.id])return; PVP.seenOpen['s'+d.id]=1;
  const ref=NET.fs.collection('battles').doc(d.id);
  try{await NET.fs.runTransaction(async tx=>{const s=await tx.get(ref);if(!s.exists)return;const x=s.data();if(x.status!=='active'||Date.now()-(+x.turnAt||+x.at||0)<BTL_STALE_MS)return;
    const Sx=btlReplay(x.ta,x.tb,x.seed,x.acts||[]),acts=[...(x.acts||[])];let guard=0;
    while(!Sx.over&&guard++<400){const a={...btlAuto(Sx),auto:true};btlAct(Sx,a);acts.push({u:a.u,k:a.k,t:a.t??null,auto:true})}
    tx.update(ref,{acts,status:'done',win:Sx.win,by:Sx.by,endAt:Date.now()})})}catch(e){}
}
// my rating changes once per finished fight
function pvpSettle(d,meSide){
  const k='pv:'+d.id; if(settledHas(k))return B&&B.id===d.id?B.result:null;
  const mineR=meSide===0?(+d.ra||1000):(+d.rb||1000),otherR=meSide===0?(+d.rb||1000):(+d.ra||1000),won=d.win===meSide;
  const delta=pvpElo(mineR,otherR,won?1:0);
  P.pvp.r=Math.max(0,P.pvp.r+delta); if(won)P.pvp.w++;else P.pvp.l++;
  P.pvp.last=Date.now(); settle(k); saveProfile();
  if(won&&P.pvp.w===1)announce(_t("venceu a primeira batalha!"));
  const r={delta,won}; if(B&&B.id===d.id)B.result=r; return r;
}
/* challenges */
function pvpPickTeam(title,go){
  const sel=new Set(pvpTeamDefault().map((x,i)=>i)),pool=[...P.items].sort((a,b)=>itemPower(b)-itemPower(a)).slice(0,40);
  const chosen=new Set(pvpTeamDefault().map(t=>pool.findIndex(p=>p.v===t.v&&p.m===t.m&&(p.f||0)===t.f&&p.lvl===t.lvl)).filter(i=>i>=0));
  const g=el('div','igrid share'),cnt=el('p','small');
  const draw=()=>{g.textContent='';cnt.textContent=_t("Escolhidas: {0}/{1}. Cada uma usa a habilidade da variante dela na luta.",chosen.size,BTL_N);
    pool.forEach((it,i)=>{const c=itemCard(it,{em:3.2,sel:chosen.has(i),extra:'✨ '+skillOf(it.v).n,onClick:()=>{if(chosen.has(i))chosen.delete(i);else if(chosen.size<BTL_N)chosen.add(i);draw()}});c.title=skillDesc(skillOf(it.v),it.f||0);g.append(c)})};
  draw();
  modal(title,[cnt,g],[{label:_t("Lutar"),fn:()=>{if(chosen.size<1){toast(_t("Escolha pelo menos 1 Verity."));return false}const t=[...chosen].map(i=>pool[i]).map(i=>({v:i.v,m:i.m,f:i.f||0,lvl:i.lvl}));go(t)}},{label:_t("Cancelar"),cls:'ghost'}]);
}
async function pvpChallengeFlow(uid,name){
  const e=needOnline(); if(e){toast(e);return}
  if(!P.items.length){toast(_t("Você ainda não tem Verities."));return}
  pvpPickTeam(_t("Sua equipe contra {0}",name),async t=>{
    try{
      const other=(PVP.list||[]).find(x=>x.uid===uid);
      const ref={id:await pvpCreate(uid,name,t,other?other.r:1000)};
      PVP.waiting=ref.id;
      modal(_t("Desafio enviado!"),[el('p','small',_t("Esperando {0} aceitar. Se não responder em 1 minuto, o desafio expira.",name))],[{label:_t("Cancelar desafio"),cls:'ghost',fn:async()=>{PVP.waiting=null;await NET.fs.collection('battles').doc(ref.id).update({status:'canceled'}).catch(()=>{})}}]);
      setTimeout(async()=>{if(PVP.waiting===ref.id){PVP.waiting=null;closeModal();toast(_t("{0} não respondeu.",name));await NET.fs.collection('battles').doc(ref.id).update({status:'canceled'}).catch(()=>{})}},60000);
    }catch(err){toast(err.message)}
  });
}
async function pvpCreate(uid,name,t,rb){
  const ref=await NET.fs.collection('battles').add({a:NET.uid,b:uid,an:P.username,bn:name,ta:t,tb:null,ra:P.pvp.r,rb,seed:Math.floor(Math.random()*2147483647),status:'invite',acts:[],at:Date.now(),turnAt:0,ver:BTL_VER});
  return ref.id;
}
async function pvpAccept(id,t){
  await NET.fs.runTransaction(async tx=>{const ref=NET.fs.collection('battles').doc(id),s2=await tx.get(ref);if(!s2.exists||s2.data().status!=='invite')throw new Error(_t("Esse desafio não está mais valendo."));tx.update(ref,{tb:t,bn:P.username,rb:P.pvp.r,status:'active',turnAt:Date.now()})});
}
function pvpInvitePrompt(d){
  if(B||playing()){setTimeout(()=>{if(!B&&!playing())pvpInvitePrompt(d)},5000);return}
  sfx.ok();
  const g=el('div','arteam');for(const it of d.ta||[]){const m=el('div','armem');m.append(thumbVerity(it.v,it.m,3.4,{f:it.f,badge:false}),el('small',null,fullName(it.v,it.m,it.f)));g.append(m)}
  modal(_t("⚔ {0} te desafiou!",d.an),[el('p','small',_t("{0} ({1} pontos) quer lutar com esta equipe:",d.an,fmt(d.ra||1000))),g],[
    {label:_t("Aceitar"),fn:()=>{const s=MODAL_SEQ;pvpPickTeam(_t("Sua equipe contra {0}",d.an),async t=>{
      try{await pvpAccept(d.id,t)}catch(e){toast(e.message)}});return false}},
    {label:_t("Recusar"),cls:'ghost',fn:async()=>{await NET.fs.collection('battles').doc(d.id).update({status:'declined'}).catch(()=>{})}}]);
}
/* Rei do Morro: whoever is first in the battle ranking when the day starts, for that whole day */
async function kingSync(){
  if(!online()||SMOKE_RUN)return; // self-tests must never pick a real Rei do Morro
  const day=todayKey(),ref=NET.fs.collection('kings').doc(day);
  try{
    let s=await ref.get();
    if(!s.exists){
      const top=await NET.fs.collection('players').orderBy('pvpR','desc').limit(1).get();
      if(!top.empty){const t=top.docs[0],x=t.data();try{await ref.set({uid:t.id,name:String(x.username||'?').slice(0,20),r:+x.pvpR||1000,at:Date.now()})}catch(e){}s=await ref.get()}
    }
    PVP.king=s.exists?{day,...s.data()}:null;
    if(PVP.king&&PVP.king.uid===NET.uid&&P.stats.kingDay!==day){P.stats.kingDay=day;P.stats.kings=(P.stats.kings||0)+1;saveProfile();announce(_t("é o Rei do Morro de hoje! 👑"));toast(_t("👑 Você é o Rei do Morro hoje: +30% de sorte de variante e mutação!"),5000)}
  }catch(e){}
  if(typeof renderMenu==='function'&&!$('menu').hidden)renderMenu();
}
setInterval(()=>{if(online()&&(!PVP.king||PVP.king.day!==todayKey()))kingSync()},10*60*1000);
async function pvpLoadList(){
  if(!online()||PVP.loading)return; PVP.loading=true;
  try{
    const fs=NET.fs,[rk,on]=await Promise.all([fs.collection('players').orderBy('pvpR','desc').limit(50).get(),fs.collection('players').orderBy('seenAt','desc').limit(40).get()]);
    const map=new Map();
    const add=d=>{const x=d.data();if(!x.username)return;const p=map.get(d.id)||{uid:d.id,username:String(x.username).slice(0,20),r:+x.pvpR||1000,rated:x.pvpR!=null,w:+(x.pvp&&x.pvp.w)||0,l:+(x.pvp&&x.pvp.l)||0,seen:+x.seenAt||0,power:+x.power||0,eq:x.eq,pets:x.pets||[],rebirths:+x.rebirths||0};map.set(d.id,p)};
    rk.docs.forEach(add);on.docs.forEach(add);
    PVP.list=[...map.values()].sort((a,b)=>(b.rated-a.rated)||(b.r-a.r)||(b.seen-a.seen));
  }catch(e){toast(e.message)}
  PVP.loading=false; if(!$('pvp').hidden)renderPvp();
}
RENDER.pvp=fresh=>{if(fresh)pvpLoadList();renderPvp()};
function renderPvp(){
  const box=$('pvpBody');box.textContent='';
  $('pvpMe').textContent=_t("🏆 {0} · {1}V {2}D",fmt(P.pvp.r),P.pvp.w,P.pvp.l);
  if(PVP.king&&PVP.king.day===todayKey())box.append(el('p','kingban',_t("👑 Rei do Morro de hoje: {0} (+30% de sorte de variante e mutação o dia todo)",PVP.king.name)));
  else box.append(el('p','kingban dim',_t("👑 Rei do Morro: quem estiver em 1º no ranking de batalha quando o dia virar ganha +30% de sorte o dia inteiro.")));
  if(BTL_TEST){const tr=el('button','btn sm',_t("Treino local (você controla os dois lados)"));tr.onclick=btlLocalPractice;const r=el('div','row left');r.append(tr);box.append(r)}
  if(!online()){box.append(el('p','notice',netText()));return}
  const rows=el('div','rows');
  if(!PVP.list)rows.append(el('p','empty',PVP.loading?_t("Carregando..."):_t("Sem dados.")));
  let pos=0;
  for(const p of PVP.list||[]){
    if(p.rated)pos++;
    const row=el('div','lrow pvprow'+(p.uid===NET.uid?' me':''));
    row.append(el('span','pos',p.rated?String(pos):'–'),thumbAvatar(p.eq,3));
    const on=pvpOnlineNow(p.seen),nm=el('span','lname');
    const king=PVP.king&&PVP.king.uid===p.uid&&PVP.king.day===todayKey();
    nm.append(el('b',null,(king?'👑 ':'')+p.username+(p.rebirths?' ★'+p.rebirths:'')),el('small',null,(on?'🟢 '+_t("online"):'⚪ '+_t("offline"))+' · '+_t("🏆 {0} · {1}V {2}D · poder {3}",fmt(p.r),p.w,p.l,fmt(p.power))));row.append(nm);
    const pets=el('span','pvppets');for(const it of (p.pets||[]).slice(0,4))pets.append(thumbVerity(it.v,it.m,2.2,{f:it.f,badge:false}));row.append(pets);
    const b=el('button','btn sm danger',_t("⚔ Desafiar"));b.disabled=p.uid===NET.uid||!on;b.title=on?'':_t("Só dá pra desafiar quem está online agora.");
    b.onclick=()=>pvpChallengeFlow(p.uid,p.username);row.append(b);rows.append(row);
  }
  box.append(rows);
}
$('pvpRefresh').onclick=()=>{sfx.click();pvpLoadList()};
/* test build: one window, you play both sides with your own Verities */
function btlLocalPractice(){
  const pool=[...P.items].sort((a,b)=>itemPower(b)-itemPower(a)).map(i=>({v:i.v,m:i.m,f:i.f||0,lvl:i.lvl}));
  if(pool.length<2){toast(_t("Precisa de pelo menos 2 Verities."));return}
  const a=pool.filter((_,i)=>i%2===0).slice(0,BTL_N),b=pool.filter((_,i)=>i%2===1).slice(0,BTL_N);
  btlOpen({mode:'local',teams:[a,b],seed:Math.floor(Math.random()*2147483647),names:[_t("Time 1"),_t("Time 2")],me:-1});
}
$('mPvp').onclick=()=>openPanel('pvp');
$('mPvp').hidden=!BTL_TEST; // the battle menu only shows in the test build until it is released
