window.PlatdoReleaseData.unshift({
  "id": "v9-9-multiplayer-tested-for-real",
  "version": 9.9,
  "date": "2026-11-20",
  "major": false,
  "title": "Multiplayer tested on the real server: the host is three times faster and other players now move smoothly",
  "thumbnail": "assets/images/af2dc7ff7a5c6ae367e8.jpg",
  "thumbnailAlt": "The Sunrunner buggy spawned in an online City room in front of a white house, a player standing by the porch",
  "summary": "For the first time the multiplayer server itself ran on this PC, with test players connected the same way the game connects, and then the real game joined their room. That found two problems nobody could see before. The server spent most of its time searching through hundreds of walls for every step, and on Windows it sent position updates only about 11 times a second instead of 15, which left the movement smoothing short and made other players stutter. Both are fixed: the server is three times faster and updates arrive every 67 ms. This needs the new server zip.",
  "sections": [
    {
      "title": "What was tested on the real server",
      "items": [
        "Signing in (a wrong sign-in is refused), friend requests, hosting a public City room, finding it in the room list, and two more players joining.",
        "Walking: every player sees everyone else, and where another player ends up matches the server to within a millimetre.",
        "The buggy: its owner can spawn it and everyone sees it; a player who does not own it cannot; ordinary cars spawn for anyone.",
        "Texts, group chats (everyone in the group gets every message), renamed contacts (only you see the name), Platdo Pay (the money moves, and you cannot send more than you have), two players at one restaurant table with the seat already taken refused, DingDash ordering, leaving and reconnecting to the same room, and the owner ending the session for everyone.",
        "The real game page joined the room as a third player: the phone's Messages app sent a text and a group message and both test players answered, a contact was renamed on the phone, and the buggy was spawned from the game."
      ]
    },
    {
      "title": "Fixed on the server",
      "items": [
        "Smoother players online: on Windows the server's clock could only wake every 15.6 ms, so updates went out every 92 ms instead of every 67 ms. The clock now works with Windows' timing. Measured in the game with the real server, 60 times a second, the speed another player is drawn at now varies by 0.05 m/s instead of 0.78 m/s, and it matches how fast they really walk (before, they were drawn about 10 percent too slow).",
        "Three times faster: the server's copy of the City's collision code still used an old, slow way of finding nearby walls (about 318 walls checked for every question, 450 questions a step). It now checks only the walls that are actually near. A step of the City takes 3.0 ms instead of 9.8 ms with three players (3.6 ms with eight), and a check of 900 steps gave exactly the same positions for every player, person and vehicle as before.",
        "Your hand matches your inventory the moment you join online: players start unarmed, but for the first instant a new player still counted as holding a pistol.",
        "The server's own checks all pass again (47 of 47): four of them stood players in what is now the sea after the map change, and one fired an empty hand."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "Put the new multiplayer server zip on the host PC. Nothing changes in the game itself apart from this update log, and this file starts on a fresh save like every new file.",
        "Not part of this test: real Firebase sign-in (the test players used a stand-in), the Cloudflare tunnel, and players on other computers over the internet. Those still need a try with friends.",
        "Multiplayer smoothing was checked against the real server this time, not a stand-in."
      ]
    }
  ]
});
