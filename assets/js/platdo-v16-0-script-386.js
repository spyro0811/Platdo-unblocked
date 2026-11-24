
/* PLATDO City drive-throughs: the run through the lane (V13.4). The same file in the game (src/city-drive-run.js) and on
 * the multiplayer host (server/platdo-city/src/drive-run.js).
 * Drive under a drive-through's gate in a car or on a bike and the game takes the wheel: it drives you to the menu board
 * (the menu opens on your screen; pick what you like, one payment), then to the pick-up window. There the worker slides
 * the window open, leans out with a hand held out, catches the money you throw, puts it in the till, turns round for your
 * order and throws each thing you ordered at your face, one after the other with alternate hands, then waves and closes
 * the window. You eat the lot there and then, and the game drives you out of the lane and gives the wheel back.
 * Alone the game runs this; online only the host does, for every player, and everyone sees the same thing: the host moves
 * the car, the worker's moves come from pose() at the run's clock, and each game draws the flying money and food from the
 * same clock (city-drive-thru.js).
 * - actor.dtRun is the public part (sent to every player online): {k: this run's id, svc: the place, ph: 'in', 'menu',
 *   'toWindow', 'window' or 'leave', t: seconds in this part, items: what was paid for (item ids) or null, vid: the vehicle}.
 * - The place's staff person is the worker: while the window part plays it stands at the window with
 *   animState 'dtwindow' and dtWin {k, t, n}; pose(t, n) turns that into moves (people-6-anim.js).
 * - Cars queue: a second car in the same lane stops 7.5 m behind the one in front. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityDriveRun=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const need=(name,file)=>root[name]||(typeof require==='function'?require(file):null);
const R=()=>need('CityRestaurants','./restaurants.js'),V=()=>need('CityVehicles','./vehicles.js');
const MAXT=10,FLIGHT=.3,THROW=.36,GAP=7.5,WIN_DZ=.45,MENU_WAIT=150;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),unit=(x,z)=>{const L=Math.hypot(x,z)||1;return[x/L,z/L];};
const wrapA=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
/* ---- the lane --------------------------------------------------------------------------------------------------- */
function gateOf(s){const g=s&&s.driveThru;if(!g)return null;const st=g.strips.find(q=>q.id==='east');return{x:g.entry.x,z:s.z+s.d/2+.8,half:(st?st.w:4.4)/2+.6};}
/* where the worker stands: in the middle of the west wall (the legs hidden in it), facing out of the open half of the window */
function spot(s){return{x:s.x-s.w/2,y:s.y,z:s.driveThru.window.z+WIN_DZ,yaw:-Math.PI/2};}
/* the worker's head, leaning out: where the camera looks from the driver's seat */
function winPt(s){return{x:s.x-s.w/2-.62,y:s.y+1.45,z:s.driveThru.window.z+WIN_DZ};}
/* the path from where the car came in: up the east side past the menu board, round the back, down the west side past the
 * window and out. base is how far along it the gate is, so two cars' places in the lane can be compared. */
function pathOf(s,v){const g=s.driveThru,back=g.strips.find(q=>q.id==='back'),zb=back?back.a.z:s.z-s.d/2-2.2,xe=g.entry.x,xw=g.exit.x,gate=gateOf(s),mz=g.stops[0].z,wz=g.stops[1].z,zf=g.exit.z;
 const raw=[[v.x,v.z],[xe,gate.z-1.2],[xe,mz],[xe,zb],[xw,zb],[xw,wz],[xw,zf],[xw,zf+7]],pts=[],RAD=2.2;
 for(let i=0;i<raw.length;i++){const p=raw[i];if(i===3||i===4){const a=raw[i-1],c=raw[i+1],ia=unit(p[0]-a[0],p[1]-a[1]),oc=unit(c[0]-p[0],c[1]-p[1]),p0=[p[0]-ia[0]*RAD,p[1]-ia[1]*RAD],p1=[p[0]+oc[0]*RAD,p[1]+oc[1]*RAD];for(let k=0;k<=8;k++){const t=k/8,u=1-t;pts.push([u*u*p0[0]+2*u*t*p[0]+t*t*p1[0],u*u*p0[1]+2*u*t*p[1]+t*t*p1[1]]);}}else pts.push(p);}
 const out=[{x:pts[0][0],z:pts[0][1],s:0}];let acc=0;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<1e-4)continue;const n=Math.max(1,Math.ceil(L/.25));for(let k=1;k<=n;k++)out.push({x:a[0]+(b[0]-a[0])*k/n,z:a[1]+(b[1]-a[1])*k/n,s:acc+L*k/n});acc+=L;}
 const near=(x,z)=>{let best=out[0],bd=Infinity;for(const q of out){const d=Math.hypot(q.x-x,q.z-z);if(d<bd){bd=d;best=q;}}return best.s;};
 return{pts:out,len:acc,base:Math.hypot(raw[1][0]-raw[0][0],raw[1][1]-raw[0][1]),menuS:near(xe,mz),winS:near(xw,wz+WIN_DZ)};}
