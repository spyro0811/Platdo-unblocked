
/* PLATDO City phone: the screen on the phone in your hand (V5.5). Game only. Loaded after the phone look.
 * The phone panel at the side of the screen is ordinary page content. This copies what it shows onto the 3D
 * phone the character holds: the panel's own markup and styles are drawn into a picture (an SVG snapshot), the
 * picture goes onto a small canvas, and that canvas is the texture of a screen laid on the phone model.
 * Live things (the camera view, a playing video) are drawn onto the canvas several times a second.
 * It is redrawn only when the panel changes. Other people's phones keep their painted screen. */
(function(root){'use strict';
const Phone=root.CityPhone?.Phone;if(!Phone||typeof document==='undefined')return;
const M={canvas:null,ctx:null,texture:null,material:null,mesh:null,dirty:true,busy:false,last:0,image:null,under:[],over:[],observer:null,watched:null,css:'',cssSheets:-1,urls:new Map(),failed:0,holdUntil:0,livePaint:0,snapshots:0};
const BLANK='assets/images/bb229a48bee31f5d54ca.gif';
// ---- the styles the snapshot needs: every rule written for the City, read once per change of the page's sheets
function cssText(){
 if(M.css&&M.cssSheets===document.styleSheets.length)return M.css;const keep=[],marker=/cityRoot|platdo-os|cityPhone/;
 const take=rules=>{for(const r of rules){if(r.type===7)continue;/* media rules count only when they apply to the real page, never to the small snapshot */if(r.type===4){let on=false;try{on=root.matchMedia(r.conditionText||r.media.mediaText).matches;}catch(e){}if(on)take(r.cssRules);continue;}const t=r.cssText;if(marker.test(t))keep.push(t);else if(r.selectorText&&/^(:root|html|body)\b/.test(r.selectorText)&&t.includes('--'))keep.push(t);}};
 for(const sheet of document.styleSheets){let rules;try{rules=sheet.cssRules;}catch(e){continue;}take(rules);}
 M.css=keep.join('\n').replace(/]]>/g,'');M.cssSheets=document.styleSheets.length;return M.css;}
