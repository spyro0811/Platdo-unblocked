window.PlatdoReleaseData.unshift({
  "id": "v11-7-far-homes-carjack",
  "version": 11.7,
  "date": "2026-11-21",
  "major": false,
  "title": "The starter house and the mansion no longer vanish from far away, and carjacked drivers come out head first",
  "thumbnail": "assets/images/3ad063c1cca062116341.jpg",
  "thumbnailAlt": "The starter house and the mansion seen from above, both fully drawn while the player is far away",
  "summary": "From more than 50 m away the starter house and the mansion are drawn as one simple copy each, to save time. That copy was being made almost empty, so both homes seemed to vanish once you walked or drove away. The copy now has the whole building, is made while the City loads, and takes 14 ms to make instead of a quarter of a second. Also, when you pull a driver out of a car they now come out head first and are put down where there is room, and a car next to them is no longer thrown into the air.",
  "sections": [
    {
      "title": "Homes from far away",
      "items": [
        "Why they vanished: from 50 m away each of the two homes is drawn as one simple copy instead of its few hundred pieces. The copy left out every piece that is drawn in batches, which in the starter house is nearly all of the outside; and if the mansion was more than 550 m away when its copy was made (at the start of a game, say) the copy came out empty and stayed that way.",
        "Now the copy takes every piece, batched or not, and both copies are made while the City loads. Pieces under 30 cm, which cannot be seen from 50 m, are left out.",
        "Making a copy used to take about a quarter of a second, a small freeze when you walked away from home; it now takes 14 ms, and going back home and leaving again no longer makes it again.",
        "Checked with pictures from 100 m, 300 m and 700 m away: both homes are there, and up close the real house comes back as before."
      ]
    },
    {
      "title": "Carjacking",
      "items": [
        "When you pull a driver out, they now come out head first: lying nearly flat with their arms out in front and their legs trailing, out through the door and down beside you, then thrown clear. Before, they were stood up as they came out.",
        "Why the car went into the air: if the driver ended up inside or against another car (one parked beside the door, say) and the ground stopped them being pushed out of it, the game pushed the car instead, upward. In tests with a car parked 2.6 to 3 m from the door it went 1.1 to 1.8 m up.",
        "Now a person's body only ever pushes a car sideways, never up; the driver is put down where there is room (further back along the car, or straight out from the door, if the first spot is taken); and for a moment they do not touch the car they came out of. In the same tests no car moves up at all, and the driver lands 3 to 7 m away, gets up and runs."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "New multiplayer server zip (V11.7), because the carjack fix is shared with online games. Checked: all 70 server tests pass, a normal online game plays out exactly as before, and the live online test passes (updates arrive steadily and the host keeps up). The movement smoothing for other players and cars is unchanged.",
        "The map change (the empty far right of the island) is still waiting for your answer on which part to remove.",
        "This file starts on a fresh save, like every new file."
      ]
    }
  ]
});
