
/* PLATDO City dealership deliveries (V13.1). The same file in the game and on the multiplayer host
 * (server/platdo-city/src/dealer-fleet.js): in single player the game runs it, online only the host does and every
 * player sees the same trucks, drivers and cargo through the normal world updates.
 * - Every shop keeps one delivery team per player a room can hold (the host's own setting; 8 in single player): a truck
 *   (Metro Motors and Apex Exotics: a Workhorse pickup with a car trailer; Volt & Velocity: a Haul box truck; Harborline
 *   Marina: a Workhorse pickup with a boat trailer) parked in its own marked space, and a driver who waits by the
 *   drivers' hut. Trucks and drivers are always there; they leave for a job and come back.
 * - A purchase (dealers.js buy) marks the vehicle "awaiting delivery" in the buyer's garage. One delivery per player is
 *   underway at a time; the rest wait in the order they were bought, across all shops. The shop's free team takes it.
 * - A job goes through five phases, each started once: out (the driver walks to the truck and brings it to the loading
 *   place), loading (the vehicle is put on and strapped down), transport (real roads to the buyer's home), unloading
 *   (straps off, the vehicle into its parking space, the buyer told) and return (back into its own space, the driver
 *   back to the hut). Boats go from the yard to the launch ramp, are floated off and moored at a free berth.
 * - Everything moves by hand along worked-out paths (like the DingDash couriers): no physics, nothing can push a truck
 *   off its way. Trucks stop for people and vehicles in the way and pull round ones that do not move.
 * - Drivers, trucks and trailers can never be hurt or taken; the vehicle being delivered is protected until it is
 *   parked at the buyer's home, then it is an ordinary vehicle of theirs.
 * - The trailers are drawn by city-dealers-look.js from view(); they are not vehicles. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityDealerFleet=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const need=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
const Dl=()=>need('CityDealers','./dealers.js'),Vh=()=>need('CityVehicles','./vehicles.js');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),wrap=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;},dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const LANE=3.6,ROAD=12,YARD=3.6,BACK=1.6,WALK=1.55,CARGO=1.7,STRAP=1.1;
const NAMES=['Rico','Dana','Marcus','Priya','Theo','Ines','Jamal','Wren','Hugo','Lena','Omar','Sasha','Felix','Nora','Cole','Mae','Ravi','Tess','Abel','Yuki','Bram','Cleo','Duncan','Elsa','Gus','Hana','Ivo','June','Kofi','Lulu'];
// ---- paths ------------------------------------------------------------------------------------------------------------
/* a path is a line of points; a place on it is a distance s from its start. Before the start and after the end it goes
 * on straight, so a trailer behind a truck that has just set off is still on it. */
function mk(points){const pts=[];for(const p of points){if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z))continue;if(pts.length&&dist(p,pts[pts.length-1])<.05)continue;pts.push({x:p.x,z:p.z});}if(pts.length<2)pts.push({x:pts[0].x,z:pts[0].z+.1});const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+dist(pts[i],pts[i-1]));return{pts,cum,length:cum[cum.length-1]};}
function at(path,s){const P=path.pts,C=path.cum,n=P.length;if(s<=0){const a=P[0],b=P[1],L=C[1]||1;return{x:a.x+(b.x-a.x)/L*s,z:a.z+(b.z-a.z)/L*s};}if(s>=path.length){const a=P[n-2],b=P[n-1],L=(C[n-1]-C[n-2])||1,e=s-path.length;return{x:b.x+(b.x-a.x)/L*e,z:b.z+(b.z-a.z)/L*e};}let lo=1,hi=n-1;while(lo<hi){const m=(lo+hi)>>1;if(C[m]<s)lo=m+1;else hi=m;}const a=P[lo-1],b=P[lo],t=(s-C[lo-1])/Math.max(1e-6,C[lo]-C[lo-1]);return{x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};}
function heading(path,s){const a=at(path,s-1.2),b=at(path,s+1.2);return Math.atan2(b.x-a.x,b.z-a.z);}
/* the road's right-hand lane: every corner moved LANE metres to the right of the way it is driven (the first k0 and the
 * last k1 points stay where they are) */
function lay(raw,k0=1,k1=0,off=LANE){const n=raw.length;return raw.map((p,i)=>{if(i<k0||i>=n-k1)return{x:p.x,z:p.z};const a=raw[Math.max(0,i-1)],b=raw[Math.min(n-1,i+1)];let fx=b.x-a.x,fz=b.z-a.z;const L=Math.hypot(fx,fz)||1;fx/=L;fz/=L;
 /* at a corner the point goes out along the bisector so both lanes keep their width */const pa=raw[Math.max(0,i-1)],pb=raw[Math.min(n-1,i+1)];let k=off;if(i>0&&i<n-1){const ux=p.x-pa.x,uz=p.z-pa.z,vx=pb.x-p.x,vz=pb.z-p.z,lu=Math.hypot(ux,uz)||1,lv=Math.hypot(vx,vz)||1,c=(ux*vx+uz*vz)/(lu*lv);k=off/Math.max(.45,Math.sqrt((1+c)/2));}
 return{x:p.x-fz*k,z:p.z+fx*k};});}
/* corners become arcs of radius up to R (shorter where the legs are short), points every metre and a half */
function round(pts,R){if(pts.length<3)return pts.slice();const out=[pts[0]];for(let i=1;i<pts.length-1;i++){const A=out[out.length-1],B=pts[i],C=pts[i+1],ux=B.x-A.x,uz=B.z-A.z,vx=C.x-B.x,vz=C.z-B.z,lu=Math.hypot(ux,uz),lv=Math.hypot(vx,vz);if(lu<.2||lv<.2){out.push(B);continue;}
 const ax=ux/lu,az=uz/lu,bx=vx/lv,bz=vz/lv,dot=clamp(ax*bx+az*bz,-1,1),turn=Math.acos(dot);if(turn<.08||turn>3.0){out.push(B);continue;}
 const t=Math.min(R*Math.tan(turn/2),lu*.48,lv*.48),r=t/Math.tan(turn/2),P={x:B.x-ax*t,z:B.z-az*t},Q={x:B.x+bx*t,z:B.z+bz*t};
 /* the centre: from P, r along the part of the new direction square to the old one (the inside of the turn) */let nx=bx-ax*dot,nz=bz-az*dot;const nl=Math.hypot(nx,nz)||1;nx/=nl;nz/=nl;const cx=P.x+nx*r,cz=P.z+nz*r;
 const a0=Math.atan2(P.z-cz,P.x-cx),a1=Math.atan2(Q.z-cz,Q.x-cx),da=wrap(a1-a0),steps=Math.max(2,Math.ceil(Math.abs(da)*r/1.5));for(let k=0;k<=steps;k++){const a=a0+da*k/steps;out.push({x:cx+Math.cos(a)*r,z:cz+Math.sin(a)*r});}}
 out.push(pts[pts.length-1]);return out;}
/* an arc from point p at heading h0 (forward is (sin h, cos h)), the heading changing by `by` radians - more heading is a
 * turn to the left as driven - on a circle of radius r */
function arcFrom(p,h0,by,r){const out=[],s=Math.sign(by)||1,steps=Math.max(3,Math.ceil(Math.abs(by)*r/1.2)),right=h=>({x:-Math.cos(h),z:Math.sin(h)}),R0=right(h0),cx=p.x-R0.x*r*s,cz=p.z-R0.z*r*s;
 for(let k=1;k<=steps;k++){const q=right(h0+by*k/steps);out.push({x:cx+q.x*r*s,z:cz+q.z*r*s});}return out;}function line(a,b,step=2){const out=[],n=Math.max(1,Math.ceil(dist(a,b)/step));for(let k=1;k<=n;k++)out.push({x:a.x+(b.x-a.x)*k/n,z:a.z+(b.z-a.z)*k/n});return out;}
// ---- the rigs -----------------------------------------------------------------------------------------------------------
function rig(shop){const T=Vh().byId[shop.tractor].dimensions,tr=shop.carrier==='box'?null:Dl().TRAILERS[shop.carrier]||Dl().TRAILERS.car;return{tl:T.length,tw:T.width,trailer:tr,front:tr?T.length/2+tr.hitch:0,back:tr?T.length/2+tr.hitch+tr.length:T.length/2,deck:tr?tr.deck:.96,len:tr?tr.length:0,wid:tr?tr.width:T.width,ramp:2.2,gate:2.1566};}
/* the truck, and its trailer with both ends on the path (forward: behind the truck; reversing: ahead of it in the way it moves) */
/* a.off: a stretch where the rig drives beside its lane (to pull round something standing in it), eased in and out */
const smooth=t=>t*t*(3-2*t);
function offAt(a,s){const o=a&&a.off;if(!o||s<=o.s0||s>=o.s3)return 0;if(s<o.s1)return o.amt*smooth((s-o.s0)/(o.s1-o.s0));if(s<=o.s2)return o.amt;return o.amt*smooth(1-(s-o.s2)/(o.s3-o.s2));}
function ptAt(a,s){const p=at(a.path,s),k=offAt(a,s);if(!k)return p;const h=heading(a.path,s);return{x:p.x+Math.cos(h)*k,z:p.z-Math.sin(h)*k};}
function rigPose(sim,team,a,s,reverse){const R=team.rig,p=ptAt(a,s),q0=ptAt(a,s-1.2),q1=ptAt(a,s+1.2),h=Math.atan2(q1.x-q0.x,q1.z-q0.z),yaw=reverse?wrap(h+Math.PI):h,out={x:p.x,z:p.z,yaw};
 if(R.trailer){const k=reverse?1:-1,f=ptAt(a,s+k*R.front),b=ptAt(a,s+k*R.back);out.trailer={x:(f.x+b.x)/2,z:(f.z+b.z)/2,yaw:Math.atan2(f.x-b.x,f.z-b.z),f,b};}return out;}
// ---- the state --------------------------------------------------------------------------------------------------------------
function fleetOf(sim){return sim.fleet||null;}
function teamCount(n){const D=Dl();return clamp(Math.round(n)||D.FLEET_DEFAULT,1,D.FLEET_MAX);}
/* builds every team once: the truck in its space (a real vehicle, parked, engine off), the driver by the hut */
function init(sim,n){
 if(sim.fleet)return sim.fleet;const D=Dl(),count=teamCount(n),cat=root.CityPeople?.catalog||need('CityPeople','./people.js')?.catalog||[];
 const F=sim.fleet={n:count,teams:[],jobs:[],reserved:{},seq:0,time:0,lastTeam:{},notices:[]};
 for(const shop of D.SHOPS){const L=D.layout(shop),R=rig(shop);
  for(let i=0;i<count;i++){const id='fleet-'+shop.key+'-'+i,slot=L.slot(i),look=hash(id)%Math.max(1,cat.length),name=NAMES[hash(id+'n')%NAMES.length];
   const team={id,shop:shop.id,key:shop.key,i,rig:R,slot,vid:id,did:id+'-d',look,name,job:null,lounge:L.lounge(i)};
   /* idle: the trailer stands behind the truck (the marina's boat trailers 2 m behind it, unhitched) */
   const gap=shop.carrier==='boat'?2:0;team.trailer=R.trailer?parkedTrailer(slot,R,gap):null;team.hitched=shop.carrier!=='boat';team.gap=gap;
   F.teams.push(team);park(sim,team);}}
 return F;}
