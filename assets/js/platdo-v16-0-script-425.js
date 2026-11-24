
/* PLATDO City houses: the look from outside (V9.5). Game only. The solid shapes are in city-houses.js.
 * - Five looks: stucco under a clay tile hip roof; painted boards under a shingle gable roof with a porch on posts;
 *   brick under a dark hip roof; modern white with timber and a flat roof; craftsman with a stone base, painted boards,
 *   deep eaves and a porch. Colours vary from house to house.
 * - Every window is a real opening with a frame and a sill; its glass is one instance of a pane, hidden for the house
 *   you are in (the house draws its own clear glass inside). The walls leave out their inside faces, which are behind
 *   the house's own finish (city-apt-rooms.js), so no two faces share a plane.
 * - Each house has a porch, a path to the street, a hedge, a mailbox, a tree and a driveway.
 * - The houses of a district are one set of meshes; the garden details only show within 250 m. The front door opens
 *   for the owner (Sandbox and Story) and stays shut, and solid, for everyone else. */
(function(root){'use strict';
const PI=Math.PI;const HS=()=>root.CityHouses,LK=()=>root.CityApartmentsLook;
/* V13.3: the paved bits of every house's garden (porch, path, drive) as four corners in the world each, kept by house so a rebuild replaces them */const PAVED=root.CityPavedAreas||(root.CityPavedAreas=new Map());function pave(h,rects){const H=HS();if(!H?.toWorld||!h)return;PAVED.set(h.id,rects.filter(r=>r[1]>r[0]&&r[3]>r[2]).map(([x0,x1,z0,z1])=>{const pts=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]].map(([x,z])=>{const q=H.toWorld(h,x,0,z);return[q.x,q.z];});const xs=pts.map(q=>q[0]),zs=pts.map(q=>q[1]);return{pts,x0:Math.min(...xs),x1:Math.max(...xs),z0:Math.min(...zs),z1:Math.max(...zs)};}));}
const STYLE={
 stucco:{wall:'stucco',tints:['#f6efe3','#f3e6d4','#efe9df','#f1e2cf'],frame:'#4a3a2c',roof:'hip',roofKey:'tiles',trim:'#e9e1d2',door:'#6b4a33',porch:'flat'},
 clapboard:{wall:'siding',tints:['#c9d8e2','#d8e3d2','#ece6d6','#e6d3d0','#d5dbe6'],frame:'#ffffff',roof:'gable',roofKey:'shingle',trim:'#ffffff',door:'#2f4f6e',porch:'posts'},
 brick:{wall:'brick',tints:['#ffffff','#f2e6e0'],frame:'#f4f2ec',roof:'hip',roofKey:'shingle',trim:'#e9e5dc',door:'#3d2a22',porch:'flat'},
 modern:{wall:'stucco',tints:['#f7f7f5','#ecebe7','#e4e2dd'],frame:'#151617',roof:'flat',roofKey:'concrete',trim:'#151617',door:'#151617',porch:'slab',accent:true},
 craftsman:{wall:'siding',tints:['#9fae8e','#b9a37f','#8e9ea6','#a8977e'],frame:'#efe7d4',roof:'gable',roofKey:'shingle',trim:'#efe7d4',door:'#7a2e22',porch:'posts',base:true}};
