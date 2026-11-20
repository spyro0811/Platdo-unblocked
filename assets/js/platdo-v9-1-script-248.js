
/* V8.9: occlusion culling for PLATDO City: a building behind a building is not drawn.
 * Blockers are the solid towers, townhouses and brick blocks (their box volumes, shrunk a little). Shops and
 * restaurants (glass fronts), homes, the mansion and the casino never block.
 * Seen from the camera, each blocker covers a range of directions between two heights; that goes into a horizon
 * table of 720 directions by 44 distance bands. A candidate (a cell of the city's buildings, the district detail,
 * a home, the mansion, the casino, a sign, the beach car park) is hidden only when, in every direction it spans,
 * blockers that are wholly nearer than it cover it from its bottom to its top. Nothing within 30 m is hidden.
 * Only the camera's position matters (the table covers all directions), so it is rebuilt only when the camera moves.
 * Hidden things move from layer 0 to layer 3, which the sun's shadow camera also sees, so their shadows stay. */
(function(root){'use strict';
const BINS=720,RINGS=44,R0=4,LK=Math.log(1.13),BW=Math.PI*2/BINS,HID=3,KEEP=30,REACH=650;
const NAMES=/^(static-cell|prepared-district|authored-starter-home|mega-modern-mansion|Palm Cove Casino|architecture-door|storefront-sign|beach-parked-cars|ground-scatter)/;
const BLOCKING=new Set(['tower','townhouse','brick']);
const top=new Float32Array(BINS*RINGS),bot=new Float32Array(BINS*RINGS);
let blockers=[],blockWorld=null,scanAt=-1e9,lastX=NaN,lastY=NaN,lastZ=NaN,enabled=true,dirty=true;
const cands=new Map(),stats={blockers:0,used:0,candidates:0,hidden:0,ms:0,builds:0};
const ringOf=d=>d<=R0?0:Math.min(RINGS-1,Math.ceil(Math.log(d/R0)/LK));
function buildBlockers(world){
 const out=[];
 for(const b of world.buildings||[]){
  if(b.interior||b.customHome||b.customMansion||b.customWorkshop||b.casino||!b.architecture||!BLOCKING.has(b.style)||b.worldYaw)continue;
  for(const v of b.architecture.volumes||[]){
   if(v.type&&v.type!=='box')continue;if(!(v.h>=3&&v.w>1.5&&v.d>1.5))continue;
   const x=b.x+(v.x||0),z=b.z+(v.z||0),y0=b.y+(v.y||0),i=.3;
   out.push({x0:x-v.w/2+i,x1:x+v.w/2-i,z0:z-v.d/2+i,z1:z+v.d/2-i,y0:y0+.05,y1:y0+v.h-.15,cx:x,cz:z});
  }
 }
 return out;
}
// Directions are measured with atan2(dx,dz); a span is found from the four corners relative to the centre direction.
function span(x0,x1,z0,z1,cx,cz){
 const ac=Math.atan2((x0+x1)/2-cx,(z0+z1)/2-cz);let lo=Infinity,hi=-Infinity;
 for(let k=0;k<4;k++){const px=k&1?x1:x0,pz=k&2?z1:z0;let d=Math.atan2(px-cx,pz-cz)-ac;if(d>Math.PI)d-=2*Math.PI;else if(d<-Math.PI)d+=2*Math.PI;if(d<lo)lo=d;if(d>hi)hi=d;}
 return[ac+lo,ac+hi];
}
function raster(cx,cy,cz){
 top.fill(-1e9);bot.fill(-1e9);let used=0;
 for(const o of blockers){
  if(Math.abs(o.cx-cx)>REACH||Math.abs(o.cz-cz)>REACH)continue;
  const nx=Math.max(o.x0-cx,0,cx-o.x1),nz=Math.max(o.z0-cz,0,cz-o.z1),dn=Math.hypot(nx,nz);if(dn<.75)continue;
  const df=Math.hypot(Math.max(Math.abs(o.x0-cx),Math.abs(o.x1-cx)),Math.max(Math.abs(o.z0-cz),Math.abs(o.z1-cz)));
  // Lowest top and highest bottom it can show in any direction it covers: a safe (smaller) interval.
  const t=(o.y1-cy)/df,b=Math.max((o.y0-cy)/dn,(o.y0-cy)/df);if(!(t>b))continue;
  const[a0,a1]=span(o.x0,o.x1,o.z0,o.z1,cx,cz),k0=Math.ceil(a0/BW),k1=Math.floor(a1/BW)-1;if(k1<k0)continue;
  used++;const r=ringOf(df);
  for(let k=k0;k<=k1;k++){const i=(((k%BINS)+BINS)%BINS)*RINGS+r;if(t>top[i])top[i]=t;if(b>bot[i])bot[i]=b;}
 }
 // Each band also holds everything nearer than it.
 for(let bin=0;bin<BINS;bin++){const s=bin*RINGS;for(let r=1;r<RINGS;r++){const i=s+r;if(top[i-1]>top[i])top[i]=top[i-1];if(bot[i-1]>bot[i])bot[i]=bot[i-1];}}
 stats.used=used;stats.builds++;
}
function hidden(bb,cx,cy,cz){
 const nx=Math.max(bb.min.x-cx,0,cx-bb.max.x),nz=Math.max(bb.min.z-cz,0,cz-bb.max.z),dn=Math.hypot(nx,nz);if(dn<KEEP)return false;
 const df=Math.hypot(Math.max(Math.abs(bb.min.x-cx),Math.abs(bb.max.x-cx)),Math.max(Math.abs(bb.min.z-cz),Math.abs(bb.max.z-cz)));
 const t=Math.max((bb.max.y-cy)/dn,(bb.max.y-cy)/df),b=Math.min((bb.min.y-cy)/dn,(bb.min.y-cy)/df),r=ringOf(dn)-1;if(r<0)return false;
 const[a0,a1]=span(bb.min.x,bb.max.x,bb.min.z,bb.max.z,cx,cz);if(a1-a0>Math.PI*.9)return false;
 for(let k=Math.floor(a0/BW),k1=Math.floor(a1/BW);k<=k1;k++){const i=(((k%BINS)+BINS)%BINS)*RINGS+r;if(!(top[i]>=t&&bot[i]<=b))return false;}
 return true;
}
const drawable=o=>o.isMesh||o.isPoints||o.isLine||o.isSprite;
function setHidden(c,h){
 c.hidden=h;
 c.obj.traverse(o=>{if(!drawable(o))return;
  if(h){if(o.userData.occMask===undefined&&(o.layers.mask&1)){o.userData.occMask=o.layers.mask;o.layers.mask=(o.layers.mask&~1)|(1<<HID);}}
  else if(o.userData.occMask!==undefined){o.layers.mask=o.userData.occMask;delete o.userData.occMask;}});
}
// Finds candidates once a second. A candidate's box is measured when it is new or its parts changed, and
// otherwise every eighth pass, so the pass stays well under a millisecond.
let passes=0;
function scan(view){
 const T=view.T,seen=new Set(),full=++passes%8===0;let changed=false;
 for(const holder of view.scene.children){
  if(!holder.children?.length)continue;
  for(const o of holder.children){
   if(!NAMES.test(o.name||''))continue;seen.add(o);let c=cands.get(o),fresh=false;
   if(!c){c={obj:o,bb:new T.Box3(),hidden:false,kids:-1};cands.set(o,c);fresh=true;}
   if(!fresh&&!full&&c.kids===o.children.length)continue;
   c.kids=o.children.length;c.bb.setFromObject(o);changed=true;
   if(c.bb.isEmpty()||!Number.isFinite(c.bb.min.x)){if(c.hidden)setHidden(c,false);cands.delete(o);continue;}
   if(c.hidden)setHidden(c,true);/* parts added since it was hidden */
  }
 }
 for(const[o,c]of cands)if(!seen.has(o)){if(c.hidden)setHidden(c,false);cands.delete(o);changed=true;}
 for(const o of view.scene.children)if(o.isLight&&o.castShadow&&o.shadow?.camera)o.shadow.camera.layers.enable(HID);
 stats.candidates=cands.size;if(changed)dirty=true;
}
function restoreAll(){for(const c of cands.values())if(c.hidden)setHidden(c,false);stats.hidden=0;for(const[obj,e]of stand)if(e.far){setFar(obj,false);if(e.group)e.group.visible=false;e.far=false;}}
/* V9.1: far stand-ins. The starter home and the mansion are made of a couple of hundred pieces with nearly one
 * material each. From more than 70 m away they are drawn as a baked copy instead: every solid piece in one mesh with
 * its colour in the vertices, and the glass in a second. The copy is rebuilt when the model's pieces change. */
const FAR_NAMES=/^(authored-starter-home|mega-modern-mansion)$/,FAR=70,stand=new Map();
const meshCount=o=>{let n=0;o.traverse(q=>{if(q.isMesh)n++;});return n;};
function bake(view,obj){const T=view.T;obj.updateMatrixWorld(true);const inv=new T.Matrix4().copy(obj.matrixWorld).invert(),m=new T.Matrix4(),nm=new T.Matrix3(),solid={p:[],n:[],c:[]},glass={p:[],n:[]},v=new T.Vector3(),nv=new T.Vector3(),col=new T.Color();
 obj.traverseVisible(o=>{if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||!o.geometry?.attributes?.position)return;const mat=Array.isArray(o.material)?o.material[0]:o.material;if(!mat)return;
  const g=o.geometry,pos=g.attributes.position,nrm=g.attributes.normal,vc=g.attributes.color,idx=g.index,count=idx?idx.count:pos.count,clear=mat.transparent&&mat.opacity<.95,out=clear?glass:solid;
  m.multiplyMatrices(inv,o.matrixWorld);nm.getNormalMatrix(m);col.copy(mat.color||col.set(1,1,1));if(mat.emissive&&(mat.emissiveIntensity||0)>.5)col.lerp(mat.emissive,.5);
  for(let k=0;k<count;k++){const i=idx?idx.getX(k):k;v.fromBufferAttribute(pos,i).applyMatrix4(m);out.p.push(v.x,v.y,v.z);if(nrm){nv.fromBufferAttribute(nrm,i).applyMatrix3(nm).normalize();out.n.push(nv.x,nv.y,nv.z);}else out.n.push(0,1,0);
   if(!clear)out.c.push(col.r*(vc?vc.getX(i):1),col.g*(vc?vc.getY(i):1),col.b*(vc?vc.getZ(i):1));}});
 const grp=new T.Group();grp.name=obj.name+'-far';
 const make=(b,mat,shadow)=>{if(!b.p.length)return;const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));if(b.c)geo.setAttribute('color',new T.Float32BufferAttribute(b.c,3));geo.computeBoundingSphere();const me=new T.Mesh(geo,mat);me.castShadow=shadow;me.receiveShadow=true;grp.add(me);};
 make(solid,new T.MeshStandardMaterial({vertexColors:true,roughness:.75,metalness:.05}),true);
 make(glass,new T.MeshStandardMaterial({color:'#8fb3c2',transparent:true,opacity:.4,roughness:.1,metalness:.1,depthWrite:false}),false);
 grp.position.copy(obj.position);grp.quaternion.copy(obj.quaternion);grp.scale.copy(obj.scale);grp.visible=false;obj.parent.add(grp);return grp;}
