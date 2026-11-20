window.PlatdoReleaseData.unshift({
  "id": "v28-city-home-fixes",
  "version": 28,
  "date": "2026-11-10",
  "major": false,
  "title": "Mansion basement and saved avatar fixes",
  "thumbnail": "assets/images/01b827c49055755c1412.png",
  "thumbnailAlt": "The furnished mansion basement in Platdo City with a clear floor",
  "summary": "A real terrain opening beneath the mansion, and City entry that remembers your existing character.",
  "sections": [
    {
      "title": "Clear mansion basement floors",
      "items": [
        "Removed the actual outdoor ground mesh from beneath the Mega Modern Mansion's full basement footprint, including the indoor pool, so the basement no longer relies on a visual mask alone.",
        "Kept the basement's authored floors, walls, stairs, pool steps, pool water and furniture intact.",
        "Preserved outdoor terrain heights and colors along the mansion boundary, including the surrounding lawn and approach roads.",
        "Kept mansion ownership, purchases, saves and authoritative world collision unchanged."
      ]
    },
    {
      "title": "City remembers your created character",
      "items": [
        "City now recognizes an already-created character when starting a new Story or entering Sandbox for the first time, so returning players do not have to pick a character again.",
        "First-time players still get all six original character choices. Viewing the menu or a character preview does not mark character creation complete.",
        "Continuing Sandbox restores the latest shared City/Drive character and wardrobe; an existing Story keeps its own saved appearance.",
        "Starting the other City mode reuses your character and authored skin/hair choices while keeping Story and Sandbox money, purchases, equipment, missions, and other progress separate.",
        "Your first accepted character choice is remembered immediately, without requiring a later wardrobe edit before it survives a reload or selective City reset.",
        "New Story still asks before replacing an existing save. Cancel, Back, and Escape return to the menu without reopening character creation or overwriting your progress.",
        "Existing City saves made before shared-character persistence are recognized, including a valid backup when the main save is unreadable.",
        "When older Story and Sandbox saves both exist without a shared avatar, opening Story preserves Sandbox’s separate character and equipped outfit.",
        "City waits for account and cloud-progress readiness before starting or loading a profile, preventing a default character from being saved during account restoration.",
        "The phone and home wardrobe remain available for intentional appearance changes; saved edits still carry into later sessions.",
        "Selective City reset preserves the shared character as before; a full collection reset clears it and restores first-time character setup."
      ]
    }
  ]
});
