
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
function restoreAll(){for(const c of cands.values())if(c.hidden)setHidden(c,false);stats.hidden=0;for(const[obj,e]of stand)if(e.far){setFar(obj,false);if(e.group)e.group.visible=false;e.far=false;}for(const e of cells.values())showCell(e,false);}
/* V9.1: far stand-ins. The starter home and the mansion are made of a couple of hundred pieces with nearly one
 * material each. From more than 70 m away they are drawn as a baked copy instead: every solid piece in one mesh with
 * its colour in the vertices, and the glass in a second. The copy is rebuilt when the model's pieces change. */
const FAR_NAMES=/^(authored-starter-home|mega-modern-mansion)$/,FAR=50/* V10.9: was 70 */,stand=new Map();
/* V11.7: the rooms of the starter home are loaded only when you come close (CityInside, group 'home-inside'); they are
   left out of the count and of the copy, so going in and out of the house no longer throws the copy away each time. */
const LAZY=/-inside$/;
const meshCount=o=>{let n=0;const w=q=>{if(q!==o&&LAZY.test(q.name||''))return;if(q.isMesh)n++;for(const c of q.children)w(c);};w(o);return n;};
function bake(view,obj){const T=view.T,t0=performance.now();obj.updateMatrixWorld(true);const inv=new T.Matrix4().copy(obj.matrixWorld).invert(),nm=new T.Matrix3(),v=new T.Vector3(),nv=new T.Vector3(),col=new T.Color();
 /* V11.7: the copy no longer skips batched pieces (an InstancedMesh: the whole shell of the starter home is one per shape and
    colour), it copies them one instance at a time; and it walks the model even while the model itself is hidden (its
    renderer hides it when you are far away, which is exactly when the copy is wanted), skipping only hidden parts inside
    it such as the mansion's upper floors. Before, the copy held almost nothing and the house seemed to vanish.
    Parts under 0.3 m are left out (they cannot be seen from 50 m), and the copy is written straight into fixed arrays:
    first every part is listed and counted, then copied. */
 const im=new T.Matrix4(),ic=new T.Color(),bx=new T.Box3(),sz=new T.Vector3(),parts=[];let nS=0,nG=0;
 const take=o=>{if(!o.isMesh||o.isSkinnedMesh||!o.geometry?.attributes?.position)return;const mat=Array.isArray(o.material)?o.material[0]:o.material;if(!mat)return;
  const g=o.geometry,count=g.index?g.index.count:g.attributes.position.count,clear=mat.transparent&&mat.opacity<.95;if(!count)return;if(!g.boundingBox)g.computeBoundingBox();
  const base=new T.Color().copy(mat.color||ic.set(1,1,1));if(mat.emissive&&(mat.emissiveIntensity||0)>.5)base.lerp(mat.emissive,.5);
  const copies=o.isInstancedMesh?o.count:1;
  for(let n=0;n<copies;n++){const m=new T.Matrix4().multiplyMatrices(inv,o.matrixWorld);const c=base.clone();if(o.isInstancedMesh){o.getMatrixAt(n,im);m.multiply(im);if(o.instanceColor){o.getColorAt(n,ic);c.multiply(ic);}}
   bx.copy(g.boundingBox).applyMatrix4(m).getSize(sz);if(Math.max(sz.x,sz.y,sz.z)<.3)continue;
   parts.push({g,m,c,clear,count});if(clear)nG+=count;else nS+=count;}};
 const visit=o=>{if(o!==obj&&(!o.visible||LAZY.test(o.name||'')))return;take(o);for(const c of o.children)visit(c);};visit(obj);
 const solid={p:new Float32Array(nS*3),n:new Float32Array(nS*3),c:new Float32Array(nS*3),at:0},glass={p:new Float32Array(nG*3),n:new Float32Array(nG*3),c:null,at:0};
 for(const q of parts){const out=q.clear?glass:solid,g=q.g,pos=g.attributes.position,nrm=g.attributes.normal,vc=g.attributes.color,idx=g.index,P=out.p,N=out.n,Cc=out.c;nm.getNormalMatrix(q.m);col.copy(q.c);
  for(let k=0;k<q.count;k++){const i=idx?idx.getX(k):k,a=out.at*3;v.fromBufferAttribute(pos,i).applyMatrix4(q.m);P[a]=v.x;P[a+1]=v.y;P[a+2]=v.z;
   if(nrm){nv.fromBufferAttribute(nrm,i).applyMatrix3(nm).normalize();N[a]=nv.x;N[a+1]=nv.y;N[a+2]=nv.z;}else N[a+1]=1;
   if(Cc){Cc[a]=col.r*(vc?vc.getX(i):1);Cc[a+1]=col.g*(vc?vc.getY(i):1);Cc[a+2]=col.b*(vc?vc.getZ(i):1);}out.at++;}}
 const grp=new T.Group();grp.name=obj.name+'-far';
 const make=(b,mat,shadow)=>{if(!b.p.length)return;const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(b.p,3));geo.setAttribute('normal',new T.BufferAttribute(b.n,3));if(b.c)geo.setAttribute('color',new T.BufferAttribute(b.c,3));geo.computeBoundingSphere();const me=new T.Mesh(geo,mat);me.castShadow=shadow;me.receiveShadow=true;grp.add(me);};
 stats.farBakes=(stats.farBakes||0)+1;stats.farVerts=(stats.farVerts||0)+nS+nG;
 make(solid,new T.MeshStandardMaterial({vertexColors:true,roughness:.75,metalness:.05}),true);
 make(glass,new T.MeshStandardMaterial({color:'#8fb3c2',transparent:true,opacity:.4,roughness:.1,metalness:.1,depthWrite:false}),false);
 grp.position.copy(obj.position);grp.quaternion.copy(obj.quaternion);grp.scale.copy(obj.scale);grp.visible=false;obj.parent.add(grp);stats.farBakeMs=Math.max(stats.farBakeMs||0,Math.round((performance.now()-t0)*10)/10);return grp;}