function parkedTrailer(slot,R,gap){const sy=Math.sin(slot.yaw),cy=Math.cos(slot.yaw),f=R.front+gap,b=R.back+gap;return{x:slot.x-sy*(f+b)/2,z:slot.z-cy*(f+b)/2,yaw:slot.yaw,f:{x:slot.x-sy*f,z:slot.z-cy*f},b:{x:slot.x-sy*b,z:slot.z-cy*b}};}
function truckOf(sim,team){let v=sim.vehicles.find(q=>q.id===team.vid);if(v)return v;const shop=Dl().shop(team.shop);
 try{v=sim.spawnVehicle(shop.tractor,team.vid,{x:team.slot.x,z:team.slot.z,yaw:team.slot.yaw},{delivery:true,customization:{paint:shop.paint,wheelStyle:0,trim:0,engineUpgrade:0,gripUpgrade:0,/* the shop's logo on both sides (city-dealers-look.js) */livery:shop.key},engine:false});}catch(e){v=null;}
 if(v)guard(v,team,true);return v||null;}
function guard(v,team,truck){v.delivery=true;v.workshopControlled=true;v.fleet=team.shop;if(truck){v.fleetTeam=team.id;if(!v.customization)v.customization={};v.customization.livery=team.key;}v.protected=true;v.health=v.maxHealth||v.health;if(v.destroyed)v.destroyed=false;}
function driverOf(sim,team){let n=sim.npcs.find(q=>q.id===team.did);if(n)return n;if(team.seated)return null;const cat=root.CityPeople?.catalog||need('CityPeople','./people.js')?.catalog||[],at0=team.wpos||team.lounge;
 try{n=sim.spawnNPC({id:team.did,x:at0.x,y:sim.world.groundHeight(at0.x,at0.z,8),z:at0.z,yaw:at0.yaw||0,role:'civilian',name:team.name,appearance:cat[team.look%Math.max(1,cat.length)],mode:'idle',fleet:team.shop,persistent:true,dingdash:true,noRagdoll:true});}catch(e){n=null;}
 if(n){n.dingdash=true;n.noRagdoll=true;n.fleet=team.shop;n.persistent=true;n.fleetTeam=team.id;}return n||null;}
/* the truck back in its space and the driver back by the hut */
function park(sim,team){const v=truckOf(sim,team);if(v){place(sim,v,team.slot,0);v.engine=false;v.throttle=0;v.seatOccupants&&(v.seatOccupants[0]=null);v.cargoGate=0;v.cargoGateOpen=false;}
 team.seated=false;team.wpos={x:team.lounge.x,z:team.lounge.z};const n=driverOf(sim,team);if(n){n.x=team.lounge.x;n.z=team.lounge.z;n.y=sim.world.groundHeight(n.x,n.z,8);n.yaw=team.lounge.yaw;n.speed=0;n.vx=n.vz=0;}}
// ---- moving things by hand ----------------------------------------------------------------------------------------------
/* a vehicle put at a place, its height and lean from the ground under its front and back */
function place(sim,v,p,dt,moving,yOf){const w=sim.world,L=Math.max(1.4,(v.length||Vh().byId[v.typeId]?.dimensions?.length||4)*.62),sy=Math.sin(p.yaw),cy=Math.cos(p.yaw),ref=(Number.isFinite(v.y)?v.y:2.5)+2.5;
 const gh=yOf||((x,z)=>w.groundHeight(x,z,ref)),hf=gh(p.x+sy*L/2,p.z+cy*L/2),hb=gh(p.x-sy*L/2,p.z-cy*L/2),y=yOf?(hf+hb)/2:Math.max(gh(p.x,p.z),(hf+hb)/2);
 const d=dt>0?Math.hypot(p.x-v.x,p.z-v.z):0,turn=wrap(p.yaw-(v.yaw||0));
 v.vx=dt>0?(p.x-v.x)/dt:0;v.vz=dt>0?(p.z-v.z)/dt:0;v.speed=moving&&dt>0?d/dt*(p.back?-1:1):0;v.x=p.x;v.z=p.z;v.y=y;v.vy=0;v.yaw=p.yaw;v.pitch=Math.atan2(hf-hb,L);v.roll=0;v.yawRate=dt>0?turn/dt:0;
 v.steer=clamp(turn*6,-.5,.5);v.wheelSpin=(v.wheelSpin||0)+(moving?d*(p.back?-1:1):0)/.34;v.grounded=true;v.throttle=moving?.35:0;v.brake=moving?0:1;
 if(v.visual){v.visual.wheelSpin=v.wheelSpin;v.visual.steer=v.steer;v.visual.reverse=!!p.back;v.visual.brake=!moving;}if(v.bikeBalance){v.bikeBalance.frontContact=v.bikeBalance.rearContact=true;v.bikeBalance.relativePitch=0;}
 if(v.protected)v.health=Math.max(v.health||0,v.maxHealth||100);return v;}
/* the driver walking: the place is kept on the team (the game's own pedestrian routine leaves fleet drivers alone) */
function walk(sim,team,n,target,dt,speed,yOf){const q=team.wpos||(team.wpos={x:n.x,z:n.z}),tx=target.x-q.x,tz=target.z-q.z,d=Math.hypot(tx,tz),done=d<.3;
 if(n.physical){n.physical=null;}if(n.ragdoll)n.ragdoll.active=false;
 let ax=d?tx/d:0,az=d?tz/d:0;
 if(!done&&speed>0){/* round a vehicle standing in the way (not the team's own truck or cargo when that is where it is going) */let near=null;for(const v of sim.vehicles){if(v.id===team.vid||v.id===team.job?.cargo||Math.abs((v.y||0)-(n.y||0))>3)continue;const r=Math.hypot((v.length||4.4)/2,(v.width||1.8)/2)+.35,cx=v.x-q.x,cz=v.z-q.z,along=cx*ax+cz*az,side=cx*az-cz*ax;if(along<-r||along>d||Math.abs(side)>=r||Math.hypot(target.x-v.x,target.z-v.z)<r)continue;if(!near||along<near.along)near={along,side,r,v};}
  if(near){const s=near.side>=0?-1:1,wx=near.v.x+az*s*(near.r+.3),wz=near.v.z-ax*s*(near.r+.3),L=Math.hypot(wx-q.x,wz-q.z)||1;ax=(wx-q.x)/L;az=(wz-q.z)/L;}
  const step=Math.min(d,speed*dt);q.x+=ax*step;q.z+=az*step;n.yaw=Math.atan2(ax,az);}
 n.x=q.x;n.z=q.z;n.y=yOf?yOf(q.x,q.z):sim.world.groundHeight(q.x,q.z,(n.y||0)+1.2);n.speed=done?0:speed;n.vx=done?0:ax*speed;n.vz=done?0:az*speed;n.mode='walk';n.walkRoute=[];n.routine=null;n.journey=null;n.health=Math.max(n.health||0,100);return done;}
function seat(sim,team,v,on){const n=sim.npcs.find(q=>q.id===team.did),cat=root.CityPeople?.catalog||need('CityPeople','./people.js')?.catalog||[];
 if(on){if(n){const i=sim.npcs.indexOf(n);sim.npcs.splice(i,1);sim.observations=(sim.observations||[]).filter(o=>o.id!==n.id);}team.seated=v.id;if(v.seatOccupants)v.seatOccupants[0]='delivery-driver:'+team.id;v.driverAppearance=cat[team.look%Math.max(1,cat.length)];v.engine=true;}
 else{if(v.seatOccupants&&String(v.seatOccupants[0]||'').startsWith('delivery-driver:'))v.seatOccupants[0]=null;v.engine=v.fleetTeam?v.engine:false;team.seated=false;const e=door(sim,v);team.wpos={x:e.x,z:e.z};driverOf(sim,team);}}
function door(sim,v){let e=null;try{e=Vh().getDoorEntry(v,0);}catch(x){e=null;}if(!e||!Number.isFinite(e.x)){const sy=Math.sin(v.yaw),cy=Math.cos(v.yaw),w=(v.width||Vh().byId[v.typeId]?.dimensions?.width||2)/2+.7;e={x:v.x+cy*w,z:v.z-sy*w};}return{x:e.x,z:e.z};}
/* the world point at (side metres to the right, ahead metres forward) of a pose */
function local(p,side,ahead){const sy=Math.sin(p.yaw),cy=Math.cos(p.yaw);return{x:p.x+sy*ahead-cy*side,z:p.z+cy*ahead+sy*side};}
// ---- where the vehicle goes ---------------------------------------------------------------------------------------------
/* the buyer's home as the game has it now: a house they chose or own, the mansion, an apartment, their first house, or the
 * shelter (in Story before any home is bought) - and a free, clear parking place there */
function destination(sim,customer,typeId,jobId){
 const w=sim.world,prof=customer.profile,d=Vh().byId[typeId],bike=d?.kind==='bike',A=need('CityApartments','./apartments.js'),H=need('CityHouses','./houses.js'),Sh=need('CityShelter','./shelter.js');
 if(d?.category==='boat')return marinaDest(sim,typeId,jobId);
 /* V13.2: planes and helicopters go to the buyer's own hangar in this room */if(d?.category==='plane'||d?.category==='heli')return hangarDest(sim,customer,typeId,jobId);
 const ap=prof.apartments||{},start=ap.start,houses=Array.isArray(ap.houses)?ap.houses:[],units=Array.isArray(ap.units)?ap.units:[],mansion=ap.mansion===true||!!prof.mansionOwned;
 const pick=[];
 if(typeof start==='string'&&start.startsWith('house-')&&houses.includes(start))pick.push(['house',start]);
 else if(start==='mansion'&&mansion)pick.push(['mansion']);
 else if(typeof start==='string'&&units.includes(start))pick.push(['apartment',start]);
 else if(start==='home'&&(ap.home===true||prof.mode!=='story'))pick.push(['home']);
 if(mansion)pick.push(['mansion']);for(const h of houses)pick.push(['house',h]);for(const u of units)pick.push(['apartment',u]);
 if(prof.mode==='story'&&ap.home!==true)pick.push(['shelter']);else pick.push(['home']);pick.push(['shelter']);
 for(const [kind,ref] of pick){let r=null;
  if(kind==='house'&&H){const h=H.byId(w,ref);if(h)r=houseDest(sim,h,typeId,jobId,H);}
  else if(kind==='mansion'&&w.mansion)r=spotDest(sim,'mansion','your mansion',w.mansion.parking,w.mansion.approach,typeId,jobId);
  else if(kind==='home'&&w.home)r=spotDest(sim,'home','your house',w.home.parking,w.home.approach,typeId,jobId);
  else if(kind==='apartment'&&A){const u=A.parseUnit?.(ref),lot=u&&A.lots().find(l=>l.place===u.site);if(lot)r=lotDest(sim,'apartment','the car park of your apartment building',lot,typeId,jobId);}
  else if(kind==='shelter'&&Sh&&w.shelter){if(bike&&w.shelter.scooters?.length)r=bayList(sim,'shelter','the Harborlight House car park',w.shelter.scooters.map(s=>({x:s.x,z:s.z,yaw:s.yaw})),typeId,jobId,{dirOut:null});if(!r)for(const lot of Sh.lots()){r=lotDest(sim,'shelter','the Harborlight House car park',lot,typeId,jobId);if(r)break;}}
  if(r)return r;}
 return null;}
