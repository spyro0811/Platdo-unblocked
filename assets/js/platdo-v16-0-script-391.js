
/* PLATDO City apartments (V9.2, world stage B6). Shared by the game and the multiplayer host.
 * - Ten residential buildings on the beach front, on the land side of Coast Boulevard, each facing the sea: five
 *   between West Circuit and City Avenue, three between the luxury store and Seaglass Drive, two between Seaglass
 *   Drive and Island Parkway. Purely residential: a lobby with a concierge desk on the ground floor, four floors of
 *   homes above it, and a car park behind each one, entered from Foundry Way.
 * - Every building has eight homes, two on each floor, numbered 101 to 108 (101 and 102 on the first floor, 107 and
 *   108 on the fourth; the odd numbers are on the west side). Both homes on a floor run the full depth of the
 *   building, so each has the whole of its sea side as one wall of glass.
 * - Each home has its own lift: two lift shafts stand behind the building, one for each side, and a lift opens
 *   straight into the hall of the home. Nobody walks through a shared corridor.
 * - All eight homes of a building share one floor plan and one interior design; the ten buildings have ten designs.
 *   layout(design) lists every piece of furniture of a design in the home's own coordinates, so whatever is drawn
 *   is also what you bump into: the game draws it (city-apt-rooms.js) and this file makes the solid boxes.
 * - Home coordinates: u runs from the wall between the two homes (0) to the outer wall (14.8), v from the back
 *   wall (0) to the glass (13.85). The east home is laid out as written; the west one is its mirror image.
 * Nothing here changes the ground. The look is in city-apt-look.js (outside, lobby) and city-apt-rooms.js (homes). */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityApartments=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const PRICE=500000;
// The building, in its own coordinates: x along the coast (east +), z towards the sea (+), y up from the lobby floor.
const G=2.6,ZF=703,HW=15.2,DEEP=14.4,CORE={x:3.7,z:-17.2},FIRST=4.6,STEP=3.5,CEIL=3.0,FLOORS=4,SLAB=.5,
 UW=14.8,UD=13.85,BACK=-14.1,GLASS_Z=-.2,ROOF=FIRST+STEP*FLOORS,PARAPET=1.1,
 LIFT={u0:1.4,u1:2.5,c0:.55,c1:3.3,back:-2.55}; // the lift door in the back wall and the car behind it (home coordinates)
// The car park behind each building: from the pavement of Foundry Way to the bays at the back of the building.
const LOT={z0:670,z1:685.5,bayDepth:5.5};
// [id, name, x of the middle, design]. Designs: the interior and the look outside belong together.
const SITES=[
 ['apt-1','The Marisol',-577.8,'mediterranean'],
 ['apt-2','Azure Point',-509.4,'coastal'],
 ['apt-3','Driftwood House',-441,'california'],
 ['apt-4','The Ironworks',-372.6,'loft'],
 ['apt-5','Halden House',-304.2,'nordic'],
 ['apt-6','Obsidian',59,'noir'],
 ['apt-7','Cedar & Stone',136,'warm'],
 ['apt-8','Alba',213,'minimal'],
 ['apt-9','Prism',299,'designer'],
 ['apt-10','The Strata',358,'stone'],
 /* V9.7: inland, on the north side of Lantern Street in Old Quay, facing the street (front line z 492) */
 ['apt-11','The Lantern',-111,'warm',492],
 ['apt-12','Copperfield',-50,'minimal',492],
 ['apt-13','Bellmont',127,'loft',492],
 ['apt-14','Seaglass Court',233,'mediterranean',492]];
