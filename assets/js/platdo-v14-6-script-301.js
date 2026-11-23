(function(root){
  'use strict';
  const subs=new Set(),pending=new Map(),api=()=>root.PlatdoAccount;
  const game=mode=>mode==='city'?root.PlatdoCity:root.PlatdoDrive;
  const route=()=>['city','drive'].includes(location.hash.slice(1))?location.hash.slice(1):null;
  const current={availability:'guest',error:'',social:null,progress:'',mode:null};
  let garageVisit=null,launchTask=Promise.resolve(),lastLaunchRevision=-1;
  let socket,view,uid,name,profileImage,connectTask,generation=0,retryTimer,lastInput=0,busy=false,menuOpen=false,expectedRoute=null,stopped=false;
  async function accountPhoto(){const src=api()?.getState?.().user?.photoURL;if(!src||!/^https:\/\/|^data:image\/(jpeg|png|webp);base64,/.test(src))return '';try{const image=new Image();image.crossOrigin='anonymous';image.src=src;await bounded(image.decode(),3500,'Profile image unavailable.');const canvas=document.createElement('canvas');canvas.width=canvas.height=64;canvas.getContext('2d').drawImage(image,0,0,64,64);return canvas.toDataURL('image/jpeg',.75);}catch{return '';}}
  const emit=()=>{for(const f of subs)f({...current});};
  const status=(text='')=>{current.progress=text;emit();};
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const bounded=(promise,ms,message)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(message)),ms);promise.then(x=>{clearTimeout(timer);resolve(x);},e=>{clearTimeout(timer);reject(e);});});
  async function endpoint(){
    if(location.protocol==='file:')return '';
    let configured=root.PlatdoFriendsEndpoint;
    if(!configured){
      const response=await fetch(new URL('multiplayer-config.json',location.href),{cache:'no-cache',credentials:'omit',redirect:'error'});
      if(response.status===404||!response.ok)return '';
      try{configured=(await response.json()).serverUrl;}catch{return '';}
    }
    if(!configured)return '';
    const u=new URL(configured),loopback=['localhost','127.0.0.1','[::1]'];
    if(u.username||u.password||u.search||u.hash||!['/','/friends','/socket.io','/socket.io/'].includes(u.pathname))throw Error('Invalid multiplayer host configuration.');
    if(u.protocol==='wss:')u.protocol='https:';
    if(u.protocol==='ws:')u.protocol='http:';
    if(u.protocol!=='https:'&&!(u.protocol==='http:'&&loopback.includes(u.hostname)&&loopback.includes(location.hostname)))throw Error('An HTTPS multiplayer host is required.');
    return u.origin;
  }
  function sendInput(params){
    if(socket?.connected&&current.availability==='online'&&!menuOpen)socket.volatile.emit('packet',{action:'input',params});
  }
  function request(action,params={}){
    if(!socket?.connected)return Promise.reject(Error('Friends server is offline.'));
    const id=crypto.randomUUID();
    return new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{pending.delete(id);reject(Error('The host did not respond. Try again.'));},25000);
      pending.set(id,{resolve,reject,timeout});socket.emit('packet',{id,action,params});
    });
  }
  function teardown(message=''){
    garageVisit=null;lastLaunchRevision=-1;
    root.PlatdoNameplates?.clear();
    if(view){const prior=view;view=null;prior.close?.();game(prior.room.mode)?.onlineStop?.();}
    expectedRoute=null;current.progress='';if(message)current.error=message;emit();
  }
  function reset(){
    generation++;clearTimeout(retryTimer);if(socket){socket.removeAllListeners();socket.disconnect();socket=null;}
    for(const p of pending.values()){clearTimeout(p.timeout);p.reject(Error('Connection closed.'));}pending.clear();
    connectTask=null;current.social=null;teardown();current.error='';
  }
  function consume(message){
    if(!message||typeof message!=='object')return;
    if(message.id){const p=pending.get(message.id);if(!p)return;clearTimeout(p.timeout);pending.delete(message.id);if(message.error)p.reject(Error(message.error));else p.resolve(message.result);return;}
    if(message.event==='social'){current.social=message.state;emit();}
    /* V13.0: Christmas Mode changed on the host (for everyone), or this account was given the Christmas Day gift */
    if(message.event==='season'&&message.season&&typeof message.season.christmas==='boolean'){if(current.social)current.social={...current.social,season:message.season};root.dispatchEvent(new CustomEvent('platdo:season',{detail:message.season}));emit();}
    if(message.event==='gift')root.dispatchEvent(new CustomEvent('platdo:gift',{detail:{title:String(message.title||''),items:Array.isArray(message.items)?message.items:[]}}));
    if(message.event==='homeOwnership'&&message.ownership){
      current.homeOwnership=message.ownership;
      if(view?.room.mode==='city'&&root.PlatdoCity?.sim)root.PlatdoCity.sim.homeOwnership=message.ownership;
      if(message.ownership.state==='error')current.error=message.ownership.error||'Home verification unavailable. You can continue in public and retry.';
      emit();
    }
    /* V9.6: group chats */if(message.event==='groupText'&&message.message)root.dispatchEvent(new CustomEvent('platdo:groupmessage',{detail:message.message}));if(message.event==='phoneGroup')root.dispatchEvent(new CustomEvent('platdo:groupchange',{detail:{id:message.id}}));
    if(message.event==='cityText'&&message.message){
      root.dispatchEvent(new CustomEvent('platdo:message',{detail:message.message}));
      if(message.message.room===view?.room.id&&view?.room.mode==='city')root.PlatdoCity?.onlineText?.(message.message);
    }
    if(message.event==='world')view?.accept(message.snapshot);
    if(message.event==='roomStart'&&message.room&&message.snapshot){
      launchTask=launchTask.catch(()=>{}).then(async()=>{if(current.social?.session?.id!==message.room.id||message.room.revision<=lastLaunchRevision)return;status('Starting activity');try{await start(message);lastLaunchRevision=message.room.revision;}catch(e){current.error=e.message;root.PlatdoFriendsPanel?.open('drive');}finally{status();}});
    }
    if(message.event==='ended'&&!busy){teardown(message.message);root.PlatdoFriendsPanel?.open(route()||'city');}
  }
  function connect(){
    if(connectTask)return connectTask;const gen=generation;
    connectTask=(async()=>{
      const address=await endpoint();if(gen!==generation)return;
      if(!address){current.availability='unconfigured';emit();return;}
      current.availability='connecting';current.error='';emit();
      const token=await api().getIdentityToken();if(gen!==generation)return;
      const personal=root.PlatdoAvatar?.get?.()?.character||game('city')?.sim?.profile?.character;
      const avatar=Number(String(personal||'').match(/^player-(\d+)$/)?.[1])||0;
      const photo=await accountPhoto();if(gen!==generation)return;
      const ws=root.io(address,{path:'/socket.io',transports:['websocket'],forceNew:true,reconnection:false,autoConnect:false,timeout:9000,auth:{token,name,avatar,photo}});
      socket=ws;ws.on('packet',consume);
      ws.on('disconnect',()=>{
        if(gen!==generation||ws!==socket)return;socket=null;
        for(const p of pending.values()){clearTimeout(p.timeout);p.reject(Error('Connection lost.'));}pending.clear();
        current.social=null;current.availability='error';current.error=view?'Reconnecting to your session…':'Friends server is offline.';view?.suspend?.(true,'network');emit();
        scheduleRetry();
      });
      await bounded(new Promise((resolve,reject)=>{ws.once('connect',resolve);ws.once('connect_error',reject);ws.connect();}),10000,'Connection timed out.');
      const state=await request('state');if(gen!==generation)return;
      current.availability='online';current.social=state;current.error='';emit();reportPresence();
      if(state.session?.canReconnect&&(view?.room.id===state.session.id||sessionStorage.getItem('platdoLiveRoom')===state.session.id)){
        status('Reconnecting');const restored=await request('reserve',{room:state.session.id,version:1});await start(restored);status();
      }else if(view)teardown('This session ended while you were disconnected.');
    })().catch(e=>{if(gen!==generation)return;current.availability='error';current.error=e.message;emit();socket?.disconnect();scheduleRetry();}).finally(()=>{if(gen===generation)connectTask=null;});
    return connectTask;
  }
  function scheduleRetry(){
    clearTimeout(retryTimer);const gen=generation;
    if(!stopped&&uid)retryTimer=setTimeout(()=>{if(gen===generation&&current.availability!=='online')connect();},4000);
  }
  function account(){
    const info=api()?.getAccountEligibility?.(),user=api()?.getState?.().user;
    const next=info?.permanent?info.uid:null;
    if(next===uid){
      if(uid&&(user?.displayName!==name||user?.photoURL!==profileImage)){name=user?.displayName||'Platdo player';profileImage=user?.photoURL;const gen=generation;if(current.availability==='online')accountPhoto().then(photo=>{if(gen===generation)return request('profile',{name,avatar:current.social?.me.avatar||0,photo});}).catch(()=>{});}
      return;
    }
    reset();uid=next;name=user?.displayName||'Platdo player';profileImage=user?.photoURL;if(uid&&!stopped)connect();else{current.availability='guest';emit();}
  }
  function reportPresence(){
    current.mode=route();emit();
    if(current.availability==='online')request('presence',{mode:current.mode}).catch(()=>{});
  }
  function menu(open){
    menuOpen=!!open;view?.suspend?.(menuOpen);root.Platdo?.controls?.clear?.();if(open&&document.pointerLockElement)document.exitPointerLock();
    if(route())game(route())?.onlineMenu?.(!!open);
  }
  async function checkpoint(){
    if(route()&&game(route())?.onlineCheckpoint?.()===false)throw Error('Your game could not save yet. Finish the current action and retry.');
    const saved=await bounded(api().syncNow(),24000,'Cloud save timed out. Your current game is still open.');
    if(!saved||saved.conflicts||api().getState().syncStatus!=='saved')throw Error('Cloud progress needs attention. Resolve the save in Account and retry.');
  }
  async function start(admission){
    const room=admission.room,engine=game(room.mode),chase=room.activity==='cop-chase';if(!engine?.onlineStart)throw Error('Game update required.');
    if(room.mode==='drive'&&room.phase==='waiting'){
      if(view)teardown();expectedRoute='drive';if(route()!=='drive'){root.PlatdoHub.openGame('platdo-drive');await wait(75);}await bounded(engine.prepare(),22000,'Garage loading timed out.');engine.setVisible(true);expectedRoute=null;sessionStorage.setItem('platdoLiveRoom',room.id);root.PlatdoFriendsPanel?.openRooms('drive');emit();return;
    }
    if(view?.room.id!==room.id||view?.room.revision!==room.revision||view?.room.activity!==room.activity){
      if(view)teardown();expectedRoute=room.mode;
      if(route()!==room.mode){root.PlatdoHub.openGame('platdo-'+room.mode);await wait(75);}
      if(!chase)await bounded(engine.prepare(),22000,'World loading timed out.');
      const self=admission.snapshot?.changes?.['p:'+current.social.me.code];
      engine.setVisible(true);if(!chase&&engine.onlineStart({...room,ownCar:self?.type,ownPaint:self?.paint})===false)throw Error('Could not initialize this game. Return to its menu and retry.');
    }
    view?.close?.();
    view=chase?new root.PlatdoChaseRoomView(room,current.social.me.code,{sendInput,onExit:()=>root.PlatdoFriendsPanel.open('drive')}):new root.PlatdoRoomView(room,current.social.me.code);
    if(chase)root.PlatdoFriendsPanel.open('drive');
    view.accept(admission.snapshot);
    view.accept(await request('snapshot'));
    expectedRoute=null;sessionStorage.setItem('platdoLiveRoom',room.id);if(!chase){root.PlatdoFriendsPanel?.close();menu(false);}lastInput=0;emit();
  }
  async function transition(action,params,destination){
    if(busy)throw Error('A session change is already in progress.');
    if(route()||view){const ending=current.social?.session?.isOwner?' Your current session will end.':'';if(!confirm('Go to '+destination+'? Your progress will be saved first.'+ending))return false;}
    let reservation,committed=false;busy=true;current.error='';
    try{
      status('Connecting');const admission=await request(action,{...params,version:1});
      if(admission.restored){await start(admission);return true;}
      reservation=admission.reservation;
      status('Loading World');const engine=game(admission.room.mode);
      if(typeof engine?.onlineStart!=='function')throw Error('Game update required.');
      if(admission.room.activity!=='cop-chase')await bounded(engine.prepare(),22000,'World loading timed out.');
      await checkpoint();
      status('Joining');const joined=await request('commit',{reservation,continuePublic:root.PlatdoHomeEntitlements?.getState().continuePublic===true});committed=true;await start(joined);return true;
    }catch(e){if(reservation&&!committed)await request('release').catch(()=>{});if(committed){await request('leave').catch(()=>{});teardown();}current.error=e.message;throw e;}
    finally{busy=false;status();}
  }
  async function leave(force){
    if(busy)return false;const room=current.social?.session;if(!room)return false;
    if(force!==true&&!confirm(room.isOwner?'End this session for all '+room.count+' players?':'Leave this session and return to the game menu?'))return false;
    busy=true;try{status('Saving progress');await checkpoint();await request('leave');sessionStorage.removeItem('platdoLiveRoom');teardown();return true;}finally{busy=false;status();}
  }
  async function action(kind,params={}){
    if(kind==='block'&&current.social?.session?.players.some(p=>p.code===params.code)&&!current.social.session.isOwner)await checkpoint();
    return request(kind,params);
  }
  function frame(mode,sim,input){
    if(view?.room.mode!==mode)return false;
    if(view.room.activity==='cop-chase')return false;
    if(performance.now()-lastInput>=48&&socket?.connected&&current.availability==='online'){
      // Explicit wire schema excludes raycasts, scene objects and account inventory.
      const raw=menuOpen?{}:typeof input==='function'?input():input||{},p={};
      for(const key of ['moveX','moveZ','throttle','steer','brake','sprint','crouch','walk','handbrake','jumpPressed','vehiclePressed','interactPressed','cameraYaw','vehicle'])if(raw[key]!==undefined)p[key]=raw[key];
      if(mode==='drive')for(const key of ['gear','transmission','headlights'])if(raw[key]!==undefined)p[key]=raw[key];
      if(mode==='city'){
        for(const key of ['aim','fire','firePressed','weapon','poopPressed','poopHeld','urinatePressed','reloadPressed','holsterPressed','throwPressed','phoneHeld','scout','seatbeltPressed','vehicleJumpPressed','lightsPressed','hornPressed','coverPressed','crouchPressed','hazardsPressed','radioPressed'])if(raw[key]!==undefined)p[key]=raw[key];
        p.cameraPitch=sim.camera?.pitch||0;
      }
      {const yaw=sim.camera?.yaw??p.cameraYaw;if(Number.isFinite(yaw))p.cameraYaw=Math.atan2(Math.sin(yaw),Math.cos(yaw));}
      const reliable=mode==='city'&&(p.weapon||Object.keys(p).some(key=>key.endsWith('Pressed')&&p[key]));
      (reliable?socket:socket.volatile).emit('packet',{action:'input',params:p});lastInput=performance.now();
    }
    view.apply(sim);return true;
  }
  function visitDriveGarage(onReturn){
    if(view?.room.mode!=='city'||garageVisit||!root.PlatdoDrive?.ready)return false;
    const room=view;
    garageVisit=room;
    root.PlatdoDrive.openFromCity(()=>{
      garageVisit=null;
      location.hash='city';
      onReturn(view===room);
    });
    return true;
  }
  root.PlatdoFriends={visitDriveGarage,async refreshDriveGarage(){await checkpoint();return request('driveGarage',{});},subscribe(fn){subs.add(fn);fn({...current});return()=>subs.delete(fn);},getState:()=>({...current}),get view(){return view;},menu,frame,action,
    open:mode=>root.PlatdoFriendsPanel?.open(mode||route()||'city'),returnToMenu(){
      if(current.availability==='online'||!view)return;
      if(!confirm('Return to the game menu? The host will keep your last acknowledged online progress.'))return;
      sessionStorage.removeItem('platdoLiveRoom');teardown();
    },signIn(){root.PlatdoFriendsPanel?.close();root.PlatdoHub.openAccount();},
    retry(){if(current.availability==='online')return Promise.resolve();return connect();},
    join:(room,opts={})=>transition('reserve',{room:room.id,invite:opts.invite,code:opts.privateCode||opts.code},(opts.name||room.owner?.name||'your friend')+' in Platdo '+(room.mode==='city'?'City':'Drive')),
    host:(mode,privacy,options={})=>transition('host',{mode,privacy,deferStart:mode==='drive',pedestrians:mode==='city'?Math.round(root.Platdo?.graphics?.get('platdo-city')?.pedestrians??44):undefined,/* V14.2 */traffic:mode==='city'?Math.round(root.Platdo?.graphics?.get('platdo-city')?.traffic??100):undefined,map:root.PlatdoDrive?.save?.selectedMap},'a new '+(mode==='city'?'City':'Drive')+' room'),leave};
  root.addEventListener('platdo:graphicschange',e=>{
    if(e.detail?.id!=='platdo-city')return;const room=current.social?.session;
    if(room?.mode==='city'&&room.isOwner&&room.playingHere&&current.availability==='online')request('setCityPopulation',{pedestrians:Math.round(e.detail.values.pedestrians),/* V14.2 */traffic:Math.round(e.detail.values.traffic??100)}).catch(e=>{current.error=e.message;emit();});
  });
  root.addEventListener('platdo:accountchange',account);root.addEventListener('hashchange',()=>{reportPresence();if(garageVisit===view&&view&&route()==='drive')return;if(view&&!busy&&expectedRoute!==route()&&route()!==view.room.mode){const prior=view.room.mode;location.hash=prior;root.PlatdoFriendsPanel?.open(prior);current.error='Leave your session before switching games.';emit();}});
  root.addEventListener('pagehide',()=>{stopped=true;reset();});
  root.addEventListener('pageshow',e=>{if(e.persisted){stopped=false;uid=undefined;account();}});
  root.Platdo?.registerResetHandler?.('platdo-city',async()=>{if(!uid)return;if(current.availability!=='online')throw Error('Connect to the multiplayer server before clearing your account message history.');await request('phoneReset');root.dispatchEvent(new Event('platdo:messagesreset'));});
  account();
})(window);