// ---- pictures inside the panel must travel inside the snapshot, so they are turned into data URLs (kept for reuse)
const scratch=document.createElement('canvas');
function pictureOf(source,key,max=200){const have=key&&M.urls.get(key);if(have)return have;const w=source.naturalWidth||source.videoWidth||source.width,h=source.naturalHeight||source.videoHeight||source.height;if(!w||!h)return null;const k=Math.min(1,max/Math.max(w,h));scratch.width=Math.max(2,Math.round(w*k));scratch.height=Math.max(2,Math.round(h*k));try{scratch.getContext('2d').drawImage(source,0,0,scratch.width,scratch.height);const url=scratch.toDataURL('image/jpeg',.72);if(key){if(M.urls.size>260)M.urls.clear();M.urls.set(key,url);}return url;}catch(e){return null;}}
const blobUrl=blob=>new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>resolve(null);reader.readAsDataURL(blob);});
async function wallpaperUrl(phone){const id=phone.data.wallpaper;if(!String(id||'').startsWith('media-'))return null;const key='wall:'+id;if(M.urls.has(key))return M.urls.get(key);const record=phone.media.find(m=>m.id===id&&!m.deletedAt);if(!record)return null;const url=await blobUrl(record.thumbnail instanceof Blob?record.thumbnail:record.blob);if(url)M.urls.set(key,url);return url;}
// ---- one snapshot of the panel as an image
async function snapshot(phone){
 const host=phone.ctx.container,os=host.querySelector('.platdo-os'),screen=os?.querySelector('.os-screen');if(!os||!screen)return null;
 const o=os.getBoundingClientRect(),s=screen.getBoundingClientRect();if(o.width<50||s.width<50)return null;const sx=s.left-o.left,sy=s.top-o.top,camera=phone.page==='camera',under=[],over=[];
 const owner=new Map(),jobs=[];for(const[key,url]of phone.urls||[]){const record=phone.media.find(x=>x.id===key.replace(/:thumb$/,''));if(record)owner.set(url,record.thumbnail instanceof Blob?record.thumbnail:record.type==='photo'?record.blob:null);}
 const clone=os.cloneNode(true),from=os.querySelectorAll('canvas,img,video,input,textarea,select'),to=clone.querySelectorAll('canvas,img,video,input,textarea,select');
 for(let i=0;i<from.length&&i<to.length;i++){const a=from[i],b=to[i],tag=a.tagName,r=a.getBoundingClientRect(),place={x:r.left-s.left,y:r.top-s.top,w:r.width,h:r.height};
  if(tag==='CANVAS'){const live=a===phone.cameraCanvas,box=document.createElement(live?'div':'img');if(!live)box.className=b.getAttribute('class')||'';box.setAttribute('style','display:block;width:'+r.width+'px;height:'+r.height+'px'+(live?';background:transparent':''));
   if(a===phone.cameraCanvas){const view=a.closest('.pcam-view'),v=view?view.getBoundingClientRect():r;under.push({el:a,x:v.left-s.left,y:v.top-s.top,w:v.width,h:v.height,fit:'cover',mirror:!!view?.classList.contains('selfie')});}else{let url=null;try{url=a.toDataURL('image/jpeg',.8);}catch(e){}box.setAttribute('src',url||BLANK);}b.replaceWith(box);}
  else if(tag==='IMG'){const src=a.currentSrc||a.src||'';b.removeAttribute('loading');if(src.startsWith('blob:')){const url=M.urls.get(src)||(a.complete&&a.naturalWidth?pictureOf(a,src,r.width>200?480:180):null);if(url)b.setAttribute('src',url);else{b.setAttribute('src',BLANK);const saved=owner.get(src);if(saved)jobs.push(blobUrl(saved).then(u=>{if(!u)return;if(M.urls.size>260)M.urls.clear();M.urls.set(src,u);b.setAttribute('src',u);}));}}}
  else if(tag==='VIDEO'){const box=document.createElement('img');box.className=b.getAttribute('class')||'';box.setAttribute('style','display:block;width:'+r.width+'px;height:'+r.height+'px;object-fit:contain');box.setAttribute('src',(a.readyState>=2?pictureOf(a,null,480):null)||BLANK);b.replaceWith(box);if(!a.paused&&!a.ended)over.push({el:a,...place,fit:'contain'});}
  else if(tag==='TEXTAREA')b.textContent=a.value;
  else if(tag==='SELECT'){const options=b.querySelectorAll('option');options.forEach((opt,k)=>{if(k===a.selectedIndex)opt.setAttribute('selected','');else opt.removeAttribute('selected');});}
  else if(a.type!=='file'&&a.type!=='password')b.setAttribute('value',a.value);}
 // where the panel is scrolled, the copy is shifted by the same amount
 const scrolledFrom=[os.querySelector('.os-content'),...os.querySelectorAll('.pp-scroll,.pp-adjlist,.pp-filters,.pl-walls,.pcam-seg.scroll,.os-market-tabs')],scrolledTo=[clone.querySelector('.os-content'),...clone.querySelectorAll('.pp-scroll,.pp-adjlist,.pp-filters,.pl-walls,.pcam-seg.scroll,.os-market-tabs')];
 for(let i=0;i<scrolledFrom.length&&i<scrolledTo.length;i++){const a=scrolledFrom[i],b=scrolledTo[i];if(!a||!b||!(a.scrollTop||a.scrollLeft))continue;const first=a.firstElementChild,target=b.firstElementChild;if(!first||!target)continue;const cs=getComputedStyle(first);target.style.marginTop=((parseFloat(cs.marginTop)||0)-a.scrollTop)+'px';if(a.scrollLeft)target.style.marginLeft=((parseFloat(cs.marginLeft)||0)-a.scrollLeft)+'px';b.style.overflow='hidden';}
 if(jobs.length)await Promise.all(jobs);
 // a photo used as wallpaper
 const wall=await wallpaperUrl(phone);let style=clone.getAttribute('style')||'';if(/url\(["']?blob:/.test(style))style=style.replace(/url\(["']?blob:[^)]*\)/g,wall?'url("'+wall+'")':'none');clone.setAttribute('style',style);
 const W=Math.round(s.width),H=Math.round(s.height),rootEl=document.getElementById('cityRoot'),fix='#cityRoot{position:relative!important;inset:auto!important;left:0!important;top:0!important;width:'+o.width+'px!important;height:'+o.height+'px!important;background:none!important;display:block!important;overflow:hidden!important;transform:none!important}#cityRoot .platdo-os{position:absolute!important;left:0!important;top:0!important;right:auto!important;bottom:auto!important;width:'+o.width+'px!important;height:'+o.height+'px!important;animation:none!important;transform:none!important;margin:0!important}#cityRoot .platdo-os *{animation:none!important;transition:none!important;caret-color:transparent!important}'+(camera?'#cityRoot .platdo-os,#cityRoot .platdo-os :is(.os-screen,.os-content,.os-status,.os-home-bar,.pcam,.pcam-stage,.pcam-view,.pcam-host){background:transparent!important}':'');
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="'+sx+' '+sy+' '+s.width+' '+s.height+'"><foreignObject x="0" y="0" width="'+o.width+'" height="'+o.height+'"><div xmlns="http://www.w3.org/1999/xhtml" id="cityRoot" class="'+String(rootEl?.className||'').replace(/["<>&]/g,'')+'"><style><![CDATA['+cssText()+fix+']]></style>'+new XMLSerializer().serializeToString(clone)+'</div></foreignObject></svg>';
 const image=new Image();const ok=await new Promise(resolve=>{image.onload=()=>resolve(true);image.onerror=()=>resolve(false);image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);});
 return ok?{image,W,H,under,over,camera}:null;}
