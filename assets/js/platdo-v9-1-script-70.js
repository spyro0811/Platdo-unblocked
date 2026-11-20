/* Account-owned Sunrunner paint presets. Vehicle saves never grant access. */
(function(root){
'use strict';
const paints=[['Sunburst',0xe79e36],['Lagoon',0x288982]];
const premium=root.PlatdoPremium;
let uid=null,canBuggy=false,choice={paint:0},revision=0,dialog=null,stopped=false;
function prefs(){return root.Platdo?.storage('premium');}
function refresh(){
  const user=premium.getState().uid,identity=user?user+(root.PlatdoCity?.progressSuffix||''):null;
  if(identity!==uid){
    uid=identity;choice={paint:0};
    if(uid){try{const saved=JSON.parse(prefs()?.get('city-fleet:'+uid)||'{}');
      if(paints[saved.paint])choice.paint=saved.paint;
    }catch{}}
  }
  canBuggy=premium.access('CITY-08').allowed;revision++;if(root.PlatdoCity?.sim)reconcile(root.PlatdoCity.sim);
  if(dialog&&!canBuggy)close();
}
function buggy(){return canBuggy?{id:'premium-sunrunner',typeId:'sunrunner',customization:{paint:paints[choice.paint][1]}}:null;}
function reconcile(sim){
  if(sim._premiumFleetRevision===revision)return;sim._premiumFleetRevision=revision;
  const cars=sim.vehicles?.filter(v=>v.typeId==='sunrunner');if(!cars?.length)return;
  if(canBuggy){for(const car of cars){car.customization??={};car.customization.paint=paints[choice.paint][1];}return;}
  if(cars.some(car=>sim.player.vehicleId===car.id||sim.player.transition?.vehicleId===car.id))sim.returnToCity();
  sim.vehicles=sim.vehicles.filter(v=>v.typeId!=='sunrunner');
}
function close(){if(!dialog)return;const d=dialog;dialog=null;d.preview?.dispose();cancelAnimationFrame(d.frame);d.element.remove();root.dispatchEvent(new CustomEvent('platdo:premiumactivitychange',{detail:{active:false,id:d.product}}));}
function open(){
 const product='CITY-08';if(!premium.access(product).allowed)throw Error('Ownership could not be verified.');
 close();const element=document.createElement('dialog');element.className='premium-home-panel';element.setAttribute('aria-label','Sunrunner Buggy');
 function add(tag,text){const item=document.createElement(tag);if(text)item.textContent=text;element.append(item);return item;}
 add('h2','Sunrunner Buggy');const canvas=add('canvas'),select=add('select');select.setAttribute('aria-label','Finish');
 for(const [i,p] of paints.entries())select.add(new Option(p[0],String(i)));select.selectedIndex=choice.paint;
 add('p','Deliver the buggy from your City phone under Motors → My Vehicles.');
 const apply=add('button','Apply finish'),exit=add('button','Close'),message=add('p');
 const d=dialog={element,product,preview:null,frame:0};function draw(){d.preview?.dispose();d.preview=root.PlatdoShopPreviews.create(canvas,{productId:product,variant:select.selectedIndex});}
 apply.onclick=()=>{if(stopped||!uid||!premium.access(product).allowed)return close();choice.paint=select.selectedIndex;prefs()?.set('city-fleet:'+uid,JSON.stringify(choice));revision++;if(root.PlatdoCity?.sim)reconcile(root.PlatdoCity.sim);message.textContent=paints[choice.paint][0]+' equipped.';};
 select.onchange=draw;exit.onclick=close;element.oncancel=e=>{e.preventDefault();close();};document.body.append(element);element.showModal();draw();
 let last=-1000;function tick(t){if(dialog!==d)return;d.frame=requestAnimationFrame(tick);if(!document.hidden&&t-last>=1000/(root.Platdo?.frameRate||60)){d.preview.render(t/1000);last=t;}}tick(0);
 root.dispatchEvent(new CustomEvent('platdo:premiumactivitychange',{detail:{active:true,id:product}}));return{close};
}
root.PlatdoCityFleet={buggy,reconcile,paints};
premium.registerAdapter('CITY-08',{open,actionLabel:'Choose finish',description:'Includes two paint presets and City phone delivery.'});
premium.subscribe(refresh);root.addEventListener('platdo:citymodechange',refresh);root.addEventListener('platdo:beforereset',()=>{stopped=true;close();});
})(window);
