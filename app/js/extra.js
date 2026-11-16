'use strict';
/* ===== extra (1.4): favorites, buying in bulk, selling many at once, and the Verity Upgrader ===== */

/* ---------- favorites ---------- */
const favs=items=>items.filter(i=>i&&i.fav);
// Runs go() right away, or after an "are you sure?" when any of the items is a favorite.
function guardFav(items,go){
  const f=favs(items); if(!f.length)return go();
  const names=f.slice(0,3).map(i=>fullName(i.v,i.m,i.f)).join(', ')+(f.length>3?` +${f.length-3}`:'');
  confirmDo(_t("Tem certeza?"),f.length>1?_t("Favoritas: {0}. Com isso você pode perder essas Verities.",names):_t("Favorita: {0}. Com isso você pode perder essa Verity.",names),
    _t("Sim, continuar"),()=>{const s=MODAL_SEQ;go();if(MODAL_SEQ!==s)return false},'danger');
}
function favButton(it){
  const b=el('button','btn sm'+(it.fav?'':' ghost'),it.fav?_t("★ Favorita"):_t("☆ Favoritar"));
  b.title=_t("Favoritas pedem confirmação antes de vender, fundir, apostar ou trocar, e ficam de fora do Selecionar todas.");
  b.onclick=e=>{e.stopPropagation();const on=toggleFav(it.id);toast(on?_t("Favoritada! Ela fica protegida."):_t("Saiu dos favoritos."));sfx.click()};
  return b;
}

/* ---------- buying in bulk: ×1, ×10, ×50, ×100 or the most you can afford ----------
   o: {cost(n) price of n, max() how many you can afford now, buy(n), fmt(price) text, cap: most that makes sense, prefix: '×' or '+'} */
function qtyRow(o){
  const row=el('div','qty'),max=o.max(),cap=o.cap??Infinity,pre=o.prefix||'×';
  const counts=[...new Set([1,10,50,100].map(n=>Math.min(n,cap)))].filter(n=>n>0);
  for(const n of counts){
    const b=el('button','btn sm'+(n>1?' ghost':''),pre+fmt(n)); b.append(el('small',null,o.fmt(o.cost(n))));
    b.disabled=n>max; b.onclick=e=>{e.stopPropagation();o.buy(n)}; row.append(b);
  }
  const m=el('button','btn sm max',max>0?_t("Máx {0}",pre+fmt(max)):_t("Máx")); m.append(el('small',null,max>0?o.fmt(o.cost(max)):'—'));
  m.disabled=max<1; m.title=_t("Compra o máximo que dá com o que você tem agora.");
  m.onclick=e=>{e.stopPropagation();if(max>=5)confirmDo(_t("Comprar o máximo?"),_t("{0} de uma vez, por {1}.",pre+fmt(max),o.fmt(o.cost(max))),_t("Comprar"),()=>{o.buy(max)});else o.buy(max)};
  row.append(m); return row;
}
const priceOf=M=>n=>M.rolos?`${fmt(M.rolos*n)} ${ROLO}`:money(M.money*n);
function buyMarmitas(k,n){
  if(n===1){playMarmita(k);return}
  const r=openMarmitas(k,n); if(r.err){toast(r.err);sfx.err();return}
  sfx.buy(); showHaul(r.list);
}
// what came out of a bulk opening, grouped, best first
function showHaul(list){
  const groups=new Map();
  for(const {item,isNew} of list){const key=item.v+'|'+item.m,g=groups.get(key)||{item,n:0,isNew:false};g.n++;g.isNew=g.isNew||isNew;groups.set(key,g)}
  const box=el('div','haul');
  for(const g of groups.values()){
    const c=el('div','hitem'),t=el('span'),R=RAR[VARS[g.item.v].r];
    c.append(thumbVerity(g.item.v,g.item.m,3,{badge:false}));
    const nm=el('b',null,fullName(g.item.v,g.item.m)+(g.n>1?` ×${g.n}`:''));if(g.item.m!=='none')nm.style.color=MUT_BY[g.item.m].col;
    const sub=el('small',null,R.name+(g.isNew?' · '+_t("NOVA!"):''));sub.style.color=R.col;
    t.append(nm,sub);c.append(t);box.append(c);
  }
  const newVars=[...new Map(list.filter(x=>!P.seen.includes(x.item.v)).map(x=>[x.item.v,x.item])).values()];
  const acts=[{label:_t("Fechar"),cls:newVars.length?'ghost':''}];
  if(newVars.length)acts.unshift({label:_t("Ver cutscenes novas ({0})",newVars.length),fn:()=>{playCuts(newVars.map(i=>({v:i.v,m:i.m,f:0})),0,false,()=>{goMenu();openPanel('shop','marmitas')})}});
  modal(_t("{0} marmitas abertas",fmt(list.length)),[el('p','small',_t("Tudo foi pra sua coleção. Valor total: {0}.",money(list.reduce((s,x)=>s+itemValue(x.item),0)))),box],acts);
}

