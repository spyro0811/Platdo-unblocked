
/* PLATDO City visitors and street life (V7.7). Game only, single player.
 * - Trips for the guests of the restaurants: city-dining-play.js asks for one for every new party. By car: it drives
 *   in from out of sight, parks nose-in in a free bay of the place's own car park, and the party walks round to the
 *   door through the passage beside the building. When they leave they walk back and get in, and the car backs out
 *   onto Foundry Way and drives off. By bike: ridden in and left at the side of the car park. On foot: from 40 to 60
 *   metres along the front. Nobody appears at the door any more.
 * - Riders: bicycles, e-bikes, mopeds and motorbikes ridden along the streets near you.
 * - Traffic: the game made its traffic once, round the first home. Cars driven by the game's own traffic drivers are
 *   now kept round you wherever you go, and the ones left far behind are taken away.
 * The vehicles are the game's own. Trip and rider vehicles are moved by hand along the roads, like the DingDash
 * driver's; their ids start with 'visitor-' and any found in a loaded save are taken away. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),PI=Math.PI,d2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const LANE=3.6,ROAD=9,LOT=3.6,BACK=1.9,TRAFFIC=14,RIDERS=3,DRIVEN=6;
let serial=0,lastSim=null,clock=0,riderClock=3,trafficClock=2,tmp=null;const trips=new Set(),riders=[];
const Veh=()=>root.CityVehicles,look=()=>{const c=root.CityPeople?.catalog||[];return c[Math.floor(Math.random()*c.length)]||null;};
// ---- routes ------------------------------------------------------------------------------------------------------
function line(pts){const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+d2(pts[i],pts[i-1]));return{pts,cum,length:cum[cum.length-1],rev:0};}
// the right-hand lane: points k0 from the start and k1 from the end stay where they are
function lane(raw,k0=1,k1=1,off=LANE){return raw.map((p,i)=>{if(i<Math.max(1,k0)||i>raw.length-1-Math.max(1,k1))return{x:p.x,z:p.z};const a=raw[i-1],b=raw[i+1];let fx=b.x-a.x,fz=b.z-a.z;const L=Math.hypot(fx,fz)||1;fx/=L;fz/=L;return{x:p.x-fz*off,z:p.z+fx*off};});}
function at(r,s){s=clamp(s,0,r.length);let i=1;while(i<r.cum.length-1&&r.cum[i]<s)i++;const a=r.pts[i-1],b=r.pts[i],t=(s-r.cum[i-1])/Math.max(.001,r.cum[i]-r.cum[i-1]);return{x:mix(a.x,b.x,t),z:mix(a.z,b.z,t)};}
// where on the route and which way the vehicle faces; on the first rev metres it is backing (it faces the other way)
function pose(r,s){const p=at(r,s),rv=r.rev||0;let a,b;if(s<rv){a=at(r,Math.max(0,s-1.5));b=at(r,Math.min(rv,s+1.5));return{x:p.x,z:p.z,yaw:wrap(Math.atan2(b.x-a.x,b.z-a.z)+PI),back:true};}a=at(r,Math.max(rv,s-2.5));b=at(r,s+2.5);return{x:p.x,z:p.z,yaw:Math.atan2(b.x-a.x,b.z-a.z),back:false};}
function roads(sim,from,to){try{return(sim.world.route(from,to,'road')||[]).map(q=>({x:q.x,z:q.z}));}catch(e){return[];}}
function nearestRoad(w,p){let best=null;for(const r of w.roads||[]){if(!r.a||!r.b)continue;const dx=r.b.x-r.a.x,dz=r.b.z-r.a.z,L2=dx*dx+dz*dz;if(!L2)continue;const t=clamp(((p.x-r.a.x)*dx+(p.z-r.a.z)*dz)/L2,0,1),x=r.a.x+dx*t,z=r.a.z+dz*t,g=Math.hypot(p.x-x,p.z-z);if(!best||g<best.g){const L=Math.sqrt(L2);best={g,x,z,r,d:{x:dx/L,z:dz/L}};}}return best;}
// on screen? (the game's own camera)
function seen(x,y,z){const S=root.PlatdoCity?.scene,T=root.THREE;if(!S?.camera||!T)return false;tmp=tmp||new T.Vector3();tmp.set(x,y+1,z).project(S.camera);return tmp.z<1&&Math.abs(tmp.x)<1.15&&Math.abs(tmp.y)<1.15&&Math.hypot(x-S.camera.position.x,z-S.camera.position.z)<420;}
// a road corner min to max metres from a place, at least 90 m from you and not on screen
function farNode(sim,near,min,max,avoid){const p=sim.player,out=(sim.world.nodes||[]).filter(n=>{const a=d2(n,near),b=d2(n,p);return a>=min&&a<=max&&b>90&&!seen(n.x,n.y||3,n.z)&&(!avoid||avoid(n));});return out.length?out[Math.floor(Math.random()*out.length)]:null;}
// ---- vehicles moved by hand --------------------------------------------------------------------------------------
function spawnV(sim,id,type,q,face){let v=null;try{v=sim.spawnVehicle(type,id,{x:q.x,z:q.z,yaw:q.yaw},{});}catch(e){v=null;}if(!v)return null;Object.assign(v,{visitor:true,workshopControlled:true,traffic:false,engine:true});if(v.seatOccupants){v.seatOccupants[0]='ambient-driver:'+v.id;v.driverAppearance=face;}return v;}
function removeV(sim,id){const i=sim.vehicles.findIndex(v=>v.id===id);if(i>=0&&!sim.vehicles[i].seatOccupants?.includes('player'))sim.vehicles.splice(i,1);}
function move(sim,v,q,dt,moving){const w=sim.world,L=Math.max(1.4,(v.length||4)*.62),sy=Math.sin(q.yaw),cy=Math.cos(q.yaw),ref=(Number.isFinite(v.y)?v.y:0)+2.5,gh=(x,z)=>w.groundHeight(x,z,ref),hf=gh(q.x+sy*L/2,q.z+cy*L/2),hb=gh(q.x-sy*L/2,q.z-cy*L/2),dist=Math.hypot(q.x-v.x,q.z-v.z),turn=wrap(q.yaw-v.yaw);
 v.workshopControlled=true;v.vx=(q.x-v.x)/Math.max(dt,.001);v.vz=(q.z-v.z)/Math.max(dt,.001);v.speed=moving?dist/Math.max(dt,.001)*(q.back?-1:1):0;v.x=q.x;v.z=q.z;v.y=Math.max(gh(q.x,q.z),(hf+hb)/2);v.vy=0;v.yaw=q.yaw;v.pitch=Math.atan2(hf-hb,L);v.yawRate=turn/Math.max(dt,.001);
 const bike=Veh()?.byId?.[v.typeId]?.kind==='bike';v.roll=bike?clamp(v.yawRate*Math.abs(v.speed)/15,-.45,.45):0;v.steer=clamp(turn*6*(q.back?-1:1),-.5,.5);v.wheelSpin=(v.wheelSpin||0)+(moving?dist*(q.back?-1:1):0)/.34;
 if(v.visual){v.visual.wheelSpin=v.wheelSpin;v.visual.steer=v.steer;v.visual.reverse=!!q.back;v.visual.brake=!moving;}v.grounded=true;v.engine=true;v.throttle=moving?.4:0;if(v.bikeBalance){v.bikeBalance.frontContact=v.bikeBalance.rearContact=true;v.bikeBalance.relativePitch=0;}}
function blockedAhead(sim,v,q){const sgn=q.back?-1:1,sy=Math.sin(q.yaw)*sgn,cy=Math.cos(q.yaw)*sgn,reach=3.5+Math.abs(v.speed||0)*.8,half=(v.width||1.8)/2+.45,len=(v.length||4)/2;
 const ahead=(o,r)=>{const dx=o.x-v.x,dz=o.z-v.z,f=dx*sy+dz*cy,s=Math.abs(dx*cy-dz*sy);return f>len*.5&&f<len+reach&&s<half+r;};
 if(sim.vehicles.some(o=>o!==v&&Math.abs((o.y||0)-(v.y||0))<3&&ahead(o,.6)))return true;const pl=sim.player;if(pl&&pl.health>0&&!pl.vehicleId&&ahead(pl,.3))return true;return sim.npcs.some(n=>n.health>0&&!n.vehicleId&&ahead(n,.3));}
function drive(sim,o,dt,speedAt){let v=sim.vehicles.find(q=>q.id===o.id);const near=d2(sim.player,at(o.route,o.s))<230;
 if(!v&&near){v=spawnV(sim,o.id,o.type,pose(o.route,o.s),o.face);}
 if(!v){o.s=Math.min(o.route.length,o.s+speedAt(o.s)*dt);return null;}
 const q=pose(o.route,o.s);let go=!blockedAhead(sim,v,q);if(!go){o.hold=(o.hold||0)+dt;if(o.hold>8)go=true;}else o.hold=0;
 if(go)o.s=Math.min(o.route.length,o.s+speedAt(o.s)*dt);move(sim,v,pose(o.route,o.s),dt,go);return v;}
// ---- the guests' trips -----------------------------------------------------------------------------------------
function frontOf(svc){return{x:(svc.entrance||svc).x,z:svc.z+svc.d/2+1.4};}
// on foot between a vehicle in the car park behind a place and its front door: through the passage beside the building
function footPath(sim,svc,from,to){const front=svc.z+svc.d/2,back=svc.z-svc.d/2,pts=[{x:from.x,z:from.z}];
 if(from.z<back-.5){const row=(sim.world.services||[]).filter(q=>q!==svc&&q.w&&Math.abs(q.z-svc.z)<14),we=svc.x-svc.w/2,ee=svc.x+svc.w/2,west=Math.max(-1e9,...row.filter(q=>q.x<svc.x).map(q=>q.x+q.w/2)),east=Math.min(1e9,...row.filter(q=>q.x>svc.x).map(q=>q.x-q.w/2)),opts=[];
  if(we-west>=1.6)opts.push(we-Math.min((we-west)/2,2.5));if(east-ee>=1.6)opts.push(ee+Math.min((east-ee)/2,2.5));
  const gx=opts.sort((a,b)=>Math.abs(a-from.x)-Math.abs(b-from.x))[0]??(Math.abs(we-from.x)<Math.abs(ee-from.x)?we-1.2:ee+1.2);
  pts.push({x:gx,z:back-1.3},{x:gx,z:front+2.2});}
 pts.push({x:to.x,z:to.z});return pts;}
function pickType(kind){const D=(Veh()?.definitions||[]).filter(d=>d.category==='land'&&!d.premiumProduct);let pool;
 if(kind==='car')pool=D.filter(d=>d.kind==='car'&&!/police|sentinel|mercy|haul|truck|bus|limo/i.test(d.id+' '+(d.name||''))).map(d=>d.id);
 else pool=D.filter(d=>d.kind==='bike').map(d=>d.id);return pool.length?pool[Math.floor(Math.random()*pool.length)]:'pebble';}
// how busy the places are at this hour of the game's day: [seconds between parties, share of the tables taken]
function rush(sim){const h=(((sim?.dayTime||0)*24)%24+24)%24;if(h>=11&&h<14)return[rnd(7,16),.55];if(h>=17&&h<21)return[rnd(8,18),.55];if(h>=7&&h<11)return[rnd(14,30),.35];if(h>=14&&h<17)return[rnd(14,28),.35];if(h>=21&&h<23.5)return[rnd(18,36),.3];return[rnd(45,100),.15];}
function rnd(a,b){return a+Math.random()*(b-a);}
function plan(sim,svc,size){if(!sim||sim.onlineRoom||!svc)return null;const w=sim.world,lot=(w.parkingLots||[]).find(l=>l.place===svc.id),front=svc.z+svc.d/2,door=frontOf(svc),h=(((sim.dayTime||0)*24)%24+24)%24,r=Math.random();
 let kind=r<(h>=20||h<7?.7:.5)?'car':r<.68?'bike':'walk';if(size>1&&kind==='bike')kind='car';if(!lot)kind='walk';/* at most DRIVEN parties on wheels at a time near you (each vehicle costs drawing time); the rest walk */if([...trips].filter(t=>t.kind!=='walk'&&t.state!=='done').length>=DRIVEN)kind='walk';
 const o={id:'visitor-'+(++serial)+'-'+Math.floor(Math.random()*1e6).toString(36),svc,lot,kind,size,door,state:'go',s:0,t:0,touch:clock,face:look()};
 if(kind==='car'){const taken=new Set([...trips].filter(t=>t.lot===lot&&t.bay).map(t=>t.bayIndex));for(let i=1;i<lot.bays.length-1;i++){const b=lot.bays[i];if(taken.has(i)||sim.vehicles.some(v=>d2(v,b)<2.3))continue;o.bayIndex=i;o.bay={x:b.x,z:b.z};break;}if(!o.bay)o.kind='walk';}
 if(o.kind==='bike'){const taken=new Set([...trips].filter(t=>t.lot===lot&&t.spot).map(t=>t.spotIndex));for(let i=0;i<4;i++){const q={x:lot.x1-.7,z:lot.z0-(lot.dir||-1)*(1.6+i*1.05)};if(taken.has(i)||sim.vehicles.some(v=>d2(v,q)<1.2))continue;o.spotIndex=i;o.spot=q;break;}if(!o.spot)o.kind='walk';}
 if(o.kind!=='walk'&&!arrival(sim,o))o.kind='walk';
 if(o.kind==='walk'){const side=Math.random()<.5?-1:1;o.from={x:door.x+side*rnd(38,56),z:front+3.6};o.away={x:door.x-side*rnd(38,56),z:front+3.6};o.state='walk';}
 o.type=o.type||pickType(o.kind);trips.add(o);return o;}
