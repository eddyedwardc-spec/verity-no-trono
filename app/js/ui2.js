'use strict';
/* ===== ui2: menu live bits, Diário, Museu, Marmitas, Jornada by region, Renascer ===== */

/* ---------- menu: events, live feed, badges ---------- */
function renderMenuLive(){
  const ev=activeEvents(),eb=$('evBanner');
  eb.hidden=!ev.length; eb.textContent=ev.length?'EVENTO: '+ev.map(e=>e.name).join(' + ')+' · '+ev.map(e=>e.desc).join(' '):'';
  const ds=dailyState(); ensureMissions();
  const claimable=P.missions.list.filter(m=>!m.claimed&&m.prog>=m.n).length+(ds.claimed?0:1);
  const db=$('dailyBadge'); db.hidden=!claimable; db.textContent=claimable;
  const mp=museumPending(),mb=$('museumBadge'); mb.hidden=mp<1; mb.textContent=mp>=1000?fmt(Math.round(mp/1000))+'k':fmt(mp);
  renderFeed();
}
function renderFeed(){
  const f=$('feed'); if(!online()||!FEED.length){f.hidden=true;return}
  f.hidden=false; $('feedText').textContent=FEED.map(x=>`${x.name}${x.rb?' ★'+x.rb:''} ${x.t}`).join('   ·   ');
}
setInterval(()=>{if(!$('menu').hidden&&online())refreshFeed().then(renderFeed)},20000);
let dailyAsked='';
function maybeDaily(){
  if(S.mode!=='menu'||anyPanelOpen()||!P.username)return;
  const st=dailyState(); if(st.claimed||dailyAsked===todayKey())return;
  dailyAsked=todayKey(); openPanel('diario','daily');
}
$('mMuseum').onclick=()=>openPanel('museu');
$('mDaily').onclick=()=>openPanel('diario');

