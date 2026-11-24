
/* PLATDO City: Platdo Pay (V12.8). Game only.
 * A phone app for sending your City money to your friends and to the other players in your online room.
 * - It is the SAME payment as the one in Messages: the host checks it and moves the money in one step (lobbies.cjs pay:
 *   friends anywhere, anyone in your City room, 1 to 1,000,000, never more than you have, never yourself), with one key
 *   per payment so a payment can never be made twice, and keeps the same records Messages shows. There is no money of
 *   its own: the balance is your City wallet, the one shown everywhere else.
 * - Single player has nobody to pay (payments move online City money), so there the app shows your balance and says so.
 * - Pages: home (balance card, search, friends, players in your lobby, recent payments), pay (keypad), confirm, sending,
 *   done, error, all payments, one payment. It follows the phone's light or dark look.
 * - Money you receive (from Platdo Pay or Messages) shows as a Platdo Pay notification (city-phone-messages.js). */
(function(root){'use strict';
const Phone=root.CityPhone?.Phone;if(!Phone||typeof document==='undefined')return;
const LOGO='assets/images/4d3666e23b3b57f9ba0b.jpg';root.PlatdoAppPics=Object.assign(root.PlatdoAppPics||{},{platinumpay:LOGO});
const net=()=>root.PlatdoFriends;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Math.round(Number(n)||0).toLocaleString('en-US');
const MAX=1000000;
const social=()=>{try{return net()?.getState?.()?.social||null;}catch(_){return null;}};
const meCode=()=>social()?.me?.code||null;
const nick=p=>social()?.nicknames?.[p?.code]||p?.name||'Player';
const okPhoto=s=>/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s||'');
const TINTS=['#5e6ad2','#2f9e73','#c2410c','#7c3aed','#0e7490','#b45309','#be185d','#4d7c0f'];
const tint=p=>TINTS[(Number.isInteger(p?.avatar)?p.avatar:[...String(p?.code||p?.name||'?')].reduce((a,c)=>a+c.charCodeAt(0),0))%TINTS.length];
const face=(p,size='')=>`<span class="pp-face ${size}" style="--t:${tint(p)}">${okPhoto(p?.photo)?`<img src="${esc(p.photo)}" alt="">`:esc(nick(p).slice(0,1).toUpperCase())}</span>`;
const ICON={search:'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12.6 12.6 17 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
 clock:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
 out:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 14 14 6M8 6h6v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 in:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M14 6 6 14M12 14H6V8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 del:'<svg viewBox="0 0 28 20" aria-hidden="true"><path d="M9 2h15a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9l-7-8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m13 7 6 6m0-6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'};
// ---- the people you can pay ---------------------------------------------------------------------------------------
function people(phone){const so=social(),me=so?.me?.code,room=(phone.sim?.onlineRoom&&so?.session?.mode==='city'?so.session.players||[]:[]).filter(p=>p?.code&&p.code!==me),inRoom=new Set(room.map(p=>p.code));
 const friends=(so?.rows||[]).filter(r=>r.rel==='friends'&&r.code&&r.code!==me).map(f=>({...f,inRoom:inRoom.has(f.code)})),fset=new Set(friends.map(f=>f.code));
 /* a friend who is also in your room is listed once, under Friends, marked as in your lobby */return{friends,lobby:room.filter(p=>!fset.has(p.code)).map(p=>({...p,inRoom:true}))};}
const eligible=(phone,code)=>{const g=people(phone);return g.friends.find(p=>p.code===code)||g.lobby.find(p=>p.code===code)||null;};
const ready=phone=>!!phone.sim?.onlineRoom&&net()?.getState?.()?.availability==='online'&&!!meCode();
const wallet=phone=>Math.max(0,Math.floor(Number(phone.sim?.profile?.wallet)||0));
// ---- the payments, from the same records Messages uses (one list per player, kept while the page lives) -------------
const HIST=new Map(),NAMES=new Map();let histFor=null,histAt=0,histBusy=false;
/* who a code is: a friend, someone in the room, someone in Messages, or someone paid in this session */
function who(code,phone){const so=social(),hit=(so?.rows||[]).find(r=>r.code===code)||(so?.session?.players||[]).find(p=>p.code===code)||phone?.messageState?.people?.get?.(code)||NAMES.get(code);return hit?{...hit,code}:{code,name:'Player'};}
function keep(m){const me=meCode();if(!m||!(m.pay>0)||!me||![m.from,m.to].includes(me))return false;if(histFor!==me){HIST.clear();histFor=me;}if(HIST.has(m.id))return false;HIST.set(m.id,m);return true;}
function history(){const me=meCode();if(histFor!==me)return[];return[...HIST.values()].sort((a,b)=>b.time-a.time);}
function fromMessages(phone){for(const list of phone.messageState?.threads?.values?.()||[])for(const m of list)keep(m);}
async function loadHistory(phone,force){if(!ready(phone)||histBusy)return;if(!force&&Date.now()-histAt<60000)return;histBusy=true;histAt=Date.now();const g=people(phone),codes=[...g.friends,...g.lobby].map(p=>p.code).slice(0,16);let added=false;
 try{for(const code of codes){try{const list=await net().action('phoneHistory',{code});for(const m of list||[])if(keep(m))added=true;}catch(_){}}}finally{histBusy=false;}if(added&&phone.active&&phone.page==='platinumpay')phone.render();}
window.addEventListener('platdo:message',ev=>{const m=ev?.detail?.message||ev?.detail;if(keep(m)){const ph=root.PlatdoCity?.phone;if(ph?.active&&ph.page==='platinumpay'&&st(ph).view==='home')ph.render();}});
// ---- state and pages ----------------------------------------------------------------------------------------------
function st(phone){return phone.ppState||(phone.ppState={view:'home',q:'',to:null,amount:'',key:null,error:'',busy:false,last:null,shown:null,detail:null,tap:0});}
const timeText=t=>{const d=new Date(t),now=new Date(),same=d.toDateString()===now.toDateString(),h=d.getHours(),m=String(d.getMinutes()).padStart(2,'0'),clock=((h+11)%12+1)+':'+m+(h<12?' am':' pm');return same?clock:d.toLocaleDateString('en-US',{month:'short',day:'numeric'})+', '+clock;};
function row(p){const status=p.inRoom?'In your lobby':(p.status||'');return `<button type="button" class="pp-row" data-phone="ppTo" data-value="${esc(p.code)}">${face(p)}<span class="pp-row-main"><b>${esc(nick(p))}</b>${status?`<small class="${p.inRoom?'pp-here':/online|playing/i.test(status)?'pp-on':''}">${p.inRoom?'<i></i>':''}${esc(status)}</small>`:''}</span><span class="pp-chev" aria-hidden="true">›</span></button>`;}
function lists(phone){const s=st(phone),q=s.q.trim().toLowerCase(),g=people(phone),hit=p=>!q||nick(p).toLowerCase().includes(q)||String(p.name||'').toLowerCase().includes(q),f=g.friends.filter(hit),l=g.lobby.filter(hit);
 const empty=(t,sub)=>`<div class="pp-empty"><b>${t}</b><span>${sub}</span></div>`;
 return `<section class="pp-sec"><h2>Friends</h2><div class="pp-group">${f.length?f.map(row).join(''):q?empty('No friends match','Try another name.'):empty('No friends yet','Add friends in the Friends app to pay them from anywhere.')}</div></section>`+
  `<section class="pp-sec"><h2>Players in your lobby</h2><div class="pp-group">${l.length?l.map(row).join(''):q?empty('Nobody here matches','Try another name.'):empty('Nobody else here','Players who join your City room show up here.')}</div></section>`;}
function txRow(m,tap=true){const me=meCode(),out=m.from===me,ph=root.PlatdoCity?.phone,other=out?who(m.to,ph):{...who(m.from,ph),name:m.name||who(m.from,ph).name,photo:m.photo||who(m.from,ph).photo};
 return `<${tap?'button type="button" data-phone="ppTx" data-value="'+esc(m.id)+'"':'div'} class="pp-row pp-tx">${face(other)}<span class="pp-row-main"><b>${esc(nick(other))}</b><small>${out?'Sent':'Received'} · ${esc(timeText(m.time))}</small></span><span class="pp-amt ${out?'out':'in'}"><i>${out?ICON.out:ICON.in}</i>${out?'-':'+'}${money(m.pay)}</span></${tap?'button':'div'}>`;}
function home(phone){const s=st(phone),w=wallet(phone),on=ready(phone),recent=history().slice(0,4);
 let h=`<div class="pp pp-in"><header class="pp-head"><div><h1>Platdo Pay</h1><p>Send money instantly</p></div>${on?`<button type="button" class="pp-round" data-phone="ppHist" aria-label="All payments">${ICON.clock}</button>`:''}</header>`+
  `<div class="pp-card"><div class="pp-card-top"><img src="${LOGO}" alt="" class="pp-card-logo"><span>${on?'Platdo City · Online':'Platdo City'}</span></div><small>Balance</small><b class="pp-bal" data-pp-bal="${w}">${money(s.shown??w)}</b></div>`;
 if(!on)return h+`<div class="pp-note"><b>Payments are for online play</b><span>Platdo Pay sends your online City money. Join an online City room to pay your friends and the people in your lobby.</span></div></div>`;
 h+=`<label class="pp-search">${ICON.search}<input type="search" data-pp-search placeholder="Search people" value="${esc(s.q)}" autocomplete="off" spellcheck="false" aria-label="Search people"><button type="button" class="pp-clear" data-phone="ppClear" aria-label="Clear search"${s.q?'':' hidden'}>×</button></label><div data-pp-list>${lists(phone)}</div>`;
 h+=`<section class="pp-sec"><h2>Recent</h2><div class="pp-group">${recent.length?recent.map(m=>txRow(m)).join(''):`<div class="pp-empty"><b>No payments yet</b><span>Money you send or receive shows up here.</span></div>`}</div>${history().length>4?`<button type="button" class="pp-link" data-phone="ppHist">See all payments</button>`:''}</section></div>`;return h;}
function payPage(phone){const s=st(phone),p=eligible(phone,s.to)||s.toInfo||{code:s.to,name:'Player'},w=wallet(phone),n=Number(s.amount||0),over=n>w,ok=n>=1&&!over&&!!eligible(phone,s.to)&&!s.busy;
 const keys=['1','2','3','4','5','6','7','8','9','','0','del'].map(k=>k===''?'<span></span>':`<button type="button" class="pp-key" data-phone="ppKey" data-value="${k}" aria-label="${k==='del'?'Delete':k}">${k==='del'?ICON.del:k}</button>`).join('');
 let h=`<div class="pp pp-pay pp-in"><div class="pp-to">${face(p,'big')}<small>Send money to</small><b>${esc(nick(p))}</b></div><div class="pp-amount${n?'':' zero'}" data-k="${s.tap}"><sup>$</sup>${n.toLocaleString('en-US')}</div><p class="pp-left${over?' bad':''}">${over?'More than your balance of '+money(w):'Balance after: '+money(w-n)}</p>`;
 if(s.error)h+=`<div class="pp-err" role="alert"><b>Payment not sent</b><span>${esc(s.error)}</span></div>`;
 h+=`<div class="pp-keys">${keys}</div><button type="button" class="pp-send" data-phone="ppSend"${ok?'':' disabled'}>${s.busy?'<i class="pp-spin"></i>Sending…':s.error&&s.key?'Try again · '+money(n):'Send '+money(n)}</button>`;
 if(s.view==='confirm')h+=`<div class="pp-sheet" role="dialog" aria-label="Confirm payment"><div class="pp-sheet-card">${face(p,'mid')}<p>Send <b>${money(n)}</b> to <b>${esc(nick(p))}</b>?</p><small>It comes out of your City money straight away.</small><button type="button" class="pp-send" data-phone="ppConfirm"${s.busy?' disabled':''}>${s.busy?'<i class="pp-spin"></i>Sending…':'Send '+money(n)}</button><button type="button" class="pp-ghost" data-phone="ppCancel"${s.busy?' disabled':''}>Cancel</button></div></div>`;
 return h+'</div>';}
function donePage(phone){const s=st(phone),l=s.last||{};return `<div class="pp pp-done"><div class="pp-check"><svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="31"/><path d="M22 37.5 31.5 47 50 27"/></svg></div><h1>Payment Sent</h1><b class="pp-done-amt">${money(l.amount)}</b><p>to ${esc(l.name||'Player')}</p><button type="button" class="pp-send" data-phone="ppDone">Done</button></div>`;}
function histPage(phone){const all=history();return `<div class="pp pp-in"><header class="pp-head"><div><h1>Payments</h1><p>Sent and received</p></div></header><div class="pp-group">${all.length?all.map(m=>txRow(m)).join(''):`<div class="pp-empty"><b>No payments yet</b><span>${histBusy?'Loading your payments…':'Money you send or receive shows up here.'}</span></div>`}</div></div>`;}
function detailPage(phone){const s=st(phone),m=HIST.get(s.detail);if(!m)return histPage(phone);const me=meCode(),out=m.from===me,other=out?who(m.to,phone):{...who(m.from,phone),name:m.name||who(m.from,phone).name,photo:m.photo||who(m.from,phone).photo};
 return `<div class="pp pp-detail pp-in">${face(other,'big')}<small>${out?'You sent':'You received'}</small><b class="pp-detail-amt ${out?'out':'in'}">${out?'-':'+'}${money(m.pay)}</b><div class="pp-group"><div class="pp-kv"><span>${out?'To':'From'}</span><b>${esc(nick(other))}</b></div><div class="pp-kv"><span>When</span><b>${esc(new Date(m.time).toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'}))}</b></div>${m.text?`<div class="pp-kv"><span>Note</span><b>${esc(m.text)}</b></div>`:''}<div class="pp-kv"><span>Status</span><b class="pp-ok">Completed</b></div></div><p class="pp-fine">The same payment shows in your Messages with ${esc(nick(other))}.</p></div>`;}
function render(phone){const s=st(phone);if(s.view==='home'||!ready(phone)&&!['done'].includes(s.view)){s.view='home';fromMessages(phone);loadHistory(phone,false);}
 const body=s.view==='pay'||s.view==='confirm'?payPage(phone):s.view==='done'?donePage(phone):s.view==='history'?histPage(phone):s.view==='detail'?detailPage(phone):home(phone);
 style();phone.shell(body,s.view==='home'?'Platdo Pay':s.view==='history'||s.view==='detail'?'Payments':s.view==='done'?'Platdo Pay':'Send money');after(phone);}
/* rows drawn again by the search box get the same click handling the phone gives every button (bind) */
function wire(phone,el){if(!el)return;el.querySelectorAll('[data-phone]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();if(!b.disabled)phone.action(b.dataset.phone,b.dataset.value,b);});}
function after(phone){const box=phone.ctx?.container;if(!box)return;const s=st(phone),input=box.querySelector('[data-pp-search]');
 if(input){input.addEventListener('input',()=>{s.q=input.value.slice(0,40);const list=box.querySelector('[data-pp-list]');if(list){list.innerHTML=lists(phone);wire(phone,list);}const c=box.querySelector('.pp-clear');if(c)c.hidden=!s.q;});input.addEventListener('keydown',e=>e.stopPropagation());if(s.focusSearch){s.focusSearch=false;input.focus({preventScroll:true});}}
 animateBalance(phone);}
/* the balance counts up or down to the new amount when it changes */
function animateBalance(phone){const s=st(phone),el=phone.ctx?.container?.querySelector('[data-pp-bal]');if(!el)return;const to=Number(el.dataset.ppBal)||0,from=s.shown??to;if(from===to){s.shown=to;return;}const t0=performance.now(),D=650;
 const tick=()=>{const k=Math.min(1,(performance.now()-t0)/D),e=1-Math.pow(1-k,3),v=Math.round(from+(to-from)*e);el.textContent=money(v);s.shown=v;if(k<1&&el.isConnected){if(!requestAnimationFrame(tick))setTimeout(tick,16);}else{s.shown=to;el.textContent=money(to);}};
 el.classList.toggle('up',to>from);el.classList.toggle('down',to<from);requestAnimationFrame(tick);setTimeout(()=>{if(s.shown!==to&&el.isConnected){s.shown=to;el.textContent=money(to);}},D+400);}
// ---- what the buttons do ------------------------------------------------------------------------------------------
async function action(phone,a,value){const s=st(phone);
 if(a==='ppTo'){const p=eligible(phone,value);if(!p)return;NAMES.set(p.code,{code:p.code,name:p.name,photo:p.photo,avatar:p.avatar});s.to=value;s.toInfo=p;s.amount='';s.key=null;s.error='';s.view='pay';}
 else if(a==='ppKey'){if(s.busy)return;let v=s.amount;if(value==='del')v=v.slice(0,-1);else if(/^\d$/.test(value)){v=(v==='0'?'':v)+value;if(Number(v)>MAX)return;}v=v.replace(/^0+(?=\d)/,'');if(v===s.amount)return;s.amount=v;s.key=null;s.error='';s.tap++;}
 else if(a==='ppSend'){const n=Number(s.amount||0);if(s.busy||!(n>=1)||n>wallet(phone)||!eligible(phone,s.to))return;s.view='confirm';}
 else if(a==='ppCancel'){if(s.busy)return;s.view='pay';}
 else if(a==='ppConfirm'){await pay(phone);return;}
 else if(a==='ppDone'){s.view='home';s.to=null;s.amount='';s.key=null;s.error='';s.last=null;}
 else if(a==='ppClear'){s.q='';s.focusSearch=true;}
 else if(a==='ppHist'){s.view='history';loadHistory(phone,true);}
 else if(a==='ppTx'){s.detail=value;s.view='detail';}
 phone.render();}
/* one payment: the host checks everything again and moves the money in one step; the key stays the same if you try again after an error, so it can never be paid twice */
async function pay(phone){const s=st(phone),n=Number(s.amount||0),p=eligible(phone,s.to);if(s.busy)return;
 if(!p){s.error=nick(s.toInfo||{})+' can no longer be paid from here.';s.view='pay';phone.render();return;}
 if(!(n>=1)||n>MAX||!Number.isSafeInteger(n)){s.view='pay';phone.render();return;}if(n>wallet(phone)){s.error='You do not have that much money.';s.view='pay';phone.render();return;}
 s.busy=true;s.error='';s.key=s.key||('pay-'+(root.crypto?.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2,10)));phone.render();
 let result=null,err='';try{result=await net().action('phonePay',{code:p.code,amount:n,note:'',id:s.key});}catch(e){err=String(e?.message||e||'The payment did not go through.');}
 if(!result&&/already sent/i.test(err)){result={};err='';}
 s.busy=false;
 if(err){s.error=err;s.view='pay';if(phone.active&&phone.page==='platinumpay')phone.render();return;}
 if(result?.message){keep(result.message);/* the same message in Messages, if its conversation is open in this session */const t=phone.messageState?.threads;if(t){const list=t.get(p.code)||[];if(!list.some(m=>m.id===result.message.id)){list.push(result.message);t.set(p.code,list.sort((x,y)=>x.time-y.time).slice(-150));}}}
 if(Number.isFinite(result?.wallet)&&phone.sim?.profile)phone.sim.profile.wallet=result.wallet;
 s.last={amount:n,name:nick(p)};s.key=null;s.amount='';s.view='done';if(phone.active&&phone.page==='platinumpay')phone.render();}
// ---- the phone ----------------------------------------------------------------------------------------------------
const baseRender=Phone.prototype.render;Phone.prototype.render=function(){if(this.active&&this.page==='platinumpay'){try{render(this);}catch(e){this.fail?.(e);}return;}return baseRender.call(this);};
const baseAction=Phone.prototype.action;Phone.prototype.action=async function(a,value,button){
 if(typeof a==='string'&&/^pp[A-Z]/.test(a)){try{await action(this,a,value);}catch(e){this.fail?.(e);}return;}
 /* the back arrow at the top steps back inside the app; the home bar still goes home */
 if(a==='home'&&this.page==='platinumpay'&&!button?.classList?.contains('os-home-indicator')){const s=st(this);if(s.busy)return;const back={pay:'home',confirm:'pay',history:'home',detail:'history',done:'home'}[s.view];if(back){if(s.view==='done'){s.to=null;s.amount='';s.last=null;}s.view=back;this.render();return;}}
 return baseAction.call(this,a,value,button);};
/* keep the open page current: a new balance counts to its value, people joining or leaving the room appear and go */
let sig='';setInterval(()=>{try{const ph=root.PlatdoCity?.phone;if(!ph?.active||ph.page!=='platinumpay')return;const s=st(ph);if(s.busy)return;const g=people(ph),next=[ready(ph),g.friends.map(p=>p.code+(p.inRoom?'*':'')+p.status).join(','),g.lobby.map(p=>p.code).join(',')].join('|');
 if(s.view==='home'){if(next!==sig){const had=sig;sig=next;if(had){const box=ph.ctx?.container,list=box?.querySelector('[data-pp-list]');if(list&&box.querySelector('[data-pp-search]')===document.activeElement){list.innerHTML=lists(ph);wire(ph,list);}else ph.render();return;}}const el=ph.ctx?.container?.querySelector('[data-pp-bal]'),w=wallet(ph);if(el&&Number(el.dataset.ppBal)!==w){el.dataset.ppBal=String(w);animateBalance(ph);}}
 else if(s.view==='pay'){sig=next;const el=ph.ctx?.container?.querySelector('.pp-left');if(el&&!s.busy){const n=Number(s.amount||0),w=wallet(ph);const txt=n>w?'More than your balance of '+money(w):'Balance after: '+money(w-n);if(el.textContent!==txt)ph.render();}}}catch(_){}},700);
// ---- the look: an Apple-like payment app that follows the phone's light or dark setting ------------------------------
function style(){if(document.getElementById('pp-style'))return;const el=document.createElement('style');el.id='pp-style';el.textContent=`
#cityRoot .platdo-os .pp{--pp-bg:#f2f2f7;--pp-card:#fff;--pp-text:#1c1c1e;--pp-sub:#8a8a8e;--pp-sep:rgba(60,60,67,.14);--pp-fill:rgba(118,118,128,.12);--pp-btn:#111;--pp-btn-text:#fff;--pp-green:#1f9d55;--pp-red:#d70015;color:var(--pp-text);font-family:-apple-system,"SF Pro Text","SF Pro Display","Segoe UI Variable","Segoe UI",system-ui,sans-serif;display:flex;flex-direction:column;gap:12px;padding:2px 2px 14px;letter-spacing:-.01em}
#cityRoot .platdo-os.os-dark .pp{--pp-bg:#000;--pp-card:#1c1c1e;--pp-text:#fff;--pp-sub:#8d8d93;--pp-sep:rgba(84,84,88,.55);--pp-fill:rgba(118,118,128,.24);--pp-btn:#fff;--pp-btn-text:#000;--pp-green:#30d158;--pp-red:#ff453a}
#cityRoot .platdo-os[data-page="platinumpay"] .os-content{background:var(--pp-page,#f2f2f7)}#cityRoot .platdo-os.os-dark[data-page="platinumpay"] .os-content{--pp-page:#000}
#cityRoot .platdo-os .pp-in{animation:ppIn .32s cubic-bezier(.2,.8,.2,1)}
@keyframes ppIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
#cityRoot .platdo-os .pp-head{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;padding:2px 2px 0}
#cityRoot .platdo-os .pp-head h1{margin:0;font-size:27px;font-weight:750;letter-spacing:-.03em;line-height:1.1}#cityRoot .platdo-os .pp-head p{margin:2px 0 0;font-size:12.5px;color:var(--pp-sub)}
#cityRoot .platdo-os .pp-round{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--pp-fill);color:var(--pp-text);border:0;padding:0;flex:none}#cityRoot .platdo-os .pp-round svg{width:19px;height:19px}
#cityRoot .platdo-os .pp-card{position:relative;overflow:hidden;border-radius:18px;padding:14px 16px 16px;min-height:118px;display:flex;flex-direction:column;justify-content:flex-end;color:#f5f5f7;background:linear-gradient(140deg,#3a3a3e 0%,#1d1d20 52%,#0c0c0e 100%);box-shadow:0 10px 24px rgba(0,0,0,.22),inset 0 0 0 .5px rgba(255,255,255,.14)}
#cityRoot .platdo-os .pp-card::after{content:"";position:absolute;inset:-40% -10% auto auto;width:70%;height:90%;background:radial-gradient(closest-side,rgba(255,255,255,.12),transparent);transform:rotate(-18deg);pointer-events:none}
#cityRoot .platdo-os .pp-card-top{position:absolute;top:12px;left:14px;right:14px;display:flex;align-items:center;justify-content:space-between;font-size:11px;color:rgba(245,245,247,.7);letter-spacing:.02em}
#cityRoot .platdo-os .pp-card-logo{width:30px;height:30px;border-radius:8px;object-fit:cover;box-shadow:0 1px 3px rgba(0,0,0,.4)}
#cityRoot .platdo-os .pp-card small{font-size:11.5px;color:rgba(245,245,247,.66);letter-spacing:.04em;text-transform:uppercase}
#cityRoot .platdo-os .pp-bal{font-size:31px;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums;line-height:1.1;transition:color .4s}#cityRoot .platdo-os .pp-bal.up{color:#c7f9d4}#cityRoot .platdo-os .pp-bal.down{color:#fff}
#cityRoot .platdo-os .pp-note,#cityRoot .platdo-os .pp-err{display:grid;gap:3px;padding:12px 14px;border-radius:14px;background:var(--pp-card);font-size:12.5px;line-height:1.4}#cityRoot .platdo-os .pp-note span{color:var(--pp-sub)}
#cityRoot .platdo-os .pp-err{background:rgba(215,0,21,.09);color:var(--pp-red)}#cityRoot .platdo-os .pp-err span{color:var(--pp-text);opacity:.85}
#cityRoot .platdo-os .pp-search{display:flex;align-items:center;gap:7px;height:36px;padding:0 10px;border-radius:11px;background:var(--pp-fill);color:var(--pp-sub)}
#cityRoot .platdo-os .pp-search svg{width:15px;height:15px;flex:none}#cityRoot .platdo-os .pp-search input{flex:1;min-width:0;height:100%;border:0;outline:0;background:none;color:var(--pp-text);font:inherit;font-size:14px;-webkit-appearance:none;appearance:none}#cityRoot .platdo-os .pp-search input::placeholder{color:var(--pp-sub)}#cityRoot .platdo-os .pp-search input::-webkit-search-cancel-button{display:none}
#cityRoot .platdo-os .pp-clear{width:18px;height:18px;border-radius:50%;border:0;padding:0;display:grid;place-items:center;background:var(--pp-sub);color:var(--pp-card);font-size:13px;line-height:1;flex:none}
#cityRoot .platdo-os .pp-sec{display:grid;gap:6px}#cityRoot .platdo-os .pp-sec h2{margin:4px 4px 0;font-size:12px;font-weight:600;color:var(--pp-sub);text-transform:uppercase;letter-spacing:.05em}
#cityRoot .platdo-os .pp-group{border-radius:14px;background:var(--pp-card);overflow:hidden}
#cityRoot .platdo-os .pp-row{display:flex;align-items:center;gap:11px;width:100%;min-height:54px;padding:8px 12px;border:0;border-radius:0;background:none;color:inherit;text-align:left;font:inherit;position:relative;transition:background .15s,transform .12s}
#cityRoot .platdo-os .pp-row+.pp-row::before{content:"";position:absolute;top:0;left:61px;right:0;height:.5px;background:var(--pp-sep)}
#cityRoot .platdo-os button.pp-row:active{background:var(--pp-fill);transform:scale(.985)}
#cityRoot .platdo-os .pp-face{width:38px;height:38px;border-radius:50%;flex:none;display:grid;place-items:center;overflow:hidden;background:var(--t);color:#fff;font-weight:650;font-size:16px}#cityRoot .platdo-os .pp-face img{width:100%;height:100%;object-fit:cover}
#cityRoot .platdo-os .pp-face.mid{width:52px;height:52px;font-size:21px}#cityRoot .platdo-os .pp-face.big{width:68px;height:68px;font-size:27px;box-shadow:0 4px 14px rgba(0,0,0,.16)}
#cityRoot .platdo-os .pp-row-main{flex:1;min-width:0;display:grid;gap:1px}#cityRoot .platdo-os .pp-row-main b{font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cityRoot .platdo-os .pp-row-main small{font-size:12px;color:var(--pp-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:5px}#cityRoot .platdo-os .pp-row-main small.pp-on{color:var(--pp-green)}
#cityRoot .platdo-os .pp-row-main small.pp-here{color:var(--pp-text);opacity:.75}#cityRoot .platdo-os .pp-row-main small i{width:7px;height:7px;border-radius:50%;background:var(--pp-green);flex:none}
#cityRoot .platdo-os .pp-chev{color:var(--pp-sub);font-size:22px;line-height:1;opacity:.7}
#cityRoot .platdo-os .pp-amt{font-size:14.5px;font-weight:650;font-variant-numeric:tabular-nums;display:flex;align-items:center;gap:4px;white-space:nowrap}#cityRoot .platdo-os .pp-amt i{width:16px;height:16px;display:grid;opacity:.75}#cityRoot .platdo-os .pp-amt svg{width:16px;height:16px}
#cityRoot .platdo-os .pp-amt.in{color:var(--pp-green)}#cityRoot .platdo-os .pp-amt.out{color:var(--pp-text)}
#cityRoot .platdo-os .pp-empty{display:grid;gap:2px;padding:16px 14px;text-align:center;font-size:12.5px}#cityRoot .platdo-os .pp-empty span{color:var(--pp-sub)}
#cityRoot .platdo-os .pp-link{border:0;background:none;color:var(--pp-text);font:inherit;font-size:13px;font-weight:600;padding:6px;opacity:.8}
#cityRoot .platdo-os .pp-pay{min-height:100%;gap:8px;position:relative}
#cityRoot .platdo-os .pp-to{display:grid;justify-items:center;gap:4px;padding-top:4px}#cityRoot .platdo-os .pp-to small{font-size:12px;color:var(--pp-sub)}#cityRoot .platdo-os .pp-to b{font-size:17px;font-weight:650}
#cityRoot .platdo-os .pp-amount{text-align:center;font-size:52px;font-weight:700;letter-spacing:-.04em;font-variant-numeric:tabular-nums;line-height:1.05;margin-top:6px;animation:ppTap .18s ease-out}#cityRoot .platdo-os .pp-amount sup{font-size:.48em;vertical-align:.62em;margin-right:2px;font-weight:600}#cityRoot .platdo-os .pp-amount.zero{color:var(--pp-sub)}
@keyframes ppTap{from{transform:scale(1.045)}to{transform:none}}
#cityRoot .platdo-os .pp-left{margin:0;text-align:center;font-size:12.5px;color:var(--pp-sub)}#cityRoot .platdo-os .pp-left.bad{color:var(--pp-red)}
#cityRoot .platdo-os .pp-keys{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:auto}
#cityRoot .platdo-os .pp-key{height:48px;border:0;border-radius:14px;background:var(--pp-card);color:var(--pp-text);font:inherit;font-size:24px;font-weight:500;display:grid;place-items:center;transition:background .12s,transform .1s;box-shadow:0 1px 0 rgba(0,0,0,.04)}
#cityRoot .platdo-os .pp-key:active{background:var(--pp-fill);transform:scale(.96)}#cityRoot .platdo-os .pp-key svg{width:26px;height:20px}
#cityRoot .platdo-os .pp-send{width:100%;height:50px;border:0;border-radius:14px;background:var(--pp-btn);color:var(--pp-btn-text);font:inherit;font-size:16.5px;font-weight:650;display:flex;align-items:center;justify-content:center;gap:9px;transition:opacity .2s,transform .12s;letter-spacing:-.01em}
#cityRoot .platdo-os .pp-send:active:not(:disabled){transform:scale(.98)}#cityRoot .platdo-os .pp-send:disabled{opacity:.32}
#cityRoot .platdo-os .pp-ghost{width:100%;height:44px;border:0;border-radius:14px;background:none;color:var(--pp-text);font:inherit;font-size:15px;font-weight:600}
#cityRoot .platdo-os .pp-spin{width:16px;height:16px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:ppSpin .7s linear infinite}@keyframes ppSpin{to{transform:rotate(360deg)}}
#cityRoot .platdo-os .pp-sheet{position:absolute;inset:-6px -6px -10px;display:flex;align-items:flex-end;background:rgba(0,0,0,.32);border-radius:16px;animation:ppFade .2s ease-out;z-index:3}
#cityRoot .platdo-os .pp-sheet-card{width:100%;display:grid;justify-items:center;gap:8px;padding:18px 14px 12px;border-radius:20px 20px 16px 16px;background:var(--pp-card);animation:ppUp .28s cubic-bezier(.2,.8,.2,1);text-align:center}
#cityRoot .platdo-os .pp-sheet-card p{margin:2px 0 0;font-size:16px}#cityRoot .platdo-os .pp-sheet-card small{font-size:12px;color:var(--pp-sub);margin-bottom:4px}
@keyframes ppFade{from{opacity:0}to{opacity:1}}@keyframes ppUp{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}
#cityRoot .platdo-os .pp-done{min-height:100%;align-items:center;justify-content:center;text-align:center;gap:6px;animation:ppFade .3s ease-out}
#cityRoot .platdo-os .pp-check{width:86px;height:86px;margin-bottom:6px;animation:ppPop .45s cubic-bezier(.2,1.3,.4,1)}#cityRoot .platdo-os .pp-check svg{width:100%;height:100%}
#cityRoot .platdo-os .pp-check circle{fill:var(--pp-green);opacity:.14;stroke:var(--pp-green);stroke-width:3;stroke-dasharray:195;stroke-dashoffset:195;animation:ppDraw .55s .05s ease-out forwards}
#cityRoot .platdo-os .pp-check path{fill:none;stroke:var(--pp-green);stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:44;stroke-dashoffset:44;animation:ppDraw .35s .45s ease-out forwards}
@keyframes ppDraw{to{stroke-dashoffset:0}}@keyframes ppPop{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}
#cityRoot .platdo-os .pp-done h1{margin:0;font-size:24px;font-weight:750;letter-spacing:-.02em;animation:ppRise .4s .25s both}#cityRoot .platdo-os .pp-done-amt{font-size:38px;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums;animation:ppRise .4s .32s both}
#cityRoot .platdo-os .pp-done p{margin:0 0 18px;color:var(--pp-sub);font-size:14px;animation:ppRise .4s .38s both}#cityRoot .platdo-os .pp-done .pp-send{animation:ppRise .4s .44s both}
@keyframes ppRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
#cityRoot .platdo-os .pp-detail{align-items:center;text-align:center;gap:6px;padding-top:6px}#cityRoot .platdo-os .pp-detail>small{color:var(--pp-sub);font-size:12.5px;margin-top:4px}
#cityRoot .platdo-os .pp-detail-amt{font-size:36px;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums;margin-bottom:6px}#cityRoot .platdo-os .pp-detail-amt.in{color:var(--pp-green)}
#cityRoot .platdo-os .pp-detail .pp-group{width:100%;text-align:left}#cityRoot .platdo-os .pp-kv{display:flex;justify-content:space-between;gap:12px;padding:11px 14px;font-size:13.5px;position:relative}#cityRoot .platdo-os .pp-kv+.pp-kv::before{content:"";position:absolute;top:0;left:14px;right:0;height:.5px;background:var(--pp-sep)}
#cityRoot .platdo-os .pp-kv span{color:var(--pp-sub)}#cityRoot .platdo-os .pp-kv b{font-weight:600;text-align:right;overflow-wrap:anywhere}#cityRoot .platdo-os .pp-ok{color:var(--pp-green)}
#cityRoot .platdo-os .pp-fine{margin:4px 0 0;font-size:11.5px;color:var(--pp-sub)}
@media (prefers-reduced-motion:reduce){#cityRoot .platdo-os .pp *,#cityRoot .platdo-os .pp{animation:none!important;transition:none!important}#cityRoot .platdo-os .pp-check circle,#cityRoot .platdo-os .pp-check path{stroke-dashoffset:0}}`;document.head.appendChild(el);}
root.CityPlatinumPay={render,action,people,history,eligible,ready};
})(typeof globalThis!=='undefined'?globalThis:this);
