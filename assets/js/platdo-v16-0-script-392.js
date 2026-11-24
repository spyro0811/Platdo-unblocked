
/* PLATDO City houses (V9.5). Shared by the game and the multiplayer host.
 * Every building in the City that looked like a house but was only for show is now a real house: the same plot, a
 * detached two-storey family house facing its street, with a front garden, a path and a porch, and inside a living
 * room, a dining area, a kitchen with an island, a downstairs toilet, stairs, three bedrooms and a bathroom.
 * - The houses are found in the world as it is built (the old look-only houses, style 'townhouse'), so the host and
 *   the game always agree; each gets a fixed id ('house-1' ...) and an address from its street.
 * - One plan for all of them, five looks outside and the ten interior designs of the apartments inside, chosen from
 *   the house's id, so neighbours differ. layout(design) lists the furniture in the house's own coordinates (x across
 *   the front, z towards the street, y up), so what is drawn is also what you bump into.
 * - The front door is solid unless the house is yours (in Sandbox and Story the game opens it for you; online the
 *   houses stay closed for now). A house costs $250,000 of game money.
 * The look is in city-house-look.js (outside) and city-apt-rooms.js (inside, with the apartments' furniture). */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityHouses=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const PRICE=250000;
// The house in its own coordinates: x across (-6.6..6.6), z from the back (-5.2) to the front (5.2), y from the floor.
const HX=6.6,HZ=5.2,T=.25,IX=HX-T,IZ=HZ-T,UP=3.3,CEIL=3.0,CEIL2=6.1,ROOF=6.35,LIFT=.15;
// Openings in the outer walls: [wall, from, to, bottom, top]; walls 'f','b' run along x, 'l','r' along z.
const DOOR=[-.5,.5,0,2.2];
const WINDOWS=[['f',-4.6,-2.2,.7,2.4],['f',2.2,4.6,.7,2.4],['f',-4.4,-2.0,4.0,5.6],['f',2.2,4.6,4.0,5.6],
 ['b',-4.4,-2.0,.5,2.4],['b',1.1,2.3,1.2,2.3],['b',0,1.4,4.0,5.6],
 ['l',-3.8,-1.8,.7,2.4],['l',-3.6,-2.6,4.6,5.5],['l',1.8,3.4,4.2,5.6],
 ['r',-1.6,.2,.8,2.4],['r',-4.2,-3.4,1.6,2.2],['r',.6,2.2,4.0,5.6],['r',-3.8,-2.2,4.0,5.6]];
// The stairs: along the left wall, from the front (bottom) to the back (top), with room at the foot to step on from the side.
const STAIR={x0:-IX,x1:-5.25,z0:4.05,z1:.2,steps:16};
// Walls inside: [id, x0, z0, x1, z1, floor (0 or 1)], each with its door openings already cut out.
const PART=.12;
const WALLS=[
 ['wc-a',4.48,-IZ,4.6,-2.6,0],['wc-b',4.6,-2.6,4.95,-2.48,0],['wc-c',5.75,-2.6,IX,-2.48,0],
 ['f1',-5.25,.2,-3.6,.32,1],['f2',-2.7,.2,2.0,.32,1],['f3',2.9,.2,IX,.32,1],
 ['b1',-IX,-1.52,-3.6,-1.4,1],['b2',-2.7,-1.52,2.0,-1.4,1],['b3',2.9,-1.52,IX,-1.4,1],
 ['void',-5.25,.32,-5.13,IZ,1],['mid-f',1.0,.32,1.12,IZ,1],['mid-b',-1.12,-IZ,-1.0,-1.52,1]];
