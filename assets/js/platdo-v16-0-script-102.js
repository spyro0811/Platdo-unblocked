window.PlatdoReleaseData.unshift({
  "id": "v3-5-fixes",
  "version": 3.5,
  "date": "2026-11-16",
  "major": false,
  "title": "Fixes: cameras, wanted level, driver size",
  "thumbnail": "assets/images/4008d1c864a39d95664a.jpg",
  "thumbnailAlt": "A white hatchback in Platdo Drive with a full-size driver at the wheel",
  "summary": "The first fixes from the new request list. The rest of that list, and the map work, follow in later builds.",
  "sections": [
    {
      "title": "Multiplayer",
      "items": [
        "Online Platdo City: after you had turned the camera round more than twice in one direction, your character stopped following it and could walk the opposite way. The game now sends the camera angle in a form the server always accepts, so this works with the server you already run.",
        "The new server package has the same fix on its side, and clears your wanted level when you respawn after dying."
      ]
    },
    {
      "title": "Cop Chase",
      "items": [
        "In the chase view, dragging down now raises the camera and dragging up lowers it, the same as in normal Platdo Drive. It was the other way round."
      ]
    },
    {
      "title": "Platdo City",
      "items": [
        "Dying clears your wanted level, along with any witness report that was still on its way.",
        "With the phone out, the camera stays behind you while you walk and swings round to face you about a second after you stop. It used to stay in front of you, which made the controls feel reversed."
      ]
    },
    {
      "title": "Platdo Drive",
      "items": [
        "The driver is full size again. The check that keeps the driver's head under the roof measured their standing height instead of their seated height, so it shrank them to about half size in every closed car.",
        "In low cars the driver now sits a little lower and leans back to fit, instead of shrinking."
      ]
    },
    {
      "title": "Main menu",
      "items": [
        "The dark mouth shapes that floated in front of faces are gone.",
        "The two people in the yard scene have bare legs.",
        "Clapping is faster, and the palms meet instead of the edges of the hands."
      ]
    },
    {
      "title": "Still to come",
      "items": [
        "From the new list: realistic passengers in Platdo Drive, the Drive multiplayer crash and respawn changes, the phone camera, chat and photo changes, the mechanic garage flow, better poop, the run and jump animations, and the City expansion.",
        "From the V3 list: maps, effects, wraps, the main menu scenes and the City gameplay changes."
      ]
    }
  ]
});
