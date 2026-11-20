
/* PLATDO City phone: the look (V5.4). Game only. Loaded after the Camera and Photos apps.
 * A drawn cover for every app (each one different), a new lock screen and home screen, drawn status and
 * navigation icons in place of text symbols, and new screens for Wallet, Notes, Clock, Control Center,
 * Recent apps, Settings and the Drone notice. Every other app keeps its content and gets the shared styling.
 * Nothing here changes what an app does: the same actions and the same saved settings are used. */
(function(root){'use strict';
const Phone=root.CityPhone?.Phone,Kit=root.CityPhoneKit,apps=root.CityPhone?.apps,wallpapers=root.CityPhone?.wallpapers;if(!Phone||!Kit||!apps||!wallpapers||typeof document==='undefined')return;
const esc=Kit.esc,ic=Kit.ic,btn=(a,html,extra='')=>'<button type="button" data-phone="'+a+'" '+extra+'>'+html+'</button>',money=n=>(n<0?'-':'')+'$'+Math.abs(Math.round(Number(n)||0)).toLocaleString('en-US');
Object.assign(Kit.PATHS,{
 recents:'M8.5 4.5H19a.5.5 0 0 1 .5.5v10.5M5 8h10.5a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z',lock:'M7.5 11V8a4.5 4.5 0 0 1 9 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1ZM12 14.5V17',
 moon:'M19 14.5A7.5 7.5 0 0 1 9.5 5 7.5 7.5 0 1 0 19 14.5Z',bell:'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5ZM10 20.5a2 2 0 0 0 4 0',camera:'M4 8h3.5L9 5.5h6L16.5 8H20v11H4zM12 10.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
 arrowUp:'M12 19V5M6 11l6-6 6 6',arrowDown:'M12 5v14M6 13l6 6 6-6',chevronRight:'m9 6 6 6-6 6',cloud:'M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.6 1.5A3.3 3.3 0 0 1 17 18H7Z',
 rain:'M7 16a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.6 1.5A3.3 3.3 0 0 1 17 16H7ZM8.5 18.5l-.8 2M12.5 18.5l-.8 2M16.5 18.5l-.8 2',text:'M3.5 18 8 6h1l4.500 12M5.200 14h6.600M15 18l3-8h.6l3 8M15.900 15.500h4.800'});
// ---- app covers: one drawing per app on its own colour ------------------------------------------------------
const W='#fff';
const COVERS={
 friends:['#3fd6b4','#0f7f72',`<circle cx="41" cy="25.500" r="6" fill="${W}" fill-opacity=".6"/><path d="M38 34.300c6.900.500 12 4.500 12 11.200V47H40.500v-2c0-4.300-.9-7.900-2.500-10.700z" fill="${W}" fill-opacity=".6"/><circle cx="24" cy="23" r="7.500" fill="${W}"/><path d="M10 45c0-8.500 6.300-13 14-13s14 4.500 14 13v2H10z" fill="${W}"/>`],
 garage:['#7c9cbf','#2b4562',`<path d="M9 29 30 13l21 16v19H9z" fill="${W}"/><rect x="16.500" y="30" width="27" height="18" rx="1.500" fill="#2b4562"/><path d="M16.500 35.500h27M16.500 41h27" stroke="${W}" stroke-width="1.600" stroke-opacity=".75" fill="none"/>`],
 motors:['#ff9363','#d23434',`<circle cx="30" cy="30" r="16" fill="none" stroke="${W}" stroke-width="5"/><path d="M14.500 28.500h11M34.500 28.500h11M30 34.500v11" stroke="${W}" stroke-width="4.200" stroke-linecap="round" fill="none"/><circle cx="30" cy="30" r="4.800" fill="${W}"/>`],
 maps:['#8fdc92','#2c9a62',`<path d="M0 40 21 23l15 13 24-20v44H0z" fill="#eef5df"/><path d="M-3 53 23 32l15 13L63 24" fill="none" stroke="#f3c341" stroke-width="5.500"/><path d="M41 10a8.500 8.500 0 0 1 8.500 8.500C49.500 25 41 34 41 34s-8.500-9-8.500-15.500A8.500 8.500 0 0 1 41 10z" fill="#ee4444"/><circle cx="41" cy="18.500" r="3.200" fill="${W}"/>`],
 doordash:['#35d8bd','#0d8a83',`<path d="M23 26v-5.500a7 7 0 0 1 14 0V26" fill="none" stroke="${W}" stroke-width="3" stroke-linecap="round"/><path d="M16.500 24h27l3 24.300a3 3 0 0 1-3 3.200h-27a3 3 0 0 1-3-3.200z" fill="${W}"/><path d="M23.500 35.500c1.500 3.300 4 5 6.500 5s5-1.700 6.500-5" fill="none" stroke="#0d8a83" stroke-width="2.800" stroke-linecap="round"/>`],
 drone:['#58c1e0','#18597a',`<path d="M20 20l20 20M40 20 20 40" stroke="${W}" stroke-width="3.400" stroke-linecap="round" fill="none"/><g fill="none" stroke="${W}" stroke-width="2.600"><circle cx="16.500" cy="16.500" r="6.800"/><circle cx="43.500" cy="16.500" r="6.800"/><circle cx="16.500" cy="43.500" r="6.800"/><circle cx="43.500" cy="43.500" r="6.800"/></g><rect x="23" y="23" width="14" height="14" rx="4" fill="${W}"/><circle cx="30" cy="30" r="2.600" fill="#18597a"/>`],
 camera:['#f4f5f7','#b4b9c2',`<path d="M21.500 20.500 24 15h12l2.500 5.500z" fill="#2a2d33"/><rect x="10" y="20" width="40" height="27" rx="6.500" fill="#2a2d33"/><circle cx="30" cy="33.500" r="9.500" fill="#596070"/><circle cx="30" cy="33.500" r="6.300" fill="#14161a"/><circle cx="27.700" cy="31.200" r="1.900" fill="#9cc1f2"/><circle cx="43.500" cy="26" r="1.700" fill="#ffd60a"/>`],
 photos:['#ffbf6e','#ee4f7c',`<circle cx="43" cy="18.500" r="6.200" fill="#fff6c9"/><path d="M1 50 22 24l14 17 5.500-6.500L57 50z" fill="${W}"/><path d="M30 50l11.500-15.500L57 50z" fill="#ffd3c4"/>`],
 jobs:['#f8cb5c','#c58412',`<ellipse cx="21" cy="49.500" rx="9" ry="2.600" fill="${W}" fill-opacity=".45"/><path d="M21 12v37" stroke="${W}" stroke-width="3.800" stroke-linecap="round" fill="none"/><path d="M22.900 14h23.600l-5.500 8.500 5.500 8.500H22.900z" fill="${W}"/>`],
 wallet:['#44648c','#16233a',`<path d="M14 19 36.500 12a3 3 0 0 1 3.900 2.900V19" fill="${W}" fill-opacity=".6"/><rect x="9.500" y="18.500" width="41" height="28" rx="6.500" fill="${W}"/><rect x="34.500" y="27.500" width="18.500" height="10.500" rx="5.200" fill="#f6c453"/><circle cx="40" cy="32.700" r="2.300" fill="#16233a"/>`],
 wardrobe:['#dc98c6','#84488a',`<path d="M22 12.500 10.500 19l4.800 9.500 5.200-2.500V48h19V26l5.200 2.500L49.500 19 38 12.500c-1.200 3.500-4.200 5.200-8 5.200s-6.800-1.700-8-5.200z" fill="${W}"/>`],
 contacts:['#97abe0','#44548e',`<rect x="13" y="10.500" width="31" height="39" rx="5.500" fill="${W}"/><circle cx="28.500" cy="25" r="5.400" fill="#44548e"/><path d="M19 41c0-5.200 4.200-8.300 9.500-8.300S38 35.800 38 41v1.500H19z" fill="#44548e"/><path d="M46.500 16.500h3v7.500h-3zM46.500 26.200h3v7.500h-3zM46.500 36h3v7.500h-3z" fill="${W}" fill-opacity=".7"/>`],
 messages:['#66e481','#1a9f45',`<path d="M30 12.500c10.800 0 19.500 7 19.500 15.800S40.800 44 30 44c-1.900 0-3.800-.2-5.500-.6L14.500 48.500l2.700-8.700C13 37 10.500 32.900 10.500 28.300c0-8.800 8.700-15.800 19.500-15.800z" fill="${W}"/><g fill="#1a9f45"><circle cx="22.300" cy="28.500" r="2.400"/><circle cx="30" cy="28.500" r="2.400"/><circle cx="37.700" cy="28.500" r="2.400"/></g>`],
 notes:['#fff8dc','#f3e09a',`<rect width="60" height="17" fill="#f2b632"/><path d="M10 27.500h40M10 35.500h40M10 43.500h40M10 51.500h25" stroke="#b9a469" stroke-width="1.700" fill="none"/><g fill="#7a5a12"><circle cx="16" cy="8.500" r="1.900"/><circle cx="30" cy="8.500" r="1.900"/><circle cx="44" cy="8.500" r="1.900"/></g>`],
 clock:['#30343f','#0c0d11',`<circle cx="30" cy="30" r="20.500" fill="${W}"/><g fill="#16181c"><circle cx="30" cy="13.300" r="1.300"/><circle cx="46.700" cy="30" r="1.300"/><circle cx="30" cy="46.700" r="1.300"/><circle cx="13.300" cy="30" r="1.300"/></g><path d="M30 30V17M30 30l9 5.200" stroke="#16181c" stroke-width="3.200" stroke-linecap="round" fill="none"/><path d="M30 30 20.500 40" stroke="#ee4444" stroke-width="1.600" stroke-linecap="round" fill="none"/><circle cx="30" cy="30" r="2.300" fill="#ee4444"/>`],
 settings:['#b0b7c1','#59616c',`<circle cx="30" cy="30" r="15.500" fill="none" stroke="${W}" stroke-width="8.500" stroke-dasharray="7.300 4.870" stroke-linecap="butt"/><circle cx="30" cy="30" r="13" fill="${W}"/><circle cx="30" cy="30" r="5.800" fill="#59616c"/>`],
 records:['#5cc7de','#1f6589',`<rect x="12.500" y="33" width="8.500" height="15" rx="2" fill="${W}" fill-opacity=".65"/><rect x="25.700" y="24.500" width="8.500" height="23.500" rx="2" fill="${W}" fill-opacity=".82"/><rect x="39" y="14" width="8.500" height="34" rx="2" fill="${W}"/><path d="M10.500 51h39" stroke="${W}" stroke-width="2.200" stroke-linecap="round" fill="none"/>`],
 inventory:['#d19863','#774a26',`<path d="M22 17.500v-2.500a8 8 0 0 1 16 0v2.500" fill="none" stroke="${W}" stroke-width="3.200"/><rect x="13.500" y="17" width="33" height="34" rx="9.500" fill="${W}"/><rect x="20" y="33.500" width="20" height="11.500" rx="3.200" fill="#774a26" fill-opacity=".88"/><path d="M20.500 25.800h19" stroke="#774a26" stroke-width="2.600" stroke-linecap="round" stroke-opacity=".6" fill="none"/>`],
 return:['#97d6b6','#3a8469',`<path d="M16 29.500V48.500h28V29.500L30 17z" fill="${W}"/><path d="M10.500 30.500 30 13l19.500 17.500" fill="none" stroke="${W}" stroke-width="4.600" stroke-linecap="round" stroke-linejoin="round"/><rect x="25.700" y="35.500" width="8.600" height="13" rx="1.600" fill="#3a8469"/>`],
 tools:['#87a3cc','#374c72',`<g transform="rotate(-45 30 30)"><rect x="28" y="9" width="4" height="23" rx="1.300" fill="${W}" fill-opacity=".72"/><rect x="26" y="31" width="8" height="20" rx="3.600" fill="${W}" fill-opacity=".72"/></g><g transform="rotate(45 30 30)"><rect x="27" y="21" width="6" height="30" rx="3" fill="${W}"/><circle cx="30" cy="16.500" r="9" fill="${W}"/><rect x="27.200" y="6.500" width="5.600" height="10" fill="#5f7ba6"/></g>`],
 jump:['#ffc655','#ee7717',`<path d="M16 39c2-12.500 8-18.500 14.500-19.500" fill="none" stroke="${W}" stroke-width="2.300" stroke-dasharray="2.500 3.700" stroke-linecap="round" stroke-opacity=".9"/><rect x="7.500" y="42" width="21" height="7.500" rx="2.600" fill="${W}"/><rect x="33.500" y="32.500" width="20" height="7.500" rx="2.600" fill="${W}" fill-opacity=".8"/><rect x="29" y="12" width="12.500" height="12.500" rx="3.200" fill="${W}" transform="rotate(14 35 18)"/>`]};
function cover(id){const c=COVERS[id]||COVERS.tools;return `<svg viewBox="0 0 60 60" aria-hidden="true"><defs><linearGradient id="plg-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient></defs><rect width="60" height="60" fill="url(#plg-${id})"/>${c[2]}</svg>`;}
Phone.prototype.appIcon=function(app){return btn('app',`<span class="os-icon pl-icon">${cover(app[0])}</span><span>${esc(app[1])}</span>`,'class="os-app" data-value="'+app[0]+'" aria-label="'+esc(app[1])+' app"');};
// ---- small helpers ------------------------------------------------------------------------------------------
const night=sim=>{const t=sim.dayTime||0;return t<.25||t>.77;},weatherWord=sim=>String(sim.weather||'clear').toLowerCase();
const weatherIcon=sim=>{const w=weatherWord(sim);return /rain|storm|shower/.test(w)?'rain':/cloud|overcast|fog|mist/.test(w)?'cloud':night(sim)?'moon':'sun';};
const weatherName=sim=>{const w=weatherWord(sim);return w.charAt(0).toUpperCase()+w.slice(1);};
const ago=t=>{const s=Math.max(0,Date.now()/1000-(Number(t)||0));return s<60?'now':s<3600?Math.floor(s/60)+' min ago':s<86400?Math.floor(s/3600)+' h ago':Math.floor(s/86400)+' d ago';};
const DOCK=['wallet','wardrobe','motors','friends'],/* V6.23: one home page for every app */PER=64,GRID=apps.filter(a=>!DOCK.includes(a[0]));
const STATUS='<svg viewBox="0 0 50 13" width="50" height="13" aria-hidden="true"><g fill="currentColor"><rect x="0" y="8.500" width="3" height="4" rx=".8"/><rect x="4.500" y="6" width="3" height="6.500" rx=".8"/><rect x="9" y="3.500" width="3" height="9" rx=".8"/><rect x="13.500" y="1" width="3" height="11.500" rx=".8"/><rect x="26.500" y="2.700" width="17" height="7.600" rx="1.800"/><rect x="46.800" y="4.300" width="1.800" height="4.400" rx=".9" fill-opacity=".5"/></g><rect x="24.500" y=".8" width="21" height="11.400" rx="3.300" fill="none" stroke="currentColor" stroke-opacity=".5"/></svg>';
// ---- screens ------------------------------------------------------------------------------------------------
function lockHtml(p){const sim=p.sim,notes=p.data.notifications.filter(n=>!n.seen).slice(0,3);
 return `<div class="pl-lock"><div class="pl-lock-top"><span class="pl-lock-ic">${ic('lock',17)}</span><p class="pl-date">${esc(new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}))}</p><h1 class="pl-time" data-pl-time>${p.time()}</h1><p class="pl-sub">${ic(weatherIcon(sim),15)}<span>${esc(weatherName(sim))} \u{B7} ${esc(Kit.place(sim))}</span></p></div>
 <div class="pl-notices">${notes.map(n=>{const a=apps.find(q=>q[1]===n.title);return `<article class="pl-notice">${btn('dismissNote','\u{2715}',`class="pl-notice-x" data-value="${esc(n.id)}" aria-label="Dismiss notification"`)}<span class="pl-notice-ic">${cover(a?a[0]:'settings')}</span><div><header><strong>${esc(n.title)}</strong><small>${ago(n.at)}</small></header><p>${esc(n.text)}</p>${(()=>{const src=n.image&&root.CityDelivery?.photoFor?.(sim,n.image);return src?`<img class="pl-notice-pic" src="${src}" alt="Photo of the delivered food">`:'';})()}</div></article>`;}).join('')}</div>
 <div class="pl-lock-bottom">${btn('app',ic('camera',20),'class="pl-quick" data-value="camera" aria-label="Open Camera"')}${btn('home','<i></i><span>Swipe up to open</span>','class="pl-unlock"')}${btn('control',ic('controls',20),'class="pl-quick" aria-label="Open Control Center"')}</div></div>`;}
function homeHtml(p){const sim=p.sim,pages=Math.max(1,Math.ceil(GRID.length/PER));p.homePage=Math.max(0,Math.min(p.homePage|0,pages-1));const shown=GRID.slice(p.homePage*PER,p.homePage*PER+PER),last=Object.values(sim.profile.transactions||{}).slice(-1)[0];
 return `<div class="pl-home"><div class="pl-widgets"><div class="pl-w"><small>${esc(Kit.place(sim))}</small><strong data-pl-time>${p.time()}</strong><span>${ic(weatherIcon(sim),14)}${esc(weatherName(sim))}</span></div>${btn('app',`<small>Wallet</small><strong>${money(sim.profile.wallet)}</strong><span>${last?esc((last.amount>0?'+':'')+money(last.amount)+' '+(last.reason||'')):'No activity yet'}</span>`,'class="pl-w pl-w-wallet" data-value="wallet" aria-label="Open Wallet"')}</div>
 <div class="os-app-grid pl-grid">${shown.map(a=>p.appIcon(a)).join('')}</div>
 <div class="pl-dots">${Array.from({length:pages>1?pages:0},(_,i)=>btn('page','<i></i>',`data-value="${i}" class="${i===p.homePage?'on':''}" aria-label="Home page ${i+1}"`)).join('')}</div>
 <div class="os-dock pl-dock">${DOCK.map(id=>p.appIcon(apps.find(a=>a[0]===id))).join('')}</div></div>`;}
function walletHtml(p){const sim=p.sim,tx=Object.entries(sim.profile.transactions||{}).slice(-30).reverse(),mode=String(sim.profile.mode||'');
 return `<div class="pl-balance"><small>Available balance</small><h2>${money(sim.profile.wallet)}</h2><p>Platdo City \u{B7} ${esc(mode.charAt(0).toUpperCase()+mode.slice(1))}</p></div><h3 class="pl-h">Recent activity</h3>${tx.length?`<div class="pl-list">${tx.map(([id,t])=>`<div class="pl-row"><span class="pl-dot ${t.amount>=0?'in':'out'}">${ic(t.amount>=0?'arrowDown':'arrowUp',15)}</span><span class="pl-row-main">${esc(t.reason)}</span><strong class="${t.amount>=0?'pos':'neg'}">${t.amount>0?'+':''}${money(t.amount)}</strong></div>`).join('')}</div>`:'<p class="pl-empty">Your transactions will appear here.</p>'}`;}
function notesHtml(p){const text=String(p.data.notes||'');return `<div class="pl-notes"><textarea data-phone-setting="notes" maxlength="2000" placeholder="Places, ideas, reminders" aria-label="Private notes">${esc(text)}</textarea><p class="os-fine"><span data-pl-count>${text.length}</span> of 2000 characters \u{B7} saved with your City profile</p></div>`;}
const hands=sim=>{const m=Math.floor((sim.dayTime||0)*1440)%1440;return[(m%720)/720*360,(m%60)/60*360];};
function clockHtml(p){const el=p.stopwatch.elapsed+(p.stopwatch.running?performance.now()-p.stopwatch.start:0),[hh,mh]=hands(p.sim);
 return `<div class="pl-clock"><svg class="pl-face" viewBox="0 0 120 120" role="img" aria-label="City clock" data-pl-face><circle class="f" cx="60" cy="60" r="56"/>${Array.from({length:12},(_,i)=>`<line class="t" x1="60" y1="${i%3?11:9}" x2="60" y2="${i%3?15:18}" transform="rotate(${i*30} 60 60)"/>`).join('')}<line class="h" data-h x1="60" y1="62" x2="60" y2="33" transform="rotate(${hh} 60 60)"/><line class="m" data-m x1="60" y1="62" x2="60" y2="18" transform="rotate(${mh} 60 60)"/><circle class="c" cx="60" cy="60" r="3.500"/></svg><h1 data-pl-time>${p.time()}</h1><p>City time</p></div>
 <div class="pl-card pl-sw"><small>Stopwatch</small><h2 data-stopwatch>${(el/1000).toFixed(1)}s</h2><div class="pl-two">${btn('stopwatch',p.stopwatch.running?'Stop':'Start',`class="pl-pill ${p.stopwatch.running?'stop':'go'}"`)}${btn('stopwatchReset','Reset','class="pl-pill"')}</div></div>`;}
function controlHtml(p){const s=p.settings,tile=(action,value,icon,label,on)=>btn(action,`${ic(icon,22)}<span>${label}</span>`,`class="pl-tile ${on?'on':''}" data-value="${value}"`+(action==='toggle'?` role="switch" aria-checked="${!!on}"`:''));
 return `<div class="pl-cc"><div class="pl-slider">${ic('sun',18)}<input data-phone-setting="brightness" type="range" min=".35" max="1" step=".05" value="${s.brightness}" aria-label="Phone brightness"></div><div class="pl-slider">${ic('volume',18)}<input data-phone-setting="volume" type="range" min="0" max="1" step=".05" value="${s.volume}" aria-label="Phone volume"></div>
 <div class="pl-tiles">${tile('toggle','dnd','moon','Do Not Disturb',s.dnd)}${tile('toggle','sounds','bell','Interface sounds',s.sounds)}${tile('toggle','dark','contrast','Dark appearance',s.dark)}${tile('app','camera','camera','Camera',false)}${tile('app','settings','controls','Settings',false)}${tile('lock','','lock','Lock phone',false)}</div></div>`;}
function switcherHtml(p){const list=p.recent.map(id=>apps.find(a=>a[0]===id)).filter(Boolean);return list.length?`<div class="pl-recents">${list.map(a=>btn('app',`<span class="os-icon pl-icon">${cover(a[0])}</span><span>${esc(a[1])}</span>${ic('chevronRight',16)}`,`class="pl-recent" data-value="${a[0]}"`)).join('')}</div>`:'<p class="pl-empty">Open an app to see it here.</p>';}
function settingsHtml(p){const s=p.settings,bytes=p.media.reduce((n,m)=>n+(m.blob?.size||0)+(m.thumbnail?.size||0),0),photos=p.media.filter(m=>m.type==='photo').length,videos=p.media.length-photos,
  sw=(key,label,icon)=>btn('toggle',`${ic(icon,18)}<span>${label}</span><i class="pl-switch ${s[key]?'on':''}"></i>`,`class="pl-row" data-value="${key}" role="switch" aria-checked="${!!s[key]}"`),
  range=(key,label,icon,min,max)=>`<label class="pl-row pl-range">${ic(icon,18)}<span>${label}</span><input data-phone-setting="${key}" type="range" min="${min}" max="${max}" step=".05" value="${s[key]}"></label>`;
 return `<div class="pl-settings"><h3 class="pl-h">Wallpaper</h3><div class="os-wallpapers pl-walls">${wallpapers.map(([id,name,bg])=>btn('wallpaper','<span style="background:'+bg+'"></span><em>'+esc(name)+'</em>',`data-value="${id}" aria-pressed="${id===p.data.wallpaper}"`)).join('')}</div>
 <h3 class="pl-h">Display</h3><div class="pl-group">${sw('dark','Dark appearance','moon')}${range('brightness','Brightness','sun','.35','1')}${range('textSize','Text size','text','.85','1.35')}</div>
 <h3 class="pl-h">Sounds and notifications</h3><div class="pl-group">${sw('sounds','Interface sounds','volume')}${sw('notifications','Notifications','bell')}${sw('dnd','Do Not Disturb','moon')}${range('volume','Volume','volume','0','1')}</div>
 <h3 class="pl-h">Camera</h3><div class="pl-group pl-cam">${root.CityPhoneCamera?root.CityPhoneCamera.settingsHtml(p):''}${sw('recordAudio','Game sound in videos','video')}</div>
 <h3 class="pl-h">Storage</h3><div class="pl-group"><div class="pl-row"><span>${photos} ${photos===1?'photo':'photos'}, ${videos} ${videos===1?'video':'videos'}</span><strong>${(bytes/1048576).toFixed(1)} MB</strong></div>${btn('app',`${ic('library',18)}<span>Manage Photos</span>${ic('chevronRight',16)}`,'class="pl-row" data-value="photos"')}</div>${p.storageError?`<p role="alert" class="pl-alert">${esc(p.storageError)}</p>`:''}<p class="os-fine">Photos and videos are kept in this browser on this device. Save important ones to the device: clearing browser data or resetting City deletes them.</p>
 <h3 class="pl-h">About</h3><div class="pl-group"><div class="pl-row"><span>Platdo Pocket</span><strong>PlatdoOS 2</strong></div>${btn('gameSettings',`${ic('controls',18)}<span>Game settings</span>${ic('chevronRight',16)}`,'class="pl-row"')}</div></div>`;}
function droneHtml(p){return `<div class="pl-card pl-msg"><span class="os-icon pl-icon">${cover('drone')}</span><h3>Sky Scout</h3><p>${esc(p.droneMessage||'')}</p></div>`;}
const SCREENS={lock:[lockHtml,''],home:[homeHtml,''],wallet:[walletHtml,'Wallet'],notes:[notesHtml,'Notes'],clock:[clockHtml,'Clock'],control:[controlHtml,'Control Center'],switcher:[switcherHtml,'Recent apps'],settings:[settingsHtml,'Settings'],drone:[droneHtml,'Drone']};
// ---- styles -------------------------------------------------------------------------------------------------
const CSS=`
@keyframes plNudge{0%,100%{transform:translateY(0);opacity:.6}50%{transform:translateY(-5px);opacity:1}}
#cityRoot .platdo-os.pl{--os-ink:#f5f5f7;--os-muted:#98989f;--os-surface:#000;--os-raised:#1c1c1e;--pl-line:#ffffff1c;--pl-accent:#0a84ff;--pl-green:#30d158;--pl-red:#ff453a;font-family:-apple-system,"SF Pro Text","Segoe UI",system-ui,sans-serif;border-color:#4a4b52;background:linear-gradient(135deg,#5a5b62,#0b0b0d 28%,#232428)}
#cityRoot .platdo-os.pl.os-light{--os-ink:#111114;--os-muted:#6b6b70;--os-surface:#f2f2f7;--os-raised:#fff;--pl-line:#0000001a}
#cityRoot .platdo-os.pl{
 :is(h1,h2,h3,p){font-family:inherit;font-style:normal;text-transform:none;text-shadow:none}
 .pk-ic{display:block;flex:none}
 .os-status{font-size:12.5px;font-weight:600;padding:2px 24px 0 26px}
 .os-status button{display:flex;align-items:center;min-height:22px}
 .os-app-header{height:40px;padding:0 9px 4px;border-bottom:0}
 .os-app-header button{width:30px;height:30px;min-height:0;padding:0;border-radius:50%;display:grid;place-items:center;background:var(--os-raised)}
 .os-app-header strong{font-size:15px;font-weight:650;letter-spacing:-.2px}
 .os-home-bar button{display:grid;place-items:center;color:var(--os-muted)}
 .os-home-indicator span{height:5px;width:118px}
 &[data-page=home] .os-screen,&[data-page=lock] .os-screen{background:var(--phone-wallpaper);color:#fff}
 &[data-page=home] .os-screen::before,&[data-page=lock] .os-screen::before{content:"";position:absolute;inset:0;background:linear-gradient(#00000061,#0000 24%,#0000 60%,#00000080);pointer-events:none}
 &[data-page=home] :is(.os-content,.os-home-bar,.os-status,.os-app-header),&[data-page=lock] :is(.os-content,.os-home-bar,.os-status,.os-app-header){background:none;color:#fff}
 &[data-page=home] .os-app-header,&[data-page=lock] .os-app-header{height:28px;padding:0 10px;justify-content:flex-end;position:relative;z-index:2}
 &[data-page=home] .os-app-header :is(strong,[data-phone=home]),&[data-page=lock] .os-app-header :is(strong,[data-phone=home]){display:none}
 &[data-page=home] .os-app-header button,&[data-page=lock] .os-app-header button{width:26px;height:26px;background:#00000052;backdrop-filter:blur(10px);color:#fff}
 &[data-page=home] .os-home-indicator span,&[data-page=lock] .os-home-indicator span{background:#fff}
 &[data-page=home] .os-home-bar button,&[data-page=lock] .os-home-bar button{color:#ffffffd9}
 &[data-page=home] .os-content,&[data-page=lock] .os-content{padding-top:4px}
 .pl-lock{min-height:100%;display:flex;flex-direction:column;align-items:center;text-align:center;color:#fff}
 .pl-lock-top{display:grid;justify-items:center}
 .pl-lock-ic{opacity:.9;margin-bottom:5px}
 .pl-date{margin:0;font-size:15px;line-height:1.3;font-weight:600}
 .pl-time{margin:0;font-size:84px;line-height:1;font-weight:700;letter-spacing:-3px;font-variant-numeric:tabular-nums;text-shadow:0 2px 18px #0005}
 .pl-sub{margin:7px 0 0;display:flex;gap:6px;align-items:center;font-size:12.5px;line-height:1.3;color:#ffffffe6}
 .pl-notices{flex:1;width:100%;display:flex;flex-direction:column;justify-content:flex-end;gap:8px;margin:18px 0 14px;text-align:left}
 .pl-notice-x{position:absolute;top:6px;right:6px;width:22px!important;height:22px!important;min-width:0!important;min-height:0!important;max-height:22px!important;flex:none!important;padding:0!important;border:0;border-radius:50%;background:#ffffff26;color:#fff;font-size:11px;line-height:22px;text-align:center;cursor:pointer;z-index:1}
.pl-notice-x:hover{background:#ffffff4d}
.pl-notice{position:relative;padding-right:32px!important;display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:18px;background:#1e1e2099;backdrop-filter:blur(18px) saturate(1.5);border:1px solid #ffffff1f}
 .pl-notice-ic{width:34px;height:34px;border-radius:9px;overflow:hidden;flex:none}
 .pl-notice-ic svg{width:100%;height:100%;display:block}
 .pl-notice div{min-width:0;flex:1}
 .pl-notice-pic{display:block;width:100%;aspect-ratio:1.6;object-fit:cover;border-radius:10px;margin-top:6px}
 .pl-notice header{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
 .pl-notice strong{font-size:13px}
 .pl-notice small{font-size:11px;color:#ffffffa6;white-space:nowrap}
 .pl-notice p{margin:1px 0 0;font-size:12.5px;line-height:1.3;color:#ffffffe0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
 .pl-lock-bottom{width:100%;display:grid;grid-template-columns:46px 1fr 46px;align-items:end;gap:8px;padding:0 4px 2px}
 .pl-quick{width:46px;height:46px;min-height:0;padding:0;border-radius:50%;display:grid;place-items:center;background:#1e1e2085;backdrop-filter:blur(14px);color:#fff}
 .pl-unlock{background:none;color:#fff;display:grid;justify-items:center;gap:7px;font-size:12px;font-weight:600;padding:0 0 4px;min-height:0}
 .pl-unlock i{display:block;width:34px;height:4px;border-radius:2px;background:#fff;animation:plNudge 1.8s ease-in-out infinite}
 .pl-home{display:flex;flex-direction:column;min-height:100%}
 .pl-widgets{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 12px}
 .pl-w{display:grid;align-content:space-between;gap:2px;text-align:left;min-height:82px;padding:10px 13px;border-radius:20px;background:#1e1e2073;backdrop-filter:blur(20px) saturate(1.6);border:1px solid #ffffff24;color:#fff;box-shadow:0 8px 24px #0003;min-width:0}
 .pl-w small{font-size:10.5px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#ffffffb8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .pl-w strong{font-size:26px;font-weight:650;letter-spacing:-.8px;line-height:1.05;font-variant-numeric:tabular-nums}
 .pl-w span{display:flex;gap:5px;align-items:center;font-size:11.5px;color:#ffffffd0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
 .pl-w-wallet strong{font-size:22px;letter-spacing:-.5px}
 .pl-w-wallet span{display:block}
 .os-app-grid.pl-grid{gap:8px 4px;align-content:space-between;flex:1}
 /* V6.23: four rows of apps on the one page */
 .pl-grid .os-app{min-height:0!important;gap:5px}
 .pl-dots:empty{display:none}
 .pl-dots:empty+.pl-dock{margin-top:12px}
 @media(max-height:760px){.pl-widgets{margin:0 0 9px}.pl-w{min-height:64px;padding:7px 12px}.pl-w strong{font-size:21px}.pl-w-wallet strong{font-size:18px}.os-icon.pl-icon{width:44px!important;height:44px!important;border-radius:11px}.os-app-grid.pl-grid{gap:6px 4px}.pl-grid .os-app{gap:3px}.pl-dots:empty+.pl-dock{margin-top:8px}.pl-dock{padding:8px}}
 .os-app{font-size:10.5px;font-weight:500;gap:5px;min-height:74px;color:#fff;text-shadow:0 1px 3px #0009;border-radius:14px}
 .os-app>span:last-child{max-width:72px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .os-icon.pl-icon{width:50px;height:50px;border-radius:12px;background:none;overflow:hidden;box-shadow:0 6px 14px #00000047,inset 0 0 0 .5px #ffffff33;transition:transform .15s}
 .os-icon.pl-icon svg{width:100%;height:100%;display:block;fill:none;stroke:none}
 .os-app:active .pl-icon{transform:scale(.9)}
 .pl-dots{display:flex;justify-content:center;gap:2px;margin:10px 0 12px}
 .pl-dots button{background:none;padding:6px 4px;min-height:0;min-width:0;border-radius:8px}
 .pl-dots i{display:block;width:7px;height:7px;border-radius:50%;background:#ffffff66}
 .pl-dots .on i{background:#fff}
 .os-dock.pl-dock{background:#ffffff26;backdrop-filter:blur(22px) saturate(1.6);border:1px solid #ffffff24;border-radius:28px;padding:11px 8px;gap:4px}
 .os-dock.pl-dock .os-app{min-height:0}
 .os-dock.pl-dock .os-app>span:last-child{display:none}
 .pl-h{margin:18px 4px 7px;font-size:12px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;color:var(--os-muted)}
 .pl-settings>.pl-h:first-child{margin-top:2px}
 .pl-group,.pl-list,.pl-recents{background:var(--os-raised);border-radius:14px;overflow:hidden}
 .pl-row{display:flex;align-items:center;gap:10px;width:100%;min-height:44px;padding:9px 12px;margin:0;border-radius:0;background:none;text-align:left;font-size:13.5px;font-weight:400;color:var(--os-ink);border-bottom:1px solid var(--pl-line)}
 .pl-row:last-child{border-bottom:0}
 .pl-row>span{flex:1;min-width:0}
 .pl-row>svg:first-child{color:var(--pl-accent)}
 .pl-row>svg:last-child{color:var(--os-muted)}
 .pl-row>strong{font-weight:600;color:var(--os-muted);white-space:nowrap}
 .pl-row>.pl-dot{flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center}
 .pl-row>.pl-dot.in{background:#30d15826;color:var(--pl-green)}
 .pl-row>.pl-dot.out{background:#ff453a26;color:var(--pl-red)}
 .pl-row>strong.pos{color:var(--pl-green)}
 .pl-row>strong.neg{color:var(--pl-red)}
 .pl-row>.pl-row-main{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 .pl-switch{flex:none;display:block;width:42px;height:25px;border-radius:13px;background:#78788052;position:relative}
 .pl-switch::after{content:"";position:absolute;left:2px;top:2px;width:21px;height:21px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0005}
 .pl-switch.on{background:var(--pl-green)}
 .pl-switch.on::after{transform:translateX(17px)}
 label.pl-row.pl-range{margin:0;color:var(--os-ink);font-size:13.5px}
 .pl-range input{flex:1.25;margin:0;width:auto;border:0;padding:0;background:none;accent-color:var(--pl-accent)}
 .os-wallpapers.pl-walls{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px}
 .os-wallpapers.pl-walls::-webkit-scrollbar{display:none}
 .os-wallpapers.pl-walls button{flex:none;width:66px;height:116px;padding:0;border-radius:13px;border:2px solid transparent;display:block;overflow:hidden;position:relative;background:none}
 .os-wallpapers.pl-walls button[aria-pressed=true]{border-color:var(--pl-accent);background:none}
 .os-wallpapers.pl-walls em{position:absolute;left:0;right:0;bottom:0;padding:12px 3px 4px;font-style:normal;font-size:8.5px;font-weight:600;color:#fff;text-align:center;background:linear-gradient(transparent,#000b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .pl-cam button[data-phone^=cam]{display:block;width:100%;text-align:left;min-height:44px;padding:9px 12px;border-radius:0;background:none;font-size:13.5px;font-weight:400;border-bottom:1px solid var(--pl-line)}
 .pl-cam .os-fine{margin:8px 12px}
 .pl-alert{color:var(--pl-red);font-weight:600}
 .pl-balance{padding:18px;border-radius:20px;background:linear-gradient(140deg,#2c7366,#123a4a 60%,#0d2233);color:#fff;margin:2px 0 4px;box-shadow:0 10px 26px #0003}
 .pl-balance small{color:#ffffffb8;font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase}
 .pl-balance h2{margin:8px 0 6px;font-size:36px;font-weight:700;letter-spacing:-1px;font-variant-numeric:tabular-nums}
 .pl-balance p{margin:0;font-size:12px;color:#ffffffc4}
 .pl-empty{margin:40px 20px;text-align:center;color:var(--os-muted);font-size:13px}
 .pl-notes{display:flex;flex-direction:column;height:100%}
 .pl-notes textarea{flex:1;min-height:0;margin:0;border:0;border-radius:16px;padding:14px;font-size:14px;line-height:26px;resize:none;background:repeating-linear-gradient(transparent 0 25px,var(--pl-line) 25px 26px) 0 14px,var(--os-raised)}
 .pl-notes .os-fine{margin:8px 4px 0;text-align:center}
 .pl-clock{display:grid;justify-items:center;margin:6px 0 14px}
 .pl-face{width:168px;height:168px}
 .pl-face .f{fill:var(--os-raised);stroke:var(--pl-line);stroke-width:1}
 .pl-face .t{stroke:var(--os-muted);stroke-width:1.6;stroke-linecap:round}
 .pl-face .h{stroke:var(--os-ink);stroke-width:4;stroke-linecap:round}
 .pl-face .m{stroke:var(--os-ink);stroke-width:2.6;stroke-linecap:round}
 .pl-face .c{fill:var(--pl-red)}
 .pl-clock h1{margin:10px 0 0;font-size:40px;line-height:1.1;font-weight:700;letter-spacing:-1px;font-variant-numeric:tabular-nums}
 .pl-clock p{margin:0;color:var(--os-muted);font-size:12px}
 .pl-card{background:var(--os-raised);border-radius:18px;padding:14px}
 .pl-sw{text-align:center}
 .pl-sw small{font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase}
 .pl-sw h2{margin:4px 0 12px;font-size:38px;font-weight:300;font-variant-numeric:tabular-nums}
 .pl-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
 .pl-pill{border-radius:22px;min-height:42px;font-weight:600;font-size:14px;background:#78788038;color:var(--os-ink)}
 .pl-pill.go{background:#30d15833;color:var(--pl-green)}
 .pl-pill.stop{background:#ff453a33;color:var(--pl-red)}
 .pl-cc{display:grid;gap:12px}
 .pl-slider{display:flex;align-items:center;gap:12px;padding:14px;border-radius:18px;background:var(--os-raised)}
 .pl-slider input{flex:1;margin:0;width:auto;border:0;padding:0;background:none;accent-color:var(--pl-accent)}
 .pl-tiles{display:grid;grid-template-columns:1fr 1fr;gap:12px}
 .pl-tile{display:grid;justify-items:start;align-content:space-between;gap:12px;padding:14px;min-height:92px;border-radius:20px;background:var(--os-raised);text-align:left;font-size:13px;font-weight:600;color:var(--os-ink)}
 .pl-tile svg{box-sizing:border-box;width:34px;height:34px;padding:6px;border-radius:50%;background:#78788038}
 .pl-tile.on{background:var(--pl-accent);color:#fff}
 .pl-tile.on svg{background:#ffffff38}
 .pl-recent{display:flex;align-items:center;gap:12px;width:100%;padding:9px 12px;border-radius:0;background:none;border-bottom:1px solid var(--pl-line);font-size:14px;font-weight:500;text-align:left}
 .pl-recent:last-child{border-bottom:0}
 .pl-recent>span:nth-child(2){flex:1}
 .pl-recent .os-icon.pl-icon{width:38px;height:38px;border-radius:9px;box-shadow:none}
 .pl-recent>svg{color:var(--os-muted)}
 .pl-msg{display:grid;justify-items:center;text-align:center;gap:4px;margin-top:30px;padding:22px 18px}
 .pl-msg h3{margin:10px 0 0}
 .pl-msg p{margin:4px 0 0;color:var(--os-muted);font-size:13px}
 &:not(.pk-full) .os-content :is(.card,.os-message,.os-notification){border-radius:16px;background:var(--os-raised)}
 &:not(.pk-full) .os-content :is(input:not([type=range]),select,textarea){border-radius:12px;border-color:var(--pl-line)}
 &:not(.pk-full) .os-content .os-primary{border-radius:14px;background:var(--pl-accent);color:#fff}
 &:not(.pk-full) .os-content :is(.os-market-tabs,.os-gallery-tabs) button{border-radius:16px;padding:7px 12px}
 &:not(.pk-full) .os-content :is(.os-market-tabs,.os-gallery-tabs,.os-categories) [aria-pressed=true]{background:var(--pl-accent);color:#fff}
 &:not(.pk-full) .os-content .os-vehicle-card{border-radius:16px}
 &:not(.pk-full) .os-content .os-motors-brand b{font-style:normal}
 &:not(.pk-full) .os-content .os-confirm{border-radius:22px;border:1px solid var(--pl-line)}
 &:not(.pk-full) .os-content .card{padding:14px;margin:10px 0}
 &:not(.pk-full) .os-content .card p{margin:4px 0;line-height:1.4}
 &:not(.pk-full) .os-content .card h3{margin:0 0 4px;font-size:15px;font-weight:650}
 &:not(.pk-full) .os-content .card :is(img,canvas){border-radius:12px;max-width:100%}
 &:not(.pk-full) .os-content .card button{margin-top:10px;background:#78788038;color:var(--pl-accent);font-weight:600;border-radius:12px;min-height:38px;padding:8px 14px}
 &:not(.pk-full) .os-content .card.selected{box-shadow:inset 0 0 0 2px var(--pl-accent)}
 &:not(.pk-full) .os-content .card .reward{color:var(--pl-green);font-weight:700}
 &:not(.pk-full) .os-content .row{display:flex;flex-wrap:wrap;gap:7px;margin:6px 0}
 &:not(.pk-full) .os-content .row>button{border-radius:12px;font-weight:600}
 &:not(.pk-full) .os-content .phone-section-title{font-size:12px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;color:var(--os-muted);margin:18px 4px 7px}
 .os-chat-empty{display:grid;justify-items:center;text-align:center;gap:4px;margin-top:46px}
 .os-chat-empty h2{margin:12px 0 0}
 .os-chat-empty p{color:var(--os-muted);font-size:13px;margin:4px 12px 12px}
 .os-chat-empty button{background:var(--pl-accent);color:#fff;font-weight:600;border-radius:20px;padding:9px 18px}
}`;
function style(){if(document.getElementById('plPhoneStyle'))return;const s=document.createElement('style');s.id='plPhoneStyle';s.textContent=CSS;document.head.append(s);}
// ---- hooks into the phone -----------------------------------------------------------------------------------
const baseShell=Phone.prototype.shell;
Phone.prototype.shell=function(content,title='',legacy=false){baseShell.call(this,content,title,legacy);style();const os=this.ctx.container.querySelector('.platdo-os');if(!os)return;os.classList.add('pl');os.dataset.page=this.page;
 /* drawn icons in place of the text symbols; the buttons and what they do are unchanged */const put=(sel,html)=>{const el=os.querySelector(sel);if(el)el.innerHTML=html;};
 put('.os-status [data-phone="control"]',STATUS);put('.os-app-header [data-phone="home"]',ic('back',19));put('.os-app-header [data-phone="close"]',ic('close',17));put('.os-home-bar [data-phone="switcher"]',ic('recents',17));put('.os-home-bar [data-phone="lock"]',ic('lock',16));
 /* an empty Messages screen gets its cover */const empty=os.querySelector('.os-chat-empty');if(empty&&!empty.querySelector('.pl-icon'))empty.insertAdjacentHTML('afterbegin','<span class="os-icon pl-icon">'+cover('messages')+'</span>');};
const baseRender=Phone.prototype.render;
Phone.prototype.render=function(){if(!this.active)return;const pg=this.page,screen=SCREENS[pg];if(!screen){this._plPage=null;return baseRender.call(this);}
 const host=this.ctx.container,keep=this._plPage===pg?host.querySelector('.os-content')?.scrollTop||0:0,keepX=this._plPage===pg?host.querySelector('.pl-walls')?.scrollLeft:null;this._plPage=pg;
 this.shell(screen[0](this),screen[1]);const box=host.querySelector('.os-content');if(box&&keep)box.scrollTop=keep;
 const walls=host.querySelector('.pl-walls');if(walls){if(keepX!==null&&keepX!==undefined)walls.scrollLeft=keepX;else{const on=walls.querySelector('[aria-pressed=true]');if(on)walls.scrollLeft=on.offsetLeft-walls.offsetLeft-(walls.clientWidth-on.offsetWidth)/2;}}
 const area=host.querySelector('.pl-notes textarea'),count=host.querySelector('[data-pl-count]');if(area&&count)area.addEventListener('input',()=>{count.textContent=area.value.length;});};
/* the clocks on the lock screen, the home screen, the Clock app and the status bar follow the City's time */
const baseTick=Phone.prototype.tick;
Phone.prototype.tick=function(dt){const out=baseTick.call(this,dt);if(!this.active)return out;const t=this.time();if(t!==this._plTime){this._plTime=t;const host=this.ctx.container;for(const el of host.querySelectorAll('[data-pl-time],.os-status time'))el.textContent=t;const face=host.querySelector('[data-pl-face]');if(face){const[hh,mh]=hands(this.sim);face.querySelector('[data-h]')?.setAttribute('transform','rotate('+hh+' 60 60)');face.querySelector('[data-m]')?.setAttribute('transform','rotate('+mh+' 60 60)');}}return out;};
root.CityPhoneLook={cover,COVERS,SCREENS};
})(typeof window!=='undefined'?window:globalThis);