// V9.7: a site's front line (the glass), whether it stands inland, and its car park behind
const zfOf=s=>(s&&s[4])||ZF,inland=s=>!!(s&&s[4]),lotOf=s=>{const z=zfOf(s);return{z0:z-33,z1:z-17.5,bayDepth:LOT.bayDepth};};
const DESIGNS={
 coastal:{name:'Ultra-modern coastal luxury',sofa:'l',dining:'rect6',island:'waterfall',bed:'upholstered',corner:'lounge',lounge:'pair',fitted:true},
 warm:{name:'Warm contemporary wood and stone',sofa:'u',dining:'trestle',island:'wood',bed:'platform',corner:'fireplace',lounge:'pair',fitted:true},
 minimal:{name:'Minimalist white and grey',sofa:'modular',dining:'round4',island:'slab',bed:'low',corner:'sculpture',lounge:'single',fitted:true},
 noir:{name:'Dark modern penthouse',sofa:'l',dining:'oval6',island:'waterfall',bed:'upholstered',corner:'bar',lounge:'pair',fitted:true},
 california:{name:'Contemporary California beach house',sofa:'l',dining:'rect6',island:'wood',bed:'canopy',corner:'hanging',lounge:'pair',fitted:true},
 loft:{name:'Industrial luxury loft',sofa:'chesterfield',dining:'trestle',island:'steel',bed:'leather',corner:'bookcase',lounge:'pair',fitted:true},
 nordic:{name:'Scandinavian modern',sofa:'straight',dining:'round4',island:'wood',bed:'low',corner:'desk',lounge:'pair',fitted:true},
 mediterranean:{name:'Modern Mediterranean coastal',sofa:'pair',dining:'oval6',island:'tiled',bed:'upholstered',corner:'niche',lounge:'single',fitted:true},
 designer:{name:'High-end urban designer',sofa:'curved',dining:'round4',island:'waterfall',bed:'upholstered',corner:'piano',lounge:'pair',fitted:true},
 stone:{name:'Glass and stone contemporary',sofa:'l',dining:'rect6',island:'slab',bed:'platform',corner:'wine',lounge:'pair',fitted:true}};
const site=id=>SITES.find(s=>s[0]===id)||null;
const level=floor=>FIRST+STEP*(floor-1); // floor 1..4: height of its floor above the lobby floor
// Unit numbers: floor f, side 'w' or 'e'. 101 = first floor west.
const unitNumber=(floor,side)=>100+(floor-1)*2+(side==='w'?1:2);
const unitFrom=n=>{const k=n-101;if(!(k>=0&&k<FLOORS*2))return null;return{floor:Math.floor(k/2)+1,side:k%2?'e':'w'};};
const unitId=(siteId,n)=>siteId+'-'+n;
function parseUnit(id){const m=/^(apt-(?:[1-9]|1[0-9]))-(10[1-8])$/.exec(/* V9.7: buildings 1 to 19 */String(id||''));if(!m||!site(m[1]))return null;const n=+m[2],u=unitFrom(n);return u&&{id:m[0],site:m[1],number:n,...u};}
function allUnits(){const out=[];for(const s of SITES)for(let n=101;n<=108;n++)out.push(unitId(s[0],n));return out;}
// Building coordinates to the world. Home coordinates (u,v) to building coordinates: x = side*(u+0.1), z = BACK+v.
const toWorld=(s,x,y,z)=>({x:s[2]+x,y:G+y,z:zfOf(s)+z});
const sideSign=side=>side==='w'?-1:1;
function homeToWorld(id,u,y,v){const p=parseUnit(id);if(!p)return null;const s=site(p.site),k=sideSign(p.side);return toWorld(s,k*(u+.1),level(p.floor)+y,BACK+v);}
// Facing in home coordinates (0: towards the glass, 1: towards the outer wall, 2: towards the back, 3: towards the party
// wall) to a yaw in the world (the game's yaw: 0 faces +z, PI/2 faces +x).
function homeYaw(id,r){const p=parseUnit(id);const k=p?sideSign(p.side):1;const d=[[0,1],[1,0],[0,-1],[-1,0]][((r%4)+4)%4];return Math.atan2(k*d[0],d[1]);}
// Which home (if any) a point is in: the rooms, or the lift car behind them.
function unitAt(x,y,z){
 for(const s of SITES){const lx=x-s[2];if(Math.abs(lx)>HW+.5)continue;const lz=z-zfOf(s);if(lz>.4||lz<CORE.z-.3)continue;
  for(let f=1;f<=FLOORS;f++){const ly=y-G-level(f);if(ly<-.6||ly>CEIL+.2)continue;const side=lx<0?'w':'e',u=Math.abs(lx)-.1,v=lz-BACK;
   const rooms=u>=-.15&&u<=UW+.15&&v>=-.35&&v<=UD+.1,car=u>=LIFT.c0-.1&&u<=LIFT.c1+.1&&v>=LIFT.back-.1&&v<0;
   if(rooms||car)return{id:unitId(s[0],unitNumber(f,side)),site:s[0],floor:f,side,u,v,car:!rooms};}}
 return null;}
