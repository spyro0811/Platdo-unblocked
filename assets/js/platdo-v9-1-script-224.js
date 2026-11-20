
/* PLATDO V3 — characters. Local +Z forward, soles at Y=0, built at 1.8 m and scaled per body.
 * The rig (bone names, joint positions, sockets) is the one the rest of the game already drives; what hangs
 * on it is new: anatomical bodies, sculpted heads, real hair shapes, constructed clothing and shoes.
 * Everything a character wears is drawn in a handful of draw calls: pieces are merged per material and follow
 * their bone through rigid skinning, so limbs stay crisp and dismemberment still works bone by bone.
 * Rendering never resolves shots, health, timers or transactions.
 * This file is part 1 of 6; the parts are concatenated into one module. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.CityPeopleModels=factory(root.THREE,root.CityPeople,root.PlatdoForge);})(typeof globalThis!=='undefined'?globalThis:this,function(THREE,P,F){
'use strict';
if(!THREE||!P||!F)throw new Error('CityPeopleModels requires local THREE, CityPeople and PlatdoForge');
const clamp=F.clamp,mix=F.mix,smooth=F.smooth,TAU=F.TAU,rgb=F.rgb,blend=F.blend,tint=F.tint;
const gauss=(x,c,s)=>{const d=(x-c)/s;return Math.exp(-d*d);};

// ---- build quality -----------------------------------------------------------------
// modelDetail 1..5 comes from the graphics preset, lod 0..2 from distance. Q scales every mesh density.
let buildDetail=5,buildLod=0,Q=1;
const seg=(n,min=3)=>Math.max(min,Math.round(n*Q));
function setQuality(detail,lod){buildDetail=clamp(Math.round(Number(detail)||5),1,5);buildLod=clamp(Math.round(Number(lod)||0),0,2);Q=[0,.36,.5,.66,.82,1][buildDetail]*[1,.45,.28][buildLod];}

// ---- new-style building: one Shape per (bone, material) ----------------------------
// part(node, 'cotton') returns the Shape that collects every cotton surface on that bone.
function part(node,kind,options){const key=kind+(options?JSON.stringify(options):'');node.userData.shapes??=new Map();let entry=node.userData.shapes.get(key);if(!entry){entry={shape:new F.Shape(),material:F.material(kind,options)};node.userData.shapes.set(key,entry);}return entry.shape;}

// ---- legacy helpers ----------------------------------------------------------------
// Weapons, props and the older cosmetic catalogue are written against these. They keep their signatures and
// gain smoother geometry; colour is baked into vertices when the model is assembled.
const materials=new Map(),unitGeometry=new Map();
function material(color,metal=0,rough=.85){const key=color+'-'+metal+'-'+rough;if(!materials.has(key)){const m=new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough});m.userData.legacy=true;materials.set(key,m);}return materials.get(key);}
function mesh(parent,geometry,mat,x=0,y=0,z=0,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function shared(key,make){let g=unitGeometry.get(key);if(!g){g=make();g.userData.shared=true;unitGeometry.set(key,g);}return g;}
function sphere(parent,mat,x,y,z,sx,sy,sz,detail=12){const a=seg(detail*1.5,6),b=seg(Math.max(6,detail),4);return mesh(parent,shared('sphere'+a+'x'+b,()=>new THREE.SphereGeometry(1,a,b)),mat,x,y,z,sx,sy,sz);}
function box(parent,mat,x,y,z,sx,sy,sz){const n=Q>.55?2:1;return mesh(parent,shared('box'+n,()=>{const s=new F.Shape();F.roundBox(s,0,0,0,1,1,1,.11,{segments:n});return s.geometry();}),mat,x,y,z,sx,sy,sz);}
function cylinder(parent,mat,x,y,z,r,h,rotation=0){const n=seg(18,6),m=mesh(parent,shared('cyl'+n,()=>new THREE.CylinderGeometry(1,1,1,n)),mat,x,y,z,r,h,r);m.rotation.x=rotation;return m;}
function group(parent,name,x=0,y=0,z=0){const g=new THREE.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;}
// Ring tuple: [y, half-width, half-depth, zOffset, xOffset]. Sections are joined with a smooth curve.
function rings(parent,mat,sections,sides=14){const s=new F.Shape(),surf=F.surface(sections.map(v=>({y:v[0],a:Math.max(1e-4,v[1]),f:Math.max(1e-4,v[2]),z:v[3]||0,x:v[4]||0}))),n=sections.length;F.loft(s,surf,{sides:seg(sides*1.4,6),rows:n<=2?1:Math.max(n-1,seg((n-1)*3,n-1))});return mesh(parent,s.geometry(),mat);}
function curve(parent,mat,points,r=.008){const s=new F.Shape();F.tube(s,points,r,{sides:seg(8,3),segments:Math.max(2,seg(points.length*4,points.length))});return mesh(parent,s.geometry(),mat);}

// ---- assembling ----------------------------------------------------------------------
// Legacy materials carry one flat colour each. When pieces are merged that colour moves into the vertices and
// the piece joins one of two shared materials, so a prop with twenty colours is still one or two draw calls.
function materialClass(mat){
 if(mat.userData.forge)return{key:mat.uuid,material:mat,colour:null};
 const metal=mat.metalness>=.3,shiny=!metal&&mat.roughness<.5;
 return{key:metal?'legacy-metal':shiny?'legacy-gloss':'legacy-matte',material:metal?F.material('plain',{metalness:.72,roughness:.32,tag:'legacy-metal'}):shiny?F.material('plain',{roughness:.34,tag:'legacy-gloss'}):F.material('plain',{roughness:.84,tag:'legacy-matte'}),colour:[mat.color.r,mat.color.g,mat.color.b]};
}
const normalMatrix=new THREE.Matrix3(),scratch=new THREE.Vector3();
// A copy of a mesh's geometry moved by `matrix`, with position, normal, colour and uv present.
function bakedGeometry(source,matrix,colour){
 const g=source.clone();g.userData={};if(!g.attributes.normal)g.computeVertexNormals();g.applyMatrix4(matrix);const count=g.attributes.position.count;
 if(matrix.determinant()<0&&g.index){const a=g.index.array;for(let k=0;k<a.length;k+=3){const t=a[k+1];a[k+1]=a[k+2];a[k+2]=t;}}
 const old=g.attributes.color,c=new Float32Array(count*3);for(let k=0;k<count;k++){c[k*3]=(old?old.getX(k):1)*(colour?colour[0]:1);c[k*3+1]=(old?old.getY(k):1)*(colour?colour[1]:1);c[k*3+2]=(old?old.getZ(k):1)*(colour?colour[2]:1);}
 g.setAttribute('color',new THREE.BufferAttribute(c,3));if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(count*2),2));
 for(const name of Object.keys(g.attributes))if(!['position','normal','color','uv'].includes(name))g.deleteAttribute(name);return g;
}
// Turn the Shapes collected with part() into meshes on their nodes.
function flushParts(node){node.traverse(o=>{const shapes=o.userData.shapes;if(!shapes)return;for(const entry of shapes.values())if(entry.shape.triangles)F.mesh(entry.shape,entry.material,o);delete o.userData.shapes;});}
const mergeable=o=>o.isMesh&&!o.isSkinnedMesh&&!o.userData.dynamic&&!o.userData.goreCap&&!o.material.transparent&&o.material.side!==THREE.DoubleSide;
// Join the plain meshes sitting directly on each node (weapons, props). Moving sub-parts stay separate nodes.
function batchNode(node){
 for(const child of[...node.children])if(child.isGroup)batchNode(child);
 const buckets=new Map();for(const child of node.children){if(!mergeable(child))continue;const cls=materialClass(child.material);if(!buckets.has(cls.key))buckets.set(cls.key,{cls,items:[]});buckets.get(cls.key).items.push({mesh:child,colour:cls.colour});}
 for(const{cls,items}of buckets.values()){if(items.length<2&&!items[0].colour)continue;const parts=items.map(({mesh:m,colour})=>{m.updateMatrix();const g=bakedGeometry(m.geometry,m.matrix,colour);if(!m.geometry.userData.shared)m.geometry.dispose();node.remove(m);return g;}),merged=F.mergeGeometries(parts);for(const g of parts)g.dispose();const out=new THREE.Mesh(merged,cls.material);out.castShadow=true;out.receiveShadow=true;node.add(out);}
}

// ---- body measurements -------------------------------------------------------------
// The eight body types give shoulders, waist, hips and limb weight. Presentation (a fuller chest and hips,
// softer face) follows the body type and face shape, so it stays stable when hair or clothing changes.
const softFaces=new Set([0,3,4,7,9,11]);
function presentation(a){if(a.facialHair)return 0;if(a.body===4)return 1;if([0,3,6,7].includes(a.body)&&softFaces.has(P.faceProfiles[a.face].base))return 1;return 0;}
function measure(a){
 // The shoulder joints sit closer together than in the old rig, which had them wider than a real shoulder girdle.
 const b=P.bodies[a.body],fem=presentation(a),lm=b.limb,jointX=b.shoulders*(fem?.39:.405);
 const chest=jointX-.036*lm+.002,waist=b.waist*(fem?.42:.5),hips=fem?clamp(b.hips*.45,waist*1.15,jointX*.93):b.hips*.52/* V8.9: a woman's hips no wider than her shoulders, so legs and body read as one width */,hipX=fem?hips*.52:b.hips*.27,belly=Math.max(0,b.waist-.33)*.5;
 /* V3.7: `child` marks the small passengers in Platdo Drive; they keep a plain child's torso whatever the body type. */
 return{b,fem,child:!!a.child,lm,jointX,hipX,chest,waist,hips,belly,neck:fem?.045:.051+(lm-1)*.012,
  // Arm, forearm, thigh and calf radii at their thickest.
  arm:(fem?.043:.049)*lm,forearm:(fem?.036:.042)*lm,thigh:(fem?.079:.082)*lm,calf:(fem?.051:.054)*lm};
}

// ---- head ----------------------------------------------------------------------------
// Heights inside the head are measured from the chin ("ym"). The head bone is level with the chin, at the top of
// the neck, so the head turns and nods about the upper neck.
const CHIN=0,CROWN=.235;
// [ym, half-width, front depth, back depth, superellipse power]
const SKULL=[[-.022,.022,.032,.022,2.05],[-.008,.036,.058,.032,2.1],[.004,.042,.075,.040,2.15],[.016,.049,.082,.048,2.25],[.030,.0565,.0805,.056,2.45],[.048,.0625,.0845,.066,2.7],[.068,.0665,.087,.078,2.75],[.092,.0705,.087,.090,2.7],[.118,.071,.0845,.099,2.6],[.140,.072,.091,.1035,2.5],[.165,.0755,.0905,.104,2.4],[.190,.0735,.082,.097,2.3],[.210,.0655,.064,.083,2.2],[.225,.049,.039,.058,2.1],[.2335,.022,.015,.026,2]];
// Row stations for the skin mesh: dense through the features, sparse over the cranium.
const HEAD_ROWS=[-.022,-.015,-.008,-.002,.004,.010,.016,.022,.028,.033,.037,.041,.045,.0487,.052,.0555,.059,.0625,.066,.0695,.073,.0765,.080,.084,.089,.095,.101,.106,.1105,.114,.1175,.121,.1245,.128,.132,.136,.140,.145,.151,.158,.166,.175,.184,.193,.202,.211,.219,.226,.2305,.2335];
const HAIRLINE=[[0,.187],[.6,.186],[1.05,.160],[1.35,.143],[1.75,.118],[2.2,.080],[2.7,.058],[Math.PI,.052]];
const IRIS=['#4b3524','#3a2a1c','#5a3d26','#6b4a2a','#4f6a52','#4a6e8f','#7a8a94'];
function curveAt(table,x){let i=0;while(i<table.length-2&&x>table[i+1][0])i++;const a=table[i],b=table[i+1],t=clamp((x-a[0])/(b[0]-a[0]),0,1),s=t*t*(3-2*t);return mix(a[1],b[1],mix(t,s,.5));}
// Describes one head: its surface, where the features are, and the colours it is painted with.
function headModel(a,M){
 const fp=P.faceProfiles[a.face],fem=M.fem,wide=1+(fp.width-1)*.42,long=1+(fp.length-1)*.35,jaw=(1+(fp.jaw-1)*.38)*(fem?.965:1.03),cheek=1+(fp.cheek-1)*.45,noseP=(1+(fp.nose-1)*.9)*(fem?.88:1.05),noseW=fp.noseWidth*(fem?.9:1.04),eyeX=.0315*(1+(fp.eyeSpacing-1)*.6)*wide,browP=fp.brow,mouthHalf=.0245*fp.mouth*(fem?.97:1.02),chinP=(1+(fp.chin-1)*.8)*(fem?.9:1.08),lipFull=fem?1.2:.92,zc=-.006;
 const jawRow=new Set([1,2,3,4,5]),sections=SKULL.map((s,i)=>{const j=jawRow.has(i)?jaw:i===6?mix(jaw,cheek,.5):i===7?cheek:i===8?mix(cheek,1,.5):1;return{y:CHIN+s[0]*long,a:s[1]*wide*j,f:s[2]*(i===2||i===3?mix(1,chinP,.35):1),k:s[3],n:s[4],z:zc};});
 const nostrilX=.0085*noseW,alaX=.0135*noseW,tipH=.0255*noseP;
 // Frontal features, added along +z and faded out toward the sides of the head.
 function features(theta,y,out){
  const c=Math.cos(theta);if(c<=0)return;const front=smooth(0,.4,c),ym=(y-CHIN)/long,x=out.x,ax=Math.abs(x);let dz=0;
  if(ym>.062&&ym<.13){const h=ym<.079?tipH*smooth(.0655,.079,ym):tipH*(.16+.84*Math.pow(1-smooth(.079,.1245,ym),1.25)),sigma=mix(.0118*noseW,.0062,smooth(.079,.112,ym));dz+=h*Math.exp(-(x/sigma)*(x/sigma))+.0078*noseW*gauss(ax,alaX,.0058)*gauss(ym,.0752,.0068)-.0012*gauss(ym,.1225,.007)*gauss(x,0,.012);}
  dz+=.0042*browP*(fem?.5:1)*gauss(ym,.137,.0085)*smooth(.064,.040,ax)*(1-.35*gauss(x,0,.008));
  dz-=.0115*gauss(ax,eyeX,.0165)*gauss(ym,.1175,.0105);
  dz+=.0028*cheek*gauss(ax,.041,.02)*gauss(ym,.088,.022)-.0012*gauss(ax,.022,.008)*gauss(ym,.085,.012);
  const lipMask=1-smooth(mouthHalf*.7,mouthHalf,ax),lineMask=1-smooth(mouthHalf*.9,mouthHalf*1.15,ax);
  dz+=.0027*lipFull*gauss(ym,.0568,.0046)*lipMask*(1-.2*gauss(x,0,.0045))+.0031*lipFull*gauss(ym,.0412,.0056)*lipMask-.0022*gauss(ym,.0487,.002)*lineMask;
  dz-=.0011*gauss(x,0,.0042)*smooth(.058,.062,ym)*(1-smooth(.066,.070,ym))+.003*gauss(ym,.029,.0065)*gauss(x,0,.021);
  dz+=.0045*chinP*gauss(ym,.013,.0105)*gauss(x,0,.017);
  out.z+=dz*front;
 }
 const surf=F.surface(sections,features),tmp={x:0,y:0,z:0},yOf=ym=>CHIN+ym*long;
 const hairScale=1+((fp.hairline||1)-1)*.5,hairline=theta=>{let t=Math.abs(theta)%TAU;if(t>Math.PI)t=TAU-t;const base=curveAt(HAIRLINE,t);return t<1.1?mix(base,base*hairScale,1-t/1.1)+(fem?0:.004*gauss(t,.72,.22)):base;};
 // The eyeball sits just proud of the socket, so the lids have something to wrap.
 surf.at(Math.atan2(eyeX,.078),yOf(.1175),tmp);const eyeR=.013,eye={x:eyeX,y:yOf(.1175),z:tmp.z-eyeR+.0058,r:eyeR};
 const skinHex=P.skinPalettes[a.skin],skin=rgb(skinHex),lum=skin[0]*.3+skin[1]*.55+skin[2]*.15,dark=lum<.16;
 const lip=a.lipHex?rgb(a.lipHex):blend(skin,rgb(dark?'#6b3833':fem?'#b4505a':'#a8615a'),fem?.78:.55),hairHex=a.hairHex||P.hairPalettes[a.hairColor],hair=rgb(hairHex);
 const irisPool=dark||a.skin===3||a.skin===4||a.skin===9?IRIS.slice(0,3):IRIS,iris=rgb(irisPool[P.hash('iris'+a.face+':'+a.skin)%irisPool.length]);
 return{surf,sections,yOf,long,wide,zc,hairline,eye,eyeX,mouthHalf,noseW,alaX,nostrilX,noseTip:{y:yOf(.079),z:.0845+zc+tipH},skin,skinHex,hair,hairHex,iris,fem,dark,lip,fp,jaw,lipFull,halfWidth:.0755*wide,centre:{x:0,y:yOf(.125),z:zc}};
}
// ---- the painted face ----------------------------------------------------------------
// The front of the head is unwrapped flat (looking straight at the face); the sides and back of the head use
// two plain bands at the left and right edges of the picture, laid out by angle, so the hairline, a shaved
// scalp or a beard shadow can continue around the head.
const FACE_W=.19,FACE_Y0=-.03,FACE_H=.28,BAND=.07,BACK_FROM=1.72;
function faceUV(H,x,y,z,out){
 const ym=(y-CHIN)/H.long,theta=Math.atan2(x,z-H.zc),at=Math.abs(theta),planar=.5+clamp(x/FACE_W,-.5+BAND+.004,.5-BAND-.004),band=clamp((at-BACK_FROM)/(Math.PI-BACK_FROM),0,1),edge=x>=0?1-BAND+BAND*band*.92+.004:BAND-BAND*band*.92-.004;
 out[0]=mix(planar,edge,smooth(1.42,BACK_FROM,at));out[1]=clamp((ym-FACE_Y0)/FACE_H,0,1);return out;
}
const faceTextures=new Map(),styleColour=new THREE.Color();
const css=(c,k=1,alpha=1)=>{styleColour.setRGB(Math.min(1,c[0]*k),Math.min(1,c[1]*k),Math.min(1,c[2]*k));const s=styleColour.getStyle();return alpha>=1?s:s.replace('rgb(','rgba(').replace(')',','+alpha+')');};
function faceTexture(a,H,size,scalpTint){
 if(typeof document==='undefined')return null;
 const older=a.age>=62?2:a.age>=46?1:0,key=[a.face,a.skin,a.hairHex||a.hairColor,a.brows||0,a.facialHair||0,a.beardHex||'',H.fem,older,size,scalpTint,a.hair].join('|');let texture=faceTextures.get(key);if(texture)return texture;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const g=canvas.getContext('2d'),S=size,X=x=>(.5+x/FACE_W)*S,Y=ym=>(1-(ym-FACE_Y0)/FACE_H)*S,RX=m=>m/FACE_W*S,RY=m=>m/FACE_H*S,r=F.rng('face'+key),skin=H.skin,beard=rgb(a.beardHex||H.hairHex);
 g.fillStyle=css(skin);g.fillRect(0,0,S,S);
 const glow=(x,ym,rx,ry,colour,alpha)=>{g.save();g.translate(X(x),Y(ym));g.scale(RX(rx),RY(ry));const grad=g.createRadialGradient(0,0,0,0,0,1);grad.addColorStop(0,css(colour,1,alpha));grad.addColorStop(1,css(colour,1,0));g.fillStyle=grad;g.beginPath();g.arc(0,0,1,0,TAU);g.fill();g.restore();};
 const warm=[skin[0]*1.12,skin[1]*.86,skin[2]*.82],shade=[skin[0]*.62,skin[1]*.55,skin[2]*.52],light=[Math.min(1,skin[0]*1.14),Math.min(1,skin[1]*1.12),Math.min(1,skin[2]*1.1)];
 // Soft form shading: lit forehead, cheeks and chin; shadow under the brow, beside the nose and under the lip.
 glow(0,.168,.05,.03,light,.2);glow(0,.012,.022,.014,light,.16);for(const s of[-1,1]){glow(s*.040,.088,.03,.028,warm,H.fem?.34:.22);glow(s*H.eyeX,.118,.027,.02,shade,.3);glow(s*.017,.098,.009,.03,shade,.2);glow(s*.058,.045,.02,.045,shade,.14);glow(s*.066,.14,.016,.03,shade,.12);}
 glow(0,.079,.014,.012,warm,.28);glow(0,.092,.006,.03,light,.2);glow(0,.03,.024,.007,shade,.22);glow(0,.064,.012,.005,shade,.2);
 // Nostrils and the crease beside each wing of the nose.
 for(const s of[-1,1]){g.fillStyle=css(shade,.45,.7);g.beginPath();g.ellipse(X(s*Math.max(H.nostrilX,.0082)),Y(.0702),RX(.0031),RY(.0018),s*.4,0,TAU);g.fill();g.strokeStyle=css(shade,.9,.3);g.lineWidth=Math.max(1,S*.004);g.beginPath();g.moveTo(X(s*H.alaX*1.28),Y(.079));g.quadraticCurveTo(X(s*H.alaX*1.5),Y(.072),X(s*H.alaX*1.22),Y(.067));g.stroke();}
 // Lips: a shaped upper lip in the deeper tone, a fuller lower lip with a soft highlight, and the line between.
 const mh=H.mouthHalf,full=H.lipFull,lipTop=.0487+.0128*full,lipBottom=.0487-.0156*full,lipC=H.lip,upperC=[lipC[0]*.84,lipC[1]*.8,lipC[2]*.82];
 g.fillStyle=css(upperC);g.beginPath();g.moveTo(X(-mh),Y(.0487));g.bezierCurveTo(X(-mh*.6),Y(lipTop-.004),X(-.011),Y(lipTop+.0012),X(-.0058),Y(lipTop));g.quadraticCurveTo(X(0),Y(lipTop-.0024),X(.0058),Y(lipTop));g.bezierCurveTo(X(.011),Y(lipTop+.0012),X(mh*.6),Y(lipTop-.004),X(mh),Y(.0487));g.quadraticCurveTo(X(0),Y(.0478),X(-mh),Y(.0487));g.fill();
 g.fillStyle=css(lipC);g.beginPath();g.moveTo(X(-mh),Y(.0487));g.quadraticCurveTo(X(0),Y(.0478),X(mh),Y(.0487));g.bezierCurveTo(X(mh*.62),Y(lipBottom+.001),X(mh*.3),Y(lipBottom),X(0),Y(lipBottom));g.bezierCurveTo(X(-mh*.3),Y(lipBottom),X(-mh*.62),Y(lipBottom+.001),X(-mh),Y(.0487));g.fill();
 glow(0,.0415,mh*.55,.0046,[Math.min(1,lipC[0]*1.35),Math.min(1,lipC[1]*1.3),Math.min(1,lipC[2]*1.3)],.5);
 g.strokeStyle=css(shade,.5,.9);g.lineWidth=Math.max(1,S*.0045);g.lineCap='round';g.beginPath();g.moveTo(X(-mh*1.02),Y(.0492));g.quadraticCurveTo(X(0),Y(.0476),X(mh*1.02),Y(.0492));g.stroke();
 // Brows: short strokes that lean outward, drawn in the hair colour.
 const browC=tint(H.hair,H.dark?.7:.78),arch=.0026*H.fp.brow*(H.fem?1.3:.75),heavy=(1+(a.brows||0)*.28)*(H.fem?.78:1.12),browY=x=>mix(.1338,.1384+arch,Math.sin(clamp((x-.010)/.048,0,1)*Math.PI*.62))-smooth(.04,.058,x)*.0045;
 g.lineCap='round';for(const s of[-1,1])for(let i=0;i<Math.round(S*.34*heavy);i++){const t=r(),x=mix(.0095,.0575,t)*H.wide,w=(.0034*heavy)*(.35+.9*Math.sin(Math.PI*Math.pow(t,.7))),y=browY(x/H.wide)+(r()-.5)*w*2,lean=mix(1.15,-.05,t)+(r()-.5)*.5,len=.0042+r()*.003;g.strokeStyle=css(browC,.8+r()*.4,.5+r()*.4);g.lineWidth=Math.max(.7,S*.0026);g.beginPath();g.moveTo(X(s*x),Y(y));g.lineTo(X(s*(x+Math.cos(lean)*len)),Y(y+Math.sin(lean)*len*.6));g.stroke();}
 // Lash line shadow and the fold above each eye (the lids themselves are modelled).
 for(const s of[-1,1]){g.strokeStyle=css(shade,.7,.35);g.lineWidth=Math.max(1,S*.004);g.beginPath();g.ellipse(X(s*H.eyeX),Y(.1195),RX(.0165),RY(.0088),0,Math.PI*1.08,Math.PI*1.92);g.stroke();}
 // Beard shadow: fine dots through the beard area, denser for heavier stubble.
 // A modelled beard gets the same dots only where it grows, so its edge fades into the skin.
 if(a.facialHair){const field=beardField(a.facialHair,H),density=a.facialHair===1?.5:a.facialHair===2?.95:.8,count=Math.round(S*S*(field?.09:.055)*density);g.fillStyle=css(beard,.75,.5);for(let i=0;i<count;i++){const x=(r()*2-1)*.074,ym=-.02+r()*(field?.16:.095),ax=Math.abs(x);
   if(field){if(field.cover(Math.asin(clamp(x/H.halfWidth,-1,1)),ym,x)<=.0004)continue;}else{const jawLine=ym<.075-ax*.25&&!(ax<mh*1.15&&ym>.031&&ym<.0655)&&(ym<.058||ax>.016||ym>.062),cheekFade=ym>.045?1-smooth(.02,.075,ym-.045+(.07-ax)*.6):1;if(!jawLine||r()>cheekFade)continue;}
   const d=Math.max(.6,S*.0016);g.fillRect(X(x),Y(ym),d,d);}if(!field)glow(0,.02,.05,.035,beard,.16*density);}
 // Age: lines across the forehead, beside the eyes and from nose to mouth.
 if(older){g.strokeStyle=css(shade,.85,.2+.1*older);g.lineWidth=Math.max(.8,S*.003);for(let i=0;i<1+older;i++){const y=.152+i*.0085;g.beginPath();g.moveTo(X(-.034),Y(y));g.quadraticCurveTo(X(0),Y(y+.0022),X(.034),Y(y));g.stroke();}for(const s of[-1,1]){g.beginPath();g.moveTo(X(s*H.alaX*1.35),Y(.076));g.quadraticCurveTo(X(s*.027),Y(.058),X(s*(mh+.005)),Y(.043));g.stroke();for(let i=0;i<older+1;i++){g.beginPath();g.moveTo(X(s*(H.eyeX+.017)),Y(.117+i*.003));g.lineTo(X(s*(H.eyeX+.026)),Y(.114+i*.0055-older*.001));g.stroke();}}}
 // A few freckles or a mole on some faces.
 const marks=P.hash('marks'+a.face)%7;if(marks<2&&!H.dark){g.fillStyle=css(shade,.9,.3);for(let i=0;i<70;i++){const x=(r()*2-1)*.05,ym=.075+r()*.04;g.fillRect(X(x),Y(ym),Math.max(.7,S*.003),Math.max(.7,S*.003));}}else if(marks===2){g.fillStyle=css(shade,.5,.8);g.beginPath();g.arc(X((r()>.5?1:-1)*(.02+r()*.02)),Y(.03+r()*.05),Math.max(1,S*.004),0,TAU);g.fill();}
 // Scalp: where hair grows the skin takes on the hair colour (strongly for a shaved head, faintly under long hair).
 if(scalpTint>0){const hairC=css(H.hair,1,scalpTint),steps=48;g.fillStyle=hairC;for(const soft of[0,.004,.008]){g.globalAlpha=soft?.33:.34;g.beginPath();g.moveTo(X(-.5*FACE_W),0);for(let i=0;i<=steps;i++){const u=i/steps;let line;if(u<BAND){const band=1-u/BAND;line=H.hairline(BACK_FROM+band/.92*(Math.PI-BACK_FROM));}else if(u>1-BAND){const band=(u-(1-BAND))/BAND;line=H.hairline(BACK_FROM+band/.92*(Math.PI-BACK_FROM));}else{const x=(u-.5)*FACE_W,theta=Math.asin(clamp(x/H.halfWidth,-1,1));line=H.hairline(theta);}g.lineTo(u*S,Y(line+soft));}g.lineTo(S,0);g.closePath();g.fill();}g.globalAlpha=1;}
 texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;texture.userData.face=key;faceTextures.set(key,texture);return texture;
}
const faceMaterials=new Map();
function faceMaterial(texture){if(!texture)return F.material('skin');let m=faceMaterials.get(texture.uuid);if(!m){m=new THREE.MeshStandardMaterial({map:texture,vertexColors:true,color:0xffffff,roughness:.56,metalness:0});m.name='forge:face';m.userData.forge='face';faceMaterials.set(texture.uuid,m);}return m;}
// Angle sampling that spends more columns on the face than on the back of the head.
const faceAngle=u=>TAU*(u-.5/TAU*Math.sin(TAU*u));
function buildHead(rig,a,M,H,scalpTint){
 const head=rig.head,lod=buildLod,cols=seg(72,12),stride=Q>.8?1:Q>.55?2:Q>.3?3:5,stations=HEAD_ROWS.filter((v,i)=>i%stride===0||i===HEAD_ROWS.length-1),rows=stations.length+1;
 const texture=lod<2?faceTexture(a,H,buildDetail>=4?512:buildDetail>=2?256:128,scalpTint):null,skinMaterial=faceMaterial(texture),white=texture?[1,1,1]:H.skin;
 head.userData.shapes??=new Map();const entry={shape:new F.Shape(),material:skinMaterial};head.userData.shapes.set('face',entry);const skin=entry.shape;rig.faceTexture=texture;
 F.grid(skin,cols,rows,(u,v,out)=>{const j=Math.round(v*rows),theta=faceAngle(u);out.col=white;
  if(j===0){out.x=0;out.y=H.yOf(-.03);out.z=H.zc+.004;return;}if(j===rows){out.x=0;out.y=H.yOf(CROWN);out.z=H.zc-.006;return;}
  H.surf.at(theta,H.yOf(stations[j-1]),out);
 },{closeU:true,poleStart:true,poleEnd:true});
 if(lod<2){
  // Eyes: a glossy ball whose rings are centred on the line of sight, so the iris stays a clean circle.
  const eyeMat=part(head,'plain',{roughness:.1,tag:'eye'}),sclera=rgb('#e9e4dc'),pupil=[.01,.01,.012],limbus=tint(H.iris,.35),lash=rgb(H.dark?'#120e0c':'#1d1512');
  for(const side of[-1,1]){const cx=side*H.eye.x,cy=H.eye.y,cz=H.eye.z,r=H.eye.r,rings=seg(10,5),around=seg(18,8);
   F.grid(eyeMat,around,rings,(u,v,out)=>{const alpha=v*1.75,beta=u*TAU;out.x=cx+Math.sin(alpha)*Math.cos(beta)*r;out.y=cy+Math.sin(alpha)*Math.sin(beta)*r;out.z=cz+Math.cos(alpha)*r;const streak=.82+.3*F.noise3(beta*5.3,side*3.1,1.7);out.col=alpha<.18?pupil:alpha<.5?tint(H.iris,streak*(alpha<.24?.7:1)):alpha<.55?limbus:tint(sclera,.9-.24*smooth(.75,1.75,alpha));},{closeU:true,poleStart:true,reference:(x,y,z)=>[x-cx,y-cy,z-cz]});
   // Lids: two shells a little larger than the eye. Their edges meet at the corners and leave an almond opening.
   const lr=r+.0012,span=1.22,cols2=seg(14,6),rows2=seg(6,3),open=H.fem?1.06:1,upper=beta=>.41*open*Math.pow(Math.max(0,Math.cos(beta*1.26)),.7)-.02-side*beta*.04,lower=beta=>-.37*open*Math.pow(Math.max(0,Math.cos(beta*1.26)),.85)+.02-side*beta*.02;
   const lid=(from,to,margin)=>F.grid(skin,cols2,rows2,(u,v,out)=>{const beta=mix(-span,span,u),e=mix(from(beta),to,v),ce=Math.cos(e);out.x=cx+Math.sin(beta)*ce*lr;out.y=cy+Math.sin(e)*lr;out.z=cz+Math.cos(beta)*ce*lr;out.col=v<.001?margin:white;},{reference:(x,y,z)=>[x-cx,y-cy,z-cz]});
   lid(upper,1.2,[.34,.26,.24]);lid(lower,-1.05,[.8,.76,.74]);
   if(lod===0){const lashes=part(head,'plain',{roughness:.6,tag:'lash',side:THREE.DoubleSide});F.grid(lashes,cols2,1,(u,v,out)=>{const beta=mix(-span*.92,span*.92,u),tilt=v*.12,e=upper(beta)+.01-tilt,reach=lr+(v?(H.fem?.0042:.0022)*Math.sin(u*Math.PI):0),ce=Math.cos(e);out.x=cx+Math.sin(beta)*ce*reach;out.y=cy+Math.sin(e)*reach;out.z=cz+Math.cos(beta)*ce*reach;out.col=lash;},{orient:false});}
  }
  // Ears: a shallow bowl with a rolled rim and a lobe, tilted back and flared out from the head.
  const p={x:0,y:0,z:0},earCol=[1.04,.93,.92];
  for(const side of[-1,1]){const from=skin.count;H.surf.at(side*1.62,H.yOf(.125),p);const ex=p.x+side*.0015,ey=H.yOf(.125),ez=p.z-.004;
   F.ellipsoid(skin,0,0,0,.0052,.030,.0165,{nu:seg(12,6),nv:seg(10,5),col:(x,y,z)=>tint(earCol,side*x>0?.74+.26*Math.hypot(y,z):1),warp:(x,y,z,w)=>{const bowl=Math.exp(-((y+.08)*(y+.08)+z*z)/.42);w[0]=x*(side*x>0?1-.7*bowl:1);w[1]=y<-.55?y*.94:y;w[2]=z*(1-.28*Math.max(0,-y))+.1*y;}});
   if(lod===0){const rim=[[0,-.012,.0125],[0,.004,.0165],[0,.021,.0135],[0,.0295,.004],[0,.027,-.008],[0,.013,-.0145],[0,-.008,-.0135],[0,-.024,-.006]].map(([x,y,z])=>[side*.0042,y,z]);F.tube(skin,rim,t=>.0034*(1-.35*t),{sides:seg(6,3),segments:seg(16,6),col:earCol});F.ellipsoid(skin,side*.003,-.027,.0015,.0046,.0078,.0066,{nu:seg(8,5),nv:seg(6,4),col:earCol});}
   const m=new THREE.Matrix4().makeRotationY(side*-.42).multiply(new THREE.Matrix4().makeRotationX(-.16));m.setPosition(ex,ey,ez);skin.transform(from,m);
  }
 }
 // Every piece that shares the face material looks its colour up in the painted face by position.
 const uv=[0,0];for(let k=0;k<skin.count;k++){faceUV(H,skin.p[k*3],skin.p[k*3+1],skin.p[k*3+2],uv);skin.uv[k*2]=uv[0];skin.uv[k*2+1]=uv[1];}
}

// ---- hair ------------------------------------------------------------------------------
// A style is a thickness map over the scalp plus optional length (hair that hangs below the hairline),
// tails, buns, strands and fins. `end` is how far down the length reaches, measured from the chin.
const HAIR={
 1:{t:.0032,side:.0032},2:{t:.017,side:.010,part:.42},3:{t:.019,side:.011,wave:.0045},4:{t:.024,side:.019,bump:.007,scale:62,puff:true},
 5:{t:.062,side:.052,bump:.009,scale:40,puff:true,round:true},6:{t:.066,side:.007,flat:true},7:{t:.021,side:.010,quiff:.012,back:true},
 8:{t:.018,side:.015,end:.018,curl:-.014},9:{t:.018,side:.015,end:-.04,curl:-.009},10:{t:.018,side:.015,end:-.10,curl:.003},11:{t:.017,side:.014,end:-.27,curl:0},
 12:{t:.011,side:.008,back:true,tail:true},13:{t:.010,side:.008,back:true,bun:[.243,-.040,.044]},14:{t:.011,side:.009,back:true,bun:[.078,-.112,.040]},
 15:{t:.008,side:.007,rows:true,strands:[16,.27,.0052]},16:{t:.013,side:.011,strands:[22,.30,.0082]},17:{t:0,side:0,fin:[.056,.011]},18:{t:.008,side:.009,horseshoe:true},19:{t:.018,side:.013,bump:.0045,scale:95}
};
// How strongly the scalp shows the hair colour through the hair (shaved and very short styles).
const SCALP_TINT={0:0,1:.62,17:.34,18:.3};
function buildHair(rig,a,M,H,covered){
 const id=a.hair,style=HAIR[id];if(!style)return null;
 const holder=group(rig.head,'hair'),mat=part(holder,'hair'),cols=seg(64,12),rows=seg(20,5),c=H.centre,base={x:0,y:0,z:0},streak=u=>.82+.3*F.noise3(u*90,id*1.7,.3)+.08*F.noise3(u*400,2.1,id),colourAt=(u,root)=>tint(H.hair,streak(u)*(.78+.22*root));
 // Under a hat only the hair below the band is kept.
 const cover=covered?.172:Infinity,longStyle=style.end!==undefined;
 const outward=(p,out)=>{const dx=p.x-c.x,dy=(p.y-c.y)*.9,dz=p.z-c.z,len=Math.hypot(dx,dy,dz)||1;out[0]=dx/len;out[1]=dy/len;out[2]=dz/len;},n=[0,0,0],signed=theta=>{let t=theta%TAU;if(t>Math.PI)t-=TAU;if(t<-Math.PI)t+=TAU;return t;};
 function thickness(theta,t){
  const st=signed(theta),at=Math.abs(st),sideness=smooth(.5,1.5,at)*(1-smooth(.55,.95,t)),top=smooth(.25,.7,t);let th=mix(style.t,style.side,sideness);
  // Hair lifts off the scalp quickly at the hairline, except where length continues below it.
  const R=smooth(0,.16,t)*(.25+.75*smooth(0,.4,t)),rise=longStyle?Math.max(R,smooth(.8,1.02,at)):R;th*=mix(style.puff?(style.round?.2:.6):.12,1,rise);
  if(style.part){const s=Math.sin(st-style.part);th*=1+.2*smooth(-.2,.9,s)*top-.22*gauss(st,style.part,.16)*top;}
  if(style.quiff)th+=style.quiff*gauss(at,0,.9)*gauss(t,.22,.3);
  if(style.wave)th+=style.wave*Math.sin(st*7+t*9)*Math.sin(t*14+st*2)*smooth(0,.3,t);
  if(style.bump){const s=style.scale;th+=style.bump*(F.fbm3(Math.sin(st)*s*.1*(1-t*.6),t*s*.16,Math.cos(st)*s*.1*(1-t*.6),2)-.35)*smooth(0,.2,t)*2;}
  if(style.rows)th+=.0035*Math.pow(Math.abs(Math.sin(Math.sin(st)*26)),.5)*smooth(.1,.3,t);
  if(style.horseshoe){const k=(1-smooth(.42,.6,t))*smooth(.75,1.15,at);th=th*k-(1-k)*.004;}
  if(style.flat){const lift=smooth(.3,.62,t);th=mix(style.side+(style.t*.25)*smooth(.1,.3,t),style.t,lift);}
  return style.horseshoe?th:Math.max(0,th);
 }
 // The cap. Its seam is at the back of the head and is not shared, so strand shading runs unbroken around it.
 if(style.t>0||style.side>0){
  F.grid(mat,cols,rows,(u,v,out)=>{const theta=u*TAU+Math.PI,t=Math.min(1,v),line=H.hairline(theta),ym=mix(line,CROWN-.001,Math.pow(t,.86));
   H.surf.at(theta,H.yOf(Math.min(ym,.2334)),base);if(t>=1){base.x=0;base.z=H.zc-.006;base.y=H.yOf(CROWN);}
   outward(base,n);let th=thickness(theta,t);if(ym>cover)th=Math.min(th,.004);
   out.x=base.x+n[0]*th;out.y=base.y+n[1]*th;out.z=base.z+n[2]*th;
   if(style.flat){const cap=H.yOf(CROWN)+style.t*.9;if(out.y>cap-.004&&t>.3)out.y=mix(out.y,cap,smooth(.3,.55,t));}
   out.col=colourAt(u+(style.part?t*.08:0),smooth(0,.5,t));
  },{reference:(x,y,z)=>[x-c.x,y-c.y,z-c.z]});
 }
 // Length: a solid fall of hair from the hairline behind the ears. The outside hangs from the cap; the inside
 // runs back up along the neck, so there is hair behind the neck when seen from the front.
 if(longStyle){const start=.9,rowsL=seg(14,5),colsL=seg(40,10),endBack=style.end,back=theta=>smooth(1.9,2.5,Math.abs(theta)),neckR=M.neck+.006;
  const bottom=theta=>mix(Math.max(endBack,-.098),endBack,back(theta)),ring=(theta,s,inner,out)=>{const line=H.hairline(theta),ymTop=line+.012,ym=mix(ymTop,bottom(theta),s);
   H.surf.at(theta,H.yOf(clamp(ymTop,-.02,.2334)),base);outward(base,n);const front=1-smooth(1.05,1.6,Math.abs(theta)),th=thickness(theta,0)+.002+.012*front*smooth(0,.3,s),hang=smooth(0,.35,s),widen=1+.05*hang+(style.curl||0)*8*smooth(.6,1,s)*(1-front)/* V8.8: no step where it meets the top of the hair, and the ends do not curl into the jaw at the front */;
   const ox=(base.x+n[0]*th)*widen,oz=(base.z-H.zc+n[2]*th)*widen+H.zc-.012*hang*back(theta),len=Math.hypot(ox,oz-H.zc)||1;
   if(inner){const reach=mix(neckR,len-.004,Math.max(smooth(.82,1,s),1-smooth(start+.05,start+.5,Math.abs(theta))))/* V8.9: thin at the front edge, no fold toward the chin */,below=ym<.02?reach:Math.max(reach,len*.55);out.x=ox/len*below;out.z=H.zc+(oz-H.zc)/len*below;out.y=H.yOf(ym)+.003;}
   else{out.x=ox;out.y=H.yOf(ym);out.z=oz;}
   out.col=tint(colourAt((theta+Math.PI)/TAU,.6),(1-.3*smooth(.75,1,s))*(inner?.6:1));};
  // One sheet wraps the whole back of the head from ear to ear, so its facing is decided once for both sides.
  /* V8.8: drawn on both sides, so its open edge beside the face does not show through */F.grid(part(holder,'hair',{side:THREE.DoubleSide}),colsL*2,rowsL*2,(u,v,out)=>{const theta=mix(start,TAU-start,u),s=v<=.5?v*2:(1-v)*2;ring(signed(theta),s,v>.5,out);},{reference:(x,y,z)=>{const len=Math.hypot(x,z-H.zc)||1,mid=(M.neck+H.halfWidth+.02)/2,dir=len>mid?1:-1;return[x/len*dir,0,(z-H.zc)/len*dir];}});
 }
 const tailCol=(t,u)=>colourAt(u*.6+t*.05,.7);
 if(style.tail&&!covered){const y0=H.yOf(.186),z0=H.zc-.104;F.tube(mat,[[0,y0,z0+.012],[0,y0-.002,z0-.018],[0,y0-.04,z0-.032],[0,y0-.11,z0-.036],[0,y0-.19,z0-.032],[0,y0-.25,z0-.03]],t=>[.024*(1-.55*t)+.004,.017*(1-.6*t)+.003],{sides:seg(12,5),segments:seg(22,6),col:tailCol});
  F.lathe(part(holder,'plain',{roughness:.6,tag:'band'}),[[.0185,-.006],[.021,0],[.0185,.006]],{sides:seg(12,6),x:0,y:y0+.009,z:z0-.014,col:rgb('#22242a'),smooth:false});}
 if(style.bun&&!(covered&&style.bun[0]>.15)){const[by,bz,br]=style.bun;F.ellipsoid(mat,0,H.yOf(by),H.zc+bz,br,br*.86,br,{nu:seg(22,8),nv:seg(14,6),col:(x,y,z)=>tint(H.hair,.78+.3*F.noise3(Math.atan2(x,z)*3+y*9,y*4,1.3)),warp:(x,y,z,w)=>{const k=1+.05*Math.sin(Math.atan2(x,z)*7+y*10);w[0]=x*k;w[1]=y;w[2]=z*k;}});}
 if(style.strands){const[count,length,radius]=style.strands,r=F.rng('strands'+a.face+':'+id);for(let i=0;i<count;i++){const side=i%2?1:-1,theta=side*mix(1.15,Math.PI,(Math.floor(i/2)+.5)/(count/2)+(r()-.5)*.04),line=H.hairline(theta)+.02+r()*.05;
   H.surf.at(theta,H.yOf(line),base);outward(base,n);const th=style.side+.004,x0=base.x+n[0]*th,z0=base.z+n[2]*th,len=length*(.82+r()*.3),sway=(r()-.5)*.03,knots=id===15;
   F.tube(mat,[[x0,base.y+.01,z0],[x0*1.05,base.y-len*.3,z0-.006],[x0*1.03+sway,base.y-len*.68,z0-.004],[x0*.98+sway,base.y-len,z0+.004]],t=>radius*(1-.3*t)*(knots?1+.16*Math.sin(t*len*520):1+.1*F.noise3(t*9,i,2)),{sides:seg(7,3),segments:seg(knots?26:14,5),col:t=>tint(H.hair,.78+.28*F.noise3(t*30,i*1.3,.5))});}}
 // A fin of hair along the midline from the forehead to the nape.
 if(style.fin&&!covered){const[height,width]=style.fin,steps=seg(28,8),profile=[[-1,0],[-.5,.72],[0,1],[.5,.72],[1,0]],fin=part(holder,'hair',{side:THREE.DoubleSide});
  F.grid(fin,profile.length-1,steps,(u,v,out)=>{const front=v<.5,arc=Math.sin(v*Math.PI),ymArc=mix(front?H.hairline(0)-.003:H.hairline(Math.PI)+.004,CROWN,arc);H.surf.at(front?0:Math.PI,H.yOf(Math.min(.2334,ymArc)),base);if(ymArc>.2334){base.z=H.zc-.006;base.y=H.yOf(CROWN);}
   outward(base,n);const[k,rise]=profile[Math.round(u*(profile.length-1))],h=height*rise*Math.sin(v*Math.PI*.94+.09)*(.8+.2*Math.abs(Math.sin(v*38)));out.x=k*width;out.y=base.y+n[1]*h;out.z=base.z+n[2]*h;out.col=tint(H.hair,.72+.3*rise);},{orient:false});}
 return holder;
}

// ---- body ------------------------------------------------------------------------------
// Each surface is written in the coordinates of the bone that carries it, so clothing can be cut from the
// same surface (pushed out by its ease) and details can be placed on it by angle and height.
const SPINE_Y=1.01,PELVIS_Y=.88,NECK_Y=1.48;
function bodySurfaces(M){
 const{jointX,chest,waist,hips,fem,belly}=M,grown=fem&&!M.child,bust=grown?.021:0,glute=grown?.012:0,T=y=>y-SPINE_Y,V=y=>y-PELVIS_Y;
 const shaped=(theta,y,out)=>{if(bust&&Math.cos(theta)>0)out.z+=bust*.55*gauss(Math.abs(out.x),.058,.04)*gauss(y,T(1.248),.05)*smooth(0,.5,Math.cos(theta));};
 const torso=F.surface([{y:T(.74),a:hips*.96,f:.102,k:.114+glute,n:2.3},{y:T(.86),a:hips,f:.105+belly*.4,k:.118+glute,n:2.3},{y:T(.93),a:hips*.975,f:.102+belly*.8,k:.108+glute*.5,n:2.25},{y:T(1.03),a:waist,f:.094+belly,k:.088,n:2.15},{y:T(1.12),a:mix(waist,chest,.62),f:.103+belly*.6,k:.094,n:2.2},{y:T(1.235),a:chest,f:.114+bust*.45,k:.104,n:2.3},{y:T(1.31),a:chest,f:.110+bust*.2,k:.108,n:2.3},{y:T(1.37),a:jointX+.014,f:.09,k:.1,n:2.6},{y:T(1.404),a:jointX*.98,f:.08,k:.094,n:2.5},{y:T(1.432),a:jointX*.74,f:.07,k:.086,n:2.3},{y:T(1.455),a:jointX*.5,f:.062,k:.076,n:2.15},{y:T(1.47),a:.074,f:.057,k:.066,n:2.05},{y:T(1.482),a:M.neck+.012,f:.055,k:.060,n:2}],shaped);
 const pelvis=F.surface([{y:V(.765),a:hips*.5,f:.062,k:.07,n:2.1},{y:V(.805),a:hips*.93,f:.098,k:.112+glute,n:2.3},{y:V(.86),a:hips,f:.106+belly*.4,k:.118+glute,n:2.35},{y:V(.93),a:hips*.975,f:.100+belly*.8,k:.106+glute*.5,n:2.25},{y:V(1.03),a:waist,f:.094+belly,k:.088,n:2.15},{y:V(1.07),a:waist*1.01,f:.095+belly,k:.089,n:2.15}]);
 // The neck leans forward a little and widens into the shoulders. It ends inside the head, just above the jaw.
 const neck=F.surface([{y:-.07,a:.094,f:.064,k:.076},{y:-.04,a:M.neck+.022,f:M.neck+.008,k:M.neck+.014},{y:-.012,a:M.neck+.006,f:M.neck+.002,k:M.neck+.007,z:.002},{y:.02,a:M.neck,f:M.neck-.001,k:M.neck+.004,z:.006},{y:.05,a:M.neck,f:M.neck-.003,k:M.neck+.003,z:.009},{y:.075,a:M.neck+.001,f:M.neck-.006,k:M.neck+.002,z:.010}]);
 // side = +1 for the right limb (outer side toward +x), -1 for the left.
 const sided=(side,rows)=>F.surface(rows.map(r=>({y:r[0],a:side>0?r[1]:r[2],b:side>0?r[2]:r[1],f:r[3],k:r[4],z:r[5]||0,n:r[6]||2})));
 const A=M.arm,R=M.forearm,TH=M.thigh,CF=M.calf,wrist=fem?.9:1;
 const arm=side=>sided(side,[[.04,.034,.034,.038,.038],[.012,A*1.0,A*.9,A*1.02,A*1.02],[-.03,A*1.1,A*.95,A*1.1,A*1.08],[-.10,A*1.03,A*.96,A*1.08,A],[-.19,A*.9,A*.88,A*.92,A*.9],[-.255,A*.8,A*.8,A*.8,A*.84],[-.285,A*.8,A*.8,A*.8,A*.84]]);
 const forearm=side=>sided(side,[[.02,A*.8,A*.8,A*.8,A*.84],[-.035,R*1.06,R,R*1.02,R*.98],[-.11,R*.95,R*.93,R*.95,R*.92],[-.19,R*.74,R*.72,R*.62,R*.6],[-.25,.027*wrist,.027*wrist,.019*wrist,.019*wrist,0,2.3],[-.264,.026*wrist,.026*wrist,.018*wrist,.018*wrist,0,2.3]]);
 // Each thigh carries its half of the seat: the two tops meet at the middle and reach the hip line, so the
 // join between leg and hips sits up at the waist where a shirt hem or waistband covers it.
 const seat=hips-M.hipX,thigh=side=>sided(side,[[.075,seat*.72,M.hipX*.9,.074,.082+glute*.5],[.03,seat*.97,M.hipX+.006,.101+belly*.4,.114+glute],[-.02,seat,M.hipX+.004,.103,.116+glute],[-.075,Math.max(TH*1.02,seat*.96),TH*.92,TH*1.1,TH*1.12+glute*.5],[-.13,TH*.98,TH*.88,TH*1.05,TH],[-.22,TH*.86,TH*.80,TH*.92,TH*.88],[-.33,TH*.70,TH*.68,TH*.74,TH*.72],[-.395,TH*.64,TH*.63,TH*.70,TH*.62],[-.412,TH*.64,TH*.63,TH*.70,TH*.62]]);
 const calf=side=>sided(side,[[.02,TH*.64,TH*.63,TH*.68,TH*.62],[-.05,CF*.98,CF*.94,CF*.92,CF*1.06],[-.13,CF*1.04,CF,CF*.85,CF*1.22,-.004],[-.24,CF*.78,CF*.76,CF*.74,CF*.86],[-.34,CF*.62,CF*.6,CF*.64,CF*.62],[-.385,CF*.63,CF*.6,CF*.7,CF*.66],[-.398,CF*.63,CF*.6,CF*.7,CF*.66]]);
 return{torso,pelvis,neck,arm,forearm,thigh,calf,T,V};
}
// Skin tone with gentle mottling; knuckles, elbows and knees are a shade deeper.
function skinTone(H,deep=0){const s=H.skin;return(theta,y,p)=>{const v=(.965+.07*F.fbm3(p.x*38,p.y*38,p.z*38,2))*(1-deep);return[s[0]*v,s[1]*v*(1-deep*.25),s[2]*v*(1-deep*.3)];};}
function buildNeck(rig,B,H){F.loft(part(rig.neck,'skin'),B.neck,{sides:seg(18,7),rows:seg(8,3),col:skinTone(H)});}
// The upper chest and shoulders, for necklines and sleeveless tops. from/to are heights above the ground.
function buildChestSkin(rig,B,H,from,to=1.482){F.loft(part(rig.spine,'skin'),B.torso,{sides:seg(26,8),rows:seg(Math.max(4,(to-from)*60),3),from:B.T(from),to:B.T(to),col:skinTone(H)});}
// The arm starts just above the joint; its cap is the top of the deltoid.
const ARM_TOP=.012,ARM_CAP=.028;
function buildArmSkin(rig,B,H,side,label,from,to){if(to>=from-.004)return;const cap=from>=ARM_TOP-.001;F.loft(part(rig['arm'+label],'skin'),B.arm(side),{sides:seg(16,6),rows:seg(Math.max(3,(from-to)*45),2),from:Math.min(from,ARM_TOP),to:Math.max(to,-.275),capStart:cap?'round':null,capStartHeight:ARM_CAP,capEnd:to<=-.27?'round':null,col:skinTone(H)});}
function buildForearmSkin(rig,B,H,side,label,from,to=-.262){if(to>=from-.004)return;F.loft(part(rig['forearm'+label],'skin'),B.forearm(side),{sides:seg(14,6),rows:seg(Math.max(3,(from-to)*45),2),from,to,capStart:from>=0?'round':null,col:skinTone(H,0)});}
const THIGH_TOP=.075;
function buildThighSkin(rig,B,H,side,label,from,to){if(to>=from-.004)return;F.loft(part(rig['thigh'+label],'skin'),B.thigh(side),{sides:seg(16,6),rows:seg(Math.max(3,(from-to)*36),2),from:Math.min(from,THIGH_TOP),to:Math.max(to,-.40),capStart:from>=THIGH_TOP?'round':null,capStartHeight:.03,capEnd:to<=-.39?'round':null,col:skinTone(H)});}
function buildCalfSkin(rig,B,H,side,label,from,to=-.392){if(to>=from-.004)return;F.loft(part(rig['calf'+label],'skin'),B.calf(side),{sides:seg(14,6),rows:seg(Math.max(3,(from-to)*36),2),from,to,capStart:from>=0?'round':null,col:skinTone(H)});}
// Hands hang with the palm facing back, as the animation expects: width along x, the thumb on the body side,
// fingers curling toward -z. Each finger and the thumb is its own small bone so grips can close.
function buildHand(rig,H,M,side,label){
 const hand=rig['hand'+label],scale=(M.fem?.92:1)*(.94+.06*M.lm),skin=part(hand,'skin'),tone=skinTone(H),knuckle=skinTone(H,.07);
 const palm=F.surface([{y:.006,a:.026,f:.0175,k:.0175,n:2.2},{y:-.02,a:.034,f:.016,k:.015,n:2.4},{y:-.055,a:.041,f:.0145,k:.013,n:2.6},{y:-.086,a:.040,f:.012,k:.0115,n:2.7},{y:-.095,a:.036,f:.0095,k:.0095,n:2.6}].map(s=>({...s,y:s.y*scale,a:s.a*scale,f:s.f*scale,k:s.k*scale})));
 F.loft(skin,palm,{sides:seg(14,6),rows:seg(8,3),capStart:'round',capStartHeight:.008,capEnd:'round',capEndHeight:.006,col:tone});
 const thumb=group(hand,'thumb',-side*.034*scale,-.028*scale,-.003);
 F.tube(part(thumb,'skin'),[[0,0,0],[-side*.011,-.021,-.008],[-side*.017,-.043,-.016],[-side*.018,-.058,-.025]].map(p=>p.map(v=>v*scale)),t=>(.0122-.004*t)*scale,{sides:seg(8,4),segments:seg(10,3),col:(t,u,p)=>tone(0,0,p)});
 if(buildLod<2){const lengths=[.070,.079,.073,.056],radii=[.0092,.0095,.0090,.0080];for(let i=0;i<4;i++){const f=group(hand,'finger'+i,side*(-.0305+i*.0203)*scale,-.090*scale,0),L=lengths[i]*scale;F.tube(part(f,'skin'),[[0,.004,0],[0,-L*.4,-L*.05],[0,-L*.75,-L*.16],[0,-L,-L*.30]],t=>radii[i]*scale*(1-.2*t)*(1+.1*gauss(t,.02,.08)+.07*gauss(t,.45,.07)+.05*gauss(t,.75,.06)),{sides:seg(8,4),segments:seg(10,3),col:(t,u,p)=>(Math.abs(t-.45)<.08||t<.06?knuckle:tone)(0,0,p)});f.rotation.x=-.22;}}
 else{const mitt=F.surface([{y:-.085*scale,a:.039*scale,f:.012,k:.012,n:2.6},{y:-.13*scale,a:.036*scale,f:.011,k:.016},{y:-.158*scale,a:.026*scale,f:.008,k:.02}]);F.loft(skin,mitt,{sides:seg(10,5),rows:3,capEnd:'round',capEndHeight:.006,col:tone});}
 rig['fingers'+label]=hand.children.filter(o=>o.name.startsWith('finger'));rig['thumb'+label]=thumb;(rig.handInfo??={})[label]={scale,tone,knuckle};
}
// Builds a surface that runs front to back (heel to toe) and writes it into `shape` with y up.
// rows: [z, half-width, top, bottom, power]; the bottom is flattened at `floor` when given.
function lengthwise(shape,rows,o={}){
 const temp=new F.Shape(),surf=F.surface(rows.map(r=>{const mid=(r[2]+r[3])/2;return{y:r[0],a:r[1],f:r[2]-mid,k:mid-r[3],z:mid,x:r[5]||0,n:r[4]||2.2};}));
 F.loft(temp,surf,{sides:o.sides||seg(16,6),rows:o.rows||seg(14,5),capStart:'round',capEnd:'round',capStartHeight:o.heel??.012,capEndHeight:o.toe??.016,col:o.col?(theta,y,p)=>o.col(p.x,p.z,p.y,theta):undefined});
 for(let k=0;k<temp.count;k++){const y=temp.p[k*3+1],z=temp.p[k*3+2];temp.p[k*3+1]=o.floor!==undefined?Math.max(z,o.floor):z;temp.p[k*3+2]=y;}
 // Swapping two axes mirrors the mesh, so the triangles are turned back to face outward.
 for(let k=0;k<temp.i.length;k+=3){const t=temp.i[k+1];temp.i[k+1]=temp.i[k+2];temp.i[k+2]=t;}
 shape.append(temp);return surf;
}
const SOLE=-.0665;
function buildBareFoot(rig,H,M,side,label){
 const foot=rig['foot'+label],skin=part(foot,'skin'),tone=skinTone(H),w=(M.fem?.92:1);
 lengthwise(skin,[[-.078,.026*w,-.012,SOLE],[-.05,.032*w,.012,SOLE],[-.005,.035*w,.006,SOLE],[.05,.042*w,-.022,SOLE],[.105,.048*w,-.040,SOLE],[.148,.046*w,-.048,SOLE],[.163,.040*w,-.052,SOLE]],{floor:SOLE,col:(x,y,z)=>tone(0,0,{x,y,z}),toe:.008});
 if(buildLod<2)for(let i=0;i<5;i++){const x=side*(-.030+i*.0152)*w*-1,len=[.026,.022,.020,.018,.015][i],r=[.0105,.0082,.0078,.0074,.0068][i];F.tube(skin,[[x,SOLE+r,.158-i*.006],[x,SOLE+r*.95,.158-i*.006+len]],r,{sides:seg(7,4),segments:2,col:(t,u,p)=>tone(0,0,p)});}
}

// ---- clothing ---------------------------------------------------------------------------
// Garments are cut from the body surfaces: the same shape pushed outward by the garment's ease, with folds
// where cloth gathers. Collars, plackets, pockets, cuffs and hems are raised panels that follow that surface.
const FABRIC={tee:'jersey',vneck:'jersey',polo:'jersey',henley:'jersey',shirt:'cotton',linen:'cotton',formal:'cotton',hoodie:'wool',ziphood:'wool',sweater:'knit',cardigan:'knit',denim:'denim',bomber:'nylon',field:'canvas',blazer:'wool',coat:'wool',rain:'nylon',track:'nylon',running:'jersey',workvest:'canvas',apron:'cotton',overall:'canvas',tunic:'knit'};
const LOWER_FABRIC={straight:'denim',taper:'denim',chino:'cotton',formal:'wool',cargo:'canvas',wide:'cotton',jogger:'wool',track:'nylon',shorts:'cotton',sport:'jersey',skirt:'cotton',cropped:'cotton'};
// Half-width of the trouser leg at the hem, and how much room the cut leaves at the thigh.
const LEG_CUT={straight:[.082,.012],taper:[.064,.008],chino:[.073,.011],formal:[.078,.013],cargo:[.086,.02],wide:[.118,.03],jogger:[.060,.02],track:[.078,.016],shorts:[0,.018],sport:[0,.024],skirt:[0,.01],cropped:[.074,.012]};
const shadeOf=(hex,k)=>tint(rgb(hex),k);
/* V3.7: a one-piece dress. `dress` on an appearance turns a top worn with a skirt into a fitted bodice and skirt cut from
 * one smoother cloth; `bust` adds a fuller, fully clothed chest whose two halves sit on their own small bones so the game
 * can let them follow the car's movement. Both are for adult women only (never for a `child` appearance). */
const GOWN={roughness:.62,tag:'gown'},isGown=(a,M)=>!!a.dress&&!!M.fem&&!M.child&&P.lowers[a.lower].shape==='skirt';
// A closed ribbon of cloth between two heights that may both change with the angle (hems, collars, cuffs).
function band(shape,surf,low,high,o={}){const sides=o.sides||seg(28,8),lift=o.lift??.0015,thick=o.thick??.003,nrm={x:0,y:0,z:0},rows=o.rows||2,profile=o.profile;
 return F.grid(shape,sides,rows+2,(u,v,out)=>{const theta=u*TAU,j=Math.round(v*(rows+2)),edge=j===0||j===rows+2,t=clamp((j-1)/rows,0,1),y=mix(low(theta),high(theta),t);surf.at(theta,y,out);surf.normal(theta,y,nrm);const h=(edge?-.001:lift+thick*(profile?profile(t):1));out.x+=nrm.x*h;out.y+=nrm.y*h+(edge?(j===0?.0006:-.0006):0);out.z+=nrm.z*h;out.col=typeof o.col==='function'?o.col(theta,y,out):o.col;},{closeU:true,reference:(x,y,z)=>{const a=Math.atan2(x,z);return[Math.sin(a),0,Math.cos(a)];}});}
// Cloth wrapped round a surface from a hem line up to a top line. ease and both lines may vary with the angle.
function wrap(shape,surf,o){const sides=o.sides||seg(28,8),rows=o.rows||seg(18,5),nrm={x:0,y:0,z:0},ease=o.ease,low=o.low,high=o.high;
 return F.grid(shape,sides,rows,(u,v,out)=>{const theta=u*TAU,y=mix(typeof low==='function'?low(theta):low,typeof high==='function'?high(theta):high,v);surf.at(theta,y,out);surf.normal(theta,y,nrm);const e=typeof ease==='function'?ease(theta,y,out):ease;out.x+=nrm.x*e;out.y+=nrm.y*e*.3;out.z+=nrm.z*e;out.col=typeof o.col==='function'?o.col(theta,y,out):o.col;},{closeU:true,reference:(x,y,z)=>{const a=Math.atan2(x,z);return[Math.sin(a),0,Math.cos(a)];}});}
// A button, stud or rivet sitting on a surface.
// Small raised details are left off the far-distance model.
const patchOn=(shape,surf,o)=>buildLod>1&&Math.abs(o.t1-o.t0)*Math.abs(o.y1-o.y0)<.03?0:F.patch(shape,surf,o);
function stud(shape,surf,theta,y,radius,col,lift=.003){if(buildLod>1)return;const p={x:0,y:0,z:0},n={x:0,y:0,z:0};surf.at(theta,y,p);surf.normal(theta,y,n);F.ellipsoid(shape,p.x+n.x*lift,p.y+n.y*lift,p.z+n.z*lift,radius,radius,radius*.45,{nu:seg(8,5),nv:seg(5,3),col});}
function clothColours(a){const pal=P.palettes[a.palette];return{upper:a.topColor||pal.upper,lower:a.dress&&P.lowers[a.lower].shape==='skirt'?a.topColor||pal.upper:a.bottomColor||pal.lower,accent:a.topAccentColor||pal.accent,lowerAccent:a.bottomAccentColor||pal.accent,shoeAccent:a.shoeAccentColor||pal.accent,shoe:a.shoeColor||null};}
// Folds: gathered cloth at the waist and inside the elbows and knees, plus a slow overall drape.
const drape=(amount,seed)=>(theta,y,p)=>amount*(.55*F.fbm3(p.x*14+seed,p.y*11,p.z*14,2)+.45*Math.sin(theta*5+p.y*34+seed)*F.noise3(p.y*20,seed,theta));

// The fuller chest of an adult woman: one covered shape per side on its own small bone, so it can move a little
// with the body. `bust` sets the size (1 is a full figure, 2 a large one). Never built for a `child` appearance.
function bustShapes(rig,a,M,B,shapeOn,colour,cups=false){
 if(!(a.bust>0)||!M.fem||M.child)return;const T=B.T,k=clamp(a.bust,.4,2.4),more=Math.max(0,k-1);
 /* V8.9: the upper half slopes down into the chest and ends 1.2 cm inside it, so chest and bust meet gradually */
 const q={x:0,y:0,z:0},depth=(x,y)=>{const ax=Math.abs(x);let lo=0,hi=Math.PI/2;for(let i=0;i<12;i++){const m=(lo+hi)/2;B.torso.at(m,y,q);if(Math.abs(q.x)<ax)lo=m;else hi=m;}B.torso.at(lo,y,q);return q.z;};
 for(const s of[-1,1]){const label=s<0?'L':'R',cx=s*(.064+.006*more),cy=T(1.218-.008*more),cz=.034,pivot=rig['bust'+label]=group(rig.spine,'bust'+label,cx,cy,cz),at={x:0,y:0,z:0};
  const rx=.074+.008*k,ry=.066+.008*k,rz=.083+.030*k,up=1.75;
  F.ellipsoid(shapeOn(pivot),0,0,0,rx,ry,rz,{nu:seg(26,10),nv:seg(18,7),warp:(x,y,z,w)=>{const side=x*s>0?.78:1;w[0]=x*side;w[1]=y*(y>0?up:cups?.95:1.5);w[2]=z;
   if(y>0){const inside=(depth(cx+w[0]*rx,cy+w[1]*ry)-cz-.012)/rz;if(z>inside)w[2]=mix(z,inside,Math.pow(smooth(0,1,y),.85));}
   else if(!cups){/* cloth falls from the fullest point in a straight line to the body below */const r=Math.max(.05,Math.sqrt(1-y*y)),d=-y;w[0]=x/r*mix(1,.8,d)*side;const inside=(depth(cx+w[0]*rx,cy+w[1]*ry)-cz-.012)/rz,zr=z/r;w[2]=zr>inside?mix(zr,inside,Math.pow(d,1.15)):z;}},col:(x,y,z,out)=>{at.x=out.x+cx;at.y=out.y+cy;at.z=out.z+cz;return colour(0,at.y,at);}});}
}
// ---- swimwear (V4.1) ----
// `swim` on an adult appearance replaces the outfit: trunks and a bare chest for men, a two-piece for women.
function buildSwimTop(rig,a,M,B,H,C){
 const T=B.T,body=B.torso,main=rgb(C.upper),G=body.offset(.006),cloth=part(rig.spine,'nylon');buildChestSkin(rig,B,H,.985);
 for(const side of[-1,1]){const label=side<0?'L':'R';buildArmSkin(rig,B,H,side,label,ARM_TOP,-.282);buildForearmSkin(rig,B,H,side,label,0);}
 if(M.fem){const col=(theta,y,p)=>tint(main,.93+.09*F.fbm3(p.x*9,p.y*9,p.z*9,2)),front=theta=>smooth(1.75,.95,Math.abs(theta>Math.PI?theta-TAU:theta));
  // A band that is taller over the chest and narrow round the back, with a strap over each shoulder.
  wrap(cloth,body,{low:theta=>T(mix(1.218,1.182,front(theta))),high:theta=>T(mix(1.244,1.318,front(theta))),ease:.0045,rows:seg(8,3),sides:seg(36,12),col});
  bustShapes(rig,a,M,B,pivot=>part(pivot,'nylon'),col,true);/* the cups cover the whole shape */
  for(const s of[-1,1]){const points=[],q={x:0,y:0,z:0},nn={x:0,y:0,z:0};for(const[theta,y]of[[.42,1.312],[.5,1.39],[.62,1.445],[1.6,1.456],[2.55,1.40],[2.75,1.24]]){body.at(s*theta,T(y),q);body.normal(s*theta,T(y),nn);points.push([q.x+nn.x*.006,q.y+nn.y*.006,q.z+nn.z*.006]);}F.tube(cloth,points,.006,{sides:5,segments:seg(18,8),col:tint(main,.9)});}}
 return{ease:.006,G,fabric:'nylon',main,accent:rgb(C.accent),cloth,hemY:1.19,se:.004,buttonY:1,thetaFor:()=>0,opening:null};
}
function buildSwimBottom(rig,a,M,B,H,C){
 const V=B.V,main=rgb(C.lower),pel=part(rig.pelvis,'nylon'),col=(theta,y,p)=>tint(main,.93+.09*F.fbm3(p.x*8,p.y*8,p.z*8,2)),PS=B.pelvis.offset(.005),legs={};
 F.loft(pel,PS,{sides:seg(28,10),rows:seg(7,3),from:V(.765),to:V(.94),col});band(pel,PS,()=>V(.93),()=>V(.944),{thick:.0022,col:(theta,y,p)=>tint(col(theta,y,p),.86)});
 F.loft(part(rig.pelvis,'skin'),B.pelvis,{sides:seg(28,10),rows:seg(6,3),from:V(.93),to:V(1.07),col:skinTone(H)});
 for(const side of[-1,1]){const label=side<0?'L':'R',thigh=part(rig['thigh'+label],'nylon');legs[label]={side};F.loft(thigh,B.thigh(side).offset(.005),{sides:seg(20,6),rows:seg(5,3),from:THIGH_TOP,to:-.034,capStart:'round',capStartHeight:.03,col});buildThighSkin(rig,B,H,side,label,-.03,-.40);buildCalfSkin(rig,B,H,side,label,0);}
 return{legs,PS,main,accent:rgb(C.lowerAccent),shape:'sport',fabric:'nylon',V,top:V(.94)};
}
// ---- tops ----
function buildTop(rig,a,M,B,H,C){
 if(a.swim&&!M.child)return buildSwimTop(rig,a,M,B,H,C);
 const gown=isGown(a,M),u=gown?{...P.uppers[a.upper],shape:'tunic',sleeve:.12,ease:.001,length:.5}:P.uppers[a.upper],shape=u.shape,fabric=gown?'jersey':FABRIC[shape]||'cotton',cut=node=>gown?part(node,fabric,GOWN):part(node,fabric),cloth=cut(rig.spine),main=rgb(C.upper),accent=rgb(C.accent),over=catalogPick(a.cosmeticTop)?.v===3,ease=.005+u.ease*.5+(over?.012:0)+(buildLod>1?.006:0),se=Math.min(.02,.004+u.ease*.42)+(over?.008:0),T=B.T;
 // Jackets worn open show a shirt underneath through a real gap: the jacket front dips below the shirt layer there.
 const sleeveless=u.sleeve===0,open=['blazer','coat','cardigan','workvest'].includes(shape),easeAt=y=>ease*(.5+.5*smooth(T(1.39),T(1.18),y))+(gown?.007*smooth(T(1.29),T(1.40),y):0);
 const hemY=gown?1.0:({bomber:.875,denim:.88,blazer:.80,coat:.80,field:.80,rain:.80,hoodie:.835,ziphood:.835,sweater:.845,cardigan:.83,tunic:.80,running:.85,overall:.90}[shape]||.85)-(over?.03:0);
 // Necklines, as heights above the ground at each angle.
 const front=theta=>smooth(.9,.25,Math.abs(theta>Math.PI?theta-TAU:theta)),crew=theta=>1.462-.022*front(theta),neck=gown?theta=>1.462-.095*Math.pow(front(theta),1.5):{vneck:theta=>1.462-.075*Math.pow(front(theta),1.6),running:theta=>1.45-.05*front(theta),hoodie:theta=>1.468-.012*front(theta),ziphood:theta=>1.468-.012*front(theta)}[shape]||(['shirt','linen','formal','polo','denim','field','blazer','coat','rain','track','bomber','overall','apron'].includes(shape)?theta=>1.468-.014*front(theta):crew);
 // Colour: the garment itself, an inner layer showing through an open front, and any saved pattern.
 const inner=open?(shape==='blazer'||shape==='coat'?rgb('#e9e6de'):blend(accent,rgb('#e8e4da'),.5)):null,buttonY=shape==='blazer'?1.04:shape==='coat'?1.0:shape==='cardigan'?1.02:.86,opening=y=>!open?0:shape==='workvest'?.036:.066*smooth(buttonY,1.42,y);
 const pattern=a.topPattern&&a.topPattern!=='plain'?a.topPattern:null,fold=drape(gown?.0012:.003+u.ease*.05,a.upper*1.7);
 const colour=(theta,y,p)=>{const ya=y+SPINE_Y,st=theta>Math.PI?theta-TAU:theta;let c=main;
  if(pattern==='stripe'&&Math.floor((ya-.8)/.034)%2===0&&ya<1.38)c=accent;if(pattern==='chevron'&&Math.abs(Math.abs(ya-1.2-Math.abs(p.x)*.55)-.03)<.017&&Math.cos(st)>0)c=accent;if(pattern==='panel'&&(ya>1.3||Math.abs(ya-1.12)<.045))c=accent;
  const crease=.9+.1*F.fbm3(p.x*9,p.y*9,p.z*9,2);return[c[0]*crease,c[1]*crease,c[2]*crease];};
 // An open front is cut along its two edges: the cloth runs from one edge round the back to the other, and one
 // more column at each end tucks under the shirt layer, so the front edge is a clean line at any detail level.
 const body=B.torso,frontSides=seg(open?52:gown?44:32,gown?22:10),probe={x:0,y:0,z:0},thetaFor=(x,y)=>{if(x<=0)return 0;let lo=0,hi=1.5;for(let i=0;i<12;i++){const mid=(lo+hi)/2;body.at(mid,y,probe);if(probe.x<x)lo=mid;else hi=mid;}return(lo+hi)/2;};
 // Below the waist the top always clears the waistband and seat of whatever is worn underneath.
 const under=.0225+(LEG_CUT[P.lowers[a.lower].shape]||LEG_CUT.straight)[1]*.6,clear=gown?()=>0:y=>under*smooth(T(1.125),T(1.078),y);
 const bodyEase=(theta,y,p)=>Math.max(clear(y),(sleeveless&&shape!=='workvest'?.004:easeAt(y)+ease*.4*gauss(y,T(1.0),.06))+fold(theta,y,p));
 if(!open)wrap(cloth,body,{low:T(hemY),high:theta=>T(neck(theta)),ease:bodyEase,rows:seg(26,6),sides:frontSides,col:colour});
 else{const nrm={x:0,y:0,z:0},cols=frontSides+2;F.grid(cloth,cols,seg(26,6),(uu,v,out)=>{const j=Math.round(uu*cols),t=clamp((j-1)/frontSides,0,1),tucked=j===0||j===cols,y=mix(T(hemY),T(neck(t*TAU)),v),e=thetaFor(opening(y+SPINE_Y),y),theta=mix(e,TAU-e,t);
   body.at(theta,y,out);body.normal(theta,y,nrm);const h=tucked?-.006:bodyEase(theta,y,out);out.x+=nrm.x*h;out.y+=nrm.y*h*.3;out.z+=nrm.z*h;out.col=colour(theta,y,out);},{reference:(x,y,z)=>{const a2=Math.atan2(x,z);return[Math.sin(a2),0,Math.cos(a2)];}});}
 if(open)wrap(part(rig.spine,'cotton',{tag:'inner'}),body,{low:T(Math.max(.86,buttonY-.08)),high:theta=>T(neck(theta)),ease:.0035,rows:seg(14,4),sides:seg(24,8),col:(theta,y,p)=>tint(inner,.94+.06*F.fbm3(p.x*12,p.y*12,p.z*12,2))});
 const G=body.offset((theta,y)=>Math.max(clear(y),easeAt(y))+.001);
 bustShapes(rig,a,M,B,cut,colour);
 // Skin at the neck opening.
 const lowest=gown?1.335:shape==='vneck'?1.37:shape==='running'?1.38:open?1.3:1.42;buildChestSkin(rig,B,H,lowest-.02);
 // Hems and neck finishes.
 const rib=part(rig.spine,'knit'),ribCol=shape==='bomber'||shape==='track'?accent:tint(main,.86);
 if(['bomber','hoodie','ziphood','sweater','cardigan','track'].includes(shape))band(rib,G,()=>T(hemY-.004),()=>T(hemY+.05),{thick:.004,col:ribCol});else if(!gown)band(cloth,G,()=>T(hemY-.002),()=>T(hemY+.012),{thick:.0016,col:tint(main,.9)});
 if(['tee','henley','sweater','tunic','running'].includes(shape))band(!gown&&(shape==='sweater'||shape==='tunic')?rib:cloth,G,theta=>T(neck(theta)-.017),theta=>T(neck(theta)+.001),{thick:.0028,col:tint(main,.84),sides:gown?frontSides:undefined});
 if(shape==='vneck')band(cloth,G,theta=>T(neck(theta)-.013),theta=>T(neck(theta)+.001),{thick:.0024,col:tint(main,.84)});
 // Shirt collars: a stand round the neck and a leaf folded over it, open at the front.
 const collared=['polo','shirt','linen','formal','denim','field','blazer','coat','overall','apron'].includes(shape),collarCol=shape==='polo'?accent:open&&inner?(shape==='blazer'||shape==='coat'?inner:main):main;
 if(collared){const neckS=B.neck,nk=part(rig.neck,shape==='polo'?'knit':'cotton'),nrm={x:0,y:0,z:0},leaf=shape==='blazer'||shape==='coat'?.03:.04;
  F.grid(nk,seg(30,10),4,(uu,v,out)=>{const theta=mix(.16,TAU-.16,uu),st=theta>Math.PI?theta-TAU:theta,j=Math.round(v*4),y=[-.045,-.012,-.008,-.034,-.047][j],push=[.004,.0075,.012,.02+.012*front(theta),.026+.02*front(theta)][j],drop=j>=3?leaf*(.55+.6*gauss(Math.abs(st),.32,.22))*(j===4?1:.55):0;
   neckS.at(theta,y,out);neckS.normal(theta,y,nrm);out.x+=nrm.x*push;out.z+=nrm.z*push;out.y+=-drop+(j>=3?.03:0);out.col=tint(collarCol,j===2?1.05:.96);},{reference:(x,y,z)=>{const a2=Math.atan2(x,z);return[Math.sin(a2),.3,Math.cos(a2)];}});}
 // Front closures.
 const metal=part(rig.spine,'plain',{metalness:.75,roughness:.3,tag:'trim'}),trim=part(rig.spine,'plain',{roughness:.5,tag:'button'}),top=neck(0)-.012;
 if(['ziphood','bomber','rain','track','field'].includes(shape)){patchOn(metal,G,{t0:-.022,t1:.022,y0:T(hemY+.01),y1:T(top),thick:.0022,nu:2,nv:seg(14,4),col:rgb('#b9bdc0')});stud(metal,G,0,T(top-.03),.007,rgb('#d0d3d5'),.005);}
 if(['shirt','linen','formal','denim','cardigan','blazer','coat','workvest','overall'].includes(shape)){const from=shape==='blazer'?buttonY:shape==='coat'?buttonY:hemY+.05,to=shape==='blazer'?buttonY+.085:shape==='coat'?buttonY+.24:open?buttonY+.3:top-.02,count=shape==='blazer'?2:shape==='coat'?3:open?4:6,x=open?opening(from)+.012:0;
  if(!open)patchOn(cloth,G,{t0:-.05,t1:.05,y0:T(hemY+.012),y1:T(top),thick:.0014,nu:2,nv:seg(12,4),col:tint(main,.93)});
  for(let i=0;i<count;i++){const y=mix(from,to,count>1?i/(count-1):0);stud(trim,G,open?thetaFor(opening(y)+.016,T(y)):0,T(y),shape==='denim'||shape==='workvest'?.0075:.006,shape==='denim'?rgb('#b08d57'):shadeOf(C.accent,.8),.0036);}}
 if(shape==='polo'||shape==='henley'){patchOn(cloth,G,{t0:-.045,t1:.045,y0:T(1.33),y1:T(top+.004),thick:.0016,nu:2,nv:4,col:shape==='polo'?accent:tint(main,.9)});for(let i=0;i<(shape==='polo'?2:3);i++)stud(trim,G,0,T(1.35+i*.034),.0052,tint(accent,.85),.003);}
 // Lapels: the folded-back front edge of a jacket, widest at the chest.
 if(open&&(shape==='blazer'||shape==='coat'||shape==='cardigan'))for(const s of[-1,1]){const nrm={x:0,y:0,z:0},lap=shape==='cardigan'?.022:.05;F.grid(cloth,3,seg(14,5),(uu,v,out)=>{const y=mix(buttonY+.01,1.43,v),o2=opening(y),xw=o2+lap*uu*Math.sin(Math.min(1,v*1.25)*Math.PI*.9+.15),theta=s*thetaFor(xw,T(y));G.at(theta,T(y),out);G.normal(theta,T(y),nrm);const h=.004+.004*Math.sin(uu*Math.PI);out.x+=nrm.x*h;out.y+=nrm.y*h;out.z+=nrm.z*h;out.col=tint(main,.9+.08*uu);},{reference:()=>[0,0,1]});}
 if(shape==='formal'||(shape==='blazer'&&a.id&&P.hash(a.id)%3===0)){const tie=part(rig.spine,'cotton',{tag:'tie'}),tc=shadeOf(C.accent,.7);patchOn(tie,G,{t0:-.11,t1:.11,y0:T(1.405),y1:T(1.44),thick:.006,nu:4,nv:3,col:tc});const nrm={x:0,y:0,z:0};F.grid(tie,4,seg(12,4),(uu,v,out)=>{const y=mix(open?buttonY+.02:1.0,1.41,v),down=1-v,full=down<.82?mix(.011,.025,down/.82):.025*(1-(down-.82)/.18),half=open?Math.min(full,Math.max(.004,opening(y)-.005)):full,x=(uu*2-1)*half,theta=Math.sign(x)*thetaFor(Math.abs(x),T(y));G.at(theta,T(y),out);G.normal(theta,T(y),nrm);const h=.0035+.002*Math.sin(uu*Math.PI);out.x+=nrm.x*h;out.z+=nrm.z*h;out.col=tint(tc,.9+.15*Math.sin(uu*Math.PI));},{reference:()=>[0,0,1]});}
 // Pockets and panels.
 const pocket=(t0,t1,y0,y1,col,flap,surf=G,sh=cloth)=>{const q={x:0,y:0,z:0},qn={x:0,y:0,z:0},along=list=>list.map(([t,y])=>{surf.at(t,T(y),q);surf.normal(t,T(y),qn);return[q.x+qn.x*.0016,q.y+qn.y*.0016,q.z+qn.z*.0016];});
  // A patch pocket lies almost flat: a faint change of tone, a stitched outline and, on jackets, a flap.
  patchOn(sh,surf,{t0,t1,y0:T(y0),y1:T(y1),thick:.001,lift:.0006,bevel:.08,nu:seg(8,4),nv:seg(6,4),col});
  if(buildLod<2)F.tube(sh,along([[t0,y1],[t0,y0+.01],[(t0+t1)/2,y0],[t1,y0+.01],[t1,y1]]),.0011,{sides:4,segments:seg(16,8),col:tint(col,.72)});
  if(flap)patchOn(sh,surf,{t0:t0-.01,t1:t1+.01,y0:T(y1-.012),y1:T(y1+.026),thick:.0022,bevel:.1,nu:seg(8,4),nv:4,col:tint(col,.92)});};
 if(shape==='shirt'||shape==='linen')pocket(-.62,-.3,1.21,1.31,tint(main,.95),false);
 if(shape==='denim'||shape==='workvest')for(const s of[-1,1])pocket(s>0?.3:-.66,s>0?.66:-.3,1.2,1.29,tint(main,.93),true);
 if(shape==='field')for(const s of[-1,1]){pocket(s>0?.3:-.68,s>0?.68:-.3,1.19,1.29,tint(main,.92),true);pocket(s>0?.32:-.78,s>0?.78:-.32,.9,1.02,tint(main,.92),true);}
 if(shape==='blazer'||shape==='coat')for(const s of[-1,1])patchOn(cloth,G,{t0:s>0?.42:-.82,t1:s>0?.82:-.42,y0:T(.955),y1:T(.985),thick:.004,nu:5,nv:2,col:tint(main,.9)});
 if(shape==='hoodie')patchOn(cloth,G,{t0:-.62,t1:.62,y0:T(.9),y1:T(1.04),thick:.007,nu:seg(10,4),nv:seg(6,3),col:tint(main,.95),bevel:.3});
 if(shape==='ziphood'||shape==='bomber'||shape==='rain'||shape==='track')for(const s of[-1,1])patchOn(cloth,G,{t0:s>0?.5:-.62,t1:s>0?.62:-.5,y0:T(.92),y1:T(1.05),thick:.0022,nu:2,nv:5,col:tint(main,.8)});
 if(shape==='workvest'){for(const y of[1.0,1.13])band(part(rig.spine,'plain',{roughness:.35,tag:'reflect'}),G,()=>T(y),()=>T(y+.035),{thick:.002,col:rgb('#d9dcd2')});}
 if(shape==='track')for(const s of[-1,1])patchOn(cloth,G,{t0:s*1.42,t1:s*1.58,y0:T(hemY+.05),y1:T(1.36),thick:.0018,nu:2,nv:8,col:accent});
 if(shape==='apron'){const ap=part(rig.spine,'canvas'),col=accent;patchOn(ap,G,{t0:-.62,t1:.62,y0:T(.80),y1:T(1.3),thick:.005,nu:seg(10,4),nv:seg(12,4),col,bevel:.12});patchOn(ap,G,{t0:-.3,t1:.3,y0:T(.9),y1:T(1.0),thick:.008,nu:5,nv:3,col:tint(col,.9)});band(ap,G,()=>T(1.02),()=>T(1.045),{thick:.004,col:tint(col,.85)});for(const s of[-1,1])patchOn(ap,G,{t0:s*.2,t1:s*.32,y0:T(1.3),y1:T(1.455),thick:.004,nu:2,nv:5,col:tint(col,.85)});}
 if(shape==='overall'){const bib=tint(main,.92);patchOn(cloth,G,{t0:-.5,t1:.5,y0:T(1.05),y1:T(1.3),thick:.005,nu:8,nv:6,col:bib});pocket(-.25,.25,1.13,1.23,tint(main,.86),true);for(const s of[-1,1]){patchOn(cloth,G,{t0:s*.26,t1:s*.42,y0:T(1.28),y1:T(1.44),thick:.005,nu:2,nv:6,col:bib});stud(metal,G,s*.34,T(1.29),.008,rgb('#b7a06a'),.006);}}
 // Hood: its bulk resting on the upper back, with a rolled edge round the neck and two cords.
 if(shape==='hoodie'||shape==='ziphood'||shape==='rain'){F.ellipsoid(cloth,0,T(1.455),-.082,.105,.07,.075,{nu:seg(18,8),nv:seg(10,5),col:tint(main,.94),warp:(x,y,z,w)=>{w[0]=x;w[1]=y*(y<0?.55:1);w[2]=z*(z>0?.45:1);}});F.tube(cloth,[[-.09,T(1.47),-.03],[-.085,T(1.455),.05],[-.04,T(1.425),.095],[0,T(1.41),.104],[.04,T(1.425),.095],[.085,T(1.455),.05],[.09,T(1.47),-.03]],.016,{sides:seg(8,4),segments:seg(18,6),col:tint(main,.9)});
  if(shape!=='rain')for(const s of[-1,1])F.tube(part(rig.spine,'cotton',{tag:'cord'}),[[s*.03,T(1.415),.106],[s*.034,T(1.34),.125],[s*.03,T(1.27),.128]],.0032,{sides:5,segments:6,col:tint(accent,.95)});}
 // Coats and tunics continue below the waist on the pelvis, open at the front for a coat.
 if(u.length>.6){const skirt=part(rig.pelvis,fabric),V=B.V,P2=B.pelvis.offset(.02),gap=shape==='coat'?.1:0;wrap(skirt,{at:(theta,y,out)=>{P2.at(theta,Math.max(y,V(.80)),out);if(y<V(.80)){const k=1+(V(.80)-y)*.5;out.x*=k;out.z*=k;out.y=y;}return out;},normal:P2.normal},{low:V(.56),high:V(.84),ease:(theta,y,p)=>.004+fold(theta,y,p)*1.4,rows:seg(12,4),sides:seg(30,10),col:(theta,y,p)=>colour(theta,y+PELVIS_Y-SPINE_Y,p)});}
 // Sleeves, then whatever arm is left bare.
 for(const side of[-1,1]){const label=side<0?'L':'R',armS=B.arm(side),foreS=B.forearm(side),shortEnd=-u.sleeve*.75,full=u.sleeve>=.45,armEnd=sleeveless?null:u.sleeve<.25?shortEnd:-.282,foreEnd=u.sleeve<.285?null:full?-.248:-(u.sleeve-.28)*2.4-.02;
  const sleeveCol=(theta,y,p)=>{let c=main;if(shape==='track'&&Math.abs(Math.sin(theta)*side-1)<.06)c=accent;if(pattern==='panel')c=accent;if(shape==='workvest'||shape==='apron'||shape==='overall')c=shape==='overall'?main:blend(accent,rgb('#d8d4ca'),.4);const cr=.9+.1*F.fbm3(p.x*9+3,p.y*9,p.z*9,2);return[c[0]*cr,c[1]*cr,c[2]*cr];};
  const underSleeve=shape==='workvest'||shape==='apron'?.19*.75:null,armCloth=shape==='workvest'||shape==='apron'?part(rig['arm'+label],'jersey'):cut(rig['arm'+label]),end=underSleeve?-underSleeve:armEnd;
  if(end!==null){F.loft(armCloth,armS.offset((theta,y)=>se*(.55+.45*smooth(.0,-.07,y))+.003*gauss(y,-.27,.04)),{sides:seg(18,6),rows:seg(12,4),from:ARM_TOP,to:end,capStart:'round',capStartHeight:ARM_CAP+se*.4,capEnd:end<=-.28?'round':null,col:sleeveCol});if(end>-.27)band(armCloth,armS.offset(se),()=>end-.002,()=>end+.014,{thick:.002,sides:seg(18,6),col:(theta,y,p)=>tint(sleeveCol(theta,y,p),.88)});}
  buildArmSkin(rig,B,H,side,label,end===null?ARM_TOP:end+.012,-.282);
  if(foreEnd!==null&&end!==null&&end<=-.28){const foreCloth=part(rig['forearm'+label],fabric),fs=foreS.offset((theta,y)=>se+.004*gauss(y,0,.045));F.loft(foreCloth,fs,{sides:seg(16,6),rows:seg(10,3),from:0,to:foreEnd,capStart:'round',col:sleeveCol});
   const cuffKnit=['bomber','hoodie','ziphood','sweater','cardigan','track'].includes(shape);band(cuffKnit?part(rig['forearm'+label],'knit'):foreCloth,foreS.offset(se),()=>foreEnd-.002,()=>foreEnd+(cuffKnit?.04:.03),{thick:cuffKnit?.004:.0024,sides:seg(16,6),col:cuffKnit?ribCol:tint(main,.88)});
   if(['shirt','formal','blazer','coat','denim'].includes(shape)&&full)stud(part(rig['forearm'+label],'plain',{roughness:.5,tag:'button'}),foreS.offset(se),side*1.4,foreEnd+.014,.0045,shadeOf(C.accent,.8),.0034);
   if((shape==='blazer'||shape==='coat')&&full)band(part(rig['forearm'+label],'cotton'),foreS.offset(.004),()=>-.262,()=>-.244,{thick:.002,sides:seg(14,6),col:inner});
   buildForearmSkin(rig,B,H,side,label,foreEnd+.01);}
  else buildForearmSkin(rig,B,H,side,label,0);
 }
 return{ease,G,fabric,main,accent,cloth,hemY,se,buttonY,thetaFor,opening:open?opening:null};
}

// ---- bottoms ----
function buildBottom(rig,a,M,B,H,C){
 if(a.swim&&M.fem&&!M.child)return buildSwimBottom(rig,a,M,B,H,C);
 const lo=P.lowers[a.lower],shape=lo.shape,gown=isGown(a,M),fabric=gown?'jersey':LOWER_FABRIC[shape]||'cotton',main=rgb(C.lower),accent=rgb(C.lowerAccent),over=catalogPick(a.cosmeticBottom)?.v===3,cut=LEG_CUT[shape]||LEG_CUT.straight,hemR=cut[0]*(over?1.24:1),room=cut[1]+(over?.012:0),legs={},V=B.V,pel=gown?part(rig.pelvis,fabric,GOWN):part(rig.pelvis,fabric),short=lo.length<.6,skirt=shape==='skirt';
 // The pelvis carries only the waist of the garment; the seat belongs to the thighs (see bodySurfaces).
 const worn=shape==='straight'||shape==='taper'?(p)=>.86+.16*F.fbm3(p.x*7,p.y*5,p.z*7,2):p=>.92+.08*F.fbm3(p.x*8,p.y*8,p.z*8,2),col=(theta,y,p)=>tint(main,worn(p)),PS=gown?B.pelvis.offset((theta,y)=>mix(.009+room*.6,.0088,smooth(V(.98),V(1.07),y))):B.pelvis.offset(.009+room*.6);
 F.loft(pel,PS,{sides:seg(28,10),rows:seg(8,3),from:V(.855),to:V(1.07),col});
 // Waistband, belt loops and, on smarter cuts, a belt.
 const top=V(1.035);band(pel,PS,()=>top-.03,()=>top+.008,{thick:.0028,col:(theta,y,p)=>tint(col(theta,y,p),.9)});
 const belted=['chino','formal','cargo','straight'].includes(shape)&&P.hash('belt'+a.id)%3!==0;
 if(belted){const leather=part(rig.pelvis,'leather'),bc=rgb(P.hash('beltc'+a.id)%2?'#2a211c':'#5a3b25');band(leather,PS,()=>top-.026,()=>top+.002,{thick:.0058,col:bc});patchOn(part(rig.pelvis,'plain',{metalness:.8,roughness:.3,tag:'trim'}),PS,{t0:-.1,t1:.1,y0:top-.03,y1:top+.006,thick:.0085,nu:3,nv:3,col:rgb('#b9b3a0')});}
 else if(shape==='jogger'||shape==='sport'||shape==='track')for(const s of[-1,1])F.tube(part(rig.pelvis,'cotton',{tag:'cord'}),[[s*.012,top-.012,PS.at(0,top-.012,{}).z+.004],[s*.02,top-.06,PS.at(0,top-.06,{}).z+.008],[s*.016,top-.1,PS.at(0,top-.1,{}).z+.006]],.003,{sides:5,segments:6,col:tint(accent,.95)});
 if(!skirt&&shape!=='sport'&&shape!=='jogger'&&shape!=='track')for(const t of[-.7,.7,-2.3,2.3,Math.PI])patchOn(pel,PS,{t0:t-.04,t1:t+.04,y0:top-.032,y1:top+.012,thick:.0055,nu:2,nv:3,col:tint(main,.82)});
 // Fly and pockets.
 if(!skirt){patchOn(pel,PS,{t0:-.035,t1:.035,y0:V(.86),y1:top-.03,thick:.0018,nu:2,nv:5,col:tint(main,.84)});for(const s of[-1,1]){const nrm={x:0,y:0,z:0};F.tube(pel,[0,.33,.66,1].map(t=>{const theta=s*mix(.5,1.25,t),y=mix(top-.034,top-.115,Math.pow(t,1.6)),p={x:0,y:0,z:0};PS.at(theta,y,p);PS.normal(theta,y,nrm);return[p.x+nrm.x*.0016,p.y,p.z+nrm.z*.0016];}),.0026,{sides:5,segments:8,col:tint(main,.7)});
   if(!['formal','jogger','track','sport'].includes(shape))patchOn(pel,PS,{t0:s>0?2.2:-2.95,t1:s>0?2.95:-2.2,y0:V(.875),y1:V(.975),thick:.0028,nu:seg(6,3),nv:seg(5,3),col:tint(main,.92)});}}
 if(skirt){/* V3.7: the skirt hangs from its own bone at hip height, so it can swing forward over the lap when the wearer sits. */const hipY=-.015,node=rig.skirt=group(rig.pelvis,'skirt',0,hipY,0),flare=part(node,fabric,{...(gown?GOWN:{}),side:THREE.DoubleSide,tag:gown?'gown-skirt':'skirt'}),spread=gown?.32:.85,nrm={x:0,y:0,z:0};wrap(flare,{at:(theta,y,out)=>{PS.at(theta,V(.86),out);const k=1+(V(.86)-y)*spread+.012*Math.sin(theta*14);out.x*=k;out.z*=k;out.y=y-hipY;return out;},normal:(theta,y,out)=>{out.x=Math.sin(theta);out.y=.35;out.z=Math.cos(theta);return out;}},{low:V(.50),high:V(.87),ease:.002,rows:seg(12,4),sides:seg(42,12),col:(theta,y,p)=>tint(main,(.85+.2*Math.abs(Math.sin(theta*7)))*worn(p))});}
 for(const side of[-1,1]){const label=side<0?'L':'R',thighS=B.thigh(side),calfS=B.calf(side),thigh=part(rig['thigh'+label],fabric),legCol=(theta,y,p)=>{let c=main;if((shape==='track')&&Math.abs(Math.sin(theta)*side-1)<.05)c=accent;return tint(c,worn(p));};
  legs[label]={side};if(skirt){buildThighSkin(rig,B,H,side,label,-.06,-.40);buildCalfSkin(rig,B,H,side,label,0);continue;}
  const clothEnd=short?-.40*lo.length*1.7*.92:-.412,ts=thighS.offset((theta,y)=>room*smooth(.03,-.1,y)+.006+(short?.01*smooth(-.1,clothEnd,y):0)+.004*gauss(y,-.39,.05));
  F.loft(thigh,ts,{sides:seg(20,6),rows:seg(14,4),from:THIGH_TOP,to:clothEnd,capStart:'round',capStartHeight:.03,capEnd:short?null:'round',col:legCol});Object.assign(legs[label],{ts,thigh,clothEnd});
  if(shape==='cargo'){patchOn(thigh,ts,{t0:side*1.15,t1:side*1.95,y0:-.27,y1:-.14,thick:.009,nu:5,nv:5,col:tint(main,.93),bevel:.2});patchOn(thigh,ts,{t0:side*1.1,t1:side*2.0,y0:-.155,y1:-.115,thick:.012,nu:5,nv:2,col:tint(main,.86)});}
  if(short){band(thigh,ts,()=>clothEnd-.002,()=>clothEnd+.016,{thick:.002,sides:seg(18,6),col:(theta,y,p)=>tint(legCol(theta,y,p),.88)});buildThighSkin(rig,B,H,side,label,clothEnd+.014,-.40);buildCalfSkin(rig,B,H,side,label,0);continue;}
  // Below the knee the leg hangs to its cut rather than following the calf.
  const hem=lo.length<.9?-.27:-.352,knee=M.thigh*.66+room+.006,calf=part(rig['calf'+label],fabric),tube=F.surface([{y:.03,a:knee,f:knee*1.04,k:knee*.98},{y:-.06,a:mix(knee,hemR,.25)+.004,f:mix(knee,hemR,.25)+.002,k:mix(knee,hemR,.3)+.008},{y:-.18,a:mix(knee,hemR,.7),f:mix(knee,hemR,.7),k:mix(knee,hemR,.72)+.004,z:.004},{y:hem+.03,a:hemR,f:hemR*1.08,k:hemR*.98,z:.008},{y:hem,a:hemR,f:hemR*1.1,k:hemR*.98,z:.01}]);
  wrap(calf,tube,{low:hem,high:.03,ease:(theta,y,p)=>.004*F.fbm3(p.x*16,p.y*30+side,p.z*16,2)*smooth(-.05,hem,y),rows:seg(12,4),sides:seg(18,6),col:legCol});
  F.loft(calf,tube,{sides:seg(18,6),rows:1,from:.03,to:.028,capEnd:'round',capEndHeight:knee*.8,col:legCol});
  if(shape==='jogger')band(part(rig['calf'+label],'knit'),tube,()=>hem-.002,()=>hem+.05,{thick:.004,sides:seg(18,6),col:tint(main,.84)});else band(calf,tube,()=>hem-.002,()=>hem+.018,{thick:.002,sides:seg(18,6),col:(theta,y,p)=>tint(legCol(theta,y,p),.86)});
  if(shape==='formal')for(const t of[0,Math.PI])patchOn(calf,tube,{t0:t-.03,t1:t+.03,y0:hem+.02,y1:0,thick:.0016,nu:2,nv:6,col:tint(main,1.1)});
  if(hem>-.3)buildCalfSkin(rig,B,H,side,label,hem+.012);Object.assign(legs[label],{tube,calf,hem});
 }
 return{legs,PS,main,accent,shape,fabric,V,top};
}


// ---- accessories ----
function buildAccessories(rig,a,M,B,H,C,top){
 const id=a.accessory,head=rig.head,accent=rgb(C.accent),dark=rgb('#22262b'),p={x:0,y:0,z:0};
 if(id===1||id===2){const frame=part(head,'plain',{roughness:.4,tag:'frame'}),lens=part(head,'plain',id===2?{roughness:.08,tag:'shade'}:{roughness:.05,transparent:true,opacity:.22,tag:'lens'}),y=H.eye.y+.001,z=H.eye.z+H.eye.r+.009,fc=id===2?dark:rgb('#3a2f28');
  for(const s of[-1,1]){const cx=s*H.eye.x;F.tube(frame,Array.from({length:9},(_,i)=>{const t=i/8*TAU;return[cx+Math.cos(t)*.0225,y+Math.sin(t)*.0165,z-Math.abs(Math.cos(t))*.002];}),.0016,{sides:5,segments:18,closed:true,col:fc});F.ellipsoid(lens,cx,y,z-.0005,.0215,.0155,.0012,{nu:seg(12,6),nv:4,col:id===2?rgb('#15181c'):rgb('#cfe0e6')});
   F.tube(frame,[[s*(H.eye.x+.0225),y+.004,z],[s*(H.halfWidth+.004),y+.006,z-.03],[s*(H.halfWidth+.003),y+.002,z-.085],[s*(H.halfWidth-.002),y-.012,z-.105]],.0016,{sides:5,segments:8,col:fc});}
  F.tube(frame,[[-H.eye.x+.0225,y+.005,z],[0,y+.008,z+.003],[H.eye.x-.0225,y+.005,z]],.0016,{sides:5,segments:5,col:fc});}
 if(id===10){const w=part(rig.forearmL,'plain',{metalness:.7,roughness:.3,tag:'trim'}),fs=B.forearm(-1).offset(.003);band(part(rig.forearmL,'leather'),fs,()=>-.238,()=>-.218,{thick:.0025,sides:seg(14,6),col:rgb('#2b2420')});const q={x:0,y:0,z:0};fs.at(-Math.PI/2,-.228,q);F.ellipsoid(w,q.x-.004,q.y,q.z,.005,.014,.014,{nu:seg(12,6),nv:5,col:rgb('#c9ccce')});F.ellipsoid(part(rig.forearmL,'plain',{roughness:.2,tag:'face'}),q.x-.0075,q.y,q.z,.002,.0105,.0105,{nu:seg(10,6),nv:4,col:rgb('#15191d')});}
 if(id===11){const band2=part(head,'plain',{roughness:.45,tag:'frame'}),cup=part(head,'leather'),r=H.halfWidth+.012;F.tube(band2,[[-r,H.yOf(.13),-.012],[-r*.92,H.yOf(.215),-.012],[0,H.yOf(.262),-.012],[r*.92,H.yOf(.215),-.012],[r,H.yOf(.13),-.012]],[.011,.004],{sides:6,segments:seg(16,6),col:dark});for(const s of[-1,1]){F.ellipsoid(cup,s*(H.halfWidth+.012),H.yOf(.122),-.012,.016,.036,.03,{nu:seg(12,6),nv:seg(8,4),col:dark});F.ellipsoid(band2,s*(H.halfWidth+.024),H.yOf(.122),-.012,.006,.026,.022,{nu:seg(10,6),nv:4,col:accent});}}
 if(id===9){const sc=part(rig.neck,'knit');F.tube(sc,Array.from({length:9},(_,i)=>{const t=i/8*TAU;return[Math.sin(t)*(M.neck+.022),-.028+.012*Math.cos(t*2),Math.cos(t)*(M.neck+.024)+.004];}),[.03,.019],{sides:seg(10,5),segments:seg(22,8),closed:true,col:(t,uu)=>tint(accent,.85+.2*Math.abs(Math.sin(uu*14)))});const G=top.G,nrm={x:0,y:0,z:0};F.grid(part(rig.spine,'knit'),3,seg(10,4),(uu,v,out)=>{const y=mix(1.19,1.42,v),theta=.12+uu*.24;G.at(theta,B.T(y),out);G.normal(theta,B.T(y),nrm);const h=.008+.004*Math.sin(uu*Math.PI);out.x+=nrm.x*h;out.z+=nrm.z*h;out.col=tint(accent,.85+.2*Math.abs(Math.sin(y*90)));},{reference:()=>[0,0,1]});}
 if(id===6){const bag=part(rig.spine,'canvas'),strap=part(rig.spine,'nylon'),G=top.G,q={x:0,y:0,z:0};F.roundBox(bag,0,B.T(1.2),-.175,.27,.36,.13,.045,{segments:3,col:(x,y,z)=>tint(accent,.86+.14*F.noise3(x*20,y*20,z*20))});F.roundBox(bag,0,B.T(1.12),-.245,.2,.15,.04,.02,{segments:2,col:tint(accent,.78)});
  for(const s of[-1,1])F.tube(strap,[[s*.1,B.T(1.36),-.11],[s*.125,B.T(1.43),-.03],[s*.12,B.T(1.39),.085],[s*.125,B.T(1.2),.118],[s*.13,B.T(1.06),.04],[s*.11,B.T(1.04),-.1]],[.02,.005],{sides:6,segments:seg(18,6),col:dark});}
 if(id===7){const bag=part(rig.pelvis,'leather'),strap=part(rig.spine,'leather');F.roundBox(bag,.2,.09,.05,.07,.2,.17,.025,{segments:3,col:tint(accent,.9)});F.roundBox(bag,.238,.12,.05,.012,.09,.15,.006,{segments:2,col:tint(accent,.75)});F.tube(strap,[[.17,B.T(1.0),.07],[.1,B.T(1.2),.125],[-.08,B.T(1.4),.075],[-.14,B.T(1.44),-.02],[-.06,B.T(1.3),-.11],[.14,B.T(1.02),-.07]],[.013,.004],{sides:6,segments:seg(20,6),col:dark});}
 if(id===8){const g=group(rig.handL,'handbag',0,-.19,0),bag=part(g,'leather');F.roundBox(bag,0,-.08,0,.2,.16,.085,.03,{segments:3,col:tint(accent,.92)});F.tube(bag,[[-.06,-.01,0],[-.05,.1,0],[.05,.1,0],[.06,-.01,0]],.007,{sides:6,segments:10,col:dark});patchOn(part(g,'plain',{metalness:.8,roughness:.3,tag:'trim'}),F.surface([{y:-.04,a:.1,f:.043},{y:0,a:.1,f:.043}]),{t0:-.2,t1:.2,y0:-.03,y1:-.01,thick:.004,nu:3,nv:2,col:rgb('#c9b98a')});}
 if(id===12){const cam=part(rig.chest,'plain',{roughness:.5,tag:'frame'}),G=top.G;F.roundBox(cam,0,.05,.172,.1,.068,.05,.012,{segments:2,col:dark});F.lathe(cam,[[.0,.0],[.026,.0],[.027,.03],[.022,.034],[0,.034]],{sides:seg(14,6),col:rgb('#30353b'),smooth:false});const from=cam.count-1;cam.warp(cam.count-(seg(14,6)*5+2),(x,y,z,out)=>{out[0]=x;out[1]=.05+z;out[2]=.197+y;});F.tube(part(rig.chest,'nylon'),[[-.045,.07,.16],[-.09,.32,.1],[-.07,.36,-.04],[.07,.36,-.04],[.09,.32,.1],[.045,.07,.16]],[.007,.002],{sides:5,segments:seg(18,6),col:dark});}
}
function dress(rig,a,M,B,H){
 const C=clothColours(a);rig.clothMotion=[];const bottom=buildBottom(rig,a,M,B,H,C),top=buildTop(rig,a,M,B,H,C);buildShoes(rig,a,M,B,H,C);buildAccessories(rig,a,M,B,H,C,top);buildHat(rig,a,M,B,H,C);
 decorateTop(rig,a,M,B,H,C,top);decorateBottom(rig,a,M,B,H,C,bottom,top);buildArmor(rig,a,M,B,H,top);rig.garment=top;
}
// ---- things people hold ----------------------------------------------------------------
// Hand props sit on the palm side of the hand (the hand's -z), so the fingers close around them.
const MATTE=['plain',{roughness:.8,tag:'matte'}],GLOSS=['plain',{roughness:.3,tag:'gloss'}],METAL=['plain',{metalness:.78,roughness:.3,tag:'metal'}];
// The phone is modelled about its own centre (long side up, screen toward -z) and then placed for the grip:
// it lies across the fingers with its top toward the index finger, its back on the fingers and palm, so the
// fingers wrap its far long edge and the thumb comes round the near one. PHONE is in the hand's own space.
const PHONE={x:-.0195,y:-.092,z:-.0203,w:.0712,h:.149,t:.0086};
function phoneModel(parent){
 const node=group(parent,'phone-body',PHONE.x,PHONE.y,PHONE.z);node.rotation.z=Math.PI/2;
 const body=part(node,...METAL),glass=part(node,'plain',{roughness:.08,tag:'screen',emissive:'#1b2c3c',emissiveIntensity:.55});
 F.roundBox(body,0,0,0,PHONE.w,PHONE.h,PHONE.t,.0042,{segments:3,col:rgb('#2a2e34')});F.roundBox(glass,0,0,-.0041,.0668,.1444,.0012,.0006,{segments:2,col:(x,y)=>{const t=F.noise3(x*90,y*40,3.3);return y>.046?rgb('#3f6d86'):y>-.018?(Math.floor((y+.018)/.016)%2?[.11,.16,.2]:[.16,.23,.29]):[.07+.05*t,.1+.06*t,.13+.07*t];}});
 // Camera bump and lenses on the back, buttons on the edge.
 F.roundBox(body,-.016,.052,.0052,.03,.032,.0022,.001,{segments:2,col:rgb('#22262b')});for(const[dx,dy]of[[-.022,.059],[-.01,.059],[-.016,.046]])F.ellipsoid(part(node,...GLOSS),dx,dy,.0066,.0052,.0052,.0012,{nu:seg(10,6),nv:4,col:rgb('#0c0e11')});
 F.roundBox(body,.0362,.022,0,.0014,.022,.004,.0006,{segments:1,col:rgb('#3a3f46')});F.roundBox(body,-.0362,.032,0,.0014,.012,.004,.0006,{segments:1,col:rgb('#3a3f46')});
}
// The grip: while a phone is held the hand's own straight fingers are put away and these are shown instead.
// Each finger leaves its knuckle, runs along the back of the phone, turns round the far edge and ends on the
// front, keeping its own length, so a short little finger only reaches the edge. The thumb comes round the near
// edge and rests along it. Nothing passes through the phone.
function phoneGrip(rig,node){
 const info=rig.handInfo?.R;if(!info)return;const s=info.scale,skin=part(node,'skin'),yR=PHONE.y-PHONE.w/2,yL=PHONE.y+PHONE.w/2,zb=PHONE.z+PHONE.t/2,zf=PHONE.z-PHONE.t/2,lengths=[.070,.079,.073,.056],radii=[.0092,.0095,.0090,.0080];
 for(let i=0;i<4;i++){const x=(-.0305+i*.0203)*s,L=lengths[i]*s*1.04,r=radii[i]*s,z1=zb+r+.0006,R=PHONE.t/2+r+.0006,path=[[x,-.084*s,0],[x,-.097*s,-.002],[x,Math.min(-.104*s,yR+.012),z1],[x,yR+.002,z1]];
  for(let k=1;k<=8;k++){const f=k/8*Math.PI;path.push([x,yR-Math.sin(f)*R,PHONE.z+Math.cos(f)*R]);}path.push([x,yR+.012,PHONE.z-R],[x,yR+.03,PHONE.z-R]);
  const pts=[path[0]];let run=0;for(let k=1;k<path.length;k++){const a=path[k-1],b=path[k],d=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);if(run+d>=L){const t=(L-run)/d;pts.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]);break;}run+=d;pts.push(b);}
  F.tube(skin,pts,t=>r*(1-.18*t)*(1+.07*gauss(t,.42,.07)+.05*gauss(t,.74,.06)),{sides:seg(9,5),segments:seg(26,10),col:(t,u,p)=>(Math.abs(t-.42)<.06||Math.abs(t-.74)<.045?info.knuckle:info.tone)(0,0,p)});}
 const tr=.0102*s,thumb=[[-.034*s,-.028*s,-.003],[-.041*s,yL+.0125,-.011],[-.051*s,yL+tr+.0008,PHONE.z+.001],[-.064*s,yL+tr-.0005,zf-.0005],[-.075*s,yL+tr-.003,zf-.004]];
 F.tube(skin,thumb,t=>tr*(1.12-.3*t),{sides:seg(9,5),segments:seg(20,8),col:(t,u,p)=>(Math.abs(t-.55)<.07?info.knuckle:info.tone)(0,0,p)});
}

// ---- shoes -------------------------------------------------------------------------------
// [z, half-width, top] rows from heel to toe for each last; the floor of the upper is the top of the sole.
const LASTS={
 sneaker:[[-.079,.029,.004],[-.05,.0355,.006],[-.005,.0385,.0],[.045,.0435,-.02],[.098,.0485,-.036],[.142,.047,-.045],[.170,.039,-.05]],
 dress:[[-.079,.0275,.0],[-.05,.033,.002],[-.005,.0355,-.006],[.045,.040,-.026],[.098,.044,-.04],[.145,.039,-.05],[.176,.027,-.056]],
 boot:[[-.08,.031,.01],[-.05,.037,.012],[-.005,.040,.008],[.045,.045,-.014],[.098,.050,-.03],[.142,.049,-.04],[.170,.042,-.046]],
 point:[[-.079,.0275,.0],[-.05,.033,.002],[-.005,.0355,-.006],[.045,.040,-.024],[.098,.041,-.038],[.15,.031,-.05],[.192,.013,-.057]]
};
// Catalogue footwear families 8-25: the basic construction each one uses and what is special about it.
const SHOE_FAMILY={8:{type:'high-top',sole:.03,kind:'court'},9:{type:'high-top',shaft:.15,sole:.016,nolace:true},10:{type:'ankle-boot',nolace:true,kind:'chelsea'},11:{type:'leather-shoe',sole:.04},12:{type:'special',kind:'duck'},13:{type:'leather-shoe',kind:'clown'},14:{type:'ankle-boot',shaft:.2,metal:true,nolace:true,kind:'plate'},15:{type:'special',kind:'robot'},16:{type:'work-boot',shaft:.17,sole:.036,nolace:true,kind:'space'},17:{type:'special',kind:'dino'},18:{type:'special',kind:'chicken'},19:{type:'ankle-boot',shaft:.27,nolace:true,kind:'cuff'},20:{type:'loafer',kind:'wizard'},21:{type:'ankle-boot',shaft:.24,heel:.02,nolace:true,pointed:true,kind:'western'},22:{type:'runner',sole:.034,kind:'trail'},23:{type:'leather-shoe',kind:'brogue',heel:.016},24:{type:'runner',nolace:true,kind:'future'},25:{type:'high-top',sole:.034,kind:'roller'}};
const SHOE_TONE={'canvas-low':'#e8e4d8','runner':'#3b4047','leather-shoe':'#3a2a20','ankle-boot':'#4a3526','work-boot':'#9a6b3a','loafer':'#5a3a26','sandal':'#6b4a34','high-top':'#22252b',special:'#46505f'};
function buildShoes(rig,a,M,B,H,C){
 const cat=catalogPick(a.cosmeticShoe),fam=cat&&SHOE_FAMILY[cat.f]||{},type=fam.type||P.footwear[a.shoe].name,v=cat?cat.v:0,kind=fam.kind;
 const pal=rgb(C.shoe||SHOE_TONE[type]),accent=rgb(C.shoeAccent),gold=rgb('#d9b24a'),dark=rgb('#22262b'),white=rgb('#ece8dd'),steel=rgb('#a4acb0'),lower=P.lowers[a.lower],covered=lower.length>=.9&&lower.shape!=='skirt',fine=buildLod<2;
 for(const side of[-1,1]){const label=side<0?'L':'R',bone=rig['foot'+label],calfN=rig['calf'+label],foot=v===3?group(bone,'big-shoe',0,SOLE*-.12,0):bone;if(v===3)foot.scale.setScalar(1.12);
  /* V4.1: beach-goers go barefoot, with the modelled foot and toes. */
  if(a.barefoot){buildBareFoot(rig,H,M,side,label);continue;}
  const cuff=F.surface([{y:-.02,a:.04,f:.044,k:.042,z:-.006},{y:.04,a:.043,f:.045,k:.045,z:-.004}]);
  // The part of a tall boot that belongs to the lower leg. Under long trousers it stops below the calf.
  const shaftUp=(height,spec,colour,ease=.008)=>{const h=covered?Math.min(height,.12):height,surf=B.calf(side).offset(ease),sh=part(calfN,...spec);F.loft(sh,surf,{sides:seg(16,6),rows:seg(8,3),from:-.392,to:-.39+h,col:colour});band(sh,surf,()=>-.39+h-.014,()=>-.39+h+.002,{thick:.0035,sides:seg(16,6),col:(theta,y,pt)=>tint(colour(theta,y,pt),.8)});return{surf,top:-.39+h,shape:sh};};
  if(type==='special'){
   if(kind==='duck'){const web=part(foot,...MATTE),yellow=rgb('#e7b849');
    lengthwise(web,[[-.08,.03,-.02,SOLE],[-.03,.04,-.012,SOLE],[.05,.058,-.034,SOLE],[.13,.086,-.05,SOLE],[.2,.092,-.056,SOLE],[.228,.06,-.058,SOLE]],{floor:SOLE,col:(x,y,z)=>tint(yellow,.88+.12*F.noise3(x*40,y*40,z*40)),heel:.008,toe:.01});
    for(const k of[-1,0,1])F.tube(web,[[k*.012,-.03,.04],[k*.04,-.046,.13],[k*.066,-.052,.215]],t=>.012*(1-.4*t),{sides:6,segments:6,col:tint(yellow,.8)});
    band(part(foot,'fur'),cuff,()=>-.012,()=>.02,{thick:.008,sides:seg(16,6),col:white});}
   else if(kind==='robot'){const m=part(foot,...METAL),tone=rgb('#879a9d'),shine=(theta,y,pt)=>tint(tone,.9+.1*F.noise3(pt.x*30,pt.y*30,pt.z*30));
    F.roundBox(m,0,SOLE+.046,.045,.108,.076,.262,.014,{segments:2,col:(x,y,z)=>tint(tone,.9+.1*F.noise3(x*30,y*30,z*30))});F.roundBox(part(foot,'rubber'),0,SOLE+.009,.045,.114,.018,.27,.006,{segments:1,col:dark});
    F.roundBox(part(foot,...GLOW),0,SOLE+.05,.178,.06,.012,.004,.002,{segments:1,col:rgb('#7edbe9')});const up=shaftUp(.2,METAL,shine,.016);band(up.shape,up.surf,()=>-.33,()=>-.31,{thick:.003,sides:seg(16,6),col:rgb('#20262c')});}
   else{const dino=kind==='dino',skin=part(foot,dino?'fur':'leather'),tone=dino?rgb('#6f9a56'):rgb('#e2a544'),claw=dino?white:rgb('#3a2f28'),r0=dino?.019:.0095,len=dino?.2:.235,nail=part(foot,...MATTE);
    lengthwise(skin,[[-.074,.032,.0,SOLE],[-.02,.042,.002,SOLE],[.05,dino?.05:.04,-.022,SOLE],[.1,dino?.046:.03,-.04,SOLE]],{floor:SOLE,col:(x,y,z)=>tint(tone,.88+.14*F.noise3(x*40,y*40,z*40)),heel:.01,toe:.02});
    for(const k of[-1,0,1]){const tipX=k*(dino?.05:.062),tipZ=len-Math.abs(k)*.022;F.tube(skin,[[k*.02,SOLE+.03,.07],[tipX*.7,SOLE+r0+.004,(tipZ+.07)/2+.01],[tipX,SOLE+r0,tipZ]],t=>r0*(1-.25*t),{sides:6,segments:6,col:tint(tone,.92)});placed(nail,mat4(tipX,SOLE+r0,tipZ,Math.PI/2-.25,0,-k*.25),()=>cone(nail,r0*.75,dino?.03:.022,claw,6));}
    if(!dino)F.tube(skin,[[0,SOLE+.03,-.04],[0,SOLE+r0+.002,-.1]],r0,{sides:6,segments:3,col:tint(tone,.92)});
    band(skin,cuff,()=>-.014,()=>.03,{thick:dino?.01:.004,sides:seg(16,6),col:tint(tone,.9)});}
   continue;}
  if(type==='sandal'){buildBareFoot(rig,H,M,side,label);const sole=part(foot,'rubber'),strap=part(foot,'leather');lengthwise(sole,[[-.083,.031,SOLE+.014,SOLE-.004],[-.04,.037,SOLE+.014,SOLE-.004],[.05,.045,SOLE+.012,SOLE-.004],[.12,.05,SOLE+.011,SOLE-.004],[.174,.04,SOLE+.011,SOLE-.004]],{col:()=>tint(pal,.7),heel:.006,toe:.008});
   for(const z of[.03,.105])F.tube(strap,[[-.047,SOLE+.008,z],[-.036,-.02-(z>.1?.022:0),z+.004],[0,-.008-(z>.1?.03:0),z+.006],[.036,-.02-(z>.1?.022:0),z+.004],[.047,SOLE+.008,z]],[.0085,.0028],{sides:6,segments:seg(12,5),col:pal});continue;}
  const sporty=['canvas-low','runner','high-top'].includes(type),boot=type==='ankle-boot'||type==='work-boot',last=LASTS[fam.pointed?'point':sporty?'sneaker':boot?'boot':'dress'],soleT=fam.sole??(type==='work-boot'?.03:type==='runner'?.028:sporty?.022:boot?.022:.012),heelT=fam.heel??(sporty?0:type==='loafer'?.008:.012),floor=SOLE+soleT;
  const upperSpec=fam.metal?METAL:sporty?[type==='runner'?'nylon':'canvas']:['leather',{roughness:kind==='brogue'?.2:type==='work-boot'?.62:.34}],upper=part(foot,...upperSpec),sole=part(foot,'rubber'),tone=fam.metal?steel:pal,grain=(theta,y,pt)=>tint(tone,.93+.07*F.noise3(pt.x*60,pt.y*60,pt.z*60));
  // The upper: toe cap and heel counter take the accent or a deeper tone.
  const capZ=type==='canvas-low'||type==='high-top'?.128:type==='work-boot'?.115:99,upperCol=(x,y,z)=>{let c=tone;if(z>capZ)c=type==='work-boot'?tint(tone,.78):rgb('#e9e6dc');else if(z<-.05&&sporty)c=tint(tone,.82);if(type==='runner'&&Math.abs(y-(floor+.022+z*.08))<.006&&z>-.04&&z<.11)c=accent;if(kind==='court'&&z<.03&&z>-.05&&y>floor+.016)c=accent;return tint(c,.93+.07*F.noise3(x*60,y*60,z*60));};
  lengthwise(upper,last.map((r,i)=>[r[0],r[1],Math.max(r[2]+(type==='loafer'?-.004:0),floor+(i===last.length-1?.018:.026)),floor-.004,2.3]),{floor:floor-.004,col:upperCol,toe:type==='leather-shoe'||type==='loafer'||fam.pointed?.02:.016});
  // Sole: a tread layer and, on trainers, a paler midsole above it. Heeled shoes lift at the back.
  const soleRow=(z,w)=>[z,w+.003,floor+.001,SOLE+(heelT&&z>-.02?heelT:0)],soleCol=sporty?(x,y,z)=>y>SOLE+.008?rgb(type==='runner'?'#e3e1da':'#eceae2'):rgb('#3a3b3d'):()=>rgb(type==='work-boot'?'#2c2a27':'#2a2320');
  lengthwise(sole,last.map(r=>soleRow(r[0],r[1])),{floor:SOLE,col:soleCol,heel:.008,toe:.012,sides:seg(18,6)});
  if(heelT)lengthwise(sole,[[-.084,.029,SOLE+heelT+.002,SOLE],[-.05,.034,SOLE+heelT+.002,SOLE],[-.022,.034,SOLE+heelT+.002,SOLE]],{floor:SOLE,col:soleCol,heel:.006,toe:.003,sides:seg(12,6),rows:3});
  // Ankle: boots and high-tops rise up the leg, other shoes get a padded collar.
  const shaft=boot||type==='high-top'?(type==='work-boot'?.115:type==='ankle-boot'?.09:.075):0,ankle=F.surface([{y:-.03,a:.034,f:.042,k:.04,z:-.008},{y:.02,a:.037,f:.04,k:.041,z:-.006},{y:shaft||.03,a:.041,f:.043,k:.044,z:-.004}]);
  if(shaft){F.loft(upper,ankle,{sides:seg(16,6),rows:seg(6,3),from:-.03,to:shaft,col:(theta,y,p)=>upperCol(p.x,p.y,p.z)});band(upper,ankle,()=>shaft-.012,()=>shaft+.002,{thick:.0035,sides:seg(16,6),col:tint(tone,.8)});}
  else band(upper,ankle,()=>-.012,()=>.004,{thick:.004,sides:seg(16,6),col:tint(tone,.8)});
  // Laces.
  if(type!=='loafer'&&!fam.nolace&&fine){const laces=part(foot,'cotton',{tag:'lace'}),lc=sporty?rgb('#efece4'):tint(tone,.6),rowsL=shaft?6:4;for(let i=0;i<rowsL;i++){const t=i/(rowsL-1),z=mix(.085,shaft?-.005:.012,t),y=mix(Math.max(-.03,floor+.03),shaft?shaft-.02:Math.max(-.002,floor+.034),t)+.004,lift=shaft&&t>.5;F.tube(laces,[[-.017,y-.003,z+(lift?.03:0)],[0,y+.0012,z+.002+(lift?.034:0)],[.017,y-.003,z+(lift?.03:0)]],.0021,{sides:4,segments:4,col:lc});}}
  if(type==='loafer')F.tube(part(foot,'leather',{roughness:.34}),[[-.038,-.03,.05],[0,-.012,.055],[.038,-.03,.05]],[.011,.003],{sides:6,segments:8,col:tint(tone,.82)});
  // What sets each catalogue family apart.
  const up=fam.shaft?shaftUp(fam.shaft,upperSpec,grain,kind==='space'?.02:.008):null;
  if(kind==='cuff'&&up){band(up.shape,up.surf,()=>up.top-.055,()=>up.top+.004,{thick:.01,sides:seg(16,6),col:tint(tone,.84)});band(part(foot,'leather',{roughness:.34}),ankle,()=>.03,()=>.046,{thick:.004,sides:seg(16,6),col:accent});stud(part(foot,...METAL),ankle,side*1.3,.038,.008,gold,.006);}
  if(kind==='western'&&up&&fine){for(const s of[-1,1])F.tube(up.shape,[0,.25,.5,.75,1].map(t=>{const q={x:0,y:0,z:0};up.surf.at(s*(1.1+.5*Math.sin(t*Math.PI*2)),mix(-.37,up.top-.03,t),q);return[q.x*1.03,q.y,q.z*1.03];}),.0022,{sides:4,segments:10,col:accent});band(up.shape,up.surf,()=>up.top-.01,()=>up.top+.006,{thick:.005,sides:seg(16,6),col:accent});}
  if(kind==='plate'){const m=part(foot,...METAL);for(const z of[.02,.06,.1])F.tube(m,[[-.046,floor+.004,z],[-.034,Math.max(-.016-z*.2,floor+.03),z+.003],[0,Math.max(-.004-z*.24,floor+.036),z+.005],[.034,Math.max(-.016-z*.2,floor+.03),z+.003],[.046,floor+.004,z]],[.004,.012],{sides:6,segments:seg(12,5),col:tint(steel,.8)});if(up&&fine)for(let i=0;i<3;i++)stud(part(calfN,...METAL),up.surf,side*1.57,-.36+i*.06,.005,gold,.003);}
  if(kind==='space'&&up){const rim=B.calf(side).offset(.022),grey=rgb('#9aa1a6');band(up.shape,rim,()=>up.top-.03,()=>up.top,{thick:.005,sides:seg(16,6),col:grey});band(upper,ankle,()=>.02,()=>.05,{thick:.008,sides:seg(16,6),col:grey});}
  if(kind==='chelsea'&&fine){for(const s of[-1,1])F.patch(part(foot,'knit'),ankle,{t0:s*1.57-.36,t1:s*1.57+.36,y0:-.012,y1:shaft-.008,thick:.0022,nu:4,nv:4,col:dark});F.tube(upper,[[-.008,shaft-.006,-.046],[0,shaft+.022,-.05],[.008,shaft-.006,-.046]],.003,{sides:5,segments:6,col:tint(tone,.7)});}
  if(kind==='clown'){F.ellipsoid(upper,0,SOLE+.052,.16,.07,.052,.088,{nu:seg(16,7),nv:seg(10,5),col:(x,y,z)=>tint(accent,.9+.1*y)});lengthwise(sole,[[.1,.058,floor+.001,SOLE],[.19,.07,floor+.001,SOLE],[.245,.045,floor+.001,SOLE]],{floor:SOLE,col:soleCol,heel:.004,toe:.012,sides:seg(12,6),rows:3});}
  if(kind==='wizard'){F.tube(upper,[[0,floor+.02,.14],[0,floor+.024,.205],[0,floor+.062,.242],[0,floor+.098,.222]],t=>.022*(1-.72*t),{sides:seg(8,5),segments:seg(12,5),col:t=>tint(tone,.95)});F.ellipsoid(part(foot,...METAL),0,floor+.098,.212,.009,.009,.009,{nu:8,nv:5,col:gold});}
  if(kind==='trail'&&fine){for(const s of[-1,1])for(let i=0;i<5;i++)F.roundBox(sole,s*.05,SOLE+.009,-.06+i*.05,.014,.018,.024,.004,{segments:1,col:rgb('#232426')});F.ellipsoid(sole,0,floor+.012,.166,.036,.016,.014,{nu:10,nv:5,col:rgb('#232426')});}
  if(kind==='brogue'&&fine){const y=floor+.03;F.tube(upper,[[-.042,y-.012,.092],[-.022,y-.002,.122],[0,y+.004,.1],[.022,y-.002,.122],[.042,y-.012,.092]],.0018,{sides:4,segments:12,col:tint(tone,.55)});for(let i=0;i<7;i++)F.ellipsoid(upper,(i-3)*.011,y+.003-Math.abs(i-3)*.0022,.128+Math.abs(i-3)*.002,.0022,.0012,.0022,{nu:6,nv:3,col:tint(tone,.4)});}
  if(kind==='future'){for(const s of[-1,1]){F.tube(part(foot,...GLOW),[[s*.036,floor+.001,-.07],[s*.047,floor+.001,.04],[s*.049,floor+.001,.13]],.0038,{sides:5,segments:8,col:rgb('#7edbe9')});F.roundBox(part(foot,...METAL),s*.046,floor+.03,-.03,.004,.03,.07,.002,{segments:1,col:steel});}}
  if(kind==='roller'){const wheel=part(foot,'rubber'),hub=part(foot,...MATTE);for(const x of[-.05,.05])for(const z of[-.045,.11]){placed(wheel,mat4(x,SOLE+.023,z,0,0,Math.PI/2),()=>F.lathe(wheel,[[0,-.011],[.021,-.011],[.023,-.006],[.023,.006],[.021,.011],[0,.011]],{sides:seg(14,8),col:rgb('#1d1e20'),smooth:false}));F.ellipsoid(hub,x+Math.sign(x)*.011,SOLE+.023,z,.003,.01,.01,{nu:8,nv:4,col:accent});}}
  // Editions: instep straps, side stripes.
  if(v===1&&fine)for(const z of[.03,.075])F.tube(part(foot,'nylon'),[[-.047,floor+.004,z],[-.034,Math.max(-.02,floor+.03)-z*.12,z+.003],[0,Math.max(-.006,floor+.04)-z*.2,z+.005],[.034,Math.max(-.02,floor+.03)-z*.12,z+.003],[.047,floor+.004,z]],[.0035,.011],{sides:6,segments:seg(12,5),col:accent});
  if(v===2&&fine)for(const s of[-1,1])F.tube(part(foot,'nylon'),[[s*.037,floor+.014,-.06],[s*.046,floor+.016,.04],[s*.048,floor+.008,.12]],.0034,{sides:5,segments:8,col:accent});
 }
}

// ---- facial hair -------------------------------------------------------------------------
// Each style is a thickness field over the lower face (how far the hair stands off the skin at each point),
// plus optional hair that hangs below the chin and free ends for moustaches that leave the face.
// faceAt: the point on the front of the face at lateral position x and height ym above the chin.
function faceAt(H,x,ym,out,nrm){const y=H.yOf(ym);let lo=-1.6,hi=1.6;for(let i=0;i<14;i++){const mid=(lo+hi)/2;H.surf.at(mid,y,out);if(out.x<x)lo=mid;else hi=mid;}const theta=(lo+hi)/2;H.surf.at(theta,y,out);if(nrm)H.surf.normal(theta,y,nrm);return theta;}
const BEARD={
 3:{kind:'full',t:.0042,soft:.004,line:.93,tache:.0038},4:{kind:'full',t:.0105,soft:.012,bulk:.006,tache:.0065},5:{kind:'full',t:.013,soft:.012,bulk:.008,tache:.0075,hang:['long',.105]},
 6:{kind:'chin',t:.0095,half:.026,top:.031,hang:['tuft',.016]},7:{kind:'ring',t:.0075},8:{kind:'chin',t:.0085,half:.02,top:.03,hang:['point',.036],tache:.0055,reach:.006},
 9:{kind:'balbo',t:.008,tache:.005,reach:.004},10:{kind:'anchor',t:.006,tache:.003,reach:.003,thin:true},11:{kind:'strap',t:.0045,width:.013},12:{kind:'strap',t:.0115,width:.034,bulk:.006},
 13:{kind:'chops',t:.0062},14:{kind:'chops',t:.006,join:true,tache:.0065},15:{kind:'none',tache:.0078,reach:.009},16:{kind:'none',tache:.0032,reach:.004,thin:true},
 17:{kind:'none',tache:.006,reach:.006,ends:'handlebar'},18:{kind:'bars',t:.0065,tache:.0072,reach:.013},19:{kind:'none',tache:.0108,reach:.012,droop:true},20:{kind:'none',tache:.007,reach:.007,ends:'imperial'},
 21:{kind:'none',tache:.0036,reach:.005,thin:true,ends:'english'},22:{kind:'none',tache:.003,reach:.004,thin:true,ends:'dali'},23:{kind:'soul',t:.005},24:{kind:'chin',t:.008,half:.017,top:.022,hang:['tuft',.024]},
 25:{kind:'full',t:.011,soft:.01,bulk:.006,tache:.0065,hang:['point',.07]},26:{kind:'full',t:.011,soft:.01,bulk:.005,tache:.0065,hang:['fork',.062]},27:{kind:'full',t:.011,soft:.011,bulk:.006,tache:.0065,hang:['braid',.105]},
 28:{kind:'full',t:.0145,soft:.012,bulk:.011,tache:.007,hang:['round',.034]},29:{kind:'full',t:.012,soft:.008,bulk:.008,tache:.0065,hang:['square',.04]}
};
function beardField(id,H){
 const style=BEARD[id];if(!style)return null;
 const mh=H.mouthHalf,jawEdge=ax=>mix(.002,.05,Math.pow(smooth(.016,.066,ax),1.2)),cheekLine=ax=>mix(.064,.108,smooth(.020,.066,ax))*(style.line||1);
 const below=(line,soft,ym)=>1-smooth(line-soft,line,ym),lips=(ax,ym)=>(1-smooth(mh*1.02,mh*1.26,ax))*smooth(.0305,.036,ym)*(1-smooth(.0575,.0605,ym));
 const neck=ym=>smooth(-.021,-.011,ym),back=at=>1-smooth(1.58,1.78,at),burn=(at,ym)=>smooth(1.2,1.34,at)*(1-smooth(1.6,1.74,at))*(1-smooth(.126,.142,ym));
 const reach=style.reach??.012,lo=style.thin?.0585:style.droop?.047:.0572,hi=style.thin?.0634:.0708,fall=style.thin?.0026:.005;
 const tache=(ax,ym)=>style.tache?style.tache*smooth(lo,lo+.0026,ym)*(1-smooth(hi-fall,hi,ym))*(1-smooth(mh+reach-.008,mh+reach,ax)):0;
 return{style,cover(theta,ym,x){
  const ax=Math.abs(x),at=Math.abs(theta),k=style.kind;let th=0;
  if(k==='full'){const m=Math.max(below(cheekLine(ax),style.soft,ym),burn(at,ym))*back(at)*neck(ym)*(1-lips(ax,ym));th=style.t*m+(style.bulk||0)*gauss(ax,0,.034)*gauss(ym,.004,.03)*m;}
  else if(k==='strap'){const edge=jawEdge(ax),under=style.width<.02?1-smooth(.012,.026,edge-ym):1;th=style.t*Math.max(below(edge+style.width,.006,ym)*under,burn(at,ym)*smooth(.03,.05,ym))*back(at)*neck(ym)*(1-lips(ax,ym))+(style.bulk||0)*gauss(ax,0,.03)*gauss(ym,0,.02);}
  else if(k==='chops'){const m=Math.max(below(cheekLine(ax),.01,ym),burn(at,ym))*back(at)*smooth(-.012,.004,ym)*smooth(.03,.042,ax)*(1-lips(ax,ym));th=style.t*m;if(style.join)th=Math.max(th,style.t*.8*smooth(.043,.049,ym)*(1-smooth(.066,.071,ym))*smooth(mh*.9,mh+.006,ax)*(1-smooth(.05,.06,ax)));}
  else if(k==='chin')th=style.t*(1-smooth(style.half-.007,style.half,ax))*below(style.top,.006,ym)*neck(ym);
  else if(k==='ring')th=style.t*(1-smooth(mh+.012,mh+.021,ax))*below(.07,.005,ym)*neck(ym)*(1-lips(ax,ym));
  else if(k==='balbo')th=style.t*Math.max((1-smooth(.034,.044,ax))*below(.027,.006,ym)*neck(ym),(1-smooth(.005,.01,ax))*below(.0345,.003,ym)*smooth(.015,.02,ym));
  else if(k==='anchor')th=style.t*Math.max((1-smooth(.03,.04,ax))*below(jawEdge(ax)+.012,.005,ym)*smooth(-.014,-.004,ym),(1-smooth(.004,.008,ax))*below(.0345,.003,ym)*smooth(-.01,0,ym));
  else if(k==='soul')th=style.t*(1-smooth(.005,.0095,ax))*below(.0345,.003,ym)*smooth(.0195,.024,ym);
  else if(k==='bars')th=style.t*smooth(mh+.0005,mh+.004,ax)*(1-smooth(mh+.011,mh+.015,ax))*below(.06,.004,ym)*smooth(-.012,-.002,ym);
  // A moustache follows the lip, dropping a little toward the corners of the mouth.
  return Math.max(th,tache(ax,ym+.0065*Math.pow(smooth(mh*.3,mh+reach,ax),1.5)));
 }};
}
const EDGE=.0016,BEARD_ROWS=[-.022,-.017,-.012,-.007,-.002,.003,.008,.013,.018,.022,.026,.030,.033,.036,.040,.044,.048,.052,.055,.0575,.0595,.0615,.0635,.0655,.068,.071,.075,.080,.086,.093,.100,.108,.116,.124,.132,.140];
function buildBeard(rig,a,M,H){
 const id=a.facialHair||0,field=beardField(id,H);if(!field)return;
 const style=field.style,holder=group(rig.head,'facial-hair-'+id),mat=part(holder,'hair'),tone=rgb(a.beardHex||H.hairHex),nrm={x:0,y:0,z:0},p={x:0,y:0,z:0},zc=H.zc;
 const streak=(u,w)=>tint(tone,.8+.3*F.noise3(u*70,w*9,id*1.3)+.06*F.noise3(u*300,2.2,id));
 if(buildLod<2){
  const stride=Q>.8?1:Q>.5?2:3,stations=BEARD_ROWS.filter((v,i)=>i%stride===0||i===BEARD_ROWS.length-1),rows=stations.length-1,cols=seg(60,16),thick=[],first=mat.i.length;
  const start=F.grid(mat,cols,rows,(u,v,out)=>{const theta=mix(-1.82,1.82,u),ym=stations[Math.round(v*rows)],y=H.yOf(ym);H.surf.at(theta,y,out);H.surf.normal(theta,y,nrm);
   let t=field.cover(theta,ym,out.x);if(t>0)t*=.86+.3*F.fbm3(theta*14,ym*70,id,2);thick.push(t);
   // The shell dips just under the skin where the hair thins out, so its edge follows the field smoothly.
   const h=t-EDGE;out.x+=nrm.x*h;out.y+=nrm.y*h-(t>EDGE?t*.35*smooth(.035,-.005,ym):0);out.z+=nrm.z*h;out.col=streak(u,v);},{reference:(x,y,z)=>[x,y-H.centre.y+.05,z-zc]});
  // Only the cells that carry hair are kept.
  const idx=mat.i,kept=[];for(let k=first;k<idx.length;k+=3)if(thick[idx[k]-start]>EDGE||thick[idx[k+1]-start]>EDGE||thick[idx[k+2]-start]>EDGE)kept.push(idx[k],idx[k+1],idx[k+2]);idx.length=first;for(const v of kept)idx.push(v);
 }
 // Hair below the chin: one mass, a point, a fork or braids.
 if(style.hang){const[kind,L]=style.hang,jw=.05*H.wide*H.jaw,col=(theta,y,pt)=>tint(tone,.78+.3*F.noise3(theta*9,y*30,id)+.08*F.noise3(theta*40,y*8,1));
  const mass=(spec,n=2.2,cap=.012)=>{const surf=F.surface(spec.map(r=>({y:H.yOf(r[0]),a:r[1],f:r[2],k:r[3],z:zc+r[4],n})));F.loft(mat,surf,{sides:seg(20,8),rows:seg(12,4),from:H.yOf(spec[0][0]),to:H.yOf(spec[spec.length-1][0]),capEnd:'round',capEndHeight:cap,col});};
  if(kind==='long')mass([[.03,jw,.05,.034,.036],[0,jw*.96,.054,.03,.04],[-L*.45,jw*.8,.044,.026,.052],[-L*.85,jw*.45,.026,.016,.07],[-L,jw*.2,.012,.008,.078]]);
  else if(kind==='point'){const w=style.kind==='chin'?style.half+.004:jw*.9;mass([[.028,w,.05,.03,.036],[0,w*.9,.05,.026,.04],[-L*.55,w*.5,.03,.018,.05],[-L,w*.1,.006,.005,.058]],2.1,.006);}
  else if(kind==='tuft'){const w=style.half;mass([[.02,w,.04,.02,.045],[0,w*.9,.04,.02,.046],[-L,w*.55,.022,.014,.05]]);}
  else if(kind==='round')mass([[.03,jw*1.02,.052,.034,.036],[0,jw*1.04,.058,.03,.04],[-L*.6,jw*.9,.05,.026,.046],[-L,jw*.6,.034,.02,.05]],2.3,.022);
  else if(kind==='square')mass([[.03,jw*1.02,.052,.034,.036],[0,jw*1.02,.056,.03,.04],[-L*.7,jw,.052,.028,.046],[-L,jw*.96,.048,.026,.05]],3.6,.006);
  else{mass([[.03,jw*.9,.05,.03,.036],[0,jw*.8,.05,.028,.04],[-.016,jw*.5,.03,.02,.044]]);
   if(kind==='fork')for(const s of[-1,1])F.tube(mat,[[s*.012,H.yOf(.012),zc+.06],[s*.018,H.yOf(-.012),zc+.07],[s*.026,H.yOf(-L*.6),zc+.074],[s*.03,H.yOf(-L),zc+.07]],t=>.02*(1-t)+.003,{sides:seg(10,5),segments:seg(12,5),col:(t,u)=>streak(u+s,t)});
   else for(const i of[-1,0,1]){const len=i?L*.8:L;F.tube(mat,[[i*.024,H.yOf(0),zc+.062],[i*.027,H.yOf(-len*.4),zc+.074],[i*.028,H.yOf(-len*.8),zc+.082],[i*.028,H.yOf(-len),zc+.084]],t=>.0095*(1-.35*t)*(1+.2*Math.sin(t*len*460)),{sides:seg(8,4),segments:seg(26,8),col:t=>tint(tone,.75+.3*Math.abs(Math.sin(t*len*230)))});
    F.ellipsoid(part(holder,...METAL),i*.028,H.yOf(-len)-.004,zc+.084,.0085,.007,.0085,{nu:seg(8,5),nv:4,col:rgb('#c9a24c')});}}
 }
 // Moustache ends that curl or point away from the face.
 if(style.ends&&buildLod<2){const mh=H.mouthHalf,limit=.0665*H.wide*.82,path={handlebar:[[mh*.7,.0605,.004],[mh+.008,.0565,.006],[mh+.02,.0595,.008],[mh+.027,.068,.009],[mh+.024,.0755,.008]],imperial:[[mh*.8,.061,.005],[mh+.012,.0595,.007],[mh+.026,.071,.008],[mh+.034,.089,.007],[mh+.036,.104,.006]],english:[[mh*.5,.061,.004],[mh+.012,.0592,.007],[mh+.034,.0602,.012],[mh+.052,.062,.017]],dali:[[mh*.6,.061,.004],[mh+.008,.0602,.007],[mh+.019,.072,.011],[mh+.022,.092,.013],[mh+.02,.112,.015]]}[style.ends],r0={handlebar:.0044,imperial:.005,english:.003,dali:.0027}[style.ends];
  for(const s of[-1,1])F.tube(mat,path.map(([x,ym,lift])=>{const xr=Math.min(x,limit),extra=x-xr;faceAt(H,s*xr,ym,p,nrm);return[p.x+nrm.x*lift+s*extra,p.y+nrm.y*lift,p.z+nrm.z*lift-extra*.2];}),t=>r0*(1-.82*t)+.0005,{sides:seg(7,4),segments:seg(16,6),col:(t,u)=>streak(u+s,t)});}
}

// ---- headwear ----------------------------------------------------------------------------
// The three plain hats and the 26 catalogue families are built on the wearer's own skull, so each one fits.
// Editions: 1 adds side tabs, 2 a row of gold studs, 3 is the oversized cut.
const HAT_OPEN=new Set([6,9,18]),HAT_FULL=new Set([8,15,16,17,20,21,22,24]);
function hatChoice(a){if(Number.isInteger(a.cosmeticHat))return{family:Math.floor(a.cosmeticHat/4),edition:a.cosmeticHat%4,catalog:true};const plain=a.hat||([3,4,5].includes(a.accessory)?a.accessory:0);return plain?{family:{3:0,4:1,5:4}[plain]??0,edition:0,catalog:false}:null;}
// 0: hair untouched, 1: hair flattened under the hat, 2: hair hidden entirely (helmets, hoods, wigs).
function hatCover(a){const h=hatChoice(a);return!h?0:HAT_FULL.has(h.family)?2:HAT_OPEN.has(h.family)?0:1;}
const fnOf=(x,...args)=>typeof x==='function'?x(...args):x;
const mat4=(x,y,z,rx=0,ry=0,rz=0,s=1)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(s,s,s));
const placed=(shape,m,build)=>{const from=shape.count;build();shape.transform(from,m);};
const cone=(shape,r,h,colour,sides=seg(12,5))=>F.lathe(shape,[[0,0],[r,0],[r*.5,h*.5],[0,h]],{sides,col:colour,smooth:false});
function buildHat(rig,a,M,B,H,C){
 const pick=hatChoice(a);if(!pick)return;const f=pick.family,v=pick.edition;
 const g=group(rig.head,pick.catalog?'catalog-hat-'+a.cosmeticHat:'shop-headwear');rig.clothingNodes.hat=g;
 const col=rgb(a.hatColor||(pick.catalog?'#44617a':C.accent)),dark=rgb('#22262b'),gold=rgb('#d9b24a'),white=rgb('#ece8dd'),trim=v===2?gold:dark;
 const PH=F.surface(H.sections),c=H.centre,zc=H.zc,top=H.yOf(CROWN),p={x:0,y:0,z:0},signed=theta=>{let t=theta%TAU;if(t>Math.PI)t-=TAU;if(t<-Math.PI)t+=TAU;return t;};
 const cotton=()=>part(g,'cotton'),wool=()=>part(g,'wool'),matte=()=>part(g,...MATTE),gloss=()=>part(g,...GLOSS),metal=()=>part(g,...METAL),felted=(o,k=.9)=>tint(col,k+.1*F.fbm3(o.x*22,o.y*22,o.z*22,2));
 // A point on the skull at angle theta and height ym, pushed outward. Below `floor` the wall drops straight down.
 const onHead=(theta,ym,push,o=p,floor=-1)=>{const yq=Math.max(ym,floor);PH.at(theta,H.yOf(Math.min(yq,.2334)),o);if(yq>=.2334){o.x*=.2;o.z=zc-.006+(o.z-zc+.006)*.2;o.y=top;}const dx=o.x,dy=(o.y-c.y)*.9,dz=o.z-zc,len=Math.hypot(dx,dy,dz)||1;o.x+=dx/len*push;o.y+=dy/len*push;o.z+=dz/len*push;if(ym<floor)o.y=H.yOf(ym);return o;};
 // A shell over the skull from a hat line up to the crown; its first row tucks in against the head.
 const shell=(shape,low,high,thick,colour,rows=seg(10,4),sides=seg(36,10),floor=-1)=>F.grid(shape,sides,rows+1,(uu,vv,out)=>{const theta=uu*TAU,j=Math.round(vv*(rows+1)),t=j===0?0:(j-1)/rows,ym=mix(fnOf(low,theta),high,Math.pow(t,.9));onHead(theta,ym,j===0?-.0015:fnOf(thick,theta,t,ym),out,floor);out.col=fnOf(colour,theta,t,out);},{closeU:true,reference:(x,y,z)=>[x,y-c.y,z-zc]});
 const pushed=push=>({at:(theta,y,out)=>{PH.at(theta,y,out);const dx=out.x,dz=out.z-zc,len=Math.hypot(dx,dz)||1,e=fnOf(push,theta);out.x+=dx/len*e;out.z+=dz/len*e;return out;},normal:(theta,y,out)=>{out.x=Math.sin(theta);out.y=0;out.z=Math.cos(theta);return out;}});
 const ring=(shape,low,high,push,thick,colour,sides=seg(36,10))=>band(shape,pushed(push),theta=>H.yOf(fnOf(low,theta)),theta=>H.yOf(fnOf(high,theta)),{thick,col:colour,sides});
 // A brim: a thin closed sheet running outward from the head. width, rise and colour may vary round the head.
 const brim=(shape,o)=>{const full=o.t0===undefined,t0=full?0:o.t0,t1=full?TAU:o.t1,nu=o.cols||seg(full?44:18,full?12:6),nr=o.rows||seg(6,3),thick=o.thick??.005,n=nr*2+1,inner=o.inner??.006;
  return F.grid(shape,nu,n,(uu,vv,out)=>{const theta=mix(t0,t1,uu),j=Math.round(vv*n),upper=j<=nr,s=upper?j/nr:(n-j)/nr,w=fnOf(o.width,theta);PH.at(theta,H.yOf(o.ym),out);const dx=out.x,dz=out.z-zc,len=Math.hypot(dx,dz)||1,reach=inner+w*s;out.x+=dx/len*reach;out.z+=dz/len*reach;out.y+=fnOf(o.rise,theta,s)+(upper?thick/2:-thick/2);out.col=fnOf(o.col,theta,s,upper);},{closeU:full});};
 // A free-standing crown rising from the hat line. Rows are [height, width scale, depth scale, power, z shift, x shift].
 const riser=(base,rows,push=.008,modifier)=>{const s0=PH.section(H.yOf(base),{}),y0=H.yOf(base);return F.surface(rows.map(r=>({y:y0+r[0],a:(s0.a+push)*r[1],b:(s0.b+push)*r[1],f:(s0.f+push)*(r[2]??r[1]),k:(s0.k+push)*(r[2]??r[1]),n:r[3]||s0.n,z:s0.z+(r[4]||0),x:r[5]||0})),modifier);};
 const crown=(shape,base,rows,o={})=>{const surf=riser(base,rows,o.push,o.modifier),y0=H.yOf(base);F.loft(shape,surf,{sides:o.sides||seg(36,10),rows:o.rowsN||seg(rows.length*4,rows.length),from:y0,to:y0+rows[rows.length-1][0],capEnd:o.cap===0?'flat':'round',capEndHeight:o.cap||undefined,col:o.col});return surf;};
 // A panel lying on the head (ear flaps, slits, bars).
 const flap=(shape,t0,t1,y0,y1,push,colour,nu=seg(8,3),nv=seg(8,3),floor=-1)=>F.grid(shape,nu,nv,(uu,vv,out)=>{const e=Math.min(1,Math.min(uu,1-uu,vv,1-vv)*5);onHead(mix(t0,t1,uu),mix(y0,y1,vv),fnOf(push,uu,vv)*(.15+.85*e)-.002*(1-e),out,floor);out.col=fnOf(colour,uu,vv);},{reference:(x,y,z)=>[x,y-c.y,z-zc]});
 const ball=(shape,theta,ym,push,r,colour,floor=-1)=>{onHead(theta,ym,push,p,floor);F.ellipsoid(shape,p.x,p.y,p.z,r,r,r,{nu:seg(9,5),nv:seg(6,4),col:colour});};
 let face=.01; // how far the front of the hat stands off the skull at band height, for the edition trims
 const capLine=theta=>.176-.012*Math.cos(theta);
 if(f===0){const cap=cotton();face=.0095;
  shell(cap,capLine,.2345,(t,vv)=>.007+.004*Math.sin(vv*Math.PI),theta=>{const st=Math.abs(signed(theta));return v===1&&st>1.05&&st<2.55?tint(dark,1.25+.5*F.noise3(theta*70,1,2)):tint(col,.92+.08*Math.abs(Math.sin(theta*3)));});
  ring(cap,theta=>capLine(theta)-.002,theta=>capLine(theta)+.016,.007,.0022,tint(col,.84));
  brim(cap,{t0:-1.08,t1:1.08,ym:.166,inner:.004,width:theta=>.08*Math.pow(Math.max(0,Math.cos(theta*1.45)),.6),rise:(theta,s)=>.004-.014*s-.01*s*s,thick:.0045,col:(theta,s,up)=>tint(col,up?.86:.68)});
  onHead(0,.2345,.0085);F.ellipsoid(cap,p.x,p.y,p.z,.008,.004,.008,{nu:8,nv:4,col:tint(col,.8)});}
 else if(f===1){const knit=part(g,'knit'),line=theta=>.158-.006*Math.cos(theta),rib=theta=>.82+.2*Math.abs(Math.sin(theta*30));face=.014;
  shell(knit,line,.2345,(t,vv)=>.009+.012*smooth(.55,1,vv),theta=>tint(col,rib(theta)));
  ring(knit,theta=>line(theta)-.006,()=>.192,.009,.0045,theta=>tint(col,rib(theta)*.92));
  if(v>0){const pom=v===2?gold:tint(col,.62);onHead(0,.2345,.03);F.ellipsoid(wool(),p.x,p.y+.012,p.z,.03,.03,.03,{nu:seg(14,6),nv:seg(10,5),col:(x,y,z)=>tint(pom,.8+.4*F.noise3(x*9,y*9,z*9)),warp:(x,y,z,w)=>{const k=1+.12*F.noise3(x*5,y*5,z*5);w[0]=x*k;w[1]=y*k;w[2]=z*k;}});}}
 else if(f===2){const felt=wool(),y0=H.yOf(.176);face=.012;
  const surf=crown(felt,.176,[[0,1],[.045,1],[.095,.95],[.125,.86]],{push:.009,cap:.016,col:(theta,y,o)=>felted(o),modifier:(theta,y,out)=>{const up=smooth(y0+.06,y0+.125,y);out.y-=.03*up*gauss(out.x,0,.032);out.x*=1-.16*up*smooth(.2,.9,Math.cos(theta));}});
  brim(felt,{ym:.178,width:theta=>.085+.012*Math.abs(Math.sin(theta)),rise:(theta,s)=>.05*s*s*Math.pow(Math.abs(Math.sin(theta)),1.6)-.012*s*Math.pow(Math.abs(Math.cos(theta)),2),col:(theta,s,up)=>tint(col,up?.92:.74)});
  band(part(g,'leather'),surf,()=>y0+.004,()=>y0+.022,{thick:.002,col:tint(trim,v===2?1:1.3),sides:seg(36,10)});surf.at(.5,y0+.013,p);F.roundBox(metal(),p.x+.002,p.y,p.z+.003,.016,.014,.004,.002,{segments:1,col:rgb('#b9b3a0')});}
 else if(f===3){const cl=cotton();face=.011;crown(cl,.174,[[0,1],[.04,.985],[.062,.93]],{push:.008,cap:.012,col:(theta,y,o)=>felted(o,.92)});
  brim(cl,{ym:.176,inner:.005,width:.052,rise:(theta,s)=>-.034*s-.004*s*s,thick:.004,rows:seg(8,4),col:(theta,s,up)=>tint(col,(up?.9:.72)*(Math.abs(s-.45)<.07||Math.abs(s-.8)<.06?.84:1))});
  ring(cl,()=>.176,()=>.184,.0095,.0015,tint(col,.8));}
 else if(f===4){const felt=wool(),y0=H.yOf(.178);face=.012;
  const surf=crown(felt,.178,[[0,1],[.04,.995],[.08,.94],[.098,.85]],{push:.009,cap:.013,col:(theta,y,o)=>felted(o),modifier:(theta,y,out)=>{const up=smooth(y0+.045,y0+.098,y),front=smooth(.1,.9,Math.cos(theta));out.y-=.02*up*gauss(out.x,0,.03);out.z-=.016*up*front*gauss(Math.abs(out.x),.034,.018);out.x*=1-.12*up*front;}});
  brim(felt,{ym:.18,width:theta=>.056+.006*Math.cos(theta),rise:(theta,s)=>-.016*s*Math.max(0,Math.cos(theta))+.014*s*s*Math.max(0,-Math.cos(theta))+.006*s*s*Math.abs(Math.sin(theta)),thick:.0045,col:(theta,s,up)=>tint(col,up?.92:.74)});
  const ribbon=pick.catalog?tint(trim,v===2?1:1.2):rgb('#2a2622');band(part(g,'cotton'),surf,()=>y0+.004,()=>y0+.026,{thick:.0018,col:ribbon,sides:seg(36,10)});surf.at(-1.45,y0+.015,p);F.roundBox(part(g,'cotton'),p.x-.004,p.y,p.z,.008,.02,.03,.003,{segments:1,col:tint(ribbon,.85)});}
 else if(f===5){const felt=wool();face=.01;ring(felt,()=>.172,()=>.188,.006,.0035,tint(col,.8));
  placed(felt,mat4(-.012,H.yOf(.21),zc-.012,.05,0,.12),()=>F.ellipsoid(felt,0,0,0,.128,.036,.118,{nu:seg(28,10),nv:seg(12,5),col:(x,y,z)=>tint(col,.9+.1*F.noise3(x*4,y*4,z*4))}));
  F.tube(felt,[[-.02,H.yOf(.243),zc-.012],[-.022,H.yOf(.256),zc-.012]],.0035,{sides:5,segments:2,col:tint(col,.8)});}
 else if(f===6){const cl=cotton();face=.0085;ring(cl,theta=>.166-.004*Math.cos(theta),()=>.196,.0065,.003,tint(col,.9));
  brim(cl,{t0:-1.08,t1:1.08,ym:.168,inner:.005,width:theta=>.088*Math.pow(Math.max(0,Math.cos(theta*1.45)),.6),rise:(theta,s)=>.002-.016*s-.012*s*s,thick:.0045,col:(theta,s,up)=>tint(col,up?.86:.66)});}
 else if(f===7){const fab=wool(),fur=rgb('#d9cdb6'),furry=(uu,vv)=>tint(fur,.82+.3*F.noise3(uu*40,vv*40,7)),low=theta=>.172-.04*smooth(1,2,Math.abs(signed(theta)));face=.024;
  shell(fab,low,.2345,.013,(theta,t,o)=>felted(o));
  for(const s of[-1,1]){flap(fab,s*.95,s*2.3,.012,.17,.016,tint(col,.92),seg(8,3),seg(10,4));flap(fab,s*.9,s*2.35,-.004,.028,.024,furry,seg(8,3),3);F.tube(part(g,'cotton',{tag:'cord'}),[[s*.07,H.yOf(.006),zc+.03],[s*.06,H.yOf(-.03),zc+.04],[s*.055,H.yOf(-.065),zc+.045]],.0025,{sides:5,segments:6,col:tint(col,.7)});}
  flap(fab,-1,1,.166,.21,.022,furry,seg(12,4),3);}
 else if(f===8){const sh=gloss(),cy=H.yOf(.118),cz=zc-.006,stripe=tint(trim===dark?white:trim,1);face=.048;
  F.ellipsoid(sh,0,cy,cz,.122,.14,.142,{nu:seg(40,12),nv:seg(24,8),warp:(x,y,z,w)=>{w[0]=x;w[1]=y<-.5?-.5+(y+.5)*.55:y;w[2]=z+(z>0&&y<-.12?.12*(-.12-y):0);},col:(x,y,z)=>z>.28&&y>-.1&&y<.3?rgb('#0d1014'):Math.abs(x)<.13&&!(z>0&&y<.3)?stripe:z>.5&&y<-.2&&Math.abs(x)<.3&&Math.floor((x+1)*14)%2?rgb('#111417'):tint(col,1)});
  F.tube(part(g,'rubber'),Array.from({length:10},(_,i)=>{const t=i/10*TAU;return[Math.sin(t)*.098,cy-.118,cz+Math.cos(t)*.112+.004];}),.011,{closed:true,sides:6,segments:seg(30,10),col:rgb('#1b1d20')});}
 else if(f===9){const m=metal(),points=7,zig=theta=>Math.abs(((theta/TAU*points)%1+1)%1-.5)*2,surf=riser(.176,[[0,1],[.1,1.03]],.008),y0=H.yOf(.176);face=.012;
  band(m,surf,()=>y0,theta=>y0+.02+.05*(1-zig(theta)),{thick:.004,col:gold,sides:seg(70,28)});band(m,surf,()=>y0-.002,()=>y0+.01,{thick:.006,col:tint(gold,.9),sides:seg(36,10)});
  for(let i=0;i<points;i++){const theta=(i+.5)/points*TAU;surf.at(theta,y0+.074,p);F.ellipsoid(m,p.x,p.y,p.z,.0085,.0085,.0085,{nu:8,nv:5,col:gold});surf.at(theta,y0+.026,p);F.ellipsoid(gloss(),p.x*1.04,p.y,zc+(p.z-zc)*1.04,.0085,.011,.0085,{nu:8,nv:5,col:rgb(i%2?'#3fb6d8':'#c9485f')});}}
 else if(f===10){const felt=wool(),y0=H.yOf(.176);face=.011;
  const surf=crown(felt,.176,[[0,1,1,2.3],[.03,.985],[.12,1],[.152,1.05],[.156,1.04]],{push:.008,cap:0,col:(theta,y,o)=>felted(o,.93)});
  brim(felt,{ym:.178,width:.042,rise:(theta,s)=>.016*s*s*Math.pow(Math.abs(Math.sin(theta)),2)-.004*s,col:(theta,s,up)=>tint(col,up?.9:.74)});
  band(part(g,'cotton'),surf,()=>y0+.004,()=>y0+.034,{thick:.0018,col:tint(trim,v===2?1:1.25),sides:seg(36,10)});}
 else if(f===11){const straw=part(g,'canvas'),y0=H.yOf(.176),ribbon=trim===dark?rgb('#b8455a'):trim;face=.011;
  const surf=crown(straw,.176,[[0,1],[.035,.99],[.06,.9]],{push:.008,cap:.02,col:(theta,y)=>tint(col,.9+.08*Math.sin(y*500))});
  brim(straw,{ym:.178,width:theta=>.15+.012*Math.sin(theta*3+1),rise:(theta,s)=>-.028*s*s+.014*s*s*Math.sin(theta*4+.6)+.006*s*Math.sin(theta*9),thick:.004,rows:seg(10,4),cols:seg(56,16),col:(theta,s,up)=>tint(col,(up?.95:.78)*(.92+.08*Math.sin(s*70)))});
  band(part(g,'cotton'),surf,()=>y0+.004,()=>y0+.03,{thick:.0018,col:ribbon,sides:seg(36,10)});for(const s of[-1,1])F.tube(part(g,'cotton'),[[s*.01,y0+.016,zc-.106],[s*.03,y0-.01,zc-.14],[s*.04,y0-.05,zc-.15]],[.003,.011],{sides:5,segments:6,col:tint(ribbon,.9)});}
 else if(f===12){const m=matte(),yellow=rgb('#f0d343'),brown=rgb('#5b4326');face=.01;ring(m,()=>.172,()=>.19,.006,.003,dark);
  F.tube(m,[[-.16,.33,0],[-.09,.275,0],[0,.258,0],[.09,.272,0],[.16,.32,0]].map(([x,y,z])=>[x,H.yOf(y),zc+z]),t=>.044*Math.pow(Math.sin(Math.PI*clamp(t*.94+.03,0,1)),.55)+.004,{sides:5,segments:seg(26,8),col:t=>t<.05||t>.95?brown:tint(yellow,.9+.1*Math.sin(t*9))});}
 else if(f===13){const m=matte(),cheese=rgb('#e8c55b'),sauce=rgb('#b5412f'),crust=rgb('#b27a46');face=.01;ring(m,()=>.172,()=>.19,.006,.003,dark);
  placed(m,mat4(0,H.yOf(.225),zc-.005),()=>{F.slab(m,[[-.16,0],[.16,0],[0,.29]],.03,{bevel:.006,col:cheese});F.tube(m,[[-.17,0,0],[0,-.012,0],[.17,0,0]],.024,{sides:seg(8,5),segments:seg(14,5),col:t=>tint(crust,.88+.2*F.noise3(t*20,1,1))});
   for(const[x,y,side]of[[-.06,.06,1],[.05,.05,1],[0,.13,1],[-.02,.2,1],[.06,.1,-1],[-.05,.09,-1],[.01,.17,-1]])F.ellipsoid(m,x,y,side*.016,.024,.024,.005,{nu:10,nv:4,col:tint(sauce,.9+.2*F.noise3(x*50,y*50,1))});});}
 else if(f===14){const m=matte(),y0=H.yOf(.2),orange=rgb('#f08a2e');face=.012;F.roundBox(m,0,y0+.008,zc,.31,.016,.31,.006,{segments:1,col:tint(orange,.8)});
  F.lathe(m,[[.118,.016],[.112,.03],[.085,.139],[.0848,.141],[.066,.214],[.0657,.216],[.03,.37],[.024,.384],[0,.386]],{sides:seg(24,8),y:y0,z:zc,smooth:false,col:(ang,y)=>y>.14&&y<.215?white:orange});}
 else if(f===15){const m=matte(),kraft=rgb('#b79568'),cy=H.yOf(.125),w=.3,h=.31,d=.3,t=.012,card=(x,y,z)=>tint(kraft,.9+.12*F.noise3(x*6,y*90,z*6));face=.085;
  const panel=(x,y,z,sx,sy,sz,colour=card)=>F.roundBox(m,x,cy+y,zc+z,sx,sy,sz,.004,{segments:1,col:colour});
  panel(0,h/2,0,w,t,d);panel(0,0,-d/2,w,h,t);for(const s of[-1,1]){panel(s*w/2,0,0,t,h,d);panel(s*.12,.005,d/2,.06,.08,t);}
  panel(0,.1,d/2,w,.11,t);panel(0,-.095,d/2,w,.12,t);panel(0,h/2+.004,0,.06,.006,d+.004,rgb('#d8c79d'));for(const x of[-.03,0,.03])panel(x,-.09,d/2+.007,.012,.05,.003,rgb('#2a2622'));}
 else if(f===16||f===17){const dino=f===16,fab=part(g,'fur'),body=dino?rgb('#6f9a56'):white,low=theta=>mix(.172,-.016,smooth(.62,1.18,Math.abs(signed(theta))));face=.026;
  shell(fab,low,.2345,(theta,t)=>.016+.01*smooth(.5,1,t),(theta,t,o)=>tint(body,.9+.12*F.noise3(o.x*18,o.y*18,o.z*18)),seg(14,5));
  for(const s of[-1,1]){F.ellipsoid(gloss(),s*.052,H.yOf(.262),zc+.068,.021,.022,.021,{nu:seg(12,6),nv:seg(8,5),col:(x,y,z)=>z>.72?rgb('#101214'):white});}
  if(dino){F.ellipsoid(fab,0,H.yOf(.226),zc+.075,.066,.036,.085,{nu:seg(20,8),nv:seg(12,5),col:(x,y,z)=>tint(body,z>.8&&Math.abs(x)>.15&&Math.abs(x)<.4&&y>0?.35:.95)});
   for(let i=0;i<6;i++)placed(matte(),mat4((i-2.5)*.02,H.yOf(.205),zc+.148-Math.abs(i-2.5)*.004,Math.PI),()=>cone(matte(),.007,.018,white,6));
   for(let i=0;i<5;i++){const ym=i<2?mix(.2,.2345,i/2):mix(.2345,.11,(i-2)/2.4),theta=i<2?0:Math.PI;onHead(theta,ym,.022);const dy=p.y-c.y,dz=p.z-zc;placed(fab,mat4(p.x,p.y,p.z,Math.atan2(dz,dy)),()=>cone(fab,.02,.05,rgb('#d9b24a'),7));}}
  else{for(let i=0;i<4;i++){onHead(i<2?0:Math.PI,[.215,.2345,.225,.19][i],.03);F.ellipsoid(fab,p.x,p.y+.006,p.z,.012,.03-.004*i,.024,{nu:seg(10,5),nv:seg(8,4),col:rgb('#c23b36')});}
   placed(matte(),mat4(0,H.yOf(.205),zc+.105,Math.PI/2),()=>cone(matte(),.034,.08,rgb('#e2a544'),8));}}
 else if(f===18){const sh=gloss(),cy=H.yOf(.122),R=.168,cut=1.02;face=.09;
  const dome=(shape,a0,a1,colour,rr)=>F.grid(shape,seg(40,12),seg(16,5),(uu,vv,out)=>{const al=mix(a0,a1,vv),be=uu*TAU;out.x=Math.sin(al)*Math.cos(be)*rr;out.y=cy+Math.sin(al)*Math.sin(be)*rr;out.z=zc+Math.cos(al)*rr;out.col=colour;},{closeU:true,poleStart:a0===0,poleEnd:a1>=Math.PI-1e-6,reference:(x,y,z)=>[x,y-cy,z-zc]});
  dome(sh,cut,Math.PI,white,R);F.tube(metal(),Array.from({length:12},(_,i)=>{const be=i/12*TAU;return[Math.sin(cut)*Math.cos(be)*R,cy+Math.sin(cut)*Math.sin(be)*R,zc+Math.cos(cut)*R];}),.007,{closed:true,sides:6,segments:seg(36,12),col:rgb('#b9bdc0')});
  dome(part(g,'plain',{roughness:.06,metalness:.25,transparent:true,opacity:.3,tag:'visor'}),0,cut+.02,rgb('#d6a94a'),R-.004);
  F.lathe(metal(),[[.1,-.014],[.126,-.01],[.13,.012],[.108,.02]],{sides:seg(30,10),y:H.yOf(-.034),z:zc-.004,col:rgb('#c9ccce'),smooth:false});}
 else if(f===19){const felt=wool(),fold=theta=>.5-.5*Math.cos(theta*3),width=theta=>.105-.035*fold(theta),rise=(theta,s)=>.075*Math.pow(s,1.3)*fold(theta)+.01*s;face=.012;
  crown(felt,.178,[[0,1],[.04,.98],[.07,.86]],{push:.009,cap:.022,col:(theta,y,o)=>felted(o,.92)});
  brim(felt,{ym:.18,width,rise,rows:seg(8,4),cols:seg(54,18),col:(theta,s,up)=>s>.9?gold:tint(col,up?.9:.72)});
  const theta=1.05;PH.at(theta,H.yOf(.18),p);const len=Math.hypot(p.x,p.z-zc)||1,reach=.006+width(theta)*.62+.004,px=p.x+p.x/len*reach,pz=p.z+(p.z-zc)/len*reach,py=p.y+rise(theta,.62);
  F.ellipsoid(matte(),px,py+.006,pz,.013,.014,.011,{nu:10,nv:6,col:white});for(const k of[-1,1])F.tube(matte(),[[px-.016,py-.014*k,pz+.004],[px+.016,py+.014*k-.012,pz-.012]],.003,{sides:5,segments:2,col:white});}
 else if(f===20){const m=metal(),steel=rgb('#aab2b6'),brass=rgb('#b08d4f'),black=rgb('#0b0c0e'),floor=.05;face=.036;
  shell(m,()=>-.022,.2345,(theta,t,ym)=>.016+.02*smooth(.1,.9,Math.cos(theta))*gauss(ym,.085,.06),(theta,t,o)=>tint(steel,.9+.1*F.noise3(o.x*30,o.y*30,o.z*30)),seg(18,6),seg(40,12),floor);
  flap(gloss(),-.95,.95,.111,.125,.0375,black,seg(12,4),2);flap(m,-.08,.08,.0,.2,.04,brass,2,seg(12,4),floor);flap(m,-1,1,.126,.142,.04,brass,seg(12,4),2);
  for(let i=0;i<8;i++)ball(gloss(),(i<4?-1:1)*(.3+(i%2)*.17),.05+Math.floor((i%4)/2)*.024,.0345,.0045,black,floor);
  ring(m,()=>-.024,()=>-.006,.018,.004,tint(steel,.82));}
 else if(f===21){const m=metal(),steel=rgb('#879a9d'),cy=H.yOf(.118),cz=zc-.004;face=.034;
  F.roundBox(m,0,cy,cz,.215,.25,.235,.022,{segments:2,col:(x,y,z)=>tint(steel,.92+.1*F.noise3(x*20,y*20,z*20))});
  const glow=part(g,'plain',{roughness:.2,emissive:'#49e3f5',emissiveIntensity:1.6,tag:'glow'});for(const s of[-1,1])F.ellipsoid(glow,s*.05,cy+.03,cz+.118,.026,.018,.006,{nu:seg(12,6),nv:4,col:rgb('#7edbe9')});
  F.roundBox(gloss(),0,cy-.062,cz+.118,.1,.03,.006,.003,{segments:1,col:rgb('#15191d')});for(let i=0;i<5;i++)F.roundBox(m,(i-2)*.02,cy-.062,cz+.121,.005,.03,.004,.001,{segments:1,col:tint(steel,.7)});
  for(const s of[-1,1])placed(m,mat4(s*.112,cy,cz,0,0,-s*Math.PI/2),()=>F.lathe(m,[[0,-.012],[.03,-.012],[.03,.012],[.02,.016],[0,.016]],{sides:seg(14,6),col:tint(steel,.75),smooth:false}));
  F.tube(m,[[0,cy+.125,cz],[0,cy+.2,cz]],.005,{sides:5,segments:3,col:tint(steel,.8)});F.ellipsoid(m,0,cy+.21,cz,.016,.016,.016,{nu:10,nv:6,col:gold});}
 else if(f===22){const wig=part(g,'hair'),hues=['#ba4b65','#e2b854','#479ba7'].map(rgb);let n=0;face=.05;
  const puff=(theta,ym,r)=>{onHead(theta,ym,r*.45);const hue=hues[n++%3],seed=n*3.7;F.ellipsoid(wig,p.x,p.y,p.z,r,r*.95,r,{nu:seg(12,6),nv:seg(9,5),col:(x,y,z)=>tint(hue,.75+.5*F.noise3(x*4+seed,y*4,z*4)),warp:(x,y,z,w)=>{const k=.94+.16*F.noise3(x*3.1+seed,y*3.1,z*3.1);w[0]=x*k;w[1]=y*k;w[2]=z*k;}});};
  for(let i=0;i<11;i++)puff(.5+i/10*(TAU-1),.15,.05);for(let i=0;i<8;i++)puff(i/8*TAU+.4,.205,.05);puff(0,.2345,.05);}
 else if(f===23){const felt=wool(),y0=H.yOf(.176);face=.012;
  const surf=crown(felt,.176,[[0,1],[.05,.8],[.14,.52],[.25,.25],[.33,.07]],{push:.009,cap:.012,rowsN:seg(18,6),col:(theta,y,o)=>felted(o,.88),modifier:(theta,y,out)=>{const up=clamp((y-y0-.08)/.25,0,1);out.z-=.09*up*up;out.x+=.03*up*up;out.y-=.03*up*up*up;}});
  brim(felt,{ym:.178,width:theta=>.1+.01*Math.sin(theta*3),rise:(theta,s)=>-.03*s*s+.01*s*Math.sin(theta*5+1),cols:seg(48,14),col:(theta,s,up)=>tint(col,up?.9:.72)});
  band(part(g,'leather'),surf,()=>y0+.004,()=>y0+.026,{thick:.002,col:tint(trim,v===2?1:1.3),sides:seg(36,10)});surf.at(0,y0+.015,p);F.roundBox(metal(),p.x,p.y,p.z+.004,.03,.026,.005,.002,{segments:1,col:gold});
  if(buildLod<2)for(let i=0;i<6;i++)stud(metal(),surf,i*1.9+.4,y0+.06+i*.036,.007,gold,.002);}
 else if(f===24){const sh=gloss(),green=rgb('#7ca67a'),floor=.04;face=.034;
  shell(sh,()=>-.018,.2345,(theta,t,ym)=>.014+.02*Math.max(0,Math.cos(theta))*gauss(ym,.085,.05)+.04*smooth(.11,.21,ym),(theta,t,o)=>tint(green,.9+.12*F.noise3(o.x*14,o.y*14,o.z*14)),seg(18,6),seg(40,12),floor);
  for(const s of[-1,1]){onHead(s*.42,.122,.05);placed(sh,mat4(p.x,p.y,p.z,0,s*.45,s*-.5),()=>F.ellipsoid(sh,0,0,0,.034,.021,.01,{nu:seg(14,6),nv:seg(8,4),col:rgb('#07090b')}));
   F.tube(sh,[[s*.05,H.yOf(.275),zc],[s*.085,H.yOf(.35),zc],[s*.125,H.yOf(.385),zc]],.006,{sides:5,segments:8,col:green});F.ellipsoid(metal(),s*.13,H.yOf(.392),zc,.02,.02,.02,{nu:10,nv:6,col:gold});}
  flap(sh,-.2,.2,.044,.05,.036,rgb('#2a3a2c'),4,2,floor);}
 else if(f===25){const m=metal(),steel=rgb('#9aa3a6'),brass=rgb('#b08d4f'),bone=rgb('#e6dfcc'),low=theta=>.168-.022*smooth(.9,1.6,Math.abs(signed(theta)));face=.014;
  shell(m,low,.2345,.011,(theta,t,o)=>tint(steel,.9+.12*F.noise3(o.x*30,o.y*30,o.z*30)));ring(m,theta=>low(theta)-.004,theta=>low(theta)+.02,.012,.004,brass);
  const arc=(t0,t1)=>Array.from({length:9},(_,i)=>{const t=i/8,first=t<=.5,ym=first?mix(.172,.2345,t*2):mix(.2345,.16,(t-.5)*2);onHead(first?t0:t1,ym,.013);return[p.x,p.y,p.z];});
  F.tube(m,arc(0,Math.PI),.0055,{sides:5,segments:seg(18,8),col:brass});F.tube(m,arc(Math.PI/2,-Math.PI/2),.0055,{sides:5,segments:seg(18,8),col:brass});
  F.tube(m,[[.172,.013],[.13,.016],[.1,.027],[.084,.031]].map(([ym,push])=>{PH.at(0,H.yOf(ym),p);return[0,p.y,p.z+push];}),.008,{sides:6,segments:6,col:steel});
  for(const s of[-1,1]){F.tube(matte(),[[s*.088,.185],[s*.14,.2],[s*.178,.245],[s*.172,.31]].map(([x,ym])=>[x,H.yOf(ym),zc-.01]),t=>.026*(1-t)+.004,{sides:seg(10,5),segments:seg(14,6),col:t=>tint(bone,.85+.15*t)});F.ellipsoid(m,s*.092,H.yOf(.186),zc-.01,.012,.03,.03,{nu:seg(10,6),nv:5,col:brass});}}
 if(pick.catalog){
  if(v===1&&f!==0)for(const s of[-1,1]){onHead(s*1.5,.186,face+.002);F.roundBox(matte(),p.x,p.y,p.z,.008,.03,.04,.004,{segments:1,col:dark});}
  if(v===2&&buildLod<2)for(let i=0;i<5;i++){onHead((i-2)*.2,.188,face+.001);F.ellipsoid(metal(),p.x,p.y,p.z,.0075,.0075,.0075,{nu:8,nv:5,col:gold});}
  if(v===3){const k=1.2;g.scale.setScalar(k);g.position.set(0,H.yOf(.15)*(1-k),zc*(1-k));}
 }
}

// ---- catalogue clothing ------------------------------------------------------------------
// A catalogue item is a base garment (built above) plus what makes its family and edition distinct:
// edition 1 adds utility pockets and straps, 2 adds piping and gold trim, 3 is cut oversized.
const catalogPick=n=>Number.isInteger(n)?{f:Math.floor(n/4),v:n%4}:null;
const GLOW=['plain',{roughness:.2,emissive:'#49e3f5',emissiveIntensity:1.6,tag:'glow'}];
const SEG7={0:'abcdef',1:'bc',2:'abged',3:'abgcd',4:'fgbc',5:'afgcd',6:'afgedc',7:'abc',8:'abcdefg',9:'abfgcd'};
function decorateTop(rig,a,M,B,H,C,top){
 const cat=catalogPick(a.cosmeticTop);if(!cat)return;
 const{f,v}=cat,{G,main,accent,cloth,hemY,se}=top,T=B.T,u=P.uppers[a.upper],gold=rgb('#d9b24a'),white=rgb('#ece8dd'),steel=rgb('#a4acb0'),brass=rgb('#b08d4f'),moving=rig.clothMotion,fine=buildLod<2,p={x:0,y:0,z:0},n={x:0,y:0,z:0};
 const onG=(theta,y,lift=0)=>{G.at(theta,T(y),p);G.normal(theta,T(y),n);p.x+=n.x*lift;p.y+=n.y*lift;p.z+=n.z*lift;return p;},metal=()=>part(rig.spine,...METAL),gloss=()=>part(rig.spine,...GLOSS);
 if(fine&&v===1&&f<22){
  if(!['shirt','linen','denim','workvest','field','overall','apron'].includes(u.shape))for(const s of[-1,1]){F.patch(cloth,G,{t0:s>0?.28:-.62,t1:s>0?.62:-.28,y0:T(1.19),y1:T(1.285),thick:.0045,nu:seg(6,3),nv:seg(5,3),col:tint(accent,.95)});F.patch(cloth,G,{t0:s>0?.26:-.64,t1:s>0?.64:-.26,y0:T(1.272),y1:T(1.305),thick:.006,nu:seg(6,3),nv:3,col:tint(main,.86)});stud(metal(),G,s*.45,T(1.285),.005,rgb('#b9bdc0'),.007);}
  if(u.sleeve>.15){const low=Math.max(-.16,-u.sleeve*.75+.02);F.patch(part(rig.armL,top.fabric),B.arm(-1).offset(se+.002),{t0:-2.1,t1:-1.05,y0:low,y1:low+.075,thick:.0045,nu:4,nv:4,col:tint(accent,.95)});}}
 if(fine&&v===2&&f<22){if(!top.opening)for(const s of[-1,1])F.tube(cloth,[[.2,1.43],[.5,1.33],[.78,1.18],[.95,1],[1,hemY+.03]].map(([th,y])=>{onG(s*th,y,.002);return[p.x,p.y,p.z];}),.0042,{sides:5,segments:seg(16,6),col:accent});for(let i=0;i<4;i++)stud(metal(),G,0,T(hemY+.1+i*.085),.0065,gold,.004);}
 if(f===19&&fine){const num=String(10+P.hash('jersey'+a.id)%90);
  const digit=(d,tc,yc,h,wt)=>{const on=SEG7[d],st=h*.15,sw=wt*.28,h2=h/2,bar=(t0,t1,y0,y1)=>F.patch(cloth,G,{t0,t1,y0:T(y0),y1:T(y1),thick:.004,nu:3,nv:3,col:accent,bevel:.34});
   if(on.includes('a'))bar(tc-wt/2,tc+wt/2,yc+h2-st,yc+h2);if(on.includes('g'))bar(tc-wt/2,tc+wt/2,yc-st/2,yc+st/2);if(on.includes('d'))bar(tc-wt/2,tc+wt/2,yc-h2,yc-h2+st);
   if(on.includes('f'))bar(tc-wt/2,tc-wt/2+sw,yc,yc+h2);if(on.includes('b'))bar(tc+wt/2-sw,tc+wt/2,yc,yc+h2);if(on.includes('e'))bar(tc-wt/2,tc-wt/2+sw,yc-h2,yc);if(on.includes('c'))bar(tc+wt/2-sw,tc+wt/2,yc-h2,yc);};
  for(const[base,h,wt]of[[0,.1,.26],[Math.PI,.13,.3]])for(let i=0;i<2;i++)digit(num[i],base+(i-.5)*(wt+.08),1.19,h,wt);
  for(const s of[-1,1])F.patch(cloth,G,{t0:s*1.57-.14,t1:s*1.57+.14,y0:T(hemY+.01),y1:T(1.2),thick:.003,nu:3,nv:6,col:accent});}
 if(f===21){const satin=rgb('#14171d');
  // Satin facings over the lapels, a bow tie and a pocket square.
  if(top.opening)for(const s of[-1,1])F.grid(gloss(),3,seg(14,5),(uu,vv,out)=>{const y=mix(top.buttonY+.01,1.43,vv),xw=top.opening(y)+.05*uu*Math.sin(Math.min(1,vv*1.25)*Math.PI*.9+.15),theta=s*top.thetaFor(xw,T(y));G.at(theta,T(y),out);G.normal(theta,T(y),n);const h=.0064+.004*Math.sin(uu*Math.PI);out.x+=n.x*h;out.y+=n.y*h;out.z+=n.z*h;out.col=satin;},{reference:()=>[0,0,1]});
  onG(0,1.425,.012);const bx=p.x,by=p.y,bz=p.z;for(const s of[-1,1])F.ellipsoid(gloss(),bx+s*.024,by,bz,.022,.013,.007,{nu:seg(10,6),nv:5,col:satin,warp:(x,y,z,w)=>{w[0]=x;w[1]=y*(.45+.55*Math.abs(x));w[2]=z;}});F.ellipsoid(gloss(),bx,by,bz+.002,.007,.008,.007,{nu:8,nv:5,col:satin});
  F.patch(part(rig.spine,'cotton',{tag:'inner'}),G,{t0:.42,t1:.62,y0:T(1.262),y1:T(1.283),thick:.004,nu:3,nv:3,col:white});}
 if(f===22){F.patch(cloth,G,{t0:-.55,t1:.55,y0:T(hemY+.03),y1:T(1.3),thick:.009,bevel:.12,nu:seg(8,4),nv:seg(12,5),col:(uu,vv)=>tint(accent,.85+.15*Math.abs(Math.sin(vv*22)))});
  for(let i=0;i<5;i++){onG(Math.PI,.95+i*.105);const sx=p.x,sy=p.y,sz=p.z;placed(cloth,mat4(sx,sy,sz+.004,-Math.PI/2+.25),()=>cone(cloth,.03,.075,tint(accent,.9),7));}
  const tail=group(rig.pelvis,'dino-tail',0,-.03,-.11),tp=part(tail,top.fabric);F.tube(tp,[[0,.03,.04],[0,-.07,-.15],[0,-.2,-.35],[0,-.27,-.58]],t=>.072*Math.pow(1-t,1.15)+.008,{sides:seg(12,6),segments:seg(18,6),col:t=>tint(main,.86+.14*Math.abs(Math.sin(t*26)))});
  for(let i=0;i<3;i++){const t=.2+i*.22;placed(tp,mat4(0,.04-t*.3,-.05-t*.5,-Math.PI/2+.7),()=>cone(tp,.02,.05,tint(accent,.9),6));}
  moving.push({node:tail,kind:'tail'});}
 if(f===23){const fluff=part(rig.spine,'fur');wrap(fluff,G,{low:T(hemY-.01),high:T(1.38),ease:(theta,y,pt)=>.012+.014*F.fbm3(pt.x*30,pt.y*30,pt.z*30,2),rows:seg(18,6),sides:seg(30,10),col:(theta,y,pt)=>tint(white,.86+.16*F.noise3(pt.x*40,pt.y*40,pt.z*40))});
  for(const side of[-1,1]){const label=side<0?'L':'R',wing=part(rig['arm'+label],'fur'),fw=part(rig['forearm'+label],'fur'),feather=(x,y,z)=>tint(white,.8+.2*(y*.5+.5));
   for(let i=0;i<4;i++){F.ellipsoid(wing,side*.03,-.05-i*.06,-.045,.03,.085,.014,{nu:seg(10,5),nv:seg(8,4),col:feather});F.ellipsoid(fw,side*.022,-.02-i*.055,-.04,.026,.09,.012,{nu:seg(10,5),nv:seg(8,4),col:feather});}}
  const tailN=part(rig.pelvis,'fur');for(const k of[-1,0,1])placed(tailN,mat4(k*.04,.06,-.13,-.9,0,k*.3),()=>F.ellipsoid(tailN,0,.07,0,.03,.1,.012,{nu:seg(10,5),nv:seg(8,4),col:tint(white,.9)}));}
 if(f===24){const hard=gloss(),grey=rgb('#9aa1a6');onG(0,1.2,.02);const cx=p.x,cy=p.y,cz=p.z;F.roundBox(hard,cx,cy,cz+.008,.17,.13,.04,.012,{segments:2,col:white});
  for(let i=0;i<3;i++)F.ellipsoid(hard,cx+(i-1)*.045,cy+.02,cz+.03,.012,.012,.006,{nu:8,nv:4,col:rgb(['#cf554f','#4fada4','#ceba62'][i])});F.roundBox(hard,cx,cy-.03,cz+.03,.11,.02,.006,.003,{segments:1,col:rgb('#20262c')});
  onG(Math.PI,1.2,.06);F.roundBox(hard,p.x,p.y+.02,p.z-.02,.25,.36,.12,.03,{segments:2,col:(x,y,z)=>tint(white,.93+.07*F.noise3(x*9,y*9,z*9))});
  for(const s of[-1,1])F.tube(part(rig.spine,'rubber'),[[.3,1.2,.03],[.9,1.14,.03],[1.6,1.08,.03],[2.4,1.12,.05]].map(([th,y,l])=>{onG(s*th,y,l);return[p.x,p.y,p.z];}),.011,{sides:6,segments:seg(18,6),col:t=>tint(grey,.8+.2*Math.abs(Math.sin(t*60)))});
  F.lathe(metal(),[[.092,-.01],[.112,-.008],[.114,.012],[.094,.018]],{sides:seg(28,10),y:T(1.455),z:.004,col:rgb('#c9ccce'),smooth:false});
  for(const side of[-1,1]){const label=side<0?'L':'R',arm=B.arm(side).offset(se+.006);band(part(rig['arm'+label],'nylon'),arm,()=>-.27,()=>-.24,{thick:.004,sides:seg(16,6),col:grey});band(part(rig['arm'+label],'nylon'),arm,()=>-.03,()=>0,{thick:.004,sides:seg(16,6),col:grey});}
  F.patch(part(rig.armL,'cotton',{tag:'inner'}),B.arm(-1).offset(se+.002),{t0:-2,t1:-1.15,y0:-.15,y1:-.1,thick:.003,nu:3,nv:3,col:rgb('#b5412f')});}
 if(f===25){const m=metal(),shine=(theta,y,pt)=>tint(steel,.9+.12*F.noise3(pt.x*30,pt.y*30,pt.z*30)),armhole=theta=>mix(1.39,1.22,smooth(.62,.92,Math.abs(Math.sin(theta)))),over=G.offset(.013);
  wrap(m,G,{low:T(.93),high:theta=>T(armhole(theta)),ease:(theta,y,pt)=>.012+.01*Math.max(0,Math.cos(theta))*gauss(pt.x,0,.022)*smooth(T(.95),T(1.25),y)+.006*gauss(y,T(.95),.02),rows:seg(18,6),sides:seg(36,12),col:shine});
  band(m,over,()=>T(.915),()=>T(.945),{thick:.004,col:brass});band(m,over,theta=>T(armhole(theta)-.02),theta=>T(armhole(theta)+.004),{thick:.004,col:brass,sides:seg(40,12)});
  for(const side of[-1,1]){const label=side<0?'L':'R',pa=part(rig['arm'+label],...METAL);F.ellipsoid(pa,side*.008,-.012,0,.07,.07,.078,{nu:seg(16,7),nv:seg(10,5),col:(x,y,z)=>tint(steel,.86+.14*y),warp:(x,y,z,w)=>{w[0]=x;w[1]=y<-.3?-.3+(y+.3)*.3:y;w[2]=z;}});band(pa,B.arm(side).offset(se+.012),()=>-.11,()=>-.06,{thick:.005,sides:seg(16,6),col:tint(steel,.9)});}
  if(fine)for(const s of[-1,1])for(let i=0;i<3;i++)stud(m,over,s*(.25+i*.22),T(1.36-i*.012),.006,gold,.004);}
}
function decorateBottom(rig,a,M,B,H,C,bot,top){
 const cat=catalogPick(a.cosmeticBottom);if(!cat)return;
 const{f,v}=cat,{legs,PS,main,accent,V}=bot,T=B.T,gold=rgb('#d9b24a'),dark=rgb('#22262b'),white=rgb('#ece8dd'),steel=rgb('#a4acb0'),moving=rig.clothMotion,fine=buildLod<2,p={x:0,y:0,z:0},pleat=(theta,y,pt)=>tint(main,.86+.16*Math.abs(Math.sin(theta*4.5)));
 for(const label of['L','R']){const leg=legs[label],side=leg.side,thighN=rig['thigh'+label],calfN=rig['calf'+label],ts=leg.ts,thigh=leg.thigh,long=!!leg.tube,tube=leg.tube,calf=leg.calf,end=leg.clothEnd??-.06,hem=leg.hem??-.352,shin=long&&hem<-.3?tube:B.calf(side);
  if(ts&&fine&&v===1){if(bot.shape!=='cargo'&&end<-.3){F.patch(thigh,ts,{t0:side*1.15,t1:side*1.95,y0:-.27,y1:-.15,thick:.008,nu:5,nv:5,col:tint(accent,.95),bevel:.2});F.patch(thigh,ts,{t0:side*1.1,t1:side*2,y0:-.165,y1:-.128,thick:.011,nu:5,nv:3,col:tint(main,.84)});}
   if(long)F.patch(thigh,ts,{t0:-.6,t1:.6,y0:-.395,y1:-.31,thick:.0035,nu:5,nv:4,col:tint(main,.8)});}
  if(ts&&fine&&v===2){F.patch(thigh,ts,{t0:side*1.57-.07,t1:side*1.57+.07,y0:end+.004,y1:.02,thick:.003,nu:3,nv:seg(10,4),col:accent});if(long){F.patch(calf,tube,{t0:side*1.57-.09,t1:side*1.57+.09,y0:hem+.004,y1:.025,thick:.003,nu:3,nv:seg(8,3),col:accent});band(calf,tube,()=>hem+.03,()=>hem+.046,{thick:.002,sides:seg(18,6),col:accent});}}
  if(f===12&&long){F.patch(part(thighN,'rubber'),ts,{t0:-.55,t1:.55,y0:-.398,y1:-.315,thick:.008,nu:5,nv:4,col:dark,bevel:.3});F.patch(part(calfN,'rubber'),tube,{t0:-.6,t1:.6,y0:-.06,y1:.028,thick:.008,nu:5,nv:3,col:dark,bevel:.3});}
  if(f===13&&ts&&fine)for(let i=0;i<3;i++){const y=-.1-i*.1;if(y-.03>end)F.patch(thigh,ts,{t0:-.95,t1:.95,y0:y-.022,y1:y,thick:.003,nu:seg(8,4),nv:3,col:tint(accent,.95)});}
  if(f===15&&ts){const satin=rgb('#14171d');F.patch(part(thighN,...GLOSS),ts,{t0:side*1.57-.06,t1:side*1.57+.06,y0:end+.004,y1:.02,thick:.003,nu:3,nv:seg(10,4),col:satin});if(long)F.patch(part(calfN,...GLOSS),tube,{t0:side*1.57-.08,t1:side*1.57+.08,y0:hem+.004,y1:.025,thick:.003,nu:3,nv:seg(8,3),col:satin});}
  if(f===16&&ts){const puff={thick:.0055,rows:3,profile:t=>Math.sin(t*Math.PI),sides:seg(18,6),col:tint(main,.95)};for(let i=0;i<6;i++){const y=-.03-i*.062;if(y-.056>end-.01)band(thigh,ts,()=>y-.056,()=>y,puff);}if(long)for(let i=0;i<4;i++){const y=.01-i*.085;band(calf,tube,()=>Math.max(hem+.002,y-.08),()=>y,puff);}}
  if(f===17&&ts){wrap(thigh,ts,{low:Math.max(end,-.4),high:.02,ease:(th,y)=>.034*Math.pow(Math.sin(clamp((.02-y)/.42,0,1)*Math.PI),.8)+.004*Math.sin(th*9),rows:seg(12,4),sides:seg(20,7),col:pleat});
   if(long){wrap(calf,tube,{low:-.12,high:.03,ease:(th,y)=>.03*smooth(-.12,-.02,y)+.004*Math.sin(th*9),rows:seg(6,3),sides:seg(20,7),col:pleat});band(calf,tube,()=>-.135,()=>-.1,{thick:.004,sides:seg(18,6),col:accent});}}
  if(f===19&&long){band(calf,tube,()=>hem-.002,()=>hem+.036,{thick:.005,sides:seg(18,6),col:accent});if(fine)for(let i=0;i<3;i++)stud(part(calfN,...METAL),tube,side*1.57,hem+.055+i*.03,.006,gold,.004);}
  if(f===20||f===21){const m=part(calfN,...METAL),gs=shin.offset(f===21?.012:.009),tone=f===21?rgb('#879a9d'):steel,shine=(theta,y,pt)=>tint(tone,.9+.12*F.noise3(pt.x*30,pt.y*30,pt.z*30));
   F.loft(m,gs,{sides:seg(16,6),rows:seg(8,3),from:-.025,to:-.335,capStart:'round',capStartHeight:.012,col:shine});band(m,gs,()=>-.34,()=>-.315,{thick:.003,sides:seg(16,6),col:tint(tone,.7)});
   gs.at(0,-.005,p);F.ellipsoid(m,p.x,p.y+.012,p.z-.012,.05,.052,.032,{nu:seg(12,6),nv:seg(8,4),col:(x,y,z)=>tint(tone,.85+.15*z)});
   if(f===21&&ts){const tm=part(thighN,...METAL),tg=ts.offset(.01);F.loft(tm,tg,{sides:seg(16,6),rows:seg(8,3),from:-.07,to:-.365,col:shine});band(tm,tg,()=>-.23,()=>-.21,{thick:.003,sides:seg(16,6),col:rgb('#20262c')});band(m,gs,()=>-.19,()=>-.17,{thick:.003,sides:seg(16,6),col:rgb('#20262c')});}
   else if(fine)for(let i=0;i<3;i++)stud(m,gs,side*1.57,-.07-i*.09,.006,gold,.003);}
  if(f===24){const suit=part(calfN,'nylon'),grey=rgb('#9aa1a6');wrap(suit,shin,{low:-.34,high:-.02,ease:(th,y)=>.02+.006*Math.sin(y*70),rows:seg(10,4),sides:seg(18,6),col:(th,y,pt)=>tint(white,.92+.08*F.noise3(pt.x*20,pt.y*20,pt.z*20))});const rim=shin.offset(.022);band(suit,rim,()=>-.06,()=>-.02,{thick:.005,sides:seg(18,6),col:grey});band(suit,rim,()=>-.345,()=>-.315,{thick:.005,sides:seg(18,6),col:grey});}
  if(f===22&&ts&&fine)for(let i=0;i<3;i++){ts.at(Math.PI,-.09-i*.1,p);const sx=p.x,sy=p.y,sz=p.z;placed(thigh,mat4(sx,sy,sz+.004,-Math.PI/2+.2),()=>cone(thigh,.024,.055,tint(accent,.9),6));}
  if(f===23){const yellow=rgb('#e2a544');if(ts)wrap(part(thighN,'fur'),ts,{low:Math.max(end-.03,-.4),high:.02,ease:(th,y,pt)=>.014+.014*F.fbm3(pt.x*30,pt.y*30,pt.z*30,2),rows:seg(10,4),sides:seg(20,7),col:(th,y,pt)=>tint(white,.86+.16*F.noise3(pt.x*40,pt.y*40,pt.z*40))});
   if(!long)F.loft(part(calfN,'leather'),B.calf(side).offset(.003),{sides:seg(14,6),rows:seg(12,4),from:.005,to:-.392,capStart:'round',col:(theta,y)=>tint(yellow,.84+.16*Math.abs(Math.sin(y*90)))});}
 }
 if(f===14&&top&&fine){const G=top.G,bib=part(rig.spine,bot.fabric),n={x:0,y:0,z:0};F.patch(bib,G,{t0:-.42,t1:.42,y0:T(1.02),y1:T(1.27),thick:.005,nu:8,nv:6,col:tint(main,.94)});
  for(const s of[-1,1]){const pts=[];for(const[th,y,k]of[[.3,1.25,1],[.5,1.42,.6],[Math.PI-.5,1.42,.6],[Math.PI-.3,1.05,1]]){G.at(s*th,T(y),p);pts.push([p.x*(k<1?.96:1),p.y+(k<1?.014:0),p.z*(k<1?.55:1)+(th<1.6?.004:-.004)]);}F.tube(bib,pts,[.006,.02],{sides:6,segments:seg(18,6),col:tint(main,.88)});stud(part(rig.spine,...METAL),G,s*.3,T(1.25),.009,rgb('#b7a06a'),.008);}}
 if(f===18||f===25){const node=group(rig.pelvis,'catalog-long-skirt'),sk=part(node,bot.fabric);moving.push({node,kind:'skirt'});
  wrap(sk,{at:(theta,y,out)=>{PS.at(theta,V(.86),out);const drop=V(.86)-y,fold=1+.014*Math.sin(theta*12)*smooth(0,.3,drop);out.x*=(1+drop*.9)*fold;out.z*=(1+drop*1.5)*fold;out.y=y;return out;},normal:(theta,y,out)=>{out.x=Math.sin(theta);out.y=.3;out.z=Math.cos(theta);return out;}},{low:V(.1),high:V(.9),ease:.004,rows:seg(16,5),sides:seg(44,12),col:(theta,y,pt)=>tint(f===25&&y<V(.17)?accent:main,.84+.2*Math.abs(Math.sin(theta*6)))});}
 if(v===3&&fine){band(part(rig.pelvis,'leather'),PS,()=>bot.top-.03,()=>bot.top+.004,{thick:.007,col:tint(accent,.8)});F.patch(part(rig.pelvis,...METAL),PS,{t0:-.13,t1:.13,y0:bot.top-.036,y1:bot.top+.01,thick:.01,nu:3,nv:3,col:rgb('#b9b3a0')});}
}
// Sways the few moving pieces (tails and long skirts) with the walk.
function animateExtras(rig,state,time){const list=rig.clothMotion;if(!list||!list.length)return;const amount=Math.min(1,Math.abs(state.speed||0)/6);for(const item of list){if(item.kind==='tail'){item.node.rotation.y=Math.sin(time*6+rig.phase)*.16*amount+Math.sin(time*1.3+rig.phase)*.05;item.node.rotation.x=.06*amount;}else if(item.kind==='skirt'){item.node.rotation.z=Math.sin(time*5)*.025*amount;item.node.rotation.x=-.05*amount;}}}

// ---- armour vests ------------------------------------------------------------------------
// A plate carrier cut from the torso: front and back panels, shoulder straps and a dark cummerbund.
// Heavier tiers add hard plates, webbing rows, pouches and a label.
const VEST_GLYPHS={S:['111','100','111','001','111'],W:['101','101','101','111','101'],A:['010','101','111','101','101'],T:['111','010','010','010','010']};
function buildArmor(rig,a,M,B,H,top){
 const tier=a.armorVest;if(!tier)return;const t=tier==='simple'?0:tier==='reinforced'?1:2,g=group(rig.spine,'armor-vest-'+tier);rig.armorRoot=g;rig.clothingNodes.armor=g;g.userData.tier=tier;
 const T=B.T,base=top&&top.G||B.torso,V=base.offset(.011+t*.003),cloth=part(g,'canvas'),hard=part(g,'nylon'),clothC=rgb(['#52636b','#49564c','#26353e'][t]),plateC=rgb(['#697b80','#687366','#3c4b54'][t]),trimC=rgb(['#34464e','#283c32','#162730'][t]),stitch=rgb('#a1aba2'),fine=buildLod<2,p={x:0,y:0,z:0},n={x:0,y:0,z:0};
 const armhole=theta=>mix(1.375,1.2,smooth(.6,.9,Math.abs(Math.sin(theta)))),side=theta=>smooth(.72,.86,Math.abs(Math.sin(theta)));
 wrap(cloth,V,{low:T(.985),high:theta=>T(armhole(theta)),ease:0,rows:seg(16,5),sides:seg(36,12),col:(theta,y,pt)=>tint(side(theta)>.5?trimC:clothC,.9+.12*F.fbm3(pt.x*30,pt.y*30,pt.z*30,2))});
 band(cloth,V,()=>T(.975),()=>T(1.0),{thick:.003,col:trimC});band(cloth,V,theta=>T(armhole(theta)-.016),theta=>T(armhole(theta)+.004),{thick:.003,col:trimC,sides:seg(40,12)});
 for(const s of[-1,1]){const pts=[];for(const[th,y,k]of[[.5,1.37,1],[.62,1.44,.55],[Math.PI-.62,1.44,.55],[Math.PI-.5,1.37,1]]){V.at(s*th,T(y),p);pts.push([p.x*(k<1?.96:1),p.y+(k<1?.012:0),p.z*k]);}F.tube(cloth,pts,[.006+t*.002,.024+t*.004],{sides:6,segments:seg(16,6),col:trimC});
  if(t>=1){V.at(s*.6,T(1.445),p);F.roundBox(hard,p.x*.96,p.y+.02,0,.07,.016,.09,.008,{segments:2,col:plateC});}}
 if(t>=1)for(const c0 of[0,Math.PI])F.patch(hard,V,{t0:c0-.6,t1:c0+.6,y0:T(1.02),y1:T(1.33),thick:.008,bevel:.14,nu:seg(10,4),nv:seg(10,4),col:plateC});
 if(t>=1&&fine)for(let i=0;i<3;i++)F.patch(cloth,V,{t0:-.56,t1:.56,y0:T(1.14+i*.04),y1:T(1.156+i*.04),thick:.0115,nu:seg(8,3),nv:3,col:trimC,bevel:.34});
 if(t===0&&fine)for(const s of[-1,1])F.patch(cloth,V,{t0:s*.3-.02,t1:s*.3+.02,y0:T(1.0),y1:T(1.34),thick:.0025,nu:3,nv:6,col:stitch});
 if(t===2){const pouch=(tc,w,y0,y1)=>{F.patch(cloth,V,{t0:tc-w,t1:tc+w,y0:T(y0),y1:T(y1),thick:.034,bevel:.22,nu:4,nv:4,col:clothC});F.patch(hard,V,{t0:tc-w*1.04,t1:tc+w*1.04,y0:T(y1-.04),y1:T(y1+.004),thick:.038,bevel:.3,nu:4,nv:3,col:plateC});};
  pouch(-.36,.15,.995,1.115);pouch(0,.15,.995,1.115);pouch(.36,.15,.995,1.1);pouch(-.78,.11,1.14,1.23);
  V.at(-.78,T(1.23),p);F.tube(hard,[[p.x,p.y,p.z+.03],[p.x-.004,p.y+.09,p.z+.02]],.004,{sides:5,segments:3,col:trimC});
  if(fine){F.patch(hard,V,{t0:-.36,t1:.36,y0:T(1.262),y1:T(1.328),thick:.012,nu:6,nv:3,col:trimC,bevel:.2});
   const cell=(theta,y,w,hh)=>{const ids=[];V.normal(theta,T(y),n);for(const[du,dv]of[[-1,-1],[1,-1],[1,1],[-1,1]]){V.at(theta+du*w,T(y+dv*hh),p);ids.push(hard.vertex(p.x+n.x*.0142,p.y+n.y*.0142,p.z+n.z*.0142,stitch));}hard.quad(ids[0],ids[1],ids[2],ids[3]);};
   'SWAT'.split('').forEach((ch,i)=>VEST_GLYPHS[ch].forEach((row,r)=>{for(let k=0;k<3;k++)if(row[k]==='1')cell(-.245+(i*4+k)*.035,1.315-r*.0085,.015,.0037);}));}
 }
}

// ---- things people hold ----------------------------------------------------------------
// Hand props sit on the palm side of the hand (the hand's -z), so the fingers close around them. Apart from the
// phone they are only modelled the first time they are shown: most people never drink, photograph or parachute.
function lazyProp(rig,root,node,fill){node.visible=false;node.userData.fill=()=>{const previous=[buildDetail,buildLod];setQuality(rig.detail,rig.lod);try{fill();flushParts(node);batchNode(node);node.traverse(o=>{if(o.isMesh)rig.loose?.push({mesh:o,region:goreRegion(root,o),visible:true});});}finally{setQuality(previous[0],previous[1]);}};}
function showProp(node,on){if(on&&node.userData.fill){const fill=node.userData.fill;node.userData.fill=null;fill();}node.visible=!!on;}
function buildProps(rig,root){
 const hand=rig.handR;
 rig.propRoot=group(hand,'routine-prop');phoneModel(rig.propRoot);rig.propRoot.visible=false;
 // The fingers that wrap the phone: modelled the first time a phone is held, and only where the hand has fingers.
 rig.phoneGrip=group(hand,'phone-grip');lazyProp(rig,root,rig.phoneGrip,()=>phoneGrip(rig,rig.phoneGrip));
 // Take-away cup with a lid and a card sleeve.
 rig.cup=group(hand,'cup-prop',0,-.068,-.046);lazyProp(rig,root,rig.cup,()=>{const cup=part(rig.cup,...MATTE);F.lathe(cup,[[0,-.058],[.027,-.058],[.029,-.05],[.0385,.05],[.04,.052],[.04,.056],[0,.056]],{sides:seg(18,8),col:(angle,y)=>y>-.02&&y<.028?rgb('#8a6a46'):rgb('#e7e2d6'),smooth:false});F.lathe(cup,[[.041,.05],[.042,.058],[.036,.066],[.02,.068],[0,.068]],{sides:seg(18,8),col:rgb('#2b2b2b'),smooth:false});});
 // Compact camera: body, grip, lens barrel and a shutter button.
 rig.photoCamera=group(hand,'camera-prop',0,-.06,-.05);lazyProp(rig,root,rig.photoCamera,()=>{const cam=part(rig.photoCamera,...MATTE),lens=part(rig.photoCamera,...GLOSS);F.roundBox(cam,0,0,0,.128,.078,.046,.01,{segments:3,col:rgb('#24282d')});F.roundBox(cam,.046,-.002,-.012,.03,.07,.03,.01,{segments:2,col:rgb('#17191c')});F.roundBox(cam,-.03,.044,0,.04,.012,.03,.004,{segments:1,col:rgb('#2f343a')});
  const from=lens.count;F.lathe(lens,[[.031,0],[.033,.004],[.033,.03],[.029,.036],[.022,.037],[.02,.032],[.012,.03],[0,.03]],{sides:seg(18,8),col:(angle,y,p)=>Math.hypot(p.x,p.z)<.021?rgb('#0a0c10'):rgb('#3a3f45'),smooth:false});lens.warp(from,(x,y,z,out)=>{out[0]=x-.012;out[1]=-z;out[2]=.023+y;});
  F.ellipsoid(part(rig.photoCamera,...METAL),.044,.041,.004,.008,.004,.008,{nu:seg(10,6),nv:4,col:rgb('#c9ccce')});});
 // Parcel: a taped cardboard box carried in both arms.
 rig.package=group(hand,'package-prop',-.13,-.05,.09);lazyProp(rig,root,rig.package,()=>{const box2=part(rig.package,...MATTE),card=rgb('#a98a5f');F.roundBox(box2,0,0,0,.34,.26,.25,.008,{segments:2,col:(x,y,z)=>tint(card,.9+.14*F.fbm3(x*14,y*14,z*14,2))});F.roundBox(box2,0,.131,0,.06,.003,.252,.001,{segments:1,col:rgb('#d8c79d')});F.roundBox(box2,0,0,.126,.06,.262,.003,.001,{segments:1,col:rgb('#d8c79d')});F.roundBox(box2,.09,.02,.1265,.09,.06,.002,.001,{segments:1,col:rgb('#ece8dd')});});
 // Paper carrier bag with cord handles.
 rig.shoppingBag=group(hand,'shopping-bag',0,-.20,0);lazyProp(rig,root,rig.shoppingBag,()=>{const bag=part(rig.shoppingBag,...MATTE),paper=rgb('#c3a17b');F.roundBox(bag,0,-.105,0,.21,.27,.095,.006,{segments:2,col:(x,y,z)=>tint(paper,(y>.02?.86:1)*(.92+.1*F.noise3(x*30,y*8,z*30)))});for(const zz of[-.03,.03])F.tube(bag,[[-.06,.03,zz],[-.05,.14,zz*.4],[.05,.14,zz*.4],[.06,.03,zz]],.0035,{sides:5,segments:10,col:rgb('#6d6257')});});
 // V5.7, eating a delivered order: the paper bag it came in (placed by the animation in the model's own space, its
 // origin at the middle of its base), a fistful of what was inside, and what ends up on the face. All of it is
 // only modelled the first time someone eats an order.
 rig.feastBag=group(root,'feast-bag');lazyProp(rig,root,rig.feastBag,()=>{const bag=part(rig.feastBag,...MATTE),paper=rgb('#c79f63');
  F.roundBox(bag,0,.15,0,.26,.30,.15,.008,{segments:2,col:(x,y,z)=>tint(paper,(y>.27?.82:1)*(.92+.1*F.noise3(x*26,y*8,z*26)))});
  F.roundBox(bag,0,.299,0,.225,.006,.115,.002,{segments:1,col:rgb('#3b2a17')});
  F.roundBox(bag,0,.15,.0765,.105,.105,.004,.003,{segments:1,col:rgb('#19a48f')});F.roundBox(bag,0,.142,.0792,.05,.05,.003,.002,{segments:1,col:rgb('#f4fbf9')});
  for(const zz of[-.05,.05])F.tube(bag,[[-.06,.295,zz],[-.05,.385,zz*.7],[.05,.385,zz*.7],[.06,.295,zz]],.0045,{sides:5,segments:10,col:rgb('#8a6a3c')});});
 rig.gunk=group(hand,'feast-gunk',0,-.1,-.045);lazyProp(rig,root,rig.gunk,()=>{const goo=part(rig.gunk,...GLOSS);
  for(const[x,y,z,a,b,c,col]of[[0,0,0,.046,.04,.036,'#8a5a2b'],[.024,.012,-.012,.027,.023,.021,'#d6a11e'],[-.022,-.01,-.014,.025,.021,.019,'#b63a22'],[.004,.028,-.02,.021,.015,.017,'#6e9b3c'],[-.014,.022,.014,.021,.019,.017,'#e9dfc6'],[.01,-.03,.008,.02,.024,.018,'#6f4420']])F.ellipsoid(goo,x,y,z,a,b,c,{nu:seg(12,7),nv:6,col:rgb(col)});});
 const HM=rig.headModel;if(HM?.surf&&rig.head){
  // a point on the face: theta is the angle round the head from straight ahead, y the height above the chin line
  const at=(theta,y)=>{const o={x:0,y:0,z:0};HM.surf.at(theta,clamp(y,HM.surf.y0,HM.surf.y1),o);return[o.x,o.y,o.z];},mouthY=HM.noseTip.y-.036,browY=HM.eye.y+.05,a0=at(0,mouthY),b0=at(0,browY);
  const splats=(node,origin,list)=>lazyProp(rig,root,node,()=>{const goo=part(node,...GLOSS);for(const[theta,y,rx,ry,rz,col,out=0]of list){const p=at(theta,y);F.ellipsoid(goo,p[0]-origin[0],p[1]-origin[1],p[2]-origin[2]+out,rx,ry,rz,{nu:seg(12,7),nv:6,col:rgb(col)});}/* so first person hides it with the head */rig.visibilityRevision=(rig.visibilityRevision||0)+1;});
  // each: angle round the head, height, half-width, half-height, thickness, colour, how far it stands off the face
  rig.faceGunkA=group(rig.head,'feast-face-a',a0[0],a0[1],a0[2]);splats(rig.faceGunkA,a0,[[0,mouthY,.05,.032,.012,'#8a5a2b',.003],[.36,mouthY+.02,.03,.016,.01,'#d6a11e',.003],[-.2,mouthY-.036,.012,.03,.009,'#b63a22',.003],[.64,HM.eye.y-.038,.03,.022,.01,'#6f4420',.003],[-.42,mouthY+.004,.012,.01,.008,'#6e9b3c',.004],[.14,mouthY-.03,.009,.008,.008,'#e9dfc6',.004],[0,HM.noseTip.y,.015,.013,.012,'#e9dfc6',HM.noseTip.z-at(0,HM.noseTip.y)[2]]]);
  rig.faceGunkB=group(rig.head,'feast-face-b',b0[0],b0[1],b0[2]);splats(rig.faceGunkB,b0,[[.1,browY,.044,.018,.01,'#8a5a2b',.003],[-.3,browY+.014,.02,.012,.008,'#6e9b3c',.003],[-.62,HM.eye.y-.042,.031,.024,.01,'#d6a11e',.003],[-.36,HM.eye.y,.019,.012,.009,'#e9dfc6',.004],[.05,HM.surf.y0+.03,.02,.022,.01,'#b63a22',.003],[.9,HM.eye.y+.01,.014,.02,.008,'#6e9b3c',.003],[.5,browY+.02,.01,.009,.007,'#d6a11e',.004],[-.78,HM.eye.y-.085,.011,.014,.008,'#8a5a2b',.004]]);}
 // Parachute: canopy with coloured gores, harness and lines.
 rig.canopy=group(root,'parachute');rig.harness=group(rig.pelvis,'parachute-harness');rig.harness.visible=false;rig.suspension=[];
 lazyProp(rig,root,rig.canopy,()=>{const silk=part(rig.canopy,'nylon',{side:THREE.DoubleSide,tag:'canopy'}),tones=[rgb('#d7a95d'),rgb('#c9553f'),rgb('#e9e2d0')];
  F.lathe(silk,[[.05,3.46],[.62,3.42],[1.16,3.29],[1.52,3.1],[1.7,2.92]],{sides:seg(24,12),scaleZ:.52,col:(angle,y)=>tint(tones[Math.floor(((angle/TAU*12)%12+12)%12)%3],.86+.14*Math.sin(y*9))});
  const webbing=material('#434d4e'),buckle=material('#a9a99c',.45,.3);for(const side of[-1,1]){curve(rig.harness,webbing,[[side*.12,-.06,.13],[side*.17,.12,.14],[side*.15,.47,.035],[side*.12,.20,-.13]],.016);curve(rig.harness,webbing,[[side*.08,-.12,.06],[side*.15,-.04,.13],[side*.17,.035,-.08],[side*.08,-.12,.06]],.015);box(rig.harness,buckle,side*.13,.19,.145,.044,.05,.014);}curve(rig.harness,webbing,[[-.15,.22,.135],[0,.20,.145],[.15,.22,.135]],.016);box(rig.harness,webbing,0,.22,-.14,.25,.33,.08);batchNode(rig.harness);
  for(const x of[-1.5,1.5])for(const z of[-.7,.7]){const rope=mesh(rig.canopy,new THREE.CylinderGeometry(.006,.006,1,6),material('#d6d5c6'));rope.userData.dynamic=true;const clip=group(rig.harness,'suspension-clip',Math.sign(x)*.16,.44,Math.sign(z)*.075);rig.suspension.push({rope,clip,top:new THREE.Vector3(x,2.99,z)});}});
}

// ---- putting a person together ---------------------------------------------------------
function buildRig(root,a,M){
 const b=M.b,rig={appearance:a,bones:{},sockets:{},clothingNodes:{},phase:P.hash(a.id)%628/100,travel:0,blendSpeed:0,mode:'idle',weaponId:null,weapon:null,lod:buildLod,detail:buildDetail,measure:M};
 rig.pelvis=group(root,'pelvis',0,.88,0);rig.spine=group(rig.pelvis,'spine',0,.13,0);rig.chest=group(rig.spine,'chest',0,.10,0);rig.neck=group(rig.chest,'neck',0,.37,0);rig.head=group(rig.neck,'head',0,.04,0);
 for(const side of[-1,1]){const label=side<0?'L':'R';
  rig['thigh'+label]=group(rig.pelvis,'thigh'+label,side*M.hipX,-.015,0);rig['calf'+label]=group(rig['thigh'+label],'calf'+label,0,-.40,0);rig['foot'+label]=group(rig['calf'+label],'foot'+label,0,-.39,0);
  rig['clavicle'+label]=group(rig.chest,'clavicle'+label,side*M.jointX,.25,0);rig['arm'+label]=group(rig['clavicle'+label],'arm'+label);rig['forearm'+label]=group(rig['arm'+label],'forearm'+label,0,-.28,0);rig['hand'+label]=group(rig['forearm'+label],'hand'+label,0,-.26,0);
 }
 return rig;
}
function buildModel(a=P.presets[0],options={}){
 if(P.validateAppearance(a).length)throw new Error('Incompatible character appearance');
 const M=measure(a),b=M.b,root=new THREE.Group();root.name=a.id;root.userData.modelDetail=buildDetail;root.scale.set(a.widthScale,b.height*a.heightScale/1.8,a.widthScale);
 const rig=buildRig(root,a,M);root.userData.rig=rig;root.userData.appearanceKey=P.appearanceKey(a);root.userData.asset={provenance:'Original procedural Platdo mesh',forward:'+Z',units:'meters',origin:'soles',adult:true};
 const B=bodySurfaces(M),H=headModel(a,M),cover=hatCover(a);
 rig.body=B;rig.headModel=H;
 buildHead(rig,a,M,H,SCALP_TINT[a.hair]??(HAIR[a.hair]&&HAIR[a.hair].t<.012?.3:.12));if(cover<2)buildHair(rig,a,M,H,cover===1);buildBeard(rig,a,M,H);buildNeck(rig,B,H);
 dress(rig,a,M,B,H);
 for(const side of[-1,1]){const label=side<0?'L':'R';buildHand(rig,H,M,side,label);rig.sockets['hand'+label]=group(rig['hand'+label],'socket-hand'+label,0,-.025,.015);rig['toe'+label]=group(rig['foot'+label],'toe'+label,0,-.018,.16);}
 rig.clothingNodes.upper=rig.spine;rig.clothingNodes.lower=[rig.thighL,rig.thighR];rig.clothingNodes.shoes=[rig.footL,rig.footR];rig.sockets.head=rig.head;rig.sockets.primaryGrip=rig.sockets.handR;rig.sockets.supportGrip=rig.sockets.handL;rig.weaponRoot=group(root,'weapon-root');
 buildProps(rig,root);
 finalize(root,rig);
 rig.bindPositions={};for(const[key,value]of Object.entries(rig))if(value?.isObject3D&&key!=='canopy'&&key!=='weaponRoot'&&key!=='propRoot'&&key!=='phoneGrip'){rig.bones[key]=value;rig.bindPositions[key]=value.position.clone();}
 animate(root,{mode:'idle',speed:0},0,1);root.updateMatrixWorld(true);return root;
}
function create(a=P.presets[0],options={}){const previous=[buildDetail,buildLod];setQuality(options.modelDetail||5,options.lod||0);try{return buildModel(a,options);}finally{setQuality(previous[0],previous[1]);}}
// ---- one draw call per material ---------------------------------------------------------
// Every fixed piece is merged into a few meshes (head and body, per material) that follow the bones through
// rigid skinning: each vertex belongs wholly to one bone, so limbs move exactly as separate pieces would,
// and a region can still be removed bone by bone. Props that are switched on and off stay ordinary meshes.
// At middle distance every fabric shares one material and every hard or shiny piece another.
function midClass(own){const m=own.material,kind=m.userData.forge;if(kind==='face'||kind==='skin'||kind==='hair'||m.emissiveIntensity>0&&m.emissive&&m.emissive.getHex()>0)return own;const hard=m.metalness>=.3||m.roughness<.45,material=hard?F.material('plain',{metalness:.35,roughness:.36,tag:'mid-hard'}):F.material('cotton',{tag:'mid'});return{key:material.uuid,material,colour:own.colour};}
function finalize(root,rig){
 flushParts(root);
 const loose=[rig.propRoot,rig.phoneGrip,rig.cup,rig.photoCamera,rig.package,rig.shoppingBag,rig.feastBag,rig.gunk,rig.faceGunkA,rig.faceGunkB,rig.canopy,rig.harness,rig.weaponRoot].filter(Boolean),looseSet=new Set(loose);for(const node of loose)batchNode(node);
 const anchors=new Set();for(const value of Object.values(rig)){if(value?.isObject3D)anchors.add(value);else if(Array.isArray(value))for(const item of value)if(item?.isObject3D)anchors.add(item);}
 for(const move of rig.clothMotion||[])if(move.node)anchors.add(move.node);for(const node of loose)anchors.delete(node);
 root.updateMatrixWorld(true);const rootInverse=new THREE.Matrix4().copy(root.matrixWorld).invert(),bones=[],boneIndex=new Map(),batches=new Map(),consumed=[],matrix=new THREE.Matrix4();
 root.traverse(o=>{const twoSided=buildLod>1&&o.isMesh&&!o.isSkinnedMesh&&!o.userData.dynamic&&!o.userData.goreCap&&!o.material?.transparent&&o.material?.side===THREE.DoubleSide;/* V9.1: far models take these in too */if(!mergeable(o)&&!twoSided)return;let anchor=null;for(let at=o.parent;at&&at!==root;at=at.parent){if(looseSet.has(at))return;if(!anchor&&anchors.has(at))anchor=at;}anchor??=root;
  let index=boneIndex.get(anchor);if(index===undefined){index=bones.length;bones.push(anchor);boneIndex.set(anchor,index);}
  // Only the nearest model keeps its head apart (it is hidden in first person); the farthest is one mesh.
  let head=false;if(buildLod===0)for(let at=anchor;at&&at!==root;at=at.parent)if(at===rig.neck){head=true;break;}
  const own=materialClass(o.material),cls=buildLod>1?{key:'far',material:F.material('plain',{roughness:.86,tag:'far'}),colour:own.colour}:buildLod===1?midClass(own):own,key=(head?'head|':'body|')+cls.key;let batch=batches.get(key);if(!batch){batch={cls,head,items:[]};batches.set(key,batch);}
  matrix.multiplyMatrices(rootInverse,o.matrixWorld);const baked=bakedGeometry(o.geometry,matrix,own.colour);batch.items.push({bone:index,geometry:baked});
  if(twoSided&&baked.index){const back=baked.clone(),a=back.index.array;for(let k=0;k<a.length;k+=3){const t=a[k+1];a[k+1]=a[k+2];a[k+2]=t;}const n=back.attributes.normal;if(n)for(let k=0;k<n.count;k++)n.setXYZ(k,-n.getX(k),-n.getY(k),-n.getZ(k));batch.items.push({bone:index,geometry:back});}
  consumed.push(o);});
 for(const o of consumed){if(!o.geometry.userData.shared)o.geometry.dispose();o.removeFromParent();}
 const skeleton=new THREE.Skeleton(bones);rig.skeleton=skeleton;rig.skinned=[];rig.boneRegion=bones.map(bone=>goreRegion(root,bone));rig.legBone=bones.map(bone=>{for(let at=bone;at&&at!==root;at=at.parent){if(at===rig.footL||at===rig.footR)return false;if(at===rig.thighL||at===rig.thighR)return true;}return false;});
 for(const batch of batches.values()){
  batch.items.sort((p,q)=>p.bone-q.bone);const geometry=F.mergeGeometries(batch.items.map(item=>item.geometry)),count=geometry.attributes.position.count,skinIndex=new Uint16Array(count*4),skinWeight=new Float32Array(count*4),ranges=[];let v=0,i0=0;
  for(const item of batch.items){const n=item.geometry.attributes.position.count,ic=item.geometry.index?item.geometry.index.count:n;for(let k=0;k<n;k++){skinIndex[(v+k)*4]=item.bone;skinWeight[(v+k)*4]=1;}const last=ranges[ranges.length-1];if(last&&last.bone===item.bone)last.count+=ic;else ranges.push({bone:item.bone,start:i0,count:ic});v+=n;i0+=ic;item.geometry.dispose();}
  geometry.setAttribute('skinIndex',new THREE.BufferAttribute(skinIndex,4));geometry.setAttribute('skinWeight',new THREE.BufferAttribute(skinWeight,4));
  const mesh=new THREE.SkinnedMesh(geometry,batch.cls.material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=(batch.head?'head ':'body ')+(batch.cls.material.name||batch.cls.key);mesh.userData.part=batch.head?'head':'body';mesh.userData.ranges=ranges;mesh.userData.sourceIndex=geometry.index;
  // A ragdoll can lie well away from where the model stands, so the culling sphere is generous and fixed.
  mesh.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,.9,0),2.6);geometry.boundingSphere=mesh.boundingSphere.clone();
  root.add(mesh);mesh.updateMatrixWorld(true);if(rig.skinned.length)mesh.bind(skeleton,mesh.matrixWorld);else mesh.bind(skeleton);rig.skinned.push(mesh);
 }
 rig.loose=[];root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh)rig.loose.push({mesh:o,region:goreRegion(root,o),visible:o.visible});});
}

// ---- weapons, animation, ragdoll and gore (carried over from the V2 module) ------------
function weaponModel(id){const def=P.weaponDefinition(id),root=new THREE.Group(),steel=material('#36424a',.55,.35),dark=material('#1f282d',.2,.55),trim=material('#8b7760',.1,.75),highlight=material('#a4afb0',.65,.26);root.name=def.name;const long=def.category!=='sidearm',len=def.length;
 if(def.category==='launcher'){cylinder(root,dark,0,.105,.12,.091,len,Math.PI/2);cylinder(root,trim,0,.105,-len*.37,.102,.14,Math.PI/2);cylinder(root,highlight,0,.105,len*.6,.095,.04,Math.PI/2);box(root,steel,0,-.04,0,.065,.21,.065);box(root,trim,-.056,-.023,.32,.049,.16,.078);box(root,steel,.11,.19,.14,.03,.085,.17);const round=group(root,'launcher-round',0,.105,-.14);cylinder(round,trim,0,0,0,.049,.37,Math.PI/2);const tip=mesh(round,new THREE.ConeGeometry(.049,.09,12),highlight,0,0,.23);tip.rotation.x=Math.PI/2;root.userData.magazine=round;root.userData.reloadAxis='z';}else{
 const receiver=long?.28:.18;box(root,steel,0,.06,.04,.070,.085,receiver);box(root,dark,0,-.028,-.008,.055,.15,.068).rotation.x=-.20;
 if(long){box(root,dark,0,.045,-.19,.057,.075,.24);rings(root,trim,[[.005,.047,.085,-.27],[.12,.045,.08,-.30]],8);const foreLength=len*.39;box(root,trim,0,.045,.20+foreLength*.18,.066,.08,foreLength);cylinder(root,steel,0,.072,len*.49,.018,len*.50,Math.PI/2);cylinder(root,dark,0,.072,len*.71,.023,.033,Math.PI/2);}else{cylinder(root,dark,0,.069,.149,.015,.075,Math.PI/2);box(root,highlight,0,.11,.05,.05,.018,.18);}
 const magazine=group(root,'magazine',0,-.073,long?.08:0);box(magazine,dark,0,0,0,long?.042:.041,long?.13:.085,long?.067:.04);magazine.rotation.x=long?.13:0;root.userData.magazine=magazine;
 const moving=group(root,'mechanism');box(moving,highlight,0,.09,.01,.049,.023,long?.14:.15);root.userData.mechanism=moving;
 if(def.category==='precision'){cylinder(root,dark,0,.176,.07,.027,.23,Math.PI/2);for(const z of[-.02,.15])box(root,steel,0,.13,z,.026,.058,.022);cylinder(root,highlight,0,.176,.193,.029,.02,Math.PI/2);}
 if(def.category==='shotgun'){cylinder(root,dark,0,.029,.42,.015,.44,Math.PI/2);box(root,trim,0,.043,.40,.080,.075,.16);}
 if(def.category==='compact'){box(root,dark,0,.07,-.16,.06,.085,.14);box(root,steel,0,.133,.04,.02,.047,.09);}
 for(const z of[-.012,long?.24:.135])box(root,dark,0,.121,z,.017,.018,.018);
 curve(root,dark,[[-.025,-.019,-.02],[-.032,-.078,.064],[.032,-.078,.064],[.025,-.019,.04]],.004);
 }
 const muzzle=group(root,'muzzle',0,def.category==='launcher'?.105:.072,def.category==='launcher'?len*.63:long?len*.74:.190);const flash=mesh(muzzle,new THREE.ConeGeometry(.045,.19,7),material('#ffcb75',0,.4),0,0,.07);flash.rotation.x=Math.PI/2;flash.visible=false;flash.userData.dynamic=true;root.userData.flash=flash;root.userData.muzzle=muzzle;root.userData.definition=def;root.userData.primaryGrip=group(root,'primary-grip',...def.primaryGrip);root.userData.supportGrip=group(root,'support-grip',...def.supportGrip);if(root.userData.magazine){root.userData.magazine.userData.homePosition=root.userData.magazine.position.clone();root.userData.magazine.userData.homeRotation=root.userData.magazine.rotation.clone();}batchNode(root);return root;
}
function setWeapon(model,id){const r=model.userData.rig;const normalized=id&&id!=='unarmed'&&id!=='holstered'?P.weaponDefinition(id).id:null;if(r.weaponId===normalized)return;r.weaponId=normalized;r.visibilityRevision=(r.visibilityRevision||0)+1;for(const child of [...r.weaponRoot.children]){dispose(child);r.weaponRoot.remove(child);}r.weapon=null;delete r.sockets.ejection;if(normalized){r.weapon=weaponModel(normalized);r.weaponRoot.add(r.weapon);r.sockets.muzzle=r.weapon.userData.muzzle;if(r.weapon.userData.definition.category!=='launcher'){const long=r.weapon.userData.definition.category!=='pistol';r.sockets.ejection=group(r.weapon,'ejection',.038,.085,long?.06:.025);}}else delete r.sockets.muzzle;}
const down=new THREE.Vector3(0,-1,0),qa=new THREE.Quaternion(),qb=new THREE.Quaternion(),v1=new THREE.Vector3(),v2=new THREE.Vector3(),v3=new THREE.Vector3();
function fitBikeLeg(model,side,point){const r=model.userData.rig,thigh=r['thigh'+side],calf=r['calf'+side],foot=r['foot'+side],hip=thigh.getWorldPosition(new THREE.Vector3()),rotation=model.getWorldQuaternion(new THREE.Quaternion()),target=new THREE.Vector3(point.x,point.y,point.z).add(new THREE.Vector3(0,.066,-.047).applyQuaternion(rotation)),delta=target.clone().sub(hip),dir=delta.clone().normalize(),a=.40*model.scale.y,b=.39*model.scale.y,d=Math.max(.06,Math.min(delta.length(),a+b-.004)),along=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along)),out=new THREE.Vector3(side==='L'?-.34:.34,0,1).applyQuaternion(rotation);out.addScaledVector(dir,-out.dot(dir)).normalize();const knee=hip.clone().addScaledVector(dir,along).addScaledVector(out,height);thigh.parent.getWorldQuaternion(qb).invert();v1.copy(knee).sub(hip).normalize().applyQuaternion(qb);thigh.quaternion.setFromUnitVectors(down,v1);thigh.updateWorldMatrix(true,false);calf.parent.getWorldQuaternion(qb).invert();v1.copy(target).sub(knee).normalize().applyQuaternion(qb);calf.quaternion.setFromUnitVectors(down,v1);calf.updateWorldMatrix(true,false);foot.parent.getWorldQuaternion(qb).invert();foot.quaternion.copy(qb).multiply(rotation);}
// Holding a phone: the arm brings the hand up and turns it so the phone stands upright with its screen to the
// face (see phoneModel for how it sits in the hand). `up` is the first-person pose, raised into view; the other
// holds the phone at chest height, as someone reading it. The angles were solved on the rig for those two places.
const PHONE_POSE={up:{arm:[-1.386,-.294,.267],fore:[1.557,-.737,-3.142],hand:[-.359,-.632,1.005]},low:{arm:[-.242,-.201,.186],fore:[1.074,-.219,3.142],hand:[-.212,-.318,.967]}};
function phonePose(r,up){const q=up?PHONE_POSE.up:PHONE_POSE.low;r.armR.rotation.set(q.arm[0],q.arm[1],q.arm[2]);r.forearmR.rotation.set(q.fore[0],q.fore[1],q.fore[2]);r.handR.rotation.set(q.hand[0],q.hand[1],q.hand[2]);}
function aimArm(model,side,target,pole){const r=model.userData.rig,arm=r['arm'+side],fore=r['forearm'+side],shoulder=arm.getWorldPosition(new THREE.Vector3()),toward=target.clone().sub(shoulder),d=clamp(toward.length(),.035,.537),dir=toward.normalize(),length1=.28*model.scale.y,length2=.26*model.scale.y,actualD=Math.min(d,length1+length2-.005),along=(length1*length1-length2*length2+actualD*actualD)/(2*actualD),height=Math.sqrt(Math.max(0,length1*length1-along*along));/* pole: which way the elbow goes, in the model's own space (V5.7); the usual way is out and down */const outward=(pole?new THREE.Vector3(pole[0],pole[1],pole[2]):new THREE.Vector3(side==='L'?-1:1,-.55,-.2)).applyQuaternion(model.getWorldQuaternion(qa));outward.addScaledVector(dir,-outward.dot(dir)).normalize();const elbow=shoulder.clone().addScaledVector(dir,along).addScaledVector(outward,height);arm.parent.getWorldQuaternion(qb).invert();v1.copy(elbow).sub(shoulder).normalize().applyQuaternion(qb);arm.quaternion.setFromUnitVectors(down,v1);arm.updateWorldMatrix(true,false);fore.parent.getWorldQuaternion(qb).invert();v1.copy(target).sub(elbow).normalize().applyQuaternion(qb);fore.quaternion.setFromUnitVectors(down,v1);fore.updateWorldMatrix(false,false);}
// ---- V5.7: eating a delivered order ----------------------------------------------------------------------
// Places are in the model's own space: x to its right, y up from the soles, z ahead. The scene: crouch to the bag
// and take it in both hands, stand up, tuck it against the body on the left arm, reach in with the right hand,
// pull out a fistful of gunk and smear it over the face, twice, chewing; crush the bag and push it into a pocket;
// then wipe the face clean with both hands, twice, and shake them off. The bag, the gunk and what sticks to the
// face are props of the rig (see buildProps). Nothing is left on the face afterwards.
// feastT runs 0 to 1 in time. The scene is written against its stage: 0 to .82 is everything up to the end of the
// second smear (two thirds of the time), and the ending runs from .82 to 1.82 in the last third.
const sstep=(q,a,b)=>{const t=clamp((q-a)/(b-a),0,1);return t*t*(3-2*t);};
const FEAST_SPLIT=.663;
function feastStage(q){q=clamp(Number(q)||0,0,1);return q<=FEAST_SPLIT?q/FEAST_SPLIT*.82:.82+(q-FEAST_SPLIT)/(1-FEAST_SPLIT);}
const FEAST_BAG={ground:[0,0,.5],chest:[0,.98,.3],tuck:[-.07,.99,.26],pocket:[-.25,.9,.02],tilt:-.32};
const FEAST_KEYS={R:[[0,'rest'],[.09,'grab'],[.11,'grab'],[.21,'hold'],[.27,'hold'],[.325,'inn'],[.38,'inn'],[.425,'out'],[.455,'face'],[.55,'face'],[.61,'inn'],[.645,'inn'],[.69,'out'],[.72,'face'],[.82,'face'],[1,'low'],[1.1,'low'],[1.24,'brow'],[1.42,'jaw'],[1.5,'brow'],[1.66,'jaw'],[1.74,'flick'],[1.82,'rest']],L:[[0,'rest'],[.09,'grab'],[.11,'grab'],[.21,'hold'],[.27,'tuck'],[.88,'tuck'],[1.04,'pocket'],[1.08,'pocket'],[1.24,'brow'],[1.42,'jaw'],[1.5,'brow'],[1.66,'jaw'],[1.74,'flick'],[1.82,'rest']]};
function feastPoses(model,r,side){const s=side==='L'?-1:1,pole=[s,-.55,-.2],G=FEAST_BAG,ux=-Math.sin(G.tilt),uy=Math.cos(G.tilt),P={
  grab:{pos:[s*.15,.37,G.ground[2]],fingers:[0,-1,0],palm:[-s,0,0],pole,curl:.5},
  hold:{pos:[s*.15,1.12,.17],fingers:[0,0,1],palm:[-s,0,0],pole,curl:.5},
  flick:{pos:[s*.33,.98,.2],fingers:[s*.25,-.9,.3],palm:[-s,0,0],pole,curl:.05}};
 // where the hand hangs in the pose the body is already in
 const hand=r['hand'+side],e=hand.matrixWorld.elements,at=model.worldToLocal(v1.setFromMatrixPosition(hand.matrixWorld)),rest={pos:[at.x,at.y,at.z],pole,curl:-.22};
 model.getWorldQuaternion(qa).invert();v2.set(-e[4],-e[5],-e[6]).normalize().applyQuaternion(qa);rest.fingers=[v2.x,v2.y,v2.z];v2.set(-e[8],-e[9],-e[10]).normalize().applyQuaternion(qa);rest.palm=[v2.x,v2.y,v2.z];P.rest=rest;
 // flat on the face, wherever the mouth is now, the fingers pointing up it: over the mouth, up at the brow and down
 // at the jaw on this hand's own half of the face
 const H=r.headModel,face=model.worldToLocal(r.head.localToWorld(v1.set(0,(H?.noseTip?.y??.084)-.02,(H?.noseTip?.z??.107)-.01))),fx=face.x,fy=face.y,fz=face.z,up=[-s*.12,.96,-.25],flat=[0,-.1,-1];
 P.brow={pos:[fx+s*.046,fy-.011,fz+.0625],fingers:up,palm:flat,pole,curl:.1};P.jaw={pos:[fx+s*.041,fy-.136,fz+.0725],fingers:up,palm:flat,pole,curl:.14};
 if(side==='R'){
  // into the open top of the tucked bag, along the bag's own tilted axis, with the elbow lifted
  const top=[G.tuck[0]+ux*.3,G.tuck[1]+uy*.3,G.tuck[2]];P.inn={pos:[top[0]+ux*.05,top[1]+uy*.05,top[2]],fingers:[-ux,-uy,0],palm:[0,0,-1],pole:[1,.9,-.2],curl:.3};
  P.out={pos:[.11,1.4,.3],fingers:[-.3,.75,0],palm:[0,.2,-1],pole,curl:.6};
  P.face={pos:[fx+.011,fy-.132,fz+.072],fingers:up,palm:flat,pole,curl:.12};
  P.low={pos:[.1,1.2,.25],fingers:[-.3,.7,.2],palm:[-.5,0,-1],pole,curl:.3};
 }else{
  // the palm turned up under the bag
  P.tuck={pos:[G.tuck[0]-.094,G.tuck[1]-.015,G.tuck[2]-.056],fingers:[.75,0,.66],palm:[0,1,0],pole,curl:.3};
  P.pocket={pos:[G.pocket[0],G.pocket[1]+.03,G.pocket[2]],fingers:[0,-1,0],palm:[1,0,0],pole,curl:.6};
 }
 return P;}
function feastHand(q,keys,poses){let i=1;while(i<keys.length-1&&keys[i][0]<q)i++;const a=keys[i-1],b=keys[i],t=sstep(q,a[0],b[0]),A=poses[a[1]],B=poses[b[1]],out={curl:A.curl+(B.curl-A.curl)*t,idle:a[1]==='rest'&&b[1]==='rest'};for(const k of['pos','fingers','palm','pole'])out[k]=[0,1,2].map(j=>A[k][j]+(B[k][j]-A[k][j])*t);return out;}
// Turns a hand so its fingers point one way and its palm faces another (both in the model's own space).
/* V6.6: the hands-up pose: how far each upper arm swings out and up from hanging, and how far the forearm bends on from it (radians). */const HANDS_UP={arm:2.18,fore:.785};
function orientHand(model,side,fingers,palm){const hand=model.userData.rig['hand'+side],y=v1.set(-fingers[0],-fingers[1],-fingers[2]).normalize(),z=v2.set(-palm[0],-palm[1],-palm[2]);z.addScaledVector(y,-z.dot(y));if(z.lengthSq()<1e-6)z.set(0,0,1).addScaledVector(y,-y.z);z.normalize();const x=v3.crossVectors(y,z),turn=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));model.getWorldQuaternion(qa);hand.parent.getWorldQuaternion(qb).invert();hand.quaternion.copy(qb).multiply(qa).multiply(turn);}
function plantSoles(model,r){model.updateMatrixWorld(true);const inverse=r.soleInverse||(r.soleInverse=new THREE.Matrix4()),local=r.soleMatrix||(r.soleMatrix=new THREE.Matrix4());inverse.copy(model.matrixWorld).invert();let sole=Infinity;for(const foot of[r.footL,r.footR]){local.multiplyMatrices(inverse,foot.matrixWorld);for(const x of[-.058,.058])for(const z of[-.0855,.1795]){v1.set(x,-.0665,z).applyMatrix4(local);sole=Math.min(sole,v1.y);}}if(Number.isFinite(sole))r.pelvis.position.y+=.002-sole;}
// q: feastT, or -1 when nobody is eating (everything is put away). time: the clock, for chewing.
function feast(model,r,state,q,time){
 const on=q>=0,u=on?feastStage(q):-1,pop=a=>{const t=clamp((u-a)/.035,0,1);return u<a?0:t>=1?1:t*t*(3-2*t)+.25*Math.sin(Math.PI*t);};
 showProp(r.feastBag,on&&u>0&&u<1.06);
 if(!on){for(const node of[r.gunk,r.faceGunkA,r.faceGunkB])if(node)showProp(node,false);return;}
 /* a phone that was in the hand is put away for this */if(r.gripShown){for(const finger of r.fingersR)finger.scale.setScalar(1);r.thumbR.scale.setScalar(1);if(r.phoneGrip)r.phoneGrip.visible=false;r.gripShown=false;}r.propRoot.visible=false;
 const S=(a,b)=>sstep(u,a,b),G=FEAST_BAG,bend=S(0,.09)*(1-S(.11,.2)),lift=S(.11,.21),tuck=S(.21,.27),carry=S(.88,1.04);
 // the two trips into the bag: looking down into it, the smash, the smear, the hand leaving the face
 const second=u>=.56,look=second?S(.56,.6)*(1-S(.69,.72)):S(.27,.31)*(1-S(.425,.455)),hit=second?S(.69,.72):S(.425,.455),leave=second?S(.82,.98):S(.55,.58),on2=hit*(1-leave),smear=clamp((u-(second?.72:.455))/.1,0,1),rum=second?(u>.61&&u<.645?Math.sin((u-.61)*190):0):(u>.325&&u<.38?Math.sin((u-.325)*190):0),chew=S(.47,.5)*(1-S(.86,.98))*Math.sin(time*31);
 // the ending: both hands on the face, two strokes down it, and what is on the face goes with them
 const wiping=S(1.18,1.26)*(1-S(1.66,1.74)),stroke=S(1.26,1.42)*(1-S(1.42,1.5))+S(1.52,1.66)*(1-S(1.66,1.72)),clean=(1-.55*S(1.27,1.42))*(1-S(1.52,1.66));
 // the body
 r.pelvis.position.y-=.32*bend;r.spine.rotation.x=1.1*bend-.07*on2-.05*wiping+.03*chew;r.spine.rotation.z=.04*chew;
 r.thighL.rotation.x=r.thighR.rotation.x=-1.1*bend;r.calfL.rotation.x=r.calfR.rotation.x=1.7*bend;r.footL.rotation.x=r.footR.rotation.x=-.6*bend;
 r.head.rotation.set(.28*bend+.36*look-.2*on2-.16*wiping+.12*stroke+.07*chew,.1*look,.08*chew*on2);
 if(bend>.001)plantSoles(model,r);else model.updateMatrixWorld(true);
 // the hands
 for(const side of['L','R']){const h=feastHand(u,FEAST_KEYS[side],feastPoses(model,r,side));if(h.idle)continue;
  if(side==='R'){if(rum){h.pos[0]+=Math.cos(u*640)*.012;h.pos[1]+=rum*.02;}if(on2>0){const turn=smear*Math.PI*3;h.pos[0]+=Math.sin(turn)*.034*on2;h.pos[1]+=(1-Math.cos(turn))*.022*on2;}}
  aimArm(model,side,model.localToWorld(new THREE.Vector3(h.pos[0],h.pos[1],h.pos[2])),h.pole);orientHand(model,side,h.fingers,h.palm);
  for(const finger of r['fingers'+side])finger.rotation.x=h.curl;if(r['thumb'+side])r['thumb'+side].rotation.x=Math.max(0,h.curl)*.6;}
 // the bag: on the ground, up to the chest, tucked and tilted toward the right hand, then crushed and pocketed
 const bag=r.feastBag,dy=clamp(Number(state.feastBagDy)||0,-.5,.5),crush=S(.82,.94),gone=S(.98,1.06),from=lift<1?G.ground:tuck<1?G.chest:G.tuck,to=lift<1?G.chest:tuck<1?G.tuck:G.pocket,t=lift<1?lift:tuck<1?tuck:carry;
 bag.position.set(from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t+dy*(1-lift),from[2]+(to[2]-from[2])*t);bag.rotation.set(rum*.05,0,G.tilt*tuck*(1-carry));bag.scale.set((1-.4*crush)*(1-.9*gone),(1-.55*crush)*(1-.9*gone),(1-.4*crush)*(1-.9*gone));
 // the gunk in the fist: it appears as the hand comes out of the bag and goes onto the face as it is smeared
 const lump=second?S(.645,.69)*(1-.8*smear)*(1-S(.82,.9)):S(.38,.425)*(1-.65*smear)*(1-S(.55,.57));showProp(r.gunk,lump>.03);if(lump>.03)r.gunk.scale.setScalar(lump);
 const a=pop(.452)*clean,b=pop(.717)*clean,wob=1+.05*Math.sin(time*37)*on2;
 if(r.faceGunkA){showProp(r.faceGunkA,a>.02);if(a>.02)r.faceGunkA.scale.set(a*wob,a,a);}
 if(r.faceGunkB){showProp(r.faceGunkB,b>.02);if(b>.02)r.faceGunkB.scale.set(b*wob,b,b);}
}
const PALM_TURN=1.35,PALM_MODES=new Set(['idle','onFoot','on-foot','walk','jog','run','sprint','crouch','land','jump','fall','freefall','conversation','flinch','panic','phone','reporting','drink']);
function animate(model,state={},time=0,dt=1/60){const r=model.userData.rig;if(!r)return;/* the hand's own fingers come back whenever the phone grip is not being shown */if(r.gripShown){for(const finger of r.fingersR)finger.scale.setScalar(1);r.thumbR.scale.setScalar(1);if(r.phoneGrip)r.phoneGrip.visible=false;r.gripShown=false;}animateExtras(r,state,time);const a=r.appearance,gait=P.movements[a.movement],rawRecoil=Math.max(0,Number(state.recoil)||0);r.flashTime=rawRecoil>(r.lastRecoil||0)+.004?.055:Math.max(0,(r.flashTime||0)-Math.min(.1,dt));r.lastRecoil=rawRecoil;let mode=state.seatPose&&Number(state.seatIndex??state.seat??0)>0?'passenger':({swimming:'swim',falling:'fall',parachuting:'parachute',vaulting:'vault',handsUp:'handsup','sport-driver':'driver',helm:'boat',pilot:'aircraft'})[state.seatPose||state.mode]||state.seatPose||state.mode||state.action||'idle';if(mode==='entering'&&state.entryPhase==='walk')mode='walk';if(['idle','onFoot','on-foot'].includes(mode)&&state.grounded===false)mode=(state.velocityY??state.vy??0)>0?'jump':'fall';const speed=Math.abs(Number(state.speed)||0),delta=clamp(dt,0,.1),blend=1-Math.exp(-delta*13);if(r.lastGrounded===false&&state.grounded===true)r.landTime=.18;r.landTime=Math.max(0,(r.landTime||0)-delta);if(['idle','onFoot','on-foot'].includes(mode)&&r.landTime>0)mode='land';if(typeof state.grounded==='boolean')r.lastGrounded=state.grounded;r.blendSpeed=mix(r.blendSpeed,speed,blend);r.travel+=speed*delta;const phase=r.travel*(speed>3?3.4:4.6)*gait.cadence+r.phase,walk=clamp(r.blendSpeed/2,0,1),run=clamp((r.blendSpeed-2.4)/3.8,0,1),s=Math.sin(phase),c=Math.cos(phase),idle=Math.sin(time*1.6+r.phase);for(const [key,bone]of Object.entries(r.bones)){bone.matrixAutoUpdate=true;bone.rotation.set(0,0,0);bone.position.copy(r.bindPositions[key]);}r.pelvis.position.set(0,.88,0);r.head.scale.y=1;r.pelvis.rotation.y=s*.035*walk;r.pelvis.position.y+=Math.abs(s)*.020*walk+idle*.003*(1-walk);r.spine.rotation.x=(run*.16+gait.lean)*walk;r.spine.rotation.z=-s*.02*walk;r.head.rotation.y=clamp(state.lookYaw||Math.sin(time*.31+r.phase)*.11,-.65,.65);r.head.rotation.x=(state.lookPitch||0)*.55;
 const swing=(.42+run*.35)*walk*gait.swing;r.thighL.rotation.x=s*swing;r.thighR.rotation.x=-s*swing;r.calfL.rotation.x=Math.max(0,-s)*(.54+run*.55)*walk;r.calfR.rotation.x=Math.max(0,s)*(.54+run*.55)*walk;r.footL.rotation.x=-r.calfL.rotation.x*.43+Math.max(0,s)*.12*walk;r.footR.rotation.x=-r.calfR.rotation.x*.43+Math.max(0,-s)*.12*walk;
 r.armL.rotation.x=-s*(.29+run*.55)*walk;r.armR.rotation.x=s*(.29+run*.55)*walk;/* V3: the arms hang a touch away from the body instead of angling in toward the thighs. */{/* V8.8: a woman's arms hang a little further out, clear of her hips */const away=r.appearance?.bust>0?.07:0;r.armL.rotation.z=-.05-away;r.armR.rotation.z=.05+away;}r.forearmL.rotation.x=-.13-run*.75;r.forearmR.rotation.x=-.13-run*.75;r.handL.rotation.x=.06;r.handR.rotation.x=.06;for(const side of['L','R'])for(const finger of r['fingers'+side])finger.rotation.x=-.22;
 if(mode==='crouch'||(state.crouching||state.crouched)){r.pelvis.position.y-=.32;r.spine.rotation.x=.26;r.thighL.rotation.x=-1.10+s*.22*walk;r.thighR.rotation.x=-1.10-s*.22*walk;r.calfL.rotation.x=1.70-s*.2*walk;r.calfR.rotation.x=1.70+s*.2*walk;r.footL.rotation.x=-.6;r.footR.rotation.x=-.6;}
 if(['jump','fall','freefall'].includes(mode)){const vy=state.velocityY??state.vy??0;r.thighL.rotation.x=vy>0?-.55:.16;r.thighR.rotation.x=vy>0?-.22:.3;r.calfL.rotation.x=.6;r.calfR.rotation.x=.3;r.armL.rotation.z=.22;r.armR.rotation.z=-.22;r.armL.rotation.x=-.5;r.armR.rotation.x=-.45;r.spine.rotation.x=.07;}
 if(mode==='land'){const f=1-clamp(state.transitionProgress??(1-(r.landTime||.18)/.18),0,1);r.pelvis.position.y-=.20*f;r.thighL.rotation.x=r.thighR.rotation.x=-.65*f;r.calfL.rotation.x=r.calfR.rotation.x=1.15*f;r.spine.rotation.x=.2*f;}
 if(['seated','driver','passenger','boat','aircraft','motorcycle','scooter','sitting'].includes(mode)){r.pelvis.position.y=mode==='sitting'?.57:0;r.thighL.rotation.x=r.thighR.rotation.x=-1.42;r.calfL.rotation.x=r.calfR.rotation.x=1.5;r.thighL.rotation.z=.08;r.thighR.rotation.z=-.08;r.armL.rotation.x=r.armR.rotation.x=-.98;r.forearmL.rotation.x=r.forearmR.rotation.x=-.42;r.armL.rotation.z=.16+(state.steer||0)*.18;r.armR.rotation.z=-.16+(state.steer||0)*.18;r.spine.rotation.x=mode==='motorcycle'?(state.bikeSport?.46:.28)+Math.max(0,state.bikeTuck||0)*.37-Math.max(0,state.bikeLean||0)*.51:mode==='scooter'?.10+Math.max(0,state.bikeTuck||0)*.25-Math.max(0,state.bikeLean||0)*.36:0;if(mode==='motorcycle'){r.chest.rotation.x=Math.max(0,state.bikeTuck||0)*.10;r.head.rotation.x=-Math.max(0,state.bikeTuck||0)*.22;r.thighL.rotation.z=.26;r.thighR.rotation.z=-.26;r.calfL.rotation.x=r.calfR.rotation.x=1.9;}if(state.seatPose==='sport-driver'){r.thighL.rotation.x=r.thighR.rotation.x=-1.5;r.calfL.rotation.x=r.calfR.rotation.x=.72;r.spine.rotation.x=-.10;}
  /* V9.0: in a car the legs reach the cabin floor: feet flat on it, ahead of the hips, never under the car */
  if(state.carTargets&&state.carTargets.floorY!==undefined&&mode!=='motorcycle'&&mode!=='scooter'){const ct=state.carTargets,sc=model.scale.y||1,bp=r.bindPositions,len=v=>v?Math.hypot(v.x,v.y,v.z):0,Lt=len(bp.calfL)||.43,Ls=len(bp.footL)||.45,lift=ct.rear?-.04:0,hipY=(bp.thighL?bp.thighL.y:-.05)+lift;if(ct.rear)r.pelvis.position.y=lift;
   const drop=Math.max(.05,hipY-(ct.floorY/sc+.075)),Dn=Math.sqrt(Lt*Lt+Ls*Ls-2*Lt*Ls*Math.cos(2.06)),fwd=Math.min(Math.sqrt(Math.max(0,Dn*Dn-drop*drop)),Math.max(.1,ct.reach/sc)),D=Math.min((Lt+Ls)*.985,Math.hypot(fwd,drop)),al=Math.atan2(fwd,drop),be=Math.acos(clamp((Lt*Lt+D*D-Ls*Ls)/(2*Lt*D),-1,1)),ga=Math.acos(clamp((Lt*Lt+Ls*Ls-D*D)/(2*Lt*Ls),-1,1)),tx=-(al+be),cx=Math.PI-ga;
   r.thighL.rotation.x=r.thighR.rotation.x=tx;r.calfL.rotation.x=r.calfR.rotation.x=cx;if(r.footL)r.footL.rotation.x=-(tx+cx);if(r.footR)r.footR.rotation.x=-(tx+cx);if(ct.rear)r.spine.rotation.x+=.1;}if(mode==='passenger'){r.armL.rotation.x=r.armR.rotation.x=-.25;r.forearmL.rotation.x=r.forearmR.rotation.x=-.80;}if(mode==='sitting'){r.armL.rotation.x=r.armR.rotation.x=-.3;r.forearmL.rotation.x=r.forearmR.rotation.x=-1.0;}}
 if(mode==='swim'){const swimming=clamp(speed/1.6,0,1),pitch=clamp(state.swimPitch||0,-1.25,1.25),stroke=time*(1.5+swimming*1.8)+r.phase;r.pelvis.position.y=.48+Math.abs(pitch)*.28;r.pelvis.rotation.x=Math.PI*.36-pitch*.78;r.pelvis.rotation.z=Math.sin(stroke)*.035*swimming;r.spine.rotation.x=0;r.head.rotation.x=-.15-pitch*.15;r.armL.rotation.x=Math.sin(stroke)*(.35+swimming*1.35);r.armR.rotation.x=Math.sin(stroke+Math.PI)*(.35+swimming*1.35);r.armL.rotation.z=.3;r.armR.rotation.z=-.3;r.forearmL.rotation.x=r.forearmR.rotation.x=-.3;r.thighL.rotation.x=Math.sin(time*5)*(.1+swimming*.18);r.thighR.rotation.x=-r.thighL.rotation.x;r.calfL.rotation.x=r.calfR.rotation.x=.25;}
 if(mode==='entering'&&state.entryPhase==='sit'||mode==='entering'&&state.entryPhase==='close'){const q=clamp(state.entrySeatBlend||0,0,1);r.pelvis.position.y=.88*(1-q);r.thighL.rotation.x=r.thighR.rotation.x=-1.42*q;r.calfL.rotation.x=r.calfR.rotation.x=1.5*q;r.spine.rotation.x=.18*Math.sin(q*Math.PI);}
 if(mode==='vault'){const t=clamp(state.transitionProgress||0,0,1);r.pelvis.position.y+=Math.sin(t*Math.PI)*.35;r.spine.rotation.x=.60;r.thighL.rotation.x=-1.25*Math.sin(t*Math.PI);r.thighR.rotation.x=-.75*Math.sin(t*Math.PI);r.calfL.rotation.x=1.6;r.calfR.rotation.x=1.2;r.armL.rotation.x=-1.9;r.armR.rotation.x=-1.7;}
 if(['entering','exiting','interact','pickup'].includes(mode)&&!['sit','close'].includes(state.entryPhase)){const p=clamp(state.transitionProgress??.45,0,1);r.spine.rotation.x=.5*Math.sin(p*Math.PI);r.armR.rotation.x=-1.4*Math.sin(Math.min(1,p*2)*Math.PI*.5);r.forearmR.rotation.x=-.28;r.thighR.rotation.x=-.45*Math.sin(p*Math.PI);r.calfR.rotation.x=.7*Math.sin(p*Math.PI);r.pelvis.position.y-=.18*Math.sin(p*Math.PI);}
 /* V7.7 carjack: at the open door the player reaches in with both hands, drags the driver out backwards and throws them
  * down to the side. The driver being dragged has the arms up and the knees bent. */
 if(mode==='entering'&&state.entryPhase==='pull'){const q=clamp(state.entryStage||0,0,1),sm=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},rest=1-sm((q-.84)/.16)/* V8.9: back to standing before you get in */,reach=sm(q/.2)*rest,drag=sm((q-.32)/.32)*rest,hurl=sm((q-.66)/.1)*rest;r.pelvis.position.y=.88-.06*drag*(1-hurl);r.spine.rotation.x=.3*reach*(1-drag)-.18*drag*(1-hurl)+.15*hurl;r.spine.rotation.y=-.55*hurl;for(const s of['R','L']){const arm=r['arm'+s],fore=r['forearm'+s];if(arm){arm.rotation.x=mix(-1.35*reach,-.9,drag)*(1-hurl)-.6*hurl;arm.rotation.z=(s==='R'?-1:1)*.15*reach;}if(fore)fore.rotation.x=-.25*reach-1.1*drag*(1-hurl);}if(r.thighR)r.thighR.rotation.x=.35*drag*(1-hurl);if(r.calfR)r.calfR.rotation.x=.2*drag;if(r.thighL)r.thighL.rotation.x=-.25*drag*(1-hurl);}
 if(mode==='carjacked'){const w=Math.sin(time*14+(r.phase||0));r.pelvis.position.y=.72;r.spine.rotation.x=-.35;if(r.armR){r.armR.rotation.x=-2.3+w*.3;r.armR.rotation.z=-.4;}if(r.armL){r.armL.rotation.x=-2.3-w*.3;r.armL.rotation.z=.4;}if(r.thighR)r.thighR.rotation.x=-.9;if(r.thighL)r.thighL.rotation.x=-.7;if(r.calfR)r.calfR.rotation.x=1.1;if(r.calfL)r.calfL.rotation.x=.9;if(r.head)r.head.rotation.x=-.2;}
 /* V4.9 break-in, standing at the door and facing the car. smash: the right elbow is drawn back and driven into the side window. reach: the arm goes through the hole and down to the lock. */
 if(mode==='entering'&&(state.entryPhase==='smash'||state.entryPhase==='reach')){const q=clamp(state.entryStage||0,0,1),sm=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};r.pelvis.position.y=.88;r.spine.rotation.x=0;r.thighR.rotation.x=0;r.calfR.rotation.x=0;
  if(state.entryPhase==='smash'){const wind=sm(q/.5),hit=sm((q-.5)/.14),back=sm((q-.72)/.28);r.spine.rotation.y=mix(mix(0,-.6,wind),.42,hit)*(1-back*.6);r.spine.rotation.x=.12*hit;r.armR.rotation.x=mix(mix(0,.75,wind),-1.2,hit);r.armR.rotation.z=mix(0,.5,wind)*(1-hit);r.forearmR.rotation.x=mix(mix(-.13,-2.1,wind),-1.25,hit);r.armL.rotation.x=-.5*wind;r.forearmL.rotation.x=-1.1*wind;r.thighL.rotation.x=-.18*wind;r.thighR.rotation.x=.2*wind;r.head.rotation.y=.25*wind*(1-hit);}
  else{const inn=sm(q/.35),down=sm((q-.35)/.35),out=sm((q-.8)/.2);r.spine.rotation.x=.34*inn*(1-out*.6);r.spine.rotation.y=.25*inn*(1-out);r.armR.rotation.x=mix(-1.2,-1.5,inn)+.3*down;r.forearmR.rotation.x=mix(-1.25,-.15,inn)-.25*down;r.handR.rotation.x=.5*down;r.armL.rotation.x=-.9*inn;r.forearmL.rotation.x=-.5*inn;r.pelvis.position.y-=.06*inn;}}
 const holdingPhone=!!state.phoneHeld&&!['dead','incapacitated'].includes(mode)&&!state.ragdoll,propsAllowed=!(state.panic>0&&!state.reporting)&&!['dead','incapacitated','swim','parachute','handsup','panic','sprint'].includes(mode);r.propRoot.visible=!!(holdingPhone||propsAllowed&&['phone','reporting'].includes(mode));if(r.propRoot.visible&&r.phoneGrip&&r.lod<2&&r.fingersR.length){showProp(r.phoneGrip,true);for(const finger of r.fingersR)finger.scale.setScalar(.0001);r.thumbR.scale.setScalar(.0001);r.gripShown=true;}if(mode==='phone'||mode==='reporting'){phonePose(r,false);r.head.rotation.x=.26;r.head.rotation.y=.1;}
 showProp(r.cup,propsAllowed&&mode==='drink');showProp(r.photoCamera,propsAllowed&&mode==='photo');showProp(r.package,propsAllowed&&state.carriedProp==='package');showProp(r.shoppingBag,propsAllowed&&state.carriedProp==='bag');
 if(r.package.visible){r.armL.rotation.x=r.armR.rotation.x=-.45;r.forearmL.rotation.x=r.forearmR.rotation.x=-1.2;r.armL.rotation.z=-.13;r.armR.rotation.z=.13;}
 /* V3: cups and cameras are gripped, with the palm turned in and the fingers closed round them. */
 if(mode==='drink'){const sip=.5+.5*Math.sin(time*.9+r.phase);r.armR.rotation.set(-.62-.3*sip,0,-.22);r.forearmR.rotation.set(-1.75-.25*sip,0,0);r.handR.rotation.set(-.1,Math.PI/2,0);for(const finger of r.fingersR)finger.rotation.x=1.0;r.thumbR.rotation.x=.55;r.head.rotation.x=-.12*sip;}
 if(mode==='photo'){r.armR.rotation.set(-.95,0,.2);r.armL.rotation.set(-.95,0,-.2);r.forearmR.rotation.set(-1.75,0,0);r.forearmL.rotation.set(-1.75,0,0);r.handR.rotation.set(-.1,Math.PI/2,0);r.handL.rotation.set(-.1,-Math.PI/2,0);for(const side of['L','R']){for(const finger of r['fingers'+side])finger.rotation.x=.85;r['thumb'+side].rotation.x=.4;}r.head.rotation.x=.08;}
 if(mode==='conversation'){r.forearmR.rotation.x=-.5-.3*Math.sin(time*2+r.phase);r.armR.rotation.z=-.20;r.head.rotation.y+=Math.sin(time+r.phase)*.10;}
 /* V6.6: hands up, properly. Each upper arm goes out to its own side and up (35 degrees above level), the forearm
  * bends a further 45 degrees so the hand is above the head, and the hand is turned so the palm faces forward, with
  * the fingers straight. Before, the two arm angles were the wrong way round, which crossed the arms over the head. */
 if(mode==='handsup'){const sway=Math.sin(time*2.1+r.phase)*.03;r.armL.rotation.z=-HANDS_UP.arm-sway;r.armR.rotation.z=HANDS_UP.arm+sway;r.forearmL.rotation.z=-HANDS_UP.fore;r.forearmR.rotation.z=HANDS_UP.fore;r.handL.rotation.set(0,Math.PI,0);r.handR.rotation.set(0,Math.PI,0);for(const side of['L','R']){for(const finger of r['fingers'+side]||[])finger.rotation.x=-.32;if(r['thumb'+side])r['thumb'+side].rotation.x=-.1;}}
 /* V6.22: a cashier being robbed takes a money bag from under the counter and throws it over. state.bagThrow runs
  * from 0 to 1: the hands come down and one reaches under the counter (to .3), lifts the bag to the chest (to .5),
  * swings it back (to .68) and throws (to .8); then both hands go up again. */
 if(mode==='bagthrow'){const q=clamp(state.bagThrow||0,0,1),S=(a,b)=>{const t=clamp((q-a)/(b-a),0,1);return t*t*(3-2*t);},lowered=S(0,.14)*(1-S(.84,1)),reach=S(.06,.28)*(1-S(.3,.48)),lift=S(.3,.5)*(1-S(.5,.66)),wind=S(.5,.68)*(1-S(.68,.78)),fling=S(.68,.8)*(1-S(.84,1));
  r.armL.rotation.z=mix(-HANDS_UP.arm,.12,lowered);r.armL.rotation.x=-.55*lowered;r.forearmL.rotation.x=-.75*lowered;r.forearmL.rotation.z=-HANDS_UP.fore*(1-lowered);r.handL.rotation.y=Math.PI*(1-lowered);r.forearmR.rotation.z=HANDS_UP.fore*(1-lowered);r.handR.rotation.y=Math.PI*(1-lowered);
  r.armR.rotation.z=mix(HANDS_UP.arm,-.1,lowered)-.25*wind;r.armR.rotation.x=-.75*reach-.95*lift+.85*wind-1.75*fling;r.forearmR.rotation.x=-.35*lowered-.25*reach-1.2*lift-1.5*wind+.15*fling;
  r.spine.rotation.x+=.42*reach+.08*lift-.1*wind+.22*fling;r.spine.rotation.y=-.45*wind+.35*fling;r.head.rotation.x+=.25*reach;
  for(const finger of r.fingersR||[])finger.rotation.x=q>.2&&q<.76?1.15:-.22;}
 /* V6.6: a cashier keying the register open. state.tillType runs from 0 to 1: both hands come down from over the
  * head, the left rests on the counter, the right pecks at the keys with one finger (eight presses), then up again. */
 if(mode==='tilltype'){const q=clamp(state.tillType||0,0,1),S=(a,b)=>{const t=clamp((q-a)/(b-a),0,1);return t*t*(3-2*t);},down=S(0,.1)*(1-S(.93,1)),k=clamp((q-.11)/.82,0,1),tap=k>0&&k<1?Math.pow(Math.abs(Math.sin(k*Math.PI*8)),2.2):0,row=Math.sin(k*23);
  r.armL.rotation.z=mix(-HANDS_UP.arm,.1,down);r.armL.rotation.x=-.42*down;r.forearmL.rotation.x=-.95*down;r.forearmL.rotation.z=-HANDS_UP.fore*(1-down);r.handL.rotation.y=Math.PI*(1-down);r.forearmR.rotation.z=HANDS_UP.fore*(1-down);r.handR.rotation.y=Math.PI*(1-down);
  r.armR.rotation.z=mix(HANDS_UP.arm,-.06-.1*row,down);r.armR.rotation.x=(-.6+.07*tap)*down;r.armR.rotation.y=.14*row*down;r.forearmR.rotation.x=(-.92+.3*tap)*down;r.handR.rotation.x=(.1+.35*tap)*down;
  r.spine.rotation.x+=.2*down;r.head.rotation.x+=.34*down;r.head.rotation.y+=-.08*row*down;
  const fr=r.fingersR||[];for(let i=0;i<fr.length;i++)fr[i].rotation.x=down>.5?(i===0?-.1:1.05):-.22;}
 if(mode==='flinch'){const q=1-clamp(state.transitionProgress||0,0,1);r.spine.rotation.x=-.25*q;r.spine.rotation.z=.14*q;r.armL.rotation.x=-.6*q;r.armR.rotation.x=-.8*q;}
 if(mode==='dead'||mode==='incapacitated'){r.pelvis.position.y=.19;r.pelvis.rotation.z=1.48;r.spine.rotation.x=.15;r.thighL.rotation.x=-.35;r.thighR.rotation.x=.24;r.calfL.rotation.x=.7;r.calfR.rotation.x=.45;r.armL.rotation.x=.6;r.armR.rotation.x=-.9;r.armL.rotation.z=.35;r.armR.rotation.z=-.2;}
 showProp(r.canopy,mode==='parachute');r.harness.visible=r.canopy.visible;if(mode==='parachute'){r.armL.rotation.z=2.5;r.armR.rotation.z=-2.5;r.forearmL.rotation.x=r.forearmR.rotation.x=-.7;r.thighL.rotation.x=r.thighR.rotation.x=-.25;r.calfL.rotation.x=r.calfR.rotation.x=.4;r.pelvis.rotation.z=(state.steer||0)*.18;}
 /* V4.1 beach poses. `poseT` runs 0 to 1 through a hit, a throw or a catch. */
 if(mode==='sunbathe'||mode==='sunbatheFront'){const front=mode==='sunbatheFront',k=Math.sin(r.phase*3.1),breathe=Math.sin(time*1.1+r.phase)*.012;r.pelvis.position.y=.118+breathe;r.pelvis.rotation.set(front?Math.PI/2:-Math.PI/2,0,0);r.spine.rotation.set(front?-.06:.02,0,0);r.thighL.rotation.set(0,0,-.08);r.thighR.rotation.set(!front&&k>0?-.62:0,0,.1);r.calfL.rotation.x=front?.04:.03;r.calfR.rotation.x=!front&&k>0?1.15:front&&k>.3?1.3:.03;r.footL.rotation.x=r.footR.rotation.x=front?.9:-.25;
  if(front){r.head.rotation.set(-.1,.95,0);r.armL.rotation.set(-2.5,0,-.55);r.armR.rotation.set(-2.5,0,.55);r.forearmL.rotation.x=r.forearmR.rotation.x=-1.7;}else{r.head.rotation.set(.08,.2*k,0);r.armL.rotation.set(0,0,-.42);r.forearmL.rotation.x=-.1;if(k>.25){r.armR.rotation.set(-2.85,0,.3);r.forearmR.rotation.x=-2.05;}else{r.armR.rotation.set(0,0,.38);r.forearmR.rotation.x=-.12;}}}
 if(mode==='lounge'){r.pelvis.position.y=.33;r.pelvis.rotation.x=-.42;r.spine.rotation.x=-.1;r.head.rotation.x=.3;r.thighL.rotation.set(-.95,0,-.06);r.thighR.rotation.set(-1.02,0,.07);r.calfL.rotation.x=.5;r.calfR.rotation.x=.62;r.footL.rotation.x=r.footR.rotation.x=-.2;r.armL.rotation.set(-.3,0,-.22);r.armR.rotation.set(-.3,0,.22);r.forearmL.rotation.x=r.forearmR.rotation.x=-.75;}
 if(mode==='sitSand'){r.pelvis.position.y=.15;r.pelvis.rotation.x=-.22;r.spine.rotation.x=.5;r.head.rotation.x=-.2;r.thighL.rotation.set(-2.2,0,-.1);r.thighR.rotation.set(-2.2,0,.1);r.calfL.rotation.x=r.calfR.rotation.x=1.98;r.footL.rotation.x=r.footR.rotation.x=.44;r.armL.rotation.set(-1.0,0,.1);r.armR.rotation.set(-1.0,0,-.1);r.forearmL.rotation.x=r.forearmR.rotation.x=-.35;}
 if(['volleyReady','volleyBump','volleySet','volleySpike','throwBall','catchBall','carryBall'].includes(mode)){const t=clamp(Number(state.poseT)||0,0,1),ease=t*t*(3-2*t),swing=Math.sin(Math.PI*t);
  if(mode==='volleyReady'||mode==='volleyBump'){const lift=mode==='volleyBump'?ease:0;r.pelvis.position.y-=.13*(1-lift*.6);r.spine.rotation.x=.3-.12*lift;r.thighL.rotation.x=r.thighR.rotation.x=-.6+.3*lift;r.thighL.rotation.z=-.12;r.thighR.rotation.z=.12;r.calfL.rotation.x=r.calfR.rotation.x=.95-.5*lift;r.footL.rotation.x=r.footR.rotation.x=-.3;r.armL.rotation.set(-.62-.85*lift,0,.3);r.armR.rotation.set(-.62-.85*lift,0,-.3);r.forearmL.rotation.x=r.forearmR.rotation.x=-.16;r.head.rotation.x=-.25-.2*lift;}
  else if(mode==='volleySet'){r.spine.rotation.x=-.08;r.head.rotation.x=-.5;r.armL.rotation.set(-2.5-.35*ease,0,.1);r.armR.rotation.set(-2.5-.35*ease,0,-.1);r.forearmL.rotation.x=r.forearmR.rotation.x=-1.0+.75*ease;r.thighL.rotation.x=r.thighR.rotation.x=-.25*(1-ease);r.calfL.rotation.x=r.calfR.rotation.x=.45*(1-ease);}
  else if(mode==='volleySpike'){r.spine.rotation.x=-.22+.5*ease;r.spine.rotation.y=-.3+.6*ease;r.head.rotation.x=-.4+.3*ease;r.armR.rotation.set(-3.05+1.5*ease,0,.2);r.forearmR.rotation.x=-1.5*(1-ease);r.armL.rotation.set(-2.3+1.6*ease,0,-.2);r.forearmL.rotation.x=-.4;r.thighL.rotation.x=.25*swing;r.thighR.rotation.x=-.2*swing;r.calfL.rotation.x=.9*swing;r.calfR.rotation.x=.5*swing;}
  else if(mode==='throwBall'){const wind=clamp(t/.5,0,1),release=clamp((t-.5)/.3,0,1);r.spine.rotation.y=-.42*wind+.8*release;r.spine.rotation.x=-.08*wind+.2*release;r.armR.rotation.set(-2.7*wind+1.5*release,0,.35*wind);r.forearmR.rotation.x=-1.7*wind+1.5*release;r.armL.rotation.set(-1.2*wind+.9*release,0,-.2);r.forearmL.rotation.x=-.3;r.thighL.rotation.x=-.3*wind;r.calfL.rotation.x=.35*wind;r.thighR.rotation.x=.18*wind-.2*release;}
  else if(mode==='catchBall'){r.spine.rotation.x=.08;r.armL.rotation.set(-1.25,0,.22);r.armR.rotation.set(-1.25,0,-.22);r.forearmL.rotation.x=r.forearmR.rotation.x=-.5+.25*ease;r.thighL.rotation.x=r.thighR.rotation.x=-.15;r.calfL.rotation.x=r.calfR.rotation.x=.3;for(const side of['L','R'])for(const finger of r['fingers'+side])finger.rotation.x=.25;}
  else{r.armR.rotation.set(-.35,0,.12);r.forearmR.rotation.x=-1.35;for(const finger of r.fingersR)finger.rotation.x=.7;}}
 // The logical actor origin is the support surface. Plant the lowest sole on it.
 if(state.grounded===true&&['idle','onFoot','on-foot','walk','jog','run','sprint','crouch','land'].includes(mode)){
  model.updateMatrixWorld(true);const inverse=r.soleInverse||(r.soleInverse=new THREE.Matrix4()),local=r.soleMatrix||(r.soleMatrix=new THREE.Matrix4());inverse.copy(model.matrixWorld).invert();let sole=Infinity;for(const foot of[r.footL,r.footR]){local.multiplyMatrices(inverse,foot.matrixWorld);for(const x of[-.058,.058])for(const z of[-.0855,.1795]){v1.set(x,-.0665,z).applyMatrix4(local);sole=Math.min(sole,v1.y);}}if(Number.isFinite(sole))r.pelvis.position.y+=.002-sole;
 }
 const armed=!state.ragdoll&&!holdingPhone&&state.eatT===undefined&&state.feastT===undefined&&state.weapon&&!['swim','dead','incapacitated','seated','driver','passenger','boat','aircraft','motorcycle','scooter','entering','exiting','parachute','vault'].includes(mode);setWeapon(model,armed?state.weapon:null);r.weaponRoot.visible=!!armed;
 if(r.weapon&&armed){const aiming=!!state.aiming,reload=state.reload!==null&&Number.isFinite(state.reloadProgress)?clamp(state.reloadProgress,0,1):null,def=r.weapon.userData.definition,duck=state.crouching||state.crouched||mode==='crouch',recoil=clamp(rawRecoil*8,0,1);r.weaponRoot.position.set(.19,duck?1.00:1.32,aiming?.43:.27);r.weaponRoot.rotation.set(aiming?-(state.lookPitch||0):.48,0,aiming?0:-.13);r.weaponRoot.position.z-=recoil*.035;r.weaponRoot.rotation.x-=recoil*.08;model.updateMatrixWorld(true);
 const mag=r.weapon.userData.magazine,committed=state.reload?.committed===true;if(mag){mag.position.copy(mag.userData.homePosition);mag.rotation.copy(mag.userData.homeRotation);}if(reload!==null){r.weaponRoot.rotation.z=-.27*Math.sin(reload*Math.PI);r.weaponRoot.rotation.x+=.40*Math.sin(reload*Math.PI);if(mag&&!committed){const lift=Math.sin(Math.PI*clamp(reload/.76,0,1));mag.position[r.weapon.userData.reloadAxis||'y']-=lift*(def.category==='launcher'?.47:.17);if(def.category!=='launcher')mag.rotation.x+=.2*lift;}}model.updateMatrixWorld(true);const primary=r.weapon.userData.primaryGrip.getWorldPosition(new THREE.Vector3()),support=r.weapon.userData.supportGrip.getWorldPosition(new THREE.Vector3());if(reload!==null&&!committed&&mag){support.copy(mag.getWorldPosition(new THREE.Vector3()));support.x-=.025;}
 aimArm(model,'R',primary);aimArm(model,'L',support);for(const side of['L','R']){const hand=r['hand'+side];r.weaponRoot.getWorldQuaternion(qa);hand.parent.getWorldQuaternion(qb).invert();hand.quaternion.copy(qb.multiply(qa));hand.rotation.x=-.30;for(const finger of r['fingers'+side])finger.rotation.x=.9;r['thumb'+side].rotation.x=.55;}
 const moving=r.weapon.userData.mechanism;if(moving)moving.position.z=-recoil*.035;r.weapon.userData.flash.visible=r.flashTime>0;r.weapon.userData.flash.rotation.z=time*21;
 }
 if(['driver','passenger','seated','boat','aircraft','motorcycle','scooter'].includes(mode)){if(state.carTargets||state.vehicleGForce){const force=state.carTargets?.gForce||state.vehicleGForce;r.vehicleSway??={x:0,z:0,vx:0,vz:0};const sw=r.vehicleSway;for(const [k,target]of[['x',clamp(-(force.longitudinal||0)*.12,-.23,.23)],['z',clamp(-(force.lateral||0)*.18,-.28,.28)]]){sw['v'+k]+=(target-sw[k])*55*delta-sw['v'+k]*10*delta;sw[k]+=sw['v'+k]*delta;}r.spine.rotation.x+=sw.x;r.spine.rotation.z+=sw.z;r.head.rotation.x-=sw.x*.25;r.head.rotation.z-=sw.z*.35;}if(state.bikeTargets){r.pelvis.position.y=.015;r.spine.rotation.x=(state.bikeTargets.forwardLean??.28)+Math.max(0,state.bikeTuck||0)*.30-Math.max(0,state.bikeLean||0)*.35;}model.updateMatrixWorld(true);for(const side of(mode==='passenger'&&!state.bikeTargets?[]:['L','R'])){const anchor=state.bikeTargets?.['grip'+side]||state.carTargets?.['grip'+side],steer=(state.steer||0)*.10,target=anchor?new THREE.Vector3(anchor.x,anchor.y,anchor.z):new THREE.Vector3((side==='L'?-.19:.19)+steer,mode==='motorcycle'?.21:.32,mode==='motorcycle'||mode==='scooter'?.59:.38);if(!anchor)model.localToWorld(target);aimArm(model,side,target);r['hand'+side].rotation.x=-.85;if(state.bikeTargets){const hand=r['hand'+side];model.getWorldQuaternion(qa);hand.parent.getWorldQuaternion(qb).invert();hand.quaternion.copy(qb).multiply(qa).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-1.18));for(const finger of r['fingers'+side])finger.rotation.x=1.35;r['thumb'+side].rotation.x=.85;}if(state.bikeTargets?.['foot'+side])fitBikeLeg(model,side,state.bikeTargets['foot'+side]);}}
 // A menu-only upper-body pose keeps the player's seated/crouched lower body intact.
 if(holdingPhone){phonePose(r,!!state.phoneRaise);r.head.rotation.x=state.phoneRaise?.12:.26;r.head.rotation.y=.1;r.cup.visible=r.photoCamera.visible=r.package.visible=r.shoppingBag.visible=false;}
 /* V5.0: eating or drinking something just bought (eatT runs 0 to 1): the right hand comes up to the mouth twice and the head dips to meet it. */
 if(state.eatT!==undefined&&!state.ragdoll&&!holdingPhone){const q=clamp(state.eatT,0,1),lift=q<1?Math.sin(Math.PI*((q*2)%1)):0,up=.3+.7*lift;r.armR.rotation.set(-.55*up,0,-.2*up);r.forearmR.rotation.set(-2.05*up,0,0);r.handR.rotation.set(-.2,0,0);r.head.rotation.x=.16*lift;}
 /* V5.7: eating a delivered order (see feast above). */
 if(r.feastBag){const eating=state.feastT!==undefined&&!state.ragdoll;if(eating||r.feastShown){feast(model,r,state,eating?clamp(state.feastT,0,1):-1,time);r.feastShown=eating;}}
 /* V5.2: pushing a swing door open (pushDoor runs 0 to 1): both hands out in front, palms forward, leaning in a little. */
 if(state.pushDoor>.02&&!state.ragdoll&&!holdingPhone&&state.feastT===undefined){const k=clamp(state.pushDoor,0,1);for(const side of['L','R']){const arm=r['arm'+side],fore=r['forearm'+side],hand=r['hand'+side];if(!arm||!fore)continue;arm.rotation.x=mix(arm.rotation.x,-1.05,k);arm.rotation.z=mix(arm.rotation.z,side==='L'?.1:-.1,k);fore.rotation.x=mix(fore.rotation.x,-.5,k);if(hand)hand.rotation.x=mix(hand.rotation.x||0,-.9,k);}r.spine.rotation.x+=.1*k;}
 /* V3: a held cup or camera stays level whatever the wrist is doing (the cup tips when it is drunk from). */
 if(r.cup.visible||r.photoCamera.visible){model.updateMatrixWorld(true);model.getWorldQuaternion(qa);for(const[node,tilt]of[[r.cup,mode==='drink'?-.3-.35*Math.sin(time*.9+r.phase):0],[r.photoCamera,0]]){if(!node.visible)continue;node.parent.getWorldQuaternion(qb).invert();node.quaternion.copy(qb).multiply(qa);if(tilt)node.rotateX(tilt);}}
 if(r.canopy.visible){model.updateMatrixWorld(true);for(const line of r.suspension){const end=r.canopy.worldToLocal(line.clip.getWorldPosition(new THREE.Vector3())),delta=line.top.clone().sub(end);line.rope.position.copy(end).add(line.top).multiplyScalar(.5);line.rope.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize());line.rope.scale.set(1,delta.length(),1);}}
 if(state.punch&&!state.ragdoll){const p=state.punch,t=p.time||0,hand=p.hand==='left'||p.hand==='L'?'L':'R',other=hand==='L'?'R':'L',wind=clamp(t/.14,0,1),strike=clamp((t-.14)/.12,0,1),recover=clamp((t-.26)/.29,0,1),extension=t<.14?0:t<.26?strike:1-recover,guard=t<.14?wind:1-recover,side=hand==='L'?-1:1;r.spine.rotation.y=side*(t<.14?-.14*wind:.20*extension);r.armL.rotation.x=r.armR.rotation.x=-.55;r.forearmL.rotation.x=r.forearmR.rotation.x=-1.30;r.armL.rotation.z=.12;r.armR.rotation.z=-.12;r.armRoot?.rotation?.set?.(0,0,0);model.updateMatrixWorld(true);const target=new THREE.Vector3(side*(.22+.14*extension),1.20,.23+extension*.99-.10*guard*(1-extension));model.localToWorld(target);if(globalThis.CityPhysicalReactions){const at=globalThis.CityPhysicalReactions.punchHandPose({x:model.position.x,y:model.position.y,z:model.position.z,yaw:model.rotation.y,crouched:state.crouched||state.crouching,appearance:{heightScale:model.scale.y}},p,t);target.set(at.x,at.y,at.z);}aimArm(model,hand,target);r['hand'+hand].rotation.x=-.15;r['hand'+other].rotation.x=-.2;for(const name of['L','R']){for(const finger of r['fingers'+name])finger.rotation.x=1.25;r['thumb'+name].rotation.x=.9;}}
 /* V5.7: a hanging arm is turned so its palm faces the leg and the thumb points forward, the way a relaxed arm
  * hangs, instead of the palm facing back. Only an arm still in the plain standing, walking or running pose is
  * turned: every pose that places a hand itself (a weapon, a wheel, a phone, food, a door) leaves the forearm or
  * the hand turned already and is left alone. Eased, so a hand never snaps round. */
 {const loose=PALM_MODES.has(mode)&&!state.ragdoll&&!state.punch&&state.eatT===undefined&&state.feastT===undefined,ease=1-Math.exp(-delta*12),tw=r.palmTwist||(r.palmTwist={L:null,R:null});
  for(const side of['L','R']){const fore=r['forearm'+side],hand=r['hand'+side];if(!fore||!hand)continue;const plain=fore.rotation.y===0&&fore.rotation.z===0&&hand.rotation.y===0&&hand.rotation.z===0,want=loose&&plain?1-clamp(state.pushDoor||0,0,1):0;tw[side]=tw[side]===null?want:tw[side]+(want-tw[side])*ease;if(plain&&tw[side]>.002)fore.rotation.y=(side==='L'?-1:1)*PALM_TURN*tw[side];}}
 /* V3.7: a skirt follows the thighs when both are raised (sitting, crouching, riding) instead of hanging through the seat. */
 if(r.skirt){const lift=Math.max(0,-(r.thighL.rotation.x+r.thighR.rotation.x)*.5);const seated=smooth(.5,1.3,lift);/* raised a touch so the cloth lies over the thighs, never through them */r.skirt.rotation.x=-lift*.96;r.skirt.position.y+=.014*seated;}
 if(state.ragdoll?.points)applyRagdoll(model,state.ragdoll);else if(state.recoveryBlend>0&&state.recoveryFrom){const current=ragdollPose(model),t=Math.min(1,state.recoveryBlend/.28),points={};for(const[key,p]of Object.entries(current)){const old=state.recoveryFrom[key]||p;points[key]={x:mix(p.x,old.x,t),y:mix(p.y,old.y,t),z:mix(p.z,old.z,t)};}applyRagdoll(model,{points});}
 r.mode=mode;model.updateMatrixWorld(true);if(r.bustL)swayBust(r,delta);
}
/* V4.1: the covered chest shapes lag a little behind the body's own movement (steps, jumps, starts and stops) on a
 * damped spring. It reads how the spine moved since the last frame, so it needs nothing from the game. */
function swayBust(r,dt){
 const s=r.bustSway||(r.bustSway={x:0,y:0,z:0,vx:0,vy:0,vz:0,px:0,py:0,pz:0,wx:0,wy:0,wz:0,ready:false}),e=r.spine.matrixWorld.elements,x=e[12],y=e[13],z=e[14];
 if(!s.ready||!(dt>0)||dt>.1||Math.hypot(x-s.px,y-s.py,z-s.pz)>1.2){s.ready=true;s.px=x;s.py=y;s.pz=z;s.wx=s.wy=s.wz=0;}
 else{const vx=(x-s.px)/dt,vy=(y-s.py)/dt,vz=(z-s.pz)/dt,ax=clamp((vx-s.wx)/dt,-45,45),ay=clamp((vy-s.wy)/dt,-45,45),az=clamp((vz-s.wz)/dt,-45,45);s.px=x;s.py=y;s.pz=z;s.wx=vx;s.wy=vy;s.wz=vz;
  const tx=clamp(-(ax*e[0]+ay*e[1]+az*e[2])*.0016,-.009,.009),ty=clamp(-(ax*e[4]+ay*e[5]+az*e[6])*.0024,-.011,.011),tz=clamp(-(ax*e[8]+ay*e[9]+az*e[10])*.0014,-.009,.009)/* V8.9: about a centimetre, so the blended top stays inside the chest */,steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;
  for(let i=0;i<steps;i++){s.vx+=((tx-s.x)*80-s.vx*6.5)*h;s.vy+=((ty-s.y)*80-s.vy*6.5)*h;s.vz+=((tz-s.z)*80-s.vz*6.5)*h;s.x+=s.vx*h;s.y+=s.vy*h;s.z+=s.vz*h;}
  s.x=clamp(s.x,-.01,.01);s.y=clamp(s.y,-.012,.012);s.z=clamp(s.z,-.01,.01);}
 const k=1+.3*Math.max(0,(r.appearance.bust||1)-1);for(const[bone,side]of[[r.bustL,-1],[r.bustR,1]]){if(!bone)continue;const b=r.bindPositions[side<0?'bustL':'bustR'];if(!b)continue;bone.position.set(b.x+s.x*k,b.y+s.y*k,b.z+s.z*k);bone.rotation.set(s.z*1.2-s.y*1.6,0,-s.x*1.1+side*s.y*.5);bone.updateMatrixWorld(true);}
}
function applyRagdoll(model,ragdoll){const r=model.userData.rig,pts=ragdoll.points;if(!pts.pelvis||!pts.chest)return;const vec=name=>new THREE.Vector3(pts[name].x,pts[name].y,pts[name].z);model.updateMatrixWorld(true);r.pelvis.position.copy(model.worldToLocal(vec('pelvis')));const up=vec('chest').sub(vec('pelvis')).normalize(),side=vec('shoulderR').sub(vec('shoulderL')).normalize(),forward=new THREE.Vector3().crossVectors(side,up).normalize();side.crossVectors(up,forward).normalize();const basis=new THREE.Matrix4().makeBasis(side,up,forward),rotation=new THREE.Quaternion().setFromRotationMatrix(basis);model.getWorldQuaternion(qb).invert();r.pelvis.quaternion.copy(qb.multiply(rotation));r.spine.rotation.set(0,0,0);r.chest.rotation.set(0,0,0);model.updateMatrixWorld(true);
 const segment=(bone,from,to)=>{if(!pts[from]||!pts[to])return;bone.position.copy(bone.parent.worldToLocal(vec(from)));bone.parent.getWorldQuaternion(qb).invert();v1.copy(vec(to)).sub(vec(from)).normalize().applyQuaternion(qb);bone.quaternion.setFromUnitVectors(down,v1);bone.updateWorldMatrix(false,false);};for(const side of['L','R']){segment(r['arm'+side],'shoulder'+side,'elbow'+side);segment(r['forearm'+side],'elbow'+side,'hand'+side);segment(r['thigh'+side],'hip'+side,'knee'+side);segment(r['calf'+side],'knee'+side,'ankle'+side);const foot=r['foot'+side];foot.position.copy(foot.parent.worldToLocal(vec('ankle'+side)));const up=vec('knee'+side).sub(vec('ankle'+side)).normalize(),face=forward.clone().addScaledVector(up,-forward.dot(up)).normalize(),right=new THREE.Vector3().crossVectors(up,face).normalize(),basis=new THREE.Matrix4().makeBasis(right,up,face),rotation=new THREE.Quaternion().setFromRotationMatrix(basis);const worldMatrix=new THREE.Matrix4().compose(vec('ankle'+side),rotation,new THREE.Vector3(model.scale.x,model.scale.y,model.scale.z));foot.matrixAutoUpdate=false;foot.matrix.copy(foot.parent.matrixWorld).invert().multiply(worldMatrix);foot.updateWorldMatrix(false,false);}r.head.position.copy(r.head.parent.worldToLocal(vec('head')));r.head.position.y-=.11;if(ragdoll.headRotation){r.head.rotation.set(ragdoll.headRotation.x,ragdoll.headRotation.y,ragdoll.headRotation.z);}model.updateMatrixWorld(true);}
function ragdollPose(model){const r=model?.userData?.rig;if(!r)return null;model.updateMatrixWorld(true);const result={},map={pelvis:'pelvis',chest:'chest',head:'head',shoulderL:'armL',shoulderR:'armR',elbowL:'forearmL',elbowR:'forearmR',handL:'handL',handR:'handR',hipL:'thighL',hipR:'thighR',kneeL:'calfL',kneeR:'calfR',ankleL:'footL',ankleR:'footR'};/* V2: the rig's world matrices are current after the update above; read them directly instead of re-walking every bone's parent chain. */for(const name in map){const e=r[map[name]].matrixWorld.elements;let x=e[12],y=e[13],z=e[14];if(name==='head'){const length=Math.hypot(e[4],e[5],e[6])||1;x+=e[4]/length*.11;y+=e[5]/length*.11;z+=e[6]/length*.11;}result[name]={x,y,z};}result.chest={x:(result.shoulderL.x+result.shoulderR.x)/2,y:(result.shoulderL.y+result.shoulderR.y)/2-.01*model.scale.y,z:(result.shoulderL.z+result.shoulderR.z)/2};return result;}
function punchHandWorld(model,hand='right'){const r=model?.userData?.rig;return r?r[hand==='left'||hand==='L'?'handL':'handR'].getWorldPosition(new THREE.Vector3()):null;}
// ---- V6.1: sitting in a car (Platdo Drive) -------------------------------------------------------------------
// The model's origin is the hip point and the model itself is not turned. `seat` is given in the frame of the
// model's parent (the car, +z ahead): recline (how far the back leans, in radians), ankles (an [x,y,z] for the
// leg on the -x side and one for the +x side), footPitch (toes up, one for each foot) and hands: 'wheel', 'lap'
// or 'none'. For the wheel, o.wheel is {x,y,z,tilt,r} (tilt: how far the top of the wheel leans away from the
// driver) and o.wheelAngle is how far the wheel is turned. o.sway {pitch,roll} leans the upper body.
const CAR_GRIP={rise:.2,back:.058,out:.034,lift:-.012,curl:1.3,thumb:.75,follow:1.05};
function seatLeg(model,side,ankle,pitch,splay,rotation,scale){
 const r=model.userData.rig,thigh=r['thigh'+side],calf=r['calf'+side],foot=r['foot'+side],sign=side==='L'?-1:1,hip=thigh.getWorldPosition(new THREE.Vector3()),a=.40*scale,b=.39*scale,delta=ankle.clone().sub(hip),dir=delta.clone().normalize(),d=Math.max(.06,Math.min(delta.length(),a+b-.004)),along=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along));
 const pole=new THREE.Vector3(sign*splay,1,.1).applyQuaternion(rotation);pole.addScaledVector(dir,-pole.dot(dir)).normalize();
 const knee=hip.clone().addScaledVector(dir,along).addScaledVector(pole,height),end=hip.clone().addScaledVector(dir,d);
 thigh.parent.getWorldQuaternion(qb).invert();v1.copy(knee).sub(hip).normalize().applyQuaternion(qb);thigh.quaternion.setFromUnitVectors(down,v1);thigh.updateWorldMatrix(true,false);
 calf.parent.getWorldQuaternion(qb).invert();v1.copy(end).sub(knee).normalize().applyQuaternion(qb);calf.quaternion.setFromUnitVectors(down,v1);calf.updateWorldMatrix(true,false);
 foot.parent.getWorldQuaternion(qb).invert();foot.quaternion.copy(qb).multiply(rotation).multiply(qa.setFromEuler(new THREE.Euler(-pitch,sign*.1,0,'YXZ')));foot.updateWorldMatrix(true,false);
}
function carSeat(model,seat,o={}){
 const r=model?.userData?.rig;if(!r||!seat)return;
 const parent=model.parent,recline=seat.recline||0,tilt=recline*.45,rest=recline-tilt,sway=o.sway||{},pitch=sway.pitch||0,roll=sway.roll||0;
 r.pelvis.position.set(0,0,0);r.pelvis.rotation.set(-tilt,0,0);r.spine.rotation.set(-rest*.55+pitch,0,roll);r.chest.rotation.set(-rest*.45,0,0);r.neck.rotation.x=recline*.3;r.head.rotation.x=recline*.55-pitch*.32;r.head.rotation.z=-roll*.28;
 model.updateMatrixWorld(true);
 const rotation=model.getWorldQuaternion(new THREE.Quaternion()),scale=model.getWorldScale(new THREE.Vector3()).y,k=scale/.917,place=p=>{const v=new THREE.Vector3(p[0],p[1],p[2]);return parent?parent.localToWorld(v):v;};
 if(seat.ankles)['L','R'].forEach((side,i)=>{if(seat.ankles[i])seatLeg(model,side,place(seat.ankles[i]),seat.footPitch?.[i]??.3,seat.splay??.12,rotation,scale);});
 const wheel=o.wheel,grip=o.grip||CAR_GRIP,hands=seat.hands||'lap';if(hands==='none')return;
 for(const side of['L','R']){
  const sign=side==='L'?-1:1,fingers=r['fingers'+side]||[],thumb=r['thumb'+side];
  if(hands==='wheel'&&wheel){
   // The hand closes on the rim a little above three and nine o'clock and follows the wheel a good part of a turn.
   const turn=grip.follow*Math.tanh((o.wheelAngle||0)/grip.follow),phi=(sign>0?grip.rise:Math.PI-grip.rise)+turn,ct=Math.cos(wheel.tilt),st=Math.sin(wheel.tilt),c=Math.cos(phi),s=Math.sin(phi);
   const out=[c,s*ct,s*st],along=[-s*sign,c*ct*sign,c*st*sign],near=[0,st,-ct],R=wheel.r,wrist=[0,1,2].map(i=>[wheel.x,wheel.y,wheel.z][i]+out[i]*(R+grip.out*k)+near[i]*grip.back*k+along[i]*grip.lift*k);
   aimArm(model,side,place(wrist),[sign*.55,-1,-.3]);
   orientHand(model,side,[0,1,2].map(i=>-near[i]*.8-out[i]*.42+along[i]*.3),[0,1,2].map(i=>-out[i]*.9-near[i]*.3));
   for(const finger of fingers)finger.rotation.x=grip.curl;if(thumb)thumb.rotation.x=grip.thumb;
  }else{
   // Resting on the thigh, palm down.
   const hip=r['thigh'+side].getWorldPosition(new THREE.Vector3()),knee=r['calf'+side].getWorldPosition(new THREE.Vector3()),thighLine=knee.clone().sub(hip),up=new THREE.Vector3(0,1,0).applyQuaternion(rotation),target=hip.clone().addScaledVector(thighLine,.6).addScaledVector(up,.118*scale);
   aimArm(model,side,target,[sign*.75,-.45,-.7]);
   const inverse=rotation.clone().invert(),line=thighLine.normalize().applyQuaternion(inverse);
   orientHand(model,side,[line.x-sign*.12,line.y-.05,line.z],[0,-1,.08]);
   for(const finger of fingers)finger.rotation.x=.38;if(thumb)thumb.rotation.x=.2;
  }
 }
}

// ---- regions, dismemberment and first person ---------------------------------------------
// Region ownership follows the bone branches, so a detached piece never takes anything from the body that
// remains. The pelvis stays with the legs at a waist split.
const goreRoots={armL:'armL',armR:'armR',legL:'thighL',legR:'thighR',head:'neck',torso:'spine'};
function goreRegion(model,node){const r=model.userData.rig;for(let at=node;at&&at!==model;at=at.parent){for(const region of['armL','armR','legL','legR','head','torso'])if(at===r[goreRoots[region]])return region;if(at===r.weaponRoot)return'equipment';}return'base';}
// The cut surface: skin at the rim, muscle inside it, and bone with a darker marrow at the centre.
let stumpGeometry=null;
function stump(){if(stumpGeometry)return stumpGeometry;const s=new F.Shape(),rim=rgb('#5a1c1f'),flesh=rgb('#8e2428'),deep=rgb('#4a1014'),bone=rgb('#d8d0be'),marrow=rgb('#7a3a32');
 F.lathe(s,[[0,.012],[.09,.016],[.2,.02],[.27,.012],[.33,.006],[.6,.012],[.86,.008],[.97,0],[1,-.02]],{sides:20,rows:14,col:(angle,y,p)=>{const rr=Math.hypot(p.x,p.z),n=.8+.4*F.noise3(p.x*9,p.z*9,1.7);return rr<.1?marrow:rr<.25?bone:rr<.34?deep:rr<.9?tint(blend(flesh,deep,.5*F.noise3(p.x*5,p.z*5,3.1)),n):rim;}});
 stumpGeometry=s.geometry();stumpGeometry.userData.shared=true;return stumpGeometry;}
function goreCap(model,region){
 const r=model.userData.rig;r.goreCaps??={};if(r.goreCaps[region])return r.goreCaps[region];
 const M=r.measure,detached=!!model.userData.gorePiece,dims=region==='torso'?(detached?[M.hips*.98,.112]:[M.waist*.98,.09]):region==='head'?[M.neck+.012,M.neck+.014]:region.startsWith('leg')?[M.thigh*1.02,M.thigh*1.06]:[M.arm*1.08,M.arm*1.08];
 const cap=new THREE.Mesh(stump(),F.material('plain',{roughness:.3,tag:'gore'}));cap.scale.set(dims[0],1,dims[1]);
 // A cap faces along the limb it closes: down for a severed head or arm piece, up for what is left on the body.
 cap.position.y=region==='head'?-.045:region==='torso'?(detached?-.15:.02):region.startsWith('leg')?-.03:-.01;if(detached&&region!=='torso')cap.rotation.x=Math.PI;if(!detached&&(region==='torso'||region==='head'))cap.rotation.x=0;
 cap.userData.goreCap=region;cap.name='Cut boundary '+region;cap.castShadow=true;cap.layers.set(r.firstPerson&&!region.startsWith('arm')?1:0);r.visibilityRevision=(r.visibilityRevision||0)+1;r[goreRoots[region]].add(cap);r.goreCaps[region]=cap;return cap;
}
// Shows only the triangles whose bone is not in a hidden region. Index buffers are kept per combination.
function applyHidden(model,hiddenSet){
 const r=model.userData.rig,bare=!!r.bareLegs,key=[...hiddenSet].sort().join(',')+(bare?'|bare':'');
 for(const mesh of r.skinned||[]){const ranges=mesh.userData.ranges,source=mesh.userData.sourceIndex,keep=hiddenSet.size||bare?ranges.filter(range=>!hiddenSet.has(r.boneRegion[range.bone])&&!(bare&&r.legBone[range.bone])):ranges;
  if(!keep.length){mesh.userData.goreHidden=true;mesh.visible=false;continue;}mesh.userData.goreHidden=false;mesh.visible=true;
  if(keep.length===ranges.length){if(mesh.geometry.index!==source)mesh.geometry.setIndex(source);continue;}
  const cache=mesh.userData.indexCache??=new Map();let index=cache.get(key);if(!index){let total=0;for(const range of keep)total+=range.count;const array=new source.array.constructor(total);let at=0;for(const range of keep){array.set(source.array.subarray(range.start,range.start+range.count),at);at+=range.count;}index=new THREE.BufferAttribute(array,1);cache.set(key,index);}
  mesh.geometry.setIndex(index);}
 for(const item of r.loose||[])if(!item.mesh.userData.goreCap)item.mesh.visible=item.visible&&!hiddenSet.has(item.region);
}
function setGore(model,hidden=[],enabled=true){
 const r=model?.userData?.rig;if(!r)return;const hiddenSet=new Set(enabled?hidden:[]),key=[...hiddenSet].sort().join(',');
 if(r.goreKey!==key){r.goreKey=key;applyHidden(model,hiddenSet);}
 for(const region of Object.keys(goreRoots)){const cap=r.goreCaps?.[region];if(cap)cap.visible=false;}
 for(const region of hiddenSet){if(hiddenSet.has('torso')&&['armL','armR','head'].includes(region))continue;goreCap(model,region).visible=true;}
 if(hiddenSet.has('armR')||hiddenSet.has('torso')){if(r.goreWeaponVisible===undefined)r.goreWeaponVisible=r.weaponRoot.visible;r.weaponRoot.visible=false;}else if(r.goreWeaponVisible!==undefined){r.weaponRoot.visible=r.goreWeaponVisible;delete r.goreWeaponVisible;}
}
// Bare legs for the street scenes: the leg clothing is hidden and plain skin legs are shown in its place.
function setBareLegs(model,on){const r=model?.userData?.rig;on=!!on;if(!r||!r.skinned||!!r.bareLegs===on)return;r.bareLegs=on;r.streetLegs=on||undefined;
 if(on&&!r.bareLegMeshes){const previous=[buildDetail,buildLod],bones=[r.thighL,r.thighR,r.calfL,r.calfR],before=bones.map(bone=>new Set(bone.children));setQuality(r.detail,r.lod);r.bareLegMeshes=[];
  try{for(const side of[-1,1]){const label=side<0?'L':'R';buildThighSkin(r,r.body,r.headModel,side,label,THIGH_TOP,-.40);buildCalfSkin(r,r.body,r.headModel,side,label,0);}flushParts(r.pelvis);}finally{setQuality(previous[0],previous[1]);}
  bones.forEach((bone,i)=>{for(const child of bone.children)if(!before[i].has(child)&&child.isMesh){r.bareLegMeshes.push(child);r.loose.push({mesh:child,region:goreRegion(model,child),visible:true,bare:true});}});}
 for(const item of r.loose)if(item.bare)item.visible=on;
 applyHidden(model,new Set((r.goreKey||'').split(',').filter(Boolean)));}
// A separate copy of the chosen regions, posed as the body was at the moment of the cut.
function snapshotGore(model,regions,capture=null){
 const old=model.userData.rig,map=new Map(),selected=new Set(regions);
 function clone(node){let copy;if(node.isSkinnedMesh)return null;if(node.isMesh){if(node.userData.goreCap||!selected.has(goreRegion(model,node)))return null;copy=new THREE.Mesh(node.geometry,node.material);copy.castShadow=node.castShadow;copy.receiveShadow=node.receiveShadow;}else copy=new THREE.Group();
  copy.name=node.name;copy.position.copy(node.position);copy.quaternion.copy(node.quaternion);copy.scale.copy(node.scale);copy.matrixAutoUpdate=node.matrixAutoUpdate;copy.matrix.copy(node.matrix);copy.visible=node.isMesh?true:node.visible;map.set(node,copy);for(const child of node.children){const c=clone(child);if(c)copy.add(c);}return copy;}
 const copy=clone(model),r={};for(const[key,value]of Object.entries(old)){if(map.has(value))r[key]=map.get(value);else if(Array.isArray(value)&&value.length&&value[0]?.isObject3D)r[key]=value.map(v=>map.get(v)).filter(Boolean);}
 r.bones={};for(const[key,bone]of Object.entries(old.bones))r.bones[key]=map.get(bone);r.appearance=old.appearance;r.measure=old.measure;r.sockets={};r.skinned=[];r.loose=[];copy.userData.rig=r;
 if(old.skeleton){const bones=old.skeleton.bones.map(bone=>map.get(bone)),skeleton=new THREE.Skeleton(bones,old.skeleton.boneInverses.map(m=>m.clone()));r.skeleton=skeleton;r.boneRegion=old.boneRegion.slice();
  for(const source of old.skinned){const ranges=source.userData.ranges.filter(range=>selected.has(old.boneRegion[range.bone]));if(!ranges.length)continue;const from=source.userData.sourceIndex;let total=0;for(const range of ranges)total+=range.count;const array=new from.array.constructor(total);let at=0;for(const range of ranges){array.set(from.array.subarray(range.start,range.start+range.count),at);at+=range.count;}
   const geometry=new THREE.BufferGeometry();for(const name of Object.keys(source.geometry.attributes))geometry.setAttribute(name,source.geometry.attributes[name]);geometry.setIndex(new THREE.BufferAttribute(array,1));geometry.boundingSphere=source.geometry.boundingSphere.clone();geometry.userData.borrowed=true;
   const mesh=new THREE.SkinnedMesh(geometry,source.material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.name=source.name;mesh.userData.part=source.userData.part;mesh.userData.ranges=[];mesh.userData.sourceIndex=geometry.index;mesh.boundingSphere=new THREE.Sphere(new THREE.Vector3(0,.9,0),2.6);copy.add(mesh);mesh.bind(skeleton,source.bindMatrix);r.skinned.push(mesh);}}
 if(capture){new THREE.Matrix4().fromArray(capture.root).decompose(copy.position,copy.quaternion,copy.scale);for(const[key,pose]of Object.entries(capture.bones)){const bone=r.bones[key];if(!bone)continue;bone.matrix.fromArray(pose.matrix);bone.matrix.decompose(bone.position,bone.quaternion,bone.scale);bone.matrixAutoUpdate=pose.auto;}}
 copy.userData.gorePiece=true;copy.visible=true;copy.updateMatrixWorld(true);if(r.head)r.goreHeadQuaternion=r.head.getWorldQuaternion(new THREE.Quaternion());return copy;
}
function captureGorePose(model){model.updateMatrixWorld(true);const bones={};for(const[key,bone]of Object.entries(model.userData.rig.bones)){if(bone.matrixAutoUpdate)bone.updateMatrix();bones[key]={matrix:bone.matrix.toArray(),auto:bone.matrixAutoUpdate};}return{root:model.matrixWorld.toArray(),bones};}
function poseGorePiece(model,part){const original=part.initialPose||part.initialPoints,initial=part.initialPoints,points=part.points;if(!original||!initial||!points)return;const key=part.region==='head'?'head':part.region==='torso'?'pelvis':part.region.startsWith('arm')?'shoulder'+part.region.slice(-1):'hip'+part.region.slice(-1),a=initial[key],b=points[key];if(!a||!b)return;const vector=p=>new THREE.Vector3(p.x,p.y,p.z),frame=(p)=>{const origin=p[key],right=p.frameRight||p.headRight,forward=p.frameForward||p.headForward;if(!right||!forward)return new THREE.Quaternion();const x=vector(right).sub(vector(origin)).normalize(),z=vector(forward).sub(vector(origin)).normalize(),y=new THREE.Vector3().crossVectors(z,x).normalize();z.crossVectors(x,y).normalize();return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z));},rotation=frame(points).multiply(frame(initial).invert());model.userData.goreBaseRoot??=model.matrixWorld.clone();const delta=new THREE.Matrix4().makeTranslation(b.x,b.y,b.z).multiply(new THREE.Matrix4().makeRotationFromQuaternion(rotation)).multiply(new THREE.Matrix4().makeTranslation(-a.x,-a.y,-a.z)),world=delta.multiply(model.userData.goreBaseRoot);world.decompose(model.position,model.quaternion,model.scale);model.matrixAutoUpdate=true;model.updateMatrixWorld(true);const cap=goreCap(model,part.region);cap.visible=true;model.userData.gorePose=ragdollPose(model);}
// In first person the head is moved to a layer the player's camera does not draw.
function setFirstPerson(model,on){const r=model.userData.rig;if(!r)return;on=!!on;if(r.firstPerson===on&&r.layerRevision===(r.visibilityRevision||0))return;r.layerRevision=r.visibilityRevision||0;
 model.traverse(o=>{if(!o.isMesh)return;let head=o.userData.part==='head';if(!o.isSkinnedMesh){let branch=o;while(branch&&branch!==r.neck&&branch!==model)branch=branch.parent;head=branch===r.neck;}o.layers.set(on&&head?1:0);});r.firstPerson=on;}
function socketWorld(model,name,target=new THREE.Vector3()){const socket=model.userData.rig?.sockets[name];return socket?socket.getWorldPosition(target):null;}
function dispose(model){const geometries=new Set();model.traverse(o=>{if(o.isMesh&&!o.geometry.userData.shared)geometries.add(o.geometry);});for(const g of geometries){if(g.userData.borrowed){g.index=null;for(const name of Object.keys(g.attributes))g.deleteAttribute(name);}g.dispose();}model.userData.rig?.skeleton?.dispose?.();}
function stats(model){let triangles=0,drawCalls=0;model.traverse(o=>{if(o.isMesh&&o.visible){triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;drawCalls++;}});return{triangles,drawCalls,bones:Object.keys(model.userData.rig?.bones||{}).length};}
return{create,animate,feastStage,aimArm,orientHand,carSeat,setWeapon,weaponModel,socketWorld,setFirstPerson,applyRagdoll,ragdollPose,punchHandWorld,setGore,snapshotGore,poseGorePiece,captureGorePose,goreRegion,setBareLegs,dispose,stats,setQuality:F.setQuality,version:3,
 // Every material the models share, so a scene that cleans up after itself leaves them alone.
 materials:{values:()=>[...materials.values(),...(F.materials?.values?.()||[]),...faceMaterials.values()]}};
});
