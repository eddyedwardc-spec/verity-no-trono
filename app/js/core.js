'use strict';
/* ===== core: constants, helpers, canvas, particles, audio, music, settings ===== */
const W=1280,H=720,TAU=Math.PI*2;
const $=id=>document.getElementById(id);
const cv=$('cv'),mainCtx=cv.getContext('2d'),stage=$('stage');
let ctx=mainCtx;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH=matchMedia('(pointer: coarse)').matches;
const IS_APP=!!(window.desktop&&window.desktop.isApp);
if(IS_APP)document.documentElement.classList.add('app');
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const hexc=c=>{const n=parseInt(c.slice(1),16);return[n>>16&255,n>>8&255,n&255]};
const mix=(a,b,t)=>{const A=hexc(a),B=hexc(b);t=clamp(t,0,1);return`rgb(${Math.round(lerp(A[0],B[0],t))},${Math.round(lerp(A[1],B[1],t))},${Math.round(lerp(A[2],B[2],t))})`};
const shade=(c,k)=>k<0?mix(c,'#000000',-k):mix(c,'#ffffff',k);
const fmt=n=>Math.round(n).toLocaleString(LOCALE);
const money=n=>'V$ '+fmt(n);
const rid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
function withCtx(c,fn){const o=ctx;ctx=c;try{fn()}finally{ctx=o}}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e}
const SMOKE_RUN=/[?&]smoke=1/.test(location.search);

/* ---------- stage sizing: 16:9 game screen ---------- */
let scale=1,DPR=1;
function fit(){
  const cs=getComputedStyle(document.body);
  const aw=document.body.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
  const ah=document.body.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
  let w=aw,h=w*H/W; if(h>ah){h=ah;w=h*W/H}
  w=Math.max(320,Math.floor(w)); h=Math.floor(w*H/W);
  stage.style.width=w+'px'; stage.style.height=h+'px'; stage.style.fontSize=(w/W*16)+'px';
  DPR=Math.min(2,window.devicePixelRatio||1);
  cv.width=Math.round(w*DPR); cv.height=Math.round(h*DPR); scale=cv.width/W;
}
fit();

/* ---------- drawing helpers ---------- */
function rr(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,Math.max(0,Math.min(r,w/2,h/2)));else ctx.rect(x,y,w,h)}
function circ(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,Math.max(0,r),0,TAU);ctx.fill()}
function ell(x,y,rx,ry,c,rot=0){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),rot,0,TAU);ctx.fill()}
function line(pts,c,w){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke()}
function poly(pts,c){ctx.fillStyle=c;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill()}
function txt(s,x,y,size,col,o={}){
  const align=o.align||'center',font=o.font||'d';
  ctx.font=font==='b'?`900 ${size}px Nunito,"Segoe UI",sans-serif`:`${size}px "Lilita One","Arial Rounded MT Bold",sans-serif`;
  ctx.textAlign=align; ctx.textBaseline='middle';
  if(o.stroke!==false){ctx.lineJoin='round';ctx.lineWidth=Math.max(2.5,size*.2);ctx.strokeStyle=o.sc||'rgba(10,24,22,.9)';ctx.strokeText(s,x,y)}
  ctx.fillStyle=col; ctx.fillText(s,x,y);
}
function bar(x,y,w,h,v,col,bg='rgba(0,0,0,.5)'){
  rr(x,y,w,h,h/2); ctx.fillStyle=bg; ctx.fill();
  if(v>0){rr(x,y,Math.max(h,w*clamp(v,0,1)),h,h/2); ctx.fillStyle=col; ctx.fill()}
}
function star4(x,y,s,col){ell(x,y,s,s*.22,col);ell(x,y,s*.22,s,col)}

