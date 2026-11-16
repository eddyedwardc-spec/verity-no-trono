'use strict';
/* ===== cutscene: a short scene for every Verity the first time you get it, plus the marmita roulette ===== */
const CUT_T={ent:.55,act:2.4,title:5.0,end:7.4};
const CX=640,RY=560,OUTY=RY-170,R0=100;
const TOI={tx:640-270*1.25,ty:RY-505*1.25,s:1.25};
const ease={out:t=>1-Math.pow(1-t,3),in:t=>t*t*t,io:t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,
  back:t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)},
  elastic:t=>t<=0?0:t>=1?1:Math.pow(2,-10*t)*Math.sin((t*10-.75)*2*Math.PI/3)+1};

/* e = entrance, a = action, fx = ambience, line = what it says, p = voice pitch, c = smoke/portal colour */
const CUT_SPECS={
  verity:{e:'rise',a:'wave',fx:'sparkle',line:_t("Oi! Lembra de mim? Eu sou a original!"),p:1.3},
  larpity:{e:'jump',a:'dance',fx:'confetti',line:_t("Larp larp! Bora dançar!"),p:1.5},
  falsity:{e:'smoke',c:'#3a6aff',a:'laugh',fx:'dark',line:_t("Hehehe... nada do que você viu era verdade."),p:.8},
  obesity:{e:'butt',a:'eat',fx:'none',line:_t("Nham! Tinha mais comida aí dentro?"),p:.6},
  lovity:{e:'grow',a:'hearts',fx:'hearts',line:_t("Awn! Eu te amo, dono!"),p:1.7},
  cruelty:{e:'burst',a:'laugh',fx:'embers',line:_t("Você vai sofrer... de dor de barriga!"),p:.5},
  moggity:{e:'jump',a:'stare',fx:'sparkle',line:_t("Nem precisei fazer força."),p:.7},
  eclipse:{e:'dark',a:'menace',fx:'dark',line:_t("Eu sempre estive aqui dentro..."),p:.3},
  lord:{e:'beam',a:'crown',fx:'holy',line:_t("Curvem-se diante do Lorde!"),p:.9},
  exu:{e:'smoke',c:'#c81a1a',a:'greet',fx:'embers',line:_t("Salve, camarada! Laroyê!"),p:.5},
  azedity:{e:'rise',a:'shiver',fx:'none',line:_t("Azedo! Que azedo! Que azedo!"),p:1.6},
  gastrity:{e:'swim',a:'roar',fx:'bubbles',line:_t("BUUURP! Com licença."),p:.9},
  dragonity:{e:'lava',a:'fire',fx:'embers',line:_t("Eu nasci no estômago de um dragão!"),p:.6},
  ratity:{e:'crawl',a:'eat',fx:'none',line:_t("Queijo? Tem queijo aí?"),p:1.8,food:'cheese'},
  lodity:{e:'rise',a:'sleep',fx:'slime',line:_t("Blub... me deixa dormir no lodo..."),p:.5},
  radiativity:{e:'teleport',a:'zap',fx:'slime',line:_t("Brilho no escuro! E na sua barriga também!"),p:1.2,zc:'#8cff2a'},
  picolity:{e:'fall',a:'dance',fx:'snow',line:_t("Tô derretendo de alegria!"),p:1.6},
  geladity:{e:'freeze',a:'shiver',fx:'snow',line:_t("Brrr... fecha essa tampa!"),p:1.1},
  yetity:{e:'freeze',a:'roar',fx:'snow',line:_t("ROAAAR! Quem me acordou?!"),p:.4},
  ardity:{e:'burst',a:'sweat',fx:'embers',line:_t("Tá ardendo! Tá ardendo! TÁ ARDENDO!"),p:1.5},
  pimentity:{e:'drill',a:'fire',fx:'embers',line:_t("Picante demais pra você!"),p:1.2},
  magmity:{e:'lava',a:'roar',fx:'embers',line:_t("Eu sou a lava do seu vulcão interior!"),p:.5},
  alienity:{e:'portal',c:'#6ee05a',a:'beep',fx:'stars',line:_t("Bip bop. Leve-me ao seu líder."),p:1.4},
  astronauty:{e:'beam',a:'float',fx:'stars',line:_t("Houston, saí da privada!"),p:1.1},
  lunity:{e:'portal',c:'#c9c9ff',a:'orbit',fx:'stars',line:_t("A lua me trouxe até você..."),p:.8},
  bugity:{e:'teleport',a:'glitch',fx:'matrix',line:_t("Erro 404: privada não encontrada."),p:1.3},
  robotity:{e:'drill',a:'beep',fx:'sparkle',line:_t("Sistema ligado. Cagada concluída."),p:.7},
  matrixity:{e:'teleport',a:'laser',fx:'matrix',line:_t("Você tomou a pílula marrom."),p:.5},
  anjity:{e:'beam',a:'float',fx:'holy',line:_t("Paz, amor... e papel higiênico."),p:1.6},
  zeusity:{e:'beam',a:'zap',fx:'rain',line:_t("Eu sou o deus do trovão... e do trono!"),p:.4,zc:'#ffe23a'},
  divinity:{e:'beam',a:'float',fx:'holy',line:_t("Contemple a perfeição."),p:1.0},
  feijonity:{e:'rise',a:'eat',fx:'smoke',line:_t("Feijão com arroz, minha vida!"),p:1.0,food:'beans'},
  gasosity:{e:'smoke',c:'#c8e040',a:'laugh',fx:'smoke',line:_t("Pfffrrrt! Desculpa, fui eu."),p:1.2},
  pantanity:{e:'swim',a:'roar',fx:'slime',line:_t("O pântano me chamou de volta."),p:.5},
  chocolity:{e:'rise',a:'eat',fx:'sparkle',line:_t("Sou doce. Não pergunta de onde eu vim."),p:1.5,food:'choc'},
  brigadeity:{e:'jump',a:'party',fx:'confetti',line:_t("Tem festa? Eu sou o brigadeiro!"),p:1.5},
  trufity:{e:'grow',a:'crown',fx:'sparkle',line:_t("Trufada, refinada, e saí de você."),p:.8},
  faiscity:{e:'teleport',a:'zap',fx:'sparkle',line:_t("Bzzzt! Tô carregada!"),p:1.7,zc:'#fff23a'},
  voltity:{e:'drill',a:'zap',fx:'rain',line:_t("Duzentos e vinte volts de pura Verity!"),p:.9,zc:'#30e0ff'},
  trovity:{e:'beam',a:'zap',fx:'rain',line:_t("Ouviu esse trovão? Fui eu!"),p:.4,zc:'#9a9aff'},
  abismity:{e:'portal',c:'#5a2ab8',a:'menace',fx:'dark',line:_t("Olhe para o abismo..."),p:.4},
  vazity:{e:'dark',a:'menace',fx:'dark',line:_t("Nada. Só nada."),p:.25},
  infinity:{e:'portal',c:'#c8a8ff',a:'orbit',fx:'holy',line:_t("Eu não tenho começo nem fim."),p:.9},
  rolhity:{e:'burst',a:'spin',fx:'confetti',line:_t("POC! Finalmente desentupiu!"),p:1.0},
  aziaty:{e:'lava',a:'fire',fx:'embers',line:_t("Queimação total!"),p:.6},
  mutanty:{e:'rise',a:'laugh',fx:'slime',line:_t("Três olhos pra te vigiar!"),p:.7},
  icebergity:{e:'freeze',a:'stare',fx:'snow',line:_t("Eu era só a pontinha..."),p:.6},
  reipimentity:{e:'lava',a:'crown',fx:'embers',line:_t("Ajoelhem para o rei mais ardido!"),p:.5},
  polvity:{e:'swim',a:'dance',fx:'bubbles',line:_t("Oito braços pra te abraçar!"),p:1.2},
  virusity:{e:'teleport',a:'glitch',fx:'matrix',line:_t("Seu intestino foi hackeado."),p:.5},
  entupity:{e:'burst',a:'roar',fx:'holy',line:_t("EU SOU O GRANDE ENTUPIMENTO!"),p:.3},
  reifeijity:{e:'rise',a:'crown',fx:'smoke',line:_t("O rei do feijão chegou!"),p:.6},
  baronity:{e:'grow',a:'stare',fx:'sparkle',line:_t("Encantado. Barão do Cacau, às ordens."),p:.7},
  choquity:{e:'burst',a:'zap',fx:'rain',line:_t("CHOQUE DE REALIDADE!"),p:.8,zc:'#ffe020'},
  nadity:{e:'dark',a:'menace',fx:'dark',line:_t("Eu sou o que sobra quando nada sobra."),p:.3},
  festivity:{e:'jump',a:'party',fx:'confetti',line:_t("É festa! O Mundo Vivo chegou!"),p:1.6},
  abobority:{e:'smoke',c:'#ff8a10',a:'laugh',fx:'embers',line:_t("Doces ou travessuras? Travessuras!"),p:.7},
  papaiverity:{e:'fall',a:'wave',fx:'snow',line:_t("Ho ho ho! Feliz Natal no trono!"),p:.6},
  carnavality:{e:'jump',a:'dance',fx:'confetti',line:_t("Ô abre alas que eu quero passar!"),p:1.4},
  caipirity:{e:'rise',a:'dance',fx:'confetti',line:_t("Arraiá do trono, sô!"),p:1.2}
};

