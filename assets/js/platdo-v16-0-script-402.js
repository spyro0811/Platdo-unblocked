
/* PLATDO City Christmas rules (V13.0). This file is the same in the game and on the multiplayer host
 * (server/platdo-city/src/christmas.js), so both decide the same things:
 * - cover(): how much snow the ground holds at a place: none on sand or in the sea, full on everything else outdoors.
 * - snowAt(): is the ground under a wheel or a foot snowy (not sand, not water, not indoors, not under a roof).
 * - the 250 snowmen: where they stand (christmas-spots.js, the same in every room), which are still standing in
 *   this room, and the three ways a player breaks one: a shot, a punch, or walking (or driving) into it. The first
 *   player to break one is paid REWARD once; the payment is keyed to the room and the snowman, so a retry, a
 *   second hit in the same instant or a rejoin can never pay twice.
 * - surface(): marks each vehicle that is standing on snow; vehicles.js gives those GRIP times the normal grip.
 * Nothing here draws anything: the snow, the snowmen you see and the rolling snowballs are in city-xmas-*.js. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityChristmas=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const need=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
const COUNT=250,REWARD=500,GRIP=.9,/* seconds the three snowballs of a broken snowman stay */DEBRIS=[10,15];
/* a snowman at size 1: [radius, height of the centre above the ground] for the base, the middle and the head */
const BALLS=[[.5,.42],[.36,1.06],[.25,1.55]],TOP=1.8;
const SPOTS=need('CityChristmasSpots','./christmas-spots.js')||[];
const smooth=t=>{t=t<0?0:t>1?1:t;return t*t*(3-2*t);};
/* sand or sea: ground that never holds snow */
function bare(world,x,z){
 const W=need('CityWorld','./world.js'),shore=W&&W.landHeight?W.landHeight(x,z):world.terrainHeight(x,z);if(shore<2.5)return true;
 const B=need('CityBeach','./beach.js');return !!(B&&B.weight&&B.weight(x,z)>.02);
}
/* 0 on the beach and in the sea, 1 on all other ground; the snow thins out over the last few metres of grass
 * before the sand, so snowy grass meets clear sand without a hard line (the flat city ground is at the same height
 * as the top of the beach, so this goes by distance from the sand, not by height) */
const RING=[[3,0],[-3,0],[0,3],[0,-3],[2.1,2.1],[-2.1,2.1],[2.1,-2.1],[-2.1,-2.1],[6,0],[-6,0],[0,6],[0,-6]];
function cover(world,x,z){
 if(bare(world,x,z))return 0;
 let clear=0;for(let i=0;i<4;i++)if(!bare(world,x+RING[i][0]*2,z+RING[i][1]*2))clear++;
 if(clear===4)return 1;
 clear=0;for(const o of RING)if(!bare(world,x+o[0],z+o[1]))clear++;
 return smooth(clear/RING.length*1.15-.1);
}
/* true where a wheel or a foot at (x,y,z) is on snowy ground */
function snowAt(world,x,z,y){
 if(cover(world,x,z)<.5)return false;
 const ground=world.groundHeight(x,z,(Number.isFinite(y)?y:world.terrainHeight(x,z))+.4);
 if(Number.isFinite(y)&&Math.abs(y-ground)>.6)return false;
 const water=world.waterHeight(x,z,0);if(Number.isFinite(water)&&water>ground-.02)return false;
 if(world.interiorAt(x,z,ground+1))return false;
 /* something solid overhead (a roof, a deck, a canopy): no snow fell here */
 return !(world.groundHeight(x,z,1e4)>ground+1.9);
}
function spots(world){
 if(world._xmasSpots)return world._xmasSpots;
 const out=SPOTS.map((s,i)=>{const x=s[0],z=s[1];return{index:i,id:'snowman-'+String(i+1).padStart(3,'0'),x,z,y:world.groundHeight(x,z,world.terrainHeight(x,z)+.8),yaw:(s[2]||0)*Math.PI/180,size:s[3]||1,hat:s[4]||0};});
 return world._xmasSpots=out;
}
function state(sim){return sim.xmas||(sim.xmas={on:false,room:'solo',broken:new Uint8Array(COUNT),left:Math.min(COUNT,SPOTS.length),revision:0,tick:0});}
/* which snowmen are gone, as 63 hex characters (250 bits): sent to players who join later and kept in a solo save */
function bitmap(sim){const b=state(sim).broken;let out='';for(let i=0;i<COUNT;i+=4)out+=((b[i]?1:0)|(b[i+1]?2:0)|(b[i+2]?4:0)|(b[i+3]?8:0)).toString(16);return out;}
function load(sim,text){
 const st=state(sim);if(typeof text!=='string'||!/^[0-9a-f]{1,63}$/.test(text))text='';
 let left=0;for(let i=0;i<COUNT;i++){const n=parseInt(text[i>>2]||'0',16);st.broken[i]=n>>(i&3)&1;if(!st.broken[i]&&i<SPOTS.length)left++;}
 st.left=left;st.revision++;return st;
}
/* the big Christmas tree (its place is fixed in world.js); its boughs are solid only while the mode is on */
const TREE={x:-345,z:456.84,height:15,radius:3.6};
function setOn(sim,on,room){const st=state(sim);if(room)st.room=String(room).slice(0,40);st.on=!!on;sim.world.snow=st.on;if(!st.on)for(const v of sim.vehicles||[])v.onSnow=false;
 const W=sim.world;if(W._xmasTree===undefined)W._xmasTree=(W.colliders||[]).find(c=>c.xmasTree)||null;if(W._xmasTree)W._xmasTree.enabled=st.on;return st;}