/* ---------- particles & floating text ---------- */
const S={mode:'boot',time:0,shake:0,paused:false,parts:[],floats:[],bubble:null,doorShake:0,p1:null,p2:null,fin:null,inv:null};
function burst(x,y,col,n,o={}){
  for(let i=0;i<n;i++){
    const a=o.angle!=null?o.angle+rand(-o.spread,o.spread):rand(0,TAU),s=rand(.3,1)*(o.spd??180),life=rand(.6,1)*(o.life??.6);
    S.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s+(o.vy||0),life,max:life,col:Array.isArray(col)?pick(col):col,size:rand(.6,1.2)*(o.size??5),grav:o.grav||0,world:!!o.world,shape:o.shape||'dot',drag:o.drag??2});
  }
}
function float(t,x,y,o={}){const life=o.life??1.1;S.floats.push({t,x,y,life,max:life,col:o.col||'#fff',size:o.size||22,vy:o.vy??-42,world:!!o.world})}
function updFx(dt,scroll=0){
  for(const p of S.parts){p.vx*=1-Math.min(1,p.drag*dt);p.vy+=p.grav*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.world)p.x-=scroll*dt;p.life-=dt}
  S.parts=S.parts.filter(p=>p.life>0);
  for(const f of S.floats){f.y+=f.vy*dt;if(f.world)f.x-=scroll*dt;f.life-=dt}
  S.floats=S.floats.filter(f=>f.life>0);
  if(S.bubble){S.bubble.t-=dt;if(S.bubble.t<=0)S.bubble=null}
}
function drawFx(){
  for(const p of S.parts){
    const a=clamp(p.life/p.max,0,1); ctx.globalAlpha=p.shape==='puff'?a*.55:a;
    if(p.shape==='drop'){ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI);ctx.lineTo(p.x,p.y-p.size*2.1);ctx.closePath();ctx.fill()}
    else if(p.shape==='puff')circ(p.x,p.y,p.size*(1+(1-a)*1.6),p.col);
    else if(p.shape==='star')star4(p.x,p.y,p.size*1.6*Math.sqrt(a),p.col);
    else if(p.shape==='dot')circ(p.x,p.y,p.size*Math.sqrt(a),p.col);
    else drawShapeExtra(p,a);
  }
  ctx.globalAlpha=1;
  for(const f of S.floats){
    const age=f.max-f.life,a=clamp(f.life/.35,0,1),pop=age<.15?.6+age/.15*.5:1.1-Math.min(.1,(age-.15)*.4);
    ctx.globalAlpha=a; ctx.save(); ctx.translate(f.x,f.y); ctx.scale(pop,pop); txt(f.t,0,0,f.size,f.col); ctx.restore();
  }
  ctx.globalAlpha=1;
}

/* ---------- settings ---------- */
const SET={track:'random',musicVol:.45,sfxVol:.6,voice:true,fullStart:false};
try{Object.assign(SET,JSON.parse(localStorage.getItem('verity-settings')||'{}'))}catch(e){}
SET.musicVol=clamp(+SET.musicVol||0,0,1); SET.sfxVol=clamp(+SET.sfxVol||0,0,1);
function saveSettings(){try{localStorage.setItem('verity-settings',JSON.stringify(SET))}catch(e){}}

