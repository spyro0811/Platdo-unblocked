
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
/* V7.5: the car parks behind the beach front (the island file lists them) hold cars and, in the last bay of each, two bikes or e-bikes. These have no scenery copy, so they are put there from a little further away. */
const NEAR=95,FAR=140;let cached=null;
const pick=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
function spots(){
 if(cached)return cached;const out=[],V=need('CityVehicles','./vehicles.js'),Beach=need('CityBeach','./beach.js'),Park=need('CityRecreation','./recreation.js'),usable=t=>V?.byId[t]&&!V.byId[t].premiumProduct?t:'pebble';
 (Beach?.parkedCars?.()||[]).forEach((c,i)=>out.push({id:'lot-beach-'+i,typeId:usable(c.typeId),paint:c.paint,x:c.x,z:c.z,yaw:c.yaw}));
 (Park?.parkedCars?.()||[]).forEach((c,i)=>out.push({id:'lot-mx-'+i,typeId:usable(c.typeId),paint:c.paint,x:c.x,z:c.z,yaw:c.yaw}));
 /* V7.5: the first bay of every car park stays free (for you, or for a car a mission brings); the last holds two bikes; each of the others has a car in it a little more than half the time. Every kind of car and bike in the game turns up somewhere. */
 {const Island=need('CityIsland','./island-layout.js'),all=(V?.definitions||[]).filter(d=>d.category==='land'&&!d.premiumProduct),cars=all.filter(d=>d.kind==='car'&&!['sentinel','mercy','haul'].includes(d.id)).map(d=>d.id),bikes=all.filter(d=>d.kind==='bike').map(d=>d.id);let c=0,b=0;
  for(const l of[...(Island?.lots?.()||[]),/* V9.2: and the car parks behind the apartment buildings */...(need('CityApartments','./apartments.js')?.lots?.()||[]),/* V10.3: and the shelter's car park */...(need('CityShelter','./shelter.js')?.lots?.()||[])])l.bays.forEach((bay,i)=>{if(!i||!cars.length)return;const h=pick(l.id+':'+i);
   if(i===l.bays.length-1){if(bikes.length)for(const k of[0,1])out.push({id:'lot-'+l.place+'-b'+k,typeId:bikes[pick('bike:'+l.id+k)%bikes.length],gap:1.1,x:bay.x+(k?.7:-.7),z:bay.z-(l.dir||-1)*.6,yaw:(h%5-2)*.02+((l.dir||-1)>0?Math.PI:0)});}
   /* (V7.8: facing the building whichever side of the car park it is on) */else if(h%100<58)out.push({id:'lot-'+l.place+'-'+i,typeId:cars[pick('car:'+l.id+i)%cars.length],x:bay.x,z:bay.z,yaw:(h%7-3)*.012+((l.dir||-1)>0?Math.PI:0)});});}
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
   /* V12.9: a space whose car was driven off is not filled by magic: a car is driven into it (alone: city-visitors.js) */if(S.vacated?.[s.id])continue;
   if(d2>NEAR*NEAR||d2<2.6*2.6||sim.vehicles.some(v=>Math.hypot(v.x-s.x,v.z-s.z)<(s.gap||2.4)))continue;
   const v=sim.spawnVehicle(s.typeId,s.id,{x:s.x,z:s.z,yaw:s.yaw});if(!v)continue;
   v.parkedCar=true;v.engine=false;if(s.paint!==undefined)v.customization={...(v.customization||{}),paint:s.paint};
  }else{const v=sim.vehicles[i];if(!S.vacated?.[s.id]&&Math.hypot(v.x-s.x,v.z-s.z)>3)(S.vacated||(S.vacated={}))[s.id]=sim.time;if(d2>FAR*FAR&&untouched(v,s))sim.vehicles.splice(i,1);}
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
  /* V8.9: a whole windscreen spreads its splinters over its size, and has more of them */const sp=Math.min(1.6,e.width||.5),sh=Math.min(1,e.height||.36),count=Math.min(64,Math.round(26*Math.pow(Math.max(1,sp/.5),.8)));
  for(let i=0;i<count;i++){const mesh=new T.Mesh(scene.glassGeometry,scene.glassMaterial),s=.035+Math.random()*.07;mesh.scale.set(s,s*(.5+Math.random()),1);mesh.position.set(e.x+(Math.random()-.5)*sp,e.y+(Math.random()-.5)*sh,e.z+(Math.random()-.5)*sp);mesh.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
   // Most of the glass falls into the car; the rest sprays back toward whoever hit it.
   const dir=(e.index==='windshield'?i%4===0:i%3)?-1:1,speed=.6+Math.random()*1.8;bits.push({mesh,spin:4+Math.random()*9,v:new T.Vector3(out.x*dir*speed+(Math.random()-.5),.4+Math.random()*1.4,out.z*dir*speed+(Math.random()-.5))});(scene.dynamic||scene.scene).add(mesh);}
  (scene.glassBursts||(scene.glassBursts=[])).push({bits,age:0,floor});
  /* V8.9: the player's glass shatter recording; the old tones only if it cannot play */if(!(audio?.sample&&audio.sample('glassBreak',1,0))&&audio?.tone){audio.tone(3400,.05,.06,'square','sfx',1500);setTimeout(()=>audio.tone(2500,.07,.045,'triangle','sfx',1100),45);setTimeout(()=>audio.tone(4200,.05,.03,'sine','sfx',2600),120);setTimeout(()=>audio.tone(1900,.09,.025,'triangle','sfx',700),200);}
 }catch(error){scene.glassError=String(error&&error.message||error);}
}
return{spots,step,draw,smashed,NEAR,FAR};
});
