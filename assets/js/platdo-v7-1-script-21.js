
/* PLATDO shared sky (rebuilt for V4.5). One shader draws the whole dome for every game that uses it:
 * - the air: deep blue overhead, paler toward the horizon, brighter and whiter around the sun;
 * - dusk and dawn: orange on the sun's side, a dusty pink on the far side, the glow reaching higher near the sun;
 * - the sun with a wide warm halo that reddens as it sets; a moon with a lit face, grey seas and a soft glow;
 * - night: thousands of twinkling stars in two sizes, a faint Milky Way band and the odd shooting star;
 * - clouds (when the quality setting allows): a warped cumulus layer shaded from the sun's side, with bright
 *   edges near the sun, plus thin high cloud on the top setting; a broken grey ceiling when it is overcast.
 * The same material also lights the world: games render it into a small cube map (detail 0: no stars, no moon
 * face, ground bounce below the horizon) that becomes the scene's reflection and ambient environment.
 * horizon() gives the colour the dome has along the horizon, averaged around the compass, for distance fog. */
(function(root){'use strict';
const T=root.THREE;if(!T||root.PlatdoSky)return;
const vertex=`varying vec3 vDirection;void main(){vDirection=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`;
const fragment=`uniform vec3 sunDirection;uniform vec3 moonDirection;uniform float daylight;uniform float cover;uniform float wet;uniform float time;uniform float discStrength;uniform float saturation;uniform float detail;uniform vec3 groundColor;varying vec3 vDirection;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float hash3(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
#if CLOUD_OCTAVES > 0
// Each octave is turned as well as shrunk, which hides the square grid the noise is built on.
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<CLOUD_OCTAVES;i++){v+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p+vec2(17.3,9.1);a*=.5;}return v/(1.-2.*a);}
#endif
// One layer of stars: the sky is cut into small cells and some cells hold a star. A star only shows where the
// dome passes close to it, so sizes vary by themselves.
float starLayer(vec3 d,float scale,float density,out float seed){
 vec3 p=d*scale,i=floor(p),f=fract(p)-.5;seed=hash3(i);
 vec3 o=vec3(hash3(i+17.1),hash3(i+31.7),hash3(i+47.3))-.5;
 float size=.07+.1*fract(seed*71.3),r=length(f-o*.7);
 return step(seed,density)*smoothstep(size,size*.2,r);
}
// A shooting star: every few seconds one may cross a short arc and burn out.
float meteor(vec3 d,float t){
 float slot=floor(t/6.),life=fract(t/6.)/.14;if(life>1.||hash(vec2(slot,1.7))<.5)return 0.;
 float a=hash(vec2(slot,3.1))*6.2832,el=.38+.75*hash(vec2(slot,9.7));
 vec3 start=vec3(cos(a)*cos(el),sin(el),sin(a)*cos(el));
 float b=a+1.2+hash(vec2(slot,5.3))*1.4;vec3 dir=vec3(cos(b),-.5-.5*hash(vec2(slot,7.9)),sin(b));dir=normalize(dir-start*dot(dir,start));
 vec3 head=normalize(start+dir*.34*life),tail=normalize(start+dir*.34*max(life-.3,0.)),seg=head-tail;
 float s=clamp(dot(d-tail,seg)/max(dot(seg,seg),1e-6),0.,1.),dist=length(d-(tail+seg*s));
 return smoothstep(.0026,.0004,dist)*s*s*(1.-life*life);
}
void main(){
 // Every value that is raised to a power is kept inside 0..1 first: one stray negative gives "not a number",
 // and a single such dot in the small reflection map blacks out everything it lights.
 vec3 d=normalize(vDirection);float up=clamp(d.y,0.,1.),h=1.-up,low=pow(h,6.),mid=pow(h,2.2);
 float sunUp=sunDirection.y,mu=dot(d,sunDirection),toSun=clamp(mu,0.,1.),toMoon=clamp(dot(d,moonDirection),0.,1.);
 // How bright the air itself is. It stays lit for a while after the sun has gone under.
 float skyDay=smoothstep(-.2,.14,sunUp),high=smoothstep(-.05,.4,sunUp);
 // Day: three bands from overhead to the horizon, a little darker at right angles to the sun, whiter near it.
 // With the sun low the whole sky is dimmer, which is what lets the dusk colours show instead of washing out.
 vec3 day=mix(mix(vec3(.04,.165,.56),vec3(.17,.42,.86),mid),vec3(.6,.77,.94),low);
 day*=(.9+.1*mu*mu)*mix(.62,1.,high);
 day=mix(day,vec3(.9,.93,.97),(pow(toSun,4.)*.5+pow(toSun,24.)*.6)*.35*(.4+.6*low)*high);
 vec3 night=mix(vec3(.0025,.0045,.012),vec3(.012,.02,.042),pow(h,3.));
 night+=vec3(.012,.018,.035)*pow(toMoon,3.)*(1.-cover);
 vec3 color=mix(night,day,skyDay);
 // Dusk and dawn. "toward" is 1 looking at the sun's side of the compass and 0 looking away from it.
 float dusk=smoothstep(.26,0.,abs(sunUp))*smoothstep(-.2,.04,sunUp);
 float toward=clamp(.5+.5*dot(normalize(sunDirection.xz+vec2(1e-4)),normalize(d.xz+vec2(1e-4))),0.,1.);
 vec3 warm=mix(vec3(.58,.36,.56),vec3(1.,.44,.15),pow(toward,1.4));
 color=mix(color,vec3(.75,.42,.55),dusk*mid*.2*(.35+.65*toward));
 color=mix(color,warm,dusk*pow(h,mix(5.,2.4,toward))*(.42+.38*toward));
 color+=vec3(1.,.6,.22)*dusk*pow(toSun,5.)*.2*h;
 // Stars, the Milky Way and shooting stars: only on the visible dome and only once the air is dark.
 float dark=smoothstep(.55,0.,skyDay)*(1.-cover*.94)*detail;
 if(dark>.004&&d.y>-.02){
  float across=dot(d,vec3(.329,.47,-.819)),band=exp(-across*across*13.),rise=smoothstep(-.02,.2,d.y);
  float s1,s2;float a=starLayer(d,72.,.2+.2*band,s1),b=starLayer(d,150.,.26+.3*band,s2);
  float m1=fract(s1*193.7),m2=fract(s2*157.3);
  vec3 stars=mix(vec3(.72,.83,1.),vec3(1.,.86,.68),fract(s1*311.))*a*(.2+1.5*m1*m1*m1*m1)*(.78+.22*sin(time*(1.5+4.*fract(s1*57.))+s1*90.));
  stars+=vec3(.85,.9,1.)*b*(.07+.3*m2*m2)*(.85+.15*sin(time*(2.+3.*fract(s2*23.))+s2*70.));
  vec2 q=d.xz/(d.y+.7)*3.;float dust=noise(q)*.6+noise(q*2.3+5.)*.3+noise(q*5.1+9.)*.1;
  color+=(stars+vec3(.05,.058,.085)*band*(.25+dust*dust*1.6))*dark*rise;
  color+=vec3(.9,.95,1.)*meteor(d,time)*dark*1.6;
 }
 // Moon: on the visible dome it is a lit ball with darker seas; in the reflection map just a soft disc.
 float moonUp=(1.-smoothstep(-.1,.12,sunUp))*(1.-cover*.9);
 if(moonUp>.004){
  color+=vec3(.6,.72,1.)*(pow(toMoon,220.)*.085+pow(toMoon,28.)*.014)*moonUp;
  vec3 mx=normalize(cross(vec3(0.,1.,0.),moonDirection)),my=cross(moonDirection,mx);
  vec2 q=vec2(dot(d,mx),dot(d,my))/.026;float r=length(q);
  if(r<1.&&toMoon>0.){
   float z=sqrt(1.-r*r),lit=smoothstep(-.08,.3,dot(vec3(q,z),vec3(-.52,.3,.8)));
   float seas=smoothstep(.36,.62,noise(q*2.1+vec2(4.,9.))*.6+noise(q*4.7+vec2(1.,3.))*.4);
   vec3 face=vec3(.86,.9,1.)*mix(.5,1.,seas)*(.7+.3*z)*(lit*1.5+.015);
   color=mix(color,mix(vec3(.75,.84,1.)*1.2,face,detail),smoothstep(1.,.92,r)*moonUp);
  }
 }
 // Overcast: a grey ceiling, a little uneven where the cloud shader runs. It matches the fog at the horizon.
 float ceiling=clamp(cover*.82+wet*.1,0.,1.);vec3 grey=vec3(.42,.5,.58)*(.06+.94*skyDay);
 #if CLOUD_OCTAVES > 0
 vec2 uv=d.xz/(up+.14)*1.15+vec2(time*.0045,time*.0018);
 if(ceiling>.01)grey*=mix(1.,.8+.36*fbm(uv*.45+vec2(40.,13.)),smoothstep(.03,.3,d.y));
 #endif
 color=mix(color,grey,ceiling);
 // Sun: a warm halo and the disc. Both redden toward the horizon and are hidden by thick cloud.
 float visible=smoothstep(-.09,.03,sunUp)*(1.-cover*.86);
 vec3 sunTint=mix(vec3(1.,.36,.1),vec3(1.,.93,.82),smoothstep(-.02,.3,sunUp));
 color+=mix(sunTint,vec3(1.,.8,.55),.5)*(pow(toSun,9.)*.16+pow(toSun,90.)*.5)*visible;
 color+=sunTint*smoothstep(.99935,.99975,toSun)*discStrength*visible;
 #if CLOUD_OCTAVES > 0
 if(d.y>.012){
  // Cumulus. The second sample is taken a step toward the sun: more cloud there means this spot is in shade.
  vec2 w=vec2(noise(uv*.9+vec2(3.1,7.7)),noise(uv*.9+vec2(19.4,2.3)))-.5,p=uv*1.3+w*.55;
  float n=fbm(p),lo=mix(.57,.18,cover),hi=mix(.71,.5,cover),amount=smoothstep(lo,hi,n)*smoothstep(.012,.17,d.y);
  float n2=fbm(p+normalize(sunDirection.xz+vec2(1e-4))*.11),shade=clamp(.5+(n-n2)*5.,0.,1.),depth=smoothstep(lo,hi+.22,n);
  float rain=clamp(cover*.72+wet*.5,0.,1.),sunOn=smoothstep(-.2,.1,sunUp),glow=dusk*(1.-cover*.8);
  vec3 lit=mix(mix(vec3(1.,.985,.96),vec3(.6,.64,.7),rain),vec3(1.,.56,.34),glow);
  vec3 dim=mix(mix(vec3(.5,.58,.73),vec3(.27,.3,.36),rain),vec3(.42,.3,.44),glow);
  vec3 cloud=mix(dim,lit,.25+.75*shade*(1.-.4*depth))*(.03+.97*sunOn);
  cloud+=mix(vec3(.006,.009,.016),vec3(.03,.04,.065),shade*.6+.4*pow(toMoon,4.))*(1.-sunOn);
  cloud+=sunTint*pow(toSun,10.)*amount*(1.-amount)*2.4*visible;
  color=mix(color,cloud,amount*(.9+cover*.1));
 }
 #endif
 #if CLOUD_OCTAVES > 3
 // Thin high cloud, drawn out in streaks. It catches the dusk colours first and fades out when it is overcast.
 // (Kept small, soft and well above the horizon: a long streak seen end-on near the horizon reads as a curtain.)
 {vec2 cu=d.xz/(up+.3)*1.3+vec2(time*.0016,-time*.0007);float ci=fbm(vec2(cu.x*.5+cu.y*.3,cu.y*1.5)+vec2(noise(cu*1.3),noise(cu*1.3+11.))*.9);
  float wisps=smoothstep(.5,.9,ci)*smoothstep(.1,.45,d.y)*(1.-cover)*.26;
  color=mix(color,mix(vec3(.02,.03,.05),mix(vec3(1.),vec3(1.,.6,.45),dusk),smoothstep(-.16,.2,sunUp)),wisps);}
 #endif
 // Below the horizon: the visible dome carries the horizon haze on down, so the edge of the sea meets it without
 // a line; the reflection map shows the ground's bounce light instead, so reflections are not hollow.
 color=mix(color,groundColor*(.06+.94*daylight)*(1.-cover*.35),smoothstep(.0,-.12,d.y)*(1.-detail));
 color*=1.-.3*detail*smoothstep(-.04,-.6,d.y);
 color=mix(vec3(dot(color,vec3(.2126,.7152,.0722))),color,saturation);
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
function createMaterial(octaves=3){
 return new T.ShaderMaterial({name:'PLATDO sky',defines:{CLOUD_OCTAVES:octaves},uniforms:{sunDirection:{value:new T.Vector3(.3,.8,.5).normalize()},moonDirection:{value:new T.Vector3(-.3,.6,-.5).normalize()},daylight:{value:1},cover:{value:0},wet:{value:0},time:{value:0},discStrength:{value:16},saturation:{value:1},detail:{value:1},groundColor:{value:new T.Color(.2,.21,.2)}},vertexShader:vertex,fragmentShader:fragment,side:T.BackSide,depthWrite:false,depthFunc:T.LessEqualDepth,fog:false,toneMapped:true});
}
function createDome(material){const mesh=new T.Mesh(new T.SphereGeometry(1,24,16),material);mesh.name='PLATDO sky dome';mesh.frustumCulled=false;mesh.renderOrder=900;mesh.matrixAutoUpdate=true;return mesh;}
// hour is 0..24. Returns unit vectors for the sun and moon and how much daylight there is.
function ephemeris(hour,out={sun:new T.Vector3(),moon:new T.Vector3(),daylight:1}){
 const a=(hour-6)/24*Math.PI*2,elevation=Math.sin(a)*.86,horizontal=Math.sqrt(Math.max(0,1-elevation*elevation));
 out.sun.set(Math.cos(a)*horizontal*.82,elevation,-Math.abs(horizontal)*.57-.08).normalize();
 out.moon.set(-out.sun.x,Math.max(.25,-out.sun.y*.8+.2),-out.sun.z*.6+.3).normalize();
 out.daylight=Math.max(0,Math.min(1,(out.sun.y+.1)/.34));out.daylight=out.daylight*out.daylight*(3-2*out.daylight);
 return out;
}
// The dome's colour along the horizon, averaged around the compass: what distance fog should fade to.
// Keep these numbers in step with the shader above.
const step=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);},lerp=(a,b,t)=>a+(b-a)*t;
// How dark the sky is for stars and planets: 0 by day, 1 at night.
const darkness=e=>step(.55,0,step(-.2,.14,e.sun.y));
function horizon(e,cover=0,wet=0,out=new T.Color()){
 const y=e.sun.y,skyDay=step(-.2,.14,y),low=lerp(.62,1,step(-.05,.4,y)),dusk=step(.26,0,Math.abs(y))*step(-.2,.04,y),warm=dusk*.61,ceiling=Math.max(0,Math.min(1,cover*.82+wet*.1)),grey=.06+.94*skyDay;
 let r=lerp(.012,.585*low,skyDay),g=lerp(.02,.75*low,skyDay),b=lerp(.042,.915*low,skyDay);
 r=lerp(r,.74,warm);g=lerp(g,.39,warm);b=lerp(b,.4,warm);
 return out.setRGB(lerp(r,.42*grey,ceiling),lerp(g,.5*grey,ceiling),lerp(b,.58*grey,ceiling));
}
// Renders the sky material into a cube map and filters it for image-based lighting.
class Environment{
 constructor(renderer,size=96){this.renderer=renderer;this.size=size;this.material=createMaterial(0);this.scene=new T.Scene();this.dome=new T.Mesh(new T.SphereGeometry(4,24,16),this.material);this.scene.add(this.dome);
  const float=renderer.capabilities.isWebGL2&&renderer.extensions.has('EXT_color_buffer_float');this.cube=new T.WebGLCubeRenderTarget(size,{type:float?T.HalfFloatType:T.UnsignedByteType,colorSpace:T.LinearSRGBColorSpace,generateMipmaps:false});this.camera=new T.CubeCamera(.1,20,this.cube);this.pmrem=new T.PMREMGenerator(renderer);this.filtered=null;}
 update(source){for(const key of['sunDirection','moonDirection','groundColor'])this.material.uniforms[key].value.copy(source.uniforms[key].value);for(const key of['daylight','cover','wet','time'])this.material.uniforms[key].value=source.uniforms[key].value;
  // A full-strength sun in a small cube map turns into sparkling noise once filtered, and so would stars.
  // Ambient light taken straight from a deep blue zenith tints the whole world blue.
  this.material.uniforms.discStrength.value=3;this.material.uniforms.saturation.value=.42;this.material.uniforms.detail.value=0;const target=this.renderer.getRenderTarget(),xr=this.renderer.xr.enabled;this.renderer.xr.enabled=false;
  try{this.camera.update(this.renderer,this.scene);this.filtered=this.pmrem.fromCubemap(this.cube.texture,this.filtered);}finally{this.renderer.xr.enabled=xr;this.renderer.setRenderTarget(target);}
  return this.filtered.texture;}
 dispose(){this.filtered?.dispose();this.cube.dispose();this.pmrem.dispose();this.material.dispose();this.dome.geometry.dispose();}
}
root.PlatdoSky={createMaterial,createDome,ephemeris,horizon,darkness,Environment,shaders:{vertex,fragment}};
})(typeof globalThis!=='undefined'?globalThis:this);
