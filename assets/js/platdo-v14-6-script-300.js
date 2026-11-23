/* Render the authenticated host's ordered world stream in the existing game scenes. */
(function(root){
  'use strict';
  const drivePoseFields=['x','y','z','yaw','pitch','roll','steer','wheelSpin','rx','ry','rz','vx','vy','vz','speed','yawRate','bodyLift','terrainPitch','terrainRoll','rpm','engineRPM','slip','driftIntensity'];
  class RoomView {
    constructor(room,self){this.room=room;this.self=self;this.entities=new Map();this.seq=-1;this.time=0;}
    accept(packet){
      if(!packet||packet.room!==this.room.id||packet.seq<this.seq||(!packet.full&&packet.seq===this.seq))return;
      if(this.room.mode==='drive'&&!packet.full&&packet.time<this.time)return;
      const timeAdvanced=packet.full||this.receivedAt===undefined||packet.time>this.time;
      if(packet.full&&this.room.mode==='drive'){this.renderTime=undefined;this.lastFrame=undefined;this.lastPoseTime=undefined;}
      if(packet.full)this.entities.clear();
      this.seq=packet.seq;this.time=packet.time;
      for(const key of packet.removed)this.entities.delete(key);
      const now=performance.now();
      if(this.room.mode==='city'||timeAdvanced)this.receivedAt=now;
      for(const [key,value] of Object.entries(packet.changes)){
        const prior=this.entities.get(key);
        const next=prior&&typeof value==='object'?{...prior.value,...value}:value;
        if(this.room.mode==='drive'&&Number.isFinite(next?.x)){
          const samples=prior?.samples||[];
          if(samples.length&&(next.respawnRevision!==samples.at(-1).pose.respawnRevision||Math.hypot(next.x-samples.at(-1).pose.x,next.z-samples.at(-1).pose.z)>20))samples.length=0;
          if(samples.at(-1)?.time===packet.time)samples[samples.length-1]={time:packet.time,pose:next};else samples.push({time:packet.time,pose:next});if(samples.length>8)samples.shift();
          this.entities.set(key,{samples,value:next,start:now});
        }else{
          const entry={from:prior?this.interpolate(prior,now):next,value:next,start:now};
          /* V9.5: City rooms keep the last updates of every moving player, NPC and vehicle with the host's time (see smooth()) */
          if(this.room.mode==='city'&&Number.isFinite(next?.x)&&(key[0]==='p'||key[0]==='n'||key[0]==='v')){
            const samples=prior?.citySamples||[],last=samples.at(-1);
            if(last&&(Math.hypot(next.x-last.pose.x,next.z-last.pose.z)>16||next.vehicleId!==last.pose.vehicleId||next.respawnRevision!==last.pose.respawnRevision))samples.length=0;
            else if(last&&packet.time-last.time>.11&&packet.time-.067>last.time)samples.push({time:packet.time-.067,pose:last.pose});
            if(!samples.length||packet.time>samples.at(-1).time)samples.push({time:packet.time,pose:next});else samples[samples.length-1]={time:packet.time,pose:next};
            if(samples.length>10)samples.splice(0,samples.length-10);
            entry.citySamples=samples;entry.valueTime=packet.time;
            if(prior&&Number.isFinite(prior.value?.x)){const drawn=this.quick(prior,now),fresh=this.quick(entry,now),err={x:drawn.x-fresh.x,y:(drawn.y||0)-(fresh.y||0),z:drawn.z-fresh.z,yaw:Number.isFinite(drawn.yaw)&&Number.isFinite(fresh.yaw)?Math.atan2(Math.sin(drawn.yaw-fresh.yaw),Math.cos(drawn.yaw-fresh.yaw)):0};entry.err=Math.hypot(err.x,err.z)<4&&Math.abs(err.y)<2?err:null;entry.errAt=now;}
          }
          this.entities.set(key,entry);
        }
      }
      if(this.room.mode==='drive')for(const entry of this.entities.values())if(entry.samples&&entry.samples.at(-1)?.time<packet.time){entry.samples.push({time:packet.time,pose:entry.value});if(entry.samples.length>8)entry.samples.shift();}
    }
    interpolate(item,now,smooth){
      if(typeof item.value!=='object')return item.value;
      if(smooth&&item.citySamples?.length)return this.smooth(item.citySamples);
      if(smooth===false&&item.citySamples&&!item.value.ragdoll?.active)return this.quick(item,now);
      if(item.samples){
        const list=item.samples,target=this.renderTime??this.time;
        let b=list.findIndex(s=>s.time>=target);
        if(b===0)return list[0].pose;
        if(b<0){
          const latest=list.at(-1),previous=list.at(-2),v={...latest.pose},dt=Math.min(.065,Math.max(0,target-latest.time));
          v.x+=(v.vx||0)*dt;v.z+=(v.vz||0)*dt;if(Number.isFinite(v.yaw))v.yaw+=(v.yawRate||0)*dt;
          if(previous&&latest.time>previous.time&&Math.abs(v.speed)>.01&&Number.isFinite(v.wheelSpin)&&Number.isFinite(previous.pose.wheelSpin))
            v.wheelSpin+=(v.wheelSpin-previous.pose.wheelSpin)*dt/(latest.time-previous.time);
          return v;
        }
        const before=list[b-1],after=list[b],t=(target-before.time)/(after.time-before.time||1),v={...after.pose};
        for(const key of drivePoseFields){
          const a=before.pose[key],d=v[key]-a;if(Number.isFinite(d))v[key]=a+(key==='yaw'?Math.atan2(Math.sin(d),Math.cos(d)):d)*t;
        }
        return v;
      }
      const t=Math.min(1,(now-item.start)/70),v={...item.value};
      if(Number.isFinite(item.from.progress)&&Number.isFinite(v.progress))v.progress=item.from.progress+(v.progress-item.from.progress)*t;
      if(Math.hypot(v.x-item.from.x,v.z-item.from.z)<16)for(const key of ['x','y','z','pitch','roll','yaw']){
        if(Number.isFinite(item.from[key])&&Number.isFinite(v[key])){const d=v[key]-item.from[key];v[key]=item.from[key]+(key==='yaw'?Math.atan2(Math.sin(d),Math.cos(d)):d)*t;}
      }
      if(this.room.mode==='city'&&t<1&&item.from.ragdoll?.points&&v.ragdoll?.points){
        const points={};for(const [joint,target] of Object.entries(v.ragdoll.points)){
          const start=item.from.ragdoll.points[joint];points[joint]=start?{x:start.x+(target.x-start.x)*t,y:start.y+(target.y-start.y)*t,z:start.z+(target.z-start.z)*t}:target;
        }
        v.ragdoll={...v.ragdoll,points};
      }
      return v;
    }
    // V9.5: one monotonic clock a little behind the host, for Drive and (for other players, NPCs and cars) the City
    clock(now){
      const target=this.time+Math.min(.18,(now-(this.receivedAt??now))/1000)-(this.room.mode==='city'?.1:.095);
      const dt=Math.min(.10,Math.max(0,(now-(this.lastFrame??now))/1000));
      /* it always moves on at close to real speed (90 to 112 percent), drifting toward the target; it never stops for a late update */
      if(this.renderTime===undefined||Math.abs(target-this.renderTime)>.45)this.renderTime=target;
      else this.renderTime+=dt*(1+Math.max(-.1,Math.min(.12,(target-this.renderTime)*2)));
      this.lastFrame=now;return this.renderTime;
    }
    // V9.5: where a City entity is at the clock's time: between the two updates around it, or a little past the last one
    smooth(list){
      const target=this.renderTime??this.time;let b=list.findIndex(s=>s.time>=target);
      if(b===0)return list[0].pose;
      if(b<0){const latest=list.at(-1),v={...latest.pose},dt=Math.min(.085,Math.max(0,target-latest.time));if(dt>0&&Math.hypot(v.vx||0,v.vz||0)>.05){v.x+=(v.vx||0)*dt;v.z+=(v.vz||0)*dt;}return v;}
      const before=list[b-1],after=list[b],t=Math.max(0,Math.min(1,(target-before.time)/(after.time-before.time||1))),v={...after.pose};
      for(const key of ['x','y','z','yaw','pitch','roll','steer','wheelSpin']){const a=before.pose[key],d=v[key]-a;if(Number.isFinite(d))v[key]=a+(key==='yaw'?Math.atan2(Math.sin(d),Math.cos(d)):d)*t;}
      const pa=before.pose.ragdoll?.points,pb=v.ragdoll?.points;
      if(pa&&pb){const points={};for(const [joint,q] of Object.entries(pb)){const p=pa[joint];points[joint]=p?{x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,z:p.z+(q.z-p.z)*t}:q;}v.ragdoll={...v.ragdoll,points};}
      return v;
    }
    // V9.5: the newest update moved on by its speed to the host's time now (the steady clock without its delay, at most
    // 0.15 s), with the jump from the last drawn spot folded in over about a tenth of a second
    quick(item,now){
      const v={...item.value};
      if(Number.isFinite(v.x)){
        if(!item.citySamples?.length||v.ragdoll?.active)return item.from&&Number.isFinite(item.from.x)?this.interpolate({...item,citySamples:null},now):v;
        const dt=Math.min(.15,Math.max(-.1,(this.renderTime??this.time)+.1-(item.valueTime??item.citySamples.at(-1).time)));
        if(Math.hypot(v.vx||0,v.vz||0)>.05){v.x+=(v.vx||0)*dt;v.z+=(v.vz||0)*dt;}
        const e=item.err;if(e){const k=Math.exp(-Math.max(0,now-(item.errAt??now))/70);v.x+=e.x*k;v.y=(v.y||0)+e.y*k;v.z+=e.z*k;if(Number.isFinite(v.yaw))v.yaw+=e.yaw*k;}
      }
      return v;
    }
    apply(sim){
      const now=performance.now(),city=this.room.mode==='city',npcs=[],vehicles=[],traffic=[];
      const fragments=[],sceneryPieces=[];
      if(!city){
        // Render one snapshot behind the server. A single monotonic clock avoids
        // restarting a lerp from a moving target on each variable-latency packet.
        this.clock(now);
        root.DriveOccupantPhysics?.ensure(sim).snapshot();
      }else this.clock(now);
      /* V9.5: you, the vehicle you are in and whoever rides in it are drawn from the newest update (quick blend); everyone else smoothly, a little behind */
      const selfCar=city?this.entities.get('p:'+this.self)?.value?.vehicleId||null:null;
      const quick=(key,entry)=>key==='p:'+this.self||(selfCar&&(key==='v:'+selfCar||entry.value?.vehicleId===selfCar));
      this.cache??=new Map();const parts=[],effects=[],projectiles=[],beachBalls=[],/* V10.1: cash on the ground */pickups=[];let fleetSeen=null;if(city){this.heard??=new Set();sim.onlineSounds??=[];}
      for(const [key,entry] of this.entities){
        const kind=key[0],id=key.slice(2),v=this.interpolate(entry,now,city?!quick(key,entry):undefined);
        if(kind==='p'&&id===this.self){
          Object.assign(sim.player,v,{id:city?'player':id});
          if(city)sim.player.appearance=v.appearance||root.CityPeople.presets[v.avatar%root.CityPeople.presets.length];
        }else if(city){
          if(kind==='j')projectiles.push(v);
          if(kind==='u'){if(v.workshopDoor&&sim.world.workshop){const g=sim.world.workshop;g.door.setProgress(v.workshopDoor.progress);g.door.open=v.workshopDoor.open;g.reservation=v.workshopDoor.reservation;}sim.roomWorkshop=v.workshop||null;if(v.mechanic)sim.profile.mechanic=v.mechanic;sim.profile.world.time=v.dayTime??(.4+this.time/1440)%1;sim.homeInstance=v.homeInstance;sim.homeOwnership=v.homeOwnership||{state:'error',home:'public'};sim.mansionActivity=v.mansionActivity||null;sim.mansionFireplace=v.mansionFireplace===true;sim.roomCasino=v.casino;sim.roomCasinoTables=v.casinoTables;sim.profile.casinoPending=v.casinoPending;sim.unlockedRoomVehicles=v.unlockedVehicles||[];/* V9.6: a DingDash order the host still has */sim.onlineDelivery=v.delivery||null;/* V10.4: your job */sim.onlineJob=v.job||null;sim.onlineJobResult=v.jobResult||null;/* V10.8: houses online */sim.onlineHouse=v.house||null;sim.onlineHousesOpen=v.housesOpen||[];/* V11.1: whether the first house is yours on this server */sim.onlineHomeOwned=!!v.homeOwned;if(sim.world?.home)sim.world.home.locked=!sim.onlineHomeOwned;sim.scoutOwned=!!v.scoutOwned;/* V13.0: Christmas Mode in this room and which snowmen are gone */sim.onlineXmas=v.xmas||null;/* V13.1: deliveries finished for you */sim.onlineDealer=v.dealer||null;/* V13.2: your hangar number in this room */sim.onlineHangar=v.hangar||0;sim.wanted.level=v.wanted||0;if(v.owned)sim.profile.owned=v.owned;if(v.wardrobe)sim.profile.wardrobe=v.wardrobe;sim.profile.wallet=v.wallet;/* V14.3: hunger, thirst and the food bag, kept by the room host */if(v.survival&&typeof v.survival==='object'){const S=sim.profile.survival&&typeof sim.profile.survival==='object'?sim.profile.survival:(sim.profile.survival={});S.hunger=Number(v.survival.hunger)||0;S.thirst=Number(v.survival.thirst)||0;S.food=v.survival.food&&typeof v.survival.food==='object'?v.survival.food:{};sim.onlineSurvival=true;}else sim.onlineSurvival=false;/* V14.4: notices for you from the room host (a 6-7 robbery), each shown once */for(const n of Array.isArray(v.notices)?v.notices:[]){if(!Array.isArray(n))continue;const seen=this.noticesSeen||(this.noticesSeen=new Set());/* its own list: this.heard is tidied to the entities every frame */if(seen.has(n[0]))continue;seen.add(n[0]);if(seen.size>64)seen.delete(seen.values().next().value);sim.onlineSounds.push({type:'notice',message:String(n[1]||''),sound:typeof n[2]==='string'?n[2]:null});}Object.assign(sim.profile.sandbox,v.sandbox);sim.profile.world.weather=v.weather;}
          if(kind==='u'&&Number.isFinite(v.pedestrians))sim.roomPedestrianDensity=v.pedestrians;
          if(kind==='i')Object.assign(sim.profile.inventory,v);
          if(kind==='w')parts.push({...v,id});
          if(kind==='f')effects.push(v);
          if(kind==='o')beachBalls.push({...v,id});/* V14.4: the 6-7s (closed, being robbed, the money bag) from the room host */if(kind==='e'&&id==='sixseven')window.CitySixSeven?.applyView?.(sim,v);/* V13.1: the dealership teams that are out */if(kind==='x')fleetSeen=v;/* V13.2: the hangars: how many, whose, their doors */if(kind==='h')window.CityHangars?.applyView(sim.world,v,{index:sim.onlineHangar||0,key:'player'});
          if(kind==='m')pickups.push({...v,id});
          if(kind==='a'&&!this.heard.has(key)){
            this.heard.add(key);/* V13.0: a snowman was broken: everyone sees it fall apart; "mine" is the player who was paid */if(v.type==='snowmanBroken')(sim.onlineXmasEvents||(sim.onlineXmasEvents=[])).push({...v,mine:v.by===this.self});else if(this.time-v.time<.4)sim.onlineSounds.push(v);
          }
          if(kind==='d'){const door=sim.world.doors.find(d=>d.id===id),open=typeof v==='object'?v.open:v;if(door){if(door.open!==open)sim.world.setDoorOpen(id,open);if(door.autoProximity){door.networkDriven=true;door.networkProgress=Number.isFinite(v?.progress);if(door.networkProgress)door.setProgress(v.progress);}}}
          if(kind==='p'||kind==='n')npcs.push({...v,id,appearance:v.appearance||root.CityPeople.presets[v.avatar%root.CityPeople.presets.length],weapon:v.weapon||'unarmed',role:v.role||'civilian',/* V13.1: what a salesperson holds on your screen */carriedProp:sim.npcProps?.[id]||v.carriedProp});
          if(kind==='v'){
            let car=this.cache.get(key);if(!car){car=root.CityVehicles.createVehicle(v.typeId,id,v);this.cache.set(key,car);}
            Object.assign(car,v);if(car.seatOccupants)car.seatOccupants=car.seatOccupants.map(who=>who===this.self?'player':who);
            vehicles.push(car);
          }
        }else{
          if(kind==='t'||kind==='p'){
            let car=this.cache.get(key);if(!car){car={damage:{},impacts:[]};this.cache.set(key,car);}
            Object.assign(car,v,{id:key,type:v.type||'compact',onlinePaint:v.paint,width:v.width||1.8,length:v.length||4.3,colorIndex:v.colorIndex??v.avatar??0});traffic.push(car);
          }
          if(kind==='u'){Object.assign(sim,{onlineRunId:v.runId,distance:v.distance,eligibleDistance:v.eligibleDistance||0,driftDistance:v.driftDistance||0,oncomingDistance:v.oncomingDistance||0,bestDrift:v.bestDrift,rewardFactor:v.rewardFactor||1,score:v.score||0,lockedTraffic:true,recoveryPoint:v.recoveryPoint});for(const event of v.events||[]){if(event.key>(this.driveEventCursor||0))sim.events.push(event);this.driveEventCursor=Math.max(this.driveEventCursor||0,event.key);}}
          if(kind==='u')Object.assign(sim,{onlineDriveMode:v.driveMode||'free',remaining:v.remaining,checkpointIndex:v.checkpointIndex||0,penalty:v.penalty||0,onlineFinished:!!v.finished,onlineResult:v.result||null,closeCallCredits:v.closeCallCredits||0});
          if(kind==='j')fragments.push(v);
          if(kind==='k')sceneryPieces.push(v);
          if(kind==='r'&&!sim.brokenRails.has(id)){sim.brokenRails.add(id);sim.railRevision++;}
          if(kind==='s'&&!sim.brokenScenery.has(id)){sim.brokenScenery.add(id);sim.sceneryRevision++;}
          if(kind==='b'){const b=sim.looseBlockers.find(b=>b.id===id);if(b)Object.assign(b,v);}
        }
      }
      sim.time=this.time;if(city){const beach=root.CityBeach?.lifeOf?.(sim);if(beach)beach.balls=beachBalls;sim.npcs=npcs;sim.vehicles=vehicles;sim.streetActions={parts,serial:0};sim.effects=effects;sim.projectiles=projectiles;sim.drops=pickups;/* V13.1 */sim.onlineFleet=fleetSeen;for(const key of this.heard)if(!this.entities.has(key))this.heard.delete(key);}
      else{
        if(sim.traffic.length!==traffic.length||traffic.some((v,i)=>v!==sim.traffic[i]))sim.traffic=traffic;sim.renderPlayer=null;sim.railDebris=fragments;sim.sceneryDebris=sceneryPieces;
        const elapsed=Math.min(.08,Math.max(0,(this.renderTime-(this.lastPoseTime??this.renderTime))));
        this.lastPoseTime=this.renderTime;sim.time=this.renderTime;
        if(elapsed>0)root.DriveOccupantPhysics?.ensure(sim).step(elapsed);
      }
      for(const key of this.cache.keys())if(!this.entities.has(key))this.cache.delete(key);
    }
  }
  class ChaseRoomView {
    constructor(room,self,{sendInput,onExit}){
      this.room=room;this.self=self;this.sendInput=sendInput;this.onExit=onExit;
      this.presentedRound=null;this.seq=-1;this.chase=null;this.renderer=null;this.paused=false;this.disposed=false;
    }
    accept(packet){
      if(this.disposed||packet?.room!==this.room.id||packet.seq<this.seq||(!packet.full&&packet.seq===this.seq))return;
      this.seq=packet.seq;
      if(this.presentedRound!=null&&this.chase?.round===this.presentedRound)this.acknowledge(this.presentedRound);
      if(!packet.changes?.chase)return;
      const old=this.chase,state=this.chase=packet.full?packet.changes.chase:{...old,...packet.changes.chase};
      if(state.phase==='waiting'){
        if(old&&old.phase!=='waiting'){this.release();this.onExit();}
      }else if(!old||old.phase==='waiting'||state.round!==old.round||old.phase==='ended'&&state.phase!=='ended'){
        this.release();this.resume();
      }else this.renderer?.accept(state);
      if(state.phase!==old?.phase||state.reconnecting!==old?.reconnecting||state.finished?.length!==old?.finished?.length||state.nextRoles?.cop!==old?.nextRoles?.cop)root.PlatdoFriendsPanel?.refresh();
    }
    acknowledge(round){
      if(round==null||this.ackPending||this.chase?.finished?.includes(this.self)||this.ackRetry>performance.now())return;
      this.ackPending=true;this.ackRetry=performance.now()+2000;
      root.PlatdoFriends.action('finishArrest',{round}).catch(()=>{}).finally(()=>{this.ackPending=false;});
    }
    resume(){
      if(this.disposed||!this.chase||this.chase.phase==='waiting')return false;
      const role=['cop','robber'].find(k=>this.chase.roles?.[k]===this.self);if(!role)return false;
      root.PlatdoFriendsPanel?.close();this.paused=false;
      if(!this.renderer)this.renderer=root.PlatdoCopChase.open({role,alreadyShown:this.chase.finished?.includes(this.self)||this.presentedRound===this.chase.round,onResult:round=>{
        this.presentedRound=round;this.acknowledge(round);
      },onRecover:()=>root.PlatdoFriends.action('driveRecover'),input:axes=>{
        if(!this.paused&&!this.disposed&&!this.chase.reconnecting)this.sendInput(axes);
      },onExit:()=>{this.release();this.onExit();}});
      this.renderer.accept(this.chase);return true;
    }
    suspend(on,reason){if(on)this.sendInput({});this.paused=on;this.renderer?.suspend(on,reason);}
    apply(){}
    release(){this.sendInput({});this.renderer?.close();this.renderer=null;}
    close(){this.disposed=true;this.release();}
  }
  root.PlatdoChaseRoomView=ChaseRoomView;
  root.PlatdoRoomView=RoomView;
})(window);
