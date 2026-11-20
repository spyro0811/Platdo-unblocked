
/* Small optional sandbox-style physical actions. Cosmetic effects do not persist in saves. */
(function(root,factory){const api=factory(root);if(typeof module==='object')module.exports=api;root.CityStreetActions=api;if(root.CitySimulation)api.install(root.CitySimulation.Simulation,root.CityScene);})(typeof window==='undefined'?globalThis:window,function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function state(sim){return sim.streetActions||(sim.streetActions={parts:[],serial:0});}
function canAct(sim){const p=sim.player;return p.health>0&&p.mode==='onFoot'&&p.grounded&&!p.transition&&!p.physical&&!p.ragdoll?.active&&!p.streetAction;}
function start(sim,kind){if(!['poop','urinate'].includes(kind)||!canAct(sim))return false;/* V8.1: only in Stinky Poopy Diaper Mode (PLATDO Settings) */if(root.Platdo?.diaperMode!==true)return false;sim.player.streetAction={kind,age:0,emitted:0,count:2+(root.CityConfig.hash(sim.uid('street-action'))%2),duration:kind==='poop'?2.3:3};sim.player.aiming=false;sim.cancelReload();sim.emit('streetAction',{kind});return true;}
function add(sim,kind,p,velocity,life=40){const s=state(sim);s.parts.push({id:++s.serial,sourceId:sim.player.id,kind,...p,...velocity,age:0,life:kind==='lump'?null:kind==='droplet'?120:life,sleeping:false,quiet:0,radius:kind==='lump'?LUMP:kind==='crumb'?.018:.014});}
/* V3.8: poop is drawn as soft logs and coils instead of round blobs, and it leaves brown marks: a splat with flecks where a
 * piece lands and a streak where it slides, the way pee already leaves a trail. Marks are ordinary parts of kind 'smear', so
 * multiplayer and Cleanup handle them like everything else here. */
const LUMP=.055,MARK_LIMIT=260;
const rand=(seed,n)=>{const v=Math.sin(seed*12.9898+n*78.233)*43758.5453;return v-Math.floor(v);};
function smear(s,o,x,y,z,radius,out){out.push({id:++s.serial,sourceId:o.sourceId,kind:'smear',x,y:y+.004,z,vx:0,vy:0,vz:0,age:0,life:75,sleeping:true,radius});}
function splatter(s,o,ground,out){
 const speed=Math.hypot(o.vx,o.vy,o.vz);
 if(!o.splatted&&speed>.6){o.splatted=true;o.markX=o.x;o.markZ=o.z;smear(s,o,o.x,ground,o.z,.036+rand(o.id,1)*.02,out);const count=4+Math.floor(rand(o.id,2)*4);for(let i=0;i<count;i++){const angle=rand(o.id,3+i)*Math.PI*2,reach=.07+rand(o.id,20+i)*.2*Math.min(1.5,speed/2.5);smear(s,o,o.x+Math.sin(angle)*reach,ground,o.z+Math.cos(angle)*reach,.006+rand(o.id,40+i)*.013,out);}}
 else if(o.splatted&&Math.hypot(o.vx,o.vz)>.2&&Math.hypot(o.x-o.markX,o.z-o.markZ)>.06){o.markX=o.x;o.markZ=o.z;smear(s,o,o.x,ground,o.z,.022,out);}
}
// A lumpy tube along a path, closed at both ends. Vertex colours carry the darker creases.
function poopTube(T,path,radius,rings,sides,seed,out){
 const p=new T.Vector3(),q=new T.Vector3(),tangent=new T.Vector3(),side=new T.Vector3(),up=new T.Vector3(),base=out.position.length/3;
 for(let i=0;i<=rings;i++){const t=i/rings;path(t,p);path(Math.min(1,t+.01),q);path(Math.max(0,t-.01),tangent);tangent.subVectors(q,tangent).normalize();side.set(tangent.z,0,-tangent.x);if(side.lengthSq()<1e-6)side.set(1,0,0);side.normalize();up.crossVectors(side,tangent).normalize();
  const taper=Math.pow(Math.sin(Math.min(1,Math.max(0,t))*Math.PI),.42),segment=1+.07*Math.sin(t*19+seed)+.05*Math.sin(t*37+seed*2.3),r=radius(t)*Math.max(.06,taper)*segment;
  for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2,bump=1+.06*Math.sin(a*3+t*9+seed),x=Math.cos(a)*r*bump,y=Math.sin(a)*r*bump*.92,shade=.66+.26*(segment-.88)/.24+.07*Math.sin(a*2+t*31+seed);
   out.position.push(p.x+side.x*x+up.x*y,p.y+side.y*x+up.y*y,p.z+side.z*x+up.z*y);out.color.push(shade,shade*.97,shade*.92);}}
 for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){const a=base+i*sides+j,b=base+i*sides+(j+1)%sides,c=a+sides,d=b+sides;out.index.push(a,c,b,b,c,d);}
}
function splatGeometry(T){const n=30,position=[0,0,0],index=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=.84+.10*Math.sin(a*2+1.3)+.07*Math.sin(a*3+.4)+.04*Math.sin(a*5+2.1);position.push(Math.sin(a)*r,0,Math.cos(a)*r);}for(let i=0;i<n;i++)index.push(0,1+i,1+(i+1)%n);const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));geometry.setIndex(index);geometry.computeVertexNormals();return geometry;}
function poopGeometry(T,variant=0){
 const out={position:[],color:[],index:[]},r=.029;
 if(variant%3===1){// a coiled pile, wider at the bottom and ending in a soft tip
  poopTube(T,(t,p)=>{const angle=t*Math.PI*2*2.2,reach=.052*(1-t*.82);p.set(Math.sin(angle)*reach,r*.92+t*.082,Math.cos(angle)*reach);},t=>r*(1.05-.5*t),44,9,3.1,out);
 }else if(variant%3===2){// two short pieces, one resting across the other
  poopTube(T,(t,p)=>p.set((t-.5)*.15,r*.9,.022*Math.sin(t*3.4)-.02),()=>r,18,9,5.7,out);
  poopTube(T,(t,p)=>p.set(.018+.03*Math.sin(t*2.6),r*.9+.045*Math.sin(t*Math.PI)*.9+.012,(t-.5)*.12+.012),()=>r*.9,16,9,8.3,out);
 }else poopTube(T,(t,p)=>p.set((t-.5)*.19,r*.9+.006*Math.sin(t*9),.034*Math.sin(t*Math.PI*1.15)-.017),()=>r,24,9,1.3,out);// one curved log
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(out.position,3));geometry.setAttribute('color',new T.Float32BufferAttribute(out.color,3));geometry.setIndex(out.index);geometry.computeVertexNormals();return geometry;
}
function cleanup(sim,kind='all'){if(!['all','poop','pee'].includes(kind))return 0;const s=state(sim),before=s.parts.length;const solid=p=>p.kind==='lump'||p.kind==='crumb'||p.kind==='smear';s.parts=s.parts.filter(p=>kind==='poop'?!solid(p):kind==='pee'?solid(p):false);return before-s.parts.length;}
function aimTarget(sim){const p=sim.player,fx=Math.sin(p.yaw),fz=Math.cos(p.yaw);let best=null,distance=.6096;for(const o of state(sim).parts){if(o.kind!=='lump'||(o.wetness||0)>=1)continue;const dx=o.x-p.x,dz=o.z-p.z,d=Math.hypot(dx,dz);if(d<.05||d>distance||Math.abs(o.y-p.y)>1||(dx*fx+dz*fz)/d<Math.cos(.7)||!sim.world.lineOfSight({...p,y:p.y+.86},o))continue;best=o;distance=d;}return best;}
function nearby(sim){const p=sim.player;return state(sim).parts.find(o=>o.kind==='lump'&&o.sleeping&&Math.hypot(o.x-p.x,o.z-p.z)<1.55&&Math.abs(o.y-p.y)<1&&sim.world.lineOfSight({...p,y:p.y+.7},o));}
function eat(sim){const lump=nearby(sim);if(!lump||!canAct(sim))return false;state(sim).parts=state(sim).parts.filter(o=>o!==lump);sim.player.streetAction={kind:'eat',age:0,duration:1.6,origin:{x:lump.x,y:lump.y,z:lump.z},crumbs:false};sim.emit('streetAction',{kind:'eat'});return true;}
function stepActor(sim,dt){if(sim.paused||dt<=0)return;const p=sim.player,a=p.streetAction;if(a){if(p.health<=0||p.physical||p.vehicleId){delete p.streetAction;}else{a.age+=dt;const f={x:Math.sin(p.yaw),z:Math.cos(p.yaw)};
 if(a.kind==='poop'){while(a.emitted<a.count&&a.age>=.6+a.emitted*.46){add(sim,'lump',{x:p.x-f.x*.24,y:p.y+.48,z:p.z-f.z*.24},{vx:-f.x*.3+(a.emitted%2?.1:-.1),vy:.1,vz:-f.z*.3});a.emitted++;}}
 if(a.kind==='urinate'&&a.age>.35&&a.age<2.65){a.emission=(a.emission||0)+dt;const target=aimTarget(sim);if(target){p.yaw=Math.atan2(target.x-p.x,target.z-p.z);f.x=Math.sin(p.yaw);f.z=Math.cos(p.yaw);}while(a.emission>1/24){a.emission-=1/24;const from={x:p.x+f.x*.16,y:p.y+.86,z:p.z+f.z*.16},flight=target?Math.sqrt(Math.max(.01,2*(from.y-target.y)/9.81)):0;add(sim,'droplet',from,target?{vx:(target.x-from.x)/flight,vy:0,vz:(target.z-from.z)/flight}:{vx:f.x*2.1,vy:.3,vz:f.z*2.1});}}
 if(a.kind==='eat'&&a.age>.8&&!a.crumbs){a.crumbs=true;for(let i=0;i<12;i++){const angle=i*Math.PI*2/12;add(sim,'crumb',{x:p.x+f.x*.22,y:p.y+1.44,z:p.z+f.z*.22},{vx:Math.sin(angle)*(.3+i%3*.18),vy:.3+(i%4)*.15,vz:Math.cos(angle)*.7},3.5);}sim.emit('streetCrunch');}
 if(a.age>=a.duration)delete p.streetAction;}}
}
function vehicleContact(sim,o){for(const v of sim.vehicles||[]){if(Math.hypot(o.x-v.x,o.z-v.z)>9)continue;const d=root.CityVehicles?.byId?.[v.typeId]||v,hw=(d.width||1.8)/2,hl=(d.length||4)/2,height=d.height||1.5,sy=Math.sin(v.yaw||0),cy=Math.cos(v.yaw||0),dx=o.x-v.x,dz=o.z-v.z,local={x:dx*cy-dz*sy,y:o.y-(v.y||0),z:dx*sy+dz*cy},closest={x:clamp(local.x,-hw,hw),y:clamp(local.y,.08,height),z:clamp(local.z,-hl,hl)};let nx=local.x-closest.x,ny=local.y-closest.y,nz=local.z-closest.z,dist=Math.hypot(nx,ny,nz);if(dist>=o.radius)continue;if(dist<.00001){const faces=[[hw-Math.abs(local.x),Math.sign(local.x)||1,0,0],[hl-Math.abs(local.z),0,0,Math.sign(local.z)||1],[height-local.y,0,1,0]].sort((a,b)=>a[0]-b[0]);const f=faces[0];nx=f[1];ny=f[2];nz=f[3];dist=-Math.max(0,f[0]);}else{nx/=dist;ny/=dist;nz/=dist;}const wx=nx*cy+nz*sy,wz=-nx*sy+nz*cy,push=o.radius-dist+.001;o.x+=wx*push;o.y+=ny*push;o.z+=wz*push;const speed=(o.vx-(v.vx||0))*wx+o.vy*ny+(o.vz-(v.vz||0))*wz;if(speed<0){o.vx-=speed*1.15*wx;o.vy-=speed*1.15*ny;o.vz-=speed*1.15*wz;}o.sleeping=false;}}
function stepParts(sim,dt){if(sim.paused||dt<=0)return;const s=state(sim),cell=.5,grid=new Map(),trails=[];
 const key=(x,z)=>Math.floor(x/cell)+':'+Math.floor(z/cell);
 for(const o of s.parts)if(o.kind==='lump'){const k=key(o.x,o.z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(o);}
 for(const o of s.parts){o.age+=dt;if(o.kind==='lump'||o.kind==='droplet')vehicleContact(sim,o);if(o.sleeping)continue;o.vy-=9.81*dt;const before={...o},m=sim.world.moveCapsule(o,{x:o.vx*dt,y:o.vy*dt,z:o.vz*dt},o.radius,o.radius*2);o.x=m.x;o.y=m.y;o.z=m.z;
  const dx=o.x-before.x,dy=o.y-before.y,dz=o.z-before.z,length2=dx*dx+dy*dy+dz*dz;
  // A spatial grid keeps unlimited settled props from creating an all-pairs loop.
  for(let ix=Math.floor(Math.min(before.x,o.x)/cell)-1;ix<=Math.floor(Math.max(before.x,o.x)/cell)+1;ix++)for(let iz=Math.floor(Math.min(before.z,o.z)/cell)-1;iz<=Math.floor(Math.max(before.z,o.z)/cell)+1;iz++)for(const target of grid.get(ix+':'+iz)||[]){
   if(target===o||o.absorbed)continue;const t=length2?clamp(((target.x-before.x)*dx+(target.y-before.y)*dy+(target.z-before.z)*dz)/length2,0,1):0,hit={x:before.x+t*dx-target.x,y:before.y+t*dy-target.y,z:before.z+t*dz-target.z},radius=target.radius*1.15+o.radius,d=Math.hypot(hit.x,hit.y,hit.z);
   if(d>radius)continue;
   if(o.kind==='droplet'&&(target.wetness||0)<1){target.wetness=Math.min(1,Math.round(((target.wetness||0)+.1)*10)/10);o.absorbed=true;continue;}
   const nx=d>.0001?hit.x/d:0,ny=d>.0001?hit.y/d:1,nz=d>.0001?hit.z/d:0;o.x=target.x+nx*(radius+.001);o.y=target.y+ny*(radius+.001);o.z=target.z+nz*(radius+.001);const toward=o.vx*nx+o.vy*ny+o.vz*nz;if(toward<0){o.vx-=toward*1.18*nx;o.vy-=toward*1.18*ny;o.vz-=toward*1.18*nz;}if(ny>.65&&Math.hypot(o.vx,o.vy,o.vz)<.22){o.sleeping=true;o.vx=o.vy=o.vz=0;}
  }
  if(o.absorbed)continue;
  const floor=sim.world.groundHeight(o.x,o.z,before.y)+o.radius;if(o.y<=floor+.01&&o.vy<0||m.contacts?.includes('y')&&o.vy<0){if(o.kind==='lump')splatter(s,o,floor-o.radius,trails);o.y=Math.max(o.y,floor);o.vy=-o.vy*(o.kind==='droplet'?.12:o.kind==='lump'?.08:.24);const friction=Math.exp(-dt*(o.kind==='droplet'?2.4:9));o.vx*=friction;o.vz*=friction;if(Math.abs(o.vy)<.3&&Math.hypot(o.vx,o.vz)<.06){o.sleeping=true;o.vx=o.vy=o.vz=0;}}
  if(m.contacts?.includes('x'))o.vx*=-.25;if(m.contacts?.includes('z'))o.vz*=-.25;
  if(o.kind==='droplet'&&o.y<=floor+.06&&(o.age-(o.trailAt||0))>.09){o.trailAt=o.age;trails.push({id:++s.serial,sourceId:o.sourceId,kind:'trail',x:o.x,y:floor-o.radius+.007,z:o.z,vx:0,vy:0,vz:0,age:0,life:45,sleeping:true,radius:.024});}
 }
 s.parts=s.parts.filter(o=>!o.absorbed&&(o.kind==='lump'||o.age<o.life));s.parts.push(...trails);
 let marks=0;for(const o of s.parts)if(o.kind==='smear')marks++;if(marks>MARK_LIMIT){let drop=marks-MARK_LIMIT;s.parts=s.parts.filter(o=>o.kind!=='smear'||drop--<=0);}
}
function step(sim,dt){stepActor(sim,dt);stepParts(sim,dt);}
function eatPrompt(sim){return canAct(sim)&&nearby(sim)?{action:'vehicle',text:'Eat'}:null;}
function dress(mesh,active){const rig=mesh?.userData.rig;if(!rig)return;if(root.CityPeopleModels?.setBareLegs&&rig.skinned){root.CityPeopleModels.setBareLegs(mesh,active);return;}if(active&&!rig.streetLegs){const T=root.THREE,hidden=[],skin=new T.MeshStandardMaterial({color:root.CityPeople.skinPalettes[rig.appearance.skin],roughness:.9}),legs=[];for(const name of['thighL','thighR','calfL','calfR']){const bone=rig[name];if(!bone)continue;for(const child of bone.children)if(child.isMesh){hidden.push({mesh:child,visible:child.visible});child.visible=false;}const leg=new T.Mesh(new T.CylinderGeometry(name.startsWith('thigh')?.079:.059,name.startsWith('thigh')?.067:.046,.39,8),skin);leg.position.y=-.2;leg.castShadow=true;bone.add(leg);legs.push(leg);}rig.streetLegs={hidden,legs,skin};}else if(!active&&rig.streetLegs){for(const e of rig.streetLegs.hidden)e.mesh.visible=e.visible;for(const leg of rig.streetLegs.legs){leg.removeFromParent();leg.geometry.dispose();}rig.streetLegs.skin.dispose();delete rig.streetLegs;}}
function render(scene,sim){const T=scene.T,s=state(sim);let view=scene.streetActionsView;if(!view){const group=new T.Group();group.name='street-action-particles';scene.dynamic.add(group);view=scene.streetActionsView={group,meshes:new Map(),geometry:new T.IcosahedronGeometry(1,1),logs:[0,1,2].map(v=>poopGeometry(T,v)),splat:splatGeometry(T),soft:Array.from({length:33},(_,i)=>new T.MeshStandardMaterial({color:new T.Color('#553621').lerp(new T.Color('#d5c54e'),i/32),roughness:.62-i/110,vertexColors:true})),smear:new T.MeshStandardMaterial({color:'#2c1a0c',roughness:.88,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),stains:Array.from({length:33},(_,i)=>new T.MeshStandardMaterial({color:new T.Color('#654328').lerp(new T.Color('#d5c54e'),i/32),roughness:1-i/64})),yellow:new T.MeshStandardMaterial({color:'#d5c54e',roughness:.24,transparent:true,opacity:.75})};}const live=new Set();for(const o of s.parts){live.add(o.id);let m=view.meshes.get(o.id);const seed=o.rotationSeed??o.id,wet=Math.round(clamp(o.wetness||0,0,1)*32),material=o.kind==='lump'?view.soft[wet]:o.kind==='crumb'?view.stains[wet]:o.kind==='smear'?view.smear:view.yellow;if(!m){m=new T.Mesh(o.kind==='lump'?view.logs[Math.abs(Math.round(seed))%view.logs.length]:o.kind==='smear'?view.splat:view.geometry,material);m.castShadow=o.kind==='lump';view.meshes.set(o.id,m);view.group.add(m);}else m.material=material;
  if(o.kind==='lump'){m.scale.setScalar(o.radius/LUMP);if(o.sleeping){m.position.set(o.x,o.y-o.radius,o.z);m.rotation.set(0,seed*2.4,0);}else{m.position.set(o.x,o.y-o.radius*.5,o.z);m.rotation.set(Math.sin(o.age*5+seed)*.5,seed*2.4+o.age*1.5,Math.cos(o.age*4+seed)*.4);}}
  else if(o.kind==='smear'){const a=seed*.37,b=seed*.73;m.position.set(o.x,o.y,o.z);m.scale.set(o.radius*(1+(a-Math.floor(a))*.8),1,o.radius*(.7+(b-Math.floor(b))*.5));m.rotation.set(0,seed*1.9,0);}
  else{m.position.set(o.x,o.y,o.z);m.scale.set(o.radius*1.25,['splash','trail'].includes(o.kind)?.006:o.radius,o.radius*.95);m.rotation.set(seed*.7,seed*1.2,o.sleeping?seed:o.age*2);}m.visible=scene.actorInView?.(o,.3,120)??true;}for(const[id,m]of view.meshes)if(!live.has(id)){m.removeFromParent();view.meshes.delete(id);}renderPose(scene.playerMesh,sim.player.streetAction);if(sim.onlineRoom)for(const person of sim.npcs){const mesh=scene.meshes.people.get(person.id)?.mesh;if(person.streetAction||mesh?.userData.rig?.streetLegs)renderPose(mesh,person.streetAction);}}
function renderPose(mesh,a){const rig=mesh?.userData.rig;dress(mesh,!!a&&a.kind!=='eat');if(!rig||!a)return;if(a.kind==='poop'){rig.pelvis.position.y=.47;rig.spine.rotation.x=.32;rig.thighL.rotation.x=rig.thighR.rotation.x=-1.18;rig.calfL.rotation.x=rig.calfR.rotation.x=1.52;}else if(a.kind==='eat'){const lift=clamp(a.age/.7,0,1);rig.armR.rotation.x=-1.1*lift;rig.forearmR.rotation.x=-1.25*lift;rig.head.rotation.x=.12;}}
function install(Sim,Scene){const p=Sim.prototype;if(p.__streetActions)return;p.__streetActions=true;const oldStep=p.step,oldPrompt=p.prompt,oldInteract=p.interact,oldRespawn=p.respawn,oldRestore=p.restore;
 p.step=function(dt,input={}){if(!this.paused){if(input.poopPressed)start(this,'poop');if(input.urinatePressed)start(this,'urinate');}const a=this.player.streetAction;oldStep.call(this,dt,a?{...input,/* V3.6: you can walk while peeing, at a stroll */moveX:a.kind==='urinate'?(input.moveX||0)*.55:0,moveZ:a.kind==='urinate'?(input.moveZ||0)*.55:0,sprint:false,fire:false,firePressed:false,aim:false,jumpPressed:false,vehiclePressed:false,crouch:a.kind==='poop'}:input);step(this,dt);};
 p.prompt=function(){return eatPrompt(this)||oldPrompt.call(this);};p.interact=function(){if(eat(this))return true;return oldInteract.call(this);};
 const oldEnter=p.enterVehicle;p.enterVehicle=function(v,...args){if(eat(this))return true;return oldEnter.call(this,v,...args);};
 p.respawn=function(...args){delete this.player.streetAction;return oldRespawn.apply(this,args);};p.restore=function(...args){this.streetActions=null;return oldRestore.apply(this,args);};
 if(Scene){const q=Scene.prototype,oldPeople=q.syncPeople,dispose=q.dispose;q.syncPeople=function(sim,dt){oldPeople.call(this,sim,dt);render(this,sim);};q.dispose=function(...args){const v=this.streetActionsView;if(v){v.geometry.dispose();v.logs?.forEach(g=>g.dispose());v.splat?.dispose();v.soft?.forEach(m=>m.dispose());v.smear?.dispose();v.stains.forEach(m=>m.dispose());v.yellow.dispose();v.group.removeFromParent();this.streetActionsView=null;}return dispose.apply(this,args);};}
}
return{install,start,step,stepActor,stepParts,nearby,eat,eatPrompt,state,cleanup,aimTarget,poopGeometry};
});

