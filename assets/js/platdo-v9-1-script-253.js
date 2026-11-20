
/* The island is data, not a map illustration: roads, facilities, navigation,
 * collision, map layers and save migration consume this same layout. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;root.CityIsland=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
/* V4: Seaglass Beach has its own module for its ground shape, furniture and collisions. */
const Beach=(typeof globalThis!=='undefined'&&globalThis.CityBeach)||(typeof require==='function'?require('./beach.js'):null);
/* V4.2: the motocross park and the mega ramp's walls have their own module too. */
const Recreation=(typeof globalThis!=='undefined'&&globalThis.CityRecreation)||(typeof require==='function'?require('./recreation.js'):null);
/* V5.9: the hill roads and the mansions above Larkspan have their own module. */
const Hills=(typeof globalThis!=='undefined'&&globalThis.CityHills)||(typeof require==='function'?require('./hills.js'):null);
/* V6.0: the mega ramp and the dirt track stand behind the west hill now. Their shapes are still written with the
 * positions they had at Eastbank; STUNT is how far they moved (the park's own file holds the number). */
const STUNT=(Recreation&&Recreation.OFF)||{x:0,z:0};
/* V7.2: the smaller map (compact.js). Positions in this file are still written as they were in layout 7; F gives where such a spot is now. */
const Compact=(typeof globalThis!=='undefined'&&globalThis.CityCompact)||(typeof require==='function'?require('./compact.js'):null),F=(x,z)=>Compact?Compact.F(x,z):z,F11=(x,z)=>Compact?.F11?Compact.F11(x,z):F(x,z);
/* V8.7: GLv takes a position written as it lies in layout 14 to where it lies now; ZL gives the layout-7 number for it */
const GLv=z=>Compact?.GL?Compact.GL(z):z,ZL=z=>Compact?Compact.Zinv(GLv(z)):z;
const VERSION=15,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
/* V8.0: the island narrower west to east, and a little longer to the north for the airport. Written as it lies. */
const coastline=[[-1050,-300],[-1052,-800],[-1045,-1150],[-1020,-1420],[-950,-1610],[-700,-1690],[-300,-1705],[100,-1695],/* V8.3: the east coast just past the city (Larkspan and the hill mansions are gone) */[400,-1690],[600,-1620],[590,-1300],[575,-1000],[565,-760],[530,-500],[495,-200],[485,100],[485,400],[485,650],[482,800],[460,874],[400,878],[330,862],[150,828],[-200,842],[-600,826],[-800,836],[-900,848],[-990,800],[-1040,650],[-1050,300]].map(([x,z])=>({x,z:GLv(z)})).filter(p=>!(Compact?.isVoid?.(p.z))).map(p=>{/* V7.8: the north coast nearer Northhaven and the stunt park */const north={'-700':-900,'-200':-760,'300':-760,'850':-745}[p.x];return north!==undefined&&Compact?.LAYOUT===12&&p.z<north?{x:p.x,z:north}:p;});
/* V7.4: the marina inlet, a river-like arm of the sea at the west end of the front. It runs north from the south
 * shore beside West Circuit, widens into the marina basin and ends short of Airport Road. These points are written
 * as they lie (they are not put through F). */
const INLET=[[-690,831],[-690,600],[-712,560],[-728,528],[-742,516],[-756,528],[-772,560],[-800,610],[-800,715],[-775,760],[-770,834]];
coastline.splice(coastline.findIndex(p=>p.x===-600&&p.z===826)+1,0,...INLET.map(([x,z])=>({x,z})));
/* The marina's three piers reach west from the east bank (PIERS is where they lie, north to south is 630 to 680), and
 * a berth is a place beside a pier, two each side, bows to the middle of the basin. */
const PIERS=[680,655,630],BERTHS=PIERS.flatMap(z=>[1,-1].flatMap(side=>[-708,-726].map(x=>({x,z:z+side*5.5,yaw:-Math.PI/2}))));
/* V7.5: the beach front. Every food place and every 6-7 stands in one row along the coast road, facing the sea, with
 * a car park behind it off Foundry Way. One line per place, west to east: id, x and z of its middle, width, depth.
 * (In their own files the places are still written where they used to stand; this table is where they are.) */
const FRONT=[['six-seven-3',-582,696,20,16],['eat-burger-duke',-556,695,22,18],['eat-taco-chime',-530,695,22,18],['eat-chilipot',-504,695,22,18],['eat-shake-shed',-478,695,22,18],['six-seven-1',-233,686.8,20,16],['eat-captain-clucks',-205,685.8,22,18],['eat-mandys',-400,695,22,18],['eat-big-micks',-374,695,22,18],['eat-pizza-shack',-348,695,22,18],['eat-moonbeans',-178,685.8,22,18],['eat-dippin-donuts',-151,685.8,22,18],
 ['diner',-228,693.5,32,25],['six-seven-4',-196,696,20,16],['eat-dairy-duchess',-160,695,22,18],['eat-five-pals',-132,695,22,18],['six-seven-2',-106,696,20,16],
 ['dine-salty-pelican',-119,680.3,26,20],['dine-ember-oak',92,694,26,20],['dine-nonna-rosa',122,694,26,20],['eat-tubeway',150,695,22,18],['eat-chick-phil-b',180,695,22,18],['eat-braising-waynes',206,695,22,18],['six-seven-5',232,696,20,16]];
function frontRow(list){for(const s of list){const f=FRONT.find(f=>f[0]===s[0]);if(f){s[3]=f[1];s[4]=f[2];}}return list;}
/* V7.8: places that move off the beach front in among the houses and buildings, each set back from its street with its
 * car park in front of it: [id, x of its middle, z of the car park's edge at the street] (Lantern Street 317.7, Harbor
 * Avenue 457.7, Tanner Street 462.7: just behind the pavement on the north side). */
const MOVE_IN=[['eat-mandys',-530,317.7],['six-seven-3',-350,317.7],['eat-five-pals',10,457.7],['six-seven-2',-380,457.7],['eat-tubeway',190,457.7],/* (V8.3: on Exchange Avenue by Island Parkway now) */['eat-shake-shed',330,147.7],/* V8.7: most food places leave the beach front for the town (Moonbeans, Dippin' Donuts, The Salty Pelican, Captain Clucks and one 6-7 stay); Foundry Way */['eat-burger-duke',-548,457.7],['eat-big-micks',-320,457.7],['diner',-200,457.7],['dine-ember-oak',60,457.7],['dine-nonna-rosa',140,457.7],['eat-braising-waynes',375,457.7],/* Lantern Street */['eat-taco-chime',-295,317.7],['eat-chilipot',75,317.7],['eat-dairy-duchess',180,317.7],/* Exchange Avenue; a 6-7 in Redbrick Heights and one in Glassline */['eat-pizza-shack',-170,147.7],['eat-chick-phil-b',0,147.7],['six-seven-5',-350,147.7],['six-seven-4',180,147.7]].map(([id,x,z])=>[id,x,GLv(z)])/* V8.7 */,LOT_DEEP=12.2;
/* The car parks: each runs from the pavement of Foundry Way to just behind its building, as wide as the building, with
 * one row of bays at the building end and the driving aisle at the street end. dir: which way the street is from the
 * bays (-1: north, the ones behind the beach front; +1: south, the places in among the houses). */
/* V8.7: the places left on the beach front share one car park in front of them, from the pavement of Coast Boulevard
 * to just in front of their doors, between City Avenue and Beach Avenue: one piece per place, edge to edge. */
const FRONT_EDGE=[-244,-92];
const LOTS=[...(()=>{const row=FRONT.filter(f=>!MOVE_IN.some(m=>m[0]===f[0])).sort((a,b)=>a[1]-b[1]),z0=708.6,z1=+(z0-LOT_DEEP).toFixed(2),bayDepth=5.5;return row.map(([place,x,z,w,d],i)=>{const x0=+(i?(row[i-1][1]+row[i-1][3]/2+x-w/2)/2:FRONT_EDGE[0]).toFixed(2),x1=+(i<row.length-1?(x+w/2+row[i+1][1]-row[i+1][3]/2)/2:FRONT_EDGE[1]).toFixed(2),n=Math.floor((x1-x0-.4)/2.6),mid=(x0+x1)/2;return{id:'carpark-'+place,place,x0,x1,z0,z1,y:2.58,bayDepth,dir:1,bays:Array.from({length:n},(_,k)=>({x:+(mid-n*1.3+1.3+k*2.6).toFixed(2),z:+(z1+bayDepth/2).toFixed(2)}))};});})(),
 ...MOVE_IN.map(([place,x,z0])=>{const w=FRONT.find(f=>f[0]===place)[3],z1=+(z0-LOT_DEEP).toFixed(2),bayDepth=5.5,n=Math.floor((w-.4)/2.6);return{id:'carpark-'+place,place,x0:x-w/2,x1:x+w/2,z0,z1,y:2.58,bayDepth,dir:1,bays:Array.from({length:n},(_,i)=>({x:x-n*1.3+1.3+i*2.6,z:+(z1+bayDepth/2).toFixed(2)}))};})];
/* the paved walk in front of the shops, in three stretches between the streets that come down to the coast road */
const FRONT_WALK=[[-605,-276],/* (V8.7: the front car park is between City Avenue and Beach Avenue now) */[-68,247]];
const districts=[
 {id:'old-quay',name:'Old Quay',x:-170,z:155,color:'#bc7958',style:'brick',landmark:'Lantern Court'},
 {id:'glassline',name:'Glassline',x:90,z:-160,color:'#74a6b5',style:'tower',landmark:'Meridian Exchange'},
 {id:'palmstrand',name:'Palmstrand',x:90,z:640,color:'#d5b887',style:'coast',landmark:'Coast Boulevard'},
 {id:'redbrick-heights',name:'Redbrick Heights',x:-455,z:-170,color:'#ac6d61',style:'townhouse',landmark:'Redfern Gardens'},
 {id:'ironworks',name:'Ironworks',x:-120,z:465,color:'#8c9797',style:'industrial',landmark:'Foundry Row'},
 {id:'verdant-hills',name:'Verdant Range',x:-540,z:-850,color:'#66816c',style:'hill',landmark:'Lookout Relay'},
 {id:'northpoint',name:'Northpoint Airport',x:40,z:ZL(-1440),color:'#819da2',style:'airport',landmark:'Northpoint 14/32'},
 {id:'northhaven',name:'Northhaven',x:-100,z:-1430,color:'#9b8a68',style:'townhouse',landmark:'Northhaven Green'},
 {id:'east-recreation',name:'Eastbank',x:1260,z:90,color:'#c39158',style:'coast',landmark:'Eastbank Field'},
 /* V5.8: the town on the land that filled the inlet */
 /* (V8.3: Larkspan is the city's quarter along Island Parkway now) */{id:'larkspan',name:'Larkspan',x:330,z:ZL(300),color:'#b79a6a',style:'townhouse',landmark:'Larkspan Green'},
 /* V6.0: the stunt park behind the west hill */
 {id:'stunt-park',name:'Northridge Stunt Park',x:-1010,z:-1480,color:'#c39158',style:'coast',landmark:'Northridge Mega Ramp'}];
