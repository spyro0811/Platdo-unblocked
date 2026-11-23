
/* PLATDO City vehicle dealerships (V13.1). The same file in the game and on the multiplayer host
 * (server/platdo-city/src/dealers.js), so both build the same places and decide the same purchases.
 * - SHOPS: Metro Motors, Apex Exotics and Volt & Velocity, and Harborline Marina, which replaces the old marina on the west inlet.
 *   V13.9: the three showrooms stand in the city on Motor Row (CITY_ROW, a street off West Circuit by the inlet) and Skyward's
 *   by Northpoint Airport. V14.0: the three car yards are in the city too, one behind another in the field north of Airfield
 *   Road beside Motor Row (each shop's depot), each with its own lane down to Airfield Road; Skyward's yard was already on
 *   Airfield Road by the hangars. Old Northhaven has nothing of the dealerships left.
 *   (Skyward Aviation comes with the hangars.) Every vehicle in the game is sold by exactly one shop.
 * - Each shop: a showroom you walk into, a salesperson at a desk, display vehicles (look only, never yours),
 *   customer parking, and a yard with a parking space for every delivery team.
 * - buy(): the only way to buy a vehicle now. It checks you are at the salesperson, the price, your money and
 *   that you do not own it yet, then pays once (the existing LINK ledger, keyed by the purchase token, so a retry
 *   or a double click can never pay twice), adds the vehicle to your garage marked "awaiting delivery", and puts
 *   it in your delivery queue. The delivery itself is in dealer-fleet.js.
 * - The look of the buildings, displays and signs is in city-dealers-look.js (game only). */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityDealers=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const need=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
