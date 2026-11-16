'use strict';
/* ===== content: power, pet abilities, fusion, worlds, bosses and the Verities that live in them ===== */
RAR.push({k:'divino',name:'Divino',col:'#fff1a8'});
const POW_BY_RAR=[10,18,30,55,100,180,320];
const MUT_POW={none:1,bronze:1.3,ouro:1.6,diamante:2,platina:2.5,galaxy:3.2,hacker:4,plineos:5,god:8};
const FUSE=[{name:'',val:1,pow:1},{name:'Dourada',val:5.5,pow:2.5,col:'#ffd23a'},{name:'Arco-íris',val:35,pow:6,col:'#ff7ad9'}];
const pct=v=>Math.round(v*100)+'%';
const ABIL={
  speed:{name:'Pressa',txt:v=>`+${pct(v)} de velocidade no trono`},
  xp:{name:'Estudiosa',txt:v=>`+${pct(v)} de XP`},
  zone:{name:'Mira',txt:v=>`+${pct(v)} de largura na faixa verde`},
  comfort:{name:'Barriga Forte',txt:v=>`-${pct(v)} de dano no conforto`},
  door:{name:'Tranca',txt:v=>`+${v.toFixed(1).replace('.',',')}s pra responder a porta`},
  mutluck:{name:'Sorte Mutante',txt:v=>`+${pct(v)} de chance de mutação`},
  varluck:{name:'Sorte Rara',txt:v=>`+${pct(v)} de sorte de variante`},
  dmg:{name:'Força Bruta',txt:v=>`+${pct(v)} de dano nos chefes`},
  regen:{name:'Fibra Extra',txt:v=>`+${Math.round(v)} de conforto por fibra`},
  all:{name:'Bênção',txt:v=>`+${pct(v)} em tudo`}
};
const abilText=a=>a?`${ABIL[a[0]].name}: ${ABIL[a[0]].txt(a[1])}`:'';
Object.assign(VARS.verity,{abil:['speed',.05]});Object.assign(VARS.larpity,{abil:['xp',.1]});
Object.assign(VARS.falsity,{abil:['zone',.06]});Object.assign(VARS.obesity,{abil:['comfort',.1]});
Object.assign(VARS.lovity,{abil:['regen',2]});Object.assign(VARS.cruelty,{abil:['dmg',.1]});
Object.assign(VARS.moggity,{abil:['zone',.12]});Object.assign(VARS.eclipse,{abil:['mutluck',.15]});
Object.assign(VARS.lord,{abil:['dmg',.25]});Object.assign(VARS.exu,{abil:['door',1]});