for(const d of districts){d.z=F(d.x,d.z);/* V7.8: a district whose middle was in the rows taken out */if(Compact?.isVoid?.(d.z))d.z=Compact.EDGE+15;}
/* V7.8: places that stand in among the houses and buildings of the city, as they lie now: [id, x, z] */
const INLAND=[['clothing-drip',-590,GLv(199)],...MOVE_IN.map(([id,x,z0])=>{const f=FRONT.find(f=>f[0]===id);return[id,x,+(z0-LOT_DEEP-1.6-f[4]/2).toFixed(2)];})];
function inland(list){for(const s of list){const f=INLAND.find(f=>f[0]===s[0]);if(f){s[3]=f[1];s[4]=f[2];}}return list;}
const serviceMoves={
 /* V7.2: Platdo Luxury stands on the front row now (it was behind it, at 45, 640) */'clothing-luxury':{x:5,z:692.5},/* V8.3: Larkspan's places stand in the city now, along Island Parkway (written in layout 7 numbers like the rest) */'clothing-oddball':{x:360,z:ZL(302)},
 'safehouse-2':{x:300,z:ZL(300.5)},'garage-2':{x:330,z:ZL(438.7)},/* V8.7: the warehouse row is gone; the two warehouses stand side by side in the empty block west of Redfern Road */'warehouse-1':{x:-568,z:ZL(86)},'warehouse-2':{x:-494,z:ZL(86)},/* V7.4: the marina is on the inlet at the west end of the front (it was on the south shore of Larkspan, at 575, 850) */marina:{x:-650,z:690},
 /* V8.0: north of Northhaven, west of the apron *//* (V8.3: 150 m further west with the airport, east of Northridge Lane) */hangar:{x:-170,z:ZL(-1414)}
};
const legacyServices={
 'clothing-luxury':{x:45,z:-205},'clothing-oddball':{x:205,z:290},
 'safehouse-2':{x:-486,z:-180},'garage-2':{x:-390,z:-205},hangar:{x:1080,z:-250}
};
/* V5.8: where the services that moved again stood in layout 3 (Northhaven, and the marina on the old inlet shore) */
const layout3Services={'clothing-oddball':{x:25,z:-1437},'safehouse-2':{x:-486,z:-1430},'garage-2':{x:-390,z:-1435},marina:{x:233,z:119}};
const parks=[
 {id:'city-park',name:'Exchange Gardens',x:-530,z:-150,w:120,d:130},
 {id:'town-green',name:'Northhaven Green',x:-120,z:-1485,w:130,d:90},
 {id:'mountain-overlook',name:'Relay Overlook',x:-610,z:-825,w:45,d:35},
 {id:'neighborhood-green',name:'Lantern Pocket Green',x:-345,z:110,w:50,d:45},
 /* V8.3: between Harbor Avenue and Foundry Way by Island Parkway (corners given so that they come out at 505 and 625) *//* V8.7: in the empty block north of Redfern Street, by Island Parkway (its old place was in the warehouse row) */{id:'larkspan-green',name:'Larkspan Green',x:330,z:Compact?(ZL(-118)+ZL(2))/2:-58,w:96,d:Compact?ZL(2)-ZL(-118):120}
];
/* V7.2: parksOld is where the parks were in layout 7 (the city's parcels are still chosen there); parks is where they are now */
const parksOld=parks.map(p=>({...p}));for(const p of parks){const a=F(p.x,p.z-p.d/2),b=F(p.x,p.z+p.d/2);p.z=(a+b)/2;p.d=b-a;}
const facilities=[
 /* V8.0: the terminal stands north of Northhaven (written in layout 7 numbers, like the rest of this list) */{id:'airport-terminal',name:'Northpoint Terminal',type:'terminal',x:372,z:ZL(-1409),w:44,d:32,h:9},
 /* (V8.0: the park moved 410 m east and 318 m north) */{id:'dirt-track',name:'Northridge Dirt Circuit',type:'track',x:-425,z:-1743,entrance:{x:-525,z:-1953},approach:{x:-565,z:-2043}},
 {id:'mega-ramp',name:'Northridge Mega Ramp',type:'ramp',x:-755,z:-1763,entrance:{x:-789,z:-1958},approach:{x:-785,z:-2043}},
 {id:'beach',name:'Seaglass Beach',type:'beach',x:-225,z:795,entrance:{x:-260,z:766},approach:{x:-80,z:720}}
];
/* V5.8: where the fifteen houses of Larkspan stand (two rows to a block, clear of the lanes, the shops and the green) */
const LARKSPAN_HOUSES=[[470,-275],[610,-275],[750,-275],[470,-205],[610,-205],[750,-205],[470,-95],[610,-95],[750,-95],[470,-25],[610,-25],[750,-25],[470,325],[750,325],[610,395]].map(([x,z])=>[x,F(x,z)]);
for(const f of facilities){f.z=F(f.x,f.z);for(const k of['entrance','approach'])if(f[k])f[k].z=F(f[k].x,f[k].z);}
const indexes=new WeakMap();
function projection(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(len*len),0,1);return{t,d:Math.hypot(x-a.x-dx*t,z-a.z-dz*t),x:a.x+dx*t,z:a.z+dz*t};}
function shoreline(x,z){let inside=false,edge2=Infinity;for(let i=0,j=coastline.length-1;i<coastline.length;j=i++){const a=coastline[i],b=coastline[j],dx=b.x-a.x,dz=b.z-a.z;if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),ex=x-a.x-dx*t,ez=z-a.z-dz*t;edge2=Math.min(edge2,ex*ex+ez*ez);}return(inside?1:-1)*Math.sqrt(edge2);}
// V2: shoreline() walks the whole coast outline. It is a true distance, so a 32 m
// square whose centre is more than 25 m + its half-diagonal inland is entirely on the
// flat 2.5 m shelf and needs no outline walk at all. The answer is unchanged.
const inlandSquares=new Map();
function terrain(x,z){const y=landform(x,z);if(Recreation&&x-STUNT.x>1200&&x-STUNT.x<1530){const dirt=Recreation.mound(x,z);if(dirt>y)return dirt;}return y;}
function landform(x,z){const beach=Beach?Beach.weight(x,z):0;if(beach<=0)return inlandTerrain(x,z);const y=Beach.height(x,z,shoreline(x,z));return beach>=1?y:mix(inlandTerrain(x,z),y,beach);}
/* V8.0: the hills ease down to the west and east coasts over 130 m (the coast came in to them) */
const coastFade=s=>{const t=clamp((s-15)/115,0,1);return t*t*(3-2*t);};
/* V9.1: hill detail. Value noise from a 32-bit hash; ridged noise for crests and gullies; sharp bumps for outcrops. */
function hillHash(i,j){let h=(Math.imul(i,374761393)+Math.imul(j,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296;}
function hillNoise(x,z){const i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz),a=hillHash(i,j),b=hillHash(i+1,j),c=hillHash(i,j+1),d=hillHash(i+1,j+1);return(a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v)*2-1;}
function hillRidged(x,z){let sum=0,amp=1,f=1,norm=0;for(let o=0;o<3;o++){const n=1-Math.abs(hillNoise(x*f+o*17.3,z*f-o*9.1));sum+=n*n*amp;norm+=amp;amp*=.5;f*=2.03;}return sum/norm;}
const HILL_KEEP=[[-540,-865,50,95],[-570,-941,30,65],[-680,-585,55,95],[-650,-625,55,95]];
function hillMask(x,zo){let m=1;for(const[px,pz,r0,r1]of HILL_KEEP)m=Math.min(m,clamp((Math.hypot(x-px,zo-pz)-r0)/(r1-r0),0,1));return m*m*(3-2*m);}
function hillDetail(x,zo,base){if(base<3)return 0;const m=hillMask(x,zo);if(m<=0)return 0;const rx=x*.799+zo*.602,rz=zo*.799-x*.602,k=clamp(base/35,0,1),r=hillRidged(rx/210,rz/210),v=hillNoise(rx/95+3.1,rz/95-7.7),rocky=clamp((hillNoise(rx/320+7,rz/320-2)-.12)/.38,0,1);let d=(r-.45)*26*k+v*4*k;
 if(rocky>0){const o=hillNoise(rx/34-11,rz/34+5)*.75+hillNoise(x/15+5,zo/15-3)*.25;if(o>.38)d+=(o-.38)*17*k*rocky;}return d*m;}
/* V9.1: groves and boulders on the hills, from their own seed. clearOf(x,z,pad) says a spot is on land and pad metres
 * clear of every road and building. Returns spots; world.js adds them as props after every older prop. */
function hillDressing(world,clearOf){
 if(!Compact)return[];
 let seed=9101;const R=()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 const out=[],cells=new Map(),fix=v=>Math.round(v*100)/100,STONE=['#8d887c','#7f7b70','#9a9386','#868278','#a09a8c'];
 const near=(x,z,r)=>{const ix=Math.floor(x/8),iz=Math.floor(z/8),n=Math.ceil((r+3)/8);for(let i=ix-n;i<=ix+n;i++)for(let j=iz-n;j<=iz+n;j++)for(const q of cells.get(i+','+j)||[])if(Math.hypot(q.x-x,q.z-z)<r+q.r)return true;return false;};
 const take=(x,z,r)=>{const k=Math.floor(x/8)+','+Math.floor(z/8);if(!cells.has(k))cells.set(k,[]);cells.get(k).push({x,z,r});};
 for(const p of world.props)take(p.x,p.z,p.kind==='helipad'?Math.max(p.w,p.d)/2+2:p.kind==='tower'?5:2.5);
 const slope=(x,z)=>Math.hypot(inlandTerrain(x+2,z)-inlandTerrain(x-2,z),inlandTerrain(x,z+2)-inlandTerrain(x,z-2))/4;
 let trees=0,rocks=0;
 const rock=(x,z,w)=>{const d=w*(.7+R()*.45),h=w*(.55+R()*.3),color=STONE[Math.floor(R()*STONE.length)];if(near(x,z,w*.55)||!clearOf(x,z,5+w/2,'rock'))return false;take(x,z,w*.5);rocks++;out.push({kind:'rock',x:fix(x),z:fix(z),w:fix(w),d:fix(d),h:fix(h),color});return true;};
 for(let z=-520;z<=0;z+=7)for(let x=-1080;x<=480;x+=7){
  const px=x+(R()-.5)*6,pz=z+(R()-.5)*6,u=R(),zo=Compact.hillOld(pz);if(zo===null)continue;
  const y=inlandTerrain(px,pz);if(y<10)continue;if(hillMask(px,zo)<.6)continue;
  const s=slope(px,pz),rx=px*.799+zo*.602,rz=zo*.799-px*.602;
  const grove=clamp((hillNoise(px/95+40,zo/95-13)-.15)/.3,0,1),rocky=clamp((hillNoise(rx/320+7,rz/320-2)-.12)/.38,0,1),o=hillNoise(rx/34-11,rz/34+5)*.75+hillNoise(px/15+5,zo/15-3)*.25;
  const pTree=(grove*.3+.008)*clamp((.8-s)/.3,0,1)*clamp((y-10)/8,0,1),pRock=clamp((o-.28)*2.2,0,1)*rocky*.32+clamp((s-.55)/.5,0,1)*.02;
  if(u<pTree&&trees<600){const w=5+R()*3,h=7.5+R()*5.5;if(near(px,pz,4.2)||!clearOf(px,pz,7,'tree'))continue;take(px,pz,2.4);trees++;out.push({kind:'tree',x:fix(px),z:fix(pz),w:fix(w),d:fix(w),h:fix(h)});}
  else if(u>1-pRock&&rocks<500){const w=(1.3+R()*2.2)*(o>.5?1.5:1);if(!rock(px,pz,w))continue;/* a smaller stone or two beside it */const n=Math.floor(R()*3);for(let i=0;i<n;i++){const a=R()*Math.PI*2,r=w*.6+1+R()*1.5;rock(px+Math.cos(a)*r,pz+Math.sin(a)*r,w*(.3+R()*.3));}}
 }
 return out;
}
function inlandTerrain(x,z){const sx=Math.floor(x/32),sz=Math.floor(z/32),square=(sx+8192)*16384+(sz+8192);let inland=inlandSquares.get(square);if(inland===undefined){inland=shoreline(sx*32+16,sz*32+16)>=/* (V8.0: the hills' coast fade needs the distance up to 145 m) */145+22.7;inlandSquares.set(square,inland);}let y,shore=999;if(inland)y=2.5;else{shore=shoreline(x,z);if(shore<=-40)return-14;if(shore<0)return mix(-14,-.2,(shore+40)/40);y=shore<25?mix(-.2,2.5,shore/25):2.5;}
 // A real continuous ridge, with a low saddle for the direct Mountain Link.
 /* V7.2: the hills keep the shape they were written with; zo is the old z of this spot (they stand closer now and are 0.7 times as deep) */const zo=Compact?Compact.hillOld(z):(z<-440&&z>-1240?z:null);if(zo!==null){const fade=clamp((-zo-440)/160,0,1)*clamp((zo+1240)/180,0,1),saddle=1-.87*Math.exp(-(((x+260)/130)**2));
 const raw=fade*saddle*coastFade(shore)*(106*Math.exp(-(((x+580)/380)**2)-((zo+865)/250)**2)+123*Math.exp(-(((x-230)/540)**2)-((zo+870)/250)**2));y+=(Compact?.hillScale??1)*(raw+hillDetail(x,zo,raw));}
 return y;
}
/* V7.2: the same borders as before, asked with the old z of the spot */function districtAt(world,x,zNow){const z=Compact?Compact.Finv(x,zNow):zNow;/* V8.0: the airport is north of Northhaven, the park 250 m further east */if(x>-420&&x<560&&zNow<-1270&&zNow>-1720)return world.districts[6];if(z<-1560&&x<-280)return world.districts[10];if(z<-1220)return world.districts[7];if(x>330&&x<960&&z>-520&&z<650)return world.districts[9];if(x>=960&&z>-500)return world.districts[8];if(z<-510)return world.districts[5];if(z>590)return world.districts[2];if(x>170&&z>30)return world.districts[2];if(z>350)return world.districts[4];if(x<-320)return world.districts[3];if(z<40)return world.districts[1];return world.districts[0];}
function configure(world){world.layoutVersion=VERSION;world.extent=2300;world.navigationRevision=VERSION;world.districts=districts.map(d=>({...d}));world.coastline=coastline.filter(p=>!(Compact?.isVoid?.(p.z))).map(p=>({...p}));world.parks=parks.map(p=>({...p}));world.facilities=facilities.map(f=>JSON.parse(JSON.stringify(f)));world.facilitySurfaces=[];world.facilityParts=[];/* V8.0: the airport north of Northhaven: the runway runs east-west (x -480 to 360); heading -PI/2 puts the taxiway (cross 85) on its south side, then the apron, the hangar west of it and the terminal east of it, the car park by the terminal *//* (V8.3: 150 m west and 25 m north: the runway runs x -380 to 460) */world.runway={id:'runway',x:40,z:GLv(-1555),width:42,length:840,y:2.58,heading:-Math.PI/2};world.airport={apron:{x:110,z:GLv(-1410),w:420,d:100,y:2.58},taxiway:{...runwayPoint(world,0,85),w:18,d:720,y:2.58,heading:-Math.PI/2},parking:{x:380,z:GLv(-1300),w:105,d:56,y:2.58}};world.mapRevision='island-'+VERSION;/* V7.4 */world.berths=BERTHS.map(b=>({...b}));world.marinaPiers=PIERS.slice();/* V7.5 */world.parkingLots=LOTS.map(l=>({...l,bays:l.bays.map(b=>({...b}))}));}
// Local runway coordinates are shared by collision, map, placement and missions.
function runwayPoint(world,along,cross=0){const r=world.runway,s=Math.sin(r.heading||0),c=Math.cos(r.heading||0);return{x:r.x+s*along+c*cross,y:r.y,z:r.z+c*along-s*cross};}
function runwayCoordinates(world,x,z){const r=world.runway,s=Math.sin(r.heading||0),c=Math.cos(r.heading||0),dx=x-r.x,dz=z-r.z;return{along:dx*s+dz*c,cross:dx*c-dz*s};}
function onRunway(world,x,z,margin=0){const p=runwayCoordinates(world,x,z);return Math.abs(p.along)<=world.runway.length/2-margin&&Math.abs(p.cross)<=world.runway.width/2-margin;}
function renderAirport(scene,b){const w=scene.world,r=w.runway,box=(along,cross,width,height,depth,color,y=.025)=>{const p=runwayPoint(w,along,cross);scene.box(b,color,p.x,r.y+y,p.z,width,height,depth,r.heading);};box(0,0,r.width,.12,r.length,'#3c484c',-.06);for(let along=-r.length/2+35;along<r.length/2-25;along+=36)box(along,0,.5,.025,16,'#efe9d7');for(const end of[-1,1]){for(let i=-5;i<=5;i++)box(end*(r.length/2-17),i*2.2,1.3,.025,15,'#e4e4d6');for(let cross of[-r.width/2-2,r.width/2+2])for(let along=-r.length/2+6;along<r.length/2;along+=30){const p=runwayPoint(w,along,cross);scene.box(b,'#d6e5cb',p.x,r.y+.12,p.z,.35,.15,.35,0,'glow');}}for(const side of[-1,1])box(0,side*(r.width/2-1.4),.35,.025,r.length-5,'#ecebdc');const t=w.airport.taxiway;for(let along=-t.d/2+15;along<t.d/2-10;along+=25)box(along,85,.25,.025,17,'#e1c475');}
function addRoads(world,{road}){
 /* V7.2: add() takes road points as they were written in layout 7 and puts the road where it is now; addNow() takes them as they are */
 const add=(id,name,anchors,width,speed)=>lay(id,name,Compact?Compact.points(anchors):anchors,width,speed),/* V8.7: a road added as it lies goes through the warehouse-row rule (Harbor Avenue's stub goes with the row) */addNow=(id,name,anchors,width,speed)=>lay(id,name,Compact?.G?anchors.map(a=>[a[0],Compact.G(a[1]),...a.slice(2)]):anchors,width,speed),lay=(id,name,anchors,width=14,speed=16)=>{/* V7.8: corners in the rows that were taken out are left out first (a piece across one would run off the map); V8.3: and corners where the sea is now */if(Compact?.isVoid){anchors=anchors.filter(a=>!Compact.isVoid(a[1])&&!Compact.isCut?.(a[0],a[1])).filter((a,i,arr)=>!i||Math.hypot(a[0]-arr[i-1][0],a[1]-arr[i-1][1])>1e-6);if(anchors.length<2)return;}const pts=[];for(let k=1;k<anchors.length;k++){const a=anchors[k-1],b=anchors[k],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/30));if(!pts.length)pts.push([a[0],a[1],a[2]??terrain(a[0],a[1])+.06]);for(let j=1;j<=n;j++){const t=j/n,x=mix(a[0],b[0],t),z=mix(a[1],b[1],t);pts.push([x,z,a[2]!=null&&b[2]!=null?mix(a[2],b[2],t):terrain(x,z)+.06]);}}const before=world.roads.length;road(name,pts,width,speed,'ground','island-road',pts.slice(1).map((_,i)=>id+':'+i));for(const r of world.roads.slice(before))r.pathId=id;world.roadPaths.push({id,name,kind:'island-road',width,sidewalkWidth:2.8,points:pts.map(([x,z,y])=>({x,y,z})),roadIds:world.roads.slice(before).map(r=>r.id)});};
 // The existing city intersections remain stable; the outer network joins them explicitly.
 for(const r of world.roads){if(r.name==='Northgate Avenue')r.name='Northern City Bypass';if(r.name==='Quay Boulevard')r.name='City Avenue';if(r.name==='Northpoint Service Road')r.name='Eastern Coastal Road';if(r.name==='Hangar Access')r.name='Eastbank Road';if(r.name==='Recreation Arrival')r.name='Eastbank Lane';}
 add('coast-boulevard','Coast Boulevard',[[-620,580],[-620,720],[-440,720],[-260,720],[-80,720],[100,720],[260,720],[260,580]],/* V7.1: a two-lane road */12,15);
 add('beach-avenue','Beach Avenue',[[-80,580],[-80,720]],14,12);
 /* V8.0: the airport is north of Northhaven: Airport Road carries Mountain Link on from Northhaven Crescent, the forecourt runs along the south side of the airport */addNow('airport-road','Airport Road',[[-260,F11(-260,-1540)],[-260,-1345]],16,19);
 addNow('airport-forecourt','Airport Forecourt',[[-260,-1345],[372,-1345],[450,-1345]],12,8);
 add('mountain-link','Mountain Link',[[-260,-420],[-260,-600],[-260,-800],[-260,-1000],[-260,-1220],[-260,-1370],[-260,-1540]],16,18);
 add('scenic-pass','Scenic Pass',[[-665,-950],/* V7.2: 15 m wider (it was at -820), so the climb is no steeper than it was */[-835,-1040],[-730,-1120],[-900,-1200],[-710,-1280],[-620,-1370],[-620,-1540]],12,11);
 add('northhaven-main','Northhaven Main Street',[[-620,-1370],[-440,-1370],[-260,-1370],[-80,-1370],[100,-1370],[330,-1370],[500,-1370]],16,13);
 add('northhaven-north','Northhaven Crescent',[[-620,-1540],[-440,-1540],[-260,-1540],[-80,-1540],[100,-1540],[330,-1540],[500,-1540],[500,-1370]],14,11);
 for(const x of[-440,-80,330])add('town-cross-'+x,'Northhaven Lane',[[x,-1370],[x,-1540]],12,10);
 /* (V8.0: its loop keeps within the narrower island) */add('east-coast','Eastern Coastal Road',[[960,-420],[1000,-420],[1000,-650],[1025,-880],[1015,-1110],[900,-1290],[760,-1370],[500,-1370]],16,17);
 /* V6.0: the road to the stunt park, from the north-west corner of Northhaven and along the park's north side (the old Recreation Road at Eastbank is gone) */
 /* V8.0: the park is 250 m further east; its road leaves Northhaven at x -440 (the old way north at -620 would cross the park now), and Northridge Lane carries on to the airport */addNow('northridge-lane','Northridge Lane',[[-260,-1345],[-260,-1518]],12,10); addNow('stunt-park-road','Stunt Park Road',[[-260,-1518],[-425,-1518],[-565,-1518],[-667,-1518],[-725,-1518],[-880,-1518]],14,11);
 /* V5.8: the inlet is land. Two ground roads where the bridges were, the parkway between the city and the town,
  * the coast road carried on east, Lantern Street carried on east as the town's main street, and the lanes of
  * Larkspan. Every crossing is an anchor in both roads, so the streets join. */
 /* V7.8: Larkspan Road ran on the north edge of the town; with the two inland rows gone it would lie on Chandler Street. Its numbers stay used. */
 add('foundry-east','Foundry Way',[[260,580],[400,580],[540,580],[680,580],[820,580],[960,580]],18,17);
 add('island-parkway','Island Parkway',[[400,720],[400,580],[400,360],[400,180],[400,-60],[400,-240],[400,-420]],18,19);
 add('coast-east','Coast Boulevard',[[260,720],[400,720],[540,720],[680,720],[820,720],[960,720],[960,580]],12,15);
 add('lantern-east','Lantern Street',[[260,180],[400,180],[540,180],[680,180],[820,180],[960,180]],16,13);
 for(const[x,name]of[[540,'Mill Lane'],[680,'Larkspan High Street'],[820,'Orchard Lane']])add('larkspan-lane-'+x,name,[[x,-420],[x,-240],[x,-60],[x,180],[x,360],[x,580],[x,720]],12,10);
 for(const[z,name]of[[-240,'Cooper Street'],[-60,'Chandler Street'],[360,'Tanner Street']])add('larkspan-cross-'+z,name,[[400,z],[540,z],[680,z],[820,z]],12,10);
 add('marina-road',/* V7.4: the marina has moved to the west inlet; this road still leads to the shore */'Larkspan Shore Road',[[540,720],[540,850]],12,8);
 /* V8.3: the slip is at the east end of the beach; the city's streets carry on east to Island Parkway, where Larkspan's places stand */add('slip-road','Slip Road',[[400,720],[425,720],[425,850]],12,8); addNow('bypass-east','Northern City Bypass',[[260,-129],[400,-129]],16,14); addNow('redfern-east','Redfern Street',[[260,13],[400,13]],16,13); addNow('exchange-east','Exchange Avenue',[[260,159],[400,159]],16,13); addNow('harbor-east','Harbor Avenue',[[260,472],[400,472]],16,13);
 /* V5.9: Hillside Drive and Skyline Drive, from the top of Island Parkway */
 /* (V8.3: not any more: the hill mansions are gone with Larkspan) */if(Hills&&VERSION<14)Hills.roads(addNow,terrain);
 /* V7.0: City Avenue carried on south to the coast road, so the main road of the city meets the beach front. Added
  * last, so every road before it keeps its number. */
 add('city-avenue-south','City Avenue',[[-260,580],[-260,720]],16,14);
 world.regionalRoutes=['mountain-link','scenic-pass','east-coast'];
}
function moveServices(list){for(const s of list){const p=serviceMoves[s[0]];if(p){s[3]=p.x;s[4]=p.z;}}const f=facilities[0];list.push([f.id,f.name,f.type,f.x,/* (V8.0: in layout 7 numbers, like the rest of the list) */Compact?Compact.Finv(f.x,GLv(f.z)):f.z,f.w,f.d,f.h]);return list;}
function decorateBuildings(world,terrainHeight,grid){let i=0;for(const x of[-560,-490,-350,-285,-190,40,180,250,390,450])for(const zo of[-1410,-1496]){const z=F(x,zo);if(world.services.some(s=>Math.abs(x-s.x)<(s.w+30)/2+8&&Math.abs(z-s.z)<(s.d+26)/2+8)||parks.some(p=>Math.abs(x-p.x)<p.w/2+20&&Math.abs(z-p.z)<p.d/2+20))continue;world.buildings.push({id:'northhaven-house-'+i++,x,y:terrainHeight(x,z),z,w:26,d:24,h:7+(i%3)*1.8,style:'townhouse',district:'northhaven',tint:i%5,roof:i%3,bays:4,interior:false});}
 /* V5.8: the fifteen houses of Larkspan, two rows to a block, clear of the lanes, the shops and the green */
 let k=0;for(const[x,z]of LARKSPAN_HOUSES){world.buildings.push({id:'larkspan-house-'+k,x,y:terrainHeight(x,z),z,w:26,d:24,h:7+(k%3)*1.8,style:'townhouse',district:'larkspan',tint:k%5,roof:k%3,bays:4,interior:false});k++;}
 if(grid)fillGaps(world,terrainHeight,grid);}
