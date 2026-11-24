
/* PLATDO City: Christmas, the game-page side of the switch (V13.0). Game only.
 * - Christmas Mode is one setting kept by the multiplayer host for everybody. This file only listens: the host says
 *   whether it is on (when you connect, and at once when it changes); players who are not signed in ask the host's
 *   public /season address now and then. Nothing is kept in the browser: with no host to ask, it is off.
 * - The Admin Panel phone app. Its icon is added to the phone only while the host says this signed-in account is
 *   the owner's (the host works that out from the verified sign-in; nothing on this page can claim it), and it goes
 *   the moment the account signs out or changes. Opening it any other way shows the home screen. The switch asks
 *   the host to change the setting; the host checks the account again before it does anything.
 * - The Christmas Day gift: the host says which gift clothes this account holds; they are put in the wardrobe of
 *   whichever City game is being played (never worn for you), and a notice is shown when they are new.
 * - step(): once a simulation step, tells the shared rules (city-christmas.js) what applies to this game: a solo
 *   game keeps its own list of broken snowmen in its save; in an online room the host's list is used.
 * What you see (snow, lights, trees, snowmen) is in city-xmas-look.js. */
(function(root){'use strict';
if(typeof document==='undefined')return;
const S={christmas:false,season:0,known:false,admin:false,gifts:[]},subs=new Set();
const net=()=>root.PlatdoFriends,X=()=>root.CityChristmas;
const tell=()=>{for(const fn of [...subs]){try{fn(S);}catch(_){}}};
function setSeason(view){if(!view||typeof view.christmas!=='boolean')return;const season=Number.isFinite(view.season)?view.season:0;S.known=true;if(S.christmas===view.christmas&&S.season===season)return;S.christmas=view.christmas;S.season=season;tell();}
function social(state){
 const so=state&&state.social;
 if(!so){if(S.admin||S.gifts.length){S.admin=false;S.gifts=[];tell();closeIfOpen();}return;}
 if(so.season)setSeason(so.season);
 const admin=so.admin===true,gifts=Array.isArray(so.gifts)?so.gifts.filter(id=>typeof id==='string').slice(0,16):[];
 if(admin!==S.admin||gifts.join()!==S.gifts.join()){const lost=S.admin&&!admin;S.admin=admin;S.gifts=gifts;tell();if(lost)closeIfOpen();else refreshHome();}
}
/* players who are not connected to the host with an account: the host's public answer, asked now and then */
async function hostAddress(){
 if(location.protocol==='file:')return'';let a=root.PlatdoFriendsEndpoint;
 if(!a){try{const r=await fetch(new URL('multiplayer-config.json',location.href),{cache:'no-cache',credentials:'omit',redirect:'error'});if(!r.ok)return'';a=(await r.json()).serverUrl;}catch(_){return'';}}
 return typeof a==='string'&&/^https?:\/\//.test(a)?a.replace(/\/+$/,''):'';
}
async function ask(){
 try{if(net()?.getState?.().social)return;const a=await hostAddress();if(!a)return;const r=await fetch(a+'/season',{cache:'no-store',credentials:'omit'});if(!r.ok)return;const view=await r.json();if(!net()?.getState?.().social)setSeason(view);}catch(_){}
}
let wired=false;
function wire(){
 if(wired||!net()?.subscribe)return;wired=true;net().subscribe(social);
 root.addEventListener('platdo:season',e=>setSeason(e.detail));
 root.addEventListener('platdo:gift',e=>giftNotice(e.detail));
 ask();setInterval(ask,90000);
}
// ---- the simulation -------------------------------------------------------------------------------------------------
function step(sim,dt,audio){
 const R=X();if(!R||!sim||!sim.world)return;const st=R.state(sim);if(audio)root.CityXmas.audio=audio;
 if(sim.onlineRoom){
  /* the host's word for this room: on or off, and which snowmen are gone */
  const v=sim.onlineXmas;st.remote=true;st.solo=false;const on=!!(v&&v.on);if(st.on!==on)R.setOn(sim,on);
  if(v&&v.gone!==st.goneText){R.load(sim,v.gone||'');st.goneText=v.gone;}
  if(st.weatherBefore!==undefined)st.weatherBefore=undefined;
  R.step(sim,dt,[],null);return;
 }
 if(st.remote||!st.solo||st.season!==S.season||st.on!==S.christmas||st.owner!==sim.profile){st.remote=false;st.goneText=undefined;R.solo(sim,S.christmas,S.season);st.owner=sim.profile;}
 /* a gray winter sky while it is on (the day and night carry on as always); the weather it interrupted comes back after */
 const w=sim.profile&&sim.profile.world;
 if(w){if(st.on){if(w.weather!=='overcast'){if(st.weatherBefore===undefined)st.weatherBefore=w.weather;w.weather='overcast';}}else if(st.weatherBefore!==undefined){w.weather=st.weatherBefore;st.weatherBefore=undefined;}}
 if(st.on)R.step(sim,dt,[sim.player],(a,fn)=>fn());
 gifts(sim);
}
// ---- the Christmas Day gift ----------------------------------------------------------------------------------------
function gifts(sim){
 if(!S.gifts.length||sim.onlineRoom)return;const p=sim.profile,owned=p&&p.wardrobe&&p.wardrobe.owned,C=root.CityConfig;if(!Array.isArray(owned)||!C)return;
 if(p._xmasGifts===S.gifts.join())return;p._xmasGifts=S.gifts.join();let added=false;
 for(const id of S.gifts)if(C.shopItemById[id]?.gift&&!owned.includes(id)){owned.push(id);added=true;}
 if(added){sim.dirty=true;try{root.CityStyle?.publish?.(p);}catch(_){}}
}
function giftNotice(detail){
 const title='Christmas Gift Unlocked!',text='A Santa hat and a matching outfit are in your City wardrobe.';
 let shown=false;try{const phone=root.PlatdoCity?.phone;if(phone&&root.PlatdoCity?.sim){phone.notify(title,text);shown=true;}}catch(_){}
 /* the phone's own notice when the City is open; otherwise a banner */if(!shown)banner(title,text);
}
function banner(title,text){
 css();document.getElementById('xmasGiftBanner')?.remove();const el=document.createElement('div');el.id='xmasGiftBanner';el.setAttribute('role','status');
 el.innerHTML='<span aria-hidden="true">'+GIFT+'</span><div><strong></strong><small></small></div>';el.querySelector('strong').textContent=title;el.querySelector('small').textContent=text;
 document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('in'));setTimeout(()=>{el.classList.remove('in');setTimeout(()=>el.remove(),500);},7000);
}
// ---- the Admin Panel app ---------------------------------------------------------------------------------------------
const APP=['adminpanel','Admin Panel'],ui={value:null,loading:false,pending:false,target:null,error:'',note:''};
const GIFT='<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1.500-3.500-6-3.500-5.500-.8C6.800 7.800 10 7 12 7Zm0 0c1.500-3.500 6-3.500 5.500-.8C17.200 7.800 14 7 12 7Z" fill="none" stroke="currentColor" stroke-width="1.700" stroke-linejoin="round"/></svg>';
const FLAKE='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3v18M4.200 7.500l15.600 9M19.800 7.500l-15.600 9M12 6.500 9.700 4.300M12 6.500l2.300-2.200M12 17.500l-2.300 2.200M12 17.500l2.300 2.200M7 9.200 4 8.600M7 9.200 6 6.300M17 14.800l3 .6M17 14.800l1 2.900M7 14.800l-3 .6M7 14.800l-1 2.900M17 9.200l3-.6M17 9.200l1-2.900" fill="none" stroke="currentColor" stroke-width="1.600" stroke-linecap="round"/></svg>';
const COVER=['#4a4e5c','#15161b','<path d="M30 9.500 46 15v13.500c0 10.800-6.800 17.900-16 21.500-9.200-3.600-16-10.700-16-21.500V15Z" fill="#fff" fill-opacity=".96"/><path d="m22.500 30 5.600 5.800 10-11.600" fill="none" stroke="#23252d" stroke-width="4.200" stroke-linecap="round" stroke-linejoin="round"/>'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shownValue=()=>ui.pending?!!ui.target:(ui.value??S.christmas);
function page(){
 const on=shownValue(),busy=ui.pending||ui.loading;
 return `<div class="pl-settings xa"><div class="xa-hero"><span class="os-icon pl-icon">${root.CityPhoneLook?.cover?.('adminpanel')||''}</span><div><strong>Admin Panel</strong><small>Owner controls for Platdo City</small></div></div>
 <h3 class="pl-h">Seasonal event</h3><div class="pl-group"><button type="button" data-phone="xaToggle" class="pl-row xa-row" role="switch" aria-checked="${on}" aria-busy="${busy}" aria-label="Christmas Mode"><span class="xa-ic">${FLAKE}</span><span>Christmas Mode</span><i class="xa-spin" ${busy?'':'hidden'}></i><i class="xa-switch ${on?'on':''} ${busy?'busy':''}"></i></button></div>
 <p class="os-fine xa-note">This setting applies to all players. It turns the Christmas event on or off in every room at once: the snow, the lights, the trees and the snowman hunt.</p>
 <p class="xa-status ${ui.error?'bad':''}" role="status" aria-live="polite">${esc(status())}</p></div>`;
}
function status(){if(ui.error)return ui.error;if(ui.loading)return'Checking the saved setting\u{2026}';if(ui.pending)return'Saving\u{2026}';if(ui.note)return ui.note;return shownValue()?'On for everyone.':'Off for everyone.';}
/* change what is on the screen without drawing the page again, so the switch slides */
function paint(phone){
 const box=phone?.ctx?.container,row=box?.querySelector('.xa-row');if(!row||phone.page!==APP[0]){if(phone?.active&&phone.page===APP[0])phone.render();return;}
 const on=shownValue(),busy=ui.pending||ui.loading;row.setAttribute('aria-checked',on);row.setAttribute('aria-busy',busy);
 const sw=row.querySelector('.xa-switch'),spin=row.querySelector('.xa-spin');sw.classList.toggle('on',on);sw.classList.toggle('busy',busy);spin.hidden=!busy;
 const line=box.querySelector('.xa-status');if(line){line.textContent=status();line.classList.toggle('bad',!!ui.error);}
}
const plain=e=>{const m=String(e&&e.message||e||'');return /Unknown action/.test(m)?'This account is not allowed to change this.':/Too many/.test(m)?'Too many changes in a short time. Wait a moment and try again.':/closed|lost|offline|timed? ?out|connect/i.test(m)?'The game server could not be reached. Nothing was changed.':m?m+' Nothing was changed.':'The change was not saved.';};
async function load(phone){
 if(ui.loading||ui.pending)return;ui.loading=true;ui.error='';ui.note='';paint(phone);
 try{const view=await net().action('season',{kind:'get'});if(typeof view?.christmas!=='boolean')throw Error('The game server did not answer.');ui.value=view.christmas;setSeason(view);}
 catch(e){ui.error=/Unknown action/.test(String(e?.message))?plain(e):'The saved setting could not be checked. '+plain(e).replace(' Nothing was changed.','');}
 finally{ui.loading=false;paint(phone);}
}
async function toggle(phone){
 if(ui.pending||ui.loading)return;if(!S.admin){closeIfOpen();return;}
 const before=ui.value??S.christmas,next=!before;ui.pending=true;ui.target=next;ui.error='';ui.note='';paint(phone);
 try{const view=await net().action('season',{kind:'set',christmas:next});if(typeof view?.christmas!=='boolean')throw Error('The game server did not confirm the change.');
  ui.value=view.christmas;setSeason(view);ui.note=view.christmas?'Saved. Christmas Mode is on for everyone.':'Saved. Christmas Mode is off for everyone.';}
 catch(e){ui.value=before;ui.error=plain(e);}
 finally{ui.pending=false;ui.target=null;paint(phone);}
}
function draw(phone){css();phone.shell(page(),'Admin Panel');}
function addIcon(phone){
 const grid=phone?.ctx?.container?.querySelector('.pl-grid, .os-app-grid');if(!grid||grid.querySelector('[data-value="adminpanel"]'))return;
 const holder=document.createElement('div');holder.innerHTML=phone.appIcon?phone.appIcon(APP):'<button type="button" data-phone="app" class="os-app" data-value="adminpanel">Admin Panel</button>';
 const b=holder.firstElementChild;if(!b)return;b.onclick=e=>{e.preventDefault();e.stopPropagation();phone.action('app','adminpanel',b);};grid.appendChild(b);
}
const thePhone=()=>{try{return root.PlatdoCity?.phone||null;}catch(_){return null;}};
function closeIfOpen(){const p=thePhone();ui.value=null;ui.error='';ui.note='';if(p?.active&&p.page===APP[0]){p.page='home';p.render();}else refreshHome();}
function refreshHome(){const p=thePhone();if(p?.active&&p.page==='home')p.render();}
function install(){
 const Phone=root.CityPhone?.Phone;if(!Phone||Phone.prototype._xmasAdmin)return;Phone.prototype._xmasAdmin=true;
 if(root.CityPhoneLook?.COVERS)root.CityPhoneLook.COVERS.adminpanel=COVER;
 const baseRender=Phone.prototype.render;Phone.prototype.render=function(){
  if(this.active&&this.page===APP[0]){if(!S.admin){this.page='home';return baseRender.call(this);}try{draw(this);}catch(e){this.fail?.(e);}return;}
  const out=baseRender.call(this);if(this.active&&this.page==='home'&&S.admin){try{addIcon(this);}catch(_){}}return out;};
 const baseAction=Phone.prototype.action;Phone.prototype.action=async function(a,value,button){
  if(a==='xaToggle'){try{await toggle(this);}catch(e){this.fail?.(e);}return;}
  if(a==='app'&&value===APP[0]){if(!S.admin)return;ui.value=null;ui.error='';ui.note='';const out=await baseAction.call(this,a,value,button);load(this);return out;}
  return baseAction.call(this,a,value,button);};
 /* the setting changed somewhere else while the page is open: show it */
 subs.add(()=>{const p=thePhone();if(p?.active&&p.page===APP[0]&&!ui.pending&&!ui.loading){ui.value=S.christmas;paint(p);}});
}
function css(){if(document.getElementById('xmasAppStyle'))return;const el=document.createElement('style');el.id='xmasAppStyle';el.textContent=`
#cityRoot .platdo-os .xa-hero{display:flex;align-items:center;gap:12px;margin:4px 2px 6px}
#cityRoot .platdo-os .xa-hero .pl-icon{width:52px;height:52px;flex:none;border-radius:13px;overflow:hidden;display:block}
#cityRoot .platdo-os .xa-hero strong{display:block;font-size:19px;font-weight:700;letter-spacing:-.3px}
#cityRoot .platdo-os .xa-hero small{display:block;color:var(--os-muted);font-size:12.5px;margin-top:1px}
#cityRoot .platdo-os .xa-row{width:100%;min-height:50px;cursor:pointer;text-align:left}
#cityRoot .platdo-os .xa-row>span:nth-child(2){flex:1;font-size:15px}
#cityRoot .platdo-os .xa-ic{flex:none;width:29px;height:29px;border-radius:7px;display:grid;place-items:center;background:linear-gradient(#58c0f5,#1f86d6);color:#fff}
#cityRoot .platdo-os .xa-switch{flex:none;display:block;width:51px;height:31px;border-radius:16px;background:#78788052;position:relative;transition:background-color .28s ease,opacity .2s ease}
#cityRoot .platdo-os .xa-switch::after{content:"";position:absolute;left:2px;top:2px;width:27px;height:27px;border-radius:50%;background:#fff;box-shadow:0 3px 8px #00000026,0 1px 1px #00000029;transition:transform .28s cubic-bezier(.3,1.3,.5,1)}
#cityRoot .platdo-os .xa-switch.on{background:#34c759}
#cityRoot .platdo-os .xa-switch.on::after{transform:translateX(20px)}
#cityRoot .platdo-os .xa-switch.busy{opacity:.55}
#cityRoot .platdo-os .xa-row[aria-busy=true]{cursor:progress}
#cityRoot .platdo-os .xa-spin{flex:none;width:16px;height:16px;border-radius:50%;border:2px solid var(--os-muted);border-top-color:transparent;animation:xaSpin .7s linear infinite;margin-right:2px}
#cityRoot .platdo-os .xa-spin[hidden]{display:none}
#cityRoot .platdo-os .xa-note{margin:8px 6px 0}
#cityRoot .platdo-os .xa-status{margin:10px 6px 0;font-size:13px;color:var(--os-muted);min-height:18px}
#cityRoot .platdo-os .xa-status.bad{color:var(--pl-red,#ff453a);font-weight:600}
@keyframes xaSpin{to{transform:rotate(360deg)}}
#xmasGiftBanner{position:fixed;left:50%;top:18px;z-index:2147483000;transform:translate(-50%,-140%);display:flex;align-items:center;gap:12px;max-width:min(92vw,440px);padding:12px 18px 12px 14px;border-radius:16px;background:#14161cf2;color:#fff;font:14px/1.3 -apple-system,"Segoe UI",system-ui,sans-serif;box-shadow:0 10px 30px #0008;transition:transform .45s cubic-bezier(.2,1.2,.4,1);pointer-events:none}
#xmasGiftBanner.in{transform:translate(-50%,0)}
#xmasGiftBanner>span{flex:none;width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(#e2414a,#a81f28)}
#xmasGiftBanner strong{display:block;font-size:15px}#xmasGiftBanner small{display:block;color:#ffffffc7;font-size:12.5px;margin-top:2px}
@media (prefers-reduced-motion:reduce){#cityRoot .platdo-os .xa-switch,#cityRoot .platdo-os .xa-switch::after,#xmasGiftBanner{transition:none}#cityRoot .platdo-os .xa-spin{animation-duration:2s}}`;document.head.appendChild(el);}
install();wire();if(!wired){const t=setInterval(()=>{wire();if(wired)clearInterval(t);},500);}
root.CityXmas={get on(){return S.christmas;},get season(){return S.season;},get admin(){return S.admin;},subscribe(fn){subs.add(fn);return()=>subs.delete(fn);},step};
})(typeof window!=='undefined'?window:globalThis);
