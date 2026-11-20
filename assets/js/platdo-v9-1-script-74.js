/* Shop displays are read-only. Models and effects use the same makers as gameplay. */
(function(root){
'use strict';
const lookup=id=>root.PlatdoPremiumCatalog.byId[id];
function options(id){
 const product=lookup(id);if(!product)return [];
 const labels=id==='CITY-08'?root.PlatdoCityFleet.paints.map(p=>p[0]):[product.name];
 return labels.map((label,variant)=>({label,variant,productId:id}));
}
function input(canvas,rotate,reset){
  const previous=canvas.style.touchAction,priorTab=canvas.getAttribute('tabindex');canvas.tabIndex=0;canvas.style.touchAction='none';
  let pointer=null,x=0,y=0;
  const down=e=>{if(pointer!==null||e.button!==0)return;pointer=e.pointerId;x=e.clientX;y=e.clientY;canvas.setPointerCapture?.(pointer);canvas.focus({preventScroll:true});};
  const move=e=>{if(e.pointerId!==pointer)return;const dx=e.clientX-x,dy=e.clientY-y;x=e.clientX;y=e.clientY;rotate(dx,dy);};
  const up=e=>{if(e.pointerId!==pointer)return;pointer=null;if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);};
  const key=e=>{const d={ArrowLeft:[-15,0],ArrowRight:[15,0],ArrowUp:[0,-12],ArrowDown:[0,12]}[e.key];if(!d&&e.key!=='Home')return;e.preventDefault();e.stopPropagation();if(d)rotate(...d);else reset();};
  const events={pointerdown:down,pointermove:move,pointerup:up,pointercancel:up,lostpointercapture:up,keydown:key};
  for(const [event,fn] of Object.entries(events))canvas.addEventListener(event,fn);
  return ()=>{for(const [event,fn] of Object.entries(events))canvas.removeEventListener(event,fn);canvas.style.touchAction=previous;if(priorTab===null)canvas.removeAttribute('tabindex');else canvas.setAttribute('tabindex',priorTab);};
}
function orbit(canvas,camera,target,redraw){
  const T=root.THREE,start=new T.Spherical().setFromVector3(camera.position.clone().sub(target)),s=start.clone();
  function update(){camera.position.setFromSpherical(s).add(target);camera.lookAt(target);redraw();}
  const dispose=input(canvas,(x,y)=>{s.theta-=x*.009;s.phi=Math.max(.1,Math.min(Math.PI*.91,s.phi-y*.009));update();},()=>{s.copy(start);update();});
  return {dispose,angle:()=>s.theta};
}
function observe(canvas,redraw){const observer=new ResizeObserver(redraw);observer.observe(canvas);return ()=>observer.disconnect();}
function poster(id){const product=lookup(id);if(!product||product.availability==='retired')return '';if(id==='CITY_MANSION_01')return root.PlatdoHomePreview.poster();return root.PlatdoShopCaptures?.posters?.[id]||'';}
function panorama(canvas,id){
  const entry=root.PlatdoShopCaptures?.views?.[id];if(!entry)throw Error('Missing activity photograph: '+id);
  const image=new Image(),ctx=canvas.getContext('2d');let angle=0,disposed=false;
  function render(){if(disposed||!image.complete||!image.naturalWidth)return;
    const w=Math.max(1,Math.round(canvas.clientWidth||480)),h=Math.max(1,Math.round(canvas.clientHeight||270));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    const n=entry.frames,i=(Math.round(angle)%n+n)%n,sw=image.width/entry.columns,sh=image.height/Math.ceil(n/entry.columns);
    const scale=Math.min(w/sw,h/sh),dw=sw*scale,dh=sh*scale;
    ctx.fillStyle='#14212b';ctx.fillRect(0,0,w,h);ctx.drawImage(image,i%entry.columns*sw,Math.floor(i/entry.columns)*sh,sw,sh,(w-dw)/2,(h-dh)/2,dw,dh);
  }
  const stopResize=observe(canvas,render),release=input(canvas,x=>{angle-=x/22;render();},()=>{angle=0;render();});image.onload=render;image.src=entry.image;render();
  return {available:true,animated:false,render,cameraAngle:()=>angle,dispose(){disposed=true;image.onload=null;stopResize();release();}};
}
function create(canvas,option){
 const id=option.productId,v=option.variant||0,T=root.THREE;
 if(!lookup(id))throw Error('This item is no longer in the shop.');
 if(id==='CITY_MANSION_01')return root.PlatdoHomePreview.create(canvas);
 if(id==='CITY-17')return panorama(canvas,id);
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false}),scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.015,100),target=new T.Vector3();
 scene.background=new T.Color('#c9d4da');scene.add(new T.HemisphereLight(0xf0f7ff,0x657077,1.65));const key=new T.DirectionalLight(0xfff1d7,2.2);key.position.set(3,7,5);scene.add(key);
 const floor=new T.Mesh(new T.PlaneGeometry(180,180),new T.MeshStandardMaterial({color:'#aebec6',roughness:.95}));floor.rotation.x=-Math.PI/2;floor.position.y=-.014;scene.add(floor);
 let model,freeModel,width=0,height=0,disposed=false;
 if(id==='CITY-08'){model=root.CityVehicleModels.create('sunrunner',{paint:(root.PlatdoCityFleet.paints[v]||root.PlatdoCityFleet.paints[0])[1]});target.set(0,.65,0);camera.position.set(3.6,1.9,4);freeModel=()=>root.CityVehicleModels.dispose(model);}
 else if(id==='DRIVE-23'){model=root.DriveScene.createCar('f1','#df322c',true,null,3);target.set(0,.45,.05);camera.position.set(3.46,1.85,4.35);freeModel=()=>root.DriveScene.disposeCar(model);}
 else{renderer.dispose();renderer.forceContextLoss();throw Error('No display model for '+id);}
 scene.add(model);camera.lookAt(target);
 function render(){if(disposed)return;const w=Math.max(1,canvas.clientWidth||640),h=Math.max(1,canvas.clientHeight||360);if(w!==width||h!==height){width=w;height=h;const size=root.Platdo?.renderSize?.(w,h)||{width:w,height:h};renderer.setSize(Math.min(1200,size.width),Math.max(1,Math.round(Math.min(1200,size.width)*h/w)),false);camera.aspect=w/h;camera.updateProjectionMatrix();}renderer.render(scene,camera);}
 const controls=orbit(canvas,camera,target,render),stopResize=observe(canvas,render);render();
 return {available:true,animated:false,render,cameraAngle:controls.angle,tryLabels:[],dispose(){if(disposed)return;disposed=true;stopResize();controls.dispose();freeModel();floor.geometry.dispose();floor.material.dispose();renderer.dispose();renderer.forceContextLoss();}};
}
root.PlatdoShopPreviews={create,options,poster,orbit};
})(window);
