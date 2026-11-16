'use strict';
/* ===== ui: menu, panels (collection, shop, market, friends, profile, ranking, settings), dialogs, boot ===== */

/* ---------- toast & modal ---------- */
let toastTimer=null;
function toast(m,ms=2800){const t=$('toast');t.textContent=m;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,ms)}
let MODAL_SEQ=0;
function modal(title,body,actions){
  MODAL_SEQ++;
  $('modalTitle').textContent=title; const b=$('modalBody'); b.textContent='';
  (Array.isArray(body)?body:[body]).forEach(n=>n&&b.append(typeof n==='string'?el('p','small',n):n));
  const a=$('modalActions'); a.textContent='';
  for(const ac of actions){
    const btn=el('button','btn '+(ac.cls||''),ac.label);
    btn.onclick=async()=>{
      if(ac.fn){btn.disabled=true;try{const r=await ac.fn();if(r===false){btn.disabled=false;return}}catch(e){toast(e.message||String(e));sfx.err();btn.disabled=false;return}}
      closeModal();
    };
    a.append(btn);
  }
  $('modal').hidden=false; const f=b.querySelector('input')||a.querySelector('.btn'); if(f)f.focus();
}
function closeModal(){$('modal').hidden=true}
function confirmDo(title,text,label,fn,cls){modal(title,text,[{label,fn,cls},{label:_t("Cancelar"),cls:'ghost'}])}
function act(fn,okMsg,snd='buy'){const e=fn();if(e){toast(e);sfx.err();return false}if(okMsg)toast(okMsg);if(snd)sfx[snd]();return true}

/* ---------- screens & panels ---------- */
const SCREENS=['setup','menu','card1','card2','bossCard','fail','pause'];
function showOnly(id){
  for(const s of SCREENS)$(s).hidden=s!==id;
  $('results').hidden=true; $('pauseBtn').hidden=!(id===null&&playing());
  if(id){const f=$(id).querySelector('.btn');if(f)f.focus({preventScroll:true})}
  else if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
}
const panelStack=[];
const anyPanelOpen=()=>panelStack.length>0;
function openPanel(id,tab){
  audioInit();
  if(!panelStack.includes(id))panelStack.push(id);
  $(id).hidden=false; if(tab)TAB[id]=tab; syncTabs(id); RENDER[id]&&RENDER[id](true);
  const c=$(id).querySelector('[data-close]'); if(c)c.focus({preventScroll:true});
}
function closePanel(id){
  const i=panelStack.indexOf(id); if(i>=0)panelStack.splice(i,1); $(id).hidden=true;
  if(id==='cfg'&&S.paused)$('pResume').focus();
  if(S.mode==='menu'&&!anyPanelOpen())renderMenu();
}
function closeTopPanel(){if(!$('modal').hidden){closeModal();return true}if(panelStack.length){closePanel(panelStack[panelStack.length-1]);return true}return false}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closePanel(b.closest('.panel').id));
const TAB={coll:'mine',shop:'marmitas',diario:'daily',market:'buy',friends:'list',rank:'xp'};
function syncTabs(id){
  const p=$(id);
  p.querySelectorAll('.tab[data-tab]').forEach(t=>t.setAttribute('aria-selected',t.dataset.tab===TAB[id]?'true':'false'));
  p.querySelectorAll('[data-pane]').forEach(pn=>pn.hidden=pn.dataset.pane!==TAB[id]);
}
document.querySelectorAll('.panel').forEach(p=>p.querySelectorAll('.tab[data-tab]').forEach(t=>t.onclick=()=>{TAB[p.id]=t.dataset.tab;syncTabs(p.id);sfx.click();RENDER[p.id]&&RENDER[p.id](true)}));
function updateWallets(){document.querySelectorAll('.wallet').forEach(w=>w.textContent=`${money(P.money)} · ${fmt(P.rolos)} ${ROLO}`)}
const RENDER={};
const ANIM={};
function panelTick(){for(const id of panelStack){if(ANIM[id]&&!$(id).hidden)ANIM[id]()}}
let rerenderQueued=false;
function onProfileChange(){
  if(rerenderQueued)return; rerenderQueued=true;
  requestAnimationFrame(()=>{rerenderQueued=false;updateWallets();if(!$('menu').hidden)renderMenu();for(const id of panelStack)if(id!=='profile'&&RENDER[id])RENDER[id](false)});
}
function onNetChange(){
  updateBadges(); if(!$('menu').hidden)renderMenu(); $('setupNet').textContent=netText();
  for(const id of panelStack)if(['friends','market','rank','cfg'].includes(id)&&RENDER[id])RENDER[id](false);
  if(online()&&!P.username&&(S.mode==='menu'||S.mode==='boot')){$('setupErr').textContent=NET.msg||'';showOnly('setup')}
}
function netText(){
  switch(NET.status){
    case 'online':return _t("Online.");
    case 'conectando':return _t("Conectando ao servidor...");
    case 'erro':return _t("Sem conexão com o servidor: ")+NET.msg+_t(" O jogo continua offline.");
    case 'sem-config':return _t("O modo online ainda não foi configurado. Você joga offline por enquanto.");
    case 'atualizando':return _t("Baixando a versão nova do jogo. O online volta depois que ele reiniciar.");
    case 'web':return _t("No navegador o jogo é offline. Amigos, trocas, mercado e ranking funcionam no app de Windows.");
    default:return _t("Offline.");
  }
}
function updateBadges(){
  const n=NET.reqIn.length,t=NET.tradesIn.filter(x=>x.status==='open').length;
  const fb=$('friendBadge'); fb.hidden=!(n+t); fb.textContent=n+t;
  const tb=$('tradeBadge'); tb.hidden=!t; tb.textContent=t;
}

/* ---------- reusable bits ---------- */
function rarChip(vk){const R=RAR[VARS[vk].r],c=el('span','chip',`${R.name} ${stars(VARS[vk].r)}`);c.style.color=R.col;return c}
function mutChip(mk){const M=MUT_BY[mk],c=el('span','chip',mk==='none'?_t("Sem mutação"):`${M.name} ×${M.mult}`);c.style.color=M.col;return c}
function itemCard(it,o={}){
  const V=VARS[it.v],R=RAR[V.r],M=MUT_BY[it.m];
  const b=el('button','icard'); b.type='button'; b.style.setProperty('--rc',R.col+'99'); b.setAttribute('aria-pressed',o.sel?'true':'false');
  b.append(thumbVerity(it.v,it.m,o.em||4.6,{lvl:it.lvl,f:it.f}));
  const nm=el('span','nm',fullName(it.v,it.m,it.f)); if(it.f)nm.style.color=FUSE[it.f].col;else if(it.m!=='none')nm.style.color=M.col;
  const sub=el('span','sub',_t("{0} {1} · Nv {2}",R.name,stars(V.r),it.lvl)); sub.style.color=R.col;
  b.append(nm,sub,el('span','sub pow',_t("Poder ")+fmt(itemPower(it))),el('span','val',money(o.price??itemValue(it))));
  if(o.extra)b.append(el('span','sub',o.extra));
  if(it.fav)b.append(el('span','fav','★'));
  if(o.tag)b.append(el('span','tag',o.tag));
  if(o.onClick)b.onclick=o.onClick;
  return b;
}
function smallThumbs(items){const d=el('div','thumbs');for(const it of items.slice(0,8))d.append(thumbVerity(it.v,it.m,2.6,{lvl:it.lvl,badge:false,f:it.f}));if(items.length>8)d.append(el('span','small','+'+(items.length-8)));return d}
function drawPrev(c,fn,box=100){const fs=parseFloat(stage.style.fontSize)||16,px=Math.round(15*fs*DPR);if(c.width!==px){c.width=c.height=px}paint(c,box,fn)}
const sortItems=(items,mode)=>[...items].sort(mode==='pow'?(a,b)=>itemPower(b)-itemPower(a)||itemValue(b)-itemValue(a):mode==='rar'?(a,b)=>itemRank(b)-itemRank(a)||itemValue(b)-itemValue(a):mode==='lvl'?(a,b)=>b.lvl-a.lvl||itemValue(b)-itemValue(a):mode==='new'?(a,b)=>b.t-a.t:(a,b)=>itemValue(b)-itemValue(a));

