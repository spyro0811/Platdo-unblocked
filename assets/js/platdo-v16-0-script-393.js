
/* PLATDO City hill mansions (V15.3). Shared by the game and the multiplayer host (work/server/platdo-city/src/villas.js
 * is the same file).
 * Six white modern mansions stand in a row along the crest of the east hill, on Highcrest Drive, a new road that climbs
 * from Mountain Link across the south face, turns back in one hairpin and runs along the top. Each stands on a level
 * plot on the south side of the road: the front door faces the road, the glass, the terrace and the pool face the city
 * and the sea.
 * - Every mansion has its own floor plan (PLANS): a long bar, a U round a courtyard, a cube with a double-height living
 *   room, an L with a living wing, a single-storey pavilion house with a sky lounge, and a square house round an
 *   atrium. A plan is a list of rooms (rectangles, per floor); the walls, doorways, windows, floors, roofs, rails and
 *   stairs are worked out from it (derive), and each room is furnished from its kind with the apartments' furniture
 *   (the same list is what is drawn and what you bump into, as in houses.js).
 * - In a mansion's own coordinates x runs across, z towards the road (the front), y up from the ground floor.
 * - The front door is solid unless the mansion is yours (alone in Sandbox every one is open). They are bought in
 *   Platdo Estates, Mansions. The look is in city-villa-look.js (outside) and city-villa-rooms.js (inside). */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityVillas=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const T=.3,PART=.14,UP=3.6,CEIL=3.2,CEIL2=6.9,ROOF=7.2,LIFT=.15,DOORH=2.3,RAIL=1.05,STEPS=18,FRONT=8;
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// ---- the road and the plots ---------------------------------------------------------------------------------------------
/* Highcrest Drive: [x, z, height] after its first point, which is the Mountain Link point nearest z = from (world.js
 * joins it there). Leg one climbs east across the south face, the hairpin turns it back west, leg two reaches the west
 * end of the crest and the last leg runs east along the top past the six plots. */
const ROAD={id:'highcrest-drive',name:'Highcrest Drive',from:-81,width:12,speed:9,points:[[-215,-76,10.5],[-180,-70,13.5],[-100,-66,21.5],[0,-66,34],[150,-102,53],[300,-140.5,71.5],[318,-141,73.6],[331,-147,74.8],[335,-158,76],[331,-169,77.2],[318,-175,78.4],[300,-175.5,80.2],[200,-172,90.5],[100,-187,100],[20,-215,106.5],[-25,-240,110],[-32,-260,112.3],[-12,-274,114],[25,-277,115.2],[100,-276,117.3],[200,-276,121],[300,-276,123.6],[392,-276,122.6]]};
const CREST=ROAD.points.slice(-5),PAD={w:50,d:40},SITE_X=[45,107,169,231,293,355],ROAD_Z=-276;
const crestY=x=>{for(let i=1;i<CREST.length;i++)if(x<=CREST[i][0]||i===CREST.length-1){const a=CREST[i-1],b=CREST[i],t=clamp((x-a[0])/(b[0]-a[0]),0,1);return a[2]+(b[2]-a[2])*t;}return CREST[0][2];};
/* the level plots: beside the road (6 m of road, 4 m of pavement and verge), 50 m wide and 40 m deep, at the road's height */
function pads(){return SITE_X.map((x,i)=>({id:'villa-pad-'+(i+1),x,z:ROAD_Z+10+PAD.d/2,w:PAD.w,d:PAD.d,y:+crestY(x).toFixed(2)}));}
// ---- the six plans --------------------------------------------------------------------------------------------------------
/* rooms: [name, kind, floor, x0, z0, x1, z1, {a: the wall the main furniture stands against ('f' front, 'b' back, 'l', 'r'),
 *   x: which side the second piece goes ('l' or 'r' seen with your back to that wall)}]. On floor 1 every part of the
 *   ground floor is covered by a room, a 'void' (open to below), a 'terrace' (a roof you can walk on) or a 'roof'.
 * doors: [room, room, where along their shared wall (optional), width]; open: no wall between the two at all;
 * glass: [room, side, type, where] overrides the usual windows ('full' glass, 'win', 'high', 'none', 'slide' = glass
 *   with a way through); entry: the front door [room, x]; stair: the run {x0,z0,x1,z1,dir: the way up}. */
