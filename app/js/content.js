'use strict';
/* ===== content: power, pet abilities, fusion, 12 regions × 5 worlds, bosses, and the Verities that live in them ===== */
RAR.push({k:'divino',name:_t("Divino"),col:'#fff1a8'});
const POW_BY_RAR=[10,18,30,55,100,180,320];
const MUT_POW={none:1,bronze:1.3,ouro:1.6,diamante:2,platina:2.5,galaxy:3.2,hacker:4,plineos:5,god:8};
const FUSE=[{name:'',val:1,pow:1},{name:_t("Dourada"),val:5.5,pow:2.5,col:'#ffd23a'},{name:_t("Arco-íris"),val:35,pow:6,col:'#ff7ad9'}];
const pct=v=>Math.round(v*100)+'%';
const ABIL={
  speed:{name:_t("Pressa"),txt:v=>_t("+{0} de velocidade no trono",pct(v))},
  xp:{name:_t("Estudiosa"),txt:v=>_t("+{0} de XP",pct(v))},
  zone:{name:_t("Mira"),txt:v=>_t("+{0} de largura na faixa verde",pct(v))},
  comfort:{name:_t("Barriga Forte"),txt:v=>_t("-{0} de dano no conforto",pct(v))},
  door:{name:_t("Tranca"),txt:v=>_t("+{0}s pra responder a porta",v.toFixed(1).replace('.',DEC))},
  mutluck:{name:_t("Sorte Mutante"),txt:v=>_t("+{0} de chance de mutação",pct(v))},
  varluck:{name:_t("Sorte Rara"),txt:v=>_t("+{0} de sorte de variante",pct(v))},
  dmg:{name:_t("Força Bruta"),txt:v=>_t("+{0} de dano nos chefes",pct(v))},
  regen:{name:_t("Fibra Extra"),txt:v=>_t("+{0} de conforto por fibra",Math.round(v))},
  income:{name:_t("Renda"),txt:v=>_t("+{0} de renda no Museu",pct(v))},
  all:{name:_t("Bênção"),txt:v=>_t("+{0} em tudo",pct(v))}
};
const abilText=a=>a?`${ABIL[a[0]].name}: ${ABIL[a[0]].txt(a[1])}`:'';
Object.assign(VARS.verity,{abil:['speed',.05]});Object.assign(VARS.larpity,{abil:['xp',.1]});
Object.assign(VARS.falsity,{abil:['zone',.06]});Object.assign(VARS.obesity,{abil:['comfort',.1]});
Object.assign(VARS.lovity,{abil:['regen',2]});Object.assign(VARS.cruelty,{abil:['dmg',.1]});
Object.assign(VARS.moggity,{abil:['zone',.12]});Object.assign(VARS.eclipse,{abil:['mutluck',.15]});
Object.assign(VARS.lord,{abil:['dmg',.25]});Object.assign(VARS.exu,{abil:['door',1]});

