
/* PLATDO City parked cars (V4.9). The cars in the beach car park and the trucks in the motocross paddock were
 * scenery: a picture of a car with a solid box in it. They are real cars now.
 * - spots(): every parked scenery car, where it stands and what it is.
 * - step(): runs wherever the world is decided (the single-player game and the multiplayer host). When a player
 *   comes within 75 m of a spot a real, locked car is put there; when everyone is 120 m away and nobody touched
 *   it, it is taken away again. A car that was driven off stays a normal car and its space stays empty.
 * - draw(): game only. Hides the scenery copy of a car while the real one exists, removes the glass of a window
 *   that was smashed, and moves the glass splinters.
 * - smashed(): game only. The splinters and the sound when a window breaks.
 * Locked cars and the break-in itself (smash, reach in, unlock) are in the simulation's enterVehicle. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityParking=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const need=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
const NEAR=75,FAR=120;let cached=null;
function spots(){
 if(cached)return cached;const out=[],V=need('CityVehicles','./vehicles.js'),Beach=need('CityBeach','./beach.js'),Park=need('CityRecreation','./recreation.js'),usable=t=>V?.byId[t]&&!V.byId[t].premiumProduct?t:'pebble';
 (Beach?.parkedCars?.()||[]).forEach((c,i)=>out.push({id:'lot-beach-'+i,typeId:usable(c.typeId),paint:c.paint,x:c.x,z:c.z,yaw:c.yaw}));
 (Park?.parkedCars?.()||[]).forEach((c,i)=>out.push({id:'lot-mx-'+i,typeId:usable(c.typeId),paint:c.paint,x:c.x,z:c.z,yaw:c.yaw}));
 return cached=out;
}
const untouched=(v,s)=>!v.unlocked&&!v.seatOccupants?.some(Boolean)&&!Object.keys(v.reservations||{}).length&&Math.hypot(v.x-s.x,v.z-s.z)<.7&&v.health>=v.maxHealth*.999;
function step(sim,dt){
 if(!sim||sim.onlineRoom)return;const S=sim.parkedLot||(sim.parkedLot={clock:0});S.clock-=dt;if(S.clock>0)return;S.clock=.4;
 const players=[...new Set([sim.player,...(sim.sessionPeers||[])])].filter(Boolean);
 for(const s of spots()){
  let d2=Infinity;for(const p of players){const dx=p.x-s.x,dz=p.z-s.z;d2=Math.min(d2,dx*dx+dz*dz);}
  const i=sim.vehicles.findIndex(v=>v.id===s.id);
  if(i<0){
   if(d2>NEAR*NEAR||d2<2.6*2.6||sim.vehicles.some(v=>Math.hypot(v.x-s.x,v.z-s.z)<2.4))continue;
   const v=sim.spawnVehicle(s.typeId,s.id,{x:s.x,z:s.z,yaw:s.yaw});if(!v)continue;
   v.parkedCar=true;v.engine=false;v.customization={...(v.customization||{}),paint:s.paint};
  }else if(d2>FAR*FAR&&untouched(sim.vehicles[i],s))sim.vehicles.splice(i,1);
 }
}
// ---- game only ------------------------------------------------------------------------------------------
function draw(scene){
 const sim=root.PlatdoCity?.sim;if(!sim||!scene?.meshes)return;
 const real=new Set();for(const v of sim.vehicles)if(typeof v.id==='string'&&v.id.startsWith('lot-'))real.add(v.id);
 for(const group of[scene.beachCars?.group,scene.recreationParked?.group])if(group)for(const o of group.children)if(o.userData.lot)o.visible=!real.has(o.userData.lot);
 for(const rec of scene.meshes.vehicles.values()){const broken=rec.lastVehicle?.brokenWindows,m=rec.mesh;if(!broken?.length||!m)continue;const key=broken.join(',');if(m.userData.brokenWindowsShown===key)continue;m.userData.brokenWindowsShown=key;
  for(const d of m.userData.parts?.doors||[])if(broken.includes(d.seatIndex))d.pivot.traverse(o=>{if(o.isMesh&&o.material?.transparent&&o.material.opacity<.6)o.visible=false;});}
 const G=scene.glassBursts;if(G?.length){const now=sim.time,dt=Math.max(0,Math.min(.05,now-(scene.glassClock??now)));scene.glassClock=now;
  for(let i=G.length-1;i>=0;i--){const b=G[i];b.age+=dt;for(const p of b.bits){p.v.y-=9.8*dt;p.mesh.position.addScaledVector(p.v,dt);if(p.mesh.position.y<b.floor){p.mesh.position.y=b.floor;p.v.set(p.v.x*.3,0,p.v.z*.3);p.spin=0;p.mesh.rotation.x=-Math.PI/2;p.mesh.rotation.y=0;}else{p.mesh.rotation.x+=p.spin*dt;p.mesh.rotation.z+=p.spin*.7*dt;}}
   if(b.age>6){for(const p of b.bits)p.mesh.removeFromParent();G.splice(i,1);}}
 }else scene.glassClock=undefined;
}
function smashed(scene,e,audio){
 try{const T=scene.T,sim=root.PlatdoCity?.sim,v=sim?.vehicles.find(v=>v.id===e.vehicle);if(!T||!v)return;
  scene.glassGeometry??=new T.PlaneGeometry(1,1);scene.glassMaterial??=new T.MeshStandardMaterial({color:'#d4ecee',roughness:.15,metalness:.1,transparent:true,opacity:.72,side:T.DoubleSide});
  const out=new T.Vector3(e.x-v.x,0,e.z-v.z).normalize(),bits=[],floor=(sim.world.groundHeight?.(e.x,e.z,e.y)??e.y-1.2)+.02;
  for(let i=0;i<26;i++){const mesh=new T.Mesh(scene.glassGeometry,scene.glassMaterial),s=.035+Math.random()*.07;mesh.scale.set(s,s*(.5+Math.random()),1);mesh.position.set(e.x+(Math.random()-.5)*.5,e.y+(Math.random()-.5)*.36,e.z+(Math.random()-.5)*.5);mesh.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
   // Most of the glass falls into the car; the rest sprays back toward whoever hit it.
   const dir=i%3?-1:1,speed=.6+Math.random()*1.8;bits.push({mesh,spin:4+Math.random()*9,v:new T.Vector3(out.x*dir*speed+(Math.random()-.5),.4+Math.random()*1.4,out.z*dir*speed+(Math.random()-.5))});(scene.dynamic||scene.scene).add(mesh);}
  (scene.glassBursts||(scene.glassBursts=[])).push({bits,age:0,floor});
  if(audio?.tone){audio.tone(3400,.05,.06,'square','sfx',1500);setTimeout(()=>audio.tone(2500,.07,.045,'triangle','sfx',1100),45);setTimeout(()=>audio.tone(4200,.05,.03,'sine','sfx',2600),120);setTimeout(()=>audio.tone(1900,.09,.025,'triangle','sfx',700),200);}
 }catch(error){scene.glassError=String(error&&error.message||error);}
}
return{spots,step,draw,smashed,NEAR,FAR};
});
