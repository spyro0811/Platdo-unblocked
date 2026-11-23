
/* PLATDO V2 — Drive look. Presentation only; the simulation never reads any of this.
 *   - The shared procedural sky replaces the two-colour gradient, painted sun and
 *     billboard clouds, and follows Drive's own clock and weather.
 *   - The sun (and at night the moon) now moves, so shadows turn through the day.
 *   - Tiers without captured reflections are lit by that sky instead of flat ambient.
 *   - Glow, tone and colour are handed to the shared finish pass in graphics.js. */
(()=>{'use strict';
const T=window.THREE,Scene=window.DriveScene;if(!T||!Scene)return;
const P=Scene.prototype,base=P.updateWorldLighting;if(!base)return;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
function octavesFor(scene){const q=scene.settings.graphicsValues?.detail||scene.settings.quality;return q==='potato'||q==='low'?0:q==='medium'||q==='high'?3:4;}
function state(scene){
 const Sky=window.PlatdoSky;if(!Sky||!scene.sky)return null;const octaves=octavesFor(scene);
 if(scene.v2Look&&scene.v2Look.octaves===octaves)return scene.v2Look;
 const material=Sky.createMaterial(octaves);
 // The original lighting code still writes these two colours; keep them so it has somewhere to write.
 material.uniforms.top={value:new T.Color()};material.uniforms.horizon={value:new T.Color()};
 const old=scene.sky.material;scene.sky.material=material;if(old&&old!==material)old.dispose();
 const previous=scene.v2Look||{};
 return scene.v2Look={...previous,material,octaves,ephemeris:previous.ephemeris||Sky.ephemeris(12),light:previous.light||new T.Vector3(0,1,0),offset:previous.offset||new T.Vector3(),horizon:previous.horizon||new T.Color(),signature:'',tunedAt:-Infinity};
}
P.updateWorldLighting=function(sim,body,playing){
 base.call(this,sim,body,playing);
 let k;try{k=state(this);}catch(error){if(!this.v2LookFailed){this.v2LookFailed=true;console.error('Drive look setup failed',error);}return;}
 if(!k)return;
 const Sky=window.PlatdoSky,hour=this.worldClock?.hour??12,e=Sky.ephemeris(hour,k.ephemeris),d=e.daylight,a=this.atmosphere,cover=clamp(a?.cloud||0,0,1),wet=clamp(a?.rainAmount||0,0,1),u=k.material.uniforms;
 u.sunDirection.value.copy(e.sun);u.moonDirection.value.copy(e.moon);u.daylight.value=d;u.cover.value=cover;u.wet.value=wet;u.time.value=sim?.time||this.time||0;
 // The painted sun disc, billboard clouds and flat moon are replaced by the drawn sky.
 const children=this.sky.children;if(children[0])children[0].visible=false;if(k.octaves>0)for(let i=1;i<children.length;i++)children[i].visible=false;if(a?.moon)a.moon.visible=false;
 const dusk=clamp(1-Math.abs(e.sun.y)/.42,0,1)*clamp((e.sun.y+.2)/.24,0,1),h=Sky.horizon(e,cover,wet,k.horizon);
 this.scene.background.copy(h);this.scene.fog.color.copy(h);
 const g=this.graphics,simple=this.settings.graphicsValues?.lighting==='simple',lit=!!(g?.reflection||g?.skyEnvironment);
 if(!simple){
  const sunUp=e.sun.y,moon=sunUp<-.03,direction=moon?e.moon:e.sun;k.light.copy(direction);if(k.light.y<.22){k.light.y=.22;k.light.normalize();}
  k.offset.copy(k.light).multiplyScalar(244);this.v2SunOffset=k.offset;
  if(moon){this.sun.color.setRGB(.5,.63,1);this.sun.intensity=.45*clamp((-sunUp-.03)/.1,0,1)*(1-cover*.55);}
  else{const high=clamp((sunUp-.02)/.42,0,1);this.sun.color.setRGB(1,.6+.36*high,.34+.55*high);this.sun.intensity=3.7*clamp((sunUp+.03)/.15,0,1)*(1-cover*.5-wet*.14);}
 }else this.v2SunOffset=null;
 const ambient=k.ambient||(k.ambient=this.scene.children.find(x=>x.isHemisphereLight));
 if(ambient){ambient.color.setRGB(.6*d+.1,.68*d+.13,.84*d+.27);ambient.groundColor.setRGB(.4*d+.05,.36*d+.055,.3*d+.075);ambient.intensity=simple?mix(1.0,1.75,d):lit?mix(.66,.6,d):mix(.9,1.3,d);}
 // Sky-lit environment for tiers that do not capture their own reflections.
 if(g?.skyEnvironment&&!g.reflection){
  if(!k.environment)k.environment=new Sky.Environment(this.renderer,64);
  const now=performance.now(),signature=Math.round(hour*6)+'|'+Math.round(cover*8)+'|'+Math.round(wet*4);
  if(!g.skyTexture||signature!==k.signature&&now-(k.environmentAt||-Infinity)>1500){g.skyTexture=k.environment.update(k.material);k.signature=signature;k.environmentAt=now;}
  if(this.scene.environment!==g.skyTexture){this.scene.environment=g.skyTexture;k.tunedAt=-Infinity;}
  if(now-k.tunedAt>2500){k.tunedAt=now;this.tuneReflections?.();}
 }else if(k.environment&&!g?.skyEnvironment){k.environment.dispose();k.environment=null;}
 if(g)g.finishOptions={bloom:.18+(1-d)*.34+dusk*.08,threshold:1.02,saturation:1.1,contrast:1.06,vignette:.14};
};
const dispose=P.dispose;P.dispose=function(){const k=this.v2Look;if(k){k.environment?.dispose();k.material?.dispose();this.v2Look=null;}return dispose.call(this);};
})();
