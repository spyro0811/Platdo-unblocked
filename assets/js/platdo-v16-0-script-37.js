
/* PLATDO DRIVE - car models (V3). Metres, +Z forward, +X driver-left, ground at y = 0.
 * Every body is sculpted by PlatdoCarBody from the car's own profile. This file turns one into the objects Drive
 * animates, dents, paints and breaks off, and keeps the paint, wheel and spoiler entry points the game calls. */
(function(){
'use strict';
const T=window.THREE,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
// One construction scope per car: no shared THREE prototypes are modified.
let constructionLevel=5;
const detailFactors=[0,.22,.36,.52,.72,1];
const steps=(count,min=3)=>Math.max(Math.min(count,min),Math.round(count*detailFactors[constructionLevel]));
const withLevel=(level,build)=>{const previous=constructionLevel;constructionLevel=clamp(Math.round(Number(level)||5),1,5);try{return build();}finally{constructionLevel=previous;}};
const resolve=(values,preset)=>values?.modelDetailLevel||window.PlatdoGraphics?.resolveModelDetail(values?.modelDetail,values?.modelDetailPreset||preset)||({potato:1,low:2,medium:3,high:4,epic:4,ultra:5,insane:5}[preset]||3);
window.DriveModelGeometry={steps,withLevel,resolve,get level(){return constructionLevel;}};
// Each car's own proportions: sill height, cabin corners (fractions of the length, and the roof half-width as a
// fraction of the width), plan widths and deck heights at six stations, nose sweep, arch flare and seat position.
const profiles={
compact:{belt:.96,cabin:[.19,.055,-.40,-.30,.355],widths:[.79,.98,1,.97,1,.87],tops:[-.04,.01,.01,0,-.07,-.15],nose:.10,flare:.012,face:'city',seat:-.39},
nova:{belt:.99,cabin:[.18,.015,-.31,-.20,.35],widths:[.82,.98,.97,.98,1,.86],tops:[-.06,.02,.015,0,-.04,-.12],nose:.09,flare:.018,face:'round',seat:-.40},
vektor:{belt:.91,cabin:[.20,-.015,-.35,-.19,.345],widths:[.79,1,.955,.97,1,.81],tops:[-.065,.02,0,.005,-.055,-.15],nose:.15,flare:.025,face:'coupe',seat:-.40,sport:true},
corsa:{belt:.88,cabin:[.185,.02,-.30,-.15,.33],widths:[.77,.99,.93,.97,1,.77],tops:[-.08,.01,-.02,-.025,-.09,-.20],nose:.18,flare:.028,face:'italian',seat:-.34,sport:true},
rally:{belt:.98,cabin:[.225,.085,-.39,-.28,.365],widths:[.87,1,.96,.97,1,.90],tops:[-.01,.025,.01,.02,-.02,-.09],nose:.065,flare:.045,face:'rally',seat:-.38},
apex:{belt:.86,cabin:[.255,.075,-.265,-.11,.34],widths:[.78,1,.94,.955,1,.75],tops:[-.06,.025,-.01,-.035,-.10,-.22],nose:.22,flare:.034,face:'blade',seat:-.23,sport:true,mid:true},
muscle:{belt:1.01,cabin:[.13,-.025,-.31,-.19,.35],widths:[.86,1,.99,.98,1,.92],tops:[-.02,.025,.025,.06,.015,-.085],nose:.055,flare:.026,face:'muscle',seat:-.48,sport:true},
roadster:{belt:.81,cabin:[.16,.035,-.265,-.105,.32],widths:[.76,.99,.91,.96,1,.76],tops:[-.045,.035,-.02,-.02,-.08,-.19],nose:.17,flare:.035,face:'roadster',seat:-.34,sport:true,targa:true},
touring:{belt:.93,cabin:[.205,.005,-.345,-.19,.345],widths:[.80,1,.97,.98,1,.82],tops:[-.06,.025,.01,.01,-.04,-.14],nose:.13,flare:.02,face:'gt',seat:-.42,sport:true},
zenith:{belt:.78,cabin:[.255,.08,-.245,-.075,.32],widths:[.82,1,.88,.96,1,.70],tops:[-.075,.03,-.035,-.04,-.14,-.27],nose:.27,flare:.045,face:'super',seat:-.23,sport:true,mid:true},
volt:{belt:.91,cabin:[.26,.08,-.39,-.20,.35],widths:[.82,.98,.96,.97,1,.79],tops:[-.075,.01,.015,-.015,-.055,-.15],nose:.16,flare:.018,face:'electric',seat:-.28,sport:true},
stratos:{belt:.75,cabin:[.28,.105,-.23,-.06,.31],widths:[.88,1,.87,.94,1,.66],tops:[-.045,.045,-.02,-.055,-.17,-.30],nose:.29,flare:.05,face:'wedge',seat:-.20,sport:true,mid:true},
hyperion:{belt:.73,cabin:[.29,.11,-.22,-.045,.30],widths:[.83,1,.855,.92,1,.65],tops:[-.03,.055,-.04,-.07,-.18,-.31],nose:.31,flare:.052,face:'hyper',seat:-.18,sport:true,mid:true}
};
// Traffic bodies that have no garage profile. They are deliberately not in `profiles`: the cabin fitting reads that
// table to tell the player's cars apart.
const UTILITY={
suv:{belt:1.10,cabin:[.22,.10,-.42,-.34,.395],widths:[.93,1,1,1,1,.93],tops:[-.02,.02,.02,.02,-.02,-.06],nose:.06,flare:.03,face:'suv'},
sedan:{belt:.96,cabin:[.19,-.02,-.34,-.22,.355],widths:[.86,.99,1,1,.98,.86],tops:[-.05,.025,.03,.02,-.07,-.15],nose:.10,flare:.014,face:'sedan'},
van:{belt:1.15,cabin:[.28,.20,-.43,-.42,.435],widths:[.97,1,1,1,1,.93],tops:[0,.02,.02,.02,-.03,-.10],nose:.05,flare:.012,face:'van'},
truck:{belt:1.37,cabin:[.39,.31,.03,.045,.435],widths:[.97,1,1,1,1,.95],tops:[0,0,0,0,-.01,-.03],nose:.04,flare:.01,face:'truck'}
};
// How each body is finished: the kind of tail, the lamps and grille on its face, and the fittings that are its own.
const STYLES={
compact:{rear:'hatch',lamps:'wrap',grille:'slim',tail:'tall',nose:.26},
nova:{lamps:'round',grille:'smile',tail:'round',nose:.27},
vektor:{lamps:'slim',grille:'slim',tail:'bar'},
corsa:{lamps:'pop',grille:'low',tail:'round',wedge:.06,intake:true},
rally:{rear:'hatch',lamps:'wrap',grille:'wide',tail:'tall',pod:true,roofScoop:true,flaps:true,nose:.27},
apex:{lamps:'slim',grille:'low',tail:'bar',intake:true,louvres:true,splitter:true,wedge:.05},
muscle:{lamps:'quad',grille:'full',tail:'triple',hoodScoop:true,hoodCurve:2.4,square:true},
roadster:{open:true,lamps:'round1',grille:'smile',tail:'round',hoops:true},
touring:{lamps:'slim',grille:'bars',tail:'wrap'},
zenith:{lamps:'blade',grille:'low',tail:'bar',intake:true,louvres:true,splitter:true,wedge:.08},
volt:{lamps:'blade',grille:'none',tail:'bar',electric:true,lightBar:true},
stratos:{lamps:'blade',grille:'none',tail:'round',intake:true,louvres:true,splitter:true,wedge:.1},
hyperion:{lamps:'blade',grille:'low',tail:'bar',intake:true,louvres:true,splitter:true,wedge:.1,lightBar:true},
sedan:{lamps:'wrap',grille:'wide',tail:'wrap'},
suv:{rear:'box',lamps:'box',grille:'tall',tail:'tall',cladding:.84,rack:true,hoodCurve:2,square:true},
van:{rear:'box',lamps:'box',grille:'slim',tail:'tall',blind:true,hoodCurve:1.2,nose:.24,square:true},
truck:{rear:'chassis',lamps:'box',grille:'tall',tail:'small',hoodCurve:2.5,nose:.22,square:true}
};
const knots=[-.5,-.39,-.17,.11,.34,.49];
function at(z,values){for(let i=0;i<knots.length-1;i++)if(z<knots[i+1]){const t=clamp((z-knots[i])/(knots[i+1]-knots[i]),0,1),s=t*t*(3-2*t);return mix(values[i],values[i+1],s);}return values.at(-1);}
const mat=(color,roughness=.5,metalness=.2)=>new T.MeshStandardMaterial({color,roughness,metalness,envMapIntensity:metalness>.65?.55:metalness>.15?.28:.075});
function mesh(positions,indices,material,uv){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);if(uv)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();const m=new T.Mesh(g,material);m.castShadow=m.receiveShadow=true;return m;}
function line(parent,points,r,material){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),m=new T.Mesh(new T.TubeGeometry(curve,steps(Math.max(8,points.length*4),4),r,steps(5,3),false),material);m.castShadow=true;parent.add(m);return m;}
function block(parent,w,h,d,x,y,z,material){const g=new T.BoxGeometry(w,h,d,2,2,2),p=g.attributes.position,r=Math.min(w,h,d)*.22;for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),q=new T.Vector3(clamp(v.x,-w/2+r,w/2-r),clamp(v.y,-h/2+r,h/2-r),clamp(v.z,-d/2+r,d/2-r));v.sub(q).normalize().multiplyScalar(r).add(q);p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();const m=new T.Mesh(g,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function canvasTexture(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}

// ---- geometry from buckets of triangles ---------------------------------------------------------------------
function plain(b,uvFn){
 const g=new T.BufferGeometry(),n=b.p.length/3,uv=new Float32Array(n*2);g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));
 if(uvFn)for(let k=0;k<n;k++)uvFn(b.p[k*3],b.p[k*3+1],b.p[k*3+2],uv,k*2);g.setAttribute('uv',new T.BufferAttribute(uv,2));
 g.setIndex(n>65535?new T.Uint32BufferAttribute(b.i,1):new T.Uint16BufferAttribute(b.i,1));g.computeVertexNormals();return g;
}
// Several buckets that form one continuous skin: points at the same place share a normal, so the skin shades as one
// surface even though it is drawn as separate paintable meshes.
function welded(list,uvFns){
 const ids=new Map(),pos=[],remaps=[];
 for(const b of list){const r=new Uint32Array(b.p.length/3);for(let k=0;k<r.length;k++){const x=b.p[k*3],y=b.p[k*3+1],z=b.p[k*3+2],key=((Math.round(x*5000)+15000)*30000+Math.round(y*5000)+2000)*60000+Math.round(z*5000)+30000;let id=ids.get(key);if(id===undefined){id=pos.length/3;pos.push(x,y,z);ids.set(key,id);}r[k]=id;}remaps.push(r);}
 const nrm=new Float32Array(pos.length);
 list.forEach((b,n)=>{const r=remaps[n],I=b.i;for(let k=0;k<I.length;k+=3){const a=r[I[k]]*3,c=r[I[k+1]]*3,e=r[I[k+2]]*3,ux=pos[c]-pos[a],uy=pos[c+1]-pos[a+1],uz=pos[c+2]-pos[a+2],vx=pos[e]-pos[a],vy=pos[e+1]-pos[a+1],vz=pos[e+2]-pos[a+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;for(const o of[a,c,e]){nrm[o]+=nx;nrm[o+1]+=ny;nrm[o+2]+=nz;}}});
 for(let k=0;k<nrm.length;k+=3){const l=Math.hypot(nrm[k],nrm[k+1],nrm[k+2])||1;nrm[k]/=l;nrm[k+1]/=l;nrm[k+2]/=l;}
 return list.map((b,n)=>{const r=remaps[n],local=new Map(),P=[],N=[],I=[];for(let k=0;k<b.i.length;k+=3){const a=r[b.i[k]],c=r[b.i[k+1]],e=r[b.i[k+2]];if(a===c||c===e||a===e)continue;for(const w of[a,c,e]){let id=local.get(w);if(id===undefined){id=P.length/3;local.set(w,id);P.push(pos[w*3],pos[w*3+1],pos[w*3+2]);N.push(nrm[w*3],nrm[w*3+1],nrm[w*3+2]);}I.push(id);}}
  const g=new T.BufferGeometry(),count=P.length/3,uv=new Float32Array(count*2),fn=uvFns[n];g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('normal',new T.Float32BufferAttribute(N,3));
  if(fn)for(let k=0;k<count;k++)fn(P[k*3],P[k*3+1],P[k*3+2],uv,k*2);g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setIndex(count>65535?new T.Uint32BufferAttribute(I,1):new T.Uint16BufferAttribute(I,1));return g;});
}
// Paint strokes are stored by surface and (u, v). The shell keeps the layout the old bodies had: u runs round the
// section from the left rocker over the top to the right rocker, v from tail to nose, so saved paint stays put.
function shellMap(W,bottom,belt,L){
 const ring=[[-.70,0],[-.89,.03],[-.965,.12],[-.995,.28],[-1,.55],[-.985,.79],[-.945,.91],[-.86,.97],[-.64,1.015],[-.32,1.038],[0,1.045]],H=belt-bottom,yc=bottom+H*.5,ang=[];
 for(let k=0;k<=20;k++){const r=k<=10?ring[k]:[-ring[20-k][0],ring[20-k][1]];ang.push(Math.atan2(r[0]*W*.5,r[1]*H-H*.5));}
 return(x,y,z,uv,o)=>{const a=Math.atan2(x,y-yc);let k;if(a<=ang[0])k=0;else if(a>=ang[20])k=20;else{let i=0;while(i<19&&a>ang[i+1])i++;k=i+(a-ang[i])/(ang[i+1]-ang[i]);}uv[o]=k/21;uv[o+1]=clamp((z+L*.5)/(L*.99),0,1);};
}
function paintable(m,id){m.userData.paintSurface=id;m.userData.noBatch=true;return m;}
function fitPaint(root,state){
 const d=root.userData;if(!d.paintSurfaces){d.paintSurfaces=new Map();root.traverse(o=>{if(o.userData.paintSurface){const id=o.userData.paintSurface;o.material=o.material.clone();d.paintSurfaces.set(id,{mesh:o,canvas:null,texture:null,key:''});}});}
 const color=/^#[\da-f]{6}$/i.test(state?.baseColor||'')?state.baseColor:(d.basePaintColor||'#b9543d'),dots=Array.isArray(state?.strokes)?state.strokes.slice(0,1400):[],bySurface=new Map();for(const dot of dots){if(!bySurface.has(dot.surface))bySurface.set(dot.surface,[]);bySurface.get(dot.surface).push(dot);}
 root.traverse(o=>{if(o.material&&o.material.userData.driveBasePaint&&!o.userData.paintSurface)o.material.color.set(color);});
 for(const [id,s]of d.paintSurfaces){const list=bySurface.get(id)||[],key=color+JSON.stringify(list);if(key===s.key)continue;s.key=key;d.paintTextureUpdates=(d.paintTextureUpdates||0)+1;
  if(!list.length){s.mesh.material.color.set(color);s.mesh.material.map=null;s.mesh.material.needsUpdate=true;continue;}
  if(!s.canvas){s.canvas=document.createElement('canvas');s.canvas.width=id==='shell'?1024:512;s.canvas.height=id==='shell'?1024:512;s.texture=new T.CanvasTexture(s.canvas);s.texture.colorSpace=T.SRGBColorSpace;s.texture.anisotropy=4;s.texture.userData.drivePaintTexture=true;}
  const c=s.canvas.getContext('2d'),w=s.canvas.width,h=s.canvas.height;c.fillStyle=color;c.fillRect(0,0,w,h);for(const q of list){if(!Number.isFinite(q.u)||!Number.isFinite(q.v)||!/^#[\da-f]{6}$/i.test(q.color||''))continue;c.fillStyle=q.color;c.beginPath();c.ellipse(clamp(q.u,0,1)*w,(1-clamp(q.v,0,1))*h,clamp(q.r||.02,.005,.12)*w,clamp(q.r||.02,.005,.12)*h,0,0,Math.PI*2);c.fill();}s.texture.needsUpdate=true;s.mesh.material.color.set('#ffffff');s.mesh.material.map=s.texture;s.mesh.material.needsUpdate=true;
 }d.paintState=state;d.paintDotCount=dots.length;
}

// ---- wheels -------------------------------------------------------------------------------------------------
// Ten alloy designs: spoke count, half-width of a spoke as a share of the radius, twin spacing, sweep, centre plate.
const WHEELS=[{n:5,w:.085},{n:12,w:.028,sweep:.42},{n:16,w:.017},{n:6,w:.03,twin:.13},{n:8,w:.075,plate:.44},{n:8,w:.045},{n:10,w:.02,twin:.085},{n:7,w:.06},{n:5,w:.07,sweep:.5,plate:.3},{n:10,w:.036,lock:true}];
const turned=shape=>{const g=shape.geometry();g.deleteAttribute('color');g.rotateZ(-Math.PI/2);return g;}; // the lathe turns about Y; a wheel turns about X, face toward +X
function tyreGeometry(r,width,grooved){
 const FG=window.PlatdoForge,hw=width/2,s=new FG.Shape();
 FG.lathe(s,grooved?[[r*.60,-hw*.94],[r*.66,-hw],[r*.80,-hw*1.05],[r*.92,-hw*1.02],[r*.985,-hw*.84],[r,-hw*.62],[r,-hw*.52],[r*.986,-hw*.5],[r*.986,-hw*.44],[r,-hw*.42],[r,-hw*.06],[r*.986,-hw*.04],[r*.986,hw*.04],[r,hw*.06],[r,hw*.42],[r*.986,hw*.44],[r*.986,hw*.5],[r,hw*.52],[r,hw*.62],[r*.985,hw*.84],[r*.92,hw*1.02],[r*.80,hw*1.05],[r*.66,hw],[r*.60,hw*.94]]:[[r*.60,-hw*.94],[r*.80,-hw*1.05],[r*.985,-hw*.84],[r,-hw*.5],[r,hw*.5],[r*.985,hw*.84],[r*.80,hw*1.05],[r*.60,hw*.94]],{sides:steps(40,12),smooth:false});
 return turned(s);
}
function wheelSet(root,option,helper){
 if(!option)return;const FG=window.PlatdoForge,design=option.visual?.design??option.design??0,d=root.userData,first=d.wheels[0].pivot.userData,R=first.wheelRadius,hw=(first.wheelWidth||.235)/2,spec=WHEELS[design]||WHEELS[0];
 const alloy=mat(option.visual?.color||'#a6adb0',.24,.8),dark=mat('#1b2023',.8,.08),rotor=mat('#626c70',.55,.68),accent=mat(option.visual?.accent||'#b53b25',.48,.45);dark.side=T.DoubleSide;
 const rim=new FG.Shape(),back=new FG.Shape(),disc=new FG.Shape(),cap=new FG.Shape(),sides=steps(40,12);
 FG.lathe(rim,[[R*.60,-hw*.94],[R*.63,-hw*.86],[R*.575,-hw*.6],[R*.56,hw*.45],[R*.60,hw*.8],[R*.63,hw*.9],[R*.605,hw*.97],[R*.565,hw*.9]],{sides,smooth:false});
 FG.lathe(back,[[R*.565,-hw*.2],[R*.15,-hw*.2]],{sides:steps(24,10),smooth:false});
 FG.lathe(disc,[[R*.15,hw*.08],[R*.50,hw*.08],[R*.50,hw*.2],[R*.15,hw*.2]],{sides:steps(32,10),smooth:false});
 // One spoke is built along +X and turned into place, so every spoke has the same section.
 const one=new FG.Shape(),pts=[];for(let k=0;k<=4;k++){const t=k/4,r=mix(.11,.585,t)*R,a=(spec.sweep||0)*t*t;pts.push([Math.cos(a)*r,hw*mix(.52,.86,t*t),Math.sin(a)*r]);}
 FG.tube(one,pts,t=>[R*spec.w*mix(1.15,.85,t),R*.036],{sides:steps(8,4),segments:steps(8,3),caps:false});
 const place=angle=>{const from=rim.count;rim.append(one);rim.transform(from,new T.Matrix4().makeRotationY(angle));};
 for(let k=0;k<spec.n;k++){const a=k/spec.n*TAU;if(spec.twin){place(a-spec.twin);place(a+spec.twin);}else place(a);}
 if(spec.plate)FG.lathe(rim,[[0,hw*.6],[R*spec.plate*.8,hw*.62],[R*spec.plate,hw*.56],[R*spec.plate,hw*.46]],{sides:steps(28,10),smooth:false});
 FG.lathe(rim,[[0,hw*.66],[R*.12,hw*.64],[R*.16,hw*.52],[R*.18,hw*.36],[0,hw*.36]],{sides:steps(20,8)});
 if(spec.lock)FG.lathe(cap,[[0,hw*.86],[R*.085,hw*.86],[R*.1,hw*.8],[R*.1,hw*.62],[0,hw*.62]],{sides:6,smooth:false});
 else if(constructionLevel>2)for(let k=0;k<5;k++){const a=k/5*TAU+.3;FG.ellipsoid(cap,Math.cos(a)*R*.2,hw*.6,Math.sin(a)*R*.2,.012,.012,.012,{nu:6,nv:4});}
 const parts=[[turned(rim),alloy,0],[turned(back),dark,1],[turned(disc),rotor,1]];if(cap.triangles)parts.push([turned(cap),spec.lock?accent:dark,1]);
 for(const w of d.wheels){const spin=w.spin;for(const child of [...spin.children]){if(child.userData.tyre)continue;child.traverse(m=>m.geometry?.dispose());spin.remove(child);}
  for(const [g,material,tier]of parts){const m=new T.Mesh(g,material);m.castShadow=m.receiveShadow=true;if(tier)m.userData.qualityTier=tier;if(w.side<0)m.rotation.y=Math.PI;spin.add(m);}w.pivot.userData.wheelDesign=design;}
 d.wheelDesign=design;
}

// ---- spoilers -----------------------------------------------------------------------------------------------
function spoiler(root,option,helper){
 if(!option)return;const d=root.userData,L=d.length,W=d.width,p=profiles[d.kind]||profiles.compact,design=option.visual?.design??option.design??0,trim=mat('#20282b',.43,.5),paint=d.paint.clone(),g=new T.Group();g.name='equipped spoiler '+design;g.userData.breakawayPart='spoiler';g.userData.keepSeparate=true;d.body.add(g);
 const roofWing=design===6,anchor=roofWing?d.wingRoof:d.wingDeck,deck=anchor?anchor.y:roofWing?d.height+.035:d.belt+at(-.40,p.tops)+.05,z=anchor?anchor.z:roofWing?L*p.cabin[3]-.045:-L*.415,heights=[.10,.045,.22,.30,.35,.19,.06,.13,.29,.37],height=heights[design],span=W*[.78,.76,.84,.94,.91,.86,.75,.83,.92,.98][design],chord=[.18,.12,.22,.31,.29,.24,.22,.30,.28,.35][design];
 const wing=(y,width,depth,delta=0)=>{const positions=[],ix=[],uv=[],across=steps(24,6),along=steps(8,3);for(let j=0;j<=across;j++){const x=(j/across-.5)*width,curve=(design===0?.095:design===7?.035:.018)*(1-(x/(width*.5))**2);for(let k=0;k<=along;k++){const t=k/along;positions.push(x,deck+y+curve+Math.sin(t*Math.PI)*.035,z+delta+(t-.5)*depth);uv.push(j/across,t);if(j<across&&k<along){const a=j*(along+1)+k;ix.push(a,a+1,a+along+2,a,a+along+2,a+along+1);}}}const m=mesh(positions,ix,design===0||design===1?paint:trim,uv);m.material.side=T.DoubleSide;g.add(m);return m;};
 if(design<2){wing(height,span,chord);for(const side of[-1,1])line(g,[[side*span*.49,deck,z-chord*.45],[side*span*.49,deck+height*.7,z],[side*span*.49,deck+height,z+chord*.42]],.022,paint);}
 else{const supports=design===9?[-.35,.35]:[-.29,.29];for(const fraction of supports){const x=W*fraction;if(design===4)line(g,[[x,deck,z+.04],[x,deck+height+.09,z+.06],[x,deck+height+.08,z-chord*.36],[x,deck+height,z-chord*.36]],.018,trim);else line(g,[[x,deck,z+.03],[x,deck+height*.65,z-.025],[x,deck+height,z]],.022,trim);}if(design===5){const left=wing(height,span*.46,chord);left.position.x=-span*.27;const right=wing(height,span*.46,chord);right.position.x=span*.27;}else wing(height,span,chord);if(design===8)wing(height-.12,span*.88,chord*.8,.035);if([3,4,8,9].includes(design))for(const side of[-1,1])block(g,.016,.14,chord*1.15,side*span*.5,deck+height,z,trim);}
 helper?.batchFixedMeshes?.(g);d.spoilerDesign=design;d.spoilerAnchor={x:0,y:deck,z};
}

// ---- the car ------------------------------------------------------------------------------------------------
const SEPARATE=/^(front-bumper|rear-bumper|mirror-|sill-|headlight-|tail-|reverse-)/;
function build(kind,paintColor,detail,dimensions,helpers){return detail?assemble(kind,paintColor,true,dimensions,helpers):withLevel(Math.max(1,Math.min(2,constructionLevel-2)),()=>assemble(kind,paintColor,false,dimensions,helpers));}
function assemble(kind,paintColor,detail,dimensions,helpers){
 const CB=window.PlatdoCarBody,FG=window.PlatdoForge;helpers=helpers||{};
 paintColor=dimensions?.paint?.baseColor||paintColor;
 const profile=profiles[kind]||(kind==='p1'?profiles.compact:null),shapeP=profile||UTILITY[kind]||profiles.compact,st=STYLES[kind]||STYLES.compact;
 const isVan=kind==='van',isTruck=kind==='truck',isSuv=kind==='suv',isCompact=kind==='compact'||kind==='p1',mid=!!profile?.mid||kind==='apex',sport=!!profile?.sport||kind==='vektor'||mid;
 const L=dimensions?.length||(isTruck?7.1:isVan?5.25:isSuv?4.75:isCompact?4.05:mid?4.55:4.62),W=dimensions?.width||(isTruck?2.32:isVan?2.06:isSuv?1.98:isCompact?1.75:1.94),fullHeight=dimensions?.height||(isTruck?2.85:isVan?2.12:isSuv?1.82:isCompact?1.48:mid?1.2:1.37);
 const R=dimensions?.wheelRadius||(isTruck?.49:isVan||isSuv?.4:mid?.36:sport?.35:.34),wheelbase=dimensions?.wheelbase||(isCompact?2.52:mid?2.72:isVan?3.2:isSuv?2.85:2.65),axles=isTruck?[-L*.36,-L*.21,L*.32]:[-wheelbase*.5,wheelbase*.5];
 const belt=shapeP.belt,H=isTruck?Math.min(fullHeight,belt+1.02):fullHeight,bottom=profile?.mid?.245:profile?.targa?.27:.3;
 const paint=detail?new T.MeshPhysicalMaterial({color:paintColor||'#b64632',roughness:.36,metalness:.4,clearcoat:1,clearcoatRoughness:.08}):mat(paintColor||'#b64632',.34,.38);
 paint.userData.driveReflective='paint';paint.userData.driveBasePaint=true;paint.envMapIntensity=.42;
 const rubber=mat('#171a1a',.92,0),trim=mat('#22282b',.63,.12),dark=mat('#12181b',.72,.1),glass=mat('#28404b',.17,.5),chrome=mat('#adb6b9',.27,.78),lens=mat('#dbe5e9',.18,.30),red=mat('#a92829',.22,.24),amber=mat('#d08a2c',.3,.2),white=mat('#d9d6c8',.6,.05),caliper=mat(sport?'#a83b27':'#2a3033',.58,.3);
 glass.userData.driveReflective='glass';glass.envMapIntensity=.32;chrome.userData.driveReflective='metal';glass.transparent=true;glass.opacity=detail?.28:.22;glass.depthWrite=false;glass.metalness=.08;glass.side=T.DoubleSide;dark.side=T.DoubleSide;
 lens.emissive=new T.Color('#c3def0');lens.emissiveIntensity=.1;red.emissive=new T.Color('#c31b13');red.emissiveIntensity=.08;
 const cab=shapeP.cabin,frontBase=L*cab[0],frontTop=L*cab[1],rearBase=L*cab[2],rearTop=L*cab[3],wBase=W*.45,wTop=W*cab[4],tops=shapeP.tops,widths=shapeP.widths;
 const level=constructionLevel,fine=level>2,rear=st.rear||'trunk',noseDepth=st.nose||(mid?.34:.3),tailDepth=rear==='box'?.16:rear==='chassis'?.12:.24,zR0=-L/2+tailDepth,waist=cab[2]-.07;
 const spec={L,W,base:bottom-.06,belt,roofY:H+.03,roofHalf:wTop*1.03,R,axles,zCowl:frontBase,zRoofF:frontTop,zRoofR:rearTop,zDeck:rearBase,
  cowlY:belt+.05,noseY:Math.max(bottom+.2,belt+tops[5]+.03),hoodCurve:st.hoodCurve??(mid?1.3:1.5),deckY:belt+at(Math.max(-.45,cab[2]-.07),tops)+.04,tailY:belt+tops[0]+.03,
  flare:shapeP.flare+.012,wedge:st.wedge||0,open:!!st.open,cladding:st.cladding||0,noseDepth,tailDepth,roofCrown:.035,bay:0,haunch:true,solidFront:true,frameRole:true,detail:level,blindSides:!!st.blind,
  taperF:st.square?.96:clamp(mix(1,widths[5],.3),.88,.98),taperR:st.square?.975:clamp(mix(1,widths[0],.3),.9,.99),faceWF:st.square?.9:clamp(.58+.32*widths[5],.78,.92),faceWR:st.square?.92:clamp(.6+.32*widths[0],.82,.93),sweepF:st.square?.05:clamp(shapeP.nose*.5,.05,.16),
  doorF:Math.min(frontBase-.05,axles[axles.length-1]-R-.055-.08),
  plan:mid?f=>1-(1-widths[2])*.5*Math.exp(-Math.pow((f-waist)/.09,2)):null,
  faceRole:name=>(u,v,x,y)=>rear==='box'&&name==='rear'&&y>belt+.09&&y<H-.12&&Math.abs(u-.5)<.38?['body','glass']:['face-'+name,'paint']};
 if(rear==='box'){spec.zRoofR=zR0;spec.zDeck=zR0-.05;spec.deckY=belt+.03;spec.tailY=belt;}
 else if(rear==='hatch'){spec.deckY=belt+.035;spec.tailY=belt+.02;}
 else if(rear==='chassis'){spec.zRoofR=rearBase+.1;spec.zDeck=rearBase;spec.deckY=.93;spec.tailY=.93;}
 if(st.open){spec.zRoofR=spec.zRoofF-.035;spec.zDeck=spec.zRoofR-.035;spec.openRear=rearBase;spec.roofY=Math.max(belt+.34,H*.98);}
 const tyreW=isTruck?.3:sport?.265:.225,B=CB.build(spec),q=B.qOf,p={x:0,y:0,z:0},n={x:0,y:0,z:0},S=(part,role)=>B.shapeOf(part,role),RAIL=CB.RAIL,SILL=CB.SILL,front=L/2,back=-L/2,name=side=>side<0?'left':'right';
 const box=(part,role,x,y,z,sx,sy,sz,r=.012,sg=1)=>FG.roundBox(S(part,role),x,y,z,sx,sy,sz,Math.min(r,sx*.45,sy*.45,sz*.45),{segments:sg});
 const slab=(part,role,x,y,z,sx,sy,sz)=>{const sh=S(part,role),g=new T.BoxGeometry(sx,sy,sz),P=g.attributes.position,I=g.index.array,base=sh.count;for(let k=0;k<P.count;k++)sh.vertex(P.getX(k)+x,P.getY(k)+y,P.getZ(k)+z);for(let k=0;k<I.length;k+=3)sh.tri(base+I[k],base+I[k+1],base+I[k+2]);g.dispose();};
 // Lids, doors and the roof lie on the body with tucked edges, which draws their shut lines.
 B.panel({part:'hood',role:'paint',s0:-.262,s1:.262,q0:q(B.zCowl+.045),q1:1.3,lift:.005});
 if(rear==='trunk')B.panel({part:'trunk',role:'paint',s0:-.262,s1:.262,q0:-.3,q1:q((st.open?rearBase:B.zDeck)-.045),lift:.005});
 else if(rear!=='chassis')B.facePatch('rear',{part:'face-rear',role:'paint',u0:.1,u1:.9,v0:.16,v1:.5,lift:.005,nu:8,nv:5,tuck:true});
 if(!st.open)B.panel({part:'roof',role:'paint',s0:-.262,s1:.262,q0:q(B.zRoofR+.025),q1:q(B.zRoofF-.025),lift:.004});
 if(B.zDoorF!==null)for(const side of[-1,1]){const tall=zc=>B.glassHeight(zc)>.13;
  B.panel({part:'door',role:(sc,zc)=>{const a=Math.abs(sc);return a<SILL?(a>RAIL+.03&&a<SILL-.022&&zc>B.zDoorR+.05&&zc<B.zDoorF-.045&&tall(zc)?'glass':'pillar'):'paint';},s0:side*(st.open?SILL-.012:RAIL+.006),s1:side*.936,q0:q(B.zDoorR+.006),q1:q(B.zDoorF-.006),lift:.003});
  if(fine){B.at(side*.545,q(B.zDoorR+.17),p);B.normal(side*.545,q(B.zDoorR+.17),n);box('body','chrome',p.x+n.x*.014,p.y,p.z,.02,.024,.13,.009);}}
 // Bumpers wrap each end at the middle of its face; sporty cars carry a splitter and a diffuser under them.
 const F1=B.faces.front,F0=B.faces.rear,e1=B.ends.front,e0=B.ends.rear,fy=mix(e1.y0,e1.y1,.4),fh=clamp((e1.y1-e1.y0)*.36,.05,.1),ry=mix(e0.y0,e0.y1,.3),rh=clamp((e0.y1-e0.y0)*.3,.05,.1);
 B.sweep('front',{part:'front-bumper',role:'paint',y:fy,height:fh,depth:.04,reach:.02});B.sweep('rear',{part:'rear-bumper',role:'paint',y:ry,height:rh,depth:.04,reach:.02});
 if(st.splitter||sport)B.sweep('front',{part:'front-bumper',role:'dark',y:spec.base+.045,height:.022,depth:.075,reach:.03});
 if(sport&&fine)for(let i=-2;i<=2;i++)box('body','dark',i*W*.1,spec.base+.05,back+.16,.014,.09,.26,.004);
 // Front face: lower intake, grille and lamps.
 const gr=st.grille,slat=(v,u0,u1,role='chrome',h=.012)=>B.facePatch('front',{part:'body',role,u0,u1,v0:v-h,v1:v+h,lift:.012,nu:6,nv:2});
 B.facePatch('front',{part:'body',role:'dark',u0:.2,u1:.8,v0:.05,v1:.22,lift:.009,nu:8,nv:3});
 if(gr!=='none'&&gr!=='low'){const v0=gr==='tall'?.36:gr==='slim'||gr==='smile'?.58:.46,v1=gr==='slim'||gr==='smile'?.72:.88,u0=gr==='full'?.1:gr==='smile'?.34:gr==='bars'?.24:.28;
  B.facePatch('front',{part:'body',role:'dark',u0,u1:1-u0,v0,v1,lift:.009,nu:10,nv:4});
  if(fine){if(gr==='bars')for(let k=0;k<11;k++){const u=mix(u0+.03,1-u0-.03,k/10);B.facePatch('front',{part:'body',role:'chrome',u0:u-.006,u1:u+.006,v0:v0+.015,v1:v1-.015,lift:.013,nu:2,nv:4});}
   else for(let k=1;k<=(gr==='tall'?5:3);k++)slat(mix(v0,v1,k/((gr==='tall'?5:3)+1)),u0+.02,1-u0-.02,gr==='tall'||gr==='full'?'chrome':'trim');}}
 if(gr==='low'||st.intake)for(const side of[-1,1])B.facePatch('front',{part:'body',role:'dark',u0:.5+side*.3-.09,u1:.5+side*.3+.09,v0:.3,v1:.5,lift:.004,nu:4,nv:3});
 if(st.lightBar)B.facePatch('front',{part:'body',role:'white',u0:.2,u1:.8,v0:.86,v1:.92,lift:.01,nu:8,nv:2});
 // Where a door mirror stands and how big its glass is; the same numbers place the housing and the live glass.
 const mirrorOf=side=>{const tall=isVan||isTruck,w=tall?.15:isSuv?.215:.195,h=tall?.27:isSuv?.125:.112,d=.085,z=B.zCowl-.16,reach=tall?.09:.035,turn=side*.16,x=side*(B.halfW(z)*B.spec.sill+reach+w*.5),y=B.shoulder(z)+(tall?.2:.078),back=-(d*.5+.0045);
  return{tall,w,h,d,x,y,z,reach,turn,glassW:w-.034,glassH:h-.034,glassX:x+back*Math.sin(turn),glassY:y,glassZ:z+back*Math.cos(turn)};};
 const disc=(part,role,x,y,z,r,dir)=>{const sh=S(part,role),from=sh.count;FG.lathe(sh,[[0,.012],[r*.7,.01],[r,0],[r,-.02],[0,-.02]],{sides:steps(20,8),smooth:false});sh.transform(from,new T.Matrix4().makeTranslation(x,y,z).multiply(new T.Matrix4().makeRotationX(dir*Math.PI/2)));};
 for(const side of[-1,1]){const head='headlight-'+name(side),tail='tail-'+name(side),lamps=st.lamps;
  if(lamps==='wrap'||lamps==='slim'||lamps==='blade'){const s0=.492,s1=lamps==='wrap'?.615:lamps==='slim'?.56:.535,q0=lamps==='blade'?1.04:1.16,q1=lamps==='wrap'?1.9:1.96;
   B.panel({part:'body',role:'dark',s0:side*(s0-.012),s1:side*(s1+.012),q0:q0-.03,q1:Math.min(1.99,q1+.03),lift:.001,sink:.004,edge:.008});B.panel({part:head,role:'head',s0:side*s0,s1:side*s1,q0,q1,lift:.006,sink:.002,edge:.008});
   B.panel({part:'body',role:'orange',s0:side*(s1+.02),s1:side*(s1+.055),q0:1.2,q1:1.6,lift:.005,sink:.002,edge:.006});}
  else if(lamps==='box'){B.facePatch('front',{part:head,role:'head',u0:.5+side*.41-.1,u1:.5+side*.41+.1,v0:.56,v1:.84,lift:.01,nu:4,nv:4});B.facePatch('front',{part:'body',role:'orange',u0:.5+side*.41-.1,u1:.5+side*.41+.1,v0:.46,v1:.53,lift:.008,nu:4,nv:2});}
  else{const count=lamps==='quad'?2:1,r=lamps==='quad'?.066:lamps==='pop'?.07:.085;for(let k=0;k<count;k++){const u=.5+side*(lamps==='quad'?.3+k*.13:.36);F1.at(u,.74,p);disc('body','chrome',p.x,p.y,p.z+.006,r+.014,1);disc(head,'head',p.x,p.y,p.z+.016,r,1);}
   F1.at(.5+side*.4,.5,p);box('body','orange',p.x,p.y,p.z+.01,.1,.03,.02,.008);}
  if(st.pod)for(let k=0;k<2;k++){F1.at(.5+side*(.1+k*.15),.9,p);disc('body','dark',p.x,p.y+.03,p.z+.03,.078,1);disc(head,'head',p.x,p.y+.03,p.z+.045,.064,1);}
  // Tail lamps, reversing lamps and rear indicators.
  const tl=st.tail;
  if(tl==='wrap'){B.panel({part:tail,role:'tail',s0:side*.495,s1:side*.62,q0:-.97,q1:-.3,lift:.006,sink:.002,edge:.008});B.facePatch('rear',{part:tail,role:'tail',u0:.5+side*.3,u1:.5+side*.485,v0:.66,v1:.86,lift:.008,nu:4,nv:3});}
  else if(tl==='tall')B.panel({part:tail,role:'tail',s0:side*.5,s1:side*.7,q0:-.96,q1:-.55,lift:.006,sink:.002,edge:.008});
  else if(tl==='bar'){B.facePatch('rear',{part:tail,role:'tail',u0:.5+side*(st.lightBar?0:.06),u1:.5+side*.44,v0:.7,v1:.8,lift:.008,nu:6,nv:2});B.panel({part:tail,role:'tail',s0:side*.5,s1:side*.56,q0:-.97,q1:-.5,lift:.006,sink:.002,edge:.008});}
  else if(tl==='round')for(let k=0;k<2;k++){F0.at(.5+side*(.26+k*.14),.7,p);disc('body','chrome',p.x,p.y,p.z-.006,.066,-1);disc(tail,'tail',p.x,p.y,p.z-.016,.054,-1);}
  else if(tl==='triple')for(let k=0;k<3;k++)B.facePatch('rear',{part:tail,role:'tail',u0:.5+side*(.2+k*.085)-.03,u1:.5+side*(.2+k*.085)+.03,v0:.6,v1:.86,lift:.008,nu:2,nv:3});
  else B.facePatch('rear',{part:tail,role:'tail',u0:.5+side*.4-.07,u1:.5+side*.4+.07,v0:.6,v1:.8,lift:.008,nu:3,nv:3});
  B.facePatch('rear',{part:'reverse-'+name(side),role:'reverse',u0:.5+side*.3,u1:.5+side*.37,v0:.5,v1:.58,lift:.008,nu:2,nv:2});B.facePatch('rear',{part:'body',role:'orange',u0:.5+side*.38,u1:.5+side*.47,v0:.5,v1:.58,lift:.008,nu:2,nv:2});
  // Mirror (V6.1): a rectangular housing on an arm from the door, turned a little toward the driver. Its rear face
  // carries a dark bezel and the glass sits inside that. Vans and trucks carry tall ones on two arms.
  {const M=mirrorOf(side),paintS=S('mirror-'+name(side),'paint'),darkS=S('mirror-'+name(side),'dark'),p0=paintS.count,d0=darkS.count,rr=Math.min(.03,M.h*.24);
   FG.roundBox(paintS,0,0,0,M.w,M.h,M.d,rr,{segments:fine?2:1});FG.roundBox(paintS,0,0,M.d*.5,M.w*.84,M.h*.8,.04,.018,{segments:1});
   FG.roundBox(darkS,0,0,-M.d*.5+.003,M.w-.014,M.h-.014,.014,.006,{segments:1});
   if(M.tall)for(const v of[-1,1])FG.roundBox(darkS,-side*(M.w*.5+M.reach*.5),v*M.h*.3,.012,M.reach+.03,.022,.03,.008,{segments:1});
   else FG.roundBox(darkS,-side*(M.w*.5+M.reach*.5),-M.h*.26,.008,M.reach+.03,.032,.05,.012,{segments:1});
   const turn=new T.Matrix4().makeTranslation(M.x,M.y,M.z).multiply(new T.Matrix4().makeRotationY(M.turn));paintS.transform(p0,turn);darkS.transform(d0,turn);}
  // Exhaust tips for cars that burn fuel.
  if(!st.electric){const sh=S('body','chrome'),from=sh.count;FG.lathe(sh,[[.034,-.09],[.042,-.085],[.042,.09],[.034,.09],[.032,-.02]],{sides:steps(14,6),smooth:false});sh.transform(from,new T.Matrix4().makeTranslation(side*(mid?W*.07:W*.27),mid?mix(e0.y0,e0.y1,.22):spec.base+.075,back+(mid?.03:.05)).multiply(new T.Matrix4().makeRotationX(Math.PI/2)));}
  // Arch liners close the fender behind each wheel; a skirt runs between the arches and can be torn off.
  for(const axle of axles){const sh=S('body','dark'),ar=B.archR+.01,n2=steps(14,6);for(let k=0;k<=n2;k++){const a=k/n2*Math.PI;for(const x of[side*(B.halfW(axle)-tyreW-.09),side*(B.halfW(axle)*.985)])sh.vertex(x,R+Math.sin(a)*ar,axle+Math.cos(a)*ar);if(k){const i=sh.count-4;B.tri(sh,i,i+1,i+2,true);B.tri(sh,i+1,i+3,i+2,true);}}}
  {const z0=axles[axles.length-2]+B.archR+.06,z1=axles[axles.length-1]-B.archR-.06,path=[];if(z1-z0>.4){for(let k=0;k<=6;k++){const qq=q(mix(z0,z1,k/6));B.at(side*.955,qq,p);B.normal(side*.9,qq,n);path.push([p.x+n.x*.012,p.y+.005,p.z]);}FG.tube(S('sill-'+name(side),'dark'),path,[.03,.022],{sides:steps(8,5),segments:steps(12,6)});}}
  if(st.intake&&mid)B.panel({part:'body',role:'dark',s0:side*.6,s1:side*.78,q0:q(rearBase-.5),q1:q(rearBase+.05),lift:.002,sink:.02,edge:.02});
  if(st.flaps)for(const axle of axles)box('body','dark',side*(B.halfW(axle)-.13),R*.62,axle-R-.075,.22,R*.9,.014,.004);
  if(st.fins){const z=back+.45,y=B.topY(z);box('body','paint',side*W*.4,y+.07,z,.02,.16,.62,.008,2);}
  if(st.rack)FG.tube(S('body','trim'),[[side*spec.roofHalf*.86,spec.roofY+.03,rearBase+.25],[side*spec.roofHalf*.88,spec.roofY+.045,(rearBase+B.zRoofF)/2],[side*spec.roofHalf*.84,spec.roofY+.025,B.zRoofF-.25]],.018,{sides:6,segments:8});
  if(st.hoops){const cx=side*W*.235,z=rearBase+.1,top=belt+.3;FG.tube(S('body','chrome'),[[cx-.2,belt-.02,z],[cx-.17,top-.04,z],[cx,top,z],[cx+.17,top-.04,z],[cx+.2,belt-.02,z]],.02,{sides:steps(8,5),segments:steps(16,8)});FG.ellipsoid(S('body','paint'),cx,B.topY(rearBase-.3)-.03,rearBase-.28,.2,.11,.42,{nu:steps(14,8),nv:steps(8,5)});}
 }
 if(fine)for(const side of[-1,1]){B.at(side*.1,q(B.zCowl-.03),p);FG.tube(S('body','dark'),[[side*.08,p.y+.02,B.zCowl-.01],[side*.3,p.y+.035,B.zCowl-.06],[side*.5,p.y+.05,B.zCowl-.09]],.006,{sides:4,segments:6});}
 // Fittings that belong to particular cars.
 if(st.hoodScoop){const z=(B.zCowl+B.zF1)/2+.08,y=B.topY(z);box('body','paint',0,y+.012,z,W*.27,.085,.62,.035,2);box('body','dark',0,y+.03,z+.3,W*.22,.04,.03,.01);}
 if(st.roofScoop){const z=B.zRoofF-.24;box('body','paint',0,spec.roofY+.035,z,.36,.075,.34,.03,2);box('body','dark',0,spec.roofY+.045,z+.165,.3,.04,.02,.008);}
 if(st.louvres){let z=B.zDeck-.14,count=0;while(z>zR0+.3&&count<7){box('body','dark',0,B.topY(z)+.004,z,W*.36,.016,.05,.006);z-=.085;count++;}}
 if(rear==='box')box('body','dark',0,spec.base+.12,(rearBase+zR0)/2,W*.8,.04,rearBase-zR0+.1,.01);
 if(isTruck){const b0=-L*.485,b1=rearBase-.08,zc=(b0+b1)/2,depth=b1-b0,top=fullHeight+.07,bh=top-1.0;box('body','trim',0,.95,zc,W*.92,.12,depth,.02);slab('box','white',0,1.0+bh/2,zc,W*.99,bh,depth);if(fine){for(let k=0;k<6;k++)for(const side of[-1,1])box('body','chrome',side*W*.498,1.0+bh/2,mix(b0+.2,b1-.2,k/5),.016,bh*.92,.02,.004);for(let y=1.15;y<top-.1;y+=.24)box('body','trim',0,y,b0-.008,W*.9,.025,.02,.004);}}
 // ---- assemble: triangles are gathered by the object they end up in ----
 const buckets=new Map();
 for(const piece of B.result().pieces){const part=piece.part,role=piece.role,pr=role==='paint'||role==='pillar'||role==='frame';let key;
  if(role==='glass')key=part==='windshield'?'windshield':'glass';
  else if(SEPARATE.test(part))key=part+'|'+(pr?'paint':role);
  else if(part==='box')key='box';
  else if(pr)key=part==='roof'?'roof':part==='face-front'?'front':part==='face-rear'?'rear':'shell';
  else key='body|'+role;
  let b=buckets.get(key);if(!b)buckets.set(key,b={p:[],i:[]});const base=b.p.length/3,P=piece.shape.p,I=piece.shape.i;for(let k=0;k<P.length;k++)b.p.push(P[k]);for(let k=0;k<I.length;k++)b.i.push(I[k]+base);
  /* V6.1: the frame round the screens and the roof rail gets an inner face too, so no daylight shows beside the pillars from inside */if(role==='pillar'||role==='frame'){let l=buckets.get('liner');if(!l)buckets.set('liner',l={p:[],i:[]});const lb=l.p.length/3;for(let k=0;k<P.length;k++)l.p.push(P[k]);for(let k=0;k<I.length;k+=3)l.i.push(I[k]+lb,I[k+2]+lb,I[k+1]+lb);}}
 B.release();
 const root=new T.Group(),body=new T.Group(),cabin=new T.Group(),lamps=[];root.add(body);body.add(cabin);
 const add=(parent,g,material,shadow=true)=>{const m=new T.Mesh(g,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;};
 const faceUV=(x,y,z,uv,o)=>{uv[o]=clamp(x/W+.5,0,1);uv[o+1]=clamp((y-bottom)/(belt-bottom),0,1);},roofUV=(x,y,z,uv,o)=>{uv[o]=clamp((x/wTop+1)/2,0,1);uv[o+1]=clamp((frontTop-z)/Math.max(.05,frontTop-rearTop),0,1);};
 const skinKeys=['shell','front','rear'].filter(k=>buckets.has(k)),skins=welded(skinKeys.map(k=>buckets.get(k)),skinKeys.map(k=>k==='shell'?shellMap(W,bottom,belt,L):faceUV));
 let shell=null;skinKeys.forEach((k,i)=>{const m=add(body,skins[i],paint);paintable(m,k);if(k==='shell'){shell=m;m.userData.keepSeparate=true;m.geometry.userData.sculpted=true;}});
 if(buckets.has('roof'))paintable(add(cabin,plain(buckets.get('roof'),roofUV),paint),'roof');
 if(buckets.has('windshield')){const m=add(cabin,plain(buckets.get('windshield')),glass,false);m.userData.occupantWindshield=true;m.userData.keepSeparate=true;}
 if(buckets.has('glass'))add(cabin,plain(buckets.get('glass')),glass,false);
 if(buckets.has('box'))add(body,plain(buckets.get('box')),mat('#c6c3b7',.83,0));
 if(buckets.has('liner'))add(cabin,plain(buckets.get('liner')),trim,false).userData.qualityTier=1;
 const roleMaterial={dark,frit:dark,bay:dark,trim,bed:trim,chrome,orange:amber,white,rubber,seat:trim},tier={chrome:1,orange:1,white:1};
 for(const [key,b]of buckets){if(!key.startsWith('body|'))continue;const role=key.slice(5),m=add(body,plain(b),roleMaterial[role]||trim);if(tier[role])m.userData.qualityTier=tier[role];}
 // Parts that can be knocked off are their own objects.
 const loose=(prefix,id)=>{const g=new T.Group();g.name=id;g.userData.breakawayPart=id;let any=false;for(const [key,b]of buckets){if(!key.startsWith(prefix+'|'))continue;any=true;const role=key.slice(prefix.length+1);if(role==='paint'){const m=add(g,plain(b,prefix.endsWith('bumper')?(x,y,z,uv,o)=>{uv[o]=clamp(x/(W*.9)+.5,0,1);uv[o+1]=clamp((y-bottom+.1)/.4,0,1);}:null),paint);if(prefix.endsWith('bumper'))paintable(m,prefix);}else add(g,plain(b),roleMaterial[role]||trim);}if(any)body.add(g);return g;};
 const frontBumper=loose('front-bumper','front-bumper'),rearBumper=loose('rear-bumper','rear-bumper');
 for(const side of[-1,1]){const mirror=loose('mirror-'+name(side),side>0?'right-mirror':'left-mirror');loose('sill-'+name(side),side>0?'right-sill':'left-sill');
  if(helpers.liveMirrorSurface){const M=mirrorOf(side),face=helpers.liveMirrorSurface(mirror,M.glassW,M.glassH,M.glassX,M.glassY,M.glassZ,side>0?'Left side rear-view mirror':'Right side rear-view mirror',M.turn);face.userData.mirrorSide=side;}
  for(const [prefix,role,material,flags]of[['headlight-','head',lens,{front:true}],['tail-','tail',red,{front:false}],['reverse-','reverse',lens,{front:false,reverse:true}]]){const b=buckets.get(prefix+name(side)+'|'+role);if(!b)continue;const m=add(body,plain(b),material.clone(),false);m.userData.noBatch=true;lamps.push({mesh:m,side,original:m.material.color.clone(),...flags});}}
 // Number plate on the tail.
 F0.at(.5,.56,p);const plateTexture=canvasTexture(256,64,(c,w,h)=>{c.fillStyle='#d8d6c4';c.fillRect(0,0,w,h);c.fillStyle='#293132';c.font='bold 33px monospace';c.textAlign='center';c.fillText('PLATDO',w/2,46);});
 const plate=new T.Mesh(new T.PlaneGeometry(.48,.135),new T.MeshStandardMaterial({map:plateTexture,roughness:.8,envMapIntensity:.075}));plate.position.set(0,p.y,p.z-.012);plate.rotation.y=Math.PI;plate.userData.licensePlate=true;body.add(plate);
 // Wheels: the tyre and caliper are fixed here, the alloy comes from the equipped wheel set.
 const wheels=[],tyre=tyreGeometry(R,tyreW,fine),calShape=new FG.Shape();FG.roundBox(calShape,0,0,0,tyreW*.36,R*.24,R*.34,.02,{segments:1});const calGeometry=calShape.geometry();calGeometry.deleteAttribute('color');
 for(const z of axles)for(const side of[-1,1]){B.at(side*.62,clamp(q(z),0,1),p);const pivot=new T.Group();pivot.userData.wheelRadius=R;pivot.userData.wheelWidth=tyreW;pivot.userData.breakawayPart=(z>0?'front':'rear')+'-'+(side>0?'right':'left')+'-wheel';pivot.userData.wheelPart=true;pivot.position.set(side*(Math.abs(p.x)-tyreW/2-.014),R,z);root.add(pivot);
  const spin=new T.Group();pivot.add(spin);const rubberMesh=add(spin,tyre,rubber);rubberMesh.userData.tyre=true;if(side<0)rubberMesh.rotation.y=Math.PI;
  const cal=add(pivot,calGeometry,caliper,false);cal.position.set(side*tyreW*.1,R*.2,-R*.36);cal.userData.qualityTier=2;
  wheels.push({pivot,spin,front:z>0,side,basePosition:pivot.position.clone(),damageIndex:z>0?(side>0?1:0):(side>0?3:2)});}
 // Soft contact shadow remains available with the low preset.
 const contactTexture=canvasTexture(64,128,(c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,3,w/2,h/2,h*.53);g.addColorStop(0,'rgba(0,0,0,.46)');g.addColorStop(.55,'rgba(0,0,0,.28)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
 const contact=new T.Mesh(new T.PlaneGeometry(W*1.5,L*1.14),new T.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));contact.rotation.x=-Math.PI/2;contact.position.y=.024;root.add(contact);
 // Where the glass really is, for the cracked-glass overlays; an open car has only its windscreen.
 const sx=z=>B.halfW(z)*B.spec.sill-.012,rx=spec.roofHalf-.01,ty=spec.roofY-.035,zf=B.zCowl-.03,zb=B.zDeck+.03;
 const corners=st.open?{fl:[-sx(zf),belt,zf],fr:[sx(zf),belt,zf],tl:[-rx,ty,B.zRoofF],tr:[rx,ty,B.zRoofF],bl:[-sx(zf),belt,zf],br:[sx(zf),belt,zf],ul:[-sx(zf),belt,zf],ur:[sx(zf),belt,zf]}
  :{fl:[-sx(zf),belt,zf],fr:[sx(zf),belt,zf],tl:[-rx,ty,B.zRoofF],tr:[rx,ty,B.zRoofF],bl:[-sx(zb),belt,zb],br:[sx(zb),belt,zb],ul:[-rx,ty,B.zRoofR],ur:[rx,ty,B.zRoofR]};
 // Scuff marks are laid on the real surface of the player's car.
 const surface=detail?(zone,u,v)=>{if(zone==='front'||zone==='rear'){const f=zone==='front'?F1:F0,e=f.end,y=clamp(v,e.y0+.03,e.y1-.02);f.at(1,.5,p);const half=Math.abs(p.x)||W*.4,x=clamp(u,-half*.85,half*.85);f.at(x/(half*2)+.5,(y-e.y0)/(e.y1-e.y0),p);return[x,y,p.z];}
   if(zone==='hood'){const z=clamp(v,B.zCowl+.1,B.zF1-.05),qq=q(z),x=clamp(u,-W*.34,W*.34);let lo=0,hi=.47;for(let i=0;i<12;i++){const m=(lo+hi)/2;B.at(m,qq,p);if(p.x<Math.abs(x))lo=m;else hi=m;}B.at((lo+hi)/2,qq,p);return[x,p.y,z];}
   const z=clamp(u,zR0+.15,B.zF1-.15),qq=q(z),y=clamp(v,spec.base+.14,belt-.12),s=B.sAtHeight(qq,y);B.at(zone==='right'?s:-s,qq,p);return[p.x,y,z];}:null;
 const deckZ=rear==='trunk'?clamp(-L*.415,zR0+.08,(st.open?rearBase:B.zDeck)-.12):zR0+.1,roofZ=B.zRoofR-.045;
 // V6.1: a table of the outer skin over the cabin, so the seating can tell whether a head would come through the
 // roof, the side glass or the rear window. clear(x,y,z,r) is how far a ball lies inside the skin (negative: through).
 // The roof and the glass are sampled as points, section by section, from the top centre down to the sill. A ball
 // is first tested against the section at its own place (is it under the skin at all?), then measured to the
 // nearest point of the skin around it.
 const skin=[],sections=[];if(!st.open){const z0=Math.max(B.zDeck+.03,zR0+.03),z1=B.zCowl-.04,count=Math.max(2,Math.ceil((z1-z0)/.04));for(let i=0;i<=count;i++){const zz=mix(z0,z1,i/count),qq=q(zz),row=[];for(let j=0;j<=23;j++){B.at(j*.02,qq,p);skin.push(p.x,p.y,p.z);row.push(p.x,p.y);}sections.push({z:zz,row});}}
 const clear=st.open?null:(x,y,z,r)=>{const ax=Math.abs(x);let near=sections[0];for(const s of sections)if(Math.abs(s.z-z)<Math.abs(near.z-z))near=s;
  const row=near.row;let top=null;for(let j=0;j<row.length-2;j+=2)if(ax>=row[j]&&ax<=row[j+2]){top=row[j+1]+(row[j+3]-row[j+1])*(ax-row[j])/Math.max(1e-6,row[j+2]-row[j]);break;}
  if(top===null)return-1-r;if(y>=top)return top-y-r;
  let best=Infinity;for(let k=0;k<skin.length;k+=3){const dz=z-skin[k+2];if(dz>.36||dz<-.36)continue;const dx=ax-skin[k],dy=y-skin[k+1],dd=dx*dx+dy*dy+dz*dz;if(dd<best)best=dd;}return Math.sqrt(best)-r;};
 root.userData={body,cabin,wheels,lamps,plate,frontBumper,rearBumper,length:L,width:W,height:H,belt,kind,paint,contact,basePaintColor:paintColor,simulationWheelRadius:dimensions?.wheelRadius||.34,modelVersion:4,modelIdentity:shapeP.face||kind,vehicleProfile:shapeP,
  wingDeck:{z:deckZ,y:B.topY(deckZ)+.008},wingRoof:st.open||rear==='chassis'?{z:deckZ,y:B.topY(deckZ)+.008}:{z:roofZ,y:B.topY(roofZ)+.02},
  damageSetup:{shell,corners,lamps,shape:{length:L,width:W,height:H,belt,surface},detail}};
 wheelSet(root,dimensions?.parts?.wheels||{visual:{design:mid?9:sport?0:5}},helpers);
 spoiler(root,dimensions?.parts?.spoilers,helpers);
 root.userData.cabinClear=clear;
 return{root,shell,corners,paintColor,cabin:{frontBase,rearBase,frontTop,rearTop,wBase,wTop,roof:H,base:spec.base,open:!!st.open,header:st.open?spec.roofY:null,clear},rearSeats:!mid&&!profile?.targa};
}
window.DriveVehicleModels={profiles,build,paintable,fitPaint,wheelSet,spoiler,styles:STYLES};
})();
