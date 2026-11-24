
/* Pass-aware render rejection for the locally bundled Three.js renderer.
 * Bounds and opaque quads are prepared once. No gameplay object is removed.
 * Visibility changes exist only inside render(); authored visibility is restored.
 */
(function(root,factory){const api=root.PlatdoVisibility||factory();if(typeof module==='object')module.exports=api;root.PlatdoVisibility=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const baseline=typeof location!=='undefined'&&typeof URLSearchParams!=='undefined'&&new URLSearchParams(location.search).get('platdoVisibility')==='off';
const controllers=new Set(),defaultShaderHooks=new Set(),defaults={enabled:!baseline,frustum:true,occlusion:true,lod:true};
const now=()=>typeof performance==='object'?performance.now():Date.now();
function finiteBox(b){return !!b&&['x','y','z'].every(k=>Number.isFinite(b.min[k])&&Number.isFinite(b.max[k])&&b.min[k]<=b.max[k]);}
function insideQuad(rect,q,margin=.00015){
 // A single solid convex face must contain the WHOLE projected box, not a
 // handful of blocked rays. The depth inequality is checked separately.
 let winding=0;for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],c=q[(i+2)%4],cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);if(Math.abs(cross)<1e-12)return false;const sign=Math.sign(cross);if(winding&&sign!==winding)return false;winding=sign;}
 for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],dx=b.x-a.x,dy=b.y-a.y,epsilon=margin*Math.hypot(dx,dy);for(const x of [rect.minX,rect.maxX])for(const y of [rect.minY,rect.maxY])if(winding*(dx*(y-a.y)-dy*(x-a.x))<=epsilon)return false;}return true;
}
function opaque(material){return !!material&&!Array.isArray(material)&&material.visible!==false&&!material.transparent&&material.opacity===1&&!material.alphaTest&&!material.alphaMap&&!material.alphaHash&&!material.alphaToCoverage&&!material.transmission&&!material.clippingPlanes?.length&&!material.wireframe&&!material.polygonOffset&&material.side!==1&&material.colorWrite!==false&&material.depthWrite!==false&&material.depthTest!==false&&(material.depthFunc===undefined||material.depthFunc===2||material.depthFunc===3)&&(material.blending===undefined||material.blending===0||material.blending===1)&&!material.isShaderMaterial&&!material.isRawShaderMaterial&&!(material.displacementMap&&material.displacementScale!==0)&&(!material.onBeforeCompile||defaultShaderHooks.has(material.onBeforeCompile)||material.userData?.platdoOpaqueBoxSurface===true);}
function authoredVisible(object,scene){for(let p=object;p;p=p.parent){if(!p.visible)return false;if(p===scene)return true;}return false;}
function sameMatrix(a,b){return a&&b&&a.length===b.length&&a.every((v,i)=>v===b[i]);}
class Controller{
 constructor(T,{id='world',maxOccluders=4096,maxProjectedOccluders=24}={}){
  this.T=T;defaultShaderHooks.add(T.Material.prototype.onBeforeCompile);this.id=id;this.stages={...defaults};this.records=new Map();this.occluders=[];this.occluderCells=new Map();this.maxOccluders=maxOccluders;this.maxProjectedOccluders=maxProjectedOccluders;
  this.matrix=new T.Matrix4();this.projection=new T.Matrix4();this.frustum=new T.Frustum();this.shadowFrusta=[];this.sphere=new T.Sphere();this.v=new T.Vector3();this.cameraPosition=new T.Vector3();this.clip=new T.Vector4();this.boxCorners=Array.from({length:8},()=>new T.Vector4());this.projected=[];this.scores=[];this.hidden=[];this.samples=[];this.frameIntervals=[];this.geometryProofs=new WeakMap();this.ownerProofs=new WeakMap();this.ownerChecks=new WeakMap();this.proofFrame=0;this.lastFrame=0;this.stats={};this.disposed=false;controllers.add(this);
 }
 setStages(flags={}){for(const k of Object.keys(defaults))if(k in flags)this.stages[k]=!!flags[k];this.projected.length=0;this.scores.length=0;return {...this.stages};}
 register(object,{bounds,castShadow,minPixels=0,margin=.08}={}){
  if(!object)return null;object.updateWorldMatrix(true,true);bounds=bounds?.clone()||new this.T.Box3().setFromObject(object);if(!finiteBox(bounds))return null;margin=Number.isFinite(margin)?Math.max(0,margin):.08;bounds.expandByScalar(margin);
  if(castShadow===undefined){castShadow=false;object.traverse(n=>{if(n.castShadow)castShadow=true;});}
  const record={object,bounds,castShadow,minPixels,margin,small:false,matrix:object.matrixWorld.elements.slice()};this.records.set(object,record);return record;
 }
 removeOccluders(object){const owners=new Set();object.traverse(n=>{if(this.ownerProofs.has(n)){owners.add(n);this.ownerProofs.delete(n);this.ownerChecks.delete(n);}});if(!owners.size)return;this.occluders=this.occluders.filter(r=>!owners.has(r.owner));this.occluderCells.clear();for(const r of this.occluders){const key=Math.floor(r.center.x/128)+','+Math.floor(r.center.z/128);if(!this.occluderCells.has(key))this.occluderCells.set(key,[]);this.occluderCells.get(key).push(r);}this.projected.length=0;this.scores.length=0;}
 unregister(object){object.traverse(n=>this.records.delete(n));this.removeOccluders(object);}
 markDirty(object,bounds){object.traverse(n=>{const r=this.records.get(n);if(r)this.register(n,{...r,bounds:n===object?bounds:undefined});});this.removeOccluders(object);}
 exactBoxGeometry(g){
  if(g?.type!=='BoxGeometry'||!g.parameters||!g.attributes?.position||g.attributes.position.count>4096||g.drawRange.start!==0||g.drawRange.count!==Infinity||Object.values(g.morphAttributes||{}).some(a=>a.length))return false;
  const old=this.geometryProofs.get(g),p=g.attributes.position,index=g.index;if(old&&old.position===p&&old.positionVersion===p.version&&old.index===index&&old.indexVersion===index?.version)return old.valid;
  const q=g.parameters,canonical=new this.T.BoxGeometry(q.width,q.height,q.depth,q.widthSegments,q.heightSegments,q.depthSegments);let valid=p.count===canonical.attributes.position.count&&index?.count===canonical.index.count;
  if(valid)for(let i=0;i<p.count;i++)if(p.getX(i)!==canonical.attributes.position.getX(i)||p.getY(i)!==canonical.attributes.position.getY(i)||p.getZ(i)!==canonical.attributes.position.getZ(i)){valid=false;break;}
  if(valid)for(let i=0;i<index.count;i++)if(index.getX(i)!==canonical.index.getX(i)){valid=false;break;}
  canonical.dispose();this.geometryProofs.set(g,{position:p,positionVersion:p.version,index,indexVersion:index?.version,valid});return valid;
 }
 ownerProof(owner){let proof=this.ownerProofs.get(owner);if(!proof){owner.updateWorldMatrix(true,false);const g=owner.geometry;proof={matrix:owner.matrixWorld.elements.slice(),geometry:g,position:g?.attributes?.position,positionVersion:g?.attributes?.position?.version,index:g?.index,indexVersion:g?.index?.version,drawStart:g?.drawRange?.start,drawCount:g?.drawRange?.count,instance:owner.instanceMatrix,instanceVersion:owner.instanceMatrix?.version,count:owner.count};this.ownerProofs.set(owner,proof);}return proof;}
 validOwner(r){const old=this.ownerChecks.get(r.owner);if(old?.frame===this.proofFrame&&old.proof===r.proof)return old.valid;const o=r.owner,p=r.proof;o.updateWorldMatrix(true,false);const g=o.geometry,valid=opaque(o.material)&&sameMatrix(p.matrix,o.matrixWorld.elements)&&p.geometry===g&&p.position===g?.attributes?.position&&p.positionVersion===g?.attributes?.position?.version&&p.index===g?.index&&p.indexVersion===g?.index?.version&&p.drawStart===g?.drawRange?.start&&p.drawCount===g?.drawRange?.count&&p.instance===o.instanceMatrix&&p.instanceVersion===o.instanceMatrix?.version&&p.count===o.count;this.ownerChecks.set(o,{frame:this.proofFrame,proof:p,valid});return valid;}
 addOpaqueQuad(owner,vertices){
  if(this.occluders.length>=this.maxOccluders||vertices.length!==4||vertices.some(v=>!['x','y','z'].every(k=>Number.isFinite(v[k]))))return false;
  const T=this.T,points=vertices.map(v=>new T.Vector3(v.x,v.y,v.z)),a=points[1].clone().sub(points[0]),b=points[3].clone().sub(points[0]),area=a.clone().cross(b).length();if(area<12)return false;
  const center=points.reduce((p,v)=>p.add(v),new T.Vector3()).multiplyScalar(.25),radius=Math.max(...points.map(p=>p.distanceTo(center))),record={owner,points,center,radius,area,proof:this.ownerProof(owner)};this.occluders.push(record);
  const key=Math.floor(center.x/128)+','+Math.floor(center.z/128);if(!this.occluderCells.has(key))this.occluderCells.set(key,[]);this.occluderCells.get(key).push(record);return true;
 }
 addBoxOccluders(mesh){
  // Only exact, static, opaque BoxGeometry faces qualify. Never infer a wall
  // from a building bound, a perforated facade, glazing or an animated door.
  this.removeOccluders(mesh);if(mesh.isSkinnedMesh||!this.exactBoxGeometry(mesh.geometry)||!opaque(mesh.material))return 0;
  const T=this.T,g=mesh.geometry;g.computeBoundingBox();const b=g.boundingBox;if(!finiteBox(b))return 0;mesh.updateWorldMatrix(true,false);
  const corners=[];for(let i=0;i<8;i++)corners.push(new T.Vector3(i&1?b.max.x:b.min.x,i&2?b.max.y:b.min.y,i&4?b.max.z:b.min.z));
  const faces=[[0,4,6,2],[1,3,7,5],[0,1,5,4],[2,6,7,3],[0,2,3,1],[4,5,7,6]],m=new T.Matrix4();let added=0;
  for(let i=0;i<(mesh.isInstancedMesh?mesh.count:1)&&this.occluders.length<this.maxOccluders;i++){
   if(mesh.isInstancedMesh){mesh.getMatrixAt(i,m);m.premultiply(mesh.matrixWorld);}else m.copy(mesh.matrixWorld);
   const vertices=corners.map(p=>p.clone().applyMatrix4(m));for(const face of faces)if(this.addOpaqueQuad(mesh,face.map(j=>vertices[j])))added++;
  }return added;
 }
 prepare(camera,renderer,lights=[]){
  camera.updateWorldMatrix(true,false);this.camera=camera;this.cameraPosition.setFromMatrixPosition(camera.matrixWorld);this.projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);this.frustum.setFromProjectionMatrix(this.projection);this.shadowFrusta.length=0;this.unknownShadows=false;
  if(renderer?.xr?.isPresenting){this.stereoFallback=true;return;}this.stereoFallback=false;
  if(renderer?.shadowMap?.enabled)for(const light of lights){if(!light.visible||!light.castShadow||light.intensity===0)continue;const shadow=light.shadow;if(!shadow?.updateMatrices||light.isPointLight){this.unknownShadows=true;continue;}light.updateWorldMatrix(true,false);light.target?.updateWorldMatrix(true,false);shadow.updateMatrices(light);const f=shadow.getFrustum?.();if(f)this.shadowFrusta.push(f);else this.unknownShadows=true;}
 }
 sphereNeeded(sphere){return this.stereoFallback||this.frustum.intersectsSphere(sphere)||this.unknownShadows||this.shadowFrusta.some(f=>f.intersectsSphere(sphere));}
 projectBox(box){
  const r={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity,minZ:Infinity,maxZ:-Infinity};
  for(let i=0;i<8;i++){const p=this.boxCorners[i];p.set(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z,1).applyMatrix4(this.projection);if(!(p.w>1e-6)||p.z<=-p.w)return null;const x=p.x/p.w,y=p.y/p.w,z=p.z/p.w;if(!Number.isFinite(x+y+z))return null;r.minX=Math.min(r.minX,x);r.maxX=Math.max(r.maxX,x);r.minY=Math.min(r.minY,y);r.maxY=Math.max(r.maxY,y);r.minZ=Math.min(r.minZ,z);r.maxZ=Math.max(r.maxZ,z);}return r;
 }
 prepareOccluders(scene){
  this.projected.length=0;this.scores.length=0;this.proofFrame++;const p=this.cameraPosition,cx=Math.floor(p.x/128),cz=Math.floor(p.z/128);
  // A bounded local search. Farther blockers are an optimization opportunity,
  // never a reason to hide geometry without proof.
  for(let x=cx-2;x<=cx+2;x++)for(let z=cz-2;z<=cz+2;z++)for(const r of this.occluderCells.get(x+','+z)||[]){const d2=r.center.distanceToSquared(p);if(d2<r.radius*r.radius||!authoredVisible(r.owner,scene)||!r.owner.layers.test(this.camera.layers)||!this.validOwner(r))continue;this.sphere.center.copy(r.center);this.sphere.radius=r.radius;if(!this.frustum.intersectsSphere(this.sphere))continue;this.scores.push({r,score:r.area/d2});}
  this.scores.sort((a,b)=>b.score-a.score);
  for(let i=0;i<Math.min(this.maxProjectedOccluders,this.scores.length);i++){const r=this.scores[i].r,q=[];let maxZ=-Infinity,valid=true;for(const v of r.points){this.clip.set(v.x,v.y,v.z,1).applyMatrix4(this.projection);if(this.clip.w<=0||this.clip.z<=-this.clip.w){valid=false;break;}q.push({x:this.clip.x/this.clip.w,y:this.clip.y/this.clip.w});maxZ=Math.max(maxZ,this.clip.z/this.clip.w);}if(valid)this.projected.push({q,maxZ,owner:r.owner});}
 }
 render(renderer,scene,camera,{lights=[]}={}){
  if(this.disposed||!this.stages.enabled)return renderer.render(scene,camera);
  const started=now();this.prepare(camera,renderer,lights);const s={registered:this.records.size,tested:0,frustumRejected:0,occluded:0,subpixelRejected:0,shadowRetained:0,invalidBounds:0,occluderCandidates:0,projectedOccluders:0,visibilityMs:0,renderCallMs:0,drawCalls:0,triangles:0,stereoFallback:this.stereoFallback};
  if(this.stereoFallback){s.visibilityMs=now()-started;this.stats=s;return renderer.render(scene,camera);}
  if(this.stages.occlusion&&this.occluders.length&&!renderer.clippingPlanes?.length&&!scene.overrideMaterial)this.prepareOccluders(scene);else{this.projected.length=0;this.scores.length=0;}s.occluderCandidates=this.scores.length;s.projectedOccluders=this.projected.length;
  try{
   for(const r of this.records.values()){
    if(!authoredVisible(r.object,scene))continue;s.tested++;r.object.updateWorldMatrix(true,false);if(!finiteBox(r.bounds)||!sameMatrix(r.matrix,r.object.matrixWorld.elements)){s.invalidBounds++;continue;}
    const main=this.frustum.intersectsBox(r.bounds),shadow=r.castShadow&&(this.unknownShadows||this.shadowFrusta.some(f=>f.intersectsBox(r.bounds)));let reject=false;
    if(this.stages.frustum&&!main&&!shadow){s.frustumRejected++;reject=true;}
    else if(main&&!shadow&&(this.projected.length||this.stages.lod&&r.minPixels>0)){
     const rect=this.projectBox(r.bounds);if(rect){
      if(this.stages.lod&&r.minPixels>0){const pixels=Math.max((rect.maxX-rect.minX)*renderer.domElement.width*.5,(rect.maxY-rect.minY)*renderer.domElement.height*.5),threshold=r.minPixels*(r.small?1.25:.75);r.small=pixels<threshold;if(r.small){s.subpixelRejected++;reject=true;}}
      if(!reject)for(const o of this.projected)if(rect.minZ>o.maxZ+.00002&&insideQuad(rect,o.q)){s.occluded++;reject=true;break;}
     }
    }else if(!main&&shadow)s.shadowRetained++;
    if(reject){r.object.visible=false;this.hidden.push(r.object);}
   }
   s.visibilityMs=now()-started;const renderStart=now();renderer.render(scene,camera);s.renderCallMs=now()-renderStart;s.drawCalls=renderer.info.render.calls;s.triangles=renderer.info.render.triangles;
  }finally{for(const object of this.hidden)object.visible=true;this.hidden.length=0;}
  this.stats=s;this.samples.push({visibilityMs:s.visibilityMs,renderCallMs:s.renderCallMs});if(this.samples.length>240)this.samples.shift();const t=now();if(this.lastFrame){this.frameIntervals.push(t-this.lastFrame);if(this.frameIntervals.length>240)this.frameIntervals.shift();}this.lastFrame=t;
 }
 snapshot(){const percentile=(list,k)=>{const a=list.slice().sort((a,b)=>a-b);return a.length?a[Math.min(a.length-1,Math.floor(a.length*k))]:null;};return {...this.stats,id:this.id,stages:{...this.stages},occluders:this.occluders.length,renderPassIntervalMedianMs:percentile(this.frameIntervals,.5),renderPassIntervalP95Ms:percentile(this.frameIntervals,.95),visibilityMedianMs:percentile(this.samples.map(s=>s.visibilityMs),.5),renderCallMedianMs:percentile(this.samples.map(s=>s.renderCallMs),.5),timingLabel:'CPU render submission and render-pass intervals, not GPU execution or animation-frame times',gpuTimeMs:null};}
 dispose(){this.disposed=true;for(const o of this.hidden)o.visible=true;this.hidden.length=0;this.records.clear();this.occluderCells.clear();this.occluders.length=0;this.samples.length=0;this.frameIntervals.length=0;this.projected.length=0;this.scores.length=0;this.shadowFrusta.length=0;this.camera=null;this.geometryProofs=new WeakMap();this.ownerProofs=new WeakMap();this.ownerChecks=new WeakMap();controllers.delete(this);}
}
function detailDistance(distance,camera,height=640,near=25){if(distance<=near)return distance;const fov=Math.min(175,Math.max(1,camera.fov||68)),factor=Math.tan(fov*Math.PI/360)/Math.tan(68*Math.PI/360)*640/Math.max(1,height);return Math.max(near,distance*factor);}
return {Controller,finiteBox,insideQuad,opaque,detailDistance,baseline,setStages(flags){Object.assign(defaults,Object.fromEntries(Object.entries(flags).filter(([k])=>k in defaults).map(([k,v])=>[k,!!v])));for(const c of controllers)c.setStages(flags);},diagnostics(){return [...controllers].map(c=>c.snapshot());}};
});

