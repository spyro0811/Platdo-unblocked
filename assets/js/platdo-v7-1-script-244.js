
/* Rendering-only integration. World bodies, simulation, saves and audio are untouched. */
(function(root){'use strict';
const P=root.CityScene?.prototype,V=root.PlatdoVisibility;if(!P||!V)return;
function controller(scene){
 if(scene.visibility)return scene.visibility;
 const c=scene.visibility=new V.Controller(scene.T,{id:'city'}),renderer=scene.renderer,raw=renderer.render.bind(renderer);
 c.setStages({occlusion:false});
 const facade={render:raw,shadowMap:renderer.shadowMap,xr:renderer.xr,domElement:renderer.domElement,info:renderer.info,get clippingPlanes(){return renderer.clippingPlanes;}};
 renderer.render=(world,camera)=>world===scene.scene?c.render(facade,world,camera,{lights:[scene.sun,...scene.headlights||[]]}):raw(world,camera);
 return c;
}
const track=P.trackStatic;
P.trackStatic=function(object,bounds){track.call(this,object,bounds);controller(this).register(object,{bounds});
 object.traverse(mesh=>{if(mesh.isInstancedMesh&&mesh.geometry.type==='BoxGeometry'&&/^arch30-(stone|brick|concrete|panel|timber|roof|metal|interior|light)$/.test(mesh.material.name)){
  // These audited local materials change only surface color/roughness. None
  // clips, displaces or opens holes in the exact BoxGeometry blocker.
  mesh.material.userData.platdoOpaqueBoxSurface=true;this.visibility.addBoxOccluders(mesh);
 }});
};
const bake=P.bake;
P.bake=function(batch,parent){const result=bake.call(this,batch,parent);if(parent!==this.environment&&parent.userData.nearDetail!==undefined&&parent.children.length)controller(this).register(parent);return result;};
const clear=P.clearPreparedDistricts;
P.clearPreparedDistricts=function(){if(this.visibility){const groups=new Set(this.detailChunks?.values()||[]);for(const variants of this.preparedDistricts?.values()||[])for(const group of Object.values(variants))groups.add(group);for(const group of groups)this.visibility.unregister(group);}return clear.call(this);};
const menu=P.setMenuPresentation;
P.setMenuPresentation=function(enabled,kind){const saved=this.menuRetained;const result=menu.call(this,enabled,kind);if(saved&&!enabled&&saved.districts!==this.preparedDistricts)for(const variants of saved.districts?.values()||[])for(const group of new Set(Object.values(variants)))this.visibility?.unregister(group);return result;};
const frustum=P.updateViewFrustum;
P.updateViewFrustum=function(){frustum.call(this);controller(this).prepare(this.camera,this.renderer,[this.sun,...this.headlights||[]]);};
const actor=P.actorInView;
P.actorInView=function(entity,radius,distance){
 const c=this.visibility;if(!c?.stages.enabled||!this.actorSphere||!c.camera)return actor.call(this,entity,radius,distance);
 const sphere=this.actorSphere,definition=root.CityVehicles?.byId[entity.typeId],dimensions=definition?.dimensions;
 if(dimensions){
  // The physical body is narrower than aircraft wings and helicopter rotors.
  // Cache the full visual envelope, without constructing or traversing a rig.
  const cache=c.vehicleVisualBounds??=new WeakMap();let bound=cache.get(definition);
  if(!bound){bound={radius:Math.hypot(Math.max(dimensions.width,(definition.collider?.wingRadius||0)*2),dimensions.length,dimensions.height)*.5,centerY:dimensions.height*.5};cache.set(definition,bound);}
  radius=Math.max(radius,bound.radius);const rotation=c.vehicleVisualRotation??=new this.T.Euler();
  // Match CityVehicleModels.update, including rolled aircraft and body lift.
  rotation.set(-(entity.pitch||0),entity.yaw||0,-(entity.roll||0),'YXZ');sphere.center.set(0,bound.centerY,0).applyEuler(rotation);
  sphere.center.x+=entity.x||0;sphere.center.y+=(entity.y||0)+(entity.bodyLift||0)+(entity.bikeFallen?.25*Math.abs(Math.sin(entity.roll||0)):0);sphere.center.z+=entity.z||0;
 }else sphere.center.set(entity.x||0,(entity.y||0)+(entity.height||1.8)*.5,entity.z||0);
 sphere.radius=radius+.8;
 if(sphere.center.distanceToSquared(this.camera.position)>(distance+radius)**2)return false;
 // Keep nearby rigs warm when turning, plus offscreen shadow casters. This
 // controls only model preparation; all entities keep their normal simulation.
 return !c.stages.frustum||sphere.center.distanceToSquared(this.camera.position)<(12+radius)**2||c.sphereNeeded(sphere);
};
const cull=P.cullStatic,stream=P.stream;
function withoutMenuFrustum(scene,fn,args){if(!scene.visibility?.stages.enabled)return fn.apply(scene,args);const menu=scene.menuPresentation;scene.menuPresentation=false;try{return fn.apply(scene,args);}finally{scene.menuPresentation=menu;}}
P.cullStatic=function(...args){return withoutMenuFrustum(this,cull,args);};
P.stream=function(...args){
 // Prepared districts are retained when detached and may be reused immediately.
 // The startup/quality-change fallback instead disposes old chunks; unregister
 // those exact groups so the visibility registry does not keep dead resources.
 const prior=this.visibility&&!this.preparedDistricts?.size?[...this.detailChunks.values()]:null;
 try{return withoutMenuFrustum(this,stream,args);}finally{if(prior){const retained=new Set(this.detailChunks.values());for(const group of prior)if(!retained.has(group))this.visibility.unregister(group);}}
};
const person=P.personLOD;
P.personLOD=function(entity,sim,previous){
 if(!this.visibility?.stages.enabled||!this.visibility.stages.lod||entity._player)return person.call(this,entity,sim,previous);
 const limits=(this.graphics||root.CityGraphics.get(sim.settings?.quality)).peopleLOD,p=this.camera.position,distance=V.detailDistance(Math.hypot((entity.x||0)-p.x,(entity.y||0)-p.y,(entity.z||0)-p.z),this.camera,this.canvas.height,25);
 if(previous===undefined)return distance<limits[0]?0:distance<limits[1]?1:2;let lod=previous;while(lod<2&&distance>limits[lod]*1.15)lod++;while(lod>0&&distance<limits[lod-1]*.85)lod--;return lod;
};
const stats=P.stats;P.stats=function(){return{...stats.call(this),visibility:this.visibility?.snapshot()};};
const dispose=P.dispose;P.dispose=function(){this.visibility?.dispose();return dispose.call(this);};
})(typeof globalThis!=='undefined'?globalThis:this);