function at(path,s){const P=path.pts;s=clamp(s,0,path.len);let lo=0,hi=P.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(P[m].s<s)lo=m;else hi=m;}const a=P[lo],b=P[hi],t=b.s>a.s?(s-a.s)/(b.s-a.s):0;return{x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};}
/* ---- the window: when everything happens for n things thrown ------------------------------------------------------ */
const plans=new Map();
function plan(n){n=clamp(Math.round(n)||1,1,MAXT);if(plans.has(n))return plans.get(n);const gap=n>6?.32:n>3?.38:.44;
 const P={n,open0:.05,open1:.45,lean0:.15,lean1:.65,reach0:.35,reach1:.7,cash:.72,cashDur:.42,catch:1.14,back0:1.22,back1:1.55,till:1.62,turn0:1.75,turn1:2.1,w:[],r:[],h:[],arm:[],flight:FLIGHT,throwDur:THROW};
 for(let i=0;i<n;i++){const w=2.1+i*gap;P.w.push(w);P.r.push(w+THROW*.55);P.h.push(w+THROW*.55+FLIGHT);P.arm.push(i%2?'L':'R');}
 const last=P.h[n-1];Object.assign(P,{last,wave0:last+.15,wave1:last+1.05,close0:last+.8,close1:last+1.2,eat:last+.5,clean:last+1.45,done:last+2.1});plans.set(n,P);return P;}
/* the worker's moves at time t, each from 0 to 1: lean (out of the window), reach (the right hand held out, palm up),
 * grip (the right hand closed on the money), till (back in, hands down at the till), turn (round to the counter behind),
 * grab (reaching down for the food), open (the window), wave; thR and thL: how far through a throw each arm is (-1: none) */
function pose(t,n){const P=plan(n),S=(a,b)=>{const q=clamp((t-a)/(b-a),0,1);return q*q*(3-2*q);};
 const lean=clamp(S(P.lean0,P.lean1)-.55*S(P.back0,P.back1)+.5*S(P.turn1-.18,P.turn1)-.95*S(P.close0-.1,P.close1),0,1);
 let thR=-1,thL=-1;for(let i=0;i<P.n;i++){const q=(t-P.w[i])/THROW;if(q>=0&&q<=1){if(P.arm[i]==='R')thR=q;else thL=q;}}
 return{lean,reach:S(P.reach0,P.reach1)*(1-S(P.catch+.08,P.back1)),grip:S(P.catch-.05,P.catch+.04)*(1-S(P.till,P.till+.12)),till:S(P.back0,P.back1)*(1-S(P.turn0,P.turn0+.18)),
  turn:S(P.turn0,P.turn0+.2)*(1-S(P.turn1-.2,P.turn1)),grab:S(P.turn0+.1,P.turn0+.28)*(1-S(P.turn1-.22,P.turn1-.05)),open:S(P.open0,P.open1)*(1-S(P.close0,P.close1)),
  wave:S(P.wave0,P.wave0+.18)*(1-S(P.wave1-.25,P.wave1)),thR,thL,t};}
