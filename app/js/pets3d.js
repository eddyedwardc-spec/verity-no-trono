'use strict';
/* ===== Secret pets in real 3D (three.js) =====
   Each secret is a three.js model, lit by a key light, a strong coloured rim light and a soft fill.
   We render it off-screen into a looping set of frames (it sways, bobs and moves its wings/flames/tentacles),
   add a bloom glow from its emissive parts, and the 2D game just draws those frames.
   Frames are made lazily, a few per animation frame, so nothing stalls; a static thumbnail gets its frame at once.
   If WebGL isn't available, secrets.js falls back to its simpler block drawings. */
const P3D={r:null,cam:null,pets:{},cache:{},SIZE:256,FR:24,UNITS:3.8,budget:0,budgetAt:-1};
function p3ok(){
  if(P3D.r!==null)return !!P3D.r;
  try{
    if(typeof THREE==='undefined')throw new Error('no three');
    const c=document.createElement('canvas');c.width=c.height=P3D.SIZE;
    const r=new THREE.WebGLRenderer({canvas:c,alpha:true,antialias:true,preserveDrawingBuffer:true});
    r.setPixelRatio(1);r.setSize(P3D.SIZE,P3D.SIZE,false);r.setClearColor(0x000000,0);
    P3D.r=r;P3D.cam=new THREE.PerspectiveCamera(30,1,.1,50);P3D.cam.position.set(0,1.45,7.2);P3D.cam.lookAt(0,.05,0);
  }catch(e){P3D.r=false}
  return !!P3D.r;
}

/* ---------- building blocks ---------- */
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const mat=(col,o={})=>new THREE.MeshStandardMaterial({color:col,roughness:o.rough??.42,metalness:o.metal??.2,emissive:o.em??0x000000,emissiveIntensity:o.ei??1,
  transparent:o.opacity!=null,opacity:o.opacity??1,side:o.double?THREE.DoubleSide:THREE.FrontSide,map:o.map||null,emissiveMap:o.emap||null});