const DOORS=[['wc',5.35,-2.54,0,.8,0],['bed1',-3.15,.26,0,.9,1],['bed2',2.45,.26,0,.9,1],['bath',-3.15,-1.46,0,.9,1],['bed3',2.45,-1.46,0,.9,1]]; // [id, x, z, axis (0: wall along x), width, floor]
const STYLES=['stucco','clapboard','brick','modern','craftsman'];
const DESIGNS=['coastal','warm','noir','mediterranean','california','loft','nordic','minimal','designer','stone'];
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
// ---- the furniture (the apartments' pieces, placed for the house) -------------------------------------------------------
const I=(k,t,x,z,r,w,d,h,s=true,extra)=>({k,t,x,z,r,w,d,h,s,...extra});
function layout(design){
 const D=(root.CityApartments&&root.CityApartments.DESIGNS[design])||{sofa:'l',dining:'rect6',island:'wood',bed:'upholstered',corner:'lounge'},out=[],add=(...a)=>{const it=I(...a);out.push(it);return it;},U=UP;
 // ground floor: the living room across the front, the television on the right wall
 add('media',design,6.1,1.4,3,2.4,.45,.55);add('tv',design,6.33,1.4,3,1.7,.08,.98,false,{y:.95});
 if(D.sofa==='straight'||D.sofa==='chesterfield'||D.sofa==='pair')add('sofa',D.sofa==='pair'?'straight':D.sofa,2.9,1.4,1,2.8,.95,.8);
 else add('sofa','l',2.9,1.4,1,2.8,.95,.78,true,{c:[[2.42,.0,3.38,2.8,0,.78],[3.38,.0,4.93,.95,0,.78]]});
 add('coffee',design,4.5,1.8,1,1.0,.8,.4);add('rug',design,4.3,1.4,1,3.2,3.0,.02,false);
 /* a reading corner at the front window, backs to it, leaving the way from the stairs to the door clear */add('armchair',design,-3.75,4.4,2,.85,.85,.8);add('armchair',design,-1.85,4.4,2,.85,.85,.8);add('side',design,-2.8,4.62,0,.45,.45,.5);
 add('floorlamp',design,1.6,3.9,0,.4,.4,1.7);add('plant',design,6.05,-.6,0,.5,.5,1.6);add('plant',design,5.9,4.4,0,.5,.5,1.2);
 add('art',design,6.33,3.6,3,1.0,.04,.7,false,{y:1.4});
 // dining at the back left, the kitchen at the back right
 if(D.dining==='round4'){add('table','round',-3.2,-2.9,0,1.2,1.2,.75);for(const[x,z,r]of[[-3.2,-3.8,0],[-3.2,-2.0,2],[-4.1,-2.9,1],[-2.3,-2.9,3]])add('chair',design,x,z,r,.5,.52,.86);}
 else{add('table',D.dining==='trestle'?'trestle':D.dining==='oval6'?'oval6':'rect6',-3.2,-2.9,0,2.0,.95,.75);for(const x of[-3.75,-2.65])for(const[z,r]of[[-3.72,0],[-2.08,2]])add('chair',design,x,z,r,.5,.52,.86);}
 add('counter',D.island,2.25,-IZ+.33,0,3.9,.66,.92,true,{lowSplash:true});add('tall',D.island,4.14,-3.32,3,1.75,.66,2.3,true,{c:[[3.81,-4.195,4.47,-2.445,0,2.3]]});
 add('island',D.island,1.9,-2.3,0,2.4,.9,.92);for(const x of[1.25,2.55])add('stool',design,x,-1.45,2,.42,.42,.78);
 // the downstairs toilet
 add('toilet',design,5.95,-4.3,3,.4,.62,.46);/* V11.3: solid only as high as the seat (0.44 m) */add('vanity',design,5.0,-IZ+.25,0,.7,.45,.85);
 // upstairs: the main bedroom at the front left, the second at the front right, the third at the back right, the bathroom at the back left
 add('bed',D.bed,-1.2,1.45,0,1.8,2.1,.55,true,{y:U,c:[[-2.1,.32,-.3,2.5,U,U+.58],[-2.1,.32,-.3,.52,U,U+1.2]]});
 for(const x of[-2.45,.05])add('nightstand',design,x,.6,0,.45,.42,.52,true,{y:U});for(const x of[-2.45,.05])add('lamp',design,x,.6,0,.26,.26,.5,false,{y:U+.52});
 add('wardrobe',design,-4.83,2.6,1,2.4,.6,2.4,true,{y:U});add('bench',design,-1.2,2.8,0,1.3,.42,.45,true,{y:U});add('armchair',design,-3.6,4.2,2,.8,.8,.8,true,{y:U});add('art',design,-1.2,.36,0,1.2,.04,.7,false,{y:U+1.45});
 add('bed',D.bed==='canopy'?'upholstered':D.bed,4.0,1.4,0,1.6,2.0,.55,true,{y:U,c:[[3.2,.32,4.8,2.4,U,U+.58],[3.2,.32,4.8,.52,U,U+1.2]]});
 add('nightstand',design,5.15,.6,0,.45,.42,.52,true,{y:U});add('lamp',design,5.15,.6,0,.26,.26,.5,false,{y:U+.52});add('wardrobe',design,6.05,3.4,3,1.8,.6,2.4,true,{y:U});add('desk',design,2.4,4.55,2,1.3,.6,.75,true,{y:U});add('chair','desk',2.4,3.9,0,.52,.52,.9,true,{y:U});
 add('bed',D.bed==='canopy'?'upholstered':D.bed,3.8,-3.95,0,1.6,2.0,.55,true,{y:U,c:[[3.0,-IZ,4.6,-2.95,U,U+.58],[3.0,-IZ,4.6,-4.75,U,U+1.2]]});
 add('nightstand',design,2.3,-4.7,0,.45,.42,.52,true,{y:U});add('wardrobe',design,-.7,-3.3,1,1.8,.6,2.4,true,{y:U});add('plant',design,5.8,-2.0,0,.45,.45,1.0,true,{y:U});
 add('tub',design,-5.9,-3.25,1,1.6,.75,.58,true,{y:U});add('vanity',design,-3.5,-IZ+.28,0,1.5,.52,.86,true,{y:U});add('toilet',design,-1.55,-2.6,3,.4,.62,.46,true,{y:U});add('cabinet',design,-1.55,-4.5,3,.6,.4,1.8,true,{y:U});
 return out;}