/* the nearest standing snowman a ray (or a ball of the given radius moving along it) meets */
function ray(sim,o,d,max,radius=0){
 const st=sim.xmas;if(!st||!st.on||!st.left)return null;const list=spots(sim.world);let best=null;
 for(let i=0;i<list.length;i++){
  if(st.broken[i])continue;const s=list[i],cx=s.x-o.x,cz=s.z-o.z,cy=s.y+.9*s.size-o.y,t=cx*d.x+cy*d.y+cz*d.z;if(t<-1.2||t>max+1.2)continue;
  if(cx*cx+cy*cy+cz*cz-t*t>1.7*1.7*s.size*s.size)continue;
  for(const ball of BALLS){
   const r=ball[0]*s.size+radius,x=o.x-s.x,y=o.y-(s.y+ball[1]*s.size),z=o.z-s.z,b=x*d.x+y*d.y+z*d.z,c=x*x+y*y+z*z-r*r;let hit;
   if(c<=0)hit=0;else{const q=b*b-c;if(q<0)continue;hit=-b-Math.sqrt(q);if(hit<0||hit>max)continue;}
   if(!best||hit<best.distance){const px=o.x+d.x*hit,py=o.y+d.y*hit,pz=o.z+d.z*hit,nx=px-s.x,ny=py-(s.y+ball[1]*s.size),nz=pz-s.z,nl=Math.hypot(nx,ny,nz)||1;best={distance:hit,point:{x:px,y:py,z:pz},normal:{x:nx/nl,y:ny/nl,z:nz/nl},material:'snow',snowman:i};}
  }
 }
 return best;
}
/* old snowman payments are forgotten once a player has a great many (the room's own list is what stops a second
 * payment for the same snowman; this only keeps the saved list of transactions from growing for ever) */
function trim(profile){
 const tx=profile&&profile.transactions;if(!tx)return;const mine=Object.keys(tx).filter(k=>k.startsWith('snowman:'));if(mine.length<=1500)return;
 mine.sort((a,b)=>(tx[a].revision||0)-(tx[b].revision||0));for(const k of mine.slice(0,mine.length-1000))delete tx[k];
}
/* The player the simulation is acting for (sim.player, with sim.profile) breaks a snowman. Returns true when this
 * call is the one that broke it. cause: 'shot' | 'punch' | 'walk' | 'drive'. */
function smash(sim,index,cause,dir){
 const st=sim.xmas;/* in an online room the host decides (remote): the game page never breaks or pays by itself */if(!st||!st.on||st.remote||!Number.isInteger(index)||index<0||index>=COUNT||st.broken[index])return false;
 const s=spots(sim.world)[index],p=sim.player;if(!s||!p||!(p.health>0)||!sim.profile)return false;
 st.broken[index]=1;st.left=Math.max(0,st.left-1);st.revision++;
 const paid=sim.commit('snowman:'+st.room+':'+s.id,REWARD,'Snowman')===true;trim(sim.profile);
 /* a solo game keeps its own list in the save, so a reload does not bring them back */
 if(st.solo&&sim.profile){const kept=sim.profile.seasonal=sim.profile.seasonal&&typeof sim.profile.seasonal==='object'?sim.profile.seasonal:{};kept.xmas={season:st.season||0,broken:bitmap(sim)};sim.dirty=true;}
 let dx=dir&&Number.isFinite(dir.x)?dir.x:s.x-p.x,dz=dir&&Number.isFinite(dir.z)?dir.z:s.z-p.z;const l=Math.hypot(dx,dz)||1;
 const event=sim.emit('snowmanBroken',{index,x:s.x,y:s.y,z:s.z,by:p.id,cause,paid,dx:Math.round(dx/l*100)/100,dz:Math.round(dz/l*100)/100});
 /* the game page shows the breakup from this short list (a solo game; online it is told by the host) */
 (st.recent||(st.recent=[])).push(event);if(st.recent.length>16)st.recent.shift();
 return true;
}
/* a punch: anything within arm's reach in front of the fist (from a, the way the player is punching) */
function punch(sim,a,dir){const hit=ray(sim,a,dir,.95,.25);return hit?smash(sim,hit.snowman,'punch',dir):false;}
/* which vehicles stand on snow (a few times a second each; vehicles.js reads v.onSnow) */
function surface(sim,dt){
 const st=sim.xmas;st.tick=(st.tick+1)%12;const list=sim.vehicles;
 for(let i=st.tick;i<list.length;i+=12){const v=list[i];v.onSnow=v.grounded!==false&&snowAt(sim.world,v.x,v.z,v.y);}
}
/* Once a step: players who walk or drive into a snowman break it. actors = the players in this world;
 * as(actor,fn) runs fn with the simulation acting for that player (the host switches the wallet it pays into). */
