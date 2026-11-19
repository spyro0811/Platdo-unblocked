
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
const VERSION=7,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const coastline=[[-1740,-350],[-1750,-980],[-1600,-1400],[-1300,-1760],[-700,-1900],[-200,-1840],[300,-1910],[850,-1790],[1200,-1500],[1460,-1100],[1630,-550],[1650,200],[1500,760],[1200,950],/* V5.8: the inlet that cut north from here is land now */[740,925],/* V7.1: the sea comes closer to the road along the beach */[330,862],[150,828],[-200,842],[-600,826],[-800,836],[-950,850],[-1085,690],[-1160,690],[-1260,730],[-1650,800],[-1780,350]].map(([x,z])=>({x,z}));
const districts=[
 {id:'old-quay',name:'Old Quay',x:-170,z:155,color:'#bc7958',style:'brick',landmark:'Lantern Court'},
 {id:'glassline',name:'Glassline',x:90,z:-160,color:'#74a6b5',style:'tower',landmark:'Meridian Exchange'},
 {id:'palmstrand',name:'Palmstrand',x:90,z:640,color:'#d5b887',style:'coast',landmark:'Coast Boulevard'},
 {id:'redbrick-heights',name:'Redbrick Heights',x:-455,z:-170,color:'#ac6d61',style:'townhouse',landmark:'Redfern Gardens'},
 {id:'ironworks',name:'Ironworks',x:-120,z:465,color:'#8c9797',style:'industrial',landmark:'Foundry Cranes'},
 {id:'verdant-hills',name:'Verdant Range',x:-540,z:-850,color:'#66816c',style:'hill',landmark:'Lookout Relay'},
 {id:'northpoint',name:'Northpoint Airport',x:-1320,z:310,color:'#819da2',style:'airport',landmark:'Northpoint 14/32'},
 {id:'northhaven',name:'Northhaven',x:-100,z:-1430,color:'#9b8a68',style:'townhouse',landmark:'Northhaven Green'},
 {id:'east-recreation',name:'Eastbank',x:1260,z:90,color:'#c39158',style:'coast',landmark:'Eastbank Field'},
 /* V5.8: the town on the land that filled the inlet */
 {id:'larkspan',name:'Larkspan',x:610,z:120,color:'#b79a6a',style:'townhouse',landmark:'Larkspan Green'},
 /* V6.0: the stunt park behind the west hill */
 {id:'stunt-park',name:'Northridge Stunt Park',x:-1010,z:-1480,color:'#c39158',style:'coast',landmark:'Northridge Mega Ramp'}];
