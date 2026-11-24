
/* Rendering only. Authored terrain triangles, world scenery and simulation IDs
 * are unchanged. Each pass uses its own camera; shadows retain their casters. */
(()=>{'use strict';
const T=window.THREE,S=window.DriveScene,V=window.PlatdoVisibility;if(!T||!S||!V)return;
const P=S.prototype,params=typeof location==='object'?new URLSearchParams(location.search):new URLSearchParams(),CELL=Math.max(128,Math.min(2048,Number(params.get('platdoDriveTile'))||768));
// Development-only structural comparisons require a reload. Production keeps
// native material batches; 128 m and 384 m instance splits cost more than saved.
V.driveInstanceCell=Math.max(0,Math.min(4096,Number(params.get('platdoDriveCells'))||0));
function splitSurface(source){
 if(V.baseline)return null;
 const g=source.geometry,index=g.index,pos=g.attributes.position;if(!index||index.count<3000||g.groups.length||source.material?.transparent)return null;
 const bins=new Map(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let i=0;i<index.count;i+=3){const ia=index.getX(i),ib=index.getX(i+1),ic=index.getX(i+2);a.fromBufferAttribute(pos,ia);b.fromBufferAttribute(pos,ib);c.fromBufferAttribute(pos,ic);const key=Math.floor((a.x+b.x+c.x)/(3*CELL))+','+Math.floor((a.z+b.z+c.z)/(3*CELL));let bin=bins.get(key);if(!bin){bin={indices:[],bounds:new T.Box3()};bins.set(key,bin);}bin.indices.push(ia,ib,ic);bin.bounds.expandByPoint(a).expandByPoint(b).expandByPoint(c);}
 if(bins.size<2)return null;
 const group=new T.Group();group.name=(source.name||'Drive surface')+' geographic tiles';group.position.copy(source.position);group.quaternion.copy(source.quaternion);group.scale.copy(source.scale);group.visible=source.visible;group.userData={...source.userData,visibilityTiles:true};
 // Retain the authored data/material interfaces used by quality/theme updates.
 // All tiles share the same immutable attributes, so seams cannot diverge.
 group.geometry=g;group.material=source.material;
 for(const [cell,bin]of bins){const tileGeometry=new T.BufferGeometry();for(const [key,attribute]of Object.entries(g.attributes))tileGeometry.setAttribute(key,attribute);tileGeometry.setIndex(bin.indices);tileGeometry.boundingBox=bin.bounds;tileGeometry.boundingSphere=bin.bounds.getBoundingSphere(new T.Sphere());const tile=new T.Mesh(tileGeometry,source.material);tile.name='Drive surface tile '+cell;tile.castShadow=source.castShadow;tile.receiveShadow=source.receiveShadow;tile.renderOrder=source.renderOrder;tile.userData.visibilityTile=cell;group.add(tile);}
 source.parent.add(group);source.removeFromParent();return group;
}
const oldTerrain=P.buildTerrain;P.buildTerrain=function(){oldTerrain.call(this);const tiles=splitSurface(this.terrain);if(tiles)this.terrain=tiles;};
P.prepareVisibility=function(){
 if(this.renderVisibility)return this.renderVisibility;
 const controller=this.renderVisibility=new V.Controller(T,{id:'drive-'+(this.route.mapId||this.route.map?.id||'world')});
 // Terrain tiles and fixed-layout instance batches use the renderer's own
 // per-pass frustum test. Re-testing those same meshes here added CPU overhead
 // without avoiding additional submissions. Packed batches cannot be occluders:
 // their per-instance matrices can change order. Never infer solid buildings.
 this.visibilityStatsVersion=30;return controller;
};
P.renderWorld=function(camera=this.camera){if(V.baseline)return this.renderer.render(this.scene,camera);const controller=this.prepareVisibility();return controller.render(this.renderer,this.scene,camera,{lights:[this.sun,...(this.headlightSpots||[]).map(x=>x.light),this.tunnelLight].filter(Boolean)});};
// CubeCamera invokes renderer.render six times. A small bound proxy gives every
// face independent visibility while leaving renderer ownership and targets alone.
P.visibilityRenderer=function(){if(this.renderProxy)return this.renderProxy;const host=this;return this.renderProxy=new Proxy(this.renderer,{get(target,key){if(key==='render')return(scene,camera)=>scene===host.scene?host.renderWorld(camera):target.render(scene,camera);const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;},set(target,key,value){return Reflect.set(target,key,value,target);}});};
const oldActorViews=P.prepareActorViews;P.prepareActorViews=function(playing,mode){oldActorViews?.call(this,playing,mode);if(V.baseline)return;const controller=this.prepareVisibility();controller.prepare(this.camera,this.renderer,[this.sun,...(this.headlightSpots||[]).map(x=>x.light)].filter(Boolean));this.actorShadowFrusta=controller.shadowFrusta;this.actorUnknownShadows=controller.unknownShadows;};
const oldActorVisible=P.actorVisible;P.actorVisible=function(body){if(V.baseline)return oldActorVisible.call(this,body);const controller=this.renderVisibility;if(!controller?.stages.enabled||!controller.stages.frustum||this.graphics?.reflection||this.renderer?.xr?.isPresenting||this.camera?.isArrayCamera)return true;const visible=oldActorVisible.call(this,body);return visible||!!this.camera&&this.actorSphere.center.distanceToSquared(this.camera.position)<20**2||this.actorUnknownShadows||this.actorShadowFrusta?.some(f=>f.intersectsSphere(this.actorSphere));};
P.actorDetail=function(body,distanceSquared,rank,mesh){
 const previous=mesh.userData.lastLOD??rank;if(V.baseline||!this.renderVisibility?.stages.lod)return distanceSquared>170**2?0:distanceSquared>75**2?Math.min(rank,1):rank;
 const distance=Math.sqrt(distanceSquared),pixelDistance=V.detailDistance(distance,this.camera,this.renderer.domElement.height,35),near=75*(previous>=rank?1.12:.88),far=170*(previous>0?1.12:.88);
 return pixelDistance>far?0:pixelDistance>near?Math.min(rank,1):rank;
};
const oldDispose=P.dispose;P.dispose=function(){this.renderVisibility?.dispose();this.renderProxy=null;this.scene.traverse(o=>{if(o.isLight&&o.shadow){o.shadow.map?.dispose();o.shadow.mapPass?.dispose();o.shadow.map=null;o.shadow.mapPass=null;}});return oldDispose.call(this);};
S.splitRenderSurface=splitSurface;
})();