/* ---------- Diário ---------- */
RENDER.diario=()=>renderDiario();
function renderDiario(){
  const box=$('diarioBody'); box.textContent='';
  const tab=TAB.diario||'daily';
  if(tab==='daily'){
    const st=dailyState();
    const seq=st.claimed?st.day:Math.max(0,st.day-1);
    box.append(el('p','ptitle',`Recompensa diária · sequência de ${seq} dia${seq===1?'':'s'}`),
      el('p','small','Volte todo dia. Se pular um dia, a sequência volta pro Dia 1. O dinheiro cresce com o seu mundo.'));
    const days=el('div','days'),cur=((st.day-1)%7)+1;
    DAILY.forEach((r,i)=>{const n=i+1,d=el('div','day'+(n===cur&&!st.claimed?' today':'')+(n<cur||(n===cur&&st.claimed)?' got':''));
      const rr2={...r};if(rr2.money)rr2.money=dailyMoney(rr2.money);d.append(el('b',null,'Dia '+n),el('span',null,rewardText(rr2)));days.append(d)});
    box.append(days);
    const b=el('button','btn',st.claimed?'Já pegou hoje. Volte amanhã!':'Pegar recompensa do Dia '+cur); b.disabled=st.claimed;
    b.onclick=()=>{const r=claimDaily();if(!r)return;sfx.buy();toast('Recebeu: '+rewardText(r));if(r.marmita){closeAllPanels();const o=openMarmita(r.marmita,true);startGacha(r.marmita,o.item,o.isNew,()=>{goMenu();openPanel('diario','missions')})}else renderDiario()};
    const row=el('div','row');row.append(b);box.append(row);
  }else if(tab==='missions'){
    ensureMissions();
    box.append(el('p','ptitle','Missões de hoje'),el('p','small',`Complete as 3 pra ganhar +10 ${ROLO} de bônus. Novas missões todo dia à meia-noite.`));
    P.missions.list.forEach((m,i)=>{
      const r=missionReward(m),row=el('div','mission'),done=m.prog>=m.n;
      const t=el('div','lname');t.append(el('b',null,missionText(m)),el('small',null,`${fmt(Math.min(m.prog,m.n))}/${fmt(m.n)} · prêmio: ${r.rolos} ${ROLO} + ${money(r.money)}`));
      const b=el('button','btn sm',m.claimed?'Pego':'Pegar');b.disabled=m.claimed||!done;b.onclick=()=>{const x=claimMission(i);if(x){sfx.coin();toast(`+${x.rolos} ${ROLO} + ${money(x.money)}`+(x.bonus?` · bônus +${x.bonus} ${ROLO}!`:''));renderDiario()}};
      const xb=el('div','xpbar'),xi=el('i');xi.style.width=clamp(m.prog/m.n*100,0,100)+'%';xb.append(xi);
      row.append(t,b,xb);box.append(row);
    });
    if(P.missions.bonus)box.append(el('p','notice','Todas feitas hoje. Volte amanhã!'));
  }else if(tab==='ach'){
    const got=ACH.filter(a=>P.ach[a.k]).length;
    box.append(el('p','ptitle',`Conquistas · ${got}/${ACH.length}`),el('p','small','Cada conquista dá Rolos e libera um título. O título aparece no seu perfil, no ranking e pros amigos.'));
    const nt=el('button','pick',P.title?'Tirar título':'Sem título');nt.setAttribute('aria-pressed',P.title?'false':'true');nt.onclick=()=>{setTitle('');renderDiario()};box.append(nt);
    const g=el('div','achgrid');
    for(const a of ACH){
      const done=!!P.ach[a.k],c=el('div','ach'+(done?' done':'')+(P.title===a.k?' eq':''));
      c.append(el('b',null,a.name),el('span',null,a.desc),el('span','small',done?`Feita · +${a.rolos} ${ROLO}`:`${fmt(Math.min(a.val(),a.goal))}/${fmt(a.goal)} · +${a.rolos} ${ROLO}`));
      if(done){const b=el('button','pick',P.title===a.k?'Usando':'Usar título');b.setAttribute('aria-pressed',P.title===a.k?'true':'false');b.onclick=()=>{setTitle(a.k);renderDiario()};c.append(b)}
      g.append(c);
    }
    box.append(g);
  }else{
    box.append(el('p','ptitle','Códigos secretos'),el('p','small','Digite um código pra ganhar presentes. Cada código funciona uma vez por jogador.'));
    const f=el('form','row left'),inp=el('input','input');inp.maxLength=24;inp.placeholder='CODIGO';inp.setAttribute('aria-label','Código');
    const b=el('button','btn sm','Resgatar');b.type='submit';const msg=el('span','small');
    f.onsubmit=async e=>{e.preventDefault();msg.textContent='';try{const r=await redeemCode(inp.value);inp.value='';sfx.buy();msg.textContent='Recebeu: '+rewardText(r);
      if(r.marmita){closeAllPanels();const o=openMarmita(r.marmita,true);startGacha(r.marmita,o.item,o.isNew,()=>{goMenu();openPanel('diario','codes')})}}catch(err){msg.textContent=err.message;sfx.err()}};
    f.append(inp,b,msg);box.append(f);
    box.append(el('p','small',`Você já usou ${P.codes.length} código${P.codes.length===1?'':'s'}.`));
  }
}

/* ---------- Museu ---------- */
RENDER.museu=()=>renderMuseu();
function renderMuseu(){
  const box=$('museuBody'); box.textContent='';
  const top=el('div','mtop'),pend=museumPending(),rate=museumRate();
  const a=el('div','lname');a.append(el('small',null,'PRA COLETAR'),el('span','big',money(pend)));
  const b=el('div','lname');b.append(el('small',null,'RENDA POR HORA'),el('b',null,money(rate)),el('small',null,`acumula até ${MUSEUM_CAP}h com o jogo fechado`));
  const c=el('button','btn','Coletar');c.disabled=pend<1;c.onclick=()=>{const v=collectMuseum();sfx.coin();toast('Coletou '+money(v));renderMuseu()};
  top.append(a,b,c);box.append(top);
  box.append(el('p','small',`As Verities expostas rendem dinheiro sozinhas: 3 × o poder de cada uma por hora${P.rebirths?`, ×${rbIncome().toFixed(1).replace('.',',')} pelos renascimentos`:''}. Vagas: ${P.museum.ids.length}/${museumSlots()} (cada banheiro novo dá mais uma).`));
  const sl=el('div','mslots'),its=museumItems();
  for(let i=0;i<museumSlots();i++){const it=its[i],s2=el('button','mslot');if(it){s2.append(thumbVerity(it.v,it.m,3.6,{f:it.f,badge:false}));s2.title=fullName(it.v,it.m,it.f)+' · tirar';s2.onclick=()=>{toast(toggleMuseum(it.id));renderMuseu()}}else s2.textContent='vazio';sl.append(s2)}
  box.append(sl);
  box.append(el('p','ptitle','Escolha o que expor'));
  const g=el('div','igrid');
  for(const it of sortItems(P.items,'pow').slice(0,60))g.append(itemCard(it,{em:3.8,sel:P.museum.ids.includes(it.id),extra:`rende ${money(Math.round(itemPower(it)*3*rbIncome()))}/h`,onClick:()=>{toast(toggleMuseum(it.id));sfx.click();renderMuseu()}}));
  if(!P.items.length)g.append(el('p','empty','Você ainda não tem Verities.'));
  box.append(g);
}