/* ---------- sounds just for scenes ---------- */
const CSFX={
  sting(r){[392,494,587,784,988].slice(0,2+Math.min(r,3)).forEach((f,i)=>tone({f,type:'triangle',dur:.3,vol:.12,delay:i*.07}))},
  rumble(){noise({dur:1.2,vol:.35,f:120,type:'lowpass',q:1})},
  whoosh(){noise({dur:.5,vol:.25,f:600,f2:3000,q:.8})},
  magic(){[1047,1319,1568,2093,2637].forEach((f,i)=>tone({f,dur:.4,vol:.07,delay:i*.06}))},
  zap(){noise({dur:.18,vol:.4,f:3000,f2:800,q:3});tone({f:880,f2:110,type:'sawtooth',dur:.2,vol:.1,lp:3000})},
  choir(){[262,330,392,523].forEach(f=>tone({f,type:'triangle',dur:1.8,vol:.06}))},
  chomp(){noise({dur:.08,vol:.35,f:900,q:2});tone({f:180,f2:120,dur:.08,vol:.15})},
  horn(){tone({f:520,f2:760,type:'square',dur:.35,vol:.1,lp:2000})},
  beat(){tone({f:60,f2:40,dur:.25,vol:.5})},
  beep(){tone({f:1200,type:'square',dur:.08,vol:.08});tone({f:900,type:'square',dur:.08,vol:.08,delay:.12})},
  crack(){noise({dur:.3,vol:.5,f:2500,q:1.5})}
};
let CS=null;
function startCutscene(vk,mk,f,after,replay){
  const V=VARS[vk]; if(!V)return after&&after();
  const spec=CUT_SPECS[vk]||{e:'rise',a:'wave',fx:'sparkle',line:V.name+'!',p:1};
  CS={vk,mk:mk||'none',f:f||0,t:0,spec,after,replay:!!replay,once:{},shake:0,flash:0,zoom:1,said:false,pose:{x:CX,y:RY+140,s:1,rot:0,sq:1,a:0,inBowl:true},props:[]};
  if(!replay&&!P.seen.includes(vk)){P.seen.push(vk);saveProfile()}
  stopGrunt(); $('knockBtn').hidden=true; $('pauseBtn').hidden=true; $('results').hidden=true; showOnly(null);
  S.parts=[]; S.floats=[]; S.mode='cut';
  if(MUS.bus&&AU.ctx)MUS.bus.gain.setTargetAtTime(AU.muted?0:SET.musicVol*.3,AU.ctx.currentTime,.2);
  CSFX.sting(V.r); CSFX.rumble();
}
function cutSkip(){if(!CS)return;if(CS.t<CUT_T.title-.05)CS.t=CUT_T.title-.05;else endCutscene()}
function endCutscene(){const a=CS&&CS.after;CS=null;S.parts=[];S.floats=[];try{speechSynthesis.cancel()}catch(e){}applyVolumes();if(a)a();else goMenu()}
function cOnce(k,fn){if(!CS.once[k]){CS.once[k]=1;fn()}}
function speakLine(line,pitch){
  if(!SET.voice||AU.muted||!('speechSynthesis' in window))return;
  try{const u=new SpeechSynthesisUtterance(line);u.lang=LOCALE;if(MUS.voice)u.voice=MUS.voice;u.pitch=clamp(pitch||1,.1,2);u.rate=1.05;u.volume=clamp(SET.sfxVol*1.6,0,1);speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}
}

