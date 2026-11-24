window.PlatdoReleaseData.unshift({
  "id": "v10-0-apartments-online",
  "version": 10.0,
  "date": "2026-11-20",
  "major": true,
  "title": "Apartments in online rooms: buy one, ride the lift home, and choose who may visit",
  "thumbnail": "assets/images/ff20de23b33d12de6983.jpg",
  "thumbnailAlt": "A player inside a friend's apartment online: wood floor, dining table, a fireplace and the street through the glass",
  "summary": "The apartment lifts now work in online City rooms. Buy a home at the lift with your online City money and it is yours on that server: ride up through the short film straight into your hall. Other players can ask for access from the lift; you answer under Friends, Requests, or give a friend access from their More menu, and you can take it back at any time. The server checks every ride and keeps everyone without access out, and it remembers owners and guests across sessions, even when you are offline. This needs the new multiplayer server zip.",
  "sections": [
    {
      "title": "The lift online",
      "items": [
        "Walk up to the call panel in an apartment building's lobby and press the use key. The lift screen shows all eight homes: yours, homes you may visit (with the owner's name), homes owned by someone else (with Ask for access), and homes for sale.",
        "Buying costs $500,000 of your online City money. Each home has one owner on a server: whoever buys it there first. Homes you bought in Sandbox or Story stay separate.",
        "Going up plays the same short film as alone, and the server moves you into the home while the picture shows the building. Going down takes you back to the lobby. You cannot go home while the police are after you.",
        "The lift screen updates by itself when an owner answers your request."
      ]
    },
    {
      "title": "Who may visit",
      "items": [
        "Ask for access from the lift. The owner sees it under Friends, Requests in a new Apartment access section, clearly marked as an apartment request, and also gets a pop-up with Accept and Decline. You can cancel a request you sent.",
        "Owners can open a friend in the Friends list and choose More, Give Apartment Access (one button per home if you own several), and More, Revoke Apartment Access to take it back. Your guests are also listed under Requests with a Revoke button.",
        "Access lasts until the owner takes it back: across sessions and server restarts, and whether the owner is online or not. Blocking a player ends access both ways.",
        "The server decides everything: who owns what, who may ride the lift, and anyone standing in a home without access is put back in the lobby within a fraction of a second, including a guest whose access was just taken away. Houses and the mansion keep their own rules."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "Put the new multiplayer server zip on the host PC. Its own checks (npm test) now include the apartments, and its setup guide has a short Apartments online section.",
        "Tested on the real server on this PC with test players: buying, a second buyer refused (money kept), the lift only from the lobby, asking, accepting, declining, cancelling, giving, revoking (the guest was moved out at once), the guard, a block, and owners and guests still there after a server restart. Then the real game joined and did it all through the lift screen and the Friends panel.",
        "Also fixed on the server: a save that fails is now logged instead of stopping the whole server.",
        "The lift screen now says street view, not sea view, in the four Lantern Street buildings. In online rooms the Platdo Estates app points you to the lifts for buying.",
        "Multiplayer smoothing is unchanged from V9.9 and was checked again against the real server (updates every 68 ms).",
        "This file starts on a fresh save, like every new file."
      ]
    }
  ]
});
