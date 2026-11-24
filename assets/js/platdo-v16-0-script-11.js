/* Shared, renderer-backed graphics preferences. Gameplay and save data stay independent. */
(function (global) {
  'use strict';
  if (global.PlatdoGraphics) return;
  // Installed before legacy gameplay scripts so Escape cannot also resume/exit a game.
  global.addEventListener('keydown',event=>{
    const dialog=document.querySelector('dialog.pg-backdrop[open]');if(!dialog)return;
    event.stopImmediatePropagation();
    if(event.code==='Escape'){event.preventDefault();global.Platdo?.graphics?.close();}
    else if(event.code==='Tab'){
      const all=[...dialog.querySelectorAll('button,select,input')].filter(n=>!n.disabled),first=all[0],last=all[all.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  },true);
  global.addEventListener('keyup',event=>{if(document.querySelector('dialog.pg-backdrop[open]'))event.stopImmediatePropagation();},true);
  const KEY = 'graphics:v1', MAX_PIXELS = 8294400;
  const modelLevels={potato:1,low:2,medium:3,high:4,epic:4,expert:4,ultra:5,insane:5};
  const modelLabels=['Automatic','Lowest','Low','Medium','High','Highest'];
  const smokeBudgets={potato:12,low:32,medium:72,high:128,epic:192,expert:192,ultra:256,insane:384};
  function resolveSmokeParticles(value,preset){const n=Number(value);return Number.isFinite(n)&&n>=0?Math.max(0,Math.min(1000,Math.round(n))):(smokeBudgets[preset]??72);}
  const smokeParticleField={type:'range',label:'Tire smoke particles',min:-1,max:1000,step:1,default:-1,help:'Automatic follows the device-recommended graphics preset. Choose 0 to turn tire smoke off, or set a maximum particle count. Higher counts cost more rendering time.',format:(value,values)=>Number(value)<0?'Automatic ('+resolveSmokeParticles(-1,values.smokeParticlePreset)+' particles)':Number(value)===0?'Off':Math.round(value)+' particles'};
  function sanitizeFov(value,fallback=70){const n=Number(value);return Number.isFinite(n)?Math.max(1,Math.min(1000000000,n)):fallback;}
  // A perspective lens cannot cross 180 degrees. Extended values remain
  // meaningful, monotonic wide-lens strength instead of inverting the view.
  function projectFov(value){const n=sanitizeFov(value);return n<=150?n:150+29*(-Math.expm1(-(n-150)/100));}
  function resolveModelDetail(value,preset){const level=Number(value);return Number.isFinite(level)&&level>0?Math.max(1,Math.min(5,Math.round(level))):(modelLevels[preset]||3);}
  const modelDetailField={type:'range',label:'Model detail (faces)',min:0,max:5,step:1,default:0,help:'Automatic follows the selected graphics preset, initially recommended from your device capacity. Lower levels draw fewer model polygons; collisions and handling stay unchanged.',format:(value,values)=>Number(value)===0?'Automatic ('+modelLabels[resolveModelDetail(0,values.modelDetailPreset)]+')':modelLabels[Number(value)]};
  const common = {
    resolution: {type:'select',label:'Internal resolution ceiling',options:[{value:'auto',label:'Display size'},...['360','540','720','900','1080','1440','2160'].map(value=>({value,label:value+'p'}))],default:'auto',help:'The actual drawing size is shown below. The display aspect ratio is preserved.'},
    scale: {type:'range',label:'Render scale',min:.25,max:1.25,step:.05,default:1,unit:'×'},
    pixelRatio: {type:'range',label:'Pixel density limit',min:1,max:2,step:.25,default:1,unit:'×'},
    dynamic: {type:'checkbox',label:'Adaptive render scale',default:false,help:'Optional: adjusts only the drawing size after sustained slow frames. Your saved quality and maximum scale stay unchanged.'},
    dynamicMin: {type:'range',label:'Adaptive minimum scale',min:.25,max:1.25,step:.05,default:.5,unit:'×'},
    overlay: {type:'checkbox',label:'Performance overlay',default:false}
  };
  // V2: lower presets used to lean on a heavily reduced drawing size, which looked like a
  // blur filter and left the processor-side work untouched. They now keep a sharp image
  // and cut real work instead (see each game's own preset table).
  const presetCommon = {potato:{resolution:'720',scale:.75,pixelRatio:1},low:{resolution:'900',scale:.9,pixelRatio:1},medium:{resolution:'1080',scale:1,pixelRatio:1},high:{resolution:'1440',scale:1,pixelRatio:1.5},epic:{resolution:'1440',scale:1,pixelRatio:1.5},expert:{resolution:'1440',scale:1,pixelRatio:1.5},ultra:{resolution:'2160',scale:1,pixelRatio:2},insane:{resolution:'2160',scale:1.25,pixelRatio:2}};
  // ---- V2 device scan --------------------------------------------------------------
  // Reads what the browser will say about the hardware and times two short workloads
  // (one on the processor, one on the graphics chip). Nothing leaves the device; the
  // result is cached locally and only used to pick starting settings.
  const SCAN_KEY='platdo:device-scan:v3',tierNames=['potato','low','medium','high','ultra'];
  const gpuTable=[
    [0,/swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic|paravirtual/i],
    [4,/\brtx\s*(20[78]0|30[6-9]0|40[6-9]0|50[6-9]0)|\brtx\s*a[4-6]000|\brx\s*(6[7-9]\d0|7[7-9]\d0|90[67]0)|apple\s+m[1-9]\s*(max|ultra)|apple\s+m[3-9]\s*pro|arc\S*\s*a7[57]0|arc\S*\s*b5[78]0|titan/i],
    [3,/\brtx|\bgtx\s*(1070|1080|16[56]0)|\brx\s*(5[5-7]00|6[4-6]\d0|7[4-6]\d0)|apple\s+m[1-9]|\barc\b|quadro\s*(rtx|p[2-6]000)|radeon\s*pro\s*(w|5[5-7]00)/i],
    [2,/\bgtx|\brx\s*\d{3,4}|iris(\(r\))?\s*(xe|plus|pro)|radeon\(tm\)\s*graphics|radeon\s*(graphics|vega\s*(8|1[01])|[678][0-9]0m)|adreno\s*(\(tm\)\s*)?(7\d\d|6[6-9]\d)|mali-g(7[1-9]|[89]\d|[67]1\d)|apple\s+a1[4-9]|apple\s+gpu|xclipse|immortalis/i],
    [1,/intel|uhd|hd\s*graphics|adreno|mali|powervr|videocore|geforce\s*(mx|gt|[1-9]\d\dm?)|radeon\s*(r[2-7]|hd)|vega\s*[36]|tegra/i]
  ];
  function gpuClassFromName(name){for(const[tier,pattern]of gpuTable)if(pattern.test(name))return tier;return -1;}
  function cpuBenchmark(){let best=Infinity;const data=new Float64Array(4096);for(let run=0;run<5;run++){const t=performance.now();let acc=0;for(let i=0;i<220000;i++){const k=i&4095;data[k]=Math.sin(i*.001)*Math.sqrt(k+1)+data[(k*7+3)&4095]*.5;acc+=data[k];}const ms=performance.now()-t;if(ms<best)best=ms;if(!Number.isFinite(acc))break;}return best;}
  // Megapixels of a fixed 64-step shader the graphics chip can fill per millisecond.
  function fillBenchmark(gl){try{
    const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);return s;},program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision highp float;uniform float seed;void main(){vec2 q=gl_FragCoord.xy*.004+seed;float v=0.;for(int i=0;i<64;i++){q=vec2(sin(q.y*1.7+float(i)*.13)+q.x*.6,cos(q.x*1.3-float(i)*.07)+q.y*.6);v+=dot(q,q)*.02;}gl_FragColor=vec4(fract(v),fract(v*1.7),fract(v*2.3),1.);}'));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return 0;gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const at=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,2,gl.FLOAT,false,0,0);
    const size=Math.min(2048,gl.getParameter(gl.MAX_TEXTURE_SIZE)||1024),texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    const frame=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,frame);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)return 0;gl.viewport(0,0,size,size);
    const seed=gl.getUniformLocation(program,'seed'),pixel=new Uint8Array(4),megapixels=size*size/1e6;
    const run=count=>{const t=performance.now();for(let i=0;i<count;i++){gl.uniform1f(seed,i*.37);gl.drawArrays(gl.TRIANGLES,0,3);}gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);return performance.now()-t;};
    run(1);let draws=2,ms=run(2);
    // Slow chips stop after the first pair; fast ones need more draws to be measurable.
    if(ms<8){draws=8;ms=run(8);}if(ms<8){draws=32;ms=run(32);}
    return draws*megapixels/Math.max(ms,.05);
  }catch(_){return 0;}}
  function readScan(){try{const raw=global.localStorage?.getItem(SCAN_KEY);return raw?JSON.parse(raw):null;}catch(_){return null;}}
  function scanDevice(force=false){
    const nav=global.navigator||{},screen=global.screen||{},dpr=Math.max(1,Number(global.devicePixelRatio)||1);
    const cores=Number(nav.hardwareConcurrency)||4,memory=Number(nav.deviceMemory)||0,touch=(nav.maxTouchPoints||0)>0,mobile=/android|iphone|ipad|ipod|mobile/i.test(nav.userAgent||'')||touch&&Math.min(screen.width||9999,screen.height||9999)<820;
    const info={version:3,cores,memory,mobile,touch,dpr,width:Math.round((screen.width||global.innerWidth||1280)*dpr),height:Math.round((screen.height||global.innerHeight||720)*dpr),gpu:'',vendor:'',webgl2:false,floatTargets:false,maxTexture:0,software:false,saveData:!!nav.connection?.saveData};
    let gl=null;
    try{const canvas=document.createElement('canvas');canvas.width=canvas.height=16;const attributes={antialias:false,alpha:false,depth:false,stencil:false,powerPreference:'high-performance',failIfMajorPerformanceCaveat:false};gl=canvas.getContext('webgl2',attributes);info.webgl2=!!gl;if(!gl)gl=canvas.getContext('webgl',attributes);}catch(_){gl=null;}
    if(gl){try{const debug=gl.getExtension('WEBGL_debug_renderer_info');info.gpu=String(gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER)||'');info.vendor=String(gl.getParameter(debug?debug.UNMASKED_VENDOR_WEBGL:gl.VENDOR)||'');info.maxTexture=Number(gl.getParameter(gl.MAX_TEXTURE_SIZE))||0;info.floatTargets=!!(info.webgl2&&gl.getExtension('EXT_color_buffer_float'));}catch(_){}}
    info.signature=[info.gpu,cores,memory,info.width,info.height,info.webgl2].join('|');
    const cached=readScan();
    if(!force&&cached?.version===3&&cached.signature===info.signature){try{gl?.getExtension('WEBGL_lose_context')?.loseContext();}catch(_){}return cached;}
    info.cpuMs=cpuBenchmark();info.fillRate=gl?fillBenchmark(gl):0;
    try{gl?.getExtension('WEBGL_lose_context')?.loseContext();}catch(_){}
    const named=gpuClassFromName(info.gpu),measured=!gl?0:info.fillRate>=6?4:info.fillRate>=2?3:info.fillRate>=.7?2:info.fillRate>=.12?1:0;
    info.software=named===0||!gl;info.gpuNamed=named;info.gpuMeasured=measured;
    // A known chip name is trusted most; the timing keeps a throttled or mis-reported one honest.
    info.gpuClass=info.software?0:named<0?measured:Math.max(0,Math.min(4,Math.round(named*.6+measured*.4)));
    info.cpuClass=info.cpuMs<4.5?4:info.cpuMs<7?3:info.cpuMs<11?2:info.cpuMs<18?1:0;if(cores<=2)info.cpuClass=Math.min(info.cpuClass,1);else if(cores<=4)info.cpuClass=Math.min(info.cpuClass,3);
    let tier=Math.min(info.gpuClass,info.cpuClass+1);
    if(memory&&memory<=2)tier=Math.min(tier,1);else if(memory&&memory<=4)tier=Math.min(tier,2);
    if(mobile)tier=Math.min(tier,3);if(info.saveData)tier=Math.min(tier,1);if(!info.webgl2)tier=Math.min(tier,1);
    // A very dense screen on a modest chip is the common cause of a slow first run.
    const pixels=info.width*info.height;if(pixels>5e6&&info.gpuClass<=2)tier=Math.max(0,tier-1);
    info.tier=Math.max(0,Math.min(4,tier));info.preset=tierNames[info.tier];
    info.common={resolution:['540','720','1080','1440','2160'][info.gpuClass],scale:info.gpuClass===0?.7:info.gpuClass===1?.85:1,pixelRatio:info.gpuClass>=4?2:info.gpuClass===3?1.5:mobile&&info.gpuClass===2?1.25:1};
    info.scannedAt=Date.now();
    try{global.localStorage?.setItem(SCAN_KEY,JSON.stringify(info));}catch(_){}
    return info;
  }
  function describeDevice(info){if(!info)return'Device not scanned yet';const chip=(info.gpu||'Unknown graphics').replace(/^ANGLE \((.*)\)$/,'$1').replace(/\s*\(0x[0-9a-f]+\)/ig,'').replace(/,?\s*Direct3D\S*.*$|,?\s*OpenGL.*$|,?\s*Unspecified Version.*$|,?\s*D3D11.*$/i,'').replace(/^(NVIDIA|AMD|Intel|Apple|Google|Qualcomm|ARM),\s*/i,'').replace(/ANGLE Metal Renderer:\s*/i,'').trim();return chip+' · '+info.cores+' threads'+(info.memory?' · '+(info.memory>=8?'8+':info.memory)+' GB':'')+' · '+info.width+'×'+info.height;}
  function install(P) {
    if (P.graphics) return P.graphics;
    const entries=new Map(); let stopped=false, modal=null, overlay=null, active=null, ticker=0, previousFocus=null;
    let device=null;try{device=scanDevice(false);}catch(_){device=null;}
    // Automatic is the default: the preset comes from the device scan, and can step down
    // (never silently up) if the game measurably cannot hold its frame rate.
    let globalPrefs={preset:'auto',values:{}}, storageNotice='',autoShift={};
    const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
    function read(id) { try {const raw=P.storage(id).get(KEY); return raw?JSON.parse(raw):null;}catch(_){return null;} }
    function write(id,value) { if(stopped)return; try {if(value===null)P.storage(id).remove(KEY);else P.storage(id).set(KEY,JSON.stringify(value));}catch(_){storageNotice='Saved for this session only: browser storage is unavailable.';} }
    function options(field) { return (field.options||[]).map(x=>typeof x==='object'?x:{value:x,label:String(x)}); }
    function validate(field,value) {
      if(field.type==='checkbox')return typeof value==='boolean'?value:field.default;
      if(field.type==='select')return options(field).find(o=>o.value===value||String(o.value)===String(value))?.value??field.default;
      let n=Number(value); if(!Number.isFinite(n)||value===null||value==='')n=Number(field.default);
      const step=field.step||1; return Math.min(field.max,Math.max(field.min,Math.round((n-field.min)/step)*step+field.min));
    }
    function clean(e,values) { const out={}; for(const [key,field]of Object.entries(e.fields))out[key]=validate(field,values?.[key]??field.default);return out; }
    // Settings saved before V2 (version 1) are not carried over: the presets mean
    // different things now, so every device starts again from Automatic.
    const savedGlobal=read('main-settings');
    if(savedGlobal?.version===2){globalPrefs={preset:savedGlobal.preset==='auto'||own(presetCommon,savedGlobal.preset)?savedGlobal.preset:'auto',values:{}};for(const[k,v]of Object.entries(savedGlobal.values||{}))if(common[k])globalPrefs.values[k]=validate(common[k],v);/* V8.9: the main-load scan alone sets Automatic; step-downs saved from earlier play are not restored */}
    const isAuto=e=>!e.override&&globalPrefs.preset==='auto';
    // The preset Automatic currently resolves to for one game, after any measured step-down.
    function autoPreset(e){const order=tierNames.filter(name=>own(e.presets,name)),wanted=Math.max(0,(device?.tier??2)+(autoShift[e.id]||0));let name=tierNames[Math.min(tierNames.length-1,wanted)];if(!own(e.presets,name))name=order.reduce((best,candidate)=>Math.abs(tierNames.indexOf(candidate)-wanted)<Math.abs(tierNames.indexOf(best)-wanted)?candidate:best,order[0]||Object.keys(e.presets)[0]);return name;}
    function base(e) {
      if(globalPrefs.preset==='auto'){const preset=autoPreset(e),tailored=device?{...device.common,...(e.adapter.auto?.(device,preset)||{})}:{};return {...e.defaults,...presetCommon[preset],...e.presets[preset],...tailored,...globalPrefs.values,preset};}
      const preset=own(e.presets,globalPrefs.preset)?globalPrefs.preset:own(e.presets,'medium')?'medium':Object.keys(e.presets)[0];return {...e.defaults,...presetCommon[preset],...e.presets[preset],...globalPrefs.values,preset};}
    function resolve(e) {const b=base(e), raw=e.override?{...b,...e.override.values}:b;return {...clean(e,raw),preset:e.override?.preset||b.preset};}
    function effective(e) {return {...e.values,...(e.fields.modelDetail?{modelDetailLevel:resolveModelDetail(e.values.modelDetail,e.sourcePreset),modelDetailPreset:e.sourcePreset}:{}),...(e.fields.smokeParticles?{smokeParticleBudget:resolveSmokeParticles(e.values.smokeParticles,e.sourcePreset),smokeParticlePreset:e.sourcePreset}:{}),dynamicScale:e.values.dynamic?Math.min(e.values.scale,Math.max(Math.min(e.values.dynamicMin,e.values.scale),e.dynamicScale)):e.values.scale};}
    function notify(e,reason) {global.dispatchEvent(new CustomEvent('platdo:graphicschange',{detail:{id:e.id,values:effective(e),reason}}));}
    function apply(e,next,reason,sourcePreset=e.sourcePreset) {
      const old=e.values, oldScale=e.dynamicScale,oldSource=e.sourcePreset;e.values=next;e.sourcePreset=sourcePreset;e.dynamicScale=next.scale;
      try {if(e.adapter.apply?.(effective(e),reason)===false)throw new Error('The renderer could not apply that setting.');e.lastGood={...next};e.failure='';e.samples=[];e.slowFrames=0;e.windowAt=e.changedAt=performance.now();notify(e,reason);return true;}
      catch(error){e.values=old;e.sourcePreset=oldSource;e.dynamicScale=oldScale;e.failure='Graphics restored to the previous working settings. '+String(error?.message||error);try{e.adapter.apply?.(effective(e),'rollback');}catch(_){}return false;}
    }
    function persist(e) {write(e.id,e.override?{version:2,preset:e.override.preset,sourcePreset:e.sourcePreset,values:e.override.values}:null);}
    function saveGlobal(){write('main-settings',{version:2,...globalPrefs,autoShift,signature:device?.signature||''});}
    function set(id,patch) {
      const e=entries.get(id);if(!e||stopped)return false;
      let raw={...e.values,...patch},preset=e.values.preset,sourcePreset=e.sourcePreset;
      if(patch.preset&&own(e.presets,patch.preset)){const preferences=Object.fromEntries(Object.entries(e.fields).filter(([,field])=>field.preserveOnPreset).map(([key])=>[key,e.values[key]]));preset=patch.preset;sourcePreset=preset;raw={...e.defaults,...presetCommon[preset],...e.presets[preset],...preferences,...patch};}
      else if(Object.keys(patch).some(k=>!['overlay','dynamic','dynamicMin'].includes(k)))preset='custom';
      const next={...clean(e,raw),preset};
      if(!apply(e,next,'change',sourcePreset)){refresh();return false;}
      e.override={preset,values:clean(e,next)};persist(e);refresh();return true;
    }
    function useGlobal(id){const e=entries.get(id);if(!e)return false;const old=e.override;e.override=null;if(!apply(e,resolve(e),'global',base(e).preset)){e.override=old;return false;}persist(e);refresh();return true;}
    // Resetting a game returns it to the shared default (Automatic unless changed).
    function reset(id){const e=entries.get(id);if(!e)return false;autoShift[id]=0;saveGlobal();return useGlobal(id);}
    function renderSize(id,w,h){
      const e=entries.get(id);w=Math.max(1,Number(w)||1);h=Math.max(1,Number(h)||1);const v=e?effective(e):{...Object.fromEntries(Object.entries(common).map(([k,f])=>[k,f.default])),dynamicScale:1};
      const dpr=Math.min(Math.max(1,global.devicePixelRatio||1),v.pixelRatio), cap=Number(v.resolution)||Infinity;
      const shared=P.renderSize?.(w,h)||{width:w*dpr,height:h*dpr};
      let ratio=Math.min(dpr,cap/h,cap*16/9/w)*v.dynamicScale;
      ratio=Math.min(ratio,shared.width/w,shared.height/h,Math.sqrt(MAX_PIXELS/(w*h)),8192/w,8192/h);
      const result={width:Math.max(1,Math.floor(w*ratio)),height:Math.max(1,Math.floor(h*ratio))};
      if(e)e.size=result;return result;
    }
    function sample(id,frameMs,cpuMs,now=performance.now()) {
      const e=entries.get(id);if(!e||stopped)return;e.lastSample=now;active=id;
      if(Number.isFinite(frameMs)&&frameMs>0&&frameMs<=5000){e.frame=e.frame?e.frame*.9+frameMs*.1:frameMs;e.cpu=Number.isFinite(cpuMs)?(e.cpu||cpuMs)*.9+cpuMs*.1:e.cpu;}
      // Watchdog for Automatic. The scan is a prediction; this is the measurement. Frames slower
      // than 250 ms are a paused or background tab, not a slow device, and are ignored.
      // V2.1: it now also counts late frames. A game that averages close to its target can still
      // miss a refresh every second or so, which is what "random frame drops" look like. If more
      // than one frame in sixteen is late, or the average is well under target, for two six-second
      // windows in a row, Automatic drops one preset and remembers that for this device.
      if(false/* V8.9: no preset changes while a game is being played; the main-load scan decides */&&isAuto(e)&&!document.hidden&&Number.isFinite(frameMs)&&frameMs>0&&frameMs<250&&now-e.changedAt>8000){
        const w=e.autoWindow||(e.autoWindow={start:now,total:0,count:0,strikes:0,late:0}),goal=Math.min(60,P.frameRate||60),target=global.PlatdoPacing?global.PlatdoPacing.frameTime(goal):1000/goal;w.total+=frameMs;w.count++;if(frameMs>target*1.45)w.late=(w.late||0)+1;
        if(now-w.start>=6000&&w.count>=20){const mean=w.total/w.count,slow=mean>target*1.38||(w.late||0)>w.count/16;w.start=now;w.total=0;w.count=0;w.late=0;w.strikes=slow?w.strikes+1:0;
          if(w.strikes>=2){w.strikes=0;if(tierNames.indexOf(autoPreset(e))>0){autoShift[e.id]=(autoShift[e.id]||0)-1;saveGlobal();const preset=base(e).preset;if(apply(e,resolve(e),'auto-step',preset)){e.note='Automatic lowered this game to '+preset[0].toUpperCase()+preset.slice(1)+' because frames were being dropped.';refresh();}}}}
      }else if(e.autoWindow&&(document.hidden||!(frameMs<250))){e.autoWindow.start=now;e.autoWindow.total=0;e.autoWindow.count=0;e.autoWindow.late=0;}
      if(!e.values.dynamic||document.hidden||!Number.isFinite(frameMs)||frameMs<=0||frameMs>2000){e.samples=[];e.slowFrames=0;return;}
      // One loading hitch is not a slow device. Repeated slow frames are real workload.
      if(frameMs>200){e.slowFrames=(e.slowFrames||0)+1;if(e.slowFrames<3)return;}else e.slowFrames=0;
      if(now-e.changedAt<5000)return;
      e.samples.push(frameMs);if(e.samples.length<12||now-e.windowAt<2500)return;
      const samples=e.samples.sort((a,b)=>a-b),mean=samples.slice(0,Math.ceil(samples.length*.9)).reduce((a,b)=>a+b,0)/Math.ceil(samples.length*.9);
      const target=1000/Math.min(120,P.frameRate||60),minimum=Math.min(e.values.dynamicMin,e.values.scale);
      let next=e.dynamicScale;if(mean>target*1.18)next=Math.max(minimum,next-.05);else if(mean<target*1.04)next=Math.min(e.values.scale,next+.025);
      e.samples=[];e.windowAt=now;
      if(Math.abs(next-e.dynamicScale)>.001){const old=e.dynamicScale;e.dynamicScale=next;try{if(e.adapter.apply?.(effective(e),'adaptive')===false)throw Error('Rejected');e.changedAt=now;notify(e,'adaptive');}catch(_){e.dynamicScale=old;}}
    }
    function reportFailure(id,error){const e=entries.get(id);if(!e)return;e.failure='Renderer needs recovery: '+String(error?.message||error||'graphics context unavailable')+'. Choose Potato or reset graphics, then retry the game.';refresh();}
    function attachContext(id,canvas){const e=entries.get(id);if(!e||!canvas||e.contexts.has(canvas))return;e.contexts.add(canvas);canvas.addEventListener('webglcontextlost',ev=>{ev.preventDefault();reportFailure(id,'graphics context lost');});canvas.addEventListener('webglcontextrestored',()=>{e.samples=[];try{e.adapter.apply?.(effective(e),'context-restored');e.failure='';}catch(err){reportFailure(id,err);}refresh();});}
    function reapplyShared(){for(const e of entries.values())if(!e.override)apply(e,resolve(e),'global',base(e).preset);for(const select of document.querySelectorAll('[data-global-graphics-preset]'))select.value=globalPrefs.preset;}
    // "Automatic for this device": clear this game's own settings and any measured step-down.
    function recommended(id){const e=entries.get(id);if(!e)return;autoShift[id]=0;if(globalPrefs.preset!=='auto')globalPrefs={preset:'auto',values:{}};saveGlobal();e.override=null;persist(e);reapplyShared();e.note='Automatic settings for this device.';refresh();}
    // Runs the device scan again (new hardware, a different screen, or just to check).
    function rescan(){try{device=scanDevice(true);}catch(_){}autoShift={};saveGlobal();reapplyShared();refresh();return device;}
    function register(id,adapter={}) {
      if(entries.has(id))return entries.get(id).handle;
      const fields={...common,...adapter.fields},defaults={...Object.fromEntries(Object.entries(fields).map(([k,f])=>[k,f.default])),...adapter.defaults};
      const e={id,adapter,name:adapter.name||id,fields,defaults,presets:adapter.presets||{low:{},medium:{},high:{}},values:{},override:null,dynamicScale:1,samples:[],windowAt:0,changedAt:performance.now(),contexts:new WeakSet(),failure:'',note:'',size:null};
      let saved=read(id);if(saved&&saved.version!==2){saved=null;write(id,null);}
      if(saved?.values&&typeof saved.values==='object')e.override={preset:saved.preset==='custom'||own(e.presets,saved.preset)?saved.preset:'custom',values:clean(e,saved.values)};
      e.sourcePreset=own(e.presets,saved?.sourcePreset)?saved.sourcePreset:own(e.presets,saved?.preset)?saved.preset:base(e).preset;
      e.values=resolve(e);e.dynamicScale=e.values.scale;e.lastGood={...e.values};
      e.handle={get:()=>effective(e),set:patch=>set(id,patch),open:opts=>open(id,opts),renderSize:(w,h)=>renderSize(id,w,h),sample:(...args)=>sample(id,...args),reportFailure:error=>reportFailure(id,error),attachContext:canvas=>attachContext(id,canvas),reset:()=>reset(id),useGlobal:()=>useGlobal(id)};
      entries.set(id,e);
      // Callbacks may capture the returned handle; initial application runs after registration returns.
      queueMicrotask(()=>{if(!stopped)apply(e,e.values,'initial');});return e.handle;
    }
    function make(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
    function close(){if(!modal)return;const callback=modal._onClose;modal.close?.();modal.remove();modal=null;clearInterval(ticker);ticker=0;previousFocus?.focus?.();callback?.();}
    function open(id,opts={}) {
      if(!entries.has(id))return false;close();previousFocus=document.activeElement;P.controls?.clear?.();
      modal=make('dialog','pg-backdrop');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label',entries.get(id).name+' graphics');modal._id=id;modal._onClose=opts.onClose;modal.addEventListener('cancel',event=>{event.preventDefault();close();});
      const panel=make('section','pg-panel');modal.append(panel);document.body.append(modal);modal.showModal();refresh();ticker=setInterval(refreshMetrics,500);modal.querySelector('button')?.focus();return true;
    }
    // ---- V2 settings panel -----------------------------------------------------------
    const groupOf={resolution:'picture',scale:'picture',pixelRatio:'picture',post:'picture',background:'picture',distance:'world',detail:'world',modelDetail:'world',pedestrians:'world',vehicleCount:'world',decals:'world',lighting:'light',shadows:'light',reflections:'light',ao:'light',particles:'light',smokeParticles:'light',ragdoll:'play',gore:'play',dynamic:'speed',dynamicMin:'speed',overlay:'speed'};
    const groupTitles=[['picture','Picture','How sharp the image is and how it is finished.'],['world','World','How much of the world is drawn, and in how much detail.'],['light','Light and effects','Shadows, reflections and particles.'],['play','Content','Choices that are about taste, not speed.'],['speed','Performance tools','Helpers for keeping the frame rate steady.']];
    const title=name=>name[0].toUpperCase()+name.slice(1);
    function statusText(e){return e.failure||storageNotice||e.note||(isAuto(e)?'Automatic: chosen from a scan of this device. If the game still runs slowly it lowers itself one step.':e.override?'These settings are saved for this game only.':'Following the shared preset for all games.');}
    function refreshMetrics(){
      if(!modal)return;const e=entries.get(modal._id);if(!e)return;const output=modal.querySelector('.pg-metrics');let m={};try{m=e.adapter.measure?.()||{};}catch(_){}
      for(const [key,field]of Object.entries(e.fields))if(field.displayValue){const input=modal.querySelector('[data-graphics-key="'+key+'"]');if(!input)continue;input.disabled=field.supported===false;if(input.disabled){const value=field.displayValue(e.values[key]);input.value=value;const label=field.format?field.format(value,effective(e)):field.type==='range'?Number(value).toFixed(field.step<1?2:0)+(field.unit?' '+field.unit:''):String(value);input.setAttribute('aria-valuetext',label);const out=input.closest('label')?.querySelector('output');if(out)out.textContent=label;}}
      const size=m.width&&m.height?m:e.size,fps=e.frame&&performance.now()-(e.lastSample||0)<1500?Math.round(1000/e.frame)+' FPS now · ':'';
      if(output)output.textContent=fps+(size?`${size.width} × ${size.height} pixels drawn`:'Drawing size appears when the game starts')+` · scale ${effective(e).dynamicScale.toFixed(2)}× · ${P.frameRate||60} FPS cap`+(m.calls!==undefined?` · ${m.calls} draw calls`:'')+(m.triangles!==undefined?` · ${Math.round(m.triangles).toLocaleString()} triangles`:'');
      const status=modal.querySelector('.pg-status');if(status)status.textContent=statusText(e);
    }
    function deviceCard(){
      const card=make('div','pg-device'),text=make('div','pg-device-text');text.append(make('small','','THIS DEVICE'),make('strong','',describeDevice(device)));
      if(device)text.append(make('span','',(device.software?'Software rendering detected. ':'')+'Suggested preset: '+title(device.preset)+'.'));
      const again=make('button','pg-quiet','Scan again');again.type='button';again.onclick=()=>{again.disabled=true;again.textContent='Scanning…';setTimeout(()=>rescan(),30);};card.append(text,again);return card;
    }
    function fieldRow(e,key,field){
      const shown=field.displayValue?field.displayValue(e.values[key]):e.values[key],row=make('label','pg-row'),text=make('span','pg-label',field.label||key);row.append(text);
      if(field.help||field.reason)text.append(make('small','',field.reason||field.help));
      let input;if(field.type==='select'){input=make('select');for(const o of options(field))input.add(new Option(o.label,o.value));input.value=shown;}
      else{input=make('input');input.type=field.type==='checkbox'?'checkbox':'range';if(input.type==='checkbox'){input.checked=e.values[key];row.classList.add('pg-toggle');}else{input.min=field.min;input.max=field.max;input.step=field.step||1;input.value=shown;const label=value=>field.format?field.format(value,effective(e)):Number(value).toFixed(field.step<1?2:0)+(field.unit?' '+field.unit:'');const value=make('output','',label(shown));input.setAttribute('aria-valuetext',label(shown));row.append(value);row.classList.add('pg-slider');input.oninput=()=>{value.textContent=label(Number(input.value));input.setAttribute('aria-valuetext',value.textContent);};}}
      input.dataset.graphicsKey=key;input.setAttribute('aria-label',field.label||key);input.disabled=field.supported===false;
      input.onchange=()=>set(e.id,{[key]:field.type==='checkbox'?input.checked:field.type==='range'?Number(input.value):input.value});row.append(input);return row;
    }
    function refresh(){
      if(!modal)return;const e=entries.get(modal._id),panel=modal.firstChild,oldFocus=document.activeElement,scroll=panel.scrollTop;
      const focus=panel.contains(oldFocus)?{key:oldFocus.dataset.graphicsKey,label:oldFocus.getAttribute('aria-label'),tag:oldFocus.tagName,text:oldFocus.textContent}:null;
      panel.replaceChildren();
      const head=make('header','pg-head'),heading=make('div');heading.append(make('small','','GRAPHICS'),make('h2','',e.name));const back=make('button','pg-primary','Done');back.type='button';back.onclick=close;head.append(heading,back);panel.append(head,deviceCard());
      const pills=make('div','pg-presets');pills.setAttribute('role','group');pills.setAttribute('aria-label','Quality preset');
      const auto=isAuto(e),pill=(label,active,action,hint)=>{const b=make('button','pg-pill'+(active?' is-active':''),label);b.type='button';b.setAttribute('aria-pressed',String(!!active));if(hint)b.title=hint;b.onclick=action;pills.append(b);};
      pill(auto?'Automatic · '+title(e.values.preset):'Automatic',auto,()=>recommended(e.id),'Let PLATDO choose from the device scan');
      for(const value of Object.keys(e.presets))pill(title(value),!auto&&e.values.preset===value,()=>set(e.id,{preset:value}));
      if(!auto&&e.values.preset==='custom')pill('Custom',true,()=>{});
      panel.append(pills,make('p','pg-status'));
      const sections=make('div','pg-sections'),byGroup=new Map();for(const[key,field]of Object.entries(e.fields)){const group=groupOf[key]||'world';if(!byGroup.has(group))byGroup.set(group,[]);byGroup.get(group).push([key,field]);}
      for(const[group,name,blurb]of groupTitles){const list=byGroup.get(group)||[];if(!list.length&&group!=='speed')continue;const card=make('section','pg-card');card.append(make('h3','',name),make('p','pg-card-note',blurb));for(const[key,field]of list)card.append(fieldRow(e,key,field));
        if(group==='speed'){const fpsRow=make('label','pg-row');fpsRow.append(make('span','pg-label','Frame-rate cap · all games'));const fps=make('select');fps.setAttribute('aria-label','Frame-rate cap');for(const n of [30,60,120,240])fps.add(new Option(n+' FPS',n));fps.value=P.frameRate||60;fps.disabled=typeof P.setFrameRate!=='function';fps.onchange=()=>{P.setFrameRate?.(Number(fps.value));refreshMetrics();};fpsRow.append(fps);card.append(fpsRow);}
        sections.append(card);}
      panel.append(sections,make('p','pg-metrics'));
      const actions=make('div','pg-actions');for(const [label,fn,primary]of [['Automatic for this device',()=>recommended(e.id),true],['Use the shared preset',()=>useGlobal(e.id)],['Reset this game',()=>reset(e.id)]]){const b=make('button',primary?'pg-primary':'pg-quiet',label);b.type='button';b.onclick=fn;actions.append(b);}panel.append(actions,make('p','pg-footnote','Lower presets draw a shorter distance, fewer and simpler models, and skip shadows, reflections and finishing passes, so they are faster on every device. Density controls change live traffic or pedestrians; nothing here affects your progress.'));
      refreshMetrics();panel.scrollTop=scroll;
      if(focus){const replacement=[...panel.querySelectorAll('button,select,input')].find(n=>focus.key?n.dataset.graphicsKey===focus.key:focus.label?n.getAttribute('aria-label')===focus.label:n.tagName===focus.tag&&n.textContent===focus.text);replacement?.focus({preventScroll:true});}
    }
    function mountGlobal(container){
      if(typeof container==='string')container=document.querySelector(container);if(!container)return;
      container.classList.add('pg-global');
      container.replaceChildren(make('h3','','Graphics'),make('p','pg-card-note','PLATDO scans this device once and picks settings for it. You can choose a preset for every game here, or open one game to fine-tune it.'),deviceCard());
      const row=make('label','pg-row');row.append(make('span','pg-label','Preset for all games'));const select=make('select');select.dataset.globalGraphicsPreset='true';select.setAttribute('aria-label','Graphics preset for all games');select.add(new Option('Automatic'+(device?' ('+title(device.preset)+')':''),'auto'));for(const v of ['potato','low','medium','high','ultra'])select.add(new Option(title(v),v));select.value=globalPrefs.preset;select.onchange=()=>setGlobal({preset:select.value});row.append(select);container.append(row);
      const list=make('div','pg-game-list');for(const e of entries.values()){const b=make('button','pg-quiet',e.name+(e.override?' · custom':''));b.type='button';b.onclick=()=>open(e.id,{onClose:()=>mountGlobal(container)});list.append(b);}container.append(list);
      const resetButton=make('button','pg-quiet','Back to Automatic for every game');resetButton.type='button';resetButton.onclick=()=>{for(const e of entries.values()){e.override=null;persist(e);}autoShift={};setGlobal({preset:'auto',values:{}},{replace:true});mountGlobal(container);};container.append(resetButton);
    }
    function setGlobal(patch,{replace=false}={}){if(stopped)return;const next=replace?{preset:'auto',values:{}}:{preset:globalPrefs.preset,values:{...globalPrefs.values}};if(patch.preset==='auto'||own(presetCommon,patch.preset)){next.preset=patch.preset;if(!patch.values)next.values={};}for(const[k,v]of Object.entries(patch.values||{}))if(common[k])next.values[k]=validate(common[k],v);globalPrefs=next;saveGlobal();reapplyShared();refresh();}
    // One lightweight overlay timer, no background animation loop or repeated listeners per menu.
    const overlayTimer=setInterval(()=>{
      const e=entries.get(active),visible=e?.values.overlay&&!document.hidden&&performance.now()-e.lastSample<1200;
      if(!visible){if(overlay)overlay.hidden=true;return;}
      if(!overlay){overlay=make('output','pg-overlay');overlay.setAttribute('aria-label','Graphics performance');document.body.append(overlay);}overlay.hidden=false;
      const size=e.size;overlay.textContent=`${e.name}\n${Math.round(1000/(e.frame||1000/60))} FPS · ${(e.cpu||0).toFixed(1)} ms CPU submit\n${size?size.width+' × '+size.height:'Starting'} · ${effective(e).dynamicScale.toFixed(2)}×`;
    },500);
    document.addEventListener('keydown',event=>{if(!modal)return;if(event.code==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}else if(event.code==='Tab'){const all=[...modal.querySelectorAll('button,select,input')].filter(n=>!n.disabled);const first=all[0],last=all[all.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}},true);
    document.addEventListener('visibilitychange',()=>{for(const e of entries.values()){e.samples=[];e.windowAt=performance.now();e.changedAt=performance.now();}});
    global.addEventListener('platdo:beforereset',()=>{stopped=true;clearInterval(overlayTimer);close();if(overlay)overlay.hidden=true;});
    const api=P.graphics={register,get:id=>entries.get(id)?effective(entries.get(id)):null,set,open,close,reset,useGlobal,renderSize,sample,reportFailure,attachContext,recommended,rescan,mountGlobal,setGlobal,getGlobal:()=>JSON.parse(JSON.stringify(globalPrefs)),device:()=>device?JSON.parse(JSON.stringify(device)):null,describeDevice:()=>describeDevice(device),isAutomatic:id=>{const e=entries.get(id);return !!e&&isAuto(e);},list:()=>[...entries.values()].map(e=>({id:e.id,name:e.name,override:!!e.override,automatic:isAuto(e),preset:e.values.preset,fields:e.fields,presets:Object.keys(e.presets)})),maxPixels:MAX_PIXELS};return api;
  }
  global.PlatdoGraphics={install,scanDevice,describeDevice,gpuClassFromName,modelDetailField,resolveModelDetail,smokeParticleField,resolveSmokeParticles,sanitizeFov,projectFov};
})(window);
