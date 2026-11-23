(function(root){
  'use strict';
  /* V10.8: houses are homes too: an apartment is named Home 101, The Lantern; a house by its address */const homeName=o=>o?.house?(o.building||'your house'):'Home '+o?.number+', '+o?.building,homeShort=o=>o?.house?(o.building||'your house'):'Home '+o?.number;
  const net=root.PlatdoFriends,el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
  const tabs=['Friends','Rooms','Requests','Add Friend','Invites'],label=mode=>mode==='drive'?'Drive':'City';
  let box,body,banner,bar,heading,notice,prior,tab=tabs[0],filter='',lookup=null,search='',mode='city',privacy='friends',error='',message='',working=false,expanded=null,page=1,hostForm=false;
  let activity='free-drive',minutes=3,rolePolicy='manual',privateCode='',roomList=[],roomRequest=0,roomInterval;
  let lobbyScreen='main',lobbyMap='coastline',lobbyDensity=12,lobbyMode='free',waitingPaused=false,lobbyRoom=null,lobbyRevision=-1,lobbyVisit=null,returnButton=null;
  const roomName=room=>room.activity==='cop-chase'?'Cop Chase':room.mode==='drive'?(room.phase==='waiting'?'Drive room':({free:'Free Drive',trial:'Time Trial',rush:'Traffic Rush'})[room.driveMode]||'Free Drive'):'City Sandbox';
  const privacyName={public:'Public',private:'Private code',friends:'Friends only',invite:'Invite only'};
  const announced=new Set();
  const state=()=>net.getState(),cmd=(name,params={})=>net.action(name,params);
  function button(text,fn,classes){const b=el('button',text,classes);b.type='button';b.onclick=fn;return b;}
  function run(fn,ok){return async()=>{if(working)return;working=true;error=message='';render();
    try{await fn();if(ok)message=ok;}catch(e){error=e.message;}finally{working=false;render();}};}
  function waiting(){const s=state().social?.session;return s?.mode==='drive'&&s.phase==='waiting'&&!s.isOwner&&s.playingHere;}
  function close(){if(!box?.open)return;if(waiting()){waitingPaused=!waitingPaused;render();return;}if(state().social?.session?.mode==='drive'&&state().social.session.phase==='waiting'){lobbyScreen='main';render();return;}root.PlatdoWaitingGame?.close();roomRequest++;clearInterval(roomInterval);box.close();net.menu(false);if(prior?.isConnected)prior.focus({preventScroll:true});}
  function open(next='city',options={}){
    mode=next==='drive'?'drive':'city';
    if(options.rooms||options.chase){tab='Rooms';if(options.chase){mode='drive';activity='cop-chase';hostForm=true;}}
    if(!box)install();if(!box.open){prior=document.activeElement;error=message='';page=1;net.menu(true);box.showModal();roomInterval=setInterval(()=>{if(tab==='Rooms'&&!document.hidden)refreshRooms();},6000);}render();if(tab==='Rooms')refreshRooms();
  }
  function install(){
    box=el('dialog',undefined,'pf-dialog');box.setAttribute('aria-label','Friends');box.id='platdoFriendsDialog';
    const head=el('header');const titles=el('div');titles.append(el('small','PLATDO SOCIAL'),el('h1','Friends'));heading=el('span');head.append(titles,heading,button('×',close,'pf-close'));head.lastChild.setAttribute('aria-label','Close Friends');
    bar=el('nav');bar.setAttribute('aria-label','Friends tabs');banner=el('p',undefined,'pf-feedback');banner.setAttribute('role','status');body=el('section',undefined,'pf-body');box.append(head,bar,banner,body);document.body.append(box);
    box.addEventListener('cancel',e=>{e.preventDefault();close();});
  }
  function portrait(p){const avatar=el('span',undefined,'pf-avatar');avatar.setAttribute('aria-hidden','true');avatar.style.setProperty('--pf-hue',String((p.avatar||0)*47%360));avatar.textContent=['🧑🏻','👩🏾','👨🏼','🧑🏽','👩🏻','👨🏿','🧑🏼','👩🏽'][Math.abs(p.avatar||0)%8];return avatar;}
  function row(p,sub){const r=el('article',undefined,'pf-row'),info=el('div',undefined,'pf-id'),actions=el('div',undefined,'pf-actions');info.append(el('strong',p.name),el('small','#'+p.code));if(sub)info.append(el('span',sub,'pf-status'));r.append(portrait(p),info,actions);return {r,actions};}
  function socialAction(actions,text,kind,code,extra={}){
    actions.append(button(text,run(async()=>{await cmd(kind,{code,...extra});if(lookup?.code===code)lookup=await cmd('lookup',{code});},text==='Add Friend'?'Friend request sent.':'Updated.')));
  }
  function joinButton(actions,room,opts){actions.append(button('Join Game',run(()=>net.join(room,opts)),'pf-primary'));}
  function friend(p,s){
    const status=p.status+(p.room?' · '+p.room.count+'/'+p.room.capacity+' Players':''),{r,actions}=row(p,status);
    if(p.join)joinButton(actions,p.room,{code:p.code,name:p.name});
    else if(p.room)actions.append(el('small',p.reason||'Already in this session.'));
    if(s.session?.isOwner&&s.session.playingHere&&!s.session.players.some(x=>x.code===p.code)){
      actions.append(button('Invite to Game',run(async()=>{try{await cmd('invite',{code:p.code});}catch(e){if(!e.message.startsWith('Allow this removed')||!confirm('Allow '+p.name+' back into your session?'))throw e;await cmd('invite',{code:p.code,allowBack:true});}},'Invitation sent.')));
    }else if(s.session&&!s.session.isOwner)actions.append(button('Invite to Game',()=>{message='The session owner manages invitations.';render();}));
    const details=el('details',undefined,'pf-overflow');details.append(el('summary','More'));const list=el('div');
    /* V10.0: apartment access for this friend (your homes on this server) */
    const ap=s.apartments||{owned:[],given:[]},visits=(ap.given||[]).filter(g=>g.to.code===p.code);
    for(const o of ap.owned||[])if(!visits.some(g=>g.unit===o.unit))list.append(button((ap.owned.length>1?'Give Access to '+homeName(o):'Give Home Access'),run(()=>cmd('apartment',{kind:'grant',code:p.code,unit:o.unit}),p.name+' can now visit '+homeShort(o)+'.')));
    if(visits.length)list.append(button('Revoke Home Access',run(async()=>{if(confirm('Take away '+p.name+'\u{2019}s access to '+(visits.length>1?'your homes':''+homeShort(visits[0]))+'?'))await cmd('apartment',{kind:'revoke',code:p.code});},'Access taken away.')));
    list.append(button('View profile',()=>{expanded=expanded===p.code?null:p.code;render();}),button('Remove Friend',run(async()=>{if(confirm('Remove '+p.name+' from both friends lists?'))await cmd('remove',{code:p.code});})),button('Block',run(async()=>{
      const leaving=s.session&&!s.session.isOwner&&s.session.players.some(x=>x.code===p.code);
      if(confirm(leaving?'Block '+p.name+' and leave your shared session?':'Block '+p.name+'? This removes the friendship and pending invitations.'))await cmd('block',{code:p.code});
    })));details.append(list);actions.append(details);body.append(r);
    if(expanded===p.code)body.append(el('p',p.name+' · Friend code #'+p.code+' · '+status+(visits.length?' · Can visit your '+visits.map(g=>''+homeShort(g)).join(', '):''),'pf-empty'));
  }
  function blank(text){body.append(el('p',text,'pf-empty'));}
  async function refreshRooms(){
    if(!box?.open||tab!=='Rooms'||state().availability!=='online')return;
    const token=++roomRequest;
    try{const rooms=await cmd('listRooms');if(token!==roomRequest||!box.open)return;roomList=Array.isArray(rooms)?rooms:[];render();}
    catch(e){if(token===roomRequest){error=e.message;render();}}
  }
  function choice(name,options,value,change){
    const field=el('label',name),select=el('select');select.setAttribute('aria-label',name);
    for(const [id,text] of options)select.append(new Option(text,id,false,value===id));
    select.onchange=()=>change(select.value);field.append(select);return field;
  }
  async function returnFromLobbyPanel(){
    if(!lobbyVisit)return;const kind=lobbyVisit;lobbyVisit=null;returnButton?.remove();returnButton=null;
    root.Platdo?.graphics?.close?.();if(root.PlatdoWaitingGame?.current)root.PlatdoWaitingGame.current.mount.hidden=false;
    if(state().social?.session?.mode!=='drive')return;
    box.showModal();render();
    if(kind==='garage'){working=true;render();try{await net.refreshDriveGarage();}catch(e){error=e.message;}finally{working=false;render();}}
  }
  function endLobbyVisit(){
    if(!lobbyVisit)return;
    lobbyVisit=null;returnButton?.remove();returnButton=null;
    root.Platdo?.graphics?.close?.();
    if(root.PlatdoWaitingGame?.current)root.PlatdoWaitingGame.current.mount.hidden=false;
  }
  function visitLobbyPanel(kind){
    const drive=root.PlatdoDrive;if(!drive)return;const methods={garage:'garage',records:'records',settings:'openSettings',graphics:'openGraphics',controls:'controls'};
    const method=methods[kind];if(typeof drive[method]!=='function'){error='This game panel is still loading.';render();return;}
    lobbyVisit=kind;if(root.PlatdoWaitingGame?.current)root.PlatdoWaitingGame.current.mount.hidden=true;box.close();
    drive[method]();returnButton=button('← Return to lobby',()=>returnFromLobbyPanel(),'pf-return-lobby');document.body.append(returnButton);
  }
  document.addEventListener('keydown',e=>{if(lobbyVisit&&e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();returnFromLobbyPanel();}},true);
  function lobbyTools(parent){for(const [id,title]of [['records','Records'],['garage','Garage'],['graphics','Graphics'],['settings','Settings'],['controls','Controls']])parent.append(button(title,()=>visitLobbyPanel(id)));}
  function driveLobby(s){
    const sess=s.session;if(sess?.mode!=='drive'||sess.phase!=='waiting'||!sess.playingHere)return false;
    if(lobbyRoom!==sess.id||lobbyRevision!==sess.revision){lobbyRoom=sess.id;lobbyRevision=sess.revision;lobbyScreen='main';waitingPaused=false;lobbyMap=root.PlatdoDrive?.save?.selectedMap||'coastline';lobbyDensity=root.PlatdoDrive?.save?.settings?.freeTrafficCount??12;}
    box.classList.toggle('pf-waiting-dialog',!sess.isOwner);bar.hidden=true;box.querySelector('header').hidden=!sess.isOwner;
    if(!sess.isOwner){
      root.PlatdoWaitingGame?.mount(body,sess,{onPause:()=>{waitingPaused=true;render();}});root.PlatdoWaitingGame?.current?.setPaused(waitingPaused);const waitingPause=body.querySelector('[data-waiting-pause]');if(waitingPause)waitingPause.disabled=working;
      if(waitingPaused){const pause=el('section',undefined,'pf-waiting-pause');pause.setAttribute('aria-label','Waiting game pause menu');pause.append(el('h2','Waiting for the host'),el('p','Your room stays connected while you use these menus.'),button('Resume waiting',()=>{waitingPaused=false;render();},'pf-primary'));lobbyTools(pause);pause.append(button('Leave room',run(()=>net.leave())));body.append(pause);}return true;
    }
    const panel=el('section',undefined,'pf-drive-lobby');panel.append(el('small','PLATDO DRIVE / ROOM HOST'),el('h2',lobbyScreen==='drive'?'Choose your drive':lobbyScreen==='chase'?'Cop Chase':'Choose the next activity'));
    panel.append(el('p',sess.players.map(p=>p.name+(p.connected===false?' · reconnecting':'')).join(' · ')+' · '+sess.count+'/'+sess.capacity+' players'));
    if(sess.code)panel.append(el('p','Private code · '+sess.code),button('Copy room code',run(()=>navigator.clipboard.writeText(sess.code),'Room code copied.')));
    if(lobbyScreen==='main'){
      const actions=el('div',undefined,'pf-drive-lobby-grid');actions.append(button('Drive',()=>{lobbyScreen='drive';render();},'pf-primary'),button('Cop Chase',()=>{lobbyScreen='chase';render();},'pf-primary'));lobbyTools(actions);actions.append(button('Main menu · leave room',run(()=>net.leave())));panel.append(actions);
    }else if(lobbyScreen==='drive'){
      panel.append(button('← Lobby menu',()=>{lobbyScreen='main';render();}),choice('Map',(root.DriveMaps?.list||[]).map(m=>[m.id,m.name]),lobbyMap,v=>lobbyMap=v),choice('Game mode',[['free','Free Drive'],['trial','Time Trial'],['rush','Traffic Rush']],lobbyMode,v=>lobbyMode=v));
      const field=el('label','Traffic vehicles'),slider=el('input'),value=el('output',String(lobbyDensity));slider.type='range';slider.min=0;slider.max=500;slider.step=1;slider.value=lobbyDensity;slider.setAttribute('aria-label','Room traffic density');slider.oninput=()=>{lobbyDensity=Number(slider.value);value.textContent=String(lobbyDensity);};field.append(slider,value);panel.append(field,button('Start drive',run(()=>cmd('startDrive',{activity:'drive',map:lobbyMap,driveMode:lobbyMode,trafficCount:lobbyDensity})),'pf-primary'));
    }else{
      panel.append(button('← Lobby menu',()=>{lobbyScreen='main';render();}),choice('Chase duration',Array.from({length:10},(_,i)=>[String(i+1),(i+1)+' min']),String(minutes),v=>minutes=Number(v)),choice('Roles between rounds',[['manual','Host swaps between rounds'],['automatic','Swap every round']],rolePolicy,v=>rolePolicy=v));
      const start=button('Start chase',run(()=>cmd('startDrive',{activity:'cop-chase',minutes,rolePolicy})),'pf-primary');start.disabled=sess.count!==2||sess.players.some(p=>p.connected===false);panel.append(el('p','Exactly two drivers are needed. One cop, one robber. Rounds continue automatically.'),start);
    }body.append(panel);return true;
  }
  function rooms(s){
    if(!s.session){
      const join=el('form',undefined,'pf-code'),code=el('input');
      code.type='text';code.inputMode='numeric';code.pattern='[0-9]{5}';code.maxLength=5;code.autocomplete='off';code.required=true;
      code.placeholder='Five-digit room code';code.setAttribute('aria-label','Private room code');code.dataset.pfField='private';code.value=privateCode;
      const submit=el('button','Join private room');submit.type='submit';submit.disabled=!/^\d{5}$/.test(privateCode);
      code.oninput=()=>{privateCode=code.value.replace(/\D/g,'').slice(0,5);code.value=privateCode;submit.disabled=privateCode.length!==5;};
      join.append(code,submit);join.onsubmit=e=>{e.preventDefault();if(privateCode.length===5)run(async()=>{
        if(await net.join({mode},{privateCode,name:'a private room'}))privateCode='';
      })();};body.append(join);
    }
    const header=el('div',undefined,'pf-room-list-title');header.append(el('h2','Public rooms'),button('Refresh rooms',refreshRooms));body.append(header);
    if(!roomList.length)blank('No public rooms are available.');
    for(const room of roomList){const item=el('article',undefined,'pf-row'),details=el('div',undefined,'pf-id');details.append(el('strong',roomName(room)),el('small',label(room.mode)+' · '+(room.owner?.name||'Host')+' · '+room.count+'/'+room.capacity+' players'));
      item.append(details);if(!s.session){const join=button(room.count>=room.capacity?'Full':'Join room',run(()=>net.join(room,{name:room.owner?.name||'a public room'})),'pf-primary');join.disabled=room.count>=room.capacity;item.append(join);}body.append(item);}
  }
  function session(s){
    if(!s.session){
      body.append(button(hostForm?'Hide room settings':'Create room',()=>{hostForm=!hostForm;render();},'pf-primary'));
      if(hostForm){
        const f=el('div',undefined,'pf-host');
        f.append(choice('Game',[['city','Platdo City'],['drive','Platdo Drive']],mode,v=>{mode=v;render();}));
        f.append(choice('Session privacy',Object.entries(privacyName),privacy,v=>{privacy=v;}));
        f.append(button('Create room',run(()=>net.host(mode,privacy)),'pf-primary'));body.append(f);
      }
      return;
    }
    const sess=s.session,wrap=el('div',undefined,'pf-lobby'),title=el('strong',roomName(sess)+' · '+sess.count+'/'+sess.capacity+' Players');wrap.append(title);
    if(!sess.playingHere){if(sess.canReconnect)wrap.append(button('Reconnect',run(()=>net.join(sess,{name:sess.owner.name}))));else wrap.append(el('p','Playing in another tab.'));body.append(wrap);return;}
    wrap.append(el('small',privacyName[sess.privacy]));
    if(sess.mode==='drive'&&sess.isOwner&&sess.phase!=='waiting')wrap.append(button('Choose next activity',run(()=>cmd('returnDriveLobby')),'pf-primary'));
    if(sess.code){
      const line=el('div',undefined,'pf-room-code');line.append(el('span','Private room code'),el('strong',String(sess.code)),button('Copy code',run(()=>navigator.clipboard.writeText(String(sess.code)),'Room code copied.')));wrap.append(line);
    }
    if(sess.activity==='cop-chase'){
      const snapshot=net.view?.chase,active=snapshot&&!['waiting','finished','ended','result','complete'].includes(snapshot.phase);
      const connected=sess.players.filter(p=>p.connected!==false).length;
      wrap.append(el('p',active?'Chase in progress':connected<2?'Waiting for the second driver.':sess.isOwner?'Both drivers are here. Start when ready.':'Waiting for the host to start.'),
        el('small','One cop · One robber · '+sess.minutes+' min'));
      if(snapshot?.reconnecting)wrap.append(el('p','Chase paused while a driver reconnects.'));
      if(snapshot?.outcome&&snapshot.nextRoles){
        const next=sess.players.find(p=>p.code===snapshot.nextRoles.cop);
        wrap.append(el('p','Next cop · '+(next?.name||'Waiting')+(sess.rolePolicy==='automatic'?' · automatic rotation':'')));
        if(sess.isOwner&&sess.rolePolicy!=='automatic')wrap.append(button('Swap roles for next round',run(()=>cmd('swapChaseRoles'))));
      }
      if(!active&&snapshot?.outcome==='captured'&&!snapshot.finished?.includes(s.me.code))wrap.append(button('View arrest',()=>net.view?.resume?.()));
      if(active)wrap.append(button('Return to chase',()=>net.view?.resume?.(),'pf-primary'));
      else if(sess.isOwner){const start=button(snapshot?.outcome?'Race again':'Start chase',run(()=>cmd('startChase')),'pf-primary');start.disabled=connected!==2||(snapshot?.outcome==='captured'&&Array.isArray(snapshot.finished)&&snapshot.finished.length<2);if(connected===2&&start.disabled)wrap.append(el('p','Waiting for both drivers to finish the arrest.'));wrap.append(start);}
      if(!sess.isOwner&&(!snapshot||snapshot.phase==='waiting'))root.PlatdoWaitingGame?.mount(wrap,sess);
    }
    if(sess.isOwner&&['invite','friends'].includes(sess.privacy))wrap.append(button(sess.privacy==='friends'?'Set Invite Only':'Set Friends Only',run(()=>cmd('privacy',{privacy:sess.privacy==='friends'?'invite':'friends'}))));
    for(const p of sess.players){const member=el('div');member.append(el('span',p.name+(p.code===sess.owner.code?' · Owner':'')+(p.role?' · '+p.role:'')+(p.connected===false?' · Reconnecting':'')));if(sess.isOwner&&p.code!==s.me.code)member.append(button('Remove from Session',run(async()=>{if(confirm('Remove '+p.name+' from this session?'))await cmd('kick',{code:p.code});})));wrap.append(member);}
    wrap.append(button(sess.isOwner?'End Session':'Leave Session',run(()=>net.leave())));body.append(wrap);
  }
  function render(){
    if(!box?.open)return;const st=state(),s=st.social,rows=s?.rows||[],friends=rows.filter(p=>p.rel==='friends'),incoming=rows.filter(p=>p.rel==='incoming'),sent=rows.filter(p=>p.rel==='sent'),invites=s?.invitations||[];
    if(!waiting())root.PlatdoWaitingGame?.close();
    const focus=document.activeElement,focusName=body.contains(focus)?focus.dataset.pfField:null,pos=focus?.selectionStart;
    bar.replaceChildren();body.replaceChildren();heading.textContent=st.availability==='online'?friends.filter(p=>p.status!=='Offline').length+' online':'';
    banner.textContent=st.progress||error||st.error||message||(working?'Working…':'');banner.hidden=!banner.textContent;
    box.classList.remove('pf-waiting-dialog');bar.hidden=false;box.querySelector('header').hidden=false;
    if(st.availability==='online'&&s&&driveLobby(s)){if(working)body.querySelectorAll('button').forEach(b=>b.disabled=true);return;}
    for(const t of tabs){const count=t==='Requests'?incoming.length+(s?.apartments?.incoming?.length||0):t==='Invites'?invites.filter(i=>!i.sent).length:0,b=button(t+(count?' ('+count+')':''),()=>{tab=t;message=error='';page=1;render();if(t==='Rooms')refreshRooms();});b.setAttribute('aria-current',String(tab===t));bar.append(b);}
    if(st.availability==='guest'){blank('Sign in to add friends, send invitations and play together.');body.append(button('Sign In',()=>net.signIn(),'pf-primary'));return;}
    if(st.availability!=='online'||!s){blank(st.availability==='connecting'?'Connecting to your friends…':st.availability==='unconfigured'?'Online play is unavailable until the multiplayer host is connected.':'Could not connect to the Friends server.');if(st.availability==='error'){body.append(button('Retry',run(()=>net.retry())));if(net.view)body.append(button('Return to game menu',()=>{net.returnToMenu();render();}));}return;}
    if(/home ownership|home verification/i.test(error||st.error||'')){
      const recovery=el('div',undefined,'pf-actions');
      recovery.append(button('Retry home verification',run(async()=>{await root.PlatdoHomeEntitlements?.refresh();const result=await cmd('homeVerify');if(result.state==='error')throw Error(result.error);},'Home ownership checked. You can join again.')),
        button('Continue in public',()=>{root.PlatdoHomeEntitlements?.choosePublic();error='';message='Public play selected. Choose your room again; your purchase is unchanged.';render();}));body.append(recovery);
    }
    if(tab==='Rooms'){session(s);rooms(s);}
    else if(tab==='Friends'){
      session(s);if(s.progress?.length){const stats=el('details');stats.append(el('summary','Your online play'));for(const p of s.progress)stats.append(el('p',label(p.mode)+' · '+Math.round(p.seconds/60)+' min · '+(p.metres/1000).toFixed(2)+' km'));body.append(stats);}const field=el('input');field.type='search';field.placeholder='Filter friends';field.setAttribute('aria-label','Filter friends');field.dataset.pfField='filter';field.value=filter;field.oninput=()=>{filter=field.value;page=1;render();};body.append(field);
      const ordered=friends.filter(p=>(p.name+p.code).toLowerCase().includes(filter.toLowerCase())).sort((a,b)=>Number(a.status==='Offline')-Number(b.status==='Offline')||a.name.localeCompare(b.name));
      if(!ordered.length)blank(filter?'No friends match that search.':'No friends yet. Add someone using their friend code.');
      ordered.slice(0,page*25).forEach(p=>friend(p,s));if(ordered.length>page*25)body.append(button('Show more',()=>{page++;render();}));
      const blocked=el('details',undefined,'pf-blocked');blocked.append(el('summary','Blocked Players ('+s.blocked.length+')'));for(const p of s.blocked){const {r,actions}=row(p);socialAction(actions,'Unblock','unblock',p.code);blocked.append(r);}if(!s.blocked.length)blocked.append(el('p','No blocked players.'));body.append(blocked);
    }else if(tab==='Requests'){
      for(const [title,list] of [['Incoming',incoming],['Sent',sent]]){body.append(el('h2',title));if(!list.length)blank('No '+title.toLowerCase()+' requests.');for(const p of list){const {r,actions}=row(p);if(p.rel==='incoming'){socialAction(actions,'Accept','accept',p.code);socialAction(actions,'Decline','decline',p.code);}else socialAction(actions,'Cancel','cancel',p.code);body.append(r);}}
      /* V10.0: apartment access requests, marked as such, with your guests below */
      const ap=s.apartments||{incoming:[],sent:[],given:[]};body.append(el('h2','Home access'));
      if(!ap.incoming.length&&!ap.sent.length&&!(ap.given||[]).length)blank('No home requests. Players ask for access from the lift in your building, or at the front door of your house.');
      for(const q of ap.incoming){const {r,actions}=row(q.from,'Home request \u{B7} wants to visit your '+homeName(q));r.classList.add('pf-apartment');actions.append(button('Accept',run(()=>cmd('apartment',{kind:'respond',id:q.id,accept:true}),q.from.name+' can now visit '+homeShort(q)+'.'),'pf-primary'),button('Decline',run(()=>cmd('apartment',{kind:'respond',id:q.id,accept:false}),'Request declined.')));body.append(r);}
      for(const q of ap.sent){const {r,actions}=row(q.to,'Home request \u{B7} you asked to visit '+homeName(q));r.classList.add('pf-apartment');actions.append(button('Cancel',run(()=>cmd('apartment',{kind:'cancel',id:q.id}),'Request cancelled.')));body.append(r);}
      for(const g of ap.given||[]){const {r,actions}=row(g.to,'Can visit your '+homeName(g));r.classList.add('pf-apartment');actions.append(button('Revoke',run(async()=>{if(confirm('Take away '+g.to.name+'\u{2019}s access to '+homeShort(g)+'?'))await cmd('apartment',{kind:'revoke',code:g.to.code,unit:g.unit});},'Access taken away.')));body.append(r);}
    }else if(tab==='Add Friend'){
      const mine=row(s.me,'Your friend code');mine.actions.append(button('Copy',run(async()=>{await navigator.clipboard.writeText(s.me.code);},'Friend code copied.')));body.append(mine.r);
      const form=el('form'),input=el('input');input.placeholder='Enter an exact friend code';input.setAttribute('aria-label','Friend code');input.maxLength=16;input.value=search;input.dataset.pfField='lookup';input.oninput=()=>search=input.value;const go=el('button','Search');go.type='submit';form.append(input,go);form.onsubmit=e=>{e.preventDefault();run(async()=>{lookup=await cmd('lookup',{code:search.trim().replace(/^#/,'')});if(!lookup)message='No matching player found.';})();};body.append(form);
      if(lookup){const p=lookup,{r,actions}=row(p);if(p.rel==='none')socialAction(actions,'Add Friend','request',p.code);else if(p.rel==='incoming')socialAction(actions,'Accept Request','accept',p.code);else actions.append(el('span',{sent:'Request Sent',friends:'Already Friends',you:'You'}[p.rel]));body.append(r);}
    }else{
      if(!invites.length)blank('No pending invitations. Session owners can invite friends from their friends list.');
      for(const i of invites){const p=i.sent?i.to:i.from,{r,actions}=row(p,(i.sent?'Sent · ':'Incoming · ')+'Platdo '+label(i.room.mode)+' · '+i.room.count+'/'+i.room.capacity+' Players');if(!i.sent)actions.append(button('Accept',run(()=>net.join(i.room,{invite:i.id,code:p.code,name:p.name})),'pf-primary'));
        actions.append(button(i.sent?'Cancel':'Decline',run(()=>cmd(i.sent?'revokeInvite':'declineInvite',{invite:i.id}))));body.append(r);}
    }
    if(working)body.querySelectorAll('button').forEach(b=>b.disabled=true);
    if(focusName){const next=body.querySelector('[data-pf-field="'+focusName+'"]');next?.focus({preventScroll:true});if(next&&Number.isInteger(pos))next.setSelectionRange(pos,pos);}
  }
  function update(){
    const s=state().social,incoming=s?.invitations.filter(i=>!i.sent)||[],aptIn=s?.apartments?.incoming||[],count=incoming.length+(s?.rows.filter(p=>p.rel==='incoming').length||0)+aptIn.length;
    if(lobbyVisit&&(!s?.session||s.session.id!==lobbyRoom||s.session.phase!=='waiting'))endLobbyVisit();
    if(!waiting())root.PlatdoWaitingGame?.close();
    document.querySelectorAll('[data-pf-main]').forEach(b=>{b.textContent='Friends'+(count?' ('+count+')':'');});
    if(notice&&!incoming.some(i=>i.id===notice.dataset.invite)&&!aptIn.some(q=>'apt:'+q.id===notice.dataset.invite)){notice.remove();notice=null;}
    const invite=incoming.find(i=>!announced.has(i.id));
    /* V10.0: a new apartment access request, answered right here */
    const askVisit=!invite&&aptIn.find(q=>!announced.has('apt:'+q.id));
    if(askVisit&&!notice&&!box?.open){announced.add('apt:'+askVisit.id);notice=el('aside',undefined,'pf-notice');notice.dataset.invite='apt:'+askVisit.id;notice.setAttribute('aria-live','polite');const answer=accept=>()=>{cmd('apartment',{kind:'respond',id:askVisit.id,accept}).catch(e=>{open();tab='Requests';error=e.message;render();});};notice.append(el('strong',askVisit.from.name+' asks to visit your '+homeName(askVisit)),button('Accept',answer(true)),button('Decline',answer(false)));document.body.append(notice);}
    if(invite&&!notice&&!box?.open){announced.add(invite.id);notice=el('aside',undefined,'pf-notice');notice.dataset.invite=invite.id;notice.setAttribute('aria-live','polite');notice.append(el('strong',invite.from.name+' invited you to Platdo '+label(invite.room.mode)),button('Accept',()=>{open(invite.room.mode);tab='Invites';render();run(()=>net.join(invite.room,{invite:invite.id,code:invite.from.code,name:invite.from.name}))();}),button('Decline',()=>{cmd('declineInvite',{invite:invite.id}).catch(e=>{open();error=e.message;render();});}));document.body.append(notice);}
    render();
  }
  root.PlatdoFriendsPanel={open,openRooms:(mode,options={})=>open(mode,{...options,rooms:true}),close,refresh:render,get isOpen(){return !!box?.open;},get visitingLobby(){return !!lobbyVisit;}};
  net.subscribe(update);
})(window);