function arrival(sim,o){const w=sim.world,dr=o.lot.dir||-1,goal=o.kind==='car'?o.bay:o.spot,edge={x:goal.x,z:o.lot.z0+dr*.6},J=nearestRoad(w,edge);if(!J||J.g>30)return false;const start=farNode(sim,edge,130,240);if(!start)return false;
 const nodes=roads(sim,{x:start.x,z:start.z},{x:J.x,z:J.z});if(!nodes.length)return false;if(nodes.length>1){const a=nodes[nodes.length-2],b=nodes[nodes.length-1];if(d2(a,J)<d2(a,b)&&d2(b,J)<d2(a,b))nodes.pop();}
 const tail=o.kind==='car'?[{x:J.x,z:J.z},edge,{x:goal.x,z:o.lot.z0-dr*1.6},goal]:[{x:J.x,z:J.z},edge,{x:goal.x,z:goal.z+dr*1.6},goal];
 const raw=[{x:start.x,z:start.z},...nodes,...tail].filter((p,i,a)=>!i||d2(p,a[i-1])>.6);o.route=line(lane(raw,1,tail.length));o.s=0;o.type=pickType(o.kind);return true;}
// leaving by car: back out of the bay onto the near lane of the street, ending up facing along it, then drive off
function departure(sim,o,v){const w=sim.world,b={x:v.x,z:v.z},lot=o.lot,dr=lot.dir||-1,edge={x:b.x,z:lot.z0+dr*.6},J=nearestRoad(w,edge);if(!J)return null;let d=J.d;if(-d.z*(edge.x-J.x)+d.x*(edge.z-J.z)<0)d={x:-d.x,z:-d.z};const rr={x:-d.z,z:d.x};
 const f={x:Math.sin(v.yaw||0),z:Math.cos(v.yaw||0)},bike=o.kind==='bike';let rev=[];
 if(bike){rev=[b,{x:b.x+.4,z:b.z+dr*1.2}];}else{const back=Math.max(2,Math.abs(b.z-(lot.z0-dr*1.2)));rev=[b,{x:b.x-f.x*back,z:b.z-f.z*back}];}
 const P1=rev[rev.length-1],base={x:J.x+rr.x*LANE,z:J.z+rr.z*LANE},u=(P1.x-base.x)*d.x+(P1.z-base.z)*d.z,C={x:base.x+d.x*u,z:base.z+d.z*u},E={x:C.x-d.x*4.5,z:C.z-d.z*4.5};
 let fwd;if(bike){fwd=[P1,{x:P1.x-d.x*1.5,z:lot.z0-dr*.4},{x:C.x+d.x*2,z:C.z+d.z*2}];}else{for(let i=1;i<=8;i++){const t=i/8,a=(1-t)*(1-t),m=2*t*(1-t),c=t*t;rev.push({x:a*P1.x+m*C.x+c*E.x,z:a*P1.z+m*C.z+c*E.z});}fwd=[E,{x:E.x+d.x*14,z:E.z+d.z*14}];}
 const goal=farNode(sim,fwd[fwd.length-1],170,280),more=goal?roads(sim,fwd[fwd.length-1],{x:goal.x,z:goal.z}):[];
 const fwdLane=[...fwd.map(p=>({x:p.x,z:p.z})),...lane([fwd[fwd.length-1],...more],1,0).slice(1)].filter((p,i,a)=>!i||d2(p,a[i-1])>.5),pts=[...rev,...fwdLane.slice(1)].filter((p,i,a)=>!i||d2(p,a[i-1])>.3);
 const r=line(pts);r.rev=bike?0:r.cum[Math.min(rev.length,pts.length)-1];return r;}
