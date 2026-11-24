
/* PLATDO City shelter, Harborlight House: the look and the start (V10.3; the whole building is drawn here since V15.8).
 * Game only. Where everything stands, and what is solid, is in city-shelter.js.
 * - Outside: red brick walls on a stone base with stone corner blocks and a stone band under white eaves; a hipped slate
 *   roof with ridge and hip caps and a white cupola with a weather vane; white-framed windows (glazing bars on the big
 *   ones) with stone sills and lintels, keystones, green shutters and flower boxes along the front; the gabled porch on
 *   two round columns with the name on its beam, a pediment with a round emblem, two lanterns, two benches; planters
 *   with shrubs and flowers, gutters and downpipes, the scooter rack, air units and two trees behind.
 * - Inside: cream walls over sage panelling with a white rail, skirting and cornice (tiles in the washrooms), white
 *   window linings and casings, wooden floors, carpet in the dormitory, a doormat, the front doors open against the wall.
 * - The furniture (the apartments' kit: wooden beds with their own coloured covers, bedside tables and lamps, sofas,
 *   armchairs, dining tables with lights over them, the kitchen, vanities and toilets; and the reception desk, lockers,
 *   stalls, showers and the rest made here) is built when you come within 45 m and taken down past 70 m.
 * - No two visible faces share a plane: trims stand proud of the walls, the runs along x go through the corners and the
 *   runs along z stop at their faces, frames stop where the next piece starts.
 * - A Story game starts at the reception, with the red scooter in the first scooter bay outside. A Story player who is
 *   knocked out wakes up there again, unless they chose a home to start at in Platdo Estates.
 * - Playing alone, you can sleep in a shelter bed until morning. (Online, the server places players; see world.cjs.) */
