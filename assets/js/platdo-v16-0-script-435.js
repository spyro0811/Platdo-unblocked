
/* PLATDO City: Christmas, what you see (V13.0). Game only.
 * SNOW ON THE WORLD. The materials of the environment (ground, roads, pavements, roofs, walls, trees, props) are
 *   given a few extra shader lines once, when the scene is made. They do nothing until one shared number (uXmas) is
 *   raised, so switching Christmas Mode never rebuilds a shader, a light or an object. A surface gets snow when
 *   - it faces up (roof tops, ledges, branches, the ground: never the whole object),
 *   - nothing is above it: a top-down height map made from the roofs and decks keeps snow off indoor floors and out
 *     from under canopies and bridges,
 *   - it is not sand: the ground carries its own "sand" value per corner, and a second small map keeps everything
 *     that stands on the beach clear too.
 *   Vehicles and people are never touched: their materials are their own, and only materials found in the
 *   environment groups are changed (the list of groups is checked object by object, see dressAll).
 * SNOWFALL. One cloud of flakes round the camera, moved by the graphics card; a flake under a roof is not drawn.
 * The gray sky is the game's own overcast weather (city-xmas-app.js asks for it), so day and night carry on.
 * Decorations, snowmen, tracks and footprints are added further down this file. */
(function(root){'use strict';
if(typeof document==='undefined')return;
const X=()=>root.CityChristmas;
/* the two maps cover this rectangle of the map (everything that is land) */
const BOX={x0:-1100,z0:-1540,x1:620,z1:900},HCELL=1.25,CCELL=4;
const L={ready:false,building:false,amount:0,scene:null,seen:new WeakSet(),seenRoots:new WeakSet(),cacheSize:0,scanIn:0,time:0,U:null};
function uniforms(T){
 if(L.U)return L.U;const blank=new T.DataTexture(new Uint8Array([255,255,255,255]),1,1);blank.needsUpdate=true;
 const zero=new T.DataTexture(new Float32Array([0]),1,1,T.RedFormat,T.FloatType);zero.needsUpdate=true;
 return L.U={uXmas:{value:0},uXmasH:{value:zero},uXmasC:{value:blank},uXmasBox:{value:new T.Vector4(BOX.x0,BOX.z0,1/(BOX.x1-BOX.x0),1/(BOX.z1-BOX.z0))}};
}
// ---- the shader lines ---------------------------------------------------------------------------------------------
/* kinds: std (faces up + open sky + not on the beach), open (roofs: no sky test), road, pave, terrain (its own sand
 * value), grass (blades), tree (a softer edge) */
const HEAD_V=`varying vec3 vXmasW;
#ifndef FLAT_SHADED
varying vec3 vXmasN;
#endif
`;
const BODY_V=`
{vec4 xmasP=vec4(transformed,1.0);
#ifdef USE_INSTANCING
xmasP=instanceMatrix*xmasP;
#endif
vXmasW=(modelMatrix*xmasP).xyz;
#ifndef FLAT_SHADED
vec3 xmasN=objectNormal;
#ifdef USE_INSTANCING
{mat3 xi=mat3(instanceMatrix);xmasN/=vec3(dot(xi[0],xi[0]),dot(xi[1],xi[1]),dot(xi[2],xi[2]));xmasN=xi*xmasN;}
#endif
{mat3 xm=mat3(modelMatrix);xmasN/=vec3(dot(xm[0],xm[0]),dot(xm[1],xm[1]),dot(xm[2],xm[2]));vXmasN=xm*xmasN;}
#endif
}`;
const headF=kind=>`uniform float uXmas;uniform sampler2D uXmasH;uniform sampler2D uXmasC;uniform vec4 uXmasBox;
varying vec3 vXmasW;
#ifndef FLAT_SHADED
varying vec3 vXmasN;
#endif
${kind==='terrain'?'varying float vXmasA;':''}
float xmasHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float xmasNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(xmasHash(i),xmasHash(i+vec2(1.0,0.0)),f.x),mix(xmasHash(i+vec2(0.0,1.0)),xmasHash(i+vec2(1.0,1.0)),f.x),f.y);}
`;
function bodyF(kind){
 const edge={std:[.52,.8],open:[.3,.62],road:[.5,.8],pave:[.5,.8],terrain:[.42,.72],tree:[.3,.78],fir:[.56,.95],grass:[-2,-1]}[kind]||[.52,.8];const jitter={tree:.4,fir:.8}[kind]||.26;
 const amount={road:.86,grass:.82,tree:.74,fir:.62}[kind]||1,sky=kind!=='open'&&kind!=='tree'&&kind!=='fir'&&kind!=='grass',beach=kind!=='terrain';
 return `
if(uXmas>0.001){
#ifdef FLAT_SHADED
vec3 xmasUp=normalize(cross(dFdx(vXmasW),dFdy(vXmasW)));
#else
vec3 xmasUp=normalize(vXmasN);
#ifdef DOUBLE_SIDED
if(!gl_FrontFacing)xmasUp=-xmasUp;
#endif
#endif
float xmasGrain=xmasNoise(vXmasW.xz*1.9)*.6+xmasNoise(vXmasW.xz*7.1+vXmasW.y*3.0)*.4;
float xmasF=smoothstep(${edge[0].toFixed(2)},${edge[1].toFixed(2)},xmasUp.y+(xmasGrain-.5)*${jitter.toFixed(2)});
vec2 xmasUv=(vXmasW.xz-uXmasBox.xy)*uXmasBox.zw;
if(xmasUv.x>0.0&&xmasUv.x<1.0&&xmasUv.y>0.0&&xmasUv.y<1.0){
vec2 xmasCg=texture2D(uXmasC,xmasUv).rg;
${beach?'xmasF*=smoothstep(.35,.9,xmasCg.r);':''}
${sky?'{vec2 xmasHi=texture2D(uXmasH,xmasUv).rg;float xmasOpen=max(step(xmasHi.r-.45,vXmasW.y),step(xmasCg.g+2.0,vXmasW.y));xmasF*=xmasOpen*step(xmasHi.g-.05,vXmasW.y);}':''}
}
${kind==='terrain'?'xmasF*=smoothstep(.55,.97,vXmasA);':''}
xmasF*=uXmas*${amount.toFixed(2)};
vec3 xmasSnow=${kind==='road'?'vec3(.69,.72,.77)*(.86+.2*xmasGrain)':kind==='pave'?'vec3(.86,.885,.92)*(.93+.08*xmasGrain)':'vec3(.93,.95,.985)*(.93+.08*xmasGrain)'};
diffuseColor.rgb=mix(diffuseColor.rgb,xmasSnow,xmasF);
#ifdef STANDARD
xmasRough=xmasF;
#endif
}`;
}
function inject(shader,kind){
 let v=shader.vertexShader,f=shader.fragmentShader;if(!v.includes('#include <project_vertex>')||v.includes('vXmasW'))return;
 v=HEAD_V+(kind==='terrain'?'attribute float aSnow;varying float vXmasA;\n':'')+v.replace('#include <project_vertex>','#include <project_vertex>'+BODY_V+(kind==='terrain'?'\nvXmasA=aSnow;':''));
 const anchor=['#include <roughnessmap_fragment>','#include <specularmap_fragment>','#include <normal_fragment_begin>'].find(a=>f.includes(a));if(!anchor)return;
 const standard=f.includes('#include <roughnessmap_fragment>')&&f.includes('#include <metalnessmap_fragment>');
 f=headF(kind)+(standard?'float xmasRough=0.0;\n':'')+f.replace(anchor,bodyF(kind).replace('#ifdef STANDARD\nxmasRough=xmasF;\n#endif',standard?'xmasRough=xmasF;':'')+'\n'+anchor);
 if(standard)f=f.replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.94,xmasRough);metalnessFactor*=1.0-xmasRough;');
 Object.assign(shader.uniforms,L.U);shader.vertexShader=v;shader.fragmentShader=f;
}
function dress(m,kind){
 if(!m||L.seen.has(m))return;L.seen.add(m);
 if(!(m.isMeshStandardMaterial||m.isMeshLambertMaterial||m.isMeshPhongMaterial)||m.transparent||m.userData.noSnow)return;
 const prev=m.onBeforeCompile,base=typeof m.customProgramCacheKey==='function'?String(m.customProgramCacheKey()):'';
 m.onBeforeCompile=function(shader,renderer){if(prev)prev.call(this,shader,renderer);inject(shader,kind);};
 m.customProgramCacheKey=()=>base+'|xmas1:'+kind;m.userData.xmas=kind;
 if(m.version>0)m.needsUpdate=true;
}
/* which kind of snow a material gets, from where it is used */
function kindOf(scene,m,mesh){
 const key=L.keys.get(m)||'';
 if(key){const k=key.slice(key.indexOf(':')+1);if(k==='glow'||k==='glass'||k==='arch30-glass'||k==='arch30-interior'||k==='arch30-light')return null;
  if(key==='#414e54:matte')return'road';if(k==='pave')return'pave';if(k==='foliage')return'tree';if(k==='arch30-roof')return'open';return'std';}
 if(m.emissiveIntensity>0&&m.emissive&&(m.emissive.r+m.emissive.g+m.emissive.b)>.05)return null;
 return'std';
}
const DENY=/^(beach-parked-cars|beach-surf|surface-fluid|recreation-banners)$/;
function dressTree(scene,rootObject,forced){
 rootObject.traverse(o=>{if(!o.isMesh||DENY.test(o.name))return;for(let p=o.parent;p&&p!==rootObject;p=p.parent)if(DENY.test(p.name))return;
  for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m||L.seen.has(m))continue;const kind=forced||kindOf(scene,m,o);if(kind)dress(m,kind);else L.seen.add(m);}});
}
function dressAll(scene){
 const T=scene.T;uniforms(T);L.keys=new Map();for(const[k,m]of scene.materials||[])L.keys.set(m,k);L.cacheSize=scene.materials?.size||0;
 const env=scene.environment;if(!env)return;
 for(const child of env.children){
  if(L.seenRoots.has(child)||DENY.test(child.name))continue;L.seenRoots.add(child);
  if(child.name==='terrain-graded')dressTree(scene,child,'terrain');else if(child.name==='ground-grass')dressTree(scene,child,'grass');else dressTree(scene,child);
 }
 for(const child of scene.scene.children){if(L.seenRoots.has(child)||!/^(apartments|houses|shelter-look|city-drive-thrus|city-billboards)$/.test(child.name))continue;L.seenRoots.add(child);dressTree(scene,child);}
}
/* things that are added later (the far copies of city blocks, rooms loaded when you go in) */
function dressNew(scene){
 if((scene.materials?.size||0)!==L.cacheSize){for(const[k,m]of scene.materials)if(!L.keys.has(m)){L.keys.set(m,k);const kind=kindOf(scene,m);if(kind)dress(m,kind);else L.seen.add(m);}L.cacheSize=scene.materials.size;}
 const env=scene.environment;if(!env)return;
 for(const child of env.children){if(DENY.test(child.name))continue;if(!L.seenRoots.has(child)){L.seenRoots.add(child);dressTree(scene,child);}else if(child.name.startsWith('static-cell')&&child.children.length!==child.userData.xmasKids){child.userData.xmasKids=child.children.length;dressTree(scene,child);}}
 for(const child of scene.scene.children)if(/^(apartments|houses|shelter-look|city-drive-thrus)$/.test(child.name)&&child.children.length!==child.userData.xmasKids){child.userData.xmasKids=child.children.length;dressTree(scene,child);}
}
// ---- the two maps ---------------------------------------------------------------------------------------------------
const pause=()=>new Promise(r=>setTimeout(r,0));
async function buildMaps(scene,quick){
 if(L.ready||L.building)return;L.building=true;const T=scene.T,W=scene.world,R=X(),t0=performance.now();let slice=performance.now();
 const breathe=async()=>{if(!quick&&performance.now()-slice>9){await pause();slice=performance.now();}};
 try{
  /* 1. per 1.25 m square: R = the highest roof, deck or canopy over it (only things well above the ground count, so
   *    kerbs, low walls, rocks and fences leave the snow beside them alone), G = the top of any room in it (no snow
   *    below that: upstairs floors and stairs stay clear, the roof above them does not) */
  const nx=Math.ceil((BOX.x1-BOX.x0)/HCELL),nz=Math.ceil((BOX.z1-BOX.z0)/HCELL),H=new Float32Array(nx*nz),I=new Float32Array(nx*nz);
  const splat=(A,x0,x1,z0,z1,top)=>{const a=Math.max(0,Math.ceil((x0-BOX.x0)/HCELL-.5)),b=Math.min(nx-1,Math.floor((x1-BOX.x0)/HCELL-.5)),c=Math.max(0,Math.ceil((z0-BOX.z0)/HCELL-.5)),d=Math.min(nz-1,Math.floor((z1-BOX.z0)/HCELL-.5));for(let j=c;j<=d;j++){const row=j*nx;for(let i=a;i<=b;i++)if(A[row+i]<top)A[row+i]=top;}};
  let n=0;for(const b of W.colliders){
   if((++n&1023)===0)await breathe();
   if(b.door||b.prop||b.breakable||b.stair||b.snowOpen||b.xmasTree||b.id.startsWith('prop-'))continue;/* trees, lamps, benches and rocks are not roofs */const w=b.maxX-b.minX,d=b.maxZ-b.minZ;if(Math.min(w,d)<.9&&!b.roofSupport)continue;
   const cx=(b.minX+b.maxX)/2,cz=(b.minZ+b.maxZ)/2;if(b.maxY-W.terrainHeight(cx,cz)<2.1)continue;
   splat(H,b.minX,b.maxX,b.minZ,b.maxZ,b.maxY);
  }
  for(const s of W.interiors||[])if(Number.isFinite(s.w)&&Number.isFinite(s.h)){splat(H,s.x-s.w/2,s.x+s.w/2,s.z-s.d/2,s.z+s.d/2,s.y+s.h);splat(I,s.x-s.w/2+.2,s.x+s.w/2-.2,s.z-s.d/2+.2,s.z+s.d/2-.2,s.y+s.h-.3);}
  for(const a of W.apartments||[])if(Number.isFinite(a.w))splat(I,a.x-a.w/2+.3,a.x+a.w/2-.3,a.z-a.d/2+.3,a.z+a.d/2-.3,(Number.isFinite(a.roofY)?a.roofY:a.y+a.h)-.25);
  {const b=W.shelter?.building;if(b)splat(I,b.x-b.w/2+.3,b.x+b.w/2-.3,b.z-b.d/2+.3,b.z+b.d/2-.3,(b.roofY||b.y+b.h)-.25);}
  const HS=root.CityHouses;if(HS)for(const h of W.houses||[]){const q=HS.boxWorld(h,-HS.HX+.2,HS.HX-.2,0,0,-HS.HZ+.2,HS.HZ-.2);splat(I,q.x0,q.x1,q.z0,q.z1,h.y+HS.CEIL2+.12);}
  await breathe();
  const half=new Uint16Array(nx*nz*2),hf=T.DataUtils.toHalfFloat;for(let i=0;i<nx*nz;i++){if((i&262143)===0)await breathe();half[i*2]=hf(H[i]);half[i*2+1]=hf(I[i]);}
  const th=new T.DataTexture(half,nx,nz,T.RGFormat,T.HalfFloatType);th.magFilter=th.minFilter=T.NearestFilter;th.wrapS=th.wrapT=T.ClampToEdgeWrapping;th.generateMipmaps=false;th.needsUpdate=true;
  /* 2. per 4 m square: R = 0 over the beach and the sea and 1 elsewhere (each square takes the lowest value found in
   *    and around it, so nothing standing on sand is ever counted as snowy), G = the height of the bare ground */
  const cx=Math.ceil((BOX.x1-BOX.x0)/CCELL),cz=Math.ceil((BOX.z1-BOX.z0)/CCELL),raw=new Float32Array(cx*cz),ground=new Float32Array(cx*cz);
  for(let j=0;j<cz;j++){if((j&7)===0)await breathe();const z=BOX.z0+(j+.5)*CCELL;for(let i=0;i<cx;i++){const x=BOX.x0+(i+.5)*CCELL;raw[j*cx+i]=R.bare(W,x,z)?0:1;ground[j*cx+i]=W.terrainHeight(x,z);}}
  const cg=new Uint16Array(cx*cz*2);for(let j=0;j<cz;j++)for(let i=0;i<cx;i++){let v=1;for(let dj=-1;dj<=1&&v;dj++)for(let di=-1;di<=1;di++){const a=i+di,b=j+dj;if(a<0||b<0||a>=cx||b>=cz||raw[b*cx+a]===0){v=0;break;}}cg[(j*cx+i)*2]=hf(v);cg[(j*cx+i)*2+1]=hf(ground[j*cx+i]);}
  const tc=new T.DataTexture(cg,cx,cz,T.RGFormat,T.HalfFloatType);tc.magFilter=tc.minFilter=T.LinearFilter;tc.wrapS=tc.wrapT=T.ClampToEdgeWrapping;tc.generateMipmaps=false;tc.needsUpdate=true;await breathe();
  /* 3. the ground's own sand value at every corner of its mesh: it is mixed across each triangle exactly as the
   *    ground's colour is, so the snow ends where the grass colour ends, also where the mesh is coarse */
  const grid=scene.groundGrid,pos=grid?.positions,count=pos?pos.length/3:0,snow=new Float32Array(count),B=root.CityBeach,CW=root.CityWorld;
  for(let i=0;i<count;i++){if((i&4095)===0)await breathe();const x=pos[i*3],z=pos[i*3+2];snow[i]=CW.landHeight(x,z)<2.5?0:1-Math.min(1,(B?.weight?.(x,z)||0)*1.6);}
  const attr=new T.BufferAttribute(snow,1);for(const mesh of scene.terrain?.children||[])if(mesh.geometry&&!mesh.geometry.attributes.aSnow)mesh.geometry.setAttribute('aSnow',attr);
  L.U.uXmasH.value=th;L.U.uXmasC.value=tc;L.maps={H,I,nx,nz,th,tc,ground,cx,cz};L.ready=true;L.buildMs=Math.round(performance.now()-t0);
 }catch(e){L.error=String(e&&e.stack||e).slice(0,400);}finally{L.building=false;}
}
/* how high the roof is over a place (for the snowmen, tracks and footprints that are drawn on the ground) */
function roofAt(x,z){const m=L.maps;if(!m)return 0;const i=Math.floor((x-BOX.x0)/HCELL),j=Math.floor((z-BOX.z0)/HCELL);return i<0||j<0||i>=m.nx||j>=m.nz?0:m.H[j*m.nx+i];}
// ---- snowfall --------------------------------------------------------------------------------------------------------
function buildFlakes(scene){
 const T=scene.T,N=3200,seed=new Float32Array(N*3),size=new Float32Array(N);let s=9173;const r=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
 for(let i=0;i<N;i++){seed[i*3]=r();seed[i*3+1]=r();seed[i*3+2]=r();size[i]=.6+r()*.8;}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(seed,3));g.setAttribute('aSize',new T.BufferAttribute(size,1));g.boundingSphere=new T.Sphere(new T.Vector3(),1e6);
 const m=new T.ShaderMaterial({transparent:true,depthWrite:false,fog:false,uniforms:{uTime:{value:0},uCam:{value:new T.Vector3()},uAmount:{value:0},uScale:{value:600},uDim:{value:1},uXmasH:L.U.uXmasH,uXmasBox:L.U.uXmasBox},
  vertexShader:`uniform float uTime;uniform vec3 uCam;uniform float uScale;uniform sampler2D uXmasH;uniform vec4 uXmasBox;attribute float aSize;varying float vFade;
const vec3 BOXS=vec3(64.0,30.0,64.0);
void main(){
 vec3 p=position*BOXS;float fall=1.5+aSize*.9;
 p.y-=uTime*fall;p.x+=sin(uTime*.55+position.z*31.0)*.55+uTime*.35;p.z+=cos(uTime*.43+position.x*27.0)*.55;
 p=mod(p-uCam,BOXS)-BOXS*.5+uCam;
 vec2 uv=(p.xz-uXmasBox.xy)*uXmasBox.zw;float roof=(uv.x>0.0&&uv.x<1.0&&uv.y>0.0&&uv.y<1.0)?texture2D(uXmasH,uv).r:0.0;
 vec4 mv=viewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;
 float d=-mv.z;vFade=smoothstep(32.0,22.0,length(p-uCam))*smoothstep(.4,1.6,d);
 if(p.y<roof-.25)gl_Position=vec4(2.0,2.0,2.0,1.0);
 gl_PointSize=clamp(aSize*uScale*.06/max(d,.5),1.4,9.0);
}`,
  fragmentShader:`uniform float uAmount;uniform float uDim;varying float vFade;
void main(){vec2 c=gl_PointCoord-.5;float r=length(c);if(r>.5)discard;float a=smoothstep(.5,.12,r)*vFade*uAmount*.9;if(a<.01)discard;gl_FragColor=vec4(vec3(.97,.98,1.0)*uDim,a);}`});
 const points=new T.Points(g,m);points.name='xmas-snowfall';points.frustumCulled=false;points.renderOrder=6;points.visible=false;scene.scene.add(points);return points;
}
// ---- every frame -----------------------------------------------------------------------------------------------------
function frame(scene,sim,dt){
 if(!scene||!scene.T||!sim)return;const T=scene.T;uniforms(T);
 if(L.scene!==scene){L.scene=scene;L.seen=new WeakSet();L.seenRoots=new WeakSet();L.ready=false;L.maps=null;L.amount=0;L.flakes=null;L.scanIn=0;dressAll(scene);parts.forEach(p=>p.reset&&p.reset(scene));}
 L.time+=dt||0;L.scanIn-=dt||0;if(L.scanIn<=0){L.scanIn=1.2;dressNew(scene);}
 const st=sim.xmas,on=!!(st&&st.on);
 if(on&&!L.ready&&!L.building)buildMaps(scene,!scene.v109Warm);
 const target=on&&L.ready?1:0;if(L.amount!==target){const step=(dt||.016)/2.2;L.amount=target>L.amount?Math.min(target,L.amount+step):Math.max(target,L.amount-step*1.6);}
 L.U.uXmas.value=L.amount*L.amount*(3-2*L.amount);
 if(L.amount>0&&!L.flakes)L.flakes=buildFlakes(scene);
 if(L.flakes){const f=L.flakes,u=f.material.uniforms;f.visible=L.amount>.002&&!scene.underwater;if(f.visible){u.uTime.value=L.time;u.uCam.value.copy(scene.camera.position);u.uAmount.value=L.amount;u.uScale.value=scene.renderer.domElement.height/Math.tan((scene.camera.fov||60)*Math.PI/360)*.5;
   const day=root.CitySky?.daylight?root.CitySky.daylight(sim.dayTime??.5):1;u.uDim.value=.42+.58*day;f.geometry.setDrawRange(0,[900,1700,2400,3200][Math.max(0,Math.min(3,(scene.graphics?.particles??2)))]||2400);}}
 if(scene.groundGrass&&scene.groundGrass.userData)scene.groundGrass.userData.xmas=L.amount;
 for(const p of parts)p.frame&&p.frame(scene,sim,dt||0,L.amount,on);
}
const parts=[];
function install(){
 const Scene=root.CityScene;if(!Scene)return false;if(Scene.prototype._xmasLook)return true;Scene.prototype._xmasLook=true;
 const old=Scene.prototype.atmosphere;Scene.prototype.atmosphere=function(sim,dt){try{frame(this,sim,dt);}catch(e){L.frameError=String(e&&e.stack||e).slice(0,500);}return old.call(this,sim,dt);};return true;
}
/* the scene's own code is loaded after this file */if(!install()){const timer=setInterval(()=>{if(install())clearInterval(timer);},250);}
root.CityXmasLook={L,parts,roofAt,frame,BOX,dress,uniforms};
})(typeof window!=='undefined'?window:globalThis);
