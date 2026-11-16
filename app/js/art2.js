'use strict';
/* ===== art2: Mundo Vivo additions — new accessories, cosmetics, bathrooms and intruders ===== */

/* ---------- accessories for the new Verities ---------- */
function drawAccExtra(a,V,x,y,r,t){
  switch(a){
    case 'beans':for(const [dx,ang] of[[-.32,-.5],[0,.1],[.32,.6]])ell(x+dx*r,y-r*.95,r*.17,r*.1,'#6a3418',ang);break;
    case 'cocoa':{ctx.save();clipBody(x,y,r);ctx.fillStyle='#3a1a08';ctx.beginPath();ctx.moveTo(x-r,y-r*.25);for(let i=0;i<=8;i++){const px=x-r+i*r*.25;ctx.lineTo(px,y-r*.25+(i%2?r*.28:0)+Math.sin(t*2+i)*r*.03)}ctx.lineTo(x+r,y-r);ctx.lineTo(x-r,y-r);ctx.closePath();ctx.fill();ell(x-r*.4,y-r*.7,r*.18,r*.07,'rgba(255,255,255,.25)',-.4);ctx.restore();break}
    case 'sprinkles':{ctx.save();clipBody(x,y,r);const cs=['#ff4d6d','#ffd23a','#4dff88','#3ad4ff','#ffffff'];for(let i=0;i<18;i++){ctx.save();ctx.translate(x+Math.sin(i*7.1)*r*.8,y+Math.cos(i*3.3)*r*.8);ctx.rotate(i);ctx.fillStyle=cs[i%5];ctx.fillRect(-r*.07,-r*.025,r*.14,r*.05);ctx.restore()}ctx.restore();break}
    case 'sparks':for(let i=0;i<4;i++){const ang=t*2+i*TAU/4,cx=x+Math.cos(ang)*r*1.2,cy=y+Math.sin(ang)*r*1.2;line([[cx-r*.1,cy-r*.12],[cx+r*.04,cy],[cx-r*.04,cy+r*.02],[cx+r*.1,cy+r*.14]],'#fff23a',Math.max(1.2,r*.05))}break;
    case 'void':{ctx.save();ctx.lineWidth=Math.max(1.5,r*.07);for(let i=0;i<3;i++){ctx.strokeStyle=`rgba(${150+i*30},${90+i*20},255,${.55-i*.12})`;ctx.beginPath();ctx.arc(x,y,r*(1.15+i*.14),t*(1.5-i*.4)+i,t*(1.5-i*.4)+i+Math.PI*1.2);ctx.stroke()}ctx.restore();break}
    case 'tophat':rr(x-r*.42,y-r*1.55,r*.84,r*.75,r*.06);ctx.fillStyle='#121212';ctx.fill();ell(x,y-r*.82,r*.72,r*.13,'#121212');ctx.fillStyle='#8a1a20';ctx.fillRect(x-r*.42,y-r*1.0,r*.84,r*.12);break;
    case 'pumpkin':ctx.save();clipBody(x,y,r);ctx.strokeStyle='rgba(120,50,0,.45)';ctx.lineWidth=Math.max(1,r*.05);for(const dx of[-.55,-.2,.2,.55]){ctx.beginPath();ctx.ellipse(x+dx*r,y,r*.25,r*1.05,0,0,TAU);ctx.stroke()}ctx.restore();rr(x-r*.08,y-r*1.18,r*.16,r*.32,r*.05);ctx.fillStyle='#3a7a1a';ctx.fill();ell(x+r*.22,y-r*1.02,r*.2,r*.08,'#4fbf3a',.4);break;
    case 'santa':{ctx.fillStyle='#d42a2a';ctx.beginPath();ctx.moveTo(x-r*.75,y-r*.62);ctx.quadraticCurveTo(x-r*.1,y-r*1.75,x+r*.85,y-r*1.25);ctx.lineTo(x+r*.7,y-r*.62);ctx.closePath();ctx.fill();rr(x-r*.82,y-r*.75,r*1.6,r*.26,r*.13);ctx.fillStyle='#ffffff';ctx.fill();circ(x+r*.88,y-r*1.25,r*.16,'#ffffff');break}
    case 'mask':{ctx.fillStyle='#7a2ad8';ctx.beginPath();ctx.moveTo(x-r*.7,y-r*.18);ctx.quadraticCurveTo(x-r*.35,y-r*.42,x,y-r*.15);ctx.quadraticCurveTo(x+r*.35,y-r*.42,x+r*.7,y-r*.18);ctx.quadraticCurveTo(x+r*.35,y+r*.12,x,y-r*.02);ctx.quadraticCurveTo(x-r*.35,y+r*.12,x-r*.7,y-r*.18);ctx.fill();for(const s of[-1,1])ell(x+s*r*.3,y-r*.14,r*.1,r*.07,'#111');sparkles(x,y-r*.2,r*.6,3,'#ffd23a',t,1);line([[x+r*.65,y-r*.25],[x+r*.95,y-r*.75]],'#ffd23a',Math.max(1,r*.04));ell(x+r*.98,y-r*.82,r*.12,r*.2,'#ff4fd0',.4);break}
    case 'confetti':{const cs=['#ff4d6d','#ffd23a','#4dff88','#3ad4ff','#c08bff'];for(let i=0;i<8;i++){const k=(t*.5+i/8)%1;ctx.fillStyle=cs[i%5];ctx.save();ctx.translate(x+Math.sin(i*2.4)*r*1.3,y-r*1.4+k*r*2.6);ctx.rotate(t*3+i);ctx.fillRect(-r*.06,-r*.03,r*.12,r*.06);ctx.restore()}break}
    case 'straw':ell(x,y-r*.72,r*1.25,r*.26,'#e6c36a');rr(x-r*.5,y-r*1.25,r,r*.58,r*.25);ctx.fillStyle='#e9cc7a';ctx.fill();ctx.fillStyle='#d42a2a';ctx.fillRect(x-r*.5,y-r*.86,r,r*.1);break;
    case 'freckles':for(const s of[-1,1])for(let i=0;i<3;i++)circ(x+s*r*(.42+i*.08),y+r*(.12+(i%2)*.06),r*.025,'rgba(140,70,20,.6)');break;
    case 'party':{ctx.fillStyle='#3ad4ff';ctx.beginPath();ctx.moveTo(x-r*.35,y-r*.85);ctx.lineTo(x+r*.05,y-r*1.75);ctx.lineTo(x+r*.4,y-r*.85);ctx.closePath();ctx.fill();ctx.strokeStyle='#ff4fd0';ctx.lineWidth=Math.max(1.5,r*.08);ctx.beginPath();ctx.moveTo(x-r*.22,y-r*1.1);ctx.lineTo(x+r*.3,y-r*1.1);ctx.moveTo(x-r*.08,y-r*1.4);ctx.lineTo(x+r*.18,y-r*1.4);ctx.stroke();circ(x+r*.05,y-r*1.78,r*.1,'#ffd23a');break}
  }
}