/* V11.7: the copies are made while the City loads, so the first walk away from home does not stop the game to make one. */
function prewarm(view){if(!enabled||!view?.scene||!view.T)return 0;let n=0;
 for(const holder of view.scene.children){if(!holder.children?.length)continue;for(const obj of holder.children){if(!FAR_NAMES.test(obj.name||''))continue;
  let e=stand.get(obj);if(!e){e={group:null,far:false,kids:-1,bb:new view.T.Box3()};stand.set(obj,e);}
  const k=meshCount(obj);if(k!==e.kids){e.kids=k;if(e.far){setFar(obj,false);e.far=false;}dropStand(e);e.bb.setFromObject(obj);}
  if(!e.group){try{e.group=bake(view,obj);n++;}catch(error){stats.farError=String(error&&error.message||error);}}}}
 return n;}
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
/* V11.0: far stand-ins for the city's blocks. The buildings and street furniture are drawn in blocks of 128 m and
 * 256 m, each as one batch per shape and material: about 1,300 batches in all, several hundred of them on screen when
 * you look across the city. A block more than 220 m away is now drawn as up to three merged pieces instead: every
 * plain solid part in one (its colour in the vertices), the window glass in a second and the glowing parts in a third.
 * Left as they are: tree leaves and palm fronds, and the window bays of the towers and brick blocks, which are too
 * many triangles to copy (they stay batched). Parts smaller than 0.3 m are left out of the far piece. The pieces are
 * made a few milliseconds at a time, the first time a block is far away, and kept. */
const CELL=/^static-cell:/,CELL_FAR=220,CELL_NEAR=195,CELL_KEEP=/^(flora-leaf|flora-leaf-lite|frond|arch30-bay:)/,cells=new Map(),welds=new WeakMap(),queue=[];
const CELL_SHADE={'arch30-brick':.94,'arch30-stone':.98,'arch30-timber':.95,'arch30-panel':.97,brick:.9,foliage:.9,metal:.75,'arch30-metal':.7};
const shapeOf=g=>g.userData?.citySharedShape||g.name||'';
function kindOf(view,m){let map=view.v110Kinds;if(!map||view.v110KindCount!==view.materials.size){map=view.v110Kinds=new Map();view.v110KindCount=view.materials.size;for(const[k,q]of view.materials)map.set(q,k.slice(k.indexOf(':')+1));}return map.get(m)||m.name||'';}
function cellClass(view,im){const m=im.material,g=im.geometry;if(!m||Array.isArray(m)||!m.isMeshStandardMaterial||m.map||!g?.attributes?.position||CELL_KEEP.test(shapeOf(g)))return null;const kind=kindOf(view,m);
 if(kind==='arch30-glass')return'glass';if(m.transparent||kind==='glass'||kind==='arch30-light'||kind.startsWith('arch30-facade-'))return null;return kind==='glow'?'glow':'solid';}
// A shape's corners without repeats, and its triangles as numbers into them (flat shading needs no normals).
function weld(g){const pos=g.attributes.position;let w=welds.get(pos);if(w&&w.index===g.index)return w;const idx=g.index,n=idx?idx.count:pos.count,seen=new Map(),P=[],I=new Uint32Array(n);
 for(let k=0;k<n;k++){const i=idx?idx.getX(k):k,x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),h=Math.round(x*1e4)+'|'+Math.round(y*1e4)+'|'+Math.round(z*1e4);let u=seen.get(h);if(u===undefined){u=P.length/3;seen.set(h,u);P.push(x,y,z);}I[k]=u;}
 w={index:g.index,P:new Float32Array(P),I};welds.set(pos,w);return w;}
