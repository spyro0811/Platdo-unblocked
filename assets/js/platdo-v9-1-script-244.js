
/* PLATDO City food delivery (V5.1). Game only, single player for now.
 * - The phone app: browse the real restaurants (city-restaurants.js), search, categories, cart, checkout with
 *   Standard ($2) or Express ($5) delivery, live tracking with a map, order history.
 * - One order at a time, always to the player's home (the mansion when it is owned, the starter home otherwise).
 * - A driver takes it there by road. Near the player the driver is a real vehicle moved along the route by this
 *   file (it cannot be stolen: the vehicle carries the delivery flag); far away only the position is tracked.
 * - The bag waits on the doorstep until the player picks it up (the enter-vehicle key), then the whole order is
 *   eaten at once in one silly animation. Nothing goes into the food bag.
 * V5.7: the app is called DingDash and has a light look with the bag as its logo; the player now steps up to the
 *   bag, lifts it, reaches in and smears the food over their face, then wipes it off with both hands (the bag
 * Saved in profile.delivery: the order (status, progress, items) and the history. The route is worked out again
 * after a load. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const Eat=()=>root.CityRestaurants;
const PREP=18,SPEED={standard:9.5,express:15},FEE={standard:2,express:5},NEAR=190,FAR=250,LANE=3.6,FEAST=8.9,REACH=.5,/* V7.6 */CAREFUL=3.5,RECKLESS=2.5,PHOTOS=5;
const NAMES=['Ravi','Nora','Dmitri','Lucia','Kenji','Amara','Tobias','Mei','Omar','Greta','Felix','Zuri','Mateo','Ingrid','Jalen','Priya','Hugo','Selma','Andre','Yuki','Bruno','Hana','Ezra','Paloma','Niko','Leila','Caleb','Suri','Viktor','Tess','Idris','Maren','Jonas','Asha','Rhys','Nadia','Emil','Kiona','Theo','Farah','Lars','Bianca'];
const CATS=[['all','All'],['burger','Burgers'],['chicken','Chicken'],['pizza','Pizza'],['taco','Mexican'],['coffee','Coffee and drinks'],['donut','Donuts and breakfast'],/* V6.4 */['sandwich','Sandwiches'],['dessert','Ice cream'],['store','Snacks and store']];
const view={page:'home',cat:'all',q:'',brand:null,cart:{},cartBrand:null,option:'standard',note:''};
let live=null,ghost=null,bagMesh=null,carBagMesh=null,audioRef=null,tickClock=0,mapArt=null,feastOwn=false,feastWipe=false;
function state(sim){const p=sim?.profile;if(!p)return null;if(!p.delivery||typeof p.delivery!=='object')p.delivery={order:null,history:[]};if(!Array.isArray(p.delivery.history))p.delivery.history=[];const d=p.delivery;
 /* V7.7: a photo kept in the save itself (V7.6) is moved to the photo store: a save may not hold text that long */for(const q of[d.order,...d.history])if(q&&typeof q.photo==='string'&&q.photo.startsWith('data:')){if(q.id)keepPhoto(q.id,q.photo);q.photo=q.id?'ddp:'+q.id:null;}
 return d;}
// V7.7: the photos themselves, outside the save (the newest five), by order id
const PHOTO_KEY='platdo:city:dingdash-photos:v1';let photoCache=null;
function photoStore(){if(photoCache)return photoCache;try{const raw=root.localStorage?.getItem(PHOTO_KEY),v=raw?JSON.parse(raw):null;photoCache=v&&typeof v==='object'&&Array.isArray(v.order)&&v.pics?v:{order:[],pics:{}};}catch(e){photoCache={order:[],pics:{}};}return photoCache;}
function keepPhoto(id,url){const s=photoStore();s.order=s.order.filter(k=>k!==id);s.order.unshift(id);s.pics[id]=url;for(const k of s.order.slice(PHOTOS))delete s.pics[k];s.order=s.order.slice(0,PHOTOS);try{root.localStorage?.setItem(PHOTO_KEY,JSON.stringify(s));}catch(e){}}
function photoOf(id){if(!id)return null;return photoStore().pics[String(id).replace(/^ddp?:/,'')]||null;}
// The places that deliver: every restaurant, and the open 6-7 store nearest the player's home.
const brandOf=id=>Eat()?.brand(id)||root.CitySixSeven?.brand?.(id)||null,itemOf=id=>Eat()?.item(id)||null;
const listed=sim=>[...(Eat()?.BRANDS||[]),...(root.CitySixSeven?.brands?.(sim)||[])];
// ---- where things are ---------------------------------------------------------------------------------------
function home(sim){const w=sim.world,marks=root.CityWorldMap?.landmarks(w)||[],owned=root.PlatdoHomeEntitlements?.getState?.().state==='owned';
 const m=owned&&marks.find(q=>q.id==='mansion')||marks.find(q=>q.id==='safehouse-1')||marks.find(q=>q.type==='safehouse');if(!m)return null;
 const door={x:m.entrance.x,z:m.entrance.z},kerb={x:m.approach.x,z:m.approach.z};return{id:m.id,name:m.name,door,kerb};}
/* V7.6: the driver's vehicle waits in the place's own car park, backed into the first free bay (the car park keeps its
 * first bay free), so it drives straight out onto the street behind the row */
function lotOf(sim,id){return(sim.world.parkingLots||[]).find(l=>l.place===id)||null;}
function bayOf(sim,s,vid){const l=lotOf(sim,s.id);if(!l?.bays?.length)return null;const free=b=>!sim.vehicles.some(v=>v.id!==vid&&Math.hypot(v.x-b.x,v.z-b.z)<2.2);const b=l.bays.find(free)||l.bays[0];return{x:b.x,z:b.z,lot:l};}
function buildRoute(sim,brandId,vid){const w=sim.world,s=w.serviceById?.[brandId],h=home(sim);if(!s||!h)return null;const bay=bayOf(sim,s,vid),from=bay?{x:bay.x,z:bay.lot.z0+(bay.lot.dir||-1)*.6}:{x:(s.approach||s.entrance).x,z:(s.approach||s.entrance).z},to=h.kerb;
 const d=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),find=(a,b)=>{try{return(w.route(a,b,'road')||[]).map(n=>({x:n.x,z:n.z}));}catch(e){return[];}},len=q=>q.reduce((s,p,i)=>i?s+d(p,q[i-1]):0,0);
 let nodes,join=null;
 if(bay){/* onto the nearest road the car park opens onto, then whichever way along it is shorter */let best=null;for(const r of w.roads||[]){if(!r.a||!r.b)continue;const dx=r.b.x-r.a.x,dz=r.b.z-r.a.z,L2=dx*dx+dz*dz;if(!L2)continue;const t=clamp(((from.x-r.a.x)*dx+(from.z-r.a.z)*dz)/L2,0,1),x=r.a.x+dx*t,z=r.a.z+dz*t,g=Math.hypot(from.x-x,from.z-z);if(!best||g<best.g)best={g,x,z,r};}
  if(best&&best.g<30){join={x:best.x,z:best.z};const ways=[best.r.a,best.r.b].map(e=>{const q=find({x:e.x,z:e.z},to);if(q.length&&d(q[0],e)>1)q.unshift({x:e.x,z:e.z});return{q,cost:d(join,e)+len(q)+d(q[q.length-1]||e,to)};}).filter(k=>k.q.length).sort((a,b)=>a.cost-b.cost);nodes=ways[0]?.q||find(join,to);}}
 if(!nodes){nodes=find(from,to);if(nodes.length>1&&d(from,nodes[1])<d(nodes[0],nodes[1]))nodes.shift();}
 if(nodes.length>1&&d(to,nodes[nodes.length-2])<d(nodes[nodes.length-1],nodes[nodes.length-2]))nodes.pop();
 const keep=bay?2:0,raw=[...(bay?[{x:bay.x,z:bay.z}]:[]),from,...(join?[join]:[]),...nodes,to].filter((p,i,a)=>!i||d(p,a[i-1])>.5);if(raw.length<2)raw.push({x:to.x+.6,z:to.z});
 return{raw,...lay(raw,keep),home:h,from,bay,keep};}
// Keeps a line of road corners to the right-hand lane (the game's traffic drives on the right, 3.7 m from the middle).
// (V7.6: the first k0 and the last k1 points, the ones in a car park, stay where they are.)
function lay(raw,k0=0,k1=0){const d=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),pts=raw.map((p,i)=>{const a=raw[Math.max(0,i-1)],b=raw[Math.min(raw.length-1,i+1)];let fx=b.x-a.x,fz=b.z-a.z;const L=Math.hypot(fx,fz)||1;fx/=L;fz/=L;const k=i<Math.max(1,k0)||i>raw.length-1-Math.max(1,k1)?0:LANE;return{x:p.x-fz*k,z:p.z+fx*k};});
 const cum=[0];for(let i=1;i<pts.length;i++)cum.push(cum[i-1]+d(pts[i],pts[i-1]));return{pts,cum,length:cum[cum.length-1]};}
function at(route,s){s=clamp(s,0,route.length);let i=1;while(i<route.cum.length-1&&route.cum[i]<s)i++;const a=route.pts[i-1],b=route.pts[i],t=(s-route.cum[i-1])/Math.max(.001,route.cum[i]-route.cum[i-1]);return{x:mix(a.x,b.x,t),z:mix(a.z,b.z,t)};}
function pose(route,s,back){const p=at(route,s),a=at(route,s-3),b=at(route,s+3);let yaw=Math.atan2(b.x-a.x,b.z-a.z);if(back)yaw=wrap(yaw+Math.PI);return{x:p.x,z:p.z,yaw};}
/* V7.6: a place on the route moved sideways by off metres (to the right of the way it runs); slope is how fast the
 * offset changes per metre driven, which turns the vehicle a little towards where it is going */
function offPose(route,s,off,slope){const p=pose(route,s);return{x:p.x-Math.cos(p.yaw)*off,z:p.z+Math.sin(p.yaw)*off,yaw:wrap(p.yaw-Math.atan(clamp(slope||0,-1.2,1.2)))};}
// ---- drivers -------------------------------------------------------------------------------------------------
function driverFor(sim,brandId,orderId){const n=hash(brandId+':'+orderId),bi=(Eat()?.BRANDS||[]).findIndex(b=>b.id===brandId),slot=n%7,name=NAMES[(Math.max(0,bi)*7+slot)%NAMES.length],V=root.CityVehicles,defs=V?.definitions||[];
 const car=defs.filter(d=>d.kind==='car'&&d.category==='land'&&!/police|sentinel|mercy|haul|truck|bus/i.test(d.id)&&(d.topSpeed||40)<52).map(d=>d.id),moto=defs.filter(d=>d.kind==='bike'&&!d.pedalOnly&&!d.electric).map(d=>d.id),pedal=defs.filter(d=>d.kind==='bike'&&d.pedalOnly).map(d=>d.id),scoot=defs.filter(d=>d.kind==='bike'&&!d.pedalOnly&&(d.electric||/scoot|skipper/i.test(d.id+' '+(d.name||'')))).map(d=>d.id);
 const pools=[car,moto,pedal,scoot].filter(q=>q.length),pool=pools[hash(name+brandId)%Math.max(1,pools.length)]||['pebble'],type=pool[hash(name)%pool.length],def=V?.byId?.[type];
 /* V7.6: a rating for this driver on this order: 15 in 100 are under 2.5 (reckless), 15 more under 3.5, the rest 3.5 to 5 */
 const u=(hash(name+':'+orderId+':rating')%1000)/1000,rating=Math.round((u<.15?1.2+u/.15*1.3:u<.3?2.5+(u-.15)/.15:3.5+(u-.3)/.7*1.5)*10)/10;
 return{name,type,what:def?.name||'vehicle',appearance:hash(name+brandId),rating};}
