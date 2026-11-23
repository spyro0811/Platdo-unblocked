
/* PLATDO City shelter, Harborlight House: the look and the start (V10.3). Game only.
 * - The building, rooms and furniture are coloured parts drawn by the island (city-shelter.js). This adds the clear
 *   glass in the windows and showers, the lights (ceiling panels, porch lights, the lamps by the door, and a few warm
 *   room lights while you are near) and the lettering: the name over the porch, reception, dormitory, washrooms and
 *   the scooter bays.
 * - A Story game starts at the reception, with the red scooter in the first scooter bay outside. A Story player who is
 *   knocked out wakes up there again, unless they chose a home to start at in Platdo Estates.
 * - Playing alone, you can sleep in a shelter bed until morning. (Online, the server places players; see world.cjs.) */
(function(root){'use strict';
const SH=()=>root.CityShelter;
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
 p.interact=function(){if(bedNear(this)&&(t=>t<.75&&t>=.25)((((this.profile?.world?.time??0)%1)+1)%1)){/* V12.7: you can only go to sleep from 6 pm until 6 am */this.emit('notice',{message:'You can only go to sleep after 6 pm.'});return true;}if(bedNear(this)){this.profile.world.time=7/24;this.player.health=Math.max(this.player.health,100);this.dirty=true;this.emit('notice',{message:'Good morning. Breakfast is in the common room.'});return true;}return interact.call(this);};
 return true;}
// ---- the look ----------------------------------------------------------------------------------------------------------------
function plate(T,text,sub,wpx,hpx){
 const c=document.createElement('canvas');c.width=wpx;c.height=hpx;const g=c.getContext('2d');
 g.fillStyle='#2d4e3d';g.fillRect(0,0,wpx,hpx);g.strokeStyle='#d9c99a';g.lineWidth=Math.max(2,hpx*.04);g.strokeRect(g.lineWidth,g.lineWidth,wpx-2*g.lineWidth,hpx-2*g.lineWidth);
 g.fillStyle='#f3ead2';g.textAlign='center';g.textBaseline='middle';
 g.font='700 '+Math.round(hpx*(sub?.4:.5))+'px "Segoe UI",Arial,sans-serif';g.fillText(text,wpx/2,hpx*(sub?.39:.52),wpx*.9);
 if(sub){g.font='400 '+Math.round(hpx*.2)+'px "Segoe UI",Arial,sans-serif';g.globalAlpha=.9;g.fillText(sub,wpx/2,hpx*.75,wpx*.9);}
 const t=new T.CanvasTexture(c);if('colorSpace' in t&&T.SRGBColorSpace)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
function build(scene){
 install();const S=SH(),T=scene.T;if(!S||!T||!scene.world?.shelter)return;dispose(scene);
 const k=S.pieces(),group=new T.Group();group.name='shelter-look';
 const glassM=new T.MeshPhysicalMaterial({color:'#b9d3dc',roughness:.08,metalness:.1,transparent:true,opacity:.26,depthWrite:false,side:T.DoubleSide});
 for(const g of k.glass){const w=g.axis==='z'?g.x1-g.x0:g.z1-g.z0,h=g.y1-g.y0,m=new T.Mesh(new T.PlaneGeometry(w,h),glassM);m.position.set((g.x0+g.x1)/2,(g.y0+g.y1)/2,(g.z0+g.z1)/2);if(g.axis==='x')m.rotation.y=Math.PI/2;m.renderOrder=2;group.add(m);}
 const panelM=new T.MeshStandardMaterial({color:'#fffaf0',emissive:'#fff1d6',emissiveIntensity:1.4,roughness:.6}),lampM=new T.MeshStandardMaterial({color:'#fff2d0',emissive:'#ffd98f',emissiveIntensity:1.8,roughness:.5});
 const inst=(list,mat)=>{if(!list.length)return;const im=new T.InstancedMesh(new T.BoxGeometry(1,1,1),mat,list.length),m=new T.Matrix4();list.forEach((l,i)=>{m.makeScale(l.w,l.h,l.d).setPosition(l.x,l.y,l.z);im.setMatrixAt(i,m);});im.instanceMatrix.needsUpdate=true;group.add(im);};
 inst(k.lights.filter(l=>l.kind==='panel'),panelM);inst(k.lights.filter(l=>l.kind==='lamp'),lampM);
 const textures=[];for(const s of k.signs){const px=Math.round(220*s.h),tex=plate(T,s.text,s.sub,Math.round(px*s.w/s.h),px);textures.push(tex);const m=new T.Mesh(new T.PlaneGeometry(s.w,s.h),new T.MeshBasicMaterial({map:tex}));m.position.set(s.x,s.y,s.z);m.rotation.y=s.ry||0;group.add(m);}
 const lights=new T.Group();lights.name='shelter-lights';for(const [x,z,i] of [[0,5,.9],[8,6,.8],[4,17,.9],[-8.5,15,.7],[-8.5,4,.7]]){const l=new T.PointLight('#ffe9cc',i,13,2);l.position.set(S.CX+x,S.CEIL-.5,S.ZF+z);lights.add(l);}
 scene.scene.add(group);scene.shelterLook={group,lights,lightsOn:false,textures};}
function draw(scene){
 const a=scene.shelterLook,S=SH(),sim=root.PlatdoCity?.sim;if(!a||!S||!sim?.player)return;const p=sim.player;
 const want=Math.hypot(p.x-S.CX,p.z-(S.ZF+S.D/2))<34;if(want!==a.lightsOn){if(want)scene.scene.add(a.lights);else a.lights.removeFromParent();a.lightsOn=want;}}
function dispose(scene){const a=scene.shelterLook;if(!a)return;a.group.removeFromParent();a.lights.removeFromParent();a.group.traverse(o=>{if(o.geometry)o.geometry.dispose();});for(const t of a.textures)t.dispose();scene.shelterLook=null;}
install();
root.CityShelterLook={build,draw,dispose,install,storyStart,park,bedNear,home};
})(typeof globalThis!=='undefined'?globalThis:this);
