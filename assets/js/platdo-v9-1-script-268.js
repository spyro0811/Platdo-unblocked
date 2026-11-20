
/* PLATDO City: the look of the roadsides and the hills (V9.1). Game only: where things stand, and every solid part,
 * is laid out by world.js, which the multiplayer host runs too.
 * Draws the stone retaining walls beside the hill roads (one mesh for all of them), the two lookouts (deck, rails,
 * benches, a coin telescope, columns, a name board), a speed limit sign at each end of every named road and every
 * 300 m along it (one mesh for every sign face), and shrubs along the hill roads.
 * No two faces share a plane: rails stop inside the corner posts and run below the post tops, legs and posts sink
 * 2 cm into what they stand on, and every sign face is 2 cm in front of its backing. */
(function(root){'use strict';
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const MPH=ms=>clamp(Math.round(ms*2.237/5)*5,15,50),VALUES=[15,20,25,30,35,40,45,50];
function hash(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function rng(seed){let s=seed>>>0||1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}

/* ---- Retaining walls ----------------------------------------------------------------------------------------- */
function stoneTexture(T){
 const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d'),R=rng(71);
 g.fillStyle='#5f5a51';g.fillRect(0,0,256,128);
 for(let row=0;row<4;row++){const y=row*32,off=row%2?32:0;for(let x=-64+off;x<256;x+=64){const v=124+Math.floor(R()*40),warm=Math.floor(R()*12);
  g.fillStyle=`rgb(${v+warm},${v-4},${v-14})`;g.fillRect(x+2,y+2,60,28);
  for(let k=0;k<7;k++){g.fillStyle=`rgba(58,52,44,${.10+R()*.14})`;g.fillRect(x+5+R()*48,y+5+R()*19,2+R()*7,2+R()*3);}
  g.fillStyle='rgba(255,250,235,.10)';g.fillRect(x+2,y+2,60,3);}}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
function buildWalls(scene){
 const T=scene.T,walls=scene.world.retainingWalls||[];if(!walls.length)return null;
 const pos=[],nor=[],uv=[],U=4.8,V=2.4;
 // a quad a-b-c-d with a normal for each corner; the winding is turned to face along the normals
 const quad=(P,N,W)=>{const[a,b,c]=P,e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]],m=N[0];
  const order=n[0]*m[0]+n[1]*m[1]+n[2]*m[2]<0?[0,2,1,0,3,2]:[0,1,2,0,2,3];for(const i of order){pos.push(...P[i]);nor.push(...N[i]);uv.push(...W[i]);}};
 for(const wall of walls){const Q=wall.points;let run=0;
  const at=(q,off,y)=>[q.cx+q.nx*off,y,q.cz+q.nz*off];
  for(let i=0;i<Q.length;i++){const q=Q[i],base=q.y-.6,top=q.y+q.h;
   if(i>0){const p=Q[i-1],pb=p.y-.6,pt=p.y+p.h,step=Math.hypot(q.x-p.x,q.z-p.z),u0=run/U,u1=(run+step)/U;run+=step;
    const fp=[-p.nx,0,-p.nz],fq=[-q.nx,0,-q.nz];
    // the face toward the road
    quad([at(p,p.f,pb),at(q,q.f,base),at(q,q.f,top),at(p,p.f,pt)],[fp,fq,fq,fp],[[u0,0],[u1,0],[u1,(top-base)/V],[u0,(pt-pb)/V]]);
    // the level top, back to where the ground meets it
    quad([at(p,p.f,pt),at(q,q.f,top),at(q,q.b,top),at(p,p.b,pt)],[[0,1,0],[0,1,0],[0,1,0],[0,1,0]],[[u0,0],[u1,0],[u1,(q.b-q.f)/V],[u0,(p.b-p.f)/V]]);
    // the back, in the ground
    quad([at(p,p.b,pt),at(q,q.b,top),at(q,q.b,base),at(p,p.b,pb)],[[p.nx,0,p.nz],[q.nx,0,q.nz],[q.nx,0,q.nz],[p.nx,0,p.nz]],[[u0,0],[u1,0],[u1,1],[u0,1]]);}
   // the two ends
   if(i===0||i===Q.length-1){const s=i===0?-1:1,n=[q.tx*s,0,q.tz*s];quad([at(q,q.f,base),at(q,q.b,base),at(q,q.b,top),at(q,q.f,top)],[n,n,n,n],[[0,0],[(q.b-q.f)/U,0],[(q.b-q.f)/U,(top-base)/V],[0,(top-base)/V]]);}
  }}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeBoundingSphere();g.computeBoundingBox();
 const mesh=new T.Mesh(g,new T.MeshStandardMaterial({map:stoneTexture(T),color:'#ffffff',roughness:.93,metalness:0}));mesh.name='v91-retaining-walls';mesh.castShadow=true;mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;mesh.updateMatrix();
 scene.environment.add(mesh);return mesh;
}

/* ---- Lookouts ------------------------------------------------------------------------------------------------ */
function boardTexture(T,L){
 const c=document.createElement('canvas');c.width=512;c.height=320;const g=c.getContext('2d');
 g.fillStyle='#2f4d3c';g.fillRect(0,0,512,320);g.strokeStyle='#e9e2c8';g.lineWidth=8;g.strokeRect(12,12,488,296);
 g.fillStyle='#f3ecd3';g.textAlign='center';g.textBaseline='middle';g.font='700 46px sans-serif';g.fillText(L.name,256,92,450);
 g.font='500 32px sans-serif';g.fillText('Elevation '+Math.round(L.top)+' m',256,168,450);
 g.font='italic 26px sans-serif';g.fillStyle='#d8d0b4';g.fillText(L.face==='south'?'Platdo City and the sea':'The west coast and the open sea',256,236,450);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
function buildLookouts(scene,b){
 const T=scene.T,out=[];
 for(const L of scene.world.lookouts||[]){const{x,z,w,d,top}=L,S=L.face==='south';
  // the deck, with a darker kerb strip set into its road edge
  scene.box(b,'#b8b2a3',x,top-.175,z,w,.35,d);
  // rails: corner posts, posts about every 1.8 m, a top rail and a middle rail
  const sides=S?[[[x-w/2+.06,z+d/2-.06],[x+w/2-.06,z+d/2-.06]],[[x+w/2-.06,z-d/2+.4],[x+w/2-.06,z+d/2-.06]],[[x-w/2+.06,z-d/2+.4],[x-w/2+.06,z+d/2-.06]]]
                 :[[[x-w/2+.06,z-d/2+.06],[x-w/2+.06,z+d/2-.06]],[[x-w/2+.06,z-d/2+.06],[x+w/2-.4,z-d/2+.06]],[[x-w/2+.06,z+d/2-.06],[x+w/2-.4,z+d/2-.06]]];
  const corners=new Set();
  for(const[a,c]of sides){const len=Math.hypot(c[0]-a[0],c[1]-a[1]),yaw=Math.atan2(c[0]-a[0],c[1]-a[1]),n=Math.max(1,Math.round(len/1.8));
   for(const p of[a,c]){const k=p[0].toFixed(2)+','+p[1].toFixed(2);if(corners.has(k))continue;corners.add(k);scene.box(b,'#3e4a4c',p[0],top+.55,p[1],.1,1.14,.1,0,'metal');}
   for(let i=1;i<n;i++){const t=i/n;scene.box(b,'#4a575a',a[0]+(c[0]-a[0])*t,top+.54,a[1]+(c[1]-a[1])*t,.08,1.12,.08,yaw,'metal');}
   const mx=(a[0]+c[0])/2,mz=(a[1]+c[1])/2;scene.box(b,'#56646a',mx,top+1.04,mz,.06,.06,len,yaw,'metal');scene.box(b,'#56646a',mx,top+.55,mz,.04,.04,len,yaw,'metal');}
  // columns down to the ground
  for(const c of L.columns){const h=top-.33-c.y;scene.box(b,'#a9a396',c.x,c.y+h/2,c.z,.5,h,.5);}
  // benches: slats on two frames, facing the view
  for(const bench of L.benches){const cos=Math.cos(bench.yaw),sin=Math.sin(bench.yaw),P=(lx,lz)=>[bench.x+lx*cos+lz*sin,bench.z-lx*sin+lz*cos];
   const piece=(color,lx,y,lz,sw,sh,sd,kind='matte')=>{const[px,pz]=P(lx,lz);scene.box(b,color,px,top+y,pz,sw,sh,sd,bench.yaw,kind);};
   for(const side of[-1,1]){piece('#3d4446',side*.85,.215,0,.06,.47,.6,'metal');piece('#3d4446',side*.85,.67,-.3,.05,.45,.06,'metal');}
   for(const lz of[-.15,0,.15])piece('#a2875f',0,.45,lz,2,.04,.12);
   for(const y of[.66,.81])piece('#a2875f',0,y,-.3,2,.1,.03);}
  // the coin telescope, looking out
  {const s=L.scope,yaw=S?0:-Math.PI/2,fx=Math.sin(yaw),fz=Math.cos(yaw);scene.cylinder(b,'#3b4a50',s.x,top+.01,s.z,.18,.04);scene.cylinder(b,'#4b5c62',s.x,top+.52,s.z,.06,1.0);
   scene.part(b,'cylinder','#5f7378',s.x,top+1.08,s.z,.26,.22,.26,0,0,0,'metal');
   /* a cylinder stands on y; turned a quarter round x and back round z by the yaw, it lies along the view */
   scene.part(b,'cylinder','#2f3d42',s.x+fx*.08,top+1.2,s.z+fz*.08,.16,.62,.16,Math.PI/2,0,-yaw,'metal');
   scene.part(b,'cylinder','#1f2a2e',s.x-fx*.28,top+1.2,s.z-fz*.28,.1,.12,.1,Math.PI/2,0,-yaw,'metal');}
  // the name board on two posts, its face 2 cm in front of its backing
  {const s=L.sign,fx=Math.sin(s.yaw),fz=Math.cos(s.yaw),rx=Math.cos(s.yaw),rz=-Math.sin(s.yaw),gy=scene.world.terrainHeight?Math.max(scene.world.terrainHeight(s.x,s.z),top-.02):top-.02;
   for(const side of[-1,1])scene.cylinder(b,'#4b3f33',s.x+rx*side*.62-fx*.11,gy+.9,s.z+rz*side*.62-fz*.11,.05,1.84);
   scene.box(b,'#24382d',s.x-fx*.06,gy+1.3,s.z-fz*.06,1.68,1.08,.04,s.yaw);
   const tex=boardTexture(T,L),face=new T.Mesh(new T.PlaneGeometry(1.6,1),new T.MeshStandardMaterial({map:tex,roughness:.8}));face.position.set(s.x-fx*.06+fx*.04,gy+1.3,s.z-fz*.06+fz*.04);face.rotation.y=s.yaw;face.name='v91-lookout-board:'+L.id;face.castShadow=false;face.receiveShadow=true;scene.environment.add(face);out.push(face);}
 }
 return out;
}

/* ---- Speed limit signs --------------------------------------------------------------------------------------- */
function signAtlas(T){
 const c=document.createElement('canvas');c.width=512;c.height=320;const g=c.getContext('2d');
 VALUES.forEach((v,i)=>{const x=(i%4)*128,y=Math.floor(i/4)*160;g.fillStyle='#f4f4ef';g.fillRect(x,y,128,160);g.strokeStyle='#111';g.lineWidth=5;g.strokeRect(x+8,y+8,112,144);
  g.fillStyle='#111';g.textAlign='center';g.textBaseline='middle';g.font='700 21px sans-serif';g.fillText('SPEED',x+64,y+32);g.fillText('LIMIT',x+64,y+56);g.font='800 62px sans-serif';g.fillText(String(v),x+64,y+110);});
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
function buildSpeedSigns(scene,b){
 const T=scene.T,world=scene.world,roads=world.roads||[],pos=[],uv=[],nor=[],placed=[];
 const along=(P,s)=>{let acc=0;for(let i=1;i<P.length;i++){const a=P[i-1],c=P[i],l=Math.hypot(c.x-a.x,c.z-a.z);if(acc+l>=s||i===P.length-1){const t=clamp((s-acc)/(l||1),0,1);return{x:a.x+(c.x-a.x)*t,y:a.y+(c.y-a.y)*t,z:a.z+(c.z-a.z)*t,tx:(c.x-a.x)/(l||1),tz:(c.z-a.z)/(l||1)};}acc+=l;}return null;};
 const clear=(x,z,own)=>roads.every(r=>{if(r===own)return true;const dx=r.b.x-r.a.x,dz=r.b.z-r.a.z,t=clamp(((x-r.a.x)*dx+(z-r.a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-r.a.x-dx*t,z-r.a.z-dz*t)>r.width/2+1.2;})
  &&(world.services||[]).every(s=>Math.abs(x-s.x)>s.w/2+1||Math.abs(z-s.z)>s.d/2+1)&&(world.lookouts||[]).every(L=>Math.abs(x-L.x)>L.w/2+2||Math.abs(z-L.z)>L.d/2+2)&&placed.every(p=>Math.hypot(p.x-x,p.z-z)>25);
 for(const path of world.roadPaths||[]){const P=path.points;if(!P||P.length<2)continue;let length=0;for(let i=1;i<P.length;i++)length+=Math.hypot(P[i].x-P[i-1].x,P[i].z-P[i-1].z);if(length<70)continue;
  const own=roads.filter(r=>r.pathId===path.id),hw=path.width/2;
  const stations=[];for(let s=12;s<length-30;s+=300)stations.push([s,1]);for(let s=length-12;s>30;s-=300)stations.push([s,-1]);
  for(const[s,dir]of stations){const p=along(P,s);if(!p)continue;const tx=p.tx*dir,tz=p.tz*dir,x=p.x-tz*(hw+1.9),z=p.z+tx*(hw+1.9);
   let road=null,best=1e9;for(const r of own){const dx=r.b.x-r.a.x,dz=r.b.z-r.a.z,t=clamp(((x-r.a.x)*dx+(z-r.a.z)*dz)/(dx*dx+dz*dz||1),0,1),dd=Math.hypot(x-r.a.x-dx*t,z-r.a.z-dz*t);if(dd<best){best=dd;road=r;}}
   if(!road||!road.speed||!clear(x,z,road))continue;const gy=world.terrainHeight?world.terrainHeight(x,z):p.y;if(!(gy>-.2)||Math.abs(gy-p.y)>1.2)continue;
   placed.push({x,z});const value=MPH(road.speed),cell=Math.max(0,VALUES.indexOf(value)),yaw=Math.atan2(-tx,-tz),fx=Math.sin(yaw),fz=Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw),cy=gy+2.15;
   scene.cylinder(b,'#8d9799',x,gy+1.22,z,.04,2.5);scene.box(b,'#9ea5a6',x+fx*.05,cy,z+fz*.05,.64,.8,.03,yaw,'metal');
   // the face: a quad 2 cm in front of the backing, its picture from the atlas
   const c=[x+fx*.085,cy,z+fz*.085],W=.3,H=.38,u0=(cell%4)/4,u1=u0+.25,v1=1-Math.floor(cell/4)*.5,v0=v1-.5,
    BL=[c[0]-rx*W,c[1]-H,c[2]-rz*W],BR=[c[0]+rx*W,c[1]-H,c[2]+rz*W],TR=[c[0]+rx*W,c[1]+H,c[2]+rz*W],TL=[c[0]-rx*W,c[1]+H,c[2]-rz*W];
   for(const[q,t]of[[BL,[u0,v0]],[BR,[u1,v0]],[TR,[u1,v1]],[BL,[u0,v0]],[TR,[u1,v1]],[TL,[u0,v1]]]){pos.push(...q);uv.push(...t);nor.push(fx,0,fz);}}}
 if(!pos.length)return{mesh:null,count:0};
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeBoundingSphere();
 const mesh=new T.Mesh(g,new T.MeshStandardMaterial({map:signAtlas(T),roughness:.55}));mesh.name='v91-speed-signs';mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;mesh.updateMatrix();scene.environment.add(mesh);
 return{mesh,count:placed.length};
}

/* ---- Shrubs along the hill roads ----------------------------------------------------------------------------- */
const SHRUB_ROADS=new Set(['Verdant Serpentine','Relay Spur','Scenic Pass','Mountain Link']),LEAF=['#4f7a3e','#5d8848','#6a8f4c','#557144','#748f50'];
function buildShrubs(scene,b){
 const world=scene.world,roads=world.roads||[],walls=world.retainingWalls||[];let count=0;
 const wallNear=(x,z)=>walls.some(w=>w.points.some(q=>Math.hypot(q.cx-x,q.cz-z)<q.b+2&&Math.hypot(q.x-x,q.z-z)<q.b-q.f+4));
 const clear=(x,z)=>roads.every(r=>{const dx=r.b.x-r.a.x,dz=r.b.z-r.a.z,t=clamp(((x-r.a.x)*dx+(z-r.a.z)*dz)/(dx*dx+dz*dz||1),0,1);return Math.hypot(x-r.a.x-dx*t,z-r.a.z-dz*t)>r.width/2+3.4;})
  &&(world.lookouts||[]).every(L=>Math.abs(x-L.x)>L.w/2+3||Math.abs(z-L.z)>L.d/2+3)&&(world.services||[]).every(s=>Math.abs(x-s.x)>s.w/2+2||Math.abs(z-s.z)>s.d/2+2);
 for(const path of world.roadPaths||[]){if(!SHRUB_ROADS.has(path.name))continue;const P=path.points,hw=path.width/2,R=rng(hash(path.id||path.name));
  let acc=0;for(let i=1;i<P.length;i++){const a=P[i-1],c=P[i],l=Math.hypot(c.x-a.x,c.z-a.z),tx=(c.x-a.x)/(l||1),tz=(c.z-a.z)/(l||1);
   for(let s=(9-acc%9)%9;s<l;s+=9){const px=a.x+tx*s,pz=a.z+tz*s;
    for(const side of[-1,1]){const roll=R(),off=hw+4.6+R()*2.6,jit=(R()-.5)*3;if(roll>.34)continue;const x=px-tz*off*side+tx*jit,z=pz+tx*off*side+tz*jit;
     if(!clear(x,z)||wallNear(x,z))continue;const gy=world.terrainHeight(x,z);if(!(gy>.3))continue;
     const n=3+Math.floor(R()*3),size=.9+R()*.8,G=LEAF[Math.floor(R()*LEAF.length)];count++;
     for(let k=0;k<n;k++){const ang=R()*TAU,r=k?size*(.35+R()*.3):0,sc=size*(k?.65+R()*.3:1);scene.part(b,'flora-leaf',k%2?LEAF[(LEAF.indexOf(G)+1)%LEAF.length]:G,x+Math.cos(ang)*r,gy+sc*.32,z+Math.sin(ang)*r,sc*1.2,sc*.9,sc*1.2,0,R()*TAU,0,'foliage');}}}
   acc+=l;}}
 return count;
}

function build(scene){
 const S={walls:null,boards:[],signs:0,shrubs:0};
 try{S.walls=buildWalls(scene);}catch(e){console.warn('PLATDO roadside walls',e);}
 const b=scene.batch();
 try{S.boards=buildLookouts(scene,b);}catch(e){console.warn('PLATDO lookouts',e);}
 try{const r=buildSpeedSigns(scene,b);S.signs=r.count;S.signMesh=r.mesh;}catch(e){console.warn('PLATDO speed signs',e);}
 try{S.shrubs=buildShrubs(scene,b);}catch(e){console.warn('PLATDO shrubs',e);}
 scene.bake(b,scene.environment);scene.roadside=S;return S;
}
root.CityRoadside={build,MPH};
})(typeof globalThis!=='undefined'?globalThis:this);