/* ---------- entrances: p goes 0→1 between CUT_T.ent and CUT_T.act ---------- */
const cPose=(o)=>({x:CX,y:OUTY,s:1,rot:0,sq:1,a:1,inBowl:false,...o});
const ENT={
  rise(p,C){cOnce('b',()=>sfx.fibra());if(Math.random()<.5)burst(CX+rand(-60,60),RY,'#bfe8ff',1,{angle:-Math.PI/2,spread:.5,spd:120,grav:500,shape:'drop',size:5,life:.8});
    const e=ease.out(p);return cPose({y:lerp(RY+120,OUTY,e),rot:Math.sin(p*14)*.06*(1-p),inBowl:p<.85})},
  jump(p,C){
    if(p<.35)return cPose({y:RY+120,inBowl:true,a:1});
    cOnce('j',()=>{sfx.plop();C.shake=10;burst(CX,RY,'#c9efff',30,{spd:420,size:6,life:1,grav:600,vy:-200})});
    const u=clamp((p-.35)/.45,0,1);if(u>=1){const k=clamp((p-.8)/.2,0,1);cOnce('land',()=>{C.shake=8;sfx.wall()});return cPose({sq:1-.3*Math.exp(-k*6)*Math.cos(k*14)})}
    return cPose({y:lerp(RY+120,OUTY,u)-Math.sin(u*Math.PI)*280,rot:u*TAU,inBowl:u<.15,sq:1.1})},
  burst(p,C){
    if(p<.3){C.shake=p*40;return cPose({y:RY+120,inBowl:true})}
    cOnce('b',()=>{sfx.slam();sfx.splash();C.shake=26;C.flash=.6;burst(CX,RY,['#c9efff','#ffffff'],60,{spd:620,size:7,life:1.2,grav:700,vy:-250})});
    const u=clamp((p-.3)/.5,0,1);if(u>=1)return cPose({sq:1-.25*Math.exp(-(p-.8)*30)});
    return cPose({y:lerp(RY+40,OUTY,u)-Math.sin(u*Math.PI)*360,rot:Math.sin(u*9)*.4,s:1+.2*Math.sin(u*Math.PI)})},
  drill(p,C){cOnce('d',()=>CSFX.whoosh());if(Math.random()<.6)burst(CX+rand(-90,90),RY,'#cfc6b0',1,{angle:-Math.PI/2,spread:1.2,spd:220,grav:400,size:5,life:.7});
    const e=ease.out(p);return cPose({y:lerp(RY+120,OUTY,e),rot:(1-e)*TAU*5,inBowl:p<.8})},
  teleport(p,C){
    if(p<.6){if(Math.random()<.8){const a=rand(0,TAU),d=rand(260,420);burst(CX+Math.cos(a)*d,OUTY+Math.sin(a)*d,C.spec.zc||'#ffffff',1,{angle:a+Math.PI,spread:.05,spd:d*1.6,size:4,life:.6,shape:'star',drag:0})}return cPose({a:0})}
    cOnce('t',()=>{CSFX.magic();C.flash=.9;C.shake=6});const u=clamp((p-.6)/.4,0,1);return cPose({s:ease.back(u)*1,a:1,glitch:u<.5})},
  beam(p,C){cOnce('b',()=>CSFX.choir());C.beam=Math.min(1,p*2);const e=ease.io(p);return cPose({y:lerp(-160,OUTY,e),rot:Math.sin(p*6)*.08})},
  lava(p,C){
    if(p<.3){C.shake=p*30;return cPose({y:RY+120,inBowl:true})}
    cOnce('l',()=>{sfx.slam();C.shake=18;CSFX.rumble()});
    for(let i=0;i<3;i++)burst(CX+rand(-50,50),RY,['#ff6a10','#ffd23a','#ff2a00'],1,{angle:-Math.PI/2,spread:.4,spd:rand(400,700),grav:700,size:7,life:1.1});
    C.tint='rgba(255,90,20,.18)';const u=ease.out(clamp((p-.3)/.7,0,1));return cPose({y:lerp(RY+120,OUTY,u),inBowl:u<.8})},
  freeze(p,C){
    C.ice=p<.65?p/.65:0;
    if(p<.65)return cPose({y:RY+60,inBowl:true,a:.9});
    cOnce('f',()=>{CSFX.crack();C.shake=14;C.flash=.4;burst(CX,RY-60,['#dff6ff','#ffffff','#a8daff'],40,{spd:500,size:7,life:1,grav:500})});
    const u=ease.back(clamp((p-.65)/.35,0,1));return cPose({y:lerp(RY+60,OUTY,u)})},
  swim(p,C){if(Math.random()<.7)burst(CX+rand(-110,110),RY,'#bfe8ff',1,{angle:-Math.PI/2,spread:.2,spd:rand(80,200),size:rand(3,8),life:1.4,drag:0});
    cOnce('s',()=>sfx.fibra());const e=ease.out(p);return cPose({y:lerp(RY+130,OUTY,e)+Math.sin(p*20)*12*(1-p),rot:Math.sin(p*10)*.15*(1-p),inBowl:p<.85})},
  crawl(p,C){
    if(p<.55){const look=Math.sin(p*22);return cPose({y:RY+45,x:CX+look*40,inBowl:true,peek:true})}
    cOnce('c',()=>sfx.fart());const u=clamp((p-.55)/.45,0,1);return cPose({y:lerp(RY+45,OUTY,u)-Math.sin(u*Math.PI)*160,inBowl:u<.2})},
  smoke(p,C){
    cOnce('s',()=>{CSFX.whoosh();noise({dur:1.4,vol:.2,f:400,type:'lowpass'})});
    if(Math.random()<.9)burst(CX+rand(-150,150),RY-rand(0,200),C.spec.c||'#888888',1,{spd:40,shape:'puff',size:rand(26,44),life:1.6,drag:1});
    const a=clamp((p-.45)/.4,0,1);return cPose({a,s:.9+.1*a})},
  portal(p,C){C.portal=Math.min(1,p*2.2);cOnce('p',()=>CSFX.magic());
    const u=clamp((p-.35)/.65,0,1);return cPose({s:ease.back(u),rot:(1-u)*TAU*1.5,a:u>0?1:0})},
  fall(p,C){
    if(p<.4){const u=p/.4;cOnce('w',()=>CSFX.whoosh());return cPose({y:lerp(-150,RY+80,ease.in(u)),rot:u*TAU,inBowl:u>.85})}
    cOnce('f',()=>{sfx.plop();sfx.splash();C.shake=12;burst(CX,RY,'#c9efff',36,{spd:500,size:6,life:1,grav:600,vy:-250})});
    if(p<.6)return cPose({y:RY+120,inBowl:true});
    const u=ease.back(clamp((p-.6)/.4,0,1));return cPose({y:lerp(RY+120,OUTY,u),inBowl:u<.7})},
  grow(p,C){cOnce('g',()=>CSFX.magic());const s=Math.max(.05,ease.elastic(p));return cPose({s,y:lerp(RY-30,OUTY,ease.out(p))})},
  dark(p,C){
    C.dark=Math.min(1,.55+p);cOnce('d',()=>{CSFX.beat();setTimeout(()=>{if(CS)CSFX.beat()},500);setTimeout(()=>{if(CS)CSFX.beat()},1000)});
    const u=ease.io(clamp((p-.3)/.7,0,1));return cPose({y:lerp(RY+60,OUTY,u),a:clamp((p-.25)*2,0,1),inBowl:u<.6,eyesOnly:p<.7})},
  butt(p,C){
    C.butt=p;
    if(p<.3){C.shake=4+p*30;cOnce('a',()=>{CSFX.rumble();sfx.fart()});return cPose({a:0})}
    if(p<.55){cOnce('o',()=>{sfx.slam();C.shake=22;float(_t("AI!"),CX-260,170,{size:60,col:'#ff4d5e',life:1.2});
      for(let i=0;i<14;i++)burst(CX+rand(-30,30),250,'#d42a2a',1,{angle:rand(-Math.PI*.95,-Math.PI*.05)+Math.PI,spread:.3,spd:rand(250,520),grav:900,shape:'drop',size:rand(4,8),life:1.1})});
      const u=(p-.3)/.25;return cPose({y:lerp(150,240,u),s:.8,sq:1+.25*Math.sin(u*Math.PI),a:1,eating:true})}
    if(p<.8){const u=(p-.55)/.25;cOnce('d',()=>CSFX.whoosh());return cPose({y:lerp(240,RY+80,ease.in(u)),rot:u*1.2,s:.9,inBowl:u>.8,eating:true})}
    cOnce('s',()=>{sfx.plop();sfx.splash();C.shake=14;burst(CX,RY,'#c9efff',40,{spd:520,size:7,life:1,grav:600,vy:-250})});
    const u=ease.back(clamp((p-.8)/.2,0,1));return cPose({y:lerp(RY+100,OUTY,u),inBowl:u<.7,eating:true})}
};

