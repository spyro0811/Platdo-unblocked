/* Central local/cloud save coordinator. Firebase is injected by account-manager.js. */
(function(root){
  'use strict';
  const META='platdo:cloud-meta:v1', REGISTRY='platdo:registered-save-keys:v1';
  const KNOWN=['platdo-jump','field','god-core','platdo-drive','platdo-swing','platdo-city','avatar','main-settings','main-controls','premium'];
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  function safeJSON(v,fallback){try{return JSON.parse(v);}catch(_){return fallback;}}
  function enumerate(storage){const result={};for(let i=0;i<storage.length;i++){const k=storage.key(i);if(k)result[k]=storage.getItem(k);}return result;}
  const initial=(()=>{try{return enumerate(root.localStorage);}catch(_){return {};}})();
  // Mini-games initialize before the hub. Withhold their writes while Firebase resolves
  // the owner. An authenticated restore uses the original methods to apply verified data.
  const nativeSet=root.Storage?.prototype.setItem,nativeRemove=root.Storage?.prototype.removeItem;
  let holding=!!nativeSet&&/^https?:$/.test(root.location?.protocol||'');
  const legacy=new Set(safeJSON(initial[REGISTRY],[])||[]);
  const isGameKey=k=>k.startsWith('platdo:game:')||k==='platdo:settings:v1'||/^(platdo_|platformer_)/.test(k)||legacy.has(k);
  if(holding){
    for(const [method,original] of [['setItem',nativeSet],['removeItem',nativeRemove]]){
      root.Storage.prototype[method]=function(key,...args){
        if(this===root.localStorage&&holding&&isGameKey(String(key)))return;
        return original.call(this,key,...args);
      };
    }
  }
  function canonical(value){return JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))));}
  async function fingerprint(value){const bytes=new TextEncoder().encode(typeof value==='string'?value:canonical(value));const digest=await root.crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('');}
  function friendly(error){const code=error?.code||'';if(/permission-denied/.test(code))return 'Cloud access was denied. Your local progress is safe. Check the Firebase security rules.';if(/unavailable|network|offline/.test(code)||root.navigator?.onLine===false)return 'Offline — progress is saved on this device and will sync when the connection returns.';return error?.message||'Cloud save could not finish. Your local progress is safe.';}
  function error(code,message){return Object.assign(new Error(message),{code});}
  const diagnostic=(event,details={})=>root.PlatdoStartup?.record?.(event,details);
  function deadline(work,label,ms=15000){
    return new Promise((resolve,reject)=>{let settled=false;const finish=(fn,value)=>{if(settled)return;settled=true;clearTimeout(timer);fn(value);};const timer=setTimeout(()=>finish(reject,error('storage/timeout',label+' timed out. Your saved progress has not been replaced. Retry account loading.')),ms);Promise.resolve().then(work).then(v=>finish(resolve,v),e=>finish(reject,e));});
  }
  function validId(id){return typeof id==='string'&&/^[a-z0-9-]{1,100}$/.test(id);}
  // Only the owner vault contains device backups. It is never uploaded as game data.
  function createVault({timeoutMs=12000}={}){
    const DB='platdo-account-vault-v1';let opening;
    function open(){if(opening)return opening;const pending=new Promise((resolve,reject)=>{if(!root.indexedDB)return reject(error('storage/unavailable','This browser cannot make an account backup. Sign-in cannot switch saved progress safely.'));let done=false,q;const finish=(fn,value)=>{if(done)return;done=true;clearTimeout(timer);fn(value);};const timer=setTimeout(()=>finish(reject,error('storage/timeout','Opening the account backup timed out. Retry account loading.')),timeoutMs);try{q=root.indexedDB.open(DB,1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('records'))q.result.createObjectStore('records');};q.onsuccess=()=>{if(done){q.result.close();return;}const db=q.result;db.onversionchange=()=>{db.close();opening=null;};finish(resolve,db);};q.onerror=()=>finish(reject,q.error||error('storage/unavailable','The account backup could not open.'));q.onblocked=()=>finish(reject,error('storage/blocked','Close other PLATDO tabs, then retry account loading. The account backup is blocked.'));}catch(e){finish(reject,e);}});opening=pending;pending.catch(()=>{if(opening===pending)opening=null;});return pending;}
    async function run(mode,key,value){const db=await open();return new Promise((resolve,reject)=>{let done=false,tx,result;const finish=(fn,value)=>{if(done)return;done=true;clearTimeout(timer);fn(value);};const timer=setTimeout(()=>{try{tx?.abort();}catch(_){}finish(reject,error('storage/timeout','The account backup transaction timed out. Retry account loading.'));},timeoutMs);try{tx=db.transaction('records',mode);const s=tx.objectStore('records'),q=mode==='readonly'?s.get(key):value===undefined?s.delete(key):s.put(value,key);q.onsuccess=()=>result=q.result;tx.oncomplete=()=>finish(resolve,result);tx.onerror=()=>finish(reject,tx.error||error('storage/unavailable','The account backup could not be saved.'));tx.onabort=()=>finish(reject,tx.error||error('storage/cancelled','The account backup was interrupted.'));}catch(e){finish(reject,e);}});}
    return {get:k=>run('readonly',k),put:(k,v)=>run('readwrite',k,v),remove:k=>run('readwrite',k),database:DB};
  }
  function create(options={}){
    const storage=options.storage||root.localStorage,vault=options.vault||createVault(),groups=new Map(),listeners=new Set();
    const restoreSet=(k,v)=>nativeSet&&storage===root.localStorage?nativeSet.call(storage,k,v):storage.setItem(k,v);
    const restoreRemove=k=>nativeRemove&&storage===root.localStorage?nativeRemove.call(storage,k):storage.removeItem(k);
    let meta=safeJSON(storage.getItem(META),null)||{schema:1,owner:'guest',accounts:{},pendingResets:{}};
    if(meta.schema!==1||!meta.accounts||!meta.pendingResets)meta={schema:1,owner:'guest',accounts:{},pendingResets:{}};
    let transport=options.transport||null,uid=null,generation=0,timer=null,retryTimer=null,retryDelay=15000,retries=0,firstDirtyAt=0,chain=Promise.resolve(),transition=null,connectPending=null,connectUser=null,stopped=false,applying=false,ready=false;
    const pending=new Set(),requestTimeout=options.requestTimeoutMs??15000,storageTimeout=options.storageTimeoutMs??15000,maxRetries=options.maxRetries??2;
    function cancelPending(reason='Account loading was cancelled.',cause){generation++;ready=false;clearTimeout(timer);clearTimeout(retryTimer);for(const cancel of [...pending])cancel(cause||error('save/cancelled',reason));connectPending=null;transition=null;chain=Promise.resolve();}
    function current(token,user){if(stopped||token!==generation||uid!==user)throw error('save/cancelled','The account or loading attempt changed. The earlier result was ignored.');}
    function bounded(work,label,token=generation,user=uid,ms=requestTimeout){
      current(token,user);diagnostic('account-operation',{stage:label});
      return new Promise((resolve,reject)=>{let done=false;const finish=(fn,value)=>{if(done)return;done=true;clearTimeout(expiry);pending.delete(cancel);fn(value);},cancel=e=>finish(reject,e);pending.add(cancel);const expiry=setTimeout(()=>{const e=error('save/timeout',label+' timed out. Your saved progress is safe. Retry account loading.');diagnostic('account-operation-timeout',{stage:label,code:e.code});cancelPending(e.message,e);},ms);Promise.resolve().then(()=>{current(token,user);return work();}).then(value=>{try{current(token,user);finish(resolve,value);}catch(e){finish(reject,e);}},e=>finish(reject,e));});
    }
    const context=(token,user)=>({assertCurrent:()=>current(token,user)});
    const readRemote=(user,id,token=generation)=>bounded(()=>transport.read(user,id,context(token,user)),'Loading saved progress ('+id+')',token,user);
    const state={status:'local',lastSynced:null,error:null,conflicts:[],pendingReset:false};
    const boot=options.initial||initial;let bootHadProgress=false;
    const signals=new Map(), dirty=new Set(), handles=[];let previousSet,previousRemove;
    const notify=()=>{state.pendingReset=!!(uid&&meta.pendingResets[uid]?.length);for(const fn of listeners)try{fn({...state,conflicts:[...state.conflicts]});}catch(_){}};
    const persist=()=>storage.setItem(META,JSON.stringify(meta));
    const names=id=>groups.get(id)?.name||({'field':'Code Platdo','god-core':'God Core','main-settings':'Main settings','main-controls':'Controls','avatar':'Shared character'})[id]||id;
    function register(id,name=id,keys=[]){if(!validId(id))throw Error('Invalid save namespace.');const entry=groups.get(id)||{name,keys:new Set()};entry.name=name||entry.name;for(const key of keys)if(typeof key==='string'&&!key.startsWith('firebase:')&&key!==META&&key!==REGISTRY)entry.keys.add(key);groups.set(id,entry);}
    KNOWN.forEach(id=>register(id));
    function groupForKey(key){if(typeof key!=='string'||key===META||key===REGISTRY)return null;const m=/^platdo:game:([a-z0-9-]+):/.exec(key);if(m){if(!groups.has(m[1]))register(m[1]);return m[1];}for(const[id,g]of groups)if(g.keys.has(key))return id;if(key==='platdo:settings:v1')return 'main-settings';return null;}
    function discover(){const legacy=safeJSON(storage.getItem(REGISTRY),[]);for(const key of Array.isArray(legacy)?legacy:[])if(!groupForKey(key))groups.get('platdo-jump').keys.add(key);for(const k of Object.keys(enumerate(storage)))groupForKey(k);}
    function snapshot(id,source){discover();const out={};for(const[k,v]of Object.entries(source||enumerate(storage)))if(groupForKey(k)===id&&typeof v==='string')out[k]=v;return out;}
    function snapshotAll(){discover();return Object.fromEntries([...groups.keys()].map(id=>[id,snapshot(id)]));}
    function validate(id,data){if(!validId(id)||!data||Object.getPrototypeOf(data)!==Object.prototype||Object.keys(data).length>4000)throw error('save/invalid','The cloud save has an unsupported format. Local progress was preserved.');for(const[k,v]of Object.entries(data)){if(groupForKey(k)!==id||typeof v!=='string'||new TextEncoder().encode(v).byteLength>32*1024*1024)throw error('save/invalid','The cloud save contains invalid data. Local progress was preserved.');if((v.startsWith('{')||v.startsWith('['))&&safeJSON(v,undefined)===undefined)throw error('save/invalid','The cloud save contains damaged JSON. Local progress was preserved.');}return data;}
    function account(){return meta.accounts[uid]||(meta.accounts[uid]={groups:{},lastSynced:null});}
    function staleTab(){
      const live=safeJSON(storage.getItem(META),null);
      return !!live&&(live.owner!==meta.owner||live.restoreEpoch!==meta.restoreEpoch);
    }
    function freezeStaleTab(){
      if(stopped)return;cancelPending('Another tab restored saved progress.');stopped=true;
      state.status='error';state.error='Another PLATDO tab changed the active saved progress. Refresh this tab before continuing.';notify();diagnostic('account-stale-tab',{reason:'another-tab-restored-progress'});Promise.resolve(options.onStale?.({reason:'another-tab-restored-progress',error:state.error})).catch(()=>{});
    }
    function active(token,user){if(staleTab())freezeStaleTab();if(stopped||applying||!ready||meta.owner!==user||token!==generation||uid!==user)throw error('save/cancelled','The account or save changed. The previous operation was cancelled.');}
    function queue(fn){const next=chain.catch(()=>{}).then(fn);chain=next;return next;}
    function schedule(){if(!uid||!ready||stopped||applying)return;clearTimeout(timer);if(!firstDirtyAt)firstDirtyAt=Date.now();const delay=Math.min(options.debounceMs??6000,Math.max(0,30000-(Date.now()-firstDirtyAt)));timer=setTimeout(()=>{firstDirtyAt=0;sync().catch(()=>{});},delay);}
    function mark(key){const id=groupForKey(key);if(id&&!applying){dirty.add(id);if(uid){if(state.status!=='pending'){state.status='pending';notify();}schedule();}}}
    const mediaPrefix=owner=>owner==='guest'?'guest:':'account:'+owner+':';
    function mediaBelongs(record,owner){return typeof record?.owner==='string'&&(record.owner.startsWith(mediaPrefix(owner))||owner==='guest'&&['story','sandbox'].includes(record.owner));}
    async function mediaOperation(mode,work){const db=await deadline(()=>root.CityPhoneMedia.open(),'Opening phone media',storageTimeout);return new Promise((resolve,reject)=>{let done=false,tx,result;const finish=(fn,value)=>{if(done)return;done=true;clearTimeout(expiry);fn(value);};const expiry=setTimeout(()=>{try{tx?.abort();}catch(_){}finish(reject,error('storage/timeout','Reading phone media took too long. Retry account loading.'));},storageTimeout);try{tx=db.transaction('media',mode);work(tx.objectStore('media'),value=>result=value);tx.oncomplete=()=>finish(resolve,result);tx.onerror=()=>finish(reject,tx.error||error('storage/unavailable','Phone media could not be restored.'));tx.onabort=()=>finish(reject,tx.error||error('storage/cancelled','Phone media restoration was interrupted.'));}catch(e){finish(reject,e);}});}
    async function captureMedia(owner){if(options.captureMedia)return options.captureMedia(owner);if(!root.CityPhoneMedia)return [];return mediaOperation('readonly',(store,finish)=>{const records=[],cursor=store.openCursor();cursor.onsuccess=()=>{const row=cursor.result;if(!row){finish(records);return;}if(mediaBelongs(row.value,owner))records.push(row.value);row.continue();};});}
    async function restoreMedia(records,owner){if(options.restoreMedia)return options.restoreMedia(records,owner);if(!root.CityPhoneMedia||!records?.length)return;const accepted=records.filter(record=>mediaBelongs(record,owner)||['story','sandbox'].includes(record?.owner)).map(record=>({...record,owner:['story','sandbox'].includes(record.owner)?mediaPrefix(owner)+record.owner:record.owner}));if(!accepted.length)return;
      // Phone media already carries account ownership. Merge legacy backups without
      // deleting other owners' blobs or overwriting newer media on this device.
      await mediaOperation('readwrite',store=>{for(const record of accepted){const q=store.get(record.id);q.onsuccess=()=>{if(!q.result)store.put(record);};}});
    }
    async function backup(owner=meta.owner,token=generation,user=uid){const groups=snapshotAll(),media=await bounded(()=>captureMedia(owner),'Backing up phone media',token,user,storageTimeout);const record={schema:1,owner,savedAt:Date.now(),groups,media};await bounded(()=>vault.put('owner:'+owner,record),'Backing up saved progress',token,user,storageTimeout);return record;}
    async function safeApply(replacements,{owner=meta.owner,media,reason='cloud',expected}={}){
      const token=generation,user=uid;current(token,user);
      if(options.canApply&&!options.canApply())throw error('save/menu-required','Return to the main menu to load cloud progress safely.');
      for(const[id,data]of Object.entries(replacements))validate(id,data);
      const before=await backup(meta.owner,token,user);await bounded(()=>vault.put('recovery:'+meta.owner,before),'Saving recovery backup',token,user,storageTimeout);
      const unchanged=()=>!expected||Object.entries(expected).every(([id,value])=>canonical(snapshot(id))===value);
      if(!unchanged())throw error('save/conflict','Local progress changed while cloud data was loading. Sync again to review the latest versions.');
      if(staleTab()){freezeStaleTab();throw error('save/cancelled','Another tab is already loading progress.');}
      const previousMeta=JSON.parse(JSON.stringify(meta));applying=true;ready=false;clearTimeout(timer);
      let mutated=false;
      try{
        if(media!==undefined)await bounded(()=>restoreMedia(media,owner),'Restoring phone media',token,user,storageTimeout);
        await bounded(()=>options.beforeApply?.({reason,groups:Object.keys(replacements),owner}),'Preparing saved progress',token,user,storageTimeout);
        current(token,user);
        if(!unchanged())throw error('save/conflict','Local progress changed during the restore. It has been preserved.');
        mutated=true;
        meta.restoreEpoch=root.crypto.randomUUID();persist();
        for(const[id,data]of Object.entries(replacements)){for(const key of Object.keys(snapshot(id)))if(!own(data,key))restoreRemove(key);for(const[k,v]of Object.entries(data))restoreSet(k,v);}
        meta.owner=owner;persist();
      }catch(e){let rollbackError=null;try{if(mutated){for(const[id,data]of Object.entries(before.groups)){for(const k of Object.keys(snapshot(id)))if(!own(data,k))restoreRemove(k);for(const[k,v]of Object.entries(data))restoreSet(k,v);}meta=previousMeta;persist();}}catch(failure){rollbackError=failure;}finally{applying=false;ready=false;state.status='error';state.error=rollbackError?'Progress restoration failed. A recovery backup was kept; do not start a new save.':friendly(e);diagnostic('account-restore-failed',{stage:'Restoring saved progress',code:e.code||e.name||'save/error',reason:rollbackError?'rollback-incomplete':'restore-rolled-back'});notify();try{await options.onApplyError?.({reason:'restore-rolled-back',error:state.error,code:e.code||e.name});}catch(_){}}throw e;}
      state.status=options.afterApply?'reloading':'saved';notify();diagnostic('account-restore-committed',{reason});
      if(options.afterApply){try{await options.afterApply({reason});}catch(e){state.status='error';state.error=friendly(e);notify();try{await options.onApplyError?.({reason:'restore-restart-failed',error:state.error,code:e.code||e.name});}catch(_){}throw e;}}
      else{applying=false;ready=true;}
      return true;
    }
    async function switchOwner(user){
      const token=generation;current(token,user);
      const wanted=user||'guest';if(meta.owner===wanted)return false;
      const saved=await bounded(()=>vault.get('owner:'+wanted),'Loading account backup',token,user,storageTimeout);const next={};for(const id of groups.keys())next[id]=saved?.groups?.[id]||{};
      if(user&&!saved){
        const ownerAtStart=meta.owner;
        if(!transport)throw error('save/unavailable','Cloud saving is not connected.');
        const priority=['main-settings','main-controls','avatar','platdo-city','platdo-drive'],ids=[...priority.filter(id=>groups.has(id)),...[...groups.keys()].filter(id=>!priority.includes(id))];
        for(const id of ids){const remote=await readRemote(user,id,token);current(token,user);if(meta.owner!==ownerAtStart)throw error('save/cancelled','Account changed while loading progress.');if(remote)next[id]=validate(id,remote.data);}
      }
      current(token,user);
      // Account B must never inherit account A's in-memory or disk state.
      await safeApply(next,{owner:wanted,media:saved?.media||[],reason:'account-switch'});return true;
    }
    function describe(id,data,remote){let value;for(const key of Object.keys(data)){const parsed=safeJSON(data[key],null);if(parsed&&typeof parsed==='object'&&(key.endsWith(':profile')||key==='platdo_full_save_v1')){value=parsed;break;}}
      const result={name:names(id),entries:Object.keys(data).length,updatedAt:remote?.updatedAt||null};if(value){const money=value.money??value.credits??value.wallet??value.score;if(Number.isFinite(money))result.money=money;const level=value.maxUnlockedLevel??value.level;if(Number.isFinite(level))result.level=level;}return result;
    }
    function conflict(id,local,remote){const entry={id,name:names(id),local:describe(id,local),cloud:describe(id,remote.data,remote),remoteRevision:remote.revision};state.conflicts=state.conflicts.filter(c=>c.id!==id).concat(entry);}
    async function readAndSync(token,user,{only,resolve,loadAll=false}={}){
      active(token,user);if(!transport)throw error('save/unavailable','Cloud saving is not connected.');
      const resets=meta.pendingResets[user]||[];
      if(resets.length){for(const id of resets){active(token,user);await bounded(()=>transport.erase(user,id,context(token,user)),'Applying saved reset',token,user);active(token,user);meta.pendingResets[user]=meta.pendingResets[user].filter(v=>v!==id);delete account().groups[id];persist();}}
      const replacements={},expected={},acc=JSON.parse(JSON.stringify(account()));let wrote=false;
      for(const id of only||[...groups.keys()]){
        active(token,user);let local=snapshot(id),hash=await fingerprint(local);const base=acc.groups[id],remote=await readRemote(user,id,token);active(token,user);
        if(remote)validate(id,remote.data);
        const remoteHash=remote?.hash||await fingerprint(remote?.data||{}),latest=snapshot(id);
        if(canonical(latest)!==canonical(local)){local=latest;hash=await fingerprint(local);dirty.add(id);}
        const localEmpty=Object.keys(local).length===0;
        if(loadAll){if(remote||base?.revision){acc.groups[id]={revision:remote?.revision||null,hash:remoteHash};if(remoteHash!==hash){replacements[id]=remote?.data||{};expected[id]=canonical(local);}state.conflicts=state.conflicts.filter(c=>c.id!==id);}continue;}
        if(resolve?.[id]==='cloud'){if(!remote)throw error('save/conflict','The cloud save changed. Sync again before choosing a version.');replacements[id]=remote.data;expected[id]=canonical(local);acc.groups[id]={revision:remote.revision,hash:remoteHash};state.conflicts=state.conflicts.filter(c=>c.id!==id);continue;}
        if(remote&&remoteHash===hash){acc.groups[id]={revision:remote.revision,hash};state.conflicts=state.conflicts.filter(c=>c.id!==id);dirty.delete(id);continue;}
        if(resolve?.[id]==='local'){
          if((signals.get(id)?.revision??null)!==(remote?.revision??null))throw error('save/conflict','The cloud save changed again. Review the refreshed versions before replacing it.');
        }else if(remote){
          const localUnchanged=base?.hash===hash;
          if(localUnchanged||(!base&&!bootHadProgress&&!dirty.has(id)&&meta.owner===user)||(localEmpty&&!dirty.has(id))){replacements[id]=remote.data;expected[id]=canonical(local);acc.groups[id]={revision:remote.revision,hash:remoteHash};continue;}
          if(!base||base.revision!==remote.revision){signals.set(id,remote);conflict(id,local,remote);continue;}
        }else if(base?.revision&&!localEmpty){
          // A missing previously-existing manifest is a cloud deletion, not permission to resurrect it.
          signals.set(id,{revision:null,data:{}});conflict(id,local,{revision:null,data:{},updatedAt:null});continue;
        }
        if(localEmpty&&!remote){acc.groups[id]={revision:null,hash};dirty.delete(id);continue;}
        active(token,user);const result=await bounded(()=>transport.write(user,id,{schema:1,data:local,hash,expectedRevision:remote?.revision||null,clientUpdatedAt:Date.now()},context(token,user)),'Saving progress ('+id+')',token,user);active(token,user);
        acc.groups[id]={revision:result.revision,hash};state.conflicts=state.conflicts.filter(c=>c.id!==id);if(canonical(snapshot(id))===canonical(local))dirty.delete(id);else dirty.add(id);wrote=true;
      }
      active(token,user);
      if(Object.keys(replacements).length&&options.canApply&&!options.canApply())throw error('save/menu-required','Return to the main menu to load cloud progress safely.');
      acc.lastSynced=Date.now();state.lastSynced=acc.lastSynced;const previous=meta.accounts[user];meta.accounts[user]=acc;
      if(Object.keys(replacements).length){try{await safeApply(replacements,{reason:'cloud-load',expected});}catch(e){meta.accounts[user]=previous;persist();throw e;}return;}
      persist();
      state.status=state.conflicts.length?'conflict':dirty.size?'pending':'saved';state.error=null;notify();if(dirty.size&&!state.conflicts.length)schedule();return {wrote,conflicts:state.conflicts.length};
    }
    function sync(params={}){const queuedToken=generation;return queue(async()=>{
      if(queuedToken!==generation||!uid||stopped||applying)return false;
      clearTimeout(timer);clearTimeout(retryTimer);firstDirtyAt=0;state.status='syncing';state.error=null;notify();
      try{if(transition)await transition;if(!ready||meta.owner!==uid){if(await switchOwner(uid))return false;ready=true;}if(applying)return false;const result=await readAndSync(generation,uid,params);retryDelay=15000;retries=0;return result;}
      catch(e){if(e.code==='save/cancelled')return false;state.status=e.code==='save/menu-required'?'awaiting-menu':root.navigator?.onLine===false||/unavailable|network/.test(e.code||'')?'offline':'error';state.error=friendly(e);notify();if(state.status==='offline'&&!stopped&&retries++<maxRetries){retryTimer=setTimeout(()=>sync().catch(()=>{}),retryDelay);retryDelay=Math.min(retryDelay*2,120000);}throw e;}
    });}
    function connect(user,newTransport=transport){
      user=user||null;if(connectPending&&connectUser===user&&transport===newTransport)return connectPending;
      cancelPending();uid=user;transport=newTransport;connectUser=user;retries=0;state.conflicts=[];state.error=null;signals.clear();
      const token=generation;
      const attempt=(async()=>{let changed;try{transition=switchOwner(user);changed=await transition;current(token,user);transition=null;if(changed)return;ready=true;state.lastSynced=user?account().lastSynced:null;state.status=user?'pending':'local';notify();if(user)return await sync();}
        catch(e){if(e.code!=='save/cancelled'&&uid===user){ready=false;state.status=e.code==='save/menu-required'?'awaiting-menu':/unavailable|network/.test(e.code||'')?'offline':'error';state.error=friendly(e);notify();}throw e;}
      })();connectPending=attempt;attempt.finally(()=>{if(connectPending===attempt){connectPending=null;transition=null;}}).catch(()=>{});return attempt;
    }
    async function resolveConflict(id,choice){if(!['local','cloud'].includes(choice)||!state.conflicts.some(c=>c.id===id))throw Error('Choose an existing save conflict.');if(choice==='local')await backup();return sync({only:[id],resolve:{[id]:choice}});}
    async function keepDeviceConflicts(){
      const ids=state.conflicts.map(c=>c.id);
      if(!ids.length)throw Error('There are no conflicting saves to keep.');
      await backup();return sync({only:ids,resolve:Object.fromEntries(ids.map(id=>[id,'local']))});
    }
    async function reset(ids){clearTimeout(timer);clearTimeout(retryTimer);generation++;stopped=true;const affected=ids==null?[...groups.keys()].filter(id=>!['main-settings','main-controls'].includes(id)):ids;
      await chain.catch(()=>{});if(staleTab())throw error('save/cancelled','Another tab is restoring game progress.');meta.restoreEpoch=root.crypto.randomUUID();persist();const owner=meta.owner;
      const resetOwner=owner!=='guest'?owner:null;
      if(resetOwner){meta.pendingResets[resetOwner]=[...new Set([...(meta.pendingResets[resetOwner]||[]),...affected])];persist();}
      // Purge all backups for these games so neither a later account switch nor recovery resurrects a reset.
      for(const key of ['owner:'+owner,'recovery:'+owner]){const saved=await vault.get(key);if(saved){for(const id of affected)delete saved.groups[id];if(affected.includes('platdo-city'))saved.media=[];await vault.put(key,saved);}}
      if(resetOwner&&uid===resetOwner&&transport&&root.navigator?.onLine!==false){try{for(const id of affected){await transport.erase(uid,id);meta.pendingResets[resetOwner]=meta.pendingResets[resetOwner].filter(v=>v!==id);delete account().groups[id];persist();}}catch(e){state.error='Reset saved locally. Cloud deletion is queued and will finish when the connection is available.';}}
      state.status=resetOwner&&meta.pendingResets[resetOwner]?.length?'offline':'local';notify();
    }
    function install(P){
      for(const entry of P.getSaveRegistry?.()||[])register(entry.id,entry.name,entry.keys||[]);
      discover();bootHadProgress=Object.keys(boot).some(k=>groupForKey(k)&&!['main-settings','main-controls'].includes(groupForKey(k)));
      const oldRegister=P.registerGame?.bind(P);P.registerGame=(id,name,keys=[])=>{oldRegister?.(id,name,keys);register(id,name,keys);};
      const oldReset=P.resetGameData?.bind(P);P.resetGameData=async ids=>{await reset(ids);return oldReset?.(ids);};
      // Game stores and the legacy Jump saver all use Storage.setItem; observe successful writes only.
      if(root.Storage&&storage===root.localStorage){previousSet=root.Storage.prototype.setItem;previousRemove=root.Storage.prototype.removeItem;
        const rejectStale=(target,key)=>{if(target!==storage||!groupForKey(String(key)))return false;if(!staleTab())return false;freezeStaleTab();return true;};
        root.Storage.prototype.setItem=function(k,v){if(rejectStale(this,k))return;const old=this.getItem(k);const result=previousSet.call(this,k,v);if(this===storage&&old!==String(v))mark(String(k));return result;};root.Storage.prototype.removeItem=function(k){if(rejectStale(this,k))return;const existed=this.getItem(k)!==null;const result=previousRemove.call(this,k);if(this===storage&&existed)mark(String(k));return result;};}
      const onSave=()=>schedule(),onOnline=()=>{if(uid)sync().catch(()=>{});},onStorage=e=>{if(e.key===META){if(staleTab())freezeStaleTab();}else if(groupForKey(e.key))mark(e.key);};
      root.addEventListener?.('platdo:save',onSave);root.addEventListener?.('online',onOnline);root.addEventListener?.('storage',onStorage);
      handles.push(()=>{root.removeEventListener?.('platdo:save',onSave);root.removeEventListener?.('online',onOnline);root.removeEventListener?.('storage',onStorage);});
      return api;
    }
    const api={install,register,connect,sync,loadAllProgress:()=>sync({loadAll:true}),keepDeviceConflicts,resolveConflict,reset,backup,markDirty:mark,snapshot,snapshotAll,validate,
      getState:()=>({...state,owner:meta.owner,uid,ready,restoreEpoch:meta.restoreEpoch,conflicts:[...state.conflicts]}),subscribe(fn){listeners.add(fn);fn(api.getState());return()=>listeners.delete(fn);},
      cancel:cancelPending,setTransport(value){transport=value;},dispose(){cancelPending();stopped=true;for(const fn of handles)fn();if(previousSet)root.Storage.prototype.setItem=previousSet;if(previousRemove)root.Storage.prototype.removeItem=previousRemove;},
      save(id,value){register(id);storage.setItem('platdo:game:'+id+':cloud-data',JSON.stringify(value));mark('platdo:game:'+id+':cloud-data');},load(id){return safeJSON(storage.getItem('platdo:game:'+id+':cloud-data'),null);}
    };return api;
  }
  root.PlatdoCloudSave={create,createVault,fingerprint,canonical,friendly,META,initial,holdWrites:()=>{holding=true;},releaseWrites:()=>{holding=false;}};
})(typeof window!=='undefined'?window:globalThis);