function solids(it){if(!it.s)return[];if(it.c)return it.c;const across=it.r%2===1,hw=(across?it.d:it.w)/2,hd=(across?it.w:it.d)/2,y0=it.y||0;return[[it.x-hw,it.z-hd,it.x+hw,it.z+hd,y0,y0+it.h]];}
// ---- from the house to the world ----------------------------------------------------------------------------------------
// r: which way the front faces (0 +z, 1 +x, 2 -z, 3 -x)
function toWorld(h,x,y,z){const r=h.r,c=[1,0,-1,0][r],s=[0,1,0,-1][r];return{x:h.x+x*c+z*s,y:h.y+y,z:h.z-x*s+z*c};}
function toLocal(h,x,y,z){const r=h.r,c=[1,0,-1,0][r],s=[0,1,0,-1][r],dx=x-h.x,dz=z-h.z;return{x:dx*c-dz*s,y:y-h.y,z:dx*s+dz*c};}
const yawOf=h=>h.r*Math.PI/2;
function boxWorld(h,x0,x1,y0,y1,z0,z1){const a=toWorld(h,x0,y0,z0),b=toWorld(h,x1,y1,z1);return{x0:Math.min(a.x,b.x),x1:Math.max(a.x,b.x),z0:Math.min(a.z,b.z),z1:Math.max(a.z,b.z),y0:a.y,y1:b.y};}
// ---- the houses -----------------------------------------------------------------------------------------------------------
const NAMES=['Rosewood','Harbor View','Maple','Seabreeze','Juniper','Laurel','Linden','Hawthorn','Bayberry','Cypress','Willow','Saltmarsh'];
function install(world,api){
 const box=api.box,removeBox=api.removeBox;world.houses=[];
 const old=world.buildings.filter(b=>b.style==='townhouse'&&!b.customHome&&!b.apartment&&!b.house).sort((a,b)=>{/* V11.8: a moved house keeps the place in the order it had */const p=a.sortDistrict||a.district,q=b.sortDistrict||b.district;return(p<q?-1:p>q?1:0)||(a.sortX??a.x)-(b.sortX??b.x)||/* V12.5 */(a.sortZ??a.z)-(b.sortZ??b.z);});
 const roads=world.roads.filter(r=>r.a&&r.b&&(!r.layer||r.layer==='ground'));
 const near=b=>{let best=null;for(const r of roads){const dx=r.b.x-r.a.x,dz=r.b.z-r.a.z,L=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((b.x-r.a.x)*dx+(b.z-r.a.z)*dz)/L)),px=r.a.x+t*dx,pz=r.a.z+t*dz,d=Math.hypot(px-b.x,pz-b.z);if(!best||d<best.d)best={d,px,pz,road:r};}return best;};
 const counters={};
 old.forEach((b,i)=>{
  // take away the look-only building, its solid boxes and anything standing on the plot
  for(const c of world.colliders.filter(c=>c.id===b.id||String(c.id).startsWith(b.id+':')||c.buildingId===b.id))removeBox(c);
  const at=world.buildings.indexOf(b);if(at>=0)world.buildings.splice(at,1);
  const n=near(b),dx=n.px-b.x,dz=n.pz-b.z,r=Math.abs(dx)>Math.abs(dz)?(dx>0?1:3):(dz>0?0:2),depth=r%2?b.w:b.d,toFront=Math.max(0,depth/2-6.5-HZ);
  const fx=[0,1,0,-1][r],fz=[1,0,-1,0][r],cx=b.x+fx*toFront,cz=b.z+fz*toFront,id='house-'+(i+1);
  // the floor stands a little above the highest ground under the house
  let ground=-Infinity,low=Infinity;for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1],[0,0]]){const g=api.terrainHeight(cx+sx*HX,cz+sz*HX);ground=Math.max(ground,g);low=Math.min(low,g);}
  const road=n.road.name||'Lantern Street';counters[road]=(counters[road]||0)+2;const number=counters[road]+(i%2);
  const h={id,x:cx,y:ground+LIFT,z:cz,r,low,front:+(n.d-toFront-(n.road.width||12)/2-2.8).toFixed(2),plot:{x:b.x,z:b.z,w:b.w,d:b.d},district:b.district,street:road,address:number+' '+road,
   name:NAMES[hash(id)%NAMES.length]+' House',style:STYLES[hash(id+'s')%STYLES.length],design:DESIGNS[hash(id+'d')%DESIGNS.length]};
  world.houses.push(h);
  for(let k=world.props.length-1;k>=0;k--){const p=world.props[k];if(String(p.id).startsWith('destructible-'))continue;const q=toLocal(h,p.x,h.y,p.z);if(Math.abs(q.x)<HX+3&&q.z>-HZ-2&&q.z<HZ+3){for(const c of world.colliders.filter(c=>c.id===p.id||(p.collisionIds||[]).includes(c.id)))removeBox(c);world.props.splice(k,1);}}
  const B=(key,x0,x1,y0,y1,z0,z1,material='masonry',extra={})=>{const w=boxWorld(h,x0,x1,y0,y1,z0,z1);return box(id+':'+key,(w.x0+w.x1)/2,w.y0,(w.z0+w.z1)/2,w.x1-w.x0,w.y1-w.y0,w.z1-w.z0,material,{architecturePart:true,buildingId:id,house:id,...extra});};
  // floors (people stand on them): the ground floor, the porch, the upper floor round the stairwell, the roof plate
  B('floor',-HX,HX,-LIFT-(ground-low),0,-HZ,HZ,'masonry',{floor:true,roofSupport:true});B('porch',-1.6,1.6,-LIFT,0,HZ,HZ+1.4,'masonry',{floor:true,roofSupport:true});
  B('up-a',STAIR.x1,HX,CEIL,UP,-HZ,STAIR.z1,'masonry',{floor:true,roofSupport:true});/* over the top of the stairs the floor's solid edge stands back, so you do not catch your head on it on the last steps; the stair line carries you there */B('up-c',-HX,STAIR.x1,CEIL,UP,-HZ,STAIR.z1-.45,'masonry',{floor:true,roofSupport:true});B('up-b',STAIR.x1,HX,CEIL,UP,STAIR.z1,HZ,'masonry',{floor:true,roofSupport:true});B('roof',-HX,HX,CEIL2,ROOF,-HZ,HZ);
  // outer walls, the front one with the doorway; the door itself is a box of its own the game opens for the owner
  B('wall-b',-HX,HX,0,ROOF,-HZ,-IZ);B('wall-l',-HX,-IX,0,ROOF,-IZ,IZ);B('wall-r',IX,HX,0,ROOF,-IZ,IZ);
  B('wall-f1',-HX,DOOR[0],0,ROOF,IZ,HZ);B('wall-f2',DOOR[1],HX,0,ROOF,IZ,HZ);B('wall-f3',DOOR[0],DOOR[1],DOOR[3],ROOF,IZ,HZ);
  B('door',DOOR[0],DOOR[1],0,DOOR[3],IZ,HZ,'wood',{door:true,houseDoor:true});
  // the stairs (marked as stairs: you walk up the smooth line along them, see stairHeight below) and the rail beside them
  for(let k=0;k<STAIR.steps;k++){const run=(STAIR.z0-STAIR.z1)/STAIR.steps,top=(k+1)*UP/STAIR.steps,z1=STAIR.z0-k*run,z0=z1-run;if(k>0)/* the lowest step is low enough to walk onto from the side */B('stair-'+k,STAIR.x0,STAIR.x1,0,top,z0,z1,'wood',{floor:true,stair:true,houseStair:true});}
  B('rail',STAIR.x1-.02,STAIR.x1+.02,0,UP+1.0,STAIR.z1,3.6,'wood');
  for(const[key,x0,z0,x1,z1,f]of WALLS)B(key,x0,x1,f?UP:0,f?CEIL2:CEIL,z0,z1);
  for(const[key,x,z,axis,w,f]of DOORS){const y=(f?UP:0)+2.2,y1=f?CEIL2:CEIL;if(axis)B(key+'-head',x-PART/2,x+PART/2,y,y1,z-w/2,z+w/2);else B(key+'-head',x-w/2,x+w/2,y,y1,z-PART/2,z+PART/2);}
  layout(h.design).forEach((it,j)=>solids(it).forEach((c,m)=>B('f'+j+'-'+m,c[0],c[2],c[4],c[5],c[1],c[3],['sofa','armchair','bed','bench'].includes(it.k)?'cloth':'wood',{furniture:true})));
  world.buildings.push({id,name:h.name,x:cx,y:h.y,z:cz,w:r%2?2*HZ:2*HX,d:r%2?2*HX:2*HZ,h:ROOF+2.5,style:'house',customHome:true,house:true,interior:false,district:b.district});});
 // the height along the stairs of whichever house a point is in (the world asks this as it does for your house)
 const cell=(x,z)=>Math.floor(x/40)+','+Math.floor(z/40),grid=new Map();for(const h of world.houses)for(const dx of[-1,0,1])for(const dz of[-1,0,1]){const k=cell(h.x+dx*20,h.z+dz*20);if(!grid.has(k))grid.set(k,new Set());grid.get(k).add(h);}
 world.houseStairs={stairHeight(x,z,nearY){const s=grid.get(cell(x,z));if(!s)return null;for(const h of s){if(Math.abs(x-h.x)>9||Math.abs(z-h.z)>9)continue;const q=toLocal(h,x,h.y,z);if(q.x<STAIR.x0||q.x>STAIR.x1||q.z<STAIR.z1-.5||q.z>STAIR.z0+.5)continue;/* the line starts half a metre before the first step, at the floor, so you walk onto it, and goes on level at the top for half a metre */const y=h.y+Math.min(UP,Math.max(0,STAIR.z0-q.z)/(STAIR.z0-STAIR.z1)*UP);return y<=nearY+.6?y:null;}return null;}};
 return world.houses;}