function reserveKey(p){return Math.round(p.x*2)+','+Math.round(p.z*2);}
function freeSpot(sim,p,typeId,jobId){const F=fleetOf(sim),k=reserveKey(p);if(F.reserved[k]&&F.reserved[k]!==jobId)return false;const M=need('CityMotors','./motors.js');let ok=null;try{ok=M.clearPlacement(sim,typeId,{x:p.x,z:p.z,yaw:p.yaw},null);}catch(e){ok=null;}return !!ok;}
/* a single spot (the mansion's or the first house's drive), or the next spot along the drive if a car already stands there */
function spotDest(sim,kind,label,spot,approach,typeId,jobId){if(!spot)return null;const ap=approach||spot,yaw=Math.atan2(spot.x-ap.x,spot.z-ap.z),list=[{x:spot.x,z:spot.z,yaw}];
 for(const k of[1,2]){const len=(Vh().byId[typeId]?.dimensions?.length||4.5)+1.2;list.push({x:spot.x-Math.sin(yaw)*len*k,z:spot.z-Math.cos(yaw)*len*k,yaw});}
 for(const p of list)if(freeSpot(sim,p,typeId,jobId))return{kind,label,spot:p,approach:{x:ap.x,z:ap.z},target:{x:ap.x,z:ap.z}};return null;}
/* a house: its drive (beside the house, x 7.5-10.3 in the house's own coordinates) up to the pavement */
function houseDest(sim,h,typeId,jobId,H){const len=Vh().byId[typeId]?.dimensions?.length||4.5,end=Math.max(H.HZ+6.2,h.front||0),yawIn=H.yawOf(h)+Math.PI;
 const dv=H.drive?H.drive(sim.world,h):null,road=dv?dv.world[dv.world.length-1]:null;
 for(const zz of[H.HZ-2.5+len/2+.3,H.HZ-2.5+len*1.5+1.5]){if(zz+len/2>(dv?dv.local[1][1]:end)+.5)continue;const p=H.toWorld(h,8.9,0,zz),spot={x:p.x,z:p.z,yaw:yawIn};if(!freeSpot(sim,spot,typeId,jobId))continue;const ap=road||H.toWorld(h,8.9,0,end);return{kind:'house',label:h.address||'your house',spot,approach:{x:ap.x,z:ap.z},target:{x:ap.x,z:ap.z},house:h.id,drive:dv?dv.world.slice(1):null};}
 return null;}
function lotDest(sim,kind,label,lot,typeId,jobId){const bays=(lot.bays||[]).map(b=>({x:b.x,z:b.z,yaw:(lot.dir||-1)<0?0:Math.PI}));return bayList(sim,kind,label,bays,typeId,jobId,{lot});}
function bayList(sim,kind,label,bays,typeId,jobId,{lot}={}){for(const b of bays){if(!freeSpot(sim,b,typeId,jobId))continue;const sy=Math.sin(b.yaw),cy=Math.cos(b.yaw),ap={x:b.x-sy*5.5,z:b.z-cy*5.5};return{kind,label,spot:b,approach:ap,target:lot?{x:(lot.x0+lot.x1)/2,z:lot.dir<0?lot.z0:lot.z1}:ap,lot:lot?.id||null};}return null;}
const Hg=()=>need('CityHangars','./hangars.js');
function hangarDest(sim,customer,typeId,jobId){const H=Hg(),w=sim.world;if(!H||!w.hangarSet)return null;const i=H.slotOf(w,customer.key);if(!i)return null;const c=H.center(i),sp=H.spot(i),j=H.SVC.junction;
 return{kind:'hangar',label:'your hangar — Hangar '+H.pad(i),hangar:i,spot:{x:sp.x,z:sp.z,yaw:sp.yaw},approach:H.rearDoor(i),target:{x:H.SVC.x,z:c<j?Math.min(c+45,j):Math.max(c-45,j)}};}
function marinaDest(sim,typeId,jobId){const w=sim.world,L=Dl().layout(Dl().shop('marina')),berths=(w.berths||[]).slice().sort((a,b)=>Math.abs(a.z-L.ramp.z)-Math.abs(b.z-L.ramp.z)||a.x-b.x);for(const b of berths){const p={x:b.x,z:b.z,yaw:b.yaw||0};const k=reserveKey(p),F=fleetOf(sim);if(F.reserved[k]&&F.reserved[k]!==jobId)continue;if(sim.vehicles.some(v=>dist(v,p)<4))continue;return{kind:'marina',label:'Harborline Marina',spot:p,approach:p,target:p};}return null;}
// ---- road routes ----------------------------------------------------------------------------------------------------------
function nearestRoad(sim,p,exclude){let best=null;for(const r of sim.world.roads||[]){if(!r.a||!r.b||(r.layer&&r.layer!=='ground')||r===exclude)continue;const dx=r.b.x-r.a.x,dz=r.b.z-r.a.z,L2=dx*dx+dz*dz;if(!L2)continue;const t=clamp(((p.x-r.a.x)*dx+(p.z-r.a.z)*dz)/L2,0,1),x=r.a.x+dx*t,z=r.a.z+dz*t,g=Math.hypot(p.x-x,p.z-z);if(!best||g<best.g)best={g,x,z,t,r};}return best;}
function nodesBetween(sim,a,b){try{return(sim.world.route({x:a.x,z:a.z},{x:b.x,z:b.z},'road')||[]).map(n=>({x:n.x,z:n.z}));}catch(e){return[];}}
const plen=q=>q.reduce((s,p,i)=>i?s+dist(p,q[i-1]):0,0);
/* from a point beside a road to a point beside another, on the right-hand lane. `ahead` (a heading) allows only the road's
 * end in front (a truck at a kerb carries on, it does not turn round on the spot); the target side of the road is
 * preferred on the right */
function roadRoute(sim,from,to,{ahead=null,extend=0}={}){
 const jf=nearestRoad(sim,from),jt=nearestRoad(sim,to);if(!jf||!jt)return null;
 const ends=(j,dirOk)=>[j.r.a,j.r.b].filter(e=>!dirOk||dirOk(e));
 const fwd=ahead===null?null:e=>{const dx=e.x-jf.x,dz=e.z-jf.z;return dx*Math.sin(ahead)+dz*Math.cos(ahead)>.5;};
 let best=null;
 if(jf.r===jt.r&&(ahead===null||fwd({x:jt.x,z:jt.z}))){best={cost:dist(jf,jt),pts:[{x:jf.x,z:jf.z},{x:jt.x,z:jt.z}],last:{x:jf.x,z:jf.z}};}
 for(const ea of ends(jf,fwd))for(const eb of[jt.r.a,jt.r.b]){const q=nodesBetween(sim,ea,eb);if(!q.length)continue;if(dist(q[0],ea)>1)q.unshift({x:ea.x,z:ea.z});if(dist(q[q.length-1],eb)>1)q.push({x:eb.x,z:eb.z});
  /* which side of the road the target ends up on, driven from eb to jt: right is better */const hx=jt.x-eb.x,hz=jt.z-eb.z,hl=Math.hypot(hx,hz)||1,side=((to.x-jt.x)*(-hz/hl)+(to.z-jt.z)*(hx/hl));
  /* never back along the road just arrived on (a U-turn at the end node) */let uturn=0;if(q.length>=2){const a=q[q.length-2],b=q[q.length-1],ux=b.x-a.x,uz=b.z-a.z;if(ux*hx+uz*hz<-.3*Math.hypot(ux,uz)*hl)uturn=60;}
  const cost=dist(jf,ea)+plen(q)+dist(eb,jt)+(side>0?0:25)+uturn;if(!best||cost<best.cost)best={cost,pts:[{x:jf.x,z:jf.z},...q,{x:jt.x,z:jt.z}],last:eb};}
 if(!best)return null;
 /* a little further along the target's road, so the rig stops past the drive with its tail clear of the corner */
 let pts=best.pts.filter((p,i,a)=>!i||dist(p,a[i-1])>.6);
 if(extend>0&&pts.length>=2){const a=pts[pts.length-2],b=pts[pts.length-1],L=dist(a,b)||1,ux=(b.x-a.x)/L,uz=(b.z-a.z)/L,r=jt.r,room=Math.min(extend,Math.max(0,Math.max(dist(b,r.a)*(ux*(r.a.x-b.x)+uz*(r.a.z-b.z)>0?1:0),dist(b,r.b)*(ux*(r.b.x-b.x)+uz*(r.b.z-b.z)>0?1:0))-4));if(room>.5)pts.push({x:b.x+ux*room,z:b.z+uz*room});}
 return{pts,jf,jt};}
