
/* PLATDO City: the Sky Scout drone. It uses City's active world, collision map and renderer. The pilot never becomes
 * the drone and its transform is never included in a game save.
 *
 * V10.6: a new model and a new way of moving. The drone is a camera quadcopter about 54 cm from motor to motor, small
 * enough to fit inside the 38 cm sphere it collides with (the old block reached 82 cm, twice what it collided as):
 * - a shaped fuselage in the shell colour with a dark belly pan and a raised battery pack, a GPS puck, side vents, a
 *   glass visor and two sensor eyes on the nose;
 * - four tapered arms on hinge knuckles, each ending in a motor (mount, stator, bell, shaft) over a landing leg with a
 *   rubber foot;
 * - four two-blade propellers with real twist and taper and pale tips, two turning each way; at speed the blades fade
 *   into a blur disc, the way a spinning propeller looks;
 * - a camera on a gimbal under the nose (damper plate, yaw motor, yoke, pitch motors, camera head, lens) that stays
 *   level while the drone tilts and looks where the pilot looks;
 * - red lights on the front motors, green on the rear ones and a flashing beacon on the tail.
 * Everything fixed is merged into one mesh per material, and every drone shares the same geometry, so a whole drone is
 * about 5,500 triangles in 17 draws.
 * No two faces share a plane: parts either sink into each other or stand clear.
 *
 * How it moves: it leaves the pilot's hand and rises to its hover while the motors spin up; it leans with its
 * acceleration (nose down to speed up, nose up to stop) and banks into turns; each motor speeds up or slows down with
 * what the drone is doing; hovering, it drifts a centimetre or so; held down on the ground with the sticks let go it
 * settles on its legs and idles, and lifts off again when asked; put away, it comes down to the ground under it and
 * spins down. The camera view follows the true flight position, so none of this shakes the picture. */
