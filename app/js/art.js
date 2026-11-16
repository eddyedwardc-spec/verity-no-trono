'use strict';
/* ===== art: Verities, rarity, mutations, the player character, cosmetics, intruders, bathrooms ===== */
const RAR=[
  {k:'comum',name:_t("Comum"),col:'#b9c4c1'},
  {k:'incomum',name:_t("Incomum"),col:'#6fe08a'},
  {k:'raro',name:_t("Raro"),col:'#5fb4ff'},
  {k:'epico',name:_t("Épico"),col:'#c08bff'},
  {k:'lendario',name:_t("Lendário"),col:'#ffb23a'},
  {k:'mitico',name:_t("Mítico"),col:'#ff5a5f'}
];
const VARS={
  verity:{name:'Verity',base:100,r:0,col:['#fff8c4','#ffd726','#d69500'],glow:'255,226,80',hint:_t("conforto 40–79")},
  larpity:{name:'Larpity',base:120,r:0,col:['#d9ffbf','#47f20d','#1f9a00'],glow:'110,255,60',hint:_t("conforto 60–94")},
  falsity:{name:'Falsity',base:150,r:1,col:['#a8bdff','#1446e0','#0a2590'],glow:'60,110,255',hint:_t("conforto 20–59")},
  obesity:{name:'Obesity',base:200,r:1,col:['#fff3b0','#f5cf3a','#c89a10'],glow:'255,220,90',hint:_t("conforto 40–79")},
  lovity:{name:'Lovity',base:250,r:2,col:['#ffe4ef','#f79ac2','#cf618e'],glow:'255,150,200',hint:_t("conforto 80–94")},
  cruelty:{name:'Cruelty',base:300,r:2,col:['#ffa0a0','#ee1111','#930000'],glow:'255,40,40',hint:_t("conforto abaixo de 40")},
  moggity:{name:'Moggity',base:600,r:3,col:['#ffe08a','#f0a91c','#a86200'],glow:'255,170,40',hint:_t("conforto 80+")},
  eclipse:{name:'Eclipse',base:800,r:3,col:['#3b3648','#121018','#000000'],glow:'120,80,200',hint:_t("conforto abaixo de 20")},
  lord:{name:'Lord Verity',base:1500,r:4,col:['#fff8c4','#ffd726','#d69500'],glow:'255,226,80',hint:_t("conforto 95+")},
  exu:{name:'Exu',base:3000,r:5,col:['#ad7a58','#6b4530','#2c190e'],glow:'255,80,70',hint:_t("conforto 95+ (100% ajuda)")}
};
const VAR_ORDER=['verity','larpity','falsity','obesity','lovity','cruelty','moggity','eclipse','lord','exu'];
const MUTS=[
  {k:'none',name:_t("Comum"),mult:1,col:'#cfd6d4'},
  {k:'bronze',name:'Bronze',mult:2,col:'#e09a5a',p:.30,min:0},
  {k:'ouro',name:_t("Ouro"),mult:4,col:'#ffd23a',p:.15,min:0},
  {k:'diamante',name:_t("Diamante"),mult:8,col:'#86ecff',p:.07,min:300},
  {k:'platina',name:_t("Platina"),mult:15,col:'#eef3fa',p:.035,min:450},
  {k:'galaxy',name:'Galaxy',mult:30,col:'#c39bff',p:.015,min:600},
  {k:'hacker',name:'Hacker',mult:60,col:'#39ff7a',p:.006,min:800},
  {k:'plineos',name:'Plineos',mult:120,col:'#ff7ad9',p:.002,min:1000},
  {k:'god',name:'God',mult:500,col:'#fff0a0',p:.0006,min:1200}
];
const MUT_BY=Object.fromEntries(MUTS.map((m,i)=>[m.k,{...m,i}]));
const fullName=(v,m,f)=>(f?FUSE[f].name+' ':'')+(m&&m!=='none'?MUT_BY[m].name+' ':'')+VARS[v].name;
const stars=n=>'★'.repeat(n+1);

