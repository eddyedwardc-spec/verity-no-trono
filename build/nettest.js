// Two-player online test against the real Firebase project, in hidden muted windows.
// Run: electron build/nettest.js   (after node build/prepare.js)
// Each window gets its own in-memory session, so each one is a fresh anonymous player.
// At the end both test players delete their profile, username and account.
const { app, BrowserWindow } = require('electron');
const path = require('path');

const PAGE = path.join(__dirname, '..', 'app', 'index.html');
const tag = Math.random().toString(36).slice(2, 6);
const NAME_A = 'teste_a_' + tag, NAME_B = 'teste_b_' + tag;

function makeWin(part) {
  const w = new BrowserWindow({ show: false, width: 1280, height: 720, webPreferences: {
    preload: path.join(__dirname, '..', 'preload.js'), contextIsolation: true, sandbox: true, partition: part, backgroundThrottling: false } });
  w.webContents.setAudioMuted(true);
  w.errors = [];
  w.webContents.on('console-message', (_e, level, msg) => { if (level >= 3) w.errors.push(msg); });
  w.loadFile(PAGE, { query: { smoke: '1', net: '1' } });
  return w;
}
const js = (w, code) => w.webContents.executeJavaScript(`(async()=>{${code}})()`);
const HELP = `window.waitFor=(fn,ms=20000)=>new Promise((res,rej)=>{const t0=Date.now();const iv=setInterval(()=>{let v;try{v=fn()}catch(e){}if(v){clearInterval(iv);res(v)}else if(Date.now()-t0>ms){clearInterval(iv);rej(new Error('timeout: '+fn))}},200)});`;

