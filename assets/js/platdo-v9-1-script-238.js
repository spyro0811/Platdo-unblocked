
/* V4 Seaglass Beach. One description of the beach is shared by the ground height, collisions, the drawn sand,
 * the furniture and the surf, so they cannot drift apart. The multiplayer server loads this same file for the
 * ground and the collisions; the drawing half only runs in the game.
 * Layout, north to south: Coast Boulevard, a verge with palms, the car park and the promenade, then open sand
 * that slopes gently to a wet strip, a shallow shelf and deep water. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityBeach=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},TAU=Math.PI*2;
/* V7.1: shorter along the shore (was -765 to 260) */const ZONE={x0:-600,x1:150,z0:744},PATH_Z=756,SEA=230;
/* V5.6: four smaller car parks along Coast Boulevard in place of one long one. OLD is where the first car park
 * stood: the layout still measures against it wherever a random draw is made, so the rest of the beach (camps,
 * towels, palms, grass) stays exactly where it was. */
const OLD={x0:-30,x1:100,z0:738,z1:780},LOTS=[-520,-310,-30,100].map((cx,id)=>({id,cx,x0:cx-26,x1:cx+26,z0:738,z1:757,y:2.58})),LOT=LOTS[2];
/* The guardrail on the beach side of the boulevard, beyond the pavement: 4 m lengths, open at every driveway and footpath. */
/* V7.1: the boulevard is 12 m wide now, so its rail stands 3 m nearer the middle of the road */const RAIL={z:729.9,x0:-612,x1:252,span:4,h:.82,d:.3};
// The waterline along the beach is two straight runs that meet at x = -200.
/* V7.1: the sea is about 90 m nearer the road: the waterline was at z 920 to 1010 */const shoreZ=x=>x<-200?826+(x+600)*16/400:842-(x+200)*14/350,slopeK=x=>1.0008;
const COURTS=[-190,-164].map(x=>({x,z:shoreZ(x)-42,r:13})),TOWERS=[-470,30].map(x=>({x,z:shoreZ(x)-17,r:4.5})),FLATS=[...COURTS,...TOWERS],/* V7.1: a boardwalk from the City Avenue junction as well */WALKS=[-430,-260,-140,35];
function weight(x,z){if(z<=ZONE.z0||x<=ZONE.x0||x>=ZONE.x1)return 0;return smooth((z-ZONE.z0)/20)*smooth((x-ZONE.x0)/60)*smooth((ZONE.x1-x)/45);}
function hash2(ix,iz){let h=Math.imul(ix,374761393)^Math.imul(iz,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;}
function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz);return mix(mix(hash2(ix,iz),hash2(ix+1,iz),u),mix(hash2(ix,iz+1),hash2(ix+1,iz+1),u),v);}
// Height against distance from the waterline (positive = inland): back beach, foreshore, swash, shelf, drop-off.
/* V7.1: the same bands on a beach less than half as deep */function profile(s){if(s>=68)return 2.5;if(s>=24)return mix(1.25,2.5,smooth((s-24)/44));if(s>=9)return mix(.45,1.25,(s-9)/15);if(s>=0)return mix(-.2,.45,s/9);if(s>=-45)return mix(-1.7,-.2,(s+45)/45);if(s>=-95)return mix(-14,-1.7,smooth((s+95)/50));return-14;}
function height(x,z,s){let y=profile(s),k=s>27&&s<70?smooth((s-27)/13)*smooth((70-s)/12):0;for(const f of FLATS){const q=Math.hypot(x-f.x,z-f.z);if(q<f.r+9){const level=1-smooth((q-f.r)/9);f.y0??=profile((shoreZ(f.x)-f.z)/slopeK(f.x));y=mix(y,f.y0,level);k*=1-level;}}if(k>0)y+=((noise(x/23+3.1,z/19-7.7)-.5)*.62+(noise(x/8.5+40,z/8.5)-.5)*.14)*k;return y;}
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const TOWEL=[['#d94f45','#f4efe2'],['#2f7fbd','#f1eee4'],['#f2c14e','#e8743b'],['#3aa39a','#f3f0e6'],['#e58aa5','#fbf3ee'],['#5f4bb6','#f0c75e'],['#f08a3c','#2f5d8a'],['#7fb069','#f6f2e3'],['#22313f','#e55d4e'],['#ffffff','#39a0c9']];
const SHADE=[['#e2483d','#f6f2e8'],['#2d74b8','#f6f2e8'],['#f0c23f','#f6f2e8'],['#33a69b','#f2e9c9'],['#ee7f9f','#f6f2e8'],['#f08533','#f4e3b8'],['#1f4a73','#e9b949'],['#6fae5c','#f6f2e8']];
const COOLER=['#2f6fb5','#d84a3f','#f1efe8','#2e9a8f','#e8a531'],CARS=['pebble','metro','longshore','vela','halcyon','solace','ridge','workhorse','dart','monarch','vesper','arcadia','aurora','brute'],PAINT=[0xd8d5cc,0x23272b,0x9c2f2a,0x2f5f8f,0x6f7b82,0xe9e6df,0x3f6f55,0xc98a2b,0x7a2f43,0x1e3f5c,0xb9bcc0,0x4a4f55];
let cached=null;
function promenade(){const walk=[[ZONE.x0+62,PATH_Z]];for(const l of LOTS)walk.push([l.x0-14,PATH_Z],[l.x0-14,l.z1+6],[l.x1+14,l.z1+6],[l.x1+14,PATH_Z]);walk.push([ZONE.x1-42,PATH_Z]);return walk;}
function rails(){const gaps=[...LOTS.map(l=>[l.cx-6.2,l.cx+6.2]),[-83,-77],...WALKS.map(w=>[w-2.4,w+2.4])].sort((a,b)=>a[0]-b[0]),out=[];let from=RAIL.x0;
 const run=(a,b,z=RAIL.z)=>{const n=Math.floor((b-a)/RAIL.span);if(n<1)return;const pad=(b-a-n*RAIL.span)/2;for(let i=0;i<n;i++)out.push({id:'rail:'+out.length,index:out.length,x:a+pad+(i+.5)*RAIL.span,z,length:RAIL.span});};
 for(const[g0,g1]of gaps){if(g0>from)run(from,g0);from=Math.max(from,g1);}run(from,RAIL.x1);
 /* V7.1: a rail along the beach side of every car park, open at its two footpaths, so a car cannot roll onto the sand */
 for(const l of LOTS){const z=l.z1+.6;run(l.x0+.3,l.x0+11,z);run(l.x0+15,l.x1-15,z);run(l.x1-11,l.x1-.3,z);}
 return out;}
