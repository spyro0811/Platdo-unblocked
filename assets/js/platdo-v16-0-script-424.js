
/* PLATDO City apartments: the look of the ten buildings from outside, their lobbies and car parks (V9.2). Game only.
 * The solid shapes are in city-apartments.js; everything drawn here stands where those shapes are, and every face
 * of a wall that is seen from inside a home is kept a few centimetres behind the home's own finish (city-apt-rooms.js
 * draws the rooms), so no two surfaces ever lie in one plane.
 * - Ten looks, one for each design: The Marisol (white stucco, an arcade of arches, iron balconies, a tiled roof),
 *   Azure Point (white, long curved balconies with glass, a sun deck), Driftwood House (cedar boards and stucco,
 *   timber balconies, a roof pergola), The Ironworks (brick piers and black steel windows, a water tank), Halden House
 *   (light timber battens, a steep metal gable roof), Obsidian (black metal, bronze glass, fins, a glass pavilion on
 *   the roof), Cedar & Stone (sandstone, deep planted terraces, cedar slats), Alba (pure white, thin black frames),
 *   Prism (balconies as coloured boxes, perforated ends, a sculpture on the roof) and The Strata (layered grey stone,
 *   stone fins, a roof garden).
 * - The glass of each home is one instance of a pane, so the pane of the home you are in can be hidden (the home
 *   draws its own) and the panes can light up at night one by one.
 * - Each building is two groups: the shell (seen from far away) and the detail (lobby, railings, the car park), which
 *   is only shown within 260 m. */
(function(root){'use strict';
const PI=Math.PI,TAU=PI*2;
const AP=()=>root.CityApartments;
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
// ---- textures (drawn once, shared) -----------------------------------------------------------------------------------
const tile={stucco:4,brick:1.2,boards:2.4,battens:1.2,ashlar:3,metal:3,strata:4.8,tiles:1.2,paving:2,marble:2.4,concrete:4,perforated:1.2,deck:2.4,seam:1.6,grass:3,siding:1.6,shingle:1.4};
function canvas(n){const c=document.createElement('canvas');c.width=c.height=n;return c;}
function speckle(g,n,r,count,rgb,alpha,size=1.6){for(let i=0;i<count;i++){g.fillStyle=`rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha*(.4+r()*.6)})`;const s=size*(.5+r());g.fillRect(r()*n,r()*n,s,s);}}
function blotch(g,n,r,count,rgb,alpha,rad){for(let i=0;i<count;i++){const x=r()*n,y=r()*n,R=rad*(.4+r());const gr=g.createRadialGradient(x,y,0,x,y,R);gr.addColorStop(0,`rgba(${rgb},${alpha})`);gr.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=gr;for(const dx of[-n,0,n])for(const dy of[-n,0,n]){g.save();g.translate(dx,dy);g.fillRect(x-R,y-R,R*2,R*2);g.restore();}}}
const DRAW={
 stucco(g,n,r){g.fillStyle='#f1eee8';g.fillRect(0,0,n,n);blotch(g,n,r,26,'120,110,95',.05,n*.18);speckle(g,n,r,5000,[90,80,70],.08);speckle(g,n,r,2500,[255,255,255],.25);},
 brick(g,n,r){g.fillStyle='#b8ab98';g.fillRect(0,0,n,n);const rows=18,h=n/rows,w=n/4;for(let j=0;j<rows;j++){const off=j%2?w/2:0;for(let i=-1;i<5;i++){const t=r();g.fillStyle=`rgb(${150+t*50|0},${70+t*30|0},${52+t*22|0})`;g.fillRect(i*w+off+1.2,j*h+1.2,w-2.4,h-2.4);g.fillStyle=`rgba(40,20,10,${r()*.18})`;g.fillRect(i*w+off+1.2,j*h+h*.55,w-2.4,h*.45-1.2);}}speckle(g,n,r,3000,[30,20,15],.12);},
 boards(g,n,r){const rows=16,h=n/rows;for(let j=0;j<rows;j++){const t=r();g.fillStyle=`rgb(${168+t*30|0},${118+t*24|0},${78+t*18|0})`;g.fillRect(0,j*h,n,h);for(let k=0;k<6;k++){g.strokeStyle=`rgba(90,55,30,${.1+r()*.15})`;g.lineWidth=.7;g.beginPath();const y=j*h+r()*h;g.moveTo(0,y);g.bezierCurveTo(n*.3,y+r()*3-1.5,n*.6,y+r()*3-1.5,n,y);g.stroke();}g.fillStyle='rgba(40,25,15,.45)';g.fillRect(0,j*h+h-1.6,n,1.6);g.fillStyle='rgba(255,240,220,.18)';g.fillRect(0,j*h,n,1);}},
 battens(g,n,r){g.fillStyle='#4a4038';g.fillRect(0,0,n,n);const cols=12,w=n/cols;for(let i=0;i<cols;i++){const t=r();g.fillStyle=`rgb(${205+t*25|0},${178+t*22|0},${138+t*18|0})`;g.fillRect(i*w+1,0,w-2.6,n);for(let k=0;k<4;k++){g.strokeStyle=`rgba(120,90,55,${.08+r()*.12})`;g.beginPath();const x=i*w+2+r()*(w-5);g.moveTo(x,0);g.lineTo(x+r()*2-1,n);g.stroke();}g.fillStyle='rgba(255,255,255,.15)';g.fillRect(i*w+1,0,1.2,n);}},
 ashlar(g,n,r){g.fillStyle='#b9a787';g.fillRect(0,0,n,n);const rows=8,h=n/rows;for(let j=0;j<rows;j++){let x=-r()*n*.3;while(x<n){const w=n*(.22+r()*.22),t=r();g.fillStyle=`rgb(${210+t*25|0},${190+t*22|0},${152+t*20|0})`;g.fillRect(x+1.5,j*h+1.5,w-3,h-3);speckle(g,n,r,0,[0,0,0],0);x+=w;}}speckle(g,n,r,6000,[110,90,60],.12);blotch(g,n,r,18,'150,120,80',.08,n*.12);},
 metal(g,n,r){g.fillStyle='#2b2d30';g.fillRect(0,0,n,n);const rows=3,cols=2;for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const t=r();g.fillStyle=`rgb(${40+t*10|0},${42+t*10|0},${46+t*10|0})`;g.fillRect(i*n/cols+2,j*n/rows+2,n/cols-4,n/rows-4);const gr=g.createLinearGradient(0,j*n/rows,0,(j+1)*n/rows);gr.addColorStop(0,'rgba(255,255,255,.05)');gr.addColorStop(1,'rgba(0,0,0,.12)');g.fillStyle=gr;g.fillRect(i*n/cols+2,j*n/rows+2,n/cols-4,n/rows-4);}speckle(g,n,r,1500,[255,255,255],.03);},
 strata(g,n,r){let y=0;while(y<n){const h=n*(.04+r()*.12),t=r();const c=[150+t*60|0,148+t*58|0,140+t*52|0];g.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;g.fillRect(0,y,n,h);speckle(g,n,r,0,[0,0,0],0);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(0,y+h-1.2,n,1.2);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,y,n,1);y+=h;}speckle(g,n,r,7000,[60,60,55],.1);},
 tiles(g,n,r){g.fillStyle='#8a3f22';g.fillRect(0,0,n,n);const rows=10,cols=8,h=n/rows,w=n/cols;for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const t=r(),x=i*w+(j%2?w/2:0);const gr=g.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,`rgb(${150+t*40|0},${70+t*22|0},${40+t*14|0})`);gr.addColorStop(.5,`rgb(${190+t*40|0},${98+t*25|0},${58+t*15|0})`);gr.addColorStop(1,`rgb(${140+t*40|0},${64+t*20|0},${36+t*12|0})`);g.fillStyle=gr;g.fillRect(x,j*h,w-1,h-2);g.fillRect(x-n,j*h,w-1,h-2);g.fillStyle='rgba(30,12,5,.35)';g.fillRect(x,j*h+h-3,w-1,2);}},
 paving(g,n,r){g.fillStyle='#a8a296';g.fillRect(0,0,n,n);const k=4,s=n/k;for(let j=0;j<k;j++)for(let i=0;i<k;i++){const t=r();g.fillStyle=`rgb(${200+t*20|0},${194+t*18|0},${180+t*16|0})`;g.fillRect(i*s+1.5,j*s+1.5,s-3,s-3);}speckle(g,n,r,4000,[80,75,65],.12);},
 marble(g,n,r){g.fillStyle='#ece9e3';g.fillRect(0,0,n,n);blotch(g,n,r,20,'200,195,188',.2,n*.2);for(let i=0;i<7;i++){const x0=r()*n,a=[r()*50,r()*24,r()*10],ph=[r()*TAU,r()*TAU,r()*TAU],pts=[];for(let k=0;k<=40;k++){const y=k/40*n;let x=x0;for(let j=0;j<3;j++)x+=a[j]*Math.sin(TAU*(j+1)*y/n+ph[j]);pts.push([x,y]);}for(const[lw,al]of[[5,.04],[2,.1],[.8,.3+r()*.25]]){g.strokeStyle=`rgba(120,115,110,${al})`;g.lineWidth=lw;for(const dx of[-n,0,n]){g.beginPath();g.moveTo(pts[0][0]+dx,0);for(const q of pts)g.lineTo(q[0]+dx,q[1]);g.stroke();}}}g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=1;g.strokeRect(.5,.5,n/2-1,n/2-1);g.strokeRect(n/2+.5,n/2+.5,n/2-1,n/2-1);},
 concrete(g,n,r){g.fillStyle='#b9b8b3';g.fillRect(0,0,n,n);blotch(g,n,r,30,'100,100,95',.07,n*.15);speckle(g,n,r,8000,[60,60,58],.1);speckle(g,n,r,3000,[240,240,235],.12);},
 perforated(g,n,r){g.fillStyle='#d9d4cc';g.fillRect(0,0,n,n);const k=16,s=n/k;for(let j=0;j<k;j++)for(let i=0;i<k;i++){const rad=s*(.12+.22*(.5+.5*Math.sin(i*.7+j*.45)));g.fillStyle='#2a2826';g.beginPath();g.arc((i+.5)*s,(j+.5)*s,rad,0,TAU);g.fill();}},
 deck(g,n,r){const cols=14,w=n/cols;for(let i=0;i<cols;i++){const t=r();g.fillStyle=`rgb(${150+t*30|0},${108+t*22|0},${74+t*16|0})`;g.fillRect(i*w,0,w-1.5,n);g.fillStyle='rgba(30,20,10,.5)';g.fillRect(i*w+w-1.5,0,1.5,n);const cut=r()*n;g.fillRect(i*w,cut,w-1.5,1);}},
 seam(g,n,r){g.fillStyle='#3a4146';g.fillRect(0,0,n,n);const cols=6,w=n/cols;for(let i=0;i<cols;i++){g.fillStyle='rgba(255,255,255,.12)';g.fillRect(i*w,0,2,n);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(i*w+2,0,2,n);}speckle(g,n,r,1200,[255,255,255],.04);},
 grass(g,n,r){g.fillStyle='#5f7d45';g.fillRect(0,0,n,n);speckle(g,n,r,9000,[40,70,30],.35,2.2);speckle(g,n,r,5000,[140,170,90],.25,1.8);},
 /* V9.5: painted boards for the houses (tinted per house) and asphalt shingles for their roofs */
 siding(g,n,r){const rows=10,h=n/rows;for(let j=0;j<rows;j++){const t=r();const gr=g.createLinearGradient(0,j*h,0,j*h+h);gr.addColorStop(0,`rgb(${236+t*10|0},${236+t*10|0},${232+t*10|0})`);gr.addColorStop(1,`rgb(${214+t*10|0},${214+t*10|0},${210+t*10|0})`);g.fillStyle=gr;g.fillRect(0,j*h,n,h);g.fillStyle='rgba(0,0,0,.28)';g.fillRect(0,j*h+h-2,n,2);}speckle(g,n,r,1500,[0,0,0],.04);},
 shingle(g,n,r){g.fillStyle='#2e3236';g.fillRect(0,0,n,n);const rows=12,h=n/rows,w=n/6;for(let j=0;j<rows;j++)for(let i=-1;i<7;i++){const t=r(),x=i*w+(j%2?w/2:0);g.fillStyle=`rgb(${58+t*26|0},${60+t*26|0},${64+t*26|0})`;g.fillRect(x+1,j*h+1,w-2,h-2);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x+1,j*h+h-3,w-2,2);}speckle(g,n,r,6000,[200,200,200],.06);}
};
function texture(T,key){const cache=texture.cache||(texture.cache={});if(cache[key])return cache[key];const n=key==='brick'||key==='tiles'||key==='marble'?512:256,c=canvas(n),g=c.getContext('2d');DRAW[key](g,n,rng(hash(key)));const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;t.repeat.set(1/tile[key],1/tile[key]);return cache[key]=t;}
// ---- materials ---------------------------------------------------------------------------------------------------------
function materials(T){
 if(materials.cache)return materials.cache;const M={};const std=(o)=>new T.MeshStandardMaterial({roughness:.8,metalness:0,...o});
 for(const k of['stucco','brick','boards','battens','ashlar','metal','strata','tiles','paving','marble','concrete','perforated','deck','seam','grass','siding','shingle'])M[k]=std({map:texture(T,k),roughness:k==='metal'?.45:k==='marble'?.25:.85,metalness:k==='metal'||k==='seam'?.35:0});
 M.glassLobby=new T.MeshPhysicalMaterial({color:'#a9c4cc',roughness:.05,metalness:0,transparent:true,opacity:.22,depthWrite:false,envMapIntensity:1.2});
 M.rail=new T.MeshPhysicalMaterial({color:'#bfd6da',roughness:.05,transparent:true,opacity:.28,depthWrite:false});
 M.steel=std({color:'#b9bfc2',roughness:.3,metalness:.85});M.black=std({color:'#1d1f21',roughness:.45,metalness:.5});M.gold=std({color:'#b8955a',roughness:.3,metalness:.9});
 M.wood=std({map:texture(T,'boards'),color:'#c9a27a',roughness:.7});M.white=std({color:'#f4f3ef',roughness:.6});M.leaf=std({color:'#4f7a3a',roughness:.9});M.leafDark=std({color:'#3c6430',roughness:.9});M.soil=std({color:'#4a3a2c'});
 M.light=std({color:'#fff6e2',emissive:'#ffe6b8',emissiveIntensity:1.2,roughness:.4});M.cloth=std({color:'#d9d3c7',roughness:.95});M.clothDark=std({color:'#3d4447',roughness:.95});M.water=std({color:'#3a8fb0',roughness:.08,metalness:.1});
 M.rubber=std({color:'#222326',roughness:.9});M.chrome=std({color:'#d8dde0',roughness:.15,metalness:1});
 return materials.cache=M;}
