
/* Actual model pieces, bounded rigid-fragment effects, and readable custom plates.
 * Debris collides with the road/terrain; it is not a soft-body solver.
 * Uses the owner's render clock: pauses freeze it; the wreck menu keeps it alive. */
(()=>{'use strict';
const T=window.THREE,Scene=window.DriveScene,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const disposePiece=p=>{p.object.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material]))m.dispose();});p.object.removeFromParent();};
function effects(s){
 if(s.breakup)return s.breakup;
 const group=new T.Group();s.scene.add(group);
 const flameTexture=null,smokeTexture=window.PlatdoVehicleVFX.smokeTexture(T);
 return s.breakup={group,pieces:[],fires:[],flameTexture,smokeTexture,emitted:0,explosions:0,limit:160,run:null};
}
function floorAt(s,x,z){const near=s.nearest(x,z);return Math.abs(near.offset)<(s.route.barrierOffset||13)+1?near.p.y:s.groundHeight(x,z);}
function addPiece(s,source,body,label,explosion=false,geometry=null){
 const b=effects(s),object=new T.Group();source.updateWorldMatrix(true,true);
 const center=new T.Box3().setFromObject(source).getCenter(new T.Vector3());
 const add=(mesh,geo)=>{if(!mesh.isMesh&&!mesh.isLine)return;const g=geo||mesh.geometry.clone();g.applyMatrix4(mesh.matrixWorld);g.translate(-center.x,-center.y,-center.z);const mats=(Array.isArray(mesh.material)?mesh.material:[mesh.material]).map(m=>{const n=m.clone();if(m.userData.driveWrap)window.DriveWrapRenderer?.cloneMaterial(m,n);n.side=T.DoubleSide;return n;});const clone=mesh.isLine?new T.Line(g,mats[0]):new T.Mesh(g,Array.isArray(mesh.material)?mats:mats[0]);clone.castShadow=true;clone.receiveShadow=true;object.add(clone);};
 if(geometry){geometry.computeBoundingBox();center.copy(geometry.boundingBox.getCenter(new T.Vector3())).applyMatrix4(source.matrixWorld);add(source,geometry);}
 else source.traverseVisible(o=>{if(o.geometry&&o.material)add(o);});
 if(!object.children.length)return;
 object.position.copy(center);b.group.add(object);
 const index=++b.emitted,angle=index*2.39996323,dx=center.x-body.x,dz=center.z-body.z,radial=Math.hypot(dx,dz)||1;
 const outward=explosion?3.2+(index%5)*.62:1.8+(body.lastImpact?.severity||.3)*2.2;
 const hit=body.lastImpact||{},velocity=new T.Vector3((body.vx||0)*.56+dx/radial*outward+(explosion?Math.sin(angle)*2:-(hit.nx||0)),explosion?4.2+(index%5)*.65:1.3+(index%4)*.35,(body.vz||0)*.56+dz/radial*outward+(explosion?Math.cos(angle)*2:-(hit.nz||0)));
 const bounds=new T.Box3().setFromObject(object),size=bounds.getSize(new T.Vector3()),radius=source.userData.wheelPart?.28:clamp(Math.min(size.x,size.y,size.z)*.5,.055,.26);
 const p={object,velocity,spin:new T.Vector3(Math.sin(angle)*3,Math.cos(angle)*2,Math.sin(angle*1.7)*3),radius,age:0,settled:false,bounces:0,floor:floorAt(s,center.x,center.z)+radius,floorClock:0,life:explosion?23:20,label,owner:body,clip:geometry?.userData.fragmentClip||null};b.pieces.push(p);
 while(b.pieces.length>b.limit)disposePiece(b.pieces.shift());
 return p;
}
// Clip original triangles at the fragment boundaries, retaining paint/normals/UVs.
// Centroid bucketing would split the long underside triangles into serrated combs.
function shatterMesh(s,mesh,body,label){
 const source=mesh.geometry,index=source.index,positions=source.attributes.position;if(!positions)return;
 source.computeBoundingBox();const size=source.boundingBox.getSize(new T.Vector3());
 if(label!=='body-panel'||Math.max(size.x,size.y,size.z)<1.1){addPiece(s,mesh,body,label,true);return;}
 const attrs=Object.entries(source.attributes),n=index?index.count:positions.count,min=source.boundingBox.min;
 const vertex=i=>Object.fromEntries(attrs.map(([name,a])=>[name,Array.from(a.array.slice(i*a.itemSize,(i+1)*a.itemSize))]));
 const cut=(polygon,axis,plane,sign)=>{const out=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=(a.position[axis]-plane)*sign,db=(b.position[axis]-plane)*sign;if(da>=-1e-7)out.push(a);if((da>1e-7&&db< -1e-7)||(da< -1e-7&&db>1e-7)){const t=da/(da-db);out.push(Object.fromEntries(attrs.map(([name])=>[name,a[name].map((v,j)=>v+(b[name][j]-v)*t)])));}}return out;};
 for(let x=0;x<2;x++)for(let z=0;z<3;z++){
  const values=Object.fromEntries(attrs.map(([name])=>[name,[]])),x0=min.x+size.x*x/2,x1=min.x+size.x*(x+1)/2,z0=min.z+size.z*z/3,z1=min.z+size.z*(z+1)/3;
  for(let i=0;i<n;i+=3){let polygon=[0,1,2].map(j=>vertex(index?index.getX(i+j):i+j));polygon=cut(polygon,0,x0,1);polygon=cut(polygon,0,x1,-1);polygon=cut(polygon,2,z0,1);polygon=cut(polygon,2,z1,-1);
   for(let j=1;j<polygon.length-1;j++)for(const v of[polygon[0],polygon[j],polygon[j+1]])for(const [name]of attrs)values[name].push(...v[name]);
  }
  if(!values.position.length)continue;const g=new T.BufferGeometry();for(const [name,a]of attrs)g.setAttribute(name,new T.Float32BufferAttribute(values[name],a.itemSize));g.computeBoundingBox();g.userData.fragmentClip={expected:{x0,x1,z0,z1},actual:{x0:g.boundingBox.min.x,x1:g.boundingBox.max.x,z0:g.boundingBox.min.z,z1:g.boundingBox.max.z}};addPiece(s,mesh,body,label+'-'+(x+z*2),true,g);
 }
}
function startFire(s,body){
 const b=effects(s),group=new T.Group(),sprites=[];group.position.set(body.x,body.y||0,body.z);b.group.add(group);
 for(let i=0;i<21;i++){const smoke=i>=10,sprite=smoke?new T.Sprite(new T.SpriteMaterial({map:b.smokeTexture,transparent:true,depthWrite:false,color:'#534b48'})):window.PlatdoVehicleVFX.flame(T,i*.73);group.add(sprite);sprites.push({sprite,smoke,index:i});}
 const light=new T.PointLight('#ff8a28',0,15,2);group.add(light);b.fires.push({group,sprites,light,age:0,body});b.explosions++;
 while(b.fires.length>5){const f=b.fires.shift();f.group.removeFromParent();f.sprites.forEach(p=>{p.sprite.material.dispose();if(p.sprite.userData.combustion)p.sprite.geometry.dispose();});}
}
function removeFire(f){
 f.group.removeFromParent();f.sprites.forEach(p=>{p.sprite.material.dispose();if(p.sprite.userData.combustion)p.sprite.geometry.dispose();});
}
function clearVehicleEffects(s,mesh,owner){
 const b=effects(s);
 b.pieces=b.pieces.filter(p=>{if(p.owner!==owner)return true;disposePiece(p);return false;});
 b.fires=b.fires.filter(f=>{if(f.body!==owner)return true;removeFire(f);return false;});
 for(const pool of [s.smokeParticles,s.trafficSmokeParticles])for(const particle of pool||[]){
  if(particle.ownerMesh===mesh){particle.sprite.visible=false;particle.age=particle.life;particle.ownerMesh=null;}
 }
}
function restore(mesh){
 mesh.traverse(o=>{if(o.userData.driveDetached){o.visible=true;delete o.userData.driveDetached;}});
 if(mesh.userData.contact)mesh.userData.contact.visible=true;
 if(mesh.userData.charredFrame)mesh.userData.charredFrame.visible=false;
 if(mesh.userData.breakState){mesh.userData.breakState.exploded=false;mesh.userData.breakState.damage=null;}
}
function breakModel(s,mesh,body){
 if(!mesh||!body.damage)return;
 const data=mesh.userData,old=data.breakState;
 // Online impacts replace the transmitted damage object. Only a new car
 // life should restore detached panels and extinguish this car's effects.
 const repaired=old&&(body.respawnRevision===undefined?old.damage!==body.damage:old.respawnRevision!==body.respawnRevision);
 if(repaired){clearVehicleEffects(s,mesh,old.owner);restore(mesh);}
 const state=data.breakState||(data.breakState={exploded:false,damage:body.damage});state.damage=body.damage;state.owner=body;state.respawnRevision=body.respawnRevision;
 mesh.updateWorldMatrix(true,true);
 if(body.destroyed&&!state.exploded){
  state.exploded=true;
  // Wheels retain their tire/rim/hub assemblies when ejected.
  for(const wheel of data.wheels){const p=wheel.pivot;if(!p.userData.driveDetached){p.visible=true;addPiece(s,p,body,'wheel',true);p.userData.driveDetached=true;}}
  const candidates=[];data.body.traverseVisible(o=>{if(o.isMesh&&!o.userData.driveDetached&&!o.userData.licensePlate){o.geometry.computeBoundingBox();const size=o.geometry.boundingBox.getSize(new T.Vector3());if(Math.max(size.x,size.y,size.z)>.22)candidates.push(o);}});
  for(const meshPart of candidates.slice(0,28)){shatterMesh(s,meshPart,body,meshPart===data.damageSetup.shell?'body-panel':'car-part');}
  data.body.traverse(o=>{if(o.isMesh||o.isLine){o.visible=false;o.userData.driveDetached=true;}});startFire(s,body);
  // The scorched chassis remains visible after particles expire, matching the
  // stopped wreck's collision footprint instead of leaving an invisible obstacle.
  if(!data.charredFrame){const frame=new T.Group(),metal=new T.MeshStandardMaterial({color:'#292725',roughness:.98,metalness:.35});
   for(const x of[-data.width*.36,data.width*.36]){const beam=new T.Mesh(new T.BoxGeometry(.11,.13,data.length*.82),metal);beam.position.set(x,.26,0);frame.add(beam);}
   for(const z of[-data.length*.36,0,data.length*.36]){const beam=new T.Mesh(new T.BoxGeometry(data.width*.9,.12,.13),metal);beam.position.set(0,.26,z);frame.add(beam);}
   const floor=new T.Mesh(new T.BoxGeometry(data.width*.65,.08,data.length*.46),metal),engine=new T.Mesh(new T.BoxGeometry(data.width*.43,.37,data.length*.19),metal);floor.position.y=.31;engine.position.set(0,.47,data.length*.28);frame.add(floor,engine);mesh.add(frame);data.charredFrame=frame;
  }data.charredFrame.visible=true;
 }else if(!state.exploded){
  const parts=window.DriveCore.BREAKAWAY_PARTS,candidates=[];mesh.traverse(o=>{if(o.userData.breakawayPart&&!o.userData.driveDetached)candidates.push(o);});
  for(const piece of candidates){const id=piece.userData.breakawayPart,index=parts.findIndex(p=>p.id===id),part=parts[index];if(part&&(body.damage.parts?.[index]||0)>=part.threshold){piece.visible=true;addPiece(s,piece,body,id);piece.userData.driveDetached=true;}}
 }
 mesh.traverse(o=>{if(o.userData.driveDetached)o.visible=false;});
 if(state.exploded)data.contact.visible=false;
}
Scene.prototype.clearBreakup=function(){if(!this.breakup)return;const b=this.breakup;for(const p of b.pieces)disposePiece(p);b.pieces=[];for(const f of b.fires){f.group.removeFromParent();f.sprites.forEach(p=>{p.sprite.material.dispose();if(p.sprite.userData.combustion)p.sprite.geometry.dispose();});}b.fires=[];b.emitted=b.explosions=0;};
// The bank district has its own renderer and a flat road. Use the same panel
// deformation, engine smoke and chassis breakup as the main Drive scene.
Scene.chaseDamage=function(scene,cars,role,settings){
 const other=role==='cop'?'robber':'cop';
 const bodies={cop:{id:'cop'},robber:{id:'robber'}};
 const sim={player:bodies[role],traffic:[bodies[other]]};
 const fx=Object.assign(Object.create(Scene.prototype),{
   scene,settings,vector:new T.Vector3(),playerCar:cars[role],
   trafficMeshes:new Map([[other,cars[other]]]),route:{barrierOffset:12},
   nearest:()=>({offset:0,p:{y:0}}),groundHeight:()=>0
 });
 fx.buildEngineSmoke();
 return {
   update(shot,dt,view){
     for(const id of ['cop','robber']){
       const p=shot[id],body=bodies[id];
       const same=body.respawnRevision===p.respawnRevision&&body.damageRevision===p.damageRevision;
       const damage=same?body.damage:p.damage;
       Object.assign(body,p,{damage});
       if(damage)Scene.deformCar(cars[id],body);
     }
     fx.updateDamageEffects(sim,sim.player,dt,true,view);
     fx.updateBreakup(sim,sim.player,dt,true);
   },
   dispose(){
     fx.clearBreakup();
     if(fx.breakup){fx.breakup.flameTexture?.dispose();fx.breakup.smokeTexture.dispose();fx.breakup.group.removeFromParent();}
     fx.smokeParticles[0].sprite.material.map.dispose();
     fx.engineSmoke.traverse(o=>o.material?.dispose());fx.engineSmoke.removeFromParent();
   }
 };
};
Scene.prototype.updateBreakup=function(sim,player,dt,playing){
 const b=effects(this);if(b.run!==sim){this.clearBreakup();b.run=sim;restore(this.playerCar);}
 b.group.visible=playing;if(!playing){restore(this.playerCar);return;}
 breakModel(this,this.playerCar,sim.player);for(const body of sim.traffic||[])breakModel(this,this.trafficMeshes.get(body.id),body);
 if(dt<=0)return;
 for(const p of b.pieces){p.age+=dt;if(p.age>=p.life)continue;if(!p.settled){const steps=Math.max(1,Math.ceil(dt*120)),slice=dt/steps;for(let i=0;i<steps;i++){p.velocity.y-=9.81*slice;p.object.position.addScaledVector(p.velocity,slice);p.object.rotation.x+=p.spin.x*slice;p.object.rotation.y+=p.spin.y*slice;p.object.rotation.z+=p.spin.z*slice;p.floorClock+=slice;if(p.floorClock>.12){p.floorClock=0;p.floor=floorAt(this,p.object.position.x,p.object.position.z)+p.radius;}
   if(p.object.position.y<=p.floor){p.object.position.y=p.floor;p.velocity.y=Math.abs(p.velocity.y)*.32;p.velocity.x*=.64;p.velocity.z*=.64;p.spin.multiplyScalar(.5);p.bounces++;if(p.velocity.length()<.8||p.bounces>12){p.settled=true;p.velocity.set(0,0,0);p.spin.set(0,0,0);}}
  }}
  if(p.age>p.life-2){const alpha=clamp((p.life-p.age)/2,0,1);p.object.traverse(o=>{if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material])){m.transparent=true;m.opacity=alpha;}});}
 }
 b.pieces=b.pieces.filter(p=>{if(p.age<p.life)return true;disposePiece(p);return false;});
 for(const f of b.fires){f.age+=dt;const fade=clamp((20-f.age)/5,0,1);f.group.position.set(f.body.x,f.body.y||0,f.body.z);f.light.intensity=fade*(f.age<.4?40:8+Math.sin(f.age*23)*2);
  for(const {sprite,smoke,index}of f.sprites){if(!smoke){sprite.material.uniforms.time.value=f.age;sprite.material.uniforms.opacity.value=fade;}const phase=(f.age*(smoke?.27:1.35)+index*.157)%1,angle=index*2.399;const base=smoke?.45:1;const spread=smoke?.6+phase*.85:.6;
   sprite.position.set(Math.sin(angle)*spread+(smoke?phase*.8:0),base+phase*(smoke?5.3:2.1),Math.cos(angle)*spread);const size=smoke?1.1+phase*2.8:(f.age<.25?2.8:1.1)*(1-phase*.7);sprite.scale.set(size,size*(smoke?1:1.75),1);sprite.material.opacity=fade*Math.sin(phase*Math.PI)*(smoke?.58:.82);sprite.material.rotation=smoke?angle+f.age*.1:Math.sin(f.age*4+index)*.12;
  }
 }
 b.fires=b.fires.filter(f=>{if(f.age<20)return true;f.group.removeFromParent();f.sprites.forEach(p=>{p.sprite.material.dispose();if(p.sprite.userData.combustion)p.sprite.geometry.dispose();});return false;});
};
Scene.prototype.setLicensePlate=function(text){
 const car=this.playerCar,plate=car?.userData.plate;if(!plate)return;
 text=String(text||'PLATDO').toUpperCase().replace(/[^A-Z0-9 -]/g,'').slice(0,8)||'PLATDO';if(plate.userData.text===text)return;
 const texture=plate.material.map,canvas=texture.image,c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.fillStyle='#ede4c8';c.fillRect(0,0,w,h);c.strokeStyle='#373936';c.lineWidth=4;c.strokeRect(4,4,w-8,h-8);c.fillStyle='#293132';c.font='bold '+(text.length>6?30:35)+'px monospace';c.textAlign='center';c.fillText(text,w/2,45);texture.needsUpdate=true;plate.userData.text=text;
};
const originalSetCar=Scene.prototype.setCar,originalSettings=Scene.prototype.setSettings,originalDispose=Scene.prototype.dispose;
Scene.prototype.setCar=function(...args){if(!args[2])this.clearBreakup();originalSetCar.apply(this,args);this.setLicensePlate(this.settings.licensePlate);};
Scene.prototype.setSettings=function(...args){originalSettings.apply(this,args);this.setLicensePlate(this.settings.licensePlate);};
Scene.prototype.dispose=function(){if(this.breakup){this.clearBreakup();this.breakup.flameTexture?.dispose();this.breakup.smokeTexture.dispose();}originalDispose.call(this);};
})();

