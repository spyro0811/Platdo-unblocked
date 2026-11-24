
/* PLATDO City: Christmas, the things you see in the world (V13.0). Game only. Three parts, run by city-xmas-look.js:
 * DECORATIONS. Strings of coloured bulbs along the fronts of houses, shops, restaurants, the apartment buildings and
 *   the shelter, and wound round the street lamps; one big decorated tree on Lantern Pocket Green (ornaments, lights,
 *   a star; its boughs are solid while the mode is on, see world.js and christmas.js) and small decorated trees
 *   outside houses and shops. The bulbs and stars glow only at night (the game's own day and night); in the day they
 *   are just coloured glass. No lights are added to the scene: the glow is the material's own, so it costs nothing.
 *   Everything is a handful of shared, repeated shapes, built once and taken out of the scene when the mode is off.
 * SNOWMEN. The 250 snowmen of the shared rules (christmas.js), the ones still standing and near the camera, drawn as
 *   three snowballs with coal eyes, mouth and buttons, a carrot nose, stick arms, a scarf and a hat. When one is
 *   broken (by anyone in the room), its three snowballs tumble and roll down the ground for 10 to 15 seconds and
 *   then melt away, its hat flies off, and a puff of snow goes up. The player who was paid sees a green "+$500" float
 *   up from the spot. SOUND: the snowman sound is the recording named SOUND below in CityAudioAssets.assets; it is
 *   played once per broken snowman, louder the closer you are. Until that recording is added the break is silent.
 * TRACKS AND FOOTPRINTS. Vehicles leave tyre tracks and people (players and everyone walking about) leave footprints
 *   on snowy ground, never on sand, water, indoors or in the air. They fade out; at most a fixed number exist. */