/* ---- the runs --------------------------------------------------------------------------------------------------- */
const runs=sim=>sim._dtRuns||(sim._dtRuns=new Map());
const staffOf=(sim,svc)=>(sim.npcs||[]).find(q=>q.id==='staff-'+svc)||null;
function begin(sim,d,a,s,v){const w=sim.world,g0=w.groundHeight(v.x,v.z,v.y+1);let f0=0;try{const seat=V()?.getSeatTransform?.(v,0);if(seat)f0=(seat.x-v.x)*Math.sin(v.yaw||0)+(seat.z-v.z)*Math.cos(v.yaw||0);}catch(_){}
 sim._dtSeq=(sim._dtSeq||0)+1;const k=sim._dtSeq.toString(36)+'-'+Math.round((sim.time||0)*10).toString(36)+'-'+String(d.key).slice(-6);
 a.dtRun={k,svc:s.id,ph:'in',t:0,items:null,vid:v.id};
 runs(sim).set(d.key,{k,s,path:pathOf(s,v),sAt:0,speed:clamp(Math.hypot(v.vx||0,v.vz||0),2,8),f0:clamp(f0,-1.5,1.5),off:Number.isFinite(g0)?v.y-g0:0,eaten:false,skip:false});}
/* drive under the gate, going into the lane (north), in a car or on a bike */
function watch(sim,d,a,last){const v=a.vehicleId!=null?(sim.vehicles||[]).find(q=>q.id===a.vehicleId):null;
 if(a.mode!=='driver'||a.health<=0||a.physical||a.ragdoll?.active||!v||v.category!=='land'||!(v.kind==='car'||v.kind==='bike')){last.delete(d.key);return;}
 const prev=last.get(d.key);last.set(d.key,{x:v.x,z:v.z,vid:v.id});if(!prev||prev.vid!==v.id)return;
 for(const s of sim.world.services||[]){const g=gateOf(s);if(!g||Math.abs(v.x-g.x)>g.half||Math.abs(v.z-g.z)>6)continue;if(prev.z>g.z&&v.z<=g.z&&(v.vz||0)<-.2){begin(sim,d,a,s,v);return;}}}
/* the car follows the path; the simulation has already moved it this step */
function place(sim,q,v,dt){const P=at(q.path,q.sAt),ah=at(q.path,q.sAt+1.4),bh=at(q.path,q.sAt-.4),want=Math.atan2(ah.x-bh.x,ah.z-bh.z);
 v.yaw=(v.yaw||0)+wrapA(want-(v.yaw||0))*Math.min(1,dt*9);v.x=P.x;v.z=P.z;v.vx=Math.sin(v.yaw)*q.speed;v.vz=Math.cos(v.yaw)*q.speed;v.vy=0;if(Number.isFinite(v.speed))v.speed=q.speed;
 const g=sim.world.groundHeight(v.x,v.z,v.y+1);if(Number.isFinite(g))v.y=g+q.off;if(Number.isFinite(v.pitch))v.pitch=0;if(Number.isFinite(v.roll))v.roll=0;if(Number.isFinite(v.yawRate))v.yawRate=0;}
function end(sim,d,a,v){a.dtRun=null;runs(sim).delete(d.key);if(v){v.vx=0;v.vz=0;if(Number.isFinite(v.speed))v.speed=0;}}
/* you eat the lot at the window (V14.3: online the room host fills that player's meters: d.profile) */
function eat(sim,a,r,opt,d){const b=R()?.brand?.(r.svc),S=opt.online?R()?.survivalOf?.(d&&d.profile):R()?.survival?.(sim);let hu=0,th=0;for(const id of r.items||[]){const it=(b?.menu||[]).find(m=>m.id===id);if(it){hu+=it.hunger||0;th+=it.thirst||0;}}
 if(S){S.hunger=Math.min(100,S.hunger+hu);S.thirst=Math.min(100,S.thirst+th);if(S.hunger>0&&S.thirst>0){S.empty=0;S.strikes=0;}}if(opt.online)return;sim.dirty=true;sim.emit?.('notice',{message:'You ate the lot'+(hu||th?': +'+hu+' hunger, +'+th+' thirst':'')+'.'});}
