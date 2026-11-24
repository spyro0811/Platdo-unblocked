
/* PLATDO City: the billboards (V12.4). Game only.
 * The world lists them (island-layout.js BILLBOARDS: one per advert the owner made, never repeated) with solid posts and
 * panels. This draws each: two steel posts behind, a dark backing box, a frame round the picture, the picture itself
 * (city-billboard-ads.js), a catwalk under it and four lamp heads over it. The picture glows a little after dark (its
 * own light, no real lamp: the city never adds lights). No two faces share a plane: the picture stands 7 cm proud of
 * the backing, the frame bars only meet its edges. */
(function(root){'use strict';
if(typeof document==='undefined')return;
let built=null,timer=0;
function build(){
 const C=root.PlatdoCity,T=root.THREE,world=C?.sim?.world,scene=C?.scene?.scene;if(!T||!world||!scene||!Array.isArray(world.billboards))return;
 if(built&&built.world===world&&built.scene===scene)return;drop();
 const ads=root.CityBillboardAds||{},group=new T.Group();group.name='city-billboards';
 const steel=new T.MeshStandardMaterial({color:'#59626b',metalness:.55,roughness:.42}),dark=new T.MeshStandardMaterial({color:'#2b3137',metalness:.35,roughness:.55}),back=new T.MeshStandardMaterial({color:'#7d868e',metalness:.25,roughness:.7}),lamp=new T.MeshStandardMaterial({color:'#f4f1e6',emissive:'#fff6d8',emissiveIntensity:.2,roughness:.4});
 const box=(w,h,d)=>new T.BoxGeometry(w,h,d),G={post:box(.46,1,.46),backing:box(13,6.5,.3),barH:box(13.6,.3,.46),barV:box(.3,6.6,.44),walk:box(13,.1,.85),rail:box(13,.06,.06),arm:box(.08,.08,1.1),head:box(.5,.16,.3),face:new T.PlaneGeometry(13,6.5)};
 const loader=new T.TextureLoader(),maxAniso=Math.min(8,C.scene.renderer?.capabilities?.getMaxAnisotropy?.()||4),faces=[];
 const add=(parent,geo,mat,x,y,z,sy=1)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);if(sy!==1)m.scale.y=sy;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 for(const b of world.billboards){
  const g=new T.Group();g.name=b.id;g.position.set(b.x,b.y,b.z);g.rotation.y=b.yaw;const L=b.lift,H=b.h,mid=L+H/2;
  for(const s of[-1,1]){const h=L+H*.8+.5;add(g,G.post,steel,s*4.6,h/2-.5,-.55,h);}
  add(g,G.backing,back,0,mid,-.1);
  /* the frame bars reach 3 cm into the backing and the side bars sit 1 cm back from the top and bottom bars, so no faces share a plane */
  add(g,G.barH,dark,0,mid+H/2+.12,0);add(g,G.barH,dark,0,mid-H/2-.12,0);add(g,G.barV,dark,-6.63,mid,0);add(g,G.barV,dark,6.63,mid,0);
  add(g,G.walk,steel,0,L-.55,.45);add(g,G.rail,steel,0,L+.35,.86);
  for(const x of[-4.9,-1.6,1.6,4.9]){add(g,G.arm,steel,x,mid+H/2+.42,.45).rotation.x=0;add(g,G.head,lamp,x,mid+H/2+.42,1.02);}
  const url=ads[b.ad];let mat;
  if(url){const tex=loader.load(url,()=>{try{C.scene.renderer?.initTexture?.(tex);}catch(_){}});tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=maxAniso;mat=new T.MeshStandardMaterial({map:tex,emissive:'#ffffff',emissiveMap:tex,emissiveIntensity:.18,roughness:.62,metalness:0});}
  else mat=new T.MeshStandardMaterial({color:'#d9d4c8',roughness:.8});
  const face=add(g,G.face,mat,0,mid,.12);face.castShadow=false;faces.push(face);
  group.add(g);}
 scene.add(group);built={world,scene,group,faces,geos:Object.values(G),mats:[steel,dark,back,lamp],lamp};glow();}
/* after dark the pictures and lamp heads glow; by day only a touch, so the colours stay true */
function glow(){if(!built)return;const t=root.PlatdoCity?.sim?.dayTime;if(!Number.isFinite(t))return;const h=t*24,night=h<6.2||h>19.3?1:h<7.4?(7.4-h)/1.2:h>18.1?(h-18.1)/1.2:0;
 for(const f of built.faces)if(f.material.emissiveMap)f.material.emissiveIntensity=.18+night*.62;built.lamp.emissiveIntensity=.2+night*1.4;}
function drop(){if(!built)return;try{built.scene.remove(built.group);for(const f of built.faces){f.material.map?.dispose?.();f.material.dispose();}for(const g of built.geos)g.dispose();for(const m of built.mats)m.dispose();}catch(_){}built=null;}
/* the world can change (a new game, an online room): check now and then and build for the world that is there */
function check(){try{build();glow();}catch(e){if(!check.warned){check.warned=true;console.warn('Billboards',e);}}}
timer=setInterval(check,1500);
root.CityBillboards={build,check,get built(){return built;}};
})(typeof globalThis!=='undefined'?globalThis:this);