/* ---------- actions: q goes 0→1 between CUT_T.act and CUT_T.title ---------- */
const ACT={
  wave(q,C,P0){P0.y+=Math.sin(q*TAU*2)*8;P0.hand=Math.sin(q*TAU*4);return P0},
  greet(q,C,P0){const b=Math.max(0,Math.sin(q*Math.PI*2));P0.rot=b*.38;P0.hat=b;P0.noHat=true;cOnce('g',()=>CSFX.horn());return P0},
  eat(q,C,P0){const ch=Math.abs(Math.sin(q*TAU*3));P0.sq=1-ch*.12;P0.food=C.spec.food||'burger';P0.bite=Math.floor(q*6);
    if(Math.floor(q*6)!==C.lastBite){C.lastBite=Math.floor(q*6);CSFX.chomp();burst(CX+110,OUTY+20,['#c8903a','#7ad02a','#e8231a'],6,{spd:200,grav:600,size:4,life:.8});if(C.lastBite%2)float(_t("NHAM!"),CX+rand(150,260),OUTY-rand(40,120),{size:34,col:'#ffd23a',life:.8})}
    return P0},
  dance(q,C,P0){P0.x+=Math.sin(q*TAU*3)*60;P0.rot=Math.sin(q*TAU*3)*.25;P0.y+=-Math.abs(Math.sin(q*TAU*6))*30;C.disco=1;
    if(Math.random()<.15)burst(CX+rand(-260,260),OUTY-rand(0,120),['#ffd23a','#ff4fd0','#3ad4ff'],1,{angle:-Math.PI/2,spread:.4,spd:90,shape:'note',size:12,life:1.4,drag:.5});return P0},
  laugh(q,C,P0){P0.x+=(Math.random()-.5)*10;P0.rot=Math.sin(q*TAU*8)*.08;
    if(Math.floor(q*5)!==C.lastHa){C.lastHa=Math.floor(q*5);float(pick(['HA HA HA!','HAHAHA!',_t("HUE HUE!")]),CX+rand(-260,260),OUTY-rand(60,180),{size:44,col:'#ff4d5e',life:.9})}
    if(q>.3)cOnce('fl',()=>{C.flash=.5;CSFX.zap()});return P0},
  hearts(q,C,P0){P0.s=1+Math.sin(q*TAU*3)*.05;if(Math.random()<.35)burst(CX+rand(-120,120),OUTY,'#ff5a9a',1,{angle:-Math.PI/2,spread:.6,spd:120,shape:'heart',size:16,life:1.6,drag:.4});return P0},
  stare(q,C,P0){C.zoom=1+ease.io(q)*.28;if(q>.5)cOnce('m',()=>{float('*mog*',CX+150,OUTY-110,{size:40,col:'#ffd23a',life:1.6,vy:-10});CSFX.magic()});P0.shine=q;return P0},
  menace(q,C,P0){C.dark=Math.min(1,(C.dark||.6)+.01);C.red=.25+Math.sin(q*TAU*3)*.1;P0.s=1+q*.25;P0.y+=q*20;cOnce('m',()=>{CSFX.beat()});return P0},
  crown(q,C,P0){P0.y-=Math.sin(q*Math.PI)*20;C.trumpets=1;cOnce('c',()=>{CSFX.horn();setTimeout(()=>{if(CS)CSFX.horn()},250);burst(CX,OUTY-100,['#ffd23a','#ffffff','#ff4d6d'],50,{spd:500,size:6,life:1.4,grav:400,shape:'rect'})});return P0},
  shiver(q,C,P0){P0.x+=(Math.random()-.5)*14;P0.tint='rgba(150,210,255,.25)';return P0},
  roar(q,C,P0){C.shake=Math.max(C.shake,12*(1-q));P0.s=1+Math.sin(Math.min(q*3,1)*Math.PI)*.25;cOnce('r',()=>{sfx.slam();CSFX.rumble();float('ROOOAR!',CX,OUTY-200,{size:72,col:'#ffffff',life:1.4})});C.ring=q;return P0},
  sleep(q,C,P0){P0.s=1+Math.sin(q*TAU*1.5)*.04;if(Math.random()<.04)float('Z',CX+110+rand(0,40),OUTY-90,{size:rand(26,44),col:'#c9f5e6',life:1.6,vy:-40});return P0},
  spin(q,C,P0){P0.rot=ease.io(q)*TAU*3;P0.y-=Math.sin(q*Math.PI)*80;return P0},
  zap(q,C,P0){P0.x+=(Math.random()-.5)*6;if(Math.random()<.08){C.bolt={t:.15,x:CX+rand(-300,300)};C.flash=.25;CSFX.zap()}return P0},
  fire(q,C,P0){P0.rot=-.15;cOnce('f',()=>noise({dur:1.6,vol:.35,f:900,type:'lowpass'}));for(let i=0;i<4;i++)burst(CX+70,OUTY+30,['#ff6a10','#ffd23a','#ff2a00'],1,{angle:rand(-.25,.25),spread:.05,spd:rand(500,800),size:rand(8,16),life:.8,shape:'puff',drag:1.5});return P0},
  laser(q,C,P0){C.laser=q;cOnce('l',()=>tone({f:1400,f2:300,type:'sawtooth',dur:1.6,vol:.08,lp:3000}));return P0},
  glitch(q,C,P0){P0.glitch=true;if(Math.random()<.1){P0.x+=rand(-40,40);CSFX.beep()}return P0},
  sweat(q,C,P0){P0.x+=(Math.random()-.5)*6;if(Math.random()<.25)burst(CX+rand(-80,80),OUTY-60,'#bfe8ff',1,{angle:rand(-2.6,-.5),spread:.2,spd:200,grav:700,shape:'drop',size:5,life:1});return P0},
  float(q,C,P0){P0.y+=Math.sin(q*TAU*1.5)*18-10;C.beam=Math.max(C.beam||0,.6);if(Math.random()<.2)burst(CX+rand(-150,150),OUTY+rand(-100,100),'#fff3a0',1,{spd:30,shape:'star',size:6,life:1});return P0},
  orbit(q,C,P0){P0.orbit=q;return P0},
  beep(q,C,P0){if(Math.floor(q*6)!==C.lastBeep){C.lastBeep=Math.floor(q*6);CSFX.beep();float(C.lastBeep%2?_t("BIP"):_t("BOP"),CX+rand(-200,200),OUTY-rand(80,160),{size:36,col:'#7af0ff',life:.7})}P0.y+=Math.sin(q*TAU*3)*6;return P0},
  party(q,C,P0){P0.y-=Math.abs(Math.sin(q*TAU*3))*40;cOnce('p',()=>{CSFX.horn();burst(CX,OUTY,['#ff4d6d','#ffd23a','#4dff88','#3ad4ff','#c08bff'],70,{spd:600,size:7,life:1.6,grav:500,shape:'rect'})});return P0}
};