/* New Verities are drawn from parts: eyes + mouth + accessories. reg = region, b = region boss that drops it, ev = event. */
const NEW_VARS={
  azedity:{name:_t("Azedity"),r:1,base:250,reg:2,col:['#f4ffb0','#b6e83a','#6a9a10'],eyes:'squint',mouth:'pucker',acc:['leaf'],abil:['comfort',.08]},
  gastrity:{name:'Gastrity',r:2,base:450,reg:2,col:['#d8ffd0','#5ccf6a','#227a33'],eyes:'dots',mouth:'open',acc:['bubbles'],abil:['speed',.08]},
  dragonity:{name:'Dragonity',r:3,base:1100,reg:2,col:['#ffb0a0','#e0402a','#7a1408'],eyes:'angry',mouth:'fangs',acc:['horns','smoke'],abil:['dmg',.15]},
  ratity:{name:'Ratity',r:1,base:260,reg:3,col:['#e4e4e8','#9a9aa6','#55555f'],eyes:'dots',mouth:'buck',acc:['ears','whiskers'],abil:['door',.4]},
  lodity:{name:_t("Lodity"),r:2,base:480,reg:3,col:['#c8b090','#7a5a32','#3a2810'],eyes:'sleepy',mouth:'flat',acc:['drips'],abil:['regen',2]},
  radiativity:{name:'Radiativity',r:3,base:1300,reg:3,col:['#eaffb0','#8cff2a','#3a9a00'],glow:'160,255,60',eyes:'glow',mouth:'grin',acc:['radiation'],abil:['mutluck',.2]},
  picolity:{name:_t("Picolity"),r:1,base:280,reg:4,col:['#ffe0f0','#ff8ac4','#c0407a'],eyes:'happy',mouth:'tongue',acc:['stick'],abil:['zone',.08]},
  geladity:{name:_t("Geladity"),r:2,base:520,reg:4,col:['#eaf8ff','#8fd0f5','#3a7aaa'],glow:'180,230,255',eyes:'dots',mouth:'frown',acc:['frost','scarf'],abil:['comfort',.15]},
  yetity:{name:'Yetity',r:4,base:2800,reg:4,col:['#ffffff','#e6eef5','#a9b8c6'],glow:'220,240,255',eyes:'big',mouth:'fangs',acc:['fur','horns'],abil:['dmg',.3]},
  ardity:{name:_t("Ardity"),r:1,base:300,reg:5,col:['#ffd0a0','#ff8a3a','#b84a08'],eyes:'x',mouth:'tongue',acc:['sweat'],abil:['xp',.15]},
  pimentity:{name:_t("Pimentity"),r:2,base:560,reg:5,col:['#ff9a90','#e8231a','#8a0a04'],glow:'255,60,40',eyes:'angry',mouth:'smile',acc:['pepper'],abil:['speed',.12]},
  magmity:{name:'Magmity',r:3,base:1500,reg:5,col:['#ffd070','#ff6a10','#5a1404'],glow:'255,120,30',eyes:'glow',mouth:'grin',acc:['cracks','fire'],abil:['dmg',.2]},
  alienity:{name:'Alienity',r:2,base:600,reg:6,col:['#d8ffd0','#6ee05a','#2a7a1a'],eyes:'three',mouth:'smile',acc:['antenna'],abil:['varluck',.15]},
  astronauty:{name:'Astronauty',r:3,base:1600,reg:6,col:['#fff8c4','#ffd726','#d69500'],eyes:'dots',mouth:'smile',acc:['helmet'],abil:['comfort',.2]},
  lunity:{name:'Lunity',r:4,base:3200,reg:6,col:['#f4f4f0','#c9c9c0','#7a7a72'],glow:'220,220,255',eyes:'sleepy',mouth:'smile',acc:['craters'],abil:['mutluck',.3]},
  bugity:{name:'Bugity',r:2,base:650,reg:7,col:['#e0d0ff','#9a6aff','#4a2a9a'],eyes:'pixel',mouth:'zigzag',acc:['glitch'],abil:['door',.6]},
  robotity:{name:'Robotity',r:3,base:1700,reg:7,col:['#e6edf5','#9aa8b8','#4a5664'],glow:'180,220,255',eyes:'pixel',mouth:'grill',acc:['bolts','antenna1'],abil:['zone',.15]},
  matrixity:{name:'Matrixity',r:4,base:3600,reg:7,col:['#3a4a3a','#0c140c','#000000'],glow:'60,255,120',ink:'#39ff7a',eyes:'shades',mouth:'flat',acc:['code'],abil:['varluck',.3]},
  anjity:{name:_t("Anjity"),r:3,base:1800,reg:8,col:['#ffffff','#f0f0ff','#b8b8d8'],glow:'255,250,220',eyes:'happy',mouth:'smile',acc:['wings','halo'],abil:['regen',4]},
  zeusity:{name:'Zeusity',r:4,base:4000,reg:8,col:['#e8f0ff','#9ab8ff','#3a5aa8'],glow:'160,200,255',eyes:'angry',mouth:'beard',acc:['lightning'],abil:['dmg',.4]},
  divinity:{name:'Divinity',r:6,base:25000,reg:8,col:['#ffffff','#fff1a8','#e0b020'],glow:'255,245,180',eyes:'star',mouth:'smile',acc:['radiant','halo'],abil:['all',.1]},
  feijonity:{name:_t("Feijonity"),r:1,base:320,reg:9,col:['#a07050','#5a2e18','#2a1208'],eyes:'happy',mouth:'smile',acc:['beans'],abil:['regen',3]},
  gasosity:{name:_t("Gasosity"),r:2,base:700,reg:9,col:['#f0ffb0','#c8e040','#7a9010'],eyes:'squint',mouth:'pucker',acc:['smoke','bubbles'],abil:['speed',.14]},
  pantanity:{name:_t("Pantanity"),r:3,base:1900,reg:9,col:['#a8d0a0','#3a7a4a','#14361e'],eyes:'big',mouth:'fangs',acc:['drips','leaf'],abil:['comfort',.22]},
  chocolity:{name:'Chocolity',r:1,base:350,reg:10,col:['#c89060','#7a4220','#3a1a08'],eyes:'happy',mouth:'tongue',acc:['cocoa'],abil:['income',.1]},
  brigadeity:{name:'Brigadeity',r:2,base:760,reg:10,col:['#8a5a40','#4a2410','#1a0a04'],eyes:'dots',mouth:'smile',acc:['sprinkles'],abil:['income',.2]},
  trufity:{name:_t("Trufity"),r:4,base:4400,reg:10,col:['#f0d0a0','#9a5a2a','#4a2008'],glow:'255,220,160',eyes:'glow',mouth:'grin',acc:['cocoa','crown'],abil:['income',.5]},
  faiscity:{name:_t("Faiscity"),r:2,base:800,reg:11,col:['#ffffb0','#fff23a','#c0a000'],glow:'255,250,120',eyes:'x',mouth:'open',acc:['sparks'],abil:['speed',.16]},
  voltity:{name:'Voltity',r:3,base:2100,reg:11,col:['#d0ffff','#30e0ff','#007a9a'],glow:'80,230,255',eyes:'angry',mouth:'grin',acc:['sparks','antenna'],abil:['dmg',.25]},
  trovity:{name:_t("Trovity"),r:4,base:4800,reg:11,col:['#e0e0ff','#7a7aff','#2a2a8a'],glow:'140,140,255',eyes:'glow',mouth:'fangs',acc:['lightning','sparks'],abil:['dmg',.45]},
  abismity:{name:_t("Abismity"),r:3,base:2400,reg:12,col:['#6a5a8a','#2a1a40','#0a0414'],glow:'150,100,255',ink:'#e0d0ff',eyes:'glow',mouth:'zigzag',acc:['void'],abil:['varluck',.25]},
  vazity:{name:_t("Vazity"),r:4,base:5200,reg:12,col:['#3a3a4a','#101018','#000000'],glow:'120,120,160',ink:'#ffffff',eyes:'glow',mouth:'flat',acc:['void','spikes'],abil:['mutluck',.35]},
  infinity:{name:'Infinity',r:6,base:40000,reg:12,col:['#ffffff','#c8a8ff','#5a2ab8'],glow:'200,170,255',eyes:'star',mouth:'smile',acc:['radiant','void'],abil:['all',.15]},
  rolhity:{name:_t("Rolhity"),r:2,base:600,b:1,col:['#f0d8b0','#c89a60','#7a5520'],eyes:'angry',mouth:'frown',acc:['cork'],abil:['comfort',.12]},
  aziaty:{name:_t("Aziaty"),r:3,base:1400,b:2,col:['#c8ffa0','#7ad02a','#2a6a08'],eyes:'angry',mouth:'fire',acc:['horns'],abil:['dmg',.2]},
  mutanty:{name:'Mutanty',r:4,base:3000,b:3,col:['#e0ffb0','#a0e040','#4a7a10'],glow:'160,255,60',eyes:'three',mouth:'fangs',acc:['ears','radiation'],abil:['mutluck',.25]},
  icebergity:{name:'Icebergity',r:4,base:3400,b:4,col:['#ffffff','#bfe6ff','#5aa0d8'],glow:'190,230,255',eyes:'glow',mouth:'flat',acc:['frost','crystal'],abil:['zone',.2]},
  reipimentity:{name:_t("Rei Pimentity"),r:5,base:7000,b:5,col:['#ff9a90','#e8231a','#8a0a04'],glow:'255,60,40',eyes:'angry',mouth:'grin',acc:['pepper','crown'],abil:['speed',.2]},
  polvity:{name:_t("Polvity"),r:5,base:7500,b:6,col:['#f0c8ff','#b45ae0','#5a1a80'],glow:'200,120,255',eyes:'big',mouth:'smile',acc:['tentacles'],abil:['door',1.2]},
  virusity:{name:'Virusity',r:5,base:8000,b:7,col:['#ffb0b0','#ff2a3a','#6a0008'],glow:'255,40,60',eyes:'pixel',mouth:'zigzag',acc:['spikes','glitch'],abil:['varluck',.4]},
  entupity:{name:_t("Entupity"),r:6,base:30000,b:8,col:['#fff1c0','#c8a050','#6a4a10'],glow:'255,220,120',eyes:'glow',mouth:'grin',acc:['crown','radiant'],abil:['dmg',.5]},
  reifeijity:{name:_t("Rei Feijity"),r:5,base:9000,b:9,col:['#a07050','#5a2e18','#2a1208'],eyes:'angry',mouth:'grin',acc:['beans','crown'],abil:['regen',6]},
  baronity:{name:'Baronity',r:5,base:9500,b:10,col:['#c89060','#6a3a18','#2a1208'],eyes:'shades',mouth:'grin',acc:['cocoa','tophat'],abil:['income',.8]},
  choquity:{name:_t("Choquity"),r:5,base:10000,b:11,col:['#ffffd0','#ffe020','#a08000'],glow:'255,240,80',eyes:'glow',mouth:'fangs',acc:['sparks','lightning','crown'],abil:['dmg',.6]},
  nadity:{name:_t("Nadity"),r:6,base:60000,b:12,col:['#2a2a3a','#0a0a12','#000000'],glow:'180,140,255',ink:'#ffffff',eyes:'glow',mouth:'grin',acc:['void','radiant'],abil:['all',.2]},
  festivity:{name:'Festivity',r:4,base:5000,ev:'festa',col:['#ffffff','#7af0ff','#2a8aa8'],eyes:'star',mouth:'tongue',acc:['party','confetti'],abil:['xp',.4]},
  abobority:{name:_t("Abobority"),r:4,base:5000,ev:'halloween',col:['#ffc070','#ff8a10','#a04a00'],glow:'255,160,40',eyes:'tri',mouth:'zigzag',acc:['pumpkin'],abil:['mutluck',.3]},
  papaiverity:{name:_t("Papai Verity"),r:4,base:5000,ev:'natal',col:['#fff8c4','#ffd726','#d69500'],eyes:'happy',mouth:'beard',acc:['santa'],abil:['income',.4]},
  carnavality:{name:'Carnavality',r:4,base:5000,ev:'carnaval',col:['#ffd0ff','#ff4fd0','#9a1080'],eyes:'dots',mouth:'grin',acc:['mask','confetti'],abil:['speed',.25]},
  caipirity:{name:'Caipirity',r:4,base:5000,ev:'junina',col:['#fff3b0','#f5c83a','#b88a10'],eyes:'happy',mouth:'smile',acc:['straw','freckles'],abil:['regen',5]}
};
for(const [k,v] of Object.entries(NEW_VARS)){VARS[k]={...v,gen:true,glow:v.glow||v.col[1].replace(/^#(..)(..)(..)$/,(m,a,b,c)=>`${parseInt(a,16)},${parseInt(b,16)},${parseInt(c,16)}`)};VAR_ORDER.push(k)}

/* Albuquerque: the rarest Verity of all, with a rarity of its own. 1 in 20,000 runs (any world), 1 in 800 Banquetes, or the Upgrader. */
RAR.push({k:'unico',name:_t("Único"),col:'#ff3dc8'});
POW_BY_RAR.push(600);
const ALBU_RUN=1/20000;
VARS.albuquerque={name:'Albuquerque',r:7,base:250000,gen:true,col:['#ffe6d2','#f0b48c','#b87048'],ink:'#3a2014',glow:'255,61,200',eyes:'albu',mouth:'albu',acc:['albuback','albuhair','hoodie'],abil:['all',.35],hint:_t("1 em 20.000 partidas, em qualquer mundo")};
VAR_ORDER.push('albuquerque');

/* The 12 regions. Each has 5 worlds; the last one is the region boss in its final form. */
const REGIONS=[
  {name:_t("Intestino"),sub:_t("Onde tudo começa."),special:null,pal:{bg:'#3d0d1b',tube:'#c24d68',wall:'#7a1d36',blob:'rgba(110,25,50,.35)',light:'rgba(255,175,190,.16)',fold:'rgba(95,15,42,.45)'},pool:[],
    boss:{key:'chefe1',name:_t("Prisão de Ventre"),drop:'rolhity',mod:'none',desc:_t("Uma rolha gigante entalada."),col:['#c8a070','#7a5228','#3a2408'],eyes:'angry',mouth:'frown',acc:['cork']}},
  {name:_t("Estômago do Dragão"),sub:_t("Ácido pra todo lado."),special:'acido',pal:{bg:'#132b0e',tube:'#6aa83a',wall:'#2f5a17',blob:'rgba(40,90,20,.4)',light:'rgba(220,255,150,.15)',fold:'rgba(20,60,10,.45)'},pool:[['azedity',0,55],['gastrity',50,35],['dragonity',85,12]],
    boss:{key:'chefe2',name:_t("Dragão Azia"),drop:'aziaty',mod:'fast',desc:_t("Cospe azia e acelera tudo."),col:['#c8ffa0','#4a9a2a','#1a4a08'],eyes:'angry',mouth:'fangs',acc:['horns','smoke']}},
  {name:_t("Esgoto Radioativo"),sub:_t("Barris brilhantes aumentam a sorte de mutação."),special:'radio',pal:{bg:'#14181a',tube:'#4d5a45',wall:'#22291f',blob:'rgba(120,255,60,.08)',light:'rgba(150,255,90,.12)',fold:'rgba(10,20,8,.5)'},pool:[['ratity',0,55],['lodity',50,35],['radiativity',85,12]],
    boss:{key:'chefe3',name:_t("Rato Mutante"),drop:'mutanty',mod:'heal',desc:_t("Rói o esgoto e se regenera."),col:['#e0ffb0','#8ab04a','#3a5010'],eyes:'three',mouth:'buck',acc:['ears','whiskers','radiation']}},
  {name:_t("Intestino Congelado"),sub:_t("Gelo deixa tudo escorregadio."),special:'gelo',pal:{bg:'#0e2238',tube:'#8fc4e8',wall:'#3d6f9a',blob:'rgba(200,230,255,.12)',light:'rgba(255,255,255,.2)',fold:'rgba(40,80,120,.45)'},pool:[['picolity',0,55],['geladity',50,35],['yetity',88,10]],
    boss:{key:'chefe4',name:_t("Iceberg Entalado"),drop:'icebergity',mod:'shrink',desc:_t("Tão gelado que a faixa encolhe."),col:['#ffffff','#a8daff','#3a7ab8'],eyes:'angry',mouth:'frown',acc:['frost','crystal']}},
  {name:_t("Vulcão de Pimenta"),sub:_t("Pimenta dá turbo, mas arde."),special:'pimenta',pal:{bg:'#2a0a04',tube:'#d5592a',wall:'#7a2108',blob:'rgba(255,90,20,.15)',light:'rgba(255,220,120,.18)',fold:'rgba(90,20,5,.5)'},pool:[['ardity',0,55],['pimentity',50,35],['magmity',85,12]],
    boss:{key:'chefe5',name:_t("Rei Pimentão"),drop:'reipimentity',mod:'strain',desc:_t("Faz a veia da testa ferver."),col:['#ff9a90','#d81a10','#6a0404'],eyes:'angry',mouth:'grin',acc:['pepper','crown']}},
  {name:_t("Intestino Espacial"),sub:_t("Asteroides flutuando."),special:'asteroide',pal:{bg:'#0a0820',tube:'#4a3a8a',wall:'#221a50',blob:'rgba(140,120,255,.12)',light:'rgba(200,180,255,.15)',fold:'rgba(15,10,40,.5)'},pool:[['alienity',0,55],['astronauty',50,35],['lunity',88,10]],
    boss:{key:'chefe6',name:_t("Polvo Alienígena"),drop:'polvity',mod:'knocks',desc:_t("Os tentáculos batem na porta sem parar."),col:['#f0c8ff','#9a3ad0','#4a0a70'],eyes:'big',mouth:'fangs',acc:['tentacles','antenna']}},
  {name:_t("Dimensão Hacker"),sub:_t("Bugs invertem os controles."),special:'bug',pal:{bg:'#020a04',tube:'#0f3a1a',wall:'#1fbf55',blob:'rgba(60,255,120,.08)',light:'rgba(60,255,120,.12)',fold:'rgba(30,200,90,.35)'},pool:[['bugity',0,55],['robotity',50,35],['matrixity',88,10]],
    boss:{key:'chefe7',name:_t("Vírus.exe"),drop:'virusity',mod:'invert',desc:_t("Hackeia os seus controles."),col:['#ffb0b0','#e01a2a','#5a0008'],eyes:'pixel',mouth:'zigzag',acc:['spikes','glitch']}},
  {name:_t("Trono dos Deuses"),sub:_t("Um pouco de cada perigo."),special:'mix',pal:{bg:'#cfc6ff',tube:'#fff6d6',wall:'#d9b84a',blob:'rgba(255,255,255,.35)',light:'rgba(255,255,255,.3)',fold:'rgba(200,160,60,.4)'},pool:[['anjity',0,60],['zeusity',70,30],['divinity',97,4]],
    boss:{key:'chefe8',name:_t("O Grande Entupimento"),drop:'entupity',mod:'jump',desc:_t("A faixa pula pra todo lado."),col:['#fff1c0','#a87a30','#4a3008'],eyes:'glow',mouth:'grin',acc:['crown','radiant','drips']}},
  {name:_t("Pântano do Feijão"),sub:_t("Nuvens de feijão empurram e doem."),special:'feijao',pal:{bg:'#1e1608',tube:'#7a6a30',wall:'#3a2c10',blob:'rgba(160,140,60,.15)',light:'rgba(230,220,140,.14)',fold:'rgba(40,30,10,.5)'},pool:[['feijonity',0,55],['gasosity',50,35],['pantanity',85,12]],
    boss:{key:'chefe9',name:_t("Rei Feijão"),drop:'reifeijity',mod:'knocks',desc:_t("Solta tanto gás que a vizinhança vem bater."),col:['#a07050','#5a2e18','#2a1208'],eyes:'angry',mouth:'grin',acc:['beans','crown']}},
  {name:_t("Fábrica de Chocolate Suspeita"),sub:_t("Chocolate gruda e te deixa lento."),special:'chocolate',pal:{bg:'#1a0c06',tube:'#8a5030',wall:'#3a1a08',blob:'rgba(200,120,60,.12)',light:'rgba(255,210,160,.14)',fold:'rgba(40,15,5,.5)'},pool:[['chocolity',0,55],['brigadeity',50,35],['trufity',88,10]],
    boss:{key:'chefe10',name:_t("Barão do Cacau"),drop:'baronity',mod:'shrink',desc:_t("Melado e exigente: a faixa é minúscula."),col:['#c89060','#6a3a18','#2a1208'],eyes:'shades',mouth:'grin',acc:['cocoa','tophat']}},
  {name:_t("Bexiga Elétrica"),sub:_t("Raios te deixam travado."),special:'raio',pal:{bg:'#0a0a24',tube:'#3a4ac0',wall:'#1a2070',blob:'rgba(120,200,255,.12)',light:'rgba(200,240,255,.18)',fold:'rgba(10,20,80,.5)'},pool:[['faiscity',0,55],['voltity',50,35],['trovity',88,10]],
    boss:{key:'chefe11',name:_t("Bexigão Elétrico"),drop:'choquity',mod:'invert',desc:_t("Dá choque e inverte tudo."),col:['#ffffd0','#ffe020','#a08000'],eyes:'glow',mouth:'fangs',acc:['sparks','lightning']}},
  {name:_t("Abismo Sem Fundo"),sub:_t("Todos os perigos. Sem piedade."),special:'mix2',pal:{bg:'#05030c',tube:'#2a1a4a',wall:'#7a4aff',blob:'rgba(150,100,255,.1)',light:'rgba(200,170,255,.12)',fold:'rgba(120,80,255,.35)'},pool:[['abismity',0,60],['vazity',70,30],['infinity',97,4]],
    boss:{key:'chefe12',name:_t("O Vazio"),drop:'nadity',mod:'heal',desc:_t("O fim de tudo. Se cura, pula, aperta e acelera."),col:['#2a2a3a','#0a0a12','#000000'],ink:'#ffffff',eyes:'glow',mouth:'grin',acc:['void','radiant']}}
].map((R,i)=>({...R,n:i+1}));
for(const R of REGIONS){const b=R.boss;VARS[b.key]={name:b.name,r:5,base:0,col:b.col,eyes:b.eyes,mouth:b.mouth,acc:b.acc,ink:b.ink,gen:true,hidden:true,glow:'255,80,60'}}
const BOSSES=REGIONS.map(R=>R.boss);
const MOD_TXT={fast:_t("a faixa corre rápido"),heal:_t("ele se cura fora da faixa"),shrink:_t("a faixa é estreita"),strain:_t("a veia enche rápido"),knocks:_t("a porta não para"),invert:_t("os controles invertem"),jump:_t("a faixa pula de lugar")};
const ROMAN=['I','II','III','IV','V'];

/* 1.6: four more dimensions after the first 60 worlds (worlds 61–260). Each one revisits 10 regions with new colors,
   stronger bosses and better drops: every region boss drops its Verity with at least the dimension's mutation,
   and the last boss of each dimension drops that dimension's own Verity. */
const DIM_VARS={
  fantasmity:{name:_t("Fantasmity"),r:6,base:80000,b:1,col:['#ffffff','#cfc8ff','#7a6ad8'],ink:'#3a2a7a',eyes:'glow',mouth:'open',acc:['drips','smoke'],abil:['all',.22]},
  infernity:{name:'Infernity',r:6,base:100000,b:1,col:['#ffb0a0','#e8231a','#4a0400'],eyes:'angry',mouth:'fangs',acc:['horns','fire'],abil:['dmg',.9]},
  caosity:{name:_t("Caosity"),r:6,base:130000,b:1,col:['#b0fff0','#19e6c8','#0a5a50'],eyes:'pixel',mouth:'zigzag',acc:['spikes','glitch'],abil:['all',.26]},
  eternity:{name:'Eternity',r:6,base:180000,b:1,col:['#fffbe0','#ffd23a','#b08a00'],eyes:'star',mouth:'smile',acc:['wings','radiant','halo'],abil:['all',.3]}
};
for(const [k,v] of Object.entries(DIM_VARS)){VARS[k]={...v,gen:true,glow:v.col[1].replace(/^#(..)(..)(..)$/,(m,a,b,c)=>`${parseInt(a,16)},${parseInt(b,16)},${parseInt(c,16)}`)};VAR_ORDER.push(k)}
const DIMENSIONS=[
  {n:1,name:_t("Dimensão Original"),short:_t("Original")},
  {n:2,name:_t("Dimensão do Além"),short:_t("Além"),fmt:s=>_t("{0} do Além",s),tint:'#7a5cff',mutMin:'diamante',regs:[1,2,3,4,5,6,7,8,9,12],drop:'fantasmity'},
  {n:3,name:_t("Dimensão do Inferno"),short:_t("Inferno"),fmt:s=>_t("{0} do Inferno",s),tint:'#ff3a1a',mutMin:'platina',regs:[2,3,4,5,6,7,8,10,11,12],drop:'infernity'},
  {n:4,name:_t("Dimensão do Caos"),short:_t("Caos"),fmt:s=>_t("{0} do Caos",s),tint:'#19e6c8',mutMin:'galaxy',regs:[1,3,4,6,7,8,9,10,11,12],drop:'caosity'},
  {n:5,name:_t("Dimensão do Infinito"),short:_t("Infinito"),fmt:s=>_t("{0} do Infinito",s),tint:'#ffd23a',mutMin:'hacker',regs:[2,3,5,6,7,8,9,10,11,12],drop:'eternity'}
];
// blends a palette color (hex or rgba) toward the dimension's tint
function tintCol(c,tint,amt){
  const m=/^rgba?\(([^)]+)\)$/.exec(c),T=hexc(tint);
  if(!m)return mix(c,tint,amt);
  const p=m[1].split(',').map(Number);return `rgba(${p.slice(0,3).map((v,i)=>Math.round(lerp(v,T[i],amt))).join(',')},${p[3]??1})`;
}
for(const R of REGIONS)R.dim=1,R.base=R.n;
for(const D of DIMENSIONS.slice(1))D.regs.forEach((bi,i)=>{
  const B=REGIONS[bi-1],last=i===D.regs.length-1,pal={};
  for(const [k,c] of Object.entries(B.pal))pal[k]=tintCol(c,D.tint,.42);
  REGIONS.push({...B,n:REGIONS.length+1,dim:D.n,base:bi,name:D.fmt(B.name),pal,
    boss:{...B.boss,name:D.fmt(B.boss.name),drop:last?D.drop:B.boss.drop,desc:B.boss.desc}});
});
for(const D of DIMENSIONS){const rs=REGIONS.filter(R=>R.dim===D.n);D.first=rs[0].n;D.last=rs[rs.length-1].n}
const WORLD_CAP=60; // after world 60 the reflexes stop getting harder; only boss power keeps climbing
const recOf=n=>Math.round(30*Math.pow(1.17,Math.min(n,WORLD_CAP)-1)*Math.pow(1.015,Math.max(0,n-WORLD_CAP)));
const WORLDS=[];
REGIONS.forEach((R,ri)=>{for(let f=1;f<=5;f++){
  const n=ri*5+f,rec=recOf(n),bi=R.base-1,D=DIMENSIONS[R.dim-1];
  let mods=[R.boss.mod];
  if(f>=3)mods.push(['fast','shrink','strain','heal'][bi%4]);
  if(f===5)mods.push('jump','knocks');
  if(bi>=8)mods.push('strain');
  mods=[...new Set(mods)].filter(m=>m!=='none');
  const boss={key:R.boss.key,name:f<5?_t("{0} · Fase {1}",R.boss.name,f):_t("{0} · Forma Final",R.boss.name),drop:R.boss.drop,rec,hp:Math.round((rec*.1+10)*1.25*28),limit:45,mods,world:n,region:R.n,fase:f,
    desc:`${R.boss.desc} ${mods.length?_t("Aqui ")+mods.map(m=>MOD_TXT[m]).join(', ')+'.':''}`};
  // gentler curve: speed, obstacles and damage level off early so every world stays playable
  WORLDS.push({n,region:R.n,dim:R.dim,mutMin:D.mutMin||null,fase:f,name:`${R.name} ${ROMAN[f-1]}`,rname:R.name,sub:R.sub,special:R.special,pal:R.pal,pool:R.pool,boss,
    speed:Math.min(1.45,1+.015*(n-1)),dmg:Math.min(2.2,1+.025*(n-1)),dense:Math.max(.85,1-.005*(n-1)),bonus:1+.08*(n-1),
    narrow:Math.max(.8,1-.004*(n-1)),zspeed:Math.min(1.5,1+.012*(n-1)),zwidth:Math.max(.78,1-.005*(n-1))});
}});
const SPECIALS={acido:_t("Poça de ácido: tira conforto."),radio:_t("Barril radioativo: dói, mas aumenta a chance de mutação."),gelo:_t("Cubo de gelo: você escorrega por 2 segundos."),pimenta:_t("Pimenta: turbo, mas arde."),asteroide:_t("Asteroide: se mexe e dói bastante."),bug:_t("Bug: inverte os controles por um tempo."),feijao:_t("Nuvem de feijão: empurra e dói."),chocolate:_t("Chocolate: gruda e te deixa lento."),raio:_t("Raio: choque que trava os controles."),mix:_t("Os perigos das 7 primeiras regiões."),mix2:_t("Todos os perigos que existem.")};
for(const R of REGIONS.filter(R=>R.dim===1))for(const [k] of R.pool)VARS[k].hint=_t("Região {0}: {1}",R.n,R.name);
for(const R of REGIONS.filter(R=>R.dim===1))VARS[R.boss.drop].hint=_t("Chefe: {0} (qualquer fase)",R.boss.name);
for(const D of DIMENSIONS.slice(1))VARS[D.drop].hint=_t("Último chefe da {0} (mundo {1})",D.name,D.last*5);
