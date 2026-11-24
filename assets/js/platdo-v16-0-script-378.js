
/* PLATDO City push doors (V5.2). Game only.
 * Shop, restaurant and store doors used to stand open. Now each doorway has two glass leaves that hang closed.
 * Anyone who walks into a leaf pushes it out of the way; a spring pulls it back, so it swings past the middle a
 * couple of times and settles. The player holds both hands out while pushing (player.pushDoor, drawn in
 * people-6-anim.js).
 * The leaves never block anybody: the doorway itself was always open for movement and still is, so nothing
 * changes for the multiplayer host. A door that is really shut (a 6-7 closed after a robbery) stays shut.
 * Roller doors (garages, hangars, warehouses) and the homes' own doors are not touched. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const SPRING=15,DAMP=2.5,LIMIT=1.72,REACH=.44;
const eligible=s=>!!s&&!['garage','warehouse','hangar'].includes(s.type)&&!s.customHome&&!s.customMansion&&!s.customWorkshop;
// Two leaves, each on its own hinge. A leaf is drawn along its local +x from the hinge.
function build(scene,s,d,A){
 const T=scene.T,p=A?.design?A.design(s):{},frame=p.frame||'#3b4a4f',metal='#c9cdc8',g=new T.Group(),L=d.w/2-.03,h=d.h-.06;
 g.name='architecture-door:'+s.id;g.position.set(d.x,d.y,d.z+.1);
 const leaf=()=>{const pivot=new T.Group(),b=scene.batch(),box=(c,x,y,z,w,hh,dd,kind='arch30-metal')=>scene.box(b,c,x,y,z,w,hh,dd,0,kind);
  for(const x of[.05,L-.05])box(frame,x,h/2,0,.1,h,.07);for(const y of[.05,h-.05])box(frame,L/2,y,0,L,.1,.07);box(frame,L/2,.3,0,L-.16,.4,.05);
  scene.part(b,'panel','#bbd1c8',L/2,h/2+.2,0,L-.2,h-.7,1,0,0,0,'arch30-glass');
  /* a push bar on each side and a plate to kick */for(const z of[-.07,.07]){box(metal,L/2,1.05,z,L-.34,.05,.04);for(const x of[.22,L-.22])box(metal,x,1.05,z*.6,.04,.05,.06);}box(metal,L/2,.16,.04,L-.2,.2,.012);box(metal,L/2,.16,-.04,L-.2,.2,.012);
  scene.bake(b,pivot);return pivot;};
 const left=leaf(),right=leaf();left.position.set(-d.w/2+.015,0,0);right.position.set(d.w/2-.015,0,0);right.rotation.y=Math.PI;g.add(left,right);
 g.userData.swingDoor={left,right,L,a:[0,0],v:[0,0],clack:0};return g;
}
// One frame of the two leaves: who is touching them, the spring, and the drawn angles.
function pose(m,d,sim,dt){
 const q=m.userData.swingDoor;if(!q||!sim)return;const p=sim.player,near=Math.hypot(p.x-d.x,p.z-d.z)<16,shut=d.open===false||d.locked;
 if(!near&&Math.abs(q.a[0])+Math.abs(q.a[1])+Math.abs(q.v[0])+Math.abs(q.v[1])<.002){q.a[0]=q.a[1]=q.v[0]=q.v[1]=0;m.userData.swingDoor.left.rotation.y=0;m.userData.swingDoor.right.rotation.y=Math.PI;return;}
 const actors=[];if(near&&!shut){const add=a=>{if(a&&a.health>0&&!a.vehicleId&&Math.abs((a.y||0)-d.y)<1.6&&Math.abs(a.x-d.x)<d.w/2+1.2&&Math.abs(a.z-d.z)<2.4)actors.push(a);};if(p.mode==='onFoot'||p.mode==='crouching')add(p);for(const n of sim.npcs||[])add(n);for(const n of sim.sessionPeers||[])add(n);}
 const hz=d.z+.1,hinges=[d.x-d.w/2+.015,d.x+d.w/2-.015],steps=Math.max(1,Math.ceil(Math.min(dt,.05)/.008)),h=Math.min(dt,.05)/steps;let pushing=0;
 for(let s=0;s<steps;s++)for(let i=0;i<2;i++){const sign=i?-1:1,th=q.a[i],ux=sign*Math.cos(th),uz=-Math.sin(th),nx=-sign*Math.sin(th),nz=-Math.cos(th);let torque=0;
  for(const a of actors){const qx=a.x-hinges[i],qz=a.z-hz,t=qx*ux+qz*uz,side=qx*nx+qz*nz;if(t<.12||t>q.L+.3)continue;const pen=REACH-Math.abs(side);if(pen<=0)continue;
   /* on which side of the leaf the person is; dead centre, push it inward */const way=Math.abs(side)>.02?Math.sign(side):-1,arm=Math.max(.45,t);
   torque-=way*pen*150/arm;q.a[i]-=way*pen/arm*.35;if(a===p)pushing=Math.max(pushing,clamp(pen/REACH*2.2,0,1));}
  if(shut){q.v[i]+=(-60*th-12*q.v[i])*h;}else q.v[i]+=(torque-SPRING*th-DAMP*q.v[i])*h;q.v[i]=clamp(q.v[i],-9,9);q.a[i]+=q.v[i]*h;
  if(Math.abs(q.a[i])>LIMIT){q.a[i]=Math.sign(q.a[i])*LIMIT;q.v[i]*=-.25;}}
 q.left.rotation.y=q.a[0];q.right.rotation.y=Math.PI-q.a[1];
 // hands out while the player is against a leaf, and for a moment before reaching one
 // (the player's speed is taken from where they were last frame: their own velocity fields are not kept while walking)
 const dz=p.z-d.z,vz=(p.z-(q.pz??p.z))/Math.max(dt,.001);q.pz=p.z;const inLine=p.mode==='onFoot'&&Math.abs(p.x-d.x)<d.w/2+.15&&!shut,coming=inLine&&Math.abs(dz)<1.8&&dz*vz<-.2,through=inLine&&Math.abs(dz)<.95&&Math.abs(vz)>.3;
 /* the scene is handed a copy of the player made for drawing; the flag has to go on the real one */
 if(near){const want=Math.max(pushing,coming||through?1:0),real=root.PlatdoCity?.sim?.player||p;real.pushDoorWant=Math.max(real.pushDoorWant||0,want);}
}
// Called once a frame after every door has been posed: eases the player's hands out and back.
function hands(sim,dt){const p=root.PlatdoCity?.sim?.player||sim?.player;if(!p||!(dt>0))return;const want=p.pushDoorWant||0;p.pushDoorWant=0;const now=mix(p.pushDoor||0,want,1-Math.exp(-dt*(want>(p.pushDoor||0)?16:4.5)));if(now<.01)delete p.pushDoor;else p.pushDoor=now;}
root.CityDoors={eligible,build,pose,hands};
})(typeof window!=='undefined'?window:globalThis);