// ---- the drive (V13.1) ----------------------------------------------------------------------------------------------------
/* every house's drive reaches the road: straight from beside the house to the pavement, or, for a house in a back row whose
 * straight drive would cross another house's garden, along its own side, across in front of it and out through the gap
 * between the neighbours' gardens. In the house's own coordinates (x across, z toward the street); legs are square to it. */
function drive(world,h){if(h._drive)return h._drive;const end=Math.max(HZ+6.2,h.front||0),W=1.4,X=8.9,boxes=[];
 const local=(x0,x1,z0,z1)=>{const a=toLocal(h,x0,h.y,z0),b=toLocal(h,x1,h.y,z1);return{x0:Math.min(a.x,b.x),x1:Math.max(a.x,b.x),z0:Math.min(a.z,b.z),z1:Math.max(a.z,b.z)};};
 for(const o of world.houses||[]){if(o===h)continue;if(Math.abs(o.x-h.x)>end+40||Math.abs(o.z-h.z)>end+40)continue;const p=o.plot;if(p)boxes.push(local(p.x-p.w/2,p.x+p.w/2,p.z-p.d/2,p.z+p.d/2));const fb=boxWorld(o,-HX-.4,HX+.4,0,1,-HZ-.4,HZ+1.8);boxes.push(local(fb.x0,fb.x1,fb.z0,fb.z1));}
 boxes.push({x0:-HX-.3,x1:HX+.3,z0:-HZ-.3,z1:HZ+1.7});
 const hit=(x0,x1,z0,z1)=>boxes.some(b=>x1>b.x0+.05&&x0<b.x1-.05&&z1>b.z0+.05&&z0<b.z1-.05);
 let pts=[[X,HZ-2.5],[X,end]];
 if(hit(X-W,X+W,HZ-2.5,end)){let z1=HZ+2;for(let z=HZ+2;z<=end;z+=.5){if(hit(X-W,X+W,HZ-2.5,z))break;z1=z;}const tz=Math.max(HZ+2.2,z1-W-.2);let best=null;
  for(let d=.5;d<=40&&!best;d+=.5)for(const s of[1,-1]){const xg=X+s*d;if(hit(Math.min(X,xg)-W,Math.max(X,xg)+W,tz-W,tz+W)||hit(xg-W,xg+W,tz,end))continue;best=xg;break;}
  if(best!==null)pts=[[X,HZ-2.5],[X,tz],[best,tz],[best,end]];}
 return h._drive={local:pts,world:pts.map(([x,z])=>{const p=toWorld(h,x,0,z);return{x:p.x,z:p.z};}),bent:pts.length>2,end};}// ---- which house a point is in ------------------------------------------------------------------------------------------