(function(root){'use strict';
const SH=()=>root.CityShelter,LK=()=>root.CityApartmentsLook,AR=()=>root.CityApartmentsRooms,PI=Math.PI;
// ---- the start, waking up, and the beds ------------------------------------------------------------------------------------
const chosenHome=sim=>sim?.profile?.apartments?.start||null;
function place(sim,at){if(root.CityApartmentsLife?.place){root.CityApartmentsLife.place(sim,at);return;}const p=sim.player;Object.assign(p,{x:at.x,y:at.y,z:at.z,yaw:at.yaw,mode:'onFoot',vehicleId:null,vx:0,vy:0,vz:0,physical:null,transition:null,grounded:true,lastSafe:{x:at.x,y:at.y,z:at.z}});if(sim.camera)sim.camera.yaw=at.yaw;}
// a scooter goes in a free scooter bay, a car in a free bay of the shelter's car park
function park(sim,v){
 const S=SH(),sh=sim?.world?.shelter;if(!S||!sh||!v)return false;const bike=root.CityVehicles?.byId?.[v.typeId]?.kind==='bike';
 const spots=bike?sh.scooters:S.carBays().map(b=>({x:b.x,z:b.z,yaw:0}));
 const free=spots.find(q=>!sim.vehicles.some(o=>o!==v&&Math.hypot(o.x-q.x,o.z-q.z)<(bike?1.2:2.2)));if(!free)return false;
 const off=v.y-sim.world.groundHeight(v.x,v.z,v.y+1);Object.assign(v,{x:free.x,z:free.z,yaw:free.yaw,vx:0,vy:0,vz:0,speed:0});v.y=sim.world.groundHeight(free.x,free.z,4)+off;return true;}
function storyStart(sim){
 const sh=sim?.world?.shelter;if(!sh||sim.onlineRoom||sim.mission||sim.profile?.mode!=='story'||chosenHome(sim))return false;
 place(sim,sh.start);const st=root.CityMotors?.state?.(sim.profile),v=sim.vehicles.find(o=>o.id===st?.activeId);if(v&&!v.seatOccupants?.some(Boolean))park(sim,v);return true;}
/* V10.7: Return home in Story, before a home is bought: the shelter's reception */function home(sim){const sh=sim?.world?.shelter;if(!sh||sim.onlineRoom)return false;sim.homeInstance=null;place(sim,sh.start);return true;}
function bedNear(sim){const sh=sim?.world?.shelter,p=sim?.player;if(!sh||!p||sim.onlineRoom||p.mode!=='onFoot'||p.vehicleId||p.health<=0)return false;return sh.beds.some(b=>Math.hypot(p.x-b.x,p.z-b.z)<1.5&&Math.abs(p.y-SH().FL)<1);}
function install(){
 const Sim=root.CitySimulation?.Simulation;if(!Sim||Sim.prototype._cityShelter)return!!Sim;const p=Sim.prototype;p._cityShelter=true;
 const respawn=p.respawn,prompt=p.prompt,interact=p.interact;
 p.respawn=function(){const r=respawn.apply(this,arguments);try{const sh=this.world?.shelter;if(sh&&!this.mission&&!this.onlineRoom&&this.profile?.mode==='story'&&!chosenHome(this))place(this,sh.start);}catch(e){}return r;};
 p.prompt=function(){if(bedNear(this))return{action:'interact',text:(t=>t>=.75||t<.25)((((this.profile?.world?.time??0)%1)+1)%1)?'Sleep until morning':'Sleep (after 6 pm)'};return prompt.call(this);};
 p.interact=function(){if(bedNear(this)&&(t=>t<.75&&t>=.25)((((this.profile?.world?.time??0)%1)+1)%1)){/* V12.7: you can only go to sleep from 6 pm until 6 am */this.emit('notice',{message:'You can only go to sleep after 6 pm.'});return true;}if(bedNear(this)){/* V14.7: the sleep scene alone, the room's sleep online (city-sleep.js) */{const bed=root.CitySleep?.shelterBed?.(this);if(bed&&root.CitySleep.request(this,{bed,place:'shelter'}))return true;}this.profile.world.time=7/24;this.player.health=Math.max(this.player.health,100);this.dirty=true;this.emit('notice',{message:'Good morning. Breakfast is in the common room.'});return true;}return interact.call(this);};
 return true;}
// ---- what it is made of --------------------------------------------------------------------------------------------------------
const K={brick:'brick',stone:'ashlar|#f4eee2',sill:'#e6dfd0',trim:'#f4f1e9',frame:'#f7f5ef',green:'#2e4d3e',greenDark:'#24402f',shingle:'shingle',cap:'#45494f',
 pave:'paving|#e8e2d6',plaster:'room:plaster|#f1e8d8',ceiling:'#f8f5ef',floor:'room:oak',carpet:'room:carpet|#8193a6',tile:'room:terrazzo',wallTile:'room:subway',
 sage:'#8da487',white:'#f6f4ee',iron:'#27292c',soil:'#4a3a2c',copper:'#5f8e7f',gold:'gold',bench:'#9a6a42',desk:'boards|#d9ad80',deskDark:'#7a5434',
 laminate:'#a3b6bc',cork:'#b98e5c',locker:'#5f7a86',lockerDoor:'#6e8c99',chrome:'chrome',metal:'#5e656a',leaf:'leaf',leafDark:'leafDark',concrete:'#bcb8b0',bark:'#5a4634'};
// the furniture kit's look for the shelter: warm oak, sage and camel fabrics, shaker kitchen, harbour pictures
const LOOK_OVER={floor:'oak',bathFloor:'terrazzo',wall:'#efe6d6',feature:null,featureAt:[],ceiling:'#f8f5ef',
 wood:'#b98d5f',woodTex:'oak',stone:'marbleW',metal:'bronze',fabric:'#6d8b80',fabricTex:'linen',fabric2:'#b9875a',fabric2Tex:'linen',pillow:['#c9a46a','#e9e1d1','#7c9cb3','#b0654a'],
 cab:'#eef0ea',cabStyle:'shaker',top:'marbleW',splash:'subway',uppers:'cabinets',hood:'plaster',rug:'rugPersian',art:'sea',bedFrame:'#a87b52',bedTex:'oak',linen:'#f8f6f1',throw:'#3f6e9a',
 tile:'subway',vanity:'#eef0ea',screen:'#22272b',plant:'fig',curtain:'#efe8da',chair:'#d9cdb8',lampShade:'#f3ead8',
 chairStyle:'ladder',chairLegs:'wood',legs:'wood',sofaBase:'legs',bedLegs:'wood',wardrobe:'shaker',pendant:'globe',media:'wood',tableTop:'wood',side:'wood'};
const THROWS=['#3f6e9a','#7a9a5a','#b0654a','#6b5a8e','#c49a3a'];
// ---- small helpers ------------------------------------------------------------------------------------------------------------
/* one face of an upright box: along 'x' at z = at (or 'z' at x = at), from a to b, between y0 and y1, facing dir (+1/-1) */
function face(acc,key,axis,at,a,b,y0,y1,dir){if(b-a<.003||y1-y0<.003)return;
 if(axis==='z'){if(dir>0)acc.quad(key,[a,y0,at],[b,y0,at],[b,y1,at],[a,y1,at],0,0,1,a,y0,b,y1);else acc.quad(key,[b,y0,at],[a,y0,at],[a,y1,at],[b,y1,at],0,0,-1,-b,y0,-a,y1);}
 else{if(dir>0)acc.quad(key,[at,y0,b],[at,y0,a],[at,y1,a],[at,y1,b],1,0,0,-b,y0,-a,y1);else acc.quad(key,[at,y0,a],[at,y0,b],[at,y1,b],[at,y1,a],-1,0,0,a,y0,b,y1);}}
const up=(acc,key,x0,x1,z0,z1,y)=>{if(x1-x0>.003&&z1-z0>.003)acc.quad(key,[x0,y,z1],[x1,y,z1],[x1,y,z0],[x0,y,z0],0,1,0,x0,-z1,x1,-z0);};
const down=(acc,key,x0,x1,z0,z1,y)=>{if(x1-x0>.003&&z1-z0>.003)acc.quad(key,[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1],0,-1,0,x0,z0,x1,z1);};
/* a flat polygon facing the side of hint, with the texture laid in metres: rows level, running up the slope */
function poly(T,acc,key,pts,hint){
 let P=pts.map(p=>new T.Vector3(p[0],p[1],p[2]));const nrm=()=>new T.Vector3().subVectors(P[1],P[0]).cross(new T.Vector3().subVectors(P[2],P[0])).normalize();
 let n=nrm();if(n.dot(new T.Vector3(hint[0],hint[1],hint[2]))<0){P=P.reverse();n=nrm();}
 let e1=new T.Vector3().crossVectors(n,new T.Vector3(0,1,0));if(e1.lengthSq()<1e-6)e1.set(1,0,0);e1.normalize();const e2=new T.Vector3().crossVectors(e1,n).normalize();
 const pos=[],nor=[],uv=[],idx=[];for(const p of P){pos.push(p.x,p.y,p.z);nor.push(n.x,n.y,n.z);const d=new T.Vector3().subVectors(p,P[0]);uv.push(d.dot(e1),-d.dot(e2));}
 for(let i=1;i<P.length-1;i++)idx.push(0,i,i+1);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);acc.geo(key,g,new T.Matrix4());}
/* a box laid along the line from a to b (its own y kept as level as it can be) */
function along(T,acc,key,a,b,w,h,lift=0){const A=new T.Vector3(...a),B=new T.Vector3(...b),d=new T.Vector3().subVectors(B,A),m=new T.Matrix4().lookAt(d,new T.Vector3(),new T.Vector3(0,1,0));
 const up=new T.Vector3(0,1,0).applyMatrix4(new T.Matrix4().extractRotation(m));m.setPosition(A.clone().add(B).multiplyScalar(.5).addScaledVector(up,lift));acc.geo(key,new T.BoxGeometry(w,h,d.length()),m);}
// boxes on one outer wall: along it (u), up (y), and out from its outer face (o, + outside) or in from its inner face (i, + into the room)
function wallOf(S,f){
 const F={front:{ax:'z',s:-1,outer:0},back:{ax:'z',s:1,outer:S.D},west:{ax:'x',s:-1,outer:-S.HW},east:{ax:'x',s:1,outer:S.HW}}[f],inner=F.outer-F.s*S.WT;
 const put=(acc,key,u0,u1,y0,y1,c0,c1,skip='')=>{if(F.ax==='z')acc.box(key,u0,u1,y0,y1,Math.min(c0,c1),Math.max(c0,c1),skip);else acc.box(key,Math.min(c0,c1),Math.max(c0,c1),y0,y1,u0,u1,skip);};
 return{F,inner,out:(acc,key,u0,u1,y0,y1,o0,o1,skip)=>put(acc,key,u0,u1,y0,y1,F.outer+F.s*o0,F.outer+F.s*o1,skip),in:(acc,key,u0,u1,y0,y1,i0,i1,skip)=>put(acc,key,u0,u1,y0,y1,inner-F.s*i0,inner-F.s*i1,skip),
  pt:(u,y,o)=>F.ax==='z'?[u,y,F.outer+F.s*o]:[F.outer+F.s*o,y,u],ptIn:(u,y,i)=>F.ax==='z'?[u,y,inner-F.s*i]:[inner-F.s*i,y,u]};}
// ---- the outside -----------------------------------------------------------------------------------------------------------------
function outside(T,S,ext,panes,rng){
 const {HW,D,G,FL,TOP,WT,EAVE,OVER,SLOPE,RIDGE}=S,lx=x=>x-S.CX,lz=z=>z-S.ZF,k=S.pieces();
 // the walls: brick on every face but the inside one (plaster, drawn with the inside), the tops under the eaves and the
 // bottoms in the ground; the side walls' ends meet the front and back walls inside
 for(const p of k.pieces){if(p.kind!=='wall')continue;const x0=lx(p.x0),x1=lx(p.x1),z0=lz(p.z0),z1=lz(p.z1),f=p.face;
  let skip={front:'pz',back:'nz',west:'px',east:'nx'}[f];if(p.y1>=TOP-.001)skip+='py';if(p.y0<=G+.001)skip+='ny';
  if(f==='west'||f==='east'){if(z0<=WT+.001)skip+='nz';if(z1>=D-WT-.001)skip+='pz';}
  ext.box(K.brick,x0,x1,p.y0,p.y1,z0,z1,skip);}
 for(const p of k.pieces){const x0=lx(p.x0),x1=lx(p.x1),z0=lz(p.z0),z1=lz(p.z1);
  if(p.kind==='plinth'||p.kind==='threshold')ext.box(K.stone,x0,x1,p.y0,p.y1,z0,z1,'ny');else if(p.kind==='landing')ext.box(K.pave,x0,x1,p.y0,p.y1,z0,z1,'ny');
  else if(p.kind==='planter'){/* brick, a stone rim, soil, clipped shrubs and flowers */ext.box(K.brick,x0,x1,p.y0,2.88,z0,z1,'ny py');const r=.08,y=2.88;
   ext.box(K.sill,x0-.04,x1+.04,y,2.96,z0-.04,z0+r);ext.box(K.sill,x0-.04,x1+.04,y,2.96,z1-r,z1+.04);ext.box(K.sill,x0-.04,x0+r,y,2.96,z0+r,z1-r);ext.box(K.sill,x1-r,x1+.04,y,2.96,z0+r,z1-r);
   up(ext,K.soil,x0+r,x1-r,z0+r,z1-r,2.93);const zc=(z0+z1)/2-.02;for(let x=x0+.45;x<x1-.3;x+=.62){ext.ball(rng()<.5?K.leaf:K.leafDark,x,3.1,zc,.27,.82,10);for(let j=0;j<3;j++)ext.ball(['#e05a7a','#f4d35e','#ffffff','#c45ab3'][(((Math.floor(x*7)+j)%4)+4)%4],x-.2+rng()*.4,3.26+rng()*.08,zc-.24+rng()*.1,.045,1,7);}}}
 // stone corner blocks, long and short in turn on each face; a stone band under the eaves
 /* each block is an L in the thickness of the wall: a piece on the front (or back) face, and the rest of it on the side */for(const sx of[-1,1])for(const back of[false,true])for(let i=0;i<12;i++){const y0=3.12+i*.305,y1=y0+.285,lf=i%2?.35:.6,ls=i%2?.6:.35,d=WT-.05,ox0=sx<0?-HW-.025:HW-lf,ox1=sx<0?-HW+lf:HW+.025,sx0=sx<0?-HW-.025:HW-d,sx1=sx<0?-HW+d:HW+.025;
  if(back){ext.box(K.stone,ox0,ox1,y0,y1,D-d,D+.025);ext.box(K.stone,sx0,sx1,y0,y1,D-ls,D-d);}else{ext.box(K.stone,ox0,ox1,y0,y1,-.025,d);ext.box(K.stone,sx0,sx1,y0,y1,d,ls);}}
 ext.box(K.sill,-HW-.07,HW+.07,6.78,6.98,-.07,0,'pz');ext.box(K.sill,-HW-.07,HW+.07,6.78,6.98,D,D+.07,'nz');ext.box(K.sill,-HW-.07,-HW,6.78,6.98,0,D,'px nz pz');ext.box(K.sill,HW,HW+.07,6.78,6.98,0,D,'nx nz pz');
 // the eaves: soffit, fascia, the dark edge of the slates, gutters, and a downpipe at each corner
 const E=HW+OVER,ZA=-OVER,ZB=D+OVER;
 down(ext,K.trim,-E,E,ZA,0,TOP);down(ext,K.trim,-E,E,D,ZB,TOP);down(ext,K.trim,-E,-HW,0,D,TOP);down(ext,K.trim,HW,E,0,D,TOP);
 ext.box(K.trim,-E-.04,E+.04,6.84,7.08,ZA-.04,ZA);ext.box(K.trim,-E-.04,E+.04,6.84,7.08,ZB,ZB+.04);ext.box(K.trim,-E-.04,-E,6.84,7.08,ZA,ZB);ext.box(K.trim,E,E+.04,6.84,7.08,ZA,ZB);
 ext.box(K.cap,-E-.08,E+.08,7.06,EAVE,ZA-.08,ZA+.02);ext.box(K.cap,-E-.08,E+.08,7.06,EAVE,ZB-.02,ZB+.08);ext.box(K.cap,-E-.08,-E+.02,7.06,EAVE,ZA+.02,ZB-.02);ext.box(K.cap,E-.02,E+.08,7.06,EAVE,ZA+.02,ZB-.02);
 ext.box(K.trim,-E-.14,E+.14,6.96,7.06,ZA-.14,ZA-.04);ext.box(K.trim,-E-.14,E+.14,6.96,7.06,ZB+.04,ZB+.14);ext.box(K.trim,-E-.14,-E-.04,6.96,7.06,ZA-.04,ZB+.04);ext.box(K.trim,E+.04,E+.14,6.96,7.06,ZA-.04,ZB+.04);
 for(const sx of[-1,1])for(const back of[false,true]){const x=sx*12.6,zw=back?D+.12:-.12,zg=back?ZB+.09:ZA-.09;ext.cyl(K.trim,x,G+.08,6.62,zw,.05,10);
  ext.geo(K.trim,new T.CylinderGeometry(.05,.05,Math.abs(zg-zw),10),ext.at(x,6.62,(zw+zg)/2,PI/2,0,0));ext.cyl(K.trim,x,6.62,6.97,zg,.05,10);ext.ball(K.trim,x,6.62,zw,.05,1,8);ext.ball(K.trim,x,6.62,zg,.05,1,8);}
 // the hipped roof: two long slopes, two hip ends, caps along the hips and the ridge
 const RX=E-(ZB-ZA)/2,RZ=(ZA+ZB)/2;
 poly(T,ext,K.shingle,[[-E,EAVE,ZA],[E,EAVE,ZA],[RX,RIDGE,RZ],[-RX,RIDGE,RZ]],[0,1,-1]);poly(T,ext,K.shingle,[[-E,EAVE,ZB],[E,EAVE,ZB],[RX,RIDGE,RZ],[-RX,RIDGE,RZ]],[0,1,1]);
 poly(T,ext,K.shingle,[[E,EAVE,ZA],[E,EAVE,ZB],[RX,RIDGE,RZ]],[1,1,0]);poly(T,ext,K.shingle,[[-E,EAVE,ZA],[-E,EAVE,ZB],[-RX,RIDGE,RZ]],[-1,1,0]);
 for(const sx of[-1,1])for(const zc of[ZA,ZB])along(T,ext,K.cap,[sx*E,EAVE,zc],[sx*RX,RIDGE,RZ],.17,.07,.025);
 ext.box(K.cap,-RX-.06,RX+.06,RIDGE-.03,RIDGE+.06,RZ-.11,RZ+.11);
 // the cupola: louvred white sides, a cornice, a copper roof, a gilded ball and the weather vane
 {const y=RIDGE,c=RZ,h=.66;ext.box(K.trim,-h,h,y-.6,y+.85,c-h,c+h,'ny');
  for(const[ax,s]of[['z',-1],['z',1],['x',-1],['x',1]]){const at=s*h;for(let i=0;i<7;i++){const yy=y+.18+i*.08;if(ax==='z')ext.box('#e3ded3',-h+.14,h-.14,yy,yy+.045,s<0?c-h-.035:c+h,s<0?c-h:c+h+.035);else ext.box('#e3ded3',s<0?-h-.035:h,s<0?-h:h+.035,yy,yy+.045,c-h+.14,c+h-.14);}
   if(ax==='z')ext.box('#30363b',-h+.15,h-.15,y+.15,y+.75,s<0?c-h-.006:c+h,s<0?c-h:c+h+.006);else ext.box('#30363b',s<0?-h-.006:h,s<0?-h:h+.006,y+.15,y+.75,c-h+.15,c+h-.15);}
  ext.box(K.trim,-h-.08,h+.08,y+.85,y+.95,c-h-.08,c+h+.08);ext.geo(K.copper,new T.CylinderGeometry(0,(h+.1)*Math.SQRT2,.85,4,1),ext.at(0,y+1.375,c,0,PI/4,0));
  ext.ball(K.gold,0,y+1.86,c,.065,1,10);ext.cyl(K.iron,0,y+1.8,y+2.45,c,.013,6);ext.box(K.iron,-.36,.36,y+2.17,y+2.2,c-.012,c+.012);ext.box(K.iron,.24,.4,y+2.12,y+2.25,c-.006,c+.006);
  ext.geo(K.iron,new T.ConeGeometry(.05,.14,4),ext.at(-.42,y+2.185,c,0,0,PI/2));ext.box(K.iron,-.012,.012,y+2.0,y+2.03,c-.26,c+.26);ext.box(K.iron,-.26,.26,y+2.0,y+2.03,c-.012,c+.012);}
 // ---- the windows ----
 for(const g of k.glass){if(!g.win)continue;const W=wallOf(S,g.face),w=g.win,a=w.a,b=w.b,y0=w.y0,y1=w.y1,m=(a+b)/2,big=!!w.big;
  W.out(ext,K.frame,a-.1,a+.02,y0,y1-.02,-.02,.04);W.out(ext,K.frame,b-.02,b+.1,y0,y1-.02,-.02,.04);W.out(ext,K.frame,a-.1,b+.1,y1-.02,y1+.1,-.02,.04);
  W.out(ext,K.sill,a-.15,b+.15,y0-.06,y0+.02,-.05,.08);W.out(ext,K.sill,a-.2,b+.2,y1+.12,y1+.32,-.02,.03);if(big)W.out(ext,K.sill,m-.13,m+.13,y1+.08,y1+.4,-.02,.055);
  const g0=-WT/2-.035,g1=-WT/2+.035;if(b-a>1.3)W.out(ext,K.frame,m-.03,m+.03,y0-.01,y1+.01,g0,g1);if(y1-y0>1.0){const t=y0+(y1-y0)*.7;W.out(ext,K.frame,a-.01,b+.01,t-.03,t+.03,g0+.005,g1-.005);}
  if(g.face==='front'){/* green louvred shutters and a flower box */for(const[u0,u1]of[[a-.82,a-.12],[b+.12,b+.82]]){const t0=y0-.05,t1=y1+.05,tm=(t0+t1)/2;W.out(ext,K.green,u0,u1,t0,t1,.01,.05);
    W.out(ext,K.green,u0,u0+.06,t0,t1,.05,.065);W.out(ext,K.green,u1-.06,u1,t0,t1,.05,.065);for(const[r0,r1]of[[t0,t0+.07],[tm-.035,tm+.035],[t1-.07,t1]])W.out(ext,K.green,u0+.06,u1-.06,r0,r1,.05,.065);
    for(let y=t0+.1;y<t1-.12;y+=.09){if(Math.abs(y+.015-tm)<.07)continue;W.out(ext,K.greenDark,u0+.07,u1-.07,y,y+.03,.05,.058);}}
   W.out(ext,K.green,a-.05,b+.05,3.26,3.54,.32,.34);W.out(ext,K.green,a-.05,b+.05,3.26,3.54,.1,.12);W.out(ext,K.green,a-.05,a-.03,3.26,3.54,.12,.32);W.out(ext,K.green,b+.03,b+.05,3.26,3.54,.12,.32);W.out(ext,K.green,a-.03,b+.03,3.26,3.29,.12,.32);
   W.out(ext,K.soil,a-.03,b+.03,3.47,3.5,.12,.32);for(const u of[a+.2,b-.26])W.out(ext,K.green,u,u+.06,3.12,3.26,0,.3);
   for(let u=a+.05;u<b;u+=.15){ext.ball(rng()<.5?K.leaf:K.leafDark,...W.pt(u,3.56,.22),.09,.75,8);ext.ball(['#e05a7a','#f4d35e','#ffffff','#d8402f','#c45ab3'][Math.floor(rng()*5)],...W.pt(u+(rng()-.5)*.08,3.62+rng()*.06,.15+rng()*.14),.04,1,7);}}
  panes.push({x:(g.x0+g.x1)/2-S.CX,y:(g.y0+g.y1)/2,z:(g.z0+g.z1)/2-S.ZF,w:g.axis==='z'?g.x1-g.x0:g.z1-g.z0,h:g.y1-g.y0,ry:g.axis==='x'?PI/2:0});}
 // ---- the front door: a green frame, a fanlight over it ----
 const Wf=wallOf(S,'front');
 Wf.out(ext,K.green,-1.55,-1.38,2.66,5.18,-.02,.05);Wf.out(ext,K.green,1.38,1.55,2.66,5.18,-.02,.05);Wf.out(ext,K.green,-1.55,1.55,5.18,5.36,-.02,.05);
 Wf.out(ext,K.green,-1.3,1.3,5.44,5.82,0,.03);Wf.out(ext,'#23343c',-1.22,1.22,5.5,5.76,.03,.035);for(const u of[-.41,0,.41])Wf.out(ext,K.green,u-.02,u+.02,5.5,5.76,.035,.045);
 // two lanterns by the door
 for(const x of[-2,2]){Wf.out(ext,K.iron,x-.06,x+.06,4.42,4.88,0,.02);Wf.out(ext,K.iron,x-.015,x+.015,4.78,4.82,.02,.06);
  for(const[dx,o]of[[-.085,.055],[.085,.055],[-.085,.205],[.085,.205]])Wf.out(ext,K.iron,x+dx-.01,x+dx+.01,4.49,4.79,o-.01,o+.01);
  Wf.out(ext,K.iron,x-.11,x+.11,4.79,4.84,.03,.23);Wf.out(ext,K.iron,x-.06,x+.06,4.84,4.89,.09,.17);Wf.out(ext,K.iron,x-.1,x+.1,4.46,4.49,.04,.22);}
 // two benches against the wall under the porch
 for(const s of[-1,1]){const u0=s<0?-2.95:1.75,u1=s<0?-1.75:2.95;for(let i=0;i<4;i++){const o0=.08+i*.115;Wf.out(ext,K.bench,u0+.04,u1-.04,3.08,3.12,o0,o0+.095);}
  for(const y of[3.3,3.46,3.62])Wf.out(ext,K.bench,u0+.04,u1-.04,y,y+.1,.06,.085);
  for(const u of[u0,u1-.04]){Wf.out(ext,K.iron,u,u+.04,2.7,3.38,.47,.51);Wf.out(ext,K.iron,u,u+.04,2.7,3.78,.06,.1);Wf.out(ext,K.iron,u,u+.04,3.34,3.38,.1,.47);Wf.out(ext,K.iron,u,u+.04,3.06,3.08,.1,.47);}}
 // ---- the porch: round columns, the beam with the name, the ceiling, a gabled roof and its pediment ----
 for(const x of[-3,3]){ext.box(K.trim,x-.18,x+.18,2.7,2.92,-3.18,-2.82,'ny');ext.cyl(K.trim,x,2.92,5.25,-3,.14,20,.125);ext.box(K.trim,x-.17,x+.17,5.25,5.33,-3.17,-2.83);ext.box(K.trim,x-.19,x+.19,5.33,5.45,-3.19,-2.81);}
 ext.box(K.trim,-3.75,3.75,5.45,5.95,-3.1,-2.9);for(const s of[-1,1])ext.box(K.trim,s<0?-3.72:3.55,s<0?-3.55:3.72,5.68,5.95,-2.9,0,'pz');
 down(ext,K.trim,-3.55,3.55,-2.9,0,5.94);
 {const yr=7.48,xe=3.85,sl=.42,ye=yr-xe*sl,z0=-3.35,z1=.75;
  for(const s of[-1,1]){poly(T,ext,K.shingle,[[0,yr,z0],[0,yr,z1],[s*xe,ye,z1],[s*xe,ye,z0]],[s,1,0]);poly(T,ext,K.trim,[[0,yr-.1,z0],[0,yr-.1,z1],[s*xe,ye-.1,z1],[s*xe,ye-.1,z0]],[0,-1,0]);
   ext.box(K.trim,s<0?-xe-.01:xe-.05,s<0?-xe+.05:xe+.01,ye-.13,ye-.005,z0,0,'pz');along(T,ext,K.trim,[0,yr,z0-.03],[s*xe,ye,z0-.03],.06,.22,-.12);}
  ext.box(K.cap,-.11,.11,yr-.04,yr+.05,z0-.04,z1);
  const tri=new T.Shape();tri.moveTo(-3.43,0);tri.lineTo(3.43,0);tri.lineTo(0,1.44);tri.lineTo(-3.43,0);ext.geo(K.trim,new T.ExtrudeGeometry(tri,{depth:.14,bevelEnabled:false}),ext.at(0,5.95,-3.08));
  ext.geo(K.green,new T.CylinderGeometry(.34,.34,.04,32),ext.at(0,6.6,-3.1,PI/2,0,0));ext.geo(K.gold,new T.TorusGeometry(.34,.025,8,32),ext.at(0,6.6,-3.12));
  for(let i=0;i<8;i++){const a=i/8*PI*2;ext.geo(K.gold,new T.BoxGeometry(.02,.2,.01),ext.at(Math.cos(a)*.17,6.6+Math.sin(a)*.17,-3.125,0,0,a-PI/2));}ext.geo(K.gold,new T.CylinderGeometry(.07,.07,.02,20),ext.at(0,6.6,-3.13,PI/2,0,0));}
 // ---- the scooter bays, the air units and two trees behind ----
 const ly=S.LOT.y;for(let i=0;i<=4;i++)ext.box('#eef0e8',13.35,15.6,ly-.005,ly+.015,.45+i*1.5,.55+i*1.5,'ny');
 ext.geo(K.metal,new T.CylinderGeometry(.03,.03,5.6,10),ext.at(13.28,3.3,3.5,PI/2,0,0));for(const z of[.69,6.31])ext.cyl(K.metal,13.28,ly-.02,3.34,z,.04,10);
 for(let i=0;i<4;i++){const z=1.25+i*1.5;ext.geo(K.metal,new T.TorusGeometry(.32,.02,6,16,PI),ext.at(13.28,ly+.02,z,0,PI/2,0));}
 ext.cyl(K.metal,15.8,ly-.02,5.0,.2,.05,10);ext.box(K.green,15.4,16.2,4.4,4.9,.08,.14);
 for(const x of[-5.4,4.0]){ext.box(K.concrete,x-.7,x+.7,G-.02,G+.06,D+.45,D+1.45,'ny');ext.box('#cfd2d3',x-.55,x+.55,G+.06,G+.95,D+.6,D+1.3);ext.cyl('#30363b',x,G+.95,G+.965,D+.95,.3,20);ext.box('#3a4045',x-.45,x+.45,G+.15,G+.85,D+1.3,D+1.31);}
 for(const[x,z]of[[-10.5,27.0],[8.5,27.5]]){ext.cyl(K.bark,x,G-.1,G+3.0,z,.15,9,.11);for(let i=0;i<7;i++)ext.ball(i%2?K.leaf:K.leafDark,x+(rng()-.5)*1.8,G+3.4+rng()*1.3,z+(rng()-.5)*1.8,1.0+rng()*.5,.85,10);}
}
// ---- the inside: walls, floors, ceiling, trims, window linings, doors ------------------------------------------------------------
function inside(T,S,inn,panes){
 const {HW,D,FL,CEIL,WT,DOOR_HEAD}=S,lx=x=>x-S.CX,lz=z=>z-S.ZF,k=S.pieces();
 for(const p of k.pieces){const x0=lx(p.x0),x1=lx(p.x1),z0=lz(p.z0),z1=lz(p.z1),f=p.face;
  if(p.kind==='part'){inn.box(K.plaster,x0,x1,p.y0,p.y1,z0,z1,p.y0<FL?'py ny':'py');continue;}
  if(p.kind!=='wall')continue;const y0=Math.max(p.y0,FL),y1=Math.min(p.y1,CEIL);if(y1<=y0)continue;
  if(f==='front')face(inn,K.plaster,'z',WT,Math.max(x0,-HW+WT),Math.min(x1,HW-WT),y0,y1,1);else if(f==='back')face(inn,K.plaster,'z',D-WT,Math.max(x0,-HW+WT),Math.min(x1,HW-WT),y0,y1,-1);
  else if(f==='west')face(inn,K.plaster,'x',-HW+WT,z0,z1,y0,y1,1);else face(inn,K.plaster,'x',HW-WT,z0,z1,y0,y1,-1);}
 // floors: wood in the hall and common room, carpet in the dormitory, tiles in the washrooms; the ceiling over all
 const fy=FL+.002,X0=-HW+WT,X1=HW-WT;
 up(inn,K.floor,X0,X1,WT,9.0,fy);up(inn,K.floor,-4.0,X1,9.0,12.0,fy);for(const[a,b]of[[-3.6,-2.4],[10.7,11.9]])up(inn,K.floor,a,b,12.0,12.15,fy);
 up(inn,K.carpet,-4.0,X1,12.15,D-WT,fy);up(inn,K.tile,X0,-4.15,9.15,D-WT,fy);up(inn,K.tile,-6.4,-5.2,9.0,9.15,fy);up(inn,K.tile,-4.15,-4.0,13.0,14.2,fy);
 down(inn,K.ceiling,X0,X1,WT,D-WT,CEIL-.002);inn.box('#3b3f42',-1.2,1.2,FL,FL+.014,.45,1.4,'ny');
 // skirting, sage panelling and a rail (tiles and a cap in the washrooms), and a cornice under the ceiling; runs along x
 // go through the corners, runs along z stop at their faces (ca/cb), and at the one outside corner the x run goes past (xb)
 const ROOM=[[.02,FL,FL+.12,K.white],[.012,FL,FL+.75,K.sage],[.03,FL+.72,FL+.78,K.white]],WASH=[[.012,FL,FL+1.3,K.wallTile],[.022,FL+1.28,FL+1.34,K.white]],CROWN=[.045,CEIL-.1,CEIL,K.white];
 const run=(ax,at,dir,a,b,o={})=>{for(const L of[...(o.wash?WASH:ROOM),CROWN]){const[p,y0,y1,key]=L,crown=L===CROWN,s=a+(o.ca?p:0),e=b-(o.cb?p:0)+(o.xb?p:0),segs=[];let cur=s;
   for(const[g0,g1]of crown?[]:(o.gaps||[]).slice().sort((q,r)=>q[0]-r[0])){if(g0>cur)segs.push([cur,g0]);cur=Math.max(cur,g1);}if(e>cur)segs.push([cur,e]);
   const c0=at,c1=at+dir*p,lo=Math.min(c0,c1),hi=Math.max(c0,c1),skip=(ax==='x'?(dir>0?'nz':'pz'):(dir>0?'nx':'px'))+(crown?' py':' ny');
   for(const[u0,u1]of segs){if(u1-u0<.005)continue;if(ax==='x')inn.box(key,u0,u1,y0,y1,lo,hi,skip);else inn.box(key,lo,hi,y0,y1,u0,u1,skip);}}};
 const gap=list=>list.map(([a,b])=>[a-.09,b+.09]),DORM=[[-3.6,-2.4],[10.7,11.9]];
 run('x',WT,1,X0,X1,{gaps:[[-1.475,1.475]]});run('z',X0,1,WT,9.0,{ca:1,cb:1});run('z',X1,-1,WT,12.0,{ca:1,cb:1});
 run('x',12.0,-1,-4.0,X1,{gaps:gap(DORM)});run('z',-4.0,1,9.0,12.0,{cb:1});run('x',9.0,-1,X0,-4.0,{xb:1,gaps:gap([[-6.4,-5.2]])});
 run('x',12.15,1,-4.0,X1,{gaps:gap(DORM)});run('z',-4.0,1,12.15,D-WT,{ca:1,cb:1,gaps:gap([[13.0,14.2]])});run('z',X1,-1,12.15,D-WT,{ca:1,cb:1});run('x',D-WT,-1,-4.0,X1);
 run('z',X0,1,9.15,D-WT,{ca:1,cb:1,wash:1});run('x',D-WT,-1,X0,-4.15,{wash:1});run('z',-4.15,-1,9.15,D-WT,{ca:1,cb:1,wash:1,gaps:gap([[13.0,14.2]])});run('x',9.15,1,X0,-4.15,{wash:1,gaps:gap([[-6.4,-5.2]])});
 // tiles up the wall in each shower
 for(const[z0,z1]of S.SHOWERS)inn.box(K.wallTile,-4.162,-4.15,FL+1.34,4.9,z0,z1,'px');
 // white casings round the inner doorways, on both faces
 const casing=(ax,at,dir,g0,g1,top)=>{const c0=at,c1=at+dir*.02,lo=Math.min(c0,c1),hi=Math.max(c0,c1),skip=(ax==='x'?(dir>0?'nz':'pz'):(dir>0?'nx':'px'))+' ny',B=(u0,u1,y0,y1)=>ax==='x'?inn.box(K.white,u0,u1,y0,y1,lo,hi,skip):inn.box(K.white,lo,hi,y0,y1,u0,u1,skip);
  B(g0-.09,g0,FL,top+.09);B(g1,g1+.09,FL,top+.09);B(g0,g1,top,top+.09);};
 for(const[a,b]of DORM){casing('x',12.0,-1,a,b,DOOR_HEAD);casing('x',12.15,1,a,b,DOOR_HEAD);}casing('z',-4.15,-1,13.0,14.2,DOOR_HEAD);casing('z',-4.0,1,13.0,14.2,DOOR_HEAD);casing('x',9.0,-1,-6.4,-5.2,DOOR_HEAD);casing('x',9.15,1,-6.4,-5.2,DOOR_HEAD);
 // the windows from inside: white linings in the reveal, a window board and apron, a casing round each
 for(const g of k.glass){if(!g.win)continue;const W=wallOf(S,g.face),w=g.win,a=w.a,b=w.b,y0=w.y0,y1=w.y1,r0=-WT/2+.01;
  W.in(inn,K.white,a,a+.015,y0+.03,y1-.015,r0,0);W.in(inn,K.white,b-.015,b,y0+.03,y1-.015,r0,0);W.in(inn,K.white,a,b,y1-.015,y1,r0,0);
  W.in(inn,K.white,a-.06,b+.06,y0,y0+.03,r0,.05);W.in(inn,K.white,a-.04,b+.04,y0-.09,y0,0,.015);
  W.in(inn,K.white,a-.08,a+.015,y0+.03,y1+.08,0,.02);W.in(inn,K.white,b-.015,b+.08,y0+.03,y1+.08,0,.02);W.in(inn,K.white,a+.015,b-.015,y1-.015,y1+.08,0,.02);}
 // the front doorway: green linings, a white casing, and both glass doors standing open against the wall
 const Wf=wallOf(S,'front'),dr=-(WT-.02);
 Wf.in(inn,K.green,-1.4,-1.385,FL+.02,5.2,dr,0);Wf.in(inn,K.green,1.385,1.4,FL+.02,5.2,dr,0);Wf.in(inn,K.green,-1.385,1.385,5.185,5.2,dr,0);
 Wf.in(inn,K.white,-1.475,-1.385,FL,5.29,0,.02,'ny');Wf.in(inn,K.white,1.385,1.475,FL,5.29,0,.02,'ny');Wf.in(inn,K.white,-1.385,1.385,5.185,5.29,0,.02);
 for(const s of[-1,1]){const L0=s<0?-2.84:1.48,L1=s<0?-1.48:2.84;Wf.in(inn,K.green,L0,L0+.08,FL+.02,5.15,.03,.08);Wf.in(inn,K.green,L1-.08,L1,FL+.02,5.15,.03,.08);
  for(const[r0,r1]of[[FL+.02,FL+.25],[3.65,3.73],[5.05,5.15]])Wf.in(inn,K.green,L0+.08,L1-.08,r0,r1,.03,.08);Wf.in(inn,K.gold,s<0?L0+.1:L1-.12,s<0?L0+.12:L1-.1,3.5,4.1,.08,.11);
  const z=WT+.055;for(const[q0,q1]of[[FL+.25,3.65],[3.73,5.05]])panes.push({x:(L0+L1)/2,y:(q0+q1)/2,z,w:L1-L0-.16,h:q1-q0,ry:0});}
}
// ---- the furniture (built near, taken down far) -------------------------------------------------------------------------------
function furnish(scene){
 const S=SH(),R=AR(),T=scene.T,Lk=LK();if(!S||!R?.Room||!R.kit||!R.makeMats||!Lk)return null;
 const L={...R.LOOKS.california,...LOOK_OVER},M=R.makeMats(T,L),room=new R.Room(T,M),kit=R.kit(room,L,'shelter'),base=M.throw;
 const throws=THROWS.map(c=>{const m=base.clone();m.color=new T.Color(c);return m;});
 for(const it of S.items()){const f=kit[it.k];if(!f)continue;if(it.k==='bed')M.throw=throws[it.bed%throws.length];try{f(it);}catch(e){scene.shelterRoomError=(scene.shelterRoomError||'')+it.k+': '+(e&&e.message)+'; ';}M.throw=base;}
 const kitG=room.build('shelter-inside');kitG.position.set(S.CX,S.FL,S.ZF);
 const fur=new Lk.Acc(T),{FL,D,WT}=S,lx=x=>x-S.CX,lz=z=>z-S.ZF;
 // the reception desk: panelled wood, a stone top, a ledge on the staff side, a screen, a telephone, a bell and flowers
 fur.box(K.desk,-2.2,2.2,FL,FL+1.0,6.02,6.7,'ny');for(let i=0;i<4;i++){const x0=-2.15+i*1.075;fur.box(K.desk,x0+.04,x0+1.035,FL+.12,FL+.9,6.0,6.02,'pz');fur.box(K.deskDark,x0+.1,x0+.975,FL+.18,FL+.84,5.995,6.0,'pz');}
 fur.box('marble|#ddd8cf',-2.3,2.3,FL+1.0,FL+1.06,5.95,6.75);fur.box(K.desk,-2.1,2.1,FL+.72,FL+.76,6.7,7.0);
 fur.box('#1c1f22',-1.0,-.7,FL+1.06,FL+1.07,6.3,6.5,'ny');fur.box('#1c1f22',-.87,-.83,FL+1.07,FL+1.25,6.44,6.48);fur.box('#1c1f22',-1.15,-.55,FL+1.2,FL+1.56,6.38,6.42);fur.box('#2b3a46',-1.12,-.58,FL+1.23,FL+1.53,6.42,6.425,'nz');
 fur.box('#1c1f22',.7,.95,FL+1.06,FL+1.13,6.3,6.5,'ny');fur.geo(K.gold,new T.SphereGeometry(.05,14,8,0,PI*2,0,PI/2),fur.at(.2,FL+1.06,6.12));fur.cyl('#f4f2ec',1.75,FL+1.06,FL+1.22,6.3,.05,14);
 for(let j=0;j<5;j++)fur.ball(['#e05a7a','#f4d35e','#ffffff','#c45ab3','#d8402f'][j],1.75+(j-2)*.03,FL+1.3+(j%2)*.04,6.3+(j%3-1)*.03,.035,1,7);
 // the water cooler
 fur.box('#f1f1ef',-4.78,-4.42,FL,FL+.95,8.37,8.73,'ny');fur.box('#2f3438',-4.72,-4.48,FL+.62,FL+.82,8.365,8.37,'pz');fur.cyl('#8fbcd6',-4.6,FL+.95,FL+1.37,8.55,.14,18);fur.cyl('#3f6e9a',-4.6,FL+1.37,FL+1.42,8.55,.05,10);
 // the planter between the hall and the common room
 fur.box(K.desk,3.9,4.3,FL,FL+.75,1.0,4.6,'ny py');fur.box(K.desk,3.88,4.32,FL+.75,FL+.78,.98,4.62);/* three potted plants stand on it (the kit's, in the furniture list) */
 // the notice board by the dormitory door
 {const z=12.0;fur.box(K.cork,.6,2.6,FL+1.2,FL+2.2,z-.02,z,'pz');for(const[a,b,c,d]of[[.55,2.65,FL+1.15,FL+1.2],[.55,2.65,FL+2.2,FL+2.25],[.55,.6,FL+1.2,FL+2.2],[2.6,2.65,FL+1.2,FL+2.2]])fur.box(K.deskDark,a,b,c,d,z-.03,z,'pz');
  for(let i=0;i<7;i++){const x=.75+i*.27,y=FL+1.35+(i%3)*.26;fur.box(i%3===1?'#f6e8a8':'#f6f3ea',x,x+.2,y,y+.26,z-.025,z-.02,'pz');fur.ball('#c0392b',x+.1,y+.23,z-.03,.012,1,6);}}
 // the lockers along the washroom wall, a door each with vents, a handle and a number
 {const B=S.LOCKERS,n=12,dz=(B.z1-B.z0)/n;fur.box(K.locker,B.x0,B.x1-.02,FL,FL+B.h,B.z0,B.z1,'ny');
  for(let i=0;i<n;i++){const z0=B.z0+i*dz+.004,z1=B.z0+(i+1)*dz-.004;fur.box(K.lockerDoor,B.x1-.02,B.x1,FL+.08,FL+B.h-.04,z0,z1,'nx');
   for(let v=0;v<4;v++)fur.box('#2a3238',B.x1,B.x1+.004,FL+1.55+v*.06,FL+1.57+v*.06,(z0+z1)/2-.13,(z0+z1)/2+.13,'nx');fur.box(K.chrome,B.x1,B.x1+.02,FL+.95,FL+1.1,z1-.08,z1-.05,'nx');fur.box('#f4f2ec',B.x1,B.x1+.004,FL+1.82,FL+1.88,(z0+z1)/2-.05,(z0+z1)/2+.05,'nx');}}
 // the stalls (laminate on chrome feet), the shower trays, heads and taps, a bench, a towel rail
 for(const p of S.pieces().pieces){if(!/:stall(Wall|Front)/.test(p.id))continue;const x0=lx(p.x0),x1=lx(p.x1),z0=lz(p.z0),z1=lz(p.z1);fur.box(K.laminate,x0,x1,p.y0,p.y1,z0,z1);
  for(const z of[z0+.06,z1-.06])if(z1-z0>.3)fur.cyl(K.chrome,(x0+x1)/2,FL,p.y0,z,.018,8);if(z1-z0<=.3)fur.cyl(K.chrome,(x0+x1)/2,FL,p.y0,(z0+z1)/2,.018,8);}
 for(const p of S.pieces().pieces)if(/:showerWall/.test(p.id))fur.box(K.wallTile,lx(p.x0),lx(p.x1),FL,p.y1,lz(p.z0),lz(p.z1),'ny');
 for(const[z0,z1]of S.SHOWERS){const zc=(z0+z1)/2;fur.box('#f4f4f2',-5.43,-4.19,FL,FL+.04,z0+.03,z1-.03,'ny');fur.cyl('#7d858a',-4.8,FL+.04,FL+.045,zc,.05,12);
  fur.geo(K.chrome,new T.CylinderGeometry(.015,.015,.3,8),fur.at(-4.3,4.88,zc,0,0,PI/2));fur.cyl(K.chrome,-4.45,4.77,4.82,zc,.1,18);fur.geo(K.chrome,new T.CylinderGeometry(.05,.05,.03,16),fur.at(-4.177,FL+1.1,zc,0,0,PI/2));}
 for(let i=0;i<4;i++)fur.box(K.bench,-8.5,-6.5,FL+.41,FL+.45,15.5+i*.1+.005,15.5+i*.1+.09);for(const x of[-8.4,-6.6])for(const z of[15.56,15.84])fur.cyl(K.chrome,x,FL,FL+.41,z,.018,8);
 {const z=9.15;fur.geo(K.chrome,new T.CylinderGeometry(.015,.015,2.2,8),fur.at(-10.5,FL+1.58,z+.07,0,0,PI/2));for(const x of[-11.55,-9.45])fur.box(K.chrome,x-.01,x+.01,FL+1.56,FL+1.6,z,z+.07,'nz');
  ['#dfe8ef','#f2e6d8','#d9e6da'].forEach((c,i)=>{const x=-11.15+i*.65;fur.box(c,x-.22,x+.22,FL+1.0,FL+1.6,z+.05,z+.09);});}
 const furG=fur.build(key=>matOf(T,key),'shelter-furniture',true);furG.position.set(S.CX,0,S.ZF);
 const g=new T.Group();g.name='shelter-furnished';g.add(kitG,furG);return g;}
// the materials of a key: a plain colour, a texture ('brick'), or a tinted texture ('stucco|#f3eadb')
/* ('room:oak', 'room:plaster|#f1e8d8': the apartments' own floor, plaster and tile textures) */let paintMat=null;const roomMats=new Map();
function matOf(T,key){const L=LK(),M=L.materials(T);if(key==='paint')return paintMat||(paintMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.62}));
 if(key.startsWith('room:')){let m=roomMats.get(key);if(!m){const[name,tint]=key.slice(5).split('|');m=new T.MeshStandardMaterial({map:AR().tex(T,name),color:tint||'#ffffff',roughness:name==='subway'||name==='terrazzo'?.22:name==='oak'?.45:.92});roomMats.set(key,m);}return m;}
 const[b,t]=key.split('|');return t?L.tinted(T,M,b,t):M[b]||M.white;}