const PLANS=[
{id:'linea',name:'Casa Linea',design:'minimal',accent:'#8a6a4a',accentKey:'battens',clad:'battens|#b08458',price:1600000,blurb:'A long, low house: one great room behind a wall of glass, four bedrooms above and a roof terrace over the garage.',
 rooms:[['living','living',0,-13,-6,-5,0,{a:'l'}],['dining','dining',0,-5,-6,1,0,{a:'b'}],['kitchen','kitchen',0,1,-6,7,0,{a:'r',u:1.15}],['study','office',0,7,-6,13,-1,{a:'r'}],
  ['library','library',0,-13,0,-7,6,{a:'l'}],['den','cinema',0,-7,0,-2,6,{a:'l'}],['cloakroom','wc',0,-2,3,1,6,{a:'f'}],['pantry','pantry',0,-2,0,1,3,{a:'l'}],['hall','hall',0,1,0,7,6,{a:'f'}],['garage','garage',0,7,-1,13,6,{a:'r'}],
  ['primary','primary',1,-13,-6,-7,1,{a:'l',x:'l'}],['primary bath','bath',1,-13,1,-10,6,{a:'l'}],['dressing room','wardrobe',1,-10,1,-7,6,{a:'r'}],
  ['bedroom 2','bed',1,-7,-6,-2.5,-1,{a:'l'}],['bedroom 3','bed',1,-2.5,-6,2,-1,{a:'l'}],['bedroom 4','bed',1,2,-6,7,-1,{a:'r'}],
  ['landing','corridor',1,-7,-1,7,1],['bathroom','bath',1,-7,1,-4,6,{a:'l'}],['family room','lounge',1,-4,1,5.6,6,{a:'f'}],['stairwell','void',1,5.6,1,7,6],['roof terrace','terrace',1,7,-6,13,6]],
 doors:[['library','living',-10],['den','dining',-3.5],['cloakroom','hall',4.5,.85],['pantry','hall',1.5,.85],['study','kitchen',-5.5],['garage','study',10],
  ['primary','landing',0],['primary bath','primary',-11.5,.85],['dressing room','primary',-8.5,.85],['bedroom 2','landing',-4.75],['bedroom 3','landing',-.25],['bedroom 4','landing',4.5],['bathroom','landing',-5.5,.85]],
 open:[['living','dining'],['dining','kitchen'],['hall','kitchen'],['family room','landing'],['stairwell','landing']],
 glass:[['landing','r','slide',0],['living','b','slide',-9]],entry:['hall',3],stair:{x0:5.6,z0:1,x1:7,z1:5.8,dir:'-z'}},
{id:'cortile',name:'Villa Cortile',design:'coastal',accent:'#3f6f8a',accentKey:'paint',clad:'ashlar|#e4dccd',price:2100000,blurb:'Two wings round a courtyard that opens to the view, with the main bedroom in a wing of its own.',
 rooms:[['living','living',0,-12,-9,-5,7,{a:'l'}],['hall','hall',0,-5,0,1.6,7,{a:'f'}],['gallery','gallery',0,1.6,0,4,4.6],['cloakroom','wc',0,1.6,4.6,4,7,{a:'f'}],['kitchen','kitchen',0,4,0,12,7,{a:'f'}],['dining','dining',0,5,-9,12,0,{a:'r'}],
  ['primary','primary',1,-12,-9,-5,0,{a:'l',x:'r'}],['dressing room','wardrobe',1,-12,0,-5,3,{a:'l'}],['primary bath','bath',1,-12,3,-5,7,{a:'f'}],
  ['stairwell','void',1,-5,2,-3.6,7],['landing','corridor',1,-5,0,12,2],['bedroom 2','bed',1,-3.6,2,1,7,{a:'f'}],['bathroom','bath',1,1,2,3.5,7,{a:'f'}],['bedroom 3','bed',1,3.5,2,8,7,{a:'f'}],['bedroom 4','bed',1,8,2,12,7,{a:'f'}],['roof terrace','terrace',1,5,-9,12,0]],
 doors:[['hall','living',1,1.6],['cloakroom','gallery',2.8,.85],['dressing room','landing',1,.9],['dressing room','primary',-8.5],['primary bath','dressing room',-8.5,.85],['bedroom 2','landing',-1.3],['bathroom','landing',2.25,.85],['bedroom 3','landing',5.75],['bedroom 4','landing',10]],
 open:[['hall','gallery'],['gallery','kitchen'],['kitchen','dining'],['stairwell','landing']],
 glass:[['hall','b','slide',-1.7],['landing','b','slide',8.5],['living','r','full'],['dining','l','full'],['landing','b','full'],['primary','l','high']],entry:['hall',-.4],stair:{x0:-5,z0:2,x1:-3.6,z1:6.8,dir:'-z'}},
{id:'cubo',name:'The Cube',design:'noir',accent:'#22252a',accentKey:'paint',clad:'seam|#2e3135',price:1500000,blurb:'A compact cube with a living room two storeys high and a gallery looking down into it.',
 rooms:[['living','living',0,-8,-7,2,0,{a:'l'}],['dining','dining',0,2,-7,8,0,{a:'r'}],['kitchen','kitchen',0,2,0,8,7,{a:'r'}],['hall','hall',0,-4,0,2,7,{a:'f'}],['cloakroom','wc',0,-6,0,-4,2.5,{a:'b'}],['laundry','laundry',0,-8,0,-6,2.5,{a:'l'}],['garage','garage',0,-8,2.5,-4,7,{a:'l'}],
  ['living void','void',1,-8,-7,2,0],['gallery','gallery',1,-8,0,4.5,1.4],['library','library',1,-8,1.4,-4,7,{a:'l'}],['stairwell','void',1,-4,1.4,-2.6,7],['bedroom 2','bed',1,-2.6,1.4,1.2,7,{a:'f'}],['bathroom','bath',1,1.2,1.4,4.5,7,{a:'f'}],
  ['primary','primary',1,2,-7,8,0,{a:'r',x:'l'}],['primary bath','bath',1,4.5,0,8,7,{a:'r'}]],
 doors:[['hall','kitchen',4,1.4],['cloakroom','hall',.7,.8],['laundry','garage',-7,.85],['laundry','living',-7,.85],['library','gallery',-6],['bedroom 2','gallery',-.7],['bathroom','gallery',2.85,.85],['primary','gallery',3.25],['primary bath','primary',6.25,.85]],
 open:[['hall','living'],['living','dining'],['dining','kitchen'],['stairwell','gallery']],
 glass:[['living','b','slide',-3],['living void','b','full'],['living void','l','full'],['living','l','full']],entry:['hall',-.2],stair:{x0:-4,z0:1.4,x1:-2.6,z1:6.2,dir:'-z'}},
{id:'vista',name:'Vista House',design:'california',accent:'#b9895a',accentKey:'battens',clad:'battens|#c79a68',price:2400000,blurb:'The living room reaches out towards the view with glass on three sides, under a terrace the length of the wing.',
 rooms:[['living','living',0,-13,-9,-4,-3,{a:'l'}],['dining','dining',0,-13,-3,-4,1,{a:'l'}],['kitchen','kitchen',0,-13,1,-6,8,{a:'l'}],['hall','hall',0,-6,1,0,8,{a:'f'}],['lobby','gallery',0,0,1,3,3.5],['cloakroom','wc',0,3,1,5,3.5,{a:'r'}],['cinema','cinema',0,0,3.5,5,8,{a:'f'}],['garage','garage',0,5,1,11,8,{a:'r'}],
  ['terrace','terrace',1,-13,-9,-4,1],['landing','corridor',1,-13,1,11,2.6],['primary','primary',1,-13,2.6,-6.5,8,{a:'l',x:'l'}],['primary bath','bath',1,-6.5,2.6,-3.8,8,{a:'f'}],['study','office',1,-3.8,2.6,-1.4,8,{a:'f'}],['stairwell','void',1,-1.4,2.6,0,8],
  ['bedroom 2','bed',1,0,2.6,4,8,{a:'f'}],['bathroom','bath',1,4,2.6,6.5,8,{a:'f'}],['bedroom 3','bed',1,6.5,2.6,11,8,{a:'f'}]],
 doors:[['hall','lobby',1.8,1],['lobby','cloakroom',2.25,.85],['lobby','cinema',1.5],['cinema','garage',5.75],['primary','landing',-9.75],['primary bath','primary',5.3,.85],['study','landing',-2.6,.9],['bedroom 2','landing',2],['bathroom','landing',5.25,.85],['bedroom 3','landing',8.75]],
 open:[['living','dining'],['dining','kitchen'],['hall','dining'],['stairwell','landing']],
 glass:[['landing','b','slide',-8.5],['living','b','slide',-8.5],['living','r','full'],['dining','r','full']],entry:['hall',-3.6],stair:{x0:-1.4,z0:2.6,x1:0,z1:7.4,dir:'-z'}},
{id:'pavilion',name:'Pavilion House',design:'nordic',accent:'#6e7f6a',accentKey:'paint',clad:'boards|#8f9a86',price:1900000,blurb:'Three pavilions on one level, bedrooms to one side and the kitchen to the other, with a sky lounge up a flight of stairs.',
 rooms:[['primary','primary',0,-14,-7,-5,0,{a:'l',x:'r'}],['dressing room','wardrobe',0,-14,0,-9.5,3,{a:'l'}],['primary bath','bath',0,-14,3,-9.5,7,{a:'l'}],['bedroom hall','gallery',0,-9.5,0,-5,2],['bedroom 2','bed',0,-9.5,2,-5,7,{a:'f'}],
  ['living','living',0,-5,-2,5,5,{a:'f',x:'l'}],['kitchen','kitchen',0,5,-7,14,-2,{a:'r'}],['dining','dining',0,5,-2,14,3,{a:'b',u:6.3,v:1.65}],['cloakroom','wc',0,5,3,8,7,{a:'f'}],['garage','garage',0,8,3,14,7,{a:'r'}],
  ['bedroom roof','roof',1,-14,-7,-5,7],['terrace','terrace',1,-5,-2,5,5],['sky lounge','bar',1,5,-7,14,1.6,{a:'r'}],['roof a','roof',1,5,1.6,7.6,3],['stairwell','void',1,7.6,1.6,12.6,3],['stair landing','landing',1,12.6,1.6,14,3],['roof b','roof',1,5,3,14,7]],
 doors:[['bedroom hall','primary',-7.25],['bedroom hall','bedroom 2',-7.25],['dressing room','primary',-11.75,.85],['primary bath','dressing room',-11.75,.85],['cloakroom','living',4,.85],['garage','dining',13.3,.85]],
 open:[['living','bedroom hall'],['living','dining'],['kitchen','dining'],['stairwell','stair landing'],['stair landing','sky lounge']],
 glass:[['living','b','slide',0],['sky lounge','l','slide',-.2],['primary','b','full'],['kitchen','b','full'],['sky lounge','b','full'],['living','f','win']],entry:['living',0],stair:{x0:7.8,z0:1.6,x1:12.6,z1:3,dir:'+x'}},
{id:'atrio',name:'Atrium House',design:'designer',accent:'#a8873c',accentKey:'paint',clad:'ashlar|#d6c6a6',price:3000000,blurb:'The largest of the six: every room opens off a hall two storeys high, with a gallery running round it upstairs.',
 rooms:[['atrium','atrium',0,-4,-3,4,5,{a:'r'}],['entrance','hall',0,-4,5,4,9,{a:'l'}],['garage','garage',0,-10,3,-4,9,{a:'l'}],['study','office',0,-10,-3,-4,3,{a:'l'}],['living','living',0,-10,-9,2,-3,{a:'l'}],['kitchen','kitchen',0,2,-9,10,-3,{a:'r',u:1.15}],
  ['dining','dining',0,4,-3,10,3,{a:'r'}],['cloakroom','wc',0,4,3,7,5,{a:'r'}],['pantry','pantry',0,7,3,10,5,{a:'r'}],['music room','music',0,4,5,10,9,{a:'r'}],
  ['primary','primary',1,-10,-9,0,-3,{a:'l',x:'l'}],['guest suite','bed',1,0,-9,10,-3,{a:'r'}],['primary bath','bath',1,-10,-3,-4,2,{a:'l'}],['bedroom 2','bed',1,-10,2,-4,9,{a:'l'}],
  ['stair landing','landing',1,-4,-3,-2.6,0],['stairwell','void',1,-4,0,-2.6,5],['back gallery','gallery',1,-2.6,-3,4,-1.6],['atrium void','void',1,-2.6,-1.6,2.6,5],['side gallery','gallery',1,2.6,-1.6,4,5],
  ['upper lounge','lounge',1,-4,5,4,9,{a:'f'}],['bedroom 3','bed',1,4,-3,10,3,{a:'r'}],['bathroom','bath',1,4,3,10,5.5,{a:'r'}],['bedroom 4','bed',1,4,5.5,10,9,{a:'r'}]],
 doors:[['study','atrium',-1.5],['garage','entrance',7],['cloakroom','atrium',4,.85],['pantry','dining',8.5,.85],['music room','entrance',7],
  ['primary','stair landing',-3.3,.9],['primary bath','primary',-7,.85],['guest suite','back gallery',2],['bedroom 2','upper lounge',7],['bedroom 3','side gallery',0],['bathroom','side gallery',4,.85],['bedroom 4','upper lounge',7.5]],
 open:[['atrium','entrance'],['atrium','living'],['atrium','kitchen'],['living','kitchen'],['atrium','dining'],['dining','kitchen'],['stairwell','stair landing'],['stair landing','back gallery'],['back gallery','side gallery'],['side gallery','upper lounge'],['stairwell','atrium void']],
 glass:[['living','b','slide',-4],['kitchen','b','full'],['atrium void','f','none']],entry:['entrance',0],stair:{x0:-4,z0:0,x1:-2.6,z1:4.8,dir:'-z'}}];
