
/* PLATDO City sea (V4.5). The sea used to be one flat-coloured sheet. This adds, without changing where the
 * water is or how anything floats:
 * - ripples: a tiling picture of wave slopes, made once, is laid over the sea four times at different sizes and
 *   drift directions; the light then sees a moving surface, so the sun and the sky break up on it;
 * - depth: the ground under the sea is photographed once from straight above into a small picture of depths;
 *   shallow water is clear and turquoise, deep water keeps the sea colour;
 * - foam: a white edge and a lacy fringe wherever the sea meets land, breathing in and out.
 * The beach draws its own surf in a cut-out of the sea; it gets the same ripples and depth colour so no edge shows. */
(function(root){'use strict';
const SIZE=4000,HALF=SIZE/2;let shared=null;
// Wave slopes that tile: a sum of waves whose lengths divide the picture exactly, most of the height in the long ones.
function waves(T,renderer){
 if(shared)return shared;
 const N=256,data=new Uint8Array(N*N*4),gx=new Float32Array(N*N),gz=new Float32Array(N*N),hh=new Float32Array(N*N),list=[];
 let seed=90217;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 while(list.length<30){const kx=Math.round((rnd()*2-1)*10),kz=Math.round((rnd()*2-1)*10),k=Math.hypot(kx,kz);if(k<1.5||k>10.5)continue;list.push({kx,kz,a:Math.pow(k,-1.5)*(.6+rnd()*.8),p:rnd()*Math.PI*2});}
 const sin=new Float32Array(N),cos=new Float32Array(N);for(let i=0;i<N;i++){sin[i]=Math.sin(i/N*Math.PI*2);cos[i]=Math.cos(i/N*Math.PI*2);}
 let gmax=0,hmax=0;
 for(const w of list){const po=Math.round(w.p/(Math.PI*2)*N);for(let z=0;z<N;z++)for(let x=0;x<N;x++){const ph=((w.kx*x+w.kz*z+po)%N+N)%N,i=z*N+x,s=sin[ph];gx[i]-=w.a*w.kx*s;gz[i]-=w.a*w.kz*s;hh[i]+=w.a*cos[ph];}}
 for(let i=0;i<N*N;i++){gmax=Math.max(gmax,Math.abs(gx[i]),Math.abs(gz[i]));hmax=Math.max(hmax,Math.abs(hh[i]));}
 for(let i=0;i<N*N;i++){data[i*4]=Math.round(127.5+127.5*gx[i]/gmax);data[i*4+1]=Math.round(127.5+127.5*gz[i]/gmax);data[i*4+2]=Math.round(127.5+127.5*hh[i]/hmax);data[i*4+3]=255;}
 const t=new T.DataTexture(data,N,N,T.RGBAFormat);t.name='sea-waves';t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=Math.min(8,renderer?.capabilities?.getMaxAnisotropy?.()||1);t.needsUpdate=true;
 return shared=t;
}
function blank(T){const t=new T.DataTexture(new Uint8Array([255,255,255,255]),1,1,T.RGBAFormat);t.needsUpdate=true;return t;}
const state=scene=>scene.sea||(scene.sea={uniforms:{seaWaves:{value:waves(scene.T,scene.renderer)},seaDepth:{value:blank(scene.T)},seaTime:{value:0},seaReady:{value:0},seaChop:{value:1},seaArea:{value:new scene.T.Vector4(-HALF,-HALF,1/SIZE,1/SIZE)}},target:null,tried:false,materials:[]});
const HEAD='uniform sampler2D seaWaves;uniform sampler2D seaDepth;uniform float seaTime;uniform float seaReady;uniform float seaChop;uniform vec4 seaArea;varying vec3 vSeaPos;\n';
// Depth is stored as a square root so the first metre of water gets most of the steps.
const DEPTH='vec2 seaUv=vec2((vSeaPos.x-seaArea.x)*seaArea.z,1.-(vSeaPos.z-seaArea.y)*seaArea.w);float seaEnc=texture2D(seaDepth,seaUv).r;float seaDeep=mix(40.,seaEnc*seaEnc*31.5-1.5,seaReady);';
const COLOUR=foam=>'{'+DEPTH+'float seaClear=exp(-max(seaDeep,0.)*.4);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.3,.72,.68),seaClear*.8);diffuseColor.a=mix(diffuseColor.a,.3,exp(-max(seaDeep,0.)*1.1));'+(foam?
 'vec2 sp=vSeaPos.xz;float l1=texture2D(seaWaves,sp/9.1+seaTime*vec2(.011,.007)).b,l2=texture2D(seaWaves,vec2(sp.y,sp.x)/5.7-seaTime*vec2(.013,.009)).b;float web=smoothstep(.8,.97,1.-abs(l1+l2-1.)*2.2);float swash=.5+.5*sin(seaTime*.7+sp.x*.031+sp.y*.027);'+
 'float edge=1.-smoothstep(.02,.16+.2*swash,seaDeep);float fringe=(1.-smoothstep(.15,1.1+.9*swash,seaDeep))*(.2+.8*web);float seaFoam=clamp(max(edge,fringe*.85),0.,1.)*seaReady;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.95,.97,.97),seaFoam);diffuseColor.a=max(diffuseColor.a,seaFoam*.92);':'')+'}';
// Four copies of the slope picture, each turned and sized differently. Turning the picture turns its slopes too.
const NORMAL='{vec2 sp=vSeaPos.xz;float st=seaTime;'+
 'vec2 a=texture2D(seaWaves,sp/67.+st*vec2(.0052,.0031)).xy-.5,b=texture2D(seaWaves,vec2(sp.y,-sp.x)/23.+st*vec2(-.011,.0083)).xy-.5;'+
 'vec2 c=texture2D(seaWaves,vec2(.8*sp.x-.6*sp.y,.6*sp.x+.8*sp.y)/7.3+st*vec2(.027,-.019)).xy-.5,e=texture2D(seaWaves,vec2(-.6*sp.x-.8*sp.y,.8*sp.x-.6*sp.y)/2.1+st*vec2(-.05,.06)).xy-.5;'+
 'vec2 g=(a*.26+vec2(-b.y,b.x)*.36+vec2(.8*c.x+.6*c.y,-.6*c.x+.8*c.y)*.42+vec2(-.6*e.x+.8*e.y,-.8*e.x-.6*e.y)*.24)*seaChop;'+
 'vec3 seaN=normalize((viewMatrix*vec4(normalize(vec3(-g.x,1.,-g.y)),0.)).xyz);\n#ifdef DOUBLE_SIDED\nseaN*=faceDirection;\n#endif\nnormal=seaN;}';
function enhance(scene,material,foam){
 const S=state(scene),before=material.onBeforeCompile,key=material.customProgramCacheKey;
 material.onBeforeCompile=(shader,renderer)=>{if(before)before.call(material,shader,renderer);Object.assign(shader.uniforms,S.uniforms);
  shader.vertexShader='varying vec3 vSeaPos;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvSeaPos=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader=HEAD+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+COLOUR(foam)).replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+NORMAL);};
 material.customProgramCacheKey=()=>(key?key.call(material):'')+'|sea-v1'+(foam?'-foam':'');
 material.needsUpdate=true;S.materials.push(material);
}
// The open sea. Called before the beach cuts its patch out of the same material.
function install(scene,material){
 enhance(scene,material,true);
 if(!scene._seaDispose){const old=scene.dispose;scene._seaDispose=true;scene.dispose=function(...args){release(this);return old.apply(this,args);};}
}
// The beach's own patch of water: same ripples and depth colour, its own foam.
function surf(scene){const m=scene.beachSurf?.material;if(m)enhance(scene,m,false);}
// One picture of the sea bed from straight above. Drawn from the ground that is actually on screen, so the
// foam sits exactly where the sea meets it.
function capture(scene){
 const T=scene.T,r=scene.renderer,S=state(scene),ground=scene.terrain;if(!ground||!r)return false;
 const size=Math.min(2048,r.capabilities.maxTextureSize||2048),one=r.capabilities.isWebGL2;
 const target=new T.WebGLRenderTarget(size,size,{depthBuffer:false,stencilBuffer:false,format:one?T.RedFormat:T.RGBAFormat,type:T.UnsignedByteType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false});
 const material=new T.ShaderMaterial({vertexShader:'varying float vH;void main(){vec4 w=modelMatrix*vec4(position,1.);vH=w.y;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:'varying float vH;void main(){float v=sqrt(clamp((1.5-vH)/31.5,0.,1.));gl_FragColor=vec4(v,v,v,1.);}',side:T.DoubleSide,fog:false,toneMapped:false,depthTest:false,depthWrite:false});
 const stage=new T.Scene();ground.updateMatrixWorld(true);ground.traverse(o=>{if(!o.isMesh)return;const copy=new T.Mesh(o.geometry,material);copy.matrixAutoUpdate=false;copy.matrix.copy(o.matrixWorld);copy.matrixWorld.copy(o.matrixWorld);copy.frustumCulled=false;stage.add(copy);});
 // Looking straight down with north (-z) at the top: across the picture is x, up the picture is -z.
 const camera=new T.OrthographicCamera(-HALF,HALF,HALF,-HALF,1,6000);camera.position.set(0,3000,0);camera.up.set(0,0,-1);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
 const was=r.getRenderTarget(),colour=r.getClearColor(new T.Color()),alpha=r.getClearAlpha(),auto=r.autoClear,xr=r.xr.enabled,shadows=r.shadowMap.autoUpdate;
 try{r.xr.enabled=false;r.shadowMap.autoUpdate=false;r.autoClear=true;r.setRenderTarget(target);r.setClearColor(0xffffff,1);r.render(stage,camera);}
 finally{r.setRenderTarget(was);r.setClearColor(colour,alpha);r.autoClear=auto;r.xr.enabled=xr;r.shadowMap.autoUpdate=shadows;
  // Thrown away a little later: the renderer may still be asking the graphics card about this shader, and
  // deleting it at once makes the browser log a warning for each question.
  setTimeout(()=>material.dispose(),4000);}
 S.target?.dispose();S.target=target;S.uniforms.seaDepth.value=target.texture;S.uniforms.seaReady.value=1;return true;
}
function update(scene,time){
 const S=scene.sea;if(!S)return;S.uniforms.seaTime.value=time;
 if(!S.tried&&scene.terrain){S.tried=true;try{capture(scene);}catch(error){S.failed=String(error&&error.message||error);console.error('City sea depth picture failed',error);}}
}
function release(scene){const S=scene.sea;if(!S)return;S.target?.dispose();S.uniforms.seaDepth.value?.dispose?.();scene.sea=null;}
root.CityWater={install,surf,update,capture,release,state};
})(typeof globalThis!=='undefined'?globalThis:this);
/* PLATDO City water effects (V14.6). Splashes, spray and ripples on the water the game draws:
 * - a splash (flying droplets, a patch of foam and ripple rings) when a person, a bike, a car, a boat or a ball lands in
 *   the water, sized by how fast it hits and how heavy it is;
 * - ripples round a person standing in the water or treading water, and a foam wake behind a swimmer;
 * - in shallow water a small splash and ripple at each footstep (more spray when running), and spray thrown by each
 *   wheel that grows with speed, with ripples washing round the tyres;
 * - a little camera shake when the car you are in plunges into deep water (scene.waterShake, read by the camera).
 * It is three instanced meshes and no lights. Heights come from the water actually on screen: the sea's own wave mesh,
 * the beach's own breaking waves (its mesh and the same formula as its shader), or a pool's flat surface, so the foam
 * and the rings lie on the water rather than in it or above it. Works alone and online (it only watches positions). */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);},fract=x=>x-Math.floor(x);
const MAX_DROPS=720,MAX_RINGS=200,MAX_FOAM=100,NEAR=85,RING_Y=.046,FOAM_Y=.034,SEA=230/* the beach's patch of water reaches this far out (city-beach.js) */;
// ---- the water surface on screen ------------------------------------------------------------------------------------
/* the sea: a regular grid whose vertex heights the scene moves every few frames; the height inside the triangle */
function seaHeight(scene,x,z){const m=scene.water,g=m?.geometry,a=g?.attributes?.position,p=g?.parameters;if(!a||!p)return null;
 const n=p.widthSegments,half=p.width/2,cell=p.width/n,lx=x-m.position.x+half,lz=z-m.position.z+half,ix=Math.floor(lx/cell),iz=Math.floor(lz/cell);if(ix<0||iz<0||ix>=n||iz>=n)return null;
 const u=lx/cell-ix,v=lz/cell-iz,row=n+1,ia=iz*row+ix,ib=(iz+1)*row+ix,ic=ib+1,id=ia+1,h=i=>a.getY(i)+m.position.y;
 return u+v<=1?h(ia)+(h(id)-h(ia))*u+(h(ib)-h(ia))*v:h(ic)+(h(ib)-h(ic))*(1-u)+(h(id)-h(ic))*(1-v);}
/* the beach's own water: its rows and columns (city-beach.js buildSurf), each vertex lifted as its shader does */
const ROWS=[9,7.5,6.2,5.1,4.2,3.4,2.7,2,1.3,.6,0,-.8,-1.8,-3,-4.5,-6.5,-9,-12,-16,-21,-27,-34,-42,-52,-64,-78,-94,-112,-132,-155,-180,-205,-SEA-.3];
function crest(s,x,t){const f=fract((s-t*3.2+2.6*Math.sin(x*.021+t*.11)+1.4*Math.sin(x*.057+1.7))/22);return Math.pow(Math.max(0,1-Math.abs(f-.5)*5),1.5);}
function surfY(x,z,s,bed,t){const swell=.08*Math.sin(x*.025+t*.7)+.055*Math.sin(z*.032-t*.5),lift=.34*smooth(-95,-14,s)*(1-smooth(-7,-.5,s))*crest(s,x,t);return Math.max(swell*(1-smooth(-25,1,s))+lift,bed+.03);}
function surfRun(x,t){const ph=t/6.875+.35*Math.sin(x*.013)+.2*Math.sin(x*.047+1.3);return 3.5+3.2*Math.pow(.5+.5*Math.sin(6.2832*ph),1.6)+.22*Math.sin(x*.9+t*.7);}
function inBeach(B,x,z){const Z=B?.ZONE;if(!Z||!(x>Z.x0&&x<Z.x1&&z>700))return false;const bz=x<-200?920+(x+750)*.1636364:1010-(x+200)*.2291667,bk=x<-200?1.0133:1.0259;return z<bz+SEA*bk;}
/* the height of the beach's water at x,z, or null where it is not drawn (up the sand past the wash) */
function beachHeight(scene,x,z,t){const S=scene.beachSurf,B=root.CityBeach,g=S?.mesh?.geometry;if(!g||!B?.shoreZ)return undefined;const pos=g.attributes.position,shore=g.attributes.beachShore,bed=g.attributes.beachBed;if(!pos||!shore||!bed)return undefined;
 const Z=B.ZONE,cols=Math.round((Z.x1-Z.x0)/5),i=Math.floor((x-Z.x0)/5);if(i<0||i>=cols)return undefined;const row=cols+1,u=(x-(Z.x0+i*5))/5,zAt=j=>{const a=j*row+i;return pos.getZ(a)+(pos.getZ(a+1)-pos.getZ(a))*u;};
 let j=-1;for(let k=0;k<ROWS.length-1;k++){const z0=zAt(k),z1=zAt(k+1);if(z>=Math.min(z0,z1)&&z<=Math.max(z0,z1)){j=k;break;}}if(j<0)return undefined;
 const a=j*row+i,c=a+row,z0=zAt(j),z1=zAt(j+1),v=(z-z0)/((z1-z0)||1),tri=u+v<=1?[a,c,a+1]:[a+1,c,c+1];
 const P=tri.map(k=>[pos.getX(k),pos.getZ(k)]),d=(P[1][1]-P[2][1])*(P[0][0]-P[2][0])+(P[2][0]-P[1][0])*(P[0][1]-P[2][1]);if(!d)return undefined;
 const w0=((P[1][1]-P[2][1])*(x-P[2][0])+(P[2][0]-P[1][0])*(z-P[2][1]))/d,w1=((P[2][1]-P[0][1])*(x-P[2][0])+(P[0][0]-P[2][0])*(z-P[2][1]))/d,w2=1-w0-w1,W=[w0,w1,w2];
 let s=0,h=0;tri.forEach((k,n)=>{const sk=shore.getX(k);s+=sk*W[n];h+=surfY(pos.getX(k),pos.getZ(k),sk,bed.getX(k),t)*W[n];});
 return s>surfRun(x,t)?null:h;}
/* the water surface on screen at x,z, or null where there is none */
function surface(scene,x,z){const w=scene.world,t=scene.time||0,level=w?.waterHeight?.(x,z,t);if(!Number.isFinite(level))return null;
 if(Number.isFinite(w.mansion?.waterAt?.(x,z)))return level;const I=root.CityIsland;if(I?.poolAt&&I.poolAt(x,z)!==null)return level;
 if(inBeach(root.CityBeach,x,z)){const b=beachHeight(scene,x,z,t);if(b!==undefined)return b;}
 const s=seaHeight(scene,x,z);return Number.isFinite(s)?s:level;}
function bedAt(scene,x,z){const h=scene.world?.terrainHeight?.(x,z);return Number.isFinite(h)?h:-50;}
// ---- the three meshes -----------------------------------------------------------------------------------------------
function shade(T,geo,f){const p=geo.attributes.position,c=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const r=Math.hypot(p.getX(i),p.getZ(i)),k=clamp(f(r)||0,0,1);c[i*3]=c[i*3+1]=c[i*3+2]=k;}geo.setAttribute('color',new T.BufferAttribute(c,3));return geo;}
function build(scene){const T=scene.T;if(!T||!scene.environment)return null;
 const glow=()=>new T.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,fog:true});
 const make=(geo,mat,n,name)=>{const m=new T.InstancedMesh(geo,mat,n);m.name=name;m.frustumCulled=false;m.renderOrder=12;m.count=0;m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(n*3),3);m.instanceColor.setUsage(T.DynamicDrawUsage);scene.environment.add(m);return m;};
 const ring=new T.RingGeometry(.74,1,44,2);ring.rotateX(-Math.PI/2);shade(T,ring,r=>1-Math.abs(r-.87)/.13);
 const foam=new T.CircleGeometry(1,28);foam.rotateX(-Math.PI/2);shade(T,foam,r=>Math.pow(Math.max(0,1-r),1.7));/* (max: a rim vertex can sit a hair past 1, and a negative number to a power is not a number) */
 const drop=new T.IcosahedronGeometry(1,1);
 const F={scene,drops:[],rings:[],foam:[],track:new Map(),seed:1234567,frame:0,
  dropMesh:make(drop,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.78,depthWrite:false,fog:true}),MAX_DROPS,'water-fx-drops'),
  ringMesh:make(ring,glow(),MAX_RINGS,'water-fx-rings'),foamMesh:make(foam,glow(),MAX_FOAM,'water-fx-foam'),
  dummy:new T.Object3D(),color:new T.Color()};
 F.rnd=()=>{F.seed=(Math.imul(F.seed,1664525)+1013904223)>>>0;return F.seed/4294967296;};
 return F;}
