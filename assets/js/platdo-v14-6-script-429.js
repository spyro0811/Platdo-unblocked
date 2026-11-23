
/* PLATDO City houses: living in them (V9.5). Game only.
 * - At the front door of a house that is not yours: "Buy <address> - $250,000". The first press asks, a second press
 *   within six seconds buys it (game money, Sandbox and Story). Online the houses stay shut for now.
 * - Your own house: the front door opens as you come up to it (city-house-look.js); by any of the three beds you can
 *   sleep until morning.
 * - A house can be the home you start at (Platdo Estates, Mine, Start here): knocked out, you wake up inside it. */
(function(root){'use strict';
const HS=()=>root.CityHouses;
const BEDS=[[-1.2,1.45],[4.0,1.4],[3.8,-3.95]];
let ask=null;
const money=n=>'$'+Math.round(n).toLocaleString('en-US');
const free=p=>p&&p.health>0&&p.mode==='onFoot'&&!p.vehicleId&&!p.transition&&!p.physical&&!p.ragdoll;
/* V10.7: in Sandbox, playing alone, every house is open to you without buying it */const open=sim=>!!sim&&!sim.onlineRoom&&sim.profile?.mode==='sandbox';
// the house whose front door you are standing at, from outside
function doorNear(sim){
 const H=HS(),p=sim?.player;if(!H||!free(p)||root.CityApartmentsLife?.busy?.())return null;
 for(const h of sim.world.houses||[]){if(Math.abs(p.x-h.x)>12||Math.abs(p.z-h.z)>12)continue;const q=H.toLocal(h,p.x,p.y,p.z);if(Math.abs(q.x)<1.3&&q.z>H.HZ-.1&&q.z<H.HZ+2.4&&Math.abs(q.y)<1.4)return h;}
 return null;}
function bedNear(sim){
 const H=HS(),p=sim?.player;if(!H||!free(p)||sim.onlineRoom)return false;const at=H.houseAt(sim.world,p.x,p.y,p.z);if(!at||at.floor!==1||!(H.owns(sim,at.house.id)||open(sim)))return false;
 return BEDS.some(([x,z])=>Math.hypot(at.local.x-x,at.local.z-z)<1.75);}
function place(sim,h){const H=HS(),at=H.inside(h);if(root.CityApartmentsLife?.place)root.CityApartmentsLife.place(sim,at);else Object.assign(sim.player,{x:at.x,y:at.y,z:at.z,yaw:at.yaw});}
function install(){
 const S=root.CitySimulation?.Simulation;if(!S||S.prototype._cityHouses)return!!S;const p=S.prototype;p._cityHouses=true;
 const prompt=p.prompt,interact=p.interact,respawn=p.respawn;
 p.prompt=function(){const H=HS();
  const h=doorNear(this);if(h&&!H.owns(this,h.id)&&!open(this)){if(this.onlineRoom)return{action:'interact',text:h.address+': for sale in Sandbox and Story'};const t=performance.now();return{action:'interact',text:ask&&ask.id===h.id&&ask.until>t?'Press again to buy for '+money(H.PRICE):'Buy '+h.address+' \u{2013} '+money(H.PRICE)};}
  if(bedNear(this))return{action:'interact',text:(t=>t>=.75||t<.25)((((this.profile?.world?.time??0)%1)+1)%1)?'Sleep until morning':'Sleep (after 6 pm)'};
  return prompt.call(this);};
 p.interact=function(){const H=HS();
  const h=doorNear(this);if(h&&!H.owns(this,h.id)&&!open(this)){
   if(this.onlineRoom){this.emit('notice',{message:'Houses in online rooms come with a later update.'});return true;}
   const t=performance.now();if(ask&&ask.id===h.id&&ask.until>t){ask=null;const r=H.buy(this,h.id);this.emit('notice',{message:r.ok?r.message+' The front door opens for you now.':r.message});if(r.ok)try{root.PlatdoCity?.save?.();}catch(e){}return true;}
   ask={id:h.id,until:t+6000};this.emit('notice',{message:h.address+': '+money(H.PRICE)+'. You have '+money(this.profile.wallet)+'. Press again to buy.'});return true;}
  if(bedNear(this)&&(t=>t<.75&&t>=.25)((((this.profile?.world?.time??0)%1)+1)%1)){/* V12.7: you can only go to sleep from 6 pm until 6 am */this.emit('notice',{message:'You can only go to sleep after 6 pm.'});return true;}if(bedNear(this)){this.profile.world.time=7/24;this.player.health=Math.max(this.player.health,100);this.dirty=true;this.emit('notice',{message:'Good morning.'});return true;}
  return interact.call(this);};
 // knocked out: wake up in the house you chose to start at
 p.respawn=function(){const r=respawn.apply(this,arguments);try{const H=HS(),s=this.profile?.apartments?.start;if(H&&typeof s==='string'&&s.startsWith('house-')&&!this.mission&&!this.onlineRoom&&H.owns(this,s)){const h=H.byId(this.world,s);if(h)place(this,h);}}catch(e){}return r;};
 return true;}
install();
root.CityHouseLife={install,doorNear,bedNear,place,open,BEDS};
})(typeof globalThis!=='undefined'?globalThis:this);