// ---- working a plan out ----------------------------------------------------------------------------------------------------
const OUT=new Set(['terrace','roof']),CIRC=new Set(['hall','corridor','landing','lounge','gallery','atrium','bar']);
const key2=(a,b)=>a<b?a+'|'+b:b+'|'+a;
/* the usual windows of a room on an outer wall, by what the room is and which way the wall faces */
function usual(kind,side){
 if(kind==='garage'||kind==='wardrobe'||kind==='cinema'||kind==='pantry')return'none';
 if(kind==='bath'||kind==='wc'||kind==='laundry')return'high';
 if(kind==='void')return'full';
 if(['living','dining','kitchen','atrium','bar','primary','lounge','office','library','music'].includes(kind))return side==='b'?'full':'wide';
 if(['corridor','gallery','landing','hall'].includes(kind))return side==='b'?'full':side==='f'?'none':'win';
 return side==='b'?'wide':'win';}
function derive(plan){if(plan._d)return plan._d;
 const rooms=plan.rooms.map(r=>({name:r[0],kind:r[1],f:r[2],x0:r[3],z0:r[4],x1:r[5],z1:r[6],...(r[7]||{})})),byName=Object.fromEntries(rooms.map(r=>[r.name,r]));
 const indoor=r=>!!r&&!OUT.has(r.kind),at=(f,x,z)=>rooms.find(r=>r.f===f&&x>r.x0&&x<r.x1&&z>r.z0&&z<r.z1)||null;
 const open=new Set((plan.open||[]).map(([a,b])=>key2(a,b))),doorOf=new Map((plan.doors||[]).map(d=>[key2(d[0],d[1]),d]));
 const glass=new Map();for(const g of plan.glass||[]){const k=g[0]+'|'+g[1];if(!glass.has(k))glass.set(k,[]);glass.get(k).push(g);}
 // every stretch of wall line between two different things
 const segs=[];
 for(const f of[0,1])for(const axis of['x','z']){const fr=rooms.filter(r=>r.f===f),cs=[...new Set(fr.flatMap(r=>axis==='x'?[r.z0,r.z1]:[r.x0,r.x1]))].sort((p,q)=>p-q);
  for(const c of cs){const bs=[...new Set(fr.filter(r=>axis==='x'?(r.z0===c||r.z1===c):(r.x0===c||r.x1===c)).flatMap(r=>axis==='x'?[r.x0,r.x1]:[r.z0,r.z1]))].sort((p,q)=>p-q);let cur=null;
   for(let i=0;i<bs.length-1;i++){const a=bs[i],b=bs[i+1],m=(a+b)/2,e=.01,A=axis==='x'?at(f,m,c-e):at(f,c-e,m),B=axis==='x'?at(f,m,c+e):at(f,c+e,m);
    if(A===B){cur=null;continue;}if(cur&&cur.A===A&&cur.B===B&&cur.b===a)cur.b=b;else{cur={f,axis,c,a,b,A,B,ops:[]};segs.push(cur);}}}}
 // what each stretch is: nothing, a rail, a partition or an outer wall
 for(const s of segs){const A=s.A,B=s.B,inA=indoor(A),inB=indoor(B);
  if(!inA&&!inB){s.type=((A&&A.kind==='terrace')!==(B&&B.kind==='terrace'))?'rail':'none';continue;}
  if(inA&&inB){const va=A.kind==='void',vb=B.kind==='void';if((va&&vb)||open.has(key2(A.name,B.name))){s.type='none';continue;}s.type=(va||vb)&&CIRC.has((va?B:A).kind)?'rail':'wall';s.ext=false;continue;}
  s.ext=true;s.type='wall';s.room=inA?A:B;s.other=inA?B:A;s.side=s.axis==='x'?(inA?'f':'b'):(inA?'r':'l');}
 // doorways in partitions: the stretch that holds the given place, or the longest one the two rooms share
 for(const[k,d]of doorOf){const mine=segs.filter(s=>s.type==='wall'&&!s.ext&&key2(s.A.name,s.B.name)===k);if(!mine.length)continue;const w=d[3]||.95;
  const s=(d[2]!==undefined&&mine.find(q=>d[2]>=q.a&&d[2]<=q.b))||mine.sort((p,q)=>(q.b-q.a)-(p.b-p.a))[0],at0=clamp(d[2]!==undefined?d[2]:(s.a+s.b)/2,s.a+w/2+.1,s.b-w/2-.1);
  s.ops.push({type:'door',u0:at0-w/2,u1:at0+w/2,y0:0,y1:DOORH});}
 // the openings in the outer walls
 const entry=plan.entry;
 for(const s of segs){if(!s.ext)continue;const len=s.b-s.a,r=s.room,spec=glass.get(r.name+'|'+s.side),mid=(s.a+s.b)/2;
  if(entry&&r.name===entry[0]&&s.side==='f'&&r.f===0&&entry[1]>s.a&&entry[1]<s.b){s.ops.push({type:'entry',u0:entry[1]-.6,u1:entry[1]+.6,y0:0,y1:2.4});
   /* glass beside the front door where there is room for it */for(const[u0,u1]of[[s.a+.5,entry[1]-1.1],[entry[1]+1.1,s.b-.5]])if(u1-u0>.9&&r.kind!=='living')s.ops.push({type:'full',u0:Math.max(u0,entry[1]-3.4),u1:Math.min(u1,entry[1]+3.4),y0:.08,y1:2.9});continue;}
  if(r.kind==='garage'){if(s.side==='f'){const w=Math.min(5.2,len-1);s.ops.push({type:'garage',u0:mid-w/2,u1:mid+w/2,y0:0,y1:2.5});}continue;}
  /* what is asked for this wall: an entry with a place is for the stretch that holds that place; one without is for the rest */
  const placed=(spec||[]).filter(g=>g[3]!==undefined&&g[3]>=s.a&&g[3]<=s.b),rest=(spec||[]).filter(g=>g[3]===undefined),kinds=placed.length?placed:rest.length?rest:[[r.name,s.side,usual(r.kind,s.side)]];
  for(const g of kinds){const type=g[2],tall=r.kind==='void'?CEIL2-UP-.3:2.9;
   if(type==='none')continue;
   if(type==='full'||type==='slide'){if(len<1.4)continue;const u0=s.a+.35,u1=s.b-.35;
    if(type==='slide'&&len<3.4){/* a short wall: the whole of it is the way through */const hw=Math.min(.9,len/2-.2);s.ops.push({type:'gap',u0:mid-hw,u1:mid+hw,y0:0,y1:2.4});}
    else if(type==='slide'){const p=clamp(g[3]??mid,s.a+1.35,s.b-1.35);s.ops.push({type:'full',u0,u1:p-.9,y0:.08,y1:tall},{type:'gap',u0:p-.9,u1:p+.9,y0:0,y1:2.4},{type:'full',u0:p+.9,u1,y0:.08,y1:tall});s.ops=s.ops.filter(o=>o.u1-o.u0>.3);}
    else s.ops.push({type:'full',u0,u1,y0:.08,y1:tall});}
   else if(type==='wide'){if(len<1.8)continue;s.ops.push({type:'win',u0:s.a+.6,u1:s.b-.6,y0:.7,y1:2.5});}
   else if(type==='win'){if(len<1.9)continue;const w=Math.min(2.4,len-1.2);s.ops.push({type:'win',u0:mid-w/2,u1:mid+w/2,y0:.9,y1:2.4});}
   else if(type==='high'){if(len<1.5)continue;const w=Math.min(1.6,len-.8);s.ops.push({type:'win',u0:mid-w/2,u1:mid+w/2,y0:1.75,y1:2.4});}}}
 for(const s of segs)s.ops.sort((p,q)=>p.u0-q.u0);
 // where each wall's solid body lies. Outer walls stand outside the rooms; a wall along x reaches round an outward corner.
 const inAt=(f,x,z)=>indoor(at(f,x,z)),walls=segs.filter(s=>s.type==='wall'),touch=(s,u)=>walls.some(q=>q!==s&&q.f===s.f&&q.axis!==s.axis&&Math.abs(q.c-u)<1e-6&&s.c>=q.a-1e-6&&s.c<=q.b+1e-6)&&/* not where the same wall line simply carries on as another stretch */!walls.some(q=>q!==s&&q.f===s.f&&q.axis===s.axis&&Math.abs(q.c-s.c)<1e-6&&(Math.abs(q.a-u)<1e-6||Math.abs(q.b-u)<1e-6));
 for(const s of walls){const e=.02;
  if(s.ext){const inn=s.side==='f'||s.side==='r'?-e:e;
   if(s.axis==='x'){s.t0=s.side==='f'?s.c:s.c-T;s.t1=s.t0+T;s.ea=inAt(s.f,s.a-e,s.c+inn)?0:T;s.eb=inAt(s.f,s.b+e,s.c+inn)?0:T;}
   else{s.t0=s.side==='r'?s.c:s.c-T;s.t1=s.t0+T;s.ea=s.eb=0;}}
  else{s.t0=s.c-PART/2;s.t1=s.c+PART/2;/* a partition runs half its thickness into whatever wall crosses its end, and shows its end only where nothing does */s.ja=touch(s,s.a);s.jb=touch(s,s.b);s.ea=s.ja&&s.axis==='x'?PART/2:0;s.eb=s.jb&&s.axis==='x'?PART/2:0;}}
 const xs=rooms.filter(r=>r.f===0).flatMap(r=>[r.x0,r.x1]),zs=rooms.filter(r=>r.f===0).flatMap(r=>[r.z0,r.z1]);
 const st=plan.stair,along=st.dir[1],len=along==='z'?st.z1-st.z0:st.x1-st.x0;
 const D={rooms,byName,segs,walls,rails:segs.filter(s=>s.type==='rail'),xmin:Math.min(...xs),xmax:Math.max(...xs),zmin:Math.min(...zs),zmax:Math.max(...zs),stair:{...st,len,along,up:st.dir[0]==='+'},
  ground:rooms.filter(r=>r.f===0),upper:rooms.filter(r=>r.f===1),two:rooms.filter(r=>r.f===1&&indoor(r))};
 /* where furniture must not stand: doorways (both sides), the stairs and their foot, and, for tall or wall pieces, glass */
 D.zones=[];for(const s of segs){if(s.type!=='wall')continue;for(const o of s.ops){if(o.type==='door'||o.type==='gap'||o.type==='entry'){const d=.8;D.zones.push(s.axis==='x'?{f:s.f,x0:o.u0-.05,x1:o.u1+.05,z0:s.c-d,z1:s.c+d,what:'doorway'}:{f:s.f,x0:s.c-d,x1:s.c+d,z0:o.u0-.05,z1:o.u1+.05,what:'doorway'});}
   else if(s.ext&&o.y0<1.2){const d=.7,lo=s.side==='f'||s.side==='r'?s.c-d:s.c,hi=lo+d,what=o.y0<.3?'glass':'window';D.zones.push(s.axis==='x'?{f:s.f,x0:o.u0,x1:o.u1,z0:lo,z1:hi,what}:{f:s.f,x0:lo,x1:hi,z0:o.u0,z1:o.u1,what});}}}
 D.zones.push({f:0,x0:st.x0-.05,x1:st.x1+.05,z0:st.z0-.05,z1:st.z1+.05,what:'stairs'},along==='z'?{f:0,x0:st.x0-.9,x1:st.x1+.9,z0:D.stair.up?st.z0-.9:st.z1-1.2,z1:D.stair.up?st.z0+1.2:st.z1+.9,what:'foot of the stairs'}:{f:0,x0:D.stair.up?st.x0-.9:st.x1-1.2,x1:D.stair.up?st.x0+1.2:st.x1+.9,z0:st.z0-.9,z1:st.z1+.9,what:'foot of the stairs'},
  /* and the top: room to step off */along==='z'?{f:1,x0:st.x0-.05,x1:st.x1+.05,z0:D.stair.up?st.z1:st.z0-1.2,z1:D.stair.up?st.z1+1.2:st.z0,what:'top of the stairs'}:{f:1,x0:D.stair.up?st.x1:st.x0-1.2,x1:D.stair.up?st.x1+1.2:st.x0,z0:st.z0-.05,z1:st.z1+.05,what:'top of the stairs'});
 plan._d=D;/* a picture only where it has a solid stretch of wall behind it (in the open-plan rooms a unit can stand free) */D.items=furnish(plan,D).filter(it=>it.k!=='art'||backed(D,it));
 D.beds=D.items.filter(it=>it.k==='bed').map(it=>({x:it.x,z:it.z,y:it.y||0,r:it.r,w:it.w,d:it.d}));
 const eseg=segs.find(s=>s.ops.some(o=>o.type==='entry')),eop=eseg&&eseg.ops.find(o=>o.type==='entry');D.entry=eop?{x:(eop.u0+eop.u1)/2,z:eseg.c,w:eop.u1-eop.u0,h:eop.y1}:{x:0,z:D.zmax,w:1.2,h:2.4};
 return D;}