/* ---------- menu ---------- */
function goMenu(){
  S.mode='menu'; S.paused=false; S.inv=null; S.parts=[]; S.floats=[]; stopGrunt(); $('knockBtn').hidden=true;
  showOnly('menu'); renderMenu(); renderUpdate(); setTimeout(maybeDaily,400);
}
/* ---------- auto-update (app only) ---------- */
let UPD={state:'idle',pct:0,ver:''},APP_VER='',updTimer=null;
function renderUpdate(){
  const busy=['available','downloading','ready'].includes(UPD.state);
  const show=IS_APP&&busy&&(S.mode==='menu'||S.mode==='boot');
  $('update').hidden=!show; if(!show)return;
  const ready=UPD.state==='ready';
  $('updTitle').textContent=ready?_t("Atualização pronta!"):_t("Baixando a versão {0}",UPD.ver||'nova');
  $('updMsg').textContent=ready?_t("O jogo vai fechar e abrir de novo já atualizado. Seu progresso fica salvo."):_t("O jogo está se atualizando sozinho. Leva só um instante.");
  $('updBar').style.width=clamp(UPD.pct||0,0,100)+'%'; $('updBtn').hidden=!ready;
  if(ready&&!updTimer)updTimer=setTimeout(()=>window.desktop.installUpdate(),4000);
}
$('updBtn').onclick=()=>window.desktop.installUpdate();
if(IS_APP){
  window.desktop.onUpdate(s=>{const was=UPD.state;UPD=s;renderUpdate();if(s.state==='available'&&was!=='available'&&playing())toast(_t("Versão nova chegando. Ela instala quando você voltar pro menu."))});
  window.desktop.updateState().then(s=>{UPD=s;renderUpdate()}).catch(()=>{});
  window.desktop.version().then(v=>{APP_VER=v;if(!$('menu').hidden)renderMenu()}).catch(()=>{});
}
function renderMenu(){
  const pc=$('playerCard'); pc.textContent='';
  const L=level(),cur=P.xp-xpAt(L),need=xpAt(L+1)-xpAt(L);
  const nm=el('span','nm'); const dot=el('span','dot'+(online()?' on':NET.status==='erro'?' err':'')); dot.title=netText(); nm.append(dot,document.createTextNode((P.username||_t("Jogador"))+(P.rebirths?' '+'★'.repeat(Math.min(P.rebirths,5))+(P.rebirths>5?P.rebirths:''):'')));
  const lv=el('span','lv',_t("Nível {0} · {1}/{2} XP",L,fmt(cur),fmt(need))); const xb=el('div','xpbar'); const xi=el('i'); xi.style.width=clamp(cur/need*100,0,100)+'%'; xb.append(xi);
  const right=el('div'); right.style.cssText='display:grid;gap:.3em;min-width:0';
  right.append(nm);if(P.title)right.append(el('span','ttl',titleName(P.title).toUpperCase()));right.append(lv,xb,el('span','mo',`${money(P.money)} · ${fmt(P.rolos)} ${ROLO}`));
  pc.append(thumbAvatar(P.eq,4.2),right);
  const b=bathOf(P.eq.bath); $('menuBath').textContent=_t("{0} · sorte ×{1}",b.name,b.luck.toFixed(2).replace('.',DEC))+(P.items.length?_t(" · {0} Verities",P.items.length):'')
    +(P.unknown.length?_t(" · {0} de versão nova (atualize)",P.unknown.length):'')+(APP_VER?` · v${APP_VER}`:'');
  const nb=WORLDS[Math.min(P.world.max,WORLDS.length)-1].boss,done=P.world.beaten.includes(nb.world),tp=teamPower();
  const mp=$('menuProg'); mp.textContent='';
  mp.append(document.createTextNode(_t("Mundo {0}/{1} · ",P.world.max,WORLDS.length)));
  if(done&&P.world.beaten.length>=WORLDS.length)mp.append(el('b',null,_t("Todos os chefes derrotados!")));
  else{mp.append(document.createTextNode(_t("Próximo chefe: ")));mp.append(el('b',null,nb.name));mp.append(document.createTextNode(_t(" · Poder {0} / {1}",fmt(tp),fmt(nb.rec))))}
  updateBadges(); updateWallets(); renderMenuLive();
}
$('mPlay').onclick=()=>{audioInit();openPanel('journey')};
function closeAllPanels(){while(panelStack.length)closePanel(panelStack[panelStack.length-1])}
const petSummary=b=>Object.entries(b).filter(([k,v])=>v>0).map(([k,v])=>ABIL[k].txt(v)).join(' · ');

/* ---------- journey ---------- */
RENDER.journey=()=>renderJourney();
function thumbWorld(Wd,em){const c=canvasEl(em);paint(c,100,()=>{circ(50,50,49,Wd.pal.tube);circ(50,50,49,'rgba(0,0,0,.15)');ctx.save();ctx.beginPath();ctx.arc(50,50,49,0,TAU);ctx.clip();for(let i=0;i<4;i++){ctx.strokeStyle=Wd.pal.fold;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(10+i*25,0);ctx.quadraticCurveTo(25+i*25,50,10+i*25,100);ctx.stroke()}ctx.restore();drawVariant(50,56,24,Wd.boss.key,'none',{glow:.3,t:1})});return c}
function showBossCard(){
  const B=run.boss; $('bcEyebrow').textContent=_t("Chefe do mundo {0} · {1}",B.world,run.W.name);
  $('bcName').textContent=B.name; $('bcDesc').textContent=B.desc;
  const pic=$('bcPic'); pic.textContent=''; pic.append(thumbVerity(B.key,'none',8,{badge:false}));
  $('bcPower').textContent=_t("Poder recomendado {0}. Sua equipe: {1}.",fmt(B.rec),fmt(run.power))+(run.power<B.rec?_t(" Vai ser difícil: dê upgrade, funda ou troque a equipe."):_t(" Você está forte o bastante."))+(petSummary(run.pet)?_t(" Pets: ")+petSummary(run.pet)+'.':'');
  showOnly('bossCard');
}
$('bcGo').onclick=()=>{audioInit();startP2()};
$('bcBack').onclick=()=>{goMenu();openPanel('journey')};
$('mColl').onclick=()=>openPanel('coll');
$('mShop').onclick=()=>openPanel('shop');
$('mMarket').onclick=()=>openPanel('market');
$('mFriends').onclick=()=>openPanel('friends');
$('mRank').onclick=()=>openPanel('rank');
$('mCfg').onclick=()=>openPanel('cfg');
$('mFull').onclick=()=>toggleFull();
$('mQuit').onclick=()=>confirmDo(_t("Sair do jogo?"),_t("Seu progresso já está salvo."),_t("Sair"),()=>{window.desktop&&window.desktop.quit()});

/* ---------- setup ---------- */
$('setupForm').addEventListener('submit',async e=>{
  e.preventDefault(); const n=$('setupName').value; $('setupErr').textContent='';
  try{await claimUsername(n);sfx.buy();goMenu()}catch(err){$('setupErr').textContent=err.message;sfx.err()}
});

