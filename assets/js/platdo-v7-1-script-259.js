
/* Complete, disposable home activities; no account, purchase or world authority. */
(function(root,factory){const api=factory(root);if(typeof module==='object')module.exports=api;root.CityMansionActivities=api;})(typeof globalThis==='object'?globalThis:this,function(root){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class TableTennis{
 constructor(){this.player=0;this.opponent=0;this.paddle=0;this.ai=0;this.phase='serve';this.elapsed=0;this.rallies=0;this.ball={x:0,z:.68,y:.13,vx:0,vz:0,vy:0};this.message='Serve when you are ready';}
 move(x){this.paddle=clamp(x,-.67,.67);if(this.phase==='serve')this.ball.x=this.paddle;}
 serve(){if(this.phase!=='serve')return;this.phase='play';Object.assign(this.ball,{x:this.paddle,z:.68,y:.13,vx:(this.paddle)*.28,vz:-1.65,vy:1.65});this.message='Keep the rally going';}
 point(winner){this[winner]++;this.phase=this.player>=5||this.opponent>=5?'ended':'serve';this.message=this.phase==='ended'?(this.player>this.opponent?'You win!':'Opponent wins. Try another match.'):(winner==='player'?'Your point · Serve again':'Opponent scores · Your serve');Object.assign(this.ball,{x:this.paddle,z:.68,y:.13,vx:0,vz:0,vy:0});}
 step(dt,axis=0){dt=clamp(dt,0,.1);this.move(this.paddle+axis*dt*1.65);if(this.phase!=='play')return;this.elapsed+=dt;
  const steps=Math.max(1,Math.ceil(dt/.004)),step=dt/steps;
  for(let i=0;i<steps&&this.phase==='play';i++){
   const b=this.ball,priorZ=b.z;this.ai+=clamp(b.x-this.ai,-step*.85,step*.85);this.ai=clamp(this.ai,-.67,.67);
   b.vy-=6.5*step;b.x+=b.vx*step;b.z+=b.vz*step;b.y+=b.vy*step;
   if(b.y<.035&&Math.abs(b.z)<.85&&Math.abs(b.x)<.77){b.y=.035;b.vy=Math.max(.95,Math.abs(b.vy)*.84);}
   if(priorZ>0&&b.z<=0&&b.y<.16){b.vz=Math.abs(b.vz)*.5;b.z=.025;}
   if(priorZ<0&&b.z>=0&&b.y<.16){b.vz=-Math.abs(b.vz)*.5;b.z=-.025;}
   if(priorZ<.76&&b.z>=.76&&b.vz>0&&Math.abs(b.x-this.paddle)<.23&&b.y<.62){b.z=.755;b.vz=-Math.min(3,Math.abs(b.vz)+.055);b.vx=(b.x-this.paddle)*3.4;b.vy=1.8;this.rallies++;}
   if(priorZ>-.76&&b.z<=-.76&&b.vz<0&&Math.abs(b.x-this.ai)<.22&&b.y<.62){b.z=-.755;b.vz=Math.min(3,Math.abs(b.vz)+.055);b.vx=(b.x-this.ai)*3.1+Math.sin(this.rallies*2.3)*.15;b.vy=1.8;this.rallies++;}
   if(b.z>1.05||Math.abs(b.x)>1.02&&b.vz>0)this.point('opponent');
   else if(b.z<-1.05||Math.abs(b.x)>1.02&&b.vz<0)this.point('player');
  }
 }
}
const styles=`.mansion-activity{position:fixed;inset:0;z-index:33000;border:0;margin:0;max-width:none;max-height:none;width:100vw;height:100dvh;padding:0;background:#0d1921f5;color:#f7f4ec;font:16px system-ui;box-sizing:border-box;display:flex;flex-direction:column}.mansion-activity::backdrop{background:#071116d9}.mansion-activity header{display:flex;align-items:center;justify-content:space-between;padding:max(12px,env(safe-area-inset-top)) 20px 12px;gap:15px;border-bottom:1px solid #3a5059}.mansion-activity h2{margin:0;font-size:24px}.mansion-activity small{color:#d6bd82}.mansion-activity button{font:600 15px system-ui;border:1px solid #657c84;color:white;background:#213d47;border-radius:7px;padding:11px 17px;min-height:44px;cursor:pointer}.mansion-activity button:focus-visible{outline:3px solid #eace8a}.mansion-activity button:disabled{opacity:.5}.mansion-activity .ma-stage{position:relative;flex:1;min-height:0;display:grid;place-items:center;padding:12px;overflow:hidden}.mansion-activity canvas{max-width:100%;max-height:100%;width:min(920px,100%);aspect-ratio:16/10;touch-action:none;outline:0;border-radius:12px;background:#14252e}.mansion-activity .ma-bottom{padding:12px max(16px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom));text-align:center;background:#162a34;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:10px}.mansion-activity output{flex-basis:100%;min-height:22px}.mansion-activity .ma-touch{display:flex;gap:12px}.mansion-activity .ma-touch[hidden]{display:none}.mansion-activity .ma-touch button{touch-action:none;min-width:75px}.mansion-activity .ma-floors{display:grid;gap:12px;width:min(400px,85vw)}.mansion-activity .ma-floors p{line-height:1.5}.mansion-activity .ma-instructions{color:#bdccd1;flex-basis:100%;font-size:13px}.mansion-activity .ma-pace{width:min(340px,70vw)}@media(max-width:600px){.mansion-activity h2{font-size:19px}.mansion-activity header{padding-left:12px;padding-right:12px}.mansion-activity .ma-bottom{gap:6px}.mansion-activity .ma-stage{padding:6px}.mansion-activity button{font-size:13px}}`;
let session=null;
const compactStyles='@media(max-height:500px) and (min-width:600px){.mansion-activity{display:grid;grid-template-columns:minmax(0,1fr) 225px;grid-template-rows:52px minmax(0,1fr)}.mansion-activity header{grid-column:1/-1;padding:4px 12px}.mansion-activity header small{display:none}.mansion-activity h2{font-size:18px}.mansion-activity .ma-stage{grid-column:1;grid-row:2;padding:5px}.mansion-activity .ma-bottom{grid-column:2;grid-row:2;display:flex;flex-direction:column;justify-content:center;padding:9px;gap:10px}.mansion-activity output,.mansion-activity .ma-instructions{flex-basis:auto}.mansion-activity .ma-instructions{font-size:11px;margin:0}.mansion-activity button{min-height:40px;padding:8px 10px;font-size:12px}.mansion-activity .ma-touch{gap:5px}.mansion-activity .ma-touch button{min-width:80px}.mansion-activity .ma-pace{width:90%}}';
const el=(tag,cls,text)=>{const e=root.document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
function open(result,{sim,onClose,act,controlGame='platdo-city'}={}){
 if(!root.document)throw Error('A browser is required for home activities.');
 session?.close();if(!document.getElementById('mansionActivityStyles')){const style=el('style');style.id='mansionActivityStyles';style.textContent=styles+compactStyles;document.head.append(style);}
 const rawKind=result.kind.replace(/^mansion-/,''),kind=rawKind==='activity'?(result.game||'recreation'):rawKind,dialog=el('dialog','mansion-activity'),header=el('header'),name=el('div'),stage=el('div','ma-stage'),footer=el('footer','ma-bottom'),output=el('output'),instructions=el('p','ma-instructions'),abort=new AbortController();
 name.append(el('small','', 'MEGA MODERN MANSION'),el('h2','',result.label||result.message||'Home activity'));header.append(name);dialog.append(header,stage,footer);document.body.append(dialog);dialog.showModal();
 let closed=false,frame=0,last=0,elapsed=0,mobile=false,keys=new Set(),held=new Map(),state=null,paused=false,busy=false,resize=null;
 const on=(target,event,fn,options={})=>target.addEventListener(event,fn,{...options,signal:abort.signal});
 const makeButton=(text,fn,parent=footer)=>{const b=el('button','',text);b.type='button';b.onclick=fn;parent.append(b);return b;};
 const clear=()=>{keys.clear();held.clear();last=0;};
 function close(){if(closed)return;closed=true;cancelAnimationFrame(frame);abort.abort();resize?.disconnect();clear();dialog.close();dialog.remove();if(session?.dialog===dialog)session=null;onClose?.();}
 makeButton('Leave activity',close,header);footer.append(output,instructions);
 on(dialog,'cancel',e=>{e.preventDefault();close();});on(root,'blur',clear);on(document,'visibilitychange',clear);on(root,'platdo:beforereset',close);
 async function request(data){if(busy)return;busy=true;for(const b of dialog.querySelectorAll('button'))b.disabled=true;try{const response=act?await act(data):sim?root.CityMansion?.interact?.(sim,data):null;if(response?.ok===false)throw Error(response.reason||response.message||'This action is unavailable.');if(response==null)throw Error('The house is still loading. Try again.');return response;}catch(error){output.textContent=error.message;return null;}finally{busy=false;for(const b of dialog.querySelectorAll('button'))b.disabled=false;}}
 if(kind==='elevator'){
   const floors=el('div','ma-floors');floors.append(el('p','','Choose a floor. The stairs remain available beside the elevator.'));stage.append(floors);
   for(const [floor,label] of [[-4.2,'B · Pool & recreation'],[0,'G · Entrance & living'],[4.2,'1 · Bedrooms & library'],[8.4,'R · Roof terrace']])makeButton(label,async()=>{if(await request({id:result.id,floor}))close();},floors);
   session={dialog,close,snapshot:()=>({kind,busy})};return session;
 }
 const canvas=el('canvas');canvas.width=960;canvas.height=600;canvas.tabIndex=0;canvas.setAttribute('aria-label',kind==='recreation'?'Table tennis game':result.label||'Home activity view');stage.append(canvas);const ctx=canvas.getContext('2d');
 const touch=el('div','ma-touch');footer.append(touch);
 function fit(){const w=Math.max(1,Math.min(stage.clientWidth-24,(stage.clientHeight-24)*1.6,960));canvas.style.width=w+'px';canvas.style.height=w/1.6+'px';}
 resize=new ResizeObserver(fit);resize.observe(stage);fit();
 function setMode(){mobile=(root.Platdo?.controls?.getMode?.(controlGame)||root.Platdo?.controls?.mode)==='mobile';touch.hidden=!mobile;clear();}
 on(root,'platdo:settingschange',setMode);on(root,'platdo:controlspreferenceschange',setMode);
 function touchKey(name,label){const b=makeButton(label,()=>{},touch);on(b,'pointerdown',e=>{if(!mobile)return;e.preventDefault();b.setPointerCapture(e.pointerId);held.set(e.pointerId,name);});const release=e=>held.delete(e.pointerId);for(const event of ['pointerup','pointercancel','lostpointercapture'])on(b,event,release);}
 const active=key=>mobile?[...held.values()].includes(key):keys.has(key);
 let primary=()=>{};
 on(root,'keydown',e=>{if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)close();return;}if(!['KeyA','KeyD','ArrowLeft','ArrowRight','Space','Enter'].includes(e.code))return;e.preventDefault();e.stopImmediatePropagation();if(mobile)return;keys.add(e.code);if(['Space','Enter'].includes(e.code)&&!e.repeat)primary();},{capture:true});
 on(root,'keyup',e=>{if(!['KeyA','KeyD','ArrowLeft','ArrowRight','Space','Enter'].includes(e.code))return;e.preventDefault();e.stopImmediatePropagation();keys.delete(e.code);},{capture:true});
 const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
 const text=(label,x,y,size=28,color='#f7f4ec')=>{ctx.fillStyle=color;ctx.font=`600 ${size}px system-ui`;ctx.textAlign='center';ctx.fillText(label,x,y);};
 function backdrop(){rect(0,0,960,600,'#10202b');const g=ctx.createLinearGradient(0,0,0,600);g.addColorStop(0,'#29434e');g.addColorStop(1,'#101c24');ctx.fillStyle=g;ctx.fillRect(20,20,920,560);}
 let draw;
 if(kind==='recreation'||kind==='table-tennis'){
   state=new TableTennis();instructions.textContent='First to 5 wins. Move your paddle with A/D, arrows, or drag. Serve with Space or the button.';primary=()=>{if(state.phase==='ended')state=new TableTennis();else state.serve();};makeButton('Serve / New match',primary);touchKey('left','← Paddle');touchKey('right','Paddle →');
   on(canvas,'pointerdown',e=>{if((e.pointerType==='touch')!==mobile)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);const b=canvas.getBoundingClientRect();state.move((e.clientX-b.left)/b.width*1.7-.85);});
   on(canvas,'pointermove',e=>{if((e.pointerType==='touch')!==mobile||!e.buttons)return;const b=canvas.getBoundingClientRect();state.move((e.clientX-b.left)/b.width*1.7-.85);});
   draw=dt=>{state.step(dt,Number(active('KeyD')||active('ArrowRight')||active('right'))-Number(active('KeyA')||active('ArrowLeft')||active('left')));backdrop();
     const point=(x,z,y=0)=>({x:480+x*(280+z*42),y:330+z*215-y*170});
     const corners=[point(-.78,-.85),point(.78,-.85),point(.78,.85),point(-.78,.85)];ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle='#176e77';ctx.fill();ctx.strokeStyle='#f1f4df';ctx.lineWidth=4;ctx.stroke();
     const a=point(0,-.85),b=point(0,.85);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();const nl=point(-.84,0,.16),nr=point(.84,0,.16);rect(nl.x,nl.y,nr.x-nl.x,28,'#c5d6ce88');ctx.strokeStyle='#f4f0de';ctx.beginPath();ctx.moveTo(nl.x,nl.y);ctx.lineTo(nr.x,nr.y);ctx.stroke();
     for(const [x,z,color] of [[state.ai,-.78,'#d3b35c'],[state.paddle,.78,'#e65858']]){const p=point(x,z,.13);ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(p.x,p.y,39,15,0,0,Math.PI*2);ctx.fill();rect(p.x-5,p.y+4,10,30,'#d8ba8e');}
     const ball=point(state.ball.x,state.ball.z,state.ball.y);ctx.fillStyle='#fff6cd';ctx.beginPath();ctx.arc(ball.x,ball.y,7,0,Math.PI*2);ctx.fill();text('YOU  '+state.player+'  :  '+state.opponent+'  HOUSE',480,75,30);output.textContent=state.message+' · Rally contacts '+state.rallies;};
 }else if(kind==='cinema'){
   instructions.textContent='An original local film. Start or stop at any time; no streaming account or network video is needed.';primary=()=>paused=!paused;const toggle=makeButton('Pause / Play',primary);makeButton('Restart film',()=>{elapsed=0;paused=false;});
   draw=()=>{const t=elapsed%80,night=.5+.5*Math.sin(t*.08),sky=ctx.createLinearGradient(0,0,0,600);sky.addColorStop(0,night>.5?'#162540':'#8bb5c4');sky.addColorStop(1,night>.5?'#614d6c':'#e1ba9a');ctx.fillStyle=sky;ctx.fillRect(0,0,960,600);for(let i=0;i<24;i++){const x=(i*83-t*23)%1200-100,h=90+(i*41%150);rect(x,390-h,70,h,night>.5?'#243544':'#627b7b');for(let y=405-h;y<375;y+=21)rect(x+12,y,9,9,night>.5?'#edc886':'#bdd7d7');}rect(0,390,960,210,'#26343c');for(let i=0;i<12;i++)rect((i*105-t*100)%1250-100,494,55,5,'#d9d8bf');const x=480+Math.sin(t*.16)*170;rect(x-65,422,130,33,'#d2a849');rect(x-32,397,65,35,'#e2be65');rect(x-22,403,45,20,'#527782');for(const dx of [-43,43]){ctx.fillStyle='#111a20';ctx.beginPath();ctx.arc(x+dx,458,18,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a6b4b6';ctx.lineWidth=5;ctx.stroke();}text(t<10?'NEIGHBORHOOD NIGHTS':t>67?'A PLATDO SHORT':'',480,125,44);text('A drive home through the city',480,565,20);output.textContent=(paused?'Paused':'Playing')+' · '+Math.floor(t)+' / 80 seconds';toggle.setAttribute('aria-pressed',String(!paused));};
 }else if(kind==='telescope'){
   let yaw=0,zoom=1;instructions.textContent='Drag to pan the night sky. Zoom to inspect stars and planets.';const range=el('input','ma-pace');range.type='range';range.min='1';range.max='5';range.step='.1';range.value='1';range.setAttribute('aria-label','Telescope zoom');footer.append(range);on(range,'input',()=>zoom=+range.value);on(canvas,'pointermove',e=>{if((e.pointerType==='touch')===mobile&&e.buttons)yaw+=e.movementX*.004;});
   draw=()=>{rect(0,0,960,600,'#07101e');ctx.save();ctx.beginPath();ctx.arc(480,300,270,0,Math.PI*2);ctx.clip();for(let i=0;i<180;i++){const x=((Math.sin(i*57.13)*.5+.5)*1800+yaw*250)%1800-420,y=(Math.cos(i*33.7)*.5+.5)*600;ctx.fillStyle=i%3?'#eef4ff':'#ffe0ad';ctx.fillRect(x,y,1.4+(i%4)*.35,1.4+(i%4)*.35);}const x=480+Math.sin(yaw)*230;ctx.fillStyle='#cda779';ctx.beginPath();ctx.arc(x,300,42*zoom,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d0b798';ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(x,300,85*zoom,17*zoom,-.2,0,Math.PI*2);ctx.stroke();ctx.restore();ctx.strokeStyle='#495a63';ctx.lineWidth=15;ctx.beginPath();ctx.arc(480,300,275,0,Math.PI*2);ctx.stroke();output.textContent='Telescope · '+zoom.toFixed(1)+'×';};
 }else{
   const exercise=!!result.exercise||['gym','exercise','treadmill','exercise-bike','weight-bench'].includes(kind);let pace=.5,reps=0;
   // Keep the furnished room and the real avatar visible during seated/exercise use.
   dialog.classList.add('ma-in-world');canvas.hidden=true;stage.style.pointerEvents='none';
   const viewStyle=el('style');viewStyle.textContent='.mansion-activity.ma-in-world{background:transparent}.mansion-activity.ma-in-world::backdrop{background:transparent}.mansion-activity.ma-in-world header,.mansion-activity.ma-in-world .ma-bottom{background:#10202bec}.mansion-activity.ma-in-world canvas{display:none}';dialog.append(viewStyle);
   instructions.textContent=exercise?'Use the equipment at your own pace. This activity does not change combat or movement stats.':'Relax and leave whenever you like. No paid health or performance advantage.';
   const range=el('input','ma-pace');range.type='range';range.min='0';range.max='1';range.step='.01';range.value='.5';range.setAttribute('aria-label',exercise?'Exercise pace':'Ambient effect intensity');footer.append(range);on(range,'input',()=>pace=+range.value);makeButton('Pause / Resume',()=>paused=!paused);
   draw=dt=>{if(exercise&&!paused)reps+=dt*pace*.65;if(sim?.mansionActivity)Object.assign(sim.mansionActivity,{pace:paused?0:pace,exercise,effect:result.effect||'',elapsed});output.textContent=exercise?'Repetitions '+Math.floor(reps)+' · '+(paused?'Paused':'Exercising'):'Relaxing · '+Math.floor(elapsed)+' seconds';};
 }
 function tick(now){if(closed)return;frame=requestAnimationFrame(tick);if(document.hidden)return;if(last&&now-last<1000/(root.Platdo?.frameRate||60)-.4)return;const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(!paused)elapsed+=dt;draw(paused?0:dt);}
 session={dialog,close,snapshot:()=>({kind,elapsed,paused,mode:mobile?'mobile':'pc',game:state?{phase:state.phase,player:state.player,opponent:state.opponent,rallies:state.rallies}:null})};setMode();canvas.focus();draw(0);frame=requestAnimationFrame(tick);return session;
}
return{TableTennis,open,close:()=>session?.close(),get active(){return !!session;},snapshot:()=>session?.snapshot()||null};
});

