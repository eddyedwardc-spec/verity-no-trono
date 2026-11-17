'use strict';
/* ===== Secret Verities: lit 3D creatures =====
   Each one hides in a few specific worlds only and drops about 1 in 25,000 runs there (luck helps a little).
   They have their own rarity, "Secreto", above everything else. drawVariant() hands them to drawSecret().
   They are drawn with a tiny 3D renderer below: boxes, spikes, gems and extruded shapes, projected
   orthographically, lit by a key light plus a coloured rim light, sorted back to front, with glowing decals. */
RAR.push({k:'secreto',name:_t("Secreto"),col:'#00ffc8'});
POW_BY_RAR.push(900);
const SECRET_CHANCE=1/25000;

/* ---------- tiny 3D renderer ---------- */
const R3={yaw:.5,pitch:.32,s:1,ox:0,oy:0,faces:[],rim:[180,90,255]};
const R3L=(()=>{const v=[-.45,.75,.55],m=Math.hypot(...v);return v.map(a=>a/m)})();
const R3R=(()=>{const v=[.85,.25,-.35],m=Math.hypot(...v);return v.map(a=>a/m)})();
const rgb3=h=>{const c=hexc(h);return c};
function rot3(p,r){let [x,y,z]=p;if(r[0]){const c=Math.cos(r[0]),s=Math.sin(r[0]);[y,z]=[y*c-z*s,y*s+z*c]}if(r[1]){const c=Math.cos(r[1]),s=Math.sin(r[1]);[x,z]=[x*c+z*s,-x*s+z*c]}if(r[2]){const c=Math.cos(r[2]),s=Math.sin(r[2]);[x,y]=[x*c-y*s,x*s+y*c]}return[x,y,z]}
// part transform: local point -> pet space (scale, rotate about the part's own origin, then move)
const xf=(p,o)=>{let q=[p[0]*(o.sx??1),p[1]*(o.sy??1),p[2]*(o.sz??1)];if(o.r)q=rot3(q,o.r);if(o.r2)q=rot3(q,o.r2);return[q[0]+(o.at?o.at[0]:0),q[1]+(o.at?o.at[1]:0),q[2]+(o.at?o.at[2]:0)]};
const view3=p=>{const [x0,y0,z0]=p,cy=Math.cos(R3.yaw),sy=Math.sin(R3.yaw);let x=x0*cy+z0*sy,z=-x0*sy+z0*cy;const cp=Math.cos(R3.pitch),sp=Math.sin(R3.pitch);const y=y0*cp-z*sp;z=y0*sp+z*cp;return[x,y,z]};
// adds one flat polygon (pet-space points, outward counter-clockwise)
function face3(pts,col,o={}){
  const v=pts.map(view3),a=v[0],b=v[1],c=v[2];
  const n=[(b[1]-a[1])*(c[2]-a[2])-(b[2]-a[2])*(c[1]-a[1]),(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]),(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])];
  const m=Math.hypot(...n)||1;n[0]/=m;n[1]/=m;n[2]/=m;
  if(n[2]<=0){if(!o.double)return;n[0]=-n[0];n[1]=-n[1];n[2]=-n[2]}
  R3.faces.push({p:v.map(q=>[R3.ox+q[0]*R3.s,R3.oy-q[1]*R3.s]),z:v.reduce((s,q)=>s+q[2],0)/v.length+(o.zb||0),n,col,o});
}
function box3(w,h,d,col,o={}){
  const X=w/2,Y=h/2,Z=d/2,P=(x,y,z)=>xf([x,y,z],o);
  const F={front:[[-X,-Y,Z],[X,-Y,Z],[X,Y,Z],[-X,Y,Z]],back:[[X,-Y,-Z],[-X,-Y,-Z],[-X,Y,-Z],[X,Y,-Z]],right:[[X,-Y,Z],[X,-Y,-Z],[X,Y,-Z],[X,Y,Z]],
    left:[[-X,-Y,-Z],[-X,-Y,Z],[-X,Y,Z],[-X,Y,-Z]],top:[[-X,Y,Z],[X,Y,Z],[X,Y,-Z],[-X,Y,-Z]],bottom:[[-X,-Y,-Z],[X,-Y,-Z],[X,-Y,Z],[-X,-Y,Z]]};
  for(const [k,pts] of Object.entries(F))face3(pts.map(q=>P(...q)),(o.faceCol&&o.faceCol[k])||col,{...o,decal:o.decals&&o.decals[k],face:k});
}
function spike3(b,h,col,o={}){const B=b/2,P=(x,y,z)=>xf([x,y,z],o),A=P(0,h,0),c=[P(-B,0,B),P(B,0,B),P(B,0,-B),P(-B,0,-B)];
  for(let i=0;i<4;i++)face3([c[i],c[(i+1)%4],A],col,o);face3([c[3],c[2],c[1],c[0]],col,o)}
