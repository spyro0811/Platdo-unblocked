/* Account ownership is independent of game saves. No browser flag grants a home. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.PlatdoHomeEntitlements=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const PRODUCT='CITY_MANSION_01',ITEM='city.home.mansion',PRICE=500;
function paidSource(s){return !!s&&s.kind==='verified-purchase'&&s.productId===PRODUCT&&s.amountCents===PRICE&&s.currency==='USD'&&s.paymentStatus==='paid';}
// These sources are accepted only from account-bound, protected entitlement reads.
// Neither save data nor a browser's admin flag is an ownership authority.
function adminSource(s){return !!s&&s.kind==='admin-test'&&s.productId===PRODUCT;}
function adminGrant(record,uid){return !!uid&&record?.schema===1&&record.uid===uid&&record.kind==='admin-test'&&record.vip===true&&Array.isArray(record.itemIds)&&record.itemIds.length<=256&&new Set(record.itemIds).size===record.itemIds.length&&record.itemIds.includes(ITEM);}
function owns(record,uid){
 if(!uid||record?.schema!==1||record.uid!==uid)return false;
 const sources=record.items?.[ITEM]?.sources||record.sources?.[ITEM]||[];
 return (Array.isArray(sources)?sources:Object.values(sources)).some(s=>paidSource(s)||adminSource(s));
}
function create({identity,read,timeoutMs=8000,onChange=()=>{}}){
 let generation=0,pending=null,stopPending=null,current={state:'loading',uid:null,home:'public',continuePublic:false,error:null};
 const copy=()=>({...current});
 function emit(value){current={...current,...value};onChange(copy());return copy();}
 function getState(){const a=identity();if(current.uid!==(a.uid||null)||!a.ready)return{state:'loading',uid:a.uid||null,home:'public',continuePublic:false,error:null};return copy();}
 function interpret(result,a){
   if(!a.ready)return {state:'loading',uid:a.uid||null,home:'public',error:null};
   if(!a.permanent||!a.uid)return {state:'not-owned',uid:a.uid||null,home:'starter',continuePublic:false,error:null};
   if(result?.status==='unavailable'||result?.state==='error')throw Error(result.error||'Home ownership is unavailable. Retry or continue in a public area.');
   if(result?.status&&result.status!=='ready')throw Error('Home ownership has not finished loading. Retry or continue in a public area.');
   const record=result?.record||result;
   if(record?.schema!==1||record.uid!==a.uid||!record.items&&!record.sources)throw Error('Home ownership could not be verified for this account.');
   const owned=owns(record,a.uid);return {state:owned?'owned':'not-owned',uid:a.uid,home:owned?'mansion':'starter',continuePublic:false,error:null};
 }
 function invalidate(){generation++;stopPending?.();stopPending=null;pending=null;return emit({state:'loading',uid:identity().uid||null,home:'public',continuePublic:false,error:null});}
 function observe(result){
   const a=identity();if(!a.ready)return emit({state:'loading',uid:a.uid||null,home:'public'});
   if(result?.status?.startsWith('checking'))return emit({state:'loading',uid:a.uid||null,home:'public',error:null});
   try{return emit(interpret(result,a));}catch(e){return emit({state:'error',uid:a.uid||null,home:'public',error:e.message});}
 }
 function refresh(){
   const a=identity();if(pending&&current.uid===(a.uid||null))return pending;
   const stamp=++generation,uid=a.uid||null;
   emit({state:'loading',uid,home:'public',continuePublic:false,error:null});
   if(a.ready&&!a.permanent)return Promise.resolve(emit(interpret(null,a)));
   let timer;const expiry=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Home ownership verification timed out. Retry or continue in a public area.')),timeoutMs);stopPending=()=>{clearTimeout(timer);reject(Error('Account changed during home verification.'));};});
   const work=Promise.race([Promise.resolve().then(()=>read(uid)),expiry]).then(result=>{
     if(stamp!==generation||identity().uid!==uid)return getState();
     return emit(interpret(result,identity()));
   }).catch(e=>stamp===generation?emit({state:'error',uid,home:'public',error:e.message||'Home ownership is unavailable.'}):getState()).finally(()=>{clearTimeout(timer);if(stamp===generation){stopPending=null;pending=null;}});
   pending=work;return work;
 }
 return {getState,refresh,ready(){const state=getState();return ['owned','not-owned'].includes(state.state)?Promise.resolve(state):refresh();},invalidate,observe,choosePublic(){return emit({home:'public',continuePublic:true});}};
}
if(typeof window==='undefined')return{PRODUCT,ITEM,PRICE,paidSource,adminSource,adminGrant,owns,create};
const listeners=new Set();let manager,accountKey;
function identity(){return root.PlatdoAccount?.getAccountEligibility?.()||{ready:false,uid:null,permanent:false};}
function initialize(){if(manager)return;manager=create({identity,read:()=>root.PlatdoPremium.refresh(),onChange:s=>{for(const fn of listeners)try{fn(s);}catch{}root.dispatchEvent(new CustomEvent('platdo:homeownershipchange',{detail:s}));}});
 root.PlatdoAccount?.subscribe?.(()=>{const a=identity(),key=[a.ready,a.uid,a.permanent].join(':');if(key===accountKey)return;accountKey=key;manager.invalidate();if(a.ready)manager.refresh();});
 root.PlatdoPremium?.subscribe?.(s=>manager.observe(s));
 root.addEventListener('platdo:beforereset',()=>manager.invalidate());
}
return{PRODUCT,ITEM,PRICE,paidSource,adminSource,adminGrant,owns,create,initialize,getState(){initialize();return manager.getState();},refresh(){initialize();return manager.refresh();},ready(){initialize();return manager.ready();},choosePublic(){initialize();return manager.choosePublic();},subscribe(fn){initialize();listeners.add(fn);fn(manager.getState());return()=>listeners.delete(fn);}};
});
