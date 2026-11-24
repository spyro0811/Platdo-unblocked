
/* PLATDO City personal hangars and their runway (V13.2). The same file in the game and on the multiplayer host
 * (server/platdo-city/src/hangars.js).
 * - Where: the open grass in the south-west of the map, below Verdant Range and left of Redbrick Heights, by the small
 *   inlet. From west to east: one shared runway (18/36, 720 m by 36 m, running north-south along the coast), a parallel
 *   taxiway joined to the runway at both ends and in the middle (each joint with a holding line), the apron, one row of
 *   hangars facing the runway, and behind them the service road the delivery trucks use (joined to the city by Airfield
 *   Road, which continues Exchange Avenue west; Skyward Aviation stands on it).
 * - How many: exactly as many hangars as players a room can hold (the host's own setting; 8 when playing alone). Room for
 *   30 is laid out; only the first N stand (are drawn and solid). They are there whether or not anyone is playing.
 * - Each hangar fits the biggest plane (Atlas Prop: 16.2 m wingspan, 12.5 m long, 3.6 m high) with room round it: 20 m
 *   wide inside, 25 m deep, 7.2 m high; a roller door at the front (19 m by 5.8 m) for flying out and in, and one at the
 *   back the same size that the delivery truck backs a plane through. A door that is shut is solid; it rolls up only
 *   for the hangar's own player (and for the truck delivering to them), and never comes down on anyone or anything.
 * - Every player in a room has their own hangar for as long as they are in it (the lowest free number); it is freed
 *   when they leave. Planes belong to the player, not to the hangar: a player's planes come out in whatever hangar they
 *   have in that room. Plaques read "HANGAR 03 - NAME" or "HANGAR 03 - AVAILABLE". */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityHangars=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const MAX=30,DEFAULT=8;
const RWY={x:-965,z0:70,z1:790,width:36,name:'18/36'};
const TWY={x:-918,width:18,z0:84,z1:776};
const LINKS=[88,430,772];
const APRON={x0:-909,x1:-861};
const HG={front:-861,back:-835,wall:.4,inW:20,depth:26,h:7.2,doorW:19,doorH:5.8,pitch:22,z0:100};
const SVC={x:-823,width:24,z0:90,z1:770,junction:345,lane:-815};
const ROAD={name:'Airfield Road',z:345,x0:-823,x1:-620,width:14};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const center=i=>HG.z0+(i-1)*HG.pitch+HG.pitch/2;
const midX=(HG.front+HG.back)/2;
/* the marked parking place inside (nose to the front door), the two doors, and where the delivery truck lines up */
function spot(i){return{x:-853,z:center(i),yaw:-Math.PI/2};}
function frontDoor(i){return{x:HG.front,z:center(i)};}
function rearDoor(i){return{x:HG.back,z:center(i)};}
function pad(i){return String(i).padStart(2,'0');}
function label(world,i){const s=world?.hangarSet,name=s?.names?.[i];return'HANGAR '+pad(i)+' — '+(name?String(name).toUpperCase().slice(0,24):'AVAILABLE');}
// ---- the world -------------------------------------------------------------------------------------------------------
function roads(road){/* V13.9: a point where Motor Row (dealers.js CITY_ROW) joins it */const zr=root.CityDealers?.CITY_ROW?.z,svc=[[SVC.x,SVC.z0],[SVC.x,SVC.junction]];if(zr>SVC.junction&&zr<SVC.z1)svc.push([SVC.x,zr]);svc.push([SVC.x,SVC.z1]);road('Hangar Service Road',svc,SVC.width,8,'ground','service');road(ROAD.name,[[ROAD.x1,ROAD.z],[ROAD.x0,ROAD.z]],ROAD.width,11,'ground','street');}
/* every hangar's walls, floor, roof and doors as solid boxes (the ones past the room's number switched off); nothing that
 * stood in the field before is left on the runway, apron, hangars or roads */
