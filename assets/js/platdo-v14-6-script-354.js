
/* PLATDO City: the full-screen map (V12.4). Game only.
 * - The map fills the screen; dark see-through panels sit over it: a side list of place categories (each opens to show
 *   its places, nearest first, with an eye to show or hide that kind on the map), a search box, Show all and Clear
 *   filters, a card for the chosen place with Set waypoint, round zoom and position buttons, and a hint line.
 * - Choosing a category brightens its places and dims the rest. Choosing a place glides the map to it. The place under
 *   the mouse gets a ring. Zooming (wheel, buttons or a two-finger pinch) glides and stays on the point under the cursor
 *   or between the fingers. A new waypoint drops in as a pin with a ripple. The screen fades in and out.
 * - One drawn icon set for every kind of place (house, fork and knife, shirt, car, plane, anchor, flag, star and more)
 *   replaces the emoji, so the badges look the same on every device. The minimap gets a lighter frame.
 * The skeleton keeps the map's state (centre, zoom, chosen place, waypoint) and hands it over through api (mapApi()).
 * CityWorldMap.draw does the drawing with the options from drawOptions(): hidden kinds, the bright category, the hovered
 * place and the pin's drop. */
(function(root){'use strict';
if(typeof document==='undefined')return;
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),DOT=' · ';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// ---- the icon set (24 x 24, white on the badge) -----------------------------------------------------------------------
const ICON={
 home:{f:['M12 3.4 3.6 10.6v9.8h5.9v-5.7h5v5.7h5.9v-9.8z']},
 food:{f:['M6.2 2.5v6.3c0 1.3.9 2.3 2 2.6v10.1h2V11.4c1.1-.3 2-1.3 2-2.6V2.5h-1.5v5.6h-.9V2.5H8.6v5.6h-.9V2.5z','M17.8 2.5c-1.9.6-3.2 3.3-3.2 6.9 0 2.3.9 3.8 2.2 4.2v7.9h2V2.5z']},
 bag:{f:['M5.2 8.2h13.6l-1.1 13.3H6.3z'],s:['M9 8.2V6.6a3 3 0 0 1 6 0v1.6']},
 shirt:{f:['M8.4 3.2 2.8 6.4l2.3 4.4 2.2-1.1v11.5h9.4V9.7l2.2 1.1 2.3-4.4-5.6-3.2c-.6 1.6-2 2.6-3.6 2.6s-3-1-3.6-2.6z']},
 car:{even:true,f:['M4.2 11.3 6 6.6c.3-.8 1.1-1.3 1.9-1.3h8.2c.8 0 1.6.5 1.9 1.3l1.8 4.7c.9.3 1.4 1.1 1.4 2v4.4h-2v1.9h-3v-1.9H7.8v1.9h-3v-1.9h-2v-4.4c0-.9.6-1.7 1.4-2zM6.6 11h10.8l-1.3-3.6H7.9z']},
 target:{s:['M12 4.2a7.8 7.8 0 1 0 .01 0','M12 8.4a3.6 3.6 0 1 0 .01 0'],f:['M12 10.9a1.1 1.1 0 1 0 .01 0']},
 plane:{f:['M21.5 15.6v-1.9l-8-5V3.8c0-.9-.7-1.6-1.5-1.6s-1.5.7-1.5 1.6v4.9l-8 5v1.9l8-2.5v5.2l-2.2 1.6v1.5l3.7-1 3.7 1v-1.5l-2.2-1.6v-5.2z']},
 anchor:{s:['M12 6.6v14','M8.2 10h7.6','M4.8 13.8c0 4 3.2 6.8 7.2 6.8s7.2-2.8 7.2-6.8'],f:['M12 2.2a2.3 2.3 0 1 0 .01 0']},
 tree:{f:['M12 2.2 5.6 11.2h3.2l-4.2 6.2h6.2v4.4h2.4v-4.4h6.2l-4.2-6.2h3.2z']},
 sun:{f:['M12 7.4a4.6 4.6 0 1 0 .01 0'],s:['M12 1.8v2.4','M12 19.8v2.4','M1.8 12h2.4','M19.8 12h2.4','M4.8 4.8l1.7 1.7','M17.5 17.5l1.7 1.7','M4.8 19.2l1.7-1.7','M17.5 6.5l1.7-1.7']},
 flag:{s:['M6 2.8v18.6'],f:['M6.6 3.6h11.8l-2.6 4.3 2.6 4.3H6.6z']},
 star:{f:['M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z']},
 gem:{f:['M6.4 3.4h11.2l4 5.4L12 21 2.4 8.8z']},
 box:{even:true,f:['M12 2.8 3.4 7.2v9.6l8.6 4.4 8.6-4.4V7.2zM12 5.1l5.7 2.9L12 10.9 6.3 8z']},
 signal:{s:['M12 21V10','M8.2 6.5a5.4 5.4 0 0 0 0 7.6','M15.8 6.5a5.4 5.4 0 0 1 0 7.6','M5.3 3.6a9.4 9.4 0 0 0 0 13.4','M18.7 3.6a9.4 9.4 0 0 1 0 13.4'],f:['M12 8.2a1.8 1.8 0 1 0 .01 0']},
 bed:{f:['M2.8 18.6V6.4h2.2v7.4h6V9.4h7.4c1.8 0 3.2 1.4 3.2 3.2v6h-2.2v-2.2H5v2.2z','M7.6 9.2a2 2 0 1 0 .01 0']},
 building:{even:true,f:['M5 21.2V3.4h10.2v4.4h3.8v13.4zM7.6 6h2v2.2h-2zm3.6 0h2v2.2h-2zM7.6 10h2v2.2h-2zm3.6 0h2v2.2h-2zM7.6 14h2v2.2h-2zm3.6 0h2v2.2h-2zm4.6-2h1.6v2.2h-1.6zm0 4h1.6v2.2h-1.6z']},
 search:{s:['M10.5 4.2a6.3 6.3 0 1 0 .01 0','M15.2 15.2l5 5']},
 eye:{s:['M2.5 12s3.5-6.2 9.5-6.2 9.5 6.2 9.5 6.2-3.5 6.2-9.5 6.2S2.5 12 2.5 12z'],f:['M12 9.2a2.8 2.8 0 1 0 .01 0']},
 eyeOff:{s:['M2.5 12s3.5-6.2 9.5-6.2 9.5 6.2 9.5 6.2-3.5 6.2-9.5 6.2S2.5 12 2.5 12z','M4 20 20 4']},
 plus:{s:['M12 5v14','M5 12h14']},minus:{s:['M5 12h14']},
 locate:{s:['M12 5.2a6.8 6.8 0 1 0 .01 0','M12 1.8v3','M12 19.2v3','M1.8 12h3','M19.2 12h3'],f:['M12 9.6a2.4 2.4 0 1 0 .01 0']},
 fit:{s:['M4 9V4h5','M15 4h5v5','M20 15v5h-5','M9 20H4v-5']},
 close:{s:['M6 6l12 12','M18 6 6 18']},menu:{s:['M4 7h16','M4 12h16','M4 17h16']},chev:{s:['M9 6l6 6-6 6']},pin:{f:['M12 2.2c-3.9 0-7 3-7 6.9 0 5 7 12.7 7 12.7s7-7.7 7-12.7c0-3.9-3.1-6.9-7-6.9zm0 9.5a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2z'],even:true}
};
const svg=(k,cls='')=>{const I=ICON[k]||ICON.star;return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${(I.f||[]).map(d=>`<path d="${d}" fill="currentColor"${I.even?' fill-rule="evenodd"':''}/>`).join('')}${(I.s||[]).map(d=>`<path d="${d}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg>`;};
// ---- the kinds of place -------------------------------------------------------------------------------------------------
const CATS=[
 {id:'homes',name:'Homes',color:'#3fa66b',types:['safehouse','premium-home','shelter','apartment','house']},
 {id:'food',name:'Food',color:'#ef7d2d',types:['restaurant','diner']},
 {id:'stores',name:'6-7 stores',color:'#0e8a57',types:['six-seven']},
 {id:'clothing',name:'Clothing',color:'#e2669f',types:['clothing']},
 {id:'garages',name:'Garages',color:'#64809c',types:['garage']},
 {id:'equipment',name:'Equipment',color:'#7f9a4c',types:['equipment']},
 {id:'airport',name:'Airport',color:'#4f78cf',types:['hangar','terminal']},
 {id:'marina',name:'Marina',color:'#2a9db0',types:['marina']},
 {id:'outdoors',name:'Parks and beach',color:'#5aac4d',types:['park','beach']},
 {id:'tracks',name:'Tracks and ramps',color:'#d0773f',types:['track','ramp']},
 {id:'casino',name:'Casino',color:'#c79b1c',types:['casino']},
 {id:'work',name:'Work',color:'#9b8061',types:['warehouse','relay']}];
const TYPE_ICON={safehouse:'home','premium-home':'home',shelter:'bed',apartment:'building',house:'home',restaurant:'food',diner:'food','six-seven':'bag',clothing:'shirt',garage:'car',equipment:'target',hangar:'plane',terminal:'plane',marina:'anchor',park:'tree',beach:'sun',track:'flag',ramp:'star',casino:'gem',warehouse:'box',relay:'signal'};
const catOf=type=>CATS.find(c=>c.types.includes(type))||null;
const colorOf=m=>m.currentHome?'#2f9e5a':m.type==='premium-home'?'#d9a521':catOf(m.type)?.color||'#8aa0a8';
// the badge on the map, drawn with the icon set (replaces the emoji badge of city-map-paint.js)
const paths=new Map(),P2=d=>{let p=paths.get(d);if(!p){p=new Path2D(d);paths.set(d,p);}return p;};
function drawIcon(c,key,x,y,size){const I=ICON[key]||ICON.star;c.save();c.translate(x-size/2,y-size/2);c.scale(size/24,size/24);c.fillStyle='#fff';c.strokeStyle='#fff';c.lineWidth=2.4;c.lineCap='round';c.lineJoin='round';for(const d of I.f||[])c.fill(P2(d),I.even?'evenodd':'nonzero');for(const d of I.s||[])c.stroke(P2(d));c.restore();}
function badge(c,m,q,o={}){
 const col=o.selected?colorOf(m):colorOf(m);
 if(o.mini){const r=5.5;c.save();c.shadowColor='rgba(20,40,50,.45)';c.shadowBlur=2;c.shadowOffsetY=1;c.fillStyle='#fff';c.beginPath();c.arc(q.x,q.y,r,0,TAU);c.fill();c.restore();c.fillStyle=col;c.beginPath();c.arc(q.x,q.y,r-1.6,0,TAU);c.fill();return r;}
 const r=o.selected?16:o.hover?14.5:12.5;c.save();if(o.dim)c.globalAlpha=.3;
 if(o.selected){c.fillStyle='rgba(240,107,88,.26)';c.beginPath();c.arc(q.x,q.y,r+8,0,TAU);c.fill();}
 c.shadowColor='rgba(8,18,24,.55)';c.shadowBlur=o.hover||o.selected?10:5;c.shadowOffsetY=2;c.fillStyle='#fff';c.beginPath();c.arc(q.x,q.y,r,0,TAU);c.fill();c.shadowColor='transparent';
 c.fillStyle=col;c.beginPath();c.arc(q.x,q.y,r-2.3,0,TAU);c.fill();
 if(o.selected||o.hover){c.strokeStyle=o.selected?'#f06b58':'rgba(255,255,255,.95)';c.lineWidth=o.selected?3:2;c.beginPath();c.arc(q.x,q.y,r+2.2,0,TAU);c.stroke();}
 drawIcon(c,TYPE_ICON[m.type]||'star',q.x,q.y,r*1.16);c.restore();return r;}
if(root.CityMapPaint)root.CityMapPaint.badge=badge;
// ---- the look ----------------------------------------------------------------------------------------------------------
const CSS=`#cityRoot .cm-shade{position:absolute;inset:0;z-index:30;background:#0d1a20}
#cityRoot .cm{position:absolute;inset:0;overflow:hidden;color:#eef3f4;font-family:'Segoe UI',system-ui,sans-serif;animation:cmIn .24s ease-out}
#cityRoot .cm.cm-out{animation:cmOut .15s ease-in forwards}
@keyframes cmIn{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}@keyframes cmOut{to{opacity:0;transform:scale(.985)}}
#cityRoot .cm #cityFullMap,#cityRoot .platdo-os .cm canvas#cityFullMap{position:absolute;inset:0;display:block;width:100%;height:100%!important;max-width:none;margin:0;border-radius:0;background:#2b7fae;cursor:crosshair;touch-action:none}
#cityRoot .cm-glass{background:rgba(13,21,26,.78);backdrop-filter:blur(12px) saturate(1.2);-webkit-backdrop-filter:blur(12px) saturate(1.2);border:1px solid rgba(255,255,255,.09);box-shadow:0 10px 30px rgba(0,0,0,.35);border-radius:16px}
#cityRoot .cm svg{width:18px;height:18px;flex:0 0 auto}
#cityRoot .cm button{font:inherit;color:inherit;min-height:0;margin:0;cursor:pointer}
#cityRoot .cm-side{position:absolute;left:16px;top:16px;bottom:16px;width:300px;display:flex;flex-direction:column;padding:14px 12px 10px;z-index:2;transition:transform .22s ease}
#cityRoot .cm-head{display:flex;align-items:baseline;justify-content:space-between;padding:0 4px 10px}#cityRoot .cm-head b{font-size:19px;font-weight:800;letter-spacing:.2px}#cityRoot .cm-head span{font-size:11px;color:#9fb1b7;letter-spacing:1.5px;text-transform:uppercase}
#cityRoot .cm-search{display:flex;align-items:center;gap:8px;padding:8px 10px;margin:0 0 8px;color:inherit;font-size:13.5px;border-radius:11px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.06)}#cityRoot .cm-search svg{color:#9fb1b7}
#cityRoot .cm-search input{flex:1;min-width:0;width:auto;margin:0;border:0;border-radius:0;outline:0;background:transparent;color:#fff;font:inherit;font-size:13.5px;padding:0}#cityRoot .cm-search input::placeholder{color:#8ea1a7}
#cityRoot .cm-tools{display:flex;gap:6px;margin:0 0 8px}#cityRoot .cm-tools button{flex:1;padding:6px 8px;border-radius:9px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);font-size:11.5px;font-weight:700;color:#d8e3e6}#cityRoot .cm-tools button:hover{background:rgba(255,255,255,.12)}
#cityRoot .cm-list{flex:1;overflow-y:auto;margin:0 -4px;padding:0 4px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent}
#cityRoot .cm-cat{border-radius:11px;margin:0 0 3px}#cityRoot .cm-cat.open{background:rgba(255,255,255,.06)}
#cityRoot .cm-row{display:flex;align-items:center;gap:4px}
#cityRoot .cm-cat-main{flex:1;display:flex;align-items:center;gap:10px;padding:7px 6px;border:0;background:transparent;border-radius:10px;text-align:left;font-size:13.5px;font-weight:650}
#cityRoot .cm-cat-main:hover{background:rgba(255,255,255,.07)}#cityRoot .cm-cat.off .cm-cat-main{opacity:.45}
#cityRoot .cm-dot{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.85)}#cityRoot .cm-dot svg{width:15px;height:15px}
#cityRoot .cm-cat-main em{margin-left:auto;font-style:normal;font-size:11px;font-weight:700;color:#9fb1b7;background:rgba(255,255,255,.08);border-radius:99px;padding:1px 7px}
#cityRoot .cm-chev{width:14px!important;height:14px!important;color:#7f949a;transition:transform .18s}#cityRoot .cm-cat.open .cm-chev{transform:rotate(90deg)}
#cityRoot .cm-eye{width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:9px;background:transparent;color:#b9c8cc}#cityRoot .cm-eye:hover{background:rgba(255,255,255,.08)}#cityRoot .cm-cat.off .cm-eye{color:#e88d7e}
#cityRoot .cm-places{padding:0 4px 6px 12px}
#cityRoot .cm-place{display:flex;align-items:center;gap:9px;width:100%;padding:6px 7px;border:0;border-radius:9px;background:transparent;text-align:left;font-size:12.5px;color:#dfe8ea}#cityRoot .cm-place:hover{background:rgba(255,255,255,.08)}#cityRoot .cm-place.on{background:rgba(240,107,88,.22);color:#fff}
#cityRoot .cm-place i{width:9px;height:9px;border-radius:50%;flex:0 0 auto}#cityRoot .cm-place span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#cityRoot .cm-place small{font-size:10.5px;color:#8ea1a7}
#cityRoot .cm-empty{padding:16px 8px;font-size:12.5px;color:#9fb1b7;text-align:center}
#cityRoot .cm-ctrl{position:absolute;right:16px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:6px;padding:6px;z-index:2}
#cityRoot .cm-ctrl button,#cityRoot .cm-close,#cityRoot .cm-drawer-btn{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;border:0;background:rgba(255,255,255,.06);color:#eef3f4}
#cityRoot .cm-ctrl button:hover,#cityRoot .cm-close:hover,#cityRoot .cm-drawer-btn:hover{background:rgba(255,255,255,.16)}
#cityRoot .cm-close{position:absolute;right:16px;top:16px;z-index:3;width:44px;height:44px;border-radius:14px}#cityRoot .cm-close,#cityRoot .cm-drawer-btn{background:rgba(13,21,26,.82)}#cityRoot .cm-close:hover,#cityRoot .cm-drawer-btn:hover{background:rgba(40,52,60,.9)}#cityRoot .cm-eye[aria-pressed],#cityRoot .cm-tools button[aria-pressed]{background:transparent;color:#b9c8cc}#cityRoot .cm-cat.off .cm-eye[aria-pressed]{color:#e88d7e}
#cityRoot .cm-drawer-btn{display:none;position:absolute;left:12px;top:12px;z-index:3;width:auto;padding:0 12px;gap:6px;font-size:13px;font-weight:700}
#cityRoot .cm-guide{position:absolute;left:50%;top:16px;transform:translateX(-50%);z-index:2;max-width:min(520px,60%);padding:9px 16px;font-size:13px;font-weight:650;text-align:center;border-radius:99px}#cityRoot .cm-guide:empty{display:none}
#cityRoot .cm-card{position:absolute;right:72px;bottom:56px;width:340px;display:flex;align-items:center;gap:11px;padding:12px;z-index:2;animation:cmCard .2s ease-out}#cityRoot .cm-card[hidden]{display:none}
@keyframes cmCard{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
#cityRoot .cm-card .cm-dot{width:38px;height:38px;flex:0 0 38px}#cityRoot .cm-card .cm-dot svg{width:21px;height:21px}
#cityRoot .cm-card-t{flex:1;min-width:0}#cityRoot .cm-card-t b{display:block;font-size:14.5px;line-height:1.25}#cityRoot .cm-card-t small{display:block;font-size:11.5px;color:#a8b8bd;margin-top:2px}
#cityRoot .cm-card-b{display:flex;flex-direction:column;gap:5px;align-items:stretch}
#cityRoot .cm-go{padding:8px 11px;border-radius:10px;border:0;background:#f06b58;color:#fff;font-size:12px;font-weight:800;white-space:nowrap}#cityRoot .cm-go.on{background:rgba(255,255,255,.14)}
#cityRoot .cm-x{padding:4px 0;border:0;border-radius:8px;background:transparent;color:#9fb1b7;font-size:11px;font-weight:700}
#cityRoot .cm-hint{position:absolute;left:calc(50% + 158px);bottom:14px;transform:translateX(-50%);z-index:2;padding:7px 16px;font-size:11.5px;color:#c7d4d8;white-space:nowrap;border-radius:99px}
#cityRoot .cm-hint b{color:#fff;font-weight:700}
#cityRoot .cm.cm-narrow.cm-drawer-open .cm-card{display:none}#cityRoot .cm.cm-narrow .cm-side{left:8px;top:60px;bottom:8px;width:min(300px,calc(100% - 66px));transform:translateX(calc(-100% - 20px))}#cityRoot .cm.cm-narrow.cm-drawer-open .cm-side{transform:none}
#cityRoot .cm.cm-narrow .cm-drawer-btn{display:inline-flex}#cityRoot .cm.cm-narrow .cm-close{right:10px;top:10px;width:40px;height:40px}
#cityRoot .cm.cm-narrow .cm-ctrl{right:8px;top:60px;transform:none;padding:4px;gap:4px}#cityRoot .cm.cm-narrow .cm-ctrl button{width:36px;height:36px}
#cityRoot .cm.cm-narrow .cm-card{left:8px;right:8px;bottom:8px;width:auto}#cityRoot .cm.cm-narrow .cm-hint{display:none}#cityRoot .cm.cm-narrow .cm-guide{top:60px;max-width:62%;font-size:12px}
#cityRoot .cm.cm-phone{position:relative;inset:auto;height:470px;border-radius:14px}
/* the minimap: a light white ring with a soft shadow, a little see-through */
#cityRoot #cityMiniMap{border:3px solid rgba(255,255,255,.92);box-shadow:0 0 0 1px rgba(15,30,36,.35),0 8px 24px rgba(0,0,0,.32);opacity:.94}`;
/* every rule inside the map is written under .cm as well, so the phone's own button, label and input styles (which the map meets when it opens inside the phone) never win over it */
function style(){if(document.getElementById('cm-style'))return;const s=document.createElement('style');s.id='cm-style';s.textContent=CSS.replace(/#cityRoot \.cm-(?!shade)/g,'#cityRoot .cm .cm-');document.head.appendChild(s);}
style();
// ---- state -------------------------------------------------------------------------------------------------------------
const S={open:false,api:null,el:null,hiddenCats:new Set(),hl:null,openCat:null,q:'',hovered:null,glide:null,pin:null,lastWay:null,lastSel:null,raf:0,dirty:false,pinch:null};
let hiddenTypes=new Set();
function syncHidden(){hiddenTypes=new Set(CATS.filter(c=>S.hiddenCats.has(c.id)).flatMap(c=>c.types));}
const isOpen=()=>!!(S.open&&S.el&&S.el.isConnected);
const canvas=()=>S.el?.querySelector('#cityFullMap');
const marks=()=>{try{return root.CityWorldMap.landmarks(S.api.sim.world);}catch(_){return[];}};
const find=id=>id?marks().find(m=>m.id===id)||null:null;
const distOf=m=>{const p=S.api.player();return p?Math.hypot(p.x-m.x,p.z-m.z):0;};
const far=d=>d<950?Math.max(10,Math.round(d/10)*10)+' m':(d/1000).toFixed(1)+' km';
function districtOf(m){const w=S.api.sim.world,id=m.district||w.serviceById?.[m.id]?.district;let d=id&&(w.districts||[]).find(q=>q.id===id);if(!d){let best=Infinity;for(const q of w.districts||[]){const k=Math.hypot(q.x-m.x,q.z-m.z);if(k<best){best=k;d=q;}}}return d?.name||'';}
function drawOptions(){if(!isOpen())return null;const hl=S.hl?new Set(CATS.find(c=>c.id===S.hl)?.types||[]):null;const side=S.el&&!S.el.classList.contains('cm-narrow')?S.el.querySelector('.cm-side'):null;return{hidden:hiddenTypes,highlight:hl,hovered:S.hovered,pin:S.pin?{t:S.pin.t}:{t:1},inset:side?Math.round(side.getBoundingClientRect().right-S.el.getBoundingClientRect().left+4):0};}
// ---- moving the map ----------------------------------------------------------------------------------------------------
const pxPerM=z=>{const cv=canvas();return z*((cv&&cv.getBoundingClientRect().width)||1000)/1000;};
function glideTo(center,zoom){S.glide={center:center?{x:center.x,z:center.z}:null,zoom:Number.isFinite(zoom)?clamp(zoom,.1,3):null,anchor:null};tick();}
function zoomAt(clientX,clientY,factor){const cv=canvas();if(!cv)return;const r=cv.getBoundingClientRect(),v=S.api.getView(),from=S.glide?.zoom??v.zoom,to=clamp(from*factor,.1,3),off={x:clientX-r.left-r.width/2,y:clientY-r.top-r.height/2},s=pxPerM(v.zoom);
 const world=S.glide?.anchor&&Math.hypot(S.glide.anchor.off.x-off.x,S.glide.anchor.off.y-off.y)<4?S.glide.anchor.world:{x:v.center.x+off.x/s,z:v.center.z+off.y/s};S.glide={zoom:to,anchor:{world,off},center:null};tick();}
function stepGlide(dt){const g=S.glide;if(!g)return false;const v=S.api.getView(),k=1-Math.exp(-dt*11);let z=v.zoom,c={...v.center};
 if(g.zoom!=null){z=Math.exp(Math.log(z)+(Math.log(g.zoom)-Math.log(z))*k);if(Math.abs(Math.log(z/g.zoom))<.003)z=g.zoom;}
 if(g.anchor){const s=pxPerM(z);c={x:g.anchor.world.x-g.anchor.off.x/s,z:g.anchor.world.z-g.anchor.off.y/s};}
 else if(g.center){c={x:c.x+(g.center.x-c.x)*k,z:c.z+(g.center.z-c.z)*k};if(Math.hypot(g.center.x-c.x,g.center.z-c.z)<.25*Math.max(1,1/z))c={...g.center};}
 S.api.setView(c,z);if((g.zoom==null||z===g.zoom)&&(!g.center||(c.x===g.center.x&&c.z===g.center.z)))S.glide=null;return true;}
/* one animation step a frame; a timer stands in when the browser gives no frames (a hidden or background window) */
function tick(){if(S.raf)return;let last=performance.now(),frame=0,backup=0;
 const loop=()=>{cancelAnimationFrame(frame);clearTimeout(backup);S.raf=0;if(!isOpen())return;const now=performance.now(),dt=Math.min(.05,Math.max(.001,(now-last)/1000));last=now;let busy=stepGlide(dt);if(S.pin&&S.pin.t<1){S.pin.t=Math.min(1,S.pin.t+dt/.75);busy=true;}if(S.dirty){S.dirty=false;busy=true;}if(busy){try{S.api.draw();}catch(_){}queue();}};
 const queue=()=>{frame=requestAnimationFrame(loop);backup=setTimeout(loop,60);S.raf=1;};queue();}
const redraw=()=>{S.dirty=true;tick();};
function overview(){const cv=canvas(),w=cv?.clientWidth||1000,h=cv?.clientHeight||540;return Math.min(1000/4050,1000*h/w/3400)*.93;}
// ---- the screen --------------------------------------------------------------------------------------------------------
function hint(api){return api.mobile?'<b>Drag</b> to move'+DOT+'<b>Pinch</b> to zoom'+DOT+'<b>Tap</b> a place':'<b>Drag</b> to move'+DOT+'<b>Scroll</b> to zoom'+DOT+'<b>Click</b> a place to choose it'+DOT+'<b>Click</b> empty ground for your own waypoint'+DOT+'<b>M</b> closes';}
function markup(api,narrow){
 return `<div class="cm${narrow?' cm-narrow':''}${api.phone?' cm-phone':''}"><canvas id="cityFullMap" width="1000" height="540" aria-label="Map of Platdo City. Drag to move, zoom with the wheel, pinch or buttons, and choose a place."></canvas>
 <button type="button" class="cm-drawer-btn cm-glass" data-cm="drawer">${svg('menu')}Places</button>
 <div id="cityMapGuidance" class="cm-guide cm-glass" role="status"></div>
 <aside class="cm-side cm-glass" aria-label="Places"><div class="cm-head"><b>Platdo City</b><span>Map</span></div>
  <label class="cm-search">${svg('search')}<input id="cmSearch" type="search" autocomplete="off" placeholder="Search places" value="${esc(S.q)}" aria-label="Search places"></label>
  <div class="cm-tools"><button type="button" data-cm="showall">Show all</button><button type="button" data-cm="clear">Clear filters</button></div>
  <div class="cm-list" id="cmList"></div></aside>
 <div class="cm-ctrl cm-glass"><button type="button" data-cm="zin" aria-label="Zoom in" title="Zoom in">${svg('plus')}</button><button type="button" data-cm="zout" aria-label="Zoom out" title="Zoom out">${svg('minus')}</button><button type="button" data-cm="me" aria-label="Back to you" title="Back to you">${svg('locate')}</button><button type="button" data-cm="fit" aria-label="Whole map" title="Whole map">${svg('fit')}</button></div>
 <button type="button" class="cm-close cm-glass" data-cm="close" aria-label="Close the map" title="Close">${svg('close')}</button><button type="button" data-action="resume" hidden class="cm-resume"></button>
 <div class="cm-card cm-glass" id="cmCard" hidden></div>
 <div class="cm-hint cm-glass">${hint(api)}</div></div>`;}
function placeRow(m,sel){return `<button type="button" class="cm-place${m.id===sel?' on':''}" data-cm-place="${esc(m.id)}"><i style="background:${colorOf(m)}"></i><span>${esc(m.name)}</span><small>${far(distOf(m))}</small></button>`;}
function renderList(){const host=S.el?.querySelector('#cmList');if(!host)return;const all=marks(),sel=S.api.selection(),q=S.q.trim().toLowerCase();let h='';
 if(q){const hits=all.filter(m=>m.name.toLowerCase().includes(q)||(catOf(m.type)?.name||'').toLowerCase().includes(q)||String(m.type).includes(q)).sort((a,b)=>distOf(a)-distOf(b)).slice(0,60);h=hits.length?hits.map(m=>placeRow(m,sel)).join(''):`<div class="cm-empty">No place called “${esc(S.q)}”.</div>`;}
 else for(const c of CATS){const list=all.filter(m=>c.types.includes(m.type));if(!list.length)continue;const off=S.hiddenCats.has(c.id),open=S.openCat===c.id;
  h+=`<div class="cm-cat${open?' open':''}${off?' off':''}"><div class="cm-row"><button type="button" class="cm-cat-main" data-cm-cat="${c.id}" aria-expanded="${open}">${svg('chev','cm-chev')}<span class="cm-dot" style="background:${c.color}">${svg(TYPE_ICON[c.types[0]])}</span>${esc(c.name)}<em>${list.length}</em></button><button type="button" class="cm-eye" data-cm-eye="${c.id}" aria-pressed="${!off}" aria-label="${off?'Show':'Hide'} ${esc(c.name)} on the map" title="${off?'Show on the map':'Hide on the map'}">${svg(off?'eyeOff':'eye')}</button></div>`;
  if(open)h+=`<div class="cm-places">${list.sort((a,b)=>distOf(a)-distOf(b)).map(m=>placeRow(m,sel)).join('')}</div>`;h+=`</div>`;}
 const keep=host.scrollTop;host.innerHTML=h;host.scrollTop=keep;}
function renderCard(){const card=S.el?.querySelector('#cmCard');if(!card)return;const m=find(S.api.selection());if(!m){card.hidden=true;card.innerHTML='';return;}
 const c=catOf(m.type),routed=S.api.waypoint()?.id===m.id,district=districtOf(m);
 card.hidden=false;card.innerHTML=`<span class="cm-dot" style="background:${colorOf(m)}">${svg(TYPE_ICON[m.type]||'star')}</span><div class="cm-card-t"><b>${esc(m.name)}</b><small>${esc(c?c.name:'Place')}${DOT}${far(distOf(m))}${district?DOT+esc(district):''}</small></div><div class="cm-card-b"><button type="button" class="cm-go${routed?' on':''}" data-cm="route">${routed?'Clear waypoint':'Set waypoint'}</button><button type="button" class="cm-x" data-cm="deselect">Close</button></div>`;}
function choose(id,glide=true){S.api.select(id);S.lastSel=id;const m=find(id);if(m&&glide){const z=S.api.getView().zoom;glideTo(m,Math.max(z,.95));}renderCard();renderList();redraw();if(S.el?.classList.contains('cm-narrow'))S.el.classList.remove('cm-drawer-open');}
function dropPin(){S.pin={t:0};tick();}
function close(){if(!S.el)return;S.el.classList.add('cm-out');const btn=S.el.querySelector('.cm-resume');S.open=false;setTimeout(()=>{try{btn?.click();}catch(_){}},140);}
function onClick(e){const t=e.target.closest('[data-cm],[data-cm-cat],[data-cm-eye],[data-cm-place]');if(!t||!S.el.contains(t))return;e.preventDefault();e.stopPropagation();
 const a=t.dataset.cm,v=S.api.getView(),cv=canvas(),r=cv?.getBoundingClientRect();
 if(t.dataset.cmCat){const id=t.dataset.cmCat;if(S.openCat===id){S.openCat=null;S.hl=null;}else{S.openCat=id;S.hl=id;S.hiddenCats.delete(id);syncHidden();}renderList();redraw();return;}
 if(t.dataset.cmEye){const id=t.dataset.cmEye;if(S.hiddenCats.has(id))S.hiddenCats.delete(id);else{S.hiddenCats.add(id);if(S.hl===id)S.hl=null;}syncHidden();renderList();redraw();return;}
 if(t.dataset.cmPlace){choose(t.dataset.cmPlace);return;}
 if(a==='zin'||a==='zout'){if(r)zoomAt(r.left+r.width/2,r.top+r.height/2,a==='zin'?1.45:1/1.45);}
 else if(a==='me'){const p=S.api.player();if(p)glideTo(p,Math.max(v.zoom,1.1));}
 else if(a==='fit'){/* the island in the middle of the part of the map the side panel leaves free */const z=overview(),side=S.el.classList.contains('cm-narrow')?0:(S.el.querySelector('.cm-side')?.getBoundingClientRect().width||0)+16;glideTo({x:-25-side/2/pxPerM(z),z:-470},z);}
 else if(a==='showall'){S.hiddenCats.clear();syncHidden();renderList();redraw();}
 else if(a==='clear'){S.hiddenCats.clear();syncHidden();S.hl=null;S.openCat=null;S.q='';const i=S.el.querySelector('#cmSearch');if(i)i.value='';renderList();redraw();}
 else if(a==='route'){const id=S.api.selection(),m=find(id);if(!m)return;if(S.api.waypoint()?.id===id){S.api.clearWaypoint();S.lastWay=null;S.api.toast('Waypoint cleared.');}else{const w=S.api.setWaypoint(id);S.lastWay=w;dropPin();S.api.toast('Route set to '+(m.name||'the place')+'.');}renderCard();redraw();}
 else if(a==='deselect'){S.api.select(null);S.lastSel=null;renderCard();renderList();redraw();}
 else if(a==='drawer')S.el.classList.toggle('cm-drawer-open');
 else if(a==='close')close();}
function pickAt(x,y){const cv=canvas();if(!cv)return null;const v=S.api.getView();try{const p=root.CityWorldMap.screenToWorld(cv,v.center,v.zoom*cv.width/1000,x,y),m=root.CityWorldMap.pick(S.api.sim.world,p,v.zoom*(cv.clientWidth||cv.width)/1000,'all');return m?.id||null;}catch(_){return null;}}
function mount(){const el=S.el,cv=canvas();if(!el||!cv)return;
 el.addEventListener('click',onClick);
 const input=el.querySelector('#cmSearch');if(input){input.addEventListener('input',()=>{S.q=input.value.slice(0,40);renderList();});input.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){const first=el.querySelector('#cmList .cm-place');if(first)choose(first.dataset.cmPlace);}if(e.key==='Escape'){input.blur();}});}
 const touches=new Map(),mid=()=>{const [a,b]=[...touches.values()];return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)||1};};
 cv.addEventListener('pointerdown',e=>{S.glide=null;if(e.pointerType==='mouse')return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===2){try{cv.setPointerCapture(e.pointerId);}catch(_){}const m=mid(),r=cv.getBoundingClientRect(),v=S.api.getView(),s=pxPerM(v.zoom),off={x:m.x-r.left-r.width/2,y:m.y-r.top-r.height/2};S.pinch={d0:m.d,z0:v.zoom,world:{x:v.center.x+off.x/s,z:v.center.z+off.y/s}};}});
 cv.addEventListener('pointermove',e=>{if(touches.has(e.pointerId)){touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(S.pinch&&touches.size>=2){const m=mid(),r=cv.getBoundingClientRect(),z=clamp(S.pinch.z0*m.d/S.pinch.d0,.1,3),s=pxPerM(z),off={x:m.x-r.left-r.width/2,y:m.y-r.top-r.height/2};S.api.setView({x:S.pinch.world.x-off.x/s,z:S.pinch.world.z-off.y/s},z);redraw();}return;}
  if(e.pointerType==='mouse'&&!e.buttons){const id=pickAt(e.clientX,e.clientY);if(id!==S.hovered){S.hovered=id;cv.style.cursor=id?'pointer':'crosshair';redraw();}}});
 const end=e=>{touches.delete(e.pointerId);if(touches.size<2)S.pinch=null;};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
 cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&S.hovered){S.hovered=null;redraw();}});
 renderList();renderCard();}