// ---- the look ----------------------------------------------------------------------------------------------------------------
function plate(T,text,sub,wpx,hpx){
 const c=document.createElement('canvas');c.width=wpx;c.height=hpx;const g=c.getContext('2d');
 g.fillStyle='#2d4e3d';g.fillRect(0,0,wpx,hpx);g.strokeStyle='#d9c99a';g.lineWidth=Math.max(2,hpx*.04);g.strokeRect(g.lineWidth,g.lineWidth,wpx-2*g.lineWidth,hpx-2*g.lineWidth);
 g.fillStyle='#f3ead2';g.textAlign='center';g.textBaseline='middle';
 g.font='700 '+Math.round(hpx*(sub?.4:.5))+'px "Segoe UI",Arial,sans-serif';g.fillText(text,wpx/2,hpx*(sub?.39:.52),wpx*.9);
 if(sub){g.font='400 '+Math.round(hpx*.2)+'px "Segoe UI",Arial,sans-serif';g.globalAlpha=.9;g.fillText(sub,wpx/2,hpx*.75,wpx*.9);}
 const t=new T.CanvasTexture(c);if('colorSpace' in t&&T.SRGBColorSpace)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
function build(scene){
 install();const S=SH(),T=scene.T,Lk=LK();if(!S||!T||!scene.world?.shelter)return;dispose(scene);
 const group=new T.Group();group.name='shelter-look';const textures=[];
 if(Lk?.Acc){try{const ext=new Lk.Acc(T),inn=new Lk.Acc(T),panes=[],rng=Lk.rng(Lk.hash('harborlight'));outside(T,S,ext,panes,rng);inside(T,S,inn,panes);
   const mats=key=>matOf(T,key),eg=ext.build(mats,'shelter-outside',true),ig=inn.build(mats,'shelter-inner',false);eg.position.set(S.CX,0,S.ZF);ig.position.set(S.CX,0,S.ZF);group.add(eg,ig);
   const glassM=new T.MeshPhysicalMaterial({color:'#b9d3dc',roughness:.06,metalness:.1,transparent:true,opacity:.26,depthWrite:false,side:T.DoubleSide});
   for(const q of panes){const m=new T.Mesh(new T.PlaneGeometry(q.w,q.h),glassM);m.position.set(S.CX+q.x,q.y,S.ZF+q.z);m.rotation.y=q.ry;m.renderOrder=2;group.add(m);}
   for(const g of S.pieces().glass)if(g.shower){const m=new T.Mesh(new T.PlaneGeometry(g.z1-g.z0,g.y1-g.y0),glassM);m.position.set((g.x0+g.x1)/2,(g.y0+g.y1)/2,(g.z0+g.z1)/2);m.rotation.y=PI/2;m.renderOrder=2;group.add(m);}}
  catch(err){scene.shelterLookError=String(err&&err.stack||err);}}
 const k=S.pieces();
 const panelM=new T.MeshStandardMaterial({color:'#fffaf0',emissive:'#fff1d6',emissiveIntensity:1.4,roughness:.6}),lampM=new T.MeshStandardMaterial({color:'#fff2d0',emissive:'#ffd98f',emissiveIntensity:1.8,roughness:.5});
 const inst=(list,mat)=>{if(!list.length)return;const im=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat,list.length),m=new T.Matrix4();list.forEach((l,i)=>{m.makeScale(l.w,l.h,l.d).setPosition(l.x,l.y,l.z);im.setMatrixAt(i,m);});im.instanceMatrix.needsUpdate=true;group.add(im);};
 inst(k.lights.filter(l=>l.kind==='panel'),panelM);inst(k.lights.filter(l=>l.kind==='lamp'),lampM);
 for(const s of k.signs){const px=Math.round(220*s.h),tex=plate(T,s.text,s.sub,Math.round(px*s.w/s.h),px);textures.push(tex);const m=new T.Mesh(new T.PlaneGeometry(s.w,s.h),new T.MeshBasicMaterial({map:tex}));m.position.set(s.x,s.y,s.z);m.rotation.y=s.ry||0;group.add(m);}
 const lights=new T.Group();lights.name='shelter-lights';for(const [x,z,i] of [[0,5,.9],[7.5,6,.8],[4,17,.9],[-8.5,15,.7],[-8.5,4,.7]]){const l=new T.PointLight('#ffe9cc',i,13,2);l.position.set(S.CX+x,S.CEIL-.5,S.ZF+z);lights.add(l);}
 scene.scene.add(group);scene.shelterLook={group,lights,lightsOn:false,textures,furnished:null};}