/* V7.3: the gaps along the streets are built up.
 * The city: every row of buildings gets a building in each gap between two neighbours (or between a neighbour and the
 * street corner), with a 3 m passage left on each side. West of City Avenue and in Glassline they are towers,
 * elsewhere blocks of flats. Larkspan: every free site along its three cross streets, the south side of Larkspan Road,
 * the south side of Lantern Street and the north side of Foundry Way gets a house.
 * Nothing is built in a park, across a shop's footpath to the street, on the square by Meridian Exchange, or within
 * 4 m of a spot the world file asks to keep open. A new building carries infill:true and a name made from its place,
 * so one more or one fewer never renames the others. */
const unit=s=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return((h>>>0)%100000)/100000;};
function boxToPath(r,a,b){let best=Infinity;for(let i=0;i<=24;i++){const t=i/24,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;best=Math.min(best,Math.hypot(Math.max(r.a-x,0,x-r.b),Math.max(r.c-z,0,z-r.d)));}return best;}
function fillGaps(world,terrainHeight,grid){
 const keep=(grid.keep||[]).map(([x,z])=>({x,z:F(x,z)})),{xs,zs}=grid;
 const free=r=>!parks.some(p=>r.a<p.x+p.w/2+4&&r.b>p.x-p.w/2-4&&r.c<p.z+p.d/2+4&&r.d>p.z-p.d/2-4)&&!world.services.some(s=>s.approach&&boxToPath(r,s.entrance,s.approach)<2.5)&&!keep.some(p=>p.x>r.a-4&&p.x<r.b+4&&p.z>r.c-4&&p.z<r.d+4);
 for(let ix=0;ix<xs.length-1;ix++)for(let iz=0;iz<zs.length-1;iz++)for(let bz=0;bz<3;bz++){
  /* the square by Meridian Exchange stays open */if(ix===3&&iz===1&&bz<2)continue;
  const x0=xs[ix]+14.3,x1=xs[ix+1]-14.3,zc=F(0,zs[iz]+(zs[iz+1]-zs[iz])*(bz+.5)/3),c0=zc-13.5,c1=zc+13.5,taken=[];
  for(const b of world.buildings)if(b.z+b.d/2>c0&&b.z-b.d/2<c1&&b.x+b.w/2>x0&&b.x-b.w/2<x1)taken.push([b.x-b.w/2,b.x+b.w/2]);
  for(const c of world.colliders)if(!c.floor&&c.maxY-c.minY>=.6&&c.maxZ>c0&&c.minZ<c1&&c.maxX>x0&&c.minX<x1)taken.push([c.minX,c.maxX]);
  taken.sort((a,b)=>a[0]-b[0]);const gaps=[];let cur=x0,n=0;for(const t of taken){if(t[0]>cur)gaps.push([cur,t[0]]);cur=Math.max(cur,t[1]);}if(x1>cur)gaps.push([cur,x1]);
  for(const g of gaps){const lo=g[0]+(g[0]===x0?0:3),hi=g[1]-(g[1]===x1?0:3),width=hi-lo;if(width<14)continue;const count=Math.ceil(width/34),each=(width-(count-1)*3)/count;
   for(let j=0;j<count;j++){const a=lo+j*(each+3),r={a,b:a+each,c:c0,d:c1},id='infill-'+ix+'-'+iz+'-'+bz+'-'+(n++);if(!free(r))continue;
    const x=(r.a+r.b)/2,dist=districtAt(world,x,zc),glass=dist.id==='glassline',tall=glass||x<-260,style=tall?'tower':dist.style==='brick'?'brick':'coast';
    const h=tall?(glass?30:26)+unit(id)*(glass?54:44):style==='coast'?13+unit(id)*12:12+unit(id)*13;
    world.buildings.push({id,x,y:terrainHeight(x,zc),z:zc,w:each,d:27,h,style,district:dist.id,tint:Math.floor(unit(id+'t')*5),roof:Math.floor(unit(id+'r')*3),bays:Math.max(3,Math.round(each/5)),interior:false,infill:true});}}}
 let k=LARKSPAN_HOUSES.length;
 for(const zo of[-385,-275,-205,-95,-25,215,325,395,545])for(const x of[428,470,512,568,610,652,708,750,792,848,890,932]){const z=F(x,zo),r={a:x-13,b:x+13,c:z-12,d:z+12};
  if(world.buildings.some(b=>b.x-b.w/2<r.b+3&&b.x+b.w/2>r.a-3&&b.z-b.d/2<r.d+3&&b.z+b.d/2>r.c-3)||!free(r))continue;
  world.buildings.push({id:'larkspan-house-'+x+(zo<0?'n':'s')+Math.abs(zo),x,y:terrainHeight(x,z),z,w:26,d:24,h:7+(k%3)*1.8,style:'townhouse',district:'larkspan',tint:k%5,roof:k%3,bays:4,interior:false,infill:true});k++;}
}
function protectedParcel(x,z,w,d,old){return(old?parksOld:parks).some(p=>Math.abs(x-p.x)<(p.w+w)/2&&Math.abs(z-p.z)<(p.d+d)/2);}
function decorateProps(world,addProp){for(const park of parks){for(const sx of[-1,1])for(const sz of[-1,1]){addProp('tree',park.x+sx*(park.w/2-9),park.z+sz*(park.d/2-9),7,7,10);addProp('bench',park.x+sx*7,park.z+sz*(park.d/2-13),3,1.2,1);} }/* V4: the even row of palms and umbrellas is gone; the beach module places its own. */for(const z of[-1480,-1410])for(const x of[-580,-320,210,420])addProp('tree',x,F(x,z),6,6,9);}
function installFacilities(world,{box,spanBox}){
 const surface=(id,points,width,color='#AF7955',terrainSupport=true)=>{const p={id,points,width,color,terrainSupport};world.facilitySurfaces.push(p);for(let i=1;i<points.length;i++)spanBox(id+':'+i,points[i-1],points[i],width,-.22,.22,0,'masonry',{floor:true,facility:true,bank:((points[i-1].bank||0)+(points[i].bank||0))/2});return p;};
 const part=(id,color,x,y,z,w,h,d,solid=true)=>{world.facilityParts.push({id,color,x,y,z,w,h,d});if(solid)box(id,x,y-h/2,z,w,h,d,'masonry',{facility:true,floor:h<.4,roofSupport:h<.4});};
 const poly=(anchors,step=3)=>{const points=[];for(let i=1;i<anchors.length;i++){const a=anchors[i-1],b=anchors[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/step));if(!points.length)points.push({...a});for(let j=1;j<=n;j++){const t=j/n;points.push({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:mix(a.z,b.z,t)});}}return points;};
 /* V6.0: everything from here to the car park is written with its Eastbank positions and placed STUNT away */
 const surfaceHere=surface,partHere=part,move=p=>({...p,x:p.x+STUNT.x,z:p.z+STUNT.z});{const surface=(id,points,...rest)=>surfaceHere(id,points.map(move),...rest),part=(id,color,x,y,z,...rest)=>partHere(id,color,x+STUNT.x,y,z+STUNT.z,...rest);
 // Mega ramp faces south. The launch arc is C1 smooth; the separate landing
 // continues into a 90 m braking apron with a ground-level exit at both sides.
 const launch=[];for(let i=0;i<=72;i++){const t=i/72,z=-110+t*190;let y;if(t<.65){const u=t/.65;y=2.7+30*(.5+.5*Math.cos(u*Math.PI));}else{const u=(t-.65)/.35;y=2.7+5*u*u;}launch.push({x:1050,z,y});}surface('mega-launch',launch,16,'#c3c6ba',false);
 /* V4.2: the landing starts 8 m nearer and 0.6 m higher, so an ordinary car comes down on the slope and not on its front edge. */surface('mega-landing',poly([{x:1050,y:6.9,z:104},{x:1050,y:3.8,z:142},{x:1050,y:2.6,z:184},{x:1050,y:2.6,z:278}],3),26,'#adb7ad');
 surface('mega-return',poly([{x:1050,y:2.6,z:278},{x:1130,y:2.6,z:278},{x:1175,y:2.6,z:220},{x:1175,y:2.6,z:-160},{x:1100,y:2.6,z:-160}]),8,'#8b9391');
 // 450 m rideable access at 6.7% average grade, with broad turning landings.
 const ascent=[{x:925,y:2.6,z:-195},{x:925,y:2.6,z:-135},{x:1010,y:10.1,z:-135},{x:1010,y:10.1,z:-158},{x:925,y:17.6,z:-158},{x:925,y:17.6,z:-181},{x:1010,y:25.1,z:-181},{x:1030,y:27,z:-181},{x:1030,y:32.7,z:-110},{x:1050,y:32.7,z:-110}];surface('mega-ascent',poly(ascent),7,'#b3b8b0',false);
 part('mega-top-deck','#c3c6ba',1050,32.55,-123,30,.3,26);
 for(const z of[-134,-111])for(const x of[1036,1064])part('mega-support-'+x+z,'#596a6c',x,16.2,z,.65,32.4,.65);
 for(const x of[1035,1065])part('mega-deck-rail-'+x,'#efc878',x,33.25,-123,.16,1.1,26);
 part('mega-deck-back-rail','#efc878',1050,33.25,-136,30,1.1,.16);
 // Separate public 2.8 m stair with eight flights, seven intermediate landings.
 let stairY=2.6,stairs=[];for(let flight=0;flight<8;flight++){const east=flight%2===0,startX=east?985:1005,startZ=-105+flight*4.6;const rise=30.1/8,steps=23;for(let j=0;j<steps;j++){stairY+=rise/steps;const x=startX+(east?1:-1)*(j+.5)*20/steps,z=startZ;part('home:stair-island-'+flight+'-'+j,'#b9bdb0',x,stairY-.1,z,20/steps+.04,.2,2.8);stairs.push({x,y:stairY,z});}if(flight<7){const x=east?1005:985;surface('mega-stair-landing-'+flight,[{x,y:stairY,z:startZ},{x,y:stairY,z:startZ+4.6}],2.8,'#b9bdb0',false);}for(const sz of[-1,1]){const a={x:startX,y:stairY-rise+1,z:startZ+sz*1.4},b={x:east?1005:985,y:stairY+1,z:startZ+sz*1.4};surface('mega-stair-rail-'+flight+'-'+sz,[a,b],.1,'#e8c375',false);}}
 surface('mega-stair-top',poly([{x:985,y:32.7,z:-72.8},{x:978,y:32.7,z:-72.8},{x:978,y:32.7,z:-105},{x:1050,y:32.7,z:-105}]),2.8,'#b9bdb0',false);/* V6.0: the ramp as the park's own file knows it (Eastbank positions), and as the world has it */const landingNow=world.facilitySurfaces.find(p=>p.id==='mega-landing').points,back=p=>({...p,x:p.x-STUNT.x,z:p.z-STUNT.z});world.megaRampLocal={deck:{x:1050,y:32.7,z:-123},launch,landing:landingNow.map(back),ascentPoints:world.facilitySurfaces.find(p=>p.id==='mega-ascent').points.map(back)};world.megaRamp={height:30.1,deck:move({x:1050,y:32.7,z:-123}),stairTreads:stairs.map(move),ascent:ascent.map(move),launch:launch.map(move),landing:landingNow};
 /* V6.0: the stunt park's car park, between the ramp's return road and the track: a driveway from the road and 84 marked bays in six rows */
 surface('stunt-parking',[{x:1207,y:2.6,z:-178},{x:1207,y:2.6,z:-122}],46,'#7c8386');surface('stunt-parking-drive',[{x:1207,y:2.6,z:-186},{x:1207,y:2.6,z:-177}],8,'#7c8386');
 for(const[row,z]of[[0,-175],[1,-163],[2,-158],[3,-146],[4,-141],[5,-129]])for(let k=0;k<=14;k++)part('stunt-bay-'+row+'-'+k,'#eef0e8',1188.1+k*2.7,2.615,z,.12,.02,5,false);
 for(const z of[-160.5,-143.5])part('stunt-bay-mid'+z,'#eef0e8',1207,2.615,z,37.8,.02,.12,false);
 part('stunt-parking-post','#59646a',1201,4.1,-184.6,.14,3,.14);part('stunt-parking-sign','#1f5fa8',1201,5.3,-184.6,1.7,.9,.08,false);part('stunt-parking-p','#f4f6f2',1201,5.3,-184.55,.5,.6,.02,false);
 }
 /* V7.5: the car parks behind the beach front (tarmac, a line between every two bays, a P sign at the street) and the paved walk in front of the shops */
 for(const l of LOTS){surface(l.id,[{x:(l.x0+l.x1)/2,y:l.y,z:l.z0},{x:(l.x0+l.x1)/2,y:l.y,z:l.z1}],l.x1-l.x0,'#7c8386');
  /* (V7.8: dir says which way the street is, so the lines, the stop line and the sign work for car parks either way round) */const dr=l.dir||-1;
  for(let i=0;i<=l.bays.length;i++)part(l.id+':line:'+i,'#eef0e8',l.bays[0].x-1.3+i*2.6,l.y+.015,l.z1+dr*l.bayDepth/2,.12,.02,l.bayDepth,false);
  part(l.id+':stop','#eef0e8',(l.x0+l.x1)/2,l.y+.015,l.z1+dr*l.bayDepth,l.bays.length*2.6,.02,.12,false);
  part(l.id+':post','#59646a',l.x0+.7,l.y+1.5,l.z0-dr*.4,.14,3,.14);part(l.id+':sign','#1f5fa8',l.x0+.7,l.y+2.7,l.z0-dr*.4,1.1,.8,.08,false);part(l.id+':p','#f4f6f2',l.x0+.7,l.y+2.7,l.z0-dr*.35,.36,.5,.02,false);}
 FRONT_WALK.forEach(([a,b],i)=>surface('front-walk-'+i,[{x:a,y:2.6,z:707.6},{x:b,y:2.6,z:707.6}],7.2,'#d8d0bd'));
 // Airport paths and apron use the exact same dimensions as the map.
 const ap=world.airport.apron,pk=world.airport.parking;part('airport-parking','#777f80',pk.x,pk.y-.05,pk.z,pk.w,.1,pk.d,false);
 surface('airport-apron',[{x:ap.x,y:ap.y,z:ap.z-ap.d/2},{x:ap.x,y:ap.y,z:ap.z+ap.d/2}],ap.w,'#939b96');
 surface('airport-taxiway',[runwayPoint(world,-360,85),runwayPoint(world,360,85)],18,'#939b96');
 for(const along of[-300,300])surface('airport-taxi-exit-'+along,[runwayPoint(world,along),runwayPoint(world,along,85)],18,'#939b96');
 surface('airport-apron-access',[runwayPoint(world,80,85),{x:ap.x,y:ap.y,z:ap.z}],20,'#939b96');
 if(Beach)Beach.install(world,{box,spanBox,terrain});
 if(Recreation)Recreation.install(world,{surface,part,poly,box});
 /* V5.9: the fifteen mansions on the hill */
 if(Hills&&VERSION<14)Hills.install(world,{part,surface,terrain});
 /* V5.8: Larkspan's street trees (two by each house) and the lamps along its main street. They are added here,
  * after every numbered prop exists, under names of their own, so no earlier prop changes its number; each gets
  * its trunk or post as a solid here for the same reason. */
 const townProp=(id,kind,x,z,w,h)=>{const y=terrain(x,z),p={id,kind,x,y,z,w,d:w,h,collisionIds:[]};world.props.push(p);p.collisionIds.push((kind==='tree'?box(id+':trunk',x,y,z,.44,h*.48,.44,'wood',{propId:id}):box(id+':post',x,y,z,.19,h,.19,'metal',{propId:id})).id);};
 LARKSPAN_HOUSES.forEach(([x,z],i)=>{townProp('larkspan-tree-'+i+'a','tree',x-20,z+5,5+i%3,8+i*7%4);townProp('larkspan-tree-'+i+'b','tree',x+20,z-6,5+(i+1)%3,8+i*5%4);});
 for(let x=430;x<950;x+=35)if(![540,680,820].some(c=>Math.abs(x-c)<14))townProp('larkspan-light-'+x,'streetlight',x,F(x,193),.3,7);
 // Build a compact spatial lookup once. Per-frame ground queries inspect nearby spans only.
 const grid=new Map();for(const s of world.facilitySurfaces)for(let i=1;i<s.points.length;i++){const a=s.points[i-1],b=s.points[i],p={a,b,width:s.width,terrainSupport:s.terrainSupport,id:s.id};const pad=s.width/2+2;for(let ix=Math.floor((Math.min(a.x,b.x)-pad)/64);ix<=Math.floor((Math.max(a.x,b.x)+pad)/64);ix++)for(let iz=Math.floor((Math.min(a.z,b.z)-pad)/64);iz<=Math.floor((Math.max(a.z,b.z)+pad)/64);iz++){const k=(ix+8192)*16384+(iz+8192);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(p);}}indexes.set(world,grid);
}
function facilityHeight(world,x,z,referenceY=Infinity,terrainOnly=false){let h=-Infinity;const cell=indexes.get(world)?.get((Math.floor(x/64)+8192)*16384+(Math.floor(z/64)+8192));if(!cell)return h;for(const s of cell){if(terrainOnly&&!s.terrainSupport)continue;const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,len2=dx*dx+dz*dz,u=((x-s.a.x)*dx+(z-s.a.z)*dz)/(len2||1);if(u<-.002||u>1.002)continue;const p=projection(x,z,s.a,s.b),side=(-(x-s.a.x)*dz+(z-s.a.z)*dx)/Math.sqrt(len2||1),y=mix(s.a.y,s.b.y,p.t)+mix(s.a.bank||0,s.b.bank||0,p.t)*side;if(p.d<=s.width/2&&y<=referenceY+.65)h=Math.max(h,y);}return h;}
/* V8.7: walkways to the doors (see the update log) */
function renderWalkways(scene){const T=scene.T,w=scene.world;if(!T||!w?.buildings?.length||scene.walkways)return;
 const fin=v=>Number.isFinite(v),roads=(w.roads||[]).filter(r=>r.a&&r.b&&(!r.layer||r.layer==='ground')&&fin(r.width));
 const ew=roads.filter(r=>Math.abs(r.a.z-r.b.z)<.5&&Math.abs(r.a.x-r.b.x)>1),ns=roads.filter(r=>Math.abs(r.a.x-r.b.x)<.5&&Math.abs(r.a.z-r.b.z)>1),edge=r=>r.width/2+2.8;
 const rects=[...w.buildings,...(w.services||[])].filter(o=>fin(o.x)&&fin(o.z)&&fin(o.w)&&fin(o.d)).map(o=>({x0:o.x-o.w/2,x1:o.x+o.w/2,z0:o.z-o.d/2,z1:o.z+o.d/2,o}));
 for(const l of w.parkingLots||[])rects.push({x0:Math.min(l.x0,l.x1),x1:Math.max(l.x0,l.x1),z0:Math.min(l.z0,l.z1),z1:Math.max(l.z0,l.z1),o:l});
 const doors=[],gaps=new Map(),slabs=[];
 for(const b of w.buildings){const a=b.architecture,p0=a?.parts?.[0];if(!p0||b.customHome||b.customMansion||w.serviceById?.[b.id]||!fin(p0.w)||!fin(p0.d))continue;
  const fw=p0.w,cols=Math.max(1,Math.floor(fw/(b.style==='industrial'?5.8:b.style==='tower'?4.3:4.7))),bay=fw/cols,c=clamp(Math.floor(cols/2+((a.entry||0)-1)*cols*.10),0,cols-1);
  const xd=b.x+(p0.x||0)-fw/2+(c+.5)*bay,zd=b.z+(p0.z||0)+p0.d/2;
  let street=Infinity;for(const r of ew){if(xd<Math.min(r.a.x,r.b.x)||xd>Math.max(r.a.x,r.b.x))continue;const e=r.a.z-edge(r);if(e>zd-.1&&e<street)street=e;}
  let block=Infinity;for(const q of rects){if(q.o===b||q.x1<xd-1.2||q.x0>xd+1.2)continue;if(q.z1>zd+.05&&q.z0<block)block=Math.max(zd,q.z0);}
  if(street<=block){if(street-zd>.3&&street-zd<45)slabs.push([xd-.9,xd+.9,zd,street]);continue;}
  const gap=block-zd;if(gap<4.5)continue;const zg=zd+gap/2;let west=-Infinity,east=Infinity;
  for(const r of ns){if(zg<Math.min(r.a.z,r.b.z)||zg>Math.max(r.a.z,r.b.z))continue;const x=r.a.x;if(x<xd&&x+edge(r)>west)west=x+edge(r);if(x>xd&&x-edge(r)<east)east=x-edge(r);}
  if(!fin(west)||!fin(east))continue;const key=Math.round(west)+':'+Math.round(east)+':'+Math.round(zg/3);let g=gaps.get(key);if(!g)gaps.set(key,g={west,east,zs:[]});g.zs.push(zg);doors.push({xd,zd,g});}
 /* footpaths of one gap that came out a little apart are one footpath */const list=[...gaps.values()];for(const g of list)g.z=g.zs.reduce((s,v)=>s+v,0)/g.zs.length;list.sort((a,b)=>a.west-b.west||a.east-b.east||a.z-b.z);const kept=[];for(const g of list){const last=kept[kept.length-1];if(last&&Math.abs(last.west-g.west)<1&&Math.abs(last.east-g.east)<1&&Math.abs(last.z-g.z)<3.2){last.zs.push(...g.zs);last.z=last.zs.reduce((s,v)=>s+v,0)/last.zs.length;g.into=last;}else kept.push(g);}for(const d of doors)while(d.g.into)d.g=d.g.into;
 for(const g of kept){const z=g.z;let segs=[[g.west,g.east]];
  for(const q of rects){if(q.z1<z-1.4||q.z0>z+1.4)continue;const a0=q.x0-.3,a1=q.x1+.3;segs=segs.flatMap(([s0,s1])=>a1<=s0||a0>=s1?[[s0,s1]]:[[s0,a0],[a1,s1]].filter(([u,v])=>v-u>0));}
  g.segs=segs.filter(([u,v])=>v-u>=3);for(const[u,v]of g.segs)slabs.push([u,v,z-1.1,z+1.1]);}
 for(const d of doors){const top=d.g.z-1.1;if(top-d.zd<.3||!d.g.segs?.some(([u,v])=>d.xd-.9>=u&&d.xd+.9<=v))continue;
  if(rects.some(q=>q.x1>d.xd-.9&&q.x0<d.xd+.9&&q.z1>d.zd+.05&&q.z0<top))continue;/* never on top of another walkway */if(slabs.some(([a0,a1,b0,b1])=>a1>d.xd-.9+.01&&a0<d.xd+.9-.01&&b1>d.zd+.01&&b0<top-.01))continue;slabs.push([d.xd-.9,d.xd+.9,d.zd,top]);}
 /* last check: no two slabs overlap */const clear=[];for(const s of slabs){if(clear.some(([a0,a1,b0,b1])=>a1>s[0]+.01&&a0<s[1]-.01&&b1>s[2]+.01&&b0<s[3]-.01))continue;clear.push(s);}slabs.length=0;slabs.push(...clear);
 const pieces=[];for(const[x0,x1,z0,z1]of slabs){const n=Math.max(1,Math.ceil(Math.max(x1-x0,z1-z0)/24));for(let i=0;i<n;i++){const along=x1-x0>=z1-z0;pieces.push(along?[x0+(x1-x0)*i/n,x0+(x1-x0)*(i+1)/n,z0,z1]:[x0,x1,z0+(z1-z0)*i/n,z0+(z1-z0)*(i+1)/n]);}}
 if(!pieces.length)return;const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),scene.material('#cfc6b2'),pieces.length),m=new T.Object3D();
 pieces.forEach(([x0,x1,z0,z1],i)=>{const x=(x0+x1)/2,z=(z0+z1)/2,y=(w.terrainHeight?w.terrainHeight(x,z):2.5)+.03;m.position.set(x,y,z);m.scale.set(x1-x0,.06,z1-z0);m.updateMatrix();mesh.setMatrixAt(i,m.matrix);});
 mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere?.();mesh.receiveShadow=true;mesh.castShadow=false;mesh.name='walkways';mesh.matrixAutoUpdate=false;scene.environment.add(mesh);scene.walkways={mesh,count:pieces.length,doors:doors.length,gaps:gaps.size};}