/* ---------- run screens ---------- */
function showCard1(){
  const act=Object.keys(BOOSTS).filter(k=>(P.boosts[k]||0)>0).map(k=>BOOSTS[k].name);
  const b=bathOf(P.eq.bath);
  $('card1Boosts').textContent=_t("Banheiro: {0} (sorte ×{1}).",b.name,b.luck.toFixed(2).replace('.',DEC))+(act.length?_t(" Boosts que vão ser usados agora: {0}.",act.join(', ')):_t(" Nenhum boost ativo."));
  $('card1World').textContent=_t("Mundo {0}: {1}.",run.world,run.W.name)+(run.W.special?' '+SPECIALS[run.W.special]:'')+_t(" Equipe com {0} de poder",fmt(run.power))+(petSummary(run.pet)?': '+petSummary(run.pet)+'.':'.');
  showOnly('card1');
}
$('go1').onclick=()=>{audioInit();startP1()};
$('back1').onclick=()=>{goMenu();openPanel('journey')};
function showCard2Screen(){
  const f=run.fiber,c=Math.round(run.p1Comfort),I=INTRUDERS[run.intr]||INTRUDERS.irmao;
  $('c2lead').textContent=_t("Conforto {0}%{1}. A variante já está decidida. A mutação depende de você agora.",c,f>0?_t(" e {0} fibra{1}",f,f>1?'s':''):_t(", nenhuma fibra"));
  $('c2door').textContent=_t("{0} vai bater na porta. Aperte E ou OCUPADO! a tempo. Se você não responder, {1} entra no banheiro e a partida é cancelada.",I.name,I.name);
  showOnly('card2');
}
$('go2').onclick=()=>{audioInit();startP2()};
function showFail(stage){
  const I=INTRUDERS[run.intr]||INTRUDERS.irmao;
  if(stage===1){$('failEyebrow').textContent=_t("Etapa 1 · O Intestino");$('failTitle').textContent=_t("A cólica venceu");$('failMsg').textContent=_t("Você se contorceu tanto que desistiu. A Verity continua aí dentro, sorrindo.");$('retryBtn').textContent=_t("Tentar de novo")}
  else if(stage===2){$('failEyebrow').textContent=_t("Etapa 2 · O Trono");$('failTitle').textContent=_t("Desmaiou no vaso");$('failMsg').textContent=pick([_t("Força demais. Acordou vinte minutos depois com a marca do assento na bunda."),_t("A veia estourou o limite. Você viu uma luz amarela. Era só a Verity.")]);$('retryBtn').textContent=_t("Tentar o trono de novo")}
  else if(stage==='boss'){$('failEyebrow').textContent=_t("Chefe · ")+run.boss.name;$('failTitle').textContent=_t("O tempo acabou");$('failMsg').textContent=_t("Faltaram {0} de vida. Mais poder na equipe ajuda: upgrade, fusão ou Verities melhores.",fmt(run.boss.hp));$('retryBtn').textContent=_t("Lutar de novo")}
  else{$('failEyebrow').textContent=_t("Invasão!");$('failTitle').textContent=_t("{0} entrou no banheiro",I.name);$('failMsg').textContent=_t("A Verity voltou pra dentro de vergonha. A partida foi cancelada e você não ganhou nada.");$('retryBtn').textContent=_t("Jogar de novo")}
  showOnly('fail');
}
$('retryBtn').onclick=()=>{audioInit();if(failedStage==='invade'){if(run.boss)goBoss(run.world);else goCard1(run.world)}else retryStage()};
$('failMenu').onclick=()=>goMenu();
function showPause(on){$('pause').hidden=!on;$('pauseBtn').hidden=on||!playing();if(on)$('pResume').focus()}
$('pauseBtn').onclick=()=>togglePause(true);
$('pResume').onclick=()=>togglePause(false);
$('pCfg').onclick=()=>openPanel('cfg');
$('pQuit').onclick=()=>{S.paused=false;$('pause').hidden=true;goMenu()};
function showResults(r){
  const M=MUT_BY[r.mk],R=RAR[VARS[r.vk].r];
  $('rsRank').textContent=r.rk;
  const me=$('rsMut'); me.textContent=M.name; me.style.color=M.col; me.hidden=r.mk==='none';
  const rv=$('rsVar'); rv.textContent=VARS[r.vk].name; rv.style.color=R.col;
  const rc=$('rsRar'); rc.textContent=`${R.name} ${stars(VARS[r.vk].r)}`; rc.style.color=R.col;
  $('rsVal').textContent=_t("Vale ")+money(itemValue(r.item));
  const tags=[];if(r.newVar)tags.push(_t("variante nova!"));if(r.newMut)tags.push(_t("mutação nova!"));if(r.isBest)tags.push(_t("novo recorde!"));
  const bi=r.boss; if(bi){if(bi.first)tags.unshift(_t("primeira vitória"));tags.push('+'+money(bi.cash));if(bi.unlocked)tags.push(_t("mundo liberado: ")+bi.unlocked);if(bi.newSlot)tags.push(_t("nova vaga de pet!"));if(!bi.drop)tags.push(_t("o chefe não deixou a Verity dele dessa vez"))}
  $('rsSub').textContent=(tags.length?tags.join(' · ')+' · ':'')+_t("guardada na coleção");
  $('stCom').textContent=Math.round(run.p1Comfort)+'%'; $('stCombo').textContent='×'+r.maxCombo;
  $('stDoor').textContent=`${run.knockOk}/${run.knockOk+run.knockMiss}`; $('stThrone').textContent=fmt(r.T);
  $('stScore').textContent=fmt(r.score); $('stBest').textContent=fmt(P.best);
  const L=r.lvAfter,cur=P.xp-xpAt(L),need=xpAt(L+1)-xpAt(L);
  $('rsXp').textContent=_t("+{0} XP · Nível {1}",fmt(r.xpGain),L)+(L>r.lvBefore?_t(" · SUBIU DE NÍVEL! +{0}",money(r.reward)):'');
  $('rsXpBar').style.width=clamp(cur/need*100,0,100)+'%';
  if(L>r.lvBefore)sfx.up();
  const sb=$('rsSell'); sb.disabled=false; sb.textContent=_t("Vender (")+money(sellPrice(r.item))+')';
  $('rsFlush').disabled=false;
  $('results').hidden=false; $('rsAgain').focus({preventScroll:true});
}
$('rsAgain').onclick=()=>{audioInit();$('results').hidden=true;if(lastResult&&lastResult.boss&&P.world.max>lastResult.world){goMenu();openPanel('journey')}else if(run&&run.boss)goBoss(run.world);else goCard1(run?run.world:1)};
$('rsMenu').onclick=()=>{$('results').hidden=true;goMenu()};
$('rsFlush').onclick=()=>{if(flushToilet())$('rsFlush').disabled=true};
$('rsSell').onclick=()=>{
  const it=lastResult&&P.items.find(x=>x.id===lastResult.item.id); if(!it){toast(_t("Essa Verity não está mais na coleção."));return}
  confirmDo(_t("Vender pro jogo?"),_t("{0} por {1} (70% do valor). No mercado você pode pedir mais.",fullName(it.v,it.m,it.f),money(sellPrice(it))),_t("Vender"),()=>{if(act(()=>sellItem(it.id),_t("Vendida!"),'coin'))$('rsSell').disabled=true});
};