// ---- what can be spawned ---------------------------------------------------------------------------------------------
function drop(F,x,y,z,vx,vy,vz,size,life){if(F.drops.length<MAX_DROPS)F.drops.push({x,y,z,vx,vy,vz,s:size,life,max:life,floor:y-.05});}
function ring(F,x,z,y,r0,r1,life,b,delay=0){if(F.rings.length<MAX_RINGS)F.rings.push({x,z,y,r0,r1,life,max:life,b,delay});}
function foam(F,x,z,y,r0,r1,life,b){if(F.foam.length<MAX_FOAM)F.foam.push({x,z,y,r0,r1,life,max:life,b,delay:0});}
/* a splash of size k (about .2 for a step off a jetty, 1 for a dive, up to 3 for a car), pushed along dx,dz */
function splash(F,x,y,z,k,dx=0,dz=0){const r=F.rnd,q=Math.sqrt(k),n=Math.min(150,Math.round(12+k*44));
 for(let i=0;i<n;i++){const a=r()*Math.PI*2,out=(.4+r()*1.4)*q,up=(1.2+r()*2.4)*q*(i%5===0?1.35:1),o=.12*q;drop(F,x+Math.cos(a)*o,y+.03,z+Math.sin(a)*o,Math.cos(a)*out+dx*.35,up,Math.sin(a)*out+dz*.35,(.014+r()*.022)*(.85+Math.min(k,3)*.18),.5+r()*.6);}
 foam(F,x,z,y,.2*q,.5+k*.8,1.3+k*.55,.42);ring(F,x,z,y,.3*q,1.5+k*2.3,1.7+k*.45,.6);ring(F,x,z,y,.2*q,1+k*1.6,1.5+k*.35,.42,.32);if(k>1.4)ring(F,x,z,y,.4,2.4+k*2.6,2.2+k*.4,.3,.7);}
