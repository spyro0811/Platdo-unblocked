
/* PLATDO City: Sandbox, Story and online rooms are three separate games (V10.7). Game only. Where each rule lives:
 * - Saves: Sandbox and Story each have their own save slot (economy.js SaveManager: 'sandbox' and 'story'), and an
 *   online character lives on the room's host (city-sandbox-save.cjs). Nothing is copied between them: a new game only
 *   reuses the look of its own mode's last save (rememberedCityIdentity), Story never writes the avatar that Sandbox
 *   and Drive share, and a new online character is the plain guy or girl in the starter clothes (world.cjs).
 * - Sandbox is the free mode: you choose the money you start with ($10,000 to $10,000,000), Sandbox tools add more,
 *   and every house and the mansion is open without buying it (this file switches the mansion on; the houses are in
 *   city-house-life.js and city-house-look.js). Buying a home there only makes it a home you can start at.
 * - Story is earned: $750, a red scooter and a bed at the shelter. The first house is locked and for sale in Platdo
 *   Estates ($250,000) like every other home (homes.js, simulation.js, city-estate.js); missions pay five times and the
 *   repeatable jobs three times what they used to (missions.js STORY_PAY). No Sandbox tools, no chosen money.
 * - Online is earned too: $100,000 and a red scooter (world.cjs ONLINE), jobs, and its own homes and vehicles. */
(function(root){'use strict';
const arm=()=>{try{root.CityMansion?.openInSandbox?.(true);}catch(_){}};
arm();root.addEventListener?.('platdo:ready',arm,{once:true});root.addEventListener?.('platdo:citymodechange',arm);
// which game a simulation belongs to: 'online', 'story' or 'sandbox'
function of(sim){return sim?.onlineRoom?'online':sim?.profile?.mode==='story'?'story':'sandbox';}
root.CityModes={of,arm};
})(typeof globalThis!=='undefined'?globalThis:this);
