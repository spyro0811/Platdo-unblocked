window.PlatdoReleaseData.unshift({
  "id": "v13-6-shadows-corners",
  "version": 13.6,
  "date": "2026-11-22",
  "major": false,
  "title": "Shadows for trees and street things, and paved street corners",
  "thumbnail": "assets/images/e0b67eae109948fb2649.jpg",
  "thumbnailAlt": "Palm trees in front of an apartment building casting shadows on its wall and across the road",
  "summary": "The trees, benches, planters, lamps, fences and other things in front of the apartments and in the house gardens now cast shadows, and so do the speed signs; people cast shadows out to 55 m instead of 40 m. At junctions the pavements now meet at the corners: before, each pavement stopped short and left a square of grass where the zebra crossings ended.",
  "sections": [
    {
      "title": "Shadows",
      "items": [
        "Everything in front of the apartment buildings (trees, benches, planters, lamps) and in the house gardens (trees, fences, letterboxes and the rest) was drawn without a shadow, to save time when drawing. They all cast shadows now.",
        "The speed signs cast shadows too, and people cast shadows out to 55 m (40 m before).",
        "Cars and bikes further away already had their shadow from a simple stand-in, so nothing changed there.",
        "Measured: about 1.6% more drawing work per frame, with no change in frame time on this PC."
      ]
    },
    {
      "title": "Street corners",
      "items": [
        "Each pavement stops short of a junction to leave room for the zebra crossings, and nothing filled the square where two pavements should meet, so every corner was grass and the crossings ended on it. Those squares are paved now, so you step off a crossing onto the corner.",
        "On the far side of a T-junction the pavement now carries straight on instead of breaking off.",
        "Checked with the flicker detector at four junctions from three views each: nothing flickers. Junctions with curved streets or bridges, or at other angles, are unchanged."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "Only the game file changed: keep using the V13.5 multiplayer server zip.",
        "This file starts on a fresh save, like every new file."
      ]
    }
  ]
});