function dropFurniture(a){const g=a.furnished;if(!g)return;g.removeFromParent();g.traverse(o=>{if(o.geometry)o.geometry.dispose();});a.furnished=null;}
function draw(scene){
 const a=scene.shelterLook,S=SH(),sim=root.PlatdoCity?.sim;if(!a||!S)return;const cx=S.CX,cz=S.ZF+S.D/2;
 const cam=scene.camera?.position,dc=cam?Math.hypot(cam.x-cx,cam.z-cz):1e9,p=sim?.player,dp=p?Math.hypot(p.x-cx,p.z-cz):1e9,d=Math.min(dc,dp);
 if(!a.furnished&&d<45){try{a.furnished=furnish(scene);if(a.furnished)a.group.add(a.furnished);}catch(err){scene.shelterRoomError=String(err&&err.stack||err);a.furnished=null;}}
 else if(a.furnished&&d>70)dropFurniture(a);
 if(!p)return;const want=dp<34;if(want!==a.lightsOn){if(want)scene.scene.add(a.lights);else a.lights.removeFromParent();a.lightsOn=want;}}
function dispose(scene){const a=scene.shelterLook;if(!a)return;dropFurniture(a);a.group.removeFromParent();a.lights.removeFromParent();a.group.traverse(o=>{if(o.geometry)o.geometry.dispose();});for(const t of a.textures)t.dispose();scene.shelterLook=null;}
install();
/* ownsParts: the shelter's parts are drawn here, not as plain boxes by the island (city-shelter.js reads this) */
root.CityShelterLook={build,draw,dispose,install,storyStart,park,bedNear,home,furnish,ownsParts:true};
})(typeof globalThis!=='undefined'?globalThis:this);
