
/* PLATDO City: the inside of a building is built only when you go in (V11.3). Game only.
 * Houses and apartment homes already worked this way (city-apt-rooms.js). Now every other building with rooms does too.
 * The outside, the floor, the ceiling and its lights are always there; everything else inside (counters, booths, tables,
 * shelves and their stock, racks, beds, machines, displays) is built when you are inside or close to the building, and
 * taken down again once you are well away from it.
 * - Shops, restaurants, 6-7s, the diner, the marina, the airport terminal, garages, warehouses, the hangar, the relay:
 *   the city scene sorts each building's pieces as it lays them out. A piece whose middle is inside the room (below the
 *   ceiling lights) goes into a recipe here (plain numbers, nothing drawn) instead of the shared city batches.
 * - The shelter, the workshop, the first house, the casino, the shop displays, the mansion floors and the apartment
 *   lobbies hand in their own recipes or build functions.
 * - A built inside is one group of batched pieces using the city's shared shapes and materials, so building one takes a
 *   millisecond or two and needs no new shaders (warm() compiles every material a recipe uses while the City loads).
 * Nothing here is solid: the walls, counters and furniture you bump into are world boxes and stay as they are. */
(function(root){'use strict';
const RANGE=16,KEEP=26,LIFT=7;
const state=scene=>scene.insideLoader||(scene.insideLoader={items:new Map(),recipes:new Map(),loaded:new Map(),warm:[],warmed:false,builds:0,drops:0,rest:0});
/* is a piece (a batch item [x,y,z,w,h,d,...]) furniture inside the room of a building with a plain rectangular room?
 * Tall pieces (partition walls, columns) and pieces up near the ceiling (beams, trusses, hanging lamps, light strips)
 * belong to the building and stay, so it still reads right through its windows from across the street. */
function inRoom(s,q,m=.3){const x=q[0],y=q[1],z=q[2];return x>s.x-s.w/2+m&&x<s.x+s.w/2-m&&z>s.z-s.d/2+m&&z<s.z+s.d/2-m&&y>s.y+.03&&y<s.y+s.h-1.2&&q[4]<2.9;}
/* sort the pieces of batch t: those inside(q) go to the recipe batch, the rest to batch out (either may be null) */
function split(t,inside,out,keep){for(const[key,items]of t.parts)for(const q of items){const to=inside(q)?keep:out;if(!to)continue;if(!to.parts.has(key))to.parts.set(key,[]);to.parts.get(key).push(q);}if(out&&t.signs)out.signs.push(...t.signs);}
function lazy(scene){return scene.lazyInsides!==false&&root.PLATDO_EAGER_INSIDES!==true;}
/* keep a recipe (one per building and per detail level, replaced when the City is laid out again) */
function recipe(scene,id,level,batch,box){const st=state(scene);let r=st.recipes.get(id);if(!r){r={id,levels:{}};st.recipes.set(id,r);}r.levels[level]=batch;if(!st.items.has(id))register(scene,{id,box,room:true,build:()=>bakeRecipe(scene,r),drop:dropBaked});}
function bakeRecipe(scene,r){const b=scene.batch(),detail=!!scene.graphics?.materialDetail;for(const[level,batch]of Object.entries(r.levels)){if(level==='near'&&!detail)continue;for(const[key,items]of batch.parts){if(!b.parts.has(key))b.parts.set(key,[]);b.parts.get(key).push(...items);}}
 const g=new scene.T.Group();g.name='building-inside:'+r.id;scene.bake(b,g);g.updateMatrixWorld(true);scene.environment.add(g);return g;}
function dropBaked(scene,g){g.removeFromParent();g.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}
function register(scene,item){const st=state(scene);st.items.set(item.id,item);st.grid=null;if(item.batch&&st.warmed)warmBatches(scene,[item.batch]);}
/* take a building's inside down (if built) and forget it, for a building that lays itself out again */
function forget(scene,id){const st=state(scene),obj=st.loaded.get(id),it=st.items.get(id);if(obj){try{(it?.drop||dropBaked)(scene,obj);}catch(e){}st.loaded.delete(id);}st.items.delete(id);st.grid=null;}
function boxOf(s){return{x0:s.x-s.w/2,x1:s.x+s.w/2,z0:s.z-s.d/2,z1:s.z+s.d/2,y0:s.y,y1:s.y+s.h};}
/* how far a point is from a building: across the ground, and a floor or two above or below counts as far */
function away(b,x,y,z){const dx=Math.max(b.x0-x,0,x-b.x1),dz=Math.max(b.z0-z,0,z-b.z1),dy=Math.max(b.y0-LIFT-y,0,y-b.y1-LIFT);return Math.hypot(dx,dz)+dy*4;}
function update(scene,sim){
 const st=state(scene);if(!st.items.size)return;
 /* a warm-up group is drawn once (400 m under the ground), then thrown away */st.warm=st.warm.filter(g=>{if(++g.userData.age<2)return true;dropBaked(scene,g);return false;});
 const p=sim?.dronePosition||sim?.player;if(!p)return;const c=scene.camera.position;
 const dist=it=>Math.min(away(it.box,p.x,p.y??0,p.z),away(it.box,c.x,c.y,c.z)+2);
 for(const[id,obj]of st.loaded){const it=st.items.get(id);if(!it||dist(it)>(it.keep||KEEP)){try{(it?.drop||dropBaked)(scene,obj);}catch(e){}st.loaded.delete(id);st.drops++;}}
 /* a built inside may leave slower pieces (the shop mannequins) to be made one per frame; after a slow one, a frame off */
 if(st.rest>0)st.rest--;else for(const obj of st.loaded.values()){const q=obj?.userData?.pending;if(!q?.length)continue;const t=performance.now();try{q.shift()();}catch(e){scene.insideError=(scene.insideError||'')+'pending: '+(e&&e.message)+'; ';}if(performance.now()-t>8)st.rest=1;return;}
 let best=null,bd=Infinity;for(const it of st.items.values()){if(st.loaded.has(it.id))continue;const d=dist(it);if(d<(it.range||RANGE)&&d<bd){bd=d;best=it;}}
 if(best){let obj=null;try{obj=best.build(scene);}catch(e){scene.insideError=(scene.insideError||'')+best.id+': '+(e&&e.message)+'; ';}st.loaded.set(best.id,obj||new scene.T.Group());st.builds++;}}
/* while the City loads: one piece of every material any recipe uses, added for the shader compile and removed on the
 * first frame, so going into a building never waits for a shader */
function warm(scene){const st=state(scene),list=[];for(const r of st.recipes.values())list.push(...Object.values(r.levels));for(const it of st.items.values())if(it.batch)list.push(it.batch);st.warmed=true;warmBatches(scene,list);}
function warmBatches(scene,list){const st=state(scene),b=scene.batch();for(const batch of list)for(const[key,items]of batch.parts)if(items.length&&!b.parts.has(key))b.parts.set(key,[items[0]]);
 if(!b.parts.size)return;const g=new scene.T.Group();g.name='building-inside-warm';scene.bake(b,g);g.position.y=-400;g.userData.age=0;g.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});scene.scene.add(g);st.warm.push(g);}
