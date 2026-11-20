/* One collection-wide startup gate. Progress follows completed preparation work. */
(function(global){
 'use strict';
 if(global.PlatdoLoading)return;
 const downloaded=global.__platdoDownloadComplete===true,base=downloaded?50:0;
 const state={status:'loading',progress:base,label:'Preparing your games…',stages:[],error:null,startedAt:performance.now()};
 let running=null,gameRunning=null,activeStage=null;
 const prepared=new Set(),aliases={'platdo':'legacy','jump':'legacy','field':'legacy','code':'legacy','god-core':'legacy','godcore':'legacy'},gameId=id=>aliases[id]||id;
 const providers={legacy:()=>global.PlatdoLegacy,drive:()=>global.PlatdoDrive,city:()=>global.PlatdoCity,swing:()=>global.PlatdoSwing};
 let legacyAssetsActive=false;
 let signalLegacyActivation;
 const legacyActivation=new Promise(resolve=>{signalLegacyActivation=resolve;});
 const deferredAssets=new Set();
 function deferAsset(element){
  if(legacyAssetsActive)return element;
  const proto=element instanceof HTMLImageElement?HTMLImageElement.prototype:HTMLMediaElement.prototype,property=Object.getOwnPropertyDescriptor(proto,'src');
  let source='';
  Object.defineProperty(element,'src',{configurable:true,get(){return source||property.get.call(this);},set(value){source=String(value);if(legacyAssetsActive)property.set.call(this,source);}});
  const activate=()=>{delete element.src;if(source)property.set.call(element,source);};deferredAssets.add(activate);return element;
 }
 function activateLegacyAssets(){
  signalLegacyActivation();
  legacyAssetsActive=true;for(const activate of deferredAssets)activate();deferredAssets.clear();
  for(const element of document.querySelectorAll('[data-platdo-legacy-src]')){element.src=element.dataset.platdoLegacySrc;delete element.dataset.platdoLegacySrc;}
 }
 document.documentElement.dataset.platdoLoading='true';
 const yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0));
 function showCityTrace(){
  const details=document.getElementById('platdoStartupDetails');
  if(!details)return;
  details.hidden=false;
  details.querySelector('summary').textContent='Loading details';
  if(!details.open)return;
  const diagnostics={startup:global.PlatdoStartup?.snapshot?.(),city:/^City|^Checking City|^Rendering the first City/.test(state.label)?global.PlatdoCity?.soundDiagnostics?.():undefined};
  if(diagnostics)details.querySelector('pre').textContent=JSON.stringify(diagnostics,null,2);
 }
 function paint(){
  const bar=document.getElementById('platdoStartupProgress'),value=document.getElementById('platdoStartupPercent'),label=document.getElementById('platdoStartupLabel');
  if(bar)bar.value=state.progress;
  if(value)value.textContent=Math.floor(state.progress)+'%';
  if(label)label.textContent=state.error||state.label;
  global.PlatdoStartup?.stage(state.label);
  showCityTrace();
  global.dispatchEvent(new CustomEvent('platdo:loadingprogress',{detail:{status:state.status,progress:state.progress,label:state.label}}));
 }
 function block(event){if(state.status==='ready'&&!gameRunning||event.target?.closest?.('#platdoStartup,#platdoOwnerSwitch'))return;event.preventDefault();event.stopImmediatePropagation();}
 for(const name of ['keydown','keyup','pointerdown','pointerup','click','touchstart','wheel'])global.addEventListener(name,block,{capture:true,passive:false});
 async function start(){
  if(running)return running;
  global.PlatdoStartup?.begin('Preparing collection');
  state.error=null;state.status='loading';document.getElementById('platdoStartupRetry').hidden=true;
  running=(async()=>{
   const tasks=[
    ['Restoring sign-in',async report=>{
      await global.PlatdoAccount?.prepareProgress();
      report({progress:1,label:'Save data ready'});
    }],
    ['Fonts',async report=>{await document.fonts.ready;report({progress:1,label:'Fonts ready'});} ],
    ['platdo Drive',async report=>{await global.PlatdoDrive.prepare(report);prepared.add('drive');}],
    ['Platdo City',async report=>{await global.PlatdoCity.prepare(report);prepared.add('city');}]
   ];
   for(let i=0;i<tasks.length;i++){
    const [name,prepare]=tasks[i];let stage=state.stages[i];if(!stage)state.stages[i]=stage={name,progress:0};
    activeStage=i;state.label=name;paint();
    await yieldFrame();
    await prepare(update=>{stage.progress=Math.max(stage.progress,Math.min(1,Number(update.progress)||0));stage.label=update.label||name;state.label=stage.label;state.progress=Math.max(state.progress,base+(100-base)*(i+stage.progress)/tasks.length);paint();});
    stage.progress=1;stage.ready=true;state.progress=Math.max(state.progress,base+(100-base)*(i+1)/tasks.length);paint();
   }
   state.progress=100;state.label='Ready';paint();await yieldFrame();
   state.preparedAt=performance.now();state.status='ready';state.finishedAt=performance.now();paint();
   activeStage=null;global.PlatdoStartup?.record('collection-ready');
   delete document.documentElement.dataset.platdoLoading;
   document.getElementById('platdoStartup').hidden=true;
   global.dispatchEvent(new Event('platdo:ready'));
  })().catch(error=>{
   global.PlatdoStartup?.error(error,state.label);
   state.status='error';state.error='Could not finish loading: '+(error.message||error)+'. Please retry.';running=null;paint();document.getElementById('platdoStartupRetry').hidden=false;
  });
  return running;
 }
 global.addEventListener('platdo:accountchange',event=>{
  if(activeStage!==0||state.status!=='loading')return;
  const account=event.detail||{};
  state.label=account.stage||(account.status==='connecting'?'Restoring sign-in':account.status==='error'?'Account loading needs attention':'Loading saved progress');paint();
 });
 function prepareGame(id){
  id=gameId(id);
  if(prepared.has(id)||!providers[id])return Promise.resolve();
  if(gameRunning)return gameRunning.promise.then(()=>prepareGame(id));
  const panel=document.getElementById('platdoStartup'),retry=document.getElementById('platdoStartupRetry');
  panel.hidden=false;retry.hidden=true;state.progress=0;state.error=null;state.label='Preparing '+(id==='legacy'?'arcade games':id)+'…';paint();
  const task={id,promise:null};gameRunning=task;
  task.promise=(async()=>{
   await yieldFrame();if(id==='legacy')activateLegacyAssets();await providers[id]().prepare(update=>{state.progress=Math.max(state.progress,Math.min(100,(Number(update.progress)||0)*100));state.label=update.label||state.label;paint();});
   prepared.add(id);state.progress=100;state.label='Ready';paint();await yieldFrame();panel.hidden=true;
   global.dispatchEvent(new CustomEvent('platdo:gameprepared',{detail:{id}}));
  })().catch(error=>{state.error='Could not prepare '+id+': '+(error.message||error)+'. Please retry.';paint();retry.hidden=false;retry.onclick=()=>prepareGame(id).catch(()=>{});throw error;}).finally(()=>{gameRunning=null;});
  return task.promise;
 }
 global.PlatdoLoading={get pending(){return state.status!=='ready';},get preparingGame(){return gameRunning?.id||null;},get ready(){return state.status==='ready';},get diagnostics(){return {...JSON.parse(JSON.stringify(state)),preparedGames:[...prepared],legacyAssetsActive,deferredAssets:deferredAssets.size};},whenLegacyActivated:()=>legacyActivation,createLegacyImage:()=>deferAsset(new Image()),createLegacyAudio(source){const audio=deferAsset(new Audio());audio.preload='none';if(source)audio.src=source;return audio;},isPrepared:id=>prepared.has(gameId(id))||!providers[gameId(id)],prepareGame,start,yield:yieldFrame};
 global.addEventListener('load',()=>setTimeout(start,0),{once:true});
 document.addEventListener('DOMContentLoaded',()=>{document.getElementById('platdoStartupRetry').onclick=start;document.getElementById('platdoStartupDetails')?.addEventListener('toggle',showCityTrace);paint();},{once:true});
})(window);
