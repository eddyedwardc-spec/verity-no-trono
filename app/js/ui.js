'use strict';
/* ===== ui: menu, panels (collection, shop, market, friends, profile, ranking, settings), dialogs, boot ===== */

/* ---------- toast & modal ---------- */
let toastTimer=null;
function toast(m,ms=2800){const t=$('toast');t.textContent=m;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,ms)}
function modal(title,body,actions){
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
function confirmDo(title,text,label,fn,cls){modal(title,text,[{label,fn,cls},{label:'Cancelar',cls:'ghost'}])}
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
const TAB={coll:'mine',shop:'boosts',market:'buy',friends:'list',rank:'xp'};
function syncTabs(id){
  const p=$(id);
  p.querySelectorAll('.tab[data-tab]').forEach(t=>t.setAttribute('aria-selected',t.dataset.tab===TAB[id]?'true':'false'));
  p.querySelectorAll('[data-pane]').forEach(pn=>pn.hidden=pn.dataset.pane!==TAB[id]);
}
document.querySelectorAll('.panel').forEach(p=>p.querySelectorAll('.tab[data-tab]').forEach(t=>t.onclick=()=>{TAB[p.id]=t.dataset.tab;syncTabs(p.id);sfx.click();RENDER[p.id]&&RENDER[p.id](true)}));
function updateWallets(){document.querySelectorAll('.wallet').forEach(w=>w.textContent=money(P.money))}
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
    case 'online':return 'Online.';
    case 'conectando':return 'Conectando ao servidor...';
    case 'erro':return 'Sem conexão com o servidor: '+NET.msg+' O jogo continua offline.';
    case 'sem-config':return 'O modo online ainda não foi configurado. Você joga offline por enquanto.';
    case 'atualizando':return 'Baixando a versão nova do jogo. O online volta depois que ele reiniciar.';
    case 'web':return 'No navegador o jogo é offline. Amigos, trocas, mercado e ranking funcionam no app de Windows.';
    default:return 'Offline.';
  }
}
function updateBadges(){
  const n=NET.reqIn.length,t=NET.tradesIn.filter(x=>x.status==='open').length;
  const fb=$('friendBadge'); fb.hidden=!(n+t); fb.textContent=n+t;
  const tb=$('tradeBadge'); tb.hidden=!t; tb.textContent=t;
}

/* ---------- reusable bits ---------- */
function rarChip(vk){const R=RAR[VARS[vk].r],c=el('span','chip',`${R.name} ${stars(VARS[vk].r)}`);c.style.color=R.col;return c}
function mutChip(mk){const M=MUT_BY[mk],c=el('span','chip',mk==='none'?'Sem mutação':`${M.name} ×${M.mult}`);c.style.color=M.col;return c}
function itemCard(it,o={}){
  const V=VARS[it.v],R=RAR[V.r],M=MUT_BY[it.m];
  const b=el('button','icard'); b.type='button'; b.style.setProperty('--rc',R.col+'99'); b.setAttribute('aria-pressed',o.sel?'true':'false');
  b.append(thumbVerity(it.v,it.m,o.em||4.6,{lvl:it.lvl,f:it.f}));
  const nm=el('span','nm',fullName(it.v,it.m,it.f)); if(it.f)nm.style.color=FUSE[it.f].col;else if(it.m!=='none')nm.style.color=M.col;
  const sub=el('span','sub',`${R.name} ${stars(V.r)} · Nv ${it.lvl}`); sub.style.color=R.col;
  b.append(nm,sub,el('span','sub pow','Poder '+fmt(itemPower(it))),el('span','val',money(o.price??itemValue(it))));
  if(o.extra)b.append(el('span','sub',o.extra));
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
  showOnly('menu'); renderMenu(); renderUpdate();
}
/* ---------- auto-update (app only) ---------- */
let UPD={state:'idle',pct:0,ver:''},APP_VER='',updTimer=null;
function renderUpdate(){
  const busy=['available','downloading','ready'].includes(UPD.state);
  const show=IS_APP&&busy&&(S.mode==='menu'||S.mode==='boot');
  $('update').hidden=!show; if(!show)return;
  const ready=UPD.state==='ready';
  $('updTitle').textContent=ready?'Atualização pronta!':`Baixando a versão ${UPD.ver||'nova'}`;
  $('updMsg').textContent=ready?'O jogo vai fechar e abrir de novo já atualizado. Seu progresso fica salvo.':'O jogo está se atualizando sozinho. Leva só um instante.';
  $('updBar').style.width=clamp(UPD.pct||0,0,100)+'%'; $('updBtn').hidden=!ready;
  if(ready&&!updTimer)updTimer=setTimeout(()=>window.desktop.installUpdate(),4000);
}
$('updBtn').onclick=()=>window.desktop.installUpdate();
if(IS_APP){
  window.desktop.onUpdate(s=>{const was=UPD.state;UPD=s;renderUpdate();if(s.state==='available'&&was!=='available'&&playing())toast('Versão nova chegando. Ela instala quando você voltar pro menu.')});
  window.desktop.updateState().then(s=>{UPD=s;renderUpdate()}).catch(()=>{});
  window.desktop.version().then(v=>{APP_VER=v;if(!$('menu').hidden)renderMenu()}).catch(()=>{});
}
function renderMenu(){
  const pc=$('playerCard'); pc.textContent='';
  const L=level(),cur=P.xp-xpAt(L),need=xpAt(L+1)-xpAt(L);
  const nm=el('span','nm'); const dot=el('span','dot'+(online()?' on':NET.status==='erro'?' err':'')); dot.title=netText(); nm.append(dot,document.createTextNode(P.username||'Jogador'));
  const lv=el('span','lv',`Nível ${L} · ${fmt(cur)}/${fmt(need)} XP`); const xb=el('div','xpbar'); const xi=el('i'); xi.style.width=clamp(cur/need*100,0,100)+'%'; xb.append(xi);
  const right=el('div'); right.style.cssText='display:grid;gap:.3em;min-width:0';
  right.append(nm,lv,xb,el('span','mo',money(P.money)));
  pc.append(thumbAvatar(P.eq,4.2),right);
  const b=bathOf(P.eq.bath); $('menuBath').textContent=`${b.name} · sorte ×${b.luck.toFixed(2).replace('.',',')}`+(P.items.length?` · ${P.items.length} Verities`:'')
    +(P.unknown.length?` · ${P.unknown.length} de versão nova (atualize)`:'')+(APP_VER?` · v${APP_VER}`:'');
  const nb=BOSSES[Math.min(P.world.max,WORLDS.length)-1],done=P.world.beaten.includes(nb.world),tp=teamPower();
  const mp=$('menuProg'); mp.textContent='';
  mp.append(document.createTextNode(`Mundo ${P.world.max}/${WORLDS.length} · `));
  if(done&&P.world.beaten.length>=WORLDS.length)mp.append(el('b',null,'Todos os chefes derrotados!'));
  else{mp.append(document.createTextNode('Próximo chefe: '));mp.append(el('b',null,nb.name));mp.append(document.createTextNode(` · Poder ${fmt(tp)} / ${fmt(nb.rec)}`))}
  updateBadges(); updateWallets();
}
$('mPlay').onclick=()=>{audioInit();openPanel('journey')};
function closeAllPanels(){while(panelStack.length)closePanel(panelStack[panelStack.length-1])}
const petSummary=b=>Object.entries(b).filter(([k,v])=>v>0).map(([k,v])=>ABIL[k].txt(v)).join(' · ');

