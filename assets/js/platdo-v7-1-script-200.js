
/* V4.2 Eastbank recreation ground: the motocross park and the dressing of the mega ramp.
 * One description of the motocross lap is shared by the ground height, the collisions and the drawing, so they
 * cannot drift apart; the multiplayer server loads this same file for the ground and the collisions.
 * The mega ramp keeps the riding shape it has in the island layout. This file closes its sides with walls
 * (shared) and draws its structure (game only). */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityRecreation=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},TAU=Math.PI*2;
/* V6.0: the park and the mega ramp moved, as one piece and not turned, to the land behind the west hill. Every
 * position in this file is still written as it was at Eastbank. OFF is how far everything moved; the functions
 * other files call (at the end of the file) convert, so inside the file nothing changed. */
const OFF={x:-2215,z:-1530};
// GROUND is the flat land the park stands on, BASE the height of a plain stretch of track, HALF half the track width,
// SKIRT the slope of the dirt at the sides of a jump (rise over run) and REACH how far from the lap the park extends.
const GROUND=2.5,BASE=2.6,HALF=4.5,STEP=1.25,SKIRT=.8,REACH=18;
function hash2(ix,iz){let h=Math.imul(ix,374761393)^Math.imul(iz,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;}
function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);return mix(mix(hash2(ix,iz),hash2(ix+1,iz),u),mix(hash2(ix,iz+1),hash2(ix+1,iz+1),u),v);}
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

// ---- the lap -------------------------------------------------------------------------------------------
// Straights and arcs from the start line at (1300, -40), heading east. A turn is [degrees, radius, bank]; positive
// degrees swing the heading from east toward +z. The plan closes on itself exactly.
const PLAN=[['go',130],['turn',180,25,.30],['go',100],['turn',-180,25,.30],['go',110],['turn',90,40,.16],['go',90],['turn',90,30,.22],['go',80],['turn',90,25,.28],['go',75],['turn',-90,25,.26],['go',40],['turn',90,25,.26],['go',85],['turn',90,25,.28],['go',20]];
// Obstacles by distance from the start line.
//  jump: start, length of the face, length of the flat top, length of the landing, height
//  waves: start, how many, length of one, height (whoops and rollers)
//  hill: start, end, height, length of the climb, length of the descent
const FEATURES=[['jump',96,6,2,7,1.1],
 ['jump',218,5,1.2,5,1.2],['jump',238,5,1,4.5,1.5],['jump',252,4.5,1,5,1.5],['jump',272,7,10,8,1.9],
 ['jump',398,8,30,9,2.2],['waves',452,4,9,.7],
 ['hill',505,690,1.8,42,48],['waves',572,11,5,.55],
 ['jump',708,9,16,11,2.6],
 ['jump',826,5,1,5,1.4],['jump',841,5,1,5,1.4],['waves',858,3,8,.6],
 ['jump',940,5.5,1.5,6,1.3],
 ['jump',1022,7,12,8,1.8],['jump',1066,5,1,6,1.1]];
const NAMES=['start gate and holeshot straight','first-turn bowl','rhythm section with a double','ten-metre tabletop','step-up plateau and drop','rollers','hill sweeper','eleven whoops','finish-line tabletop','second double','off-camber left','long tabletop','final berm'];
function lift(s){let y=0;for(const f of FEATURES){const u=s-f[1];if(u<0)continue;
  if(f[0]==='jump'){const up=f[2],top=f[3],down=f[4];if(u<up){const t=u/up;y+=f[5]*t*t*(1.6-.6*t);}else if(u<up+top)y+=f[5];else if(u<up+top+down)y+=f[5]*(1-smooth((u-up-top)/down));}
  else if(f[0]==='waves'){if(u<f[2]*f[3])y+=f[4]*(.5-.5*Math.cos(TAU*u/f[3]));}
  else if(s<f[2])y+=f[3]*smooth(u/f[4])*smooth((f[2]-s)/f[5]);}
 return y;}
let lap=null;
function track(){
 if(lap)return lap;
 const points=[],turns=[];let x=1300,z=-40,h=0,s=0;
 const add=(bank,turn)=>points.push({x,y:BASE+lift(s),z,bank,distance:s,turn});
 add(0,0);
 for(const step of PLAN){
  if(step[0]==='go'){const n=Math.max(1,Math.round(step[1]/STEP)),d=step[1]/n;for(let i=0;i<n;i++){x+=Math.cos(h)*d;z+=Math.sin(h)*d;s+=d;add(0,0);}}
  else{const total=step[1]*Math.PI/180,r=step[2],length=Math.abs(total)*r,n=Math.max(6,Math.round(length/STEP)),d=total/n,chord=2*r*Math.sin(Math.abs(d)/2),from=s;
   for(let i=0;i<n;i++){x+=Math.cos(h+d/2)*chord;z+=Math.sin(h+d/2)*chord;h+=d;s+=length/n;const u=s-from;add(-Math.sign(total)*step[3]*smooth(u/9)*smooth((length-u)/9),Math.sign(total));}
   turns.push({from,to:s,dir:Math.sign(total),radius:r,bank:step[3]});}}
 const first=points[0],last=points[points.length-1];last.x=first.x;last.z=first.z;last.y=first.y;last.bank=0;
 const grid=new Map();let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;
 for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];x0=Math.min(x0,a.x-REACH);x1=Math.max(x1,a.x+REACH);z0=Math.min(z0,a.z-REACH);z1=Math.max(z1,a.z+REACH);
  for(let ix=Math.floor((Math.min(a.x,b.x)-REACH)/16);ix<=Math.floor((Math.max(a.x,b.x)+REACH)/16);ix++)for(let iz=Math.floor((Math.min(a.z,b.z)-REACH)/16);iz<=Math.floor((Math.max(a.z,b.z)+REACH)/16);iz++){const k=(ix+8192)*16384+(iz+8192);let cell=grid.get(k);if(!cell)grid.set(k,cell=[]);cell.push(i);}}
 return lap={points,turns,length:s,grid,x0,x1,z0,z1};
}
// The nearest piece of track to a spot: distance from the centre line, which side, how far round the lap, and
// the height and bank there. Null when the spot is nowhere near the lap.
function locate(x,z){
 const P=lap||track();if(x<P.x0||x>P.x1||z<P.z0||z>P.z1)return null;const cell=P.grid.get((Math.floor(x/16)+8192)*16384+(Math.floor(z/16)+8192));if(!cell)return null;
 let best=-1,bd=Infinity,bt=0;for(let k=0;k<cell.length;k++){const a=P.points[cell[k]],b=P.points[cell[k]+1],dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),ex=x-a.x-dx*t,ez=z-a.z-dz*t,d2=ex*ex+ez*ez;if(d2<bd){bd=d2;best=cell[k];bt=t;}}
 if(best<0||bd>REACH*REACH)return null;const a=P.points[best],b=P.points[best+1],dx=b.x-a.x,dz=b.z-a.z;
 return{d:Math.sqrt(bd),side:(-(x-a.x)*dz+(z-a.z)*dx)/Math.hypot(dx,dz),s:mix(a.distance,b.distance,bt),y:mix(a.y,b.y,bt),bank:mix(a.bank,b.bank,bt)};
}
// The dirt itself. Under the track it sits just below the riding surface; beside it, it falls away as a bank, so
// a jump can be climbed from any side and nothing drives through it. Flat land is left to the island.
function mound(x,z){const q=locate(x,z);if(!q)return-Infinity;return q.d<=HALF?q.y+q.bank*q.side-.3:q.y+q.bank*HALF*Math.sign(q.side)-.06-(q.d-HALF)*SKIRT;}
// A point on the centre line by distance, and a point beside it (positive v is the side the lap turns toward).
function at(s){const P=lap||track();s=((s%P.length)+P.length)%P.length;let lo=0,hi=P.points.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(P.points[m].distance<=s)lo=m;else hi=m;}
 const a=P.points[lo],b=P.points[hi],t=(s-a.distance)/((b.distance-a.distance)||1),dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;return{x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:mix(a.z,b.z,t),bank:mix(a.bank,b.bank,t),tx:dx/len,tz:dz/len};}
function beside(s,v){const p=at(s),w=Math.abs(v);return{x:p.x-p.tz*v,z:p.z+p.tx*v,y:Math.max(GROUND,w<=HALF?p.y+p.bank*v:p.y+p.bank*HALF*Math.sign(v)-(w-HALF)*SKIRT),top:p.y,yaw:Math.atan2(p.tx,p.tz)};}
function zone(){const P=lap||track();return P;}
// Every patch of ground the park draws finely: the lap, and the gravel the mega ramp stands on.
const PAD={x0:1026,x1:1074,z0:-142,z1:192};
function zones(){return[zone(),PAD];}
// Bare earth round the lap for the drawn ground: strongest at the track edge, broken up, gone by about 14 m out.
function groundTint(x,z){
 if(x>PAD.x0&&x<PAD.x1&&z>PAD.z0&&z<PAD.z1){const w=smooth(Math.min(x-PAD.x0,PAD.x1-x,z-PAD.z0,PAD.z1-z)/9)*(.6+.35*noise(x/5,z/5));return{c:[.63,.61,.56],w};}
 const q=locate(x,z);if(!q||q.d>HALF+14)return null;const w=smooth((HALF+14-q.d)/11)*(.5+.5*noise(x/7+3,z/7-5));return w>.02?{c:[.57+.04*noise(x/3,z/3),.47,.35],w:w*.9}:null;}