function advance(sim,dt,d,a,r,q,opt){const v=(sim.vehicles||[]).find(x=>x.id===r.vid);
 if(!v||a.vehicleId!==v.id||a.health<=0||(v.health??1)<=0||a.physical||a.ragdoll?.active){end(sim,d,a,v);return;}
 r.t+=dt;const s=q.s;
 if(r.ph==='menu'){/* alone the City is paused while the menu is up, so when it runs again the menu was closed; online the host waits for the page */
  if(!opt.online){if(r.t>.05){r.ph=r.items?'toWindow':'leave';r.t=0;}}else if(r.items){r.ph='toWindow';r.t=0;}else if(q.skip||r.t>MENU_WAIT){r.ph='leave';r.t=0;}}
 else if(r.ph==='window'){const P=plan(Math.min(MAXT,r.items.length));if(!q.eaten&&r.t>=P.eat){q.eaten=true;eat(sim,a,r,opt,d);}if(r.t>=P.done){r.ph='leave';r.t=0;}}
 else{const stop=r.ph==='in'?q.path.menuS-q.f0:r.ph==='toWindow'?q.path.winS-q.f0:q.path.len;let limit=stop;
  /* the car in front in the same lane */for(const o of runs(sim).values())if(o!==q&&o.s.id===s.id){const mine=q.sAt-q.path.base,theirs=o.sAt-o.path.base;if(theirs>mine)limit=Math.min(limit,theirs-GAP+q.path.base);}
  const left=Math.max(0,limit-q.sAt),cruise=r.ph==='leave'?6:4.5,want=Math.min(cruise,Math.sqrt(2*2.6*left)+(left>.05?.2:0));q.speed+=clamp(want-q.speed,-6*dt,3*dt);if(left<=.02)q.speed=Math.min(q.speed,0);q.sAt=Math.max(q.sAt,Math.min(limit,q.sAt+Math.max(0,q.speed)*dt));
  if(stop-q.sAt<=.03){q.speed=0;if(r.ph==='in'){r.ph='menu';r.t=0;if(!opt.online)sim.emit?.('service',{service:s.id,kind:'restaurant',driveThru:true});}else if(r.ph==='toWindow'){r.ph='window';r.t=0;}else{place(sim,q,v,dt);end(sim,d,a,v);return;}}}
 place(sim,q,v,dt);}
/* the worker: at the window while a window part plays there, back where they were afterwards */
function tidy(sim,actors){const home=sim._dtStaff||(sim._dtStaff=new Map()),busy=new Map();
 for(const a of actors){const r=a&&a.dtRun;if(r&&r.ph==='window'&&r.items&&r.items.length)busy.set(r.svc,r);}
 for(const[svc,r]of busy){const n=staffOf(sim,svc),s=sim.world.serviceById?.[svc];if(!n||!s?.driveThru)continue;if(!home.has(svc))home.set(svc,{id:n.id,x:n.x,y:n.y,z:n.z,yaw:n.yaw});const p=spot(s);
  Object.assign(n,{x:p.x,y:p.y,z:p.z,yaw:p.yaw,vx:0,vz:0,speed:0,animState:'dtwindow',dtWin:{k:r.k,t:Math.round(r.t*1000)/1000,n:Math.min(MAXT,r.items.length)}});}
 for(const[svc,h]of[...home]){if(busy.has(svc))continue;home.delete(svc);const n=(sim.npcs||[]).find(q=>q.id===h.id);if(n){Object.assign(n,{x:h.x,y:h.y,z:h.z,yaw:h.yaw,vx:0,vz:0,speed:0});if(n.animState==='dtwindow')n.animState=null;delete n.dtWin;}}
 /* a worker still at a window from a saved game (or a run that went with its player): back behind the counter */
 if(!sim._dtSwept||busy.size===0&&home.size===0&&(sim._dtSwept++)%120===0){sim._dtSwept=sim._dtSwept||1;for(const n of sim.npcs||[]){if(n.animState!=='dtwindow'&&!n.dtWin)continue;const svc=String(n.id).startsWith('staff-')?n.id.slice(6):null;if(svc&&busy.has(svc))continue;const s=svc&&sim.world.serviceById?.[svc],q=s&&(s.staff||(s.interaction&&{x:s.interaction.x+1.5,y:s.y,z:s.interaction.z}));if(q)Object.assign(n,{x:q.x,y:q.y??s.y,z:q.z,vx:0,vz:0,speed:0});if(n.animState==='dtwindow')n.animState=null;delete n.dtWin;}}}