/* a footstep in shallow water: a little kick of droplets forward and up, and a small ring */
function step(F,x,y,z,k,fx,fz){const r=F.rnd,n=Math.round(4+k*16);for(let i=0;i<n;i++){const a=r()*Math.PI*2,out=(.25+r()*.9)*(.6+k);drop(F,x,y+.02,z,Math.cos(a)*out*.6+fx*(.6+k*1.6)*r(),(.8+r()*1.6)*(.55+k*.9),Math.sin(a)*out*.6+fz*(.6+k*1.6)*r(),.012+r()*.016+k*.008,.35+r()*.35);}
 ring(F,x,z,y,.08,.42+k*.7,.85+k*.35,.48);if(k>.45)foam(F,x,z,y,.06,.22+k*.3,.6,.22);}
/* spray thrown by a wheel turning in shallow water */
function spray(F,x,y,z,fx,fz,speed,count){const r=F.rnd,sx=fz,sz=-fx;for(let i=0;i<count;i++){const side=(r()<.5?-1:1)*(.6+r()*1.5),back=-(.15+r()*.3)*speed*.35;drop(F,x,y+.05,z,fx*back+sx*side,1+r()*1.4+speed*.11,fz*back+sz*side,.016+r()*.022,.45+r()*.4);}}
// ---- watching people, vehicles and balls ----------------------------------------------------------------------------
function track(F,key,o){let s=F.track.get(key);if(!s){s={x:o.x,y:o.y,z:o.z,seen:false,wet:false,deep:false,air:false,timer:0,foot:1,acc:[0,0,0,0],rings:[0,0,0,0],vy:0};F.track.set(key,s);}s.frame=F.frame;return s;}
function move(s,o,dt){const dx=o.x-s.x,dz=o.z-s.z,dy=o.y-s.y,jump=Math.hypot(dx,dz)>8||Math.abs(dy)>6;const v={x:jump?0:dx/dt,y:jump?0:dy/dt,z:jump?0:dz/dt,jump};s.x=o.x;s.y=o.y;s.z=o.z;return v;}
function people(F,scene,sim,dt,cam){const list=[];if(sim.player&&!sim.player.vehicleId)list.push(['me',sim.player]);for(const n of sim.npcs||[])if(n&&!n.vehicleId&&n.health!==0)list.push(['n:'+n.id,n]);
 for(const [key,p] of list){if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.hypot(p.x-cam.x,p.z-cam.z)>NEAR)continue;const s=track(F,key,p),v=move(s,p,dt),hs=Math.hypot(v.x,v.z);
  const w=surface(scene,p.x,p.z);if(w===null){s.wet=false;s.seen=true;continue;}
  const swim=p.mode==='swimming',wet=swim||p.y<w-.03,yaw=hs>.4?Math.atan2(v.x,v.z):(Number.isFinite(p.yaw)?p.yaw:0),fx=Math.sin(yaw),fz=Math.cos(yaw);
  /* into the water: from a fall, a jump, a dive or a run in, sized by how hard */
  if(wet&&!s.wet&&s.seen&&!v.jump){const fall=Math.max(0,-v.y,-(s.vy||0)),k=clamp(fall*.2+hs*.07,.14,1.5);if(fall>1.1||hs>2.2||swim)splash(F,p.x,w,p.z,k,v.x*.2,v.z*.2);else ring(F,p.x,p.z,w,.15,.9,1.1,.4);}
  s.vy=v.y;s.wet=wet;s.seen=true;if(!wet)continue;s.timer-=dt;
  if(swim){/* a wake behind a swimmer, rings round one treading water */if(hs>.35){if(s.timer<=0){s.timer=.15;for(const side of[-1,1]){const bx=p.x-fx*.55+fz*.28*side,bz=p.z-fz*.55-fx*.28*side;foam(F,bx,bz,w,.1,.34+hs*.1,1.1,.22);}ring(F,p.x-fx*.4,p.z-fz*.4,w,.25,.8+hs*.25,1,.24);}}
   else if(s.timer<=0){s.timer=1.15;ring(F,p.x,p.z,w,.35,1.5,1.7,.36);}}
  else{const depth=w-p.y;if(hs>.5){if(s.timer<=0){s.timer=hs>4.5?.24:hs>2.2?.3:.42;s.foot=-s.foot;const sx=fz*.13*s.foot,sz=-fx*.13*s.foot;step(F,p.x+sx+fx*.22,w,p.z+sz+fz*.22,clamp(.16+hs*.075,.16,.7)*clamp(depth/.22,.45,1.3),fx,fz);}}
   else if(s.timer<=0){s.timer=1.45;ring(F,p.x,p.z,w,.22,.85,1.4,.3);}}}}
