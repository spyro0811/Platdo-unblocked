/* F1 ownership adapter and read-only migration of the former paid underbody choice.
   Underbody lighting itself is a normal, free Garage feature. */
(function(root){'use strict';
const own=()=>root.PlatdoPremium?.access('DRIVE-23').allowed===true;
function legacyUnderbody(){
 let prefs;try{prefs=JSON.parse(root.Platdo?.storage?.('premium').get('drive-appearance:'+String(root.PlatdoPremium?.getState?.().uid||'guest'))||'null');}catch{return null;}
 const palette=['Cyan','Purple','Red','Orange','Green','White'],index=prefs?.selected?.['DRIVE-03'];
 if(!Number.isInteger(index)||index<0||index>=palette.length)return null;
 return {color:palette[index],mode:['off','steady','breathing'].includes(prefs.glowMode)?prefs.glowMode:'steady',intensity:Number.isFinite(prefs.intensity)?Math.min(1,Math.max(0,prefs.intensity)):.55};
}
function initialize(){root.PlatdoPremium?.registerAdapter('DRIVE-23',{
 get actionLabel(){return root.PlatdoDrive?.save?.selected==='f1'&&own()?'Equipped':'Equip F1';},
 description:'Permanent account vehicle with factory racing setup.',
 open(){if(!own())throw Error('Verify ownership to select the F1.');if(!root.PlatdoDrive?.equipPremiumF1())throw Error('The Drive garage is unavailable.');return true;}
});}
root.PlatdoPremiumDrive={legacyUnderbody};
root.PlatdoPremium?.subscribe(()=>root.PlatdoDrive?.reconcilePremiumVehicle());
root.addEventListener('platdo:ready',initialize,{once:true});initialize();
})(window);