(function(root){
'use strict';
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const wrap=a=>{a=(a+Math.PI)%(Math.PI*2);if(a<0)a+=Math.PI*2;return a-Math.PI;};
/* V13.8: a lean follows on a soft spring (critically damped, w = how quick): it starts and stops smoothly instead of snapping; returns [angle, its speed] */
const lean=(x,v,want,dt,w)=>{const n=Math.max(1,Math.ceil(dt/.02)),h=dt/n,k=w*w,c=2*w;for(let i=0;i<n;i++){v+=((want-x)*k-v*c)*h;x+=v*h;}return[x,v];};
const shells=['#53a8bc','#c98b4b','#9a8bb9'];
const FOOT=.115,RADIUS=.38,LEAN_W=6;/* V13.8: lean spring: about a third of a second to most of the way (it was a tenth, and started with a jump) *//* the feet are this far under the centre; the collision sphere */
const MOTORS=[[.2,.008,.17,1],[-.2,.008,.17,-1],[.2,.008,-.19,-1],[-.2,.008,-.19,1]];/* x, y, z, turning direction */
const PROP_Y=.056,PROP_R=.105;

/* ---- building blocks ---- */
function geometry(T,pos,idx){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
// a body drawn through cross-sections along z: [z, half width, half height, centre y]; power 2 is an ellipse, more is boxier
function loft(T,stations,segs=14,power=2.6,caps='both'){
  const pos=[],idx=[],sp=v=>Math.sign(v)*Math.pow(Math.abs(v),2/power),n=stations.length;
  for(const [z,hw,hh,yc=0] of stations)for(let k=0;k<segs;k++){const a=k/segs*Math.PI*2;pos.push(hw*sp(Math.cos(a)),yc+hh*sp(Math.sin(a)),z);}
  for(let s=0;s<n-1;s++)for(let k=0;k<segs;k++){const a=s*segs+k,b=s*segs+(k+1)%segs,c=a+segs,d=b+segs;idx.push(a,b,d,a,d,c);}
  if(caps==='both'||caps==='start'){const c=pos.length/3,[z,,,yc=0]=stations[0];pos.push(0,yc,z);for(let k=0;k<segs;k++)idx.push(c,(k+1)%segs,k);}
  if(caps==='both'||caps==='end'){const c=pos.length/3,[z,,,yc=0]=stations[n-1],o=(n-1)*segs;pos.push(0,yc,z);for(let k=0;k<segs;k++)idx.push(c,o+k,o+(k+1)%segs);}
  return geometry(T,pos,idx);
}
// a tapered strut from a to b, flattened across its height
function strut(T,a,b,r0,r1,segs=8,flat=1){
  const A=new T.Vector3(...a),B=new T.Vector3(...b),axis=B.clone().sub(A),len=axis.length();axis.normalize();
  const up=new T.Vector3(0,1,0),u=up.clone().addScaledVector(axis,-up.dot(axis));if(u.lengthSq()<1e-4)u.set(0,0,1);u.normalize();
  const v=new T.Vector3().crossVectors(axis,u),g=new T.CylinderGeometry(r1,r0,len,segs,1);
  g.scale(1,1,flat);g.applyMatrix4(new T.Matrix4().makeBasis(v,axis,u));g.translate((A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2);return g;
}
function place(T,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1){return new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz));}
// collects parts of one material into a single mesh, each part in its own tint
class Bucket{
  constructor(T){this.T=T;this.p=[];this.n=[];this.c=[];}
  add(g,color='#ffffff',m=null){
    const h=g.index?g.toNonIndexed():g;if(m)h.applyMatrix4(m);
    const P=h.attributes.position.array,N=h.attributes.normal.array,col=new this.T.Color(color);
    for(let i=0;i<P.length;i+=3){this.p.push(P[i],P[i+1],P[i+2]);this.n.push(N[i],N[i+1],N[i+2]);this.c.push(col.r,col.g,col.b);}
    if(h!==g)h.dispose();g.dispose();return this;
  }
  build(){const T=this.T,g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));g.computeBoundingSphere();return g;}
}
// one propeller blade along +x, with twist, taper and a pale tip; turning +1 leads with its -z edge
function blade(T,turning){
  const pos=[],col=[],idx=[],n=8,dark=new T.Color('#20262b'),tip=new T.Color('#e9e2d2');
  for(let i=0;i<=n;i++){
    const t=i/n,r=.011+(PROP_R-.011)*t,chord=t<.3?.015+.012*smooth(0,.3,t):.027-.016*Math.pow((t-.3)/.7,1.5),thick=.0032-.0019*t,
      pitch=(.46-.31*Math.pow(t,.8)),sweep=-.005*t*t,c=Math.cos(pitch),s=Math.sin(pitch),hue=t>.84?tip:dark;
    for(const [q,y] of [[chord*.42,0],[chord*.06,thick],[-chord*.58,0],[chord*.06,-thick*.55]]){
      const qq=q+sweep,along=qq*c-y*s,rise=qq*s+y*c;pos.push(r,rise,-along*turning);col.push(hue.r,hue.g,hue.b);
    }
  }
  for(let i=0;i<n;i++)for(let k=0;k<4;k++){const a=i*4+k,b=i*4+(k+1)%4,c=a+4,d=b+4;if(turning>0)idx.push(a,b,d,a,d,c);else idx.push(a,d,b,a,c,d);}
  const o=n*4;if(turning>0)idx.push(o,o+1,o+2,o,o+2,o+3);else idx.push(o,o+2,o+1,o,o+3,o+2);
  const g=geometry(T,pos,idx);g.setAttribute('color',new T.Float32BufferAttribute(col,3));return g;
}
function propeller(T,turning){
  const b=new Bucket(T);
  for(const turn of [0,Math.PI]){const g=blade(T,turning).toNonIndexed();g.rotateY(turn);const P=g.attributes.position.array,N=g.attributes.normal.array,C=g.attributes.color.array;for(let i=0;i<P.length;i++){b.p.push(P[i]);b.n.push(N[i]);b.c.push(C[i]);}g.dispose();}
  b.add(new T.CylinderGeometry(.0105,.0125,.011,12),'#1c2125',place(T,0,-.0005,0));
  b.add(new T.CylinderGeometry(.0048,.0056,.005,8),'#aab4ba',place(T,0,.0072,0));
  return b.build();
}
// what a spinning propeller looks like from a distance: a faint disc, denser toward the pale tips
function blurTexture(T){
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=64;
  const ring=g.createRadialGradient(r,r,0,r,r,r);
  ring.addColorStop(0,'rgba(30,36,42,0)');ring.addColorStop(.1,'rgba(30,36,42,0)');ring.addColorStop(.16,'rgba(30,36,42,.42)');ring.addColorStop(.45,'rgba(34,40,46,.3)');
  ring.addColorStop(.8,'rgba(40,46,52,.24)');ring.addColorStop(.86,'rgba(214,208,194,.36)');ring.addColorStop(.97,'rgba(226,219,204,.42)');ring.addColorStop(1,'rgba(226,219,204,0)');
  g.fillStyle=ring;g.beginPath();g.arc(r,r,r,0,Math.PI*2);g.fill();
  g.globalCompositeOperation='source-atop';
  for(let k=0;k<4;k++){const a=k*Math.PI/2+.3;g.fillStyle='rgba(24,29,34,.16)';g.beginPath();g.moveTo(r,r);g.arc(r,r,r,a,a+.5);g.closePath();g.fill();}
  const t=new T.CanvasTexture(c);if('colorSpace' in t&&T.SRGBColorSpace)t.colorSpace=T.SRGBColorSpace;else if(T.sRGBEncoding)t.encoding=T.sRGBEncoding;return t;
}
// the parts every drone shares, built once for a copy of the 3D library
const kits=new WeakMap();
function kit(T){
  let k=kits.get(T);if(k)return k;
  const shell=new Bucket(T),frame=new Bucket(T),metal=new Bucket(T),glass=new Bucket(T),lights=new Bucket(T),beacon=new Bucket(T);
  /* fuselage (shell colour) */
  shell.add(loft(T,[[-.162,.016,.011,.004],[-.15,.04,.024,.002],[-.12,.056,.032,0],[-.05,.062,.036,0],[.03,.062,.036,0],[.09,.057,.033,-.001],[.13,.046,.028,-.004],[.15,.036,.022,-.006],[.16,.022,.014,-.007]],16,3.1));
  /* belly pan, battery pack, GPS puck, vents */
  frame.add(loft(T,[[-.146,.03,.016,-.022],[-.118,.047,.024,-.021],[-.04,.053,.026,-.02],[.05,.053,.026,-.02],[.105,.044,.023,-.021],[.138,.027,.015,-.023]],14,3.4),'#1d2429');
  frame.add(loft(T,[[-.156,.026,.012,.026],[-.138,.04,.019,.024],[-.06,.045,.021,.023],[.012,.044,.02,.022],[.05,.036,.014,.02],[.072,.02,.007,.018]],14,3.6),'#262e34');
  frame.add(new T.CylinderGeometry(.021,.023,.009,16),'#2f393f',place(T,0,.0365,.103));
  metal.add(new T.CylinderGeometry(.0045,.0045,.004,8),'#c9d1d6',place(T,0,.0455,-.118));/* power button */
  for(const side of [-1,1])for(let i=0;i<3;i++)frame.add(new T.BoxGeometry(.006,.0045,.022),'#11161a',place(T,side*.0615,.004,-.038+i*.034,0,side*.05,side*.5));
  /* nose: a glass visor and two sensor eyes with metal rims */
  glass.add(new T.SphereGeometry(.03,14,10),'#0b1016',place(T,0,.0065,.1495,0,0,0,1,.36,.42));
  for(const side of [-1,1]){
    metal.add(new T.CylinderGeometry(.0085,.0085,.006,12),'#8d979d',place(T,side*.0125,-.0128,.1595,Math.PI/2,0,0));
    glass.add(new T.CylinderGeometry(.0062,.0062,.0074,12),'#05080b',place(T,side*.0125,-.0128,.1602,Math.PI/2,0,0));
  }
  /* arms, knuckles, motors, legs and lights */
  for(const [x,y,z] of MOTORS){
    const sx=Math.sign(x),sz=Math.sign(z),front=sz>0,sh=[sx*.046,-.004,front?.074:-.094];
    frame.add(strut(T,sh,[x,y,z],.021,.0135,8,.62),'#2a3238');
    /* a band in the shell colour round each arm */{const at=f=>[sh[0]+(x-sh[0])*f,sh[1]+(y-sh[1])*f,sh[2]+(z-sh[2])*f];shell.add(strut(T,at(.6),at(.71),.0182,.0174,8,.64));}
    /* the hinge knuckle the arm folds on, on the side of the fuselage */metal.add(new T.CylinderGeometry(.0165,.0165,.03,12),'#58636a',place(T,sx*.066,sh[1],sh[2]));
    frame.add(new T.CylinderGeometry(.0185,.0185,.012,12),'#151a1e',place(T,sx*.066,sh[1],sh[2]));
    frame.add(new T.CylinderGeometry(.026,.0235,.017,14),'#20272c',place(T,x,y+.001,z));/* mount */
    metal.add(new T.CylinderGeometry(.021,.022,.009,14),'#3a4349',place(T,x,y+.0125,z));/* stator */
    metal.add(new T.CylinderGeometry(.0228,.0246,.021,16),front?'#c8ced2':'#8f999f',place(T,x,y+.0265,z));/* bell */
    metal.add(new T.CylinderGeometry(.0185,.0228,.004,16),'#aeb7bc',place(T,x,y+.0388,z));
    metal.add(new T.CylinderGeometry(.0042,.0042,.012,8),'#d7dde0',place(T,x,y+.0445,z));/* shaft */
    const foot=[x*1.1,-FOOT+.008,z+sz*.028];
    frame.add(strut(T,[x,y-.006,z],foot,.0086,.005,7,1),'#242b30');
    frame.add(new T.SphereGeometry(.0105,10,7),'#0e1114',place(T,foot[0],foot[1]-.0015,foot[2],0,0,0,1,.62,1));
    lights.add(new T.SphereGeometry(.0058,8,6),front?'#ff3a2c':'#35e56f',place(T,x,y-.001,z+sz*.0255,0,0,0,1,.75,.7));
  }
  beacon.add(new T.BoxGeometry(.02,.006,.005),'#f4f8ff',place(T,0,.011,-.1625));
  /* gimbal mount under the nose: a damper plate on four rubber dampers, and the yaw motor */
  frame.add(new T.BoxGeometry(.05,.006,.04),'#161b1f',place(T,0,-.0495,.104));
  for(const dx of [-.017,.017])for(const dz of [-.012,.012])frame.add(new T.CylinderGeometry(.0042,.0042,.008,6),'#3b2a26',place(T,dx,-.0445,.104+dz));
  metal.add(new T.CylinderGeometry(.0125,.0125,.009,14),'#4a545a',place(T,0,-.0555,.104));
  /* the gimbal yoke (turns to stay level) and the camera head (tilts to look) */
  const yoke=new Bucket(T);
  yoke.add(new T.BoxGeometry(.062,.008,.01),'#1b2125',place(T,0,-.004,0));
  for(const side of [-1,1]){
    yoke.add(new T.BoxGeometry(.006,.03,.012),'#1b2125',place(T,side*.031,-.018,0));
    yoke.add(new T.CylinderGeometry(.0072,.0072,.006,10),'#67727a',place(T,side*.0365,-.022,0,0,0,Math.PI/2));
  }
  const head=new Bucket(T);
  head.add(loft(T,[[-.019,.0165,.0118,0],[-.015,.02,.0145,0],[.012,.02,.0145,0],[.017,.0165,.0118,0]],12,4.2),'#2b3338');
  head.add(new T.CylinderGeometry(.012,.013,.012,14),'#14181b',place(T,0,0,.0215,Math.PI/2,0,0));
  head.add(new T.CylinderGeometry(.0032,.0032,.0045,6),'#59636a',place(T,.0125,.0105,.0165,Math.PI/2,0,0));
  head.add(new T.CylinderGeometry(.0034,.0034,.059,8),'#59636a',place(T,0,0,0,0,0,Math.PI/2));/* the axle it tilts on, between the yoke arms */
  const lens=new Bucket(T);
  lens.add(new T.CylinderGeometry(.0096,.0096,.004,14),'#0a0f18',place(T,0,0,.0268,Math.PI/2,0,0));
  lens.add(new T.SphereGeometry(.007,10,6,0,Math.PI*2,0,Math.PI/2),'#1a2440',place(T,0,0,.0284,Math.PI/2,0,0,1,.3,1));
  const disc=new T.CircleGeometry(PROP_R+.002,28);disc.rotateX(-Math.PI/2);
  k={hull:shell.build(),frame:frame.build(),metal:metal.build(),glass:glass.build(),lights:lights.build(),beacon:beacon.build(),yoke:yoke.build(),head:head.build(),lens:lens.build(),
    props:{1:propeller(T,1),'-1':propeller(T,-1)},disc,blur:blurTexture(T),
    mats:{
      frame:new T.MeshStandardMaterial({vertexColors:true,roughness:.58,metalness:.18}),
      metal:new T.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.82}),
      glass:new T.MeshStandardMaterial({vertexColors:true,roughness:.07,metalness:.55}),
      lights:new T.MeshBasicMaterial({vertexColors:true}),
    }};
  for(const m of Object.values(k.mats))m.userData.sharedDrone=true;
  kits.set(T,k);return k;
}
function model(T,shell=0){
  const k=kit(T),drone=new T.Group(),own=[],motors=[],rotors=[];
  const mesh=(g,m,parent=drone,cast=true)=>{const o=new T.Mesh(g,m);o.castShadow=cast;parent.add(o);return o;};
  const shellMat=new T.MeshStandardMaterial({color:shells[shell]||shells[0],roughness:.4,metalness:.12}),
    bladeMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.1,transparent:true}),
    discMat=new T.MeshBasicMaterial({map:k.blur,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});
  own.push(shellMat,bladeMat,discMat);
  const body=mesh(k.hull,shellMat);
  mesh(k.frame,k.mats.frame);mesh(k.metal,k.mats.metal);mesh(k.glass,k.mats.glass,drone,false);mesh(k.lights,k.mats.lights,drone,false);
  const beacon=mesh(k.beacon,k.mats.lights,drone,false);
  for(const [x,y,z,turning] of MOTORS){
    const hub=new T.Group();hub.position.set(x,y+PROP_Y-.008,z);drone.add(hub);
    const spinner=new T.Group();hub.add(spinner);mesh(k.props[turning],bladeMat,spinner,false);
    const disc=mesh(k.disc,discMat,hub,false);disc.position.y=.0012;disc.renderOrder=2;
    rotors.push(spinner);motors.push({spinner,disc,turning,fx:Math.sign(x),fz:Math.sign(z),rpm:0});
  }
  const gimbal=new T.Group();gimbal.position.set(0,-.0592,.104);gimbal.rotation.order='ZXY';drone.add(gimbal);
  mesh(k.yoke,k.mats.frame,gimbal);
  const camera=new T.Group();camera.position.set(0,-.022,0);gimbal.add(camera);
  mesh(k.head,k.mats.frame,camera);mesh(k.lens,k.mats.glass,camera,false);
  drone.name='Sky Scout';
  let clock=Math.random()*3;
  // dt seconds; s: climb, pitchCmd, rollCmd, yawCmd (each -1..1), grounded, power (0 = motors off), lookPitch, tiltX, tiltZ
  function animate(dt,s={}){
    clock+=dt;let mean=0;const power=s.power??1,grounded=!!s.grounded,climb=clamp(s.climb||0,-1,1),pc=clamp(s.pitchCmd||0,-1,1),rc=clamp(s.rollCmd||0,-1,1),yc=clamp(s.yawCmd||0,-1,1);
    for(const m of motors){
      const want=power<=0?0:grounded?.17:clamp(1+climb*.34-m.fz*pc*.14+m.fx*rc*.14+m.turning*yc*.06,.5,1.6);
      m.rpm+=(want-m.rpm)*(1-Math.exp(-dt*(want>m.rpm?7:2.6)));if(m.rpm<.004)m.rpm=0;
      m.spinner.rotation.y=(m.spinner.rotation.y+m.turning*m.rpm*84*dt)%(Math.PI*2);
      m.disc.rotation.y=(m.disc.rotation.y-m.turning*dt*(1.5+m.rpm*4))%(Math.PI*2);mean+=m.rpm/4;
    }
    const blur=smooth(.24,.86,mean);bladeMat.opacity=1-blur*.8;bladeMat.depthWrite=blur<.5;discMat.opacity=blur*.92;
    for(const m of motors)m.disc.visible=blur>.01;
    gimbal.rotation.set(-(s.tiltX||0),0,-(s.tiltZ||0));
    camera.rotation.x=-clamp(s.lookPitch||0,-1.3,.5);
    const beat=clock%1.4;beacon.visible=power>0&&(beat<.09||beat>.2&&beat<.29);
    return mean;
  }
  function dispose(){drone.removeFromParent();for(const m of own)m.dispose();}
  animate(0,{power:0});
  return{drone,body,rotors,motors,gimbal,camera,animate,dispose,foot:FOOT,radius:RADIUS};
}
/* V13.3: the Striker, the owner's FPV strike drone (admin only): an all-black rugged racing quad about 36 cm motor to
 * motor: a carbon X frame (the second arm 2 mm above the first), a stack under a top plate on four standoffs, a camera
 * at the front tilted up between two guards, four motors with black two-blade props, a small black bomb with tail fins
 * on a mount on top, three wires and one blinking red light at the back with an antenna. It flies like the Drone and
 * blows up on any contact (Flight.step). Parts sink into each other or stand clear: no two faces share a plane. */
