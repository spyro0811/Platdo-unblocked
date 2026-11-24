
/* PLATDO City dealerships: the look (V13.1). Game only. The places themselves (where everything stands, what is solid)
 * are in city-dealers.js; the deliveries in city-dealer-fleet.js.
 * - The showrooms: a glass front and glass sides on a steel frame, a solid back wall, a fascia band in the shop's colour
 *   with the owner's logo over the entrance, the logo again on the wall behind the sales desk, ceiling light panels, a
 *   polished floor, podiums for the vehicles inside. Harborline Marina's office is the same in white, navy and wood.
 * - Outside: the display lot, the customer car park with painted bays, the lane to the yard, the delivery yard with a
 *   numbered space for every team, the drivers' hut and its bench, a tall pylon sign by the road and flags with the
 *   owner's banner artwork (2:1 like the artwork, never stretched, the same way round on both sides).
 * - The display vehicles are the game's own models, merged per shop so a whole showroom costs a few draw calls.
 * - The trailers (car trailers with tilting ramps, boat trailers), the straps over the cargo, and the logos on both sides
 *   of every delivery truck. Everything solid here matches a box the world already holds (city-dealers.js).
 * - The owner's logos are the files they sent, cropped to the artwork; the banners are their billboard artwork. */
(function(root){'use strict';
const D=()=>root.CityDealers,F=()=>root.CityDealerFleet,VH=()=>root.CityVehicles;
const LOGO={metro:'assets/images/ffe825665c00c8f7a8a4.png',apex:'assets/images/0c6f059412bf7175eb12.png',volt:'assets/images/7cb5ac1bad4129b071e9.png',harborline:'assets/images/27506427c9596b101b52.png',skyward:'assets/images/3b305e6f5a5281501324.png'};
/* width / height of each cropped logo, and the colour round it (the sign board is that colour, so the logo sits on it) */
const ASPECT={metro:3.27,apex:2.68,volt:1.5,harborline:2.56,skyward:2.2},LOGO_BG={metro:'#eeeeee',apex:'#000000',volt:'#1800ad',harborline:'#fffdfa',skyward:'#ffffff'};
const banner=k=>root.CityBillboardAds?.[k]||null;
const THEME={
 metro:{band:'#1f5fbf',wall:'#eef2f6',frame:'#c9d2dc',dark:'#2a3442',floor:'#e9edf1',accent:'#1f5fbf',lot:'#c9ccd0'},
 apex:{band:'#18191b',wall:'#2b2c30',frame:'#3a3b40',dark:'#111214',floor:'#2a2a2d',accent:'#c9a24a',lot:'#9da0a4'},
 volt:{band:'#2b2f33',wall:'#f4f6f2',frame:'#3a3f44',dark:'#1f2326',floor:'#dfe3dc',accent:'#b6f24a',lot:'#bfc3c6'},
 harborline:{band:'#14365a',wall:'#f5f8fa',frame:'#1e8a8c',dark:'#0d2238',floor:'#c9a27a',accent:'#a8784a',lot:'#c4c7c9'},
 skyward:{band:'#3a8fd6',wall:'#f5f8fb',frame:'#c3ccd6',dark:'#24384c',floor:'#e7ecf1',accent:'#9aa7b4',lot:'#c8ccd0'}};
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
// ---- drawing helpers --------------------------------------------------------------------------------------------------------
/* boxes by material kind, each kind one instanced mesh (a colour per box): a whole shop is a handful of draw calls.
 * A box: centre x,z, bottom y, size w (along x before turning), h, d, turned by ry. */
function Batch(){this.lists=new Map();}
Batch.prototype.box=function(kind,color,x,y,z,w,h,d,ry=0){if(!(w>0&&h>0&&d>0))return;if(!this.lists.has(kind))this.lists.set(kind,[]);this.lists.get(kind).push([color,x,y,z,w,h,d,ry]);};
let unit=null;
function materials(T){return{
 matte:new T.MeshStandardMaterial({color:'#ffffff',roughness:.86,metalness:0}),
 satin:new T.MeshStandardMaterial({color:'#ffffff',roughness:.45,metalness:.15}),
 metal:new T.MeshStandardMaterial({color:'#ffffff',roughness:.32,metalness:.75}),
 floor:new T.MeshStandardMaterial({color:'#ffffff',roughness:.22,metalness:.06}),
 /* V13.2: the car parks and their paint are only centimetres above the grass and are seen from far off: drawn a little in front of it in depth so they never flicker */slab:new T.MeshStandardMaterial({color:'#ffffff',roughness:.86,metalness:0,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2}),
 paint:new T.MeshStandardMaterial({color:'#ffffff',roughness:.6,metalness:0,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),
 glass:new T.MeshPhysicalMaterial({color:'#ffffff',roughness:.05,metalness:.1,transparent:true,opacity:.26,depthWrite:false}),
 glow:new T.MeshStandardMaterial({color:'#ffffff',emissive:'#fff6e4',emissiveIntensity:1.25,roughness:.6}),
 rubber:new T.MeshStandardMaterial({color:'#ffffff',roughness:.92,metalness:0})};}
Batch.prototype.build=function(T,group,mats){unit=unit||new T.BoxGeometry(1,1,1).translate(0,.5,0);const m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),p=new T.Vector3(),s=new T.Vector3(),c=new T.Color();
 for(const[kind,list]of this.lists){const im=new T.InstancedMesh(unit,mats[kind],list.length);list.forEach((b,i)=>{e.set(0,b[7],0);q.setFromEuler(e);p.set(b[1],b[2],b[3]);s.set(b[4],b[5],b[6]);m.compose(p,q,s);im.setMatrixAt(i,m);im.setColorAt(i,c.set(b[0]));});
  im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.castShadow=!['glass','glow','paint'].includes(kind);im.receiveShadow=true;im.computeBoundingSphere?.();im.name='dealer-'+kind;if(kind==='glass')im.renderOrder=2;group.add(im);}};
const texCache=new Map();
function texture(T,url){if(!url)return null;if(texCache.has(url))return texCache.get(url);const t=new T.TextureLoader().load(url);if('colorSpace' in t&&T.SRGBColorSpace)t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;texCache.set(url,t);return t;}
/* a picture on a flat panel facing `ry` (its front is +z before turning); a second panel back to back shows it the right
 * way round from behind too. glow: lit a little so signs read at night */
/* V14.1: off = how far in front of the given centre the picture stands (a board's half thickness and a little); the pictures are drawn ahead of what they lie on in depth, so they never flicker against their boards, even far off */
function picture(T,group,url,x,y,z,w,h,ry,{back=false,glow=.35,off=.006}={}){const tex=texture(T,url);if(!tex)return;const mat=new T.MeshStandardMaterial({map:tex,emissive:'#ffffff',emissiveMap:tex,emissiveIntensity:glow,roughness:.55,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-6});
 const geo=new T.PlaneGeometry(w,h),add=(r,off)=>{const m=new T.Mesh(geo,mat);m.position.set(x+Math.sin(r)*off,y,z+Math.cos(r)*off);m.rotation.y=r;m.receiveShadow=true;group.add(m);};add(ry,off);if(back)add(ry+Math.PI,off);}
/* text painted on a canvas (the yard's space numbers, the hut's name) */
function canvasTex(T,w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);if('colorSpace' in t&&T.SRGBColorSpace)t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
// ---- the buildings ------------------------------------------------------------------------------------------------------------
/* the showroom (or the marina office) round the world's own walls: the boxes the world made are where the glass and walls are */
function building(T,B,group,world,s,shop){const th=THEME[shop.key],y0=s.y,h=s.h,w=s.w,d=s.d,x=s.x,zc=s.z,front=zc+d/2,back=zc-d/2,x0=x-w/2,x1=x+w/2,top=y0+h,band=1.9,dw=s.doorWidth||4.4;
 /* polished floor (on the world's floor box) */B.box('floor',th.floor,x,y0+.001,zc,w-.42,.012,d-.42);
 /* back wall: solid, in the dark colour outside and the light one inside. V14.1: two halves back to back (the light layer lay 1 cm in front of the dark wall and flickered from far off) */B.box('matte',th.dark,x,y0,back-.1,w,h,.2);B.box('satin',th.wall,x,y0+.02,back+.1,w-.44,h-.06,.2);
 /* side walls: a solid plinth, glass above on a steel frame, the fascia band at the top */
 for(const side of[-1,1]){const sx=x+side*w/2;B.box('matte',th.dark,sx,y0,zc,.4,.9,d);B.box('glass','#cfe2ea',sx,y0+.9,zc,.06,h-.9-band,d-.5);B.box('matte',th.band,sx,top-band,zc,.42,band,d+.02);
  for(let k=0;k<=Math.round(d/4.4);k++){const zz=back+.25+(d-.5)*k/Math.round(d/4.4);B.box('metal',th.frame,sx,y0+.9,zz,.16,h-.9-band,.16);}}
 /* the front: glass both sides of the doorway on a steel grid, the band above, the entrance frame */
 const doorL=x-dw/2,doorR=x+dw/2,glassTop=top-band;
 for(const[a,b]of[[x0+.2,doorL-.35],[doorR+.35,x1-.2]]){B.box('glass','#cfe2ea',(a+b)/2,y0+.12,front,b-a,glassTop-y0-.12,.06);const n=Math.max(1,Math.round((b-a)/3.2));for(let k=0;k<=n;k++)B.box('metal',th.frame,a+(b-a)*k/n,y0,front,.14,glassTop-y0,.18);B.box('metal',th.frame,(a+b)/2,y0,front,b-a,.12,.2);B.box('metal',th.frame,(a+b)/2,y0+3.1,front,b-a,.09,.16);}
 B.box('glass','#cfe2ea',x,y0+2.9,front,dw+.7,glassTop-y0-2.9,.06);B.box('metal',th.frame,x,y0+2.8,front,dw+.7,.14,.2);
 B.box('matte',th.band,x,glassTop,front,w+.02,band,.42);/* V13.9: the base strip stands 3 cm higher than the glass's bottom rail, so their tops never lie in one plane (they flickered) */B.box('matte',th.dark,x,y0,front+.02,w+.02,.15,.44);
 /* the roof and what the world put on it (cap, parapet, canopy over the door, its two posts, a plant room), drawn as they stand */
 for(const c of world.colliders){const id=String(c.id);if(!id.startsWith(s.id+':architecture:'))continue;const key=id.slice(s.id.length+14),cx=(c.minX+c.maxX)/2,cz=(c.minZ+c.maxZ)/2,cw=c.maxX-c.minX,cd=c.maxZ-c.minZ,ch=c.maxY-c.minY;
  if(key==='roof-cap')B.box('matte','#7f8489',cx,c.minY+.004,cz,cw-.01,ch-.008,cd-.01);
  else if(key.includes('parapet'))B.box('matte',th.band,cx,c.minY,cz,cw,ch,cd);
  else if(key.includes('canopy')){B.box('satin',th.dark,cx,c.minY,cz,cw,ch,cd);B.box('glow','#ffffff',cx,c.minY-.012,cz,cw*.7,.01,cd*.5);}
  else if(key.includes('pier'))B.box('metal',th.frame,cx,c.minY,cz,cw,ch,cd);
  else B.box('matte','#9aa0a6',cx,c.minY,cz,cw,ch,cd);}
 /* the ceiling (light panels in rows) */B.box('matte','#f3f4f2',x,top-.06,zc,w-.42,.05,d-.42);
 for(let i=0;i<Math.floor((w-4)/4.6);i++)for(let j=0;j<Math.floor((d-4)/4.4);j++)B.box('glow','#ffffff',x0+2.6+i*4.6+((w-4)%4.6)/2,top-.08,back+2.6+j*4.4,2.2,.018,.9);
 /* the sales desk (on the world's desk box) and its two chairs */
 for(const f of s.furnishings||[]){const fx=f.x,fz=f.z;if(f.kind==='dealer-desk'){B.box('satin',th.dark,fx,y0,fz,f.w-.08,f.h-.06,f.d-.1);B.box('satin',th.accent,fx,y0+f.h-.06,fz,f.w,.06,f.d);B.box('matte',th.band,fx,y0+.12,fz+f.d/2-.02,f.w-.2,.7,.03);}
  else if(f.kind==='dealer-chair'){B.box('matte','#2b3036',fx,y0+.42,fz,.52,.08,.5);B.box('matte','#2b3036',fx,y0+.5,fz+.24,.5,.5,.06);B.box('metal','#9aa1a8',fx,y0,fz,.06,.42,.06);}
  else if(f.kind==='dealer-plant'){B.box('satin','#d6d9dc',fx,y0,fz,.5,.46,.5);B.box('matte','#3b2a1c',fx,y0+.46,fz,.42,.02,.42);B.box('matte','#3f7a3a',fx,y0+.5,fz,.66,.62,.66,.4);B.box('matte','#4f8f45',fx,y0+1.1,fz,.46,.4,.46,1.1);}
  else if(f.kind==='dealer-sofa'){B.box('matte',f.color,fx+.05,y0+.1,fz,f.w-.1,.34,f.d-.3);B.box('matte',f.color,fx-f.w/2+.12,y0+.1,fz,.24,f.h-.1,f.d);for(const s2 of[-1,1])B.box('matte',f.color,fx+.05,y0+.1,fz+s2*(f.d/2-.13),f.w-.1,.58,.26);B.box('metal','#9aa1a8',fx,y0,fz,f.w-.2,.1,f.d-.4);}
  else if(f.kind==='dealer-table'){B.box('satin',f.color,fx,y0+f.h-.05,fz,f.w,.05,f.d);for(const a of[-1,1])for(const c of[-1,1])B.box('metal','#7f868d',fx+a*(f.w/2-.08),y0,fz+c*(f.d/2-.08),.05,f.h-.05,.05);}}
 /* the logo: over the entrance on the band, and on the wall behind the desk */
 const lw=Math.min(w*.6,band*.82*ASPECT[shop.key]),lh=lw/ASPECT[shop.key];/* V14.1: the boards stand well proud of the wall behind them (they flickered against it from far off) */B.box('matte',LOGO_BG[shop.key],x,glassTop+(band-lh-.16)/2,front+.26,lw+.24,lh+.16,.1);picture(T,group,LOGO[shop.key],x,glassTop+band/2,front+.31,lw,lh,0);
 const iw=Math.min(w*.5,2.2*ASPECT[shop.key]),ih=iw/ASPECT[shop.key];B.box('matte',LOGO_BG[shop.key],x,y0+3.0-ih/2-.12+ih/2,back+.25,iw+.3,ih+.24,.08);picture(T,group,LOGO[shop.key],x,y0+3.0+.0,back+.29,iw,ih,0);
 /* the banner artwork on the side wall that faces the customer car park (2:1, like the artwork) */
 const bw=Math.min(d-4,9),bh=bw/2,bx=x0-.21;B.box('matte','#ffffff',bx-.02,y0+1.4,zc,.04,bh+.2,bw+.2);picture(T,group,banner(shop.key),bx-.045,y0+1.5+bh/2,zc,bw,bh,-Math.PI/2);}
/* the podiums inside and the display lot's markings (the vehicles themselves are added later, see displays) */
function podiums(B,world,shop){const th=THEME[shop.key];for(const c of world.colliders){const id=String(c.id);if(!id.startsWith(shop.id+':podium-'))continue;B.box('satin',th.wall==='#2b2c30'?'#1d1e21':'#ffffff',(c.minX+c.maxX)/2,c.minY+.002,(c.minZ+c.maxZ)/2,c.maxX-c.minX-.004,c.maxY-c.minY-.004,c.maxZ-c.minZ-.004);B.box('matte',th.accent,(c.minX+c.maxX)/2,c.minY+.002,(c.minZ+c.maxZ)/2,c.maxX-c.minX+.06,.08,c.maxZ-c.minZ+.06);}}
/* asphalt and concrete on the ground, and the white lines on them (all a few millimetres apart in height) */
function ground(B,world,shop,L,part){/* V13.9: part 'site' draws the showroom's lot and car park, 'depot' the lane and the yard, nothing given both */const site=part!=='depot',depot=part!=='site';const g=(x,z)=>world.terrainHeight?world.terrainHeight(x,z):world.groundHeight(x,z,8),th=THEME[shop.key];
 const slab=(color,r,lift=.03)=>{const cx=(r.x0+r.x1)/2,cz=(r.z0+r.z1)/2;B.box('slab',color,cx,g(cx,cz)+.004,cz,r.x1-r.x0,lift,r.z1-r.z0);return g(cx,cz)+.004+lift;};
 if(shop.kind==='row'){if(site){const y=slab(th.lot,L.lot,.034);
  /* V13.2: Skyward's aircraft stand on a wide apron along Airfield Road, either side of the lane */if(shop.carrier==='plane'&&!L.site){slab('#b9bdc1',{x0:L.lot.x0-28,x1:L.lot.x0-.2,z0:L.lot.z0,z1:L.lot.z1},.032);slab('#b9bdc1',{x0:L.lane.x1+.2,x1:L.lane.x1+92,z0:L.lot.z0,z1:L.lot.z1},.032);}
  let yd=y;/* V13.9: by the airport the aircraft stand on a concrete display field across the road */if(shop.carrier==='plane'&&L.site){const ps=L.displays.filter(q=>!q.inside);if(ps.length){const xs=ps.map(q=>q.x),zs=ps.map(q=>q.z);yd=slab('#b9bdc1',{x0:Math.min(...xs)-13,x1:Math.max(...xs)+13,z0:Math.min(...zs)-11,z1:Math.max(...zs)+11},.032);}}
  /* the display lot: concrete with a darker band where the cars stand */for(const d of L.displays.filter(q=>!q.inside))B.box('matte','#a9adb1',d.x,yd+.001,d.z,d.width+1.2,.004,d.length+1.4,d.yaw);
  const yp=slab('#3b3e42',L.parking,.03);for(const b of L.bays){const sy=Math.sin(b.yaw),cy=Math.cos(b.yaw);for(const s of[-1,1])B.box('paint','#f2f2ee',b.x+cy*s*1.3,yp+.001,b.z-sy*s*1.3,.1,.005,4.8,b.yaw);}
  }if(depot){const lane={x0:L.lane.x0,x1:L.lane.x1,z0:L.lane.z0,z1:L.lane.z1-2.9};const yl=slab('#3b3e42',lane,.03);for(let z=lane.z0+3;z<lane.z1-2;z+=6)B.box('paint','#f2f2ee',L.laneX,yl+.001,z,.12,.005,3);
  const yard={x0:L.yard.x0,x1:L.lane.x0,z0:L.yard.z0,z1:L.yard.z1-.3};const yy=slab('#44474b',yard,.03);
  /* every team's space: a white outline round the rig, and the hut's apron */for(let i=0;i<Math.min(D().FLEET_MAX,L.perRow*L.rows);i++){const s=L.slot(i),len=L.rigLength+1.2,cz=s.nose-len/2+.6;for(const sx of[-1,1])B.box('paint','#f2f2ee',s.x+sx*1.95,yy+.001,cz,.1,.005,len);B.box('paint','#f2f2ee',s.x,yy+.001,s.nose+.55,3.9,.005,.1);}
}
 }else{/* the marina: concrete everywhere the trucks go, the bays beside Coast Boulevard */
  const yard={x0:L.cols[0]-3,x1:L.laneX+1.8,z0:L.nose(0)-15,z1:L.nose(Math.min(L.rows,4)-1)+L.rigLength+2};const yy=slab('#4a4d50',yard,.03);
  for(let i=0;i<Math.min(D().FLEET_MAX,L.perRow*L.rows);i++){const s=L.slot(i),len=L.rigLength+3.2,cz=s.nose+len/2-.6;for(const sx of[-1,1])B.box('paint','#f2f2ee',s.x+sx*1.95,yy+.001,cz,.1,.005,len);B.box('paint','#f2f2ee',s.x,yy+.001,s.nose-.55,3.9,.005,.1);}
  slab('#4a4d50',{x0:L.laneX-2.2,x1:L.laneX+2.2,z0:L.ramp.turn.z-20,z1:yard.z0},.03);slab('#4a4d50',{x0:-664,x1:L.laneX+2.2,z0:L.ramp.z-4,z1:L.ramp.z+4},.031);
  const yb=slab('#3b3e42',{x0:-633.4,x1:-627.6,z0:574,z1:620},.03);for(const b of L.bays)for(const s of[-1,1])B.box('paint','#f2f2ee',b.x,yb+.001,b.z+s*1.3,4.8,.005,.1);
  /* the boats on show stand on trailers on a gravel strip */
  slab('#b9b3a6',{x0:-656,x1:-642,z0:566,z1:571+(L.displays.length-1)*6.6+5},.026);
  for(const d of L.displays){const gy=g(d.x,d.z)+.03,len=d.length+.6,hw=Math.min(1.1,d.width/2);for(const s of[-1,1]){B.box('metal','#2c3034',d.x,gy+.28,d.z+s*.55,len,.16,.14);B.box('satin','#6b4b2b',d.x,gy+.6,d.z+s*.62,len*.78,.12,.16);B.box('rubber','#1c1d1f',d.x-len*.12,gy,d.z+s*(hw+.2),.64,.64,.24);}B.box('metal','#2c3034',d.x-len/2-.8,gy+.28,d.z,1.6,.14,.14);B.box('metal','#2c3034',d.x+len/2-.5,gy+.28,d.z,.14,.5,.14);}}
}
/* the launch ramp: grooved concrete laid on the bank as it slopes into the water */
function ramp(T,group,world,L){const R=L.ramp,pts=[],idx=[],n=40,hw=R.width/2;for(let i=0;i<=n;i++){const x=R.x0+(R.x1-R.x0)*i/n,y=world.groundHeight(x,R.z,8)+.035;pts.push(x,y,R.z-hw,x,y,R.z+hw);if(i<n){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));geo.setIndex(idx);geo.computeVertexNormals();
 const tex=canvasTex(T,64,256,(g,w,h)=>{g.fillStyle='#b8b4ab';g.fillRect(0,0,w,h);g.fillStyle='#8f8b83';for(let y=0;y<h;y+=16)g.fillRect(0,y,w,4);});tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(1,9);
 const uv=[];for(let i=0;i<=n;i++)uv.push(0,i/n,1,i/n);geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));const m=new T.Mesh(geo,new T.MeshStandardMaterial({map:tex,roughness:.9,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));m.receiveShadow=true;m.name='harborline-ramp';group.add(m);}
/* the drivers' hut: walls, a door and window, a flat roof, and a bench along its front */
function hut(T,B,group,world,shop,L){const h=L.hut,th=THEME[shop.key],y=world.groundHeight(h.x,h.z,8);B.box('matte',th.wall,h.x,y,h.z,h.w-.01,h.h-.01,h.d-.01);B.box('matte',th.band,h.x,y+h.h-.01,h.z,h.w+.3,.25,h.d+.3);
 const fx=h.x+h.w/2;B.box('satin',th.dark,fx+.01,y,h.z+.6,.04,2.1,.95);B.box('glass','#9fc3d1',fx+.012,y+1.1,h.z-1.0,.03,.9,1.2);
 const lz=shop.kind==='row'?h.z+h.d/2:h.z+h.d/2;B.box('satin','#8a6a48',h.x,y+.42,lz+.55,h.w*.8,.06,.42);for(const s of[-1,1])B.box('metal','#6f7378',h.x+s*h.w*.35,y,lz+.55,.06,.42,.38);
 const t=canvasTex(T,512,96,(g,w,hh)=>{g.fillStyle=th.band;g.fillRect(0,0,w,hh);g.fillStyle='#ffffff';g.font='700 46px "Segoe UI",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('DELIVERY DRIVERS',w/2,hh/2,w*.92);});
 const m=new T.Mesh(new T.PlaneGeometry(2.6,.48),new T.MeshStandardMaterial({map:t,emissive:'#ffffff',emissiveMap:t,emissiveIntensity:.3,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-6}));m.position.set(fx+.02,y+2.45,h.z);m.rotation.y=Math.PI/2;group.add(m);}
/* the pylon by the road and the flags (the world holds a solid box for each pole) */
function signs(T,B,group,world,shop,L){const th=THEME[shop.key],sg=D().signsOf?.(shop)||[];
 for(const s of sg){const y=world.groundHeight(s.x,s.z,8);if(s.kind==='pylon'){B.box('metal',th.frame,s.x,y,s.z,.5,s.h-2.6,.5);const bw=s.w,bh=bw/ASPECT[shop.key];B.box('matte',th.band,s.x,y+s.h-bh-.6,s.z,bw+.5,bh+.6,.5,s.yaw);B.box('matte',LOGO_BG[shop.key],s.x,y+s.h-bh-.3,s.z,bw,bh,.58,s.yaw);
   /* V14.1: on the board's faces (it was drawn inside the board, so the pylons showed a blank board) */picture(T,group,LOGO[shop.key],s.x,y+s.h-bh/2-.3,s.z,bw,bh,s.yaw,{back:true,glow:.6,off:.3});const g2=new T.Group();void g2;
   /* the base the pole stands in */B.box('matte','#8d9196',s.x,y,s.z,1.2,.5,1.2);}
  else if(s.kind==='flag'){B.box('metal','#d9dde1',s.x,y,s.z,.12,s.h,.12);const fw=2.4,fh=1.2;picture(T,group,banner(shop.key),s.x+Math.sin(s.yaw+Math.PI/2)*(fw/2+.08),y+s.h-fh/2-.15,s.z+Math.cos(s.yaw+Math.PI/2)*(fw/2+.08),fw,fh,s.yaw,{back:true,glow:.15});}}}
// ---- the display vehicles -------------------------------------------------------------------------------------------------------
/* one model per vehicle on show (the game's own, with its own colour), merged with the rest of the shop's by material */
function mergeModels(T,items){const bins=new Map(),m=new T.Matrix4();
 const key=mat=>[mat.type,mat.color?.getHexString(),mat.roughness,mat.metalness,mat.transparent,mat.opacity,mat.map?.uuid||'',mat.emissive?.getHexString()||'',mat.emissiveIntensity||0,mat.side].join('|');
 for(const it of items){it.object.updateMatrixWorld(true);it.object.traverse(o=>{if(!o.isMesh||!o.geometry?.attributes?.position||!o.visible)return;const mat=Array.isArray(o.material)?o.material[0]:o.material;if(!mat)return;let geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(m.multiplyMatrices(it.matrix,o.matrixWorld));if(!geo.attributes.normal)geo.computeVertexNormals();const k=key(mat)+(geo.attributes.uv?'|uv':'');if(!bins.has(k))bins.set(k,{mat,list:[]});bins.get(k).list.push(geo);});}
 const group=new T.Group();for(const{mat,list}of bins.values()){let count=0;for(const g of list)count+=g.attributes.position.count;const pos=new Float32Array(count*3),nor=new Float32Array(count*3),hasUv=!!list[0].attributes.uv,uv=hasUv?new Float32Array(count*2):null;let at=0;
  for(const g of list){pos.set(g.attributes.position.array,at*3);nor.set(g.attributes.normal.array,at*3);if(uv&&g.attributes.uv)uv.set(g.attributes.uv.array,at*2);at+=g.attributes.position.count;g.dispose();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('normal',new T.BufferAttribute(nor,3));if(uv)geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.computeBoundingSphere();const mesh=new T.Mesh(geo,mat);mesh.castShadow=true;mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;group.add(mesh);}
 return group;}
/* the shop's displays are built a few frames after the City loads (each model takes a moment), when you come near */
function displays(scene,shop,L,y0){const T=scene.T,VM=root.CityVehicleModels,items=[],world=scene.world;if(!VM)return null;
 for(const d of L.displays){const def=VH().byId[d.typeId];if(!def)continue;let model=null;try{model=VM.create(d.typeId,{paint:def.color},{modelDetail:3});}catch(e){model=null;}if(!model)continue;model.updateMatrixWorld(true);
  const lift=d.podium?.3:d.trailer?.75:0,gy=(d.inside?y0:world.groundHeight(d.x,d.z,8))+lift+(def.category==='boat'?(def.dimensions?.height||2)*.18:0),mat=new T.Matrix4().compose(new T.Vector3(d.x,gy,d.z),new T.Quaternion().setFromEuler(new T.Euler(0,d.yaw,0)),new T.Vector3(1,1,1));
  items.push({object:model,matrix:mat.multiply(new T.Matrix4().copy(model.matrixWorld).invert())});}
 const g=mergeModels(T,items);for(const it of items){try{VM.dispose?.(it.object);}catch(e){}}g.name='dealer-displays-'+shop.key;return g;}
// ---- trailers and straps ---------------------------------------------------------------------------------------------------------
/* the parts of each kind of trailer in its own coordinates (x across, z forward from its middle, y up from the ground) */
function trailerParts(kind){const t=D().TRAILERS[kind],L=t.length,W=t.width,deck=t.deck,P=[];const add=(k,c,x,y,z,w,h,d,tag)=>P.push({k,c,x,y,z,w,h,d,tag});
 if(kind==='car'){add('metal','#3b3f44',0,deck-.12,0,W,.12,L);for(const s of[-1,1])add('metal','#24272b',s*(W/2-.08),deck-.32,0,.16,.22,L);add('metal','#24272b',0,deck-.3,L/2+.55,.16,.16,1.3);add('metal','#24272b',0,deck-.3,L/2+1.05,.5,.1,.3,'hitch');
  for(const s of[-1,1])for(const z of[-1.05,-.2])add('rubber','#1c1d1f',s*(W/2-.32),0,z-.6,.26,.7,.7,'wheel');for(const s of[-1,1])add('metal','#5b6066',s*(W/2-.32),.66,-1.25,.34,.06,2.0);
  add('satin','#ffffff',0,deck,L/2-.06,W,1.15,.1,'head');for(const s of[-1,1])add('metal','#ffb000',s*(W/2-.05),deck-.26,-L/2+.03,.08,.08,.05,'lamp');}
 else if(kind==='plane'){/* V13.2: a long low trailer: deck, side rails, a raised front over the hitch, three axles, a headboard */add('metal','#3b3f44',0,deck-.12,-.4,W,.12,L-.8);for(const s of[-1,1])add('metal','#24272b',s*(W/2-.1),deck-.34,0,.2,.24,L);add('metal','#3b3f44',0,deck-.12,L/2-.4,W*.86,.5,.8);add('metal','#24272b',0,deck-.3,L/2+.55,.2,.18,1.3);add('metal','#24272b',0,deck-.3,L/2+1.05,.5,.1,.3,'hitch');
  for(const s of[-1,1])for(const z of[-4.6,-3.4,-2.2])add('rubber','#1c1d1f',s*(W/2-.36),0,z-.29,.3,.58,.58,'wheel');for(const s of[-1,1])add('metal','#5b6066',s*(W/2-.36),.62,-3.4,.38,.06,3.4);
  add('satin','#ffffff',0,deck+.38,L/2-.06,W,1.25,.1,'head');for(const s of[-1,1])add('metal','#ffb000',s*(W/2-.05),deck-.28,-L/2+.03,.08,.08,.05,'lamp');}
 else{for(const s of[-1,1])add('metal','#2c3034',s*.55,.42,0,.14,.18,L);add('metal','#2c3034',0,.42,L/2+.5,.16,.16,1.6);add('metal','#2c3034',0,.42,L/2+1.25,.45,.1,.3,'hitch');for(const s of[-1,1])add('satin','#6b4b2b',s*.62,deck-.12,-L*.05,.16,.12,L*.78);
  add('metal','#2c3034',0,.5,L/2-.2,.14,1.25,.14,'winch');for(const s of[-1,1])for(const z of[-.95,-.15])add('rubber','#1c1d1f',s*(W/2-.3),0,z-.4,.24,.64,.64,'wheel');for(const s of[-1,1])add('metal','#5b6066',s*(W/2-.3),.62,-.95,.32,.05,1.9);}
 return P;}
/* each part of each trailer of a shop is one instanced mesh; ramps and straps too */
function trailerMeshes(T,mats,count,kind){const parts=trailerParts(kind),geoBox=new T.BoxGeometry(1,1,1).translate(0,.5,0),geoWheel=new T.CylinderGeometry(.5,.5,1,14).rotateZ(Math.PI/2).translate(0,.5,0),out={kind,parts:[],count};
 for(const p of parts){const im=new T.InstancedMesh(p.tag==='wheel'?geoWheel:geoBox,mats[p.k],count);im.frustumCulled=false;im.castShadow=true;im.receiveShadow=true;const c=new T.Color(p.c);for(let i=0;i<count;i++)im.setColorAt(i,c);out.parts.push({p,im});}
 if(kind==='car'||kind==='plane'){out.ramps=new T.InstancedMesh(geoBox,mats.metal,count*2);out.ramps.frustumCulled=false;out.ramps.castShadow=true;const c=new T.Color('#5b6066');for(let i=0;i<count*2;i++)out.ramps.setColorAt(i,c);}
 out.straps=new T.InstancedMesh(geoBox,mats.matte,count*12);out.straps.frustumCulled=false;const sc=new T.Color('#ff8a1e');for(let i=0;i<count*12;i++)out.straps.setColorAt(i,sc);
 /* the shop's logo on both faces of a car trailer's headboard (one set per shop, each with its own artwork) */
 if(kind==='car'||kind==='plane'){out.logos={};const plane=new T.PlaneGeometry(1,1);for(const key of kind==='car'?['metro','apex']:['skyward']){const tex=texture(T,LOGO[key]),m=new T.InstancedMesh(plane,new T.MeshStandardMaterial({map:tex,roughness:.5,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),count*2);m.frustumCulled=false;out.logos[key]=m;}}
 return out;}
// ---- the scene hooks ---------------------------------------------------------------------------------------------------------------
function build(scene){const T=scene.T,world=scene.world,Dl=D();if(!T||!world||!Dl)return;dispose(scene);
 const mats=materials(T),root3=new T.Group();root3.name='dealerships';(scene.environment||scene.scene).add(root3);const st=scene.dealerLook={group:root3,mats,shops:[],trailers:{},time:0};
 for(const shop of Dl.SHOPS){const s=world.serviceById?.[shop.id];if(!s)continue;const L=Dl.layout(shop),split=shop.kind==='row'&&!!L.site,g=new T.Group();g.name='dealer-'+shop.key;const B=new Batch();
  try{building(T,B,g,world,s,shop);podiums(B,world,shop);ground(B,world,shop,L,split?'site':null);if(!split)hut(T,B,g,world,shop,L);signs(T,B,g,world,shop,L);if(shop.kind==='marina')ramp(T,g,world,L);}catch(e){st.error=String(e&&e.stack||e).slice(0,300);}
  B.build(T,g,mats);root3.add(g);st.shops.push({shop,L,group:g,center:split?{x:L.x,z:L.zc}:{x:shop.kind==='row'?L.x+12:L.x,z:shop.kind==='row'?L.back-30:L.zc+40},displays:null,s});
  /* V13.9: a delivery yard away from its showroom is a group of its own, shown by its own distance */if(split){const gy=new T.Group();gy.name='dealer-'+shop.key+'-yard';const By=new Batch();try{ground(By,world,shop,L,'depot');hut(T,By,gy,world,shop,L);}catch(e){st.error=String(e&&e.stack||e).slice(0,300);}By.build(T,gy,mats);root3.add(gy);st.shops.push({shop,L,group:gy,center:{x:L.depot.x+12,z:L.depot.back-30},displays:false,s,yard:true});}}
 /* trailers: car trailers for Metro and Apex together, boat trailers for the marina */const n=D().FLEET_MAX;
 st.trailers.car=trailerMeshes(T,mats,n*2,'car');st.trailers.boat=trailerMeshes(T,mats,n,'boat');st.trailers.plane=trailerMeshes(T,mats,n,'plane');for(const k of['car','boat','plane']){const t=st.trailers[k];for(const q of t.parts)root3.add(q.im);if(t.ramps)root3.add(t.ramps);root3.add(t.straps);for(const m of Object.values(t.logos||{}))root3.add(m);}
 st.logoMats={};}
function dispose(scene){const st=scene.dealerLook;if(!st)return;st.group.parent?.remove(st.group);st.group.traverse(o=>{if(o.geometry&&o.geometry!==unit)o.geometry.dispose?.();});scene.dealerLook=null;}
/* the teams as the game has them: in single player the simulation itself, online what the host sends */
function teams(sim){const Dl=D(),Fl=F();if(!Dl||!Fl)return[];const out=[];const local=sim?.fleet,online=sim?.onlineRoom||sim?.onlineFleet?sim.onlineFleet:null,n=local?.n||online?.n||Dl.FLEET_DEFAULT;
 const outById=new Map((online?.out||[]).map(o=>[o[0],o]));
 for(const shop of Dl.SHOPS){const L=Dl.layout(shop),R=Fl.rig(shop);for(let i=0;i<n;i++){const id='fleet-'+shop.key+'-'+i;let t=null;
   if(local){const team=local.teams.find(q=>q.id===id);if(!team)continue;const j=team.job;t={id,shop,R,trailer:team.trailer||Fl.parkedTrailer(team.slot,R,team.gap||0),straps:j?j.straps:0,ramp:j?j.ramp:0,cargo:j?.cargo||null,mode:j?(j.onTrailer?1:j.inBox?2:0):0};}
   else{const o=outById.get(id),slot=L.slot(i);if(o&&o[1]){const yaw=o[1][2],f={x:o[1][0]+Math.sin(yaw)*R.len/2,z:o[1][1]+Math.cos(yaw)*R.len/2},b={x:o[1][0]-Math.sin(yaw)*R.len/2,z:o[1][1]-Math.cos(yaw)*R.len/2};t={id,shop,R,trailer:{x:o[1][0],z:o[1][1],yaw,f,b},straps:o[2],ramp:o[3],cargo:o[4],mode:o[5]};}
    else t={id,shop,R,trailer:R.trailer?Fl.parkedTrailer(slot,R,shop.carrier==='boat'?(o?o[6]:2):0):null,straps:0,ramp:0,cargo:null,mode:0};}
   out.push(t);}}
 return out;}
function draw(scene,sim){const st=scene.dealerLook,T=scene.T;if(!st||!sim)return;const cam=scene.camera?.position;if(!cam)return;st.time+=1/60;
 /* far away nothing of the shops is drawn; near, the displays are built (one shop at a time) */
 let near=false;for(const sh of st.shops){const d=Math.hypot(cam.x-sh.center.x,cam.z-sh.center.z);sh.group.visible=d<900;if(d<420){near=true;if(sh.displays===null&&!st.building){st.building=true;try{const y0=sh.s.y+.001;sh.displays=displays(scene,sh.shop,sh.L,y0)||new T.Group();sh.group.add(sh.displays);}catch(e){sh.displays=new T.Group();st.error=String(e&&e.message||e);}st.building=false;}}if(sh.displays)sh.displays.visible=d<380;}
 /* the trailers, ramps and straps of every team */const list=teams(sim),world=scene.world,m=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),p=new T.Vector3(),s=new T.Vector3(),pm=new T.Matrix4(),lm=new T.Matrix4();
 const idx={car:0,boat:0,plane:0},anyNear={car:false,boat:false,plane:false};
 for(const t of list){if(!t.trailer)continue;const kind=t.shop.carrier==='boat'?'boat':t.shop.carrier==='plane'?'plane':'car',M=st.trailers[kind];if(!M)continue;const i=idx[kind]++;if(i>=M.count)continue;const tr=t.trailer,R=t.R;
  const gf=world.groundHeight(tr.f.x,tr.f.z,8),gb=world.groundHeight(tr.b.x,tr.b.z,8),gy=(gf+gb)/2,pitch=Math.atan2(gf-gb,R.len);if(Math.hypot(cam.x-tr.x,cam.z-tr.z)<380)anyNear[kind]=true;
  e.set(-pitch,tr.yaw,0,'YXZ');q.setFromEuler(e);p.set(tr.x,gy,tr.z);s.set(1,1,1);pm.compose(p,q,s);
  for(const{p:part,im}of M.parts){lm.compose(new T.Vector3(part.x,part.y,part.z),new T.Quaternion(),new T.Vector3(part.w,part.h,part.d));m.multiplyMatrices(pm,lm);im.setMatrixAt(i,m);}
  if(M.ramps){/* the ramps: hinged at the back of the deck, standing up when stowed, down to the ground to load */const down=-Math.atan2(R.deck,R.ramp),th=1.35*(1-t.ramp)+down*t.ramp,Lr=Math.hypot(R.deck,R.ramp),rx=kind==='plane'?.95:.68;
   for(const side of[-1,1]){m.copy(pm).multiply(lm.makeTranslation(side*rx,R.deck,-R.len/2)).multiply(new T.Matrix4().makeRotationX(th)).multiply(new T.Matrix4().makeTranslation(0,-.05,-Lr/2)).multiply(new T.Matrix4().makeScale(.5,.05,Lr));M.ramps.setMatrixAt(i*2+(side>0?1:0),m);}}  if(M.logos){/* the logo on the headboard, both faces, the right way round on each */const lg=M.logos[t.shop.key],a=ASPECT[t.shop.key]||2.5,lw=Math.min(R.wid*.84,.95*a),lh=lw/a;for(const k2 in M.logos){const mesh=M.logos[k2];for(const f of[0,1]){if(mesh!==lg){m.makeScale(0,0,0);mesh.setMatrixAt(i*2+f,m);continue;}lm.compose(new T.Vector3(0,R.deck+.6,R.len/2-.06+(f?-.056:.056)),new T.Quaternion().setFromEuler(new T.Euler(0,f?Math.PI:0,0)),new T.Vector3(lw,lh,1));m.multiplyMatrices(pm,lm);mesh.setMatrixAt(i*2+f,m);}}}
  /* straps over the cargo's wheels (or over a boat's hull), as many as the driver has put on */const cargo=t.cargo&&t.mode===1?sim.vehicles.find(v=>v.id===t.cargo):null,dm=cargo?VH().byId[cargo.typeId]?.dimensions:null;
  for(let k=0;k<12;k++){let ok=false;if(dm&&k<t.straps*3){const w=Math.floor(k/3),part=k%3;
    if(kind==='car'||kind==='plane'){const def=VH().byId[cargo.typeId],lat=(w===0||w===1?1:-1)*(kind==='plane'?(def.track||1.6)/2:dm.width/2-.28),lon=kind==='plane'?(w===0||w===3?-1:1)*((def.wheelbase||4)*.5):(w===0||w===3?1:-1)*dm.length*.32,td=kind==='plane'?.5:.66,top=R.deck+td;
     if(part===0)lm.compose(new T.Vector3(lat,top,lon+.15),new T.Quaternion(),new T.Vector3(.34,.04,.07));else lm.compose(new T.Vector3(lat,R.deck,lon+(part===1?-.36:.36)+.15),new T.Quaternion().setFromEuler(new T.Euler(part===1?.55:-.55,0,0)),new T.Vector3(.3,td*1.05,.05));ok=true;}
    else{const lon=(w===0?.3:-.28)*dm.length,hh=dm.height*.5,top=R.deck+dm.height*.18+hh;if(part===0)lm.compose(new T.Vector3(0,top,lon),new T.Quaternion(),new T.Vector3(dm.width+.1,.04,.08));else lm.compose(new T.Vector3((part===1?-1:1)*(dm.width/2+.05),R.deck,lon),new T.Quaternion(),new T.Vector3(.04,hh+dm.height*.18,.08));ok=true;}}
   if(!ok)lm.makeScale(0,0,0);m.multiplyMatrices(pm,lm);M.straps.setMatrixAt(i*12+k,m);}}
 for(const kind of['car','boat','plane']){const M=st.trailers[kind];if(!M)continue;for(let i=idx[kind];i<M.count;i++){m.makeScale(0,0,0);for(const{im}of M.parts)im.setMatrixAt(i,m);if(M.ramps){M.ramps.setMatrixAt(i*2,m);M.ramps.setMatrixAt(i*2+1,m);}for(let k=0;k<12;k++)M.straps.setMatrixAt(i*12+k,m);}
  for(const mesh of Object.values(M.logos||{})){for(let i=idx[kind];i<M.count;i++){m.makeScale(0,0,0);mesh.setMatrixAt(i*2,m);mesh.setMatrixAt(i*2+1,m);}mesh.instanceMatrix.needsUpdate=true;mesh.visible=anyNear[kind];}
  for(const{im}of M.parts){im.instanceMatrix.needsUpdate=true;im.visible=anyNear[kind];}if(M.ramps){M.ramps.instanceMatrix.needsUpdate=true;M.ramps.visible=anyNear[kind];}M.straps.instanceMatrix.needsUpdate=true;M.straps.visible=anyNear[kind];}
 dress(scene,sim);}
/* the shop's logo on both sides of each delivery truck (the trucks are ordinary vehicles; the logo is added to their model) */
function dress(scene,sim){const st=scene.dealerLook,T=scene.T,map=scene.meshes?.vehicles;if(!st||!map)return;
 for(const v of sim.vehicles||[]){const key=v.customization?.livery;if(!key||!LOGO[key])continue;const r=map.get(v.id);if(!r||r.mesh.userData.dealerLivery===key)continue;const mesh=r.mesh,d=VH().byId[v.typeId]?.dimensions;if(!d)continue;
  const box=v.typeId==='haul',lh=box?1.0:.42,lw=lh*ASPECT[key],z=box?-d.length*.18:-.15,y=box?1.85:1.0,off=d.width/2+(box?.02:.035);
  const mat=st.logoMats[key]||(st.logoMats[key]=new T.MeshStandardMaterial({map:texture(T,LOGO[key]),roughness:.5,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  for(const side of[-1,1]){const m=new T.Mesh(new T.PlaneGeometry(Math.min(lw,box?d.length*.55:1.6),Math.min(lw,box?d.length*.55:1.6)/ASPECT[key]),mat);m.position.set(side*off,y,z);m.rotation.y=side*Math.PI/2;m.name='dealer-livery';mesh.add(m);}
  mesh.userData.dealerLivery=key;}}
root.CityDealersLook={build,draw,dispose,LOGO,ASPECT,LOGO_BG,THEME,banner,texture,Batch,materials,picture,canvasTex,mergeModels};
})(typeof globalThis!=='undefined'?globalThis:this);
