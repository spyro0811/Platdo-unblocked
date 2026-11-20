window.PlatdoReleaseData.unshift({
  "id": "v29-chase-town-and-collection",
  "version": 29,
  "date": "2026-11-14",
  "major": true,
  "title": "Chase town, connected rooms and collection improvements",
  "thumbnail": "assets/images/e4577614ee85d68a391f.png",
  "thumbnailAlt": "The new chase town viewed from above, showing the reference layout and L-shaped buildings",
  "summary": "A larger chase town, an uninterrupted moving robbery opening, rebuilt multiplayer room flow, City workshop upgrades, account recovery and detailed collection fixes.",
  "sections": [
    {
      "title": "Update pages and shared controls",
      "items": [
        "The update log initially draws only three releases. Load more updates adds three more while keeping earlier entries accessible.",
        "Search and chronological sorting restart the visible batch; opening a specific update expands the right batch.",
        "Release thumbnails now accept both PNG and JPEG captures instead of replacing valid PNG covers with the old main-menu image.",
        "Update images load when near the viewport. Repeated historical covers are replaced with distinct pictures of their actual features.",
        "Buttons no longer select their labels on double-click; editable fields still allow normal text selection.",
        "The account page has one Sync progress action for uploading local changes and restoring account saves, with explicit conflict handling."
      ]
    },
    {
      "title": "Drive garage, rewards and visual effects",
      "items": [
        "Hovering a car, performance part, wrap or smoke color gives a temporary preview; clicking selects it. Moving the pointer away restores the clicked selection.",
        "Hover previews no longer rebuild the wraps grid or interrupt desktop scrolling. Wrap designs have their own scrollable area.",
        "Garage hover and focus callbacks wait for their current panels to exist during a car or screen change, preventing a detached-panel runtime error.",
        "Added Rainbow ribbon tire smoke. Its color changes continuously along the wake.",
        "All four car wheels can produce connected drift smoke in Drive and City. The smoke shader excludes the emitting car cabin rather than drawing smoke through its interior.",
        "Free Drive records each life from its last respawn to its first crash, including car, road, time, distance, score, date and assisted status. Repeated contacts after that crash do not duplicate the run.",
        "A new respawn begins a separate record; resetting the simulation clears the previous life and close-call reward totals.",
        "Close calls require passing close to another vehicle at 130 mph or higher. Faster passes award more points and CR.",
        "Driving alongside a vehicle cannot farm close-call rewards; completed passes award only once per encountered vehicle. Contact and wide passes are excluded.",
        "Close-call CR is banked with Free Drive earnings and included once in Traffic Rush settlement. Existing balances and previous records remain intact.",
        "Online Drive displays the actual selected mode, its timer, checkpoint or score, and a result panel when the authoritative run finishes."
      ]
    },
    {
      "title": "The Waiting Game",
      "items": [
        "Guests wait in a full-screen room until the host starts driving. Pause opens tools without stopping the waiting scene.",
        "The character sits above the couch cushion rather than inside it.",
        "Longer new hair strands grow downward around the original hairstyle instead of stretching it. Hair and a growing beard gradually turn gray on every character.",
        "The window now shows grass hills, moving clouds, sunrise and sunset colors, stars, moon, a ringed planet and occasional shooting stars.",
        "A day takes twelve real seconds. The clock hands and sun/moon share the same time calculation.",
        "The room lamp stays on and cannot be toggled. Waiting-room resolution follows the shared resolution cap."
      ]
    },
    {
      "title": "City street props",
      "items": [
        "Settled poop props no longer expire or disappear because of a spawn cap; eating them or using Cleanup removes them.",
        "Props collide with world geometry, one another and vehicle bodies. A spatial grid avoids checking every settled prop against every other prop.",
        "Urine droplets bounce and roll on surfaces, leave short-lived yellow trails, and survive their first ground contact.",
        "Each absorbed urine droplet adds exactly ten percent yellow coloration to a poop prop; fully saturated props reject later droplets.",
        "Urination assists toward a facing, visible, unsaturated prop within two feet and turns the character toward it. Farther, rearward and fully saturated props receive no assistance.",
        "The City pause menu offers cleanup of poop, pee or both. Multiplayer cleanup is controlled by the host."
      ]
    },
    {
      "title": "Account recovery and safe progress synchronization",
      "items": [
        "Traced the restart loop to failed cloud-save application: rollback called the same afterApply hook as success, and that hook unconditionally reloaded the page.",
        "Failed storage/media restoration now rolls back and reports an error without automatic page navigation.",
        "A stable recovery panel provides Retry account loading and Sign out and continue as guest.",
        "One controlled, guarded rebuild remains allowed only after successfully applying restored progress because beforeApply disposes running games and old save handlers.",
        "Firebase SDK initialization, persistence setup, initial auth observation, redirect completion, profile work, cloud reads/writes and media vault operations have deadlines and current-attempt guards.",
        "Same-UID auth callbacks share an active attempt and do not repeat successful or failed restores until the player explicitly retries.",
        "Signing out cancels pending restoration promptly; late results cannot apply another account's progress.",
        "Auth ready becomes true only after the matching account restoration safely completes.",
        "Added account.syncProgress(): upload valid-owner dirty groups and load newer clean cloud groups, leaving conflicts for an explicit choice.",
        "Guest/account ownership and existing save conflict checks remain in force; a failed restore does not upload new defaults.",
        "Bounded offline background retries and IndexedDB blocked/stalled transaction handling prevent permanently pending initialization."
      ]
    },
    {
      "title": "Shared City and Drive rooms",
      "items": [
        "Create room initially asks for City/Drive and privacy only.",
        "A Drive room starts in a waiting phase without stepping the driving simulation.",
        "The Drive host gets activity, Records, Garage, Graphics, Settings, Controls and leave-room options.",
        "Drive activity lets the host choose a shipped road, Free Drive/Time Trial/Traffic Rush, and 0-500 shared traffic vehicles.",
        "Cop Chase activity lets the host choose 1-10 minutes and manual/automatic role swapping and requires two connected players.",
        "Starting an activity replaces the authoritative simulation within the existing room, retains members/privacy and starts both clients through a revisioned roomStart event.",
        "The host can choose the next activity from an active room, returning every member to the same frozen waiting lobby before starting another mode without recreating the room.",
        "Starting another activity creates a fresh progress visit after checkpointing the old one, so account distance/time totals accumulate instead of replacing earlier activity counters.",
        "Guests stay in the fullscreen Waiting Game until the host starts.",
        "Waiting Game Pause exposes Records, Garage, Graphics, Settings, Controls and Leave without stopping the waiting clock.",
        "Visiting existing Drive panels hides and then restores the same Waiting Game instance and elapsed time.",
        "Escape from a lobby panel returns to the waiting pause overlay instead of being consumed by the ordinary Drive menu handler.",
        "Starting while a guest is visiting settings closes the temporary return control and explicitly releases the network menu-input latch.",
        "A reused waiting Pause button is re-enabled when an async join completes.",
        "Host-selected City pedestrian density is applied by the server, synchronized to all players and rejects nonhost changes.",
        "Host cleanupStreet validates all/poop/pee, clears physical street props in the public scene and current private interiors, and rejects peer cleanup requests.",
        "Persistent street props retain server physics and are only distance-culled from individual snapshots, not globally capped or expired by snapshot code.",
        "Normal Drive snapshots include mode, timer/checkpoint/penalty, authoritative result, close-call credits and collision-life records.",
        "Free-run, pass, near-miss and checkpoint events are transmitted with monotonic event IDs for client deduplication."
      ]
    },
    {
      "title": "Online records and purchase history",
      "items": [
        "Online Time Trial and Traffic Rush records have a separate validated onlineRecords table; existing solo records are preserved.",
        "Online settlement retains shared idempotent settlement IDs and the actual earned credit balance while directing records into the multiplayer table.",
        "Online trials use the server result's configuration key, avoiding a rejected payout when no solo run initialized the client's previous key.",
        "Records opened from a pending room correctly select multiplayer history even before online driving begins.",
        "Free Drive completed-life history is filtered by solo/multiplayer context.",
        "Successful paid garage transactions create dated receipts with item, car, credits and solo/multiplayer context.",
        "Vehicle, upgrade, performance-part, smoke and wrap purchases are recorded; free equips and failed purchases create no receipt.",
        "Garage purchase history is shown in the Records page and survives save import/validation; past unrecorded purchases are not fabricated."
      ]
    },
    {
      "title": "The bank robbery and moving chase opening",
      "items": [
        "Replaced the short generic opening with an 18-second sequence staged at the real bank and donut-shop entrances.",
        "Added eight authored shots: bank exit, getaway run, donut reaction, officer run, robber entry, officer entry, drifting departure, and moving handoff.",
        "The robber carries two money bags in his hands, runs from the bank, and transfers the bags into the getaway car's rear cabin.",
        "Loose bills use the carried bags as their source during the bank run; existing turn-dependent window cash continues during the chase.",
        "The cop notices the getaway, turns from the donut-shop area, drops a modeled donut with icing and sprinkles, and runs to the driver door.",
        "The dropped donut falls and bounces, remaining at the shop while the officer leaves.",
        "Both actual driver models exit their car hierarchy for the on-foot sequence and return to their original car seats; no duplicate driver actors replace them at handoff.",
        "Both driver doors open and close during animated entry; paths approach around the nose rather than through the car body.",
        "The police departure follows a smooth road trajectory with a short rear slide; the car settles out of its slide before handing control to the player.",
        "The getaway car and police car finish the cinematic facing east on the bank street, with the cop behind the robber.",
        "Final cinematic tangents continuously reach 30 m/s for both vehicles, matching 75 percent of the cop's maximum and 50 percent of the robber's maximum. The speed is never assigned abruptly at handoff.",
        "Position, yaw, velocity, angular velocity, steering, slip, body motion, wheel spin, RPM, gear, lights and condition pass into live authoritative physics without recreating the vehicles.",
        "The chase timer remains at its full configured duration until the opening ends.",
        "Normal throttle, steering and braking input unlock on the same live-physics boundary for either player role. Mobile controls remain hidden during the opening and appear at handoff.",
        "The final shot blends into each role's gameplay camera, including its normal speed-sensitive FOV, without a camera reset.",
        "Added opening audio cues for the alarm, footsteps, donut fall, bags, door latches and siren. Engine sound starts while the cars depart and stays enabled through handoff.",
        "Police lights activate during departure; tire smoke and skid marks can render during the departure slide.",
        "Intro captions identify the bank, donut shop, getaway, pursuit and handoff; live timer, condition and role HUD wait until gameplay.",
        "Camera framing adjusts its distance for portrait phones while retaining the authored action.",
        "Removed the old generic chase city visual generator and integrated the new screenshot-layout city model with per-frame visibility updates and disposal.",
        "Chase occupants receive longitudinal and lateral G-force movement, but chase collisions do not eject them.",
        "Kept chase orbit input signs identical to normal Drive input handling.",
        "After both players finish the capture presentation, or after the escape ending, a three-second intermission automatically starts a fresh round.",
        "Automatic role switching and manual role selection remain supported; the next-round timer appears in the result view.",
        "Round restart clears the opening and intermission state; disconnected players continue to freeze the required round progression.",
        "Added the shared map, shared deterministic opening state, opening renderer and map renderer to source integration order. The multiplayer host requires the new shared map and opening-state modules."
      ]
    },
    {
      "title": "The main-menu cinematic",
      "items": [
        "Replaced the static main-menu overview with a repeating 31-shot cinematic across five features.",
        "Drifting has six shots: establishing orbit, front-axle angle, rear wheel detail, crowd-side view, overhead doughnut view, and rear tracking view.",
        "The drift feature lasts two complete 8.7-second laps. Existing front-axle-centered doughnut physics, wheel spin, tire marks, smoke and spectator clearance are preserved.",
        "The yard sequence has five shots: establishing view, preparation, release, ground view, and recovery. Performers finish before the director moves on.",
        "The rooftop sequence has six shots covering the roof, source, stream, ground receiver, impact and resolution. The stream grows from its source, drains at its tail, and stops before the closing shot.",
        "The eating sequence has five shots covering discovery, reaching, pickup, the mouth and the completed reaction. The same reserved prop moves from the ground to the hand and is consumed once.",
        "The fight has nine shots tied to its real phases: approach, squaring up, low exchange, over-shoulder exchange, tracking exchange, finisher, pickup, throw and recovery.",
        "Fight shots wait for the full chosen exchange, finisher, pickup, throw and recovery. The director cannot leave the fight because a fixed camera timer expired.",
        "All menu features begin before their important action and stay through its completion; a new loop begins only after the fight resolves.",
        "Added a 25-person challenger roster with different body, face, hair and clothing geometry. All 25 appear before any identity repeats, with no immediate repeat at shuffle boundaries.",
        "Only one challenger model remains resident. Replaced challenger meshes are disposed, keeping the presentation at 21 performers rather than loading 25 extra bodies.",
        "Thrown opponents now use a basic articulated airborne body with gravity, independently moving limbs, damping, joint limits and fixed 120 Hz integration. Removed the previous upward-accelerating rigid-body pose.",
        "Pedestrians notice the fight sooner, react briefly, then run away from it. Their escape direction points away from the combat center.",
        "The challenger enters diagonally over 3.2 seconds from outside the opening shot; conservative performer bounds replace expensive whole-model bounds for entrance and removal checks.",
        "The yard performers plant their feet while crouching and walk aside before the eating sequence, keeping its close-up unobstructed.",
        "Rooftop shots remain on the exterior side of the house so walls and the roof do not cover the action.",
        "Portrait cameras widen their distance rather than stretching the field of view excessively.",
        "Presentation diagnostics now include feature, shot, loop count, challenger identity, roster size, flee events and completed fights.",
        "The menu presentation remains disposable and does not write progress, grant rewards or modify gameplay NPCs. Prop, particle, tire-mark and smoke pools remain bounded.",
        "The final fight-recovery frame stays on its recovery camera until the director advances, preventing a one-frame flash back to the approach shot."
      ]
    },
    {
      "title": "Cop Chase: the reference town",
      "items": [
        "Replaced the repeated small chase blocks with a town whose building footprints, relative dimensions and positions trace the supplied reference image.",
        "Preserved the L-shaped police station, lower police wing and L-shaped strip mall instead of substituting rectangles.",
        "Kept the central park as open grass with walking paths and a small number of scattered trees.",
        "Kept the indicated parking lot open with a few parked cars and no internal guardrails.",
        "Added a connected road network around the town and long approach/bypass roads inside a 2.7 km by 1.7 km playable area.",
        "Moved bank and donut-shop cinematic anchors to their reference positions; authoritative building collisions and recovery positions use the same map data as rendering.",
        "Added furnished 3D window bays and visible architectural interiors, transparent glazing, structural frames, doors, roof details, facade materials, canopies and purpose-specific signs.",
        "Modeled a bakery with pastry displays; a 6 7 convenience store; a smoke shop; a large supermarket; a mini market; a pizza shop; donut, surf, skateboard, game and toy shops; a restaurant; a cafe; a bank; a police station; a sports-car dealership; and five distinct apartment buildings.",
        "Placed the brief's second mini market as a distinct strip-mall tenant because the diagram has one separately outlined mini-market parcel.",
        "Added grocery aisles and counters, food displays, surfboards, skateboards, game screens, toy displays, restaurant seating, bank counters/queue/vault details and apartment furnishings in actual 3D.",
        "Added a roof helipad to the police building's lower wing and original Drive car models in the dealership and sparse parking lot.",
        "Batched repeated structural and furniture geometry by material and building; distance/side visibility culls furniture and distant car cabins without removing collision.",
        "Fixed road/apron depth fighting, bank ceiling gaps and bank sign overlap found during browser inspection.",
        "Captured distinct in-engine town, bank, donut shop, police, mall, bakery, park and dealership images for visual verification and update artwork."
      ]
    },
    {
      "title": "City: homes, stairs and tours",
      "items": [
        "Kept collision on closed exterior house doors and the garage door; interior door openings remain automatically open.",
        "Made starter-house stairs and all six mansion stair flights support walking on continuous slopes while keeping their visible individual steps and railings.",
        "Preserved rotated-house stair alignment, room access, terrain excavation and the mansion basement's separate support height.",
        "Moved the mansion computer from the office to the back-left side of the ground-floor main living room beside the rear garden wall, with its desk, chair, monitor, seat and interaction anchors moved together.",
        "Updated the mansion shop description with the computer's actual location.",
        "Verified that owned mansion respawn uses the mansion, while nonowners and mission resets retain their existing destinations; ownership remains server verified.",
        "Corrected mansion-tour strafe directions relative to the viewing direction and started unowned tours facing the front entrance.",
        "Desktop tours now look around with ordinary mouse movement, without holding or dragging. Touch tours retain a look gesture. Tour exit, return-to-game and front-entrance controls are inside the Pause menu.",
        "Escape now opens/resumes the tour pause menu; movement inputs are cleared and movement stops while paused."
      ]
    },
    {
      "title": "City: workshop and vehicle details",
      "items": [
        "Tied automatic workshop entry to the actual yellow floor rectangle, with whole-vehicle clearance, speed and heading checks.",
        "Kept Mara visible as decorative shop staff and removed her ordinary talk/service prompt; driving into the bay opens customization.",
        "Preserved the actual owned vehicle throughout alignment, customization, reveal, reverse, turn and driving handoff; only its owner receives the workshop inspection camera.",
        "Added brakes, suspension, power delivery and transmission upgrade stages with authoritative prices, actual braking/grip/acceleration/top-speed effects and validated save restoration.",
        "Added underglow enable/color choices and a visible single-surface tinted ground glow with a soft falloff; effect stops for a destroyed vehicle.",
        "Named electric motor/battery stages Factory, Street, Long-range, Sport and Race, retaining their existing motor and speed effects and model changes.",
        "Added numerical performance comparison bars: unchanged portions stay white, increases are blue, and only the lost portion is red.",
        "Preserved actual vehicle previews, paint, wheel color/styles, trim, spoilers, wrap collections, battery/motor packs and bike speed dongles; previews remain uncommitted until confirmed.",
        "Retained transaction deduplication, aircraft exclusion, insufficient-funds handling, ownership checks, stored/live customization and safe save retry before departure.",
        "Removed the extra rear cushion, grab rails and bolt-on rear frame from bikes while preserving multiplayer rear passenger seat anchors and capacity.",
        "Added tail-contact sparks when a moving wheelie scrapes the ground; airborne wheelies and ordinary cars do not produce this effect.",
        "Made scrape sparks short glowing streaks with velocity, gravity, ground bounce and fade instead of smoke circles."
      ]
    },
    {
      "title": "City: physics and shared population settings",
      "items": [
        "Added Normal and Realistic ragdoll styles to City Graphics; Normal is the default and Realistic preserves the existing articulated balance solver in solo play.",
        "Normal uses fewer collision/constraint iterations, a physical fall and a fixed eased get-up animation; blocked headroom delays recovery, new impacts interrupt recovery and death cannot recover.",
        "Applied the selected style to the local player and NPCs; multiplayer only offers Normal and its server uses that normal solver.",
        "Reenabled multiplayer NPC physical reactions using the new Normal mode, replacing the older blanket no-ragdoll policy as requested by the latest brief.",
        "Disabled the pedestrian slider for nonhost City room participants, explained host ownership of the setting, and displayed the authoritative room value without overwriting their solo preference.",
        "Added a generic graphics field display-value adapter so live room settings can be displayed separately from saved local preferences."
      ]
    }
  ]
});