/* ---------- collection ---------- */
let collSel=null;
$('collSort').onchange=()=>renderColl(false);
RENDER.coll=()=>{renderColl()};
function renderColl(){
  if(TAB.coll==='index'){renderIndex();return}
  if(TAB.coll==='cuts'){renderCuts();return}
  const g=$('collGrid'); g.textContent='';
  const items=sortItems(P.items,$('collSort').value),f=featured();
  $('collCount').textContent=_t("{0} Verities · valor total {1}",P.items.length,money(totalValue()));
  renderTeamBar(); renderCollBulk();
  if(!items.length)g.append(el('p','empty',_t("Nenhuma Verity ainda. Jogue uma partida pra começar a coleção.")));
  if(!items.some(i=>i.id===collSel))collSel=items[0]?items[0].id:null;
  for(const it of items)g.append(itemCard(it,{sel:collPick?collPick.has(it.id):it.id===collSel,tag:P.pets.includes(it.id)?_t("EQUIPE"):P.museum.ids.includes(it.id)?_t("MUSEU"):f&&f.id===it.id?_t("VITRINE"):null,onClick:()=>{if(collPick){if(collPick.has(it.id))collPick.delete(it.id);else collPick.add(it.id)}collSel=it.id;sfx.click();renderColl()}}));
  renderCollDetail(P.items.find(i=>i.id===collSel));
}
function renderCollDetail(it){
  const d=$('collDetail'); d.textContent=''; ANIM.coll=null;
  if(!it){d.append(el('p','empty',_t("Escolha uma Verity.")));return}
  const c=canvasEl(15,'prev'); d.append(c);
  ANIM.coll=()=>drawPrev(c,()=>drawVariant(50,(it.v==='lord'||it.v==='exu')?58:52,24,it.v,it.m,{glow:1,lvl:it.lvl,f:it.f}));
  ANIM.coll();
  const box=el('div','detail');
  const nm=el('p','vname',fullName(it.v,it.m,it.f)); if(it.f)nm.style.color=FUSE[it.f].col;else if(it.m!=='none')nm.style.color=MUT_BY[it.m].col;
  const chips=el('p','chips'); chips.append(rarChip(it.v),mutChip(it.m)); if(it.f){const fc=el('span','chip',FUSE[it.f].name+' ×'+FUSE[it.f].pow+_t(" poder"));fc.style.color=FUSE[it.f].col;chips.append(fc)}
  const lv=el('div','lvl'); lv.append(el('span',null,_t("Nível {0}/{1} · +8% de valor por nível",it.lvl,MAX_LVL))); const xb=el('div','xpbar'),xi=el('i'); xi.style.width=(it.lvl/MAX_LVL*100)+'%'; xb.append(xi); lv.append(xb);
  const pw=el('p','vname',_t("Poder ")+fmt(itemPower(it))); pw.style.color='var(--mint)';
  const ab=VARS[it.v].abil; box.append(nm,chips,pw,el('p','small',ab?_t("Como pet · ")+abilText([ab[0],ab[1]*(1+(it.f||0)*.5)]):_t("Sem habilidade de pet.")),el('p','vname',money(itemValue(it))),lv);
  box.append(favButton(it));
  const acts=el('div','actions');
  const upBox=el('div','upbox');upBox.append(el('p','qlabel',it.lvl>=MAX_LVL?_t("Nível máximo"):_t("Upgrade de nível (cada um custa mais)")));
  if(it.lvl<MAX_LVL)upBox.append(qtyRow({prefix:'+',cap:MAX_LVL-it.lvl,cost:n=>upCostN(it,n),max:()=>upMax(it),fmt:money,buy:n=>{const to=Math.min(MAX_LVL,it.lvl+n);act(()=>upgradeItem(it.id,n),_t("Nível {0}!",to),'up')}}));
  box.append(upBox);
  const sell=el('button','btn ghost sm',_t("Vender pro jogo · {0}",money(sellPrice(it))));
  sell.onclick=()=>guardFav([it],()=>confirmDo(_t("Vender pro jogo?"),_t("{0} Nv {1} por {2} (70% do valor).",fullName(it.v,it.m,it.f),it.lvl,money(sellPrice(it))),_t("Vender"),()=>act(()=>sellItem(it.id),_t("Vendida!"),'coin')));
  const mk=el('button','btn ghost sm',_t("Anunciar no mercado")); mk.disabled=!online(); if(!online())mk.title=netText();
  mk.onclick=()=>guardFav([it],()=>promptListing(it));
  const isF=featured()&&featured().id===it.id;
  const vt=el('button','btn ghost sm',isF?_t("Está na vitrine"):_t("Pôr na vitrine")); vt.disabled=isF; vt.onclick=()=>{setFeatured(it.id);toast(_t("Na vitrine!"));sfx.click()};
  const inTeam=P.pets.includes(it.id),pt=el('button','btn sm',inTeam?_t("Tirar da equipe"):_t("Pôr na equipe"));
  pt.onclick=()=>{toast(togglePet(it.id));sfx.click()};
  const grp=fuseGroup(it).length,fu=el('button','btn ghost sm',(it.f||0)>=2?_t("Fusão máxima"):_t("Fundir 5 iguais ({0}/5) · {1}",grp,money(fuseCost(it))));
  fu.disabled=(it.f||0)>=2||grp<5||P.money<fuseCost(it);
  fu.title=_t("5 Verities iguais (mesma variante, mutação e fusão) viram 1 ")+((it.f||0)?_t("Arco-íris"):_t("Dourada"))+_t(", bem mais forte.");
  fu.onclick=()=>guardFav(fuseUsed(it),()=>confirmDo(_t("Fundir?"),_t("5 × {0} viram 1 {1}. Custa {2}. O nível fica o maior entre elas.",fullName(it.v,it.m,it.f),fullName(it.v,it.m,(it.f||0)+1),money(fuseCost(it))),_t("Fundir"),()=>{if(act(()=>fuseItem(it.id),_t("Fusão feita!"),'up')){collSel=LAST_FUSED;renderColl()}}));
  const inMu=P.museum.ids.includes(it.id),mu=el('button','btn ghost sm',inMu?_t("Tirar do Museu"):_t("Expor no Museu"));
  mu.onclick=()=>{toast(toggleMuseum(it.id));sfx.click()};
  const cs=el('button','btn ghost sm',_t("Ver cutscene"));
  cs.onclick=()=>{closeAllPanels();startCutscene(it.v,it.m,it.f,()=>{goMenu();openPanel('coll');collSel=it.id;renderColl()},true)};
  acts.append(pt,fu,mu,cs,sell,mk,vt); box.append(acts);
  if(!online())box.append(el('p','small',_t("Mercado e trocas: ")+netText()));
  d.append(box);
}
function renderTeamBar(){
  const tb=$('teamBar'); tb.textContent=''; const tm=team(),n=petSlots();
  const sl=el('div','slots');
  for(let i=0;i<5;i++){
    const it=tm[i],b=el('button','slot');
    if(i>=n){b.textContent='🔒';b.title=_t("Mais vagas ao derrotar o 3º e o 6º chefe");b.disabled=true}
    else if(it){b.append(thumbVerity(it.v,it.m,3.2,{badge:false,f:it.f}));b.title=fullName(it.v,it.m,it.f);b.onclick=()=>{collSel=it.id;renderColl()}}
    else b.textContent=_t("vazio");
    sl.append(b);
  }
  const info=el('div','tinfo'); info.append(el('span',null,_t("Sua equipe")),el('b',null,_t("Poder ")+fmt(teamPower())),el('span',null,petSummary(petBonus())||_t("Coloque Verities na equipe pelo painel ao lado.")));
  const auto=el('button','btn ghost sm',_t("Montar a mais forte")); auto.onclick=()=>{autoTeam();saveProfile();toast(_t("Equipe montada!"));sfx.click()};
  tb.append(sl,info,auto);
}
function promptListing(it){
  const inp=el('input','input'); inp.type='number'; inp.min='1'; inp.value=String(itemValue(it)); inp.setAttribute('aria-label',_t("Preço"));
  modal(_t("Anunciar no mercado"),[el('p','small',_t("{0} Nv {1} · valor {2}. Ela sai da sua coleção enquanto o anúncio estiver aberto.",fullName(it.v,it.m,it.f),it.lvl,money(itemValue(it)))),inp],
    [{label:_t("Anunciar"),fn:async()=>{await listItem(it.id,inp.value);toast(_t("Anúncio publicado!"));sfx.coin()}},{label:_t("Cancelar"),cls:'ghost'}]);
}
function renderIndex(){
  const box=$('collIndex'); box.textContent='';
  box.append(el('p','ptitle',_t("Variantes · da mais rara pra mais comum")),el('p','small',_t("A variante depende do conforto com que ela chega no fim do intestino. Banheiros melhores e o boost Sorte de Variante puxam pra cima.")));
  const lad=el('div','ladder');
  for(let r=RAR.length-1;r>=0;r--){
    const R=RAR[r],row=el('div','lad'); row.style.setProperty('--rc',R.col);
    const tier=el('div','tier'); tier.append(el('b',null,R.name),el('small',null,stars(r))); row.append(tier);
    const mem=el('div','members');
    for(const vk of VAR_ORDER.filter(k=>VARS[k].r===r)){
      const got=P.items.filter(i=>i.v===vk).length,m=el('div','mem');
      const t=el('span'); t.append(document.createTextNode(got?VARS[vk].name:'???'),el('small',null,`base ${money(VARS[vk].base)} · ${VARS[vk].hint}${got?_t(" · você tem {0}",got):''}`));
      m.append(thumbVerity(vk,'none',3.4,{locked:!got}),t); mem.append(m);
    }
    row.append(mem); lad.append(row);
  }
  box.append(lad);
  box.append(el('p','ptitle',_t("Mutações · multiplicam o valor")),el('p','small',_t("A chance sobe com os pontos do trono (combo e porta), com o banheiro e com o boost Sorte de Mutação. As melhores também pedem um mínimo de pontos.")));
  const ml=el('div','ladder');
  for(let i=MUTS.length-1;i>=1;i--){
    const M=MUTS[i],row=el('div','lad'); row.style.setProperty('--rc',M.col);
    const tier=el('div','tier'); tier.append(el('b',null,M.name),el('small',null,_t("×{0} no valor",M.mult))); row.append(tier);
    const got=P.items.filter(x=>x.m===M.k).length,m=el('div','mem'),t=el('span');
    t.append(document.createTextNode(got?_t("Você tem {0}",got):_t("Ainda não achou")),el('small',null,M.min?_t("precisa de {0}+ pontos de trono",M.min):_t("qualquer pontuação")));
    m.append(thumbVerity('verity',M.k,3.4),t); row.append(m); ml.append(row);
  }
  box.append(ml,el('p','notice',_t("Valor = base da variante × multiplicador da mutação × nível (+8% por nível). Exemplo: Galaxy Moggity Nv 1 = 600 × 30 = V$ 18.000.")));
}