const defOf=v=>root.CityVehicles?.byId?.[v.typeId]||v.definition||null;
function vehicles(F,scene,sim,dt,cam){const mine=sim.player?.vehicleId;
 for(const v of sim.vehicles||[]){if(!v||!Number.isFinite(v.x)||Math.hypot(v.x-cam.x,v.z-cam.z)>NEAR+30)continue;const d=defOf(v),cat=d?.category||v.category||'land',s=track(F,'v:'+v.id,v),vel=move(s,v,dt),hs=Math.hypot(vel.x,vel.z);
  const w=surface(scene,v.x,v.z);if(w===null){s.deep=false;s.air=false;s.seen=true;continue;}const heavy=clamp(Math.sqrt((d?.mass||1300)/1400),.5,1.8);
  if(cat==='boat'||cat==='plane'||cat==='heli'){/* a boat landing after a jump, or a plane or a helicopter coming down in the water */const air=v.y>w+(cat==='boat'?.4:.9);if(s.seen&&s.air&&!air&&!vel.jump){const fall=Math.max(0,-vel.y,-(s.vy||0));if(fall>1.5)splash(F,v.x,w,v.z,clamp(fall*.22*heavy+hs*.03,.5,3),vel.x*.15,vel.z*.15);}s.air=air;s.vy=vel.y;s.seen=true;continue;}
  const bed=bedAt(scene,v.x,v.z),under=w-bed>.8&&v.y<w-.1;
  /* a car or a bike plunging into deep water: a big splash for its speed and weight, and a little camera shake */
  if(under&&!s.deep&&s.seen&&!vel.jump){const sp=Math.hypot(vel.x,vel.y,vel.z),k=clamp(sp*.11*heavy,.6,3.2);splash(F,v.x,w,v.z,k,vel.x*.12,vel.z*.12);if(v.id===mine||Math.hypot(v.x-cam.x,v.z-cam.z)<12)scene.waterShake=Math.max(scene.waterShake||0,clamp(k/2.6,.35,1));}
  s.deep=under;s.vy=vel.y;s.seen=true;if(under||hs<1.1)continue;
  /* the wheels in shallow water: spray growing with speed, rings washing round the tyres */
  const yaw=Number.isFinite(v.yaw)?v.yaw:Math.atan2(vel.x,vel.z),fx=Math.sin(yaw),fz=Math.cos(yaw),dim=d?.dimensions||{width:1.8,length:4.3},bike=d?.kind==='bike',ht=bike?0:dim.width*.42,hb=dim.length*(bike?.36:.33),wheels=bike?[[0,hb],[0,-hb]]:[[-ht,hb],[ht,hb],[-ht,-hb],[ht,-hb]],dir=Math.sign(fx*vel.x+fz*vel.z)||1;
  wheels.forEach(([lx,lz],n)=>{const px=v.x+fz*lx+fx*lz,pz=v.z-fx*lx+fz*lz,ww=surface(scene,px,pz);if(ww===null||ww-bedAt(scene,px,pz)<.03||v.y>ww+.25)return;
   s.acc[n]+=dt*clamp(hs*3.4,0,56);const c=Math.floor(s.acc[n]);if(c>0){s.acc[n]-=c;spray(F,px,ww,pz,fx*dir,fz*dir,hs,c);}
   s.rings[n]-=dt;if(s.rings[n]<=0){s.rings[n]=clamp(.5-hs*.012,.22,.5);ring(F,px,pz,ww,.2,.9+hs*.04,1.1,.3);}});}}