/* ---------- journey ---------- */
RENDER.journey=()=>renderJourney();
function thumbWorld(Wd,em){const c=canvasEl(em);paint(c,100,()=>{circ(50,50,49,Wd.pal.tube);circ(50,50,49,'rgba(0,0,0,.15)');ctx.save();ctx.beginPath();ctx.arc(50,50,49,0,TAU);ctx.clip();for(let i=0;i<4;i++){ctx.strokeStyle=Wd.pal.fold;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(10+i*25,0);ctx.quadraticCurveTo(25+i*25,50,10+i*25,100);ctx.stroke()}ctx.restore();drawVariant(50,56,24,Wd.boss.key,'none',{glow:.3,t:1})});return c}
function renderJourney(){
  const tp=teamPower(); $('jPower').textContent='Poder da equipe: '+fmt(tp);
  $('jHint').textContent='Cada mundo tem Verities que só saem nele. Derrote o chefe pra liberar o próximo mundo e ganhar a Verity dele.';
  const g=$('jGrid'); g.textContent='';
  for(const Wd of WORLDS){
    const B=Wd.boss,open=Wd.n<=P.world.max,beaten=P.world.beaten.includes(Wd.n);
    const c=el('div','wcard'+(open?'':' locked')+(beaten?' done':'')); c.style.setProperty('--wc',Wd.pal.tube);
    const top=el('div','wtop'),tt=el('div'); tt.append(el('b',null,`${Wd.n}. ${Wd.name}`),el('small',null,open?Wd.sub:`Derrote o chefe do mundo ${Wd.n-1}`));
    top.append(thumbWorld(Wd,3.6),tt); c.append(top);
    const ex=el('div','excl');
    if(Wd.pool.length){ex.append(document.createTextNode('Exclusivas: '));for(const [k] of Wd.pool){const got=P.items.some(i=>i.v===k);ex.append(thumbVerity(k,'none',2.2,{locked:!got,badge:false}))}}
    else ex.append(document.createTextNode('As 10 Verities clássicas.'));
    c.append(ex);
    const bl=el('div','bline'); bl.append(document.createTextNode(`Chefe: ${B.name} · `)); const pw=el('span',tp>=B.rec?'ok':'bad',`poder recomendado ${fmt(B.rec)}`); bl.append(pw);
    if(beaten)bl.append(document.createTextNode(' · derrotado ✓')); c.append(bl);
    if(Wd.special)c.append(el('div','bline',SPECIALS[Wd.special]));
    const row=el('div','row'),pl=el('button','btn sm','Jogar'),bs=el('button','btn sm danger',beaten?'Chefe de novo':'Enfrentar chefe');
    pl.disabled=!open; bs.disabled=!open;
    pl.onclick=()=>{closeAllPanels();goCard1(Wd.n)}; bs.onclick=()=>{closeAllPanels();goBoss(Wd.n)};
    row.append(pl,bs); c.append(row); g.append(c);
  }
}
function showBossCard(){
  const B=run.boss; $('bcEyebrow').textContent=`Chefe do mundo ${B.world} · ${run.W.name}`;
  $('bcName').textContent=B.name; $('bcDesc').textContent=B.desc;
  const pic=$('bcPic'); pic.textContent=''; pic.append(thumbVerity(B.key,'none',8,{badge:false}));
  $('bcPower').textContent=`Poder recomendado ${fmt(B.rec)}. Sua equipe: ${fmt(run.power)}.`+(run.power<B.rec?' Vai ser difícil: dê upgrade, funda ou troque a equipe.':' Você está forte o bastante.')+(petSummary(run.pet)?' Pets: '+petSummary(run.pet)+'.':'');
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
$('mQuit').onclick=()=>confirmDo('Sair do jogo?','Seu progresso já está salvo.','Sair',()=>{window.desktop&&window.desktop.quit()});

/* ---------- setup ---------- */
$('setupForm').addEventListener('submit',async e=>{
  e.preventDefault(); const n=$('setupName').value; $('setupErr').textContent='';
  try{await claimUsername(n);sfx.buy();goMenu()}catch(err){$('setupErr').textContent=err.message;sfx.err()}
});

/* ---------- run screens ---------- */
function showCard1(){
  const act=Object.keys(BOOSTS).filter(k=>(P.boosts[k]||0)>0).map(k=>BOOSTS[k].name);
  const b=bathOf(P.eq.bath);
  $('card1Boosts').textContent=`Banheiro: ${b.name} (sorte ×${b.luck.toFixed(2).replace('.',',')}).`+(act.length?` Boosts que vão ser usados agora: ${act.join(', ')}.`:' Nenhum boost ativo.');
  $('card1World').textContent=`Mundo ${run.world}: ${run.W.name}.`+(run.W.special?' '+SPECIALS[run.W.special]:'')+` Equipe com ${fmt(run.power)} de poder`+(petSummary(run.pet)?': '+petSummary(run.pet)+'.':'.');
  showOnly('card1');
}
$('go1').onclick=()=>{audioInit();startP1()};
$('back1').onclick=()=>{goMenu();openPanel('journey')};
function showCard2Screen(){
  const f=run.fiber,c=Math.round(run.p1Comfort),I=INTRUDERS[run.intr]||INTRUDERS.irmao;
  $('c2lead').textContent=`Conforto ${c}%${f>0?` e ${f} fibra${f>1?'s':''}`:', nenhuma fibra'}. A variante já está decidida. A mutação depende de você agora.`;
  $('c2door').textContent=`${I.name} vai bater na porta. Aperte E ou OCUPADO! a tempo. Se você não responder, ${I.name} entra no banheiro e a partida é cancelada.`;
  showOnly('card2');
}
$('go2').onclick=()=>{audioInit();startP2()};
function showFail(stage){
  const I=INTRUDERS[run.intr]||INTRUDERS.irmao;
  if(stage===1){$('failEyebrow').textContent='Etapa 1 · O Intestino';$('failTitle').textContent='A cólica venceu';$('failMsg').textContent='Você se contorceu tanto que desistiu. A Verity continua aí dentro, sorrindo.';$('retryBtn').textContent='Tentar de novo'}
  else if(stage===2){$('failEyebrow').textContent='Etapa 2 · O Trono';$('failTitle').textContent='Desmaiou no vaso';$('failMsg').textContent=pick(['Força demais. Acordou vinte minutos depois com a marca do assento na bunda.','A veia estourou o limite. Você viu uma luz amarela. Era só a Verity.']);$('retryBtn').textContent='Tentar o trono de novo'}
  else if(stage==='boss'){$('failEyebrow').textContent='Chefe · '+run.boss.name;$('failTitle').textContent='O tempo acabou';$('failMsg').textContent=`Faltaram ${fmt(run.boss.hp)} de vida. Mais poder na equipe ajuda: upgrade, fusão ou Verities melhores.`;$('retryBtn').textContent='Lutar de novo'}
  else{$('failEyebrow').textContent='Invasão!';$('failTitle').textContent=`${I.name} entrou no banheiro`;$('failMsg').textContent='A Verity voltou pra dentro de vergonha. A partida foi cancelada e você não ganhou nada.';$('retryBtn').textContent='Jogar de novo'}
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
  $('rsVal').textContent='Vale '+money(itemValue(r.item));
  const tags=[];if(r.newVar)tags.push('variante nova!');if(r.newMut)tags.push('mutação nova!');if(r.isBest)tags.push('novo recorde!');
  const bi=r.boss; if(bi){if(bi.first)tags.unshift('primeira vitória');tags.push('+'+money(bi.cash));if(bi.unlocked)tags.push('mundo liberado: '+bi.unlocked);if(bi.newSlot)tags.push('nova vaga de pet!');if(!bi.drop)tags.push('o chefe não deixou a Verity dele dessa vez')}
  $('rsSub').textContent=(tags.length?tags.join(' · ')+' · ':'')+'guardada na coleção';
  $('stCom').textContent=Math.round(run.p1Comfort)+'%'; $('stCombo').textContent='×'+r.maxCombo;
  $('stDoor').textContent=`${run.knockOk}/${run.knockOk+run.knockMiss}`; $('stThrone').textContent=fmt(r.T);
  $('stScore').textContent=fmt(r.score); $('stBest').textContent=fmt(P.best);
  const L=r.lvAfter,cur=P.xp-xpAt(L),need=xpAt(L+1)-xpAt(L);
  $('rsXp').textContent=`+${fmt(r.xpGain)} XP · Nível ${L}`+(L>r.lvBefore?` · SUBIU DE NÍVEL! +${money(r.reward)}`:'');
  $('rsXpBar').style.width=clamp(cur/need*100,0,100)+'%';
  if(L>r.lvBefore)sfx.up();
  const sb=$('rsSell'); sb.disabled=false; sb.textContent='Vender ('+money(sellPrice(r.item))+')';
  $('rsFlush').disabled=false;
  $('results').hidden=false; $('rsAgain').focus({preventScroll:true});
}
$('rsAgain').onclick=()=>{audioInit();$('results').hidden=true;if(lastResult&&lastResult.boss&&P.world.max>lastResult.world){goMenu();openPanel('journey')}else if(run&&run.boss)goBoss(run.world);else goCard1(run?run.world:1)};
$('rsMenu').onclick=()=>{$('results').hidden=true;goMenu()};
$('rsFlush').onclick=()=>{if(flushToilet())$('rsFlush').disabled=true};
$('rsSell').onclick=()=>{
  const it=lastResult&&P.items.find(x=>x.id===lastResult.item.id); if(!it){toast('Essa Verity não está mais na coleção.');return}
  confirmDo('Vender pro jogo?',`${fullName(it.v,it.m,it.f)} por ${money(sellPrice(it))} (70% do valor). No mercado você pode pedir mais.`,'Vender',()=>{if(act(()=>sellItem(it.id),'Vendida!','coin'))$('rsSell').disabled=true});
};

/* ---------- collection ---------- */
let collSel=null;
$('collSort').onchange=()=>renderColl(false);
RENDER.coll=()=>{renderColl()};
function renderColl(){
  if(TAB.coll==='index'){renderIndex();return}
  const g=$('collGrid'); g.textContent='';
  const items=sortItems(P.items,$('collSort').value),f=featured();
  $('collCount').textContent=`${P.items.length} Verities · valor total ${money(totalValue())}`;
  renderTeamBar();
  if(!items.length)g.append(el('p','empty','Nenhuma Verity ainda. Jogue uma partida pra começar a coleção.'));
  if(!items.some(i=>i.id===collSel))collSel=items[0]?items[0].id:null;
  for(const it of items)g.append(itemCard(it,{sel:it.id===collSel,tag:P.pets.includes(it.id)?'EQUIPE':f&&f.id===it.id?'VITRINE':null,onClick:()=>{collSel=it.id;sfx.click();renderColl()}}));
  renderCollDetail(P.items.find(i=>i.id===collSel));
}
function renderCollDetail(it){
  const d=$('collDetail'); d.textContent=''; ANIM.coll=null;
  if(!it){d.append(el('p','empty','Escolha uma Verity.'));return}
  const c=canvasEl(15,'prev'); d.append(c);
  ANIM.coll=()=>drawPrev(c,()=>drawVariant(50,(it.v==='lord'||it.v==='exu')?58:52,24,it.v,it.m,{glow:1,lvl:it.lvl,f:it.f}));
  ANIM.coll();
  const box=el('div','detail');
  const nm=el('p','vname',fullName(it.v,it.m,it.f)); if(it.f)nm.style.color=FUSE[it.f].col;else if(it.m!=='none')nm.style.color=MUT_BY[it.m].col;
  const chips=el('p','chips'); chips.append(rarChip(it.v),mutChip(it.m)); if(it.f){const fc=el('span','chip',FUSE[it.f].name+' ×'+FUSE[it.f].pow+' poder');fc.style.color=FUSE[it.f].col;chips.append(fc)}
  const lv=el('div','lvl'); lv.append(el('span',null,`Nível ${it.lvl}/${MAX_LVL} · +8% de valor por nível`)); const xb=el('div','xpbar'),xi=el('i'); xi.style.width=(it.lvl/MAX_LVL*100)+'%'; xb.append(xi); lv.append(xb);
  const pw=el('p','vname','Poder '+fmt(itemPower(it))); pw.style.color='var(--mint)';
  const ab=VARS[it.v].abil; box.append(nm,chips,pw,el('p','small',ab?'Como pet · '+abilText([ab[0],ab[1]*(1+(it.f||0)*.5)]):'Sem habilidade de pet.'),el('p','vname',money(itemValue(it))),lv);
  const acts=el('div','actions');
  const up=el('button','btn sm',it.lvl>=MAX_LVL?'Nível máximo':`Upgrade pro Nv ${it.lvl+1} · ${money(upCost(it))}`); up.disabled=it.lvl>=MAX_LVL||P.money<upCost(it);
  up.onclick=()=>act(()=>upgradeItem(it.id),`Nível ${it.lvl+1}!`,'up');
  const sell=el('button','btn ghost sm',`Vender pro jogo · ${money(sellPrice(it))}`);
  sell.onclick=()=>confirmDo('Vender pro jogo?',`${fullName(it.v,it.m,it.f)} Nv ${it.lvl} por ${money(sellPrice(it))} (70% do valor).`,'Vender',()=>act(()=>sellItem(it.id),'Vendida!','coin'));
  const mk=el('button','btn ghost sm','Anunciar no mercado'); mk.disabled=!online(); if(!online())mk.title=netText();
  mk.onclick=()=>promptListing(it);
  const isF=featured()&&featured().id===it.id;
  const vt=el('button','btn ghost sm',isF?'Está na vitrine':'Pôr na vitrine'); vt.disabled=isF; vt.onclick=()=>{setFeatured(it.id);toast('Na vitrine!');sfx.click()};
  const inTeam=P.pets.includes(it.id),pt=el('button','btn sm',inTeam?'Tirar da equipe':'Pôr na equipe');
  pt.onclick=()=>{toast(togglePet(it.id));sfx.click()};
  const grp=fuseGroup(it).length,fu=el('button','btn ghost sm',(it.f||0)>=2?'Fusão máxima':`Fundir 5 iguais (${grp}/5) · ${money(fuseCost(it))}`);
  fu.disabled=(it.f||0)>=2||grp<5||P.money<fuseCost(it);
  fu.title='5 Verities iguais (mesma variante, mutação e fusão) viram 1 '+((it.f||0)?'Arco-íris':'Dourada')+', bem mais forte.';
  fu.onclick=()=>confirmDo('Fundir?',`5 × ${fullName(it.v,it.m,it.f)} viram 1 ${fullName(it.v,it.m,(it.f||0)+1)}. Custa ${money(fuseCost(it))}. O nível fica o maior entre elas.`,'Fundir',()=>{if(act(()=>fuseItem(it.id),'Fusão feita!','up')){collSel=LAST_FUSED;renderColl()}});
  acts.append(pt,up,fu,sell,mk,vt); box.append(acts);
  if(!online())box.append(el('p','small','Mercado e trocas: '+netText()));
  d.append(box);
}
function renderTeamBar(){
  const tb=$('teamBar'); tb.textContent=''; const tm=team(),n=petSlots();
  const sl=el('div','slots');
  for(let i=0;i<5;i++){
    const it=tm[i],b=el('button','slot');
    if(i>=n){b.textContent='🔒';b.title='Mais vagas ao derrotar o 3º e o 6º chefe';b.disabled=true}
    else if(it){b.append(thumbVerity(it.v,it.m,3.2,{badge:false,f:it.f}));b.title=fullName(it.v,it.m,it.f);b.onclick=()=>{collSel=it.id;renderColl()}}
    else b.textContent='vazio';
    sl.append(b);
  }
  const info=el('div','tinfo'); info.append(el('span',null,'Sua equipe'),el('b',null,'Poder '+fmt(teamPower())),el('span',null,petSummary(petBonus())||'Coloque Verities na equipe pelo painel ao lado.'));
  const auto=el('button','btn ghost sm','Montar a mais forte'); auto.onclick=()=>{autoTeam();saveProfile();toast('Equipe montada!');sfx.click()};
  tb.append(sl,info,auto);
}
function promptListing(it){
  const inp=el('input','input'); inp.type='number'; inp.min='1'; inp.value=String(itemValue(it)); inp.setAttribute('aria-label','Preço');
  modal('Anunciar no mercado',[el('p','small',`${fullName(it.v,it.m,it.f)} Nv ${it.lvl} · valor ${money(itemValue(it))}. Ela sai da sua coleção enquanto o anúncio estiver aberto.`),inp],
    [{label:'Anunciar',fn:async()=>{await listItem(it.id,inp.value);toast('Anúncio publicado!');sfx.coin()}},{label:'Cancelar',cls:'ghost'}]);
}
function renderIndex(){
  const box=$('collIndex'); box.textContent='';
  box.append(el('p','ptitle','Variantes · da mais rara pra mais comum'),el('p','small','A variante depende do conforto com que ela chega no fim do intestino. Banheiros melhores e o boost Sorte de Variante puxam pra cima.'));
  const lad=el('div','ladder');
  for(let r=RAR.length-1;r>=0;r--){
    const R=RAR[r],row=el('div','lad'); row.style.setProperty('--rc',R.col);
    const tier=el('div','tier'); tier.append(el('b',null,R.name),el('small',null,stars(r))); row.append(tier);
    const mem=el('div','members');
    for(const vk of VAR_ORDER.filter(k=>VARS[k].r===r)){
      const got=P.items.filter(i=>i.v===vk).length,m=el('div','mem');
      const t=el('span'); t.append(document.createTextNode(got?VARS[vk].name:'???'),el('small',null,`base ${money(VARS[vk].base)} · ${VARS[vk].hint}${got?` · você tem ${got}`:''}`));
      m.append(thumbVerity(vk,'none',3.4,{locked:!got}),t); mem.append(m);
    }
    row.append(mem); lad.append(row);
  }
  box.append(lad);
  box.append(el('p','ptitle','Mutações · multiplicam o valor'),el('p','small','A chance sobe com os pontos do trono (combo e porta), com o banheiro e com o boost Sorte de Mutação. As melhores também pedem um mínimo de pontos.'));
  const ml=el('div','ladder');
  for(let i=MUTS.length-1;i>=1;i--){
    const M=MUTS[i],row=el('div','lad'); row.style.setProperty('--rc',M.col);
    const tier=el('div','tier'); tier.append(el('b',null,M.name),el('small',null,`×${M.mult} no valor`)); row.append(tier);
    const got=P.items.filter(x=>x.m===M.k).length,m=el('div','mem'),t=el('span');
    t.append(document.createTextNode(got?`Você tem ${got}`:'Ainda não achou'),el('small',null,M.min?`precisa de ${M.min}+ pontos de trono`:'qualquer pontuação'));
    m.append(thumbVerity('verity',M.k,3.4),t); row.append(m); ml.append(row);
  }
  box.append(ml,el('p','notice','Valor = base da variante × multiplicador da mutação × nível (+8% por nível). Exemplo: Galaxy Moggity Nv 1 = 600 × 30 = V$ 18.000.'));
}

/* ---------- shop ---------- */
let lookCat='skin',shopPrev={kind:'eq',eq:null};
RENDER.shop=()=>renderShop();
function renderShop(){
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
    main.append(el('p','small','Cada compra dá 1 carga. As cargas são gastas sozinhas na próxima partida que você começar.'));
    for(const [k,b] of Object.entries(BOOSTS)){
      const have=P.boosts[k]||0;
      g.append(card(null,b.name,b.desc+(have?` · você tem ${have}`:''),money(b.price),'Comprar',P.money<b.price,()=>act(()=>buyBoost(k),b.name+' comprado!')));
    }
    shopPrev={kind:'verity'};
    info.append(el('p','ptitle','Seus boosts'));
    const owned=Object.keys(BOOSTS).filter(k=>P.boosts[k]>0);
    info.append(el('p','small',owned.length?owned.map(k=>`${BOOSTS[k].name} ×${P.boosts[k]}`).join(' · '):'Nenhum ainda.'));
  }else if(tab==='baths'){
    main.append(el('p','small','Cada banheiro aumenta a sorte de variante e de mutação. A sorte cresce em escala logarítmica: sorte = 1 + 0,2 × log₂(nível do banheiro). Compre em ordem.'));
    for(const b of BATHS){
      const own=P.owned.bath.includes(b.tier),eq=P.eq.bath===b.tier,prevOwn=P.owned.bath.includes(b.tier-1)||b.tier===1;
      const lab=eq?'Equipado':own?'Usar':'Comprar';
      g.append(card(null,`${b.tier}. ${b.name}`,`Sorte ×${b.luck.toFixed(2).replace('.',',')}`,own?'Seu':money(b.price),lab,eq||(!own&&(!prevOwn||P.money<b.price)),
        ()=>own?act(()=>equipBath(b.tier),b.name+' equipado!','click'):act(()=>buyBath(b.tier),b.name+' é seu!'),
        ()=>{shopPrev={kind:'bath',bath:b.tier}},own));
    }
    shopPrev=shopPrev.kind==='bath'?shopPrev:{kind:'bath',bath:P.eq.bath};
    info.append(el('p','small','O banheiro aparece no menu e na hora de fazer força.'));
  }else if(tab==='look'){
    const st=el('div','subtabs');
    for(const [c,def] of Object.entries(COS)){const p=el('button','pick',def.label);p.setAttribute('aria-pressed',c===lookCat?'true':'false');p.onclick=()=>{lookCat=c;sfx.click();renderShop()};st.append(p)}
    main.append(st);
    for(const [k,it] of Object.entries(COS[lookCat].items)){
      const own=P.owned[lookCat].includes(k),eq=P.eq[lookCat]===k,tryEq={...P.eq,[lookCat]:k};
      g.append(card(thumbAvatar(tryEq,4.4),it.name,COS[lookCat].label,own?'Seu':money(it.price),eq?'Equipado':own?'Usar':'Comprar',eq||(!own&&P.money<it.price),
        ()=>own?act(()=>equipCos(lookCat,k),it.name+' equipado!','click'):act(()=>buyCos(lookCat,k),it.name+' é seu!'),
        ()=>{shopPrev={kind:'eq',eq:tryEq}},own));
    }
    if(shopPrev.kind!=='eq'||!shopPrev.eq)shopPrev={kind:'eq',eq:{...P.eq}};
    info.append(el('p','small','Passe o mouse num item pra experimentar.'));
  }else{
    main.append(el('p','small','Escolha quem bate na porta enquanto você faz força. Se você não responder a tempo, essa pessoa entra e a partida é cancelada.'));
    for(const [k,it] of Object.entries(INTRUDERS)){
      const own=P.owned.intr.includes(k),eq=P.eq.intr===k;
      g.append(card(thumbIntruder(k,5),it.name,`“${it.knock}”`,own?'Seu':money(it.price),eq?'Equipado':own?'Usar':'Comprar',eq||(!own&&P.money<it.price),
        ()=>own?act(()=>equipIntr(k),it.name+' vai bater na porta!','click'):act(()=>buyIntr(k),it.name+' é seu!'),
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
    if(mkLoading&&!mkList){g.append(el('p','empty','Carregando anúncios...'));return}
    const list=(mkList||[]).filter(l=>l.status==='open').sort((a,b)=>(b.at||0)-(a.at||0));
    if(!list.length)g.append(el('p','empty','Nenhuma Verity à venda agora. Anuncie a sua pela Coleção.'));
    for(const l of list){
      const mine=l.seller===NET.uid,c=itemCard(sanitizeItem(l.item),{price:l.price,extra:'vendido por '+String(l.sellerName||'?').slice(0,20)});
      const b=el('button','btn sm',mine?'Seu anúncio':'Comprar'); b.disabled=mine||P.money<l.price;
      b.onclick=e=>{e.stopPropagation();confirmDo('Comprar?',`${fullName(l.item.v,l.item.m,l.item.f)} Nv ${l.item.lvl} por ${money(l.price)}.`,'Comprar',async()=>{await buyListing(l);toast('Comprada! Já está na sua coleção.');sfx.buy();loadMarket()})};
      c.append(b); g.append(c);
    }
  }else{
    const list=NET.myListings;
    if(!list.length)g.append(el('p','empty','Você não anunciou nada ainda. Anuncie pela Coleção.'));
    for(const l of list){
      const st=l.status==='open'?'à venda':l.status==='sold'?`vendida pra ${l.buyerName||'alguém'}`:'cancelado';
      const c=itemCard(sanitizeItem(l.item),{price:l.price,extra:st});
      if(l.status==='open'){const b=el('button','btn ghost sm','Cancelar');b.onclick=e=>{e.stopPropagation();confirmDo('Cancelar anúncio?','A Verity volta pra sua coleção.','Cancelar anúncio',async()=>{await cancelListing(l);toast('Anúncio cancelado.')})};c.append(b)}
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
  try{const r=await sendFriendRequest(n);$('addMsg').textContent=r==='accepted'?'Vocês agora são amigos!':'Pedido enviado. Quando aceitarem, aparece aqui.';$('addName').value='';sfx.ok();loadFriends()}
  catch(err){$('addMsg').textContent=err.message;sfx.err()}
});
function renderFriends(){
  $('frNotice').textContent=online()?'':netText();
  $('addFriend').hidden=!online();
  const rq=$('frReqs'); rq.textContent='';
  if(online()&&NET.reqIn.length){
    rq.append(el('p','ptitle','Pedidos de amizade'));
    const rows=el('div','rows');
    for(const r of NET.reqIn){
      const row=el('div','lrow'); row.append(el('span','pos','?'));
      const nm=el('span','lname'); nm.append(el('b',null,String(r.fromName||'?').slice(0,20)),el('small',null,'quer ser seu amigo')); row.append(nm);
      const bt=el('div','row'); const a=el('button','btn sm','Aceitar'),d=el('button','btn ghost sm','Recusar');
      a.onclick=async()=>{try{await acceptFriend(r);toast('Novo amigo!');sfx.ok();loadFriends()}catch(e){toast(e.message)}};
      d.onclick=async()=>{try{await declineFriend(r)}catch(e){toast(e.message)}};
      bt.append(a,d); row.append(bt); rows.append(row);
    }
    rq.append(rows);
  }
  if(online()&&NET.reqOut.length)rq.append(el('p','small','Esperando resposta de: '+NET.reqOut.map(r=>r.toName).join(', ')));
  const fl=$('frList'); fl.textContent='';
  if(online()){
    fl.append(el('p','ptitle',`Seus amigos (${P.friends.length})`));
    if(friendsLoading&&!friendsCache)fl.append(el('p','empty','Carregando...'));
    else if(!P.friends.length)fl.append(el('p','empty','Você ainda não tem amigos aqui. Adicione pelo username.'));
    for(const f of friendsCache||[]){
      const row=el('div','lrow'); row.append(thumbAvatar(f.eq,3.2));
      const top=f.items.reduce((b,i)=>!b||itemValue(i)>itemValue(b)?i:b,null);
      const nm=el('span','lname'); nm.append(el('b',null,f.username),el('small',null,`Nível ${f.level} · ${f.items.length} Verities · recorde ${fmt(f.best)}${top?` · melhor: ${fullName(top.v,top.m,top.f)}`:''}`)); row.append(nm);
      const bt=el('div','row'); const v=el('button','btn sm','Ver coleção e trocar'),x=el('button','btn ghost sm','Remover');
      v.onclick=()=>openProfile(f.uid); x.onclick=()=>confirmDo('Remover amigo?',`${f.username} sai da sua lista.`,'Remover',()=>{removeFriend(f.uid);friendsCache=(friendsCache||[]).filter(y=>y.uid!==f.uid);renderFriends()});
      bt.append(v,x); row.append(bt); fl.append(row);
    }
  }
  renderTrades();
}
function tradeRow(t,incoming){
  const row=el('div','trade');
  const a=el('div','side'),b=el('div','side');
  const recv=incoming?(t.give||[]):(t.want||[]),give=incoming?(t.want||[]):(t.give||[]);
  a.append(el('b',null,'Você recebe'),smallThumbs(recv.map(sanitizeItem).filter(Boolean))); if(hasUnknown(recv))a.append(el('span','small err','+ Verity de versão nova: atualize o jogo')); if(incoming&&t.money)a.append(el('span','chip gold','+ '+money(t.money)));
  b.append(el('b',null,'Você dá'),smallThumbs(give.map(sanitizeItem).filter(Boolean))); if(!incoming&&t.money)b.append(el('span','chip gold','+ '+money(t.money)));
  const who=el('span','st',(incoming?'de ':'pra ')+String(incoming?t.fromName:t.toName).slice(0,20));
  const st={open:'aberta',accepted:'aceita',declined:'recusada',canceled:'cancelada'}[t.status]||t.status;
  const ctl=el('div','row');
  if(t.status==='open'){
    if(incoming){const y=el('button','btn sm','Aceitar'),n=el('button','btn ghost sm','Recusar');
      y.onclick=()=>confirmDo('Aceitar a troca?','As Verities trocam de dono na hora.','Aceitar',async()=>{await acceptTrade(t);toast('Troca feita!');sfx.buy()});
      n.onclick=async()=>{try{await declineTrade(t);toast('Troca recusada.')}catch(e){toast(e.message)}};ctl.append(y,n)}
    else{const c=el('button','btn ghost sm','Cancelar');c.onclick=async()=>{try{await cancelTrade(t);toast('Troca cancelada. Suas Verities voltaram.')}catch(e){toast(e.message)}};ctl.append(c)}
  }else ctl.append(el('span','st',st));
  const mid=el('div','side'); mid.append(who,el('span','arrow','⇄'));
  row.append(a,mid,b,ctl); return row;
}
function renderTrades(){
  const box=$('trList'); box.textContent='';
  if(!online()){box.append(el('p','notice',netText()));return}
  const openIn=NET.tradesIn.filter(t=>t.status==='open'),openOut=NET.tradesOut.filter(t=>t.status==='open');
  const closed=[...NET.tradesIn,...NET.tradesOut].filter(t=>t.status!=='open').sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,10);
  box.append(el('p','ptitle','Recebidas'));
  if(!openIn.length)box.append(el('p','empty','Nenhuma proposta pra você agora.')); else{const r=el('div','rows');openIn.forEach(t=>r.append(tradeRow(t,true)));box.append(r)}
  box.append(el('p','ptitle','Enviadas'));
  if(!openOut.length)box.append(el('p','empty','Pra propor uma troca, abra a coleção de um amigo.')); else{const r=el('div','rows');openOut.forEach(t=>r.append(tradeRow(t,false)));box.append(r)}
  if(closed.length){box.append(el('p','ptitle','Histórico'));const r=el('div','rows');closed.forEach(t=>r.append(tradeRow(t,t.to===NET.uid)));box.append(r)}
}

/* ---------- friend profile ---------- */
let pf=null,pfSel=new Set();
async function openProfile(uid){
  pf=null; pfSel=new Set(); openPanel('profile');
  try{pf=await fetchPlayer(uid);if(!pf)throw new Error('Perfil não encontrado.')}catch(e){toast(e.message);closePanel('profile');return}
  renderProfile();
}
RENDER.profile=()=>renderProfile();
function renderProfile(){
  const g=$('pfGrid'); g.textContent=''; const info=$('pfInfo'); info.textContent='';
  if(!pf){$('pfTitle').textContent='Carregando...';ANIM.profile=null;return}
  $('pfTitle').textContent=pf.username;
  const tmr=el('div','row'); for(const it of pf.pets)tmr.append(thumbVerity(it.v,it.m,3,{badge:false,f:it.f}));
  info.append(el('p','vname',pf.username),el('p','small',`Nível ${pf.level} · Mundo ${pf.world} · Poder ${fmt(pf.power)}`),tmr,el('p','small',`Recorde ${fmt(pf.best)} · ${money(pf.money)}`),el('p','small',`${pf.items.length} Verities · coleção vale ${money(totalValue(pf.items))}`));
  const items=sortItems(pf.items,'val');
  if(!items.length)g.append(el('p','empty','Coleção vazia.'));
  for(const it of items)g.append(itemCard(it,{sel:pfSel.has(it.id),onClick:()=>{pfSel.has(it.id)?pfSel.delete(it.id):pfSel.add(it.id);sfx.click();renderProfile()}}));
  const tb=$('pfTrade'); tb.disabled=!pfSel.size; tb.textContent=pfSel.size?`Propor troca (${pfSel.size} pedida${pfSel.size>1?'s':''})`:'Propor troca';
  const c=$('pfPrev'); ANIM.profile=()=>drawPrev(c,()=>{ctx.save();ctx.translate(50,-30);ctx.scale(.24,.24);ctx.translate(-270,0);drawSeated(pf.eq,bathOf(1),{F:0,strain:0});ctx.restore()}); ANIM.profile();
}
$('pfTrade').onclick=()=>{
  if(!pf||!pfSel.size)return;
  const want=pf.items.filter(i=>pfSel.has(i.id)),give=new Set();
  const grid=el('div','igrid'),cash=el('input','input sm'); cash.type='number'; cash.min='0'; cash.value='0'; cash.setAttribute('aria-label','Dinheiro oferecido');
  const sum=el('p','small');
  const upd=()=>{const gv=P.items.filter(i=>give.has(i.id));sum.textContent=`Você pede ${want.length} (valor ${money(totalValue(want))}) e oferece ${gv.length} (valor ${money(totalValue(gv))}) + ${money(+cash.value||0)}.`};
  const draw=()=>{grid.textContent='';for(const it of sortItems(P.items,'val'))grid.append(itemCard(it,{em:3.6,sel:give.has(it.id),onClick:()=>{give.has(it.id)?give.delete(it.id):give.add(it.id);draw();upd()}}));if(!P.items.length)grid.append(el('p','empty','Você não tem Verities pra oferecer.'))};
  cash.oninput=upd; draw(); upd();
  const lab=el('label','row left'); lab.append(el('span','small','Dinheiro junto:'),cash);
  modal(`Troca com ${pf.username}`,[el('p','small','Escolha o que você oferece. Suas Verities ficam guardadas na proposta até a outra pessoa responder.'),grid,lab,sum],
    [{label:'Enviar proposta',fn:async()=>{await proposeTrade(pf.uid,pf.username,[...give],want,cash.value);toast('Proposta enviada!');sfx.ok();pfSel.clear();renderProfile()}},{label:'Cancelar',cls:'ghost'}]);
};

/* ---------- ranking ---------- */
let rkData={},rkLoading=false;
RENDER.rank=fresh=>{if(fresh)loadRank();renderRank()};
async function loadRank(){if(!online()||rkLoading)return;rkLoading=true;renderRank();try{rkData[TAB.rank]=await fetchRanking(TAB.rank)}catch(e){toast(e.message)}rkLoading=false;renderRank()}
function renderRank(){
  const box=$('rkList'); box.textContent=''; $('rkNotice').textContent=online()?'':netText();
  if(!online()){
    const row=el('div','lrow rkrow me'); fillRankRow(row,1,{username:P.username||'Você',level:level(),power:teamPower(),best:P.best,money:P.money,totalValue:totalValue(),bestV:featured(),eq:P.eq}); box.append(row); return;
  }
  const list=rkData[TAB.rank];
  if(!list){box.append(el('p','empty',rkLoading?'Carregando ranking...':'Sem dados.'));return}
  if(!list.length)box.append(el('p','empty','Ninguém no ranking ainda.'));
  list.forEach((r,i)=>{const row=el('div','lrow rkrow'+(r.uid===NET.uid?' me':''));fillRankRow(row,i+1,r);box.append(row)});
}
function fillRankRow(row,pos,r){
  const hl=k=>TAB.rank===k?'c hl':'c';
  row.append(el('span','pos',String(pos)),thumbAvatar(r.eq,3));
  const nm=el('span','lname'); nm.append(el('b',null,r.username),el('small',null,`Nível ${r.level}`)); row.append(nm);
  const col=(k,lab,v)=>{const c=el('span',hl(k));c.append(el('small',null,lab),document.createTextNode(v));return c};
  row.append(col('xp','Nível',String(r.level)),col('power','Poder',fmt(r.power||0)),col('best','Recorde',fmt(r.best)),col('money','Dinheiro',money(r.money)),col('totalValue','Coleção',money(r.totalValue)));
  const bv=el('span','bv'); if(r.bestV){bv.append(thumbVerity(r.bestV.v,r.bestV.m,2.6,{badge:false}),document.createTextNode(fullName(r.bestV.v,r.bestV.m,r.bestV.f)))}else bv.textContent='—';
  row.append(bv);
}

/* ---------- settings ---------- */
const TRACK_OPTS=[['random','Aleatória','Sorteia uma das três toda vez que o jogo abre.'],['kawaii',TRACKS.kawaii.name,TRACKS.kawaii.desc],['rock',TRACKS.rock.name,TRACKS.rock.desc],['hino',TRACKS.hino.name,TRACKS.hino.desc],['off','Sem música','Só os efeitos.']];
RENDER.cfg=()=>renderCfg();
function renderNowPlaying(){const e=$('nowPlaying');if(e)e.textContent=MUS.track?'tocando: '+TRACKS[MUS.track].name:SET.track==='off'?'desligada':''}
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
  const vt=$('voiceToggle'); vt.textContent='Voz cantando no Hino: '+(SET.voice?'ligada':'desligada'); vt.setAttribute('aria-pressed',SET.voice?'true':'false');
  const mt=$('muteToggle'); mt.textContent=AU.muted?'Som: desligado':'Som: ligado'; mt.setAttribute('aria-pressed',AU.muted?'true':'false');
  const ft=$('fullToggle'); ft.textContent=fullState?'Sair da tela cheia':'Entrar em tela cheia'; ft.setAttribute('aria-pressed',fullState?'true':'false');
  const fs=$('fullStart'); fs.textContent='Abrir o jogo em tela cheia: '+(SET.fullStart?'sim':'não'); fs.setAttribute('aria-pressed',SET.fullStart?'true':'false');
  $('acctInfo').textContent=`Nome: ${P.username||'—'} · ${netText()}`+(APP_VER?` · versão ${APP_VER}`:'');
  if(!$('renameIn').value)$('renameIn').value=P.username;
  renderNowPlaying();
  const lb=$('lyricsBox'); if(!lb.childElementCount)for(const [sec,lines] of HINO_LYRICS.slice(1)){const d=el('div');d.append(el('b',null,sec));for(const l of lines)d.append(el('p',null,l));lb.append(d)}
}
$('musVol').addEventListener('input',e=>{SET.musicVol=e.target.value/100;$('musVolOut').textContent=e.target.value+'%';applyVolumes();saveSettings()});
$('sfxVol').addEventListener('input',e=>{SET.sfxVol=e.target.value/100;$('sfxVolOut').textContent=e.target.value+'%';applyVolumes();saveSettings()});
$('sfxVol').addEventListener('change',()=>{audioInit();sfx.fibra()});
$('voiceToggle').onclick=()=>{SET.voice=!SET.voice;saveSettings();if(!SET.voice)try{speechSynthesis.cancel()}catch(e){}renderCfg()};
$('muteToggle').onclick=()=>{audioInit();setMute(!AU.muted);renderCfg()};
$('fullToggle').onclick=()=>toggleFull();
$('fullStart').onclick=()=>{SET.fullStart=!SET.fullStart;saveSettings();renderCfg()};
$('renameForm').addEventListener('submit',async e=>{e.preventDefault();$('renameMsg').textContent='';try{await claimUsername($('renameIn').value);$('renameMsg').textContent='Nome trocado!';renderMenu()}catch(err){$('renameMsg').textContent=err.message}});

/* ---------- fullscreen ---------- */
async function toggleFull(){
  if(IS_APP){try{await window.desktop.toggleFullScreen()}catch(e){}return}
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch(e){toast('O navegador não deixou entrar em tela cheia.')}
}
function onFull(v){fullState=v;setTimeout(()=>{fit();if(!$('cfg').hidden)renderCfg();for(const id of panelStack)if(id!=='cfg'&&RENDER[id])RENDER[id](false);if(!$('menu').hidden)renderMenu()},120)}
document.addEventListener('fullscreenchange',()=>onFull(!!document.fullscreenElement));
if(IS_APP&&window.desktop.onFullScreen)window.desktop.onFullScreen(onFull);
addEventListener('resize',()=>{fit();for(const id of panelStack)if(RENDER[id])RENDER[id](false);if(!$('menu').hidden)renderMenu()});

/* ---------- boot ---------- */
const firstGesture=()=>{audioInit();removeEventListener('pointerdown',firstGesture,true);removeEventListener('keydown',firstGesture,true)};
addEventListener('pointerdown',firstGesture,true); addEventListener('keydown',firstGesture,true);
loadProfile(); fit();
if(IS_APP){$('mQuit').hidden=false;$('fullStart').hidden=false;audioInit();if(SET.fullStart&&!SMOKE_RUN)window.desktop.setFullScreen(true)}
updateWallets();
if(P.username)goMenu(); else {S.mode='boot';showOnly('setup');$('setupNet').textContent=netText()}
requestAnimationFrame(frame);
netInit();