/* every Verity's cutscene, unlocked once found (or all, with the CINEMA code) */
function cutsUnlocked(){const s=new Set([...P.seen,...P.items.map(i=>i.v)]);if(P.codes.includes('CINEMA'))for(const k in CUT_SPECS)s.add(k);return s}
function cutPick(vk){
  const own=P.items.filter(i=>i.v===vk).sort((a,b)=>(b.f||0)-(a.f||0)||MUT_BY[b.m].i-MUT_BY[a.m].i)[0];
  return own?{v:vk,m:own.m,f:own.f||0}:{v:vk,m:'none',f:0};
}
function playCuts(list,i,replay=true,done){
  if(i>=list.length){if(done)done();else{goMenu();openPanel('coll','cuts')}return}
  const c=list[i]; closeAllPanels(); startCutscene(c.v,c.m,c.f,()=>playCuts(list,i+1,replay,done),replay);
}
function renderCuts(){
  const box=$('collCuts'); box.textContent='';
  const keys=Object.keys(CUT_SPECS).filter(k=>VARS[k]),un=cutsUnlocked(),open=keys.filter(k=>un.has(k));
  const head=el('div','toolbar'); head.append(el('p','ptitle',_t("Cutscenes · {0}/{1} liberadas",open.length,keys.length)));
  const all=el('button','btn sm',_t("Assistir todas")); all.disabled=!open.length; all.onclick=()=>{sfx.click();playCuts(open.map(cutPick),0)};
  head.append(all);
  box.append(head,el('p','small',_t("Toda Verity tem uma cutscene. Ela libera aqui quando você encontra a Verity pela primeira vez.")));
  const g=el('div','igrid');
  for(const k of keys){
    const V=VARS[k],R=RAR[V.r],got=un.has(k),c=cutPick(k);
    const b=el('button','icard'); b.type='button'; b.style.setProperty('--rc',R.col+'99');
    b.append(thumbVerity(k,got?c.m:'none',4.6,{locked:!got,badge:false,f:got?c.f:0}));
    b.append(el('span','nm',got?V.name:'???'));
    const sub=el('span','sub',got?R.name+' '+stars(V.r):(V.hint||_t("Ainda não encontrada"))); if(got)sub.style.color=R.col; b.append(sub);
    b.append(el('span','sub pow',got?'▶ '+_t("Assistir"):'🔒 '+_t("Ainda não encontrada")));
    if(got)b.onclick=()=>{sfx.click();playCuts([c],0)}; else b.disabled=true;
    g.append(b);
  }
  box.append(g);
}

/* ---------- shop ---------- */
let lookCat='skin',shopPrev={kind:'eq',eq:null};
RENDER.shop=()=>renderShop();
function renderShop(){
  if(TAB.shop==='marmitas'){renderMarmitas();return}
  const main=$('shopMain'); main.textContent=''; const info=$('shopInfo'); info.textContent='';
  const tab=TAB.shop,g=el('div','igrid wide');
  const card=(thumb,name,sub,priceTxt,btnLabel,btnDisabled,onBuy,onSel,owned)=>{
    const c=el('div','icard'); c.tabIndex=0; if(thumb)c.append(thumb); c.append(el('span','nm',name)); if(sub)c.append(el('span','sub',sub));
    c.append(el('span','val'+(owned?' owned':''),priceTxt));
    const b=el('button','btn sm',btnLabel); b.disabled=btnDisabled; b.onclick=e=>{e.stopPropagation();onBuy()}; c.append(b);
    if(onSel){c.onmouseenter=onSel;c.onfocus=onSel;c.onclick=onSel}
    return c;
  };
  if(tab==='boosts'){
    main.append(el('p','small',_t("Cada compra dá 1 carga. As cargas são gastas sozinhas, uma por partida. Compre ×10, ×50, ×100 ou o máximo de uma vez.")));
    for(const [k,b] of Object.entries(BOOSTS)){
      const have=P.boosts[k]||0;
      const c=el('div','icard');c.append(el('span','nm',b.name),el('span','sub',b.desc+(have?_t(" · você tem {0}",have):'')),el('span','val',money(b.price)));
      c.append(qtyRow({cost:n=>b.price*n,max:()=>Math.min(9999,Math.floor(P.money/b.price)),fmt:money,buy:n=>act(()=>buyBoost(k,n),_t("{0} ×{1} comprado!",b.name,n))}));g.append(c);
    }
    shopPrev={kind:'verity'};
    info.append(el('p','ptitle',_t("Seus boosts")));
    const owned=Object.keys(BOOSTS).filter(k=>P.boosts[k]>0);
    info.append(el('p','small',owned.length?owned.map(k=>`${BOOSTS[k].name} ×${P.boosts[k]}`).join(' · '):_t("Nenhum ainda.")));
  }else if(tab==='baths'){
    main.append(el('p','small',_t("Cada banheiro aumenta a sorte de variante e de mutação. A sorte cresce em escala logarítmica: sorte = 1 + 0,2 × log₂(nível do banheiro). Compre em ordem.")));
    for(const b of BATHS){
      const own=P.owned.bath.includes(b.tier),eq=P.eq.bath===b.tier,prevOwn=P.owned.bath.includes(b.tier-1)||b.tier===1;
      const lab=eq?_t("Equipado"):own?_t("Usar"):_t("Comprar");
      g.append(card(null,`${b.tier}. ${b.name}`,_t("Sorte ×{0}",b.luck.toFixed(2).replace('.',DEC)),own?_t("Seu"):money(b.price),lab,eq||(!own&&(!prevOwn||P.money<b.price)),
        ()=>own?act(()=>equipBath(b.tier),b.name+_t(" equipado!"),'click'):act(()=>buyBath(b.tier),b.name+_t(" é seu!")),
        ()=>{shopPrev={kind:'bath',bath:b.tier}},own));
    }
    shopPrev=shopPrev.kind==='bath'?shopPrev:{kind:'bath',bath:P.eq.bath};
    info.append(el('p','small',_t("O banheiro aparece no menu e na hora de fazer força.")));
  }else if(tab==='look'){
    const st=el('div','subtabs');
    for(const [c,def] of Object.entries(COS)){const p=el('button','pick',def.label);p.setAttribute('aria-pressed',c===lookCat?'true':'false');p.onclick=()=>{lookCat=c;sfx.click();renderShop()};st.append(p)}
    main.append(st);
    for(const [k,it] of Object.entries(COS[lookCat].items)){
      const own=P.owned[lookCat].includes(k),eq=P.eq[lookCat]===k,tryEq={...P.eq,[lookCat]:k};
      g.append(card(thumbAvatar(tryEq,4.4),it.name,COS[lookCat].label,own?_t("Seu"):money(it.price),eq?_t("Equipado"):own?_t("Usar"):_t("Comprar"),eq||(!own&&P.money<it.price),
        ()=>own?act(()=>equipCos(lookCat,k),it.name+_t(" equipado!"),'click'):act(()=>buyCos(lookCat,k),it.name+_t(" é seu!")),
        ()=>{shopPrev={kind:'eq',eq:tryEq}},own));
    }
    if(shopPrev.kind!=='eq'||!shopPrev.eq)shopPrev={kind:'eq',eq:{...P.eq}};
    info.append(el('p','small',_t("Passe o mouse num item pra experimentar.")));
  }else{
    main.append(el('p','small',_t("Escolha quem bate na porta enquanto você faz força. Se você não responder a tempo, essa pessoa entra e a partida é cancelada.")));
    for(const [k,it] of Object.entries(INTRUDERS)){
      const own=P.owned.intr.includes(k),eq=P.eq.intr===k;
      g.append(card(thumbIntruder(k,5),it.name,`“${it.knock}”`,own?_t("Seu"):money(it.price),eq?_t("Equipado"):own?_t("Usar"):_t("Comprar"),eq||(!own&&P.money<it.price),
        ()=>own?act(()=>equipIntr(k),it.name+_t(" vai bater na porta!"),'click'):act(()=>buyIntr(k),it.name+_t(" é seu!")),
        ()=>{shopPrev={kind:'intr',intr:k}},own));
    }
    if(shopPrev.kind!=='intr')shopPrev={kind:'intr',intr:P.eq.intr};
  }
  main.append(g);
  ANIM.shop();
}
ANIM.shop=()=>{
  const c=$('shopPrev'),p=shopPrev;
  drawPrev(c,()=>{
    if(p.kind==='verity'){const f=featured();drawVariant(50,52,24,f?f.v:'verity',f?f.m:'ouro',{glow:1});return}
    if(p.kind==='bath'){const b=bathOf(p.bath);ctx.save();ctx.scale(100/560,100/560);ctx.translate(-360,-120);drawBathroomBG(b);ctx.translate(PT.x,PT.y);ctx.scale(PT.s,PT.s);drawSeated(P.eq,b,{F:0,strain:0});ctx.restore();return}
    if(p.kind==='intr'){rr(0,0,100,100,0);ctx.fillStyle='#2c6e63';ctx.fill();rr(28,8,44,92,2);ctx.fillStyle='#120a05';ctx.fill();drawIntruder(p.intr,50,98,.21);return}
    rr(0,0,100,100,6);ctx.fillStyle='rgba(255,255,255,.05)';ctx.fill();ctx.save();ctx.translate(50,-30);ctx.scale(.24,.24);ctx.translate(-270,0);drawSeated(p.eq||P.eq,bathOf(P.eq.bath),{F:0,strain:0});ctx.restore();
  });
};