// ---- a job --------------------------------------------------------------------------------------------------------------
/* steps run one after another; each returns true when it is finished. A step never runs again once finished. */
function jobFor(sim,team,customer,entry,dest){const F=fleetOf(sim),shop=Dl().shop(team.shop),L=Dl().layout(shop),d=Vh().byId[entry.typeId];
 const job={id:'job-'+(++F.seq),team:team.id,customer:customer.key,name:customer.name||'',ownedId:entry.id,typeId:entry.typeId,shop:shop.id,carrier:shop.carrier,dest,phase:'out',steps:[],k:0,t:0,cargo:null,straps:0,ramp:0,gate:0,delivered:false,blocked:0,started:F.time,paint:entry.customization?.paint};
 F.reserved[reserveKey(dest.spot)]=job.id;
 const S=job.steps,add=(kind,o={})=>S.push({kind,...o});
 if(shop.carrier==='plane'){
  add('walkTo',{to:()=>yardWay(team,L,'to-door')});add('board');add('rig',{path:()=>(job.yardPath=yardOut(team,L)),speed:YARD,tag:'lane'});add('alight');
  add('call',{fn:()=>spawnCargo(sim,team,job,'ready')});add('phase',{to:'loading'});
  add('walkTo',{to:()=>[local(trailerPose(team),team.rig.wid/2+.7,-team.rig.len/2-1),local(trailerPose(team),0,-team.rig.len/2-team.rig.ramp-.6)]});add('ramp',{to:1});add('walkTo',{to:()=>[door(sim,cargoOf(sim,job))]});add('boardCargo');add('drive',{path:()=>carOn(team,job),speed:CARGO*.8,reverse:true,deck:true});add('alightCargo',{side:1});
  {const sp=()=>strapPoints(team,job);for(let i=0;i<4;i++){add('walkTo',{to:()=>[sp()[i]]});add('strap',{n:i+1});}}add('walkTo',{to:()=>[local(trailerPose(team),0,-team.rig.len/2-team.rig.ramp-.4)]});add('ramp',{to:0});
  add('walkTo',{to:()=>[local(truckPose(team),team.rig.tw/2+.8,-team.rig.tl/2-.6),door(sim,truckOf(sim,team))]});add('board');
  add('phase',{to:'transport'});add('route',{});add('rig',{path:()=>job.road,speed:ROAD*.65,road:true,tag:'road'});add('rig',{path:()=>hangarLineUp(team,job),speed:YARD,tag:'svc'});
  add('check');add('door');add('rig',{path:()=>hangarIn(team,job),speed:BACK,reverse:true,tag:'hangar'});
  add('phase',{to:'unloading'});add('alight');
  add('walkTo',{to:()=>[local(trailerPose(team),team.rig.wid/2+.8,team.rig.len/2-1),local(trailerPose(team),team.rig.wid/2+.8,-team.rig.len/2),local(trailerPose(team),0,-team.rig.len/2-team.rig.ramp-.6)]});add('ramp',{to:1});
  {const sp=()=>strapPoints(team,job);for(let i=3;i>=0;i--){add('walkTo',{to:()=>[sp()[i]]});add('unstrap',{n:i});}}
  add('walkTo',{to:()=>[door(sim,cargoOf(sim,job))]});add('boardCargo');add('drive',{path:()=>planeOff(team,job),speed:CARGO,deck:true});add('alightCargo',{side:1});add('call',{fn:()=>deliver(sim,job)});
  add('walkTo',{to:()=>[local(trailerPose(team),0,-team.rig.len/2-team.rig.ramp-.6)]});add('ramp',{to:0});add('walkTo',{to:()=>[local(trailerPose(team),team.rig.wid/2+.8,team.rig.len/2-1),door(sim,truckOf(sim,team))]});add('board');
  add('phase',{to:'return'});add('rig',{path:()=>hangarOut(team,job),speed:YARD,tag:'svc'});add('routeBack',{});add('rig',{path:()=>job.road,speed:ROAD*.65,road:true,tag:'road'});add('rig',{path:()=>laneIn(team,L),speed:YARD,tag:'aisle'});add('rig',{path:()=>backIn(team,L),speed:BACK,reverse:true,tag:'slot'});
 }else if(shop.carrier==='boat'){
  add('walkTo',{to:()=>yardWay(team,L,'to-door')});add('board');add('call',{fn:()=>spawnCargo(sim,team,job,'trailer')});
  add('hitch');add('alight');add('walkTo',{to:()=>strapPoints(team,job).slice(0,1)});add('strap',{n:1});add('walkTo',{to:()=>strapPoints(team,job).slice(1,2)});add('strap',{n:2});add('walkTo',{to:()=>[door(sim,truckOf(sim,team))]});add('board');
  add('phase',{to:'transport'});add('rig',{path:()=>marinaOut(team,L),speed:YARD,tag:'marinaOut'});add('rig',{path:()=>marinaLaunch(sim,team,L),speed:BACK,reverse:true,tag:'ramp'});
  add('phase',{to:'unloading'});add('alight');add('walkTo',{to:()=>[local(trailerPose(team),0,team.rig.len/2+.8)]});add('unstrap',{n:1});add('unstrap',{n:0});
  add('float');add('call',{fn:()=>deliver(sim,job)});add('walkTo',{to:()=>[door(sim,truckOf(sim,team))]});add('board');
  add('phase',{to:'return'});add('rig',{path:()=>marinaBack(team,L),speed:YARD,tag:'aisle'});add('rig',{path:()=>backIn(team,L),speed:BACK,reverse:true,tag:'slot'});add('unhitch');
 }else{
  const box=shop.carrier==='box';
  add('walkTo',{to:()=>yardWay(team,L,'to-door')});add('board');add('rig',{path:()=>(job.yardPath=yardOut(team,L)),speed:YARD,tag:'lane'});add('alight');
  add('call',{fn:()=>spawnCargo(sim,team,job,'ready')});add('phase',{to:'loading'});
  if(box){add('walkTo',{to:()=>[local(truckPose(team),0,-team.rig.tl/2-team.rig.gate-1.2)]});add('gate',{to:1});add('push',{path:()=>bikeIn(team,job),inBox:true});add('strap',{n:2,quick:true});add('walkTo',{to:()=>[local(truckPose(team),.6,-team.rig.tl/2-team.rig.gate-1)],inBox:true});add('gate',{to:0});}
  else{add('walkTo',{to:()=>[local(trailerPose(team),team.rig.wid/2+.7,-team.rig.len/2-1),local(trailerPose(team),0,-team.rig.len/2-team.rig.ramp-.6)]});add('ramp',{to:1});add('walkTo',{to:()=>[door(sim,cargoOf(sim,job))]});add('boardCargo');add('drive',{path:()=>carOn(team,job),speed:CARGO,reverse:true,deck:true});add('alightCargo',{side:1});
   const sp=()=>strapPoints(team,job);for(let i=0;i<4;i++){add('walkTo',{to:()=>[sp()[i]]});add('strap',{n:i+1});}add('walkTo',{to:()=>[local(trailerPose(team),0,-team.rig.len/2-team.rig.ramp-.4)]});add('ramp',{to:0});}
  add('walkTo',{to:()=>[local(truckPose(team),team.rig.tw/2+.8,-team.rig.tl/2-.6),door(sim,truckOf(sim,team))]});add('board');
  add('phase',{to:'transport'});add('route',{});add('rig',{path:()=>job.road,speed:ROAD,road:true,tag:'road'});
  add('phase',{to:'unloading'});add('check');add('alight');
  if(box){add('walkTo',{to:()=>[local(truckPose(team),0,-team.rig.tl/2-team.rig.gate-1.2)]});add('gate',{to:1});add('walkTo',{to:()=>[local(truckPose(team),.6,-team.rig.tl/2+.4)],inBox:true});add('strap',{n:0,quick:true});add('push',{path:()=>bikeOut(team,job),inBox:true,out:true});add('call',{fn:()=>deliver(sim,job)});add('walkTo',{to:()=>backToTruck(sim,team,job)});add('gate',{to:0});}
  else{add('walkTo',{to:()=>[local(trailerPose(team),team.rig.wid/2+.7,-team.rig.len/2-1),local(trailerPose(team),0,-team.rig.len/2-team.rig.ramp-.6)]});add('ramp',{to:1});const sp=()=>strapPoints(team,job);for(let i=3;i>=0;i--){add('walkTo',{to:()=>[sp()[i]]});add('unstrap',{n:i});}
   add('walkTo',{to:()=>[door(sim,cargoOf(sim,job))]});add('boardCargo');add('drive',{path:()=>carOff(sim,team,job),speed:CARGO*1.4,deck:true});add('alightCargo',{side:-1});add('call',{fn:()=>deliver(sim,job)});add('walkTo',{to:()=>backToTruck(sim,team,job)});add('ramp',{to:0});}
  add('walkTo',{to:()=>[door(sim,truckOf(sim,team))]});add('board');
  add('phase',{to:'return'});add('routeBack',{});add('rig',{path:()=>job.road,speed:ROAD,road:true,tag:'road'});add('rig',{path:()=>laneIn(team,L),speed:YARD,tag:'aisle'});add('rig',{path:()=>backIn(team,L),speed:BACK,reverse:true,tag:'slot'});
 }
 add('alight');add('walkTo',{to:()=>yardWay(team,L,'to-hut')});add('done');
 return job;}
// ---- the yard: the way round the parked rigs, and the rigs' own paths --------------------------------------------------------
function walkway(L){return L.dir>0?L.lane.x0-1.1:L.laneX-3.4;}
function yardWay(team,L,which){const s=team.slot,dr=door0(team),gapX=s.x+Dl().PITCH/2,aisle0=L.nose(0)+L.dir*3,aisle=s.nose+L.dir*3;
 /* through the gap beside the team's column (between the parked rigs) to its own aisle, then to the cab door */
 const path=[{x:gapX,z:aisle0},...(s.row>0?[{x:gapX,z:aisle}]:[]),{x:dr.x,z:aisle},dr];
 if(which==='to-hut')return[...path.slice(0,-1).reverse(),{x:team.lounge.x,z:team.lounge.z}];return path;}/* the driver's door of a parked truck (left side as you sit, at the cab) */
function door0(team){const s=team.slot,sy=Math.sin(s.yaw),cy=Math.cos(s.yaw),w=team.rig.tw/2+.65,a=team.rig.tl*.1;return{x:s.x+sy*a+cy*w,z:s.z+cy*a-sy*w};}
function truckPose(team){return team.pose||team.slot;}
function trailerPose(team){return team.trailer||parkedTrailer(team.slot,team.rig,team.gap||0);}
/* out of its space, round into the lane, down to the loading place */
function yardOut(team,L){const s=team.slot,R=6;const p1={x:s.x,z:s.nose+L.dir*4.5},pts=[{x:s.x,z:s.z},p1];
 pts.push(...arcFrom(p1,0,Math.PI/2,R));const e=pts[pts.length-1];
 pts.push({x:L.laneOut-R,z:e.z});pts.push(...arcFrom({x:L.laneOut-R,z:e.z},Math.PI/2,-Math.PI/2,R));pts.push({x:L.laneOut,z:L.load.z});return mk(pts);}/* the rig's path from where it now stands to the lane exit, then the roads to the buyer */
function roadOut(sim,team,L,job){const p=truckPose(team),start={x:p.x,z:p.z},exit=L.exit,len=Vh().byId[job.typeId]?.dimensions?.length||4.5,R=team.rig;
 const r=roadRoute(sim,{x:exit.x,z:exit.z+3},job.dest.target,{extend:job.dest.kind==='hangar'?0:R.back+R.ramp+len+6});if(!r)return null;
 const laid=lay(r.pts,0,0);const pts=[start,{x:exit.x,z:exit.z-2},...round([{x:exit.x,z:exit.z+.5},...laid],7)];return mk(pts);}