function show(api){
 const was=isOpen();S.api=api;style();syncHidden();const narrow=api.phone||(root.innerWidth||1200)<760;
 const html=markup(api,narrow);if(api.phone)api.phonePanel('Map',html);else api.overlay.innerHTML='<div class="cm-shade">'+html+'</div>';
 S.el=document.querySelector('#cityRoot .cm');if(was&&S.el)S.el.style.animation='none';S.open=true;S.hovered=null;S.glide=null;S.lastWay=api.waypoint();S.lastSel=api.selection();mount();
 try{api.draw();}catch(_){}}
/* the skeleton calls this whenever the chosen place or the waypoint changes (a click on the map) */
function selectionChanged(){if(!isOpen())return;const id=S.api.selection(),w=S.api.waypoint();if(w&&w!==S.lastWay)dropPin();S.lastWay=w;if(id&&id!==S.lastSel){const m=find(id);if(m)glideTo(m,null);}S.lastSel=id;renderCard();renderList();redraw();}
function wheel(e){const f=Math.exp(-clamp(e.deltaY,-240,240)*.0016);zoomAt(e.clientX,e.clientY,f);}
root.CityMapScreen={show,isOpen,drawOptions,selectionChanged,wheel,glideTo,zoomAt,CATS,TYPE_ICON,ICON,badge,get state(){return S;}};
})(typeof globalThis!=='undefined'?globalThis:this);