/* how far up the stairs a point is (0 at the foot, 1 at the top), or null beside them; half a metre of level line at each end */
function stairAt(D,x,z){const s=D.stair;if(s.along==='z'){if(x<s.x0||x>s.x1||z<s.z0-.5||z>s.z1+.5)return null;const t=(z-s.z0)/s.len;return clamp(s.up?t:1-t,0,1);}
 if(z<s.z0||z>s.z1||x<s.x0-.5||x>s.x1+.5)return null;const t=(x-s.x0)/s.len;return clamp(s.up?t:1-t,0,1);}
// ---- the furniture ----------------------------------------------------------------------------------------------------------
/* Each room is furnished from the wall its main piece stands against: u runs along that wall, v out from it into the
 * room. The pieces are the apartments' (city-apartments.js layout, city-apt-rooms.js kit). */
/* is there solid wall (no window or doorway) behind a piece across its whole width, over its height (a picture: from its bottom edge, it.y, to its top) */
function backed(D,it){const r=D.byName[it.room],f=r?r.f:0,yaw=[0,Math.PI/2,Math.PI,-Math.PI/2][it.r],fx=Math.round(Math.sin(yaw)),fz=Math.round(Math.cos(yaw)),axis=fz?'x':'z',line=fz?it.z-fz*(it.d/2+.12):it.x-fx*(it.d/2+.12),u=fz?it.x:it.z,lo=u-it.w/2+.05,hi=u+it.w/2-.05,ya=it.y?it.y-f*UP:1,yb=ya+(it.y?it.h:.5),solid=[];
 for(const s of D.walls){if(s.f!==f||s.axis!==axis||Math.abs(s.c-line)>.3)continue;let parts=[[s.a-(s.ea||0),s.b+(s.eb||0)]];for(const o of s.ops||[]){if(!(o.y0<yb&&o.y1>ya))continue;parts=parts.flatMap(([a,b])=>o.u1<=a||o.u0>=b?[[a,b]]:[[a,o.u0],[o.u1,b]].filter(([p,q])=>q-p>1e-6));}solid.push(...parts);}
 solid.sort((p,q)=>p[0]-q[0]);let at=lo;for(const[a,b]of solid){if(a>at+1e-6)break;at=Math.max(at,b);}return at>=hi-1e-6;}