/* ---------- selecting many Verities in the Collection ---------- */
let collPick=null; // null = normal; a Set of ids while selecting
const pickable=it=>!it.fav&&!P.pets.includes(it.id)&&!P.museum.ids.includes(it.id);
function renderCollBulk(){
  const box=$('collBulk'); box.textContent='';
  if(!collPick){
    const b=el('button','btn ghost sm',_t("Selecionar várias"));b.onclick=()=>{collPick=new Set();sfx.click();renderColl()};box.append(b);return;
  }
  for(const id of [...collPick])if(!P.items.some(i=>i.id===id))collPick.delete(id);
  const sel=P.items.filter(i=>collPick.has(i.id)),val=sel.reduce((s,i)=>s+sellPrice(i),0);
  const all=el('button','btn ghost sm',_t("Selecionar todas"));all.title=_t("Todas menos as favoritas, a equipe e as do Museu.");
  all.onclick=()=>{for(const it of P.items)if(pickable(it))collPick.add(it.id);sfx.click();renderColl()};
  const none=el('button','btn ghost sm',_t("Limpar"));none.onclick=()=>{collPick.clear();renderColl()};
  const sell=el('button','btn sm danger',_t("Vender {0} · {1}",sel.length,money(val)));sell.disabled=!sel.length;
  sell.onclick=()=>guardFav(sel,()=>confirmDo(_t("Vender {0} Verities?",sel.length),_t("Você recebe {0} (70% do valor). Não dá pra desfazer.",money(val)),_t("Vender"),()=>{
    const r=sellMany(sel.map(i=>i.id));collPick=new Set();sfx.coin();toast(_t("Vendeu {0} Verities por {1}!",r.n,money(r.total)));renderColl()},'danger'));
  const done=el('button','btn ghost sm',_t("Pronto"));done.onclick=()=>{collPick=null;renderColl()};
  box.append(all,none,sell,done);
}

/* ---------- Verity Upgrader: bet Verities for a better one ----------
   chance = 90% × (value you bet ÷ value of the target), at most 80%. On average you get back 90% of what you bet. */
const UP_EDGE=.9,UP_CAP=.8,UP_MAX=10;
let upStake=new Set(),upTarget={v:'lord',m:'none'},upSpin=null,upLast=null;
const upItems=()=>P.items.filter(i=>upStake.has(i.id));
const upBet=()=>totalValue(upItems());
const upTargetItem=()=>({id:'',v:upTarget.v,m:upTarget.m,f:0,lvl:1});
const upChanceFor=(bet,tv)=>bet>0&&tv>bet?Math.min(UP_CAP,UP_EDGE*bet/tv):0;
const upChance=()=>upChanceFor(upBet(),itemValue(upTargetItem()));
function pctTxt(p){const v=p*100;if(v<=0)return '0%';if(v>=1)return v.toFixed(1).replace('.',DEC)+'%';if(v>=.001)return v.toFixed(3).replace('.',DEC)+'%';
  if(v>=1e-6)return v.toFixed(7).replace(/0+$/,'').replace('.',DEC)+'%';return '< 0'+DEC+'000001%'}
