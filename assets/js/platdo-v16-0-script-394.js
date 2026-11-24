
/* PLATDO City: the homeless shelter, Harborlight House (V10.3, rebuilt in V15.8). Shared by the game and the
 * multiplayer host (the host copy is server/platdo-city/src/shelter.js, the same file).
 * - On the south side of Lantern Street in Old Quay, across the street from the first home, where two look-only brick
 *   blocks stood. A one-storey red brick house on a stone base under a hipped slate roof with a white cupola: tall
 *   white-framed windows with stone sills and keystones, green shutters and flower boxes along the front, stone corner
 *   blocks, white eaves, and a gabled entrance porch on two round columns with the name on its beam.
 * - Inside (a 3 m ceiling): the reception desk facing the door, a waiting area with a sofa, armchairs and a bookcase, a
 *   common room (three dining tables, a kitchen along the east wall, a sofa and television), a dormitory of ten wooden
 *   beds with bedside tables and lamps and a bank of lockers, and washrooms (two vanities, three toilet stalls, two
 *   showers). Cream walls over sage panelling, wooden floors, carpet in the dormitory, tiles in the washrooms.
 * - Outside: the car park on the east side (parked cars come from the parking system), the scooter bays along the
 *   east wall with a rack (the starting scooter waits in the first bay), two benches on the porch, air units and two
 *   trees behind.
 * - Story games and online players start inside at the reception (startPoint), facing the door.
 * This file holds what is solid (world boxes, the same online) and where everything stands: the furniture list uses
 * the apartments' furniture kit (k, t, x, z, r, w, d, h, s) and city-shelter-look.js draws all of it in the game.
 * Where nothing draws it (the host) the solid boxes are still listed as coloured parts, as before. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityShelter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const ID='shelter',NAME='Harborlight House',SUB='Community shelter · Beds · Meals · Showers';
// local coordinates: X across the front (east +) from the middle, Z from the front face toward the back (south +)
const CX=-198,ZF=529,HW=13,D=22,G=2.5,FL=2.8,CEIL=5.8,ROOF=6.02,TOP=7.0,WT=.3;
// V15.8: the hipped roof: eaves 0.58 m out at 7.12 m, rising 0.33 m per metre to a short ridge along the middle
const EAVE=7.12,OVER=.58,SLOPE=.33,RIDGE=+(EAVE+SLOPE*(D/2+OVER)).toFixed(3),DOOR_HEAD=5.0;
const PLOT={x0:-213,x1:-150,z0:525.9,z1:560};
const LOT={id:'carpark-'+ID,place:ID,x0:-181.6,x1:-152,z0:525.75,z1:556,y:2.58,bayDepth:5.5,dir:-1,padX0:-184.9};
const C={brick:'#93503f',brickDark:'#7a3f33',stone:'#c6bba9',frame:'#eeeae1',cornice:'#d3c9b8',roof:'#e2ded6',part:'#e8e0cc',floor:'#b59b7d',
 looWater:'#a9c3cc',tile:'#cdd5d7',carpet:'#8b97a3',wood:'#8a6446',darkWood:'#5b4230',lightWood:'#d6c9b2',metal:'#5e656a',white:'#f2f0eb',porcelain:'#f6f5f1',
 mattress:'#e7e3da',pillow:'#f8f6f1',sofa:'#566e82',chair:'#4c6a5e',table:'#c7a67b',locker:'#6d8693',green:'#4d7b3b',pot:'#9a6949',
 screen:'#1c2024',fascia:'#2d4e3d',cork:'#b98e5c',paper:'#f4efe2',mirror:'#b7c7cb',stall:'#7c8e95',plant:'#5c8a45',mat:'#3b3f42',
 blankets:['#3f6e9a','#7a9a5a','#b0654a','#6b5a8e','#c49a3a']};
const wx=X=>CX+X,wz=Z=>ZF+Z;
// ---- the plan ------------------------------------------------------------------------------------------------------
const DOOR={a:-1.4,b:1.4,y0:FL-.02,y1:5.2};
const WIN={
 front:[[-9.6,-7.8],[-6.0,-4.2],[4.2,6.0],[7.8,9.6]].map(([a,b])=>({a,b,y0:3.7,y1:5.6,big:true})),
 /* V15.8: one window over each bedside table (they were three, out of step with the beds) */back:[[-1.6,-.6],[1.2,2.2],[4.0,5.0],[6.8,7.8],[9.6,10.6]].map(([a,b])=>({a,b,y0:4.3,y1:5.6})),
 west:[{a:3.2,b:5.0,y0:3.7,y1:5.6,big:true},...[[11.0,12.0],[15.2,16.2],[19.0,20.0]].map(([a,b])=>({a,b,y0:4.95,y1:5.6}))],
 east:[[1.0,2.6],[3.4,5.0],[14.0,15.8],[18.4,20.2]].map(([a,b])=>({a,b,y0:3.7,y1:5.6,big:true}))};
