/* The shop tour and home staging own a disposable model and transient player.
   They never install an entitlement, save a position, or alter a running game. */
(function(root){
'use strict';
const PRODUCT='CITY_MANSION_01',clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let current=null,posterImage='',pendingLaunch=0,pendingCheck=null;
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function button(text,action){const b=node('button','',text);b.type='button';b.onclick=action;return b;}
function mansion(){if(!root.CityMansion?.buildPlan||!root.CityMansion?.createModel)throw Error('The mansion model is still loading. Please try again.');return root.CityMansion;}
function disposeModel(model){if(model?.dispose){model.dispose();return;}if(model?.userData?.dispose){model.userData.dispose();return;}const geometry=new Set(),material=new Set(),textures=new Set();model?.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){material.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});geometry.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());material.forEach(m=>m.dispose());}
function stage(canvas,{poster=false,detail=2}={}){
 const T=root.THREE,M=mansion(),plan=M.buildPlan(),scene=new T.Scene();
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:poster,powerPreference:'low-power'});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
 const camera=new T.PerspectiveCamera(46,1,.07,450),model=M.createModel(T,plan,{detail});
 const display=root.PlatdoDrive?.garageDisplay?.(),launcher=display?.create?.();if(launcher){launcher.position.set(4.4,0,4.5);launcher.rotation.y=Math.PI;model.add(launcher);}
 scene.background=new T.Color('#9fbdd0');scene.add(new T.HemisphereLight('#f1f5f4','#6b7765',2.2));
 const sun=new T.DirectionalLight('#fff2d6',2.1);sun.position.set(-22,38,-17);scene.add(sun);scene.add(model);
 const ground=new T.Mesh(new T.PlaneGeometry(160,160),new T.MeshStandardMaterial({color:'#6d825b',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.set((plan.width||30)/2,-.06,(plan.depth||30)/2);scene.add(ground);
 const box=new T.Box3().setFromObject(model),target=box.getCenter(new T.Vector3());target.y=Math.max(2,target.y);
 const extent=box.getSize(new T.Vector3()),distance=Math.max(extent.x,extent.z,extent.y*1.2)*1.45;
 camera.position.set(target.x-distance*.72,target.y+distance*.48,target.z-distance*.91);camera.lookAt(target);
 let disposed=false,width=0,height=0;
 function render(){if(disposed)return;const w=Math.max(1,canvas.clientWidth||canvas.width||640),h=Math.max(1,canvas.clientHeight||canvas.height||360);if(w!==width||h!==height){width=w;height=h;const size=root.Platdo?.renderSize?.(w,h)||{width:w,height:h};const rw=Math.max(1,Math.min(1400,size.width));renderer.setSize(rw,Math.max(1,Math.round(rw*h/w)),false);camera.aspect=w/h;camera.updateProjectionMatrix();}renderer.render(scene,camera);}
 function dispose(){if(disposed)return;disposed=true;if(launcher){const gs=new Set(),ms=new Set();launcher.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of [].concat(o.material||[]))ms.add(m);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());launcher.removeFromParent();}disposeModel(model);ground.geometry.dispose();ground.material.dispose();renderer.dispose();renderer.forceContextLoss();}
 return{T,M,plan,scene,model,camera,renderer,target,render,dispose};
}
function createPreview(canvas){const s=stage(canvas),controls=root.PlatdoShopPreviews.orbit(canvas,s.camera,s.target,s.render),resize=new ResizeObserver(s.render);resize.observe(canvas);s.render();return{available:true,animated:false,render:s.render,cameraAngle:controls.angle,dispose(){resize.disconnect();controls.dispose();s.dispose();}};}
function poster(){if(posterImage)return posterImage;const canvas=document.createElement('canvas');canvas.width=640;canvas.height=400;const s=stage(canvas,{poster:true});try{s.render();posterImage=canvas.toDataURL('image/png');return posterImage;}finally{s.dispose();}}
function localSpawn(plan){const p=plan.spawnLocal||plan.tourSpawn||plan.spawn||{x:(plan.width||30)/2,y:0,z:-5,yaw:Math.PI};return{x:p.x,y:p.y||0,z:p.z,yaw:Number.isFinite(p.yaw)?p.yaw:Math.PI,pitch:-.05,vy:0,grounded:true};}
function visit({onClose,onContinue,game,owned=false,controlGame='platdo-city'}={}){
 current?.close();
 const host=node('dialog','home-visit');host.setAttribute('aria-label',owned?'Your Mega Modern Mansion':'Mega Modern Mansion tour');
 const canvas=node('canvas','home-visit-view');canvas.tabIndex=0;canvas.setAttribute('aria-label','Walkable mansion');
 const head=node('header'),copy=node('div'),actions=node('nav','home-visit-actions'),title=node('h2','',owned?'Your Mega Modern Mansion':'Mega Modern Mansion'),caption=node('p','',owned?'Your account-wide home. Your starter house is still yours.':'Shop tour · No purchase, ownership or progress is changed.');
 const hint=node('p','home-visit-help'),status=node('div','home-visit-status');status.setAttribute('role','status');copy.append(title,caption);head.append(copy,actions);
 const touch=node('div','home-visit-touch'),pad=node('div','home-visit-pad'),actionPad=node('div','home-visit-pad-actions');touch.append(pad,actionPad);
 const activity=node('section','home-visit-activity');activity.hidden=true;const pauseMenu=node('section','home-visit-activity home-visit-pause');pauseMenu.hidden=true;
 host.append(canvas,head,status,hint,touch,activity,pauseMenu);document.body.append(host);host.showModal();
 let s;try{s=stage(canvas,{detail:3});}catch(error){host.remove();throw error;}
 let player=localSpawn(s.plan),mobile=false,closed=false,frame=0,last=null,drag=null,lastMouse=null,desktop=null,time=0,jumpHeld=false,actionHeld=false,unsub=null,continuing=false,paused=false;
 if(!owned)player.yaw=0;
 const priorMenu=root.PlatdoCity?.menuPreview;
 if(priorMenu?.external)root.PlatdoCity.stopMenuPreview();
 const keys=new Set(),pointers=new Map(),abort=new AbortController(),signal=abort.signal;
 const on=(target,event,fn,options={})=>target.addEventListener(event,fn,{...options,signal});
 function clear(){keys.clear();pointers.clear();drag=null;lastMouse=null;jumpHeld=false;actionHeld=false;for(const b of touch.querySelectorAll('button'))b.setAttribute('aria-pressed','false');}
 function closeActivity(){desktop?.close();desktop=null;root.CityMansionActivities?.close();activity.replaceChildren();activity.hidden=true;clear();canvas.focus();}
 function close(){if(closed)return;closed=true;cancelAnimationFrame(frame);abort.abort();unsub?.();closeActivity();s.dispose();host.remove();if(current?.host===host)current=null;onClose?.();if(priorMenu?.external&&!continuing&&(!location.hash||location.hash==='#'))root.PlatdoCity.startMenuPreview(priorMenu.kind).catch(()=>{});}
 function restart(){closeActivity();player=localSpawn(s.plan);if(!owned)player.yaw=0;status.textContent='Front entrance';}
 function setPaused(value){paused=value;clear();pauseMenu.hidden=!value;touch.hidden=value||!mobile;if(!value)canvas.focus();}
 pauseMenu.append(node('h2','','Tour paused'),button('Resume',()=>setPaused(false)),button('Front entrance',()=>{restart();setPaused(false);}));if(onContinue)pauseMenu.append(button('Continue to '+(game||'game'),()=>{continuing=true;close();onContinue();}));pauseMenu.append(button(owned?'Return to game':'Exit tour',close));actions.append(button('Pause',()=>setPaused(!paused)));
 const keyMap={},bindings=root.PlatdoCity?.settings?.bindings||root.CityConfig?.bindings||{forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',jump:'Space',interact:'KeyF',vehicle:'KeyE',sprint:'ShiftLeft'};
 const codes=value=>Array.isArray(value)?value:typeof value==='string'?[value]:[];
 for(const [action,source] of [['forward','forward'],['back','back'],['left','left'],['right','right'],['jump','jump'],['use','interact'],['use','vehicle'],['run','sprint']])for(const code of codes(bindings[source]))keyMap[code]=action;
 const name=value=>root.PlatdoInput?.label(value)||codes(value).join(' / ');
 function mode(){const next=(root.Platdo?.controls?.getMode?.(controlGame)||root.Platdo?.controls?.mode)==='mobile';if(next!==mobile)clear();mobile=next;touch.hidden=paused||!mobile;host.dataset.controlMode=mobile?'mobile':'pc';hint.textContent=mobile?'Look around · Use the direction pad to walk':[name(bindings.forward)+' / '+name(bindings.back)+' / '+name(bindings.left)+' / '+name(bindings.right)+' to walk',name(bindings.interact)+' to interact',name(bindings.jump)+' to jump','Escape to pause'].join(' · ');}
 function control(name,text,parent){const b=button(text,()=>{});b.dataset.input=name;b.setAttribute('aria-label',text);b.setAttribute('aria-pressed','false');parent.append(b);on(b,'pointerdown',e=>{if(!mobile)return;e.preventDefault();b.setPointerCapture(e.pointerId);pointers.set(e.pointerId,name);b.setAttribute('aria-pressed','true');});const up=e=>{pointers.delete(e.pointerId);b.setAttribute('aria-pressed',String([...pointers.values()].includes(name)));};for(const event of ['pointerup','pointercancel','lostpointercapture'])on(b,event,up);}
 for(const [name,text] of [['forward','↑'],['left','←'],['back','↓'],['right','→']])control(name,text,pad);control('jump','Jump',actionPad);control('use','Interact',actionPad);
 on(root,'keydown',e=>{if(desktop||root.CityMansionActivities?.active)return;if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)setPaused(!paused);return;}if(!keyMap[e.code])return;e.preventDefault();e.stopImmediatePropagation();if(!mobile)keys.add(e.code);},{capture:true});
 on(root,'keyup',e=>{if(desktop||root.CityMansionActivities?.active||!keyMap[e.code])return;e.preventDefault();e.stopImmediatePropagation();keys.delete(e.code);},{capture:true});
 on(root,'blur',clear);on(document,'visibilitychange',()=>{clear();last=null;});on(root,'platdo:settingschange',mode);on(root,'platdo:controlspreferenceschange',mode);on(root,'platdo:beforereset',close);
 on(host,'cancel',e=>{e.preventDefault();if(desktop||root.CityMansionActivities?.active)closeActivity();else setPaused(!paused);});
 on(canvas,'pointerdown',e=>{if(paused||desktop||(e.pointerType==='touch')!==mobile||drag||(!mobile&&![0,2].includes(e.button)))return;e.preventDefault();canvas.focus();if(mobile){canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY};}});
 on(canvas,'pointermove',e=>{if(paused||desktop||root.CityMansionActivities?.active)return;if(!mobile&&e.pointerType!=='touch'){if(lastMouse){player.yaw-=(e.clientX-lastMouse.x)*.005;player.pitch=clamp(player.pitch-(e.clientY-lastMouse.y)*.004,-1.2,1.2);}lastMouse={x:e.clientX,y:e.clientY};return;}if(drag?.id!==e.pointerId)return;player.yaw-=(e.clientX-drag.x)*.005;player.pitch=clamp(player.pitch-(e.clientY-drag.y)*.004,-1.2,1.2);drag.x=e.clientX;drag.y=e.clientY;});
 on(canvas,'pointerleave',()=>{lastMouse=null;});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])on(canvas,event,e=>{if(e.pointerId===drag?.id)drag=null;});on(canvas,'contextmenu',e=>e.preventDefault());
 const held=name=>mobile?[...pointers.values()].includes(name):[...keys].some(k=>keyMap[k]===name);
 let transientComputerStats={},fireplace=false;
 function use(){const result=s.M.tourInteract?.(s.plan,player,s.model);if(!result)return;status.textContent=result.message||'';
   const kind=result.kind.replace(/^mansion-/,'');
   if(kind==='computer'||kind==='arcade'){
     if(!root.CityHomeComputer){status.textContent='Computer is still loading. Try again.';return;}
     clear();activity.hidden=false;desktop=new root.CityHomeComputer(activity,{leave:closeActivity,pc:()=>!mobile,records:()=>transientComputerStats,save:stats=>{transientComputerStats=stats;},preferences:()=>({}),savePreferences:()=>{},launch:()=>{status.textContent='Collection games launch from your home computer in City.';}});
     if(result.game&&['snake','breaker','memory'].includes(result.game)){desktop.selected=result.game;desktop.page='title';desktop.render();}
   }else if(['elevator','activity','cinema','telescope','seat'].includes(kind)){
     const before={...player};clear();if(result.seat)Object.assign(player,result.seat);
     root.CityMansionActivities?.open(result,{controlGame,act:request=>s.M.tourInteract(s.plan,player,s.model,request),onClose:()=>{if(kind==='seat')Object.assign(player,before);clear();canvas.focus();}});
   }else if(kind==='toggle'){fireplace=!fireplace;s.model.userData.setFireplace?.(fireplace);status.textContent=fireplace?'Fireplace on':'Fireplace off';}
   else if(kind==='drive'||kind==='garage'){status.textContent='Your selected Drive car is displayed in your owned mansion. Exit this tour to launch Drive.';}
 }
 function draw(dt){
   if(!paused&&!desktop&&!root.CityMansionActivities?.active){const speed=held('run')?4.7:2.8,f=+held('forward')-+held('back'),side=+held('right')-+held('left'),length=Math.max(1,Math.hypot(f,side));
     const dx=(Math.sin(player.yaw)*f-Math.cos(player.yaw)*side)*speed*dt/length,dz=(Math.cos(player.yaw)*f+Math.sin(player.yaw)*side)*speed*dt/length;
     const jump=held('jump');if(jump&&!jumpHeld&&player.grounded)player.vy=4.8;jumpHeld=jump;
     if(s.M.resolveStep){
       const pool=s.plan.pool,swimming=pool&&player.x>pool.x0+.25&&player.x<pool.x1-.25&&player.z>pool.z0+.25&&player.z<pool.z1-.25&&player.y<pool.waterY;
       if(swimming){player.vy=Math.max(player.vy,0);player.y=Math.max(player.y,pool.waterY-1.3);if(jump)player.vy=3.6;}else player.vy-=16*dt;
       const next=s.M.resolveStep(s.plan,player,{x:dx,y:player.vy*dt,z:dz},.28,1.75);
       if(next)Object.assign(player,next);
       const floor=s.M.floorAt(s.plan,player.x,player.z,player.y+.25);
       player.grounded=Number.isFinite(floor)&&player.y<=floor+.025&&player.vy<=0;
       if(player.grounded){player.y=floor;player.vy=0;}
       if(player.y<-15)restart();
     }else throw Error('Mansion collision could not initialize. Please retry.');
     const useHeld=held('use');if(useHeld&&!actionHeld)use();actionHeld=useHeld;
     s.M.updateTour?.(s.plan,player,dt,s.model);
     const room=s.M.roomAt?.(s.plan,player.x,player.y,player.z);if(room&&!status.textContent.startsWith('Use '))status.textContent=typeof room==='string'?room:room.name;
   }
   time+=dt;s.camera.position.set(player.x,player.y+1.68,player.z);s.camera.lookAt(player.x+Math.sin(player.yaw)*Math.cos(player.pitch),player.y+1.68+Math.sin(player.pitch),player.z+Math.cos(player.yaw)*Math.cos(player.pitch));s.render();
 }
 function tick(now){if(closed)return;frame=requestAnimationFrame(tick);if(document.hidden)return;if(last!==null&&now-last<1000/(root.Platdo?.frameRate||60)-.4)return;const dt=last===null?0:Math.min(.06,(now-last)/1000);last=now;try{draw(dt);}catch(error){status.textContent='Tour stopped: '+error.message;cancelAnimationFrame(frame);clear();}}
 const ownerUID=root.PlatdoHomeEntitlements?.getState?.().uid;
 const session={host,close,snapshot:()=>({id:PRODUCT,owned,mode:mobile?'mobile':'pc',player:{...player},time,activity:!!desktop})};current=session;
 unsub=owned?root.PlatdoHomeEntitlements?.subscribe?.(state=>{if(state.uid!==ownerUID||state.state!=='owned')close();}):null;
 if(closed)return session;
 mode();canvas.focus();try{draw(0);frame=requestAnimationFrame(tick);}catch(error){close();throw error;}return session;
}
async function beforeLaunch(id,launch){
 pendingCheck?.();pendingCheck=null;
 // City chooses its home in gameplay; Drive always opens its own menu.
 // Home ownership (including an admin grant) must never turn Drive entry into
 // a tour or hold it behind a pending home-entitlement request.
 if(id==='platdo-city'||id==='platdo-drive'){launch();return;}const resolver=root.PlatdoHomeEntitlements;if(!resolver){launch();return;}
 const stamp=++pendingLaunch;let state=resolver.getState();
 if(state.state==='not-owned'||state.continuePublic){launch();return;}
 const overlay=node('section','home-check'),panel=node('section'),title=node('h2','','Checking your home'),text=node('p','','Verifying your account-owned home…'),nav=node('nav');panel.append(title,text,nav);overlay.append(panel);document.body.append(overlay);
 let stopped=false;const remove=()=>{stopped=true;overlay.remove();if(pendingCheck===remove)pendingCheck=null;};pendingCheck=remove;const cancel=button('Back',()=>{pendingLaunch++;remove();});nav.append(cancel);
 async function check(){nav.replaceChildren(cancel);text.textContent='Verifying your account-owned home…';state=await resolver.ready();if(stopped||stamp!==pendingLaunch){remove();return;}
   if(state.state==='owned'){remove();try{visit({owned:true,controlGame:id,game:{'platdo-drive':'Drive','platdo-jump':'Jump','platdo-swing':'Swing','code-platdo':'Code Platdo','platdo-god-core':'God Core'}[id]||'game',onContinue:launch});}catch(error){text.textContent=error.message;overlay.append(panel);document.body.append(overlay);stopped=false;nav.replaceChildren(button('Retry',check),button('Continue in public',()=>{resolver.choosePublic();remove();launch();}),cancel);}return;}
   if(state.state==='not-owned'||state.continuePublic){remove();launch();return;}
   title.textContent='Your home could not be verified';text.textContent=state.error||'Try again, or continue temporarily in a public area. Your ownership and saves will be retained.';nav.replaceChildren(button('Retry',async()=>{await resolver.refresh();check();}),button('Continue in public',()=>{resolver.choosePublic();remove();launch();}),cancel);
 }
 await check();
}
root.PlatdoHomePreview={create:createPreview,poster,label:id=>id===PRODUCT?'Tour mansion':'',open:(id,options={})=>{if(id!==PRODUCT)throw Error('Unknown home.');return visit(options);},visit,beforeLaunch,close:()=>current?.close(),get active(){return !!current;},snapshot:()=>current?.snapshot()||null};
root.PlatdoPremium?.registerAdapter(PRODUCT,{actionLabel:'Go to Mansion',async open(){const state=await root.PlatdoHomeEntitlements.ready();if(state.state!=='owned')throw Error(state.error||'Verified mansion ownership is required.');if(!root.PlatdoCity?.goToMansion)throw Error('City is still loading. Try again.');const result=await root.PlatdoCity.goToMansion();if(result?.ok===false)throw Error(result.reason||'Finish your current activity before returning home.');return result;}});
})(window);
