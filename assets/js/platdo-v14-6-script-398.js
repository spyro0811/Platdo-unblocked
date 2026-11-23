
/* PLATDO City: what an account already had from the old real-money shop (V10.5). Game only. The shop is gone: the
 * Sunrunner Buggy is a normal LINK vehicle, the drone is free, the F1 is a normal Drive garage car and the mansion is
 * sold in Platdo Estates, all for game money. An account that already had the buggy gets one in its garage, once per
 * save (Sandbox and Story; online rooms do the same on the host), in the paint it had chosen. Nothing is taken away. */
(function(root){'use strict';
const PAINTS=[0xe79e36,0x288982];
function paint(uid,suffix){try{const saved=JSON.parse(root.Platdo?.storage?.('premium')?.get('city-fleet:'+uid+suffix)||'{}');return PAINTS[saved.paint]||PAINTS[0];}catch(_){return PAINTS[0];}}
function grant(){
 const C=root.PlatdoCity,sim=C?.sim,P=root.PlatdoPremium;if(!sim||!P||sim.onlineRoom)return false;
 const p=sim.profile;if(!p||!Array.isArray(p.owned)||!['sandbox','story'].includes(p.mode)||typeof sim.uid!=='function')return false;
 if(p.legacyShop?.sunrunner)return false;
 let allowed=false;try{allowed=P.access('CITY-08').allowed===true;}catch(_){}
 if(!allowed)return false;
 p.legacyShop={...(p.legacyShop||{}),sunrunner:true};
 if(!p.owned.some(o=>o.typeId==='sunrunner'))p.owned.push({id:sim.uid('owned'),typeId:'sunrunner',customization:{paint:paint(P.getState().uid,C.progressSuffix||''),wheelStyle:0,trim:0,engineUpgrade:0,gripUpgrade:0}});
 sim.dirty=true;try{C.save?.();}catch(_){}
 return true;}
const run=()=>{try{grant();}catch(_){}};
root.addEventListener?.('platdo:premiumchange',run);
root.addEventListener?.('platdo:citymodechange',run);
root.setInterval?.(()=>{try{if(root.PlatdoCity?.visible)grant();}catch(_){}},4000);
root.CityLegacyShop={grant};
})(typeof globalThis!=='undefined'?globalThis:this);