const serviceMoves={
 'clothing-luxury':{x:45,z:640},'clothing-oddball':{x:470,z:150},
 'safehouse-2':{x:610,z:150},'garage-2':{x:750,z:145},marina:{x:575,z:850},
 hangar:{x:-1190,z:170}
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
 {id:'larkspan-green',name:'Larkspan Green',x:610,z:270,w:96,d:120}
];
const facilities=[
 {id:'airport-terminal',name:'Northpoint Terminal',type:'terminal',x:-1080,z:300,w:44,d:32,h:9},
 {id:'dirt-track',name:'Northridge Dirt Circuit',type:'track',x:-835,z:-1425,entrance:{x:-935,z:-1635},approach:{x:-975,z:-1725}},
 {id:'mega-ramp',name:'Northridge Mega Ramp',type:'ramp',x:-1165,z:-1445,entrance:{x:-1199,z:-1640},approach:{x:-1195,z:-1725}},
 {id:'beach',name:'Seaglass Beach',type:'beach',x:-225,z:795,entrance:{x:-260,z:766},approach:{x:-80,z:720}}
];
/* V5.8: where the fifteen houses of Larkspan stand (two rows to a block, clear of the lanes, the shops and the green) */
const LARKSPAN_HOUSES=[[470,-275],[610,-275],[750,-275],[470,-205],[610,-205],[750,-205],[470,-95],[610,-95],[750,-95],[470,-25],[610,-25],[750,-25],[470,325],[750,325],[610,395]];
const indexes=new WeakMap();
function projection(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(len*len),0,1);return{t,d:Math.hypot(x-a.x-dx*t,z-a.z-dz*t),x:a.x+dx*t,z:a.z+dz*t};}
function shoreline(x,z){let inside=false,edge2=Infinity;for(let i=0,j=coastline.length-1;i<coastline.length;j=i++){const a=coastline[i],b=coastline[j],dx=b.x-a.x,dz=b.z-a.z;if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;const t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),ex=x-a.x-dx*t,ez=z-a.z-dz*t;edge2=Math.min(edge2,ex*ex+ez*ez);}return(inside?1:-1)*Math.sqrt(edge2);}
// V2: shoreline() walks the whole coast outline. It is a true distance, so a 32 m
// square whose centre is more than 25 m + its half-diagonal inland is entirely on the
// flat 2.5 m shelf and needs no outline walk at all. The answer is unchanged.
const inlandSquares=new Map();
function terrain(x,z){const y=landform(x,z);if(Recreation&&x-STUNT.x>1200&&x-STUNT.x<1530){const dirt=Recreation.mound(x,z);if(dirt>y)return dirt;}return y;}
function landform(x,z){const beach=Beach?Beach.weight(x,z):0;if(beach<=0)return inlandTerrain(x,z);const y=Beach.height(x,z,shoreline(x,z));return beach>=1?y:mix(inlandTerrain(x,z),y,beach);}
function inlandTerrain(x,z){const sx=Math.floor(x/32),sz=Math.floor(z/32),square=(sx+8192)*16384+(sz+8192);let inland=inlandSquares.get(square);if(inland===undefined){inland=shoreline(sx*32+16,sz*32+16)>=25+22.7;inlandSquares.set(square,inland);}let y;if(inland)y=2.5;else{const shore=shoreline(x,z);if(shore<=-40)return-14;if(shore<0)return mix(-14,-.2,(shore+40)/40);y=shore<25?mix(-.2,2.5,shore/25):2.5;}
 // A real continuous ridge, with a low saddle for the direct Mountain Link.
 if(z<-440&&z>-1240){const fade=clamp((-z-440)/160,0,1)*clamp((z+1240)/180,0,1),saddle=1-.87*Math.exp(-(((x+260)/130)**2));
 y+=fade*saddle*(106*Math.exp(-(((x+580)/380)**2)-((z+865)/250)**2)+123*Math.exp(-(((x-230)/540)**2)-((z+870)/250)**2));}
 return y;
}
function districtAt(world,x,z){if(x<-900&&z>-300)return world.districts[6];if(z<-1235&&x<-700)return world.districts[10];if(z<-1220)return world.districts[7];if(x>330&&x<960&&z>-520&&z<650)return world.districts[9];if(x>=960&&z>-500)return world.districts[8];if(z<-510)return world.districts[5];if(z>590)return world.districts[2];if(x>170&&z>30)return world.districts[2];if(z>350)return world.districts[4];if(x<-320)return world.districts[3];if(z<40)return world.districts[1];return world.districts[0];}
function configure(world){world.layoutVersion=VERSION;world.extent=2300;world.navigationRevision=VERSION;world.districts=districts.map(d=>({...d}));world.coastline=coastline.map(p=>({...p}));world.parks=parks.map(p=>({...p}));world.facilities=facilities.map(f=>JSON.parse(JSON.stringify(f)));world.facilitySurfaces=[];world.facilityParts=[];world.runway={id:'runway',x:-1435,z:365,width:42,length:840,y:2.58,heading:Math.PI/4};world.airport={apron:{x:-1240,z:300,w:190,d:210,y:2.58},taxiway:{...runwayPoint(world,0,85),w:18,d:720,y:2.58,heading:Math.PI/4},parking:{x:-1055,z:365,w:105,d:56,y:2.58}};world.mapRevision='island-'+VERSION;}
// Local runway coordinates are shared by collision, map, placement and missions.
function runwayPoint(world,along,cross=0){const r=world.runway,s=Math.sin(r.heading||0),c=Math.cos(r.heading||0);return{x:r.x+s*along+c*cross,y:r.y,z:r.z+c*along-s*cross};}
function runwayCoordinates(world,x,z){const r=world.runway,s=Math.sin(r.heading||0),c=Math.cos(r.heading||0),dx=x-r.x,dz=z-r.z;return{along:dx*s+dz*c,cross:dx*c-dz*s};}
function onRunway(world,x,z,margin=0){const p=runwayCoordinates(world,x,z);return Math.abs(p.along)<=world.runway.length/2-margin&&Math.abs(p.cross)<=world.runway.width/2-margin;}
function renderAirport(scene,b){const w=scene.world,r=w.runway,box=(along,cross,width,height,depth,color,y=.025)=>{const p=runwayPoint(w,along,cross);scene.box(b,color,p.x,r.y+y,p.z,width,height,depth,r.heading);};box(0,0,r.width,.12,r.length,'#3c484c',-.06);for(let along=-r.length/2+35;along<r.length/2-25;along+=36)box(along,0,.5,.025,16,'#efe9d7');for(const end of[-1,1]){for(let i=-5;i<=5;i++)box(end*(r.length/2-17),i*2.2,1.3,.025,15,'#e4e4d6');for(let cross of[-r.width/2-2,r.width/2+2])for(let along=-r.length/2+6;along<r.length/2;along+=30){const p=runwayPoint(w,along,cross);scene.box(b,'#d6e5cb',p.x,r.y+.12,p.z,.35,.15,.35,0,'glow');}}for(const side of[-1,1])box(0,side*(r.width/2-1.4),.35,.025,r.length-5,'#ecebdc');const t=w.airport.taxiway;for(let along=-t.d/2+15;along<t.d/2-10;along+=25)box(along,85,.25,.025,17,'#e1c475');}
function addRoads(world,{road}){
 const add=(id,name,anchors,width=14,speed=16)=>{const pts=[];for(let k=1;k<anchors.length;k++){const a=anchors[k-1],b=anchors[k],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/30));if(!pts.length)pts.push([a[0],a[1],a[2]??terrain(a[0],a[1])+.06]);for(let j=1;j<=n;j++){const t=j/n,x=mix(a[0],b[0],t),z=mix(a[1],b[1],t);pts.push([x,z,a[2]!=null&&b[2]!=null?mix(a[2],b[2],t):terrain(x,z)+.06]);}}const before=world.roads.length;road(name,pts,width,speed,'ground','island-road',pts.slice(1).map((_,i)=>id+':'+i));for(const r of world.roads.slice(before))r.pathId=id;world.roadPaths.push({id,name,kind:'island-road',width,sidewalkWidth:2.8,points:pts.map(([x,z,y])=>({x,y,z})),roadIds:world.roads.slice(before).map(r=>r.id)});};
 // The existing city intersections remain stable; the outer network joins them explicitly.
 for(const r of world.roads){if(r.name==='Northgate Avenue')r.name='Northern City Bypass';if(r.name==='Quay Boulevard')r.name='City Avenue';if(r.name==='Northpoint Service Road')r.name='Eastern Coastal Road';if(r.name==='Hangar Access')r.name='Eastbank Road';if(r.name==='Recreation Arrival')r.name='Eastbank Lane';}
 add('coast-boulevard','Coast Boulevard',[[-620,580],[-620,720],[-440,720],[-260,720],[-80,720],[100,720],[260,720],[260,580]],/* V7.1: a two-lane road */12,15);
 add('beach-avenue','Beach Avenue',[[-80,580],[-80,720]],14,12);
 add('airport-road','Airport Road',[[-620,360],[-820,360],[-960,400],[-1055,400],[-1190,400]],16,19);
 add('airport-forecourt','Airport Forecourt',[[-1190,400],[-1190,250],[-1040,250],[-1040,400]],12,8);
 add('mountain-link','Mountain Link',[[-260,-420],[-260,-600],[-260,-800],[-260,-1000],[-260,-1220],[-260,-1370],[-260,-1540]],16,18);
 add('scenic-pass','Scenic Pass',[[-665,-950],[-820,-1040],[-730,-1120],[-900,-1200],[-710,-1280],[-620,-1370],[-620,-1540]],12,11);
 add('northhaven-main','Northhaven Main Street',[[-620,-1370],[-440,-1370],[-260,-1370],[-80,-1370],[100,-1370],[330,-1370],[500,-1370]],16,13);
 add('northhaven-north','Northhaven Crescent',[[-620,-1540],[-440,-1540],[-260,-1540],[-80,-1540],[100,-1540],[330,-1540],[500,-1540],[500,-1370]],14,11);
 for(const x of[-440,-80,330])add('town-cross-'+x,'Northhaven Lane',[[x,-1370],[x,-1540]],12,10);
 add('east-coast','Eastern Coastal Road',[[960,-420],[1040,-420],[1040,-650],[1190,-880],[1180,-1110],[980,-1290],[760,-1370],[500,-1370]],16,17);
 /* V6.0: the road to the stunt park, from the north-west corner of Northhaven and along the park's north side (the old Recreation Road at Eastbank is gone) */
 add('stunt-park-road','Stunt Park Road',[[-620,-1540],[-620,-1640],[-700,-1725],[-835,-1725],[-975,-1725],[-1077,-1725],[-1135,-1725],[-1290,-1725]],14,11);
 /* V5.8: the inlet is land. Two ground roads where the bridges were, the parkway between the city and the town,
  * the coast road carried on east, Lantern Street carried on east as the town's main street, and the lanes of
  * Larkspan. Every crossing is an anchor in both roads, so the streets join. */
 add('larkspan-road','Larkspan Road',[[260,-420],[400,-420],[540,-420],[680,-420],[820,-420],[960,-420]],18,17);
 add('foundry-east','Foundry Way',[[260,580],[400,580],[540,580],[680,580],[820,580],[960,580]],18,17);
 add('island-parkway','Island Parkway',[[400,720],[400,580],[400,360],[400,180],[400,-60],[400,-240],[400,-420]],18,19);
 add('coast-east','Coast Boulevard',[[260,720],[400,720],[540,720],[680,720],[820,720],[960,720],[960,580]],12,15);
 add('lantern-east','Lantern Street',[[260,180],[400,180],[540,180],[680,180],[820,180],[960,180]],16,13);
 for(const[x,name]of[[540,'Mill Lane'],[680,'Larkspan High Street'],[820,'Orchard Lane']])add('larkspan-lane-'+x,name,[[x,-420],[x,-240],[x,-60],[x,180],[x,360],[x,580],[x,720]],12,10);
 for(const[z,name]of[[-240,'Cooper Street'],[-60,'Chandler Street'],[360,'Tanner Street']])add('larkspan-cross-'+z,name,[[400,z],[540,z],[680,z],[820,z]],12,10);
 add('marina-road','Marina Road',[[540,720],[540,850]],12,8);
 add('slip-road','Slip Road',[[960,720],[960,900]],12,8);
 /* V5.9: Hillside Drive and Skyline Drive, from the top of Island Parkway */
 if(Hills)Hills.roads(add,terrain);
 /* V7.0: City Avenue carried on south to the coast road, so the main road of the city meets the beach front. Added
  * last, so every road before it keeps its number. */
 add('city-avenue-south','City Avenue',[[-260,580],[-260,720]],16,14);
 world.regionalRoutes=['mountain-link','scenic-pass','east-coast'];
}
function moveServices(list){for(const s of list){const p=serviceMoves[s[0]];if(p){s[3]=p.x;s[4]=p.z;}}const f=facilities[0];list.push([f.id,f.name,f.type,f.x,f.z,f.w,f.d,f.h]);return list;}
function decorateBuildings(world,terrainHeight){let i=0;for(const x of[-560,-490,-350,-285,-190,40,180,250,390,450])for(const z of[-1410,-1496]){if(world.services.some(s=>Math.abs(x-s.x)<(s.w+30)/2+8&&Math.abs(z-s.z)<(s.d+26)/2+8)||parks.some(p=>Math.abs(x-p.x)<p.w/2+20&&Math.abs(z-p.z)<p.d/2+20))continue;world.buildings.push({id:'northhaven-house-'+i++,x,y:terrainHeight(x,z),z,w:26,d:24,h:7+(i%3)*1.8,style:'townhouse',district:'northhaven',tint:i%5,roof:i%3,bays:4,interior:false});}
 /* V5.8: the fifteen houses of Larkspan, two rows to a block, clear of the lanes, the shops and the green */
 let k=0;for(const[x,z]of LARKSPAN_HOUSES){world.buildings.push({id:'larkspan-house-'+k,x,y:terrainHeight(x,z),z,w:26,d:24,h:7+(k%3)*1.8,style:'townhouse',district:'larkspan',tint:k%5,roof:k%3,bays:4,interior:false});k++;}}