/* ---------- more cosmetics ---------- */
Object.assign(COS.skin.items,{zumbi:{name:'Zumbi',price:4000,col:'#9fbf8a'},vampiro:{name:'Vampiro',price:4000,col:'#ece6f2'},roxa:{name:'Roxa',price:5000,col:'#b48ad8'}});
Object.assign(COS.hair.items,{trancas:{name:'Tranças',price:2200},coque:{name:'Coque Samurai',price:2600},emo:{name:'Franja Emo',price:3000},afrorosa:{name:'Black Power Rosa',price:4500}});
Object.assign(COS.hat.items,{chef:{name:'Chapéu de Chef',price:4000},pirata:{name:'Chapéu Pirata',price:7000},papai:{name:'Gorro de Natal',price:5000},chifres:{name:'Chifrinhos',price:8000},aureola:{name:'Auréola',price:15000},astronauta:{name:'Capacete Espacial',price:20000}});
Object.assign(COS.glasses.items,{aviador:{name:'Aviador',price:2500},estrela:{name:'Estrela',price:3500},espiral:{name:'Hipnose',price:6000},laser:{name:'Visor Laser',price:12000}});
Object.assign(COS.shirt.items,{pijama:{name:'Pijama',price:2500,base:'#7aa8e8',dark:'#4a78c8'},camuflado:{name:'Camuflado',price:5000,base:'#6a7a3a',dark:'#3e4a1e'},smoking:{name:'Smoking',price:12000,base:'#18181e',dark:'#0a0a0e'},super:{name:'Super Verity',price:18000,base:'#2a5ae0',dark:'#d42a2a'},astro:{name:'Traje Espacial',price:30000,base:'#eef2f6',dark:'#9aa8b8'}});
function drawHairBackExtra(kind){
  if(kind==='afrorosa'){circ(270,226,94,'#ff6fb8');return true}
  if(kind==='trancas'){for(const s of[-1,1]){for(let i=0;i<6;i++)ell(270+s*64,252+i*22,13,12,'#2b1d16');circ(270+s*64,390,7,'#ff4d6d')}return false}
  return false;
}
function drawHairFrontExtra(kind,cap){
  switch(kind){
    case 'trancas':cap('#2b1d16');break;
    case 'coque':cap('#1d130e');circ(270,176,22,'#1d130e');rr(250,192,40,8,3);ctx.fillStyle='#d42a2a';ctx.fill();break;
    case 'emo':cap('#141018');poly([[230,206],[318,206],[316,272],[284,252],[270,216]],'#141018');break;
    case 'afrorosa':ctx.fillStyle='#ff6fb8';ctx.beginPath();ctx.arc(270,246,62,Math.PI*1.08,Math.PI*1.92);ctx.quadraticCurveTo(270,222,212,234);ctx.closePath();ctx.fill();break;
  }
}
function drawHatExtra(kind){
  switch(kind){
    case 'chef':rr(222,150,96,62,10);ctx.fillStyle='#ffffff';ctx.fill();for(const dx of[-30,0,30])circ(270+dx,150,28,'#ffffff');ctx.strokeStyle='#ddd';ctx.lineWidth=2;ctx.strokeRect(222,196,96,16);break;
    case 'pirata':{ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.moveTo(190,210);ctx.quadraticCurveTo(270,120,350,210);ctx.quadraticCurveTo(270,180,190,210);ctx.fill();circ(270,176,13,'#f4f4f4');line([[262,170],[278,184]],'#1a1a1a',3);line([[278,170],[262,184]],'#1a1a1a',3);break}
    case 'papai':{ctx.fillStyle='#d42a2a';ctx.beginPath();ctx.moveTo(214,214);ctx.quadraticCurveTo(250,110,340,150);ctx.lineTo(326,214);ctx.closePath();ctx.fill();rr(206,200,128,24,12);ctx.fillStyle='#ffffff';ctx.fill();circ(342,152,14,'#ffffff');break}
    case 'chifres':for(const s of[-1,1]){ctx.fillStyle='#d42a2a';ctx.beginPath();ctx.moveTo(270+s*30,198);ctx.quadraticCurveTo(270+s*52,150,270+s*36,128);ctx.quadraticCurveTo(270+s*36,170,270+s*14,196);ctx.closePath();ctx.fill()}break;
    case 'aureola':ctx.save();ctx.shadowColor='#fff3a0';ctx.shadowBlur=18;ctx.strokeStyle='#ffe27a';ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(270,160+Math.sin(S.time*2)*3,52,13,0,0,TAU);ctx.stroke();ctx.restore();break;
    case 'astronauta':ctx.save();ctx.strokeStyle='rgba(220,240,255,.9)';ctx.lineWidth=7;ctx.beginPath();ctx.arc(270,250,84,0,TAU);ctx.stroke();ctx.fillStyle='rgba(190,225,255,.16)';ctx.fill();ctx.restore();ell(226,196,22,10,'rgba(255,255,255,.5)',-.6);break;
  }
}
function drawGlassesExtra(kind){
  switch(kind){
    case 'aviador':for(const x of[248,292]){ell(x,254,17,14,'rgba(60,40,10,.75)');ctx.strokeStyle='#c9a24a';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,254,17,14,0,0,TAU);ctx.stroke()}line([[264,246],[276,246]],'#c9a24a',3);break;
    case 'estrela':for(const x of[248,292]){ctx.fillStyle='#ffd23a';ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?8:19;ctx.lineTo(x+Math.cos(a)*rad,252+Math.sin(a)*rad)}ctx.closePath();ctx.fill()}line([[266,250],[274,250]],'#ffd23a',3);break;
    case 'espiral':for(const x of[248,292]){circ(x,252,15,'#ffffff');ctx.strokeStyle='#7a2ad8';ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<40;i++){const a=i*.45+S.time*4,rad=i*.35;ctx.lineTo(x+Math.cos(a)*rad,252+Math.sin(a)*rad)}ctx.stroke()}break;
    case 'laser':rr(222,238,96,26,10);ctx.fillStyle=`rgba(255,40,60,${.75+Math.sin(S.time*8)*.2})`;ctx.fill();ctx.save();ctx.shadowColor='#ff2a3a';ctx.shadowBlur=14;line([[230,251],[310,251]],'#ffd0d0',3);ctx.restore();break;
  }
}
function drawShirtExtra(kind,base,dark){
  switch(kind){
    case 'pijama':ctx.fillStyle=dark;for(let x=184;x<360;x+=24)ctx.fillRect(x,330,10,200);for(let i=0;i<4;i++)circ(270,370+i*30,4,'#ffffff');break;
    case 'camuflado':for(let i=0;i<14;i++)ell(196+(i*41)%150,352+(i*29)%150,16+(i%3)*6,10,i%2?dark:'#8a8a4a',i);break;
    case 'smoking':poly([[262,338],[270,352],[278,338]],'#ffffff');poly([[264,345],[256,352],[264,359]],'#111');poly([[276,345],[284,352],[276,359]],'#111');poly([[252,338],[230,430],[260,410]],'#26262e');poly([[288,338],[310,430],[280,410]],'#26262e');for(let i=0;i<3;i++)circ(270,380+i*24,3,'#ddd');break;
    case 'super':{ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.moveTo(240,380);ctx.lineTo(300,380);ctx.lineTo(270,430);ctx.closePath();ctx.fill();txt('V',270,396,26,'#d42a2a',{stroke:false});break}
    case 'astro':rr(232,380,76,46,8);ctx.fillStyle='#c9d4e0';ctx.fill();circ(250,403,6,'#ff4d5e');circ(270,403,6,'#5fe39a');circ(290,403,6,'#3ad4ff');break;
  }
}

