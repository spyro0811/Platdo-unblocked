
/* PLATDO City: the drive-throughs (V12.6; V13.4 the worker at the window, and online). Game only.
 * Every fast-food place has a one-way lane round it (restaurants.js driveThru; the world makes the lane solid and
 * drivable). This draws all the lanes as one batch (they are left out of the plain facility drawing), white edge lines
 * and arrows painted on them, a lit menu board on each east wall, a pick-up window on each west wall (a frame, a dark
 * inside, a fixed pane and a pane that slides open) under a little canopy, a DRIVE THRU sign and the gate at the way in.
 * No faces share a plane: the paint is 2 cm above the tarmac, the boards and frames stand off the walls, the two panes are
 * a centimetre apart. No lights are added (the boards glow by themselves).
 * V13.4: the run through the lane is city-drive-run.js (the same file runs on the multiplayer host). This file draws what
 * a run needs on screen: the camera behind the car and from the driver's seat at the board and the window, the menu
 * (city-drive-board.js), the window sliding open, the money and every thing you ordered flying (the real dishes from
 * city-dining-food.js, without their plates; drinks in take-away cups), the splats on your screen and the sounds. Online
 * it draws the same for every player's run near you, from that run's clock, so everyone sees the worker catch the money
 * and the food hit the driver. */