/* ---------- audio ---------- */
const AU={ctx:null,master:null,noise:null,gr:null,muted:false};
try{AU.muted=localStorage.getItem('verity-mute')==='1'}catch(e){}
if(SMOKE_RUN)AU.muted=true;
function audioInit(){
  if(AU.ctx){if(AU.ctx.state==='suspended')AU.ctx.resume().catch(()=>{});return}
  try{
    const C=window.AudioContext||window.webkitAudioContext; AU.ctx=new C();
    AU.master=AU.ctx.createGain(); AU.master.gain.value=AU.muted?0:SET.sfxVol; AU.master.connect(AU.ctx.destination);
    const b=AU.ctx.createBuffer(1,AU.ctx.sampleRate*2,AU.ctx.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1; AU.noise=b;
  }catch(e){AU.ctx=null;return}
  if(SET.track!=='off')playTrack(wantedTrack());
}
function tone({f=440,f2=0,type='sine',dur=.15,vol=.3,delay=0,lp=0,q=1}){
  if(!AU.ctx)return; const a=AU.ctx,t=a.currentTime+delay;
  const o=a.createOscillator(); o.type=type; o.frequency.setValueAtTime(f,t); if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur);
  const g=a.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.012); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  let n=o; if(lp){const fl=a.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value=lp; fl.Q.value=q; o.connect(fl); n=fl}
  n.connect(g); g.connect(AU.master); o.start(t); o.stop(t+dur+.05);
}
function noise({dur=.2,vol=.3,f=1000,f2=0,type='bandpass',q=1,delay=0}){
  if(!AU.ctx)return; const a=AU.ctx,t=a.currentTime+delay;
  const s=a.createBufferSource(); s.buffer=AU.noise; s.loop=true;
  const fl=a.createBiquadFilter(); fl.type=type; fl.frequency.setValueAtTime(f,t); if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dur); fl.Q.value=q;
  const g=a.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(fl); fl.connect(g); g.connect(AU.master); s.start(t,Math.random()); s.stop(t+dur+.05);
}
const sfx={
  fibra(){tone({f:520,f2:880,dur:.12,vol:.22});tone({f:780,f2:1320,dur:.14,vol:.18,delay:.06})},
  cafe(){tone({f:380,f2:700,type:'triangle',dur:.12,vol:.25});tone({f:600,f2:1100,type:'triangle',dur:.16,vol:.22,delay:.08})},
  hit(){tone({f:170,f2:55,type:'square',dur:.28,vol:.22,lp:700});noise({dur:.16,vol:.25,f:300,type:'lowpass'})},
  wall(){tone({f:240,f2:130,dur:.11,vol:.14})},
  fart(){
    if(!AU.ctx)return; const a=AU.ctx,t=a.currentTime,d=rand(.35,.6);
    const o=a.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(rand(95,130),t); o.frequency.exponentialRampToValueAtTime(rand(50,70),t+d);
    const l=a.createOscillator(); l.frequency.value=rand(18,30); const lg=a.createGain(); lg.gain.value=28; l.connect(lg); lg.connect(o.frequency);
    const f=a.createBiquadFilter(); f.type='lowpass'; f.frequency.value=650; f.Q.value=3;
    const g=a.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.38,t+.03); g.gain.setValueAtTime(.38,t+d*.7); g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(f); f.connect(g); g.connect(AU.master); o.start(t); l.start(t); o.stop(t+d+.05); l.stop(t+d+.05);
  },
  knock(){for(const dl of[0,.17]){noise({dur:.08,vol:.9,f:230,q:4,delay:dl});tone({f:130,f2:80,dur:.08,vol:.3,delay:dl})}},
  ok(){tone({f:330,type:'square',dur:.09,vol:.12,lp:1800});tone({f:494,type:'square',dur:.14,vol:.12,lp:1800,delay:.08})},
  bad(){tone({f:300,f2:140,type:'sawtooth',dur:.45,vol:.18,lp:900})},
  slam(){noise({dur:.35,vol:.9,f:180,type:'lowpass',q:1});tone({f:90,f2:40,dur:.4,vol:.5})},
  scream(){tone({f:700,f2:1100,type:'sawtooth',dur:.5,vol:.12,lp:2500});tone({f:900,f2:600,type:'sawtooth',dur:.6,vol:.1,lp:2500,delay:.35})},
  combo(n){const f=Math.min(1800,360*Math.pow(1.09,n));tone({f,type:'triangle',dur:.1,vol:.16});tone({f:f*1.5,type:'triangle',dur:.08,vol:.09,delay:.05})},
  comboLost(){tone({f:420,f2:200,type:'triangle',dur:.22,vol:.12})},
  contr(){tone({f:200,f2:420,type:'square',dur:.3,vol:.12,lp:1200});tone({f:300,f2:620,type:'square',dur:.3,vol:.1,lp:1200,delay:.12})},
  plop(){tone({f:900,f2:130,dur:.24,vol:.5});tone({f:480,f2:900,dur:.06,vol:.15,delay:.28});tone({f:560,f2:1000,dur:.05,vol:.12,delay:.36})},
  splash(){noise({dur:.55,vol:.45,f:2600,f2:500,q:.8})},
  flush(){noise({dur:2.8,vol:.5,f:3200,f2:260,type:'lowpass',q:2});tone({f:220,f2:55,dur:2.6,vol:.1})},
  coin(){tone({f:988,type:'square',dur:.07,vol:.1,lp:3000});tone({f:1319,type:'square',dur:.2,vol:.1,lp:3000,delay:.07})},
  buy(){[523,659,784].forEach((f,i)=>tone({f,type:'triangle',dur:.12,vol:.14,delay:i*.06}))},
  up(){[392,523,659,784,1047].forEach((f,i)=>tone({f,type:'square',dur:.1,vol:.09,lp:2500,delay:i*.05}))},
  click(){tone({f:660,type:'triangle',dur:.05,vol:.08})},
  err(){tone({f:200,f2:150,type:'square',dur:.18,vol:.1,lp:900})},
  reveal(i){
    const notes=[523,659,784,1047,1319,1568,2093,2637,3136],n=3+Math.min(i,6);
    for(let k=0;k<n;k++)tone({f:notes[k],type:'triangle',dur:.25,vol:.17,delay:k*.085});
    if(i>=4)noise({dur:1.2,vol:.18,f:6000,f2:9000,q:.7,delay:.1});
    if(i>=8){[262,330,392,523,659].forEach(f=>tone({f,type:'triangle',dur:1.8,vol:.12,delay:.75}));tone({f:65,f2:40,dur:1.4,vol:.4,delay:.75})}
  },
  fail(){[392,330,262,196].forEach((f,i)=>tone({f,type:'sawtooth',dur:.28,vol:.14,lp:1000,delay:i*.18}))},
  bye(){tone({f:660,f2:990,dur:.18,vol:.18});tone({f:990,f2:1320,dur:.25,vol:.14,delay:.14})}
};
function startGrunt(){
  if(!AU.ctx||AU.gr)return; const a=AU.ctx;
  const o=a.createOscillator(); o.type='sawtooth'; o.frequency.value=90;
  const lfo=a.createOscillator(); lfo.frequency.value=7; const lg=a.createGain(); lg.gain.value=4; lfo.connect(lg); lg.connect(o.frequency);
  const f=a.createBiquadFilter(); f.type='lowpass'; f.frequency.value=400; f.Q.value=5;
  const g=a.createGain(); g.gain.value=0; o.connect(f); f.connect(g); g.connect(AU.master); o.start(); lfo.start();
  AU.gr={o,lfo,f,g};
}
function setGrunt(level,pitch){if(!AU.gr)return;const t=AU.ctx.currentTime;AU.gr.g.gain.setTargetAtTime(level,t,.05);AU.gr.o.frequency.setTargetAtTime(pitch,t,.08);AU.gr.f.frequency.setTargetAtTime(280+level*2200,t,.08)}
function stopGrunt(){if(!AU.gr)return;const {o,lfo,g}=AU.gr,t=AU.ctx.currentTime;g.gain.setTargetAtTime(0,t,.04);o.stop(t+.3);lfo.stop(t+.3);AU.gr=null}

