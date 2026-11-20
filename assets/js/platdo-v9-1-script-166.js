window.PlatdoReleaseData.unshift({
  "id": "v8-9-shape-flicker-carjack-crashes",
  "version": 8.9,
  "date": "2026-11-19",
  "major": false,
  "title": "A more natural girl, flicker fixes, hidden buildings skipped, a proper carjack, NPCs thrown in crashes and your new sounds",
  "thumbnail": "assets/images/90bfbed38016830e368e.jpg",
  "thumbnailAlt": "Two cars in a head-on crash on a city street; the driver of the parked car flies out over the bonnet as the windscreen shatters",
  "summary": "The girl's body and legs are now one width with a slimmer waist, and her chest blends in naturally. Flicker was hunted down at every shop, restaurant, home and car park. The graphics scan only happens while the game loads, buildings hidden behind other buildings are no longer drawn, carjacking happens in clear steps, NPCs fall off bikes and fly through windscreens (never DingDash couriers), and your glass, grass and buzzing recordings are in.",
  "sections": [
    {
      "title": "The girl",
      "items": [
        "Her hips are never wider than her shoulders now, and her legs are a little slimmer, so body and legs read as one width instead of looking heavy.",
        "Her waist is a little thinner, so she keeps a feminine shape.",
        "The chest blends into the bust gradually. In a T-shirt the cloth now falls straight down from the fullest point, like real fabric, instead of showing two round shapes. Swimwear keeps its own shape.",
        "The small movement when she moves is now about a centimetre at most, so the blend never shows.",
        "Her hands stay clear of her hips, and bob hair styles 8 and 9 are no longer see-through from the front."
      ]
    },
    {
      "title": "Flicker (Z-fighting)",
      "items": [
        "Every shop, restaurant, home, garage and car park was checked from the front and from above with the flicker detector.",
        "Fixed: the Taco Chime sign (it lay exactly on the bell gable's face; it now sits in front of it and above the porch), the bunting strings at Taco Chime, the red-white-blue diner and the sit-down patios, the Salty Pelican deck boards against the table bases, the Burger Duke battlements against its roof, the roller doors of garages, warehouses and the hangar, shop shelving, warehouse corner posts, the first home's garage floor, and the ceilings and floors of shops, garages and warehouses.",
        "Every car: the tail lights overlapped the reversing lights and indicators at the same depth. They no longer overlap.",
        "Left over: four tiny corner spots of a few pixels each (at the Copper Kettle diner, Drip District and the mansion front), and a faint shimmer on far towers more than 500 m away."
      ]
    },
    {
      "title": "Graphics",
      "items": [
        "The automatic scan of your computer happens during the game's main load, and is done once more for this version.",
        "Automatic no longer lowers your settings while you are playing. Step-downs it made in earlier play are forgotten, so the scan alone decides. Settings you chose yourself are kept."
      ]
    },
    {
      "title": "Hidden buildings are skipped",
      "items": [
        "Blocks of the city, homes, the mansion, the casino, signs and the beach car park that are completely hidden behind solid buildings are no longer drawn. They still cast their shadows.",
        "Shops and restaurants with glass fronts never count as walls, so nothing disappears behind a window. Checked from 14 places: nothing you can see goes missing.",
        "Honest result: about 3 percent fewer things drawn in the views tested, because most of what is hidden was already off screen. It costs well under a millisecond."
      ]
    },
    {
      "title": "Carjacking",
      "items": [
        "Now in clear steps: you open the door, lean in and grab the driver while they are still in the seat, pull them out through the door, turn and throw them clear, then get in and close the door.",
        "It takes about a second longer than before. The driver lands, gets up and runs."
      ]
    },
    {
      "title": "Crashes",
      "items": [
        "NPCs do not wear seatbelts: hit the front of their car hard (about 60 km/h or more) and they go out through the windscreen. The windscreen shatters into splinters, like a smashed side window (any glass broken in a crash does now, instead of flying off in one piece), and their car rolls to a stop.",
        "People riding bicycles, e-bikes, mopeds and motorbikes fall off when you hit them, like you do. The bike stays where it fell.",
        "Traffic and police drivers become real people when they are thrown out (before, they just vanished).",
        "DingDash couriers never fall off, are never thrown and cannot be hurt, on the bike or walking to your door."
      ]
    },
    {
      "title": "Your sounds",
      "items": [
        "Glass shatter: every window and windscreen that breaks, including the car break-in and every windscreen someone flies through.",
        "Grass footstep: walking on grass. Each step is its own sound, so they overlap, and it is a little quieter than the other footsteps.",
        "Buzzing wires: loops in the Waiting Game while it is on screen, pauses when you leave it and stops when the round starts."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "This file starts on a fresh save, like every new file.",
        "A new multiplayer server zip goes with it (crashes, the carjack and some buildings are worked out on the host too).",
        "Next: the rest of the list: a weak spotlight from the phone camera's flash, the Platdo Drive guardrails in the City, car park kerbs at low speed, people reacting to a gun pointed at them (and men fighting back when punched), every City car's seating checked, and smoother light inside cars."
      ]
    }
  ]
});