// Parked trucks and bikes are the game's own models, built one a frame once the player is near enough to see them.
function update(scene){
 const state=scene.recreationParked,make=root.CityBeach?.parkedModel;if(!state||!make||state.built>=PARKED.length||!root.CityVehicleModels)return;const c=scene.camera.position;if(Math.hypot(c.x-1350-OFF.x,c.z+85-OFF.z)>380)return;
 if(!state.group){state.group=new scene.T.Group();state.group.name='mx-parked';scene.environment.add(state.group);}const[type,x,z,yaw,paint]=PARKED[state.built++];
 try{const model=make(scene,type,paint);if(model){model.position.set(x+OFF.x,BASE,z+OFF.z);model.rotation.y=yaw;model.updateMatrix();model.updateMatrixWorld(true);if(state.built-1<WHEELERS)model.userData.lot='lot-mx-'+(state.built-1);state.group.add(model);}}catch(error){scene.recreationError=String(error&&error.message||error);}
}

// ---- things that stand in the park (shared by the colliders and the drawing) ----------------------------
const STAND={x:1378,z:-50.2,w:34,rows:6},TOWER={x:1332,z:-52,w:4.4,d:3.4},LIGHTS=[[1380,-15],[1380,35],[1415,150],[1295,160],[1283,28],[1512,145]],TOILETS=[0,1,2,3].map(i=>({x:1438+i*1.6,z:-108.5})),FINISH=726,START=14;
// Trucks, vans and bikes left in the paddock: type, x, z, heading and (for the four-wheelers) a paint colour.
const PARKED=[['workhorse',1272,-70,Math.PI/2,0x2f5f8f],['parcel',1286,-104,0,0xe9e6df],['ridge',1300,-104,0,0x23272b],['scrambler',1368,-74,Math.PI,0xc98a2b],['haul',1404,-103,0,0x9c2f2a],['brute',1418,-104,0,0x3f6f55],
 ['stork_vargle_mx',1278.8,-77,.4],['sir_ron_buzz_x',1294.8,-97,2.6],['trailfox',1376.8,-83,.2],['stork_vargle_mx',1394.8,-83,-.3],['tootio_sol_1',1412.8,-95,2.9],['comet-r',1302.8,-75,.5]],WHEELERS=6;
function arches(){return[{id:'start',s:START,half:6.1,height:6.2},{id:'finish',s:FINISH,half:HALF+2.6/SKIRT+.7,height:5.4}].map(a=>{const c=at(a.s);return{...a,legs:[-1,1].map(side=>beside(a.s,side*a.half)),top:c.y+a.height,yaw:Math.atan2(c.tx,c.tz),x:c.x,z:c.z};});}
function megaShape(world){
 /* megaRampLocal is the ramp in this file's own (Eastbank) positions */const ramp=world.megaRampLocal||world.megaRamp,launch=ramp?.launch,landing=ramp?.landing;if(!launch||!landing)return null;
 const low=(points,z0,z1)=>{let y=Infinity;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(b.z<z0||a.z>z1)continue;for(const z of[Math.max(z0,a.z),Math.min(z1,b.z)])y=Math.min(y,mix(a.y,b.y,(z-a.z)/((b.z-a.z)||1)));}return y;};
 return{launch,landing,low,x:launch[0].x,deck:ramp.deck};
}
function install(world,{surface,part,poly,box}){
 const P=track(),lapSurface=surface('dirt-circuit',P.points,HALF*2,'#8a6a48');lapSurface.length=P.length;lapSurface.features=NAMES.slice();
 surface('paddock',[{x:1262,y:BASE,z:-88},{x:1452,y:BASE,z:-88}],48,'#a59a86');
 surface('pit-public-access',poly([{x:1240,y:BASE,z:-195},{x:1240,y:BASE,z:-100},{x:1264,y:BASE,z:-100}]),8,'#8b9391');
 surface('pit-lane-in',[{x:1290,y:BASE,z:-66},{x:1290,y:BASE,z:-43}],6,'#9a8363');surface('pit-lane-out',[{x:1425,y:BASE,z:-43},{x:1425,y:BASE,z:-66}],6,'#9a8363');
 // The pit shelter keeps its place and its parts; the architecture module draws it.
 part('pit-shelter-roof','#6f9c95',1340,5.5,-113,26,.22,14);for(const x of[1328,1352])for(const z of[-119,-107])part('pit-shelter-post-'+x+z,'#58686a',x,3.9,z,.2,3.1,.2);
 const solid=(id,x,z,w,h,d,y=GROUND)=>box('mx:'+id,x,y,z,w,h,d,'masonry',{facility:true});
 for(let i=0;i<STAND.rows;i++)part('mx-stand-'+i,'#b9bfc2',STAND.x,GROUND+.5+i*.42,STAND.z-i*.85,STAND.w,.3,.85);
 solid('stand-back',STAND.x,STAND.z-STAND.rows*.85-.1,STAND.w,GROUND+.5+STAND.rows*.42+.9-GROUND,.2);
 for(const a of arches())a.legs.forEach((leg,i)=>solid('arch-'+a.id+i,leg.x,leg.z,.7,a.top-GROUND,.7));
 solid('tower',TOWER.x,TOWER.z,TOWER.w,6.3,TOWER.d);LIGHTS.forEach(([x,z],i)=>solid('light-'+i,x,z,.34,11,.34));TOILETS.forEach((t,i)=>solid('toilet-'+i,t.x,t.z,1.25,2.35,1.25,BASE));
 /* V4.9: the six trucks and cars are real vehicles now (city-parking.js); only the bikes on their stands stay as solid scenery. */
 PARKED.forEach(([type,x,z,yaw],i)=>{if(i<WHEELERS)return;const bike=i>=WHEELERS,across=Math.abs(Math.sin(yaw))>.7,long=type==='haul'?6.4:5.1,wide=type==='haul'?2.4:2.05;solid('parked-'+i,x,z,bike?1.1:across?long:wide,bike?1.2:type==='haul'?3:1.7,bike?1.1:across?wide:long,BASE);});
 // Mega ramp: the scaffold, the kicker and the landing are closed at the sides and ends.
 const M=megaShape(world);if(M){const wall=(id,x,z,w,h,d)=>{if(h>.6)box('mega:'+id,x,GROUND,z,w,h,d,'masonry',{facility:true});},x=M.x,deckTop=M.deck.y-.5-GROUND;
  wall('deck-back',x,-136.2,29.6,deckTop,.5);for(const side of[-1,1]){wall('deck-side'+side,x+side*14.7,-123,.5,deckTop,26.4);wall('deck-front'+side,x+side*11.5,-110,6.4,deckTop,.5);}
  for(let z=-110,i=0;z<80;z+=6,i++){const h=M.low(M.launch,z,Math.min(80,z+6))-.5-GROUND;for(const side of[-1,1])wall('launch'+side+'-'+i,x+side*8.3,z+3,.5,h,6);}
  wall('lip',x,80.3,16.6,M.low(M.launch,79,80)-.4-GROUND,.5);
  const head=M.landing[0].z;for(let z=head,i=0;z<184;z+=6,i++){const h=M.low(M.landing,z,z+6)-.25-GROUND;for(const side of[-1,1])wall('landing'+side+'-'+i,x+side*13.2,z+3,.4,h,6);}
  wall('landing-front',x,head-.3,26.6,M.low(M.landing,head,head+1)-1.6-GROUND,.5);/* kept 1.6 m below the top edge: a car that arrives a little short still lands on the slope instead of striking the wall */}
 world.recreation={lap:worldLap(),ground:GROUND};
}
// Surfaces and parts this file draws itself, so the plain strip-and-box drawing leaves them alone.
function owns(id){return id==='dirt-circuit'||id==='mega-launch'||id==='mega-landing'||id==='mega-ascent'||id.startsWith('mx-')||id==='mega-top-deck'||id.startsWith('mega-support-')||id.startsWith('mega-deck-');}

