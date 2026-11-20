
/* Original procedural City fleet. Curved lofts, real cabin glazing and articulated
 * parts. +Z forward; no simulation or external assets. Three.js is locally bundled. */
(function(root){'use strict';
  const T=root.THREE,V=root.CityVehicles,FX=root.PlatdoVehicleVFX||(typeof require==='function'?require('../../shared/vehicle-vfx.js'):null);if(!T||!V)throw new Error('City vehicles require local THREE and CityVehicles');
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // Build-time tessellation only. Physical dimensions and articulated parts are unchanged.
  let buildDetail=5;
  const steps=(n,min=3)=>Math.max(min,Math.round(n*[0,.25,.40,.60,.80,1][buildDetail]));
  function detailGeometry(g){if(buildDetail===5)return g;const p=g.parameters||{};let replacement;
    if(g.type==='SphereGeometry')replacement=new T.SphereGeometry(p.radius,steps(p.widthSegments,6),steps(p.heightSegments,4),p.phiStart,p.phiLength,p.thetaStart,p.thetaLength);
    else if(g.type==='CylinderGeometry')replacement=new T.CylinderGeometry(p.radiusTop,p.radiusBottom,p.height,steps(p.radialSegments,5),p.heightSegments,p.openEnded,p.thetaStart,p.thetaLength);
    else if(g.type==='TorusGeometry')replacement=new T.TorusGeometry(p.radius,p.tube,steps(p.radialSegments,3),steps(p.tubularSegments,8),p.arc);
    else if(g.type==='CircleGeometry')replacement=new T.CircleGeometry(p.radius,steps(p.segments,6),p.thetaStart,p.thetaLength);
    else if(g.type==='RingGeometry')replacement=new T.RingGeometry(p.innerRadius,p.outerRadius,steps(p.thetaSegments,8),p.phiSegments,p.thetaStart,p.thetaLength);
    if(replacement){g.dispose();return replacement;}return g;
  }
  const material=(color,roughness=.55,metalness=0,extra={})=>new T.MeshStandardMaterial({color,roughness,metalness,...extra});
  function mesh(g,m,parent,x=0,y=0,z=0){const o=new T.Mesh(detailGeometry(g),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function box(p,m,x,y,z,w,h,l,r=.045){
    if(r<=0)return mesh(new T.BoxGeometry(w,h,l),m,p,x,y,z);
    const s=new T.Shape(),a=-w/2,b=-h/2,rr=Math.min(r,w*.22,h*.22);s.moveTo(a+rr,b);s.lineTo(a+w-rr,b);s.quadraticCurveTo(a+w,b,a+w,b+rr);s.lineTo(a+w,b+h-rr);s.quadraticCurveTo(a+w,b+h,a+w-rr,b+h);s.lineTo(a+rr,b+h);s.quadraticCurveTo(a,b+h,a,b+h-rr);s.lineTo(a,b+rr);s.quadraticCurveTo(a,b,a+rr,b);const g=new T.ExtrudeGeometry(s,{depth:l-rr*2,bevelEnabled:true,bevelSegments:buildDetail<4?1:2,steps:1,bevelSize:rr,bevelThickness:rr,curveSegments:[0,1,2,2,3,4][buildDetail]});g.translate(0,0,-(l-rr*2)/2);return mesh(g,m,p,x,y,z);
  }
  function tube(p,m,a,b,r=.025){const va=new T.Vector3(...a),vb=new T.Vector3(...b),dir=vb.clone().sub(va),o=mesh(new T.CylinderGeometry(r,r,dir.length(),8),m,p);o.position.copy(va.add(vb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return o;}
  function panel(p,m,points){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setIndex(points.length===4?[0,1,2,0,2,3]:[0,1,2]);g.computeVertexNormals();return mesh(g,m,p);}
  // Longitudinal rings give cars, hulls, fuselages and nacelles their silhouettes.
  // ring: [z, halfWidth, bottom, shoulder, crown]; 12 points surround each section.
  function loft(p,m,rings){const smooth=[];for(let n=0;n<rings.length-1;n++){const a=rings[Math.max(0,n-1)],b=rings[n],c=rings[n+1],d=rings[Math.min(rings.length-1,n+2)];for(let k=0,divisions=[0,1,2,2,3,4][buildDetail];k<divisions;k++){const t=k/divisions,row=[b[0]+(c[0]-b[0])*t];for(let j=1;j<5;j++)row.push(.5*((2*b[j])+(-a[j]+c[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t*t+(-a[j]+3*b[j]-3*c[j]+d[j])*t*t*t));row[1]=Math.max(.005,row[1]);smooth.push(row);}}smooth.push(rings[rings.length-1]);rings=smooth;const verts=[],idx=[];for(const r of rings){const[z,w,b,s,t]=r;verts.push(0,b,z,-w*.74,b+.025,z,-w,b+(s-b)*.32,z,-w,s,z,-w*.83,t-.025,z,-w*.45,t,z,0,t+.01,z,w*.45,t,z,w*.83,t-.025,z,w,s,z,w,b+(s-b)*.32,z,w*.74,b+.025,z);}for(let i=0;i<rings.length-1;i++)for(let j=0;j<12;j++){const a=i*12+j,b=i*12+(j+1)%12,c=(i+1)*12+(j+1)%12,d=(i+1)*12+j;idx.push(a,d,b,b,d,c);}for(let j=1;j<11;j++){idx.push(0,j,j+1);const o=(rings.length-1)*12;idx.push(o,o+j+1,o+j);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex(idx);g.computeVertexNormals();return mesh(g,m,p);}
  function sphere(p,m,x,y,z,sx,sy,sz){const o=mesh(new T.SphereGeometry(1,18,12),m,p,x,y,z);o.scale.set(sx,sy,sz);return o;}
  // Keep authored assemblies intact through batching so a lost mirror, bumper,
  // door or wheel really leaves a matching hole in the vehicle silhouette.
  function breakaway(parts,object,id,health){object.userData.cityBreakaway={id,health};parts.breakaway.push({object,id,health});return object;}
  function mergeStatic(g,keepOriginal=false){g.updateMatrixWorld(true);const inverse=new T.Matrix4().copy(g.matrixWorld).invert();const buckets=new Map();g.traverseVisible(o=>{if(o.isMesh){let b=buckets.get(o.material);if(!b)buckets.set(o.material,b=[]);b.push(o);}});const merged=new T.Group(),matrix=new T.Matrix4(),normalMatrix=new T.Matrix3(),v=new T.Vector3();for(const[mat,objects]of buckets){const pos=[],norm=[],uv=[],index=[];for(const o of objects){const geo=o.geometry,p=geo.attributes.position,n=geo.attributes.normal,t=geo.attributes.uv,base=pos.length/3;matrix.multiplyMatrices(inverse,o.matrixWorld);normalMatrix.getNormalMatrix(matrix);const flip=matrix.determinant()<0;for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k).applyMatrix4(matrix);pos.push(v.x,v.y,v.z);if(n){v.fromBufferAttribute(n,k).applyMatrix3(normalMatrix).normalize();norm.push(v.x,v.y,v.z);}else norm.push(0,1,0);uv.push(t?t.getX(k):0,t?t.getY(k):0);}const count=geo.index?geo.index.count:p.count;for(let k=0;k<count;k+=3){const a=base+(geo.index?geo.index.getX(k):k),b=base+(geo.index?geo.index.getX(k+1):k+1),c=base+(geo.index?geo.index.getX(k+2):k+2);if(flip)index.push(a,c,b);else index.push(a,b,c);}}const geom=new T.BufferGeometry();geom.setAttribute('position',new T.Float32BufferAttribute(pos,3));geom.setAttribute('normal',new T.Float32BufferAttribute(norm,3));geom.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geom.setIndex(index);mesh(geom,mat,merged);}if(!keepOriginal)g.traverse(o=>{if(o.isMesh)o.geometry.dispose();});return merged;}
  // V2: with sharp sky reflections enabled, paint gets a real clear-coat layer over the colour.
  const paint=color=>root.PlatdoV2?.clearcoat?new T.MeshPhysicalMaterial({color,roughness:.36,metalness:.4,clearcoat:1,clearcoatRoughness:.055}):material(color,.32,.42);
  function palette(d,c){return{rim:material(c.wheelColor??0xb9c6c8,.26,.8),body:paint(c.paint===undefined?d.color:c.paint),trim:material(c.trim===1?0xb8a66d:0x29323b,.43,.50),metal:material(0xb9c6c8,.26,.80),dark:material(0x1c2630,.76),rubber:material(0x141b20,.94),seat:material(c.trim===2?0xa26242:0x38454d,.9),glass:material(0x82abb8,.14,.18,{transparent:true,opacity:.32,depthWrite:false,side:T.DoubleSide}),white:material(0xe3e8df,.6),head:material(0xffe8b6,.24,0,{emissive:0xffd694,emissiveIntensity:.1}),tail:material(0xae2628,.28,0,{emissive:0xee251d,emissiveIntensity:.12}),reverse:material(0xdce5d6,.35,0,{emissive:0xdce5d6,emissiveIntensity:.02}),blue:material(0x226fd1,.25,0,{emissive:0x227aff,emissiveIntensity:.45}),red:material(0xd43b32,.25,0,{emissive:0xff2d24,emissiveIntensity:.35}),orange:material(0xf2b243,.4,0,{emissive:0xee9a19,emissiveIntensity:.08}),wake:material(0xc2eeee,.6,0,{transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide})};}
  function wheel(parent,parts,m,x,y,z,r,front,style=0,width=.19){const pivot=new T.Group();pivot.position.set(x,y,z);parent.add(pivot);const spin=new T.Group();pivot.add(spin);const tire=mesh(new T.TorusGeometry(r*.76,r*.24,8,22),m.rubber,spin);tire.rotation.y=Math.PI/2;tire.scale.z=width/(r*.48);const rim=mesh(new T.CylinderGeometry(r*.55,r*.55,width*.96,16),style===1?m.dark:m.rim,spin);rim.rotation.z=Math.PI/2;for(let k=0;k<(style===2?8:5);k++){const spoke=box(spin,m.trim,0,0,0,width+.02,r*.08,r*1.06,.008);spoke.rotation.x=k*Math.PI/(style===2?8:5);}for(const side of[-1,1]){const disk=mesh(new T.CylinderGeometry(r*.60,r*.60,.013,20),m.metal,spin,side*width*.37,0,0);disk.rotation.z=Math.PI/2;const hub=mesh(new T.CylinderGeometry(r*.16,r*.16,.026,12),m.trim,spin,side*width*.55,0,0);hub.rotation.z=Math.PI/2;for(let n=0;n<6;n++){const a=n*Math.PI/3;const hole=mesh(new T.CircleGeometry(r*.045,6),m.dark,spin,side*width*.395,Math.sin(a)*r*.44,Math.cos(a)*r*.44);hole.rotation.y=side*Math.PI/2;}}const mergedWheel=mergeStatic(spin);spin.clear();spin.add(...mergedWheel.children.slice());parts.wheels.push({pivot,spin,front,baseY:y});return pivot;}
  function seat(p,m,s){const a=s.position;box(p,m.seat,a.x,a.y-.075,a.z,.49,.14,.53,.055);const back=box(p,m.seat,a.x,a.y+.22,a.z-.24,.49,.55,.12,.055);back.rotation.x=-.12;box(p,m.seat,a.x,a.y+.44,a.z-.28,.32,.16,.14,.04);}
  function cockpit(p,d,m,parts,positions){const s=d.seats[0].position,w=d.bodyWidth||d.dimensions.width,boat=d.category==='boat';const z=s.z+.57,y=s.y+.18;box(p,m.dark,0,y,z,w*.79,.23,.29,.04);for(const x of [s.x-.17,s.x+.13]){const dial=mesh(new T.CircleGeometry(.105,20),m.trim,p,x,y+.025,z-.151);dial.rotation.y=Math.PI;const face=mesh(new T.CircleGeometry(.085,20),m.dark,p,x,y+.025,z-.156);face.rotation.y=Math.PI;for(let k=0;k<9;k++){const angle=-2.2+k*.55,tick=box(p,m.white,x+Math.sin(angle)*.079,y+.025+Math.cos(angle)*.079,z-.169,.006,.014,.004,0);tick.rotation.z=-angle;}const needle=new T.Group();needle.position.set(x,y+.025,z-.163);p.add(needle);box(needle,m.orange,0,.035,0,.009,.073,.006,.001);parts.needles.push(needle);}const pivot=new T.Group();pivot.position.set(s.x,s.y+.36,s.z+.29);pivot.rotation.x=-.36;p.add(pivot);mesh(new T.TorusGeometry(boat?.20:.18,.021,7,20),m.trim,pivot);tube(pivot,m.metal,[-.15,0,0],[.15,0,0],.017);tube(pivot,m.metal,[0,0,0],[0,-.16,0],.017);sphere(pivot,m.dark,0,0,0,.045,.045,.025);parts.steeringWheel=pivot;return{dashboardY:y,dashboardZ:z};}
  // Render-only construction pass, shared by every four-wheel silhouette. The
  // original shell, wheelbase, anchors, breakaway assemblies and handling stay intact.
  function fleetDetails(group,d,m,parts,open=false){
    const g=new T.Group();g.name='Furnished cabin and mechanical construction';group.add(g);
    const w=d.dimensions.width,l=d.dimensions.length,driver=d.seats[0].position,body=V.bodyProfile(d),front=l*.5,rear=-front,waist=body.waist,base=['offroad','suv','pickup'].includes(d.silhouette)?.42:.25;
    const inset=material(m.seat.color.clone().multiplyScalar(.62),.94),screen=material(0x163d4b,.35,0,{emissive:0x153e49,emissiveIntensity:.20}),seam=material(0xb6b7ab,.8);
    const features=['bolstered seats','console and shifter','vented dashboard','pedals','engine bay','suspension','brake calipers','exhaust plumbing'];
    for(const seatDef of d.seats){const a=seatDef.position;
      box(g,inset,a.x,a.y+.20,a.z-.168,.32,.39,.025,.008);box(g,inset,a.x,a.y+.003,a.z+.025,.31,.018,.35,.006);
      for(const side of[-1,1]){box(g,m.seat,a.x+side*.211,a.y+.13,a.z-.15,.067,.39,.17,.021);box(g,m.seat,a.x+side*.205,a.y-.012,a.z+.01,.075,.12,.42,.023);tube(g,m.metal,[a.x+side*.085,a.y+.38,a.z-.26],[a.x+side*.085,a.y+.47,a.z-.26],.009);box(g,m.dark,a.x+side*.275,a.y-.025,a.z-.01,.04,.09,.05,.008);box(g,m.red,a.x+side*.275,a.y+.023,a.z-.01,.028,.008,.029,0);}
      if(buildDetail>2)for(let n=0;n<5;n++){tube(g,seam,[a.x-.14,a.y+.06+n*.067,a.z-.148],[a.x+.14,a.y+.06+n*.067,a.z-.148],.0025);}
    }
    const dashZ=driver.z+.404,dashY=driver.y+.18;
    box(g,m.trim,0,driver.y-.15,driver.z+.01,.28,.24,.76,.022);
    tube(g,m.metal,[0,driver.y-.01,driver.z+.13],[0,driver.y+.13,driver.z+.08],.016);sphere(g,m.dark,0,driver.y+.14,driver.z+.08,.035,.028,.045);
    tube(g,m.dark,[.11,driver.y-.02,driver.z-.17],[.11,driver.y+.07,driver.z-.31],.014);
    for(const z of[driver.z-.15,driver.z-.30]){const cup=mesh(new T.RingGeometry(.033,.043,steps(16,7)),m.dark,g,-.05,driver.y-.02,z);cup.rotation.x=-Math.PI/2;}
    box(g,m.trim,0,dashY-.005,dashZ-.008,.28,.17,.018,.008);box(g,screen,0,dashY+.012,dashZ-.02,.23,.11,.007,.004);
    for(let i=0;i<3;i++){const knob=mesh(new T.CylinderGeometry(.018,.018,.012,steps(12,6)),m.metal,g,(i-1)*.07,dashY-.108,dashZ-.025);knob.rotation.x=Math.PI/2;}
    for(const x of[-w*.33,w*.33]){box(g,m.trim,x,dashY+.02,dashZ-.012,w*.135,.09,.025,.007);if(buildDetail>1)for(let j=0;j<4;j++)box(g,m.dark,x,dashY-.01+j*.018,dashZ-.027,w*.115,.008,.012,0);}
    if(buildDetail>2){for(let j=0;j<3;j++)box(g,m.white,-.07+j*.06,dashY+.01,dashZ-.025,.04,.008,.003,0);for(const x of[-.065,.065]){const pedal=box(g,m.rubber,driver.x+x,driver.y-.32,driver.z+.39,.055,.09,.017,.005);pedal.rotation.x=-.4;for(let j=0;j<4;j++)box(g,m.metal,driver.x+x,driver.y-.35+j*.018,driver.z+.377,.044,.005,.004,0);}}
    if(!open){features.push('door armrests and pockets','windshield seals and wipers','projector lamps');
      for(const door of parts.doors){const side=door.side,p=door.pivot,span=Math.min(1.22,body.cabinFront-body.cabinRear-.1),x=-side*.018;
        box(p,inset,x,waist-.20,-span*.49,.025,.30,span*.79,.009);box(p,m.seat,x-side*.035,waist-.16,-span*.47,.12,.065,span*.52,.012);box(p,m.dark,x-side*.024,waist-.33,-span*.52,.045,.055,span*.60,.008);box(p,m.metal,x-side*.035,waist-.02,-span*.29,.025,.035,.13,.004);
        if(buildDetail>2){for(let n=0;n<5;n++)box(p,m.dark,x-side*.04,waist-.24+n*.018,-span*.76,.012,.008,.13,0);box(p,m.dark,x-side*.098,waist-.119,-span*.36,.018,.008,.09,.002);}
      }
      const roofY=d.cabinRoofY||(['truck'].includes(d.silhouette)?1.89:(d.bodyHeight||d.dimensions.height)*.98),roofFront=body.cabinFront-body.windshieldInset;
      tube(g,m.rubber,[-w*.43,waist+.06,body.cabinFront],[w*.43,waist+.06,body.cabinFront],.017);
      for(const side of[-1,1]){tube(g,m.rubber,[side*w*.42,waist+.06,body.cabinFront],[side*body.roofWidth,roofY-.04,roofFront],.014);tube(g,m.dark,[side*w*.22,waist+.07,body.cabinFront+.01],[side*w*.08,waist+.17,body.cabinFront-.09],.009);tube(g,m.rubber,[side*w*.08,waist+.17,body.cabinFront-.09],[side*w*.32,waist+.19,body.cabinFront-.11],.012);}
      for(const side of[-1,1]){const lamp=parts.breakaway.find(a=>a.id==='headlight-'+(side<0?'left':'right'))?.object;if(lamp){const radius=Math.min(.045,lamp.geometry.parameters?.height*.3||.035);for(const offset of[-.065,.065]){const ring=mesh(new T.TorusGeometry(radius,.008,steps(7,4),steps(18,8)),m.metal,lamp,offset,0,.025);mesh(new T.CircleGeometry(radius*.75,steps(16,7)),m.head,lamp,offset,0,.027);}}
        if(buildDetail>1){for(let j=0;j<4;j++)box(g,m.tail,side*w*.34,waist*.84-j*.021,rear-.05,w*.16,.01,.012,.002);}
      }
      if(buildDetail>2){for(let n=-5;n<=5;n++)box(g,m.dark,n*w*.035,base+.30,front+.053,.010,.12,.012,0);for(const side of[-1,1])box(g,m.trim,side*w*.23,waist+.089,l*.31,.012,.01,l*.13,0);}
    }
    const engineZ=open?-l*.30:(d.silhouette==='mid-engine'||d.silhouette==='hypercar')?-l*.29:l*.30,engineY=Math.min(waist-.12,.64);
    box(g,m.dark,0,engineY-.12,engineZ,w*.43,.22,l*.18,.018);box(g,m.trim,0,engineY+.008,engineZ,w*.34,.07,l*.15,.016);
    if(buildDetail>1){for(let j=0;j<6;j++)box(g,m.metal,(j-2.5)*w*.052,engineY+.05,engineZ,.018,.012,l*.13,0);box(g,m.dark,w*.28,engineY-.02,engineZ-.12,.17,.13,.20,.008);tube(g,m.rubber,[-w*.20,engineY+.02,engineZ-.15],[-w*.20,engineY-.07,engineZ+.19],.035);sphere(g,m.orange,-w*.12,engineY+.05,engineZ+.06,.023,.009,.023);}
    for(const side of[-1,1]){tube(g,m.trim,[side*w*.27,base-.03,-d.wheelbase*.5],[side*w*.27,base-.03,d.wheelbase*.5],.035);tube(g,m.metal,[side*.15,base+.02,engineZ],[side*.15,base-.05,rear+.23],.028);box(g,m.trim,side*.15,base-.045,rear+.45,.17,.11,.34,.02);
      for(const z of[-d.wheelbase*.5,d.wheelbase*.5]){tube(g,m.trim,[side*.15,base-.02,z],[side*d.track*.43,d.wheelRadius*.85,z],.025);box(g,m.red,side*d.track*.47,d.wheelRadius,z+d.wheelRadius*.45,.065,d.wheelRadius*.39,.08,.012);if(buildDetail>2){const spring=[];for(let n=0;n<=20;n++){const t=n/20,a=t*Math.PI*8;spring.push(new T.Vector3(side*d.track*.37+Math.sin(a)*.027,base+.04+t*.18,z+Math.cos(a)*.027));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(spring),steps(20,8),.006,4,false),m.metal,g);}}
    }
    group.userData.fleetDetail={revision:24,features,level:buildDetail};
  }

  // ---- V3 cars ------------------------------------------------------------------------------------------
  // Every four-wheeled body comes from PlatdoCarBody and is assembled into the same parts the game already
  // animates and breaks off: wheels, doors, hood, boot, bumpers, lamps, mirrors and the windscreen.
  const CB=root.PlatdoCarBody,FG=root.PlatdoForge,mix=(a,b,t)=>a+(b-a)*t;
  const ROLE={paint:'body',glass:'glass',frit:'dark',pillar:'body',bay:'dark',bed:'trim',dark:'dark',trim:'trim',chrome:'metal',head:'head',tail:'tail',orange:'orange',reverse:'reverse',seat:'seat',rubber:'rubber',white:'white',rim:'rim',blue:'blue',red:'red'};
  // rear: trunk (default), hatch, box (roof runs to the tail), bed, chassis. rake: length of the rear window.
  // deck: boot height at its front and back, relative to the window sill. nose: hood height at the front, as a share of the sill.
  const CAR_STYLE={
    sedan:{rake:.5,deck:[.035,-.03],nose:.9,lamps:'wrap',grille:'wide',tail:'wrap'},
    hatch:{rear:'hatch',rake:.34,nose:.9,lamps:'wrap',grille:'slim',tail:'tall',noseDepth:.26},
    wagon:{rear:'box',nose:.9,lamps:'wrap',grille:'wide',tail:'tall'},
    coupe:{rake:.72,deck:[.02,-.05],nose:.86,roofDropR:.05,lamps:'slim',grille:'slim',tail:'bar',roofK:.96},
    'light-coupe':{rake:.6,deck:[.02,-.04],nose:.86,roofDropR:.04,lamps:'round',grille:'smile',tail:'round',noseDepth:.26},
    'grand-coupe':{rake:.85,deck:[.02,-.06],nose:.87,roofDropR:.06,lamps:'slim',grille:'wide',tail:'bar'},
    muscle:{rake:.6,deck:[.03,-.02],nose:.97,hoodCurve:2.4,lamps:'quad',grille:'full',tail:'triple',flare:.03,taperF:.96,faceWF:.9,sweepF:.05},
    sport:{rake:.8,deck:[.03,-.02],nose:.8,roofDropR:.07,lamps:'slim',grille:'low',tail:'round',flare:.035},
    'retro-sport':{rake:.75,deck:[0,-.08],nose:.78,roofDropR:.06,lamps:'pop',grille:'low',tail:'round',flare:.03},
    'track-sport':{rake:.8,deck:[.03,-.02],nose:.76,roofDropR:.07,lamps:'slim',grille:'low',tail:'bar',flare:.04,wing:'gt',splitter:true},
    wedge:{rake:.9,deck:[.06,.03],nose:.62,wedge:.1,roofDropR:.05,lamps:'blade',grille:'none',tail:'bar',flare:.04,wing:'lip',sweepF:.14},
    'mid-engine':{rake:.8,deck:[.07,.04],nose:.64,wedge:.08,roofDropR:.05,lamps:'blade',grille:'low',tail:'round',flare:.04,intake:true},
    hypercar:{rake:.85,deck:[.08,.05],nose:.6,wedge:.1,roofDropR:.06,lamps:'blade',grille:'low',tail:'bar',flare:.05,wing:'gt',splitter:true,intake:true,sweepF:.14},
    convertible:{open:true,deck:[.04,-.02],nose:.86,lamps:'slim',grille:'slim',tail:'bar'},
    'super-roadster':{open:true,deck:[.07,.04],nose:.62,wedge:.08,lamps:'blade',grille:'low',tail:'bar',flare:.05,intake:true,sweepF:.14},
    suv:{rear:'box',nose:.95,hoodCurve:2,lamps:'box',grille:'tall',tail:'tall',cladding:.84,flare:.035,rack:true,taperF:.96,faceWF:.9,roofCrown:.04},
    offroad:{rear:'box',nose:.97,hoodCurve:2.6,lamps:'round',grille:'slots',tail:'small',cladding:.84,flare:.05,spare:true,taperF:.97,taperR:.98,faceWF:.92,faceWR:.92,roofCrown:.03,sweepF:.04,noseDepth:.2,tailDepth:.14},
    pickup:{rear:'bed',nose:.96,hoodCurve:2,lamps:'box',grille:'tall',tail:'small',cladding:.86,flare:.035,taperF:.96,faceWF:.9},
    van:{rear:'box',nose:.84,hoodCurve:1.2,lamps:'box',grille:'slim',tail:'tall',blind:true,taperR:.99,faceWR:.93,roofCrown:.04,noseDepth:.24},
    truck:{rear:'chassis',nose:.99,hoodCurve:2.5,lamps:'box',grille:'tall',tail:'small',taperF:.97,faceWF:.92,roofCrown:.04}
  };
  CAR_STYLE.taxi=CAR_STYLE.police=CAR_STYLE.sedan;CAR_STYLE.ambulance=CAR_STYLE.van;
  function carSpec(d,bp,st){
    const l=d.dimensions.length,w=d.dimensions.width,belt=bp.waist+(st.beltUp??.07),rear=st.rear||'trunk',tailDepth=st.tailDepth||(rear==='box'?.16:.24),zR0=-l/2+tailDepth;
    const spec={L:l,W:w,base:bp.base,belt,roofY:bp.roofY,roofHalf:bp.roofWidth*(st.roofK||1.02),R:d.wheelRadius,axles:[-d.wheelbase/2,d.wheelbase/2],zCowl:bp.cabinFront,zRoofF:bp.cabinFront-bp.windshieldInset,
      cowlY:belt+.05,noseY:belt*(st.nose??.9),hoodCurve:st.hoodCurve??1.5,flare:st.flare??.022,wedge:st.wedge||0,roofDropR:st.roofDropR||0,open:!!st.open,cladding:st.cladding||0,noseDepth:st.noseDepth||.3,tailDepth,
      taperF:st.taperF??.93,taperR:st.taperR??.95,faceWF:st.faceWF??.84,faceWR:st.faceWR??.88,roofCrown:st.roofCrown??.05,sweepF:st.sweepF??.1,detail:buildDetail,blindSides:!!st.blind};
    if(rear==='box'){spec.zRoofR=zR0;spec.zDeck=zR0-.05;spec.deckY=belt+.03;spec.tailY=belt;spec.bayR=0;spec.faceRole=name=>name==='rear'?(u,v,x,y)=>y>belt+.09&&y<bp.roofY-.13&&Math.abs(u-.5)<.38?['body','glass']:null:null;}
    else if(rear==='hatch'){spec.zRoofR=bp.cabinRear+(st.rake??.3);spec.zDeck=zR0+.03;spec.deckY=belt+.035;spec.tailY=belt+.02;spec.bayR=0;}
    else if(rear==='bed'){spec.zRoofR=bp.cabinRear+.1;spec.zDeck=bp.cabinRear;spec.deckY=belt+.03;spec.tailY=belt+.03;spec.bayR=.4;spec.bed=true;}
    else if(rear==='chassis'){spec.zRoofR=bp.cabinRear+.1;spec.zDeck=bp.cabinRear;spec.deckY=.93;spec.tailY=.93;spec.bayR=0;}
    else{spec.zRoofR=Math.min(bp.cabinRear+(st.rake??.5),spec.zRoofF-.42);spec.zDeck=Math.min(bp.cabinRear,spec.zRoofR-.3);spec.deckY=belt+st.deck[0];spec.tailY=belt+st.deck[1];}
    if(st.open){spec.zRoofR=spec.zRoofF-.035;spec.zDeck=spec.zRoofR-.035;spec.openRear=bp.cabinRear;spec.deckY=belt+st.deck[0];spec.tailY=belt+st.deck[1];spec.roofY=Math.max(belt+.34,(d.bodyHeight||d.dimensions.height)*.98);}
    return spec;
  }
  function shapeMesh(shape,mat,parent){const g=shape.geometry();g.deleteAttribute('color');const o=new T.Mesh(g,mat);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  // One wheel: a tyre with a rounded shoulder and tread grooves, a dished alloy with spokes, a brake disc behind it.
  function wheelShapes(r,width,style){
    const S=()=>new FG.Shape(),hw=width/2,tyre=S(),rim=S(),disc=S(),hub=S(),sg=n=>steps(n,6);
    FG.lathe(tyre,buildDetail>2?[[r*.60,-hw*.94],[r*.66,-hw],[r*.80,-hw*1.05],[r*.92,-hw*1.02],[r*.985,-hw*.84],[r,-hw*.62],[r,-hw*.52],[r*.988,-hw*.5],[r*.988,-hw*.44],[r,-hw*.42],[r,-hw*.06],[r*.988,-hw*.04],[r*.988,hw*.04],[r,hw*.06],[r,hw*.42],[r*.988,hw*.44],[r*.988,hw*.5],[r,hw*.52],[r,hw*.62],[r*.985,hw*.84],[r*.92,hw*1.02],[r*.80,hw*1.05],[r*.66,hw],[r*.60,hw*.94]]:[[r*.60,-hw*.94],[r*.80,-hw*1.05],[r*.985,-hw*.84],[r,-hw*.5],[r,hw*.5],[r*.985,hw*.84],[r*.80,hw*1.05],[r*.60,hw*.94]],{sides:sg(36),smooth:false});
    FG.lathe(rim,[[r*.60,-hw*.94],[r*.63,-hw*.86],[r*.57,-hw*.6],[r*.55,hw*.45],[r*.60,hw*.8],[r*.63,hw*.9],[r*.60,hw*.96],[r*.56,hw*.9]],{sides:sg(36),smooth:false});
    FG.lathe(disc,[[0,hw*.1],[r*.5,hw*.1],[r*.5,hw*.2],[0,hw*.2]],{sides:sg(28),smooth:false});
    // Spokes run from the hub out to the barrel, dished toward the car.
    const count=style===2?10:style===1?6:5,twin=style===0,thick=style===2?.011:style===1?.024:.016,spoke=angle=>FG.tube(rim,[[Math.cos(angle)*r*.1,hw*.52,Math.sin(angle)*r*.1],[Math.cos(angle)*r*.32,hw*.6,Math.sin(angle)*r*.32],[Math.cos(angle)*r*.57,hw*.82,Math.sin(angle)*r*.57]],[thick,thick*1.5],{sides:steps(6,4),segments:steps(5,2)});
    for(let k=0;k<count;k++){const a=k/count*TAU;if(twin){spoke(a-.11);spoke(a+.11);}else spoke(a);}
    FG.lathe(hub,[[0,hw*.72],[r*.11,hw*.7],[r*.14,hw*.56],[r*.16,hw*.4],[0,hw*.4]],{sides:sg(18)});
    if(buildDetail>2)for(let k=0;k<5;k++){const a=k/5*TAU+.3;FG.ellipsoid(hub,Math.cos(a)*r*.2,hw*.56,Math.sin(a)*r*.2,.012,.012,.012,{nu:6,nv:4});}
    // The lathe turns about Y; a wheel turns about X with its face toward +X.
    return[tyre,rim,disc,hub].map(s=>{const g=s.geometry();g.deleteAttribute('color');g.rotateZ(-Math.PI/2);return g;});
  }
  const TAU=Math.PI*2;
  function carWheel(parent,parts,m,x,y,z,r,front,style,width,cache){
    const pivot=new T.Group();pivot.position.set(x,y,z);parent.add(pivot);const spin=new T.Group();pivot.add(spin);
    cache.geometry??=wheelShapes(r,width,style);const[tyre,rim,disc,hub]=cache.geometry,side=x<0?-1:1;
    for(const[g,mat]of[[tyre,m.rubber],[rim,style===1?m.dark:m.rim],[disc,m.metal],[hub,m.trim]]){const o=new T.Mesh(g,mat);o.castShadow=true;o.receiveShadow=true;if(side<0)o.rotation.y=Math.PI;spin.add(o);}
    // The caliper stays with the hub carrier while the wheel turns.
    const cal=new FG.Shape();FG.roundBox(cal,side*width*.12,r*.34,-r*.3,width*.34,r*.22,r*.3,.02,{segments:1});shapeMesh(cal,m.red,pivot);
    parts.wheels.push({pivot,spin,front,baseY:y});return pivot;
  }
  function carSeat(shape,a,rear=false){
    const from=shape.count,sg=buildDetail>3?2:1;FG.roundBox(shape,a.x,a.y-.075,a.z+.03,.5,.14,.5,.055,{segments:sg});
    const back=shape.count;FG.roundBox(shape,0,.3,0,.48,.62,.12,.055,{segments:sg});if(buildDetail>2)for(const s of[-1,1])FG.roundBox(shape,s*.2,.28,.05,.09,.5,.1,.04,{segments:1});if(!rear)FG.roundBox(shape,0,.69,-.01,.26,.17,.1,.045,{segments:sg});
    shape.transform(back,new T.Matrix4().makeTranslation(a.x,a.y-.02,a.z-.24).multiply(new T.Matrix4().makeRotationX(-.16)));
    if(buildDetail>2)for(const s of[-1,1])FG.roundBox(shape,a.x+s*.22,a.y-.03,a.z+.03,.08,.12,.46,.035,{segments:1});return from;
  }
  function car(group,d,m,parts,c){
    const bp=V.bodyProfile(d),st={...CAR_STYLE.sedan,...(CAR_STYLE[d.silhouette]||{})},spec=carSpec(d,bp,st),B=CB.build(spec),w=d.dimensions.width,l=d.dimensions.length,belt=spec.belt,front=l/2,rear=-l/2,roofY=spec.roofY,sport=bp.sport,shape=d.silhouette;
    const q=B.qOf,p={x:0,y:0,z:0},n={x:0,y:0,z:0},S=(part,role)=>B.shapeOf(part,role),box=(part,role,x,y,z,sx,sy,sz,r=.012,sg=1)=>FG.roundBox(S(part,role),x,y,z,sx,sy,sz,Math.min(r,sx*.45,sy*.45,sz*.45),{segments:sg});
    const fineDetail=buildDetail>2,L=side=>side<0?'left':'right';
    // Lids and doors lie on the body with tucked edges, which draws their shut lines.
    B.panel({part:'hood',role:'paint',s0:-.262,s1:.262,q0:q(B.zCowl+.045),q1:1.3,lift:.005});
    if(!st.rear)B.panel({part:'trunk',role:'paint',s0:-.262,s1:.262,q0:-.3,q1:q((st.open?bp.cabinRear:B.zDeck)-.045),lift:.005});
    else B.facePatch('rear',{part:'trunk',role:'paint',u0:.1,u1:.9,v0:.16,v1:spec.bed?.9:.5,lift:.005,nu:8,nv:5});
    if(B.zDoorF!==null)for(const side of[-1,1]){const tall=zc=>B.glassHeight(zc)>.13;
      B.panel({part:'door-'+L(side),role:(sc,zc)=>{const a=Math.abs(sc);return a<CB.SILL?(a>CB.RAIL+.03&&a<CB.SILL-.022&&zc>B.zDoorR+.05&&zc<B.zDoorF-.045&&tall(zc)?'glass':'pillar'):'paint';},s0:side*(st.open?CB.SILL-.012:CB.RAIL+.006),s1:side*.936,q0:q(B.zDoorR+.006),q1:q(B.zDoorF-.006),lift:.003,inner:'seat'});
      B.at(side*.545,q(B.zDoorR+.17),p);B.normal(side*.545,q(B.zDoorR+.17),n);box('door-'+L(side),'chrome',p.x+n.x*.014,p.y,p.z,.02,.024,.13,.009);}
    // Bumpers wrap each end; sporty cars carry a splitter and a diffuser under them.
    B.sweep('front',{part:'front-bumper',role:'trim',y:spec.base+.2,height:.085,depth:.04,reach:.022});B.sweep('rear',{part:'rear-bumper',role:'trim',y:spec.base+.22,height:.085,depth:.04,reach:.022});
    if(st.splitter||sport)B.sweep('front',{part:'body',role:'dark',y:spec.base+.045,height:.022,depth:.07,reach:.03});
    // Front face: grille, intake, plate and lamps.
    const F1=B.faces.front,F0=B.faces.rear,gr=st.grille,slat=(v,u0,u1,role='chrome',h=.012)=>B.facePatch('front',{part:'body',role,u0,u1,v0:v-h,v1:v+h,lift:.012,nu:6,nv:2,flat:true});
    B.facePatch('front',{part:'body',role:'dark',u0:.2,u1:.8,v0:.06,v1:.24,lift:.009,nu:8,nv:3});
    if(gr==='wide'||gr==='full'||gr==='tall'||gr==='slim'||gr==='smile'||gr==='slots'){const v0=gr==='tall'?.34:gr==='slim'||gr==='smile'?.56:.44,v1=gr==='slim'||gr==='smile'?.7:.86,u0=gr==='full'?.1:gr==='slots'?.3:gr==='smile'?.34:.28;
      B.facePatch('front',{part:'body',role:'dark',u0,u1:1-u0,v0,v1,lift:.009,nu:10,nv:4});
      if(fineDetail){if(gr==='slots')for(let k=0;k<7;k++){const u=.33+k*.057;B.facePatch('front',{part:'body',role:'paint',u0:u-.012,u1:u+.012,v0:v0+.02,v1:v1-.02,lift:.012,nu:2,nv:4,flat:true});}else for(let k=1;k<=(gr==='tall'?5:3);k++)slat(mix(v0,v1,k/((gr==='tall'?5:3)+1)),u0+.02,1-u0-.02,gr==='tall'||gr==='full'?'chrome':'trim');}}
    if(gr==='low'||st.intake)for(const side of[-1,1])B.facePatch('front',{part:'body',role:'dark',u0:.5+side*.3-.09,u1:.5+side*.3+.09,v0:.28,v1:.46,lift:.004,nu:4,nv:3});
    F1.at(.5,.3,p);box('front-bumper','white',0,spec.base+.2,p.z+.072,.36,.085,.008,.003);F0.at(.5,.3,p);box('rear-bumper','white',0,spec.base+.22,p.z-.072,.38,.09,.008,.003);
    const disc=(part,role,x,y,z,r,dir)=>{const sh=S(part,role),from=sh.count;FG.lathe(sh,[[0,.012],[r*.7,.01],[r,0],[r,-.02],[0,-.02]],{sides:steps(20,8),smooth:false});sh.transform(from,new T.Matrix4().makeTranslation(x,y,z).multiply(new T.Matrix4().makeRotationX(dir*Math.PI/2)));};
    for(const side of[-1,1]){const part='headlight-'+L(side),lamps=st.lamps;
      if(lamps==='wrap'||lamps==='slim'||lamps==='blade'){const s0=.492,s1=lamps==='wrap'?.615:lamps==='slim'?.56:.535,q0=lamps==='blade'?1.04:1.16,q1=lamps==='wrap'?1.9:1.96;
        B.panel({part:'body',role:'dark',s0:side*(s0-.012),s1:side*(s1+.012),q0:q0-.03,q1:Math.min(1.99,q1+.03),lift:.001,sink:.004,edge:.008});B.panel({part,role:'head',s0:side*s0,s1:side*s1,q0,q1,lift:.006,sink:.002,edge:.008});
        B.panel({part:'body',role:'orange',s0:side*(s1+.02),s1:side*(s1+.055),q0:1.2,q1:1.6,lift:.005,sink:.002,edge:.006});}
      else if(lamps==='box'){B.facePatch('front',{part,role:'head',u0:.5+side*.41-.1,u1:.5+side*.41+.1,v0:.56,v1:.84,lift:.01,nu:4,nv:4});B.facePatch('front',{part:'body',role:'orange',u0:.5+side*.41-.1,u1:.5+side*.41+.1,v0:.46,v1:.53,lift:.008,nu:4,nv:2});}
      else{const count=lamps==='quad'?2:1,r=lamps==='quad'?.068:lamps==='pop'?.075:.085;for(let k=0;k<count;k++){const u=.5+side*(lamps==='quad'?.3+k*.13:.36);F1.at(u,.72,p);disc('body','chrome',p.x,p.y,p.z+.006,r+.014,1);disc(part,'head',p.x,p.y,p.z+.016,r,1);}
        F1.at(.5+side*.4,.5,p);box('body','orange',p.x,p.y,p.z+.01,.1,.035,.02,.008);}
      // Tail lamps, reversing lamps and rear indicators.
      const tail=st.tail;
      if(tail==='wrap'){B.panel({part:'body',role:'tail',s0:side*.495,s1:side*.62,q0:-.97,q1:-.3,lift:.006,sink:.002,edge:.008});B.facePatch('rear',{part:'body',role:'tail',u0:.5+side*.3,u1:.5+side*.485,v0:.66,v1:.86,lift:.008,nu:4,nv:3});}
      else if(tail==='tall'){B.panel({part:'body',role:'tail',s0:side*.5,s1:side*.7,q0:-.96,q1:-.55,lift:.006,sink:.002,edge:.008});}
      else if(tail==='bar'){B.facePatch('rear',{part:'body',role:'tail',u0:.5+side*.06,u1:.5+side*.44,v0:.7,v1:.8,lift:.008,nu:6,nv:2});B.panel({part:'body',role:'tail',s0:side*.5,s1:side*.56,q0:-.97,q1:-.5,lift:.006,sink:.002,edge:.008});}
      else if(tail==='round'){for(let k=0;k<2;k++){F0.at(.5+side*(.26+k*.14),.7,p);disc('body','chrome',p.x,p.y,p.z-.006,.066,-1);disc('body','tail',p.x,p.y,p.z-.016,.054,-1);}}
      else if(tail==='triple'){for(let k=0;k<3;k++)B.facePatch('rear',{part:'body',role:'tail',u0:.5+side*(.2+k*.085)-.03,u1:.5+side*(.2+k*.085)+.03,v0:.665,v1:.86,lift:.008,nu:2,nv:3});}
      else B.facePatch('rear',{part:'body',role:'tail',u0:.5+side*.4-.07,u1:.5+side*.4+.07,v0:.665,v1:.8,lift:.008,nu:3,nv:3});
      B.facePatch('rear',{part:'body',role:'reverse',u0:.5+side*.3,u1:.5+side*.37,v0:.585,v1:.65,lift:.008,nu:2,nv:2});B.facePatch('rear',{part:'body',role:'orange',u0:.5+side*.38,u1:.5+side*.47,v0:.585,v1:.65,lift:.008,nu:2,nv:2});
      // Mirror: a shaped pod on a stalk at the base of the screen pillar.
      const mz=B.zCowl-.16,mx=side*(B.halfW(mz)*B.spec.sill+.085),my=B.beltAt(mz)+.085,pod=S('mirror-'+L(side),'paint');FG.ellipsoid(pod,mx,my,mz,.085,.058,.07,{nu:steps(14,6),nv:steps(9,4),warp:(x,y,z,o)=>{o[0]=x;o[1]=y;o[2]=z<0?z*.35:z;}});
      box('mirror-'+L(side),'dark',mx-side*.07,my-.03,mz,.09,.025,.045,.01);box('mirror-'+L(side),'glass',mx,my,mz-.027,.13,.085,.008,.004);
      // Exhaust tips for cars that burn fuel.
      if(!d.electric){const sh=S('body','chrome'),from=sh.count;FG.lathe(sh,[[.032,-.09],[.04,-.085],[.04,.09],[.032,.09],[.03,-.02]],{sides:steps(14,6),smooth:false});sh.transform(from,new T.Matrix4().makeTranslation(side*w*.27,spec.base+.075,rear+.05).multiply(new T.Matrix4().makeRotationX(Math.PI/2)));}
      // Arch liners close the fender behind each wheel.
      for(const axle of spec.axles){const sh=S('body','dark'),R=B.archR+.01,steps2=steps(14,6);for(let k=0;k<=steps2;k++){const a=k/steps2*Math.PI;for(const x of[side*w*.3,side*(B.halfW(axle)*.985)])sh.vertex(x,d.wheelRadius+Math.sin(a)*R,axle+Math.cos(a)*R);if(k){const i=sh.count-4;B.tri(sh,i,i+1,i+2,true);B.tri(sh,i+1,i+3,i+2,true);}}}
    }
    if(fineDetail)for(const side of[-1,1]){B.at(side*.1,q(B.zCowl-.03),p);FG.tube(S('body','dark'),[[side*.08,p.y+.02,B.zCowl-.01],[side*.3,p.y+.035,B.zCowl-.06],[side*.5,p.y+.05,B.zCowl-.09]],.006,{sides:4,segments:6});}
    // Engine under the hood, so a missing hood shows something.
    {const zc=(B.zCowl+B.zF1)/2,top=B.topY(zc+.2)-.13;if(top-spec.base>.3){box('body','trim',0,top-.09,zc,w*.44,.16,Math.max(.3,(B.zF1-B.zCowl)*.6),.03);box('body','chrome',0,top,zc,w*.3,.03,Math.max(.2,(B.zF1-B.zCowl)*.42),.012);}}
    // Cabin: floor, seats, parcel shelf.
    /* V9.0: a tall cab (the truck) has its floor up where the feet are; back-row seats have no headrest */box('interior','dark',0,Math.max(spec.base+.1,d.seats[0].position.y-.62),(B.zCowl+.4+bp.cabinRear-.15)/2,w*.84,.05,B.zCowl-bp.cabinRear+.55,.02);{const sh=S('interior','seat');d.seats.forEach(s=>carSeat(sh,s.position,s.index>=2));}
    box('interior','trim',0,d.seats[0].position.y-.12,d.seats[0].position.z+.02,.2,.2,.7,.03);
    // Equipment that belongs to particular bodies.
    if(st.wing==='gt'||c.trim===1&&sport){const y=B.topY(rear+.3)+.24,z=rear+.24;box('body','trim',0,y,z,w*.9,.035,.26,.014,2);for(const side of[-1,1]){box('body','trim',side*w*.3,y-.13,z+.02,.05,.24,.1,.012);box('body','trim',side*w*.45,y+.02,z,.018,.13,.3,.006);}}
    if(st.wing==='lip')box('body','paint',0,B.topY(rear+.3)+.045,rear+.27,w*.8,.05,.16,.02,2);
    if(st.rack)for(const side of[-1,1]){FG.tube(S('body','trim'),[[side*spec.roofHalf*.86,roofY+.045,bp.cabinRear+.15],[side*spec.roofHalf*.88,roofY+.06,(bp.cabinRear+B.zRoofF)/2],[side*spec.roofHalf*.84,roofY+.04,B.zRoofF-.25]],.018,{sides:6,segments:8});}
    if(st.intake)for(const side of[-1,1])B.panel({part:'body',role:'dark',s0:side*.6,s1:side*.78,q0:q(-l*.2),q1:q(-l*.06),lift:.002,sink:.02,edge:.02});
    if(st.spare){const sh=S('body','rubber'),from=sh.count;FG.lathe(sh,[[.2,-.1],[.36,-.11],[.39,-.06],[.39,.06],[.36,.11],[.2,.1]],{sides:steps(24,10),smooth:false});sh.transform(from,new T.Matrix4().makeTranslation(0,1.02,rear-.07).multiply(new T.Matrix4().makeRotationX(Math.PI/2)));box('body','trim',0,1.02,rear-.02,.3,.3,.1,.03);for(const side of[-1,1])FG.tube(S('body','trim'),[[side*w*.4,belt,bp.cabinRear+.2],[side*w*.38,roofY+.06,bp.cabinRear+.25],[side*w*.38,roofY+.06,B.zRoofF-.2]],.03,{sides:6,segments:8});}
    if(shape==='taxi'){box('body','trim',0,roofY+.1,-.08,.5,.16,.22,.04,2);box('body','head',0,roofY+.105,.035,.38,.1,.014,.006);}
    if(shape==='police'||shape==='ambulance'){box('body','trim',0,roofY+.075,0,w*.62,.07,.22,.02);for(const side of[-1,1])box('body',side<0?'blue':'red',side*w*.2,roofY+.14,0,w*.24,.1,.2,.035,2);for(const side of[-1,1])B.panel({part:'body',role:shape==='ambulance'?'red':'dark',s0:side*.6,s1:side*.68,q0:q(rear+.6),q1:q(front-.9),lift:.004,sink:.001,edge:.004});}
    if(shape==='ambulance')for(const side of[-1,1]){const zc=-l*.22,at2=(y,z)=>{const sy=B.sAtHeight(q(z),y)*side;B.at(sy,q(z),p);B.normal(sy,q(z),n);return[p.x+n.x*.006,p.y,p.z];};for(const[dy,dz]of[[.22,.07],[.07,.22]]){const sh=S('body','red'),c0=at2(roofY-.5-dy,zc-dz),c1=at2(roofY-.5-dy,zc+dz),c2=at2(roofY-.5+dy,zc-dz),c3=at2(roofY-.5+dy,zc+dz),i=sh.count;for(const v of[c0,c1,c2,c3])sh.vertex(v[0],v[1],v[2]);B.tri(sh,i,i+1,i+2);B.tri(sh,i+1,i+3,i+2);}}
    // Assemble: the body and cabin are static, everything else is its own object.
    const pieces=B.result().pieces,objects=new Map(),holder=part=>{let g=objects.get(part);if(!g){g=new T.Group();g.name=part;objects.set(part,g);}return g;};
    for(const piece of pieces)shapeMesh(piece.shape,m[ROLE[piece.role]]||m.trim,holder(piece.part));
    const stat=new T.Group();group.add(stat);for(const part of['body','interior'])if(objects.has(part))stat.add(objects.get(part));
    if(shape==='truck'){const back=-l*.485,frontZ=-.02,depth=frontZ-back,old=(x,y,z,sx,sy,sz,mat,r=.02)=>{const sh=new FG.Shape();FG.roundBox(sh,x,y,z,sx,sy,sz,r,{segments:1});return shapeMesh(sh,mat,stat);};old(0,.9,(frontZ+back)/2,w*.94,.12,depth,m.metal);for(const side of[-1,1])old(side*w*.47,1.98,(frontZ+back)/2,.09,2.1,depth,m.white,.025);old(0,3.02,(frontZ+back)/2,w*.98,.09,depth,m.white,.025);old(0,1.98,frontZ,w*.94,2.1,.09,m.white,.025);old(0,3.08,(frontZ+back)/2,w*.8,.04,depth*.9,m.orange,.005);
      const gate=new T.Group();gate.position.set(0,.96,back);group.add(gate);{const sh=new FG.Shape();FG.roundBox(sh,0,1.18,0,w*.91,2.36,.075,.02,{segments:1});shapeMesh(sh,m.trim,gate);const ribs=new FG.Shape();for(let y=.12;y<2.36;y+=.22)FG.roundBox(ribs,0,y,-.043,w*.85,.025,.02,.002,{segments:1});shapeMesh(ribs,m.metal,gate);}parts.cargoGate=gate;}
    cockpit(group,d,m,parts);
    const attach=(part,id,health)=>{const g=holder(part);group.add(g);breakaway(parts,g,id,health);return g;};
    attach('windshield','windshield',0);attach('hood','hood',0);attach('trunk','trunk',0);attach('front-bumper','front-bumper',.55);attach('rear-bumper','rear-bumper',.65);
    for(const side of[-1,1]){attach('headlight-'+L(side),'headlight-'+L(side),0);attach('mirror-'+L(side),side<0?'mirror-left':'mirror-right',side<0?.86:.75);
      const pivot=new T.Group(),hx=side*w*.48,hz=bp.cabinFront-.05;pivot.position.set(hx,0,hz);group.add(pivot);const door=holder('door-'+L(side));door.position.set(-hx,0,-hz);pivot.add(door);parts.doors.push({pivot,side,seatIndex:side>0?0:1});breakaway(parts,pivot,side<0?'door-left':'door-right',side<0?.29:.18);}
    const cache={};for(const side of[-1,1])for(const z of spec.axles)carWheel(group,parts,m,side*d.track*.5,d.wheelRadius,z,d.wheelRadius,z>0,c.wheelStyle||0,shape==='truck'?.28:sport?.25:.21,cache);
    group.remove(stat);group.add(mergeStatic(stat));group.userData.fleetDetail={revision:30,features:['sculpted body','shut lines','modelled lamps','alloy wheels','brake discs','shaped seats'],level:buildDetail};
  }

  // ---- V3 motorcycles and the scooter ----------------------------------------------------------------------
  // The moving parts are the ones the game already drives: two wheels on steering pivots (the fork, fender and
  // calipers ride on the front one), a handlebar that turns, and break-away lamp, exhaust, plate and mirrors.
  function motoWheel(parent,parts,m,y,z,r,front,width,wire){
    const pivot=new T.Group();pivot.position.set(0,y,z);parent.add(pivot);const spin=new T.Group();pivot.add(spin);
    const tyre=new FG.Shape(),rim=new FG.Shape(),disc=new FG.Shape(),hub=new FG.Shape(),hw=width/2,rr=r-width*.62;
    // A motorcycle tyre is round in section, so the bike can lean on it.
    FG.lathe(tyre,[[rr,-hw*.72],[rr+.02,-hw*.98],[r-width*.3,-hw],[r-.012,-hw*.62],[r,0],[r-.012,hw*.62],[r-width*.3,hw],[rr+.02,hw*.98],[rr,hw*.72]],{sides:steps(40,10),rows:steps(18,8)});
    FG.lathe(rim,[[rr-.02,-hw*.6],[rr,-hw*.74],[rr+.008,-hw*.74],[rr+.004,-hw*.55],[rr-.012,0],[rr+.004,hw*.55],[rr+.008,hw*.74],[rr,hw*.74],[rr-.02,hw*.6]],{sides:steps(36,10),smooth:false});
    if(wire){const n=buildDetail<3?12:32;for(let k=0;k<n;k++){const q=k/n*TAU,side=k%2?1:-1,q0=q+side*.3;FG.tube(rim,[[Math.sin(q0)*.04,side*.04,Math.cos(q0)*.04],[Math.sin(q)*(rr-.016),0,Math.cos(q)*(rr-.016)]],.0022,{sides:3,segments:1,caps:false});}}
    else for(let k=0;k<(buildDetail<3?3:6);k++){const q=k/(buildDetail<3?3:6)*TAU;for(const side of[-1,1])FG.tube(rim,[[Math.sin(q+side*.12)*.05,side*.02,Math.cos(q+side*.12)*.05],[Math.sin(q)*(rr-.01),0,Math.cos(q)*(rr-.01)]],[.012,.006],{sides:5,segments:2,caps:false});}
    FG.lathe(hub,[[0,-hw-.01],[.02,-hw-.01],[.045,-.045],[.05,0],[.045,.045],[.02,hw+.01],[0,hw+.01]],{sides:steps(16,8),smooth:false});
    const dr=r*(front?.5:.38);for(const side of front?[-1,1]:[1]){const a=side*(hw*.5+.02);FG.lathe(disc,[[dr*.5,a],[dr,a],[dr,a+side*.004],[dr*.5,a+side*.004]],{sides:steps(28,10),smooth:false});}
    for(const[shape,mat]of[[tyre,m.rubber],[rim,m.rim],[hub,m.dark],[disc,m.metal]]){const g=shape.geometry();g.deleteAttribute('color');g.rotateZ(-Math.PI/2);const o=new T.Mesh(g,mat);o.castShadow=o.receiveShadow=true;spin.add(o);}
    parts.wheels.push({pivot,spin,front,baseY:y});return pivot;
  }
  function motorbike(group,d,m,parts,c){
    const K=root.CityElectricBikeModels.kit,skin=K.skin,mirrorNet=K.mirror,beam=K.beam,pipe=K.pipe,drum=K.drum,bins=new Map(),sh=(parent,mat)=>{let map=bins.get(parent);if(!map)bins.set(parent,map=new Map());let v=map.get(mat);if(!v)map.set(mat,v=new FG.Shape());return v;};
    const stat=new T.Group();group.add(stat);const S=mat=>sh(stat,mat),scooter=d.silhouette==='scooter',sport=d.bikeSport,superbike=d.silhouette==='superbike',adv=d.silhouette==='adventure-bike',naked=!scooter&&!sport&&!adv,wb=d.wheelbase,r=d.wheelRadius,seatY=d.seats[0].position.y,half=wb/2;
    const gold=material(0xc79a3c,.3,.85),chrome=material(0xc9cfd2,.2,.9),both=(mat,net,nu=8,nv=8)=>{skin(S(mat),net,nu,nv);skin(S(mat),mirrorNet(net),nu,nv);},sg=(n,min=3)=>steps(n,min);m.body.side=T.DoubleSide;
    const front=motoWheel(group,parts,m,r,half,r,true,sport?.13:.12,adv),rear=motoWheel(group,parts,m,r,-half,r,false,sport?.2:scooter?.15:.17,adv),FR=mat=>sh(front,mat);
    // Fork, fender and calipers turn with the front wheel. Coordinates here are relative to the front axle.
    const topY=scooter?.6:.68,topZ=scooter?-.2:-.27;
    for(const side of[-1,1]){pipe(FR(chrome),[[side*.095,0,0],[side*.098,topY*.5,topZ*.5]],.019,8);pipe(FR(sport?gold:m.dark),[[side*.098,topY*.4,topZ*.4],[side*.1,topY,topZ]],.027,10);FG.roundBox(FR(m.dark),side*.095,-.01,.01,.04,.07,.06,.012,{segments:1});FG.roundBox(FR(sport?gold:m.red),side*.115,r*.3,-r*.42,.035,.09,.06,.012,{segments:1});}
    for(const t of[.78,1]){const from=FR(m.dark).count;FG.roundBox(FR(m.dark),0,topY*t,topZ*t,.27,.03,.07,.012,{segments:1});}
    {const fr=r+(adv?.2:.055),w=adv?.07:.065,arc=q=>[Math.sin(q)*fr,Math.cos(q)*fr],qs=adv?[-.5,.1,.9]:[-.75,.05,.95],net=[-1,0,1].map(sx=>qs.map((q,i)=>{const[zz,yy]=arc(q);return[sx*w*(i===1?1:.75),yy-(sx?.022:0)-(adv?(i===2?.1:0):0),zz+(adv&&i===2?.12:0)];}));skin(FR(m.body),net,sg(4,2),sg(12,5));}
    // Frame, swingarm and engine.
    const headY=r+topY,headZ=half+topZ,pivotY=.44,pivotZ=-.1;
    for(const side of[-1,1]){const x=side*.1;if(!scooter){pipe(S(m.dark),[[x*.4,headY-.04,headZ-.04],[x*1.3,.82,.2],[x*1.2,.62,-.06],[x,pivotY,pivotZ]],.024,8);pipe(S(m.dark),[[x*1.1,.66,-.05],[x,seatY-.07,-.35],[x*.7,seatY-.02,-half*.82]],.018,6);pipe(S(m.dark),[[x,pivotY+.06,-.14],[x*.8,seatY-.09,-half*.7]],.014,6);}
      beam(S(scooter?m.dark:m.metal),[side*.12,pivotY,pivotZ],[side*.13,r,-half],.03,.06,.012);pipe(S(m.dark),[[side*.1,.44,-.08],[side*.3,.44,-.08]],.012,6);FG.roundBox(S(m.metal),side*.29,.44,-.08,.09,.02,.05,.006,{segments:1});}
    drum(S(m.metal),-.115,r,-half,.1,.008,sg(22,10));pipe(S(m.dark),[[-.115,r+.1,-half],[-.115,pivotY+.05,pivotZ+.04]],.008,4);pipe(S(m.dark),[[-.115,r-.1,-half],[-.115,pivotY-.05,pivotZ+.04]],.008,4);
    if(!scooter){FG.roundBox(S(m.dark),0,.43,.1,.3,.3,.38,.05,{segments:2});FG.roundBox(S(m.trim),0,.6,.14,.26,.12,.26,.03,{segments:1});if(naked||adv)for(let k=0;k<5;k++)FG.roundBox(S(m.metal),0,.56+k*.026,.16,.3,.008,.3,.003,{segments:1});for(const side of[-1,1])drum(S(m.trim),side*.16,.4,.02,.11,.03,sg(18,8));
      // Rear shock and a radiator ahead of the engine.
      pipe(S(sport?gold:m.red),[[0,.68,-.2],[0,.5,-.3]],.03,8);if(sport||adv)FG.roundBox(S(m.dark),0,.58,.36,.3,.22,.03,.01,{segments:1});}
    // Bodywork by type.
    if(scooter){
      // Step-through: a leg shield under the bars, a flat floor and a body under the seat.
      both(m.body,[[[.04,1.02,.5],[.16,.95,.42],[.2,.6,.4]],[[.03,.8,.6],[.2,.72,.5],[.23,.42,.44]],[[.03,.45,.62],[.19,.38,.52],[.2,.3,.42]]],sg(6,3),sg(8,4));
      skin(S(m.body),[[[-.04,1.02,.5],[.04,1.02,.5]],[[-.03,.8,.6],[.03,.8,.6]],[[-.03,.45,.62],[.03,.45,.62]]],2,sg(8,4));
      FG.roundBox(S(m.trim),0,.31,.1,.44,.05,.62,.02,{segments:1});
      loft(stat,m.body,[[-.78,.16,.42,.66,.7],[-.5,.24,.36,.7,.74],[-.2,.24,.33,.66,.7],[-.02,.17,.33,.5,.54]]);
      // V3.6: a solo seat. A second rider still sits behind, on the painted tail.
      loft(stat,m.seat,[[-.46,.13,seatY-.08,seatY-.03,seatY-.008],[-.34,.19,seatY-.08,seatY-.025,seatY],[-.15,.17,seatY-.08,seatY-.03,seatY-.012],[.0,.09,seatY-.09,seatY-.05,seatY-.03]]);
      pipe(S(m.metal),[[-.15,seatY-.06,-.55],[-.2,seatY-.02,-.8],[0,seatY-.01,-.86],[.2,seatY-.02,-.8],[.15,seatY-.06,-.55]],.012,6);
      FG.roundBox(S(m.dark),0,.42,-.42,.3,.2,.5,.05,{segments:1});
    }else{
      // Tank, seat and tail.
      const from=S(m.body).count;FG.ellipsoid(S(m.body),0,.89,.13,adv?.19:.165,.11,adv?.3:.27,{nu:sg(22,8),nv:sg(14,6),warp:(x,y,z,o)=>{o[0]=x*(1-.3*Math.max(0,-z)-.12*Math.max(0,-y));o[1]=y<0?y*.75:y*(1-.25*Math.max(0,-z));o[2]=z;}});
      drum(S(chrome),0,.995,.2,.03,.012,sg(12,6));
      const tailZ=-half*(sport?.9:.98),tailY=sport?seatY+.16:seatY+.02;
      // V3.6: a solo seat; the tail cowl starts right behind it.
      loft(stat,m.seat,[[-.34,.12,seatY-.06,seatY-.015,seatY+(sport?.03:0)],[-.24,.15,seatY-.07,seatY-.025,seatY-.005],[-.08,.14,seatY-.07,seatY-.03,seatY-.012],[.03,.07,seatY-.06,seatY-.03,seatY-.015]]);
      skin(S(m.body),[[[-.11,seatY-.06,-.31],[-.115,seatY-.015,-.5],[-.04,tailY-.03,tailZ]],[[0,seatY+.012,-.35],[0,seatY+.04,-.55],[0,tailY,tailZ-.03]],[[.11,seatY-.06,-.31],[.115,seatY-.015,-.5],[.04,tailY-.03,tailZ]]],sg(6,3),sg(8,4));
      both(m.body,[[[.105,seatY-.03,-.2],[.115,seatY-.02,-.45],[.06,tailY-.04,tailZ+.02]],[[.12,seatY-.14,-.2],[.12,seatY-.12,-.44],[.05,tailY-.09,tailZ+.06]]],sg(6,3),sg(4,2));
      skin(S(m.dark),[[[-.08,r+.14,-half+.34],[-.09,r+.085,-half],[-.07,r+.02,-half-.3]],[[.08,r+.14,-half+.34],[.09,r+.085,-half],[.07,r+.02,-half-.3]]],2,sg(10,5));
      if(sport){
        // Full fairing: a nose that carries the lamps and screen, side panels down to a belly pan.
        both(m.body,[[[.03,1.06,.74],[.16,1.0,.52],[.17,.9,.3]],[[.1,.95,.8],[.25,.82,.5],[.2,.72,.1]],[[.09,.7,.72],[.26,.55,.46],[.2,.5,.05]],[[.07,.36,.6],[.2,.3,.3],[.15,.3,-.18]]],sg(8,4),sg(12,5));
        skin(S(m.body),[[[-.03,1.06,.74],[.03,1.06,.74]],[[-.1,.95,.8],[.1,.95,.8]],[[-.09,.7,.72],[.09,.7,.72]],[[-.07,.36,.6],[.07,.36,.6]]],2,sg(10,5));
        skin(S(m.glass),[[[-.13,1.04,.6],[0,1.07,.68],[.13,1.04,.6]],[[-.11,1.2,.46],[0,1.25,.5],[.11,1.2,.46]]],sg(6,3),sg(4,2));
        FG.roundBox(S(m.dark),0,.3,.1,.22,.03,.5,.012,{segments:1});
        if(superbike)for(const side of[-1,1])skin(S(m.trim),[[[side*.24,.8,.58],[side*.24,.78,.36]],[[side*.4,.74,.5],[side*.38,.73,.34]]],2,2);
      }else if(adv){
        // Tall screen, a beak under the lamp, crash bars, a bash plate and luggage.
        skin(S(m.glass),[[[-.18,1.02,.58],[0,1.04,.63],[.18,1.02,.58]],[[-.15,1.42,.47],[0,1.46,.5],[.15,1.42,.47]]],sg(6,3),sg(5,2));
        skin(S(m.body),[[[-.09,.98,.56],[0,1.0,.6],[.09,.98,.56]],[[-.075,.92,.72],[0,.94,.77],[.075,.92,.72]],[[-.04,.86,.86],[0,.87,.9],[.04,.86,.86]]],sg(6,3),sg(8,4));
        both(m.body,[[[.12,.98,.5],[.2,.92,.3],[.19,.86,.08]],[[.15,.78,.52],[.24,.72,.3],[.2,.7,.06]]],sg(6,3),sg(4,2));
        for(const side of[-1,1]){pipe(S(m.trim),[[side*.14,.74,.4],[side*.3,.62,.3],[side*.3,.4,.2],[side*.16,.3,.1]],.014,6);FG.roundBox(S(m.trim),side*.3,.74,-.6,.17,.3,.44,.04,{segments:2});}
        FG.roundBox(S(m.trim),0,.26,.08,.36,.03,.56,.012,{segments:1});FG.roundBox(S(m.trim),0,.93,-.78,.4,.03,.36,.012,{segments:1});
      }
    }
    // Handlebar with grips, levers and an instrument pod; it turns with the steering.
    const handle=new T.Group();handle.position.set(0,sport?.95:1.02,.47);group.add(handle);const H=mat=>sh(handle,mat);
    if(sport)for(const side of[-1,1])pipe(H(m.dark),[[side*.07,-.02,.02],[side*.2,-.03,-.005],[side*.35,.01,0]],.014,6);else pipe(H(chrome),[[-.35,.01,0],[-.2,.0,-.01],[-.08,-.06,-.02],[.08,-.06,-.02],[.2,.0,-.01],[.35,.01,0]],.013,6);
    for(const side of[-1,1]){drum(H(m.rubber),side*.29,.01,0,.019,.12,10);pipe(H(m.metal),[[side*.2,.02,.03],[side*.27,.012,.055],[side*.36,.012,.06]],.005,4);if(adv)skin(H(m.dark),[[[side*.2,.05,.07],[side*.38,.05,.06]],[[side*.21,-.03,.1],[side*.38,-.04,.08]]],2,2);}
    FG.roundBox(H(m.dark),0,.045,.03,.17,.075,.05,.014,{segments:1});FG.roundBox(H(m.glass),0,.05,.004,.13,.05,.004,.002,{segments:1});parts.handlebar=handle;
    // Lamp, exhaust, plate and mirrors can each be knocked off.
    const lamp=new T.Group();group.add(lamp);{const z=scooter?.635:sport?.79:adv?.63:.58,y=scooter?.9:sport?.93:1.0;
      if(sport){for(const side of[-1,1])skin(sh(lamp,m.head),[[[side*.03,y+.03,z+.005],[side*.12,y+.05,z-.04]],[[side*.03,y-.015,z+.012],[side*.11,y+.01,z-.03]]],2,2);}
      else if(adv){FG.roundBox(sh(lamp,m.dark),0,y,z-.02,.2,.12,.06,.02,{segments:1});FG.roundBox(sh(lamp,m.head),0,y,z+.012,.17,.09,.012,.008,{segments:1});}
      else{const from=sh(lamp,scooter?m.body:chrome).count,shell=sh(lamp,scooter?m.body:chrome);FG.lathe(shell,[[0,-.09],[.06,-.08],[.092,-.02],[.095,.03],[0,.03]],{sides:sg(20,8),smooth:false});shell.transform(from,new T.Matrix4().makeTranslation(0,y,z).multiply(new T.Matrix4().makeRotationX(Math.PI/2)));const f2=sh(lamp,m.head).count,lens=sh(lamp,m.head);FG.lathe(lens,[[0,.045],[.06,.04],[.086,.03],[0,.03]],{sides:sg(20,8),smooth:false});lens.transform(f2,new T.Matrix4().makeTranslation(0,y,z).multiply(new T.Matrix4().makeRotationX(Math.PI/2)));}}
    const exhaust=new T.Group();group.add(exhaust);{const ey=sport?.52:adv?.62:.4,ez=sport?-.52:-half*.92,can=sh(exhaust,chrome),from=can.count;pipe(sh(exhaust,m.metal),scooter?[[.14,.4,-.2],[.2,.38,-.5]]:[[.1,.42,.3],[.17,.3,.16],[.2,.32,-.2],[.21,ey-.03,ez+.3]],.022,7);
      FG.lathe(can,[[0,-.2],[.035,-.2],[.055,-.15],[.058,.16],[.045,.2],[.03,.2],[.028,.15],[0,.15]],{sides:sg(16,8),smooth:false});can.transform(from,new T.Matrix4().makeTranslation(.22,ey,ez).multiply(new T.Matrix4().makeRotationX(Math.PI/2+(sport?-.35:adv?-.25:0))));}
    const plate=new T.Group();group.add(plate);FG.roundBox(sh(plate,m.white),0,.55,-half*1.1,.19,.1,.008,.004,{segments:1});FG.roundBox(sh(plate,m.dark),0,.6,-half*1.08,.06,.14,.03,.01,{segments:1});
    FG.roundBox(S(m.tail),0,scooter?seatY-.06:sport?seatY+.1:seatY-.03,scooter?-.87:-half*(sport?.92:1.0)-.01,scooter?.16:.1,.035,.02,.008,{segments:1});
    const mirrors=[];for(const side of[-1,1]){const mg=new T.Group();group.add(mg);const hy=sport?1.0:1.03;pipe(sh(mg,m.dark),sport?[[side*.2,.98,.62],[side*.3,1.06,.6]]:[[side*.27,hy,.47],[side*.29,hy+.12,.44],[side*.33,hy+.2,.42]],.008,5);const pod=sh(mg,m.dark),px=side*(sport?.33:.34),py=sport?1.08:hy+.22,pz=sport?.59:.415;FG.ellipsoid(pod,px,py,pz,.075,.042,.03,{nu:sg(12,6),nv:sg(8,4)});FG.roundBox(sh(mg,m.glass),px,py,pz-.028,.11,.055,.004,.002,{segments:1});mirrors.push(mg);}
    // Shapes become meshes on their own parents.
    for(const[parent,map]of bins)for(const[mat,shape]of map)if(shape.triangles)shapeMesh(shape,mat,parent);
    breakaway(parts,lamp,'headlamp',.48);breakaway(parts,exhaust,'exhaust',.37);breakaway(parts,plate,'rear-plate',.62);breakaway(parts,mirrors[0],'mirror-left',.86);breakaway(parts,mirrors[1],'mirror-right',.75);
    group.remove(stat);group.add(mergeStatic(stat));
  }

  // ---- V3 aircraft -----------------------------------------------------------------------------------------
  // Fuselages, nacelles and booms are skins drawn through stations; wings, tails and blades are aerofoil
  // sections. The parts the game animates keep their old places in `parts`.
  const SH=()=>new FG.Shape(),herm=CB.hermite;
  // A grid of nu x nv cells over fn(u,v,out); pick(x,y,z,u,v) says which Shape each cell belongs to (or none).
  function skinGrid(nu,nv,fn,pick){
    const pts=[],out={x:0,y:0,z:0};for(let j=0;j<=nv;j++){const row=[];for(let i=0;i<nu;i++){fn(i/nu,j/nv,out);row.push([out.x,out.y,out.z]);}pts.push(row);}
    const maps=new Map(),id=(sh,j,i)=>{let mp=maps.get(sh);if(!mp)maps.set(sh,mp=new Map());const k=j*4096+i%nu;let v=mp.get(k);if(v===undefined){const p=pts[j][i%nu];v=sh.vertex(p[0],p[1],p[2]);mp.set(k,v);}return v;};
    for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=pts[j][i],e=pts[j+1][(i+1)%nu],f=pts[j][(i+1)%nu],g=pts[j+1][i],sh=pick((a[0]+e[0]+f[0]+g[0])/4,(a[1]+e[1]+f[1]+g[1])/4,(a[2]+e[2]+f[2]+g[2])/4,(i+.5)/nu,(j+.5)/nv);if(!sh)continue;const v0=id(sh,j,i),v1=id(sh,j,i+1),v2=id(sh,j+1,i),v3=id(sh,j+1,i+1);sh.i.push(v0,v1,v2,v1,v3,v2);}
  }
  // stations: [z, halfWidth, bottom, top, squareness] from tail to nose. The skin starts under the belly and runs
  // round the section; pick gets w, which is 0 along the top and 1 along the belly. With o.edge(z) (an angle from
  // the top) the line w = .5 follows that angle, so glass can end on a clean curve instead of in steps.
  function pod(stations,pick,o={}){
    const col=k=>stations.map(a=>a[k]??2.3),Z=col(0),W=col(1),B=col(2),Tp=col(3),E=col(4),z0=Z[0],z1=Z[Z.length-1],ox=o.x||0,nu=o.nu||steps(28,12),nv=o.nv||Math.max(stations.length*2,steps(Math.ceil((z1-z0)/(o.cell||.11)),8)),edge=o.edge;
    const angle=(z,w)=>{if(!edge)return w*Math.PI;const e=edge(z);return w<.5?w*2*e:e+(w-.5)*2*(Math.PI-e);};
    const at=(z,w,side,out)=>{const hw=Math.max(.004,herm(Z,W,z)),b=herm(Z,B,z),t=Math.max(b+.008,herm(Z,Tp,z)),e=2/Math.max(1.6,herm(Z,E,z)),a=Math.PI/2+side*angle(z,w),c=Math.cos(a),sn=Math.sin(a);out.x=ox+hw*Math.sign(c)*Math.pow(Math.abs(c),e);out.y=(b+t)/2+(t-b)/2*Math.sign(sn)*Math.pow(Math.abs(sn),e);out.z=z;return out;};
    skinGrid(nu,nv,(u,v,out)=>at(z0+(z1-z0)*v,Math.abs(u-.5)*2,u<.5?-1:1,out),typeof pick==='function'?(x,y,z,u)=>pick(x,y,z,Math.abs(u-.5)*2):()=>pick);return at;
  }  // An aerofoil from p0 to p1. The chord lies along z, the thickness is square to the span.
  function airfoil(shape,p0,p1,c0,c1,o={}){
    const thick=o.thick??.12,camber=o.camber??0,sx=p1[0]-p0[0],sy=p1[1]-p0[1],sz=p1[2]-p0[2];let nx=sy,ny=-sx;const nl=Math.hypot(nx,ny)||1;nx/=nl;ny/=nl;if(ny<0||(ny===0&&nx<0)){nx=-nx;ny=-ny;}
    const v0=shape.count,i0=shape.i.length;
    FG.grid(shape,o.nu||steps(18,8),o.nv||steps(10,4),(u,v,out)=>{const round=o.round===false?1:v>.92?Math.sqrt(Math.max(.03,1-Math.pow((v-.92)/.08,2))):1,c=mix(c0,c1,v)*round,a=u*TAU,cs=Math.cos(a),sn=Math.sin(a),yt=c*thick*.5*sn*(1+.55*cs)/1.12+camber*c*(1-cs*cs);out.x=p0[0]+sx*v+nx*yt;out.y=p0[1]+sy*v+ny*yt;out.z=p0[2]+sz*v+c*.5*cs;},{closeU:true,poleEnd:o.round!==false});
    shape.orient(v0,i0);return shape;
  }
  const flush=(shape,mat,parent)=>shape.triangles?shapeMesh(shape,mat,parent):null;
  // Propeller: twisted blades with pale tips, a spinner and the blur disc the game shows at speed.
  function airscrew(parent,parts,m,x,y,z,radius,blades=3){
    const p=new T.Group();p.position.set(x,y,z);parent.add(p);const sh=SH(),tips=SH(),spin=SH();
    for(let k=0;k<blades;k++){const turn=new T.Matrix4().makeRotationZ(k/blades*TAU).multiply(new T.Matrix4().makeRotationY(1.05));let from=sh.count;airfoil(sh,[0,radius*.1,0],[0,radius*.86,0],radius*.19,radius*.12,{thick:.15,round:false,nu:steps(10,6),nv:steps(6,3)});sh.transform(from,turn);from=tips.count;airfoil(tips,[0,radius*.86,0],[0,radius,0],radius*.12,radius*.09,{thick:.15,nu:steps(10,6),nv:steps(4,3)});tips.transform(from,turn);}
    FG.lathe(spin,[[0,radius*.36],[radius*.07,radius*.3],[radius*.14,radius*.14],[radius*.17,0],[radius*.17,-radius*.06],[0,-radius*.06]],{sides:steps(16,8)});spin.transform(0,new T.Matrix4().makeRotationX(Math.PI/2));
    flush(sh,m.dark,p);flush(tips,m.white,p);flush(spin,m.metal,p);
    const disc=mesh(new T.CircleGeometry(radius,24),material(0xaebbbc,.6,0,{transparent:true,opacity:.09,side:T.DoubleSide,depthWrite:false}),p);parts.props.push(p);parts.blur.push(disc);return p;
  }
  function gearWheel(parent,parts,m,x,y,z,r,front,width){
    const pivot=new T.Group();pivot.position.set(x,y,z);parent.add(pivot);const spin=new T.Group();pivot.add(spin);const tyre=SH(),hub=SH(),hw=width/2;
    FG.lathe(tyre,[[r*.5,-hw*.9],[r*.8,-hw],[r*.97,-hw*.7],[r,0],[r*.97,hw*.7],[r*.8,hw],[r*.5,hw*.9]],{sides:steps(20,10)});FG.lathe(hub,[[0,-hw*.8],[r*.5,-hw*.92],[r*.52,hw*.92],[0,hw*.8]],{sides:steps(14,8),smooth:false});
    for(const[s,mat]of[[tyre,m.rubber],[hub,m.rim]]){const g=s.geometry();g.deleteAttribute('color');g.rotateZ(Math.PI/2);const o=new T.Mesh(g,mat);o.castShadow=true;spin.add(o);}
    parts.wheels.push({pivot,spin,front,baseY:y});return pivot;
  }
  function plane(group,d,m,parts){
    const stat=new T.Group();group.add(stat);const l=d.dimensions.length,span=d.dimensions.width,b=d.bodyWidth,half=b*.5,s=d.silhouette,jet=s==='jet',single=s==='trainer'||s==='aerobatic',high=s==='trainer'||s==='cargo-prop',cargo=s==='cargo-prop',fixed=!d.retractable;
    const roofY=(d.cabinRoofY||2.26)-.03,cz=d.seats[0].position.z,rows=Math.ceil(d.seats.length/2),floor=.74,cowl=1.44,cabinRear=Math.min(cz-(rows-1)*.95-.62,single?1e9:-l*.08),noseZ=l*.5-(single?.14:0),H=d.dimensions.height;
    const body=SH(),glass=SH(),stripe=SH(),dark=SH(),metal=SH(),white=SH(),red=SH(),green=SH(),lamp=SH(),p={x:0,y:0,z:0};
    // Fuselage, with the screen, the side windows and a colour band cut into the same skin.
    const st=[[-l*.495,.035,1.36,1.44,2],[-l*.47,.07,1.30,1.50,2],[-l*.33,half*.42,1.02,1.66,2.2],[cabinRear-.55,half*.86,.82,roofY-.24,2.6],[cabinRear,half,floor,roofY,3],[cz-.2,half,floor-.02,roofY,3],[cz+.28,half*.98,floor,roofY-.02,3],[cz+.98,half*.92,floor+.04,cowl,2.8]];
    if(single)st.push([noseZ-.55,half*.8,.84,cowl-.02,2.6],[noseZ-.1,half*.64,.92,cowl-.08,2.5],[noseZ,half*.36,1.0,1.32,2.3]);
    else if(jet)st.push([l*.5-1.7,half*.8,.82,cowl-.04,2.3],[l*.5-.7,half*.45,.95,1.33,2.1],[l*.5-.15,.14,1.06,1.22,2],[l*.5,.03,1.12,1.17,2]);
    else st.push([l*.5-1.1,half*.78,.84,cowl-.06,2.4],[l*.5-.35,half*.42,.98,1.34,2.2],[l*.5-.05,.12,1.08,1.24,2],[l*.5,.03,1.14,1.2,2]);
    const windows=[];for(let k=1,zc=cz-.95;zc-.3>cabinRear;k++,zc-=.95)windows.push(zc);
    const smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);},sill=z=>mix(1.6,.66,smoothstep(cz+.3,cz+.93,z));
    const skin=pod(st,(x,y,z,w)=>{
      if(z>cz+.3&&z<cz+.93)return w<.5?glass:w>.55&&w<.6?stripe:body;
      if(z>cz-.5&&z<=cz+.3&&w>.27&&w<.5)return glass;
      if(w>.31&&w<.47&&windows.some(zc=>Math.abs(z-zc)<.26))return glass;
      if(z>=cz+.93&&z<noseZ-.25&&w<.42)return dark;
      return w>.55&&w<.6&&z<noseZ-.3&&z>-l*.42?stripe:body;},{nu:steps(36,16),edge:sill});
    // Frames round the screen and the cockpit windows.
    const hoop=(z,r=.017)=>{const pts=[];for(let k=-8;k<=8;k++){skin(z,Math.abs(k)/16,k<0?-1:1,p);pts.push([p.x,p.y,p.z]);}FG.tube(metal,pts,r,{sides:5,segments:steps(20,8)});};
    hoop(cz+.3);hoop(cz-.5,.014);{const pts=[];for(let k=0;k<=6;k++){skin(mix(cz+.3,cz+.93,k/6),0,1,p);pts.push([0,p.y+.004,p.z]);}FG.tube(metal,pts,.014,{sides:5,segments:10});}
    for(const side of[-1,1]){const pts=[];for(let k=0;k<=8;k++){skin(mix(cz-.5,cz+.93,k/8),.5,side,p);pts.push([p.x,p.y,p.z]);}FG.tube(metal,pts,.013,{sides:5,segments:14});}
    // Wings with dihedral, taper and rounded tips; the ailerons are separate so they can deflect.
    const wingY=high?roofY-.05:floor+.2,chord=jet?2.3:cargo?2.2:s==='twin'?1.9:s==='aerobatic'?1.45:1.55,taper=jet?.42:.6,wz=jet?-l*.06:cz-(high?.3:.55),dihedral=high?.012:jet?.05:.07,sweep=jet?1.15:.12,tipY=wingY+span*.5*dihedral;
    for(const side of[-1,1]){airfoil(body,[side*half*.6,wingY,wz],[side*span*.5,tipY,wz-sweep],chord,chord*taper,{thick:.13,camber:.02,nv:steps(14,6)});
      if(jet)airfoil(body,[side*span*.495,tipY,wz-sweep-.12],[side*(span*.5+.14),tipY+.8,wz-sweep-.5],chord*.36,chord*.18,{thick:.1});
      FG.ellipsoid(side<0?red:green,side*span*.5,tipY,wz-sweep+chord*taper*.3,.05,.035,.07,{nu:8,nv:6});
      const f=.76,c=chord*mix(1,taper,f),ac=c*.26,ail=SH();FG.roundBox(ail,0,0,-ac*.5,span*.2,c*.13*.8,ac,.02,{segments:1});const am=shapeMesh(ail,m.trim,group);am.position.set(side*span*.5*f,wingY+span*.5*f*dihedral,wz-sweep*f-c*.5+ac);parts.ailerons.push({mesh:am,side});
      if(high&&single)FG.tube(metal,[[side*half*.92,floor+.14,wz+.12],[side*span*.25,wingY-.07,wz+.02]],[.05,.022],{sides:6,segments:4});}
    // Tail: fin, tailplane, a beacon and a tail light.
    const tz=-l*.415,finTop=H,ty=jet?mix(1.5,finTop,.6):1.5;
    airfoil(body,[0,1.48,tz+.12],[0,finTop,tz-.78],chord*.95,chord*.42,{thick:.1});
    for(const side of[-1,1])airfoil(body,[side*.06,ty,tz-(jet?.42:0)],[side*span*.19,ty+.04,tz-(jet?.42:0)-.32],chord*.6,chord*.34,{thick:.1});
    FG.ellipsoid(red,0,finTop+.03,tz-.78,.045,.05,.06,{nu:8,nv:6});FG.ellipsoid(lamp,0,1.42,-l*.497,.04,.04,.05,{nu:8,nv:6});
    // Engines.
    if(single){for(const side of[-1,1]){FG.ellipsoid(dark,side*half*.32,1.2,noseZ-.02,.1,.06,.05,{nu:10,nv:6});FG.tube(metal,[[side*half*.5,.9,noseZ-.6],[side*half*.56,.82,noseZ-1.0]],.03,{sides:6,segments:3});}airscrew(group,parts,m,0,1.16,noseZ+.07,s==='aerobatic'?.86:.9,s==='aerobatic'?3:2);}
    else if(jet)for(const side of[-1,1]){const ex=side*(half+.44),ez=-l*.27,ey=1.55;pod([[ez-1.0,.2,ey-.2,ey+.2,2],[ez-.6,.3,ey-.3,ey+.3,2],[ez+.5,.33,ey-.33,ey+.33,2],[ez+.95,.29,ey-.29,ey+.29,2],[ez+1.0,.25,ey-.25,ey+.25,2]],body,{x:ex,nu:steps(18,10),cell:.16});
      const inner=SH();FG.lathe(inner,[[.25,0],[.2,-.08],[0,-.3]],{sides:steps(16,8)});inner.transform(0,new T.Matrix4().makeTranslation(ex,ey,ez+1.0).multiply(new T.Matrix4().makeRotationX(Math.PI/2)));dark.append(inner);
      const nozzle=SH();FG.lathe(nozzle,[[.2,0],[.17,.16],[0,.02]],{sides:steps(14,8),smooth:false});nozzle.transform(0,new T.Matrix4().makeTranslation(ex,ey,ez-1.0).multiply(new T.Matrix4().makeRotationX(-Math.PI/2)));metal.append(nozzle);
      FG.roundBox(body,side*(half+.12),ey-.02,ez,.5,.1,.9,.04,{segments:1});}
    else for(const side of[-1,1]){const ex=side*span*.2,ey=wingY+span*.2*dihedral+(high?-.24:.12),ez=wz+chord*.3;pod([[ez-1.5,.05,ey-.05,ey+.05,2],[ez-.9,.24,ey-.26,ey+.2,2.2],[ez+.2,.31,ey-.32,ey+.26,2.4],[ez+.95,.27,ey-.27,ey+.24,2.3],[ez+1.05,.16,ey-.16,ey+.15,2]],body,{x:ex,nu:steps(18,10),cell:.16});
      FG.tube(metal,[[ex+side*.2,ey-.2,ez-.3],[ex+side*.24,ey-.26,ez-.8]],.035,{sides:6,segments:3});airscrew(group,parts,m,ex,ey,ez+1.13,cargo?1.12:1.0,cargo?4:3);}
    // Undercarriage: fixed legs with wheel fairings on the light aircraft, struts that fold away on the others.
    const gear=new T.Group();group.add(gear);const legs=SH(),pants=SH(),mx=fixed?half+.62:Math.max(half+.5,span*.12),mz=wz-.15,noseX=l*.3,wr=fixed?.2:.24;
    FG.tube(legs,[[0,.86,noseX-.05],[0,.24,noseX+.02]],.03,{sides:6,segments:3});gearWheel(gear,parts,m,0,.19,noseX+.02,.19,true,.12);FG.ellipsoid(lamp,0,.62,noseX+.02,.045,.045,.03,{nu:8,nv:6});
    for(const side of[-1,1]){if(fixed)FG.tube(legs,[[side*half*.7,floor+.06,mz],[side*(half+.3),.5,mz],[side*mx,wr+.03,mz]],[.05,.02],{sides:6,segments:8});else{FG.tube(legs,[[side*mx,high?floor+.1:wingY-.04,mz],[side*mx,wr+.02,mz]],.035,{sides:6,segments:3});if(high)FG.tube(legs,[[side*half*.8,floor+.2,mz],[side*mx,wr+.3,mz]],.025,{sides:6,segments:3});}
      gearWheel(gear,parts,m,side*mx,wr,mz,wr,false,.15);
      if(fixed)pod([[mz-.42,.02,wr-.02,wr+.04,2],[mz-.2,.1,wr-.1,wr+.19,2.2],[mz+.12,.11,wr-.12,wr+.23,2.2],[mz+.33,.03,wr-.02,wr+.08,2]],(x,y)=>y>wr-.06?pants:null,{x:side*mx,nu:steps(14,8),cell:.09});}
    if(fixed)pod([[noseX-.36,.02,.17,.23,2],[noseX-.16,.085,.1,.36,2.2],[noseX+.1,.09,.08,.4,2.2],[noseX+.3,.03,.17,.25,2]],(x,y)=>y>.13?pants:null,{nu:steps(14,8),cell:.09});
    flush(legs,m.metal,gear);flush(pants,m.body,gear);parts.gear=gear;
    // Cabin: floor, seats and the panel.
    FG.roundBox(dark,0,floor+.06,(cz+.9+cabinRear)/2,b*.84,.05,cz+.9-cabinRear,.02,{segments:1});
    FG.tube(metal,[[half*.3,cowl-.05,noseZ-(single?.9:1.4)],[half*.3,cowl+.12,noseZ-(single?.9:1.4)]],.008,{sides:4,segments:2});
    for(const[shape,mat]of[[body,m.body],[glass,m.glass],[stripe,m.trim],[dark,m.dark],[metal,m.metal],[white,m.white],[red,m.red],[green,m.blue],[lamp,m.head]])flush(shape,mat,stat);
    d.seats.forEach(a=>seat(stat,m,a));cockpit(group,d,m,parts);
    group.remove(stat);group.add(mergeStatic(stat));
  }
  function helicopter(group,d,m,parts){
    const stat=new T.Group();group.add(stat);const l=d.dimensions.length,w=d.bodyWidth,half=w*.5,large=d.id==='lift',H=d.dimensions.height,roofY=(d.cabinRoofY||2.29)-.03,cz=d.seats[0].position.z,rows=Math.ceil(d.seats.length/2),floor=.52,rear=cz-(rows-1)*.9-.72,noseZ=cz+1.3,hubY=H-.15,radius=d.dimensions.width*.5;
    const body=SH(),glass=SH(),stripe=SH(),dark=SH(),metal=SH(),red=SH(),green=SH(),lamp=SH(),p={x:0,y:0,z:0};
    // Cabin: a rounded pod glazed round the nose and along the sides.
    const windows=[];for(let k=1,zc=cz-.9;k<rows;k++,zc-=.9)windows.push(zc);
    const skin=pod([[rear-1.0,half*.3,1.25,roofY-.3,2.1],[rear-.45,half*.78,.86,roofY-.1,2.5],[rear,half*.98,floor+.05,roofY,2.9],[cz-.1,half,floor,roofY,2.9],[cz+.5,half*.97,floor,roofY-.06,2.7],[noseZ-.45,half*.8,floor+.06,1.72,2.4],[noseZ-.1,half*.42,floor+.24,1.24,2.1],[noseZ,.1,.86,1.02,2]],(x,y,z,w)=>{
      if(z>cz+.42&&z<noseZ-.06)return w<.5?glass:body;
      if(z>cz-.5&&z<=cz+.42&&w>.22&&w<.5)return glass;
      if(w>.26&&w<.42&&windows.some(zc=>Math.abs(z-zc)<.3))return glass;
      return w>.55&&w<.6&&z<cz+.42&&z>rear-.3?stripe:body;},{nu:steps(36,16),edge:z=>mix(1.95,1.55,clamp((z-cz-.42)/(noseZ-cz-.5),0,1))});
    const hoop=(z,r=.018)=>{const pts=[];for(let k=-8;k<=8;k++){skin(z,Math.abs(k)/16,k<0?-1:1,p);pts.push([p.x,p.y,p.z]);}FG.tube(metal,pts,r,{sides:5,segments:steps(20,8)});};
    hoop(cz+.42);hoop(cz-.5,.014);{const pts=[];for(let k=0;k<=6;k++){const z=mix(cz+.42,noseZ-.08,k/6);skin(z,0,1,p);pts.push([0,p.y+.004,z]);}FG.tube(metal,pts,.016,{sides:5,segments:12});}
    // Engine housing behind the mast, with intakes and an exhaust.
    const top=roofY+(large?.46:.3);pod([[rear-1.2,.08,roofY-.2,roofY-.05,2.2],[rear-.6,half*.42,roofY-.25,top-.06,2.6],[-.05,half*.5,roofY-.2,top,2.8],[cz+.1,half*.4,roofY-.12,top-.1,2.6],[cz+.55,.06,roofY-.1,roofY-.02,2.2]],body,{nu:steps(20,10),cell:.14});
    for(const side of[-1,1]){FG.ellipsoid(dark,side*half*.44,(roofY+top)/2,-.3,.05,.11,.2,{nu:10,nv:6});FG.tube(metal,[[side*half*.25,top-.1,rear-.5],[side*half*.3,top-.02,rear-.95]],.05,{sides:8,segments:3});}
    // Tail boom, fins, stabiliser.
    const tailZ=-l*.47,by=1.62;pod([[tailZ,.07,by+.03,by+.17,2],[rear-1.6,.13,by-.08,by+.2,2],[rear-.7,.2,by-.22,by+.2,2]],body,{nu:steps(14,8),cell:.25});
    airfoil(body,[0,by+.05,tailZ+.25],[0,by+.95,tailZ-.12],.75,.36,{thick:.12});airfoil(body,[0,by+.02,tailZ+.3],[0,by-.5,tailZ+.05],.6,.3,{thick:.12});FG.tube(metal,[[0,by-.48,tailZ+.05],[0,by-.62,tailZ-.1]],.014,{sides:4,segments:2});
    for(const side of[-1,1])airfoil(body,[side*.05,by+.08,-l*.36],[side*(large?1.15:.8),by+.08,-l*.36-.06],.5,.32,{thick:.1});
    FG.ellipsoid(red,0,by+1.0,tailZ-.12,.04,.045,.05,{nu:8,nv:6});FG.roundBox(metal,.1,by+.33,tailZ+.03,.14,.16,.2,.04,{segments:1});
    // Skids on curved cross tubes.
    const sx=half+.3,z0=rear-.25,z1=cz+.95;
    for(const side of[-1,1]){FG.tube(metal,[[side*sx,.17,z0-.25],[side*sx,.1,z0],[side*sx,.1,z1],[side*sx,.2,z1+.3],[side*sx,.4,z1+.5]],.045,{sides:8,segments:steps(18,8)});FG.ellipsoid(side<0?red:green,side*half*.98,1.0,cz+.2,.03,.04,.06,{nu:8,nv:6});}
    for(const z of[mix(z0,z1,.2),mix(z0,z1,.78)])FG.tube(metal,[[-sx,.14,z],[-half*.75,.42,z],[0,.56,z],[half*.75,.42,z],[sx,.14,z]],.035,{sides:8,segments:steps(16,8)});
    FG.ellipsoid(lamp,0,floor+.14,noseZ-.45,.06,.05,.05,{nu:8,nv:6});if(large)FG.tube(metal,[[0,floor+.02,-.1],[0,floor-.14,-.1]],.02,{sides:5,segments:2});
    // Mast and hub (fixed), then the rotors the game turns.
    FG.tube(metal,[[0,top-.1,-.02],[0,hubY-.02,-.02]],.06,{sides:10,segments:3});{const from=metal.count;FG.lathe(metal,[[.07,0],[.2,.02],[.2,.06],[.07,.08]],{sides:steps(16,8),smooth:false});metal.transform(from,new T.Matrix4().makeTranslation(0,mix(top,hubY,.45),-.02));}
    FG.roundBox(dark,0,floor+.05,(cz+.7+rear)/2,w*.84,.05,cz+.7-rear,.02,{segments:1});
    for(const[shape,mat]of[[body,m.body],[glass,m.glass],[stripe,m.trim],[dark,m.dark],[metal,m.metal],[red,m.red],[green,m.blue],[lamp,m.head]])flush(shape,mat,stat);
    d.seats.forEach(a=>seat(stat,m,a));cockpit(group,d,m,parts);
    const main=new T.Group();main.position.set(0,hubY,-.02);group.add(main);{const blades=SH(),hub=SH(),tips=SH(),count=large?4:3;
      for(let k=0;k<count;k++){const turn=new T.Matrix4().makeRotationY(k/count*TAU);let from=blades.count;airfoil(blades,[.3,0,0],[radius*.93,-.07,0],large?.34:.26,large?.3:.22,{thick:.1,round:false,nu:steps(10,6),nv:steps(8,3)});blades.transform(from,turn);from=tips.count;airfoil(tips,[radius*.93,-.07,0],[radius,-.075,0],large?.3:.22,large?.22:.16,{thick:.1,nu:steps(10,6),nv:steps(4,3)});tips.transform(from,turn);from=hub.count;FG.roundBox(hub,.2,0,0,.34,.06,.12,.02,{segments:1});hub.transform(from,turn);}
      FG.lathe(hub,[[0,.1],[.09,.08],[.13,.02],[.13,-.05],[0,-.05]],{sides:steps(14,8)});flush(blades,m.dark,main);flush(tips,m.white,main);flush(hub,m.metal,main);}
    parts.mainRotor=main;const blur=mesh(new T.CircleGeometry(radius,32),material(0xaebfc0,.65,0,{transparent:true,opacity:.085,side:T.DoubleSide,depthWrite:false}),main);blur.rotation.x=-Math.PI/2;parts.blur.push(blur);
    const tail=new T.Group();tail.position.set(.2,by+.33,tailZ+.03);tail.rotation.y=Math.PI/2;group.add(tail);{const blades=SH(),hub=SH(),r=large?.95:.62;for(let k=0;k<2;k++){const from=blades.count;airfoil(blades,[0,.06,0],[0,r,0],.15,.11,{thick:.12,nu:steps(8,6),nv:steps(5,3)});blades.transform(from,new T.Matrix4().makeRotationZ(k*Math.PI).multiply(new T.Matrix4().makeRotationY(1.25)));}FG.lathe(hub,[[0,.05],[.05,.03],[.05,-.03],[0,-.05]],{sides:8});hub.transform(0,new T.Matrix4().makeRotationX(Math.PI/2));flush(blades,m.dark,tail);flush(hub,m.metal,tail);}
    parts.tailRotor=tail;
    const wash=mesh(new T.RingGeometry(.5,2,24),m.wake,group,0,.055,0);wash.rotation.x=-Math.PI/2;parts.downwash=wash;group.remove(stat);group.add(mergeStatic(stat));
  }
  // ---- V3 boats --------------------------------------------------------------------------------------------
  // A planing hull: V bottom, hard chine, flared topsides, a rising sheer and a fine bow. f runs 0 (transom) to 1 (stem).
  function hullForm(l,beam,draft,o={}){
    const fb=o.freeboard??.55,rise=o.rise??.3,fine=o.fine??2.4,stern=o.stern??.9,ox=o.x||0,sm=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);},zOf=f=>-l/2+l*f;
    const B=f=>Math.max(.03,beam*.5*(f<.5?mix(stern,1,sm(0,.5,f)):1-Math.pow((f-.5)/.5,fine))),S=f=>fb+rise*f*f,K=f=>mix(-draft,S(f)-.03,Math.pow(sm(.68,1,f),1.4)),Cy=f=>mix(-draft*.3,S(f)-.2,sm(.5,1,f)),Cx=f=>B(f)*mix(.84,.6,sm(.6,1,f));
    const at=(f,s,side,out)=>{const cx=Cx(f),cy=Cy(f);if(s<.5){const t=s*2;out.x=ox+side*cx*t;out.y=mix(K(f),cy,Math.pow(t,1.15));}else{const t=(s-.5)*2;out.x=ox+side*mix(cx,B(f),Math.pow(t,.8));out.y=mix(cy,S(f),t);}out.z=zOf(f);return out;};
    return{B,S,K,zOf,at,x:ox};
  }
  function sheet(shape,nu,nv,fn,ref){const v0=shape.count,i0=shape.i.length;FG.grid(shape,nu,nv,fn,{});shape.orient(v0,i0,ref);return shape;}
  // Hull skin with a transom, the cockpit liner from the transom to fd, and the foredeck beyond it.
  function hullSkin(form,hull,deck,sole,fd){
    const ox=form.x,out={x:0,y:0,z:0};sheet(hull,steps(20,10),steps(44,18),(u,v,o)=>form.at(v,Math.abs(u-.5)*2,u<.5?-1:1,o),(x,y)=>[x-ox,y-.45,0]);
    {const v0=hull.count,i0=hull.i.length,n=steps(16,8);hull.vertex(ox,form.S(0)*.4,form.zOf(0));for(let k=0;k<=n;k++){const u=k/n;form.at(0,Math.abs(u-.5)*2,u<.5?-1:1,out);hull.vertex(out.x,out.y,out.z);}for(let k=0;k<n;k++)hull.i.push(v0,v0+1+k,v0+2+k);hull.orient(v0,i0,()=>[0,0,-1]);}
    if(deck){sheet(deck,steps(14,8),steps(26,10),(u,v,o)=>{const f=v*fd,t=Math.abs(u-.5)*2,side=u<.5?-1:1,b=form.B(f)-.05,top=form.S(f)-.012;o.x=ox+side*b*(t<.8?t/.8*.9:mix(.9,1,(t-.8)/.2));o.y=sole+(top-sole)*(t<.8?0:Math.pow((t-.8)/.2,1.3));o.z=form.zOf(f);},(x)=>[-(x-ox)*.4,1,0]);
      sheet(deck,steps(10,6),steps(16,8),(u,v,o)=>{const f=mix(fd,1,v),b=form.B(f)-.02;o.x=ox+(u-.5)*2*b;o.y=form.S(f)+.05*(1-Math.pow(2*u-1,2));o.z=form.zOf(f);},()=>[0,1,0]);
      const zb=form.zOf(fd),hb=form.B(fd)-.06,top=form.S(fd);FG.roundBox(deck,ox,(sole+top)/2,zb+.02,hb*2,top-sole+.04,.07,.02,{segments:1});}
  }
  const rail=(shape,form,r,lift=.02,f0=0,f1=1)=>{const pts=[];for(const side of[-1,1]){const n=14;for(let k=0;k<=n;k++){const f=mix(f0,f1,(side<0?k:n-k)/n);pts.push([form.x+side*form.B(f),form.S(f)+lift,form.zOf(f)]);}}FG.tube(shape,pts,r,{sides:steps(8,5),segments:steps(56,20)});};
  function outboard(stat,group,parts,m,x,l,size=1){
    const cowl=SH(),leg=SH(),z=-l*.5-.16*size;pod([[z-.26*size,.05,.5,.62,2.4],[z-.18*size,.15*size,.3,.82*size+.1,2.6],[z+.1*size,.17*size,.28,.86*size+.1,2.6],[z+.24*size,.06,.42,.7,2.4]],cowl,{x,nu:steps(14,8),cell:.08});
    FG.roundBox(leg,x,.05,z,.1*size,.56,.2*size,.03,{segments:1});FG.roundBox(leg,x,-.3,z-.04,.05,.05,.36*size,.02,{segments:1});FG.roundBox(leg,x,.34,z+.2,.26*size,.1,.14,.03,{segments:1});flush(cowl,m.dark,stat);flush(leg,m.metal,stat);
    const prop=new T.Group();prop.position.set(x,-.32,z-.2*size);group.add(prop);const blades=SH();for(let a=0;a<3;a++){const from=blades.count;airfoil(blades,[0,.03,0],[0,.17*size,0],.11*size,.09*size,{thick:.14,nu:6,nv:3});blades.transform(from,new T.Matrix4().makeRotationZ(a*TAU/3).multiply(new T.Matrix4().makeRotationY(1.0)));}flush(blades,m.metal,prop);parts.props.push(prop);
  }
  // Wheelhouses and cabins: a boxy skin with a band of real glass, so the helm can see out.
  function deckhouse(shapes,x,z0,z1,halfW,y0,y1,o={}){
    const rake=o.rake??.55,back=o.back??.12,sill=o.sill??(y0+(y1-y0)*.5),edge=Math.acos(clamp((sill-(y0+y1)/2)/((y1-y0)/2),-1,1)**1.5)||1.5;
    return pod([[z0-back,halfW*.5,y0,y1-.12,3],[z0,halfW,y0,y1,4],[z1-rake,halfW,y0,y1,4],[z1-.04,halfW*.86,y0,sill+.04,3.4],[z1,halfW*.5,y0,sill-.2,3]],(px,py,pz,w)=>{
      if(pz>z1-rake&&pz<z1-.03)return w<.5?shapes.glass:shapes.white;
      if(pz>z0+.14&&pz<=z1-rake&&w>.24&&w<.5&&(!o.posts||o.posts.every(zp=>Math.abs(pz-zp)>.07)))return shapes.glass;
      if(pz<=z0+.02&&pz>z0-back&&w>.1&&w<.5&&o.rearGlass)return shapes.glass;
      return shapes.white;},{x,nu:steps(32,16),cell:o.cell||.12,edge:()=>edge});
  }
  function jetski(group,stat,d,m,parts){
    const w=d.dimensions.width,l=d.dimensions.length,body=SH(),dark=SH(),seatS=SH(),metal=SH(),lamp=SH(),two=d.seats.length>1;
    pod([[-l*.5,w*.2,-.02,.3,2.6],[-l*.46,w*.4,-.1,.36,3],[-l*.2,w*.5,-.2,.42,3],[l*.12,w*.47,-.18,.5,2.8],[l*.36,w*.28,-.04,.56,2.4],[l*.47,w*.1,.2,.5,2.2],[l*.5,.02,.33,.42,2]],(x,y,z,k)=>k>.56?dark:body,{nu:steps(28,12),cell:.08});
    pod([[.02,w*.2,.44,.6,2.4],[.3,w*.27,.44,.84,2.5],[.62,w*.25,.46,.8,2.5],[l*.36,w*.12,.5,.62,2.2],[l*.42,.02,.52,.56,2]],(x,y,z,k)=>k<.3&&z>.3&&z<.7?dark:body,{nu:steps(20,10),cell:.08});
    pod([[-l*.44,.1,.36,.5,2.4],[-l*.4,.19,.36,.66,2.6],[-.5,.2,.38,.68,2.6],[.0,.18,.4,.66,2.6],[.2,.12,.42,.58,2.4]],seatS,{nu:steps(16,8),cell:.1});
    for(const side of[-1,1]){FG.roundBox(dark,side*w*.36,.3,-.2,.2,.05,l*.5,.02,{segments:1});FG.tube(metal,[[side*w*.2,.82,.5],[side*w*.36,.92,.42]],.012,{sides:5,segments:2});FG.ellipsoid(dark,side*w*.38,.94,.42,.06,.04,.02,{nu:8,nv:6});}
    FG.ellipsoid(lamp,0,.62,l*.38,.09,.03,.04,{nu:8,nv:6});{const from=dark.count;FG.lathe(dark,[[.1,0],[.11,.16],[.08,.2]],{sides:steps(12,8),smooth:false});dark.transform(from,new T.Matrix4().makeTranslation(0,.02,-l*.5-.02).multiply(new T.Matrix4().makeRotationX(-Math.PI/2)));}
    FG.tube(dark,[[0,.56,.5],[0,.84,.44]],.045,{sides:8,segments:3});
    for(const[shape,mat]of[[body,m.body],[dark,m.dark],[seatS,m.seat],[metal,m.metal],[lamp,m.head]])flush(shape,mat,stat);
    const bar=new T.Group();bar.position.set(0,.84,.43);group.add(bar);const bs=SH(),grips=SH();FG.tube(bs,[[-.36,.02,-.04],[-.2,0,0],[.2,0,0],[.36,.02,-.04]],.018,{sides:6,segments:8});FG.roundBox(bs,0,.01,0,.2,.07,.1,.02,{segments:1});for(const side of[-1,1])FG.tube(grips,[[side*.28,.012,-.02],[side*.4,.025,-.05]],.024,{sides:6,segments:2});flush(bs,m.trim,bar);flush(grips,m.dark,bar);parts.handlebar=bar;
    const wake=new T.Group();group.add(wake);for(const side of[-1,1])panel(wake,m.wake,[[side*.3,.03,-l*.4],[side*.7,.03,-l*.85],[side*.95,.03,-l*1.2],[side*.2,.03,-l*.6]]);parts.wake=wake;
    group.remove(stat);group.add(mergeStatic(stat));
  }
  function boat(group,d,m,parts){
    const stat=new T.Group();group.add(stat);const w=d.dimensions.width,l=d.dimensions.length,s=d.silhouette,H=d.dimensions.height;m.white.side=T.DoubleSide;
    if(s==='jetski')return jetski(group,stat,d,m,parts);
    const cat=s==='catamaran',big=s==='fishing'||s==='cruiser',small=s==='dinghy',rib=s==='rib',helm=d.seats[0].position;
    const hull=SH(),white=SH(),dark=SH(),metal=SH(),glass=SH(),trim=SH(),lamp=SH(),red=SH(),green=SH(),sh={white,glass};
    const fb=small?.44:rib?.42:big?.8:cat?.72:.58,sole=small?.24:.36,fd=small?.82:s==='speedboat'?.6:rib?.78:big?.66:.62,opt={freeboard:fb,rise:small?.16:big?.5:.32,fine:small?2:2.5,stern:small?.8:.9};
    const forms=cat?[-1,1].map(side=>hullForm(l,w*.3,d.draft,{...opt,x:side*w*.35,rise:.24,fine:2})):[hullForm(l,w,d.draft,opt)],F=forms[0],sternZ=-l/2;
    for(const form of forms){hullSkin(form,hull,cat?null:white,sole,fd);if(!rib)rail(dark,form,.032);}
    if(cat){for(const form of forms)sheet(white,steps(6,4),steps(30,12),(u,v,o)=>{const b=form.B(v)-.02;o.x=form.x+(u-.5)*2*b;o.y=form.S(v)+.03*(1-Math.pow(2*u-1,2));o.z=form.zOf(v);},()=>[0,1,0]);
      FG.roundBox(white,0,fb-.02,-l*.08,w*.72,.2,l*.72,.06,{segments:1});for(const z of[l*.32,l*.4])FG.tube(metal,[[-w*.33,fb+.2,z],[w*.33,fb+.2,z]],.03,{sides:6,segments:2});sheet(dark,2,2,(u,v,o)=>{o.x=(u-.5)*w*.5;o.y=fb+.12;o.z=mix(l*.29,l*.42,v);},()=>[0,1,0]);}
    // Bow rail, cleats and running lights.
    if(!small&&!rib)for(const form of forms){const pts=[];for(const side of[-1,1])for(let k=0;k<=8;k++){const f=mix(fd+.02,.985,(side<0?k:8-k)/8);pts.push([form.x+side*(form.B(f)-.03),form.S(f)+.3,form.zOf(f)]);}FG.tube(metal,pts,.014,{sides:5,segments:steps(30,12)});for(const side of[-1,1])for(const f of[fd+.03,mix(fd,1,.5)])FG.tube(metal,[[form.x+side*(form.B(f)-.03),form.S(f),form.zOf(f)],[form.x+side*(form.B(f)-.03),form.S(f)+.3,form.zOf(f)]],.011,{sides:4,segments:2});}
    for(const form of forms)for(const side of[-1,1]){FG.ellipsoid(side<0?red:green,form.x+side*(form.B(.9)+.01),form.S(.9)+.05,form.zOf(.9),.035,.03,.05,{nu:8,nv:6});for(const f of[.1,fd-.05])FG.roundBox(metal,form.x+side*(form.B(f)-.06),form.S(f)+.03,form.zOf(f),.035,.035,.16,.012,{segments:1});}
    // What stands on the deck.
    const hz=helm.z,hy=helm.y,dashY=hy+.07,inner=z=>F.B(clamp((z+l/2)/l,0,1))*2-.14;
    if(small){FG.roundBox(white,0,(sole+dashY)/2,hz+.6,Math.min(w*.8,inner(hz+.6)),dashY-sole,.3,.06,{segments:2});
      for(const z of[hz-.02,hz-.9+.0,l*.22])FG.roundBox(white,0,sole+.22,z,F.B(.5)*1.7,.05,.26,.02,{segments:1});for(const side of[-1,1]){FG.tube(trim,[[side*(F.B(.45)+.02),fb+.1,-.2],[side*(F.B(.45)+.5),.08,-.5]],.018,{sides:5,segments:2});FG.roundBox(trim,side*(F.B(.45)+.62),.02,-.58,.14,.02,.4,.01,{segments:1});}}
    else if(s==='speedboat'){FG.roundBox(white,0,(sole+dashY)/2,hz+.66,Math.min(w*.84,inner(hz+.66)),dashY-sole,.4,.08,{segments:2});sheet(glass,steps(14,8),steps(4,2),(u,v,o)=>{const a=(u-.5)*2;o.x=a*w*.4;o.y=dashY+.2+v*.4;o.z=hz+.92-.5*a*a-v*.26;},()=>[0,.3,1]);FG.tube(metal,Array.from({length:9},(_,k)=>{const a=(k/8-.5)*2;return[a*w*.4,dashY+.605,hz+.66-.5*a*a];}),.014,{sides:5,segments:16});
      FG.roundBox(white,0,sole+.25,sternZ+.62,w*.76,.42,.9,.08,{segments:2});FG.roundBox(trim,0,sole+.48,sternZ+.62,w*.7,.06,.8,.03,{segments:1});for(const side of[-1,1])FG.roundBox(trim,side*w*.2,F.S(.8)+.06,F.zOf(.8),.4,.012,l*.2,.006,{segments:1});}
    else if(rib){for(const form of forms){const pts=[];for(const side of[-1,1]){const n=12;for(let k=0;k<=n;k++){const f=mix(.02,.99,(side<0?k:n-k)/n);pts.push([side*(form.B(f)+.04),form.S(f)+.06,form.zOf(f)]);}}FG.tube(dark,pts,.2,{sides:steps(12,8),segments:steps(60,24),capScale:.6});for(const side of[-1,1])for(let n=0;n<5;n++){const f=.1+n*.17;FG.tube(trim,[[side*(form.B(f)+.2),form.S(f)-.06,form.zOf(f)],[side*(form.B(f)+.18),form.S(f)+.22,form.zOf(f)],[side*(form.B(f)-.02),form.S(f)+.27,form.zOf(f)]],.022,{sides:5,segments:6});}}
      const cw=w*.72;FG.roundBox(white,0,(sole+dashY)/2,hz+.64,cw,dashY-sole,.46,.07,{segments:2});sheet(glass,8,2,(u,v,o)=>{o.x=(u-.5)*cw*.9;o.y=dashY+.22+v*.34;o.z=hz+.8-v*.14;},()=>[0,.3,1]);FG.tube(metal,[[-cw*.48,sole+.5,hz+.46],[-cw*.48,dashY+.6,hz+.6],[cw*.48,dashY+.6,hz+.6],[cw*.48,sole+.5,hz+.46]],.018,{sides:5,segments:12});
      FG.tube(metal,[[-F.B(.08)+.05,fb+.1,sternZ+.5],[-F.B(.08)*.7,fb+1.25,sternZ+.42],[F.B(.08)*.7,fb+1.25,sternZ+.42],[F.B(.08)-.05,fb+.1,sternZ+.5]],.03,{sides:6,segments:14});FG.ellipsoid(lamp,0,fb+1.3,sternZ+.42,.05,.05,.05,{nu:8,nv:6});}
    else if(s==='fishing'){const z0=hz-.8,z1=hz+1.25,top=hy+1.12;deckhouse(sh,0,z0,z1,w*.33,sole,top,{sill:hy+.3,rearGlass:true,posts:[hz-.25]});FG.roundBox(white,0,top+.03,(z0+z1)/2-.2,w*.76,.06,z1-z0+.3,.03,{segments:1});
      FG.tube(metal,[[0,top,hz-.3],[0,H-.05,hz-.3]],.03,{sides:6,segments:3});FG.ellipsoid(lamp,0,H,hz-.3,.06,.07,.06,{nu:8,nv:6});FG.tube(metal,[[-.5,top+.5,hz-.3],[.5,top+.5,hz-.3]],.014,{sides:4,segments:2});
      const gz=sternZ+.7;FG.tube(metal,[[-F.B(.1)+.08,fb,gz],[-F.B(.1)*.5,fb+1.6,gz+.1],[F.B(.1)*.5,fb+1.6,gz+.1],[F.B(.1)-.08,fb,gz]],.04,{sides:6,segments:14});{const from=trim.count;FG.lathe(trim,[[.2,-.5],[.3,-.5],[.3,-.44],[.16,-.44],[.16,.44],[.3,.44],[.3,.5],[.2,.5]],{sides:steps(16,8),smooth:false});trim.transform(from,new T.Matrix4().makeTranslation(0,sole+.42,gz+.9).multiply(new T.Matrix4().makeRotationZ(Math.PI/2)));}
      for(const x of[-.5,.5])FG.roundBox(trim,x,sole+.2,gz+1.9,.6,.36,.5,.04,{segments:1});}
    else if(s==='cruiser'){const up=hy-.5,z0=sternZ+l*.2,z1=F.zOf(fd)+.2;deckhouse(sh,0,z0,z1,w*.36,sole,up,{sill:sole+(up-sole)*.56,rake:.9,posts:[z0+1.3,z0+2.6,z0+3.9]});
      FG.roundBox(white,0,fb+.24,F.zOf(.8),w*.4,.4,l*.2,.12,{segments:2});for(const side of[-1,1])for(let n=0;n<3;n++)FG.ellipsoid(dark,side*w*.2,fb+.28,F.zOf(.8)-l*.06+n*l*.06,.012,.07,.16,{nu:8,nv:6});
      const fz1=hz+1.0,fz0=hz-2.5;for(const side of[-1,1])FG.roundBox(white,side*w*.34,up+.3,(fz0+fz1)/2,.08,.56,fz1-fz0,.03,{segments:1});FG.roundBox(white,0,up+.3,fz0,w*.68,.56,.08,.03,{segments:1});
      sheet(glass,steps(14,8),steps(4,2),(u,v,o)=>{const a=(u-.5)*2;o.x=a*w*.34;o.y=up+.3+v*.62;o.z=fz1+.12-.4*a*a-v*.3;},()=>[0,.3,1]);FG.roundBox(white,0,up+.3,fz1+.02,w*.66,.56,.2,.06,{segments:1});
      const roof=up+2.0;FG.roundBox(white,0,roof,hz-.6,w*.74,.08,3.2,.04,{segments:1});for(const side of[-1,1])for(const z of[fz1-.1,hz-2.1])FG.tube(metal,[[side*w*.33,up+.56,z],[side*w*.33,roof,z+(z>hz?-.3:.2)]],.03,{sides:6,segments:3});
      FG.tube(metal,[[-w*.3,roof+.04,hz-1.8],[-w*.22,H-.25,hz-2.0],[w*.22,H-.25,hz-2.0],[w*.3,roof+.04,hz-1.8]],.035,{sides:6,segments:14});{const from=white.count;FG.lathe(white,[[0,.07],[.26,.05],[.3,0],[.26,-.05],[0,-.07]],{sides:steps(16,8)});white.transform(from,new T.Matrix4().makeTranslation(0,H-.12,hz-2.0));}FG.ellipsoid(lamp,0,H,hz-2.0,.04,.05,.04,{nu:8,nv:6});
      FG.roundBox(white,0,sole-.12,sternZ-.25,w*.8,.08,.6,.03,{segments:1});}
    else if(cat){const z0=-l*.2,z1=l*.2,top=hy+1.14;deckhouse(sh,0,z0,z1,w*.3,fb+.06,top,{sill:hy+.28,rake:.8,rearGlass:true,posts:[hz-.4,hz-1.3]});FG.roundBox(white,0,top+.04,-l*.12,w*.7,.07,l*.52,.035,{segments:1});for(const side of[-1,1])FG.tube(metal,[[side*w*.32,fb+.1,-l*.36],[side*w*.32,top,-l*.34]],.03,{sides:6,segments:3});
      FG.tube(metal,[[0,top,-.3],[0,H-.05,-.3]],.028,{sides:6,segments:3});FG.ellipsoid(lamp,0,H,-.3,.05,.06,.05,{nu:8,nv:6});}
    d.seats.forEach(a=>{seat(stat,m,a);FG.tube(metal,[[a.position.x,(s==='cruiser'?hy-.5:cat?fb+.06:sole),a.position.z],[a.position.x,a.position.y-.14,a.position.z]],.055,{sides:8,segments:2});});
    if(s==='cruiser')FG.roundBox(white,0,hy-.54,hz-.75,w*.66,.07,3.6,.03,{segments:1});
    for(const[shape,mat]of[[hull,m.body],[white,m.white],[dark,m.dark],[metal,m.metal],[glass,m.glass],[trim,m.trim],[lamp,m.head],[red,m.red],[green,m.blue]])flush(shape,mat,stat);
    cockpit(group,d,m,parts);
    // Engines and the wake the game stretches behind the stern.
    if(big||cat){for(const form of forms){const prop=new T.Group();prop.position.set(form.x,-d.draft*.8,sternZ+.3);group.add(prop);const blades=SH();for(let a=0;a<3;a++){const from=blades.count;airfoil(blades,[0,.04,0],[0,.22,0],.14,.11,{thick:.14,nu:6,nv:3});blades.transform(from,new T.Matrix4().makeRotationZ(a*TAU/3).multiply(new T.Matrix4().makeRotationY(1.0)));}flush(blades,m.metal,prop);parts.props.push(prop);}}
    else if(rib){outboard(stat,group,parts,m,-.3,l,1);outboard(stat,group,parts,m,.3,l,1);}else outboard(stat,group,parts,m,0,l,small?.75:1.15);
    const wake=new T.Group();group.add(wake);for(const side of[-1,1])panel(wake,m.wake,[[side*w*.4,.035,-l*.34],[side*w*.67,.035,-l*.78],[side*w*.86,.035,-l*1.15],[side*w*.30,.035,-l*.58]]);
    parts.wake=wake;group.remove(stat);group.add(mergeStatic(stat));
  }
  function sunrunner(group,d,m,parts,c){
    const frame=new T.Group();group.add(frame);
    loft(frame,m.dark,[[-1.68,.46,.40,.48,.55],[-.84,.69,.34,.55,.57],[.70,.68,.34,.55,.57],[1.64,.45,.44,.51,.56]]);
    const hood=loft(group,m.body,[[.55,.60,.52,.81,.88],[.95,.65,.55,.78,.84],[1.47,.49,.55,.68,.72]]);
    breakaway(parts,hood,'hood',.55);
    const engine=box(group,m.trim,0,.74,-1.21,.98,.38,.62);
    breakaway(parts,engine,'trunk',.42);
    for(let n=0;n<6;n++)box(frame,m.metal,0,.945,-1.43+n*.085,.77,.026,.028,.006);
    for(const side of[-1,1]){
      const x=side*.69;
      const rail=[[x,.52,1.44],[x,.83,.71],[x*.95,1.84,.43],[x*.95,1.84,-.78],[x,.66,-1.48]];
      for(let n=1;n<rail.length;n++)tube(frame,m.trim,rail[n-1],rail[n],.048);
      tube(frame,m.trim,[x,.60,-.82],[x*.95,1.84,-.78],.046);
      tube(frame,m.trim,[x,.57,-.83],[x,.80,.67],.042);
      tube(frame,m.metal,[x*.94,.78,-.83],[-x*.94,1.78,-.78],.025);
      for(const z of[-d.wheelbase/2,d.wheelbase/2]){
        const wx=side*d.track/2;
        wheel(group,parts,m,wx,d.wheelRadius,z,d.wheelRadius,z>0,c.wheelStyle,.31);
        for(const dz of[-.26,.26])tube(frame,m.trim,[x*.66,.47,z+dz],[wx,.42,z],.028);
        tube(frame,m.metal,[x*.67,.86,z],[wx,.42,z],.025);
        const coil=[];
        for(let n=0;n<=32;n++){const t=n/32,a=t*Math.PI*10;coil.push(new T.Vector3(x*.67+(wx-x*.67)*t+.045*Math.cos(a),.84-.40*t,z+.045*Math.sin(a)));}
        mesh(new T.TubeGeometry(new T.CatmullRomCurve3(coil),steps(32,12),.012,5,false),m.orange,frame);
      }
      sphere(frame,m.head,x*.79,.75,1.49,.096,.088,.056);
      box(frame,m.tail,x*.78,.78,-1.54,.19,.07,.05,.01);
    }
    for(const z of[-.78,.43])tube(frame,m.trim,[-.655,1.84,z],[.655,1.84,z],.046);
    for(const z of[-1.76,1.76])breakaway(parts,box(group,m.trim,0,.48,z,1.50,.12,.12),z>0?'front-bumper':'rear-bumper',.57);
    d.seats.forEach(s=>seat(frame,m,s));cockpit(group,d,m,parts);
  }
  function bike(group,d,m,parts,c){if(d.bikeSpec){root.CityElectricBikeModels.build(group,d,m,parts,c,{box,tube,mesh,loft,material,sphere,mergeStatic,detail:buildDetail});return;}motorbike(group,d,m,parts,c);}
  function buildModel(typeId,customization={},withLOD=true,sharedMaterials=null){const d=V.byId[typeId];if(!d)throw new Error('Unknown vehicle model '+typeId);const group=new T.Group(),m=sharedMaterials||palette(d,customization),parts={wheels:[],doors:[],props:[],blur:[],needles:[],ailerons:[],smoke:[],bodyRecords:[],breakaway:[]};m.body.side=T.DoubleSide;group.name=d.name;group.userData={typeId,parts,materials:m,definition:d,customization:{...customization},modelDetail:buildDetail,provenance:'Original procedural Platdo City geometry',forward:'+Z',origin:'ground/water contact'};if(d.id==='sunrunner')sunrunner(group,d,m,parts,customization);else if(d.kind==='bike')bike(group,d,m,parts,customization);else if(d.category==='land')car(group,d,m,parts,customization);else if(d.category==='boat')boat(group,d,m,parts);else if(d.category==='plane')plane(group,d,m,parts);else helicopter(group,d,m,parts);if(d.id==='sunrunner')fleetDetails(group,d,m,parts,true);if(d.category==='land')parts.wheels.forEach((w,n)=>breakaway(parts,w.pivot,'wheel-'+n,n===0?.09:0));
if(d.category==='land'){const glow=new T.Group(),color=customization.underglowColor??0x65b5ff,data=new Uint8Array(32*64*4);for(let z=0;z<64;z++)for(let x=0;x<32;x++){const i=(z*32+x)*4,dx=(x-15.5)/15.5,dz=(z-31.5)/31.5;data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(255*Math.pow(Math.max(0,1-dx*dx),1.5)*Math.pow(Math.max(0,1-dz*dz),1.5));}const map=new T.DataTexture(data,32,64,T.RGBAFormat);map.needsUpdate=true;map.magFilter=map.minFilter=T.LinearFilter;const mat=new T.MeshBasicMaterial({color,map,transparent:true,opacity:.65,depthWrite:false,side:T.DoubleSide,toneMapped:false}),plane=new T.Mesh(new T.PlaneGeometry(d.dimensions.width*1.7,d.dimensions.length*1.2),mat);plane.rotation.x=-Math.PI/2;plane.position.y=.025;glow.add(plane);glow.visible=!!customization.underglow;group.add(glow);parts.underglow=glow;}
const dynamic=new Set([parts.underglow,...(parts.electric?.dynamic||[]),...parts.breakaway.map(p=>p.object),...parts.wheels.map(w=>w.pivot),...parts.doors.map(a=>a.pivot),...parts.props,...parts.needles,...parts.ailerons.map(a=>a.mesh),parts.cargoGate,parts.mainRotor,parts.tailRotor,parts.gear,parts.handlebar,parts.steeringWheel,parts.wake,parts.downwash]);const staticParts=new T.Group();for(const child of group.children.slice())if(!dynamic.has(child))staticParts.add(child);group.add(mergeStatic(staticParts));group.traverse(o=>{if(o.isMesh&&o.material===m.body)parts.bodyRecords.push({mesh:o,original:new Float32Array(o.geometry.attributes.position.array)});});const smokeMat=new T.SpriteMaterial({map:FX.smokeTexture(T),color:0x526067,transparent:true,opacity:.34,depthWrite:false});for(let n=0;n<5;n++){const puff=new T.Sprite(smokeMat);puff.position.set(0,d.dimensions.height,0);puff.scale.set(.7,.9,1);group.add(puff);puff.visible=false;parts.smoke.push(puff);}if(!withLOD)return group;const detailed=new T.Group();for(const child of group.children.slice())detailed.add(child);for(const moving of [parts.gear,parts.mainRotor,parts.tailRotor,...parts.props])if(moving&&moving.parent===detailed)group.add(moving);const lod=new T.LOD();lod.addLevel(detailed,0);if(d.bikeSpec){const originalDetail=buildDetail;parts.electric.lodModels=[];for(const [level,distance]of[[Math.min(buildDetail,3),32],[1,75]]){buildDetail=level;const reduced=buildModel(typeId,customization,false);parts.electric.lodModels.push(reduced);lod.addLevel(reduced,distance,.12);}buildDetail=originalDetail;}else if(d.kind==='car'&&buildDetail>1){/* V3: the distant car is a simpler build that shares the near one's materials, so paint, wraps and lamps stay in step. */const originalDetail=buildDetail;buildDetail=1;let reduced;try{reduced=buildModel(typeId,customization,false,m);}finally{buildDetail=originalDetail;}const far=mergeStatic(reduced,true);reduced.traverse(o=>{if(o.isMesh)o.geometry.dispose();});lod.addLevel(far,75,.12);}else lod.addLevel(mergeStatic(detailed,true),75,.12);group.add(lod);group.userData.lod=lod;group.userData.detailed=detailed;return group;}
  function create(typeId,customization={},options={}){const previous=buildDetail;buildDetail=clamp(Math.round(Number(options.modelDetail)||5),1,5);try{return buildModel(typeId,customization);}finally{buildDetail=previous;}}
  function update(group,e,dt=0,options={}){const c=e.customization||{},old=group.userData.customization;if((c.spoiler||0)!==(old.spoiler||0)||(c.wheelStyle||0)!==(old.wheelStyle||0)||(c.trim||0)!==(old.trim||0)||(c.wheelColor||0)!==(old.wheelColor||0)||(c.powerPack||0)!==(old.powerPack||0)||!!c.speedDongle!==!!old.speedDongle){const replacement=create(e.typeId,c,{modelDetail:group.userData.modelDetail});dispose(group);group.clear();group.add(...replacement.children.slice());group.userData=replacement.userData;}const{parts:p,materials:m,definition:d}=group.userData,v=e.visual||{};group.position.set(e.x,e.y+(e.bodyLift||0)+(e.bikeFallen?.25*Math.abs(Math.sin(e.roll)):0),e.z);group.rotation.set(-e.pitch,e.yaw,-e.roll,'YXZ');p.wheels.forEach((w,n)=>{if(w.electric)return;w.pivot.rotation.y=w.front?(v.steer||0):0;w.spin.rotation.x=v.wheelSpin||0;w.pivot.position.y=w.baseY+clamp((v.suspension||[])[n]||0,-.10,.13);});p.doors.forEach(a=>a.pivot.rotation.y=-a.side*clamp((e.doors||[])[a.seatIndex]||0,0,1)*1.05);if(p.cargoGate)p.cargoGate.rotation.x=-(e.cargoGate||0)*1.99;if(p.steeringWheel)p.steeringWheel.rotation.z=-(v.steer||0)*1.7;if(p.handlebar)p.handlebar.rotation.y=v.steer||0;if(p.electric)root.CityElectricBikeModels.update(group,e,dt,p);if(m.electricFrame)m.electricFrame.color.copy(m.body.color);if(p.underglow){p.underglow.visible=!!c.underglow&&e.health>0;for(const light of p.underglow.children)light.material.color.setHex(c.underglowColor??0x65b5ff);}
    p.props.forEach(o=>o.rotation.z=v.propeller||0);p.blur.forEach(o=>o.visible=(d.category==='heli'?e.rotor:e.throttle)>.35);if(p.mainRotor)p.mainRotor.rotation.y=v.rotor||0;if(p.tailRotor)p.tailRotor.rotation.z=(v.rotor||0)*3.2;if(p.gear){p.gear.visible=e.gearDown;p.gear.scale.y=e.gearDown?1:.05;}
    p.needles.forEach((o,n)=>o.rotation.z=n===0?2.25-clamp(Math.abs(e.speed)/d.topSpeed,0,1)*4.5:2.25-clamp((e.category==='plane'||e.category==='heli'?e.agl/600:(v.rpm||0)/6500),0,1)*4.5);p.ailerons.forEach(a=>a.mesh.rotation.x=e.rollRate*a.side*.42);if(p.wake){p.wake.visible=(v.wake||0)>.02;p.wake.rotation.y=e.speed<-.05?Math.PI:0;p.wake.scale.z=1+(v.wake||0);m.wake.opacity=.06+(v.wake||0)*.20;}if(p.downwash){p.downwash.visible=(v.downwash||0)>.05;p.downwash.scale.setScalar(1+e.rotor);p.downwash.position.y=.06-e.agl;m.wake.opacity=(v.downwash||0)*.14;}
    m.head.emissiveIntensity=options.lights||e.headlights?1.8:.12;m.tail.emissiveIntensity=v.brake?2.5:.14;m.reverse.emissiveIntensity=v.reverse?2.0:.02;m.blue.emissiveIntensity=e.siren?(Math.sin(e.simTime*13)>0?3:.1):.2;m.red.emissiveIntensity=e.siren?(Math.sin(e.simTime*13)<0?3:.1):.2;m.orange.emissiveIntensity=(e.hazards||e.indicator)&&Math.sin(e.simTime*8)>0?2:.1;
    const color=Number.isInteger(c.paint)?c.paint:d.color,damage=1-clamp(e.health/e.maxHealth,0,1);m.body.color.setHex(color).multiplyScalar(1-damage*.58);m.body.roughness=.32+damage*.5;const dent=JSON.stringify(e.componentDamage||{});if(dent!==group.userData.dent){group.userData.dent=dent;const zones=V.componentShapes(e).filter(zone=>!zone.polygon&&(e.componentDamage?.[zone.id]||0)>0);p.bodyRecords.forEach(rec=>{const a=rec.mesh.geometry.attributes.position,orig=rec.original;for(let n=0;n<a.count;n++){let x=orig[n*3],y=orig[n*3+1],z=orig[n*3+2];for(const zone of zones){const dx=x-zone.x,dy=y-zone.y,dz=z-zone.z,radius=Math.max(.3,Math.min(.8,Math.hypot(zone.hx,zone.hy,zone.hz))),falloff=Math.max(0,1-Math.hypot(dx,dy,dz)/radius)*(e.componentDamage[zone.id]||0);if(falloff){x-=Math.sign(zone.x)*falloff*.09;y-=falloff*.06;z-=Math.sign(zone.z)*falloff*.10;}}a.setXYZ(n,x,y,z);}a.needsUpdate=true;rec.mesh.geometry.computeVertexNormals();});}p.smoke.forEach((puff,n)=>{puff.visible=damage>.60;const phase=((e.simTime||0)*.35+n*.2)%1;puff.position.set(Math.sin(n*2+phase)*phase*.38,d.dimensions.height*.68+phase*1.8,d.category==='land'?d.dimensions.length*.28:-d.dimensions.length*.12);puff.scale.setScalar(.12+phase*.60);});group.userData.damageStage=e.damageStage;return group;
  }
  function refreshDamageLOD(group){const parts=group.userData.parts;if(parts.electric){for(const reduced of parts.electric.lodModels||[])for(const low of reduced.userData.parts.breakaway){const original=parts.breakaway.find(p=>p.id===low.id);if(original&&!original.object.parent&&low.object.parent){low.object.traverse(o=>o.geometry?.dispose());low.object.removeFromParent();}}return;}const {lod,detailed}=group.userData;if(!lod||!detailed)return;const level=lod.levels[1],old=level.object,visible=detailed.visible;detailed.visible=true;const smoke=group.userData.parts.smoke.map(o=>[o,o.visible]);smoke.forEach(([o])=>o.visible=false);const distant=mergeStatic(detailed,true);smoke.forEach(([o,v])=>o.visible=v);detailed.visible=visible;distant.visible=old.visible;old.traverse(o=>{if(o.geometry)o.geometry.dispose();});lod.remove(old);lod.add(distant);level.object=distant;}
  function dispose(group){const geometries=new Set(),materials=new Set(),textures=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>{for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose();});textures.forEach(t=>t.dispose());}
  root.CityVehicleModels={create,update,dispose,refreshDamageLOD};
})(typeof globalThis!=='undefined'?globalThis:this);