/* New Verities are drawn from parts: eyes + mouth + accessories. w = world, b = boss that drops it. */
const NEW_VARS={
  azedity:{name:'Azedity',r:1,base:250,w:2,col:['#f4ffb0','#b6e83a','#6a9a10'],eyes:'squint',mouth:'pucker',acc:['leaf'],abil:['comfort',.08]},
  gastrity:{name:'Gastrity',r:2,base:450,w:2,col:['#d8ffd0','#5ccf6a','#227a33'],eyes:'dots',mouth:'open',acc:['bubbles'],abil:['speed',.08]},
  dragonity:{name:'Dragonity',r:3,base:1100,w:2,col:['#ffb0a0','#e0402a','#7a1408'],eyes:'angry',mouth:'fangs',acc:['horns','smoke'],abil:['dmg',.15]},
  ratity:{name:'Ratity',r:1,base:260,w:3,col:['#e4e4e8','#9a9aa6','#55555f'],eyes:'dots',mouth:'buck',acc:['ears','whiskers'],abil:['door',.4]},
  lodity:{name:'Lodity',r:2,base:480,w:3,col:['#c8b090','#7a5a32','#3a2810'],eyes:'sleepy',mouth:'flat',acc:['drips'],abil:['regen',2]},
  radiativity:{name:'Radiativity',r:3,base:1300,w:3,col:['#eaffb0','#8cff2a','#3a9a00'],glow:'160,255,60',eyes:'glow',mouth:'grin',acc:['radiation'],abil:['mutluck',.2]},
  picolity:{name:'Picolity',r:1,base:280,w:4,col:['#ffe0f0','#ff8ac4','#c0407a'],eyes:'happy',mouth:'tongue',acc:['stick'],abil:['zone',.08]},
  geladity:{name:'Geladity',r:2,base:520,w:4,col:['#eaf8ff','#8fd0f5','#3a7aaa'],glow:'180,230,255',eyes:'dots',mouth:'frown',acc:['frost','scarf'],abil:['comfort',.15]},
  yetity:{name:'Yetity',r:4,base:2800,w:4,col:['#ffffff','#e6eef5','#a9b8c6'],glow:'220,240,255',eyes:'big',mouth:'fangs',acc:['fur','horns'],abil:['dmg',.3]},
  ardity:{name:'Ardity',r:1,base:300,w:5,col:['#ffd0a0','#ff8a3a','#b84a08'],eyes:'x',mouth:'tongue',acc:['sweat'],abil:['xp',.15]},
  pimentity:{name:'Pimentity',r:2,base:560,w:5,col:['#ff9a90','#e8231a','#8a0a04'],glow:'255,60,40',eyes:'angry',mouth:'smile',acc:['pepper'],abil:['speed',.12]},
  magmity:{name:'Magmity',r:3,base:1500,w:5,col:['#ffd070','#ff6a10','#5a1404'],glow:'255,120,30',eyes:'glow',mouth:'grin',acc:['cracks','fire'],abil:['dmg',.2]},
  alienity:{name:'Alienity',r:2,base:600,w:6,col:['#d8ffd0','#6ee05a','#2a7a1a'],eyes:'three',mouth:'smile',acc:['antenna'],abil:['varluck',.15]},
  astronauty:{name:'Astronauty',r:3,base:1600,w:6,col:['#fff8c4','#ffd726','#d69500'],eyes:'dots',mouth:'smile',acc:['helmet'],abil:['comfort',.2]},
  lunity:{name:'Lunity',r:4,base:3200,w:6,col:['#f4f4f0','#c9c9c0','#7a7a72'],glow:'220,220,255',eyes:'sleepy',mouth:'smile',acc:['craters'],abil:['mutluck',.3]},
  bugity:{name:'Bugity',r:2,base:650,w:7,col:['#e0d0ff','#9a6aff','#4a2a9a'],eyes:'pixel',mouth:'zigzag',acc:['glitch'],abil:['door',.6]},
  robotity:{name:'Robotity',r:3,base:1700,w:7,col:['#e6edf5','#9aa8b8','#4a5664'],glow:'180,220,255',eyes:'pixel',mouth:'grill',acc:['bolts','antenna1'],abil:['zone',.15]},
  matrixity:{name:'Matrixity',r:4,base:3600,w:7,col:['#3a4a3a','#0c140c','#000000'],glow:'60,255,120',ink:'#39ff7a',eyes:'shades',mouth:'flat',acc:['code'],abil:['varluck',.3]},
  anjity:{name:'Anjity',r:3,base:1800,w:8,col:['#ffffff','#f0f0ff','#b8b8d8'],glow:'255,250,220',eyes:'happy',mouth:'smile',acc:['wings','halo'],abil:['regen',4]},
  zeusity:{name:'Zeusity',r:4,base:4000,w:8,col:['#e8f0ff','#9ab8ff','#3a5aa8'],glow:'160,200,255',eyes:'angry',mouth:'beard',acc:['lightning'],abil:['dmg',.4]},
  divinity:{name:'Divinity',r:6,base:25000,w:8,col:['#ffffff','#fff1a8','#e0b020'],glow:'255,245,180',eyes:'star',mouth:'smile',acc:['radiant','halo'],abil:['all',.1]},
  rolhity:{name:'Rolhity',r:2,base:600,b:1,col:['#f0d8b0','#c89a60','#7a5520'],eyes:'angry',mouth:'frown',acc:['cork'],abil:['comfort',.12]},
  aziaty:{name:'Aziaty',r:3,base:1400,b:2,col:['#c8ffa0','#7ad02a','#2a6a08'],eyes:'angry',mouth:'fire',acc:['horns'],abil:['dmg',.2]},
  mutanty:{name:'Mutanty',r:4,base:3000,b:3,col:['#e0ffb0','#a0e040','#4a7a10'],glow:'160,255,60',eyes:'three',mouth:'fangs',acc:['ears','radiation'],abil:['mutluck',.25]},
  icebergity:{name:'Icebergity',r:4,base:3400,b:4,col:['#ffffff','#bfe6ff','#5aa0d8'],glow:'190,230,255',eyes:'glow',mouth:'flat',acc:['frost','crystal'],abil:['zone',.2]},
  reipimentity:{name:'Rei Pimentity',r:5,base:7000,b:5,col:['#ff9a90','#e8231a','#8a0a04'],glow:'255,60,40',eyes:'angry',mouth:'grin',acc:['pepper','crown'],abil:['speed',.2]},
  polvity:{name:'Polvity',r:5,base:7500,b:6,col:['#f0c8ff','#b45ae0','#5a1a80'],glow:'200,120,255',eyes:'big',mouth:'smile',acc:['tentacles'],abil:['door',1.2]},
  virusity:{name:'Virusity',r:5,base:8000,b:7,col:['#ffb0b0','#ff2a3a','#6a0008'],glow:'255,40,60',eyes:'pixel',mouth:'zigzag',acc:['spikes','glitch'],abil:['varluck',.4]},
  entupity:{name:'Entupity',r:6,base:30000,b:8,col:['#fff1c0','#c8a050','#6a4a10'],glow:'255,220,120',eyes:'glow',mouth:'grin',acc:['crown','radiant'],abil:['dmg',.5]}
};
for(const [k,v] of Object.entries(NEW_VARS)){VARS[k]={...v,gen:true,glow:v.glow||v.col[1].replace(/^#(..)(..)(..)$/,(m,a,b,c)=>`${parseInt(a,16)},${parseInt(b,16)},${parseInt(c,16)}`)};VAR_ORDER.push(k)}

/* Bosses are drawn like giant Verities; they are registered as hidden VARS so the same renderer draws them. */
const BOSSES=[
  {key:'chefe1',name:'Prisão de Ventre',drop:'rolhity',rec:30,special:'none',desc:'O chefe de treino. Só empurrar firme.',col:['#c8a070','#7a5228','#3a2408'],eyes:'angry',mouth:'frown',acc:['cork']},
  {key:'chefe2',name:'Dragão Azia',drop:'aziaty',rec:80,special:'fast',desc:'A faixa verde corre muito mais rápido.',col:['#c8ffa0','#4a9a2a','#1a4a08'],eyes:'angry',mouth:'fangs',acc:['horns','smoke']},
  {key:'chefe3',name:'Rato Mutante',drop:'mutanty',rec:160,special:'heal',desc:'Ele se cura sempre que você sai da faixa verde.',col:['#e0ffb0','#8ab04a','#3a5010'],eyes:'three',mouth:'buck',acc:['ears','whiskers','radiation']},
  {key:'chefe4',name:'Iceberg Entalado',drop:'icebergity',rec:300,special:'shrink',desc:'A faixa verde fica bem estreita.',col:['#ffffff','#a8daff','#3a7ab8'],eyes:'angry',mouth:'frown',acc:['frost','crystal']},
  {key:'chefe5',name:'Rei Pimentão',drop:'reipimentity',rec:520,special:'strain',desc:'A veia da testa enche bem mais rápido.',col:['#ff9a90','#d81a10','#6a0404'],eyes:'angry',mouth:'grin',acc:['pepper','crown']},
  {key:'chefe6',name:'Polvo Alienígena',drop:'polvity',rec:850,special:'knocks',desc:'Os tentáculos batem na porta sem parar.',col:['#f0c8ff','#9a3ad0','#4a0a70'],eyes:'big',mouth:'fangs',acc:['tentacles','antenna']},
  {key:'chefe7',name:'Vírus.exe',drop:'virusity',rec:1300,special:'invert',desc:'De tempos em tempos os controles invertem.',col:['#ffb0b0','#e01a2a','#5a0008'],eyes:'pixel',mouth:'zigzag',acc:['spikes','glitch']},
  {key:'chefe8',name:'O Grande Entupimento',drop:'entupity',rec:2000,special:'final',desc:'A faixa pula, ele se cura e a porta não para. Tudo junto.',col:['#fff1c0','#a87a30','#4a3008'],eyes:'glow',mouth:'grin',acc:['crown','radiant','drips']}
].map((b,i)=>({...b,world:i+1,hp:Math.round((b.rec*.1+10)*1.25*25),limit:50}));
for(const b of BOSSES)VARS[b.key]={name:b.name,r:5,base:0,col:b.col,eyes:b.eyes,mouth:b.mouth,acc:b.acc,gen:true,hidden:true,glow:'255,80,60'};

/* Worlds: palette for the intestine, special obstacle, difficulty and exclusive Verities ([key, min comfort, weight]). */
const WORLDS=[
  {name:'Intestino',sub:'Onde tudo começa.',special:null,pal:{bg:'#3d0d1b',tube:'#c24d68',wall:'#7a1d36',blob:'rgba(110,25,50,.35)',light:'rgba(255,175,190,.16)',fold:'rgba(95,15,42,.45)'},pool:[]},
  {name:'Estômago do Dragão',sub:'Ácido pra todo lado.',special:'acido',pal:{bg:'#132b0e',tube:'#6aa83a',wall:'#2f5a17',blob:'rgba(40,90,20,.4)',light:'rgba(220,255,150,.15)',fold:'rgba(20,60,10,.45)'},pool:[['azedity',0,55],['gastrity',50,35],['dragonity',85,12]]},
  {name:'Esgoto Radioativo',sub:'Barris brilhantes aumentam a sorte de mutação.',special:'radio',pal:{bg:'#14181a',tube:'#4d5a45',wall:'#22291f',blob:'rgba(120,255,60,.08)',light:'rgba(150,255,90,.12)',fold:'rgba(10,20,8,.5)'},pool:[['ratity',0,55],['lodity',50,35],['radiativity',85,12]]},
  {name:'Intestino Congelado',sub:'Gelo deixa tudo escorregadio.',special:'gelo',pal:{bg:'#0e2238',tube:'#8fc4e8',wall:'#3d6f9a',blob:'rgba(200,230,255,.12)',light:'rgba(255,255,255,.2)',fold:'rgba(40,80,120,.45)'},pool:[['picolity',0,55],['geladity',50,35],['yetity',88,10]]},
  {name:'Vulcão de Pimenta',sub:'Pimenta dá turbo, mas arde.',special:'pimenta',pal:{bg:'#2a0a04',tube:'#d5592a',wall:'#7a2108',blob:'rgba(255,90,20,.15)',light:'rgba(255,220,120,.18)',fold:'rgba(90,20,5,.5)'},pool:[['ardity',0,55],['pimentity',50,35],['magmity',85,12]]},
  {name:'Intestino Espacial',sub:'Asteroides flutuando.',special:'asteroide',pal:{bg:'#0a0820',tube:'#4a3a8a',wall:'#221a50',blob:'rgba(140,120,255,.12)',light:'rgba(200,180,255,.15)',fold:'rgba(15,10,40,.5)'},pool:[['alienity',0,55],['astronauty',50,35],['lunity',88,10]]},
  {name:'Dimensão Hacker',sub:'Bugs invertem os controles.',special:'bug',pal:{bg:'#020a04',tube:'#0f3a1a',wall:'#1fbf55',blob:'rgba(60,255,120,.08)',light:'rgba(60,255,120,.12)',fold:'rgba(30,200,90,.35)'},pool:[['bugity',0,55],['robotity',50,35],['matrixity',88,10]]},
  {name:'Trono dos Deuses',sub:'Um pouco de cada perigo.',special:'mix',pal:{bg:'#cfc6ff',tube:'#fff6d6',wall:'#d9b84a',blob:'rgba(255,255,255,.35)',light:'rgba(255,255,255,.3)',fold:'rgba(200,160,60,.4)'},pool:[['anjity',0,60],['zeusity',70,30],['divinity',97,4]]}
].map((w,i)=>({...w,n:i+1,boss:BOSSES[i],speed:1+.08*i,dmg:1+.1*i,dense:1-.05*i,bonus:1+.1*i}));
const SPECIALS={acido:'Poça de ácido: tira conforto.',radio:'Barril radioativo: dói, mas aumenta a chance de mutação.',gelo:'Cubo de gelo: você escorrega por 2 segundos.',pimenta:'Pimenta: turbo, mas arde.',asteroide:'Asteroide: se mexe e dói bastante.',bug:'Bug: inverte os controles por um tempo.',mix:'Todos os perigos dos outros mundos.'};
for(const W of WORLDS)for(const [k] of W.pool)VARS[k].hint=`Mundo ${W.n}: ${W.name}`;
for(const B of BOSSES)VARS[B.drop].hint=`Chefe: ${B.name}`;