const tinted=(T,M,key,color)=>{const c=tinted.cache||(tinted.cache={}),k=key+'|'+color;if(c[k])return c[k];const m=M[key].clone();m.color=new T.Color(color);return c[k]=m;};
// ---- a list of shapes per material, merged into one mesh each ---------------------------------------------------------
class Acc{
 constructor(T){this.T=T;this.lists=new Map();this.off=[0,0,0];this.col=new Map();}
 // Plain colours ('#rrggbb') all go into one list drawn with vertex colours, so a building is a handful of meshes.
 list(key){const paint=key[0]==='#',k=paint?'paint':key;let L=this.lists.get(k);if(!L){L={p:[],n:[],u:[],i:[],c:[]};this.lists.set(k,L);}L.rgb=paint?this.rgbOf(key):null;return L;}
 rgbOf(key){let c=this.col.get(key);if(!c){const C=new this.T.Color(key);c=[C.r,C.g,C.b];this.col.set(key,c);}return c;}
 quad(key,a,b,c,d,nx,ny,nz,ua,va,ub,vb){const L=this.list(key),o=L.p.length/3,f=this.off;for(const q of[a,b,c,d])L.p.push(q[0]+f[0],q[1]+f[1],q[2]+f[2]);for(let k=0;k<4;k++){L.n.push(nx,ny,nz);if(L.rgb)L.c.push(L.rgb[0],L.rgb[1],L.rgb[2]);}L.u.push(ua,va,ub,va,ub,vb,ua,vb);L.i.push(o,o+1,o+2,o,o+2,o+3);}
 // An upright box with UVs in metres (a texture tiles at its own size on every face). skip: faces to leave out.
 box(key,x0,x1,y0,y1,z0,z1,skip=''){
  if(x1<x0)[x0,x1]=[x1,x0];if(y1<y0)[y0,y1]=[y1,y0];if(z1<z0)[z0,z1]=[z1,z0];
  if(!skip.includes('pz'))this.quad(key,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],0,0,1,x0,y0,x1,y1);
  if(!skip.includes('nz'))this.quad(key,[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],0,0,-1,-x1,y0,-x0,y1);
  if(!skip.includes('px'))this.quad(key,[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],1,0,0,-z1,y0,-z0,y1);
  if(!skip.includes('nx'))this.quad(key,[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],-1,0,0,z0,y0,z1,y1);
  if(!skip.includes('py'))this.quad(key,[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],0,1,0,x0,-z1,x1,-z0);
  if(!skip.includes('ny'))this.quad(key,[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],0,-1,0,x0,z0,x1,z1);}
 // Any three.js geometry, moved by a matrix.
 geo(key,g,m){const L=this.list(key),o=L.p.length/3,P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv,T=this.T,v=new T.Vector3(),nm=new T.Matrix3().getNormalMatrix(m),f=this.off;
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(m);L.p.push(v.x+f[0],v.y+f[1],v.z+f[2]);v.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();L.n.push(v.x,v.y,v.z);if(U)L.u.push(U.getX(i),U.getY(i));else L.u.push(0,0);if(L.rgb)L.c.push(L.rgb[0],L.rgb[1],L.rgb[2]);}
  if(g.index)for(let i=0;i<g.index.count;i++)L.i.push(g.index.getX(i)+o);else for(let i=0;i<P.count;i++)L.i.push(o+i);g.dispose();}
 at(x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1){const T=this.T;return new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz));}
 cyl(key,x,y0,y1,z,r,seg=12,r2){this.geo(key,new this.T.CylinderGeometry(r2??r,r,y1-y0,seg),this.at(x,(y0+y1)/2,z));}
 ball(key,x,y,z,r,sy=1,seg=10){this.geo(key,new this.T.SphereGeometry(r,seg,Math.max(6,seg*.6|0)),this.at(x,y,z,0,0,0,1,sy,1));}
 // a box turned about y
 obox(key,x,y,z,w,h,d,ry){this.geo(key,new this.T.BoxGeometry(w,h,d),this.at(x,y+h/2,z,0,ry,0));}
 build(mats,name,shadow=true){const T=this.T,group=new T.Group();group.name=name;for(const[key,L]of this.lists){if(!L.i.length)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(L.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(L.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(L.u,2));if(key==='paint')g.setAttribute('color',new T.Float32BufferAttribute(L.c,3));g.setIndex(L.p.length/3>65535?new T.Uint32BufferAttribute(L.i,1):new T.Uint16BufferAttribute(L.i,1));g.computeBoundingSphere();const mat=mats(key);const m=new T.Mesh(g,mat);m.name=name+':'+key;m.castShadow=shadow&&!mat.transparent;m.receiveShadow=!mat.transparent;m.matrixAutoUpdate=false;group.add(m);}return group;}
}
// ---- the ten looks -------------------------------------------------------------------------------------------------------
const LOOK={
 mediterranean:{ends:'stucco',tint:'#f6f2ea',band:'stucco',bandTint:'#efe7da',frame:'#3a2f28',glass:'#2f4a55',balcony:'iron',canopy:'arcade',roof:'tiles',accent:'#2c5c86',back:'stucco',sign:'#2c5c86',font:'italic 600 70px Georgia'},
 coastal:{ends:'stucco',tint:'#fbfbf9',band:'stucco',bandTint:'#ffffff',frame:'#cfd5d8',glass:'#36596a',balcony:'curved',canopy:'fin',roof:'deck',accent:'#1f3f66',back:'stucco',sign:'#1f3f66',font:'300 72px "Segoe UI",Arial'},
 california:{ends:'boards',tint:'#ffffff',band:'stucco',bandTint:'#f2ede4',frame:'#2d2a26',glass:'#33505b',balcony:'wood',canopy:'pergola',roof:'pergola',accent:'#6f8f6a',back:'stucco',sign:'#3b3530',font:'600 66px "Trebuchet MS",Arial'},
 loft:{ends:'brick',tint:'#ffffff',band:'brick',frame:'#1b1d1f',glass:'#2b3b42',balcony:'juliet',canopy:'steel',roof:'tank',accent:'#1b1d1f',back:'brick',sign:'#f2ede4',font:'700 64px "Arial Black",Arial',piers:true},
 nordic:{ends:'battens',tint:'#ffffff',band:'stucco',bandTint:'#f4f2ee',frame:'#e9e6e0',glass:'#3a5961',balcony:'timber',canopy:'timber',roof:'gable',accent:'#3d4a52',back:'battens',sign:'#2f3a40',font:'500 66px "Segoe UI",Arial'},
 noir:{ends:'metal',tint:'#ffffff',band:'metal',bandTint:'#ffffff',frame:'#121314',glass:'#382f22',balcony:'none',canopy:'gold',roof:'pavilion',accent:'#b8955a',back:'metal',sign:'#d7b678',font:'300 70px Georgia',fins:true},
 warm:{ends:'ashlar',tint:'#ffffff',band:'ashlar',bandTint:'#ffffff',frame:'#3b2c22',glass:'#36494d',balcony:'planter',canopy:'timber',roof:'garden',accent:'#8a5a36',back:'ashlar',sign:'#f4ead8',font:'600 64px Georgia',slats:true},
 minimal:{ends:'stucco',tint:'#fdfdfc',band:'stucco',bandTint:'#fdfdfc',frame:'#121314',glass:'#3d5966',balcony:'none',canopy:'slab',roof:'flat',accent:'#121314',back:'stucco',sign:'#121314',font:'200 74px "Segoe UI",Arial'},
 designer:{ends:'perforated',tint:'#ffffff',band:'stucco',bandTint:'#ecebe8',frame:'#202224',glass:'#33515e',balcony:'box',canopy:'color',roof:'sculpture',accent:'#e0603e',back:'stucco',sign:'#ffffff',font:'800 66px "Arial Black",Arial',colors:['#e0603e','#2a9d8f','#e9c46a','#6c5bd0']},
 stone:{ends:'strata',tint:'#ffffff',band:'strata',bandTint:'#ffffff',frame:'#3c4246',glass:'#365560',balcony:'glass',canopy:'stone',roof:'garden',accent:'#5b6b62',back:'strata',sign:'#e9ece8',font:'500 66px "Segoe UI",Arial',stoneFins:true}
};
// The name over the door: a sign drawn on a canvas.
function signTexture(T,text,look){const c=document.createElement('canvas');c.width=1024;c.height=160;const g=c.getContext('2d');g.clearRect(0,0,1024,160);g.font=look.font;g.textAlign='center';g.textBaseline='middle';g.fillStyle=look.sign;g.fillText(text.toUpperCase().split('').join(String.fromCharCode(8202)),512,84);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
// ---- one building -------------------------------------------------------------------------------------------------------
function buildOne(scene,s,shell,det,ctx){
 const T=scene.T,M=materials(T),A=AP(),L=LOOK[s.design],[,,cx]=A.site(s.id);
 const HW=A.HW,DEEP=A.DEEP,ROOF=A.ROOF,PAR=A.PARAPET,top=ROOF+PAR,F=A.FIRST,ST=A.STEP,CE=A.CEIL,GZ=A.GLASS_Z,levels=[1,2,3,4].map(A.level);
 const r=rng(hash(s.id)),mat=ctx.mat,ox=det.off[0];
 const endKey=L.ends+(L.tint&&L.tint!=='#ffffff'?'|'+L.tint:''),bandKey=L.band+(L.bandTint&&L.bandTint!=='#ffffff'?'|'+L.bandTint:''),backKey=L.back+(L.back==='stucco'?'|'+(L.tint||'#f1eee8'):'');
 // plinth and the paving in front
 shell.box('paving',-HW-.4,HW+.4,-.12,0,-DEEP-.1,0,'ny');
 // the two ends (their inside faces are 5 cm inside the homes' wall finish), the back and the lift tower
 for(const k of[-1,1]){shell.box(endKey,k*(HW-.25),k*HW,0,top,-DEEP,0,k<0?'px':'nx');}
 /* V11.1: the back wall is drawn in three parts. The middle part stands in front of the lift tower; its outer face was what filled the lift doorway when you looked out of the lift (a wall you could walk through). That face is no longer drawn. */{const CX=A.CORE.x;shell.box(backKey,-HW+.25,-CX,0,top,-DEEP,-DEEP+.25,'pz px');shell.box(backKey,CX,HW-.25,0,top,-DEEP,-DEEP+.25,'pz nx');shell.box(backKey,-CX,CX,0,top,-DEEP,-DEEP+.25,'pz nz px nx');}
 const C=A.CORE;shell.box(backKey,-C.x,C.x,0,top+1.2,C.z,-DEEP,'pz');shell.box(L.ends==='metal'?'metal':'concrete',-C.x-.08,C.x+.08,top+1.2,top+1.5,C.z-.08,-DEEP+.05);
 // the edge of every floor slab across the front, and the parapet; the wall between the homes shows as a fin
 const bandFront=L.balcony==='curved'?.02:.08;
 for(const y of[...levels,ROOF]){shell.box(bandKey,-HW-.02,HW+.02,y-A.SLAB,y,GZ-.06,bandFront);}
 shell.box(bandKey,-HW-.02,HW+.02,ROOF,top+.03,-.35,bandFront);
 shell.box('concrete',-HW+.3,HW-.3,ROOF,ROOF+.05,-DEEP+.3,-.35,'ny');
 shell.box(L.piers?'brick':bandKey,-.14,.14,F-A.SLAB,ROOF,GZ-.06,.06);
 // window frames of the homes: posts at the same places as the homes' own (the homes draw no frames of their own)
 const posts=[0,2.6,5.15,7.7,10.36,12.6,14.8];
 const frame='#'+L.frame.slice(1);
 for(const y of levels)for(const k of[-1,1])for(const u of posts){if(u===0)continue;const x=k*(u+.1);const wide=u===14.8?.16:.07;shell.box(frame,x-wide/2,x+wide/2,y,y+CE,GZ-.05,GZ+.06);}
 for(const y of levels)for(const k of[-1,1]){shell.box(frame,k*.1,k*14.95,y,y+.06,GZ-.04,GZ+.05);shell.box(frame,k*.1,k*14.95,y+CE-.06,y+CE,GZ-.04,GZ+.05);}
 // ---- each look's own features
 const balconyFloor=(x0,x1,y,depth,key,thick=.22)=>{shell.box(key,x0,x1,y-thick,y,bandFront,depth);};
 if(L.piers){/* brick piers at the ends and between the homes, a steel lintel over every opening */for(const y of levels)for(const k of[-1,1]){shell.box(frame,k*.15,k*14.9,y+CE-.28,y+CE,.06,.16);}for(const x of[-HW,HW])shell.box('brick',x<0?x:x-.7,x<0?x+.7:x,0,top,-.3,.35);}
 if(L.fins){/* vertical dark fins at every frame post, full height, and gold at the slab edges */for(const k of[-1,1])for(const u of[2.6,5.15,7.7,10.36,12.6]){const x=k*(u+.1);shell.box('black',x-.05,x+.05,F-A.SLAB,ROOF+.4,.08,.7);}for(const y of levels)shell.box('gold',-HW-.01,HW+.01,y-.1,y-.04,.09,.11);}
 if(L.stoneFins){for(const x of[-HW+.4,-7.6,-.1,7.4,HW-.4])shell.box('strata',x-.35,x+.35,F-A.SLAB,top,.08,1.9);}
 if(L.slats){/* cedar slats on the ends, in front of the stone */for(const k of[-1,1])for(let i=0;i<24;i++){const z=-DEEP+.4+i*.58;shell.box('wood',k*HW,k*(HW+.12),F,ROOF,z,z+.09);}}
 if(L.balcony==='curved'){for(const y of levels){balconyFloor(-HW,HW,y,2.1,'white',.24);for(const k of[-1,1]){shell.geo('white',new T.CylinderGeometry(2.1,2.1,.24,24,1,false,k<0?PI:0,PI),shell.at(k*HW,y-.12,0,0,0,0));}
   det.box('rail',-HW,HW,y,y+1.05,2.0,2.04);for(const k of[-1,1])det.geo('rail',new T.CylinderGeometry(2.02,2.02,1.05,24,1,true,k<0?PI:0,PI),det.at(k*HW,y+.525,0));det.box('steel',-HW,HW,y+1.03,y+1.08,1.98,2.06);shell.box('#1f3f66',-HW,HW,y-.24,y-.16,2.1,2.12);}}
 if(L.balcony==='iron'){for(const y of levels)for(const k of[-1,1]){const x0=k*.9,x1=k*14.4;balconyFloor(Math.min(x0,x1),Math.max(x0,x1),y,1.3,'stucco|'+L.bandTint,.2);const a=Math.min(x0,x1),b=Math.max(x0,x1);det.box('black',a,b,y+.98,y+1.03,1.24,1.3);det.box('black',a,b,y+.1,y+.13,1.24,1.3);for(let x=a;x<=b+.01;x+=.13)det.box('black',x-.012,x+.012,y,y+1,1.255,1.28);for(const xx of[a,b])det.box('black',xx-.01,xx+.01,y,y+1,.1,1.3);
   for(let x=a+.5;x<b-.3;x+=1.4){det.ball('black',x,y+.6,1.27,.12,1.4,8);}}}
 if(L.balcony==='wood'){for(const y of levels){balconyFloor(-HW+.2,HW-.2,y,1.8,'deck',.2);for(let x=-HW+.3;x<=HW-.29;x+=1.62){det.box('black',x-.03,x+.03,y,y+1.05,1.66,1.72);}det.box('wood',-HW+.2,HW-.2,y+.98,y+1.08,1.62,1.76);for(let h=.2;h<.95;h+=.15)det.box('steel',-HW+.3,HW-.3,y+h,y+h+.008,1.69,1.7);}}
 if(L.balcony==='timber'){for(const y of levels){balconyFloor(-HW+.3,HW-.3,y,1.5,'deck',.2);for(let x=-HW+.35;x<=HW-.35;x+=.11)det.box('wood',x-.025,x+.025,y,y+1.0,1.42,1.47);det.box('wood',-HW+.3,HW-.3,y+.98,y+1.04,1.38,1.5);}}
 if(L.balcony==='planter'){for(const y of levels){balconyFloor(-HW,HW,y,2.4,'ashlar',.28);shell.box('wood',-HW,HW,y-.3,y-.28,bandFront,2.4,'py');det.box('ashlar',-HW,HW,y,y+.75,2.0,2.4);det.box('soil',-HW+.1,HW-.1,y+.6,y+.76,2.06,2.34,'ny');for(let x=-HW+.4;x<HW-.3;x+=.55){det.ball(r()<.5?'leaf':'leafDark',x+r()*.2,y+.86+r()*.12,2.2,.32+r()*.12,.8,7);if(r()<.25)det.ball('leafDark',x+.1,y+.55,2.36,.18,1.6,6);}det.box('rail',-HW,HW,y+.75,y+1.1,2.36,2.39);}}
 if(L.balcony==='glass'){for(const y of levels){balconyFloor(-HW,HW,y,1.6,'strata',.24);det.box('rail',-HW,HW,y,y+1.05,1.52,1.56);}}
 if(L.balcony==='juliet'){for(const y of levels)for(const k of[-1,1])for(const u of[3.9,8.9]){const x=k*(u+.1);det.box('black',x-1.1,x+1.1,y,y+.04,.06,.45);det.box('black',x-1.1,x+1.1,y+.96,y+1.0,.42,.46);for(let xx=x-1.1;xx<=x+1.11;xx+=.12)det.box('black',xx-.01,xx+.01,y,y+.98,.43,.45);for(const e of[-1.1,1.1])det.box('black',x+e-.012,x+e+.012,y,y+.98,.06,.45);}}
 if(L.balcony==='box'){const cols=L.colors;levels.forEach((y,i)=>{for(const k of[-1,1]){const shift=(i%2?1.6:-1.6)*k,c0=k*(2.2+shift),c1=k*(12.6+shift),a=Math.min(c0,c1),b=Math.max(c0,c1),col=cols[(i*2+(k>0?1:0))%cols.length];
   shell.box(col,a,b,y-.25,y,bandFront,1.7);shell.box(col,a,a+.2,y,y+CE+.25,bandFront,1.7);shell.box(col,b-.2,b,y,y+CE+.25,bandFront,1.7);shell.box(col,a,b,y+CE,y+CE+.25,bandFront,1.7);det.box('rail',a+.2,b-.2,y,y+1.0,1.62,1.66);}});}
 // ---- the entrance canopy, the name and the doors
 let signAt=[0,3.55,.62];
 if(L.canopy==='arcade'){/* five arches across the lobby front, a tiled lean-to roof over them */const n=5,span=16/n;for(let i=0;i<=n;i++){const x=-8+i*span;shell.box('stucco|'+L.bandTint,x-.3,x+.3,0,2.3,1.9,2.5);}
  const shape=new T.Shape();shape.moveTo(-8.3,0);for(let i=0;i<n;i++){const xm=-8+span*(i+.5),hw=span/2-.3;shape.lineTo(xm-hw,0);shape.lineTo(xm-hw,.25);shape.absarc(xm,.25,hw,PI,0,true);shape.lineTo(xm+hw,0);}shape.lineTo(8.3,0);shape.lineTo(8.3,1.8);shape.lineTo(-8.3,1.8);shape.lineTo(-8.3,0);
  shell.geo('stucco|'+L.bandTint,new T.ExtrudeGeometry(shape,{depth:.6,bevelEnabled:false,curveSegments:10}),shell.at(0,2.3,1.9));shell.geo('tiles',new T.BoxGeometry(17.2,.12,3.2),shell.at(0,4.25,1.25,-.22,0,0));signAt=[0,4.65,.12];}
 else if(L.canopy==='fin'){const sh=new T.Shape();sh.moveTo(-5,0);sh.lineTo(5,0);sh.absarc(5,1.8,1.8,-PI/2,PI/2,false);sh.lineTo(-5,3.6);sh.absarc(-5,1.8,1.8,PI/2,PI*1.5,false);shell.geo('white',new T.ExtrudeGeometry(sh,{depth:.22,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,curveSegments:16}),shell.at(0,3.62,-.1,PI/2,0,0));signAt=[0,3.25,.0];}
 else if(L.canopy==='pergola'){for(let i=0;i<9;i++){const x=-4+i;det.box('wood',x-.06,x+.06,3.55,3.8,-.1,3.2);}for(const z of[.8,2.9])det.box('wood',-4.5,4.5,3.8,3.95,z-.08,z+.08);for(const x of[-4.2,4.2])det.box('wood',x-.12,x+.12,0,3.8,2.8,3.04);signAt=[0,3.3,.05];}
 else if(L.canopy==='steel'){det.box('black',-4.5,4.5,3.4,3.55,-.1,2.6);for(const x of[-4,4]){det.geo('black',new T.CylinderGeometry(.025,.025,3.2,6),det.at(x,4.6,1.2,1.02,0,0));}signAt=[0,3.0,.05];}
 else if(L.canopy==='timber'){det.box('wood',-5,5,3.5,3.75,-.1,2.8);det.box('black',-5,5,3.45,3.5,.2,2.62);for(const x of[-4.6,4.6])det.box('wood',x-.15,x+.15,0,3.5,2.4,2.7);signAt=[0,3.1,.05];}
 else if(L.canopy==='gold'){det.box('black',-5,5,3.5,3.8,-.1,3.0);det.box('gold',-5,5,3.5,3.56,2.94,3.06);det.box('light',-4.6,4.6,3.48,3.5,.2,2.7);signAt=[0,3.15,.05];}
 else if(L.canopy==='slab'){det.box('white',-6,6,3.7,3.82,-.1,3.4);signAt=[0,3.35,.05];}
 else if(L.canopy==='color'){det.box(L.accent,-4.6,4.6,3.6,3.9,-.1,2.6);for(const x of[-4.3,4.3])det.box(L.accent,x-.3,x+.3,0,3.6,2.0,2.6);signAt=[0,3.3,.05];}
 else if(L.canopy==='stone'){det.box('strata',-3.2,-2.2,0,4.1,-.1,1.2);det.box('strata',2.2,3.2,0,4.1,-.1,1.2);det.box('strata',-3.2,3.2,3.4,4.1,-.1,1.2);signAt=[0,3.75,1.21];}
 {const row=ctx.signRow(s,L),g=new T.PlaneGeometry(6.4,1),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,row[0]+(row[1]-row[0])*uv.getY(i));det.geo('sign',g,det.at(signAt[0],signAt[1],signAt[2]+.012));}
 // the lobby front: frames and glass (the glass is drawn once for the building, see below), the doors
 for(let x=-HW+.25;x<=HW-.25+.01;x+=HW/4.5){if(Math.abs(x)<1.8)continue;det.box(frame,x-.05,x+.05,0,F-A.SLAB,GZ-.05,GZ+.06);}
 det.box(frame,-HW+.25,HW-.25,2.7,2.78,GZ-.05,GZ+.06);for(const x of[-1.75,1.75])det.box(frame,x-.06,x+.06,0,2.7,GZ-.06,GZ+.07);
 // ---- the lobby inside
 det.box('marble',-8,8,0,.012,-DEEP+.3,GZ-.06,'ny');det.box(L.ends==='metal'?'marble':'concrete',-HW+.26,-8.21,0,.008,-DEEP+.3,GZ-.06,'ny');det.box('concrete',8.21,HW-.26,0,.008,-DEEP+.3,GZ-.06,'ny');
 det.box('white',-HW+.25,HW-.25,F-A.SLAB-.02,F-A.SLAB,-DEEP+.25,GZ-.06,'py');
 // the inside faces of the ground floor's own walls (the building's walls leave them out, the homes above have their own)
 det.box('white',-HW+.25,HW-.25,0,F-A.SLAB-.02,-DEEP+.25,-DEEP+.27,'nz');for(const k of[-1,1])det.box('white',k*(HW-.25),k*(HW-.27),0,F-A.SLAB-.02,-DEEP+.27,GZ-.06,k<0?'nx':'px');
 for(const k of[-1,1]){/* the walls of the side rooms: glass from 1 m up, a solid base */det.box('white',k*8.02,k*8.18,0,1,-DEEP+.25,-.3);det.box('white',k*8.02,k*8.18,3.3,F-A.SLAB-.02,-DEEP+.25,-.3);det.box('glassLobby',k*8.09,k*8.11,1,3.3,-DEEP+.25,-.3);}
 /* V11.3: the lobby's furniture, lifts, mail boxes, gym and lounge go into a part of their own, built only when you are in or
    near the building (city-inside.js); its walls, floor and ceiling lights stay with the row */const dd=det;if(ctx.lobby)det=ctx.lobby(s,dd);
 const feature=L.ends==='brick'?'brick':L.ends==='ashlar'?'ashlar':L.ends==='metal'?'metal':L.ends==='strata'?'strata':L.ends==='boards'||L.ends==='battens'?'wood':'marble';
 det.box(feature,-7.9,-7.4,0,3.6,-9,-3);det.box('gold',-7.42,-7.38,2.6,2.66,-8.4,-3.6);
 det.box(L.ends==='metal'?'black':'wood',-6.4,-4.2,0,1.08,-6.4,-5.6);det.box('marble',-6.5,-4.1,1.08,1.12,-6.5,-5.5);
 // sofas, a low table, planters with plants
 {const rb=root.CityApartmentsRooms?.rbox;for(const z of[-5.45,-8.95]){const back=z<-7?-1:1;if(rb){det.geo('clothDark',rb(T,2.8,.3,.9,.06,2),det.at(5.3,.25,z));for(let i=0;i<2;i++)det.geo('cloth',rb(T,1.28,.16,.62,.07,3),det.at(4.65+i*1.3,.48,z-back*.1));det.geo('clothDark',rb(T,2.8,.5,.2,.07,3),det.at(5.3,.62,z+back*.36,back*.12,0,0));for(const x of[3.98,6.62])det.geo('clothDark',rb(T,.16,.32,.9,.06,3),det.at(x,.52,z));}else det.box('clothDark',3.9,6.7,0,.8,z-.45,z+.45);for(const x of[4.0,6.6])det.cyl('gold',x,0,.1,z,.025,8);}}
 det.box('marble',4.7,5.9,.36,.42,-7.6,-6.8);det.box('black',5.2,5.4,0,.36,-7.3,-7.1);
 for(const x of[-7.4,7.4]){det.box('concrete',x-.4,x+.4,0,.9,-1.3,-.5);det.box('soil',x-.35,x+.35,.86,.9,-1.25,-.55,'ny');for(let i=0;i<5;i++)det.ball('leaf',x+(r()-.5)*.5,1.2+r()*.9,-.9+(r()-.5)*.5,.35,1.2,7);det.cyl('wood',x,.9,1.5,-.9,.04,5);}
 // the lifts: two pairs of steel doors in a stone surround, the call panel between them, a floor display over each
 for(const k of[-1,1]){const x=k*2.05;det.box('marble',x-.85,x+.85,0,2.6,-DEEP+.25,-DEEP+.32);det.box('chrome',x-.58,x+.58,2.32,2.42,-DEEP+.32,-DEEP+.34);det.box('black',x-.3,x+.3,2.46,2.6,-DEEP+.32,-DEEP+.335);det.box('light',x-.12,x+.12,2.5,2.56,-DEEP+.335,-DEEP+.34);}
 det.box('chrome',-.12,.12,1.05,1.45,-DEEP+.26,-DEEP+.31);det.box('light',-.04,.04,1.2,1.3,-DEEP+.31,-DEEP+.315);
 // mail boxes on the wall of the east room, a pendant light over the sofas, recessed lights
 for(let i=0;i<4;i++)for(let j=0;j<4;j++)det.box(j%2?'gold':'steel',7.98,8.0,.9+j*.32,1.18+j*.32,-12.2+i*.42,-11.84+i*.42);
 det=dd;for(let i=0;i<7;i++){const a=i/7*TAU;det.cyl('steel',5.3+Math.cos(a)*.6,3.0,4.08,-7.2+Math.sin(a)*.6,.006,4);det.ball('light',5.3+Math.cos(a)*.6,2.95,-7.2+Math.sin(a)*.6,.16,1,10);}
 for(let x=-6;x<=6;x+=3)for(let z=-12;z<=-2;z+=3.3)det.cyl('light',x,F-A.SLAB-.03,F-A.SLAB-.02,z,.09,10);
 // the residents' gym (west) and lounge (east), seen through the glass
 if(ctx.lobby)det=ctx.lobby(s,dd);
 for(let i=0;i<3;i++){const z=-11+i*3.2;det.box('black',-14,-12.2,0,.25,z-.4,z+.4);det.box('rubber',-13.9,-12.3,.25,.3,z-.32,z+.32);det.box('black',-12.4,-12.3,.25,1.3,z-.35,z+.35);det.box('black',-12.5,-12.2,1.2,1.35,z-.38,z+.38);}
 det.box('rubber',-14.6,-9,0,.01,-13.5,-1,'ny');det.box('chrome',-14.8,-14.75,.5,2.6,-12,-6);
 for(let i=0;i<2;i++){const z=-9+i*4;det.box('cloth',10,11.2,0,.44,z-.5,z+.5);det.box('cloth',10,10.25,.44,.85,z-.5,z+.5);det.box('cloth',12.5,13.7,0,.44,z-.5,z+.5);det.box('cloth',13.45,13.7,.44,.85,z-.5,z+.5);det.cyl('wood',11.85,0,.45,z,.35,14);}
 for(let i=0;i<5;i++)det.box(['#7a5c3e','#2f5a7a','#a33b2f','#c9a24a','#3f6b45'][i],14.6,14.8,.9+i*.02,2.6-i*.03,-13+i*1.1,-12.2+i*1.1);
 det=dd;
 // ---- the car park behind: wheel stops, two lamp posts, a hedge along each side, a bin and a bike rack
 const lot={z0:A.LOT.z0-A.ZF,z1:A.LOT.z1-A.ZF};const bays=Math.floor((HW*2-.4)/2.6);
 for(let i=0;i<bays;i++){const x=-bays*1.3+1.3+i*2.6;det.box('concrete',x-.8,x+.8,-.1,.02,lot.z1-.65,lot.z1-.45);}
 for(const x of[-HW+1,HW-1]){det.cyl('black',x,-.1,5.4,(lot.z0+lot.z1)/2,.07,8);det.box('black',x-.05,x+.05,5.3,5.4,(lot.z0+lot.z1)/2,(lot.z0+lot.z1)/2+.9);det.box('light',x-.18,x+.18,5.22,5.3,(lot.z0+lot.z1)/2+.6,(lot.z0+lot.z1)/2+1);}
 for(const k of[-1,1]){const x=k*(HW+.45);for(let z=lot.z0+1;z<lot.z1-.2;z+=.7)det.ball('leafDark',x,.45,z,.36,1.1,7);}
 for(let z=lot.z1+.6;z<-DEEP-.4;z+=1.1){for(const x of[-HW+2,-C.x-1.4,C.x+1.4,HW-2])det.ball(r()<.5?'leaf':'leafDark',x+(r()-.5)*.6,.4,z,.38,1,7);}
 // ---- trees in the garden either side of the building (palms near the sea, olive-like trees behind)
 for(const k of[-1,1]){for(let i=0;i<3;i++){const x=k*(HW+4.2+i*.0),z=-2.5-i*5.5;palm(det,x+(r()-.5),z,7+r()*3,r);}}
 // the glass of the lobby front (seen from inside and outside)
 det.geo('glassLobby',new T.PlaneGeometry(HW*2-.5,F-A.SLAB),det.at(0,(F-A.SLAB)/2,GZ));
 // the roof
 roof(T,shell,det,L,s,r,null,mat);
 // ---- what is left per building: the panes of its homes (one instance each in the row's glass), its doors
 const units=[];for(let f=1;f<=4;f++)for(const side of['w','e']){const n=A.unitNumber(f,side),k=side==='w'?-1:1,y=A.level(f);units.push({id:A.unitId(s.id,n),matrix:new T.Matrix4().compose(new T.Vector3(ox+k*7.525,y+CE/2,GZ),new T.Quaternion(),new T.Vector3(14.85,CE,1)),lit:r()<.55?.6+r()*.6:0});}
 // two glass leaves at the front that slide apart, and the lift doors (two leaves each) in the lobby; drawn only near
 const leaves=[];for(const k of[-1,1]){const g=new T.Mesh(ctx.leafGeo,M.glassLobby);g.position.set(ox+k*.86,1.34,GZ+.08);g.userData={k,x:ox};ctx.doors.add(g);leaves.push(g);const fr=new T.Mesh(ctx.leafFrame,M.black);fr.position.copy(g.position);fr.userData={k,x:ox};ctx.doors.add(fr);leaves.push(fr);}
 const liftLeaves=[];for(const k of[-1,1])for(const e of[-1,1]){const m=new T.Mesh(ctx.liftGeo,M.chrome);m.position.set(ox+k*2.05+e*.275,1.15,-DEEP+.36);m.userData={k,e,x:ox+k*2.05+e*.275};ctx.doors.add(m);liftLeaves.push(m);}
 return{units,leaves,liftLeaves,site:s,glass:L.glass,x:cx};
}function palm(acc,x,z,h,r){const T=acc.T,lean=(r()-.5)*.25;for(let i=0;i<10;i++){const t=i/10,y=t*h;acc.geo('wood',new T.CylinderGeometry(.16-.05*t,.18-.05*t,h/10+.02,7),acc.at(x+lean*y*.3,y+h/20,z,0,0,-lean*.3));}
 for(let i=0;i<9;i++){const a=i/9*TAU+r()*.3;acc.geo(i%2?'leaf':'leafDark',new T.BoxGeometry(2.6,.05,.5),acc.at(x+lean*h*.3+Math.cos(a)*1.2,h-.25,z+Math.sin(a)*1.2,0,-a,-.42));}acc.ball('wood',x+lean*h*.3,h,z,.3,1,7);}
