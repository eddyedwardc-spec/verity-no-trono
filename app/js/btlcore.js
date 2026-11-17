'use strict';
/* ===== Battle rules (turn-based PvP) =====
   Pure and deterministic: the same seed plus the same list of actions always gives the same fight. Both players'
   games compute the fight on their own and only the chosen actions travel through Firebase.
   Each round, every living Verity acts once, fastest first. On its turn it attacks, defends or uses its skill. */
function seeded(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const easeIn=k=>k*k*k,easeOut=k=>1-Math.pow(1-k,3);
const BTL_N=4,BTL_ROUNDS=15,BTL_VER=1,BTL_TURN_SEC=30;
const ST_INFO={
  stun:{ic:'💫',c:'#ffd21f',bad:1},poison:{ic:'☠',c:'#8cff2a',bad:1},burn:{ic:'🔥',c:'#ff7a2a',bad:1},regen:{ic:'✚',c:'#6fe08a'},
  atkUp:{ic:'⚔',c:'#ff5a5f'},atkDown:{ic:'⚔',c:'#7a8a88',bad:1},defUp:{ic:'🛡',c:'#5fb4ff'},defDown:{ic:'🛡',c:'#7a8a88',bad:1},
  spdUp:{ic:'»',c:'#ffd21f'},spdDown:{ic:'«',c:'#7a8a88',bad:1},dodge:{ic:'💨',c:'#cfe8ff'},taunt:{ic:'🎯',c:'#ff7ad9'},shield:{ic:'◆',c:'#86e0c8'}
};
/* every Verity's skill. tg: who you pick (enemy, ally or nobody). ops run in order:
   dmg (to t/all, m = × attack, pierce ignores defence, steal heals the caster), hits (n random hits), heal/shield (f = share of max life),
   st (status s for n of the target's turns, v = strength), cleanse, revive (else = what happens when nobody is down). */
const D=(to,m,o={})=>({o:'dmg',to,m,...o}),HITS=(n,m)=>({o:'hits',n,m}),HEAL=(to,f)=>({o:'heal',to,f}),SHIELD=(to,f)=>({o:'shield',to,f}),
  STS=(to,s,n,v=0)=>({o:'st',to,s,n,v}),CLEANSE=to=>({o:'cleanse',to});
const SKILLS={
  verity:{n:_t("Sorriso Amarelo"),c:'#ffd726',tg:'enemy',cd:3,ops:[D('t',1.4),STS('self','atkUp',2,.3)]},
  larpity:{n:_t("Larp Larp"),c:'#47f20d',tg:'none',cd:3,ops:[STS('allies','spdUp',2,.3),STS('allies','atkUp',2,.15)]},
  falsity:{n:_t("Ilusão"),c:'#5f8aff',tg:'enemy',cd:3,ops:[STS('self','dodge',2,.5),D('t',1.2)]},
  obesity:{n:_t("Barrigada"),c:'#f5cf3a',tg:'enemy',cd:3,ops:[D('t',1.3),STS('self','taunt',2),STS('self','defUp',2,.35)]},
  lovity:{n:_t("Abraço"),c:'#f79ac2',tg:'ally',cd:3,ops:[HEAL('t',.35),STS('t','regen',2,.06)]},
  cruelty:{n:_t("Maldade Pura"),c:'#ee1111',tg:'enemy',cd:3,ops:[D('t',1.6),STS('t','atkDown',2,.3)]},
  moggity:{n:_t("Olhar Mog"),c:'#f0a91c',tg:'none',cd:3,ops:[STS('all','atkDown',2,.25),STS('all','defDown',2,.2)]},
  eclipse:{n:_t("Escuridão"),c:'#7a50c8',tg:'none',cd:3,ops:[D('all',.8),STS('all','spdDown',2,.3),STS('self','dodge',1,.4)]},
  lord:{n:_t("Decreto Real"),c:'#ffd726',tg:'enemy',cd:3,ops:[STS('allies','atkUp',2,.35),D('t',1.3)]},
  exu:{n:_t("Laroyê"),c:'#c81a1a',tg:'none',cd:4,ops:[CLEANSE('allies'),STS('allies','dodge',2,.35)]},
  azedity:{n:_t("Cuspe Ácido"),c:'#b6e83a',tg:'enemy',cd:3,ops:[D('t',1.1),STS('t','defDown',2,.3)]},
  gastrity:{n:_t("Refluxo"),c:'#5ccf6a',tg:'enemy',cd:3,ops:[D('t',.8),STS('t','poison',3,.12)]},
  dragonity:{n:_t("Bafo de Dragão"),c:'#ff7a2a',tg:'none',cd:4,ops:[D('all',.9),STS('all','burn',2,.08)]},
  ratity:{n:_t("Mordida de Rato"),c:'#9a8a7a',tg:'none',cd:3,ops:[HITS(3,.55)]},
  lodity:{n:_t("Lamaçal"),c:'#6a5a30',tg:'enemy',cd:3,ops:[D('t',.9),STS('t','spdDown',2,.4)]},
  radiativity:{n:_t("Radiação"),c:'#8cff2a',tg:'none',cd:4,ops:[STS('all','poison',3,.08)]},
  picolity:{n:_t("Cérebro Congelado"),c:'#9ad8ff',tg:'enemy',cd:4,ops:[D('t',.7),STS('t','stun',1)]},
  geladity:{n:_t("Escudo de Gelo"),c:'#bfe6ff',tg:'none',cd:3,ops:[SHIELD('allies',.2)]},
  yetity:{n:_t("Avalanche"),c:'#e0f4ff',tg:'none',cd:4,ops:[D('all',1.1),STS('all','spdDown',1,.3)]},
  ardity:{n:_t("Ardência"),c:'#ff5a2a',tg:'enemy',cd:3,ops:[D('t',.8),STS('t','burn',3,.15)]},
  pimentity:{n:_t("Turbo Picante"),c:'#e8231a',tg:'enemy',cd:3,ops:[STS('self','spdUp',2,.5),STS('self','atkUp',2,.3),D('t',1)]},
  magmity:{n:_t("Erupção"),c:'#ff8a10',tg:'none',cd:4,ops:[D('all',1.2)]},
  alienity:{n:_t("Abdução"),c:'#7aff9a',tg:'enemy',cd:4,ops:[D('t',.6),STS('t','stun',1)]},
  astronauty:{n:_t("Gravidade Zero"),c:'#cfe8ff',tg:'none',cd:3,ops:[STS('allies','dodge',2,.3)]},
  lunity:{n:_t("Luz da Lua"),c:'#e8e8ff',tg:'none',cd:4,ops:[HEAL('allies',.2),STS('allies','regen',2,.06)]},
  bugity:{n:_t("Bug no Sistema"),c:'#39ff7a',tg:'enemy',cd:3,ops:[STS('t','atkDown',2,.4),STS('t','spdDown',2,.3),D('t',.6)]},
  robotity:{n:_t("Canhão Laser"),c:'#ff3a3a',tg:'enemy',cd:3,ops:[D('t',1.9,{pierce:1})]},
  matrixity:{n:_t("Câmera Lenta"),c:'#39ff7a',tg:'none',cd:3,ops:[STS('self','dodge',2,.7),STS('self','atkUp',2,.4)]},
  anjity:{n:_t("Asas Curadoras"),c:'#fff6c0',tg:'none',cd:3,ops:[HEAL('allies',.25)]},
  zeusity:{n:_t("Raio Divino"),c:'#ffe23a',tg:'enemy',cd:3,ops:[D('t',2.2,{pierce:1})]},
  divinity:{n:_t("Milagre"),c:'#fff1a8',tg:'none',cd:5,ops:[{o:'revive',f:.4,else:HEAL('allies',.3)}]},
  feijonity:{n:_t("Feijão Nutritivo"),c:'#8a5a30',tg:'none',cd:3,ops:[HEAL('self',.3),STS('self','defUp',2,.35)]},
  gasosity:{n:_t("Nuvem de Gás"),c:'#b8c060',tg:'none',cd:4,ops:[STS('all','poison',3,.1)]},
  pantanity:{n:_t("Pântano"),c:'#4a6a30',tg:'none',cd:3,ops:[D('all',.6),STS('all','spdDown',2,.4)]},
  chocolity:{n:_t("Calda Grudenta"),c:'#8a5030',tg:'enemy',cd:4,ops:[D('t',.5),STS('t','stun',1)]},
  brigadeity:{n:_t("Festa de Brigadeiro"),c:'#6a3a18',tg:'none',cd:3,ops:[HEAL('allies',.15),STS('allies','atkUp',2,.2)]},
  trufity:{n:_t("Trufa Explosiva"),c:'#c89060',tg:'enemy',cd:3,ops:[D('t',1.6),D('all',.4)]},
  faiscity:{n:_t("Faíscas"),c:'#ffe060',tg:'none',cd:3,ops:[HITS(4,.38)]},
  voltity:{n:_t("Choque"),c:'#ffe020',tg:'enemy',cd:4,ops:[D('t',1.3),STS('t','stun',1)]},
  trovity:{n:_t("Tempestade"),c:'#a8c0ff',tg:'none',cd:4,ops:[D('all',1),STS('all','spdDown',1,.3)]},
  abismity:{n:_t("Queda no Abismo"),c:'#7a4aff',tg:'enemy',cd:3,ops:[D('t',1.5),STS('t','defDown',2,.4)]},
  vazity:{n:_t("Vácuo"),c:'#5a3a8a',tg:'enemy',cd:3,ops:[D('t',.8),STS('t','atkDown',2,.5)]},
  infinity:{n:_t("Loop Infinito"),c:'#b07aff',tg:'enemy',cd:3,ops:[D('t',.9),D('t',.9),STS('allies','spdUp',2,.2)]},
  rolhity:{n:_t("Tampão"),c:'#c89a5a',tg:'none',cd:3,ops:[STS('self','taunt',2),SHIELD('self',.4)]},
  aziaty:{n:_t("Azia"),c:'#a8ff3a',tg:'none',cd:4,ops:[STS('all','burn',3,.1)]},
  mutanty:{n:_t("Mutação"),c:'#a0e040',tg:'none',cd:4,ops:[STS('self','atkUp',3,.6),STS('self','regen',3,.08)]},
  icebergity:{n:_t("Iceberg"),c:'#bfe6ff',tg:'none',cd:4,ops:[SHIELD('allies',.3),STS('allies','defUp',2,.25)]},
  reipimentity:{n:_t("Fúria Picante"),c:'#e8231a',tg:'none',cd:4,ops:[D('all',1.3),STS('all','burn',2,.08)]},
  polvity:{n:_t("Oito Braços"),c:'#b45ae0',tg:'none',cd:4,ops:[HITS(8,.27)]},
  virusity:{n:_t("Infecção"),c:'#ff2a3a',tg:'none',cd:4,ops:[STS('all','poison',3,.12),STS('all','atkDown',2,.2)]},
  entupity:{n:_t("O Grande Entupimento"),c:'#c8a050',tg:'none',cd:5,ops:[STS('all','stun',1),D('all',.5)]},
  reifeijity:{n:_t("Banquete de Feijão"),c:'#8a4a28',tg:'none',cd:4,ops:[HEAL('allies',.3),STS('allies','regen',2,.08)]},
  baronity:{n:_t("Suborno"),c:'#c89060',tg:'enemy',cd:3,ops:[D('t',1.1,{steal:1}),STS('t','atkDown',2,.3)]},
  choquity:{n:_t("Alta Tensão"),c:'#ffe020',tg:'none',cd:4,ops:[D('all',1.2),STS('all','spdDown',2,.25)]},
  nadity:{n:_t("Nada"),c:'#b48cff',tg:'enemy',cd:4,ops:[D('t',2.8,{pierce:1})]},
  festivity:{n:_t("Chuva de Confete"),c:'#7af0ff',tg:'none',cd:3,ops:[STS('allies','atkUp',2,.25),STS('allies','spdUp',2,.25)]},
  abobority:{n:_t("Doces ou Travessuras"),c:'#ff8a10',tg:'enemy',cd:3,ops:[D('t',1.2),STS('t','poison',3,.1)]},
  papaiverity:{n:_t("Presentes"),c:'#e0303a',tg:'none',cd:4,ops:[HEAL('allies',.2),SHIELD('allies',.15)]},
  carnavality:{n:_t("Bloco na Rua"),c:'#ff4fd0',tg:'none',cd:3,ops:[STS('allies','spdUp',2,.4),STS('allies','dodge',2,.2)]},
  caipirity:{n:_t("Quadrilha"),c:'#f5c83a',tg:'none',cd:3,ops:[CLEANSE('allies'),HEAL('allies',.15)]},
  fantasmity:{n:_t("Assombração"),c:'#cfc8ff',tg:'none',cd:4,ops:[STS('all','atkDown',2,.35),STS('self','dodge',2,.6)]},
  infernity:{n:_t("Chamas do Inferno"),c:'#e8231a',tg:'none',cd:4,ops:[D('all',1.5),STS('all','burn',3,.12)]},
  caosity:{n:_t("Caos Total"),c:'#19e6c8',tg:'none',cd:4,ops:[HITS(6,.45),STS('all','spdDown',1,.3)]},
  eternity:{n:_t("Eternidade"),c:'#ffd23a',tg:'none',cd:5,ops:[{o:'revive',f:.6,else:HEAL('allies',.35)},STS('allies','atkUp',2,.2)]},
  albuquerque:{n:_t("Língua de Fora"),c:'#ff3dc8',tg:'none',cd:5,ops:[STS('all','stun',1),D('all',.8),STS('allies','atkUp',2,.3)]}
};
const SKILL_DEFAULT={n:_t("Golpe Especial"),c:'#ffffff',tg:'enemy',cd:3,ops:[D('t',1.6)]};
const skillOf=v=>SKILLS[v]||SKILL_DEFAULT;

/* plain-language description, built from the ops */
const pc=v=>Math.round(v*100)+'%';
function skillDesc(sk,f=0){
  const b=1+.15*f,al=sk.tg==='ally';
  const who={t:al?_t("um aliado"):_t("o alvo"),all:_t("todos os inimigos"),self:_t("ela mesma"),allies:_t("todos os aliados")};
  const em={t:al?_t("num aliado"):_t("no alvo"),all:_t("em todos os inimigos"),self:_t("nela mesma"),allies:_t("em todos os aliados")};
  const de={t:al?_t("de um aliado"):_t("do alvo"),all:_t("de todos os inimigos"),self:_t("dela mesma"),allies:_t("de todos os aliados")};
  const pra={t:al?_t("pra um aliado"):_t("pro alvo"),all:_t("pra todos os inimigos"),self:_t("pra ela mesma"),allies:_t("pra todos os aliados")};
  const turns=n=>n>1?_t("por {0} turnos",n):_t("por 1 turno");
  const stTxt=op=>{const v=op.s==='poison'||op.s==='burn'||op.s==='regen'?op.v*b:op.v;switch(op.s){
    case 'stun':return _t("atordoa {0}",who[op.to])+' '+turns(op.n);
    case 'taunt':return _t("provoca: os inimigos têm que atacar ela")+' '+turns(op.n);
    case 'poison':return _t("envenena {0}: {1} da vida por turno",who[op.to],pc(v))+', '+turns(op.n);
    case 'burn':return _t("queima {0}: {1} da vida por turno",who[op.to],pc(v))+', '+turns(op.n);
    case 'regen':return _t("regenera {0} da vida por turno {1}",pc(v),em[op.to])+', '+turns(op.n);
    default:return({atkUp:_t("+{0} de ataque {1}"),atkDown:_t("−{0} de ataque {1}"),defUp:_t("+{0} de defesa {1}"),defDown:_t("−{0} de defesa {1}"),spdUp:_t("+{0} de velocidade {1}"),spdDown:_t("−{0} de velocidade {1}"),dodge:_t("{0} de esquiva {1}")})[op.s].replace('{0}',pc(v)).replace('{1}',em[op.to])+' '+turns(op.n);
  }};
  const one=op=>{switch(op.o){
    case 'dmg':return _t("{0} de dano {1}",pc(op.m*b),em[op.to])+(op.pierce?_t(" (ignora defesa)"):'')+(op.steal?_t(" e cura o mesmo tanto"):'');
    case 'hits':return _t("{0} golpes de {1} em inimigos aleatórios",op.n,pc(op.m*b));
    case 'heal':return _t("cura {0} da vida {1}",pc(op.f*b),de[op.to]);
    case 'shield':return _t("escudo de {0} da vida {1}",pc(op.f*b),pra[op.to]);
    case 'st':return stTxt(op);
    case 'cleanse':return _t("tira os efeitos ruins {0}",de[op.to]);
    case 'revive':return _t("revive um aliado caído com {0} da vida (se ninguém caiu: {1})",pc(op.f*b),one(op.else));
  }};
  const s=sk.ops.map(one).join(', ');return s.charAt(0).toUpperCase()+s.slice(1)+'.';
}
/* ---------- state ---------- */
function btlUnit(it,side,slot){
  const V=VARS[it.v]||VARS.verity,f=it.f||0,pw=itemPower({v:it.v,m:it.m,f,lvl:it.lvl||1}),a=V.abil||[];
  const luck=(a[0]==='mutluck'||a[0]==='varluck'?a[1]:0)+(a[0]==='all'?a[1]:0);
  return{id:side*10+slot,side,slot,it:{v:it.v,m:it.m,f,lvl:it.lvl||1},name:fullName(it.v,it.m,f),pw,max:Math.round(100+pw*10),hp:0,
    atk:pw*3,spd:100+(V.r||0)*6+(a[0]==='speed'?a[1]*120:0)+(a[0]==='all'?a[1]*40:0),crit:Math.min(.4,.1+luck*.5),sk:skillOf(it.v),boost:1+.15*f,cd:1,st:[],def:false,alive:true};
}
function btlNew(teamA,teamB,seed){
  const S={seed:seed>>>0,n:0,round:0,queue:[],cur:null,over:false,win:-1,by:'',units:[]};
  teamA.slice(0,BTL_N).forEach((it,i)=>S.units.push(btlUnit(it,0,i)));teamB.slice(0,BTL_N).forEach((it,i)=>S.units.push(btlUnit(it,1,i)));
  for(const u of S.units)u.hp=u.max;
  S.pre=btlAdvance(S); return S;
}
const bU=(S,id)=>S.units.find(u=>u.id===id);
const bAlive=(S,side)=>S.units.filter(u=>u.side===side&&u.alive);
const stV=(u,s)=>{const x=u.st.find(e=>e.s===s);return x?x.v||1:0};
const effSpd=u=>u.spd*(1+stV(u,'spdUp')-stV(u,'spdDown'));
function addSt(u,s,n,v){const x=u.st.find(e=>e.s===s);if(x){x.n=Math.max(x.n,n);x.v=Math.max(x.v,v)}else u.st.push({s,n,v})}
function btlCheckEnd(S,ev){
  for(const s of[0,1])if(!bAlive(S,s).length&&!S.over){S.over=true;S.win=1-s;S.by='ko';S.cur=null;ev.push({k:'end',win:S.win,by:'ko'})}
  return S.over;
}
// moves to the next Verity that can act; start-of-turn effects (poison, burn, regen, stun) happen here
function btlAdvance(S){
  const ev=[];
  while(!S.over){
    if(!S.queue.length){
      S.round++;
      if(S.round>BTL_ROUNDS){const left=s=>bAlive(S,s).reduce((t,u)=>t+u.hp/u.max,0);S.over=true;S.win=left(0)>=left(1)?0:1;S.by='rounds';S.cur=null;ev.push({k:'end',win:S.win,by:'rounds'});break}
      S.queue=S.units.filter(u=>u.alive).sort((a,b)=>effSpd(b)-effSpd(a)||a.id-b.id).map(u=>u.id);ev.push({k:'round',r:S.round});
    }
    const u=bU(S,S.queue.shift()); if(!u||!u.alive)continue;
    u.def=false;
    for(const e of u.st){
      if(e.s==='poison'||e.s==='burn'){const d=Math.max(1,Math.round(u.max*e.v));u.hp=Math.max(0,u.hp-d);ev.push({k:'tick',t:u.id,s:e.s,d,hp:u.hp});if(u.hp<=0){u.alive=false;ev.push({k:'ko',t:u.id});break}}
      if(e.s==='regen'){const h=Math.round(u.max*e.v);u.hp=Math.min(u.max,u.hp+h);ev.push({k:'tick',t:u.id,s:'regen',h,hp:u.hp})}
    }
    if(btlCheckEnd(S,ev))break;
    if(!u.alive)continue;
    if(u.st.some(e=>e.s==='stun')){u.st=u.st.filter(e=>e.s!=='stun');ev.push({k:'stunned',u:u.id});btlEndTurn(u,false);continue}
    S.cur=u.id; ev.push({k:'turn',u:u.id}); break;
  }
  return ev;
}
function btlEndTurn(u,usedSkill){
  for(const e of u.st)e.n--; u.st=u.st.filter(e=>e.n>0);
  u.cd=usedSkill?u.sk.cd:Math.max(0,u.cd-1);
}
// which targets an action may pick (taunt forces single-target enemy actions onto the taunter)
function btlTargets(S,u,kind){
  const foes=bAlive(S,1-u.side),taunt=foes.filter(f=>f.st.some(e=>e.s==='taunt'));
  if(kind==='atk')return(taunt.length?taunt:foes).map(f=>f.id);
  if(kind==='skill'){if(u.sk.tg==='enemy')return(taunt.length?taunt:foes).map(f=>f.id);if(u.sk.tg==='ally')return bAlive(S,u.side).map(f=>f.id)}
  return[];
}
// what a player who doesn't answer in time (or a disconnected one) does: skill when ready, else attack the weakest
function btlAuto(S){
  const u=bU(S,S.cur); if(!u)return null;
  const low=ids=>ids.map(i=>bU(S,i)).reduce((a,b)=>a.hp/a.max<=b.hp/b.max?a:b).id;
  if(u.cd===0){const ts=btlTargets(S,u,'skill');if(u.sk.tg==='none')return{u:u.id,k:'skill'};if(ts.length)return{u:u.id,k:'skill',t:low(ts)}}
  const ts=btlTargets(S,u,'atk'); return{u:u.id,k:'atk',t:ts.length?low(ts):null};
}
function btlValid(S,a){
  const u=bU(S,S.cur); if(!u||!a||a.u!==u.id)return false;
  if(a.k==='def')return true;
  if(a.k==='skill'&&u.cd>0)return false;
  if(a.k!=='atk'&&a.k!=='skill')return false;
  if(a.k==='skill'&&u.sk.tg==='none')return true;
  return btlTargets(S,u,a.k).includes(a.t);
}
/* one action: returns the events to animate */
function btlAct(S,a){
  if(S.over)return[];
  if(!btlValid(S,a))a=btlAuto(S);
  const u=bU(S,S.cur),R=seeded((S.seed^Math.imul(S.n+1,2654435761))>>>0),ev=[{k:'act',u:u.id,a:a.k,t:a.t??null,auto:!!a.auto}];
  const foes=()=>bAlive(S,1-u.side),mine=()=>bAlive(S,u.side);
  const hit=(t,m,o={})=>{
    if(!t||!t.alive)return;
    if(!o.pierce&&stV(t,'dodge')&&R()<stV(t,'dodge')){ev.push({k:'miss',s:u.id,t:t.id});return}
    const crit=R()<u.crit;
    let d=u.atk*m*(o.boost??1)*(1+stV(u,'atkUp')-stV(u,'atkDown'))*(.92+R()*.16)*(crit?1.5:1);
    if(!o.pierce){if(t.def)d*=.5;d*=(1-stV(t,'defUp'))*(1+stV(t,'defDown'))}
    d=Math.max(1,Math.round(d)); let abs=0;
    const sh=t.st.find(e=>e.s==='shield'); if(sh){abs=Math.min(sh.v,d);sh.v-=abs;d-=abs;if(sh.v<=0)t.st=t.st.filter(e=>e!==sh)}
    t.hp=Math.max(0,t.hp-d); ev.push({k:'dmg',s:u.id,t:t.id,d,abs,crit,hp:t.hp,def:t.def&&!o.pierce});
    if(o.steal&&d>0){u.hp=Math.min(u.max,u.hp+d);ev.push({k:'heal',t:u.id,h:d,hp:u.hp})}
    if(t.hp<=0){t.alive=false;t.st=[];ev.push({k:'ko',t:t.id})}
  };
  const pickTo=(to,t)=>to==='t'?[t].filter(Boolean):to==='all'?foes():to==='self'?[u]:to==='allies'?mine():[];
  const run=(op,t)=>{
    const b=u.boost;
    switch(op.o){
      case 'dmg':for(const x of pickTo(op.to,t))hit(x,op.m,{boost:b,pierce:op.pierce,steal:op.steal});break;
      case 'hits':for(let i=0;i<op.n;i++){const f=foes();if(!f.length)break;hit(f[Math.floor(R()*f.length)],op.m,{boost:b})}break;
      case 'heal':for(const x of pickTo(op.to,t)){if(!x.alive)continue;const h=Math.round(x.max*op.f*b);x.hp=Math.min(x.max,x.hp+h);ev.push({k:'heal',t:x.id,h,hp:x.hp})}break;
      case 'shield':for(const x of pickTo(op.to,t)){if(!x.alive)continue;const v=Math.round(u.max*op.f*b);addSt(x,'shield',99,v);ev.push({k:'shield',t:x.id,v})}break;
      case 'st':for(const x of pickTo(op.to,t)){if(!x.alive)continue;const v=op.s==='poison'||op.s==='burn'||op.s==='regen'?op.v*b:op.v;addSt(x,op.s,op.n+(x===u&&op.s!=='stun'?1:0),v);ev.push({k:'st',t:x.id,s:op.s,n:op.n})}break;
      case 'cleanse':for(const x of pickTo(op.to,t)){const before=x.st.length;x.st=x.st.filter(e=>!(ST_INFO[e.s]&&ST_INFO[e.s].bad));if(x.st.length<before)ev.push({k:'cleanse',t:x.id})}break;
      case 'revive':{const down=S.units.filter(x=>x.side===u.side&&!x.alive);if(down.length){const x=down.reduce((p,q)=>p.pw>=q.pw?p:q);x.alive=true;x.hp=Math.round(x.max*op.f*b);x.st=[];ev.push({k:'revive',t:x.id,hp:x.hp})}else run(op.else,t);break}
    }
  };
  if(a.k==='def'){u.def=true;ev.push({k:'defend',u:u.id})}
  else if(a.k==='atk')hit(bU(S,a.t),1);
  else{ev.push({k:'skill',u:u.id,sk:u.sk});const t=a.t!=null?bU(S,a.t):null;for(const op of u.sk.ops){run(op,t);if(!foes().length)break}}
  btlEndTurn(u,a.k==='skill'); S.n++; S.cur=null;
  if(!btlCheckEnd(S,ev))ev.push(...btlAdvance(S));
  return ev;
}
// rebuilds a fight from its seed and action list (used to catch up and to check results)
function btlReplay(teamA,teamB,seed,acts){const S=btlNew(teamA,teamB,seed);for(const a of acts||[]){if(S.over)break;btlAct(S,a)}return S}