app.whenReady().then(async () => {
  const log = [], ok = (step, v) => { log.push([step, v]); console.log('STEP', step, JSON.stringify(v)); };
  const A = makeWin('nettestA'), B = makeWin('nettestB');
  let failed = null;
  try {
    await Promise.all([A, B].map(w => new Promise(r => w.webContents.once('did-finish-load', r))));
    for (const w of [A, B]) await js(w, HELP + 'return 1');
    ok('online', await Promise.all([A, B].map(w => js(w, `await waitFor(()=>NET.status==='online'||NET.status==='erro',30000);return NET.status+(NET.msg?' '+NET.msg:'')`))));

    ok('names', await Promise.all([[A, NAME_A], [B, NAME_B]].map(([w, n]) => js(w, `await claimUsername('${n}');return P.username+' '+NET.uid`))));
    const uidA = await js(A, 'return NET.uid'), uidB = await js(B, 'return NET.uid');

    await js(A, `P.items=[{id:'ta1',v:'moggity',m:'ouro',lvl:3,s:1,t:1},{id:'ta2',v:'verity',m:'none',lvl:1,s:1,t:2}];P.money=5000;saveProfile();await pushNow();return 1`);
    await js(B, `P.items=[{id:'tb1',v:'lord',m:'none',lvl:1,s:1,t:1},{id:'tb2',v:'falsity',m:'bronze',lvl:2,s:1,t:2}];P.money=5000;saveProfile();await pushNow();return 1`);
    ok('pushed', 'both profiles saved');

    ok('dup name refused', await js(B, `try{await claimUsername('${NAME_A}');return 'NOT refused'}catch(e){return e.message}`));

    ok('friend request', await js(A, `return await sendFriendRequest('${NAME_B}')`));
    ok('friend accept', await js(B, `await waitFor(()=>NET.reqIn.length);await acceptFriend(NET.reqIn[0]);return P.friends`));
    ok('friend both sides', await js(A, `await waitFor(()=>P.friends.includes('${uidB}'));return P.friends`));

    ok('chat send', await js(A, `chatSync();await chatSend('${uidB}',{text:'oi ${tag}'});return 'sent'`));
    ok('chat unread for B', await js(B, `chatSync();await waitFor(()=>chatUnread('${uidA}'));return {unread:chatUnreadCount(),last:CHAT.docs['${uidA}'].last.text}`));
    ok('chat open + read', await js(B, `openChat('${uidA}');await waitFor(()=>CHAT.msgs.length);await waitFor(()=>!chatUnread('${uidA}'));return {msgs:CHAT.msgs.map(m=>m.text),unread:chatUnreadCount()}`));
    ok('chat share verity', await js(B, `await new Promise(r=>setTimeout(r,700));await chatSend('${uidA}',{verity:P.items[0],text:'olha'});closePanel('chat');return 'sent'`));
    ok('chat A sees verity', await js(A, `await waitFor(()=>{const d=CHAT.docs['${uidB}'];return d&&d.last&&d.last.verity});return lastText(CHAT.docs['${uidB}'].last)+' / unread '+chatUnreadCount()`));
    ok('chat stranger blocked', await js(A, `try{await NET.fs.collection('chats').doc('aaaa_zzzz').get();return 'NOT blocked'}catch(e){return e.code||e.message}`));
    // turn-based battle (needs the battles rules published; run with VERITY_BATTLE=1)
    if (process.env.VERITY_BATTLE) {
    const DRIVE = `window.drv=setInterval(()=>{S.time+=.1;update(.1);if(B&&B.phase==='play'&&!B.ev&&!B.evq.length&&!B.S.over&&B.S.cur!=null&&myTurn()&&!B.sending)btlSubmit(btlAuto(B.S))},40);return 1`;
    const TEAM = JSON.stringify([{ v: 'lord', m: 'ouro', f: 0, lvl: 10 }, { v: 'exu', m: 'none', f: 0, lvl: 5 }, { v: 'lovity', m: 'bronze', f: 0, lvl: 8 }, { v: 'obesity', m: 'none', f: 0, lvl: 12 }]);
    const bid = await js(A, `return await pvpCreate('${uidB}','${NAME_B}',${TEAM},1000)`);
    ok('battle challenge', bid ? 'sent' : 'failed');
    ok('battle accept', await js(B, `await waitFor(()=>PVP.inv.some(d=>d.id==='${bid}'&&d.status==='invite'));closeModal();await pvpAccept('${bid}',${TEAM});return 'accepted'`));
    for (const w of [A, B]) await js(w, `await waitFor(()=>[...PVP.inv,...PVP.mine].some(d=>d.id==='${bid}'&&d.status==='active'));if(!B||B.id!=='${bid}')pvpOpen([...PVP.inv,...PVP.mine].find(d=>d.id==='${bid}'));${DRIVE}`);
    const fin = await Promise.all([A, B].map(w => js(w, `await waitFor(()=>B&&B.S.over&&B.doc&&B.doc.status==='done'&&B.applied===(B.doc.acts||[]).length,120000);clearInterval(drv);return {win:B.S.win,by:B.S.by,acts:B.applied,hp:B.S.units.map(u=>u.hp),me:B.me}`)));
    ok('battle finished', fin.map(f => f.by + ' win=' + f.win + ' acts=' + f.acts));
    if (JSON.stringify(fin[0].hp) !== JSON.stringify(fin[1].hp) || fin[0].win !== fin[1].win) throw new Error('battle results differ: ' + JSON.stringify(fin));
    ok('battle same on both', fin[0].hp);
    ok('battle ratings', await Promise.all([A, B].map(w => js(w, `await waitFor(()=>P.pvp.w+P.pvp.l===1);return P.pvp`))));
    await js(A, `btlClose();await NET.fs.collection('battles').doc('${bid}').delete();return 1`); await js(B, 'btlClose();return 1');
    }

    ok('see friend collection', await js(A, `const f=await fetchPlayer('${uidB}');window.fB=f;return f.username+' has '+f.items.map(i=>i.id).join(',')`));
    ok('propose trade', await js(A, `await proposeTrade('${uidB}','${NAME_B}',['ta2'],[fB.items.find(i=>i.id==='tb2')],100);return {items:P.items.map(i=>i.id),money:P.money}`));
    ok('accept trade', await js(B, `await waitFor(()=>NET.tradesIn.some(t=>t.status==='open'));await acceptTrade(NET.tradesIn.find(t=>t.status==='open'));return {items:P.items.map(i=>i.id),money:P.money}`));
    ok('trade settled for sender', await js(A, `await waitFor(()=>P.items.some(i=>i.id==='tb2'));return {items:P.items.map(i=>i.id),money:P.money}`));

    ok('decline path', await js(A, `await proposeTrade('${uidB}','${NAME_B}',['ta1'],[{id:'ta2',v:'verity',m:'none',lvl:1,s:1,t:2}],0);return P.items.map(i=>i.id)`));
    await js(B, `await waitFor(()=>NET.tradesIn.some(t=>t.status==='open'));await declineTrade(NET.tradesIn.find(t=>t.status==='open'));return 1`);
    ok('declined items returned', await js(A, `await waitFor(()=>P.items.some(i=>i.id==='ta1'));return P.items.map(i=>i.id)`));

    ok('list on market', await js(B, `await listItem('tb1',777);return {items:P.items.map(i=>i.id),money:P.money}`));
    ok('buy from market', await js(A, `const l=(await fetchMarket()).find(x=>x.item.id==='tb1');await buyListing(l);return {items:P.items.map(i=>i.id),money:P.money}`));
    ok('seller paid', await js(B, `await waitFor(()=>P.money===5100+777);return {money:P.money}`));
    ok('cancel listing', await js(A, `await listItem('ta1',999);await waitFor(()=>NET.myListings.some(l=>l.status==='open'));await cancelListing(NET.myListings.find(l=>l.status==='open'));return P.items.map(i=>i.id)`));

    await js(A, 'await pushNow();return 1'); await js(B, 'await pushNow();return 1');
    ok('ranking', await js(A, `const r=await fetchRanking('totalValue');return r.filter(x=>x.username.startsWith('teste_')&&x.username.endsWith('${tag}')).map(x=>x.username+':'+x.totalValue)`));
  } catch (e) { failed = String(e && e.message || e); console.log('FAIL', failed); }

  // cleanup: each test player removes its own data and account
  for (const [w, n] of [[A, NAME_A], [B, NAME_B]]) {
    try {
      console.log('CLEANUP', n, await js(w, `if(!NET.fs)return 'no net';const u=NET.uid;
        for(const f of P.friends){const r=NET.fs.collection('chats').doc(chatId(f));const ms=await r.collection('msgs').where('from','==',u).get().catch(()=>({docs:[]}));for(const d of ms.docs)await d.ref.delete().catch(()=>{});await r.delete().catch(()=>{})}
        await NET.fs.collection('usernames').doc('${n}').delete().catch(()=>{});
        await NET.fs.collection('inv').doc(u).delete().catch(()=>{});
        await NET.fs.collection('players').doc(u).delete().catch(()=>{});
        await firebase.auth().currentUser.delete().catch(e=>'auth: '+e.message);return 'ok'`));
    } catch (e) { console.log('CLEANUP FAIL', n, String(e)); }
  }
  console.log('ERRORS', JSON.stringify({ A: A.errors, B: B.errors }));
  console.log('RESULT', failed ? 'FAILED: ' + failed : 'PASSED');
  app.quit();
});
