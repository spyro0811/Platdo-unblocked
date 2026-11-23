/* Two-player bank chase. The room host advances this simulation. Both clients
   use its street plan and scripted shots; clients only submit control axes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlatdoCopChaseCore=api;})(globalThis,function(){
'use strict';
const Map=typeof module==='object'&&module.exports?require('./chase-map.js'):globalThis.PlatdoChaseMap;
const Opening=typeof module==='object'&&module.exports?require('./chase-opening-state.js'):globalThis.PlatdoChaseOpeningState;
const block=68,street=Map.street,edge=1350,intro=Opening.duration,outro=4.2,stepSize=1/100;
const tune={cop:{max:40,engine:8.5,brake:24,grip:9.2,turn:1.35},robber:{max:60,engine:12,brake:17,grip:5.8,turn:1.08}};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const finite=v=>Number.isFinite(v)?v:0;
const buildings=Map.buildings;
function vehicle(x,z){return {x,y:0,z,yaw:0,speed:0,vx:0,vz:0,steer:0,impact:0,respawnRevision:0};}
function scripted(t){
  return Opening.vehicles(t,Map.anchors);
}
function contact(a,b){
  if(Math.hypot(a.x-b.x,a.z-b.z)>4.7)return false;
  const basis=p=>[[Math.cos(p.yaw),-Math.sin(p.yaw)],[Math.sin(p.yaw),Math.cos(p.yaw)]];
  const A=basis(a),B=basis(b),project=(axis,set)=>Math.abs(axis[0]*set[0][0]+axis[1]*set[0][1])*.97+Math.abs(axis[0]*set[1][0]+axis[1]*set[1][1])*2.12;
  return [...A,...B].every(axis=>Math.abs((a.x-b.x)*axis[0]+(a.z-b.z)*axis[1])<=project(axis,A)+project(axis,B));
}
// The bank district supplies flat intersecting streets to the same chassis, tire,
// gearbox and swept collision solver used by solo Drive.
const runs=new WeakMap();
let district;
function makeDistrict(Drive){
  const route={
    map:{id:'bank-district'},length:5400,width:street,halfWidth:street/2,barrierOffset:street/2,
    at(s){return {x:0,y:0,z:s,s,offset:0,tx:0,tz:1,nx:1,nz:0,yaw:0};},
    nearest(x,z){return Map.nearestRoad(x,z);},
    sceneryNear:Drive.Route.prototype.sceneryNear
  };
  const geometry=Map.colliders.map(b=>({...b})),b=Map.bounds;
  geometry.push({id:'west-boundary',kind:'building',x:b.minX,z:0,width:.6,length:b.maxZ-b.minZ,height:1.04},
    {id:'east-boundary',kind:'building',x:b.maxX,z:0,width:.6,length:b.maxZ-b.minZ,height:1.04},
    {id:'north-boundary',kind:'building',x:0,z:b.minZ,width:b.maxX-b.minX,length:.6,height:1.04},
    {id:'south-boundary',kind:'building',x:0,z:b.maxZ,width:b.maxX-b.minX,length:.6,height:1.04});
  Drive.Route.prototype.registerScenery.call(route,geometry);return route;
}
function chassis(car,role){
  let run=runs.get(car);
  if(!run){
    const Drive=typeof module==='object'&&module.exports?require('../platdo-drive/src/core.js'):globalThis.DriveCore;
    district??=makeDistrict(Drive);
    const spec=tune[role],base=Drive.getConfig(role==='cop'?'vektor':'apex');
    run=new Drive.Simulation(district,{...base,maxSpeed:spec.max,accel:spec.engine,brake:spec.brake,grip:spec.grip},{mode:'free',trafficCount:0});
    Object.assign(run.player,car);runs.set(car,run);
  }
  return run;
}
function copyPose(car,run,dt){
  const p=run.player;
  for(const name of ['x','y','z','vx','vz','yaw','speed','steer','slip','roll','pitch','wheelSpin','driftIntensity','rpm','brake','gear','engineRPM','shifting','engineLoad','throttle','yawRate','condition','destroyed','wrecked'])car[name]=p[name]??(name==='destroyed'||name==='wrecked'?false:0);
  if(car.damageRevision!==p.damageRevision||!car.damage){
    car.damageRevision=p.damageRevision;
    car.damage={...p.damage,wheels:[...p.damage.wheels],parts:[...p.damage.parts]};
    car.impacts=p.impacts.map(hit=>({...hit}));
    car.lastImpact=p.lastImpact?{...p.lastImpact}:null;
  }
  const hit=run.events.find(e=>e.type==='collision'&&e.impact>1);
  if(hit){car.hitNumber=(car.hitNumber||0)+1;car.hitSpeed=hit.impact;car.impact=1;}
  else car.impact=Math.max(0,car.impact-dt*3);
  run.events.length=0;
}
function advance(car,input,role,dt){
  const run=chassis(car,role);
  run.transmission=input.manual?'manual':'automatic';
  if(run.finished)run.stepAfterWreck(dt);else run.step(dt,input);
  copyPose(car,run,dt);
}
function captureImpact(cars){
  const Drive=typeof module==='object'&&module.exports?require('../platdo-drive/src/core.js'):globalThis.DriveCore;
  const a=chassis(cars.cop,'cop'),b=chassis(cars.robber,'robber');
  const hit=Drive.Collision.boxContact(a.player,b.player,a.config.width,a.config.length,b.config.width,b.config.length);
  if(!hit)return;
  const impact=Drive.Collision.resolveImpulse(a.player,b.player,hit);
  a._collision('robber',impact.impact,false,{...hit,...impact,surface:'vehicle'});
  b._collision('cop',impact.impact,false,{...hit,...impact,nx:-hit.nx,nz:-hit.nz,surface:'vehicle'});
  copyPose(cars.cop,a,0);copyPose(cars.robber,b,0);
}
const empty=()=>({steer:0,throttle:0,brake:0,handbrake:false});
function create(map,durationSeconds=180){
  const duration=clamp(Number(durationSeconds)||180,60,600),keys={cop:empty(),robber:empty()};
  let time=0,phase='intro',phaseTime=0,remaining=duration,outcome=null,cars=scripted(0),carry=0;
  const recoveredAt={cop:-Infinity,robber:-Infinity};
  function recover(role){
    if(!tune[role]||phase!=='chase'||time-recoveredAt[role]<2)return false;
    const old=cars[role],peer=cars[role==='cop'?'robber':'cop'];
    chassis(old,role);
    const road=district.nearest(old.x,old.z),sin=Math.sin(road.yaw),cos=Math.cos(road.yaw);
    const direction=Math.cos(old.yaw-road.yaw)>=0?1:-1;
    for(const back of [0,6,12,18])for(const lane of [-3.5,3.5]){
      const x=road.x+cos*lane-sin*direction*back,z=road.z-sin*lane-cos*direction*back;
      if(x<Map.bounds.minX+3||x>Map.bounds.maxX-3||z<Map.bounds.minZ+3||z>Map.bounds.maxZ-3||Map.isBlocked(x,z,2.5)||Math.hypot(x-peer.x,z-peer.z)<8)continue;
      const fresh=vehicle(x,z);fresh.yaw=road.yaw+(direction<0?Math.PI:0);
      fresh.respawnRevision=(old.respawnRevision||0)+1;
      copyPose(fresh,chassis(fresh,role),0);cars[role]=fresh;keys[role]=empty();recoveredAt[role]=time;
      return true;
    }
    return false;
  }
  function finish(result){outcome=result;phase='outro';phaseTime=0;keys.cop=empty();keys.robber=empty();}
  function update(dt){
    if(phase==='ended')return;time+=dt;phaseTime+=dt;
    if(phase==='intro'){
      const pose=scripted(Math.min(phaseTime,intro));
      // These are the round's original bodies. Cinematic motion hands its exact
      // trajectory into the normal Drive chassis; never spawn/reset at takeover.
      for(const role of ['cop','robber'])Object.assign(cars[role],pose[role]);
      if(phaseTime+1e-8>=intro){for(const role of ['cop','robber'])chassis(cars[role],role);phase='chase';phaseTime=0;}
    }else if(phase==='chase'){
      for(const role of ['cop','robber'])advance(cars[role],keys[role],role,dt);
      remaining=Math.max(0,duration-phaseTime);
      if(contact(cars.cop,cars.robber)){captureImpact(cars);finish('captured');}else if(remaining<1e-7){remaining=0;finish('escaped');}
    }else{
      advance(cars.cop,{...empty(),brake:cars.cop.speed>0?.85:0},'cop',dt);
      advance(cars.robber,{...empty(),throttle:outcome==='escaped'?1:0,brake:outcome==='captured'&&cars.robber.speed>0?.9:0},'robber',dt);
      if(phaseTime>=outro){phase='ended';phaseTime=outro;}
    }
  }
  return {
    recover,
    input(role,raw){if(!tune[role]||!raw||phase!=='chase')return;keys[role]={steer:clamp(finite(raw.steer),-1,1),throttle:clamp(finite(raw.throttle),0,1),brake:clamp(finite(raw.brake),0,1),handbrake:raw.handbrake===true,manual:raw.manual===true,gear:Number.isInteger(raw.gear)?clamp(raw.gear,1,6):1};},
    step(dt){if(!Number.isFinite(dt)||dt<=0)return;carry+=Math.min(dt,610);while(carry+1e-10>=stepSize&&phase!=='ended'){update(stepSize);carry-=stepSize;}},
    snapshot(){return {phase,time,duration,remaining,outcome,phaseTime,cop:{...cars.cop},robber:{...cars.robber}};}
  };
}
return {create,contact,buildings,block,street,edge,intro,outro,tune,map:Map,makeDistrict};
});
