
/* PLATDO City: jobs in online rooms (V10.4). Game only; the server (city-jobs.cjs) offers the jobs, checks every step
 * and pays. This draws the Jobs app online (the six offers, the job you are doing, Cancel), shows the job in the corner
 * (what to do, how far, the pay and the clock), hands the current step to the mission marker and the map so the usual
 * ring, arrow and parcel show where to go, and tells you when a step or the job is done. */
(function(root){'use strict';
const net=()=>root.PlatdoFriends;
const state={offers:null,at:0,loading:false,note:'',lastResult:undefined};
const KIND={parcel:'Parcel run',delivery:'DingDash delivery',trial:'Street time trial'};
const clock=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
// the step the server says you are on, in the shape the mission marker and the map read
function objective(sim){
 const j=sim?.onlineRoom&&sim.onlineJob;if(!j||!j.target)return null;const t=j.target;
 return{type:t.gate?'gate':t.pickup?'interact':'deliver',pos:{x:t.x,y:t.y,z:t.z},radius:t.gate?10:3.2,id:'online-'+j.id,key:t.pickup?'job-parcel':'job-drop',label:j.label,category:'land'};}
function install(){const M=root.CityMissions;if(!M||M._onlineJobs)return!!M;M._onlineJobs=true;const original=M.objective;M.objective=function(sim){return objective(sim)||original.apply(this,arguments);};return true;}
function refresh(ctx){const F=net();if(!F||state.loading)return;state.loading=true;F.action('cityTool',{tool:'job',kind:'list'}).then(r=>{state.offers=r.offers||[];state.at=Date.now();state.loading=false;state.note='';ctx.render();}).catch(e=>{state.loading=false;state.note=e.message;ctx.render();});}
function render(ctx){
 install();state.ctx=ctx;const {sim,esc,money,btn,panel}=ctx,job=sim.onlineJob;if(!state.offers||Date.now()-state.at>20000)refresh(ctx);
 const card=o=>{const extra=o.kind==='delivery'?'Tip of 30% if it arrives within '+clock(o.tipSeconds)+' of collecting it':o.kind==='trial'?'Finish within '+clock(o.timeLimit):'Any vehicle, or on foot';
  return`<div class="card"><span class="eyebrow">${esc(KIND[o.kind]||o.kind)} \u{B7} ${(o.distance/1000).toFixed(1)} km</span><h3>${esc(o.title)}</h3><p class="fine">${esc(o.first)}. ${esc(extra)}.</p><span class="reward">${money(o.pay)}</span>${btn('jobOnlineAccept','Take this job','',`data-value="${esc(o.id)}"${job?' disabled':''}`)}</div>`;};
 const now=job?`<div class="card"><span class="eyebrow">Your job \u{B7} step ${job.stage+1} of ${job.total}</span><h3>${esc(job.title)}</h3><p>${esc(job.label)}.</p><span class="reward">${money(job.pay)}</span><div class="row">${btn('resume','Show the way','primary')}${btn('jobOnlineCancel','Cancel the job')}</div></div>`:'';
 const list=state.offers?(state.offers.length?`<div class="card-grid">${state.offers.map(card).join('')}</div>`:'<p class="fine">No work right now. New jobs come every two minutes.</p>'):'<p class="fine">Asking around for work\u{2026}</p>';
 panel('Jobs',`<div class="phone-welcome"><span>Online rooms are an earned game. Work pays.</span><strong>${money(sim.profile.wallet||0)}</strong></div>${state.note?`<p role="status" style="color:#ffe1a5">${esc(state.note)}</p>`:''}${now}<h3 class="phone-section-title">Work around town</h3>${list}<div class="row">${btn('jobOnlineRefresh','Look again')}</div>`);}
function click(action,value,ctx){
 const F=net();if(!F)return;state.note='';
 if(action==='jobOnlineRefresh'){state.at=0;refresh(ctx);return;}
 const kind=action==='jobOnlineAccept'?'accept':action==='jobOnlineCancel'?'cancel':null;if(!kind)return;
 F.action('cityTool',{tool:'job',kind,id:value}).then(r=>{if(r?.message)ctx.toast?.(r.message);state.at=0;if(kind==='accept')ctx.setScreen('play');else refresh(ctx);}).catch(e=>{state.note=e.message;state.at=0;refresh(ctx);});}
// the corner of the screen while you work
function hud(sim,money){
 const j=sim?.onlineRoom&&sim.onlineJob;if(!j)return'';const t=j.target,p=sim.player,d=t?Math.round(Math.hypot(t.x-p.x,t.z-p.z)):0,esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const time=j.timeLeft!=null?' \u{B7} '+clock(j.timeLeft)+' left':j.tipLeft?' \u{B7} tip for '+clock(j.tipLeft):'';
 return`<small>JOB \u{B7} ${esc((KIND[j.kind]||j.kind).toUpperCase())} \u{B7} ${money?money(j.pay):'$'+j.pay}</small>${esc(j.label)}<br><span class="fine">${d} m${time}</span>`;}
// notices when a step or the job is done
function step(sim,toast,audio){
 install();let redraw=false;
 // the Jobs screen redraws when your job starts, moves on or ends
 const key=sim?.onlineJob?sim.onlineJob.id:'';if(key!==state.jobKey){const first=state.jobKey===undefined;state.jobKey=key;if(!first)redraw=true;}
 const r=sim?.onlineJobResult,id=r?r.id:null;
 if(state.lastResult===undefined)state.lastResult=id;
 else if(r&&id!==state.lastResult){state.lastResult=id;
  if(r.step)toast?.(r.message);
  else{/* the job is over, so the offers have changed: ask for the new ones */state.offers=null;state.at=0;redraw=true;
   if(r.ok){toast?.('+$'+Number(r.pay).toLocaleString('en-US')+' \u{B7} '+r.message);audio?.sample?.('kaChing',1,0);}else toast?.(r.message);}}
 if(redraw&&state.ctx&&root.PlatdoCity?.screen==='phoneJobs')try{state.ctx.render();}catch(_){}}
install();
root.CityJobsOnline={render,click,hud,step,objective,install,state};
})(typeof globalThis!=='undefined'?globalThis:this);
