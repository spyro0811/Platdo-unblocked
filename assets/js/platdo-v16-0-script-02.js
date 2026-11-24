/* Bounded startup trace. No user identifiers, save contents, URLs or credentials. */
(function(root){
 'use strict';
 if(root.PlatdoStartup)return;
 const KEY='platdo:startup-trace:v1',LIMIT=80,MAX_BYTES=24576;
 let store,events=[],attempt=0,stage='Opening page';
 try{store=root.sessionStorage;const raw=store.getItem(KEY);if(raw&&raw.length<=MAX_BYTES){const data=JSON.parse(raw);if(Array.isArray(data))events=data.slice(-LIMIT);}}catch(_){store=null;}
 const page=root.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
 const safe=value=>typeof value==='string'?value.replace(/https?:\/\/\S+|\b[^\s@]+@[^\s@]+\b|\beyJ[A-Za-z0-9_.-]+/g,'[redacted]').replace(/[\r\n\t]/g,' ').slice(0,100):undefined;
 const errorCode=e=>/^(?:(?:auth|save|storage|firestore)\/)?[a-z][a-z0-9-]{1,75}$/.test(e?.code||'')?e.code:'startup/operation-failed';
 function record(event,details={}){
  const entry={at:new Date().toISOString(),page,attempt,event:safe(event),stage:safe(details.stage||stage)};
  // Only application-defined labels and numeric counters are accepted. Arbitrary
  // errors/messages/stacks and object data never enter the persistent trace.
  for(const key of ['reason','code'])if(details[key])entry[key]=safe(details[key]);
  for(const key of ['attempt','elapsedMs'])if(Number.isFinite(details[key]))entry[key]=Math.max(0,Math.round(details[key]));
  events.push(entry);if(events.length>LIMIT)events.splice(0,events.length-LIMIT);
  let serialized=JSON.stringify(events);
  while(serialized.length>MAX_BYTES&&events.length>1){events.shift();serialized=JSON.stringify(events);}
  try{store?.setItem(KEY,serialized);}catch(_){store=null;}
  root.dispatchEvent?.(new CustomEvent('platdo:startuptrace',{detail:entry}));return entry;
 }
 function setStage(value){value=safe(value)||'Starting';if(stage===value)return;stage=value;record('stage');}
 const api={record,begin(label){attempt++;stage=safe(label)||'Starting';record('attempt-start');return attempt;},stage:setStage,
  error(error,label){record('operation-error',{stage:label||stage,code:errorCode(error)});},
  snapshot:()=>({page,attempt,stage,storageAvailable:!!store,events:events.map(e=>({...e}))}),
  clear(){events=[];try{store?.removeItem(KEY);}catch(_){store=null;}}};
 root.PlatdoStartup=api;
 const navigation=root.performance?.getEntriesByType?.('navigation')?.[0]?.type;
 record('page-created',{reason:['navigate','reload','back_forward'].includes(navigation)?navigation:'unknown-navigation'});
 root.addEventListener?.('pagehide',()=>record('page-hidden'));
 root.addEventListener?.('pageshow',e=>{if(e.persisted)record('page-restored-from-cache');});
 root.addEventListener?.('platdo:beforereset',e=>{if(e.detail?.all&&!e.detail?.cloudRestore)api.clear();});
})(typeof window!=='undefined'?window:globalThis);