// what dining asks: is the party here yet, where does member k start and walk to the door, and the way home from it
function ready(o){if(!o)return true;o.touch=clock;return o.kind==='walk'||o.state==='parked'&&o.t>.7;}
function start(sim,o,k){o.touch=clock;if(o.kind==='walk'){const from={x:o.from.x+(k%2?.6:-.6)*(k>0),z:o.from.z+k*.7};return{x:from.x,z:from.z,yaw:Math.atan2(o.door.x-from.x,o.door.z-from.z),path:[from,{x:o.door.x,z:o.door.z}]};}
 /* beside the vehicle: the first on the driver's side, the second on the other, the rest behind them */const v=sim.vehicles.find(q=>q.id===o.id),c=v||(o.kind==='car'?o.bay:o.spot),yaw=v?.yaw||0,sy=Math.sin(yaw),cy=Math.cos(yaw),W=(v?.width||Veh()?.byId?.[o.type]?.width||1.8)/2+.55,r=(k%2?1:-1)*W,f=o.kind==='bike'?-.2:k>1?-1.1:.3,from={x:c.x+sy*f-cy*r,z:c.z+cy*f+sy*r};
 return{x:from.x,z:from.z,yaw:Math.atan2(o.door.x-from.x,o.door.z-from.z),path:footPath(sim,o.svc,from,o.door)};}