function gem3(s,col,o={}){const P=(x,y,z)=>xf([x,y,z],o),T=P(0,s*1.4,0),Bm=P(0,-s*1.4,0),m=[P(s,0,0),P(0,0,-s),P(-s,0,0),P(0,0,s)];
  for(let i=0;i<4;i++){face3([m[i],m[(i+1)%4],T],col,o);face3([m[(i+1)%4],m[i],Bm],col,o)}}
function slab3(pts2,th,col,o={}){ // extruded 2D outline (counter-clockwise in x/y)
  const P=(x,y,z)=>xf([x,y,z],o),t=th/2,f=pts2.map(([x,y])=>P(x,y,t)),b=pts2.map(([x,y])=>P(x,y,-t));
  face3(f,col,o);face3([...b].reverse(),col,o);for(let i=0;i<f.length;i++){const j=(i+1)%f.length;face3([f[j],f[i],b[i],b[j]],o.edge||col,o)}}
function ring3(R,r,col,o={}){const n=28,P=(x,y,z)=>xf([x,y,z],o);for(let i=0;i<n;i++){const a=i/n*TAU,b=(i+1)/n*TAU;face3([P(Math.cos(a)*R,0,Math.sin(a)*R),P(Math.cos(b)*R,0,Math.sin(b)*R),P(Math.cos(b)*r,0,Math.sin(b)*r),P(Math.cos(a)*r,0,Math.sin(a)*r)],col,{...o,double:true})}}
function shade3(f){
  const [r,g,b]=rgb3(f.col),n=f.n;
  if(f.o.emit)return`rgb(${r},${g},${b})`;
  const k=.34+.78*Math.max(0,n[0]*R3L[0]+n[1]*R3L[1]+n[2]*R3L[2]),rim=Math.max(0,n[0]*R3R[0]+n[1]*R3R[1]+n[2]*R3R[2])*.55*(f.o.rimK??1);
  return`rgb(${Math.min(255,r*k+R3.rim[0]*rim)|0},${Math.min(255,g*k+R3.rim[1]*rim)|0},${Math.min(255,b*k+R3.rim[2]*rim)|0})`;
}
function flush3(){
  const F=R3.faces.sort((a,b)=>a.z-b.z);R3.faces=[];
  for(const f of F){
    ctx.beginPath();f.p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();
    if(f.o.emit){ctx.save();ctx.shadowColor=f.o.glowCol||f.col;ctx.shadowBlur=R3.s*.5;ctx.fillStyle=shade3(f);ctx.fill();ctx.restore()}else{ctx.fillStyle=shade3(f);ctx.fill()}
    if(!f.o.emit&&f.p.length>3){let y0=1e9,y1=-1e9;for(const q of f.p){y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}const g=ctx.createLinearGradient(0,y0,0,y1);g.addColorStop(0,'rgba(255,255,255,.14)');g.addColorStop(1,'rgba(0,0,0,.16)');ctx.fillStyle=g;ctx.fill()}
    ctx.strokeStyle=f.o.emit?'rgba(255,255,255,.25)':'rgba(0,0,0,.28)';ctx.lineWidth=Math.max(.6,R3.s*.025);ctx.lineJoin='round';ctx.stroke();
    if(f.o.decal){const [p0,p1,p2,p3]=f.p,cx=(p0[0]+p1[0]+p2[0]+p3[0])/4,cy=(p0[1]+p1[1]+p2[1]+p3[1])/4;
      ctx.save();ctx.transform((p1[0]-p0[0])/2,(p1[1]-p0[1])/2,(p0[0]-p3[0])/2,(p0[1]-p3[1])/2,cx,cy);f.o.decal(ctx);ctx.restore()}
  }
}
/* decals: drawn in face space, x and y from -1 to 1 (y down) */
const glowDot=(c,x,y,rx,ry,col,blur=.35)=>{c.save();c.shadowColor=col;c.shadowBlur=R3.s*blur;c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();c.restore()};
const glowPoly=(c,pts,col,blur=.4)=>{c.save();c.shadowColor=col;c.shadowBlur=R3.s*blur;c.fillStyle=col;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();c.restore()};
const eyesAngry=(col,y=-.15)=>c=>{for(const s of[-1,1]){glowPoly(c,[[s*.12,y-.12],[s*.68,y-.34],[s*.62,y+.12],[s*.18,y+.12]],col,.5);glowPoly(c,[[s*.22,y-.04],[s*.52,y-.16],[s*.5,y+.04],[s*.26,y+.04]],'#ffffff',.2)}};
const eyesSlit=(col,y=-.2)=>c=>{for(const s of[-1,1]){glowDot(c,s*.42,y,.24,.2,col,.5);c.fillStyle='#120400';c.beginPath();c.ellipse(s*.42,y,.05,.18,0,0,TAU);c.fill();c.fillStyle='rgba(0,0,0,.55)';c.beginPath();c.moveTo(s*.12,y-.3);c.lineTo(s*.72,y-.42);c.lineTo(s*.7,y-.3);c.lineTo(s*.14,y-.22);c.fill()}};
const eyesCute=(iris,y=-.12)=>c=>{for(const s of[-1,1]){glowDot(c,s*.4,y,.26,.3,'#ffffff',.25);c.fillStyle=iris;c.beginPath();c.ellipse(s*.43,y+.04,.15,.19,0,0,TAU);c.fill();c.fillStyle='#000';c.beginPath();c.ellipse(s*.43,y+.06,.08,.1,0,0,TAU);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(s*.37,y-.06,.06,0,TAU);c.fill()}};
const mouthFangs=(y=.45,w=.5)=>c=>{c.fillStyle='rgba(10,0,10,.85)';c.beginPath();c.moveTo(-w,y-.06);c.quadraticCurveTo(0,y+.3,w,y-.06);c.closePath();c.fill();c.fillStyle='#fff';for(const s of[-1,1]){c.beginPath();c.moveTo(s*w*.55,y-.02);c.lineTo(s*w*.4,y+.16);c.lineTo(s*w*.28,y);c.fill()}};
const both=(...fs)=>c=>fs.forEach(f=>f(c));

