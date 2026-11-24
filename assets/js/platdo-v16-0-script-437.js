
/* V3.8 phone: files from the real device in chats and Photos, sharing a picture from Photos with a chosen person,
 * camera sounds, and a small viewfinder while a video records so you can keep walking. */
(function(root){'use strict';
if(!root.CityPhone?.Phone)return;
const P=root.CityPhone.Phone.prototype,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svg=d=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+d+'"/></svg>';
const ICON={share:svg('M12 15V3M8 7l4-4 4 4M7 11H5v10h14V11h-2'),heart:svg('M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4C19 15.6 12 20 12 20z'),trash:svg('M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13'),down:svg('M12 4v11M8 11l4 4 4-4M5 20h14'),zoom:svg('M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.5 15.5 20 20M8 10.5h5M10.5 8v5'),restore:svg('M4 12a8 8 0 1 0 2.6-5.9M4 4v4h4')};
const portrait=p=>'<span class="os-chat-avatar">'+(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p?.photo||'')?'<img src="'+esc(p.photo)+'" alt="">':esc((p?.name||'?').slice(0,1).toUpperCase()))+'</span>';

// ---- files from the device ---------------------------------------------------------------
function pickFile(accept){return new Promise(resolve=>{const input=document.createElement('input');input.type='file';input.accept=accept;input.style.display='none';document.body.append(input);let done=false;const finish=file=>{if(done)return;done=true;input.remove();resolve(file||null);};input.onchange=()=>finish(input.files&&input.files[0]);input.addEventListener('cancel',()=>finish(null));input.click();});}
const toBlob=(canvas,quality)=>new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
// The gallery shows 3:4 thumbnails; fill that frame from the middle of the picture.
function thumbnail(source,w,h){const c=document.createElement('canvas');c.width=150;c.height=200;const k=Math.max(150/w,200/h),dw=w*k,dh=h*k;c.getContext('2d').drawImage(source,(150-dw)/2,(200-dh)/2,dw,dh);return toBlob(c,.8);}
async function prepareImage(file){
 const url=URL.createObjectURL(file),img=new Image();
 try{await new Promise((ok,no)=>{img.onload=ok;img.onerror=()=>no(Error('This picture could not be opened.'));img.src=url;});
  const w=img.naturalWidth,h=img.naturalHeight,mime=file.type.split(';')[0];if(!w||!h)throw Error('This picture could not be opened.');
  let blob=file.slice(0,file.size,mime),width=w,height=h;
  // Anything a chat cannot carry as it is (too large, or a format other players' browsers may not show) is saved again as a JPEG.
  if(!/^image\/(jpeg|png|webp)$/.test(mime)||file.size>4*1024*1024||Math.max(w,h)>4096){let side=2048,quality=.86;blob=null;for(let pass=0;pass<5;pass++){const k=Math.min(1,side/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*k));c.height=Math.max(1,Math.round(h*k));c.getContext('2d').drawImage(img,0,0,c.width,c.height);blob=await toBlob(c,quality);width=c.width;height=c.height;if(blob&&blob.size<=4*1024*1024)break;side*=.75;quality-=.08;}if(!blob||blob.size>4*1024*1024)throw Error('This picture is too large to add.');}
  return{type:'photo',blob,thumbnail:await thumbnail(img,w,h),width,height};
 }finally{URL.revokeObjectURL(url);}
}
async function prepareVideo(file){
 const mime=file.type.split(';')[0];if(!/^video\/(mp4|webm)$/.test(mime))throw Error('Videos must be MP4 or WebM files.');if(file.size>12*1024*1024)throw Error('Videos can be up to 12 MB. Choose a shorter clip.');
 const url=URL.createObjectURL(file),video=document.createElement('video');
 try{video.muted=true;video.playsInline=true;video.preload='auto';await new Promise((ok,no)=>{const timer=setTimeout(()=>no(Error('This video could not be opened.')),12000);video.onloadeddata=()=>{clearTimeout(timer);ok();};video.onerror=()=>{clearTimeout(timer);no(Error('This browser cannot play this video.'));};video.src=url;});
  const w=video.videoWidth||640,h=video.videoHeight||360;return{type:'video',blob:file.slice(0,file.size,mime),thumbnail:await thumbnail(video,w,h),width:w,height:h,duration:Number.isFinite(video.duration)?video.duration:0};
 }finally{video.removeAttribute('src');video.load();URL.revokeObjectURL(url);}
}
// Adds one picture or video from the device to the phone's Photos. Resolves with the saved item, or null if nothing was chosen.
P.importDeviceMedia=async function(){
 const file=await pickFile('image/*,video/mp4,video/webm');if(!file)return null;
 const store=root.CityPhoneMedia,epoch=store.epoch,owner=store.owner(this.sim.profile.mode),made=/^image\//.test(file.type)?await prepareImage(file):await prepareVideo(file);
 if(epoch!==store.epoch)return null;const item=await store.add({owner,...made,imported:true},epoch);if(!item)return null;await this.loadMedia();return item;
};