// ---- drawing (game only) -------------------------------------------------------------------------------
function render(scene,b){
 const T=scene.T,w=scene.world,detail=scene.modelDetail||5,tmp=new T.Color(),q=new T.Quaternion(),e=new T.Euler(),up=new T.Vector3(0,1,0),dir=new T.Vector3();
 const P=(type,c,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0,kind='matte')=>scene.part(b,type,c,x,y,z,sx,sy,sz,rx,ry,rz,kind);
 // A bar from one point to another.
 const beam=(c,x0,y0,z0,x1,y1,z1,t=.12,kind='metal')=>{dir.set(x1-x0,y1-y0,z1-z0);const len=dir.length();if(len<.05)return;q.setFromUnitVectors(up,dir.divideScalar(len));e.setFromQuaternion(q,'XYZ');P('box',c,(x0+x1)/2,(y0+y1)/2,(z0+z1)/2,t,len,t,e.x,e.y,e.z,kind);};
 const lin=hex=>{tmp.set(hex);return[tmp.r,tmp.g,tmp.b];},srgb=(r,g,bl)=>{tmp.setRGB(r,g,bl,T.SRGBColorSpace);return[tmp.r,tmp.g,tmp.b];};
 // Loose geometry: strips that follow a line of points, walls that hang from one, and flat panels.
 const bag=()=>({p:[],c:[],u:[],x:[],i:[]});
 const sideways=(pts,i)=>{const a=pts[Math.max(0,i-1)],c=pts[Math.min(pts.length-1,i+1)],dx=c.x-a.x,dz=c.z-a.z,len=Math.hypot(dx,dz)||1;return[-dz/len,dx/len];};
 const strip=(G,pts,v0,v1,o={})=>{let run=o.from||0;const base=G.p.length/3;for(let i=0;i<pts.length;i++){const p=pts[i],[nx,nz]=sideways(pts,i);if(i)run+=Math.hypot(p.x-pts[i-1].x,p.z-pts[i-1].z);
   for(const v of[v0,v1]){const y=o.y?o.y(p,v,i):p.y+(p.bank||0)*v+(o.lift||0),c=o.color?o.color(p,v,i,run):o.tint||[1,1,1];G.p.push(p.x+nx*v,y,p.z+nz*v);G.c.push(c[0],c[1],c[2]);G.u.push(v/(o.us||4),run/(o.vs||4));G.x.push(v,p.distance??run);}}
  for(let i=1;i<pts.length;i++){const a=base+(i-1)*2,c=base+i*2;G.i.push(a,a+1,c+1,a,c+1,c);}};
 const wall=(G,pts,v,top,bottom,color,from=0,to=pts.length-1)=>{const base=G.p.length/3;let run=0;for(let i=from;i<=to;i++){const p=pts[i],[nx,nz]=sideways(pts,i),c=typeof color==='function'?color(p,i):color;if(i>from)run+=Math.hypot(p.x-pts[i-1].x,p.z-pts[i-1].z);
   for(const y of[top(p,i),bottom(p,i)]){G.p.push(p.x+nx*v,y,p.z+nz*v);G.c.push(c[0],c[1],c[2]);G.u.push(run/4,y/4);G.x.push(v,run);}}
  for(let i=1;i<=to-from;i++){const a=base+(i-1)*2,c=base+i*2;G.i.push(a,a+1,c+1,a,c+1,c);}};
 const quad=(G,corners,c,uv=[[0,0],[1,0],[1,1],[0,1]])=>{const base=G.p.length/3;corners.forEach((k,i)=>{G.p.push(k[0],k[1],k[2]);G.c.push(c[0],c[1],c[2]);G.u.push(uv[i][0],uv[i][1]);G.x.push(0,0);});G.i.push(base,base+1,base+2,base,base+2,base+3);};
 const mesh=(G,material,name,shadow=true)=>{if(!G.i.length)return null;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(G.p,3));g.setAttribute('color',new T.Float32BufferAttribute(G.c,3));g.setAttribute('uv',new T.Float32BufferAttribute(G.u,2));g.setAttribute('trackUv',new T.Float32BufferAttribute(G.x,2));g.setIndex(G.i);g.computeVertexNormals();g.computeBoundingSphere();g.computeBoundingBox();
  const m=new T.Mesh(g,material);m.name=name;m.receiveShadow=true;m.castShadow=shadow;m.matrixAutoUpdate=false;m.updateMatrix();scene.environment.add(m);scene.trackStatic?.(m,g.boundingBox);return m;};
 const canvas=(width,height,paint)=>{const c=document.createElement('canvas');c.width=width;c.height=height;paint(c.getContext('2d'),width,height);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;scene.signTextures.push(t);return t;};
 const paint=new T.MeshStandardMaterial({vertexColors:true,roughness:.86,metalness:0,side:T.DoubleSide});

 // ---- motocross lap: the dirt ----
 const L=track(),dirt=bag(),R=rng(90417);
 const jumpAt=s=>FEATURES.some(f=>f[0]==='jump'&&s>=f[1]-1&&s<=f[1]+f[2]+.5),padAt=s=>s<START+2||s>L.length-3;
 const earth=(p,v,i)=>{const s=p.distance,n=noise(p.x/5.5,p.z/5.5),m=noise(p.x/19+7,p.z/17-3),turn=p.turn||0,line=-turn*1.4,groove=Math.exp(-((v-line)*(v-line))/3.2),side=Math.abs(v)>HALF;
  if(padAt(s)&&!side){const t=.9+.08*n;return srgb(.66*t,.66*t,.63*t);}
  let r=.56,g=.42,bl=.28;const dry=.9+.2*m+.1*(n-.5);r*=dry;g*=dry;bl*=dry;const dark=1-.2*groove-(jumpAt(s)?.12:0)-(turn?.06:0);r*=dark;g*=dark;bl*=dark*.96;
  if(side){const grass=.22+.3*n;r=mix(r*.94,.47,grass);g=mix(g*.97,.57,grass);bl=mix(bl*.92,.35,grass);}return srgb(r,g,bl);};
 const edgeY=(p,v)=>Math.max(GROUND+.03,p.y+p.bank*v),lanes=[-HALF,-3,-1.5,0,1.5,3,HALF];
 for(let k=1;k<lanes.length;k++)strip(dirt,L.points,lanes[k-1],lanes[k],{y:(p,v)=>edgeY(p,v),color:earth});
 for(const side of[-1,1]){const reach=p=>HALF+Math.max(0,(edgeY(p,side*HALF)-GROUND)/SKIRT)+.25,base=dirt.p.length/3;
  L.points.forEach((p,i)=>{const[nx,nz]=sideways(L.points,i),far=reach(p);for(const[v,y]of[[side*HALF,edgeY(p,side*HALF)],[side*far,GROUND-.05]]){const c=earth(p,Math.abs(v)>HALF+.01?v:side*HALF*.999,i);dirt.p.push(p.x+nx*v,y,p.z+nz*v);dirt.c.push(c[0],c[1],c[2]);dirt.u.push(0,0);dirt.x.push(v,p.distance);}});
  for(let i=1;i<L.points.length;i++){const a=base+(i-1)*2,c=base+i*2;dirt.i.push(a,a+1,c+1,a,c+1,c);}}
 const soil=new T.MeshStandardMaterial({vertexColors:true,roughness:.97,metalness:0,side:T.DoubleSide});
 soil.onBeforeCompile=shader=>{shader.vertexShader='attribute vec2 trackUv;varying vec2 vTrackUv;varying vec3 vTrackWorld;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTrackUv=trackUv;vTrackWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader='varying vec2 vTrackUv;varying vec3 vTrackWorld;\nfloat soilHash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float soilNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(soilHash(i),soilHash(i+vec2(1.,0.)),f.x),mix(soilHash(i+vec2(0.,1.)),soilHash(i+vec2(1.,1.)),f.x),f.y);}\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n{float soil=soilNoise(vTrackWorld.xz*1.9)*.45+soilNoise(vTrackWorld.xz*6.3)*.33+soilNoise(vTrackWorld.xz*21.)*.22;float rut=abs(fract(vTrackUv.x*.85+.4*sin(vTrackUv.y*.19)+.22*sin(vTrackUv.y*.53))-.5)*2.;rut=smoothstep(.5,1.,rut)*(1.-smoothstep(3.4,4.5,abs(vTrackUv.x)));diffuseColor.rgb*=(.84+.3*soil)*(1.-.17*rut);}');};
 soil.customProgramCacheKey=()=>'mx-soil-v2';
 mesh(dirt,soil,'mx-lap');

 // ---- motocross park: what stands round the lap ----
 const BRAND=[['#d33a2c','#f4efe2'],['#1f5fa8','#f4efe2'],['#f2c230','#1b1d1f'],['#1b1d1f','#f2c230'],['#2f8f5b','#f4efe2'],['#f08533','#1b1d1f']];
 const banners=bag(),ROWS=8,row=(x,y,z,yaw,width,height,index)=>{const hx=Math.cos(yaw)*width/2,hz=-Math.sin(yaw)*width/2,nx=Math.sin(yaw)*.03,nz=Math.cos(yaw)*.03,v0=1-(index+1)/ROWS,v1=1-index/ROWS,white=[1,1,1];
  quad(banners,[[x-hx+nx,y-height/2,z-hz+nz],[x+hx+nx,y-height/2,z+hz+nz],[x+hx+nx,y+height/2,z+hz+nz],[x-hx+nx,y+height/2,z-hz+nz]],white,[[0,v0],[1,v0],[1,v1],[0,v1]]);
  quad(banners,[[x+hx-nx,y-height/2,z+hz-nz],[x-hx-nx,y-height/2,z-hz-nz],[x-hx-nx,y+height/2,z-hz-nz],[x+hx-nx,y+height/2,z+hz-nz]],white,[[0,v0],[1,v0],[1,v1],[0,v1]]);};
 const flat=s=>{const p=at(s);return Math.abs(p.y-BASE)<.12&&Math.abs(p.bank)<.02;};
 // A spot on level ground beside the lap: past the foot of whatever bank the track has there, plus a margin.
 const clear=(s,side,extra)=>{const p=at(s),edge=Math.max(GROUND,p.y+p.bank*side*HALF);return beside(s,side*(HALF+(edge-GROUND)/SKIRT+extra));};
 // Stakes and tape along the plain stretches, boards behind them on alternate sides.
 if(detail>2)for(const side of[-1,1]){let last=null;for(let s=20;s<L.length-4;s+=5){if(!flat(s)||!flat(s+2.5)){last=null;continue;}const k=beside(s,side*(HALF+.55));P('box','#e9e4d4',k.x,GROUND+.45,k.z,.05,.9,.05);if(last)beam(Math.floor(s/5)%2?'#f08533':'#f4efe2',last.x,GROUND+.78,last.z,k.x,GROUND+.78,k.z,.05,'cloth');last=k;}}
 for(let s=30,n=0;s<L.length-20;s+=17,n++){const side=n%2?1:-1;if(!flat(s-3)||!flat(s+3)||(s>20&&s<128&&side<0))continue;const k=beside(s,side*(HALF+1.5)),c=BRAND[n%BRAND.length];for(const o of[-1.45,1.45])P('box','#6d7376',k.x+Math.sin(k.yaw)*o,GROUND+.55,k.z+Math.cos(k.yaw)*o,.06,1.1,.06);row(k.x,GROUND+.72,k.z,k.yaw+Math.PI/2,3.2,.74,2+n%4);P('box',c[0],k.x,GROUND+.3,k.z,.04,.08,3.2,0,k.yaw);}
 // Turns: foam blocks on the inside, straw bales and a long board on the outside, tyres at the apex.
 for(const t of L.turns){const mid=(t.from+t.to)/2;
  for(let s=t.from+5,n=0;s<t.to-4;s+=3.6,n++){const k=clear(s,t.dir,.6),c=BRAND[(n+Math.round(t.from))%3];P('box',c[0],k.x,GROUND+.3,k.z,.5,.6,.95,0,k.yaw);P('box',c[1],k.x,GROUND+.3,k.z,.52,.2,.97,0,k.yaw);}
  for(let s=t.from+8,n=0;s<t.to-6;s+=7.5,n++){const k=clear(s,-t.dir,1.3);P('box','#d8bd62',k.x,GROUND+.24,k.z,.5,.48,1.15,0,k.yaw);for(const o of[-.3,.3])P('box','#8a7436',k.x+Math.sin(k.yaw)*o,GROUND+.24,k.z+Math.cos(k.yaw)*o,.52,.5,.04,0,k.yaw);}
  for(const o of[-9,0,9]){const k=clear(mid+o,-t.dir,2.4);for(const p of[-2.2,2.2])P('box','#6d7376',k.x+Math.sin(k.yaw)*p,GROUND+.8,k.z+Math.cos(k.yaw)*p,.07,1.6,.07);row(k.x,GROUND+1.05,k.z,k.yaw+Math.PI/2,4.8,.9,(Math.round(t.from)+o+18)%4+2);}
  for(const o of[-1.2,0,1.2]){const k=clear(mid+o,t.dir,1.5);for(let i=0;i<3;i++)P('cylinder','#1b1d1f',k.x,GROUND+.11+i*.21,k.z,.66,.2,.66);}}
 // Marshals' stands beside the bigger jumps: a small yellow platform, a rail and a flag.
 for(const f of FEATURES){if(f[0]!=='jump'||f[5]<1.4)continue;const s=f[1]+f[2]+f[3]/2,k=clear(s,-1,2.4),c='#e8c14a';for(const sx of[-1,1])for(const sz of[-1,1])P('box','#6d7376',k.x+sx*.55,GROUND+.45,k.z+sz*.55,.07,.9,.07);P('box',c,k.x,GROUND+.93,k.z,1.3,.07,1.3);for(const sx of[-1,1])P('box',c,k.x+sx*.62,GROUND+1.45,k.z,.05,1,.05);P('box',c,k.x,GROUND+1.95,k.z,1.3,.05,.05);P('cylinder','#d9d6cc',k.x+.6,GROUND+2.3,k.z+.6,.04,2.7,.04);P('box','#f2c230',k.x+.6,GROUND+3.4,k.z+.95,.02,.45,.7,0,0,0,'cloth');}
 // Start: concrete pad, the gate folded forward, a log behind the bikes, and the arch.
 {const g=at(9),yaw=Math.atan2(g.tx,g.tz);P('box','#8f979a',g.x,BASE+.05,g.z,8.8,.06,.1,0,yaw);for(let i=-8;i<=8;i++){const k=beside(9.35,i*.52);P('box','#aeb5b8',k.x,BASE+.035,k.z,.04,.03,.7,0,yaw);}}
 for(const a of arches()){const[l0,l1]=a.legs,chk=a.id==='finish';for(const leg of a.legs)for(const o of[-.3,.3]){beam('#c9ced0',leg.x+o,GROUND,leg.z+o,leg.x+o,a.top,leg.z+o,.09);beam('#c9ced0',leg.x+o,GROUND,leg.z-o,leg.x+o,a.top,leg.z-o,.09);}
  for(const leg of a.legs)for(let y=GROUND+.8;y<a.top;y+=1.1)P('box','#c9ced0',leg.x,y,leg.z,.66,.06,.66);
  for(const y of[a.top,a.top-.9])for(const o of[-.3,.3])beam('#c9ced0',l0.x+Math.sin(a.yaw)*o,y,l0.z+Math.cos(a.yaw)*o,l1.x+Math.sin(a.yaw)*o,y,l1.z+Math.cos(a.yaw)*o,.09);
  const span=Math.hypot(l1.x-l0.x,l1.z-l0.z);for(let i=0;i<=Math.round(span/1.2);i++){const t=i/Math.round(span/1.2),x=mix(l0.x,l1.x,t),z=mix(l0.z,l1.z,t);beam('#c9ced0',x,a.top-.9,z,x,a.top,z,.05);}
  row(a.x,a.top-.45,a.z,a.yaw,Math.min(span-1.6,chk?12:10.4),chk?1.1:1.3,chk?6:0);if(!chk)for(const side of[-1,1]){const k=beside(a.s,side*(a.half-.05));row(k.x,GROUND+2.2,k.z,a.yaw,.9,3.4,7);}}
 // Timing tower: a cabin on a steel frame with a stair, speakers and a flag.
 {const x=TOWER.x,z=TOWER.z,hw=TOWER.w/2,hd=TOWER.d/2,deck=GROUND+3;for(const sx of[-1,1])for(const sz of[-1,1]){P('box','#59646a',x+sx*(hw-.1),GROUND+1.5,z+sz*(hd-.1),.16,3,.16);}for(const sz of[-1,1])beam('#59646a',x-hw+.1,GROUND+.2,z+sz*(hd-.1),x+hw-.1,deck-.2,z+sz*(hd-.1),.07);
  P('box','#3f4a4f',x,deck,z,TOWER.w+.4,.16,TOWER.d+.4);P('box','#ece7da',x,deck+1.35,z,TOWER.w,2.5,TOWER.d);P('box','#2f6fb5',x,deck+.5,z,TOWER.w+.03,.5,TOWER.d+.03);P('box','#9fc3d6',x,deck+1.65,z+hd+.01,TOWER.w-.5,.95,.04,0,0,0,'glass');P('box','#9fc3d6',x+hw+.01,deck+1.65,z,.04,.95,TOWER.d-.6,0,0,0,'glass');
  P('box','#3f4a4f',x,deck+2.72,z,TOWER.w+1,.14,TOWER.d+1);row(x,deck+3.25,z+hd+.45,0,TOWER.w,.8,0);for(const sx of[-1,1])P('cone','#d9d6cc',x+sx*1.5,deck+3.05,z+hd+.75,.5,.6,.5,-Math.PI/2);
  P('box','#59646a',x-hw-.75,GROUND+1.5,z,.9,.08,3.6,.95);for(const o of[-.42,.42])P('box','#e8c14a',x-hw-.75+o,GROUND+2.3,z,.05,.05,3.9,.95);P('cylinder','#d9d6cc',x+hw-.2,deck+4.6,z-hd+.2,.06,3.8,.06);P('box','#d33a2c',x+hw-.2,deck+6.1,z-hd+.75,.02,.6,1,0,0,0,'cloth');}
 // Grandstand and the fence in front of it.
 {const x=STAND.x,hw=STAND.w/2;for(let i=0;i<STAND.rows;i++){const y=GROUND+.5+i*.42,z=STAND.z-i*.85;P('box','#c5cacc',x,y+.13,z-.1,STAND.w,.05,.42,0,0,0,'metal');P('box','#8e969a',x,y-.02,z+.2,STAND.w,.04,.4);}
  for(let k=0;k<=6;k++){const fx=x-hw+k*STAND.w/6;beam('#6d7376',fx,GROUND,STAND.z+.3,fx,GROUND+.5,STAND.z+.3,.08);beam('#6d7376',fx,GROUND,STAND.z-STAND.rows*.85,fx,GROUND+.5+STAND.rows*.42+.9,STAND.z-STAND.rows*.85,.08);beam('#6d7376',fx,GROUND+.4,STAND.z+.3,fx,GROUND+.4+STAND.rows*.42,STAND.z-STAND.rows*.85,.07);}
  for(const y of[.6,1])P('box','#6d7376',x,GROUND+.5+STAND.rows*.42+y*.9-.1,STAND.z-STAND.rows*.85,STAND.w,.05,.05);for(const sx of[-1,1])P('box','#e8c14a',x+sx*hw,GROUND+.9+STAND.rows*.21,STAND.z-STAND.rows*.42,.05,.05,STAND.rows*.95,.46);
  for(let fx=1296;fx<=1432;fx+=3)P('box','#8e969a',fx,GROUND+.6,-46.4,.06,1.2,.06);for(const y of[.35,.8,1.18])P('box','#8e969a',1364,GROUND+y,-46.4,136,.04,.04);for(let n=0;n<9;n++)row(1304+n*15,GROUND+.62,-46.33,0,5.6,.8,2+n%4);}
 // Floodlights round the lap.
 for(const[x,z]of LIGHTS){P('cylinder','#59646a',x,GROUND+5.5,z,.3,11,.3);P('box','#59646a',x,GROUND+10.9,z,2.4,.12,.3);for(const o of[-.85,0,.85])P('box','#f6f1dc',x+o,GROUND+10.6,z,.6,.4,.26,0,0,0,'glow');}
 // Paddock: pop-up tents, toilets, a water tank, tool chests, fuel cans, tyres and a bike stand or two.
 {const tents=[[1276,-78,'#d33a2c'],[1292,-98,'#1f5fa8'],[1374,-84,'#f2c230'],[1392,-84,'#1b1d1f'],[1410,-96,'#2f8f5b'],[1300,-76,'#f4efe2']];
  for(const[x,z,c]of tents){for(const sx of[-1,1])for(const sz of[-1,1])P('box','#c9ced0',x+sx*1.45,BASE+1.1,z+sz*1.45,.05,2.2,.05);P('box',c,x,BASE+2.26,z,3.1,.28,3.1,0,0,0,'cloth');P('cone',c,x,BASE+2.78,z,3.9,.8,3.9,0,Math.PI/4,0,'cloth');P('box','#6d7376',x+.6,BASE+.42,z-.5,1.5,.05,.7);for(const o of[-.6,.6])P('box','#6d7376',x+.6+o,BASE+.2,z-.5,.05,.4,.6);P('box','#b3272b',x-.7,BASE+.45,z+.6,.8,.9,.45);P('box','#1b1d1f',x-.7,BASE+.93,z+.6,.84,.06,.49);}
  for(const t of TOILETS){P('box','#2f6fb5',t.x,BASE+1.1,t.z,1.2,2.2,1.2);P('box','#e9e6da',t.x,BASE+2.26,t.z,1.3,.12,1.3);P('box','#e9e6da',t.x,BASE+1.15,t.z+.61,.7,1.7,.03);P('box','#1b1d1f',t.x+.2,BASE+1.2,t.z+.63,.06,.16,.03);}
  P('cylinder','#d9d6cc',1432,BASE+1.5,-72,1.9,2.2,1.9,0,0,Math.PI/2);for(const o of[-.7,.7])P('box','#59646a',1432+o,BASE+.4,-72,.14,.8,1.7);P('box','#2f6fb5',1432,BASE+1.5,-71.03,2.24,.5,.03);
  for(let i=0;i<7;i++){const x=1310+R()*120,z=-104+R()*34;if(Math.abs(x-1340)<16&&z<-104)continue;for(let k=0;k<2+Math.floor(R()*3);k++)P('cylinder','#1b1d1f',x,BASE+.1+k*.2,z,.62,.19,.62);P('box',R()<.5?'#d33a2c':'#e8c14a',x+.9,BASE+.2,z+.3,.26,.38,.2);}
  // The way in: an arch over the access road.
  for(const sx of[-1,1])for(const o of[-.25,.25]){beam('#c9ced0',1240+sx*5+o,GROUND,-132,1240+sx*5+o,GROUND+5.6,-132,.09);}for(const y of[5.6,4.7])beam('#c9ced0',1235,GROUND+y,-132,1245,GROUND+y,-132,.1);row(1240,GROUND+5.15,-132,0,9.2,.82,0);}
 // Work in progress in the infield: spoil heaps and a small digger.
 for(const[x,z,r]of[[1400,-12,3.4],[1408,-16,2.2],[1396,128,3],[1404,134,2],[1290,180,2.6]])P('sphere','#8a6a48',x,GROUND+r*.18,z,r*2,r*.9,r*2);
 {const x=1392,z=-14,c='#e8a531';P('box','#2b3033',x,GROUND+.3,z-.75,2.6,.55,.5);P('box','#2b3033',x,GROUND+.3,z+.75,2.6,.55,.5);P('box',c,x,GROUND+.95,z,2.2,.8,1.7);P('box',c,x-.35,GROUND+1.9,z-.3,1.1,1.1,1);P('box','#9fc3d6',x-.35,GROUND+2,z+.21,.9,.7,.03,0,0,0,'glass');beam(c,x+.8,GROUND+1.3,z+.3,x+2.6,GROUND+2.9,z+.3,.26,'matte');beam(c,x+2.6,GROUND+2.9,z+.3,x+3.9,GROUND+1.2,z+.3,.2,'matte');P('box','#3f4a4f',x+4,GROUND+.9,z+.3,.7,.6,.8,0,0,.5);}

 // ---- banners: one sheet of eight designs ----
 const sheet=canvas(1024,1024,(c,W,H)=>{const rh=H/ROWS,text=(i,bg,fg,words,font='900 86px Arial Black, Arial, sans-serif',edge)=>{c.fillStyle=bg;c.fillRect(0,i*rh,W,rh);if(edge){c.fillStyle=edge;c.fillRect(0,i*rh,W,10);c.fillRect(0,(i+1)*rh-10,W,10);}c.fillStyle=fg;c.font=font;c.textAlign='center';c.textBaseline='middle';c.fillText(words,W/2,i*rh+rh/2+4,W-60);};
  text(0,'#16343b','#f2e6c2','NORTHRIDGE MX PARK','900 84px Arial Black, Arial, sans-serif','#e8a531');text(1,'#c8281f','#ffffff','MEGA RAMP','900 100px Arial Black, Arial, sans-serif','#ffffff');text(2,'#f2c230','#17191b','PLATDO MOTO');text(3,'#1f5fa8','#ffffff','RIDGE FUEL');text(4,'#17191b','#f08533','KICKER TYRES');text(5,'#f4efe2','#c8281f','BIG AIR SUSPENSION','900 70px Arial Black, Arial, sans-serif');
  for(let k=0;k<32;k++)for(let j=0;j<4;j++){c.fillStyle=(k+j)%2?'#f6f4ee':'#141516';c.fillRect(k*32,6*rh+j*32,32,32);}
  c.fillStyle='#f4efe2';c.fillRect(0,7*rh,W,rh);c.fillStyle='#c8281f';for(let k=0;k<8;k++)c.fillRect(k*128,7*rh,64,rh);});
 sheet.wrapS=sheet.wrapT=T.ClampToEdgeWrapping;

 // ---- mega ramp ----
 const M=megaShape(w);if(M){
  const x=M.x,launch=M.launch,landing=M.landing,ascent=w.megaRampLocal?.ascentPoints||w.facilitySurfaces.find(s=>s.id==='mega-ascent')?.points||[],deckY=M.deck.y,steel='#a9b1b4',dark='#59646a';
  const ply=canvas(512,512,(c,W,H)=>{c.fillStyle='#c7a474';c.fillRect(0,0,W,H);const Q=rng(5521);for(let i=0;i<900;i++){const y=Q()*H,x0=Q()*W,l=30+Q()*150;c.strokeStyle=`rgba(${Q()<.5?'92,62,30':'236,208,160'},${.05+Q()*.1})`;c.lineWidth=1+Q()*1.5;c.beginPath();c.moveTo(x0,y);c.lineTo(x0+l,y+(Q()-.5)*3);c.stroke();}
   for(let r=0;r<2;r++)for(let k=0;k<4;k++){const px=k*128+(r?64:0),py=r*256;c.fillStyle=`rgba(${Q()<.5?'70,45,20':'255,235,200'},${.03+Q()*.07})`;c.fillRect(px,py,128,256);c.strokeStyle='rgba(60,40,22,.75)';c.lineWidth=3;c.strokeRect(px,py,128,256);if(px+128>W)c.strokeRect(px-W,py,128,256);c.fillStyle='rgba(50,40,30,.8)';for(const sx of[10,64,118])for(const sy of[12,128,244]){c.beginPath();c.arc((px+sx)%W,py+sy,2.2,0,TAU);c.fill();}}});
  const wood=new T.MeshStandardMaterial({map:ply,vertexColors:true,roughness:.62,metalness:0,side:T.DoubleSide}),boards=bag(),panels=bag();
  const red=lin('#c8281f'),white=lin('#f1eee6'),grey=lin('#8f979a'),tar=lin('#4f565a'),blue=lin('#1f5fa8'),yellow=lin('#e8c14a');
  // Riding surface of the roll-in and the kicker: plywood sheets, red edges, a dashed centre line, kick boards.
  strip(boards,launch,-8,8,{us:4,vs:4});
  for(const side of[-1,1]){strip(panels,launch,side*8,side*7.55,{lift:.015,tint:red});wall(panels,launch,side*8,(p,i)=>p.y+.55,p=>p.y-.2,(p,i)=>Math.floor(i/3)%2?red:white);}
  for(let i=2;i+3<launch.length;i+=6)strip(panels,launch.slice(i,i+4),-.22,.22,{lift:.015,tint:white});
  for(const[i,c]of[[launch.length-5,white],[launch.length-3,red]])strip(panels,launch.slice(i,i+2),-7.5,7.5,{lift:.016,tint:c});
  // Kicker sides and the wall under the lip: closed panels, striped at the top.
  const firstLow=launch.findIndex(p=>p.y-GROUND<1.6&&p.z>-60);
  for(const side of[-1,1]){wall(boards,launch,side*8.05,p=>p.y-.2,()=>GROUND-.05,[1,1,1],firstLow);for(let i=firstLow;i<launch.length;i+=2){const p=launch[i];if(p.y-GROUND>1.1)P('box',dark,x+side*8.13,(p.y-.2+GROUND)/2,p.z,.1,p.y-.2-GROUND,.12,0,0,0,'metal');}[[58,2],[66,3],[74,4]].forEach(([z,index])=>row(x+side*8.2,GROUND+1.15,z,side*Math.PI/2,6.6,1,index));wall(panels,launch,side*8.07,p=>p.y-.2,p=>Math.max(GROUND,p.y-.75),(p,i)=>Math.floor(p.z/4)%2?blue:white,firstLow);}
  const lip=launch[launch.length-1];quad(boards,[[x-8.05,GROUND-.05,lip.z+.02],[x+8.05,GROUND-.05,lip.z+.02],[x+8.05,lip.y-.2,lip.z+.02],[x-8.05,lip.y-.2,lip.z+.02]],[1,1,1],[[0,0],[4,0],[4,1.3],[0,1.3]]);for(let px=x-8;px<=x+8;px+=4)P('box',dark,px,(lip.y-.2+GROUND)/2,lip.z+.07,.12,lip.y-.2-GROUND,.1,0,0,0,'metal');row(x,GROUND+(lip.y-GROUND)/2,lip.z+.06,0,12.5,1.55,1);
  // Scaffold under the roll-in and the top deck.
  const post=(px,pz,top)=>beam(steel,px,GROUND,pz,px,top,pz,.13),under=z=>{for(let i=1;i<launch.length;i++)if(launch[i].z>=z){const a=launch[i-1],c=launch[i];return mix(a.y,c.y,(z-a.z)/(c.z-a.z))-.25;}return GROUND;};
  const frame=(cols,stations,topAt,levels=4)=>{stations.forEach((z,k)=>{const top=topAt(z);if(top-GROUND<1.4)return;for(const px of cols)post(px,z,top);for(let y=GROUND+levels;y<top-.7;y+=levels)beam(steel,cols[0],y,z,cols[cols.length-1],y,z,.09);beam(steel,cols[0],top,z,cols[cols.length-1],top,z,.11);
    const next=stations[k+1];if(next===undefined)return;const nt=topAt(next);if(nt-GROUND<1.4)return;const low=Math.min(top,nt);for(const px of cols){beam(steel,px,top,z,px,nt,next,.11);for(let y=GROUND+levels;y<low-.7;y+=levels)beam(steel,px,y,z,px,y,next,.08);}
    if(detail>2)for(const px of[cols[0],cols[cols.length-1]])for(let y=GROUND,n=0;y<low-1.2;y+=levels,n++){const y1=Math.min(y+levels,low);if((n+k)%2)beam(steel,px,y,z,px,y1,next,.07);else beam(steel,px,y1,z,px,y,next,.07);}});};
  const bays=[];for(let z=-104;z<=-2;z+=6)bays.push(z);frame([x-7.6,x,x+7.6],bays,under);
  const rows=[-135.5,-129.2,-122.9,-116.6,-110.3];frame([x-14.5,x-7.25,x,x+7.25,x+14.5],rows,()=>deckY-.3);
  if(detail>2)for(const z of[rows[0],rows[rows.length-1]])for(let k=0;k<4;k++)for(let y=GROUND,n=0;y<deckY-1.6;y+=4,n++){const x0=x-14.5+k*7.25,x1=x0+7.25,y1=Math.min(y+4,deckY-.3);if(z===rows[rows.length-1]&&k>0&&k<3&&y>GROUND+20)continue;if((n+k)%2)beam(steel,x0,y,z,x1,y1,z,.07);else beam(steel,x0,y1,z,x1,y,z,.07);}
  // Top deck: boards, rails, a start arch, flags and lamps.
  P('box','#b08d5f',x,deckY-.15,-123,30,.3,26);for(let k=0;k<13;k++)P('box','#8e6f48',x-14.4+k*2.4,deckY+.004,-123,.05,.012,26);
  for(const side of[-1,1]){for(let z=-136;z<=-110;z+=2.6)P('box','#e8c14a',x+side*15,deckY+.55,z,.07,1.1,.07,0,0,0,'metal');for(const y of[.55,1.08])P('box','#e8c14a',x+side*15,deckY+y,-123,.06,.06,26,0,0,0,'metal');P('box','#3f4a4f',x+side*15,deckY+.09,-123,.05,.18,26);}
  for(let px=x-15;px<=x+15;px+=2.5)P('box','#e8c14a',px,deckY+.55,-136,.07,1.1,.07,0,0,0,'metal');for(const y of[.55,1.08])P('box','#e8c14a',x,deckY+y,-136,30,.06,.06,0,0,0,'metal');
  for(let px=x+8.4;px<=x+15;px+=2.2)P('box','#e8c14a',px,deckY+.55,-110,.07,1.1,.07,0,0,0,'metal');for(const y of[.55,1.08])P('box','#e8c14a',x+11.7,deckY+y,-110,6.6,.06,.06,0,0,0,'metal');
  for(const side of[-1,1])for(const o of[-.25,.25]){beam('#c9ced0',x+side*8.6+o,deckY,-116.5,x+side*8.6+o,deckY+6.2,-116.5,.09);}for(const y of[6.2,5.2])beam('#c9ced0',x-8.6,deckY+y,-116.5,x+8.6,deckY+y,-116.5,.1);row(x,deckY+5.7,-116.5,0,15.5,1,1);
  for(const[sx,sz,c]of[[-1,-136,'#c8281f'],[1,-136,'#1f5fa8'],[-1,-110.5,'#f2c230'],[1,-110.5,'#c8281f']]){P('cylinder','#d9d6cc',x+sx*15,deckY+3.2,sz,.07,6.4,.07);P('box',c,x+sx*15,deckY+5.7,sz+.85,.02,.9,1.6,0,0,0,'cloth');}
  for(const sx of[-1,1]){P('cylinder',dark,x+sx*13.5,deckY+4,-134.5,.2,8,.2);P('box',dark,x+sx*13.5,deckY+8,-134.5,2.2,.12,.3);for(const o of[-.7,0,.7])P('box','#f6f1dc',x+sx*13.5+o,deckY+7.7,-134.4,.55,.4,.26,.5,0,0,'glow');}
  for(const side of[-1,1])row(x+side*14.85,deckY-5.2,-123,side*Math.PI/2,20,2.5,1);
  // Landing: plywood on the slope with painted bars, tarmac on the run-out, closed sides and front.
  const slope=landing.filter(p=>p.z<=186),apron=landing.filter(p=>p.z>=183);
  strip(boards,slope,-13,13,{us:4,vs:4});strip(panels,apron,-13,13,{lift:.004,tint:tar});
  for(const side of[-1,1]){strip(panels,slope,side*13,side*12.5,{lift:.015,tint:red});strip(panels,apron,side*12.9,side*12.6,{lift:.012,tint:white});wall(boards,slope,side*13.05,p=>p.y-.2,()=>GROUND-.05,[1,1,1]);for(const p of slope)if(p.y-GROUND>1.1)P('box',dark,x+side*13.13,(p.y-.2+GROUND)/2,p.z,.1,p.y-.2-GROUND,.12,0,0,0,'metal');[[5,5],[13,2],[21,3]].forEach(([z,index])=>row(x+side*13.2,GROUND+1.15,landing[0].z+z,side*Math.PI/2,6.6,1,index));wall(panels,slope,side*13.07,p=>p.y-.2,p=>Math.max(GROUND,p.y-.7),p=>Math.floor(p.z/4)%2?red:white);}
  for(let i=1;i+1<slope.length;i+=4)strip(panels,slope.slice(i,i+2),-12.4,12.4,{lift:.014,tint:i%8===1?white:blue});
  for(let i=2;i+2<apron.length;i+=5)strip(panels,apron.slice(i,i+3),-.2,.2,{lift:.012,tint:white});
  const head=landing[0];quad(boards,[[x-13.05,GROUND-.05,head.z-.02],[x+13.05,GROUND-.05,head.z-.02],[x+13.05,head.y-.2,head.z-.02],[x-13.05,head.y-.2,head.z-.02]],[1,1,1],[[0,0],[6.5,0],[6.5,1],[0,1]]);for(let px=x-13;px<=x+13;px+=4.33)P('box',dark,px,(head.y-.2+GROUND)/2,head.z-.07,.12,head.y-.2-GROUND,.1,0,0,0,'metal');
  // Crowd barriers along the run-out.
  for(const side of[-1,1]){for(let z=188;z<=276;z+=2.6)P('box',steel,x+side*14.4,BASE+.55,z,.05,1.1,.05,0,0,0,'metal');for(const y of[.25,.65,1.08])P('box',steel,x+side*14.4,BASE+y,232,.045,.045,88,0,0,0,'metal');}row(x,GROUND+(head.y-GROUND)/2,head.z-.06,Math.PI,16,1.6,1);
  const end=landing[landing.length-1];for(let px=x-12.6;px<=x+12.6;px+=.72)for(let k=0;k<3;k++)P('cylinder','#1b1d1f',px,end.y+.11+k*.21,end.z+.8,.68,.2,.68);
  // Access road up to the deck: a tarmac slab with parapets, on round columns.
  if(ascent.length>2){
   const corner=i=>{const a=ascent[i-1],c=ascent[i+1];if(!a||!c)return true;const p=ascent[i],d0=Math.atan2(p.x-a.x,p.z-a.z),d1=Math.atan2(c.x-p.x,c.z-p.z);return Math.abs(Math.atan2(Math.sin(d1-d0),Math.cos(d1-d0)))>.2;},near=i=>{for(let k=-3;k<=3;k++)if(ascent[i+k]&&corner(i+k))return true;return false;};
   let turnIn=0;for(let i=1;i<ascent.length-1;i++)if(corner(i))turnIn=i;const road=ascent.slice(0,turnIn+1),tail=ascent.slice(turnIn);
   strip(panels,road,-3.5,3.5,{lift:.002,tint:tar});if(tail.length>1)strip(boards,tail,-3.5,3.5,{lift:.004,us:4,vs:4});for(const side of[-1,1]){wall(panels,ascent,side*3.5,p=>p.y,p=>p.y-.4,grey);strip(panels,road,side*3.3,side*3.1,{lift:.012,tint:white});}
   for(const side of[-1,1]){let from=-1;for(let i=0;i<=ascent.length;i++){const open=i<ascent.length&&!near(i)&&ascent[i].y-GROUND>.8;if(open&&from<0)from=i;if(!open&&from>=0){if(i-1>from)wall(panels,ascent,side*3.45,p=>p.y+.85,p=>p.y,yellow,from,i-1);from=-1;}}}
   let run=0;for(let i=1;i<ascent.length;i++){const p=ascent[i];run+=Math.hypot(p.x-ascent[i-1].x,p.z-ascent[i-1].z);if(run<15||p.y-GROUND<1.6||near(i))continue;run=0;P('cylinder','#b9bdb0',p.x,(p.y-.4+GROUND)/2,p.z,.7,p.y-.4-GROUND,.7);const n=sideways(ascent,i);P('box','#b9bdb0',p.x,p.y-.55,p.z,6.6,.3,1,0,Math.atan2(-n[1],n[0]));}}
  // Tall lamps beside the gap and the landing.
  for(const[lx,lz]of[[x-17,60],[x+17,60],[x-19,150],[x+19,150]]){P('cylinder',dark,lx,GROUND+9,lz,.36,18,.36);P('box',dark,lx,GROUND+18,lz,.3,.14,3);for(const o of[-1,0,1])P('box','#f6f1dc',lx-Math.sign(lx-x)*.2,GROUND+17.6,lz+o,.28,.45,.7,0,0,0,'glow');}
  mesh(boards,wood,'mega-ramp-boards');mesh(panels,paint,'mega-ramp-panels');}
 PARKED.forEach(([type,px,pz],i)=>{if(i>=WHEELERS)P('box','#1b1d1f',px,BASE+.16,pz,.34,.32,.5);});scene.recreationParked={built:0,group:null};
 mesh(banners,new T.MeshStandardMaterial({map:sheet,roughness:.82,metalness:0}),'recreation-banners',false);
}
/* V4.9: the paddock's parked trucks and cars, for the code that turns them into real vehicles. */
function parkedCars(){return PARKED.slice(0,WHEELERS).map(([typeId,x,z,yaw,paint])=>({typeId,paint,x,z,yaw}));}
// ---- V6.0: what other files see is where the park stands now -------------------------------------------------
const moved=p=>p&&({...p,x:p.x+OFF.x,z:p.z+OFF.z}),rect=q=>({...q,x0:q.x0+OFF.x,x1:q.x1+OFF.x,z0:q.z0+OFF.z,z1:q.z1+OFF.z});
let worldTrack=null;
function worldLap(){if(!worldTrack){const P=track();worldTrack={points:P.points.map(moved),turns:P.turns,length:P.length,x0:P.x0+OFF.x,x1:P.x1+OFF.x,z0:P.z0+OFF.z,z1:P.z1+OFF.z};}return worldTrack;}
// The scene as the drawing code should see it: whatever it draws lands where the park is now.
function movedScene(scene){const T=scene.T,view=Object.create(scene);view.part=(b,type,c,x,y,z,...rest)=>scene.part(b,type,c,x+OFF.x,y,z+OFF.z,...rest);view.box=(b,c,x,y,z,...rest)=>scene.box(b,c,x+OFF.x,y,z+OFF.z,...rest);view.environment={add:m=>{m.position.x+=OFF.x;m.position.z+=OFF.z;m.updateMatrix();scene.environment.add(m);}};view.trackStatic=(m,box)=>scene.trackStatic?.(m,box.clone().translate(new T.Vector3(OFF.x,0,OFF.z)));return view;}
return{GROUND,BASE,HALF,OFF,lift,FEATURES,PLAN,owns,update,movedScene,
 track:worldLap,locate:(x,z)=>locate(x-OFF.x,z-OFF.z),mound:(x,z)=>mound(x-OFF.x,z-OFF.z),groundTint:(x,z)=>groundTint(x-OFF.x,z-OFF.z),at:s=>moved(at(s)),beside:(s,v)=>moved(beside(s,v)),zone:()=>rect(zone()),zones:()=>zones().map(rect),
 install:(world,h)=>install(world,{poly:h.poly,surface:(id,points,...rest)=>h.surface(id,points.map(moved),...rest),part:(id,color,x,y,z,...rest)=>h.part(id,color,x+OFF.x,y,z+OFF.z,...rest),box:(id,x,y,z,...rest)=>h.box(id,x+OFF.x,y,z+OFF.z,...rest)}),
 render:(scene,b)=>{const view=movedScene(scene);render(view,b);scene.recreationParked=view.recreationParked;},
 parkedCars:()=>parkedCars().map(moved)};
});
/* PLATDO City: the hills above Larkspan (V5.9, world stage B3). Shared by the game and the multiplayer host.
 * - Two roads on the seaward face of the east hill. Hillside Drive leaves the top of Island Parkway, climbs to about
 *   22 m and runs east to the Eastern Coastal Road. Skyline Drive branches off it, doubles back and runs west along
 *   the 47 m line to a dead end. Both are drawn through a few chosen points as smooth curves, with the height of the
 *   road given at each point (the ground is cut and filled to the road by the world's own rule for roads).
 * - Fifteen mansions on the seaward (south) side of those roads, six on Skyline Drive and nine on Hillside Drive.
 *   The slope is too steep for a level garden, so every one stands on a platform held up by columns: a short
 *   driveway bridge from the road, a forecourt, the house, and a terrace with a pool looking out to sea.
 *   Five house designs in three colour schemes, some mirrored: no two are the same.
 * - The pools are real water: 1.27 m deep, with nine shallow steps at one end to walk in and out.
 * Nothing here changes the ground itself. The houses cannot be entered or bought yet. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CityHills=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// ---- the roads: [x, z, height of the road]; a missing height means "whatever the ground or the joining road has"
const ROADS=[
 {id:'hillside-drive',name:'Hillside Drive',width:12,speed:11,knots:[[400,-420],[400,-480,5.5],[470,-540,13],[600,-580,21.5],[700,-613,22.5],[800,-661,22.5],[920,-665,14],[1040,-650]]},
 {id:'skyline-drive',name:'Skyline Drive',width:12,speed:10,knots:[[800,-661,22.5],[850,-705,25.5],[805,-752,35],[700,-745,46],[600,-687,47.5],[500,-653,47.5],[400,-632,47.5],[300,-622,47.5]]}];
// A smooth curve through the knots (it passes through every one), as points about 20 m apart.
function curve(knots,ground){const P=knots.map(k=>({x:k[0],z:k[1],y:k[2]??null}));for(const p of P)if(p.y===null)p.y=ground(p.x,p.z)+.06;
 const h=(a,b,c,d,t)=>{const t2=t*t,t3=t2*t;return(2*t3-3*t2+1)*b+(t3-2*t2+t)*(c-a)*.5+(-2*t3+3*t2)*c+(t3-t2)*(d-b)*.5;},out=[];
 for(let i=0;i<P.length-1;i++){const a=P[Math.max(0,i-1)],b=P[i],c=P[i+1],d=P[Math.min(P.length-1,i+2)],n=Math.max(2,Math.ceil(Math.hypot(c.x-b.x,c.z-b.z)/20));if(!i)out.push({x:b.x,z:b.z,y:b.y,knot:knots[i][2]===undefined});
  for(let j=1;j<=n;j++){const t=j/n;out.push(j===n?{x:c.x,z:c.z,y:c.y,knot:knots[i+1][2]===undefined}:{x:+h(a.x,b.x,c.x,d.x,t).toFixed(2),z:+h(a.z,b.z,c.z,d.z,t).toFixed(2),y:+h(a.y,b.y,c.y,d.y,t).toFixed(3)});}}
 return out;}
const lines=new Map();
function line(road,ground){let l=lines.get(road.id);if(!l){l=curve(road.knots,ground);lines.set(road.id,l);}return l;}
// Called from the island layout's own road list. `add` is its helper: (id, name, [[x,z,y]...], width, speed).
function roads(add,ground){lines.clear();for(const r of ROADS)add(r.id,r.name,line(r,ground).map(p=>p.knot?[p.x,p.z]:[p.x,p.z,p.y]),r.width,r.speed);}
// Where a road is when it passes a given x. Searched from the far end, so on Skyline Drive it finds the long run
// west and not the bend where the road doubles back.
function roadAt(road,x,ground){const l=line(road,ground);for(let i=l.length-1;i>=1;i--){const a=l[i-1],b=l[i];if((a.x-x)*(b.x-x)<=0&&a.x!==b.x){const t=(x-a.x)/(b.x-a.x);return{x,z:a.z+(b.z-a.z)*t,y:a.y+(b.y-a.y)*t};}}return null;}
// ---- the fifteen sites: which road, and where along it (x)
const W=30,D=26,SETBACK=14.9;
const PLOTS=[['skyline-drive',330],['skyline-drive',395],['skyline-drive',460],['skyline-drive',525],['skyline-drive',590],['skyline-drive',655],
 ['hillside-drive',500],['hillside-drive',565],['hillside-drive',630],['hillside-drive',695],['hillside-drive',760],['hillside-drive',838],['hillside-drive',903],['hillside-drive',968],['hillside-drive',440]];
let SITES=null;
function sites(ground){if(SITES)return SITES;SITES=PLOTS.map(([roadId,x],i)=>{const road=ROADS.find(r=>r.id===roadId),m=i%2?-1:1,gx=x-m*9,gate=roadAt(road,gx,ground)||{x:gx,z:-600,y:20};
  /* the road slants: the platform keeps clear of where the road comes furthest south along its whole width */let south=gate.z;for(const dx of[-15,-7.5,0,7.5,15]){const q=roadAt(road,x+dx,ground);if(q)south=Math.max(south,q.z);}
  const L=+(gate.y-.2).toFixed(2),cz=+(south+SETBACK+D/2).toFixed(2),/* the pool: 12 by 5, toward one end of the terrace */x0=Math.min(x+m*1,x+m*13),x1=Math.max(x+m*1,x+m*13);
  return{id:'hill-home-'+(i+1),index:i,road:roadId,x,z:cz,y:L,w:W,d:D,mirror:m,design:i%5,tone:Math.floor(i/5)%3,gate:{x:gx,z:+gate.z.toFixed(2),y:+gate.y.toFixed(3)},pool:{x0,x1,z0:cz+6,z1:cz+11,level:+(L-.18).toFixed(2)}};});return SITES;}
