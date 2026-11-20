
/* Rendering is a consumer of vehicle-owned occupant state, never its owner. */
(function(){
'use strict';
const T=window.THREE,Physics=window.DriveOccupantPhysics,Scene=window.DriveScene,P=Scene.prototype;
Physics.install(window.DriveCore);
const oldSettings=P.setSettings,oldEffects=P.updateOccupantEffects,oldDispose=P.dispose;
function dispose(rig){rig.root.removeFromParent();if(rig.avatar)window.CityPeopleModels.dispose(rig.root);else Scene.disposeOccupant(rig);}
function avatarAppearance(){const base=window.PlatdoAvatar?.get()?.appearance||window.CityPeople?.presets?.[0];return base;}
function visibleBounds(model){const box=new T.Box3(),part=new T.Box3();model.updateMatrixWorld(true);model.traverseVisible(node=>{if(!node.isMesh||!node.geometry)return;if(!node.geometry.boundingBox)node.geometry.computeBoundingBox();part.copy(node.geometry.boundingBox).applyMatrix4(node.matrixWorld);box.union(part);});return box;}
/* V3.7: every seat in Platdo Drive is filled by one of the City character models: the player's own look at the wheel,
 * a blonde woman in a red dress beside them, two small children behind, and varied people in the other cars.
 * The old simple figures remain only as a fallback when the character module is missing. */
const LOOKS={},KID_TOPS=['#2f6fb5','#f0c64a','#3f9a63','#d9603b','#8a5cc2','#e7e3d6','#2b3a55','#d8497a'],CAR_SAFE=[0,1,2,3,4,9,10,11];
function looks(){
 if(LOOKS.woman)return LOOKS;
 const P=window.CityPeople,base={...P.presets[0]};for(const key of['appearanceKey','similarityKey','name','family'])delete base[key];
 LOOKS.woman={...base,id:'drive-passenger',body:4,skin:1,hair:10,hairColor:4,hairHex:'#e6c873',lipHex:'#c2182b',facialHair:0,upper:23,lower:10,shoe:5,shoeColor:'#1d1b1c',accessory:0,palette:1,topColor:'#b3212d',dress:1,bust:2,heightScale:.97,widthScale:1,age:24};
 const kid={...base,child:1,facialHair:0,accessory:0,heightScale:1,widthScale:1,skin:1,age:30};
 LOOKS.boy={...kid,id:'drive-boy',body:7,face:3,hair:3,hairColor:2,upper:0,lower:8,shoe:1,palette:10,topColor:'#2f6fb5',bottomColor:'#3b4250'};
 LOOKS.girl={...kid,id:'drive-girl',body:0,face:4,hair:12,hairColor:3,upper:0,lower:10,shoe:0,palette:6,topColor:'#f0c64a',bottomColor:'#3f6f9c'};
 LOOKS.women=P.catalog.filter(a=>a.body===4&&!a.facialHair);
 return LOOKS;
}
// Bags, cameras and wide hats do not fit between a seat and a roof.
function carSafe(a){return CAR_SAFE.includes(a.accessory)?a:{...a,accessory:0};}
function lookFor(rec,sim){
 const P=window.CityPeople,L=looks(),own=rec.owner===sim.player;
 if(own&&rec.seatIndex===0)return avatarAppearance();
 const pick=seat=>P.hash(String(rec.owner.id??'car')+':'+seat+':'+(rec.owner.type||'')),driver=P.catalog[pick(0)%P.catalog.length];
 if(rec.child){const base=rec.role==='girl'?L.girl:L.boy,seed=pick(rec.seatIndex);return own?base:{...base,id:base.id+'-'+seed%997,topColor:KID_TOPS[seed%KID_TOPS.length],skin:driver.skin,hairColor:Math.min(4,driver.hairColor)};}
 if(rec.role==='woman')return own||!L.women.length?L.woman:carSafe(L.women[pick(1)%L.women.length]);
 return carSafe(driver);
}
function seatPerson(model,a,seat,fit,child){
 const P=window.CityPeople;model.scale.multiplyScalar(1.65*fit/(P.bodies[a.body].height*a.heightScale));if(child)model.userData.rig.neck.scale.setScalar(1.28);
 if(seat.hip)model.position.set(seat.hip[0],seat.hip[1],seat.hip[2]);else model.position.set(seat.x,(seat.top??seat.y+.07)+.07*fit,seat.z);model.userData.noBatch=model.userData.noDent=true;model.userData.sceneryDynamic=true;
}
function makeRig(rec,sim,mesh){
 const PM=window.CityPeopleModels,P=window.CityPeople,driver=rec.seatIndex===0,simple=()=>Scene.createOccupant(rec.seatIndex,rec.seat,rec.scale,driver,rec.role);
 if(!PM||!P)return simple();
 const own=rec.owner===sim.player,child=!!rec.child,a=lookFor(rec,sim),detail=PM.modelDetail||3;let model;
 try{model=PM.create(a,{lod:own?0:child?2:1,modelDetail:own?detail:Math.min(3,detail)});}catch(error){return simple();}
 const plan=rec.seat?.hip?rec.seat:null,fit=plan?plan.fit:child?.62:Math.max(rec.scale,.97),pose=driver?{mode:'driver',seatPose:'driver',speed:0}:{mode:'driver',seatPose:'passenger',seatIndex:rec.seatIndex,speed:0};let recline=0;
 seatPerson(model,a,rec.seat,fit,child);model.userData.occupantRole=rec.role;
 PM.animate(model,pose,0,0);model.updateMatrixWorld(true);
 // Fit the seated figure, including helmets, below the actual cabin roof: sink a little, then lean back,
 // and only then scale about the pelvis so the seat contact and proportions survive.
 const layout=rec.layout||Physics.layoutFor(rec.owner,own?sim.config:null);
 // V6.1: a planned seat. The person is posed for it, then their own head (hair and hats differ) is checked against
 // the real roof and glass: they sit a little lower first, and only then a little smaller.
 if(plan){const options={wheel:driver?(mesh?.userData.interior?.wheel||null):null,wheelAngle:0};PM.carSeat(model,plan,options);
  const clear=mesh?.userData.cabinClear;if(clear&&!layout.openRoof){const head=model.userData.rig.head,at=new T.Vector3(),k=child?1.28:1;for(let n=0;n<7;n++){model.updateMatrixWorld(true);head.getWorldPosition(at);const s=model.scale.y,gap=Math.min(clear(at.x,at.y+.13*s*k,at.z,.125*s*k)-.015,layout.roof-.03-(at.y+.27*s*k));if(gap>=0)break;if(n<3)model.position.y+=Math.max(gap,-.02);else model.scale.multiplyScalar(.97);PM.carSeat(model,plan,options);}}}
 // V3.5: measure the seated figure from its head bone. The old check used the standing height of the mesh and shrank every driver to about half size.
 if(!plan&&!layout.openRoof&&!child){const top=layout.roof-.045,spine=model.userData.rig.spine,head=model.userData.rig.head,crown=new T.Vector3(),seatedTop=()=>{model.updateMatrixWorld(true);return head.getWorldPosition(crown).y+.25*model.scale.y;},over=()=>seatedTop()-top;let excess=over();if(excess>0){const sink=Math.min(.10,excess);model.position.y-=sink;model.updateMatrixWorld(true);excess=over();for(let step=0;step<17&&excess>0;step++){recline=Math.min(.85,recline+.05);spine.rotation.x=-recline;if(head)head.rotation.x=recline*.8;model.updateMatrixWorld(true);excess=over();}if(excess>0){const reach=top-model.position.y;if(reach>0)model.scale.multiplyScalar(Math.max(.86,reach/(reach+excess)));model.updateMatrixWorld(true);}}model.userData.cabinFitTop=top;model.userData.cabinFitBoundsTop=seatedTop();}
 const points=PM.ragdollPose(model),map={pelvis:'pelvis',chest:'chest',head:'head',ls:'shoulderR',rs:'shoulderL',le:'elbowR',re:'elbowL',lw:'handR',rw:'handL',lh:'hipR',rh:'hipL',lk:'kneeR',rk:'kneeL',la:'ankleR',ra:'ankleL'};
 rec.avatarPose=Object.fromEntries(Object.entries(map).map(([to,from])=>[to,{...points[from]}]));
 const bones=model.userData.rig,wound=new T.Mesh(new T.SphereGeometry(1,8,6),new T.MeshStandardMaterial({color:'#731a19',roughness:.9}));wound.position.set(-.065,.23,.15);wound.scale.set(.038,.065,.005);wound.visible=false;bones.spine.add(wound);
 // The woman's dress carries two small bones; the car's movement is fed to them in secondaryPose.
 const chestPivots=child?[]:[bones.bustL,bones.bustR].filter(Boolean);for(const pivot of chestPivots)pivot.userData.rest=pivot.position.clone();
 return{root:model,upper:bones.spine,head:bones.head,arms:[bones.armL,bones.armR],wound,chestPivots,seat:{...rec.seat},driver,own,live:own&&!child,pose,role:rec.role,scale:fit,recline,plan,avatar:true,avatarKey:own&&driver?P.appearanceKey(a):null,injury:0,ejected:false,record:rec};
}
// V6.1: seats a person made elsewhere (the Cop Chase drivers) in a car's driver seat: sized for that seat, hips on
// it, feet on the floor and hands on the wheel. Call it after CityPeopleModels.animate, which resets the pose.
Scene.seatDriver=function(model,car,options={}){
 const PM=window.CityPeopleModels,P=window.CityPeople,seat=car?.userData?.occupantLayout?.seats?.[0];if(!PM?.carSeat||!model||!seat?.hip)return false;
 if(options.size!==false){const a=model.userData.rig?.appearance,body=a&&P?.bodies?.[a.body];if(body){const base=model.userData.seatBaseScale||(model.userData.seatBaseScale=model.scale.clone().divideScalar(model.scale.y||1));model.scale.copy(base).multiplyScalar(1.65*seat.fit/(body.height*(a.heightScale||1)));}}
 model.position.set(seat.hip[0],seat.hip[1],seat.hip[2]);
 PM.carSeat(model,seat,{wheel:car.userData.interior?.wheel||null,wheelAngle:options.wheelAngle||0});return true;
};
// A seated character for scenes that place people by hand (the Cop Chase opening).
Scene.createSeatedPerson=function(role,seat,scale=1){
 const PM=window.CityPeopleModels,P=window.CityPeople;if(!PM||!P)return null;
 const L=looks(),a=role==='girl'?L.girl:role==='boy'?L.boy:L.woman,child=!!a.child,model=PM.create(a,{lod:0,modelDetail:Math.min(3,PM.modelDetail||3)});
 seatPerson(model,a,seat,seat.hip?seat.fit:child?.62:Math.max(.9,Math.min(1,scale)),child);PM.animate(model,{mode:'driver',seatPose:'passenger',seatIndex:1,speed:0},0,0);if(seat.hip)PM.carSeat(model,{...seat,hands:'lap'},{});return{root:model};
};
function avatarPhysicalPose(rig){const p=rig.record.ragdoll.points,map={pelvis:'pelvis',chest:'chest',head:'head',shoulderL:'rs',shoulderR:'ls',elbowL:'re',elbowR:'le',handL:'rw',handR:'lw',hipL:'rh',hipR:'lh',kneeL:'rk',kneeR:'lk',ankleL:'ra',ankleR:'la'},points=Object.fromEntries(Object.entries(map).map(([to,from])=>[to,p[from]]));/* V3.7: the model's origin follows the thrown body. It used to stay at the middle of the map, so the game stopped drawing the person as soon as they left their seat. */rig.root.position.set(p.pelvis.x,p.pelvis.y-.9*rig.root.scale.y,p.pelvis.z);window.CityPeopleModels.animate(rig.root,{mode:'dead',ragdoll:{points},speed:0},0,0);rig.wound.visible=rig.record.injury>.1;}

const secondaryA=new T.Vector3(),secondaryB=new T.Vector3(),secondaryDelta=new T.Vector3(),secondaryUp=new T.Vector3(0,1,0);
function secondaryPose(rig){
 const state=rig.record?.secondary;if(rig.record?.child||!state||!rig.chestPivots?.length)return;const gain=rig.avatar?3.4:1,reach=v=>Math.max(-.05,Math.min(.05,v*gain));/* V4.1: larger figure, much stronger movement, held to 5 cm so it stays on the body */
 for(let i=0;i<rig.chestPivots.length;i++){const pivot=rig.chestPivots[i],p=state.points[i],rest=pivot.userData.rest;pivot.position.set(rest.x+reach(p.x),rest.y+reach(p.y),rest.z+reach(p.z));pivot.rotation.set(reach(p.z)*.5,0,-reach(p.x)*.4);}
 // The seatbelt follows its contact point instead of cutting through the dress.
 for(const belt of rig.seatBelt||[]){secondaryA.copy(belt.a);secondaryB.copy(belt.b);const p=state.points[0],moving=belt.movingEnd==='a'?secondaryA:secondaryB;moving.x+=reach(p.x);moving.y+=reach(p.y);moving.z+=reach(p.z);secondaryDelta.copy(secondaryB).sub(secondaryA);belt.mesh.position.copy(secondaryA).add(secondaryB).multiplyScalar(.5);belt.mesh.scale.y=secondaryDelta.length()/belt.restLength;belt.mesh.quaternion.setFromUnitVectors(secondaryUp,secondaryDelta.normalize());}
}

// The passive crash rig replaces the old renderer, so seated animation must live
// here too. Keep the pelvis on its seat; springs move only the upper body.
function seatedPose(rig,body,mesh,dt,time){
 if(!rig.avatar)secondaryPose(rig);
 const step=Math.min(.04,Math.max(0,dt)),clamp=window.DriveCore.clamp;
 rig.roll??=0;rig.pitch??=0;rig.vRoll??=0;rig.vPitch??=0;
 const speed=body.speed||0,acceleration=step>0&&rig.lastSpeed!==undefined?clamp((speed-rig.lastSpeed)/Math.max(step,.008),-18,18):0;
 rig.lastSpeed=speed;
 const roll=clamp(-(body.yawRate||0)*Math.abs(speed)*.012,-.25,.25),pitch=clamp(-acceleration*.012+(body.brake||0)*.07,-.18,.22);
 rig.vRoll+=((roll-rig.roll)*65-rig.vRoll*10)*step;rig.vPitch+=((pitch-rig.pitch)*65-rig.vPitch*10)*step;
 rig.roll=clamp(rig.roll+rig.vRoll*step,-.3,.3);rig.pitch=clamp(rig.pitch+rig.vPitch*step,-.25,.25);
 if(rig.avatar&&rig.plan){
  // V6.1: a planned seat. carSeat poses the whole body: hips on the seat, back against it, feet on the floor, the
  // driver's hands on the rim. People in the player's own car move every frame; others keep the pose they were given.
  const PM=window.CityPeopleModels,interior=mesh.userData.interior,turning=interior?.steeringWheel;
  if(rig.driver&&turning)turning.rotation.z=-(body.steer||0)*(turning.userData.visualRatio||6);
  if(rig.live||!rig.posed){PM.animate(rig.root,rig.driver?{mode:'driver',seatPose:'driver',speed:0}:rig.pose,time,step);PM.carSeat(rig.root,rig.plan,{wheel:rig.driver?interior?.wheel:null,wheelAngle:rig.driver&&turning?turning.rotation.z:0,sway:rig.live?{pitch:rig.pitch,roll:rig.roll}:null});rig.posed=true;}
  secondaryPose(rig);
  // Capture the live pose, not the pose they were first seated in, if this car crashes next.
  if(rig.own&&rig.record){const p=PM.ragdollPose(rig.root),map={pelvis:'pelvis',chest:'chest',head:'head',ls:'shoulderR',rs:'shoulderL',le:'elbowR',re:'elbowL',lw:'handR',rw:'handL',lh:'hipR',rh:'hipL',lk:'kneeR',rk:'kneeL',la:'ankleR',ra:'ankleL'};rig.record.avatarPose=Object.fromEntries(Object.entries(map).map(([to,from])=>[to,Physics.transform(p[from],body,true)]));}
  return;
 }
 // V3.7: people in the player's own car are animated every frame; people in other cars keep the pose they were seated in.
 if(rig.avatar&&(rig.live||!rig.posed)){window.CityPeopleModels.animate(rig.root,rig.driver?{mode:'driver',seatPose:'driver',speed:0,steer:body.steer||0}:rig.pose,time,step);rig.posed=true;}
 if(rig.avatar)secondaryPose(rig);
 rig.upper.rotation.z=rig.roll;rig.upper.rotation.x=rig.pitch-(rig.recline||0);rig.head.rotation.z=-rig.roll*.28;rig.head.rotation.x=-rig.pitch*.32+(rig.recline||0)*.8;
 const wheel=mesh.userData.interior?.steeringWheel;
 if(!rig.driver||!wheel){if(!rig.avatar)rig.arms.forEach((arm,i)=>{arm.rotation.z=rig.roll*(i?.3:-.3);arm.rotation.x=rig.pitch*.24;});return;}
 wheel.rotation.z=-(body.steer||0)*(wheel.userData.visualRatio||6);mesh.updateWorldMatrix(true,true);
 // Two-bone arm IK keeps palms attached to the rotating wheel even while the
 // chest leans. Use the actual wheel transform, including its cabin tilt.
 for(const side of[-1,1]){
  const bones=rig.avatar?rig.root.userData.rig:null,arm=bones?bones[side<0?'armL':'armR']:rig.arms.find(a=>a.name==='arm'+side),fore=bones?bones[side<0?'forearmL':'forearmR']:arm.children.find(a=>a.name==='forearm'+side),hand=bones?bones[side<0?'handL':'handR']:null;
  if(!arm||!fore)continue;
  const start=arm.getWorldPosition(new T.Vector3()),target=wheel.localToWorld(new T.Vector3(side*.12*rig.scale,-.025*rig.scale,-.035)),upper=fore.position.clone(),lower=hand?hand.position.clone():new T.Vector3(...fore.userData.bindDirection),scale=arm.getWorldScale(new T.Vector3()).x,l1=upper.length()*scale,l2=lower.length()*scale;
  const direction=target.clone().sub(start),distance=Math.min(direction.length(),(l1+l2)*.995);direction.normalize();const bend=new T.Vector3(0,-1,0).addScaledVector(direction,direction.y).normalize(),along=(l1*l1-l2*l2+distance*distance)/(2*Math.max(.001,distance)),height=Math.sqrt(Math.max(0,l1*l1-along*along)),elbow=start.clone().addScaledVector(direction,along).addScaledVector(bend,height);
  const orient=(bone,bind,end)=>{const local=bone.parent.worldToLocal(end.clone()).sub(bone.position);bone.quaternion.setFromUnitVectors(bind.clone().normalize(),local.normalize());bone.updateWorldMatrix(false,true);};
  orient(arm,upper,elbow);orient(fore,lower,target);
  // V3.7: the fingers close round the rim instead of pointing at the windscreen.
  if(bones&&hand){const label=side<0?'L':'R';hand.rotation.set(-.3,0,0);for(const finger of bones['fingers'+label]||[])finger.rotation.x=1.2;if(bones['thumb'+label])bones['thumb'+label].rotation.x=.75;}
 }
 // Capture the live pose, not the original idle pose, if this car crashes next.
 if(rig.avatar&&rig.own){const p=window.CityPeopleModels.ragdollPose(rig.root),map={pelvis:'pelvis',chest:'chest',head:'head',ls:'shoulderR',rs:'shoulderL',le:'elbowR',re:'elbowL',lw:'handR',rw:'handL',lh:'hipR',rh:'hipL',lk:'kneeR',rk:'kneeL',la:'ankleR',ra:'ankleL'};rig.record.avatarPose=Object.fromEntries(Object.entries(map).map(([to,from])=>[to,Physics.transform(p[from],body,true)]));}
}

function split(rig,record){
 if(rig.avatar){rig.root.removeFromParent();rig.root.position.set(0,0,0);rig.root.quaternion.identity();rig.pieces={avatar:true};rig.record=record;rig.ejected=true;return rig;}
 const pieces={},root=rig.root,names=['head','forearm-1','forearm1','arm-1','arm1','shin-1','shin1','thigh-1','thigh1','torso','pelvis'];
 for(const name of names){const node=root.getObjectByName(name);if(node){pieces[name]=node;root.add(node);node.position.set(0,0,0);node.quaternion.identity();}}
 root.removeFromParent();root.position.set(0,0,0);root.quaternion.identity();root.scale.setScalar(1);for(const node of Object.values(pieces))node.scale.setScalar(record.scale);root.userData.sceneryDynamic=true;rig.pieces=pieces;rig.record=record;rig.ejected=true;return rig;
}
function physicalPose(rig){if(rig.avatar)return avatarPhysicalPose(rig);const rec=rig.record,r=rec.ragdoll;if(!r)return;const p=r.points,scale=rec.scale,position=(node,a)=>node.position.set(a.x,a.y,a.z),orient=(node,a,b,rest)=>node.quaternion.setFromUnitVectors(new T.Vector3(...rest).normalize(),new T.Vector3(b.x-a.x,b.y-a.y,b.z-a.z).normalize()),node=rig.pieces;
 secondaryPose(rig);
 const up=new T.Vector3(p.chest.x-p.pelvis.x,p.chest.y-p.pelvis.y,p.chest.z-p.pelvis.z).normalize(),across=new T.Vector3(p.ls.x-p.rs.x,p.ls.y-p.rs.y,p.ls.z-p.rs.z).normalize(),front=new T.Vector3().crossVectors(across,up).normalize();across.crossVectors(up,front).normalize();const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(across,up,front));
 for(const name of['pelvis','torso','head']){node[name].quaternion.copy(q);position(node[name],p[name==='torso'?'pelvis':name]);}
 node.pelvis.position.addScaledVector(up,-.035*scale);node.torso.position.addScaledVector(up,.005*scale);
 for(const [side,k]of[[1,'l'],[-1,'r']]){const arm=node['arm'+side],fore=node['forearm'+side],thigh=node['thigh'+side],shin=node['shin'+side],driver=rec.seatIndex===0;position(arm,p[k+'s']);orient(arm,p[k+'s'],p[k+'e'],arm.userData.bindDirection);position(fore,p[k+'e']);orient(fore,p[k+'e'],p[k+'w'],fore.userData.bindDirection);position(thigh,p[k+'h']);orient(thigh,p[k+'h'],p[k+'k'],[0,-.07,.28]);position(shin,p[k+'k']);orient(shin,p[k+'k'],p[k+'a'],[0,-.25,.07]);}
 rig.wound.visible=rec.injury>.1;rig.wound.scale.y=.065*(.7+rec.injury);
}
P.setSettings=function(settings){oldSettings.call(this,settings);if(this.activeSim){const engine=Physics.ensure(this.activeSim,this.settings);this.updateOccupants(this.playerCar,this.activeSim.player,0);for(const body of this.activeSim.traffic){const mesh=this.trafficMeshes.get(body.id);if(mesh)this.updateOccupants(mesh,body,0);}this.syncPhysicalOccupants(engine,false);} };
P.updateOccupants=function(mesh,body,dt){
 const sim=this.activeSim;if(!sim)return;const engine=Physics.ensure(sim,this.settings),owner=mesh===this.playerCar?sim.player:body;if((owner===sim.player?sim.config.id:owner.type)===mesh.userData.kind)owner._occupantLayout=mesh.userData.occupantLayout;if(owner.occupancy?.layout!==Physics.layoutFor(owner,owner===sim.player?sim.config:null))engine.sync();const state=owner.occupancy;if(!state)return;
 const current=mesh.userData.occupants||[],next=[];this.physicalOccupants??=new Map();
 for(const rig of current){const rec=rig.record;if(!rec||rec.removed||!state.people.includes(rec)){if(!rig.pieces)dispose(rig);} }
 for(const rec of state.people){let rig=current.find(r=>r.record===rec);if(rig?.avatarKey&&!rec.ragdoll&&rig.avatarKey!==window.CityPeople.appearanceKey(avatarAppearance())){dispose(rig);rig=null;}if(rec.ragdoll){if(rig&&!rig.pieces&&this.physicalOccupants.has(rec.id))dispose(rig);if(!this.physicalOccupants.has(rec.id)){if(!rig)rig=makeRig(rec,sim,mesh);split(rig,rec);this.scene.add(rig.root);this.physicalOccupants.set(rec.id,rig);}continue;}if(rec.location!=='seated'||rec.removed)continue;
  if(!rig&&owner!==sim.player&&Math.hypot(owner.x-sim.player.x,owner.z-sim.player.z)>40)continue;if(!rig){/* V3.7: other cars get at most one new figure per frame, so a busy street never stalls. */if(owner!==sim.player){if(this.occupantBuildTime===this.time&&this.occupantBuilds>=1)continue;if(this.occupantBuildTime!==this.time){this.occupantBuildTime=this.time;this.occupantBuilds=0;}this.occupantBuilds++;}rig=makeRig(rec,sim,mesh);rig.record=rec;mesh.userData.interior.root.add(rig.root);}rig.root.visible=true;rig.injury=rec.injury;rig.wound.visible=rec.injury>.1;rig.wound.scale.y=.065*(.7+rec.injury);seatedPose(rig,body,mesh,dt,this.time);next.push(rig);
 }
 mesh.userData.occupants=next;mesh.userData.interior.occupants=next;
 mesh.userData.cabin?.traverse(o=>{if(o.userData.occupantWindshield)o.visible=!state.windshieldBroken;});if(state.windshieldBroken)for(const mark of mesh.userData.damageVisual?.crackMeshes||[])if(mark.zone==='front')mark.mesh.visible=false;
};
P.syncPhysicalOccupants=function(engine,playing){this.physicalOccupants??=new Map();for(const rec of engine.records.values())if(rec.ragdoll&&!this.physicalOccupants.has(rec.id)&&Math.hypot(rec.ragdoll.points.pelvis.x-engine.sim.player.x,rec.ragdoll.points.pelvis.z-engine.sim.player.z)<150){const rig=split(makeRig(rec,engine.sim),rec);this.physicalOccupants.set(rec.id,rig);this.scene.add(rig.root);}
 for(const[id,rig]of this.physicalOccupants){if(rig.record.removed||!rig.record.ragdoll||!engine.records.has(id)){dispose(rig);this.physicalOccupants.delete(id);continue;}rig.root.visible=playing;physicalPose(rig);} };
P.updateOccupantEffects=function(sim,dt,playing){const engine=Physics.ensure(sim,this.settings);this.syncPhysicalOccupants(engine,playing);const fx=this.occupantEffects();if(this.occupantRun!==sim){this.occupantRun=sim;for(const p of fx.particles)p.age=p.life+1;fx.run=sim;}
 for(const event of engine.events.splice(0)){const rec=engine.records.get(event.id);if(!rec||rec.removed)continue;if(event.type==='ejected')fx.ejected++;if(event.type==='blood'){const point=rec.ragdoll?.points.head||Physics.transform(Physics.pose(rec.seat,rec.scale,rec.seatIndex===0).head,rec.owner);this.emitOccupantBlood(new T.Vector3(point.x,point.y,point.z),rec.owner,event.amount);} }
 if(engine.settings.vehicleOccupants==='none')for(const p of fx.particles)p.age=p.life+1;oldEffects.call(this,sim,dt,playing);this.occupantStats={...this.occupantStats,...engine.stats,visualRagdolls:this.physicalOccupants.size,solver:'passive articulated constraints',collisionBodies:engine.ragdolls.length*15};
};
P.dispose=function(){for(const rig of this.physicalOccupants?.values()||[])dispose(rig);this.physicalOccupants?.clear();oldDispose.call(this);};
})();