// Where a home is entered: standing in the lift car, facing out into the hall.
function arrival(id){const p=homeToWorld(id,(LIFT.u0+LIFT.u1)/2,0,LIFT.back+.85);return p&&{...p,yaw:homeYaw(id,0)};}
// The lobby: where the lift call panel is, and where you stand when you come down.
function lobby(siteId){const s=site(siteId);if(!s)return null;return{panel:toWorld(s,0,0,-13.85),stand:{...toWorld(s,0,0,-12.2),yaw:0},door:toWorld(s,0,0,0),entrance:{...toWorld(s,0,0,1.6),yaw:0}};}
// ---- the furniture of each design ------------------------------------------------------------------------------------
// An item: k (what it is), t (which version), x and z (the middle, in home coordinates), r (which way its front faces),
// w (across its front), d (front to back), h (height), s (solid or not). c: extra solid boxes [u0,v0,u1,v1,y0,y1]
// for pieces that are not one box (an L-shaped sofa, a shower with an opening).
const I=(k,t,x,z,r,w,d,h,s=true,extra)=>({k,t,x,z,r,w,d,h,s,...extra});
// The walls inside a home (the same in every design): the wall between the living space and the bedroom wing, the
// bathroom wall and the bedroom wall, each with a door opening. [u0,v0,u1,v1] with the opening as two pieces.
const WING=10.3,PART=.12,BATH_V=4.45,CORR_V=5.73;
const WALLS=[
 ['wing-a',WING,0,WING+PART,4.65],['wing-b',WING,5.65,WING+PART,UD],
 ['bath-a',WING+PART,BATH_V,11.9,BATH_V+PART],['bath-b',12.8,BATH_V,UW,BATH_V+PART],
 ['bed-a',WING+PART,CORR_V,10.6,CORR_V+PART],['bed-b',11.5,CORR_V,UW,CORR_V+PART]];