/* ---------- ambience ---------- */
function cutAmbience(fx,dt,C){
  const r=Math.random;
  switch(fx){
    case 'embers':if(r()<.6)burst(rand(0,W),H+10,['#ff6a10','#ffd23a'],1,{angle:-Math.PI/2,spread:.4,spd:rand(80,200),size:rand(2,4),life:3,drag:0});break;
    case 'snow':if(r()<.7)burst(rand(-100,W),-10,'#ffffff',1,{angle:Math.PI/2+.3,spread:.2,spd:rand(60,140),size:rand(2,5),life:6,drag:0});break;
    case 'bubbles':if(r()<.4)burst(rand(0,W),H+10,'rgba(200,240,255,.7)',1,{angle:-Math.PI/2,spread:.2,spd:rand(60,140),size:rand(3,9),life:5,drag:0});break;
    case 'stars':if(r()<.3)burst(rand(0,W),rand(0,H*.7),'#ffffff',1,{spd:0,size:rand(3,6),life:1.2,shape:'star'});break;
    case 'confetti':if(r()<.5)burst(rand(0,W),-10,['#ff4d6d','#ffd23a','#4dff88','#3ad4ff','#c08bff'],1,{angle:Math.PI/2,spread:.4,spd:rand(120,220),size:6,life:5,drag:0,shape:'rect'});break;
    case 'hearts':if(r()<.15)burst(rand(0,W),H+10,'#ff8ac4',1,{angle:-Math.PI/2,spread:.3,spd:100,size:14,life:6,drag:0,shape:'heart'});break;
    case 'slime':if(r()<.25)burst(rand(0,W),-5,'rgba(140,255,60,.8)',1,{angle:Math.PI/2,spread:.05,spd:rand(150,300),size:5,life:3,drag:0,shape:'drop'});break;
    case 'sparkle':if(r()<.25)burst(CX+rand(-260,260),OUTY+rand(-160,160),'#fff3a0',1,{spd:10,size:rand(5,9),life:.9,shape:'star'});break;
    case 'rain':for(let i=0;i<3;i++)burst(rand(0,W+200),-10,'rgba(170,200,255,.6)',1,{angle:Math.PI/2+.25,spread:0,spd:900,size:2,life:1,drag:0,shape:'streak'});if(r()<.01){C.flash=.5;CSFX.zap()}break;
    case 'smoke':if(r()<.2)burst(rand(0,W),H,'rgba(150,140,120,.5)',1,{angle:-Math.PI/2,spread:.3,spd:40,size:40,life:3,shape:'puff',drag:.2});break;
  }
}
function drawShapeExtra(p,a){
  const s=p.size;
  if(p.shape==='heart'){ctx.fillStyle=p.col;ctx.beginPath();ctx.moveTo(p.x,p.y+s*.6);ctx.bezierCurveTo(p.x-s*1.2,p.y-s*.2,p.x-s*.5,p.y-s,p.x,p.y-s*.35);ctx.bezierCurveTo(p.x+s*.5,p.y-s,p.x+s*1.2,p.y-s*.2,p.x,p.y+s*.6);ctx.fill()}
  else if(p.shape==='note'){circ(p.x,p.y,s*.45,p.col);line([[p.x+s*.4,p.y],[p.x+s*.4,p.y-s*1.4],[p.x+s*.9,p.y-s*1.1]],p.col,Math.max(2,s*.15))}
  else if(p.shape==='rect'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.life*8+p.x);ctx.fillStyle=p.col;ctx.fillRect(-s,-s*.45,s*2,s*.9);ctx.restore()}
  else if(p.shape==='streak'){line([[p.x,p.y],[p.x-p.vx*.03,p.y-p.vy*.03]],p.col,s)}
  else circ(p.x,p.y,s*Math.sqrt(a),p.col);
}