const rateWord=r=>r>=4.5?'Top rated':r>=CAREFUL?'Good driver':r>=RECKLESS?'A bit careless':'Drives like a maniac',rateKind=r=>r>=4.5?'top':r>=CAREFUL?'ok':r>=RECKLESS?'meh':'bad';
const rateChip=r=>Number.isFinite(r)?'<span class="dd-rate '+rateKind(r)+'"><b>★ '+r.toFixed(1)+'</b><small>'+rateWord(r)+'</small></span>':'';
// ---- placing an order ---------------------------------------------------------------------------------------
function cartRows(){return Object.entries(view.cart).map(([id,n])=>[itemOf(id),n]).filter(r=>r[0]&&r[1]>0);}
/* V8.6: the fee grows with the road distance from the restaurant to your home (looked up at most every 5 seconds) */
const feeMetres=new Map();function routeMetres(sim,brandId){if(!sim||!brandId)return 0;const c=feeMetres.get(brandId),now=Date.now();if(c&&now-c.at<5000)return c.m;const r=buildRoute(sim,brandId),m=r&&Number.isFinite(r.length)?r.length:0;feeMetres.set(brandId,{at:now,m});return m;}
function feeFor(option,metres){const k=Math.max(0,Number(metres)||0)/1000;return option==='express'?Math.round(4+k*12):Math.round(2+k*8);}
function totals(sim){const rows=cartRows(),subtotal=rows.reduce((s,[it,n])=>s+it.price*n,0),fee=feeFor(view.option==='express'?'express':'standard',routeMetres(sim,view.cartBrand));return{rows,subtotal,fee,total:subtotal+fee};}
function estimate(sim,brandId,option){const r=buildRoute(sim,brandId);return r?{seconds:PREP+r.length/SPEED[option||'standard']+10,metres:r.length}:null;}
function place(sim){const d=state(sim),t=totals(sim);if(!d)return{ok:false,message:'No save to charge.'};if(sim.onlineRoom)return{ok:false,message:'Delivery is not in multiplayer rooms yet.'};
 if(d.order)return{ok:false,message:'Eat your food before ordering more!'};if(!t.rows.length)return{ok:false,message:'Your cart is empty.'};const brand=brandOf(view.cartBrand);if(!brand)return{ok:false,message:'That restaurant is closed.'};
 const route=buildRoute(sim,brand.id);if(!route)return{ok:false,message:'No road to your home from there.'};if(!(sim.profile.wallet>=t.total))return{ok:false,message:'You need '+t.total+' dollars for this order.'};
 const id=sim.uid('order');if(!sim.commit('delivery:'+id,-t.total,'Delivery: '+brand.name))return{ok:false,message:'The payment did not go through.'};
 const who=driverFor(sim,brand.id,id);
 d.order={id,brand:brand.id,items:t.rows.map(([it,n])=>({id:it.id,n})),subtotal:t.subtotal,fee:t.fee,express:view.option==='express',total:t.total,status:'cooking',t:0,progress:0,length:route.length,driver:who.name,vehicle:who.type,vehicleName:who.what,look:who.appearance,rating:who.rating,bag:null};
 d.history.unshift({id,brand:brand.id,total:t.total,items:d.order.items,day:Math.floor(sim.time),driver:who.name,rating:who.rating,vehicleName:who.what});d.history.length=Math.min(d.history.length,12);
 view.cart={};view.cartBrand=null;live=null;sim.dirty=true;return{ok:true,message:'Order placed with '+brand.name+'.'};}
function remaining(sim){const o=state(sim)?.order;if(!o)return null;const v=SPEED[o.express?'express':'standard'];if(o.status==='cooking')return Math.max(0,PREP-o.t)+o.length/v+10;if(o.status==='driving')return Math.max(0,o.length-o.progress)/v+10;if(o.status==='arriving')return Math.max(1,10-o.t);return 0;}
// ---- the driver in the world --------------------------------------------------------------------------------
function removeVehicle(sim,id){const i=sim.vehicles.findIndex(v=>v.id===id);if(i>=0)sim.vehicles.splice(i,1);}
function removeWalker(sim,id){const i=sim.npcs.findIndex(n=>n.id===id);if(i>=0)sim.npcs.splice(i,1);}
function tidy(sim,keep){for(const v of sim.vehicles.filter(v=>v.delivery&&String(v.id).startsWith('delivery-')&&!keep.includes(v.id)))removeVehicle(sim,v.id);for(const n of sim.npcs.filter(n=>String(n.id).startsWith('delivery-walker')&&!keep.includes(n.id)))removeWalker(sim,n.id);}
function seatDriver(v,g,on){if(!v.seatOccupants)return;v.seatOccupants[0]=on?'delivery-driver:'+v.id:null;if(on)v.driverAppearance=(root.CityPeople?.catalog||[])[g.look%Math.max(1,(root.CityPeople?.catalog||[]).length)];}
// Moves a real vehicle along the route by hand: no engine, no physics, the game's own model and wheels.
function scripted(sim,g,p,dt,moving){
 let v=sim.vehicles.find(q=>q.id===g.vid);
 if(!v){try{v=sim.spawnVehicle(g.type,g.vid,{x:p.x,z:p.z,yaw:p.yaw},{delivery:true});}catch(e){v=null;}if(!v)return null;v.delivery=true;v.workshopControlled=true;v.engine=true;seatDriver(v,g,!g.walking);v.x=p.x;v.z=p.z;v.yaw=p.yaw;}
 v.workshopControlled=true;v.delivery=true;/* V5.7: nothing wears it down */if(!(g.health>0))g.health=v.health;else if(v.health<g.health)v.health=g.health;
 const w=sim.world,L=Math.max(1.6,(v.length||4)*.62),sy=Math.sin(p.yaw),cy=Math.cos(p.yaw),ref=(Number.isFinite(v.y)?v.y:0)+2.5,gh=(x,z)=>w.groundHeight(x,z,ref),hf=gh(p.x+sy*L/2,p.z+cy*L/2),hb=gh(p.x-sy*L/2,p.z-cy*L/2),y=Math.max(gh(p.x,p.z),(hf+hb)/2);
 const dist=Math.hypot(p.x-v.x,p.z-v.z),turn=wrap(p.yaw-v.yaw);
 v.vx=(p.x-v.x)/Math.max(dt,.001);v.vz=(p.z-v.z)/Math.max(dt,.001);v.speed=moving?dist/Math.max(dt,.001):0;v.x=p.x;v.z=p.z;v.y=y;v.vy=0;v.yaw=p.yaw;v.pitch=Math.atan2(hf-hb,L);v.yawRate=turn/Math.max(dt,.001);
 v.roll=v.kind==='bike'||root.CityVehicles?.byId?.[v.typeId]?.kind==='bike'?clamp(v.yawRate*v.speed/15,-.5,.5):0;v.steer=clamp(turn*6,-.5,.5);v.wheelSpin=(v.wheelSpin||0)+(moving?dist:0)/.34;
 if(v.visual){v.visual.wheelSpin=v.wheelSpin;v.visual.steer=v.steer;v.visual.reverse=false;v.visual.brake=!moving;}v.grounded=true;v.engine=true;v.throttle=moving?.4:0;if(v.bikeBalance){v.bikeBalance.frontContact=v.bikeBalance.rearContact=true;v.bikeBalance.relativePitch=0;}
 return v;}
// V7.6: points round a vehicle (at(f,r): f metres ahead, r metres to its right): the driver's door, where the bag goes
// in (the passenger door of a car, the back of a bike) and the way round from there to the driver's door.
function sides(v){const D=root.CityVehicles?.byId?.[v.typeId],bike=D?.kind==='bike'||v.kind==='bike',sy=Math.sin(v.yaw||0),cy=Math.cos(v.yaw||0),L=(v.length||D?.length||4.4)/2,W=(v.width||D?.width||1.8)/2,at=(f,r)=>({x:v.x+sy*f-cy*r,z:v.z+cy*f+sy*r}),driver=at(bike?-.1:.1,-(W+.7));
 return{bike,L,W,driver,load:bike?at(-(L+.6),0):at(.1,W+.7),round:bike?[at(-(L+.6),-(W+.5)),driver]:[at(L*.55,W+.9),at(L+1.1,0),at(L*.55,-(W+.9)),driver]};}
// V7.6: on foot between a vehicle in the car park behind a place and the place's rack inside its front door: through
// the passage beside the building on the side nearer the vehicle, along the front, in at the door.
function footPath(sim,s,from,rk){const door={x:s.entrance.x,z:s.entrance.z},front=s.z+s.d/2,back=s.z-s.d/2,pts=[{x:from.x,z:from.z}];
 if(from.z<back-.5){const row=(sim.world.services||[]).filter(q=>q!==s&&q.w&&Math.abs(q.z-s.z)<14),we=s.x-s.w/2,ee=s.x+s.w/2,west=Math.max(-1e9,...row.filter(q=>q.x<s.x).map(q=>q.x+q.w/2)),east=Math.min(1e9,...row.filter(q=>q.x>s.x).map(q=>q.x-q.w/2)),opts=[];
  if(we-west>=1.6)opts.push(we-Math.min((we-west)/2,2.5));if(east-ee>=1.6)opts.push(ee+Math.min((east-ee)/2,2.5));
  const gx=opts.sort((a,b)=>Math.abs(a-from.x)-Math.abs(b-from.x))[0]??(Math.abs(we-from.x)<Math.abs(ee-from.x)?we-1.2:ee+1.2);
  pts.push({x:gx,z:back-1.3},{x:gx,z:front+2.2},{x:door.x,z:front+2.2});}
 pts.push(door,{x:door.x,z:front-1.35},{x:rk.x,z:rk.z-.8});return pts;}
function walkPath(sim,g,n,dt,speed){const path=g.path;if(!path?.length)return true;g.pi=g.pi||0;while(g.pi<path.length-1&&walkTo(sim,g,n,path[g.pi],dt,speed))g.pi++;return g.pi>=path.length-1&&walkTo(sim,g,n,path[path.length-1],dt,speed);}
/* V7.6: where to drive past whatever is ahead: the side offset to aim for (metres to the right of the lane's middle) and
 * how much of the normal speed to keep. A careful driver (rating 3.5 and up) looks far ahead, keeps a wide berth from
 * people and slows down past them; a so-so driver (2.5 to 3.5) looks late and leaves little room, so some people get
 * hit; a reckless one (under 2.5) steers only round vehicles and drives through people. Nobody overtakes moving
 * traffic: a vehicle going the same way is followed. */
function avoid(sim,g,v,p,rate){
 const careful=rate>=CAREFUL,reckless=rate<RECKLESS,sy=Math.sin(p.yaw),cy=Math.cos(p.yaw),spd=Math.max(5,Math.abs(v.speed||0)),half=(v.width||root.CityVehicles?.byId?.[v.typeId]?.width||1.9)/2,reach=careful?8+spd*1.2:3+spd*.4,room=careful?1:.1,cur=g.off||0,obs=[];
 const tail=-((v.length||root.CityVehicles?.byId?.[v.typeId]?.length||4.4)/2+1),add=(o,ext,person,same,oncoming)=>{const dx=o.x-p.x,dz=o.z-p.z,f=dx*sy+dz*cy,s=-dx*cy+dz*sy+cur;if(f>tail&&f<reach)obs.push({f,s,ext,person,same,oncoming});};
 for(const o of sim.vehicles){if(o===v||Math.abs((o.y||0)-(v.y||0))>3)continue;const D=root.CityVehicles?.byId?.[o.typeId],rel=Math.abs(Math.sin(wrap((o.yaw||0)-p.yaw))),ext=rel*((o.length||D?.length||4.4)/2)+(1-rel)*((o.width||D?.width||1.8)/2)+.3,vx=o.vx||0,vz=o.vz||0,go=Math.hypot(vx,vz)>1.5,along=vx*sy+vz*cy;add(o,ext,false,go&&along>0,go&&along<=0);}
 if(!reckless){for(const n of sim.npcs){if(!(n.health>0)||n.vehicleId||n.ragdoll?.active||n.id===g.wid)continue;if(!careful&&(hash(n.id+':'+g.vid)%100)/100<(CAREFUL-rate)*.6)continue;add(n,.4,true,false,false);}const pl=sim.player;if(pl&&pl.health>0&&pl.mode==='onFoot')add(pl,.4,true,false,false);}
 let k=1;const fixed=obs.filter(o=>!o.same);
 for(const o of obs)if(o.same&&Math.abs(o.s-cur)<half+o.ext)k=Math.min(k,clamp((o.f-7)/12,0,1));
 const clear=c=>fixed.every(o=>Math.abs(o.s-c)>=half+o.ext+room*(o.person?1:.6));let best=null,cost=1e9;
 for(let c=-5;c<=1.21;c+=.25){if(!clear(c))continue;const q=Math.abs(c)+Math.abs(c-cur)*.4;if(q<cost){cost=q;best=c;}}
 if(best===null){const hit=fixed.filter(o=>Math.abs(o.s-cur)<half+o.ext+.2).sort((a,b)=>a.f-b.f)[0];if(hit)k=Math.min(k,careful?(hit.f<4+spd*.6?0:.45):(hit.f<2.5?0:.85));return{off:cur,k};}
 if(careful&&fixed.some(o=>o.person&&o.f<14&&Math.abs(o.s-best)<half+o.ext+2.2))k=Math.min(k,.6);
 return{off:best,k};}