/* ---------- Verity rendering ---------- */
function bodyPath(vk,x,y,r){
  ctx.beginPath();
  if(vk==='obesity'){ctx.ellipse(x,y+r*.28,r*1.02,r*.74,0,0,TAU);ctx.moveTo(x+r*.62,y-r*.38);ctx.arc(x,y-r*.38,r*.62,0,TAU)}
  else ctx.arc(x,y,r,0,TAU);
}
function eyesOval(x,y,r,ink,dx,dy,rx,ry){const bl=(Math.sin(S.time*1.7+x*.013)>.985)?.15:1;ell(x-r*dx,y+r*dy,r*rx,r*ry*bl,ink);ell(x+r*dx,y+r*dy,r*rx,r*ry*bl,ink)}
function smileArc(x,y,r,ink,cy,rad,a0,a1,w){ctx.strokeStyle=ink;ctx.lineWidth=Math.max(1.4,r*w);ctx.lineCap='round';ctx.beginPath();ctx.arc(x,y+r*cy,r*rad,a0*Math.PI,a1*Math.PI);ctx.stroke()}
function drawFace(vk,x,y,r,hurt){
  switch(vk){
    case 'verity':{
      const ink='#5a3b00';
      if(hurt){
        line([[x-r*.43,y-r*.15],[x-r*.24,y-r*.04],[x-r*.43,y+r*.07]],ink,Math.max(1.6,r*.09));
        line([[x+r*.43,y-r*.15],[x+r*.24,y-r*.04],[x+r*.43,y+r*.07]],ink,Math.max(1.6,r*.09));
        ell(x,y+r*.36,r*.12,r*.1,ink);
      }else{eyesOval(x,y,r,ink,.3,-.04,.08,.13);smileArc(x,y,r,ink,.12,.26,.22,.78,.08)}
      break}
    case 'falsity':eyesOval(x,y,r,'#04102e',.24,-.14,.085,.17);smileArc(x,y,r,'#04102e',-.12,.62,.2,.8,.055);break;
    case 'larpity':eyesOval(x,y,r,'#0b2600',.22,-.16,.08,.17);smileArc(x,y,r,'#0b2600',-.1,.6,.18,.82,.055);break;
    case 'lovity':{
      const ink='#3a0f22'; ctx.strokeStyle=ink; ctx.lineWidth=Math.max(1.4,r*.06); ctx.lineCap='round';
      for(const s of[-1,1]){ctx.beginPath();ctx.arc(x+s*r*.3,y-r*.06,r*.14,1.1*Math.PI,1.9*Math.PI);ctx.stroke()}
      smileArc(x,y,r,ink,-.06,.58,.18,.82,.055);
      circ(x-r*.55,y+r*.14,r*.12,'rgba(255,80,140,.3)'); circ(x+r*.55,y+r*.14,r*.12,'rgba(255,80,140,.3)');
      break}
    case 'cruelty':{
      const ink='#2a0000',w=Math.max(1.6,r*.085);
      line([[x-r*.52,y-r*.44],[x-r*.13,y-r*.22]],ink,w); line([[x+r*.52,y-r*.44],[x+r*.13,y-r*.22]],ink,w);
      ell(x-r*.28,y-r*.08,r*.09,r*.12,ink); ell(x+r*.28,y-r*.08,r*.09,r*.12,ink);
      ctx.strokeStyle=ink; ctx.lineWidth=Math.max(1.3,r*.05); ctx.beginPath(); ctx.moveTo(x-r*.46,y+r*.42);
      ctx.bezierCurveTo(x-r*.22,y+r*.28,x-r*.02,y+r*.5,x+r*.2,y+r*.36); ctx.quadraticCurveTo(x+r*.35,y+r*.27,x+r*.5,y+r*.38); ctx.stroke();
      break}
    case 'eclipse':{
      ctx.save(); ctx.shadowColor='#ffffff'; ctx.shadowBlur=r*.35;
      ell(x-r*.3,y-r*.17,r*.13,r*.21,'#ffffff',.3); ell(x+r*.3,y-r*.17,r*.13,r*.21,'#ffffff',-.3);
      ctx.beginPath(); ctx.moveTo(x-r*.64,y+r*.04); ctx.quadraticCurveTo(x,y+r*.9,x+r*.64,y+r*.04); ctx.quadraticCurveTo(x,y+r*.52,x-r*.64,y+r*.04);
      ctx.fillStyle='#f4f2f7'; ctx.fill(); ctx.restore();
      const yq=(s,c)=>.04*((1-s)*(1-s)+s*s)+2*s*(1-s)*c;
      for(let s=.14;s<.9;s+=.09){const px=x-r*.64+s*r*1.28;line([[px,y+r*yq(s,.52)],[px,y+r*yq(s,.9)]],'#1a1020',Math.max(1,r*.035))}
      line([[x-r*.6,y+r*.12],[x-r*.72,y+r*.02]],'#f4f2f7',Math.max(1,r*.04)); line([[x+r*.6,y+r*.12],[x+r*.72,y+r*.02]],'#f4f2f7',Math.max(1,r*.04));
      break}
    case 'moggity':{
      const ink='#2a1600';
      for(const s of[-1,1]){
        ctx.fillStyle=ink; ctx.beginPath(); ctx.moveTo(x+s*r*.66,y-r*.34); ctx.lineTo(x+s*r*.1,y-r*.3); ctx.lineTo(x+s*r*.1,y-r*.19); ctx.lineTo(x+s*r*.62,y-r*.22); ctx.closePath(); ctx.fill();
        const cx=x+s*r*.33,cy=y-r*.06;
        ell(cx,cy,r*.18,r*.08,'#fffaf0'); circ(cx+r*.05,cy+r*.01,r*.065,'#6a4412'); circ(cx+r*.05,cy+r*.01,r*.03,'#120800');
        ctx.fillStyle='#e9a21a'; ctx.beginPath(); ctx.ellipse(cx,cy,r*.2,r*.1,0,Math.PI,TAU); ctx.fill();
        line([[cx-r*.2,cy],[cx+r*.2,cy-r*.01]],ink,Math.max(1,r*.035));
      }
      line([[x+r*.02,y+r*.02],[x-r*.05,y+r*.19],[x+r*.07,y+r*.21]],'rgba(90,50,0,.5)',Math.max(1,r*.03));
      line([[x-r*.26,y+r*.44],[x+r*.04,y+r*.42],[x+r*.3,y+r*.34]],ink,Math.max(1.2,r*.045));
      ctx.strokeStyle='rgba(110,60,0,.45)'; ctx.lineWidth=Math.max(1,r*.035);
      for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(x+s*r*.66,y+r*.02);ctx.quadraticCurveTo(x+s*r*.58,y+r*.52,x+s*r*.24,y+r*.72);ctx.stroke()}
      break}
    case 'obesity':{
      const ink='#4a2a00',hy=y-r*.38,hr=r*.62;
      ell(x-hr*.3,hy-hr*.12,hr*.09,hr*.15,ink); ell(x+hr*.3,hy-hr*.12,hr*.09,hr*.15,ink);
      ctx.beginPath(); ctx.moveTo(x-hr*.45,hy+hr*.12); ctx.quadraticCurveTo(x,hy+hr*1.0,x+hr*.45,hy+hr*.12); ctx.closePath(); ctx.fillStyle=ink; ctx.fill();
      ell(x,hy+hr*.47,hr*.17,hr*.09,'#e0587a');
      break}
    case 'lord':{
      const ink='#3a2500';
      ell(x-r*.3,y-r*.1,r*.17,r*.14,ink); ell(x+r*.3,y-r*.1,r*.17,r*.14,ink);
      circ(x-r*.27,y-r*.12,r*.045,'#fff'); circ(x+r*.33,y-r*.12,r*.045,'#fff');
      circ(x-r*.06,y+r*.1,r*.035,ink); circ(x+r*.06,y+r*.1,r*.035,ink);
      ell(x,y+r*.4,r*.64,r*.3,'#7a4a08');
      rr(x-r*.56,y+r*.25,r*1.12,r*.3,r*.1); ctx.fillStyle='#fffbea'; ctx.fill();
      for(let tx=x-r*.44;tx<x+r*.5;tx+=r*.125)line([[tx,y+r*.26],[tx,y+r*.54]],'#c9b88a',Math.max(.8,r*.025));
      line([[x-r*.55,y+r*.4],[x+r*.55,y+r*.4]],'#c9b88a',Math.max(.8,r*.025));
      line([[x-r*.72,y+r*.2],[x-r*.62,y+r*.42]],'rgba(140,90,0,.55)',Math.max(1,r*.03)); line([[x+r*.72,y+r*.2],[x+r*.62,y+r*.42]],'rgba(140,90,0,.55)',Math.max(1,r*.03));
      break}
    case 'exu':{
      const ink='#160903',w=Math.max(1,r*.03);
      ctx.save(); bodyPath('exu',x,y,r); ctx.clip(); ell(x,y-r*.52,r*1.15,r*.36,'rgba(20,6,0,.5)'); ctx.restore();
      for(const s of[-1,1]){
        const cx=x+s*r*.3,cy=y-r*.04;
        ell(cx,cy,r*.15,r*.075,'#efe2cc'); circ(cx+s*r*.01,cy+r*.012,r*.058,'#241005');
        ctx.fillStyle='#5a3825'; ctx.beginPath(); ctx.ellipse(cx,cy,r*.17,r*.095,0,Math.PI,TAU); ctx.fill();
        line([[cx-r*.17,cy],[cx+r*.17,cy+r*.01]],ink,w);
        line([[x+s*r*.47,y-r*.21],[x+s*r*.15,y-r*.18]],ink,Math.max(1.2,r*.05));
        line([[x+s*r*.5,y+r*.08],[x+s*r*.42,y+r*.32]],'rgba(30,12,4,.4)',w);
      }
      ell(x,y+r*.17,r*.15,r*.085,'#57331f'); circ(x-r*.07,y+r*.2,r*.035,'#1a0a03'); circ(x+r*.07,y+r*.2,r*.035,'#1a0a03');
      ctx.strokeStyle='#0e0502'; ctx.lineWidth=Math.max(1.2,r*.065); ctx.lineCap='round';
      for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(x+s*r*.03,y+r*.3);ctx.quadraticCurveTo(x+s*r*.18,y+r*.26,x+s*r*.33,y+r*.37);ctx.stroke()}
      line([[x-r*.19,y+r*.45],[x+r*.19,y+r*.45]],'#3a1a0c',Math.max(1,r*.04));
      ell(x,y+r*.5,r*.14,r*.04,'rgba(70,30,15,.6)');
      break}
  }
}
function drawHat(x,y,r){
  ctx.save(); ctx.translate(x+r*.08,y-r*.66); ctx.rotate(-.22);
  rr(-r*.55,-r*.66,r*1.1,r*.72,r*.28); ctx.fillStyle='#f4f4ef'; ctx.fill();
  ctx.fillStyle='#1b1b1b'; ctx.fillRect(-r*.55,-r*.2,r*1.1,r*.14);
  ell(0,r*.06,r*1.32,r*.27,'#ffffff');
  ctx.strokeStyle='#c9c9c0'; ctx.lineWidth=Math.max(1,r*.03); ctx.beginPath(); ctx.ellipse(0,r*.06,r*1.32,r*.27,0,0,TAU); ctx.stroke();
  ctx.restore();
}
function drawFedora(x,y,r,rot=-.08){
  ctx.save(); ctx.translate(x+r*.04,y-r*.6); ctx.rotate(rot);
  const bg=ctx.createLinearGradient(0,-r*.3,0,r*.34); bg.addColorStop(0,'#fbf9f2'); bg.addColorStop(1,'#d3cdbb');
  ctx.fillStyle=bg; ctx.beginPath(); ctx.ellipse(0,r*.04,r*1.36,r*.3,0,0,TAU); ctx.fill();
  const crown=()=>{ctx.beginPath();ctx.moveTo(-r*.62,r*.03);ctx.bezierCurveTo(-r*.67,-r*.5,-r*.5,-r*.74,-r*.18,-r*.71);ctx.quadraticCurveTo(0,-r*.6,r*.18,-r*.71);ctx.bezierCurveTo(r*.5,-r*.74,r*.67,-r*.5,r*.62,r*.03);ctx.closePath()};
  const cg=ctx.createLinearGradient(-r*.62,0,r*.62,0); cg.addColorStop(0,'#e3ddcd'); cg.addColorStop(.45,'#fdfbf5'); cg.addColorStop(1,'#d2cbb9');
  crown(); ctx.fillStyle=cg; ctx.fill();
  line([[-r*.13,-r*.63],[-r*.06,-r*.4]],'rgba(150,138,115,.6)',Math.max(1,r*.03)); line([[r*.13,-r*.63],[r*.06,-r*.4]],'rgba(150,138,115,.6)',Math.max(1,r*.03));
  ctx.save(); crown(); ctx.clip(); ctx.fillStyle='#d4262a'; ctx.fillRect(-r*.7,-r*.21,r*1.4,r*.21); ctx.fillStyle='rgba(0,0,0,.2)'; ctx.fillRect(-r*.7,-r*.035,r*1.4,r*.035); ctx.fillStyle='rgba(255,255,255,.18)'; ctx.fillRect(-r*.7,-r*.21,r*1.4,r*.03); ctx.restore();
  ctx.beginPath(); ctx.ellipse(0,r*.04,r*1.36,r*.3,0,0,Math.PI); ctx.fillStyle='#e9e4d6'; ctx.fill();
  ctx.strokeStyle='rgba(120,108,85,.55)'; ctx.lineWidth=Math.max(1,r*.025); ctx.beginPath(); ctx.ellipse(0,r*.04,r*1.36,r*.3,0,0,TAU); ctx.stroke();
  ctx.restore();
}
function shine(x,y,r,col,t){
  const p=((t*.55)%2.2)-.4; if(p<-.15||p>1.15)return;
  const g=ctx.createLinearGradient(x-r,y-r,x+r,y+r);
  g.addColorStop(clamp(p-.12,0,1),'rgba(255,255,255,0)'); g.addColorStop(clamp(p,0,1),col); g.addColorStop(clamp(p+.12,0,1),'rgba(255,255,255,0)');
  ctx.fillStyle=g; ctx.fillRect(x-r*1.2,y-r*1.2,r*2.4,r*2.6);
}
function rainbow(x,y,r,t){
  const g=ctx.createConicGradient?ctx.createConicGradient(t*1.5,x,y):ctx.createLinearGradient(x-r,y,x+r,y);
  ['#ff4d6d','#ffb03a','#fff04a','#4dff88','#3ad4ff','#7a6bff','#ff5ae0','#ff4d6d'].forEach((c,i,a)=>g.addColorStop(i/(a.length-1),c));
  return g;
}
function mutOverlay(x,y,r,vk,mk,t){
  const tint=c=>{ctx.fillStyle=c;ctx.fillRect(x-r*1.2,y-r*1.2,r*2.4,r*2.6)};
  switch(mk){
    case 'bronze':tint('rgba(190,105,45,.4)');shine(x,y,r,'rgba(255,215,180,.6)',t);break;
    case 'ouro':tint('rgba(255,190,30,.45)');shine(x,y,r,'rgba(255,255,220,.8)',t);break;
    case 'diamante':{
      tint('rgba(120,230,255,.32)');
      const pts=[[x,y-r],[x+r,y],[x,y+r],[x-r,y]];
      ctx.fillStyle='rgba(255,255,255,.14)';
      for(let i=0;i<4;i+=2){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(...pts[i]);ctx.lineTo(...pts[(i+1)%4]);ctx.closePath();ctx.fill()}
      ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=Math.max(1,r*.035); ctx.beginPath();
      for(const p of pts){ctx.moveTo(x,y);ctx.lineTo(...p)}
      ctx.moveTo(x-r*.5,y-r*.5);ctx.lineTo(x+r*.5,y+r*.5);ctx.moveTo(x+r*.5,y-r*.5);ctx.lineTo(x-r*.5,y+r*.5); ctx.stroke();
      shine(x,y,r,'rgba(255,255,255,.75)',t*1.3);break}
    case 'platina':tint('rgba(232,240,252,.48)');shine(x,y,r,'rgba(255,255,255,.9)',t*1.2);break;
    case 'galaxy':{
      const g=ctx.createRadialGradient(x+r*.25,y-r*.2,r*.05,x,y,r*1.3);
      g.addColorStop(0,'rgba(255,120,220,.85)'); g.addColorStop(.45,'rgba(110,60,230,.82)'); g.addColorStop(1,'rgba(10,8,48,.9)');
      ctx.fillStyle=g; ctx.fillRect(x-r*1.2,y-r*1.2,r*2.4,r*2.6);
      for(let i=0;i<22;i++){const sx=x+Math.sin(i*12.9898)*r*.95,sy=y+Math.cos(i*78.233)*r*.95,tw=.5+.5*Math.sin(t*3+i);circ(sx,sy,r*(.025+.02*(i%3))*(.6+tw*.6),`rgba(255,255,255,${.5+tw*.5})`)}
      break}
    case 'hacker':{
      tint('rgba(0,28,10,.6)');
      const fs=Math.max(5,r*.26); ctx.font=`900 ${fs}px ui-monospace,Consolas,monospace`; ctx.textAlign='center'; ctx.textBaseline='middle';
      for(let i=0;i<9;i++){const cx=x-r+i*r*.25+r*.12;for(let j=0;j<9;j++){const cy=y-r*1.05+((j*fs+(t*40+i*17)%fs)%(r*2.4));const on=((i*7+j*13+Math.floor(t*6))%3)!==0;ctx.fillStyle=`rgba(57,255,122,${on?.75:.25})`;ctx.fillText(((i+j+Math.floor(t*5))%2)?'1':'0',cx,cy)}}
      break}
    case 'plineos':ctx.globalAlpha=.5;ctx.fillStyle=rainbow(x,y,r,t);ctx.fillRect(x-r*1.2,y-r*1.2,r*2.4,r*2.6);ctx.globalAlpha=1;shine(x,y,r,'rgba(255,255,255,.7)',t);break;
    case 'god':tint('rgba(255,250,215,.38)');shine(x,y,r,'rgba(255,255,255,.95)',t*1.4);break;
  }
}
function sparkles(x,y,r,n,col,t,rad=1.3){
  for(let i=0;i<n;i++){const a=i*2.39+t*.6,tw=Math.max(0,Math.sin(t*3.2+i*1.7));if(tw<.05)continue;star4(x+Math.cos(a)*r*rad,y+Math.sin(a)*r*rad*.9,r*.2*tw,col)}
}
function mutFront(x,y,r,vk,mk,t){
  const ring=(c,w)=>{bodyPath(vk,x,y,r);ctx.strokeStyle=c;ctx.lineWidth=Math.max(1,w);ctx.stroke()};
  const topY=vk==='obesity'?y-r*1.12:(vk==='lord'||vk==='exu')?y-r*1.6:y-r*1.18;
  switch(mk){
    case 'bronze':ring('#a8642a',r*.09);ring('rgba(255,205,160,.6)',r*.03);break;
    case 'ouro':ring('#d9a400',r*.1);ring('#fff2a0',r*.035);sparkles(x,y,r,3,'#fff6c0',t);break;
    case 'diamante':{
      ring('#9ff0ff',r*.07);
      for(let i=0;i<4;i++){const a=t*1.2+i*TAU/4,px=x+Math.cos(a)*r*1.5,py=y+Math.sin(a)*r*.55,s=r*.17;
        ctx.beginPath();ctx.moveTo(px,py-s);ctx.lineTo(px+s*.7,py);ctx.lineTo(px,py+s);ctx.lineTo(px-s*.7,py);ctx.closePath();ctx.fillStyle='#d4faff';ctx.fill();ctx.strokeStyle='#4fc9e8';ctx.lineWidth=Math.max(1,r*.03);ctx.stroke()}
      sparkles(x,y,r,3,'#ffffff',t);break}
    case 'platina':{
      ring('#ffffff',r*.08);ring('#aab6c4',r*.03);
      ctx.strokeStyle=`rgba(255,255,255,${.35+.3*Math.sin(t*3)})`;ctx.lineWidth=Math.max(1,r*.03);ctx.beginPath();ctx.arc(x,y,r*1.28,0,TAU);ctx.stroke();
      sparkles(x,y,r,2,'#ffffff',t,1.45);break}
    case 'galaxy':ring('rgba(200,160,255,.9)',r*.06);for(let i=0;i<5;i++){const a=t*.9+i*TAU/5;star4(x+Math.cos(a)*r*1.42,y+Math.sin(a)*r*.6,r*.13,'#f3e8ff')}break;
    case 'hacker':{
      ctx.save();ctx.translate(-r*.07,0);ring('rgba(255,0,90,.55)',r*.045);ctx.translate(r*.14,0);ring('rgba(0,255,255,.55)',r*.045);ctx.restore();
      ctx.setLineDash([r*.22,r*.13]);ctx.lineDashOffset=-t*r;ctx.strokeStyle='#39ff7a';ctx.lineWidth=Math.max(1,r*.04);ctx.beginPath();ctx.arc(x,y,r*1.24,0,TAU);ctx.stroke();ctx.setLineDash([]);
      ctx.font=`900 ${Math.max(5,r*.24)}px ui-monospace,Consolas,monospace`;ctx.fillStyle='#39ff7a';ctx.textAlign='center';ctx.textBaseline='middle';
      for(let i=0;i<4;i++){const a=-t*.8+i*TAU/4;ctx.fillText(i%2?'1':'0',x+Math.cos(a)*r*1.5,y+Math.sin(a)*r*1.1)}
      break}
    case 'plineos':ring(rainbow(x,y,r,t),r*.1);sparkles(x,y,r,4,`hsl(${(t*120)%360},100%,80%)`,t);break;
    case 'god':{
      ring('#ffe27a',r*.08);
      ctx.save();ctx.shadowColor='#fff3a0';ctx.shadowBlur=r*.4;ctx.strokeStyle='#ffe27a';ctx.lineWidth=Math.max(1.5,r*.09);
      ctx.beginPath();ctx.ellipse(x,topY+Math.sin(t*2)*r*.05,r*.5,r*.14,0,0,TAU);ctx.stroke();ctx.restore();
      sparkles(x,y,r,4,'#fff6c0',t,1.4);break}
  }
}
function drawVariant(x,y,r,vk,mk,o={}){
  const V=VARS[vk]||VARS.verity,t=o.t??S.time,fx=!o.noFx;
  mk=MUT_BY[mk]?mk:'none';
  ctx.save();
  if(fx&&mk==='god'){
    ctx.save();ctx.translate(x,y);ctx.rotate(t*.3);
    for(let i=0;i<12;i++){ctx.rotate(TAU/12);const g=ctx.createLinearGradient(0,0,r*3.1,0);g.addColorStop(0,'rgba(255,240,170,.55)');g.addColorStop(1,'rgba(255,240,170,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(r*3.1,-r*.22);ctx.lineTo(r*3.1,r*.22);ctx.closePath();ctx.fill()}
    ctx.restore();
    for(const s of[-1,1]){ctx.save();ctx.translate(x+s*r*.8,y-r*.15);ctx.scale(s,1);ctx.rotate(-.35+Math.sin(t*3)*.12);
      for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse(r*.5,-r*.12+k*r*.22,r*.62-k*r*.1,r*.15,-.3+k*.2,0,TAU);ctx.fillStyle='#fffaf0';ctx.fill();ctx.strokeStyle='rgba(200,180,120,.8)';ctx.lineWidth=Math.max(1,r*.025);ctx.stroke()}
      ctx.restore()}
  }
  const ga=o.glow??1;
  if(fx&&ga>0){
    let gc=V.glow,gr=2.6;
    if(mk==='galaxy'){gc='150,90,255';gr=3}else if(mk==='god'){gc='255,240,170';gr=3.1}else if(mk==='hacker')gc='60,255,120';else if(mk==='platina')gc='235,245,255';else if(mk==='plineos'){gc='255,120,220';gr=2.9}
    const g=ctx.createRadialGradient(x,y,r*.3,x,y,r*gr);g.addColorStop(0,`rgba(${gc},${(vk==='eclipse'?.65:.5)*ga})`);g.addColorStop(1,`rgba(${gc},0)`);
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*gr,0,TAU);ctx.fill();
  }
  if(V.gen)drawAccBack(V,x,y,r,t);
  const b=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.08,x,y,r*1.05);
  b.addColorStop(0,V.col[0]);b.addColorStop(.45,V.col[1]);b.addColorStop(1,V.col[2]);
  bodyPath(vk,x,y,r);ctx.fillStyle=b;ctx.fill();
  if(vk==='obesity'){
    ell(x-r*.66,y+r*.12,r*.2,r*.32,'#e3b52a',.3); ell(x+r*.66,y+r*.12,r*.2,r*.32,'#e3b52a',-.3);
    ell(x-r*.48,y+r*.32,r*.17,r*.13,'#f7d84e'); ell(x+r*.48,y+r*.32,r*.17,r*.13,'#f7d84e');
    ell(x,y+r*.55,r*.06,r*.04,'#b8860b');
    ctx.strokeStyle='rgba(160,110,0,.4)';ctx.lineWidth=Math.max(1,r*.03);ctx.beginPath();ctx.arc(x,y+r*.15,r*.75,.2*Math.PI,.8*Math.PI);ctx.stroke();
  }
  if(vk==='eclipse'){bodyPath(vk,x,y,r);ctx.strokeStyle='rgba(150,110,255,.75)';ctx.lineWidth=Math.max(1.2,r*.06);ctx.stroke()}
  if(mk!=='none'){ctx.save();bodyPath(vk,x,y,r);ctx.clip();mutOverlay(x,y,r,vk,mk,t);ctx.restore()}
  if(vk!=='eclipse')ell(x-r*.38,y-r*(vk==='obesity'?.72:.42),r*.22,r*.12,'rgba(255,255,255,.7)',-.6);
  else ell(x-r*.4,y-r*.45,r*.2,r*.1,'rgba(255,255,255,.16)',-.6);
  if(o.face!==false&&r>=7){if(V.gen)drawGenFace(V,x,y,r,o.hurt);else drawFace(vk,x,y,r,o.hurt)}
  if(fx&&mk!=='none')mutFront(x,y,r,vk,mk,t);
  if(vk==='lord')drawHat(x,y,r);
  if(vk==='exu'&&!o.noHat)drawFedora(x,y,r);
  if(V.gen)drawAccFront(V,x,y,r,t);
  if(fx&&o.f)drawFusion(x,y,r,o.f,t);
  if(o.lvl>1&&r>=14&&o.badge!==false){
    rr(x+r*.35,y+r*.55,r*.9,r*.42,r*.2);ctx.fillStyle='rgba(10,24,22,.85)';ctx.fill();
    txt(_t("Nv")+o.lvl,x+r*.8,y+r*.77,Math.max(7,r*.3),'#ffd21f',{stroke:false});
  }
  ctx.restore();
}
function drawVerity(x,y,r,o={}){drawVariant(x,y,r,'verity','none',o)}