/* ---------- update & draw ---------- */
function updCut(dt){
  const C=CS; if(!C)return; C.t+=dt;
  C.shake=Math.max(0,C.shake-dt*28); C.flash=Math.max(0,C.flash-dt*2.2);
  if(C.bolt){C.bolt.t-=dt;if(C.bolt.t<=0)C.bolt=null}
  const t=C.t,sp=C.spec;
  let P0;
  if(t<CUT_T.ent)P0={x:CX,y:RY+140,s:1,rot:0,sq:1,a:0,inBowl:true};
  else if(t<CUT_T.act)P0=ENT[sp.e]?ENT[sp.e]((t-CUT_T.ent)/(CUT_T.act-CUT_T.ent),C):cPose({});
  else if(t<CUT_T.title){P0=cPose({eating:sp.e==='butt'});P0=(ACT[sp.a]||ACT.wave)((t-CUT_T.act)/(CUT_T.title-CUT_T.act),C,P0,dt)}
  else{const k=ease.out(clamp((t-CUT_T.title)/.5,0,1));P0=cPose({y:OUTY-70*k+Math.sin(t*2)*6,s:1-.12*k});C.zoom=lerp(C.zoom,1,dt*3)}
  C.pose=P0;
  if(t>CUT_T.ent)cutAmbience(sp.fx,dt,C);
  if(t>=CUT_T.act+.15&&!C.said){C.said=true;speakLine(sp.line,sp.p)}
  if(t>=CUT_T.title)cOnce('title',()=>{const r=VARS[C.vk].r;sfx.reveal(Math.max(r,MUT_BY[C.mk].i));burst(CX,OUTY,[RAR[r].col,'#ffffff'],50,{spd:460,size:6,life:1.4,shape:'star'})});
  updFx(dt);
  if(t>=CUT_T.end)endCutscene();
}
function cutToilet(b,front){
  ctx.save(); ctx.translate(TOI.tx,TOI.ty); ctx.scale(TOI.s,TOI.s);
  const c=b.toilet;
  if(!front){
    drawToiletFor(b);
    ell(270,505,118,22,'#2a6f93'); ell(262,501,90,12,'rgba(160,220,240,.35)');
  }else{
    ctx.beginPath(); ctx.ellipse(270,508,140,34,0,0,Math.PI); ctx.ellipse(270,505,118,22,0,Math.PI,0,true); ctx.closePath();
    ctx.fillStyle=shade(c,.2); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.lineWidth=2; ctx.stroke();
  }
  ctx.restore();
}
function drawFood(kind,x,y,s,bite){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  if(kind==='cheese'){poly([[-40,20],[40,20],[40,-10],[-40,-30]],'#ffd23a');for(const [cx,cy,r] of[[-15,0,6],[12,6,5],[25,-6,4]])circ(cx,cy,r,'#e0a800')}
  else if(kind==='beans'){ell(0,10,46,18,'#f4f4f4');for(let i=0;i<9;i++)ell(-26+(i%5)*13,4+Math.floor(i/5)*8,7,5,'#5a2e18',i)}
  else if(kind==='choc'){rr(-36,-24,72,48,6);ctx.fillStyle='#4a2410';ctx.fill();ctx.strokeStyle='#2a1208';ctx.lineWidth=3;for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(-36+i*24,-24);ctx.lineTo(-36+i*24,24);ctx.stroke()}}
  else{ell(0,-12,44,22,'#d8963a');ell(0,0,46,8,'#7ad02a');rr(-44,2,88,12,5);ctx.fillStyle='#6a3418';ctx.fill();ell(0,18,42,12,'#d8963a');for(let i=0;i<5;i++)circ(-24+i*12,-20,2,'#fff3c4')}
  if(bite>0){ctx.globalCompositeOperation='destination-out';for(let i=0;i<Math.min(bite,4);i++)circ(-40+i*8,-10+i*6,16,'#000');ctx.globalCompositeOperation='source-over'}
  ctx.restore();
}
function drawCutChar(C,p){
  const r=R0*p.s;
  if(p.a<=0||r<1)return;
  ctx.save(); ctx.globalAlpha=clamp(p.a,0,1); ctx.translate(p.x,p.y); ctx.rotate(p.rot||0); ctx.scale(1+(1-(p.sq||1))*.7,p.sq||1);
  if(p.eyesOnly){ctx.restore();ctx.save();ctx.globalAlpha=clamp(p.a,0,1);ctx.shadowColor='#ffffff';ctx.shadowBlur=20;ell(p.x-30,p.y-18,13,20,'#ffffff',.3);ell(p.x+30,p.y-18,13,20,'#ffffff',-.3);ctx.restore();return}
  if(p.glitch){ctx.globalAlpha*=.6;drawVariant(-8,0,r,C.vk,C.mk,{glow:0,f:C.f,badge:false});drawVariant(8,0,r,C.vk,C.mk,{glow:0,f:C.f,badge:false})}
  drawVariant(0,0,r,C.vk,C.mk,{glow:1.1,f:C.f,badge:false,noHat:p.noHat});
  if(p.tint){ctx.globalCompositeOperation='source-atop';ctx.fillStyle=p.tint;ctx.fillRect(-r*1.5,-r*1.5,r*3,r*3);ctx.globalCompositeOperation='source-over'}
  if(p.noHat&&C.vk==='exu'){ctx.save();ctx.translate(r*.4*(p.hat||0),-r*.7*(p.hat||0));ctx.rotate(-(p.hat||0)*.6);drawFedora(0,0,r);ctx.restore()}
  if(p.hand!=null){ctx.save();ctx.translate(r*1.05,-r*.1);ctx.rotate(-.6+p.hand*.5);line([[0,0],[r*.35,-r*.35]],VARS[C.vk].col[2],r*.1);circ(r*.4,-r*.42,r*.16,VARS[C.vk].col[1]);ctx.restore()}
  if(p.food)drawFood(p.food,r*.95,r*.25,r/100*1.2,p.bite||0);
  if(p.shine)star4(-r*.3,-r*.1,r*.25*Math.abs(Math.sin(S.time*4)),'#ffffff');
  if(p.orbit!=null)for(let i=0;i<4;i++){const a=S.time*2+i*TAU/4;circ(Math.cos(a)*r*1.6,Math.sin(a)*r*.5,r*.12,i%2?'#e6e6ff':'#fff3a0')}
  ctx.restore();
}
function drawButt(C){
  const p=C.butt; if(p==null||p>.82)return;
  const skin=cosItem('skin',P.eq.skin).col,open=p<.3?Math.sin(p*60)*4:clamp((p-.3)/.2,0,1)*70,drop=p>.7?(p-.7)*1400:0;
  ctx.save(); ctx.translate(0,-drop);
  for(const s of[-1,1]){const g=ctx.createRadialGradient(CX+s*(150+open)-40,-20,20,CX+s*(150+open),40,260);g.addColorStop(0,shade(skin,.15));g.addColorStop(1,shade(skin,-.15));ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(CX+s*(150+open),40,250,230,0,0,TAU);ctx.fill()}
  if(open>4){ctx.fillStyle='#3a0a0a';ctx.beginPath();ctx.ellipse(CX,200,open*.9,22+open*.2,0,0,TAU);ctx.fill();for(let i=0;i<4;i++)ell(CX-open*.5+i*open*.33,210+(i%2)*6,6,10,'#c41a1a')}
  ctx.strokeStyle='rgba(120,60,40,.45)';ctx.lineWidth=5;for(const s of[-1,1]){ctx.beginPath();ctx.arc(CX+s*(150+open),40,235,s<0?.15:Math.PI-.75,s<0?.75:Math.PI-.15);ctx.stroke()}
  if(p<.55)txt(p<.3?_t("*força*"):'SPLURT!',CX,330,p<.3?30:54,p<.3?'#ffffff':'#ff4d5e');
  ctx.restore();
}
function drawCut(){
  const C=CS; if(!C)return;
  const t=C.t,sp=C.spec,b=bathOf(P.eq.bath),p=C.pose;
  ctx.save();
  const sh=C.shake>0&&!RM?C.shake:0;
  ctx.translate(640+(Math.random()-.5)*sh,380+(Math.random()-.5)*sh); ctx.scale(C.zoom,C.zoom); ctx.translate(-640,-380);
  drawBathroomBG(b);
  const dim=clamp(t/.5,0,1)*(.45+(sp.fx==='dark'?.35:0))+(C.dark?C.dark*.4:0);
  ctx.fillStyle=`rgba(0,0,0,${Math.min(.92,dim)})`; ctx.fillRect(0,0,W,H);
  const g=ctx.createRadialGradient(CX,OUTY,40,CX,OUTY,520); g.addColorStop(0,`rgba(255,250,230,${.22*(1-(C.dark||0))})`); g.addColorStop(1,'rgba(255,250,230,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  if(C.tint){ctx.fillStyle=C.tint;ctx.fillRect(0,0,W,H)}
  if(C.red){ctx.fillStyle=`rgba(180,0,20,${C.red})`;ctx.fillRect(0,0,W,H)}
  if(sp.fx==='holy'||C.beam){ctx.save();const k=C.beam||.7;const bg=ctx.createLinearGradient(CX,0,CX,RY);bg.addColorStop(0,`rgba(255,250,210,${.55*k})`);bg.addColorStop(1,'rgba(255,250,210,0)');ctx.fillStyle=bg;ctx.beginPath();ctx.moveTo(CX-90,0);ctx.lineTo(CX+90,0);ctx.lineTo(CX+220,RY);ctx.lineTo(CX-220,RY);ctx.closePath();ctx.fill();ctx.restore()}
  if(sp.fx==='matrix'){ctx.font='900 18px ui-monospace,Consolas,monospace';ctx.textAlign='center';for(let i=0;i<48;i++){ctx.fillStyle=`rgba(57,255,122,${.15+(i%3)*.1})`;ctx.fillText(((i+Math.floor(S.time*8))%2)?'1':'0',(i*27)%W,((i*71+S.time*180)%H))}}
  if(C.disco){for(let i=0;i<6;i++){ctx.fillStyle=`hsla(${(S.time*120+i*60)%360},100%,60%,.12)`;ctx.beginPath();ctx.arc(CX+Math.cos(S.time*1.5+i)*400,300+Math.sin(S.time*2+i)*150,140,0,TAU);ctx.fill()}}
  if(C.portal){const k=C.portal;ctx.save();ctx.translate(CX,OUTY);ctx.rotate(S.time*3);for(let i=0;i<4;i++){ctx.strokeStyle=sp.c||'#c08bff';ctx.globalAlpha=.6-i*.12;ctx.lineWidth=10-i*2;ctx.beginPath();ctx.ellipse(0,0,(150-i*22)*k,(150-i*22)*k*.9,i,0,Math.PI*1.6);ctx.stroke()}ctx.restore()}
  if(C.trumpets){for(const s of[-1,1]){ctx.save();ctx.translate(CX+s*330,OUTY-40);ctx.scale(s,1);ctx.rotate(-.25);rr(-90,-10,120,20,6);ctx.fillStyle='#e8b830';ctx.fill();ctx.beginPath();ctx.moveTo(30,-10);ctx.lineTo(80,-34);ctx.lineTo(80,34);ctx.lineTo(30,10);ctx.closePath();ctx.fill();ctx.fillStyle='#d42a2a';ctx.fillRect(-60,10,60,40);ctx.restore()}}
  cutToilet(b,false);
  if(C.ice){ctx.save();ctx.globalAlpha=.85;const k=C.ice;for(let i=0;i<7;i++){const a=-Math.PI+i/6*Math.PI,h=(80+(i%3)*50)*k;poly([[CX+Math.cos(a)*120-24,RY],[CX+Math.cos(a)*120,RY-h],[CX+Math.cos(a)*120+24,RY]],i%2?'#dff6ff':'#a8daff')}ctx.restore()}
  ctx.save();
  if(p.inBowl){ctx.beginPath();ctx.rect(0,0,W,RY);ctx.ellipse(CX,RY,147,28,0,0,Math.PI);ctx.clip()}
  drawCutChar(C,p);
  ctx.restore();
  cutToilet(b,true);
  if(C.laser){const q=C.laser,a=-.5+q*1.2;ctx.save();ctx.shadowColor='#ff2a3a';ctx.shadowBlur=20;for(const s of[-1,1])line([[p.x+s*28,p.y-12],[p.x+s*28+Math.cos(a)*1400*s,p.y-12+Math.sin(a)*900]],'#ff6a7a',8);ctx.restore()}
  if(C.bolt){ctx.save();ctx.shadowColor='#ffffff';ctx.shadowBlur=20;let x=C.bolt.x,y=0;ctx.strokeStyle=sp.zc||'#ffe23a';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,y);while(y<RY){y+=rand(40,80);x+=rand(-50,50);ctx.lineTo(x,y)}ctx.stroke();ctx.restore()}
  if(C.ring){for(let i=0;i<3;i++){const k=(C.ring*2+i/3)%1;ctx.strokeStyle=`rgba(255,255,255,${.5*(1-k)})`;ctx.lineWidth=6;ctx.beginPath();ctx.arc(p.x,p.y,R0+k*400,0,TAU);ctx.stroke()}}
  drawButt(C);
  drawFx();
  ctx.restore();
  if(C.flash>0){ctx.fillStyle=`rgba(255,255,255,${Math.min(.9,C.flash)})`;ctx.fillRect(0,0,W,H)}
  // speech bubble
  if(t>=CUT_T.act+.1&&t<CUT_T.title){
    const n=Math.min(sp.line.length,Math.floor((t-CUT_T.act-.1)*30)),s=sp.line.slice(0,n);
    ctx.font='900 26px Nunito,"Segoe UI",sans-serif'; const tw=Math.min(560,Math.max(120,ctx.measureText(sp.line).width+40));
    const bx=clamp(p.x+120,40,W-tw-40),by=clamp(p.y-230,90,400);
    rr(bx,by,tw,62,22); ctx.fillStyle='#fffdf4'; ctx.fill(); poly([[bx+40,by+58],[bx+20,by+96],[bx+80,by+58]],'#fffdf4');
    txt(s,bx+20,by+31,26,'#2a1a10',{align:'left',font:'b',stroke:false});
  }
  // title card
  if(t>=CUT_T.title){
    const k=ease.out(clamp((t-CUT_T.title)/.45,0,1)),V=VARS[C.vk],R=RAR[V.r],M=MUT_BY[C.mk];
    const y0=478;ctx.save();ctx.translate((1-k)*-W,0);
    const gb=ctx.createLinearGradient(0,y0,W,y0);gb.addColorStop(0,'rgba(8,24,21,.95)');gb.addColorStop(.5,shade(R.col,-.55));gb.addColorStop(1,'rgba(8,24,21,.95)');
    ctx.fillStyle=gb;ctx.fillRect(0,y0,W,172);ctx.fillStyle=R.col;ctx.fillRect(0,y0,W,5);ctx.fillRect(0,y0+167,W,5);
    txt(C.replay?_t("CUTSCENE"):_t("NOVA VERITY!"),W/2,y0+28,20,'#86e0c8',{font:'b'});
    txt(fullName(C.vk,C.mk,C.f),W/2,y0+76,64,C.f?FUSE[C.f].col:C.mk!=='none'?M.col:R.col);
    txt(`${R.name} ${stars(V.r)}`+(V.abil?'  ·  '+abilText(V.abil):''),W/2,y0+128,20,'#ffffff',{font:'b'});
    ctx.restore();
  }
  // letterbox
  const lb=70*Math.min(ease.out(clamp(t/.4,0,1)),1-ease.in(clamp((t-(CUT_T.end-.35))/.35,0,1)));
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,lb);ctx.fillRect(0,H-lb,W,lb);
  if(lb>40)txt(_t("clique pra pular"),W-24,H-lb/2,14,'rgba(255,255,255,.6)',{align:'right',font:'b',stroke:false});
}

