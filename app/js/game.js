'use strict';
/* ===== game: the run (intestine → throne → reveal), invasion, rolls, main loop, input ===== */
let run=null;
const keys={up:false,down:false,space:false};
let ptrHold=false;
function newRun(world,boss){
  const w=clamp(world||P.world.cur||1,1,P.world.max),tm=team(),B=WORLDS[w-1].boss;
  return{score1:0,fiber:0,coffee:0,comfort:100,hits:0,knockOk:0,knockMiss:0,p1Comfort:100,boosts:{},lockUsed:false,bath:bathOf(P.eq.bath),intr:P.eq.intr,eq:{...P.eq},
    world:w,W:WORLDS[w-1],radio:0,pet:petBonus(tm),pets:tm.map(i=>({v:i.v,m:i.m,f:i.f||0,lvl:i.lvl})),power:teamPower(tm),
    boss:boss?{...B,max:B.hp,t:0,dmgAcc:0,dmgT:0,jumpT:5,off:0,invT:8,inv:0,hurtT:0}:null};
}
function consumeBoosts(){run.boosts={};let any=false;for(const k of Object.keys(BOOSTS))if((P.boosts[k]||0)>0){P.boosts[k]--;run.boosts[k]=true;any=true}if(any)saveProfile()}
const mutLuck=()=>(run.boosts.mut2?2:1)*(run.boosts.mut15?1.5:1)*run.bath.luck*(1+run.pet.mutluck)*(1+run.radio)*rbLuck()*evMods().mut;
const bm=k=>!!(run&&run.boss&&run.boss.mods.includes(k));
const varLuck=()=>(run.boosts.var2?2:1)*(run.boosts.var15?1.5:1)*run.bath.luck*(1+run.pet.varluck)*rbLuck();

const BANDS=[
  {min:95,pool:[['exu',8],['lord',32],['moggity',60]]},
  {min:80,pool:[['moggity',20],['lovity',40],['larpity',40]]},
  {min:60,pool:[['verity',50],['obesity',30],['larpity',20]]},
  {min:40,pool:[['verity',30],['falsity',50],['obesity',20]]},
  {min:20,pool:[['cruelty',60],['falsity',40]]},
  {min:-1,pool:[['eclipse',60],['cruelty',40]]}
];
function rollVariant(c,luck){
  const band=BANDS.find(b=>c>=b.min)||BANDS[BANDS.length-1];
  let pool=band.min===95&&c>=100?[['exu',25],['lord',30],['moggity',45]]:band.pool;
  const order=[...pool].sort((a,b)=>VARS[a[0]].base-VARS[b[0]].base).map(p=>p[0]);
  pool=pool.map(([k,w])=>[k,w*Math.pow(luck,order.indexOf(k))]);
  let tot=pool.reduce((s,p)=>s+p[1],0),r=Math.random()*tot;
  for(const [k,w] of pool){if((r-=w)<0)return k}
  return pool[0][0];
}
function rollMut(T,luck){
  const m=clamp(T/700,.2,2.5)*luck;
  for(let i=MUTS.length-1;i>=1;i--){const u=MUTS[i];if(T>=u.min&&Math.random()<u.p*m)return u.k}
  return 'none';
}

function weighted(ws){let tot=ws.reduce((s,p)=>s+p[1],0),r=Math.random()*tot;for(const [k,w] of ws){if((r-=w)<0)return k}return ws[0][0]}
function rollWorldVariant(world,c,luck){
  const Wd=WORLDS[world-1];
  if(Wd.pool.length&&Math.random()<.35){
    const pool=Wd.pool.filter(p=>c>=p[1]);
    if(pool.length){const order=[...pool].sort((a,b)=>VARS[a[0]].base-VARS[b[0]].base).map(p=>p[0]);return weighted(pool.map(([k,,w])=>[k,w*Math.pow(luck,order.indexOf(k))]))}
  }
  return rollVariant(c,luck);
}