/* V7.6: the game's own bumping does not act for a vehicle moved by hand, so the vehicle does it itself through the
 * game's own impact (the one a car in traffic uses). A so-so driver who runs into someone knocks them down; a reckless
 * one kills them. The hit is the vehicle's, not the player's, so it never raises your wanted level. */
function bump(sim,g,v,lethal){const spd=Math.abs(v.speed||0);if(spd<2.5)return;const D=root.CityVehicles?.byId?.[v.typeId],L=(v.length||D?.length||4.4)/2,W=(v.width||D?.width||1.8)/2,sy=Math.sin(v.yaw),cy=Math.cos(v.yaw);g.hit=g.hit||{};
 for(const n of sim.npcs){if(!(n.health>0)||n.vehicleId||g.hit[n.id]||n.id===g.wid||n.ragdoll?.active)continue;const dx=n.x-v.x,dz=n.z-v.z,f=dx*sy+dz*cy,s=-dx*cy+dz*sy;if(f<-L||f>L+.6||Math.abs(s)>W+.4||Math.abs((n.y||0)-(v.y||0))>2.5)continue;g.hit[n.id]=1;
  const id='dingdash-hit:'+g.vid+':'+n.id,point={x:n.x,y:(n.y||0)+1,z:n.z},direction={x:sy*spd+(-cy)*Math.sign(s||1)*1.5,y:lethal?3.2:2,z:cy*spd+sy*Math.sign(s||1)*1.5};
  try{sim.applyImpact(n,{id,source:'vehicle',instigator:g.vid,point,direction,velocity:direction,impulse:spd*(lethal?70:38),baseDamage:lethal?400:26,body:'torso',time:sim.time});}catch(e){}
  if(lethal&&n.health>0)try{sim.damage(n,400,id+':end',g.vid,{point,body:'torso',region:'torso',impactSource:'vehicle',direction,impulse:spd*70});}catch(e){}}}
function blocked(sim,v,yaw){const sy=Math.sin(yaw),cy=Math.cos(yaw),reach=5+Math.abs(v.speed||0)*.7;
 const ahead=(o,side)=>{const dx=o.x-v.x,dz=o.z-v.z,f=dx*sy+dz*cy,s=Math.abs(dx*cy-dz*sy);return f>1&&f<reach&&s<side;};
 if(sim.vehicles.some(o=>o!==v&&Math.abs((o.y||0)-(v.y||0))<3&&ahead(o,2.4)))return true;const pl=sim.player;if(pl&&pl.health>0&&pl.mode==='onFoot'&&ahead(pl,1.7))return true;return sim.npcs.some(n=>n.health>0&&!n.vehicleId&&ahead(n,1.4));}
function walker(sim,g,from){let n=sim.npcs.find(q=>q.id===g.wid);if(n)return n;const cat=root.CityPeople?.catalog||[];try{n=sim.spawnNPC({id:g.wid,x:from.x,y:sim.world.groundHeight(from.x,from.z,(sim.player.y||0)+3),z:from.z,role:'civilian',name:g.name,appearance:cat[g.look%Math.max(1,cat.length)],mode:'walk'});if(n)n.carriedProp='bag';}catch(e){n=null;}/* V8.9: the courier cannot be hurt or knocked down */if(n){n.dingdash=true;n.noRagdoll=true;}return n||null;}
// The walking driver's place is kept here (g.wpos) and written onto the character every step, because the game's
// own pedestrian routine also moves every civilian and would otherwise pull the driver off course.
function walkTo(sim,g,n,target,dt,speed){const q=g.wpos||(g.wpos={x:n.x,z:n.z}),tx=target.x-q.x,tz=target.z-q.z,d=Math.hypot(tx,tz),done=d<.35;
 /* V5.7: nothing knocks a delivery driver over */if(n.physical){n.physical=null;if(n.ragdoll)n.ragdoll.active=false;}
 if(!done){let ax=tx/d,az=tz/d;
  /* V5.7: round a vehicle standing on the straight line to the target, not through it: head for a point beside
   * it, on the side the line already passes, until the line is clear */
  if(speed>0){let near=null;for(const v of sim.vehicles){if(v.id===g.vid||Math.abs((v.y||0)-(n.y||0))>3)continue;const r=Math.hypot((v.length||4.4)/2,(v.width||1.8)/2)+.45,cx=v.x-q.x,cz=v.z-q.z,along=cx*ax+cz*az,side=cx*az-cz*ax;if(along<-r||along>d||Math.abs(side)>=r||Math.hypot(target.x-v.x,target.z-v.z)<r)continue;if(!near||along<near.along)near={along,side,r,v};}
   if(near){const s=near.side>=0?-1:1,wx=near.v.x+az*s*(near.r+.3),wz=near.v.z-ax*s*(near.r+.3),L=Math.hypot(wx-q.x,wz-q.z)||1;ax=(wx-q.x)/L;az=(wz-q.z)/L;}}
  const step=Math.min(d,speed*dt);q.x+=ax*step;q.z+=az*step;n.yaw=Math.atan2(ax,az);}
 n.x=q.x;n.z=q.z;n.y=sim.world.groundHeight(q.x,q.z,(n.y||0)+1.2);n.speed=done?0:speed;n.vx=done?0:tx/d*speed;n.vz=done?0:tz/d*speed;n.walkRoute=[];n.routine=null;n.journey=null;return done;}