// ---- the canvas that is the phone's screen
function paint(check){const g=M.ctx,c=M.canvas;if(!g||M.blocked)return;g.setTransform(1,0,0,1,0,0);g.fillStyle='#05070a';g.fillRect(0,0,c.width,c.height);
 const draw=l=>{const el=l.el,sw=el.videoWidth||el.width,sh=el.videoHeight||el.height;if(!sw||!sh||!el.isConnected)return;const k=l.fit==='contain'?Math.min(l.w/sw,l.h/sh):Math.max(l.w/sw,l.h/sh),dw=sw*k,dh=sh*k;g.save();g.beginPath();g.rect(l.x,l.y,l.w,l.h);g.clip();if(l.mirror){g.translate(l.x*2+l.w,0);g.scale(-1,1);}try{g.drawImage(el,l.x+(l.w-dw)/2,l.y+(l.h-dh)/2,dw,dh);}catch(e){}g.restore();};
 for(const l of M.under)draw(l);if(M.image){try{g.drawImage(M.image,0,0,c.width,c.height);}catch(e){}}for(const l of M.over)draw(l);
 /* a new picture is tested once: reading a pixel fails if this browser will not let the snapshot be used as a texture. Then a fresh canvas with a plain screen takes over and no more snapshots are made. */
 if(check){try{g.getImageData(0,0,1,1);}catch(e){M.blocked=true;M.image=null;M.under=[];M.over=[];M.canvas=document.createElement('canvas');M.canvas.width=324;M.canvas.height=690;M.ctx=M.canvas.getContext('2d');M.texture.image=M.canvas;return false;}}
 M.texture.needsUpdate=true;M.redraw?.();return true;}
