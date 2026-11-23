/* The chase district is traced from the supplied November 14 layout. Units are metres.
   px outlines are retained so placement/shape tests do not depend on rendering. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlatdoChaseMap=api;})(globalThis,function(){
'use strict';
const scale=.65,origin={x:900,z:508},bounds={minX:-1350,maxX:1350,minZ:-850,maxZ:850},street=15;
const point=(x,z)=>({x:(x-origin.x)*scale,z:(z-origin.z)*scale});
const rect=(x0,z0,x1,z1)=>({...point((x0+x1)/2,(z0+z1)/2),w:(x1-x0)*scale,l:(z1-z0)*scale,source:[x0,z0,x1,z1]});
function building(id,name,type,shape,front='south',height=5){const parts=shape.map(s=>rect(...s));return {id,name,type,style:type,front,height,parts,...parts[0],seed:id.split('').reduce((s,c)=>s+c.charCodeAt(0),0)};}
const buildings=[
 building('bakery','BAKERY','bakery',[[22,12,227,190]],'south',7.6),
 building('six-seven','6 7','convenience',[[245,12,449,190]]),
 building('smoke-shop','SMOKE SHOP','smoke',[[467,12,672,190]],'south',4.7),
 building('supermarket','SUPERMARKET','supermarket',[[690,12,1339,190]],'south',7.2),
 building('strip-mall','STRIP MALL','mall',[[1358,12,1784,190],[1580,190,1784,598]],'west',5.2),
 building('apartment-one','BRICK COURT','apartment',[[22,216,227,394]],'east',13.4),
 building('mini-market-a','MINI MARKET','market-a',[[245,216,449,394]],'east',4.5),
 building('apartment-two','TERRACOTTA COURT','apartment-a',[[22,420,227,598]],'east',13.4),
 building('pizza','PIZZA','pizza',[[245,420,449,598]],'east',5.1),
 building('police','POLICE','police',[[1135,216,1562,394],[1135,394,1339,598]],'south',11),
 building('apartment-three','FOUNDRY RESIDENCES','apartment-b',[[22,623,227,802]],'east',16.4),
 building('donut','DONUTS','donut',[[245,623,449,802]],'south',5.2),
 building('surf','SURF SHOP','surf',[[467,623,672,802]],'south',6),
 building('skate','SKATE SHOP','skate',[[690,623,894,802]],'south',5),
 building('game-go','GAME GO','games',[[912,623,1116,802]],'south',5.4),
 building('toy','TOY STORE','toy',[[1135,623,1339,802]],'south',8),
 building('restaurant','RESTAURANT','restaurant',[[1358,623,1784,802]],'south',7.2),
 building('dealership','SPORTS CARS','dealership',[[22,826,672,1005]],'north',7.8),
 building('bank','BANK','bank',[[690,826,1116,1005]],'north',9),
 building('apartment-four','GABLE HOUSE','apartment-c',[[1135,826,1339,1005]],'north',10.4),
 building('apartment-five','OAK TERRACE','apartment-d',[[1358,826,1562,1005]],'north',13.4),
 building('cafe','CAFÉ','cafe',[[1580,826,1784,1005]],'north',7.3)
];
buildings.find(b=>b.id==='police').parts[1].height=4.8;
const park={id:'park',...rect(467,216,1116,598)},parking={id:'parking',...rect(1358,420,1562,598)};
// The drawing contains one labelled mini-market lot. Its second requested market
// is a distinct tenant inside the otherwise unnamed mall, without adding a parcel.
const tenants=[{id:'mini-market-b',name:'MINI MARKET',type:'market-b',building:'strip-mall',side:'south',x:point(1450,190).x,z:point(1450,190).z,width:18}];
const roads=[];
function road(id,x0,z0,x1,z1,width=street){roads.push({id,ax:x0,az:z0,bx:x1,bz:z1,width});}
function roadPixels(id,x0,z0,x1,z1,width=street){const a=point(x0,z0),b=point(x1,z1);road(id,a.x,a.z,b.x,b.z,width);}
// No roads run through a building, park, or the two L-shaped wings.
roadPixels('north-cross',8,203,1571,203);
roadPixels('south-cross',8,610.5,1797,610.5);
roadPixels('bank-street',8,814,1797,814);
roadPixels('west-middle',8,407,458,407);
roadPixels('west-street',236,0,236,814,11);
roadPixels('market-street',458,0,458,814,11);
roadPixels('supermarket-west',681,0,681,203,11);
roadPixels('skate-west',681,610.5,681,1018,11);
roadPixels('games-west',903,610.5,903,814,11);
roadPixels('police-west',1125.5,203,1125.5,1018,11);
roadPixels('parking-west',1348.5,407,1348.5,1018,11);
roadPixels('mall-west',1571,203,1571,610.5,11);
roadPixels('cafe-west',1571,814,1571,1018,11);
roadPixels('parking-north',1348.5,407,1571,407,13);
// A connected outer boulevard and long bypass loops make a 2.7 km playable town
// without inventing business sites outside the supplied plan.
const inner={left:point(0,0).x-20,right:point(1800,0).x+20,top:point(0,0).z-20,bottom:point(0,1020).z+20};
road('inner-north',inner.left,inner.top,inner.right,inner.top,24);road('inner-south',inner.left,inner.bottom,inner.right,inner.bottom,24);
road('inner-west',inner.left,inner.top,inner.left,inner.bottom,24);road('inner-east',inner.right,inner.top,inner.right,inner.bottom,24);
for(const z of [-700,700])road('outer-east-west-'+z,-1300,z,1300,z,26);
for(const x of [-1300,1300])road('outer-north-south-'+x,x,-700,x,700,26);
for(const z of [point(0,203).z,point(0,610.5).z,point(0,814).z]){road('western-link-'+z,-1300,z,inner.left,z,22);road('eastern-link-'+z,inner.right,z,1300,z,22);}
for(const x of [point(236,0).x,point(1125.5,0).x]){road('north-link-'+x,x,-700,x,inner.top,22);road('south-link-'+x,x,inner.bottom,x,700,22);}
const bank=buildings.find(b=>b.id==='bank'),donut=buildings.find(b=>b.id==='donut');
const anchors={
 bank:{door:{x:bank.x,z:bank.z-bank.l/2},car:{x:bank.x-7,z:point(0,814).z+3.5,yaw:Math.PI/2},run:[],departure:[]},
 donut:{door:{x:donut.x,z:donut.z+donut.l/2},reaction:{x:donut.x+2,z:donut.z+donut.l/2+1.5},car:{x:donut.x+8,z:point(0,814).z-3.2,yaw:Math.PI/2},run:[],departure:[]}
};
anchors.bank.run=[anchors.bank.door,{x:anchors.bank.car.x,z:anchors.bank.car.z+1.55}];
anchors.donut.run=[anchors.donut.reaction,{x:anchors.donut.car.x,z:anchors.donut.car.z+1.55}];
// Leave these route anchors under cinematic-controller ownership; all lie in
// unobstructed street/forecourt rather than a second staging location.
anchors.bank.departure=[anchors.bank.car,{x:anchors.bank.car.x+27,z:point(0,814).z+3.5,yaw:Math.PI/2}];
anchors.donut.departure=[anchors.donut.car,{x:anchors.donut.car.x+22,z:point(0,814).z+2,yaw:Math.PI/2},{x:anchors.donut.car.x+48,z:point(0,814).z+3.5,yaw:Math.PI/2}];
function nearestRoad(x,z){let best=null,distance=Infinity;for(const r of roads){const dx=r.bx-r.ax,dz=r.bz-r.az,len2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-r.ax)*dx+(z-r.az)*dz)/len2)),px=r.ax+t*dx,pz=r.az+t*dz,d=Math.hypot(x-px,z-pz);if(d<distance){distance=d;const len=Math.sqrt(len2);best={x:px,y:0,z:pz,s:t*len,tx:dx/len,tz:dz/len,nx:dz/len,nz:-dx/len,yaw:Math.atan2(dx,dz),offset:(x-px)*dz/len-(z-pz)*dx/len,width:r.width,road:r.id};}}return best;}
const colliders=buildings.flatMap(b=>b.parts.map((p,i)=>({id:b.id+':'+i,kind:'building',x:p.x,z:p.z,width:p.w,length:p.l,height:p.height||b.height})));
function isBlocked(x,z,padding=0){return colliders.some(b=>Math.abs(x-b.x)<b.width/2+padding&&Math.abs(z-b.z)<b.length/2+padding);}
return {version:1,scale,origin,bounds,street,point,buildings,park,parking,tenants,roads,inner,anchors,colliders,nearestRoad,isBlocked};
});
