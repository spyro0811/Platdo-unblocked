/* Shared, frame-rate-independent choreography. The host owns this clock; the
   renderer samples it, and the chassis inherits the exact final trajectory. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlatdoChaseOpeningState=api;})(globalThis,function(){
'use strict';
const duration=18;
const beats=Object.freeze({bankExit:0,robberRun:1.8,notice:4.4,donutDrop:5.15,copRun:5.7,robberEntry:8.1,copEntry:10.5,copLaunch:13.1,robberLaunch:14.5,handoff:16.3,end:18});
const shots=Object.freeze([{at:0,id:'bank-exit'},{at:1.8,id:'getaway-run'},{at:4.4,id:'donut-reaction'},{at:5.7,id:'officer-run'},{at:8.1,id:'bags-and-entry'},{at:10.5,id:'officer-entry'},{at:13.1,id:'drifting-departure'},{at:16.3,id:'moving-handoff'}]);
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
function smooth(n){n=clamp(n);return n*n*(3-2*n);}
function curve(points,u){const work=points.map(p=>({x:p.x,z:p.z}));for(let count=work.length-1;count>0;count--)for(let i=0;i<count;i++){work[i].x=mix(work[i].x,work[i+1].x,u);work[i].z=mix(work[i].z,work[i+1].z,u);}return work[0];}
function derivative(points,u){const n=points.length-1;return curve(points.slice(1).map((p,i)=>({x:n*(p.x-points[i].x),z:n*(p.z-points[i].z)})),u);}
function pose(role,t,anchors){
  const a=anchors[role==='cop'?'donut':'bank'],start=role==='cop'?beats.copLaunch:beats.robberLaunch,span=duration-start;
  // Both arrivals at live control are 30 m/s (cop 75% / robber 50% of top
  // speed). The endpoint tangent produces that speed continuously; no handoff
  // assignment or one-frame acceleration is involved.
  const end=a.departure[a.departure.length-1],direction=Math.sign(end.x-a.car.x)||1;
  const points=role==='cop'?[a.car,{x:a.car.x+direction*4,z:a.car.z},{x:a.car.x+direction*8,z:a.car.z},{x:end.x-direction*22,z:end.z},{x:end.x-direction*30*span/10,z:end.z},end]:[a.car,{x:a.car.x+direction*4,z:a.car.z},{x:end.x-direction*30*span/6,z:end.z},end];
  const u=clamp((t-start)/span),progress=u*u;
  const p=curve(points,progress),tangent=derivative(points,progress),rate=2*u/span;
  const heading=Math.atan2(tangent.x,tangent.z),drift=role==='cop'?.28*Math.sin(Math.PI*u)*Math.sin(Math.PI*u):0;
  const yaw=heading+drift,delta=.0001;
  const lo=clamp(progress-delta),hi=clamp(progress+delta),before=derivative(points,lo),after=derivative(points,hi);
  const turn=Math.atan2(Math.sin(Math.atan2(after.x,after.z)-Math.atan2(before.x,before.z)),Math.cos(Math.atan2(after.x,after.z)-Math.atan2(before.x,before.z)))/(hi-lo)*rate;
  const yawRate=u?turn+(role==='cop'?.28*Math.PI*Math.sin(2*Math.PI*u)/span:0):0;
  const vx=tangent.x*rate,vz=tangent.z*rate,speed=Math.hypot(vx,vz),slip=vx*Math.cos(yaw)-vz*Math.sin(yaw);
  let distance=0,previous=points[0];for(let i=1;i<=24;i++){const at=curve(points,progress*i/24);distance+=Math.hypot(at.x-previous.x,at.z-previous.z);previous=at;}
  return {x:p.x,y:0,z:p.z,yaw:t<start?a.car.yaw:yaw,vx,vz,speed,steer:clamp(-yawRate*.20,-.45,.45),yawRate,slip,driftIntensity:role==='cop'?Math.abs(drift)*3:0,
    wheelSpin:distance/.33,pitch:-.018*u,roll:drift*.06,gear:u>0?2:1,throttle:u>0?.65:0,brake:0,rpm:u>0?.42+.16*u:.16,engineRPM:u>0?2700+900*u:850,engineLoad:u>0?.65:0,
    impact:0,respawnRevision:0,condition:100,destroyed:false,wrecked:false,driverSeated:t>=(role==='cop'?12.7:10.8),siren:role==='cop'&&t>=13.1};
}
function vehicles(t,anchors){return {cop:pose('cop',clamp(t,0,duration),anchors),robber:pose('robber',clamp(t,0,duration),anchors)};}
function sample(t){return {time:clamp(t,0,duration),shot:shots.reduce((last,s)=>t>=s.at?s.id:last,'bank-exit'),handOff:smooth((t-beats.handoff)/(duration-beats.handoff)),donutReleased:t>=beats.donutDrop,robberSeated:t>=10.8,copSeated:t>=12.7};}
return {duration,beats,shots,vehicles,pose,sample,smooth,mix,curve,derivative};
});