// the inner walls: [key, x0, x1, z0, z1, along, door openings (floor to DOOR_HEAD)]
const PARTS=[['dormWall',-4.07,HW-WT+.05,12.0,12.15,'x',[[-3.6,-2.4],[10.7,11.9]]],['washWall',-4.15,-4.0,9.15,D-WT+.05,'z',[[13.0,14.2]]],['washFront',-HW+WT-.05,-4.0,9.0,9.15,'x',[[-6.4,-5.2]]]];
// the beds: back row with the head at the back wall, front row with the head at the dormitory wall
const BEDS=[...[-2.5,.3,3.1,5.9,8.7,11.5].map(x=>({x,z:D-WT-.08-1,r:2})),...[1.5,4.3,7.1,9.9].map(x=>({x,z:12.15+.04+1,r:0}))];
const STALLS=[[-12.7,-11.65],[-11.65,-10.6],[-10.6,-9.55]],SHOWERS=[[16.0,17.3],[17.4,18.7]],LOCKERS={x0:-4.0,x1:-3.48,z0:14.5,z1:21.6,h:1.95};
// ---- the furniture (the apartments' kit: x across, z depth, r 0..3 = front facing +z, +x, -z, -x; y and h from the floor)
const I=(k,t,x,z,r,w,d,h,s=true,extra)=>({k,t,x,z,r,w,d,h,s,...extra});
let itemCache=null;
function items(){
 if(itemCache)return itemCache;const out=[],add=(...a)=>{const it=I(...a);out.push(it);return it;};
 // reception: the desk itself is drawn by the look (city-shelter-look.js); the chair behind it, plants by the door
 add('chair','desk',0,7.3,2,.55,.55,.9);add('plant','door',-2.3,.85,0,.55,.55,1.3);add('plant','door',2.3,.85,0,.55,.55,1.3);
 // the waiting area: a sofa under the west window, two armchairs facing it, a bookcase on the washroom wall
 add('sofa','straight',-12.225,4.1,1,2.4,.95,.8);for(const z of[3.25,4.95])add('armchair','wait',-9.55,z,3,.85,.85,.8);
 add('coffee','wait',-10.85,4.1,1,1.2,.7,.42);add('rug','wait',-10.95,4.1,1,3.6,3.2,.02,false);
 add('side','wait',-12.38,2.45,1,.45,.45,.55);add('lamp','wait',-12.38,2.45,1,.28,.28,.55,false,{y:.55});
 add('bookcase','wait',-10.0,8.8,2,2.4,.38,2.2);add('floorlamp','wait',-12.3,6.4,1,.45,.45,1.75);add('plant','wait',-12.2,.95,0,.6,.6,1.5);
 add('art','wait',-12.68,7.3,1,1.0,.04,.7,false,{y:1.45});add('art','wait',-6.9,.32,0,.9,.04,.65,false,{y:1.5});
 // the common room: three tables of four, the kitchen along the east wall, a sofa facing the television
 for(const[tx,tz]of[[6.2,2.4],[9.4,2.4],[6.2,5.6]]){add('table','rect',tx,tz,0,1.4,.9,.75);for(const u of[-.35,.35]){add('chair','dine',tx+u,tz-.78,0,.48,.5,.86);add('chair','dine',tx+u,tz+.78,2,.48,.5,.86);}}
 add('tall','kitchen',12.37,5.975,3,1.75,.66,2.3);add('counter','kitchen',12.37,9.15,3,4.6,.66,.92);
 add('media','lounge',7.0,11.76,2,2.4,.48,.55);add('tv','lounge',7.0,11.96,2,1.7,.08,1.0,false,{y:1.0});
 add('sofa','straight',7.0,8.95,0,2.6,.95,.8);add('coffee','lounge',7.0,10.3,0,1.1,.6,.42);add('rug','lounge',7.0,9.9,0,3.8,3.0,.02,false);
 add('armchair','lounge',9.95,10.2,3,.85,.85,.8);add('side','lounge',5.3,9.0,0,.45,.45,.55);add('lamp','lounge',5.3,9.0,0,.28,.28,.55,false,{y:.55});
 add('plant','lounge',4.85,11.45,0,.6,.6,1.6);for(const z of[1.6,2.8,4.0])add('plant','divider',4.1,z,0,.36,.36,.9,false,{y:.78});add('art','common',6.9,.32,0,.9,.04,.65,false,{y:1.5});add('art','common',11.2,.32,0,1.0,.04,.7,false,{y:1.5});
 // the dormitory: ten beds, a bedside table and lamp between each two, a runner, a table by the east wall
 BEDS.forEach((b,i)=>{const head=b.r===2?b.z+1:b.z-1,s=b.r===2?1:-1;add('bed','dorm',b.x,b.z,b.r,.95,2.0,.55,true,{c:[[b.x-.53,b.z-1,b.x+.53,b.z+1,0,.45],[b.x-.58,Math.min(head,head-s*.15),b.x+.58,Math.max(head,head-s*.15),0,1.15]],bed:i});});
 for(const x of[-1.1,1.7,4.5,7.3,10.1]){add('nightstand','dorm',x,D-WT-.21,2,.45,.4,.52);add('lamp','dorm',x,D-WT-.21,2,.28,.28,.55,false,{y:.52});}
 for(const x of[2.9,5.7,8.5]){add('nightstand','dorm',x,12.15+.21,0,.45,.4,.52);add('lamp','dorm',x,12.15+.21,0,.28,.28,.55,false,{y:.52});}
 add('table','round',12.1,17.1,0,.75,.75,.75);add('chair','dine',12.1,16.35,0,.48,.5,.86);add('chair','dine',12.1,17.85,2,.48,.5,.86);
 add('art','dorm',12.68,17.1,3,.8,.04,.55,false,{y:1.65});for(const x of[1.5,4.3,7.1,9.9])add('art','dorm',x,12.17,0,.7,.04,.5,false,{y:1.75});
 // the washrooms: two vanities on the west wall, a toilet in each stall (their solid parts are the named pieces below)
 for(const z of[10.95,12.75])add('vanity','wash',-HW+WT+.28,z,1,1.5,.56,.86);
 STALLS.forEach(([a,b])=>add('toilet','wash',(a+b)/2,D-WT-.33,2,.42,.66,.46,false));
 add('plant','wash',-4.65,20.9,0,.5,.5,1.0);
 return itemCache=out;}
