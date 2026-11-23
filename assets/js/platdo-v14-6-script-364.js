
/* PLATDO City: the homeless shelter, Harborlight House (V10.3). Shared by the game and the multiplayer host (the host
 * copy is server/platdo-city/src/shelter.js, the same file).
 * - On the south side of Lantern Street in Old Quay, across the street from the first home, where two look-only brick
 *   blocks stood. A one-storey red brick building on a stone base: framed windows with stone sills and lintels, a
 *   cornice and coping, an entrance porch on two columns with the name over it, planters along the front.
 * - Inside: the reception desk facing the door, a waiting area, a common room (tables, a sofa and TV, a kitchenette),
 *   a dormitory of ten beds with lockers, and washrooms (sinks, three toilet stalls, two showers). Exposed brick on the
 *   outer walls, painted partitions, lights in the ceiling.
 * - Outside: the car park on the east side (parked cars come from the parking system), the scooter bays along the
 *   east wall with a rack (the starting scooter waits in the first bay), a path from the pavement to the porch.
 * - Story games and online players start inside at the reception (startPoint), facing the door.
 * Everything solid is a world box; everything you see is a coloured part (world.facilityParts, drawn by the island),
 * except the glass, the lights and the lettering, which city-shelter-look.js draws. No two visible faces share a plane:
 * bands and trims stand 2 to 4 cm proud, flat things on the floor sit 1.5 cm up, and where two pieces meet one stops
 * inside the other. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityShelter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const ID='shelter',NAME='Harborlight House',SUB='Community shelter · Beds · Meals · Showers';
// local coordinates: X across the front (east +) from the middle, Z from the front face toward the back (south +)
const CX=-198,ZF=529,HW=13,D=22,G=2.5,FL=2.8,CEIL=6.4,ROOF=6.62,TOP=7.25,WT=.3;
const PLOT={x0:-213,x1:-150,z0:525.9,z1:560};
const LOT={id:'carpark-'+ID,place:ID,x0:-181.6,x1:-152,z0:525.75,z1:556,y:2.58,bayDepth:5.5,dir:-1,padX0:-184.9};
const C={brick:'#93503f',brickDark:'#7a3f33',stone:'#c6bba9',frame:'#eeeae1',cornice:'#d3c9b8',roof:'#e2ded6',part:'#e8e0cc',floor:'#b59b7d',
 looWater:'#a9c3cc',tile:'#cdd5d7',carpet:'#8b97a3',wood:'#8a6446',darkWood:'#5b4230',lightWood:'#d6c9b2',metal:'#5e656a',white:'#f2f0eb',porcelain:'#f6f5f1',
 mattress:'#e7e3da',pillow:'#f8f6f1',sofa:'#566e82',chair:'#4c6a5e',table:'#c7a67b',locker:'#6d8693',green:'#4d7b3b',pot:'#9a6949',
 screen:'#1c2024',fascia:'#2d4e3d',cork:'#b98e5c',paper:'#f4efe2',mirror:'#b7c7cb',stall:'#7c8e95',plant:'#5c8a45',mat:'#3b3f42',
 blankets:['#3f6e9a','#7a9a5a','#b0654a','#6b5a8e','#c49a3a']};
const wx=X=>CX+X,wz=Z=>ZF+Z;
// ---- the pieces --------------------------------------------------------------------------------------------------
let cache=null;
function pieces(){
 if(cache)return cache;const out=[],glass=[],lights=[],signs=[];let n=0;
 // P: a box in local coordinates (x0,x1 across, y0,y1 height, z0,z1 depth); look 'part' is drawn as a coloured box
 const P=(key,c,x0,x1,y0,y1,z0,z1,solid=true)=>{out.push({id:ID+':'+key+(key.endsWith('#')?n++:''),c,x0:wx(x0),x1:wx(x1),y0,y1,z0:wz(z0),z1:wz(z1),solid});};
 const Glass=(key,x0,x1,y0,y1,z0,z1,axis,solid=true)=>{glass.push({id:ID+':glass-'+key,x0:wx(x0),x1:wx(x1),y0,y1,z0:wz(z0),z1:wz(z1),axis,solid});};
 // a wall along X (front or back) from xa to xb, thickness z0..z1, with openings [{a,b,y0,y1}]
 const wallX=(key,xa,xb,z0,z1,open,color=C.brick)=>{let x=xa;open.slice().sort((p,q)=>p.a-q.a).forEach((o,i)=>{if(o.a>x)P(key+'-pier'+i,color,x,o.a,G,TOP,z0,z1);if(o.y0>G)P(key+'-below'+i,color,o.a,o.b,G,o.y0,z0,z1);P(key+'-above'+i,color,o.a,o.b,o.y1,TOP,z0,z1);x=o.b;});if(x<xb)P(key+'-pierEnd',color,x,xb,G,TOP,z0,z1);};
 const wallZ=(key,za,zb,x0,x1,open,color=C.brick)=>{let z=za;open.slice().sort((p,q)=>p.a-q.a).forEach((o,i)=>{if(o.a>z)P(key+'-pier'+i,color,x0,x1,G,TOP,z,o.a);if(o.y0>G)P(key+'-below'+i,color,x0,x1,G,o.y0,o.a,o.b);P(key+'-above'+i,color,x0,x1,o.y1,TOP,o.a,o.b);z=o.b;});if(z<zb)P(key+'-pierEnd',color,x0,x1,G,TOP,z,zb);};
 // windows: frame (proud 4 cm), sill (stone, proud 8 cm, 2 cm above the opening floor), lintel (stone, 2 cm above
 // the frame) and the glass, on a facade facing out along -Z (front), +Z (back), -X (west) or +X (east)
 const windowOn=(key,face,a,b,y0,y1)=>{
  const out1=(lo,hi)=>face==='front'?[-hi,-lo]:face==='back'?[D+lo,D+hi]:face==='west'?[-HW-hi,-HW-lo]:[HW+lo,HW+hi];
  const along=(p,q,yy0,yy1,lo,hi,k,c)=>{const [f0,f1]=out1(lo,hi);if(face==='front'||face==='back')P(key+k,c,p,q,yy0,yy1,f0,f1,false);else P(key+k,c,f0,f1,yy0,yy1,p,q,false);};
  /* the frame laps 2 cm into the opening, so its inside edge is not on the plane of the opening's edge */along(a-.1,a+.02,y0,y1,-.02,.04,'-jambL',C.frame);along(b-.02,b+.1,y0,y1,-.02,.04,'-jambR',C.frame);along(a-.1,b+.1,y1-.02,y1+.1,-.02,.04,'-head',C.frame);
  along(a-.15,b+.15,y0-.06,y0+.02,-.05,.08,'-sill',C.stone);along(a-.2,b+.2,y1+.12,y1+.32,-.02,.03,'-lintel',C.stone);
  const mid=face==='front'?WT/2:face==='back'?D-WT/2:face==='west'?-HW+WT/2:HW-WT/2;
  if(face==='front'||face==='back')Glass(key,a,b,y0,y1,mid-.01,mid+.01,'z');else Glass(key,mid-.01,mid+.01,y0,y1,a,b,'x');};
 // ---- the shell -------------------------------------------------------------------------------------------------
 P('floor',C.floor,-HW+.05,HW-.05,G,FL,.05,D-.05);
 P('roof',C.roof,-HW+.05,HW-.05,CEIL,ROOF,.05,D-.05);
 const door={a:-1.4,b:1.4,y0:FL-.02,y1:5.2};
 const frontWin=[[-9.6,-7.8],[-6.0,-4.2],[4.2,6.0],[7.8,9.6]].map(([a,b])=>({a,b,y0:3.7,y1:5.6}));
 wallX('front',-HW,HW,0,WT,[door,...frontWin]);
 const backWin=[[-1.2,0],[3.2,4.4],[7.6,8.8]].map(([a,b])=>({a,b,y0:4.3,y1:5.6}));
 wallX('back',-HW,HW,D-WT,D,backWin);
 const westWin=[[11.0,12.0],[15.2,16.2],[19.0,20.0]].map(([a,b])=>({a,b,y0:4.95,y1:5.6})).concat([{a:3.2,b:5.0,y0:3.7,y1:5.6}]);
 wallZ('west',WT,D-WT,-HW,-HW+WT,westWin);
 const eastWin=[[1.0,2.6],[3.4,5.0],[14.0,15.8],[18.4,20.2]].map(([a,b])=>({a,b,y0:3.7,y1:5.6}));
 wallZ('east',WT,D-WT,HW-WT,HW,eastWin);
 frontWin.forEach((o,i)=>windowOn('win-f'+i,'front',o.a,o.b,o.y0,o.y1));backWin.forEach((o,i)=>windowOn('win-b'+i,'back',o.a,o.b,o.y0,o.y1));
 westWin.forEach((o,i)=>windowOn('win-w'+i,'west',o.a,o.b,o.y0,o.y1));eastWin.forEach((o,i)=>windowOn('win-e'+i,'east',o.a,o.b,o.y0,o.y1));
 // the doorway: a dark green frame, a stone threshold 2 cm above the floor, and a glass transom over the door
 P('door-jambL',C.fascia,-1.55,-1.38,2.66,5.3,-.05,.02,false);P('door-jambR',C.fascia,1.38,1.55,2.66,5.3,-.05,.02,false);P('door-head',C.fascia,-1.55,1.55,5.18,5.36,-.05,.02,false);
 P('threshold',C.stone,-1.4,1.4,G,FL+.02,-.04,WT+.04);
 // the stone base (front and back run through the corners, the sides stop inside them), cornice and coping
 P('plinth-f1',C.stone,-HW-.04,-1.55,G,3.1,-.04,.02);P('plinth-f2',C.stone,1.55,HW+.04,G,3.1,-.04,.02);P('plinth-b',C.stone,-HW-.04,HW+.04,G,3.1,D-.02,D+.04);
 P('plinth-w',C.stone,-HW-.04,-HW+.02,G,3.1,0,D);P('plinth-e',C.stone,HW-.02,HW+.04,G,3.1,0,D);
 P('band-f',C.brickDark,-HW-.02,HW+.02,5.95,6.1,-.02,.02,false);P('band-b',C.brickDark,-HW-.02,HW+.02,5.95,6.1,D-.02,D+.02,false);
 P('band-w',C.brickDark,-HW-.02,-HW+.02,5.95,6.1,.02,D-.02,false);P('band-e',C.brickDark,HW-.02,HW+.02,5.95,6.1,.02,D-.02,false);
 P('cornice-f',C.cornice,-HW-.12,HW+.12,6.95,7.15,-.12,.02,false);P('cornice-b',C.cornice,-HW-.12,HW+.12,6.95,7.15,D-.02,D+.12,false);
 P('cornice-w',C.cornice,-HW-.12,-HW+.02,6.95,7.15,.02,D-.02,false);P('cornice-e',C.cornice,HW-.02,HW+.12,6.95,7.15,.02,D-.02,false);
 P('coping-f',C.stone,-HW-.06,HW+.06,TOP,TOP+.08,-.06,WT+.06);P('coping-b',C.stone,-HW-.06,HW+.06,TOP,TOP+.08,D-WT-.06,D+.06);
 P('coping-w',C.stone,-HW-.06,-HW+WT+.06,TOP,TOP+.08,WT+.06,D-WT-.06);P('coping-e',C.stone,HW-WT-.06,HW+.06,TOP,TOP+.08,WT+.06,D-WT-.06);
 for(const [k,x] of [['pipeW',-12.6],['pipeE',12.48]]){P(k+'f',C.metal,x,x+.12,G,7.0,-.16,-.06,false);P(k+'b',C.metal,x,x+.12,G,7.0,D+.06,D+.16,false);}
 // rooftop units
 P('ac1',C.metal,-6.5,-4.3,ROOF-.02,7.5,13.5,15.6);P('ac2',C.metal,3.2,5.6,ROOF-.02,7.3,16.0,17.8);P('ac1-fan',C.screen,-6.1,-4.7,7.48,7.52,14.0,15.1,false);
 // ---- the porch, the path and the planters ------------------------------------------------------------------------
 P('landing',C.stone,-3.5,3.5,G,2.7,-3.27,0);
 P('canopy',C.roof,-3.3,3.3,5.6,5.82,-2.7,.02);P('canopy-edge',C.metal,-3.32,3.32,5.58,5.6,-2.72,-2.5,false);
 P('fascia',C.fascia,-3.35,3.35,5.5,6.15,-2.78,-2.7,false);
 for(const x of [-3.0,3.0])P('column'+(x<0?'W':'E'),C.white,x-.15,x+.15,2.66,5.62,-2.55,-2.25);
 for(const [k,a,b] of [['W',-11.6,-4.3],['E',4.3,11.6]]){P('planter'+k,C.stone,a,b,G,2.95,-1.0,-.12);P('shrub'+k,C.plant,a+.1,b-.1,2.93,3.55,-.92,-.2,false);}
 signs.push({id:ID+':sign',text:NAME.toUpperCase(),sub:SUB,x:wx(0),y:5.83,z:wz(-2.8),w:6.2,h:.56,ry:Math.PI});
 signs.push({id:ID+':reception',text:'RECEPTION',sub:'',x:wx(0),y:3.35,z:wz(5.95),w:1.6,h:.3,ry:Math.PI},{id:ID+':dorm',text:'DORMITORY',sub:'',x:wx(-3.0),y:5.45,z:wz(11.98),w:1.2,h:.26,ry:Math.PI},{id:ID+':wash',text:'WASHROOMS',sub:'',x:wx(-5.8),y:5.45,z:wz(8.98),w:1.2,h:.26,ry:Math.PI});
 lights.push({id:ID+':lampW',kind:'lamp',x:wx(-2.0),y:4.6,z:wz(-.08),w:.18,h:.28,d:.1},{id:ID+':lampE',kind:'lamp',x:wx(2.0),y:4.6,z:wz(-.08),w:.18,h:.28,d:.1});
 for(const x of [-1.6,0,1.6])lights.push({id:ID+':porch'+x,kind:'panel',x:wx(x),y:5.57,z:wz(-1.3),w:.5,h:.02,d:.5});
 // ---- partitions --------------------------------------------------------------------------------------------------
 const PT=(key,x0,x1,z0,z1)=>P(key,C.part,x0,x1,FL-.02,CEIL+.05,z0,z1);
 const PTo=(key,x0,x1,z0,z1,along,open)=>{let s=along==='x'?x0:z0;const end=along==='x'?x1:z1;for(const [a,b] of open){if(a>s){if(along==='x')PT(key+'-'+a,s,a,z0,z1);else PT(key+'-'+a,x0,x1,s,a);}if(along==='x')P(key+'-head'+a,C.part,a,b,5.0,CEIL+.05,z0,z1);else P(key+'-head'+a,C.part,x0,x1,5.0,CEIL+.05,a,b);s=b;}if(s<end){if(along==='x')PT(key+'-end',s,end,z0,z1);else PT(key+'-end',x0,x1,s,end);}};
 PTo('dormWall',-4.07,HW-WT+.05,12.0,12.15,'x',[[-3.6,-2.4],[10.7,11.9]]);
 PTo('washWall',-4.15,-4.0,9.15,D-WT+.05,'z',[[13.0,14.2]]);
 PTo('washFront',-HW+WT-.05,-4.0,9.0,9.15,'x',[[-6.4,-5.2]]);
 // ---- floors on the floor (1.5 cm up) ----------------------------------------------------------------------------
 P('tiles',C.tile,-HW+WT+.02,-4.17,FL-.01,FL+.015,9.17,D-WT-.02,false);
 P('carpet',C.carpet,-3.98,HW-WT-.02,FL-.01,FL+.015,12.17,D-WT-.02,false);
 P('rug',C.darkWood,5.3,8.7,FL-.01,FL+.015,8.3,11.2,false);P('doormat',C.mat,-1.3,1.3,FL-.01,FL+.015,.35,1.6,false);
 // ---- reception -----------------------------------------------------------------------------------------------------
 P('desk',C.wood,-2.2,2.2,FL-.02,3.86,6.0,6.7);P('desk-top',C.stone,-2.3,2.3,3.84,3.9,5.95,6.75);P('desk-front',C.lightWood,-2.25,2.25,3.0,3.7,5.97,6.0,false);
 P('monitor',C.screen,-1.1,-.5,3.89,4.31,6.38,6.46,false);P('phone',C.screen,.7,.95,3.89,3.97,6.3,6.5,false);
 P('staffSeat',C.chair,-.25,.25,3.2,3.28,7.0,7.5);P('staffBack',C.chair,-.25,.25,3.26,3.85,7.45,7.52,false);P('staffBase',C.metal,-.05,.05,FL-.02,3.21,7.2,7.3,false);
 P('board',C.cork,.6,2.6,4.0,5.0,11.95,11.98,false);for(let i=0;i<5;i++)P('note'+i,C.paper,.75+i*.37,1.03+i*.37,4.25+(i%2)*.3,4.6+(i%2)*.3,11.94,11.95,false);
 // ---- the waiting area ------------------------------------------------------------------------------------------------
 for(let i=0;i<6;i++){const z=1.7+i*.8;P('wSeat'+i,C.chair,-12.55,-12.05,3.22,3.3,z-.24,z+.24);P('wBack'+i,C.chair,-12.64,-12.56,3.28,3.85,z-.24,z+.24,false);P('wBase'+i,C.metal,-12.5,-12.1,FL-.02,3.23,z-.2,z+.2,false);}
 P('wTable',C.wood,-10.6,-9.6,FL-.02,3.22,3.0,4.4);P('mag1',C.blankets[0],-10.4,-10.0,3.21,3.235,3.3,3.6,false);P('mag2',C.blankets[2],-10.1,-9.75,3.21,3.235,3.8,4.15,false);
 P('cooler',C.white,-4.75,-4.35,FL-.02,3.9,.6,1.0);P('bottle',C.mirror,-4.7,-4.4,3.88,4.3,.65,.95,false);
 P('shelf',C.wood,-11.5,-8.5,FL-.02,4.6,8.6,8.98);for(let r=0;r<3;r++)for(let i=0;i<5;i++)P('book'+r+'-'+i,C.blankets[(r+i)%5],-11.35+i*.56,-10.9+i*.56,3.2+r*.5,3.55+r*.5,8.58,8.62,false);
 P('potW',C.pot,-12.55,-12.05,FL-.02,3.25,.45,.95);P('plantW',C.plant,-12.6,-12.0,3.23,4.0,.4,1.0,false);
 // ---- the common room --------------------------------------------------------------------------------------------------
 P('cabinets',C.lightWood,12.05,12.68,FL-.02,3.7,7.0,11.4);P('counter',C.stone,12.0,12.69,3.68,3.74,6.95,11.45);P('sink',C.metal,12.2,12.55,3.735,3.75,8.8,9.4,false);
 P('uppers',C.lightWood,12.33,12.68,4.6,5.4,7.0,11.4);P('fridge',C.white,11.95,12.68,FL-.02,4.78,6.05,6.85);P('microwave',C.screen,12.2,12.6,3.73,4.03,10.4,10.95,false);
 const table=(key,x,z)=>{P(key,C.table,x-.7,x+.7,3.5,3.55,z-.45,z+.45);P(key+'-leg',C.metal,x-.05,x+.05,FL-.02,3.51,z-.05,z+.05,false);
  for(const [dx,s] of [[-.35,-1],[.35,-1],[-.35,1],[.35,1]]){const cz=z+s*.85;P(key+'-seat'+dx+s,C.chair,x+dx-.21,x+dx+.21,3.18,3.24,cz-.21,cz+.21);P(key+'-back'+dx+s,C.chair,x+dx-.21,x+dx+.21,3.22,3.7,s<0?cz-.25:cz+.21,s<0?cz-.21:cz+.25,false);P(key+'-base'+dx+s,C.metal,x+dx-.03,x+dx+.03,FL-.02,3.19,cz-.03,cz+.03,false);}};
 table('tableA',6.2,2.4);table('tableB',9.4,2.4);table('tableC',6.2,5.6);
 P('sofa',C.sofa,5.6,8.4,FL-.02,3.22,8.6,9.5);P('sofaBack',C.sofa,5.6,8.4,3.2,3.75,8.6,8.8);P('sofaArmW',C.sofa,5.6,5.78,3.2,3.5,8.8,9.5);P('sofaArmE',C.sofa,8.22,8.4,3.2,3.5,8.8,9.5);
 P('coffee',C.wood,6.3,7.7,FL-.02,3.2,10.0,10.6);P('tvStand',C.darkWood,5.9,8.1,FL-.02,3.3,11.5,11.97);P('tv',C.screen,6.0,8.0,4.0,5.1,11.95,11.98,false);
 P('divider',C.wood,3.9,4.3,FL-.02,3.55,1.0,4.6);P('dividerPlants',C.plant,3.95,4.25,3.53,4.1,1.1,4.5,false);
 // ---- the dormitory: ten beds with lockers ------------------------------------------------------------------------------
 const beds=[];
 const bed=(key,x,z0,dir,color)=>{// dir +1: head at the back (z larger), -1: head at the front
  const zf=dir>0?z0:z0-2,zb=zf+2,head=dir>0?zb:zf,foot=dir>0?zf:zb,s=dir;
  P(key+'-frame',C.metal,x-.48,x+.48,FL-.02,3.22,zf,zb);P(key+'-mattress',C.mattress,x-.45,x+.45,3.2,3.42,zf+.03,zb-.03,false);
  const bl0=dir>0?zf+.01:zb-1.32,bl1=dir>0?zf+1.33:zb-.01;P(key+'-blanket',color,x-.46,x+.46,3.3,3.44,bl0,bl1,false);
  const pl0=dir>0?zb-.55:zf+.15,pl1=dir>0?zb-.15:zf+.55;P(key+'-pillow',C.pillow,x-.32,x+.32,3.4,3.52,pl0,pl1,false);
  P(key+'-headboard',C.metal,x-.48,x+.48,FL-.02,3.95,dir>0?zb:zf-.04,dir>0?zb+.04:zf);
  const lx=x-1.05;P(key+'-locker',C.locker,lx,lx+.5,FL-.02,4.58,dir>0?zb-.51:zf,dir>0?zb:zf+.51);
  P(key+'-seam',C.screen,lx+.24,lx+.26,2.9,4.5,dir>0?zb-.53:zf+.51,dir>0?zb-.51:zf+.53,false);
  beds.push({id:ID+':'+key,x:wx(x),z:wz((zf+zb)/2),yaw:dir>0?Math.PI:0,y:3.44});};
 [-2.5,.3,3.1,5.9,8.7,11.5].forEach((x,i)=>bed('bedB'+i,x,D-WT-.08-2,1,C.blankets[i%5]));
 [1.5,4.3,7.1,9.9].forEach((x,i)=>bed('bedF'+i,x,12.15+.04+2,-1,C.blankets[(i+2)%5]));
 // ---- the washrooms ------------------------------------------------------------------------------------------------------
 P('vanity',C.white,-12.68,-12.12,FL-.02,3.62,10.2,13.6);P('vanityTop',C.stone,-12.69,-12.08,3.6,3.66,10.15,13.65);
 for(const [i,z] of [10.9,11.9,12.9].entries()){P('basin'+i,C.porcelain,-12.55,-12.2,3.655,3.67,z-.22,z+.22,false);P('tap'+i,C.metal,-12.62,-12.56,3.66,3.82,z-.03,z+.03,false);}
 P('mirror',C.mirror,-12.68,-12.66,3.95,4.75,10.25,13.55,false);
 const stalls=[[-12.7,-11.65],[-11.65,-10.6],[-10.6,-9.55]];
 for(const x of [-11.65,-10.6,-9.55])P('stallWall'+x,C.stall,x-.025,x+.025,2.93,4.85,20.15,D-WT-.02);
 stalls.forEach(([a,b],i)=>{const left=i===0?a+.02:a+.025;/* V12.6: narrower front panels, a 0.85 m doorway (it was 0.65 m, too narrow to walk out of) */P('stallFrontL'+i,C.stall,left,a+.1,2.93,4.85,20.12,20.17);P('stallFrontR'+i,C.stall,b-.1,b-.025,2.93,4.85,20.12,20.17);
  const x=(a+b)/2;P('toilet'+i,C.porcelain,x-.2,x+.2,FL-.02,3.2,21.0,21.6);P('tank'+i,C.porcelain,x-.22,x+.22,3.15,3.6,21.5,21.66);/* V11.2: the water in the bowl, 6 mm above the top */P('looWater'+i,C.looWater,x-.13,x+.13,3.206,3.209,21.12,21.46,false);});
 for(const [i,z0,z1] of [[0,16.0,17.3],[1,17.4,18.7]]){P('showerTray'+i,C.white,-5.43,-4.19,FL,2.83,z0+.03,z1-.03,false);P('showerHead'+i,C.metal,-4.22,-4.16,4.9,5.0,(z0+z1)/2-.05,(z0+z1)/2+.05,false);Glass('shower'+i,-5.47,-5.45,FL+.03,4.9,z0+.05,(z0+z1)/2,'x',false);}
 for(const [k,z0,z1] of [['a',15.95,16.0],['b',17.3,17.4],['c',18.7,18.75]])P('showerWall'+k,C.tile,-5.45,-4.17,FL-.02,4.9,z0,z1);
 P('bench',C.wood,-8.5,-6.5,FL-.02,3.25,15.5,15.9);
 // ---- ceiling lights (2 cm under the ceiling) ------------------------------------------------------------------------------
 for(const [x,z] of [[0,3],[0,9],[-8.5,3],[-8.5,7],[8.5,3],[8.5,9],[-2,17],[2.5,17],[7,17],[11,17],[-8.5,12],[-8.5,18]])lights.push({id:ID+':ceil'+x+','+z,kind:'panel',x:wx(x),y:CEIL-.03,z:wz(z),w:1.2,h:.02,d:.6});
 // ---- the scooter bays along the east wall, the car park beside them -------------------------------------------------------
 const scooters=[];for(let i=0;i<4;i++){const z=1.25+i*1.5;scooters.push({x:wx(14.4),y:LOT.y,z:wz(z),yaw:-Math.PI/2});}
 for(let i=0;i<=4;i++)P('scooterLine'+i,C.frame,13.35,15.6,LOT.y-.005,LOT.y+.015,.5+i*1.5-.05,.5+i*1.5+.05,false);
 P('rackBar',C.metal,13.25,13.31,3.28,3.33,.7,6.3,false);for(const [k,z] of [['a',.69],['b',6.31]])P('rackPost'+k,C.metal,13.24,13.32,LOT.y-.02,3.34,z-.04,z+.04);
 P('scooterPost',C.metal,15.75,15.85,LOT.y-.02,5.0,.15,.25);P('scooterSign',C.fascia,15.4,16.2,4.4,4.9,.08,.14,false);
 signs.push({id:ID+':scooterSign',text:'SCOOTERS',sub:'Residents',x:wx(15.8),y:4.65,z:wz(.06),w:.76,h:.46,ry:Math.PI});
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
 const k=pieces();
 for(const q of k.pieces){const w=q.x1-q.x0,h=q.y1-q.y0,d=q.z1-q.z0,x=(q.x0+q.x1)/2,y=(q.y0+q.y1)/2,z=(q.z0+q.z1)/2;
  world.facilityParts.push({id:q.id,color:q.c,x,y,z,w,h,d});if(q.solid)box(q.id,x,q.y0,z,w,h,d,'masonry',{facility:true,architecturePart:true,buildingId:ID,shelter:true,floor:h<.4,roofSupport:h<.4});}
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
return{ID,NAME,SUB,CX,ZF,HW,D,G,FL,CEIL,ROOF,TOP,PLOT,LOT,ROWS,COLORS:C,pieces,lots,lotBays,carBays,startPoint,inside,install};
});