const upTargets=()=>Object.keys(VARS).filter(k=>!VARS[k].hidden).sort((a,b)=>VARS[b].base-VARS[a].base);
// the cheapest target worth at least `val`
function upNearest(val){let best=null;for(const v of upTargets())for(const M of MUTS){const tv=VARS[v].base*M.mult;if(tv>=val&&(!best||tv<best.tv))best={v,m:M.k,tv}}return best}
function upgraderRoll(ids,target){
  const st=P.items.filter(i=>ids.includes(i.id)); if(!st.length||st.length!==ids.length)return{err:_t("Alguma Verity apostada não está mais na coleção.")};
  const bet=totalValue(st),tv=itemValue({...target,f:0,lvl:1}),c=upChanceFor(bet,tv); if(!c)return{err:_t("Escolha um alvo que valha mais do que a aposta.")};
  const roll=Math.random(),win=roll<c; takeItems(ids);
  let item=null,isNew=false;
  if(win){
    isNew=!P.items.some(i=>i.v===target.v); item={id:rid(),v:target.v,m:target.m,f:0,lvl:1,s:0,t:Date.now()};
    P.items.push(item); if(team().length<petSlots())P.pets.push(item.id);
    if(VARS[item.v].r>=5||MUT_BY[item.m].i>=6)announce(_t("ganhou {0} no Upgrader!",fullName(item.v,item.m)));
  }
  if(!team().length&&P.items.length)autoTeam();
  P.stats.upSpins=(P.stats.upSpins||0)+1; if(win)P.stats.upWins=(P.stats.upWins||0)+1;
  checkAch(); saveProfile(); return{win,c,roll,item,isNew,bet,tv};
}
RENDER.upgr=()=>{if(!upSpin)renderUpgr()};
function renderUpgr(){
  for(const id of [...upStake])if(!P.items.some(i=>i.id===id))upStake.delete(id);
  const items=upItems(),bet=upBet();
  $('upTitle').textContent=_t("1. Escolha o que apostar ({0}/{1})",items.length,UP_MAX);
  $('upHelp').textContent=_t("Clique nas Verities pra apostar. Se ganhar, você recebe o alvo (nível 1). Se perder, as apostadas somem. Chance = 90% × valor apostado ÷ valor do alvo, no máximo 80%.");
  const g=$('upGrid'); g.textContent='';
  for(const it of sortItems(P.items,'val'))g.append(itemCard(it,{em:3.8,sel:upStake.has(it.id),tag:P.pets.includes(it.id)?_t("EQUIPE"):P.museum.ids.includes(it.id)?_t("MUSEU"):null,onClick:()=>{
    if(upStake.has(it.id))upStake.delete(it.id);else if(upStake.size<UP_MAX)upStake.add(it.id);else{toast(_t("No máximo {0} Verities por aposta.",UP_MAX));return}
    upLast=null;sfx.click();renderUpgr()}}));
  if(!P.items.length)g.append(el('p','empty',_t("Você ainda não tem Verities.")));
  renderUpSide();
}
function renderUpSide(){
  const s=$('upSide'); s.textContent=''; ANIM.upgr=null;
  const bet=upBet(),t=upTargetItem(),tv=itemValue(t),c=upChanceFor(bet,tv);
  s.append(el('p','ptitle',_t("2. Escolha o alvo")));
  const vs=el('select','input sm'),ms=el('select','input sm');
  for(const v of upTargets()){const o=el('option',null,`${VARS[v].name} · ${RAR[VARS[v].r].name}`);o.value=v;o.selected=v===upTarget.v;vs.append(o)}
  for(const M of MUTS){const o=el('option',null,M.k==='none'?_t("Sem mutação"):`${M.name} ×${M.mult}`);o.value=M.k;o.selected=M.k===upTarget.m;ms.append(o)}
  vs.setAttribute('aria-label',_t("Variante do alvo"));ms.setAttribute('aria-label',_t("Mutação do alvo"));
  vs.onchange=()=>{upTarget.v=vs.value;upLast=null;renderUpSide()};ms.onchange=()=>{upTarget.m=ms.value;upLast=null;renderUpSide()};
  const pk=el('div','row');pk.append(vs,ms);s.append(pk);
  if(bet>0){const q=el('div','row');for(const k of[2,5,10,100]){const b=el('button','btn ghost sm',`×${k}`);b.title=_t("Alvo mais barato que vale pelo menos {0}× a aposta",k);
    b.onclick=()=>{const n=upNearest(bet*k);if(n){upTarget={v:n.v,m:n.m};upLast=null;sfx.click();renderUpSide()}else toast(_t("Nenhum alvo vale tanto."))};q.append(b)}s.append(q)}
  const cv=canvasEl(15,'prev'); s.append(cv);
  const draw=()=>drawPrev(cv,()=>upLast?drawUpWheel(upLast.c,upLast.win?upLast.item:t,upLast.roll*TAU,upLast.win?'win':'lose'):drawUpWheel(c,t));
  ANIM.upgr=draw; draw();
  const nm=el('p','vname',fullName(t.v,t.m));if(t.m!=='none')nm.style.color=MUT_BY[t.m].col;s.append(nm);
  const info=el('p','small');info.innerHTML='';
  info.append(document.createTextNode(_t("Aposta: {0} · Alvo: {1}",money(bet),money(tv))));s.append(info);
  const ch=el('p','upchance',bet?(c?_t("Chance: {0}",pctTxt(c)):_t("O alvo tem que valer mais do que a aposta.")):_t("Escolha o que apostar."));s.append(ch);
  if(upLast){const r=el('p','upres '+(upLast.win?'win':'lose'),upLast.win?_t("GANHOU! {0} é sua.",fullName(upLast.item.v,upLast.item.m)):_t("Perdeu. Não foi dessa vez."));s.append(r)}
  const go=el('button','btn',_t("Apostar"));go.disabled=!bet||!c;go.onclick=upGo;s.append(go);
}
function upGo(){
  const st=upItems(),t=upTargetItem(),c=upChance();
  if(!st.length){toast(_t("Escolha o que apostar."));return}
  if(!c){toast(_t("Escolha um alvo que valha mais do que a aposta."));return}
  guardFav(st,()=>confirmDo(_t("Apostar?"),_t("Você aposta {0} Verities ({1}) pra tentar {2} ({3}). Chance: {4}. Se perder, as apostadas somem.",st.length,money(upBet()),fullName(t.v,t.m),money(itemValue(t)),pctTxt(c)),_t("Apostar"),()=>{
    const r=upgraderRoll(st.map(i=>i.id),{v:t.v,m:t.m}); if(r.err){toast(r.err);sfx.err();return}
    upStake=new Set(); spinUp(r,t);
  },'danger'));
}
// the needle lands at roll × 360° from the top; the green arc from the top covers the chance, so it lands inside only on a win
function drawUpWheel(c,t,ang,res){
  const cx=50,cy=50,R=40;
  circ(cx,cy,R+4,'#0e1b18'); circ(cx,cy,R,'#1d302b');
  const a0=-Math.PI/2,span=Math.max(c*TAU,c>0?.012:0);
  if(span>0){ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,a0,a0+span);ctx.closePath();ctx.fillStyle=res==='lose'?'#3a5a50':'#4fd18b';ctx.fill()}
  for(let i=0;i<40;i++){const a=i/40*TAU;line([[cx+Math.cos(a)*(R-3),cy+Math.sin(a)*(R-3)],[cx+Math.cos(a)*R,cy+Math.sin(a)*R]],'rgba(255,255,255,.18)',.6)}
  circ(cx,cy,17,'#0e1b18');
  if(t)drawVariant(cx,cy,13,t.v,t.m,{noFx:true});
  const na=a0+(ang||0);
  ctx.save();ctx.translate(cx,cy);ctx.rotate(na);ctx.fillStyle=res==='win'?'#ffd21f':res==='lose'?'#ff5a5f':'#ffffff';
  ctx.beginPath();ctx.moveTo(R+2,0);ctx.lineTo(19,-3);ctx.lineTo(19,3);ctx.closePath();ctx.fill();ctx.restore();
}
function spinUp(r,t){
  const dur=3.4,end=6*TAU+r.roll*TAU,t0=performance.now();
  upSpin=r; renderUpSideSpinning(r,t);
  const cv=$('upSide').querySelector('canvas');
  const frame=now=>{
    const k=Math.min(1,(now-t0)/1000/dur),e=1-Math.pow(1-k,3);
    drawPrev(cv,()=>drawUpWheel(r.c,t,end*e,k>=1?(r.win?'win':'lose'):null));
    if(k<1&&!$('upgr').hidden)requestAnimationFrame(frame);else upDone(r);
  };
  CSFX.rumble(); requestAnimationFrame(frame);
}
function renderUpSideSpinning(r,t){
  const s=$('upSide'); s.textContent=''; ANIM.upgr=null;
  s.append(el('p','ptitle',_t("Girando...")),canvasEl(15,'prev'));
  const nm=el('p','vname',fullName(t.v,t.m));if(t.m!=='none')nm.style.color=MUT_BY[t.m].col;
  s.append(nm,el('p','upchance',_t("Chance: {0}",pctTxt(r.c))));
}
function upDone(r){
  if(upSpin!==r)return; upSpin=null; upLast=r;
  if(r.win){sfx.up();toast(_t("GANHOU! {0} é sua.",fullName(r.item.v,r.item.m)),4000)}else{sfx.err();toast(_t("Perdeu. Não foi dessa vez."))}
  if(r.win&&r.isNew&&!P.seen.includes(r.item.v)){setTimeout(()=>{closeAllPanels();startCutscene(r.item.v,r.item.m,0,()=>{goMenu();openPanel('upgr')})},900);return}
  if(!$('upgr').hidden)renderUpgr();
}
$('mUpgr').onclick=()=>openPanel('upgr');
