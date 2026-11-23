window.PlatdoReleaseData.unshift({
  "id": "v4-3-crowded-beach-doors-beds",
  "version": 4.3,
  "date": "2026-11-17",
  "major": true,
  "title": "A crowded beach, doors that open for you, and every bed",
  "thumbnail": "assets/images/291bcd4af71cbe058fd4.jpg",
  "thumbnailAlt": "Left: Seaglass Beach with people on towels, in beach chairs under a sun shade and in the water. Right: a mansion corridor where one sliding door has opened and the others are shut",
  "summary": "Seaglass Beach now has about 360 people in story, sandbox and multiplayer; every door in every house opens as you walk up to it; and you can sleep in every bed.",
  "sections": [
    {
      "title": "A much busier beach",
      "items": [
        "About 360 adults instead of 46: 170 on towels, 40 in beach chairs, 34 walking on the sand, 36 wading in the shallows, 46 swimming, 8 playing volleyball with 12 watching, 10 throwing footballs in five pairs, and 6 driving boats and jet skis.",
        "Most of them gather in the middle of the beach: by the volleyball courts, in front of the car park and on the way down to the water. About 190 more towels were laid out there in groups.",
        "Swimmers stay closer to the shore now, where you can see them, and there are people standing and walking in the shallow water.",
        "There are now five pairs throwing footballs instead of two, and people stand or sit beside the volleyball courts to watch."
      ]
    },
    {
      "title": "In every mode",
      "items": [
        "Sandbox: as before, only busier.",
        "Story: the beach is populated there too. Story mode has no passers-by anywhere else; the beach is the one exception.",
        "Multiplayer: the host now runs the beach people, the ball games and the boats and sends them to every player near the beach, so everyone sees the same games. Any player can kick a ball or break up a game. This needs the new server zip.",
        "The beach wakes up when any player in the session comes near it, and goes quiet when nobody is."
      ]
    },
    {
      "title": "Crowds cost less",
      "items": [
        "The check for people bumping into each other and into vehicles was the slowest part of a crowded scene, because it compared every person with every other person and every vehicle.",
        "It now leaves out people who are still with nothing moving near them. The result is the same, and with about 300 people on the beach a game step dropped from 5.3 to 2.3 milliseconds."
      ]
    },
    {
      "title": "Doors in every house",
      "items": [
        "Starter house: the eight inside doors used to stand open all the time. They are now shut, swing open when you walk up to either side, and shut again behind you, the way the front, patio and garage doors already did.",
        "Mansion: it had no room doors at all, only empty doorways. It now has 53 inside doors, counting the four lift doors. Each one slides into the wall as you approach and closes after you. Wide archways are left open.",
        "No button press is needed for any house door, and the doors open for other people too."
      ]
    },
    {
      "title": "Sleep in every bed",
      "items": [
        "Mansion: all five beds (the guest suite, the three bedrooms and the primary bedroom) now offer Sleep until morning. It sets the time to 7 in the morning and restores your health.",
        "Starter house: all three beds already did this. They were checked again."
      ]
    },
    {
      "title": "Not checked",
      "items": [
        "The multiplayer side of all this (beach life on the host, the new doors and the mansion beds in rooms) is written but was not run. The server's own door test was rewritten for the new behaviour and is also unrun.",
        "The mansion doors and beds were tested with ownership switched on in a test, not through a real purchase.",
        "Next: back to the maps (sky and water, shops and the diner, rocks and trees, the painted island map and minimap, the Cop Chase island), then the restaurants and the delivery app."
      ]
    }
  ]
});