// the solid boxes of an item, local [x0,z0,x1,z1,y0,y1] (y from the floor)
function solids(it){if(!it.s)return[];if(it.c)return it.c;const across=it.r%2===1,hw=(across?it.d:it.w)/2,hd=(across?it.w:it.d)/2,y0=it.y||0;return[[it.x-hw,it.z-hd,it.x+hw,it.z+hd,y0,y0+it.h]];}
// ---- the solid pieces ----------------------------------------------------------------------------------------------
let cache=null;
function pieces(){
 if(cache)return cache;const out=[],glass=[],lights=[],signs=[];let n=0;
 // P: a box in local coordinates (x0,x1 across, y0,y1 height, z0,z1 depth); o: what it is, for the look
 const P=(key,c,x0,x1,y0,y1,z0,z1,solid=true,o)=>{out.push({id:ID+':'+key+(key.endsWith('#')?n++:''),c,x0:wx(x0),x1:wx(x1),y0,y1,z0:wz(z0),z1:wz(z1),solid,...o});};
 const Glass=(key,x0,x1,y0,y1,z0,z1,axis,solid=true,o)=>{glass.push({id:ID+':glass-'+key,x0:wx(x0),x1:wx(x1),y0,y1,z0:wz(z0),z1:wz(z1),axis,solid,...o});};
 // a wall along X (front or back) from xa to xb, thickness z0..z1, with openings [{a,b,y0,y1}]
 const wallX=(key,xa,xb,z0,z1,open,color=C.brick)=>{let x=xa;const o={kind:'wall',face:key};open.slice().sort((p,q)=>p.a-q.a).forEach((w,i)=>{if(w.a>x)P(key+'-pier'+i,color,x,w.a,G,TOP,z0,z1,true,o);if(w.y0>G)P(key+'-below'+i,color,w.a,w.b,G,w.y0,z0,z1,true,o);P(key+'-above'+i,color,w.a,w.b,w.y1,TOP,z0,z1,true,o);x=w.b;});if(x<xb)P(key+'-pierEnd',color,x,xb,G,TOP,z0,z1,true,o);};
 const wallZ=(key,za,zb,x0,x1,open,color=C.brick)=>{let z=za;const o={kind:'wall',face:key};open.slice().sort((p,q)=>p.a-q.a).forEach((w,i)=>{if(w.a>z)P(key+'-pier'+i,color,x0,x1,G,TOP,z,w.a,true,o);if(w.y0>G)P(key+'-below'+i,color,x0,x1,G,w.y0,w.a,w.b,true,o);P(key+'-above'+i,color,x0,x1,w.y1,TOP,w.a,w.b,true,o);z=w.b;});if(z<zb)P(key+'-pierEnd',color,x0,x1,G,TOP,z,zb,true,o);};
 // ---- the shell -----------------------------------------------------------------------------------------------------
 P('floor',C.floor,-HW+.05,HW-.05,G,FL,.05,D-.05,true,{kind:'floor'});
 P('roof',C.roof,-HW+.05,HW-.05,CEIL,ROOF,.05,D-.05,true,{kind:'ceiling'});
 wallX('front',-HW,HW,0,WT,[DOOR,...WIN.front]);wallX('back',-HW,HW,D-WT,D,WIN.back);
 wallZ('west',WT,D-WT,-HW,-HW+WT,WIN.west);wallZ('east',WT,D-WT,HW-WT,HW,WIN.east);
 const mid={front:WT/2,back:D-WT/2,west:-HW+WT/2,east:HW-WT/2};
 for(const face of['front','back'])WIN[face].forEach((w,i)=>Glass(face+i,w.a,w.b,w.y0,w.y1,mid[face]-.01,mid[face]+.01,'z',true,{face,win:w}));
 for(const face of['west','east'])WIN[face].forEach((w,i)=>Glass(face+i,mid[face]-.01,mid[face]+.01,w.y0,w.y1,w.a,w.b,'x',true,{face,win:w}));
 P('threshold',C.stone,-1.4,1.4,G,FL+.02,-.04,WT+.04,true,{kind:'threshold'});
 // the stone base (front and back run through the corners, the sides stop inside them)
 P('plinth-f1',C.stone,-HW-.04,-1.55,G,3.1,-.04,.02,true,{kind:'plinth'});P('plinth-f2',C.stone,1.55,HW+.04,G,3.1,-.04,.02,true,{kind:'plinth'});P('plinth-b',C.stone,-HW-.04,HW+.04,G,3.1,D-.02,D+.04,true,{kind:'plinth'});
 P('plinth-w',C.stone,-HW-.04,-HW+.02,G,3.1,.02,D-.02,true,{kind:'plinth'});P('plinth-e',C.stone,HW-.02,HW+.04,G,3.1,.02,D-.02,true,{kind:'plinth'});
 // the roof: rings of solid boxes, each a step up the slope, stand in for the hipped roof (you stand within a hand of it)
 for(let k=0;k<8;k++){const i0=1.4*k,y0=k?EAVE+SLOPE*(1.4*k-.7+OVER):ROOF,y1=EAVE+SLOPE*(1.4*k+.7+OVER);P('roofStep'+k,C.roof,-HW+i0,HW-i0,y0,y1,i0,D-i0,true,{kind:'hidden'});}
 // ---- the porch, the planters and the benches -------------------------------------------------------------------------
 P('landing',C.stone,-3.5,3.5,G,2.7,-3.27,0,true,{kind:'landing'});
 for(const x of[-3.0,3.0])P('column'+(x<0?'W':'E'),C.white,x-.17,x+.17,2.7,5.45,-3.17,-2.83,true,{kind:'hidden'});
 P('canopy',C.roof,-3.7,3.7,5.45,6.3,-3.1,0,true,{kind:'hidden'});
 for(const [k,a,b] of [['W',-11.6,-4.3],['E',4.3,11.6]])P('planter'+k,C.stone,a,b,G,2.95,-1.0,-.12,true,{kind:'planter'});
 for(const s of[-1,1])P('bench'+(s<0?'W':'E'),C.wood,s<0?-2.95:1.75,s<0?-1.75:2.95,2.7,3.15,-.55,-.05,true,{kind:'hidden'});
 signs.push({id:ID+':sign',text:NAME.toUpperCase(),sub:SUB,x:wx(0),y:5.7,z:wz(-3.115),w:6.0,h:.42,ry:Math.PI});
 signs.push({id:ID+':reception',text:'RECEPTION',sub:'',x:wx(0),y:3.35,z:wz(5.985),w:1.6,h:.3,ry:Math.PI},{id:ID+':dorm',text:'DORMITORY',sub:'',x:wx(-3.0),y:5.25,z:wz(11.985),w:1.2,h:.26,ry:Math.PI},{id:ID+':wash',text:'WASHROOMS',sub:'',x:wx(-5.8),y:5.25,z:wz(8.985),w:1.2,h:.26,ry:Math.PI});
 lights.push({id:ID+':lampW',kind:'lamp',x:wx(-2.0),y:4.64,z:wz(-.13),w:.15,h:.27,d:.13},{id:ID+':lampE',kind:'lamp',x:wx(2.0),y:4.64,z:wz(-.13),w:.15,h:.27,d:.13});
 for(const x of[-1.6,0,1.6])lights.push({id:ID+':porch'+x,kind:'panel',x:wx(x),y:5.925,z:wz(-1.5),w:.5,h:.02,d:.5});
 // ---- the inner walls (the openings are 2.2 m doorways) ------------------------------------------------------------------
 const PT=(key,x0,x1,z0,z1)=>P(key,C.part,x0,x1,FL-.02,CEIL+.05,z0,z1,true,{kind:'part'});
 const PTo=(key,x0,x1,z0,z1,along,open)=>{let s=along==='x'?x0:z0;const end=along==='x'?x1:z1;for(const [a,b] of open){if(a>s){if(along==='x')PT(key+'-'+a,s,a,z0,z1);else PT(key+'-'+a,x0,x1,s,a);}if(along==='x')P(key+'-head'+a,C.part,a,b,DOOR_HEAD,CEIL+.05,z0,z1,true,{kind:'part'});else P(key+'-head'+a,C.part,x0,x1,DOOR_HEAD,CEIL+.05,a,b,true,{kind:'part'});s=b;}if(s<end){if(along==='x')PT(key+'-end',s,end,z0,z1);else PT(key+'-end',x0,x1,s,end);}};
 for(const p of PARTS)PTo(...p);
 // ---- what stands in the rooms ----------------------------------------------------------------------------------------
 P('desk',C.wood,-2.2,2.2,FL-.02,3.86,6.0,6.7,true,{kind:'hidden'});
 P('cooler',C.white,-4.8,-4.4,FL-.02,FL+1.25,8.35,8.75,true,{kind:'hidden'});
 P('divider',C.wood,3.9,4.3,FL-.02,FL+.75,1.0,4.6,true,{kind:'hidden'});
 P('lockers',C.locker,LOCKERS.x0,LOCKERS.x1,FL-.02,FL+LOCKERS.h,LOCKERS.z0,LOCKERS.z1,true,{kind:'hidden'});
 items().forEach((it,i)=>solids(it).forEach(([x0,z0,x1,z1,y0,y1],j)=>P('f'+i+'-'+it.k+(j||''),C.wood,x0,x1,FL+y0-(y0?0:.02),FL+y1,z0,z1,true,{kind:'hidden'})));
 // the stalls: laminate walls and fronts raised off the floor; the toilet bowl and its cistern plate are named pieces
 // (street-actions.js finds every toilet by the pair ':toilet<n>' / ':tank<n>')
 for(const x of [-11.65,-10.6,-9.55])P('stallWall'+x,C.stall,x-.025,x+.025,2.93,4.85,20.15,D-WT-.02,true,{kind:'hidden'});
 STALLS.forEach(([a,b],i)=>{const left=i===0?a+.02:a+.025;/* V12.6: a 0.85 m doorway */P('stallFrontL'+i,C.stall,left,a+.1,2.93,4.85,20.12,20.17,true,{kind:'hidden'});P('stallFrontR'+i,C.stall,b-.1,b-.025,2.93,4.85,20.12,20.17,true,{kind:'hidden'});
  const x=(a+b)/2;/* V15.8: the kit's toilet, the seat at 0.44 m, a cistern plate on the wall behind */P('toilet'+i,C.porcelain,x-.19,x+.19,FL-.02,FL+.44,21.07,21.6,true,{kind:'hidden'});P('tank'+i,C.porcelain,x-.25,x+.25,FL-.02,FL+1.4,21.6,21.7,true,{kind:'hidden'});});
 for(const [i,z0,z1] of SHOWERS.map((s,i)=>[i,...s]))Glass('shower'+i,-5.47,-5.45,FL+.03,4.9,z0+.05,(z0+z1)/2,'x',false,{shower:true});
 for(const [k,z0,z1] of [['a',15.95,16.0],['b',17.3,17.4],['c',18.7,18.75]])P('showerWall'+k,C.tile,-5.45,-4.17,FL-.02,4.9,z0,z1,true,{kind:'hidden'});
 P('bench',C.wood,-8.5,-6.5,FL-.02,FL+.45,15.5,15.9,true,{kind:'hidden'});
 // ---- ceiling lights (2.5 cm under the ceiling) ------------------------------------------------------------------------
 for(const [x,z] of [[0,3],[0,9.2],[-8.5,3],[-8.5,7],[10.6,4.2],[10.6,8.6],[7,10.2],[-1.5,17],[2.5,17],[6.5,17],[10.5,17],[-8.5,11.5],[-8.5,15.5],[-8.5,19.5]])lights.push({id:ID+':ceil'+x+','+z,kind:'panel',x:wx(x),y:CEIL-.025,z:wz(z),w:1.2,h:.02,d:.6});
 // ---- outside: the scooter bays along the east wall, the air units and trees behind ----------------------------------------
 const scooters=[];for(let i=0;i<4;i++){const z=1.25+i*1.5;scooters.push({x:wx(14.4),y:LOT.y,z:wz(z),yaw:-Math.PI/2});}
 for(const [k,z] of [['a',.69],['b',6.31]])P('rackPost'+k,C.metal,13.24,13.32,LOT.y-.02,3.34,z-.04,z+.04,true,{kind:'hidden'});
 P('scooterPost',C.metal,15.75,15.85,LOT.y-.02,5.0,.15,.25,true,{kind:'hidden'});
 signs.push({id:ID+':scooterSign',text:'SCOOTERS',sub:'Residents',x:wx(15.8),y:4.65,z:wz(.06),w:.76,h:.46,ry:Math.PI});
 for(const x of[-5.4,4.0])P('airUnit'+x,C.metal,x-.55,x+.55,G,G+.95,D+.6,D+1.3,true,{kind:'hidden'});
 for(const [x,z] of [[-10.5,27.0],[8.5,27.5]])P('tree'+x,C.wood,x-.18,x+.18,G-.2,G+3.2,z-.18,z+.18,true,{kind:'hidden',tree:true});
 // the beds you can sleep in (the top of the covers), as before
 const beds=BEDS.map((b,i)=>({id:ID+':bed'+(b.r===2?'B'+i:'F'+(i-6)),x:wx(b.x),z:wz(b.z),yaw:b.r===2?Math.PI:0,y:3.44}));
 cache={pieces:out,glass,lights,signs,beds,scooters};return cache;}