/* ---------- market ---------- */
let mkList=null,mkLoading=false;
RENDER.market=fresh=>{if(fresh&&TAB.market==='buy')loadMarket();renderMarket()};
$('mkRefresh').onclick=()=>{loadMarket();sfx.click()};
async function loadMarket(){if(!online()||mkLoading)return;mkLoading=true;renderMarket();try{mkList=await fetchMarket()}catch(e){toast(e.message)}mkLoading=false;renderMarket()}
function renderMarket(){
  const g=$('mkGrid'); g.textContent=''; $('mkNotice').textContent=online()?'':netText();
  if(!online())return;
  if(TAB.market==='buy'){
    if(mkLoading&&!mkList){g.append(el('p','empty',_t("Carregando anúncios...")));return}
    const list=(mkList||[]).filter(l=>l.status==='open').sort((a,b)=>(b.at||0)-(a.at||0));
    if(!list.length)g.append(el('p','empty',_t("Nenhuma Verity à venda agora. Anuncie a sua pela Coleção.")));
    for(const l of list){
      const mine=l.seller===NET.uid,c=itemCard(sanitizeItem(l.item),{price:l.price,extra:_t("vendido por ")+String(l.sellerName||'?').slice(0,20)});
      const b=el('button','btn sm',mine?_t("Seu anúncio"):_t("Comprar")); b.disabled=mine||P.money<l.price;
      b.onclick=e=>{e.stopPropagation();confirmDo(_t("Comprar?"),_t("{0} Nv {1} por {2}.",fullName(l.item.v,l.item.m,l.item.f),l.item.lvl,money(l.price)),_t("Comprar"),async()=>{await buyListing(l);toast(_t("Comprada! Já está na sua coleção."));sfx.buy();loadMarket()})};
      c.append(b); g.append(c);
    }
  }else{
    const list=NET.myListings;
    if(!list.length)g.append(el('p','empty',_t("Você não anunciou nada ainda. Anuncie pela Coleção.")));
    for(const l of list){
      const st=l.status==='open'?_t("à venda"):l.status==='sold'?_t("vendida pra {0}",l.buyerName||_t("alguém")):_t("cancelado");
      const c=itemCard(sanitizeItem(l.item),{price:l.price,extra:st});
      if(l.status==='open'){const b=el('button','btn ghost sm',_t("Cancelar"));b.onclick=e=>{e.stopPropagation();confirmDo(_t("Cancelar anúncio?"),_t("A Verity volta pra sua coleção."),_t("Cancelar anúncio"),async()=>{await cancelListing(l);toast(_t("Anúncio cancelado."))})};c.append(b)}
      g.append(c);
    }
  }
}

