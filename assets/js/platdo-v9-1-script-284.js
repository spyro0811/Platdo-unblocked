
/* City architecture: parcel-preserving assemblies, district materials and real openings.
 * All geometry is batched by CityScene. No protected home/workshop resource is changed. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;root.CityArchitectureModels=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const VERSION=30,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const protectedIds=new Set(['safehouse-1','mansion','garage-1']);
const palettes={
 brick:{wall:'#ad7d65',stone:'#d4c3a6',frame:'#394a49',roof:'#655f59',accent:'#617b6b',floor:'#b7ae99',room:'#d2c4aa'},
 tower:{wall:'#bac2bd',stone:'#d6d5c6',frame:'#526569',roof:'#7b8584',accent:'#678790',floor:'#a6aeaa',room:'#c7c9b9'},
 townhouse:{wall:'#ab7966',stone:'#d3c3a6',frame:'#49594d',roof:'#705e54',accent:'#60786d',floor:'#b5a68a',room:'#d4c1a2'},
 industrial:{wall:'#a3a69a',stone:'#b6b4a4',frame:'#546566',roof:'#6d7b7d',accent:'#bd9e65',floor:'#9b9d91',room:'#c3c6b5'},
 coast:{wall:'#dfd5bc',stone:'#e6dcc3',frame:'#687b73',roof:'#b69a7d',accent:'#799f9a',floor:'#c2b69b',room:'#e4d4b7'},
 hill:{wall:'#b3b5a2',stone:'#d0c7ad',frame:'#566459',roof:'#6d7469',accent:'#7c8c72',floor:'#b5b3a0',room:'#d2cfb9'}
};
const stores={
 clothing:{family:'athletic-outfitter',name:'Platdo Basics',wall:'#d7ceba',stone:'#eee3cc',frame:'#435756',roof:'#828b83',accent:'#738769',floor:'#b6b7a5',room:'#e0dac8',layout:'performance'},
 'clothing-drip':{family:'streetwear-atelier',name:'Drip District',wall:'#98715e',stone:'#d2bfa4',frame:'#354a48',roof:'#68716c',accent:'#628d82',floor:'#9b9e8e',room:'#c4bca7',layout:'streetwear'},
 'clothing-luxury':{family:'coastal-boutique',name:'Platdo Luxury',wall:'#dcd1bb',stone:'#e9dfc9',frame:'#8f7e5b',roof:'#a99f8b',accent:'#b1a28b',floor:'#d2c6ab',room:'#e6dcca',layout:'boutique'},
 'clothing-oddball':{family:'novelty-outfitter',name:'Oddball Outfitters',wall:'#d3d0b1',stone:'#e4dbc1',frame:'#697a68',roof:'#898b77',accent:'#b58165',floor:'#b9a688',room:'#d9d1b8',layout:'novelty'},
 diner:{family:'copper-kettle-cafe',wall:'#b58168',stone:'#e0ccb0',frame:'#475b55',roof:'#89705d',accent:'#bc9064',floor:'#b8b09c',room:'#dfceb1'},
 equipment:{family:'field-equipment-shop',wall:'#a6ad9b',stone:'#d1c8ad',frame:'#415752',roof:'#6b7971',accent:'#bdab79',floor:'#9b9e8d',room:'#c7cbb6'},
 marina:{family:'coastal-marina-office',wall:'#c5cfb9',stone:'#e0d5b9',frame:'#597a77',roof:'#8d9b91',accent:'#ae9270',floor:'#bba98a',room:'#ded7be'},
 relay:{family:'hilltop-relay',wall:'#a5b09d',stone:'#c6c9b2',frame:'#53655c',roof:'#738075',accent:'#a8a67b',floor:'#b4b6a4',room:'#c4cdb9'},
 hangar:{family:'regional-flight-hangar',wall:'#b1b9b0',stone:'#d6d3bc',frame:'#53747a',roof:'#7c9194',accent:'#b9a16f',floor:'#a8ada4',room:'#d0d5c8'},
 'airport-terminal':{family:'regional-terminal',wall:'#d0d5c6',stone:'#e0dfca',frame:'#577980',roof:'#849b9b',accent:'#a58f64',floor:'#b8c0b3',room:'#e1e2d0'},
 'safehouse-2':{family:'redfern-residence',wall:'#b38b70',stone:'#e1cfaf',frame:'#58694e',roof:'#786953',accent:'#8f9b78',floor:'#bba783',room:'#dcc8a6'},
 'garage-2':{family:'redfern-motor-workshop',wall:'#a1a99c',stone:'#cdc6ab',frame:'#526c65',roof:'#7d897f',accent:'#b4a176',floor:'#a5a792',room:'#ccd0b9'},
 'warehouse-1':{family:'nine-bay-foundry',wall:'#a7977b',stone:'#c7bda5',frame:'#5c6c65',roof:'#77827a',accent:'#b4a17b',floor:'#9a9d88',room:'#bbbfa8'},
 'warehouse-2':{family:'twelve-sawtooth-warehouse',wall:'#8f9e96',stone:'#bdc2ac',frame:'#536c6a',roof:'#6c8281',accent:'#b4a077',floor:'#a4aa98',room:'#c6cbb7'}
};
function excluded(s){return !!(protectedIds.has(s.id)||s.customHome||s.customWorkshop||s.casino||s.type==='casino');}
function design(s){const a=s.architecture||{},base=palettes[s.style]||palettes[s.district==='northpoint'?'industrial':'brick'];const eat=globalThis.CityRestaurants?.palette(s.id)||globalThis.CitySixSeven?.palette(s.id),p={...base,...stores[s.id],...eat};if(!stores[s.id]&&!eat){const v=(a.ordinal||0)%3;if(s.style==='tower'){p.wall=['#bac2bd','#c9c3b1','#9aafb0'][v];p.roof=['#7b8584','#8c8676','#6a8184'][v];p.frame=['#526569','#5c6458','#435d66'][v];}else if(s.style==='brick'||s.style==='townhouse'){p.wall=['#ad7d65','#aa8e72','#96786b'][v];p.roof=['#655f59','#756b5b','#62666a'][v];}}return {...p,id:s.id,family:p.family||[s.style||'brick',a.family||'terraced-block'].join('-'),variant:a.ordinal||0,storey:s.style==='industrial'?4.6:s.style==='tower'?3.45:3.05,accessible:!!s.interior};}
function geometry(scene,type){
 if(!type.startsWith('arch30-'))return null;const T=scene.T,points=[],normals=[],uvs=[],surfaces=[];let surface=0;
 const quad=(a,b,c,d)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),cv=new T.Vector3(...c),n=bv.sub(av).cross(cv.sub(av)).normalize();for(const [p,uv]of[[a,[0,0]],[b,[1,0]],[c,[1,1]],[a,[0,0]],[c,[1,1]],[d,[0,1]]]){points.push(...p);normals.push(n.x,n.y,n.z);uvs.push(...uv);surfaces.push(surface);}};
 const slab=(x,y,z,w,h,d)=>{const l=x-w/2,r=x+w/2,lo=y-h/2,hi=y+h/2,n=z-d/2,f=z+d/2;quad([l,lo,f],[r,lo,f],[r,hi,f],[l,hi,f]);quad([r,lo,n],[l,lo,n],[l,hi,n],[r,hi,n]);quad([l,lo,n],[l,lo,f],[l,hi,f],[l,hi,n]);quad([r,lo,f],[r,lo,n],[r,hi,n],[r,hi,f]);quad([l,hi,f],[r,hi,f],[r,hi,n],[l,hi,n]);quad([l,lo,n],[r,lo,n],[r,lo,f],[l,lo,f]);};
 if(type.startsWith('arch30-bay:')){
  const [,wr,hr,depth]=type.split(':').map((v,i)=>i?Number(v):v),l=-wr/2,r=wr/2,lo=-hr/2,hi=hr/2;
  const ring=(outer,inner,z)=>{for(let i=0;i<4;i++){const j=(i+1)%4;quad([...outer[i],z],[...outer[j],z],[...inner[j],z],[...inner[i],z]);}};
  const outer=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]],frame=[[l-.018,lo-.025],[r+.018,lo-.025],[r+.018,hi+.025],[l-.018,hi+.025]],opening=[[l,lo],[r,lo],[r,hi],[l,hi]];
  // One shared panel, with a genuine hole and a closed recessed room. Hidden
  // faces between adjacent masonry cubes are not constructed or submitted.
  ring(outer,frame,0);surface=2;ring(frame,opening,.035);
  for(let i=0;i<4;i++){const j=(i+1)%4;quad([...opening[i],.035],[...opening[j],.035],[...opening[j],-.15],[...opening[i],-.15]);}
  surface=3;quad([l,lo,-depth],[r,lo,-depth],[r,hi,-depth],[l,hi,-depth]);quad([l,lo,-.15],[l,lo,-depth],[l,hi,-depth],[l,hi,-.15]);quad([r,lo,-depth],[r,lo,-.15],[r,hi,-.15],[r,hi,-depth]);quad([l,hi,-depth],[r,hi,-depth],[r,hi,-.15],[l,hi,-.15]);quad([l,lo,-.15],[r,lo,-.15],[r,lo,-depth],[l,lo,-depth]);
  surface=1;quad([-.5,.46,.045],[.5,.46,.045],[.5,.5,.045],[-.5,.5,.045]);
  surface=2;quad([-.009,lo,.042],[.009,lo,.042],[.009,hi,.042],[-.009,hi,.042]);
 }else if(type==='arch30-room'){
  // Five inward-facing quads, not five solid cubes. The front is the actual
  // window opening; every room is closed above, below, behind and at its sides.
  quad([-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]);
  quad([-.5,-.5,.5],[-.5,-.5,-.5],[-.5,.5,-.5],[-.5,.5,.5]);
  quad([.5,-.5,-.5],[.5,-.5,.5],[.5,.5,.5],[.5,.5,-.5]);
  quad([-.5,.5,-.5],[.5,.5,-.5],[.5,.5,.5],[-.5,.5,.5]);
  quad([-.5,-.5,.5],[.5,-.5,.5],[.5,-.5,-.5],[-.5,-.5,-.5]);
 }else if(type.startsWith('arch30-frame')){
  // An extruded ring shares its perimeter faces rather than placing four
  // overlapping boxes. Width/height scale with the framed opening.
  const outer=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]],inner=[[-.465,-.465],[.465,-.465],[.465,.465],[-.465,.465]];
  for(let i=0;i<4;i++){const j=(i+1)%4,a=outer[i],b=outer[j],c=inner[j],d=inner[i];quad([...a,.5],[...b,.5],[...c,.5],[...d,.5]);quad([...d,-.5],[...c,-.5],[...b,-.5],[...a,-.5]);quad([...a,-.5],[...b,-.5],[...b,.5],[...a,.5]);quad([...d,.5],[...c,.5],[...c,-.5],[...d,-.5]);}
  if(type==='arch30-frame-split')slab(0,0,0,.023,.94,.55);
 }else return null;
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setAttribute('archSurface',new T.Float32BufferAttribute(surfaces,1));g.computeBoundingSphere();g.userData.citySharedShape=type;return g;
}
function makeMaterial(scene,color,kind){
 if(!kind.startsWith('arch30-'))return null;const T=scene.T,surface=kind.slice(7),opts={color,roughness:.87,metalness:0};
 if(surface.startsWith('facade-')){
  const style=surface.slice(7),p=palettes[style]||palettes.brick,m=new T.MeshStandardMaterial(opts),rgb=c=>{const x=new T.Color(c);return 'vec3('+[x.r,x.g,x.b].map(v=>v.toFixed(5)).join(',')+')';};m.name=kind;m.extensions={derivatives:true};
  const pattern=style==='brick'||style==='townhouse'?"vec2 q=vec2((vArchPosition.x+vArchPosition.z)/.235+mod(floor(vArchPosition.y/.095),2.0)*.5,vArchPosition.y/.095);vec2 edge=min(fract(q),1.0-fract(q));vec2 aa=max(fwidth(q),vec2(.002));float joint=min(smoothstep(.024-aa.x,.024+aa.x,edge.x),smoothstep(.035-aa.y,.035+aa.y,edge.y));float fade=clamp(1.0-max(aa.x,aa.y)*2.0,0.0,1.0);diffuseColor.rgb*=mix(.94,mix(.80,1.02,joint),fade);":style==='industrial'?"float q=(vArchPosition.x+vArchPosition.z)/.43;float edge=min(fract(q),1.0-fract(q));float aa=max(fwidth(q),.002);diffuseColor.rgb*=mix(.96,mix(.80,1.0,smoothstep(.025-aa,.025+aa,edge)),clamp(1.0-aa*2.0,0.0,1.0));":"diffuseColor.rgb*=.98;";
  m.onBeforeCompile=shader=>{shader.vertexShader='attribute float archSurface; varying float vArchSurface; varying vec3 vArchPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvArchSurface=archSurface;vec4 archPosition=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\narchPosition=instanceMatrix*archPosition;\n#endif\nvArchPosition=(modelMatrix*archPosition).xyz;');shader.fragmentShader='varying float vArchSurface; varying vec3 vArchPosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nif(vArchSurface<.5){'+pattern+'}else if(vArchSurface<1.5){diffuseColor.rgb='+rgb(p.stone)+';}else if(vArchSurface<2.5){diffuseColor.rgb='+rgb(p.frame)+';}else{diffuseColor.rgb='+rgb(p.room)+';}');shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nif(vArchSurface>1.5&&vArchSurface<2.5)roughnessFactor=.45;');};m.customProgramCacheKey=()=>kind+'-v1';return m;
 }
 if(surface==='metal')Object.assign(opts,{roughness:.42,metalness:.65});
 if(surface==='glass')Object.assign(opts,{roughness:.24,metalness:.08,transparent:true,opacity:.26,depthWrite:false,side:T.DoubleSide});
 if(surface==='interior')Object.assign(opts,{roughness:.92,emissive:color,emissiveIntensity:.08});
 if(surface==='light')Object.assign(opts,{roughness:.45,emissive:color,emissiveIntensity:.36});
 if(surface==='roof')Object.assign(opts,{roughness:.82,metalness:.13,side:T.DoubleSide});
 const m=new T.MeshStandardMaterial(opts);m.name=kind;m.extensions={derivatives:true};
 if(['brick','stone','timber','panel','concrete'].includes(surface)){
  m.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vArchPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 archPosition=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\narchPosition=instanceMatrix*archPosition;\n#endif\nvArchPosition=(modelMatrix*archPosition).xyz;');shader.fragmentShader='varying vec3 vArchPosition;\n'+shader.fragmentShader;
   const pattern=surface==='brick'?'float r=floor(vArchPosition.y/.095);vec2 q=vec2((vArchPosition.x+vArchPosition.z)/.235+mod(r,2.0)*.5,vArchPosition.y/.095);vec2 edge=min(fract(q),1.0-fract(q));vec2 aa=max(fwidth(q),vec2(.002));float joint=min(smoothstep(.024-aa.x,.024+aa.x,edge.x),smoothstep(.035-aa.y,.035+aa.y,edge.y));diffuseColor.rgb*=mix(.94,mix(.80,1.02,joint),clamp(1.0-max(aa.x,aa.y)*2.0,0.0,1.0));':surface==='stone'?'vec2 q=fract(vec2(vArchPosition.x+vArchPosition.z,vArchPosition.y)/vec2(1.35,.6));float joint=smoothstep(.004,.012,q.x)*smoothstep(.004,.018,q.y);diffuseColor.rgb*=mix(.80,1.0,joint);':surface==='timber'?'float grain=sin((vArchPosition.x+vArchPosition.z)*170.0+sin(vArchPosition.y*2.4)*1.4);float seam=smoothstep(.0,.045,fract(vArchPosition.y/.17));diffuseColor.rgb*=mix(.83,.98+grain*.025,seam);':surface==='panel'?'float seam=smoothstep(.0,.08,fract((vArchPosition.x+vArchPosition.z)/.43));diffuseColor.rgb*=mix(.78,1.0,seam);':'float grain=fract(sin(dot(floor(vArchPosition*21.0),vec3(12.9898,78.233,37.719)))*43758.5453);diffuseColor.rgb*=.97+grain*.05;';shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+pattern);};m.customProgramCacheKey=()=>kind+'-v1';
 }
 return m;
}
function build(scene,b,s,detail){
 if(excluded(s))return false;
 // The permanent base already includes silhouettes, real window depth, glass,
 // entrances and roofs. Curtains, tiny fixtures and gutter fittings belong to
 // the nearby district only, not every distant tower in the entire skyline.
 if(detail==='far')return true;
 const p=design(s),a=s.architecture||{},wallKind=s.style==='tower'?'arch30-stone':['industrial','hangar','garage','warehouse','relay'].includes(s.style)?'arch30-panel':s.style==='coast'||s.id==='clothing-luxury'?'arch30-concrete':'arch30-brick';
 const box=(color,x,y,z,w,h,d,kind='arch30-concrete',ry=0)=>{if(w>.001&&h>.001&&d>.001)scene.box(b,color,s.x+x,s.y+y,s.z+z,w,h,d,ry,kind);};
 /* V7.6: roof edges and parapets stand 2 cm proud of the walls, and the bar across a tower's fins sits 3 cm inside them, so none of them shares a face with its neighbour */
 const proud=q=>q.role==='roof'||q.key.includes('parapet')?.04:q.key==='sky-crossbar'?-.06:0,trimBox=(color,q,kind)=>{const g=proud(q),h=q.h-(g<0?.03:0);box(color,q.x,q.y+h/2,q.z,q.w+g,h,q.d+g,kind);};
 const part=(shape,color,x,y,z,w,h,d,rx=0,ry=0,rz=0,kind='arch30-metal')=>scene.part(b,shape,color,s.x+x,s.y+y,s.z+z,w,h,d,rx,ry,rz,kind);
 const face=(f,color,u,y,w,h,depth=.12,out=0,kind='arch30-concrete')=>box(color,f.x+(f.axis==='z'?u:f.side*out),y,f.z+(f.axis==='x'?u:f.side*out),f.axis==='z'?w:depth,h,f.axis==='x'?w:depth,kind);
 const pane=(f,u,y,w,h)=>part('panel','#bbd1c8',f.x+(f.axis==='z'?u:0),y,f.z+(f.axis==='x'?u:0),w,h,1,0,f.axis==='x'?Math.PI/2:0,0,'arch30-glass');
 const onFace=(shape,f,color,u,y,w,h,depth,out,kind)=>part(shape,color,f.x+(f.axis==='z'?u:f.side*out),y,f.z+(f.axis==='x'?u:f.side*out),w,h,depth,0,f.axis==='x'?f.side*Math.PI/2:f.side<0?Math.PI:0,0,kind);
 const solid=(f,u,y,w)=>!(a.volumes||[]).some((v,i)=>i!==f.volume&&[-.46,0,.46].some(t=>{const x=f.x+(f.axis==='z'?u+w*t:f.side*.18),z=f.z+(f.axis==='x'?u+w*t:f.side*.18);return x>v.x-v.w/2+.015&&x<v.x+v.w/2-.015&&z>v.z-v.d/2+.015&&z<v.z+v.d/2-.015&&y>v.y+.02&&y<v.y+v.h-.02;}));
 const window=(f,u,y,w,h,{room=true,upper=false,decor=false}={})=>{
  const depth=upper?.72:1.35;
  if(!detail){
   // Reveals, mullions and a recessed back/floor form a real opening, not a
   // coloured rectangle pasted over a solid façade. Upper rooms are bounded.
   onFace(w>2.3?'arch30-frame-split':'arch30-frame',f,p.frame,u,y,w+.14,h+.14,.28,-.07,'arch30-metal');
   pane(f,u,y,w,h);
   if(room)onFace('arch30-room',f,p.room,u,y,w+.04,h+.04,depth,-depth/2,'arch30-interior');
  }else{
   face(f,p.stone,u,y-h/2-.13,w+.3,.18,.48,.09,'arch30-stone');
   if(room){
    const n=(Math.abs(Math.round(u*3))+p.variant)%4;
    // Curtains, a desk/sofa silhouette and a small practical fixture occupy
    // bounded room boxes only in near LOD; the exterior never disappears.
    if(n===0||s.style==='townhouse')face(f,p.accent,u+w*.31,y,w*.22,h,.04,-depth*.85,'arch30-timber');
    if(n!==0){face(f,s.style==='tower'?'#7e8d82':'#9c9a80',u-w*.11,y-h*.22,w*.5,h*.18,.24,-depth*.6,'arch30-interior');face(f,'#c3bc9d',u-w*.15,y-h*.04,w*.21,h*.17,.06,-depth*.63,'arch30-interior');}
    if((n+p.variant)%3===0)face(f,'#e2d2ac',u+w*.23,y+h*.28,w*.10,.08,.12,-depth*.88,'arch30-light');
   }
  }
 };
 function roof(v,index=0){
  if(!detail){
   box(p.roof,v.x,v.y+v.h+.12,v.z,v.w-.06,.24,v.d-.06,'arch30-roof');
   // Existing authored roof volumes retain their silhouette and collision.
   for(const q of (a.parts||[]).filter(q=>q.key.startsWith(v.key)&&q.role!=='wall')){
    const color=q.role==='roof'?p.roof:q.role==='metal'?p.frame:p.stone;
    if(q.type==='gable')part('roof',color,q.x,q.y,q.z,q.w,q.h,q.d,0,0,0,'arch30-roof');else trimBox(color,q,q.role==='metal'?'arch30-metal':'arch30-stone');
   }
  }else{
   // Roof services are aligned and set back, with drainage following corners.
   const flat=!(a.parts||[]).some(q=>q.key.startsWith(v.key)&&q.type==='gable');
   if(flat)for(const q of (a.parts||[]).filter(q=>/handler|clerestory|pavilion|penthouse|lookout/.test(q.key)&&q.y>=v.y+v.h-.05)){for(let i=0;i<4;i++)box(p.frame,q.x-q.w*.33+i*q.w*.22,q.y+q.h-.015,q.z,.075,.025,q.d*.74,'arch30-metal');}
   for(const side of[-1,1]){box(p.frame,v.x+side*(v.w/2-.17),v.y+v.h*.5,v.z-v.d/2+.14,.10,v.h,.10,'arch30-metal');box(p.stone,v.x,v.y+v.h+.32,v.z+side*(v.d/2-.11),v.w+.08,.08,.34,'arch30-stone');}
  }
 }
 function structuralFace(f){
  const cols=Math.max(1,Math.floor(f.w/(s.style==='industrial'?5.8:s.style==='tower'?4.3:4.7))),bay=f.w/cols,levels=[0];
  if(s.style==='townhouse'||s.style==='coast'){for(let yy=4;yy<f.h-2.4;yy+=3.6)levels.push(yy);}else{const n=Math.max(1,Math.floor(f.h/p.storey));for(let r=1;r<n;r++)levels.push(r*f.h/n);}levels.push(f.h);const rows=levels.length-1;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
   const sh=levels[r+1]-levels[r],rowBase=f.y+levels[r],u=-f.w/2+(c+.5)*bay,y=rowBase+sh/2;if(!solid(f,u,y,bay)){if(!detail)face(f,p.wall,u,y,bay,sh,.36,-.18,wallKind);continue;}
   const entranceBay=clamp(Math.floor(cols/2+((a.entry||0)-1)*cols*.10),0,cols-1),door=r===0&&f.volume===0&&f.axis==='z'&&f.side===1&&c===entranceBay,industrial=s.style==='industrial';
   let ww=industrial?bay*.65:s.style==='tower'?bay*.76:Math.min(2.1,bay*.61),wh=industrial?Math.min(1.65,sh*.4):Math.min(2.0,sh*.62),wy=y;
   if(door){ww=Math.min(2.1,bay*.63);wh=Math.min(2.7,sh-.25);wy=f.y+wh/2+.08;}
   const balcony=f.volume===0&&f.axis==='z'&&f.side===1&&r>0&&c===Math.floor(cols/2)?(a.parts||[]).find(q=>q.key.startsWith('balcony-floor-')&&Math.abs(q.y-rowBase)<.22):null;
   if(balcony){ww=Math.min(2.1,bay*.63);wh=Math.min(2.3,rowBase+sh-balcony.y-.35);wy=balcony.y+.19+wh/2;}
   if(!door&&!balcony){
    const wr=industrial?.65:s.style==='tower'?.76:s.style==='coast'?.60:.56,hr=industrial?.40:.62,depth=r>0?.72:1.35;ww=bay*wr;wh=sh*hr;
    if(!detail){onFace('arch30-bay:'+wr+':'+hr+':'+depth,f,p.wall,u,y,bay,sh,1,0,'arch30-facade-'+(palettes[s.style]?s.style:'brick'));pane(f,u,y,ww,wh);}
    else window(f,u,y,ww,wh,{room:true,upper:r>0});
    continue;
   }
   if(!detail){
    const bottom=rowBase,top=bottom+sh,under=wy-wh/2-bottom,over=top-wy-wh/2;
    face(f,p.wall,u,bottom+under/2,bay,under,.36,-.18,wallKind);face(f,p.wall,u,top-over/2,bay,over,.36,-.18,wallKind);
    for(const side of[-1,1])face(f,p.wall,u+side*(ww/2+(bay-ww)/4),y,(bay-ww)/2,sh,.36,-.18,wallKind);
    face(f,p.stone,u,top-.08,bay,.16,.20,.025,'arch30-stone');
    if(door||balcony){window(f,u,wy,ww,wh,{room:true});face(f,p.frame,u,wy,.055,wh,.12,.08,'arch30-metal');face(f,p.stone,u+ww*.3,wy-wh/2+1.05,.045,.32,.08,.13,'arch30-metal');}
    else window(f,u,wy,ww,wh,{room:true,upper:r>0});
   }else if(!door){window(f,u,wy,ww,wh,{room:true,upper:r>0});
    if((s.style==='townhouse'||s.style==='coast')&&r>0&&f.axis==='z'&&f.side===1&&c===Math.floor(cols/2)){
     // Align near rail detail to the existing authored balcony slab.
     const q=(a.parts||[]).find(q=>q.key.startsWith('balcony-floor-')&&Math.abs(q.y-rowBase)<.22);
     if(q){for(const yy of[.38,.60,.82])box(p.frame,q.x,q.y+yy,q.z+.44,q.w,.035,.035,'arch30-metal');box(p.frame,q.x,q.y+.57,q.z+.44,.06,.78,.06,'arch30-metal');}
    }
   }
  }
 }
 function serviceWall(f,door=false){
  const industrial=['warehouse','hangar','garage'].includes(s.type),front=f.axis==='z'&&f.side===1;
  const dh=s.type==='hangar'?12:industrial?5:2.8,doorW=door?s.doorWidth:0;
  const segments=door?[[-f.w/2,-doorW/2],[doorW/2,f.w/2]]:[[-f.w/2,f.w/2]];
  if(!detail&&door){face(f,p.wall,0,dh+(s.h-dh)/2,doorW,s.h-dh,.45,0,wallKind);for(const side of[-1,1])face(f,p.frame,side*(doorW/2+.04),dh/2,.14,dh,.55,.04,'arch30-metal');face(f,p.frame,0,dh+.065,doorW+.28,.19,.55,.04,'arch30-metal');}
  for(const [from,to]of segments){
   const width=to-from,storeCols=front&&s.type==='clothing'?s.id==='clothing-drip'?1:s.id==='clothing-oddball'?3:2:null,cols=storeCols||Math.max(1,Math.floor(width/(industrial?10:5))),bay=width/cols;
   for(let c=0;c<cols;c++){
    const terminal=s.type==='terminal',u=from+(c+.5)*bay,ww=bay*(front?(s.id==='clothing-luxury'?.72:.84):.64),wh=terminal?4.4:industrial?1.8:2.15,wy=terminal?3.05:industrial?s.h*.72:1.82,under=wy-wh/2,over=s.h-wy-wh/2;
    if(!detail){/* (V8.4: below and above the window only as wide as the window; the full-height panels beside it fill the rest, so no two panels overlap) */face(f,p.wall,u,under/2,ww,under,.45,0,wallKind);if(terminal){face(f,p.wall,u,5.925,ww,1.35,.45,0,wallKind);face(f,p.wall,u,8.45,ww,1.1,.45,0,wallKind);}else face(f,p.wall,u,s.h-over/2,ww,over,.45,0,wallKind);for(const side of[-1,1])face(f,p.wall,u+side*(ww/2+(bay-ww)/4),s.h/2,(bay-ww)/2,s.h,.45,0,wallKind);}
    window(f,u,wy,ww,wh,{room:false});
    if(terminal){window(f,u,7.25,ww,1.3,{room:false});if(detail)face(f,p.frame,u+bay/2-.12,s.h/2,.18,s.h,.48,.26,'arch30-metal');}
    if(detail&&industrial)/* (V8.4: 4 cm proud of the panels; it was flush with them) */face(f,p.frame,u+bay/2-.08,s.h/2,.16,s.h,.25,.14,'arch30-metal');
   }
  }
 }
 function service(){
  const industrial=['warehouse','hangar','garage'].includes(s.type);
  for(const side of[-1,1]){serviceWall({axis:'z',side,x:0,z:side*s.d/2,w:s.w},side===1);serviceWall({axis:'x',side,x:side*s.w/2,z:0,w:s.d});}
  /* V8.4: a slim post on each corner of a plain-walled place, where the two walls' panels meet */if(!detail&&(industrial||s.type==='terminal'))for(const sx of[-1,1])for(const sz of[-1,1])box(p.frame,sx*s.w/2,s.h/2+.02,sz*s.d/2,.58,s.h+.04,.58,'arch30-metal');
  if(!detail){
   box(p.floor,0,-.035,0,s.w-.04,.10,s.d-.04,s.type==='clothing'||s.type==='marina'?'arch30-timber':'arch30-concrete');
   box(p.room,0,s.h-.12,0,s.w-.04,.22,s.d-.04,'arch30-interior');
   // Keep the standard authority furniture and its collision in agreement.
   for(const f of s.furnishings||[]){
    if(f.kind==='arch-bench'){const x=f.x-s.x,z=f.z-s.z;box(p.frame,x,1,z,2.2,.32,.7,'arch30-metal');box(f.color,x,.73,z,2.5,.30,1,'arch30-interior');for(const side of[-1,1])box(p.frame,x+side,.32,z,.08,.6,.75,'arch30-metal');}
    else scene.furniture(b,f);
   }
   const v={key:'service',x:0,y:0,z:0,w:s.w,d:s.d,h:s.h};roof(v);
   const ro=(a.parts||[]).filter(q=>q.role==='roof'||q.key.includes('parapet')||q.key.includes('clerestory')||q.key.includes('raised-pavilion'));
   for(const q of ro){if(q.type==='gable')part('roof',p.roof,q.x,q.y,q.z,q.w,q.h,q.d,0,0,0,'arch30-roof');else box(q.role==='roof'?p.roof:p.stone,q.x,q.y+q.h/2,q.z,q.w,q.h,q.d,q.role==='roof'?'arch30-roof':'arch30-stone');}
   const canopyW=s.type==='terminal'?s.w*.62:Math.min(s.w*.76,s.doorWidth+4),cy=s.type==='terminal'?4.0:industrial?(s.type==='hangar'?12.35:5.35):3.03;
   /* V4.6: six shops have their own fronts (city-storefronts.js); the rest keep the standard canopy, sign band and trim. */
   const Fronts=globalThis.CityStorefronts;if(Fronts?.has(s.id))Fronts.dress(scene,b,s,p,{box,part});else{
   box(p.accent,0,cy,s.d/2+.68,canopyW,.18,1.9,'arch30-metal');for(const side of[-1,1]){box(p.frame,side*(canopyW/2-.22),cy-.39,s.d/2+.44,.09,.7,.8,'arch30-metal');box(p.frame,side*(canopyW/2-.22),cy-.73,s.d/2+.65,.10,.08,1.25,'arch30-metal');}
   // A quiet mounting band makes the existing correct-name sign readable.
   if(!industrial&&s.type!=='terminal')box(p.stone,0,3.60,s.d/2+.26,Math.min(s.w-.65,19),1.32,.16,'arch30-stone');
   if(s.type==='terminal')box(p.stone,0,5.94,s.d/2+.26,Math.min(s.w-.65,19),1.16,.16,'arch30-stone');
   if(s.type==='clothing'){
    const z=s.d/2;
    if(s.id==='clothing-drip'){box(p.frame,0,3.03,z+.24,s.w-.5,.24,.40,'arch30-metal');for(const side of[-1,1])box(p.frame,side*(s.doorWidth/2+.25),1.42,z+.23,.24,2.84,.40,'arch30-metal');}
    else if(s.id==='clothing-luxury'){for(const side of[-1,1]){box(p.stone,side*(s.doorWidth/2+.38),1.50,z+.28,.60,3,.55,'arch30-stone');part('box',p.accent,side*s.w*.29,3.04,z+.65,s.w*.31,.10,1.42,.14,0,0,'arch30-timber');box(p.frame,side*s.w*.29,2.91,z+1.34,s.w*.31,.15,.07,'arch30-metal');}}
    else if(s.id==='clothing-oddball'){box(p.frame,0,3.04,z+.45,s.w-.55,.12,1.0,'arch30-timber');for(let x=-s.w/2+.8;x<s.w/2-.5;x+=1.0)part('box',p.accent,x,3.14,z+.45,.09,.10,1.10,0,0,0,'arch30-timber');}
    else {for(const side of[-1,1])box(p.accent,side*(s.w/2-.28),1.50,z+.12,.42,3.0,.30,'arch30-metal');box(p.frame,0,2.96,z+.40,canopyW+.8,.07,1.35,'arch30-metal');}
   }}
  }else{
   roof({key:'service',x:0,y:0,z:0,w:s.w,d:s.d,h:s.h});
   for(const side of[-1,1]){box(p.stone,side*(s.w/2-.16),s.h/2,s.d/2+.13,.30,s.h,.30,'arch30-stone');box(p.frame,side*(s.w/2-.18),s.h/2,-s.d/2-.05,.10,s.h,.1,'arch30-metal');}
   for(let x=-s.w/2+4;x<s.w/2-2;x+=6){box(p.frame,x,s.h-.4,0,.06,.09,s.d*.72,'arch30-metal');for(let z=-s.d*.28;z<s.d*.4;z+=s.d*.3)box('#e6d9ba',x,s.h-.48,z,1.15,.08,.22,'arch30-light');}
   details();
  }
 }
 function details(){
  const localF=(kind)=>s.furnishings?.find(f=>f.kind===kind);
  if(s.type==='clothing'){
   for(const kind of['hatdisplay','shoedisplay','clothesrack']){const f=localF(kind);if(!f)continue;const x=f.x-s.x,z=f.z-s.z;box(p.stone,x,f.h+.55,z+.035,f.w+.12,.60,.06,'arch30-stone');for(const side of[-1,1])box(p.frame,x+side*f.w*.44,f.h+.23,z,.035,.55,.035,'arch30-metal');}
   const checkout=localF('retailcounter');if(checkout){const x=checkout.x-s.x,z=checkout.z-s.z;box(p.frame,x+1,1.22,z,.45,.34,.08,'arch30-metal');box('#8daba5',x+1,1.24,z+.05,.36,.22,.015,'arch30-light');box(p.frame,x+.8,1.10,z,.12,.19,.13,'arch30-metal');}
   // Curtain panels stand inside the existing fitting-room partitions.
   const walls=s.furnishings.filter(f=>f.kind==='fittingwall');if(walls.length===2){const x=(walls[0].x+walls[1].x)/2-s.x,z=Math.max(walls[0].z,walls[1].z)-s.z+1.3;box(p.accent,x+.55,1.35,z,Math.abs(walls[1].x-walls[0].x)-1.35,2.2,.055,'arch30-timber');box(p.frame,x,2.53,z,Math.abs(walls[1].x-walls[0].x),.06,.06,'arch30-metal');}
   if(s.id==='clothing-oddball')for(let i=0;i<3;i++)box('#647e70',-10.9,2.8,-8+i*.9,.12,.3,.66,'arch30-metal');
   return;
  }
  if(s.type==='diner'&&globalThis.CityDining?.place(s.id)){/* V6.3: the diner's room is drawn by city-dining.js */}else if(s.type==='diner'){
   // Espresso work area, customer pastry case and back preparation counter.
   box(p.frame,9.2,1.38,-4,1.25,.55,.7,'arch30-metal');box('#bcc7b9',9.2,1.70,-4,1.35,.08,.75,'arch30-metal');for(const x of[8.9,9.5])part('cylinder','#c2b9a4',x,1.19,-3.54,.11,.17,.11);box('#594c3b',9.5,1.43,-2,.32,.65,.35,'arch30-metal');
   box(p.frame,9.2,1.32,3,1.8,.42,1.2,'arch30-metal');box('#b4ccc3',9.2,1.62,3,1.82,.08,1.22,'arch30-glass');for(let i=0;i<5;i++)part('sphere','#c39b61',8.65+i*.26,1.58,3,.19,.11,.25,0,0,0,'arch30-interior');
   for(const f of s.furnishings.filter(f=>f.kind==='diner-table')){const x=f.x-s.x,z=f.z-s.z;part('cylinder','#b8a985',x,.85,z,.3,.1,.3);part('cylinder','#e2dbc7',x+.55,.90,z,.12,.19,.12);part('cone',p.accent,x,3.25,z,.7,.4,.7,0,0,0,'arch30-metal');box(p.frame,x,4.17,z,.035,1.45,.035,'arch30-metal');}
   box(p.frame,9.5,3.20,-12.18,6,.12,.55,'arch30-metal');for(let i=0;i<7;i++)part('cylinder','#d5c8af',7.1+i*.8,3.395,-12.18,.16,.27,.16,0,0,0,'arch30-interior');
  }else if(s.type==='terminal'){
   for(let i=0;i<3;i++){const x=-14+i*4;box(p.frame,x,1.37,-7,.6,.48,.10,'arch30-metal');box('#8faeaa',x,1.39,-6.93,.51,.33,.025,'arch30-light');box(p.frame,x,1.12,-7,.12,.3,.18,'arch30-metal');}
   for(const x of[-s.w*.36,s.w*.36]){box(p.frame,x,s.h/2,-s.d*.3,.22,s.h,.22,'arch30-metal');box(p.frame,x,s.h/2,s.d*.29,.22,s.h,.22,'arch30-metal');}
   for(let z=-s.d/2+4;z<s.d/2;z+=6)box(p.frame,0,s.h-.45,z,s.w-.5,.28,.18,'arch30-metal');box(p.stone,0,2.8,-s.d/2+.5,9,1.2,.16,'arch30-stone');
  }else if(s.type==='hangar'||s.type==='warehouse'||s.type==='garage'){
   const n=Math.max(3,Math.floor(s.d/10));for(let i=0;i<n;i++){const z=-s.d/2+(i+.5)*s.d/n;for(const side of[-1,1])box(p.frame,side*(s.w/2-.6),s.h/2,z,.28,s.h,.30,'arch30-metal');box(p.frame,0,s.h-.7,z,s.w-.9,.32,.24,'arch30-metal');for(let k=0;k<6;k++){const x=-s.w/2+(k+.5)*s.w/6;part('box',p.frame,x,s.h-1.15,z,s.w/6+.2,.10,.12,0,0,k%2?.12:-.12,'arch30-metal');}}
   for(const side of[-1,1]){box(p.frame,side*(s.doorWidth/2+.45),Math.min(5,s.h/2),s.d/2+.38,.16,Math.min(10,s.h),.22,'arch30-metal');}box(p.frame,0,(s.type==='hangar'?12:5)+.45,s.d/2+.30,s.doorWidth+.9,.18,.32,'arch30-metal');
  }else if(s.type==='marina'){
   box(p.frame,0,1.48,-s.d*.2,.65,.48,.08,'arch30-metal');box('#8cafb1',0,1.5,-s.d*.2+.05,.56,.36,.02,'arch30-light');for(let i=0;i<4;i++)part('sphere','#bd9e65',-s.w*.40,1.7,-6+i*2.1,.16,.8,.8,Math.PI/2,0,0,'arch30-metal');
  }else if(s.type==='relay'){
   for(const side of[-1,1])for(let row=0;row<6;row++){box(p.frame,side*s.w*.35,.37+row*.32,-s.d*.18+3.05,2,.21,.04,'arch30-metal');for(let i=0;i<4;i++)box('#8da994',side*s.w*.35-.7+i*.4,.38+row*.32,-s.d*.18+3.09,.10,.05,.015,'arch30-light');}
  }else if(s.type==='safehouse'){
   for(const side of[-1,1]){box(p.accent,side*(s.doorWidth/2+.6),.4,s.d/2+.20,.65,.8,.65,'arch30-timber');box('#718366',side*(s.doorWidth/2+.6),.95,s.d/2+.20,.8,.5,.8,'arch30-interior');}
  }
 }
 if(s.interior){service();return true;}
 for(const v of a.volumes||[]){
  if(!detail){/* V7.6: 3 cm short of the wall faces, so its edge does not flicker through the foot of the wall */box(p.floor,v.x,v.y+.06,v.z,v.w-.06,.10,v.d-.06,'arch30-concrete');}
  roof(v);
 }
 for(const f of a.faces||[])structuralFace(f);
 // Non-volume architectural attachments remain exact so the visual structure
 // matches existing collision, navigation and aerial landing surfaces.
 if(!detail)for(const q of (a.parts||[]).filter(q=>!(a.volumes||[]).some(v=>q.key.startsWith(v.key)))){
  const col=q.role==='roof'?p.roof:q.role==='accent'?p.accent:q.role==='metal'?p.frame:p.stone;
  if(q.type==='gable')part('roof',col,q.x,q.y,q.z,q.w,q.h,q.d,0,0,0,'arch30-roof');else trimBox(col,q,q.role==='metal'?'arch30-metal':'arch30-stone');
 }
 if(detail)for(const q of (a.parts||[]).filter(q=>q.role==='metal'&&q.h>1.2&&q.y>s.h*.48)){
  // Roof cabins have ventilated service faces, cap flashing and a real-looking
  // maintenance door, all sitting on the existing collision-backed enclosure.
  const ventW=Math.min(q.w*.44,3.4),ventH=Math.min(q.h*.52,1.8),doorH=Math.min(2.2,q.h-.18);
  for(const side of[-1,1]){box(p.frame,q.x+q.w*.20,q.y+q.h*.56,q.z+side*(q.d/2+.025),ventW,ventH,.035,'arch30-metal');for(let i=0;i<5;i++)box(p.stone,q.x+q.w*.20,q.y+q.h*.56-ventH*.4+i*ventH*.2,q.z+side*(q.d/2+.045),ventW,.035,.045,'arch30-metal');}
  box(p.accent,q.x-q.w*.27,q.y+doorH/2+.06,q.z+q.d/2+.045,Math.min(1.0,q.w*.24),doorH,.04,'arch30-metal');box(p.stone,q.x-q.w*.27+.29,q.y+1.05,q.z+q.d/2+.08,.045,.22,.05,'arch30-metal');
  for(const side of[-1,1])box(p.stone,q.x,q.y+q.h+.04,q.z+side*(q.d/2+.03),q.w+.12,.08,.12,'arch30-metal');
 }
 return true;
}
function buildShelter(scene,b){
 const box=(c,x,y,z,w,h,d,k='arch30-metal')=>scene.box(b,c,x,y,z,w,h,d,0,k);
 box('#7b928b',1340,5.50,-113,26,.22,14,'arch30-roof');
 for(const x of[1328,1352])for(const z of[-119,-107]){box('#657a73',x,3.9,z,.22,3.1,.22);box('#9ba799',x,2.43,z,.42,.12,.42);}
 for(const z of[-119,-107]){box('#526a65',1340,5.26,z,24.3,.26,.18);box('#b6c2ad',1340,5.57,z+Math.sign(z+113)*.85,26.12,.20,.14);}
 for(let x=1328;x<=1352;x+=4){box('#607b73',x,5.25,-113,.13,.23,12.3);box('#a0b1a3',x,5.64,-113,.08,.05,13.95);}
 for(const x of[1327.1,1352.9])box('#b6c2ad',x,5.57,-113,.14,.20,14.05);
 for(const x of[1333,1347]){box('#475f57',x,5.10,-113,1.5,.08,.32);box('#e5dbbc',x,5.05,-113,1.35,.025,.23,'arch30-light');}
 for(const x of[1328,1352]){box('#60796d',x,3.90,-119.22,.09,3.1,.09);box('#60796d',x,5.49,-113,.09,.08,12.4);}
}
function buildDoor(scene,s,d){
 const T=scene.T,p=design(s),g=new T.Group(),b=scene.batch(),industrial=['garage','warehouse','hangar'].includes(s.type),box=(c,x,y,z,w,h,depth,kind='arch30-metal')=>scene.box(b,c,x,y,z,w,h,depth,0,kind);
 g.name='architecture-door:'+s.id;g.userData.architectureDoor={kind:industrial?'shutter':'hinged',baseY:d.y,height:d.h,open:1};
 if(industrial){g.position.set(d.x,d.y+d.h*.98,d.z+.12);g.scale.y=.02;const bays=Math.max(1,Math.ceil(d.w/4));for(let i=0;i<bays;i++){const x=-d.w/2+(i+.5)*d.w/bays;box(p.accent,x,d.h/2+.05,0,d.w/bays-.035,d.h-.1,.12,'arch30-panel');box(p.frame,x-d.w/bays/2+.04,d.h/2+.04,.08,.06,d.h-.12,.08);}for(let y=.45;y<d.h;y+=.45)box(p.frame,0,y,.075,d.w-.08,.045,.045);/* V8.9: the rail is as deep as the door, so panel and post ends sit inside it */box(p.frame,0,.08,.04,d.w,.16,.24);
 }else{g.position.set(d.x-d.w/2,d.y,d.z+.12);g.rotation.y=-Math.PI/2;for(const x of[.055,d.w-.055])box(p.frame,x,d.h/2,0,.11,d.h,.13);for(const y of[.06,d.h-.06])box(p.frame,d.w/2,y,0,d.w,.12,.13);box(p.frame,d.w/2,.26,0,d.w-.14,.34,.09);scene.part(b,'panel','#bbd1c8',d.w/2,d.h/2+.14,.01,d.w-.18,d.h-.54,1,0,0,0,'arch30-glass');for(const z of[-.13,.13])box(p.stone,d.w-.27,1.08,z,.055,.42,.06);}
 scene.bake(b,g);return g;
}
function updateDoor(mesh,d,dt){const info=mesh.userData.architectureDoor;if(!info||info.kind!=='shutter')return false;info.open+=((d.open?1:0)-info.open)*(1-Math.exp(-dt*9));mesh.scale.y=1-info.open*.98;mesh.position.y=info.baseY+info.height*info.open*.98;return true;}
function manifest(s){const p=design(s);return {id:s.id,version:VERSION,protected:excluded(s),family:p.family,variant:p.variant,layout:p.layout||null,interior:s.interior?'accessible':'bounded-window-rooms',facades:4,roof:'finished',geometryFactory:'CityArchitectureModels.build',materialNamespace:'arch30-',parts:(s.architecture?.parts||[]).length,volumes:(s.architecture?.volumes||[]).length};}
return {VERSION,protectedIds:[...protectedIds],excluded,design,manifest,geometry,makeMaterial,build,buildShelter,buildDoor,updateDoor};
});