/* one step for everyone driving: drivers is [{key, actor}]; opt.online is true on the host (the page sends the order) */
function step(sim,dt,drivers,opt={}){if(!sim||!sim.world||!(dt>0))return;const P=runs(sim),last=sim._dtLast||(sim._dtLast=new Map()),seen=new Set();
 for(const d of drivers||[]){const a=d&&d.actor;if(!a)continue;seen.add(d.key);const r=a.dtRun;
  if(r){const q=P.get(d.key);if(!q||q.k!==r.k){a.dtRun=null;P.delete(d.key);continue;}advance(sim,dt,d,a,r,q,opt);}else{P.delete(d.key);watch(sim,d,a,last);}}
 for(const k of[...P.keys()])if(!seen.has(k))P.delete(k);for(const k of[...last.keys()])if(!seen.has(k))last.delete(k);
 tidy(sim,(drivers||[]).map(d=>d&&d.actor));}
/* the order at the menu board: rows [[itemId, count], ...], checked against the place's menu and paid with sim.commit
 * (the caller has set sim.profile to the payer's) */
function order(sim,a,profile,rows){const r=a&&a.dtRun;if(!r||r.ph!=='menu')return{ok:false,message:'Drive up to the menu board first.'};if(r.items)return{ok:true,message:''};
 const b=R()?.brand?.(r.svc);if(!b)return{ok:false,message:'This place is closed.'};const menu=new Map((b.menu||[]).map(it=>[it.id,it])),items=[];
 for(const row of Array.isArray(rows)?rows.slice(0,40):[]){const it=Array.isArray(row)?menu.get(row[0]):null,n=Array.isArray(row)?row[1]:0;if(!it||!Number.isInteger(n)||n<1||n>9)return{ok:false,message:'That is not on the menu.'};for(let i=0;i<n;i++)items.push(it.id);}
 if(!items.length)return{ok:false,message:'Pick something first.'};if(items.length>60)return{ok:false,message:'That is too much for one order.'};
 const total=items.reduce((t,id)=>t+(menu.get(id).price||0),0);if(!(profile&&profile.wallet>=total))return{ok:false,message:'You need $'+total+' for that.'};
 if(!sim.commit('drivethru:'+r.k,-total,('Drive-through: '+b.name).slice(0,80)))return{ok:false,message:'The payment did not go through.'};
 r.items=items;return{ok:true,total,message:'Paid $'+total+'. Pull up to the window.'};}
function skip(sim,key){const q=runs(sim).get(key);if(q)q.skip=true;}
/* online: what the page may ask for (world.cjs cityTool 'driveThru'); errors are thrown for the page to show */
function tool(sim,key,a,profile,request){if(!a||!a.dtRun)throw Error('You are not in a drive-through.');
 if(request&&request.kind==='skip'){skip(sim,key);return{message:''};}
 if(!request||request.kind!=='pay')throw Error('Unknown drive-through action.');
 const q=order(sim,a,profile,request.items);if(!q.ok)throw Error(q.message);return{message:q.message||'',total:q.total||0};}
/* nothing reaches the vehicle while the run drives it: no steering, no getting out, no horn by mistake */
function blank(a,input){if(!a||!a.dtRun||!input)return input;input.vehicle={};for(const k of['vehiclePressed','hornPressed','lightsPressed','hazardsPressed','seatbeltPressed','vehicleJumpPressed','interactPressed','radioPressed'])if(k in input)input[k]=false;return input;}
return{MAXT,FLIGHT,THROW,WIN_DZ,gateOf,spot,winPt,pathOf,at,plan,pose,step,order,skip,tool,blank};
});
