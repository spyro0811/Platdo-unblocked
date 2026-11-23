
/* PLATDO City: seated dining in online rooms (V9.6). Game only; the room host keeps the seats (world.cjs dine()).
 * - "Sit down" at any free seat of a restaurant. One player per seat, so friends can share a table; a seat someone
 *   else sits on is not offered. Everyone sees everyone seated (the host sends the sitting pose).
 * - Seated, the interact key opens the table panel: the restaurant's menu book (the same book as in single player),
 *   the dishes in front of you with Eat buttons, and Stand up. The vehicle or jump key also stands you up.
 * - An order is priced and paid on the host with your room money and comes to the table after a few seconds; the
 *   dishes in front of every seated player are drawn for everyone, and one goes when it is eaten.
 * The single-player meal (waiter, kitchen, the paused screen) stays single player. */
(function(root){'use strict';
const doc=root.document;if(!doc)return;
const Dn=()=>root.CityDining,Food=()=>root.CityDiningFood,Menu=()=>root.CityDiningMenu;
const SLOTS=[[0,.63],[-.29,.58],[.29,.58],[-.3,.86],[.3,.86],[0,.99]],TOP=.786,MAX=6;
const at=(q,r,u,f)=>{const s=Math.sin(q.yaw),c=Math.cos(q.yaw);return{x:q.x+c*r+s*f,y:q.y+u,z:q.z-s*r+c*f};};
const money=n=>'$'+Math.round(n).toLocaleString('en-US'),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let ui=null,cart={},api=null,busy=false,ctx=null,last=0,seatCache=new Map();
// ---- where the seats are ------------------------------------------------------------------------------------------
function placeAt(sim){const p=sim.player;return sim.world.interiorAt?.(p.x,p.z,(p.y||0)+1)||sim.world.services.find(s=>s.dining?.patio&&p.x>s.dining.patio.x0-.5&&p.x<s.dining.patio.x1+.5&&p.z>s.dining.patio.z0-.2&&p.z<s.dining.patio.z1+1.3)||null;}
function seatById(sim,id){if(!id)return null;if(seatCache.has(id))return seatCache.get(id);for(const svc of sim.world.services||[])if(svc.dining)for(const t of svc.dining.tables)for(const q of t.seats||[])if(q.id===id){const r={svc,seat:q};seatCache.set(id,r);return r;}return null;}
function heldBy(sim){const m=new Map();for(const n of sim.npcs||[])if(n.diningSeat)m.set(n.diningSeat,n);if(sim.player?.diningSeat)m.set(sim.player.diningSeat,sim.player);return m;}
function seatNear(sim){
 if(!sim?.onlineRoom)return null;const p=sim.player;if(!p||p.diningSeat||p.health<=0||p.vehicleId||p.physical||p.ragdoll?.active||p.mode==='swimming')return null;
 const svc=placeAt(sim);if(!svc?.dining)return null;const held=heldBy(sim);let best=null,bd=1.45;
 svc.dining.tables.forEach((t,i)=>{for(const q of t.seats||[]){if(held.has(q.id))continue;const d=Math.min(Math.hypot(p.x-q.x,p.z-q.z),Math.hypot(p.x-q.stand.x,p.z-q.stand.z)+.3);if(d<bd&&Math.abs((p.y||0)-q.y)<1.4){bd=d;best={svc,table:i,seat:q};}}});
 return best;}
function seated(sim){return!!(sim?.onlineRoom&&sim.player?.diningSeat);}
// ---- the prompt and the interact key --------------------------------------------------------------------------------
function prompt(sim){if(!sim?.onlineRoom)return null;if(seated(sim))return{action:'interact',text:(sim.player.diningDishes?.length?'Eat or order':'Order from the menu')};const s=seatNear(sim);return s?{action:'interact',text:'Sit down'}:null;}
// c: {tool(name,params) -> Promise of the host's reply, toast(text)}
function interact(sim,input,c){
 if(!sim?.onlineRoom||!input?.interactPressed)return false;ctx=c||ctx;
 if(seated(sim)){input.interactPressed=false;open(sim);return true;}
 const s=seatNear(sim);if(!s)return false;input.interactPressed=false;
 ctx.tool('dine',{kind:'sit',service:s.svc.id,seat:s.seat.id}).catch(e=>ctx.toast?.(e.message));return true;}
// ---- the table panel ----------------------------------------------------------------------------------------------------
const CSS=`#dineOnline{position:absolute;inset:0;z-index:31;pointer-events:none;font-family:"Segoe UI",system-ui,sans-serif;color:#fff}
#dineOnline [data-dno-menu]{position:absolute;inset:0;pointer-events:none}#dineOnline [data-dno-menu]>*{pointer-events:auto}
#dineOnline .dno-panel{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);min-width:min(560px,92vw);max-width:94vw;padding:12px 14px;border-radius:16px;background:rgba(18,20,24,.86);box-shadow:0 8px 30px #0008;pointer-events:auto;backdrop-filter:blur(6px)}
#dineOnline .dno-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 8px}#dineOnline .dno-head b{font-size:16px}#dineOnline .dno-head span{font-size:12px;opacity:.75}
#dineOnline .dno-dishes{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}#dineOnline .dno-dish{display:flex;align-items:center;gap:8px;padding:6px 8px 6px 10px;border-radius:10px;background:rgba(255,255,255,.08);font-size:13px}
#dineOnline button{font:inherit;border:0;border-radius:10px;padding:8px 14px;font-weight:700;cursor:pointer;background:#f2efe8;color:#1b1d21;min-height:0}#dineOnline button.alt{background:rgba(255,255,255,.14);color:#fff}#dineOnline button.small{padding:4px 10px;font-size:12px}#dineOnline button[disabled]{opacity:.45;cursor:default}
#dineOnline .dno-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}#dineOnline .dno-note{font-size:12.5px;opacity:.85;margin:0 0 8px}`;
function ensure(){
 if(ui&&ui.root.isConnected)return ui;if(!doc.getElementById('dineOnlineCss')){const s=doc.createElement('style');s.id='dineOnlineCss';s.textContent=CSS;doc.head.append(s);}
 const host=doc.getElementById('cityRoot')||doc.body,el=doc.createElement('div');el.id='dineOnline';el.innerHTML='<div data-dno-menu></div><div class="dno-panel" role="dialog" aria-label="Your table"></div>';host.append(el);
 ui={root:el,menu:el.querySelector('[data-dno-menu]'),panel:el.querySelector('.dno-panel')};
 el.addEventListener('click',e=>{const b=e.target.closest('[data-dno]');if(!b)return;e.stopPropagation();e.preventDefault();act(b.dataset.dno,b.dataset.value);});
 root.addEventListener('keydown',keys,true);return ui;}
function keys(e){if(!ui)return;if(e.code==='Escape'){if(Menu()?.isOpen?.()&&api){Menu().close();api=null;paint();}else close();e.preventDefault();e.stopPropagation();}}
function sim(){return root.PlatdoCity?.sim||null;}
function open(s){ensure();try{doc.exitPointerLock?.();}catch(e){}paint();loop();}
function close(){if(Menu()?.isOpen?.())Menu().close();api=null;cart={};if(ui){ui.root.remove();root.removeEventListener('keydown',keys,true);}ui=null;}
function isOpen(){return!!ui;}
function paint(){
 if(!ui)return;const S=sim();if(!seated(S)){close();return;}const at=seatById(S,S.player.diningSeat),place=at&&Dn()?.place(at.svc.id),dishes=S.player.diningDishes||[];
 let h=`<div class="dno-head"><b>${esc(place?.name||'Your table')}</b><span>You have ${money(S.profile?.wallet||0)}</span></div>`;
 if(dishes.length)h+=`<div class="dno-dishes">${dishes.map(([id],i)=>{const d=Dn()?.dish(id);return`<span class="dno-dish">${esc(d?.name||'Dish')}<button class="small" data-dno="eat" data-value="${i}" ${busy?'disabled':''}>Eat</button></span>`;}).join('')}</div>`;
 else h+=`<p class="dno-note">${busy?'Your order is on its way.':'Nothing on the table yet. Open the menu to order: it is paid with your money in this room.'}</p>`;
 h+=`<div class="dno-row"><button data-dno="menu" ${busy||dishes.length>=MAX?'disabled':''}>Menu</button><button class="alt" data-dno="stand">Stand up</button><button class="alt" data-dno="close">Close</button></div>`;
 ui.panel.innerHTML=h;ui.panel.style.display=api?'none':'';}
function act(k,v){
 const S=sim();if(!S||!ctx)return;
 if(k==='close'){close();return;}
 if(k==='stand'){close();ctx.tool('dine',{kind:'stand'}).catch(e=>ctx.toast?.(e.message));return;}
 if(k==='eat'){busy=true;paint();ctx.tool('dine',{kind:'eat',index:+v||0}).then(r=>{busy=false;const d=Dn()?.dish(r?.ate);if(d)ctx.toast?.('You eat the '+d.name.toLowerCase()+'.');setTimeout(paint,250);},e=>{busy=false;ctx.toast?.(e.message);paint();});return;}
 if(k==='menu'){openMenu(S);return;}}
// the menu book: the same one as at a single-player table
function openMenu(S){
 const at=seatById(S,S.player.diningSeat),place=at&&Dn()?.place(at.svc.id);if(!place||!Menu())return;cart={};
 const free=()=>MAX-(S.player.diningDishes||[]).length,count=()=>Object.values(cart).reduce((a,b)=>a+b,0),sum=()=>Object.entries(cart).reduce((t,[id,n])=>t+(Dn().dish(id)?.price||0)*n,0);
 api={place,scene:root.PlatdoCity?.scene,cart,tab:0,get wallet(){return S.profile?.wallet||0;},get free(){return free()-count();},lite:['potato','low'].includes(root.PlatdoCity?.scene?.graphics?.id),sound:()=>{},
  chose(id,delta){const d=Dn().dish(id);if(!d||d.place!==place.id)return{ok:false};const have=cart[id]||0;if(delta>0){if(count()>=free())return{ok:false,message:'Your table is full. Eat something first.'};if((S.profile?.wallet||0)<sum()+d.price)return{ok:false,message:'You cannot afford that. You have '+money(S.profile?.wallet||0)+'.'};cart[id]=have+1;}else if(have>0){cart[id]=have-1;if(!cart[id])delete cart[id];}return{ok:true};},
  order(){if(!count()||busy)return false;const items=Object.entries(cart).filter(e=>e[1]>0);busy=true;Menu().close();api=null;cart={};paint();
   ctx.tool('dine',{kind:'order',items}).then(r=>{if(r?.message)ctx.toast?.(r.message);setTimeout(()=>{busy=false;paint();},5600);},e=>{busy=false;ctx.toast?.(e.message);paint();});return true;},
  close(){Menu().close();api=null;paint();}};
 Menu().mount(ui.menu);Menu().open(api);paint();}
// the panel follows the table (the order arriving, a dish eaten) and the menu book needs its frame clock
function loop(){if(!ui)return;const now=performance.now(),dt=Math.min(.05,(now-(last||now))/1000);last=now;try{Menu()?.frame?.(dt);}catch(e){}
 const S=sim();if(!seated(S)){close();return;}const key=JSON.stringify(S.player.diningDishes||null)+'|'+(S.profile?.wallet||0)+'|'+busy+'|'+!!api;if(key!==ui.key){ui.key=key;paint();}
 requestAnimationFrame(loop);}
// ---- the dishes on the tables, for everyone seated ------------------------------------------------------------------
let group=null;const shown=new Map();
function draw(scene){
 const S=sim(),T=root.THREE,env=scene?.environment||scene?.scene;if(!T||!env||!Food())return;
 if(!S?.onlineRoom){if(group){for(const g of shown.values())g.parent?.remove(g);shown.clear();}return;}
 if(!group){group=new T.Group();group.name='dine-online';env.add(group);}else if(group.parent!==env)env.add(group);
 const want=new Map();for(const e of[S.player,...(S.npcs||[])])if(e?.diningSeat&&e.diningDishes?.length)want.set(e.diningSeat,e.diningDishes);
 for(const[id,g]of shown){const w=want.get(id);if(!w||g.userData.key!==JSON.stringify(w)){group.remove(g);shown.delete(id);}}
 for(const[id,dishes]of want){if(shown.has(id))continue;const where=seatById(S,id);if(!where)continue;const q=where.seat,g=new T.Group();g.userData.key=JSON.stringify(dishes);
  for(const[dishId,slot]of dishes){const d=Dn()?.dish(dishId),sl=SLOTS[slot];if(!d||!sl)continue;try{const m=Food().build(d.dish),h=at(q,sl[0],TOP,sl[1]);m.position.set(h.x,h.y,h.z);m.rotation.y=q.yaw;g.add(m);}catch(e){}}
  group.add(g);shown.set(id,g);}}
root.CityDiningOnline={seatNear,seated,prompt,interact,open,close,isOpen,draw,seatById,_ui:()=>ui};
})(typeof globalThis!=='undefined'?globalThis:this);