const glowMat=(col,ei=1.4)=>mat(col,{em:col,ei,rough:.3,metal:0});
function rboxG(w,h,d,r=.14){
  const s=new THREE.Shape(),W=w/2-r,H=h/2-r;s.moveTo(-W,-H);s.lineTo(W,-H);s.lineTo(W,H);s.lineTo(-W,H);s.lineTo(-W,-H);
  const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.01,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:3,curveSegments:2,steps:1});g.center();return g;
}
function mesh(geo,m,pos,rot,scl){const o=new THREE.Mesh(geo,m);if(pos)o.position.set(...pos);if(rot)o.rotation.set(...rot);if(scl)o.scale.set(...scl);return o}
const rbox=(w,h,d,m,pos,rot,r)=>mesh(rboxG(w,h,d,r),m,pos,rot);
function shapeOf(pts,curves){const s=new THREE.Shape();s.moveTo(...pts[0]);for(const p of pts.slice(1)){if(p.length===4)s.quadraticCurveTo(p[0],p[1],p[2],p[3]);else s.lineTo(p[0],p[1])}s.closePath();return s}
function flat(pts,depth,m,pos,rot,scl){const g=new THREE.ExtrudeGeometry(shapeOf(pts),{depth,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:1,curveSegments:8});return mesh(g,m,pos,rot,scl)}
// a curved, tapering horn/tentacle made of cylinders along a list of points
function horn(pts,r0,m,r1=.012){
  const g=new THREE.Group(),v=pts.map(p=>V3(...p)),n=v.length-1;
  for(let i=0;i<n;i++){
    const a=v[i],b=v[i+1],len=a.distanceTo(b),rA=lerp(r0,r1,i/n),rB=lerp(r0,r1,(i+1)/n);
    const geo=i===n-1?new THREE.ConeGeometry(rA,len,12):new THREE.CylinderGeometry(rB,rA,len,12);
    const o=new THREE.Mesh(geo,m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(V3(0,1,0),b.clone().sub(a).normalize());g.add(o);
    if(i>0){const j=new THREE.Mesh(new THREE.SphereGeometry(rA,12,8),m);j.position.copy(a);g.add(j)}
  }
  return g;
}
const mirror=pts=>pts.map(p=>p.length===4?[-p[0],p[1],-p[2],p[3]]:[-p[0],p[1]]);
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);return t}
// angry glowing eye (left), as a 2D outline; right eye is mirrored
const EYE_ANGRY=[[-.62,.2],[-.12,.04],[-.14,-.14],[-.55,-.06]];
function eyes(group,col,z,y,o={}){
  const em=glowMat(col,o.ei??2.2),pupil=mat(0x050208,{rough:.2});
  const L=o.shape||EYE_ANGRY;
  group.add(flat(L,.05,em,[0,y,z]));group.add(flat(mirror(L),.05,em,[0,y,z]));
  if(o.slit)for(const s of[-1,1])group.add(rbox(.05,.2,.04,pupil,[s*.36,y+.02,z+.06],[0,0,0],.012));
  if(o.brow)for(const s of[-1,1])group.add(rbox(.55,.1,.12,o.brow,[s*.38,y+.24,z+.02],[0,0,s*.32],.03));
}
function fangs(group,y,z,n=4,w=.5,col=0xf4f0e8){const m=mat(col,{rough:.3});for(let i=0;i<n;i++){const x=-w/2+i*w/(n-1);const c=mesh(new THREE.ConeGeometry(.06,.2,8),m,[x,y,z],[Math.PI,0,0]);group.add(c)}}
function scene3(rim,fill){
  const s=new THREE.Scene();
  s.add(new THREE.HemisphereLight(0x8090c0,0x0a0a12,.55));
  const key=new THREE.DirectionalLight(0xffffff,1.25);key.position.set(-3,4.5,5);s.add(key);
  const r=new THREE.DirectionalLight(rim,2.4);r.position.set(4.5,1.5,-3.5);s.add(r);
  const r2=new THREE.DirectionalLight(rim,1.1);r2.position.set(-4.5,.5,-3);s.add(r2);
  const f=new THREE.DirectionalLight(fill,.55);f.position.set(0,-4,3);s.add(f);
  return s;
}