function homeward(sim,o,k){if(!o)return null;o.touch=clock;const v=o.kind!=='walk'&&sim.vehicles.find(q=>q.id===o.id),here=v&&!v.seatOccupants?.some(Boolean)&&d2(v,o.kind==='car'?o.bay:o.spot)<2.5;
 if(!here){if(o.kind!=='walk'){o.kind='walk';o.lost=true;const side=Math.random()<.5?-1:1;o.away={x:o.door.x+side*rnd(38,56),z:o.svc.z+o.svc.d/2+3.6};}return[{x:o.door.x,z:o.door.z},{x:o.away.x+(k%2?.6:-.6),z:o.away.z+k*.5}];}
 const s=start(sim,o,k);return footPath(sim,o.svc,s,o.door).reverse();}
// everyone is in (or gone): the vehicle leaves; a party on foot is just gone
function depart(sim,o){if(!o||o.state==='leave'||o.state==='done')return;if(o.kind==='walk'){o.state='done';trips.delete(o);return;}const v=sim.vehicles.find(q=>q.id===o.id);if(!v){o.state='done';trips.delete(o);return;}
 const r=departure(sim,o,v);if(!r){removeV(sim,o.id);o.state='done';trips.delete(o);return;}o.route=r;o.s=0;o.state='leave';o.t=0;if(v.seatOccupants){v.seatOccupants[0]='ambient-driver:'+v.id;v.driverAppearance=o.face;}v.workshopControlled=true;}