// One step of the delivery. quiet=true while the phone app is open (the City is paused): only the numbers move.
// ---- V6.8: the DingDash rack, and the receipt on every bag ---------------------------------------------------
// Every place that delivers (the fifteen fast-food places and every 6-7) has a DingDash rack just inside its front
// wall. While an order cooks, a worker carries the bag from the kitchen to the rack; the driver leaves the vehicle,
// comes in, takes the bag off the rack and carries it out, and only then drives off. All of that is only played
// out when you are near enough to see it; otherwise the order moves on by the clock as before.
// Each bag carries a receipt: who it is for, the house it goes to, what is in it and what it cost.
const racks=new Map(),receipts=new Map();let slipOn=null;
const delivers=s=>s&&(s.type==='six-seven'||s.type==='restaurant'&&!!Eat()?.brand(s.id)&&!Eat().brand(s.id).sit);
const rackSpot=s=>s._ddRack||(s._ddRack={x:s.x+(s.type==='six-seven'?-3.6:7.2),y:s.y,z:s.z+s.d/2-.55});
function makeBag(T){
 const g=new T.Group(),paper=new T.MeshLambertMaterial({color:0xc79f63}),dark=new T.MeshLambertMaterial({color:0x3b2a17}),cord=new T.MeshLambertMaterial({color:0x8a6a3c}),mark=new T.MeshLambertMaterial({color:0x19a48f}),white=new T.MeshLambertMaterial({color:0xf4fbf9});
 const add=(geometry,material,x,y,z)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);g.add(m);return m;};
 add(new T.BoxGeometry(.26,.3,.15),paper,0,.15,0);add(new T.BoxGeometry(.225,.006,.115),dark,0,.299,0);
 /* the logo is on the back now: the receipt is stapled to the front */add(new T.BoxGeometry(.105,.105,.004),mark,0,.15,-.0765);add(new T.BoxGeometry(.05,.05,.003),white,0,.142,-.0792);
 for(const e of[-1,1])add(new T.TorusGeometry(.055,.0045,6,12,Math.PI),cord,0,.3,e*.042);
 const slip=new T.Mesh(new T.PlaneGeometry(.2,.3),new T.MeshBasicMaterial({color:0xfffdf6}));slip.position.set(0,.165,.0762);slip.name='dd-receipt';g.add(slip);
 return g;
}
// The receipt of an order, painted once: the player's name, the house, every line of the order and the total.
function receiptFor(T,sim,o){
 if(!o)return null;let t=receipts.get(o.id);if(t)return t;const doc=root.document;if(!doc)return null;
 const c=doc.createElement('canvas');c.width=400;c.height=600;const x=c.getContext('2d'),h=home(sim),b=brandOf(o.brand),name=String(sim.profile?.displayName||'Player').slice(0,22);
 let where=h?h.name:'Home';try{const dz=h&&sim.world.districtAt?.(h.door.x,h.door.z);if(dz?.name)where+=', '+dz.name;}catch(e){}
 x.fillStyle='#fffdf6';x.fillRect(0,0,400,600);x.fillStyle='#19a48f';x.fillRect(0,0,400,74);x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.font='900 44px "Arial Black","Segoe UI",sans-serif';x.fillText('DingDash',200,39);
 x.fillStyle='#1d2b29';x.font='700 22px "Segoe UI",sans-serif';x.fillText((b?.name||'Order')+'  \u{B7}  #'+String(o.id).split('-').pop(),200,100);
 x.textAlign='left';let y=140;const label=(k,v,big)=>{x.fillStyle='#5f6f6c';x.font='700 17px "Segoe UI",sans-serif';x.fillText(k,24,y);x.fillStyle='#10201d';x.font=(big?'900 30px':'700 22px')+' "Segoe UI",sans-serif';x.fillText(v,24,y+(big?30:26),352);y+=big?66:58;};
 label('FOR',name,true);label('DELIVER TO',where.slice(0,34),false);
 const rule=()=>{x.strokeStyle='#9aa8a5';x.setLineDash([6,5]);x.beginPath();x.moveTo(24,y);x.lineTo(376,y);x.stroke();x.setLineDash([]);y+=22;};rule();
 const rows=(o.items||[]).map(r=>[itemOf(r.id),r.n]).filter(r=>r[0]),shown=rows.slice(0,6);x.font='600 20px "Segoe UI",sans-serif';
 for(const[it,n]of shown){x.fillStyle='#10201d';x.textAlign='left';x.fillText(n+' \u{D7} '+it.name,24,y,270);x.textAlign='right';x.fillText('$'+it.price*n,376,y);y+=29;}
 if(rows.length>shown.length){x.textAlign='left';x.fillStyle='#5f6f6c';x.fillText('+ '+(rows.length-shown.length)+' more',24,y);y+=29;}
 y+=4;rule();x.font='600 19px "Segoe UI",sans-serif';x.fillStyle='#3a4a47';x.textAlign='left';x.fillText('Food',24,y);x.textAlign='right';x.fillText('$'+o.subtotal,376,y);y+=27;x.textAlign='left';x.fillText(o.express?'Express delivery':'Delivery',24,y);x.textAlign='right';x.fillText('$'+o.fee,376,y);y+=36;
 x.fillStyle='#10201d';x.font='900 32px "Segoe UI",sans-serif';x.textAlign='left';x.fillText('TOTAL',24,y);x.textAlign='right';x.fillText('$'+o.total,376,y);y+=40;
 x.font='600 17px "Segoe UI",sans-serif';x.fillStyle='#5f6f6c';x.textAlign='center';x.fillText('Driver: '+(o.driver||'')+'  \u{B7}  Paid in the app',200,Math.min(578,y+8));
 t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;receipts.set(o.id,t);if(receipts.size>4){const k=receipts.keys().next().value;receipts.get(k).dispose();receipts.delete(k);}return t;
}
const setReceipt=(bag,tex)=>{const m=bag?.getObjectByName('dd-receipt');if(m&&tex&&m.material.map!==tex){m.material.map=tex;m.material.needsUpdate=true;}};
function makeRack(T,doc){
 const g=new T.Group(),steel=new T.MeshLambertMaterial({color:0xc9ced1}),dark=new T.MeshLambertMaterial({color:0x2a3134}),teal=new T.MeshLambertMaterial({color:0x19a48f}),add=(w,h,d,m,x,y,z)=>{const k=new T.Mesh(new T.BoxGeometry(w,h,d),m);k.position.set(x,y,z);g.add(k);return k;};
 for(const ex of[-.56,.56])for(const ez of[-.2,.2])add(.04,1.72,.04,dark,ex,.86,ez);for(const y of[.42,.88,1.34])add(1.16,.03,.44,steel,0,y,0);add(1.16,1.72,.02,dark,0,.86,-.22);add(1.2,.34,.05,teal,0,1.9,-.19);
 if(doc){const c=doc.createElement('canvas');c.width=512;c.height=144;const x=c.getContext('2d');x.fillStyle='#19a48f';x.fillRect(0,0,512,144);x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.font='900 74px "Arial Black","Segoe UI",sans-serif';x.fillText('DingDash',256,60);x.font='700 26px "Segoe UI",sans-serif';x.fillText('ORDERS FOR PICK-UP',256,116);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const s=new T.Mesh(new T.PlaneGeometry(1.16,.32),new T.MeshBasicMaterial({map:t}));s.position.set(0,1.9,-.162);g.add(s);}
 const bag=makeBag(T);bag.position.set(0,.895,.02);bag.visible=false;bag.name='dd-rack-bag';g.add(bag);g.name='dingdash-rack';return g;
}
// The racks near the player, the bag waiting on one of them, and the receipt on the bag in the driver's hand.
function drawRacks(scene,sim,T,o){
 const pl=sim.player,env=scene.environment,doc=root.document,tex=o?receiptFor(T,sim,o):null;
 for(const s of sim.world.services||[]){if(!delivers(s))continue;const near=Math.hypot(pl.x-s.x,pl.z-s.z)<95;let m=racks.get(s.id);
  if(!m){if(!near)continue;m=makeRack(T,doc);const q=rackSpot(s);m.position.set(q.x,q.y,q.z);/* its back to the front wall, its shelves to the room */m.rotation.y=Math.PI;racks.set(s.id,m);}
  if(m.parent!==env)env.add(m);m.visible=near;const bag=m.getObjectByName('dd-rack-bag'),on=!!(near&&o&&live&&live.id===o.id&&live.racked&&o.brand===s.id);bag.visible=on;if(on)setReceipt(bag,tex);}
 // the bag the driver carries is the game's own shopping bag: the receipt is pinned to it while this driver holds it
 const id=live?.wid||ghost?.wid,rig=id&&scene.meshes?.people?.get(id)?.mesh?.userData?.rig,sb=rig?.shoppingBag;
 if(slipOn&&slipOn.parent!==sb){slipOn.parent?.remove(slipOn);slipOn=null;}
 if(sb&&tex&&!slipOn){try{let w=.2,h=.26,z=.08,zb=-.08,cx=0,cy=0;const k=sb.geometry?sb:sb.children?.find(c=>c.geometry);if(k){k.geometry.computeBoundingBox();const bb=k.geometry.boundingBox,own=k===sb,px=own?0:k.position.x,py=own?0:k.position.y,pz=own?0:k.position.z;w=(bb.max.x-bb.min.x)*.74;h=(bb.max.y-bb.min.y)*.7;cx=px+(bb.max.x+bb.min.x)/2;cy=py+(bb.max.y+bb.min.y)/2;z=pz+bb.max.z+.003;zb=pz+bb.min.z-.003;}
  /* one on each broad side, so it shows whichever way the bag swings */const mat=new T.MeshBasicMaterial({map:tex}),front=new T.Mesh(new T.PlaneGeometry(w,h),mat),rear=new T.Mesh(front.geometry,mat);front.position.set(cx,cy,z);rear.position.set(cx,cy,zb);rear.rotation.y=Math.PI;slipOn=new T.Group();slipOn.add(front,rear);slipOn.userData.mat=mat;slipOn.name='dd-slip';sb.add(slipOn);}catch(e){slipOn=null;}}
 else if(slipOn&&tex&&slipOn.userData.mat.map!==tex){slipOn.userData.mat.map=tex;slipOn.userData.mat.needsUpdate=true;}
}
function advance(sim,dt,quiet){
 const d=state(sim);if(!d)return;const o=d.order,pl=sim.player;
 if(!live&&!ghost)tidy(sim,[]);
 if(o&&(o.status==='cooking'||o.status==='driving'||o.status==='arriving')){
  if(!live||live.id!==o.id){const route=buildRoute(sim,o.brand,'delivery-'+o.id);if(!route){o.status='delivered';const h=home(sim);o.bag=h?{x:h.door.x,z:h.door.z}:{x:pl.x,z:pl.z};live=null;}else{live={id:o.id,route,vid:'delivery-'+o.id,wid:'delivery-walker-'+o.id,type:o.vehicle,name:o.driver,look:o.look||0,walking:false,phase:'',hold:0,off:0,/* orders from before V7.6 have no rating: a careful driver */rating:Number.isFinite(o.rating)?o.rating:4.6,inCar:o.status!=='cooking'};o.length=route.length;o.progress=clamp(o.progress||0,0,route.length);}}
 }
 if(o&&live&&live.id===o.id){const g=live,r=g.route,speed=SPEED[o.express?'express':'standard'];
  if(o.status==='cooking'){o.t+=dt;const s=sim.world.serviceById?.[o.brand],rk=delivers(s)?rackSpot(s):null,p=pose(r,0),near=!quiet&&Math.hypot(p.x-pl.x,p.z-pl.z)<NEAR,v=near?scripted(sim,g,p,dt,false):null;if(!quiet&&!near)removeVehicle(sim,g.vid);
   /* V6.8: thirteen seconds before the order is due out, a worker is asked to carry the bag to the DingDash rack (the
    * room's own crew, when you are there to see it). It is on the rack when the worker gets there; with nobody to
    * carry it, six seconds before it is due. */
   if(rk&&!g.racked&&!g.taken&&o.t>=PREP-13){if(!g.asked){g.asked=true;const mine=o.id;g.rackAt=near&&root.CityDiningPlay?.rackJob?.(o.brand,rk,()=>{if(live&&live.id===mine&&!live.taken)live.racked=true;})?PREP+5:PREP-6;}if(o.t>=g.rackAt)g.racked=true;}
   /* the driver gets out, comes in for the bag and carries it back to the vehicle */
   if(rk&&near&&v&&!g.pick&&!g.taken&&o.t>=PREP-(r.bay?12:3)){g.pick='out';g.pt=0;}
   /* V7.6: from the car park, round the building through the passage beside it, in at the front door to the rack,
    * and back the same way; the bag goes into the vehicle before the driver gets in */
   if(g.pick&&g.pick!=='done'){g.pt+=dt;const S2=v?sides(v):null;let n=sim.npcs.find(q=>q.id===g.wid);
    const back=()=>{removeWalker(sim,g.wid);g.walking=false;g.wpos=null;g.path=null;if(v)seatDriver(v,g,true);g.pick='done';g.racked=false;g.taken=true;g.inCar=true;};
    if(!near||!v||g.pt>75)back();
    else if(g.pick==='out'){if(g.pt>.8){g.walking=true;seatDriver(v,g,false);g.wpos={x:S2.driver.x,z:S2.driver.z};n=walker(sim,g,S2.driver);if(n){n.carriedProp=null;g.path=footPath(sim,s,S2.driver,rk);g.pi=0;g.pick='toRack';}else back();}}
    else if(!n)back();
    else if(g.pick==='toRack'){n.mode='walk';n.carriedProp=null;if(walkPath(sim,g,n,dt,1.7)){n.mode='idle';g.pick='take';g.pt2=0;}}
    else if(g.pick==='take'){walkTo(sim,g,n,g.path[g.path.length-1],dt,0);n.mode='idle';n.yaw=0;g.pt2+=dt;if(g.racked&&g.pt2>.8||g.pt2>7){g.racked=false;g.taken=true;n.carriedProp='bag';g.path=footPath(sim,s,S2.load,rk).reverse();g.pi=0;g.pick='toCar';}}
    else if(g.pick==='toCar'){n.mode='walk';n.carriedProp='bag';if(walkPath(sim,g,n,dt,1.7)){n.mode='idle';g.pick='load';g.pt2=0;}}
    else if(g.pick==='load'){walkTo(sim,g,n,S2.load,dt,0);n.mode='idle';n.yaw=Math.atan2(v.x-n.x,v.z-n.z);g.pt2+=dt;if(g.pt2>.7&&n.carriedProp){n.carriedProp=null;g.inCar=true;}if(g.pt2>1.3){g.path=[S2.load,...S2.round];g.pi=0;g.pick='toSeat';}}
    else if(g.pick==='toSeat'){n.mode='walk';n.carriedProp=null;if(walkPath(sim,g,n,dt,1.7))back();}}
   if(o.t>=PREP&&(!g.pick||g.pick==='done')){g.racked=false;g.taken=true;g.inCar=true;g.pick=null;o.status='driving';o.t=0;o.progress=0;sim.emit?.('notice',{message:g.name+' is on the way with your food.'});sim.dirty=true;}}
else if(o.status==='driving'){const p0=pose(r,o.progress),dist=Math.hypot(p0.x-pl.x,p0.z-pl.z),rate=g.rating;let v=quiet?null:sim.vehicles.find(q=>q.id===g.vid),k=1,aim=0;
   /* V7.6: round people and stopped vehicles instead of stopping dead behind them; how well depends on the rating */
   if(v){const a=avoid(sim,g,v,offPose(r,o.progress,g.off||0,0),rate);aim=a.off;k=a.k;}
   if(r.length-o.progress<22||o.progress<6)aim=0;
   const was=g.off||0,turn=(rate>=CAREFUL?2.6:3.6)*dt;g.off=was+clamp(aim-was,-turn,turn);
   if(k<.05){g.hold+=dt;if(g.hold>10)k=.2;}else g.hold=0;
   const ds=speed*(rate<RECKLESS?1.15:1)*dt*k*(r.length-o.progress<14?.45:1);o.progress=Math.min(r.length,o.progress+ds);
   if(!quiet){const p=offPose(r,o.progress,g.off,ds>.001?(g.off-was)/ds:0);if(dist<NEAR||v&&dist<FAR){v=scripted(sim,g,p,dt,ds>.001);if(v&&rate<CAREFUL)bump(sim,g,v,rate<RECKLESS);}else removeVehicle(sim,g.vid);}
   if(o.progress>=r.length-.05){o.status='arriving';o.t=0;g.phase='out';g.off=0;sim.dirty=true;}}
  else if(o.status==='arriving'){o.t+=dt;const p=pose(r,r.length),door=r.home.door,near=Math.hypot(p.x-pl.x,p.z-pl.z)<NEAR&&!quiet,v=near?scripted(sim,g,p,dt,false):null;
   const drop=()=>{o.status='delivered';o.t=0;o.bag={x:door.x,z:door.z};/* V7.6: the driver's photo of it, taken on the next frame drawn */o.photoDue=true;g.inCar=false;sim.dirty=true;sim.emit?.('notice',{message:'Your food is at your door. Pick it up and dig in.'});ghost={...g,route:r,progress:r.length,phase:near?'back':'drive',t:0};live=null;};
   if(!near||!v){if(o.t>=10){removeWalker(sim,g.wid);drop();}}
   else{const side={x:v.x+Math.cos(v.yaw)*1.5,z:v.z-Math.sin(v.yaw)*1.5};if(g.phase==='out'){if(o.t>1.1){g.walking=true;seatDriver(v,g,false);g.wpos={x:side.x,z:side.z};const n=walker(sim,g,side);g.phase=n?'walk':'skip';/* the bag comes out of the vehicle with the driver */g.inCar=!n;}}
    else if(g.phase==='walk'){const n=sim.npcs.find(q=>q.id===g.wid);if(!n){g.phase='skip';}else{/* walking with the order in one hand */n.mode='walk';n.carriedProp='bag';if(walkTo(sim,g,n,door,dt,1.7)){n.mode='idle';n.carriedProp=null;g.phase='set';g.t=0;}else if(o.t>34)drop();}}
    else if(g.phase==='set'){g.t=(g.t||0)+dt;const n=sim.npcs.find(q=>q.id===g.wid);if(n){walkTo(sim,g,n,door,dt,0);n.mode='idle';}if(g.t>.9)drop();}
    else if(o.t>4)drop();}}
 }
 // the driver going back after the drop: walk to the vehicle, drive off, vanish once far from the player
 if(ghost&&!quiet){const g=ghost,r=g.route,pl2=sim.player;g.t=(g.t||0)+dt;
  if(g.phase==='back'){const v=sim.vehicles.find(q=>q.id===g.vid),n=sim.npcs.find(q=>q.id===g.wid);if(!v){removeWalker(sim,g.wid);ghost=null;}else{scripted(sim,g,pose(r,r.length),dt,false);const side={x:v.x+Math.cos(v.yaw)*1.5,z:v.z-Math.sin(v.yaw)*1.5};if(!n||walkTo(sim,g,n,side,dt,1.8)||g.t>40){removeWalker(sim,g.wid);g.walking=false;seatDriver(v,g,true);g.phase='turn';g.t=0;}else{n.mode='walk';n.carriedProp=null;}}}
  else if(g.phase==='turn'){const v=scripted(sim,g,pose(r,r.length),dt,false);if(!v){ghost=null;}else if(g.t>1.2){g.phase='drive';g.back=lay([...r.raw].reverse());g.progress=0;}}
  else{/* back to the restaurant along the same roads, on its own right-hand side */const b=g.back||(g.back=lay([...r.raw].reverse(),0,r.keep||0)),v=sim.vehicles.find(q=>q.id===g.vid),p0=pose(b,g.progress||0),far=Math.hypot(p0.x-pl2.x,p0.z-pl2.z),held=v&&blocked(sim,v,p0.yaw);
   if(!held)g.progress=Math.min(b.length,(g.progress||0)+SPEED.standard*dt);
   if(far>FAR||g.progress>=b.length&&far>70||g.t>900){removeVehicle(sim,g.vid);ghost=null;}else if(v||far<NEAR)scripted(sim,g,pose(b,g.progress),dt,!held);}}
 // the feast: a step or two up to the bag, then the eating itself. people-6-anim.js plays it from feastT and ends
 // it with the face wiped clean; the sounds and the turn are timed by the stage of that scene, not by the clock.
 if(pl.feastT!==undefined){const A=pl.feastAt,stage=q=>root.CityPeopleModels?.feastStage?.(q)??q,before=stage(pl.feastT);
  if(A&&A.walk>0){A.t=(A.t||0)+dt;const k=clamp(A.t/A.walk,0,1);pl.x=mix(A.x0,A.x,k);pl.z=mix(A.z0,A.z,k);pl.yaw=A.yaw;pl.vx=pl.vz=0;pl.speed=k<1?A.pace:0;if(k>=1)A.walk=0;}
  else{pl.feastT+=dt/FEAST;const now=stage(Math.min(1,pl.feastT));pl.vx=pl.vz=0;pl.speed=0;if(A){pl.x=A.x;pl.z=A.z;/* standing up with the bag the player turns round, away from the door */const s=clamp((now-.12)/.12,0,1);pl.yaw=wrap(A.yaw+Math.PI*s*s*(3-2*s));}
   const cue=(t,f,e,g=.07,type='square')=>{if(before<t&&now>=t)audioRef?.tone?.(f,.16,g,type,'sfx',e);};cue(.02,300,140);cue(.1,180,520,.06,'triangle');cue(.3,130,90,.04);cue(.34,110,150,.04);/* V6.6: the player's own recordings: the squish each time the food goes into the face, and the "mmm" as it is wiped off. The old tones only sound if a recording cannot play. */
     const hit=(t,f,e,g)=>{if(before<t&&now>=t){feastOwn=!!audioRef?.sample?.('faceSquish',1,0,false,1.5);if(!feastOwn)audioRef?.tone?.(f,.16,g,'sawtooth','sfx',e);}};
     hit(.445,90,60,.12);if(!feastOwn)for(const t of[.48,.52,.56])cue(t,150+Math.random()*60,90,.06);cue(.615,130,90,.04);hit(.705,90,55,.13);if(!feastOwn)for(const t of[.74,.78,.82])cue(t,150+Math.random()*60,90,.06);cue(.9,240,120,.05,'triangle');
     if(before<1.2&&now>=1.2)feastWipe=!!audioRef?.sample?.('faceMmm',1,0);if(!feastWipe){cue(1.3,210,120,.035);cue(1.56,230,130,.035);}cue(1.72,520,880,.05,'sine');
   if(pl.feastT>=1){delete pl.feastT;delete pl.feastAt;delete pl.feastBagDy;}}}
}
function step(sim,dt,audio){if(typeof document==='undefined'||!sim||sim.onlineRoom||!(dt>0))return;if(audio)audioRef=audio;advance(sim,dt,false);}
function tick(sim,dt){if(!sim||sim.onlineRoom||!(dt>0))return false;advance(sim,Math.min(dt,.25),true);tickClock+=dt;if(tickClock>.5){tickClock=0;return true;}return false;}
// ---- the bag on the doorstep --------------------------------------------------------------------------------
function bagNear(sim){const o=state(sim)?.order,p=sim.player;if(!o||o.status!=='delivered'||!o.bag||p.mode!=='onFoot'||p.health<=0||p.feastT!==undefined||sim.onlineRoom)return null;return Math.hypot(p.x-o.bag.x,p.z-o.bag.z)<2.4?o:null;}
function pickUp(sim){const o=bagNear(sim);if(!o)return false;const d=state(sim),sv=Eat()?.survival(sim),p=sim.player;let hunger=0,thirst=0;for(const row of o.items){const it=itemOf(row.id);if(it){hunger+=it.hunger*row.n;thirst+=it.thirst*row.n;}}
 if(sv){sv.hunger=clamp(sv.hunger+hunger,0,100);sv.thirst=clamp(sv.thirst+thirst,0,100);if(sv.hunger>0&&sv.thirst>0){sv.empty=0;sv.strikes=0;}}
 /* where to stand: half a metre from the bag, on the side the player is already on, facing it */
 const bx=o.bag.x,bz=o.bag.z,high=(p.y||0)+2.5;let dx=p.x-bx,dz=p.z-bz,far=Math.hypot(dx,dz);if(far<.05){dx=-Math.sin(p.yaw||0);dz=-Math.cos(p.yaw||0);far=1;}dx/=far;dz/=far;
 const sx=bx+dx*REACH,sz=bz+dz*REACH,gap=Math.hypot(sx-p.x,sz-p.z);
 p.feastT=0;p.feastAt={x:sx,z:sz,x0:p.x,z0:p.z,yaw:Math.atan2(bx-sx,bz-sz),walk:gap>.06?clamp(gap/2.1,.15,1.1):0,pace:2.1,t:0,bag:{x:bx,z:bz}};p.feastBagDy=sim.world.groundHeight(bx,bz,high)-sim.world.groundHeight(sx,sz,high);d.order=null;sim.dirty=true;sim.emit?.('notice',{message:'You ate the whole order.'});return true;}