/* ---------- friends & trades ---------- */
let friendsCache=null,friendsLoading=false;
RENDER.friends=fresh=>{if(fresh)loadFriends();renderFriends()};
async function loadFriends(){if(!online()||friendsLoading)return;friendsLoading=true;try{friendsCache=await fetchFriends()}catch(e){toast(e.message)}friendsLoading=false;renderFriends()}
$('addFriend').addEventListener('submit',async e=>{
  e.preventDefault(); const n=$('addName').value.trim(); if(!n)return; $('addMsg').textContent='';
  try{const r=await sendFriendRequest(n);$('addMsg').textContent=r==='accepted'?_t("Vocês agora são amigos!"):_t("Pedido enviado. Quando aceitarem, aparece aqui.");$('addName').value='';sfx.ok();loadFriends()}
  catch(err){$('addMsg').textContent=err.message;sfx.err()}
});
function renderFriends(){
  $('frNotice').textContent=online()?'':netText();
  $('addFriend').hidden=!online();
  const rq=$('frReqs'); rq.textContent='';
  if(online()&&NET.reqIn.length){
    rq.append(el('p','ptitle',_t("Pedidos de amizade")));
    const rows=el('div','rows');
    for(const r of NET.reqIn){
      const row=el('div','lrow'); row.append(el('span','pos','?'));
      const nm=el('span','lname'); nm.append(el('b',null,String(r.fromName||'?').slice(0,20)),el('small',null,_t("quer ser seu amigo"))); row.append(nm);
      const bt=el('div','row'); const a=el('button','btn sm',_t("Aceitar")),d=el('button','btn ghost sm',_t("Recusar"));
      a.onclick=async()=>{try{await acceptFriend(r);toast(_t("Novo amigo!"));sfx.ok();loadFriends()}catch(e){toast(e.message)}};
      d.onclick=async()=>{try{await declineFriend(r)}catch(e){toast(e.message)}};
      bt.append(a,d); row.append(bt); rows.append(row);
    }
    rq.append(rows);
  }
  if(online()&&NET.reqOut.length)rq.append(el('p','small',_t("Esperando resposta de: ")+NET.reqOut.map(r=>r.toName).join(', ')));
  const fl=$('frList'); fl.textContent='';
  if(online()){
    fl.append(el('p','ptitle',_t("Seus amigos ({0})",P.friends.length)));
    if(friendsLoading&&!friendsCache)fl.append(el('p','empty',_t("Carregando...")));
    else if(!P.friends.length)fl.append(el('p','empty',_t("Você ainda não tem amigos aqui. Adicione pelo username.")));
    for(const f of friendsCache||[]){
      const row=el('div','lrow'); row.append(thumbAvatar(f.eq,3.2));
      const top=f.items.reduce((b,i)=>!b||itemValue(i)>itemValue(b)?i:b,null);
      const nm=el('span','lname'); nm.append(el('b',null,f.username),el('small',null,_t("Nível {0} · {1} Verities · recorde {2}{3}",f.level,f.items.length,fmt(f.best),top?_t(" · melhor: {0}",fullName(top.v,top.m,top.f)):''))); row.append(nm);
      const bt=el('div','row'); const v=el('button','btn sm',_t("Ver coleção e trocar")),x=el('button','btn ghost sm',_t("Remover"));
      v.onclick=()=>openProfile(f.uid); x.onclick=()=>confirmDo(_t("Remover amigo?"),_t("{0} sai da sua lista.",f.username),_t("Remover"),()=>{removeFriend(f.uid);friendsCache=(friendsCache||[]).filter(y=>y.uid!==f.uid);renderFriends()});
      bt.append(v,x); row.append(bt); fl.append(row);
    }
  }
  renderTrades();
}
function tradeRow(t,incoming){
  const row=el('div','trade');
  const a=el('div','side'),b=el('div','side');
  const recv=incoming?(t.give||[]):(t.want||[]),give=incoming?(t.want||[]):(t.give||[]);
  a.append(el('b',null,_t("Você recebe")),smallThumbs(recv.map(sanitizeItem).filter(Boolean))); if(hasUnknown(recv))a.append(el('span','small err',_t("+ Verity de versão nova: atualize o jogo"))); if(incoming&&t.money)a.append(el('span','chip gold','+ '+money(t.money)));
  b.append(el('b',null,_t("Você dá")),smallThumbs(give.map(sanitizeItem).filter(Boolean))); if(!incoming&&t.money)b.append(el('span','chip gold','+ '+money(t.money)));
  const who=el('span','st',(incoming?_t("de "):_t("pra "))+String(incoming?t.fromName:t.toName).slice(0,20));
  const st={open:_t("aberta"),accepted:_t("aceita"),declined:_t("recusada"),canceled:_t("cancelada")}[t.status]||t.status;
  const ctl=el('div','row');
  if(t.status==='open'){
    if(incoming){const y=el('button','btn sm',_t("Aceitar")),n=el('button','btn ghost sm',_t("Recusar"));
      y.onclick=()=>confirmDo(_t("Aceitar a troca?"),_t("As Verities trocam de dono na hora."),_t("Aceitar"),async()=>{await acceptTrade(t);toast(_t("Troca feita!"));sfx.buy()});
      n.onclick=async()=>{try{await declineTrade(t);toast(_t("Troca recusada."))}catch(e){toast(e.message)}};ctl.append(y,n)}
    else{const c=el('button','btn ghost sm',_t("Cancelar"));c.onclick=async()=>{try{await cancelTrade(t);toast(_t("Troca cancelada. Suas Verities voltaram."))}catch(e){toast(e.message)}};ctl.append(c)}
  }else ctl.append(el('span','st',st));
  const mid=el('div','side'); mid.append(who,el('span','arrow','⇄'));
  row.append(a,mid,b,ctl); return row;
}
function renderTrades(){
  const box=$('trList'); box.textContent='';
  if(!online()){box.append(el('p','notice',netText()));return}
  const openIn=NET.tradesIn.filter(t=>t.status==='open'),openOut=NET.tradesOut.filter(t=>t.status==='open');
  const closed=[...NET.tradesIn,...NET.tradesOut].filter(t=>t.status!=='open').sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,10);
  box.append(el('p','ptitle',_t("Recebidas")));
  if(!openIn.length)box.append(el('p','empty',_t("Nenhuma proposta pra você agora."))); else{const r=el('div','rows');openIn.forEach(t=>r.append(tradeRow(t,true)));box.append(r)}
  box.append(el('p','ptitle',_t("Enviadas")));
  if(!openOut.length)box.append(el('p','empty',_t("Pra propor uma troca, abra a coleção de um amigo."))); else{const r=el('div','rows');openOut.forEach(t=>r.append(tradeRow(t,false)));box.append(r)}
  if(closed.length){box.append(el('p','ptitle',_t("Histórico")));const r=el('div','rows');closed.forEach(t=>r.append(tradeRow(t,t.to===NET.uid)));box.append(r)}
}

/* ---------- friend profile ---------- */
let pf=null,pfSel=new Set();
async function openProfile(uid){
  pf=null; pfSel=new Set(); openPanel('profile');
  try{pf=await fetchPlayer(uid);if(!pf)throw new Error(_t("Perfil não encontrado."))}catch(e){toast(e.message);closePanel('profile');return}
  renderProfile();
}
RENDER.profile=()=>renderProfile();
function renderProfile(){
  const g=$('pfGrid'); g.textContent=''; const info=$('pfInfo'); info.textContent='';
  if(!pf){$('pfTitle').textContent=_t("Carregando...");ANIM.profile=null;return}
  $('pfTitle').textContent=pf.username;
  const tmr=el('div','row'); for(const it of pf.pets)tmr.append(thumbVerity(it.v,it.m,3,{badge:false,f:it.f}));
  info.append(el('p','vname',pf.username),el('p','small',_t("Nível {0} · Mundo {1} · Poder {2}",pf.level,pf.world,fmt(pf.power))),tmr,el('p','small',_t("Recorde {0} · {1}",fmt(pf.best),money(pf.money))),el('p','small',_t("{0} Verities · coleção vale {1}",pf.items.length,money(totalValue(pf.items)))));
  const items=sortItems(pf.items,'val');
  if(!items.length)g.append(el('p','empty',_t("Coleção vazia.")));
  for(const it of items)g.append(itemCard(it,{sel:pfSel.has(it.id),onClick:()=>{pfSel.has(it.id)?pfSel.delete(it.id):pfSel.add(it.id);sfx.click();renderProfile()}}));
  const tb=$('pfTrade'); tb.disabled=!pfSel.size; tb.textContent=pfSel.size?_t("Propor troca ({0} pedida{1})",pfSel.size,pfSel.size>1?'s':''):_t("Propor troca");
  const c=$('pfPrev'); ANIM.profile=()=>drawPrev(c,()=>{ctx.save();ctx.translate(50,-30);ctx.scale(.24,.24);ctx.translate(-270,0);drawSeated(pf.eq,bathOf(1),{F:0,strain:0});ctx.restore()}); ANIM.profile();
}
$('pfTrade').onclick=()=>{
  if(!pf||!pfSel.size)return;
  const want=pf.items.filter(i=>pfSel.has(i.id)),give=new Set();let favAck=false;
  const grid=el('div','igrid'),cash=el('input','input sm'); cash.type='number'; cash.min='0'; cash.value='0'; cash.setAttribute('aria-label',_t("Dinheiro oferecido"));
  const sum=el('p','small');
  const upd=()=>{const gv=P.items.filter(i=>give.has(i.id));sum.textContent=_t("Você pede {0} (valor {1}) e oferece {2} (valor {3}) + {4}.",want.length,money(totalValue(want)),gv.length,money(totalValue(gv)),money(+cash.value||0))};
  const draw=()=>{grid.textContent='';for(const it of sortItems(P.items,'val'))grid.append(itemCard(it,{em:3.6,sel:give.has(it.id),onClick:()=>{give.has(it.id)?give.delete(it.id):give.add(it.id);draw();upd()}}));if(!P.items.length)grid.append(el('p','empty',_t("Você não tem Verities pra oferecer.")))};
  cash.oninput=upd; draw(); upd();
  const lab=el('label','row left'); lab.append(el('span','small',_t("Dinheiro junto:")),cash);
  modal(_t("Troca com {0}",pf.username),[el('p','small',_t("Escolha o que você oferece. Suas Verities ficam guardadas na proposta até a outra pessoa responder.")),grid,lab,sum],
    [{label:_t("Enviar proposta"),fn:async()=>{const fv=favs(P.items.filter(i=>give.has(i.id)));if(fv.length&&!favAck){favAck=true;toast(_t("Tem favorita na troca ({0}). Clique de novo pra confirmar.",fv.map(i=>fullName(i.v,i.m,i.f)).join(', ')),4000);sfx.err();return false}await proposeTrade(pf.uid,pf.username,[...give],want,cash.value);toast(_t("Proposta enviada!"));sfx.ok();pfSel.clear();renderProfile()}},{label:_t("Cancelar"),cls:'ghost'}]);
};

