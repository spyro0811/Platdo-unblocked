
/* The house PC keeps one shortcut per grid cell. Saved coordinates are normalized
   so a wide monitor can reflow onto a phone without stacking or losing icons. */
(function(root){
'use strict';
const wallpapers={
  range:{name:'High country',sky:['#406ca2','#a6c8de','#f7dfb3'],sun:'#f8ecc1',distant:'#68838f',ridge:'#415d6e',shore:'#203e48',trees:'#142e36'},
  dusk:{name:'Afterglow',sky:['#332659','#ab7897','#ffc794'],sun:'#ffdbab',distant:'#956c89',ridge:'#6b5978',shore:'#423d5a',trees:'#2b283f'},
  coast:{name:'Tideline',sky:['#437d83','#b3d5cf','#f0dcaf'],sun:'#fff0c1',distant:'#77a49b',ridge:'#45847d',shore:'#276763',trees:'#184744'},
  night:{name:'Night shift',sky:['#111c3b','#344969','#657a89'],sun:'#eef1dd',distant:'#495c79',ridge:'#354b67',shore:'#22394e',trees:'#152a3a'}
};
function makeWallpaper(id){
  const p=wallpapers[id],night=id==='night',coast=id==='coast';
  const peaks=coast?'0,396 152,362 244,373 402,309 513,340 670,303 797,350 946,302 1200,340':'0,363 110,324 198,346 345,228 421,287 526,200 620,279 707,249 770,296 923,188 1052,279 1123,247 1200,290';
  const stars=night?Array.from({length:90},(_,i)=>'<circle cx="'+(i*113%1199)+'" cy="'+(i*61%264)+'" r="'+(i%3===0?1.2:.7)+'" fill="#dbeafb"/>').join(''):'';
  let shoreline='';
  for(let i=0;i<38;i++){const x=(i*53)%1200,y=455+((i*13)%118);shoreline+='<path d="M'+x+' '+y+'h'+(5+i%11)+'" stroke="#fff" stroke-opacity=".12" />';}
  let forest='';
  const ground=[[0,596],[150,621],[320,667],[540,704],[603,720],[821,720],[977,682],[1100,633],[1200,604]];
  for(let i=0;i<94;i++){
    const x=i*13;if(x>530&&x<885||x>1200)continue;
    const k=ground.findIndex(q=>q[0]>x),a=ground[k-1],b=ground[k];if(!a||!b)continue;
    const y=a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])+13,h=12+(i*17%36);
    forest+='<path d="M'+x+' '+y+'l'+h/4+' -'+h+' '+h/4+' '+h+'Z" fill="'+p.trees+'"/>';
  }
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><defs><linearGradient id="s" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="'+p.sky[0]+'"/><stop offset=".65" stop-color="'+p.sky[1]+'"/><stop offset="1" stop-color="'+p.sky[2]+'"/></linearGradient><linearGradient id="w" x2="0" y2="1"><stop stop-color="'+p.sky[1]+'"/><stop offset="1" stop-color="'+p.shore+'"/></linearGradient></defs><rect width="1200" height="720" fill="url(#s)"/>'+stars+'<circle cx="913" cy="167" r="49" fill="'+p.sun+'"/><polygon points="'+peaks+' 1200,470 0,470" fill="'+p.distant+'"/><path d="M0 454V294l183 52 114 54 168 15 125-57 108-7 103-46 118 38 133-48 148-8v169Z" fill="'+p.ridge+'"/><path d="M0 405c190 1 240-34 417-9s219 24 428 7 256-28 355-13v330H0Z" fill="url(#w)"/>'+shoreline+'<path d="M0 481c154 37 268 65 438 66 94 1 134 36 226 52-90 24-227 41-279 77H0Z" fill="'+p.shore+'"/><path d="M1200 463c-107 23-136 66-229 86l-147 25c76 18 173 30 233 58h143Z" fill="'+p.shore+'"/>'+forest+'<path d="M0 585c123 7 169 71 312 75s216 31 304 60H0ZM1200 591c-104 4-154 58-227 75l-156 54h383Z" fill="'+p.trees+'"/></svg>';
  const facets=coast?'':'<g fill="#fff" opacity=".26"><path d="m345 228-23 21 12-4 8 4 4-10 12 7Zm181-28-42 37 21-11 4 6 15-17 16 8 18 3Zm397-12-32 31 17-5 11-11 8 10 13-3z"/></g>';
  const clouds=night?'':'<g fill="#fff" opacity=".23"><path d="M58 130q45-20 91-10 33-21 92-10 50 1 94 9-85-2-165 10zM614 99q40-15 77-10 28-9 69 3-79 4-146 7ZM875 70q60-13 94-6 44-11 97 2-75 0-191 4z"/></g>';
  const art=svg.replace('<circle cx="913"',clouds+'<circle cx="913"').replace('<path d="M0 454',facets+'<path d="M0 454');
  return 'url("data:image/svg+xml,'+encodeURIComponent(art)+'")';
}
const backgrounds=Object.fromEntries(Object.keys(wallpapers).map(id=>[id,makeWallpaper(id)]));
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const customImage=v=>typeof v==='string'&&v.length<=300000&&/^data:image\/jpeg;base64,[a-zA-Z0-9+/]+=*$/.test(v);
function preferences(raw,ids){
  const image=customImage(raw?.image)?raw.image:null;
  const wallpaper=Object.hasOwn(wallpapers,raw?.wallpaper)||raw?.wallpaper==='personal'&&image?raw.wallpaper:'range';
  const places={};for(const id of ids){
    const xy=raw?.places?.[id];
    if(Array.isArray(xy)&&xy.length===2&&xy.every(v=>Number.isFinite(v)&&v>=0&&v<=1))places[id]=[xy[0],xy[1]];
  }
  return {wallpaper,image,places};
}
function grid(width,height,count){
  let columns=Math.max(1,Math.floor(width/86)),rows=Math.max(1,Math.floor(height/79));
  while(columns*rows<count){if(width/columns>=height/rows)columns++;else rows++;}
  return {columns,rows,width:width/columns,height:height/rows};
}
function place(ids,places,g){
  const result={},used=new Set();
  const available=(x,y)=>!used.has(x+','+y);
  const claim=(id,x,y)=>{result[id]={x,y};used.add(x+','+y);};
  for(const id of ids)if(places[id]){
    const x=Math.round(places[id][0]*(g.columns-1)),y=Math.round(places[id][1]*(g.rows-1));
    if(available(x,y))claim(id,x,y);
  }
  for(const id of ids)if(!result[id]){
    const pref=places[id];
    let best,score=Infinity;
    for(let x=0;x<g.columns;x++)for(let y=0;y<g.rows;y++){
      if(!available(x,y))continue;
      const distance=pref?Math.abs(x-pref[0]*(g.columns-1))+Math.abs(y-pref[1]*(g.rows-1)):0;
      if(distance<score){best={x,y};score=distance;}
    }
    claim(id,best.x,best.y);
  }
  return result;
}
function move(prefs,layout,id,x,y,g){
  const old=layout[id];if(!old||old.x===x&&old.y===y)return false;
  const other=Object.keys(layout).find(key=>layout[key].x===x&&layout[key].y===y);
  const save=(i,c,r)=>{prefs.places[i]=[c/Math.max(1,g.columns-1),r/Math.max(1,g.rows-1)];};
  if(other)save(other,old.x,old.y);save(id,x,y);return true;
}
async function loadPicture(file){
  if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG or WebP picture.');
  if(file.size>12*1024*1024)throw Error('Choose a picture smaller than 12 MB.');
  const img=new Image(),url=URL.createObjectURL(file);
  try{
    img.src=url;await img.decode();
    const scale=Math.min(1,1120/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const c=canvas.getContext('2d');c.fillStyle='#172a40';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(img,0,0,canvas.width,canvas.height);
    for(const quality of [.78,.62,.44,.30]){const image=canvas.toDataURL('image/jpeg',quality);if(image.length<=300000)return image;}
    throw Error('This picture has too much detail. Try a smaller image.');
  }finally{URL.revokeObjectURL(url);}
}
function saveKey(sim){
  const scope=sim.onlineRoom?'room:'+(root.PlatdoAccount?.getState?.()?.user?.uid||sim.homeInstance?.ownerId||sim.profile.id):sim.profile.mode;
  return 'computer:desktop:'+scope;
}
function read(storage,key){try{return JSON.parse(storage.get(key)||'{}')||{};}catch(_){return {};}}
const glyphImages=new Map();
function glyph(app){
  if(glyphImages.has(app))return glyphImages.get(app);
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="32" height="32" fill="none" stroke="#182c33" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">'+app.mark+'</svg>';
  const image=new Image();image.src='data:image/svg+xml,'+encodeURIComponent(svg);
  const promise=image.decode().then(()=>image);glyphImages.set(app,promise);return promise;
}
class Monitor {
  constructor(T,group,face){
    this.canvas=document.createElement('canvas');this.canvas.width=512;this.canvas.height=288;
    this.context=this.canvas.getContext('2d');this.map=new T.CanvasTexture(this.canvas);this.map.colorSpace=T.SRGBColorSpace;
    const material=new T.MeshBasicMaterial({map:this.map,toneMapped:false,side:T.DoubleSide});
    this.mesh=new T.Mesh(new T.PlaneGeometry(face.w,face.h),material);this.mesh.name='Home PC display';
    // The house root mirrors local X. Unmirror the screen so text reads like the monitor beside the desk.
    this.mesh.scale.x=-1;this.mesh.rotation.y=face.ry||0;
    this.mesh.position.set(face.x+Math.sin(this.mesh.rotation.y)*.01,face.y+face.h/2,face.z+Math.cos(this.mesh.rotation.y)*.01);
    group.add(this.mesh);this.serial=0;this.dirty=true;this.events=new AbortController();
    const invalidate=()=>{this.dirty=true;};
    for(const e of ['platdo:citydesktopchange','platdo:accountchange','platdo:beforereset'])root.addEventListener(e,invalidate,{signal:this.events.signal});
    this.clear();
  }
  clear(){this.context.fillStyle='#203c50';this.context.fillRect(0,0,512,288);this.map.needsUpdate=true;delete this.mesh.userData.wallpaper;}
  update(sim){
    if(this.sim===sim&&!this.dirty)return;
    this.sim=sim;this.dirty=false;
    if(!root.CityHomeComputer||!root.Platdo)return;
    const apps=root.CityHomeComputer.apps,ids=Object.keys(apps),key=saveKey(sim);
    const owner=root.PlatdoAccount?.getState?.()?.user?.uid||'guest';
    let raw=null;try{raw=root.Platdo.storage('platdo-city').get(key);}catch(_){}
    if(this.owner===owner&&this.key===key&&this.raw===raw)return;
    this.owner=owner;this.key=key;this.raw=raw;const serial=++this.serial;this.clear();
    let input;try{input=JSON.parse(raw);}catch(_){}const prefs=preferences(input,ids);
    const image=new Image();
    image.src=prefs.wallpaper==='personal'?prefs.image:backgrounds[prefs.wallpaper].slice(5,-2);
    Promise.all([image.decode(),...ids.map(id=>glyph(apps[id]))]).then(([, ...icons])=>{
      if(serial!==this.serial)return;
      const c=this.context,w=512,h=271,k=Math.max(w/image.naturalWidth,h/image.naturalHeight);
      c.drawImage(image,(w-image.naturalWidth*k)/2,(h-image.naturalHeight*k)/2,image.naturalWidth*k,image.naturalHeight*k);
      const g=grid(1040,580,ids.length),slots=place(ids,prefs.places,g);
      c.textAlign='center';c.font='6px sans-serif';
      for(let i=0;i<ids.length;i++){const id=ids[i],p=slots[id],x=4+(p.x+.5)*(w-8)/g.columns,y=4+(p.y+.5)*(h-8)/g.rows;
        c.fillStyle=apps[id].color;c.fillRect(x-7,y-10,14,14);c.drawImage(icons[i],x-6,y-9,12,12);
        c.fillStyle='#fff';c.shadowColor='#24384b';c.shadowBlur=2;c.fillText(apps[id].name,x,y+11);c.shadowBlur=0;}
      c.fillStyle='#e3edf4';c.fillRect(0,h,w,17);c.fillStyle='#237cbc';
      for(const x of [6,10])for(const y of [h+5,h+9])c.fillRect(x,y,3,3);
      c.fillStyle='#34445c';c.textAlign='left';c.font='7px sans-serif';c.fillText('Start',16,h+12);c.fillText('Settings',45,h+12);
      this.map.needsUpdate=true;this.mesh.userData.wallpaper=prefs.wallpaper;this.mesh.userData.slots=slots;
    }).catch(()=>{if(serial===this.serial)this.clear();});
  }
  dispose(){this.serial++;this.events.abort();this.mesh.removeFromParent();this.mesh.geometry.dispose();this.mesh.material.dispose();this.map.dispose();}
}
root.CityDesktopLayout={wallpapers,backgrounds,preferences,grid,place,move,loadPicture,clamp,saveKey,read,Monitor};
})(window);

