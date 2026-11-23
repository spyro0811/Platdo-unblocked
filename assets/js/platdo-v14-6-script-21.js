
/* PLATDO V2 — shared HDR finishing pass for the 3D games.
 * The scene is drawn into a floating-point target, bright areas are spread into a soft
 * bloom over a small mip chain, and one output pass applies ACES tone mapping, the
 * display transfer, then a light colour grade and vignette. Nothing here knows about
 * gameplay; a game hands in its renderer and asks for begin()/finish(). */
(function(root){'use strict';
const T=root.THREE;if(!T||root.PlatdoPost)return;
const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const prefilter=`uniform sampler2D map;uniform vec2 texel;uniform float threshold;uniform float knee;varying vec2 vUv;
vec3 fetch(vec2 o){return min(texture2D(map,vUv+o*texel).rgb,vec3(48.));}
void main(){vec3 c=(fetch(vec2(-1.,-1.))+fetch(vec2(1.,-1.))+fetch(vec2(-1.,1.))+fetch(vec2(1.,1.)))*.25;
 float b=max(c.r,max(c.g,c.b)),soft=clamp(b-threshold+knee,0.,2.*knee);soft=soft*soft/(4.*knee+1e-4);
 gl_FragColor=vec4(c*max(soft,b-threshold)/max(b,1e-4),1.);}`;
const downsample=`uniform sampler2D map;uniform vec2 texel;varying vec2 vUv;
void main(){vec3 a=texture2D(map,vUv+vec2(-1.,-1.)*texel).rgb,b=texture2D(map,vUv+vec2(1.,-1.)*texel).rgb,c=texture2D(map,vUv+vec2(-1.,1.)*texel).rgb,d=texture2D(map,vUv+vec2(1.,1.)*texel).rgb,e=texture2D(map,vUv).rgb;
 gl_FragColor=vec4((a+b+c+d)*.2+e*.2,1.);}`;
const upsample=`uniform sampler2D map;uniform sampler2D base;uniform vec2 texel;uniform float radius;varying vec2 vUv;
void main(){vec2 r=texel*radius;vec3 s=texture2D(map,vUv+vec2(-r.x,-r.y)).rgb+texture2D(map,vUv+vec2(r.x,-r.y)).rgb+texture2D(map,vUv+vec2(-r.x,r.y)).rgb+texture2D(map,vUv+vec2(r.x,r.y)).rgb+2.*(texture2D(map,vUv+vec2(-r.x,0.)).rgb+texture2D(map,vUv+vec2(r.x,0.)).rgb+texture2D(map,vUv+vec2(0.,-r.y)).rgb+texture2D(map,vUv+vec2(0.,r.y)).rgb)+4.*texture2D(map,vUv).rgb;
 gl_FragColor=vec4(texture2D(base,vUv).rgb+s/16.,1.);}`;
const output=`uniform sampler2D colorMap;uniform sampler2D bloomMap;uniform float bloom;uniform float saturation;uniform float contrast;uniform float vignette;uniform vec3 tint;uniform vec3 lift;varying vec2 vUv;
void main(){vec3 color=texture2D(colorMap,vUv).rgb;
 #ifdef USE_BLOOM
 color+=texture2D(bloomMap,vUv).rgb*bloom;
 #endif
 color*=tint;gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 vec3 graded=gl_FragColor.rgb;float luma=dot(graded,vec3(.2126,.7152,.0722));
 graded=mix(vec3(luma),graded,saturation);graded=(graded-.5)*contrast+.5+lift;
 vec2 q=vUv-.5;graded*=1.-vignette*smoothstep(.25,.95,dot(q,q)*2.2);
 gl_FragColor=vec4(clamp(graded,0.,1.),1.);}`;
class Pipeline{
 constructor(renderer){
  this.renderer=renderer;this.size=new T.Vector2();this.options={samples:4,bloom:.3,bloomLevels:5,threshold:1.02,knee:.5,saturation:1.08,contrast:1.05,vignette:.16,tint:new T.Color(1,1,1),lift:new T.Color(0,0,0)};
  this.supported=!!renderer.capabilities.isWebGL2&&!!renderer.extensions.has('EXT_color_buffer_float');
  this.camera=new T.Camera();this.scene=new T.Scene();this.quad=new T.Mesh(new T.PlaneGeometry(2,2));this.quad.frustumCulled=false;this.scene.add(this.quad);
  const pass=(fragmentShader,uniforms)=>new T.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader,depthTest:false,depthWrite:false,toneMapped:false});
  this.materials={prefilter:pass(prefilter,{map:{value:null},texel:{value:new T.Vector2()},threshold:{value:1},knee:{value:.5}}),down:pass(downsample,{map:{value:null},texel:{value:new T.Vector2()}}),up:pass(upsample,{map:{value:null},base:{value:null},texel:{value:new T.Vector2()},radius:{value:1}})};
  this.output=new T.ShaderMaterial({name:'PLATDO HDR output',defines:{USE_BLOOM:1},uniforms:{colorMap:{value:null},bloomMap:{value:null},bloom:{value:.3},saturation:{value:1},contrast:{value:1},vignette:{value:0},tint:{value:this.options.tint},lift:{value:this.options.lift}},vertexShader:vertex,fragmentShader:output,depthTest:false,depthWrite:false,toneMapped:true});
  this.target=null;this.down=[];this.up=[];
 }
 configure(options={}){Object.assign(this.options,options);return this;}
 samples(){if(!this.options.samples)return 0;/* V11.0: the graphics card is asked once, not every frame (the question is slow to answer) */if(this.samplesFor===this.options.samples)return this.samplesFound;const gl=this.renderer.getContext();let available=[];try{available=Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,gl.RGBA16F,gl.SAMPLES)||[]).filter(n=>n>0);}catch(_){}let found=0;if(available.length){const within=available.filter(n=>n<=this.options.samples);found=within.length?Math.max(...within):Math.min(...available);}this.samplesFor=this.options.samples;this.samplesFound=found;return found;}
 ensure(){
  const r=this.renderer;r.getDrawingBufferSize(this.size);const w=Math.max(2,Math.floor(this.size.x)),h=Math.max(2,Math.floor(this.size.y)),samples=this.samples();
  if(this.target&&this.target.samples!==samples){this.target.dispose();this.target=null;}
  if(!this.target){this.target=new T.WebGLRenderTarget(w,h,{type:T.HalfFloatType,colorSpace:T.LinearSRGBColorSpace,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true,samples});this.target.texture.name='PLATDO linear HDR scene';}
  if(this.target.width!==w||this.target.height!==h)this.target.setSize(w,h);
  const levels=this.options.bloom>0?Math.max(2,Math.min(7,this.options.bloomLevels)):0;
  if(this.down.length!==levels||this.bloomWidth!==w||this.bloomHeight!==h){
   for(const t of[...this.down,...this.up])t.dispose();this.down=[];this.up=[];this.bloomWidth=w;this.bloomHeight=h;
   for(let i=0;i<levels;i++){const lw=Math.max(2,w>>(i+1)),lh=Math.max(2,h>>(i+1)),make=()=>new T.WebGLRenderTarget(lw,lh,{type:T.HalfFloatType,colorSpace:T.LinearSRGBColorSpace,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:false});this.down.push(make());if(i<levels-1)this.up.push(make());}
  }
 }
 // The target to draw the scene into, or null when floating-point targets are unavailable.
 begin(){if(!this.supported)return null;this.ensure();return this.target;}
 draw(material,target){this.quad.material=material;this.renderer.setRenderTarget(target);this.renderer.render(this.scene,this.camera);}
 finish(){
  const r=this.renderer,o=this.options,info=r.info.render,calls=info.calls,triangles=info.triangles,points=info.points,lines=info.lines,m=this.materials;
  let bloom=null;
  if(this.down.length){
   m.prefilter.uniforms.map.value=this.target.texture;m.prefilter.uniforms.texel.value.set(1/this.target.width,1/this.target.height);m.prefilter.uniforms.threshold.value=o.threshold;m.prefilter.uniforms.knee.value=o.knee;this.draw(m.prefilter,this.down[0]);
   for(let i=1;i<this.down.length;i++){m.down.uniforms.map.value=this.down[i-1].texture;m.down.uniforms.texel.value.set(1/this.down[i-1].width,1/this.down[i-1].height);this.draw(m.down,this.down[i]);}
   let current=this.down[this.down.length-1];
   for(let i=this.up.length-1;i>=0;i--){m.up.uniforms.map.value=current.texture;m.up.uniforms.base.value=this.down[i].texture;m.up.uniforms.texel.value.set(1/current.width,1/current.height);this.draw(m.up,this.up[i]);current=this.up[i];}
   bloom=current.texture;
  }
  const u=this.output.uniforms,wanted=bloom?1:0;if((this.output.defines.USE_BLOOM?1:0)!==wanted){if(wanted)this.output.defines.USE_BLOOM=1;else delete this.output.defines.USE_BLOOM;this.output.needsUpdate=true;}
  u.colorMap.value=this.target.texture;u.bloomMap.value=bloom;u.bloom.value=o.bloom;u.saturation.value=o.saturation;u.contrast.value=o.contrast;u.vignette.value=o.vignette;
  this.draw(this.output,null);
  // Report the scene's own work, not the handful of full-screen passes.
  info.calls=calls;info.triangles=triangles;info.points=points;info.lines=lines;
 }
 dispose(){this.target?.dispose();for(const t of[...this.down,...this.up])t.dispose();this.down=[];this.up=[];this.target=null;for(const m of Object.values(this.materials))m.dispose();this.output.dispose();this.quad.geometry.dispose();}
}
root.PlatdoPost={Pipeline,shaders:{vertex,prefilter,downsample,upsample,output}};
})(typeof globalThis!=='undefined'?globalThis:this);