function furnish(plan,D){
 const AD=(root.CityApartments&&root.CityApartments.DESIGNS&&root.CityApartments.DESIGNS[plan.design])||{sofa:'straight',dining:'rect6',island:'wood',bed:'upholstered',corner:'lounge'},design=plan.design;let out=[];
 const frame=(r,side)=>{const horiz=side==='b'||side==='f',W=horiz?r.x1-r.x0:r.z1-r.z0,Dp=horiz?r.z1-r.z0:r.x1-r.x0,base=r.f*UP,rot0={b:0,r:3,f:2,l:1}[side];
  const pt=(u,v)=>side==='b'?[r.x0+u,r.z0+v]:side==='f'?[r.x1-u,r.z1-v]:side==='r'?[r.x1-v,r.z0+u]:[r.x0+v,r.z1-u];
  const box=(u0,v0,u1,v1,y0,y1)=>{const p=pt(u0,v0),q=pt(u1,v1);return[Math.min(p[0],q[0]),Math.min(p[1],q[1]),Math.max(p[0],q[0]),Math.max(p[1],q[1]),base+y0,base+y1];};
  const add=(k,t,u,v,rot,w,d,h,s=true,extra={})=>{const p=pt(u,v),it={k,t,x:+p[0].toFixed(3),z:+p[1].toFixed(3),r:(rot0+rot)%4,w,d,h,s,room:r.name,...extra};const y=base+(extra.y||0);if(y)it.y=y;else delete it.y;out.push(it);return it;};
  return{W,Dp,box,add};};
 const bedOf=(F,u,w,d,type)=>F.add('bed',type,u,.12+d/2,0,w,d,.55,true,{c:[F.box(u-w/2,.12,u+w/2,.12+d,0,.58),F.box(u-w/2,.12,u+w/2,.32,0,1.2)]});
 const gen=(r,side,far)=>{out=[];const F=frame(r,side),{W,Dp,add}=F,c=W/2;
  switch(r.kind){
  case'living':{const sv=clamp(Dp-1.5,3.4,4.3),st=AD.sofa==='chesterfield'?'chesterfield':'straight';
   add('media',design,c,.28,0,Math.min(3,W-1.2),.48,.55);add('tv',design,c,.07,0,1.95,.08,1.12,false,{y:.95});add('sofa',st,c,sv,2,3.0,.98,.82);add('coffee',design,c,sv-1.8,0,1.2,.75,.42);add('rug',design,c,sv-1.6,0,Math.min(4.4,W-.8),3.6,.02,false);
   if(W>=6.6){add('armchair',design,c-2.5,sv-1.75,1,.85,.85,.8);add('armchair',design,c+2.5,sv-1.75,3,.85,.85,.8);}
   add('floorlamp',design,c+far*Math.min(W/2-.5,2.3),sv+.15,0,.45,.45,1.75);add('plant',design,.55,.55,0,.6,.6,1.8);add('plant',design,W-.55,.55,0,.5,.5,1.3);
   if(Dp>=8.5){/* a big room: something of its own at the far end */const v2=Dp-1.6;if(AD.corner==='piano'||hash(plan.id)%3===0)add('piano',design,c,v2-.4,2,1.5,1.9,1.0);else{add('console',design,c,sv+.75,0,1.6,.38,.82);add('chaise',design,c-1.2,v2,2,.7,1.7,.8);add('chaise',design,c+1.2,v2,2,.7,1.7,.8);add('sculpture',design,c+far*Math.min(W/2-.9,3),v2,0,.7,.7,1.6);}}
   break;}
  case'dining':{const long=W>=Dp,tl=clamp((long?W:Dp)-2.6,2.0,2.6),type=AD.dining==='round4'?'rect6':AD.dining,mu=r.u??c,mv=r.v??Dp/2+(Dp>4.6?.25:0);
   add('table',type,mu,mv,long?0:1,tl,1.05,.75);for(const e of[-.62,.62])for(const sd of[-1,1]){if(long)add('chair',design,mu+e,mv+sd*.9,sd>0?2:0,.5,.52,.86);else add('chair',design,mu+sd*.9,mv+e,sd>0?3:1,.5,.52,.86);}
   if(long){add('chair',design,mu-tl/2-.42,mv,1,.5,.52,.86);add('chair',design,mu+tl/2+.42,mv,3,.5,.52,.86);}else{add('chair',design,mu,mv-tl/2-.42,0,.5,.52,.86);add('chair',design,mu,mv+tl/2+.42,2,.5,.52,.86);}
   if(Dp>=4.6&&W>=3.4)add('sideboard',design,c,.3,0,Math.min(2.4,W-1.4),.48,.82);add('art',design,c,.045,0,1.4,.04,1.0,false,{y:1.35});break;}
  case'kitchen':{const run=clamp(W-2.9,2.6,4.9),u0=r.u??Math.max(.5,c-(run+1.85)/2);
   add('counter',AD.island,u0+run/2,.33,0,run,.66,.92,true,{lowSplash:true});if(W>=run+2.6)add('tall',AD.island,u0+run+.875,.33,0,1.75,.66,2.4);
   if(Dp>=4.6){const iw=clamp(W-3,2.2,3.8);add('island',AD.island,c,2.45,0,iw,1.0,.92);for(const e of iw>3?[-1,0,1]:[-.55,.55])add('stool',design,c+e,3.42,2,.44,.44,.78);}break;}
  case'primary':{const bw=2.0,bd=2.2;bedOf(F,c,bw,bd,AD.bed);for(const e of[-1,1]){add('nightstand',design,c+e*(bw/2+.38),.34,0,.5,.45,.52);add('lamp',design,c+e*(bw/2+.38),.34,0,.28,.28,.55,false,{y:.52});}
   add('art',design,c,.045,0,1.5,.04,.8,false,{y:1.55});if(Dp>=bd+1.7)add('bench',design,c,.12+bd+.42,0,1.4,.45,.46);add('rug',design,c,1.5,0,Math.min(3.2,W-.6),3.0,.02,false);
   /* a dresser on one side wall, a chair by the far wall */{const su=far>0?W-.3:.3;add('dresser',design,su,Math.min(Dp-1.2,3.2),far>0?3:1,1.6,.5,.8);}
   if(Dp>=5.2)add('armchair',design,c-far*Math.min(W/2-.75,2.2),Dp-.75,2,.8,.8,.8);if(W>=5.5)add('plant',design,far>0?.5:W-.5,Dp-.5,0,.5,.5,1.4);break;}
  case'bed':{const bw=W>=4.2?1.8:1.6,bd=2.0,type=AD.bed==='canopy'?'upholstered':AD.bed;bedOf(F,c,bw,bd,type);add('nightstand',design,c+far*(bw/2+.36),.33,0,.45,.42,.52);add('lamp',design,c+far*(bw/2+.36),.33,0,.26,.26,.5,false,{y:.52});
   {const su=far>0?W-.33:.33,wl=clamp(Dp-2.9,1.2,2.4);if(Dp>=4.4)add('wardrobe',design,su,Dp-.2-wl/2,far>0?3:1,wl,.6,2.4);}
   if(W>=4&&Dp>=4.4){const du=far>0?.36:W-.36;add('desk',design,du,Dp-1.1,far>0?1:3,1.3,.6,.75);add('chair','desk',du+(far>0?.62:-.62),Dp-1.1,far>0?3:1,.52,.52,.9);}break;}
  case'bath':{const big=W*Dp>=13;if(big){/* the bath along the wall, the basins on one side wall, the toilet on the other */add('tub',design,c,.47,0,Math.min(2.25,W-1),.85,.58);const vl=clamp(Dp-2.4,1.2,1.8);add('vanity',design,far>0?W-.3:.3,Math.max(1.35+vl/2,Dp/2+.3),far>0?3:1,vl,.56,.86);add('toilet',design,far>0?.36:W-.36,Dp-.75,far>0?1:3,.42,.66,.46);}
   else{add('vanity',design,c,.3,0,Math.min(1.5,W-.6),.52,.86);add('toilet',design,far>0?W-.36:.36,Math.min(Dp-.8,1.9),far>0?3:1,.42,.66,.46);if(Dp>=3.6)add('tub',design,c,Dp-.47,2,Math.min(1.7,W-.5),.8,.58);}break;}
  case'wc':{add('vanity',design,W>1.9?c-.35:c,.27,0,.7,.45,.85);if(W>1.9)add('toilet',design,W-.36,Math.min(Dp-.7,1.3),3,.42,.62,.46);else add('toilet',design,c,Dp-.36,2,.42,.62,.46);break;}
  case'office':{add('desk',design,c,1.15,2,1.5,.7,.75);add('chair','desk',c,.5,0,.55,.55,.9);if(W>=4)add('bookcase',design,far>0?W-.24:.24,Dp/2,far>0?3:1,Math.min(3.2,Dp-1.6),.38,2.6);if(Dp>=4.4)add('armchair',design,c-far*1.0,Dp-.8,2,.8,.8,.8);add('plant',design,far>0?.5:W-.5,.5,0,.5,.5,1.4);break;}
  case'library':{add('bookcase',design,c,.24,0,Math.min(3.2,W-1.2),.38,2.6);if(Dp>=5)add('bookcase',design,far>0?W-.24:.24,Dp/2+.4,far>0?3:1,Math.min(3.2,Dp-2.2),.38,2.6);
   add('armchair',design,c-.9,Dp/2+.2,1,.85,.85,.8);add('armchair',design,c+.9,Dp/2+.2,3,.85,.85,.8);add('side',design,c,Dp/2+.2,0,.5,.5,.5);add('floorlamp',design,c-far*1.7,Dp/2-.6,0,.45,.45,1.75);add('rug',design,c,Dp/2+.2,0,Math.min(3.2,W-.8),2.6,.02,false);break;}
  case'cinema':{add('media',design,c,.28,0,Math.min(3,W-1),.48,.55);add('tv',design,c,.07,0,2.4,.08,1.38,false,{y:.9});add('sofa','straight',c,Math.min(Dp-1.9,3.2),2,Math.min(3,W-1),.98,.82);if(Dp>=5.6)add('sofa','straight',c,Dp-.75,2,Math.min(3,W-1),.98,.82);add('rug',design,c,1.9,0,Math.min(3.6,W-.6),2.4,.02,false);break;}
  case'music':{add('piano',design,c+far*.8,Dp/2+.2,far>0?1:3,1.5,1.9,1.0);add('armchair',design,c-far*1.6,Dp/2-.6,far>0?1:3,.85,.85,.8);add('side',design,c-far*1.6,Dp/2+.45,0,.5,.5,.5);add('bookcase',design,c,.24,0,Math.min(2.6,W-1.4),.38,2.6);break;}
  case'bar':{add('bar',design,c,.34,0,2.2,.6,1.05);add('winewall',design,Math.min(W-1.6,c+2.7),.25,0,2.6,.42,2.6);for(const e of[-.7,0,.7])add('stool',design,c+e,1.2,2,.44,.44,.78);
   add('sofa','straight',c,Math.min(Dp-1.2,5.6),2,3.0,.98,.82);add('coffee',design,c,Math.min(Dp-1.2,5.6)-1.7,0,1.2,.75,.42);add('armchair',design,c-2.4,Math.min(Dp-1.2,5.6)-1.6,1,.85,.85,.8);add('armchair',design,c+2.4,Math.min(Dp-1.2,5.6)-1.6,3,.85,.85,.8);add('plant',design,.55,Dp-.55,0,.6,.6,1.8);break;}
  case'lounge':{add('media',design,c,.28,0,Math.min(2.6,W-1),.48,.55);add('tv',design,c,.07,0,1.7,.08,.98,false,{y:.95});add('sofa','straight',c,Math.min(Dp-.75,3.3),2,2.8,.95,.8);add('coffee',design,c,Math.min(Dp-.75,3.3)-1.6,0,1.0,.8,.4);add('rug',design,c,1.8,0,Math.min(3.2,W-.8),2.6,.02,false);if(W>=7)add('bookcase',design,far>0?W-.24:.24,Dp/2,far>0?3:1,Math.min(2.6,Dp-1.6),.38,2.6);break;}
  case'hall':{add('console',design,far>0?Math.min(W-1.2,c+1.9):Math.max(1.2,c-1.9),.24,0,1.3,.38,.82);add('art',design,far>0?Math.min(W-1.2,c+1.9):Math.max(1.2,c-1.9),.045,0,1.1,.04,.75,false,{y:1.4});if(Dp>=6)add('plant',design,far>0?W-.55:.55,Dp-.6,0,.6,.6,1.8);break;}
  case'atrium':{add('sculpture',design,c,Dp/2,0,.8,.8,1.8);add('console',design,c,.24,0,1.6,.38,.82);add('art',design,c,.045,0,1.6,.04,1.1,false,{y:1.35});add('plant',design,.6,Dp-.6,0,.7,.7,1.9);break;}
  case'wardrobe':{const wl=clamp(W-1.4,1.2,3);add('wardrobe',design,c,.33,0,wl,.6,2.5);if(Dp>=4.4){add('wardrobe',design,c,Dp-.33,2,wl,.6,2.5);add('bench',design,c,Dp/2,0,1.2,.42,.45);}break;}
  case'laundry':{add('cabinet',design,c,.26,0,Math.min(1,W-.5),.46,1.9);break;}
  case'pantry':{add('cabinet',design,Math.min(c,W-.7),.26,0,1.0,.46,1.9);if(W>=2.8)add('cabinet',design,Math.max(.7,c-1.15),.26,0,1.0,.46,1.9);break;}
  case'garage':{add('cabinet',design,.9,.26,0,1.0,.46,1.9);add('cabinet',design,2.0,.26,0,1.0,.46,1.9);break;}
  case'terrace':{if(W>=4&&Dp>=4){add('chaise',design,c-.9,Dp-2.2,2,.7,1.7,.8);add('chaise',design,c+.9,Dp-2.2,2,.7,1.7,.8);add('side',design,c,Dp-2.2,0,.5,.5,.5);add('plant',design,.6,.6,0,.7,.7,1.9);add('plant',design,W-.6,.6,0,.7,.7,1.9);}break;}
  case'corridor':case'gallery':case'landing':{if(W*Dp>=9&&Math.min(W,Dp)>=2){add('plant',design,.5,.5,0,.5,.5,1.4);}break;}}return out;};
 /* Which wall, and which side for the second piece: every arrangement is tried and the one with nothing in a doorway,
  * on the stairs, against glass or through another piece is kept (the plan's own choice first); a small piece that
  * still clashes is left out. What a main piece clashes with is left for the plan check to report. */
 const MAIN=new Set(['bed','sofa','table','counter','island','toilet','vanity','tub','shower','media','tv','desk','piano','bar','chair','stool']),TALL=new Set(['wardrobe','bookcase','tall','winewall','cabinet','art','tv','dresser']),GLASSY=new Set(['media','tv','art','bookcase','wardrobe','tall','counter','winewall','bar','cabinet','dresser','console','sideboard','bed','vanity','nightstand','toilet','shower']);
 const foot=it=>it.s?solids(it):(it.k==='tv'||it.k==='art')?[(a=>[it.x-(a?it.d:it.w)/2,it.z-(a?it.w:it.d)/2,it.x+(a?it.d:it.w)/2,it.z+(a?it.w:it.d)/2,it.y||0,(it.y||0)+it.h])(it.r%2===1)]:[];
 const hits=(b,z)=>Math.min(b[2],z.x1)-Math.max(b[0],z.x0)>.02&&Math.min(b[3],z.z1)-Math.max(b[1],z.z0)>.02;
 const clash=(it,r,before)=>{for(const b of foot(it)){if(b[0]<r.x0-.02||b[2]>r.x1+.02||b[1]<r.z0-.02||b[3]>r.z1+.02)return true;for(const z of D.zones)if(z.f===r.f&&(z.what==='glass'?GLASSY.has(it.k):z.what==='window'?TALL.has(it.k):true)&&hits(b,z))return true;if(it.s)for(const o of before)for(const q of solids(o))if(Math.min(b[2],q[2])-Math.max(b[0],q[0])>.02&&Math.min(b[3],q[3])-Math.max(b[1],q[1])>.02&&b[4]<q[5]-.01&&q[4]<b[5]-.01)return true;}return false;};
 const PICTURE=new Set(['dining','hall','atrium','primary','living']),all=[],WALLED=new Set(['kitchen','bed','primary','bath','wc','office','library','cinema','wardrobe','music']);
 /* how much of a room's side is real wall (a kitchen, a bed or a bath is not set against an open side) */const cover=(r,side)=>{const axis=side==='b'||side==='f'?'x':'z',c=side==='b'?r.z0:side==='f'?r.z1:side==='l'?r.x0:r.x1,a=axis==='x'?r.x0:r.z0,b=axis==='x'?r.x1:r.z1;let n=0;for(const s of D.segs)if(s.type==='wall'&&s.f===r.f&&s.axis===axis&&Math.abs(s.c-c)<1e-6&&(s.A===r||s.B===r))n+=Math.max(0,Math.min(b,s.b)-Math.max(a,s.a));return n/(b-a);};
 for(const r of D.rooms){if(r.kind==='void'||r.kind==='roof')continue;const a0=r.a||'b',f0=r.x==='l'?-1:1;let best=null;
  for(const side of[a0,...['b','l','r','f'].filter(s=>s!==a0)])for(const far of[f0,-f0]){const items=gen(r,side,far),kept=[];let score=(side===a0?0:2)+(far===f0?0:1)+(WALLED.has(r.kind)&&cover(r,side)<.5?6:0);
   for(const it of items){if(clash(it,r,kept)){score+=MAIN.has(it.k)?100:3;if(MAIN.has(it.k))kept.push(it);}else{kept.push(it);/* a picture wants a wall behind it: worth turning the room round end to end for, not worth moving its main wall */if(it.k==='art'&&!backed(D,it))score+=1.5;}}
   if(!best||score<best.score)best={score,kept};if(!score)break;}
  let kept=best.kept;const has=k=>kept.some(it=>it.k===k);
  kept=kept.filter(it=>!(it.k==='tv'&&!has('media'))&&!(it.k==='stool'&&!has('island')&&!has('bar'))&&!(it.k==='coffee'&&!has('sofa'))&&!(it.k==='lamp'&&!kept.some(o=>(o.k==='nightstand'||o.k==='side')&&Math.abs(o.x-it.x)<.05&&Math.abs(o.z-it.z)<.05)));
  /* a main room left without a picture (its sideboard or console stands free in the open plan): one on the first free
     stretch of solid wall, with nothing tall in front of it */
  kept=kept.filter(it=>it.k!=='art'||backed(D,it));
  if(PICTURE.has(r.kind)&&!kept.some(it=>it.k==='art')){const base=r.f*UP,tall=kept.filter(o=>o.k!=='art'&&o.k!=='rug'&&(o.k==='bed'||((o.y||base)-base)+o.h>.95)),half=o=>[(o.r%2?o.d:o.w)/2,(o.r%2?o.w:o.d)/2];
   hang:for(const side of['b','f','l','r'])for(const off of[0,-1.5,1.5,-3,3]){const ax=side==='b'||side==='f'?'x':'z',c=side==='b'?r.z0:side==='f'?r.z1:side==='l'?r.x0:r.x1,lo=ax==='x'?r.x0:r.z0,hi=ax==='x'?r.x1:r.z1,u=(lo+hi)/2+off;if(u-.9<lo||u+.9>hi)continue;
    const w=D.walls.find(s=>s.f===r.f&&s.axis===ax&&Math.abs(s.c-c)<1e-6&&u>=s.a&&u<=s.b);if(!w)continue;const inw=side==='b'||side==='l'?1:-1,inner=inw>0?Math.max(w.t0,w.t1):Math.min(w.t0,w.t1),pos=inner+inw*.04;
    const it={k:'art',t:design,x:+(ax==='x'?u:pos).toFixed(3),z:+(ax==='x'?pos:u).toFixed(3),r:{b:0,f:2,l:1,r:3}[side],w:1.2,d:.04,h:.85,s:false,room:r.name,y:base+1.45};if(!backed(D,it))continue;
    const a0=Math.min(inner,inner+inw*.7),a1=Math.max(inner,inner+inw*.7),bx0=ax==='x'?u-.8:a0,bx1=ax==='x'?u+.8:a1,bz0=ax==='x'?a0:u-.8,bz1=ax==='x'?a1:u+.8;
    if(tall.some(o=>{const[hx,hz]=half(o);return o.x-hx<bx1&&o.x+hx>bx0&&o.z-hz<bz1&&o.z+hz>bz0;}))continue;
    kept.push(it);break hang;}}
  all.push(...kept);}
 return all;}