function stepTrips(sim,dt){for(const o of[...trips]){o.t+=dt;if(o.purpose==='park')o.touch=clock;
  if(o.state==='go'){const v=drive(sim,o,dt,s=>s>o.route.length-24?LOT:ROAD);if(o.s>=o.route.length-.05){if(o.purpose==='park'){parkUp(sim,o,v);continue;}o.state='parked';o.t=0;if(v){v.engine=false;v.workshopControlled=false;v.speed=0;v.vx=v.vz=0;v.throttle=0;if(v.seatOccupants)v.seatOccupants[0]=null;v.driverAppearance=null;if(v.visual)v.visual.brake=true;}}}
  else if(o.state==='leave'){const v=drive(sim,o,dt,s=>s<o.route.rev?BACK:s<o.route.rev+18?LOT+1:ROAD);if(o.s>=o.route.length-.05||(!v&&o.s>o.route.rev+30)||(v&&d2(v,sim.player)>250&&!seen(v.x,v.y,v.z))){removeV(sim,o.id);o.state='done';trips.delete(o);}}
  /* a party that the restaurant no longer looks after (you went away): the car leaves without them */
  if((o.state==='parked'||o.state==='go')&&clock-o.touch>10){if(o.state==='go'){removeV(sim,o.id);o.state='done';trips.delete(o);}else depart(sim,o);}
  if(o.state==='walk'&&clock-o.touch>10){o.state='done';trips.delete(o);}}}
