'use strict';
/* ===== chat between friends (online only) =====
   chats/{uidA_uidB}        last message, names, and when each side last read
   chats/{uidA_uidB}/msgs   the messages: {from, name, text, at, verity?}
   One small listener per friend keeps the unread badges live; the open chat also listens to its last 60 messages. */
const CHAT_MAX=300,CHAT_SHOW=60,CHAT_QUICK=['💩','😂','🔥','💀','👍','🗿','😭','🤡'];
const CHAT={docs:{},subs:{},open:null,openName:'',openSub:null,msgs:[],lastSent:0,err:''};
const chatId=uid=>[NET.uid,uid].sort().join('_');
const chatRef=uid=>NET.fs.collection('chats').doc(chatId(uid));

// one listener per friend's chat doc; drops listeners for removed friends and when offline
function chatSync(){
  if(!online()||!NET.fs){for(const k in CHAT.subs)CHAT.subs[k]();CHAT.subs={};CHAT.docs={};return}
  for(const f of P.friends){
    if(CHAT.subs[f])continue;
    CHAT.subs[f]=chatRef(f).onSnapshot(d=>{const old=CHAT.docs[f];CHAT.docs[f]=d.exists?d.data():null;chatNotify(f,old);netChanged()},()=>{});
  }
  for(const f of Object.keys(CHAT.subs))if(!P.friends.includes(f)){CHAT.subs[f]();delete CHAT.subs[f];delete CHAT.docs[f]}
}
const chatName=f=>{const d=CHAT.docs[f],c=(typeof friendsCache!=='undefined'&&friendsCache||[]).find(x=>x.uid===f);return (c&&c.username)||(d&&d.names&&d.names[f])||'?'};
function chatUnread(f){const d=CHAT.docs[f];return !!(d&&d.last&&d.last.from!==NET.uid&&(+d.last.at||0)>(+((d.read||{})[NET.uid])||0))}
const chatUnreadCount=()=>P.friends.filter(chatUnread).length;
const lastText=l=>l.verity&&VARS[l.verity.v]?'🎁 '+fullName(l.verity.v,l.verity.m,l.verity.f):String(l.text||'');
// a toast when a friend writes and that chat isn't open (not for messages that were already there at startup)
function chatNotify(f,old){
  const d=CHAT.docs[f]; if(old===undefined||!d||!d.last||d.last.from===NET.uid)return;
  if((+d.last.at||0)<=(+(old&&old.last&&old.last.at)||0))return;
  if(CHAT.open===f&&!$('chat').hidden){chatMarkRead();return}
  toastSafe(_t("💬 {0}: {1}",chatName(f),lastText(d.last).slice(0,60))); if(typeof sfx!=='undefined')sfx.click();
}
async function chatSend(f,payload){
  const e=needOnline();if(e)throw new Error(e);
  if(!P.friends.includes(f))throw new Error(_t("Vocês não são mais amigos."));
  if(Date.now()-CHAT.lastSent<600)throw new Error(_t("Calma, uma mensagem por vez."));
  const text=String(payload.text||'').replace(/\s+/g,' ').trim().slice(0,CHAT_MAX);
  const it=payload.verity,vt=it?{v:it.v,m:it.m,f:it.f||0,lvl:it.lvl||1}:null;
  if(!text&&!vt)return;
  CHAT.lastSent=Date.now();
  const at=Date.now(),msg={from:NET.uid,name:P.username,text,at,...(vt?{verity:vt}:{})};
  await chatRef(f).collection('msgs').add(msg);
  await chatRef(f).set({members:[NET.uid,f].sort(),names:{[NET.uid]:P.username},last:{from:NET.uid,text,at,...(vt?{verity:vt}:{})},read:{[NET.uid]:at}},{merge:true});
}
function chatMarkRead(){
  const f=CHAT.open,d=f&&CHAT.docs[f]; if(!d||!d.last)return;
  if((+d.last.at||0)>(+((d.read||{})[NET.uid])||0))chatRef(f).set({read:{[NET.uid]:+d.last.at}},{merge:true}).catch(()=>{});
}
function openChat(f){
  if(!online()){toast(netText());return}
  CHAT.open=f; CHAT.openName=chatName(f); CHAT.msgs=[]; CHAT.err='';
  if(CHAT.openSub)CHAT.openSub();
  CHAT.openSub=chatRef(f).collection('msgs').orderBy('at','desc').limit(CHAT_SHOW).onSnapshot(s=>{
    CHAT.msgs=s.docs.map(d=>({id:d.id,...d.data()})).reverse(); chatMarkRead(); renderChatLog();
  },e=>{CHAT.err=String(e&&e.message||e);renderChatLog()});
  openPanel('chat'); setTimeout(()=>$('chatIn').focus(),30);
}
function closeChat(){if(CHAT.openSub)CHAT.openSub();CHAT.openSub=null;CHAT.open=null}
PANEL_CLOSE.chat=closeChat;