/* ======================= ETAPA 1 — O INTESTINO (horizontal) ======================= */
const BR=20,P1LEN=8200,BX=340;
const tubeC=wx=>H/2+Math.sin(wx*.0026)*120+Math.sin(wx*.0071+1.3)*38;
const tubeH=wx=>{const k=clamp(wx/P1LEN,0,1);return (175+Math.sin(wx*.0043+2)*30-k*40)*(run&&run.W?run.W.narrow:1)};
function initP1(){
  const objs=[],Wd=run.W; let x=900;
  while(x<P1LEN-150){
    const r=Math.random(); let type=r<.44?'colica':r<.74?'fibra':r<.88?'gas':'cafe';
    if(Wd.special&&Math.random()<Math.min(.32,(Wd.special.startsWith('mix')?.2:.15)+Wd.fase*.015))type=Wd.special==='mix'?pick(['acido','radio','gelo','pimenta','asteroide','bug']):Wd.special==='mix2'?pick(SPECIAL_KEYS):Wd.special;
    const c=tubeC(x),h=tubeH(x);
    objs.push({type,x,y:clamp(c+rand(-.72,.72)*(h-30),70,H-70),r:type==='colica'?23:type==='gas'?27:type==='asteroide'?26:SPECIAL_KEYS.includes(type)?21:17,seed:rand(0,6),dead:false});
    x+=(rand(150,240)-(x/P1LEN)*45)*Wd.dense;
  }
  S.p1={cam:0,y:tubeC(BX),vy:0,bx:BX,boost:0,inv:0,wallCd:0,objs,ptr:null,done:false,endT:0,t:0,slip:0,invert:0,hist:[]};
  run.comfort=100; run.score1=0; run.fiber=0; run.coffee=0; run.hits=0;
}
const p1Speed=p=>(300+(p.boost>0?200:0)+p.cam/P1LEN*80)*run.W.speed;
function hurt(n){run.comfort-=n*run.W.dmg*(run.boosts.comfort?.5:1)*(1-run.pet.comfort)}
function updP1(dt){
  const p=S.p1; p.t+=dt;
  const spd=p.done?140:p1Speed(p);
  p.cam+=spd*dt; p.boost=Math.max(0,p.boost-dt); p.inv=Math.max(0,p.inv-dt); p.wallCd=Math.max(0,p.wallCd-dt);
  if(p.done){p.endT+=dt;p.bx+=320*dt;p.y=lerp(p.y,tubeC(p.cam+p.bx),dt*3);updFx(dt,spd);if(p.endT>1.1){run.p1Comfort=clamp(run.comfort,0,100);track('comfort',Math.round(run.p1Comfort));showCard2()}return}
  p.slip=Math.max(0,p.slip-dt); p.invert=Math.max(0,p.invert-dt); p.sticky=Math.max(0,(p.sticky||0)-dt); p.stun=Math.max(0,(p.stun||0)-dt);
  let dir=p.stun>0?0:(keys.up?-1:0)+(keys.down?1:0); if(p.invert>0)dir=-dir;
  const acc=p.stun>0?0:p.slip>0?.25:p.sticky>0?.4:1;
  if(p.ptr!=null&&!dir){const tgt=p.invert>0?H-p.ptr:p.ptr;p.vy+=((tgt-p.y)*10-p.vy)*Math.min(1,dt*8*acc)}
  else{p.vy+=dir*1600*dt*acc;p.vy*=Math.pow(p.slip>0?.45:.02,dt)}
  p.hist.unshift(p.y); if(p.hist.length>60)p.hist.length=60;
  p.y+=p.vy*dt;
  const wx=p.cam+p.bx,c=tubeC(wx),h=tubeH(wx);
  if(Math.abs(p.y-c)>h-BR){
    const s=Math.sign(p.y-c); p.y=c+s*(h-BR); p.vy=-s*(Math.abs(p.vy)*.4+60);
    if(p.wallCd<=0){hurt(3);p.wallCd=.5;sfx.wall();float('ai!',p.bx+10,p.y-s*34,{col:'#ffc2cc',size:20,world:true});burst(p.bx,p.y+s*BR,'#ffb0bd',6,{spd:120,world:true})}
  }
  p.y=clamp(p.y,BR+2,H-BR-2);
  for(const o of p.objs){
    if(o.dead)continue; const sx=o.x-p.cam;
    if(sx<-80){o.dead=true;continue} if(sx>W+80)break;
    const oy=o.y+oyOff(o);
    if(Math.hypot(sx-p.bx,oy-p.y)<o.r+BR-5)hitObj(p,o,sx,oy);
  }
  updFx(dt,spd);
  if(run.comfort<=0){run.comfort=0;fail(1);return}
  if(p.cam>=P1LEN){p.done=true;float('Chegou!',p.bx+40,p.y-60,{col:'#ffd21f',size:38,life:1.2})}
}
function hitObj(p,o,ox,oy){
  if(hitSpecial(p,o,ox,oy))return;
  if(o.type==='colica'){
    if(p.inv>0)return; o.dead=true; hurt(17); run.hits++; p.inv=.9; S.shake=12; sfx.hit();
    burst(ox,oy,'#ff3b4f',16,{spd:260,world:true,size:6}); float(pick(['CÓLICA!','AAAI!','uiii']),ox,oy-34,{col:'#ff8a94',size:28,world:true});
  }else if(o.type==='fibra'){
    o.dead=true; run.fiber++; track('fibers'); run.score1+=50; run.comfort=Math.min(100,run.comfort+4+run.pet.regen); sfx.fibra();
    burst(ox,oy,'#7fe08a',10,{spd:160,world:true}); float('+fibra',ox,oy-30,{col:'#9ff0a8',size:22,world:true});
  }else if(o.type==='cafe'){
    o.dead=true; run.coffee++; run.score1+=30; p.boost=2.6; sfx.cafe();
    burst(ox,oy,'#c58a5a',12,{spd:200,world:true}); float('CAFÉ! turbo',ox,oy-32,{col:'#ffd9a8',size:24,world:true});
  }else{
    o.dead=true; run.score1+=10; p.vy+=(p.y<oy?-1:1)*650; sfx.fart(); S.shake=5;
    burst(ox,oy,'rgba(170,220,90,1)',10,{spd:90,world:true,shape:'puff',size:10,life:.9}); float(pick(['pfffrt','prrrt','fuuu']),ox,oy-34,{col:'#d4f59a',size:24,world:true});
  }
}
function drawColica(x,y,r,t,seed){
  const R=r*(1+Math.sin(t*6+seed)*.08),n=10;
  ctx.beginPath();
  for(let i=0;i<=n*2;i++){const a=i/(n*2)*TAU+t*.8+seed,rad=i%2?R*.74:R*1.16;const px=x+Math.cos(a)*rad,py=y+Math.sin(a)*rad;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}
  ctx.closePath(); ctx.fillStyle='#ff3b4f'; ctx.fill(); ctx.strokeStyle='#7a0a1e'; ctx.lineWidth=3; ctx.stroke();
  const k='#4a0010';
  line([[x-R*.45,y-R*.34],[x-R*.1,y-R*.14]],k,3); line([[x+R*.45,y-R*.34],[x+R*.1,y-R*.14]],k,3);
  circ(x-R*.25,y+R*.02,R*.1,k); circ(x+R*.25,y+R*.02,R*.1,k);
  line([[x-R*.32,y+R*.36],[x-R*.11,y+R*.25],[x+R*.11,y+R*.36],[x+R*.32,y+R*.25]],k,2.5);
}
function drawFibra(x,y,r,t,seed){
  const g=ctx.createRadialGradient(x,y,2,x,y,r*2.2); g.addColorStop(0,'rgba(120,240,140,.35)'); g.addColorStop(1,'rgba(120,240,140,0)');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r*2.2,0,TAU); ctx.fill();
  ctx.save(); ctx.translate(x,y); ctx.rotate(Math.sin(t*2+seed)*.45+seed);
  ctx.beginPath(); ctx.moveTo(-r*1.25,0); ctx.quadraticCurveTo(0,-r*1.15,r*1.25,0); ctx.quadraticCurveTo(0,r*1.15,-r*1.25,0);
  ctx.fillStyle='#62d26f'; ctx.fill(); ctx.strokeStyle='#2c7a39'; ctx.lineWidth=2.5; ctx.stroke();
  line([[-r*1.1,0],[r*1.05,0]],'#2c7a39',2);
  for(const s of[-.5,0,.5]){line([[r*s,0],[r*(s+.3),-r*.35]],'#2c7a39',1.5);line([[r*s,0],[r*(s+.3),r*.35]],'#2c7a39',1.5)}
  ctx.restore();
}
function drawCafe(x,y,r,t){
  ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=2; ctx.lineCap='round';
  for(const dx of[-5,5]){ctx.beginPath();for(let i=0;i<=8;i++){const yy=y-r*.7-i*2.2,xx=x+dx+Math.sin(t*5+i*.7+dx)*2.5;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.stroke()}
  ctx.strokeStyle='#f3efe6'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(x+r*.85,y,r*.38,-Math.PI/2,Math.PI/2); ctx.stroke();
  rr(x-r*.85,y-r*.55,r*1.7,r*1.35,r*.4); ctx.fillStyle='#f3efe6'; ctx.fill();
  ell(x,y-r*.55,r*.85,r*.26,'#6b3b1f');
  rr(x-r*.85,y+r*.05,r*1.7,r*.22,2); ctx.fillStyle='#d6453d'; ctx.fill();
}
function drawGas(x,y,r,t,seed){
  for(let k=0;k<5;k++)circ(x+Math.cos(k*1.6+t*1.3+seed)*r*.45,y+Math.sin(k*1.3+t*1.6+seed)*r*.35,r*.58,'rgba(170,220,90,.42)');
  ctx.strokeStyle='rgba(225,250,170,.7)'; ctx.lineWidth=2; ctx.lineCap='round';
  for(const dy of[-6,4]){ctx.beginPath();ctx.moveTo(x-9,y+dy);ctx.quadraticCurveTo(x-3,y+dy-5,x+2,y+dy);ctx.quadraticCurveTo(x+7,y+dy+5,x+11,y+dy);ctx.stroke()}
}
function drawP1(){
  const p=S.p1,t=S.time;
  const pal=run.W.pal; ctx.fillStyle=pal.bg; ctx.fillRect(0,0,W,H); drawWorldBG(run.W,p);
  for(let i=0;i<34;i++){const xx=((i*173-p.cam*.9)%(W+120)+W+120)%(W+120)-60;circ(xx,(i*97)%H,30+(i%5)*9,pal.blob)}
  const T=[],B=[];
  for(let sx=-20;sx<=W+20;sx+=12){const wx=sx+p.cam,c=tubeC(wx),h=tubeH(wx),wob=Math.sin(wx*.06)*5+Math.sin(wx*.021+t*1.5)*3;T.push([sx,c-h-wob]);B.push([sx,c+h+wob])}
  const path=()=>{ctx.beginPath();T.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));for(let i=B.length-1;i>=0;i--)ctx.lineTo(B[i][0],B[i][1]);ctx.closePath()};
  path(); ctx.fillStyle=pal.tube; ctx.fill();
  ctx.save(); path(); ctx.clip();
  ctx.beginPath();
  for(let sx=-20;sx<=W+20;sx+=24){const wx=sx+p.cam;ctx.lineTo(sx,tubeC(wx)-tubeH(wx)*.5)}
  for(let sx=W+20;sx>=-20;sx-=24){const wx=sx+p.cam;ctx.lineTo(sx,tubeC(wx)+tubeH(wx)*.5)}
  ctx.closePath(); ctx.fillStyle=pal.light; ctx.fill();
  const fs=120;
  for(let fx=Math.floor((p.cam-60)/fs)*fs;fx<p.cam+W+60;fx+=fs){
    const sx=fx-p.cam,c=tubeC(fx),h=tubeH(fx)+14;
    ctx.beginPath(); ctx.moveTo(sx,c-h); ctx.quadraticCurveTo(sx+42,c,sx,c+h); ctx.strokeStyle=pal.fold; ctx.lineWidth=8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx+6,c-h); ctx.quadraticCurveTo(sx+48,c,sx+6,c+h); ctx.strokeStyle='rgba(255,195,205,.2)'; ctx.lineWidth=3; ctx.stroke();
  }
  for(let i=0;i<28;i++){const xx=((i*131-p.cam*1.25)%(W+40)+W+40)%(W+40)-20,wx=xx+p.cam;circ(xx,tubeC(wx)+Math.sin(i*2.3)*tubeH(wx)*.8,1.5+(i%3),'rgba(255,230,235,.35)')}
  const ex=P1LEN+p.bx+110-p.cam;
  if(ex<W+300){const cy=tubeC(P1LEN+p.bx+110),g=ctx.createRadialGradient(ex,cy,10,ex,cy,300);g.addColorStop(0,'rgba(255,250,225,.95)');g.addColorStop(.4,'rgba(255,230,170,.45)');g.addColorStop(1,'rgba(255,200,200,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
  ctx.restore();
  ctx.lineJoin='round'; ctx.strokeStyle=pal.wall; ctx.lineWidth=9;
  ctx.beginPath(); T.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke();
  ctx.beginPath(); B.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke();
  for(const o of p.objs){
    if(o.dead)continue; const sx=o.x-p.cam; if(sx<-80)continue; if(sx>W+80)break;
    if(o.type==='colica')drawColica(sx,o.y,o.r,t,o.seed);
    else if(o.type==='fibra')drawFibra(sx,o.y,o.r,t,o.seed);
    else if(o.type==='cafe')drawCafe(sx,o.y,o.r,t);
    else if(o.type==='gas')drawGas(sx,o.y+oyOff(o),o.r,t,o.seed);
    else drawSpecial(o,sx,o.y+oyOff(o),t);
  }
  if(p.boost>0)for(let i=1;i<=5;i++){ctx.globalAlpha=.16*(6-i)/5;circ(p.bx-i*12,p.y-p.vy*.012*i,BR*(1-i*.08),'#ffe066')}
  ctx.globalAlpha=1;
  drawPetTrail(p);
  if(!(p.inv>0&&Math.floor(p.inv*14)%2===0))drawVerity(p.bx,p.y,BR,{hurt:p.inv>.35});
  if(p.slip>0)txt('ESCORREGANDO',p.bx,p.y-40,14,'#bfe8ff',{font:'b'});
  if(p.invert>0)txt('INVERTIDO',p.bx,p.y-40,14,'#c08bff',{font:'b'});
}
function hudP1(){
  const p=S.p1;
  rr(14,12,560,86,16); ctx.fillStyle='rgba(20,4,10,.55)'; ctx.fill();
  txt(`MUNDO ${run.world} · ${run.W.name.toUpperCase()}`,30,30,14,'#ffd9e0',{align:'left',font:'b'});
  bar(30,40,420,14,p.cam/P1LEN,'#ffd21f');
  drawVerity(30+420*clamp(p.cam/P1LEN,0,1),47,10,{face:false,glow:.6});
  txt('CONFORTO',30,68,14,'#ffd9e0',{align:'left',font:'b'});
  const c=run.comfort/100; bar(30,78,260,12,c,c>.79?'#7fe08a':c>.39?'#ffc23d':'#ff4d5e');
  txt(Math.round(run.comfort)+'%',300,84,16,'#ffffff',{align:'left',font:'b'});
  drawFibra(372,82,9,0,.6); txt('× '+run.fiber,388,84,18,'#c9f5cf',{align:'left'});
  if(run.boosts.comfort)txt('BARRIGA BLINDADA',470,84,12,'#86e0c8',{align:'left',font:'b'});
  if(p.t<4){ctx.globalAlpha=clamp(4-p.t,0,1)*(.75+Math.sin(S.time*6)*.25);txt(TOUCH?'arraste o dedo pra cima e pra baixo':'↑  ↓   ou   W  S',W/2,H-60,30,'#fff');ctx.globalAlpha=1}
}

/* ======================= ETAPA 2 — O TRONO ======================= */
const PT={x:640-270*.92,y:-14,s:.92};
const toScr=(x,y)=>[PT.x+x*PT.s,PT.y+y*PT.s];
const DOOR={x:960,y:190,w:190,h:414};
function initP2(){
  S.p2={t:0,F:0,prog:0,strain:(100-run.p1Comfort)*.35,zoneC:.55,zoneW:.2,inZone:0,holding:false,everHeld:false,
    knock:null,nextKnock:rand(6,8.5),contr:0,nextContr:rand(8.5,11),msgCd:0,state:'under',wasIn:false,
    combo:0,comboT:0,grace:0,maxCombo:0,tp:0,pop:0,shock:false};
  run.knockOk=0; run.knockMiss=0; S.bubble=null; S.doorShake=0;
}
function startP2(){if(run.boss&&!run.boostsTaken){consumeBoosts();run.boostsTaken=true}S.parts=[];S.floats=[];S.mode='p2';showOnly(null);audioInit();startGrunt()}
function zoneBounds(q){return[q.zoneC-q.zoneW/2,q.zoneC+q.zoneW/2]}
const GY=120,GH=480,needleY=q=>clamp(GY+GH-q.F*GH,GY+20,GY+GH-10);
function updP2(dt){
  const q=S.p2; q.t+=dt; q.msgCd=Math.max(0,q.msgCd-dt); q.pop=Math.max(0,q.pop-dt);
  q.holding=keys.space||ptrHold; if(q.holding)q.everHeld=true;
  const inv=!!(run.boss&&run.boss.inv>0);
  q.F=clamp(q.F+((q.holding!==inv)?.8:-1.25)*dt,0,1);
  const zs=run.W.zspeed*(bm('fast')?1.7:1); q.zt=(q.zt||0)+dt*zs;
  q.zoneC=clamp(.52+.24*Math.sin(q.zt*.62)+.07*Math.sin(q.zt*1.9+1)+(run.boss?run.boss.off:0),.16,.86);
  const fib=Math.min(run.fiber,12);
  q.zoneW=lerp(q.zoneW,(.19+fib*.004+(q.contr>0?.08:0))*(run.boosts.zone?1.35:1)*(1+run.pet.zone)*(bm('shrink')?.65:1)*run.W.zwidth,Math.min(1,dt*4));
  const [lo,hi]=zoneBounds(q),mult=(1+fib*.035)*(q.contr>0?2:1);
  let st;
  if(q.F>hi){st='over';q.strain+=(22+(q.F-hi)*90)*dt*(bm('strain')?1.6:1)*(1+.012*(run.world-1));q.prog+=1.5*dt}
  else if(q.F>=lo){st='in';q.prog+=7.2*mult*(1+run.pet.speed)*dt;q.strain=Math.max(0,q.strain-5*dt);q.inZone+=dt;q.wasIn=true}
  else{st='under';q.strain=Math.max(0,q.strain-12*dt);if(q.prog<92)q.prog=Math.max(0,q.prog-(q.F<.08?3.2:1.6)*dt)}
  if(st==='in'){
    q.grace=.3; q.comboT+=dt;
    if(q.comboT>=1){
      q.comboT-=1; q.combo++; q.maxCombo=Math.max(q.maxCombo,q.combo);
      const pts=10*q.combo*(q.contr>0?2:1); q.tp+=pts; q.pop=.3; sfx.combo(q.combo);
      float('+'+pts,150,needleY(q)-18,{col:'#ffd21f',size:20+Math.min(q.combo,10),life:.8});
      if(q.combo%5===0)float(`COMBO ×${q.combo}!`,W/2-60,150,{col:'#ffd21f',size:40,life:1.2});
    }
  }else{
    q.grace-=dt;
    if(q.grace<=0&&(q.combo>0||q.comboT>0)){if(q.combo>=3){sfx.comboLost();float('combo perdido',150,needleY(q),{col:'#ffb3bb',size:18})}q.combo=0;q.comboT=0}
  }
  if(st!==q.state&&q.msgCd<=0){
    if(st==='over'){float(pick(['VEIA!','CALMA!','vai estourar...','respira!']),175,needleY(q),{col:'#ff9aa3',size:24});q.msgCd=1.3}
    else if(st==='under'&&q.wasIn&&q.prog>4&&q.prog<92){float(pick(['tá voltando...','ela tá subindo!','não para!']),175,needleY(q),{col:'#bfe0ff',size:22});q.msgCd=1.3}
  }
  q.state=st;
  if(!q.knock){
    q.nextKnock-=dt;
    if(q.nextKnock<=0&&(run.boss||q.prog<94)){const kt=2.3+run.pet.door;q.knock={t:kt,max:kt,re:.9};sfx.knock();S.doorShake=.6;$('knockBtn').hidden=false}
  }else{
    q.knock.t-=dt; q.knock.re-=dt;
    if(q.knock.re<=0&&q.knock.t>.3){q.knock.re=.9;sfx.knock();S.doorShake=.6}
    if(q.knock.t<=0){
      run.knockMiss++; q.knock=null; $('knockBtn').hidden=true;
      if(run.boosts.lock&&!run.lockUsed){run.lockUsed=true;sfx.bad();S.shake=8;S.doorShake=.6;float('A TRANCA EXTRA SEGUROU!',W/2,430,{col:'#86e0c8',size:34,life:1.8});q.nextKnock=knockGap()}
      else{startInvasion();return}
    }
  }
  S.doorShake=Math.max(0,S.doorShake-dt);
  if(q.contr>0)q.contr-=dt;
  else{q.nextContr-=dt;if(q.nextContr<=0){q.contr=3.2;q.nextContr=rand(9,13);sfx.contr();float('CONTRAÇÃO! ×2',W/2,400,{col:'#d7ff5a',size:40,life:1.5})}}
  if(run.boss){updBoss(dt,q,st);if(S.mode!=='p2')return}
  const [hx,hy]=toScr(270,250);
  if((q.strain>35||q.F>.6)&&Math.random()<dt*(2+q.strain/18)){
    const a=rand(-Math.PI*.92,-Math.PI*.08);
    burst(hx+Math.cos(a)*52,hy+Math.sin(a)*52,'#bfe8ff',1,{angle:a,spread:.3,spd:50,vy:-30,grav:520,shape:'drop',size:4.5,life:1.1,drag:.5});
  }
  if(q.strain>75&&Math.random()<dt*10){const s=Math.random()<.5?-1:1;burst(hx+s*60,hy+8,'#ffffff',1,{angle:s<0?-Math.PI*.85:-Math.PI*.15,spread:.25,spd:70,shape:'puff',size:7,life:.9,drag:1})}
  setGrunt(q.holding?.04+q.F*.2:0,85+q.F*45+q.strain*.5);
  updFx(dt);
  if(q.strain>=100){q.strain=100;fail(2);return}
  if(!run.boss&&q.prog>=100){q.prog=100;startFinale()}
}
function answerKnock(){
  const q=S.p2; if(S.mode!=='p2'||!q||!q.knock||S.paused)return;
  const pts=150+Math.round(q.knock.t/q.knock.max*100);
  q.tp+=pts; q.knock=null; run.knockOk++; track('knocks'); $('knockBtn').hidden=true; sfx.ok(); q.nextKnock=knockGap();
  S.bubble={text:pick(['TÁ OCUPADO!!','JÁ VAI!!','NÃO ENTRA!','OCUPAAADO!']),t:1.4};
  float('+'+pts,W/2,420,{col:'#ffd21f',size:32,life:1});
}
function drawDoor(open=0){
  const d=DOOR,dx=S.doorShake>0&&!RM&&!open?Math.sin(S.time*70)*3.5*S.doorShake/.6:0;
  ctx.fillStyle='#4f321d'; ctx.fillRect(d.x-12,d.y-12,d.w+24,d.h+12);
  if(open>0){
    ctx.fillStyle='#120a05'; ctx.fillRect(d.x,d.y,d.w,d.h);
    const g=ctx.createLinearGradient(d.x,0,d.x+d.w,0); g.addColorStop(0,'rgba(255,240,200,.25)'); g.addColorStop(1,'rgba(255,240,200,.05)'); ctx.fillStyle=g; ctx.fillRect(d.x,d.y,d.w,d.h);
    if(S.inv)drawIntruder(run.intr,d.x+d.w/2,d.y+d.h,1.0+Math.min(.1,S.inv.t*.1));
  }
  const w=d.w*Math.cos(open*Math.PI*.46);
  ctx.save(); ctx.translate(dx,0);
  ctx.fillStyle=open?'#7a4e2d':'#8a5a35'; ctx.fillRect(d.x,d.y,w,d.h);
  if(w>40){ctx.strokeStyle='#6d4428';ctx.lineWidth=4;ctx.strokeRect(d.x+w*.12,d.y+24,w*.76,150);ctx.strokeRect(d.x+w*.12,d.y+200,w*.76,190);circ(d.x+w-22,d.y+220,10,'#d8c27a');circ(d.x+w-24,d.y+218,3,'#fff6c8')}
  ctx.restore();
}
function drawGauge(q){
  const x=70,y=GY,w=44,h=GH,zy=v=>y+h-v*h,[lo,hi]=zoneBounds(q);
  rr(x-5,y-5,w+10,h+10,12); ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fill();
  ctx.save(); rr(x,y,w,h,8); ctx.clip();
  ctx.fillStyle='#1b2a28'; ctx.fillRect(x,y,w,h);
  ctx.fillStyle='rgba(255,77,94,.28)'; ctx.fillRect(x,y,w,zy(hi)-y);
  const flash=q.contr>0&&Math.floor(S.time*8)%2===0;
  ctx.fillStyle=q.contr>0?(flash?'#d7ff5a':'#9df07a'):'#5fe39a';
  ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=14; ctx.fillRect(x,zy(hi),w,zy(lo)-zy(hi)); ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,210,31,.85)'; ctx.fillRect(x+12,zy(q.F),w-24,y+h-zy(q.F));
  ctx.restore();
  const ny=zy(q.F);
  ctx.fillStyle=q.state==='in'?'#ffffff':q.state==='over'?'#ff4d5e':'#bfe0ff';
  ctx.fillRect(x-7,ny-2,w+14,4);
  ctx.beginPath(); ctx.moveTo(x+w+9,ny); ctx.lineTo(x+w+22,ny-8); ctx.lineTo(x+w+22,ny+8); ctx.closePath(); ctx.fill();
  txt('FORÇA',x+w/2,y+h+24,16,'#f3f1e8');
}
function bezPt(p0,p1,p2,p3,t){const u=1-t;return[u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]]}
function drawXray(q){
  const x=1104,y=52,w=150,h=140;
  ctx.save(); rr(x,y,w,h,10); ctx.fillStyle='#0c1a2c'; ctx.fill(); ctx.clip();
  ctx.strokeStyle='rgba(120,200,255,.12)'; ctx.lineWidth=1; ctx.beginPath();
  for(let i=x;i<x+w;i+=16){ctx.moveTo(i,y);ctx.lineTo(i,y+h)} for(let i=y;i<y+h;i+=16){ctx.moveTo(x,i);ctx.lineTo(x+w,i)} ctx.stroke();
  const p0=[x+16,y+18],p1=[x+w+20,y+36],p2=[x-16,y+h-46],p3=[x+w/2,y+h-14];
  ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(...p0); ctx.bezierCurveTo(...p1,...p2,...p3); ctx.strokeStyle='rgba(255,130,165,.5)'; ctx.lineWidth=24; ctx.stroke();
  ctx.strokeStyle='rgba(255,200,215,.25)'; ctx.lineWidth=10; ctx.stroke();
  const b=bezPt(p0,p1,p2,p3,.1+q.prog/100*.9); drawVerity(b[0],b[1],9,{face:false,glow:.9});
  txt('RAIO-X',x+8,y+12,11,'#8fd3ff',{align:'left',font:'b',stroke:false});
  txt(Math.floor(q.prog)+'%',x+w-8,y+h-12,16,'#ffd21f',{align:'right',stroke:false});
  ctx.restore(); rr(x,y,w,h,10); ctx.strokeStyle='rgba(140,210,255,.45)'; ctx.lineWidth=2; ctx.stroke();
}
function hudP2(q){
  rr(140,12,720,82,16); ctx.fillStyle='rgba(8,24,21,.6)'; ctx.fill();
  if(run.boss)hudBossTop(q);
  else{
    txt('SAÍDA',160,30,14,'#c9f5e6',{align:'left',font:'b'});
    bar(160,40,460,18,q.prog/100,'#ffd21f');
    drawVerity(160+460*clamp(q.prog/100,0,1),49,12,{face:false,glow:.7});
  }
  txt('VEIA DA TESTA',160,72,13,'#ffc2cc',{align:'left',font:'b'});
  bar(290,66,330,12,q.strain/100,q.strain>70?(Math.floor(S.time*8)%2?'#ff4d5e':'#ff9aa3'):'#c2477f');
  txt('PTS TRONO',840,30,13,'#c9f5e6',{align:'right',font:'b'}); txt(fmt(q.tp),840,60,30,'#ffd21f',{align:'right'});
  const bl=[];if(run.boosts.zone)bl.push('FAIXA LARGA');if(run.boosts.lock&&!run.lockUsed)bl.push('TRANCA');if(run.bath.luck>1)bl.push('SORTE ×'+run.bath.luck.toFixed(2).replace('.',','));
  if(bl.length)txt(bl.join(' · '),640,82,12,'#86e0c8',{align:'right',font:'b'});
  drawGauge(q); if(run.boss)drawBossPanel(); else drawXray(q);
  if(run.boss&&run.boss.inv>0)txt('CONTROLE INVERTIDO!',W/2,560,30,'#c08bff');
  if(q.combo>0||q.comboT>0){
    const s=1+q.pop*.8; ctx.save(); ctx.translate(92,650); ctx.scale(s,s); txt('×'+q.combo,0,0,42,q.contr>0?'#d7ff5a':'#ffd21f'); ctx.restore();
    txt('COMBO',92,684,14,'#f3f1e8',{font:'b'}); bar(54,698,76,7,q.comboT,'#ffd21f','rgba(0,0,0,.6)');
  }
  if(q.knock){
    const bob=Math.sin(S.time*22)*3,I=INTRUDERS[run.intr]||INTRUDERS.irmao;
    ctx.save(); ctx.translate(1055,250+bob); ctx.rotate(-.1); txt('TOC TOC!',0,0,40,'#fff1d6'); ctx.restore();
    rr(700,128,250,44,16); ctx.fillStyle='#fffdf4'; ctx.fill(); poly([[930,160],[968,206],[900,168]],'#fffdf4');
    txt(I.knock,825,150,I.knock.length>24?15:18,'#7a3b1f',{stroke:false,font:'b'});
    bar(980,300,150,10,q.knock.t/q.knock.max,'#ff4d5e','rgba(0,0,0,.55)');
  }
  if(S.bubble){
    const b=S.bubble,a=clamp(b.t/.25,0,1); ctx.globalAlpha=a;
    rr(400,96,210,44,16); ctx.fillStyle='#fffdf4'; ctx.fill(); poly([[560,136],[590,176],[530,136]],'#fffdf4');
    txt(b.text,505,118,22,'#c2263a',{stroke:false}); ctx.globalAlpha=1;
  }
  if(!q.everHeld&&q.t>.4){ctx.globalAlpha=.75+Math.sin(S.time*6)*.25;txt(TOUCH?'TOQUE E SEGURE':'SEGURE ESPAÇO',W/2,470,42,'#ffd21f');txt('pra fazer força',W/2,510,20,'#fff',{font:'b'});ctx.globalAlpha=1}
}
function drawP2(){
  drawBathroomBG(run.bath); drawDoor(S.inv?clamp(S.inv.t/.45,0,1):0);
  ctx.save(); ctx.translate(PT.x,PT.y); ctx.scale(PT.s,PT.s); drawSeated(run.eq,run.bath,S.p2); ctx.restore();
  drawPetsAround(run.pets);
}