/* ---------- cosmetics catalog ---------- */
const COS={
  skin:{label:_t("Pele"),items:{
    s1:{name:_t("Clara"),price:0,col:'#efc097'},s2:{name:_t("Rosada"),price:0,col:'#f6d0b8'},s3:{name:_t("Morena"),price:0,col:'#d39b6a'},
    s4:{name:_t("Parda"),price:0,col:'#a8714c'},s5:{name:_t("Negra"),price:0,col:'#6b4530'},
    alien:{name:_t("Alienígena"),price:2500,col:'#8fd96b'},azul:{name:_t("Azul"),price:2500,col:'#79a9ff'},ouro:{name:_t("Dourada"),price:12000,col:'#f2c94c'}}},
  hair:{label:_t("Cabelo"),items:{
    curto:{name:_t("Curto"),price:0},careca:{name:_t("Careca"),price:300},longo:{name:_t("Longo"),price:1000},moicano:{name:_t("Moicano Verde"),price:1200},
    topete:{name:_t("Topete Loiro"),price:1400},blackpower:{name:_t("Black Power"),price:1800},rosa:{name:_t("Rosa Neon"),price:2500}}},
  hat:{label:_t("Chapéu"),items:{
    nenhum:{name:_t("Nenhum"),price:0},bone:{name:_t("Boné Vermelho"),price:600},palha:{name:_t("Chapéu de Palha"),price:900},
    cartola:{name:_t("Cartola"),price:2500},viking:{name:_t("Capacete Viking"),price:3500},coroa:{name:_t("Coroa"),price:6000},fedora:{name:_t("Chapéu do Zé"),price:9000}}},
  glasses:{label:_t("Óculos"),items:{
    nenhum:{name:_t("Nenhum"),price:0},nerd:{name:'Nerd',price:400},escuros:{name:_t("Escuros"),price:500},tres_d:{name:'3D',price:700},
    coracao:{name:_t("Coração"),price:900},monoculo:{name:_t("Monóculo"),price:1500}}},
  shirt:{label:_t("Roupa"),items:{
    listrada:{name:_t("Listrada Laranja"),price:0,base:'#e8743f',dark:'#cf5b2b'},regata:{name:_t("Regata Branca"),price:600,base:'#f2f2ee',dark:'#cfcfc8'},
    preta:{name:_t("Camiseta da Verity"),price:800,base:'#26262e',dark:'#15151b'},canarinho:{name:_t("Canarinho"),price:1200,base:'#ffd21f',dark:'#1f9a3a'},
    havaiana:{name:_t("Havaiana"),price:1500,base:'#22a99a',dark:'#178477'},moletom:{name:_t("Moletom Roxo"),price:2000,base:'#7b4bd6',dark:'#5b34a8'},
    terno:{name:_t("Terno Branco"),price:6000,base:'#f2efe6',dark:'#cfc9b8'}}}
};
const DEFAULT_EQ={skin:'s1',hair:'curto',hat:'nenhum',glasses:'nenhum',shirt:'listrada',bath:1,intr:'irmao'};
const cosItem=(cat,k)=>COS[cat].items[k]||COS[cat].items[Object.keys(COS[cat].items)[0]];