/* the delivery yards' street (it was Motor Row until V13.9), and Motor Row itself, in the city since V13.9 */
const ROW={name:'Fleet Yard Road',z:-659,x0:-620,x1:-260,width:14,front:-696};
const CITY_ROW={name:'Motor Row',z:460,x0:-823,x1:-620,width:14};
/* V14.0: the street the car yards' lanes come out on (the same road as hangars.js ROAD) */
const AIRFIELD={name:'Airfield Road',z:345,x0:-823,x1:-620,width:14};
const FLEET_MAX=30;
/* how many delivery teams each shop keeps: one for every player a room can hold (the host's own setting) */
const FLEET_DEFAULT=8;
const SHOPS=[
 {id:'dealer-metro',key:'metro',name:'Metro Motors',kind:'row',site:{street:CITY_ROW,x:-652.5,w:42,park:16},depot:{street:AIRFIELD,x:-691,w:60,front:322,d:2},x:-332,w:46,d:26,h:7.6,tractor:'workhorse',carrier:'car',paint:0x1f5fbf,colors:{main:'#1f5fbf',light:'#eef2f6',mid:'#c9d2dc',dark:'#2a3442'},
  blurb:'Everyday cars, vans and work trucks for the city.',
  stock:['pebble','metro','longshore','vela','brute','solace','ridge','workhorse','scrambler','sunrunner','parcel','haul','beacon','sentinel','mercy','dart','arcadia','bavaro-m3','mazuka-rx7','hondai-civic'],inside:['bavaro-m3','hondai-civic','solace','metro']},
 {id:'dealer-apex',key:'apex',name:'Apex Exotics',kind:'row',site:{street:CITY_ROW,x:-714.5,w:38,park:16},depot:{street:AIRFIELD,x:-687,w:68,front:230.5,d:2},x:-446,w:40,d:26,h:7.6,tractor:'workhorse',carrier:'car',paint:0x18191b,colors:{main:'#c9a24a',light:'#2b2c30',mid:'#3a3b40',dark:'#111214'},
  blurb:'Luxury, sports and super cars.',
  stock:['apex','halcyon','vesper','razor','spectre','aurora','ferrano-f40','monarch','nissora-gtr','porse-912','toyada-supra','meridian-g63'],inside:['spectre','ferrano-f40','aurora','vesper']},
 {id:'dealer-volt',key:'volt',name:'Volt & Velocity',kind:'row',site:{street:CITY_ROW,x:-772.5,w:34,park:16},depot:{street:AIRFIELD,x:-683,w:76,front:139,d:2},x:-556,w:36,d:24,h:7,tractor:'haul',carrier:'box',paint:0x2b2f33,colors:{main:'#b6f24a',light:'#f4f6f2',mid:'#3a3f44',dark:'#1f2326'},
  blurb:'Motorcycles, scooters, e-bikes and bicycles.',
  stock:['comet-r','skipper','kestrel-s','volt-rs','trailfox','tootio_sol_1','sir_ron_buzz_x','stork_vargle_mx','souper_74_rx','r2r_ripster','razzler','curb-bmx','ridge-trail','aero-road'],inside:['tootio_sol_1','sir_ron_buzz_x','stork_vargle_mx','souper_74_rx','r2r_ripster','razzler','curb-bmx','ridge-trail','aero-road']},
 {id:'marina',key:'harborline',name:'Harborline Marina',kind:'marina',x:-647,z:641,w:26,d:22,h:7,tractor:'workhorse',carrier:'boat',paint:0x14365a,colors:{main:'#14365a',light:'#f5f8fa',mid:'#1e8a8c',dark:'#0d2238',wood:'#a8784a'},
  blurb:'Boats and watercraft, launched for you at our ramp.',
  stock:['puddle','marlin','trawler','sundrift','breaker-rib','manta-cat','wave-dart','surge-x'],inside:[]},
 /* V13.2: at the personal hangars, on Airfield Road (Exchange Avenue continued west); its trucks only use the airfield's
  * own wide roads, because a plane's wings (up to 16.2 m) do not fit the city streets */
 {id:'dealer-skyward',key:'skyward',name:'Skyward Aviation',kind:'row',/* V13.9: the showroom by Northpoint Airport, its aircraft on a display field across the road */site:{street:{name:'Airport Forecourt',z:-1159,width:12},x:375,w:44,lot:11,park:16,planes:[[110,-1128,Math.PI],[150,-1128,Math.PI],[190,-1128,Math.PI],[230,-1128,Math.PI],[270,-1128,Math.PI],[310,-1128,Math.PI]]},street:{name:'Airfield Road',z:345,x0:-823,x1:-620,width:14,front:308},x:-760,w:44,d:26,h:8,tractor:'haul',carrier:'plane',paint:0x3a8fd6,pitch:5.2,laneGap:6,colors:{main:'#3a8fd6',light:'#f5f8fb',mid:'#c9d2dc',dark:'#24384c'},
  blurb:'Planes and helicopters, delivered to your own hangar.',
  stock:['skylark','wren','courier-twin','atlas-prop','lumen-jet','scout','lift'],inside:['scout']}
];
const byId=Object.fromEntries(SHOPS.map(s=>[s.id,s]));
const shopOfType={};for(const s of SHOPS)for(const t of s.stock)shopOfType[t]=s.id;
/* the trailers the teams pull (delivery equipment only: never sold, never driven by players) */
const TRAILERS={car:{length:8.4,width:2.5,deck:.62,hitch:.9,axle:-1.4},boat:{length:10.6,width:2.6,deck:.55,hitch:1.0,axle:-1.2},/* V13.2: a long low trailer for planes and helicopters */plane:{length:14,width:3.4,deck:.55,hitch:1.0,axle:-2.2}};
const trailerOf=shop=>shop.carrier==='box'?null:TRAILERS[shop.carrier]||TRAILERS.car;
const rigLength=shop=>{const V=need('CityVehicles','./vehicles.js'),t=V.byId[shop.tractor]?.dimensions?.length||5.1,tr=trailerOf(shop);return tr?t+tr.length+.6:t;};
// ---- where everything stands ---------------------------------------------------------------------------------------
/* The delivery yards: the rigs (truck, or truck and trailer) stand side by side in rows, each row with a 13 m aisle in
 * front of it, so a loaded rig drives out forwards and comes back by passing its own marked space and reversing into it,
 * trailer first. A lane beside the yard joins every aisle to its street (Airfield Road since V14.0; at the marina, the launch ramp).
 * The row yards' rigs face south, towards that street; the marina's lie south of the office
 * and face north. Each team's driver waits by the drivers' hut when the team is free. */