// ---- riders ------------------------------------------------------------------------------------------------------
function riderTypes(){return(Veh()?.definitions||[]).filter(d=>d.category==='land'&&d.kind==='bike'&&!d.premiumProduct);}
function spawnRider(sim){const p=sim.player,a=farNode(sim,p,110,190);if(!a)return;const b=farNode(sim,p,110,210,n=>(n.x-p.x)*(a.x-p.x)+(n.z-p.z)*(a.z-p.z)<0);if(!b)return;
 const nodes=roads(sim,{x:a.x,z:a.z},{x:b.x,z:b.z});if(nodes.length<2)return;const D=riderTypes();if(!D.length)return;const d=D[Math.floor(Math.random()*D.length)];
 const speed=d.pedalOnly?rnd(4.5,6):d.electric?rnd(6,8):/moto|cruiser|sport|dirt|mx/i.test(d.id+' '+(d.name||''))?rnd(9,12):rnd(7,9);
 riders.push({id:'visitor-rider-'+(++serial)+'-'+Math.floor(Math.random()*1e6).toString(36),type:d.id,face:look(),route:line(lane([{x:a.x,z:a.z},...nodes,{x:b.x,z:b.z}],0,0,LANE+1)),s:0,speed});}
function stepRiders(sim,dt){riderClock-=dt;if(riderClock<=0){riderClock=rnd(2,5);if(riders.length<RIDERS&&!sim.world.interiorAt?.(sim.player.x,sim.player.z,(sim.player.y||0)+1))spawnRider(sim);}
 for(const r of[...riders]){/* V8.9: a rider knocked off leaves the bike lying where it fell; it is cleared once you are far away */if(!r.crashed){const cur=sim.vehicles.find(q=>q.id===r.id);if(cur?.bikeFallen){r.crashed=true;cur.workshopControlled=false;}}if(r.crashed){const cur=sim.vehicles.find(q=>q.id===r.id);if(!cur||d2(cur,sim.player)>260){removeV(sim,r.id);riders.splice(riders.indexOf(r),1);}continue;}const v=drive(sim,r,dt,()=>r.speed);if(r.s>=r.route.length-.05||(v&&d2(v,sim.player)>260)||(!v&&d2(at(r.route,r.s),sim.player)>260)){removeV(sim,r.id);riders.splice(riders.indexOf(r),1);}}}
// ---- V12.9: a car park space left empty when you took the car parked in it: a while later a car is driven in and ---
// parked there, and its driver gets out and walks off (nothing appears in a space by itself any more). At most two at
// a time, only for spaces 25 to 220 m from you, a car of any kind.
let parkClock=6,parkWhy='';
function stepParkers(sim,dt){parkClock-=dt;if(parkClock>0)return;parkClock=rnd(4,7);const vac=sim.parkedLot&&sim.parkedLot.vacated;if(!vac||!root.CityParking){parkWhy='nothing vacated';return;}if([...trips].filter(t=>t.purpose==='park').length>=2)return;const p=sim.player,lots=sim.world.parkingLots||[];
 for(const s of root.CityParking.spots()){if(!vac[s.id]||sim.time-vac[s.id]<12||s.gap)continue;const dd=d2(p,s);if(dd<25||dd>220)continue;if(sim.vehicles.some(v=>d2(v,s)<(v.width||1.8)/2+1)||[...trips].some(t=>t.bay&&d2(t.bay,s)<1))continue;const lot=lots.find(l=>l.bays.some(b=>d2(b,s)<.8));if(!lot)continue;const bayIndex=lot.bays.findIndex(b=>d2(b,s)<.8);
  const o={id:'visitor-park-'+(++serial)+'-'+Math.floor(Math.random()*1e6).toString(36),purpose:'park',spotId:s.id,lot,kind:'car',bay:{x:lot.bays[bayIndex].x,z:lot.bays[bayIndex].z},bayIndex,size:1,state:'go',s:0,t:0,touch:clock,face:look()};
  if(!arrival(sim,o)){parkWhy='no way in for '+s.id;continue;}parkWhy='driving to '+s.id;trips.add(o);return;}}