function renderFacilities(scene,b){const T=scene.T;try{renderWalkways(scene);}catch(error){scene.walkwaysError=String(error&&error.message||error);}for(const s of scene.world.facilitySurfaces||[]){if(Recreation?.owns(s.id))continue;const vertices=[],indices=[];for(let i=0;i<s.points.length;i++){const p=s.points[i],a=s.points[Math.max(0,i-1)],c=s.points[Math.min(s.points.length-1,i+1)],dx=c.x-a.x,dz=c.z-a.z,len=Math.hypot(dx,dz)||1;for(const side of[-1,1]){const v=side*s.width/2,x=p.x-dz/len*v,z=p.z+dx/len*v,y=p.y+(p.bank||0)*v;vertices.push(x,y,z,x,s.terrainSupport?Math.min(2.45,y-.22):y-.22,z);}}for(let i=1;i<s.points.length;i++){const a=(i-1)*4,c=i*4;indices.push(a,a+2,c+2,a,c+2,c,a,c,c+1,a,c+1,a+1,a+2,a+3,c+3,a+2,c+3,c+2,a+1,c+1,c+3,a+1,c+3,a+3);}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();const mesh=new T.Mesh(geometry,scene.material(s.color));mesh.receiveShadow=true;mesh.castShadow=!s.terrainSupport;mesh.name=s.id;scene.environment.add(mesh);}for(const p of scene.world.facilityParts||[]){if(p.id.startsWith('pit-shelter-')&&globalThis.CityArchitectureModels)continue;if(Recreation?.owns(p.id))continue;scene.box(b,p.color,p.x,p.y,p.z,p.w,p.h,p.d);}globalThis.CityArchitectureModels?.buildShelter(Recreation?.movedScene?Recreation.movedScene(scene):scene,b);Recreation?.render?.(scene,b);}

