
/* PLATDO City phone: the Camera app (V5.3). Game only.
 * A new interface on the phone's existing camera engine (the engine renders the real game world into a canvas,
 * saves photos as real images and records real video with MediaRecorder). This file adds:
 *   two modes only (PHOTO, VIDEO), flash menu, a controls panel (exposure, timer, shape, grid, quality),
 *   tap to focus with an exposure slider, zoom steps with smooth change, pinch and wheel zoom, the shutter and
 *   record buttons, a still photo during recording, the last-capture thumbnail and the camera switch.
 * Photos are taken at a higher size than the live view. Everything saved carries the date, the size, the
 * district it was taken in and a file name. Nothing of the interface is in the saved picture.
 * Shared drawing helpers for the two phone apps (icons) live here too: CityPhoneKit. */
(function(root){'use strict';
const Phone=root.CityPhone?.Phone;if(!Phone||typeof document==='undefined')return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// ---- line icons: one weight, one size, drawn on a 24 grid ---------------------------------------------------
const PATHS={
 flash:'M13 2 5 13.5h6L10 22l9-12.5h-6L13 2Z',chevron:'m6 9 6 6 6-6',chevronUp:'m6 15 6-6 6 6',back:'m15 5-7 7 7 7',close:'M6 6l12 12M18 6 6 18',
 controls:'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',timer:'M12 8v5l3 2M9 2h6M12 5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z',grid:'M4 4h16v16H4zM9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16',
 ratio:'M4 6h16v12H4zM8 10v4M16 10v4',sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8',
 switchCam:'M4 8.5h3l1.6-2.3h6.8L17 8.5h3v10H4zM9 13a3 3 0 0 1 5.5-1.6M15 14a3 3 0 0 1-5.5 1.6M14.6 9.6v1.9h-1.9M9.4 17.4v-1.9h1.9',
 heart:'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z',trash:'M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13M10.5 10.5v6M13.5 10.5v6',
 share:'M12 15V3M8 6.5 12 3l4 3.5M6 11H5v9h14v-9h-1',edit:'M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4',info:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 11v6M12 7.6v.4',
 play:'M8 5.5v13l11-6.5-11-6.5Z',pause:'M8 5v14M16 5v14',volume:'M4 10v4h3.5L12 18V6L7.5 10H4ZM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',mute:'M4 10v4h3.5L12 18V6L7.5 10H4ZM16 9.5l5 5M21 9.5l-5 5',
 search:'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM15.5 15.5 20 20',library:'M4 5h16v14H4zM4 15l4.5-4.5 4 4L15 12l5 5M15.5 8.5h.01',collections:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
 more:'M6 12h.01M12 12h.01M18 12h.01',check:'m5 12.5 4.5 4.5L19 7.5',plus:'M12 5v14M5 12h14',crop:'M7 3v14h14M3 7h14v14',rotate:'M5 9a7.5 7.5 0 1 1-1 5M5 4v5h5',flip:'M12 3v18M9 7 4 12l5 5V7ZM15 7l5 5-5 5V7Z',
 filters:'M9 9a5 5 0 1 0 0 .01ZM15 9a5 5 0 1 0 0 .01ZM12 15a5 5 0 1 0 0 .01Z',wand:'M5 19 16 8M14 4v3M12.5 5.5h3M19 9v3M17.5 10.5h3M8 4v2M7 5h2',video:'M4 7h11v10H4zM15 10.5 20 8v8l-5-2.5',album:'M5 4h11l3 3v13H5zM9 4v6h6V4',
 download:'M12 4v11M8 11.5l4 4 4-4M5 20h14',copy:'M9 9h10v11H9zM5 15V4h10',restore:'M4 12a8 8 0 1 0 2.6-5.9M4 5v4.5h4.5',pin:'M12 21s6-5.6 6-10.5a6 6 0 1 0-12 0C6 15.4 12 21 12 21ZM12 8.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
 wallpaper:'M5 4h14v16H5zM5 15l4-4 3 3 3-3 4 4',
 exposure:'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM7.5 9h4M9.5 7v4M13 15.5h4M18 6 6 18',contrast:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 3v18M12 7.5h7.8M12 12h9M12 16.5h7.8',
 highlights:'M3 18h18M6 18a6 6 0 0 1 12 0M12 5v3M4.5 9.5l2 2M19.5 9.5l-2 2',shadows:'M3 6h18M6 6a6 6 0 0 0 12 0M12 16v3M5 14.5l2-1.5M19 14.5l-2-1.5',drop:'M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z',
 vibrance:'M12 4 21 19H3L12 4ZM12 10.5l4 6.5H8l4-6.5Z',warmth:'M10 5a2 2 0 0 1 4 0v8.6a4 4 0 1 1-4 0V5ZM12 10v7',sharp:'M12 4 21 19H3L12 4Z',frame:'M4 4h16v16H4zM7.5 7.5h9v9h-9z'};
const ic=(name,size=22,fill=false)=>`<svg class="pk-ic" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path d="${PATHS[name]||''}" fill="${fill?'currentColor':'none'}" stroke="currentColor" stroke-width="${fill?1:1.8}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const Kit=root.CityPhoneKit={ic,esc,PATHS,
 /* how much room the browser has left for this site: low under 60 MB free or over 92 percent used */space:async()=>{try{const e=await navigator.storage?.estimate?.();if(!e||!e.quota)return null;const free=Math.max(0,e.quota-(e.usage||0));return{free,quota:e.quota,usage:e.usage||0,low:free<60*1048576||(e.usage||0)/e.quota>.92};}catch(_){return null;}},pad:(n,l=2)=>String(n).padStart(l,'0'),place(sim){try{return sim.world.districtAt(sim.player.x,sim.player.z)?.name||'Platdo Bay';}catch(e){return'Platdo Bay';}},
 /* file names count up per save: PLATDO_0001.JPG */fileName(phone,type,blob){let top=Kit.seq|0;for(const m of phone.media||[]){const n=/^PLATDO_(\d+)\./.exec(m.name||'');if(n)top=Math.max(top,Number(n[1]));}Kit.seq=top+1;const ext=type==='photo'?'JPG':/mp4/.test(blob?.type||'')?'MP4':'WEBM';return'PLATDO_'+String(Kit.seq).padStart(4,'0')+'.'+ext;}};
// ---- settings kept with the phone ---------------------------------------------------------------------------
const RATIOS={'4:3':3/4,'16:9':9/16,'1:1':1},QUALITIES=[['hd30','HD','30',720,30],['hd60','HD','60',720,60],['fhd30','1080p','30',1080,30],['fhd60','1080p','60',1080,60]];
/* shape, grid and video quality are remembered in the browser: the save file keeps only the phone settings it knows */
const store=()=>{try{return root.Platdo?.storage?.('platdo-city')||null;}catch(e){return null;}};
const FX=root.CityCameraEffects||{frames:['None'],filters:['None']},shortName=v=>({'Warm sunset':'Warm','Cool night':'Cool','Monochrome':'Mono','Clean postcard':'Postcard','Comic border':'Comic','Racing-event card':'Racing','Minimal Platdo photo card':'Minimal','Travel-stamp border':'Stamp','Instant-print border':'Instant'}[v]||v);
function cam(phone){const s=phone.settings;if(!s.camera||typeof s.camera!=='object'){let kept=null;try{kept=JSON.parse(store()?.get('phoneCamera')||'null');}catch(e){}s.camera=kept&&typeof kept==='object'?kept:{};}const c=s.camera;if(!RATIOS[c.ratio])c.ratio='4:3';c.grid=!!c.grid;if(!QUALITIES.some(q=>q[0]===c.video))c.video='hd30';
 phone.cx??={exposure:0,panel:false,flashMenu:false,zoomT:phone.zoom||1,focus:null,shotUntil:0,pinch:null};return c;}
// Which video sizes this device can really record: the live view is drawn at the size it is recorded at.
function qualities(phone){const scene=phone.ctx.scene(),rate=Number(root.Platdo?.frameRate)||60,tall=Math.max(scene?.canvas?.height||0,scene?.canvas?.width||0);return QUALITIES.filter(q=>(q[4]<=30||rate>=60)&&(q[3]<=720||tall>=1000));}
const keep=phone=>{try{store()?.set('phoneCamera',JSON.stringify(cam(phone)));}catch(e){}};
const baseSize=Phone.prototype.size;
Phone.prototype.size=function(){if(this.page!=='camera')return baseSize.call(this);const c=cam(this),ratio=RATIOS[c.ratio],q=QUALITIES.find(k=>k[0]===c.video)||QUALITIES[0];
 /* the short side: the live view and video use the chosen quality, a photo is taken larger */let short=this.cx.hiRes?1200:this.mode==='video'?q[3]:600;if(this.mode==='video'&&!qualities(this).some(k=>k[0]===q[0]))short=720;
 const width=Math.round(short/2)*2,height=Math.round(width/ratio/2)*2;return{width,height};};
const baseRenderCamera=Phone.prototype.renderCamera;
/* exposure is applied to the finished frame (the camera draws into its own picture, which the screen's tone settings do not reach): brighter is an exact gain, darker a multiply. It is in the live view, the photo and the video alike. */
Phone.prototype.renderCamera=function(){if(!this.cameraActive)return;const out=baseRenderCamera.call(this),e=this.cx?.exposure;if(e){const cv=this.cameraCanvas,g=cv.getContext('2d'),k=Math.pow(2,e/1.6),v=Math.round(255*(e>0?1-1/k:k));g.save();g.globalCompositeOperation=e>0?'color-dodge':'multiply';g.fillStyle='rgb('+v+','+v+','+v+')';g.fillRect(0,0,cv.width,cv.height);g.restore();}return out;};
// ---- taking a photo -----------------------------------------------------------------------------------------
async function shoot(phone){
 if(phone.busy||!phone.cameraActive)return;phone.busy=true;const Media=root.CityPhoneMedia,epoch=Media.epoch,owner=Media.owner(phone.sim.profile.mode),sim=phone.sim,c=cam(phone);
 try{const dark=sim.dayTime<.25||sim.dayTime>.77;if(phone.flash==='on'||phone.flash==='auto'&&dark)phone.flashUntil=performance.now()+160;
  /* while a video is recording the picture is the frame being recorded; otherwise one larger frame is drawn for it */const live=!!phone.recorder,lens=phone.selfie?'Front camera':'Rear camera',zoom=Math.round(phone.zoom*10)/10,place=Kit.place(sim),ratio=c.ratio;if(!live)phone.cx.hiRes=true;phone.renderCamera();
  const canvas=phone.cameraCanvas,blob=await phone.blob(canvas,'image/jpeg',.92),t=document.createElement('canvas'),k=Math.min(1,320/Math.max(canvas.width,canvas.height));t.width=Math.round(canvas.width*k);t.height=Math.round(canvas.height*k);t.getContext('2d').drawImage(canvas,0,0,t.width,t.height);
  const thumbnail=await phone.blob(t,'image/jpeg',.78),width=canvas.width,height=canvas.height;if(!live){phone.cx.hiRes=false;phone.renderCamera();}
  if(epoch!==Media.epoch)return;const item=await Media.add({owner,type:'photo',blob,thumbnail,width,height,name:Kit.fileName(phone,'photo',blob),location:place,ratio,zoom,lens,flash:phone.flashUntil>performance.now()-200},epoch);if(!item)return;
  phone.cx.shotUntil=performance.now()+260;if(phone.settings.sounds){const a=phone.ctx.audio();a?.tone?.(2400,.018,.03*phone.settings.volume,'square','sfx',900);setTimeout(()=>a?.tone?.(1500,.03,.025*phone.settings.volume,'square','sfx',500),55);}
  phone.save();await phone.loadMedia();paint(phone);
 }catch(e){phone.cx.hiRes=false;phone.fail(e);}finally{phone.busy=false;}}
async function record(phone){const c=cam(phone);
 if(phone.recorder||phone.stopping){await phone.stopRecording();const newest=phone.media.find(m=>m.type==='video'&&!m.name);if(newest){try{await root.CityPhoneMedia.update(newest.id,{name:Kit.fileName(phone,'video',newest.blob),location:phone.cx.recPlace||Kit.place(phone.sim),ratio:phone.cx.recRatio||c.ratio,lens:phone.cx.recLens||(phone.selfie?'Front camera':'Rear camera'),quality:phone.cx.recLabel||''});phone.save();await phone.loadMedia();}catch(e){}}paint(phone);return;}
 const room=await Kit.space();if(room&&room.free<8*1048576){phone.ctx.toast('There is not enough space left to record a video. Delete some items in Photos first.');return;}
 const q=qualities(phone).find(k=>k[0]===c.video)||QUALITIES[0];phone.settings.videoQuality=q[4]>=60?'high':'medium';phone.cx.recPlace=Kit.place(phone.sim);phone.cx.recLabel=q[1]+' '+q[2];phone.cx.recLens=phone.selfie?'Front camera':'Rear camera';phone.cx.recRatio=c.ratio;
 try{await phone.startRecording();}catch(e){phone.fail(e);}paint(phone);}
// ---- the screen ---------------------------------------------------------------------------------------------
const STYLE=`
#cityPhone.pk-full .os-app-header{display:none!important}#cityPhone.pk-full .os-content{padding:0!important;background:#000;overflow:hidden!important}#cityPhone.pk-full .os-status{color:#fff;background:#000}#cityPhone.pk-full .os-home-bar{background:#000}
.pk-ic{display:block;flex:none}.pcam{position:absolute;inset:0;display:flex;flex-direction:column;background:#000;color:#fff;font:500 12px/1.2 -apple-system,"SF Pro Text","Segoe UI",system-ui,sans-serif;user-select:none;-webkit-user-select:none}
:where(.pcam) button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;min-width:0;min-height:0;box-shadow:none;border-radius:0;transition:none}
.pcam-top{height:44px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 14px;position:relative;z-index:3}
.pcam-round{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#ffffff1f;transition:transform .12s,background .2s}.pcam-round:active{transform:scale(.9)}.pcam-round.on{background:#ffd60a;color:#000}
.pcam-pill{padding:5px 10px;border-radius:14px;background:#0009;font-weight:600;letter-spacing:.4px;font-size:11px;display:flex;align-items:center;gap:6px}.pcam-pill.rec{background:#e5372b;font-variant-numeric:tabular-nums}.pcam-pill.warn{background:#ff9f0a;color:#000}.pcam-pill i{width:7px;height:7px;border-radius:50%;background:#fff;animation:pcamBlink 1s steps(2) infinite}
@keyframes pcamBlink{50%{opacity:.25}}
.pcam-stage{flex:1;min-height:0;display:grid;place-items:center;position:relative;overflow:hidden}
.pcam-view{position:relative;max-width:100%;max-height:100%;overflow:hidden;background:#05070a;border-radius:4px;transition:aspect-ratio .25s}.pcam-view canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;border-radius:0;aspect-ratio:auto;max-height:none;touch-action:none}
.pcam-view.selfie canvas{transform:scaleX(-1)}
.pcam-grid{position:absolute;inset:0;pointer-events:none;background:linear-gradient(#fff6,#fff6) 33.33% 0/1px 100% no-repeat,linear-gradient(#fff6,#fff6) 66.66% 0/1px 100% no-repeat,linear-gradient(#fff6,#fff6) 0 33.33%/100% 1px no-repeat,linear-gradient(#fff6,#fff6) 0 66.66%/100% 1px no-repeat}
.pcam-focus{position:absolute;width:64px;height:64px;margin:-32px 0 0 -32px;border:1.5px solid #ffd60a;pointer-events:none}.pcam-focus.in{animation:pcamFocus .32s ease-out}.pcam-focus:before,.pcam-focus:after{content:"";position:absolute;background:#ffd60a}.pcam-focus:before{left:50%;top:-1px;width:1.5px;height:6px}.pcam-focus:after{left:50%;bottom:-1px;width:1.5px;height:6px}
@keyframes pcamFocus{from{transform:scale(1.5);opacity:0}}
.pcam-sun{position:absolute;width:26px;height:120px;margin:-60px 0 0 44px;color:#ffd60a;display:grid;justify-items:center;touch-action:none;cursor:ns-resize}.pcam-sun:before{content:"";position:absolute;top:0;bottom:0;width:1.5px;background:#ffd60a99}.pcam-sun span{position:absolute;left:50%;transform:translate(-50%,-50%);background:#000a;border-radius:50%;padding:2px}
.pcam-count{position:absolute;inset:0;display:grid;place-items:center;font-size:96px;font-weight:200;text-shadow:0 2px 18px #000a;pointer-events:none}.pcam-count:empty{display:none}
.pcam-flashfx{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}.pcam-flashfx.go{animation:pcamShot .26s ease-out}@keyframes pcamShot{0%{opacity:.75}100%{opacity:0}}
.pcam-zoom{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);display:flex;gap:6px;padding:4px;border-radius:22px;background:#0007;backdrop-filter:blur(8px)}.pcam-zoom button{width:30px;height:30px;border-radius:50%;font-size:10.5px;font-weight:700;background:#0006;transition:transform .15s,background .15s,color .15s}.pcam-zoom button.on{background:#000b;color:#ffd60a;transform:scale(1.18)}
.pcam-panel{position:absolute;left:8px;right:8px;top:6px;z-index:4;padding:12px;border-radius:18px;background:#1c1c1ecc;backdrop-filter:blur(18px);display:grid;gap:11px}.pcam-panel.in{animation:pcamDrop .22s cubic-bezier(.2,.9,.3,1)}@keyframes pcamDrop{from{transform:translateY(-14px);opacity:0}}
.pcam-row{display:flex;align-items:center;gap:8px}.pcam-row>span:first-child{width:70px;color:#ffffffb0;font-size:11px;display:flex;align-items:center;gap:6px}.pcam-seg{display:flex;gap:5px;flex:1;flex-wrap:wrap}.pcam-seg button{flex:1;padding:6px 4px;border-radius:9px;background:#ffffff1c;font-size:11px;font-weight:600;white-space:nowrap}.pcam-seg button.on{background:#ffd60a;color:#000}.pcam-panel{grid-template-columns:minmax(0,1fr)}.pcam-row{min-width:0}.pcam-seg.scroll{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;min-width:0}.pcam-seg.scroll::-webkit-scrollbar{display:none}.pcam-seg.scroll button{flex:none;padding:6px 10px}
.pcam-row input[type=range]{flex:1;accent-color:#ffd60a;height:22px;margin:0}
.pcam-flashmenu{position:absolute;left:10px;top:42px;z-index:5;display:flex;gap:5px;padding:5px;border-radius:14px;background:#1c1c1ecc;backdrop-filter:blur(18px);animation:pcamDrop .18s ease-out}.pcam-flashmenu button{padding:6px 11px;border-radius:9px;font-weight:600;font-size:11px}.pcam-flashmenu button.on{background:#ffd60a;color:#000}
.pcam-modes{height:34px;flex:none;display:flex;justify-content:center;align-items:center;gap:22px;font-size:11.5px;font-weight:600;letter-spacing:1px;touch-action:pan-y}.pcam-modes button{color:#ffffffc8;padding:6px 4px;transition:color .2s,transform .2s}.pcam-modes button.on{color:#ffd60a;transform:scale(1.06)}
.pcam-bottom{height:92px;flex:none;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 22px 6px}
.pcam-thumb{width:44px;height:44px;border-radius:9px;overflow:hidden;background:#1c1c1e;display:grid;place-items:center;justify-self:start;border:1px solid #ffffff33;color:#ffffff80}.pcam-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.pcam-shutter{width:68px;height:68px;border-radius:50%;border:3.5px solid #fff;display:grid;place-items:center;transition:transform .1s}.pcam-shutter:active{transform:scale(.93)}.pcam-shutter b{display:block;width:54px;height:54px;border-radius:50%;background:#fff;transition:all .22s cubic-bezier(.3,1.3,.5,1)}
.pcam.video .pcam-shutter b{background:#e5372b}.pcam.rec .pcam-shutter b{width:26px;height:26px;border-radius:7px}.pcam-shutter.cancel b{background:#ffd60a}
.pcam-side{justify-self:end;display:flex;gap:10px;align-items:center}.pcam-still{width:40px;height:40px;border-radius:50%;border:2.5px solid #fff;display:grid;place-items:center}.pcam-still b{width:30px;height:30px;border-radius:50%;background:#fff;display:block}
.pcam-switch{width:44px;height:44px;border-radius:50%;background:#ffffff24;display:grid;place-items:center;transition:transform .35s}.pcam-switch.spin{transform:rotate(180deg)}
`;
// The phone styles every button from a rule with an id in it. The apps' rules are nested under the same id so they win;
// rules for the phone frame itself and the animations stay at the top level.
function style(){if(document.getElementById('pkPhoneStyle'))return;const css=STYLE+(root.CityPhotosStyle||''),top=[],inner=[];let depth=0,start=0;for(let i=0;i<css.length;i++){const ch=css[i];if(ch==='{')depth++;else if(ch==='}'){depth--;if(depth===0){const rule=css.slice(start,i+1).trim(),sel=rule.slice(0,rule.indexOf('{'));(sel.startsWith('@')||sel.includes('#cityPhone')||sel.includes('.platdo-os')?top:inner).push(rule);start=i+1;}}}
 const s=document.createElement('style');s.id='pkPhoneStyle';/* one class deeper than the phone's own button rule, so the plain-button reset beats it and the apps' own classes beat the reset */s.textContent=top.join('\n')+'\n#cityRoot .platdo-os .os-content{'+inner.join('\n')+'}';document.head.append(s);}
Kit.style=style;
function timeLabel(ms){const s=Math.floor(ms/1000);return Kit.pad(Math.floor(s/3600))+':'+Kit.pad(Math.floor(s/60)%60)+':'+Kit.pad(s%60);}
function render(phone){
 style();const keepX=phone.ctx.container.querySelector('.pcam-seg.scroll')?.scrollLeft||0,c=cam(phone),x=phone.cx,video=phone.mode==='video',rec=!!phone.recorder,q=qualities(phone).find(k=>k[0]===c.video)||QUALITIES[0],b=(a,html,cls='',extra='')=>`<button type="button" data-phone="${a}" class="${cls}" ${extra}>${html}</button>`;
 const last=phone.media.find(m=>!m.deletedAt),zooms=[.5,1,2,3],near=zooms.reduce((a,v)=>Math.abs(v-x.zoomT)<Math.abs(a-x.zoomT)?v:a,1);
 const panel=x.panel?`<div class="pcam-panel ${x.panelIn?'in':''}">
  <div class="pcam-row"><span>${ic('sun',15)}Exposure</span><input type="range" min="-2" max="2" step="0.1" value="${x.exposure}" data-cam-range="exposure" aria-label="Exposure"><b style="width:30px;text-align:right">${x.exposure>0?'+':''}${Number(x.exposure).toFixed(1)}</b></div>
  <div class="pcam-row"><span>${ic('timer',15)}Timer</span><div class="pcam-seg">${[[0,'Off'],[3,'3 s'],[10,'10 s']].map(([v,l])=>b('camTimer',l,phone.timer===v?'on':'',`data-value="${v}"`)).join('')}</div></div>
  <div class="pcam-row"><span>${ic('ratio',15)}Shape</span><div class="pcam-seg">${Object.keys(RATIOS).map(v=>b('camRatio',v,c.ratio===v?'on':'',`data-value="${v}"`)).join('')}</div></div>
  <div class="pcam-row"><span>${ic('grid',15)}Grid</span><div class="pcam-seg">${b('camGrid','Off',c.grid?'':'on','data-value="0"')}${b('camGrid','On',c.grid?'on':'','data-value="1"')}</div></div>
  <div class="pcam-row"><span>${ic('filters',15)}Filter</span><div class="pcam-seg">${FX.filters.map(v=>b('camFilter',shortName(v),(phone.settings.cameraFilter||'None')===v?'on':'',`data-value="${esc(v)}"`)).join('')}</div></div>
  <div class="pcam-row"><span>${ic('frame',15)}Frame</span><div class="pcam-seg scroll">${FX.frames.map(v=>b('camFrame',shortName(v),(phone.settings.cameraFrame||'None')===v?'on':'',`data-value="${esc(v)}"`)).join('')}</div></div>
  <div class="pcam-row"><span>${ic('video',15)}Video</span><div class="pcam-seg">${qualities(phone).map(k=>b('camQuality',k[1]+' '+k[2],c.video===k[0]?'on':'',`data-value="${k[0]}" ${rec?'disabled':''}`)).join('')}</div></div>
 </div>`:'';
 const body=`<div class="pcam ${video?'video':''} ${rec?'rec':''}">
  <div class="pcam-top">${b('camFlashMenu',ic('flash',18,phone.flash==='on'),'pcam-round '+(phone.flash==='on'?'on':''),`aria-label="Flash: ${phone.flash}"`)}
   ${rec?`<span class="pcam-pill rec"><i></i><span data-cam-clock>00:00:00</span></span>`:video?`<span class="pcam-pill">${q[1]} \u{B7} ${q[2]}</span>`:x.space?.low?'<span class="pcam-pill warn">STORAGE ALMOST FULL</span>':phone.flash==='auto'?'<span class="pcam-pill">FLASH AUTO</span>':'<span></span>'}
   ${b('camPanel',ic(x.panel?'chevronUp':'controls',18),'pcam-round '+(x.panel?'on':''),'aria-label="Camera controls"')}</div>
  ${x.flashMenu?`<div class="pcam-flashmenu">${['auto','on','off'].map(v=>b('camFlash',v[0].toUpperCase()+v.slice(1),phone.flash===v?'on':'',`data-value="${v}"`)).join('')}</div>`:''}
  <div class="pcam-stage">${panel}<div class="pcam-view ${phone.selfie?'selfie':''}" style="aspect-ratio:${RATIOS[c.ratio]};${RATIOS[c.ratio]<.6?'height:100%':'width:100%'}"><div class="pcam-host" style="position:absolute;inset:0"></div>${c.grid?'<div class="pcam-grid"></div>':''}
   ${x.focus?`<div class="pcam-focus ${x.focus.fresh?'in':''}" style="left:${x.focus.x}%;top:${x.focus.y}%"></div><div class="pcam-sun" data-cam-sun style="left:${Math.min(x.focus.x,78)}%;top:${x.focus.y}%"><span style="top:${50-x.exposure*22}%">${ic('sun',16)}</span></div>`:''}
   <div class="pcam-count" data-countdown></div><div class="pcam-flashfx"></div>
   <div class="pcam-zoom">${zooms.map(v=>b('camZoom',(Math.abs(x.zoomT-v)<.05?String(v).replace(/^0/,'')+'\u{D7}':String(v).replace(/^0/,'')),Math.abs(near-v)<.01?'on':'',`data-value="${v}" aria-label="Zoom ${v} times"`)).join('')}</div></div></div>
  <div class="pcam-modes" data-cam-modes>${b('camMode','PHOTO',video?'':'on','data-value="photo"')}${b('camMode','VIDEO',video?'on':'','data-value="video"')}</div>
  <div class="pcam-bottom">${b('camLast',last?`<img src="${phone.url(last,true)}" alt="Last capture">`:ic('library',20),'pcam-thumb','aria-label="Open the last capture in Photos"')}
   ${b('camShutter','<b></b>','pcam-shutter '+(phone.timerEnd?'cancel':''),`aria-label="${rec?'Stop recording':video?'Start recording':phone.timerEnd?'Cancel timer':'Take photo'}"`)}
   <div class="pcam-side">${rec?b('camStill','<b></b>','pcam-still','aria-label="Take a photo while recording"'):''}${b('camSwitch',ic('switchCam',22),'pcam-switch','aria-label="Switch between rear and front camera"')}</div></div>
 </div>`;
 phone.shell(body,'');const host=phone.ctx.container,os=host.querySelector('.platdo-os');os?.classList.add('pk-full');host.querySelector('.pcam-host')?.append(phone.cameraCanvas);x.panelIn=false;if(x.focus)x.focus.fresh=false;const strip=host.querySelector('.pcam-seg.scroll');if(strip)strip.scrollLeft=keepX;wire(phone);phone.renderCamera();}
const paint=phone=>{if(phone.active&&phone.page==='camera')render(phone);};
// Pointer work on the live view: a tap sets focus and exposure, two fingers zoom, the wheel zooms.
function wire(phone){
 const host=phone.ctx.container,view=host.querySelector('.pcam-view'),x=phone.cx;if(!view)return;const pts=new Map();let down=null;
 view.addEventListener('pointerdown',e=>{if(e.target.closest('button,.pcam-sun,.pcam-panel'))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});down={x:e.clientX,y:e.clientY,t:performance.now()};if(pts.size===2){const[a,b2]=[...pts.values()];x.pinch={d:Math.hypot(a.x-b2.x,a.y-b2.y),z:x.zoomT};phone.cameraDrag=null;}},true);
 view.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===2&&x.pinch){const[a,b2]=[...pts.values()];x.zoomT=clamp(x.pinch.z*Math.hypot(a.x-b2.x,a.y-b2.y)/Math.max(20,x.pinch.d),.5,3);phone.cameraDrag=null;e.stopPropagation();}},true);
 const up=e=>{const was=pts.size;pts.delete(e.pointerId);if(was===2){x.pinch=null;paint(phone);return;}if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<7&&performance.now()-down.t<350&&!e.target.closest('button,.pcam-sun,.pcam-panel')){const r=view.getBoundingClientRect();x.focus={x:clamp((e.clientX-r.left)/r.width*100,8,92),y:clamp((e.clientY-r.top)/r.height*100,8,92),at:performance.now(),fresh:true};x.panel=false;x.flashMenu=false;paint(phone);}down=null;};
 view.addEventListener('pointerup',up,true);view.addEventListener('pointercancel',e=>{pts.delete(e.pointerId);x.pinch=null;},true);
 view.addEventListener('wheel',e=>{e.preventDefault();x.zoomT=clamp(x.zoomT*(e.deltaY<0?1.1:1/1.1),.5,3);clearTimeout(x.wheelT);x.wheelT=setTimeout(()=>paint(phone),220);},{passive:false});
 const sun=host.querySelector('[data-cam-sun]');if(sun){let from=null;sun.onpointerdown=e=>{from={y:e.clientY,v:x.exposure};sun.setPointerCapture(e.pointerId);e.stopPropagation();};sun.onpointermove=e=>{if(!from)return;x.exposure=clamp(Math.round((from.v+(from.y-e.clientY)/26)*10)/10,-2,2);x.focus.at=performance.now();const knob=sun.querySelector('span');if(knob)knob.style.top=(50-x.exposure*22)+'%';};sun.onpointerup=sun.onpointercancel=()=>{from=null;};}
 const range=host.querySelector('[data-cam-range="exposure"]');if(range)range.oninput=()=>{x.exposure=clamp(Number(range.value)||0,-2,2);const label=range.nextElementSibling;if(label)label.textContent=(x.exposure>0?'+':'')+x.exposure.toFixed(1);};
 const modes=host.querySelector('[data-cam-modes]');if(modes){let sx=null;modes.onpointerdown=e=>{sx=e.clientX;};modes.onpointerup=e=>{if(sx===null)return;const dx=e.clientX-sx;sx=null;if(Math.abs(dx)>28&&!phone.recorder){setMode(phone,dx<0?'video':'photo');}};}
 const stage=host.querySelector('.pcam-stage');if(stage){let sx=null;stage.addEventListener('pointerdown',e=>{sx=e.target===stage?e.clientX:null;});stage.addEventListener('pointerup',e=>{if(sx!==null&&Math.abs(e.clientX-sx)>40&&!phone.recorder)setMode(phone,e.clientX<sx?'video':'photo');sx=null;});}
}
function setMode(phone,mode){if(phone.recorder||phone.mode===mode)return;phone.mode=mode;phone.settings.cameraMode=mode;phone.timerEnd=0;phone.save();paint(phone);}
// ---- hooks into the phone -----------------------------------------------------------------------------------
const baseRender=Phone.prototype.render;
Phone.prototype.render=function(){if(!this.active)return;if(this.page==='camera'){render(this);return;}if(this.page==='photos'&&root.CityPhotos){root.CityPhotos.render(this);return;}this.ctx.container.querySelector('.platdo-os')?.classList.remove('pk-full');return baseRender.call(this);};
const baseAction=Phone.prototype.action;
Phone.prototype.action=async function(action,value,button){
 if(typeof action==='string'&&action.startsWith('ph')&&action.length>2&&action[2]===action[2].toUpperCase()&&root.CityPhotos){try{await root.CityPhotos.action(this,action,value,button);}catch(e){this.fail(e);}return;}
 if(typeof action!=='string'||!/^cam[A-Z]/.test(action))return baseAction.call(this,action,value,button);
 const c=cam(this),x=this.cx;try{
  if(action==='camShutter'){if(this.mode==='video'){await record(this);return;}if(this.timerEnd){this.timerEnd=0;paint(this);return;}if(this.timer){this.timerEnd=performance.now()+this.timer*1000;paint(this);return;}await shoot(this);return;}
  if(action==='camStill'){await shoot(this);return;}
  if(action==='camMode'){setMode(this,value==='video'?'video':'photo');return;}
  if(action==='camZoom'){x.zoomT=clamp(Number(value)||1,.5,3);}
  else if(action==='camPanel'){x.panel=!x.panel;x.panelIn=x.panel;x.flashMenu=false;x.focus=null;}
  else if(action==='camFlashMenu'){x.flashMenu=!x.flashMenu;x.panel=false;}
  else if(action==='camFlash'){this.flash=['auto','on','off'].includes(value)?value:'off';x.flashMenu=false;}
  else if(action==='camTimer'){this.timer=[0,3,10].includes(Number(value))?Number(value):0;this.timerEnd=0;}
  else if(action==='camRatio'){if(RATIOS[value]&&!this.recorder){c.ratio=value;keep(this);}}
  else if(action==='camGrid'){c.grid=value==='1';keep(this);}
  else if(action==='camQuality'){if(!this.recorder&&qualities(this).some(k=>k[0]===value)){c.video=value;keep(this);}}
  else if(action==='camFilter'){if(FX.filters.includes(value)){this.settings.cameraFilter=value;this.save();}}
  else if(action==='camFrame'){if(FX.frames.includes(value)){this.settings.cameraFrame=value;this.save();}}
  /* the same choices from the phone's Settings app: each press moves to the next one */
  else if(action==='camQualityNext'){const qs=qualities(this),i=qs.findIndex(k=>k[0]===c.video);if(qs.length){c.video=qs[(i+1)%qs.length][0];keep(this);}}
  else if(action==='camRatioNext'){const ks=Object.keys(RATIOS);c.ratio=ks[(ks.indexOf(c.ratio)+1)%ks.length];keep(this);}
  else if(action==='camGridNext'){c.grid=!c.grid;keep(this);}
  else if(action==='camSwitch'){button?.classList.add('spin');this.selfie=!this.selfie;this.yaw=this.selfie?this.sim.player.yaw:this.sim.camera.yaw;this.pitch=0;x.focus=null;await new Promise(r=>setTimeout(r,160));}
  else if(action==='camLast'){const last=this.media.find(m=>!m.deletedAt);if(this.recorder)return;x.resumeMode=this.mode;if(root.CityPhotos)root.CityPhotos.openFromCamera(this,last?.id||null);else await this.go('photos');return;}
  if(this.page==='camera')paint(this);else this.render();
 }catch(e){this.fail(e);}};
/* the Camera always opens ready to take a photo, except when coming back from Photos */
const baseGo=Phone.prototype.go;Phone.prototype.go=function(page){if(page==='photos'&&this.px){const px=this.px;if(px.viaCamera)px.viaCamera=false;else{px.returnTo=null;px.screen='tabs';px.edit=null;px.sheet=null;px.info=false;px.more=false;px.select=false;px.picked.clear();}}if(page==='camera'&&this.page!=='camera'){if(this.cx?.resumeMode){this.settings.cameraMode=this.cx.resumeMode;this.cx.resumeMode=null;}else this.settings.cameraMode='photo';if(this.cx){this.cx.panel=false;this.cx.flashMenu=false;this.cx.focus=null;}}if(page==='camera')Kit.space().then(s=>{if(!this.cx)return;this.cx.space=s;if(s?.low&&!this.cx.warned){this.cx.warned=true;this.ctx.toast('Storage on this device is almost full. Save what you want to keep, then delete some photos or videos.');}if(s?.low&&this.active&&this.page==='camera')paint(this);});return baseGo.call(this,page);};
const baseTick=Phone.prototype.tick;
Phone.prototype.tick=function(dt){
 if(this.active&&this.page==='camera'&&this.cx){const x=this.cx,target=clamp(x.zoomT||1,.5,3);/* the lens glides to the chosen zoom */this.zoom=Math.abs((this.zoom||1)-target)<.004?target:(this.zoom||1)+(target-(this.zoom||1))*(1-Math.exp(-dt*9));
  const host=this.ctx.container;if(this.recorder){const label=host.querySelector('[data-cam-clock]');if(label)label.textContent=timeLabel(performance.now()-this.recordStart);}
  if(x.shotUntil>performance.now()){const fx=host.querySelector('.pcam-flashfx');if(fx&&!fx.classList.contains('go'))fx.classList.add('go');}
  if(x.focus&&performance.now()-x.focus.at>2600&&!x.fading){x.fading=true;x.focus=null;x.fading=false;paint(this);}
  const before=!!this.timerEnd;baseTick.call(this,dt);if(before&&!this.timerEnd){const n=host.querySelector('[data-countdown]');if(n)n.textContent='';setTimeout(()=>paint(this),30);}return;}
 return baseTick.call(this,dt);};
// the timer's own picture goes through the new capture too
const basePhoto=Phone.prototype.photo;Phone.prototype.photo=function(){return this.page==='camera'&&this.cx?shoot(this):basePhoto.call(this);};
// The Camera part of the phone's Settings app: three buttons that change what the Camera really uses.
function settingsHtml(phone){const c=cam(phone),qs=qualities(phone),q=qs.find(k=>k[0]===c.video)||qs[0]||QUALITIES[0],bt=(a,l)=>`<button type="button" data-phone="${a}">${l}</button>`;
 return bt('camQualityNext','Video quality: '+q[1]+', '+q[2]+' frames a second')+bt('camRatioNext','Photo and video shape: '+c.ratio)+bt('camGridNext','Camera grid: '+(c.grid?'On':'Off'))+'<p class="os-fine">Photos are saved 1200 pixels across the short side. Video is recorded at the size and rate chosen here. A size this device cannot draw is not offered.</p>';}
root.CityPhoneCamera={render,shoot,record,qualities,cam,paint,settingsHtml};
})(typeof window!=='undefined'?window:globalThis);