function step(sim,dt,actors,as){
 const st=sim.xmas;if(!st||!st.on)return;surface(sim,dt);if(st.remote||!st.left)return;const list=spots(sim.world);
 for(const a of actors){
  if(!a||!(a.health>0))continue;let v=null;
  if(a.vehicleId){if(a.seat!==0||a.mode==='entering')continue;v=sim.vehicles.find(c=>c.id===a.vehicleId);if(!v||Math.abs(v.speed||0)<.4)continue;}
  else if(a.mode!=='onFoot'||a.physical||a.ragdoll&&a.ragdoll.active)continue;
  const reach=v?Math.hypot(v.width||2,v.length||4.5)/2+.8:1.3;
  for(let i=0;i<list.length;i++){
   if(st.broken[i])continue;const s=list[i],dx=s.x-(v?v.x:a.x),dz=s.z-(v?v.z:a.z);if(dx>reach||dx<-reach||dz>reach||dz<-reach)continue;
   const r=BALLS[0][0]*s.size;
   if(v){
    if(Math.abs((v.y||0)-s.y)>2.4)continue;const sin=Math.sin(v.yaw||0),cos=Math.cos(v.yaw||0),lx=dx*cos-dz*sin,lz=dx*sin+dz*cos;
    if(Math.abs(lx)>(v.width||2)/2+r*.8||Math.abs(lz)>(v.length||4.5)/2+r*.8)continue;
    const hit=i;as(a,()=>smash(sim,hit,'drive',{x:v.vx||sin,z:v.vz||cos}));
   }else{
    if(Math.abs(a.y-s.y)>1.5||dx*dx+dz*dz>(r+.34)*(r+.34))continue;
    const hit=i;as(a,()=>smash(sim,hit,'walk',{x:dx,z:dz}));
   }
  }
 }
}
/* what a late joiner needs: is it on, and which snowmen are gone */
function view(sim){const st=sim.xmas;return st?{on:st.on,gone:st.on?bitmap(sim):''}:{on:false,gone:''};}
/* A solo game: its list of broken snowmen lives in the save, for one Christmas season at a time. */
function solo(sim,on,season){
 const st=state(sim);st.solo=true;st.season=Number.isFinite(season)?season:0;st.room='solo-'+st.season;
 const kept=sim.profile&&sim.profile.seasonal&&sim.profile.seasonal.xmas;load(sim,kept&&kept.season===st.season?kept.broken:'');
 return setOn(sim,on);
}
/* The checks the placement tool and the tests run on the 250 places. */
function validate(world){
 const issues=[],list=spots(world);if(list.length!==COUNT)issues.push('There are '+list.length+' places, not '+COUNT+'.');
 for(const s of list){
  const land=world.terrainHeight(s.x,s.z),tag=s.id+' ('+s.x+', '+s.z+'): ';
  if(cover(world,s.x,s.z)<.95)issues.push(tag+'on or beside sand');
  if(Math.abs(s.y-land)>.45)issues.push(tag+'not on open ground');
  const water=world.waterHeight(s.x,s.z,0);if(Number.isFinite(water)&&water>s.y-.3)issues.push(tag+'in water');
  if(world.interiorAt(s.x,s.z,s.y+1))issues.push(tag+'inside a building');
  if(world.groundHeight(s.x,s.z,1e4)>s.y+1.9)issues.push(tag+'under a roof');
  if(!world.capsuleClear({x:s.x,y:s.y+.06,z:s.z},.62*s.size,1.8))issues.push(tag+'inside something solid');
  if(Math.hypot(s.x-TREE.x,s.z-TREE.z)<TREE.radius+2)issues.push(tag+'under the Christmas tree');
  const road=world.nearestRoad(s.x,s.z);if(road&&road.distance<road.road.width/2+.9)issues.push(tag+'on a road');
  for(const o of list)if(o.index>s.index&&Math.hypot(o.x-s.x,o.z-s.z)<9)issues.push(tag+'too close to '+o.id);
 }
 return issues;
}
return{TREE,COUNT,REWARD,GRIP,DEBRIS,BALLS,TOP,SPOTS,bare,cover,snowAt,spots,state,setOn,solo,bitmap,load,ray,smash,punch,step,surface,view,validate};
});