function protectedParcel(x,z,w,d){return parks.some(p=>Math.abs(x-p.x)<(p.w+w)/2&&Math.abs(z-p.z)<(p.d+d)/2);}
function decorateProps(world,addProp){for(const park of parks){for(const sx of[-1,1])for(const sz of[-1,1]){addProp('tree',park.x+sx*(park.w/2-9),park.z+sz*(park.d/2-9),7,7,10);addProp('bench',park.x+sx*7,park.z+sz*(park.d/2-13),3,1.2,1);} }/* V4: the even row of palms and umbrellas is gone; the beach module places its own. */for(const z of[-1480,-1410])for(const x of[-580,-320,210,420])addProp('tree',x,z,6,6,9);}
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
 // Airport paths and apron use the exact same dimensions as the map.
 const ap=world.airport.apron,pk=world.airport.parking;part('airport-parking','#777f80',pk.x,pk.y-.05,pk.z,pk.w,.1,pk.d,false);
 surface('airport-apron',[{x:ap.x,y:ap.y,z:ap.z-ap.d/2},{x:ap.x,y:ap.y,z:ap.z+ap.d/2}],ap.w,'#939b96');
 surface('airport-taxiway',[runwayPoint(world,-360,85),runwayPoint(world,360,85)],18,'#939b96');
 for(const along of[-300,300])surface('airport-taxi-exit-'+along,[runwayPoint(world,along),runwayPoint(world,along,85)],18,'#939b96');
 surface('airport-apron-access',[runwayPoint(world,80,85),{x:ap.x,y:ap.y,z:ap.z}],20,'#939b96');
 if(Beach)Beach.install(world,{box,spanBox,terrain});
 if(Recreation)Recreation.install(world,{surface,part,poly,box});
 /* V5.9: the fifteen mansions on the hill */
 if(Hills)Hills.install(world,{part,surface,terrain});
 /* V5.8: Larkspan's street trees (two by each house) and the lamps along its main street. They are added here,
  * after every numbered prop exists, under names of their own, so no earlier prop changes its number; each gets
  * its trunk or post as a solid here for the same reason. */
 const townProp=(id,kind,x,z,w,h)=>{const y=terrain(x,z),p={id,kind,x,y,z,w,d:w,h,collisionIds:[]};world.props.push(p);p.collisionIds.push((kind==='tree'?box(id+':trunk',x,y,z,.44,h*.48,.44,'wood',{propId:id}):box(id+':post',x,y,z,.19,h,.19,'metal',{propId:id})).id);};
 LARKSPAN_HOUSES.forEach(([x,z],i)=>{townProp('larkspan-tree-'+i+'a','tree',x-20,z+5,5+i%3,8+i*7%4);townProp('larkspan-tree-'+i+'b','tree',x+20,z-6,5+(i+1)%3,8+i*5%4);});
 for(let x=430;x<950;x+=35)if(![540,680,820].some(c=>Math.abs(x-c)<14))townProp('larkspan-light-'+x,'streetlight',x,193,.3,7);
 // Build a compact spatial lookup once. Per-frame ground queries inspect nearby spans only.
 const grid=new Map();for(const s of world.facilitySurfaces)for(let i=1;i<s.points.length;i++){const a=s.points[i-1],b=s.points[i],p={a,b,width:s.width,terrainSupport:s.terrainSupport,id:s.id};const pad=s.width/2+2;for(let ix=Math.floor((Math.min(a.x,b.x)-pad)/64);ix<=Math.floor((Math.max(a.x,b.x)+pad)/64);ix++)for(let iz=Math.floor((Math.min(a.z,b.z)-pad)/64);iz<=Math.floor((Math.max(a.z,b.z)+pad)/64);iz++){const k=(ix+8192)*16384+(iz+8192);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(p);}}indexes.set(world,grid);
}
function facilityHeight(world,x,z,referenceY=Infinity,terrainOnly=false){let h=-Infinity;const cell=indexes.get(world)?.get((Math.floor(x/64)+8192)*16384+(Math.floor(z/64)+8192));if(!cell)return h;for(const s of cell){if(terrainOnly&&!s.terrainSupport)continue;const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,len2=dx*dx+dz*dz,u=((x-s.a.x)*dx+(z-s.a.z)*dz)/(len2||1);if(u<-.002||u>1.002)continue;const p=projection(x,z,s.a,s.b),side=(-(x-s.a.x)*dz+(z-s.a.z)*dx)/Math.sqrt(len2||1),y=mix(s.a.y,s.b.y,p.t)+mix(s.a.bank||0,s.b.bank||0,p.t)*side;if(p.d<=s.width/2&&y<=referenceY+.65)h=Math.max(h,y);}return h;}
function renderFacilities(scene,b){const T=scene.T;for(const s of scene.world.facilitySurfaces||[]){if(Recreation?.owns(s.id))continue;const vertices=[],indices=[];for(let i=0;i<s.points.length;i++){const p=s.points[i],a=s.points[Math.max(0,i-1)],c=s.points[Math.min(s.points.length-1,i+1)],dx=c.x-a.x,dz=c.z-a.z,len=Math.hypot(dx,dz)||1;for(const side of[-1,1]){const v=side*s.width/2,x=p.x-dz/len*v,z=p.z+dx/len*v,y=p.y+(p.bank||0)*v;vertices.push(x,y,z,x,s.terrainSupport?Math.min(2.45,y-.22):y-.22,z);}}for(let i=1;i<s.points.length;i++){const a=(i-1)*4,c=i*4;indices.push(a,a+2,c+2,a,c+2,c,a,c,c+1,a,c+1,a+1,a+2,a+3,c+3,a+2,c+3,c+2,a+1,c+1,c+3,a+1,c+3,a+3);}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();const mesh=new T.Mesh(geometry,scene.material(s.color));mesh.receiveShadow=true;mesh.castShadow=!s.terrainSupport;mesh.name=s.id;scene.environment.add(mesh);}for(const p of scene.world.facilityParts||[]){if(p.id.startsWith('pit-shelter-')&&globalThis.CityArchitectureModels)continue;if(Recreation?.owns(p.id))continue;scene.box(b,p.color,p.x,p.y,p.z,p.w,p.h,p.d);}globalThis.CityArchitectureModels?.buildShelter(Recreation?.movedScene?Recreation.movedScene(scene):scene,b);Recreation?.render?.(scene,b);}