const PITCH=4.2,AISLE=13,DEPART=10.5,ARRIVE=6.5,TURN=6,BACKIN=6.5;
function layout(shop){
 if(shop._layout)return shop._layout;const out={},V=need('CityVehicles','./vehicles.js'),tl=V.byId[shop.tractor]?.dimensions?.length||5.1,L=rigLength(shop);
 out.tractorLength=tl;out.rigLength=L;out.carrier=shop.carrier;
 if(shop.kind==='row'){
  /* V13.9: a shop with a site has its showroom, display lot, customer car park, signs and salesperson there (in the city,
   * or for Skyward by Northpoint Airport); its delivery yard, lane and drivers' hut stay where the shop first stood (the
   * depot: Fleet Yard Road, or Airfield Road for Skyward). x, w, front, back are the depot's; sx, sw, sfront, sback the
   * showroom's (the same when there is no site). */
  /* V14.0: a shop's own depot (street, x, w, front, d) places its yard; without one, where the shop first stood */
  const DP=shop.depot||null,R=DP?DP.street:(shop.street||ROW),front=DP?DP.front:R.front,dd=DP?(DP.d??shop.d):shop.d,back=front-dd,zc=front-dd/2,x=DP?DP.x:shop.x,w=DP?DP.w:shop.w,gap=shop.laneGap||3;
  const S0=shop.site||null,SR=S0?S0.street:R,sx=S0?S0.x:x,sw=S0?(S0.w||w):w,sfront=S0?SR.z-SR.width/2-2.8-(S0.lot??16)-1.2:front,sback=sfront-shop.d,szc=sfront-shop.d/2,park=S0?(S0.park??24):24;
  const lane={x0:x+w/2+gap,x1:x+w/2+gap+8},laneX=(lane.x0+lane.x1)/2,laneOut=laneX-2,laneIn=laneX+2;
  const cols=[];for(let cx=x-w/2+9;cx<=laneOut-TURN-1.5;cx+=shop.pitch||PITCH)cols.push(+cx.toFixed(2));
  const perRow=cols.length,rows=Math.ceil(FLEET_MAX/perRow),nose=r=>back-19-r*(L+AISLE);
  Object.assign(out,{front:sfront,back:sback,zc:szc,x:sx,w:sw,dir:1,cols,perRow,rows,nose,laneX,laneOut,laneIn,depot:{x,w,front,back,zc},site:!!S0,
   showroom:{x0:sx-sw/2,x1:sx+sw/2,z0:sback,z1:sfront},
   lot:{x0:sx-sw/2,x1:sx+sw/2,z0:sfront+1.2,z1:SR.z-SR.width/2-2.8},street:R,siteStreet:SR,
   parking:shop.carrier==='plane'&&!S0?{x0:lane.x1+3,x1:lane.x1+76,z0:back+2,z1:back+26}:{x0:sx-sw/2-park-2,x1:sx-sw/2-2,z0:sback+2,z1:SR.z-SR.width/2-2.8},
   desk:{x:sx,z:sback+4.2},staff:{x:sx,z:sback+2.5,yaw:0},talk:{x:sx,z:sback+6.4}});
  lane.z0=nose(rows-1)-L-2;lane.z1=R.z-R.width/2;out.lane=lane;
  out.yard={x0:x-w/2,x1:lane.x1,z0:lane.z0,z1:back};
  out.slot=i=>{const r=Math.floor(i/perRow),c=i%perRow,n=nose(r);return{x:cols[c],z:n-tl/2,yaw:0,nose:n,row:r,col:c,depart:n+DEPART,arrive:n+ARRIVE};};
  /* customer bays: two rows facing an aisle, entered from the street */
  out.bays=[];if(shop.carrier==='plane'&&!S0){for(let k=0;k<14;k++)out.bays.push({x:out.parking.x0+2+k*3,z:out.parking.z0+4,yaw:Math.PI});}else for(let k=0;k<12;k++){const z=out.parking.z1-4-k*3;if(z<out.parking.z0+3)break;out.bays.push({x:out.parking.x0+3.2,z,yaw:-Math.PI/2},{x:out.parking.x1-3.2,z,yaw:Math.PI/2});}
  /* loading: in the lane, heading for the street, the rig's tail clear of the turn it came round */
  const tr0=trailerOf(shop),tail=tr0?tl/2+tr0.hitch+tr0.length:tl/2;
  out.load={x:laneOut,z:back-1.5+tail,yaw:0,tail:back-1.5};
  out.exit={x:laneOut,z:lane.z1};out.entry={x:laneIn,z:lane.z1};
  out.hut={x:x-w/2+3.5,z:back-3.2,w:5,d:4,h:3};out.hutDoor={x:out.hut.x+3.2,z:out.hut.z};
  /* the drivers wait by the hut in twos, facing each other as they talk */
  out.lounge=i=>{const pair=Math.floor(i/2),side=i%2;return{x:out.hut.x+4.6+pair*1.7+(side?.25:0),z:back-1.35-side*1.25,yaw:side?0:Math.PI};};
  /* the display vehicles: some in the showroom, the rest in two rows on the lot facing the street */
  const inside=shop.stock.filter(t=>shop.inside.includes(t)),outside=shop.stock.filter(t=>!shop.inside.includes(t));
  out.displays=[];
  if(shop.carrier==='box'){
   /* rideables: podiums along the side walls inside, motorcycles in a row outside */
   inside.forEach((t,i)=>{const side=i%2?1:-1,k=Math.floor(i/2);out.displays.push({typeId:t,x:sx+side*(sw/2-2.6),z:sback+5+k*3.6,yaw:-side*Math.PI/2,inside:true,podium:true});});
  }else inside.forEach((t,i)=>{const side=i%2?1:-1,k=Math.floor(i/2);out.displays.push({typeId:t,x:sx+side*(sw/4+1.5),z:sfront-6.5-k*8.6,yaw:i<2?Math.PI*.82*side:-.25*side,inside:true,podium:true});});
  const rowsZ=[out.lot.z1-4.2,out.lot.z0+4.0],gap2=3.6,usable=(out.lot.x1-out.lot.x0)-6,perLine=Math.max(1,Math.floor(usable/(2*gap2))*2);
  /* aircraft: by the airport, where the site lists them; otherwise one row along the road, either side of the lane */
  if(shop.carrier==='plane'&&S0?.planes)outside.forEach((t,i)=>{const p=S0.planes[i%S0.planes.length];out.displays.push({typeId:t,x:p[0],z:p[1],yaw:p[2]??0,inside:false});});
  else if(shop.carrier==='plane'){const xs=[x-w/2-15,x-w/2+11,x+w/2-11,lane.x1+16,lane.x1+38,lane.x1+60,lane.x1+80];outside.forEach((t,i)=>out.displays.push({typeId:t,x:xs[i]??(lane.x1+80+(i-6)*22),z:out.lot.z1-13.6,yaw:0,inside:false}));}
  else outside.forEach((t,i)=>{const r=i<perLine?0:1,k=r?i-perLine:i,cnt=r?outside.length-perLine:Math.min(perLine,outside.length),half=Math.ceil(cnt/2),left=k<half,j=left?k:k-half,dx=(left?-1:1)*(3.4+gap2*.5+j*gap2);out.displays.push({typeId:t,x:sx+dx,z:rowsZ[r],yaw:0,inside:false});});
 }else if(shop.kind==='marina'){
  const x=shop.x,z=shop.z,w=shop.w,d=shop.d,front=z+d/2,back=z-d/2,laneX=-628.6;
  const cols=[];for(let c=0;c<8;c++)cols.push(+(-665.2+c*PITCH).toFixed(2));
  const perRow=cols.length,rows=Math.ceil(FLEET_MAX/perRow),nose=r=>693+r*(L+AISLE);
  Object.assign(out,{front,back,zc:z,x,dir:-1,cols,perRow,rows,nose,laneX,laneOut:laneX,laneIn:laneX,showroom:{x0:x-w/2,x1:x+w/2,z0:back,z1:front},desk:{x,z:back+4.2},staff:{x,z:back+2.5,yaw:0},talk:{x,z:back+6.4}});
  out.lane={x0:laneX-2,x1:laneX+2,z0:650,z1:nose(rows-1)+L+2};
  out.yard={x0:cols[0]-PITCH,x1:laneX+2,z0:nose(0)-AISLE,z1:nose(rows-1)+L+2};
  /* the first teams take the eastern spaces (their turn in and out stays on the flat, away from the water's edge) */
  out.slot=i=>{const r=Math.floor(i/perRow),c=perRow-1-i%perRow,n=nose(r);return{x:cols[c],z:n+tl/2,yaw:Math.PI,nose:n,row:r,col:c,depart:n-DEPART,arrive:n-ARRIVE};};
  /* boats for sale, on trailers, bows to the water, north of the office */
  out.displays=shop.stock.map((t,i)=>{const dm=V.byId[t].dimensions;return{typeId:t,x:-649,z:571+i*6.6,yaw:-Math.PI/2,inside:false,trailer:true,width:dm.width,length:dm.length,height:dm.height};});
  /* customer bays: a row along Coast Boulevard beside the boats on show */
  out.bays=[];for(let k=0;k<15;k++)out.bays.push({x:-630.5,z:576+k*3,yaw:-Math.PI/2});
  /* the launch ramp: the bank already slopes into the inlet here; a rig turns into it from the lane and reverses down */
  out.ramp={x0:-664,x1:-702,z:667.5,width:7,turn:{x:laneX,z:655,r:12.5},back:{r:9}};
  out.hut={x:-664,z:676,w:5,d:4,h:3};out.hutDoor={x:out.hut.x+3.2,z:out.hut.z};
  out.lounge=i=>{const pair=Math.floor(i/2),side=i%2,row=Math.floor(pair/5);return{x:-659.6+(pair%5)*1.7+(side?.25:0),z:674.4+side*1.1+row*2.3,yaw:side?Math.PI:0};};
  out.exit={x:-624,z:665};
 }
 for(const dsp of out.displays||[]){const d=V.byId[dsp.typeId]?.dimensions||{width:2,length:4.5,height:1.6};dsp.width=d.width;dsp.length=d.length;dsp.height=d.height;}
 return shop._layout=out;
}function shops(){return SHOPS;}
function shop(id){return byId[id]||null;}
function shopFor(typeId){return byId[shopOfType[typeId]]||null;}
// ---- the static world: the street, the buildings, what stands in them -----------------------------------------------
function roads(road){/* V14.0: Fleet Yard Road (the first Motor Row) is gone with the yards; V13.9: Motor Row in the city, from West Circuit to the hangars' service road (both have a point here) */road(CITY_ROW.name,[[CITY_ROW.x1,CITY_ROW.z],[CITY_ROW.x0,CITY_ROW.z]],CITY_ROW.width,10,'ground','street');}
/* replaces the old marina and adds the showrooms to the list of places (after every other place is where it stays) */
function replace(services){
 const i=services.findIndex(s=>s[0]==='marina');if(i>=0)services.splice(i,1);
 for(const s of SHOPS){const L=layout(s);services.push([s.id,s.name,'dealer',L.x,L.zc,L.w||s.w,s.d,s.h]);}
}
function furnish(s,furn){
 const shop=byId[s.id];if(!shop)return;const L=layout(shop);s.dealer=shop.id;s.dealerKey=shop.key;
 furn('dealer-desk',L.desk.x-s.x,L.desk.z-s.z,4.6,1.05,1.4,'#e8ecef');
 furn('dealer-chair',L.desk.x-s.x-1.2,L.desk.z-s.z+1.7,.6,.9,.6,'#2b3036');furn('dealer-chair',L.desk.x-s.x+1.2,L.desk.z-s.z+1.7,.6,.9,.6,'#2b3036');
 s.staff={x:L.staff.x,y:s.y,z:L.staff.z,yaw:0};s.interaction={x:L.talk.x,y:s.y,z:L.talk.z};s.contact={x:L.desk.x+5.2,y:s.y,z:L.desk.z+3};
 /* plants in the four corners, and (where the floor is free) a waiting corner by the front glass: a sofa and a low table */
 for(const sx of[-1,1])for(const sz of[-1,1])furn('dealer-plant',sx*(s.w/2-1.25),sz*(s.d/2-1.25),.7,1.5,.7,'#3f7a3a');
 if(shop.carrier!=='box'){furn('dealer-sofa',-s.w/2+1.3,s.d/2-4.6,.95,.82,2.4,'#30363d');furn('dealer-table',-s.w/2+2.85,s.d/2-4.6,.8,.45,1.3,'#d9dde1');}
}
/* solid display vehicles (look only), the yard hut, the marina's ramp edges; trucks and trailers move, so they are not here */
function install(world,api){
 const {box,terrainHeight}=api;world.dealers=[];
 for(const shop of SHOPS){const L=layout(shop),y0=terrainHeight(L.x,L.zc)+.08;world.dealers.push({id:shop.id,key:shop.key,layout:L});
  for(let i=0;i<L.displays.length;i++){const d=L.displays[i],gy=d.inside?y0:terrainHeight(d.x,d.z),c=Math.abs(Math.cos(d.yaw)),sn=Math.abs(Math.sin(d.yaw)),w=c*d.width+sn*d.length+.1,l=sn*d.width+c*d.length+.1,lift=d.podium?.3:d.trailer?.75:0;
   if(d.podium)box(shop.id+':podium-'+i,d.x,gy,d.z,w+.8,.3,l+.8,'masonry',{floor:true,dealerDisplay:true});
   box(shop.id+':display-'+i,d.x,gy+lift,d.z,w,Math.max(.6,d.height*.85),l,'metal',{dealerDisplay:true});}
  if(L.hut)box(shop.id+':hut',L.hut.x,terrainHeight(L.hut.x,L.hut.z),L.hut.z,L.hut.w,L.hut.h,L.hut.d,'masonry',{dealerHut:true});
  for(const [k,s] of signsOf(shop).entries()){const gy=terrainHeight(s.x,s.z);if(s.kind==='pylon'){box(shop.id+':pylon-base',s.x,gy,s.z,1.2,.5,1.2,'masonry',{dealerSign:true});box(shop.id+':pylon',s.x,gy,s.z,.5,s.h,.5,'metal',{dealerSign:true});}else box(shop.id+':flag-'+k,s.x,gy,s.z,.12,s.h,.12,'metal',{dealerSign:true});}
 }
}
/* the tall pylon sign by the road and the flag poles (their poles are solid, see install) */
function signsOf(shop){const L=layout(shop),out=[];
 if(shop.kind==='row'){out.push({kind:'pylon',x:L.lot.x0-1,z:L.lot.z1-1.4,yaw:0,h:9.5,w:3.6});for(const fx of[L.lot.x0+3.2,L.x-9.5,L.x+9.5,L.lot.x1-3.2])out.push({kind:'flag',x:fx,z:L.lot.z1-.6,yaw:0,h:6.6});}
 else{out.push({kind:'pylon',x:-628.2,z:623,yaw:Math.PI/2,h:9.5,w:3.6});for(const z of[581,600])out.push({kind:'flag',x:-627.3,z,yaw:Math.PI/2,h:6.6});}
 return out;}