function solids(it){if(!it.s)return[];if(it.c)return it.c;const across=it.r%2===1,hw=(across?it.d:it.w)/2,hd=(across?it.w:it.d)/2,y0=it.y||0;return[[it.x-hw,it.z-hd,it.x+hw,it.z+hd,y0,y0+it.h]];}
// ---- from a mansion to the world ----------------------------------------------------------------------------------------
// r: which way the front faces (0 +z, 1 +x, 2 -z, 3 -x), as for the houses; the hill mansions all face the road to their north (2)
function toWorld(v,x,y,z){const r=v.r,c=[1,0,-1,0][r],s=[0,1,0,-1][r];return{x:v.x+x*c+z*s,y:v.y+y,z:v.z-x*s+z*c};}
function toLocal(v,x,y,z){const r=v.r,c=[1,0,-1,0][r],s=[0,1,0,-1][r],dx=x-v.x,dz=z-v.z;return{x:dx*c-dz*s,y:y-v.y,z:dx*s+dz*c};}
const yawOf=v=>v.r*Math.PI/2;
function boxWorld(v,x0,x1,y0,y1,z0,z1){const a=toWorld(v,x0,y0,z0),b=toWorld(v,x1,y1,z1);return{x0:Math.min(a.x,b.x),x1:Math.max(a.x,b.x),z0:Math.min(a.z,b.z),z1:Math.max(a.z,b.z),y0:a.y,y1:b.y};}
const planOf=v=>PLANS.find(p=>p.id===(v.plan||v))||null;
/* the pieces of a wall between its openings: [u0, u1, y0, y1] with the heights measured from that floor */
function wallPieces(s,y0,y1,solidOnly){const out=[],ops=s.ops.filter(o=>!solidOnly||o.type==='door'||o.type==='entry'||o.type==='gap').sort((p,q)=>p.u0-q.u0);let cur=s.a-s.ea;
 for(const o of ops){if(o.u0>cur)out.push([cur,o.u0,y0,y1]);if(o.y0>y0+.001)out.push([o.u0,o.u1,y0,o.y0]);if(o.y1<y1-.001)out.push([o.u0,o.u1,o.y1,y1]);cur=o.u1;}
 if(s.b+s.eb>cur)out.push([cur,s.b+s.eb,y0,y1]);return out.filter(p=>p[1]-p[0]>.004&&p[3]-p[2]>.004);}