// local faces to world faces for each way a house can face (r)
const FACE=[{px:'px',nx:'nx',pz:'pz',nz:'nz'},{px:'nz',nx:'pz',pz:'px',nz:'nx'},{px:'nx',nx:'px',pz:'nz',nz:'pz'},{px:'pz',nx:'nz',pz:'nx',nz:'px'}];
function buildHouse(T,h,shell,det,panes,doors,ox,oz){
 const H=HS(),S=STYLE[h.style]||STYLE.stucco,r=LK().rng(LK().hash(h.id)),tint=S.tints[(LK().hash(h.id+'t'))%S.tints.length];
 const HX=H.HX,HZ=H.HZ,IX=H.IX,IZ=H.IZ,UP=H.UP,RF=H.ROOF,yaw=H.yawOf(h);
 const wallKey=S.wall+(tint!=='#ffffff'?'|'+tint:''),frame=S.frame,trim=S.trim;
 const B=(acc,key,x0,x1,y0,y1,z0,z1,skip='')=>{const w=H.boxWorld(h,x0,x1,y0,y1,z0,z1),sk=skip.split(',').filter(Boolean).map(f=>FACE[h.r][f]).join(',');acc.box(key,w.x0-ox,w.x1-ox,w.y0,w.y1,w.z0-oz,w.z1-oz,sk);};
 const M=(x,y,z,ry=0,rx=0,rz=0,sx=1,sy=1,sz=1)=>{const p=H.toWorld(h,x,y,z);return new T.Matrix4().compose(new T.Vector3(p.x-ox,p.y,p.z-oz),new T.Quaternion().setFromEuler(new T.Euler(rx,yaw+ry,rz,'YXZ')),new T.Vector3(sx,sy,sz));};
 // foundation
 B(shell,'concrete',-HX-.05,HX+.05,h.low-h.y-.05,0,-HZ-.05,HZ+.05,'ny');
 // the outer walls, floor by floor, with their openings cut out; the inside face of each piece is left out
 const sides={f:{along:'x',a:-HX,b:HX,c0:IZ,c1:HZ,skip:'nz'},b:{along:'x',a:-HX,b:HX,c0:-HZ,c1:-IZ,skip:'pz'},l:{along:'z',a:-IZ,b:IZ,c0:-HX,c1:-IX,skip:'px'},r:{along:'z',a:-IZ,b:IZ,c0:IX,c1:HX,skip:'nx'}};
 for(const[key,sd]of Object.entries(sides))for(const[y0,y1]of[[0,UP],[UP,RF]]){
  const ops=H.WINDOWS.filter(o=>o[0]===key&&o[3]>=y0-.01&&o[4]<=y1+.01).map(o=>[o[1],o[2],o[3],o[4]]);if(key==='f'&&y0===0)ops.push([H.DOOR[0],H.DOOR[1],0,H.DOOR[3]]);ops.sort((p,q)=>p[0]-q[0]);
  const mat=(S.base&&y0===0)?'ashlar':wallKey,piece=(a,b,ya,yb)=>{if(b-a<.005||yb-ya<.005)return;if(sd.along==='x')B(shell,mat,a,b,ya,yb,sd.c0,sd.c1,sd.skip);else B(shell,mat,sd.c0,sd.c1,ya,yb,a,b,sd.skip);};
  let cur=sd.a;for(const o of ops){piece(cur,o[0],y0,y1);piece(o[0],o[1],y0,o[2]);piece(o[0],o[1],o[3],y1);cur=o[1];}piece(cur,sd.b,y0,y1);}
 // window frames, sills and the panes
 const out={f:[0,1],b:[0,-1],l:[-1,0],r:[1,0]},paneAt=[];
 for(const[w,a,b,y0,y1]of H.WINDOWS){const[nx,nz]=out[w],sd=sides[w],face=(nx||nz)>0?sd.c1:sd.c0,mid=(sd.c0+sd.c1)/2,wid=b-a,c=(a+b)/2;
  const bar=(u0,u1,v0,v1,d0,d1,key)=>{if(sd.along==='x')B(shell,key,u0,u1,v0,v1,Math.min(face+d0*nz,face+d1*nz),Math.max(face+d0*nz,face+d1*nz));else B(shell,key,Math.min(face+d0*nx,face+d1*nx),Math.max(face+d0*nx,face+d1*nx),v0,v1,u0,u1);};
  /* frames and sills stand just outside the wall's face, so none of their faces lies in the plane of the opening's sides */bar(a-.07,a,y0,y1,.003,.06,frame);bar(b,b+.07,y0,y1,.003,.06,frame);bar(a-.07,b+.07,y1,y1+.07,.003,.06,frame);bar(a-.12,b+.12,y0-.06,y0,.003,.1,trim);
  if(wid>1.6)bar(c-.03,c+.03,y0,y1,-.03,.03,frame);
  const ry=w==='f'?0:w==='b'?PI:w==='l'?-PI/2:PI/2,p=sd.along==='x'?[c,(y0+y1)/2,mid]:[mid,(y0+y1)/2,c];paneAt.push(M(p[0],p[1],p[2],ry,0,0,wid,y1-y0,1));}
 // the front door: a frame and trim, a step, a light; the leaf itself is an instance that swings
 const fz=HZ;B(shell,trim,H.DOOR[0]-.1,H.DOOR[0],0,H.DOOR[3]+.1,fz+.003,fz+.07);B(shell,trim,H.DOOR[1],H.DOOR[1]+.1,0,H.DOOR[3]+.1,fz+.003,fz+.07);B(shell,trim,H.DOOR[0]-.1,H.DOOR[1]+.1,H.DOOR[3],H.DOOR[3]+.12,fz+.003,fz+.07);
 B(det,'light',H.DOOR[1]+.25,H.DOOR[1]+.37,1.9,2.1,fz,fz+.08);
 const hinge=H.toWorld(h,H.DOOR[0],0,(IZ+HZ)/2+.07);
 // the roof
 const e=.5,y=RF,tri=(key,p,q,s)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array([...p,...q,...s]),3));g.setAttribute('uv',new T.BufferAttribute(new Float32Array([p[0],p[2]+p[1],q[0],q[2]+q[1],s[0],s[2]+s[1]]),2));g.computeVertexNormals();shell.geo(key,g,M(0,0,0));};
 B(shell,trim,-HX-e,HX+e,y,y+.12,-HZ-e,HZ+e,'');
 if(S.roof==='hip'){const rh=2.4,rx=HX-HZ,A0=[-HX-e,y+.12,HZ+e],B0=[HX+e,y+.12,HZ+e],C0=[HX+e,y+.12,-HZ-e],D0=[-HX-e,y+.12,-HZ-e],RA=[-rx,y+.12+rh,0],RB=[rx,y+.12+rh,0];tri(S.roofKey,A0,B0,RB);tri(S.roofKey,A0,RB,RA);tri(S.roofKey,C0,D0,RA);tri(S.roofKey,C0,RA,RB);tri(S.roofKey,B0,C0,RB);tri(S.roofKey,D0,A0,RA);B(shell,'black',-rx,rx,y+.12+rh-.04,y+.12+rh+.06,-.06,.06);}
 else if(S.roof==='gable'){const rh=2.9,yb=y+.12;for(const s of[1,-1]){const A0=[-HX-.4,yb,s*(HZ+e)],B0=[HX+.4,yb,s*(HZ+e)],R0=[HX+.4,yb+rh,0],R1=[-HX-.4,yb+rh,0];if(s>0){tri(S.roofKey,A0,B0,R0);tri(S.roofKey,A0,R0,R1);}else{tri(S.roofKey,B0,A0,R1);tri(S.roofKey,B0,R1,R0);}}
  for(const k of[-1,1]){const g=new T.BufferGeometry(),x=k*(HX-.02),pts=k>0?[x,yb,HZ+.02, x,yb,-HZ-.02, x,yb+rh-.1,0]:[x,yb,-HZ-.02, x,yb,HZ+.02, x,yb+rh-.1,0];g.setAttribute('position',new T.BufferAttribute(new Float32Array(pts),3));g.setAttribute('uv',new T.BufferAttribute(new Float32Array([pts[2],pts[1],pts[5],pts[4],pts[8],pts[7]]),2));g.computeVertexNormals();shell.geo(wallKey,g,M(0,0,0));}
  B(shell,'black',-HX-.4,HX+.4,yb+rh-.04,yb+rh+.06,-.06,.06);}
 else{B(shell,'concrete',-HX-e+.02,HX+e-.02,y+.12,y+.16,-HZ-e+.02,HZ+e-.02,'ny');for(const[a0,a1,b0,b1]of[[-HX-e,HX+e,HZ+e-.15,HZ+e],[-HX-e,HX+e,-HZ-e,-HZ-e+.15],[-HX-e,-HX-e+.15,-HZ-e+.15,HZ+e-.15],[HX+e-.15,HX+e,-HZ-e+.15,HZ+e-.15]])B(shell,'white',a0,a1,y+.12,y+.6,b0,b1);}
 if(S.accent){/* timber cladding on part of the front, upstairs */B(shell,'battens',2.0,HX+.02,UP,RF,HZ,HZ+.04);}
 // porch
 B(det,'paving',-1.6,1.6,-H.LIFT,0,HZ,HZ+1.4,'ny');
 if(S.porch==='posts'){for(const x of[-1.4,1.4])B(det,trim,x-.08,x+.08,0,2.6,HZ+1.17,HZ+1.33);B(det,trim,-1.6,1.6,2.6,2.75,HZ+.02,HZ+1.45);det.geo(S.roofKey,new T.BoxGeometry(3.6,.08,1.7),M(0,2.95,HZ+.75,0,.32,0));}
 else if(S.porch==='flat'){B(det,trim,-1.5,1.5,2.55,2.7,HZ+.02,HZ+1.2);for(const x of[-1.3,1.3])det.geo('black',new T.BoxGeometry(.05,.05,1.25),M(x,2.35,HZ+.6,0,-.5,0));}
 else B(det,'white',-1.8,1.8,2.62,2.72,HZ+.02,HZ+1.6);
 // the garden: path, hedge with gaps for the path and the drive, mailbox, a tree, the driveway
 /* V12.7: the path and the drive stop where another house's garden starts (REACH, worked out in build) instead of running on through the house in front */const edge=HZ+6.2,road=Math.max(edge,Math.min(h.front||edge,REACH.get(h)??Infinity));B(det,'paving',-.6,.6,-.12,.01,HZ+1.4,road,'ny');const paved=[[-1.6,1.6,HZ,HZ+1.4],[-.6,.6,HZ+1.4,road]];/* V13.1: every drive reaches the road; a back-row house's drive goes along its side, across in front and out between the neighbours' gardens (houses.js drive) */{const dv=H.drive&&DRIVE_WORLD?H.drive(DRIVE_WORLD,h):null;if(dv&&dv.bent){const P=dv.local,W=1.4;B(det,'concrete',P[0][0]-W,P[0][0]+W,-.12,.012,P[0][1],P[1][1]-W,'ny');B(det,'concrete',Math.min(P[1][0],P[2][0])-W,Math.max(P[1][0],P[2][0])+W,-.12,.012,P[1][1]-W,P[1][1]+W,'ny');B(det,'concrete',P[2][0]-W,P[2][0]+W,-.12,.012,P[2][1]+W,P[3][1],'ny');paved.push([P[0][0]-W,P[0][0]+W,P[0][1],P[1][1]-W],[Math.min(P[1][0],P[2][0])-W,Math.max(P[1][0],P[2][0])+W,P[1][1]-W,P[1][1]+W],[P[2][0]-W,P[2][0]+W,P[2][1]+W,P[3][1]]);}else{B(det,'concrete',7.5,10.3,-.12,.012,HZ-2.5,dv?Math.max(road,dv.end):road,'ny');paved.push([7.5,10.3,HZ-2.5,dv?Math.max(road,dv.end):road]);}
 /* V13.3: the porch, path and drive are paving to walk on: footsteps sound like it (simulation.js stepSurface reads CityPavedAreas) */pave(h,paved);}
 for(const[a0,a1]of[[-10.8,-.9],[.9,7.2]])B(det,'leafDark',a0,a1,-.1,.75,edge-.55,edge-.1);
 B(det,'black',.95,1.0,-.1,1.05,edge-.15,edge-.1);B(det,'#2f5a7a',.85,1.1,1.0,1.2,edge-.3,edge+.05);
 const tx=-6.5+r()*2,tz=HZ+3.2;{const p=H.toWorld(h,tx,0,tz);det.geo('wood',new T.CylinderGeometry(.12,.16,2.4,7),new T.Matrix4().makeTranslation(p.x-ox,p.y+1.1,p.z-oz));for(let k=0;k<5;k++)det.geo(k%2?'leaf':'leafDark',new T.SphereGeometry(1.1+r()*.4,9,7),new T.Matrix4().makeTranslation(p.x-ox+(r()-.5)*1.2,p.y+2.9+r()*.9,p.z-oz+(r()-.5)*1.2));}
 // what the row keeps per house: the panes and the door
 return{panes:paneAt,hinge,yaw};}