function farSolid(view){return view.v110Solid||(view.v110Solid=new view.T.MeshStandardMaterial({name:'city-far-solid',vertexColors:true,flatShading:true,roughness:.86,metalness:0}));}
function farGlow(view){if(view.v110Glow)return view.v110Glow;const m=view.v110Glow=new view.T.MeshStandardMaterial({name:'city-far-glow',vertexColors:true,flatShading:true,roughness:.5,metalness:0,emissive:'#ffffff',emissiveIntensity:.15});
 m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance*=vColor.rgb;\n#endif');};m.customProgramCacheKey=()=>'city-far-glow-v1';return m;}
function farGlass(view,src){let m=view.v110Glass;if(!m||m.userData.v110Src!==src.uuid){m=view.v110Glass=src.clone();m.name='city-far-glass';m.vertexColors=true;m.flatShading=true/* the merged pieces carry no normals */;m.forceSinglePass=true;m.userData={v110Src:src.uuid};view.v110GlassSrc=src;}return m;}
// The far materials follow the real ones: the glass with the reflection setting, the glow with the time of day.
function tuneFar(view){const g=view.v110Glass,s=view.v110GlassSrc;if(g&&s){g.roughness=s.roughness;g.metalness=s.metalness;g.opacity=s.opacity;g.envMapIntensity=s.envMapIntensity;g.color.copy(s.color);}
 if(view.v110Glow){let ref=view.v110GlowRef;if(!ref)for(const[k,q]of view.materials)if(k.endsWith(':glow')){ref=view.v110GlowRef=q;break;}if(ref)view.v110Glow.emissiveIntensity=ref.emissiveIntensity;}}
function bakeCell(view,e){const T=view.T,obj=e.obj,m=new T.Matrix4(),col=new T.Color(),tint=new T.Color(),parts={solid:{p:[],c:[],i:[]},glass:{p:[],c:[],i:[],mat:null},glow:{p:[],c:[],i:[]}};e.baked=[];e.tris=0;
 for(const im of obj.children){if(!im.isInstancedMesh)continue;const cls=cellClass(view,im);if(!cls)continue;const mat=im.material,out=parts[cls];if(cls==='glass'){if(out.mat&&out.mat!==mat)continue;out.mat=mat;}
  const g=im.geometry,w=weld(g),P=w.P,I=w.I,nv=P.length/3,f=CELL_SHADE[kindOf(view,mat)]||1,own=im.matrix.elements,moved=own[12]||own[13]||own[14]||own[0]!==1||own[5]!==1||own[10]!==1;if(!g.boundingBox)g.computeBoundingBox();const bb=g.boundingBox,bx=bb.max.x-bb.min.x,by=bb.max.y-bb.min.y,bz=bb.max.z-bb.min.z;
  for(let k=0;k<im.count;k++){im.getMatrixAt(k,m);if(moved)m.premultiply(im.matrix);const a=m.elements;if(Math.hypot(bx*Math.hypot(a[0],a[1],a[2]),by*Math.hypot(a[4],a[5],a[6]),bz*Math.hypot(a[8],a[9],a[10]))<.3)continue;
   if(im.instanceColor)tint.fromBufferAttribute(im.instanceColor,k);else tint.setRGB(1,1,1);if(cls==='glass')col.copy(tint);else col.copy(mat.color).multiply(tint).multiplyScalar(f);
   const r=Math.min(65535,Math.round(col.r*65535)),gr=Math.min(65535,Math.round(col.g*65535)),b=Math.min(65535,Math.round(col.b*65535)),base=out.p.length/3;
   for(let v=0;v<nv;v++){const x=P[v*3],y=P[v*3+1],z=P[v*3+2];out.p.push(a[0]*x+a[4]*y+a[8]*z+a[12],a[1]*x+a[5]*y+a[9]*z+a[13],a[2]*x+a[6]*y+a[10]*z+a[14]);out.c.push(r,gr,b);}
   if(m.determinant()<0)for(let t=0;t<I.length;t+=3)out.i.push(base+I[t],base+I[t+2],base+I[t+1]);else for(let t=0;t<I.length;t++)out.i.push(base+I[t]);}
  e.baked.push(im);}
 const grp=new T.Group();grp.name=obj.name+'-far';grp.matrixAutoUpdate=false;grp.visible=false;
 const make=(o,mat)=>{if(!o.i.length)return;const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(new Float32Array(o.p),3));geo.setAttribute('color',new T.BufferAttribute(new Uint16Array(o.c),3,true));geo.setIndex(new T.BufferAttribute(new Uint32Array(o.i),1));geo.computeBoundingSphere();geo.computeBoundingBox();const me=new T.Mesh(geo,mat);me.castShadow=false;me.receiveShadow=false;me.matrixAutoUpdate=false;grp.add(me);e.tris+=o.i.length/3;};
 make(parts.solid,farSolid(view));if(parts.glass.mat)make(parts.glass,farGlass(view,parts.glass.mat));make(parts.glow,farGlow(view));
 if(!grp.children.length||!e.baked.length){e.baked=[];e.empty=true;return;}obj.add(grp);grp.updateMatrixWorld(true);e.group=grp;e.kids=obj.children.length;}
