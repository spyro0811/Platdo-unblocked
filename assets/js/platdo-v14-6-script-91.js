window.PlatdoReleaseData.unshift({
  "id": "v31-loading-bubbles",
  "version": 31,
  "date": "2026-11-15",
  "major": false,
  "title": "Loading bubbles and menu volume",
  "thumbnail": "assets/images/aec8af82edfd3db482f7.png",
  "thumbnailAlt": "PLATDO loading screen with clickable floating bubbles",
  "summary": "Pop rising bubbles while the game loads. Menu music now defaults to 50%.",
  "sections": [
    {
      "title": "Pop bubbles while PLATDO loads",
      "items": [
        "Added rising bubbles labeled Click me to the opening website download screen and the portable game preparation screen.",
        "Click, tap or activate a focused bubble with the keyboard to pop it, with a short synthesized pop sound and burst animation.",
        "Limited the number of bubbles and kept them clear of the loading text, progress bar, retry button and download link.",
        "Provided a reduced-motion layout and stopped the bubble activity when initial loading finishes. Bubbles do not delay game preparation or continue over gameplay.",
        "Included the bubble visuals and generated pop sound in the portable HTML; no additional sound download is required."
      ]
    },
    {
      "title": "Menu music volume",
      "items": [
        "Set the default menu music slider and actual playback volume to 50%.",
        "Removed the extra hidden attenuation so the slider percentage directly matches playback volume.",
        "Preserved saved music-volume choices and the existing looping menu song, mute controls and stop-on-game-entry behavior."
      ]
    }
  ]
});