/* ---------- Marmitas (shop tab) ---------- */
function renderMarmitas(){
  const main=$('shopMain'),info=$('shopInfo'); main.textContent=''; info.textContent='';
  const ev=evMods(),pool=marmitaPool();
  main.append(el('p','small',`Abra uma marmita e ganhe uma Verity na hora, com roleta. Saem Verities das regiões que você já liberou${ev.vars.length?' e as do evento':''}. Verity nova vem com cutscene.`));
  const g=el('div','igrid wide');
  for(const M of MARMITAS){
    const c=el('div','icard'),price=M.rolos?`${M.rolos} ${ROLO}`:money(M.money),can=M.rolos?P.rolos>=M.rolos:P.money>=M.money;
    const n=el('span','nm',M.name);n.style.color=M.col;
    const od=el('div','odds');const tot=M.w.reduce((s,x)=>s+x,0);M.w.forEach((w,r)=>{if(!w)return;const i=el('i');i.style.width=(w/tot*100)+'%';i.style.background=RAR[r].col;i.title=`${RAR[r].name}: ${Math.round(w/tot*100)}%`;od.append(i)});
    const b=el('button','btn sm','Abrir');b.disabled=!can;b.onclick=()=>playMarmita(M.k);
    c.append(n,el('span','sub',M.desc),od,el('span','val',price),b);g.append(c);
  }
  main.append(g);
  shopPrev={kind:'verity'};
  info.append(el('p','ptitle','Possíveis agora'),el('p','small',`${pool.length} Verities diferentes podem sair. Libere regiões novas na Jornada pra aumentar.`));
  if(ev.list.length)info.append(el('p','notice','Evento: '+ev.list.map(e=>e.name).join(', ')));
  ANIM.shop();
}
function playMarmita(k){
  const r=openMarmita(k); if(r.err){toast(r.err);sfx.err();return}
  closeAllPanels(); startGacha(k,r.item,r.isNew,()=>{goMenu();openPanel('shop','marmitas')});
}