function roof(T,shell,det,L,s,r,group,mat){
 const A=AP(),HW=A.HW,DEEP=A.DEEP,R=A.ROOF,P=A.PARAPET;
 if(L.roof==='tiles'){/* a low hipped roof of clay tiles behind the parapet */const h=3.2,x0=-HW,x1=HW,z0=-DEEP,z1=0,y=R+P-.2,ridge=[x0+5,x1-5],zr=(z0+z1)/2;
  const tri=(a,b,c)=>{const g=new T.BufferGeometry();const p=new Float32Array([...a,...b,...c]);g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('uv',new T.BufferAttribute(new Float32Array([a[0],a[2]+a[1],b[0],b[2]+b[1],c[0],c[2]+c[1]]),2));g.computeVertexNormals();return g;};
  const add=(a,b,c)=>shell.geo('tiles',tri(a,b,c),new T.Matrix4());
  const A0=[x0,y,z1],B0=[x1,y,z1],C0=[x1,y,z0],D0=[x0,y,z0],RA=[ridge[0],y+h,zr],RB=[ridge[1],y+h,zr];
  add(A0,B0,RB);add(A0,RB,RA);add(C0,D0,RA);add(C0,RA,RB);add(B0,C0,RB);add(D0,A0,RA);
  shell.box('stucco|'+L.bandTint,-HW,HW,y-.05,y+.05,-.4,.25);}
 else if(L.roof==='gable'){/* a steep metal gable roof along the building, gable ends clad in battens */const y=R+P-.3,h=5.4,zr=-DEEP/2;
  for(const e of[-1,1]){const g=new T.PlaneGeometry(HW*2+.6,Math.hypot(DEEP/2+.4,h));const ang=Math.atan2(h,DEEP/2+.4);shell.geo('seam',g,shell.at(0,y+h/2,zr+e*(DEEP/4+.1),e>0?-(PI/2-ang):(PI/2-ang),e>0?0:PI,0));}
  for(const k of[-1,1]){const sh=new T.Shape();sh.moveTo(-DEEP/2,0);sh.lineTo(DEEP/2,0);sh.lineTo(0,h-.1);sh.lineTo(-DEEP/2,0);shell.geo('battens',new T.ExtrudeGeometry(sh,{depth:.2,bevelEnabled:false}),shell.at(k*(HW-.2)-.1*(k>0?1:-1)+(k>0?-.0:0),y,zr,0,PI/2,0));}
  shell.box('black',-HW-.3,HW+.3,y+h-.05,y+h+.1,zr-.12,zr+.12);for(const x of[-9,0,9])det.box('black',x-.4,x+.4,y+2.2,y+3.4,-DEEP*.25-.4,-DEEP*.25+.4);}
 else if(L.roof==='deck'){shell.box('deck',-HW+.3,HW-.3,R+.05,R+.12,-DEEP+.3,-.35,'ny');for(let i=0;i<4;i++){const x=-10+i*6.6;det.box('white',x-.5,x+.5,R+.12,R+.45,-6,-4.2);det.box('white',x-.5,x+.5,R+.45,R+.85,-6,-5.75);}
  for(const[x,z]of[[-9,-9],[6,-10]]){for(const c of[[x-3,z-2],[x+3,z-2.5],[x,z+3]])det.cyl('steel',c[0],R+.1,R+3.2,c[1],.05,6);const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array([x-3,R+3.1,z-2,x+3,R+2.9,z-2.5,x,R+3.0,z+3]),3));g.setAttribute('uv',new T.BufferAttribute(new Float32Array([0,0,1,0,.5,1]),2));g.computeVertexNormals();det.geo('white',g,new T.Matrix4());const g2=g.clone();g2.index=null;const p=g2.attributes.position.array;[p[0],p[3]]=[p[3],p[0]];[p[1],p[4]]=[p[4],p[1]];[p[2],p[5]]=[p[5],p[2]];g2.computeVertexNormals();det.geo('white',g2,new T.Matrix4());}
  det.box('water',-4,4,R+.12,R+.5,-12.6,-9.6);det.box('white',-4.2,4.2,R+.12,R+.55,-12.8,-12.6);det.box('white',-4.2,4.2,R+.12,R+.55,-9.6,-9.4);}
 else if(L.roof==='pergola'){shell.box('deck',-HW+.3,HW-.3,R+.05,R+.12,-DEEP+.3,-.35,'ny');for(let x=-12;x<=12.01;x+=1.2)det.box('wood',x-.07,x+.07,R+2.8,R+3.0,-12,-2);for(const x of[-12,12])for(const z of[-11.8,-2.2])det.box('wood',x-.12,x+.12,R,R+2.8,z-.12,z+.12);for(const z of[-11.8,-2.2])det.box('wood',-12.2,12.2,R+2.6,R+2.8,z-.1,z+.1);
  for(let i=0;i<10;i++)det.ball(i%2?'leaf':'leafDark',-11+i*2.4,R+.7,-1.4,.6,.8,7);det.box('concrete',-12,12,R+.1,R+.5,-1.9,-.9);}
 else if(L.roof==='tank'){/* a timber water tank on steel legs, skylights */const x=6,z=-9;for(const a of[0,1,2,3]){det.cyl('black',x+Math.cos(a*PI/2+.78)*1.6,R,R+3.2,z+Math.sin(a*PI/2+.78)*1.6,.08,6);}det.cyl('wood',x,R+3.2,R+6.4,z,2.1,18);det.geo('black',new T.ConeGeometry(2.3,1.2,18),det.at(x,R+7.0,z));for(let i=0;i<4;i++)det.geo('black',new T.TorusGeometry(2.12,.04,4,24),det.at(x,R+3.6+i*.9,z,PI/2,0,0));
  for(const xx of[-10,-4])det.geo('glassLobby',new T.BoxGeometry(3,.8,2),det.at(xx,R+.4,-7,0,0,0));}
 else if(L.roof==='pavilion'){/* a glass room on the roof, lit at night */det.box('black',-9,9,R+3.1,R+3.3,-12,-3.5);for(const x of[-9,-3,3,9])for(const z of[-12,-3.5])det.box('black',x-.08,x+.08,R,R+3.1,z-.08,z+.08);det.box('glassLobby',-9,9,R,R+3.1,-3.55,-3.5);det.box('light',-8.5,8.5,R+3.05,R+3.1,-11.5,-4,'py');det.box('deck',-HW+.3,HW-.3,R+.05,R+.1,-DEEP+.3,-.35,'ny');
  det.box('water',-12,-6,R+.1,R+.45,-2.8,-.8);}
 else if(L.roof==='garden'){shell.box('grass',-HW+.3,HW-.3,R+.05,R+.25,-DEEP+.3,-.35,'ny');for(let i=0;i<6;i++){const x=-12+i*4.8,z=-4-((i*7)%3)*3;det.cyl('concrete',x,R+.25,R+.85,z,.8,12);det.cyl('wood',x,R+.85,R+2.2,z,.1,6);det.ball(i%2?'leaf':'leafDark',x,R+2.8,z,1.1,.9,9);}det.box('deck',-6,6,R+.25,R+.32,-12,-8,'ny');}
 else if(L.roof==='sculpture'){const cols=L.colors;for(let i=0;i<4;i++){det.obox(cols[i%cols.length],-4+i*2.7,R,-7,.5,4+i*1.1,.5,i*.35);det.geo(cols[(i+1)%cols.length],new T.TorusGeometry(1.2,.16,8,24),det.at(0,R+5.6,-7,0,i*.8,0));}}
 else{/* flat: a thin crown */shell.box('white',-HW-.1,HW+.1,R+P,R+P+.15,-DEEP-.1,.15);}
}
// ---- the whole set ---------------------------------------------------------------------------------------------------------
function build(scene){
 const A=AP();if(!A||!scene?.world?.apartments)return;if(scene.apartments)dispose(scene);const T=scene.T,M=materials(T);
 const root3=new T.Group();root3.name='apartments';scene.scene.add(root3);
 const paint=new T.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:0});
 // the names of all ten buildings on one sheet
 const sheet=document.createElement('canvas');sheet.width=1024;sheet.height=160*A.SITES.length;const sg=sheet.getContext('2d');const signTex=new T.CanvasTexture(sheet);signTex.colorSpace=T.SRGBColorSpace;signTex.anisotropy=8;
 const signMat=new T.MeshBasicMaterial({map:signTex,transparent:true,depthWrite:false});
 const mat=key=>{if(key==='paint')return paint;if(key==='sign')return signMat;const[base,tint]=key.split('|');return tint?tinted(T,M,base,tint):M[base];};
 const leafGeo=new T.BoxGeometry(1.72,2.68,.04),leafFrame=(()=>{const g=new T.BoxGeometry(1.74,2.7,.05);return g;})(),liftGeo=new T.BoxGeometry(.55,2.3,.04);
 // a frame round each glass leaf (just its edges: a thin box behind the glass would hide it, so the frame is open)
 const frameGeo=new T.BufferGeometry();{const parts=[];const acc=new Acc(T);acc.box('#141414',-.87,.87,-1.35,-1.27,-.03,.03);acc.box('#141414',-.87,.87,1.27,1.35,-.03,.03);acc.box('#141414',-.87,-.8,-1.27,1.27,-.03,.03);acc.box('#141414',.8,.87,-1.27,1.27,-.03,.03);const L=acc.lists.get('paint');frameGeo.setAttribute('position',new T.Float32BufferAttribute(L.p,3));frameGeo.setAttribute('normal',new T.Float32BufferAttribute(L.n,3));frameGeo.setIndex(L.i);void parts;}
 // the rows of buildings between the streets: each row is one set of meshes
 /* V9.7: a row is the buildings on one front line (the beach front, Lantern Street) close together */const rows=[];for(const s of scene.world.apartments){const x=s.x,zf=s.zf||A.ZF;let row=rows.find(q=>q.zf===zf&&Math.abs(q.x1-x)<90);if(!row){row={x0:x,x1:x,zf,list:[]};rows.push(row);}row.list.push(s);row.x1=x;}
 const list=[],clusters=[];
 for(const row of rows){
  const cx=(row.list[0].x+row.list[row.list.length-1].x)/2,shell=new Acc(T),det=new Acc(T),doors=new T.Group();doors.name='apt-doors';const built=[],lobbies=new Map(),lazyLobby=!!root.CityInside?.lazy(scene);
  const ctx={lobby:lazyLobby?(s,d)=>{let e=lobbies.get(s.id);if(!e){const a=new Acc(T);a.off=d.off.slice();e={s,acc:a};lobbies.set(s.id,e);}return e.acc;}:null,mat,doors,leafGeo,leafFrame:frameGeo,liftGeo,signRow:(s,L)=>{const i=A.SITES.findIndex(q=>q[0]===s.id),y=i*160;sg.clearRect(0,y,1024,160);sg.font=L.font;sg.textAlign='center';sg.textBaseline='middle';sg.fillStyle=L.sign;sg.fillText(s.name.toUpperCase().split('').join(String.fromCharCode(8202)),512,y+84);signTex.needsUpdate=true;return[1-(i+1)/A.SITES.length,1-i/A.SITES.length];}};
  for(const s of row.list){shell.off=[s.x-cx,0,0];det.off=[s.x-cx,0,0];try{built.push(buildOne(scene,s,shell,det,ctx));}catch(e){scene.apartmentsError=String(e&&e.stack||e);}}
  shell.off=det.off=[0,0,0];
  const group=new T.Group();group.name='apartment-row';group.position.set(cx,A.G,row.zf);
  const sh=shell.build(mat,'apt-shell',true),dt=det.build(mat,'apt-detail',true)/* V13.6: the trees, benches, planters and lamps in front cast shadows too */;group.add(sh,dt,doors);
  // the panes of all the homes in the row: one instance each, coloured by its building, lit one by one at night
  const n=built.length*8,glassMat=new T.MeshStandardMaterial({color:'#ffffff',roughness:.06,metalness:.85,envMapIntensity:1.4,emissive:'#ffcf8a',emissiveIntensity:0});
  glassMat.onBeforeCompile=q=>{q.vertexShader=q.vertexShader.replace('#include <common>','#include <common>\nattribute float aLit;\nvarying float vLit;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLit=aLit;');q.fragmentShader=q.fragmentShader.replace('#include <common>','#include <common>\nvarying float vLit;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=vLit;');};
  const pane=new T.PlaneGeometry(1,1),panes=new T.InstancedMesh(pane,glassMat,n),lit=new Float32Array(n);panes.name='apt-panes';let i=0;const color=new T.Color();
  for(const b of built){color.set(b.glass);for(const u of b.units){u.index=i;u.panes=panes;panes.setMatrixAt(i,u.matrix);panes.setColorAt(i,color);lit[i]=u.lit;i++;}}
  pane.setAttribute('aLit',new T.InstancedBufferAttribute(lit,1));panes.instanceMatrix.needsUpdate=true;if(panes.instanceColor)panes.instanceColor.needsUpdate=true;panes.receiveShadow=false;sh.add(panes);
  root3.add(group);group.updateMatrixWorld(true);for(const b of built){b.cluster=group;list.push(b);}
   /* V11.3 */for(const e of lobbies.values()){const s=e.s,zf=row.zf;root.CityInside.register(scene,{id:'lobby:'+s.id,room:true,box:{x0:s.x-A.HW,x1:s.x+A.HW,z0:zf-A.DEEP,z1:zf+.5,y0:A.G,y1:A.G+A.FIRST},build:()=>{const g=e.acc.build(mat,'apt-lobby:'+s.id,false);group.add(g);return g;},drop:(sc,g)=>{g.removeFromParent();g.traverse(o=>{if(o.geometry)o.geometry.dispose();});}});}clusters.push({group,detail:dt,doors,glassMat,x0:row.list[0].x-15.2,x1:row.list[row.list.length-1].x+15.2,zf:row.zf,built});}
 scene.apartments={root:root3,list,clusters,hidden:null};}