(function(root){'use strict';
if(typeof document==='undefined')return;
let built=null;
const R=()=>root.CityRestaurants,Run=()=>root.CityDriveRun,VEH=()=>root.CityVehicles;
function ground(w,x,z){return (w.terrainHeight?w.terrainHeight(x,z):2.5)+.05;}
function canvasTex(T,draw,wd,ht){const c=document.createElement('canvas');c.width=wd;c.height=ht;draw(c.getContext('2d'),wd,ht);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
function boardTexture(T,b){const L=b.look||{},main=L.frame||'#333',accent=L.accent||'#f6c21c',menu=(b.menu||[]).slice(0,5);
 return canvasTex(T,(g,w,h)=>{g.fillStyle='#14171a';g.fillRect(0,0,w,h);g.fillStyle=main;g.fillRect(0,0,w,92);g.fillStyle=accent;g.fillRect(0,88,w,8);g.fillStyle='#fff';g.font='900 54px "Segoe UI",Arial,sans-serif';g.textAlign='center';g.fillText(String(b.name).toUpperCase(),w/2,64);
  g.textAlign='left';g.font='700 34px "Segoe UI",Arial,sans-serif';menu.forEach((it,i)=>{const y=150+i*62;g.fillStyle='#f4efe6';g.fillText(String(it.name),36,y);g.fillStyle=accent;g.textAlign='right';g.fillText('$'+it.price,w-36,y);g.textAlign='left';g.fillStyle='#ffffff22';g.fillRect(36,y+16,w-72,2);});
  g.fillStyle=accent;g.font='800 30px "Segoe UI",Arial,sans-serif';g.textAlign='center';g.fillText('ORDER HERE',w/2,h-24);},512,512);}
function signTexture(T,text,bg,fg){return canvasTex(T,(g,w,h)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.strokeStyle=fg;g.lineWidth=8;g.strokeRect(6,6,w-12,h-12);g.fillStyle=fg;g.font='900 64px "Segoe UI",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,w/2,h/2+2);},512,128);}
const gateOf=s=>Run()?.gateOf?.(s)||null;
function build(){
 const C=root.PlatdoCity,T=root.THREE,w=C?.sim?.world,scene=C?.scene?.scene;if(!T||!w||!scene)return;const places=(w.services||[]).filter(s=>s.driveThru);if(!places.length)return;
 if(built&&built.world===w&&built.scene===scene)return;drop();
 const group=new T.Group();group.name='city-drive-thrus';const mats=[],geos=[],texs=[];const mat=o=>{const m=new T.MeshStandardMaterial(o);mats.push(m);return m;};
 /* the lanes: one ribbon per strip (top and sides, the way the facility surfaces are drawn), all in one mesh */
 const lv=[],li=[],paint=[],pi=[];
 const ribbon=(pts,width)=>{const base=lv.length/3;for(let i=0;i<pts.length;i++){const p=pts[i],a=pts[Math.max(0,i-1)],c=pts[Math.min(pts.length-1,i+1)],dx=c.x-a.x,dz=c.z-a.z,len=Math.hypot(dx,dz)||1;for(const side of[-1,1]){const v=side*width/2,x=p.x-dz/len*v,z=p.z+dx/len*v;lv.push(x,p.y,z,x,Math.min(2.45,p.y-.22),z);}}
  for(let i=1;i<pts.length;i++){const a=base+(i-1)*4,c=base+i*4;li.push(a,a+2,c+2,a,c+2,c,a,c,c+1,a,c+1,a+1,a+2,a+3,c+3,a+2,c+3,c+2,a+1,c+1,c+3,a+1,c+3,a+3);}};
 const quad=(x0,z0,x1,z1,x2,z2,x3,z3)=>{const base=paint.length/3,y=k=>ground(w,k[0],k[1])+.02;for(const k of[[x0,z0],[x1,z1],[x2,z2],[x3,z3]])paint.push(k[0],y(k),k[1]);pi.push(base,base+2,base+1,base,base+3,base+2);};
 const line=(ax,az,bx,bz,wd)=>{const dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz)||1,n=Math.max(1,Math.ceil(L/4)),ux=dx/L,uz=dz/L,px=-uz*wd/2,pz=ux*wd/2;for(let k=0;k<n;k++){const t0=k/n,t1=(k+1)/n,x0=ax+dx*t0,z0=az+dz*t0,x1=ax+dx*t1,z1=az+dz*t1;quad(x0+px,z0+pz,x0-px,z0-pz,x1-px,z1-pz,x1+px,z1+pz);}};
 const arrow=(x,z,ux,uz)=>{const px=-uz,pz=ux,L=1.6,W=.55;quad(x-ux*L*.5+px*.14,z-uz*L*.5+pz*.14,x-ux*L*.5-px*.14,z-uz*L*.5-pz*.14,x+ux*.1-px*.14,z+uz*.1-pz*.14,x+ux*.1+px*.14,z+uz*.1+pz*.14);
  const b=paint.length/3,y=ground(w,x,z)+.02;paint.push(x+ux*L*.5,y,z+uz*L*.5,x+ux*.05+px*W,y,z+uz*.05+pz*W,x+ux*.05-px*W,y,z+uz*.05-pz*W);pi.push(b,b+1,b+2);};
 for(const s of places){const g=s.driveThru;for(const st of g.strips){const len=Math.hypot(st.b.x-st.a.x,st.b.z-st.a.z),n=Math.max(1,Math.ceil(len/4)),pts=[];for(let k=0;k<=n;k++){const x=st.a.x+(st.b.x-st.a.x)*k/n,z=st.a.z+(st.b.z-st.a.z)*k/n;pts.push({x,y:ground(w,x,z),z});}ribbon(pts,st.w);
   const ux=(st.b.x-st.a.x)/(len||1),uz=(st.b.z-st.a.z)/(len||1),px=-uz,pz=ux,e=st.w/2-.25;/* edge lines, short of the corners so they never cross */line(st.a.x+px*e+ux*.3,st.a.z+pz*e+uz*.3,st.b.x+px*e-ux*.3,st.b.z+pz*e-uz*.3,.14);line(st.a.x-px*e+ux*.3,st.a.z-pz*e+uz*.3,st.b.x-px*e-ux*.3,st.b.z-pz*e-uz*.3,.14);
   for(let d=4;d<len-3;d+=7)arrow(st.a.x+ux*d,st.a.z+uz*d,ux,uz);}}
 const mk=(v,ix,material,name)=>{const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setIndex(ix);geo.computeVertexNormals();geo.computeBoundingSphere();geos.push(geo);const m=new T.Mesh(geo,material);m.name=name;m.receiveShadow=true;group.add(m);return m;};
 mk(lv,li,mat({color:'#3a3e43',roughness:.92}),'drive-lanes');const pm=mk(paint,pi,mat({color:'#f2f0e8',roughness:.7,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),'drive-paint');pm.receiveShadow=false;
 /* menu boards, windows and signs */
 const dark=mat({color:'#1d2124',metalness:.4,roughness:.5}),glass=mat({color:'#9cc7d6',metalness:.2,roughness:.12,emissive:'#29424d',emissiveIntensity:.35}),boxG=new T.BoxGeometry(1,1,1),planeG=new T.PlaneGeometry(1,1);geos.push(boxG,planeG);
 /* V13.4: the window's dark inside, and the pane that slides open (its own batch, so each window's four corners can be moved) */const inside=mat({color:'#2e2925',roughness:.9,emissive:'#1c140e',emissiveIntensity:.4}),slideGlass=mat({color:'#9cc7d6',metalness:.2,roughness:.12,emissive:'#29424d',emissiveIntensity:.35}),slides=new Map();
 /* every piece goes into one batch per material (a few dozen draws for all sixty drive-throughs, not hundreds) */const buckets=new Map(),Mx=new T.Matrix4(),Qx=new T.Quaternion(),Ex=new T.Euler(),Px=new T.Vector3(),Sx=new T.Vector3();
 const add=(geo,m,x,y,z,sx,sy,sz,ry=0)=>{let b=buckets.get(m);if(!b){b={pos:[],nor:[],uv:[],idx:[],shadow:geo===boxG};buckets.set(m,b);}Ex.set(0,ry,0);Qx.setFromEuler(Ex);Mx.compose(Px.set(x,y,z),Qx,Sx.set(sx,sy,sz));const g=geo.clone().applyMatrix4(Mx),p=g.attributes.position.array,n=g.attributes.normal.array,uv=g.attributes.uv.array,base=b.pos.length/3;for(let i=0;i<p.length;i++){b.pos.push(p[i]);b.nor.push(n[i]);}for(let i=0;i<uv.length;i++)b.uv.push(uv[i]);for(const i of g.index.array)b.idx.push(base+i);g.dispose();return base;};
 const accMats=new Map(),accOf=c=>{let m=accMats.get(c);if(!m){m=mat({color:c,roughness:.6});accMats.set(c,m);}return m;};
 const boardMats=new Map(),signMat=(()=>{const t=signTexture(T,'DRIVE THRU →','#1d2124','#ffd23f');texs.push(t);return mat({map:t,emissive:'#ffffff',emissiveMap:t,emissiveIntensity:.45,roughness:.6});})(),pickMat=(()=>{const t=signTexture(T,'PICK UP','#1d2124','#ffffff');texs.push(t);return mat({map:t,emissive:'#ffffff',emissiveMap:t,emissiveIntensity:.45,roughness:.6});})(),gateMat=(()=>{const t=signTexture(T,'DRIVE THRU','#1d2124','#ffd23f');texs.push(t);return mat({map:t,emissive:'#ffffff',emissiveMap:t,emissiveIntensity:.5,roughness:.6});})();
 for(const s of places){const b=R()?.brand?.(s.id);if(!b)continue;const g=s.driveThru,hw=s.w/2,y0=s.y;
  /* V13.3: the owner's own menu picture for this place on the board (city-drive-board.js), else the drawn list */const pic=root.CityDriveBoard?.boardOf?.(b);let bm=boardMats.get(b.id);if(!bm){let t;if(pic){t=new T.TextureLoader().load(pic.src);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;}else t=boardTexture(T,b);texs.push(t);bm=mat({map:t,emissive:'#ffffff',emissiveMap:t,emissiveIntensity:pic?.38:.5,roughness:.55});boardMats.set(b.id,bm);}
  /* the menu board on the east wall: a dark case 3 cm off the wall, the lit face 1 cm in front of the case */
  const fw=pic?1.7*pic.w/pic.h:1.9,mx=s.x+hw+.225+.03+.06;add(boxG,dark,mx,y0+1.75,g.menu.z,.12,1.9,fw+.3);add(planeG,bm,mx+.07,y0+1.8,g.menu.z,fw,1.7,1,Math.PI/2);
  /* V13.4: the pick-up window on the west wall (its outer face at o): top and bottom rails across, the sides between them
   * (a centimetre thinner, so no two faces meet on one plane), the dark inside 1 cm off the wall, the fixed north pane
   * and the south pane 1 cm further out, which slides over it to open the window; the sill, the canopy in the brand's
   * colour and the PICK UP sign */
  const o=s.x-hw-.225,wz=g.window.z,acc=accOf((b.look&&b.look.accent)||'#f6c21c');
  add(boxG,dark,o-.08,y0+2.25,wz,.1,.1,1.9);add(boxG,dark,o-.08,y0+.95,wz,.1,.1,1.9);for(const e of[-1,1])add(boxG,dark,o-.08,y0+1.6,wz+e*.895,.09,1.22,.09);
  add(planeG,inside,o-.01,y0+1.6,wz,1.72,1.22,1,-Math.PI/2);add(planeG,glass,o-.07,y0+1.6,wz-.425,.87,1.22,1,-Math.PI/2);slides.set(s.id,add(planeG,slideGlass,o-.08,y0+1.6,wz+.425,.87,1.22,1,-Math.PI/2));
  add(boxG,dark,o-.25,y0+.88,wz,.34,.08,2.0);add(boxG,acc,o-.58,y0+2.62,wz,1.0,.1,2.4);add(planeG,pickMat,o-.15,y0+2.35,wz,1.4,.35,1,-Math.PI/2);
  /* the DRIVE THRU sign on the front of the east wall, facing the street */
  add(boxG,dark,s.x+hw-.9,y0+3.0,s.z+s.d/2+.225+.05,1.6,.5,.08);add(planeG,signMat,s.x+hw-.9,y0+3.0,s.z+s.d/2+.225+.1,1.5,.38,1,0);
  /* V12.7: the gate over the way in: two posts and a lit DRIVE THRU beam with a stripe in the brand's colour. Drive under it into the lane and the drive-through starts. */
  {const gt=gateOf(s);if(gt){const px=gt.half-.35,gy=ground(w,gt.x,gt.z)-.05;for(const sx of[-1,1])add(boxG,dark,gt.x+sx*px,gy+2.3,gt.z,.28,4.6,.28);add(boxG,dark,gt.x,gy+4.62,gt.z,2*px+.28,.42,.32);add(planeG,gateMat,gt.x,gy+4.62,gt.z+.17,2*px-.3,.34,1,0);add(boxG,acc,gt.x,gy+4.9,gt.z,2*px+.28,.1,.36);}}}
 let slide=null;
 for(const[m,b]of buckets){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.pos,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.nor,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));geo.setIndex(b.idx);geo.computeBoundingSphere();geos.push(geo);const o=new T.Mesh(geo,m);o.castShadow=b.shadow;o.receiveShadow=true;group.add(o);if(m===slideGlass)slide={mesh:o,orig:Float32Array.from(b.pos),at:new Map()};}
 scene.add(group);built={world:w,scene,group,mats,geos,texs,slide,slides};}
function drop(){if(!built)return;try{built.scene.remove(built.group);for(const t of built.texs)t.dispose();for(const g of built.geos)g.dispose();for(const m of built.mats)m.dispose();}catch(_){}built=null;}
/* V13.4: a window's sliding pane, from shut (0) to open (1): the pane moves 82 cm north, over the fixed one */
function setSlide(id,amt){const S=built?.slide,base=built?.slides?.get(id);if(!S||base==null)return;amt=Math.max(0,Math.min(1,+amt||0));if(Math.abs((S.at.get(id)||0)-amt)<.002)return;if(amt>0)S.at.set(id,amt);else S.at.delete(id);
 const p=S.mesh.geometry.attributes.position,a=p.array;for(let i=0;i<4;i++){const j=(base+i)*3+2;a[j]=S.orig[j]-.82*amt;}p.needsUpdate=true;}
/* ---- what flies: the money, the dishes and the drinks --------------------------------------------------------------- */
const geoC=new Map(),matC=new Map();
const Gc=(k,f)=>{let g=geoC.get(k);if(!g){g=f();geoC.set(k,g);}return g;};
const Mc=(c,o)=>{const k=c+(o?'|'+Object.keys(o).join(','):'');let m=matC.get(k);if(!m){m=new (root.THREE).MeshStandardMaterial({color:c,roughness:.6,...(o||{})});matC.set(k,m);}return m;};
function cashModel(){const T=root.THREE,g=new T.Group();g.add(new T.Mesh(Gc('cash',()=>new T.BoxGeometry(.16,.012,.07)),Mc('#3f8f46')));g.add(new T.Mesh(Gc('cashBand',()=>new T.BoxGeometry(.03,.016,.074)),Mc('#f2e7c4')));g.scale.setScalar(1.3);return g;}
/* a take-away cup: soda (flat lid, straw), shake (domed lid, thick straw) or hot (a sleeve and a sip lid); the band shows the drink's colour */
function cupModel(kind,tint,acc){const T=root.THREE,g=new T.Group(),hot=kind==='hot',small=kind==='small',H=hot?.11:small?.075:.16,rt=hot?.042:small?.05:.047,rb=hot?.032:small?.038:.035,taper=y=>rb+(rt-rb)*((y+H/2)/H);
 g.add(new T.Mesh(Gc('cup:'+kind,()=>new T.CylinderGeometry(rt,rb,H,18)),Mc('#f7f4ee')));
 const y0=-H*.18,y1=H*.2,band=new T.Mesh(Gc('cupBand:'+kind,()=>new T.CylinderGeometry(taper(y1)+.002,taper(y0)+.002,y1-y0,18,1,true)),Mc(hot?'#b08a5a':kind==='soda'?tint:acc,{side:T.DoubleSide}));band.position.y=(y0+y1)/2;g.add(band);
 if(kind==='soda'||kind==='shake'){const s2=new T.Mesh(Gc('cupStripe:'+kind,()=>new T.CylinderGeometry(taper(y1+.016)+.0025,taper(y1+.004)+.0025,.012,18,1,true)),Mc(kind==='soda'?acc:tint,{side:T.DoubleSide}));s2.position.y=y1+.01;g.add(s2);}
 if(small)return g;
 if(kind==='shake'){const lid=new T.Mesh(Gc('cupDome',()=>new T.SphereGeometry(rt+.003,16,8,0,Math.PI*2,0,Math.PI/2)),Mc('#f2f4f5',{roughness:.25}));lid.position.y=H/2+.001;g.add(lid);const st=new T.Mesh(Gc('strawFat',()=>new T.CylinderGeometry(.007,.007,.12,8)),Mc(acc));st.position.set(.01,H/2+.08,0);st.rotation.z=-.15;g.add(st);}
 else{const lid=new T.Mesh(Gc('cupLid:'+kind,()=>new T.CylinderGeometry(rt+.003,rt+.003,hot?.014:.01,18)),Mc(hot?'#3a2a20':'#f2f2f2'));lid.position.y=H/2+(hot?.008:.006);g.add(lid);
  if(!hot){const st=new T.Mesh(Gc('straw',()=>new T.CylinderGeometry(.0045,.0045,.11,8)),Mc('#e9e9e9'));st.position.set(.012,H/2+.06,0);st.rotation.z=-.16;g.add(st);}}
 return g;}
/* the real dish (city-dining-food.js) without its plate and its side things: just what you ordered; held at its middle */
const WARE_KEEP=new Set(['fries','bowl','bread','hotdog','sub','bottle']);
const KEEP={burger:m=>m.position.x<.02,sandwich:m=>m.geometry.parameters?.thetaLength<1,nuggets:m=>m.geometry.type==='SphereGeometry',taco:m=>!(m.geometry.parameters?.thetaLength<1),sticks:m=>m.geometry.type==='BoxGeometry',fish:m=>m.geometry.type==='SphereGeometry'&&m.position.x<.02,chicken:m=>m.geometry.type!=='SphereGeometry'||m.scale.x>.035};
function foodModel(it,b){const T=root.THREE,D=root.CityDining,F=root.CityDiningFood,outer=new T.Group(),acc=(b.look&&b.look.accent)||'#d32f2f';let spec=null,colours=[];
 try{D?.fast?.(b);spec=D?.dish?.(it.id)?.dish||null;}catch(_){}
 if(it.drink&&(!spec||spec[0]!=='bottle')){const kind=spec&&spec[0]==='shake'?'shake':spec&&(spec[0]==='mug'||spec[0]==='cup')?'hot':'soda',tint=(spec&&spec[1])||'#3a1c10';outer.add(cupModel(kind,tint,acc));colours=[tint,tint,kind==='shake'?'#fffdf6':'#d9eef5'];}
 else if(spec&&F){const g=F.build(spec),keep=KEEP[spec[0]],wk=WARE_KEEP.has(spec[0]);
  for(const m of g.userData.ware)m.visible=wk&&!m.userData.plate&&(spec[0]==='bottle'||!m.material.transparent);
  for(const m of g.userData.food)m.visible=!keep||keep(m);
  if(spec[0]==='gelato'){const c=cupModel('small','#fffdf6',acc);c.position.y=.06;g.add(c);}
  g.updateMatrixWorld(true);const box=new T.Box3(),cc=new Map();
  for(const m of g.children){if(!m.visible)continue;box.expandByObject(m);if(g.userData.food.includes(m)&&m.material?.color){const hex='#'+m.material.color.getHexString(),a=m.scale.x*m.scale.y+m.scale.y*m.scale.z+m.scale.x*m.scale.z;cc.set(hex,(cc.get(hex)||0)+a);}}
  if(!box.isEmpty()){const c=box.getCenter(new T.Vector3());g.position.set(-c.x,-c.y,-c.z);}
  g.traverse(m=>{if(m.isMesh){m.castShadow=false;m.receiveShadow=false;}});outer.add(g);colours=[...cc.entries()].sort((p,q)=>q[1]-p[1]).slice(0,3).map(e=>e[0]);}
 else{const bun=Mc('#c88a3a'),top=new T.Mesh(Gc('bunTop',()=>new T.SphereGeometry(.07,12,8,0,Math.PI*2,0,Math.PI/2)),bun);top.position.y=.025;outer.add(top);outer.add(new T.Mesh(Gc('patty',()=>new T.CylinderGeometry(.072,.072,.025,12)),Mc('#5a3420')));const bot=new T.Mesh(Gc('bunBot',()=>new T.CylinderGeometry(.068,.062,.025,12)),bun);bot.position.y=-.026;outer.add(bot);colours=['#c88a3a','#5a3420','#6cae3a'];}
 outer.scale.setScalar(1.25);return{g:outer,colours:colours.length?colours:['#c88a3a','#6cae3a','#c81e1e']};}
/* ---- the clock of a run part --------------------------------------------------------------------------------------
 * Alone it is the run's own time. Online the host's time comes about twenty times a second, a little late; this keeps a
 * smooth clock that runs on between updates and eases back to the host's (the worker's moves use it too). */
const clocks=new Map();
function clock(key,t){t=+t||0;if(!root.PlatdoCity?.sim?.onlineRoom)return t;const now=performance.now();let e=clocks.get(key);
 if(!e){e={t,at:now,host:t,hostAt:now};clocks.set(key,e);if(clocks.size>48)clocks.delete(clocks.keys().next().value);return t;}
 if(t!==e.host){e.host=t;e.hostAt=now;}const hostNow=e.host+Math.min(.3,(now-e.hostAt)/1000),pred=e.t+Math.min(.1,(now-e.at)/1000);
 e.t=Math.abs(pred-hostNow)>.3?hostNow:pred+(hostNow-pred)*.15;e.at=now;return e.t;}
/* ---- where things are ----------------------------------------------------------------------------------------------- */
const svcOf=(sim,id)=>sim.world.serviceById?.[id]||(sim.world.services||[]).find(s=>s.id===id)||null;
function seatOf(v){let seat=null;try{seat=VEH()?.getSeatTransform?.(v,0);}catch(_){}return seat||{x:v.x,y:v.y+.5,z:v.z};}
function faceOf(v,eye){const s=seatOf(v);return{x:s.x,y:s.y+(eye?.68:.62),z:s.z};}
/* the worker's hand: the drawn bone when the worker is drawn, else worked out from the moves */
const V3=()=>new (root.THREE).Vector3();
function boneOf(id,side){const rec=root.PlatdoCity?.scene?.meshes?.people?.get?.(id),rig=rec?.mesh?.userData?.rig,h=rig&&rig['hand'+side];return h&&rec.mesh.parent?h:null;}
function boneHand(id,side){const h=boneOf(id,side);if(!h)return null;const p=h.getWorldPosition(V3());return{x:p.x,y:p.y,z:p.z};}
/* held things sit in the worker's palm (children of the hand bone, so they follow it exactly); let go, they go back to the scene where they are */
function hold(g,bone,size){if(g.parent!==bone){bone.add(g);const ws=bone.getWorldScale(V3());g.scale.setScalar(size/(ws.x||1));}g.position.set(0,-.075,.02);/* upright in the world, whichever way the hand is turned */g.quaternion.copy(bone.getWorldQuaternion(new (root.THREE).Quaternion()).invert());}
function letGo(g,sc,size){if(g.parent!==sc){sc.attach(g);g.scale.setScalar(size);}}
function approxHand(sp,Q,side){const f=.3+.42*Q.lean,q=side==='R'?Q.thR:Q.thL;let fw=f,up=1.3;if(side==='R'&&Q.reach>.3){fw=f+.25*Q.reach;up=1.18;}if(q>=0){fw=q<.55?f-.15:f+.15;up=q<.55?1.55+.15*q/.55:1.5;}return{x:sp.x-fw,y:sp.y+up,z:sp.z+(side==='R'?-.2:.2)};}
function driverHand(v,sp){const s=seatOf(v),dx=sp.x-s.x,dz=sp.z-s.z,L=Math.hypot(dx,dz)||1;return{x:s.x+dx/L*.35,y:s.y+.32,z:s.z+dz/L*.35};}
const lerp=(a,b,k)=>a+(b-a)*k;
/* ---- the splats on your screen ---------------------------------------------------------------------------------------- */
function splatEl(){let el=document.getElementById('cityDtSplat');if(!el){el=document.createElement('div');el.id='cityDtSplat';el.style.cssText='position:absolute;inset:0;z-index:7;pointer-events:none;overflow:hidden;transition:opacity 1s';(document.getElementById('cityRoot')||document.body).appendChild(el);}return el;}
function splatAdd(colours,first){const el=splatEl();el.style.opacity='1';let h='';const r=()=>Math.round(38+Math.random()*30);
 for(let i=0;i<5;i++){const c=colours[i%colours.length]||'#c81e1e',x=12+Math.random()*76,y=10+Math.random()*76,s=6+Math.random()*16;h+=`<i style="position:absolute;left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;width:${s.toFixed(1)}vmin;height:${(s*(.65+Math.random()*.6)).toFixed(1)}vmin;transform:translate(-50%,-50%) rotate(${Math.round(Math.random()*180)}deg);border-radius:${r()}% ${r()}% ${r()}% ${r()}%;background:radial-gradient(circle at 38% 32%,rgba(255,255,255,.4),transparent 32%),${c};opacity:.93"></i>`;}
 if(first&&!el.querySelector('b'))h+='<b style="position:absolute;left:50%;top:40%;transform:translate(-50%,-50%) rotate(-8deg);font:900 13vmin/1 Impact,\'Arial Black\',sans-serif;color:#fff200;-webkit-text-stroke:.5vmin #c81e1e;text-shadow:.8vmin .8vmin 0 rgba(0,0,0,.4)">SPLAT!</b>';
 el.insertAdjacentHTML('beforeend',h);}
function splat(on){const el=document.getElementById('cityDtSplat');if(on||!el)return;el.style.opacity='0';setTimeout(()=>{if(el.style.opacity==='0')el.remove();},1100);}
/* bits flying off the driver's head, for everyone else to see (a dozen little blobs in the food's colours, gone in 0.7 s) */
const bursts=[];
function burst(at,colours){const T=root.THREE,sc=root.PlatdoCity?.scene?.scene;if(!T||!sc)return;const g=Gc('blob',()=>new T.SphereGeometry(.022,6,4)),list=[];
 for(let i=0;i<12;i++){const m=new T.Mesh(g,Mc(colours[i%colours.length]||'#c81e1e'));m.position.set(at.x,at.y,at.z);sc.add(m);const a=Math.random()*Math.PI*2,u=Math.random()*1.6+.6;list.push({m,vx:Math.cos(a)*u,vy:Math.random()*1.8+.4,vz:Math.sin(a)*u});}bursts.push({list,age:0,sc});}
function burstTick(dt){for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.age+=dt;for(const p of b.list){p.vy-=9.8*dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;p.m.scale.setScalar(Math.max(.05,1-b.age/.7));}if(b.age>.7){for(const p of b.list)b.sc.remove(p.m);bursts.splice(i,1);}}}
/* ---- the runs on screen --------------------------------------------------------------------------------------------- */
const vis=new Map(),opened=new Set();let menu=null,self=null,ctxLast={};
function makeVis(sim,r,n){const T=root.THREE,sc=root.PlatdoCity?.scene?.scene,b=R()?.brand?.(r.svc);if(!T||!sc||!b)return null;
 const st={k:r.k,sc,cash:cashModel(),items:[],rel:[],cues:new Set(),hit:new Set()};st.cash.visible=false;sc.add(st.cash);
 for(const id of r.items.slice(0,n)){const it=(b.menu||[]).find(m=>m.id===id)||{id,name:id};const f=foodModel(it,b);f.g.visible=false;sc.add(f.g);f.spin=[4+Math.random()*6,3+Math.random()*5,2+Math.random()*4];f.jit=[(Math.random()-.5)*.08,(Math.random()-.5)*.06,(Math.random()-.5)*.08];st.items.push(f);}
 return st;}
function dropVis(k,st){vis.delete(k);for(const o of[st.cash,...st.items.map(i=>i.g)])try{o.parent?.remove(o);}catch(_){}}
function cue(st,key,t,at,fn){if(st.cues.has(key)||t<at)return;st.cues.add(key);if(t-at<.5)try{fn();}catch(_){}}
function windowFrame(sim,q,dt,ctx){const r=q.r,RUN=Run(),s=svcOf(sim,r.svc);if(!RUN||!s?.driveThru||!r.items?.length)return false;
 const n=Math.min(r.items.length,RUN.MAXT),P=RUN.plan(n),t=clock(r.k+':window',r.t),Q=RUN.pose(t,n);setSlide(s.id,Q.open);opened.add(s.id);
 const v=(sim.vehicles||[]).find(x=>x.id===r.vid),cam=root.PlatdoCity?.scene?.camera;if(!v)return true;
 const far=cam?Math.hypot(cam.position.x-s.x,cam.position.z-s.z):0;if(!q.mine&&far>90){const old=vis.get(r.k);if(old)dropVis(r.k,old);return false;}
 let st=vis.get(r.k);if(!st){st=makeVis(sim,r,n);if(!st)return false;vis.set(r.k,st);}
 const sp=RUN.spot(s),staffId='staff-'+r.svc,hand=side=>boneHand(staffId,side)||approxHand(sp,Q,side),face=faceOf(v,q.mine);let tgt=face;
 if(q.mine){const wp=RUN.winPt(s),dx=wp.x-face.x,dy=wp.y-face.y,dz=wp.z-face.z,L=Math.hypot(dx,dy,dz)||1;tgt={x:face.x+dx/L*.22,y:face.y+dy/L*.22-.03,z:face.z+dz/L*.22};}
 /* the money: from your hand into the worker's, held until it goes in the till */
 const c=st.cash;if(t<P.cash||t>=P.till+.05){c.visible=false;letGo(c,st.sc,1.3);}
 else if(t<P.catch){letGo(c,st.sc,1.3);const k=(t-P.cash)/(P.catch-P.cash),from=st.cashFrom||(st.cashFrom=driverHand(v,sp)),to=hand('R');c.visible=true;c.position.set(lerp(from.x,to.x,k),lerp(from.y,to.y,k)+Math.sin(Math.PI*k)*.28,lerp(from.z,to.z,k));c.rotation.set(k*6,k*4,k*2);}
 else{c.visible=true;const b=boneOf(staffId,'R');if(b)hold(c,b,1.3);else{letGo(c,st.sc,1.3);const h=hand('R');c.position.set(h.x,h.y,h.z);c.rotation.set(0,.3,0);}}
 /* each thing: in the throwing hand as the arm goes back, then thrown at the driver's face */
 st.items.forEach((it,i)=>{const g=it.g,w=P.w[i],rl=P.r[i],hi=P.h[i],side=P.arm[i];
  if(t<w||t>=hi||st.hit.has(i)){g.visible=false;letGo(g,st.sc,1.25);}
  else if(t<rl){g.visible=true;const b=boneOf(staffId,side);if(b)hold(g,b,1.25);else{letGo(g,st.sc,1.25);const h=hand(side);g.position.set(h.x,h.y,h.z);g.rotation.set(0,0,0);}}
  else{if(!st.rel[i]){if(g.parent!==st.sc){letGo(g,st.sc,1.25);st.rel[i]={x:g.position.x,y:g.position.y,z:g.position.z};}else st.rel[i]=hand(side);}const from=st.rel[i],k=(t-rl)/(hi-rl),j=it.jit,m=q.mine?.5:1;g.visible=true;g.position.set(lerp(from.x,tgt.x+j[0]*m,k),lerp(from.y,tgt.y+j[1]*m,k)+Math.sin(Math.PI*k)*.12,lerp(from.z,tgt.z+j[2]*m,k));g.rotation.set(k*it.spin[0],k*it.spin[1],k*it.spin[2]);}
  if(t>=hi&&!st.hit.has(i)){st.hit.add(i);g.visible=false;if(t-hi<.6)hitFx(q,it,i,st,ctx,face,far);}});
 cues(q,st,P,t,ctx,far);
 if(q.mine&&t>=P.clean&&!st.cleaned){st.cleaned=true;splat(false);}
 return true;}
function hitFx(q,it,i,st,ctx,face,far){const A=ctx.audio;if(q.mine){splatAdd(it.colours,!st.splatted);st.splatted=true;if(!A?.sample?.('faceSquish',1,0))A?.tone?.(120,.25,.06,'square','sfx',60);return;}
 burst(face,it.colours);const vol=Math.max(0,1-far/45);if(vol>.02)A?.tone?.(140,.16,.035*vol,'square','sfx',70);}
function cues(q,st,P,t,ctx,far){const A=ctx.audio;if(!A)return;const vol=q.mine?1:Math.max(0,1-far/45);if(vol<=.02)return;
 cue(st,'open',t,P.open0,()=>A.tone(300,.32,.02*vol,'triangle','sfx',190));
 cue(st,'cash',t,P.cash,()=>A.tone(700,.22,.03*vol,'sine','sfx',260));
 cue(st,'catch',t,P.catch,()=>A.tone(260,.06,.04*vol,'square','sfx',130));
 cue(st,'till',t,P.till,()=>{if(!A.sample?.('kaChing',vol,0))A.tone(1320,.12,.04*vol,'triangle','sfx',1760);});
 for(let i=0;i<P.n;i++)cue(st,'th'+i,t,P.r[i],()=>A.tone(520+i*25,.24,.026*vol,'sawtooth','sfx',170));
 cue(st,'close',t,P.close0,()=>A.tone(240,.3,.018*vol,'triangle','sfx',320));
 if(q.mine)cue(st,'eat',t,P.eat,()=>{A.sample?.('faceMmm',1,0);if(root.PlatdoCity?.sim?.onlineRoom)ctx.toast?.('You ate the lot.');});}
/* your own run: the camera behind the car, and from your seat at the board and the window */
function look(sim,r,v,dt){const s=svcOf(sim,r.svc);if(!s?.driveThru)return;const fx=Math.sin(v.yaw||0),fz=Math.cos(v.yaw||0),sx=fz,sz=-fx,pov=r.ph==='window'||r.ph==='menu';let eye,tgt;
 if(pov){eye=faceOf(v,true);const g=s.driveThru;tgt=r.ph==='window'?Run().winPt(s):{x:g.menu.x+.1,y:s.y+1.8,z:g.menu.z};}
 else{/* behind the car, on the side away from the building (the lane always has the building on the driver's side) */eye={x:v.x-fx*7.5-sx*.8,y:v.y+3.5,z:v.z-fz*7.5-sz*.8};tgt={x:v.x+fx*2.5,y:v.y+1,z:v.z+fz*2.5};}
 if(!self||self.k!==r.k)self={k:r.k,cam:{eye:{...eye},tgt:{...tgt}},sway:{x:0,y:0},aim:{x:0,y:0}};
 const k=pov?1:Math.min(1,dt*4),E=self.cam.eye,G=self.cam.tgt;for(const a of['x','y','z']){E[a]+=(eye[a]-E[a])*k;G[a]+=(tgt[a]-G[a])*k;}
 let pos={...E},tar={...G};
 /* V13.3: at the menu board the mouse sways the view a little */if(r.ph==='menu'){const a=self.aim,w=self.sway,kk=1-Math.exp(-Math.min(.1,dt||0)*5);w.x+=(a.x-w.x)*kk;w.y+=(a.y-w.y)*kk;const dx=G.x-E.x,dz=G.z-E.z,l=Math.hypot(dx,dz)||1,rx=-dz/l,rz=dx/l;pos={x:E.x+rx*w.x*.1,y:E.y+w.y*.05,z:E.z+rz*w.x*.1};tar={x:G.x+rx*w.x*.5,y:G.y+w.y*.3,z:G.z+rz*w.x*.5};}
 sim.menuCamera={kind:'driveThru',position:pos,target:tar,fov:pov?62:58,hidePlayer:pov};}
/* while your run plays, the map, meters and prompts are hidden */
function sceneClass(on){const r=document.getElementById('cityRoot');if(!r)return;if(!document.getElementById('cityDtStyle')){const st=document.createElement('style');st.id='cityDtStyle';st.textContent='#cityRoot.city-dt-scene #cityHud,#cityRoot.city-dt-scene #cityPrompt{visibility:hidden}';document.head.appendChild(st);}if(r.classList.contains('city-dt-scene')!==!!on)r.classList.toggle('city-dt-scene',!!on);}
function tool(name,params){const f=ctxLast.tool;return f?f(name,params):Promise.reject(Error('Not connected.'));}
/* online: the menu opens on your screen at the board; closing it without paying drives you on */
function onlineMenu(sim,r,ctx){if(r.ph!=='menu')return;const m=menuFor(sim);if(!m)return;
 if(!m.opened){if(!ctx.screen||ctx.screen==='play'){m.opened=true;ctx.open?.(r.svc);}return;}
 if(ctx.screen!=='restaurant'&&!m.paid&&!m.pending&&!m.skipped){m.skipped=true;tool('driveThru',{kind:'skip'}).catch(()=>{});}}
/* every frame, alone and online: ctx {screen, audio, toast, open(serviceId), tool(name, params)} */
function frame(sim,dt,ctx={}){if(!sim||!sim.world)return false;ctxLast=ctx;const r=sim.player?.dtRun||null;let busy=false;
 sceneClass(!!r&&!root.PlatdoCity?.drone);
 if(r){busy=true;const v=(sim.vehicles||[]).find(q=>q.id===r.vid);if(v)look(sim,r,v,dt);if(sim.onlineRoom)onlineMenu(sim,r,ctx);}
 else if(self){if(sim.menuCamera?.kind==='driveThru')sim.menuCamera=null;self=null;splat(false);}
 const list=[];if(r)list.push({r,mine:true});for(const n of sim.npcs||[])if(n.dtRun&&n.dtRun.vid!=null)list.push({r:n.dtRun,mine:false});
 const live=new Set();opened.clear();for(const q of list){if(q.r.ph!=='window')continue;live.add(q.r.k);if(windowFrame(sim,q,dt,ctx))busy=true;}
 for(const[k,st]of[...vis])if(!live.has(k))dropVis(k,st);
 if(built?.slide)for(const id of[...built.slide.at.keys()])if(!opened.has(id))setSlide(id,0);
 if(bursts.length){burstTick(Math.min(.1,dt||0));busy=true;}
 return busy;}
/* alone: the run steps with the City (city-drive-run.js) */
function step(sim,dt){if(!sim||sim.onlineRoom||!(dt>0))return;Run()?.step(sim,dt,[{key:'player',actor:sim.player}],{online:false});}
/* alone: nothing reaches the vehicle while the run drives it (online the host ignores it) */
function filter(sim,input){if(!sim||sim.onlineRoom||!sim.player?.dtRun)return input;return{cameraYaw:input.cameraYaw,cameraPitch:input.cameraPitch,vehicle:{}};}
/* ---- the menu at the board ------------------------------------------------------------------------------------------ */
function menuFor(sim){const r=sim?.player?.dtRun;if(!r||r.ph!=='menu')return null;if(!menu||menu.k!==r.k)menu={k:r.k,id:r.k,service:r.svc,cart:{},paid:0,pending:null,opened:false,skipped:false};return menu;}
function itemsOf(d){const b=R()?.brand?.(d.service);if(!b)return[];const out=[];for(const it of b.menu||[]){const n=d.cart[it.id]||0;for(let i=0;i<n;i++)out.push(it);}return out;}
/* V13.3: while the menu board is on screen the mouse sways the camera a little: aim() takes the pointer as -1..1 across and up the screen */
function aim(sim,x,y){if(menuFor(sim)&&self)self.aim={x:Math.max(-1,Math.min(1,+x||0)),y:Math.max(-1,Math.min(1,+y||0))};}
function menuTick(sim){return!!menuFor(sim);}
/* pay once for everything: alone it is paid here; online the host checks the menu and takes the money (a promise) */
function pay(sim){const d=menuFor(sim);if(!d)return{ok:false,message:'Not at the menu board.'};const list=itemsOf(d);if(!list.length)return{ok:false,message:'Pick something first.'};const total=list.reduce((a,it)=>a+it.price,0);
 if(d.paid)return{ok:true};if(!(sim.profile.wallet>=total))return{ok:false,message:'You need $'+total+' for that.'};
 if(sim.onlineRoom){if(d.pending)return d.pending;const rows=Object.entries(d.cart).filter(e=>e[1]>0);d.pending=tool('driveThru',{kind:'pay',items:rows}).then(res=>{d.paid=total;return{ok:true,message:res?.message||''};},e=>{d.pending=null;return{ok:false,message:String(e?.message||'The payment did not go through.')};});return d.pending;}
 const q=Run().order(sim,sim.player,sim.profile,Object.entries(d.cart).filter(e=>e[1]>0));if(q.ok){d.paid=total;sim.dirty=true;}return q;}
function cart(sim,id,n){const d=menuFor(sim);if(!d||d.paid||d.pending)return;const c=Math.max(0,Math.min(9,(d.cart[id]||0)+n));if(c)d.cart[id]=c;else delete d.cart[id];}
/* drive on without ordering (alone closing the menu is enough) */
function skip(sim){const d=menuFor(sim);if(!d||d.paid||d.pending)return;if(sim.onlineRoom&&!d.skipped){d.skipped=true;tool('driveThru',{kind:'skip'}).catch(()=>{});}}
/* ends your run on the spot (tests, and a new game) */
function finish(sim){sim=sim||root.PlatdoCity?.sim;if(!sim?.player)return;const r=sim.player.dtRun;sim.player.dtRun=null;if(r){const v=(sim.vehicles||[]).find(q=>q.id===r.vid);if(v){v.vx=0;v.vz=0;}}if(sim.menuCamera?.kind==='driveThru')sim.menuCamera=null;self=null;splat(false);sceneClass(false);}
setInterval(()=>{try{build();}catch(e){if(!build.warned){build.warned=true;console.warn('Drive-throughs',e);}}},1500);
root.CityDriveThru={build,get built(){return built;},/* V12.7 */step,filter,menuFor,pay,cart,itemsOf,gateOf,get active(){return root.PlatdoCity?.sim?.player?.dtRun||null;},finish,/* V13.3 */aim,menuTick,/* V13.4 */frame,clock,skip,setSlide};
})(typeof globalThis!=='undefined'?globalThis:this);