function install(world,api){
 const box=api.box,removeBox=api.removeBox;world.villas=[];const sites=world.villaPads||[];
 PLANS.forEach((plan,i)=>{const pad=sites[i];if(!pad)return;const D=derive(plan),id='villa-'+(i+1);
  const v={id,plan:plan.id,index:i,r:2,x:pad.x+(D.xmin+D.xmax)/2,y:pad.y+LIFT,z:pad.z-PAD.d/2+D.zmax+FRONT,pad,name:plan.name,address:(2+i*2)+' Highcrest Drive',price:plan.price,design:plan.design,district:api.districtAt?api.districtAt(pad.x,pad.z).id:'verdant-hills'};
  world.villas.push(v);
  // take away the hill's trees and stones on the plot and its banks
  for(let k=world.props.length-1;k>=0;k--){const p=world.props[k];if(String(p.id).startsWith('destructible-'))continue;if(Math.abs(p.x-pad.x)<PAD.w/2+12&&Math.abs(p.z-pad.z)<PAD.d/2+12){for(const c of world.colliders.filter(c=>c.id===p.id||(p.collisionIds||[]).includes(c.id)))removeBox(c);world.props.splice(k,1);}}
  let n=0;const B=(key,x0,x1,y0,y1,z0,z1,material='masonry',extra={})=>{if(x1-x0<.003||y1-y0<.003||z1-z0<.003)return null;const w=boxWorld(v,x0,x1,y0,y1,z0,z1);return box(id+':'+key+'-'+(n++),(w.x0+w.x1)/2,w.y0,(w.z0+w.z1)/2,w.x1-w.x0,w.y1-w.y0,w.z1-w.z0,material,{architecturePart:true,buildingId:id,villa:id,...extra});};
  // floors: the ground floor, the upper floor and the walk-on roofs, the roof over the upper rooms
  for(const r of D.ground)B('floor',r.x0,r.x1,-LIFT-.6,0,r.z0,r.z1,'masonry',{floor:true,roofSupport:true});
  for(const r of D.upper)if(r.kind!=='void')B('upper',r.x0,r.x1,CEIL,UP,r.z0,r.z1,'masonry',{floor:true,roofSupport:true});
  for(const r of D.two)B('roof',r.x0,r.x1,CEIL2,ROOF,r.z0,r.z1,'masonry',{roofSupport:true});
  // walls with their doorways left open; the front door is a box of its own the game opens for the owner
  for(const s of D.walls){const base=s.f*UP,top=s.ext?(s.f?ROOF:UP):(s.f?CEIL2:CEIL),y0=s.ext&&!s.f?-LIFT:0;
   for(const[u0,u1,ya,yb]of wallPieces(s,y0,top-base,true)){/* V15.7: the low strip under a doorway or a glass door (it ends at the floor) can be stepped over, like the floor */const sill=yb<=.001&&ya<0?{floor:true}:{};if(s.axis==='x')B('wall',u0,u1,base+ya,base+yb,s.t0,s.t1,'masonry',sill);else B('wall',s.t0,s.t1,base+ya,base+yb,u0,u1,'masonry',sill);}
   for(const o of s.ops)if(o.type==='entry'){if(s.axis==='x')B('door',o.u0,o.u1,0,o.y1,s.t0,s.t1,'wood',{door:true,villaDoor:true});else B('door',s.t0,s.t1,0,o.y1,o.u0,o.u1,'wood',{door:true,villaDoor:true});}}
  // rails round the open wells and the terraces
  for(const s of D.rails){const base=s.f*UP;if(s.axis==='x')B('rail',s.a,s.b,base,base+RAIL,s.c-.03,s.c+.03,'metal');else B('rail',s.c-.03,s.c+.03,base,base+RAIL,s.a,s.b,'metal');}
  // the stairs: marked as stairs, you walk up the smooth line along them (stairHeight below)
  {const s=D.stair;for(let k=1;k<STEPS;k++){const t0=k/STEPS,t1=(k+1)/STEPS,top=(k+1)*UP/STEPS,a=s.up?t0:1-t1,b=s.up?t1:1-t0;
    if(s.along==='z')B('stair',s.x0,s.x1,0,top,s.z0+a*s.len,s.z0+b*s.len,'wood',{floor:true,stair:true,villaStair:true});else B('stair',s.x0+a*s.len,s.x0+b*s.len,0,top,s.z0,s.z1,'wood',{floor:true,stair:true,villaStair:true});}}
  // the furniture
  D.items.forEach(it=>solids(it).forEach(c=>B('f',c[0],c[2],c[4],c[5],c[1],c[3],['sofa','armchair','bed','bench','chaise'].includes(it.k)?'cloth':'wood',{furniture:true})));
  // the pool on the view side (V15.4): a basin deep enough to swim in, a coping you can walk round, and two ways out
  // at the house end (the game's water exits: "Climb pool steps")
  {const P=poolOf(D),I=poolInside(D);for(const[x0,x1,z0,z1]of[[P.x0,P.x1,P.z0,I.z0],[P.x0,P.x1,I.z1,P.z1],[P.x0,I.x0,I.z0,I.z1],[I.x1,P.x1,I.z0,I.z1]])B('pool',x0,x1,POOL_FLOOR,POOL_COPING,z0,z1,'masonry',{floor:true});
   B('pool-floor',I.x0,I.x1,POOL_FLOOR-.3,POOL_FLOOR,I.z0,I.z1,'masonry',{floor:true});
   for(const e of poolExits(v,D))world.waterExits.push({id:id+'-pool-'+e.side,kind:'mansionPool',...e.water,top:e.top});}
  world.buildings.push({id,name:v.name,x:pad.x,y:v.y,z:toWorld(v,(D.xmin+D.xmax)/2,0,(D.zmin+D.zmax)/2).z,w:D.xmax-D.xmin+2*T,d:D.zmax-D.zmin+2*T,h:ROOF+1,style:'villa',customHome:true,villa:true,interior:false,district:v.district});});
 /* the pools' water and floors, for swimming (waterHeight) and sinking to the bottom (groundHeight), in the world */
 const pools=world.villas.map(v=>{const I=poolInside(derive(planOf(v))),a=toWorld(v,I.x0,0,I.z0),b=toWorld(v,I.x1,0,I.z1);return{id:v.id,x0:Math.min(a.x,b.x),x1:Math.max(a.x,b.x),z0:Math.min(a.z,b.z),z1:Math.max(a.z,b.z),water:v.y+POOL_WATER,floor:v.y+POOL_FLOOR};});
 const poolAt=(x,z)=>{for(const p of pools)if(x>p.x0&&x<p.x1&&z>p.z0&&z<p.z1)return p;return null;};
 world.villaPools={list:pools,waterAt(x,z){const p=poolAt(x,z);return p?p.water:null;},floorAt(x,z){const p=poolAt(x,z);return p?p.floor:null;}};
 world.villaStairs={stairHeight(x,z,nearY){for(const v of world.villas){if(Math.abs(x-v.pad.x)>30||Math.abs(z-v.pad.z)>30)continue;const D=derive(planOf(v)),q=toLocal(v,x,v.y,z),t=stairAt(D,q.x,q.z);if(t===null)continue;const y=v.y+t*UP;return y<=nearY+.6?y:null;}return null;}};
 return world.villas;}