function dispose(scene){const a=scene.apartments;if(!a)return;a.root.removeFromParent();a.root.traverse(o=>{if(o.geometry)o.geometry.dispose();});scene.apartments=null;}
// Every frame: detail near, doors near, the hidden pane, lit windows at night.
function draw(scene){
 const a=scene.apartments,sim=root.PlatdoCity?.sim;if(!a||!sim)return;const A=AP(),p=sim.player,cam=scene.camera.position,dt=Math.min(.1,Math.max(0,(scene.time||0)-(a.t||0)));a.t=scene.time||0;
 const inside=A.unitAt(p.x,p.y,p.z),night=sim.dayTime!==undefined?(sim.dayTime<.27||sim.dayTime>.77):false;
 for(const c of a.clusters){const dx=Math.max(c.x0-cam.x,0,cam.x-c.x1),dz=cam.z-((c.zf||A.ZF)-8),far=Math.hypot(dx,dz);c.detail.visible=far<260||!!(inside&&c.built.some(b=>b.site.id===inside.site));c.doors.visible=far<70;c.glassMat.emissiveIntensity=night?1.25:0;}
 for(const b of a.list){if(!b.cluster)continue;const near=Math.abs(cam.x-b.x)<70&&Math.abs(cam.z-(A.zfOf?A.zfOf(A.site(b.site.id)):A.ZF))<70;if(!near)continue;
  // the front doors open when anyone is near them
  const door=A.lobby(b.site.id).door;let open=Math.hypot(p.x-door.x,p.z-door.z)<3.6&&Math.abs(p.y-A.G)<2;if(!open)open=sim.npcs.some(n=>Math.abs(n.x-door.x)<3.6&&Math.abs(n.z-door.z)<3.6);
  b.open=(b.open||0)+((open?1:0)-(b.open||0))*Math.min(1,dt*6);for(const g of b.leaves)g.position.x=g.userData.x+g.userData.k*(.86+b.open*1.6);
  // the lift doors (opened and closed by the lift's short film, see city-apt-life.js)
  const lift=b.lift||0;for(const m of b.liftLeaves)m.position.x=m.userData.x+m.userData.e*lift*.5;}
 // hide the pane of the home you are in
 const key=inside?inside.id:null;if(key!==a.hidden){const zero=new scene.T.Matrix4().makeScale(0,0,0);for(const b of a.list)for(const u of b.units){if(!u.panes)continue;const hide=u.id===key,was=u.id===a.hidden;if(hide||was){u.panes.setMatrixAt(u.index,hide?zero:u.matrix);u.panes.instanceMatrix.needsUpdate=true;}}a.hidden=key;}
}
function byId(scene,id){return scene.apartments?.list.find(b=>b.site.id===id)||null;}root.CityApartmentsLook={build,draw,dispose,byId,LOOK,materials,texture,Acc,hash,rng,palm,tinted};
})(typeof globalThis!=='undefined'?globalThis:this);
