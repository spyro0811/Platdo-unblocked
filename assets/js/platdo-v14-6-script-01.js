/* V7.6: every new PLATDO file starts on a fresh save. All progress the page keeps in this browser is stored under
 * this file's own build name, so a newer file never resumes a game left by an older one (an older file still finds its
 * own). The first time a newer file opens, the saves of older V7.6-or-later files are removed, because browser storage
 * is small; saves from before V7.6 are left alone. Cloud saves of a signed-in account are not affected. */
(function(root){'use strict';
 const BUILD='v14.6',NS='platdo@'+BUILD+'/',OTHER=/^platdo@v[0-9.]+\//;
 let S=null;try{S=root.localStorage;}catch(_){S=null;}
 const P=root.Storage&&root.Storage.prototype,len=P&&Object.getOwnPropertyDescriptor(P,'length');
 if(S&&P&&len&&len.get&&len.configurable&&!P.__platdoBuild){
  const get=P.getItem,set=P.setItem,del=P.removeItem,key=P.key,clear=P.clear;
  const raw=()=>{const n=len.get.call(S),out=[];for(let i=0;i<n;i++){const k=key.call(S,i);if(k!=null)out.push(k);}return out;};
  let mine=null;const list=()=>mine||(mine=raw().filter(k=>k.startsWith(NS)).map(k=>k.slice(NS.length)));
  let first=false;try{const all=raw();first=!all.some(k=>k.startsWith(NS));if(first)for(const k of all)if(OTHER.test(k))del.call(S,k);}catch(_){}
  P.getItem=function(k){return this===S?get.call(S,NS+String(k)):get.call(this,k);};
  P.setItem=function(k,v){if(this!==S)return set.call(this,k,v);mine=null;return set.call(S,NS+String(k),v);};
  P.removeItem=function(k){if(this!==S)return del.call(this,k);mine=null;return del.call(S,NS+String(k));};
  P.key=function(i){if(this!==S)return key.call(this,i);const l=list();i=Math.floor(Number(i));return i>=0&&i<l.length?l[i]:null;};
  P.clear=function(){if(this!==S)return clear.call(this);for(const k of list())del.call(S,NS+k);mine=null;};
  Object.defineProperty(P,'length',{configurable:true,enumerable:len.enumerable,get(){return this===S?list().length:len.get.call(this);}});
  Object.defineProperty(P,'__platdoBuild',{value:BUILD});
  try{const F=root.IDBFactory&&root.IDBFactory.prototype,I=root.indexedDB;if(F&&I){const open=F.open,drop=F.deleteDatabase,dbs=F.databases,mark=n=>/^platdo/.test(String(n))?NS+n:n;
   F.open=function(name,...rest){return open.call(this,mark(name),...rest);};F.deleteDatabase=function(name){return drop.call(this,mark(name));};
   if(first&&dbs)dbs.call(I).then(found=>{for(const d of found||[])if(d&&d.name&&OTHER.test(d.name)&&!d.name.startsWith(NS))drop.call(I,d.name);}).catch(()=>{});}}catch(_){}
 }
 root.PlatdoBuild={id:BUILD,namespace:NS,fresh:!!(P&&P.__platdoBuild===BUILD)};
})(window);
