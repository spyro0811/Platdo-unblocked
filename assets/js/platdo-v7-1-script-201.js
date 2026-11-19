
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