/* ======================= INVASÃO ======================= */
function startInvasion(){
  S.mode='invade'; S.inv={t:0,said:false}; $('pauseBtn').hidden=true; S.p2.shock=true; S.p2.holding=false; stopGrunt();
  sfx.slam(); setTimeout(()=>{if(S.mode==='invade')sfx.scream()},350); S.shake=16;
  P.stats.invaded=(P.stats.invaded||0)+1; saveProfile();
}
function updInvade(dt){
  const v=S.inv; v.t+=dt;
  if(!v.said&&v.t>.5){v.said=true;const I=INTRUDERS[run.intr]||INTRUDERS.irmao;float(I.enter,W/2,150,{col:'#ffffff',size:40,life:2,vy:-8});float('A Verity voltou pra dentro de vergonha.',W/2,200,{col:'#ffb3bb',size:22,life:2,vy:-8})}
  updFx(dt);
  if(v.t>2.4)fail('invade');
}

/* ======================= FINAL — PLOFT + REVELAÇÃO ======================= */
let lastResult=null;
const FX=400,FY=360,BOWL_DX=FX-270,BOWL_DY=FY-282;
function startFinale(){
  stopGrunt(); $('knockBtn').hidden=true; $('pauseBtn').hidden=true; S.mode='finale';
  S.fin={t:0,splashed:false,revealed:false,shown:false,flushing:false,ft:0,ang:0,gone:false};
  const q=S.p2,ratio=q.t>0?q.inZone/q.t:0;
  const timeBonus=Math.max(0,Math.round(300-Math.max(0,q.t-14)*15));
  const T=Math.max(0,Math.round(q.tp+ratio*300+timeBonus));
  const score=Math.round((run.score1+run.p1Comfort*4+T)*run.W.bonus);
  const B=run.boss; let vk,bossInfo=null;
  if(B){
    const first=!P.world.beaten.includes(B.world),drop=first||Math.random()<.25;
    vk=drop?(B.drop||regionDrop(B)):rollWorldVariant(run.world,80,varLuck());
    const cash=Math.round(300*Math.pow(1.13,B.world)*(first?1:.3)*rbCash()*evMods().money); P.money+=cash;
    track('boss');
    const slotsBefore=petSlots();
    if(first){P.world.beaten.push(B.world);P.world.max=Math.min(WORLDS.length,Math.max(P.world.max,B.world+1));P.stats.maxBeaten=Math.max(P.stats.maxBeaten||0,P.world.beaten.length);P.stats.maxWorld=Math.max(P.stats.maxWorld||0,P.world.max);if(B.world===WORLDS.length)P.stats.beat60=1;if(B.fase===5)announce(`derrotou ${B.name.replace(' · Forma Final','')} (mundo ${B.world})!`)}
    bossInfo={first,drop,cash,name:B.name,world:B.world,unlocked:first&&B.world<WORLDS.length?WORLDS[B.world].name:null,newSlot:petSlots()>slotsBefore};
  }else{const ev=evMods().vars;vk=ev.length&&Math.random()<.08?pick(ev):rollWorldVariant(run.world,run.p1Comfort,varLuck())}
  const mk=rollMut(T,mutLuck());
  track('runs'); track('combo',q.maxCombo); if(VARS[vk].r>=2)track('rare');
  if(VARS[vk].r>=5||MUT_BY[mk].i>=6||VARS[vk].ev)announce(`tirou ${fullName(vk,mk)}!`);
  const newVar=!P.items.some(i=>i.v===vk),newMut=mk!=='none'&&!P.items.some(i=>i.m===mk);
  const item={id:rid(),v:vk,m:mk,f:0,lvl:1,s:score,t:Date.now()};
  const lvBefore=level();
  const xpGain=Math.round((score/6+itemValue(item)/25+(newVar?50:0)+(newMut?100:0)+(bossInfo&&bossInfo.first?300*B.world:0))*(1+run.pet.xp));
  P.items.push(item); if(team().length<petSlots())P.pets.push(item.id); P.xp+=xpGain; P.runs++; const isBest=score>P.best; if(isBest)P.best=score;
  P.stats.maxCombo=Math.max(P.stats.maxCombo||0,q.maxCombo);
  const lvAfter=level(); let reward=0; for(let L=lvBefore+1;L<=lvAfter;L++)reward+=150*L; P.money+=reward;
  if(!P.featManual)P.feat=null;
  saveProfile();
  const rk=score>=2200?'S · Cagada Lendária':score>=1600?'A · Trabalho Limpo':score>=1100?'B · Deu Pro Gasto':'C · Parto Sofrido';
  lastResult={score,T,rk:B?(bossInfo.first?'CHEFE DERROTADO!':'Chefe derrotado de novo'):rk,ratio,t:q.t,isBest,vk,mk,item,newVar,newMut,maxCombo:q.maxCombo,xpGain,lvBefore,lvAfter,reward,boss:bossInfo,world:run.world};
}
function flushToilet(){
  const f=S.fin; if(S.mode!=='finale'||!f||f.flushing||!f.revealed)return false;
  f.flushing=true; f.ft=0; sfx.flush(); return true;
}
function updFinale(dt){
  const f=S.fin,r=lastResult; f.t+=dt;
  if(!f.splashed&&f.t>=.75){
    f.splashed=true; sfx.plop(); sfx.splash(); S.shake=14;
    burst(FX,FY,'#c9efff',46,{spd:420,size:7,life:1.1,drag:2.4}); burst(FX,FY,'#ffffff',18,{spd:250,size:4,life:.8});
    float('PLOFT!',FX,130,{size:72,col:'#ffd21f',life:1,vy:-30});
  }
  if(f.splashed&&!f.revealed&&f.t>=1.25){
    f.revealed=true; const mi=MUT_BY[r.mk].i; sfx.reveal(Math.max(mi,VARS[r.vk].r)); S.shake=6+mi*2;
    const col=r.mk==='none'?RAR[VARS[r.vk].r].col:MUT_BY[r.mk].col;
    burst(FX,FY,[col,'#ffffff'],24+mi*8,{spd:260+mi*30,size:5,life:1.1,shape:'star'});
    if(r.mk!=='none')float(MUT_BY[r.mk].name.toUpperCase()+'!',FX,70,{size:46+mi*2,col,life:2.6,vy:-6});
    float(VARS[r.vk].name,FX,120,{size:40,col:RAR[VARS[r.vk].r].col,life:2.6,vy:-6});
  }
  if(f.revealed&&!f.shown&&f.t>(r.newVar?2.0:2.3)){f.shown=true;if(r.newVar&&!P.seen.includes(r.vk))startCutscene(r.vk,r.mk,0,()=>{S.mode='finale';showResults(r)});else showResults(r)}
  if(f.flushing){
    f.ft+=dt; f.ang+=(2+f.ft*7)*dt;
    if(f.ft>2.7&&!f.gone){f.gone=true;sfx.bye();float(`Tchau, ${VARS[r.vk].name}.`,FX,110,{size:38,col:'#ffd21f',life:2.4,vy:-14});float('(ela continua na coleção)',FX,148,{size:18,col:'#f3f1e8',life:2.4,vy:-14})}
  }
  updFx(dt);
}
function drawFinale(){
  const f=S.fin,t=S.time,r=lastResult,b=run.bath;
  for(let rw=0;rw<13;rw++)for(let c=0;c<23;c++){ctx.fillStyle=(rw+c)%2?b.floor[1]:b.floor[0];ctx.fillRect(c*60-10,rw*60-20,60,60)}
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.translate(BOWL_DX,BOWL_DY);
  const WX=270,WY=282,tc=b.toilet;
  ell(WX,264,206,222,'rgba(0,0,0,.35)');
  const tg=ctx.createLinearGradient(160,0,380,0); tg.addColorStop(0,shade(tc,-.14)); tg.addColorStop(.5,shade(tc,.3)); tg.addColorStop(1,shade(tc,-.16));
  rr(160,-6,220,72,14); ctx.fillStyle=tg; ctx.fill(); rr(318,16,32,10,4); ctx.fillStyle='#b9b8ae'; ctx.fill();
  const bg=ctx.createRadialGradient(WX-40,212,30,WX,252,220); bg.addColorStop(0,shade(tc,.5)); bg.addColorStop(1,shade(tc,-.14));
  ell(WX,254,196,212,bg);
  ctx.strokeStyle=shade(tc,.3); ctx.lineWidth=32; ctx.beginPath(); ctx.ellipse(WX,260,168,184,0,0,TAU); ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(WX,260,152,168,0,0,TAU); ctx.stroke();
  const ig=ctx.createRadialGradient(WX,302,20,WX,272,160); ig.addColorStop(0,'#b9c7c4'); ig.addColorStop(1,'#eef1ec'); ell(WX,268,148,160,ig);
  const wl=f.flushing?1-.3*Math.sin(Math.PI*clamp(f.ft/3.2,0,1)):1;
  const wg=ctx.createRadialGradient(WX,WY,10,WX,WY,115*wl); wg.addColorStop(0,'#3d8fb3'); wg.addColorStop(1,'#9fd9ec'); ell(WX,WY,108*wl,112*wl,wg);
  let bx=WX,by=WY,br=26,showBall=true;
  if(!f.splashed){const u=clamp(f.t/.75,0,1),e=u*u;br=lerp(160,26,e);by=lerp(132,WY,e)}
  else if(f.flushing){const u=clamp(f.ft/2.6,0,1),rad=lerp(40,0,u);bx=WX+Math.cos(f.ang)*rad;by=WY+Math.sin(f.ang)*rad*.95;br=26*(1-clamp(f.ft/2.7,0,1)*.9);showBall=!f.gone}
  else{bx=WX+Math.sin(t*1.3)*6;by=WY+Math.sin(t*2)*3}
  if(f.splashed){
    ctx.save(); ctx.beginPath(); ctx.ellipse(WX,WY,108*wl,112*wl,0,0,TAU); ctx.clip();
    for(const st of[.75,1.0,1.3]){const age=f.t-st;if(age>0&&age<1.6){ctx.strokeStyle=`rgba(255,255,255,${.55*(1-age/1.6)})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(WX,WY,20+age*70,20+age*72,0,0,TAU);ctx.stroke()}}
    if(f.flushing){
      ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=3;
      for(let k=0;k<5;k++){ctx.beginPath();for(let i=0;i<=30;i++){const a=f.ang*1.4+k*TAU/5+i*.12,r2=8+i*3.4*wl;const px=WX+Math.cos(a)*r2,py=WY+Math.sin(a)*r2;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.stroke()}
      const dg=ctx.createRadialGradient(WX,WY,0,WX,WY,40); dg.addColorStop(0,'rgba(10,40,60,.7)'); dg.addColorStop(1,'rgba(10,40,60,0)'); ctx.fillStyle=dg; ctx.fillRect(WX-50,WY-50,100,100);
    }
    ctx.restore();
  }
  if(showBall){
    if(!f.splashed){const sh=clamp(f.t/.75,0,1);ell(WX,WY,30*sh,24*sh,`rgba(10,40,60,${.35*sh})`)}
    if(f.revealed){
      const age=f.t-1.25,pop=age<.35?1+Math.sin(age/.35*Math.PI)*.45:1;
      drawVariant(bx,by,br*pop*1.6,r.vk,r.mk,{glow:1.2});
      if(age<.5){ctx.globalAlpha=1-age/.5;circ(bx,by,30+age*260,'rgba(255,255,255,.8)');ctx.globalAlpha=1}
    }else drawVerity(bx,by,br,{glow:f.splashed?1.2:.8,hurt:!f.splashed});
  }
  ctx.restore();
}

/* ======================= menu background ======================= */
function drawMenuBG(){
  const b=bathOf(P.eq.bath);
  drawBathroomBG(b);
  ctx.save(); ctx.translate(780-270*PT.s,PT.y+10); ctx.scale(PT.s,PT.s); drawSeated(P.eq,b,{F:0,strain:0}); ctx.restore();
  const f=featured(),y=330+Math.sin(S.time*1.6)*12;
  if(f)drawVariant(1080,y,58,f.v,f.m,{glow:1.2,lvl:f.lvl,f:f.f});
  else drawVerity(1080,y,52,{glow:1.2});
  const tm=team();
  tm.forEach((it,i)=>{const a=S.time*.6+i*TAU/tm.length;drawVariant(1080+Math.cos(a)*120,y+Math.sin(a)*46+10,20,it.v,it.m,{glow:.4,f:it.f,badge:false})});
}

/* ======================= fail ======================= */
let failedStage=1;
function fail(stage){
  failedStage=stage; S.mode='fail'; stopGrunt(); $('knockBtn').hidden=true; sfx.fail(); S.shake=10;
  showFail(stage);
}

/* ======================= flow ======================= */
function goCard1(world){run=newRun(world);P.world.cur=run.world;initP1();S.mode='card1';S.parts=[];S.floats=[];S.inv=null;showCard1()}
function goBoss(world){
  run=newRun(world,true); P.world.cur=run.world; run.p1Comfort=80; run.fiber=0;
  initP2(); S.p2.nextKnock=bm('knocks')?3:rand(6,8);
  S.mode='card2'; S.parts=[]; S.floats=[]; S.inv=null; showBossCard();
}
function startP1(){consumeBoosts();S.parts=[];S.floats=[];S.mode='p1';showOnly(null);audioInit()}
function showCard2(){initP2();S.mode='card2';showCard2Screen()}
function retryStage(){
  if(failedStage==='boss'){goBoss(run.world);return}
  if(failedStage===2){initP2();S.inv=null;startP2()}
  else goCard1(run.world);
}

/* ======================= input ======================= */
function localY(e){const r=cv.getBoundingClientRect();return(e.clientY-r.top)/r.height*H}
cv.addEventListener('pointerdown',e=>{
  audioInit();
  if(S.mode==='cut'){cutSkip();e.preventDefault();return}
  if(S.mode==='gacha'){if(GA&&GA.t<GA_SPIN+.9)GA.t=GA_SPIN+.9;e.preventDefault();return}
  if(S.paused)return;
  if(S.mode==='p1'){S.p1.ptr=localY(e);try{cv.setPointerCapture(e.pointerId)}catch(_){}}
  else if(S.mode==='p2'){ptrHold=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}}
  e.preventDefault();
});
cv.addEventListener('pointermove',e=>{if(S.mode==='p1'&&S.p1.ptr!=null)S.p1.ptr=localY(e)});
const release=()=>{if(S.p1)S.p1.ptr=null;ptrHold=false};
cv.addEventListener('pointerup',release); cv.addEventListener('pointercancel',release); cv.addEventListener('lostpointercapture',release);
const playing=()=>S.mode==='p1'||S.mode==='p2';
addEventListener('keydown',e=>{
  const k=e.code;
  if(S.mode==='cut'&&(k==='Escape'||k==='Space'||k==='Enter')){cutSkip();e.preventDefault();return}
  if(k==='Escape'){if(closeTopPanel())return;if(playing()){togglePause();return}}
  if(k==='ArrowUp'||k==='KeyW')keys.up=true;
  else if(k==='ArrowDown'||k==='KeyS')keys.down=true;
  else if(k==='Space'){if(playing()&&!S.paused){keys.space=true;e.preventDefault()}}
  else if(k==='KeyE'){answerKnock()}
  else if(k==='KeyM'&&!isTyping(e)){audioInit();setMute(!AU.muted);toast(AU.muted?'Som desligado':'Som ligado')}
  else if(k==='KeyP'&&playing()){togglePause()}
  if(playing()&&k.startsWith('Arrow'))e.preventDefault();
});
addEventListener('keyup',e=>{
  const k=e.code;
  if(k==='ArrowUp'||k==='KeyW')keys.up=false;
  else if(k==='ArrowDown'||k==='KeyS')keys.down=false;
  else if(k==='Space')keys.space=false;
});
const isTyping=e=>/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||'');
function togglePause(force){
  if(!playing())return; S.paused=force??!S.paused;
  if(S.paused){setGrunt(0,90);keys.space=false;ptrHold=false;showPause(true)} else showPause(false);
}
addEventListener('blur',()=>{keys.up=keys.down=keys.space=false;ptrHold=false;if(playing()&&!S.paused)togglePause(true)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing()&&!S.paused)togglePause(true)});

/* ======================= loop ======================= */
function update(dt){
  S.shake=Math.max(0,S.shake-dt*40);
  switch(S.mode){
    case'p1':updP1(dt);break;
    case'p2':updP2(dt);break;
    case'invade':updInvade(dt);break;
    case'finale':updFinale(dt);break;
    case'cut':updCut(dt);break;
    case'gacha':updGacha(dt);break;
    default:updFx(dt);
  }
}
function draw(){
  ctx.setTransform(scale,0,0,scale,0,0);
  ctx.fillStyle='#0c2421'; ctx.fillRect(0,0,W,H);
  ctx.save();
  if(S.shake>0&&!RM)ctx.translate((Math.random()-.5)*S.shake,(Math.random()-.5)*S.shake);
  const m=S.mode;
  if(m==='menu'||m==='boot')drawMenuBG();
  else if(m==='card1'||m==='p1'||(m==='fail'&&failedStage===1))drawP1();
  else if(m==='card2'||m==='p2'||m==='invade'||(m==='fail'&&failedStage!==1))drawP2();
  else if(m==='finale')drawFinale();
  else if(m==='cut'){ctx.restore();drawCut();ctx.save()}
  else if(m==='gacha'){ctx.restore();drawGacha();ctx.save()}
  if(m!=='cut'&&m!=='gacha')drawFx();
  ctx.restore();
  if(m==='p1')hudP1();
  else if(m==='p2')hudP2(S.p2);
  else if(m==='menu'&&MUS.track==='hino'&&MUS.lyric&&S.time-MUS.lyricAt<2.8){
    const a=clamp((2.8-(S.time-MUS.lyricAt))/.4,0,1),pop=Math.min(1,(S.time-MUS.lyricAt)/.12);
    ctx.globalAlpha=a; ctx.save(); ctx.translate(880,170); ctx.scale(.7+.3*pop,.7+.3*pop); ctx.rotate(-.03);
    txt('♪ '+MUS.lyric.toUpperCase()+' ♪',0,0,MUS.lyric.length>22?24:30,'#ffd21f'); ctx.restore(); ctx.globalAlpha=1;
  }
}
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000); last=now; S.time+=dt;
  if(!S.paused)update(dt);
  if(!anyPanelOpen())draw(); else if(typeof panelTick==='function')panelTick();
  requestAnimationFrame(frame);
}

/* ======================= worlds, bosses and pets ======================= */
const SPECIAL_KEYS=['acido','radio','gelo','pimenta','asteroide','bug','feijao','chocolate','raio'];
function knockGap(){return bm('knocks')?rand(3.5,5.5):rand(8,12)*Math.max(.45,1-.01*(run.world-1))}
function oyOff(o){return o.type==='gas'?Math.sin(S.time*2+o.seed)*20:o.type==='asteroide'?Math.sin(S.time*1.5+o.seed)*70:0}
function hitSpecial(p,o,ox,oy){
  switch(o.type){
    case 'acido':o.dead=true;hurt(10);p.inv=Math.max(p.inv,.4);sfx.hit();burst(ox,oy,'#a8ff3a',14,{spd:200,world:true});float('ÁCIDO!',ox,oy-34,{col:'#c8ff7a',size:26,world:true});return true;
    case 'radio':o.dead=true;hurt(12);run.radio=Math.min(1,run.radio+.1);sfx.hit();burst(ox,oy,'#8cff2a',16,{spd:220,world:true,shape:'star'});float('+10% MUTAÇÃO',ox,oy-34,{col:'#d7ff5a',size:24,world:true});return true;
    case 'gelo':o.dead=true;p.slip=2;sfx.wall();burst(ox,oy,'#dff6ff',12,{spd:180,world:true});float('ESCORREGOU!',ox,oy-34,{col:'#bfe8ff',size:24,world:true});return true;
    case 'pimenta':o.dead=true;p.boost=1.6;hurt(8);sfx.cafe();burst(ox,oy,'#ff4d2e',12,{spd:200,world:true});float('ARDEU! turbo',ox,oy-34,{col:'#ff9a6a',size:24,world:true});return true;
    case 'asteroide':if(p.inv>0)return true;o.dead=true;hurt(15);p.inv=.8;S.shake=12;sfx.hit();burst(ox,oy,'#9a9aa6',16,{spd:240,world:true});float('POW!',ox,oy-34,{col:'#e0e0ea',size:28,world:true});return true;
    case 'feijao':o.dead=true;hurt(9);p.vy+=(p.y<oy?-1:1)*700;sfx.fart();S.shake=8;burst(ox,oy,'rgba(160,130,60,1)',12,{spd:120,world:true,shape:'puff',size:12,life:1});float('PRRRRT!',ox,oy-34,{col:'#d9c49a',size:26,world:true});return true;
    case 'chocolate':o.dead=true;p.sticky=2.2;hurt(5);sfx.wall();burst(ox,oy,'#5a2e18',12,{spd:160,world:true});float('GRUDOU!',ox,oy-34,{col:'#c89060',size:24,world:true});return true;
    case 'raio':if(p.inv>0)return true;o.dead=true;p.stun=.8;p.inv=.6;hurt(11);C_zapFlash();burst(ox,oy,['#fff23a','#30e0ff'],16,{spd:260,world:true,shape:'star'});float('BZZZT! TRAVOU',ox,oy-34,{col:'#fff23a',size:24,world:true});return true;
    case 'bug':o.dead=true;p.invert=2.5;sfx.bad();burst(ox,oy,['#9a6aff','#39ff7a'],14,{spd:200,world:true});float('BUG! INVERTIDO',ox,oy-34,{col:'#c08bff',size:24,world:true});return true;
  }
  return false;
}
function drawSpecial(o,x,y,t){
  const r=o.r;
  switch(o.type){
    case 'acido':for(let k=0;k<4;k++)circ(x+Math.cos(k*1.7+t)*r*.4,y+Math.sin(k*1.3+t*1.2)*r*.3,r*.62,'rgba(150,255,60,.55)');for(let k=0;k<3;k++){const a=(t*1.5+k/3)%1;circ(x+(k-1)*r*.4,y-a*r,r*.12*(1-a),'rgba(230,255,180,.8)')}break;
    case 'radio':rr(x-r*.75,y-r,r*1.5,r*2,r*.25);ctx.fillStyle='#e8c21a';ctx.fill();ctx.fillStyle='#a8860a';ctx.fillRect(x-r*.75,y-r*.45,r*1.5,r*.12);ctx.fillRect(x-r*.75,y+r*.35,r*1.5,r*.12);ctx.fillStyle='#111';for(let i=0;i<3;i++){const a=-Math.PI/2+i*TAU/3;ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,r*.42,a-.5,a+.5);ctx.fill()}circ(x,y,r*.1,'#111');break;
    case 'gelo':rr(x-r,y-r,r*2,r*2,r*.3);ctx.fillStyle='rgba(200,240,255,.85)';ctx.fill();ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.stroke();line([[x-r*.6,y-r*.5],[x-r*.2,y-r*.7]],'#ffffff',3);break;
    case 'pimenta':ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*3+o.seed)*.3);ctx.fillStyle='#e8231a';ctx.beginPath();ctx.moveTo(-r*.3,-r*.6);ctx.quadraticCurveTo(r*.9,-r*.4,r*.2,r*1.1);ctx.quadraticCurveTo(-r*.6,r*.2,-r*.3,-r*.6);ctx.fill();ell(-r*.2,-r*.7,r*.3,r*.15,'#2f9a3a',-.4);ctx.restore();break;
    case 'asteroide':circ(x,y,r,'#7a7a86');circ(x-r*.3,y-r*.2,r*.25,'#5a5a66');circ(x+r*.35,y+r*.3,r*.18,'#5a5a66');ell(x-r*.4,y-r*.5,r*.3,r*.12,'rgba(255,255,255,.25)',-.5);break;
    case 'feijao':for(let k=0;k<5;k++)circ(x+Math.cos(k*1.4+t)*r*.5,y+Math.sin(k*1.7+t*1.3)*r*.35,r*.6,'rgba(160,130,60,.55)');for(let k=0;k<4;k++)ell(x-r*.4+k*r*.27,y+Math.sin(t*3+k)*4,r*.13,r*.08,'#5a2e18',k);break;
    case 'chocolate':ell(x,y+r*.3,r*1.1,r*.5,'#3a1a08');ell(x,y,r*.9,r*.6,'#5a2e18');ell(x-r*.3,y-r*.2,r*.3,r*.12,'rgba(255,255,255,.25)',-.4);break;
    case 'raio':ctx.save();ctx.shadowColor='#fff23a';ctx.shadowBlur=14;poly([[x+r*.2,y-r*1.1],[x-r*.5,y+r*.1],[x-r*.05,y+r*.1],[x-r*.3,y+r*1.1],[x+r*.55,y-r*.2],[x+r*.08,y-r*.2]],Math.sin(t*20)>0?'#fff23a':'#30e0ff');ctx.restore();break;
    case 'bug':for(let k=0;k<3;k++){ctx.fillStyle=['rgba(255,0,90,.5)','rgba(0,255,255,.5)','#9a6aff'][k];const dx=k<2?(k?3:-3)*Math.sin(t*20):0;ctx.fillRect(x-r*.8+dx,y-r*.8,r*1.6,r*1.6)}ctx.fillStyle='#111';ctx.fillRect(x-r*.45,y-r*.3,r*.3,r*.3);ctx.fillRect(x+r*.15,y-r*.3,r*.3,r*.3);break;
  }
}
function drawWorldBG(Wd,p){
  if(Wd.n===6){for(let i=0;i<60;i++){const xx=((i*137-p.cam*.2)%(W+20)+W+20)%(W+20)-10;circ(xx,(i*71)%H,1+(i%3)*.6,'rgba(255,255,255,.7)')}}
  else if(Wd.n===7){ctx.font='900 16px ui-monospace,Consolas,monospace';ctx.textAlign='center';ctx.fillStyle='rgba(57,255,122,.18)';for(let i=0;i<40;i++){const xx=((i*97-p.cam*.3)%(W+40)+W+40)%(W+40)-20;ctx.fillText(((i+Math.floor(S.time*4))%2)?'1':'0',xx,((i*53+S.time*60)%H))}}
  else if(Wd.n===8){const g=ctx.createRadialGradient(W/2,-100,50,W/2,-100,900);g.addColorStop(0,'rgba(255,250,210,.6)');g.addColorStop(1,'rgba(255,250,210,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
}
function drawPetTrail(p){
  run.pets.forEach((pt,i)=>{const k=Math.min(p.hist.length-1,10+i*9);if(k<0)return;const py=p.hist[k];drawVariant(p.bx-34-i*30,py,11,pt.v,pt.m,{glow:.3,f:pt.f,badge:false})});
}
const PET_SPOTS=[[480,330],[800,330],[450,450],[830,450],[640,110]];
function drawPetsAround(pets){pets.forEach((pt,i)=>{const [x,y]=PET_SPOTS[i]||PET_SPOTS[0];drawVariant(x,y+Math.sin(S.time*2+i)*6,18,pt.v,pt.m,{glow:.4,f:pt.f,badge:false})})}
function updBoss(dt,q,st){
  const B=run.boss; B.t+=dt; B.hurtT=Math.max(0,B.hurtT-dt);
  if(st==='in'){const d=(10+run.power*.1)*(1+run.pet.dmg)*(1+.04*q.combo)*(q.contr>0?2:1)*dt;B.hp-=d;B.dmgAcc+=d;B.hurtT=.12}
  B.dmgT-=dt; if(B.dmgT<=0&&B.dmgAcc>0){float('-'+fmt(B.dmgAcc),1130+rand(-50,50),120,{col:'#ff8a94',size:24,life:.8});B.dmgAcc=0;B.dmgT=.45}
  if(bm('heal')&&st!=='in'&&B.hp<B.max)B.hp=Math.min(B.max,B.hp+B.max*.012*dt);
  if(bm('jump')){B.jumpT-=dt;if(B.jumpT<=0){B.off=rand(-.28,.28);B.jumpT=Math.max(3.5,6-B.fase*.4);float('A FAIXA PULOU!',W/2,380,{col:'#d7ff5a',size:28})}}
  if(bm('invert')){B.invT-=dt;if(B.invT<=0&&B.inv<=0){B.inv=2.5;B.invT=Math.max(6,9-B.fase*.5);sfx.bad()}}
  B.inv=Math.max(0,B.inv-dt);
  if(B.hp<=0){B.hp=0;float('CHEFE DERROTADO!',W/2,300,{col:'#ffd21f',size:56,life:1.6});sfx.up();startFinale();return}
  if(B.t>=B.limit)fail('boss');
}
function C_zapFlash(){S.shake=10;tone({f:1200,f2:200,type:'sawtooth',dur:.25,vol:.1,lp:3000})}
function regionDrop(B){
  const pool=WORLDS[B.world-1].pool;
  if(!pool.length)return rollVariant(90,1+B.fase*.3);
  const order=[...pool].sort((x,y)=>VARS[x[0]].base-VARS[y[0]].base).map(p=>p[0]),luck=1+B.fase*.45;
  return weighted(pool.map(([k,,w])=>[k,w*Math.pow(luck,order.indexOf(k))]));
}
function hudBossTop(q){
  const B=run.boss,left=Math.max(0,B.limit-B.t);
  txt('CHEFE · '+B.name.toUpperCase(),160,30,14,'#ffb3bb',{align:'left',font:'b'});
  bar(160,40,460,18,B.hp/B.max,'#ff4d5e');
  txt(fmt(B.hp)+' / '+fmt(B.max),390,49,13,'#ffffff',{font:'b'});
  txt(Math.ceil(left)+'s',700,49,28,left<10?'#ff4d5e':'#ffffff');
}
function drawBossPanel(){
  const B=run.boss,x=1050,y=40,w=210,h=160,sh=B.hurtT>0&&!RM?(Math.random()-.5)*8:0;
  ctx.save(); rr(x,y,w,h,12); ctx.fillStyle='#120a14'; ctx.fill(); ctx.clip();
  const g=ctx.createRadialGradient(x+w/2,y+h/2,10,x+w/2,y+h/2,140); g.addColorStop(0,'rgba(255,80,90,.35)'); g.addColorStop(1,'rgba(255,80,90,0)'); ctx.fillStyle=g; ctx.fillRect(x,y,w,h);
  drawVariant(x+w/2+sh,y+h/2+12,46,B.key,'none',{glow:.6});
  if(B.hurtT>0)circ(x+w/2,y+h/2+12,48,'rgba(255,255,255,.18)');
  ctx.restore(); rr(x,y,w,h,12); ctx.strokeStyle='rgba(255,120,130,.6)'; ctx.lineWidth=2; ctx.stroke();
  txt('PODER '+fmt(run.power),x+w/2,y+h+16,13,run.power>=B.rec?'#86e0c8':'#ffb3bb',{font:'b'});
}