// ---- Photos --------------------------------------------------------------------------------
const basePhotos=P.renderPhotos;
P.renderPhotos=function(){
 const b=this.button.bind(this),g=this.gallery,m=this.media.find(m=>m.id===g.selected);
 if(!m){g.share=false;const html=basePhotos.call(this);return g.tab==='library'?html.replace('</nav>','</nav>'+b('photos.import',ICON.down+'<span>Add from this device</span>','class="os-photo-import"')):html;}
 const id=`data-value="${esc(m.id)}"`,when=new Date(m.createdAt),detail=m.width+' × '+m.height+(m.type==='video'?' · '+Number(m.duration||0).toFixed(1)+' sec'+(m.measuredFPS?' · '+Number(m.measuredFPS).toFixed(0)+' fps':'')+(m.hasAudio===undefined?'':m.hasAudio?' · game audio':' · silent'):'')+(m.imported?' · from this device':'');
 let html=`<div class="os-media-top">${b('galleryBack','‹ Library')}<time>${esc(when.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}))}<br>${esc(when.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}))}</time></div><div class="os-media-view">${m.type==='photo'?`<img src="${this.url(m)}" alt="Saved photo" style="transform:scale(${this.photoZoom||1})">`:`<video src="${this.url(m)}" controls playsinline preload="metadata"></video>`}</div><p class="os-fine">${esc(detail)}</p>`;
 html+=`<nav class="os-media-bar">${m.deletedAt?b('mediaRestore',ICON.restore+'<span>Restore</span>',id):b('photos.share',ICON.share+'<span>Share</span>',`aria-pressed="${!!g.share}"`)}${b('mediaFavorite',ICON.heart+'<span>'+(m.favorite?'Favorite':'Like')+'</span>',id+(m.favorite?' class="on"':'')+' aria-label="Favorite"')}${m.type==='photo'?b('photoZoom',ICON.zoom+'<span>'+(this.photoZoom||1)+'×</span>','aria-label="Zoom"'):''}${b('mediaExport',ICON.down+'<span>Save</span>',id+' aria-label="Save to this device"')}${m.deletedAt?b('mediaDeleteForever',ICON.trash+'<span>Erase</span>',id+' class="danger"'):b('mediaDelete',ICON.trash+'<span>Delete</span>',id+' class="danger"')}</nav>`;
 if(g.share&&!m.deletedAt){const people=this.messageContacts?.();html+='<section class="os-share-sheet"><header><strong>Share with</strong>'+b('photos.share','Done')+'</header>';
  if(!people)html+='<p>Sign in and connect to the friends server to send this to a friend.</p>'+b('msg.friends','Open Friends');
  else if(!people.length)html+='<p>Add a friend or join a City room, then they will appear here.</p>'+b('msg.friends','Open Friends');
  else html+='<div class="os-share-people">'+people.map(p=>b('photos.shareTo',portrait(p)+'<span>'+esc(g.sharing===p.code?'Sending…':p.name)+'</span>','data-value="'+esc(p.code)+'" '+(g.sharing?'disabled':''))).join('')+'</div><p>'+esc(g.shareNote||'Tap a person to send this '+(m.type==='video'?'video':'photo')+' to them in Messages.')+'</p>';
  html+='</section>';}
 html+=`<div class="os-media-more">${b('mediaPrevious','‹ Previous')}${b('mediaNext','Next ›')}${m.type==='photo'&&!m.deletedAt?b('mediaWallpaper','Use as wallpaper',id):''}</div>`;
 if(!m.deletedAt)html+=`<label>Add to album<select data-phone-setting="mediaAlbum" data-id="${esc(m.id)}"><option value="">Choose album…</option>${this.data.albums.map(a=>`<option value="${a.id}">${esc(a.name)}${m.albums.includes(a.id)?' ✓':''}</option>`).join('')}</select></label>`;
 return html;
};