function draw(scene){const sim=root.PlatdoCity?.sim,T=scene?.T;if(!sim||!T||!scene.environment)return;const o=state(sim)?.order,pl=sim.player,A=pl?.feastT===0?pl.feastAt:null;
 /* on the doorstep, and still on the ground while the player steps up to it; from then on the character holds its own copy */
 const spot=!sim.onlineRoom&&(o&&o.status==='delivered'&&o.bag?o.bag:A?.bag||null),show=!!spot;
 drawRacks(scene,sim,T,o);carBag(scene,sim,T,o);if(!bagMesh){if(!show)return;bagMesh=makeBag(T);bagMesh.name='delivery-bag';}if(show&&o)setReceipt(bagMesh,receiptFor(T,sim,o));
 if(bagMesh.parent!==scene.environment){scene.environment.add(bagMesh);}
 bagMesh.visible=show;if(show){const y=sim.world.groundHeight(spot.x,spot.z,(pl.y||0)+2.5);bagMesh.position.set(spot.x,y,spot.z);/* turned to face the way the character will hold it */bagMesh.rotation.y=A?.5+wrap(A.yaw-.5)*(A.walk>0?clamp((A.t||0)/A.walk,0,1):1):.5;}
 if(show&&o?.photoDue)snap(scene,sim,o);}
// V7.6: the bag in the vehicle while the driver has it: on the passenger seat of a car, on the back of a bike.
function carBag(scene,sim,T,o){const g=live,v=g&&g.inCar&&o&&g.id===o.id?sim.vehicles.find(q=>q.id===g.vid):null;if(!v){if(carBagMesh)carBagMesh.visible=false;return;}
 if(!carBagMesh){carBagMesh=makeBag(T);carBagMesh.name='delivery-bag-in-vehicle';}if(carBagMesh.parent!==scene.environment)scene.environment.add(carBagMesh);setReceipt(carBagMesh,receiptFor(T,sim,o));
 const S2=sides(v),f=S2.bike?-S2.L*.72:.15,r=S2.bike?0:S2.W*.38,sy=Math.sin(v.yaw||0),cy=Math.cos(v.yaw||0);carBagMesh.visible=true;carBagMesh.position.set(v.x+sy*f-cy*r,(v.y||0)+(S2.bike?.84:.74),v.z+cy*f+sy*r);carBagMesh.rotation.set(0,(v.yaw||0)+(S2.bike?0:Math.PI/2),0);carBagMesh.scale.setScalar(S2.bike?1:1.25);}
/* V7.6: the driver's photo of the bag on the doorstep, the proof of delivery: drawn once from where the driver stands,
 * a metre and a half out from the door towards the street, looking down at the bag. Kept with the order and in the
 * order history (the newest five orders keep theirs, to keep the save small). */
function snap(scene,sim,o){o.photoDue=false;const T=scene.T,R=scene.renderer,cv=scene.canvas||R?.domElement,doc=root.document;if(!R||!cv||!doc||!bagMesh||!o.bag||!scene.scene)return;
 try{const h=home(sim),b=o.bag,k=h?.kerb||{x:b.x,z:b.z+4};let dx=k.x-b.x,dz=k.z-b.z;const L=Math.hypot(dx,dz)||1;dx/=L;dz/=L;const gy=bagMesh.position.y,cam=new T.PerspectiveCamera(50,cv.width/Math.max(1,cv.height),.05,500);
  cam.position.set(b.x+dx*1.15-dz*.3,gy+1.62,b.z+dz*1.15+dx*.3);cam.lookAt(b.x-dx*.18,gy+.2,b.z-dz*.18);cam.updateMatrixWorld(true);
  const dome=scene.v2Look?.dome,sky=scene.citySky?.group,d0=dome?.position.clone(),s0=sky?.position.clone();if(dome)dome.position.copy(cam.position);if(sky)sky.position.copy(cam.position);
  /* nobody standing right by the bag is in it: the driver holds the phone, and is not in their own photo */const hid=[];for(const rec of scene.meshes?.people?.values?.()||[]){const m=rec?.mesh||rec;if(m?.visible&&m.position&&Math.hypot(m.position.x-b.x,m.position.z-b.z)<2.6){m.visible=false;hid.push(m);}}
  R.setRenderTarget(null);try{R.render(scene.scene,cam);}finally{for(const m of hid)m.visible=true;}const W=400,H=250,c=doc.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),sw=Math.min(cv.width,cv.height*1.6),sh=sw/1.6;x.drawImage(cv,(cv.width-sw)/2,(cv.height-sh)/2,sw,sh,0,0,W,H);
  if(dome&&d0)dome.position.copy(d0);if(sky&&s0)sky.position.copy(s0);
  x.fillStyle='rgba(0,0,0,.46)';x.fillRect(0,H-26,W,26);x.fillStyle='#fff';x.font='600 13px "Segoe UI",sans-serif';x.textBaseline='middle';x.fillText('DingDash · delivered by '+(o.driver||'your driver'),10,H-13);
  keepPhoto(o.id,c.toDataURL('image/jpeg',.68));o.photo='ddp:'+o.id;const d=state(sim),hh=d.history.find(q=>q.id===o.id);if(hh)hh.photo=o.photo;let n=0;for(const q of d.history)if(q.photo&&++n>PHOTOS)delete q.photo;sim.dirty=true;}catch(e){o.photo=null;}}