function fallback(phone){const g=M.ctx,c=M.canvas;if(!g)return;M.redraw?.();const grad=g.createLinearGradient(0,0,c.width,c.height);grad.addColorStop(0,'#3977c4');grad.addColorStop(1,'#101b3e');g.fillStyle=grad;g.fillRect(0,0,c.width,c.height);g.fillStyle='#fff';g.textAlign='center';/* V11.1: the 12-hour time is wider; it is made smaller if it would not fit */{const t=phone.time();g.font='700 84px system-ui,sans-serif';const tw=g.measureText(t).width,fit=Math.min(84,Math.floor(84*c.width*.86/Math.max(1,tw)));g.font='700 '+fit+'px system-ui,sans-serif';g.fillText(t,c.width/2,190);}M.texture.needsUpdate=true;}
function ensure(phone){
 const scene=phone.ctx.scene?.(),rig=scene?.playerMesh?.userData?.rig,body=rig?.propRoot?.getObjectByName?.('phone-body'),T=scene?.T;if(!body||!T)return null;
 if(!M.canvas){M.canvas=document.createElement('canvas');M.canvas.width=324;M.canvas.height=690;M.ctx=M.canvas.getContext('2d',{willReadFrequently:false});}
 if(!M.texture){M.texture=new T.CanvasTexture(M.canvas);if(T.SRGBColorSpace!==undefined&&'colorSpace' in M.texture)M.texture.colorSpace=T.SRGBColorSpace;else if(T.sRGBEncoding!==undefined)M.texture.encoding=T.sRGBEncoding;M.texture.anisotropy=4;M.material=new T.MeshBasicMaterial({map:M.texture,toneMapped:false});M.mesh=new T.Mesh(new T.PlaneGeometry(.0664,.1414),M.material);M.mesh.name='phone-screen-live';M.mesh.rotation.y=Math.PI;M.mesh.position.set(0,0,-.00495);M.mesh.userData.dynamic=true;fallback(phone);}
 if(M.mesh.parent!==body)body.add(M.mesh);return M.mesh;}
function watch(phone){const host=phone.ctx.container;if(M.watched===host||typeof MutationObserver==='undefined')return;M.observer?.disconnect();M.observer=new MutationObserver(()=>{M.dirty=true;});M.observer.observe(host,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','value','src','aria-pressed','disabled']});/* pictures and sliders change without changing the markup */host.addEventListener('load',()=>{M.dirty=true;},true);host.addEventListener('input',()=>{M.dirty=true;},true);host.addEventListener('scroll',()=>{M.dirty=true;},true);M.watched=host;}
function step(phone){
 if(!phone.active){if(M.mesh)M.mesh.visible=false;return;}M.redraw=phone.ctx.redraw;const now=performance.now();if(now<M.settleUntil)M.redraw?.();const mesh=ensure(phone);if(!mesh)return;if(!mesh.visible){mesh.visible=true;M.redraw?.();}watch(phone);
 if(M.blocked){if(M.dirty&&now-M.last>1000){M.dirty=false;M.last=now;fallback(phone);}return;}
 if(M.dirty&&!M.busy&&now-M.last>230&&now>M.holdUntil){M.dirty=false;M.busy=true;M.last=now;
  snapshot(phone).then(shot=>{if(!shot){M.failed++;if(M.failed>=3){M.holdUntil=performance.now()+5000;M.failed=0;if(!M.image)fallback(phone);}return;}M.failed=0;M.snapshots++;if(M.canvas.width!==shot.W||M.canvas.height!==shot.H){M.canvas.width=shot.W;M.canvas.height=shot.H;}M.image=shot.image;M.under=shot.under;M.over=shot.over;if(paint(true)===false)fallback(phone);}).catch(()=>{M.failed++;}).finally(()=>{M.busy=false;});}
 if((M.under.length||M.over.length)&&now-M.livePaint>66){M.livePaint=now;paint(false);}}
// ---- hooks into the phone
const baseShell=Phone.prototype.shell;Phone.prototype.shell=function(content,title,legacy){const out=baseShell.call(this,content,title,legacy);M.dirty=true;M.settleUntil=performance.now()+900;return out;};
const baseTick=Phone.prototype.tick;Phone.prototype.tick=function(dt){const out=baseTick.call(this,dt);try{step(this);}catch(e){M.failed++;}return out;};
const baseClose=Phone.prototype.close;Phone.prototype.close=function(){if(M.mesh)M.mesh.visible=false;M.dirty=true;M.under=[];M.over=[];return baseClose.call(this);};
root.CityPhoneMirror={state:M,snapshot,paint,cssText};
})(typeof window!=='undefined'?window:globalThis);