/* ---------- the player character (drawn in a 540-wide frame, head at 270,250) ---------- */
function drawHairBack(kind){
  if(drawHairBackExtra(kind))return;
  if(kind==='blackpower')circ(270,226,94,'#1d130e');
  else if(kind==='longo'){rr(204,214,132,148,46);ctx.fillStyle='#4a2c1a';ctx.fill()}
}
function drawHairFront(kind){
  const cap=col=>{ctx.fillStyle=col;ctx.beginPath();ctx.arc(270,246,61,Math.PI*1.05,Math.PI*1.95);ctx.quadraticCurveTo(304,206,274,216);ctx.quadraticCurveTo(244,204,210,236);ctx.closePath();ctx.fill()};
  switch(kind){
    case 'curto':cap('#2b1d16');break;
    case 'rosa':cap('#ff4fb2');ell(256,205,14,6,'rgba(255,255,255,.35)',-.3);break;
    case 'longo':cap('#4a2c1a');break;
    case 'topete':cap('#e0b94e');ell(286,188,40,20,'#e8c35a',-.35);ell(276,184,18,7,'rgba(255,255,255,.35)',-.35);break;
    case 'careca':ell(252,206,18,8,'rgba(255,255,255,.35)',-.4);break;
    case 'moicano':{ctx.fillStyle='#39d353';ctx.beginPath();ctx.moveTo(252,206);for(let i=0;i<=6;i++){const x=254+i*5.5;ctx.lineTo(x,i%2?192:150+Math.abs(3-i)*6)}ctx.lineTo(288,206);ctx.closePath();ctx.fill();break}
    default:drawHairFrontExtra(kind,cap);break;
    case 'blackpower':{ctx.fillStyle='#1d130e';ctx.beginPath();ctx.arc(270,246,62,Math.PI*1.08,Math.PI*1.92);ctx.quadraticCurveTo(270,222,212,234);ctx.closePath();ctx.fill();break}
  }
}
function drawHatOn(kind){
  switch(kind){
    case 'bone':ctx.fillStyle='#d8352f';ctx.beginPath();ctx.arc(270,218,64,Math.PI,TAU);ctx.closePath();ctx.fill();ell(312,218,58,12,'#b52a25');circ(270,155,6,'#b52a25');line([[270,156],[270,216]],'rgba(0,0,0,.18)',3);break;
    case 'palha':ell(270,204,112,25,'#e6c36a');rr(222,140,96,66,26);ctx.fillStyle='#e9cc7a';ctx.fill();ctx.fillStyle='#7a3b1f';ctx.fillRect(222,184,96,12);for(let i=0;i<6;i++)line([[180+i*36,198],[196+i*36,210]],'rgba(150,110,40,.5)',2);break;
    case 'cartola':ell(270,200,86,15,'#18181c');rr(226,96,88,106,8);ctx.fillStyle='#1f1f25';ctx.fill();ctx.fillStyle='#c9262c';ctx.fillRect(226,176,88,14);ell(250,110,10,4,'rgba(255,255,255,.15)');break;
    case 'coroa':{poly([[222,206],[222,160],[240,182],[256,148],[270,176],[284,148],[300,182],[318,160],[318,206]],'#f2c230');ctx.strokeStyle='#b8860b';ctx.lineWidth=3;ctx.stroke();circ(256,190,6,'#e0303a');circ(284,190,6,'#3a7bea');circ(270,192,7,'#38c95a');break}
    case 'viking':{ctx.fillStyle='#9aa3ad';ctx.beginPath();ctx.arc(270,220,66,Math.PI,TAU);ctx.closePath();ctx.fill();ctx.fillStyle='#7c858f';ctx.fillRect(204,206,132,14);ctx.fillRect(264,154,12,52);
      for(const s of[-1,1]){ctx.fillStyle='#f3ead8';ctx.beginPath();ctx.moveTo(270+s*60,200);ctx.quadraticCurveTo(270+s*112,190,270+s*106,128);ctx.quadraticCurveTo(270+s*92,178,270+s*58,182);ctx.closePath();ctx.fill()}break}
    case 'fedora':drawFedora(270,256,64,-.05);break;
    default:drawHatExtra(kind);break;
  }
}
function drawGlasses(kind){
  switch(kind){
    case 'escuros':rr(226,240,40,24,8);ctx.fillStyle='#111';ctx.fill();rr(274,240,40,24,8);ctx.fill();line([[266,248],[274,248]],'#111',4);line([[232,246],[244,246]],'rgba(255,255,255,.35)',3);line([[280,246],[292,246]],'rgba(255,255,255,.35)',3);break;
    case 'nerd':ctx.strokeStyle='#1b1b1b';ctx.lineWidth=5;ctx.beginPath();ctx.arc(248,252,16,0,TAU);ctx.moveTo(308,252);ctx.arc(292,252,16,0,TAU);ctx.stroke();line([[264,250],[276,250]],'#1b1b1b',4);break;
    case 'coracao':for(const x of[248,292]){ctx.fillStyle='rgba(255,60,140,.9)';ctx.beginPath();ctx.moveTo(x,266);ctx.bezierCurveTo(x-26,248,x-14,232,x,244);ctx.bezierCurveTo(x+14,232,x+26,248,x,266);ctx.fill()}line([[262,248],[278,248]],'#d02a7a',3);break;
    case 'tres_d':rr(224,238,92,28,4);ctx.fillStyle='#f4f4f4';ctx.fill();rr(229,242,36,20,3);ctx.fillStyle='rgba(255,40,60,.75)';ctx.fill();rr(275,242,36,20,3);ctx.fillStyle='rgba(40,200,255,.75)';ctx.fill();break;
    default:drawGlassesExtra(kind);break;
    case 'monoculo':ctx.strokeStyle='#d4a62a';ctx.lineWidth=4;ctx.beginPath();ctx.arc(292,252,17,0,TAU);ctx.stroke();ctx.fillStyle='rgba(200,230,255,.25)';ctx.fill();line([[300,268],[312,300],[306,330]],'#d4a62a',2);break;
  }
}
function drawShirt(kind,skin){
  const sh=cosItem('shirt',kind),base=sh.base,dark=sh.dark;
  if(kind==='moletom')ell(270,334,62,22,dark);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(194,342); ctx.quadraticCurveTo(270,326,346,342); ctx.lineTo(352,486); ctx.quadraticCurveTo(270,526,188,486); ctx.closePath();
  ctx.fillStyle=base; ctx.fill(); ctx.clip();
  switch(kind){
    case 'listrada':ctx.fillStyle=dark;for(let y=350;y<530;y+=26)ctx.fillRect(180,y,180,11);break;
    case 'preta':drawVariant(270,420,26,'verity','none',{glow:0,t:1});txt('VERITY',270,462,14,'#ffd21f',{stroke:false});break;
    case 'havaiana':for(let i=0;i<16;i++){const x=196+(i*53)%150,y=352+(i*37)%150,c=i%2?'#ffd23a':'#ff6f9a';for(let k=0;k<5;k++)circ(x+Math.cos(k*1.26)*6,y+Math.sin(k*1.26)*6,5,c);circ(x,y,3.5,'#fff3c4')}break;
    case 'canarinho':ctx.fillStyle=dark;ctx.fillRect(180,474,180,14);ell(270,338,26,10,dark);break;
    case 'moletom':rr(226,446,88,40,12);ctx.fillStyle=dark;ctx.fill();line([[260,345],[256,392]],'#ece6ff',3);line([[280,345],[284,392]],'#ece6ff',3);break;
    case 'regata':ctx.fillStyle=skin;ell(206,352,20,30,skin);ell(334,352,20,30,skin);ctx.fillStyle=base;ctx.fillRect(228,338,20,40);ctx.fillRect(292,338,20,40);break;
    default:drawShirtExtra(kind,base,dark,skin);break;
    case 'terno':poly([[252,338],[236,420],[262,404]],dark);poly([[288,338],[304,420],[278,404]],dark);poly([[262,338],[270,352],[278,338]],'#ffffff');poly([[266,352],[260,430],[270,446],[280,430],[274,352]],'#d4262a');poly([[310,382],[330,382],[322,370]],'#d4262a');break;
  }
  ctx.restore();
}
function drawPerson(q,eq){
  eq=eq||DEFAULT_EQ;
  const F=q.F||0,st=q.strain||0,h=!!q.holding;
  const skinBase=cosItem('skin',eq.skin).col,shirt=cosItem('shirt',eq.shirt);
  const k=clamp(st/100*.85+F*.3,0,1);
  const skin=k<.7?mix(skinBase,'#e35a4c',k/.7*.85):mix(mix(skinBase,'#e35a4c',.85),'#a83f7e',(k-.7)/.3);
  const leg=skinBase,legS=shade(skinBase,-.08);
  const j=h&&!RM?F:0, jx=(Math.random()-.5)*j*5, jy=(Math.random()-.5)*j*3;
  const longSleeve=['terno','moletom','pijama','smoking','astro','camuflado'].includes(eq.shirt),sleeve=eq.shirt==='regata'?skinBase:shirt.base;
  ctx.save(); ctx.translate(jx,jy);
  drawHairBack(eq.hair);
  drawShirt(eq.shirt,skinBase);
  ctx.fillStyle=shade(skinBase,-.06); ctx.fillRect(254,296,32,44);
  if(eq.shirt!=='terno'&&eq.shirt!=='canarinho')ell(270,340,22,8,shirt.dark);
  ell(222,530,48,30,leg); ell(318,530,48,30,leg);
  rr(192,556,46,130,22); ctx.fillStyle=leg; ctx.fill(); rr(302,556,46,130,22); ctx.fill();
  ell(215,560,31,26,legS); ell(325,560,31,26,legS);
  rr(166,664,208,42,18); ctx.fillStyle='#3e5c9a'; ctx.fill();
  for(const x of[178,210,242,270,298,330,362])circ(x,690+((x*7)%9),20,'#3e5c9a');
  line([[200,676],[214,700]],'#2d457a',3); line([[262,672],[268,702]],'#2d457a',3); line([[330,676],[318,700]],'#2d457a',3);
  rr(178,654,184,16,8); ctx.fillStyle='#f2f2ee'; ctx.fill(); ctx.fillStyle='#d6453d'; ctx.fillRect(184,659,172,3);
  ell(204,714,40,13,'#1d1f26'); ell(336,714,40,13,'#1d1f26');
  const grip=h?F*3:0;
  line([[206,352],[178,456]],sleeve,34); line([[178,456],[212-grip,546]],longSleeve?shirt.base:leg,26); circ(214-grip,552,17,legS);
  line([[334,352],[362,456]],sleeve,34); line([[362,456],[328+grip,546]],longSleeve?shirt.base:leg,26); circ(326+grip,552,17,legS);
  if(eq.shirt==='canarinho'){line([[192,404],[186,420]],shirt.dark,6);line([[348,404],[354,420]],shirt.dark,6)}
  const hx=270,hy=250;
  circ(208,258,13,skin); circ(332,258,13,skin);
  circ(hx,hy,60,skin);
  drawHairFront(eq.hair);
  circ(232,276,11,`rgba(255,80,80,${.18+k*.4})`); circ(308,276,11,`rgba(255,80,80,${.18+k*.4})`);
  const sq=clamp((F-.25)*1.6+(st>60?.45:0),0,1),ink='#2b1d16';
  if(q.shock){
    ell(248,252,13,15,'#fff'); ell(292,252,13,15,'#fff'); circ(248,252,4,'#1b1b1b'); circ(292,252,4,'#1b1b1b');
  }else if(sq<.55){
    const op=1-sq*.8;
    ell(248,252,11,12*op,'#fff'); ell(292,252,11,12*op,'#fff');
    const look=q.knock?3:0;
    ell(249+look,254,5,5*op,'#1b1b1b'); ell(291+look,254,5,5*op,'#1b1b1b');
  }else{
    line([[237,243],[256,252],[237,261]],ink,4); line([[303,243],[284,252],[303,261]],ink,4);
  }
  line([[234,232],[260,236+F*9]],ink,5); line([[306,232],[280,236+F*9]],ink,5);
  if(q.shock){ell(270,290,12,16,'#5a2a20')}
  else if(!h||F<.15){
    ctx.strokeStyle='#7a3a2a'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(258,286); ctx.quadraticCurveTo(270,st>50?280:292,282,286); ctx.stroke();
  }else{
    const mw=26+F*24,mh=12+F*8;
    rr(270-mw/2,278,mw,mh,5); ctx.fillStyle='#fff'; ctx.fill(); ctx.strokeStyle='#5a2a20'; ctx.lineWidth=3; ctx.stroke();
    line([[270-mw/2,278+mh/2],[270+mw/2,278+mh/2]],'#b9aaa5',2);
    for(let x=270-mw/2+7;x<270+mw/2-3;x+=7)line([[x,279],[x,277+mh]],'#cfc3bf',1.5);
  }
  if(st>40){
    const pw=3.5*(1+Math.sin(S.time*12)*.2);
    line([[284,212],[291,221],[284,229],[292,238]],'#6b1f5c',pw);
    if(st>70)line([[226,230],[220,242],[228,250]],'#6b1f5c',pw*.9);
  }
  drawGlasses(eq.glasses);
  drawHatOn(eq.hat);
  ctx.restore();
}

