
/* Presentation-only budgets. Shared Platdo resolution/FPS remain authoritative. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;root.CityGraphics=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
// V2: the lower tiers used to be mostly a smaller drawing size (0.5x at Potato), which
// blurred the picture without removing much work. Each tier now keeps a sharp image and
// instead changes what is actually built and drawn: model segments, how soon cars and
// people swap to merged models (people columns below, cars follow model detail), crowd
// size, view distance, shadows, sky reflections and the finishing pass.
const rows=[
 ['potato',.75,0,0,0,.05,[5,13],8,2,0,0],
 ['low',.9,0,0,1,.15,[7,20],16,3,0,1],
 ['medium',1,2048,95,2,.35,[11,34],32,5,64,2],
 ['high',1,2048,95,3,.6,[16,52],64,7,128,3],
 ['expert',1,4096,114,3,.75,[22,70],80,9,128,4],
 ['ultra',1,4096,133,4,.9,[28,88],96,12,128,5],
 ['insane',1,4096,152,5,1,[36,110],100,16,128,6]
];
const presets=Object.freeze(Object.fromEntries(rows.map(([id,scale,shadowSize,shadowExtent,detailRadius,detailFraction,peopleLOD,effectCap,particles,environmentSize,materialDetail])=>[id,Object.freeze({id,label:id[0].toUpperCase()+id.slice(1),scale,shadowSize,shadowExtent,detailRadius,detailFraction,peopleLOD:Object.freeze(peopleLOD),effectCap,particles,environmentSize,materialDetail,shadowFilter:materialDetail>=2?'soft':'pcf',shadowRadius:materialDetail>=5?2:1,anisotropy:[1,2,4,8,8,12,16][materialDetail]})])));
const profiles={
 potato:{pedestrians:6,scale:.75,distance:200,lighting:'ambient',shadows:'off',detail:'low',particles:'low',reflections:'off',post:'off'},
 low:{pedestrians:12,scale:.9,distance:360,lighting:'sun',shadows:'off',detail:'low',particles:'low',reflections:'off',post:'off'},
 medium:{pedestrians:22,scale:1,distance:800,lighting:'sun',shadows:'medium',detail:'medium',particles:'medium',reflections:'low',post:'bloom'},
 high:{pedestrians:32,scale:1,distance:1200,lighting:'full',shadows:'high',detail:'high',particles:'high',reflections:'high',post:'full'},
 expert:{pedestrians:36,scale:1,distance:1600,lighting:'full',shadows:'high',detail:'high',particles:'high',reflections:'high',post:'full'},
 ultra:{pedestrians:40,scale:1,distance:2000,lighting:'full',shadows:'ultra',detail:'high',particles:'high',reflections:'high',post:'full'},
 insane:{pedestrians:44,scale:1.25,distance:2400,lighting:'full',shadows:'ultra',detail:'high',particles:'high',reflections:'high',post:'full'}
};
// Automatic mode: start from the scanned preset, then fit two things to this device.
// The crowd is processor work; view distance is mostly graphics work.
function auto(device,preset){const base=profiles[preset]||profiles.medium,cpu=[6,12,22,32,40][Math.max(0,Math.min(4,device.cpuClass??2))],gpu=[200,360,800,1200,2000][Math.max(0,Math.min(4,device.gpuClass??2))];return{pedestrians:Math.min(base.pedestrians,cpu),distance:Math.min(base.distance,gpu),post:device.floatTargets===false?'off':base.post};}
const fields={
 ragdoll:{type:'select',label:'Ragdoll style',options:[{value:'normal',label:'Normal (default)'},{value:'realistic',label:'Realistic (solo only)'}],default:'normal',preserveOnPreset:true,help:'Normal uses simpler falls and a reliable get-up. Realistic enables the articulated balance solver in solo play. Multiplayer always uses Normal.'},
 gore:{type:'select',label:'Gore',options:['none','ouch','oh shoot!','AAAAHHH!'],default:'AAAAHHH!',preserveOnPreset:true,help:'none: no blood or separation. ouch: impact blood. oh shoot!: localized wound drips. AAAAHHH!: severe regional damage can separate body parts. Damage and health still work at every level.'},
 pedestrians:{type:'range',label:'Pedestrian density',min:0,max:44,step:1,default:44,unit:'peds',help:'0–44 ambient pedestrians; 44 is the original population budget. Story contacts, shop staff, mission actors, police and seated vehicle occupants remain available.'},
 distance:{type:'range',label:'Render distance',min:160,max:2400,step:40,default:800,unit:'m',help:'Distant buildings, terrain chunks and props stop drawing. Physics, NPC state and collisions remain active. Nearby threats stay visible.'},
 lighting:{type:'select',label:'Lighting',options:[{value:'ambient',label:'Ambient (fastest)'},{value:'sun',label:'Sunlight'},{value:'full',label:'Sunlight + headlights'}],default:'sun',help:'Ambient removes directional and spot-light work; full adds vehicle headlights. Brightness is separate.'},
 shadows:{type:'select',label:'Shadows',options:['off','low','medium','high','ultra'],default:'medium',help:'Off stops the shadow pass. Low uses a 1024 pixel map, Medium and High a soft-edged 2048 map and Ultra 4096, limited by your browser. Low and Medium redraw the map every other frame.'},
 detail:{type:'select',label:'World detail',options:['low','medium','high'],default:'medium',help:'Changes optional facade range and distant character detail. Nearby actors and collisions stay intact.'},
 modelDetail:globalThis.PlatdoGraphics?.modelDetailField||{type:'range',label:'Model detail (faces)',min:0,max:5,step:1,default:0,help:'Automatic follows the recommended quality preset. Lower values use fewer geometry segments on characters, vehicles and curved scenery; collision shapes and controls stay the same.'},
 smokeParticles:globalThis.PlatdoGraphics?.smokeParticleField||{type:'range',label:'Drift smoke particles',min:-1,max:1000,step:1,default:-1,help:'Automatic follows the detected hardware. 0 turns drift smoke off.'},
 particles:{type:'select',label:'Effects detail',options:['low','medium','high'],default:'medium',help:'Reduces decorative impact particles, rain and casings. Projectiles and essential hit feedback remain visible.'},
 reflections:{type:'select',label:'Sky reflections',options:[{value:'off',label:'Off (fastest)'},{value:'low',label:'On'},{value:'high',label:'Sharp, with clear-coat paint'}],default:'low',help:'Glass, water, chrome and car paint reflect the live sky, and the sky lights the world. Off uses plain ambient light, which is the cheapest to shade.'},
 post:{type:'select',label:'Finishing',options:[{value:'off',label:'Off (fastest)'},{value:'bloom',label:'Glow and colour'},{value:'full',label:'Glow, colour and smooth edges'}],default:'bloom',help:'Draws the scene in high dynamic range, adds a soft glow around lamps and the sun, and grades the colour. Smooth edges uses 4x multisampling. Off draws straight to the screen.'}
};
function modelLevel(v,preset){return Math.max(1,Math.min(5,Math.round(Number(v.modelDetailLevel)||(Number(v.modelDetail)>0?Number(v.modelDetail):({potato:1,low:2,medium:3,high:4,expert:4,epic:4,ultra:5,insane:5}[v.modelDetailPreset||preset]||3)))));}
function resolve(v){const source=v.preset==='custom'?v.modelDetailPreset:v.preset,level=v.detail==='low'?(source==='potato'?presets.potato:presets.low):v.detail==='high'?presets.high:presets.medium,shadow={off:0,low:1024,medium:2048,high:2048,ultra:4096}[v.shadows]||0;return{...level,shadowFilter:shadow>=2048?'soft':'pcf',id:v.preset||'custom',modelDetail:modelLevel(v,v.preset),smokeParticleBudget:Math.max(0,Math.min(1000,Number.isFinite(v.smokeParticleBudget)?v.smokeParticleBudget:Number(v.smokeParticles)>=0?Number(v.smokeParticles):({potato:12,low:32,medium:72,high:128,expert:192,ultra:256,insane:384}[source]||72))),scale:v.scale,shadowSize:v.lighting==='ambient'?0:shadow,shadowExtent:Math.min(v.distance*.4,shadow>=4096?133:shadow>=2048?95:65),environmentSize:{off:0,low:128,high:512}[v.reflections]||0,effectCap:{low:8,medium:32,high:64}[v.particles]||8,particles:{low:2,medium:5,high:9}[v.particles]||2,distance:v.distance,lighting:v.lighting,detailRadius:Math.min(level.detailRadius,Math.ceil(v.distance/128)),materialDetail:v.detail==='high'?5:level.materialDetail};}
return{presets,profiles,fields,resolve,auto,modelLevel,names:Object.keys(presets),get:id=>{const p=presets[id]||presets.medium;return{...p,modelDetail:modelLevel({},p.id)};}};});

