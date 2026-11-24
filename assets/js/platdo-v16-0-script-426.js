
/* PLATDO City hill mansions: the look (V15.3). Game only. The plans and the solid shapes are in city-villas.js.
 * - The structure of each mansion is always drawn, from the same worked-out plan the solid boxes come from: white
 *   rendered walls with real openings (black frames outside, glass in the middle of the wall), the floors of every room
 *   in that home's own materials, ceilings, the inner walls, the stairs, glass rails round the open wells and terraces,
 *   flat roofs behind parapets, the pool and its terrace, the drive and the path, hedges and trees.
 * - Each mansion has an accent colour of its own: the frame round the front door, the front door, the garage door.
 * - The furniture (the apartments' detailed pieces, the same list the solid boxes come from) is built only for the
 *   mansion you are in, or the one whose front door you are at, and taken down when you leave.
 * - Faces never share a plane: the ends of walls that run into other walls are left out, finishes are the faces of the
 *   walls themselves, frames stand just in front of the wall, panes in its middle.
 * - The front door opens for the owner (alone in Sandbox for everyone) and stays shut, and solid, otherwise. */
(function(root){'use strict';
const PI=Math.PI,VS=()=>root.CityVillas,LK=()=>root.CityApartmentsLook,AR=()=>root.CityApartmentsRooms;
const PARA=.45,WHITE='stucco|#f7f6f2',INNER='#f2f0eb',CEILING='#fbfaf7',FRAME='#17181a';
const FLOORS={oak:'wood|#d9bb8f',walnut:'wood|#7d5838',ash:'wood|#e4d6bf',oakPale:'wood|#eadcc0',concrete:'concrete|#b9b7b2',marbleW:'marble',marbleG:'marble|#d7dad6',marbleB:'marble|#55575b',marbleP:'marble|#efe3dc',stone:'paving|#d8d2c6',stoneL:'paving|#e1dcd2',terracotta:'tiles|#c4825c',smoke:'wood|#5b5550'};
function floorKey(v,room){const L=AR()?.LOOKS?.[v.design];if(room.kind==='garage')return'concrete|#a9a7a3';if(room.kind==='terrace')return'deck';if(room.kind==='roof')return'concrete|#d4d1ca';
 const k=['bath','wc','laundry'].includes(room.kind)?L?.bathFloor:L?.floor;return FLOORS[k]||'wood|#d9bb8f';}
// ---- one mansion ------------------------------------------------------------------------------------------------------------
function buildVilla(T,v,acc,det){
 const V=VS(),plan=V.planOf(v),D=V.derive(plan),UP=V.UP,CEIL=V.CEIL,CEIL2=V.CEIL2,ROOF=V.ROOF,LIFT=V.LIFT,TT=V.T,panes=[];
 const roomAt=(f,x,z)=>D.rooms.find(r=>r.f===f&&x>r.x0&&x<r.x1&&z>r.z0&&z<r.z1)||null,indoor=r=>!!r&&!V.OUT.has(r.kind);
 const accentKey=plan.accentKey==='battens'?'battens|'+plan.accent:plan.accent;
 // a quad facing up or down at height y over a rectangle
 const up=(key,x0,x1,z0,z1,y)=>{if(x1-x0>.003&&z1-z0>.003)acc.quad(key,[x0,y,z1],[x1,y,z1],[x1,y,z0],[x0,y,z0],0,1,0,x0,-z1,x1,-z0);};
 const down=(key,x0,x1,z0,z1,y)=>{if(x1-x0>.003&&z1-z0>.003)acc.quad(key,[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1],0,-1,0,x0,z0,x1,z1);};
 // ---- floors and ceilings
 for(const r of D.ground)up(floorKey(v,r),r.x0,r.x1,r.z0,r.z1,0);
 for(const r of D.upper){if(r.kind==='void')continue;up(floorKey(v,r),r.x0,r.x1,r.z0,r.z1,UP);down(CEILING,r.x0,r.x1,r.z0,r.z1,CEIL);
  /* the edge of the floor where it stops at an open well */for(const s of D.segs){if(s.f!==1||!s.A||!s.B)continue;if(s.A!==r&&s.B!==r)continue;const other=s.A===r?s.B:s.A;if(!other||other.kind!=='void')continue;
   /* r is on the low side (A) of the line: its edge faces up the axis */face(acc,INNER,s.axis==='x'?'z':'x',s.c,s.a,s.b,CEIL,UP,s.A===r?1:-1);}}
 for(const r of D.two){down(CEILING,r.x0,r.x1,r.z0,r.z1,CEIL2);up('concrete|#d9d6cf',r.x0,r.x1,r.z0,r.z1,ROOF);}
 /* a low wall along the outer edges of the flat roofs you can step out on (the terraces have glass rails instead) */
 for(const s of D.segs){if(s.f!==1||s.type!=='none')continue;const roof=s.A&&s.A.kind==='roof'&&!s.B?s.A:s.B&&s.B.kind==='roof'&&!s.A?s.B:null;if(!roof)continue;const inA=roof===s.A,a0=inA?s.c-.25:s.c,a1=inA?s.c:s.c+.25;
  if(s.axis==='x')acc.box(WHITE,s.a,s.b,UP,UP+.4,a0,a1,'ny');else acc.box(WHITE,a0,a1,UP,UP+.4,s.a,s.b,'ny');}
 // ---- walls
 for(const s of D.walls){const base=s.f*UP,ext=s.ext;
  // how high: outer walls up to the floor above (and a parapet above the top floor's roof); inner walls to the ceiling
  let top,bottom=0;if(ext){top=s.f?ROOF+PARA-UP:UP;bottom=s.f?0:-LIFT-.3;}else top=(s.f?CEIL2:CEIL)-base;
  /* the house's own cladding on the upper floor of the front (and on the private rooms' front where the house is mostly one storey) */const clad=ext&&plan.clad&&s.side==='f'&&(s.f===1||(D.two.length<3&&['primary','bed','bath','wardrobe','gallery'].includes(s.room.kind)));
  const pieces=V.wallPieces(s,bottom,top,false),outer=ext?(clad?plan.clad:WHITE):INNER;
  /* the top of a ground-floor outer wall at the upper floor: only the part no upper floor covers (they share one height, and
     under a floor-length window upstairs the two would flicker); the rest of the wall top is under the floor */
  const ups=ext&&s.f===0?D.upper.filter(r=>r.kind!=='void'):null;
  const topFace=(u0,u1,Y)=>{if(!ups||Math.abs(Y-UP)>1e-6){if(s.axis==='x')up(outer,u0,u1,s.t0,s.t1,Y);else up(outer,s.t0,s.t1,u0,u1,Y);return;}
   const along=r=>s.axis==='x'?[r.x0,r.x1]:[r.z0,r.z1],across=r=>s.axis==='x'?[r.z0,r.z1]:[r.x0,r.x1],cuts=[u0,u1];
   for(const r of ups)for(const e of along(r))if(e>u0&&e<u1)cuts.push(e);cuts.sort((p,q)=>p-q);
   for(let i=0;i+1<cuts.length;i++){const a=cuts[i],b=cuts[i+1],m=(a+b)/2;if(b-a<.003)continue;let lo=s.t0,hi=s.t1;
    for(const r of ups){const[ra,rb]=along(r);if(m<=ra||m>=rb)continue;const[c0,c1]=across(r);if(c0<=lo+1e-6&&c1>lo)lo=Math.min(hi,c1);else if(c1>=hi-1e-6&&c0<hi)hi=Math.max(lo,c0);}
    if(hi-lo>.003){if(s.axis==='x')up(outer,a,b,lo,hi,Y);else up(outer,lo,hi,a,b,Y);}}};
  for(const[u0,u1,y0,y1]of pieces){
   /* which faces: the wall's two sides always (the outer and inner colours), its ends only at openings and at the free
      or outward-corner ends; its top always on outer walls (hidden where a wall stands on it) and on the ground floor's
      inner walls (seen from the rooms two storeys high); the underside of upper inner walls (seen over an open well) */
   const atA=Math.abs(u0-(s.a-s.ea))<1e-6,atB=Math.abs(u1-(s.b+s.eb))<1e-6,endA=atA?(ext?(s.axis==='x'&&s.ea>0):!s.ja):true,endB=atB?(ext?(s.axis==='x'&&s.eb>0):!s.jb):true;
   const showTop=y1<top-1e-6?true:(ext||s.f===0),showBottom=y0>bottom+1e-6||(!ext&&s.f===1);
   const Y0=base+y0,Y1=base+y1;
   if(s.axis==='x'){const zi=ext?(s.side==='f'?s.t0:s.t1):null,zo=ext?(s.side==='f'?s.t1:s.t0):null;
    // the two long faces
    if(ext){face(acc,outer,'z',zo,u0,u1,Y0,Y1,s.side==='f'?1:-1);face(acc,INNER,'z',zi,u0,u1,Y0,Y1,s.side==='f'?-1:1);}else{face(acc,INNER,'z',s.t1,u0,u1,Y0,Y1,1);face(acc,INNER,'z',s.t0,u0,u1,Y0,Y1,-1);}
    if(endA)face(acc,outer,'x',u0,s.t0,s.t1,Y0,Y1,-1);if(endB)face(acc,outer,'x',u1,s.t0,s.t1,Y0,Y1,1);
    if(showTop)topFace(u0,u1,Y1);if(showBottom)down(outer,u0,u1,s.t0,s.t1,Y0);}
   else{const xi=ext?(s.side==='r'?s.t0:s.t1):null,xo=ext?(s.side==='r'?s.t1:s.t0):null;
    if(ext){face(acc,outer,'x',xo,u0,u1,Y0,Y1,s.side==='r'?1:-1);face(acc,INNER,'x',xi,u0,u1,Y0,Y1,s.side==='r'?-1:1);}else{face(acc,INNER,'x',s.t1,u0,u1,Y0,Y1,1);face(acc,INNER,'x',s.t0,u0,u1,Y0,Y1,-1);}
    if(endA)face(acc,outer,'z',u0,s.t0,s.t1,Y0,Y1,-1);if(endB)face(acc,outer,'z',u1,s.t0,s.t1,Y0,Y1,1);
    if(showTop)topFace(u0,u1,Y1);if(showBottom)down(outer,s.t0,s.t1,u0,u1,Y0);}}
  // frames, panes, mullions, the garage door
  if(!ext)continue;const out=s.side==='f'||s.side==='r'?1:-1,face0=s.side==='f'||s.side==='r'?s.t1:s.t0,mid=(s.t0+s.t1)/2;
  const bar=(key,u0,u1,y0,y1,d0,d1)=>{const a=face0+out*d0,b=face0+out*d1;if(s.axis==='x')acc.box(key,u0,u1,base+y0,base+y1,Math.min(a,b),Math.max(a,b));else acc.box(key,Math.min(a,b),Math.max(a,b),base+y0,base+y1,u0,u1);};
  for(const o of s.ops){const w=o.u1-o.u0,c=(o.u0+o.u1)/2;
   if(o.type==='door')continue;
   const fr=.05;bar(FRAME,o.u0-fr,o.u0,o.y0>.05?o.y0-fr:o.y0,o.y1+fr,.004,.05);bar(FRAME,o.u1,o.u1+fr,o.y0>.05?o.y0-fr:o.y0,o.y1+fr,.004,.05);bar(FRAME,o.u0,o.u1,o.y1,o.y1+fr,.004,.05);if(o.y0>.05)bar(FRAME,o.u0,o.u1,o.y0-fr,o.y0,.004,.05);
   if(o.type==='win'||o.type==='full'){/* the pane in the middle of the wall, mullions about every 2 m on wide glass */const p=s.axis==='x'?[c,base+(o.y0+o.y1)/2,mid]:[mid,base+(o.y0+o.y1)/2,c];panes.push({p,ry:s.axis==='x'?0:PI/2,w,h:o.y1-o.y0});
    const n=Math.max(0,Math.round(w/2.1)-1);for(let k=1;k<=n;k++){const u=o.u0+w*k/(n+1);if(s.axis==='x')acc.box(FRAME,u-.025,u+.025,base+o.y0,base+o.y1,mid-.035,mid+.035);else acc.box(FRAME,mid-.035,mid+.035,base+o.y0,base+o.y1,u-.025,u+.025);}}
   else if(o.type==='garage'){/* a dark slatted door, just inside the opening */const k='#3c3f43',a=mid-.03,b=mid+.03;for(let y=o.y0;y<o.y1-.01;y+=.25){const y1=Math.min(o.y1,y+.235);if(s.axis==='x')acc.box(k,o.u0+.01,o.u1-.01,base+y,base+y1,a,b);else acc.box(k,a,b,base+y,base+y1,o.u0+.01,o.u1-.01);}}
   else if(o.type==='entry'){/* the frame of the front door in the house's accent colour: two fins and a lintel standing out from the wall, and a canopy */
    bar(accentKey,o.u0-.42,o.u0-.12,0,o.y1+.42,.05,.62);bar(accentKey,o.u1+.12,o.u1+.42,0,o.y1+.42,.05,.62);bar(accentKey,o.u0-.12,o.u1+.12,o.y1+.12,o.y1+.42,.05,.62);
    bar('white',o.u0-1.4,o.u1+1.4,o.y1+.62,o.y1+.8,.05,1.9);bar('light',c-.25,c+.25,o.y1+.6,o.y1+.62,.9,1.3);}}}
 // ---- a white band along the front and the back at the upper floor, standing out from the wall (the roof's edge where the house is one storey)
 {const lines=new Map();for(const s of D.walls){if(!s.ext||s.f!==0||s.axis!=='x')continue;const k=s.side+'|'+s.c;if(!lines.has(k))lines.set(k,[]);lines.get(k).push(s);}
  for(const[k,ss]of lines){ss.sort((p,q)=>p.a-q.a);const runs=[];for(const s of ss){const last=runs[runs.length-1];if(last&&Math.abs(last.b-s.a)<1e-6){last.b=s.b;last.eb=s.eb;}else runs.push({a:s.a,b:s.b,ea:s.ea,eb:s.eb,s});}
   for(const r of runs){const s=r.s,out=s.side==='f'?1:-1,f0=s.side==='f'?s.t1:s.t0,u0=r.ea>0?r.a-r.ea-.45:r.a+TT,u1=r.eb>0?r.b+r.eb+.45:r.b-TT,z0=Math.min(f0,f0+out*.45),z1=Math.max(f0,f0+out*.45),skip=(out>0?'nz':'pz')+(r.ea>0?'':',nx')+(r.eb>0?'':',px');/* its top 2 cm under the bottom of the frames of floor-length windows upstairs (they end at UP+.08; one height flickered) */if(u1-u0>.5)acc.box('white',u0,u1,UP-.18,UP+.06,z0,z1,skip);}}}
 // ---- rails round the open wells and the terraces: glass with a slim metal top
 for(const s of D.rails){const y=s.f*UP,a=s.a,b=s.b;if(s.axis==='x'){acc.box('rail',a,b,y,y+V.RAIL-.05,s.c-.012,s.c+.012);acc.box('steel',a,b,y+V.RAIL-.05,y+V.RAIL,s.c-.03,s.c+.03);}else{acc.box('rail',s.c-.012,s.c+.012,y,y+V.RAIL-.05,a,b);acc.box('steel',s.c-.03,s.c+.03,y+V.RAIL-.05,y+V.RAIL,a,b);}}
 // ---- the stairs: oak blocks, a rail on the open side
 {const st=D.stair,n=V.STEPS,riseY=UP/n,len=st.len,tread=len/n;for(let k=0;k<n;k++){const top=(k+1)*riseY,t0=k*tread,t1=(k+1)*tread,a=st.up?t0:len-t1,b=st.up?t1:len-t0;
   /* the face towards the next step up is inside that step: left out */const skip=k<n-1?(st.up?(st.along==='z'?'pz':'px'):(st.along==='z'?'nz':'nx')):'';
   if(st.along==='z')acc.box('wood|#a9825a',st.x0,st.x1,0,top,st.z0+a,st.z0+b,skip+',ny');else acc.box('wood|#a9825a',st.x0+a,st.x0+b,0,top,st.z0,st.z1,skip+',ny');}}
 // ---- the pool (V15.4: a basin you can swim in) and its terrace on the view side
 {const P=V.poolOf(D),I=V.poolInside(D),y=-LIFT,deck='paving|#e4ded3',x0=Math.min(D.xmin,P.x0-2.5),x1=Math.max(D.xmax,P.x1+2.5),z0=P.z0-2.2,z1=D.zmin-TT,F=V.POOL_FLOOR,W=V.POOL_WATER,C=V.POOL_COPING,tile='marble|#d3eaef',deep='marble|#9fd0dc';
  const slab=(a,b,c,d)=>{if(b-a>.01&&d-c>.01)acc.box(deck,a,b,y-.04,y+.03,c,d,'ny');};slab(x0,x1,z0,P.z0);slab(x0,x1,P.z1,z1);slab(x0,P.x0,P.z0,P.z1);slab(P.x1,x1,P.z0,P.z1);
  /* round the water: a marble coping 2 cm proud of the paving, over tiled walls down to a tiled floor (the ground is not
     drawn inside the coping: city-ground.js leaves a hole there) */
  for(const[a,b,c,d]of[[P.x0,P.x1,P.z0,I.z0],[P.x0,P.x1,I.z1,P.z1],[P.x0,I.x0,I.z0,I.z1],[I.x1,P.x1,I.z0,I.z1]]){acc.box('marble',a,b,y-.04,C,c,d,'ny');acc.box(tile,a,b,F,y-.04,c,d,'ny,py');}
  acc.box(deep,I.x0,I.x1,F-.1,F,I.z0,I.z1,'ny');
  /* a dark line along the middle of the floor, as in a lap pool */acc.box('#2f6f86',I.x0+1.2,I.x1-1.2,F,F+.01,(I.z0+I.z1)/2-.12,(I.z0+I.z1)/2+.12,'ny');
  /* the ways out: steps in the left corner by the house, a steel ladder on the right (water exits in villas.js) */
  for(let k=0;k<4;k++){const top=W-.25-k*.35,a=I.x0+k*.4,b=a+.4;acc.box('marble',a,b,F,top,I.z1-1.5,I.z1,'ny');}
  {const lx=I.x1-.6;for(const s of[-.24,.24]){acc.box('steel',lx+s-.022,lx+s+.022,W-1.2,C+.75,I.z1-.06,I.z1-.016,'ny');acc.box('steel',lx+s-.022,lx+s+.022,C+.72,C+.76,I.z1-.06,I.z1+.35,'');acc.box('steel',lx+s-.022,lx+s+.022,C,C+.72,I.z1+.3,I.z1+.35,'ny');}for(let k=0;k<4;k++){const ry=W-.95+k*.3;acc.box('steel',lx-.24,lx+.24,ry,ry+.035,I.z1-.12,I.z1-.06,'');}}
  up('water',I.x0,I.x1,I.z0,I.z1,W);/* the surface seen from under the water (1 cm lower; each side is drawn only from its own side) */down('water',I.x0,I.x1,I.z0,I.z1,W-.01);
  /* sun loungers along the pool */for(let i=0;i<3;i++){const x=P.x0+1.5+i*2.2,z=P.z0-1.3;det.box('white',x-.35,x+.35,y+.03,y+.38,z-.95,z+.95);det.box('#d9d3c7',x-.33,x+.33,y+.38,y+.46,z-.9,z+.55);det.box('#d9d3c7',x-.33,x+.33,y+.38,y+.8,z+.6,z+.9);}}
 // ---- the way in: a path to the door, a drive to the garage, a hedge, trees, a light by the door
 {const y=-LIFT,road=D.zmax+12,pave='paving|#d9d4ca',e=D.entry;acc.box(pave,e.x-.9,e.x+.9,y-.04,y+.03,D.zmax+TT,road,'ny');
  const g=D.segs.find(s=>s.ext&&s.ops.some(o=>o.type==='garage'));if(g){const o=g.ops.find(o=>o.type==='garage');acc.box('concrete|#c7c3bb',o.u0-.3,o.u1+.3,y-.05,y+.02,D.zmax+TT,road,'ny');}
  const hedge=(a,b,c,d)=>det.box('leafDark',a,b,y,y+1.1,c,d);const side=V.PAD.w/2,px0=-side+(v.pad.x-v.x)*-1,px1=side+(v.pad.x-v.x)*-1;
  hedge(px0+.3,px0+1.1,D.zmin-12,road-1.5);hedge(px1-1.1,px1-.3,D.zmin-12,road-1.5);
  /* two trees in the front garden clear of the path and the drive, two in the back garden beside the terrace */
  const rng=LK().rng(LK().hash(v.id)),go=g?g.ops.find(o=>o.type==='garage'):null,clear=x=>Math.abs(x-e.x)>2.6&&(!go||x<go.u0-2.4||x>go.u1+2.4),front=[];for(let x=px0+3;x<=px1-3;x+=1.5)if(clear(x))front.push(x);
  const picks=front.length?[front[Math.floor(rng()*front.length*.4)],front[front.length-1-Math.floor(rng()*front.length*.4)]]:[];
  for(const[tx,tz]of[...picks.map((x,i)=>[x,D.zmax+4.5+i*1.3]),[px0+3,D.zmin-6],[px1-3,D.zmin-9]]){det.geo('wood',new T.CylinderGeometry(.13,.17,2.6,7),new T.Matrix4().makeTranslation(tx,y+1.2,tz));for(let k=0;k<5;k++)det.geo(k%2?'leaf':'leafDark',new T.SphereGeometry(1.1+rng()*.4,9,7),new T.Matrix4().makeTranslation(tx+(rng()-.5)*1.2,y+3.1+rng()*.9,tz+(rng()-.5)*1.2));}}
 return{panes,D};}
/* one face of an upright box: along 'x' at z = at (or 'z' at x = at), from a to b, between y0 and y1, facing dir (+1/-1) */
function face(acc,key,axis,at,a,b,y0,y1,dir){if(b-a<.003||y1-y0<.003)return;
 if(axis==='z'){if(dir>0)acc.quad(key,[a,y0,at],[b,y0,at],[b,y1,at],[a,y1,at],0,0,1,a,y0,b,y1);else acc.quad(key,[b,y0,at],[a,y0,at],[a,y1,at],[b,y1,at],0,0,-1,-b,y0,-a,y1);}
 else{if(dir>0)acc.quad(key,[at,y0,b],[at,y0,a],[at,y1,a],[at,y1,b],1,0,0,-b,y0,-a,y1);else acc.quad(key,[at,y0,a],[at,y0,b],[at,y1,b],[at,y1,a],-1,0,0,a,y0,b,y1);}}
// ---- all six ----------------------------------------------------------------------------------------------------------------
function build(scene){
 const V=VS(),L=LK();if(!V||!L||!scene?.world?.villas?.length)return;if(scene.villaLook)dispose(scene);const T=scene.T,M=L.materials(T);
 const rootG=new T.Group();rootG.name='villas';scene.scene.add(rootG);
 const paint=new T.MeshStandardMaterial({vertexColors:true,roughness:.6});const mat=key=>{if(key==='paint')return paint;const[base,tint]=key.split('|');return tint?L.tinted(T,M,base,tint):M[base]||M.white;};
 const glass=new T.MeshPhysicalMaterial({color:'#9db7c1',roughness:.04,metalness:.1,transparent:true,opacity:.34,depthWrite:false,side:T.DoubleSide,envMapIntensity:1.2,emissive:'#ffd29a',emissiveIntensity:0});
 const list=[];
 for(const v of scene.world.villas){try{const acc=new L.Acc(T),det=new L.Acc(T),b=buildVilla(T,v,acc,det),g=new T.Group();g.name='villa:'+v.id;g.position.set(v.x,v.y,v.z);g.rotation.y=V.yawOf(v);
   const sh=acc.build(mat,'villa-shell:'+v.id,true),dt=det.build(mat,'villa-detail:'+v.id,true);g.add(sh,dt);
   // the inside paint takes no sun shadows: the roof's shadow edge on it showed as a saw-tooth line under the ceiling
   sh.traverse(o=>{if(o.isMesh&&/:paint$/.test(o.name))o.receiveShadow=false;});
   const pg=new T.PlaneGeometry(1,1),pm=new T.InstancedMesh(pg,glass,b.panes.length);b.panes.forEach((q,i)=>pm.setMatrixAt(i,new T.Matrix4().compose(new T.Vector3(...q.p),new T.Quaternion().setFromEuler(new T.Euler(0,q.ry,0)),new T.Vector3(q.w,q.h,1))));pm.instanceMatrix.needsUpdate=true;pm.renderOrder=2;g.add(pm);
   // the front door: a leaf that swings in about its hinge
   const D=b.D,e=D.entry,plan=V.planOf(v),leaf=new T.Mesh(new T.BoxGeometry(e.w-.04,e.h-.03,.06),new T.MeshStandardMaterial({color:plan.accent,roughness:.5}));const hinge=new T.Group();hinge.position.set(e.x-e.w/2+.02,(e.h-.03)/2,e.z+V.T/2);leaf.position.set((e.w-.04)/2,0,0);hinge.add(leaf);g.add(hinge);
   rootG.add(g);g.updateMatrixWorld(true);list.push({v,g,detail:dt,hinge,open:0,doorBox:undefined});}catch(err){scene.villaLookError=String(err&&err.stack||err);}}
 scene.villaLook={root:rootG,list,glass,home:null};}
function dispose(scene){const a=scene.villaLook;if(!a)return;if(a.home)dropHome(a);a.root.removeFromParent();a.root.traverse(o=>{if(o.geometry)o.geometry.dispose();});scene.villaLook=null;}
// ---- the furniture of the one you are in -------------------------------------------------------------------------------------
function buildHome(scene,b){const T=scene.T,R=AR(),V=VS();if(!R?.Room||!R.kit)return null;const L=R.LOOKS[b.v.design]||R.LOOKS.minimal,M=R.makeMats(T,L),room=new R.Room(T,M),K=R.kit(room,L,b.v.design);
 for(const it of V.derive(V.planOf(b.v)).items){const f=K[it.k];if(f)try{f(it);}catch(e){scene.villaRoomError=(scene.villaRoomError||'')+it.k+': '+(e&&e.message)+'; ';}}
 const g=room.build('villa-inside:'+b.v.id);g.position.copy(b.g.position);g.rotation.copy(b.g.rotation);scene.scene.add(g);return{id:b.v.id,group:g};}
function dropHome(a){const h=a.home;if(!h)return;h.group.removeFromParent();h.group.traverse(o=>{if(o.geometry)o.geometry.dispose();});a.home=null;}
const mineOf=(sim,V,v)=>sim.onlineRoom?/* V15.7: the room's host says which front doors are open (the houses' list) */!!(sim.onlineHousesOpen?.includes(v.id)||sim.onlineVillasOpen?.includes(v.id)):(V.owns(sim,v.id)||sim.profile?.mode==='sandbox');
function draw(scene){
 const a=scene.villaLook,sim=root.PlatdoCity?.sim,V=VS();if(!a||!sim||!V)return;const cam=scene.camera.position,p=sim.player,dt=Math.min(.1,Math.max(0,(scene.time||0)-(a.t||0)));a.t=scene.time||0;
 const night=sim.dayTime<.27||sim.dayTime>.77;a.glass.emissiveIntensity=night?.45:0;
 const inside=V.villaAt(sim.world,p.x,p.y,p.z);let want=inside?inside.villa.id:null;
 for(const b of a.list){const d=Math.hypot(b.v.pad.x-cam.x,b.v.pad.z-cam.z);b.detail.visible=d<320;
  const door=V.frontDoor(b.v),near=Math.hypot(p.x-door.x,p.z-door.z)<3.6&&Math.abs(p.y-b.v.y)<2.4,mine=mineOf(sim,V,b.v);if(!want&&mine&&Math.hypot(p.x-door.x,p.z-door.z)<14)want=b.v.id;
  const goal=mine&&(near||inside?.villa===b.v)?1:0;if(b.doorBox===undefined)b.doorBox=sim.world.colliders.find(q=>q.villa===b.v.id&&q.villaDoor)||null;if(b.doorBox)b.doorBox.enabled=!(mine&&b.open>.5);
  if(b.open!==goal){b.open+=Math.sign(goal-b.open)*Math.min(Math.abs(goal-b.open),dt*2.2);/* it swings in, away from the road */b.hinge.rotation.y=b.open*PI/2*.92;}}
 if(a.home&&a.home.id!==want)dropHome(a);
 if(!a.home&&want){const b=a.list.find(q=>q.v.id===want);if(b)a.home=buildHome(scene,b);}}
root.CityVillaLook={build,draw,dispose,buildVilla,floorKey};
})(typeof globalThis!=='undefined'?globalThis:this);
