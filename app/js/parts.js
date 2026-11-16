'use strict';
/* ===== parts: generic Verities (and bosses) drawn from eyes + mouth + accessories, and the fusion look ===== */
function genInk(V){return V.ink||mix(V.col[2],'#000000',.55)}
function drawGenFace(V,x,y,r,hurt){
  const ink=genInk(V),w=Math.max(1.3,r*.07);
  if(hurt){
    for(const s of[-1,1])line([[x+s*r*.4,y-r*.16],[x+s*r*.2,y-r*.04],[x+s*r*.4,y+r*.08]],ink,w);
    ell(x,y+r*.36,r*.12,r*.1,ink); return;
  }
  switch(V.eyes){
    case 'dots':eyesOval(x,y,r,ink,.28,-.08,.085,.14);break;
    case 'happy':ctx.strokeStyle=ink;ctx.lineWidth=w;ctx.lineCap='round';for(const s of[-1,1]){ctx.beginPath();ctx.arc(x+s*r*.3,y-r*.04,r*.13,1.1*Math.PI,1.9*Math.PI);ctx.stroke()}break;
    case 'angry':for(const s of[-1,1]){line([[x+s*r*.5,y-r*.42],[x+s*r*.12,y-r*.22]],ink,w*1.2);ell(x+s*r*.28,y-r*.06,r*.09,r*.12,ink)}break;
    case 'squint':for(const s of[-1,1])line([[x+s*r*.44,y-r*.2],[x+s*r*.18,y-r*.08],[x+s*r*.44,y+r*.02]],ink,w);break;
    case 'big':for(const s of[-1,1]){ell(x+s*r*.3,y-r*.08,r*.17,r*.2,'#ffffff');circ(x+s*r*.27,y-r*.05,r*.08,ink);circ(x+s*r*.24,y-r*.09,r*.03,'#ffffff')}break;
    case 'three':ell(x-r*.34,y-r*.02,r*.08,r*.12,ink);ell(x+r*.34,y-r*.02,r*.08,r*.12,ink);ell(x,y-r*.36,r*.14,r*.15,'#ffffff');circ(x,y-r*.34,r*.07,ink);break;
    case 'pixel':ctx.fillStyle=ink;for(const s of[-1,1])ctx.fillRect(x+s*r*.3-r*.1,y-r*.18,r*.2,r*.2);break;
    case 'shades':rr(x-r*.62,y-r*.22,r*1.24,r*.26,r*.08);ctx.fillStyle='#050505';ctx.fill();line([[x-r*.5,y-r*.15],[x-r*.3,y-r*.15]],'rgba(120,255,160,.6)',Math.max(1,r*.04));break;
    case 'glow':ctx.save();ctx.shadowColor='#ffffff';ctx.shadowBlur=r*.3;for(const s of[-1,1])ell(x+s*r*.3,y-r*.1,r*.12,r*.16,'#ffffff',s*.2);ctx.restore();break;
    case 'sleepy':ctx.strokeStyle=ink;ctx.lineWidth=w;for(const s of[-1,1]){ctx.beginPath();ctx.arc(x+s*r*.3,y-r*.1,r*.12,.1*Math.PI,.9*Math.PI);ctx.stroke()}break;
    case 'star':for(const s of[-1,1]){const cx=x+s*r*.3,cy=y-r*.08;ctx.fillStyle='#ffcf3a';ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r*.07:r*.17;ctx.lineTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad)}ctx.closePath();ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=Math.max(1,r*.03);ctx.stroke()}break;
    case 'tri':ctx.save();ctx.shadowColor='#ffd23a';ctx.shadowBlur=r*.3;for(const s of[-1,1])poly([[x+s*r*.32,y-r*.3],[x+s*r*.14,y+r*.02],[x+s*r*.5,y+r*.02]],'#ffe066');ctx.restore();break;
    case 'x':for(const s of[-1,1]){const cx=x+s*r*.3,cy=y-r*.08,d=r*.1;line([[cx-d,cy-d],[cx+d,cy+d]],ink,w);line([[cx+d,cy-d],[cx-d,cy+d]],ink,w)}break;
  }
  switch(V.mouth){
    case 'smile':smileArc(x,y,r,ink,.1,.3,.2,.8,.07);break;
    case 'grin':ctx.beginPath();ctx.moveTo(x-r*.42,y+r*.16);ctx.quadraticCurveTo(x,y+r*.66,x+r*.42,y+r*.16);ctx.closePath();ctx.fillStyle='#ffffff';ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=Math.max(1,r*.04);ctx.stroke();for(let i=-2;i<=2;i++)line([[x+i*r*.14,y+r*.2],[x+i*r*.14,y+r*.34]],'rgba(0,0,0,.25)',Math.max(.8,r*.025));break;
    case 'open':ell(x,y+r*.34,r*.14,r*.16,ink);ell(x,y+r*.42,r*.08,r*.05,'#e0587a');break;
    case 'pucker':circ(x,y+r*.32,r*.08,ink);for(const a of[-.6,0,.6])line([[x+Math.sin(a)*r*.12,y+r*.32-Math.cos(a)*r*.12],[x+Math.sin(a)*r*.2,y+r*.32-Math.cos(a)*r*.2]],ink,Math.max(1,r*.03));break;
    case 'frown':ctx.strokeStyle=ink;ctx.lineWidth=w;ctx.beginPath();ctx.arc(x,y+r*.5,r*.24,1.2*Math.PI,1.8*Math.PI);ctx.stroke();break;
    case 'tongue':smileArc(x,y,r,ink,.08,.3,.15,.85,.07);ell(x+r*.05,y+r*.42,r*.11,r*.13,'#ff5a8a');break;
    case 'fangs':smileArc(x,y,r,ink,.06,.32,.15,.85,.07);poly([[x-r*.2,y+r*.33],[x-r*.12,y+r*.33],[x-r*.16,y+r*.5]],'#ffffff');poly([[x+r*.12,y+r*.33],[x+r*.2,y+r*.33],[x+r*.16,y+r*.5]],'#ffffff');break;
    case 'flat':line([[x-r*.22,y+r*.36],[x+r*.22,y+r*.36]],ink,w);break;
    case 'zigzag':line([[x-r*.3,y+r*.36],[x-r*.15,y+r*.28],[x,y+r*.38],[x+r*.15,y+r*.28],[x+r*.3,y+r*.36]],ink,w);break;
    case 'buck':smileArc(x,y,r,ink,.08,.22,.2,.8,.06);rr(x-r*.1,y+r*.28,r*.09,r*.14,r*.02);ctx.fillStyle='#ffffff';ctx.fill();rr(x+r*.01,y+r*.28,r*.09,r*.14,r*.02);ctx.fill();break;
    case 'beard':ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(x-r*.55,y+r*.2);ctx.quadraticCurveTo(x-r*.5,y+r*1.05,x,y+r*1.15);ctx.quadraticCurveTo(x+r*.5,y+r*1.05,x+r*.55,y+r*.2);ctx.quadraticCurveTo(x,y+r*.5,x-r*.55,y+r*.2);ctx.fill();line([[x-r*.15,y+r*.3],[x+r*.15,y+r*.3]],ink,w);break;
    case 'grill':rr(x-r*.3,y+r*.24,r*.6,r*.2,r*.05);ctx.fillStyle='#1a1a1a';ctx.fill();for(let i=1;i<5;i++)line([[x-r*.3+i*r*.12,y+r*.25],[x-r*.3+i*r*.12,y+r*.43]],'#9aa8b8',Math.max(1,r*.03));break;
    case 'fire':ell(x,y+r*.34,r*.15,r*.13,ink);ctx.fillStyle='#ff8a1a';ctx.beginPath();ctx.moveTo(x-r*.12,y+r*.38);ctx.quadraticCurveTo(x,y+r*.9,x+r*.12,y+r*.38);ctx.fill();ctx.fillStyle='#ffe066';ctx.beginPath();ctx.moveTo(x-r*.06,y+r*.4);ctx.quadraticCurveTo(x,y+r*.7,x+r*.06,y+r*.4);ctx.fill();break;
  }
}
function clipBody(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.clip()}
function drawAccBack(V,x,y,r,t){
  for(const a of V.acc||[])switch(a){
    case 'wings':for(const s of[-1,1]){ctx.save();ctx.translate(x+s*r*.85,y-r*.05);ctx.scale(s,1);ctx.rotate(-.3+Math.sin(t*3)*.12);for(let k=0;k<3;k++)ell(r*.45,-r*.12+k*r*.2,r*.55-k*r*.1,r*.14,'#fffaf0',-.3+k*.2);ctx.restore()}break;
    case 'fur':for(let i=0;i<16;i++){const ang=i/16*TAU;circ(x+Math.cos(ang)*r*.98,y+Math.sin(ang)*r*.98,r*.2,V.col[1])}break;
    case 'radiant':{ctx.save();ctx.translate(x,y);ctx.rotate(t*.25);for(let i=0;i<14;i++){ctx.rotate(TAU/14);const g=ctx.createLinearGradient(0,0,r*2.4,0);g.addColorStop(0,'rgba(255,240,170,.6)');g.addColorStop(1,'rgba(255,240,170,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(r*2.4,-r*.16);ctx.lineTo(r*2.4,r*.16);ctx.closePath();ctx.fill()}ctx.restore();break}
    case 'tentacles':for(let i=0;i<6;i++){const bx=x-r*.7+i*r*.28,ph=Math.sin(t*3+i);ctx.strokeStyle=V.col[2];ctx.lineWidth=r*.16;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(bx,y+r*.6);ctx.quadraticCurveTo(bx+ph*r*.25,y+r*1.05,bx-ph*r*.1,y+r*1.35);ctx.stroke()}break;
    case 'spikes':ctx.fillStyle=V.col[2];for(let i=0;i<12;i++){const ang=i/12*TAU+t*.3;ctx.beginPath();ctx.moveTo(x+Math.cos(ang-.18)*r*.9,y+Math.sin(ang-.18)*r*.9);ctx.lineTo(x+Math.cos(ang)*r*1.35,y+Math.sin(ang)*r*1.35);ctx.lineTo(x+Math.cos(ang+.18)*r*.9,y+Math.sin(ang+.18)*r*.9);ctx.fill()}break;
    case 'ears':for(const s of[-1,1]){circ(x+s*r*.62,y-r*.78,r*.34,V.col[1]);circ(x+s*r*.62,y-r*.78,r*.2,'#f6a8b8')}break;
    case 'horns':for(const s of[-1,1])poly([[x+s*r*.32,y-r*.78],[x+s*r*.62,y-r*1.28],[x+s*r*.58,y-r*.62]],'#f3ead8');break;
    case 'antenna':for(const s of[-1,1]){line([[x+s*r*.25,y-r*.85],[x+s*r*.45,y-r*1.35]],V.col[2],Math.max(1.2,r*.06));circ(x+s*r*.45,y-r*1.38,r*.1,'#d7ff5a')}break;
    case 'antenna1':line([[x,y-r*.9],[x,y-r*1.32]],'#4a5664',Math.max(1.2,r*.06));circ(x,y-r*1.36,r*.1,Math.sin(t*6)>0?'#ff4d5e':'#7a1020');break;
    case 'stick':rr(x-r*.1,y+r*.75,r*.2,r*.7,r*.08);ctx.fillStyle='#e8c690';ctx.fill();break;
  }
}
function drawAccFront(V,x,y,r,t){
  for(const a of V.acc||[])switch(a){
    case 'leaf':line([[x,y-r*.92],[x+r*.05,y-r*1.18]],'#5a3a10',Math.max(1.2,r*.06));ell(x+r*.24,y-r*1.16,r*.22,r*.1,'#4fbf3a',-.4);break;
    case 'smoke':for(let i=0;i<3;i++){const k=(t*.8+i/3)%1;circ(x+(i-1)*r*.2,y-r*.95-k*r*.7,r*(.08+k*.12),`rgba(200,200,200,${.5*(1-k)})`)}break;
    case 'whiskers':for(const s of[-1,1])for(const d of[-.06,.06])line([[x+s*r*.2,y+r*.2+d*r],[x+s*r*.75,y+r*.12+d*r*2.2]],genInk(V),Math.max(.8,r*.025));break;
    case 'radiation':{const cx=x,cy=y-r*.58,R=r*.18;circ(cx,cy,R*1.25,'#ffd23a');ctx.fillStyle='#111';for(let i=0;i<3;i++){const ang=-Math.PI/2+i*TAU/3;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,ang-.5,ang+.5);ctx.fill()}circ(cx,cy,R*.25,'#111');break}
    case 'drips':for(let i=0;i<4;i++){const dx=x-r*.6+i*r*.4,len=r*(.25+.2*((Math.sin(t*2+i)+1)/2));rr(dx-r*.06,y+r*.62,r*.12,len,r*.06);ctx.fillStyle=V.col[2];ctx.fill();circ(dx,y+r*.62+len,r*.08,V.col[2])}break;
    case 'frost':for(let i=0;i<5;i++){const ang=-2.6+i*.55;star4(x+Math.cos(ang)*r*.88,y+Math.sin(ang)*r*.88,r*.16,'rgba(255,255,255,.9)')}break;
    case 'scarf':rr(x-r*.75,y+r*.55,r*1.5,r*.22,r*.1);ctx.fillStyle='#e0303a';ctx.fill();rr(x+r*.35,y+r*.6,r*.2,r*.55,r*.06);ctx.fill();break;
    case 'sweat':for(const s of[-1,1]){const k=(t*1.3+(s>0?.5:0))%1,sx=x+s*r*.7,sy=y-r*.3+k*r*.5;ctx.fillStyle='rgba(190,232,255,.9)';ctx.beginPath();ctx.arc(sx,sy,r*.08,0,Math.PI);ctx.lineTo(sx,sy-r*.18);ctx.closePath();ctx.fill()}break;
    case 'pepper':ell(x,y-r*.92,r*.3,r*.12,'#2f9a3a');line([[x,y-r*.95],[x+r*.12,y-r*1.25]],'#2f9a3a',Math.max(1.5,r*.08));break;
    case 'cracks':ctx.save();clipBody(x,y,r);ctx.strokeStyle=`rgba(255,${200+Math.round(Math.sin(t*4)*40)},80,.9)`;ctx.lineWidth=Math.max(1,r*.05);ctx.beginPath();ctx.moveTo(x-r*.9,y+r*.1);ctx.lineTo(x-r*.5,y+r*.3);ctx.lineTo(x-r*.4,y+r*.7);ctx.moveTo(x+r*.9,y-r*.2);ctx.lineTo(x+r*.55,y+r*.05);ctx.lineTo(x+r*.62,y+r*.5);ctx.moveTo(x-r*.2,y-r*.9);ctx.lineTo(x-r*.05,y-r*.6);ctx.stroke();ctx.restore();break;
    case 'fire':{const fl=Math.sin(t*10)*r*.05;ctx.fillStyle='#ff6a10';ctx.beginPath();ctx.moveTo(x-r*.4,y-r*.82);ctx.quadraticCurveTo(x-r*.2,y-r*1.5-fl,x,y-r*1.2);ctx.quadraticCurveTo(x+r*.15,y-r*1.6+fl,x+r*.4,y-r*.82);ctx.closePath();ctx.fill();ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.moveTo(x-r*.2,y-r*.85);ctx.quadraticCurveTo(x,y-r*1.3+fl,x+r*.2,y-r*.85);ctx.fill();break}
    case 'helmet':ctx.save();ctx.strokeStyle='rgba(220,240,255,.8)';ctx.lineWidth=Math.max(1.5,r*.07);ctx.beginPath();ctx.arc(x,y-r*.05,r*1.22,0,TAU);ctx.stroke();ctx.fillStyle='rgba(200,230,255,.15)';ctx.fill();ctx.restore();ell(x-r*.55,y-r*.6,r*.25,r*.12,'rgba(255,255,255,.45)',-.7);rr(x-r*.7,y+r*.95,r*1.4,r*.25,r*.1);ctx.fillStyle='#e6e6e6';ctx.fill();break;
    case 'craters':for(const [cx,cy,cr] of[[-.4,-.4,.18],[.35,.3,.22],[-.2,.5,.12],[.5,-.35,.1]])circ(x+cx*r,y+cy*r,cr*r,'rgba(0,0,0,.12)');break;
    case 'glitch':ctx.save();clipBody(x,y,r);for(let i=0;i<4;i++){const gy=y-r+((i*37+Math.floor(t*8)*13)%100)/100*r*2;ctx.fillStyle=i%2?'rgba(0,255,255,.35)':'rgba(255,0,90,.35)';ctx.fillRect(x-r+(i%2?r*.1:-r*.1),gy,r*2,r*.12)}ctx.restore();break;
    case 'bolts':for(const s of[-1,1]){circ(x+s*r*.85,y,r*.12,'#6a7684');line([[x+s*r*.92,y],[x+s*r*.78,y]],'#3a4450',Math.max(1,r*.03))}break;
    case 'code':ctx.save();clipBody(x,y,r);ctx.font=`900 ${Math.max(5,r*.22)}px ui-monospace,Consolas,monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(57,255,122,.7)';for(let i=0;i<8;i++)for(let j=0;j<8;j++){if(((i*7+j*11+Math.floor(t*6))%4)!==0)continue;ctx.fillText((i+j)%2?'1':'0',x-r+i*r*.27+r*.1,y-r+j*r*.27+r*.15)}ctx.restore();break;
    case 'halo':ctx.save();ctx.shadowColor='#fff3a0';ctx.shadowBlur=r*.35;ctx.strokeStyle='#ffe27a';ctx.lineWidth=Math.max(1.5,r*.09);ctx.beginPath();ctx.ellipse(x,y-r*1.22+Math.sin(t*2)*r*.04,r*.48,r*.13,0,0,TAU);ctx.stroke();ctx.restore();break;
    case 'lightning':poly([[x+r*.75,y-r*1.1],[x+r*.45,y-r*.55],[x+r*.65,y-r*.55],[x+r*.38,y+r*.05],[x+r*.92,y-r*.7],[x+r*.7,y-r*.7]],'#ffe23a');break;
    case 'crown':poly([[x-r*.5,y-r*.78],[x-r*.5,y-r*1.18],[x-r*.25,y-r*.98],[x,y-r*1.3],[x+r*.25,y-r*.98],[x+r*.5,y-r*1.18],[x+r*.5,y-r*.78]],'#f2c230');circ(x,y-r*.9,r*.08,'#e0303a');break;
    case 'cork':rr(x-r*.38,y-r*1.25,r*.76,r*.5,r*.12);ctx.fillStyle='#c89a5a';ctx.fill();for(let i=0;i<6;i++)circ(x-r*.25+(i%3)*r*.25,y-r*1.12+Math.floor(i/3)*r*.22,r*.04,'#8a6430');break;
    case 'crystal':for(const [dx,h] of[[-.5,.55],[0,.8],[.45,.5]])poly([[x+dx*r-r*.14,y-r*.8],[x+dx*r,y-r*(.8+h)],[x+dx*r+r*.14,y-r*.8]],'rgba(200,240,255,.9)');break;
    default:drawAccExtra(a,V,x,y,r,t);break;
    case 'bubbles':ctx.lineWidth=Math.max(1,r*.03);for(let i=0;i<3;i++){const k=(t*.6+i/3)%1;ctx.strokeStyle=`rgba(255,255,255,${.7*(1-k)})`;ctx.beginPath();ctx.arc(x+r*(.5+i*.15),y-r*(.6+k*.9),r*(.08+i*.03),0,TAU);ctx.stroke()}break;
  }
}
function drawFusion(x,y,r,f,t){
  ctx.save();
  if(f===1){ctx.shadowColor='#ffd23a';ctx.shadowBlur=r*.4;ctx.strokeStyle='#ffd23a';ctx.lineWidth=Math.max(1.5,r*.08);ctx.beginPath();ctx.arc(x,y,r*1.12,0,TAU);ctx.stroke();ctx.restore();sparkles(x,y,r,3,'#fff3a0',t+1,1.25);return}
  ctx.lineWidth=Math.max(2,r*.1);ctx.strokeStyle=rainbow(x,y,r,t*1.5);ctx.shadowColor='#ffffff';ctx.shadowBlur=r*.5;ctx.beginPath();ctx.arc(x,y,r*1.14,0,TAU);ctx.stroke();ctx.restore();
  sparkles(x,y,r,5,`hsl(${(t*160)%360},100%,82%)`,t,1.3);
}