// ---- all the houses ---------------------------------------------------------------------------------------------------------
/* V12.7: how far a house's front path and driveway may run before they would cross another house or its garden */
const REACH=new WeakMap();
function reachOf(H,h,all){const HX=H.HX,HZ=H.HZ,end=Math.max(HZ+6.2,h.front||0),boxes=[];
 for(const o of all){if(o===h)continue;const p=o.plot;if(p&&[p.x,p.z,p.w,p.d].every(Number.isFinite))boxes.push({x0:p.x-p.w/2,x1:p.x+p.w/2,z0:p.z-p.d/2,z1:p.z+p.d/2});boxes.push(H.boxWorld(o,-HX-.5,HX+.5,0,1,-HZ-.5,HZ+2));}
 for(let z=HZ+1.4;z<=end;z+=.25)for(const x of[-.6,0,.6,7.5,8.9,10.3]){const q=H.toWorld(h,x,0,z);if(boxes.some(b=>q.x>b.x0&&q.x<b.x1&&q.z>b.z0&&q.z<b.z1))return z;}
 return Infinity;}
let DRIVE_WORLD=null;/* V13.1: the world the drives are worked out in */
function build(scene){DRIVE_WORLD=scene?.world||null;
 const H=HS(),L=LK();if(!H||!L||!scene?.world?.houses?.length)return;if(scene.houseLook)dispose(scene);const T=scene.T,M=L.materials(T);
 for(const h of scene.world.houses){try{REACH.set(h,reachOf(H,h,scene.world.houses));}catch(e){}}
 const root3=new T.Group();root3.name='houses';scene.scene.add(root3);
 const paint=new T.MeshStandardMaterial({vertexColors:true,roughness:.6});const mat=key=>{if(key==='paint')return paint;const[base,tint]=key.split('|');return tint?L.tinted(T,M,base,tint):M[base];};
 const groups=new Map();for(const h of scene.world.houses){const k=h.district||'x';if(!groups.has(k))groups.set(k,[]);groups.get(k).push(h);}
 const clusters=[],list=[];
 for(const[k,hs]of groups){const ox=hs.reduce((s,h)=>s+h.x,0)/hs.length,oz=hs.reduce((s,h)=>s+h.z,0)/hs.length,shell=new L.Acc(T),det=new L.Acc(T),built=[];
  for(const h of hs){try{built.push({h,...buildHouse(T,h,shell,det,null,null,ox,oz)});}catch(e){scene.houseLookError=String(e&&e.stack||e);}}
  const group=new T.Group();group.name='houses:'+k;group.position.set(ox,0,oz);const sh=shell.build(mat,'house-shell',true),dt=det.build(mat,'house-detail',true)/* V13.6: garden trees, fences, mailboxes and the rest cast shadows too */;group.add(sh,dt);
  // panes: one instance per window, lit one by one at night
  const n=built.reduce((s,b)=>s+b.panes.length,0),glass=new T.MeshStandardMaterial({color:'#4a6470',roughness:.06,metalness:.85,envMapIntensity:1.3,emissive:'#ffcf8a',emissiveIntensity:0});
  glass.onBeforeCompile=q=>{q.vertexShader=q.vertexShader.replace('#include <common>','#include <common>\nattribute float aLit;\nvarying float vLit;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLit=aLit;');q.fragmentShader=q.fragmentShader.replace('#include <common>','#include <common>\nvarying float vLit;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=vLit;');};
  const pg=new T.PlaneGeometry(1,1),pm=new T.InstancedMesh(pg,glass,n),lit=new Float32Array(n);let i=0;for(const b of built){const on=(L.hash(b.h.id+'n')%3)>0;b.paneIdx=[];for(const m of b.panes){pm.setMatrixAt(i,m);lit[i]=on&&(L.hash(b.h.id+i)%2)?.8:0;b.paneIdx.push(i);i++;}}
  pg.setAttribute('aLit',new T.InstancedBufferAttribute(lit,1));pm.instanceMatrix.needsUpdate=true;sh.add(pm);
  // doors: one instance each, swung open about the hinge for the owner
  const doorM=new T.InstancedMesh(new T.BoxGeometry(.98,2.17,.06),new T.MeshStandardMaterial({color:'#ffffff',roughness:.55}),built.length);const col=new T.Color();
  built.forEach((b,j)=>{b.doorIdx=j;b.open=0;col.set((STYLE[b.h.style]||STYLE.stucco).door);doorM.setColorAt(j,col);doorM.setMatrixAt(j,doorMatrix(T,b,ox,oz,0));});doorM.instanceMatrix.needsUpdate=true;if(doorM.instanceColor)doorM.instanceColor.needsUpdate=true;group.add(doorM);
  root3.add(group);group.updateMatrixWorld(true);clusters.push({group,detail:dt,panes:pm,doors:doorM,glass,ox,oz,built,x0:Math.min(...hs.map(h=>h.x))-20,x1:Math.max(...hs.map(h=>h.x))+20,z0:Math.min(...hs.map(h=>h.z))-20,z1:Math.max(...hs.map(h=>h.z))+20});for(const b of built)list.push(b);}
 scene.houseLook={root:root3,clusters,list,hidden:null};}
