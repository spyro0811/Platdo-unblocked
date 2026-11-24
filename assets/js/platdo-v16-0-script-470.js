
(function(root){
'use strict';
const library={
  snake:{name:'Snake',mark:'<path d="M4 20h7v-6h7V8h5"/><rect x="21" y="5" width="5" height="5"/>',color:'#93e5a3',how:'Steer with WASD, arrow keys or the direction pad. Eat the yellow fruit for 10 points. Avoid the edges and your own body. Fill all 400 squares to win.'},
  breaker:{name:'Brick Breaker',mark:'<path d="M3 6h9m2 0h9M5 11h8m3 0h8M6 23h14"/><circle cx="17" cy="17" r="2"/>',color:'#ffac7d',how:'Move the paddle with A and D, the arrow keys, your mouse or a touch drag. Press Launch or Space to serve. Break all 50 bricks. You have three lives.'},
  memory:{name:'Memory Match',mark:'<path d="M4 5h12v13H4zM11 20v3h12V10h-4"/><circle cx="10" cy="11" r="2"/>',color:'#bbb6ff',how:'Flip two cards to find a pair. Match all eight pairs with as few moves as possible. Your fastest time breaks a tie.'}
};
const symbols=['◆','●','▲','✚','★','☀','♥','⬟'];
const collection={
 code:{name:'Code Platdo',color:'#ed856e',mark:'<path d="m10 8-6 6 6 6m8-12 6 6-6 6m-2-15-4 18"/>'},
 swing:{name:'Platdo Swing',color:'#8bc87a',mark:'<circle cx="7" cy="6" r="2"/><path d="m7 8 10 12m-5 2 5-3 4 2M7 24c8 2 14-2 17-8"/>'},
 godcore:{name:'God Core',color:'#f0bb6a',mark:'<path d="m16 3-10 13h7l-2 9 12-15h-8Z"/>'},
 jump:{name:'Platdo Jump',color:'#6eb5f0',mark:'<path d="M3 23h8m6-6h8M5 16c3-9 8-11 14-8m-6 1 6-1-1-5"/>'}
};
const settingsIcon={name:'Settings',color:'#b7c4d8',mark:'<path d="M4 7h20M4 14h20M4 21h20"/><path d="M9 4v6m10 1v6m-8 1v6" stroke-width="4"/>'};
const apps={...library,...collection,settings:settingsIcon};
const ids=Object.keys(apps);
const icon=(a)=>'<i class="pc-icon" style="--icon-color:'+a.color+'"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">'+a.mark+'</svg></i>';
const dirs={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]};
const button=(id,text,attr='')=>'<button type="button" data-pc="'+id+'" '+attr+'>'+text+'</button>';
const clock=s=>Math.floor(s/60)+':'+String(Math.floor(s)%60).padStart(2,'0');
class Desktop {
 constructor(host,options){
   this.host=host;this.options=options;this.page='desktop';this.keys=new Set();this.controllers=new AbortController();
   this.layout=root.CityDesktopLayout;this.prefs=this.layout.preferences(options.preferences?.(),ids);
   this.host.innerHTML='<section class="city-workstation" aria-label="Home computer"><div class="pc-frame"><div class="pc-glassscreen"><div class="pc-shortcuts" aria-label="Desktop shortcuts">'+ids.map(id=>button(library[id]?'app':collection[id]?'legacy':'settings',icon(apps[id])+'<span>'+apps[id].name+'</span>','class="pc-shortcut" data-id="'+id+'" title="'+apps[id].name+' — drag to move"')).join('')+'</div><div class="pc-signature" aria-hidden="true"><b>Platdo</b><span>Home edition</span></div><section class="pc-window" hidden><header class="pc-titlebar"><strong></strong>'+button('back','×','aria-label="Back" title="Back"')+'</header><main></main></section><section class="pc-start" aria-label="Start menu" hidden></section></div><footer class="pc-taskbar">'+button('start','<i class="pc-start-symbol" aria-hidden="true"></i> Start','aria-expanded="false" aria-label="Start menu"')+button('settings','<span aria-hidden="true">⚙</span> Settings','class="pc-settings-pin"')+'<button type="button" data-pc="task" class="pc-bar-app" aria-label="Running application"></button><section class="pc-task-preview" hidden><header><strong></strong><button type="button" data-pc="closeApp" aria-label="Close application">×</button></header><canvas width="300" height="180"></canvas></section><time class="pc-time"></time>'+button('leave','Leave computer','class="pc-exit"')+'</footer></div></section>';
   this.main=this.host.querySelector('main');this.window=this.host.querySelector('.pc-window');this.desk=this.host.querySelector('.pc-glassscreen');this.shortcuts=this.host.querySelector('.pc-shortcuts');this.menu=this.host.querySelector('.pc-start');
   this.menu.innerHTML='<small>START</small><h3>Applications</h3><div>'+ids.map(id=>button('startApp',icon(apps[id])+apps[id].name,'data-id="'+id+'"')).join('')+'</div>';
   const on=(target,name,listener,capture=false)=>target.addEventListener(name,listener,{capture,signal:this.controllers.signal});
   on(this.host,'click',e=>this.click(e));
   this.taskPreview=this.host.querySelector('.pc-task-preview');const task=this.host.querySelector('.pc-bar-app');for(const target of [task,this.taskPreview]){on(target,'pointerenter',()=>{clearTimeout(this.previewHide);this.previewTask();});on(target,'pointerleave',()=>this.previewHide=setTimeout(()=>this.taskPreview.hidden=true,240));}
   on(this.host,'pointermove',e=>{if(this.drag)this.dragMove(e);else if(e.pointerType==='mouse'||e.buttons)this.paddle(e);});
   on(this.host,'pointerdown',e=>{this.suppressClick=null;const b=e.target.closest('.pc-shortcut');if(b&&this.page==='desktop'&&e.button===0&&e.isPrimary){this.setStart(false);this.drag={id:e.pointerId,b,x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId);}else if(this.paddle(e))e.target.setPointerCapture?.(e.pointerId);});
   on(this.host,'pointerup',e=>this.dragEnd(e));on(this.host,'pointercancel',e=>this.dragEnd(e,true));on(this.host,'lostpointercapture',e=>this.dragEnd(e,true));
   on(this.host,'change',e=>{if(e.target.matches('.pc-picture-input'))this.upload(e.target.files?.[0]);});
   on(root,'keydown',e=>this.key(e,true),true);
   on(root,'keyup',e=>this.key(e,false),true);
   const clear=()=>{this.lastTick=0;this.keys.clear();this.cancelDrag();};
   on(root,'blur',clear);on(document,'visibilitychange',clear);
   this.resize=new ResizeObserver(()=>this.arrange());this.resize.observe(this.shortcuts);
   const updateClock=()=>{this.host.querySelector('.pc-time').textContent=new Date().toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});};
   updateClock();this.minute=setInterval(updateClock,30000);this.paintWallpaper();this.render();
 }
 close(){clearTimeout(this.previewHide);this.cancelDrag();this.closed=true;this.controllers.abort();this.resize.disconnect();clearInterval(this.minute);cancelAnimationFrame(this.frame);this.frame=0;this.keys.clear();this.game=null;}
 previewTask(){if(this.page==='desktop')return;this.taskPreview.hidden=false;this.taskPreview.querySelector('strong').textContent=this.window.querySelector('header strong').textContent;const c=this.taskPreview.querySelector('canvas'),ctx=c.getContext('2d');ctx.fillStyle='#122031';ctx.fillRect(0,0,300,180);if(this.board)ctx.drawImage(this.board,0,0,300,180);else{ctx.fillStyle='#fff';ctx.font='20px system-ui';ctx.fillText(this.window.querySelector('header strong').textContent,20,70);ctx.font='13px system-ui';ctx.fillText(this.page==='running'?'Game in progress':'Open application',20,105);}}
 arrange(){
   const b=this.shortcuts.getBoundingClientRect();if(!b.width||!b.height)return;
   this.grid=this.layout.grid(b.width,b.height,ids.length);this.slots=this.layout.place(ids,this.prefs.places,this.grid);
   for(const el of this.shortcuts.children){const p=this.slots[el.dataset.id];
     el.style.width=Math.min(this.grid.width,91)+'px';el.style.height=Math.min(this.grid.height,78)+'px';
     el.style.left=(p.x+.5)*this.grid.width+'px';el.style.top=(p.y+.5)*this.grid.height+'px';}
 }
 dragMove(e){
   const d=this.drag;if(d.id!==e.pointerId)return;
   const dx=e.clientX-d.x,dy=e.clientY-d.y;
   if(!d.moved&&Math.hypot(dx,dy)<6)return;
   d.moved=true;d.b.classList.add('pc-dragging');d.b.style.translate=dx+'px '+dy+'px';e.preventDefault();
 }
 cancelDrag(){
   const d=this.drag;if(!d)return;this.drag=null;
   d.b.classList.remove('pc-dragging');d.b.style.translate='';
   if(d.b.hasPointerCapture?.(d.id))d.b.releasePointerCapture(d.id);
 }
 dragEnd(e,cancel=false){
   const d=this.drag;if(!d||d.id!==e.pointerId)return;
   if(d.moved){this.suppressClick=d.b;
     if(!cancel&&this.grid){
       const g=this.grid,slot=this.slots[d.b.dataset.id];
       const x=this.layout.clamp(Math.round(slot.x+(e.clientX-d.x)/g.width),0,g.columns-1);
       const y=this.layout.clamp(Math.round(slot.y+(e.clientY-d.y)/g.height),0,g.rows-1);
       if(this.layout.move(this.prefs,this.slots,d.b.dataset.id,x,y,g))this.persist();
     }
   }this.cancelDrag();this.arrange();
 }
 persist(){this.options.savePreferences?.(this.prefs);root.dispatchEvent(new Event('platdo:citydesktopchange'));}
 paintWallpaper(){this.desk.style.backgroundImage=this.prefs.wallpaper==='personal'?'url("'+this.prefs.image+'")':this.layout.backgrounds[this.prefs.wallpaper];}
 setStart(on){this.menu.hidden=!on;this.keys.clear();this.lastTick=0;this.host.querySelector('[data-pc=start]').setAttribute('aria-expanded',String(on));}
 async upload(file){
   if(!file)return;const serial=(this.uploadSerial||0)+1;this.uploadSerial=serial;
   const status=this.main.querySelector('.pc-picture-status');if(status)status.textContent='Preparing picture…';
   try{const image=await this.layout.loadPicture(file);
     if(this.closed||this.uploadSerial!==serial||this.page!=='settings')return;
     this.prefs.image=image;this.wallpaper('personal');
   }catch(err){if(!this.closed&&this.uploadSerial===serial&&status)status.textContent=err.message||'This picture could not be opened.';}
 }
 wallpaper(id){this.uploadSerial=(this.uploadSerial||0)+1;if(!Object.hasOwn(this.layout.wallpapers,id)&&!(id==='personal'&&this.prefs.image))return;this.prefs.wallpaper=id;this.persist();this.paintWallpaper();this.render();}
 settings(){
   const list={...this.layout.wallpapers};if(this.prefs.image)list.personal={name:'My picture'};
   this.main.innerHTML='<small>PERSONALIZATION</small><h2>Desktop background</h2><div class="pc-wallpaper-list">'+Object.entries(list).map(([id,p])=>button('wall',p.name,'data-wall="'+id+'" aria-pressed="'+(id===this.prefs.wallpaper)+'"')).join('')+'</div><label class="pc-picture-picker">Browse pictures<input type="file" class="pc-picture-input" accept="image/jpeg,image/png,image/webp"></label><p class="pc-picture-status" role="status"></p>'+button('desktop','Back to desktop');
   for(const el of this.main.querySelectorAll('[data-wall]'))el.style.setProperty('--wallpaper',el.dataset.wall==='personal'?'url("'+this.prefs.image+'")':this.layout.backgrounds[el.dataset.wall]);
 }
 back(){
   if(!this.menu.hidden){this.setStart(false);return;}
   if(this.page==='desktop'){this.options.leave();return;}
   if(this.page==='instructions')this.page=this.priorPage;
   else if(this.page==='running'){this.page='title';this.game=null;}
   else this.page='desktop';
   this.keys.clear();this.render();
 }
 play(){
   const G=root.CityArcade;
   this.game=new ({snake:G.Snake,breaker:G.Breaker,memory:G.Memory}[this.selected])();
   this.page='running';this.lastTick=0;this.keys.clear();this.render();
 }
 render(){
   cancelAnimationFrame(this.frame);this.frame=0;
   this.board=null;this.status=null;this.stats=null;this.cells=null;this.memoryState='';
   this.taskPreview.hidden=true;this.setStart(false);this.window.hidden=this.page==='desktop';this.shortcuts.inert=!this.window.hidden;this.main.scrollTop=0;
   const title=this.page==='desktop'?'Desktop':this.page==='settings'?'Settings':library[this.selected].name;
   this.window.querySelector('header strong').textContent=title;this.host.querySelector('.pc-bar-app').textContent=title;
   if(this.page==='desktop'){
     this.main.replaceChildren();this.arrange();return;
   }
   if(this.page==='settings'){this.settings();return;}
   const a=library[this.selected];this.main.style.setProperty('--pc-accent',a.color);
   const nav='<nav>'+button('desktop','Back to desktop')+'</nav>';
   if(this.page==='instructions'){this.main.innerHTML='<small>PLAYER GUIDE</small><h2>'+a.name+'</h2><p>'+a.how+'</p>'+button('back','Back')+nav;return;}
   if(this.page==='title'){this.main.innerHTML='<small>ARCADE / LOCAL</small><h2>'+a.name+'</h2><p>'+this.bestText()+'</p><div class="pc-commands">'+button('play','Play')+button('help','Instructions')+'</div>'+nav;return;}
   const memory=this.selected==='memory',snake=this.selected==='snake';
   this.main.innerHTML='<div class="pc-game-head"><h2>'+a.name+'</h2><output class="pc-stats"></output></div>'+
     (memory?'<div class="pc-memory">'+Array.from({length:16},(_,i)=>button('flip','?','data-cell="'+i+'"')).join('')+'</div>':
     '<canvas class="pc-board" aria-label="'+a.name+' board" width="'+(snake?320:360)+'" height="'+(snake?320:240)+'"></canvas>')+
     '<div class="pc-status" role="status"></div>'+
     (snake?'<div class="pc-dpad">'+[['up','↑'],['left','←'],['down','↓'],['right','→']].map(([id,text])=>button(id,text,'aria-label="Turn '+id+'"')).join('')+'</div>':memory?'':button('launch','Launch'))+
     '<div class="pc-commands">'+button('play','Restart')+button('help','Instructions')+button('desktop','Back to desktop')+'</div>';
   this.board=this.main.querySelector('canvas');this.stats=this.main.querySelector('.pc-stats');this.status=this.main.querySelector('.pc-status');
   this.cells=[...this.main.querySelectorAll('[data-cell]')];this.draw();this.frame=requestAnimationFrame(t=>this.tick(t));
 }
 click(e){
   const b=e.target.closest('[data-pc]');if(!b)return;
   if(this.suppressClick===b&&e.detail){this.suppressClick=null;return;}
   let cmd=b.dataset.pc;
   if(cmd==='task'){this.previewTask();return;}
   if(cmd==='closeApp'){this.page='desktop';this.game=null;this.keys.clear();this.render();return;}
   if(cmd==='start'){this.setStart(this.menu.hidden);return;}
   if(cmd==='startApp')cmd=b.dataset.id==='settings'?'settings':library[b.dataset.id]?'app':'legacy';
   this.setStart(false);
   if(cmd==='settings'){this.keys.clear();this.game=null;this.page='settings';this.render();return;}
   if(cmd==='wall')return this.wallpaper(b.dataset.wall);
   if(cmd==='leave')return this.options.leave();
   if(cmd==='desktop'){this.page='desktop';this.game=null;this.keys.clear();return this.render();}
   if(cmd==='back')return this.back();
   if(cmd==='app'){this.selected=b.dataset.id;this.page='title';return this.render();}
   if(cmd==='legacy')return this.options.launch(b.dataset.id);
   if(cmd==='help'){this.priorPage=this.page;this.page='instructions';this.keys.clear();return this.render();}
   if(cmd==='play')return this.play();
   if(this.page!=='running')return;
   if(cmd==='flip')this.game.pick(Number(b.dataset.cell));
   if(cmd==='launch')this.game.launch();
   const d={up:dirs.ArrowUp,left:dirs.ArrowLeft,down:dirs.ArrowDown,right:dirs.ArrowRight}[cmd];
   if(d)this.game.turn(...d);
   this.draw();
 }
 key(e,down){
   if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(down&&!e.repeat)this.back();return;}
   if(this.page==='desktop'&&down&&e.altKey&&dirs[e.code]&&this.options.pc()){
     const el=document.activeElement?.closest('.pc-shortcut');if(el){const id=el.dataset.id,d=dirs[e.code],p=this.slots[id],g=this.grid;
       e.preventDefault();e.stopImmediatePropagation();
       if(this.layout.move(this.prefs,this.slots,id,this.layout.clamp(p.x+d[0],0,g.columns-1),this.layout.clamp(p.y+d[1],0,g.rows-1),g)){this.persist();this.arrange();}
       return;}
   }
   const d=dirs[e.code];if(!this.menu.hidden||this.page!=='running'||(!d&&e.code!=='Space')||this.selected==='memory')return;
   e.preventDefault();e.stopImmediatePropagation();if(!this.options.pc())return;
   if(down){this.keys.add(e.code);if(this.selected==='snake'&&d)this.game.turn(...d);else if(e.code==='Space'&&!e.repeat)this.game.launch?.();}
   else this.keys.delete(e.code);
 }
 paddle(e){
   if(this.page!=='running'||this.selected!=='breaker'||e.target!==this.board)return false;
   if(e.pointerType==='mouse'&&!this.options.pc())return false;
   const rect=this.board.getBoundingClientRect();this.game.move((e.clientX-rect.left)*360/rect.width);return true;
 }
 bestText(){
   const v=this.options.records()[this.selected];
   if(this.selected==='memory')return v?'Best '+v.moves+' moves · '+clock(v.time):'Best —';
   return 'Best '+(v||0);
 }
 record(){
   const g=this.game,records=this.options.records(),id=this.selected,previous=records[id];
   if(id==='memory'){
     if(g.status!=='won'||previous&&(previous.moves<g.moves||previous.moves===g.moves&&previous.time<=g.time))return;
     records[id]={moves:g.moves,time:g.time};
   }else{if(!g.score||g.score<=(previous||0))return;records[id]=g.score;}
   this.options.save(records);
 }
 draw(){
   const g=this.game;if(!g||!this.stats)return;
   const id=this.selected;
   if(id==='memory'){
     const state=g.up.join(',')+'|'+g.matched.size;
     if(this.memoryState!==state){this.memoryState=state;for(let i=0;i<16;i++){const matched=g.matched.has(i),face=matched||g.up.includes(i),b=this.cells[i];
       b.textContent=face?symbols[g.cards[i]]:'?';b.dataset.face=matched?'matched':face?'up':'down';b.setAttribute('aria-label',face?'Card '+(i+1)+' '+b.textContent:'Reveal card '+(i+1));b.setAttribute('aria-disabled',String(matched));}}
   }else{
     const c=this.board.getContext('2d'),w=this.board.width,h=this.board.height;c.fillStyle='#101f2b';c.fillRect(0,0,w,h);
     if(id==='snake'){c.strokeStyle='#1c303c';c.lineWidth=1;for(let i=1;i<20;i++){c.beginPath();c.moveTo(i*16+.5,0);c.lineTo(i*16+.5,320);c.moveTo(0,i*16+.5);c.lineTo(320,i*16+.5);c.stroke();}
       c.fillStyle='#ffe08b';c.fillRect(g.food.x*16+3,g.food.y*16+3,10,10);g.snake.forEach((s,i)=>{c.fillStyle=i?'#6bbb96':'#c3ffc8';c.fillRect(s.x*16+1,s.y*16+1,14,14);});
     }else{for(const t of g.bricks){c.fillStyle=['#fa977c','#ffc58c','#f3d99b','#86ccc9','#bab4fb'][t.row];c.fillRect(t.x,t.y,t.w,t.h);}c.fillStyle='#f6f1dd';c.fillRect(g.paddle-27,213,54,6);c.beginPath();c.arc(g.ball.x,g.ball.y,g.ball.r,0,Math.PI*2);c.fill();}
   }
   this.record();const stats=(id==='memory'?g.moves+' moves · '+clock(g.time):g.score+' pts'+(id==='breaker'?' · '+g.lives+' lives':''))+'  /  '+this.bestText();
   if(this.stats.textContent!==stats)this.stats.textContent=stats;
   const banner=g.status==='won'?'You win!':g.status==='lost'?'Game over':g.status==='ready'?'Ready to launch':'';
   if(this.status.textContent!==banner)this.status.textContent=banner;
 }
 tick(now){
   this.frame=requestAnimationFrame(t=>this.tick(t));
   if(document.hidden||!this.menu.hidden||this.page!=='running'){this.lastTick=0;return;}
   const dt=this.lastTick?Math.min(.12,(now-this.lastTick)/1000):0;this.lastTick=now;
   if(this.selected==='breaker')this.game.axis=Number(this.keys.has('ArrowRight')||this.keys.has('KeyD'))-Number(this.keys.has('ArrowLeft')||this.keys.has('KeyA'));
   this.game.update(dt);
   if(!this.lastDraw||now-this.lastDraw>=1000/(root.Platdo?.frameRate||60)-.5){this.draw();this.lastDraw=now;}
 }
}
Desktop.apps=apps;root.CityHomeComputer=Desktop;
})(window);

