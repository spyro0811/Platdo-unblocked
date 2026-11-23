
/* PLATDO City apartments: the lifts (V9.2). Game only.
 * - "Use the lift" at the call panel in a lobby, or in the hall of a home by its lift door, opens the lift screen:
 *   all eight homes of the building, floor by floor, each marked as yours, for sale, or not ready yet, with a button
 *   to go up to your own, to buy one, or to go down to the lobby.
 * - Going up: the lobby lift doors open and close, the picture cuts to a short shot of the building from across the
 *   coast road that rises towards the home's window, then you are standing in the lift car of your home with its
 *   doors open. Going down is quicker: a fade and you step out of the lift in the lobby.
 * - Buying uses the shared rules (city-apartments.js): $500,000 of your money, the home is saved with your profile.
 * - You cannot go home while the police are after you.
 * - V10.0: in online rooms the lift asks the host: each home is yours, one you may visit, someone else's (ask the
 *   owner for access), or for sale (bought with your online City money). The host moves you at the right moment of
 *   the film and keeps everyone without access out.
 * The lift doors in the homes are drawn by city-apt-rooms.js; this file says when they are open. */
(function(root){'use strict';
const AP=()=>root.CityApartments;
const state={site:null,unit:null,note:'',film:null,carDoor:0,overlay:null,/* V10.0: the host's list for this building, online */list:null,busy:false,redraw:null};
const net=()=>root.PlatdoFriends;
// V10.0: the host's answer for each home of the building (online only)
function refresh(sim){const F=net(),site=state.site;if(!F||!sim?.onlineRoom||!site)return;F.action('apartment',{kind:'list',site}).then(rows=>{if(state.site!==site)return;state.list=new Map(rows.map(r=>[r.id,r]));state.redraw?.();}).catch(e=>{state.note=e.message;state.redraw?.();});}
const money=n=>'$'+Math.round(n).toLocaleString('en-US');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
// ---- where the lifts are -------------------------------------------------------------------------------------------------
function liftNear(sim){
 const A=AP(),p=sim?.player;if(!A||!p||p.health<=0||p.mode!=='onFoot'||p.transition||p.physical||p.vehicleId||state.film)return null;
 for(const s of A.SITES){const L=A.lobby(s[0]);if(Math.abs(p.x-L.panel.x)<3.3&&p.z>L.panel.z-.6&&p.z<L.panel.z+2.8&&Math.abs(p.y-A.G)<1.2)return{site:s[0],unit:null};}
 const u=A.unitAt(p.x,p.y,p.z);if(u&&(u.car||(u.v<1.7&&u.u>.5&&u.u<3.5)))return{site:u.site,unit:u.id};return null;}
// In your own home, by the bed: sleep until morning (as at your house).
function bedNear(sim){const A=AP(),p=sim?.player;if(!A||!p||p.health<=0||p.mode!=='onFoot'||p.vehicleId||state.film)return false;const u=A.unitAt(p.x,p.y,p.z);if(!u||u.car||!A.owns(sim,u.id))return false;return u.u>10.4&&u.u<13.4&&u.v>7.9&&u.v<11.5;}
function install(){
 const S=root.CitySimulation?.Simulation;if(!S||S.prototype._cityApartments)return!!S;const p=S.prototype;p._cityApartments=true;
 const prompt=p.prompt,interact=p.interact,step=p.step;
 p.prompt=function(){const near=liftNear(this);if(near)return{action:'interact',text:'Use the lift'};if(bedNear(this))return{action:'interact',text:(t=>t>=.75||t<.25)((((this.profile?.world?.time??0)%1)+1)%1)?'Sleep until morning':'Sleep (after 6 pm)'};return prompt.call(this);};
 p.interact=function(){const near=liftNear(this);if(near){this.emit('apartmentLift',near);return true;}if(bedNear(this)&&(t=>t<.75&&t>=.25)((((this.profile?.world?.time??0)%1)+1)%1)){/* V12.7: you can only go to sleep from 6 pm until 6 am */this.emit('notice',{message:'You can only go to sleep after 6 pm.'});return true;}if(bedNear(this)){this.profile.world.time=7/24;this.player.health=Math.max(this.player.health,100);this.dirty=true;this.emit('notice',{message:'Good morning.'});return true;}return interact.call(this);};
 p.step=function(dt,input){if(state.film&&state.film.lock)input={};return step.call(this,dt,input);};
 /* V9.4: after being knocked out you wake up at the home you chose in the real estate app (Mine, Start here) */const respawn=p.respawn;p.respawn=function(){const r=respawn.apply(this,arguments);try{const A=AP(),s=this.profile&&this.profile.apartments&&this.profile.apartments.start;if(A&&s&&!this.mission&&!this.onlineRoom){if(s!=='home'&&s!=='mansion'&&A.owns(this,s))place(this,A.arrival(s));else if(s==='home'&&this.world.spawn)place(this,{...this.world.spawn,yaw:this.world.spawn.yaw||0});}}catch(e){}return r;};
 return true;}
// ---- the screen -----------------------------------------------------------------------------------------------------------
function opened(sim,e){state.site=e.site;state.unit=e.unit||null;state.note='';state.list=null;state.busy=false;refresh(sim);
 /* V10.0: when an owner answers (or your homes change) while the lift screen is open, it updates by itself */
 const F=net();if(!state.subscribed&&F?.subscribe){state.subscribed=true;F.subscribe(st=>{const a=st.social?.apartments,key=a?JSON.stringify([a.owned,a.received,a.sent]):'';if(key===state.accessKey)return;const first=state.accessKey===undefined;state.accessKey=key;if(!first&&state.open&&state.site)refresh(root.PlatdoCity?.sim||sim);});}}
function status(sim,id){const A=AP(),p=A.parseUnit(id);if(sim.onlineRoom){const r=state.list?.get(id);return r?r.state:'loading';}if(A.owns(sim,id))return'mine';if(!A.fitted(p.site))return'fitting';return'sale';}
function render(ctx){
 const A=AP(),sim=ctx.sim,s=A.site(state.site);if(!s){ctx.setScreen('play');return;}const esc=ctx.esc,D=A.DESIGNS[s[3]];
 const here=A.unitAt(sim.player.x,sim.player.y,sim.player.z);
 const online=!!sim.onlineRoom,wanted=sim.wanted?.level>0;state.redraw=()=>{try{ctx.render();}catch(e){}};state.open=true;
 const chip=(text,bg,fg='#fff')=>`<span style="display:inline-block;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.6px;background:${bg};color:${fg}">${text}</span>`;
 let rows='';
 for(let f=4;f>=1;f--){let cells='';for(const side of['w','e']){const n=A.unitNumber(f,side),id=A.unitId(s[0],n),st=status(sim,id),isHere=here&&here.id===id;
   const info=online?state.list?.get(id):null,who=esc(info?.owner?.name||'another player');
   const label=st==='mine'?chip('YOURS','#2f8f5b'):st==='access'?chip('YOU CAN VISIT \u{B7} '+who.toUpperCase(),'#2a7f86'):st==='taken'?chip('OWNED BY '+who.toUpperCase(),'#7a5a2c'):st==='sale'?chip('FOR SALE \u{B7} '+money(A.PRICE),'#2c5c86'):st==='loading'?chip('CHECKING\u{2026}','#55595d'):chip('BEING FITTED OUT','#6b6f73');
   let act='';const busy=state.busy?' disabled':'';
   if(isHere)act=`<span class="fine">You are here</span>`;
   else if(st==='mine'||st==='access')act=ctx.btn('aptGo','Go up to '+n,'primary',`data-value="${id}"${wanted?' disabled':''}${busy}`);
   else if(st==='sale')act=ctx.btn('aptBuy','Buy for '+money(A.PRICE),'',`data-value="${id}"${sim.profile.wallet<A.PRICE?' disabled':''}${busy}`);
   else if(st==='taken')act=info?.requested?`<span class="fine">Request sent to ${who}</span>`:ctx.btn('aptRequest','Ask for access','',`data-value="${id}"${busy}`);
   else if(st==='loading')act=`<span class="fine">Asking the server\u{2026}</span>`;
   else act=`<span class="fine">Opens in a coming update</span>`;
   cells+=`<div style="flex:1;min-width:220px;padding:12px 14px;border-radius:12px;background:${isHere?'#ffffff22':'#ffffff10'};border:1px solid ${st==='mine'?'#2f8f5b':st==='access'?'#2a7f86':'#ffffff1f'}">
    <div style="display:flex;align-items:baseline;gap:10px"><b style="font-size:26px;letter-spacing:1px">${n}</b><span class="fine">Floor ${f} \u{B7} ${side==='w'?'west':'east'} side</span></div>
    <div style="margin:6px 0 10px">${label}</div><div class="row" style="margin:0">${act}</div></div>`;}
  rows+=`<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px">${cells}</div>`;}
 /* V10.0: the inland buildings look out on the street, not the sea */const view=A.inland?.(s)?'street':'sea';
 const head=`<p class="fine" style="letter-spacing:2px;margin:0 0 6px">${esc(D.name.toUpperCase())} \u{B7} 8 HOMES \u{B7} ${view.toUpperCase()} VIEW FROM EVERY ONE \u{B7} YOU HAVE ${money(sim.profile.wallet)}</p>`+
  `<p class="fine" style="margin:0 0 12px">Every home has the ${view} side as one wall of glass, a kitchen with an island, a living room, a bedroom with its own view and a bathroom. Your lift opens straight into your hall.</p>`+
  (online?`<p style="margin:0 0 10px;color:#cfe8ff">Online, a home is yours on this server, bought with your online City money and separate from your Sandbox and Story homes. Owners choose who may visit: ask for access here, and they answer under Friends, Requests.</p>`:'')+
  (wanted?`<p style="margin:0 0 10px;color:#ffb3a5">The lift will not take you home while the police are after you.</p>`:'')+
  (state.note?`<p role="status" style="margin:0 0 10px;color:#ffe1a5">${esc(state.note)}</p>`:'');
 const foot=`<div class="row" style="margin-top:6px">${here?ctx.btn('aptLobby','Go down to the lobby','primary',state.busy?'disabled':''):''}${ctx.btn('aptClose','Close')}</div>`;
 ctx.panel(esc(s[1])+' \u{B7} Lift',head+rows+foot);}
function click(action,value,ctx){
 const A=AP(),sim=ctx.sim;state.note='';
 if(action==='aptClose'||action==='back'){state.open=false;ctx.setScreen('play');return;}
 /* V10.0: online, the host decides; the film plays once it says yes */
 if(sim.onlineRoom&&['aptBuy','aptGo','aptLobby','aptRequest'].includes(action)){
  const F=net();if(!F||state.busy)return;state.busy=true;ctx.render();
  const kind={aptBuy:'buy',aptGo:'go',aptLobby:'lobby',aptRequest:'request'}[action];
  F.action('apartment',action==='aptLobby'?{kind}:{kind,unit:value}).then(r=>{
   state.busy=false;
   if(action==='aptGo'){state.open=false;ctx.setScreen('play');start(sim,'up',value);return;}
   if(action==='aptLobby'){state.open=false;ctx.setScreen('play');start(sim,'down',null);return;}
   state.note=r?.message||'';if(action==='aptBuy'){ctx.audio?.sample?.('kaChing',1,0);if(Number.isFinite(r?.wallet))sim.profile.wallet=r.wallet;}refresh(sim);ctx.render();
  }).catch(e=>{state.busy=false;state.note=e.message;ctx.render();});
  return;}
 if(action==='aptBuy'){const r=A.buy(sim,value);state.note=r.message;if(r.ok){ctx.saveNow?.();ctx.audio?.sample?.('kaChing',1,0);}ctx.render();return;}
 if(action==='aptGo'){if(sim.wanted?.level>0){state.note='The lift will not take you home while the police are after you.';ctx.render();return;}if(!A.owns(sim,value)){state.note='That home is not yours.';ctx.render();return;}ctx.setScreen('play');start(sim,'up',value);return;}
 if(action==='aptLobby'){ctx.setScreen('play');start(sim,'down',null);return;}
 ctx.render();}
// ---- the short film ---------------------------------------------------------------------------------------------------------
function overlay(){
 if(state.overlay&&state.overlay.isConnected)return state.overlay;const d=document.createElement('div');d.id='apt-film';
 d.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:60;';
 d.innerHTML='<div data-k="top" style="position:absolute;left:0;right:0;top:0;height:0;background:#000;transition:none"></div><div data-k="bot" style="position:absolute;left:0;right:0;bottom:0;height:0;background:#000"></div><div data-k="cap" style="position:absolute;left:0;right:0;bottom:12%;text-align:center;color:#fff;font:300 26px/1.3 \'Segoe UI\',Arial,sans-serif;letter-spacing:4px;text-shadow:0 2px 12px #000a;opacity:0"></div><div data-k="fade" style="position:absolute;inset:0;background:#000;opacity:0"></div>';
 (document.getElementById('cityRoot')||document.body).appendChild(d);return state.overlay=d;}
function paint(f){const d=overlay(),q=k=>d.querySelector(`[data-k="${k}"]`);q('fade').style.opacity=String(clamp(f.fade||0,0,1));const bars=clamp(f.bars||0,0,1)*11;q('top').style.height=bars+'vh';q('bot').style.height=bars+'vh';q('cap').style.opacity=String(clamp(f.cap||0,0,1));q('cap').textContent=f.caption||'';d.style.display=(f.fade||f.bars||f.cap)?'block':'none';}
function place(sim,at){const p=sim.player;
 if(p.vehicleId){const v=sim.currentVehicle?.();if(v?.seatOccupants)v.seatOccupants[p.seat||0]=null;}
 Object.assign(p,{x:at.x,y:at.y,z:at.z,yaw:at.yaw,mode:'onFoot',vehicleId:null,seat:0,vx:0,vy:0,vz:0,roll:0,pitch:0,speed:0,transition:null,physical:null,ragdoll:null,grounded:true,crouched:false,lastSafe:{x:at.x,y:at.y,z:at.z}});
 if(sim.camera){sim.camera.yaw=at.yaw;sim.camera.pitch=-.12;}sim.clearRequested=true;sim.dirty=true;}
function start(sim,kind,unit){
 const A=AP(),here=A.unitAt(sim.player.x,sim.player.y,sim.player.z);
 state.film={kind,unit,site:kind==='up'?A.parseUnit(unit).site:(here?.site||state.site),t:0,lock:true,from:here?.id||null,/* V10.0: online the host moves you */online:!!sim.onlineRoom};state.carDoor=0;}
// The camera for the shot of the building: from the far side of the coast road, rising towards the home's window.
function shot(f,t){const A=AP(),p=A.parseUnit(f.unit),s=A.site(p.site),k=p.side==='w'?-1:1,/* V9.7: each building's own front line; inland the street is narrower than the beach */Z=A.zfOf?A.zfOf(s):A.ZF,far=A.inland?.(s)?27:52,close=A.inland?.(s)?13:19,win={x:s[2]+k*7.5,y:A.G+A.level(p.floor)+1.4,z:Z};
 const e=ease(t),from={x:win.x-k*26,y:A.G+2.2,z:Z+far},to={x:win.x-k*7,y:win.y+1.2,z:Z+close};
 const pos={x:from.x+(to.x-from.x)*e,y:from.y+(to.y-from.y)*e,z:from.z+(to.z-from.z)*e};
 const look={x:win.x,y:A.G+6+(win.y-A.G-6)*e,z:win.z};return{position:pos,target:look,fov:52-10*e,kind:'apartment'};}
function liftOf(siteId){const scene=root.PlatdoCity?.scene;return root.CityApartmentsLook?.byId(scene,siteId)||null;}
function step(sim,dt,audio){
 const f=state.film,A=AP();if(!A)return;
 // the lift door of the home: open while you are by it (from either side)
 {const u=A.unitAt(sim.player.x,sim.player.y,sim.player.z);const near=!!(u&&(u.car||(u.v<2.4&&u.u>.2&&u.u<3.8)));state.carDoor+=((near||(f&&f.kind==='up'&&f.t>3.2)?1:0)-state.carDoor)*Math.min(1,dt*5);}
 if(!f){paint({});return;}
 f.t+=dt;const b=liftOf(f.site);
 if(f.kind==='up'){
  const t=f.t;
  if(b)b.lift=t<.5?ease(t/.5):t<1?1-ease((t-.5)/.5):0;
  if(t<1)paint({fade:ease((t-.6)/.4)});
  else if(t<3.4){if(!f.cut){f.cut=true;audio?.sample?.('doorBell',.6,0);}sim.menuCamera=shot(f,(t-1)/2.4);const p=A.parseUnit(f.unit);paint({fade:t<1.3?1-ease((t-1)/.3):t>3.1?ease((t-3.1)/.3):0,bars:t<1.4?ease((t-1)/.4):t>3.0?1-ease((t-3.0)/.4):1,cap:t<1.6?ease((t-1.2)/.4):t>2.9?1-ease((t-2.9)/.3):1,caption:'HOME '+p.number+'  \u{B7}  '+A.site(p.site)[1].toUpperCase()});}
  else{if(!f.arrived){f.arrived=true;sim.menuCamera=null;if(!f.online)place(sim,A.arrival(f.unit));}paint({fade:1-ease((t-3.4)/.45)});if(t>3.9){state.film=null;paint({});}}}
 else{
  const t=f.t;
  if(t<.35)paint({fade:ease(t/.35)});
  else{if(!f.arrived){f.arrived=true;const L=A.lobby(f.site);if(!f.online)place(sim,L.stand);}if(b)b.lift=t<.9?1:t<1.6?1-ease((t-.9)/.7):0;paint({fade:1-ease((t-.35)/.4)});if(t>.75)f.lock=false;if(t>1.6){state.film=null;paint({});if(b)b.lift=0;}}}
}
function carDoor(){return state.carDoor;}
function busy(){return!!state.film;}
install();
root.CityApartmentsLife={install,liftNear,opened,render,click,step,carDoor,busy,state,place};
})(typeof globalThis!=='undefined'?globalThis:this);
