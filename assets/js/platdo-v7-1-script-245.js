
/* PLATDO V2 — City render budget. Rendering only: no simulation, collision or save
 * data is read back from anything in this file.
 *
 * Before V2 a street scene submitted ~1,900 draw calls: every car was 35-100 separate
 * meshes until it was 75 m away, every person 28-46, and all ~14,000 scene nodes had
 * their matrices rebuilt each frame whether or not they were drawn. That work is done
 * on the processor, so it cost the same on every graphics preset.
 *
 * This module makes that work scale with the chosen quality:
 *   1. Matrices are only rebuilt for objects that are actually visible.
 *   2. The distance at which a car swaps to its merged model follows the preset, and a
 *      further "baked" model (about five meshes) is used beyond that.
 *   3. People beyond close range have each bone's pieces merged into one mesh.
 */
(function(root){'use strict';
const T=root.THREE,S=root.CityScene?.prototype,VM=root.CityVehicleModels,PM=root.CityPeopleModels;if(!T||!S)return;

// ---- 1. Visible-only matrix pass ------------------------------------------------
const defaultUpdate=T.Object3D.prototype.updateMatrixWorld;
function updateVisible(object,force,camera){
 // A hidden subtree is skipped whole. If its parent moved meanwhile, remember that so
 // the subtree is rebuilt as soon as it is shown again.
 if(object.visible===false){if(force)object.matrixWorldNeedsUpdate=true;return;}
 // Cameras and other specialised nodes keep their own update.
 if(object.updateMatrixWorld!==defaultUpdate){object.updateMatrixWorld(force);return;}
 if(object.matrixAutoUpdate)object.updateMatrix();
 if(object.matrixWorldNeedsUpdate||force){
  if(object.parent===null)object.matrixWorld.copy(object.matrix);else object.matrixWorld.multiplyMatrices(object.parent.matrixWorld,object.matrix);
  object.matrixWorldNeedsUpdate=false;force=true;
 }
 // Pick the detail level now, so the level the renderer is about to draw has current matrices.
 if(object.isLOD&&object.autoUpdate)object.update(camera);
 const children=object.children;
 for(let i=0,l=children.length;i<l;i++){const child=children[i];if(child.matrixWorldAutoUpdate===true||force===true)updateVisible(child,force,camera);}
}
function installMatrixPass(scene){
 if(scene.v2MatrixPass)return;scene.v2MatrixPass=true;
 const renderer=scene.renderer,inner=renderer.render;
 renderer.render=function(world,camera){
  if(world!==scene.scene)return inner.call(this,world,camera);
  if(!scene.v2MatrixPassOff){
   world.matrixWorldAutoUpdate=false;
   if(camera.parent===null&&camera.matrixWorldAutoUpdate===true)camera.updateMatrixWorld();
   updateVisible(world,false,camera);
  }else world.matrixWorldAutoUpdate=true;
  // Optional HDR finish (see platdo-post.js). Only the on-screen view uses it; photos,
  // previews and reflection captures that bind their own target are drawn directly.
  const post=scene.v2Post&&this.getRenderTarget()===null?scene.v2Post:null,target=post?post.begin():null;
  if(!target)return inner.call(this,world,camera);
  this.setRenderTarget(target);try{inner.call(this,world,camera);}finally{this.setRenderTarget(null);}
  post.finish();
 };
}

// ---- Geometry helpers -----------------------------------------------------------
const m4=new T.Matrix4(),n3=new T.Matrix3(),corners=[new T.Vector3(),new T.Vector3(),new T.Vector3()],vn=new T.Vector3();
// Appends one mesh's triangles (in the frame given by `inverse`) to plain arrays.
// minEdge > 0 leaves out triangles whose longest edge is shorter than that: detail that
// is smaller than a pixel at the distance the result will be shown from.
function appendMesh(out,mesh,inverse,color,minEdge=0){
 const g=mesh.geometry,p=g.attributes.position;if(!p)return;
 const normals=g.attributes.normal,uv=g.attributes.uv,index=g.index;
 m4.multiplyMatrices(inverse,mesh.matrixWorld);n3.getNormalMatrix(m4);
 const flip=m4.determinant()<0,count=index?index.count:p.count,limit=minEdge*minEdge;
 for(let i=0;i+2<count;i+=3){
  const ids=[0,0,0];
  for(let k=0;k<3;k++){ids[k]=index?index.getX(i+(flip?2-k:k)):i+(flip?2-k:k);corners[k].fromBufferAttribute(p,ids[k]).applyMatrix4(m4);}
  if(limit&&corners[0].distanceToSquared(corners[1])<limit&&corners[1].distanceToSquared(corners[2])<limit&&corners[2].distanceToSquared(corners[0])<limit)continue;
  for(let k=0;k<3;k++){
   const va=corners[k],vi=ids[k];out.position.push(va.x,va.y,va.z);
   if(normals){vn.fromBufferAttribute(normals,vi).applyMatrix3(n3).normalize();out.normal.push(vn.x,vn.y,vn.z);}else out.normal.push(0,1,0);
   if(out.uv)out.uv.push(uv?uv.getX(vi):0,uv?uv.getY(vi):0);
   if(out.color)out.color.push(color.r,color.g,color.b);
  }
 }
 if(!normals)out.missingNormals=true;
}
function finishGeometry(out){
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(out.position,3));g.setAttribute('normal',new T.Float32BufferAttribute(out.normal,3));
 if(out.uv)g.setAttribute('uv',new T.Float32BufferAttribute(out.uv,2));if(out.color)g.setAttribute('color',new T.Float32BufferAttribute(out.color,3));
 if(out.missingNormals)g.computeVertexNormals();g.computeBoundingSphere();return g;
}
// A plain opaque surface whose only distinguishing feature is its colour.
function bakeable(material){
 return !!material&&!Array.isArray(material)&&material.isMeshStandardMaterial&&!material.transparent&&material.opacity===1&&!material.map&&!material.normalMap&&!material.alphaMap&&!material.emissiveMap&&!material.vertexColors&&!material.wireframe&&material.side===T.FrontSide&&material.visible!==false&&!material.userData?.driveWrap&&(material.emissiveIntensity<=.25||material.emissive.getHex()===0);
}

// ---- 2. Vehicles ---------------------------------------------------------------
const vehicleNear=[0,14,22,36,58,85];             // metres, by model-detail level 1..5
function vehicleBudget(scene){
 const level=Math.max(1,Math.min(5,scene.modelDetail||5)),preset=scene.graphics?.id;
 const near=preset==='insane'?(scene.menuPresentation?150:125):preset==='expert'?72:vehicleNear[level];
 return{near,baked:near*2.3,key:near};
}
let bakedVehicleMaterial=null;
function vehicleBakedMaterial(){return bakedVehicleMaterial||(bakedVehicleMaterial=new T.MeshStandardMaterial({name:'city-vehicle-baked',vertexColors:true,roughness:.58,metalness:.22}));}
function applyVehicleDistances(mesh,budget){
 const lod=mesh.userData.lod;if(!lod||lod.userData.v2Budget===budget.key)return;lod.userData.v2Budget=budget.key;
 const levels=lod.levels,baked=lod.userData.v2Baked;
 const authored=levels.filter(l=>l.object!==baked);
 // Cars: detailed + merged. Electric bikes: detailed + two reduced builds.
 if(authored.length===2)authored[1].distance=budget.near;
 else if(authored.length>=3){authored[1].distance=budget.near*.45;authored[2].distance=budget.near;}
 if(baked){const level=levels.find(l=>l.object===baked);if(level)level.distance=budget.baked;}
 levels.sort((a,b)=>a.distance-b.distance);
}
function dropBaked(mesh){
 const lod=mesh?.userData?.lod,baked=lod?.userData.v2Baked;if(!baked)return;
 const i=lod.levels.findIndex(l=>l.object===baked);if(i>=0)lod.levels.splice(i,1);
 baked.removeFromParent();baked.traverse(o=>{if(o.isMesh)o.geometry.dispose();});lod.userData.v2Baked=null;
}
// Builds the far model from the lowest authored level: paint, glass and lamps keep their
// own (shared, live) materials; every other plain surface becomes one vertex-coloured mesh.
function buildBaked(mesh,budget){
 const lod=mesh.userData.lod;if(!lod||lod.userData.v2Baked||mesh.userData.shattered)return false;
 const authored=lod.levels.filter(l=>l.object),source=authored[authored.length-1]?.object;if(!source)return false;
 const materials=mesh.userData.materials||{},own=new Set([materials.body,materials.electricFrame,materials.head,materials.tail,materials.blue,materials.red].filter(Boolean));
 lod.updateWorldMatrix(true,false);source.updateMatrixWorld(true);
 const inverse=new T.Matrix4().copy(lod.matrixWorld).invert(),kept=new Map(),baked={position:[],normal:[],color:[]};
 // Roughly half a pixel at the distance this model first appears.
 const minEdge=Math.max(.02,Math.min(.07,budget.baked*.0006));
 const visit=o=>{for(const child of o.children){if(!child.visible)continue;if(child.isMesh&&child.geometry?.attributes?.position){const material=child.material;
   if(!own.has(material)&&bakeable(material))appendMesh(baked,child,inverse,material.color,minEdge);
   else if(material&&!Array.isArray(material)){let bucket=kept.get(material);if(!bucket)kept.set(material,bucket={position:[],normal:[],uv:material.map?[]:null});appendMesh(bucket,child,inverse,null,minEdge);}}
  visit(child);}};
 visit(source);
 const group=new T.Group();group.name='v2-baked-far';
 if(baked.position.length){const o=new T.Mesh(finishGeometry(baked),vehicleBakedMaterial());o.castShadow=true;o.receiveShadow=true;group.add(o);}
 for(const[material,bucket]of kept){if(!bucket.position.length)continue;const o=new T.Mesh(finishGeometry(bucket),material);o.castShadow=material===materials.body;o.receiveShadow=!material.transparent;group.add(o);}
 if(!group.children.length)return false;
 lod.addLevel(group,budget.baked,.1);lod.userData.v2Baked=group;return true;
}
if(VM?.refreshDamageLOD){const refresh=VM.refreshDamageLOD;VM.refreshDamageLOD=function(group){dropBaked(group);const result=refresh.apply(this,arguments);if(group?.userData?.lod)group.userData.lod.userData.v2Budget=null;return result;};}
const baseVehicles=S.syncVehicles;
S.syncVehicles=function(sim,dt){
 // Paint style is chosen when a model is built; rebuild the few models made under the other style.
 const clearcoat=!!root.PlatdoV2?.clearcoat;
 for(const[id,r]of this.meshes.vehicles)if(r.v2Clearcoat!==undefined&&r.v2Clearcoat!==clearcoat){this.dynamic.remove(r.mesh);VM?.dispose?.(r.mesh);this.meshes.vehicles.delete(id);}
 baseVehicles.call(this,sim,dt);
 for(const r of this.meshes.vehicles.values())if(r.v2Clearcoat===undefined)r.v2Clearcoat=clearcoat;
 const budget=vehicleBudget(this),camera=this.camera.position;let builds=0;
 for(const r of this.meshes.vehicles.values()){
  const mesh=r.mesh;
  if(!mesh.visible){mesh.matrixWorldAutoUpdate=false;continue;}
  mesh.matrixWorldAutoUpdate=true;
  const lod=mesh.userData.lod;if(!lod)continue;
  applyVehicleDistances(mesh,budget);
  if(!lod.userData.v2Baked&&builds<2){const dx=mesh.position.x-camera.x,dy=mesh.position.y-camera.y,dz=mesh.position.z-camera.z;if(dx*dx+dy*dy+dz*dz>budget.baked*budget.baked*.72&&buildBaked(mesh,budget)){builds++;lod.userData.v2Budget=null;applyVehicleDistances(mesh,budget);}}
 }
};

// ---- 3. People ------------------------------------------------------------------
let bakedPeopleMaterial=null;
function peopleBakedMaterial(){return bakedPeopleMaterial||(bakedPeopleMaterial=new T.MeshStandardMaterial({name:'city-people-baked',vertexColors:true,roughness:.85,metalness:0}));}
const identity=new T.Matrix4();
// Same idea as the model's own per-bone batching, but across materials: each bone ends
// up as one vertex-coloured mesh. Bones, sockets and every animated group are untouched.
// With matteOnly, only the default matte surfaces (skin and cloth, which the baked
// material reproduces exactly) are merged, so close-up characters look the same.
function bakeBones(node,matteOnly=false){
 for(const child of [...node.children])if(!child.isMesh)bakeBones(child,matteOnly);
 const pieces=node.children.filter(c=>c.isMesh&&!c.userData.dynamic&&c.visible&&c.layers.mask===1&&bakeable(c.material)&&(!matteOnly||c.material.metalness===0&&c.material.roughness===.85)&&c.geometry?.attributes?.position);
 if(pieces.length<2)return;
 const out={position:[],normal:[],color:[]};
 for(const piece of pieces){piece.updateMatrix();const saved=piece.matrixWorld;piece.matrixWorld=piece.matrix;appendMesh(out,piece,identity,piece.material.color);piece.matrixWorld=saved;}
 for(const piece of pieces){piece.geometry.dispose();node.remove(piece);}
 const merged=new T.Mesh(finishGeometry(out),peopleBakedMaterial());merged.castShadow=true;merged.receiveShadow=true;merged.name='v2-baked-bone';node.add(merged);
}
// V3: the character models batch themselves (a few skinned meshes each), so nothing is re-baked here.
const basePeople=S.syncPeople;
S.syncPeople=function(sim,dt){
 basePeople.call(this,sim,dt);
 for(const r of this.meshes.people.values())r.mesh.matrixWorldAutoUpdate=r.mesh.visible;
};

// ---- Wiring ---------------------------------------------------------------------
const baseRender=S.render;
S.render=function(sim,dt){installMatrixPass(this);return baseRender.call(this,sim,dt);};
const baseStats=S.stats;
S.stats=function(){const budget=vehicleBudget(this);let baked=0,merged=0,detailed=0;for(const r of this.meshes.vehicles.values()){if(!r.mesh.visible)continue;const lod=r.mesh.userData.lod;if(!lod)continue;const active=lod.levels.find(l=>l.object.visible)?.object;if(active===lod.userData.v2Baked)baked++;else if(active===lod.levels[0]?.object)detailed++;else merged++;}return{...baseStats.call(this),v2:{vehicleNear:budget.near,vehicleBaked:budget.baked,vehiclesDetailed:detailed,vehiclesMerged:merged,vehiclesBaked:baked,matrixPass:!this.v2MatrixPassOff}};};
root.CityRenderBudget={updateVisible,vehicleBudget,buildBaked,dropBaked,bakeBones,installMatrixPass};
})(typeof globalThis!=='undefined'?globalThis:this);