const DOORS=[['wing',WING+PART/2,5.15,1,1.0],['bath',12.35,BATH_V+PART/2,0,.9],['bed',11.05,CORR_V+PART/2,0,.9]]; // [id,u,v,axis(1: wall along v),width]
function layout(design){
 const D=DESIGNS[design];if(!D)return[];const out=[];const add=(...a)=>{const it=I(...a);out.push(it);return it;};
 // Kitchen along the back wall: a run of base cabinets with the sink and the hob, a tall bank with the fridge and
 // the ovens, an island with stools on the dining side.
 add('counter',D.island,6.05,.33,0,4.9,.66,.92);
 add('tall',D.island,9.37,.33,0,1.75,.66,2.4);
 add('island',D.island,6.5,2.6,0,3.8,1.0,.92);
 for(const u of[5.3,6.5,7.7])add('stool',design,u,3.62,2,.44,.44,.78);
 // The hall by the lift: a console against the party wall with a mirror over it.
 add('console',design,.2,2.05,1,1.3,.38,.82);
 // Dining.
 if(D.dining==='round4'){add('table','round',2.9,6.1,0,1.3,1.3,.75);for(const[x,z,r]of[[2.9,5.15,0],[2.9,7.05,2],[1.95,6.1,1],[3.85,6.1,3]])add('chair',design,x,z,r,.5,.52,.86);}
 else{const long=D.dining==='oval6'?2.4:2.3;add('table',D.dining,2.9,6.1,0,long,1.05,.75);for(const u of[2.25,3.55])for(const[z,r]of[[5.22,0],[6.98,2]])add('chair',design,u,z,r,.5,.52,.86);add('chair',design,1.48,6.1,1,.5,.52,.86);add('chair',design,4.32,6.1,3,.5,.52,.86);}
 // Living room: the television on the party wall, the seating facing it, a rug, a coffee table.
 add('media',design,.25,10.9,1,3.0,.48,.55);add('tv',design,.06,10.9,1,1.95,.08,1.12,false,{y:.95});
 if(D.sofa==='u'){add('sofa','u',4.15,10.9,3,3.8,1.0,.78,true,{c:[[3.65,9.0,4.65,12.8,0,.78],[2.0,9.0,3.65,9.95,0,.78],[2.0,11.85,3.65,12.8,0,.78]]});add('coffee',design,2.25,10.9,1,1.3,.9,.4);}
 else if(D.sofa==='pair'){add('sofa','straight',2.45,9.3,0,2.4,.95,.8);add('sofa','straight',2.45,12.6,2,2.4,.95,.8);add('coffee',design,2.45,10.95,0,1.25,.8,.42);}
 else if(D.sofa==='curved'){add('sofa','curved',3.9,10.9,3,3.6,1.3,.76,true,{c:[[3.65,10.4,4.7,11.4,0,.76],[3.35,9.9,4.6,10.4,0,.76],[3.35,11.4,4.6,11.9,0,.76],[2.95,9.05,4.35,9.9,0,.76],[2.95,11.9,4.35,12.75,0,.76]]});add('coffee',design,2.2,10.9,1,1.1,1.1,.38);}
 else if(D.sofa==='straight'||D.sofa==='chesterfield'){add('sofa',D.sofa,4.05,10.9,3,3.0,.98,.82);add('coffee',design,2.25,10.9,1,1.2,.75,.42);add('armchair',design,2.1,8.75,0,.85,.85,.8);}
 else{add('sofa',D.sofa==='modular'?'modular':'l',4.1,10.9,3,3.6,1.0,.76,true,{c:[[3.6,9.1,4.6,12.7,0,.76],[2.05,11.75,3.6,12.7,0,.76]]});add('coffee',design,2.15,10.35,1,1.3,.8,.4);}
 add('rug',design,2.55,10.9,1,4.4,4.0,.02,false);
 add('side',design,4.25,8.6,3,.5,.5,.55);add('lamp',design,4.25,8.6,3,.3,.3,.62,false,{y:.55});
 add('floorlamp',design,.55,13.2,1,.45,.45,1.75);
 // By the glass: two lounge chairs facing each other over a small table, or one with a lamp.
 if(D.lounge==='pair'){add('armchair',design,6.55,12.55,1,.85,.85,.8);add('armchair',design,8.75,12.55,3,.85,.85,.8);add('side',design,7.65,12.95,0,.5,.5,.5);}
 else{add('armchair',design,7.6,12.4,0,.9,.9,.8);add('side',design,8.65,12.6,0,.5,.5,.5);}
 add('plant',design,9.75,13.25,0,.7,.7,1.9);add('plant',design,.6,7.9,1,.5,.5,1.2);
 // The corner between the dining table and the bedroom wall: each design has something of its own here.
 if(D.corner==='fireplace')add('fireplace',design,10.06,7.9,3,2.4,.48,1.1);
 else if(D.corner==='bar')add('bar',design,10.0,7.6,3,2.2,.6,1.05);
 else if(D.corner==='piano')add('piano',design,7.8,6.6,3,1.5,1.9,1.0);
 else if(D.corner==='desk'){add('desk',design,9.9,7.0,3,1.5,.7,.75);add('chair','desk',9.25,7.0,1,.55,.55,.9);}
 else if(D.corner==='bookcase')add('bookcase',design,10.1,7.4,3,3.2,.38,2.6);
 else if(D.corner==='wine')add('winewall',design,10.08,7.2,3,2.6,.42,2.6);
 else if(D.corner==='hanging')add('hanging',design,8.8,7.4,3,1.0,1.0,1.9);
 else if(D.corner==='niche')add('sideboard',design,10.05,7.2,3,2.4,.48,.82);
 else if(D.corner==='sculpture')add('sculpture',design,8.6,7.0,0,.7,.7,1.6);
 else add('chaise',design,8.4,7.2,0,.7,1.7,.8);
 add('art',design,.04,6.1,1,1.6,.04,1.1,false,{y:1.35});add('art',design,10.24,10.6,3,1.4,.04,1.0,false,{y:1.35});
 // Bedroom: the bed against the wing wall facing the outer wall, the sea on its right.
 add('bed',D.bed,11.52+(D.bed==='canopy'?.05:0),9.7,1,2.0,2.2,.55,true,{c:[[WING+PART,8.7,12.62,10.7,0,.58],[WING+PART,8.7,10.62,10.7,0,1.2]]});
 for(const v of[8.15,11.25])add('nightstand',design,10.75,v,1,.5,.45,.52);
 for(const v of[8.15,11.25])add('lamp',design,10.75,v,1,.28,.28,.55,false,{y:.52});
 add('wardrobe',design,13.2,6.15,0,3.0,.6,2.5);
 add('bench',design,13.0,9.7,1,1.4,.45,.46);
 add('armchair',design,13.95,12.6,3,.8,.8,.8);
 add('rug',design,12.3,9.7,1,3.0,3.4,.02,false);
 add('art',design,10.46,9.7,1,1.5,.04,.8,false,{y:1.55});
 add('dresser',design,14.52,9.7,3,1.6,.5,.8);add('art',design,14.76,9.7,3,1.1,.04,.75,false,{y:1.4});
 // Bathroom.
 add('shower',design,13.9,.95,0,1.8,1.9,2.1,true,{c:[/* V11.1: the fixed pane is by the outer wall; the way in is 0.82 m wide, beside the long pane */[13.85,1.85,14.8,1.93,0,2.1],[12.95,.05,13.03,1.93,0,2.1]]});
 add('tub',design,11.6,.43,0,2.25,.85,.58);
 add('toilet',design,10.82,2.9,1,.42,.66,.46);/* V11.3: solid only as high as the seat (0.44 m) */
 add('vanity',design,14.5,3.2,3,2.0,.56,.86);
 add('plant',design,11.2,4.0,0,.4,.4,.8);
 // The short corridor of the wing: a linen cupboard at the end.
 add('cabinet',design,14.55,5.15,3,1.0,.46,1.9);
 return out;}
