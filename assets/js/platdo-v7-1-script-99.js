window.PlatdoReleaseData.unshift({
  "id": "v2-new-look",
  "version": 2,
  "date": "2026-11-16",
  "major": true,
  "title": "A new look, real graphics settings and a faster City",
  "thumbnail": "assets/images/3d60044aef0252d7a161.jpg",
  "thumbnailAlt": "Platdo City late in the afternoon under the new sky, with the low sun over the starter house and the skyline",
  "summary": "City and Drive get a new sky, a sun that moves, sky reflections and a finishing pass. Graphics settings now scan your device and change real rendering work, ragdolls no longer slow the City down, and the menus have been redesigned.",
  "sections": [
    {
      "title": "New sky and lighting in City and Drive",
      "items": [
        "A new sky replaces the painted backdrop in both games: a blended horizon-to-zenith colour, a sun with a soft glow, a moon, warm dusk and dawn colour, and drifting cloud whose cover follows the weather.",
        "The sun and moon now cross the sky with the clock. Sunlight changes direction, colour and strength through the day, with warm low light and long shadows near sunrise and sunset.",
        "Fog and the horizon take their colour from the sky, so distant buildings fade into the same light as everything else.",
        "City terrain is greener, and rooms get a warm fill light when you walk indoors.",
        "Shadows have softer edges, and the Medium preset now uses a larger shadow map than before."
      ]
    },
    {
      "title": "Reflections and paint",
      "items": [
        "Car paint, glass, water and chrome now reflect the live sky. The reflection is rebuilt from the sky as the time of day and weather change, so cars pick up warm colour at sunset and go dark at night.",
        "The sky also lights the world, so shaded sides of buildings and cars are tinted by the sky above them instead of a single flat colour.",
        "Car paint has a clear-coat layer, a glossy top coat over the colour. It is used on detailed cars in Drive, and in City when Sky reflections is set to Sharp.",
        "Reflection strength is tuned per material: strong on water, paint, glass and chrome, and faint on matte surfaces."
      ]
    },
    {
      "title": "Finishing pass",
      "items": [
        "Both games can now draw in high dynamic range and finish each frame with a soft glow around lamps and the sun, filmic tone mapping, a colour grade and a light vignette.",
        "The new Finishing setting chooses Off, Glow and colour, or Glow, colour and smooth edges. Off draws straight to the screen and is the fastest."
      ]
    },
    {
      "title": "Graphics settings that do real work",
      "items": [
        "PLATDO now scans your device the first time it runs. It reads the graphics card name where the browser allows it and runs two short tests, one for the processor and one for how fast the graphics card can fill the screen, then places the device in one of five tiers.",
        "Automatic is the new default preset. Each game starts from your device's tier and then tailors it: the number of pedestrians and traffic cars follows processor speed, while view distance follows graphics speed. Two different devices now get different settings.",
        "If the frame rate stays well under the target, Automatic steps itself down a level. You can run the scan again from the graphics panel at any time.",
        "Lower presets now remove real work instead of only blurring the picture: fewer objects and triangles to draw, shorter view distance, fewer pedestrians and traffic cars, smaller or no shadow maps, no finishing pass and no sky reflections.",
        "Measured in City on the test PC: Potato draws a frame in about 2.7 ms with 534 draw calls, against about 11 to 13 ms and roughly 1,250 draw calls on Ultra.",
        "Potato and Low keep a sharper picture than they used to. Drive's Potato preset used a 25 percent render scale before; it now uses 70 percent and saves its time elsewhere.",
        "New City options: Sky reflections (Off, On, or Sharp with clear-coat paint) and Finishing. Drive has the same Finishing option.",
        "The graphics panel has been redesigned with a device card showing your graphics card, processor threads, memory and suggested preset, settings grouped by what they affect, and a live performance readout.",
        "Because the old quality choices worked differently, graphics settings start again on Automatic after this update. You can still pick a fixed preset or change any single setting."
      ]
    },
    {
      "title": "Ragdoll lag fixed and a faster City",
      "items": [
        "Fixed City slowing to a crawl when people ragdoll. Each ragdoll asks the world a few hundred collision questions every physics step, and near the starter house and mansion every one of those questions was sorting through about 1,300 collision boxes.",
        "The world now stores its collision boxes in a much finer grid, rays only visit the cells they pass through, and each ragdoll works from a small snapshot of its own surroundings.",
        "Measured on the test PC: one ragdoll lying beside the house used to cost 52.7 ms per physics step. Ten ragdolls falling at once now cost about 6 ms per step, and less as they settle.",
        "Ragdolls that have come to rest doze until something disturbs them, and parked cars that nobody is using rest in the same way.",
        "Ordinary City physics with no ragdolls is about four times lighter than before, down from 8.5 ms to about 2 ms per step on the test PC.",
        "City draws far fewer objects for the same picture: distant vehicles use one merged model, each person's body parts are merged per bone, and only objects that are on screen have their positions recalculated. In the same spot on Medium the draw-call count on the test PC fell from 1,968 to 852.",
        "Detailed vehicle models stay visible further away on the higher presets and switch to cheaper models sooner on the lower ones.",
        "Pedestrians choose their walking direction with less work, and mansion doors only animate while they are actually moving."
      ]
    },
    {
      "title": "Redesigned menus",
      "items": [
        "Drive main menu: a clear list for Drive, Multiplayer, Cop Chase, Garage and Records with a short description under each, and smaller buttons for Settings, Graphics, Controls and Return to Platdo.",
        "City title menu: the main choices come first, the other pages sit in a row beneath them, and leaving the game is kept apart.",
        "City pause menu: buttons are grouped under Go, Player, Game and Leave, in both solo and online play.",
        "The Drive pause menu, Drive and City settings screens, the Friends page and the PLATDO Settings dialog share the new style: darker panels, clearer headings, larger rows that are easier to tap, and one accent colour."
      ]
    },
    {
      "title": "Kept the same",
      "items": [
        "Driving physics, collisions, saves, prices, progress and multiplayer rules are unchanged. Driving was checked against the previous version with an identical scripted run, and thousands of collision checks were compared one by one.",
        "Vehicle, building and player shapes are the same models as before. New player models are planned for V3."
      ]
    }
  ]
});