function loaded(scene){return[...state(scene).loaded.keys()];}
function isLoaded(scene,id){const st=state(scene);return !st.items.has(id)||st.loaded.has(id);}
/* is a point (a person) inside the room of a building whose inside is not built? Such people are not drawn: a cashier
 * behind a counter that is not there, or guests sitting on chairs that are not there, would look odd through the glass */
function hides(scene,x,y,z){const st=state(scene);if(!st.grid){st.grid=new Map();for(const it of st.items.values()){if(!it.room)continue;const b=it.box;for(let i=Math.floor(b.x0/32);i<=Math.floor(b.x1/32);i++)for(let j=Math.floor(b.z0/32);j<=Math.floor(b.z1/32);j++){const k=i+','+j;if(!st.grid.has(k))st.grid.set(k,[]);st.grid.get(k).push(it);}}}
 const list=st.grid.get(Math.floor(x/32)+','+Math.floor(z/32));if(!list)return false;for(const it of list){const b=it.box;if(x>b.x0+.2&&x<b.x1-.2&&z>b.z0+.2&&z<b.z1-.2&&y>b.y0-.5&&y<b.y1)return !st.loaded.has(it.id);}return false;}
function stats(scene){const st=state(scene);let pieces=0;for(const r of st.recipes.values())for(const batch of Object.values(r.levels))for(const items of batch.parts.values())pieces+=items.length;return{buildings:st.items.size,recipes:st.recipes.size,pieces,loaded:loaded(scene),builds:st.builds,drops:st.drops};}
root.CityInside={RANGE,KEEP,inRoom,split,lazy,recipe,register,forget,boxOf,update,warm,loaded,isLoaded,hides,stats,dropBaked};
})(typeof globalThis!=='undefined'?globalThis:this);