/* ---------- the pets (pet space: about 1 unit = a Verity's radius) ---------- */
function petWyrm(t){
  R3.rim=[80,255,170];const flap=Math.sin(t*5)*.35;
  const wing=[[0,0],[1.3,.85],[1.75,.25],[1.35,.0],[1.5,-.45],[1.0,-.25],[.85,-.7],[.45,-.3]];
  for(const s of[-1,1])slab3(wing,.06,'#0f7a47',{at:[s*.42,.3,-.5],sx:s*.95,sy:.95,r:[0,s*.3,s*(.32+flap*.4)],edge:'#095a33',rimK:1.4,zb:-1});
  box3(.95,.55,.85,'#16884f',{at:[0,-.85,-.1]});
  box3(1.3,1.12,1.15,'#22b866',{at:[0,0,0],decals:{front:both(eyesSlit('#ffe14d'),mouthFangs(.62,.42))}});
  box3(.78,.46,.46,'#2fd17a',{at:[0,-.28,.75],decals:{front:c=>{c.fillStyle='#0a3d22';for(const s of[-1,1]){c.beginPath();c.ellipse(s*.35,-.3,.1,.07,0,0,TAU);c.fill()}}}});
  for(const s of[-1,1])spike3(.24,.8,'#ffd23a',{at:[s*.42,.5,-.2],r:[-.65,0,-s*.35]});
  for(const z of[.25,-.1,-.45])spike3(.2,.32,'#0b6b3a',{at:[0,.56,z],r:[-.3,0,0]});
  flush3();
}
function petGolem(t){
  R3.rim=[120,240,255];
  for(const s of[-1,1])box3(.55,.55,.55,'#2b3352',{at:[s*.98,-.45,0],r:[0,0,s*.2]});
  box3(.9,.5,.75,'#262d48',{at:[0,-.9,0]});
  box3(1.3,1.2,1.15,'#353f63',{at:[0,0,0],decals:{front:both(c=>{c.strokeStyle='rgba(122,240,255,.55)';c.lineWidth=.035;c.beginPath();c.moveTo(-.8,-.6);c.lineTo(-.5,-.3);c.lineTo(-.62,.05);c.moveTo(.7,.4);c.lineTo(.45,.62);c.lineTo(.55,.85);c.stroke()},
    c=>{for(const s of[-1,1])glowPoly(c,[[s*.2,-.32],[s*.62,-.32],[s*.62,-.06],[s*.2,-.06]],'#7af0ff',.6)},c=>glowPoly(c,[[-.35,.4],[.35,.4],[.3,.5],[-.3,.5]],'#7af0ff',.4))}});
  gem3(.22,'#9af6ff',{at:[0,.95,0],r:[0,t*.8,0],emit:1,glowCol:'#7af0ff'});
  for(const [x,z,rz] of[[.55,.15,-.5],[-.5,-.2,.55],[.15,-.4,-.2]])gem3(.13,'#6ae4ff',{at:[x,.72,z],r:[0,0,rz],emit:1,glowCol:'#7af0ff'});
  for(let i=0;i<4;i++){const a=t*1.1+i*TAU/4;gem3(.09,'#c8fbff',{at:[Math.cos(a)*1.45,.15+Math.sin(t*2+i)*.15,Math.sin(a)*1.0],r:[0,t*2,0],emit:1,glowCol:'#7af0ff'})}
  flush3();
}
function petFenix(t){
  R3.rim=[255,190,60];const fl=Math.sin(t*6)*.3;
  const wing=[[0,0],[.9,.75],[1.15,.5],[1.55,.95],[1.45,.35],[1.85,.45],[1.4,-.05],[.9,-.2],[.5,-.45]];
  for(const s of[-1,1])slab3(wing,.05,'#ff5a1a',{at:[s*.42,.15,-.5],sx:s*.9,sy:.9,r:[0,s*.3,s*(.3+fl*.4)],emit:1,glowCol:'#ff8a1a',edge:'#ffb02a',zb:-1});
  for(let i=0;i<3;i++)slab3([[0,0],[.25,-.9-i*.15],[.45,-1.4-i*.2],[.12,-.85],[-.1,-.3]],.05,i===1?'#ffb02a':'#ff3a1a',{at:[(i-1)*.18,-.4,-.55],r:[.7,0,(i-1)*.35],emit:1,glowCol:'#ff6a10'});
  box3(1.2,1.12,1.1,'#ff7a1a',{at:[0,0,0],faceCol:{top:'#ffb84a'},decals:{front:both(eyesCute('#ff4a00',-.18),c=>{c.fillStyle='rgba(255,90,140,.45)';for(const s of[-1,1]){c.beginPath();c.ellipse(s*.62,.22,.16,.08,0,0,TAU);c.fill()}})}});
  spike3(.36,.42,'#ffd23a',{at:[0,-.12,.55],r:[Math.PI/2,0,0]});
  for(let i=0;i<5;i++){const x=(i-2)*.22,h=.55+(i===2?.45:i%2?.2:0)+Math.sin(t*9+i)*.08;spike3(.2,h,i%2?'#ffd23a':'#ff8a1a',{at:[x,.55,-.05+Math.abs(i-2)*.08],r:[-.25,0,-(i-2)*.18],emit:1,glowCol:'#ffb02a'})}
  flush3();
}
function petKrak(t){
  R3.rim=[255,80,220];
  const legs=[[-.42,.38],[.42,.38],[-.42,-.38],[.42,-.38]];
  legs.forEach(([x,z],k)=>{for(let i=0;i<5;i++){const s=.3-i*.045,ph=t*2.5+k*1.4+i*.6;box3(s,s*1.1,s,i===4?'#ff4dd8':'#6a22c8',{at:[x*(1+i*.18)+Math.sin(ph)*.06*i,-.75-i*.27,z*(1+i*.12)],r:[Math.sin(ph)*.3,0,x*.4],emit:i===4?1:0,glowCol:'#ff4dd8'})}});
  box3(1.32,1.2,1.22,'#2a0f4a',{at:[0,.05,0],decals:{front:both(eyesAngry('#ff3df0',-.12),mouthFangs(.5,.38),c=>{for(const [x,y] of[[-.75,.7],[.7,-.75],[.78,.62]])glowDot(c,x,y,.07,.07,'#ffb0ff',.4)}),
    left:c=>{for(const [x,y] of[[-.4,-.4],[.3,.2],[-.1,.6]])glowDot(c,x,y,.09,.09,'#ff7af0',.4)},top:c=>{for(const [x,y] of[[-.4,-.3],[.4,.3]])glowDot(c,x,y,.1,.1,'#ff7af0',.4)}}});
  for(const s of[-1,1])spike3(.22,.5,'#120420',{at:[s*.45,.62,0],r:[0,0,-s*.4]});
  flush3();
}
function petMech(t){
  R3.rim=[90,200,255];
  for(const s of[-1,1]){box3(.32,.5,.32,'#5a6676',{at:[s*.4,-.95,0]});slab3([[-.14,0],[.14,0],[0,-.55-Math.sin(t*30+s)*.12]],.04,'#7ad4ff',{at:[s*.4,-1.2,0],emit:1,glowCol:'#3aa0ff'})}
  for(const s of[-1,1])box3(.24,.62,.62,'#8a96a6',{at:[s*.78,0,0],decals:{[s<0?'left':'right']:c=>glowDot(c,0,0,.42,.42,'#39e0ff',.5)}});
  box3(1.3,1.2,1.15,'#c8d0da',{at:[0,0,0],decals:{front:c=>{c.fillStyle='rgba(40,52,64,.5)';c.fillRect(-.9,.55,1.8,.04);for(let i=0;i<4;i++)glowDot(c,-.45+i*.3,.75,.06,.06,Math.floor(t*4+i)%3?'#1a5a30':'#39ff7a',.3)}}});
  box3(1.1,.36,.14,'#0e141c',{at:[0,.12,.62],decals:{front:c=>{const sx=Math.sin(t*2.5)*.55;glowPoly(c,[[sx-.32,-.25],[sx+.32,-.25],[sx+.28,.25],[sx-.28,.25]],'#ff3a4a',.7)}}});
  box3(.06,.5,.06,'#4a5664',{at:[.35,.82,0]});gem3(.1,Math.sin(t*8)>0?'#ff4d5e':'#7a1020',{at:[.35,1.12,0],emit:1});
  flush3();
}
function petHydra(t){
  R3.rim=[200,120,255];
  box3(1.3,.6,.95,'#4a1f7a',{at:[0,-.85,0]});
  const heads=[[-.85,.15,'#e8442a','#ffe14d',1],[0,.62,'#8a3ad8','#39f0ff',0],[.85,.15,'#22b866','#c8ff3a',2]];
  for(const [hx,hy,col,eye,ph] of heads){const sx=hx+Math.sin(t*2+ph)*.06,sy=hy+Math.cos(t*2.3+ph)*.05;
    for(let i=1;i<=3;i++){const k=i/4;box3(.32,.32,.32,'#3a1660',{at:[lerp(hx*.4,sx,k),lerp(-.6,sy-.4,k),-.05]})}
    box3(.78,.72,.72,col,{at:[sx,sy,0],r:[0,hx*-.25,0],decals:{front:both(eyesAngry(eye,-.1),mouthFangs(.5,.4))}});
    for(const s of[-1,1])spike3(.13,.32,'#fff1b0',{at:[sx+s*.24,sy+.35,-.1],r:[-.4,0,-s*.35]})}
  flush3();
}
function petCosmo(t){
  R3.rim=[150,120,255];
  const galaxy=seed=>c=>{const g=c.createRadialGradient(-.3,-.3,.1,0,0,1.4);g.addColorStop(0,'#ff8ad8');g.addColorStop(.4,'#7a3aff');g.addColorStop(1,'#0a1050');c.fillStyle=g;c.fillRect(-1,-1,2,2);
    for(let i=0;i<14;i++){const x=((i*37+seed)%20)/10-1,y=((i*53+seed*7)%20)/10-1,k=.5+.5*Math.sin(t*3+i);c.fillStyle=`rgba(255,255,255,${.4+.6*k})`;c.beginPath();c.arc(x,y,.025+.02*k,0,TAU);c.fill()}};
  ring3(1.6,1.25,'#ffd28a',{at:[0,0,0],r:[.35,0,-.3],emit:1,glowCol:'#ffb84a',zb:-.6});
  box3(1.25,1.25,1.25,'#5a2ad8',{at:[0,0,0],decals:{front:both(galaxy(3),eyesCute('#2a0a6a',-.05),c=>{c.strokeStyle='#fff';c.lineWidth=.05;c.beginPath();c.arc(0,.4,.16,.15*Math.PI,.85*Math.PI);c.stroke()}),left:galaxy(11),top:galaxy(7),right:galaxy(5)}});
  for(let i=0;i<3;i++){const a=t*.9+i*TAU/3;gem3(.12,['#ffd28a','#8ad4ff','#ff8ad8'][i],{at:[Math.cos(a)*1.55,Math.sin(a*1.3)*.3,Math.sin(a)*1.1],r:[0,t,0],emit:1})}
  flush3();
}