// ---- buying -----------------------------------------------------------------------------------------------------------
/* who is standing at a shop's salesperson (the player the simulation is acting for) */
function at(sim,shopId){const shop=byId[shopId],s=sim.world.serviceById?.[shopId],p=sim.player;if(!shop||!s||!p)return false;const L=layout(shop);return p.health>0&&p.mode==='onFoot'&&Math.hypot(p.x-L.talk.x,p.z-L.talk.z)<5.5&&Math.abs(p.y-s.y)<2.5;}
function catalog(sim,shopId){
 const shop=byId[shopId];if(!shop)return[];const V=need('CityVehicles','./vehicles.js'),p=sim.profile;
 return shop.stock.map(t=>{const d=V.byId[t];const o=(p.owned||[]).find(e=>e.typeId===t);return{id:t,name:d.name,price:d.price,category:d.category,kind:d.kind,silhouette:d.silhouette,electric:!!d.electric,pedal:!!d.pedalOnly,dimensions:d.dimensions,topSpeed:d.topSpeed,seats:d.seats||d.seatCount||null,owned:!!o,delivery:o?.delivery?.state||null};});
}
/* the one purchase path: from the salesperson, after the agreement is signed */
function buy(sim,shopId,typeId,token,signed){
 const shop=byId[shopId],M=need('CityMotors','./motors.js');
 if(!shop)return{ok:false,message:'This shop does not exist.'};
 if(!shop.stock.includes(typeId))return{ok:false,message:shop.name+' does not sell that vehicle.'};
 if(signed!==true)return{ok:false,message:'Sign the agreement first.'};
 if(!at(sim,shopId))return{ok:false,message:'Talk to the salesperson at '+shop.name+' to buy.'};
 if(typeof token!=='string'||!/^[A-Za-z0-9-]{8,90}$/.test(token))return{ok:false,message:'Invalid purchase.'};
 /* the same token again (a retry, a second click): the first purchase stands, nothing is paid twice */
 const done=sim.profile.transactions&&Object.prototype.hasOwnProperty.call(sim.profile.transactions,'motors:'+token);
 if(done){const e=(sim.profile.owned||[]).find(o=>o.typeId===typeId);return e?{ok:true,repeat:true,entry:e,message:'Already bought.'}:{ok:false,message:'This purchase was already processed.'};}
 const r=M.purchase(sim,typeId,token,shop.name);if(!r.ok)return r;
 r.entry.delivery={shop:shop.id,state:'queued',at:Math.round(sim.time||0),seq:nextSeq(sim.profile)};
 sim.dirty=true;sim.emit('dealerPurchase',{shop:shop.id,typeId,ownedId:r.entry.id,price:need('CityVehicles','./vehicles.js').byId[typeId].price});
 return{ok:true,entry:r.entry,message:'Purchased. Your '+need('CityVehicles','./vehicles.js').byId[typeId].name+' will be delivered.'};
}
function nextSeq(p){let n=0;for(const o of p.owned||[])if(o.delivery&&o.delivery.seq>n)n=o.delivery.seq;return n+1;}
/* the deliveries a player is waiting for, oldest first */
function queue(p){return (p.owned||[]).filter(o=>o.delivery&&o.delivery.state!=='done').sort((a,b)=>(a.delivery.seq||0)-(b.delivery.seq||0));}
/* a saved delivery state from an older or edited save is cleaned up */
function normalizeEntry(o){const d=o.delivery;if(d===undefined)return;if(!d||typeof d!=='object'||!byId[d.shop]||!['queued','active'].includes(d.state)){delete o.delivery;return;}o.delivery={shop:d.shop,state:'queued',at:Number.isFinite(d.at)?d.at:0,seq:Number.isInteger(d.seq)?d.seq:0};}
return{ROW,CITY_ROW,SHOPS,TRAILERS,FLEET_DEFAULT,FLEET_MAX,PITCH,AISLE,DEPART,ARRIVE,TURN,BACKIN,signsOf,shops,shop,shopFor,layout,rigLength,roads,replace,furnish,install,at,catalog,buy,queue,normalizeEntry};
});