/* ======================= marmita roulette ======================= */
let GA=null;
function startGacha(box,item,isNew,after){
  const pool=marmitaPool(box),reel=[];for(let i=0;i<34;i++)reel.push(i===28?item.v:pick(pool).k);
  GA={box,item,isNew,after,t:0,reel,lastTick:-1,done:false};
  S.parts=[];S.floats=[];showOnly(null);$('results').hidden=true;S.mode='gacha';CSFX.rumble();
}
const GA_SPIN=3.4;
function updGacha(dt){
  const G=GA;if(!G)return;G.t+=dt;
  const pos=gaPos(G);const idx=Math.floor(pos+.5);if(idx!==G.lastTick&&G.t>.9&&G.t<GA_SPIN+.9){G.lastTick=idx;tone({f:900+idx*8,type:'square',dur:.03,vol:.05,lp:3000})}
  if(G.t>=GA_SPIN+.9&&!G.done){G.done=true;const r=VARS[G.item.v].r;sfx.reveal(Math.max(r,MUT_BY[G.item.m].i));burst(CX,380,[RAR[r].col,'#ffffff'],60,{spd:520,size:7,life:1.4,shape:'star'})}
  updFx(dt);
  if(G.t>=GA_SPIN+2.8){const g=GA;GA=null;if(g.isNew)startCutscene(g.item.v,g.item.m,0,g.after);else if(g.after)g.after()}
}
function gaPos(G){const u=clamp((G.t-.9)/GA_SPIN,0,1);return ease.out(u)*28}
function drawGacha(){
  const G=GA;if(!G)return;const M=MARMITAS.find(m=>m.k===G.box)||MARMITAS[0];
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#1a0f22');bg.addColorStop(1,'#0c2421');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  for(let i=0;i<12;i++){ctx.save();ctx.translate(CX,380);ctx.rotate(S.time*.2+i*TAU/12);ctx.fillStyle='rgba(255,210,31,.04)';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(900,-80);ctx.lineTo(900,80);ctx.closePath();ctx.fill();ctx.restore()}
  // the box
  const open=clamp((G.t-.55)/.35,0,1),sh=G.t<.55?Math.sin(G.t*60)*6:0;
  ctx.save();ctx.translate(CX+sh,170);rr(-120,-40,240,90,14);ctx.fillStyle=M.col;ctx.fill();ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=4;ctx.stroke();
  txt(M.name.toUpperCase(),0,6,24,'#ffffff');
  ctx.save();ctx.translate(0,-40-open*120);ctx.rotate(-open*.8);rr(-128,-22,256,26,10);ctx.fillStyle=shade(M.col,.25);ctx.fill();ctx.restore();ctx.restore();
  if(G.t>.6)cOnce2(G,'pop',()=>{sfx.plop();burst(CX,150,['#ffffff','#ffd23a'],30,{spd:400,size:5,life:1,shape:'star'})});
  // reel
  if(G.t>.8){
    const pos=gaPos(G);ctx.save();rr(40,300,W-80,160,20);ctx.fillStyle='rgba(0,0,0,.45)';ctx.fill();ctx.clip();
    for(let i=Math.max(0,Math.floor(pos)-6);i<Math.min(G.reel.length,Math.floor(pos)+7);i++){const x=CX+(i-pos)*150,k=VARS[G.reel[i]];const near=Math.max(0,1-Math.abs(i-pos));
      rr(x-64,316,128,128,16);ctx.fillStyle=`rgba(255,255,255,${.04+near*.08})`;ctx.fill();ctx.strokeStyle=RAR[k.r].col;ctx.lineWidth=3;ctx.stroke();
      drawVariant(x,384,36+near*8,G.reel[i],i===28&&G.done?G.item.m:'none',{glow:.4,badge:false,t:1})}
    ctx.restore();poly([[CX-14,292],[CX+14,292],[CX,312]],'#ffd23a');poly([[CX-14,468],[CX+14,468],[CX,448]],'#ffd23a');
  }
  if(G.done){const V=VARS[G.item.v],R=RAR[V.r];txt(fullName(G.item.v,G.item.m),CX,540,52,G.item.m!=='none'?MUT_BY[G.item.m].col:R.col);txt(`${R.name} ${stars(V.r)}`+(G.isNew?_t(" · NOVA!"):''),CX,590,22,'#ffffff',{font:'b'})}
  drawFx();
}
function cOnce2(o,k,fn){o.once=o.once||{};if(!o.once[k]){o.once[k]=1;fn()}}