function photoFor(sim,ref){const id=String(ref||'').replace(/^ddp?:/,'');return id?photoOf(id):null;}
// ---- the phone app ------------------------------------------------------------------------------------------
const time=s=>{s=Math.max(0,Math.round(s));return s<60?s+' sec':Math.floor(s/60)+' min '+(s%60<10?'0':'')+s%60+' sec';};
const STAGES=[['cooking','Order confirmed, cooking'],['driving','On the road'],['arriving','At your door'],['delivered','Delivered']];
function matches(b){const q=view.q.trim().toLowerCase();if(view.cat!=='all'&&(b.cat||b.kind)!==view.cat)return false;if(!q)return true;return(b.name+' '+b.kind+' '+b.tag+' '+b.menu.map(m=>m.name+' '+m.about).join(' ')).toLowerCase().includes(q);}
// ---- DingDash screens (V5.7): the app's new name, a light look and the delivery bag as its logo ----------------
const APP='DingDash',SHORT={cooking:'Cooking',driving:'On the road',arriving:'At the door',delivered:'Delivered'};
const svg=(d,s=18,w=2)=>'<svg viewBox="0 0 24 24" width="'+s+'" height="'+s+'" fill="none" stroke="currentColor" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
const IC={search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',bag:'<path d="M5.5 8.5h13l1 11.5h-15z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',back:'<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>',pin:'<path d="M12 21c-3.6-3.4-6-6.7-6-10a6 6 0 0 1 12 0c0 3.3-2.4 6.6-6 10z"/><circle cx="12" cy="11" r="2.2"/>',clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',plus:'<path d="M12 5.5v13M5.5 12h13"/>',minus:'<path d="M5.5 12h13"/>',list:'<path d="M7 3.5h10a1 1 0 0 1 1 1v16l-3-1.8-3 1.8-3-1.8-3 1.8v-16a1 1 0 0 1 1-1z"/><path d="M9.5 9h5M9.5 13h5"/>',target:'<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.500 12H21"/>'};
const DD_CSS=`
#cityRoot:is(#cityRoot) .platdo-os.dd-light{--os-ink:#191c1f;--os-muted:#6b727b;--os-surface:#fff;--os-raised:#f1f3f5;--pl-line:#0000001a}
#cityRoot:is(#cityRoot) .platdo-os.dd-light .os-app-header{border-bottom-color:#00000012}
#cityRoot:is(#cityRoot) .panel .dd{background:#fff;border-radius:18px;padding:16px;min-height:0}
#cityRoot:is(#cityRoot) .dd{
 --dd-ink:#191c1f;--dd-mut:#6b727b;--dd-line:#e4e7ea;--dd-soft:#f2f4f5;--dd-acc:#0a7f74;--dd-acc2:#086b62;--dd-tint:#e2f6f2;
 display:flex;flex-direction:column;gap:12px;min-height:100%;box-sizing:border-box;color:var(--dd-ink);font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;font-size:calc(13px * var(--os-text,1));line-height:1.35;text-align:left;
 button{font:inherit;color:inherit;background:none;border:0;border-radius:0;padding:0;margin:0;min-height:0;min-width:0;box-shadow:none;text-transform:none;letter-spacing:0;cursor:pointer;text-align:inherit;filter:none}
 button:disabled{opacity:.45;cursor:default}
 h2,h3,p{margin:0;font-family:inherit;font-style:normal;text-shadow:none;color:inherit;letter-spacing:0;text-transform:none}
 small{display:block;font-size:.885em;color:var(--dd-mut);font-weight:400}
 b{font-weight:650}
 .dd-top{display:flex;align-items:center;gap:10px}
 .dd-logo{flex:none;display:block;width:40px;height:40px;border-radius:11px;overflow:hidden;box-shadow:0 2px 7px #0a7f7447}
 .dd-logo svg{width:100%;height:100%;display:block}
 .dd-word{flex:1;min-width:0}
 .dd-word b{display:block;font-size:1.46em;font-weight:800;letter-spacing:-.4px;line-height:1.1}
 .dd-word small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .dd-ib{position:relative;flex:none;width:38px;height:38px;border-radius:50%;background:var(--dd-soft);display:grid;place-items:center}
 .dd-ib:hover,.dd-back:hover,.dd-chip:hover{background:#e7eaec}
 .dd-ib i{position:absolute;top:-3px;right:-3px;min-width:17px;height:17px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:var(--dd-acc);color:#fff;font:700 10.5px/17px system-ui,sans-serif;font-style:normal;text-align:center}
 .dd-note{padding:9px 11px;border-radius:12px;background:#fff3d4;color:#6a4a00;font-size:.96em;line-height:1.35}
 .dd-addr{display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:13px;background:var(--dd-soft)}
 .dd-addr svg{flex:none;color:var(--dd-acc)}
 .dd-addr span{min-width:0}
 .dd-addr b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .dd-live{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:14px;background:var(--dd-tint);border:1px solid #0a7f7433}
 .dd-live>span{flex:1;min-width:0}
 .dd-live b{display:block}
 .dd-live small{color:#0a5f57}
 .dd-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 15px;min-height:38px;border-radius:19px;background:var(--dd-acc);color:#fff;font-weight:650;white-space:nowrap}
 .dd-btn:hover{background:var(--dd-acc2)}
 .dd-btn:disabled{background:#9aa3ab}
 .dd-btn.big{display:flex;width:100%;box-sizing:border-box;min-height:48px;padding:10px 20px;border-radius:24px;font-size:1.1em;box-shadow:0 6px 16px #0a7f7440}
 .dd-btn .r{margin-left:auto;font-weight:750}
 .dd-link{font-size:.8em;font-weight:600;color:var(--dd-acc)}
 .dd-search{display:flex;align-items:center;gap:7px;padding:4px 4px 4px 12px;border-radius:23px;background:var(--dd-soft);border:1px solid transparent}
 .dd-search:focus-within{border-color:var(--dd-acc);background:#fff}
 .dd-search svg{flex:none;color:var(--dd-mut)}
 .dd-search input{flex:1;min-width:0;width:auto;margin:0;border:0;outline:0;background:none;padding:7px 0;color:var(--dd-ink);font:inherit;border-radius:0;box-shadow:none}
 .dd-search input::placeholder{color:#868d95}
 .dd-cats{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;margin:0 -14px;padding:1px 14px}
 .dd-cats::-webkit-scrollbar{display:none}
 .dd-chip{flex:none;padding:7px 13px;border-radius:17px;background:var(--dd-soft);font-size:.96em;font-weight:600;white-space:nowrap}
 .dd-chip.on,.dd-chip.on:hover{background:var(--dd-ink);color:#fff}
 .dd-h{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:1.16em;font-weight:750;margin-top:2px}
 .dd-h small{display:inline;font-size:.76em}
 .dd-list{display:grid;gap:12px}
 .dd-place{display:block;width:100%;border-radius:16px;overflow:hidden;background:#fff;border:1px solid var(--dd-line);box-shadow:0 1px 3px #0000000d;transition:box-shadow .15s,border-color .15s}
 .dd-place:hover{border-color:#c6ccd1;box-shadow:0 5px 14px #0000001c}
 .dd-art{display:flex;align-items:center;justify-content:center;gap:16px;height:66px;font-size:28px;line-height:1;background:linear-gradient(135deg,color-mix(in srgb,var(--a) 30%,#fff),color-mix(in srgb,var(--a) 9%,#fff))}
 .dd-art span:nth-child(2){font-size:38px}
 .dd-pb{display:block;padding:9px 12px 11px}
 .dd-pb b{display:block;font-size:1.115em}
 .dd-meta{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:5px;font-size:.885em;font-weight:600}
 .dd-meta svg{flex:none;color:var(--dd-acc)}
 .dd-meta em{font-style:normal;color:var(--dd-mut);font-weight:400}
 .dd-back{align-self:flex-start;display:inline-flex;align-items:center;gap:3px;padding:6px 12px 6px 7px;border-radius:16px;background:var(--dd-soft);font-size:.96em;font-weight:600}
 .dd-hero{border-radius:18px;padding:14px;background:linear-gradient(135deg,color-mix(in srgb,var(--a) 32%,#fff),color-mix(in srgb,var(--a) 8%,#fff))}
 .dd-hero .dd-art{height:auto;background:none;justify-content:flex-start;gap:8px;font-size:28px;margin-bottom:8px}
 .dd-hero .dd-art span:nth-child(2){font-size:28px}
 .dd-hero h2,.dd-title{font-size:1.62em;font-weight:800;letter-spacing:-.4px;line-height:1.15}
 .dd-hero p{font-size:.96em;color:#3d444b;line-height:1.35;margin-top:2px}
 .dd-menu{display:grid}
 .dd-item{display:grid;grid-template-columns:46px minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid var(--dd-line)}
 .dd-item:last-child{border-bottom:0}
 .dd-emoji{width:46px;height:46px;border-radius:13px;background:var(--dd-soft);display:grid;place-items:center;font-size:26px;line-height:1}
 .dd-it b{display:block;font-size:1.04em}
 .dd-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
 .dd-tags i{font-style:normal;font-size:.81em;font-weight:600;padding:2px 6px;border-radius:8px;background:var(--dd-tint);color:#0a5f57}
 .dd-tags i.t{background:#e3effd;color:#1c4f8f}
 .dd-buy{display:grid;justify-items:end;gap:6px}
 .dd-price{font-size:1.04em;font-weight:700}
 .dd-add{width:32px;height:32px;border-radius:50%;background:var(--dd-acc);color:#fff;display:grid;place-items:center}
 .dd-add:hover{background:var(--dd-acc2)}
 .dd-step{display:inline-flex;align-items:center;border-radius:17px;background:var(--dd-soft);padding:2px}
 .dd-step button{width:28px;height:28px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 1px 2px #00000024;color:var(--dd-acc)}
 .dd-step b{min-width:24px;text-align:center}
 .dd-card{border:1px solid var(--dd-line);border-radius:16px;padding:3px 12px;background:#fff}
 .dd-line{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:9px;align-items:center;padding:9px 0;border-bottom:1px solid var(--dd-line)}
 .dd-line:last-child{border-bottom:0}
 .dd-line .dd-emoji{width:34px;height:34px;border-radius:10px;font-size:20px}
 .dd-line .r{display:grid;justify-items:end;gap:4px}
 .dd-seg{display:grid;grid-template-columns:1fr 1fr;gap:8px}
 .dd-seg button{padding:10px 12px;border-radius:14px;border:1.5px solid var(--dd-line);background:#fff}
 .dd-seg button.on{border-color:var(--dd-acc);background:var(--dd-tint)}
 .dd-seg b{display:block;font-size:1.04em}
 .dd-sum{padding:10px 12px;display:grid;gap:5px}
 .dd-sum div{display:flex;justify-content:space-between;gap:10px;color:#3d444b}
 .dd-sum b{color:var(--dd-ink)}
 .dd-sum .tot{font-size:1.23em;font-weight:800;color:var(--dd-ink);padding-top:7px;margin-top:3px;border-top:1px solid var(--dd-line)}
 .dd-wal{font-size:.92em;color:var(--dd-mut);text-align:center}
 .dd-wal.low{color:#b83227;font-weight:600}
 .dd-empty{display:grid;justify-items:center;gap:6px;text-align:center;padding:30px 10px;color:var(--dd-mut)}
 .dd-empty .dd-logo{width:64px;height:64px;border-radius:18px;margin-bottom:6px}
 .dd-empty b{color:var(--dd-ink);font-size:1.23em}
 .dd-empty .dd-btn{margin-top:8px}
 .dd-bar{position:sticky;bottom:0;z-index:2;margin:auto -14px -14px;padding:14px 14px 14px;background:linear-gradient(#fff0,#fff 34%)}
 .dd-eta small{font-size:.92em;font-weight:700;color:var(--dd-acc);text-transform:uppercase;letter-spacing:.4px}
 .dd-eta b{display:block;font-size:2em;font-weight:800;letter-spacing:-.6px;line-height:1.15}
 .dd-eta p{font-size:.96em;color:var(--dd-mut);margin-top:3px;line-height:1.4}
 .dd-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}
 .dd-steps i{height:5px;border-radius:3px;background:var(--dd-line)}
 .dd-steps i.on{background:var(--dd-acc)}
 .dd-stl{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:5px;font-size:.81em;color:var(--dd-mut);text-align:center}
 .dd-stl span.on{color:var(--dd-ink);font-weight:700}
 .dd-map{width:100%;height:auto;border-radius:16px;display:block;background:#3ca2df;border:1px solid var(--dd-line);box-sizing:border-box}
 .dd-driver{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:var(--dd-soft)}
 .dd-driver span{min-width:0}
 .dd-driver b{display:block}
 .dd-av{flex:none;width:38px;height:38px;border-radius:50%;background:var(--dd-acc);color:#fff;display:grid;place-items:center;font-weight:800;font-size:1.23em}
 .dd-rows{display:grid;gap:10px}
 .dd-ord{border:1px solid var(--dd-line);border-radius:14px;padding:10px 12px}
.dd-rate{margin-left:auto;flex:none;display:grid;justify-items:end;gap:1px;text-align:right}
.dd-rate b{font-weight:800;font-size:1.02em}
.dd-rate small{font-size:.78em;color:var(--dd-mut)}
.dd-rate.top b{color:#1f9d55}.dd-rate.ok b{color:#12a594}.dd-rate.meh b{color:#d48a12}.dd-rate.bad b{color:#d23b30}
.dd-proof{margin:0;border-radius:14px;overflow:hidden;background:var(--dd-soft)}
.dd-proof img{display:block;width:100%;aspect-ratio:1.6;object-fit:cover}
.dd-proof figcaption{font-size:.86em;color:var(--dd-mut);padding:7px 10px}
.dd-oph{display:block;width:100%;aspect-ratio:1.6;object-fit:cover;border-radius:10px;margin:8px 0 2px}
.dd-od{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:.88em;color:var(--dd-mut)}
.dd-od .dd-rate{display:flex;gap:6px;align-items:baseline}
 .dd-oh{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
 .dd-ord p{font-size:.92em;color:var(--dd-mut);margin-top:3px;line-height:1.4}
 .dd-ban{display:block;aspect-ratio:2/1;background:var(--dd-soft);overflow:hidden}
 .dd-ban img{display:block;width:100%;height:100%;object-fit:cover;border:0;border-radius:0;margin:0;max-width:none}
 .dd-hero .dd-hb{display:block}
 .dd-hero.ban{padding:0;overflow:hidden;background:#fff;border:1px solid var(--dd-line)}
 .dd-hero.ban .dd-hb{padding:11px 14px 13px}
}`;
function ddStyle(){const doc=root.document;if(!doc||doc.getElementById('ddStyle'))return;const s=doc.createElement('style');s.id='ddStyle';s.textContent=DD_CSS;doc.head.append(s);}
// the logo is the app's own cover from the phone's home screen: a white delivery bag on teal
const logo=()=>'<span class="dd-logo">'+(root.CityPhoneLook?.cover?.('doordash')||'<svg viewBox="0 0 60 60" aria-hidden="true"><rect width="60" height="60" fill="#12a594"/><path d="M23 26v-5.5a7 7 0 0 1 14 0V26" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M16.5 24h27l3 24.3a3 3 0 0 1-3 3.2h-27a3 3 0 0 1-3-3.200z" fill="#fff"/></svg>')+'</span>';
/* V6.0: the restaurants' own banners, made by the user (720 by 360 here). A place without one keeps its row of food pictures. */
const BANNERS={'eat-big-micks':'assets/images/2249ce9f27ed71cc67b9.jpg','eat-captain-clucks':'assets/images/28b3698a04eeb03f6f60.jpg','eat-pizza-shack':'assets/images/e6dc60e5869ee76bc339.jpg','eat-taco-chime':'assets/images/2e37fcb6b930fd12d2ac.jpg','eat-moonbeans':'assets/images/f4842a0874569ba188b2.jpg','eat-dippin-donuts':'assets/images/b6aa2d1b4539ebf9415b.jpg','six-seven':'assets/images/874ec7ce4f7ec31801a4.jpg','eat-mandys':'assets/images/fbef87d41506fe21f01d.jpg','eat-chick-phil-b':'assets/images/e88e15966e99cbfaae0a.jpg','eat-tubeway':'assets/images/85bdbb9bf5f58f61c628.jpg','eat-chilipot':'assets/images/ad10dd42407a6d2c172f.jpg','eat-dairy-duchess':'assets/images/ca4c38c827a141614293.jpg','eat-five-pals':'assets/images/1fd875547aac80e13d78.jpg','eat-burger-duke':'assets/images/2e28e3185653bb754b8f.jpg','eat-shake-shed':'assets/images/134824bc4b8529dd3c8b.jpg','eat-braising-waynes':'assets/images/297d8096e66c5a665553.jpg'},bannerOf=b=>BANNERS[b.id]||(String(b.id).startsWith('six-seven')?BANNERS['six-seven']:'');
const art=(b,n)=>bannerOf(b)?'<span class="dd-ban"><img src="'+bannerOf(b)+'" alt="" width="720" height="360"></span>':'<span class="dd-art">'+b.menu.slice(0,n).map(m=>'<span>'+m.icon+'</span>').join('')+'</span>';
function head(ctx,sub,count){return '<div class="dd-top">'+logo()+'<span class="dd-word"><b>'+APP+'</b><small>'+ctx.esc(sub)+'</small></span>'+ctx.btn('dashHistory',svg(IC.list,19),'dd-ib','aria-label="Order history" title="Order history"')+ctx.btn('dashCart',svg(IC.bag,19)+(count?'<i>'+count+'</i>':''),'dd-ib','aria-label="Cart, '+count+' in it" title="Cart"')+'</div>'+(view.note?'<p class="dd-note">'+ctx.esc(view.note)+'</p>':'');}
function banner(ctx,sim){const o=state(sim)?.order;if(!o)return'';const b=brandOf(o.brand),left=remaining(sim);return '<div class="dd-live"><span><b>'+ctx.esc(b?.name||'Your order')+'</b><small>'+(o.status==='delivered'?'Waiting on your doorstep':ctx.esc(SHORT[o.status]||'')+' &middot; about '+time(left))+'</small></span>'+ctx.btn('dashTrack','Track','dd-btn')+'</div>';}
function cartBar(ctx,count,t){return count?'<div class="dd-bar">'+ctx.btn('dashCart','<span>View cart &middot; '+count+(count===1?' item':' items')+'</span><span class="r">'+ctx.money(t.subtotal)+'</span>','dd-btn big'):'';}
const stepper=(ctx,it,n)=>'<span class="dd-step">'+ctx.btn('dashRemove',svg(IC.minus,15,2.4),'','data-value="'+it.id+'" aria-label="Remove one '+ctx.esc(it.name)+'"')+'<b>'+n+'</b>'+ctx.btn('dashAdd',svg(IC.plus,15,2.4),'','data-value="'+it.id+'" aria-label="Add one '+ctx.esc(it.name)+'"'+(n>=9?' disabled':''))+'</span>';
function render(ctx){
 const sim=ctx.sim,d=state(sim),B=listed(sim),o=d?.order,doc=root.document,E=ctx.esc,M=ctx.money,btn=ctx.btn;let body='',title='Delivery';ddStyle();
 if(view.page==='track'&&!o)view.page='home';
 if(view.page==='place'&&!(brandOf(view.brand)||B[0]))view.page='home';
 const t=totals(sim),count=t.rows.reduce((s,r)=>s+r[1],0),h=home(sim),accent=b=>E(b.look?.accent||'#12a594'),stats=it=>(it.hunger?'<i>+'+it.hunger+' hunger</i>':'')+(it.thirst?'<i class="t">+'+it.thirst+' thirst</i>':''),backRow=label=>btn('dashHome',svg(IC.back,15,2.4)+label,'dd-back');
 if(view.page==='home'){
  const list=B.filter(matches),q=view.q.trim(),est=id=>{const e=estimate(sim,id,'standard');return e?'about '+time(e.seconds):'no road there';};
  body=head(ctx,'Food to your door',count)+banner(ctx,sim)+
   '<div class="dd-addr">'+svg(IC.pin,19)+'<span><small>Deliver to</small><b>'+E(h?.name||'Your home')+'</b></span></div>'+
   '<div class="dd-search">'+svg(IC.search,17)+'<input id="dashSearch" type="search" maxlength="40" placeholder="Search food or places" aria-label="Search food or a restaurant" value="'+E(view.q)+'">'+btn('dashSearch','Search','dd-btn')+'</div>'+
   '<div class="dd-cats">'+CATS.map(([id,label])=>btn('dashCat',label,'dd-chip'+(view.cat===id?' on':''),'data-value="'+id+'" aria-pressed="'+(view.cat===id)+'"')).join('')+'</div>'+
   '<h3 class="dd-h"><span>'+(q?'Results for &ldquo;'+E(q)+'&rdquo;':view.cat==='all'?'Restaurants':E(CATS.find(c=>c[0]===view.cat)?.[1]||'Restaurants'))+'</span>'+(q?btn('dashClear','Clear search','dd-link'):'<small>'+list.length+(list.length===1?' place':' places')+'</small>')+'</h3>'+
   (list.length?'<div class="dd-list">'+list.map(b=>btn('dashOpen',art(b,3)+'<span class="dd-pb"><b>'+E(b.name)+'</b><small>'+E(b.tag)+'</small><span class="dd-meta">'+svg(IC.clock,14)+est(b.id)+'<em>&middot; '+M(feeFor('standard',routeMetres(sim,b.id)))+' delivery</em></span></span>','dd-place','data-value="'+b.id+'" style="--a:'+accent(b)+'" aria-label="'+E(b.name)+', see the menu"')).join('')+'</div>':'<div class="dd-empty"><b>Nothing matches</b><span>Try another word or another category.</span></div>')+cartBar(ctx,count,t);
 }else if(view.page==='place'){
  const b=brandOf(view.brand)||B[0],e1=estimate(sim,b.id,'standard');title=b.name;
  body=head(ctx,'Menu',count)+backRow('All restaurants')+
   '<div class="dd-hero'+(bannerOf(b)?' ban':'')+'" style="--a:'+accent(b)+'">'+art(b,4)+'<span class="dd-hb"><h2>'+E(b.name)+'</h2><p>'+E(b.tag)+'</p><span class="dd-meta">'+svg(IC.clock,14)+(e1?'about '+time(e1.seconds):'no road there')+'<em>&middot; Standard '+M(feeFor('standard',e1?.metres))+' &middot; Express '+M(feeFor('express',e1?.metres))+'</em></span></span></div>'+
   '<h3 class="dd-h"><span>Menu</span><small>'+b.menu.length+' items</small></h3><div class="dd-menu">'+b.menu.map(it=>{const n=view.cartBrand===b.id&&view.cart[it.id]||0;return '<div class="dd-item" data-food-item="'+it.id+'"><span class="dd-emoji">'+it.icon+'</span><span class="dd-it"><b>'+E(it.name)+'</b><small>'+E(it.about)+'</small><span class="dd-tags">'+stats(it)+'</span></span><span class="dd-buy"><b class="dd-price">'+M(it.price)+'</b>'+(n?stepper(ctx,it,n):btn('dashAdd',svg(IC.plus,17,2.4),'dd-add','data-value="'+it.id+'" aria-label="Add '+E(it.name)+' to the cart"'))+'</span></div>';}).join('')+'</div>'+cartBar(ctx,count,t);
 }else if(view.page==='cart'){
  const b=brandOf(view.cartBrand),e=b?estimate(sim,b.id,view.option):null,can=sim.profile.wallet>=t.total,opt=k=>{const x=b?estimate(sim,b.id,k):null;return btn('dashOption','<b>'+(k==='express'?'Express':'Standard')+'</b><small>'+(x?'about '+time(x.seconds)+' &middot; ':'')+M(feeFor(k,x?.metres??routeMetres(sim,b?.id)))+'</small>',view.option===k?'on':'','data-value="'+k+'" aria-pressed="'+(view.option===k)+'"');};title='Checkout';
  body=head(ctx,'Checkout',count)+backRow('Keep browsing')+(t.rows.length?
   '<div><h2 class="dd-title">Your order</h2>'+(b?'<small>from '+E(b.name)+'</small>':'')+'</div>'+
   '<div class="dd-card">'+t.rows.map(([it,n])=>'<div class="dd-line"><span class="dd-emoji">'+it.icon+'</span><span><b>'+E(it.name)+'</b><small>'+M(it.price)+' each</small></span><span class="r"><b>'+M(it.price*n)+'</b>'+stepper(ctx,it,n)+'</span></div>').join('')+'</div>'+
   '<h3 class="dd-h"><span>Delivery</span></h3><div class="dd-seg">'+opt('standard')+opt('express')+'</div>'+
   '<div class="dd-addr">'+svg(IC.pin,19)+'<span><small>Deliver to'+(e?' &middot; '+Math.round(e.metres)+' m by road':'')+'</small><b>'+E(h?.name||'Your home')+'</b></span></div>'+
   '<div class="dd-card dd-sum"><div><span>Items</span><span>'+M(t.subtotal)+'</span></div><div><span>Delivery fee</span><span>'+M(t.fee)+'</span></div><div class="tot"><span>Total</span><span>'+M(t.total)+'</span></div></div>'+
   '<p class="dd-wal'+(can?'':' low')+'">'+(can?'You have '+M(sim.profile.wallet)+' in your wallet.':'You need '+M(t.total-sim.profile.wallet)+' more. You have '+M(sim.profile.wallet)+'.')+'</p>'+
   '<div class="dd-bar">'+btn('dashOrder','<span>Place order</span><span class="r">'+M(t.total)+'</span>','dd-btn big',can?'':'disabled')+'</div>'
   :'<div class="dd-empty">'+logo()+'<b>Your cart is empty</b><span>Add something from a menu and it shows up here.</span>'+btn('dashHome','Browse restaurants','dd-btn')+'</div>');
 }else if(view.page==='track'){
  const b=brandOf(o.brand),at2=STAGES.findIndex(s=>s[0]===o.status),left=remaining(sim),done=o.status==='delivered';title='Your order';
  body=head(ctx,'Order '+String(o.id).split('-').pop(),count)+backRow('All restaurants')+
   '<div class="dd-eta"><small>'+E(STAGES[at2]?.[1]||'')+'</small><b>'+(done?'It is at your door':'About '+time(left))+'</b>'+(done?'<p>Walk up to the bag and press the enter-vehicle key to eat.</p>':'')+'</div>'+
   '<div><div class="dd-steps">'+STAGES.map((s,i)=>'<i'+(i<=at2?' class="on"':'')+'></i>').join('')+'</div><div class="dd-stl">'+STAGES.map((s,i)=>'<span'+(i===at2?' class="on"':'')+'>'+SHORT[s[0]]+'</span>').join('')+'</div></div>'+
   '<canvas id="dashMap" class="dd-map" width="640" height="360" aria-label="Map of the delivery route"></canvas>'+
   '<div class="dd-driver"><span class="dd-av">'+E(String(o.driver||'?').charAt(0))+'</span><span><b>'+E(o.driver)+'</b><small>'+E(o.vehicleName||'vehicle')+' &middot; '+(o.express?'Express':'Standard')+' delivery</small></span>'+rateChip(o.rating)+'</div>'+
   (done&&photoOf(o.id)?'<figure class="dd-proof"><img src="'+photoOf(o.id)+'" alt="Photo of your food on the doorstep"><figcaption>Proof of delivery: '+E(o.driver||'your driver')+' took this at your door.</figcaption></figure>':'')+
   '<div class="dd-card dd-sum"><div><b>'+E(b?.name||'Restaurant')+'</b><span></span></div>'+o.items.map(r=>'<div><span>'+E(itemOf(r.id)?.name||r.id)+'</span><span>x '+r.n+'</span></div>').join('')+'<div class="tot"><span>Total paid</span><span>'+M(o.total)+'</span></div></div>'+
   (done?'<div class="dd-bar">'+btn('dashWaypoint',svg(IC.target,17)+'Set waypoint to my food','dd-btn big')+'</div>':'');
 }else{
  title='Order history';body=head(ctx,'Your last orders',count)+backRow('All restaurants')+(d.history.length?'<div class="dd-rows">'+d.history.map(hh=>{const b=brandOf(hh.brand);return '<div class="dd-ord"><div class="dd-oh"><b>'+E(b?.name||hh.brand)+'</b><b>'+M(hh.total)+'</b></div><p>'+hh.items.map(r=>E(itemOf(r.id)?.name||r.id)+' x '+r.n).join(', ')+'</p>'+(hh.photo&&photoOf(hh.id)?'<img class="dd-oph" src="'+photoOf(hh.id)+'" alt="Photo of the delivered food on your doorstep">':'')+(hh.driver?'<div class="dd-od"><span>Delivered by '+E(hh.driver)+'</span>'+rateChip(hh.rating)+'</div>':'')+'</div>';}).join('')+'</div>':'<div class="dd-empty">'+logo()+'<b>No orders yet</b><span>Your last twelve orders are kept here.</span>'+btn('dashHome','Browse restaurants','dd-btn')+'</div>');
 }
 /* the phone redraws the whole screen on every press: keep the place the list was scrolled to */
 const key=view.page+(view.page==='place'?':'+view.brand:''),old=doc?.getElementById('phoneContent'),same=!!old&&old.querySelector('.dd')?.dataset.ddKey===key,keep=same?old.scrollTop:0,keepX=same?old.querySelector('.dd-cats')?.scrollLeft:undefined;
 /* the phone escapes its own header text; the full-page panel does not */
 ctx.panel(root.PlatdoCity?.phoneOpen?title:E(title),'<div class="dd" data-dd-key="'+E(key)+'">'+body+'</div>');
 const os=doc?.getElementById('cityPhone');
 if(os){os.classList.add('dd-light');const box=os.querySelector('.os-content');if(box&&keep)box.scrollTop=keep;
  const cats=os.querySelector('.dd-cats'),on=cats?.querySelector('.on');if(cats){if(keepX)cats.scrollLeft=keepX;if(on){const l=on.offsetLeft-cats.offsetLeft,r=l+on.offsetWidth;if(l<cats.scrollLeft+14)cats.scrollLeft=l-14;else if(r>cats.scrollLeft+cats.clientWidth-14)cats.scrollLeft=r-cats.clientWidth+14;}}}
 doc?.getElementById('dashSearch')?.addEventListener('keydown',ev=>{if(ev.key==='Enter'){ev.preventDefault();click('dashSearch','',ctx);}});
 if(view.page==='track')drawMap(sim);
}
function drawMap(sim){const c=root.document?.getElementById('dashMap'),o=state(sim)?.order;if(!c||!o)return;const g=c.getContext('2d'),route=(live&&live.id===o.id?live.route:null)||buildRoute(sim,o.brand);g.fillStyle='#3ca2df';g.fillRect(0,0,c.width,c.height);if(!route)return;
 let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;for(const p of[...route.pts,route.home.door]){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z);}const pad=70;x0-=pad;x1+=pad;z0-=pad;z1+=pad;const k=Math.min(c.width/(x1-x0),c.height/(z1-z0)),ox=(c.width-(x1-x0)*k)/2,oy=(c.height-(z1-z0)*k)/2,X=x=>ox+(x-x0)*k,Z=z=>oy+(z-z0)*k;
 /* the game's painted map behind the route, painted once at a small size and kept */
 try{const b=root.CityWorldMap?.bounds;if(b&&root.CityMapPaint&&(!mapArt||mapArt.world!==sim.world))mapArt={world:sim.world,canvas:root.CityMapPaint.paint(sim.world,b,1280)};if(b&&mapArt?.canvas){const sx=mapArt.canvas.width/(b.right-b.left),sz=mapArt.canvas.height/(b.bottom-b.top);g.drawImage(mapArt.canvas,(x0-b.left)*sx,(z0-b.top)*sz,(x1-x0)*sx,(z1-z0)*sz,X(x0),Z(z0),(x1-x0)*k,(z1-z0)*k);}}catch(e){}
 g.lineJoin=g.lineCap='round';g.strokeStyle='#0b3b36';g.lineWidth=7;g.beginPath();route.pts.forEach((p,i)=>i?g.lineTo(X(p.x),Z(p.z)):g.moveTo(X(p.x),Z(p.z)));g.stroke();g.strokeStyle='#2fe0c4';g.lineWidth=4;g.stroke();
 const dot=(p,fill,label)=>{g.fillStyle='#fff';g.beginPath();g.arc(X(p.x),Z(p.z),11,0,7);g.fill();g.fillStyle=fill;g.beginPath();g.arc(X(p.x),Z(p.z),8,0,7);g.fill();g.font='700 14px system-ui,sans-serif';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#ffffffd0';g.strokeText(label,X(p.x),Z(p.z)-16);g.fillStyle='#10202a';g.fillText(label,X(p.x),Z(p.z)-16);};
 dot(route.pts[0],'#f39c3d',brandOf(o.brand)?.name||'Restaurant');dot(route.home.door,'#5cb87a','Home');if(o.status==='driving'||o.status==='arriving')dot(at(route,o.progress),'#e5483f',o.driver);}
function click(action,value,ctx){
 const sim=ctx.sim;view.note='';
 if(action==='dashClose'){view.page='home';ctx.setScreen('play');return;}
 if(action==='dashHome')view.page='home';else if(action==='dashHistory')view.page='history';else if(action==='dashCart')view.page='cart';else if(action==='dashTrack')view.page='track';
 else if(action==='dashCat'){view.cat=value||'all';view.page='home';}
 else if(action==='dashSearch'){view.q=String(root.document?.getElementById('dashSearch')?.value||'').slice(0,40);/* a search looks through every category */if(view.q.trim())view.cat='all';view.page='home';}
 else if(action==='dashOpen'){view.brand=value;view.page='place';}
 else if(action==='dashAdd'){const it=itemOf(value),from=view.page==='place'?view.brand:view.cartBrand;/* the seller is the page it was added from: every 6-7 sells the same goods */if(it&&from){if(view.cartBrand&&view.cartBrand!==from&&cartRows().length){view.cart={};view.note='Your cart was emptied: one order comes from one place.';}view.cartBrand=from;view.cart[it.id]=Math.min(9,(view.cart[it.id]||0)+1);}}
 else if(action==='dashRemove'){if(view.cart[value]>0&&--view.cart[value]<=0)delete view.cart[value];}
 else if(action==='dashClear'){view.q='';view.page='home';}
 else if(action==='dashOption'){view.option=value==='express'?'express':'standard';}
 else if(action==='dashOrder'){const r=place(sim);view.note=r.message;if(r.ok){view.page='track';if(!ctx.audio?.sample?.('sendOrder',1,0))ctx.audio?.tone?.(660,.14,.05,'sine','sfx',990);ctx.saveNow?.();}}
 else if(action==='dashWaypoint'){const o=state(sim)?.order;if(o?.bag){root.PlatdoCity?.setWaypoint?.({x:o.bag.x,z:o.bag.z});view.page='home';ctx.setScreen('play');return;}}
 ctx.render();
}
function opened(sim){view.note='';view.page=state(sim)?.order?'track':'home';}
/* V6.8: the receipt of the order now on its way, for the bag a crew member carries to the rack */
root.CityDelivery={photoFor,receipt:T=>{const sim=root.PlatdoCity?.sim,o=state(sim)?.order;return o&&T?receiptFor(T,sim,o):null;},step,tick,render,click,opened,draw,bagNear,pickUp,state,estimate,remaining,home,buildRoute,view,FEE,SPEED,diagnostics:sim=>({order:state(sim)?.order?{...state(sim).order}:null,live:live?{phase:live.phase,pick:live.pick||null,vid:live.vid,walking:live.walking,hold:+live.hold.toFixed(1),off:+(live.off||0).toFixed(2),rating:live.rating,inCar:!!live.inCar}:null,ghost:ghost?{phase:ghost.phase,progress:Math.round(ghost.progress||0)}:null})};
})(typeof window!=='undefined'?window:globalThis);