/* ---------- intruders ---------- */
const INTRUDERS={
  irmao:{name:_t("Irmão Mais Novo"),price:0,knock:_t("Sai logo, eu preciso!"),enter:_t("ECA! VOU CONTAR PRA MÃE!")},
  namorada:{name:_t("Namorada"),price:2500,knock:_t("Amor, tô apertada!"),enter:_t("AMOR?! QUE CHEIRO É ESSE?")},
  pai:{name:_t("Pai"),price:3000,knock:_t("Filho, vai demorar?"),enter:_t("É PAVÊ OU PRA CAGAR?")},
  tio:{name:_t("Tio"),price:3500,knock:_t("Sobrinho, abre aí!"),enter:_t("OPA! FOI MAL, CAMPEÃO!")},
  ze:{name:'Zé Pilintra',price:20000,knock:_t("Salve! Vai demorar, camarada?"),enter:_t("LAROYÊ! COM LICENÇA!")}
};
function figureBase(x,y,s,o){
  ctx.save(); ctx.translate(x,y); ctx.scale(s,s);
  ell(0,0,70,12,'rgba(0,0,0,.35)');
  rr(-40,-150,34,146,14); ctx.fillStyle=o.legs; ctx.fill(); rr(6,-150,34,146,14); ctx.fill();
  if(o.legSkin){rr(-36,-80,26,70,10);ctx.fillStyle=o.skin;ctx.fill();rr(10,-80,26,70,10);ctx.fill()}
  ell(-24,-4,26,10,o.shoes); ell(24,-4,26,10,o.shoes);
  if(o.belly){ell(0,-185,66,70,o.top)} else {rr(-56,-280,112,140,30);ctx.fillStyle=o.top;ctx.fill()}
  if(o.topDeco)o.topDeco();
  line([[-54,-262],[-74,-180],[-62,-120]],o.sleeves||o.top,22); line([[54,-262],[74,-180],[62,-120]],o.sleeves||o.top,22);
  circ(-62,-116,12,o.skin); circ(62,-116,12,o.skin);
  ctx.fillStyle=o.skin; ctx.fillRect(-12,-300,24,26);
  if(o.hairBack)o.hairBack();
  circ(0,-330,40,o.skin);
  if(o.hairFront)o.hairFront();
  ell(-14,-332,8,10,'#fff'); ell(14,-332,8,10,'#fff'); circ(-14,-330,3.5,'#111'); circ(14,-330,3.5,'#111');
  line([[-24,-348],[-6,-344]],'#2b1d16',3.5); line([[24,-348],[6,-344]],'#2b1d16',3.5);
  ell(0,-306,8,10,'#5a2a20');
  if(o.face)o.face();
  if(o.hat)o.hat();
  if(o.extra)o.extra();
  ctx.restore();
}
function drawIntruder(kind,x,y,s){
  switch(kind){
    case 'namorada':figureBase(x,y,s*.95,{skin:'#d39b6a',top:'#ff6fa5',legs:'#3a4f9a',shoes:'#f4f4f4',
      hairBack:()=>{rr(-46,-372,92,120,40);ctx.fillStyle='#2b1a12';ctx.fill()},
      hairFront:()=>{ctx.fillStyle='#2b1a12';ctx.beginPath();ctx.arc(0,-334,42,Math.PI*1.05,Math.PI*1.95);ctx.quadraticCurveTo(10,-354,-38,-340);ctx.fill()},
      face:()=>{circ(-40,-318,4,'#ffd23a');circ(40,-318,4,'#ffd23a');ell(0,-306,9,6,'#c2264a')}});break;
    case 'pai':figureBase(x,y,s*1.02,{skin:'#efc097',top:'#f4f4f4',legs:'#6b7f3a',shoes:'#7a4a2a',belly:true,legSkin:true,
      hairFront:()=>{ell(-36,-336,10,18,'#9a9a9a');ell(36,-336,10,18,'#9a9a9a');ell(0,-366,22,7,'rgba(255,255,255,.35)')},
      face:()=>{ctx.fillStyle='#4a3020';ctx.beginPath();ctx.ellipse(0,-316,18,6,0,0,Math.PI);ctx.fill();ctx.strokeStyle='#222';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-14,-332,11,0,TAU);ctx.moveTo(25,-332);ctx.arc(14,-332,11,0,TAU);ctx.stroke()},
      extra:()=>{rr(56,-200,46,60,4);ctx.fillStyle='#e9e4d6';ctx.fill();for(let i=0;i<5;i++)line([[62,-190+i*10],[96,-190+i*10]],'#9a968a',2)}});break;
    case 'tio':figureBase(x,y,s,{skin:'#d9a37a',top:'#ff8a3d',legs:'#d9c49a',shoes:'#3a2a1a',legSkin:true,
      topDeco:()=>{for(let i=0;i<10;i++){const px=-40+(i*31)%80,py=-270+(i*43)%120;for(let k=0;k<5;k++)circ(px+Math.cos(k*1.26)*5,py+Math.sin(k*1.26)*5,4.5,i%2?'#fff36a':'#ff4f7a')}},
      hairFront:()=>{ctx.fillStyle='#1f5fd1';ctx.beginPath();ctx.arc(0,-340,42,Math.PI,TAU);ctx.fill();ell(-30,-342,40,9,'#1a4fb0')},
      face:()=>{rr(-30,-372,60,14,6);ctx.fillStyle='#111';ctx.fill();ctx.strokeStyle='#5a2a20';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-312,12,.15*Math.PI,.85*Math.PI);ctx.stroke()},
      extra:()=>{circ(-74,-150,12,'#d9a37a');line([[-74,-162],[-74,-178]],'#d9a37a',8)}});break;
    case 'ze':figureBase(x,y,s,{skin:'#6b4530',top:'#f2efe6',legs:'#f2efe6',shoes:'#f4f4f4',
      topDeco:()=>{poly([[-14,-280],[-30,-200],[-6,-214]],'#d9d3c3');poly([[14,-280],[30,-200],[6,-214]],'#d9d3c3');poly([[-5,-276],[-9,-200],[0,-188],[9,-200],[5,-276]],'#d4262a');poly([[26,-240],[44,-240],[36,-252]],'#d4262a')},
      face:()=>{ctx.strokeStyle='#0e0502';ctx.lineWidth=5;ctx.lineCap='round';for(const sx of[-1,1]){ctx.beginPath();ctx.moveTo(sx*2,-314);ctx.quadraticCurveTo(sx*12,-318,sx*22,-310);ctx.stroke()}},
      hat:()=>drawFedora(0,-322,46,-.1),
      extra:()=>{line([[64,-118],[78,0]],'#2a1a10',6);ctx.strokeStyle='#d8b54a';ctx.lineWidth=6;ctx.beginPath();ctx.arc(70,-118,10,Math.PI,TAU);ctx.stroke()}});break;
    default:if(drawIntruderExtra(kind,x,y,s))break;figureBase(x,y,s*.8,{skin:'#efc097',top:'#3ba55d',legs:'#2d4a8a',shoes:'#e8e8e8',legSkin:true,
      hairFront:()=>{ctx.fillStyle='#2463d6';ctx.beginPath();ctx.arc(0,-340,42,Math.PI,TAU);ctx.fill();ell(30,-342,30,8,'#1d4fb0')},
      topDeco:()=>{rr(-20,-240,40,30,6);ctx.fillStyle='#2b2b33';ctx.fill();circ(-8,-225,4,'#ff4d5e');circ(8,-225,4,'#39d353')}});
  }
}