function marker(world,item){const s=world.serviceById?.[typeof item==='string'?item:item.id]||item;if(!s)return null;return{id:s.id,name:s.name,type:s.type,x:s.x,z:s.z,entrance:{...(s.entrance||s.approach||s)},approach:{...(s.approach||s.entrance||s)},interaction:s.interaction?{...s.interaction}:null};}
function markers(world){return[...world.services.map(s=>marker(world,s)),...world.facilities.filter(f=>!world.services.some(s=>s.id===f.id)).map(f=>marker(world,f)),...world.parks.map(p=>marker(world,{...p,type:'park',entrance:{x:p.x,z:p.z+p.d/2},approach:{x:p.x,z:p.z+p.d/2}}))];}
/* V7.0: where the three places that moved to the front row stood in layout 5 */
const layout5Services={'eat-moonbeans':{x:-125,z:333},'eat-dippin-donuts':{x:-305,z:-444},'six-seven-4':{x:-380,z:557}};
/* V7.2: Platdo Luxury is the one place that moved on its own account in layout 8 (everything else follows the rule in compact.js) */
const layout7Services={'clothing-luxury':{x:45,z:640}};
/* V7.5: where the food places and 6-7s that moved to the beach front stood in layout 10 */
const layout10Services={diner:{x:-112,z:299},'eat-big-micks':{x:-335,z:305},'eat-captain-clucks':{x:-5,z:305},'eat-pizza-shack':{x:25,z:132},'eat-taco-chime':{x:175,z:445},'eat-burger-duke':{x:-518,z:305},'eat-mandys':{x:-230,z:132},'eat-chick-phil-b':{x:137,z:445},'eat-tubeway':{x:-163,z:445},'eat-chilipot':{x:110,z:-869},'eat-five-pals':{x:62,z:132},'eat-shake-shed':{x:880,z:305},'eat-braising-waynes':{x:-207,z:-153},'dine-ember-oak':{x:330,z:302},'dine-nonna-rosa':{x:218,z:442},'six-seven-1':{x:-200,z:449},'six-seven-2':{x:-200,z:136},'six-seven-3':{x:-560,z:306},'six-seven-5':{x:990,z:35}};
/* V7.8: the seven places that moved in among the houses, where they stood in V7.7 (layout 11) */
const V77_MOVED=[['clothing-drip',-550,48],['eat-mandys',-400,695],['six-seven-3',-582,696],['eat-five-pals',-132,695],['six-seven-2',-106,696],['eat-tubeway',150,695],['eat-shake-shed',-478,695]];
/* V8.3: Larkspan's places, where they stood in layouts 4 to 13 (the Shake Shed only in 12 and 13): id, x, z, first layout */
const V82_MOVED=[['clothing-oddball',470,299,4],['safehouse-2',610,299,4],['garage-2',750,294,4],['eat-shake-shed',750,440,12]];
function migrateProfile(profile,world){if(!profile||!profile.world)return{changed:false};const from=profile.world.layoutVersion||1;if(from>=VERSION)return{changed:false,from,to:VERSION};const sn=profile.snapshot,log=[];let berth=0;
 const resetMotion=e=>{for(const k of['vx','vy','vz','pitch','roll'])if(k in e)e[k]=0;};
 const shift=(e,dx,dz)=>{const oldY=e.y;e.x+=dx;e.z+=dz;if(Number.isFinite(e.y))e.y=world.groundHeight(e.x,e.z)+.15;const dy=e.y-oldY;for(const rig of[e.physical,e.ragdoll])for(const p of Object.values(rig?.points||{})){p.x+=dx;p.z+=dz;p.y+=dy;for(const k of['vx','vy','vz'])p[k]=0;}if(e.lastSafe){e.lastSafe.x+=dx;e.lastSafe.z+=dz;e.lastSafe.y=world.groundHeight(e.lastSafe.x,e.lastSafe.z)+.1;}resetMotion(e);};
 if(sn){const entities=[sn.player,...(sn.vehicles||[]),...(sn.npcs||[]),...(sn.drops||[])].filter(Boolean);for(const e of entities){let moved=false;for(const[id,old]of Object.entries({...(from<3?{...legacyServices,marina:layout3Services.marina}:from<4?layout3Services:{}),...(from<6?layout5Services:{}),...layout7Services})){const s=world.serviceById[id];if(!s)continue;const associated=e.interior===id||e.interiorId===id||e.serviceId===id||e.service===id||e.home===id;const inside=Math.abs(e.x-old.x)<s.w/2+6&&Math.abs(e.z-old.z)<s.d/2+6;if(associated||inside){shift(e,s.x-old.x,s.z-old.z);log.push(e.id||'player');moved=true;break;}}
 /* V7.0: something stood where one of the three buildings is now: out onto the pavement in front of it */
 if(!moved)for(const id of[...(from<6?Object.keys(layout5Services):[]),'clothing-luxury']){const s=world.serviceById[id];if(s&&e.interior!==id&&e.interiorId!==id&&Math.abs(e.x-s.x)<s.w/2+2&&Math.abs(e.z-s.z)<s.d/2+2){shift(e,0,s.z+s.d/2+5-e.z);log.push(e.id||'player');moved=true;break;}}
 if(!moved&&from<3&&e.x>930&&e.x<1500&&e.z>-850&&e.z<700&&(e.category==='plane'||e.category==='heli')){shift(e,-2530,510);moved=true;}
 /* V5.8: the inlet is land now. A boat left on it goes to a berth at the new marina; anything left in the air where a bridge stood is put on the ground. */
 /* V6.0: whatever was left at the old stunt area goes with it */
 if(!moved&&from<5&&e.x>900&&e.x<1535&&e.z>-200&&e.z<300&&!e.interior&&!e.interiorId){shift(e,STUNT.x,STUNT.z);log.push(e.id||'player');moved=true;}
 /* V7.1: the sea is nearer the road: whatever stood on sand that is now under water is put back on the beach */
 if(!moved&&from<7&&!['boat','plane','heli'].includes(e.category)&&e.z>770&&e.x>-1000&&e.x<400&&world.terrainHeight(e.x,e.z)<.3){shift(e,0,792-e.z);log.push(e.id||'player');moved=true;}
 /* V7.2: the map is smaller. Whatever was not moved above goes where its spot went, at the same height above the same ground. */
 if(!moved&&from<8){const dz=F11(e.x,e.z)-e.z;if(dz){e.z+=dz;for(const rig of[e.physical,e.ragdoll])for(const p of Object.values(rig?.points||{}))p.z+=dz;if(e.lastSafe)e.lastSafe.z+=dz;log.push(e.id||'player');}}
 /* V7.4: the marina moved to the west inlet. A boat left at the old piers, or on what is land now, goes to a berth there. */
 if(!moved&&e.category==='boat'&&(world.terrainHeight(e.x,e.z)>-.5||from<10&&e.x>470&&e.x<650&&e.z>890&&e.z<1000)){const b=BERTHS[berth++%BERTHS.length];e.x=b.x;e.z=b.z;e.y=0;e.yaw=b.yaw;resetMotion(e);log.push(e.id||'player');moved=true;}
 if(!moved&&e.x>250&&e.x<970&&e.z>-680&&e.z<900&&e.category!=='plane'&&e.category!=='heli'&&e.category!=='boat'&&Number.isFinite(e.y)&&(e.y>world.groundHeight(e.x,e.z)+1.5||e.y<world.groundHeight(e.x,e.z)-.3)){/* in the air where a bridge was, or under what is now ground */e.y=world.groundHeight(e.x,e.z)+.2;resetMotion(e);}
 // Only obsolete ground positions are relocated. Boats stay afloat and airborne craft keep their state.
 if(!moved&&e.y<world.groundHeight(e.x,e.z)-3&&!(e.category==='boat')){e.y=world.groundHeight(e.x,e.z)+.2;resetMotion(e);}if(!Number.isFinite(e.x)||!Number.isFinite(e.z)){Object.assign(e,world.spawn);resetMotion(e);}
 /* V7.5: the food places and 6-7s moved to the beach front. Whoever was in one of them, or belongs to it, goes with it (asked here, after the rule above, so that the place is asked in today's positions whatever the age of the save); whatever stood where one of them or its car park is now goes to the paved walk in front. */
 if(from<11){let went=false;for(const[id,old]of Object.entries(layout10Services)){const s=world.serviceById[id];if(!s)continue;const belongs=e.interior===id||e.interiorId===id||e.serviceId===id||e.service===id||e.home===id;if(belongs||Math.abs(e.x-old.x)<s.w/2+1&&Math.abs(e.z-old.z)<s.d/2+1&&!(e.y>s.y+s.h+3)){shift(e,s.x-old.x,s.z-old.z);log.push(e.id||'player');went=true;break;}}
  if(!went&&e.category!=='boat'&&!(e.y>12))for(const id of Object.keys(layout10Services)){const s=world.serviceById[id];if(s&&e.interior!==s.id&&e.interiorId!==s.id&&e.x>s.x-s.w/2-1&&e.x<s.x+s.w/2+1&&e.z>668.8&&e.z<s.z+s.d/2+1){shift(e,0,708-e.z);log.push(e.id||'player');break;}}}
 /* V7.4: whatever stood where the inlet is now is put on its east bank */
 if(from<10&&e.category!=='boat'&&e.x>-830&&e.x<-680&&e.z>500&&e.z<825&&!(e.y>6)&&world.terrainHeight(e.x,e.z)<.4){shift(e,-655-e.x,0);log.push(e.id||'player');}
 /* V7.3: something stood where one of the new buildings is now: out to the nearer side of it, the other side if that one is not clear */
 if(from<11&&!e.interior&&!e.interiorId&&e.category!=='boat'){const b=world.buildings.find(b=>b.infill&&Math.abs(e.x-b.x)<b.w/2+1.2&&Math.abs(e.z-b.z)<b.d/2+1.2&&!(e.y>b.y+b.h+3));if(b){const south=b.z+b.d/2+4.5,north=b.z-b.d/2-4.5,first=Math.abs(e.z-south)<Math.abs(e.z-north)?south:north,second=first===south?north:south,clear=z=>world.capsuleClear({x:e.x,y:world.groundHeight(e.x,z)+.15,z},1.1,1.8);shift(e,0,(clear(first)||!clear(second)?first:second)-e.z);log.push(e.id||'player');}}
 /* V7.8: the map is thinner and seven places moved in among the houses. Whoever was in one of them, or belongs to it, goes with it (for the food places and 6-7s only from a V7.5 to V7.7 save: from an older one they were taken there above). Everything else goes where its spot went; whatever stood in the two rows of blocks that were taken out goes to Exchange Avenue, the city's north edge now, and whatever stands where one of the seven or its car park is now goes out to the street in front. */
 /* V8.0: a save from V7.8 or V7.9 (layout 12): what stood north of Exchange Avenue goes back where it was in layout 11 */
 if(from===12&&Compact?.G12inv&&!(e.x<-900&&e.z>-300)&&Number.isFinite(e.z)){const z=Compact.G12inv(e.z);if(z!==e.z&&z<50000){const dz=z-e.z;e.z=z;for(const rig of[e.physical,e.ragdoll])for(const p of Object.values(rig?.points||{}))p.z+=dz;if(e.lastSafe)e.lastSafe.z+=dz;log.push(e.id||'player');}}
 if(from<12){let went=moved;const isVehicle=(sn.vehicles||[]).includes(e);
   if(!went)for(const[id,ox,oz]of V77_MOVED){if(from<11&&id!=='clothing-drip')continue;const s=world.serviceById[id];if(!s)continue;const belongs=e.interior===id||e.interiorId===id||e.serviceId===id||e.service===id||e.home===id;if(belongs||Math.abs(e.x-ox)<s.w/2+1&&Math.abs(e.z-oz)<s.d/2+1&&!(e.y>s.y+s.h+3)){shift(e,s.x-ox,s.z-oz);log.push(e.id||'player');went=true;break;}}
   if(!went&&Compact?.G&&!(e.x<-900&&e.z>-300)&&Number.isFinite(e.z)){const z=Compact.G(e.z);
    if(Compact.isVoid(z)){const flying=['plane','heli'].includes(e.category)&&e.y>world.groundHeight(e.x,e.z)+3;
     if(flying){e.z=Compact.EDGE+10;resetMotion(e);}
     else{let to=Compact.EDGE+(isVehicle?4:10.5);if(world.capsuleClear&&!world.capsuleClear({x:e.x,y:world.groundHeight(e.x,to)+.15,z:to},1.1,1.8))to=Compact.EDGE-(isVehicle?4:10.5);shift(e,0,to-e.z);}
     log.push(e.id||'player');went=true;}
    else if(z!==e.z){const dz=z-e.z;e.z=z;for(const rig of[e.physical,e.ragdoll])for(const p of Object.values(rig?.points||{}))p.z+=dz;if(e.lastSafe)e.lastSafe.z+=dz;log.push(e.id||'player');}}
   if(!went)for(const[id]of V77_MOVED){const s=world.serviceById[id];if(!s||e.interior===id||e.interiorId===id)continue;const lot=(world.parkingLots||[]).find(l=>l.place===id),zs=[s.z-s.d/2,s.z+s.d/2,...(lot?[lot.z0,lot.z1]:[])],z0=Math.min(...zs),z1=Math.max(...zs);
    if(e.x>s.x-s.w/2-1&&e.x<s.x+s.w/2+1&&e.z>z0-1&&e.z<z1+1&&!(e.y>s.y+s.h+3)){const to=lot?lot.z0+(lot.dir||-1)*2.2:s.z+s.d/2+3;shift(e,0,to-e.z);log.push(e.id||'player');break;}}}
 /* V8.0: the island is narrower. Whatever was at the old airport goes to the new one (aircraft to their places on the apron, after this loop; anything else to the hangar door), whatever was at the stunt park moves east with it, and whatever now stands in the sea (not a boat, not flying) goes home. */
 if(from<13&&Number.isFinite(e.x)&&Number.isFinite(e.z)){const atAir=e.x<-900&&e.z>-300&&e.z<900,atPark=e.x>-1330&&e.x<-690&&e.z<-1030&&e.z>-1260;
  if(atAir&&['plane','heli'].includes(e.category)){e.airMove=true;log.push(e.id||'player');}
  else if(atAir&&e.category!=='boat'&&!e.interior&&!e.interiorId){shift(e,-170-e.x,-1345-e.z);log.push(e.id||'player');}
  else if(atPark){shift(e,410,-318);log.push(e.id||'player');}
  else if(e.category!=='boat'&&!e.interior&&!e.interiorId&&/* (V8.3: Larkspan's people go with its places, below) */!V82_MOVED.some(([id,ox,oz])=>e.interior===id||e.interiorId===id||e.serviceId===id||e.service===id||e.home===id||Math.hypot(e.x-ox,e.z-oz)<30)&&world.terrainHeight(e.x,e.z)<-.3&&!(e.y>Math.max(0,world.groundHeight(e.x,e.z))+6)){shift(e,world.spawn.x-e.x,world.spawn.z-e.z);log.push(e.id||'player');}}
 /* V8.3: Larkspan is gone and its places stand in the city. Whoever was in one of them, or belongs to it, goes with it; whatever was at the V8.0 airport moves with it (aircraft to the apron, after this loop); whatever stands where the sea is now (not a boat, not flying) goes home. */
 if(from<14&&Number.isFinite(e.x)&&Number.isFinite(e.z)){let went=false;
  if(!moved)for(const[id,ox,oz,since]of V82_MOVED){if(from<since)continue;const s=world.serviceById[id];if(!s)continue;const belongs=e.interior===id||e.interiorId===id||e.serviceId===id||e.service===id||e.home===id;if(belongs||Math.abs(e.x-ox)<s.w/2+1&&Math.abs(e.z-oz)<s.d/2+1&&!(e.y>s.y+s.h+3)){shift(e,s.x-ox,s.z-oz);log.push(e.id||'player');went=true;break;}}
  if(!went&&from===13&&Math.hypot(e.x+94,e.z+1389)<70&&!['plane','heli','boat'].includes(e.category)&&!e.interior&&!e.interiorId){shift(e,-170-e.x,-1345-e.z);log.push(e.id||'player');went=true;}
  if(!went&&from===13&&e.x>-300&&e.x<720&&e.z<-1240&&e.z>-1720){if(['plane','heli'].includes(e.category))e.airMove=true;else if(e.category!=='boat')shift(e,-150,-25);log.push(e.id||'player');went=true;}
  if(!went&&e.category!=='boat'&&!e.interior&&!e.interiorId&&(Compact?.isCut?.(e.x,e.z)||world.terrainHeight(e.x,e.z)<-.3)&&!(e.y>Math.max(0,world.groundHeight(e.x,e.z))+6)){shift(e,world.spawn.x-e.x,world.spawn.z-e.z);log.push(e.id||'player');}}
 for(const k of['route','walkRoute'])if(Array.isArray(e[k]))e[k]=[];if(e.pursuitPath)e.pursuitPath=null;
 }for(const e of [sn.player,...(sn.npcs||[])].filter(Boolean)){const vehicle=e.vehicleId&&(sn.vehicles||[]).find(v=>v.id===e.vehicleId);if(vehicle){e.x=vehicle.x;e.y=vehicle.y+1;e.z=vehicle.z;}}sn.projectiles=[];sn.pendingReports=[];if(sn.mission){sn.mission.previousPosition={...sn.player};if(sn.mission.gatePrevious)sn.mission.gatePrevious={...sn.player};const checkpoint=sn.mission.checkpoint;if(checkpoint?.profile&&checkpoint.snapshot){checkpoint.profile.snapshot=checkpoint.snapshot;migrateProfile(checkpoint.profile,world);checkpoint.snapshot=checkpoint.profile.snapshot;checkpoint.profile.snapshot=null;}}if(sn.player&&!sn.player.vehicleId){sn.player.pitch=0;sn.player.roll=0;}}
 /* V7.5: the loose land vehicles that stood about the map are taken away: every car that was never broken into and every bike, unless someone is on it or it stands within 40 m of the player. Owned vehicles, boats and aircraft are not touched. */
 if(from<11&&sn&&Array.isArray(sn.vehicles)&&sn.player){sn.vehicles=sn.vehicles.filter(v=>!(/^world-/.test(String(v.id))&&!['boat','plane','heli'].includes(v.category)&&!v.unlocked&&!v.owned&&!(v.seatOccupants||[]).some(Boolean)&&sn.player.vehicleId!==v.id&&Math.hypot(v.x-sn.player.x,v.z-sn.player.z)>40));}
 /* V7.8: the parked cars of the car parks that moved and that nobody touched are made again at the new car parks */
  if(from<12&&sn&&Array.isArray(sn.vehicles)){const gone=new Set(V77_MOVED.map(m=>m[0]));sn.vehicles=sn.vehicles.filter(v=>!(typeof v.id==='string'&&v.id.startsWith('lot-')&&gone.has(v.id.slice(4).replace(/-b?\d+$/,''))&&!v.unlocked&&!v.owned&&!(v.seatOccupants||[]).some(Boolean)&&sn.player?.vehicleId!==v.id));}
 /* V8.3: the Shake Shed's old car park is gone: its parked cars that nobody touched are made again at the new one */
 if(from>=12&&from<14&&sn&&Array.isArray(sn.vehicles)){sn.vehicles=sn.vehicles.filter(v=>!(typeof v.id==='string'&&v.id.startsWith('lot-eat-shake-shed-')&&!v.unlocked&&!v.owned&&!(v.seatOccupants||[]).some(Boolean)&&sn.player?.vehicleId!==v.id));}
 /* V8.0: the aircraft that were at the old airport, to their places on the new apron (V8.3: also those of the V8.0 airport) */
 if(from<14&&sn&&Array.isArray(sn.vehicles)){let pl=0,he=0;for(const v of sn.vehicles){if(!v.airMove)continue;delete v.airMove;const p=airSpot(v.category,v.category==='plane'?pl++:he++);v.x=p.x;v.z=p.z;v.y=world.groundHeight(p.x,p.z)+.3;v.yaw=p.yaw;resetMotion(v);for(const rig of[v.physical,v.ragdoll])if(rig)rig.points={};}}
 /* V8.7: staff go with their place */if(from<15&&sn)for(const n of sn.npcs||[]){const s=n.service&&world.serviceById?.[n.service];if(!s||!s.interaction)continue;const at=s.staff||{x:s.interaction.x+1.5,y:s.y,z:s.interaction.z};if(Math.hypot(n.x-at.x,n.z-at.z)>Math.max(s.w||20,s.d||20)){Object.assign(n,{x:at.x,y:at.y??s.y,z:at.z,vx:0,vy:0,vz:0});log.push(n.id);}}
 /* V8.7 */if(from>=13&&from<15&&sn&&Compact?.GL){for(const e of[sn.player,...(sn.vehicles||[]),...(sn.npcs||[]),...(sn.drops||[])].filter(Boolean)){if(!Number.isFinite(e.z)||e.z>=Compact.ROW_S)continue;const z=e.z>=Compact.ROW_N?Compact.ROW_S-11:e.z+Compact.ROW;shift(e,0,z-e.z);log.push(e.id||'player');}}
 profile.world.layoutVersion=VERSION;profile.world.layoutMigration={from,to:VERSION,relocated:log.length};return{changed:true,from,to:VERSION,relocated:log};}