(function(root){'use strict';
if(typeof document==='undefined')return;
/* ---- THE SNOWMAN SOUND HOOKUP --------------------------------------------------------------------------------------
 * The owner's own recording goes in as CityAudioAssets.assets.snowmanBreak = {file,mime,bytes,gain,data:<base64>}.
 * Nothing else plays in its place. */
const SOUND='snowmanBreak';
const X=()=>root.CityChristmas,HS=()=>root.CityHouses;
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const rnd=k=>hash(k)%100003/100003;
const COLORS=['#ff3b30','#34c759','#0a84ff','#ffd60a','#ff9f0a','#bf5af2'],WARM='#ffd7a0';
const ORN=['#c8102e','#d4af37','#1f5fbf','#c0c6cc','#0f7b3e','#b5179e'];
const glow={value:0};let T=null;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function M4(x,y,z,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx){return new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz));}
function merge(list){
 let n=0;const parts=list.map(([g,m])=>{const q=g.index?g.toNonIndexed():g.clone();if(m)q.applyMatrix4(m);n+=q.attributes.position.count;return q;});
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3);let o=0;
 for(const q of parts){pos.set(q.attributes.position.array,o*3);nor.set(q.attributes.normal.array,o*3);o+=q.attributes.position.count;q.dispose();}
 const out=new T.BufferGeometry();out.setAttribute('position',new T.BufferAttribute(pos,3));out.setAttribute('normal',new T.BufferAttribute(nor,3));out.computeBoundingSphere();return out;
}
function glowMat(o={}){
 const m=new T.MeshStandardMaterial({roughness:.35,metalness:0,...o});
 m.onBeforeCompile=sh=>{sh.uniforms.uXmasGlow=glow;sh.fragmentShader='uniform float uXmasGlow;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance+=vColor.rgb*uXmasGlow*1.9;\n#else\ntotalEmissiveRadiance+=diffuse*uXmasGlow*1.9;\n#endif');};
 m.customProgramCacheKey=()=>'xmas-glow';m.userData.noSnow=true;return m;
}
const plain=(color,o={})=>{const m=new T.MeshStandardMaterial({color,roughness:.85,metalness:0,...o});m.userData.noSnow=true;return m;};
function instanced(geo,mat,items,name,colors){
 const mesh=new T.InstancedMesh(geo,mat,Math.max(1,items.length));mesh.name=name;mesh.count=items.length;
 for(let i=0;i<items.length;i++){mesh.setMatrixAt(i,items[i].m);if(colors)mesh.setColorAt(i,new T.Color(items[i].c));}
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 if(items.length){mesh.computeBoundingSphere();mesh.boundingSphere.radius+=1;}
 return mesh;
}
// ---- DECORATIONS --------------------------------------------------------------------------------------------------
const Deco={group:null,scene:null};
function buildDeco(scene){
 const W=scene.world,H=HS(),R=X(),Z=new T.Vector3(0,0,1),Y=new T.Vector3(0,1,0);
 const cells=new Map(),cell=(x,z)=>{const k=Math.floor(x/420)+','+Math.floor(z/420);if(!cells.has(k))cells.set(k,{bulbs:[],wires:[],orns:[],stars:[]});return cells.get(k);};
 const spots=R.spots(W),nearSnowman=(x,z,d)=>spots.some(s=>Math.abs(s.x-x)<d&&Math.abs(s.z-z)<d&&Math.hypot(s.x-x,s.z-z)<d);
 const q=new T.Quaternion(),dir=new T.Vector3();
 const bulb=(x,y,z,c,size=1)=>cell(x,z).bulbs.push({m:M4(x,y,z,0,0,0,size,size*1.3,size),c});
 const wire=(a,b,thick=.016)=>{dir.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]);const len=dir.length();if(len<.01)return;dir.divideScalar(len);q.setFromUnitVectors(Z,dir);cell(a[0],a[2]).wires.push({m:new T.Matrix4().compose(new T.Vector3((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),q.clone(),new T.Vector3(thick,thick,len))});};
 /* a string of bulbs hung between hooks, sagging a little between each pair */
 const string=(hooks,palette,gap=.42,size=1)=>{let prev=null,k=0;for(let h=0;h<hooks.length-1;h++){const a=hooks[h],b=hooks[h+1],len=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),n=Math.max(1,Math.round(len/gap)),sag=Math.min(.22,len*.07);
  for(let i=0;i<n;i++){const t=i/n,p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-sag*Math.sin(Math.PI*t),a[2]+(b[2]-a[2])*t];if(prev)wire(prev,p);bulb(p[0],p[1]-.05*size,p[2],palette(k++),size);prev=p;}}
  const last=hooks[hooks.length-1];if(prev)wire(prev,last);bulb(last[0],last[1]-.05*size,last[2],palette(k),size);};
 const line=(a,b,y,step=2.2)=>{const len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.round(len/step)),out=[];for(let i=0;i<=n;i++)out.push([a[0]+(b[0]-a[0])*i/n,y,a[1]+(b[1]-a[1])*i/n]);return out;};
 const pal=key=>{const mode=hash(key)%5;return mode===0?()=>WARM:mode===1?i=>i%2?'#ff3b30':'#34c759':i=>COLORS[(i+hash(key))%COLORS.length];};
 // houses: along the front eave
 for(const h of W.houses||[]){const a=H.toWorld(h,-H.HX-.12,H.ROOF-.16,H.HZ+.34),b=H.toWorld(h,H.HX+.12,H.ROOF-.16,H.HZ+.34);string(line([a.x,a.z],[b.x,b.z],a.y,1.9),pal(h.id));}
 // shops, restaurants, diners and 6-7s: along the top of the front
 const LIT=new Set(['diner','clothing','equipment','restaurant','six-seven','garage','marina']);
 const fronts=[];for(const s of W.services||[]){if(!LIT.has(s.type)||!s.entrance||!Number.isFinite(s.w))continue;
  const dx=s.entrance.x-s.x,dz=s.entrance.z-s.z,alongX=Math.abs(dz)>=Math.abs(dx),y=s.y+Math.min(s.h,5.2)-.3;
  let a,b,face;if(alongX){const fz=s.z+Math.sign(dz||1)*(s.d/2+.22);a=[s.x-s.w/2+.5,fz];b=[s.x+s.w/2-.5,fz];face={x:0,z:Math.sign(dz||1)};}else{const fx=s.x+Math.sign(dx)*(s.w/2+.22);a=[fx,s.z-s.d/2+.5];b=[fx,s.z+s.d/2-.5];face={x:Math.sign(dx),z:0};}
  string(line(a,b,y),pal(s.id));fronts.push({s,face});}
 // apartment buildings: along the roof edge at the front; the shelter
 for(const a of W.apartments||[]){if(!Number.isFinite(a.w))continue;const sz=Math.sign((a.zf??a.z+1)-a.z)||1,fz=a.z+sz*(a.d/2+.25),y=(a.roofY||a.y+a.h)-.4;string(line([a.x-a.w/2+.4,fz],[a.x+a.w/2-.4,fz],y,2.4),pal(a.id));}
 {const sh=W.shelter,b=sh?.building;if(b){const sz=Math.sign((sh.start?.z??b.z+1)-b.z)||1,fz=b.z+sz*(b.d/2+.25);string(line([b.x-b.w/2+.4,fz],[b.x+b.w/2-.4,fz],(b.roofY||b.y+b.h)-.35),()=>WARM);}}
 // street lamps: wound round the post
 for(const p of W.props||[]){if(p.kind!=='streetlight')continue;const n=34,turns=3.5,a0=rnd(p.id)*6.28,pts=[];for(let i=0;i<=n;i++){const t=i/n,ang=a0+t*turns*6.2832;pts.push([p.x+Math.cos(ang)*.2,p.y+.8+t*3.6,p.z+Math.sin(ang)*.2]);}
  let prev=null;const colour=pal(p.id);pts.forEach((pt,i)=>{if(prev)wire(prev,pt,.014);bulb(pt[0],pt[1],pt[2],colour(i),.9);prev=pt;});}
 // decorated trees
 const trees=[];const tree=(x,ground,z,scale,key,lights=true)=>{trees.push({x,y:ground,z,scale,key});const y=ground+(scale<2?.3:0);/* a small tree stands in a planter */
  const L=[[.3,.78,.9],[.82,.62,.8],[1.3,.46,.7],[1.75,.3,.6]];
  const n=Math.round(12*scale*(scale>2?1.6:1)),N=Math.round(26*scale*(scale>2?1.5:1)),env=yy=>{let r=0;for(const c of L){const t=(yy-c[0])/c[2];if(t>=0&&t<=1)r=Math.max(r,c[1]*(1-t));}return r;};
  for(let i=0;i<n;i++){const c=L[i%4],f=.15+rnd(key+'of'+i)*.6,yy=c[0]+c[2]*f,rr=env(yy)+.035,ang=rnd(key+'oa'+i)*6.2832;cell(x,z).orns.push({m:M4(x+Math.cos(ang)*rr*scale,y+yy*scale,z+Math.sin(ang)*rr*scale,0,0,0,.05*scale*(scale>2?.75:1)),c:ORN[(i+hash(key))%ORN.length]});}
  if(lights){const colour=pal(key+'t');let prev=null;for(let i=0;i<N;i++){const t=i/N,yy=.36+t*1.92,ang=t*6.2832*5.5+rnd(key),rr=env(yy)+.03;const p=[x+Math.cos(ang)*rr*scale,y+yy*scale,z+Math.sin(ang)*rr*scale];if(prev)wire(prev,p,.012*Math.max(1,scale*.6));bulb(p[0],p[1],p[2],colour(i),scale>2?scale*.42:.85);prev=p;}}
  /* two stars crossed, so the topper reads as a star from every side */for(const turn of [0,Math.PI/2])cell(x,z).stars.push({m:M4(x,y+2.43*scale,z,0,rnd(key)*1.2+turn,0,scale),c:'#ffd23f'});};
 {const t=R.TREE,y=W.terrainHeight(t.x,t.z);tree(t.x,y,t.z,6.2,'big-tree');}
 const okTree=(x,z,y)=>R.cover(W,x,z)>=.99&&W.capsuleClear({x,y:y+.05,z},.55,2.2)&&!nearSnowman(x,z,2.2)&&Math.hypot(x-R.TREE.x,z-R.TREE.z)>8&&(()=>{const r=W.nearestRoad(x,z);return !r||r.distance>r.road.width/2+1.6;})();
 for(const h of W.houses||[]){const p=H.toWorld(h,5.6,0,H.HZ+1.25),y=W.groundHeight(p.x,p.z,h.y+1);if(okTree(p.x,p.z,y))tree(p.x,y,p.z,1,h.id);}
 for(const {s,face} of fronts){const side=hash(s.id)%2?1:-1;for(const k of [side,-side]){const along=((s.doorWidth||3)/2+1.6)*k,out=.95,x=s.entrance.x+face.x*out+(face.z?along:0),z=s.entrance.z+face.z*out+(face.x?along:0),y=W.groundHeight(x,z,s.y+1);if(okTree(x,z,y)){tree(x,y,z,1,s.id);break;}}}
 // shapes and materials
 const g=new T.Group();g.name='xmas-decorations';
 const bulbGeo=new T.OctahedronGeometry(.05,0),wireGeo=new T.BoxGeometry(1,1,1),ornGeo=new T.SphereGeometry(1,10,8);
 const star=new T.Shape();for(let i=0;i<10;i++){const r=i%2?.055:.14,a=i/10*6.2832+Math.PI/2;if(i)star.lineTo(Math.cos(a)*r,Math.sin(a)*r);else star.moveTo(Math.cos(a)*r,Math.sin(a)*r);}
 const starGeo=new T.ExtrudeGeometry(star,{depth:.035,bevelEnabled:false});starGeo.translate(0,0,-.0175);
 const mats={bulb:glowMat({color:'#ffffff'}),wire:plain('#1d2a20',{roughness:.6}),orn:plain('#ffffff',{roughness:.22,metalness:.55}),star:glowMat({color:'#ffffff',roughness:.3,metalness:.3})};
 for(const [k,c] of cells){if(c.bulbs.length)g.add(instanced(bulbGeo,mats.bulb,c.bulbs,'xmas-bulbs:'+k,true));if(c.wires.length)g.add(instanced(wireGeo,mats.wire,c.wires,'xmas-wires:'+k));if(c.orns.length)g.add(instanced(ornGeo,mats.orn,c.orns,'xmas-ornaments:'+k,true));if(c.stars.length)g.add(instanced(starGeo,mats.star,c.stars,'xmas-stars:'+k,true));}
 // the trees themselves: boughs (snowy on top), trunk, and a wooden planter under the small ones
 const cone=(r,h,y)=>[new T.ConeGeometry(1,1,12,1,true),M4(0,y+h/2,0,0,0,0,r,h,r)];
 const boughs=merge([cone(.78,.9,.3),cone(.62,.8,.82),cone(.46,.7,1.3),cone(.3,.6,1.75),[new T.CircleGeometry(1,12).rotateX(Math.PI/2),M4(0,.3,0,0,0,0,.78)],[new T.CircleGeometry(1,12).rotateX(Math.PI/2),M4(0,.82,0,0,0,0,.62)],[new T.CircleGeometry(1,12).rotateX(Math.PI/2),M4(0,1.3,0,0,0,0,.46)],[new T.CircleGeometry(1,12).rotateX(Math.PI/2),M4(0,1.75,0,0,0,0,.3)]]);
 const trunk=merge([[new T.CylinderGeometry(.09,.11,.42,8),M4(0,.21,0)]]),planter=merge([[new T.BoxGeometry(.7,.34,.7),M4(0,.17,0)]]);
 const needle=plain('#1d5e34',{roughness:.9,side:T.DoubleSide});needle.userData.noSnow=false;root.CityXmasLook.dress(needle,'fir');
 const items=s=>trees.filter(s).map(t=>({m:M4(t.x,t.y+(t.scale<2?.3:0),t.z,0,rnd(t.key)*6.28,0,t.scale)}));
 g.add(instanced(boughs,needle,items(()=>true),'xmas-tree-boughs'));g.add(instanced(trunk,plain('#5d4029'),items(()=>true),'xmas-tree-trunks'));g.add(instanced(planter,plain('#8a5a33',{roughness:.7}),trees.filter(t=>t.scale<2).map(t=>({m:M4(t.x,t.y,t.z,0,rnd(t.key)*6.28,0)})),'xmas-tree-planters'));
 /* the small trees stand in a planter, so everything above it is lifted by its height */
 g.userData.counts={trees:trees.length,bulbs:[...cells.values()].reduce((n,c)=>n+c.bulbs.length,0),ornaments:[...cells.values()].reduce((n,c)=>n+c.orns.length,0)};
 for(const m of g.children){m.castShadow=/boughs|planters|trunks/.test(m.name);m.receiveShadow=false;m.matrixAutoUpdate=false;}
 return g;
}
Deco.reset=function(){if(this.group){this.group.removeFromParent();}this.group=null;this.scene=null;};
Deco.frame=function(scene,sim,dt,amount,on){
 T=scene.T;if(amount<=0.001&&!on){if(this.group?.parent)this.group.removeFromParent();glow.value=0;return;}
 if(!amount)return;
 if(!this.group||this.scene!==scene){try{this.group=buildDeco(scene);this.scene=scene;root.CityXmasLook.L.decoCounts=this.group.userData.counts;}catch(e){root.CityXmasLook.L.decoError=String(e&&e.stack||e).slice(0,400);this.group=new T.Group();this.scene=scene;}}
 if(!this.group.parent)scene.scene.add(this.group);
 const day=root.CitySky?.daylight?root.CitySky.daylight(sim.dayTime??.5):1;glow.value=(1-clamp((day-.1)/.32,0,1))*clamp(amount*1.4-.2,0,1);
 this.group.visible=amount>.05;
};
// ---- SNOWMEN -------------------------------------------------------------------------------------------------------
const Snow={scene:null,meshes:null,list:[],next:0,rev:-1,seen:new Set(),seenOrder:[],debris:[],puffs:[],pops:[]};
function snowmanGeometry(){
 const ball=new T.SphereGeometry(1,16,12),coal=new T.SphereGeometry(1,6,4);
 const nose=new T.ConeGeometry(1,1,7);nose.rotateX(Math.PI/2);nose.translate(0,0,.5);
 const arm=new T.CylinderGeometry(.5,.32,1,5);arm.translate(0,.5,0);
 const top=merge([[new T.CylinderGeometry(1,1,1,14),M4(0,.13,0,0,0,0,.17,.24,.17)],[new T.CylinderGeometry(1,1,1,16),M4(0,.0125,0,0,0,0,.28,.025,.28)]]);
 const beanie=merge([[new T.SphereGeometry(1,14,8,0,6.2832,0,Math.PI/2),M4(0,.02,0,0,0,0,.215,.19,.215)],[new T.CylinderGeometry(1,1,1,14),M4(0,.03,0,0,0,0,.225,.06,.225)]]);
 const scarf=new T.TorusGeometry(1,.24,6,18);scarf.rotateX(Math.PI/2);
 return {ball,coal,nose,arm,top,beanie,scarf};
}
const HATS=[['top','#1b1b1f'],['beanie','#c8202d'],['top','#1f3d2a'],['beanie','#2457b8']],SCARF=['#c8202d','#1f7a3d','#2457b8','#e3a51b','#7d2f8f'];
function buildSnow(scene){
 const G=snowmanGeometry(),g=new T.Group();g.name='xmas-snowmen';
 const white=plain('#f6f8fc',{roughness:.95}),coal=plain('#17181a',{roughness:.9}),carrot=plain('#f07a1a',{roughness:.7}),wood=plain('#5b3d26'),cloth=plain('#ffffff',{roughness:.9});
 const mk=(geo,mat,n,name,colors)=>{const m=new T.InstancedMesh(geo,mat,n);m.name=name;m.count=0;m.frustumCulled=false;if(colors)m.setColorAt(0,new T.Color('#fff'));m.castShadow=name==='balls';g.add(m);return m;};
 const meshes={balls:mk(G.ball,white,750,'balls'),coal:mk(G.coal,coal,2750,'coal'),nose:mk(G.nose,carrot,250,'nose'),arms:mk(G.arm,wood,1000,'arms'),top:mk(G.top,cloth,250,'tophats',true),beanie:mk(G.beanie,cloth,250,'beanies',true),pom:mk(G.coal,white,250,'poms'),scarf:mk(G.scarf,cloth,250,'scarves',true),
  dBalls:mk(G.ball,white,72,'debris-balls'),dTop:mk(G.top,cloth,24,'debris-tophats',true),dBeanie:mk(G.beanie,cloth,24,'debris-beanies',true)};
 /* the puff of snow when one breaks: a small pool of points moved by the CPU */
 const P=240,pos=new Float32Array(P*3),life=new Float32Array(P),pg=new T.BufferGeometry();pg.setAttribute('position',new T.BufferAttribute(pos,3));pg.setAttribute('aLife',new T.BufferAttribute(life,1));pg.boundingSphere=new T.Sphere(new T.Vector3(),1e6);
 const pm=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uScale:{value:600}},vertexShader:'attribute float aLife;varying float vL;uniform float uScale;void main(){vL=aLife;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=aLife>0.0?clamp(uScale*.11/max(-mv.z,.5),1.0,24.0):0.0;}',fragmentShader:'varying float vL;void main(){if(vL<=0.0)discard;vec2 c=gl_PointCoord-.5;float r=length(c);if(r>.5)discard;gl_FragColor=vec4(.97,.98,1.0,smoothstep(.5,.1,r)*clamp(vL,0.0,1.0)*.85);}'});
 const pts=new T.Points(pg,pm);pts.name='snow-puff';pts.frustumCulled=false;g.add(pts);meshes.puff={pts,pos,life,vel:new Float32Array(P*3),next:0};
 return {g,meshes};
}
function snowmanParts(s,far,put){
 const sz=s.size,base=M4(s.x,s.y,s.z,0,s.yaw,0,sz),B=X().BALLS,head=B[2][1],mid=B[1][1];
 const at=(x,y,z,rx,ry,rz,sx,sy,sz2)=>new T.Matrix4().multiplyMatrices(base,M4(x,y,z,rx,ry,rz,sx,sy??sx,sz2??sx));
 for(const b of B)put('balls',at(0,b[1],0,0,0,0,b[0]*(1+.03*Math.sin(s.index*7.3+b[1]*10)),b[0]*.97,b[0]));
 const hat=HATS[s.hat%4],hy=head+B[2][0]*(hat[0]==='top'?.78:.42);put(hat[0],at(0,hy,0,-.1+.2*rnd(s.id+'h'),0,.1-.2*rnd(s.id+'k'),1),hat[1]);if(hat[0]==='beanie')put('pom',at(0,hy+.235,0,0,0,0,.062));
 if(far)return;
 put('scarf',at(0,(head+mid)/2+.03,0,0,0,0,.215,.25,.215),SCARF[s.index%SCARF.length]);
 const onHead=(x,y)=>Math.sqrt(Math.max(0,.0625-x*x-y*y))+.004;
 for(const sx of [-1,1])put('coal',at(sx*.085,head+.06,onHead(sx*.085,.06),0,0,0,.026));
 for(let i=0;i<5;i++){const x=(i-2)*.045,y=-.1+Math.abs(i-2)*.02;put('coal',at(x,head+y,onHead(x,y),0,0,0,.016));}
 for(let i=0;i<3;i++){const y=mid+.15-i*.15;put('coal',at(0,y,Math.sqrt(Math.max(0,.36*.36-(y-mid)*(y-mid)))+.005,0,0,0,.028));}
 put('nose',at(0,head-.005,.235,.08,0,0,.032,.032,.2));
 for(const sx of [-1,1]){const shoulder=[sx*.31,mid+.08,0],d=new T.Vector3(sx*.86,.46,.18*rnd(s.id+sx)).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d);
  put('arms',new T.Matrix4().multiplyMatrices(base,new T.Matrix4().compose(new T.Vector3(...shoulder),q,new T.Vector3(.038,.62,.038))));
  const tw=new T.Vector3(sx*.6,.8,.1).normalize(),q2=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),tw),p=new T.Vector3(...shoulder).addScaledVector(d,.42);
  put('arms',new T.Matrix4().multiplyMatrices(base,new T.Matrix4().compose(p,q2,new T.Vector3(.024,.2,.024))));}
}
Snow.reset=function(){if(this.g)this.g.removeFromParent();this.g=null;this.meshes=null;this.scene=null;this.debris=[];this.pops.forEach(p=>p.el.remove());this.pops=[];this.rev=-1;};
Snow.refresh=function(scene,sim){
 const st=sim.xmas,M=this.meshes,cam=scene.camera.position,W=scene.world,list=X().spots(W),counts={};
 for(const k of ['balls','coal','nose','arms','top','beanie','pom','scarf'])counts[k]=0;
 const put=(k,m,c)=>{const mesh=M[k];const i=counts[k]++;if(i>=mesh.instanceMatrix.count)return;mesh.setMatrixAt(i,m);if(c&&mesh.instanceColor)mesh.setColorAt(i,new T.Color(c));};
 for(const s of list){if(st.broken[s.index])continue;const d=Math.hypot(s.x-cam.x,s.z-cam.z);if(d>300)continue;snowmanParts(s,d>110,put);}
 for(const k in counts){const mesh=M[k];mesh.count=Math.min(counts[k],mesh.instanceMatrix.count);mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
};
function playBreak(scene,e){
 const a=root.CityXmas?.audio;if(!a?.sample)return;const cam=scene.camera,d=Math.hypot(e.x-cam.position.x,e.z-cam.position.z);if(d>75)return;
 const gain=Math.pow(1-d/75,1.6);const right=new T.Vector3(1,0,0).applyQuaternion(cam.quaternion),to=new T.Vector3(e.x-cam.position.x,0,e.z-cam.position.z).normalize();
 try{a.sample(SOUND,gain,clamp(right.dot(to),-1,1)*.75);}catch(_){}
}
function popup(scene,e){
 if(!document.getElementById('xmasPopStyle')){const st=document.createElement('style');st.id='xmasPopStyle';st.textContent='.xmas-pop{position:fixed;left:0;top:0;z-index:40;pointer-events:none;font:800 34px/1 -apple-system,"Segoe UI",system-ui,sans-serif;color:#39d76c;letter-spacing:-.5px;text-shadow:0 2px 0 #0d4a24,0 0 14px #000a;white-space:nowrap;will-change:transform,opacity}';document.head.appendChild(st);}
 const el=document.createElement('div');el.className='xmas-pop';el.textContent='+$'+(X()?.REWARD||500).toLocaleString('en-US');el.style.opacity='0';document.body.appendChild(el);
 Snow.pops.push({el,x:e.x,y:e.y+X().TOP*1.05,z:e.z,age:0});
}
function spawnDebris(scene,sim,e){
 const R=X(),s=R.spots(scene.world)[e.index];if(!s)return;const B=R.BALLS,sz=s.size,dx=Number.isFinite(e.dx)?e.dx:0,dz=Number.isFinite(e.dz)?e.dz:1,force=e.cause==='drive'?2.2:e.cause==='shot'?1.4:1;
 const life=R.DEBRIS[0]+rnd(e.id||s.id+Snow.debris.length)*(R.DEBRIS[1]-R.DEBRIS[0]);
 B.forEach((b,i)=>{const k=(i+1)/3,side=(rnd(s.id+'s'+i+(e.id||''))-.5)*2;
  Snow.debris.push({kind:'ball',x:s.x,y:s.y+b[1]*sz,z:s.z,r:b[0]*sz,vx:(dx*(1.2+k*1.6)-dz*side*.9)*force,vy:.6+k*2.4,vz:(dz*(1.2+k*1.6)+dx*side*.9)*force,q:new T.Quaternion(),life:life+i*.4,age:0});});
 const hat=HATS[s.hat%4];Snow.debris.push({kind:hat[0],color:hat[1],x:s.x,y:s.y+(B[2][1]+B[2][0]*(hat[0]==='top'?.78:.42))*sz,z:s.z,r:.12,vx:dx*2.4*force+(rnd(s.id+'hx')-.5),vy:3.6,vz:dz*2.4*force+(rnd(s.id+'hz')-.5),q:new T.Quaternion(),spin:(rnd(s.id+'sp')-.5)*9,life:Math.min(life,6),age:0});
 const P=Snow.meshes.puff;for(let i=0;i<28;i++){const j=P.next=(P.next+1)%P.life.length,a=rnd(s.id+'p'+i+P.next)*6.2832,up=rnd(s.id+'u'+i);P.pos[j*3]=s.x+Math.cos(a)*.3;P.pos[j*3+1]=s.y+.4+up*1.3*sz;P.pos[j*3+2]=s.z+Math.sin(a)*.3;P.vel[j*3]=Math.cos(a)*(1+up*1.6)+dx;P.vel[j*3+1]=.8+up*2.2;P.vel[j*3+2]=Math.sin(a)*(1+up*1.6)+dz;P.life[j]=1;}
}
function stepDebris(scene,dt){
 const W=scene.world,M=Snow.meshes,axis=new T.Vector3(),qa=new T.Quaternion(),n={ball:0,top:0,beanie:0};
 for(const d of Snow.debris){
  d.age+=dt;if(d.age>d.life)continue;
  d.vy-=9.8*dt;let nx=d.x+d.vx*dt,nz=d.z+d.vz*dt,ny=d.y+d.vy*dt;
  if(!W.capsuleClear({x:nx,y:ny-d.r+.06,z:nz},d.r*.85,d.r*1.5)){if(W.capsuleClear({x:d.x,y:ny-d.r+.06,z:nz},d.r*.85,d.r*1.5)){nx=d.x;d.vx*=-.35;}else if(W.capsuleClear({x:nx,y:ny-d.r+.06,z:d.z},d.r*.85,d.r*1.5)){nz=d.z;d.vz*=-.35;}else{nx=d.x;nz=d.z;d.vx*=-.3;d.vz*=-.3;}}
  const ground=W.groundHeight(nx,nz,d.y+.6);let grounded=false;
  if(ny-d.r<=ground){ny=ground+d.r;grounded=true;if(d.vy<-1.1)d.vy=-d.vy*(d.kind==='ball'?.3:.15);else d.vy=0;
   const sx=(W.terrainHeight(nx+.5,nz)-W.terrainHeight(nx-.5,nz)),sz=(W.terrainHeight(nx,nz+.5)-W.terrainHeight(nx,nz-.5));d.vx-=sx*5.2*dt;d.vz-=sz*5.2*dt;
   const f=Math.exp(-dt*(d.kind==='ball'?.75:3.5));d.vx*=f;d.vz*=f;}
  d.x=nx;d.y=ny;d.z=nz;
  if(d.kind==='ball'){const sp=Math.hypot(d.vx,d.vz);if(sp>.02&&grounded){axis.set(d.vz,0,-d.vx).divideScalar(sp);qa.setFromAxisAngle(axis,sp/d.r*dt);d.q.premultiply(qa);}}
  else{qa.setFromAxisAngle(axis.set(0,1,0),(d.spin||0)*dt*(grounded?.2:1));d.q.premultiply(qa);if(!grounded){qa.setFromAxisAngle(axis.set(1,0,0),dt*2.4);d.q.multiply(qa);}}
  const left=d.life-d.age,k=left<1.3?Math.max(0,left/1.3):1,scale=d.kind==='ball'?d.r*(.35+.65*k):k;
  const m=new T.Matrix4().compose(new T.Vector3(d.x,d.y-(d.kind==='ball'?(1-k)*d.r*.55:.0),d.z),d.q,new T.Vector3(scale,scale*(d.kind==='ball'?.96:1),scale));
  if(d.kind==='ball'){if(n.ball<M.dBalls.instanceMatrix.count)M.dBalls.setMatrixAt(n.ball++,m);}
  else{const mesh=d.kind==='top'?M.dTop:M.dBeanie,i=n[d.kind];if(i<mesh.instanceMatrix.count){mesh.setMatrixAt(i,m);mesh.setColorAt(i,new T.Color(d.color));n[d.kind]++;}}
 }
 Snow.debris=Snow.debris.filter(d=>d.age<=d.life);
 M.dBalls.count=n.ball;M.dTop.count=n.top;M.dBeanie.count=n.beanie;for(const k of ['dBalls','dTop','dBeanie']){M[k].instanceMatrix.needsUpdate=true;if(M[k].instanceColor)M[k].instanceColor.needsUpdate=true;}
 const P=M.puff;let live=false;for(let j=0;j<P.life.length;j++){if(P.life[j]<=0)continue;live=true;P.life[j]-=dt*1.25;P.vel[j*3+1]-=3.5*dt;for(let a=0;a<3;a++)P.pos[j*3+a]+=P.vel[j*3+a]*dt;P.vel[j*3]*=.96;P.vel[j*3+2]*=.96;}
 if(live||P.wasLive){P.pts.geometry.attributes.position.needsUpdate=true;P.pts.geometry.attributes.aLife.needsUpdate=true;}P.wasLive=live;
 P.pts.material.uniforms.uScale.value=scene.renderer.domElement.height/Math.tan((scene.camera.fov||60)*Math.PI/360)*.5;
}
function stepPops(scene,dt){
 const cam=scene.camera,rect=scene.renderer.domElement.getBoundingClientRect(),v=new T.Vector3();
 for(const p of Snow.pops){p.age+=dt;v.set(p.x,p.y+p.age*.6,p.z).project(cam);const show=v.z<1&&v.z>-1;const d=Math.hypot(p.x-cam.position.x,p.z-cam.position.z);
  p.el.style.opacity=show?String(p.age<.15?p.age/.15:p.age>1.7?Math.max(0,1-(p.age-1.7)/.7):1):'0';
  p.el.style.transform='translate('+((v.x*.5+.5)*rect.width+rect.left).toFixed(1)+'px,'+((-v.y*.5+.5)*rect.height+rect.top).toFixed(1)+'px) translate(-50%,-50%) scale('+clamp(1.25-d/60,.55,1.15).toFixed(2)+')';}
 Snow.pops=Snow.pops.filter(p=>{if(p.age>2.4){p.el.remove();return false;}return true;});
}
Snow.frame=function(scene,sim,dt,amount,on){
 T=scene.T;const st=sim.xmas;
 if(!on||!st){if(this.g?.parent){this.g.removeFromParent();}this.debris=[];for(const p of this.pops)p.el.remove();this.pops=[];if(sim.onlineXmasEvents)sim.onlineXmasEvents.length=0;if(st?.recent)for(const e of st.recent)this.mark(e.id);return;}
 if(!this.g||this.scene!==scene){const b=buildSnow(scene);this.g=b.g;this.meshes=b.meshes;this.scene=scene;this.rev=-1;}
 if(!this.g.parent)scene.scene.add(this.g);this.g.visible=amount>.05;
 /* breaks: from the shared rules in a solo game, from the host online */
 const fresh=[];if(st.recent)for(const e of st.recent)if(!this.seen.has(e.id)){this.mark(e.id);fresh.push({...e,mine:e.paid&&e.by===sim.player.id});}
 if(sim.onlineXmasEvents?.length){for(const e of sim.onlineXmasEvents.splice(0))if(!this.seen.has(e.id)){this.mark(e.id);fresh.push(e);}}
 for(const e of fresh){const d=Math.hypot(e.x-scene.camera.position.x,e.z-scene.camera.position.z);if(d<180)spawnDebris(scene,sim,e);playBreak(scene,e);if(e.mine&&e.paid)popup(scene,e);this.rev=-1;}
 this.next-=dt;if(this.rev!==st.revision||this.next<=0){this.rev=st.revision;this.next=.4;this.refresh(scene,sim);}
 stepDebris(scene,Math.min(dt,.05));stepPops(scene,dt);
};
Snow.mark=function(id){if(id==null||this.seen.has(id))return;this.seen.add(id);this.seenOrder.push(id);if(this.seenOrder.length>400)this.seen.delete(this.seenOrder.shift());};
// ---- TRACKS AND FOOTPRINTS -----------------------------------------------------------------------------------------
const Marks={scene:null,mesh:null,cap:2400,next:0,time:0,cars:new Map(),feet:new Map(),tidy:0,dirty:false};
function buildMarks(scene){
 const geo=new T.PlaneGeometry(1,1);geo.rotateX(-Math.PI/2);const ig=new T.InstancedBufferGeometry();ig.index=geo.index;ig.attributes.position=geo.attributes.position;ig.attributes.uv=geo.attributes.uv;
 const cap=Marks.cap,born=new Float32Array(cap).fill(-1e6),kind=new Float32Array(cap),mats=new Float32Array(cap*16);
 ig.setAttribute('aBorn',new T.InstancedBufferAttribute(born,1));ig.setAttribute('aKind',new T.InstancedBufferAttribute(kind,1));ig.setAttribute('aM',new T.InstancedBufferAttribute(mats,16));ig.instanceCount=cap;
 const m=new T.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,uniforms:{uTime:{value:0},uAmount:{value:1},uDay:{value:1}},
  vertexShader:`attribute float aBorn;attribute float aKind;attribute mat4 aM;uniform float uTime;varying vec2 vUv;varying float vA;varying float vK;
void main(){vUv=uv;vK=aKind;float life=aKind>.5?24.0:34.0;vA=clamp(1.0-(uTime-aBorn)/life,0.0,1.0);vA*=vA*(3.0-2.0*vA);gl_Position=projectionMatrix*viewMatrix*aM*vec4(position,1.0);if(vA<=0.0)gl_Position=vec4(2.0,2.0,2.0,1.0);}`,
  fragmentShader:`varying vec2 vUv;varying float vA;varying float vK;uniform float uAmount;uniform float uDay;
void main(){float a;vec2 p=vec2(vUv.x-.5,.5-vUv.y);
 if(vK>.5){vec2 q=vec2(p.x*2.2,p.y);float sole=length(vec2(q.x,(q.y-.1)*1.25))<.38?1.0:0.0;float heel=length(vec2(q.x*1.05,(q.y+.27)*1.6))<.27?1.0:0.0;a=max(sole,heel);}
 else{a=smoothstep(.5,.38,abs(p.x))*(.72+.28*step(.5,fract(vUv.y*7.0+.25)));}
 a*=vA*uAmount;if(a<.01)discard;vec3 c=mix(vec3(.40,.44,.53),vec3(.47,.51,.6),vK)*(.55+.45*uDay);gl_FragColor=vec4(c,a*.8);}`});
 const mesh=new T.Mesh(ig,m);mesh.name='xmas-marks';mesh.frustumCulled=false;mesh.renderOrder=2;return mesh;
}
function snowy(W,x,z,y){const R=X();if(R.cover(W,x,z)<.9)return false;const roof=root.CityXmasLook.roofAt(x,z);if(roof>y+.45)return false;const m=root.CityXmasLook.L.maps;if(m){const i=Math.floor((x-root.CityXmasLook.BOX.x0)/1.25),j=Math.floor((z-root.CityXmasLook.BOX.z0)/1.25);if(i>=0&&j>=0&&i<m.nx&&j<m.nz&&m.I[j*m.nx+i]>y+.05)return false;}const water=W.waterHeight(x,z,0);return !(Number.isFinite(water)&&water>y-.05);}
function addMark(x,y,z,dx,dz,w,l,kind){
 const i=Marks.next=(Marks.next+1)%Marks.cap,g=Marks.mesh.geometry,yaw=Math.atan2(dx,dz),c=Math.cos(yaw),s=Math.sin(yaw),M=g.attributes.aM.array,o=i*16;
 M[o]=c*w;M[o+1]=0;M[o+2]=-s*w;M[o+3]=0;M[o+4]=0;M[o+5]=1;M[o+6]=0;M[o+7]=0;M[o+8]=s*l;M[o+9]=0;M[o+10]=c*l;M[o+11]=0;M[o+12]=x;M[o+13]=y;M[o+14]=z;M[o+15]=1;
 g.attributes.aBorn.array[i]=Marks.time;g.attributes.aKind.array[i]=kind;Marks.dirty=true;
}
Marks.reset=function(){if(this.mesh)this.mesh.removeFromParent();this.mesh=null;this.scene=null;this.cars.clear();this.feet.clear();};
Marks.clear=function(){if(!this.mesh)return;const g=this.mesh.geometry;g.attributes.aBorn.array.fill(-1e6);g.attributes.aBorn.needsUpdate=true;this.cars.clear();this.feet.clear();};
Marks.frame=function(scene,sim,dt,amount,on){
 T=scene.T;if(!on||!sim.xmas){if(this.mesh?.parent){this.clear();this.mesh.removeFromParent();}return;}
 if(!this.mesh||this.scene!==scene){this.mesh=buildMarks(scene);this.scene=scene;}
 if(!this.mesh.parent)scene.scene.add(this.mesh);this.time+=dt;const u=this.mesh.material.uniforms;u.uTime.value=this.time;u.uAmount.value=amount;u.uDay.value=root.CitySky?.daylight?.4+.6*root.CitySky.daylight(sim.dayTime??.5):1;
 if(amount<.5)return;
 const W=scene.world,cam=scene.camera.position,V=root.CityVehicles;
 // tyres
 for(const v of sim.vehicles||[]){
  const def=V?.byId?.[v.typeId];if(!def||def.category!=='land')continue;if(Math.abs(v.x-cam.x)>110||Math.abs(v.z-cam.z)>110){this.cars.delete(v.id);continue;}
  const c=Math.cos(v.yaw||0),s=Math.sin(v.yaw||0),bike=def.kind==='bike',half=bike?0:(v.width||def.width||1.9)*.41,ax=(v.length||def.length||4.5)*.33;
  const wheels=bike?[[0,-ax],[0,ax]]:[[-half,-ax],[half,-ax],[-half,ax],[half,ax]],now=wheels.map(([lx,lz])=>[v.x+lx*c+lz*s,v.z-lx*s+lz*c]);
  let st=this.cars.get(v.id);if(!st){this.cars.set(v.id,{w:now});continue;}
  const moved=Math.hypot(now[0][0]-st.w[0][0],now[0][1]-st.w[0][1]);if(moved<.4)continue;
  if(moved<4&&v.grounded!==false&&v.onSnow!==false){const ground=W.groundHeight(v.x,v.z,(v.y||0)+.6);if(Math.abs((v.y||0)-ground)<1.2)
   for(let k=0;k<now.length;k++){const a=st.w[k],b=now[k],mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2,gy=W.groundHeight(mx,mz,ground+.6);if(Math.abs(gy-ground)>.5||!snowy(W,mx,mz,gy))continue;addMark(mx,gy+.03,mz,b[0]-a[0],b[1]-a[1],bike?.11:.23,Math.hypot(b[0]-a[0],b[1]-a[1])+.04,0);}}
  st.w=now;
 }
 // feet: the player and everyone walking about
 const people=[sim.player,...(sim.npcs||[])];
 for(const p of people){
  if(!p||!p.id||Math.abs(p.x-cam.x)>75||Math.abs(p.z-cam.z)>75)continue;
  const walking=!p.vehicleId&&(p.mode==='onFoot'||p.mode===undefined||p.mode==='walk')&&!(p.ragdoll&&p.ragdoll.active)&&!p.physical&&(p.health===undefined||p.health>0);
  let st=this.feet.get(p.id);if(!st){this.feet.set(p.id,{x:p.x,z:p.z,acc:0,side:1,seen:this.time});continue;}st.seen=this.time;
  const dx=p.x-st.x,dz=p.z-st.z,d=Math.hypot(dx,dz);st.x=p.x;st.z=p.z;if(!walking||d<.002||d>3){st.acc=0;continue;}
  const speed=d/Math.max(dt,1e-3),stride=clamp(.62+speed*.085,.66,1.2);st.acc+=d;if(st.acc<stride)continue;st.acc-=stride;
  const ground=W.groundHeight(p.x,p.z,(p.y||0)+.4);if(Math.abs((p.y||0)-ground)>.25)continue;
  const ux=dx/d,uz=dz/d;st.side=-st.side;const fx=p.x+uz*.11*st.side,fz=p.z-ux*.11*st.side;if(!snowy(W,fx,fz,ground))continue;
  addMark(fx,ground+.025,fz,ux,uz,.13,.29,1);
 }
 if((this.tidy+=dt)>5){this.tidy=0;for(const [k,s] of this.feet)if(this.time-s.seen>8)this.feet.delete(k);const ids=new Set((sim.vehicles||[]).map(v=>v.id));for(const k of this.cars.keys())if(!ids.has(k))this.cars.delete(k);}
 if(this.dirty){const g=this.mesh.geometry;g.attributes.aM.needsUpdate=true;g.attributes.aBorn.needsUpdate=true;g.attributes.aKind.needsUpdate=true;this.dirty=false;}
};
// ---- hand the parts to the look ------------------------------------------------------------------------------------
function start(){const Look=root.CityXmasLook;if(!Look||!Look.parts)return false;if(!Look.parts.includes(Deco))Look.parts.push(Deco,Snow,Marks);return true;}
if(!start()){const t=setInterval(()=>{if(start())clearInterval(t);},250);}
root.CityXmasWorld={Deco,Snow,Marks,SOUND};
})(typeof window!=='undefined'?window:globalThis);