function balls(F,scene,sim,dt,cam){const life=root.CityBeach?.lifeOf?.(sim),list=life?.balls||[];list.forEach((b,i)=>{if(!b||!Number.isFinite(b.x)||!Number.isFinite(b.y)||Math.hypot(b.x-cam.x,b.z-cam.z)>NEAR)return;const s=track(F,'b:'+(b.id??i),b),v=move(s,b,dt),w=surface(scene,b.x,b.z);if(w===null){s.wet=false;s.seen=true;return;}const wet=b.y-(b.r||.12)<w;if(wet&&!s.wet&&s.seen&&!v.jump&&(-v.y>1||Math.hypot(v.x,v.z)>2))splash(F,b.x,w,b.z,clamp(-v.y*.08+Math.hypot(v.x,v.z)*.04,.12,.45));s.wet=wet;s.seen=true;});}
// ---- moving and drawing the effects -----------------------------------------------------------------------------------
function draw(scene,sim,dt){if(!scene?.T||!scene.environment||!sim?.world&&!scene.world)return;if(scene.waterFx&&scene.waterFx.dropMesh.parent!==scene.environment)scene.waterFx=null;const F=scene.waterFx||(scene.waterFx=build(scene));if(!F)return;
 dt=clamp(Number(dt)||0,0,.1);F.frame++;if(scene.waterShake)scene.waterShake=scene.waterShake>.01?scene.waterShake*Math.exp(-dt*3.2):0;
 const cam=scene.camera?.position||sim.player||{x:0,z:0};if(dt>0){try{people(F,scene,sim,dt,cam);vehicles(F,scene,sim,dt,cam);balls(F,scene,sim,dt,cam);}catch(e){F.error=String(e&&e.stack||e).slice(0,300);}}
 if(F.frame%120===0)for(const[k,s]of F.track)if(F.frame-s.frame>240)F.track.delete(k);
 const D=F.dummy,C=F.color,g=9.8;
 /* droplets fly, fall, and are gone when they drop back into the water */
 let n=0;F.drops=F.drops.filter(p=>{p.life-=dt;p.vy-=g*dt;p.vx*=Math.exp(-dt*.6);p.vz*=Math.exp(-dt*.6);p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;return p.life>0&&!(p.vy<0&&p.y<p.floor);});
 for(const p of F.drops){const s=p.s*Math.min(1,p.life/.12);D.position.set(p.x,p.y,p.z);D.rotation.set(0,0,0);D.scale.set(s,s*1.25,s);D.updateMatrix();F.dropMesh.setMatrixAt(n,D.matrix);C.setRGB(.86,.95,.98);F.dropMesh.setColorAt(n,C);n++;}
 F.dropMesh.count=n;if(n){F.dropMesh.instanceMatrix.needsUpdate=true;F.dropMesh.instanceColor.needsUpdate=true;}
 /* rings and foam spread out on the water and fade; each rides the waves under it */
 const flat=(list,mesh,lift)=>{let m=0;const keep=[];for(const q of list){if(q.delay>0){q.delay-=dt;keep.push(q);continue;}q.life-=dt;if(q.life<=0)continue;keep.push(q);const age=1-q.life/q.max,r=q.r0+(q.r1-q.r0)*(1-Math.pow(1-age,2.2)),fade=q.b*Math.min(1,age*8)*Math.pow(q.life/q.max,1.15),y=surface(scene,q.x,q.z);
   D.position.set(q.x,(Number.isFinite(y)?y:q.y)+lift,q.z);D.rotation.set(0,0,0);D.scale.set(r,1,r);D.updateMatrix();mesh.setMatrixAt(m,D.matrix);C.setRGB(fade*.82,fade*.92,fade*.95);mesh.setColorAt(m,C);m++;}
  mesh.count=m;if(m){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}return keep;};
 F.rings=flat(F.rings,F.ringMesh,RING_Y);F.foam=flat(F.foam,F.foamMesh,FOAM_Y);}