// ---- the car park ------------------------------------------------------------------------------------------------------------
// two rows of bays: along the back of the car park, and a second row nearer the street with an aisle between
const ROWS=[{id:LOT.id,place:ID,z1:LOT.z1},{id:LOT.id+'-2',place:ID+'-2',z1:540.5}];
function lotBays(z1=LOT.z1){const n=Math.floor((LOT.x1-LOT.x0-.4)/2.6),mid=(LOT.x0+LOT.x1)/2;return Array.from({length:n},(_,i)=>({x:+(mid-n*1.3+1.3+i*2.6).toFixed(2),z:+(z1-LOT.bayDepth/2).toFixed(2)}));}
function carBays(){return ROWS.flatMap(r=>lotBays(r.z1));}
function lots(){return ROWS.map(r=>({id:r.id,place:r.place,x0:LOT.x0,x1:LOT.x1,z0:LOT.z0,z1:r.z1,y:LOT.y,bayDepth:LOT.bayDepth,dir:LOT.dir,bays:lotBays(r.z1)}));}
// ---- where you start ---------------------------------------------------------------------------------------------------------
const START={x:wx(0),y:FL+.02,z:wz(3.6),yaw:Math.PI};
function startPoint(){return{...START};}
function inside(x,y,z){return x>wx(-HW)&&x<wx(HW)&&z>wz(0)&&z<wz(D)&&y>G-.5&&y<CEIL;}
// ---- placing it in the world ---------------------------------------------------------------------------------------------------
function install(world,api){
 if(world.shelter)return world.shelter;const {box,removeBox,part,surface}=api;const svc=new Set((world.services||[]).map(s=>s.id)),removed=[];
 const over=b=>b.x+(b.w||0)/2>PLOT.x0+.5&&b.x-(b.w||0)/2<PLOT.x1-.5&&b.z+(b.d||0)/2>PLOT.z0+.5&&b.z-(b.d||0)/2<PLOT.z1-.5;
 for(let i=world.buildings.length-1;i>=0;i--){const b=world.buildings[i];if(b.interior||b.customHome||b.apartment||b.house||svc.has(b.id)||!over(b))continue;
  for(const c of world.colliders.filter(c=>c.id===b.id||String(c.id).startsWith(b.id+':')||c.buildingId===b.id))removeBox(c);world.buildings.splice(i,1);removed.push(b.id);}
 for(let i=world.props.length-1;i>=0;i--){const p=world.props[i];if(String(p.id).startsWith('destructible-')||p.x<PLOT.x0||p.x>PLOT.x1||p.z<PLOT.z0||p.z>PLOT.z1)continue;
  for(const c of world.colliders.filter(c=>c.id===p.id||(p.collisionIds||[]).includes(c.id)))removeBox(c);world.props.splice(i,1);}
 const k=pieces(),drawn=!!root.CityShelterLook?.ownsParts;/* V15.8: in the game the look draws the building; the parts list stays for anything else */
 for(const q of k.pieces){const w=q.x1-q.x0,h=q.y1-q.y0,d=q.z1-q.z0,x=(q.x0+q.x1)/2,y=(q.y0+q.y1)/2,z=(q.z0+q.z1)/2;
  if(!drawn&&q.kind!=='hidden')world.facilityParts.push({id:q.id,color:q.c,x,y,z,w,h,d});
  if(q.solid)box(q.id,x,q.y0,z,w,h,d,'masonry',{facility:true,architecturePart:true,buildingId:ID,shelter:true,floor:h<.4,roofSupport:h<.4});}
 for(const g of k.glass)if(g.solid)box(g.id,(g.x0+g.x1)/2,g.y0,(g.z0+g.z1)/2,g.x1-g.x0,g.y1-g.y0,g.z1-g.z0,'glass',{architecturePart:true,buildingId:ID,shelter:true});
 // the car park: tarmac over the scooter strip and the bays, a line between every two bays, the stop line and the P sign
 const midX=(LOT.padX0+LOT.x1)/2;
 if(surface)surface(LOT.id,[{x:midX,y:LOT.y,z:LOT.z0},{x:midX,y:LOT.y,z:LOT.z1}],LOT.x1-LOT.padX0,'#7c8386');
 if(part){for(const r of ROWS){const bays=lotBays(r.z1);for(let i=0;i<=bays.length;i++)part(r.id+':line:'+i,'#eef0e8',bays[0].x-1.3+i*2.6,LOT.y+.015,r.z1-LOT.bayDepth/2,.12,.02,LOT.bayDepth,false);
   part(r.id+':stop','#eef0e8',(bays[0].x+bays.at(-1).x)/2,LOT.y+.015,r.z1-LOT.bayDepth,bays.length*2.6,.02,.12,false);}
  part(LOT.id+':post','#59646a',LOT.x1-.7,LOT.y+1.5,LOT.z0+.6,.14,3,.14);part(LOT.id+':sign','#1f5fa8',LOT.x1-.7,LOT.y+2.7,LOT.z0+.6,1.1,.8,.08,false);part(LOT.id+':p','#f4f6f2',LOT.x1-.7,LOT.y+2.7,LOT.z0+.55,.36,.5,.02,false);}
 // (the porch landing reaches the pavement, so there is no separate path)
 const b={id:ID,name:NAME,x:CX,y:G,z:ZF+D/2,w:HW*2,d:D,h:TOP-G,roofY:ROOF,style:'shelter',customHome:true,shelter:true,interior:false,district:'old-quay',lot:LOT.id};
 world.buildings.push(b);
 world.shelter={id:ID,name:NAME,building:b,start:startPoint(),scooters:k.scooters.map(s=>({...s})),beds:k.beds.map(s=>({...s})),lot:LOT.id,removed};
 return world.shelter;}
return{ID,NAME,SUB,CX,ZF,HW,D,G,FL,CEIL,ROOF,TOP,WT,EAVE,OVER,SLOPE,RIDGE,DOOR_HEAD,DOOR,WIN,PARTS,BEDS,STALLS,SHOWERS,LOCKERS,PLOT,LOT,ROWS,COLORS:C,pieces,items,solids,lots,lotBays,carBays,startPoint,inside,install};
});
