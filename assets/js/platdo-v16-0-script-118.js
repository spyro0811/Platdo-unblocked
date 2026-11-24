window.PlatdoReleaseData.unshift({
  "id": "v4-92-small-fixes",
  "version": 4.92,
  "date": "2026-11-17",
  "major": false,
  "title": "Waypoints you can click off, bike air tilt, and a bike landing fix",
  "thumbnail": "assets/images/e8b6ea5f0c5b4b46aed3.jpg",
  "thumbnailAlt": "A rider on a red motorcycle in the air after a jump, with the bike tilted over to its left",
  "summary": "Click a waypoint again to clear it. Bikes no longer get stuck nose-down after a jump, and the left and right arrows tilt the bike in the air. Gore starts at the highest level. Multiplayer days are as long as single-player days.",
  "sections": [
    {
      "title": "What's new",
      "items": [
        "Map: clicking the waypoint you already placed clears it. This works on the marker itself, on a place you have a route to, and on that place's Navigate button.",
        "Bikes in the air: the left arrow tilts the bike to the left and the right arrow tilts it to the right. It comes back upright when you let go, and after you land.",
        "Both tilts are in Settings, Controls, as Bike air tilt left and Bike air tilt right, and can be rebound like every other action.",
        "Gore is at the highest level (AAAAHHH!) by default on every device. If you were still on the old default you have been moved up once; a level you pick yourself is kept."
      ]
    },
    {
      "title": "Fixed",
      "items": [
        "Bike glitch: after a jump with the forward arrow held, the bike came down on its front wheel and kept hopping along nose-down. The nose now levels out as soon as a wheel touches the ground.",
        "The arrows only start a flip once the bike has really left the ground, so a small hop no longer tips it over. Flips in the air work as before.",
        "Multiplayer rooms had a 20-minute day. It is now 24 minutes, the same as single player: one real minute is one game hour, one real second is one game minute."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "There is no touch button for the air tilt yet.",
        "The device scan still says 8+ GB: a web page is only told memory up to 8 GB by the browser, so the real amount cannot be read.",
        "Multiplayer hosts need the new server zip (V4.92)."
      ]
    }
  ]
});