function stats(scene){const F=scene?.waterFx;return F?{drops:F.drops.length,rings:F.rings.length,foam:F.foam.length,tracked:F.track.size,error:F.error||null}:null;}
root.CityWaterFx={draw,surface,splash:(scene,x,y,z,k)=>{const F=scene?.waterFx;if(F)splash(F,x,y,z,k);},stats};
})(typeof globalThis!=='undefined'?globalThis:this);
/* PLATDO City sleep (V14.7). Going to bed is a short scene instead of a jump to 7 am:
 * - alone: you walk to the side of the bed and lie down on it (the beach's lying pose), the camera goes outside the
 *   building while the sky runs through the night to 7 in the morning (about six seconds), then you get up beside the bed
 *   with full health: "Good morning";
 * - online: the room host keeps the sleepers. In bed you lie down and are counted; once more than half the room is asleep
 *   the night runs fast for everyone, and the sleepers get up in the morning. Everyone sees how many are asleep; press E,
 *   Space or F to get up again before then. Players who stay awake keep playing while the sky speeds up.
 * Every bed calls request(sim, {bed, place}): bed is where to lie (x, y on the mattress, z, yaw from the head to the feet),
 * place says which building it is in (for the view from outside): 'home', 'mansion', 'apartment', 'house' or 'shelter'. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=k=>k*k*(3-2*k),WAKE=7/24,WALK=.8,LIE=1.7,NIGHT=6.2,UP=1.5;
let S=null,hud=null,online=null,sentWake=0;
// ---- the beds of each kind of home: where to lie ---------------------------------------------------------------------
const lift=(b,k=.12)=>({x:b.x+Math.sin(b.yaw)*k,y:b.y,z:b.z+Math.cos(b.yaw)*k,yaw:b.yaw});
/* an apartment: the bed stands at the same place in every design, its head at the inner wall (city-apt-rooms.js) */
function apartmentBed(sim){const A=root.CityApartments,p=sim?.player,u=A&&p?A.unitAt(p.x,p.y,p.z):null;if(!u?.id)return null;const c=A.homeToWorld(u.id,11.64,.58,9.7);return c?{x:c.x,y:c.y,z:c.z,yaw:A.homeYaw(u.id,1),half:1.05,unit:u.id}:null;}
/* a house in town: the nearest of its three beds (city-houses.js layout), all with their feet towards the front */
function houseBed(sim){const H=root.CityHouses,p=sim?.player,at=H&&p?H.houseAt(sim.world,p.x,p.y,p.z):null;if(!at)return null;const beds=[[-1.2,1.57],[4.0,1.52],[3.8,-3.83]];let best=null,d=1e9;for(const[x,z]of beds){const e=Math.hypot(at.local.x-x,at.local.z-z);if(e<d){d=e;best=[x,z];}}const c=H.toWorld(at.house,best[0],H.UP+.58,best[1]);return{x:c.x,y:c.y,z:c.z,yaw:H.yawOf(at.house),half:.92,house:at.house};}
/* the shelter: its own list of beds, each with the way its feet point */
function shelterBed(sim){const sh=sim?.world?.shelter,p=sim?.player;if(!sh?.beds?.length||!p)return null;let best=null,d=1e9;for(const b of sh.beds){const e=Math.hypot(p.x-b.x,p.z-b.z);if(e<d){d=e;best=b;}}return best?{...lift({x:best.x,y:best.y,z:best.z,yaw:best.yaw||0}),half:.5}:null;}
// ---- the view from outside -------------------------------------------------------------------------------------------
function look(from,at,fov=52){return{position:{x:from.x,y:from.y,z:from.z},target:{x:at.x,y:at.y,z:at.z},fov};}
function outside(sim,place,bed){const w=sim.world;
 if(place==='mansion'&&w.mansion){const M=w.mansion,a=M.approach||{x:M.x,z:M.z-40},dx=a.x-M.x,dz=a.z-M.z,L=Math.hypot(dx,dz)||1,ux=dx/L,uz=dz/L;return look({x:M.x+ux*44+uz*16,y:M.y+17,z:M.z+uz*44-ux*16},{x:M.x,y:M.y+4,z:M.z});}
 /* V15.3: a hill mansion: from out over the view side, looking back up at the house */if(place==='villa'&&bed&&root.CityVillas){const V=root.CityVillas,at=V.villaAt(w,bed.x,bed.y,bed.z);if(at){const v=at.villa,c=V.toWorld(v,0,3,0),e=V.toWorld(v,0,3,-40);return look({x:e.x+(e.z-c.z)*.25,y:c.y+9,z:e.z-(e.x-c.x)*.25},c);}}
 if(place==='apartment'&&bed?.unit&&root.CityApartments){const A=root.CityApartments,c=A.homeToWorld(bed.unit,7,1.6,6),g=A.homeYaw(bed.unit,0),fx=Math.sin(g),fz=Math.cos(g);if(c)return look({x:c.x+fx*38-fz*12,y:c.y+5,z:c.z+fz*38+fx*12},{x:c.x,y:c.y+1,z:c.z});}
 if(place==='house'&&bed?.house&&root.CityHouses){const H=root.CityHouses,h=bed.house,c=H.toWorld(h,0,3,0),d=H.frontDoor?.(h)||H.toWorld(h,0,0,-6),dx=d.x-c.x,dz=d.z-c.z,L=Math.hypot(dx,dz)||1;return look({x:c.x+dx/L*19-dz/L*8,y:c.y+6,z:c.z+dz/L*19+dx/L*8},c);}
 if(place==='home'&&w.home?.toWorld){const h=w.home;return look(h.toWorld(-6,7.5,-17),h.toWorld(7,3,7));}
 if(place==='shelter'&&w.shelter){const sh=w.shelter,a=sh.approach||sh.entrance||sh.door||sh.start;if(a&&bed){const dx=a.x-bed.x,dz=a.z-bed.z,L=Math.hypot(dx,dz)||1;return look({x:bed.x+dx/L*(L+16)-dz/L*8,y:bed.y+7,z:bed.z+dz/L*(L+16)+dx/L*8},{x:bed.x,y:bed.y+1,z:bed.z});}}
 if(bed){const a=bed.yaw+Math.PI/2;return look({x:bed.x+Math.sin(a)*26,y:bed.y+10,z:bed.z+Math.cos(a)*26},{x:bed.x,y:bed.y+3,z:bed.z});}
 return null;}