/* ---------- bathrooms ---------- */
const BATHS=[
  {name:_t("Rodoviária"),price:0,wall:'#56645a',grout:'#3a463e',floor:['#3a3c36','#2c2e29'],toilet:'#e8e6dc',decor:'grafite'},
  {name:_t("Casa da Vó"),price:2000,wall:'#2c6e63',grout:'#1f5249',floor:['#3c4152','#2a2e3a'],toilet:'#fbfaf4',decor:'planta'},
  {name:_t("Shopping"),price:6000,wall:'#3a4c66',grout:'#2b3a50',floor:['#cfd4dc','#b5bcc7'],toilet:'#fbfaf4',decor:'secador'},
  {name:_t("Hotel 5 Estrelas"),price:15000,wall:'#7a6650',grout:'#5f4f3d',floor:['#e9e0cf','#d6cab3'],toilet:'#fbfaf4',decor:'quadro'},
  {name:_t("Mansão"),price:40000,wall:'#2e2a4a',grout:'#221f38',floor:['#5a2230','#461a26'],toilet:'#fbfaf4',decor:'lustre'},
  {name:_t("Banheiro de Ouro"),price:100000,wall:'#7a5a12',grout:'#5c430c',floor:['#3a2a08','#2a1e06'],toilet:'#f2c94c',decor:'ouro'},
  {name:_t("Estação Espacial"),price:250000,wall:'#18223e',grout:'#0e1528',floor:['#2a3350','#202842'],toilet:'#dfe6f2',decor:'espaco'},
  {name:_t("Trono dos Deuses"),price:750000,wall:'#d9d2ff',grout:'#bfb4f2',floor:['#f3efff','#e2dbff'],toilet:'#f2c94c',decor:'ceu'}
].map((b,i)=>({...b,tier:i+1,luck:1+.2*Math.log2(i+1)}));
const bathOf=n=>BATHS[clamp((n|0)-1,0,BATHS.length-1)];
function drawBathroomBG(b,o={}){
  const fy=o.floorY||604,ts=48;
  ctx.fillStyle=b.wall; ctx.fillRect(0,0,W,fy);
  for(let y=0;y<fy;y+=ts)for(let x=0;x<W;x+=ts){ctx.fillStyle=((x/ts+y/ts)%2)?'rgba(255,255,255,.03)':'rgba(0,0,0,.035)';ctx.fillRect(x,y,ts,ts);ctx.fillStyle='rgba(255,255,255,.07)';ctx.fillRect(x+4,y+4,12,3)}
  ctx.strokeStyle=b.grout; ctx.lineWidth=2; ctx.beginPath();
  for(let x=0;x<=W;x+=ts){ctx.moveTo(x,0);ctx.lineTo(x,fy)} for(let y=0;y<=fy;y+=ts){ctx.moveTo(0,y);ctx.lineTo(W,y)} ctx.stroke();
  const t=S.time;
  switch(b.decor){
    case 'grafite':
      ctx.save();ctx.translate(250,260);ctx.rotate(-.08);txt(_t("VERITY ESTEVE AQUI"),0,0,30,'rgba(255,90,90,.75)',{stroke:false});txt('♥ 2026',30,40,24,'rgba(120,200,255,.7)',{stroke:false});ctx.restore();
      line([[860,120],[880,170],[868,210]],'rgba(20,20,20,.5)',2);line([[150,420],[190,440]],'rgba(20,20,20,.4)',2);break;
    case 'planta':rr(150,500,70,100,10);ctx.fillStyle='#b5562e';ctx.fill();for(let i=0;i<7;i++)ell(185+Math.cos(i)*30,470-i*10,34,12,'#3fa34d',-.8+i*.3);rr(820,240,90,10,4);ctx.fillStyle='#c9c9c0';ctx.fill();rr(830,250,60,110,8);ctx.fillStyle='#ff9ec4';ctx.fill();break;
    case 'secador':rr(170,240,90,120,12);ctx.fillStyle='#dfe3ea';ctx.fill();rr(190,350,50,12,4);ctx.fillStyle='#9aa3ad';ctx.fill();rr(150,90,820,70,8);ctx.fillStyle='rgba(200,230,255,.25)';ctx.fill();break;
    case 'quadro':rr(160,170,150,120,4);ctx.fillStyle='#c9a24a';ctx.fill();rr(172,182,126,96,2);ctx.fillStyle='#3f6e8a';ctx.fill();circ(235,240,26,'#ffd21f');ctx.strokeStyle='rgba(255,215,140,.35)';ctx.lineWidth=2;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(0,90+i*80);ctx.lineTo(W,60+i*80);ctx.stroke()}break;
    case 'lustre':{line([[640,0],[640,60]],'#c9a24a',3);for(let i=-3;i<=3;i++){circ(640+i*26,80+Math.abs(i)*6,7,'#fff6c8');ell(640+i*26,96+Math.abs(i)*6,4,10,'rgba(255,250,220,.6)')}const g=ctx.createRadialGradient(640,80,10,640,80,420);g.addColorStop(0,'rgba(255,230,160,.25)');g.addColorStop(1,'rgba(255,230,160,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,fy);rr(150,170,140,170,4);ctx.fillStyle='#c9a24a';ctx.fill();rr(162,182,116,146,2);ctx.fillStyle='#2a2440';ctx.fill();drawVariant(220,255,34,'lord','none',{glow:0,t:1});break}
    case 'ouro':for(let i=0;i<14;i++){const a=t*2+i;star4(((i*97)%W),((i*61)%560)+20,5+3*Math.max(0,Math.sin(a)),'rgba(255,240,170,.8)')}break;
    case 'espaco':{circ(240,250,110,'#0a0f22');ctx.save();ctx.beginPath();ctx.arc(240,250,100,0,TAU);ctx.clip();ctx.fillStyle='#02040c';ctx.fillRect(130,140,220,220);for(let i=0;i<40;i++)circ(140+(i*53+t*10)%200,150+(i*37)%200,1.5,'#fff');circ(280,300,44,'#d96b3a');ell(280,300,70,12,'rgba(230,200,150,.6)',-.3);ctx.restore();ctx.strokeStyle='#8a96b8';ctx.lineWidth=10;ctx.beginPath();ctx.arc(240,250,105,0,TAU);ctx.stroke();break}
    default:drawDecorExtra(b,t);break;
    case 'ceu':{for(let i=0;i<5;i++){const x=(i*290+t*12)%(W+300)-150;for(let k=0;k<4;k++)circ(x+k*40,130+i%2*90+Math.sin(k)*12,36,'rgba(255,255,255,.75)')}for(const x of[150,1080]){rr(x,120,60,484,6);ctx.fillStyle='#f6f2ff';ctx.fill();for(let k=0;k<5;k++)line([[x+12+k*9,130],[x+12+k*9,594]],'rgba(180,170,230,.5)',2)}
      ctx.save();ctx.globalAlpha=.25;ctx.translate(640,-60);ctx.rotate(t*.05);for(let i=0;i<10;i++){ctx.rotate(TAU/10);poly([[0,0],[900,-60],[900,60]],'#fff2b0')}ctx.restore();break}
  }
  for(let r=0;r<4;r++){const y0=fy+r*30;for(let c=-1;c<23;c++){ctx.fillStyle=(r+c)%2?b.floor[1]:b.floor[0];ctx.fillRect(c*60+(r%2)*30,y0,60,30)}}
  ctx.fillStyle='rgba(0,0,0,.45)'; ctx.fillRect(0,fy-6,W,8);
  const flick=b.tier===1&&Math.sin(t*37)>.95?.55:1;
  const lg=ctx.createRadialGradient(640,-40,20,640,-40,900); lg.addColorStop(0,`rgba(235,255,245,${.24*flick})`); lg.addColorStop(.55,'rgba(0,0,0,0)'); lg.addColorStop(1,'rgba(0,0,0,.42)');
  ctx.fillStyle=lg; ctx.fillRect(0,0,W,H);
}
function drawToiletFor(b){
  const c=b.toilet,gold=c==='#f2c94c';
  ell(270,646,105,12,'rgba(0,0,0,.35)');
  const pg=ctx.createLinearGradient(185,0,355,0); pg.addColorStop(0,shade(c,-.14)); pg.addColorStop(.4,shade(c,.3)); pg.addColorStop(1,shade(c,-.18));
  rr(186,300,168,112,14); ctx.fillStyle=pg; ctx.fill();
  rr(178,290,184,20,9); ctx.fillStyle=shade(c,-.04); ctx.fill();
  rr(318,320,26,8,3); ctx.fillStyle=gold?'#a07a10':'#b9b8ae'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(212,520); ctx.lineTo(224,644); ctx.lineTo(316,644); ctx.lineTo(328,520); ctx.closePath(); ctx.fillStyle=pg; ctx.fill();
  ell(270,508,140,34,shade(c,-.12)); ell(270,503,134,29,shade(c,.2));
  if(b.decor==='ceu'){ctx.save();ctx.shadowColor='#fff3a0';ctx.shadowBlur=16;ctx.strokeStyle='#ffe27a';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(270,270,60,14,0,0,TAU);ctx.stroke();ctx.restore()}
}

/* ---------- DOM thumbnails ---------- */
function canvasEl(em,cls){
  const c=document.createElement('canvas'); if(cls)c.className=cls;
  const fs=parseFloat(stage.style.fontSize)||16,px=Math.max(32,Math.round(em*fs*DPR));
  c.width=c.height=px; c.style.width=c.style.height=em+'em';
  return c;
}
function paint(c,box,fn){const c2=c.getContext('2d'),s=c.width/box;c2.setTransform(s,0,0,s,0,0);c2.clearRect(0,0,box,box);withCtx(c2,fn);return c}
function thumbVerity(vk,mk,em=4,o={}){
  const c=canvasEl(em,o.cls);
  paint(c,100,()=>{
    if(o.locked){
      drawVariant(50,54,26,vk,'none',{noFx:true,face:false,t:1.3});
      ctx.globalCompositeOperation='source-atop'; ctx.fillStyle='#3b5752'; ctx.fillRect(0,0,100,100); ctx.globalCompositeOperation='source-over';
      txt('?',50,56,30,'#c9f5e6',{stroke:false});
    }else drawVariant(50,(vk==='lord'||vk==='exu')?58:54,o.r||26,vk,mk,{glow:.55,t:o.t??1.3,lvl:o.lvl,badge:o.badge,f:o.f});
  });
  c.setAttribute('role','img'); c.setAttribute('aria-label',o.locked?_t("Variante não encontrada"):fullName(vk,mk));
  return c;
}
function drawAvatarBust(eq){ctx.save();ctx.translate(50,62);ctx.scale(.4,.4);ctx.translate(-270,-262);drawPerson({F:0,strain:0},eq);ctx.restore()}
function thumbAvatar(eq,em=3.4){const c=canvasEl(em);paint(c,100,()=>{circ(50,50,49,'rgba(255,255,255,.06)');ctx.save();ctx.beginPath();ctx.arc(50,50,49,0,TAU);ctx.clip();drawAvatarBust(eq);ctx.restore()});c.setAttribute('role','img');c.setAttribute('aria-label','Avatar');return c}
function thumbIntruder(kind,em=5){const c=canvasEl(em);paint(c,100,()=>{rr(22,6,56,94,4);ctx.fillStyle='#1a0f08';ctx.fill();drawIntruder(kind,50,98,.22)});return c}
function drawSeated(eq,b,q){drawToiletFor(b);drawPerson(q||{F:0,strain:0},eq)}