/* ---------- the seven pets ---------- */
const PET_BUILD={
  wyrmity(){
    const g=new THREE.Group(),body=mat(0x0e3a22,{metal:.35,rough:.38}),plate=mat(0x1d7044,{metal:.45,rough:.3}),gold=mat(0xd8a028,{metal:.85,rough:.22}),dark=mat(0x06180e,{rough:.5});
    g.add(rbox(1.5,1.35,1.4,body,[0,0,0],0,.18));
    g.add(rbox(1.62,.26,1.05,plate,[0,.66,-.05],[-.08,0,0],.08));
    for(const s of[-1,1])g.add(rbox(.2,.8,1.0,plate,[s*.8,-.05,.05],[0,0,0],.07));
    g.add(rbox(.92,.52,.62,mat(0x145a33,{metal:.35,rough:.35}),[0,-.32,.86],0,.12));
    for(const s of[-1,1])g.add(mesh(new THREE.SphereGeometry(.06,10,8),glowMat(0xff6a10,2.5),[s*.22,-.24,1.18]));
    fangs(g,-.66,1.08,4,.6);
    eyes(g,0xffd21f,.71,.12,{slit:true,brow:dark});
    for(const s of[-1,1])g.add(horn([[s*.42,.66,-.15],[s*.55,1.0,-.35],[s*.82,1.25,-.7],[s*1.15,1.32,-1.05],[s*1.38,1.25,-1.3]],.17,gold));
    for(const s of[-1,1])g.add(horn([[s*.78,.2,.2],[s*1.05,.3,.05],[s*1.25,.5,-.15]],.08,gold));
    for(let i=0;i<4;i++)g.add(mesh(new THREE.ConeGeometry(.13,.36,6),mat(0x2a9a5e,{metal:.4}),[0,.8+(i%2)*.02,.35-i*.3],[-.35,0,0]));
    const wingShape=[[0,0],[.6,.9,1.5,1.15],[1.35,.75,1.62,.42],[1.25,.4,1.3,.05],[.95,.1,.95,-.3],[.6,-.15,.45,-.45],[.3,-.1,0,0]];
    const memb=mat(0x0b2a18,{rough:.6,metal:.1,double:true}),vein=glowMat(0x2aff8a,1.6),wings=[];
    for(const s of[-1,1]){const w=new THREE.Group();w.add(flat(wingShape,.035,memb));for(const tip of[[1.5,1.15],[1.3,.05],[.45,-.45]])w.add(horn([[0,0,.04],[tip[0]*.55,tip[1]*.55+.08,.04],[tip[0],tip[1],.04]],.025,vein,.008));
      w.position.set(s*.62,.35,-.62);w.scale.set(s*1.05,1.05,1);g.add(w);wings.push([w,s])}
    return {root:g,rim:0x2aff8a,fill:0xffb020,animate(ph){for(const [w,s] of wings){w.rotation.z=s*(.35+Math.sin(ph*2)*.28);w.rotation.y=s*-.55}}};
  },
  golemity(){
    const g=new THREE.Group(),rock=mat(0x161c2e,{rough:.72,metal:.15}),rock2=mat(0x242c44,{rough:.65,metal:.2}),ice=mat(0x9af6ff,{em:0x1aa0d0,ei:1.1,rough:.08,metal:.1,opacity:.92}),cy=glowMat(0x5af0ff,2.4);
    g.add(rbox(1.45,1.35,1.35,rock,[0,0,0],0,.12));
    for(const s of[-1,1])g.add(rbox(.62,.62,.62,rock2,[s*1.05,-.42,0],[0,s*.3,s*.2],.12));
    g.add(rbox(1.0,.55,.9,rock2,[0,-.9,-.05],0,.12));
    for(const [x,y,r] of[[-.32,.12,.12],[.32,.12,-.12]])g.add(rbox(.42,.16,.06,cy,[x,y,.69],[0,0,r],.03));
    g.add(rbox(.6,.07,.06,cy,[0,-.32,.69],0,.02));
    for(const [pts,z] of[[[[-.55,.55],[-.35,.3],[-.48,.1]],.69],[[[.5,-.1],[.62,-.35],[.45,-.55]],.69]])g.add(horn(pts.map(p=>[p[0],p[1],z]),.018,cy,.015));
    const crystal=(x,y,z,s,rx,rz)=>{const o=mesh(new THREE.OctahedronGeometry(s,0),ice,[x,y,z],[rx,0,rz],[1,2.4,1]);g.add(o);return o};
    crystal(0,1.0,0,.26,0,0);crystal(.38,.88,.15,.17,.2,-.45);crystal(-.36,.9,-.15,.19,-.2,.4);crystal(.1,.85,-.42,.13,-.4,.1);
    for(const s of[-1,1]){crystal(s*1.1,-.05,.05,.15,0,-s*.5);crystal(s*1.2,-.12,-.18,.1,.3,-s*.8)}
    const shards=[];for(let i=0;i<5;i++){const o=mesh(new THREE.OctahedronGeometry(.1,0),glowMat(0xc8fbff,1.8));g.add(o);shards.push(o)}
    return {root:g,rim:0x5af0ff,fill:0x4a6aff,animate(ph){shards.forEach((o,i)=>{const a=ph+i*TAU/5;o.position.set(Math.cos(a)*1.55,.2+Math.sin(ph*2+i)*.2,Math.sin(a)*1.1);o.rotation.y=ph*2})}};
  },
  fenixity(){
    const g=new THREE.Group(),body=mat(0x4a0806,{em:0x1a0200,rough:.4,metal:.3}),gold=mat(0xffb020,{metal:.8,rough:.25}),flames=[];
    g.add(rbox(1.38,1.3,1.32,body,[0,0,0],0,.16));
    g.add(rbox(1.2,.26,.12,mat(0x7a1208,{metal:.5,rough:.3}),[0,.32,.66],0,.05));
    eyes(g,0xfff0c0,.7,.08,{ei:2.6});
    const beak=mesh(new THREE.ConeGeometry(.24,.6,4),gold,[0,-.18,.95],[Math.PI/2,Math.PI/4,0]);g.add(beak);
    const fcol=[0xff2a08,0xff6a10,0xffb020,0xffe066];
    for(let i=0;i<7;i++){const x=(i-3)*.17,h=.55+(i===3?.55:(3-Math.abs(i-3))*.12),c=mesh(new THREE.ConeGeometry(.13,h,8),glowMat(fcol[i%4],1.8),[x,.65+h/2,-.05-Math.abs(i-3)*.06],[-.25,0,-(i-3)*.14]);g.add(c);flames.push([c,h,i])}
    const feather=[[0,0],[.5,.6,1.1,.8],[.9,.5,1.5,.95],[1.2,.45,1.75,.6],[1.2,.15,1.45,0],[.8,-.2,.35,-.35],[.15,-.15,0,0]];
    const wings=[];for(const s of[-1,1])for(let k=0;k<3;k++){const w=flat(feather,.03,mat(fcol[k],{em:fcol[k],ei:1.5,double:true,opacity:.95}));const grp=new THREE.Group();grp.add(w);grp.position.set(s*.58,.15-k*.12,-.55-k*.06);grp.scale.set(s*(1.05-k*.12),1.05-k*.12,1);g.add(grp);wings.push([grp,s,k])}
    for(let i=0;i<3;i++){const c=mesh(new THREE.ConeGeometry(.12,1.1,8),glowMat(fcol[i+1],1.6),[(i-1)*.25,-.85,-.55],[2.3,0,(i-1)*.4]);g.add(c)}
    const embers=[];for(let i=0;i<8;i++){const e=mesh(new THREE.SphereGeometry(.045,8,6),glowMat(0xffa020,2.5));g.add(e);embers.push(e)}
    return {root:g,rim:0xff5a10,fill:0xffd23a,animate(ph){
      for(const [c,h,i] of flames)c.scale.y=1+Math.sin(ph*3+i*1.7)*.18;
      for(const [w,s,k] of wings){w.rotation.z=s*(.3+Math.sin(ph*2+k*.4)*.3);w.rotation.y=s*-.5}
      embers.forEach((e,i)=>{const k=((ph/TAU)+i/8)%1;e.position.set(Math.sin(i*2.1)*1.2,-.6+k*2.6,Math.cos(i*1.7)*.6);e.scale.setScalar(1-k*.7)})}};
  },
  krakity(){
    const g=new THREE.Group(),body=mat(0x16051f,{rough:.3,metal:.35}),rune=glowMat(0xff3df0,2.0),horns=mat(0x07020c,{rough:.35,metal:.5});
    g.add(rbox(1.45,1.35,1.4,body,[0,.1,0],0,.16));
    eyes(g,0xff3df0,.81,.18,{ei:2.6,brow:mat(0x0a020f)});
    g.add(rbox(.8,.22,.1,mat(0x050108),[0,-.25,.72],0,.04));fangs(g,-.21,.8,4,.55);
    for(const [pts] of[[[[-.75,.45],[-.6,.2],[-.75,-.1]]],[[[.75,.5],[.6,.25],[.72,0]]]])g.add(horn(pts.map(p=>[p[0]*.98,p[1],.72]),.018,rune,.015));
    for(const s of[-1,1]){g.add(horn([[s*.72,.25,0],[s*.76,0,-.1],[s*.74,-.25,0]],.02,rune,.015))}
    for(const s of[-1,1])g.add(horn([[s*.45,.75,-.1],[s*.65,1.05,-.25],[s*.9,1.2,-.2],[s*1.05,1.1,0]],.13,horns));
    const tent=[],tm=mat(0x3a1060,{rough:.3,metal:.3}),tip=glowMat(0xff3df0,1.8);
    for(let k=0;k<6;k++){const a=(k/6)*TAU+.3,segs=[];for(let i=0;i<9;i++){const r=lerp(.17,.05,i/8),o=mesh(new THREE.SphereGeometry(r,12,10),i>=7?tip:tm);g.add(o);segs.push(o)}tent.push([a,segs,k])}
    return {root:g,rim:0xff3df0,fill:0x7a2aff,animate(ph){
      for(const [a,segs,k] of tent){const bx=Math.cos(a)*.5,bz=Math.sin(a)*.45;segs.forEach((o,i)=>{const d=i/8,w=Math.sin(ph*2+k*1.3+i*.6)*.18*d;o.position.set(bx*(1+d*.9)+Math.cos(a+1.57)*w,-.55-i*.16+Math.sin(ph+k)*.03*i,bz*(1+d*.7)+Math.sin(a+1.57)*w)})}}};
  },
  mechity(){
    const g=new THREE.Group(),steel=mat(0x56606e,{metal:.75,rough:.3}),steel2=mat(0x4a5464,{metal:.85,rough:.32}),glass=mat(0x020406,{metal:.95,rough:.08});
    const haz=canvasTex(64,16,(c,w,h)=>{c.fillStyle='#ffc81f';c.fillRect(0,0,w,h);c.fillStyle='#111';for(let x=-h;x<w;x+=16){c.beginPath();c.moveTo(x,h);c.lineTo(x+8,h);c.lineTo(x+8+h,0);c.lineTo(x+h,0);c.fill()}});
    g.add(rbox(1.45,1.3,1.35,steel,[0,0,0],0,.14));
    g.add(rbox(1.5,.18,.5,mat(0xffffff,{map:haz,metal:.3,rough:.5}),[0,.7,.3],0,.05));
    for(const y of[-.2,-.42])g.add(rbox(1.2,.03,.04,mat(0x0a0d12),[0,y,.69],0,.01));
    g.add(rbox(1.3,.42,.2,glass,[0,.15,.68],0,.08));
    const scan=rbox(.36,.2,.06,glowMat(0xff2a3a,3.0),[0,.15,.8],0,.03);g.add(scan);
    for(let i=0;i<4;i++)g.add(mesh(new THREE.SphereGeometry(.045,8,6),glowMat(i%2?0x39ff7a:0xffd21f,2),[-.42+i*.28,-.52,.68]));
    for(const s of[-1,1]){const ear=mesh(new THREE.CylinderGeometry(.3,.3,.3,20),steel2,[s*.86,.05,0],[0,0,Math.PI/2]);g.add(ear);g.add(mesh(new THREE.TorusGeometry(.2,.04,8,24),glowMat(0x3ad4ff,2.4),[s*1.02,.05,0],[0,Math.PI/2,0]));
      g.add(mesh(new THREE.CylinderGeometry(.09,.11,.9,14),steel2,[s*.72,.72,.15],[Math.PI/2,0,0]));g.add(mesh(new THREE.CylinderGeometry(.06,.06,.05,12),glowMat(0xff8a1a,2.6),[s*.72,.72,.62],[Math.PI/2,0,0]))}
    g.add(mesh(new THREE.CylinderGeometry(.025,.025,.6,8),steel2,[-.4,.95,-.2]));const bulb=mesh(new THREE.SphereGeometry(.08,12,10),glowMat(0xff2a3a,3),[-.4,1.27,-.2]);g.add(bulb);
    const jets=[];for(const s of[-1,1]){g.add(mesh(new THREE.CylinderGeometry(.18,.22,.35,16),steel2,[s*.4,-.8,0]));const f=mesh(new THREE.ConeGeometry(.16,.6,14),glowMat(0x3ab8ff,2.6),[s*.4,-1.25,0],[Math.PI,0,0]);g.add(f);jets.push(f)}
    return {root:g,rim:0x3ad4ff,fill:0xff3a4a,animate(ph){scan.position.x=Math.sin(ph*2)*.42;bulb.material.emissiveIntensity=Math.sin(ph*6)>0?3:.4;for(const f of jets)f.scale.y=1+Math.sin(ph*8)*.2}};
  },
  hidrity(){
    const g=new THREE.Group(),base=mat(0x1a0828,{rough:.38,metal:.35}),spk=mat(0x0a0310,{metal:.5,rough:.3});
    g.add(rbox(1.7,.7,1.15,base,[0,-.9,0],0,.14));
    for(let i=0;i<5;i++)g.add(mesh(new THREE.ConeGeometry(.1,.3,6),spk,[-.6+i*.3,-.48,-.35],[-.3,0,0]));
    const heads=[[-.95,.05,0x5a0c08,0xffa01a,.6],[0,.55,0x220c46,0xc84dff,0],[.95,.05,0x0a3a1e,0x6aff3a,-.6]],hs=[];
    for(const [hx,hy,col,eye,ry] of heads){
      const neck=[];for(let i=1;i<=3;i++){const o=rbox(.42,.42,.42,mat(0x2a0f40,{metal:.3,rough:.4}),null,null,.08);g.add(o);neck.push(o)}
      const h=new THREE.Group();h.add(rbox(.95,.88,.92,mat(col,{metal:.35,rough:.36}),[0,0,0],0,.14));
      const e=new THREE.Group();eyes(e,eye,0,0,{ei:2.6});e.scale.set(.62,.62,1);e.position.set(0,.08,.47);h.add(e);
      fangs(h,-.28,.48,3,.36);for(const s of[-1,1])h.add(horn([[s*.28,.42,-.1],[s*.42,.7,-.25],[s*.55,.82,-.18]],.08,mat(0xe8d8b0,{rough:.4})));
      h.rotation.y=ry;g.add(h);hs.push([h,hx,hy,neck])}
    return {root:g,rim:0xb84dff,fill:0xff6a1a,animate(ph){hs.forEach(([h,hx,hy,neck],i)=>{const x=hx+Math.sin(ph+i*2)*.08,y=hy+Math.cos(ph*2+i)*.06;h.position.set(x,y,.05);h.rotation.z=Math.sin(ph+i)*.08;
      neck.forEach((o,k)=>{const t=(k+1)/4;o.position.set(lerp(hx*.35,x,t),lerp(-.6,y-.4,t),-.05);o.rotation.set(Math.sin(ph+k)*.2,0,hx*.3)})})}};
  },
  cosmity(){
    const g=new THREE.Group();
    const gal=canvasTex(256,256,(c,w,h)=>{const r=c.createRadialGradient(w*.4,h*.4,10,w*.5,h*.5,w*.75);r.addColorStop(0,'#ff8ad8');r.addColorStop(.35,'#7a3aff');r.addColorStop(.75,'#16206a');r.addColorStop(1,'#04061e');c.fillStyle=r;c.fillRect(0,0,w,h);
      for(let i=0;i<5;i++){const n=c.createRadialGradient(Math.random()*w,Math.random()*h,0,Math.random()*w,Math.random()*h,w*.4);n.addColorStop(0,`hsla(${200+i*40},100%,70%,.35)`);n.addColorStop(1,'hsla(0,0%,0%,0)');c.fillStyle=n;c.fillRect(0,0,w,h)}
      for(let i=0;i<160;i++){c.fillStyle=`rgba(255,255,255,${Math.random()})`;c.beginPath();c.arc(Math.random()*w,Math.random()*h,Math.random()*1.6+.3,0,TAU);c.fill()}});
    g.add(rbox(1.55,1.45,1.5,mat(0xffffff,{map:gal,emap:gal,em:0xffffff,ei:.4,rough:.25,metal:.2}),[0,0,0],0,.2));
    const white=glowMat(0xffffff,2.2),pup=mat(0x0a0420,{rough:.2});
    for(const s of[-1,1]){g.add(mesh(new THREE.SphereGeometry(.24,20,16),white,[s*.36,.08,.72],0,[1,1.15,.35]));g.add(mesh(new THREE.SphereGeometry(.13,16,12),pup,[s*.38,.04,.8],0,[1,1.2,.3]));g.add(mesh(new THREE.SphereGeometry(.045,8,6),white,[s*.32,.14,.84]))}
    g.add(mesh(new THREE.TorusGeometry(.18,.035,8,20,Math.PI),glowMat(0xffffff,1.6),[0,-.32,.76],[0,0,Math.PI]));
    const ring=mesh(new THREE.TorusGeometry(1.75,.06,10,64),glowMat(0xffb84a,.9),[0,0,0],[1.25,0,-.3]);g.add(ring);
    g.add(mesh(new THREE.TorusGeometry(1.95,.02,6,64),glowMat(0xff8ad8,.9),[0,0,0],[1.25,0,-.3]));
    for(const s of[-1,1])g.add(flat([[0,0],[.5,.25,.6,.6],[.25,.3,0,0]],.06,mat(0x3a1a8a,{em:0x2a0a6a,ei:.8}),[s*.78,-.3,0],[0,s*-.4,s*.6],[s,1,1]));
    const moons=[0xffd28a,0x8ad4ff,0xff8ad8].map(c=>{const o=mesh(new THREE.SphereGeometry(.12,14,10),glowMat(c,1.2));g.add(o);return o});
    return {root:g,rim:0x9a7aff,fill:0xff8ad8,animate(ph){moons.forEach((o,i)=>{const a=ph+i*TAU/3;o.position.set(Math.cos(a)*1.6,Math.sin(a*2)*.25,Math.sin(a)*1.15)});ring.rotation.z=-.3+Math.sin(ph)*.05}};
  }
};
function p3size(n){if(P3D.cur!==n){P3D.cur=n;P3D.r.setSize(n,n,false)}}
function p3pet(key){
  if(P3D.pets[key])return P3D.pets[key];
  const b=PET_BUILD[key]();const sc=scene3(b.rim,b.fill);sc.add(b.root);
  sc.traverse(o=>{if(o.isMesh){const m=o.material,e=m.emissive&&(m.emissive.r+m.emissive.g+m.emissive.b)>0&&m.emissiveIntensity>.5;
    o.userData.gm=e?new THREE.MeshBasicMaterial({color:m.emissiveMap?new THREE.Color(0x2a2a2a):m.emissive.clone().multiplyScalar(Math.min(1,m.emissiveIntensity*.6)),map:m.emissiveMap||null,transparent:m.transparent,side:m.side}):P3D.black||(P3D.black=new THREE.MeshBasicMaterial({color:0x000000}))}});
  return P3D.pets[key]={...b,scene:sc};
}
function p3render(key,idx){
  const p=p3pet(key),R=P3D.r,ph=idx/P3D.FR*TAU,N=P3D.SIZE;p3size(N);
  p.animate(ph);p.root.rotation.y=-.5+Math.sin(ph)*.38;p.root.position.y=Math.sin(ph*2)*.07;
  R.render(p.scene,P3D.cam);
  const fc=document.createElement('canvas');fc.width=fc.height=N;const c=fc.getContext('2d');c.drawImage(R.domElement,0,0);
  p.scene.traverse(o=>{if(o.isMesh){o.userData.m0=o.material;o.material=o.userData.gm}});R.render(p.scene,P3D.cam);p.scene.traverse(o=>{if(o.isMesh)o.material=o.userData.m0});
  c.save();c.globalCompositeOperation='lighter';c.filter='blur(5px)';c.drawImage(R.domElement,0,0);c.filter='blur(14px)';c.globalAlpha=.85;c.drawImage(R.domElement,0,0);c.restore();
  return fc;
}
// the frame to show for this pet at time t (null if 3D isn't available yet)
function pet3dFrame(key,t,now){
  if(!PET_BUILD[key]||!p3ok())return null;
  const fr=P3D.cache[key]||(P3D.cache[key]=new Array(P3D.FR)),idx=Math.floor(((t%4)+4)%4/4*P3D.FR)%P3D.FR;
  if(fr[idx])return fr[idx];
  if(P3D.budgetAt!==S.time){P3D.budgetAt=S.time;P3D.budget=2}
  if(now||P3D.budget>0||!fr.some(Boolean)){P3D.budget--;try{fr[idx]=p3render(key,idx)}catch(e){P3D.r=false;return null}return fr[idx]}
  for(let k=1;k<P3D.FR;k++){const f=fr[(idx-k+P3D.FR)%P3D.FR];if(f)return f}
  return null;
}
