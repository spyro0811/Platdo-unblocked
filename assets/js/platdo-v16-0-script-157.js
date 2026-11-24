window.PlatdoReleaseData.unshift({
  "id": "v8-5-less-lag",
  "version": 8.5,
  "date": "2026-11-19",
  "major": false,
  "title": "Less lag in PLATDO City, wanted stars only, and you start with empty hands",
  "thumbnail": "assets/images/622ea4c2d9ab15d8b89a.jpg",
  "thumbnailAlt": "A busy afternoon on the beach: people on towels and under umbrellas, the boardwalk leading down to the sea",
  "summary": "I found and fixed the biggest things slowing PLATDO City down, most of them at the beach. On the High setting the beach front went from about 24 to 29 frames a second to about 40 to 45 on a fast desktop PC, and your home street now needs half the work it did. The wanted level shows only stars and only while you are wanted, you start with your fists, the minimap shows only its pictures, and footsteps are much quieter.",
  "sections": [
    {
      "title": "What was slowing the game down",
      "items": [
        "The sun's shadows: the area the sun casts shadows in ran a kilometre along the light, so with the sun low the game redrew a long strip of the city into its shadows every frame. It now covers just the area round you.",
        "Furniture inside buildings, small parts such as car badges, lamps, handles and cups, and people more than 40 m away no longer cast sun shadows. You could not see those shadows anyway.",
        "People bumping into people: every walking person was checked against every other one, three or four times a frame (on a full beach, tens of thousands of checks). Now only people near each other are checked, with the same result.",
        "The beach crowd searched the whole list of people hundreds of times every step, and the doors of your first home checked every person in the city every step. Both now look people up directly.",
        "People more than about 180 m away (a few pixels tall) are no longer built or drawn. Arriving at a full beach used to keep the game busy building people for many seconds.",
        "Cars switch to their simpler model sooner (40 m on High, was 58 m; 48 m on Ultra, was 85 m). The parked cars at the beach are one simple piece past 110 m and are not drawn past 520 m: from your home street those 32 cars alone were 448 separate drawings.",
        "Shop and restaurant doors more than 240 m away, and the plates and cups on restaurant tables when you are more than 32 m from the restaurant, are not drawn.",
        "The people farthest away are animated every other frame (they still move at the same speed)."
      ]
    },
    {
      "title": "Screen and controls",
      "items": [
        "The wanted level shows only the stars, filled and empty, and only while you are wanted. No words.",
        "You start PLATDO City with your fists. Pick a weapon when you want one.",
        "The minimap shows only its pictures: the district name under it is gone.",
        "Footsteps are about a third as loud."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "This file starts on a fresh save, like every new file.",
        "A new multiplayer server zip goes with it: the host shares the people, beach, door and bumping code.",
        "The frame rates are measured on a fast desktop PC in a test window on the High preset. The automatic graphics setting may choose a different preset on another computer, and it lowers the preset by itself when frames are dropped.",
        "What is left at the beach is mostly the crowd itself: every person is several separate pieces. Making each person one piece is a bigger job for a later version.",
        "Next: traffic that does not always stop for people, the waypoint clearing when you get close, no driving while you get out, helicopters that fall when you jump out, people stepping round you, a driver in every traffic car, a car stopping when its driver dies, floating in the sea, your head in the hood camera, money that comes to you, cutting the parachute with Space, buying a whole outfit at once, closing phone notifications, the guy-or-girl start in jeans and a red shirt, the sun rising over the hills and setting over the sea, and delivery prices by distance. Then the map changes."
      ]
    }
  ]
});
