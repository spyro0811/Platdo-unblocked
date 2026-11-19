
/* PLATDO DRIVE â€” procedural scene. No network resources or independent frame loop.
 * new DriveScene(canvas, route); setCar(config, CSS color); setSettings(settings);
 * resize(pixelWidth,pixelHeight); render(sim,'chase'|'hood'|'cockpit',dt,view).
 * Vehicle coordinates use +Z forward, +Y up, +X driver-left (view-right is -X). All distances are metres. */
(function () {
  'use strict';
  const T = window.THREE;
  const VehicleModels=window.DriveVehicleModels,modelGeometry=window.DriveModelGeometry,modelSteps=(n,min=3)=>modelGeometry?.steps(n,min)||n;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const mix = (a,b,t) => a+(b-a)*t;
  const smooth = (a,b,x) => { const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
  let seed=941;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const mat=(color,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:metalness>.65?.55:metalness>.15?.28:.075});
  const vertexMesh=(positions,indices,material,colors,uvs)=>{
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);
    if(colors)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));if(uvs)g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.computeVertexNormals();
    const m=new T.Mesh(g,material);m.receiveShadow=true;return m;
  };
  const quad=(a,b,c,d,material)=>vertexMesh([...a,...b,...c,...d],[0,1,2,0,2,3],material);
  function canvasTexture(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
  function addBox(parent,w,h,d,x,y,z,material,shadow=true){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
  function roundedBoxGeometry(w,h,d,r=.035){const g=new T.BoxGeometry(w,h,d,modelSteps(5,2),modelSteps(4,2),modelSteps(5,2)),p=g.attributes.position,n=g.attributes.normal,half=new T.Vector3(w*.5,h*.5,d*.5),v=new T.Vector3(),q=new T.Vector3();r=Math.min(r,w*.22,h*.22,d*.22);for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);q.set(clamp(v.x,-half.x+r,half.x-r),clamp(v.y,-half.y+r,half.y-r),clamp(v.z,-half.z+r,half.z-r));v.sub(q).normalize();n.setXYZ(i,v.x,v.y,v.z);q.addScaledVector(v,r);p.setXYZ(i,q.x,q.y,q.z);}return g;}
  function addSoftBox(parent,w,h,d,x,y,z,material,r=.035){const mesh=new T.Mesh(roundedBoxGeometry(w,h,d,r),material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function curvedPanel(a,b,c,d,material,bulge=.025){const positions=[],indices=[],uv=[],rows=modelSteps(7,2),cols=modelSteps(12,3);for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const u=i/cols,v=j/rows;uv.push(u,v);positions.push(mix(mix(a[0],b[0],u),mix(d[0],c[0],u),v),mix(mix(a[1],b[1],u),mix(d[1],c[1],u),v)+Math.sin(u*Math.PI)*Math.sin(v*Math.PI)*bulge,mix(mix(a[2],b[2],u),mix(d[2],c[2],u),v));if(i<cols&&j<rows){const k=j*(cols+1)+i;indices.push(k,k+1,k+cols+2,k,k+cols+2,k+cols+1);}}const m=vertexMesh(positions,indices,material,null,uv);m.castShadow=true;return m;}
  function sculptedBody(length,width,belt,bottom,wheelRadius,axles,kind,cabinSpan=null,detail=true){
    const pos=[],ix=[],steps=modelSteps(detail?60:32,16),profile=[[-.72,0],[-.92,.025],[-.995,.13],[-1,.55],[-.97,.84],[-.89,.96],[-.64,1.035],[-.31,1.06],[0,1.07],[.31,1.06],[.64,1.035],[.89,.96],[.97,.84],[1,.55],[.995,.13],[.92,.025],[.72,0]],N=profile.length;
    for(let j=0;j<=steps;j++){const t=j/steps,z=mix(-length*.5,length*.49,t),front=smooth(.67,1,t),rear=1-smooth(0,.22,t),waist=kind==='apex'?1-.045*Math.exp(-Math.pow((t-.49)/.18,2)):1;const flare=Math.max(...axles.map(a=>Math.exp(-Math.pow((z-a)/.48,2))))*(kind==='apex'?.028:kind==='vektor'?.018:.008);const w=width*.5*(1-.11*front*front-.10*rear*rear)*(waist+flare),top=belt-(kind==='apex'?.18:.12)*front*front-.045*rear*rear;
      let arch=bottom;for(const axle of axles){const dz=z-axle,r=wheelRadius+.05;if(Math.abs(dz)<r)arch=Math.max(arch,wheelRadius+Math.sqrt(r*r-dz*dz));}
      for(const [x,y]of profile){let py=mix(bottom,top,y);if(Math.abs(x)>.9)py=Math.max(py,mix(bottom,arch,smooth(.88,.98,Math.abs(x))));pos.push(x*w,py,z-front**4*Math.abs(x)**2*(kind==='apex'?.20:.10)+rear**4*Math.abs(x)**2*.08);}
      if(j<steps)for(let k=0;k<N;k++){const nextZ=mix(-length*.5,length*.49,(j+.5)/steps);if(cabinSpan&&nextZ>cabinSpan[0]&&nextZ<cabinSpan[1]&&k>=5&&k<=10)continue;const a=j*N+k,b=j*N+(k+1)%N;ix.push(a,b+N,b,a,a+N,b+N);}
    }for(let k=1;k<N-1;k++){ix.push(0,k,k+1);const a=steps*N;ix.push(a,a+k+1,a+k);}const mesh=vertexMesh(pos,ix,null);mesh.geometry.userData.sculpted=true;return mesh.geometry;
  }
  function rod(parent,a,b,r,material,segments=7){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),m=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),modelSteps(segments,5)),material);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());m.castShadow=true;parent.add(m);return m;}
  const qualityRanks={potato:0,low:1,medium:2,high:3,epic:4,ultra:5,insane:6};
  // Merge small solid details by material, keeping improved geometry inexpensive to draw.
  function detailBatch(parent,geometries,material,tier=4){
    const positions=[],indices=[];for(const g of geometries){const start=positions.length/3;positions.push(...g.attributes.position.array);if(g.index)for(const i of g.index.array)indices.push(i+start);else for(let i=0;i<g.attributes.position.count;i++)indices.push(i+start);g.dispose();}
    const mesh=vertexMesh(positions,indices,material);mesh.castShadow=true;mesh.userData.qualityTier=tier;parent.add(mesh);return mesh;
  }
  function detailBox(w,h,d,x,y,z,rx=0,ry=0,rz=0){const g=new T.BoxGeometry(w,h,d);g.applyMatrix4(new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(1,1,1)));return g;}
  function modelQuality(root,rank){root.traverse(o=>{if(o.userData.qualityTier!==undefined)o.visible=rank>=o.userData.qualityTier;if(o.userData.qualityMaxTier!==undefined)o.visible=rank<=o.userData.qualityMaxTier;});}
  function setUnderbodyLights(car,setting){
    const d=car.userData;
    let glow=d.underbodyGlow;
    if(d.kind==='f1'||!setting||setting.mode==='off'){
      if(glow)glow.visible=false;
      return;
    }
    if(!glow){
      const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
      const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,8,64,64,64);
      gradient.addColorStop(0,'rgba(255,255,255,.65)');gradient.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
      const material=new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas),transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
      glow=new T.Mesh(new T.PlaneGeometry(d.width*1.18,d.length*.84),material);
      glow.name='Underbody lights';glow.rotation.x=-Math.PI/2;glow.position.y=.05;
      d.body.add(glow);d.underbodyGlow=glow;
    }
    glow.visible=true;glow.material.color.set(window.DriveCore.UNDERBODY_COLORS[setting.color]);
    glow.material.opacity=glow.userData.intensity=setting.intensity;
    glow.userData.breathing=setting.mode==='breathing';
  }
  function disposeModel(root){const geometries=new Set(),materials=new Set(),textures=new Set();for(const t of Object.values(root.userData.interior?.dialTextures||{}))textures.add(t);for(const s of root.userData.paintSurfaces?.values()||[])if(s.texture)textures.add(s.texture);root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material]))materials.add(m);});for(const m of materials){for(const key of['map','normalMap','roughnessMap'])if(m[key])textures.add(m[key]);m.dispose();}geometries.forEach(g=>g.dispose());textures.forEach(t=>{if(!t.isRenderTargetTexture)t.dispose();});}

  // Dents are a bounded displacement field on the original car, not a soft-body solver.
  // All panels and attached trim sample the same field so a bumper cannot float outside a dent.
  function subdivideSurface(geometry,levels){
    let p=Array.from(geometry.attributes.position.array),uv=geometry.attributes.uv?Array.from(geometry.attributes.uv.array):null,ix=geometry.index?Array.from(geometry.index.array):Array.from({length:p.length/3},(_,i)=>i);
    for(let level=0;level<levels;level++){const midpoint=new Map(),next=[];const mid=(a,b)=>{const key=a<b?a+':'+b:b+':'+a;if(midpoint.has(key))return midpoint.get(key);const n=p.length/3;p.push((p[a*3]+p[b*3])*.5,(p[a*3+1]+p[b*3+1])*.5,(p[a*3+2]+p[b*3+2])*.5);if(uv)uv.push((uv[a*2]+uv[b*2])*.5,(uv[a*2+1]+uv[b*2+1])*.5);midpoint.set(key,n);return n;};
      for(let i=0;i<ix.length;i+=3){const a=ix[i],b=ix[i+1],c=ix[i+2],ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);next.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);}ix=next;
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));if(uv)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
  }
  function crackTexture(detail=true){return canvasTexture(detail?768:256,detail?384:128,(c,w,h)=>{
    // Fractures stay at the glass edges, preserving a clear centre of the windshield.
    if(!detail)c.scale(1/3,1/3);w=768;h=384;
    const noise=n=>{const v=Math.sin(n*127.1+91.7)*43758.5453;return v-Math.floor(v);};
    for(const [cx,cy,phase] of[[w*.16,h*.77,3],[w*.86,h*.22,17]]){const rings=[];for(let ray=0;ray<11;ray++){const a=ray*Math.PI*2/11+noise(ray+phase)*.18,len=35+noise(ray+phase+1)*110,points=[];c.beginPath();c.moveTo(cx,cy);
        for(let j=1;j<=5;j++){const r=len*j/5,twist=(noise(ray*8+j+phase)-.5)*.20,x=cx+Math.cos(a+twist)*r,y=cy+Math.sin(a+twist)*r*.70;points.push([x,y]);c.lineTo(x,y);}c.strokeStyle='rgba(223,235,230,.86)';c.lineWidth=1.25;c.stroke();rings.push(points);}
      for(let j=1;j<4;j++){c.beginPath();for(let k=0;k<rings.length;k++){const p=rings[k][j];k?c.lineTo(...p):c.moveTo(...p);}c.closePath();c.strokeStyle='rgba(174,206,211,.56)';c.lineWidth=.85;c.stroke();}
      c.fillStyle='rgba(216,229,228,.44)';c.beginPath();c.arc(cx,cy,3,0,Math.PI*2);c.fill();}
  });}
  function dentPoint(x,y,z,d,impacts,shape,out){
    const L=shape.length,W=shape.width,belt=shape.belt,sx=clamp(W/1.75,.85,1.35),sz=clamp(L/4.1,.9,1.6),sy=clamp(belt/.96,.8,1.35);
    const cabinSupport=1-smooth(belt+.08,shape.height,y),upper=smooth(belt-.31,belt-.03,y);
    const front=smooth(L*.14,L*.49,z),rear=smooth(L*.17,L*.5,-z),right=smooth(W*.15,W*.49,x),left=smooth(W*.15,W*.49,-x);
    let dx=(left*(d.left||0)-right*(d.right||0))*.20*(1-Math.pow(Math.min(1,Math.abs(z)/(L*.55)),4));
    let dz=rear*(d.rear||0)*.34-front*(d.front||0)*.43;
    const frontCorner=left*(d.frontLeft||0)+right*(d.frontRight||0),rearCorner=left*(d.rearLeft||0)+right*(d.rearRight||0);
    dz-=front*frontCorner*.21;dz+=rear*rearCorner*.17;
    dx+=(x>0?-1:1)*(front*frontCorner+rear*rearCorner)*.10;
    let dy=upper*((d.front||0)*(.25*Math.exp(-Math.pow((z-L*.30)/(L*.075),2))-.12*front*front)+(d.rear||0)*(.16*Math.exp(-Math.pow((z+L*.32)/(L*.07),2))-.07*rear));
    dy+=upper*.055*(front*frontCorner+rear*rearCorner)*Math.sin(x*6+z*9);
    let scar=0;
    for(const impact of impacts){const radius=clamp(impact.radius||.7,.35,1.25)*Math.sqrt(sx*sz),q=(x-impact.x)**2/(radius*radius)+(z-impact.z)**2/(radius*radius)+(y-Math.min(belt-.16,.66*sy))**2/(.55*sy)**2,weight=Math.exp(-q*1.6),strength=clamp(impact.strength||0,0,1),depth=.31*strength*weight;
      dx+=(impact.normalX||0)*depth;dz+=(impact.normalZ||0)*depth;
      // A raised shoulder around a compressed panel catches the light like folded sheet metal.
      dy+=upper*strength*.09*Math.exp(-Math.pow(Math.sqrt(q)-.8,2)*9)*Math.cos(x*4+z*6);
      // A narrow buckled crease follows the struck part of the bonnet or boot.
      const endImpact=Math.abs(impact.normalZ||0),end=impact.z>=0?1:-1,crease=Math.max(0,1-Math.abs(z-end*L*.30)/(L*.085)),local=Math.exp(-Math.pow((x-impact.x)/(radius*.85),2));
      dy+=upper*endImpact*strength*strength*crease*local*.12;
      scar=Math.max(scar,weight*strength);
    }
    out.set(x+clamp(dx*cabinSupport,-.48,.48)*sx,Math.max(.18,y+clamp(dy*cabinSupport,-.16,.34)*sy),z+clamp(dz*cabinSupport,-.68,.55)*sz);return scar;
  }
  function prepareCarDamage(root,shell,corners,lamps,shape,detail=true){
    const body=root.userData.body,records=[],crackMeshes=[],texture=crackTexture(detail);
    const originalShell=shell.geometry;if(!originalShell.userData.sculpted){shell.geometry=subdivideSurface(originalShell,modelGeometry.level<3?1:detail?3:2);originalShell.dispose();}
    body.traverse(mesh=>{if(!mesh.userData.damagePanel)return;const original=mesh.geometry;mesh.geometry=subdivideSurface(original,modelGeometry.level<3?1:2);original.dispose();});
    const addCrackedGlass=(a,b,c,d,zone)=>{const m=quad(a,b,c,d,new T.MeshBasicMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2}));m.geometry.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));body.add(m);crackMeshes.push({mesh:m,zone});};
    if(root.userData.kind!=='f1'){addCrackedGlass(corners.fl,corners.fr,corners.tr,corners.tl,'front');addCrackedGlass(corners.br,corners.bl,corners.ul,corners.ur,'rear');addCrackedGlass(corners.bl,corners.fl,corners.tl,corners.ul,'left');addCrackedGlass(corners.fr,corners.br,corners.ur,corners.tr,'right');}
    body.updateMatrixWorld(true);const bodyInverse=body.matrixWorld.clone().invert(),v=new T.Vector3();
    body.traverse(mesh=>{if(!mesh.geometry||!mesh.geometry.attributes.position)return;for(let parent=mesh;parent&&parent!==body;parent=parent.parent)if(parent.userData.noDent)return;const position=mesh.geometry.attributes.position;
      const transform=new T.Matrix4().multiplyMatrices(bodyInverse,mesh.matrixWorld),inverse=transform.clone().invert(),baseline=new Float32Array(position.count*3);
      for(let i=0;i<position.count;i++){v.fromBufferAttribute(position,i).applyMatrix4(transform);baseline.set([v.x,v.y,v.z],i*3);}
      records.push({mesh,baseline,inverse,isShell:mesh===shell,normal0:mesh.geometry.attributes.normal?mesh.geometry.attributes.normal.array.slice():null});
    });
    shell.material=shell.material.clone();shell.material.vertexColors=true;shell.material.needsUpdate=true;shell.geometry.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(shell.geometry.attributes.position.count*3).fill(1),3));
    const scars=new T.Mesh(new T.BufferGeometry(),new T.MeshStandardMaterial({vertexColors:true,roughness:.72,metalness:.16,envMapIntensity:.28,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3}));scars.visible=false;body.add(scars);
    root.userData.damageVisual={revision:-1,state:null,records,crackMeshes,scars,lamps,shape,maxDisplacement:0,damagedVertexCount:0,applications:0};
  }
  function rebuildScuffs(data,damage,impacts){
    const positions=[],colors=[],indices=[],shape=data.shape,temp=new T.Vector3();const noise=n=>{const a=Math.sin(n*78.233+31.41)*43758.5453;return a-Math.floor(a);};
    const knots=[-.5,-.455,-.32,.12,.39,.49],widths=[.76,.98,1,1,.96,.78],tops=[-.05,.025,.03,.02,-.07,-.15];
    const at=(z,values)=>{const t=z/shape.length;for(let j=0;j<knots.length-1;j++)if(t<=knots[j+1])return mix(values[j],values[j+1],clamp((t-knots[j])/(knots[j+1]-knots[j]),0,1));return values[values.length-1];};
    const surface=(zone,u,v)=>{let x,y,z;if(shape.surface){const s=shape.surface(zone,u,v);x=s[0];y=s[1];z=s[2];}else if(zone==='front'||zone==='rear'){x=clamp(u,-shape.width*.35,shape.width*.35);y=clamp(v,.40,shape.belt-.14);z=zone==='front'?shape.length*.49:-shape.length*.5;}
      else if(zone==='hood'){x=clamp(u,-shape.width*.34,shape.width*.34);z=clamp(v,shape.length*.205,shape.length*.45);y=shape.belt+at(z,tops);}
      else{z=clamp(u,-shape.length*.42,shape.length*.40);x=(zone==='right'?1:-1)*shape.width*.5*at(z,widths);y=clamp(v,.445,shape.belt-.17);}
      dentPoint(x,y,z,damage,impacts,shape,temp);if(zone==='front')temp.z+=.008;if(zone==='rear')temp.z-=.008;if(zone==='right')temp.x+=.008;if(zone==='left')temp.x-=.008;if(zone==='hood')temp.y+=.009;return [temp.x,temp.y,temp.z];};
    const stamp=(zone,cx,cy,strength,index)=>{for(let j=0;j<8+Math.floor(strength*28);j++){const r=index*101+j*17,center=cx+(noise(r)-.5)*(.28+strength*.65),height=cy+(noise(r+1)-.5)*.22,length=.035+noise(r+2)*(.11+strength*.2),thick=.002+noise(r+3)*.012,slope=(noise(r+4)-.5)*.13,base=positions.length/3;
        for(const [u,v]of[[center-length,height-thick],[center+length,height+slope-thick],[center+length,height+slope+thick],[center-length,height+thick]])positions.push(...surface(zone,u,v));
        const shade=j%4===0?.54:j%3===0?.17:.29;for(let k=0;k<4;k++)colors.push(shade,shade*.98,shade*.92);indices.push(base,base+1,base+2,base,base+2,base+3);}
    };
    impacts.forEach((hit,i)=>{if(hit.strength<.075)return;const end=Math.abs(hit.normalZ)>Math.abs(hit.normalX),zone=end?(hit.z>0?'front':'rear'):(hit.x>0?'right':'left');stamp(zone,end?hit.x:hit.z,Math.min(shape.belt-.16,.66*shape.belt/.96),hit.strength,i);if(zone==='front'&&hit.strength>.32)stamp('hood',hit.x,shape.length*.37,hit.strength*.75,i+20);});
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();data.scars.geometry.dispose();data.scars.geometry=g;data.scars.visible=positions.length>0;
  }
  function applyCarDamage(root,player){
    const data=root.userData.damageVisual;if(!data)return;const damage=player.damage||null,revision=damage?(player.damageRevision||0):0;if(data.state===damage&&data.revision===revision)return;
    data.state=damage;data.revision=revision;data.maxDisplacement=0;data.damagedVertexCount=0;data.applications++;const d=damage||{},impacts=damage?(player.impacts||[]):[],v=new T.Vector3();
    for(const record of data.records){const attr=record.mesh.geometry.attributes.position,colors=record.isShell?record.mesh.geometry.attributes.color:null;
      for(let i=0;i<attr.count;i++){const k=i*3,x=record.baseline[k],y=record.baseline[k+1],z=record.baseline[k+2];let scar=0;if(damage)scar=dentPoint(x,y,z,d,impacts,data.shape,v);else v.set(x,y,z);
        if(record.isShell){const distance=Math.hypot(v.x-x,v.y-y,v.z-z);data.maxDisplacement=Math.max(data.maxDisplacement,distance);if(distance>.005)data.damagedVertexCount++;const dark=1-scar*.29;colors.setXYZ(i,dark,dark*(1-scar*.005),dark*(1-scar*.02));}
        v.applyMatrix4(record.inverse);attr.setXYZ(i,v.x,v.y,v.z);
      }attr.needsUpdate=true;if(colors)colors.needsUpdate=true;if(record.mesh.isMesh){const normals=record.mesh.geometry.attributes.normal;if(damage||!record.normal0||!normals||normals.array.length!==record.normal0.length)record.mesh.geometry.computeVertexNormals();else{normals.array.set(record.normal0);normals.needsUpdate=true;}}record.mesh.geometry.computeBoundingBox();record.mesh.geometry.computeBoundingSphere();
    }
    for(const item of data.crackMeshes){const amount=item.zone==='front'?(d.glass||0):Math.min(d.glass||0,(d[item.zone]||0)*.7);item.mesh.material.opacity=smooth(.10,.72,amount)*.85;item.mesh.visible=amount>.10;}
    for(const light of data.lamps){const zone=light.front?'front':'rear',corner=zone+(light.side>0?'Right':'Left'),strength=clamp((d[zone]||0)*.38+(d[corner]||0)*.85,0,1);light.mesh.material.color.copy(light.original).lerp(new T.Color('#1b2224'),smooth(.25,.7,strength));light.mesh.material.roughness=mix(.26,.87,strength);}
    rebuildScuffs(data,d,impacts);
  }

  function deformCar(mesh,p){
    const d=mesh.userData;
    if(!d.damageVisual&&p.damage&&(p.damageRevision||0)>0){
      const setup=d.damageSetup;
      modelGeometry.withLevel(d.modelDetailLevel,()=>prepareCarDamage(mesh,setup.shell,setup.corners,setup.lamps,setup.shape,setup.detail));
    }
    applyCarDamage(mesh,p);
  }

  // Geometry is authored in the vehicle frame: +X is the left seat when looking +Z.
  // Static detail shares a draw call by material/tier; animation and breakaway pivots stay separate.
  function batchFixedMeshes(group){
    group.updateMatrixWorld(true);const inv=group.matrixWorld.clone().invert(),groups=new Map(),skip=o=>{for(let p=o;p&&p!==group;p=p.parent)if(p.userData.keepSeparate||p.userData.breakawayPart||p.userData.noBatch||p.userData.licensePlate)return true;return false;};
    group.traverse(o=>{if(!o.isMesh||!o.geometry||Array.isArray(o.material)||o.material.transparent||skip(o))return;const key=o.material.uuid+':'+(o.userData.qualityTier??0)+':'+(o.userData.qualityMaxTier??9);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);});
    for(const list of groups.values()){if(list.length<2)continue;const ps=[],ns=[],uv=[],ix=[],source=list[0],tier=source.userData.qualityTier,max=source.userData.qualityMaxTier;
      for(const mesh of list){const g=mesh.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inv,mesh.matrixWorld)),p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv,offset=ps.length/3;for(let i=0;i<p.count;i++){ps.push(p.getX(i),p.getY(i),p.getZ(i));ns.push(n?.getX(i)||0,n?.getY(i)||0,n?.getZ(i)||0);uv.push(u?.getX(i)||0,u?.getY(i)||0);}if(g.index)for(const i of g.index.array)ix.push(i+offset);else for(let i=0;i<p.count;i++)ix.push(i+offset);g.dispose();mesh.geometry.dispose();mesh.removeFromParent();}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setAttribute('normal',new T.Float32BufferAttribute(ns,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);const mesh=new T.Mesh(g,source.material);mesh.castShadow=mesh.receiveShadow=true;if(tier!==undefined)mesh.userData.qualityTier=tier;if(max!==undefined)mesh.userData.qualityMaxTier=max;group.add(mesh);
    }
  }
  function upgradeExterior(root,p){
    const d=root.userData,{body,length:L,width:W,belt,kind,height}=d,{trim,chrome,paintDark,frontBase,rearBase,wBase,detail}=p,compact=kind==='compact',sport=kind==='vektor'||kind==='apex',apex=kind==='apex',utility=['suv','van','truck'].includes(kind);
    const extras=new T.Group();extras.name='Exterior coachwork and lamp housings';body.add(extras);
    const dark=[],bright=[],painted=[];
    // Chamfered bumper cheeks and separate apertures define each model's face.
    for(const side of[-1,1]){
      const cheek=addSoftBox(extras,W*(apex?.16:.13),apex?.19:.21,.17,side*W*.35,.51,L*.455,paintDark,.045);cheek.rotation.y=side*.14;body.updateMatrixWorld(true);d.frontBumper.attach(cheek);
      const intake=addSoftBox(extras,W*(sport?.18:.12),.12,.026,side*W*.29,.51,L*.501,trim,.02);body.updateMatrixWorld(true);d.frontBumper.attach(intake);
      if(side===1){const lip=addSoftBox(extras,W*.88,.045,.16,0,.325,L*.448,paintDark,.015);body.updateMatrixWorld(true);d.frontBumper.attach(lip);}
      // Layered projector barrels are backed by a dark lamp pocket, not flat painted dots.
      for(let j=0;j<(compact?1:2);j++){const lens=new T.CylinderGeometry(compact?.038:.027,compact?.04:.032,.035,detail?16:10);lens.rotateX(Math.PI/2);lens.translate(side*(W*.25+(j-.5)*.075),belt-.15,L*.485+.043);bright.push(lens);}
      // Hood cut, boot cut and recessed beltline weather strip continue around the cabin.
      dark.push(detailBox(.014,.025,Math.abs(frontBase-rearBase)*.98,side*wBase,belt+.006,(frontBase+rearBase)*.5));
      if(sport){dark.push(detailBox(.035,.095,.29,side*W*.493,.59,-L*.15,0,0,side*.08));const blade=roundedBoxGeometry(.05,.12,L*.61,.015);blade.translate(side*W*.487,.34,-L*.03);painted.push(blade);}
      if(utility){const rail=roundedBoxGeometry(.05,.045,L*(kind==='suv'?.48:.26),.015);rail.translate(side*W*.34,height+.08,-L*.10);bright.push(rail);}
      // Stamped fender contour follows the wheel opening instead of intersecting the tire.
      for(const wheel of d.wheels.filter(w=>w.side===side)){const z=wheel.basePosition.z,r=wheel.pivot.userData.wheelRadius+.08,curve=[];for(let i=0;i<=18;i++){const a=i*Math.PI/18;curve.push(new T.Vector3(side*W*.508,wheel.pivot.userData.wheelRadius+Math.sin(a)*r,z+Math.cos(a)*r));}const tube=new T.TubeGeometry(new T.CatmullRomCurve3(curve),18,.015,4,false);painted.push(tube);}
    }
    // A visible rear valance and longitudinal ribs give the coupe/performance models different tails.
    dark.push(detailBox(W*.74,.11,.15,0,.37,-L*.465));for(let i=-2;i<=2;i++)dark.push(detailBox(.019,.095,.20,i*W*.105,.34,-L*.478));
    for(let j=0;j<(compact?3:sport?5:7);j++)bright.push(detailBox(W*.29,.009,.019,0,.56+j*.025,L*.524));
    if(kind==='suv'){for(const side of[-1,1])painted.push(detailBox(.06,.08,L*.55,side*W*.48,.34,-.12));}
    if(kind==='van'){for(const side of[-1,1]){dark.push(detailBox(.014,.55,.018,side*W*.465,1.32,-L*.20));dark.push(detailBox(.017,.025,L*.42,side*W*.468,.95,-L*.20));bright.push(detailBox(.025,.045,.18,side*W*.47,1.10,-L*.12));}dark.push(detailBox(.022,1.40,.018,0,1.34,-L*.455));}
    if(kind==='truck'){for(const side of[-1,1]){bright.push(detailBox(.14,.045,.45,side*W*.49,.47,L*.25));bright.push(detailBox(.14,.045,.45,side*W*.49,.67,L*.25));}for(let j=0;j<10;j++)dark.push(detailBox(W*.82,.018,.02,0,.90+j*.14,-L*.492));}
    detailBatch(extras,dark,trim,0);detailBatch(extras,painted,paintDark,1);detailBatch(extras,bright,chrome,2);
    root.userData.modelVersion=2;root.userData.mirrorMode='live rear-facing world cameras';
  }

  // Articulated seated adults. Pelvis/legs stay on the seat; only upper-body
  // springs respond to acceleration until an actual severe impact ejects them.
  function createOccupant(index,seat,scale=1,driver=false,role=['male','woman','boy','girl'][index%4]){
    const adultWoman=!driver&&index===1&&role==='woman',chestPivots=[],seatBelt=[];
    const root=new T.Group();root.name='Vehicle occupant Â· '+role;root.userData.noBatch=true;root.userData.noDent=true;root.position.set(seat.x,(seat.top??seat.y+.07)+.07*scale,seat.z);root.userData.occupantRole=role;if(adultWoman)root.userData.generatedAdultWoman=true;
    const skin=mat('#f0cfb5',.83),shirt=mat(driver?'#435c6a':'#b51e36',.94),trousers=mat(driver?'#2d3745':'#b51e36',.96),hair=mat('#e6c46d',.96),shoe=mat('#242727',.9),eye=mat('#e4ded1',.76),pupil=mat('#242a2b',.8);
    const mesh=(parent,geometry,material,x=0,y=0,z=0)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
    const oval=(parent,material,x,y,z,sx,sy,sz)=>{const m=mesh(parent,new T.SphereGeometry(1,modelSteps(12,7),modelSteps(10,6)),material,x,y,z);m.scale.set(sx,sy,sz);return m;};
    const lower=new T.Group();lower.name='pelvis';root.add(lower);oval(lower,trousers,0,.035,0,.16,.105,.14);
    for(const side of[-1,1]){const x=side*.105,leg=new T.Group();leg.name='thigh'+side;leg.position.set(x,.015,.02);lower.add(leg);rod(leg,[0,0,0],[0,-.07,.28],.070,trousers,9);oval(leg,driver?trousers:skin,0,-.07,.28,.074,.078,.075);const shin=new T.Group();shin.name='shin'+side;shin.position.set(0,-.07,.28);leg.add(shin);rod(shin,[0,0,0],[0,-.25,.07],.052,driver?trousers:skin,8);oval(shin,shoe,0,-.285,.13,.073,.049,.13);}

    if(!driver){const skirt=new T.LatheGeometry([new T.Vector2(.20,-.10),new T.Vector2(.185,.02),new T.Vector2(.145,.12)],modelSteps(16,8));skirt.scale(1,1,1.5);mesh(lower,skirt,shirt,0,0,.08);}
    const upper=new T.Group();upper.name='torso';upper.position.y=.04;root.add(upper);
    const torso=new T.LatheGeometry([new T.Vector2(.125,0),new T.Vector2(.15,.07),new T.Vector2(.18,.28),new T.Vector2(.155,.34),new T.Vector2(.08,.37)],modelSteps(14,8));torso.scale(1,1,.60);mesh(upper,torso,shirt);rod(upper,[-.13,.33,.015],[.13,.33,.015],.053,shirt,8);
    // A covered, shaped dress bodice. Only the adult woman receives these
    // pivots; the family child models and the player's own avatar are unchanged.
    if(adultWoman){for(const side of[-1,1]){const pivot=new T.Group();pivot.name='adult-dress-bodice-'+(side<0?'left':'right');pivot.position.set(side*.078,.255,.055);pivot.userData.rest=pivot.position.clone();upper.add(pivot);oval(pivot,shirt,0,0,0,.101,.088,.112);chestPivots.push(pivot);}for(const side of[-1,1])rod(upper,[side*.095,.08,.087],[side*.13,.16,.106],.003,mat('#85192c',.96),5);}
    oval(upper,skin,0,.386,.005,.056,.073,.053);
    const head=new T.Group();head.name='head';head.position.set(0,.485,.018);upper.add(head);oval(head,skin,0,0,0,.087,.115,.088);oval(head,skin,0,-.055,.018,.075,.064,.070);oval(head,hair,0,.063,-.009,.092,.063,.091);
    if(role==='woman'||role==='girl'){oval(head,hair,0,.004,-.070,.095,.12,.04);oval(head,hair,role==='girl'?.07:0,.02,-.113,role==='girl'?.037:.067,role==='girl'?.092:.055,.045);}else if(role==='boy')oval(head,hair,0,.076,.025,.088,.035,.072);
    if(adultWoman)for(const side of[-1,1])oval(head,hair,side*.082,-.045,-.036,.026,.103,.038);
    oval(head,skin,0,-.012,.086,.020,.031,.025);
    for(const side of[-1,1]){oval(head,skin,side*.086,-.005,-.004,.018,.034,.022);oval(head,eye,side*.034,.019,.078,.022,.011,.007);oval(head,pupil,side*.034,.019,.084,.008,.009,.004);rod(head,[side*.018,.044,.079],[side*.054,.046,.074],.006,hair,5);}
    rod(head,[-.026,-.056,.094],[.026,-.056,.094],.0055,mat('#b72d47',.65),5);
    const rigPose=window.DriveOccupantPhysics.pose(seat,scale,driver),arms=[];for(const side of[-1,1]){const prefix=side>0?'l':'r',shoulder=rigPose[prefix+'s'],elbow=rigPose[prefix+'e'],wrist=rigPose[prefix+'w'],a=[(elbow.x-shoulder.x)/scale,(elbow.y-shoulder.y)/scale,(elbow.z-shoulder.z)/scale],b=[(wrist.x-elbow.x)/scale,(wrist.y-elbow.y)/scale,(wrist.z-elbow.z)/scale],arm=new T.Group();arm.name='arm'+side;arm.position.set(side*.17,.31,.003);arm.userData.bindDirection=a;upper.add(arm);rod(arm,[0,0,0],a,.052,shirt,8);oval(arm,skin,...a,.047,.048,.045);const forearm=new T.Group();forearm.name='forearm'+side;forearm.position.set(...a);forearm.userData.bindDirection=b;arm.add(forearm);rod(forearm,[0,0,0],b,.037,skin,8);oval(forearm,skin,...b,.046,.032,.052);arms.push(arm);}

    // A dark diagonal belt has its own buckle and follows the chest's motion.
    const beltMaterial=mat('#242827',.95);if(adultWoman){const points=[[-.13,.33,.105],[-.072,.261,.181],[.12,.03,.095]];for(let i=0;i<2;i++){const segment=rod(upper,points[i],points[i+1],.013,beltMaterial,5);seatBelt.push({mesh:segment,a:new T.Vector3(...points[i]),b:new T.Vector3(...points[i+1]),restLength:new T.Vector3(...points[i]).distanceTo(new T.Vector3(...points[i+1])),movingEnd:i===0?'b':'a'});}}else rod(upper,[-.13,.31,.105],[.12,.03,.095],.013,beltMaterial,5);mesh(lower,new T.BoxGeometry(.036,.022,.025),mat('#8d9291',.4,.5),.12,.065,.11);
    const wound=oval(upper,mat('#731a19',.9),-.065,.23,.115,.038,.065,.005);wound.visible=false;wound.userData.injuryMark=true;
    batchFixedMeshes(head); // upper pivots and wound remain independently animated.
    if(role==='woman'||role==='girl')torso.scale(.92,1,1);root.scale.setScalar(scale);return{root,upper,head,arms,wound,chestPivots,seatBelt,seat:{...seat},driver,role,scale,injury:0,ejected:false,pitch:0,roll:0,vPitch:0,vRoll:0,damage:null,lastImpact:null};
  }
  // ---- V6.1: the cabin is built round the people in it ----------------------------------------------------------
  // planSeating works out, from the real shape of each body, where every person's hips go, how far their seat
  // leans, where their feet rest, and where the steering wheel stands. The seats, the wheel, the pedals and the
  // driver's eye are built from that plan, and the same plan poses the people (CityPeopleModels.carSeat), so
  // nobody sits inside a seat, hangs their legs through the floor or puts their head through the glass.
  // Lengths of the character models, in metres for a person 1.65 m tall; they scale with the person's `fit`.
  const SEAT_BODY={unit:.917,head:.115,back:.127,butt:.088,thigh:.367,calf:.358,ankle:.061,foot:.17,leg:.086};
  // Where the head ends up for a back that leans by theta: the same chain of joints carSeat turns.
  function seatedHead(theta,fit,child){
    const s=SEAT_BODY.unit*fit,k=child?1.28:1,a=.45*theta,b=.7525*theta,c=.7*theta;
    const up=s*(.13*Math.cos(a)+.10*Math.cos(b)+.37*Math.cos(theta)+.04*k*Math.cos(c)),back=s*(.13*Math.sin(a)+.10*Math.sin(b)+.37*Math.sin(theta)+.04*k*Math.sin(c));
    return{up,back,centre:up+.13*s*k,crown:up+.269*s*k,radius:.125*s*k,eyeUp:up+.135*s*k,eyeBack:back-.09*s*k,chestUp:s*(.13*Math.cos(a)+.10*Math.cos(b)+.18*Math.cos(theta)),chestBack:s*(.13*Math.sin(a)+.10*Math.sin(b)+.18*Math.sin(theta))};
  }
  // Knee of a leg from the hip joint to an ankle, in the (height, length) plane.
  function seatedKnee(hy,hz,ay,az,fit){
    const a=SEAT_BODY.thigh*fit,b=SEAT_BODY.calf*fit,jy=hy-.014*fit,dy=ay-jy,dz=az-hz,full=Math.hypot(dy,dz)||1,d=Math.min(full,a+b-.004),along=(a*a-b*b+d*d)/(2*d),h=Math.sqrt(Math.max(0,a*a-along*along)),uy=dy/full,uz=dz/full;
    return{y:jy+uy*along+uz*h,z:hz+uz*along-uy*h,thigh:Math.atan2(uy*along+uz*h,uz*along-uy*h)};
  }
  const seatPlans=new Map();
  function planSeating(car,shape,hasRear){
    const d=car.userData,{width:W,length:L,belt,height:H,kind}=d,{frontBase,rearBase}=shape,B=SEAT_BODY,deg=Math.PI/180;
    const key=[kind,L,W,H,belt,frontBase,rearBase,shape.base||0,hasRear?1:0].map(v=>typeof v==='number'?v.toFixed(3):v).join('|');if(seatPlans.has(key))return seatPlans.get(key);
    const profile=VehicleModels?.profiles[kind],mid=!!profile?.mid||kind==='apex',sport=!!profile?.sport||kind==='vektor'||mid,utility=['suv','van','truck'].includes(kind),targa=!!profile?.targa,open=!!shape.open||targa;
    const base=shape.base??(mid?.185:targa?.21:.24),floorTop=base+(mid?.05:.07),clear=open?null:shape.clear||null;
    const rise=kind==='truck'?.44:utility?.34:mid?.11:targa?.15:sport?.18:.25,dashDepth=mid?.58:.49,dashBack=frontBase-dashDepth,firewall=frontBase+.18,seatX=W*.235;
    const zOld=profile?.seat??(kind==='truck'?frontBase-.95:kind==='van'?frontBase-.9:mid?-.23:kind==='vektor'?-.40:-.43);
    // A head fits when its crown is under the headliner and the whole head is clear of the roof and the glass. A
    // child's hair may be tied back, so a second, smaller ball behind the head has to be clear as well.
    // In an open car the head stays about level with the top of the windscreen, so the driver looks through the glass.
    const header=shape.header||(open?Math.max(belt+.34,H*.98):0);
    const fits=(x,hy,hz,theta,fit,child)=>{if(!clear)return!header||hy+seatedHead(theta,fit,child).crown<=header+.03;const h=seatedHead(theta,fit,child);if(hy+h.crown>H-.035||clear(x,hy+h.centre,hz-h.back,h.radius)<.04)return false;return!child||clear(x,hy+h.centre-.03*fit,hz-h.back-h.radius*1.25,h.radius*.55)>=.015;};
    // The two in front: as high and as upright as the roof allows, then lower, then further forward or leaning
    // more, and only when nothing else is left, a little smaller.
    let F=null;const theta0=(utility?19:mid?27:sport?25:22)*deg;
    // The wheel stands a bent arm's length in front of the driver's shoulders, so the further the seat leans, the
    // closer the wheel comes; it must still stand clear of the dash.
    const shoulder=(theta,fit)=>{const s=B.unit*fit,a=.45*theta,b=.7525*theta;return{up:s*(.13*Math.cos(a)+.10*Math.cos(b)+.25*Math.cos(theta)),back:s*(.13*Math.sin(a)+.10*Math.sin(b)+.25*Math.sin(theta))};};
    for(let fit=1;fit>.81&&!F;fit-=.03){
      const hyNom=floorTop+rise+B.butt*fit,hyMin=floorTop+.055+B.butt*fit;
      for(let t=-1;t<=7;t++){const theta=theta0+t*2*deg,zMax=dashBack-.05-(.44*fit-shoulder(theta,fit).back),zNom=Math.min(zMax,zOld+.14);for(let k=-3;k<=10;k++){const hz=zNom+k*.03;if(hz>zMax+1e-6||hz<Math.min(zOld,zMax)-.06)continue;
        for(let hy=hyNom;hy>=hyMin-1e-6;hy-=.01){if(!fits(seatX,hy,hz,theta,fit,false))continue;const cost=(hyNom-hy)*100+Math.abs(hz-zNom)*55+t*t*1.2+(t<0?1.5:0);if(!F||cost<F.cost)F={cost,hy,hz,theta,fit};break;}}}
    }
    if(!F){const fit=.82,theta=theta0+14*deg;F={cost:1e9,hy:floorTop+.055+B.butt*fit,hz:Math.min(dashBack-.05-(.44*fit-shoulder(theta,fit).back),zOld+.14),theta,fit};}
    // Feet: the heels rest on the floor ahead, the driver's right foot a little further, on the pedal.
    const feet=(x,p,reach,pitch,wall)=>[0,1].map(i=>{const Lg=(B.thigh+B.calf)*p.fit,ay=floorTop+B.ankle*p.fit+.012+.03*Math.sin(pitch[i]),dy=p.hy-.014*p.fit-ay,dist=reach[i]*Lg,az=Math.min(p.hz+Math.sqrt(Math.max(.02,dist*dist-dy*dy)),wall-B.foot*p.fit*Math.cos(pitch[i])-.02);return[x+(i?1:-1)*.092*p.fit,ay,az];});
    const adult=(x,p,driver)=>{const pitch=driver?[.55,.4]:[.32,.32],ankles=feet(x,p,driver?[.9,.86]:[.84,.85],pitch,firewall),knee=seatedKnee(p.hy,p.hz,ankles[0][1],ankles[0][2],p.fit),top=p.hy-B.butt*p.fit;
      return{x,y:top-.07,top,z:p.hz,hip:[x,p.hy,p.hz],fit:p.fit,recline:p.theta,ankles,footPitch:pitch,splay:.1,hands:driver?'wheel':'lap',thigh:Math.max(.03,Math.min(.34,knee.thigh))};};
    const seats=[adult(seatX,F,true),adult(-seatX,F,false)];
    // The two children behind. Their heads have to stay under the falling roof and inside the side glass, so the
    // bench may sit lower and closer to the middle than the front seats; small children sit with their legs out.
    let R=null;
    if(hasRear&&kind!=='truck'){
      const wall=F.hz-(B.back+.14)*F.fit,zLow=rearBase+.30,thetaK=18*deg;
      for(let fit=.62;fit>.49&&!R;fit-=.03){
        const out=.42*fit/.62,bent=.27*fit/.62,zHigh=wall-out>=zLow?wall-out:Math.max(zLow-.06,wall-bent),zNom=Math.max(Math.min(rearBase+.42,zHigh),Math.min(zLow,zHigh)),hyNom=floorTop+Math.min(rise+.02,.30)+B.butt*fit,hyMin=floorTop+.05+B.butt*fit;
        for(let xi=0;xi<7;xi++){const x=seatX-xi*.04;if(x<.2)break;for(let t=-1;t<=3;t++){const theta=thetaK+t*4*deg;for(let k=-4;k<=6;k++){const hz=zNom+k*.04;if(hz>zHigh+1e-6||hz<Math.min(zLow,zHigh)-1e-6)continue;
          for(let hy=hyNom;hy>=hyMin-1e-6;hy-=.01){if(!fits(x,hy,hz,theta,fit,true))continue;const cost=(hyNom-hy)*100+Math.abs(hz-zNom)*35+xi*3.2+t*t*1.5;if(!R||cost<R.cost)R={cost,x,hy,hz,theta,fit,legsOut:wall-hz>=out-1e-6};break;}}}}
      }
      if(!R){const fit=.5,zHigh=Math.max(zLow-.06,wall-.27*fit/.62);R={cost:1e9,x:Math.max(.2,seatX-.24),hy:floorTop+.05+B.butt*fit,hz:zHigh,theta:thetaK+12*deg,fit,legsOut:false};}
      for(const side of[1,-1]){const fit=R.fit,top=R.hy-B.butt*fit,Lg=(B.thigh+B.calf)*fit,x=side*R.x;let ankles,pitch;
        if(R.legsOut){const ay=top+.05*fit,dy=R.hy-.014*fit-ay,dist=.93*Lg,az=Math.min(R.hz+Math.sqrt(Math.max(.01,dist*dist-dy*dy)),wall-.075);pitch=[1.15,1.15];ankles=[0,1].map(i=>[x+(i?1:-1)*.07*fit,ay,az]);}
        else{const ay=floorTop+B.ankle*fit+.012,dy=R.hy-.014*fit-ay,dist=.9*Lg,az=Math.min(R.hz+Math.sqrt(Math.max(.01,dist*dist-dy*dy)),wall-.03);pitch=[.25,.25];ankles=[0,1].map(i=>[x+(i?1:-1)*.07*fit,ay,az]);}
        seats.push({x,y:top-.07,top,z:R.hz,hip:[x,R.hy,R.hz],fit,recline:R.theta,ankles,footPitch:pitch,splay:.06,hands:'lap',child:true});}
    }
    const head=seatedHead(F.theta,F.fit,false),truck=kind==='truck',reach=shoulder(F.theta,F.fit),tilt=truck?.75:utility?.5:.4,rim=truck?.2:mid?.159:.17,alpha=seats[0].thigh;
    // The wheel: a bent arm's length ahead of the shoulders and a little below them, and never down on the thighs.
    const wheelZ=F.hz-reach.back+.44*F.fit,lowZ=wheelZ-rim*Math.sin(tilt),thighTop=F.hy-.014*F.fit+(lowZ-F.hz)*Math.tan(alpha)+B.leg*F.fit/Math.cos(alpha),wheelY=Math.max(F.hy+reach.up-.1*F.fit,thighTop+.035+rim*Math.cos(tilt));
    const plan={floorTop,base,firewall,dashBack,dashDepth,seatX,front:F,rear:R,seats,sport,mid,utility,targa,
      wheel:{x:seatX,y:wheelY,z:wheelZ,tilt,r:rim},
      eye:[seatX,F.hy+head.eyeUp,F.hz-head.eyeBack]};
    seatPlans.set(key,plan);return plan;
  }
  // A seat for one adult, shaped to the person the plan puts in it: the cushion follows the thighs, the back
  // follows the spine and the head restraint stands behind the head.
  function buildSeat(box,seat,p,o){
    const B=SEAT_BODY,fit=p.fit,x=seat.x,h=seatedHead(p.theta,fit,false),alpha=seat.thigh||.08,ca=Math.cos(alpha),sa=Math.sin(alpha),lean=p.theta*.75,cl=Math.cos(lean),sl=Math.sin(lean);
    const top=seat.top,thick=Math.max(.05,Math.min(.12,top-o.floorTop+.03)),length=.5*fit,width=.5,mz=p.hz+.13*fit,my=top+Math.tan(alpha)*.13*fit;
    const cushion=box(width,thick,length,x,my-thick*.5*ca,mz+thick*.5*sa,o.cloth,.04);cushion.rotation.x=-alpha;
    // The back: its front face lies against the person's back.
    const bh=.6*fit,bt=.1,sy=p.hy+h.chestUp-B.back*fit*sl,sz=p.hz-h.chestBack-B.back*fit*cl,shift=.02*fit,by=sy-bt*.5*sl-shift*cl,bz=sz-bt*.5*cl+shift*sl;
    const back=box(width-.04,bh,bt,x,by,bz,o.cloth,.045);back.rotation.x=-lean;
    const ry=Math.min(o.roof-.14,p.hy+h.centre-.005),rz=p.hz-h.back-h.radius-.06;
    const rest=box(.25,.17,.085,x,ry,rz,o.soft,.04);rest.rotation.x=-lean*.5;
    if(o.detail)for(const s of[-1,1])rod(o.parent,[x+s*.06,by+bh*.5*cl-.02,bz-bh*.5*sl],[x+s*.06,ry-.05,rz],.008,o.metal,5);
    if(o.detail)for(const s of[-1,1]){const seam=box(.006,.008,length*.72,x+s*.15,my+.004,mz,o.soft,.001);seam.rotation.x=-alpha;}
    if(o.sport)for(const s of[-1,1]){const side=box(.07,thick+.045,length*.86,x+s*.262,my-thick*.5*ca+.03,mz,o.soft,.03);side.rotation.x=-alpha;
      const wing=box(.06,bh*.5,bt+.07,x+s*.268,by-bh*.1*cl+.04*sl,bz+bh*.1*sl+.04*cl,o.soft,.025);wing.rotation.x=-lean;}
  }
  // The rear bench, shaped the same way for the two children the plan puts on it.
  function buildBench(box,plan,o){
    const B=SEAT_BODY,R=plan.rear,fit=R.fit,h=seatedHead(R.theta,fit,true),lean=R.theta*.75,cl=Math.cos(lean),sl=Math.sin(lean),top=R.hy-B.butt*fit,thick=Math.max(.05,Math.min(.12,top-plan.floorTop+.03)),width=Math.min(o.maxWidth,2*R.x+.5);
    box(width,thick,.42,0,top-thick*.5,R.hz+.1,o.cloth,.04);
    const bh=.5,bt=.1,sy=R.hy+h.chestUp-B.back*fit*sl,sz=R.hz-h.chestBack-B.back*fit*cl,by=sy-bt*.5*sl+.06*cl,bz=sz-bt*.5*cl-.06*sl,back=box(width,bh,bt,0,by,bz,o.cloth,.045);back.rotation.x=-lean;
    if(o.detail)box(.012,.01,.36,0,top+.003,R.hz+.1,o.soft,.002);
  }
  let mirrorIdleTexture=null;
  // A mirror glass with rounded corners. Until a live view is drawn on it, it shows sky over road.
  function liveMirrorSurface(parent,w,h,x,y,z,name,turn=0){
    mirrorIdleTexture??=canvasTexture(64,32,(c,cw,ch)=>{const g=c.createLinearGradient(0,0,0,ch);g.addColorStop(0,'#8fb6dc');g.addColorStop(.5,'#d3e2ea');g.addColorStop(.56,'#8d9692');g.addColorStop(1,'#565d5c');c.fillStyle=g;c.fillRect(0,0,cw,ch);});
    const r=Math.min(w,h)*.17,s=new T.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
    const g=new T.ShapeGeometry(s,modelSteps(5,2)),p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/w+.5,p.getY(i)/h+.5);
    const m=new T.Mesh(g,new T.MeshBasicMaterial({color:'#e3ecee',map:mirrorIdleTexture,toneMapped:false}));m.rotation.y=Math.PI+turn;m.position.set(x,y,z);m.name=name;m.userData.noBatch=true;m.userData.noDent=true;m.userData.liveMirror=true;parent.add(m);return m;
  }
  function installOccupants(car,interior,plan,rearBase){
    const d=car.userData,seats=plan.seats.map(s=>({...s}));
    seats[0].wheel={x:plan.wheel.x,y:plan.wheel.y,z:plan.wheel.z};interior.occupants=[];d.occupants=interior.occupants;d.seatCount=seats.length;
    d.occupantLayout={kind:d.kind,width:d.width,length:d.length,height:d.height,belt:d.belt,floor:plan.floorTop-.035,roof:d.height,frontBase:d.cabinEnvelope.maxZ,frontTop:d.cabinEnvelope.frontTop,rearBase,openRoof:!!VehicleModels?.profiles[d.kind]?.targa,adultScale:plan.front.fit,seats,dash:d.cabinEnvelope.dash};
    window.DriveOccupantPhysics?.registerLayout(d.kind,d.occupantLayout);
  }

  function createVehicleInterior(car,shape,plan){
    const d=car.userData,{width:W,length:L,belt,height,kind}=d,{frontBase,rearBase,frontTop,rearTop,wTop,detail}=shape;
    const root=new T.Group();root.name=kind+' physical cabin';root.userData.noDent=true;root.userData.noBatch=true;root.userData.vehicleInterior=true;
    const profile=VehicleModels?.profiles[kind],sport=plan.sport,apex=plan.mid,targa=plan.targa,F=plan.front,driver=plan.seats[0],floorTop=plan.floorTop,floorThick=plan.mid?.05:.07,floor=floorTop-floorThick*.5,seatX=plan.seatX,seatZ=F.hz,seatTop=driver.top,seatY=seatTop-.07,wheel=plan.wheel;
    const topY=belt-.025,dashFront=frontBase-.04,dashBack=plan.dashBack,wheelY=wheel.y,wheelZ=wheel.z;
    const driverEyeAnchor=new T.Object3D();driverEyeAnchor.name='driverEyeAnchor';driverEyeAnchor.position.set(plan.eye[0],plan.eye[1],plan.eye[2]);driverEyeAnchor.rotation.x=.055;root.add(driverEyeAnchor);car.userData.driverEyeAnchor=driverEyeAnchor;car.userData.driverSeat={x:seatX,y:seatY,z:seatZ};car.userData.seatPlan=plan;car.userData.cabinEnvelope={minX:-shape.wBase,maxX:shape.wBase,minY:floor,maxY:height,minZ:rearBase,maxZ:frontBase,frontTop,dash:{x:0,y:topY-.10,z:(dashFront+dashBack)*.5,width:W*.82,height:.17,length:dashFront-dashBack}};car.userData.vehicleAxes={forward:[0,0,1],up:[0,1,0],right:[-1,0,0]};
    const trim=mat('#171e22',.92,.01),soft=mat(sport?'#303235':'#373c3b',.97),cloth=mat(apex?'#343038':'#484c49',.98),metal=mat(sport?'#707b80':'#697170',.43,.63),accent=mat(apex?'#9e422d':sport?'#806052':'#666a5e',.8,.08),headliner=mat('#5d615e',.98),mirror=mat('#788b91',.27,.80);
    const staticRoot=new T.Group();root.add(staticRoot);const box=(w,h,l,x,y,z,m=trim,r=.025)=>addSoftBox(staticRoot,w,h,l,x,y,z,m,r);
    // Enclosed floor, a footwell that runs on under the dash to a sloping toe board, the tunnel, the rear bulkhead
    // and the headliner: no missing underside.
    box(W*.84,floorThick,Math.abs(frontBase-rearBase),0,floor,(frontBase+rearBase)*.5,trim);
    box(W*.6,floorThick,plan.firewall-frontBase+.06,0,floor,(plan.firewall+frontBase)*.5,trim);
    {const board=box(W*.6,.34,.03,0,floorTop+.13,plan.firewall-.045,trim,.01);board.rotation.x=-.5;}
    box(.21,.20,Math.max(.7,frontBase-seatZ+.35),0,floorTop+.105,(frontBase+seatZ)*.5,soft);
    box(W*.81,.26,.09,0,floorTop+.265,rearBase+.065,soft);
    if(!targa)box(wTop*2-.055,.02,Math.max(.18,frontTop-rearTop),0,height-.012,(frontTop+rearTop)*.5,headliner,.008);
    // Molded dash with lower knee bolster and a projecting padded brow.
    box(W*.82,.17,dashFront-dashBack,0,topY-.10,(dashFront+dashBack)*.5,trim,.065);
    box(W*.80,.12,.14,0,topY-.25,dashBack+.08,soft,.035);
    box(W*.80,.045,.13,0,topY-.005,dashBack+.08,soft,.018);
    const seatParts={cloth,soft,metal,sport,detail,floorTop,roof:height,parent:staticRoot};
    for(const side of[-1,1]){
      buildSeat(box,plan.seats[side>0?0:1],F,seatParts);
      box(.07,.26,Math.abs(frontBase-rearBase)*.86,side*W*.427,belt-.19,(frontBase+rearBase)*.5,soft);
      box(.095,.06,.44,side*W*.388,belt-.20,seatZ+.18,trim);
      box(.027,.033,.13,side*W*.378,belt-.09,seatZ+.29,metal,.008);
      box(.035,.018,.11,side*W*.366,belt-.16,seatZ+.25,trim,.004);
      box(.025,.085,.30,side*W*.389,floorTop+.115,seatZ+.03,trim);
      // Visors fit the exterior windshield, no camera overlay.
      box(W*.25,.016,.11,side*W*.21,height-.025,frontTop-.055,headliner,.006);
      // V3: the body itself now carries the inner faces of its pillars, so no separate pillar trims are fitted here.
    }
    // Rear bench and parcel shelf remain visible when looking back.
    if(plan.rear)buildBench(box,plan,{cloth,soft,detail,maxWidth:W*.78});
    // The steering column comes out of the dash to where the driver's hands are. The wheel leans away at the top.
    const along=[0,-Math.sin(wheel.tilt),Math.cos(wheel.tilt)],reach=Math.max(.06,(dashBack+.1-wheelZ)/along[2]);
    rod(staticRoot,[seatX,wheelY,wheelZ],[seatX,wheelY+along[1]*reach,wheelZ+along[2]*reach],.034,trim,10);
    {const shroud=box(.11,.085,.14,seatX,wheelY+along[1]*.085-.005,wheelZ+along[2]*.085,soft,.03);shroud.rotation.x=wheel.tilt;}
    if(!detail){
      // Traffic: the same seats and people, a plain wheel for the driver's hands.
      const rim=new T.Mesh(new T.TorusGeometry(wheel.r,.019,4,modelSteps(18,8)),trim);rim.position.set(seatX,wheelY,wheelZ);rim.rotation.x=wheel.tilt;staticRoot.add(rim);
      const bar=box(wheel.r*2-.02,.04,.022,seatX,wheelY,wheelZ,soft,.008);bar.rotation.x=wheel.tilt;
      batchFixedMeshes(staticRoot);return{root,driverEyeAnchor,seat:{x:seatX,y:seatY,z:seatZ},wheelCenter:{x:seatX,y:wheelY,z:wheelZ},wheel,plan,layout:'left-hand drive',trafficSimplified:true};
    }
    // Recessed vents with batched fins, passenger glovebox seam and stitched dash strip.
    for(const x of[-W*.35,-W*.10,W*.08,W*.36]){box(.15,.072,.038,x,topY-.08,dashBack-.008,trim,.012);for(let i=-2;i<=2;i++)box(.125,.005,.013,x,topY-.08+i*.011,dashBack-.032,metal,.001);}
    box(W*.28,.009,.009,-W*.24,topY-.23,dashBack+.001,trim,.001);
    box(W*.78,.012,.015,0,topY-.15,dashBack-.009,accent,.003);
    // Driver cluster above the steering column; passengers never inherit the driver instruments.
    const clusterZ=dashBack-.033,clusterY=Math.max(topY+.015,wheelY+.02); // the dials show through the upper half of the wheel
    box(.49,.18,.13,seatX,clusterY,clusterZ+.04,trim,.045);
    box(.53,.035,.18,seatX,clusterY+.10,clusterZ+.045,soft,.018);
    const gaugeTexture=units=>canvasTexture(512,192,(c,w,h)=>{c.fillStyle='#10191d';c.fillRect(0,0,w,h);c.textAlign='center';for(const [x,index]of[[127,0],[385,1]]){c.lineWidth=3;c.strokeStyle='#bac6c4';c.beginPath();c.arc(x,104,81,.76*Math.PI,2.24*Math.PI);c.stroke();for(let n=0;n<=8;n++){const a=(.76+n*1.48/8)*Math.PI;c.beginPath();c.moveTo(x+Math.cos(a)*70,104+Math.sin(a)*70);c.lineTo(x+Math.cos(a)*78,104+Math.sin(a)*78);c.stroke();c.font='16px sans-serif';c.fillStyle='#dbe3df';c.fillText(index?n:(units==='mph'?n*20:n*30),x+Math.cos(a)*55,110+Math.sin(a)*55);}c.font='12px sans-serif';c.fillText(index?'RPM ×1000':units==='mph'?'MPH':'KM/H',x,145);}c.fillStyle='#91b7af';c.font='bold 14px sans-serif';c.fillText(kind.toUpperCase(),256,180);});
    const dialTextures={mph:gaugeTexture('mph'),kmh:gaugeTexture('kmh')},dialMaterial=new T.MeshBasicMaterial({map:dialTextures.mph}),dial=new T.Mesh(new T.PlaneGeometry(.45,.169),dialMaterial);dial.position.set(seatX,clusterY,clusterZ-.029);dial.rotation.y=Math.PI;dial.userData.noBatch=true;root.add(dial);
    const needles=[];for(const px of[127,385]){const pivot=new T.Group();pivot.position.set(seatX-(px/512-.5)*.45,clusterY+(.5-104/192)*.169,clusterZ-.032);pivot.rotation.y=Math.PI;root.add(pivot);const needle=addBox(pivot,.003,.047,.002,0,.021,0,new T.MeshBasicMaterial({color:'#e9b07a'}),false);needles.push(pivot);}
    const steeringMount=new T.Group();steeringMount.name='steeringColumn';steeringMount.position.set(seatX,wheelY,wheelZ);steeringMount.rotation.x=wheel.tilt;root.add(steeringMount);
    const steeringWheel=new T.Group();steeringWheel.name='steeringWheel';steeringMount.add(steeringWheel);steeringWheel.userData.visualRatio=6;
    // Three spokes that reach the rim, at three, six and nine o'clock, round a padded centre.
    const wr=wheel.r,rim=new T.Mesh(new T.TorusGeometry(wr,.019,modelSteps(8,4),modelSteps(32,10)),trim);steeringWheel.add(rim);for(const a of[Math.PI*.5,Math.PI,Math.PI*1.5]){const spoke=addBox(steeringWheel,.04,wr-.012,.02,Math.sin(a)*wr*.5,Math.cos(a)*wr*.5,.004,metal,false);spoke.rotation.z=-a;}
    addSoftBox(steeringWheel,.13,.095,.06,0,0,.004,soft,.03);const emblem=addSoftBox(steeringWheel,.028,.023,.006,0,0,-.028,metal,.005);
    // Indicator and wiper stalks on the column.
    for(const side of[-1,1])rod(staticRoot,[seatX+side*.035,wheelY+along[1]*.07,wheelZ+along[2]*.07],[seatX+side*.19,wheelY+along[1]*.085+.012,wheelZ+along[2]*.085],.011,trim,6);
    // Pedals where the plan puts the driver's feet, and a rest for the left foot.
    {const gas=driver.ankles[0],left=driver.ankles[1],py=floorTop+.1;
      for(const [px,w,h,pz,m]of[[gas[0],.055,.13,gas[2]+.13,metal],[gas[0]+.13,.075,.075,gas[2]+.1,metal],[left[0]+.03,.085,.15,left[2]+.14,trim]]){const pad=box(w,h,.014,px,py+(h>.1?0:.035),Math.min(plan.firewall-.07,pz),m,.005);pad.rotation.x=-.62;}
      rod(staticRoot,[gas[0]+.13,py+.04,Math.min(plan.firewall-.07,gas[2]+.1)],[gas[0]+.13,py+.2,Math.min(plan.firewall-.03,gas[2]+.2)],.008,metal,5);}
    // A passenger-side stack, physical rotary controls, shifter, handbrake and cup wells.
    box(.27,.26,.10,0,topY-.18,dashBack+.001,soft,.026);
    const displayTex=canvasTexture(512,256,(c,w,h)=>{c.fillStyle='#15212d';c.fillRect(0,0,w,h);});
    const panel=new T.Mesh(new T.PlaneGeometry(.235,.117),new T.MeshBasicMaterial({map:displayTex}));panel.rotation.y=Math.PI;panel.position.set(0,topY-.13,dashBack-.053);root.add(panel);
    for(const x of[-.085,0,.085]){const control=new T.Mesh(new T.CylinderGeometry(.023,.023,.025,modelSteps(16,6)),metal);control.rotation.x=Math.PI/2;control.position.set(x,topY-.235,dashBack-.053);staticRoot.add(control);}
    const consoleEnd=Math.min(dashBack+.02,seatZ+.6);
    box(.23,.12,consoleEnd-seatZ+.02,0,seatY-.005,(consoleEnd+seatZ)*.5-.01,soft,.035);rod(staticRoot,[0,seatY+.05,seatZ+.36],[0,seatY+.18,seatZ+.38],.018,metal,8);box(.06,.065,.07,0,seatY+.20,seatZ+.38,trim,.023);
    box(.20,.065,.23,0,seatY+.055,seatZ-.12,cloth,.035);box(.035,.035,.18,seatX*.30,seatY+.075,seatZ+.08,trim,.012);
    for(const z of[seatZ+.02,seatZ+.16]){const cup=new T.Mesh(new T.CylinderGeometry(.041,.035,.023,modelSteps(20,6)),trim);cup.position.set(-.045,seatY+.065,z);staticRoot.add(cup);const ring=new T.Mesh(new T.TorusGeometry(.039,.005,4,modelSteps(20,8)),metal);ring.rotation.x=Math.PI/2;ring.position.set(-.045,seatY+.079,z);staticRoot.add(ring);}
    // The rear display is a live view of the same world, including traffic.
    rod(staticRoot,[0,height-.04,frontTop-.08],[0,height-.19,frontTop-.15],.014,trim,6);box(.28,.093,.035,0,height-.19,frontTop-.17,trim,.018);const rearMirror=liveMirrorSurface(root,.25,.071,0,height-.19,frontTop-.191,'Interior rear-view mirror');
    const digitalTexture=canvasTexture(256,80,()=>{}),digitalMaterial=new T.MeshBasicMaterial({map:digitalTexture}),digital=new T.Mesh(new T.PlaneGeometry(.105,.033),digitalMaterial);digital.rotation.y=Math.PI;digital.position.set(seatX,clusterY-.043,clusterZ-.034);root.add(digital);
    batchFixedMeshes(staticRoot);batchFixedMeshes(steeringWheel);
    return{root,driverEyeAnchor,seat:{x:seatX,y:seatY,z:seatZ},wheelCenter:{x:seatX,y:wheelY,z:wheelZ},wheel,plan,cluster:{x:seatX,y:clusterY,z:clusterZ},steeringWheel,needles,dialTextures,dialMaterial,digitalTexture,lastDigital:'',gpsTexture:displayTex,gpsPanel:panel,rearMirror,layout:'left-hand drive',mirrorMode:'live world camera'};
  }

  function createCar(kind,paintColor,detail=true,dimensions=null,level=5){return modelGeometry.withLevel(level,()=>{const root=buildCar(kind,paintColor,detail,dimensions);root.userData.modelDetailLevel=level;root.userData.sourceDimensions=dimensions;root.userData.sourceColor=paintColor;return root;});}
  function buildCar(kind,paintColor,detail=true,dimensions=null){
    if(kind==='f1')return window.DriveFormulaModel.build(paintColor,detail,dimensions,{createOccupant,batchFixedMeshes,prepareCarDamage,steps:modelSteps});
    // V3: the body, glass, lamps and wheels are sculpted by DriveVehicleModels.build. This fits the cabin, the
    // occupants, the damage model and the paint to them, exactly as the game did for the older bodies.
    const made=VehicleModels.build(kind,paintColor,detail,dimensions,{liveMirrorSurface,batchFixedMeshes}),root=made.root,d=root.userData,c=made.cabin;
    batchFixedMeshes(d.body);
    if(detail)prepareCarDamage(root,made.shell,made.corners,d.lamps,d.damageSetup.shape);
    // V6.1: the seating is planned from the real body first; the cabin is then built round the people.
    const plan=planSeating(root,c,made.rearSeats),interior=createVehicleInterior(root,{frontBase:c.frontBase,rearBase:c.rearBase,frontTop:c.frontTop,rearTop:c.rearTop,wBase:c.wBase,wTop:c.wTop,roof:c.roof,detail},plan);
    d.interior=interior;d.body.add(interior.root);installOccupants(root,interior,plan,c.rearBase);
    VehicleModels.fitPaint(root,dimensions?.paint||{baseColor:made.paintColor,strokes:[]});return root;
  }

  class DriveScene {
    constructor(canvas,route,options={}){
      if(!T)throw new Error('The local 3D engine is unavailable.');
      this.canvas=canvas;this.route=route;this.time=0;this.settings={quality:'high',scale:1,fov:72,reducedMotion:false,units:'mph',chaseDistance:6.2,chaseHeight:3.05,cameraShake:.35,speedFov:true};this.cameraMode='';this.lastView='';this.trafficMeshes=new Map();this.vector=new T.Vector3();this.target=new T.Vector3();this.dummy=new T.Object3D();this.cameraClipStats={limited:false};
      this.ownsRenderer=!options.renderer;this.renderer=options.renderer||new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
      this.renderer.setPixelRatio(1);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.04;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
      this.scene=new T.Scene();this.scene.background=new T.Color('#bacdd4');this.scene.fog=new T.Fog('#c5d1d0',130,670);
      this.camera=new T.PerspectiveCamera(72,1,.07,2300);this.scene.add(this.camera);
      this.scene.add(new T.HemisphereLight('#c3dce7','#655f40',1.7));
      this.sun=new T.DirectionalLight('#ffe9ce',2.65);this.sun.position.set(-130,190,80);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);this.sun.shadow.camera.left=-34;this.sun.shadow.camera.right=34;this.sun.shadow.camera.top=34;this.sun.shadow.camera.bottom=-34;this.sun.shadow.camera.near=10;this.sun.shadow.camera.far=430;this.sun.shadow.bias=-.00012;this.sun.shadow.normalBias=.035;this.scene.add(this.sun,this.sun.target);
      this.materials={grass:mat('#647d50'),rail:mat('#a9afa5',.4,.58),post:mat('#797d73',.65,.3),road:mat('#62676a'),mark:mat('#d4d0b9'),shoulder:mat('#a59e85'),bark:mat('#71634c'),leaf:mat('#405a39'),rock:mat('#8e9081'),building:mat('#d1c6b0'),roof:mat('#736759')};
      this.buildSky();this.buildTerrain();this.buildRoad();this.buildLandscape();this.buildTunnel();this.buildCheckpoint();this.buildCockpit();this.buildEngineSmoke();this.buildCollisionEffects();this.buildTireEffects();this.setCar({id:'compact'},'#b9543d');this.resize(canvas.clientWidth||1280,canvas.clientHeight||720);
    }
    buildSky(){
      const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#5488b9')},horizon:{value:new T.Color('#dedacc')}},vertexShader:'varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 vPosition;uniform vec3 top;uniform vec3 horizon;void main(){float h=clamp(normalize(vPosition).y,0.,1.);gl_FragColor=vec4(mix(horizon,top,pow(h,.48)),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
      this.sky=new T.Mesh(new T.SphereGeometry(2100,24,16),skyMat);this.sky.renderOrder=-100;this.scene.add(this.sky);
      const sunDisk=new T.Mesh(new T.SphereGeometry(14,16,12),new T.MeshBasicMaterial({color:'#fff0c5',fog:false}));sunDisk.position.set(-1200,950,900);this.sky.add(sunDisk);
      const cloudtex=canvasTexture(256,128,(c,w,h)=>{for(let j=0;j<11;j++){const x=25+j*20,y=65+Math.sin(j*2)*9,r=24+random()*13,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(255,255,255,.2)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}});
      const cloudmat=new T.SpriteMaterial({map:cloudtex,color:'#fff6e5',transparent:true,opacity:.42,depthWrite:false,fog:false});
      for(let i=0;i<10;i++){const c=new T.Sprite(cloudmat);c.position.set(Math.cos(i*2.399)*1500,250+random()*230,Math.sin(i*2.399)*1500);c.scale.set(500+random()*400,120+random()*100,1);this.sky.add(c);}
    }
    roadPoint(s,offset=0,raise=0){const p=this.route.at(s);return new T.Vector3(p.x+p.nx*offset,p.y+raise,p.z+p.nz*offset);}
    nearest(x,z){let best=Infinity,out=null,connector=false;const paths=[this.route,...(this.route.connectors||[])];for(const path of paths){if(path!==this.route&&path.bounds&&(x<path.bounds.minX-35||x>path.bounds.maxX+35||z<path.bounds.minZ-35||z>path.bounds.maxZ+35))continue;const samples=path.samples;for(let i=0;i<samples.length;i+=4){const p=samples[i],d=(p.x-x)**2+(p.z-z)**2;if(d<best){best=d;out=p;connector=path!==this.route;}}}return {p:out,d:Math.sqrt(best),offset:(x-out.x)*out.nx+(z-out.z)*out.nz,connector};}
    groundHeight(x,z){return this.route.groundHeight(x,z);}
    buildTerrain(){
      const {extent,steps,heights}=this.route.terrainGrid(),positions=[],colors=[],indices=[],terrainUV=[];const color=new T.Color();
      for(let iz=0;iz<=steps;iz++)for(let ix=0;ix<=steps;ix++){const x=-extent+ix*extent*2/steps,z=-extent+iz*extent*2/steps,y=heights[iz*(steps+1)+ix];positions.push(x,y,z);terrainUV.push(x/36,z/36);const shade=(Math.sin(x*.05)*Math.sin(z*.043)+1)*.04;
        color.set(y<-.4?'#b2ab8c':y>29?'#687a53':'#708557');color.offsetHSL(0,0,shade-.04);colors.push(color.r,color.g,color.b);if(ix<steps&&iz<steps){const a=iz*(steps+1)+ix;indices.push(a,a+steps+1,a+1,a+1,a+steps+1,a+steps+2);}}
      const grassTexture=canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#c9c9ba';c.fillRect(0,0,w,h);for(let i=0;i<9500;i++){const v=90+random()*130;c.fillStyle=`rgba(${v},${v},${v*.87},.18)`;c.fillRect(random()*w,random()*h,1+random()*3,1+random()*6);}});grassTexture.wrapS=grassTexture.wrapT=T.RepeatWrapping;grassTexture.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy());this.materials.grass.map=grassTexture;
      this.terrain=vertexMesh(positions,indices,new T.MeshStandardMaterial({vertexColors:true,roughness:1,map:grassTexture}),colors,terrainUV);this.scene.add(this.terrain);
      const watertex=canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#97aeb0';c.fillRect(0,0,w,h);for(let i=0;i<900;i++){const a=random()*.15;c.strokeStyle=`rgba(240,238,207,${a})`;c.lineWidth=1;c.beginPath();const x=random()*w,y=random()*h;c.moveTo(x,y);c.lineTo(x+random()*18,y+random()*2);c.stroke();}});watertex.wrapS=watertex.wrapT=T.RepeatWrapping;watertex.repeat.set(220,220);
      this.water=new T.Mesh(new T.PlaneGeometry(10000,10000),new T.MeshStandardMaterial({color:'#89b4be',map:watertex,roughness:.48,metalness:.02}));this.water.rotation.x=-Math.PI/2;this.water.position.y=-3.8;this.scene.add(this.water);
    }
    ribbon(a,b,height,material,start=0,end=this.route.length,step=3){
      const positions=[],indices=[],uv=[],count=Math.ceil((end-start)/step);
      for(let i=0;i<=count;i++){const s=mix(start,end,i/count),p=this.route.at(s);for(const offset of[a,b]){positions.push(p.x+p.nx*offset,p.y+height,p.z+p.nz*offset);uv.push((offset-a)/4,s/6);}if(i<count){const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}}
      const mesh=vertexMesh(positions,indices,material,null,uv);this.scene.add(mesh);return mesh;
    }
    buildRoad(){
      const asphalt=canvasTexture(256,256,(c,w,h)=>{c.fillStyle='#777873';c.fillRect(0,0,w,h);for(let i=0;i<13000;i++){const v=90+Math.floor(random()*90);c.fillStyle=`rgba(${v},${v},${v},.22)`;c.fillRect(random()*w,random()*h,1+random()*1.3,1+random()*1.3);}});asphalt.wrapS=asphalt.wrapT=T.RepeatWrapping;asphalt.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());
      this.materials.road.map=asphalt;
      this.ribbon(-10.6,10.6,-.017,this.materials.shoulder);this.ribbon(-8.2,8.2,0,this.materials.road);
      for(const side of[-1,1]){this.ribbon(side*7.9-.065,side*7.9+.065,.013,this.materials.mark);this.ribbon(side*.115-.035,side*.115+.035,.015,mat('#c7b78a'));}
      const dashPositions=[],dashIndices=[];
      for(let s=0;s<this.route.length;s+=10)for(const offset of[-4,4]){const base=dashPositions.length/3;for(const [at,off] of[[s,offset-.065],[s+4,offset-.065],[s+4,offset+.065],[s,offset+.065]]){const p=this.roadPoint(at,off,.016);dashPositions.push(p.x,p.y,p.z);}dashIndices.push(base,base+1,base+2,base,base+2,base+3);}
      this.scene.add(vertexMesh(dashPositions,dashIndices,this.materials.mark));
      // Continuous rail ribbons with posts: exact same centreline as collision boundaries.
      const railPositions=[],railIndices=[],posts=[];
      for(const side of[-1,1])for(let s=0;s<this.route.length;s+=4){if(s>this.route.length*.72&&s<this.route.length*.77)continue;const a=this.roadPoint(s,side*13),b=this.roadPoint(Math.min(s+4,this.route.length),side*13),i=railPositions.length/3;
        railPositions.push(a.x,a.y+.57,a.z,b.x,b.y+.57,b.z,b.x,b.y+.84,b.z,a.x,a.y+.84,a.z);railIndices.push(i,i+1,i+2,i,i+2,i+3);if(s%8===0)posts.push({x:a.x,y:a.y+.38,z:a.z,ry:this.route.at(s).yaw});}
      this.materials.rail.side=T.DoubleSide;this.scene.add(vertexMesh(railPositions,railIndices,this.materials.rail));
      this.instances(new T.BoxGeometry(.1,.8,.13),this.materials.post,posts);
      for(let s=70;s<this.route.length;s+=115){const p=this.route.at(s),side=-1;this.addRoadSign(s,side,s/this.route.length<.35?'MORROW COAST':s/this.route.length<.7?'CEDAR RIDGE':'EASTPORT',Math.ceil(s/100)*100);}
      // Small edge reflectors create readable distance cues without glowing.
      const reflectors=[];for(let s=0;s<this.route.length;s+=24)for(const side of[-1,1]){const p=this.roadPoint(s,side*12.9,.87);reflectors.push({x:p.x,y:p.y,z:p.z,ry:this.route.at(s).yaw});}this.instances(new T.BoxGeometry(.13,.07,.08),mat('#e1d9b6'),reflectors,false);
    }
    instances(geometry,material,items,cast=true){const mesh=new T.InstancedMesh(geometry,material,items.length);const d=this.dummy;
      items.forEach((p,i)=>{d.position.set(p.x,p.y,p.z);d.rotation.set(p.rx||0,p.ry||0,p.rz||0);d.scale.set(p.sx||1,p.sy||1,p.sz||1);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);});mesh.castShadow=cast;mesh.receiveShadow=true;mesh.computeBoundingSphere();this.scene.add(mesh);return mesh;}
    buildSurfaceDetail(){
      if(this.surfaceDetail)return;
      // These are surface decorations only. The route and its collision bounds stay unchanged.
      const roadHalf=this.route.halfWidth,roadEdge=this.route.barrierOffset;const groups={4:new T.Group(),5:new T.Group(),6:new T.Group()};for(const [tier,group]of Object.entries(groups)){group.userData.qualityTier=Number(tier);this.scene.add(group);}
      let localSeed=14721;const rng=()=>{localSeed=(Math.imul(localSeed,1664525)+1013904223)>>>0;return localSeed/4294967296;};
      const patches=[],patchIndices=[],cracks=[],crackIndices=[],drainFrames=[],drainSlots=[],studs=[],bolts=[];
      const surfaceQuad=(positions,indices,s,offset,width,length,height)=>{const base=positions.length/3;for(const [at,off]of[[s,offset-width*.5],[s+length,offset-width*.5],[s+length,offset+width*.5],[s,offset+width*.5]]){const p=this.roadPoint(at,off,height);positions.push(p.x,p.y,p.z);}indices.push(base,base+1,base+2,base,base+2,base+3);};
      for(let s=21;s<this.route.length-14;s+=47){
        // Narrow asphalt repairs, with irregular sealed joints rather than repeated black rectangles.
        const offset=(rng()<.5?-1:1)*(1.1+rng()*(roadHalf-2.1)),length=1.1+rng()*3.4,width=.55+rng()*.9;
        surfaceQuad(patches,patchIndices,s,offset,width,length,.009);
        for(let j=0;j<3;j++)surfaceQuad(cracks,crackIndices,s+j*length/3,offset-width*.5+(rng()-.5)*.08,.018,length/3+.02,.012);
        if(s%141<48){const side=rng()<.5?-1:1,p=this.roadPoint(s,side*(roadHalf+1.2),.002),yaw=this.route.at(s).yaw;drainFrames.push({x:p.x,y:p.y,z:p.z,ry:yaw});for(let j=0;j<7;j++){const q=this.roadPoint(s-.31+j*.10,side*(roadHalf+1.2),.01);drainSlots.push({x:q.x,y:q.y,z:q.z,ry:yaw});}}
      }
      const repair=mat('#454a4b',.96),joint=mat('#343937',.96);repair.map=this.materials.road.map;
      // Road ribbons use opposite UV axes; retain a close-grained albedo without stretching large repairs.
      const patchUV=[];for(let i=0;i<patches.length;i+=3)patchUV.push(patches[i]/4,patches[i+2]/4);const patchMesh=vertexMesh(patches,patchIndices,repair,null,patchUV);patchMesh.castShadow=false;groups[4].add(patchMesh);
      const crackMesh=vertexMesh(cracks,crackIndices,joint);crackMesh.castShadow=false;groups[5].add(crackMesh);
      groups[4].add(this.instances(new T.BoxGeometry(.44,.025,.82),mat('#656a65',.8,.15),drainFrames,false));
      groups[4].add(this.instances(new T.BoxGeometry(.34,.007,.035),mat('#252e2a',1),drainSlots,false));
      // Raised pavement reflectors are solid housings with restrained reflective inserts, not bloom emitters.
      for(let s=9;s<this.route.length;s+=12){const p=this.roadPoint(s,0,.034);studs.push({x:p.x,y:p.y,z:p.z,ry:this.route.at(s).yaw});}
      groups[5].add(this.instances(new T.BoxGeometry(.10,.045,.15),mat('#837b64',.52,.18),studs,false));
      const studFaces=studs.map(p=>({...p,y:p.y+.024,sz:.44}));groups[5].add(this.instances(new T.BoxGeometry(.068,.006,.09),mat('#d3b36f',.29,.3),studFaces,false));
      // Shoulder gravel uses clustered, centimetre-sized pebbles: visible relief at the edge of the tarmac.
      const gravel=[];for(let i=0;i<5200;i++){const s=rng()*this.route.length,side=rng()<.5?-1:1,offset=side*(roadHalf+.45+rng()*2),p=this.roadPoint(s,offset,.006),size=.025+rng()*.065;gravel.push({x:p.x,y:p.y,z:p.z,ry:rng()*Math.PI,sx:size,sy:size*.23,sz:size*(.6+rng())});}
      const gravelMaterial=mat('#827f71',.99);groups[5].add(this.instances(new T.IcosahedronGeometry(1,0),gravelMaterial,gravel.slice(0,1800),false));groups[6].add(this.instances(new T.IcosahedronGeometry(1,0),gravelMaterial,gravel.slice(1800),false));
      for(let s=0;s<this.route.length;s+=8){const tunnel=this.route.map?.tunnel||{start:.72,end:.77};if(this.route.isJunction?.(s)||(s>this.route.length*tunnel.start&&s<this.route.length*tunnel.end))continue;for(const side of[-1,1]){const p=this.roadPoint(s,side*(roadEdge-.01),.7);bolts.push({x:p.x,y:p.y,z:p.z,ry:this.route.at(s).yaw});}}
      groups[6].add(this.instances(new T.BoxGeometry(.026,.026,.028),mat('#7a827e',.49,.5),bolts,false));
      this.surfaceDetail={groups,counts:{repairs:patchIndices.length/6,drains:drainFrames.length,reflectors:studs.length,gravel:gravel.length,railBolts:bolts.length}};
    }
    setVisualQuality(key){
      const rank=qualityRanks[key]??3;if(rank>=4)this.buildSurfaceDetail();
      if(this.surfaceDetail)for(const [tier,group]of Object.entries(this.surfaceDetail.groups))group.visible=rank>=Number(tier);
      if(this.playerCar)modelQuality(this.playerCar,rank);for(const car of this.trafficMeshes.values()){modelQuality(car,rank);car.userData.lastLOD=-1;}
      this.scene.traverse(o=>{if(o.userData.buildingDetail)o.visible=rank>=4;});
      this.visualDetailStats={tier:key,carDetail:rank>=4,lampLensDetail:rank>=5,tireTreadDetail:rank>=6,roadRepairs:rank>=4?this.surfaceDetail?.counts.repairs||0:0,roadReflectors:rank>=5?this.surfaceDetail?.counts.reflectors||0:0,shoulderPebbles:rank>=6?5200:rank>=5?1800:0};
    }
    addRoadSign(s,side,text,distance){const p=this.route.at(s),group=new T.Group();group.position.copy(this.roadPoint(s,side*10.65));group.rotation.y=p.yaw;const tex=canvasTexture(512,200,(c,w,h)=>{c.fillStyle='#315456';c.fillRect(0,0,w,h);c.strokeStyle='#d9decc';c.lineWidth=8;c.strokeRect(10,10,w-20,h-20);c.textAlign='center';c.fillStyle='#f0ecd9';c.font='bold 34px Arial';c.fillText(text,w/2,79);c.font='26px Arial';c.fillText(distance?`${distance} m    â†—`:'COAST ROAD',w/2,143);});
      addBox(group,2.6,1,.10,0,2.25,0,this.materials.rail);const face=new T.Mesh(new T.PlaneGeometry(2.54,.96),new T.MeshStandardMaterial({map:tex,roughness:.8}));face.rotation.y=Math.PI;face.position.set(0,2.25,-.056);group.add(face);for(const x of[-.85,.85])addBox(group,.07,2.2,.08,x,1.1,0,this.materials.post);this.scene.add(group);
    }
    buildLandscape(){
      const trunks=[],crowns=[],upper=[],rocks=[];
      for(let s=4;s<this.route.length;s+=10){const f=s/this.route.length,wood=f>.32&&f<.73;for(let side of[-1,1]){const count=wood?4:side>0?2:1;for(let j=0;j<count;j++){if(!wood&&side<0&&random()>.18)continue;const offset=side*(21+j*15+random()*9),p=this.roadPoint(s+random()*8,offset),h=wood?5+random()*6:4+random()*3,y=this.groundHeight(p.x,p.z);if(y<-1)continue;trunks.push({x:p.x,y:y+h*.34,z:p.z,sx:.17+random()*.12,sy:h*.67,sz:.17+random()*.12});crowns.push({x:p.x,y:y+h*.66,z:p.z,sx:h*.28,sy:h*.7,sz:h*.28,ry:random()*Math.PI});upper.push({x:p.x,y:y+h*.86,z:p.z,sx:h*.22,sy:h*.57,sz:h*.22,ry:random()*Math.PI});}}}
      crowns.forEach(p=>{p.sy*=.48;p.sx*=1.22;p.sz*=1.22;});upper.forEach(p=>{p.sy*=.40;p.sx*=1.12;p.sz*=1.12;});
      this.instances(new T.CylinderGeometry(.65,1,1,6),this.materials.bark,trunks);this.instances(new T.IcosahedronGeometry(1,1),this.materials.leaf,crowns);this.instances(new T.IcosahedronGeometry(1,1),mat('#587343'),upper);
      for(let s=15;s<this.route.length;s+=24){const side=random()>.4?1:-1,p=this.roadPoint(s,side*(18+random()*20)),y=this.groundHeight(p.x,p.z);if(y<-3)continue;rocks.push({x:p.x,y:y-.5,z:p.z,sx:1.1+random()*2.5,sy:.8+random()*1.5,sz:1+random()*2,ry:random()*6});}this.instances(new T.DodecahedronGeometry(1,0),this.materials.rock,rocks);
      // A lighthouse anchors the open coast. It is an original procedural landmark.
      const lightPos=this.roadPoint(this.route.length*.125,-41),lh=new T.Group();lh.position.set(lightPos.x,Math.max(-.5,this.groundHeight(lightPos.x,lightPos.z)),lightPos.z);
      const tower=new T.Mesh(new T.CylinderGeometry(1.25,1.95,13,18),mat('#e4dcca'));tower.position.y=6.5;tower.castShadow=true;lh.add(tower);
      const stripe=new T.Mesh(new T.CylinderGeometry(1.52,1.62,1.5,18),mat('#9a5946'));stripe.position.y=6.5;lh.add(stripe);
      const rail=new T.Mesh(new T.CylinderGeometry(2,2,.18,18),mat('#505b58'));rail.position.y=12.55;lh.add(rail);
      const lantern=new T.Mesh(new T.CylinderGeometry(1.12,1.12,1.9,12),mat('#5f838e',.23,.45));lantern.position.y=13.6;lh.add(lantern);
      const cap=new T.Mesh(new T.ConeGeometry(1.6,1.1,12),mat('#5a6158'));cap.position.y=15.1;lh.add(cap);addBox(lh,.75,1.65,.1,0,.85,1.94,mat('#525e5b'));this.scene.add(lh);
      this.addBuilding(this.route.length*.11,29,14,5.5,8,'#c5b8a0','#81755c');
      // The outskirts have modest service buildings and a clear shoulder, never road obstacles.
      for(let i=0;i<9;i++)this.addBuilding(this.route.length*(.80+i*.014),i%2?31:-31,10+random()*8,4+random()*4,8+random()*9,i%2?'#b5b7a6':'#c8bfa8',i%2?'#787b72':'#8b7462');
      this.addRoadSign(this.route.length*.795,-1,'EASTPORT / HARBOR',0);
    }
    addBuilding(s,offset,w,h,d,color,roofColor){const p=this.roadPoint(s,offset),g=new T.Group();g.position.set(p.x,this.groundHeight(p.x,p.z),p.z);g.rotation.y=this.route.at(s).yaw;addBox(g,w,h,d,0,h*.5,0,mat(color));
      const roofmat=mat(roofColor),rp=[-w*.55,h,-d*.55,w*.55,h,-d*.55,0,h+1.9,-d*.55,-w*.55,h,d*.55,w*.55,h,d*.55,0,h+1.9,d*.55],roof=vertexMesh(rp,[0,3,5,0,5,2,2,5,4,2,4,1,0,2,1,3,4,5],roofmat);roof.castShadow=true;g.add(roof);
      const windowmat=mat('#46626a',.25,.4);for(let x=-w*.35;x<w*.45;x+=2.5)for(const side of[-1,1])addBox(g,1.2,1.35,.045,x,h*.58,side*(d*.5+.025),windowmat,false);addBox(g,1.25,2.5,.08,0,1.25,-d*.5-.05,mat('#746f61'));
      const trimParts=[],roofParts=[],detailGroup=new T.Group();detailGroup.userData.buildingDetail=true;detailGroup.visible=false;g.add(detailGroup);
      for(let x=-w*.35;x<w*.45;x+=2.5)for(const side of[-1,1]){
        for(const edge of[-1,1]){trimParts.push(detailBox(.065,1.48,.13,x+edge*.63,h*.58,side*(d*.5+.044)));trimParts.push(detailBox(1.32,.065,.13,x,h*.58+edge*.707,side*(d*.5+.044)));}
        trimParts.push(detailBox(.032,1.36,.11,x,h*.58,side*(d*.5+.061)));trimParts.push(detailBox(1.44,.09,.23,x,h*.58-.77,side*(d*.5+.11)));
      }
      for(const side of[-1,1]){trimParts.push(detailBox(.11,h,.12,side*w*.5,h*.5,-d*.5));roofParts.push(detailBox(.15,.16,d*1.1,side*w*.55,h-.04,0));}
      const roofAngle=Math.atan2(1.9,w*.55);for(let z=-d*.52;z<d*.54;z+=.85)for(const side of[-1,1])roofParts.push(detailBox(Math.hypot(w*.55,1.9),.032,.045,side*w*.275,h+.96,z,0,0,-side*roofAngle));
      detailBatch(detailGroup,trimParts,mat('#bbb7a9',.86),4);detailBatch(detailGroup,roofParts,mat(roofColor,.91),4);this.scene.add(g);
    }
    buildTunnel(){const start=this.route.length*.72,end=this.route.length*.77,positions=[],indices=[],count=Math.ceil((end-start)/3),archSteps=16;
      for(let i=0;i<=count;i++){const p=this.route.at(mix(start,end,i/count));for(let j=0;j<=archSteps;j++){const a=Math.PI*j/archSteps,offset=Math.cos(a)*14,raise=1.45+Math.sin(a)*6.7;positions.push(p.x+p.nx*offset,p.y+raise,p.z+p.nz*offset);}if(i<count)for(let j=0;j<archSteps;j++){const b=i*(archSteps+1)+j;indices.push(b,b+1,b+archSteps+2,b,b+archSteps+2,b+archSteps+1);}}
      const concrete=new T.MeshStandardMaterial({color:'#7d817a',roughness:.97,side:T.DoubleSide});this.scene.add(vertexMesh(positions,indices,concrete));
      for(const side of[-1,1]){const ps=[],is=[];for(let i=0;i<=count;i++){const p=this.route.at(mix(start,end,i/count));ps.push(p.x+p.nx*side*14,p.y,p.z+p.nz*side*14,p.x+p.nx*side*14,p.y+1.46,p.z+p.nz*side*14);if(i<count){const a=i*2;is.push(a,a+1,a+3,a,a+3,a+2);}}this.scene.add(vertexMesh(ps,is,concrete));}
      // Pale ribs and segmented ceiling lights make the tunnel legible in natural light.
      for(let s=start;s<=end;s+=11){const p=this.route.at(s),g=new T.Group();g.position.set(p.x,p.y,p.z);g.rotation.y=p.yaw;for(let j=0;j<16;j++){const a=Math.PI*j/16,b=Math.PI*(j+1)/16;rod(g,[Math.cos(a)*13.96,1.45+Math.sin(a)*6.68,0],[Math.cos(b)*13.96,1.45+Math.sin(b)*6.68,0],.075,this.materials.rail,5);}for(const side of[-1,1])addBox(g,.20,.045,1.9,side*5,7.6,0,mat('#e8dcc3'),false);this.scene.add(g);}
      for(const s of[start-1,end+1]){const p=this.route.at(s),g=new T.Group();g.position.set(p.x,p.y,p.z);g.rotation.y=p.yaw;for(const side of[-1,1])addBox(g,2.3,7,1,side*15,3.5,0,mat('#999d91'));addBox(g,31,1.6,1.2,0,8.5,0,mat('#9b9e90'));this.scene.add(g);}
    }
    buildCheckpoint(){this.checkpoint=new T.Group();const postmat=mat('#e0c389',.5),flagmat=mat('#3c787a',.6);for(const side of[-1,1]){addBox(this.checkpoint,.12,4.1,.12,side*9.4,2.05,0,postmat,false);addBox(this.checkpoint,1,2,.025,side*8.95,3.0,0,flagmat,false);}this.checkpoint.visible=false;this.scene.add(this.checkpoint);}
    buildCockpit(){this.cockpitLook={yaw:0,pitch:0};}
    setCameraLook(yaw=0,pitch=0){
      const look=this.cameraLook||(this.cameraLook={yaw:0,pitch:0});look.yaw=Number.isFinite(yaw)?yaw:0;look.pitch=clamp(Number.isFinite(pitch)?pitch:0,-1.1,1.1);
      this.setCockpitLook(look.yaw,-look.pitch);
    }
    setCockpitLook(yaw=0,pitch=0){this.cockpitLook={yaw:clamp(Number(yaw)||0,-2.6,2.6),pitch:clamp(Number(pitch)||0,-.7,.65)};}
    buildEngineSmoke(){
      const texture=window.PlatdoVehicleVFX.smokeTexture(T);
      this.engineSmoke=new T.Group();this.scene.add(this.engineSmoke);this.smokeParticles=[];this.trafficSmokeParticles=[];this.smokeNext=0;this.smokeClock=0;this.trafficSmokeNext=0;this.trafficSmokeClock=0;this.trafficSmokeSource=0;
      for(const [pool,limit] of[[this.smokeParticles,24],[this.trafficSmokeParticles,32]])for(let i=0;i<limit;i++){const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,opacity:0,depthWrite:false,color:'#737a76'}));sprite.visible=false;this.engineSmoke.add(sprite);pool.push({sprite,age:9,life:2,vx:0,vy:0,vz:0,traffic:pool===this.trafficSmokeParticles});}
    }
    emitEngineSmoke(p,mesh,particle,index){
      const engine=clamp(p.damage?.engine||0,0,1),shape=mesh.userData.damageVisual.shape,side=((p.damage.frontRight||0)-(p.damage.frontLeft||0))*shape.width*.24,source=this.vector;
      dentPoint(side,shape.belt+.04,shape.length*(mesh.userData.kind==='truck'?.44:.32),p.damage,p.impacts||[],shape,source);const x=source.x,z=source.z,sin=Math.sin(p.yaw||0),cos=Math.cos(p.yaw||0);
      particle.ownerMesh=mesh;particle.sprite.position.set(p.x+cos*x+sin*z,(p.y||0)+source.y,p.z-sin*x+cos*z);particle.sprite.visible=true;particle.age=0;particle.life=1.9+(index%5)*.16;particle.vx=-(p.vx||0)*.065+Math.sin(index*2.4)*.12;particle.vz=-(p.vz||0)*.065+Math.cos(index*1.7)*.12;particle.vy=.48+engine*.3;
    }
    updateDamageEffects(sim,p,dt,playing,cameraMode){
      const engine=playing&&p.damage?clamp(p.damage.engine||0,0,1):0,effectScale=clamp(this.settings.damageEffectScale??1,0,1);
      if(this.damageRun!==sim){this.damageRun=sim;this.smokeClock=this.trafficSmokeClock=0;for(const pool of[this.smokeParticles,this.trafficSmokeParticles])for(const particle of pool){particle.age=9;particle.sprite.visible=false;}}
      this.engineSmoke.visible=playing&&effectScale>0;if(effectScale===0){if(!this.smokeSuppressed){for(const pool of[this.smokeParticles,this.trafficSmokeParticles])for(const particle of pool){particle.age=9;particle.sprite.visible=false;}this.smokeSuppressed=true;}return;}this.smokeSuppressed=false;this.smokeClock+=playing?dt:0;this.trafficSmokeClock+=playing?dt:0;
      if(playing&&dt>0&&effectScale>0&&engine>.52&&this.smokeClock>.095/effectScale){this.smokeClock=0;this.emitEngineSmoke(p,this.playerCar,this.smokeParticles[this.smokeNext++%this.smokeParticles.length],this.smokeNext);}
      if(playing&&dt>0&&effectScale>0&&this.trafficSmokeClock>.085/effectScale){
        this.trafficSmokeClock=0;const candidates=(sim?.traffic||[]).slice(0,40).filter(t=>(t.damage?.engine||0)>.52&&(t.x-p.x)**2+(t.z-p.z)**2<150**2&&this.trafficMeshes.get(t.id)?.userData.damageVisual);
        for(let i=0;i<Math.min(2,candidates.length);i++){const t=candidates[this.trafficSmokeSource++%candidates.length];this.emitEngineSmoke(t,this.trafficMeshes.get(t.id),this.trafficSmokeParticles[this.trafficSmokeNext++%this.trafficSmokeParticles.length],this.trafficSmokeNext);}
      }
      if(playing&&dt>0)for(const pool of[this.smokeParticles,this.trafficSmokeParticles])for(const particle of pool){if(particle.age>=particle.life){particle.sprite.visible=false;continue;}particle.age+=dt;const t=particle.age/particle.life;particle.sprite.position.x+=particle.vx*dt;particle.sprite.position.y+=particle.vy*dt;particle.sprite.position.z+=particle.vz*dt;const size=.19+particle.age*.55;particle.sprite.scale.set(size,size,1);particle.sprite.material.opacity=Math.sin(Math.min(1,t)*Math.PI)*.30*(particle.traffic||cameraMode==='chase'?1:.42);}
      const glass=playing&&p.damage?p.damage.glass||0:0;if(this.cockpitCracks){this.cockpitCracks.visible=glass>.10;this.cockpitCracks.material.opacity=smooth(.10,.72,glass)*.8;}
    }
    buildCollisionEffects(){
      this.collisionEffects=new T.Group();this.scene.add(this.collisionEffects);this.collisionPools=[];
      for(const [spark,limit] of[[false,32],[true,64]]){const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),spark?new T.MeshBasicMaterial({color:'#ffd393'}):mat('#424b4b',.56,.32),limit);mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.collisionEffects.add(mesh);this.collisionPools.push({spark,mesh,cursor:0,particles:Array.from({length:limit},()=>({active:false,age:0}))});}
      this.collisionEffectStats={limit:96,active:0,emitted:0};this.resetCollisionEffects();
    }
    resetCollisionEffects(){
      this.seenImpacts=new WeakMap();this.dummy.position.set(0,0,0);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(0,0,0);this.dummy.updateMatrix();
      for(const pool of this.collisionPools){pool.cursor=0;pool.particles.forEach((p,i)=>{p.active=false;p.age=0;pool.mesh.setMatrixAt(i,this.dummy.matrix);});pool.mesh.instanceMatrix.needsUpdate=true;}this.collisionEffectStats.active=this.collisionEffectStats.emitted=0;
    }
    updateCollisionEffects(sim,p,dt,playing){
      if(this.collisionRun!==sim){this.collisionRun=sim;this.resetCollisionEffects();}const effectScale=clamp(this.settings.damageEffectScale??1,0,1);this.collisionEffects.visible=playing&&effectScale>0;if(effectScale===0){if(!this.collisionSuppressed)this.resetCollisionEffects();this.collisionSuppressed=true;return;}this.collisionSuppressed=false;if(!playing||dt<=0)return;
      for(const body of[p,...(sim?.traffic||[]).slice(0,40)]){const hit=body.lastImpact;if(!hit||this.seenImpacts.get(body)===hit.revision)continue;this.seenImpacts.set(body,hit.revision);
        const strength=clamp(hit.severity??hit.strength??0,0,1);if(effectScale<=0||strength<.09||(sim.time||0)-(hit.time||0)>.35||(body.x-p.x)**2+(body.z-p.z)**2>125**2)continue;
        for(const pool of this.collisionPools){const count=Math.min(pool.spark?13:7,Math.ceil(strength*(pool.spark?15:8)*effectScale));for(let i=0;i<count;i++){const particle=pool.particles[pool.cursor++%pool.particles.length],phase=pool.cursor*2.399,spread=pool.spark?2.8:1.4,power=.7+strength*(pool.spark?5:2.8);Object.assign(particle,{active:true,age:0,life:pool.spark?.22+strength*.26:.75+strength*.6,x:hit.x,y:hit.y||((body.y||0)+.65),z:hit.z,floor:(body.y||0)+.025,vx:-(hit.nx||0)*power+Math.sin(phase)*spread+(body.vx||0)*.12,vy:1+strength*2+Math.sin(phase*1.8)*.6,vz:-(hit.nz||0)*power+Math.cos(phase)*spread+(body.vz||0)*.12,phase,size:pool.spark?.017:.027+strength*.04});this.collisionEffectStats.emitted++;}}
      }
      let active=0;for(const pool of this.collisionPools){for(let i=0;i<pool.particles.length;i++){const particle=pool.particles[i];if(particle.active){particle.age+=dt;if(particle.age>=particle.life)particle.active=false;}
          if(particle.active){particle.vy-=9.8*dt;particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.z+=particle.vz*dt;if(particle.y<particle.floor){particle.y=particle.floor;particle.vy=Math.abs(particle.vy)*.22;particle.vx*=.62;particle.vz*=.62;}const fade=1-smooth(.62,1,particle.age/particle.life),size=particle.size*fade;this.dummy.position.set(particle.x,particle.y,particle.z);this.dummy.rotation.set(pool.spark?Math.atan2(particle.vy,Math.hypot(particle.vx,particle.vz)):particle.phase+particle.age*5,Math.atan2(particle.vx,particle.vz),pool.spark?0:particle.phase+particle.age*3);this.dummy.scale.set(size,pool.spark?size:size*.44,pool.spark?(.075+Math.hypot(particle.vx,particle.vz)*.019)*fade:size*1.7);active++;}
          else this.dummy.scale.set(0,0,0);this.dummy.updateMatrix();pool.mesh.setMatrixAt(i,this.dummy.matrix);
        }pool.mesh.instanceMatrix.needsUpdate=true;}this.collisionEffectStats.active=active;
    }
    buildTireEffects(){
      const group=new T.Group();this.scene.add(group);this.tireEffects=group;
      this.skidMesh=new T.InstancedMesh(new T.BoxGeometry(.165,.003,1),new T.MeshBasicMaterial({color:'#101411',transparent:true,opacity:.43,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),320);this.skidMesh.frustumCulled=false;group.add(this.skidMesh);
      this.skidMarks=Array.from({length:320},()=>({active:false,age:0}));this.skidCursor=0;this.skidClock=0;this.lastTireContacts=null;
      this.tireSmokeTexture=window.PlatdoVehicleVFX.smokeTexture(T);this.tireSmoke=[];this.tireSmokeCursor=0;this.tireSmokeClock=0;this.smokeTrail=new window.PlatdoVehicleVFX.SmokeTrail(T,group,72);
      this.tireEffectStats={skidLimit:320,smokeLimit:28,activeSkids:0,activeSmoke:0,emittedSkids:0,emittedSmoke:0};this.resetTireEffects();
    }
    resetTireEffects(){
      this.smokeTrail?.clear();for(const p of this.smokeDecor||[])p.age=99;this.skidCursor=0;this.skidClock=0;this.tireSmokeCursor=0;this.tireSmokeClock=0;this.lastTireContacts=null;this.dummy.position.set(0,0,0);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(0,0,0);this.dummy.updateMatrix();
      this.skidMarks.forEach((mark,i)=>{mark.active=false;mark.age=0;this.skidMesh.setMatrixAt(i,this.dummy.matrix);});this.skidMesh.instanceMatrix.needsUpdate=true;
      for(const particle of this.tireSmoke){particle.age=particle.life+1;particle.sprite.visible=false;}Object.assign(this.tireEffectStats,{activeSkids:0,activeSmoke:0,emittedSkids:0,emittedSmoke:0});
    }
    updateTireEffects(sim,p,dt,playing){
      if(this.tireRun!==sim){this.tireRun=sim;this.resetTireEffects();}const effectScale=clamp(this.settings.damageEffectScale??1,0,1);this.setTireSmokeBudget?.(this.settings.graphicsValues?.smokeParticleBudget??72);this.tireEffects.visible=playing&&(effectScale>0||this.smokeTrail.budget>0);this.skidMesh.visible=effectScale>0;if(!playing||dt<=0)return;
      let matricesDirty=false,activeSkids=0,activeSmoke=0;
      for(let i=0;i<this.skidMarks.length;i++){const mark=this.skidMarks[i];if(!mark.active)continue;mark.age+=dt;if(mark.age>18){mark.active=false;this.dummy.scale.set(0,0,0);this.dummy.updateMatrix();this.skidMesh.setMatrixAt(i,this.dummy.matrix);matricesDirty=true;}else activeSkids++;}
      const speed=Math.abs(p.speed||0),intensity=clamp(Number.isFinite(p.driftIntensity)?p.driftIntensity:(Math.abs(p.slip||0)-1.1)/4,0,1),onAsphalt=Math.abs(p.offset||0)<8.05;
      const skidding=intensity>.10&&speed>4&&onAsphalt;
      if(skidding){const sin=Math.sin(p.yaw||0),cos=Math.cos(p.yaw||0),contacts=this.playerCar.userData.wheels.map(w=>({x:p.x+cos*w.pivot.position.x+sin*w.pivot.position.z,y:(p.y||0)+.023,z:p.z-sin*w.pivot.position.x+cos*w.pivot.position.z}));
        this.skidClock+=dt;this.tireSmokeClock+=dt;if(!this.lastTireContacts)this.lastTireContacts=contacts;
        if(this.skidClock>.035){this.skidClock=0;for(let i=0;i<contacts.length;i++){const a=this.lastTireContacts[i],b=contacts[i],dx=b.x-a.x,dz=b.z-a.z,distance=Math.hypot(dx,dz);if(distance<.08||distance>3.5)continue;const index=this.skidCursor++%this.skidMarks.length,mark=this.skidMarks[index];if(!mark.active)activeSkids++;mark.active=true;mark.age=0;this.dummy.position.set((a.x+b.x)*.5,(a.y+b.y)*.5,(a.z+b.z)*.5);this.dummy.rotation.set(0,Math.atan2(dx,dz),0);this.dummy.scale.set(.65+intensity*.5,1,distance+.055);this.dummy.updateMatrix();this.skidMesh.setMatrixAt(index,this.dummy.matrix);this.tireEffectStats.emittedSkids++;matricesDirty=true;}this.lastTireContacts=contacts;}
        const colorId=this.playerConfig?.smokeColor||'white',colorItem=window.DriveCore.SMOKE_COLORS.find(x=>x.id===colorId),color=colorId==='rainbow'?'hsl('+Math.round((this.time*.18%1)*360)+',85%,68%)':colorId==='galaxy'?['#974de7','#3889dd','#e56dce','#5942ae'][Math.floor(this.time*3)%4]:colorItem?.color||'#d3d7d7';
        for(let i=0;i<contacts.length;i++)this.smokeTrail.emit('player:'+i,contacts[i],intensity,color,{body:p,width:this.playerConfig.width,length:this.playerConfig.length});this.emitSmokeDecor?.(contacts,colorId,intensity,dt);
      }else{this.lastTireContacts=null;this.skidClock=0;this.tireSmokeClock=0;for(let i=0;i<4;i++)this.smokeTrail.stop('player:'+i);}
      // Remote cars leave the same bounded wakes, so other players' drifts are visible.
      const live=new Set();for(const other of sim.traffic||[]){if(!String(other.id).startsWith('p:')||Math.hypot(other.x-p.x,other.z-p.z)>100)continue;const strength=clamp(other.driftIntensity||Math.abs(other.slip||0)/5,0,1);if(strength<.18||Math.abs(other.speed)<5||other.destroyed)continue;const mesh=this.trafficMeshes.get(other.id);if(!mesh)continue;for(const[side,w]of mesh.userData.wheels.entries()){const sin=Math.sin(other.yaw),cos=Math.cos(other.yaw),id=other.id+':'+side;live.add(id);this.smokeTrail.emit(id,{x:other.x+cos*w.pivot.position.x+sin*w.pivot.position.z,y:(other.y||0)+.02,z:other.z-sin*w.pivot.position.x+cos*w.pivot.position.z},strength,'#d3d7d7',other);}}
      for(const id of this.remoteSmokeEmitters||[])if(!live.has(id))this.smokeTrail.stop(id);this.remoteSmokeEmitters=live;this.smokeTrail.update(dt);this.updateSmokeDecor?.(dt);activeSmoke=this.smokeTrail.stats.points;this.tireEffectStats.emittedSmoke=this.smokeTrail.stats.emitted;

      if(matricesDirty)this.skidMesh.instanceMatrix.needsUpdate=true;this.tireEffectStats.activeSkids=activeSkids;this.tireEffectStats.activeSmoke=activeSmoke;
    }

    updateOccupants(mesh,p,dt){
      const occupants=mesh.userData.occupants||[],impact=p.lastImpact;
      for(const o of occupants){
        if(o.damage!==p.damage){o.damage=p.damage;o.ejected=false;o.injury=0;o.wound.visible=false;o.root.visible=true;o.lastImpact=null;o.pitch=o.roll=o.vPitch=o.vRoll=0;}
        const hit=impact&&o.lastImpact!==impact;o.lastImpact=impact;
        if(hit&&(impact.severity||0)>.16){o.injury=clamp(o.injury+(impact.severity||0)*.48,0,1);o.wound.visible=true;o.wound.scale.y=.065*(.7+o.injury);o.vPitch+=(impact.normalZ||impact.nz||1)*(impact.severity||0)*2.2;o.vRoll+=(impact.normalX||impact.nx||.3)*(impact.severity||0)*1.6;
          mesh.updateWorldMatrix(true,true);this.emitOccupantBlood(o.upper.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.24,0)),p,Math.ceil(4+o.injury*9));}
        if(!o.ejected&&p.damage&&(p.destroyed||hit&&(impact.severity||0)>.78)){
          mesh.updateWorldMatrix(true,true);this.ejectOccupant(o,p);o.ejected=true;o.root.visible=false;
        }
        if(o.ejected){o.root.visible=false;continue;}
        if(dt>0){const targetRoll=clamp(-(p.yawRate||0)*Math.abs(p.speed||0)*.009,-.23,.23),targetPitch=clamp((p.pitch||0)*1.8+(p.brake||0)*.08,-.17,.21),step=Math.min(dt,.04);o.vRoll+=((targetRoll-o.roll)*65-o.vRoll*9)*step;o.vPitch+=((targetPitch-o.pitch)*65-o.vPitch*9)*step;o.roll=clamp(o.roll+o.vRoll*step,-.42,.42);o.pitch=clamp(o.pitch+o.vPitch*step,-.38,.38);}
        o.upper.rotation.z=o.roll;o.upper.rotation.x=o.pitch;o.head.rotation.z=-o.roll*.28;o.head.rotation.x=-o.pitch*.32;
        o.arms.forEach((arm,i)=>{arm.rotation.z=o.roll*(i?.3:-.3);arm.rotation.x=o.pitch*.24;});
      }
    }
    occupantEffects(){
      if(this.occupantFX)return this.occupantFX;const group=new T.Group();group.name='Occupant impact effects';group.userData.sceneryDynamic=true;this.scene.add(group);
      const bloodGeometry=new T.SphereGeometry(1,14,10),positions=bloodGeometry.attributes.position;for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i),angle=Math.atan2(z,x),r=1+Math.sin(angle*3)*.08+Math.cos(angle*5)*.06;positions.setXZ?positions.setXZ(i,x*r,z*r):positions.setXYZ(i,x*r,positions.getY(i),z*r);}bloodGeometry.computeVertexNormals();const blood=new T.InstancedMesh(bloodGeometry,new T.MeshStandardMaterial({color:'#650d14',roughness:.28,metalness:.03}),160);blood.frustumCulled=false;group.add(blood);const particles=Array.from({length:160},()=>({age:10,life:0}));const dummy=new T.Object3D();dummy.scale.set(0,0,0);dummy.updateMatrix();particles.forEach((p,i)=>blood.setMatrixAt(i,dummy.matrix));blood.instanceMatrix.needsUpdate=true;
      return this.occupantFX={group,blood,particles,run:this.activeSim,cursor:0,ragdolls:[],emitted:0,ejected:0,dummy};
    }
    emitOccupantBlood(position,p,count){
      const fx=this.occupantEffects();for(let i=0;i<count;i++){const index=fx.cursor++,particle=fx.particles[index%fx.particles.length],a=index*2.399;Object.assign(particle,{x:position.x,y:position.y,z:position.z,vx:(p.vx||0)*.16+Math.sin(a)*(1+i*.12),vy:1.5+(i%4)*.55,vz:(p.vz||0)*.16+Math.cos(a)*(1+i*.12),age:0,life:8,size:.008+(i%3)*.0035,floor:(p.y||0)+.015,settled:false,body:null,bodyId:null,local:null,localNormal:null,normal:null,surfaceAge:0});fx.emitted++;}
    }
    ejectOccupant(o,p){
      const fx=this.occupantEffects(),object=o.root.clone(true);object.name='Ejected occupant';object.traverse(n=>{if(n.geometry)n.geometry=n.geometry.clone();if(n.material)n.material=Array.isArray(n.material)?n.material.map(m=>m.clone()):n.material.clone();});o.root.matrixWorld.decompose(object.position,object.quaternion,object.scale);object.visible=true;fx.group.add(object);
      const a=fx.ejected++*2.399,velocity=new T.Vector3((p.vx||0)*.75+Math.sin(a)*3.3,4.5+fx.ejected%3,(p.vz||0)*.75+Math.cos(a)*3.3),spin=new T.Vector3(1.8+Math.sin(a),Math.cos(a)*1.7,Math.sin(a)*2.3);
      fx.ragdolls.push({object,velocity,spin,age:0,life:20,settled:false,floor:(p.y||0)+.23,bounces:0,upper:object.children[1]});this.emitOccupantBlood(object.position,p,24);
      while(fx.ragdolls.length>16)this.disposeOccupantEffect(fx.ragdolls.shift());
    }
    disposeOccupantEffect(r){const geometries=new Set(),materials=new Set();r.object.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());r.object.removeFromParent();}
    updateOccupantEffects(sim,dt,playing){
      const fx=this.occupantFX;if(!fx)return;if(fx.run!==sim){for(const r of fx.ragdolls)this.disposeOccupantEffect(r);fx.ragdolls=[];fx.particles.forEach(p=>p.age=p.life+1);fx.run=sim;fx.emitted=fx.ejected=0;}
      fx.group.visible=playing;if(!playing||dt<=0)return;
      for(const r of fx.ragdolls){r.age+=dt;if(!r.settled){r.velocity.y-=9.81*dt;r.object.position.addScaledVector(r.velocity,dt);r.object.rotation.x+=r.spin.x*dt;r.object.rotation.z+=r.spin.z*dt;r.object.rotation.y+=r.spin.y*dt;const n=this.nearest(r.object.position.x,r.object.position.z);r.floor=(n.connector||Math.abs(n.offset)<this.route.halfWidth+1?n.p.y:this.groundHeight(r.object.position.x,r.object.position.z))+.22;
          if(r.upper){r.upper.rotation.x=Math.sin(r.age*11)*.55;r.upper.rotation.z=Math.cos(r.age*9)*.38;}
          if(r.object.position.y<r.floor){r.object.position.y=r.floor;r.velocity.y=Math.abs(r.velocity.y)*.28;r.velocity.x*=.64;r.velocity.z*=.64;r.spin.multiplyScalar(.55);r.bounces++;if(r.velocity.length()<.7||r.bounces>8){r.settled=true;r.object.rotation.x=Math.PI*.5;}}}
        if(r.age>r.life-2)r.object.traverse(o=>{if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material])){m.transparent=true;m.opacity=clamp((r.life-r.age)/2,0,1);}});
      }fx.ragdolls=fx.ragdolls.filter(r=>{if(r.age<r.life)return true;this.disposeOccupantEffect(r);return false;});
      let active=0;for(let i=0;i<fx.particles.length;i++){const p=fx.particles[i];p.age+=dt;if(p.age<p.life){if(!p.settled){p.vy-=9.81*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.y<p.floor){p.y=p.floor;p.settled=true;}}const fade=clamp((p.life-p.age)/2,0,1),size=p.size*fade;fx.dummy.position.set(p.x,p.y,p.z);fx.dummy.scale.set(size*(p.settled?3.5:1),size*(p.settled?.10:1),size*(p.settled?2.4:1));active++;}else fx.dummy.scale.set(0,0,0);fx.dummy.updateMatrix();fx.blood.setMatrixAt(i,fx.dummy.matrix);}fx.blood.instanceMatrix.needsUpdate=true;this.occupantStats={ragdolls:fx.ragdolls.length,bloodParticles:active,emitted:fx.emitted,ejected:fx.ejected,ragdollLimit:16,particleLimit:160};
    }
    updateGPS(sim,player,dt){
      const interior=this.playerCar.userData.interior,texture=interior?.gpsTexture;if(!texture)return;interior.gpsClock=(interior.gpsClock||0)+dt;const waypoint=sim?.waypoint,key=[Math.round(player.x/2),Math.round(player.z/2),Math.round(player.yaw*30),waypoint?.x,waypoint?.z].join('/');if(interior.gpsKey===key&&interior.gpsClock<.2)return;interior.gpsKey=key;interior.gpsClock=0;
      const c=texture.image.getContext('2d'),w=512,h=256,scale=1.28,sin=Math.sin(player.yaw||0),cos=Math.cos(player.yaw||0),project=p=>{const dx=p.x-player.x,dz=p.z-player.z,forward=dx*sin+dz*cos,right=-dx*cos+dz*sin;return{x:w*.5+right*scale,y:h*.74-forward*scale*.66};};
      c.fillStyle='#14212b';c.fillRect(0,0,w,h);c.save();c.beginPath();c.rect(0,30,w,h-30);c.clip();c.strokeStyle='#223440';c.lineWidth=1;for(let x=0;x<w;x+=42){c.beginPath();c.moveTo(x,30);c.lineTo(x,h);c.stroke();}for(let y=32;y<h;y+=34){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
      const trace=(path,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.beginPath();let begun=false;for(const point of path.samples||[]){const p=project(point);if(!begun){c.moveTo(p.x,p.y);begun=true;}else c.lineTo(p.x,p.y);}c.stroke();};
      for(const path of[this.route,...this.route.connectors||[]]){trace(path,'#0b131a',(path.width||12)*scale+5);trace(path,'#60717b',Math.max(5,(path.width||12)*scale));trace(path,'#7e8e95',2);}
      const guidance=sim?.gps;let distance=guidance?.remaining||0;if(waypoint){window.PlatdoNavigation?.drawRoute(c,guidance?.points,project,'#49bdf4',6);const pin=project(waypoint);c.fillStyle='#f4cf64';c.beginPath();c.arc(pin.x,pin.y,8,0,Math.PI*2);c.fill();}

      c.translate(w*.5,h*.74);c.fillStyle='#d5f5ff';c.strokeStyle='#163847';c.lineWidth=2;c.beginPath();c.moveTo(0,-12);c.lineTo(9,10);c.lineTo(0,5);c.lineTo(-9,10);c.closePath();c.fill();c.stroke();c.restore();c.fillStyle='#10191f';c.fillRect(0,0,w,31);c.fillStyle='#d4e5e9';c.font='bold 18px sans-serif';c.textAlign='left';c.fillText(waypoint?(guidance?.instruction||'Finding route…'):'PLATDO NAV',14,22,360);c.textAlign='right';c.fillStyle='#7cccf0';c.fillText(waypoint?(guidance?.distance||''):this.route.map.name.toUpperCase(),w-12,22);texture.needsUpdate=true;this.gpsStats={waypoint:waypoint?{x:waypoint.x,z:waypoint.z}:null,distance,status:guidance?.status,instruction:guidance?.instruction,routePoints:guidance?.points?.length||0,updates:(this.gpsStats?.updates||0)+1};
    }
    updateLiveMirrors(dt,playing,cameraMode){
      if(!playing||cameraMode!=='cockpit'||this.playerCar.userData.breakState?.exploded)return;
      const quality=qualityRanks[this.settings.graphicsValues?.detail||this.settings.quality]??2,size=quality<2?128:quality<4?256:512,interval=quality<2?1/10:quality<4?1/18:1/30;
      let state=this.liveMirrors;if(!state){state=this.liveMirrors={clock:1,targets:[],cameras:[],frames:0};for(let i=0;i<3;i++){const target=new T.WebGLRenderTarget(size,Math.round(size*.5),{minFilter:T.LinearFilter,magFilter:T.LinearFilter});target.texture.colorSpace=T.SRGBColorSpace;target.texture.repeat.x=-1;target.texture.offset.x=1;state.targets.push(target);state.cameras.push(new T.PerspectiveCamera(i===2?70:64,2,.05,Math.min(750,this.effectiveRenderDistance||530)));}}
      state.clock+=dt;if(state.clock<interval&&state.car===this.playerCar)return;state.clock=0;state.car=this.playerCar;const faces=[];this.playerCar.traverse(o=>{if(o.userData.liveMirror)faces.push(o);});faces.sort((a,b)=>(b.userData.mirrorSide??-2)-(a.userData.mirrorSide??-2));
      const oldTarget=this.renderer.getRenderTarget(),auto=this.renderer.shadowMap.autoUpdate,skyPosition=this.sky.position.clone();this.renderer.shadowMap.autoUpdate=false;const hidden=[];this.scene.traverse(o=>{if(o.userData.liveMirror){hidden.push([o,o.visible]);o.visible=false;}});
      try{this.playerCar.updateWorldMatrix(true,true);for(let i=0;i<faces.length&&i<3;i++){const face=faces[i];let detached=false;for(let n=face;n;n=n.parent)if(n.userData.driveDetached)detached=true;if(detached)continue;const target=state.targets[i],camera=state.cameras[i];if(target.width!==size)target.setSize(size,Math.round(size*.5));face.material.map=target.texture;face.material.needsUpdate=true;const q=this.playerCar.getWorldQuaternion(new T.Quaternion()),position=face.getWorldPosition(new T.Vector3()),side=face.userData.mirrorSide||0,forward=new T.Vector3(side*.25,.02,-1).applyQuaternion(q).normalize(),up=new T.Vector3(0,1,0).applyQuaternion(q);camera.position.copy(position).addScaledVector(forward,.045);camera.up.copy(up);camera.lookAt(position.clone().addScaledVector(forward,30));camera.far=Math.min(750,this.effectiveRenderDistance||530);camera.updateProjectionMatrix();this.sky.position.copy(camera.position);this.renderer.setRenderTarget(target);this.renderWorld?this.renderWorld(camera):this.renderer.render(this.scene,camera);state.frames++;}}
      finally{hidden.forEach(([o,visible])=>o.visible=visible);this.sky.position.copy(skyPosition);this.renderer.shadowMap.autoUpdate=auto;this.renderer.setRenderTarget(oldTarget);}
      this.mirrorStats={views:faces.length,frames:state.frames,size,refreshHz:Math.round(1/interval),source:'live scene cameras'};
    }

    setCar(config,color,preserveVisualState=false){
      const id=String(config&&(config.id||config.key||config.type)||'compact').toLowerCase(),kind=id==='f1'||VehicleModels?.profiles[id]?id:id.includes('apex')?'apex':id.includes('vektor')?'vektor':'compact',old=this.playerCar;
      this.playerConfig=config;this.playerColor=color;this.modelDetailLevel=modelGeometry.resolve(this.settings.graphicsValues,this.settings.quality);
      const key=[kind,this.modelDetailLevel,config.equipped?.wheels||'',config.equipped?.spoilers||''].join('/'),cache=this.carCache;
      this.playerCar=!preserveVisualState&&cache?.get(key)||createCar(kind,color||config?.paint?.baseColor||'#b9543d',true,config,this.modelDetailLevel);
      if(old&&old!==this.playerCar){if(preserveVisualState)this.transferModelState(old,this.playerCar);this.scene.remove(old);if(!cache||![...cache.values()].includes(old))disposeModel(old);}
      if(cache){const previous=cache.get(key);if(previous&&previous!==this.playerCar){previous.removeFromParent();disposeModel(previous);}cache.set(key,this.playerCar);while(cache.size>40){const oldest=[...cache.keys()].find(k=>k!==key&&!cache.get(k).parent);if(!oldest)break;disposeModel(cache.get(oldest));cache.delete(oldest);}}
      if(!preserveVisualState){this.playerCar.traverse(o=>{if(o.userData.driveDetached){o.userData.driveDetached=false;o.visible=true;}});this.playerCar.userData.breakState=null;if(this.playerCar.userData.charredFrame){this.playerCar.userData.charredFrame.removeFromParent();delete this.playerCar.userData.charredFrame;}applyCarDamage(this.playerCar,{});this.playerCar.visible=true;VehicleModels?.fitPaint(this.playerCar,config.paint||{baseColor:color,strokes:[]});}
      modelQuality(this.playerCar,qualityRanks[this.settings.graphicsValues?.detail||this.settings.quality]??3);this.scene.add(this.playerCar);
      setUnderbodyLights(this.playerCar,config.underbody??window.PlatdoPremiumDrive?.legacyUnderbody());
      const interior=this.playerCar.userData.interior;this.cockpit=interior.root;this.steeringWheel=interior.steeringWheel;this.instrumentNeedles=interior.needles;this.dialTextures=interior.dialTextures;this.dialMaterial=interior.dialMaterial;this.cockpitCracks=this.playerCar.userData.damageVisual.crackMeshes.find(c=>c.zone==='front')?.mesh||null;this.driverEyeAnchor=interior.driverEyeAnchor;if(!preserveVisualState)this.cameraMode='';this.setCameraLook(this.cameraLook?.yaw||0,this.cameraLook?.pitch||0);this.carKind=kind;this.carColor=color;
    }
    transferModelState(old,next){
      const detached=new Set();old.traverse(o=>{if(o.userData.driveDetached&&o.userData.breakawayPart)detached.add(o.userData.breakawayPart);});
      next.position.copy(old.position);next.quaternion.copy(old.quaternion);next.visible=old.visible;next.userData.breakState=old.userData.breakState;
      for(let i=0;i<(next.userData.occupants||[]).length;i++){const previous=old.userData.occupants?.[i],o=next.userData.occupants[i];if(!previous)continue;for(const key of['damage','lastImpact','ejected','injury','pitch','roll','vPitch','vRoll'])o[key]=previous[key];o.wound.visible=previous.wound.visible;o.root.visible=previous.root.visible;}
      if(old.userData.simulationBody)this.updateCar(next,old.userData.simulationBody,0);
      next.traverse(o=>{if(detached.has(o.userData.breakawayPart)){o.userData.driveDetached=true;o.visible=false;}});
      if(old.userData.breakState?.exploded){next.userData.body.traverse(o=>{if(o.isMesh||o.isLine){o.userData.driveDetached=true;o.visible=false;}});for(const w of next.userData.wheels){w.pivot.userData.driveDetached=true;w.pivot.visible=false;}next.userData.contact.visible=false;}
      if(old.userData.charredFrame){next.userData.charredFrame=old.userData.charredFrame;next.add(old.userData.charredFrame);}
    }
    setModelDetail(level){
      if(this.modelDetailLevel===level)return;this.modelDetailLevel=level;
      if(this.carCache){for(const [key,model]of this.carCache)if(model!==this.playerCar){model.removeFromParent();disposeModel(model);this.carCache.delete(key);}if(this.playerCar)for(const [key,model]of this.carCache)if(model===this.playerCar)this.carCache.delete(key);}
      if(this.playerCar)this.setCar({...this.playerConfig,paint:this.playerCar.userData.paintState||this.playerConfig?.paint},this.playerColor,true);
      for(const [id,old]of this.trafficMeshes){const d=old.userData,next=createCar(d.kind,d.sourceColor,false,d.sourceDimensions,level);this.transferModelState(old,next);modelQuality(next,qualityRanks[this.settings.graphicsValues?.detail||this.settings.quality]??2);this.scene.add(next);this.scene.remove(old);disposeModel(old);this.trafficMeshes.set(id,next);}
    }
    setPlayerCar(config,color){this.setCar(config,color);}
    setPaint(paint){if(this.playerCar&&VehicleModels)VehicleModels.fitPaint(this.playerCar,paint);}
    pickPaint(clientX,clientY){
      if(!this.playerCar)return null;const rect=this.canvas.getBoundingClientRect();if(clientX<rect.left||clientX>rect.right||clientY<rect.top||clientY>rect.bottom)return null;
      this.playerCar.updateWorldMatrix(true,true);this.camera.updateMatrixWorld(true);this.paintRaycaster||=new T.Raycaster();this.paintRaycaster.setFromCamera(new T.Vector2((clientX-rect.left)/rect.width*2-1,1-(clientY-rect.top)/rect.height*2),this.camera);
      const candidates=[];this.playerCar.traverse(o=>{if(!o.isMesh||o===this.playerCar.userData.contact)return;for(let a=o;a;a=a.parent)if(!a.visible)return;if(o.material?.opacity===0)return;candidates.push(o);});
      const hit=this.paintRaycaster.intersectObjects(candidates,false)[0];if(!hit||!hit.object.userData.paintSurface||!hit.uv)return null;
      return {surface:hit.object.userData.paintSurface,u:clamp(hit.uv.x,0,1),v:clamp(hit.uv.y,0,1)};
    }
    updateCockpitTelemetry(player,dt){
      const interior=this.playerCar.userData.interior,mph=this.settings.units!=='kmh',speed=Math.abs(player.speed||0)*(mph?2.2369362921:3.6),rpm=Number.isFinite(player.engineRPM)?player.engineRPM:0;
      // Dials share the HUD's real speed/engine telemetry; smoothing never feeds physics.
      const alpha=dt>0?1-Math.exp(-18*dt):1;interior.displaySpeed=mix(interior.displaySpeed??speed,speed,alpha);interior.displayRPM=mix(interior.displayRPM??rpm,rpm,alpha);
      if(this.instrumentNeedles.length)for(const [i,value]of [[0,interior.displaySpeed/(mph?160:240)],[1,interior.displayRPM/8000]])this.instrumentNeedles[i].rotation.z=-(.76+clamp(value,0,1)*1.48)*Math.PI-Math.PI/2;
      const desiredTexture=this.dialTextures[mph?'mph':'kmh'];if(this.dialMaterial&&this.dialMaterial.map!==desiredTexture){this.dialMaterial.map=desiredTexture;this.dialMaterial.needsUpdate=true;}
      const gear=(player.speed||0)<-.4?'R':Math.abs(player.speed||0)<.4?'N':String(player.gear||1),label=Math.round(speed)+' '+(mph?'MPH':'KM/H')+'  '+gear;
      if(interior.lastDigital!==label){const c=interior.digitalTexture.image.getContext('2d');c.fillStyle='#10201d';c.fillRect(0,0,256,80);c.fillStyle='#b8d4b6';c.font='bold 29px monospace';c.textAlign='center';c.fillText(label,128,52);interior.digitalTexture.needsUpdate=true;interior.lastDigital=label;}
    }
    setSettings(settings){Object.assign(this.settings,settings);const q=this.settings.quality,profile=window.DriveGraphicsProfiles?.[q],size=Math.min(profile?.shadow??(q==='low'||q==='potato'?0:q==='high'?2048:1024),this.renderer.capabilities.maxTextureSize||4096);this.renderer.shadowMap.enabled=size>0;if(size&&this.sun.shadow.mapSize.x!==size){this.sun.shadow.mapSize.set(size,size);if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null;}}
      this.scene.fog.near=profile?.near??(q==='low'?90:130);this.scene.fog.far=profile?.far??(q==='low'?390:q==='medium'?530:670);
      this.camera.fov=window.PlatdoGraphics?.projectFov(this.settings.fov||72)||Math.min(179,this.settings.fov||72);this.camera.updateProjectionMatrix();
      if(this.dialMaterial){this.dialMaterial.map=this.dialTextures[this.settings.units==='kmh'?'kmh':'mph'];this.dialMaterial.needsUpdate=true;}
      this.setModelDetail(modelGeometry.resolve(this.settings.graphicsValues,q));this.worldModels?.setModelDetail(this.modelDetailLevel);this.setVisualQuality(q);
    }
    resize(w,h){w=Math.max(1,Math.round(w));h=Math.max(1,Math.round(h));this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
    safeCamera(player,x,y,z){
      const start={x:player.x,y:(player.y||0)+1.1,z:player.z},safe={x,y,z};let limited=false;
      for(let i=1;i<=12;i++){const t=i/12,px=mix(start.x,x,t),py=mix(start.y,y,t),pz=mix(start.z,z,t),n=this.nearest(px,pz);let blocked=py<this.groundHeight(px,pz)+.24;
        const tunnel=this.route.map?.tunnel||{start:.72,end:.77},f=n.p.s/this.route.length,radius=this.route.halfWidth+2;if(!n.connector&&f>tunnel.start&&f<tunnel.end&&Math.abs(n.offset)<radius){const ceiling=n.p.y+1.45+Math.sqrt(Math.max(0,1-(n.offset/radius)**2))*6.7;if(py>ceiling-.3)blocked=true;}
        for(const o of this.route.obstacles||[]){const dx=px-o.x,dz=pz-o.z,c=Math.cos(o.yaw||0),s=Math.sin(o.yaw||0);if(Math.abs(dx*c-dz*s)<o.width*.5+.3&&Math.abs(dx*s+dz*c)<o.length*.5+.3&&py<(o.y||n.p.y)+(o.height||3)+.3){blocked=true;break;}}
        if(blocked){const safeT=Math.max(.12,(i-1)/12);safe.x=mix(start.x,x,safeT);safe.y=mix(start.y,y,safeT);safe.z=mix(start.z,z,safeT);limited=true;break;}
      }safe.y=Math.max(safe.y,this.groundHeight(safe.x,safe.z)+.26);this.cameraClipStats={limited};return safe;
    }
    updateCar(mesh,p,dt){const d=mesh.userData;d.simulationBody=p;
      const light=d.underbodyGlow;
      if(light?.visible&&light.userData.breathing)light.material.opacity=light.userData.intensity*(.82+Math.sin(this.time*.7)*.18);
      deformCar(mesh,p);for(const lamp of d.lamps||[]){const material=lamp.mesh.material,zone=lamp.front?'front':'rear',damage=clamp((p.damage?.[zone]||0)*.5+(p.damage?.[zone+(lamp.side>0?'Right':'Left')]||0)*.7,0,1);material.emissive.set(lamp.front?'#efe4ca':lamp.reverse?'#ddd9c7':'#dc160b');material.emissiveIntensity=(lamp.front?.08:lamp.reverse?(p.gear<0||p.speed<-.5?1.1:0):(p.brake>.08&&p.speed>-.5?1.45:.08))*(1-damage);}mesh.position.set(p.x,p.y||0,p.z);mesh.rotation.set(p.terrainPitch||0,p.yaw||0,p.terrainRoll||0,'YXZ');const kick=p.suspensionKick||{};if(d.body){d.body.rotation.z=clamp((p.roll||0)+(kick.roll||0),-.15,.15);d.body.rotation.x=clamp((p.pitch||0)+(kick.pitch||0),-.14,.14);d.body.position.y=clamp(kick.heave||0,-.045,.065);}for(const w of d.wheels){const damage=p.damage&&p.damage.wheels?clamp(p.damage.wheels[w.damageIndex]||0,0,1):0;w.pivot.position.copy(w.basePosition);w.pivot.position.x-=w.side*damage*.045;w.pivot.position.z+=damage*(w.front?-.055:.04);w.pivot.rotation.y=(w.front?(p.steer||0):0)+w.side*damage*.10;w.pivot.rotation.z=w.side*damage*.085;w.spin.rotation.x=Number.isFinite(p.wheelSpin)?p.wheelSpin*(d.simulationWheelRadius||.34)/(w.pivot.userData.wheelRadius||.34):0;}this.updateOccupants(mesh,p,dt); }
    render(sim,cameraMode,dt,view='playing'){
      dt=Math.min(Math.max(dt||0,0),.075);this.time+=dt;this.activeSim=sim;if(this.occupantFX&&this.occupantFX.run!==sim)this.updateOccupantEffects(sim,0,view==='playing');const playing=view==='playing',preview=this.route.at(18),input=sim&&(sim.renderPlayer||sim.player);
      const previewLane=this.route.laneAt&&this.route.forwardLanes?.length?this.route.laneAt(18,this.route.forwardLanes[0]):{x:preview.x-preview.nx*2,y:preview.y,z:preview.z-preview.nz*2,yaw:preview.yaw};const player=playing&&input?input:{...previewLane,speed:0,steer:0};
      this.updateCar(this.playerCar,player,dt);this.playerCar.userData.body.visible=true;if(this.playerCar.userData.displayDriver)this.playerCar.userData.displayDriver.visible=!playing;for(const w of this.playerCar.userData.wheels)w.pivot.visible=!w.pivot.userData.driveDetached;this.cockpit.visible=true;this.steeringWheel.rotation.z=-(player.steer||0)*(this.steeringWheel.userData.visualRatio||6);this.updateCockpitTelemetry(player,dt);this.updateGPS(sim,player,dt);this.updateTireEffects(sim,player,dt,playing);this.updateSmokePreview?.(view);
      
      const changed=this.cameraMode!==cameraMode||this.lastView!==view;this.cameraMode=cameraMode;this.lastView=view;
      const yaw=player.yaw||0,sin=Math.sin(yaw),cos=Math.cos(yaw),speed=Math.abs(player.speed||0),motion=this.settings.reducedMotion?0:1,shake=motion*clamp(Number(this.settings.cameraShake)||0,0,1);
      const look=this.cameraLook||{yaw:0,pitch:0},heading=yaw+look.yaw;
      let cx,cy,cz,tx,tz,ty;
      if(!playing){const angle=yaw+(view==='garage'?(this.inspection?.yaw??(.3+this.time*.13*motion)):.63+Math.sin(this.time*.09)*.12*motion);const distance=view==='garage'?clamp(this.inspection?.distance||6.2,3.7,9)*(this.camera.aspect<.9?1.35:1):6.8;cx=player.x+Math.sin(angle)*distance;cz=player.z+Math.cos(angle)*distance;cy=player.y+(view==='garage'?clamp(this.inspection?.elevation??2.6,.7,7):2.6);tx=player.x;tz=player.z;ty=player.y+this.playerCar.userData.height*.48;}
      else if(cameraMode==='cockpit'){this.playerCar.updateWorldMatrix(true,true);const eye=this.driverEyeAnchor.getWorldPosition(new T.Vector3()),q=this.driverEyeAnchor.getWorldQuaternion(new T.Quaternion()),look=this.cockpitLook||{yaw:0,pitch:0},localLook=new T.Quaternion().setFromEuler(new T.Euler(look.pitch,look.yaw,0,'YXZ'));q.multiply(localLook);const forward=new T.Vector3(0,0,1).applyQuaternion(q),up=new T.Vector3(0,1,0).applyQuaternion(q);eye.addScaledVector(up,Math.sin(this.time*12)*Math.min(speed/100,1)*.003*shake);cx=eye.x;cy=eye.y;cz=eye.z;tx=cx+forward.x*20;ty=cy+forward.y*20;tz=cz+forward.z*20;this.camera.up.copy(up);}
      else if(cameraMode==='hood'){cx=player.x+sin*.57;cz=player.z+cos*.57;cy=player.y+this.playerCar.userData.belt+.31;tx=cx+Math.sin(heading)*Math.cos(look.pitch)*60;tz=cz+Math.cos(heading)*Math.cos(look.pitch)*60;ty=cy-.15+Math.sin(look.pitch)*60;}
      else {const distance=player.destroyed?9.8:clamp(this.settings.chaseDistance||6.2,2.5,18)+Math.min(speed*.014,.8),anticipation=clamp((player.yawRate||0)*.12,-.09,.09),kick=player.suspensionKick||{};const height=(player.destroyed?4.6:clamp(this.settings.chaseHeight||3.05,1.5,5))+(kick.heave||0)*shake*.3,baseElevation=Math.atan2(height-1.05,distance),radius=Math.hypot(distance,height-1.05),elevation=clamp(baseElevation-look.pitch,-.15,1.25),horizontal=radius*Math.cos(elevation);cx=player.x-Math.sin(heading)*horizontal;cz=player.z-Math.cos(heading)*horizontal;cy=player.y+1.05+radius*Math.sin(elevation);const lookAhead=this.carKind==='f1'?8+clamp(speed*.13,0,21):8;tx=player.x+Math.sin(heading+anticipation)*lookAhead;tz=player.z+Math.cos(heading+anticipation)*lookAhead;ty=player.y+1.05;}
      const damping=changed?1:playing&&cameraMode==='chase'?1-Math.exp(-dt*(motion?10:24)):1;
      this.vector.set(cx,cy,cz);this.camera.position.lerp(this.vector,damping);if(playing&&cameraMode==='chase'){const safe=this.safeCamera(player,this.camera.position.x,this.camera.position.y,this.camera.position.z);this.camera.position.set(safe.x,safe.y,safe.z);}this.vector.set(tx,ty,tz);if(changed)this.target.copy(this.vector);else this.target.lerp(this.vector,playing&&cameraMode==='chase'?1-Math.exp(-dt*18):1);
      if(!playing||cameraMode!=='cockpit')this.camera.up.set(0,1,0);this.camera.lookAt(this.target);const rawFov=(this.settings.fov||72)+(playing&&cameraMode!=='hood'&&this.settings.speedFov!==false?Math.min(speed*.10,6)*motion:0),fov=window.PlatdoGraphics?.projectFov?.(rawFov)||Math.min(179,rawFov);if(Math.abs(this.camera.fov-fov)>.05){this.camera.fov=mix(this.camera.fov,fov,changed?1:1-Math.exp(-dt*5));this.camera.updateProjectionMatrix();}
      if(view==='garage'&&!this.inspection?.embedded){const w=this.renderer.domElement.width,h=this.renderer.domElement.height;if(this.camera.aspect<.9)this.camera.setViewOffset(w,h,0,h*.15,w,h);else this.camera.setViewOffset(w,h,-w*.20,0,w,h);}else if(this.camera.view?.enabled)this.camera.clearViewOffset();
      this.sky.position.copy(this.camera.position);/* V2: the light follows the clock (see look.js); the old fixed direction is the fallback. */{const offset=this.v2SunOffset;if(offset)this.sun.position.set(player.x+offset.x,player.y+offset.y,player.z+offset.z);else this.sun.position.set(player.x-130,player.y+190,player.z+80);}this.sun.target.position.set(player.x,player.y,player.z);this.sun.target.updateMatrixWorld();
      this.updateWorldLighting?.(sim,player,playing,cameraMode);this.updateLooseBlockers?.(sim,playing);
      if(this.tunnelLight){const t=this.route.map?.tunnel,at=this.nearest(player.x,player.z),s=at.p.s,edge=20,amount=playing&&t&&!at.connector?smooth(t.start*this.route.length-edge,t.start*this.route.length+edge,s)*(1-smooth(t.end*this.route.length-edge,t.end*this.route.length+edge,s)):0;this.tunnelLight.position.set(player.x,player.y+4.3,player.z);this.tunnelLight.intensity=amount*32;for(const light of this.playerCar.userData.lamps||[])if(light.front)light.mesh.material.emissiveIntensity=Math.max(light.mesh.material.emissiveIntensity,.08+amount*.3);}
      if(this.trafficRun!==sim){this.trafficRun=sim;for(const m of this.trafficMeshes.values()){this.scene.remove(m);disposeModel(m);}this.trafficMeshes.clear();}
      this.prepareActorViews?.(playing,cameraMode);const traffic=playing&&sim&&sim.traffic?sim.traffic:[],alive=new Set();this.visibilityStats={total:traffic.length,visible:0,constructed:this.actorBuilds||0,updated:0};
      for(const t of traffic){alive.add(t.id);const dist=(t.x-player.x)**2+(t.z-player.z)**2;let m=this.trafficMeshes.get(t.id);if(m&&t.id.startsWith('p:')&&(m.userData.kind!==t.type||m.userData.onlinePaint!==t.onlinePaint)){this.scene.remove(m);disposeModel(m);this.trafficMeshes.delete(t.id);m=null;}const visible=dist<(this.effectiveRenderDistance||570)**2&&(!this.actorVisible||this.actorVisible(t));if(!m&&!visible)continue;if(!m){const palette=['#a2aba4','#4c7376','#b38d63','#77524b','#d4ccb8','#56738c','#8e9c70'];m=createCar(t.type||'compact',t.onlinePaint||palette[(t.colorIndex||0)%palette.length],false,t,this.modelDetailLevel);m.userData.onlinePaint=t.onlinePaint;this.trafficMeshes.set(t.id,m);this.actorBuilds=(this.actorBuilds||0)+1;modelQuality(m,qualityRanks[this.settings.graphicsValues?.detail||this.settings.quality]??2);this.scene.add(m);}m.visible=visible;if(m.visible){this.visibilityStats.visible++;this.visibilityStats.updated++;this.updateCar(m,t,dt);const rank=qualityRanks[this.settings.graphicsValues?.detail||this.settings.quality]??2,lod=this.actorDetail?this.actorDetail(t,dist,rank,m):(dist>170**2?0:dist>75**2?Math.min(rank,1):rank);if(m.userData.lastLOD!==lod){modelQuality(m,lod);m.userData.lastLOD=lod;}m.userData.interior.root.visible=dist<35**2&&rank>=2;}}
      for(const [id,m] of this.trafficMeshes)if(!alive.has(id)){m.visible=false;if(playing){this.scene.remove(m);disposeModel(m);this.trafficMeshes.delete(id);}}
      this.updateOccupantEffects(sim,dt,playing);this.updateRails?.(sim,playing);this.updateBreakup?.(sim,player,dt,playing);this.updateDamageEffects(sim,player,dt,playing,cameraMode);this.updateCollisionEffects(sim,player,dt,playing);
      this.checkpoint.visible=false;if(playing&&sim&&sim.mode==='trial'&&sim.checkpoints&&sim.checkpoints.length&&sim.checkpointIndex<sim.checkpoints.length){const s=sim.checkpoints[sim.checkpointIndex],p=this.route.at(typeof s==='number'?s:s.s);this.checkpoint.position.set(p.x,p.y,p.z);this.checkpoint.rotation.y=p.yaw;this.checkpoint.visible=true;}
      this.updateLiveMirrors(dt,playing,cameraMode);const driver=this.playerCar.userData.occupants?.[0],headVisible=driver?.head.visible;if(driver&&!driver.ejected)driver.head.visible=!(playing&&cameraMode==='cockpit');try{this.renderWorld?this.renderWorld(this.camera):this.renderer.render(this.scene,this.camera);}finally{if(driver)driver.head.visible=headVisible;}
    }
    dispose(){this.smokeTrail?.dispose();if(this.liveMirrors){this.liveMirrors.targets.forEach(t=>t.dispose());this.liveMirrors=null;}if(this.occupantFX){for(const r of this.occupantFX.ragdolls)this.disposeOccupantEffect(r);this.occupantFX.ragdolls=[];}const geometries=new Set(),materials=new Set(),textures=new Set(Object.values(this.dialTextures||{}));this.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of(Array.isArray(o.material)?o.material:[o.material]))materials.add(m);});for(const m of materials){for(const key of['map','normalMap','roughnessMap'])if(m[key])textures.add(m[key]);m.dispose();}geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());if(this.ownsRenderer)this.renderer.dispose();}
  }
  DriveScene.NetworkSkids=class {
    constructor(scene){
      this.mesh=new T.InstancedMesh(new T.BoxGeometry(.16,.006,1),new T.MeshBasicMaterial({color:0x171b18,transparent:true,opacity:.46,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),512);
      this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);
      this.previous=new Map();this.dummy=new T.Object3D();this.cursor=0;
    }
    draw(cars){
      const alive=new Set();
      for(const car of cars){
        const id=car.id,drifting=car.driftIntensity>.10&&Math.abs(car.speed)>4&&!car.offRoad;
        if(!drifting)continue;alive.add(id);
        const s=Math.sin(car.yaw),c=Math.cos(car.yaw),half=(car.width||1.85)*.41,rear=(car.length||4.3)*.31;
        const pair=[-half,half].map(dx=>({x:car.x+c*dx-s*rear,y:car.y+.026,z:car.z-s*dx-c*rear}));
        const prev=this.previous.get(id);
        if(prev&&Math.hypot(pair[0].x-prev[0].x,pair[0].z-prev[0].z)<.28)continue;
        this.previous.set(id,pair);if(!prev)continue;
        for(let i=0;i<2;i++){
          const a=prev[i],b=pair[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
          if(length>4||length<.02)continue;
          this.dummy.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);
          this.dummy.rotation.set(-Math.atan2(b.y-a.y,length),Math.atan2(dx,dz),0,'YXZ');
          this.dummy.scale.set(1,1,length+.03);this.dummy.updateMatrix();
          this.mesh.setMatrixAt(this.cursor++%512,this.dummy.matrix);
          this.mesh.count=Math.min(this.cursor,512);this.mesh.instanceMatrix.needsUpdate=true;
        }
      }
      for(const key of this.previous.keys())if(!alive.has(key))this.previous.delete(key);
    }
    dispose(){this.mesh.removeFromParent();this.mesh.geometry.dispose();this.mesh.material.dispose();this.mesh.dispose();}
  };
  DriveScene.deformCar=deformCar;DriveScene.createCar=createCar;DriveScene.disposeCar=disposeModel;DriveScene.createOccupant=createOccupant;DriveScene.disposeOccupant=rig=>disposeModel(rig.root);window.DriveScene=DriveScene;
})();

