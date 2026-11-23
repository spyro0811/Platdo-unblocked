/* Initial-loading diversion. Never participates in the game's readiness promise. */
(function(global){
 'use strict';
 global.PlatdoLoadingBubbles?.dispose?.();
 let active=null;
 function mount(id){
  active?.dispose();
  const host=document.getElementById(id);if(!host||host.hidden||global.PlatdoLoading?.ready)return;
  const web=id==='webPreparation',layer=document.createElement('div');layer.className='pb-bubbles';layer.setAttribute('role','group');layer.setAttribute('aria-label','Pop loading bubbles');host.append(layer);host.classList.add('pb-enabled');if(web)document.body.classList.add('pb-web-loading');
  let stopped=false,timer=null,context=null,noise=null,pops=0,sounds=0,audioError=null,nextLane=0;
  const voices=new Set(),reduced=matchMedia('(prefers-reduced-motion: reduce)'),removers=new Map();
  function remove(button){const t=removers.get(button);if(t)clearTimeout(t);removers.delete(button);button.remove();}
  function sound(){
   try{
    const Audio=global.AudioContext||global.webkitAudioContext;if(!Audio)return;
    context=context||new Audio();if(context.state!=='running')context.resume().catch(error=>{audioError=error.name;});
    if(voices.size>=6)return;
    if(!noise){noise=context.createBuffer(1,Math.ceil(context.sampleRate*.07),context.sampleRate);const a=noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);}
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=noise;filter.type='lowpass';filter.frequency.setValueAtTime(1800,context.currentTime);filter.frequency.exponentialRampToValueAtTime(180,context.currentTime+.065);gain.gain.setValueAtTime(.22,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.07);source.connect(filter).connect(gain).connect(context.destination);
    const voice={source,filter,gain};voices.add(voice);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();voices.delete(voice);};source.start();sounds++;
   }catch(error){audioError=error.name;}
  }
  function pop(event){const button=event.target.closest('.pb-bubble');if(!button||button.classList.contains('pb-popped'))return;
   pops++;sound();const transform=getComputedStyle(button).transform;const matrix=transform==='none'?null:new DOMMatrixReadOnly(transform);button.style.setProperty('--pb-pop-x',(matrix?.m41||0)+'px');button.style.setProperty('--pb-pop-y',(matrix?.m42||0)+'px');button.classList.add('pb-popped');button.setAttribute('aria-label','Popped bubble');button.disabled=true;clearTimeout(removers.get(button));removers.set(button,setTimeout(()=>remove(button),reduced.matches?0:200));
  }
  function spawn(initial=false){
   if(stopped||document.hidden||host.hidden||layer.children.length>=6)return;
   const button=document.createElement('button');button.type='button';button.className='pb-bubble';button.textContent='Click me';button.setAttribute('aria-label','Pop bubble');
   const width=innerWidth,size=width<720?56:64,narrow=width<720,duration=narrow?6500:10000;
   let x;if(reduced.matches){x=12+(nextLane++%Math.max(1,Math.min(6,Math.floor((width-24)/(size+12)))))*(size+12);if([...layer.children].some(b=>Math.abs(parseFloat(b.style.left)-x)<size)){return;}}
   else if(narrow){const lanes=Math.max(2,Math.min(6,Math.floor((width-24)/(size+18))));x=12+(width-24-size)/(lanes-1)*(nextLane++%lanes);}
   else {const span=Math.max(0,(width-440)/2-size-30);x=nextLane++%2?width-size-16-Math.random()*span:16+Math.random()*span;}
   button.style.left=x+'px';button.style.setProperty('--pb-drift',narrow?'0px':(Math.random()*12-6)+'px');button.style.setProperty('--pb-rise',(narrow?150:innerHeight+160)+'px');button.style.setProperty('--pb-duration',duration+'ms');if(initial)button.style.animationDelay='-3s';
   button.addEventListener('animationend',()=>{if(!button.classList.contains('pb-popped'))remove(button);},{once:true});layer.append(button);removers.set(button,setTimeout(()=>remove(button),duration+1000));
  }
  function resize(){for(const button of [...layer.children])remove(button);spawn(true);spawn(true);}
  function visibility(){clearInterval(timer);timer=null;if(!document.hidden&&!stopped){spawn(true);timer=setInterval(spawn,1200);}else if(context?.state==='running')context.suspend().catch(()=>{});}
  function dispose(){if(stopped)return;stopped=true;clearInterval(timer);for(const t of removers.values())clearTimeout(t);removers.clear();observer.disconnect();layer.removeEventListener('click',pop);layer.replaceChildren();layer.remove();host.classList.remove('pb-enabled');if(web)document.body.classList.remove('pb-web-loading');global.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);global.removeEventListener('pagehide',dispose);global.removeEventListener('platdo:ready',dispose);for(const v of voices){try{v.source.stop();}catch(_){}v.source.disconnect();v.filter.disconnect();v.gain.disconnect();}voices.clear();if(context&&context.state!=='closed')context.close().catch(()=>{});noise=null;}
  const observer=new MutationObserver(()=>{if(host.hidden||!host.isConnected)dispose();});observer.observe(host,{attributes:true,attributeFilter:['hidden']});
  layer.addEventListener('click',pop);global.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);global.addEventListener('pagehide',dispose,{once:true});global.addEventListener('platdo:ready',dispose,{once:true});
  active={dispose,get diagnostics(){return {active:!stopped,bubbles:layer.children.length,pops,sounds,voices:voices.size,audioState:context?.state||'not-created',audioError};}};
  spawn(true);spawn(true);timer=setInterval(spawn,1200);
 }
 global.PlatdoLoadingBubbles={mount,dispose:()=>active?.dispose(),get diagnostics(){return active?.diagnostics||{active:false,bubbles:0};}};
})(window);
