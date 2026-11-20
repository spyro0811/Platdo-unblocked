
/* PLATDO V2 — City look. Presentation only.
 *   - A real sky: gradient, sun and moon, dusk colour and drifting cloud.
 *   - The sun now crosses the sky with the clock, and shadows follow it.
 *   - Reflections and ambient light come from that sky instead of a painted strip.
 *   - Optional HDR finish: bloom, tone mapping, a light grade and smoothed edges.
 * Every part is switched by the graphics settings so slower devices do less work. */
(function(root){'use strict';
const T=root.THREE,S=root.CityScene?.prototype,Sky=root.PlatdoSky,Post=root.PlatdoPost;if(!T||!S||!Sky||!Post)return;
const C=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
function settings(scene){
 const v=scene.menuGraphics||scene.graphicsValues||{},detail=v.detail||'medium';
 const reflections=v.reflections||'low',post=v.post||(v.preset==='potato'||v.preset==='low'?'off':'bloom');
 // Low and Medium shadows redraw the shadow map on alternate frames: half the shadow work.
 return{reflections,post,ambientOnly:scene.graphics?.lighting==='ambient',shadowEvery:v.shadows==='low'||v.shadows==='medium'?2:1,cloudOctaves:detail==='low'?0:detail==='high'?4:3,environmentSize:reflections==='high'?128:reflections==='low'?64:0,key:[reflections,post,detail].join('|')};
}
function state(scene){
 if(scene.v2Look)return scene.v2Look;
 const k=scene.v2Look={options:null,key:'',material:null,dome:null,octaves:-1,environment:null,environmentTexture:null,environmentAt:-Infinity,environmentSignature:'',post:null,ephemeris:Sky.ephemeris(12),light:new T.Vector3(0,1,0),horizon:new T.Color(),tuned:0,tunedKey:''};
 return k;
}
function rebuildSky(scene,k,octaves){
 if(k.dome){k.dome.removeFromParent();k.dome.geometry.dispose();k.material.dispose();}
 k.material=Sky.createMaterial(octaves);k.dome=Sky.createDome(k.material);k.octaves=octaves;scene.scene.add(k.dome);
}
// Window glass, bodies of water and chrome are the surfaces that show the sky.
function tuneMaterials(scene,k,opts){
 const key=opts.reflections+'|'+scene.materials.size;if(k.tunedKey===key)return;k.tunedKey=key;const reflective=opts.reflections!=='off';
 for(const[id,m]of scene.materials){
  if(!m.isMeshStandardMaterial)continue;const kind=id.slice(id.indexOf(':')+1);
  if(kind==='arch30-glass'){m.roughness=reflective?.05:.24;m.opacity=reflective?.4:.26;m.envMapIntensity=reflective?2.4:1;}
  else if(kind==='glass'){m.roughness=reflective?.07:.22;m.metalness=reflective?.82:.35;m.envMapIntensity=reflective?1.25:1;}
  else if(kind==='metal'||kind==='arch30-metal'){m.envMapIntensity=reflective?1.2:1;}
  else if(kind==='arch30-roof'){m.envMapIntensity=.7;}
 }
 const water=scene.water?.material;if(water){water.roughness=reflective?.07:.28;water.metalness=reflective?.08:.22;water.envMapIntensity=reflective?1.9:1;}
}
function update(scene,sim,dt){
 const k=state(scene),opts=settings(scene);k.options=opts;(root.PlatdoV2||(root.PlatdoV2={})).clearcoat=opts.reflections==='high';
 if(k.octaves!==opts.cloudOctaves)rebuildSky(scene,k,opts.cloudOctaves);
 const time=sim.dayTime??sim.worldTime??(sim.timeOfDay??.5),hour=time<=1?time*24:time>24?(time/90)%24:time,e=Sky.ephemeris(hour,k.ephemeris),sky=scene.citySky,cover=C(sky?.cloudBlend||0,0,1),wet=C(sky?.rainBlend||0,0,1),u=k.material.uniforms,d=e.daylight;/* V8.6: sunrise over the hills, sunset over the sea */{const sx=e.sun.x,sz=e.sun.z;e.sun.x=-sz;e.sun.z=-sx;const mx=e.moon.x,mz=e.moon.z;e.moon.x=-mz;e.moon.z=-mx;}
 u.sunDirection.value.copy(e.sun);u.moonDirection.value.copy(e.moon);u.daylight.value=d;u.cover.value=cover;u.wet.value=wet;u.time.value=sim.time||scene.time||0;
 k.dome.visible=!scene.underwater;k.dome.position.copy(scene.camera.position);k.dome.scale.setScalar(Math.max(40,scene.camera.far*.4));
 // The drawn cloud layer replaces the older billboard clouds when it is enabled.
 if(opts.cloudOctaves>0&&sky)for(const cloud of sky.clouds)cloud.visible=false;
 // Horizon colour, shared by the distance fog so far buildings fade into the sky.
 const dusk=C(1-Math.abs(e.sun.y)/.42,0,1)*C((e.sun.y+.2)/.24,0,1),h=Sky.horizon(e,cover,wet,k.horizon);
 if(!scene.underwater){scene.scene.fog.color.copy(h);scene.scene.background.copy(h);}
 u.groundColor.value.setRGB(.2,.21,.2);
 if(!opts.ambientOnly){
  const sunUp=e.sun.y,moon=sunUp<-.03,direction=moon?e.moon:e.sun;k.light.copy(direction);if(k.light.y<.2){k.light.y=.2;k.light.normalize();}
  scene.sun.position.copy(scene.sun.target.position).addScaledVector(k.light,470);/* V8.5: a short shadow box round the player */{const sc=scene.sun.shadow.camera,ext=Math.max(Math.abs(sc.right),Math.abs(sc.top)),near=Math.max(1,470-ext-170),far=470+ext+40;if(sc.near!==near||sc.far!==far){sc.near=near;sc.far=far;sc.updateProjectionMatrix();}}
  if(moon){scene.sun.color.setRGB(.5,.63,1);scene.sun.intensity=.5*C((-sunUp-.03)/.1,0,1)*(1-cover*.55);}
  else{const high=C((sunUp-.02)/.42,0,1);scene.sun.color.setRGB(1,.6+.36*high,.34+.55*high);scene.sun.intensity=4.1*C((sunUp+.03)/.15,0,1)*(1-cover*.5-wet*.14)*(scene.underwater?.55:1);}
  scene.hemi.color.setRGB(.6*d+.1,.68*d+.13,.84*d+.27);scene.hemi.groundColor.setRGB(.4*d+.05,.36*d+.055,.3*d+.075);
  scene.hemi.intensity=opts.environmentSize?mix(.8,.54,d):mix(.98,1.35,d);if(scene.underwater)scene.hemi.intensity=.85;
 }
 // Indoors the sun does not reach, so rooms get a warm fill instead of going murky.
 const who=sim.player||scene.world.spawn,inside=!!(who&&scene.world.interiorAt?.(who.x,who.z,who.y));k.interior=dt>0?(k.interior||0)+((inside?1:0)-(k.interior||0))*(1-Math.exp(-dt*4)):inside?1:0;
 if(k.interior>.002){scene.fill.intensity+=k.interior*1.1;scene.fill.color.setRGB(mix(.84,1,k.interior),mix(.86,.94,k.interior),mix(.86,.84,k.interior));}
 // Shadow map cadence. On skipped frames the light stays where the stored map was drawn
 // from, so shadows never slide against the ground.
 const renderer=scene.renderer;k.frame=(k.frame||0)+1;
  /* V9.0: steady shadows: the light moves in whole shadow-map texels, so edges do not crawl as you move */
  {const s=scene.sun,cam=s?.shadow?.camera;if(cam&&s.shadow.mapSize.x>0){const t=s.target.position,dx=s.position.x-t.x,dy=s.position.y-t.y,dz=s.position.z-t.z,L=Math.hypot(dx,dy,dz)||1,zx=dx/L,zy=dy/L,zz=dz/L,rl=Math.hypot(zz,zx)||1,rx=zz/rl,rz=-zx/rl,ux=zy*rz,uy=zz*rx-zx*rz,uz=-zy*rx,tx=(cam.right-cam.left)/s.shadow.mapSize.x,ty=(cam.top-cam.bottom)/s.shadow.mapSize.y,a=t.x*rx+t.z*rz,b=t.x*ux+t.y*uy+t.z*uz,da=Math.round(a/tx)*tx-a,db=Math.round(b/ty)*ty-b,ox=rx*da+ux*db,oy=uy*db,oz=rz*da+uz*db;t.x+=ox;t.y+=oy;t.z+=oz;s.position.x+=ox;s.position.y+=oy;s.position.z+=oz;}}
  /* V9.0: while you drive, the shadow map is drawn every frame, so the car's own shadows never lag and snap */
  const ride=who?.vehicleId&&(sim.vehicles||[]).find(v=>v.id===who.vehicleId),driving=!!ride&&Math.hypot(ride.vx||0,ride.vz||0)>1.5;
  if(opts.shadowEvery>1&&!driving&&renderer.shadowMap.enabled&&!opts.ambientOnly){renderer.shadowMap.autoUpdate=false;if(k.frame%opts.shadowEvery===0||!k.shadowSun){renderer.shadowMap.needsUpdate=true;(k.shadowSun||(k.shadowSun=new T.Vector3())).copy(scene.sun.position);(k.shadowTarget||(k.shadowTarget=new T.Vector3())).copy(scene.sun.target.position);}else{scene.sun.position.copy(k.shadowSun);scene.sun.target.position.copy(k.shadowTarget);}}
 else{renderer.shadowMap.autoUpdate=true;k.shadowSun=null;}
 // Sky-lit environment. Refreshed when the light has visibly changed, not every frame.
 if(opts.environmentSize){
  if(k.environment&&k.environment.size!==opts.environmentSize){k.environment.dispose();k.environment=null;k.environmentTexture=null;}
  if(!k.environment)k.environment=new Sky.Environment(scene.renderer,opts.environmentSize);
  const now=performance.now(),signature=Math.round(hour*6)+'|'+Math.round(cover*8)+'|'+Math.round(wet*4);
  if(!k.environmentTexture||signature!==k.environmentSignature&&now-k.environmentAt>1500){k.environmentTexture=k.environment.update(k.material);k.environmentSignature=signature;k.environmentAt=now;}
  if(scene.scene.environment!==k.environmentTexture)scene.scene.environment=k.environmentTexture;
 }else{if(k.environment){k.environment.dispose();k.environment=null;k.environmentTexture=null;}if(scene.scene.environment&&scene.scene.environment===k.lastEnvironment)scene.scene.environment=null;}
 k.lastEnvironment=k.environmentTexture;
 tuneMaterials(scene,k,opts);
 // Finish pass.
 if(opts.post!=='off'){if(!k.post)k.post=new Post.Pipeline(scene.renderer);const night=1-d;k.post.configure({samples:opts.post==='full'?4:2,bloomLevels:opts.post==='full'?6:4,bloom:.2+night*.32+dusk*.08,threshold:1.02,saturation:1.1,contrast:1.06,vignette:.15});scene.v2Post=k.post.supported?k.post:null;}
 else{scene.v2Post=null;if(k.post){k.post.dispose();k.post=null;}}
}
const baseAtmosphere=S.atmosphere;
S.atmosphere=function(sim,dt){baseAtmosphere.call(this,sim,dt);try{update(this,sim,dt);}catch(error){if(!this.v2LookFailed){this.v2LookFailed=true;console.error('City look update failed',error);}}};
const baseDispose=S.dispose;
S.dispose=function(){const k=this.v2Look;if(k){k.post?.dispose();k.environment?.dispose();if(k.dome){k.dome.removeFromParent();k.dome.geometry.dispose();k.material.dispose();}this.v2Look=null;this.v2Post=null;}return baseDispose.call(this);};
const baseStats=S.stats;
S.stats=function(){const k=this.v2Look,o=k?.options;return{...baseStats.call(this),look:o?{reflections:o.reflections,post:this.v2Post?o.post:'off',clouds:o.cloudOctaves,environment:o.environmentSize,samples:this.v2Post?.target?.samples||0}:null};};
root.CityLook={settings,update};
})(typeof globalThis!=='undefined'?globalThis:this);