/* V8.0: on the apron north of Northhaven, noses to the taxiway; the helicopters on and beside the pad by the hangar */
function airSpot(category,i){return category==='plane'?{x:-40+i*55,z:GLv(-1420),yaw:Math.PI}:{x:470,z:GLv(-1420-i*45),yaw:Math.PI};}
function relocateInitialVehicles(sim){let plane=0,heli=0;for(const v of sim.vehicles||[]){if(v.category==='plane'||v.category==='heli'){const p=airSpot(v.category,v.category==='plane'?plane++:heli++);v.x=p.x;v.z=p.z;v.y=2.8;v.yaw=p.yaw;}}}
return{inland,INLAND,VERSION,/* V9.1 */hillDressing,/* V7.5 */frontRow,lots:()=>LOTS,FRONT,coastline,districts,parks,facilities,serviceMoves,legacyServices,terrain,shoreline,configure,addRoads,moveServices,decorateBuildings,decorateProps,protectedParcel,districtAt,installFacilities,facilityHeight,renderFacilities,renderAirport,runwayPoint,runwayCoordinates,onRunway,markers,marker,migrateProfile,relocateInitialVehicles,/* V5.9: the water level of a hill pool at a spot, or null */poolAt:(x,z)=>Hills&&VERSION<14?Hills.poolAt(x,z):null};
});