/* ---------- music engine (16th-note lookahead sequencer) ---------- */
const mtof=m=>440*Math.pow(2,(m-69)/12);
const MUS={timer:null,step:0,next:0,track:null,bus:null,gIn:null,voice:null,pending:[],lyric:'',lyricAt:-9};
function distCurve(k){const n=2048,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i*2/n-1;c[i]=(1+k)*x/(1+k*Math.abs(x))}return c}
function musicInit(){
  if(!AU.ctx||MUS.bus)return; const a=AU.ctx;
  MUS.bus=a.createGain(); MUS.bus.gain.value=AU.muted?0:SET.musicVol; MUS.bus.connect(a.destination);
  MUS.gIn=a.createGain(); const sh=a.createWaveShaper(); sh.curve=distCurve(90); sh.oversample='2x';
  const cab=a.createBiquadFilter(); cab.type='lowpass'; cab.frequency.value=3600;
  const mid=a.createBiquadFilter(); mid.type='peaking'; mid.frequency.value=800; mid.Q.value=.8; mid.gain.value=-5;
  const out=a.createGain(); out.gain.value=.2;
  MUS.gIn.connect(sh); sh.connect(cab); cab.connect(mid); mid.connect(out); out.connect(MUS.bus);
}
function mnote(t,f,dur,o={}){
  const c=AU.ctx,osc=c.createOscillator(); osc.type=o.type||'sine'; osc.frequency.setValueAtTime(f,t);
  if(o.f2)osc.frequency.exponentialRampToValueAtTime(o.f2,t+dur); if(o.detune)osc.detune.value=o.detune;
  const g=c.createGain(),v=o.vol??.1; g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v,t+(o.a||.005)); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  let n=osc; if(o.lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;osc.connect(fl);n=fl}
  n.connect(g); g.connect(o.dest||MUS.bus); osc.start(t); osc.stop(t+dur+.02);
}
function mnoise(t,dur,o={}){
  const c=AU.ctx,s=c.createBufferSource(); s.buffer=AU.noise; s.loop=true;
  const fl=c.createBiquadFilter(); fl.type=o.type||'highpass'; fl.frequency.value=o.f||6000; fl.Q.value=o.q||.7;
  const g=c.createGain(),v=o.vol??.1; g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v,t+.003); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(fl); fl.connect(g); g.connect(MUS.bus); s.start(t,Math.random()); s.stop(t+dur+.02);
}
const DR={
  kick(t,v=.9){mnote(t,150,.3,{vol:v,f2:42,a:.002})},
  snare(t,v=.5){mnoise(t,.18,{vol:v,type:'bandpass',f:1900,q:.8});mnote(t,210,.09,{type:'triangle',vol:v*.6,f2:160})},
  clap(t,v=.2){mnoise(t,.07,{vol:v,f:2500});mnoise(t+.012,.1,{vol:v*.8,f:2200})},
  hat(t,v=.06,open=false){mnoise(t,open?.22:.04,{vol:v,f:8000})},
  crash(t,v=.2){mnoise(t,1.3,{vol:v,f:5200})},
  stick(t){mnote(t,1700,.035,{type:'square',vol:.1,lp:4000})}
};
function guitar(t,root,dur,o={}){
  const c=AU.ctx,mute=!!o.mute,v=o.vol??.5,d=mute?Math.min(dur,.13):dur;
  for(const m of [root,root+7,root+12]){
    const osc=c.createOscillator(); osc.type='sawtooth'; osc.frequency.value=mtof(m); osc.detune.value=rand(-9,9);
    const fl=c.createBiquadFilter(); fl.type='lowpass'; fl.frequency.value=mute?650:2800;
    const g=c.createGain(); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v,t+.004); g.gain.setValueAtTime(v*.85,t+d*.75); g.gain.exponentialRampToValueAtTime(.0001,t+d);
    osc.connect(fl); fl.connect(g); g.connect(MUS.gIn); osc.start(t); osc.stop(t+d+.02);
  }
}
const bass=(t,m,dur,vol=.2,type='sawtooth')=>mnote(t,mtof(m),dur,{type,vol,lp:480});
const bell=(t,m,dur=.5,vol=.08)=>{mnote(t,mtof(m),dur,{vol});mnote(t,mtof(m)*4.01,dur*.35,{vol:vol*.22})};
const lead=(t,m,dur,vol=.06)=>{mnote(t,mtof(m),dur,{type:'square',vol,lp:2600,a:.01});mnote(t,mtof(m),dur,{type:'sawtooth',vol:vol*.5,lp:2600,detune:14,a:.01})};
const KW_CH=[[60,64,67],[55,59,62],[57,60,64],[53,57,60]];
const KW_MEL=[[[0,72],[2,76],[4,79],[6,76],[8,81],[10,79],[12,76],[14,74]],[[0,74],[2,79],[4,83],[6,79],[8,81],[12,79]],[[0,76],[2,72],[4,76],[6,81],[8,79],[10,76],[12,72],[14,74]],[[0,77],[2,76],[4,74],[6,72],[8,74],[12,76]]];
const RK_R={A:[38,0,38,38,0,0,38,0,38,0,38,38,41,0,43,0],B:[38,0,38,38,0,0,38,0,46,0,45,0,43,0,41,0],C:[38,38,38,38,38,38,38,38,50,0,0,0,48,0,0,0]};
const RK_SEQ=['A','B','A','C','A','B','A','C'],RK_BIG=[38,46,41,43];
const HINO_LYRICS=LANG==='en'?[
  ['intro',['One, two, three, four!']],
  ['Verse 1',['I swallowed a yellow ball','And it smiled right back at me','It went through my intestine','Now it wants to be free!']],
  ['Chorus',["Poop, poop, the Verity!","Push, push, till it's out!","Someone knocked: it's occupied!","Nobody's stopping me now!"]],
  ['Verse 2',["Cramps and coffee, fiber, gas","My forehead vein is gonna blow","Combo, combo, green zone","Today I mutate, let's go!"]],
  ['Bridge',['Bronze, gold, diamond, platinum','Galaxy, Hacker, Plineos, GOD!']],
  ['Outro',['PLOFT!']]
]:[
  ['intro',['Um, dois, três, quatro!']],
  ['Verso 1',['Engoli uma bola amarela','E ela sorriu pra mim','Atravessou o intestino','Agora chegou o fim!']],
  ['Refrão',['Caga, caga, a Verity!','Força, força, até sair!','Bateram na porta: tá ocupado!','Ninguém vai me impedir!']],
  ['Verso 2',['Cólica, café, fibra e gás','Minha veia vai estourar','Combo, combo, faixa verde','Hoje eu vou mutar!']],
  ['Ponte',['Bronze, ouro, diamante, platina','Galaxy, Hacker, Plineos, GOD!']],
  ['Final',['PLOFT!']]
];
const HN_BARS=(()=>{
  const out=[],sec=(k,ch,lines)=>ch.forEach((c,i)=>out.push({k,ch:c,first:i===0,lyric:lines&&i%2===0?lines[i/2]:null}));
  const V=[40,47,49,45,40,47,49,45],C=[45,47,40,40,45,47,49,47];
  sec('count',[40],HINO_LYRICS[0][1]); sec('intro',[40,40,47,45]);
  sec('verse',V,HINO_LYRICS[1][1]); sec('chorus',C,HINO_LYRICS[2][1]);
  sec('verse',V,HINO_LYRICS[3][1]); sec('chorus',C,HINO_LYRICS[2][1]);
  sec('bridge',[49,45,47,47],HINO_LYRICS[4][1]); sec('chorus',C,HINO_LYRICS[2][1]);
  sec('end',[40,40],HINO_LYRICS[5][1]);
  return out;
})();
const HN_BRIDGE_END=HN_BARS.findIndex(x=>x.k==='bridge')+3;
const HN_LEAD=[[[0,71],[2,71],[4,71],[6,71],[8,73],[10,71],[12,68],[14,64]],[[0,66],[2,68],[4,66],[6,64],[8,64,6]]];
const TRACKS={
  kawaii:{name:_t("Kawaii Fofinha"),desc:_t("Sininhos, palminhas e muita fofura."),bpm:132,play(bar,s,t,sd){
    const ch=KW_CH[bar%4],sec=Math.floor(bar/4)%2,mel=KW_MEL[bar%4].find(n=>n[0]===s);
    if(s===0||s===8)DR.kick(t,.45); if(s===4||s===12)DR.clap(t,.16); if(s%2===0)DR.hat(t,.03);
    if(s===0||s===6||s===8||s===14)bass(t,ch[0]-24,sd*2,.15,'triangle');
    if(s===2||s===6||s===10||s===14)for(const m of ch)mnote(t,mtof(m),sd*1.2,{type:'square',vol:.016,lp:2000});
    if(sec===0&&mel)bell(t,mel[1],.45,.08);
    if(sec===1){bell(t,ch[s%3]+24,.16,.03);if(mel&&s%4===0)bell(t,mel[1],.5,.07)}
    if(s===12&&bar%2===1)[0,2,4,7,9].forEach((d,i)=>bell(t+i*sd*.5,84+d,.25,.03));
  }},
  rock:{name:_t("Rock Pesadão"),desc:_t("Afinação drop D, bumbo duplo e parede de guitarra."),bpm:92,play(bar,s,t,sd){
    const b=bar%12;
    if(b<8){
      const r=RK_R[RK_SEQ[b]][s];
      if(r){const mute=r===38;guitar(t,r,mute?sd*.9:sd*1.8,{mute,vol:.5});bass(t,r-12,sd*.9,.2);if(mute)DR.kick(t,.75)}
      if(s===4||s===12)DR.snare(t,.5); if(s%2===0)DR.hat(t,.045); if(s===0&&b%4===0)DR.crash(t,.17);
    }else{
      const r=RK_BIG[b-8];
      if(s===0){guitar(t,r,sd*15,{vol:.5});bass(t,r-12,sd*15,.22);DR.crash(t,.22);DR.kick(t,.9)}
      if(s===8)DR.snare(t,.6); if(s===4||s===12||s===14)DR.kick(t,.6); if(s%4===0)DR.hat(t,.05,true);
      if(b===11&&s>=12)DR.snare(t,.3+(s-12)*.08);
    }
  }},
  hino:{name:_t("Hino da Verity"),desc:_t("Punk rock original sobre cagar uma Verity. Com letra."),bpm:176,play(bar,s,t,sd){
    const bi=bar%HN_BARS.length,B=HN_BARS[bi];
    if(s===0&&B.lyric)sing(B.lyric,t);
    if(B.k==='count'){if(s%4===0)DR.stick(t);return}
    const r=B.ch,ch=B.k==='chorus';
    if(s===0&&B.first)DR.crash(t,.22);
    if(B.k==='end'){if(s===0){guitar(t,r,sd*14,{vol:.5});bass(t,r-12,sd*14,.22);DR.kick(t,.9);DR.crash(t,.25)}return}
    if(B.k==='bridge'){
      if(s===0){guitar(t,r,sd*15,{vol:.5});bass(t,r-12,sd*15,.2)}
      if(s%4===0)DR.kick(t,.8); if(s===4||s===12)DR.snare(t,.5); if(s%2===0)DR.hat(t,.05,true);
      if(bi===HN_BRIDGE_END&&s>=8)DR.snare(t,.3+(s-8)*.05);
      return;
    }
    if(s%2===0){guitar(t,r,sd*1.8,{mute:B.k==='verse'&&s%8!==0,vol:.5});bass(t,r-12,sd*1.6,.2)}
    if(s===0||s===8||(ch&&s===10))DR.kick(t,.85); if(s===4||s===12)DR.snare(t,.55);
    if(s%2===0)DR.hat(t,ch?.07:.05,ch&&s%4===2);
    if(ch){const ln=HN_LEAD[bar%2].find(n=>n[0]===s);if(ln)lead(t,ln[1],sd*(ln[2]||1.8),.055)}
  }}
};
function sing(line,t){
  const delay=Math.max(0,(t-AU.ctx.currentTime)*1000);
  MUS.pending.push(setTimeout(()=>{
    MUS.lyric=line; MUS.lyricAt=S.time;
    if((typeof CS!=='undefined'&&CS)||!SET.voice||AU.muted||SET.musicVol<=0||!('speechSynthesis' in window))return;
    try{
      const u=new SpeechSynthesisUtterance(line); u.lang=LOCALE; if(MUS.voice)u.voice=MUS.voice;
      u.rate=1.3; u.pitch=.35; u.volume=clamp(SET.musicVol*1.8,0,1);
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }catch(e){}
  },Math.max(0,delay-60)));
  if(MUS.pending.length>40)MUS.pending=MUS.pending.slice(-20);
}
function pickVoice(){try{const vs=speechSynthesis.getVoices();MUS.voice=LANG==='en'?(vs.find(v=>/en-US/i.test(v.lang)&&/david|mark|guy|male/i.test(v.name))||vs.find(v=>/en-US/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang))||null):(vs.find(v=>/pt-BR/i.test(v.lang)&&/daniel|antonio|male|masc/i.test(v.name))||vs.find(v=>/^pt/i.test(v.lang))||null)}catch(e){}}
if('speechSynthesis' in window){pickVoice();try{speechSynthesis.addEventListener('voiceschanged',pickVoice)}catch(e){}}
function musicTick(){
  const a=AU.ctx; if(!a||!MUS.track)return;
  const tr=TRACKS[MUS.track],sd=60/tr.bpm/4;
  if(MUS.next<a.currentTime-.05)MUS.next=a.currentTime+.03;
  while(MUS.next<a.currentTime+.12){try{tr.play(Math.floor(MUS.step/16),MUS.step%16,MUS.next,sd)}catch(e){}MUS.next+=sd;MUS.step++}
}
function stopMusic(){clearInterval(MUS.timer);MUS.timer=null;MUS.pending.forEach(clearTimeout);MUS.pending=[];MUS.lyric='';try{if('speechSynthesis' in window)speechSynthesis.cancel()}catch(e){}}
const LAUNCH_PICK=pick(['kawaii','rock','hino']);
const wantedTrack=()=>SET.track==='random'?LAUNCH_PICK:SET.track;
function playTrack(k){
  stopMusic(); MUS.track=null;
  if(TRACKS[k]&&AU.ctx){musicInit();MUS.track=k;MUS.step=0;MUS.next=AU.ctx.currentTime+.08;MUS.timer=setInterval(musicTick,25);musicTick()}
  if(typeof renderNowPlaying==='function')renderNowPlaying();
}
function applyVolumes(){
  if(!AU.ctx)return; const t=AU.ctx.currentTime;
  AU.master.gain.setTargetAtTime(AU.muted?0:SET.sfxVol,t,.02);
  if(MUS.bus)MUS.bus.gain.setTargetAtTime(AU.muted?0:SET.musicVol,t,.02);
}
function setMute(m){
  AU.muted=m; applyVolumes(); if(m)try{speechSynthesis.cancel()}catch(e){}
  if(!SMOKE_RUN)try{localStorage.setItem('verity-mute',m?'1':'0')}catch(e){}
  if(typeof renderCfg==='function'&&!$('cfg').hidden)renderCfg();
}