// Everything that stands on the beach, decided once from a fixed seed so every player and the server agree.
function layout(){
 if(cached)return cached;
 const R=rng(74211),L={palms:[],umbrellas:[],towels:[],chairs:[],coolers:[],bags:[],castles:[],balls:[],courts:COURTS,towers:TOWERS,steps:[],cars:[],lamps:[],islands:[],curbs:[],lines:[],grass:[],planks:[],lot:LOT};
 const taken=[...FLATS.map(f=>({x:f.x,z:f.z,r:f.r+3}))],free=(x,z,r)=>taken.every(t=>Math.hypot(x-t.x,z-t.z)>r+t.r);
 // The first car park's random draws are still made, in the same order, and thrown away: see OLD above.
 {const B={cars:[],palms:[]},rows=[[742.6,Math.PI],[757.4,0],[762.6,Math.PI],[777.4,0]],first=OLD.x0+6.5,count=Math.floor((OLD.x1-OLD.x0-13)/2.6);
  for(const[z,yaw]of rows)for(let i=0;i<count;i++){const x=first+i*2.6+1.3;if(Math.abs(x+10)<5.5||Math.abs(x-80)<5.5)continue;if(R()<.22)B.cars.push({x:x+(R()-.5)*.3,z:z+(R()-.5)*.5,yaw:yaw+(R()<.2?Math.PI:0)+(R()-.5)*.09,type:Math.floor(R()*CARS.length),paint:PAINT[Math.floor(R()*PAINT.length)]});}
  for(const x of[OLD.x0+3.2,OLD.x1-3.2]){B.palms.push({x,z:757.6,h:7.4+R()*1.6,lean:(R()-.5)*.2,yaw:R()*TAU,s:.9});B.palms.push({x:x+(R()-.5),z:762.6,h:6.2+R()*1.4,lean:(R()-.5)*.25,yaw:R()*TAU,s:.85});}}
 // Car parks: each has one driveway from the boulevard, a row of spaces along the road side and one along the
 // beach side with the lane between them, a planted island with a palm and a lamp at each end, and a kerb all
 // round that is open at the driveway and at two footpaths to the promenade. They draw from their own seed.
 const R2=rng(90417),run=(a,b,z,gaps)=>{let from=a;for(const[g0,g1]of gaps){if(g0>from)L.curbs.push({x:(from+g0)/2,z,w:g0-from,d:.3});from=g1;}if(b>from)L.curbs.push({x:(from+b)/2,z,w:b-from,d:.3});};
 for(const lot of LOTS){const first=lot.x0+6.5,count=Math.floor((lot.x1-lot.x0-13)/2.6),mid=(lot.z0+lot.z1)/2;
  for(const[z,yaw,roadSide]of[[lot.z0+3.3,Math.PI,true],[lot.z1-3.3,0,false]]){for(let i=0;i<=count;i++){const x=first+i*2.6;if(roadSide&&Math.abs(x-lot.cx)<4.6)continue;L.lines.push({x,z,w:.12,d:5.2});}
   for(let i=0;i<count;i++){const x=first+i*2.6+1.3;if(roadSide&&Math.abs(x-lot.cx)<5.5)continue;if(R2()<.3)L.cars.push({x:x+(R2()-.5)*.3,z:z+(R2()-.5)*.5,yaw:yaw+(R2()<.2?Math.PI:0)+(R2()-.5)*.09,type:Math.floor(R2()*CARS.length),paint:PAINT[Math.floor(R2()*PAINT.length)],lot:lot.id});}}
  for(const x of[lot.x0+3.2,lot.x1-3.2]){L.islands.push({x,z:mid,w:4.2,d:7});L.palms.push({x,z:mid-2.1,h:7+R2()*1.6,lean:(R2()-.5)*.2,yaw:R2()*TAU,s:.9,fixed:true});L.lamps.push({x,z:mid+2});}
  run(lot.x0,lot.x1,lot.z0,[[lot.cx-4.5,lot.cx+4.5]]);run(lot.x0,lot.x1,lot.z1,[[lot.x0+11,lot.x0+15],[lot.x1-15,lot.x1-11]]);for(const x of[lot.x0,lot.x1])L.curbs.push({x,z:mid,w:.3,d:lot.z1-lot.z0});}
 // Palms: loose groups on the verge by the road and on the back of the beach, never an even row.
 for(let x=ZONE.x0+70;x<ZONE.x1-30;){const group=1+Math.floor(R()*R()*4.2),z0=x>OLD.x0-20&&x<OLD.x1+20?733+R()*2:736+R()*13;for(let i=0;i<group;i++){const px=x+(R()-.5)*9,pz=z0+(R()-.5)*7;if(pz<733.5||pz>751.5&&x>OLD.x0-20&&x<OLD.x1+20)continue;if(Math.abs(pz-PATH_Z)<3.2)continue;L.palms.push({x:px,z:pz,h:6.5+R()*4,lean:(R()-.5)*.36,yaw:R()*TAU,s:.85+R()*.3});}x+=11+R()*R()*58;}
 // Boardwalks run from the promenade out across the soft sand.
 for(const x of WALKS){const end=shoreZ(x)-26;for(let z=PATH_Z+2.2;z<end;z+=2)L.planks.push({x:x+Math.sin(z*.035)*1.2,z});taken.push({x,z:(PATH_Z+end)/2,r:3});}
 for(let i=0;i<17;i++){const x=ZONE.x0+90+R()*(ZONE.x1-ZONE.x0-160),z=762+R()*R()*34,n=2+Math.floor(R()*4);if(!free(x,z,7)||WALKS.some(w=>Math.abs(x-w)<8))continue;for(let k=0;k<n;k++)L.palms.push({x:x+(R()-.5)*11,z:z+(R()-.5)*9,h:5.5+R()*5,lean:(R()-.5)*.5,yaw:R()*TAU,s:.8+R()*.4});taken.push({x,z,r:7});}
 // Camps: a few umbrellas together here, one towel alone there, and stretches of empty sand between.
 const camp=(x,z,size)=>{const yaw=R()*TAU,col=SHADE[Math.floor(R()*SHADE.length)],shades=size>1?1+Math.floor(R()*Math.min(4,size)):R()<.55?1:0;
  for(let i=0;i<shades;i++){const a=yaw+i*2.1+R(),d=i?1.6+R()*2.2:0,c=R()<.6?col:SHADE[Math.floor(R()*SHADE.length)];L.umbrellas.push({x:x+Math.sin(a)*d,z:z+Math.cos(a)*d,r:1.05+R()*.5,h:1.95+R()*.35,c1:c[0],c2:c[1],tx:(R()-.5)*.3,tz:(R()-.5)*.3,yaw:R()*TAU});}
  const towels=size>1?1+Math.floor(R()*(size+1)):1;for(let i=0;i<towels;i++){const a=yaw+1+i*1.7+R()*.8,d=.6+R()*(1.2+size*.5),c=TOWEL[Math.floor(R()*TOWEL.length)];L.towels.push({x:x+Math.sin(a)*d,z:z+Math.cos(a)*d,yaw:yaw+(R()-.5)*.9,w:.78+R()*.18,l:1.65+R()*.3,c1:c[0],c2:c[1],stripes:Math.floor(R()*4)});}
  const chairs=size>1?Math.floor(R()*3.2):R()<.25?1:0;for(let i=0;i<chairs;i++){const a=yaw-1+i*1.3+R(),d=1.2+R()*1.8;L.chairs.push({x:x+Math.sin(a)*d,z:z+Math.cos(a)*d,yaw:Math.PI+(R()-.5)*1.1,c:SHADE[Math.floor(R()*SHADE.length)][0]});}
  if(R()<(size>1?.75:.3))L.coolers.push({x:x+(R()-.5)*2.4,z:z+(R()-.5)*2.4,yaw:R()*TAU,c:COOLER[Math.floor(R()*COOLER.length)]});
  const bags=Math.floor(R()*(size>1?2.6:1.5));for(let i=0;i<bags;i++)L.bags.push({x:x+(R()-.5)*3,z:z+(R()-.5)*3,yaw:R()*TAU,c:TOWEL[Math.floor(R()*TOWEL.length)][0]});
  if(R()<.16)L.castles.push({x:x+(R()-.5)*5,z:z+3+R()*3,r:.45+R()*.35,yaw:R()*TAU});};
 for(let tries=0,made=0;tries<640&&made<44;tries++){const x=ZONE.x0+70+R()*(ZONE.x1-ZONE.x0-125),busy=.35+.65*noise(x/70+9,2.5),s=9+Math.pow(R(),1.45)*50;if(R()>busy)continue;const z=shoreZ(x)-s*slopeK(x),size=R()<.42?1:2+Math.floor(R()*3),r=size>1?5.2:2.6;if(!free(x,z,r))continue;taken.push({x,z,r});camp(x,z,size);made++;}
 // Dune grass: thick along the back edge, thinning out toward the water.
 for(let i=0;i<340;i++){const x=ZONE.x0+66+R()*(ZONE.x1-ZONE.x0-112),s=38+Math.pow(R(),.55)*(70-38)+R()*10,z=shoreZ(x)-s*slopeK(x);if(z<PATH_Z+3||!free(x,z,1.2)||WALKS.some(w=>Math.abs(x-w)<2.6)||noise(x/31,z/27)<.42)continue;L.grass.push({x,z,s:.7+R()*.7,yaw:R()*TAU,n:3+Math.floor(R()*4)});}
 for(const c of COURTS){L.balls.push({x:c.x+3.2,z:c.z+1.1,kind:'volley'});}
 for(const[x,s]of[[-240,15],[20,17],[-520,13]])L.balls.push({x,z:shoreZ(x)-s,kind:'football'});
 // Footprints: wandering lines of paired prints between the promenade, the camps and the water.
 for(let t=0;t<64;t++){let x=ZONE.x0+80+R()*(ZONE.x1-ZONE.x0-140),z=shoreZ(x)-(4+R()*56),a=R()*TAU;const n=7+Math.floor(R()*16);for(let i=0;i<n;i++){a+=(R()-.5)*.5;x+=Math.sin(a)*.62;z+=Math.cos(a)*.62;if(!free(x,z,.3)&&FLATS.some(f=>Math.hypot(x-f.x,z-f.z)<f.r))break;L.steps.push({x:x+Math.cos(a)*(i%2?-.11:.11),z:z-Math.sin(a)*(i%2?-.11:.11),yaw:a});}}
 // V4.3: more towels, in groups, where the beach is busiest. They are placed last so everything above keeps its spot.
 for(let tries=0,made=0;tries<1200&&made<30;tries++){const x=clamp([-270,-120,35][Math.floor(R()*3)]+(R()-.5)*300,ZONE.x0+80,ZONE.x1-60),z=shoreZ(x)-(8+R()*22)*slopeK(x);if(!free(x,z,2.9)||WALKS.some(w=>Math.abs(x-w)<5))continue;taken.push({x,z,r:2.9});made++;
  const yaw=R()*TAU,n=2+Math.floor(R()*3);for(let i=0;i<n;i++){const c=TOWEL[Math.floor(R()*TOWEL.length)],o=(i-(n-1)/2)*1.25;L.towels.push({x:x+Math.cos(yaw)*o,z:z-Math.sin(yaw)*o,yaw:yaw+(R()-.5)*.3,w:.78+R()*.18,l:1.65+R()*.3,c1:c[0],c2:c[1],stripes:Math.floor(R()*4)});}}
 // V5.6: with the car parks moved, anything that would now stand in one, on a driveway, on a path or against the
 // guardrail is left out. This is done last and makes no random draws.
 {const walk=promenade(),nearPath=(x,z,m)=>{for(let i=1;i<walk.length;i++){const a=walk[i-1],b=walk[i],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);if(Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<m)return true;}return false;},
   inLot=(x,z,m)=>LOTS.some(l=>x>l.x0-m&&x<l.x1+m&&z>l.z0-m&&z<l.z1+m),onDrive=(x,z)=>LOTS.some(l=>Math.abs(x-l.cx)<6.6&&z<l.z0+1),onWalk=(x,z)=>z<PATH_Z+3&&[-80,...WALKS].some(w=>Math.abs(x-w)<2.8)||LOTS.some(l=>z>l.z1-1&&z<l.z1+7&&(Math.abs(x-l.x0-13)<2.6||Math.abs(x-l.x1+13)<2.6)),clear=(x,z,m)=>!inLot(x,z,m)&&!onDrive(x,z)&&!onWalk(x,z)&&!nearPath(x,z,2.4+m*.3);
  L.palms=L.palms.filter(p=>p.fixed||clear(p.x,p.z,2.2)&&Math.abs(p.z-RAIL.z)>1.4);L.grass=L.grass.filter(g=>clear(g.x,g.z,1));L.steps=L.steps.filter(s=>!inLot(s.x,s.z,.5));
  for(const key of['umbrellas','towels','chairs','coolers','bags','castles'])L[key]=L[key].filter(o=>clear(o.x,o.z,1.5));L.lots=LOTS;L.rail=RAIL;}
 return cached=L;
}
// ---- collisions and paved surfaces (also run by the server) --------------------------------------------
function install(world,{box,spanBox,terrain}){
 const L=layout(),ground=(x,z)=>terrain?terrain(x,z):2.5,solid=(id,x,z,w,h,d,lift=0)=>box('beach:'+id,x,ground(x,z)+lift,z,w,h,d,'masonry',{facility:true});
 const surface=(id,points,width,color)=>{world.facilitySurfaces.push({id,points,width,color,terrainSupport:true});for(let i=1;i<points.length;i++)spanBox(id+':'+i,points[i-1],points[i],width,-.22,.22,0,'masonry',{floor:true,facility:true,bank:0});};
 const y=LOT.y;
 for(const l of LOTS){surface('beach-car-park-'+l.id,[{x:l.x0,y,z:(l.z0+l.z1)/2},{x:l.x1,y,z:(l.z0+l.z1)/2}],l.z1-l.z0,'#4d5558');surface('beach-driveway-'+l.id,[{x:l.cx,y,z:725.8},{x:l.cx,y,z:l.z0+.2}],9,'#4d5558');
  for(const x of[l.x0+13,l.x1-13])surface('beach-footpath-'+l.id+'-'+Math.round(x),[{x,y:2.57,z:l.z1},{x,y:2.57,z:l.z1+6}],3.4,'#cdc4ab');}
 const walk=promenade();
 for(let i=1;i<walk.length;i++)surface('beach-promenade-'+i,[{x:walk[i-1][0],y:2.57,z:walk[i-1][1]},{x:walk[i][0],y:2.57,z:walk[i][1]}],4.2,'#cdc4ab');
 for(const x of[-80,...WALKS])surface('beach-footpath-'+x,[{x,y:2.57,z:728.6},{x,y:2.57,z:PATH_Z}],x===-80?4.2:3.4,'#cdc4ab');
 // The guardrail: one solid box for each length. The game opens a length when it is broken (city-guardrails.js).
 const spans=rails();for(const s of spans){s.y=ground(s.x,s.z);s.collider=box(s.id,s.x,s.y,s.z,s.length-.06,RAIL.h,RAIL.d,'metal',{facility:true,rail:true});}world.guardrails={z:RAIL.z,/* V7.1: every line the rails stand on */lines:[...new Set(spans.map(s=>s.z))],height:RAIL.h,depth:RAIL.d,span:RAIL.span,spans};
 L.curbs.forEach((c,i)=>box('beach:kerb-'+i,c.x,y-.02,c.z,c.w,.16,c.d,'masonry',{facility:true,floor:true/* V9.0: drive over it */}));
 L.islands.forEach((p,i)=>box('beach:island-'+i,p.x,y-.02,p.z,p.w,.2,p.d,'masonry',{facility:true}));
 L.lamps.forEach((p,i)=>box('beach:lamp-'+i,p.x,y,p.z,.28,6.5,.28,'masonry',{facility:true}));
 /* V4.9: the parked cars are real cars now (city-parking.js puts them there), so they no longer get a solid box each. */
 L.palms.forEach((p,i)=>solid('palm-'+i,p.x,p.z,.46,p.h*.9,.46));
 L.umbrellas.forEach((p,i)=>solid('shade-'+i,p.x,p.z,.14,p.h,.14));
 L.chairs.forEach((p,i)=>solid('chair-'+i,p.x,p.z,.6,.55,.6));
 L.coolers.forEach((p,i)=>solid('cooler-'+i,p.x,p.z,.55,.4,.45));
 for(const[i,c]of COURTS.entries())for(const side of[-1,1])solid('net-post-'+i+side,c.x,c.z+side*4.7,.16,2.6,.16);
 for(const[i,t]of TOWERS.entries()){for(const sx of[-1,1])for(const sz of[-1,1])solid('tower-leg-'+i+sx+sz,t.x+sx*1.3,t.z+sz*1.3,.2,2.3,.2);solid('tower-deck-'+i,t.x,t.z,3.2,.16,3.2,2.2);solid('tower-hut-'+i,t.x,t.z-.35,2.3,2,2.3,2.36);}
 world.beach={zone:ZONE,lot:LOT,lots:LOTS,courts:COURTS,towers:TOWERS,pathZ:PATH_Z,shoreZ,layout:L};
}
// ---- drawing (game only) -------------------------------------------------------------------------------
const DRY=[.905,.835,.655],DAMP=[.74,.66,.49],WET=[.585,.52,.395],SHELF=[.5,.6,.54],DEEP=[.34,.5,.5],lerp3=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t),mix(a[2],b[2],t)];
// Sand colour: pale and uneven where it is dry, darker where the last wave reached, green-grey under water.
function sand(x,z,y){const n=noise(x/9,z/9),m=noise(x/37+11,z/41+5),f=noise(x*.9+2,z*.9);let c;if(y>=.8){const t=.925+.085*n+.05*(m-.5)+.03*(f-.5);c=[DRY[0]*t,DRY[1]*t,DRY[2]*(t+(m-.5)*.07)];}else if(y>=.2)c=lerp3(DAMP,DRY,smooth((y-.2)/.6)).map(v=>v*(.96+.06*n));else if(y>=-.06)c=lerp3(WET,DAMP,(y+.06)/.26);else c=lerp3(DEEP,lerp3(SHELF,WET,smooth((y+.5)/.44)),smooth((y+2.2)/1.7));return c;}
function render(scene,b){
 const T=scene.T,q=new T.Quaternion(),e1=new T.Euler(0,0,0,'YXZ'),e2=new T.Euler(),turn=(pitch,yaw,roll=0)=>{e1.set(pitch,yaw,roll);q.setFromEuler(e1);e2.setFromQuaternion(q,'XYZ');return[e2.x,e2.y,e2.z];};
 const L=layout(),w=scene.world,g=(x,z)=>w.terrainHeight(x,z),P=(type,c,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0,kind='matte')=>scene.part(b,type,c,x,y,z,sx,sy,sz,rx,ry,rz,kind),y0=LOT.y;
 // Car park paint, kerbs, planted islands and lamps.
 for(const l of L.lines)P('box','#e9e6da',l.x,y0+.012,l.z,l.w,.02,l.d);
 for(const l of LOTS)P('box','#e9c94f',l.cx,y0+.012,733.6,.14,.02,8.4);
 for(const x of WALKS){const ry=(w.groundHeight?w.groundHeight(x,720):g(x,720))+.02;for(let z=714.9;z<726;z+=1.5)P('box','#f1efe6',x,ry,z,3.4,.02,.72);}
 for(const c of L.curbs)P('box','#b9b5a6',c.x,y0+.06,c.z,c.w,.16,c.d);
 for(const p of L.islands){P('box','#b9b5a6',p.x,y0+.08,p.z,p.w,.2,p.d);P('box','#6f9a57',p.x,y0+.19,p.z,p.w-.5,.04,p.d-.5);}
 for(const p of L.lamps){P('cylinder','#59646a',p.x,y0+3.25,p.z,.2,6.5,.2);P('box','#59646a',p.x,y0+6.45,p.z,2.6,.1,.16);for(const s of[-1,1])P('box','#f3efd9',p.x+s*1.2,y0+6.36,p.z,.7,.08,.3,0,0,0,'glow');}
 for(const l of LOTS){const x=l.cx;P('cylinder','#59646a',x-5.4,y0+1.2,735.6,.09,2.4,.09);P('box','#2f6fb5',x-5.4,y0+2.1,735.6,.7,.5,.05);
  /* V7.1: better car parks: a wheel stop at the head of every space, a second sign and a pay machine at the way in, a bin at each end */
  const first=l.x0+6.5,count=Math.floor((l.x1-l.x0-13)/2.6);for(let i=0;i<count;i++){const sx=first+i*2.6+1.3;if(Math.abs(sx-l.cx)>=5.5)P('box','#cfcabb',sx,y0+.07,l.z0+.95,1.7,.13,.24);P('box','#cfcabb',sx,y0+.07,l.z1-.95,1.7,.13,.24);}
  P('cylinder','#59646a',x+5.4,y0+1.2,735.6,.09,2.4,.09);P('box','#2f6fb5',x+5.4,y0+2.1,735.6,.7,.5,.05);P('box','#f4f1e6',x+5.4,y0+2.1,735.63,.34,.34,.02);
  P('box','#3d4a52',x+6.6,y0+.75,l.z0+.7,.5,1.5,.4);P('box','#2f6fb5',x+6.6,y0+1.2,l.z0+.92,.4,.34,.03);P('box','#d9e6ea',x+6.6,y0+.78,l.z0+.92,.3,.2,.03);
  for(const bx of[l.x0+1.2,l.x1-1.2])P('cylinder','#2f5d4a',bx,y0+.5,l.z1-.8,.5,1,.5);}
 // Palms: a trunk that leans and tapers in six lengths, a head of long fronds that droop and a cluster of nuts.
 for(const p of L.palms){const by=g(p.x,p.z),dx=Math.sin(p.yaw)*p.lean,dz=Math.cos(p.yaw)*p.lean,seg=p.h/6,off=t=>t*t*p.h*.9;for(let i=0;i<6;i++){const t0=i/6,t1=(i+1)/6,tm=(t0+t1)/2,r=(.3-.13*tm)*p.s,slope=1.8*tm;P('cylinder',i%2?'#8a7a5c':'#97876a',p.x+dx*(off(t0)+off(t1))/2,by+seg*(i+.5),p.z+dz*(off(t0)+off(t1))/2,r,seg*1.08,r,Math.atan(dz*slope),0,-Math.atan(dx*slope));}
  const cx=p.x+dx*p.h*.9,cz=p.z+dz*p.h*.9,cy=by+p.h;for(let i=0;i<11;i++){const a=p.yaw+i*TAU/11+Math.sin(i*5.3)*.2,droop=.28+.34*(.5+.5*Math.sin(i*3.7)),len=(2.9+.7*Math.sin(i*2.9))*p.s;P('frond',i%3?'#4f7d4c':'#6a9457',cx+Math.sin(a)*len*.42,cy-.18-droop*.5,cz+Math.cos(a)*len*.42,1.25*p.s,.95,len,...turn(droop,a),'foliage');}
  for(let i=0;i<5;i++){const a=p.yaw+i*TAU/5+.4,len=1.9*p.s;P('frond','#7fa565',cx+Math.sin(a)*len*.36,cy+.28,cz+Math.cos(a)*len*.36,.9*p.s,.8,len,...turn(-.5,a),'foliage');}
  for(let i=0;i<3;i++)P('sphere','#6b5a3c',cx+Math.sin(i*2.1)*.2,cy-.34,cz+Math.cos(i*2.1)*.2,.26,.3,.26);}
 // Sun shades: a pole pushed into the sand at a slight angle and a two-colour canopy.
 for(const u of L.umbrellas){const by=g(u.x,u.z),tx=u.x+u.tz*u.h*.5,tz=u.z-u.tx*u.h*.5;P('cylinder','#e6dcc3',(u.x+tx)/2,by+u.h/2,(u.z+tz)/2,.045,u.h+.1,.045,-u.tx,0,-u.tz);P('cone',u.c1,tx,by+u.h+.12,tz,u.r*2,.46,u.r*2,-u.tx,u.yaw,-u.tz,'cloth');P('cone',u.c2,tx,by+u.h+.2,tz,u.r*1.18,.34,u.r*1.18,-u.tx,u.yaw,-u.tz,'cloth');P('sphere','#f4efe2',tx,by+u.h+.39,tz,.07,.07,.07);}
 for(const t of L.towels){const by=g(t.x,t.z)+.012;P('box',t.c1,t.x,by,t.z,t.w,.014,t.l,0,t.yaw);const n=t.stripes;for(let i=0;i<n;i++){const o=(i-(n-1)/2)*t.l/(n+.6);P('box',t.c2,t.x+Math.sin(t.yaw)*o,by+.004,t.z+Math.cos(t.yaw)*o,t.w*.98,.012,t.l/(n*2.4),0,t.yaw);}}
 for(const c of L.chairs){const by=g(c.x,c.z),sx=Math.sin(c.yaw),cz=Math.cos(c.yaw);P('box',c.c,c.x,by+.24,c.z,.52,.035,.5,0,c.yaw,0,'cloth');P('box',c.c,c.x-sx*.36,by+.52,c.z-cz*.36,.52,.035,.62,...turn(-1.15,c.yaw),'cloth');for(const s of[-1,1]){P('box','#d9d6cc',c.x+cz*.27*s,by+.12,c.z-sx*.27*s,.03,.24,.5,0,c.yaw);P('box','#d9d6cc',c.x+cz*.27*s-sx*.3,by+.45,c.z-sx*.27*s-cz*.3,.03,.03,.72,...turn(-1.15,c.yaw));}}
 for(const c of L.coolers){const by=g(c.x,c.z);P('box',c.c,c.x,by+.17,c.z,.55,.32,.34,0,c.yaw);P('box','#f4f1e8',c.x,by+.36,c.z,.58,.07,.37,0,c.yaw);P('box','#c9c6bc',c.x,by+.44,c.z,.3,.03,.04,0,c.yaw);}
 for(const c of L.bags){const by=g(c.x,c.z);P('sphere',c.c,c.x,by+.15,c.z,.42,.3,.22,0,c.yaw,0,'cloth');P('box','#efe9d8',c.x,by+.33,c.z,.2,.1,.02,0,c.yaw);}
 for(const c of L.castles){const by=g(c.x,c.z),col='#d7c28c';P('cylinder',col,c.x,by+c.r*.3,c.z,c.r*1.7,c.r*.6,c.r*1.7);for(let i=0;i<4;i++){const a=c.yaw+i*TAU/4,r=c.r*.9;P('cylinder',col,c.x+Math.sin(a)*r,by+c.r*.55,c.z+Math.cos(a)*r,c.r*.42,c.r*1.1,c.r*.42);P('cone',col,c.x+Math.sin(a)*r,by+c.r*1.28,c.z+Math.cos(a)*r,c.r*.5,c.r*.42,c.r*.5);}P('cylinder',col,c.x,by+c.r*.95,c.z,c.r*.62,c.r*.75,c.r*.62);P('cone',col,c.x,by+c.r*1.6,c.z,c.r*.7,c.r*.6,c.r*.7);}
 // Volleyball courts: taped lines on levelled sand, two posts and a net.
 for(const c of COURTS){const by=g(c.x,c.z)+.02;for(const s of[-1,1]){P('box','#2a6cb0',c.x,by,c.z+s*4,16,.02,.07);P('box','#2a6cb0',c.x+s*8,by,c.z,.07,.02,8);P('cylinder','#d9d6cc',c.x,by+1.28,c.z+s*4.7,.1,2.6,.1);P('box','#e8a531',c.x,by+.6,c.z+s*4.7,.2,1.1,.2);}
  P('box','#f4f1e8',c.x,by+2.4,c.z,.03,.07,9.3);P('box','#f4f1e8',c.x,by+1.45,c.z,.03,.05,9.3);for(let i=0;i<=18;i++)P('box','#2b3338',c.x,by+1.93,c.z-4.5+i*.5,.012,.92,.012);for(let i=1;i<5;i++)P('box','#2b3338',c.x,by+1.45+i*.19,c.z,.012,.012,9.2);}
 // (The balls are real objects now; the beach-life code below owns and draws them.)
 // Lifeguard towers: a hut on stilts with a ramp, a rail and a flag.
 for(const t of TOWERS){const by=g(t.x,t.z);for(const sx of[-1,1])for(const sz of[-1,1])P('box','#b99a6b',t.x+sx*1.3,by+1.15,t.z+sz*1.3,.18,2.3,.18);P('box','#c9ad7c',t.x,by+2.28,t.z,3.2,.14,3.2);P('box','#f3efe4',t.x,by+3.3,t.z-.35,2.3,1.9,2.3);P('box','#2f6fb5',t.x,by+3.0,t.z+.81,1.5,.9,.04,0,0,0,'glass');P('roof','#d8473c',t.x,by+4.25,t.z-.35,2.9,.75,2.9);
  for(const s of[-1,1])P('box','#f3efe4',t.x+s*1.55,by+2.85,t.z+.95,.06,1,1.3);P('box','#f3efe4',t.x,by+3.32,t.z+1.58,3.1,.06,.06);P('box','#c9ad7c',t.x,by+1.14,t.z+3.1,1.2,.1,3.8,.65);for(const s of[-1,1])P('box','#b99a6b',t.x+s*.6,by+1.55,t.z+3.1,.05,.05,3.8,.65);P('cylinder','#d9d6cc',t.x-1.5,by+4.6,t.z-1.4,.05,2.6,.05);P('box','#e2483d',t.x-1.05,by+5.6,t.z-1.4,.9,.5,.02,0,0,0,'cloth');}
 for(const t of L.grass){const by=g(t.x,t.z);for(let i=0;i<t.n;i++){const a=t.yaw+i*TAU/t.n+Math.sin(i*4.1)*.4,len=(.75+.3*Math.sin(i*2.3))*t.s;P('frond',i%2?'#a8ad6c':'#8f9c5c',t.x+Math.sin(a)*len*.2,by+len*.36,t.z+Math.cos(a)*len*.2,.22*t.s,.5,len,...turn(-1.05+.18*Math.sin(i*3.3),a),'foliage');}}
 for(const[i,k]of L.planks.entries()){const by=g(k.x,k.z);P('box',i%2?'#b08d5f':'#a98557',k.x,by+.05,k.z,2.3,.07,1.96);if(i%4===0)for(const s of[-1,1])P('box','#8e6f48',k.x+s*1.1,by+.02,k.z,.12,.3,.12);}
 // Footprints pressed into the dry sand.
 for(const s of L.steps){const by=g(s.x,s.z);if(by<.5)continue;P('box','#c8b386',s.x,by+.004,s.z,.1,.008,.25,0,s.yaw);}
 scene.beachCars={built:0,group:null};
}
// Parked cars are the game's own car models, flattened to a handful of meshes each and built a few at a time
// once the player is near enough to see them.
function mergeObject(T,object,rootModel){
 const inverse=new T.Matrix4().copy(rootModel.matrixWorld).invert(),bins=new Map(),m=new T.Matrix4();
 object.traverse(o=>{if(!o.isMesh||!o.geometry?.attributes?.position)return;for(let p=o;p&&p!==object;p=p.parent)if(!p.visible)return;const material=Array.isArray(o.material)?o.material[0]:o.material;if(!material)return;let geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(m.multiplyMatrices(inverse,o.matrixWorld));if(!geo.attributes.normal)geo.computeVertexNormals();if(!bins.has(material))bins.set(material,[]);bins.get(material).push(geo);});
 const group=new T.Group();
 for(const[material,list]of bins){let count=0;for(const geo of list)count+=geo.attributes.position.count;const position=new Float32Array(count*3),normal=new Float32Array(count*3),uv=new Float32Array(count*2);let at=0;for(const geo of list){position.set(geo.attributes.position.array,at*3);normal.set(geo.attributes.normal.array,at*3);if(geo.attributes.uv)uv.set(geo.attributes.uv.array,at*2);at+=geo.attributes.position.count;geo.dispose();}const merged=new T.BufferGeometry();merged.setAttribute('position',new T.BufferAttribute(position,3));merged.setAttribute('normal',new T.BufferAttribute(normal,3));merged.setAttribute('uv',new T.BufferAttribute(uv,2));const mesh=new T.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;group.add(mesh);}
 return group;
}
/* V8.5: far away a parked car is one plain mesh (one draw call instead of about 14), and past 520 m it is not drawn. */
let farCarMaterial=null;
function farLevels(T,out){
 const levels=out.levels;if(!levels?.length)return out;const last=levels[levels.length-1],parts=[];let count=0;
 last.object.traverse(o=>{if(o.isMesh&&o.geometry?.attributes?.position&&o.geometry.attributes.normal){parts.push(o);count+=o.geometry.attributes.position.count;}});
 if(!count)return out;const position=new Float32Array(count*3),normal=new Float32Array(count*3),color=new Float32Array(count*3);let at=0;
 for(const o of parts){const g=o.geometry,n=g.attributes.position.count,c=o.material?.color||{r:.6,g:.6,b:.6},k=o.material?.transparent?.35:1;position.set(g.attributes.position.array,at*3);normal.set(g.attributes.normal.array,at*3);for(let i=0;i<n;i++){const j=(at+i)*3;color[j]=c.r*k;color[j+1]=c.g*k;color[j+2]=c.b*k;}at+=n;}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(position,3));geo.setAttribute('normal',new T.BufferAttribute(normal,3));geo.setAttribute('color',new T.BufferAttribute(color,3));geo.computeBoundingSphere();
 farCarMaterial??=new T.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.1});const mesh=new T.Mesh(geo,farCarMaterial);mesh.name='parked-car-far';mesh.castShadow=false;mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;
 out.addLevel(mesh,Math.max(110,last.distance+35));out.addLevel(new T.Object3D(),520);return out;
}
// One of the game's vehicle models as fixed scenery (also used by the motocross paddock).
function parkedModel(scene,type,paint){
 const T=scene.T,VM=root.CityVehicleModels,V=root.CityVehicles;if(!VM||!V?.byId[type]||V.byId[type].premiumProduct)return null;
 const model=VM.create(type,paint===undefined?{}:{paint});model.updateMatrixWorld(true);const source=model.userData.lod,out=new T.LOD();
 if(source?.levels?.length)for(const level of source.levels)out.addLevel(mergeObject(T,level.object,model),level.distance);else out.addLevel(mergeObject(T,model,model),0);
 model.traverse(o=>{if(o.isMesh&&o.geometry&&!o.geometry.userData?.shared)o.geometry.dispose();});return farLevels(T,out);
}
function buildCar(scene,car){
 const T=scene.T,VM=root.CityVehicleModels,V=root.CityVehicles;let type=CARS[car.type%CARS.length];if(!V?.byId[type]||V.byId[type].premiumProduct)type='pebble';
 const model=VM.create(type,{paint:car.paint});model.updateMatrixWorld(true);const source=model.userData.lod,out=new T.LOD();
 if(source?.levels?.length)for(const level of source.levels)out.addLevel(mergeObject(T,level.object,model),level.distance);else out.addLevel(mergeObject(T,model,model),0);
 model.traverse(o=>{if(o.isMesh&&o.geometry&&!o.geometry.userData?.shared)o.geometry.dispose();});
 farLevels(T,out);out.position.set(car.x,LOT.y,car.z);out.rotation.y=car.yaw;out.updateMatrix();out.updateMatrixWorld(true);return out;
}
// ---- surf ----------------------------------------------------------------------------------------------
const NOISE_GLSL='float beachLace(vec2 p,float t){float a=sin(p.x*1.9+1.7*sin(p.y*1.13+t*.31))*sin(p.y*2.3+1.4*sin(p.x*1.41-t*.23));float b=sin(p.x*4.3-p.y*1.7+t*.4)*sin(p.y*3.7+p.x*1.1-t*.27);return clamp(abs(a)*.7+abs(b)*.42,0.,1.);}float beachPhase(float s,float x,float t){return (s-t*3.2+2.6*sin(x*.021+t*.11)+1.4*sin(x*.057+1.7))/22.;}float beachCrest(float s,float x,float t){float f=fract(beachPhase(s,x,t));return pow(max(0.,1.-abs(f-.5)*5.),1.5);}';
// The open sea is not drawn inside the beach's own patch of water, so the two never overlap.
function cutWater(material){
 const before=material.onBeforeCompile,key=material.customProgramCacheKey;
 material.onBeforeCompile=(shader,renderer)=>{if(before)before.call(material,shader,renderer);shader.vertexShader='varying vec3 vBeachCut;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvBeachCut=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader='varying vec3 vBeachCut;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n{float bz=vBeachCut.x<-200.?920.+(vBeachCut.x+750.)*.1636364:1010.-(vBeachCut.x+200.)*.2291667;float bk=vBeachCut.x<-200.?1.0133:1.0259;if(vBeachCut.x>'+ZONE.x0.toFixed(1)+'&&vBeachCut.x<'+ZONE.x1.toFixed(1)+'&&vBeachCut.z>700.&&vBeachCut.z<bz+'+SEA.toFixed(1)+'*bk)discard;}');};
 material.customProgramCacheKey=()=>(key?key.call(material):'')+'|beach-cut-v1';
}
function buildSurf(scene){
 const T=scene.T,w=scene.world,island=root.CityIsland,rows=[9,7.5,6.2,5.1,4.2,3.4,2.7,2,1.3,.6,0,-.8,-1.8,-3,-4.5,-6.5,-9,-12,-16,-21,-27,-34,-42,-52,-64,-78,-94,-112,-132,-155,-180,-205,-SEA-.3],step=5,cols=Math.round((ZONE.x1-ZONE.x0)/step);
 const position=[],shore=[],bed=[],index=[];
 for(let j=0;j<rows.length;j++)for(let i=0;i<=cols;i++){const x=ZONE.x0+i*step,z=shoreZ(x)-rows[j]*slopeK(x);position.push(x,0,z);shore.push(island?island.shoreline(x,z):rows[j]);bed.push(w.terrainHeight(x,z));}
 for(let j=0;j<rows.length-1;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,c=a+cols+1;index.push(a,c,a+1,a+1,c,c+1);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));geometry.setAttribute('beachShore',new T.Float32BufferAttribute(shore,1));geometry.setAttribute('beachBed',new T.Float32BufferAttribute(bed,1));geometry.setIndex(index);geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.boundingSphere.radius+=3;
 const base=scene.water.material,material=new T.MeshStandardMaterial({color:base.color.clone(),roughness:base.roughness,metalness:base.metalness,transparent:true,opacity:base.opacity,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1.5,polygonOffsetUnits:-1.5}),uniforms={beachTime:{value:0}};
 material.onBeforeCompile=shader=>{shader.uniforms.beachTime=uniforms.beachTime;
  shader.vertexShader='attribute float beachShore;attribute float beachBed;uniform float beachTime;varying float vBeachShore;varying vec2 vBeachXZ;\n'+NOISE_GLSL+'\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBeachShore=beachShore;vBeachXZ=position.xz;{float swell=.08*sin(position.x*.025+beachTime*.7)+.055*sin(position.z*.032-beachTime*.5);float lift=.34*smoothstep(-95.,-14.,beachShore)*(1.-smoothstep(-7.,-.5,beachShore))*beachCrest(beachShore,position.x,beachTime);transformed.y=max(swell*(1.-smoothstep(-25.,1.,beachShore))+lift,beachBed+.03);}');
  shader.fragmentShader='uniform float beachTime;varying float vBeachShore;varying vec2 vBeachXZ;\n'+NOISE_GLSL+'\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n{float s=vBeachShore,x=vBeachXZ.x;float ph=beachTime/6.875+.35*sin(x*.013)+.2*sin(x*.047+1.3);float run=3.5+3.2*pow(.5+.5*sin(6.2832*ph),1.6)+.22*sin(x*.9+beachTime*.7);if(s>run)discard;float fade=smoothstep('+ZONE.x0.toFixed(1)+','+(ZONE.x0+75).toFixed(1)+',x)*(1.-smoothstep('+(ZONE.x1-60).toFixed(1)+','+ZONE.x1.toFixed(1)+',x));float shallow=smoothstep(-85.,-3.,s)*fade;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.33,.74,.69),shallow*.7);float alpha=mix(diffuseColor.a,.36,smoothstep(-30.,1.,s)*fade);float edge=smoothstep(run-1.0,run-.06,s);float lace=smoothstep(.5,.86,beachLace(vBeachXZ*.9,beachTime))*smoothstep(-10.,1.5,s)*.6*(.3+.7*smoothstep(-.25,.45,sin(vBeachXZ.x*.21+beachTime*.13)*sin(vBeachXZ.y*.37-beachTime*.09)));float crest=beachCrest(s,x,beachTime)*smoothstep(-46.,-10.,s)*(1.-smoothstep(-1.5,2.5,s));float crestFoam=smoothstep(.3,.75,crest)*(.62+.38*beachLace(vBeachXZ*1.7,beachTime*1.4));float behind=beachCrest(s-3.4,x,beachTime)*smoothstep(-22.,-4.,s)*(1.-smoothstep(-1.,3.,s))*smoothstep(.42,.8,beachLace(vBeachXZ*1.3+7.,beachTime*.8))*.75;float foam=clamp(max(max(edge,crestFoam),max(lace,behind)),0.,1.)*fade;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.96,.98,.97),foam);diffuseColor.a=max(alpha*(1.-.55*smoothstep(run-2.6,run,s)),foam*.96);}');
  material.userData.shader=shader;};
 material.customProgramCacheKey=()=>'beach-surf-v1';
 const mesh=new T.Mesh(geometry,material);mesh.name='beach-surf';mesh.receiveShadow=true;mesh.frustumCulled=true;scene.environment.add(mesh);scene.beachSurf={mesh,material,uniforms};
}
function update(scene,time){
 const surf=scene.beachSurf;if(surf){surf.uniforms.beachTime.value=time;const base=scene.water?.material;if(base){/* the sea changes colour with the hour and the weather; the beach's patch follows it so no edge shows */surf.material.color.copy(base.color);surf.material.opacity=base.opacity;surf.material.roughness=base.roughness;surf.material.metalness=base.metalness;surf.material.envMapIntensity=base.envMapIntensity;}}
 const cars=scene.beachCars,L=cached;if(cars&&L&&cars.built<L.cars.length&&root.CityVehicleModels){const c=scene.camera.position;if(LOTS.some(l=>Math.hypot(c.x-l.cx,c.z-748)<430)){if(!cars.group){cars.group=new scene.T.Group();cars.group.name='beach-parked-cars';scene.environment.add(cars.group);}try{const car=buildCar(scene,L.cars[cars.built]);car.userData.lot='lot-beach-'+cars.built;cars.group.add(car);}catch(error){cars.failed=String(error&&error.message||error);}cars.built++;}}
}
// ---- beach life (V4.1, single-player for now) --------------------------------------------------------
// The people on the beach are ordinary City people, so they can be hit, shot and ragdolled like anyone else.
// This code only tells the ones who are fine what to do next. Balls are small physical objects of their own:
// a player hits or catches one only if they are standing where it arrives, at that moment, and are not hurt.
const GRAV=9.81,SWIMS=['#e2483d','#2d74b8','#f0c23f','#33a69b','#ee7f9f','#f08533','#1f4a73','#6fae5c','#f4f1e8','#22262b','#8a5cc2'];
const lifeOf=sim=>sim.beachLife||(sim.beachLife={on:false,actors:[],balls:[],courts:[],pairs:[],boats:[],serial:0,rand:rng(9917),cool:0});
/* V4.3: the beach serves every player in the session (one in story and sandbox, several in a multiplayer room). */
const players=sim=>{const list=sim.player?[sim.player]:[];for(const a of sim.sessionPeers||[])if(a&&a!==sim.player)list.push(a);return list;};
const flat=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),turnTo=(from,to,rate)=>{let d=to-from;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return from+clamp(d,-rate,rate);};
const down=n=>!n||n.health<=0||!!n.physical||!!n.ragdoll?.active||n.panic>0||n.mode==='incapacitated'||n.mode==='falling';
function swimLook(sim,S,female){
 const P=root.CityPeople,R=S.rand;S.women??=P.catalog.filter(a=>a.body===4&&!a.facialHair);S.men??=P.catalog.filter(a=>[1,2,5].includes(a.body));
 const pool=female?S.women:S.men,base=pool[Math.floor(R()*pool.length)]||P.catalog[0],c=SWIMS[Math.floor(R()*SWIMS.length)],n=++S.serial;
 const bust=female?Math.round((1.75+R()*.45)*20)/20:0;/* adult women on the beach have a full figure; the size varies a little from one to the next */
 const look={...base,id:'beach-look-'+n,appearanceKey:(base.appearanceKey||base.id)+'|swim:'+c+':'+bust,swim:true,barefoot:true,lower:9,accessory:R()<.3?2:0,topColor:c,bottomColor:c,bust};
 for(const key of Object.keys(look))if(/^cosmetic|^hat|Pattern$|AccentColor$/.test(key))delete look[key];/* no shop hats (one swimmer wore a crown), tops or shoes over swimwear */
 return look;
}
// Story mode keeps its streets empty and refuses ordinary passers-by, but the beach is busy in every mode, so there
// its people are added directly, with the same starting values the game gives anyone else.
function enlist(sim,data){
 const made=sim.spawnNPC(data);if(made||sim.profile?.mode!=='story')return made;
 const n={x:data.x,y:data.y??sim.world.groundHeight(data.x,data.z),z:data.z,yaw:data.yaw||0,vx:0,vy:0,vz:0,health:100,mode:'walk',role:'civilian',persistent:false,speed:0,stateTime:0,task:0,panic:0,fireTimer:1.3,weapon:'unarmed',...data};
 if(!sim.npcRagdolls)n.noRagdoll=true;sim.npcs.push(n);return n;
}
function person(sim,S,role,x,z,extra={}){
 const n=enlist(sim,{id:'beach:'+(++S.serial),x,z,y:sim.world.terrainHeight(x,z),yaw:S.rand()*TAU,mission:'beach',lifeEvent:'beach',mode:'idle',appearance:swimLook(sim,S,S.rand()<.5),beach:{role,state:'start',t:S.rand()*6,home:{x,z},...extra}});
 if(n)S.actors.push(n.id);return n;
}
function ball(S,kind,x,y,z){const b={id:'ball-'+(++S.serial),kind,x,y,z,vx:0,vy:0,vz:0,r:kind==='volley'?.105:.09,e:kind==='volley'?.42:.3,spin:0,held:null,rest:true,bounces:0,landed:null};S.balls.push(b);return b;}
function launch(b,target,T){b.vx=(target.x-b.x)/T;b.vz=(target.z-b.z)/T;b.vy=(target.y-b.y+.5*GRAV*T*T)/T;b.held=null;b.rest=false;b.bounces=0;b.landed=null;}
// When and where the ball next comes down to a given height.
function arrival(b,height){const disc=b.vy*b.vy+2*GRAV*(b.y-height);if(disc<0)return null;const t=(b.vy+Math.sqrt(disc))/GRAV;return t>0?{t,x:b.x+b.vx*t,z:b.z+b.vz*t}:null;}
function stepBall(sim,S,b,dt){
 if(b.held){const n=who(sim,b.held);if(down(n)){b.held=null;b.rest=false;b.vx=b.vz=0;b.vy=0;}else{const fx=Math.sin(n.yaw),fz=Math.cos(n.yaw);b.x=n.x+fx*.26+fz*.2;b.z=n.z+fz*.26-fx*.2;b.y=n.y+(b.carry||1.02);b.vx=b.vy=b.vz=0;return;}}
 for(const p of players(sim))if(!p.vehicleId&&p.health>0&&(p.speed||0)>.7&&Math.abs(b.y-p.y-.4)<.9&&Math.hypot(b.x-p.x,b.z-p.z)<.5){const a=Math.atan2(b.x-p.x,b.z-p.z),power=p.speed*1.25+1.5;b.vx=Math.sin(a)*power;b.vz=Math.cos(a)*power;b.vy=2+p.speed*.3;b.rest=false;b.landed??=sim.time;}
 for(const v of sim.vehicles)if(Math.abs(v.speed||0)>1&&Math.abs(b.y-v.y-.6)<1.4&&Math.hypot(b.x-v.x,b.z-v.z)<(v.width||1.8)*.75+b.r){const a=Math.atan2(b.x-v.x,b.z-v.z);b.vx=(v.vx||0)*1.15+Math.sin(a)*2;b.vz=(v.vz||0)*1.15+Math.cos(a)*2;b.vy=2.5;b.rest=false;b.landed??=sim.time;}
 if(b.rest)return;
 const before=b.x;b.vy-=GRAV*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.spin+=Math.hypot(b.vx,b.vz)*dt/b.r*.5;
 if(b.net){const c=b.net;if((before-c.x)*(b.x-c.x)<0&&b.y<c.y+2.46&&b.y>c.y+1.4&&Math.abs(b.z-c.z)<4.7){b.x=c.x+(before<c.x?-.14:.14);b.vx*=-.2;b.vz*=.5;b.netted=sim.time;}}
 const ground=sim.world.terrainHeight(b.x,b.z),water=sim.world.waterHeight(b.x,b.z,sim.time),afloat=water!==null&&water>ground+.06,floor=(afloat?water-.03:ground)+b.r;
 if(b.y<floor){b.y=floor;b.bounces++;b.landed??=sim.time;if(afloat){b.vy=Math.abs(b.vy)*.12;b.vx*=.9;b.vz=b.vz*.9-.25*dt;if(Math.abs(b.vy)<.2)b.vy=0;}
  else{b.vy=Math.abs(b.vy)*b.e;if(b.kind==='football'&&b.vy>.7){const a=(S.rand()-.5)*1.1,cs=Math.cos(a),sn=Math.sin(a),vx=b.vx;b.vx=vx*cs-b.vz*sn;b.vz=vx*sn+b.vz*cs;}b.vx*=.7;b.vz*=.7;if(b.vy<.55){b.vy=0;const speed=Math.hypot(b.vx,b.vz),next=Math.max(0,speed-3.2*dt);if(next<.06){b.vx=b.vz=0;b.rest=true;}else{b.vx*=next/speed;b.vz*=next/speed;}}}}
}
// Walk in a straight line, stepping round furniture. Returns true on arrival.
function walk(sim,n,x,z,speed,dt,near=.3){
 const dx=x-n.x,dz=z-n.z,d=Math.hypot(dx,dz);if(d<near){n.speed=0;if(n.mode==='walk'||n.mode==='run')n.mode='idle';return true;}
 const stride=Math.min(d,speed*dt),clear=a=>{const q={x:n.x+Math.sin(a)*stride,z:n.z+Math.cos(a)*stride};q.y=sim.world.terrainHeight(q.x,q.z);return sim.world.capsuleClear({x:q.x,y:q.y+.09,z:q.z},.28,1.6)?q:null;};
 const a=Math.atan2(dx,dz),side=n.beach.side||(n.beach.side=n.id.length%2?1:-1),q=clear(a)||clear(a+side*1.1)||clear(a-side*1.1);
 if(!q){n.speed=0;n.mode='idle';return false;}n.x=q.x;n.z=q.z;n.y=q.y;n.yaw=turnTo(n.yaw,a,dt*9);n.speed=speed;n.mode=speed>2.4?'run':'walk';n.pose=null;return false;
}
/* V8.5: a person by id, from this step's table when there is one */
const LOOKUP=new WeakMap(),who=(sim,id)=>{const n=LOOKUP.get(sim)?.get(id);return n&&n.id===id?n:sim.npcs.find(o=>o.id===id);};
const stand=(n,yaw,dt)=>{n.speed=0;n.mode='idle';if(yaw!==undefined)n.yaw=turnTo(n.yaw,yaw,dt*6);};
function populate(sim,S){
 const L=layout(),R=S.rand,towels=L.towels.slice(),chairs=L.chairs.slice();
 /* V4.3: a busy beach. 170 on towels, 40 in chairs, 34 walking on the sand, 36 wading in the shallows, 46 swimming and
  * 12 watching the volleyball, plus the players below. Most of them gather in the middle of the beach: by the courts,
  * in front of the car park and along the way down to the water. */
 const hub=x=>Math.min(Math.abs(x+270),Math.abs(x+120),Math.abs(x-35)),near=list=>list.map(item=>[hub(item.x)+R()*150,item]).sort((a,b)=>a[0]-b[0]).map(q=>q[1]),along=margin=>R()<.65?clamp([-270,-120,35][Math.floor(R()*3)]+(R()-.5)*270,ZONE.x0+margin,ZONE.x1-margin):ZONE.x0+margin+R()*(ZONE.x1-ZONE.x0-2*margin);
 for(const t of near(towels).slice(0,170))person(sim,S,'sun',t.x,t.z,{spot:t});
 for(const c of near(chairs).slice(0,40))person(sim,S,'lounge',c.x,c.z,{spot:c});
 for(let i=0;i<34;i++){const x=along(110),s=6+R()*40;person(sim,S,'stroll',x,shoreZ(x)-s);}
 for(let i=0;i<36;i++){const x=along(130);person(sim,S,'stroll',x,shoreZ(x)-(2+R()*6),{wade:true});}
 for(let i=0;i<46;i++){const x=along(140);person(sim,S,'swim',x,shoreZ(x)-(4+R()*12));}
 for(const c of COURTS){const y=sim.world.terrainHeight(c.x,c.z),court={c:{x:c.x,z:c.z,y},ids:[],state:'reset',timer:0,server:Math.floor(R()*4),plan:null,touches:0,side:0};
  for(let k=0;k<4;k++){const side=k<2?-1:1,front=k%2===0,home={x:c.x+side*(front?2.6:5.6),z:c.z+(front?1.6:-1.5)*side};const n=person(sim,S,'volley',home.x,home.z,{home,team:k<2?0:1});if(n)court.ids.push(n.id);}
  court.ball=ball(S,'volley',c.x-3,y+.105,c.z+1);court.ball.net=court.c;S.courts.push(court);
  for(let k=0;k<6;k++){const side=k<3?-1:1,home={x:c.x+(k%3-1)*3.6+(R()-.5)*2,z:c.z+side*(7.4+R()*1.6)};person(sim,S,'watch',home.x,home.z,{home,face:{x:c.x,z:c.z},sit:R()<.5});}}
 for(const[x,s]of[[-170,34],[10,38],[-470,30],[-610,36],[120,31]]){const z=shoreZ(x)-s,spots=[{x:x-7,z:z+1},{x:x+7,z:z-1}],pair={ids:[],spots,state:'hold',timer:2,throwT:-1};
  for(const p of spots){const n=person(sim,S,'catch',p.x,p.z,{home:p});if(n)pair.ids.push(n.id);}
  pair.ball=ball(S,'football',spots[0].x,sim.world.terrainHeight(spots[0].x,spots[0].z)+1,spots[0].z);pair.ball.held=pair.ids[0];pair.holder=pair.ids[0];S.pairs.push(pair);}
 // Boats and jet skis work offshore, well outside the swimmers.
 const V=root.CityVehicles;for(const[i,type]of['puddle','wave-dart','marlin','surge-x','wave-dart','puddle'].entries()){if(!V?.byId[type])continue;const route=[],count=6+Math.floor(R()*3),x0=ZONE.x0+120+R()*500,span=180+R()*240;
  for(let k=0;k<count;k++){const a=k/count*TAU+R()*.5,x=clamp(x0+span/2+Math.cos(a)*span*(.35+R()*.25),ZONE.x0+40,ZONE.x1-40),s=118+(Math.sin(a)*.5+.5)*70+R()*22;route.push({x,z:shoreZ(x)+s});}
  const start=route[0],v=sim.spawnVehicle(type,'beach-boat-'+i,{x:start.x,z:start.z,yaw:0});if(!v)continue;v.workshopControlled=true;
  const n=enlist(sim,{id:'beach:'+(++S.serial),x:start.x,z:start.z,mission:'beach',lifeEvent:'beach',mode:'idle',appearance:swimLook(sim,S,R()<.4),beach:{role:'pilot'}});
  if(n){S.actors.push(n.id);/* a seat has to be reserved before it can be taken */if(V.reserveSeat(v,n.id,0).ok&&V.occupySeat(v,n.id,0)){n.vehicleId=v.id;n.seatIndex=0;n.mode='driver';}}
  S.boats.push({id:v.id,pilot:n?.id,route,u:R()*count,fast:type==='wave-dart'||type==='surge-x',pace:.6+R()*.4,phase:R()*10});}
}
function clearLife(sim,S){
 const mine=new Set(S.actors);for(const v of sim.vehicles)if(String(v.id).startsWith('beach-boat-')){for(const id of v.seatOccupants||[])mine.add(id);}
 sim.vehicles=sim.vehicles.filter(v=>!String(v.id).startsWith('beach-boat-'));sim.npcs=sim.npcs.filter(n=>!mine.has(n.id)&&!String(n.id).startsWith('beach:'));
 S.actors=[];S.balls=[];S.courts=[];S.pairs=[];S.boats=[];S.on=false;
}
function stepSolo(sim,S,n,dt){
 const b=n.beach,R=S.rand;b.t-=dt;
 if(b.role==='sun'){const t=b.spot;if(b.state!=='lie'||flat(n,t)>.6){b.state='back';if(walk(sim,n,t.x,t.z,1.3,dt,.35)){b.state='lie';b.t=14+R()*30;b.kind=R()<.5?'sunbathe':R()<.6?'sunbatheFront':'sitSand';b.flip=R()<.5?Math.PI:0;}}
  else{n.x=t.x;n.z=t.z;n.y=(t.gy??=sim.world.terrainHeight(t.x,t.z))+.02;n.yaw=t.yaw+b.flip;n.speed=0;n.mode='idle';n.pose=b.kind;if(b.t<=0){b.kind=b.kind==='sunbathe'?(R()<.5?'sunbatheFront':'sitSand'):b.kind==='sitSand'?'sunbathe':R()<.7?'sunbathe':'sitSand';b.t=16+R()*34;}}return;}
 if(b.role==='lounge'){const c=b.spot;if(flat(n,c)>.7){const a=Math.atan2(c.x-n.x,c.z-n.z),d=flat(n,c),stride=Math.min(d,1.3*dt);n.x+=Math.sin(a)*stride;n.z+=Math.cos(a)*stride;n.y=sim.world.terrainHeight(n.x,n.z);n.yaw=turnTo(n.yaw,a,dt*9);n.speed=1.3;n.mode='walk';n.pose=null;return;}n.x=c.x;n.z=c.z;n.y=(c.gy??=sim.world.terrainHeight(c.x,c.z));n.yaw=c.yaw;n.speed=0;n.mode='idle';n.pose='lounge';return;}
 if(b.role==='watch'){const h=b.home;if(flat(n,h)>.7){walk(sim,n,h.x,h.z,1.3,dt,.4);return;}stand(n,Math.atan2(b.face.x-n.x,b.face.z-n.z),dt);n.y=sim.world.terrainHeight(n.x,n.z)+(b.sit?.02:0);n.pose=b.sit?'sitSand':null;if(b.t<=0){b.sit=!b.sit;b.t=20+R()*35;}return;}
 if(b.role==='stroll'){if(b.state==='start'||b.state==='pause'&&b.t<=0){const x=clamp(n.x+(R()-.5)*(b.wade?110:240),ZONE.x0+90,ZONE.x1-70),s=b.wade?-(3+R()*19):R()<.6?5+R()*10:14+R()*55;b.goal={x,z:shoreZ(x)-s};b.state='go';b.pace=b.wade?.65+R()*.3:1.05+R()*.4;}
  if(b.state==='go'){if(walk(sim,n,b.goal.x,b.goal.z,b.pace,dt,.6)){b.state='pause';b.t=4+R()*16;b.chat=null;}}
  else{if(!(b.look>sim.time)){b.look=sim.time+.5;b.other=sim.npcs.find(o=>o!==n&&o.beach?.role==='stroll'&&o.beach.state==='pause'&&flat(o,n)<4.5)?.id||null;}const other=b.other&&who(sim,b.other);if(other&&other.beach?.state==='pause'){stand(n,Math.atan2(other.x-n.x,other.z-n.z),dt);n.mode='conversation';if(b.t<3)b.t+=dt*.5;}else stand(n,Math.atan2(0,1),dt*.2);}return;}
 if(b.role==='swim'){const water=sim.world.waterHeight(n.x,n.z,sim.time),ground=sim.world.terrainHeight(n.x,n.z),depth=water===null?0:water-ground;
  if(b.state==='start'||b.state==='rest'&&b.t<=0){b.entry=n.x+(R()-.5)*30;b.state='in';b.left=85+R()*90;/* includes the wade out, about 30 s */}
  if(b.state==='rest'){stand(n,0,dt*.3);n.pose=b.sit?'sitSand':null;return;}
  if(b.state==='in'||b.state==='swim'){if(b.state==='in'){b.goal={x:b.entry,z:shoreZ(b.entry)+27+R()*19};b.state='swim';b.hold=0;}
   b.left-=dt;const dx=b.goal.x-n.x,dz=b.goal.z-n.z,d=Math.hypot(dx,dz);if(depth>.82){let upright=0;n.pose='swim';n.mode='idle';if(b.hold>0){b.hold-=dt;n.speed=0;upright=1.05;}else if(d<1.2){if(R()<.45)b.hold=3+R()*7;b.goal={x:clamp(b.entry+(R()-.5)*46,ZONE.x0+60,ZONE.x1-50),z:0};b.goal.z=shoreZ(b.goal.x)+26+R()*20;}else{const a=Math.atan2(dx,dz),v=.75+.35*Math.sin(b.left);n.x+=Math.sin(a)*v*dt;n.z+=Math.cos(a)*v*dt;n.yaw=turnTo(n.yaw,a,dt*3);n.speed=v;}
    /* Treading water is upright with only head and shoulders out, so the body sits lower than when swimming flat. */
    n.swimPitch=(n.swimPitch||0)+(upright-(n.swimPitch||0))*Math.min(1,dt*2.2);const level=water-.62-.57*n.swimPitch;n.y=n.y+(level-n.y)*Math.min(1,dt*4);}
   else{n.pose=null;walk(sim,n,b.goal.x,b.goal.z,depth>.45?.85:1.25,dt,.2);}
   if(b.left<=0){b.state='out';b.goal={x:n.x+(R()-.5)*14,z:shoreZ(n.x)-(12+R()*12)};}return;}
  if(b.state==='out'){if(depth>.82){const a=Math.atan2(b.goal.x-n.x,b.goal.z-n.z);n.swimPitch=(n.swimPitch||0)*Math.max(0,1-dt*2.2);const level=water-.62-.57*n.swimPitch;n.y=n.y+(level-n.y)*Math.min(1,dt*4);n.pose='swim';n.mode='idle';n.x+=Math.sin(a)*.95*dt;n.z+=Math.cos(a)*.95*dt;n.yaw=turnTo(n.yaw,a,dt*3);n.speed=.95;}else{n.pose=null;if(walk(sim,n,b.goal.x,b.goal.z,depth>.45?.85:1.25,dt,.5)){b.state='rest';b.t=25+R()*55;b.sit=R()<.6;}}}return;}
}
function stepCourt(sim,S,court,dt){
 const c=court.c,ballObj=court.ball,R=S.rand,team=side=>court.ids.slice(side*2,side*2+2).map(id=>who(sim,id)).filter(n=>n&&n.health>0),all=[...team(0),...team(1)],ok=all.filter(n=>!down(n));court.timer+=dt;
 const home=n=>n.beach.home,ready=(n,dt)=>{stand(n,Math.atan2(c.x-n.x,0)||0,dt);n.y=sim.world.terrainHeight(n.x,n.z);n.pose='volleyReady';n.poseT=0;};
 if(team(0).length<1||team(1).length<1){for(const n of ok){if(walk(sim,n,home(n).x,home(n).z,1.3,dt,.4))stand(n,undefined,dt);n.pose=null;}return;}
 const reset=()=>{court.state='reset';court.timer=0;court.plan=null;court.touches=0;};
 // The next touch: who should be where, when, and how high.
 const plan=(side,touch)=>{const height=c.y+[1,2.05,2.45][Math.min(2,touch)],hit=arrival(ballObj,height)||arrival(ballObj,c.y+.9);if(!hit){court.plan=null;return;}const mates=team(side).filter(n=>!down(n));if(!mates.length){court.plan=null;return;}
  let who=mates.slice().sort((a,b)=>Math.hypot(a.x-hit.x,a.z-hit.z)-Math.hypot(b.x-hit.x,b.z-hit.z))[0];if(touch>0&&mates.length>1&&court.last===who.id)who=mates.find(n=>n.id!==court.last);
  court.plan={id:who.id,time:sim.time+hit.t,x:hit.x,z:hit.z,height,kind:['volleyBump','volleySet','volleySpike'][Math.min(2,touch)],side,touch};};
 const strike=(n,p)=>{const dir=p.side?1:-1,wild=R()<.14;court.last=n.id;
  if(p.touch<2&&R()>.22){const target=p.touch===0?{x:c.x+dir*1.5,y:c.y+2.5,z:c.z+(R()-.5)*2.4}:{x:c.x+dir*1.1,y:c.y+3.05,z:c.z+(R()-.5)*4};if(wild){target.x+=(R()-.5)*5;target.z+=(R()-.5)*5;}launch(ballObj,target,p.touch===0?1.2:1.08);court.touches=p.touch+1;plan(p.side,p.touch+1);}
  else{const target={x:c.x-dir*(2.4+R()*4.4),y:c.y+.1,z:c.z+(R()-.5)*6.4};if(wild)target.x-=dir*4;let T=.8+R()*.45;for(let i=0;i<8;i++){launch(ballObj,target,T);const tn=(c.x-ballObj.x)/ballObj.vx,yn=ballObj.y+ballObj.vy*tn-.5*GRAV*tn*tn;if(yn>c.y+2.75)break;T+=.14;}court.side=1-p.side;court.touches=0;plan(court.side,0);}};
 if(court.state==='reset'){ballObj.net=c;let settled=true;for(const n of ok){if(!walk(sim,n,home(n).x,home(n).z,1.5,dt,.45))settled=false;else ready(n,dt);}if(settled&&court.timer>1.2||court.timer>12){court.state='fetch';court.timer=0;court.server=(court.server+1)%4;}return;}
 if(court.state==='fetch'){let server=who(sim,court.ids[court.server]);if(down(server)||!server||server.health<=0){server=ok[0];if(!server)return;court.server=court.ids.indexOf(server.id);}const side=court.server<2?0:1,dir=side?1:-1,spot={x:c.x+dir*8.5,z:c.z+dir*2};
  for(const n of ok)if(n!==server){if(walk(sim,n,home(n).x,home(n).z,1.5,dt,.45))ready(n,dt);}
  if(ballObj.held!==server.id){if(court.timer>40||Math.hypot(ballObj.x-c.x,ballObj.z-c.z)>60){ballObj.x=server.x;ballObj.z=server.z;ballObj.y=server.y+1;ballObj.vx=ballObj.vy=ballObj.vz=0;ballObj.held=server.id;}else if(walk(sim,server,ballObj.x,ballObj.z,1.7,dt,.7)&&ballObj.y<server.y+1.4){ballObj.held=server.id;ballObj.rest=false;}return;}
  if(!walk(sim,server,spot.x,spot.z,1.6,dt,.4)){server.pose='carryBall';return;}stand(server,Math.atan2(c.x-server.x,c.z-server.z),dt);court.serve=(court.serve||0)+dt;server.pose='volleySpike';server.poseT=clamp(court.serve/.85,0,1);
  if(court.serve>=.55){court.serve=0;ballObj.held=null;ballObj.x=server.x-dir*.25;ballObj.z=server.z;ballObj.y=server.y+2.35;court.last=server.id;const target={x:c.x-dir*(3+R()*3.6),y:c.y+.1,z:c.z+(R()-.5)*5.6};let T=1.45+R()*.3;for(let i=0;i<8;i++){launch(ballObj,target,T);const tn=(c.x-ballObj.x)/ballObj.vx,yn=ballObj.y+ballObj.vy*tn-.5*GRAV*tn*tn;if(yn>c.y+2.8)break;T+=.14;}court.state='rally';court.timer=0;court.side=1-side;court.touches=0;plan(court.side,0);}return;}
 if(court.state==='rally'){const p=court.plan;for(const n of ok){if(p&&n.id===p.id){const left=p.time-sim.time,lead=.3;walk(sim,n,p.x,p.z,5.2,dt,.3);if(left<lead){n.pose=p.kind;n.poseT=clamp(1-left/lead,0,1);n.mode='idle';if(p.kind==='volleySpike')n.y=sim.world.terrainHeight(n.x,n.z)+.42*Math.sin(Math.PI*clamp(1-left/lead,0,1));}else if(n.speed===0){n.pose='volleyReady';}}
   else if(walk(sim,n,home(n).x,home(n).z,2.2,dt,.5))ready(n,dt);}
  if(p&&sim.time>=p.time){const n=who(sim,p.id);court.plan=null;if(!down(n)&&R()>.07&&Math.hypot(n.x-ballObj.x,n.z-ballObj.z)<.95&&Math.abs(ballObj.y-p.height)<.75)strike(n,p);}
  if(ballObj.landed!==null&&sim.time-ballObj.landed>1.1||ballObj.netted&&sim.time-ballObj.netted>1.6||court.timer>26){ballObj.netted=0;reset();}return;}
}
function stepPair(sim,S,pair,dt){
 const R=S.rand,b=pair.ball,people=pair.ids.map(id=>who(sim,id)),alive=people.filter(n=>n&&n.health>0);if(alive.length<2){for(const n of alive)if(!down(n))stand(n,undefined,dt);return;}
 const[a0,a1]=people,holder=people.find(n=>n.id===pair.holder),other=holder===a0?a1:a0,spot=n=>pair.spots[pair.ids.indexOf(n.id)];
 if(pair.state==='hold'){if(b.held!==pair.holder||down(holder)){pair.state='fetch';pair.timer=0;return;}
  const atSpot=walk(sim,holder,spot(holder).x,spot(holder).z,1.5,dt,.5);if(!down(other)){if(walk(sim,other,spot(other).x,spot(other).z,1.5,dt,.5)){stand(other,Math.atan2(holder.x-other.x,holder.z-other.z),dt);other.pose=null;}}
  if(!atSpot){holder.pose='carryBall';return;}stand(holder,Math.atan2(other.x-holder.x,other.z-holder.z),dt);pair.timer-=dt;
  if(pair.throwT<0){holder.pose='carryBall';if(pair.timer<=0&&!down(other)&&flat(other,spot(other))<1.2)pair.throwT=0;return;}
  pair.throwT+=dt;holder.pose='throwBall';holder.poseT=clamp(pair.throwT/.75,0,1);b.carry=1.02+.75*clamp(pair.throwT/.36,0,1);
  if(pair.throwT>=.42){const fx=Math.sin(holder.yaw),fz=Math.cos(holder.yaw);b.held=null;b.x=holder.x+fx*.35+fz*.22;b.z=holder.z+fz*.35-fx*.22;b.y=holder.y+1.8;const wild=R()<.2,target={x:other.x+(wild?(R()-.5)*7:(R()-.5)*.8),y:other.y+1.25,z:other.z+(wild?(R()-.5)*7:(R()-.5)*.8)},dist=Math.hypot(target.x-b.x,target.z-b.z);launch(b,target,clamp(dist/(10+R()*3),.75,1.7));b.carry=1.02;pair.state='flight';pair.thrower=holder.id;pair.throwT=-1;pair.release=sim.time;const hit=arrival(b,other.y+1.25);pair.plan=hit?{id:other.id,time:sim.time+hit.t,x:hit.x,z:hit.z}:null;}return;}
 if(pair.state==='flight'){const thrower=people.find(n=>n.id===pair.thrower);if(thrower&&!down(thrower)){thrower.pose=sim.time-pair.release<.4?'throwBall':null;thrower.poseT=1;stand(thrower,undefined,dt);}
  const p=pair.plan,catcher=p&&people.find(n=>n.id===p.id);if(p&&catcher&&!down(catcher)){const left=p.time-sim.time;walk(sim,catcher,p.x,p.z,4.3,dt,.25);if(left<.45){catcher.pose='catchBall';catcher.poseT=clamp(1-left/.45,0,1);catcher.mode='idle';}
   if(sim.time>=p.time){pair.plan=null;if(Math.hypot(catcher.x-b.x,catcher.z-b.z)<.8&&Math.abs(b.y-catcher.y-1.25)<.7){b.held=catcher.id;b.rest=false;pair.holder=catcher.id;pair.state='hold';pair.timer=1+R()*2.4;pair.throwT=-1;return;}}}
  else if(p&&sim.time>=p.time)pair.plan=null;
  if(!pair.plan&&(b.landed!==null&&sim.time-b.landed>1||sim.time-pair.release>7)){pair.state='fetch';pair.timer=0;}return;}
 // Fetch: whoever is nearer and able walks to the ball, picks it up and carries it back.
 pair.timer+=dt;const able=alive.filter(n=>!down(n));if(!able.length)return;const runner=able.slice().sort((p,q)=>Math.hypot(p.x-b.x,p.z-b.z)-Math.hypot(q.x-b.x,q.z-b.z))[0];
 for(const n of able)if(n!==runner){n.pose=null;if(walk(sim,n,spot(n).x,spot(n).z,1.4,dt,.5))stand(n,Math.atan2(runner.x-n.x,runner.z-n.z),dt);}
 const wet=sim.world.waterHeight(b.x,b.z,sim.time)!==null&&sim.world.terrainHeight(b.x,b.z)<-.9;
 if(pair.timer>45||wet&&pair.timer>6){b.x=runner.x;b.z=runner.z;b.y=runner.y+1;b.vx=b.vy=b.vz=0;b.held=runner.id;}
 else if(walk(sim,runner,b.x,b.z,2.9,dt,.7)&&b.y<runner.y+1.4){b.held=runner.id;b.rest=false;}/* jogs after a loose ball */
 if(b.held===runner.id){pair.holder=runner.id;pair.state='hold';pair.timer=.8+R()*1.5;pair.throwT=-1;}
}
function stepBoat(sim,S,boat,dt){
 const v=sim.vehicles.find(v=>v.id===boat.id);if(!v)return;const pilot=who(sim,boat.pilot);
 if(!pilot||pilot.health<=0||pilot.physical||pilot.vehicleId!==v.id||v.health<=0||(v.seatOccupants||[]).some(id=>id&&id!==boat.pilot)){if(v.workshopControlled){delete v.workshopControlled;v.speed=Math.min(v.speed||0,2);}return;}
 const n=boat.route.length,top=root.CityVehicles.byId[v.typeId]?.topSpeed||14,at=u=>{const i=Math.floor(u),t=u-i,p0=boat.route[(i-1+n)%n],p1=boat.route[i%n],p2=boat.route[(i+1)%n],p3=boat.route[(i+2)%n],cr=(a,b,c,d)=>.5*(2*b+(c-a)*t+(2*a-5*b+4*c-d)*t*t+(3*b-a-3*c+d)*t*t*t);return{x:cr(p0.x,p1.x,p2.x,p3.x),z:cr(p0.z,p1.z,p2.z,p3.z)};};
 boat.phase+=dt;const burst=boat.fast?.55+.45*Math.max(0,Math.sin(boat.phase*.21)+.35*Math.sin(boat.phase*.57)):.42+.14*Math.sin(boat.phase*.13),speed=clamp(top*burst*boat.pace*(boat.fast?.5:.5),2.5,boat.fast?19:8);
 const here=at(boat.u),ahead=at(boat.u+.02),seg=Math.hypot(ahead.x-here.x,ahead.z-here.z)/.02||40;boat.u=(boat.u+speed*dt/seg)%n;const p=at(boat.u),q=at(boat.u+.03),yaw=Math.atan2(q.x-p.x,q.z-p.z),old=v.yaw||0;
 v.yaw=turnTo(old,yaw,dt*1.8);v.yawRate=(v.yaw-old)/Math.max(dt,.001);v.vx=(p.x-v.x)/Math.max(dt,.001);v.vz=(p.z-v.z)/Math.max(dt,.001);v.x=p.x;v.z=p.z;const water=sim.world.waterHeight(p.x,p.z,sim.time);v.y=water===null?0:water;v.vy=0;v.speed=speed;v.roll=clamp(-v.yawRate*speed*(boat.fast?.035:.012),-.5,.5);v.pitch=0;v.grounded=true;v.beached=false;v.engine=true;v.throttle=burst;if(v.visual){v.visual.wake=clamp(speed/top*1.6,0,1);v.visual.steer=clamp(v.yawRate*.6,-1,1);}
 const seat=root.CityVehicles.getSeatTransform(v,0);if(seat)Object.assign(pilot,{x:seat.x,y:seat.y,z:seat.z,yaw:v.yaw,mode:'driver',speed:0,pose:null});
}
/* V4.9: what the parked cars are, for the code that turns them into real cars. */
function parkedCars(){return layout().cars.map(c=>({typeId:CARS[c.type%CARS.length],paint:c.paint,x:c.x,z:c.z,yaw:c.yaw}));}
function stepLife(sim,dt){
 /* V4.9: this is called every step by the game and by the multiplayer host, so the parked cars are looked after from here. */
 try{(root.CityParking||(typeof require==='function'?require('./parking.js'):null))?.step(sim,dt);}catch(error){sim.parkingError=String(error&&error.message||error);}
 /* Story, sandbox and the multiplayer host all run this. A player in a room is sent the result by the host, so their own copy does nothing (onlineRoom). */
 if(!sim.world?.beach||sim.onlineRoom||!sim.npcs||dt<=0)return;const S=lifeOf(sim);let range=Infinity;for(const p of players(sim))range=Math.min(range,Math.hypot(clamp(p.x,ZONE.x0+60,ZONE.x1-60)-p.x,clamp(p.z,760,1010)-p.z));
 if(!S.on){if(!S.swept){S.swept=true;clearLife(sim,S);}if(range</* V7.3: the city is closer to the beach now, so the crowd wakes at 300 m (it was 430) */300&&!sim.paused){S.on=true;populate(sim,S);}return;}
 if(range>/* V7.3: and goes at 420 m (it was 600) */420){clearLife(sim,S);return;}
 /* V8.5: one look-up table of people per step */const byId=new Map();for(const n of sim.npcs)if(!byId.has(n.id))byId.set(n.id,n);LOOKUP.set(sim,byId);S.actors=S.actors.filter(id=>byId.has(id));
 for(const n of sim.npcs){if(!n.beach)continue;if(down(n)){n.pose=null;n.poseT=0;n.beach.hurt=sim.time;continue;}if(n.mode==='swimming')n.mode='idle';if(n.beach.hurt&&sim.time-n.beach.hurt<4){n.pose=null;n.speed=0;continue;}n.lifeEvent='beach';if(['sun','lounge','stroll','swim','watch'].includes(n.beach.role))stepSolo(sim,S,n,dt);}
 for(const court of S.courts)stepCourt(sim,S,court,dt);for(const pair of S.pairs)stepPair(sim,S,pair,dt);for(const b of S.balls)stepBall(sim,S,b,dt);for(const boat of S.boats)stepBoat(sim,S,boat,dt);LOOKUP.delete(sim);
}
function drawLife(scene,sim){
 const T=scene.T,S=sim.beachLife,view=scene.beachBalls||(scene.beachBalls=new Map()),live=new Set();
 for(const b of S?.balls||[]){live.add(b.id);let m=view.get(b.id);if(!m){if(b.kind==='volley'){const g=new T.IcosahedronGeometry(b.r,2),colors=[],pos=g.attributes.position;for(let i=0;i<pos.count;i++){const band=Math.floor((Math.atan2(pos.getZ(i),pos.getX(i))+Math.PI)/TAU*6)%3,c=[[.96,.86,.3],[.97,.96,.92],[.2,.42,.74]][band];colors.push(...c);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));m=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.6}));}else{m=new T.Mesh(new T.IcosahedronGeometry(1,2),new T.MeshStandardMaterial({color:'#6d4326',roughness:.7}));m.scale.set(b.r,b.r,b.r*1.62);const lace=new T.Mesh(new T.BoxGeometry(.4,.12,1.1),new T.MeshStandardMaterial({color:'#f1ede2',roughness:.8}));lace.position.y=.96;m.add(lace);}m.castShadow=true;scene.dynamic.add(m);view.set(b.id,m);}
  m.position.set(b.x,b.y,b.z);if(b.kind==='volley')m.rotation.set(b.spin,b.spin*.6,0);else{const a=Math.atan2(b.vx,b.vz);m.rotation.set(0,Number.isFinite(a)&&(b.vx||b.vz)?a:m.rotation.y,b.spin*1.5,'YXZ');}}
 for(const[id,m]of view)if(!live.has(id)){scene.dynamic.remove(m);m.geometry.dispose();view.delete(id);}
}
function installLife(Sim,Scene){
 if(!Sim||Sim.prototype.__beachLife)return;Sim.prototype.__beachLife=true;const step=Sim.prototype.step;Sim.prototype.step=function(dt,input){step.call(this,dt,input);try{stepLife(this,this.paused?0:Math.min(dt,.05));}catch(error){this.beachLifeError=String(error&&error.stack||error).slice(0,400);}};
 if(Scene){const draw=Scene.prototype.syncPeople;Scene.prototype.syncPeople=function(sim,dt){draw.call(this,sim,dt);try{drawLife(this,sim);}catch(error){this.beachLifeError=String(error&&error.message||error);}};}
}
return{ZONE,LOT,LOTS,RAIL,rails,promenade,weight,height,profile,shoreZ,slopeK,noise,layout,install,sand,render,cutWater,buildSurf,update,parkedModel,parkedCars,installLife,stepLife,lifeOf};
});
