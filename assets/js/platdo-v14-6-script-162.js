window.PlatdoReleaseData.unshift({
  "id": "v9-1-beach-lag-and-hills",
  "version": 9.1,
  "date": "2026-11-19",
  "major": false,
  "title": "Less lag at the beach, and the hills get a proper look: ridges and rocks, groves of trees, boulders, retaining walls, two lookouts over the sea, and speed limit signs",
  "thumbnail": "assets/images/d26ad2bb71fee4e8a157.jpg",
  "thumbnailAlt": "The Scenic Pass Lookout, a deck with rails and benches out over a wooded slope, with the sea beyond",
  "summary": "The beach view that lagged now takes about a third less work to draw: cars, the two big houses and far-off people are drawn in far fewer pieces. Both hills have ridges, gullies and rocky patches, about 560 trees in groves and 300 boulders (all solid), stone retaining walls where the hill roads cut into the slope, a lookout at the top of Relay Spur and one on Scenic Pass, speed limit signs on every named road, and shrubs along the hill roads.",
  "sections": [
    {
      "title": "Less lag at the beach",
      "items": [
        "Measured on the busy view inland from the beach: 3,610 things to draw a frame and 16.5 ms of drawing before, about 2,550 and 11.2 ms now (same test PC).",
        "Cars were over a third of that. Each car's shadow is now cast by one simple shape instead of every part, and cars a little way off switch to their one-piece model sooner. Close up they look the same.",
        "The starter home and the mansion were 186 and 67 pieces each. Past 70 m each is drawn as two merged pieces.",
        "People away from you are drawn as one or two pieces instead of dozens; hair and caps still move with the head."
      ]
    },
    {
      "title": "The shape of the hills",
      "items": [
        "Both hills were two smooth domes. They now have ridges, valleys and gullies, with rocky outcrops in a few broad rocky areas. The detail grows with the hill's height, so the flat land is unchanged.",
        "Around the relay, the hill helipad and the two graded stunt jumps the ground is as it was, so nothing standing there moved.",
        "Steep slopes show bare soil and rock in broad patches instead of a speckle that repeated every 23 m."
      ]
    },
    {
      "title": "Groves and boulders",
      "items": [
        "About 560 trees stand in groves spread over both hills, the same four kinds as in town (broadleaf, pine, birch, poplar). They are solid: a car stops at them.",
        "About 300 boulders sit in the rocky areas, some with a smaller stone or two beside them. They are solid too.",
        "The grove trees are drawn with fewer parts than the town trees, as they are mostly seen from afar, so from the beach the hills add next to nothing to the drawing time."
      ]
    },
    {
      "title": "Retaining walls",
      "items": [
        "Where Verdant Serpentine and Scenic Pass cut into the slope, a stone block wall now holds the bank back beside the pavement: 16 walls, about 820 m in all, up to 4 m tall.",
        "They are solid, so a car meets the wall instead of climbing the bank."
      ]
    },
    {
      "title": "Two lookouts",
      "items": [
        "Relay Point Lookout, at the end of Relay Spur, 122 m up: a deck out over the drop looking south over the city to the sea.",
        "Scenic Pass Lookout, at the upper hairpin of Scenic Pass, 45 m up: a deck looking west over the coast and the open sea. No trees were planted in front of either view.",
        "Each has rails on its open sides, two benches facing the view, a coin telescope, columns down to the ground and a name board. You can walk onto them from the road, and the rails stop you at the edge."
      ]
    },
    {
      "title": "Speed limits and planting",
      "items": [
        "73 speed limit signs, at both ends of every named road and every 300 m along the long ones, facing the traffic they are for and showing the road's limit in mph (20 to 40).",
        "Clumps of shrubs along the hill roads (you can walk through them)."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "This file starts on a fresh save, like every new file.",
        "A new multiplayer server zip goes with it: the host builds the same trees, boulders, walls and decks, so everyone bumps into the same things. The host itself was not run here.",
        "Checked here: a car at full throttle stops at boulders, walls and grove trees; walking onto both decks; no flicker on the new walls, decks, rails, signs or boulders.",
        "Still open from earlier: four tiny flicker spots of a few pixels, the faint shimmer on far towers, and a few flickering pixels where the road line meets the tarmac at the Scenic Pass hairpin beside the new deck (it was there before)."
      ]
    }
  ]
});