// The level of the water at a spot, or null when there is no hill pool there.
function poolAt(x,z){if(!SITES||z>-440||z<-780||x<290||x>1010)return null;for(const s of SITES){const p=s.pool;if(x>p.x0&&x<p.x1&&z>p.z0&&z<p.z1)return p.level;}return null;}
// ---- building them. part(id,colour,x,yCentre,z,w,h,d,solid) and surface(id,points,width,colour,onGround) are the
// island layout's own helpers; ground(x,z) is the height of the land.
const TONES=[{wall:'#f3f0e8',trim:'#3b4248',roof:'#e2dfd6',base:'#a39e93'},{wall:'#eadfca',trim:'#6a4b36',roof:'#b9643f',base:'#b3a58c'},{wall:'#dde2e6',trim:'#2e4756',roof:'#c9d0d5',base:'#8f979c'}];
const GLASS='#3f6377',RAIL='#a9c6d2',DECK='#c9b190',PAVE='#8f9698',WATER='#35b5d6',TILE='#c4e8f1',COLUMN='#b9b4a9',WOOD='#8a6a48';
function install(world,{part,surface,terrain}){
 const list=sites(terrain);world.hillHomes=list.map(s=>({id:s.id,x:s.x,z:s.z,w:s.w,d:s.d,y:s.y,road:s.road,pool:{...s.pool}}));
 for(const s of list){const T=TONES[s.tone],m=s.mirror,L=s.y,cx=s.x,cz=s.z;
  /* B: a box by its bottom, measured from the platform top; x is mirrored for half the houses */
  const B=(key,colour,x,y0,z,w,h,d,solid=true)=>part(s.id+':'+key,colour,cx+m*x,L+y0+h/2,cz+z,w,h,d,solid);
  // the platform, with the pool's hole in it
  B('slab-n',DECK,0,-.3,-3.5,W,.3,19);B('slab-s',DECK,0,-.3,12,W,.3,2);B('slab-w',DECK,-7,-.3,8.5,16,.3,5);B('slab-e',DECK,14,-.3,8.5,2,.3,5);B('forecourt',PAVE,0,-.29,-9,W-.4,.3,7.6);
  // its columns, down to the hillside, and the beams that tie them
  /* (each column goes 2.5 m into the hill, because the ground by the road is reshaped to the road after this) */
  for(const x of[-13.5,-4.5,4.5,13.5])for(const z of[-11.5,-3,5,12]){const g=terrain(cx+m*x,cz+z),h=L-.3-g;if(h>.5){const thick=h>8?1:.7;part(s.id+':col:'+x+':'+z,COLUMN,cx+m*x,g+h/2-1.25,cz+z,thick,h+2.5,thick);}}
  for(const z of[-11.5,-3,5,12])B('beam:'+z,COLUMN,0,-.85,z,W-1,.55,.5);
  // the pool: tiled floor and sides under the platform, steps at the end nearest the house's middle, and the water
  B('pool-floor',TILE,7,-1.6,8.5,12,.15,5);B('pool-n',TILE,7,-1.6,5.9,12.4,1.3,.2);B('pool-s',TILE,7,-1.6,11.1,12.4,1.3,.2);B('pool-w',TILE,.9,-1.6,8.5,.2,1.3,5);B('pool-e',TILE,13.1,-1.6,8.5,.2,1.3,5);
  /* nine shallow steps: the game lets a walker step up 0.18 m at most, and the water is too deep to stand in only past the last one */for(let k=1;k<=9;k++)B('pool-step:'+k,TILE,1.2+(k-1)*.4,-.145*k-.12,8.5,.4,.12,5);
  B('pool-water',WATER,7,-.24,8.5,12,.06,5,false);B('pool-edge',T.roof,7,0,5.75,12.6,.06,.5,false);
  // glass rail round the open sides
  B('rail-s',RAIL,0,0,12.92,W,1.05,.08);B('rail-w',RAIL,-14.92,0,4.5,.08,1.05,17);B('rail-e',RAIL,14.92,0,4.5,.08,1.05,17);
  // the driveway: a short bridge from the roadside to the forecourt
  const run=Math.max(.6,cz-13-(s.gate.z+9.9));surface(s.id+':drive',[{x:s.gate.x,y:s.gate.y+.02,z:cz-13-run},{x:s.gate.x,y:L,z:cz-13}],6.5,PAVE,false);
  for(const e of[-1,1])part(s.id+':drive-rail:'+e,COLUMN,s.gate.x+e*3.3,(s.gate.y+L)/2+.45,cz-13-run/2,.14,.9,run);
  // low walls round the forecourt, open only at the driveway
  B('wall-w',T.base,-14.82,0,-8.5,.36,.95,9);B('wall-e',T.base,14.82,0,-8.5,.36,.95,9);B('wall-n',T.base,5.45,0,-12.82,19.1,.95,.36);B('wall-nw',T.base,-13.6,0,-12.82,2.8,.95,.36);
  // the house (it stands from z -4.5 to 4.5 on the platform; +z is the sea)
  const glass=(key,x,y0,z,w,h,d=.12)=>B(key,GLASS,x,y0,z,w,h,d,false),door=(key,x,z,w=1.4,h=2.3)=>B(key,T.trim,x,0,z,w,h,.1,false);
  if(s.design===0){/* the long house: two long floors, the upper one set back */
   B('g',T.wall,-2,0,0,22,3.2,9);B('u',T.wall,-4,3.2,-.5,16,3,8);B('r1',T.roof,-2,3.2,0,23.4,.25,10.4);B('r2',T.roof,-4,6.2,-.5,17.6,.3,9.6);
   glass('gs',-2,.35,4.56,19.5,2.45);glass('us',-4,3.65,3.56,13.6,2.1);glass('un',-4,4.2,-4.56,10,1.1);door('door',-5,-4.56);glass('gn',2,1.1,-4.56,5,1.3);
   B('gar',T.base,11.5,0,-1.5,5.5,3,7);B('gar-door',T.trim,11.5,.1,-5.06,4.2,2.5,.1,false);}
  else if(s.design===1){/* the stack: a stone base with a wider white floor hanging over it */
   B('g',T.base,-3,0,0,18,3.2,9);B('u',T.wall,0,3.2,.75,22,3.2,10.5);B('r',T.roof,0,6.4,.75,23.4,.3,11.9);
   glass('us',0,3.6,6.06,20,2.4);glass('ue',11.06,3.6,.75,.12,2.4,8);glass('gs',-3,.35,4.56,14,2.4);door('door',-9,-4.56);B('gar-door',T.trim,-1,.1,-4.56,5,2.5,.1,false);glass('un',2,4.3,-4.56,12,1.1);}
  else if(s.design===2){/* the L: a tall block and a low wing, with a pergola over the terrace between them */
   B('g',T.wall,-6,0,-.5,14,6.4,8);B('w',T.wall,7,0,.5,10,3.2,10);B('r1',T.roof,-6,6.4,-.5,15.2,.3,9.2);B('r2',T.roof,7,3.2,.5,11.2,.25,11.2);
   glass('gs',-6,.35,3.56,11.5,2.4);glass('us',-6,3.6,3.56,11.5,2.2);glass('ws',7,.35,5.56,8,2.4);door('door',-1,-4.56);B('gar-door',T.trim,7,.1,-4.56,5,2.5,.1,false);glass('gn',-8,4,-4.56,6,1.2);
   for(const x of[-12,-6,0])for(const z of[4.2,5.6]){B('post:'+x+':'+z,WOOD,x,0,z,.16,2.6,.16);}for(const z of[4.2,5.6])B('rafter:'+z,WOOD,-6,2.6,z,12.6,.14,.14,false);}
  else if(s.design===3){/* the villa: one long low floor and a square tower */
   B('g',T.wall,-1,0,0,24,3.4,9);B('t',T.wall,-8,3.4,0,8,3.6,8);B('r1',T.roof,-1,3.4,0,25.2,.3,10.2);B('r2',T.roof,-8,7,0,9.2,.35,9.2);
   glass('gs',1,.35,4.56,17,2.5);glass('ts',-8,3.9,4.06,5.5,2.2);glass('tn',-8,3.9,-4.06,5.5,2.2);door('door',-3,-4.56,1.6,2.5);B('gar-door',T.trim,7,.1,-4.56,5,2.5,.1,false);glass('gn',-10,1.1,-4.56,4,1.4);}
  else{/* the glass stack: three floors, each a little out of line with the one below */
   B('f0',T.base,-2,0,0,18,3,9);B('f1',T.wall,0,3,-.25,16,3,8.5);B('f2',T.wall,-3,6,.25,13,2.8,7.5);B('r0',T.roof,-2,3,0,19,.2,9.8);B('r1',T.roof,0,6,-.25,17,.2,9.3);B('r2',T.roof,-3,8.8,.25,14.2,.3,8.7);
   glass('s0',-2,.35,4.56,15.5,2.3);glass('s1',0,3.35,4.06,14,2.3);glass('s2',-3,6.35,4.06,11,2.1);glass('e1',8.06,3.35,-.25,.12,2.3,6.5);door('door',-7,-4.56);B('gar-door',T.trim,3,.1,-4.56,5,2.5,.1,false);}
 }
}
return{ROADS,PLOTS,W,D,roads,roadAt,sites,poolAt,install,curve,line};
});