/* the pool: behind the house on the view side, clear of the walls, inside the plot. poolOf is its outer edge (with the
   coping), poolInside the water. The water is 13 cm under the paving, the floor 1.65 m under the water (deep water for
   the game is more than 1.1 m). The ways out: steps in the corner nearest the house on the left, a ladder on the right. */
const POOL_WATER=-.27,POOL_FLOOR=-1.92,POOL_COPING=-.1;
function poolInside(D){const P=poolOf(D);return{x0:P.x0+.3,x1:P.x1-.3,z0:P.z0+.3,z1:P.z1-.3};}
function poolExits(v,D){const P=poolOf(D),I=poolInside(D),w=(x,y,z)=>{const p=toWorld(v,x,y,z);return{x:p.x,y:p.y,z:p.z};};
 return[{side:'steps',x:I.x0+.75},{side:'ladder',x:I.x1-.6}].map(e=>({side:e.side,water:w(e.x,POOL_WATER,I.z1-.7),top:w(e.x,-LIFT+.02,P.z1+.9)}));}
function poolOf(D){const w=Math.min(14,D.xmax-D.xmin-4),cx=(D.xmin+D.xmax)/2,z1=D.zmin-3.5,z0=z1-5.5;return{x0:cx-w/2,x1:cx+w/2,z0,z1};}
// ---- which mansion a point is in ------------------------------------------------------------------------------------------
function villaAt(world,x,y,z){for(const v of world.villas||[]){if(Math.abs(x-v.pad.x)>26||Math.abs(z-v.pad.z)>24)continue;const D=derive(planOf(v)),q=toLocal(v,x,y,z);if(q.y<-.8||q.y>ROOF)continue;const f=q.y>=UP-.5?1:0,hit=ff=>D.rooms.find(r=>r.f===ff&&r.kind!=='roof'&&r.kind!=='void'&&q.x>=r.x0-.05&&q.x<=r.x1+.05&&q.z>=r.z0-.05&&q.z<=r.z1+.05),r=hit(f)||/* high on the stairs, in the open well */(f===1?hit(0):null);if(r)return{villa:v,floor:f,local:q,room:r};}return null;}
function byId(world,id){return(world.villas||[]).find(v=>v.id===id)||null;}
// the spot just outside the front door, facing the house; and just inside it, facing in
function frontDoor(v){const D=derive(planOf(v)),p=toWorld(v,D.entry.x,0,D.entry.z+T+1.1);return{...p,yaw:yawOf(v)+Math.PI};}
function inside(v){const D=derive(planOf(v)),p=toWorld(v,D.entry.x,0,D.entry.z-1.3);return{...p,yaw:yawOf(v)+Math.PI};}
// ---- owning one ---------------------------------------------------------------------------------------------------------------
const ownedList=sim=>(sim&&sim.profile&&sim.profile.apartments&&Array.isArray(sim.profile.apartments.villas))?sim.profile.apartments.villas:[];
const owns=(sim,id)=>ownedList(sim).includes(id);
const money=n=>'$'+Math.round(n).toLocaleString('en-US');
function buy(sim,id){
 const v=byId(sim.world,id);if(!v)return{ok:false,message:'There is no such mansion.'};
 if(sim.onlineRoom)return{ok:false,message:'In an online room a hill mansion is bought from its front door or in Platdo Estates, with your online City money.'};
 if(owns(sim,id))return{ok:false,message:v.name+' is already yours.'};
 if(!(sim.profile.wallet>=v.price))return{ok:false,message:'You need '+money(v.price)+' for '+v.name+'.'};
 if(!sim.commit('villa:'+id,-v.price,(v.name+', '+v.address).slice(0,80)))return{ok:false,message:'The payment did not go through.'};
 const A=root.CityApartments,a=A?A.normalize(sim.profile.apartments):{units:[]};a.villas=[...(a.villas||[]),id];sim.profile.apartments=A?A.normalize(a):a;sim.dirty=true;
 return{ok:true,message:v.name+' is yours.'};}
return{T,PART,UP,CEIL,CEIL2,ROOF,LIFT,DOORH,RAIL,STEPS,FRONT,ROAD,PAD,SITE_X,ROAD_Z,PLANS,OUT,CIRC,hash,pads,derive,stairAt,furnish,solids,toWorld,toLocal,yawOf,boxWorld,planOf,wallPieces,poolOf,/* V15.4 */poolInside,poolExits,POOL_WATER,POOL_FLOOR,POOL_COPING,install,villaAt,byId,frontDoor,inside,ownedList,owns,buy,money};
});
