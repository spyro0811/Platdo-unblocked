
/* PLATDO City personal hangars: the look (V13.2). Game only. Where everything is and what is solid: city-hangars.js.
 * - The runway (asphalt, white edge lines, centre-line dashes, threshold bars and the numbers 18 and 36 at its ends, white
 *   edge lights and green/red lights across each end), the taxiway (yellow centre line, blue edge lights), the three links
 *   between them each with a yellow holding line before the runway, the apron with a yellow lead-in line to every hangar.
 * - The hangars that stand in this room (as many as players it holds): pale ribbed walls with a blue trim, a roof, two
 *   roller doors that roll up and down as they do in the game (the number painted on them), ceiling lights, a marked
 *   parking place and the number on the floor, and over each door the plaque "HANGAR 03 - NAME" (or AVAILABLE).
 * - Drawn only within 1.6 km; the hangars are rebuilt when the room's number of hangars changes. */
(function(root){'use strict';
const HG=()=>root.CityHangars,DL=()=>root.CityDealersLook;
function numberTex(T,text,w,h,{bg='rgba(0,0,0,0)',fg='#f4f4f0',font='800',size=.8}={}){return DL().canvasTex(T,w,h,(g,W,H)=>{g.fillStyle=bg;g.fillRect(0,0,W,H);g.fillStyle=fg;g.font=font+' '+Math.round(H*size)+'px "Arial Black","Segoe UI",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,W/2,H*.54,W*.94);});}
function flat(T,group,tex,x,y,z,w,h,rotY){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,transparent:true,roughness:.8,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3,depthWrite:false}));m.rotation.set(-Math.PI/2,0,0,'YXZ');m.rotation.y=rotY||0;m.position.set(x,y,z);m.renderOrder=1;group.add(m);return m;}
function lights(T){const mk=(c,e)=>new T.MeshStandardMaterial({color:c,emissive:e,emissiveIntensity:1.6,roughness:.5});return{glowW:mk('#ffffff','#fff6dc'),glowG:mk('#7dff8a','#3dff5a'),glowR:mk('#ff7a6e','#ff3220'),glowB:mk('#7fb6ff','#2f7dff')};}
// ---- the field: runway, taxiway, links, apron ------------------------------------------------------------------------------
function field(T,world,group,mats){const H=HG(),D=DL(),B=new D.Batch(),R=H.RWY,TW=H.TWY,A=H.APRON,g=(x,z)=>world.terrainHeight?world.terrainHeight(x,z):world.groundHeight(x,z,8);
 const slab=(color,x0,x1,z0,z1,lift=.03)=>{const cx=(x0+x1)/2,cz=(z0+z1)/2,y=g(cx,cz)+.004;B.box('slab',color,cx,y,cz,x1-x0,lift,z1-z0);return y+lift;};
 const rx0=R.x-R.width/2,rx1=R.x+R.width/2,y=slab('#393c3f',rx0,rx1,R.z0,R.z1,.03),p=y+.001,W='#f2f2ee',Y='#e8c21a';
 /* runway paint */for(const x of[rx0+.9,rx1-.9])B.box('fieldPaint',W,x,p,(R.z0+R.z1)/2,.9,.005,R.z1-R.z0-2);
 for(let z=R.z0+60;z<R.z1-60;z+=50)B.box('fieldPaint',W,R.x,p,z+15,.9,.005,30);
 for(const [z0,dir] of[[R.z0+6,1],[R.z1-6,-1]])for(const s of[-1,1])for(const k of[2.7,6.3,9.9,13.5])B.box('fieldPaint',W,R.x+s*k,p,z0+dir*15,1.8,.005,30);
 /* the numbers: read the right way by a pilot landing over that end (18 heading south, 36 heading north) */
 flat(T,group,numberTex(T,'18',256,256),R.x,p+.008,R.z0+52,10,10,Math.PI);flat(T,group,numberTex(T,'36',256,256),R.x,p+.008,R.z1-52,10,10,0);
 /* runway lights */for(let z=R.z0+15;z<R.z1;z+=30)for(const x of[rx0-.6,rx1+.6])B.box('glowW','#ffffff',x,g(x,z)+.03,z,.3,.24,.3);
 for(let x=rx0+1.5;x<rx1;x+=3){B.box('glowG','#ffffff',x,g(x,R.z0)+.03,R.z0+.8,.3,.22,.3);B.box('glowR','#ffffff',x,g(x,R.z0)+.03,R.z0-.7,.3,.22,.3);B.box('glowG','#ffffff',x,g(x,R.z1)+.03,R.z1-.8,.3,.22,.3);B.box('glowR','#ffffff',x,g(x,R.z1)+.03,R.z1+.7,.3,.22,.3);}
 /* taxiway and the three links, holding lines before the runway */const tx0=TW.x-TW.width/2,tx1=TW.x+TW.width/2,ty=slab('#3d4043',tx0,tx1,TW.z0,TW.z1,.03);B.box('fieldPaint',Y,TW.x,ty+.001,(TW.z0+TW.z1)/2,.3,.005,TW.z1-TW.z0-2);
 for(const c of H.LINKS){const ly=slab('#3d4043',rx1,tx0,c-11,c+11,.029);B.box('fieldPaint',Y,(rx1+TW.x)/2,ly+.002,c,TW.x-rx1,.005,.3);
  for(const dx of[0,.6])B.box('fieldPaint',Y,rx1+8+dx,ly+.002,c,.18,.005,20);for(const dx of[1.2,1.8])for(let z=c-10;z<c+10;z+=1.6)B.box('fieldPaint',Y,rx1+8+dx,ly+.002,z+.5,.18,.005,1);
  for(let x=rx1+2;x<tx0;x+=6)for(const s of[-1,1])B.box('glowB','#ffffff',x,g(x,c)+.03,c+s*11.5,.26,.22,.26);}
 for(let z=TW.z0+10;z<TW.z1;z+=25)B.box('glowB','#ffffff',tx0-.5,g(tx0,z)+.03,z,.26,.22,.26);
 B.build(T,group,mats);}
// ---- the hangars ------------------------------------------------------------------------------------------------------------
function slatTex(T,num){return DL().canvasTex(T,256,256,(g,W,H)=>{g.fillStyle='#d9dde1';g.fillRect(0,0,W,H);g.fillStyle='#b9bfc5';for(let y=0;y<H;y+=10)g.fillRect(0,y,W,3);g.fillStyle='#2f5f8a';g.font='900 '+Math.round(H*.36)+'px "Arial Black",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(num,W/2,H*.5);});}
function hangars(T,world,group,mats){const H=HG(),D=DL(),B=new D.Batch(),s=world.hangarSet,n=s?.count||0,out=[],hw=H.HG;
 for(let i=1;i<=n;i++){const h=world.hangars[i-1];if(!h)continue;const c=h.c,y0=h.y,mx=H.midX,zl=c-hw.inW/2-hw.wall/2,zr=c+hw.inW/2+hw.wall/2,jamb=(hw.inW-hw.doorW)/2;
  for(const z of[zl,zr]){B.box('satin','#c9ced4',mx,y0+.9,z,hw.depth-.02,hw.h-.9-.02,hw.wall);B.box('matte','#55606b',mx,y0+.02,z,hw.depth+.02,.88,hw.wall+.02);}
  for(const x of[hw.front+hw.wall/2,hw.back-hw.wall/2]){for(const s2 of[-1,1])B.box('satin','#c9ced4',x,y0+.02,c+s2*(hw.doorW/2+jamb/2),hw.wall,hw.h-.02,jamb);B.box('matte','#2f5f8a',x,y0+hw.doorH,c,hw.wall+.02,hw.h-hw.doorH,hw.doorW+.02);}
  B.box('matte','#7d858d',mx,y0+hw.h,c,hw.depth+.6,.3,hw.inW+2*hw.wall+.6);B.box('matte','#2f5f8a',mx,y0+hw.h+.3,c,hw.depth+.7,.12,hw.inW+2*hw.wall+.7);
  /* inside: a light floor, the parking outline, ceiling lights */B.box('floor','#d4d6d4',mx,y0+.021,c,hw.depth-.82,.004,hw.inW-.02);
  const sp=H.spot(i);for(const [x0,x1,z0,z1] of[[sp.x-7,sp.x+7,c-9,c-8.85],[sp.x-7,sp.x+7,c+8.85,c+9],[sp.x-7,sp.x-6.85,c-9,c+9],[sp.x+6.85,sp.x+7,c-9,c+9]])B.box('paint','#e8c21a',(x0+x1)/2,y0+.026,(z0+z1)/2,x1-x0,.004,z1-z0);
  for(const x of[mx-7,mx,mx+7])for(const dz of[-5,5])B.box('glowW','#ffffff',x,y0+hw.h-.12,c+dz,2.4,.06,.8);
  /* the lead-in line from the taxiway */B.box('fieldPaint','#e8c21a',(H.APRON.x0+hw.front)/2,y0+.06,c,hw.front-H.APRON.x0-1,.005,.3);
  /* the doors (they roll up; see draw) */const mat=new T.MeshStandardMaterial({map:slatTex(T,H.pad(i)),roughness:.6,metalness:.2}),geo=new T.BoxGeometry(.25,1,hw.doorW-.04);
  const door=(x)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y0+hw.doorH/2,c);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;};
  const floorNum=flat(T,group,numberTex(T,'HANGAR '+H.pad(i),512,128,{fg:'#e8c21a',size:.7}),hw.front+4.5,y0+.03,c,10,2.5,-Math.PI/2);void floorNum;
  const plaque=(x,face)=>{const m=new T.Mesh(new T.PlaneGeometry(11,1.1),new T.MeshStandardMaterial({roughness:.6,emissive:'#ffffff',emissiveIntensity:.25}));m.position.set(x,y0+hw.doorH+.7,c);m.rotation.y=face;group.add(m);return m;};
  out.push({i,y0,front:door(hw.front+hw.wall/2),rear:door(hw.back-hw.wall/2),plaques:[plaque(hw.front-.02,-Math.PI/2),plaque(hw.back+.02,Math.PI/2)],label:''});}
 /* the apron in front of the hangars that stand (no further: the room may hold fewer players than there is room for) */if(n){const A=H.APRON,TW=H.TWY,z0=TW.z0+6,z1=Math.min(TW.z1-6,H.center(n)+hw.pitch/2+12),cx=(A.x0+A.x1)/2,cz=(z0+z1)/2,gy=world.terrainHeight?world.terrainHeight(cx,cz):world.groundHeight(cx,cz,8);B.box('slab','#a3a6a9',cx,gy+.004,cz,A.x1-A.x0,.028,z1-z0);}
 B.build(T,group,mats);return out;}
function plaqueTex(T,text){return DL().canvasTex(T,1024,102,(g,W,Hh)=>{g.fillStyle='#14324d';g.fillRect(0,0,W,Hh);g.strokeStyle='#c9d2dc';g.lineWidth=5;g.strokeRect(4,4,W-8,Hh-8);g.fillStyle='#ffffff';g.font='800 56px "Segoe UI",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,W/2,Hh*.55,W*.94);});}
// ---- the scene hooks ----------------------------------------------------------------------------------------------------------
function build(scene){const T=scene.T,world=scene.world;if(!T||!world?.hangarSet||!HG()||!DL()?.Batch)return;dispose(scene);
 const base=DL().materials(T),mats={...base,...lights(T)},g=new T.Group();/* the paved field is only centimetres above the grass and is seen from far off (from the air): its slabs and paint are drawn a little in front of the ground in depth, so they never flicker against it */mats.fieldPaint=base.paint.clone();Object.assign(mats.fieldPaint,{polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-5});g.name='hangar-field';(scene.environment||scene.scene).add(g);
 try{field(T,world,g,mats);}catch(e){scene.hangarLookError=String(e&&e.stack||e).slice(0,300);}
 scene.hangarLook={group:g,mats,count:-1,list:[],hgroup:null};}
function dispose(scene){const st=scene.hangarLook;if(!st)return;st.group.parent?.remove(st.group);st.group.traverse(o=>{o.geometry?.dispose?.();});scene.hangarLook=null;}
function draw(scene,sim){const st=scene.hangarLook,T=scene.T,world=scene.world;if(!st||!world?.hangarSet)return;const cam=scene.camera?.position;if(!cam)return;const H=HG();
 const near=Math.hypot(cam.x-(-880),cam.z-430)<1600;st.group.visible=near;if(!near)return;
 const s=world.hangarSet;if(st.count!==s.count){if(st.hgroup){st.group.remove(st.hgroup);st.hgroup.traverse(o=>o.geometry?.dispose?.());}st.hgroup=new T.Group();st.group.add(st.hgroup);try{st.list=hangars(T,world,st.hgroup,st.mats);}catch(e){scene.hangarLookError=String(e&&e.stack||e).slice(0,300);st.list=[];}st.count=s.count;}
 const hw=H.HG;for(const h of st.list){const d=s.doors[h.i]||{front:0,rear:0};for(const side of['front','rear']){const m=h[side],k=Math.max(.02,1-(d[side]||0));m.scale.y=k*(hw.doorH-.04);m.position.y=h.y0+hw.doorH-m.scale.y/2;}
  const text=H.label(world,h.i);if(text!==h.label){h.label=text;const tex=plaqueTex(T,text);for(const p of h.plaques){p.material.map?.dispose?.();p.material.map=tex;p.material.emissiveMap=tex;p.material.needsUpdate=true;}}}}
root.CityHangarsLook={build,draw,dispose};
})(typeof globalThis!=='undefined'?globalThis:this);