/* parked: the visitor car is swapped for an ordinary parked car in the same place (same kind and colour), and the driver gets out and walks off */
function parkUp(sim,o,v){const b=o.bay,yaw=v?v.yaw:((o.lot.dir||-1)>0?PI:0),pos=v?{x:v.x,z:v.z}:{x:b.x,z:b.z},type=v?v.typeId:o.type,paint=v?.customization;if(v)removeV(sim,o.id);
 let car=null;try{car=sim.spawnVehicle(type,sim.uid('parked'),{x:pos.x,z:pos.z,yaw},{});}catch(e){car=null;}
 if(car){Object.assign(car,{parkedCar:true,engine:false,traffic:false});if(paint)car.customization={...paint};
  try{const door=Veh()?.boardingEntry?.(car,0,{x:pos.x,y:car.y,z:pos.z});if(door&&o.face)sim.spawnNPC({id:sim.uid('citizen'),x:door.x,y:door.y??car.y,z:door.z,yaw:yaw+PI/2,appearance:o.face,mode:'walk'});}catch(e){}}
 o.state='done';trips.delete(o);}
// ---- traffic kept round you ----------------------------------------------------------------------------------------
function stepTraffic(sim,dt){trafficClock-=dt;if(trafficClock>0)return;trafficClock=1.4;const p=sim.player,V=Veh();if(!V||sim.profile?.mode==='story')return;
 const cars=sim.vehicles.filter(v=>v.traffic&&!v.visitor&&String(v.id).startsWith('traffic')&&!v.police&&!v.mission);
 for(const v of cars){if(d2(v,p)>360&&!v.seatOccupants?.includes('player')&&!seen(v.x,v.y,v.z)){const i=sim.vehicles.indexOf(v);if(i>=0)sim.vehicles.splice(i,1);}}
 /* V14.2: as many as the traffic density setting asks for */if(cars.filter(v=>d2(v,p)<270).length>=Math.round(TRAFFIC*(sim.trafficScale??1)))return;const n=farNode(sim,p,150,250);if(!n)return;const q={x:n.x+3,y:n.y,z:n.z+3};if(sim.vehicleClear&&!sim.vehicleClear(q,2.5))return;
 const defs=V.definitions.filter(d=>d.category==='land'&&d.kind!=='bike'&&!d.premiumProduct&&!['sentinel','mercy'].includes(d.id));if(!defs.length)return;const d=defs[Math.floor(Math.random()*defs.length)];
 let v=null;try{v=sim.spawnVehicle(d.id,sim.uid('traffic'),q,{traffic:true});}catch(e){v=null;}if(!v)return;v.ai={path:[],index:0,timer:Math.random(),node:n.id};v.driverAppearance=v.driverAppearance||look();/* V8.6: and the driver in the seat */if(!v.seatOccupants[0])v.seatOccupants[0]='ambient-driver:'+v.id;}
// ---- each step -----------------------------------------------------------------------------------------------------
function step(sim,dt){if(!sim||sim.onlineRoom||!(dt>0)||typeof document==='undefined')return;
 if(sim!==lastSim){lastSim=sim;trips.clear();riders.length=0;for(let i=sim.vehicles.length-1;i>=0;i--){const v=sim.vehicles[i];if((v.visitor||String(v.id).startsWith('visitor-'))&&!v.seatOccupants?.includes('player'))sim.vehicles.splice(i,1);}}
 clock+=dt;if(sim.profile?.mode==='story')return;stepTrips(sim,dt);stepRiders(sim,dt);stepTraffic(sim,dt);/* V12.9 */stepParkers(sim,dt);}
function keep(o){if(o)o.touch=clock;}
// a party already at its table when you arrived leaves on foot
function walker(sim,svc){if(!sim||!svc)return null;const door=frontOf(svc),front=svc.z+svc.d/2,side=Math.random()<.5?-1:1,o={id:'visitor-walk-'+(++serial),svc,kind:'walk',size:1,door,state:'walk',s:0,t:0,touch:clock,from:{x:door.x+side*rnd(38,56),z:front+3.6},away:{x:door.x-side*rnd(38,56),z:front+3.6}};trips.add(o);return o;}
root.CityVisitors={plan,ready,start,homeward,depart,rush,step,keep,walker,diagnostics:()=>({trips:[...trips].map(o=>({id:o.id,kind:o.kind,state:o.state,place:o.svc?.id,s:Math.round(o.s||0),length:Math.round(o.route?.length||0)})),riders:riders.map(r=>({id:r.id,type:r.type,s:Math.round(r.s),length:Math.round(r.route.length)})),parking:parkWhy})};
})(typeof window!=='undefined'?window:globalThis);