function roadBack(sim,team,L){const p=truckPose(team),ahead=p.yaw,lead=local(p,0,6);
 const r=roadRoute(sim,lead,{x:L.entry.x,z:L.entry.z+2},{ahead});if(!r)return null;const laid=lay(r.pts,0,0);
 /* the end: on the shop's street by the lane, turning into it */const end={x:L.laneIn,z:(L.street||Dl().ROW).z+(laid.length>1&&laid[laid.length-2].x>L.laneIn?-LANE:LANE)};
 const pts=[{x:p.x,z:p.z},...round([lead,...laid.slice(0,-1),{x:L.laneIn+(laid[laid.length-2]?.x>L.laneIn?3:-3),z:end.z},{x:L.laneIn,z:L.lane.z1-4}],7)];return mk(pts);}
/* up the lane to the team's aisle, along it past the space */
function laneIn(team,L){const p=truckPose(team),s=team.slot,R=6,A=s.arrive,over=team.rig.back+1.5,Q={x:s.x-Dl().BACKIN,z:A};
 const pts=[{x:p.x,z:p.z},{x:L.laneIn,z:A+R}];pts.push(...arcFrom(pts[1],Math.PI,Math.PI/2,R));pts.push({x:Q.x-over,z:A});return mk(pts);}
/* reversing into the space, trailer first: back along the aisle to Q, round into the space (the marina's trucks stop 2 m
 * short, at the trailer's hitch, and pull forward off it afterwards) */
function backIn(team,L){const s=team.slot,A=s.arrive,over=team.rig.back+1.5,R=Dl().BACKIN,Q={x:s.x-R,z:A},g=team.shop==='marina'?2:0;
 const pts=[{x:Q.x-over,z:A},{x:Q.x,z:A}];pts.push(...arcFrom({x:Q.x,z:A},Math.PI/2,L.dir>0?Math.PI/2:-Math.PI/2,R));pts.push({x:s.x-Math.sin(s.yaw)*g,z:s.z-Math.cos(s.yaw)*g});return mk(pts);}
// ---- the marina -----------------------------------------------------------------------------------------------------------
/* hitched, out of the space, round into the lane and north past the ramp's turn (a straight run, so the trailer is in line
 * when the truck starts to reverse) */
function marinaOut(team,L){const p=truckPose(team),s=team.slot,R=6,p1={x:s.x,z:s.nose-4.5},pts=[{x:p.x,z:p.z},p1];pts.push(...arcFrom(p1,Math.PI,-Math.PI/2,R));const e=pts[pts.length-1];
 pts.push({x:L.laneX-R,z:e.z});pts.push(...arcFrom({x:L.laneX-R,z:e.z},Math.PI/2,Math.PI/2,R));pts.push({x:L.laneX,z:L.ramp.turn.z-team.rig.back-2});return mk(pts);}
/* the launch: the truck reverses from the lane round into the ramp line and down it until the trailer's deck is under water */
function marinaLaunch(sim,team,L){const p=truckPose(team),T=L.ramp.turn,R=T.r,w=sim.world;const pts=[{x:p.x,z:p.z},{x:T.x,z:T.z}];pts.push(...arcFrom({x:T.x,z:T.z},0,-Math.PI/2,R));
 /* the stop: where the middle of the trailer stands on ground a metre under the water */let stop=-692;for(let x=-668;x>-712;x-=.5){const g=w.groundHeight(x,L.ramp.z,6),water=w.waterHeight?.(x,L.ramp.z,sim.time);if(Number.isFinite(water)&&g<water-1.05){stop=x;break;}}
 const truckX=stop+team.rig.front+team.rig.len/2;pts.push({x:truckX,z:L.ramp.z});return mk(pts);}
/* up the ramp, round into the lane, south to the team's aisle and along it past the space */
function marinaBack(team,L){const p=truckPose(team),R=L.ramp.back.r,s=team.slot,A=s.arrive,over=team.rig.back+1.5;const pts=[{x:p.x,z:p.z},{x:L.laneX-R,z:L.ramp.z}];pts.push(...arcFrom(pts[1],Math.PI/2,-Math.PI/2,R));
 pts.push({x:L.laneX,z:A-6});pts.push(...arcFrom({x:L.laneX,z:A-6},0,-Math.PI/2,6));pts.push({x:s.x-Dl().BACKIN-over,z:A});return mk(pts);}// ---- cargo --------------------------------------------------------------------------------------------------------------------
function cargoOf(sim,job){return job.cargo?sim.vehicles.find(v=>v.id===job.cargo)||null:null;}
/* the purchased vehicle comes out of the shop's store: at the loading place behind the trailer, or on the boat trailer */
function spawnCargo(sim,team,job,where){const prof=job.profile;let v=cargoOf(sim,job);if(v)return v;const entry=prof?.owned?.find(o=>o.id===job.ownedId);if(!entry)return null;
 const old=sim.vehicles.find(q=>q.id===entry.id);if(old)sim.vehicles.splice(sim.vehicles.indexOf(old),1);
 const d=Vh().byId[entry.typeId],len=d.dimensions.length;let p;
 if(where==='trailer'){const t=trailerPose(team);p={x:t.x,z:t.z,yaw:wrap(t.yaw+Math.PI)};}
 else if(team.rig.trailer){const t=local(truckPose(team),0,-team.rig.back-team.rig.ramp-.9-len/2);p={x:t.x,z:t.z,yaw:wrap(truckPose(team).yaw+Math.PI)};}
 else{const t=local(truckPose(team),0,-team.rig.tl/2-team.rig.gate-1-len/2);p={x:t.x,z:t.z,yaw:truckPose(team).yaw};}
 try{v=sim.spawnVehicle(entry.typeId,entry.id,p,{delivery:true,customization:{...(entry.customization||{})},engine:false});}catch(e){v=null;}if(!v)return null;
 v.fleetCargo=team.id;v.delivery=true;v.workshopControlled=true;v.protected=true;v.owned=false;job.cargo=v.id;
 if(where==='trailer'){job.onTrailer=true;carry(sim,team,job,0);}else place(sim,v,p,0,false,null);return v;}
/* heights on and around a trailer: ground behind the ramp, up the ramp, the deck */
function deckY(sim,team,v){const w=sim.world,R=team.rig,t=trailerPose(team);return(x,z)=>{const g=w.groundHeight(x,z,(v.y||2.5)+3),sy=Math.sin(t.yaw),cy=Math.cos(t.yaw),u=(x-t.x)*sy+(z-t.z)*cy+R.len/2,side=Math.abs((x-t.x)*cy-(z-t.z)*sy),gt=trailerGround(sim,team);
 if(side>R.wid/2+.4||u>R.len+.2)return g;if(u>=0)return gt+R.deck;if(u>-R.ramp)return Math.max(g,gt+R.deck*(1+u/R.ramp)*(job0(team)?.ramp??1));return g;};}
function job0(team){return team.job;}
function trailerGround(sim,team){const t=trailerPose(team),w=sim.world;return(w.groundHeight(t.f.x,t.f.z,6)+w.groundHeight(t.b.x,t.b.z,6))/2;}
/* the car backs up the ramp onto the deck (it faces the back of the trailer, so it drives off forwards) */
function carOn(team,job){const t=trailerPose(team),len=Vh().byId[job.typeId].dimensions.length,start=local(t,0,-team.rig.len/2-team.rig.ramp-.9-len/2),deck=local(t,0,.15);return mk([start,deck]);}
/* off the ramp the way it faces, round to the drive or bay, into it */
function carOff(sim,team,job){const t=trailerPose(team),len=Vh().byId[job.typeId].dimensions.length,d=job.dest,off=local(t,0,-team.rig.len/2-team.rig.ramp-1.6-len/2),far=local(t,0,-team.rig.len/2-team.rig.ramp-4.5-len/2);
 const way=inward(d),m0=way[0],m1=way[1]||{x:d.spot.x,z:d.spot.z},L=Math.hypot(m1.x-m0.x,m1.z-m0.z)||1,before={x:m0.x-(m1.x-m0.x)/L*3,z:m0.z-(m1.z-m0.z)/L*3};
 const pts=round([{x:t.x,z:t.z},off,far,before,...way,{x:d.spot.x,z:d.spot.z}],4.5);return mk(pts);}
/* from the road into the parking place: along a house's drive (its corners), or straight in from the approach */
function inward(d){if(d.drive&&d.drive.length)return d.drive.slice().reverse().map(p=>({x:p.x,z:p.z}));return[{x:d.approach.x,z:d.approach.z}];}
/* bikes: walked up the tail-lift into the box, and out again to the parking place */
function bikeIn(team,job){const p=truckPose(team),len=Vh().byId[job.typeId].dimensions.length,a=local(p,0,-team.rig.tl/2-team.rig.gate-1-len/2),b=local(p,0,-.9);return mk([a,b]);}
function bikeOut(team,job){const p=truckPose(team),len=Vh().byId[job.typeId].dimensions.length,d=job.dest,a=local(p,0,-.9),b=local(p,0,-team.rig.tl/2-team.rig.gate-1.2-len/2);return mk(round([a,b,...inward(d),{x:d.spot.x,z:d.spot.z}],2.5));}
function backToTruck(sim,team,job){const d=job.dest,p=truckPose(team),back=team.rig.trailer?local(trailerPose(team),0,-team.rig.len/2-team.rig.ramp-.6):local(p,0,-team.rig.tl/2-team.rig.gate-1);return[...inward(d).reverse(),back];}
/* where the driver stands to put each strap on: by the four wheels of the car on the deck (or bow and stern of a boat) */
function strapPoints(team,job){const t=trailerPose(team),R=team.rig,dm=Vh().byId[job.typeId].dimensions,hw=R.wid/2+.55,wb=dm.length*.32;
 if(job.carrier==='boat')return[local(t,hw,dm.length*.38),local(t,-hw,-dm.length*.3)];
 if(job.carrier==='plane'){const def=Vh().byId[job.typeId],b=(def.wheelbase||dm.length*.4)*.5;return[local(t,hw,-b+.15),local(t,hw,b+.15),local(t,-hw,b+.15),local(t,-hw,-b+.15)];}
 return[local(t,hw,wb),local(t,hw,-wb),local(t,-hw,-wb),local(t,-hw,wb)];}
/* V13.2: at the hangars. The truck comes along the service road from Airfield Road, drives on past the hangar on the
 * side away from it, and backs the trailer through the hangar's rear door (the trailer first, round a turn, then straight
 * in) until the plane is over its place; afterwards it drives out forwards and turns back the way it came. */
