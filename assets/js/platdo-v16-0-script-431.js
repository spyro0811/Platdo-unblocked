
/* PLATDO City houses in online rooms (V10.8). Game only; the room's host keeps who owns each house and who may go in
 * (apartment-access.cjs, the same records as the apartments), opens and shuts the front doors, and puts anyone without
 * access back outside. Here, at the front door of a house:
 * - for sale: "Buy <address> - $250,000"; the first press asks, a second press within six seconds buys it with your
 *   online City money (you can also buy it in Platdo Estates);
 * - someone else's: "Ask <owner> to let you in". They answer under Friends, Requests, or give you access from your
 *   name's More menu, exactly as for an apartment;
 * - yours, or one you may visit: nothing to press, the door opens as you walk up (city-house-look.js draws it from
 *   what the host says is open). */
(function(root){'use strict';
const money=n=>'$'+Math.round(n).toLocaleString('en-US');
let ask=null,busy=false,told={};
// the house the host says you are standing at, if the game also sees you at that door
function at(sim){
 const h=sim?.onlineRoom&&sim.onlineHouse;if(!h||!h.id)return null;const p=sim.player;if(!p||p.health<=0||p.mode!=='onFoot'||p.vehicleId||p.transition||p.physical)return null;
 const house=root.CityHouseLife?.doorNear?.(sim)||/* V15.7: or a hill mansion */root.CityVillaLife?.doorNear?.(sim);return house&&house.id===h.id?{...h,address:h.address||house.address,name:h.name||house.name,price:h.price||house.price}:null;}
function prompt(sim){
 const h=at(sim);if(!h||busy)return null;const price=h.price||root.CityHouses?.PRICE||250000,now=performance.now(),what=h.villa?h.name||h.address:h.address;
 if(h.state==='sale')return{action:'interact',text:ask&&ask.id===h.id&&ask.until>now?'Press again to buy for '+money(price):'Buy '+what+' \u{2013} '+money(price)};
 if(h.state==='taken')return h.requested||told[h.id]>now?{text:'You asked '+(h.owner||'the owner')+' to let you in'}:{action:'interact',text:'Ask '+(h.owner||'the owner')+' to let you in'};
 return null;}
// the use key at a front door: true when it was handled here
function interact(sim,toast){
 const h=at(sim),F=root.PlatdoFriends;if(!h||!F||busy)return false;const now=performance.now(),price=h.price||root.CityHouses?.PRICE||250000,what=h.villa?h.name||h.address:h.address;
 if(h.state==='sale'){
  if(!(ask&&ask.id===h.id&&ask.until>now)){ask={id:h.id,until:now+6000};toast?.(what+': '+money(price)+'. You have '+money(sim.profile.wallet||0)+'. Press again to buy.');return true;}
  ask=null;busy=true;F.action('apartment',{kind:'buy',unit:h.id}).then(r=>toast?.(r?.message||(h.villa?what+' is yours.':'The house is yours.')),e=>toast?.(e.message)).finally(()=>{busy=false;});return true;}
 if(h.state==='taken'){
  if(h.requested||told[h.id]>now)return true;
  busy=true;told[h.id]=now+8000;F.action('apartment',{kind:'request',unit:h.id}).then(r=>toast?.(r?.message||'Request sent.'),e=>{told[h.id]=0;toast?.(e.message);}).finally(()=>{busy=false;});return true;}
 return false;}
root.CityHousesOnline={prompt,interact,at};
})(typeof globalThis!=='undefined'?globalThis:this);