/* in bed: from just past the foot of the bed, looking up it to the pillow */
function inBed(bed){const fx=Math.sin(bed.yaw),fz=Math.cos(bed.yaw);return look({x:bed.x+fx*1.95,y:bed.y+1.45,z:bed.z+fz*1.95},{x:bed.x-fx*.45,y:bed.y+.25,z:bed.z-fz*.45},55);}
/* where to stand beside the bed: the side nearer to where you are */
function besideBed(sim,bed){const p=sim.player,rx=Math.cos(bed.yaw),rz=-Math.sin(bed.yaw),side=((p.x-bed.x)*rx+(p.z-bed.z)*rz)>=0?1:-1;const off=(Number(bed.half)||.9)+.42;return{x:bed.x+rx*side*off,y:Number.isFinite(p.y)?p.y:bed.y-.6,z:bed.z+rz*side*off,yaw:Math.atan2(rx*side,rz*side)};}
// ---- asking to sleep -------------------------------------------------------------------------------------------------
/* true when the bed has been taken care of: alone the scene starts; online the room host is asked */
function request(sim,info){const bed=info?.bed;if(!sim||!bed||![bed.x,bed.y,bed.z].every(Number.isFinite))return false;
 if(sim.onlineRoom){if(!root.PlatdoFriends?.action)return false;root.PlatdoFriends.action('cityTool',{tool:'sleep',kind:'bed',bed:{x:bed.x,y:bed.y,z:bed.z,yaw:bed.yaw||0},place:info.place||''}).then(r=>{if(r?.message)sim.emit?.('notice',{message:r.message});},e=>sim.emit?.('notice',{message:e?.message||'You cannot sleep here.'}));return true;}
 if(S||typeof document==='undefined')return false;const p=sim.player;
 S={sim,bed:{...bed,yaw:Number.isFinite(bed.yaw)?bed.yaw:0},place:info.place||'',phase:'walk',t:0,from:{x:p.x,y:p.y,z:p.z,yaw:p.yaw},clock:((sim.profile.world.time%1)+1)%1};S.side=besideBed(sim,S.bed);S.view=outside(sim,S.place,{...S.bed,unit:bed.unit,house:bed.house});
 Object.assign(p,{vx:0,vy:0,vz:0,speed:0,aiming:false,crouched:false,transition:null,physical:null});return true;}