/* ---------- the secrets themselves ---------- */
const SECRETS=[
  {k:'wyrmity',name:_t("Wyrmity"),base:300000,worlds:[6,10],col:['#b8ffd8','#2fcf7a','#0d6b3c'],glow:'60,255,150',abil:['dmg',1.0],draw:petWyrm,
    cut:{e:'burst',a:'roar',fx:'embers',line:_t("ROOOAR! O céu agora é meu!"),p:.5}},
  {k:'golemity',name:_t("Golemity"),base:320000,worlds:[16,20],col:['#d0dcf2','#8496c0','#46567e'],glow:'122,240,255',abil:['comfort',.5],draw:petGolem,
    cut:{e:'grow',a:'menace',fx:'snow',line:_t("Eu sou feito de gelo eterno."),p:.3}},
  {k:'fenixity',name:_t("Fenixity"),base:350000,worlds:[21,25],col:['#fff6c0','#ff9a2a','#c2280a'],glow:'255,140,40',abil:['regen',10],draw:petFenix,
    cut:{e:'lava',a:'float',fx:'embers',line:_t("Eu renasço das cinzas... e da privada!"),p:1.3}},
  {k:'krakity',name:_t("Krakity"),base:380000,worlds:[26,30],col:['#ffe0ff','#c34dff','#4a128a'],glow:'200,90,255',abil:['door',2],draw:petKrak,
    cut:{e:'swim',a:'float',fx:'bubbles',line:_t("Blub blub... vim do fundo do espaço."),p:1.4}},
  {k:'mechity',name:_t("Mechity"),base:420000,worlds:[31,35],col:['#f0f4f8','#9aa8b8','#4a5664'],glow:'120,210,255',abil:['zone',.4],draw:petMech,
    cut:{e:'beam',a:'laser',fx:'stars',line:_t("Piloto Verity, sistemas no máximo!"),p:1.1}},
  {k:'hidrity',name:_t("Hidrity"),base:480000,worlds:[41,45],col:['#e8d0ff','#8a4ad8','#3a1478'],glow:'170,100,255',abil:['all',.4],draw:petHydra,
    cut:{e:'rise',a:'roar',fx:'slime',line:_t("Três cabeças pensam melhor que uma!"),p:.6}},
  {k:'cosmity',name:_t("Cosmity"),base:900000,worlds:[256,260],col:['#ff8ad8','#7a3aff','#1a2a9a'],glow:'160,120,255',abil:['all',.5],draw:petCosmo,
    cut:{e:'portal',a:'orbit',fx:'stars',line:_t("Eu nado entre as galáxias."),p:.7}}
];
const SECRET_BY={};
for(const s of SECRETS){
  SECRET_BY[s.k]=s;
  VARS[s.k]={name:s.name,r:8,base:s.base,col:s.col,glow:s.glow,abil:s.abil,secret:true,hint:_t("Secreta · só nos mundos {0}–{1}",s.worlds[0],s.worlds[1])};
  VAR_ORDER.push(s.k);
}
const secretsAt=world=>SECRETS.filter(s=>world>=s.worlds[0]&&world<=s.worlds[1]);
function sparkleRing(x,y,R,t,col,n=6){for(let i=0;i<n;i++){const a=t*1.2+i*TAU/n,k=.5+.5*Math.sin(t*4+i*2);star4(x+Math.cos(a)*R,y+Math.sin(a)*R*.7,R*.07*(.6+k),col)}}