const HR=8;
function hangarSide(job){const H=Hg(),c=H.center(job.dest.hangar);return{H,c,north:c<H.SVC.junction,lane:H.SVC.lane};}
function hangarLineUp(team,job){const {c,north,lane}=hangarSide(job),p=truckPose(team),over=team.rig.back+2,zq=north?c-HR-over:c+HR+over;return mk(round([{x:p.x,z:p.z},local(p,0,6),{x:lane,z:north?c+14:c-14},{x:lane,z:zq}],7));}
function hangarStop(team,job){const H=Hg();return H.HG.back-10+team.rig.back;}
function hangarIn(team,job){const {c,north,lane}=hangarSide(job),over=team.rig.back+2,pts=[{x:lane,z:north?c-HR-over:c+HR+over},{x:lane,z:north?c-HR:c+HR}];pts.push(...arcFrom(pts[1],north?0:Math.PI,north?-Math.PI/2:Math.PI/2,HR));pts.push({x:hangarStop(team,job),z:c});return mk(pts);}
/* a U-turn on the service road towards the hangars' side (there is room for it between the far lane and the hangars' backs) */
function uTurn(team){const H=Hg(),p=truckPose(team),north=Math.cos(p.yaw)<0,dz=north?-1:1,lane=H.SVC.lane,a={x:lane,z:p.z+dz*(Math.abs(p.x-lane)<1?4:12)},pts=[{x:p.x,z:p.z},a];pts.push(...arcFrom(a,north?Math.PI:0,north?Math.PI:-Math.PI,7.5));const e=pts[pts.length-1];pts.push({x:e.x,z:e.z-dz*20});return mk(pts);}
function hangarOut(team,job){const {c,north,lane}=hangarSide(job),p=truckPose(team),a={x:lane-6,z:c},pts=[{x:p.x,z:p.z},a];pts.push(...arcFrom(a,Math.PI/2,north?-Math.PI/2:Math.PI/2,6));pts.push({x:lane,z:north?c+34:c-34});return mk(pts);}
/* off the trailer's back, forwards, onto its place in the hangar (nose to the front door) */
function planeOff(team,job){const t=trailerPose(team),c=job.cargo,d=job.dest;return mk([local(t,0,.15),local(t,0,-team.rig.len/2-team.rig.ramp-1),{x:d.spot.x,z:d.spot.z}]);}
/* the hangar's own place: another of the buyer's planes standing there goes into storage (LINK brings it out again);
 * anything else there, or anyone, and the truck waits */
function hangarClear(sim,job){const d=job.dest,prof=job.profile;for(const v of [...sim.vehicles]){if(v.fleetCargo||v.fleet||Math.hypot(v.x-d.spot.x,v.z-d.spot.z)>7)continue;const o=prof?.owned?.find(e=>e.id===v.id);if(o&&!v.seatOccupants?.some(Boolean)){o.storedState={health:v.health};sim.vehicles.splice(sim.vehicles.indexOf(v),1);continue;}return false;}return true;}
// ---- stepping a job -----------------------------------------------------------------------------------------------------------
function stepJob(sim,team,job,dt){
 const S=job.steps[job.k];if(!S)return true;job.t+=dt;const done=()=>{job.k++;job.t=0;job.arg=null;return false;};
 const v=truckOf(sim,team);if(!v)return false;guard(v,team,true);
 switch(S.kind){
  case 'phase':job.phase=S.to;return done();
  case 'call':S.fn();return done();
  case 'walkTo':{const n=driverOf(sim,team);if(!n)return done();if(!job.arg){job.arg={pts:S.to().filter(Boolean),i:0};}const a=job.arg,tgt=a.pts[a.i];if(!tgt)return done();
   const yOf=S.inBox?boxY(sim,team):null;if(walk(sim,team,n,tgt,dt,WALK,yOf)){a.i++;if(a.i>=a.pts.length)return done();}return false;}
  case 'board':{if(job.t<.7)return false;const n=sim.npcs.find(q=>q.id===team.did);if(n){n.speed=0;}seat(sim,team,v,true);return done();}
  case 'alight':{if(job.t<.6)return false;if(team.seated===v.id)seat(sim,team,v,false);return done();}
  case 'boardCargo':{if(job.t<.7)return false;const c=cargoOf(sim,job);if(!c)return done();seat(sim,team,c,true);return done();}
  case 'alightCargo':{if(job.t<.6)return false;const c=cargoOf(sim,job);if(c&&team.seated===c.id){seat(sim,team,c,false);const e=local(c,(S.side||1)*((c.width||2)/2+.75),0);team.wpos={x:e.x,z:e.z};const n=driverOf(sim,team);if(n){n.x=e.x;n.z=e.z;}}return done();}
  case 'ramp':{job.ramp=clamp(job.ramp+(S.to>job.ramp?1:-1)*dt/1.3,0,1);if(Math.abs(job.ramp-S.to)<.01){job.ramp=S.to;return done();}return false;}
  case 'gate':{job.gate=clamp(job.gate+(S.to>job.gate?1:-1)*dt/1.6,0,1);v.cargoGate=job.gate;v.cargoGateOpen=job.gate>.5;if(Math.abs(job.gate-S.to)<.01){job.gate=S.to;v.cargoGate=S.to;return done();}return false;}
  case 'strap':case 'unstrap':{if(job.t<(S.quick?.6:STRAP))return false;job.straps=S.n;return done();}
  case 'hitch':{/* the truck backs the 2 m onto the trailer's hitch */const s=team.slot,k=clamp(job.t/2.2,0,1),p={x:s.x-Math.sin(s.yaw)*2*k,z:s.z-Math.cos(s.yaw)*2*k,yaw:s.yaw,back:true};team.pose=p;place(sim,v,p,dt,k<1);if(k>=1){team.hitched=true;team.gap=0;job.where='hitched';return done();}return false;}
  case 'unhitch':{/* the trailer stays where it is; the truck pulls 2 m forward off the hitch into its space */if(!job.arg){job.arg={trailer:team.trailer||parkedTrailer(team.slot,team.rig,2)};}const s=team.slot,k=clamp(job.t/2,0,1),p={x:s.x-Math.sin(s.yaw)*2*(1-k),z:s.z-Math.cos(s.yaw)*2*(1-k),yaw:s.yaw};team.hitched=false;team.trailer=job.arg.trailer;team.pose=p;place(sim,v,p,dt,k<1);if(k>=1){team.gap=2;team.trailer=parkedTrailer(team.slot,team.rig,2);team.pose=null;job.where='slot';return done();}return false;}
  case 'route':{if(!job.road){/* the home is looked at again before setting off: it may have changed */const c=customerOf(sim,job);if(c){const d2=destination(sim,c,job.typeId,job.id);if(d2&&(d2.kind!==job.dest.kind||dist(d2.spot,job.dest.spot)>1)){delete fleetOf(sim).reserved[reserveKey(job.dest.spot)];job.dest=d2;fleetOf(sim).reserved[reserveKey(d2.spot)]=job.id;}}
    job.road=roadOut(sim,team,Dl().layout(Dl().shop(team.shop)),job);if(!job.road){if(job.t>5){job.t=0;}return false;}}return done();}
  case 'routeBack':{job.road=roadBack(sim,team,Dl().layout(Dl().shop(team.shop)));if(!job.road){/* no way found from here: drive on to the next junction and try again */job.road=mk([truckPose(team),local(truckPose(team),0,20)]);}return done();}
  case 'rig':{if(!job.arg){const path=S.path();if(!path)return done();job.arg={path,s:0,speed:0};}const a=job.arg;
   if(a.off&&a.s>a.off.s3)a.off=null;
   const target=S.road?roadSpeed(a.path,a.s):S.speed,block=S.road||S.speed>=YARD?blockedAhead(sim,team,a,S):null;
   a.speed=block?Math.max(0,a.speed-7*dt):a.speed<target?Math.min(target,a.speed+2.2*dt):Math.max(target,a.speed-4*dt);
   job.blocked=block?job.blocked+dt:0;
   /* a vehicle standing still in the lane for a few seconds: pull round it on the other side of the road once that is clear */
   if(block&&block.vehicle&&S.road&&!a.off&&job.blocked>4&&Math.abs(block.vehicle.speed||0)<.6){const span=team.rig.back+team.rig.tl/2,o={s0:a.s+.5,s1:a.s+9,s2:block.s+(block.vehicle.length||4.5)/2+span+3,s3:block.s+(block.vehicle.length||4.5)/2+span+11,amt:3.8,vehicle:block.vehicle.id};if(passClear(sim,team,a,o))a.off=o;}
   if(job.blocked>60&&S.road){/* still blocked after a long wait: creep on slowly */a.speed=Math.max(a.speed,1);}
   a.s=Math.min(a.path.length,a.s+a.speed*dt);const P=rigPose(sim,team,a,a.s,!!S.reverse);P.back=!!S.reverse;team.pose={x:P.x,z:P.z,yaw:P.yaw};if(P.trailer)team.trailer=P.trailer;
   place(sim,v,P,dt,a.speed>.05);carry(sim,team,job,dt);if(a.s>=a.path.length-.02){a.speed=0;place(sim,v,P,dt,false);if(S.tag)job.where=S.tag;job.lastPath=a.path;job.lastReverse=!!S.reverse;return done();}return false;}
  case 'drive':{const c=cargoOf(sim,job);if(!c)return done();if(!job.arg){job.arg={path:S.path(),s:0};}const a=job.arg;a.s=Math.min(a.path.length,a.s+S.speed*dt);
   const p=at(a.path,a.s),h=heading(a.path,a.s),yaw=S.reverse?wrap(h+Math.PI):h;place(sim,c,{x:p.x,z:p.z,yaw,back:!!S.reverse},dt,true,S.deck?deckY(sim,team,c):null);
   if(a.s>=a.path.length-.02){job.onTrailer=!!S.reverse;place(sim,c,{x:p.x,z:p.z,yaw},dt,false,S.deck?deckY(sim,team,c):null);return done();}return false;}
  case 'push':{/* the driver walks the bike: the bike rolls beside them, up or down the tail-lift */const c=cargoOf(sim,job),n=driverOf(sim,team)||{};if(!c)return done();if(!job.arg){job.arg={path:S.path(),s:0};}const a=job.arg;a.s=Math.min(a.path.length,a.s+1.2*dt);
   const p=at(a.path,a.s),h=heading(a.path,a.s),yOf=boxY(sim,team),yaw=S.out&&a.s<4?wrap(truckPose(team).yaw):h;const bike={x:p.x,z:p.z,yaw};place(sim,c,bike,dt,true,yOf);c.roll=0;
   const side=local(bike,-.55,.2);team.wpos={x:side.x,z:side.z};n.x=side.x;n.z=side.z;n.y=yOf(side.x,side.z);n.yaw=yaw;n.speed=1.2;n.mode='walk';
   if(a.s>=a.path.length-.02){job.inBox=!S.out;place(sim,c,bike,dt,false,yOf);n.speed=0;return done();}return false;}
  case 'float':{const c=cargoOf(sim,job);if(!c)return done();if(!job.arg){const t=trailerPose(team),d=job.dest,off=local(t,0,-team.rig.len/2-(c.length||6)/2-2),sy=Math.sin(d.spot.yaw),cy=Math.cos(d.spot.yaw),pts=[{x:c.x,z:c.z},off,{x:off.x-7,z:off.z}];
    /* a berth in another gap between the piers: out past the piers' ends, along, and back in */if(Math.abs(d.spot.z-off.z)>9){pts.push({x:-744,z:off.z},{x:-744,z:d.spot.z});}pts.push({x:d.spot.x-sy*8,z:d.spot.z-cy*8},{x:d.spot.x,z:d.spot.z});
    job.arg={path:mk(round(pts,4)),s:0};job.onTrailer=false;}
   const a=job.arg;a.s=Math.min(a.path.length,a.s+1.4*dt);const p=at(a.path,a.s),h=heading(a.path,a.s),yaw=a.s<6?c.yaw:h,water=sim.world.waterHeight?.(p.x,p.z,sim.time);
   c.x=p.x;c.z=p.z;c.yaw=a.s<6?c.yaw:wrap(c.yaw+clamp(wrap(yaw-c.yaw),-dt*.8,dt*.8));c.y=Number.isFinite(water)?water+.035:c.y;c.pitch=0;c.roll=0;c.vx=c.vz=0;c.speed=0;
   if(a.s>=a.path.length-.02){c.yaw=job.dest.spot.yaw;return done();}return false;}
  case 'door':{/* the hangar's back door rolls up for the truck; it waits until it is all the way up */const H=Hg(),d=job.dest;if(!H||d.kind!=='hangar')return done();const s=sim.world.hangarSet;if(s?.doors?.[d.hangar]?.rear>=.98)return done();if(job.t>40){job.t=0;}return false;}
  case 'check':{/* before unloading: the parking place must still be free; if not, another; if none, wait and try again */const d=job.dest;if(d.kind==='marina')return done();
   if(d.kind==='hangar'){/* the hangar must still be the buyer's (they may have left the room) and its place clear */const H=Hg(),c=customerOf(sim,job);if(!c||!H||H.slotOf(sim.world,c.key)!==d.hangar){abort(sim,job,'hangar');return false;}if(hangarClear(sim,job))return done();if(job.t<4)return false;job.t=0;job.waited=(job.waited||0)+4;if(job.waited>90)abort(sim,job,'blocked');return false;}
   if(freeSpot(sim,d.spot,job.typeId,job.id))return done();if(job.t<4)return false;job.t=0;const c=customerOf(sim,job);const d2=c&&destination(sim,c,job.typeId,job.id);
   if(d2&&dist(d2.target,d.target)<40){delete fleetOf(sim).reserved[reserveKey(d.spot)];job.dest=d2;fleetOf(sim).reserved[reserveKey(d2.spot)]=job.id;return done();}
   job.waited=(job.waited||0)+4;if(job.waited>90){abort(sim,job,'blocked');}return false;}
  case 'done':return true;
 }
 return done();}
