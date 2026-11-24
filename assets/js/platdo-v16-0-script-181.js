window.PlatdoReleaseData.unshift({
  "id": "v10-9-lag",
  "version": 10.9,
  "date": "2026-11-20",
  "major": true,
  "title": "Lag: the long freezes are gone and the slow places run about twice as fast",
  "thumbnail": "assets/images/c6153c1a1d546c343aef.jpg",
  "thumbnailAlt": "The city seen from the grass by the beach: the coast road, the row of food places and the towers behind",
  "summary": "This version is only about lag in Platdo City. The worst of it was a freeze of several seconds, more than ten the first time, whenever the number of lights that were on changed: the lamps in the first house, an apartment's lamps, the phone's flash. That cannot happen any more. On top of that, the places that ran slowly (the beach front, the shelter where you start, the first home street) do about half the work per frame that they did. Nothing was added or taken out of the map. Online, use the new multiplayer server zip.",
  "sections": [
    {
      "title": "The freezes",
      "items": [
        "Every time a lamp light came on or went off, the game had to rebuild the shader of every material on screen. Switching on the lamps in the first house took 11.7 seconds in my test; running up the first home street in V10.8 froze for 5.6 seconds. In this version the same things take a normal frame.",
        "How: the game now always draws with the same four lamp lights, and moves them to the lamps that matter most from where you are. A lamp that is switched on or off still changes at once.",
        "Shaders are also built in the background a moment after the City loads, instead of the first time each thing comes into view, which used to cause short stalls as you walked or turned."
      ]
    },
    {
      "title": "Frames a second, before and after",
      "items": [
        "Measured the same way in V10.8 and in this version, on the High setting (what this PC picks by itself), timed as a 60 Hz screen would show it.",
        "The shelter where you start: 36 to 57. The first home street: 28 to 52. The beach front: 28 to 56. Looking from the beach front across the whole city: 22 to 53. The east end of the beach front: 45 to 59.",
        "Running: up the first home street 23 to 58, along the beach front 29 to 53, out of the shelter 27 to 52.",
        "Inland, by the houses and in the city centre, it was already at 59 to 60 and still is. In an online room at the shelter it is 60."
      ]
    },
    {
      "title": "What was changed to get there",
      "items": [
        "Window glass, car glass and cut-out signs were being drawn twice each. They are drawn once.",
        "The city's buildings are drawn as about 1,300 batches of repeated shapes. Each batch was being set up again from nothing every time it was drawn; that is now done once.",
        "Cars: the simpler model (14 pieces instead of 62) is used from 18 m away instead of 48 m, and the simplest one from 45 m instead of 72 m. The first house and the mansion use their simple far model from 50 m instead of 70 m.",
        "People: someone lying or sitting still more than 8 m away is re-posed five times a second, and people further than 30 m or 60 m every second or third frame. On the frames in between their bones are not touched at all.",
        "The beach crowd: people more than 60 m from every player are moved every fourth step. Two people standing near each other no longer have their whole poses worked out just to see if they touch. Finding who is near a walker, who is on screen and who is at a house door no longer goes through everybody each time."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "Put the new multiplayer server zip on the host PC: four of the host's game files changed, for speed only. Its 65 checks all pass, the host gives exactly the same result as before in my step-by-step comparison, and movement between players is still smooth.",
        "Small differences you may notice: no more than four lamps light their surroundings at once (the nearest ones win, so in a room with five lamps the furthest corner is a little darker), and cars a little way off have less small detail than before.",
        "Measured in a hidden test window on this PC, not on your screen while you play, so your numbers will differ; the order of the gains should hold. I did not measure the other graphics settings, a slower PC, or a long play session.",
        "Not done yet: far-away city blocks are still drawn piece by piece (merging them is the next saving I would make), and Platdo Drive and the other games were not touched. This file starts on a fresh save, like every new file."
      ]
    }
  ]
});
