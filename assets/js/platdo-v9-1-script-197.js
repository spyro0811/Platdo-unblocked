/* Architectural scene for the reference-layout chase. No gameplay state lives here. */
(function(root){
'use strict';
function build(scene,T=root.THREE){
 const map=root.PlatdoChaseMap,world=new T.Group();world.name='Reference chase town';scene.add(world);
 const visibility=root.PlatdoVisibility?new root.PlatdoVisibility.Controller(T,{id:'chase',maxOccluders:8192,maxProjectedOccluders:24}):null;
 // Whole-face occlusion is available for development comparisons, but the
 // measured Chase views saved at most one small group and cost more CPU than
 // rendering it. Keep coarse native/group frusta active without that overhead.
 visibility?.setStages({occlusion:false});
 const interiorGroups=[],materials=new Map(),geometries=new Map(),textures=new Map(),carDisplays=[],metadata={buildings:[],rooms:0,instances:0,drawBatches:0};
 const geometry=type=>{if(!geometries.has(type))geometries.set(type,type==='sphere'?new T.SphereGeometry(1,10,7):type==='cylinder'?new T.CylinderGeometry(1,1,1,12):type==='cone'?new T.ConeGeometry(1,1,9):type==='torus'?new T.TorusGeometry(.7,.3,7,16):new T.BoxGeometry());return geometries.get(type);};
 function material(color,kind='solid'){
  const key=color+kind;if(materials.has(key))return materials.get(key);
  const m=kind==='glass'?new T.MeshStandardMaterial({color,transparent:true,opacity:.13,roughness:.18,metalness:.1,depthWrite:false,side:T.DoubleSide}):new T.MeshStandardMaterial({color,roughness:kind==='metal'?.42:.86,metalness:kind==='metal'?.42:0,emissive:kind==='lit'?color:'#000000',emissiveIntensity:kind==='lit'?.24:0});if(kind==='decal'){m.polygonOffset=true;m.polygonOffsetFactor=-4;m.polygonOffsetUnits=-4;m.depthWrite=false;}materials.set(key,m);return m;
 }
 function builder(parent){
  const bins=new Map(),d=new T.Object3D();
  function put(type,x,y,z,w,h,l,color,ry=0,kind='solid',rz=0){const key=type+'|'+color+'|'+kind;if(!bins.has(key))bins.set(key,[]);bins.get(key).push([x,y,z,w,h,l,ry,rz]);}
  const box=(x,y,z,w,h,l,color,ry=0,kind='solid')=>put('box',x,y,z,w,h,l,color,ry,kind);
  function flush(){for(const [key,list] of bins){const [shape,color,kind]=key.split('|'),mesh=new T.InstancedMesh(geometry(shape),material(color,kind),list.length);list.forEach(([x,y,z,w,h,l,ry,rz],i)=>{d.position.set(x,y,z);d.rotation.set(0,ry,rz);d.scale.set(w,h,l);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);});mesh.castShadow=kind!=='glass';mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.name='Batched '+shape+' '+kind;parent.add(mesh);if(parent.userData.chaseBuildingId&&kind!=='glass')visibility?.addBoxOccluders(mesh);metadata.instances+=list.length;metadata.drawBatches++;}bins.clear();}
  return {put,box,flush};
 }
 function textTexture(text,bg,fg){const key=text+bg+fg;if(textures.has(key))return textures.get(key);const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,1024,192);c.strokeStyle=fg;c.lineWidth=4;c.strokeRect(12,12,1000,168);c.font='900 104px Arial';c.textBaseline='middle';c.textAlign='center';c.fillStyle=fg;c.fillText(text,512,98,968);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;textures.set(key,texture);return texture;}
 function sign(group,text,x,y,z,w,h,yaw,bg,fg='#f7f0d8'){const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:textTexture(text,bg,fg),side:T.DoubleSide}));mesh.position.set(x,y,z);mesh.rotation.y=yaw;mesh.name=text+' signage';group.add(mesh);}
 const palette={bakery:['#a76a54','#ede0c3','#763b45'],convenience:['#dfded2','#236e46','#df782e'],smoke:['#3d3b39','#a17b51','#25282a'],supermarket:['#d2d2c9','#274f43','#466451'],mall:['#d7cdb8','#5d6664','#507c76'],apartment:['#9d5749','#decbb4','#484b50'],'apartment-a':['#decdb4','#ad6c4d','#67584e'],'apartment-b':['#985e4a','#9c9e9b','#454950'],'apartment-c':['#d9d5c5','#657d8b','#52616a'],'apartment-d':['#c7c0a6','#6b765b','#6b5848'],'market-a':['#e4dac2','#27583e','#326144'],'market-b':['#b2987a','#5a2932','#882b3a'],pizza:['#a65e49','#f0d9b5','#a13d3b'],police:['#a86b5a','#d3d8d2','#304e73'],donut:['#e9d8bd','#b67674','#e29b9f'],surf:['#e3dfce','#538989','#668f94'],skate:['#4e5151','#b2b795','#8a79a6'],games:['#45494c','#d5d5cc','#b8423c'],toy:['#ded8c7','#eab65b','#687e9f'],restaurant:['#9f6e54','#d5c6ac','#385b45'],dealership:['#e1e3e1','#747f86','#3b464f'],bank:['#cfc8ae','#a9a28e','#424a4b'],cafe:['#a8b8a2','#84694b','#627f68']};
 // Only external edges of the union of rectangles receive walls. This preserves
 // both L silhouettes and avoids a false wall across the mall/station elbow.
 function edges(b){const result=[];b.parts.forEach((p,index)=>{
  for(const side of ['north','south','west','east']){
   const horizontal=side==='north'||side==='south',fixed=horizontal?p.z+(side==='north'?-1:1)*p.l/2:p.x+(side==='west'?-1:1)*p.w/2;
   let spans=[[horizontal?p.x-p.w/2:p.z-p.l/2,horizontal?p.x+p.w/2:p.z+p.l/2]];
   for(const [j,q] of b.parts.entries()){if(j===index)continue;const probe=fixed+(side==='north'||side==='west'?-.01:.01),inside=horizontal?probe>q.z-q.l/2&&probe<q.z+q.l/2:probe>q.x-q.w/2&&probe<q.x+q.w/2;if(!inside)continue;const lo=horizontal?q.x-q.w/2:q.z-q.l/2,hi=horizontal?q.x+q.w/2:q.z+q.l/2;spans=spans.flatMap(([a,c])=>hi<=a||lo>=c?[[a,c]]:[[a,Math.max(a,lo)],[Math.min(c,hi),c]].filter(v=>v[1]-v[0]>.05));}
   for(const [a,c]of spans){const yaw={south:0,north:Math.PI,east:Math.PI/2,west:-Math.PI/2}[side];result.push({side,yaw,x:horizontal?(a+c)/2:fixed,z:horizontal?fixed:(a+c)/2,width:c-a,part:index,height:p.height||b.height});}
  }
 });return result;}
 const ground=builder(world);ground.box(0,-.4,0,2700,.4,1700,'#658564');
 for(const r of map.roads){const dx=r.bx-r.ax,dz=r.bz-r.az,len=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);ground.box((r.ax+r.bx)/2,-.004,(r.az+r.bz)/2,r.width,.05,len,'#434a50',yaw);
  for(let s=8;s<len;s+=12){const x=r.ax+dx*s/len,z=r.az+dz*s/len;ground.box(x,.04,z,.16,.01,5,'#dcc68b',yaw,'decal');}
 }
 // Street surface around parcels remains connected to the road network; there
 // are no invisible collision rails across junctions or the open parking lot.
 ground.box((map.inner.left+map.inner.right)/2,-.08,(map.inner.top+map.inner.bottom)/2,map.inner.right-map.inner.left,.06,map.inner.bottom-map.inner.top,'#51575b');
 // Reapply explicit roads over the district apron for consistent road markings.
 for(const r of map.roads){if(Math.abs(r.ax)>650||Math.abs(r.bx)>650||Math.abs(r.az)>400||Math.abs(r.bz)>400)continue;const dx=r.bx-r.ax,dz=r.bz-r.az,len=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);ground.box((r.ax+r.bx)/2,.008,(r.az+r.bz)/2,r.width,.014,len,'#42494e',yaw);}
 const park=map.park;ground.box(park.x,.02,park.z,park.w,.07,park.l,'#72906b');ground.box(park.x,.065,park.z,4,.018,park.l,'#b9b2a0');ground.box(park.x,.065,park.z,park.w,.018,4,'#b9b2a0');
 for(let i=0;i<14;i++){const theta=i*2.39996,rad=Math.min(park.w,park.l)*(.25+.17*(i%3)/2),x=park.x+Math.cos(theta)*rad,z=park.z+Math.sin(theta)*rad;if(Math.abs(x-park.x)<6||Math.abs(z-park.z)<6)continue;ground.put('cylinder',x,2,z,.25,4,.25,'#655346');ground.put('sphere',x,5.1,z,3.1,3.4,2.9,'#426a4d');}
 const lot=map.parking;ground.box(lot.x,.02,lot.z,lot.w,.05,lot.l,'#5b5e5f');for(let i=0;i<8;i++){const x=lot.x-lot.w*.34+i*4;ground.box(x,.065,lot.z-lot.l*.32,.1,.014,5.5,'#dfddcb',0,'decal');} // only a few parked cars below
 for(const b of map.buildings)for(const p of b.parts)ground.box(p.x,-.001,p.z,p.w+2.2,.06,p.l+2.2,'#a9a69b');ground.flush();
 function architecturalBuilding(b){
  const group=new T.Group();group.name=b.id;group.userData.chaseBuildingId=b.id;world.add(group);const batch=builder(group),[wall,trim,accent]=palette[b.type]||palette.mall;
  const apartment=b.type.startsWith('apartment'),floors=apartment?Math.max(3,Math.round((b.height-.6)/3.2)):b.type==='police'?3:b.type==='bakery'||b.type==='cafe'||b.type==='toy'?2:1;
  const floorH=apartment?3.2:b.type==='police'?3.45:floors===2?b.height/2:b.height;
  const detailBuilders=new Map();
  const detail={id:b.id,name:b.name,type:b.type,parts:b.parts.map(p=>({x:p.x,z:p.z,w:p.w,l:p.l})),rooms:[],entrances:[],floors};metadata.buildings.push(detail);
  for(const p of b.parts){const roofHeight=p.height||b.height;batch.box(p.x,.08,p.z,p.w,.16,p.l,trim);batch.box(p.x,roofHeight+.15,p.z,p.w+.55,.3,p.l+.55,'#7c827e');batch.box(p.x,roofHeight+.43,p.z,p.w+.8,.18,p.l+.8,trim);
   const rooftop=Math.min(3,p.w/10);for(let n=0;n<rooftop;n++){batch.box(p.x+(n-1)*5,roofHeight+1,p.z+8,3.2,1.4,4.4,'#8b9796');for(let j=0;j<5;j++)batch.box(p.x+(n-1)*5,roofHeight+1.1,p.z+6+j*.25,2.9,.09,.06,'#5c6767');}batch.box(p.x-p.w*.28,roofHeight+1.1,p.z-p.l*.25,4,2.1,4,'#858c86');
  }
  function room(e,center,width,floor,index,type=b.type){
   const detailKey=e.side+':'+e.part;let cache=detailBuilders.get(detailKey);if(!cache){const furniture=new T.Group();furniture.name=b.id+' furniture '+detailKey;group.add(furniture);cache={group:furniture,builder:builder(furniture),x:e.x,z:e.z,yaw:e.yaw,width:e.width};detailBuilders.set(detailKey,cache);}const furniture=cache.group,details=cache.builder;let detailMode=false;
   const y=floor*floorH+.17,h=floorH-.25,depth=type==='bank'||type==='dealership'?10:6;
   const co=Math.cos(e.yaw),si=Math.sin(e.yaw),at=(u,v)=>({x:e.x+co*u+si*v,z:e.z-si*u+co*v});
   function box(u,yy,v,w,hh,l,color,kind='solid'){const p=at(center+u,v);(detailMode?details:batch).box(p.x,y+yy,p.z,w,hh,l,color,e.yaw,kind);}
   function shape(shape,u,yy,v,w,hh,l,color,ry=0){const p=at(center+u,v);(detailMode?details:batch).put(shape,p.x,y+yy,p.z,w,hh,l,color,e.yaw+ry);}
   const p=at(center,-depth/2);detail.rooms.push({x:p.x,y,z:p.z,width,depth,type,floor});metadata.rooms++;
   box(0,.03,-depth/2,width,.06,depth,apartment?'#a58a67':'#c8c4b5');box(0,h-.05,-depth/2,width,.1,depth,'#ded8c5','lit');box(0,h/2,-depth,width,h,.15,'#c9c4b5','lit');
   for(const u of [-width/2,width/2])box(u,h/2,-depth/2,.14,h,depth,'#c7bba5');
   box(0,h/2,-.07,width-.35,h-.55,.04,'#b4d0cf','glass');
   box(0,.38,-.04,width,.25,.27,trim);box(0,h-.18,-.04,width,.2,.3,trim);
   for(const u of [-width/2,0,width/2])box(u,h/2,0,.14,h,.21,trim,'metal');
   box(0,h-.24,-depth*.38,width*.55,.06,.3,'#eee4bc','lit');
   detailMode=true;
   function chair(u,v){box(u,.46,v,.5,.12,.55,'#755e4a');box(u,.83,v-.23,.5,.65,.1,'#755e4a');for(const dx of [-.2,.2])for(const dz of [-.21,.21])box(u+dx,.22,v+dz,.055,.44,.055,'#454d4f');}
   function table(u,v){box(u,.76,v,1.5,.09,.85,'#a88b67');for(const dx of [-.61,.61])for(const dz of [-.31,.31])box(u+dx,.36,v+dz,.06,.72,.06,'#5f6057');chair(u,v+.8);chair(u,v-.8);shape('cylinder',u,.83,v,.14,.03,.14,'#eee6d4');}
   function shelf(u,v,w=1.5){for(const yy of [.18,.65,1.12,1.58]){box(u,yy,v,w,.07,.5,'#9b907b');for(let q=0;q<4;q++)box(u-w*.35+q*w*.23,yy+.2,v,.16,.32,.28,['#a84e41','#bd9d4b','#64867a','#c5bba4'][(q+index)%4]);}for(const dx of [-w/2,w/2])box(u+dx,.88,v,.05,1.76,.5,'#6f7268');}
   function counter(u,v,w=3){box(u,.55,v,w,1.1,.85,'#9b8061');box(u,1.13,v,w+.1,.08,.97,trim);box(u+w*.29,1.3,v,.4,.24,.32,'#414b4b');}
   function display(u,v,kind='pastry'){box(u,.48,v,2.9,.95,.85,'#a38e74');box(u,1.22,v,2.9,.48,.85,'#c2dddd','glass');for(const zz of [-.23,.23])for(let q=0;q<5;q++){const xx=u-1.1+q*.53;if(kind==='donut')shape('torus',xx,1.06,v+zz,.15,.15,.15,['#a5743e','#b87e7c','#dbbd83'][q%3]);else shape('sphere',xx,1.05,v+zz,.17,.09,.13,'#b98f4e');}}
   if(apartment){box(-width*.23,.47,-2.1,1.9,.38,.85,['#886b58','#718274','#526978','#a28a72'][index%4]);box(-width*.23,.84,-2.45,1.9,.63,.18,'#786f5e');box(-width*.23,.37,-1.1,1.1,.1,.55,'#987951');table(width*.25,-3.3);shelf(-width*.34,-5.4,1.2);box(width*.3,.5,-5.5,2,1,.6,'#b7b09c');box(width*.3,1.03,-5.5,2,.07,.7,'#e4ddc8');shape('cylinder',-width*.38,1.2,-1.7,.035,1.8,.035,'#6b6257');shape('cone',-width*.38,2.1,-1.7,.35,.4,.35,'#e8d8a7');for(const u of [-width*.44,width*.44])box(u,h*.52,-.28,.32,h*.7,.08,['#d8c8af','#aba38e','#c6bdb5'][index%3]);}
   else if(type==='bank'){counter(-width*.2,-5,3);counter(width*.24,-5,3);for(let q=0;q<3;q++){shape('cylinder',q*.85-1,.52,-2.5,.04,1,.04,'#9a947c');box(q*.85-.6,.91,-2.5,.8,.025,.03,'#725d4e');}box(0,2.1,-9.8,2.9,4.2,.18,'#666f6c');shape('torus',0,2.2,-9.65,1.3,1.3,.25,'#9ba29a');shape('cylinder',0,2.2,-9.6,.21,.12,.21,'#505a5a');chair(-width*.35,-2);chair(width*.35,-2);}
   else if(type==='police'){counter(0,-3,3);for(const u of [-2,2])chair(u,-1.9);box(0,2,-5.8,2,1.2,.04,'#607988');for(let q=0;q<3;q++)box(-.65+q*.65,2,-5.75,.45,.65,.02,'#ddd8b9');shelf(-width*.32,-5.4,1.2);}
   else if(type==='bakery'||type==='donut'){display(-1,-1.8,type==='donut'?'donut':'pastry');counter(1,-4,2.2);shelf(-width*.3,-5.2,2);table(width*.25,-2.5);box(1,1.5,-4,.45,.65,.42,'#555e5a');}
   else if(type==='cafe'||type==='restaurant'||type==='pizza'){counter(-width*.26,-4.6,3);table(width*.25,-2);table(-width*.24,-2);if(type==='pizza'){box(width*.26,1.2,-5,1.8,2,1.3,'#b7a58a');box(width*.26,1.22,-4.3,1.35,.6,.05,'#483b31');box(width*.26,2.7,-5,2,.4,1.5,'#9a9b90');shape('cylinder',-width*.26,1.26,-4.6,.35,.035,.35,'#c29b54');}else{box(-width*.26,1.5,-4.6,.8,.6,.46,'#a2acaa');box(-width*.26,1.5,-4.31,.63,.22,.03,'#384b50');for(let q=0;q<3;q++)shape('cylinder',-.7+q*.21,1.25,-4.3,.07,.13,.07,'#e6ded0');}}
   else if(type==='surf'||type==='skate'){counter(width*.25,-4.4,2);for(let q=0;q<5;q++){const u=-width*.34+q*.8;shape('sphere',u,type==='surf'?1.6:1.05,-1.3,type==='surf'?.26:.11,type==='surf'?1.4:.49,.055,['#a6c7bd','#dbb26d','#718b9b','#c68979','#dfd8ba'][q]);box(u,.23,-1.3,.1,.4,.45,'#6c695a');}shelf(-width*.25,-5.3,2);}
   else if(type==='games'){counter(width*.27,-4.4,2);shelf(-width*.3,-3.5,1.8);shelf(0,-5.3,2);box(1.3,1.4,-1.7,1.2,.8,.1,'#314851','lit');box(1.3,.71,-1.7,1.1,.65,.6,'#525855');box(-1.3,1,-1.5,.9,.2,.5,'#c4c7c0');}
   else if(type==='toy'){counter(0,-5,2);shelf(width*.3,-3.4,1.7);shape('sphere',-1.6,.8,-1.5,.43,.55,.35,'#b99461');shape('sphere',-1.6,1.4,-1.5,.36,.34,.3,'#b99461');for(const dx of [-.3,.3])shape('sphere',-1.6+dx,1.68,-1.5,.12,.12,.1,'#b99461');box(1.3,.75,-1.7,.55,.8,.35,'#75949d');box(1.3,1.35,-1.7,.5,.4,.4,'#c49a51');for(const dx of [-.45,.45])box(1.3+dx,.8,-1.7,.22,.6,.25,'#75949d');}
   else if(type==='dealership'){counter(width*.28,-7,2);table(-width*.28,-7);if(index%11===5&&index<30&&root.DriveScene){const p=at(center,-4.8),car=root.DriveScene.createCar(['apex','vektor','compact'][index%3],['#cfcbbd','#a85845','#486b7e'][index%3],false,null,2);car.position.set(p.x,.17,p.z);car.rotation.y=e.yaw+.55;car.name='Showroom display car';furniture.add(car);carDisplays.push(car);}}
   else if(type==='smoke'){counter(0,-4.5,3);display(-1,-1.7,'accessories');shelf(width*.3,-3.5,1.7);box(0,2,-5.8,3,1,.15,'#8c8268');}
   else {counter(width*.27,-2.8,2);shelf(-width*.25,-2,1.6);shelf(-width*.25,-4.5,1.6);shelf(width*.27,-5.2,2);box(0,.7,-5.6,1.6,1.4,.6,'#b3beba');box(0,.8,-5.22,1.4,1.15,.04,'#b4d0cf','glass');for(let q=0;q<3;q++)box(-1+q*.55,.32,-1.15,.5,.6,.6,'#8b7952');}
   
  }
  const external=edges(b);for(const e of external){const co=Math.cos(e.yaw),si=Math.sin(e.yaw),front=e.side===b.front;
   const put=(u,y,v,w,h,l,c,kind='solid')=>batch.box(e.x+co*u+si*v,y,e.z-si*u+co*v,w,h,l,c,e.yaw,kind);
   const publicFace=front||(b.type==='bank'&&e.side==='west')||apartment||b.type==='mall';
   if(publicFace){const n=Math.max(1,Math.floor(e.width/9)),bay=e.width/n;for(let f=0;f<(e.height<b.height?1:floors);f++){for(let i=0;i<n;i++){const u=-e.width/2+bay*(i+.5);room(e,u,bay-.18,f,i,b.type==='mall'?'market-b':b.type);}put(0,f*floorH+.14,-.05,e.width,.28,.32,trim);put(0,(f+1)*floorH-.25,-.04,e.width,.5,.38,wall);}for(let i=0;i<=n;i++)put(-e.width/2+i*bay,e.height/2,0,.3,e.height,.55,wall);
   }else{put(0,e.height/2,-.09,e.width,e.height,.25,wall);for(let i=-e.width/2+2;i<e.width/2;i+=5)put(i,e.height*.53,.06,.08,e.height*.9,.06,trim);put(0,1.15,.065,1.4,2.3,.09,'#6b7774');put(.4,1.05,.13,.08,.25,.08,'#b5b5a8','metal');}
   put(0,e.height+.45,.05,e.width+.35,.18,.55,trim);put(0,.22,.05,e.width,.4,.4,trim);
   for(const u of [-e.width/2+.35,e.width/2-.35])put(u,e.height/2,.2,.11,e.height,.11,'#6d7772','metal');
   if(front){let center=0;if(b.id==='bank')center=(map.anchors.bank.door.x-e.x)/co;if(b.id==='donut')center=(map.anchors.donut.door.x-e.x)/co;const pos={x:e.x+co*center,z:e.z-si*center};detail.entrances.push({...pos,yaw:e.yaw});
    // Human-sized doors fit the facade rhythm even on the large mapped parcels.
    put(center,1.3,.1,2.7,2.6,.04,'#a8cacb','glass');for(const du of [-1.4,0,1.4])put(center+du,1.35,.18,.09,2.7,.12,'#4d5a59','metal');put(center,2.72,.14,2.9,.12,.2,trim);for(const du of [-.18,.18])put(center+du,1.15,.28,.04,.48,.06,'#c5c3b7','metal');
    const signW=Math.min(22,e.width*.62),signY=b.type==='bank'?7.8:b.type==='dealership'?6.2:Math.min(b.height-.55,4.35);sign(group,b.name,pos.x+si*.37,signY,pos.z+co*.37,signW,Math.min(1.5,signW*.11),e.yaw,accent);
    put(center,3.1,1.2,Math.min(22,e.width*.65),.19,2.4,accent);for(const du of [-Math.min(10,e.width*.28),Math.min(10,e.width*.28)])put(center+du,1.5,2.1,.16,3,.16,trim);
    if(b.type==='bank'){for(const du of [-8,-4,4,8]){put(center+du,3.35,.85,.65,6.7,.65,trim);put(center+du,6.7,.85,.95,.24,.95,trim);}put(center,7,.7,20,.35,2.1,trim);}
    if(b.type==='donut'){const p={x:pos.x+co*6,z:pos.z-si*6};batch.put('torus',p.x,7,p.z,1.1,1.1,.45,'#bd8b55',e.yaw);batch.put('torus',p.x+si*.14,7,p.z+co*.14,.94,.94,.45,'#d99b9b',e.yaw);batch.box(p.x,5.8,p.z,.18,2.4,.18,'#635d53');}
    if(b.type==='surf'||b.type==='apartment-c'){const roof=new T.Mesh(new T.CylinderGeometry(1,1,1,3),material('#677a7e','metal'));roof.rotation.z=Math.PI/2;roof.scale.set(2.6,e.width/2,5);roof.position.set(e.x,b.height+1.5,e.z-3);group.add(roof);}
   }
  }
  if(b.type==='police'){const p=b.parts[0];batch.box(p.x,b.height+.65,p.z,22,.3,22,'#606b6d');batch.box(p.x,b.height+.82,p.z,1,.015,9,'#d1cba9');for(const u of [-3,3])batch.box(p.x+u,b.height+.82,p.z,1,.015,9,'#d1cba9');batch.box(p.x,b.height+.83,p.z,6,.015,1,'#d1cba9');sign(group,'POLICE',p.x,p.height||8,p.z+p.l/2+.4,18,1.5,0,'#304e73');}
  if(b.type==='mall'){const t=map.tenants[0];sign(group,'MINI MARKET',t.x,4.1,t.z+.4,18,1.4,0,'#882b3a');detail.tenantIds=[t.id];}
  for(const d of detailBuilders.values()){d.builder.flush();interiorGroups.push(d);}batch.flush();visibility?.register(group);for(const d of detailBuilders.values())visibility?.register(d.group);return group;
 }
 for(const b of map.buildings)architecturalBuilding(b);
 if(root.DriveScene)for(let i=0;i<3;i++){const car=root.DriveScene.createCar(['compact','vektor','apex'][i],['#a5b6b1','#8a5250','#d1c4a4'][i],false,null,2);car.position.set(lot.x-lot.w*.34+4*i+2,.05,lot.z-lot.l*.32);car.name='Parking display '+i;world.add(car);carDisplays.push(car);}
 world.userData.chaseMap=metadata;
 return {root:world,metadata,visibility,render(renderer,camera,options={}){return visibility?visibility.render(renderer,scene,camera,options):renderer.render(scene,camera);},update(camera){for(const car of carDisplays){const distance=car.position.distanceToSquared(camera.position);if(car.userData.interior?.root)car.userData.interior.root.visible=distance<20*20;}for(const d of interiorGroups){const dx=camera.position.x-d.x,dz=camera.position.z-d.z,along=dx*Math.cos(d.yaw)-dz*Math.sin(d.yaw),out=dx*Math.sin(d.yaw)+dz*Math.cos(d.yaw),end=Math.max(0,Math.abs(along)-d.width/2);d.group.visible=end*end+out*out+camera.position.y*camera.position.y<180*180&&out>-8;}},dispose(){visibility?.dispose();for(const car of carDisplays)root.DriveScene?.disposeCar(car);world.removeFromParent();for(const g of geometries.values())g.dispose();for(const m of materials.values())m.dispose();for(const t of textures.values())t.dispose();world.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&!carDisplays.some(c=>c===o)){o.geometry?.dispose();if(o.material&&!Array.isArray(o.material))o.material.dispose?.();}});}};
}
root.PlatdoChaseMapScene={build};
})(globalThis);
