
/* V3 electric bikes and bicycles. Each model is shaped after the real machine it stands in for. The moving parts
 * (steering, fork travel, swingarm, shock, chain, crank and wheels) keep the structure the game animates.
 * No downloaded meshes or logos. */
(function(root){'use strict';
const T=root.THREE,F=root.PlatdoForge,up=new T.Vector3(0,1,0),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,TAU=Math.PI*2;
// A smooth sheet through a grid of control points: net[row][column] = [x, y, z].
function skin(shape,net,nu=8,nv=8){
 const rows=net.length,cols=net[0].length,cr=(p0,p1,p2,p3,t)=>.5*(2*p1+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t),pt=(r,c,k)=>net[clamp(r,0,rows-1)][clamp(c,0,cols-1)][k],start=shape.count;
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const fu=i/nu*(cols-1),fv=j/nv*(rows-1),iu=Math.min(cols-2,Math.floor(fu)),iv=Math.min(rows-2,Math.floor(fv)),tu=fu-iu,tv=fv-iv,out=[0,0,0];
  for(let k=0;k<3;k++){const a=[-1,0,1,2].map(dr=>cr(pt(iv+dr,iu-1,k),pt(iv+dr,iu,k),pt(iv+dr,iu+1,k),pt(iv+dr,iu+2,k),tu));out[k]=cr(a[0],a[1],a[2],a[3],tv);}shape.vertex(out[0],out[1],out[2]);}
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=start+j*(nu+1)+i,b=a+1,c=a+nu+1,e=c+1;shape.i.push(a,b,c,b,e,c);}return start;}
const mirror=net=>net.map(row=>row.map(p=>[-p[0],p[1],p[2]]));
// A plain box of 12 triangles, for tread blocks.
function cube(shape,sx,sy,sz){const s0=shape.count;for(const z of[-1,1])for(const y of[-1,1])for(const x of[-1,1])shape.vertex(x*sx/2,y*sy/2,z*sz/2);const q=(a,b,c,d)=>shape.i.push(s0+a,s0+b,s0+c,s0+a,s0+c,s0+d);q(0,2,3,1);q(4,5,7,6);q(0,1,5,4);q(2,6,7,3);q(1,3,7,5);q(0,4,6,2);return s0;}
// A straight member with a rounded rectangular section between two points.
function beam(shape,a,b,w,h,r=.006){const from=shape.count,va=new T.Vector3(...a),vb=new T.Vector3(...b),dir=vb.clone().sub(va),len=dir.length();F.roundBox(shape,0,0,0,w,len,h,Math.min(r,w*.45,h*.45),{segments:1});shape.transform(from,new T.Matrix4().compose(va.add(vb).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(up,dir.normalize()),new T.Vector3(1,1,1)));}
const pipe=(shape,points,r,sides=7)=>F.tube(shape,points,r,{sides,segments:Math.max(2,points.length*4)});
// A disc or drum whose axis runs left to right.
function drum(shape,x,y,z,r,w,sides=16){const from=shape.count;F.lathe(shape,[[0,-w/2],[r,-w/2],[r,w/2],[0,w/2]],{sides,smooth:false});shape.transform(from,new T.Matrix4().makeTranslation(x,y,z).multiply(new T.Matrix4().makeRotationZ(-Math.PI/2)));}
function build(g,d,m,p,c,k){
 const s=d.bikeSpec,a=s.anchors,h=s.seatHeight,half=s.wheelbase/2,detail=k.detail,steps=(n,min=5)=>Math.max(min,Math.round(n*(.25+detail*.15))),material=k.material,shape=s.shape,pedal=!!d.pedalOnly,cyc=s.cycleStyle;
 const mx=shape==='full-mx',pit=shape==='pit-performance',dirt=shape==='compact-dirt',trail=shape==='open-trail',cruiser=shape==='fat-cruiser',mini=!!s.mini,moto=mx||pit||dirt;
 // Materials. Plastics take the paint; the frame follows it on the models whose frame is the coloured part.
 const ac=material(s.accent,.42,.2,{side:T.DoubleSide}),frame=material(c.paint??d.color,.46,.5),black=material(0x15181b,.6,.3),satin=material(0x24282c,.48,.55),vinyl=material(0x131516,.9),brake=material(0x9aa2a5,.34,.85),chrome=material(0xc9cfd2,.2,.9),gold=material(0xc79a3c,.3,.85),lens=m.head;
 m.electricAccent=ac;m.electricFrame=frame;m.body.side=T.DoubleSide;const plastic=m.body,/* V3.9: on the Sol-1 the paint is the anodised metal (fork tubes, rims, shock spring); its bodywork is black. */rimMat=Number.isInteger(c.wheelColor)?material(c.wheelColor,.3,.78):mx||mini||cruiser?black:dirt?frame:m.metal;
 const E=p.electric={dynamic:[],fork:null,swing:null,shock:null,chains:[],spec:s,frontRadius:s.frontRadius,rearRadius:s.rearRadius},dyn=(o,name)=>{o.name=name;E.dynamic.push(o);return o;};
 // Geometry is collected per parent and material, then turned into one mesh each.
 const bins=new Map(),sh=(parent,mat)=>{let map=bins.get(parent);if(!map)bins.set(parent,map=new Map());let v=map.get(mat);if(!v)map.set(mat,v=new F.Shape());return v;},G=mat=>sh(g,mat);
 // ---- wheels ----
 function wheel(parent,front){
  const R=front?s.frontRadius:s.rearRadius,rim=front?s.frontRim:s.rearRim,w=front?s.frontWidth:s.rearWidth,pivot=new T.Group(),spin=new T.Group(),fat=w>.1,thin=w<.045,sw=R-rim;parent.add(pivot);pivot.add(spin);pivot.name=(front?'front':'rear')+'-axle';spin.name=(front?'front':'rear')+'-wheel';
  const tyre=new F.Shape(),metal=new F.Shape(),hub=new F.Shape(),disc=new F.Shape();
  F.lathe(tyre,[[rim-.004,-w*.4],[rim+.012,-w*.5],[R-sw*.45,-w*.54],[R-.014,-w*.45],[R-.004,-w*.25],[R,0],[R-.004,w*.25],[R-.014,w*.45],[R-sw*.45,w*.54],[rim+.012,w*.5],[rim-.004,w*.4]],{sides:steps(44,10),rows:steps(22,10)});
  if(!thin&&detail>1){const count=Math.round(TAU*R/(fat?.075:.052)/(detail<3?2:1)),bh=fat?.014:.011,bl=fat?.042:.027;
   for(let n=0;n<count;n++)for(let row=0;row<3;row++){const q=(n+(row%2)*.5)/count*TAU,rr=R+bh*.3-(row!==1?.009:0),from=cube(tyre,bl,w*(row===1?.26:.2),bh);
    tyre.transform(from,new T.Matrix4().makeRotationY(q).multiply(new T.Matrix4().makeTranslation(0,(row-1)*w*.33,rr)).multiply(new T.Matrix4().makeRotationZ(row===1?0:(row-1)*.5)));}}
  F.lathe(metal,[[rim-.02,-w*.3],[rim-.002,-w*.38],[rim+.008,-w*.38],[rim+.004,-w*.3],[rim-.012,0],[rim+.004,w*.3],[rim+.008,w*.38],[rim-.002,w*.38],[rim-.02,w*.3]],{sides:steps(36,10),smooth:false});
  if(mini||cruiser&&detail<3){F.lathe(metal,[[.03,-.03],[rim-.016,-w*.16],[rim-.016,w*.16],[.03,.03]],{sides:steps(28,10),smooth:false});if(detail>2)for(let n=0;n<5;n++){const q=n/5*TAU;for(const side of[-1,1])F.ellipsoid(hub,Math.sin(q)*rim*.55,side*w*.14,Math.cos(q)*rim*.55,rim*.17,.004,rim*.17,{nu:8,nv:4});}}
  else{const spokes=c.wheelStyle===2?6:c.wheelStyle===1?12:detail<3?12:thin?24:32,r=c.wheelStyle===2?.009:thin?.0014:.002;for(let n=0;n<spokes;n++){const q=n/spokes*TAU,side=n%2?1:-1,q0=q+side*.32;F.tube(metal,[[Math.sin(q0)*.03,side*Math.min(.04,w*.5),Math.cos(q0)*.03],[Math.sin(q)*(rim-.016),0,Math.cos(q)*(rim-.016)]],r,{sides:3,segments:1,caps:false});}}
  F.lathe(hub,[[0,-w*.5-.012],[.016,-w*.5-.012],[.03,-Math.min(.045,w*.5)],[.034,0],[.03,Math.min(.045,w*.5)],[.016,w*.5+.012],[0,w*.5+.012]],{sides:steps(16,8),smooth:false});
  if(cruiser&&!pedal&&!front)F.lathe(hub,[[.03,-.05],[.1,-.045],[.105,0],[.1,.045],[.03,.05]],{sides:steps(24,10),smooth:false});
  const discR=Math.min(R*.42,mini?.075:.125),da=w*.5+.014;F.lathe(disc,[[discR*.42,da],[discR,da],[discR,da+.004],[discR*.42,da+.004]],{sides:steps(28,10),smooth:false});
  for(const[shp,mat]of[[tyre,m.rubber],[metal,rimMat],[hub,black],[disc,brake]]){const geo=shp.geometry();geo.deleteAttribute('color');geo.rotateZ(-Math.PI/2);const o=new T.Mesh(geo,mat);o.castShadow=o.receiveShadow=true;spin.add(o);}
  F.roundBox(sh(pivot,black),w*.5+.02,discR*.66,-discR*.6,.034,.07,.045,.01,{segments:1});
  p.wheels.push({pivot,spin,front,baseY:0,radius:R,electric:true});return pivot;}
 // ---- steering assembly ----
 const st=a.steering,Rf=s.frontRadius,Rr=s.rearRadius,fork=new T.Group();fork.position.set(st.x,st.y,st.z);const axis=new T.Vector3(0,st.y-Rf,st.z-half).normalize();fork.quaternion.setFromUnitVectors(up,axis);E.forkBase=fork.quaternion.clone();g.add(dyn(fork,'inclined-steering-axis'));E.fork=fork;
 const slide=new T.Group();slide.name='telescoping-fork-lowers';fork.add(slide);E.slider=slide;fork.updateMatrix();const toFork=new T.Matrix4().copy(fork.matrix).invert(),local=v=>new T.Vector3(...v).applyMatrix4(toFork).toArray();
 const FK=mat=>sh(fork,mat),SL=mat=>sh(slide,mat),frontWheel=wheel(slide,true);frontWheel.position.fromArray(local([0,Rf,half]));E.frontWheel=frontWheel;
 // Leg positions: t = 0 at the top clamp, 1 at the axle.
 const fx=mini?.105:cruiser&&!pedal?.09:pedal?.06:.078,leg=(side,t,dx=0)=>[side*(fx+dx),mix(st.y+.03,Rf,t),mix(st.z,half,t)],usd=!mini&&!pedal,outer=pit?gold:dirt?frame:satin,legR=mx?.028:pedal?.014:.024;
 for(const side of[-1,1]){
  if(usd){pipe(FK(outer),[leg(side,-.02),leg(side,.52)],legR,10);pipe(SL(chrome),[leg(side,.44),leg(side,.97)],legR*.72,8);beam(SL(black),leg(side,.9),leg(side,1.04),.05,.045,.012);
   if(moto||trail){const gz=.03,net=[[leg(side,.5,.03),leg(side,.5,-.03)].map(q=>[q[0],q[1],q[2]+gz]),[leg(side,.75,.036),leg(side,.75,-.036)].map(q=>[q[0],q[1],q[2]+gz+.008]),[leg(side,1,.03),leg(side,1,-.03)].map(q=>[q[0],q[1],q[2]+gz])];skin(SL(mx?plastic:black),net,2,6);}}
  else if(pedal){pipe(FK(cyc==='mountain'?satin:frame),[leg(side,.08),leg(side,cyc==='mountain'?.55:1)],legR,8);if(cyc==='mountain')pipe(SL(black),[leg(side,.45),leg(side,1)],legR*1.5,8);}
  else{pipe(FK(chrome),[leg(side,-.02),leg(side,.55)],.017,8);pipe(SL(black),[leg(side,.4),leg(side,1.02)],.026,10);}
  drum(SL(chrome),side*(fx+.014),Rf,half,.014,.03,8);}
 const clampW=fx*2+.075;for(const t of pedal?[.1]:[0,.22]){const q=leg(0,t),from=FK(black).count;F.roundBox(FK(black),0,0,0,clampW,.03,.07,.012,{segments:1});FK(black).transform(from,new T.Matrix4().makeTranslation(0,q[1],q[2]+.012).multiply(new T.Matrix4().makeRotationX(Math.atan2(axis.z,axis.y))));}
 pipe(FK(black),[[0,st.y+.03,st.z-.012],[0,mix(st.y,Rf,.24),mix(st.z,half,.24)-.012]],.02,8);
 // Handlebar through the two grip anchors, with the bend each kind of bike has.
 const gl=a.gripL,gr=a.gripR,bars=FK(black),rise=gl.y-st.y;
 if(mini){for(const side of[-1,1])pipe(bars,[[side*.05,st.y+.04,st.z-.01],[side*.07,st.y+.1,st.z-.02],[side*.2,gl.y-.03,gl.z-.005],[side*Math.abs(gl.x),gl.y,gl.z]],.013);pipe(bars,[[-.17,gl.y-.06,gl.z-.01],[.17,gl.y-.06,gl.z-.01]],.011);}
 else if(cyc==='road'){pipe(bars,[[-.2,gl.y,gl.z-.01],[0,gl.y+.005,gl.z-.03],[.2,gl.y,gl.z-.01]],.012);for(const side of[-1,1])pipe(bars,[[side*.2,gl.y,gl.z-.01],[side*.21,gl.y-.01,gl.z+.09],[side*.21,gl.y-.09,gl.z+.11],[side*.21,gl.y-.15,gl.z+.03]],.012);}
 else pipe(bars,[[gl.x,gl.y,gl.z],[gl.x*.52,gl.y-rise*.18,gl.z-.012],[gl.x*.2,st.y+.065,st.z-.005],[0,st.y+.06,st.z],[gr.x*.2,st.y+.065,st.z-.005],[gr.x*.52,gr.y-rise*.18,gr.z-.012],[gr.x,gr.y,gr.z]],.0125);
 if(moto||trail){pipe(bars,[[gl.x*.5,gl.y-rise*.16,gl.z-.01],[gr.x*.5,gr.y-rise*.16,gr.z-.01]],.008);if(pit||dirt||mx){const from=FK(pit?ac:vinyl).count;F.roundBox(FK(pit?ac:vinyl),0,gl.y-rise*.16,gl.z-.01,.16,.045,.05,.02,{segments:2});}}
 for(const[side,grip]of[[-1,gl],[1,gr]]){drum(FK(m.rubber),grip.x+side*.0,grip.y,grip.z,.019,.115,10);if(cyc!=='road'&&detail>1){pipe(FK(brake),[[grip.x-side*.075,grip.y+.004,grip.z+.02],[grip.x-side*.03,grip.y-.006,grip.z+.07],[grip.x+side*.04,grip.y-.012,grip.z+.072]],.0045,5);F.roundBox(FK(black),grip.x-side*.09,grip.y,grip.z+.012,.03,.028,.04,.008,{segments:1});}}
 if(!pedal){F.roundBox(FK(black),0,st.y+.095,st.z+.01,.1,.014,.062,.006,{segments:1});F.roundBox(FK(material(0x74c4b6,.22,.1,{emissive:0x21483e,emissiveIntensity:.3})),0,st.y+.104,st.z+.01,.08,.003,.044,.001,{segments:1});}
 // Front fender, number plate or lamp.
 const fy=Rf+(mx?.5:pit||dirt?.4:trail?.42:mini?.2:cruiser?.115:.07),fz0=st.z-.1,fz1=half+(mx?.34:pit||dirt?.27:trail?.25:mini?.2:.16);
 if(moto||trail){const wv=trail?.055:.075;skin(FK(trail?black:dirt?ac:plastic),[[[-wv*.8,fy-.05,fz0],[-wv,fy-.03,(fz0+fz1)/2],[-wv*.5,fy-.085,fz1]],[[0,fy-.02,fz0],[0,fy+.005,(fz0+fz1)/2],[0,fy-.06,fz1+.02]],[[wv*.8,fy-.05,fz0],[wv,fy-.03,(fz0+fz1)/2],[wv*.5,fy-.085,fz1]]],steps(10,4),steps(4,2));
  const py=st.y-.02,pz=st.z+.085,net=[[[-.085,py+.07,pz-.02],[0,py+.085,pz],[.085,py+.07,pz-.02]],[[-.11,py-.06,pz+.03],[0,py-.05,pz+.05],[.11,py-.06,pz+.03]],[[-.07,py-.2,pz+.045],[0,py-.21,pz+.06],[.07,py-.2,pz+.045]]];skin(FK(pit?ac:mx?plastic:dirt?ac:black),net,steps(6,3),steps(6,3));
  if(dirt||trail){F.roundBox(FK(black),0,py-.07,pz+.058,.12,.07,.02,.012,{segments:1});F.roundBox(FK(lens),0,py-.07,pz+.07,.1,.05,.008,.006,{segments:1});}}
 else if(mini){skin(FK(black),[[[-.085,fy+.005,fz0+.04],[-.09,fy+.03,half],[-.07,fy+.045,fz1]],[[.085,fy+.005,fz0+.04],[.09,fy+.03,half],[.07,fy+.045,fz1]]],2,steps(6,3));skin(FK(black),[[[-.1,st.y-.02,st.z+.05],[.1,st.y-.02,st.z+.05]],[[-.085,st.y-.14,st.z+.075],[.085,st.y-.14,st.z+.075]]],2,2);F.roundBox(FK(lens),0,st.y-.085,st.z+.07,.11,.035,.012,.006,{segments:1});}
 else if(cruiser&&!pedal){const from=FK(black).count;F.lathe(FK(black),[[0,-.05],[.05,-.045],[.07,0],[.066,.03],[0,.03]],{sides:steps(18,8),smooth:false});FK(black).transform(from,new T.Matrix4().makeTranslation(0,st.y-.09,st.z+.1).multiply(new T.Matrix4().makeRotationX(Math.PI/2)));const f2=FK(lens).count;F.lathe(FK(lens),[[0,.036],[.058,.034],[.06,.028],[0,.028]],{sides:steps(18,8),smooth:false});FK(lens).transform(f2,new T.Matrix4().makeTranslation(0,st.y-.09,st.z+.1).multiply(new T.Matrix4().makeRotationX(Math.PI/2)));
  skin(SL(black),[[[-.07,Rf+.5*s.frontWidth+.1,half-.2],[-.075,Rf+.13,half],[-.06,Rf+.1,half+.17]],[[.07,Rf+.5*s.frontWidth+.1,half-.2],[.075,Rf+.13,half],[.06,Rf+.1,half+.17]]].map(r=>r.map(q=>[q[0],q[1]+.03,q[2]])),2,steps(8,4));}
 // ---- swingarm, drive and rear suspension ----
 const pivotY=mini?.28:s.bicycle?.38:mx?.43:.35,pivotZ=mini?.02:s.bicycle?.03:.035,swing=new T.Group();swing.position.set(0,pivotY,pivotZ);g.add(dyn(swing,'rear-swingarm-pivot'));E.swing=swing;E.swingLength=half+pivotZ;E.swingOrigin=swing.position.clone();
 const SW=mat=>sh(swing,mat),rearLocal=[0,Rr-pivotY,-half-pivotZ],rearWheel=wheel(swing,false);rearWheel.position.fromArray(rearLocal);E.rearWheel=rearWheel;const armX=s.rearWidth*.5+.034,armMat=pedal?frame:mini||cruiser||dirt?black:brake;
 for(const side of[-1,1]){if(pedal){pipe(SW(frame),[[side*.045,0,0],[side*armX,rearLocal[1],rearLocal[2]]],.009,6);}else{beam(SW(armMat),[side*.1,0,0],[side*armX,rearLocal[1],rearLocal[2]],mini?.03:.028,mx?.06:.048,.01);beam(SW(armMat),[side*.1,-.01,-.06],[side*armX,rearLocal[1],rearLocal[2]+.12],.02,.03,.008);}drum(SW(black),side*(armX+.012),rearLocal[1],rearLocal[2],.016,.02,8);}
 if(!pedal){beam(SW(armMat),[-.1,-.005,-.1],[.1,-.005,-.1],.035,.05,.01);drum(G(chrome),0,pivotY,pivotZ,.02,.26,10);}
 drum(sh(rearWheel.children[0],brake),-s.rearWidth*.5-.022,0,0,s.bicycle?.045:mini?.06:.09,.006,steps(22,10));
 const motorParent=s.motorMount==='swingarm'?swing:g,motorY=s.motorMount==='swingarm'?-.01:pivotY-.035,motorZ=s.motorMount==='swingarm'?-.075:.1;
 if(!s.bicycle){const mm=sh(motorParent,black),r=mini?.07:mx?.11:.085;drum(mm,0,motorY,motorZ,r,.2,steps(22,10));for(const side of[-1,1])drum(sh(motorParent,brake),side*.105,motorY,motorZ,r*.62,.014,steps(16,8));if(detail>2)for(let n=-2;n<=2;n++)drum(mm,n*.034,motorY,motorZ,r+.006,.007,steps(18,8));}
 const chainX=-Math.max(s.rearWidth/2+.033,.139),motorPoint=s.bicycle?new T.Vector3(0,a.crank.y,a.crank.z):new T.Vector3(0,motorY,motorZ);if(motorParent===swing&&!s.bicycle)motorPoint.add(swing.position);motorPoint.x=chainX;
 if(!s.bicycle)drum(sh(motorParent,brake),chainX,motorY,motorZ,.045,.008,12);E.motorPoint=motorPoint;E.chainX=chainX;E.motorOnSwing=motorParent===swing&&!s.bicycle;E.motorLocal=motorPoint.clone().sub(swing.position);
 for(const side of[-1,1]){const chain=k.mesh(new T.CylinderGeometry(.006,.006,1,4),black,g);dyn(chain,'chain-'+(side>0?'upper':'lower'));E.chains.push({mesh:chain,side});}
 if(!pedal)beam(SW(black),[chainX,rearLocal[1]+.1,rearLocal[2]*.2],[chainX,rearLocal[1]+.115,rearLocal[2]*.85],.03,.02,.006);
 const top=new T.Vector3(0,h-.1,-.16),bottom=new T.Vector3(0,.07,-E.swingLength*.44);E.shockTop=top;E.shockBottom=bottom;
 if(!pedal||cyc==='mountain'){for(const side of[-1,1])pipe(SW(armMat),[[side*.09,rearLocal[1]*.44,-E.swingLength*.44],[0,.07,-E.swingLength*.44]],.012,6);drum(G(black),0,top.y,top.z,.02,.14,8);}
 const shock=new T.Group();g.add(dyn(shock,'rear-shock'));E.shock=shock;{const body=sh(shock,chrome);F.lathe(body,[[0,-.5],[.014,-.5],[.014,.1],[.024,.1],[.024,.5],[0,.5]],{sides:steps(12,6),smooth:false});const helix=[];for(let j=0;j<=64;j++){const q=j/64;helix.push([Math.sin(q*TAU*7)*.03,q*.82-.46,Math.cos(q*TAU*7)*.03]);}F.tube(sh(shock,mx?material(0xb88556,.39,.7):mini||cruiser?black:dirt?frame:ac),helix,.0055,{sides:5,segments:steps(96,32),caps:false});}
 E.shockPiston=shock;if(pedal&&cyc!=='mountain')shock.visible=false;
 // ---- frame, battery and bodywork: one function per machine ----
 const seatRear=pedal?-.34:mini?-.59:s.bicycle?-.58:-half*.82,seatFront=pedal?-.07:mini?.21:s.bicycle?-.09:mx?.30:.18,neckY=st.y-.12,neckZ=st.z-.035,cx=mini?.14:.1;
 const seat=(rings,mat=vinyl)=>{k.loft(g,black,rings.map(r=>[r[0],r[1]+.004,r[2]-.016,r[3]-.03,r[4]-.032]));k.loft(g,mat,rings);};
 const bodyMat=dirt?ac:plastic,sidePanels=net=>{skin(G(bodyMat),net,steps(8,4),steps(8,4));skin(G(bodyMat),mirror(net),steps(8,4),steps(8,4));};
 const pegs=()=>{for(const side of[-1,1]){pipe(G(black),[[side*.09,a.footL.y,a.footL.z],[side*.21,a.footL.y,a.footL.z]],.011,6);F.roundBox(G(brake),side*.2,a.footL.y,a.footL.z,.09,.018,.055,.005,{segments:1});}};
 const stand=()=>pipe(G(black),[[-.1,pivotY-.06,-.02],[-.2,pivotY-.2,-.07],[-.27,.02,-.1]],.009,6);
 if(moto){
  // Motocross layout: twin spars from the steering head, a big battery case, shrouds that run into a flat seat,
  // an upswept tail and a skid plate. The Stark, the RTR and the Tuttio differ in size, colours and details.
  for(const side of[-1,1]){const x=side*cx;pipe(G(black),[[x*.4,neckY,neckZ],[x*.62,h-.15,seatFront-.02],[x*.9,pivotY+.08,-.02],[x,pivotY-.02,pivotZ]],.02,8);pipe(G(black),[[x*.5,neckY-.1,neckZ+.02],[x*.9,pivotY+.02,.3],[x,pivotY-.09,.12],[x,pivotY-.02,pivotZ]],.016,8);pipe(G(black),[[x*.65,h-.13,-.02],[x*.6,h-.09,seatRear+.05]],.013,6);pipe(G(black),[[x*.9,pivotY+.1,-.06],[x*.6,h-.11,seatRear+.08]],.012,6);}
  const by=(pivotY+h)/2-.03,bh=h-pivotY-.2;F.roundBox(G(satin),0,by,.12,.2,bh,half*.62,.035,{segments:2});if(detail>2)for(let n=0;n<(mx?6:4);n++)for(const side of[-1,1])F.roundBox(G(black),side*.102,by-bh*.32+n*bh*.13,.12,.006,.012,half*.5,.002,{segments:1});
  F.roundBox(G(mx?brake:black),0,pivotY-.13,.12,.2,.02,half*.7,.01,{segments:1});
  const tz=(st.z+seatFront)/2,sp=mx?1.15:1;
  sidePanels([[[.05,st.y-.1,st.z-.07],[.1*sp,h+.045,tz+.03],[.085,h-.01,seatFront-.04]],[[.14*sp,st.y-.25,st.z-.01],[.165*sp,h-.1,tz+.01],[.115,h-.09,seatFront-.12]],[[.125*sp,st.y-.45,st.z-.1],[.15*sp,h-.3,tz-.09],[.105,h-.19,seatFront-.22]]]);
  if(mx||pit){const stripe=[[[.172*sp,st.y-.3,st.z-.03],[.176*sp,h-.14,tz]],[[.158*sp,st.y-.4,st.z-.08],[.165*sp,h-.24,tz-.06]]];skin(G(ac),stripe,3,3);skin(G(ac),mirror(stripe),3,3);}
  // Tank top between the shrouds, then the seat rising onto it.
  skin(G(bodyMat),[[[-.06,st.y-.1,st.z-.08],[0,st.y-.085,st.z-.08],[.06,st.y-.1,st.z-.08]],[[-.1,h+.04,tz+.03],[0,h+.06,tz+.03],[.1,h+.04,tz+.03]],[[-.085,h-.012,seatFront-.02],[0,h+.005,seatFront-.02],[.085,h-.012,seatFront-.02]]],steps(6,3),steps(8,4));
  seat([[seatRear,.06,h-.055,h-.005,h+.012],[seatRear+.08,.095,h-.06,h-.012,h+.012],[(seatRear+seatFront)*.5,.092,h-.07,h-.022,h+.002],[seatFront,.06,h-.07,h-.03,h-.008],[seatFront+.12,.035,h-.04,h,h+.02]]);
  // Tail: rear fender sweeping up past the seat, with a number panel each side.
  const tz1=seatRear-(mx?.27:.2);skin(G(bodyMat),[[[-.085,h-.075,seatRear+.2],[-.09,h-.05,seatRear],[-.05,h+.03,tz1]],[[0,h-.045,seatRear+.2],[0,h-.012,seatRear],[0,h+.06,tz1-.03]],[[.085,h-.075,seatRear+.2],[.09,h-.05,seatRear],[.05,h+.03,tz1]]],steps(6,3),steps(8,4));
  sidePanels([[[.098,h-.035,-.02],[.098,h-.03,seatRear+.16],[.085,h-.03,seatRear-.02]],[[.118,h-.17,-.08],[.11,h-.15,seatRear+.14],[.09,h-.09,seatRear-.04]],[[.11,h-.28,-.12],[.105,h-.24,seatRear+.2],[.09,h-.13,seatRear+.02]]]);
  F.roundBox(G(m.tail),0,h+.005,tz1+.05,.07,.014,.03,.006,{segments:1});pegs();stand();
 }else if(trail){
  // Light trail bike: a pair of deep forged spars that hold the battery between them, a thin seat on a short
  // subframe and almost no bodywork.
  for(const side of[-1,1]){const x=side*.092;beam(G(frame),[x*.6,neckY+.04,neckZ-.01],[x,h-.1,-.1],.03,.075,.012);beam(G(frame),[x*.6,neckY-.1,neckZ+.03],[x,pivotY+.02,.2],.03,.07,.012);beam(G(frame),[x,pivotY+.02,.2],[x,pivotY-.02,-.04],.03,.065,.012);beam(G(frame),[x,pivotY-.02,-.04],[x,h-.1,-.1],.03,.06,.012);
   pipe(G(black),[[x*.9,h-.1,-.08],[x*.8,h-.06,seatRear+.02]],.013,6);pipe(G(black),[[x,pivotY+.14,-.08],[x*.8,h-.09,seatRear+.06]],.011,6);}
  {const by=(h+pivotY)/2+.02,bh=h-pivotY-.2;F.roundBox(G(satin),0,by,.13,.15,bh,half*.52,.03,{segments:2});for(const side of[-1,1]){const from=G(ac).count;F.roundBox(G(ac),side*.077,by,.13,.004,bh*.16,half*.4,.002,{segments:1});G(ac).transform(from,new T.Matrix4().makeTranslation(0,by,.13).multiply(new T.Matrix4().makeRotationX(.5)).multiply(new T.Matrix4().makeTranslation(0,-by,-.13)));}}
  skin(G(black),[[[-.07,neckY+.02,neckZ-.04],[.07,neckY+.02,neckZ-.04]],[[-.078,h-.02,.12],[.078,h-.02,.12]],[[-.07,h-.06,-.08],[.07,h-.06,-.08]]],2,steps(8,4));
  F.roundBox(G(brake),0,pivotY-.12,.14,.17,.018,half*.6,.008,{segments:1});
  seat([[seatRear,.05,h-.05,h-.008,h+.008],[seatRear+.07,.085,h-.055,h-.014,h+.01],[(seatRear+seatFront)*.5,.08,h-.062,h-.022,h],[seatFront,.045,h-.06,h-.028,h-.012]]);
  skin(G(black),[[[-.06,h-.06,seatRear+.1],[-.065,h-.03,seatRear-.06],[-.04,h+.02,seatRear-.2]],[[.06,h-.06,seatRear+.1],[.065,h-.03,seatRear-.06],[.04,h+.02,seatRear-.2]]],2,steps(6,3));F.roundBox(G(m.tail),0,h+.012,seatRear-.19,.06,.012,.02,.005,{segments:1});pegs();stand();
 }else if(mini){
  // Mini bike: an exposed tube cradle round a ribbed battery box, a long flat bench seat and a grab loop.
  for(const side of[-1,1]){const x=side*cx;pipe(G(frame),[[x*.4,neckY,neckZ],[x,.6,.2],[x,.59,-.5],[x*.85,.61,-.66]],.02,8);pipe(G(frame),[[x*.4,neckY-.1,neckZ+.02],[x,pivotY-.02,.2],[x,pivotY-.08,.02],[x,pivotY-.02,-.12],[x,.59,-.3]],.02,8);pipe(G(frame),[[x,.6,.12],[x,pivotY-.03,.14]],.016,6);}
  pipe(G(frame),[[-cx*.85,.61,-.66],[-.1,.63,-.72],[.1,.63,-.72],[cx*.85,.61,-.66]],.02,8);
  F.roundBox(G(black),0,.43,.04,.21,.25,.36,.03,{segments:2});if(detail>1)for(let n=0;n<6;n++)for(const side of[-1,1]){const from=G(satin).count;F.roundBox(G(satin),side*.108,.43,-.1+n*.055,.008,.2,.018,.003,{segments:1});G(satin).transform(from,new T.Matrix4().makeTranslation(0,.43,0).multiply(new T.Matrix4().makeRotationX(-.3)).multiply(new T.Matrix4().makeTranslation(0,-.43,0)));}
  seat([[seatRear,.11,h-.05,h-.005,h+.01],[seatRear+.05,.135,h-.055,h-.01,h+.012],[(seatRear+seatFront)*.5,.135,h-.06,h-.014,h+.01],[seatFront-.04,.12,h-.06,h-.016,h+.006],[seatFront,.08,h-.06,h-.03,h-.012]]);
  skin(SW(black),[[[-.07,rearLocal[1]+Rr+.03,rearLocal[2]+.2],[-.08,rearLocal[1]+Rr+.06,rearLocal[2]],[-.06,rearLocal[1]+Rr+.02,rearLocal[2]-.16]],[[.07,rearLocal[1]+Rr+.03,rearLocal[2]+.2],[.08,rearLocal[1]+Rr+.06,rearLocal[2]],[.06,rearLocal[1]+Rr+.02,rearLocal[2]-.16]]],2,steps(8,4));
  F.roundBox(G(m.tail),0,h-.04,seatRear-.02,.1,.022,.014,.006,{segments:1});pegs();stand();
 }else if(pedal){
  // Bicycles: a diamond frame sized to the wheels, with the bars and fork of each discipline.
  const bb=[0,a.crank.y,a.crank.z],seatTop=[0,h-.06,-.2],head=[0,st.y-.1,st.z-.02],headLow=[0,st.y-.2,st.z+.01],r=cyc==='bmx'?.019:cyc==='road'?.015:.019;
  pipe(G(frame),[seatTop,[0,head[1]+(cyc==='road'?0:-.02),head[2]]],r,8);pipe(G(frame),[bb,headLow],r*1.15,8);pipe(G(frame),[bb,[0,h-.04,-.21]],r,8);pipe(G(chrome),[[0,h-.08,-.2],[0,h-.01,-.215]],.012,6);
  for(const side of[-1,1])pipe(SW(frame),[[side*.03,h-.1-pivotY,-.2-pivotZ],[side*armX,rearLocal[1],rearLocal[2]]],.008,6);
  seat([[-.35,.03,h-.03,h-.01,h+.005],[-.3,.07,h-.035,h-.012,h+.008],[-.2,.055,h-.035,h-.016,h+.004],[-.08,.02,h-.03,h-.018,h-.004]]);
  if(cyc==='bmx')for(const side of[-1,1])for(const z of[-half,half])drum(z>0?SL(chrome):SW(chrome),side*(z>0?.11:armX+.06),z>0?Rf:rearLocal[1],z>0?half:rearLocal[2],.018,.1,8);
 }else{
  // Fat-tyre cruiser: one straight top tube from the steering head to the tail, a tank-shaped battery on it and
  // a long flat bench seat.
  for(const side of[-1,1]){const x=side*.075;pipe(G(frame),[[x*.5,neckY+.02,neckZ],[x,.74,.22],[x,.745,-.58]],.021,8);pipe(G(frame),[[x*.5,neckY-.1,neckZ+.02],[x,.36,.14],[x,.33,.04]],.02,8);pipe(G(frame),[[x,.33,.04],[x,.6,-.22],[x,.745,-.36]],.019,8);pipe(G(frame),[[x,.745,-.58],[x*.7,.76,-.64]],.021,6);}
  pipe(G(frame),[[-.052,.76,-.64],[0,.765,-.67],[.052,.76,-.64]],.021,6);
  const from=G(plastic).count;F.ellipsoid(G(plastic),0,.86,.17,.1,.085,.24,{nu:steps(20,8),nv:steps(14,6),warp:(x,y,z,o)=>{o[0]=x*(1-.25*Math.max(0,-z));o[1]=y<0?y*.5:y*(1-.3*Math.max(0,-z));o[2]=z;}});
  F.roundBox(G(black),0,.775,.17,.15,.03,.44,.012,{segments:1});F.roundBox(G(chrome),0,.948,.28,.04,.01,.04,.004,{segments:1});
  F.roundBox(G(black),0,.5,.03,.11,.2,.2,.03,{segments:1});
  seat([[seatRear,.1,h-.05,h-.006,h+.01],[seatRear+.06,.125,h-.055,h-.01,h+.012],[(seatRear+seatFront)*.5,.125,h-.058,h-.014,h+.01],[seatFront-.03,.11,h-.058,h-.016,h+.006],[seatFront+.03,.07,h-.05,h-.022,h-.006]]);
  if(detail>2)for(let z=seatRear+.08;z<seatFront-.03;z+=.07)pipe(G(black),[[-.118,h+.006,z],[0,h+.016,z],[.118,h+.006,z]],.003,4);
  skin(SW(black),[[[-.07,rearLocal[1]+Rr+.04,rearLocal[2]+.22],[-.078,rearLocal[1]+Rr+.07,rearLocal[2]],[-.06,rearLocal[1]+Rr+.02,rearLocal[2]-.2]],[[.07,rearLocal[1]+Rr+.04,rearLocal[2]+.22],[.078,rearLocal[1]+Rr+.07,rearLocal[2]],[.06,rearLocal[1]+Rr+.02,rearLocal[2]-.2]]],2,steps(8,4));
  F.roundBox(G(m.tail),0,.745,-.675,.07,.03,.012,.006,{segments:1});stand();
 }
 if(d.seats.length>1){const rear=d.seats[1].position;g.userData.rearPassenger={seat:{...rear},footPegY:rear.y-.43,footPegZ:rear.z+.1};}
 if(s.bicycle){const crank=new T.Group();crank.position.set(a.crank.x,a.crank.y,a.crank.z);g.add(dyn(crank,'bicycle-crank'));E.crank=crank;const cs=sh(crank,black);drum(cs,-.12,0,0,cyc==='road'?.095:.08,.006,steps(24,10));drum(sh(crank,chrome),0,0,0,.02,.16,8);for(const side of[-1,1]){const z=side<0?.12:-.12;beam(sh(crank,brake),[side*.13,0,0],[side*.14,0,z],.014,.022,.004);F.roundBox(cs,side*.19,0,z,.1,.02,.065,.005,{segments:1});}}
 // Name on each side, as before.
 if(typeof document!=='undefined'&&!pedal&&detail>1){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=mini?'#17191b':cruiser?'#26382c':dirt?'#1d2023':'#e7dfc3';ctx.fillRect(0,0,512,128);ctx.fillStyle=mini?'#e6e2d8':cruiser?'#e8ddc0':dirt?'#f3f1ea':'#222b2e';ctx.font='900 44px sans-serif';ctx.textAlign='center';ctx.fillText(d.name.toUpperCase().replace('THE ',''),256,80);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;const badgeMat=material(0xffffff,.65,0,{map:texture,side:T.DoubleSide});
  for(const side of[-1,1]){const badge=k.mesh(new T.PlaneGeometry(mini?.3:.22,mini?.05:.055),badgeMat,g,side*(mini?.137:cruiser?.104:trail?.082:dirt?.172:.106),mini?h-.03:cruiser?.86:trail?h-.1:dirt?h-.135:(pivotY+h)/2+.05,mini?-.2:cruiser?.17:trail?.02:dirt?(st.z+seatFront)/2-.03:.12);badge.rotation.y=side*Math.PI/2;badge.name='fictional-brand-badge';}}
 if(c.powerPack&&d.electric){const stages=clamp(c.powerPack,1,4);F.roundBox(G(black),0,pivotY+.12,.04,.24+stages*.02,.12+stages*.03,.3,.03,{segments:1});for(let n=0;n<stages;n++)F.roundBox(G(ac),.125+stages*.01,pivotY+.09+n*.03,.05,.008,.016,.2,.003,{segments:1});}
 if(c.speedDongle){F.roundBox(G(material(0x777c80,.6,.15)),.13,h-.2,-.12,.05,.08,.15,.008,{segments:1});F.roundBox(G(material(0xf07828,.5,.1)),.15,h-.19,.13,.04,.03,.045,.005,{segments:1});pipe(G(black),[[.13,h-.2,-.04],[.16,h-.12,.02],[.15,h-.19,.12]],.006,5);}
 // Shapes become meshes. Fork and slider parts were laid out in bike space, so they move into the fork's frame.
 const toSwing=new T.Matrix4().makeTranslation(0,0,0);
 for(const[parent,map]of bins)for(const[mat,shp]of map){if(!shp.triangles)continue;if(parent===fork||parent===slide)shp.transform(0,toFork);const geo=shp.geometry();geo.deleteAttribute('color');const o=new T.Mesh(geo,mat);o.castShadow=o.receiveShadow=true;parent.add(o);}
 update(g,{visual:{wheelSpin:0,steer:0,suspension:[0,0]}},0,p);
}
function update(g,e,dt,parts){const E=parts.electric;if(!E)return;const s=E.spec,v=e.visual||{},fc=clamp(v.suspension?.[0]||0,0,s.travel),rc=clamp(v.suspension?.[1]||0,0,s.travel);
 for(const reduced of E.lodModels||[]){update(reduced,e,dt,reduced.userData.parts);const color=e.customization?.paint;if(Number.isInteger(color)){reduced.userData.materials.body.color.setHex(color);reduced.userData.materials.electricFrame.color.setHex(color);}}
 E.fork.quaternion.copy(E.forkBase).multiply(new T.Quaternion().setFromAxisAngle(up,v.steer||0));E.slider.position.y=fc;E.swing.rotation.x=Math.asin(clamp(rc/E.swingLength,-.4,.4));
 for(const w of parts.wheels)if(w.electric)w.spin.rotation.x=(v.wheelSpin||0)*s.rearRadius/w.radius;
 const end=E.shockBottom.clone().applyAxisAngle(new T.Vector3(1,0,0),E.swing.rotation.x).add(E.swingOrigin),dir=end.clone().sub(E.shockTop),length=dir.length();E.shock.position.copy(end).add(E.shockTop).multiplyScalar(.5);E.shock.quaternion.setFromUnitVectors(up,dir.normalize());E.shock.scale.y=length;
 const rear=new T.Vector3(E.chainX,s.rearRadius-E.swingOrigin.y,-s.wheelbase/2-E.swingOrigin.z).applyAxisAngle(new T.Vector3(1,0,0),E.swing.rotation.x).add(E.swingOrigin),motor=E.motorOnSwing?E.motorLocal.clone().applyAxisAngle(new T.Vector3(1,0,0),E.swing.rotation.x).add(E.swingOrigin):E.motorPoint;
 for(const part of E.chains){const a=motor.clone(),b=rear.clone();a.y+=part.side*(s.bicycle?.071:.045);b.y+=part.side*(s.bicycle?.035:s.mini?.05:.079);const span=b.clone().sub(a);part.mesh.position.copy(a).add(b).multiplyScalar(.5);part.mesh.quaternion.setFromUnitVectors(up,span.clone().normalize());part.mesh.scale.y=span.length();}
 if(E.crank)E.crank.rotation.x=e.typeId&&root.CityVehicles?.byId[e.typeId]?.pedalOnly?(v.wheelSpin||0)*.38:0;
}
root.CityElectricBikeModels={build,update,kit:{skin,mirror,beam,pipe,drum,cube}};
})(typeof globalThis!=='undefined'?globalThis:this);
