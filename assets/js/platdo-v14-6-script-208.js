window.PlatdoReleaseData.unshift({
  "id": "v13-8-fixes",
  "version": 13.8,
  "date": "2026-11-22",
  "major": false,
  "title": "One pen when signing, a smoother drone, and traffic that keeps moving",
  "thumbnail": "assets/images/51620307aa642be51e06.jpg",
  "thumbnailAlt": "A dealership purchase agreement with a signature drawn on it and one pen whose tip is at the end of the ink",
  "summary": "Signing an agreement shows one pen, right where the ink goes. The drone leans smoothly instead of snapping, and ARMED blinks only when you take off. Traffic no longer stops at red lights that are not there, and cars drive round a car that has stopped in the road.",
  "sections": [
    {
      "title": "Signing an agreement",
      "items": [
        "There were two pens: the mouse pointer was drawn as a pen and a second pen followed it, and neither tip was where the ink went (one was about 18 pixels off, the other about 30). Now the pointer is hidden over the signing box and there is one pen, with its tip exactly on the ink.",
        "The signing box was also measured before it had settled to its final size, which stretched the ink a few pixels away from the pen. It is measured again whenever its size changes."
      ]
    },
    {
      "title": "Flying a drone",
      "items": [
        "The drone's lean now eases in and out on a soft spring: about a third of a second to lean most of the way, with no jump when you press a key and no wobble when you let go. Before, it jumped part of the way in one frame and finished in a tenth of a second. Other players' drones lean the same smooth way, and the picture on the drone screen leans with it.",
        "ARMED blinks three times when you take off and then stays lit, instead of blinking for the whole flight."
      ]
    },
    {
      "title": "Traffic",
      "items": [
        "Cars stopped at red lights that were not there: the roads are made of pieces, and the cars treated the end of every piece as a junction with a light. Most of those are only where a road bends or two pieces join. Now cars stop on red only at real junctions where a traffic light stands.",
        "A car that stands still for any reason but a red light, a junction or the car in front of it (it stopped for someone in the road, or for no reason at all) is driven round by the cars behind it after about three seconds, as already happened with parked and broken-down cars. Before, a traffic car was only driven round after half a minute.",
        "Checked over six minutes of traffic: the long stops fell from 88 to 62, and every stop at a red light is now at a real light."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "The traffic fix is in the room host too: use the new V13.8 multiplayer server zip. Online updates were checked to arrive steadily (about every 69 ms) and all 100 server tests pass.",
        "This file starts on a fresh save, like every new file."
      ]
    }
  ]
});
