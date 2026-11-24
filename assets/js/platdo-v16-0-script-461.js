
/* PLATDO City hill mansions: living in them (V15.3). Game only.
 * - At the front door of a mansion that is not yours: "Buy <name> - $price". The first press asks, a second press within
 *   six seconds buys it (game money, Sandbox and Story); they are also for sale in Platdo Estates, Mansions. Alone in
 *   Sandbox every mansion is open to you. Online they can be looked at but not bought yet.
 * - Your own mansion: the front door opens as you come up to it (city-villa-look.js); by any of its beds you can sleep
 *   after 6 pm (the sleep scene, city-sleep.js).
 * - A mansion can be the home you start at (Platdo Estates, Mine, Start here): knocked out, you wake up inside it. */
(function(root){'use strict';
const VS=()=>root.CityVillas;
let ask=null;
const free=p=>p&&p.health>0&&p.mode==='onFoot'&&!p.vehicleId&&!p.transition&&!p.physical&&!p.ragdoll;
const open=sim=>!!sim&&!sim.onlineRoom&&sim.profile?.mode==='sandbox';
const night=sim=>(t=>t>=.75||t<.25)((((sim.profile?.world?.time??0)%1)+1)%1);
// the mansion whose front door you are standing at, from outside
function doorNear(sim){const V=VS(),p=sim?.player;if(!V||!free(p)||root.CityApartmentsLife?.busy?.())return null;
 for(const v of sim.world.villas||[]){if(Math.abs(p.x-v.pad.x)>32||Math.abs(p.z-v.pad.z)>32)continue;const d=V.frontDoor(v);if(Math.hypot(p.x-d.x,p.z-d.z)<1.9&&Math.abs(p.y-v.y)<1.4)return v;}return null;}
// the bed you are standing by in a mansion you may use: where to lie and which way
function bedNear(sim){const V=VS(),p=sim?.player;if(!V||!free(p)||sim.onlineRoom)return null;const at=V.villaAt(sim.world,p.x,p.y,p.z);if(!at||!(V.owns(sim,at.villa.id)||open(sim)))return null;
 const D=V.derive(V.planOf(at.villa));for(const b of D.beds){if(Math.abs((b.y||0)-at.local.y)>1.2)continue;if(Math.hypot(at.local.x-b.x,at.local.z-b.z)<Math.max(b.w,b.d)/2+.9){const a=[0,Math.PI/2,Math.PI,-Math.PI/2][b.r],q=V.toWorld(at.villa,b.x,(b.y||0)+.58,b.z);return{x:q.x,y:q.y,z:q.z,yaw:a+V.yawOf(at.villa),half:b.w/2};}}return null;}
function place(sim,v){const V=VS(),at=V.inside(v);if(root.CityApartmentsLife?.place)root.CityApartmentsLife.place(sim,at);else Object.assign(sim.player,{x:at.x,y:at.y,z:at.z,yaw:at.yaw});}
function install(){
 const S=root.CitySimulation?.Simulation;if(!S||S.prototype._cityVillas)return!!S;const p=S.prototype;p._cityVillas=true;
 const prompt=p.prompt,interact=p.interact,respawn=p.respawn;
 p.prompt=function(){const V=VS();
  const v=doorNear(this);if(v&&!V.owns(this,v.id)&&!open(this)){if(this.onlineRoom)return{action:'interact',text:v.name+': for sale in Sandbox and Story'};const t=performance.now();return{action:'interact',text:ask&&ask.id===v.id&&ask.until>t?'Press again to buy for '+V.money(v.price):'Buy '+v.name+' \u{2013} '+V.money(v.price)};}
  if(bedNear(this))return{action:'interact',text:night(this)?'Sleep until morning':'Sleep (after 6 pm)'};
  return prompt.call(this);};
 p.interact=function(){const V=VS();
  const v=doorNear(this);if(v&&!V.owns(this,v.id)&&!open(this)){
   if(this.onlineRoom){this.emit('notice',{message:'Buying a hill mansion in an online room comes in a later update.'});return true;}
   const t=performance.now();if(ask&&ask.id===v.id&&ask.until>t){ask=null;const r=V.buy(this,v.id);this.emit('notice',{message:r.ok?r.message+' The front door opens for you now.':r.message});if(r.ok)try{root.PlatdoCity?.save?.();}catch(e){}return true;}
   ask={id:v.id,until:t+6000};this.emit('notice',{message:v.name+', '+v.address+': '+V.money(v.price)+'. You have '+V.money(this.profile.wallet)+'. Press again to buy.'});return true;}
  const bed=bedNear(this);if(bed){if(!night(this)){this.emit('notice',{message:'You can only go to sleep after 6 pm.'});return true;}
   if(root.CitySleep?.request?.(this,{bed,place:'villa'}))return true;this.profile.world.time=7/24;this.player.health=Math.max(this.player.health,100);this.dirty=true;this.emit('notice',{message:'Good morning.'});return true;}
  return interact.call(this);};
 // knocked out: wake up in the mansion you chose to start at
 p.respawn=function(){const r=respawn.apply(this,arguments);try{const V=VS(),s=this.profile?.apartments?.start;if(V&&typeof s==='string'&&s.startsWith('villa-')&&!this.mission&&!this.onlineRoom&&V.owns(this,s)){const v=V.byId(this.world,s);if(v)place(this,v);}}catch(e){}return r;};
 return true;}
install();
root.CityVillaLife={install,doorNear,bedNear,place,open};
})(typeof globalThis!=='undefined'?globalThis:this);