const STRIKE_R=.24;
function strikerModel(T){
  const group=new T.Group();group.name='striker-drone';const own=[];let clock=0;
  const M=(c,o={})=>{const m=new T.MeshStandardMaterial({color:c,roughness:.82,metalness:.12,...o});own.push(m);return m;};
  const carbon=M('#141516',{roughness:.68}),matte=M('#0a0a0b'),metal=M('#2b2d30',{metalness:.55,roughness:.42}),glass=M('#04060a',{roughness:.08,metalness:.35}),
    light=M('#ff2020',{emissive:'#ff0000',emissiveIntensity:2.4,roughness:.35}),wires=[M('#8c1414'),M('#9a8616'),M('#1e1e1e')],
    propM=M('#0e0e0f',{roughness:.6,transparent:true,opacity:1,side:T.DoubleSide}),discM=new T.MeshBasicMaterial({color:'#121212',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});own.push(discM);
  const add=(geo,mat,x,y,z,rx=0,ry=0,rz=0,parent=group)=>{own.push(geo);const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const D=.127;
  add(new T.BoxGeometry(.4,.006,.034),carbon,0,0,0,0,Math.PI/4,0);add(new T.BoxGeometry(.4,.006,.034),carbon,0,.002,0,0,-Math.PI/4,0);
  add(new T.BoxGeometry(.075,.005,.12),carbon,0,.0045,0);
  add(new T.BoxGeometry(.05,.03,.07),matte,0,.0215,-.005);
  add(new T.BoxGeometry(.07,.004,.11),carbon,0,.044,0);
  for(const sx of[-1,1])for(const sz of[-1,1])add(new T.CylinderGeometry(.0035,.0035,.037,8),metal,sx*.029,.0245,sz*.048);
  const cam=new T.Group();cam.position.set(0,.026,.066);cam.rotation.x=-.42;group.add(cam);
  add(new T.BoxGeometry(.03,.028,.024),matte,0,0,0,0,0,0,cam);add(new T.CylinderGeometry(.0095,.011,.014,16),glass,0,.0004,.017,Math.PI/2,0,0,cam);
  for(const sx of[-1,1])add(new T.BoxGeometry(.004,.036,.032),carbon,sx*.0187,.0262,.063);
  const motors=[];
  for(const [x,z,turning] of [[D,D,1],[-D,D,-1],[D,-D,-1],[-D,-D,1]]){
    const mg=new T.Group();mg.position.set(x,0,z);group.add(mg);
    add(new T.CylinderGeometry(.016,.017,.004,16),metal,0,.0062,0,0,0,0,mg);add(new T.CylinderGeometry(.0145,.0145,.017,16),matte,0,.0158,0,0,0,0,mg);add(new T.CylinderGeometry(.0025,.0025,.009,8),metal,0,.0275,0,0,0,0,mg);
    /* the prop and its blur disc in a group of their own, so the view copy shows just the props (not the motor bells) */const pg=new T.Group();pg.position.set(x,.0285,z);group.add(pg);const spinner=new T.Group();pg.add(spinner);
    add(new T.CylinderGeometry(.006,.0065,.006,12),matte,0,0,0,0,0,0,spinner);add(new T.BoxGeometry(.126,.0022,.013),propM,0,.0012,0,turning*.2,0,0,spinner);
    const disc=add(new T.CircleGeometry(.064,28),discM,0,.0022,0,-Math.PI/2,0,0,pg);disc.castShadow=false;disc.visible=false;
    motors.push({spinner,disc,turning,rpm:0,fx:Math.sign(x),fz:Math.sign(z)});
  }
  /* the bomb on its mount, with a band and four tail fins */
  for(const sx of[-1,1])add(new T.BoxGeometry(.006,.013,.022),metal,sx*.012,.0515,0);
  const bomb=add(new T.SphereGeometry(.0185,18,12),matte,0,.0705,.002);bomb.scale.set(1,1,2.6);
  add(new T.TorusGeometry(.0189,.0022,8,24),metal,0,.0705,.014);
  for(const k of[0,1,2,3]){const a=k*Math.PI/2+Math.PI/4,f=add(new T.BoxGeometry(.0016,.016,.018),matte,Math.cos(a)*.016,.0705+Math.sin(a)*.016,-.046);f.rotation.z=a+Math.PI/2;}
  /* three wires from the stack to the bomb, and the red light with its antenna at the back */
  [[-.012,'r'],[0,'y'],[.012,'k']].forEach(([dx],i)=>{const c=new T.CatmullRomCurve3([new T.Vector3(dx,.034,-.036),new T.Vector3(dx*1.6,.06,-.052),new T.Vector3(dx*.8,.083,-.03),new T.Vector3(dx*.4,.088,-.008)]);add(new T.TubeGeometry(c,16,.0016,6,false),wires[i],0,0,0);});
  const lamp=add(new T.SphereGeometry(.0058,12,8),light,0,.0505,-.05);lamp.castShadow=false;
  add(new T.CylinderGeometry(.0018,.0024,.065,8),matte,0,.07,-.071,-.75,0,0);
  function animate(dt,s={}){
    clock+=dt;let mean=0;const power=s.power??1,grounded=!!s.grounded,climb=clamp(s.climb||0,-1,1),pc=clamp(s.pitchCmd||0,-1,1),rc=clamp(s.rollCmd||0,-1,1);
    for(const m of motors){const want=power<=0?0:grounded?.2:clamp(1+climb*.34-m.fz*pc*.14+m.fx*rc*.14,.5,1.6);m.rpm+=(want-m.rpm)*(1-Math.exp(-dt*(want>m.rpm?8:3)));if(m.rpm<.004)m.rpm=0;m.spinner.rotation.y=(m.spinner.rotation.y+m.turning*m.rpm*96*dt)%(Math.PI*2);mean+=m.rpm/4;}
    const blur=smooth(.3,.9,mean);propM.opacity=1-blur*.72;propM.depthWrite=blur<.5;discM.opacity=blur*.55;for(const m of motors)m.disc.visible=blur>.01;
    const beat=clock%.8;lamp.visible=power>0?beat<.14:false;return mean;
  }
  function dispose(){group.removeFromParent();for(const o of own)o.dispose();}
  animate(0,{power:0});
  return{drone:group,body:null,rotors:[],motors,animate,dispose,foot:.004,radius:STRIKE_R};
}
/* V13.3: Free Cam (admin only) has no body at all: nothing drawn, no shadow, nothing for anyone to see */
function ghost(T){const drone=new T.Group();drone.name='free-cam';return{drone,body:null,rotors:[],motors:[],animate(){return 0;},dispose(){drone.removeFromParent();},foot:0,radius:0};}
/* V13.3: a Free Cam still keeps out of places nobody may look into without the right (the mansion's rooms unless it is yours) */
function restricted(sim,pos){const M=root.CityMansion,w=sim?.world;try{return !!(M&&M.containsRestricted&&w?.mansion&&!M.owned?.(sim)&&M.containsRestricted(w,pos,{radius:.2,height:.35}));}catch(_){return false;}}
function clearance(world,origin,direction,distance,radius){
  const hit=world.raycast(origin,direction,distance,radius,{allowSeparating:true});
  return hit?Math.max(0,hit.distance-.04):distance;
}
const DOWN={x:0,y:-1,z:0};
// the ground under a point: the terrain, or a pavement, car park, floor or roof at or just below it (V10.6: the drone used
// to measure from the bare terrain, so over paving it sank its legs into the slab)
function groundAt(world,pos){const land=world.terrainHeight(pos.x,pos.z),top=world.groundHeight?world.groundHeight(pos.x,pos.z,pos.y+.3):land;return Number.isFinite(top)?Math.max(land,top):land;}
// how far the centre is above whatever is under it (ground, water, a roof), and whether that is water
function heightAbove(world,pos,time,reach=1.2){
  const land=groundAt(world,pos),water=world.waterHeight(pos.x,pos.z,time)??-Infinity;
  let h=pos.y-Math.max(land,water);const hit=world.raycast(pos,DOWN,reach,.05,{allowSeparating:true});
  if(hit)h=Math.min(h,hit.distance+.05);return{h,wet:water>land&&!(hit&&hit.distance+.05<pos.y-water-.02)};
}
/* drones that have been put away and are coming down to land */
const landings=[];
/* V12.2: where the drone was when you last put it away (this play session, this world); the next flight carries on from there */let last=null;
/* V12.2: the speed you chose (a quarter to three times the normal 24 m/s), kept from one flight to the next */let speedPref=1;
class Flight{
  constructor(scene,sim,shell,opts={}){
    const T=scene.T,p=sim.player,w=sim.world;
    this.pilot={x:p.x,y:p.y,z:p.z};this.yaw=p.yaw;this.pitch=-.12;
    this.velocity=new T.Vector3();this.direction=new T.Vector3();this.targetVelocity=new T.Vector3();
    this.position=new T.Vector3(p.x,p.y+1.65,p.z);
    const car=sim.currentVehicle(),reach=car?(car.length||4)/2+2:2;
    if(car)this.position.y+=Math.max(1,car.height||1.6);
    this.direction.set(Math.sin(this.yaw),0,Math.cos(this.yaw));
    this.position.addScaledVector(this.direction,clearance(w,this.position,this.direction,reach,RADIUS));
    this.view={position:new T.Vector3(),target:new T.Vector3(),fov:62};
    this.oldCamera={position:scene.camera.position.clone(),quaternion:scene.camera.quaternion.clone(),target:scene.target.clone(),fov:scene.camera.fov};
    /* V13.3: three kinds: the Drone (everyone), Free Cam and the Striker (the owner's account only) */this.kind=opts.kind==='freecam'||opts.kind==='striker'?opts.kind:'drone';this.id='f'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
    this.craft=this.kind==='striker'?strikerModel(T):this.kind==='freecam'?ghost(T):model(T,shell);Object.assign(this,{drone:this.craft.drone,body:this.craft.body,rotors:this.craft.rotors});if(this.kind!=='freecam')scene.scene.add(this.drone);
    /* V10.6: it starts in the pilot's hand (or just over the roof of their vehicle) and flies out to its hover */
    this.age=0;this.launch=new T.Vector3(car?0:p.x+this.direction.x*.42-this.position.x,car?-.45:p.y+1.18-this.position.y,car?0:p.z+this.direction.z*.42-this.position.z);
    this.offset=new T.Vector3().copy(this.launch);this.tiltX=0;this.tiltZ=0;this.tiltVX=0;this.tiltVZ=0;this.lastYaw=this.yaw;this.yawRate=0;this.landed=0;this.boom=0;this.world=w;
    /* V13.3: Free Cam starts at your eyes with nothing to throw; the Striker starts clear of everything (at least 1.2 m up) and never counts its pilot (or the vehicle they sit in) as a contact for its first second */
    if(this.kind==='freecam'){this.launch.set(0,0,0);this.offset.set(0,0,0);this.age=2;}
    if(this.kind==='striker'){this.grace=1;this.home=car?car.id:null;const under=heightAbove(w,this.position,sim.time,3);if(under.h<1.2)this.position.y+=1.2-under.h;}
    /* V12.2: back on the drone it carries on from where you last left it (no launch from the hand), and the copy that came down there goes */
    if(/* V12.4: only when you chose Resume last flight */opts.resume&&this.kind==='drone'&&last&&last.world===w&&[last.x,last.y,last.z].every(Number.isFinite)){this.position.set(last.x,last.y,last.z);this.yaw=last.yaw;this.pitch=last.pitch;this.lastYaw=this.yaw;this.age=2;this.launch.set(0,0,0);this.offset.set(0,0,0);while(landings.length)landings.pop().craft.dispose();}
    /* V12.2: the two front propellers of a copy of the drone sit at the top corners of your view (about twice life size, so the camera never cuts into them), spinning, so it is plain you are flying the drone */
    this.speed=speedPref;
    this.T=T;this._basis=new T.Matrix4();this._right=new T.Vector3();this.viewCraft=null;
    /* V13.3: always in the picture (hiding the drone screen no longer hides them); the Striker shows its own black props; Free Cam has none */if(this.kind!=='freecam')try{const vm=this.kind==='striker'?strikerModel(T):model(T,shell);vm.drone.traverse(o=>{if(o!==vm.drone)o.visible=false;if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});for(const m of vm.motors)if(m.fz>0)m.spinner.parent.traverse(o=>{o.visible=true;});vm.drone.scale.setScalar(this.kind==='striker'?3.3:2.2);scene.scene.add(vm.drone);this.viewCraft=vm;}catch(_){this.viewCraft=null;}
    this.updateView(w,0);this.pose(0,{h:9,wet:false},0,0);
  }
  /* V12.0: no limit up or down: keep looking up and you go over the top (a flip); upside down, left and right still turn the way they look */
  /* V12.2: the speed slider: 0.25 to 3 times the normal speed */
  setSpeed(v){/* V12.4: up to ten times the normal speed (it was three) */this.speed=speedPref=clamp(Number(v)||1,.25,10);return this.speed;}
  look(dx,dy){const flip=Math.cos(this.pitch)<0?-1:1;this.yaw=wrap(this.yaw-dx*flip);this.pitch=wrap(this.pitch-dy);}
  step(sim,dt,side,forward,vertical){
    /* V12.0: upside down after a flip, forward is still the way the camera faces; and it flies twice as fast (24 m/s across, 12 up and down) */
    /* V12.2: forward flies the way you look, up and down too: look up while going forward and it climbs without Space (upside down after a flip it still goes where the camera faces); sideways stays level, Space and crouch still go straight up and down */
    const w=sim.world,dx=Math.sin(this.yaw),dz=Math.cos(this.yaw),length=Math.max(1,Math.hypot(side,forward)),cp=Math.cos(this.pitch),sp=Math.sin(this.pitch);
    /* V12.4: 32 m/s across and 16 up at the normal speed (they were 24 and 12) */const top=32*(this.speed||1),climb=16*(this.speed||1);
    this.targetVelocity.set((dx*cp*forward-dz*side)*top/length,sp*forward*top/length+vertical*climb,(dz*cp*forward+dx*side)*top/length);
    this.velocity.lerp(this.targetVelocity,1-Math.exp(-dt*5));
    /* V13.3: a Striker that has gone off moves no more (the page shows DRONE DISCONNECTED and takes you back) */if(this.dead){this.age+=dt;this.dead.t+=dt;return;}
    const prev=this._prev||(this._prev=this.position.clone());prev.copy(this.position);
    for(const axis of ['x','z','y']){
      const distance=Math.abs(this.velocity[axis]*dt);
      if(distance<.00001)continue;
      this.direction.set(0,0,0);this.direction[axis]=Math.sign(this.velocity[axis]);
      /* V13.3: Free Cam goes through walls, buildings and everything else */if(this.kind==='freecam'){this.position[axis]+=this.direction[axis]*distance;continue;}
      const travel=clearance(w,this.position,this.direction,distance,this.kind==='striker'?STRIKE_R:RADIUS);
      this.position[axis]+=this.direction[axis]*travel;if(travel<distance)this.velocity[axis]=0;
      /* V13.3: the Striker touched something solid (a wall, a tree, a lamp, a door, a roof): it goes off right there */if(travel<distance&&this.kind==='striker'){this.blow({x:this.position.x+this.direction.x*STRIKE_R,y:this.position.y+this.direction.y*STRIKE_R,z:this.position.z+this.direction.z*STRIKE_R});return;}
    }
    const pos=this.position,edge=w.extent-.6;
    pos.x=clamp(pos.x,-edge,edge);pos.z=clamp(pos.z,-edge,edge);
    const surface=Math.max(groundAt(w,pos),w.waterHeight(pos.x,pos.z,sim.time)??-Infinity);
    /* V13.3: the Striker touching the ground or the water, or a person or a vehicle, goes off too */if(this.kind==='striker'){if(pos.y<=surface+STRIKE_R){this.blow({x:pos.x,y:surface,z:pos.z});return;}const hit=this.touching(sim);if(hit){this.blow(hit);return;}}
    /* V12.4: no height limit (it was 145 m over you or the ground); it only stays above the ground and the water */pos.y=Math.max(pos.y,surface+.42);
    /* V13.3: Free Cam stays out of the mansion's rooms unless you own it (the same rule as the Drone and as walking) */if(this.kind==='freecam'&&restricted(sim,pos)){pos.copy(prev);this.velocity.set(0,0,0);}
    const range=pos.distanceTo(this.pilot);
    /* V12.1: no distance limit any more (it was held within 160 m of the pilot); V12.4: no height limit either, only the edge of the world */
    this.age+=dt;this.world=w;
    this.updateView(w,dt);
    this.pose(dt,heightAbove(w,pos,sim.time),Math.abs(side)+Math.abs(forward),vertical);
  }
  /* V13.3: the Striker's contact with a person (on foot) or a vehicle: their real size, not a guess */
  touching(sim){const p=this.position,r=STRIKE_R,early=this.age<(this.grace||0);
    for(const a of [sim.player,...(sim.npcs||[])]){if(!a||a.vehicleId||!Number.isFinite(a.x))continue;if(early&&a===sim.player)continue;const dx=p.x-a.x,dz=p.z-a.z;if(dx*dx+dz*dz<(.36+r)*(.36+r)&&p.y>a.y-.1&&p.y<a.y+1.85+r)return{x:p.x,y:p.y,z:p.z};}
    for(const v of sim.vehicles||[]){if(!Number.isFinite(v.x)||early&&(v.id===this.home||v.id===sim.player?.vehicleId))continue;const L=(v.length||4.4)/2+r,W=(v.width||1.9)/2+r,H=(v.height||1.6)+r,dx=p.x-v.x,dz=p.z-v.z;if(dx*dx+dz*dz>(L+W)*(L+W))continue;const sy=Math.sin(v.yaw||0),cy=Math.cos(v.yaw||0),f=dx*sy+dz*cy,s=-dx*cy+dz*sy;if(Math.abs(f)<L&&Math.abs(s)<W&&p.y>(v.y||0)-.2&&p.y<(v.y||0)+H)return{x:p.x,y:p.y,z:p.z};}
    return null;}
  /* V13.3: the Striker has gone off at this point: it is gone at once; the page sets off the explosion (the host does online) */
  blow(point){if(this.dead)return;this.dead={point:{x:point.x,y:point.y,z:point.z},t:0,sent:false};this.velocity.set(0,0,0);this.drone.visible=false;if(this.viewCraft)this.viewCraft.drone.visible=false;}
  // how the drone looks this frame (the flight position itself is never changed here)
  pose(dt,under,sticks,vertical){
    const v=this.velocity,tv=this.targetVelocity,dx=Math.sin(this.yaw),dz=Math.cos(this.yaw),ease=r=>1-Math.exp(-dt*r);
    const vf=v.x*dx+v.z*dz,vs=v.x*dz-v.z*dx,af=((tv.x-v.x)*dx+(tv.z-v.z)*dz)*5,as=((tv.x-v.x)*dz-(tv.z-v.z)*dx)*5,speed=Math.hypot(v.x,v.z);
    if(dt>0){const rate=clamp(wrap(this.yaw-this.lastYaw)/dt,-6,6);this.yawRate+=(rate-this.yawRate)*ease(8);}this.lastYaw=this.yaw;
    /* landing: held down on something dry with the sticks let go, it settles onto its legs */
    const down=sticks<.05&&vertical<=0&&under.h<.5&&speed<.8&&!under.wet?1:0;
    this.landed+=(down-this.landed)*ease(down?3:6.5);if(this.landed<.002)this.landed=0;
    const settle=smooth(0,1,this.landed),flying=1-settle;
    /* leaving the hand */
    const out=clamp(this.age/1.15,0,1),hand=Math.pow(1-out,3);
    /* it leans with its acceleration and a little with its speed, and banks into turns */
    const wantX=clamp(vf*.013+af*.0105,-.44,.44)*flying*(1-hand),wantZ=-clamp(vs*.013+as*.0105+this.yawRate*vf*.0042,-.44,.44)*flying*(1-hand);
    [this.tiltX,this.tiltVX]=lean(this.tiltX,this.tiltVX||0,wantX,dt,LEAN_W);[this.tiltZ,this.tiltVZ]=lean(this.tiltZ,this.tiltVZ||0,wantZ,dt,LEAN_W);
    /* hovering, it is never perfectly still */
    const t=this.age,hover=flying*(1-clamp(speed/5,0,1))*(1-hand),bob=(Math.sin(t*1.9)*.011+Math.sin(t*3.1+1.3)*.005)*hover;
    this.offset.copy(this.launch).multiplyScalar(hand);
    this.offset.y+=bob-settle*Math.max(0,Math.min(under.h,.6)-FOOT-.004);
    this.drone.position.copy(this.position).add(this.offset);
    const rx=this.tiltX+Math.sin(t*1.7+2)*.011*hover,rz=this.tiltZ+Math.sin(t*1.3+.4)*.013*hover;
    this.drone.rotation.set(rx,this.yaw,rz,'YXZ');
    this.craft.animate(dt,{climb:v.y/7+(1-out)*.5,pitchCmd:this.tiltX/.44,rollCmd:this.tiltZ/.44,yawCmd:this.yawRate/4,grounded:this.landed>.55,lookPitch:this.pitch,tiltX:rx,tiltZ:rz});
    if(this.viewCraft)try{this.viewCraft.animate(dt,{climb:v.y/7+.2,pitchCmd:this.tiltX/.44,rollCmd:this.tiltZ/.44,yawCmd:this.yawRate/4,grounded:this.landed>.55});}catch(_){}
  }
  updateView(w,dt=0){
    /* V12.0: first person only: the view is the drone's own camera at its nose, looking where you look. Its up direction turns over with the pitch, so looking past straight up flips the picture over instead of snapping. (The camera used to follow 2 m behind.) The drone itself is not drawn for you; others still see it. */
    /* V13.3: the picture leans with the drone: it pitches a little with its nose and rolls into the way it is going (left goes left), smoothly, and is level again in a hover (tiltX and tiltZ, from pose). Where you fly is still where you look. Free Cam never leans. */const lean=this.kind==='freecam'?0:1,vp=this.pitch-(this.tiltX||0)*.45*lean;
    const pos=this.position,c=this.view,cp=Math.cos(vp),sp=Math.sin(vp),sy=Math.sin(this.yaw),cy=Math.cos(this.yaw);
    this.direction.set(sy*cp,sp,cy*cp);
    c.position.copy(pos).addScaledVector(this.direction,.12);c.position.y-=.04;
    c.target.copy(c.position).addScaledVector(this.direction,4);
    if(!c.up)c.up={x:0,y:1,z:0};{let ux=-sy*sp,uy=cp,uz=-cy*sp;const roll=-(this.tiltZ||0)*.6*lean;if(roll){const f=this.direction,lx=uy*f.z-uz*f.y,ly=uz*f.x-ux*f.z,lz=ux*f.y-uy*f.x,co=Math.cos(roll),si=Math.sin(roll);ux=ux*co+lx*si;uy=uy*co+ly*si;uz=uz*co+lz*si;}c.up.x=ux;c.up.y=uy;c.up.z=uz;}
    c.fov=72;this.boom=0;this.drone.visible=false;/* V12.4: high up it sees further: 2.4 km, plus one and a half times its height */c.far=Math.max(2400,Math.round(((this.position.y||0)*1.5+1400)/100)*100);
    /* V12.2: the propeller copy, placed in the camera's own frame: right, up and forward of where you look */
    const vm=this.viewCraft;if(vm&&this._basis){const f=this.direction,u=c.up,r=this._right.set(u.y*f.z-u.z*f.y,u.z*f.x-u.x*f.z,u.x*f.y-u.y*f.x);vm.drone.position.set(c.position.x+u.x*.19+f.x*.146,c.position.y+u.y*.19+f.y*.146,c.position.z+u.z*.19+f.z*.146);this._basis.makeBasis(r,this.T?new this.T.Vector3(u.x,u.y,u.z):u,f);vm.drone.quaternion.setFromRotationMatrix(this._basis);vm.drone.visible=true;}
  }
  close(scene){
    /* V12.2: remember where it was for next time, and take the propeller copy away (V13.3: the Drone only: a Striker is always a fresh one and Free Cam leaves nothing behind) */if(this.kind==='drone')last={x:this.position.x,y:this.position.y,z:this.position.z,yaw:this.yaw,pitch:this.pitch,world:this.world};if(this.viewCraft){try{this.viewCraft.dispose();}catch(_){}this.viewCraft=null;}
    scene.camera.position.copy(this.oldCamera.position);scene.camera.quaternion.copy(this.oldCamera.quaternion);
    scene.target.copy(this.oldCamera.target);scene.camera.fov=this.oldCamera.fov;scene.camera.updateProjectionMatrix();
    /* V13.3: Free Cam and the Striker do not come down to land: they are simply gone */if(this.kind!=='drone'){try{this.craft.dispose();}catch(_){}return;}
    /* V10.6: put away, it comes down to whatever is under it and spins down (or climbs away if that is far or wet) */
    const p=this.drone.position,under=this.world?heightAbove(this.world,p,0,16):{h:99,wet:true},drop=under.h-FOOT-.004;
    this.drone.visible=true;
    while(landings.length>1)landings.shift().craft.dispose();
    landings.push({craft:this.craft,from:p.y,drop:!under.wet&&drop<14?Math.max(0,drop):null,time:0,yaw:this.yaw,tiltX:this.drone.rotation.x,tiltZ:this.drone.rotation.z});
  }
}
function stepLandings(dt){
  for(let i=landings.length-1;i>=0;i--){
    const g=landings[i],d=g.craft.drone;g.time+=dt;
    const level=Math.exp(-g.time*5),rx=g.tiltX*level,rz=g.tiltZ*level;d.rotation.set(rx,g.yaw,rz,'YXZ');
    let gone=false;
    if(g.drop===null){/* too high, or over water: it climbs away and is gone */
      d.position.y=g.from+g.time*g.time*5;const s=1-smooth(.35,.9,g.time);d.scale.setScalar(Math.max(.001,s));
      g.craft.animate(dt,{climb:1,tiltX:rx,tiltZ:rz});gone=g.time>.9;
    }else{
      const fall=clamp(.35+g.drop/4.5,.45,2.4),k=smooth(0,1,g.time/fall),landed=g.time>=fall;
      d.position.y=g.from-g.drop*k;
      g.craft.animate(dt,{climb:landed?0:-.35,grounded:landed&&g.time<fall+.45,power:landed&&g.time>=fall+.45?0:1,tiltX:rx,tiltZ:rz});
      if(g.time>fall+1.5)d.scale.setScalar(Math.max(.001,1-smooth(fall+1.5,fall+1.8,g.time)));
      gone=g.time>fall+1.8;
    }
    if(gone){g.craft.dispose();landings.splice(i,1);}
  }
}
function syncRemote(scene,sim,dt){
  const drones=scene.remoteScouts??=new Map(),live=new Set();
  for(const actor of sim.npcs||[]){
    const pose=actor.scout;if(!pose)continue;live.add(actor.id);
    let mesh=drones.get(actor.id);
    /* V13.3: a Striker is drawn as itself; a Free Cam is never drawn (the host does not even send it) */const kind=pose.kind==='striker'?'striker':'drone';if(pose.kind==='freecam'){live.delete(actor.id);if(mesh){mesh.dispose();drones.delete(actor.id);}continue;}if(mesh&&mesh.kind!==kind){mesh.dispose();drones.delete(actor.id);mesh=null;}
    if(!scene.actorInView(pose,1,220)){if(mesh)mesh.drone.visible=false;continue;}
    if(!mesh){mesh=kind==='striker'?strikerModel(scene.T):model(scene.T);mesh.kind=kind;scene.scene.add(mesh.drone);mesh.drone.position.set(pose.x,pose.y,pose.z);mesh.fly={vx:0,vy:0,vz:0,tx:0,tz:0,yaw:pose.yaw||0};drones.set(actor.id,mesh);}
    mesh.drone.visible=true;
    const k=1-Math.exp(-dt*15),p=mesh.drone.position,f=mesh.fly,ox=p.x,oy=p.y,oz=p.z;
    p.x+=(pose.x-p.x)*k;p.y+=(pose.y-p.y)*k;p.z+=(pose.z-p.z)*k;f.yaw+=wrap((pose.yaw||0)-f.yaw)*k;
    /* V10.6: other players' drones lean, bank and change motor speed from the way they are seen to move */
    if(dt>0){const e=1-Math.exp(-dt*6);f.vx+=((p.x-ox)/dt-f.vx)*e;f.vy+=((p.y-oy)/dt-f.vy)*e;f.vz+=((p.z-oz)/dt-f.vz)*e;}
    const dx=Math.sin(f.yaw),dz=Math.cos(f.yaw),e=1-Math.exp(-dt*7),wx=clamp((f.vx*dx+f.vz*dz)*.024,-.4,.4),wz=-clamp((f.vx*dz-f.vz*dx)*.024,-.4,.4);
    void e;[f.tx,f.vtx]=lean(f.tx,f.vtx||0,wx,dt,LEAN_W);[f.tz,f.vtz]=lean(f.tz,f.vtz||0,wz,dt,LEAN_W);mesh.drone.rotation.set(f.tx,f.yaw,f.tz,'YXZ');
    mesh.animate(dt,{climb:f.vy/7,pitchCmd:f.tx/.4,rollCmd:f.tz/.4,tiltX:f.tx,tiltZ:f.tz,lookPitch:-.12});
  }
  for(const [key,mesh] of drones)if(!live.has(key)){mesh.dispose();drones.delete(key);}
}
// every frame from the City scene: other players' drones, and drones coming down to land
/* V12.8: the drone's picture on the phone in the pilot's hand (yours, and other players' online). Each phone that is held
 * while its drone flies gets a screen showing a small drawing of the City from the drone, every third frame, only while
 * the camera is within 30 m of it. The screen is hidden while its own picture is drawn. */
const FEED={w:256,h:124,every:3,range:30};let feedTick=0;
function feeds(scene,sim){const T=scene.T||root.THREE,R=scene.renderer,people=scene.meshes?.people;if(!T||!R||!people||!scene.scene||!scene.camera)return;feedTick++;
  const list=[],me=root.PlatdoCity?.drone;if(me?.view&&sim.player)list.push({id:sim.player.id||'player',pos:me.view.position,tgt:me.view.target,fov:me.view.fov||62});
  for(const n of sim.npcs||[]){const s=n.scout;if(!s||!Number.isFinite(s.x))continue;const yaw=s.yaw||0,p=Number.isFinite(s.pitch)?s.pitch:-.25;list.push({id:n.id,pos:{x:s.x,y:s.y,z:s.z},tgt:{x:s.x+Math.sin(yaw)*Math.cos(p)*10,y:s.y+Math.sin(p)*10,z:s.z+Math.cos(yaw)*Math.cos(p)*10},fov:62});}
  const live=new Set(),cp=scene.camera.position;
  for(const f of list){const rec=people.get(f.id),mesh=rec?.mesh,rig=mesh?.userData?.rig;if(!rig?.propRoot||!mesh.visible||!rig.propRoot.visible)continue;if(Math.hypot(mesh.position.x-cp.x,mesh.position.y-cp.y,mesh.position.z-cp.z)>FEED.range)continue;live.add(rig);
    let fd=rig.droneFeed;if(!fd){const rt=new T.WebGLRenderTarget(FEED.w,FEED.h);rt.texture.colorSpace=T.SRGBColorSpace;const mat=new T.MeshBasicMaterial({map:rt.texture,toneMapped:false}),pl=new T.Mesh(new T.PlaneGeometry(.146,.068),mat);pl.name='drone-feed';pl.position.set(-.0195,-.092,-.0203-.0043-.0008);pl.rotation.y=Math.PI;pl.castShadow=pl.receiveShadow=false;rig.propRoot.add(pl);fd=rig.droneFeed={rt,mat,pl,cam:new T.PerspectiveCamera(62,FEED.w/FEED.h,.3,1800),drawn:false};}
    fd.pl.visible=fd.drawn;
    if(feedTick%FEED.every===0||!fd.drawn){fd.cam.fov=f.fov;fd.cam.updateProjectionMatrix();fd.cam.position.set(f.pos.x,f.pos.y,f.pos.z);fd.cam.lookAt(f.tgt.x,f.tgt.y,f.tgt.z);fd.cam.updateMatrixWorld(true);
      const was=fd.pl.visible,auto=R.shadowMap.autoUpdate,prev=R.getRenderTarget();fd.pl.visible=false;R.shadowMap.autoUpdate=false;try{R.setRenderTarget(fd.rt);R.render(scene.scene,fd.cam);fd.drawn=true;}finally{R.setRenderTarget(prev);R.shadowMap.autoUpdate=auto;fd.pl.visible=fd.drawn||was;}}}
  for(const rec of people.values()){const rig=rec?.mesh?.userData?.rig,fd=rig?.droneFeed;if(fd&&!live.has(rig)){fd.pl.visible=false;fd.drawn=false;}}}
function update(scene,sim,dt){
  try{feeds(scene,sim);}catch(e){if(!feeds.warned){feeds.warned=true;console.warn('Drone feed',e);}}
  if(sim.onlineRoom||scene.remoteScouts?.size)syncRemote(scene,sim,dt);
  if(landings.length)stepLandings(dt);
}
function clear(scene){
  if(scene?.remoteScouts?.size)syncRemote(scene,{npcs:[]},0);
  while(landings.length)landings.pop().craft.dispose();
}
/* V12.4: the Drone app's first page: where the last flight was put away (this play session and world), for Resume last flight */
const lastFlight=w=>last&&last.world===w?{x:last.x,y:last.y,z:last.z}:null;
if(typeof document!=='undefined'&&!document.getElementById('dp-style')){const st=document.createElement('style');st.id='dp-style';st.textContent=`#cityRoot .platdo-os .dp{display:grid;gap:10px;padding:4px 2px 8px}
#cityRoot .platdo-os .dp-hero{height:132px;border-radius:20px;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#3fa9c9 0,#1c5d78 55%,#0e2c3c 100%);color:#e9f8ff;box-shadow:inset 0 0 0 1px #ffffff22}
#cityRoot .platdo-os .dp-hero svg{width:116px;height:116px}
#cityRoot .platdo-os .dp h3{margin:2px 0 0;font-size:20px;text-align:center}#cityRoot .platdo-os .dp>p{margin:0;text-align:center;font-size:12px;color:var(--os-muted)}
#cityRoot .platdo-os .dp button{display:grid;gap:3px;text-align:left;padding:13px 15px;border-radius:15px;font-weight:750;font-size:14.5px}
#cityRoot .platdo-os .dp button small{font-weight:500;font-size:11.5px;color:var(--os-muted);line-height:1.3}
#cityRoot .platdo-os .dp button.dp-go{background:linear-gradient(135deg,#2f8cff,#2266d8);color:#fff}#cityRoot .platdo-os .dp button.dp-go small{color:#dce9ff}
#cityRoot .platdo-os .dp-note{padding:9px 11px;border-radius:12px;background:#f2a51633;font-size:12px;text-align:left!important;color:inherit!important}`;document.head.appendChild(st);}
function pickHtml(phone){const sim=phone?.sim,lf=lastFlight(sim?.world),me=sim?.player,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),b=(a,l,x='')=>'<button type="button" data-phone="'+a+'" '+x+'>'+l+'</button>';
 const away=lf&&me?Math.hypot(lf.x-me.x,lf.z-me.z):0,up=lf&&sim?.world?Math.max(0,lf.y-(sim.world.groundHeight?.(lf.x,lf.z)??0)):0,far=d=>d<950?Math.round(d)+' m':(d/1000).toFixed(1)+' km';
 return '<div class="dp"><div class="dp-hero"><svg viewBox="0 0 120 120" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M38 44 52 54M82 44 68 54M38 76 52 66M82 76 68 66"/></g><g fill="currentColor"><rect x="47" y="49" width="26" height="22" rx="8"/><circle cx="60" cy="74" r="4" fill="#0e2c3c"/></g><g fill="currentColor" opacity=".85"><ellipse cx="32" cy="40" rx="17" ry="4.5"/><ellipse cx="88" cy="40" rx="17" ry="4.5"/><ellipse cx="32" cy="80" rx="17" ry="4.5"/><ellipse cx="88" cy="80" rx="17" ry="4.5"/></g></svg></div><h3>Sky Scout</h3><p>Your camera drone</p>'+(phone?.droneMessage?'<p class="dp-note" role="status">'+esc(phone.droneMessage)+'</p>':'')+b('droneNew','New flight<small>Take off from your hand, right in front of you</small>','class="dp-go"')+(lf?b('droneResume','Resume last flight<small>Carry on from where you put it away: '+far(away)+' away, '+far(up)+' up</small>'):'')+/* V13.3: the owner's account also gets Free Cam and the Striker (the host says who the owner is; everyone else sees only the Drone above) */(window.CityXmas?.admin?'<div class="dp-admin"><small>OWNER ONLY</small>'+b('droneFreecam','<i class="dp-ic dp-ic-fc" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 12s3.4-6 9-6 9 6 9 6-3.4 6-9 6-9-6-9-6z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/></svg></i><span>Free Cam<small>An invisible camera with no body. Flies through walls and buildings, never tilts, nobody else sees it.</small></span>','class="dp-card"')+b('droneStriker','<i class="dp-ic dp-ic-st" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 5l5 5M19 5l-5 5M5 19l5-5M19 19l-5-5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor"/><ellipse cx="12" cy="6.6" rx="2" ry="1.4" fill="currentColor"/><circle cx="12" cy="17.2" r="1.3" fill="#ff3b30"/></svg></i><span>Striker<small>A black FPV strike drone. It goes off with the Comet Launcher blast the moment it touches anything.</small></span>','class="dp-card"')+'</div>':'')+'</div>';}
root.CityDrone={Flight,model,syncRemote,update,clear,shells:Object.freeze(shells),FOOT,RADIUS,lastFlight,pickHtml,/* V13.3 */strikerModel,STRIKE_R};
})(globalThis);
