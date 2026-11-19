window.PlatdoReleaseData.unshift({
  "id": "v2-1-fixes",
  "version": 2.1,
  "date": "2026-11-16",
  "major": false,
  "title": "Even frames, a level mansion lawn and a mouse fix",
  "thumbnail": "assets/images/79b9265a41be9e881dd5.jpg",
  "thumbnailAlt": "The mansion in Platdo City with the lawn level against its walls",
  "summary": "Three fixes: uneven frame pacing on fast monitors, the ground caving in around the mansion, and City losing the mouse after a pause.",
  "sections": [
    {
      "title": "Frame pacing",
      "items": [
        "City drew frames at uneven intervals on monitors faster than 60 Hz. With the default 60 FPS cap, a 144 Hz screen alternated between two and three refreshes per frame, which looked like random frame drops even when the game had time to spare.",
        "City, the City menu, Drive and Swing now draw on whole display refreshes, so every frame stays on screen for the same time. With the 60 cap that gives 60 on 60, 120 and 240 Hz screens, 72 on 144 Hz and 55 on 165 Hz.",
        "Drive on a 144 Hz screen used to settle at 48 frames a second with the 60 cap. It now runs at 72.",
        "The City menu world was held to 30 frames a second on every device. Faster devices now show it at up to 60.",
        "Automatic graphics now counts late frames. If more than about one frame in sixteen misses its slot for two six-second windows in a row, it lowers the preset one step. Before, it only reacted once the average fell under about 43 frames a second."
      ]
    },
    {
      "title": "Mansion",
      "items": [
        "The lawn no longer falls away toward the basement along the mansion's outside walls. The drawn ground now stays at lawn level right up to the walls.",
        "Collision, the basement and everything inside the mansion are unchanged."
      ]
    },
    {
      "title": "Mouse",
      "items": [
        "Fixed City losing the mouse for the rest of the session. Browsers refuse to capture the mouse for about a second after Esc releases it, and a single refusal used to switch City to drag-to-look for good.",
        "City now asks for the mouse again on the next click, and only shows the drag-to-look hint if the browser keeps refusing."
      ]
    }
  ]
});
