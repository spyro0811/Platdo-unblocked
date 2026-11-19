
/* Presentation-only paired animation library. All performers are fictional adults.
 * Nothing in this module reads or writes player progress, health or physics. */
(function(root){'use strict';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);},pulse=x=>Math.sin(Math.PI*clamp(x)),mix=(a,b,t)=>a+(b-a)*t;
const move=(at,who,action,response='hit',duration=.64)=>({at,who,action,response,duration});
const exchanges=[
 ['Forward pressure',[move(.15,'o','jab','block'),move(.85,'o','cross','slip'),move(1.60,'o','hook','block'),move(2.35,'p','jab','hit'),move(3.10,'o','cross','duck'),move(3.85,'p','body','hit'),move(4.60,'o','hook','block'),move(5.35,'p','cross','hit')],'pressure'],
 ['Kick pressure',[move(.12,'o','frontKick','check',.78),move(1.02,'o','roundKick','evade',.80),move(1.92,'p','jab','block'),move(2.62,'o','lowKick','check'),move(3.38,'p','body','hit'),move(4.10,'o','frontKick','evade',.76),move(4.98,'p','cross','hit'),move(5.68,'p','hook','hit',.55)],'close'],
 ['Circling trade',[move(.20,'o','jab','slip'),move(.96,'p','hook','block'),move(1.74,'o','roundKick','evade'),move(2.52,'p','cross','hit'),move(3.28,'o','hook','duck'),move(4.04,'p','body','hit'),move(4.80,'o','jab','block'),move(5.56,'p','hook','hit')],'circle'],
 ['High and low feints',[move(.12,'o','feint','watch',.48),move(.72,'o','body','block'),move(1.48,'o','feintLow','watch',.46),move(2.10,'o','cross','slip'),move(2.88,'p','jab','hit'),move(3.65,'o','body','evade'),move(4.40,'p','feint','watch',.44),move(5.04,'p','uppercut','hit',.84)],'feint'],
 ['Shoulder rush',[move(.20,'o','rush','brace',1.12),move(1.50,'p','shove','stagger',.85),move(2.50,'o','jab','block'),move(3.22,'o','rush','redirect',1.06),move(4.48,'p','elbow','hit'),move(5.24,'p','body','hit',.76)],'rush'],
 ['Close grapple',[move(.18,'o','grip','resist',1.05),move(1.40,'p','gripTurn','resist',1.10),move(2.66,'o','knee','block',.72),move(3.56,'p','grip','resist',1.08),move(4.82,'p','elbow','hit'),move(5.55,'p','shove','stagger',.64)],'grapple'],
 ['Sweep recovery',[move(.18,'o','jab','block'),move(.94,'o','sweep','trip',1.02),move(2.13,'o','cross','duck'),move(2.92,'p','rising','hit',.82),move(3.90,'o','lowKick','check'),move(4.68,'p','hook','hit'),move(5.43,'p','body','hit',.68)],'sweep'],
 ['Alternating combinations',[move(.10,'o','jab','block',.48),move(.64,'o','cross','slip',.50),move(1.22,'p','body','hit',.50),move(1.80,'p','hook','block',.52),move(2.50,'o','hook','duck',.56),move(3.18,'o','frontKick','check',.70),move(4.00,'p','jab','hit',.50),move(4.60,'p','cross','hit',.55),move(5.28,'p','uppercut','hit',.82)],'alternating'],
 ['Overcommitted lunges',[move(.15,'o','lunge','evade',1.08),move(1.40,'p','body','hit'),move(2.20,'o','hook','block'),move(3.02,'o','lunge','slip',1.04),move(4.22,'p','elbow','hit'),move(5.08,'p','cross','hit',.90)],'lunge'],
 ['Duck and rise',[move(.15,'o','wideHook','duck',.83),move(1.15,'p','rising','hit',.80),move(2.12,'o','cross','block'),move(2.92,'o','wideHook','duck',.82),move(3.92,'p','uppercut','hit',.78),move(4.88,'o','jab','slip'),move(5.59,'p','body','hit',.56)],'duck'],
 ['Shove and reengage',[move(.15,'o','shove','stagger',.90),move(1.34,'p','jab','block'),move(2.10,'p','shove','stagger',.90),move(3.24,'o','lunge','block',.88),move(4.30,'p','body','hit'),move(5.14,'p','cross','hit',.82)],'separate'],
 ['Kick versus kick',[move(.12,'o','lowKick','check',.73),move(.98,'p','frontKick','evade',.75),move(1.88,'o','roundKick','evade',.80),move(2.84,'p','sideKick','hit',.86),move(3.86,'o','frontKick','check',.73),move(4.76,'p','roundKick','hit',.94)],'kicks'],
 ['Clinch break',[move(.15,'o','grip','resist',1.15),move(1.50,'o','knee','check',.76),move(2.44,'p','breakGrip','resist',1.05),move(3.68,'p','gripTurn','resist',1.06),move(4.94,'p','elbow','hit',.91),move(5.98,'p','shove','stagger',.42)],'clinch'],
 ['Footwork trap',[move(.15,'o','jab','slip'),move(.93,'o','cross','evade'),move(1.72,'o','hook','duck'),move(2.55,'p','feint','watch',.52),move(3.23,'o','lunge','evade',1.02),move(4.46,'p','hook','hit'),move(5.25,'p','cross','hit',.78)],'trap'],
 ['Scramble reversal',[move(.12,'o','rush','redirect',.90),move(1.18,'p','body','block'),move(1.96,'o','sweep','trip',.90),move(3.02,'p','rising','hit',.80),move(3.98,'o','grip','resist',.82),move(4.96,'p','breakGrip','hit',1.08)],'scramble']
].map(([name,beats,footwork],id)=>({id,name,duration:6.5,beats,footwork}));
const finishers=[
 ['Turn-through punch','cross',2.1,'back'],['Spinning backfist','backfist',2.25,'side'],['Lunging elbow','elbow',1.95,'front'],['Rising uppercut','uppercut',2.2,'back'],['Driving front kick','frontKick',2.35,'back'],['Leaping knee','jumpKnee',2.4,'back'],['Overhead hammer','hammer',2.15,'front'],['Escalating combination','combo',2.75,'back'],['Clinch headbutt','headbutt',2.45,'front'],['Rotational hip throw','hipThrow',2.65,'side'],['Shoulder carry slam','shoulderSlam',2.85,'back'],['Vertical lift slam','verticalSlam',2.9,'back'],['Rotating lateral slam','lateralSlam',2.85,'side'],['Sweep and follow-through','groundStrike',2.8,'back'],['Low reversal turnover','turnover',2.85,'front']
].map(([name,action,duration,landing],id)=>({id,name,action,duration,landing,compatible:exchanges.map(x=>x.id)}));
function body(x,yaw){return {x,y:0,z:0,yaw,pitch:0,roll:0,crouch:.05,lean:0,twist:0,guard:1,attack:null,reaction:null,fallen:0};}
function sampleExchange(index,t){const clip=exchanges[index%15],p=body(-.57,Math.PI/2),o=body(.57,-Math.PI/2),s=clamp(t/6.5),phase=t*3.4;let cx=0,cz=0,angle=0;
 switch(clip.footwork){case'pressure':cx=-.55*Math.sin(s*Math.PI);break;case'close':p.x+=.16*Math.sin(s*Math.PI);break;case'circle':angle=.60*Math.sin(s*Math.PI*2);break;case'feint':p.z=.12*Math.sin(phase);o.z=-.10*Math.sin(phase+.6);break;case'rush':cx=-.25*Math.sin(phase);cz=.20*Math.sin(phase*.5);break;case'grapple':p.x+=.16;o.x-=.16;angle=.28*Math.sin(phase*.5);break;case'sweep':p.z=.14*Math.sin(phase*.6);break;case'alternating':cx=.18*Math.sin(phase);break;case'lunge':o.z=.23*Math.sin(phase*.6);break;case'duck':p.crouch+=.08*Math.sin(phase)**2;break;case'separate':p.x-=.24*Math.sin(s*Math.PI*3)**2;o.x+=.24*Math.sin(s*Math.PI*3)**2;break;case'kicks':p.x-=.12;o.x+=.12;break;case'clinch':p.x+=.17;o.x-=.17;angle=-.26*Math.sin(phase*.5);break;case'trap':cx=-.55*Math.sin(s*Math.PI);cz=.38*Math.sin(s*Math.PI);angle=.22*Math.sin(s*Math.PI);break;case'scramble':cx=.16*Math.sin(phase*.5);angle=.22*Math.sin(phase);break;}
 const active=clip.beats.find(b=>t>=b.at&&t<b.at+b.duration);if(active){const a=active.who==='p'?p:o,d=active.who==='p'?o:p,u=(t-active.at)/active.duration,q=pulse(u),sign=active.who==='p'?1:-1,kind=active.action;
  a.attack={kind,phase:u,response:active.response,side:['jab','hook','roundKick','sweep','wideHook'].includes(kind)?'L':'R'};d.reaction={kind:active.response,phase:u,attack:kind};
  a.x+=sign*q*(/Kick|knee/.test(kind)?.22:/grip|Grip/.test(kind)?.12:/rush|lunge/.test(kind)?.55:.60);a.lean=.13*q;a.twist=(a.attack.side==='L'?-.22:.22)*q;
  if(kind==='feint'||kind==='feintLow'){a.x-=sign*.20*q;a.crouch+=kind==='feintLow'?.22*q:0;}
  if(/sweep|lowKick/.test(kind)){a.crouch+=.27*q;a.roll=-sign*.18*q;}
  if(kind==='rising'||kind==='uppercut'){a.crouch+=.24*(1-smooth(u*1.7));a.lean=-.17*q;}
  if(/grip|Grip/.test(kind)){a.guard=0;a.twist=.42*q;d.twist=-.20*q;d.lean=-.10*q;}
  const react=pulse(clamp((u-.52)/.48));if(active.response==='hit'){d.x+=sign*.12*react;d.lean=-.20*react;d.twist=sign*.11*react;}else if(active.response==='duck'){d.crouch+=.40*q;d.lean=.22*q;}else if(active.response==='slip'){d.z+=.25*q;d.roll=.22*q;}else if(active.response==='evade'){d.x+=sign*.32*q;d.z+=.14*q;}else if(active.response==='trip'){d.crouch+=.37*react;d.roll=-.27*react;d.z+=.20*react;}else if(active.response==='stagger'){d.x+=sign*.38*react;d.lean=-.24*react;}else if(active.response==='redirect'){d.z+=.30*q;d.twist=.45*q;}
 }
 for(const b of[p,o]){const x=b.x,z=b.z;b.x=cx+Math.cos(angle)*x+Math.sin(angle)*z;b.z=cz-Math.sin(angle)*x+Math.cos(angle)*z;b.yaw+=angle;}
 return {p,o,clip,active};
}
function sampleFinisher(index,t){const clip=finishers[index%15],u=clamp(t/clip.duration),p=body(-.53,Math.PI/2),o=body(.53,-Math.PI/2),load=smooth(u/.30),strike=smooth((u-.30)/.15),fall=smooth((u-.51)/.34),q=pulse(u);p.attack={kind:clip.action,phase:clamp((u-.20)/.42),side:'R',response:'hit'};p.x+=.35*pulse(clamp(u/.72));p.crouch=.05+.14*(1-strike)*load;p.twist=-.45*load+.85*strike;p.lean=.25*Math.sin(strike*Math.PI);
 // Each finish has its own weight transfer, contact and complete landing arc.
 switch(clip.action){
 case'backfist':p.yaw+=Math.PI*2*smooth(u/.62);p.z=-.22*q;o.z=.65*fall;o.roll=.8*fall;break;
 case'elbow':p.x+=.14*pulse(clamp(u/.66));p.lean=.32*pulse(clamp(u/.66));o.x+=.24*fall;break;
 case'uppercut':p.crouch=.38*(1-strike);o.y=.48*Math.sin(fall*Math.PI);o.x+=.40*fall;break;
 case'frontKick':p.x-=.15*q;p.lean=-.31*pulse(clamp((u-.2)/.5));o.x+=1.05*fall;break;
 case'jumpKnee':p.y=.56*pulse(clamp((u-.16)/.52));p.crouch=.12+ .20*pulse(clamp((u-.65)/.35));o.x+=.72*fall;break;
 case'hammer':p.crouch=.12+.27*pulse(clamp((u-.4)/.5));p.lean=.44*strike;o.crouch=.32*fall;break;
 case'combo':p.twist=.46*Math.sin(u*Math.PI*6)*pulse(u);p.x+=.10*Math.sin(u*Math.PI*6)**2;o.lean=-.20*Math.abs(Math.sin(u*Math.PI*6))*u;o.x+=.42*fall;break;
 case'headbutt':p.x=.02*smooth(u/.28)-.53*(1-smooth(u/.28));o.x=.39;p.lean=.40*pulse(clamp((u-.25)/.4));p.guard=0;o.guard=0;break;
 case'hipThrow':p.yaw+=1.65*smooth((u-.18)/.40);p.crouch=.22*q;o.x=mix(.53,-.30,smooth((u-.30)/.45));o.y=.85*pulse(clamp((u-.25)/.52));o.roll=-Math.PI*smooth((u-.28)/.55);break;
 case'shoulderSlam':p.crouch=.40*(1-smooth(u/.45));o.x=.22;o.y=1.45*pulse(clamp((u-.16)/.62));o.pitch=-Math.PI*.5*smooth(u/.35);o.x+=.65*smooth((u-.48)/.35);break;
 case'verticalSlam':p.crouch=.32*(1-smooth(u/.4));p.y=.08*pulse(u);o.x=.20;o.y=1.45*pulse(clamp((u-.15)/.64));o.pitch=.18*Math.sin(u*Math.PI);break;
 case'lateralSlam':p.yaw+=Math.PI*.85*smooth((u-.14)/.60);o.x=.22+.80*smooth((u-.44)/.40);o.z=.48*Math.sin(u*Math.PI*2);o.y=1.15*pulse(clamp((u-.16)/.64));o.roll=1.4*smooth(u/.4);break;
 case'groundStrike':p.crouch=.35*pulse(clamp(u/.48))+.35*pulse(clamp((u-.48)/.45));p.x+=.20*strike;o.roll=0;o.y=0;o.fallen=smooth((u-.24)/.26);p.lean=.6*pulse(clamp((u-.50)/.32));break;
 case'turnover':p.crouch=.52*(1-smooth((u-.3)/.40));p.yaw-=1.55*smooth((u-.23)/.52);o.x=mix(.53,-.28,smooth((u-.22)/.6));o.y=1.05*pulse(clamp((u-.22)/.58));o.pitch=Math.PI*smooth((u-.28)/.50);break;
 default:o.x+=.52*fall;
 }
 o.fallen=Math.max(o.fallen,fall);o.y-=.10*fall;o.guard=1-fall;o.pitch=mix(o.pitch,clip.landing==='front'?Math.PI/2:-Math.PI/2,fall);o.roll=mix(o.roll,clip.landing==='side'?.75:0,fall);p.attack.deadly=true;
 return {p,o,clip,progress:u,contact:clip.action==='combo'?[.29,.43,.56]:[/Throw|Slam|turnover/.test(clip.action)?.79:clip.action==='groundStrike'?.69:.44],terminal:fall>.99};
}
class Bag{constructor(count,random=Math.random){this.count=count;this.random=random;this.remaining=[];this.last=-1;}next(){if(!this.remaining.length){this.remaining=Array.from({length:this.count},(_,i)=>i);for(let i=this.count-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.remaining[i],this.remaining[j]]=[this.remaining[j],this.remaining[i]];}if(this.remaining[this.count-1]===this.last)[this.remaining[0],this.remaining[this.count-1]]=[this.remaining[this.count-1],this.remaining[0]];}return this.last=this.remaining.pop();}}
// The front axle traces a tight inner circle; the driven rear sweeps around it.
// Keep yaw unwrapped so crossing a lap or blending variants never spins backward.
function drift(t,variation=0,front={x:0,z:1.35}){const a=t/8.7*Math.PI*2,r=.28+variation*.035,yaw=a+.035*Math.sin(a*2+variation),frontX=r*Math.cos(a),frontZ=r*Math.sin(a),s=Math.sin(yaw),c=Math.cos(yaw),x=frontX-c*front.x-s*front.z,z=frontZ+s*front.x-c*front.z,omega=Math.PI*2/8.7;return{x,z,frontX,frontZ,yaw,wheel:-.48-.045*Math.sin(a*2+variation),roll:.018+.006*Math.sin(a*2),pitch:.006*Math.sin(a*3),speed:Math.hypot(front.x,front.z)*omega,rearSpeed:(Math.abs(front.z)*2+r)*omega};}
function driftSpace(length,width,front={x:0,z:length*.30}){let radius=0;for(const x of[-width/2,width/2])for(const z of[-length/2,length/2])radius=Math.max(radius,Math.hypot(x-front.x,z-front.z));radius+=.34;return{radius,crowdRadius:radius+1.7,shiftZ:Math.max(0,radius-6.5)};}
// Every feature has an opening, readable action, and resolution. Fight shots are
// tied to its actual animation phases, so a longer finisher cannot get cut off.
const features=[
 {id:'drift',duration:17.4,shots:['drift-establish','drift-front-axle','drift-wheel','drift-crowd','drift-overhead','drift-rear']},
 {id:'poop',duration:9,shots:['yard-establish','yard-prepare','yard-release','yard-ground','yard-resolve']},
 {id:'pee',duration:12,shots:['roof-establish','roof-source','roof-stream','roof-receiver','roof-impact','roof-resolve']},
 {id:'eat',duration:9,shots:['eat-discover','eat-reach','eat-pickup','eat-mouth','eat-resolve']},
 {id:'fight',duration:null,shots:['fight-approach','fight-square','fight-low','fight-shoulder','fight-track','fight-finish','fight-pickup','fight-throw','fight-resolve']}
];
function menuShot(feature,time,fight={}){
 const f=features.find(x=>x.id===feature)||features[0];let index,progress;
 if(feature==='fight'){
  const phase=fight.phase||'approach',t=fight.time||0;
  if(phase==='approach'){const q=clamp(t/(fight.approachDuration||3));index=q<.5?0:1;progress=(q*2)%1;}
  else if(phase==='exchange'){index=2+Math.min(2,Math.floor(t/(6.5/3)));progress=(t/(6.5/3))%1;}
  else{index={waiting:fight.finished?8:0,finish:5,pickup:6,throw:7,recover:8}[phase]??0;progress=phase==='waiting'&&fight.finished?1:clamp(t/({finish:finishers[fight.finisher||0].duration,pickup:3,throw:2.5,recover:1.1}[phase]||1));}
 }else{const q=clamp(time/f.duration,0,.999999)*f.shots.length;index=Math.floor(q);progress=q-index;}
 return{feature:f.id,id:f.shots[index],index,progress:smooth(progress),count:f.shots.length};
}
class Director{
 constructor(){this.index=0;this.time=0;this.cycle=0;this.started=false;}
 get feature(){return features[this.index];}
 advance(dt,complete=false){this.time+=Math.max(0,dt);const f=this.feature;if(f.id==='fight'?!complete:this.time+1e-8<f.duration)return false;this.time=f.duration?Math.max(0,this.time-f.duration):0;this.index=(this.index+1)%features.length;if(!this.index)this.cycle++;this.started=false;return true;}
}
function opponentRoster(catalog){const seen=new Set(),roster=[];for(let n=0;n<catalog.length&&roster.length<25;n++){const a=catalog[(31*137+23+n*137)%catalog.length],shape=[a.body,a.face,a.hair,a.upper,a.lower,a.shoe,a.accessory].join(':');if(seen.has(shape))continue;seen.add(shape);roster.push(a);}return roster;}
// One small fixed-step articulated body, only while a menu opponent is airborne.
// Gravity drives independent damped joints with anatomical stops; this does not
// instantiate the gameplay ragdoll solver or touch any live NPC's health.
const ragdollBones=['spine','head','armL','armR','forearmL','forearmR','thighL','thighR','calfL','calfR'];
class AirRagdoll{
 constructor(pose={},seed=0){this.time=0;this.remainder=0;this.joints=Object.fromEntries(ragdollBones.map((name,i)=>[name,{x:pose[name]?.x||0,z:pose[name]?.z||0,vx:Math.sin(seed+i*2.7)*2.6,vz:Math.cos(seed+i*1.9)*2.1}]));}
 step(dt){this.remainder+=Math.max(0,dt);const h=1/120;while(this.remainder+1e-10>=h){this.remainder-=h;this.time+=h;const body=this.body();for(const[name,j]of Object.entries(this.joints)){const lower=/calf|forearm/.test(name),torque=lower?12:8,damping=lower?2.2:1.5;
   j.vx+=(Math.sin(-body.pitch-j.x)*torque-j.vx*damping)*h;j.vz+=(Math.sin(-body.roll-j.z)*torque*.65-j.vz*damping)*h;
   j.x+=j.vx*h;j.z+=j.vz*h;const limits=name==='head'?[-.7,.7]:name==='spine'?[-.3,.4]:/calf/.test(name)?[0,2.6]:/forearm/.test(name)?[-2.5,.05]:[-2.1,1.3],zLimit=/calf|forearm/.test(name)?.25:name==='spine'?.35:1.3;
   if(j.x<limits[0]||j.x>limits[1]){j.x=clamp(j.x,...limits);j.vx*=-.12;}if(Math.abs(j.z)>zLimit){j.z=clamp(j.z,-zLimit,zLimit);j.vz*=-.12;}
  }}return this;
 }
 body(){const t=this.time,turn=(1-Math.exp(-.35*t))/.35;return{x:2.2*t,y:20*t-4.9*t*t,z:-1.1*t,pitch:1.7*turn,yaw:.38*turn,roll:1.15*turn};}
}
root.CityMenuChoreography={exchanges,finishers,sampleExchange,sampleFinisher,Bag,drift,driftSpace,features,menuShot,Director,opponentRoster,AirRagdoll,clamp,smooth,pulse};
})(typeof window!=='undefined'?window:globalThis);