function marker(world,item){const s=world.serviceById?.[typeof item==='string'?item:item.id]||item;if(!s)return null;return{id:s.id,name:s.name,type:s.type,x:s.x,z:s.z,entrance:{...(s.entrance||s.approach||s)},approach:{...(s.approach||s.entrance||s)},interaction:s.interaction?{...s.interaction}:null};}
function markers(world){return[...world.services.map(s=>marker(world,s)),...world.facilities.filter(f=>!world.services.some(s=>s.id===f.id)).map(f=>marker(world,f)),...world.parks.map(p=>marker(world,{...p,type:'park',entrance:{x:p.x,z:p.z+p.d/2},approach:{x:p.x,z:p.z+p.d/2}}))];}
/* V7.0: where the three places that moved to the front row stood in layout 5 */
const layout5Services={'eat-moonbeans':{x:-125,z:333},'eat-dippin-donuts':{x:-305,z:-444},'six-seven-4':{x:-380,z:557}};
function migrateProfile(profile,world){if(!profile||!profile.world)return{changed:false};const from=profile.world.layoutVersion||1;if(from>=VERSION)return{changed:false,from,to:VERSION};const sn=profile.snapshot,log=[];let berth=0;
 const resetMotion=e=>{for(const k of['vx','vy','vz','pitch','roll'])if(k in e)e[k]=0;};
 const shift=(e,dx,dz)=>{const oldY=e.y;e.x+=dx;e.z+=dz;if(Number.isFinite(e.y))e.y=world.groundHeight(e.x,e.z)+.15;const dy=e.y-oldY;for(const rig of[e.physical,e.ragdoll])for(const p of Object.values(rig?.points||{})){p.x+=dx;p.z+=dz;p.y+=dy;for(const k of['vx','vy','vz'])p[k]=0;}if(e.lastSafe){e.lastSafe.x+=dx;e.lastSafe.z+=dz;e.lastSafe.y=world.groundHeight(e.lastSafe.x,e.lastSafe.z)+.1;}resetMotion(e);};
 if(sn){const entities=[sn.player,...(sn.vehicles||[]),...(sn.npcs||[]),...(sn.drops||[])].filter(Boolean);for(const e of entities){let moved=false;for(const[id,old]of Object.entries({...(from<3?{...legacyServices,marina:layout3Services.marina}:from<4?layout3Services:{}),...layout5Services})){const s=world.serviceById[id];if(!s)continue;const associated=e.interior===id||e.interiorId===id||e.serviceId===id||e.service===id||e.home===id;const inside=Math.abs(e.x-old.x)<s.w/2+6&&Math.abs(e.z-old.z)<s.d/2+6;if(associated||inside){shift(e,s.x-old.x,s.z-old.z);log.push(e.id||'player');moved=true;break;}}
 /* V7.0: something stood where one of the three buildings is now: out onto the pavement in front of it */
 if(!moved)for(const id of Object.keys(layout5Services)){const s=world.serviceById[id];if(s&&e.interior!==id&&e.interiorId!==id&&Math.abs(e.x-s.x)<s.w/2+2&&Math.abs(e.z-s.z)<s.d/2+2){shift(e,0,s.z+s.d/2+5-e.z);log.push(e.id||'player');moved=true;break;}}
 if(!moved&&from<3&&e.x>930&&e.x<1500&&e.z>-850&&e.z<700&&(e.category==='plane'||e.category==='heli')){shift(e,-2530,510);moved=true;}
 /* V5.8: the inlet is land now. A boat left on it goes to a berth at the new marina; anything left in the air where a bridge stood is put on the ground. */
 /* V6.0: whatever was left at the old stunt area goes with it */
 if(!moved&&from<5&&e.x>900&&e.x<1535&&e.z>-200&&e.z<300&&!e.interior&&!e.interiorId){shift(e,STUNT.x,STUNT.z);log.push(e.id||'player');moved=true;}
 /* V7.1: the sea is nearer the road: whatever stood on sand that is now under water is put back on the beach */
 if(!moved&&from<7&&!['boat','plane','heli'].includes(e.category)&&e.z>770&&e.x>-1000&&e.x<400&&world.terrainHeight(e.x,e.z)<.3){shift(e,0,792-e.z);log.push(e.id||'player');moved=true;}
 if(!moved&&e.category==='boat'&&world.terrainHeight(e.x,e.z)>-.5){const k=berth++;e.x=[531,549,571,589,611,629,509,491][k%8];e.z=940+Math.floor(k/8)*14;e.y=0;e.yaw=0;resetMotion(e);moved=true;}
 if(!moved&&e.x>250&&e.x<970&&e.z>-680&&e.z<900&&e.category!=='plane'&&e.category!=='heli'&&e.category!=='boat'&&Number.isFinite(e.y)&&(e.y>world.groundHeight(e.x,e.z)+1.5||e.y<world.groundHeight(e.x,e.z)-.3)){/* in the air where a bridge was, or under what is now ground */e.y=world.groundHeight(e.x,e.z)+.2;resetMotion(e);}
 // Only obsolete ground positions are relocated. Boats stay afloat and airborne craft keep their state.
 if(!moved&&e.y<world.groundHeight(e.x,e.z)-3&&!(e.category==='boat')){e.y=world.groundHeight(e.x,e.z)+.2;resetMotion(e);}if(!Number.isFinite(e.x)||!Number.isFinite(e.z)){Object.assign(e,world.spawn);resetMotion(e);}
 for(const k of['route','walkRoute'])if(Array.isArray(e[k]))e[k]=[];if(e.pursuitPath)e.pursuitPath=null;
 }for(const e of [sn.player,...(sn.npcs||[])].filter(Boolean)){const vehicle=e.vehicleId&&(sn.vehicles||[]).find(v=>v.id===e.vehicleId);if(vehicle){e.x=vehicle.x;e.y=vehicle.y+1;e.z=vehicle.z;}}sn.projectiles=[];sn.pendingReports=[];if(sn.mission){sn.mission.previousPosition={...sn.player};if(sn.mission.gatePrevious)sn.mission.gatePrevious={...sn.player};const checkpoint=sn.mission.checkpoint;if(checkpoint?.profile&&checkpoint.snapshot){checkpoint.profile.snapshot=checkpoint.snapshot;migrateProfile(checkpoint.profile,world);checkpoint.snapshot=checkpoint.profile.snapshot;checkpoint.profile.snapshot=null;}}if(sn.player&&!sn.player.vehicleId){sn.player.pitch=0;sn.player.roll=0;}}
 profile.world.layoutVersion=VERSION;profile.world.layoutMigration={from,to:VERSION,relocated:log.length};return{changed:true,from,to:VERSION,relocated:log};}
function relocateInitialVehicles(sim){let plane=0,heli=0;for(const v of sim.vehicles||[]){if(v.category==='plane'){v.x=-1290+(plane%2)*55;v.z=300+Math.floor(plane/2)*45;v.y=2.8;v.yaw=0;plane++;}else if(v.category==='heli'){v.x=-1280+heli*40;v.z=405;v.y=2.8;heli++;}}}
return{VERSION,coastline,districts,parks,facilities,serviceMoves,legacyServices,terrain,shoreline,configure,addRoads,moveServices,decorateBuildings,decorateProps,protectedParcel,districtAt,installFacilities,facilityHeight,renderFacilities,renderAirport,runwayPoint,runwayCoordinates,onRunway,markers,marker,migrateProfile,relocateInitialVehicles,/* V5.9: the water level of a hill pool at a spot, or null */poolAt:(x,z)=>Hills?Hills.poolAt(x,z):null};
});