function dropStand(e){if(!e?.group)return;e.group.removeFromParent();e.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});e.group=null;}
function setFar(obj,far){obj.traverse(o=>{if(!drawable(o))return;if(far){if(o.userData.farMask===undefined){o.userData.farMask=o.layers.mask;o.layers.mask=0;}}else if(o.userData.farMask!==undefined){o.layers.mask=o.userData.farMask;delete o.userData.farMask;}});}
function farStep(view,p,checkKids){
 for(const holder of view.scene.children){if(!holder.children?.length)continue;for(const obj of holder.children){if(!FAR_NAMES.test(obj.name||''))continue;
  let e=stand.get(obj);if(!e){e={group:null,far:false,kids:-1,bb:new view.T.Box3()};stand.set(obj,e);checkKids=true;}
  if(checkKids){const k=meshCount(obj);if(k!==e.kids){e.kids=k;if(e.far){setFar(obj,false);e.far=false;}dropStand(e);e.bb.setFromObject(obj);}}
  const bb=e.bb;if(bb.isEmpty())continue;const dn=Math.hypot(Math.max(bb.min.x-p.x,0,p.x-bb.max.x),Math.max(bb.min.z-p.z,0,p.z-bb.max.z));
  if(!e.far&&dn>FAR){if(!e.group)e.group=bake(view,obj);setFar(obj,true);e.group.visible=true;e.far=true;}
  else if(e.far&&dn<FAR-10){setFar(obj,false);if(e.group)e.group.visible=false;e.far=false;}}}
 for(const[obj,e]of stand)if(!obj.parent){dropStand(e);stand.delete(obj);}
}
function update(view){
 if(!enabled||!view?.world||!view.camera||!view.scene)return;
 const t0=performance.now();
 if(blockWorld!==view.world){blockers=buildBlockers(view.world);blockWorld=view.world;stats.blockers=blockers.length;dirty=true;}
 let rescanned=false;if(t0-scanAt>1000){scanAt=t0;scan(view);rescanned=true;}
 const cam=view.camera,p=cam.parent&&cam.parent!==view.scene?cam.getWorldPosition(new view.T.Vector3()):cam.position;
 if(rescanned||Math.abs(p.x-lastX)>=.2||Math.abs(p.z-lastZ)>=.2)try{farStep(view,p,rescanned);}catch(_){}
 if(!dirty&&Math.abs(p.x-lastX)<.2&&Math.abs(p.y-lastY)<.2&&Math.abs(p.z-lastZ)<.2)return;
 lastX=p.x;lastY=p.y;lastZ=p.z;dirty=false;
 raster(p.x,p.y,p.z);let n=0;
 for(const c of cands.values()){const h=hidden(c.bb,p.x,p.y,p.z);if(h!==c.hidden)setHidden(c,h);if(h)n++;}
 stats.hidden=n;stats.ms=performance.now()-t0;
}
root.CityOcclusion={update,stats,
 setEnabled(v){enabled=!!v;if(!enabled)restoreAll();else dirty=true;},
 get enabled(){return enabled;},
 hiddenNames(){return[...cands.values()].filter(c=>c.hidden).map(c=>c.obj.name);}};
})(typeof window!=='undefined'?window:globalThis);