// The solid boxes of an item in home coordinates [u0,v0,u1,v1,y0,y1].
function solids(it){
 if(!it.s)return[];if(it.c)return it.c;const across=it.r%2===1;const hw=(across?it.d:it.w)/2,hd=(across?it.w:it.d)/2,y0=it.y||0;
 return[[it.x-hw,it.z-hd,it.x+hw,it.z+hd,y0,y0+it.h]];}
// ---- the solid building -----------------------------------------------------------------------------------------------
const layoutCache={};const layoutOf=k=>layoutCache[k]||(layoutCache[k]=DESIGNS[k].fitted?layout(k):[]);
// the beach-front buildings, placed with the island
function install(world,api){
 world.apartments=world.apartments||[];world.apartmentLots=world.apartmentLots||[];
 for(const s of SITES)if(!inland(s))placeSite(world,s,api);
 return world.apartments;}
// V9.7: the inland buildings, placed in the world's last pass: the look-only buildings and props on each plot (the
// building, the plaza in front and the car park behind) go first. Places (restaurants, shops) are never touched.
function installInland(world,api){
 const removeBox=api.removeBox,svc=new Set((world.services||[]).map(q=>q.id)),removed=[];world.apartments=world.apartments||[];world.apartmentLots=world.apartmentLots||[];
 for(const s of SITES){if(!inland(s))continue;const Z=zfOf(s),x0=s[2]-HW-.5,x1=s[2]+HW+3,z0=Z-34,z1=Z+2.5;
  const over=b=>b.x+(b.w||0)/2>x0+.5&&b.x-(b.w||0)/2<x1-.5&&b.z+(b.d||0)/2>z0+.5&&b.z-(b.d||0)/2<z1-.5;
  for(let i=world.buildings.length-1;i>=0;i--){const b=world.buildings[i];if(b.interior||b.customHome||b.apartment||b.house||svc.has(b.id)||!over(b))continue;
   for(const c of world.colliders.filter(c=>c.id===b.id||String(c.id).startsWith(b.id+':')||c.buildingId===b.id))removeBox(c);world.buildings.splice(i,1);removed.push(b.id);}
  for(let i=world.props.length-1;i>=0;i--){const p=world.props[i];if(String(p.id).startsWith('destructible-')||p.x<x0||p.x>x1||p.z<z0||p.z>z1)continue;
   for(const c of world.colliders.filter(c=>c.id===p.id||(p.collisionIds||[]).includes(c.id)))removeBox(c);world.props.splice(i,1);}
  placeSite(world,s,api);}
 world.inlandApartmentsReplaced=removed;return removed;}