/* ---------- Jornada by region ---------- */
let jRegion=null;
RENDER.journey=()=>renderJourney();
function renderJourney(){
  const tp=teamPower(),curReg=WORLDS[P.world.max-1].region;
  if(!jRegion||jRegion>curReg)jRegion=curReg;
  $('jPower').textContent='Poder da equipe: '+fmt(tp)+(P.rebirths?` (×${rbPow().toFixed(1).replace('.',',')} renascimento)`:'');
  const rb=$('jRebirth'); rb.disabled=!canRebirth(); rb.textContent=P.rebirths?`Renascer (${P.rebirths})`:'Renascer'; rb.title=canRebirth()?'':`Derrote o chefe do mundo ${rebirthReq()} pra renascer.`;
  const rg=$('jRegions'); rg.textContent='';
  for(const R of REGIONS){
    const beaten=WORLDS.filter(w=>w.region===R.n&&P.world.beaten.includes(w.n)).length,open=R.n<=curReg;
    const b=el('button','pick'+(beaten===5?' done':''),`${R.n}. ${R.name} ${beaten}/5`); b.disabled=!open; b.setAttribute('aria-pressed',R.n===jRegion?'true':'false');
    b.onclick=()=>{jRegion=R.n;sfx.click();renderJourney()}; rg.append(b);
  }
  const R=REGIONS[jRegion-1];
  $('jHint').textContent=`${R.name}: ${R.sub} ${R.special?SPECIALS[R.special]:''} Cada fase tem um chefe; a Fase V é a forma final, que deixa a Verity própria dele.`+(canRebirth()?'':` Renascer libera no mundo ${rebirthReq()}.`);
  const g=$('jGrid'); g.textContent='';
  for(const Wd of WORLDS.filter(w=>w.region===jRegion)){
    const B=Wd.boss,open=Wd.n<=P.world.max,beaten=P.world.beaten.includes(Wd.n);
    const c=el('div','wcard'+(open?'':' locked')+(beaten?' done':'')); c.style.setProperty('--wc',Wd.pal.tube);
    const top=el('div','wtop'),tt=el('div'); tt.append(el('b',null,`${Wd.n}. ${ROMAN[Wd.fase-1]}`),el('small',null,open?`Fase ${Wd.fase} de ${R.name}`:`Derrote o chefe do mundo ${Wd.n-1}`));
    top.append(thumbWorld(Wd,3.2),tt); c.append(top);
    const bl=el('div','bline'); bl.append(document.createTextNode(B.name.replace(R.boss.name+' · ','')+' · ')); bl.append(el('span',tp>=B.rec?'ok':'bad',`poder ${fmt(B.rec)}`));
    if(beaten)bl.append(document.createTextNode(' · ✓')); c.append(bl);
    c.append(el('div','bline',B.mods.length?B.mods.map(m=>MOD_TXT[m]).join(', '):'sem truques'));
    if(Wd.fase===5){const ex=el('div','excl');ex.append(document.createTextNode('Deixa: '));ex.append(thumbVerity(B.drop,'none',2.2,{locked:!P.items.some(i=>i.v===B.drop),badge:false}));c.append(ex)}
    else if(Wd.pool.length){const ex=el('div','excl');for(const [k] of Wd.pool)ex.append(thumbVerity(k,'none',2,{locked:!P.items.some(i=>i.v===k),badge:false}));c.append(ex)}
    const row=el('div','row'),pl=el('button','btn sm','Jogar'),bs=el('button','btn sm danger',beaten?'Chefe':'Chefe!');
    pl.disabled=!open; bs.disabled=!open;
    pl.onclick=()=>{closeAllPanels();goCard1(Wd.n)}; bs.onclick=()=>{closeAllPanels();goBoss(Wd.n)};
    row.append(pl,bs); c.append(row); g.append(c);
  }
}
$('jRebirth').onclick=()=>{
  if(!canRebirth()){toast(`Derrote o chefe do mundo ${rebirthReq()} primeiro.`);return}
  const n=(P.rebirths||0)+1;
  modal('Renascer?',[
    el('p','small',`Você perde: ${money(P.money)}, os banheiros comprados e o progresso nos mundos (volta pro Mundo 1).`),
    el('p','small','Você mantém: todas as Verities, equipe, Museu, cosméticos, invasores, conquistas, Rolos e boosts.'),
    el('p','notice',`Renascimento ${n}: poder ×${(1+.3*n).toFixed(1).replace('.',',')}, renda do Museu ×${(1+.5*n).toFixed(1).replace('.',',')}, sorte ×${(1+.1*n).toFixed(1).replace('.',',')}, dinheiro dos chefes ×${(1+.25*n).toFixed(2).replace('.',',')}, +${25*n} ${ROLO} e ★ no nome.`)
  ],[{label:'Renascer',cls:'danger',fn:()=>{const e=doRebirth();if(e)throw new Error(e);sfx.reveal(6);toast(`Renasceu! ★${P.rebirths}`);jRegion=1;renderJourney()}},{label:'Cancelar',cls:'ghost'}]);
};

/* ---------- boot ---------- */
const firstGesture=()=>{audioInit();removeEventListener('pointerdown',firstGesture,true);removeEventListener('keydown',firstGesture,true)};
addEventListener('pointerdown',firstGesture,true); addEventListener('keydown',firstGesture,true);
loadProfile(); fit(); achReady=true; ensureMissions();
if(IS_APP){$('mQuit').hidden=false;$('fullStart').hidden=false;audioInit();if(SET.fullStart&&!SMOKE_RUN)window.desktop.setFullScreen(true)}
updateWallets();
if(P.username)goMenu(); else {S.mode='boot';showOnly('setup');$('setupNet').textContent=netText()}
requestAnimationFrame(frame);
netInit();