function install(world,api){const {box,removeBox,terrainHeight}=api;
 const clear=(x0,x1,z0,z1)=>{for(let k=world.props.length-1;k>=0;k--){const p=world.props[k];if(p.x<x0||p.x>x1||p.z<z0||p.z>z1)continue;for(const c of world.colliders.filter(c=>c.id===p.id||(p.collisionIds||[]).includes(c.id)||String(c.id).startsWith(p.id+':')))removeBox?.(c);world.props.splice(k,1);}};
 clear(RWY.x-RWY.width/2-8,SVC.x+SVC.width/2+2,RWY.z0-10,RWY.z1+6);
 world.hangars=[];world.hangarSet={count:DEFAULT,slots:new Array(MAX+1).fill(null),names:new Array(MAX+1).fill(null),doors:[]};
 const g=terrainHeight(midX,center(1)),W=HG.wall,y0=g;
 for(let i=1;i<=MAX;i++){const c=center(i),id='hangar-'+pad(i),list=[],B=(k,x,y,z,w,h,d,mat,extra={})=>{const b=box(id+':'+k,x,y,z,w,h,d,mat,{hangar:i,...extra});list.push(b);return b;};
  const zl=c-HG.inW/2-W/2,zr=c+HG.inW/2+W/2,dw=HG.doorW,dh=HG.doorH,jamb=(HG.inW-dw)/2;
  B('floor',midX,y0,c,HG.depth,.02,HG.inW+2*W,'concrete',{floor:true});
  B('wall-l',midX,y0+.02,zl,HG.depth,HG.h-.02,W,'metal');B('wall-r',midX,y0+.02,zr,HG.depth,HG.h-.02,W,'metal');
  for(const [side,x] of [['front',HG.front+W/2],['rear',HG.back-W/2]]){
   B(side+'-jamb-l',x,y0+.02,c-dw/2-jamb/2,W,HG.h-.02,jamb,'metal');B(side+'-jamb-r',x,y0+.02,c+dw/2+jamb/2,W,HG.h-.02,jamb,'metal');
   B(side+'-lintel',x,y0+dh,c,W,HG.h-dh,dw,'metal');
   const door=B(side+'-door',x,y0+.02,c,.3,dh-.02,dw,'metal',{hangarDoor:side});door.closedMinY=door.minY;}
  B('roof',midX,y0+HG.h,c,HG.depth+.6,.3,HG.inW+2*W+.6,'metal',{roof:true});
  world.hangars.push({i,id,c,y:y0,boxes:list,front:list.find(b=>b.hangarDoor==='front'),rear:list.find(b=>b.hangarDoor==='rear')});
  world.hangarSet.doors[i]={front:0,rear:0};}
 setCount(world,DEFAULT);
 return world.hangars;}
/* how many hangars stand: the room's number of players (the rest are switched off and not drawn) */
function setCount(world,n){const s=world.hangarSet;if(!s)return 0;const k=clamp(Math.round(n)||DEFAULT,1,MAX);s.count=k;for(const h of world.hangars||[])for(const b of h.boxes)b.enabled=h.i<=k;for(let i=k+1;i<=MAX;i++){if(s.slots[i]){s.slots[i]=null;s.names[i]=null;}}return k;}
function count(world){return world?.hangarSet?.count||0;}
// ---- whose hangar is whose ---------------------------------------------------------------------------------------------
/* a player's hangar for as long as they are in the room: the one they have, or the lowest free number */
function assign(world,key,name){const s=world?.hangarSet;if(!s||!key)return 0;let i=s.slots.indexOf(key);if(i<1){i=0;for(let k=1;k<=s.count;k++)if(!s.slots[k]){i=k;break;}if(!i)return 0;s.slots[i]=key;}s.names[i]=String(name||'Player').slice(0,24);return i;}
function release(world,key){const s=world?.hangarSet;if(!s)return;const i=s.slots.indexOf(key);if(i>0){s.slots[i]=null;s.names[i]=null;}}
function slotOf(world,key){const s=world?.hangarSet;if(!s||!key)return 0;const i=s.slots.indexOf(key);return i>0&&i<=s.count?i:0;}
function ownerOf(world,i){return world?.hangarSet?.slots?.[i]||null;}
// ---- the doors -------------------------------------------------------------------------------------------------------------
/* actors: [{key, actor}] (the players in the room). A front door rolls up for its player (on foot or in a vehicle) near
 * the front; a back door for its player on foot at the back, and for the delivery truck bringing them a plane. A door
 * comes down only when nothing stands in its opening. Its solid box rolls up with it. */