function placeSite(world,s,api){
 const box=api.box,surface=api.surface,part=api.part,ZF=zfOf(s),LOT=lotOf(s);
 {const[id,name,cx,design]=s;
  const B=(key,x0,x1,y0,y1,z0,z1,material='masonry',extra={})=>box(id+':'+key,cx+(x0+x1)/2,G+y0,ZF+(z0+z1)/2,x1-x0,y1-y0,z1-z0,material,{architecturePart:true,buildingId:id,apartment:id,...extra});
  // the lobby floor and the slabs between the floors (people stand on them)
  B('lobby-floor',-HW,HW,-.12,0,-DEEP,0,'masonry',{floor:true,roofSupport:true});
  for(let f=1;f<=FLOORS+1;f++){const y=FIRST+STEP*(f-1);B('slab-'+f,-HW,HW,y-SLAB,y,-DEEP,0,'masonry',{floor:true,roofSupport:true});}
  // outer walls, full height: the two ends, the back (with a gap for each lift door) and the wall between the homes
  const top=ROOF+PARAPET;
  for(const k of[-1,1]){B('end'+k,k<0?-HW:HW-.3,k<0?-HW+.3:HW,0,top,-DEEP,0);}
  for(const k of[-1,1]){const a=.1+LIFT.u0,b=.1+LIFT.u1;
   B('back-out'+k,k<0?-HW:b,k<0?-b:HW,0,top,-DEEP,BACK);B('back-in'+k,k<0?-a:.1,k<0?-.1:a,0,top,-DEEP,BACK);
   B('lobby-lift'+k,k<0?-b:a,k<0?-a:b,0,FIRST,-DEEP,BACK);
   for(let f=1;f<=FLOORS;f++){const y=level(f);B('lintel'+k+'-'+f,k<0?-b:a,k<0?-a:b,y+2.25,y+STEP,-DEEP,BACK);}}
  B('party',-.1,.1,FIRST-SLAB,ROOF,-DEEP,0);
  // the glass across the sea side, floor to roof, and the lobby front with its doorway
  B('glass',-HW,HW,FIRST-SLAB,ROOF,GLASS_Z-.05,GLASS_Z+.05,'glass');
  B('front-w',-HW,-1.7,0,FIRST-SLAB,GLASS_Z-.05,GLASS_Z+.05,'glass');B('front-e',1.7,HW,0,FIRST-SLAB,GLASS_Z-.05,GLASS_Z+.05,'glass');B('front-head',-1.7,1.7,2.7,FIRST-SLAB,GLASS_Z-.05,GLASS_Z+.05,'glass');
  // the lift shafts behind the building: outer walls, and in each shaft a car floor and roof at every floor
  B('core-back',-CORE.x,CORE.x,0,top+1.2,CORE.z,CORE.z+.3);for(const k of[-1,1])B('core-side'+k,k<0?-CORE.x:CORE.x-.3,k<0?-CORE.x+.3:CORE.x,0,top+1.2,CORE.z,-DEEP);
  B('core-mid',-.55,.55,0,top+1.2,CORE.z,-DEEP);B('core-roof',-CORE.x,CORE.x,top+1.2,top+1.5,CORE.z,-DEEP);
  for(const k of[-1,1])for(let f=1;f<=FLOORS;f++){const y=level(f),a=.1+LIFT.c0,b=.1+LIFT.c1;B('car-floor'+k+'-'+f,k<0?-b:a,k<0?-a:b,y-.2,y,CORE.z+.3,-DEEP,'metal',{floor:true,roofSupport:true});B('car-roof'+k+'-'+f,k<0?-b:a,k<0?-a:b,y+2.5,y+2.62,CORE.z+.3,-DEEP,'metal');}
  // the roof parapet
  for(const[key,x0,x1,z0,z1]of[['par-s',-HW,HW,-.35,0],['par-n',-HW,HW,-DEEP,-DEEP+.3]])B(key,x0,x1,ROOF,ROOF+PARAPET,z0,z1);
  // the lobby: the walls of the rooms either side (a residents' gym to the west, the mail room and lounge to the east),
  // the concierge desk and the seating
  for(const k of[-1,1]){B('lobby-wall'+k,k<0?-8.2:8.0,k<0?-8.0:8.2,0,FIRST-SLAB,-DEEP,-.3);}
  B('desk',-6.4,-4.2,0,1.1,-6.4,-5.6,'wood');B('desk-back',-7.9,-7.4,0,2.2,-9,-3,'wood');
  B('sofa-l',3.9,6.7,0,.8,-5.9,-5.0,'cloth');B('sofa-r',3.9,6.7,0,.8,-9.4,-8.5,'cloth');B('lobby-table',4.7,5.9,0,.42,-7.6,-6.8,'stone');
  for(const[k,x]of[['p1',-7.4],['p2',7.4]])B('planter-'+k,x-.4,x+.4,0,.9,-1.3,-.5,'stone');
  // the homes: walls inside and the furniture of the building's design (designs not fitted yet have the walls only)
  const L=layoutOf(design);
  for(let f=1;f<=FLOORS;f++)for(const side of['w','e']){const n=unitNumber(f,side),k=sideSign(side),y=level(f);
   const U=(key,u0,u1,y0,y1,v0,v1,material='masonry',extra={})=>{const a=k*(u0+.1),b=k*(u1+.1);B(n+':'+key,Math.min(a,b),Math.max(a,b),y+y0,y+y1,BACK+v0,BACK+v1,material,extra);};
   for(const[key,u0,v0,u1,v1]of WALLS)U(key,u0,u1,0,CEIL,v0,v1);
   for(const[key,u,v,axis,w]of DOORS){if(axis)U(key+'-head',u-PART/2,u+PART/2,2.25,CEIL,v-w/2,v+w/2);else U(key+'-head',u-w/2,u+w/2,2.25,CEIL,v-PART/2,v+PART/2);}
   L.forEach((it,i)=>solids(it).forEach((c,j)=>U('f'+i+'-'+j,c[0],c[2],c[4],c[5],c[1],c[3],it.k==='rug'?'cloth':['sofa','armchair','bed','bench','chaise'].includes(it.k)?'cloth':['shower','tv','winewall'].includes(it.k)?'glass':'wood',{furniture:true})));}
  // the car park behind (tarmac, a line between every two bays, the stop line, the sign) and the path round to the front
  const x0=cx-HW,x1=cx+HW,n=Math.floor((x1-x0-.4)/2.6),mid=cx,bays=Array.from({length:n},(_,i)=>({x:+(mid-n*1.3+1.3+i*2.6).toFixed(2),z:+(LOT.z1-LOT.bayDepth/2).toFixed(2)}));
  const lot={id:'carpark-'+id,place:id,x0,x1,z0:LOT.z0,z1:LOT.z1,y:2.58,bayDepth:LOT.bayDepth,dir:-1,bays};world.apartmentLots.push(lot);
  if(surface){surface(lot.id,[{x:mid,y:lot.y,z:lot.z0},{x:mid,y:lot.y,z:lot.z1}],x1-x0,'#7c8386');surface(id+':path',[{x:x1+1.8,y:2.6,z:LOT.z0+1},{x:x1+1.8,y:2.6,z:ZF+1.2}],1.8,'#d8d0bd');surface(id+':plaza',[{x:cx,y:2.6,z:ZF},{x:cx,y:2.6,z:ZF+1.2}],7,'#d8d0bd');}
  if(part){for(let i=0;i<=n;i++)part(lot.id+':line:'+i,'#eef0e8',bays[0].x-1.3+i*2.6,lot.y+.015,lot.z1-lot.bayDepth/2,.12,.02,lot.bayDepth,false);
   part(lot.id+':stop','#eef0e8',mid,lot.y+.015,lot.z1-lot.bayDepth,n*2.6,.02,.12,false);
   part(lot.id+':post','#59646a',x0+.7,lot.y+1.5,lot.z0+.4,.14,3,.14);part(lot.id+':sign','#1f5fa8',x0+.7,lot.y+2.7,lot.z0+.4,1.1,.8,.08,false);part(lot.id+':p','#f4f6f2',x0+.7,lot.y+2.7,lot.z0+.35,.36,.5,.02,false);}
  const b={id,name,design,designName:DESIGNS[design].name,x:cx,y:G,z:ZF-DEEP/2,zf:ZF,w:HW*2,d:DEEP,h:ROOF+PARAPET,roofY:G+ROOF,style:'apartment',customHome:true,apartment:true,interior:false,district:inland(s)?'old-quay':'palmstrand',inland:inland(s),lot:lot.id};
  world.apartments.push(b);world.buildings.push(b);}
 return world.apartments;}