/* ---------- chat screen ---------- */
RENDER.chat=()=>renderChat();
function renderChat(){
  $('chatTitle').textContent=_t("Chat com {0}",CHAT.openName);
  const q=$('chatQuick'); if(!q.childElementCount)for(const e of CHAT_QUICK){const b=el('button','btn ghost sm',e);b.type='button';b.onclick=()=>sendChat({text:e});q.append(b)}
  renderChatLog();
}
const hhmm=t=>{const d=new Date(+t||0);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
function renderChatLog(){
  const log=$('chatLog'); if(!log)return; log.textContent='';
  if(CHAT.err)log.append(el('p','small err',_t("O chat não carregou: {0}",CHAT.err)));
  else if(!CHAT.msgs.length)log.append(el('p','empty',_t("Nenhuma mensagem ainda. Diga oi!")));
  for(const m of CHAT.msgs){
    const mine=m.from===NET.uid,b=el('div','bubble'+(mine?' me':''));
    if(m.verity&&VARS[m.verity.v]&&MUT_BY[m.verity.m]){
      const it={v:m.verity.v,m:m.verity.m,f:+m.verity.f||0,lvl:+m.verity.lvl||1},card=el('div','bverity');
      card.append(thumbVerity(it.v,it.m,3.4,{f:it.f,badge:false}));
      const t=el('span');const nm=el('b',null,fullName(it.v,it.m,it.f));if(it.m!=='none')nm.style.color=MUT_BY[it.m].col;
      t.append(nm,el('small',null,_t("{0} · Nv {1} · {2}",RAR[VARS[it.v].r].name,it.lvl,money(itemValue(it)))));card.append(t);b.append(card);
    }else if(m.verity)b.append(el('small',null,_t("+ Verity de versão nova: atualize o jogo")));
    if(m.text)b.append(el('p',null,String(m.text).slice(0,CHAT_MAX)));
    b.append(el('time',null,hhmm(m.at)));
    log.append(b);
  }
  log.scrollTop=log.scrollHeight;
}
async function sendChat(payload){
  if(!CHAT.open)return;
  try{await chatSend(CHAT.open,payload);sfx.click()}catch(e){toast(e.message);sfx.err()}
}
$('chatForm').addEventListener('submit',e=>{e.preventDefault();const v=$('chatIn').value;if(!v.trim())return;$('chatIn').value='';sendChat({text:v})});
$('chatShare').onclick=()=>{
  const g=el('div','igrid share');
  for(const it of sortItems(P.items,'val').slice(0,30))g.append(itemCard(it,{em:3.2,onClick:()=>{closeModal();sendChat({verity:it})}}));
  if(!P.items.length)g.append(el('p','empty',_t("Você ainda não tem Verities.")));
  modal(_t("Mostrar uma Verity"),[el('p','small',_t("Ela só aparece no chat. Continua sendo sua.")),g],[{label:_t("Cancelar"),cls:'ghost'}]);
};