const SPEED=.32;
function stepDoors(sim,dt,actors){const w=sim.world,s=w.hangarSet;if(!s)return;const byKey=new Map((actors||[]).map(a=>[a.key,a.actor]));
 const jobs=(sim.fleet?.jobs||[]).filter(j=>!j.finished&&j.dest?.kind==='hangar');
 for(const h of w.hangars||[]){if(h.i>s.count)continue;const d=s.doors[h.i],key=s.slots[h.i],me=key?byKey.get(key):null;
  const near=(p,x,z,r)=>p&&p.health>0&&Math.hypot(p.x-x,p.z-z)<r&&Math.abs((p.y||0)-h.y)<8;
  let front=near(me,HG.front,h.c,30)||near(me,midX,h.c,13),rear=me&&!me.vehicleId&&near(me,HG.back+2,h.c,9);
  for(const j of jobs){if(j.dest.hangar!==h.i)continue;const t=sim.fleet.teams.find(q=>q.id===j.team),v=t&&sim.vehicles.find(q=>q.id===t.vid);if(v&&Math.hypot(v.x-HG.back,v.z-h.c)<48)rear=true;}
  for(const [side,want] of [['front',front],['rear',rear]]){const x=side==='front'?HG.front:HG.back;let target=want?1:0;
   if(!want&&d[side]>0&&blocked(sim,x,h))target=d[side];
   d[side]=target>d[side]?Math.min(target,d[side]+SPEED*dt):Math.max(target,d[side]-SPEED*dt*1.4);
   applyDoor(h,side,d[side]);}}}
function applyDoor(h,side,f){const b=h[side];if(!b)return;b.minY=b.closedMinY+clamp(f,0,1)*(HG.doorH-.1);}
/* anyone or anything in the door's opening (a band either side of it, across its width) */
function blocked(sim,x,h){const inBand=(px,pz,r=0)=>Math.abs(px-x)<1.8+r&&Math.abs(pz-h.c)<HG.doorW/2+r;
 for(const v of sim.vehicles||[]){if(Math.abs((v.y||0)-h.y)>HG.doorH)continue;const half=Math.max(v.width||2,v.length||4)/2;if(inBand(v.x,v.z,half))return true;}
 for(const p of [sim.player,...(sim.npcs||[]),...(sim.sessionPeers||[]),...(sim.fleetPeople||[])])if(p&&p.health>0&&inBand(p.x,p.z,.4)&&Math.abs((p.y||0)-h.y)<HG.doorH)return true;return false;}
// ---- online: what the host tells each page -------------------------------------------------------------------------------
function view(world){const s=world?.hangarSet;if(!s)return null;const out={n:s.count,names:[],doors:[]};for(let i=1;i<=s.count;i++){out.names.push(s.names[i]||null);const d=s.doors[i]||{front:0,rear:0};out.doors.push([Math.round(d.front*20)/20,Math.round(d.rear*20)/20]);}return out;}
function applyView(world,v,mine){const s=world?.hangarSet;if(!s||!v)return;if(v.n!==s.count)setCount(world,v.n);for(let i=1;i<=s.count;i++){s.names[i]=v.names?.[i-1]||null;s.slots[i]=s.names[i]?(mine&&mine.index===i?mine.key:'remote-'+i):null;const d=v.doors?.[i-1]||[0,0];s.doors[i]={front:d[0],rear:d[1]};const h=world.hangars[i-1];if(h){applyDoor(h,'front',d[0]);applyDoor(h,'rear',d[1]);}}}
/* single player: the player has hangar 1 */
function stepSolo(sim,dt){const w=sim.world;if(!w?.hangarSet||sim.onlineRoom)return;if(!slotOf(w,'player'))assign(w,'player',sim.profile?.displayName||'Player');stepDoors(sim,dt,[{key:'player',actor:sim.player}]);}
return{MAX,DEFAULT,RWY,TWY,LINKS,APRON,HG,SVC,ROAD,center,midX,spot,frontDoor,rearDoor,pad,label,roads,install,setCount,count,assign,release,slotOf,ownerOf,stepDoors,applyDoor,view,applyView,stepSolo};
});
