window.PlatdoReleaseData.unshift({
  "id": "v11-3-insides-horns",
  "version": 11.3,
  "date": "2026-11-21",
  "major": true,
  "title": "Building insides built when you go in, your own car horn and bike bell, and a toilet camera",
  "thumbnail": "assets/images/a13e8f5844bbf1c1bc89.jpg",
  "thumbnailAlt": "Inside Big Mick's: red booths, tables and chairs, the counter and the menu boards",
  "summary": "Every building in the City now builds its inside only when you walk up to it or go in, the way the houses and apartments already did, and takes it down again when you leave. Cars and other motor vehicles now sound your car horn recording and bicycles ring your bell, and presses overlap. On a toilet, pee now goes forward onto the floor, and the camera holds a view from in front. Online, this needs the new multiplayer server zip.",
  "sections": [
    {
      "title": "Insides built only when you go in",
      "items": [
        "Every shop, restaurant, 6-7 and the diner, the airport terminal, the marina, the garages, warehouses, the hangar and the relay station, the shelter, the workshop, the first house and the lobbies of all fourteen apartment buildings now work like the houses and apartment homes: what is inside (counters, booths, tables and chairs, shelves and their stock, racks, beds, machines, the shop mannequins) is built when you come within about 16 m of the building or go in, and taken down again once you are about 26 m away.",
        "The outside, the windows, the floor, the walls inside and the lights in the ceiling stay all the time, so from across the street a building still looks lit and lived in; its furniture arrives as you walk up. Building an inside takes a millisecond or two and needed no new shaders, so walking in does not stutter. The shop mannequins are made one at a time from about 45 m away, so they are ready before you reach the door.",
        "The staff and guests inside a building are not drawn while its inside is not built, so nobody stands behind a missing counter or sits on a missing chair.",
        "The casino and the mansion were already made when the City loads but only shown when you were near; they now show their insides only from close by (the casino within about 16 m of its walls, it was 65 m from its middle; the mansion's ground floor within 40 m, it was 65 m).",
        "What it does for speed, measured on this PC: about 15,000 fewer pieces in the scene when you are away from these buildings, and 4 to 11 percent fewer triangles drawn at eight test spots. On a fast graphics card like yours the frame rate is about the same as before (within a millisecond either way); it helps more on weaker graphics cards."
      ]
    },
    {
      "title": "Your car horn and bicycle bell",
      "items": [
        "The horn now plays your car horn recording instead of the made-up beep: cars, trucks, vans, motorbikes, the electric motorbikes (The Razzler, R2R Ripster, Sir-Ron Buzz X and the rest) and boats.",
        "Bicycles ring your bell recording instead: the Curb BMX, the Ridge Trail 29, the Aero Road and the SOUPER 74 RX electric bicycle.",
        "Every press is its own sound, so pressing again before one ends overlaps them.",
        "Other players in an online room hear your horn or bell too, the right one for what you are riding.",
        "Platdo Drive's cars use your car horn as well, and holding the horn key there no longer repeats it."
      ]
    },
    {
      "title": "Toilets",
      "items": [
        "While you sit, the camera holds a fixed view from in front of you and a little to one side. It checks for walls and picks a spot nothing hides, so in the shelter's stalls it looks in through the stall's doorway.",
        "With Stinky Poopy Diaper Mode on, U now pees forward over the front of the bowl and down onto the floor in front of you.",
        "The house and apartment toilets were solid up to 0.8 m from before their seat was lowered; they are now solid only as high as the seat."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "Put the new multiplayer server zip on the host PC: it now tells other players which vehicle sounded the horn. Its checks (now 69) all pass, including a new one for the horn, and movement between players is still smooth.",
        "Checked in the game: going into restaurants, a 6-7, a clothing shop, the diner, a steakhouse, the terminal, the shelter, the workshop, the first house, an apartment lobby and the casino, offline and joined to a host on this PC; the horn and bell on a car, a BMX and an electric motorbike, and three quick presses overlapping; the toilet camera and the pee at an apartment, a house, the first house, the mansion and the shelter.",
        "Not checked: how loud the horn and bell sound to you (I set them from their measured levels, between the cash register and the doorbell); tell me if either should be louder or quieter. This file starts on a fresh save, like every new file."
      ]
    }
  ]
});
