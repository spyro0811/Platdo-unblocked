
/* PLATDO City: the guardrail along Coast Boulevard (V5.6). Game only.
 * Where each 4 m length stands, and its solid box, is laid out by the beach module, which the multiplayer host
 * loads too, so everyone collides with the same rail. This file draws the rail and makes it break by the same
 * rule as the rails in Platdo Drive: a length gives way when a land vehicle meets it at 8.5 m/s or more, measured
 * straight into the rail. The vehicle keeps going with a share of the impact taken off its speed and takes a
 * knock; the length comes apart as two beams and a post that fly, fall and bounce; the gap stays open. Slower
 * contact meets a solid rail. Broken lengths are put back when the player is far away.
 * Single player only for now: in a multiplayer room the rail stays whole. */
(function(root){'use strict';
const TUNE={breakSpeed:8.5,resistance:.22,damage:.42,debrisLimit:96,debrisLife:24,launchMin:2.8,launchMax:8,restore:260};
const S={world:null,broken:new Set(),debris:[],revision:0,drawn:-1,scene:null,beams:null,posts:null,pieces:[],breaks:0};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function adopt(world){S.world=world;S.broken.clear();S.debris.length=0;S.revision++;for(const s of world.guardrails?.spans||[])if(s.collider)s.collider.enabled=true;}
function breakSpan(sim,G,span,v,impact,sign,first){
 S.broken.add(span.id);if(span.collider)span.collider.enabled=false;S.revision++;S.breaks++;
 const power=clamp(impact,0,40),seed=span.index*2.399,yaw=Math.PI/2,fx=1,fz=0;
 for(let i=0;i<3;i++){const along=i<2?(i-.5)*span.length*.5:-span.length*.4,phase=seed+i*2.19;
  S.debris.push({kind:i<2?'beam':'post',x:span.x+fx*along,y:span.y+(i<2?.69:.4),z:span.z+fz*along,length:i<2?span.length*.5:.78,rx:0,ry:yaw,rz:0,vx:(v.vx||0)*(.48+i*.06)+Math.sin(phase)*1.4,vy:clamp(2.2+power*.12+(i%2)*.8,TUNE.launchMin,TUNE.launchMax),vz:(v.vz||0)*(.48+i*.06)+Math.cos(phase)*1.4,wx:Math.sin(phase)*3,wz:Math.cos(phase)*3,wy:clamp((v.x-span.x)*(v.vz||0)*.1,-4,4),age:0,settled:false,bounces:0});}
 while(S.debris.length>TUNE.debrisLimit)S.debris.shift();
 /* as in Drive: the rail gives way before it can stop the car, so most of the forward speed is kept */
 if(!first)return;
 const speed=Math.hypot(v.vx||0,v.vz||0),k=clamp(1-TUNE.resistance*impact/Math.max(impact,speed,.01),.5,1);v.vx*=k;v.vz*=k;if(Number.isFinite(v.speed))v.speed*=k;
 try{const events=[];root.CityVehicles?.crashImpact?.(v,{id:span.id,speed:impact*TUNE.damage,normal:{x:0,y:0,z:-sign},point:{x:v.x,y:span.y+.5,z:span.z},material:'metal'},events);if(events.length)sim.vehicleEvents?.(v,events);}catch(error){S.error=String(error&&error.message||error);}
 try{sim.emit?.('railBreak',{id:span.id,impact,x:v.x,y:span.y+.6,z:span.z});}catch(error){}
}
function stepDebris(world,dt){
 const ground=(x,z)=>world.groundHeight(x,z);
 for(const p of S.debris){p.age+=dt;if(p.settled)continue;p.vy-=9.81*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rx+=p.wx*dt;p.ry+=p.wy*dt;p.rz+=p.wz*dt;
  const reach=p.length*.5,ax=Math.cos(p.rx),bx=Math.sin(p.rx),cy=Math.cos(p.ry),dy=Math.sin(p.ry),ez=Math.cos(p.rz),fz=Math.sin(p.rz),dx=(p.kind==='beam'?dy*ax:dy*bx*ez-cy*fz)*reach,dz=(p.kind==='beam'?cy*ax:dy*fz+cy*bx*ez)*reach,vertical=(p.kind==='beam'?-bx:ax*ez)*reach,floor=Math.max(ground(p.x,p.z),ground(p.x+dx,p.z+dz)-vertical,ground(p.x-dx,p.z-dz)+vertical)+.06;
  if(p.y<floor){p.y=floor;p.vy=Math.abs(p.vy)*.25;p.vx*=.71;p.vz*=.71;p.wx*=.56;p.wy*=.56;p.wz*=.56;p.bounces++;if(Math.hypot(p.vx,p.vy,p.vz)<.5||p.bounces>16){p.settled=true;p.vx=p.vy=p.vz=p.wx=p.wy=p.wz=0;}}}
 if(S.debris.some(p=>p.age>=TUNE.debrisLife))S.debris=S.debris.filter(p=>p.age<TUNE.debrisLife);
}
// Called once before each step of the simulation, so a length that is about to be hit hard is already open.
function step(sim,dt){
 const W=sim.world,G=W?.guardrails;if(!G)return;if(S.world!==W)adopt(W);
 for(const v of sim.vehicles){if(v.category!=='land'||v.workshopControlled||v.health<=0)continue;const vz=v.vz||0,into=Math.abs(vz);if(into<TUNE.breakSpeed)continue;for(const lineZ of G.lines||[G.z]){const dz=lineZ-v.z;if(dz*vz<=0||Math.abs(dz)>9)continue;
  const c=Math.abs(Math.cos(v.yaw||0)),s=Math.abs(Math.sin(v.yaw||0)),hl=(v.length||4.4)/2,hw=(v.width||1.8)/2,ez=c*hl+s*hw,ex=s*hl+c*hw,gap=Math.abs(dz)-ez-G.depth/2;if(gap>into*.05+.2||gap<-1.5)continue;
  let first=true;for(const span of G.spans){if(Math.abs(span.z-lineZ)>.05||S.broken.has(span.id)||Math.abs(span.x-v.x)>ex+span.length/2+.05)continue;if(v.y>span.y+G.height+.2||v.y+1.4<span.y)continue;breakSpan(sim,G,span,v,into,Math.sign(vz),first);first=false;}}}
 if(S.debris.length)stepDebris(W,dt);
 if(S.broken.size){const p=sim.player;for(const span of G.spans)if(S.broken.has(span.id)&&Math.hypot(span.x-p.x,span.z-p.z)>TUNE.restore){S.broken.delete(span.id);if(span.collider)span.collider.enabled=true;S.revision++;}}
}
// ---- drawing: every length is one beam and two posts in two instanced meshes; broken ones are scaled away
function build(scene){
 const T=scene.T,G=scene.world?.guardrails;dispose();S.scene=scene;S.drawnWorld=scene.world;if(!G||!G.spans.length)return;
 /* V9.0: the same rail as Platdo Drive: its W-shaped steel beam (the same profile and colours), one post per length
  * at the start of each length, and a reflector on every third post. Collision and breaking are unchanged. */
 const steel=new T.MeshStandardMaterial({color:'#a9afa5',roughness:.4,metalness:.58,side:T.DoubleSide}),post=new T.MeshStandardMaterial({color:'#797d73',roughness:.65,metalness:.3});
 const profile=[[-.045,-.135],[.045,-.07],[-.02,0],[.045,.07],[-.045,.135]],pos=[],ix=[];for(const z of[-.5,.5])for(const[x,y]of profile)pos.push(x,y,z);for(let j=0;j<4;j++)ix.push(j,j+1,j+5,j+1,j+6,j+5);
 const wbeam=new T.BufferGeometry();wbeam.setAttribute('position',new T.Float32BufferAttribute(pos,3));wbeam.setIndex(ix);wbeam.computeVertexNormals();
 S.beams=new T.InstancedMesh(wbeam,steel,G.spans.length);S.posts=new T.InstancedMesh(new T.BoxGeometry(.09,.78,.12),post,G.spans.length);
 const third=Math.ceil(G.spans.length/3);S.housings=new T.InstancedMesh(new T.BoxGeometry(.14,.12,.17),new T.MeshStandardMaterial({color:'#5b6660',roughness:.7,metalness:.2}),third);S.faces=new T.InstancedMesh(new T.BoxGeometry(.105,.075,.175),new T.MeshStandardMaterial({color:'#d8cfa8',roughness:.32,metalness:.15}),third);
 for(const m of[S.beams,S.posts,S.housings,S.faces]){m.frustumCulled=false;m.castShadow=m!==S.faces;m.receiveShadow=true;m.name='coast-guardrail';(scene.environment||scene.scene).add(m);}
 S.group=new T.Group();S.group.name='coast-guardrail-pieces';(scene.environment||scene.scene).add(S.group);S.pieceGeometry={beam:wbeam.clone(),post:new T.BoxGeometry(.09,1,.12)};S.materials={beam:steel,post};S.drawn=-1;}
function dispose(){for(const m of[S.beams,S.posts,S.housings,S.faces,S.group]){if(!m)continue;m.removeFromParent();m.geometry?.dispose?.();}for(const g of Object.values(S.pieceGeometry||{}))g.dispose();S.beams=S.posts=S.housings=S.faces=S.group=null;S.pieces=[];S.pieceGeometry=null;}
function draw(scene){
 const G=scene.world?.guardrails;if(!G)return;if(S.scene!==scene||S.drawnWorld!==scene.world||!S.beams)build(scene);if(!S.beams)return;const T=scene.T;
 if(S.drawn!==S.revision){S.drawn=S.revision;const m=new T.Matrix4(),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2),p=new T.Vector3(),s=new T.Vector3();let r=0;
  /* the spans run along x: the beam's length (its local z) is turned onto x, as Drive turns it onto the road */
  G.spans.forEach((span,i)=>{const gone=S.broken.has(span.id);p.set(span.x,span.y+.695,span.z-.03-(i%2)*.004/* lapped joints: every other length 4 mm forward, so the overlaps never share a plane */);s.set(gone?0:1,gone?0:1,gone?0:span.length+.02);m.compose(p,q,s);S.beams.setMatrixAt(i,m);
   p.set(span.x-span.length/2+.1,span.y+.37,span.z+.05);s.set(gone?0:1,gone?0:1,gone?0:1);m.compose(p,q,s);S.posts.setMatrixAt(i,m);
   if(i%3===0&&r<S.housings.count){p.set(span.x-span.length/2+.1,span.y+.84,span.z+.05);m.compose(p,q,s);S.housings.setMatrixAt(r,m);S.faces.setMatrixAt(r,m);r++;}});
  for(const x of[S.beams,S.posts,S.housings,S.faces])x.instanceMatrix.needsUpdate=true;}
 // flying and fallen pieces
 const pieces=S.pieces;while(pieces.length<S.debris.length){const mesh=new T.Mesh(S.pieceGeometry.beam,S.materials.beam);mesh.castShadow=true;S.group.add(mesh);pieces.push(mesh);}
 for(let i=0;i<pieces.length;i++){const mesh=pieces[i],d=S.debris[i];if(!d){mesh.visible=false;continue;}mesh.visible=true;const kind=d.kind==='beam'?'beam':'post';if(mesh.geometry!==S.pieceGeometry[kind]){mesh.geometry=S.pieceGeometry[kind];mesh.material=S.materials[kind];}mesh.position.set(d.x,d.y,d.z);mesh.rotation.set(d.rx,d.ry,d.rz,'YXZ');if(kind==='beam')mesh.scale.set(1,1,d.length);else mesh.scale.set(1,d.length,1);}
}
root.CityGuardrails={TUNE,state:S,step,draw,adopt};
})(typeof window!=='undefined'?window:globalThis);