// ---- camera sounds and the recording layout -----------------------------------------------
function sound(phone,kind){
 if(!phone.settings.sounds)return;const audio=phone.ctx.audio?.();if(!audio?.tone)return;const level=Math.max(.25,Number(phone.settings.volume)||1);
 const play=(frequency,length,gain,type,to,delay=0)=>setTimeout(()=>{try{audio.tone(frequency,length,gain*level,type,'ui',to);}catch(_){}},delay);
 if(kind==='photo'){play(2400,.018,.10,'square',1100);play(1500,.032,.09,'square',420,62);}// the two halves of a shutter
 else if(kind==='start'){play(660,.09,.09,'sine',660);play(990,.13,.09,'sine',990,120);}// rising pair
 else if(kind==='stop'){play(990,.09,.09,'sine',990);play(660,.16,.09,'sine',620,120);}// falling pair
}
const basePhoto=P.photo,baseStart=P.startRecording,baseStop=P.stopRecording,baseRender=P.render,baseBind=P.bind,baseAction=P.action;
P.photo=async function(){if(!this.busy&&this.cameraActive){sound(this,'photo');const host=this.ctx.container.querySelector('.os-camera-host');if(host){host.classList.remove('os-flash');void host.offsetWidth;host.classList.add('os-flash');}}return basePhoto.call(this);};
P.startRecording=async function(){await baseStart.call(this);sound(this,'start');};
P.stopRecording=async function(discard=false){if(this.recorder&&!discard)sound(this,'stop');return baseStop.call(this,discard);};
P.render=function(){baseRender.call(this);const os=this.ctx.container.querySelector('.platdo-os');if(os)os.classList.toggle('os-recording',this.active&&this.page==='camera'&&!!this.recorder);};
P.bind=function(){baseBind.call(this);const host=this.ctx.container;
 // A focused drop-down would swallow the movement keys, so camera drop-downs let go of the keyboard once used.
 if(this.page==='camera')for(const select of host.querySelectorAll('select'))select.addEventListener('change',()=>select.blur());
 if(this.page==='photos'&&this.gallery.share)host.querySelector('.os-share-sheet')?.scrollIntoView({block:'nearest'});
 if(this.page==='messages'){const draft=host.querySelector('[data-chat-draft]');if(draft){const fit=()=>{draft.style.height='auto';draft.style.height=Math.min(96,draft.scrollHeight)+'px';};draft.addEventListener('input',fit);fit();}}
};
P.action=async function(name,value,button){
 if(name==='photos.share'){this.gallery.share=!this.gallery.share;this.gallery.shareNote='';this.render();return;}
 if(name==='photos.import'||name==='msg.device'){try{const item=await this.importDeviceMedia();if(!item)return;if(name==='msg.device')this.stageAttachment?.(item.id);else{this.ctx.toast((item.type==='video'?'Video':'Photo')+' added to Photos.');this.render();}}catch(error){this.fail(error);}return;}
 if(name==='photos.shareTo'){const g=this.gallery,id=g.selected,person=this.messageContacts?.()?.find(p=>p.code===value);if(!id||!person||g.sharing)return;g.sharing=value;g.shareNote='';this.render();
  try{await this.shareMedia(id,value);g.shareNote='Sent to '+person.name+'.';this.ctx.toast('Sent to '+person.name+'.');}catch(error){g.shareNote=error?.message||'This could not be sent.';}finally{g.sharing=null;if(this.active&&this.page==='photos')this.render();}return;}
 return baseAction.call(this,name,value,button);
};
})(typeof window!=='undefined'?window:globalThis);