function houseAt(world,x,y,z){for(const h of world.houses||[]){if(Math.abs(x-h.x)>9||Math.abs(z-h.z)>9)continue;const q=toLocal(h,x,y,z);if(Math.abs(q.x)<=IX+.05&&Math.abs(q.z)<=IZ+.05&&q.y>-.8&&q.y<CEIL2)return{house:h,floor:q.y>=UP-.5?1:0,local:q};}return null;}
function byId(world,id){return(world.houses||[]).find(h=>h.id===id)||null;}
// the spot just outside the front door, facing the house; and just inside it, facing in
function frontDoor(h){const p=toWorld(h,0,0,HZ+1.0);return{...p,yaw:yawOf(h)+Math.PI};}
function inside(h){const p=toWorld(h,0,0,IZ-1.2);return{...p,yaw:yawOf(h)+Math.PI};}
// ---- owning one ---------------------------------------------------------------------------------------------------------------
const ownedList=sim=>(sim&&sim.profile&&sim.profile.apartments&&Array.isArray(sim.profile.apartments.houses))?sim.profile.apartments.houses:[];
const owns=(sim,id)=>ownedList(sim).includes(id);
function buy(sim,id){
 const h=byId(sim.world,id);if(!h)return{ok:false,message:'There is no such house.'};
 if(sim.onlineRoom)return{ok:false,message:'Houses in online rooms come with a later update.'};
 if(owns(sim,id))return{ok:false,message:'This house is already yours.'};
 if(!(sim.profile.wallet>=PRICE))return{ok:false,message:'You need $250,000 for this house.'};
 if(!sim.commit('house:'+id,-PRICE,(h.address).slice(0,80)))return{ok:false,message:'The payment did not go through.'};
 const A=root.CityApartments,a=A?A.normalize(sim.profile.apartments):{units:[]};a.houses=[...(a.houses||[]),id];sim.profile.apartments=A?A.normalize(a):a;sim.dirty=true;
 return{ok:true,message:h.address+' is yours.'};}
return{PRICE,HX,HZ,T,IX,IZ,UP,CEIL,CEIL2,ROOF,LIFT,DOOR,WINDOWS,STAIR,WALLS,DOORS,PART,STYLES,DESIGNS,hash,layout,solids,toWorld,toLocal,yawOf,boxWorld,install,houseAt,byId,frontDoor,inside,ownedList,owns,buy,drive};
});