// Called by drawVariant for secret Verities: aura, the 3D creature (slowly turning and bobbing), then mutation and fusion touches.
function drawSecret(x,y,r,vk,mk,o){
  const s=SECRET_BY[vk],t=o.t??S.time,fx=!o.noFx,bob=Math.sin(t*2.2)*r*.08,M=MUT_BY[mk];
  ctx.save();
  if(fx&&(o.glow??1)>0){
    const gc=mk==='galaxy'?'150,90,255':mk==='god'?'255,240,170':mk==='hacker'?'60,255,120':mk==='plineos'?'255,120,220':s.glow,ga=o.glow??1;
    const g=ctx.createRadialGradient(x,y,r*.2,x,y,r*2.4);g.addColorStop(0,`rgba(${gc},${.55*ga})`);g.addColorStop(1,`rgba(${gc},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*2.4,0,TAU);ctx.fill();
    ctx.save();ctx.translate(x,y);ctx.rotate(t*.4);for(let i=0;i<8;i++){ctx.rotate(TAU/8);const lg=ctx.createLinearGradient(0,0,r*2.2,0);lg.addColorStop(0,`rgba(${gc},${.28*ga})`);lg.addColorStop(1,`rgba(${gc},0)`);ctx.fillStyle=lg;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(r*2.2,-r*.18);ctx.lineTo(r*2.2,r*.18);ctx.closePath();ctx.fill()}ctx.restore();
  }
  const fr=typeof pet3dFrame==='function'?pet3dFrame(vk,t,o.t!=null):null;
  if(fr){const sz=r*3.75;ctx.drawImage(fr,x-sz/2,y-sz/2,sz,sz)}
  else{R3.yaw=.55+Math.sin(t*.7)*.28; R3.pitch=.3; R3.s=r*.95; R3.ox=x; R3.oy=y+bob; R3.faces=[];
  s.draw(t)}
  if(fx&&mk!=='none'){sparkleRing(x,y+bob,r*1.5,t,M.col,4+MUT_BY[mk].i);if(r>=34){ctx.save();ctx.globalAlpha=.85;txt(M.name.toUpperCase(),x,y+bob+r*1.35,Math.max(7,r*.26),M.col,{font:'b'});ctx.restore()}}
  if(fx&&o.f)drawFusion(x,y+bob,r,o.f,t);
  if(o.lvl>1&&r>=14&&o.badge!==false){rr(x+r*.5,y+r*.7,r*.9,r*.42,r*.2);ctx.fillStyle='rgba(10,24,22,.85)';ctx.fill();txt(_t("Nv")+o.lvl,x+r*.95,y+r*.92,Math.max(7,r*.3),'#ffd21f',{stroke:false})}
  ctx.restore();
}