/* the homes.js / mansion.js beds: start the scene and tell the caller (alone only; online the host sets sim.onSleep) */
function start(sim,info){return request(sim,info)?{deferred:true,message:''}:null;}
// ---- the scene alone -------------------------------------------------------------------------------------------------
function frame(sim,dt,ctx={}){if(!S)return false;if(S.sim!==sim||sim.onlineRoom){finish(false);return false;}const p=sim.player,b=S.bed;dt=clamp(Number(dt)||0,0,.1);S.t+=dt;
 if(S.phase==='walk'){/* to the side of the bed */const k=ease(Math.min(1,S.t/WALK)),a=S.from,s=S.side;Object.assign(p,{x:a.x+(s.x-a.x)*k,y:a.y+(s.y-a.y)*k,z:a.z+(s.z-a.z)*k,yaw:Math.atan2(b.x-p.x,b.z-p.z)||p.yaw,speed:k<1?1.3:0,animation:{mode:'walk',speed:1.3}});sim.menuCamera=null;if(S.t>=WALK){S.phase='lie';S.t=0;}}
 else if(S.phase==='lie'){/* onto the bed and lying down */const k=ease(Math.min(1,S.t/.45)),s=S.side;Object.assign(p,{x:s.x+(b.x-s.x)*k,y:s.y+(b.y-s.y)*k,z:s.z+(b.z-s.z)*k,yaw:b.yaw,speed:0,animation:{mode:'sunbathe',speed:0}});sim.menuCamera=inBed(b);if(S.t>=LIE){S.phase=S.view?'night':'wake';S.t=0;}}
 else if(S.phase==='night'){/* outside, the sky runs fast to 7 in the morning */const span=((WAKE-S.clock)%1+1)%1||1,k=ease(Math.min(1,S.t/NIGHT));sim.profile.world.time=(S.clock+span*k)%1;sim.menuCamera=S.view;if(S.t>=NIGHT){sim.profile.world.time=WAKE;S.phase='wake';S.t=0;wake(sim,ctx);}}
 else if(S.phase==='wake'){/* up beside the bed */const s=S.side;Object.assign(p,{x:s.x,y:s.y,z:s.z,yaw:s.yaw,speed:0,animation:null});sim.menuCamera=null;if(S.t>=UP){finish(true);return false;}}
 sim.dirty=true;return true;}
function wake(sim,ctx){const p=sim.player;sim.profile.world.time=WAKE;p.health=Math.max(p.health||0,100);sim.dirty=true;(ctx.toast||(m=>sim.emit?.('notice',{message:m})))(S?.place==='shelter'?'Good morning. Breakfast is in the common room.':'Good morning.');try{ctx.saveNow?.();}catch(e){}}
function finish(done){if(!S)return;const sim=S.sim,p=sim.player;if(!done&&S.phase!=='wake'){Object.assign(p,{x:S.side.x,y:S.side.y,z:S.side.z});}p.animation=null;sim.menuCamera=null;S=null;}
function active(sim){return!!S&&(!sim||S.sim===sim);}
// ---- online ----------------------------------------------------------------------------------------------------------
function hudEl(){if(hud||typeof document==='undefined')return hud;hud=document.createElement('div');hud.id='citySleepHud';/* inside the City's own layer, beside its notices */hud.style.cssText='position:absolute;left:50%;top:86px;transform:translateX(-50%);z-index:30;pointer-events:none;padding:8px 14px;border-radius:6px;background:rgba(16,36,44,.88);border-left:3px solid #e8c25a;color:#f1efe8;font:600 14px/20px Inter,"Segoe UI",Arial,sans-serif;text-align:center;max-width:calc(100vw - 32px);box-shadow:0 4px 16px #0005';hud.hidden=true;(document.getElementById('cityRoot')||document.body).appendChild(hud);return hud;}
/* each frame online: the count for everyone, and for a sleeper the view and the way to get up */
function frameOnline(sim,dt,ctx={}){const s=sim?.onlineRoom?sim.onlineSleep:null,el=hudEl();
 if(!s||!(s.asleep>0||s.lapse)){if(el)el.hidden=true;if(online){online=null;sim.menuCamera=null;}return false;}
 if(el){const left=Math.max(0,s.need-s.asleep);el.textContent='\u{1F634} '+s.asleep+' of '+s.players+' asleep \u{B7} '+(s.lapse?'morning is coming':left===1?'1 more needed for morning':left+' more needed for morning')+(s.me&&!s.lapse?' \u{B7} E or Space to get up':'');el.hidden=false;}
 if(s.me){const p=sim.player,bed={x:p.x,y:p.y,z:p.z,yaw:p.yaw||0};if(!online)online={bed,place:s.place||'',view:null};online.bed=bed;if(s.lapse){online.view=online.view||outside(sim,online.place,bed);sim.menuCamera=online.view||inBed(bed);}else sim.menuCamera=inBed(bed);return true;}
 if(online){online=null;sim.menuCamera=null;}return false;}
/* online, in bed: E, Space or F gets you up (the host stands you beside the bed) */
function onlineInput(sim,input){if(!sim?.onlineRoom||!sim.onlineSleep?.me||!input)return false;if(input.vehiclePressed||input.jumpPressed||input.interactPressed){const now=Date.now();if(now-sentWake>800){sentWake=now;root.PlatdoFriends?.action?.('cityTool',{tool:'sleep',kind:'wake'}).catch(()=>{});}}input.vehiclePressed=input.jumpPressed=input.interactPressed=false;input.moveX=input.moveZ=0;return true;}
root.CitySleep={request,start,frame,active,frameOnline,onlineInput,outside,inBed,apartmentBed,houseBed,shelterBed,get scene(){return S?{phase:S.phase,t:S.t,place:S.place,bed:S.bed}:null;}};
})(typeof globalThis!=='undefined'?globalThis:this);
