/* Firebase handles credentials. The collection restores progress by verified UID. */
(function(root){
  'use strict';
  const config=Object.freeze({apiKey:'AIzaSyCc4JFX2b_k3mnOHrJHjGsfffDvYUvBRB8',authDomain:'platdo-f227c.firebaseapp.com',projectId:'platdo-f227c',storageBucket:'platdo-f227c.firebasestorage.app',messagingSenderId:'288421495462',appId:'1:288421495462:web:a9b6412241f5346f502a67',measurementId:'G-4WD4NKG3FG'});
  const SDK='https://www.gstatic.com/firebasejs/13.1.0/';
  if(root.PlatdoAccount)return;
  const listeners=new Set();let started,modules,auth,db,engine,authGeneration=0,authWork=Promise.resolve(),communityBusy=false,unsubscribeAuth,firstAuthDone,listenerGeneration=0;
  let profileSetup=Promise.resolve(),busy=false,restoreIdentity,restoring=false,runtimeInvalidated=false,identityPending=null,identityUID,initialAuthSeen=false;
  const state={status:'connecting',stage:'Restoring sign-in',user:null,syncStatus:'local',lastSynced:null,error:null,conflicts:[],ready:false,mediaNote:'Phone photos and recordings stay on this device. Other saved game progress syncs with your account.'};
  const clone=()=>({...state,user:state.user?{...state.user}:null,conflicts:[...state.conflicts]});
  function emit(){for(const fn of listeners)try{fn(clone());}catch(_){}root.dispatchEvent?.(new CustomEvent('platdo:accountchange',{detail:clone()}));}
  function fail(code,message){return Object.assign(new Error(message),{code});}
  function trace(event,details={}){root.PlatdoStartup?.record?.(event,details);}
  function stage(value){state.stage=value;trace('account-stage',{stage:value});emit();}
  function timed(work,label,ms=20000){return new Promise((resolve,reject)=>{let done=false;const end=(fn,v)=>{if(done)return;done=true;clearTimeout(timer);fn(v);};const timer=setTimeout(()=>end(reject,fail('auth/startup-timeout',label+' took too long. Retry account loading, or sign out to restore your separate guest progress.')),ms);Promise.resolve().then(work).then(v=>end(resolve,v),e=>end(reject,e));});}
  function checkAttempt(token,user){if(token!==authGeneration||(auth?.currentUser?.uid||null)!==(user?.uid||null))throw fail('save/cancelled','An earlier account loading attempt was cancelled.');}
  function recover(e){state.status='error';state.ready=false;state.error=authError(e);trace('account-startup-failed',{stage:state.stage,code:e?.code||e?.name||'account/error'});protectScreen(true,state.error);emit();}
  function restartAfterRestore({reason}={}){
    // A successful disk commit may require rebuilding disposed game instances once.
    // Never navigate from an error handler, and stop any unexpected repeated commits.
    const key='platdo:account-restart:v29',now=Date.now();let recent=[];
    try{recent=JSON.parse(root.sessionStorage.getItem(key)||'[]').filter(t=>Number.isFinite(t)&&now-t<60000);}catch(_){}
    if(recent.length>=3)throw fail('save/restart-blocked','Saved progress was restored, but repeated startup was stopped. Close this tab and reopen Platdo. Your saves have been kept.');
    try{root.sessionStorage.setItem(key,JSON.stringify([...recent,now]));}catch(_){}
    trace('account-navigation',{reason:reason||'verified-restore'});root.location.reload();
  }
  function authError(e){
    const code=e?.code||'';
    if(code==='auth/unauthorized-domain')return 'Google sign-in is not authorized for this website yet. Add both platdo-collection-download.nate63537464.chatgpt.site and platdo-collection-download.calm-moon-0318.chatgpt.site in Firebase Authentication â†’ Settings â†’ Authorized domains.';
    if(code==='auth/popup-closed-by-user'||code==='auth/cancelled-popup-request')return 'Sign-in was cancelled. You can keep playing as a guest.';
    if(code==='auth/popup-blocked')return 'The browser blocked Google sign-in. Allow the sign-in popup or use Continue in this tab.';
    const messages={'auth/invalid-email':'Enter a valid email address.','auth/invalid-credential':'The email or password is incorrect.','auth/wrong-password':'The email or password is incorrect.','auth/user-not-found':'The email or password is incorrect.','auth/email-already-in-use':'This email already has an account. Log in with its original method to add a password.','auth/weak-password':'Choose a stronger password with at least six characters.','auth/too-many-requests':'Too many attempts. Please try again later.','auth/requires-recent-login':'Log out and sign in again with your original method before changing credentials.','auth/invalid-phone-number':'Use a phone number with its country code.','auth/invalid-verification-code':'That text-message code is incorrect.','auth/code-expired':'That code expired. Request a new one.','auth/quota-exceeded':'SMS is unavailable because the service quota has been reached.','auth/operation-not-allowed':'This sign-in method is unavailable in Firebase.','auth/credential-already-in-use':'Those credentials already belong to another account. Your current account is unchanged.'};
    if(messages[code])return messages[code];
    if(code==='auth/billing-not-enabled')return 'SMS delivery needs billing enabled on the Platdo Firebase project. You can use email or Google now.';
    if(code==='auth/account-exists-with-different-credential')return 'This sign-in method already belongs to another player. Sign in to that account using its original method.';
    if(code==='auth/network-request-failed'||root.navigator?.onLine===false)return 'Offline — local progress is safe. Connect to the internet to sign in and sync.';
    return root.PlatdoCloudSave?.friendly(e)||e?.message||'Sign-in could not finish.';
  }
  function publicUser(user,profile={}){const uploadedPhotoURL=profile.photoDataURL||user.photoURL||'',portrait=root.PlatdoProfilePortrait?.read(user.uid);return{uid:user.uid,displayName:profile.displayName||user.displayName||(user.isAnonymous?'Guest':'Platdo player'),email:user.email||'',emailVerified:user.emailVerified,isAnonymous:user.isAnonymous,providers:user.providerData.map(p=>p.providerId),uploadedPhotoURL,photoMode:portrait?.mode||'image',photoURL:portrait?.image||uploadedPhotoURL,createdAt:user.metadata?.creationTime||null,lastSignInAt:user.metadata?.lastSignInTime||null};}
  function assertUser(uid){if(!auth?.currentUser||auth.currentUser.uid!==uid)throw fail('save/cancelled','Your account changed; this operation was cancelled.');}
  function canPlay(){return !!state.ready&&(root.location.protocol==='file:'||engine?.getState().owner===(auth?.currentUser?.uid||'guest'));}
  function protectScreen(on,message){
    if(!root.document)return;
    let layer=root.document.getElementById('platdoOwnerSwitch');
    if(!on){layer?.remove();return;}
    if(!layer){
      layer=root.document.createElement('section');layer.id='platdoOwnerSwitch';layer.setAttribute('role','alertdialog');layer.setAttribute('aria-modal','true');layer.tabIndex=-1;
      layer.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#101719;color:#fff;display:grid;align-content:center;justify-items:center;gap:12px;padding:24px;text-align:center;font:16px system-ui;pointer-events:auto;';
      const line=root.document.createElement('p'),actions=root.document.createElement('div'),retry=root.document.createElement('button'),guest=root.document.createElement('button');
      actions.dataset.accountRecovery='true';actions.style.cssText='display:flex;flex-wrap:wrap;gap:12px;justify-content:center';
      retry.textContent='Retry account loading';retry.onclick=()=>api.retryLoading().catch(recover);
      guest.textContent='Sign out and continue as guest';guest.onclick=()=>signOut().catch(recover);
      for(const b of [retry,guest])b.style.cssText='padding:12px 18px;border:1px solid #8ba4af;background:#edf4f7;color:#122027;border-radius:8px;cursor:pointer;font:inherit';
      actions.append(retry,guest);layer.append(line,actions);root.document.body?.append(layer);layer.focus();
      root.Platdo?.controls?.clear?.();root.document.exitPointerLock?.();
    }
    layer.firstChild.textContent=message||state.stage||'Loading this player’s progress…';layer.lastChild.hidden=!message;
  }
  function timestamp(value){return typeof value?.toMillis==='function'?value.toMillis():null;}
  function bytesToBase64(bytes){let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);}
  function base64ToBytes(text){const raw=atob(text),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes;}
  function makeTransport(F){
    const ref=(uid,id)=>F.doc(db,'users',uid,'experiences',id), chunks=(uid,id)=>F.collection(db,'users',uid,'experiences',id,'chunks');
    const revision=()=>root.crypto.randomUUID().replace(/-/g,'');
    async function removeCapturedChunks(uid,docs,check){for(let n=0;n<docs.length;n+=200){check();const batch=F.writeBatch(db);for(const d of docs.slice(n,n+200))batch.delete(d.ref);await batch.commit();}}
    return{
      async read(uid,id,context={}){const check=()=>{context.assertCurrent?.();assertUser(uid);};check();const manifest=await F.getDocFromServer(ref(uid,id));check();if(!manifest.exists())return null;const m=manifest.data();if(m.schema!==1||typeof m.revision!=='string'||!Number.isInteger(m.chunks)||m.chunks<0||m.chunks>1024)throw fail('save/invalid','This cloud save uses an unsupported format. Local progress is unchanged.');if(m.deleted)return{revision:m.revision,data:{},hash:await root.PlatdoCloudSave.fingerprint({}),updatedAt:timestamp(m.updatedAt)};
        const parts=[];let length=0;for(let i=0;i<m.chunks;i++){check();const part=await F.getDocFromServer(F.doc(chunks(uid,id),m.revision+'-'+String(i).padStart(4,'0')));check();if(!part.exists()||part.data().revision!==m.revision||part.data().index!==i)throw fail('save/incomplete','The cloud save is incomplete. Your local progress has been kept.');const bytes=base64ToBytes(part.data().data);parts.push(bytes);length+=bytes.length;if(length>64*1024*1024)throw fail('save/invalid','The cloud save is too large.');}
        const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));const hash=await root.PlatdoCloudSave.fingerprint(data);if(hash!==m.hash)throw fail('save/invalid','The cloud save failed its integrity check. Local progress is unchanged.');check();return{revision:m.revision,data,hash,updatedAt:timestamp(m.updatedAt)};
      },
      async write(uid,id,save,context={}){const check=()=>{context.assertCurrent?.();assertUser(uid);};check();const rev=revision(),text=root.PlatdoCloudSave.canonical(save.data),bytes=new TextEncoder().encode(text),size=180*1024,count=Math.ceil(bytes.length/size);if(bytes.length>64*1024*1024)throw fail('save/too-large','This save exceeds the 64 MB cloud limit. It remains saved locally.');
        // Upload immutable chunks first; only a successful compare-and-swap exposes the new snapshot.
        for(let i=0;i<count;i++){check();await F.setDoc(F.doc(chunks(uid,id),rev+'-'+String(i).padStart(4,'0')),{schema:1,revision:rev,index:i,data:bytesToBase64(bytes.subarray(i*size,(i+1)*size))});}
        await F.runTransaction(db,async tx=>{check();const current=await tx.get(ref(uid,id));check();const actual=current.exists()?current.data().revision:null;if(actual!==save.expectedRevision)throw fail('save/conflict','Another device saved newer progress. Sync again to choose which version to keep.');tx.set(ref(uid,id),{schema:1,revision:rev,chunks:count,bytes:bytes.length,hash:save.hash,deleted:false,clientUpdatedAt:save.clientUpdatedAt,updatedAt:F.serverTimestamp()});});
        // Old chunks are retained until the next reset; deleting after commit would race a second device reading them.
        return{revision:rev};
      },
      async erase(uid,id,context={}){const check=()=>{context.assertCurrent?.();assertUser(uid);};check();const captured=await F.getDocsFromServer(chunks(uid,id));check();await F.setDoc(ref(uid,id),{schema:1,revision:revision(),chunks:0,bytes:0,hash:await root.PlatdoCloudSave.fingerprint({}),deleted:true,clientUpdatedAt:Date.now(),updatedAt:F.serverTimestamp()});check();await removeCapturedChunks(uid,captured.docs,check);}
    };
  }
  async function initialize(){
    if(started)return started;
    started=(async()=>{
      if(!root.PlatdoCloudSave||!root.Platdo)throw Error('Platdo save platform is not ready.');
      if(!engine){
        engine=root.PlatdoCloudSave.create({canApply:()=>restoring||root.Platdo.canApplyCloudSave?.()!==false,
          beforeApply:async details=>{if(typeof root.Platdo.prepareCloudSaveReload!=='function')throw fail('save/menu-required','This game build cannot safely restore cloud saves yet.');runtimeInvalidated=true;await root.Platdo.prepareCloudSaveReload(details);},
          afterApply:restartAfterRestore,onApplyError:details=>recover(fail(details.code||'save/restore-failed',details.error)),onStale:details=>recover(fail('save/stale-tab',details.error))});
        engine.install(root.Platdo);root.PlatdoSaveManager=engine;
        engine.subscribe(s=>{state.syncStatus=s.status;state.lastSynced=s.lastSynced;state.conflicts=s.conflicts;if(s.error)state.error=s.error;else if(s.status==='saved'||s.status==='local')state.error=null;emit();});
      }
      if(root.location.protocol==='file:'){state.status='guest';state.stage='Local progress ready';state.ready=true;state.error='The portable HTML saves on this device. Open the online game for account sign-in.';root.PlatdoCloudSave.releaseWrites();emit();return false;}
      stage('Restoring sign-in');
      try{
        if(!modules){const [A,U,F]=await timed(()=>Promise.all([import(SDK+'firebase-app.js'),import(SDK+'firebase-auth.js'),import(SDK+'firebase-firestore.js')]),'Loading sign-in services');modules={A,U,F};const app=A.getApps().find(a=>a.name==='platdo-accounts')||A.initializeApp(config,'platdo-accounts');auth=U.getAuth(app);db=F.getFirestore(app);}
        const {U,F}=modules;
        if(!unsubscribeAuth){
          try{await timed(()=>U.setPersistence(auth,U.browserLocalPersistence),'Restoring browser session',10000);}catch{try{await timed(()=>U.setPersistence(auth,U.browserSessionPersistence),'Restoring tab session',8000);}catch{await timed(()=>U.setPersistence(auth,U.inMemoryPersistence),'Starting temporary session',8000);state.sessionNotice='This browser cannot keep your sign-in after this tab closes.';}}
          engine.setTransport(makeTransport(F));
          const first=new Promise(resolve=>firstAuthDone=resolve);
          restoreIdentity=(user,{force=false}={})=>{
            initialAuthSeen=true;firstAuthDone?.();const uid=user?.uid||null;
            if(!force&&identityUID===uid&&identityPending)return identityPending;
            if(!force&&identityUID===uid&&state.status==='error')return Promise.resolve();
            if(!force&&state.ready&&identityUID===uid){if(user)refreshUser(user);firstAuthDone?.();return Promise.resolve();}
            const token=++authGeneration;engine.cancel('The account changed.');identityUID=uid;restoring=true;
            root.PlatdoCloudSave.holdWrites();state.user=null;state.ready=false;state.status='connecting';state.error=null;stage(user?'Loading player profile':'Loading guest progress');protectScreen(true);
            const operation=(async()=>{
              try{
                await timed(()=>profileSetup,'Finishing account profile');checkAttempt(token,user);let profile={};
                if(user){
                  const ref=F.doc(db,'users',user.uid),doc=await timed(()=>F.getDocFromServer(ref),'Loading player profile');checkAttempt(token,user);profile=doc.exists()?doc.data():{};
                  if(!doc.exists()){await timed(()=>F.setDoc(ref,{schema:1,displayName:user.displayName||(user.isAnonymous?'Guest':'Platdo player'),createdAt:F.serverTimestamp(),lastSignInAt:F.serverTimestamp()},{merge:true}),'Creating player profile');checkAttempt(token,user);}
                }
                stage(user?'Loading saved progress':'Restoring guest progress');
                await engine.connect(uid);checkAttempt(token,user);
                if(engine.getState().status==='reloading')return;
                // beforeApply stops the old game instances. A failed commit followed by
                // guest recovery still needs one rebuild after ownership is verified.
                if(runtimeInvalidated){restartAfterRestore({reason:'verified-recovery'});return;}
                state.user=user?publicUser(user,profile):null;state.status=user?'signed-in':'guest';state.stage='Progress ready';state.error=null;state.ready=true;
                try{root.sessionStorage.removeItem('platdo:account-restart:v29');}catch(_){}
                root.PlatdoCloudSave.releaseWrites();protectScreen(false);trace('account-ready',{reason:user?'account-restored':'guest-restored'});emit();
              }catch(e){if(token!==authGeneration||e.code==='save/cancelled')return;engine.cancel('Account loading failed.');recover(e);}
              finally{if(token===authGeneration){restoring=false;firstAuthDone?.();}}
            })();identityPending=operation;authWork=operation;operation.finally(()=>{if(identityPending===operation)identityPending=null;}).catch(()=>{});return operation;
          };
          const listenerToken=++listenerGeneration;
          unsubscribeAuth=U.onAuthStateChanged(auth,user=>{if(listenerToken===listenerGeneration)return restoreIdentity(user);},e=>{if(listenerToken!==listenerGeneration)return;++authGeneration;engine.cancel();recover(e);firstAuthDone?.();});
          // Redirect completion is optional and cannot hold the email/session startup
          // gate. A successful redirect will notify the same deduplicated observer.
          timed(()=>U.getRedirectResult(auth),'Completing Google sign-in',15000).catch(e=>{trace('account-redirect-error',{code:e?.code||'auth/redirect-error'});if(!initialAuthSeen)state.error=authError(e);});
          await timed(()=>first,'Waiting for restored sign-in',20000);await authWork;
        }else if(restoreIdentity)await restoreIdentity(auth.currentUser,{force:true});
        return state.ready;
      }catch(e){++authGeneration;++listenerGeneration;unsubscribeAuth?.();unsubscribeAuth=null;engine.cancel();recover(e);started=null;return false;}
    })();return started;
  }
  async function requireFirebase(){if(!modules||!auth)await initialize();if(!modules||!auth)throw fail('auth/unavailable',state.error||'Connect to the internet to sign in.');return modules;}
  async function retryLoading(){if(restoreIdentity&&initialAuthSeen)return restoreIdentity(auth.currentUser,{force:true});started=null;return initialize();}
  async function prepareProgress(){
    await initialize();
    if(!canPlay())throw fail('auth/progress-not-ready',state.error||'Saved progress is still loading. Use Retry account loading to continue.');
  }
  function validName(value){
    const name=String(value||'').normalize('NFKC').trim();
    if(!name||name.length>32||/[\u0000-\u001f\u007f]/.test(name))throw Error('Choose a player name of 1 to 32 characters.');
    return name;
  }
  async function accountRequest(action){
    if(busy)throw Error('An account request is already in progress.');
    busy=true;
    try{await requireFirebase();return await action();}finally{busy=false;}
  }
  function refreshUser(user){assertUser(user.uid);state.user=publicUser(user,{displayName:state.user?.displayName,photoDataURL:state.user?.uploadedPhotoURL});emit();}
  async function createAccount(name,address,password){
    return accountRequest(async()=>{
      name=validName(name);const email=address.trim();
      if(auth.currentUser&&!auth.currentUser.isAnonymous)throw Error('Log out before creating another account.');
      let done;profileSetup=new Promise(resolve=>done=resolve);
      try{
        const {U,F}=modules;
        const result=auth.currentUser?await U.linkWithCredential(auth.currentUser,U.EmailAuthProvider.credential(email,password)):await U.createUserWithEmailAndPassword(auth,email,password);
        await U.updateProfile(result.user,{displayName:name});
        await F.setDoc(F.doc(db,'users',result.user.uid),{schema:1,displayName:name,updatedAt:F.serverTimestamp()},{merge:true});
        try{await U.sendEmailVerification(result.user);}catch{state.verificationNotice='Account created. Use Resend verification email in Account settings.';}
        state.user=publicUser(result.user);emit();
      }finally{done();}
      await authWork;
    });
  }
  const loginEmail=(email,password)=>accountRequest(async()=>{await modules.U.signInWithEmailAndPassword(auth,email.trim(),password);await authWork;});
  const anonymous=()=>accountRequest(async()=>{await modules.U.signInAnonymously(auth);await authWork;});
  const resetPassword=email=>accountRequest(()=>modules.U.sendPasswordResetEmail(auth,email.trim()));
  const resendVerification=()=>accountRequest(async()=>{const user=auth.currentUser;if(!user?.email)throw Error('This account has no email address.');await user.reload();refreshUser(user);if(!user.emailVerified)await modules.U.sendEmailVerification(user);});
  const linkPassword=(email,password)=>accountRequest(async()=>{
    const user=auth.currentUser;if(!user)throw Error('Sign in with your original account first.');
    if(user.email&&user.email.toLowerCase()!==email.trim().toLowerCase())throw Error('Use the email already on your account.');
    const original=user.uid;
    const U=modules.U,credential=U.EmailAuthProvider.credential(email.trim(),password);
    try{await U.linkWithCredential(user,credential);}
    catch(e){
      // Some projects reject linking an already verified Google email to its own UID.
      // Add a password on that authenticated UID only, then prove it works below.
      if(!['auth/email-already-in-use','auth/operation-not-allowed'].includes(e.code)||!user.emailVerified||!user.providerData.some(p=>p.providerId==='google.com')||user.providerData.some(p=>p.providerId==='password')||user.email?.toLowerCase()!==email.trim().toLowerCase())throw e;
      assertUser(original);await U.updatePassword(user,password);
    }
    assertUser(original);await U.reauthenticateWithCredential(user,credential);await user.reload();refreshUser(user);
    if(!user.emailVerified)await U.sendEmailVerification(user);
  });
  const linkGoogle=(redirect=false)=>accountRequest(async()=>{
    const user=auth.currentUser;if(!user)throw Error('Sign in to the account where you want to add Google.');
    const provider=new modules.U.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
    if(redirect)return modules.U.linkWithRedirect(user,provider);
    const result=await modules.U.linkWithPopup(user,provider);
    assertUser(user.uid);await result.user.reload();refreshUser(result.user);
  });
  async function signIn(options={}){await requireFirebase();state.error=null;state.status='signing-in';emit();const provider=new modules.U.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
    try{if(options.redirect)return await modules.U.signInWithRedirect(auth,provider);await modules.U.signInWithPopup(auth,provider);await authWork;return true;}catch(e){state.status=auth.currentUser?'signed-in':'guest';state.error=authError(e);emit();throw e;}}
  async function syncNow(){if(!engine||!state.ready||engine.getState().owner!==(auth?.currentUser?.uid||'guest'))return false;root.Platdo?.saveProgress?.();return engine.sync();}
  async function signOut(){
    await requireFirebase();const trusted=state.ready&&engine.getState().owner===(auth.currentUser?.uid||'guest');
    if(trusted&&root.Platdo.canApplyCloudSave?.()===false)throw fail('save/menu-required','Return to the main menu before signing out.');
    // Never upload or back up half-restored/default progress on the failure path.
    if(trusted){root.Platdo?.saveProgress?.();await engine.backup();try{await engine.sync();}catch(e){state.error=authError(e);}}
    ++authGeneration;engine.cancel('Signing out.');identityPending=null;state.ready=false;
    await timed(()=>modules.U.signOut(auth),'Signing out');
    await restoreIdentity(null);
  }
  function getAccountEligibility(){const user=auth?.currentUser;return{ready:state.ready,uid:user?.uid||null,permanent:!!user&&!user.isAnonymous&&!!user.providerData?.length,isAnonymous:!!user?.isAnonymous,providers:(user?.providerData||[]).map(p=>p.providerId)};}
  async function getIdentityToken(){await requireFirebase();const user=auth.currentUser;if(!getAccountEligibility().permanent)throw fail('auth/sign-in-required','Sign in with a permanent account.');const token=await user.getIdToken();assertUser(user.uid);return token;}
  async function updateNickname(value){await requireFirebase();const user=auth.currentUser;if(!user||user.isAnonymous)throw fail('auth/sign-in-required','Sign in to change your nickname.');const name=validName(value);assertUser(user.uid);await modules.U.updateProfile(user,{displayName:name});await modules.F.setDoc(modules.F.doc(db,'users',user.uid),{schema:1,displayName:name,updatedAt:modules.F.serverTimestamp()},{merge:true});assertUser(user.uid);state.user={...state.user,displayName:name};emit();return name;}
  async function updateProfilePicture(file){await requireFirebase();const user=auth.currentUser;if(!user)throw fail('auth/sign-in-required','Sign in to change your profile picture.');if(!(file instanceof Blob)||!/^image\/(png|jpeg|webp|gif)$/.test(file.type)||file.size>12*1024*1024)throw Error('Choose a PNG, JPEG, WebP, or GIF image under 12 MB.');
    const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d'),side=Math.min(bitmap.width,bitmap.height);c.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,256,256);bitmap.close();const data=canvas.toDataURL('image/jpeg',.82);if(data.length>200000)throw Error('This image is too large after resizing. Try a smaller image.');assertUser(user.uid);await modules.F.setDoc(modules.F.doc(db,'users',user.uid),{schema:1,photoDataURL:data,updatedAt:modules.F.serverTimestamp()},{merge:true});assertUser(user.uid);root.PlatdoProfilePortrait?.select(user.uid,'image');state.user={...state.user,photoMode:'image',uploadedPhotoURL:data,photoURL:data};emit();return data;
  }
  function choosePicture(mode){
    const user=state.user;
    if(!user||!state.ready)throw Error('Sign in before choosing a profile picture.');
    assertUser(user.uid);
    const result=root.PlatdoProfilePortrait.select(user.uid,mode);
    state.user={...user,photoMode:result.mode,photoURL:result.image||user.uploadedPhotoURL};emit();
  }
  let portraitTimer;
  root.addEventListener?.('platdo:avatarchange',()=>{
    clearTimeout(portraitTimer);
    const uid=state.user?.uid;
    if(uid&&state.user.photoMode==='city')portraitTimer=setTimeout(()=>{
      if(state.ready&&state.user?.uid===uid&&state.user.photoMode==='city'){
        try{choosePicture('city');}catch(e){state.error='Character portrait update failed. '+e.message;emit();}
      }
    },250);
  });
  function updateId(id){if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(id))throw Error('Invalid update.');return id;}
  async function communityUser(){await requireFirebase();const user=auth.currentUser;if(!user)throw fail('auth/sign-in-required','Sign in to join the discussion.');return user;}
  async function getUpdateEngagement(id){await requireFirebase();updateId(id);const F=modules.F,base=F.collection(db,'updates',id,'reactions');
    const [likes,dislikes,comments,mine]=await Promise.all([F.getCountFromServer(F.query(base,F.where('value','==','like'))),F.getCountFromServer(F.query(base,F.where('value','==','dislike'))),F.getDocsFromServer(F.query(F.collection(db,'updates',id,'comments'),F.orderBy('createdAt','desc'),F.limit(50))),auth.currentUser?F.getDocFromServer(F.doc(base,auth.currentUser.uid)):Promise.resolve(null)]);
    return{likes:likes.data().count,dislikes:dislikes.data().count,myReaction:mine?.exists()?mine.data().value:null,comments:comments.docs.map(d=>({id:d.id,...d.data(),createdAt:timestamp(d.data().createdAt)}))};
  }
  async function reactToUpdate(id,value){const user=await communityUser();updateId(id);if(!['like','dislike',null].includes(value))throw Error('Invalid reaction.');const F=modules.F,ref=F.doc(db,'updates',id,'reactions',user.uid);assertUser(user.uid);if(value===null)await F.deleteDoc(ref);else await F.setDoc(ref,{uid:user.uid,value,updatedAt:F.serverTimestamp()});return getUpdateEngagement(id);}
  async function addUpdateComment(id,text){const user=await communityUser();updateId(id);text=String(text).trim();if(!text||text.length>1200)throw Error('Write a comment between 1 and 1,200 characters.');if(communityBusy)throw Error('Please wait for your previous comment to finish.');communityBusy=true;try{const F=modules.F;assertUser(user.uid);await F.addDoc(F.collection(db,'updates',id,'comments'),{uid:user.uid,displayName:state.user?.displayName||'Platdo player',photoURL:/^https:\/\//.test(user.photoURL||'')?user.photoURL:'',text,createdAt:F.serverTimestamp()});return getUpdateEngagement(id);}finally{communityBusy=false;}}
  async function deleteOwnComment(id,commentId){const user=await communityUser();updateId(id);updateId(commentId);const F=modules.F,ref=F.doc(db,'updates',id,'comments',commentId),item=await F.getDocFromServer(ref);if(!item.exists()||item.data().uid!==user.uid)throw Error('Only the author can remove this comment.');await F.deleteDoc(ref);return getUpdateEngagement(id);}
  const api={initialize,getState:clone,getAccountEligibility,getIdentityToken,updateNickname,createAccount,loginEmail,anonymous,resetPassword,resendVerification,linkPassword,loadAllProgress:()=>accountRequest(()=>engine.loadAllProgress()),subscribe(fn){listeners.add(fn);fn(clone());return()=>listeners.delete(fn);},signIn,signOut,syncNow,updateProfilePicture,choosePicture,resolveConflict:(id,choice)=>engine.resolveConflict(id,choice),getUpdateEngagement,reactToUpdate,addUpdateComment,deleteOwnComment,config,SDK_VERSION:'13.1.0',formatError:authError};
  api.linkGoogle=linkGoogle;api.retryLoading=retryLoading;
  api.syncProgress=()=>accountRequest(async()=>{if(!canPlay()||!state.user)throw fail('auth/progress-not-ready','Finish loading this account before syncing progress.');root.Platdo?.saveProgress?.();await engine.sync();return engine.getState().conflicts.length===0;});
  api.keepDeviceConflicts=()=>accountRequest(()=>engine.keepDeviceConflicts());
  api.canPlay=canPlay;api.prepareProgress=prepareProgress;root.PlatdoAccount=api;
  root.addEventListener?.('online',()=>{if(!auth&&root.Platdo&&root.location.protocol!=='file:')initialize().catch(()=>{});});
})(typeof window!=='undefined'?window:globalThis);