/* ---------- ranking ---------- */
let rkData={},rkLoading=false;
RENDER.rank=fresh=>{if(fresh)loadRank();renderRank()};
async function loadRank(){if(!online()||rkLoading)return;rkLoading=true;renderRank();try{rkData[TAB.rank]=await fetchRanking(TAB.rank)}catch(e){toast(e.message)}rkLoading=false;renderRank()}
function renderRank(){
  const box=$('rkList'); box.textContent=''; $('rkNotice').textContent=online()?'':netText();
  if(!online()){
    const row=el('div','lrow rkrow me'); fillRankRow(row,1,{username:P.username||_t("Você"),level:level(),power:teamPower(),best:P.best,money:P.money,totalValue:totalValue(),bestV:featured(),eq:P.eq}); box.append(row); return;
  }
  const list=rkData[TAB.rank];
  if(!list){box.append(el('p','empty',rkLoading?_t("Carregando ranking..."):_t("Sem dados.")));return}
  if(!list.length)box.append(el('p','empty',_t("Ninguém no ranking ainda.")));
  list.forEach((r,i)=>{const row=el('div','lrow rkrow'+(r.uid===NET.uid?' me':''));fillRankRow(row,i+1,r);box.append(row)});
}
function fillRankRow(row,pos,r){
  const hl=k=>TAB.rank===k?'c hl':'c';
  row.append(el('span','pos',String(pos)),thumbAvatar(r.eq,3));
  const nm=el('span','lname'); nm.append(el('b',null,r.username+(r.rebirths?' ★'+r.rebirths:'')),el('small',null,_t("Nível {0}",r.level)+(r.title?' · '+titleName(r.title):''))); row.append(nm);
  const col=(k,lab,v)=>{const c=el('span',hl(k));c.append(el('small',null,lab),document.createTextNode(v));return c};
  row.append(col('xp',_t("Nível"),String(r.level)),col('power',_t("Poder"),fmt(r.power||0)),col('best',_t("Recorde"),fmt(r.best)),col('money',_t("Dinheiro"),money(r.money)),col('totalValue',_t("Coleção"),money(r.totalValue)));
  const bv=el('span','bv'); if(r.bestV){bv.append(thumbVerity(r.bestV.v,r.bestV.m,2.6,{badge:false}),document.createTextNode(fullName(r.bestV.v,r.bestV.m,r.bestV.f)))}else bv.textContent='—';
  row.append(bv);
}

/* ---------- settings ---------- */
const TRACK_OPTS=[['random',_t("Aleatória"),_t("Sorteia uma das três toda vez que o jogo abre.")],['kawaii',TRACKS.kawaii.name,TRACKS.kawaii.desc],['rock',TRACKS.rock.name,TRACKS.rock.desc],['hino',TRACKS.hino.name,TRACKS.hino.desc],['off',_t("Sem música"),_t("Só os efeitos.")]];
RENDER.cfg=()=>renderCfg();
function renderNowPlaying(){const e=$('nowPlaying');if(e)e.textContent=MUS.track?_t("tocando: ")+TRACKS[MUS.track].name:SET.track==='off'?_t("desligada"):''}
let fullState=false;
function renderCfg(){
  const tl=$('trackList'); tl.textContent='';
  for(const [k,n,d] of TRACK_OPTS){
    const b=el('button','track'); b.setAttribute('role','radio'); b.setAttribute('aria-checked',SET.track===k?'true':'false');
    b.append(el('b',null,n),el('small',null,d));
    b.onclick=()=>{SET.track=k;saveSettings();audioInit();if(k==='off')playTrack(null);else if(k==='random'){if(!MUS.track)playTrack(LAUNCH_PICK)}else playTrack(k);renderCfg()};
    tl.append(b);
  }
  $('musVol').value=Math.round(SET.musicVol*100); $('musVolOut').textContent=Math.round(SET.musicVol*100)+'%';
  $('sfxVol').value=Math.round(SET.sfxVol*100); $('sfxVolOut').textContent=Math.round(SET.sfxVol*100)+'%';
  const vt=$('voiceToggle'); vt.textContent=_t("Voz cantando no Hino: ")+(SET.voice?_t("ligada"):_t("desligada")); vt.setAttribute('aria-pressed',SET.voice?'true':'false');
  const mt=$('muteToggle'); mt.textContent=AU.muted?_t("Som: desligado"):_t("Som: ligado"); mt.setAttribute('aria-pressed',AU.muted?'true':'false');
  const ft=$('fullToggle'); ft.textContent=fullState?_t("Sair da tela cheia"):_t("Entrar em tela cheia"); ft.setAttribute('aria-pressed',fullState?'true':'false');
  const fs=$('fullStart'); fs.textContent=_t("Abrir o jogo em tela cheia: ")+(SET.fullStart?_t("sim"):_t("não")); fs.setAttribute('aria-pressed',SET.fullStart?'true':'false');
  $('acctInfo').textContent=_t("Nome: {0} · {1}",P.username||'—',netText())+(APP_VER?_t(" · versão {0}",APP_VER):'');
  if(!$('renameIn').value)$('renameIn').value=P.username;
  renderNowPlaying();
  document.querySelectorAll('#langPick [data-lang]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.lang===LANG?'true':'false'));
  const lb=$('lyricsBox'); if(!lb.childElementCount)for(const [sec,lines] of HINO_LYRICS.slice(1)){const d=el('div');d.append(el('b',null,sec));for(const l of lines)d.append(el('p',null,l));lb.append(d)}
}
$('musVol').addEventListener('input',e=>{SET.musicVol=e.target.value/100;$('musVolOut').textContent=e.target.value+'%';applyVolumes();saveSettings()});
$('sfxVol').addEventListener('input',e=>{SET.sfxVol=e.target.value/100;$('sfxVolOut').textContent=e.target.value+'%';applyVolumes();saveSettings()});
$('sfxVol').addEventListener('change',()=>{audioInit();sfx.fibra()});
$('voiceToggle').onclick=()=>{SET.voice=!SET.voice;saveSettings();if(!SET.voice)try{speechSynthesis.cancel()}catch(e){}renderCfg()};
$('muteToggle').onclick=()=>{audioInit();setMute(!AU.muted);renderCfg()};
$('fullToggle').onclick=()=>toggleFull();
document.querySelectorAll('#langPick [data-lang]').forEach(x=>x.onclick=()=>{const l=x.dataset.lang;if(l===LANG)return;sfx.click();confirmDo(_t("Trocar o idioma?"),_t("O jogo reinicia na hora pra trocar todos os textos. Seu progresso fica salvo."),_t("Trocar"),()=>{SET.lang=l;saveSettings();saveProfile();location.reload()})});
$('fullStart').onclick=()=>{SET.fullStart=!SET.fullStart;saveSettings();renderCfg()};
$('renameForm').addEventListener('submit',async e=>{e.preventDefault();$('renameMsg').textContent='';try{await claimUsername($('renameIn').value);$('renameMsg').textContent=_t("Nome trocado!");renderMenu()}catch(err){$('renameMsg').textContent=err.message}});

/* ---------- fullscreen ---------- */
async function toggleFull(){
  if(IS_APP){try{await window.desktop.toggleFullScreen()}catch(e){}return}
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch(e){toast(_t("O navegador não deixou entrar em tela cheia."))}
}
function onFull(v){fullState=v;setTimeout(()=>{fit();if(!$('cfg').hidden)renderCfg();for(const id of panelStack)if(id!=='cfg'&&RENDER[id])RENDER[id](false);if(!$('menu').hidden)renderMenu()},120)}
document.addEventListener('fullscreenchange',()=>onFull(!!document.fullscreenElement));
if(IS_APP&&window.desktop.onFullScreen)window.desktop.onFullScreen(onFull);
addEventListener('resize',()=>{fit();for(const id of panelStack)if(RENDER[id])RENDER[id](false);if(!$('menu').hidden)renderMenu()});

