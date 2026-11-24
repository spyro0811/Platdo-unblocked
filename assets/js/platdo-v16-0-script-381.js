
/* PLATDO City storefronts (V4.6). The four clothing stores, the diner and the equipment shop were the same
 * flat box with the same dark sign board. Each now has its own front, roofline and sign:
 *   clothing          Platdo Basics       modern sports store: white fascia, orange stripe, tall corner pylon
 *   clothing-drip     Drip District       brick loft: stepped parapet, black steel, rooftop water tank, neon
 *   clothing-luxury   Platdo Luxury       boutique: columned portico with a pediment, balustrade, striped awnings
 *   clothing-oddball  Oddball Outfitters  novelty shop: zig-zag crown, barber poles, giant top hat, bow tie and eyes
 *   diner             The Copper Kettle   retro diner: rounded cream fascia, chrome and red bands, giant kettle, bulbs
 *   equipment         Field Supply        outfitter: timber porch with a tin roof, false front, crates and barrels
 * The rooms, doors, windows and walls are untouched. solids() is shared with the multiplayer host so the new
 * columns, posts and roof pieces are solid for everyone; dress() and signs() only draw. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityStorefronts=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const IDS=new Set(['clothing','clothing-drip','clothing-luxury','clothing-oddball','diner','equipment']);
/* V5.0: the restaurants draw themselves (restaurants.js); this file hands them over. */const Eat=()=>root.CityRestaurants||(typeof require==='function'?(()=>{try{return require('./restaurants.js');}catch(e){return null;}})():null);const Six=()=>root.CitySixSeven||(typeof require==='function'?(()=>{try{return require('./sixseven.js');}catch(e){return null;}})():null);const has=id=>IDS.has(id)||!!Eat()?.brand(id)||!!Six()?.brand(id);
// The front windows as the building code lays them out: centre and width of each, left to right.
function bays(s){
 const width=(s.w-s.doorWidth)/2,cols=s.type==='clothing'?(s.id==='clothing-drip'?1:s.id==='clothing-oddball'?3:2):Math.max(1,Math.floor(width/5)),bay=width/cols,k=s.id==='clothing-luxury'?.72:.84,out=[];
 for(const from of[-s.w/2,s.doorWidth/2])for(let c=0;c<cols;c++)out.push({u:from+(c+.5)*bay,w:bay*k});
 return out;
}
const porchPosts=W=>[-W/2+.3,-W*.27,-2.5,2.5,W*.27,W/2-.3];
const COLUMNS=[-4.4,-2.1,2.1,4.4];
const pylonX=W=>-W/2-1.6;
// Solid pieces, relative to the building: [key, x, base y, z, width, height, depth, material].
function solids(id,s){const eat=Eat();if(eat?.brand(id))return eat.solids(id,s);const six=Six();if(six?.brand(id))return six.solids(id,s);
 const W=s.w,D=s.d,H=s.h,Z=D/2,dw=s.doorWidth,out=[],add=(k,x,y,z,w,h,d,m)=>out.push([k,x,y,z,w,h,d,m||'masonry']);
 if(id==='clothing'){add('pylon',pylonX(W),0,Z+.3,2.4,8.8,1.2,'metal');for(const e of[-1,1])add('portal'+e,e*(dw/2+.62),0,Z+.6,.6,3.5,1,'metal');}
 else if(id==='clothing-drip')add('tank',W*.3,H+.3,Z-2.2,2.7,5.2,2.7,'wood');
 else if(id==='clothing-luxury'){for(const x of COLUMNS)add('column'+x,x,0,Z+2.5,.6,4.5,.6);add('pediment',0,4.46,Z+1.45,10.4,2.2,3.1);for(const e of[-1,1])add('pot'+e,e*5.6,0,Z+3.4,.7,1.3,.7);for(const f of bays(s))add('hedge'+f.u.toFixed(1),f.u,0,Z+.78,f.w,1.1,.7);}
 else if(id==='clothing-oddball'){for(const e of[-1,1])add('pole'+e,e*(W/2+.1),0,Z+.3,.62,6.2,.62);add('hat',-W*.33,H+.3,Z-3,3.6,4,3.6);}
 else if(id==='diner'){add('pole',W/2-1.5,0,Z+5,.4,8.8,.4,'metal');add('kettle',-8.4,H+.3,D*.25,4.2,5.6,4.2,'metal');}
 else if(id==='equipment'){for(const x of porchPosts(W))add('post'+x.toFixed(1),x,0,Z+3,.26,3.2,.26,'wood');add('crates',-W*.36,0,Z+1.5,1.9,1.6,1.3,'wood');add('barrel',W*.38,0,Z+1.6,.8,1.1,.8,'wood');}
 return out;
}
// ---- drawing ------------------------------------------------------------------------------------------
// api.box(colour,x,y,z,w,h,d,kind,ry) is centred; api.part(shape,colour,x,y,z,w,h,d,rx,ry,rz,kind). Both are local
// to the building. 'roof' parts are a ridge prism standing on y.
function dress(scene,b,s,p,api){const eat=Eat();/* V6.3: the diner keeps the front this file gives it and gets its new room from dining.js */if(s.id==='diner')eat?.dining?.()?.interior?.(scene,b,s,p,api);if(eat?.brand(s.id)){eat.dress(scene,b,s,p,api,bays);return;}const six=Six();if(six?.brand(s.id)){six.dress(scene,b,s,p,api,bays);return;}
 const W=s.w,D=s.d,H=s.h,Z=D/2,dw=s.doorWidth,F=bays(s);
 const B=(c,x,y,z,w,h,d,kind,ry)=>api.box(c,x,y,z,w,h,d,kind||'arch30-concrete',ry||0);
 const P=(shape,c,x,y,z,w,h,d,kind,rx,ry,rz)=>api.part(shape,c,x,y,z,w,h,d,rx||0,ry||0,rz||0,kind||'arch30-metal');
 // A striped cloth awning: y is where it meets the wall; it slopes down and out, with a hanging edge.
 const awning=(x,w,c1,c2,y=3.1,depth=1.5,tilt=.42)=>{const n=Math.max(4,Math.round(w/.5)),sw=w/n,cz=Z+.25+Math.cos(tilt)*depth/2,cy=y-Math.sin(tilt)*depth/2,ez=Z+.25+Math.cos(tilt)*depth,ey=y-Math.sin(tilt)*depth;
  for(let i=0;i<n;i++){const ax=x-w/2+(i+.5)*sw,c=i%2?c2:c1;P('box',c,ax,cy,cz,sw,.05,depth,'matte',tilt);B(c,ax,ey-.1,ez,sw,.2,.04,'matte');}};
 const bulbs=(x0,x1,y,z,step=.55,c='#ffdf9a')=>{const n=Math.max(2,Math.round((x1-x0)/step));for(let i=0;i<=n;i++)P('sphere',c,x0+(x1-x0)*i/n,y,z,.13,.13,.13,'glow');};
 if(s.id==='clothing'){
  const navy='#1f3a5f',orange='#e4572e',white='#f1efe8',grey='#c4c9c6',px=pylonX(W);
  B(white,0,H+1,Z+.12,W+.5,2.4,.7,'arch30-panel');
  for(const e of[-1,1])B(white,e*(W/2+.02),H+1,Z-2.6,.5,2.4,5.6,'arch30-panel');
  B(orange,0,H-.32,Z+.2,W+.6,.3,.9);B(navy,0,H-.6,Z+.2,W+.6,.12,.9);B(navy,0,H+2.26,Z+.12,W+.62,.12,.82);
  for(const e of[-1,1])B(navy,e*(dw/2+.62),1.75,Z+.6,.6,3.5,1);
  B(navy,0,3.66,Z+.6,dw+1.84,.34,1);
  P('box',grey,0,3.3,Z+2.2,dw+5.2,.08,2.3,'arch30-metal',.07);P('box','#bcd6d2',0,3.35,Z+2.2,dw+5,.03,2.1,'arch30-glass',.07);
  for(const e of[-1,1])P('box',navy,e*(dw/2+2.3),3.98,Z+1.75,.05,.05,2.5,'arch30-metal',.52);
  // The pylon stands clear of the corner so it does not block a window; a short beam ties it to the fascia.
  B(navy,px,4.4,Z+.3,2.4,8.8,1.2,'arch30-panel');B(orange,px,8.92,Z+.3,2.52,.24,1.32);B(orange,px,.2,Z+.3,2.52,.4,1.32);B(navy,-W/2-.3,H+1,Z+.3,.6,.5,.5);
  for(const f of F)for(const e of[-1,1]){const x=f.u+e*(f.w/2+.34);if(Math.abs(x)<dw/2+1.2)continue;B(e>0?orange:navy,x,2.05,Z+.5,.12,3.3,.55);}
  B(grey,W*.2,H+.95,-D*.12,W*.38,1.3,D*.3,'arch30-panel');B(orange,W*.2,H+1.6,-D*.12,W*.385,.1,D*.305);
  for(let i=0;i<3;i++){const x=W*.34-i*1.5;P('cylinder',grey,x,H+3.6,Z-.6,.07,5.2,.07);P('box',[orange,white,navy][i],x+.55,H+5.7,Z-.6,1.1,.7,.03,'matte');}
 }else if(s.id==='clothing-drip'){
  const black='#23272b',stone='#cdbb9f',brick=p.wall,tx=W*.3,tz=Z-2.2,bx=-W*.3,bz=Z-1.2;
  B(brick,0,H+1.25,Z,W*.42,2.1,.5,'arch30-brick');B(stone,0,H+2.37,Z,W*.42+.3,.14,.64,'arch30-stone');
  for(const e of[-1,1]){B(brick,e*W*.33,H+.85,Z,W*.26,1.3,.5,'arch30-brick');B(stone,e*W*.33,H+1.57,Z,W*.26+.2,.14,.64,'arch30-stone');B(brick,e*(W/2-1.05),H+.55,Z,2.1,.7,.5,'arch30-brick');B(stone,e*(W/2-1.05),H+.97,Z,2.3,.14,.64,'arch30-stone');}
  B(black,0,3.12,Z+.3,W-.3,.3,.5);for(const x of[-W/2+.3,W/2-.3])B(black,x,1.5,Z+.3,.26,3,.5);for(const e of[-1,1])B(black,e*(dw/2+.55),1.5,Z+.3,.34,3,.5);
  B(black,0,3.4,Z+1.5,dw+3.4,.12,2.3);for(const e of[-1,1])P('box',black,e*(dw/2+1.5),4.08,Z+1.4,.04,.04,2.5,'arch30-metal',.58);
  bulbs(-(dw+3.2)/2,(dw+3.2)/2,3.28,Z+2.58,.5);
  for(const f of F){B('#3a4046',f.u,3.47,Z+.34,f.w+.3,.36,.42);for(let i=0;i<4;i++)B('#2d3237',f.u,3.34+i*.085,Z+.56,f.w+.2,.03,.02);}
  for(const a of[-1,1])for(const c of[-1,1])B(black,tx+a*.95,H+1.15,tz+c*.95,.14,1.8,.14);
  for(const a of[-1,1])P('box',black,tx,H+1.15,tz+a*.95,2.6,.07,.07,'arch30-metal',0,0,.6);
  B(black,tx,H+2.05,tz,2.5,.1,2.5);P('cylinder','#8a6a4b',tx,H+3.5,tz,2.7,2.8,2.7,'arch30-timber');
  for(const y of[H+2.6,H+3.5,H+4.4])P('cylinder',black,tx,y,tz,2.76,.07,2.76);
  P('cone','#4d5357',tx,H+5.4,tz,3.05,1,3.05);
  for(const y of[6.3,2.7])B(black,-W/2+.3,y,Z+1.05,.1,.1,1.2);
  // Billboard frame on the roof, left of the name; the picture itself is one of the signs.
  for(const e of[-1,1]){B(black,bx+e*3.2,H+2.55,bz-.2,.16,4.5,.16);P('box',black,bx+e*3.2,H+1.9,bz-1.15,.1,3.4,.1,'arch30-metal',.55);}
  B(black,bx,H+3.4,bz-.1,7.9,3.1,.1);
  for(let i=0;i<3;i++){B('#9a7b55',W/2-2.2-i*.05,.3+i*.6,Z+1.3,1.1,.6,.9,'arch30-timber');}
 }else if(s.id==='clothing-luxury'){
  const ivory='#e7dfcd',stone='#d9cdb4',gold='#b9975b',green='#2f4a3c',leaf='#3c6b3f',pz=Z+2.5;
  B(stone,0,.03,Z+2.3,11.4,.06,3.6,'arch30-stone');B(stone,0,.085,Z+1.9,10.6,.05,2.6,'arch30-stone');
  for(const x of COLUMNS){B(stone,x,.26,pz,.86,.3,.86,'arch30-stone');P('cylinder',ivory,x,2.34,pz,.56,3.86,.56,'arch30-concrete');B(stone,x,4.36,pz,.8,.2,.8,'arch30-stone');}
  B(ivory,0,4.78,Z+1.45,10.4,.64,3.1);B(gold,0,4.5,Z+3.02,10.44,.05,.05,'arch30-metal');B(gold,0,5.07,Z+3.02,10.44,.05,.05,'arch30-metal');
  // Door surround under the portico: stone pilasters and a flat hood.
  for(const e of[-1,1])B(stone,e*(dw/2+.55),1.65,Z+.28,.4,3.3,.46,'arch30-stone');
  B(ivory,0,3.23,Z+.62,dw+3,.2,1.75);B(gold,0,3.14,Z+1.5,dw+3.04,.04,.04,'arch30-metal');
  P('roof',ivory,0,5.1,Z+1.45,10.9,1.7,3.2,'arch30-concrete');
  // Balustrade round the roof: plinth, rail, balusters and corner piers with urns.
  const rail=(x,z,len,along)=>{const w=along==='x'?len:.3,d=along==='x'?.3:len;B(stone,x,H+.38,z,w,.16,d,'arch30-stone');B(stone,x,H+1.14,z,along==='x'?len:.36,.12,along==='x'?.36:len,'arch30-stone');const n=Math.round(len/.55);for(let i=0;i<n;i++){const t=-len/2+(i+.5)*len/n;P('cylinder',ivory,x+(along==='x'?t:0),H+.76,z+(along==='x'?0:t),.14,.62,.14,'arch30-concrete');}};
  rail(0,Z+.12,W-.5,'x');rail(0,-Z-.12,W-.5,'x');rail(W/2+.12,0,D-.5,'z');rail(-W/2-.12,0,D-.5,'z');
  for(const a of[-1,1])for(const c of[-1,1]){const x=a*(W/2+.12),z=c*(Z+.12);B(stone,x,H+.85,z,.56,1.1,.56,'arch30-stone');P('sphere',ivory,x,H+1.72,z,.52,.6,.52,'arch30-concrete');P('cone',ivory,x,H+2.1,z,.3,.34,.3,'arch30-concrete');}
  for(const f of F){awning(f.u,f.w+.3,green,ivory,3.12,1.45,.44);B(stone,f.u,.3,Z+.78,f.w,.6,.7,'arch30-stone');B(leaf,f.u,.84,Z+.78,f.w-.12,.52,.58,'foliage');}
  for(const e of[-1,1]){const x=e*5.6,z=Z+3.4;P('cylinder',stone,x,.36,z,.7,.72,.7,'arch30-stone');P('cylinder','#5b4634',x,.95,z,.1,.5,.1,'arch30-timber');P('sphere',leaf,x,1.55,z,.95,.95,.95,'foliage');P('sphere',leaf,x,2.2,z,.6,.6,.6,'foliage');
   B('#1f2a2b',e*(dw/2+.55),2.45,Z+.6,.2,.44,.2);P('sphere','#ffe2a6',e*(dw/2+.55),2.45,Z+.66,.16,.3,.16,'glow');}
 }else if(s.id==='clothing-oddball'){
  const C=['#e84a8a','#f6c445','#2bb3a3','#f07f3c','#7a5cc7','#4aa3e0'],cream='#fff3d6',n=9,tw=W/n,m=8,td=D/m;
  for(let i=0;i<n;i++)P('roof',C[i%C.length],-W/2+(i+.5)*tw,H+.25,Z+.05,tw,1.5,.6,'arch30-panel');
  for(const e of[-1,1])for(let i=0;i<m;i++)P('roof',C[(i+2)%C.length],e*(W/2+.05),H+.25,-Z+(i+.5)*td,td,1.5,.6,'arch30-panel',0,Math.PI/2);
  B(cream,0,H-.25,Z+.26,W+.2,.9,.1,'arch30-panel');for(let i=0;i<30;i++)B(C[i%C.length],-W/2+(i+.5)*W/30,H-.25,Z+.33,W/60,.9,.04,'matte');
  for(const e of[-1,1]){const x=e*(W/2+.1);for(let k=0;k<12;k++)P('cylinder',k%2?cream:C[(k>>1)%C.length],x,.25+k*.46,Z+.3,.62,.46,.62,'arch30-panel');P('sphere','#f6c445',x,5.95,Z+.3,.9,.9,.9);}
  // Giant top hat, leaning a little. Every piece sits on the same leaning line.
  {const tilt=.13,hx=-W*.33,hz=Z-3,ax=-Math.sin(tilt),ay=Math.cos(tilt),at=t=>[hx+ax*t,H+.3+ay*t];let q=at(.16);P('cylinder','#3b2a5c',q[0],q[1],hz,5.2,.3,5.2,'arch30-panel',0,0,tilt);q=at(2);P('cylinder','#3b2a5c',q[0],q[1],hz,3.3,3.4,3.3,'arch30-panel',0,0,tilt);q=at(.75);P('cylinder','#f6c445',q[0],q[1],hz,3.38,.62,3.38,'arch30-panel',0,0,tilt);q=at(3.75);P('cylinder','#3b2a5c',q[0],q[1],hz,3.5,.14,3.5,'arch30-panel',0,0,tilt);}
  // Eyes peeking over the crown and a bow tie over the door.
  for(const e of[-1,1]){P('sphere','#fdfdf8',e*1.55,H+1.75,Z+.1,2.5,2.5,1.5,'arch30-panel');P('sphere','#15171a',e*1.55-e*.3,H+1.5,Z+.74,1.05,1.05,.5,'arch30-panel');P('sphere','#fdfdf8',e*1.55-e*.05,H+1.72,Z+.96,.3,.3,.14,'arch30-panel');
   P('cone','#d8362f',e*1.2,4.4,Z+.8,1.9,2.3,.8,'arch30-panel',0,0,e*Math.PI/2);for(const d of[[1.5,.42],[1.75,-.38],[.95,.05]])P('sphere',cream,e*d[0],4.4+d[1],Z+.82+.4*(d[0]-.05)/2.3,.3,.3,.12,'arch30-panel');
   // Candy-striped door posts.
   for(let k=0;k<7;k++)B(k%2?cream:C[(k+(e>0?2:0))%C.length],e*(dw/2+.55),.235+k*.47,Z+.28,.4,.47,.46,'arch30-panel');}
  P('sphere','#a92a25',0,4.4,Z+.86,.85,.85,.7,'arch30-panel');
  B(C[0],0,3.23,Z+.62,dw+3,.2,1.75,'arch30-panel');for(let i=0;i<8;i++)P('sphere',i%2?C[1]:cream,-(dw+3)/2+(i+.5)*(dw+3)/8,3.12,Z+1.5,.7,.5,.2,'arch30-panel');
  for(const f of F)awning(f.u,f.w+.2,C[Math.abs(Math.round(f.u))%C.length],cream,3.1,1.2,.5);
  for(const e of[-1,1])B('#6a5b4a',7.6+e*4.2,H+1.9,Z-1.45,.16,3.4,.16,'arch30-timber');
 }else if(s.id==='diner'){
  const chrome='#c9d0d2',red='#c23a2e',cream='#f1e6cf',copper='#b9703f',dark='#2a2f33',R=1.3;
  // One band of the streamlined fascia: front, two quarter-round corners and the side returns.
  // (V7.6: a thicker band also reaches further in and further back, so no two bands end on the same plane.)
  const band=(c,y,h,grow,kind)=>{const fx=W/2+.26+grow,fz=Z+.51+grow;B(c,0,y,Z+.14,W+.52-2*R,h,.74+2*grow,kind);for(const e of[-1,1]){P('cylinder',c,e*(fx-R-grow),y,fz-R-grow,2*(R+grow),h,2*(R+grow),kind);B(c,e*(W/2-.11),y,(.51-R-grow)/2,.74+2*grow,h,D/2+Z+.51-R+grow,kind);}};
  // (It starts above the roof slab: lower down, the square corners of the walls would poke through the round ones.)
  band(cream,H+1.25,1.9,0,'arch30-panel');band(red,H+.55,.3,.05,'arch30-metal');band(chrome,H+.33,.1,.08,'arch30-metal');band(chrome,H+.78,.06,.06,'arch30-metal');band(chrome,H+2.24,.14,.08,'arch30-metal');
  B(chrome,0,3.14,Z+1.1,W-3,.16,1.7);B(red,0,3.14,Z+1.97,W-2.9,.2,.06);bulbs(-W/2+1.7,W/2-1.7,3,Z+1.9,.6);
  for(const e of[-1,1]){B(red,e*(dw/2+.55),1.65,Z+.28,.36,3.3,.48);B(chrome,e*(dw/2+.55),1.65,Z+.53,.1,3.3,.04);}
  for(let i=0,k=Math.floor(W/.4);i<k;i++){const x=-W/2+(i+.5)*W/k;if(Math.abs(x)<dw/2+.25)continue;for(let r=0;r<2;r++)B((i+r)%2?'#1d1d1f':'#f4f1ea',x,.19+r*.37,Z+.245,W/k,.37,.05,'arch30-panel');}
  for(let i=0;i<5;i++)B(chrome,-W*.35+i*W*.175,H+1,D*.25,.4,1.4,3);
  // The kettle: plinth, body, lid, spout, handle and three puffs of steam.
  // (It stands on a tall drum so it clears the fascia when seen from the street.)
  {const kx=-8.4,kz=D*.25,ky=H+1.3;P('cylinder',dark,kx,H+.8,kz,3.2,1.2,3.2);P('sphere',copper,kx,ky+1.75,kz,4.1,3.3,4.1);P('cylinder','#8f5530',kx,ky+.3,kz,2.9,.3,2.9);
   P('sphere',copper,kx,ky+3.3,kz,2.5,.7,2.5);P('sphere',dark,kx,ky+3.8,kz,.5,.5,.5);
   P('cone',copper,kx+2.35,ky+2.4,kz,.9,2.5,.9,'arch30-metal',0,0,-.95);
   B(dark,kx-2.75,ky+2,kz,.24,1.7,.34);B(dark,kx-2.3,ky+2.8,kz,1,.24,.34);B(dark,kx-2.3,ky+1.2,kz,1,.24,.34);
   for(const q of[[3.7,3.6,.7],[4.2,4.45,.95],[4.05,5.55,1.3]])P('sphere','#f6f6f1',kx+q[0],ky+q[1],kz,q[2],q[2]*.9,q[2],'matte');}
  for(const e of[-1,1])B(dark,6+e*3.9,H+2.9,Z+.06,.16,1.4,.16);
  P('cylinder',dark,W/2-1.5,2.95,Z+5,.36,5.9,.36);P('cylinder',chrome,W/2-1.5,.2,Z+5,.9,.4,.9);P('cylinder',red,W/2-1.5,7.35,Z+5,2.9,.16,2.9,'arch30-metal',0,0,Math.PI/2);
 }else if(s.id==='equipment'){
  const timber='#7b5a3c',dark='#4a3626',tin='#7d8a86',olive='#5b6b47',pz=Z+3;
  B(timber,0,.09,Z+1.75,W+.6,.18,3.3,'arch30-timber');
  for(const x of porchPosts(W)){B(dark,x,1.65,pz,.26,3.1,.26,'arch30-timber');for(const e of[-1,1])if(Math.abs(x+e*.5)<W/2)P('box',dark,x+e*.42,2.82,pz,.1,.95,.12,'arch30-timber',0,0,e*.8);}
  B(dark,0,3.2,pz,W+.6,.24,.3,'arch30-timber');
  P('box',tin,0,3.66,Z+1.78,W+1,.07,3.75,'arch30-panel',.2);
  for(let x=-W/2+.4;x<W/2+.4;x+=1.4)P('box','#6b7774',x,3.7,Z+1.78,.06,.05,3.75,'arch30-metal',.2);
  B(timber,0,H+1.4,Z+.1,W*.62,2.8,.3,'arch30-timber');B(timber,0,H+3.15,Z+.1,W*.34,.7,.3,'arch30-timber');B(dark,0,H+3.56,Z+.1,W*.36,.12,.42,'arch30-timber');
  for(const e of[-1,1]){B(dark,e*W*.31,H+2.86,Z+.1,.3,.12,.42,'arch30-timber');B(dark,e*W*.31,H+1.4,Z+.26,.2,2.8,.06,'arch30-timber');}
  // Crates, a barrel, a canvas roll and lanterns on the porch.
  B('#a07c4e',-W*.36-.45,.58,Z+1.5,1,.8,1.1,'arch30-timber');B('#8f6d43',-W*.36+.5,.48,Z+1.55,.85,.6,.9,'arch30-timber');B('#b08a58',-W*.36-.3,1.33,Z+1.5,.8,.7,.85,'arch30-timber');
  P('cylinder','#6f4e33',W*.38,.73,Z+1.6,.8,1.1,.8,'arch30-timber');for(const y of[.45,1.02])P('cylinder','#3b3f41',W*.38,y,Z+1.6,.84,.06,.84);
  P('cylinder',olive,W*.2,.42,Z+.95,.5,2.4,.5,'matte',0,0,Math.PI/2);
  for(const x of[-2.5,2.5]){B('#2b2e2f',x,2.72,pz-.24,.2,.34,.2);P('sphere','#ffd58a',x,2.7,pz-.24,.14,.24,.14,'glow');}
  // Door posts and a plank shelf over the door, with a pair of antlers on a plaque above it.
  for(const e of[-1,1])B(dark,e*(dw/2+.55),1.65,Z+.28,.34,3.3,.46,'arch30-timber');
  B(dark,0,3.23,Z+.62,dw+3,.2,1.75,'arch30-timber');
  for(const e of[-1,1]){P('cone','#e9e2cf',e*.55,3.72,Z+.42,.16,1,.16,'matte',0,0,-e*1.05);P('cone','#e9e2cf',e*.95,4.02,Z+.42,.12,.6,.12,'matte',0,0,-e*.35);}
  B(timber,0,3.5,Z+.42,.5,.4,.2,'arch30-timber');
 }
}
// ---- signs --------------------------------------------------------------------------------------------
function signs(scene,s){
 if(typeof document==='undefined')return;
 const T=scene.T,W=s.w,D=s.d,H=s.h,Z=D/2,sub=s.signSubtitle||String(s.type||'').toUpperCase();
 const paint=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.textAlign='center';x.textBaseline='middle';draw(x,w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;scene.signTextures.push(t);return t;};
 // o.both: a second copy faces the other way so the words read correctly from behind too; o.gap moves each
 // face that far out from the middle (for a sign with something solid between its two faces).
 const hang=(tex,x,y,z,w,h,ry=0,o={})=>{const nx=Math.sin(ry)*(o.gap||0),nz=Math.cos(ry)*(o.gap||0),mat=new T.MeshBasicMaterial({map:tex,side:o.both?T.FrontSide:T.DoubleSide,transparent:!!o.clear,alphaTest:o.clear?.06:0}),m=new T.Mesh(new T.PlaneGeometry(w,h),mat);m.position.set(s.x+x+nx,s.y+y,s.z+z+nz);m.rotation.set(0,ry,o.lean||0);m.name='storefront-sign:'+s.id;scene.environment.add(m);
  if(o.both){const back=new T.Mesh(m.geometry,mat);back.position.set(s.x+x-nx,s.y+y,s.z+z-nz);back.rotation.set(0,ry+Math.PI,-(o.lean||0));back.name=m.name;scene.environment.add(back);}return m;};
 {const eat=Eat();if(eat?.brand(s.id)){eat.signs(scene,s,paint,hang);return;}} {const six=Six();if(six?.brand(s.id)){six.signs(scene,s,paint,hang);return;}} const glow=(x,c,blur)=>{x.shadowColor=c;x.shadowBlur=blur;};
 if(s.id==='clothing'){
  hang(paint(1536,192,(x,w,h)=>{x.font='italic 900 132px "Arial Black",Impact,sans-serif';const a=x.measureText('PLATDO ').width,b2=x.measureText('BASICS').width,x0=(w-a-b2)/2;x.textAlign='left';x.fillStyle='#1f3a5f';x.fillText('PLATDO',x0,88);x.fillStyle='#e4572e';x.fillText('BASICS',x0+a,88);
   x.fillStyle='#e4572e';for(let i=0;i<3;i++)x.fillRect(x0-150+i*26,56+i*26,110-i*26,12);x.textAlign='center';x.fillStyle='#51606b';x.font='600 24px sans-serif';x.fillText(sub,w/2,172);}),1.6,H+1.02,Z+.49,13.6,1.7,0,{clear:true});
  hang(paint(256,896,(x,w,h)=>{x.fillStyle='#f1efe8';x.font='900 150px "Arial Black",Impact,sans-serif';[...'BASICS'].forEach((ch,i)=>x.fillText(ch,w/2,150+i*122));x.fillStyle='#e4572e';x.fillRect(40,56,w-80,14);x.fillRect(40,h-70,w-80,14);}),pylonX(W),4.9,Z+.3,2,7,0,{clear:true,both:true,gap:.615});
 }else if(s.id==='clothing-drip'){
  hang(paint(1280,256,(x,w,h)=>{x.fillStyle='#101214';x.fillRect(0,0,w,h);x.strokeStyle='#39e6e0';x.lineWidth=5;glow(x,'#39e6e0',18);x.strokeRect(14,14,w-28,h-28);
   x.font='italic 700 138px "Brush Script MT","Segoe Script","Lucida Handwriting",cursive';glow(x,'#ff4fa3',34);x.fillStyle='#ff9acb';x.fillText('Drip District',w/2,112);x.fillStyle='#fff';glow(x,'#ff4fa3',12);x.fillText('Drip District',w/2,112);
   glow(x,'#39e6e0',14);x.fillStyle='#9ff5f1';x.font='600 26px sans-serif';x.fillText(sub,w/2,214);}),0,H+1.25,Z+.27,10,2);
  hang(paint(192,640,(x,w,h)=>{x.fillStyle='#101214';x.fillRect(0,0,w,h);x.font='900 128px Impact,"Arial Black",sans-serif';glow(x,'#39e6e0',26);x.fillStyle='#c8fffb';[...'DRIP'].forEach((ch,i)=>x.fillText(ch,w/2,96+i*128));
   glow(x,'#ff4fa3',22);x.fillStyle='#ff9acb';x.beginPath();x.moveTo(w/2,h-22);x.lineTo(w/2-38,h-74);x.lineTo(w/2+38,h-74);x.closePath();x.fill();}),-W/2+.3,4.5,Z+1.15,1.2,4,Math.PI/2,{both:true,gap:.03});
  hang(paint(1280,480,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#27173d');g.addColorStop(.55,'#b02e6b');g.addColorStop(1,'#f39a3d');x.fillStyle=g;x.fillRect(0,0,w,h);
   const C=['#39e6e0','#ffe14d','#ff4fa3','#7dff8c','#ffffff'];let seed=77;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
   for(let i=0;i<26;i++){x.fillStyle=C[i%5];x.globalAlpha=.55;x.beginPath();x.arc(r()*w,r()*h,14+r()*46,0,7);x.fill();}
   x.globalAlpha=.8;x.strokeStyle='#ffe14d';x.lineWidth=16;x.beginPath();for(let i=0;i<=16;i++)x.lineTo(i*w/16,h-60-(i%2)*46);x.stroke();x.globalAlpha=1;
   x.font='900 300px Impact,"Arial Black",sans-serif';x.lineJoin='round';x.lineWidth=34;x.strokeStyle='#15101f';x.strokeText('DRIP',w/2,h/2+6);x.lineWidth=14;x.strokeStyle='#fff';x.strokeText('DRIP',w/2,h/2+6);x.fillStyle='#39e6e0';x.fillText('DRIP',w/2,h/2+6);
   x.fillStyle='#39e6e0';for(const dx of[-330,-120,150,360]){x.beginPath();x.roundRect(w/2+dx,h/2+110,26,60+((dx*7)%50+50)%50,13);x.fill();}}),-W*.3,H+3.4,Z-1.2-.03,7.6,2.85);
 }else if(s.id==='clothing-luxury'){
  const gold=(x,y0,y1)=>{const g=x.createLinearGradient(0,y0,0,y1);g.addColorStop(0,'#a8833c');g.addColorStop(.5,'#6f5320');g.addColorStop(1,'#96742f');return g;};
  hang(paint(1536,96,(x,w,h)=>{x.fillStyle=gold(x,14,82);x.font='700 74px Georgia,"Times New Roman",serif';try{x.letterSpacing='22px';}catch(e){}x.fillText('PLATDO  LUXURY',w/2,50);}),0,4.79,Z+3.02,9.4,.59,0,{clear:true});
  hang(paint(320,200,(x,w,h)=>{x.strokeStyle=gold(x,20,180);x.lineWidth=5;x.beginPath();x.ellipse(w/2,h/2,84,84,0,0,7);x.stroke();x.lineWidth=2;x.beginPath();x.ellipse(w/2,h/2,72,72,0,0,7);x.stroke();x.fillStyle=gold(x,40,160);x.font='italic 600 92px Georgia,serif';x.fillText('PL',w/2,h/2+6);}),0,5.66,Z+3.07,1.84,1.15,0,{clear:true});
 }else if(s.id==='clothing-oddball'){
  hang(paint(1280,288,(x,w,h)=>{const C=['#e84a8a','#f07f3c','#2bb3a3','#7a5cc7','#4aa3e0','#d8362f','#f6c445'];x.fillStyle='#fff3d6';x.beginPath();x.roundRect(10,10,w-20,h-20,60);x.fill();x.lineWidth=12;x.strokeStyle='#3b2a5c';x.setLineDash([34,22]);x.stroke();x.setLineDash([]);
   x.font='900 150px Impact,"Arial Black",sans-serif';const word='ODDBALL',step=132,x0=w/2-step*3;[...word].forEach((ch,i)=>{x.save();x.translate(x0+i*step,112+(i%2?10:-8));x.rotate((i%2?1:-1)*.12+(i-3)*.015);x.lineWidth=14;x.strokeStyle='#3b2a5c';x.lineJoin='round';x.strokeText(ch,0,0);x.fillStyle=C[i];x.fillText(ch,0,0);x.restore();});
   x.fillStyle='#3b2a5c';x.font='800 54px "Trebuchet MS",sans-serif';try{x.letterSpacing='14px';}catch(e){}x.fillText('OUTFITTERS',w/2,232);}),7.6,H+3.6,Z-1.36,10,2.25,0,{lean:.05});
 }else if(s.id==='diner'){
  hang(paint(1280,352,(x,w,h)=>{x.fillStyle='#7a1f18';x.beginPath();x.roundRect(8,8,w-16,h-16,150);x.fill();x.lineWidth=10;x.strokeStyle='#f1e6cf';glow(x,'#ffd9a0',16);x.stroke();
   x.font='italic 700 76px "Brush Script MT","Segoe Script","Lucida Handwriting",cursive';glow(x,'#ffd9a0',14);x.fillStyle='#fff1d2';x.fillText('The Copper Kettle',w/2,84);
   x.font='900 190px Impact,"Arial Black",sans-serif';try{x.letterSpacing='26px';}catch(e){}glow(x,'#ff5a3c',40);x.fillStyle='#ff8a70';x.fillText('DINER',w/2+13,228);glow(x,'#ff5a3c',10);x.fillStyle='#fff6ea';x.fillText('DINER',w/2+13,228);}),6,H+3.6,Z+.15,9,2.475);
  hang(paint(1280,128,(x,w,h)=>{x.font='italic 700 100px "Brush Script MT","Segoe Script","Lucida Handwriting",cursive';x.fillStyle='#b5322a';x.fillText('The Copper Kettle',w/2,62);}),-4.5,H+1.42,Z+.53,9.6,.96,0,{clear:true});
  hang(paint(384,384,(x,w,h)=>{x.fillStyle='#c23a2e';x.beginPath();x.arc(w/2,h/2,186,0,7);x.fill();x.lineWidth=14;x.strokeStyle='#f1e6cf';x.beginPath();x.arc(w/2,h/2,160,0,7);x.stroke();x.fillStyle='#fff1d2';x.font='900 150px Impact,"Arial Black",sans-serif';x.fillText('EAT',w/2,h/2-12);x.font='800 44px sans-serif';x.fillText('OPEN 24 HRS',w/2,h/2+92);}),W/2-1.5,7.35,Z+5,2.8,2.8,Math.PI/2,{clear:true,both:true,gap:.1});
 }else if(s.id==='equipment'){
  hang(paint(1536,288,(x,w,h)=>{for(let i=0;i<6;i++){x.fillStyle=['#6f5136','#7a5a3c','#6a4c33','#775739','#70523a','#7c5d40'][i];x.fillRect(0,i*h/6,w,h/6+1);}x.strokeStyle='rgba(40,26,16,.5)';x.lineWidth=3;for(let i=1;i<6;i++){x.beginPath();x.moveTo(0,i*h/6);x.lineTo(w,i*h/6);x.stroke();}
   x.fillStyle='#efe3c4';x.font='900 150px Impact,"Arial Black",sans-serif';try{x.letterSpacing='16px';}catch(e){}x.fillText('FIELD SUPPLY',w/2+8,118);
   x.fillStyle='#6f5136';for(let i=0;i<14;i++)x.fillRect(260+i*78,40,7,150);
   x.fillStyle='#d9c79b';x.font='700 34px "Courier New",monospace';try{x.letterSpacing='6px';}catch(e){}x.fillText(sub,w/2,232);
   x.strokeStyle='#efe3c4';x.lineWidth=9;for(const cx of[120,w-120]){x.beginPath();x.arc(cx,h/2,62,0,7);x.stroke();x.beginPath();x.moveTo(cx-88,h/2);x.lineTo(cx+88,h/2);x.moveTo(cx,h/2-88);x.lineTo(cx,h/2+88);x.stroke();}}),0,H+1.42,Z+.27,13.6,2.55);
 }
}
return{has,bays,solids,dress,signs};
});
