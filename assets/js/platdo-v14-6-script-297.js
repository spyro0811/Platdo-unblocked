/* Visual half of the authoritative chase opening. Reuses the gameplay drivers,
   cars and real articulated doors; no cinematic substitute vehicle is spawned. */
(function(root){
'use strict';
function create({scene,cars,drivers,audio,renderer}){
  const T=root.THREE,O=root.PlatdoChaseOpeningState,anchors=root.PlatdoChaseMap.anchors,A={cop:anchors.donut,robber:anchors.bank};
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),mix=O.mix,blend=(t,a,b)=>O.smooth((t-a)/(b-a));
  const point=(x,y,z)=>new T.Vector3(x,y,z),actors={},doors={},bags=[],resources=[],temp=new T.Vector3();
  let previous=-1,lastShot='',closed=false,done=false,dropPoint=null;
  function mesh(geometry,color,parent){const material=new T.MeshStandardMaterial({color,roughness:.75});const object=new T.Mesh(geometry,material);parent.add(object);resources.push([geometry,material]);return object;}
  // Remove the two real drivers from the cabins before selecting moving panels.
  for(const role of ['cop','robber']){
    const model=drivers[role],seat=cars[role].userData.occupantLayout.seats[0];
    actors[role]={model,seat,parent:model.parent,scale:model.scale.clone(),seated:false};scene.add(model);
    model.name='opening-'+role;
    doors[role]=root.PlatdoArrestCinematic.articulateDoor(cars[role],Math.sign(seat.x)||-1,false);
  }
  const robber=actors.robber.model,cop=actors.cop.model;
  for(const side of ['L','R']){
    const bag=new T.Group();bag.name='money-bag-'+side;robber.userData.rig['hand'+side].add(bag);bag.position.set(0,-.19,.02);
    const sack=mesh(new T.CapsuleGeometry(.13,.22,4,10),'#5d684d',bag);sack.rotation.z=.18;
    const neck=mesh(new T.TorusGeometry(.065,.015,5,12),'#d1bf83',bag);neck.rotation.x=Math.PI/2;neck.position.y=.2;
    const mark=mesh(new T.BoxGeometry(.09,.11,.006),'#b9bd88',bag);mark.position.set(0,.01,.134);bags.push(bag);
  }
  const donut=new T.Group();donut.name='dropped-donut';cop.userData.rig.handR.add(donut);donut.position.set(0,.01,.035);
  const dough=mesh(new T.TorusGeometry(.085,.036,9,20),'#bf894b',donut),icing=mesh(new T.TorusGeometry(.085,.028,7,20),'#f2a7b3',donut);icing.position.z=.023;
  for(let i=0;i<12;i++){const sprinkle=mesh(new T.BoxGeometry(.018,.005,.005),['#fff0c0','#6e593a','#80c6b7'][i%3],donut);const a=i/12*Math.PI*2;sprinkle.position.set(Math.sin(a)*.084,Math.cos(a)*.084,.049);sprinkle.rotation.z=a+.7;}
  const cues=[[.3,'alarm'],[1.5,'step'],[2,'step'],[2.5,'step'],[3,'step'],[3.5,'step'],[5.65,'donut'],[6.2,'step'],[6.7,'step'],[7.2,'step'],[7.7,'step'],[8.2,'latch'],[9.2,'cloth'],[10.6,'door'],[10.7,'latch'],[11.4,'cloth'],[12.8,'door'],[13.15,'siren']];
  cop.position.set(A.cop.reaction.x,.02,A.cop.reaction.z);cop.rotation.y=A.cop.reaction.yaw||0;root.CityPeopleModels.animate(cop,{mode:'idle'},O.beats.donutDrop,1/60);cop.userData.rig.armR.rotation.x=-.88;cop.userData.rig.forearmR.rotation.x=-.83;cop.updateWorldMatrix(true,true);const authoredDropPoint=donut.getWorldPosition(new T.Vector3());
  function world(role,p){const car=cars[role];car.updateWorldMatrix(true,true);return car.userData.body.localToWorld(p.clone());}
  function doorPoint(role){const d=cars[role].userData,seat=actors[role].seat;return world(role,point(Math.sign(seat.x)*(d.width*.5+.43),0,seat.z));}
  function walk(model,from,to,t,start,end,headingOffset=0){const q=clamp((t-start)/(end-start));model.position.set(mix(from.x,to.x,q),.02,mix(from.z,to.z,q));model.rotation.y=Math.atan2(to.x-from.x,to.z-from.z)+headingOffset;root.CityPeopleModels.animate(model,{mode:'onFoot',speed:q>0&&q<1?Math.hypot(to.x-from.x,to.z-from.z)/(end-start):0,grounded:true},t,1/60);}
  function approach(role,from,t,start,end){
    const car=A[role].car,target=doorPoint(role),sign=Math.sign(Math.sin(car.yaw)),noseX=car.x+sign*cars[role].userData.length*.65;
    const path=[from,{x:noseX,z:from.z},{x:noseX,z:target.z},target],lengths=path.slice(1).map((p,i)=>Math.hypot(p.x-path[i].x,p.z-path[i].z)),total=lengths.reduce((a,b)=>a+b,0),distance=clamp((t-start)/(end-start))*total;
    let traversed=0;for(let i=0;i<lengths.length;i++){if(distance<=traversed+lengths[i]||i===lengths.length-1){const a=start+(end-start)*traversed/total,b=start+(end-start)*(traversed+lengths[i])/total;walk(actors[role].model,path[i],path[i+1],t,a,b);break;}traversed+=lengths[i];}
  }
  function enter(role,t,start,end){
    const rec=actors[role],model=rec.model,at=doorPoint(role),seat=world(role,point(rec.seat.x,rec.seat.y,rec.seat.z));
    const q=blend(t,start+.35,end-.45);model.position.copy(at).lerp(seat,q);
    model.rotation.y=cars[role].rotation.y+mix(Math.sign(rec.seat.x)*Math.PI/2,0,blend(t,start+.1,end-.65));
    root.CityPeopleModels.animate(model,{mode:'entering',entryPhase:'sit',entrySeatBlend:q,grounded:true},t,1/60);
    const rig=model.userData.rig;
    // One leg clears the sill, then the other; the door waits until both are in.
    for(const [i,id]of ['L','R'].entries()){const lift=Math.sin(Math.PI*clamp((t-start-.45-i*.22)/.75));rig['thigh'+id].rotation.x-=.35*lift;rig['calf'+id].rotation.x+=.28*lift;}
    const open=(role==='robber'?1:blend(t,start,start+.45))*(1-blend(t,end-.35,end));doors[role]?.set(open*1.02);
    if(t>=end-.08)seatActor(role);
  }
  function seatActor(role){const rec=actors[role];if(rec.seated)return;rec.parent.add(rec.model);rec.model.position.set(rec.seat.x,rec.seat.y,rec.seat.z);rec.model.rotation.set(0,0,0);rec.model.scale.copy(rec.scale);root.CityPeopleModels.animate(rec.model,{mode:'driver'},0,.1);root.DriveScene.seatDriver?.(rec.model,cars[role]);rec.seated=true;doors[role]?.set(0);doors[role]?.close();delete doors[role];}
  function stowBags(q){for(const [i,bag]of bags.entries()){
    if(!bag.userData.loadStart){bag.updateWorldMatrix(true,false);bag.userData.loadStart=bag.getWorldPosition(new T.Vector3());scene.attach(bag);}
    const target=world('robber',point(i?-.28:.25,.58,-.65));bag.position.copy(bag.userData.loadStart).lerp(target,q);bag.position.y+=Math.sin(q*Math.PI)*.45;bag.rotation.set(.2,0,(i?1:-1)*.16);
    if(q>=1&&!bag.userData.stowed){cars.robber.userData.body.attach(bag);bag.userData.stowed=true;}
  }}
  function render(t){
    if(closed)return;const s=O.sample(t);lastShot=s.shot;
    for(const role of ['cop','robber']){const rec=actors[role];if(rec.seated){root.CityPeopleModels.animate(rec.model,{mode:'driver',steer:cars[role].userData.openingSteer||0},t,Math.max(0,t-previous));root.DriveScene.seatDriver?.(rec.model,cars[role],{size:false,wheelAngle:-(cars[role].userData.openingSteer||0)*6});}}
    if(!actors.robber.seated){
      if(t<8.1){approach('robber',A.robber.door,t,0,5.1);const rig=robber.userData.rig;rig.armL.rotation.x=rig.armR.rotation.x=-.16;rig.forearmL.rotation.x=rig.forearmR.rotation.x=-.3;if(t>5.1){rig.spine.rotation.x=.12+Math.sin(t*2)*.025;rig.head.rotation.y=-.35;rig.armR.rotation.x=-.7*blend(t,5.4,6.4);doors.robber?.set(blend(t,6.3,7.8)*1.02);}}
      else enter('robber',t,8.1,10.8);
    }
    if(t>=8.3&&!bags.every(b=>b.userData.stowed))stowBags(blend(t,8.3,9.2));
    if(!actors.cop.seated){
      if(t<5.7){cop.position.set(A.cop.reaction.x,.02,A.cop.reaction.z);cop.rotation.y=A.cop.reaction.yaw||0;root.CityPeopleModels.animate(cop,{mode:'idle',lookYaw:blend(t,4.4,4.9)*.65},t,1/60);const rig=cop.userData.rig;rig.armR.rotation.x=-.88;rig.forearmR.rotation.x=-.83;rig.spine.rotation.x=-.05*blend(t,4.4,4.85);if(t>=O.beats.donutDrop){for(const f of rig.fingersR||[])f.rotation.x=0;}}
      else if(t<10.5)approach('cop',A.cop.reaction,t,5.7,10.5);
      else enter('cop',t,10.5,12.8);
    }
    if(t>=O.beats.donutDrop){
      if(!dropPoint){dropPoint=authoredDropPoint.clone();scene.attach(donut);}
      const elapsed=t-O.beats.donutDrop,fall=Math.sqrt(Math.max(0,2*(dropPoint.y-.13)/9.8)),after=Math.max(0,elapsed-fall);
      donut.position.copy(dropPoint);donut.position.x+=Math.min(.22,elapsed*.22);donut.position.y=elapsed<fall?Math.max(.13,dropPoint.y-4.9*elapsed*elapsed):.13+Math.abs(Math.sin(after*10))*Math.exp(-after*5)*.11;donut.rotation.set(Math.min(Math.PI/2,elapsed*3),elapsed*.8,.18);donut.visible=t<18;
    }
    while(cues.length&&cues[0][0]<=t){const [,cue]=cues.shift();if(previous>=0&&t-previous<.6)audio.arrestCue?.(cue);}
    if(t>=O.duration){seatActor('cop');seatActor('robber');if(!bags.every(b=>b.userData.stowed))stowBags(1);donut.visible=false;done=true;}
    previous=t;
    return s;
  }
  function camera(t,role,eye,aim,normalEye,normalAim,normalFov=72){
    const s=O.sample(t),r=actors.robber.model,c=actors.cop.model;scene.updateMatrixWorld(true);const rp=r.getWorldPosition(new T.Vector3()),cp=c.getWorldPosition(new T.Vector3());
    const car=cars[role],forward=point(Math.sin(car.rotation.y),0,Math.cos(car.rotation.y));let fov=55;
    switch(s.shot){
      case 'bank-exit': eye.set(A.robber.door.x+8,5.0,A.robber.door.z-14);aim.set(rp.x,2.7,rp.z);fov=61;break;
      case 'getaway-run':eye.set(rp.x+4.8,2.05,rp.z-5.3);aim.set(rp.x-.6,1.0,rp.z+.3);break;
      case 'donut-reaction':eye.set(cp.x+2.6,1.4,cp.z+2.9);aim.set(cp.x,1.05,cp.z);fov=46;break;
      case 'officer-run':eye.set(cp.x-4.5,2.2,cp.z+5.1);aim.set(cp.x,1.1,cp.z);break;
      case 'bags-and-entry':{const d=doorPoint('robber');eye.set(d.x+3.3,1.8,d.z+2.5);aim.set(d.x,.98,d.z);fov=51;break;}
      case 'officer-entry':{const d=doorPoint('cop');eye.set(d.x+4.2,1.9,d.z-1.0);aim.set(d.x,.98,d.z);fov=61;break;}
      case 'drifting-departure':{const p=cars.cop.position;eye.set(p.x+7,1.0,p.z+5);aim.set(p.x,1.1,p.z);fov=59;break;}
      default:eye.copy(car.position).addScaledVector(forward,-5.8);eye.y=2.8;aim.copy(car.position).addScaledVector(forward,2);aim.y=1.05;eye.lerp(normalEye,s.handOff);aim.lerp(normalAim,s.handOff);fov=mix(59,normalFov,s.handOff);break;
    }
    // Preserve actor readability in portrait without changing the authored target.
    return {shot:s.shot,fov,blend:s.handOff};
  }
  renderer.localClippingEnabled=true;
  return {render,camera,actors,bags,get done(){return done;},cashOrigins(){if(previous>=8.3)return[];scene.updateMatrixWorld(true);return bags.map(b=>b.localToWorld(point(0,.18,0)));},close(){if(closed)return;closed=true;for(const role of ['cop','robber'])seatActor(role);for(const bag of bags)bag.removeFromParent();donut.removeFromParent();resources.forEach(([g,m])=>{g.dispose();m.dispose();});}};
}
root.PlatdoChaseOpening={create};
})(window);