function doorMatrix(T,b,ox,oz,open){const p=b.hinge;return new T.Matrix4().makeTranslation(p.x-ox,p.y+1.09,p.z-oz).multiply(new T.Matrix4().makeRotationY(b.yaw+open*PI/2*.92)).multiply(new T.Matrix4().makeTranslation(.5,0,0));}
function dispose(scene){const a=scene.houseLook;if(!a)return;a.root.removeFromParent();a.root.traverse(o=>{if(o.geometry)o.geometry.dispose();});scene.houseLook=null;}
function draw(scene){
 const a=scene.houseLook,sim=root.PlatdoCity?.sim,H=HS();if(!a||!sim||!H)return;const T=scene.T,cam=scene.camera.position,p=sim.player,dt=Math.min(.1,Math.max(0,(scene.time||0)-(a.t||0)));a.t=scene.time||0;
 const night=sim.dayTime<.27||sim.dayTime>.77,inside=H.houseAt(sim.world,p.x,p.y,p.z);
 for(const c of a.clusters){const dx=Math.max(c.x0-cam.x,0,cam.x-c.x1),dz=Math.max(c.z0-cam.z,0,cam.z-c.z1);c.detail.visible=Math.hypot(dx,dz)<250;c.glass.emissiveIntensity=night?1.2:0;
  let moved=false;for(const b of c.built){if(Math.abs(b.h.x-p.x)>30||Math.abs(b.h.z-p.z)>30){if(b.open>0){b.open=0;c.doors.setMatrixAt(b.doorIdx,doorMatrix(T,b,c.ox,c.oz,0));moved=true;}continue;}
   const mine=sim.onlineRoom?/* V10.8: online, the room's host says which front doors are open */!!sim.onlineHousesOpen?.includes(b.h.id):(H.owns(sim,b.h.id)||/* V10.7: Sandbox: every house is open */sim.profile?.mode==='sandbox'),door=H.toWorld(b.h,0,0,H.HZ),near=Math.hypot(p.x-door.x,p.z-door.z)<3.4&&Math.abs(p.y-b.h.y)<2.2;const want=mine&&(near||sim.onlineRoom)?1:0;
   if(b.doorBox===undefined)b.doorBox=sim.world.colliders.find(q=>q.id===b.h.id+':door')||null;if(b.doorBox)b.doorBox.enabled=!(mine&&b.open>.5);
   if(b.open!==want){b.open+=Math.sign(want-b.open)*Math.min(Math.abs(want-b.open),dt*2.2);c.doors.setMatrixAt(b.doorIdx,doorMatrix(T,b,c.ox,c.oz,b.open));moved=true;}}
  if(moved)c.doors.instanceMatrix.needsUpdate=true;}
 // hide the panes of the house you are in
 const key=inside?inside.house.id:null;if(key!==a.hidden){const zero=new T.Matrix4().makeScale(0,0,0);for(const c of a.clusters)for(const b of c.built){if(b.h.id!==key&&b.h.id!==a.hidden)continue;const hide=b.h.id===key;b.paneIdx.forEach((idx,k)=>c.panes.setMatrixAt(idx,hide?zero:b.panes[k]));c.panes.instanceMatrix.needsUpdate=true;}a.hidden=key;}}
root.CityHouseLook={build,draw,dispose,STYLE};
})(typeof globalThis!=='undefined'?globalThis:this);