/* ---------- more intruders ---------- */
Object.assign(INTRUDERS,{
  mae:{name:'Mãe',price:6000,knock:'Já tá aí faz meia hora!',enter:'CADÊ O MEU CHINELO?!'},
  avo:{name:'Vó',price:7000,knock:'Netinho, a vó precisa usar!',enter:'AI MEU DEUS DO CÉU!'},
  policial:{name:'Policial',price:10000,knock:'Polícia! Abra a porta!',enter:'PERDEU! MÃOS PRO ALTO!'},
  palhaco:{name:'Palhaço',price:12000,knock:'Toc toc! Quem é?',enter:'HONK HONK! SURPRESA!'},
  alien:{name:'Alienígena',price:25000,knock:'Bip bop... humano ocupado?',enter:'ABDUÇÃO INICIADA!'},
  fantasma:{name:'Fantasma',price:30000,knock:'Uuuuuuuuh...',enter:'BUUUUUUU!'}
});
function drawIntruderExtra(kind,x,y,s){
  switch(kind){
    case 'mae':figureBase(x,y,s*.95,{skin:'#d39b6a',top:'#e05a8a',legs:'#e05a8a',shoes:'#6a3a1a',
      hairBack:()=>{circ(0,-372,22,'#3a2418')},hairFront:()=>{ctx.fillStyle='#3a2418';ctx.beginPath();ctx.arc(0,-334,42,Math.PI*1.05,Math.PI*1.95);ctx.fill()},
      face:()=>{line([[-24,-350],[-6,-340]],'#2b1d16',4);line([[24,-350],[6,-340]],'#2b1d16',4)},
      extra:()=>{ctx.save();ctx.translate(-80,-150);ctx.rotate(-.6+Math.sin(S.time*10)*.3);rr(-12,-30,24,60,10);ctx.fillStyle='#3a6ad8';ctx.fill();ctx.restore()}});return true;
    case 'avo':figureBase(x,y,s*.85,{skin:'#efc097',top:'#8a5ac8',legs:'#5a4a6a',shoes:'#3a2a2a',
      hairFront:()=>{ctx.fillStyle='#d8d8d8';ctx.beginPath();ctx.arc(0,-336,42,Math.PI,TAU);ctx.fill();circ(0,-378,16,'#d8d8d8')},
      face:()=>{ctx.strokeStyle='#666';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-14,-330,10,0,TAU);ctx.moveTo(24,-330);ctx.arc(14,-330,10,0,TAU);ctx.stroke()},
      extra:()=>{line([[-50,-160],[-20,-120]],'#c9a24a',3);line([[-30,-170],[-50,-110]],'#c9a24a',3);circ(-38,-140,14,'#ff6fa5')}});return true;
    case 'policial':figureBase(x,y,s,{skin:'#a8714c',top:'#1e3a7a',legs:'#14264f',shoes:'#111',
      hat:()=>{rr(-44,-388,88,24,6);ctx.fillStyle='#14264f';ctx.fill();ell(0,-366,50,9,'#0a1530');circ(0,-376,7,'#ffd23a')},
      topDeco:()=>{poly([[22,-250],[34,-250],[38,-236],[28,-226],[18,-236]],'#ffd23a')},
      extra:()=>{line([[60,-200],[90,-230]],'#111',8)}});return true;
    case 'palhaco':figureBase(x,y,s,{skin:'#ffffff',top:'#ffd23a',legs:'#3a7aff',shoes:'#ff2a3a',
      hairBack:()=>{for(const sx of[-1,1])circ(sx*42,-340,26,'#ff4fd0')},
      face:()=>{circ(0,-318,10,'#ff2a3a');ctx.strokeStyle='#ff2a3a';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,-312,18,.15*Math.PI,.85*Math.PI);ctx.stroke()},
      topDeco:()=>{for(let i=0;i<3;i++)circ(0,-250+i*36,8,['#ff2a3a','#3ad4ff','#4dff88'][i])}});return true;
    case 'alien':figureBase(x,y,s*.9,{skin:'#7ae05a',top:'#c9d4e0',legs:'#9aa8b8',shoes:'#555',
      hairFront:()=>{for(const sx of[-1,1]){line([[sx*14,-366],[sx*26,-404]],'#7ae05a',4);circ(sx*26,-406,6,'#d7ff5a')}},
      face:()=>{for(const sx of[-1,1])ell(sx*15,-334,12,16,'#111',sx*.3)}});return true;
    case 'fantasma':{ctx.save();ctx.translate(x,y-20+Math.sin(S.time*3)*8);ctx.scale(s,s);ctx.globalAlpha=.9;
      ctx.fillStyle='#f4f4ff';ctx.beginPath();ctx.moveTo(-70,0);ctx.lineTo(-70,-280);ctx.quadraticCurveTo(-70,-380,0,-380);ctx.quadraticCurveTo(70,-380,70,-280);ctx.lineTo(70,0);
      for(let i=0;i<5;i++){const xx=70-i*28;ctx.quadraticCurveTo(xx-7,-24,xx-14,0);ctx.quadraticCurveTo(xx-21,24,xx-28,0)}ctx.closePath();ctx.fill();
      ell(-24,-300,12,18,'#111');ell(24,-300,12,18,'#111');ell(0,-250,18,24,'#111');ctx.restore();return true}
  }
  return false;
}