/* the cargo rides on the trailer (or in the box) wherever the rig goes */
function carry(sim,team,job,dt){const c=cargoOf(sim,job);if(!c)return;
 if(job.onTrailer&&team.trailer){const t=team.trailer,p={x:t.x,z:t.z,yaw:wrap(t.yaw+Math.PI)};if(job.carrier==='boat'){const w=sim.world,water=w.waterHeight?.(t.x,t.z,sim.time),deck=trailerGround(sim,team)+team.rig.deck+(Vh().byId[c.typeId]?.dimensions?.height||2)*.18;place(sim,c,p,dt,false,()=>deck);if(Number.isFinite(water)&&water+.035>c.y)c.y=water+.035;c.yaw=p.yaw;}
  else{const s=local(t,0,.15);place(sim,c,{x:s.x,z:s.z,yaw:p.yaw},dt,false,deckY(sim,team,c));}}
 else if(job.inBox){const p=truckPose(team),s=local(p,0,-.9);place(sim,c,{x:s.x,z:s.z,yaw:p.yaw},dt,false,boxY(sim,team));}}
/* heights in and behind the box truck: the box floor, the tail-lift ramp, the road */
function boxY(sim,team){const v=sim.vehicles.find(q=>q.id===team.vid),w=sim.world,R=team.rig;return(x,z)=>{const g=w.groundHeight(x,z,(v?.y||2.5)+3);if(!v)return g;const sy=Math.sin(v.yaw),cy=Math.cos(v.yaw),u=(x-v.x)*sy+(z-v.z)*cy,sx=Math.abs((x-v.x)*cy-(z-v.z)*sy),rear=-R.tl*.485;
 if(sx>R.tw*.5)return g;if(u>=rear&&u<=-.02)return v.y+R.deck;if(u<rear&&u>=rear-R.gate&&(v.cargoGate||0)>.9)return Math.max(g,v.y+R.deck*(1-(rear-u)/R.gate));return g;};}
/* how fast on the road: slower into bends (the turn over the next 14 m) */
function roadSpeed(path,s){const h0=heading(path,s+2),h1=heading(path,s+9),h2=heading(path,s+16),turn=Math.max(Math.abs(wrap(h1-h0)),Math.abs(wrap(h2-h0)));const left=path.length-s;return clamp(Math.min(ROAD-turn*13,2+left*.55),2.6,ROAD);}
/* anyone or anything on the way ahead (the next few metres of the path, as wide as the rig): {vehicle|person, s} */
function blockedAhead(sim,team,a,S){const reach=4+a.speed*1.3,R=team.rig,half=R.wid/2+.2,ownCargo=team.job?.cargo,front=(S.reverse?R.back:R.tl/2),me=sim.vehicles.find(q=>q.id===team.vid),my=me?.y||0;
 const pts=[];for(let k=front+.5;k<=front+reach;k+=1.2)pts.push({p:ptAt(a,a.s+k),s:a.s+k});
 const hit=(o,r)=>{for(const q of pts)if(Math.hypot(o.x-q.p.x,o.z-q.p.z)<half+r)return q.s;return null;};
 for(const o of sim.vehicles){if(o===me||o.id===ownCargo||o.fleetCargo===team.id||(a.off&&a.off.vehicle===o.id))continue;if(Math.abs((o.y||0)-my)>3)continue;const s=hit(o,(o.width||2)/2+.15);if(s!==null)return{vehicle:o,s};}
 for(const n of sim.npcs){if(!(n.health>0)||n.vehicleId||n.fleet||n.ragdoll?.active)continue;const s=hit(n,.3);if(s!==null)return{person:n,s};}
 for(const p of sim.fleetPeople||[sim.player]){if(p&&p.health>0&&!p.vehicleId){const s=hit(p,.3);if(s!==null)return{person:p,s};}}return null;}
/* the other side of the road clear for the whole pass (nothing coming, nothing standing there) */
function passClear(sim,team,a,o){const me=sim.vehicles.find(q=>q.id===team.vid);for(let s=o.s0;s<=o.s3+25;s+=2){const p=at(a.path,s),h=heading(a.path,s),q={x:p.x+Math.cos(h)*o.amt,z:p.z-Math.sin(h)*o.amt};
 for(const v of sim.vehicles){if(v===me||v.fleetCargo===team.id||v.id===o.vehicle)continue;if(Math.hypot(v.x-q.x,v.z-q.z)<2.8)return false;}for(const n of sim.npcs){if(n.health>0&&!n.vehicleId&&Math.hypot(n.x-q.x,n.z-q.z)<1.8)return false;}}
 /* and no building or wall in the way */const w=sim.world;for(let s=o.s0;s<=o.s3;s+=2){const p=at(a.path,s),h=heading(a.path,s),q={x:p.x+Math.cos(h)*o.amt,z:p.z-Math.sin(h)*o.amt};try{if(!w.capsuleClear({x:q.x,y:w.groundHeight(q.x,q.z,(me?.y||2.5)+2)+.4,z:q.z},1.2,1.6))return false;}catch(e){}}return true;}// ---- the job done ----------------------------------------------------------------------------------------------------------
function customerOf(sim,job){return(sim.fleetCustomers||[]).find(c=>c.key===job.customer)||null;}
/* the vehicle is the buyer's from here on: ordinary damage again, theirs to drive; told once */
function deliver(sim,job){if(job.delivered)return;job.delivered=true;const F=fleetOf(sim),c=cargoOf(sim,job),cust=customerOf(sim,job),prof=job.profile,entry=prof?.owned?.find(o=>o.id===job.ownedId),d=Vh().byId[job.typeId];
 if(c){delete c.fleetCargo;delete c.protected;c.delivery=false;c.workshopControlled=false;c.owned=true;c.personalDelivered=true;c.engine=false;c.vx=c.vz=0;c.speed=0;}
 if(entry){delete entry.delivery;try{const M=need('CityMotors','./motors.js'),st=M.state(prof);if(c)st.activeId=c.id;}catch(e){}}
 job.cargo=null;job.onTrailer=false;job.inBox=false;delete F.reserved[reserveKey(job.dest.spot)];
 const text=job.dest.kind==='marina'?'Your '+d.name+' is ready in the water at Harborline Marina.':job.dest.kind==='hangar'?'Your '+d.name+' has been delivered to your hangar — Hangar '+Hg().pad(job.dest.hangar)+'.':'Your '+d.name+' has been delivered to '+job.dest.label+'.';
 F.notices.push({customer:job.customer,text,typeId:job.typeId,ownedId:job.ownedId,id:job.id,at:sim.time||0});if(F.notices.length>40)F.notices.splice(0,F.notices.length-40);
 if(cust?.dirty)cust.dirty();sim.dirty=true;sim.emit?.('dealerDelivered',{customer:job.customer,text,typeId:job.typeId,ownedId:job.ownedId});}
/* a job that cannot go on (the buyer left the room, or nowhere to park after a long wait): the vehicle goes back to the
 * store and the purchase waits in their queue again (nothing is paid or given twice); the team goes home the way that
 * fits where it is. A step under way (a rig moving) is finished first. */