function lots(){const out=[];for(const s of SITES){const x0=s[2]-HW,x1=s[2]+HW,n=Math.floor((x1-x0-.4)/2.6),L=lotOf(s);out.push({id:'carpark-'+s[0],place:s[0],x0,x1,z0:L.z0,z1:L.z1,y:2.58,bayDepth:L.bayDepth,dir:-1,bays:Array.from({length:n},(_,i)=>({x:+(s[2]-n*1.3+1.3+i*2.6).toFixed(2),z:+(L.z1-L.bayDepth/2).toFixed(2)}))});}return out;}
// ---- owning a home ---------------------------------------------------------------------------------------------------------
// profile.apartments = {units:[ids]}. Only ids of real homes are kept; at most every home once.
function normalize(input){const all=new Set(allUnits()),units=[];for(const id of(input&&Array.isArray(input.units)?input.units:[]).slice(0,80)){if(typeof id==='string'&&all.has(id)&&!units.includes(id))units.push(id);}const out={units};/* V9.4: the mansion bought in the real estate app, and the home you start at */if(input&&input.mansion===true)out.mansion=true;/* V10.7: the first house, bought in Story */if(input&&input.home===true)out.home=true;const s=input&&input.start;/* V9.5: the houses you own (house-1 ...), and a house as the home you start at */const houses=[];for(const id of(input&&Array.isArray(input.houses)?input.houses:[]).slice(0,200)){if(typeof id==='string'&&/^house-\d{1,3}$/.test(id)&&!houses.includes(id))houses.push(id);}if(houses.length)out.houses=houses;/* V15.3: the hill mansions you own (villa-1 ...) */const villas=[];for(const id of(input&&Array.isArray(input.villas)?input.villas:[]).slice(0,20)){if(typeof id==='string'&&/^villa-[1-9]$/.test(id)&&!villas.includes(id))villas.push(id);}if(villas.length)out.villas=villas;
/* V15.6: the first house and the Old Quay mansion are gone, so 'home' and 'mansion' are no longer places to start */if(typeof s==='string'&&(all.has(s)||houses.includes(s)||villas.includes(s)))out.start=s;return out;}
const ownedList=sim=>(sim&&sim.profile&&sim.profile.apartments&&Array.isArray(sim.profile.apartments.units))?sim.profile.apartments.units:[];
const owns=(sim,id)=>ownedList(sim).includes(id);
const fitted=siteId=>{const s=site(siteId);return!!(s&&DESIGNS[s[3]].fitted);};
function buy(sim,id){
 const p=parseUnit(id);if(!p)return{ok:false,message:'There is no such home.'};
 if(sim.onlineRoom)return{ok:false,message:'Homes in online rooms come with the next update.'};
 if(owns(sim,id))return{ok:false,message:'This home is already yours.'};
 if(!fitted(p.site))return{ok:false,message:'The homes in this building are still being fitted out.'};
 if(!(sim.profile.wallet>=PRICE))return{ok:false,message:'You need $500,000 for this home.'};
 const s=site(p.site);if(!sim.commit('apartment:'+id,-PRICE,('Home '+p.number+', '+s[1]).slice(0,80)))return{ok:false,message:'The payment did not go through.'};
 const a=normalize(sim.profile.apartments);a.units.push(id);sim.profile.apartments=a;sim.dirty=true;
 return{ok:true,message:'Home '+p.number+' at '+s[1]+' is yours.'};}
return{PRICE,G,ZF,HW,DEEP,CORE,FIRST,STEP,CEIL,FLOORS,SLAB,UW,UD,BACK,GLASS_Z,ROOF,PARAPET,LIFT,LOT,SITES,DESIGNS,WALLS,DOORS,WING,PART,BATH_V,CORR_V,
 site,level,unitNumber,unitFrom,unitId,parseUnit,allUnits,toWorld,homeToWorld,homeYaw,sideSign,unitAt,arrival,lobby,layout,solids,install,lots,normalize,owns,ownedList,fitted,buy,/* V9.7 */zfOf,inland,lotOf,installInland};
});
