window.PlatdoReleaseData.unshift({
  "id": "v27-workshop-gps-controls",
  "version": 27,
  "date": "2026-11-10",
  "major": true,
  "title": "A real workshop. Roads to follow. Better touch controls.",
  "thumbnail": "assets/images/c387a3ddd1dc7fd88e0b.png",
  "thumbnailAlt": "A customized City truck leaving the new Mara’s Motor House workshop",
  "summary": "Shared mobile driving controls, a drive-in customization workshop beside your house, road-following GPS for City and Drive, and tighter front-axle menu doughnuts.",
  "sections": [
    {
      "title": "Mobile driving and City walking controls",
      "items": [
        "City ground vehicles, Drive and Cop Chase use the same shared driving-control layout: left/right arrows, a tall accelerator, a shorter reverse pedal and a separate handbrake lever.",
        "Vehicle steering joysticks are replaced by arrow buttons. City walking, aircraft and drone controls retain their appropriate sticks.",
        "The short pedal immediately sends the existing backward/reverse command, even while moving forward. It adds no speed gate, timer, second press, gear change or artificial velocity reversal.",
        "Holding both direction pedals sends neutral longitudinal input. Holding both steering arrows sends neutral steering. Releasing one leaves the other held command active.",
        "Slide a thumb between the steering arrows to change direction. The gap is neutral, and moving off the arrows never becomes a camera gesture.",
        "Slide upward from the accelerator onto the handbrake to hold throttle and drift together with one thumb while steering with the other.",
        "A narrow transition corridor keeps throttle active between the gas and handbrake surfaces. Sliding back releases handbrake; lifting releases both.",
        "Touching the handbrake directly applies only handbrake. Sliding onto reverse removes forward and handbrake contributions. Leaving the pedal area cancels that gesture until a fresh touch.",
        "Separate fingers can hold gas and handbrake independently. Releasing one finger preserves any action still held by another finger.",
        "City walking has a floating, anchored movement stick in the lower-left area, a stable large jump icon in the lower-right, and touch-drag camera control over open scene space.",
        "Existing camera-relative walking, radial dead zone, analog walk/run behavior, diagonal speed limits, jump rules and vehicle handling remain in use.",
        "Movement, camera, jumping and other actions can use separate simultaneous touches. A camera drag crossing an icon does not activate it.",
        "Gameplay buttons use local SVG artwork with accessible names. Steering, gas, reverse and handbrake have distinct shapes and pressed states.",
        "Map and pause buttons sit with the camera-view controls near the upper-right. The view-cycle eye/arrows icon is distinct from the phone's photo-camera symbol.",
        "City interaction and vehicle-entry controls reflect available nearby targets. Vehicle exit has a separate outward-door icon, away from the gas-to-handbrake slide.",
        "Seatbelts and sniper scope zoom remain available through City's More actions menu; aircraft retain power, rudder, lift and hover controls.",
        "Entering or leaving a vehicle clears the old scheme. Controls hide during the transition and return in the confirmed walking or driving state.",
        "Opening pause, map or another blocking screen clears gameplay input. Closing it requires fresh touches instead of restoring a held pedal or stick.",
        "Touch cancellation, lost capture, backgrounding, blur, orientation changes, resizing, respawn and control-mode changes clear held inputs and pressed artwork.",
        "A short dismissible first-use illustration teaches the gas-to-handbrake slide. Control guides explain the reverse pedal, new icons and gestures.",
        "Mobile Controls settings add shared control size, opacity and touch-camera sensitivity, plus Restore mobile defaults. These preferences persist without changing key bindings or game progress.",
        "Small portrait phones compact the controls while preserving at least 48-pixel secondary targets. Safe-area padding and phone/tablet layouts keep controls outside system edges and prevent overlapping targets.",
        "Explicit per-game Touch or Keyboard choices remain authoritative. A narrow desktop window does not switch into mobile controls, and Keyboard mode hides the touch HUD.",
        "Bike front-brake controls use a wheel-and-caliper icon, distinct from the drift handbrake lever. City photo-preview movement and close controls also use the new icon styling.",
        "Drive speed, condition, currency and mode readouts use a separate responsive portrait layout, with navigation guidance below them so phone-sized screens do not squash the text under touch buttons.",
        "City money, wanted level, ammunition and GPS guidance stay in readable mobile HUD lanes away from the touch buttons; navigation text no longer pushes the health bars down. The first driving tip also reflows for compact phones.",
        "Unavailable interaction icons stay inactive and block touch-camera gestures underneath them, so a drag starting on a gray Enter vehicle icon cannot turn the camera."
      ]
    },
    {
      "title": "Mara’s Motor House: drive in, customize, drive out",
      "items": [
        "Completely rebuilt Mara’s Motor House on the adjoining plot beside the starter home, with a street-connected forecourt and updated physical access points.",
        "Preserved the starter house, home garage launcher, nearby mansion, Copper Kettle, home ownership rules and existing neighborhood routes.",
        "Added a substantial workshop shell with finished side walls, roof beams, a real skylight opening, gutters, downpipes, clear fascia signage and neutral work lights.",
        "Built a 319-part organized interior: inward-facing workbench drawers and handles, mounted tools, shelves and parts bins, rear cabinets, diagnostic monitor, rolling tool cart, bay stripes and floor drains.",
        "Added a sectional garage shutter with matching moving collision panels and overhead tracks. It opens for approaching vehicles and stays open around people, cars and active service sessions.",
        "The real owned vehicle now drives through the entrance before a smooth alignment positions it in the marked service bay. Passing traffic, pedestrians, passengers and unsafe approaches do not seize control.",
        "Kept all existing mechanic categories: body paint, wheel color, wheels, interior trim, spoilers, engine, grip, electric motor and battery packs, bike speed dongles and the full existing wraps catalog.",
        "Preserved every existing price, compatibility restriction, ownership rule, performance calculation and already-owned finish entitlement. There is no workshop admission fee.",
        "Kept all 276 catalog finish definitions and existing collection visibility rules, with searchable-by-collection browsing and paginated actual-vehicle finish thumbnails.",
        "The workshop shows the actual customized car in the world, with size-aware camera framing, manual inspection rotation and a Whole vehicle reset. Desktop, portrait and landscape keep the car and finish controls visible.",
        "Added a responsive workshop panel with a persistent Done action, clearer apply/discard feedback and retained scroll position while browsing changes.",
        "Temporary previews remain separate from the saved car. Discarding a later preview never removes a confirmed purchase.",
        "Purchase requests are guarded while pending and reuse their transaction reference on retry. Done never charges for a customization a second time.",
        "Save failures keep confirmed changes available with an explicit retry, and prevent an unresolved departure.",
        "Done presents the finished car, reverses the same vehicle through the opening, turns it on the forecourt and hands back normal driving outside, including no-change visits.",
        "Kept confirmed modifications, persistent vehicle identity, camera preference, HUD and normal driving behavior after the cinematic.",
        "One controller owns cinematic movement so held throttle and steering cannot fight it. Transient cinematic locks are never written into vehicle saves.",
        "An occupied departure route stops the car and offers retry or return to normal driving. Interrupted visits release the bay and cannot instantly capture controls again.",
        "Multiplayer reserves one bay per player session, validates vehicle ownership and purchases on the host, synchronizes confirmed modifications and the real shutter state, and releases reservations on disconnect or removal.",
        "Kept existing phone mechanic shortcuts and marina customization using the same underlying catalog and purchase system. Aircraft restrictions remain unchanged.",
        "Added automated entry, clearance, catalog, duplicate-charge, preview, obstruction, persistence, repeated-session, camera and multiplayer authority checks, plus a native browser purchase-and-departure journey."
      ]
    },
    {
      "title": "Street GPS in City and Drive",
      "items": [
        "Custom map pins keep the location you selected. GPS separately resolves the usable street, path or entrance instead of silently moving your pin.",
        "City and all four Drive maps share one routing engine. Each map uses its own actual road construction data, curves, junctions, connectors and elevations.",
        "Road routes follow connected streets and authored bridge ramps. Crossing lines do not create a junction between a bridge and the road beneath it.",
        "Start and destination positions are projected along road segments, so routes include the real partial distance instead of snapping every journey to intersections.",
        "Routing respects directed edges, permitted turns and connected access. Drive’s sampled curve points do not create new places to turn around.",
        "Mara’s Motor House uses its new next-door driveway and workshop approach from the same layout as the building.",
        "Named City locations use their public entrance or vehicle approach. Multiple declared access points are evaluated as complete reachable journeys.",
        "On-foot City guidance uses collision-validated pedestrian links and public entrances. Boat, helicopter and airplane travel keep the pin while suspending street instructions.",
        "Off-road starts ask you to return to a road. Inaccessible pins stop at reachable access and explain when the remaining approach is not routed.",
        "The minimap, full map and Drive dashboard GPS display the same route, remaining route distance, next-turn instruction and arrival state.",
        "Route lines follow sampled road curves with a contrast outline. Completed sections disappear as you move along the route.",
        "Left, right, keep-left, keep-right and turnaround instructions come from road transitions; a curved stretch does not announce a turn at every sample.",
        "Distances measure the remaining path rather than a straight line to the pin. Drive keeps the selected imperial or metric units.",
        "Missed turns trigger recalculation from your current road. Brief drifting, small lane changes and short uncertain matches do not immediately replace a valid route.",
        "Progress matching stays near the current route segment and can move backward when you reverse. Respawns and teleports trigger a fresh match.",
        "Arrival checks the approach, remaining route, height, low speed and clear final access. Reaching the road beside a building is distinguished from reaching its actual entrance.",
        "Marking your current accessible position resolves immediately. Arrival is shown once and the location pin remains until replaced or cleared.",
        "Replacing or clearing a destination invalidates older pending searches, preventing a canceled route from returning.",
        "Finding, recalculating, waiting for road access, unreachable, navigation loading, final approach and arrived states have explicit messages.",
        "City retains its mission navigation and Drive retains race checkpoints independently of free-roam GPS.",
        "Map dragging and interrupted or multi-touch gestures do not create accidental waypoints. Full maps have accessible close icons and preserve their existing coordinate transforms.",
        "Pausing freezes deviation and arrival timers. Navigation still calculates a newly selected map destination while gameplay is paused.",
        "Graphs are cached; tracking updates at ten times per second and full searches run only for meaningful changes. City’s pedestrian validation is split into small batches.",
        "Developer diagnostics expose graph version, directed links, road layers, matched edge, endpoints, search time and reroute reason without adding clutter to ordinary play.",
        "City’s full map keeps its map canvas visible in portrait and landscape. Compact horizontal location filters and action rows leave room for the route; the close icon remains in the header.",
        "City’s map now starts at a useful neighborhood zoom. The whole-island view, center, zoom, pan and location filters remain available.",
        "Map screens suppress gameplay toast overlap. Drive’s next-turn guidance sits above the minimap so it no longer overlaps the street-name label.",
        "An unreachable stationary destination waits instead of repeating the same failed search every few seconds; moving to a different valid access point retries guidance."
      ]
    },
    {
      "title": "Tighter menu doughnuts",
      "items": [
        "The menu car now turns around its front axle: the nose stays near the middle while the rear sweeps around in a doughnut.",
        "The pivot and rear tire contacts come from your actual selected Drive car, including its fitted customization.",
        "Heading stays continuous between full rotations and small variations, preventing a backward snap at the end of a lap.",
        "The front wheels roll slowly while the driven rear wheels spin faster; countersteering and restrained body movement remain visible.",
        "Smoke and circular tire marks follow the real rear-wheel positions.",
        "The presentation accounts for the full rotating body of longer cars and keeps spectators and house fronts clear.",
        "Menu animation remains separate from your gameplay vehicle, damage, money, position and saves."
      ]
    },
    {
      "title": "Collection and multiplayer compatibility",
      "items": [
        "The update has a genuine in-game workshop thumbnail and expandable notes covering every feature and control change.",
        "The portable HTML and Windows multiplayer host include the same workshop layout and session rules. Install the matching host update before using the new workshop in multiplayer.",
        "Existing single-player modes, accounts, saves, vehicle ownership, customization prices, handling, graphics and sound remain in use.",
        "Keyboard controls remain available through the existing control-method settings. Mobile controls do not replace PC input or change vehicle physics."
      ]
    }
  ]
});
