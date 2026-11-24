window.PlatdoReleaseData.unshift({
  "id": "v11-0-lag-far-blocks",
  "version": 11.0,
  "date": "2026-11-20",
  "major": true,
  "title": "Lag, part two: far city blocks are drawn as merged pieces, and every measured place now holds 57 to 60 frames a second",
  "thumbnail": "assets/images/76997900e389ec443d21.jpg",
  "thumbnailAlt": "Brick blocks and towers about 300 m away, zoomed in: these are the merged far pieces",
  "summary": "The second half of the lag work in Platdo City. City blocks more than 220 m away are now drawn as two or three merged pieces each instead of dozens, and two things the game was doing every frame for no reason are gone. In my tests every place I measure now runs at 57 to 60 frames a second on the High setting, with room to spare. Game file only: the multiplayer server zip from V10.9 is still the right one.",
  "sections": [
    {
      "title": "Far city blocks",
      "items": [
        "The buildings and street furniture are drawn in blocks, each as one batch per shape and material: about 1,300 batches in all, and several hundred on screen when you look across the city.",
        "A block more than 220 m away is now drawn as up to three merged pieces: the solid parts, the window glass and the glowing parts. In the view across the city from the beach front that takes the number of things drawn from about 2,000 to about 1,300.",
        "I compared pictures with it on and off, by day and by night, including zoomed in on blocks 300 m away, and could not tell them apart.",
        "Left as they were: tree leaves and the window bays of the towers, and everything nearer than 220 m. Parts smaller than 30 cm are left out of the far pieces. Each merged piece is made once, in a few thousandths of a second, the first time its block is far away."
      ]
    },
    {
      "title": "Two things that ran every frame for nothing",
      "items": [
        "The game asked the graphics card what smoothing it supports on every frame. The answer never changes, so it is now asked once.",
        "With the gore setting on its two highest levels, a full body pose was worked out every frame for every person on screen in case they were bleeding. It is now worked out only for someone who has a wound."
      ]
    },
    {
      "title": "Frames a second: V10.8, V10.9, now",
      "items": [
        "The shelter where you start: 36, 57, 59. The first home street: 28, 52, 58. The beach front: 28, 56, 57. From the beach front across the whole city: 22, 53, 59.",
        "Running: up the first home street 23, 58, 59; along the beach front 29, 53, 57; out of the shelter 27, 52, 59.",
        "The work the game does per frame in those places fell from 19 to 37 thousandths of a second in V10.8 to 9 to 11 now; 60 frames a second needs it under 16.7. Inland it is 4 to 5. In an online room at the shelter it is 4, with other players still moving smoothly."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "Game file only. Nothing on the host changed, so keep using the V10.9 multiplayer server zip.",
        "Same caution as last time: measured in a hidden test window on this PC on the High setting, not on your screen while you play. I did not measure other graphics settings, a slower PC, or a long session.",
        "The merged pieces use some extra graphics memory (about a million triangles once the whole city has been seen from afar). On this PC that is nothing; on a small graphics card it could matter, and I have not tested one.",
        "Platdo Drive and the other games were not touched, except that they also ask the graphics card that question once now. This file starts on a fresh save, like every new file."
      ]
    }
  ]
});
