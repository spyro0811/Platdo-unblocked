
/* PLATDO City: the main menu's tour of the City (V15.6). Game only.
 * The menu shows the live City behind it (Stinky Poopy Diaper Mode is always on). Since the first house and the mansion
 * beside it are gone, the menu no longer looks at them: a camera glides slowly through a list of shots round the map
 * (the beach from the sea, the beach-front shops on Coast Boulevard, the beach, the casino, The Copper Kettle, Wokstar
 * and the houses of Lantern Street, downtown from the air, the hill mansions, the marina, the stunt park and the airport) and fades through black between them.
 * It is a free camera, not a drone: the horizon stays level, nothing tilts or banks, and no drone screen or propellers.
 * An invisible player stands at the middle of what each shot looks at, so the City's own crowd, traffic and beach life
 * are there; at each cut they are filled in round the new place while the screen is black.
 * The menu's time-of-day slider still sets the hour: the tour keeps it as it steps the City. */
(function(root){'use strict';
// [name, camera from [x,y,z], camera to, look from [x,y,z], look to, seconds, field of view, 'abs']. The heights are
// metres above the ground (or the sea) under each point, unless the shot ends in 'abs' (then they are the world's own).
const SHOTS=[
 ['beach from the sea',[-300,20,1010],[-150,20,1000],[-230,2,770],[-140,2,770],11,52],
 ['coast boulevard shops',[-254,5.2,716],[-190,5.2,716],[-236,3,688],[-172,3,688],10,58],
 ['the beach',[-200,1.7,820],[-150,1.7,828],[-160,1,870],[-110,1,878],10,58],
 ['the casino',[-82,7,742],[0,7,742],[-50,4,700],[-30,4,700],10,55],
 ['the copper kettle',[-168,2.2,652],[-232,2.2,652],[-196,4,626],[-204,4,626],10,58],
 ['wokstar on lantern street',[-200,2.6,513],[-142,2.6,513],[-188,3.2,490],[-146,3.2,484],10,60],
 ['downtown',[-60,85,560],[60,85,560],[40,25,360],[110,25,360],11,55],
 ['hill mansions',[100,150,-150],[200,150,-162],[200,118,-252],[250,118,-252],11,52,'abs'],
 ['the marina',[-650,9,706],[-690,9,712],[-712,1,662],[-726,1,650],10,56],
 ['the stunt park',[-680,70,-960],[-790,70,-975],[-755,15,-1052],[-760,15,-1060],11,55],
 ['the airport',[290,14,-1150],[440,14,-1150],[372,8,-1223],[380,8,-1230],11,55]
];
const FADE=.75,ease=t=>t*t*(3-2*t),lerp=(a,b,t)=>a+(b-a)*t;
class Tour{
 constructor(scene,view,options={}){this.scene=scene;this.view=view;this.shots=options.shots||SHOTS;this.i=-1;this.t=0;this.error=null;
  const doc=root.document,host=doc?.getElementById('cityRoot');if(host){this.el=doc.createElement('div');this.el.id='cityMenuFade';this.el.style.cssText='position:absolute;inset:0;background:#000;opacity:1;pointer-events:none;z-index:2';host.appendChild(this.el);}
  root.CityMenuTour.current=this;this.next();}
 // the ground under the middle of what the shot looks at
 focus(s){return{x:(s[3][0]+s[4][0])/2,z:(s[3][2]+s[4][2])/2};}
 stand(f){const v=this.view,y=v.world.groundHeight(f.x,f.z,(v.world.terrainHeight?.(f.x,f.z)??0)+2);Object.assign(v.player,{x:f.x,y:(Number.isFinite(y)?y:v.player.y)+.05,z:f.z,mode:'onFoot',vehicleId:null,seat:null,transition:null,physical:null,ragdoll:null,vx:0,vy:0,vz:0,speed:0,health:100,grounded:true});}
 // the shot in world heights: each point's height above the ground (or the sea) under it, unless the shot is 'abs'
 place(s){if(s[7]==='abs'||s._at)return s._at||s;const w=this.view.world,base=(x,z)=>{const g=w.terrainHeight?.(x,z)??w.groundHeight(x,z,0),sea=w.waterHeight?.(x,z,0);return Number.isFinite(sea)&&sea>g?sea:g;},up=p=>[p[0],base(p[0],p[2])+p[1],p[2]];s._at=[s[0],up(s[1]),up(s[2]),up(s[3]),up(s[4]),s[5],s[6]];return s._at;}
 next(){const v=this.view;this.i=(this.i+1)%this.shots.length;this.t=0;const f=this.focus(this.shots[this.i]);this.stand(f);
  // the people and cars of the last place go; the new place's are filled in now (the screen is black)
  v.npcs=(v.npcs||[]).filter(n=>Math.hypot(n.x-f.x,n.z-f.z)<160);v.vehicles=(v.vehicles||[]).filter(c=>Math.hypot(c.x-f.x,c.z-f.z)<220);
  try{v.populate?.();}catch(e){this.error=String(e);}try{if(v.profile.mode!=='story')v.createTraffic?.(undefined,true);}catch(e){this.error=String(e);}
  this.camera(0);}
 camera(k){const s=this.place(this.shots[this.i]),e=ease(k),P=(a,b)=>({x:lerp(a[0],b[0],e),y:lerp(a[1],b[1],e),z:lerp(a[2],b[2],e)});
  this.view.menuCamera={kind:'tour',position:P(s[1],s[2]),target:P(s[3],s[4]),fov:s[6]||55,hidePlayer:true,far:s[1][1]>60?2600:undefined};}
 // one step of the City round this shot (the menu's slider keeps the time of day)
 tick(dt){const v=this.view,keep=v.profile.world.time,f=this.focus(this.shots[this.i]);Object.assign(v.player,{x:f.x,z:f.z,vx:0,vz:0,health:100});
  try{v.step(dt,{});}catch(e){this.error=String(e&&e.stack||e);}v.profile.world.time=keep;v.events=[];v.frameEvents=[];v.effects=[];}
 update(dt){const s=this.shots[this.i],dur=s[5];this.t+=Math.min(dt,.1);if(this.t>=dur)this.next();this.camera(Math.min(1,this.t/dur));
  const a=this.t<FADE?1-this.t/FADE:this.t>dur-FADE?(this.t-(dur-FADE))/FADE:0;if(this.el)this.el.style.opacity=String(Math.max(0,Math.min(1,a)).toFixed(3));}
 // what the menu reports about its scene (PlatdoCity.menuPreview.presentation)
 diagnostics(){const s=this.shots[this.i]||[];return{tour:true,shot:s[0]||null,index:this.i,time:+this.t.toFixed(2),shots:this.shots.length,people:this.view.npcs?.length||0,vehicles:this.view.vehicles?.length||0,error:this.error};}
 dispose(){this.el?.remove();this.el=null;if(root.CityMenuTour?.current===this)root.CityMenuTour.current=null;}
}
root.CityMenuTour={Tour,SHOTS};
})(typeof globalThis!=='undefined'?globalThis:this);