/* ---------- more bathrooms (sequential tiers 9–14) ---------- */
[
  {name:'Navio Pirata',price:1500000,wall:'#5a3a20',grout:'#3a2410',floor:['#6a4a2a','#4a3018'],toilet:'#d9c9a8',decor:'pirata'},
  {name:'Submarino',price:4000000,wall:'#1a3a4a',grout:'#0e2430',floor:['#2a4a5a','#1a3442'],toilet:'#dfe6f2',decor:'submarino'},
  {name:'Castelo Medieval',price:10000000,wall:'#5a5a62',grout:'#3a3a40',floor:['#4a4a50','#38383e'],toilet:'#c9c9c0',decor:'castelo'},
  {name:'Laboratório Secreto',price:25000000,wall:'#1e2a2a',grout:'#0e1818',floor:['#2a3a3a','#1a2828'],toilet:'#e6f2ee',decor:'lab'},
  {name:'Templo Asteca',price:60000000,wall:'#8a6a3a',grout:'#5a4420',floor:['#6a5228','#4a3a1a'],toilet:'#f2c94c',decor:'templo'},
  {name:'Dimensão do Papel',price:150000000,wall:'#f4f4f8',grout:'#d8d8e4',floor:['#ffffff','#e8e8f0'],toilet:'#ffffff',decor:'papel'}
].forEach(b=>{const tier=BATHS.length+1;BATHS.push({...b,tier,luck:1+.2*Math.log2(tier)})});
function drawDecorExtra(b,t){
  switch(b.decor){
    case 'pirata':for(let y=0;y<600;y+=40){ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(0,y,W,3)}rr(150,160,120,80,6);ctx.fillStyle='#1a1a1a';ctx.fill();txt('☠',210,200,48,'#f4f4f4',{stroke:false});line([[840,0],[860,600]],'rgba(200,170,110,.6)',6);break;
    case 'submarino':{for(const [cx,cy] of[[220,240],[860,200]]){circ(cx,cy,80,'#0a2a4a');ctx.save();ctx.beginPath();ctx.arc(cx,cy,72,0,TAU);ctx.clip();ctx.fillStyle='#0a4a7a';ctx.fillRect(cx-80,cy-80,160,160);for(let i=0;i<3;i++){const fx=cx-80+((t*40+i*60)%160);ell(fx,cy-20+i*20,14,7,['#ffd23a','#ff7a3a','#7af0ff'][i])}for(let i=0;i<5;i++)circ(cx-40+i*20,cy+60-((t*30+i*25)%140),3,'rgba(255,255,255,.6)');ctx.restore();ctx.strokeStyle='#9aa8b8';ctx.lineWidth=12;ctx.beginPath();ctx.arc(cx,cy,78,0,TAU);ctx.stroke()}break}
    case 'castelo':for(let r=0;r<12;r++)for(let c=0;c<14;c++){ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=2;ctx.strokeRect(c*96+(r%2)*48,r*50,96,50)}for(const x of[170,880]){rr(x-8,250,16,60,4);ctx.fillStyle='#4a3018';ctx.fill();const fl=Math.sin(t*12+x)*4;ctx.fillStyle='#ff8a1a';ctx.beginPath();ctx.moveTo(x-14,252);ctx.quadraticCurveTo(x,200+fl,x+14,252);ctx.fill();ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.moveTo(x-7,252);ctx.quadraticCurveTo(x,222+fl,x+7,252);ctx.fill()}break;
    case 'lab':for(const [x,c] of[[160,'#39ff7a'],[220,'#ff4fd0'],[880,'#3ad4ff']]){rr(x-22,160,44,240,20);ctx.fillStyle='rgba(200,255,240,.12)';ctx.fill();rr(x-18,240,36,156,16);ctx.fillStyle=c;ctx.globalAlpha=.55;ctx.fill();ctx.globalAlpha=1;for(let i=0;i<4;i++)circ(x-8+i*5,396-((t*50+i*30)%150),3,'rgba(255,255,255,.7)')}break;
    case 'templo':for(let r=0;r<6;r++)for(let c=0;c<13;c++){ctx.strokeStyle='rgba(60,40,10,.4)';ctx.lineWidth=3;ctx.strokeRect(c*100,r*100,100,100);if((r+c)%3===0){ctx.fillStyle='rgba(255,210,80,.35)';ctx.fillRect(c*100+30,r*100+30,40,40)}}break;
    case 'papel':for(let i=0;i<18;i++){const x=60+(i*137)%1180,y=60+(i*89)%480;rr(x-18,y-24,36,48,8);ctx.fillStyle='#ffffff';ctx.fill();ctx.strokeStyle='#ddd';ctx.lineWidth=2;ctx.stroke();circ(x,y,8,'#e8e8f0')}break;
  }
}
