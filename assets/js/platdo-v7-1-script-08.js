/* Shared input ownership and multi-touch controls for every PLATDO game. */
(function(global){
 'use strict';
 if(global.PlatdoControls)return;
 const defaultMode=()=>global.matchMedia?.('(pointer: coarse)').matches?'mobile':'pc';
 const touchDefaults={size:1,opacity:.82,sensitivity:1};
 function drivingButtons(ids={}){const map={left:'steerLeft',right:'steerRight',gas:'accelerate',reverse:'reverse',handbrake:'handbrake',...ids};return[
  {id:map.left,label:'Steer left',icon:'left',hold:true,side:'steering',group:'steering',control:'left'},
  {id:map.right,label:'Steer right',icon:'right',hold:true,side:'steering',group:'steering',control:'right'},
  {id:map.reverse,label:'Reverse',icon:'reverse',shape:'brake',hold:true,side:'pedals',group:'pedals',control:'reverse'},
  {id:map.gas,label:'Accelerate',icon:'gas',shape:'gas',hold:true,side:'pedals',group:'pedals',control:'gas'},
  {id:map.handbrake,label:'Handbrake',icon:'handbrake',hold:true,side:'pedals',group:'pedals',control:'handbrake'}];}
 // Coordinates are CSS pixels captured at gesture start, never a per-frame layout read.
 function drivingGesture(owner,x,y,rects){const inside=(r,pad=0)=>r&&x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad;
  if(owner.group==='steering')return{controls:inside(rects.left)?['left']:inside(rects.right)?['right']:[]};
  if(inside(rects.reverse))return{controls:['reverse'],gasOrigin:false};
  if(inside(rects.gas))return{controls:['gas']};
  if(inside(rects.handbrake))return{controls:owner.gasOrigin?['gas','handbrake']:['handbrake']};
  const a=rects.gas,b=rects.handbrake,corridor=a&&b&&{left:Math.max(a.left,b.left)+8,right:Math.min(a.right,b.right)-8,top:b.bottom,bottom:a.top};
  if(owner.gasOrigin&&inside(corridor))return{controls:['gas']};
  const list=Object.values(rects),bounds={left:Math.min(...list.map(r=>r.left)),right:Math.max(...list.map(r=>r.right)),top:Math.min(...list.map(r=>r.top)),bottom:Math.max(...list.map(r=>r.bottom))};
  return{controls:[],cancel:!inside(bounds,18)};
 }
 // Radial dead zone and hysteresis are evaluated from the unbounded finger,
 // independently of the bounded artwork and normalized gameplay axes.
 function walkingGesture(dx,dy,radius,running=false){
  const distance=Math.hypot(dx,dy),ratio=distance/Math.max(1,radius);
  running=ratio>1?true:ratio<.95?false:running;
  const amount=Math.max(0,Math.min(1,(ratio-.1)/.9)),scale=distance?amount/distance:0;
  return{x:dx*scale,y:-dy*scale,running:amount>0&&running,ratio,stretch:Math.min(1.4,Math.max(1,ratio)),angle:Math.atan2(dy,dx)};
 }
 function install(P,options={}){
  if(P.controls)return P.controls;
  let saved=null;
  if(!options.save)try{saved=P.storage('main-controls').get('mode');}catch(_){}
  let fallback=['pc','mobile'].includes(options.mode||saved)?options.mode||saved:defaultMode();
  const methods=new Map([['mobile',{label:'Touch'}],['pc',{label:'Keyboard'}]]),games=new Map(),preferences={};
  const names={'platdo-jump':'PLATDO jump!','field':'code PLATDO','god-core':'platdo god core','platdo-drive':'platdo Drive','platdo-swing':'PLATDO SWING','platdo-city':'Platdo City'};
  if(!options.save)try{Object.assign(preferences,JSON.parse(P.storage('main-controls').get('games')||'{}'));}catch(_){}
  for(const id of Object.keys(preferences))if(!/^[a-z0-9-]+$/.test(id)||!methods.has(preferences[id]))delete preferences[id];
  let mode=fallback,updating=false,chartSignature='';
  let touchSettings={...touchDefaults},hintSeen=false;
  try{Object.assign(touchSettings,JSON.parse(P.storage('main-controls').get('touch')||'{}'));hintSeen=P.storage('main-controls').get('drivingHint')==='seen';}catch(_){}
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||a));
  function normalizedTouch(value){return{size:clamp(value.size,.9,1.15),opacity:clamp(value.opacity,.45,1),sensitivity:clamp(value.sensitivity,.3,2.5)};}
  touchSettings=normalizedTouch(touchSettings);
  const adapters=new Map(),pointers=new Map();let current=null,currentId='',signature='',live=false,expanded=false,stopped=false,lastTick=0;
  const root=document.createElement('div');root.id='platdoTouchControls';root.hidden=true;root.setAttribute('aria-label','Mobile game controls');
  root.innerHTML='<div class="pt-look" aria-label="Drag to look"><span>Drag to look</span></div><div class="pt-move-zone" hidden aria-label="Movement area"></div><div class="pt-top"></div><div class="pt-left"></div><div class="pt-stick" aria-label="Movement joystick"><b class="pt-stick-skin" aria-hidden="true"></b><span class="pt-stick-label">Move</span><i></i></div><div class="pt-right"></div><div class="pt-steering"></div><div class="pt-pedals"></div><div class="pt-extra" hidden></div><aside class="pt-driving-hint" hidden><span class="pt-hint-art" aria-hidden="true"></span><span>Slide from gas to handbrake to drift.<small>Short pedal: reverse. Arrows: steer.</small></span><button type="button" data-touch-action="__hint" aria-label="Dismiss driving hint"></button></aside>';
  document.body.append(root);
  const stick=root.querySelector('.pt-stick'),thumb=stick.querySelector('i'),look=root.querySelector('.pt-look'),extra=root.querySelector('.pt-extra'),moveZone=root.querySelector('.pt-move-zone');let layoutState={};
  function applyTouchSettings(){const allowed=global.innerWidth<400?Math.max(.9,.9+(global.innerWidth-320)/400):1.15;root.style.setProperty('--pt-user-size',Math.min(allowed,touchSettings.size));root.style.setProperty('--pt-opacity',touchSettings.opacity);}
  applyTouchSettings();
  function setTouchSettings(value){clear();touchSettings=normalizedTouch({...touchSettings,...value});applyTouchSettings();try{P.storage('main-controls').set('touch',JSON.stringify(touchSettings));}catch(_){}global.dispatchEvent(new CustomEvent('platdo:touchsettingschange',{detail:{...touchSettings}}));}
  function settingsHTML(){return '<section class="pt-settings"><h3>Mobile controls</h3>'+[['size','Control size',.9,1.15,.05],['opacity','Control opacity',.45,1,.05],['sensitivity','Touch camera sensitivity',.3,2.5,.1]].map(([id,label,min,max,step])=>'<label>'+label+'<input type="range" data-touch-setting="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+touchSettings[id]+'"><output>'+touchSettings[id].toFixed(2)+'</output></label>').join('')+'<button type="button" data-touch-defaults>Restore mobile defaults</button><p>Walking: move with the stick, drag the scene to look, and tap the jump icon. Driving: arrows steer, the tall pedal accelerates, the short pedal reverses. Slide from gas onto the handbrake to drift.</p></section>';}
  document.addEventListener('input',e=>{const input=e.target.closest?.('[data-touch-setting]');if(!input)return;setTouchSettings({[input.dataset.touchSetting]:input.value});input.nextElementSibling.textContent=touchSettings[input.dataset.touchSetting].toFixed(2);});
  document.addEventListener('click',e=>{if(!e.target.closest?.('[data-touch-defaults]'))return;setTouchSettings(touchDefaults);for(const input of document.querySelectorAll('[data-touch-setting]')){input.value=touchSettings[input.dataset.touchSetting];input.nextElementSibling.textContent=Number(input.value).toFixed(2);}});
  const picker=document.createElement('label');picker.id='platdoStandaloneControls';picker.hidden=true;picker.innerHTML='Controls <select aria-label="Control mode"><option value="pc">Keyboard</option><option value="mobile">Touch</option></select>';document.body.append(picker);
  const select=picker.querySelector('select');select.addEventListener('change',()=>api.setGameMode(activeEntry().id,select.value));
  const safe=(adapter,name,...args)=>{if(typeof adapter?.[name]==='function')return adapter[name](...args);};
  function resetStick(){thumb.style.transform='translate(-50%,-50%)';stick.querySelector('.pt-stick-skin').style.transform='rotate(0rad) scaleX(1)';stick.dataset.dragging='false';stick.dataset.running='false';stick.style.removeProperty('left');stick.style.removeProperty('top');stick.style.removeProperty('bottom');}
  function clear(){
   const old=[...pointers];pointers.clear();for(const [id,p]of old){for(const action of p.actions||[])safe(p.adapter,'action',action,false);try{p.element.releasePointerCapture(id);}catch(_){}}
   resetStick();root.querySelectorAll('[aria-pressed]').forEach(b=>b.setAttribute('aria-pressed','false'));
   for(const adapter of adapters.values())safe(adapter,'clear');
   safe(current,'move',0,0,{running:false,ratio:0});
  }
  function activeEntry(){const pair=[...adapters].filter(([,a])=>safe(a,'visible')).sort((a,b)=>(Number(b[1].priority)||0)-(Number(a[1].priority)||0))[0];return{adapter:pair?.[1]||null,id:pair?(safe(pair[1],'gameId')||pair[0]):''};}
  function getMode(id){return methods.has(preferences[id])?preferences[id]:fallback;}
  function persist(){if(stopped)return;try{if(options.save)options.save(fallback,{...preferences});else{P.storage('main-controls').set('mode',fallback);P.storage('main-controls').set('games',JSON.stringify(preferences));}}catch(_){const n=document.getElementById('controlModeStatus');if(n)n.textContent='Controls changed for this session. Browser storage is unavailable.';}}
  function declareGame(id,name){if(!/^[a-z0-9-]+$/.test(id))return false;games.set(id,name||names[id]||id);renderChart();return true;}
  function renderChart(){const host=document.getElementById('perGameControlChart');if(!host)return;const stamp=JSON.stringify([[...games],[...methods].map(([id,m])=>[id,m.label])]);if(stamp!==chartSignature){chartSignature=stamp;host.replaceChildren();const table=document.createElement('table');table.className='pt-method-table';table.setAttribute('aria-label','Control method for each game');const head=document.createElement('thead'),heading=document.createElement('tr'),first=document.createElement('th');first.textContent='Game';first.scope='col';heading.append(first);for(const [id,m]of methods){const cell=document.createElement('th');cell.scope='col';cell.textContent=m.label;heading.append(cell);}head.append(heading);table.append(head);const body=document.createElement('tbody');for(const [id,name]of games){const row=document.createElement('tr'),title=document.createElement('th');title.scope='row';title.textContent=name;row.append(title);for(const [method,m]of methods){const cell=document.createElement('td'),label=document.createElement('label'),input=document.createElement('input'),mark=document.createElement('span');input.type='radio';input.name='control-method-'+id;input.value=method;input.dataset.controlGame=id;input.setAttribute('aria-label',name+' — '+m.label);mark.textContent=m.label;label.append(input,mark);cell.append(label);row.append(cell);}body.append(row);}table.append(body);host.append(table);host.onchange=e=>{const input=e.target.closest('[data-control-game]');if(input)api.setGameMode(input.dataset.controlGame,input.value);};}if(!host.querySelector('.pt-settings'))host.insertAdjacentHTML('beforeend',settingsHTML());for(const input of host.querySelectorAll('[data-control-game]'))input.checked=getMode(input.dataset.controlGame)===input.value;}
  function changed(){signature='';expanded=false;renderChart();update();global.dispatchEvent(new CustomEvent('platdo:controlspreferenceschange',{detail:{preferences:{...preferences},fallback}}));}
  function setGameMode(id,value,{persist:save=true}={}){if(!/^[a-z0-9-]+$/.test(id)||!methods.has(value))return false;if(preferences[id]===value)return true;preferences[id]=value;if(save)persist();changed();return true;}
  // Compatibility API changes only the inherited default; explicit game choices
  // stay independent. The chart always changes one game through setGameMode.
  function setMode(value,{persist:save=true}={}){if(!methods.has(value))return false;fallback=value;if(save)persist();changed();return true;}
  function setPreferences(value,{persist:save=true}={}){for(const key of Object.keys(preferences))delete preferences[key];if(value&&typeof value==='object'&&!Array.isArray(value))for(const [id,method]of Object.entries(value))if(/^[a-z0-9-]+$/.test(id)&&methods.has(method))preferences[id]=method;if(save)persist();changed();}
  function resetPreferences(){fallback=defaultMode();setPreferences({});}
  function iconSVG(id){
   const asset=global.PlatdoControlIcons?.[id],bounds=global.PlatdoControlIconBounds?.[id];
   if(asset&&bounds)return '<svg class="pt-reference-icon" viewBox="'+[bounds.x,bounds.y,bounds.w,bounds.h].join(' ')+'" aria-hidden="true"><image href="'+asset+'" width="'+bounds.width+'" height="'+bounds.height+'"/></svg>';
   if(['gas','reverse','brake'].includes(id)){const tall=id==='gas';return '<svg viewBox="0 0 64 '+(tall?100:64)+'" fill="none" stroke="currentColor" stroke-width="4" aria-hidden="true"><rect x="4" y="4" width="56" height="'+(tall?92:56)+'" rx="13"/>'+[18,36,54,...(tall?[72,86]:[])].filter(y=>tall||y<54).map((y,i)=>'<circle cx="'+(i%2?22:18)+'" cy="'+y+'" r="4"/><circle cx="'+(i%2?44:46)+'" cy="'+y+'" r="4"/>').join('')+'</svg>';}
   const paths={
 left:'m15 5-7 7 7 7M8 12h13',right:'m9 5 7 7-7 7M3 12h13',
 gas:'M8 2h8l2 20H6L8 2ZM10 6v12m4-12v12',reverse:'M3 6h18v12H3V6Zm3 4h12M6 14h12',brake:'M3 6h18v12H3V6Zm3 4h12M6 14h12',
 handbrake:'M4 19h9v3H4v-3Zm4 0 5-9m0 0 4-7 4 2-4 7-4-2Z',cycleBrake:'M12 6a7 7 0 1 0 7 7M12 10a3 3 0 1 0 3 3M12 3h8v8h-4V7h-4V3Z',jump:'M9 4a2 2 0 1 0 .01 0M8 9l-4 3-2-4m6 1 5 2 2-5M8 9l1 6-5 5m5-5 5 4 2 2M20 12V2m-3 3 3-3 3 3',
 crouch:'M12 3a2 2 0 1 0 .01 0M11 8l-3 5 6 2 3 5M8 13l-4 4m7-9 6 3',aim:'M12 2v5m0 10v5M2 12h5m10 0h5M12 6a6 6 0 1 0 .01 0',fire:'M4 5h16v6h-8l-2 9H6l2-9H4V5Z',
 reload:'M5 9a8 8 0 1 1-1 7M5 3v6h6',interact:'M8 19V8a2 2 0 0 1 4 0v5-9a2 2 0 0 1 4 0v9l2-5a2 2 0 0 1 3 2l-3 9H8l-5-6a2 2 0 0 1 3-2l2 2',
 vehicle:'M4 20V8l6-5h9v17H4Zm2-11h10V6h-5L6 9Zm7 5h3',exit:'M13 3H4v18h9M10 12h12m-5-5 5 5-5 5',pause:'M8 4v16m8-16v16',play:'m8 4 12 8-12 8V4Z',more:'M4 12h1m6 0h1m6 0h1',close:'m6 6 12 12M18 6 6 18',
 camera:'M3 7h5l2-3h4l2 3h5v13H3V7Zm9 3a4 4 0 1 0 .01 0',view:'M3 12s3-5 9-5 9 5 9 5-3 5-9 5-9-5-9-5Zm9-2a2 2 0 1 0 .01 0M6 3h12l-3-2M18 21H6l3 2',map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16',phone:'M7 2h10v20H7V2Zm3 3h4m-3 14h2',bag:'M4 7h16v15H4V7Zm4 0V5a4 4 0 0 1 8 0v2M4 14h16',
 plus:'M12 4v16M4 12h16',minus:'M4 12h16',horn:'M3 10h6l9-6v16l-9-6H3v-4Zm3 4v6h4v-6M21 9v6',lights:'M12 5C4 5 4 19 12 19V5Zm4 1h5m-5 6h5m-5 6h5',repair:'m14 3-2 5 4 4 5-2c1 5-3 8-7 6l-6 6-4-4 6-6c-2-4 0-9 4-9Z',
 seatbelt:'M7 4v6l10 10M17 4 7 20M5 12h14',wheelie:'M5 16a3 3 0 1 0 .01 0M17 7a3 3 0 1 0 .01 0M7 17l6-9 5 1',tuck:'M9 4a2 2 0 1 0 .01 0M9 9l7 2-5 4 5 5M9 9l-6 6',
 clock:'M12 3a9 9 0 1 0 .01 0M12 7v6l4 2',shield:'M12 2 3 6v8l9 8 9-8V6l-9-4Z',radio:'M4 8h16v13H4V8Zm2-4 13-3M7 12h5m-5 5h4m6-5v5',throw:'M10 5h5l4 5v10H6V10l4-5Zm1-3h4m0 3 5-2',
 rise:'m5 14 7-8 7 8M12 6v16',descend:'m5 10 7 8 7-8M12 2v16',hover:'M3 12h18M12 3v18M6 6l12 12M18 6 6 18'
 };return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(paths[id]||paths.interact)+'"/></svg>';}
  function actionIcon(id){return ({camera:'view',photo:'camera',__more:'more',__hint:'close',steerLeft:'left',steerRight:'right',accelerate:'gas',throttle:'gas',reverse:'reverse',brake:'reverse',frontBrake:'cycleBrake',vehicleJump:'jump',scopeIn:'plus',scopeOut:'minus',zoomIn:'plus',zoomOut:'minus',powerUp:'plus',powerDown:'minus',gearUp:'plus',gearDown:'minus',yawLeft:'left',yawRight:'right',droneExit:'exit',weapons:'bag',inventory:'bag',leanBack:'wheelie',leanForward:'tuck',recover:'repair',garage:'repair',headlights:'lights',slowToggle:'clock',slowFaster:'plus',slowSlower:'minus',holster:'shield',cover:'shield',shoulder:'camera'})[id]||id;}
  function button(spec,group){
   const node=document.createElement('button');node.type='button';node.dataset.touchAction=spec.id;node.textContent=spec.label;node.setAttribute('aria-label',spec.label);node.setAttribute('aria-pressed','false');
   if(layoutState.design==='city'&&!spec.icon)spec={...spec,icon:actionIcon(spec.id)};if(spec.group)node.dataset.group=spec.group;if(spec.control)node.dataset.control=spec.control;if(spec.hold)node.dataset.hold='true';if(spec.icon){node.classList.add('pt-icon-button');node.dataset.icon=spec.icon;node.innerHTML='<span class="pt-button-art">'+iconSVG(spec.icon)+'</span><span class="pt-button-label">'+spec.label+'</span>';}if(spec.shape)node.dataset.shape=spec.shape;group.append(node);return node;
  }
  function render(layout){
   layoutState=layout;
   for(const name of ['top','left','right','extra','steering','pedals'])root.querySelector('.pt-'+name).replaceChildren();
   const buttons=layout.buttons||[],secondary=buttons.filter(b=>b.secondary);
   for(const b of buttons)button(b,root.querySelector('.pt-'+(b.secondary?'extra':['left','top','steering','pedals'].includes(b.side)?b.side:'right')));
   if(secondary.length){const more=button({id:'__more',label:expanded?'Close actions':'More'},root.querySelector('.pt-top'));more.setAttribute('aria-expanded',String(expanded));}
   extra.hidden=!expanded||!secondary.length;
   stick.hidden=layout.move===false;stick.querySelector('.pt-stick-label').textContent=layout.moveLabel||'Move';
   look.hidden=!layout.look;look.querySelector('span').textContent=layout.lookLabel||'Drag to look';root.dataset.game=currentId;root.dataset.layout=layout.key||'';root.dataset.design=layout.design||'';
   root.dataset.driving=String(!!layout.driving);root.dataset.floating=String(!!layout.floatingStick);root.dataset.walking=String(!!layout.walking);root.dataset.elastic=String(!!layout.elasticStick);root.dataset.vehicleControls=layout.vehicleControls||(layout.driving?'car':'');root.dataset.expanded=String(expanded);moveZone.hidden=!layout.floatingStick||expanded;
   const hint=root.querySelector('.pt-driving-hint');hint.hidden=hintSeen||!layout.driving||expanded||['motorcycle','bicycle'].includes(layout.vehicleControls);hint.querySelector('.pt-hint-art').innerHTML=iconSVG('gas')+iconSVG('rise')+iconSVG('handbrake');hint.querySelector('button').innerHTML=iconSVG('close');
   root.setAttribute('aria-label',(layout.help||currentId)+' mobile controls');
  }
  function update(){
   if(updating)return;updating=true;
   try{const entry=activeEntry(),id=entry.id,adapter=entry.adapter,nextMode=getMode(id),playing=!!adapter&&!!safe(adapter,'playing'),visible=!stopped&&nextMode==='mobile'&&playing&&!document.hidden;
   const transition=current!==adapter||currentId!==id||mode!==nextMode;
   if(transition||live!==visible){clear();if(transition)safe(methods.get(mode),'deactivate',currentId);current=adapter;currentId=id;mode=nextMode;signature='';expanded=false;}
   live=visible;root.hidden=!visible;root.inert=!visible;document.documentElement.dataset.controlMode=mode;select.value=mode;picker.hidden=!!document.getElementById('gameHub')||!adapter||playing;
   if(transition){if(document.pointerLockElement)try{document.exitPointerLock();}catch(_){}safe(methods.get(mode),'activate',id);global.dispatchEvent(new CustomEvent('platdo:controlsmodechange',{detail:{mode,controlMode:mode,gameId:id}}));global.dispatchEvent(new CustomEvent('platdo:settingschange',{detail:{controlMode:mode,gameId:id}}));}
   if(visible){const layout=safe(adapter,'layout')||{},{contextTarget,activeActions,...shape}=layout,next=JSON.stringify(shape);if(next!==signature){clear();signature=next;render(layout);}layoutState.activeActions=activeActions||[];feedback();if(contextTarget)for(const id of ['interact','vehicle']){const b=root.querySelector('[data-touch-action="'+id+'"]');if(b)b.disabled=contextTarget[id]===false;}}
   renderChart();}finally{updating=false;}
  }
  function aggregate(adapter){const next=new Set();for(const p of pointers.values())if(p.adapter===adapter)for(const id of p.actions||[])next.add(id);return next;}
  function contribute(p,actions){const before=aggregate(p.adapter);p.actions=actions;const after=aggregate(p.adapter);for(const id of before)if(!after.has(id))safe(p.adapter,'action',id,false);for(const id of after)if(!before.has(id))safe(p.adapter,'action',id,true);feedback();}
  function feedback(){const held=aggregate(current),active=new Set(layoutState.activeActions||[]);for(const node of root.querySelectorAll('[data-touch-action]')){node.setAttribute('aria-pressed',String(held.has(node.dataset.touchAction)||active.has(node.dataset.touchAction)));node.dataset.active=String(active.has(node.dataset.touchAction));}}
  function geometry(group){const rects={},ids={};for(const b of root.querySelectorAll('[data-group="'+group+'"]')){const r=b.getBoundingClientRect();rects[b.dataset.control]={left:r.left,right:r.right,top:r.top,bottom:r.bottom};ids[b.dataset.control]=b.dataset.touchAction;}return{rects,ids};}
  function begin(e){
   if(e.pointerType==='mouse'||!live||e.button!==0||getMode(activeEntry().id)!=='mobile')return;
   const action=e.target.closest('[data-touch-action]'),target=action||e.target.closest('.pt-stick,.pt-look,.pt-move-zone');if(!target||action?.disabled)return;
   e.preventDefault();e.stopPropagation();
   if(action?.dataset.touchAction==='__hint'){hintSeen=true;try{P.storage('main-controls').set('drivingHint','seen');}catch(_){}root.querySelector('.pt-driving-hint').hidden=true;return;}
   if(action?.dataset.touchAction==='__more'){clear();expanded=!expanded;signature='';update();return;}
   if(expanded&&!action?.closest('.pt-extra'))return;
   const group=action?.dataset.group,kind=group?'group':action?'button':target===stick||target===moveZone?'move':'look';
   if(kind==='move'&&[...pointers.values()].some(p=>p.kind==='move'))return;
   if(kind==='look'&&[...pointers.values()].some(p=>p.kind==='look'))return;
   let element=target;
   if(kind==='move'&&layoutState.floatingStick){const bounds=moveZone.getBoundingClientRect(),r=stick.getBoundingClientRect(),rootRect=root.getBoundingClientRect(),half=r.width/2,cx=clamp(e.clientX,bounds.left+half+8,bounds.right-half-8),cy=clamp(e.clientY,bounds.top+half+8,bounds.bottom-half-8);stick.style.left=(cx-rootRect.left-half)+'px';stick.style.top=(cy-rootRect.top-half)+'px';stick.style.bottom='auto';}
   try{element.setPointerCapture(e.pointerId);}catch(_){}
   const p={kind,element,adapter:current,action:action?.dataset.touchAction,actions:[],x:e.clientX,y:e.clientY,group,gasOrigin:action?.dataset.control==='gas'};
   if(group)Object.assign(p,geometry(group));if(kind==='move'){const r=stick.getBoundingClientRect();p.center={x:r.left+r.width/2,y:r.top+r.height/2,radius:r.width*(layoutState.elasticStick?.5:.34)};p.elastic=!!layoutState.elasticStick;p.running=false;stick.dataset.dragging='true';}
   pointers.set(e.pointerId,p);
   if(kind==='button')contribute(p,[p.action]);else if(kind==='move'||kind==='group')move(e,p);
  }
  function move(e,p){
   if(p.kind==='group'){const result=drivingGesture(p,e.clientX,e.clientY,p.rects);if(result.gasOrigin===false)p.gasOrigin=false;contribute(p,result.controls.map(k=>p.ids[k]));if(result.cancel){p.kind='cancelled';p.gasOrigin=false;}return;}
   if(p.kind==='move'){const {x:cx,y:cy,radius}=p.center,dx=e.clientX-cx,dy=e.clientY-cy,length=Math.hypot(dx,dy);
    if(p.elastic){const input=walkingGesture(dx,dy,radius,p.running);p.running=input.running;stick.dataset.running=String(input.running);stick.querySelector('.pt-stick-skin').style.transform=`rotate(${input.angle}rad) scaleX(${input.stretch})`;const visualScale=Math.max(1,length/(radius*1.4));thumb.style.transform=`translate(calc(-50% + ${dx/visualScale}px),calc(-50% + ${dy/visualScale}px))`;safe(p.adapter,'move',input.x,input.y,{running:input.running,ratio:input.ratio});}
    else{const scale=Math.max(1,length/radius),x=dx/scale/radius,y=-dy/scale/radius;thumb.style.transform=`translate(calc(-50% + ${dx/scale}px),calc(-50% + ${dy/scale}px))`;safe(p.adapter,'move',currentId==='platdo-city'?x:Math.abs(x)<.1?0:x,currentId==='platdo-city'?y:Math.abs(y)<.1?0:y);}
   }else if(p.kind==='look'){safe(p.adapter,'look',Math.max(-150,Math.min(150,e.clientX-p.x))*touchSettings.sensitivity,Math.max(-150,Math.min(150,e.clientY-p.y))*touchSettings.sensitivity);p.x=e.clientX;p.y=e.clientY;}
  }
  root.addEventListener('pointerdown',begin);
  root.addEventListener('pointermove',e=>{const p=pointers.get(e.pointerId);if(!p)return;e.preventDefault();e.stopPropagation();move(e,p);});
  function end(e){const p=pointers.get(e.pointerId);if(!p)return;contribute(p,[]);pointers.delete(e.pointerId);e.preventDefault();e.stopPropagation();if(p.kind==='move'){safe(p.adapter,'move',0,0,{running:false,ratio:0});resetStick();}try{p.element.releasePointerCapture(e.pointerId);}catch(_){}feedback();}
  for(const type of ['pointerup','pointercancel','lostpointercapture'])root.addEventListener(type,end);
  root.addEventListener('contextmenu',e=>e.preventDefault());root.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
  const gameplayCanvas='#gameCanvas,#fieldCanvas,#cityCanvas,.drive-canvas,.sw-canvas';
  function suppress(e){e.preventDefault();e.stopImmediatePropagation();}
  function blockKeyboard(e){
   if(getMode(activeEntry().id)==='pc'||e.target?.closest?.('input,textarea,select,[contenteditable="true"]')||['Escape','Tab'].includes(e.code))return;if(e.target?.closest?.('button,a,[role="dialog"]')&&['Enter','Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code))return;
   const game=[...adapters.values()].some(a=>safe(a,'visible')&&safe(a,'playing')),reset=document.getElementById('resetFlow');
   if(game||reset&&!reset.hidden)suppress(e);
  }
  global.addEventListener('keydown',blockKeyboard,true);global.addEventListener('keyup',blockKeyboard,true);
  // Only the shared touch layer owns gameplay gestures in Mobile. Menu buttons
  // and text fields remain normal browser UI in either mode.
  for(const type of ['pointerdown','pointermove','pointerup','mousedown','mousemove','mouseup','wheel','touchstart','touchmove','touchend'])global.addEventListener(type,e=>{
   if(!e.target?.closest?.(gameplayCanvas))return;
   if(getMode(activeEntry().id)!=='pc'||e.pointerType==='touch'||type.startsWith('touch'))suppress(e);
  },{capture:true,passive:false});
  global.addEventListener('blur',clear);global.addEventListener('hashchange',()=>{clear();update();});global.addEventListener('resize',()=>{clear();applyTouchSettings();});global.addEventListener('orientationchange',clear);global.visualViewport?.addEventListener('resize',clear);
  document.addEventListener('fullscreenchange',()=>{clear();const parent=document.fullscreenElement||document.body;parent.append(root,picker);update();});
  document.addEventListener('visibilitychange',()=>{clear();update();});global.addEventListener('platdo:beforereset',()=>{stopped=true;clear();update();});
  const api={get mode(){return getMode(activeEntry().id);},get isMobile(){return getMode(activeEntry().id)==='mobile';},get preferences(){return {...preferences};},get fallbackMode(){return fallback;},get methods(){return [...methods].map(([id,m])=>({id,label:m.label}));},get defaultMode(){return defaultMode();},get activeGame(){return activeEntry().id;},setMode,setGameMode,getMode,setPreferences,resetPreferences,declareGame,clear,refresh:update,renderChart,drivingButtons,icon:iconSVG,settingsHTML,setTouchSettings,get touchSettings(){return{...touchSettings};},registerMethod(id,descriptor){if(!/^[a-z][a-z0-9-]*$/.test(id)||!descriptor?.label)return false;methods.set(id,descriptor);changed();return true;},
   register(id,adapter){if(adapters.has(id))safe(adapters.get(id),'clear');adapters.set(id,adapter);declareGame(id,adapter.name);update();return()=>{safe(adapter,'clear');adapters.delete(id);update();};},
   diagnostics(){return{mode:getMode(activeEntry().id),fallback,preferences:{...preferences},activeGame:activeEntry().id,visible:!root.hidden,pointers:pointers.size,games:[...adapters.keys()]};}};
  if(!P.registerResetHandler){const handlers=new Map();P.registerResetHandler=(id,handler)=>{if(!/^[a-z0-9-]+$/.test(id)||typeof handler!=='function')throw new Error('Invalid reset handler');let group=handlers.get(id);if(!group)handlers.set(id,group=new Set());group.add(handler);return()=>group.delete(handler);};P.resetGameData=async(ids)=>{const selected=ids==null?[...handlers.keys()]:[...new Set(ids)];for(const id of selected)for(const handler of handlers.get(id)||[])await handler({all:ids==null,gameId:id});};}
  P.controls=api;document.documentElement.dataset.controlMode=mode;select.value=mode;renderChart();
  function tick(now){requestAnimationFrame(tick);if(now-lastTick<60)return;lastTick=now;update();}requestAnimationFrame(tick);
  global.dispatchEvent(new Event('platdo:controlsready'));return api;
 }
 global.PlatdoControls={install,drivingButtons,drivingGesture,walkingGesture};
})(window);