function dropCell(e){if(e.far)showCell(e,false);if(e.group){e.group.removeFromParent();e.group.traverse(o=>{if(o.isMesh)o.geometry.dispose();});e.group=null;}e.baked=null;e.empty=false;}
function showCell(e,far){if(!e.group)far=false;if(e.far===far)return;e.far=far;for(const im of e.baked||[])im.visible=!far;if(e.group)e.group.visible=far;}
function cellStep(view,p,rescanned){
 if(rescanned){for(const holder of view.scene.children){if(!holder.children?.length)continue;for(const obj of holder.children){if(!CELL.test(obj.name||'')||cells.has(obj))continue;const bb=new view.T.Box3().setFromObject(obj);if(bb.isEmpty())continue;cells.set(obj,{obj,bb,far:false,group:null,baked:null,queued:false,empty:false,kids:-1,tris:0});}}
  for(const[obj,e]of cells){if(!obj.parent){dropCell(e);cells.delete(obj);}else if(e.group&&e.kids!==obj.children.length){/* the block gained or lost parts */dropCell(e);}}tuneFar(view);}
 let far=0;
 for(const e of cells.values()){const bb=e.bb,dn=Math.hypot(Math.max(bb.min.x-p.x,0,p.x-bb.max.x),Math.max(bb.min.z-p.z,0,p.z-bb.max.z)),want=dn>(e.far?CELL_NEAR:CELL_FAR);e.want=want;
  if(want&&!e.group&&!e.empty&&!e.queued){e.queued=true;queue.push(e);}else showCell(e,want);if(e.far)far++;}
 stats.cellsFar=far;stats.cells=cells.size;
}
// Makes the far pieces that are waiting, a few milliseconds a frame.
function cellWork(view){if(!queue.length)return;const t=performance.now();let n=0;
 while(queue.length&&(n===0||performance.now()-t<2.5)){const e=queue.shift();e.queued=false;if(!e.obj.parent||e.group)continue;const t1=performance.now();try{bakeCell(view,e);}catch(error){e.empty=true;stats.cellError=String(error&&error.message||error);}const ms=performance.now()-t1;stats.cellBakes=(stats.cellBakes||0)+1;stats.cellBakeMs=Math.max(stats.cellBakeMs||0,ms);stats.cellBakeTotal=(stats.cellBakeTotal||0)+ms;stats.cellTris=(stats.cellTris||0)+e.tris;showCell(e,!!e.want);n++;}
 if(n)tuneFar(view);}
function update(view){
 if(!enabled||!view?.world||!view.camera||!view.scene)return;
 const t0=performance.now();
 if(blockWorld!==view.world){blockers=buildBlockers(view.world);blockWorld=view.world;stats.blockers=blockers.length;dirty=true;}
 let rescanned=false;if(t0-scanAt>1000){scanAt=t0;scan(view);rescanned=true;}
 const cam=view.camera,p=cam.parent&&cam.parent!==view.scene?cam.getWorldPosition(new view.T.Vector3()):cam.position;
 if(rescanned||Math.abs(p.x-lastX)>=.2||Math.abs(p.z-lastZ)>=.2){try{farStep(view,p,rescanned);}catch(_){}/* V11.0 */try{cellStep(view,p,rescanned);}catch(error){stats.cellError=String(error&&error.message||error);}}
 cellWork(view);
 if(!dirty&&Math.abs(p.x-lastX)<.2&&Math.abs(p.y-lastY)<.2&&Math.abs(p.z-lastZ)<.2)return;
 lastX=p.x;lastY=p.y;lastZ=p.z;dirty=false;
 raster(p.x,p.y,p.z);let n=0;
 for(const c of cands.values()){const h=hidden(c.bb,p.x,p.y,p.z);if(h!==c.hidden)setHidden(c,h);if(h)n++;}
 stats.hidden=n;stats.ms=performance.now()-t0;
}
root.CityOcclusion={update,stats,prewarm,
 setEnabled(v){enabled=!!v;if(!enabled)restoreAll();else dirty=true;},
 get enabled(){return enabled;},
 hiddenNames(){return[...cands.values()].filter(c=>c.hidden).map(c=>c.obj.name);}};
})(typeof window!=='undefined'?window:globalThis);