function abort(sim,job,why){if(job.delivered||job.aborted)return;job.aborted=why||true;const F=fleetOf(sim),entry=job.profile?.owned?.find(o=>o.id===job.ownedId);
 if(entry&&entry.delivery)entry.delivery.state='queued';delete F.reserved[reserveKey(job.dest.spot)];
 const cur=job.steps[job.k];if(cur&&cur.kind==='rig'&&job.arg){job.steps=[cur,{kind:'call',fn:()=>homePlan(sim,job)}];job.k=0;}else homePlan(sim,job);}
function homePlan(sim,job){const F=fleetOf(sim),team=F.teams.find(t=>t.id===job.team),L=Dl().layout(Dl().shop(team.shop)),steps=[];
 if(team.seated&&team.seated!==team.vid){const c=cargoOf(sim,job);if(c)seat(sim,team,c,false);}
 dropCargo(sim,job);const w=job.where||'slot',toTruck=()=>{if(team.seated!==team.vid)steps.push({kind:'walkTo',to:()=>[door(sim,truckOf(sim,team))]},{kind:'board'});};
 const reverseOf=p=>mk(p.pts.slice().reverse());
 if(job.carrier==='boat'){
  if(w==='slot'&&!team.pose){/* not moved yet */}
  else if(w==='hitched'){toTruck();steps.push({kind:'unhitch'});}
  else if(w==='marinaOut'&&job.lastPath){toTruck();steps.push({kind:'rig',path:()=>reverseOf(job.lastPath),speed:BACK,reverse:true,tag:'hitched'},{kind:'unhitch'});}
  else{toTruck();steps.push({kind:'rig',path:()=>marinaBack(team,L),speed:YARD,tag:'aisle'},{kind:'rig',path:()=>backIn(team,L),speed:BACK,reverse:true,tag:'slot'},{kind:'unhitch'});}}
 else if(job.carrier==='plane'&&['road','svc','hangar'].includes(w)){/* V13.2: turned round out at the airfield (the buyer left): out of the hangar's back door if it had backed in, otherwise a U-turn on the service road on the hangars' side; then home */
  toTruck();steps.push({kind:'rig',path:()=>w==='hangar'?hangarOut(team,job):uTurn(team),speed:YARD,tag:'turned'},{kind:'routeBack'},{kind:'rig',path:()=>job.road,speed:ROAD*.65,road:true,tag:'home'},{kind:'rig',path:()=>laneIn(team,L),speed:YARD,tag:'aisle'},{kind:'rig',path:()=>backIn(team,L),speed:BACK,reverse:true,tag:'slot'});}
 else{
  if(w==='slot'&&!team.pose){/* not moved yet */}
  else if(w==='lane'&&job.yardPath){toTruck();steps.push({kind:'rig',path:()=>reverseOf(job.yardPath),speed:BACK,reverse:true,tag:'slot'});}
  else if(w==='aisle'){toTruck();steps.push({kind:'rig',path:()=>backIn(team,L),speed:BACK,reverse:true,tag:'slot'});}
  else{toTruck();steps.push({kind:'routeBack'},{kind:'rig',path:()=>job.road,speed:ROAD,road:true,tag:'road'},{kind:'rig',path:()=>laneIn(team,L),speed:YARD,tag:'aisle'},{kind:'rig',path:()=>backIn(team,L),speed:BACK,reverse:true,tag:'slot'});}}
 if(team.seated===team.vid)steps.push({kind:'alight'});else if(steps.length)steps.push({kind:'alight'});
 steps.push({kind:'gate',to:0},{kind:'ramp',to:0},{kind:'walkTo',to:()=>yardWay(team,L,'to-hut')},{kind:'done'});
 job.steps=steps;job.k=0;job.t=0;job.arg=null;job.phase='return';job.straps=0;}
function dropCargo(sim,job){if(job.delivered)return;const c=cargoOf(sim,job);if(c)sim.vehicles.splice(sim.vehicles.indexOf(c),1);job.cargo=null;job.onTrailer=false;job.inBox=false;job.straps=0;}// ---- every frame ---------------------------------------------------------------------------------------------------------
/* customers: [{key, name, profile, actor, dirty()}] - in single player just the player; online every player in the room */
function step(sim,dt,customers,opts={}){
 const F=init(sim,opts.teams);if(!F)return;F.time+=dt;sim.fleetCustomers=customers;sim.fleetPeople=customers.map(c=>c.actor).filter(Boolean);
 /* hand out work: the oldest purchase of each buyer who has none underway, to a free team of that shop (the team that
  * served them last, if it is free) */
 if((F.tick=(F.tick||0)+dt)>.5){F.tick=0;const D=Dl();
  for(const c of customers){if(!c.profile?.owned)continue;
   /* one delivery underway per buyer: from dispatch until the vehicle is unloaded (a truck on its way home carries nothing of theirs) */
   if(F.jobs.some(j=>j.customer===c.key&&!j.finished&&!j.delivered&&!j.aborted))continue;
   const q=D.queue(c.profile).filter(o=>o.delivery.state==='queued'||o.delivery.state==='active');const entry=q[0];if(!entry)continue;
   /* the next one from the same shop waits for the team that is bringing them the last one back home */
   const mine=F.jobs.find(j=>j.customer===c.key&&!j.finished&&j.shop===entry.delivery.shop);if(mine)continue;
   const free=F.teams.filter(t=>t.shop===entry.delivery.shop&&!t.job);if(!free.length)continue;const prefer=free.find(t=>t.id===F.lastTeam[c.key+':'+entry.delivery.shop])||free[0];
   const dest=destination(sim,c,entry.typeId,'pending');if(!dest)continue;const job=jobFor(sim,prefer,c,entry,dest);job.profile=c.profile;prefer.job=job;F.jobs.push(job);entry.delivery.state='active';F.lastTeam[c.key+':'+entry.delivery.shop]=prefer.id;if(c.dirty)c.dirty();}
  /* a buyer who has gone (left the room): their job turns round */
  for(const j of F.jobs)if(!j.finished&&!j.delivered&&!j.aborted&&!customers.some(c=>c.key===j.customer))abort(sim,j,'left');
  /* the profile a job writes to is the buyer's current one (a rejoin brings a fresh copy) */
  for(const j of F.jobs){const c=customers.find(c=>c.key===j.customer);if(c&&c.profile&&j.profile!==c.profile)j.profile=c.profile;}}
 staff(sim);
 F.frame=(F.frame||0)+1;
 for(const team of F.teams){/* a parked team is looked at every half second or so (each on its own frame), not every frame */if(!team.job&&(F.frame+team.i*7)%24!==0)continue;
  const v=truckOf(sim,team);if(v)guard(v,team,true);
  if(!team.job){/* parked: kept exactly in its space, the driver by the hut */if(v&&(Math.abs(v.x-team.slot.x)>.05||Math.abs(v.z-team.slot.z)>.05||v.speed))park(sim,team);else if(v){v.vx=v.vz=0;v.speed=0;}const n=driverOf(sim,team);if(n){n.health=Math.max(n.health||0,100);if(n.physical)n.physical=null;if(n.ragdoll)n.ragdoll.active=false;n.x=team.lounge.x;n.z=team.lounge.z;n.speed=0;n.vx=n.vz=0;n.mode='idle';}continue;}
  const job=team.job;if(stepJob(sim,team,job,dt)){if(job.aborted&&!job.delivered)dropCargo(sim,job);job.finished=true;team.job=null;team.pose=null;if(team.rig.trailer)team.trailer=parkedTrailer(team.slot,team.rig,team.gap||0);park(sim,team);F.jobs.splice(F.jobs.indexOf(job),1);}
  /* the driver is never hurt or knocked down */const n=sim.npcs.find(q=>q.id===team.did);if(n){n.health=Math.max(n.health||0,100);n.dead=false;}}
}
/* the salesperson at every shop (the game adds them with the other shop staff; in Story, where the streets are empty, they
 * are added here, as the delivery drivers are) */
function staff(sim){if((sim._dealerStaffTick=(sim._dealerStaffTick||0)+1)%45!==1)return;const cat=root.CityPeople?.catalog||need('CityPeople','./people.js')?.catalog||[];
 for(const s of sim.world.services||[]){if(s.type!=='dealer'||!s.staff||sim.npcs.some(n=>n.id==='staff-'+s.id||(n.service===s.id&&n.role==='staff')))continue;try{sim.spawnNPC({id:'staff-'+s.id,x:s.staff.x,y:s.staff.y??s.y,z:s.staff.z,yaw:s.staff.yaw||0,role:'staff',persistent:true,name:s.displayName||s.name,service:s.id,appearance:cat[hash(s.id)%Math.max(1,cat.length)],mode:'idle',storyKeep:true});}catch(e){}}}
// ---- what the others see, and what the Link app shows -------------------------------------------------------------------
/* the moving trailers, the straps and ramps of every team that is out (online this goes to every player once a frame;
 * parked teams need nothing: their trailers stand behind their trucks) */
function view(sim){const F=fleetOf(sim);if(!F)return null;const r3=n=>Math.round(n*100)/100,out=[];
 for(const t of F.teams){const j=t.job,tr=t.trailer;if(!j&&(t.shop!=='marina'||t.gap===2)&&!t.pose)continue;
  out.push([t.id,tr?[r3(tr.x),r3(tr.z),r3(tr.yaw)]:null,j?j.straps:0,j?Math.round((j.ramp||0)*100)/100:0,j?.cargo||null,j?(j.onTrailer?1:j.inBox?2:0):0,t.gap||0]);}
 return{n:F.n,out};}
/* a buyer's delivery state for one of their vehicles: null, 'queued' (awaiting delivery) or 'active' (being delivered) */
function status(profile,ownedId){const o=(profile?.owned||[]).find(e=>e.id===ownedId);return o?.delivery?o.delivery.state:null;}
/* notices for a buyer since a given job id (the game shows each once) */
function noticesFor(sim,key){const F=fleetOf(sim);return F?F.notices.filter(n=>n.customer===key):[];}
/* parked rigs are solid where they stand (boxes the world already holds, switched on while the team is home) */
function solids(sim){const F=fleetOf(sim);if(!F)return[];return F.teams.filter(t=>!t.job).map(t=>({id:t.id,trailer:t.trailer}));}
/* single player: the player is the only buyer */
function stepSolo(sim,dt){if(!sim||!sim.world||sim.onlineRoom)return;/* V13.2: your hangar (number 1 when playing alone) and its doors */try{Hg()?.stepSolo(sim,dt);}catch(e){}step(sim,dt,[{key:'player',name:sim.profile?.displayName||'Player',profile:sim.profile,actor:sim.player,dirty:()=>{sim.dirty=true;}}],{teams:Dl().FLEET_DEFAULT});}
return{init,step,stepSolo,view,status,noticesFor,solids,destination,rig,rigPose,parkedTrailer,teamCount,mk,at,heading,lay,round,arcFrom,roadRoute,abort};
});
