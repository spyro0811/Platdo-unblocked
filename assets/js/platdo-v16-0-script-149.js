window.PlatdoReleaseData.unshift({
  "id": "v7-7-carjack-visitors-riders",
  "version": 7.7,
  "date": "2026-11-19",
  "major": true,
  "title": "Pull drivers out of the cars you steal; restaurant guests drive, ride or walk there and leave the same way; bike, e-bike and motorbike riders; traffic wherever you go; and the City saves again after a DingDash delivery",
  "thumbnail": "assets/images/8567ac0fcf270ff88bfb.jpg",
  "thumbnailAlt": "Left: the player at the open door of a teal car dragging the driver out, the driver's arms in the air. Right: a dark blue car backing out of a bay in a restaurant's car park beside other parked cars",
  "summary": "Stealing a car with someone in it now means opening the door, dragging them out and throwing them down. Guests at the restaurants no longer appear at the door: they come by car, by bike or on foot and leave the same way. There are riders on the streets and traffic round you wherever you go. And an important fix: in V7.6 the City stopped saving after your first DingDash delivery; it saves again.",
  "sections": [
    {
      "title": "Fix: saving after a DingDash delivery",
      "items": [
        "In V7.6 the driver's photo of your food was kept inside your save, and a save may not hold a piece of text that long. So after your first delivery every save failed (you would have seen a save warning), and progress after it was not kept. Sorry about that.",
        "The photos now live in their own small store in the browser (the newest five) and the save only holds a short reference to them. The notification, the tracking page and the order history show them as before.",
        "Checked: a delivery, then the game's own save check (accepted) and a real save (written)."
      ]
    },
    {
      "title": "Carjacking",
      "items": [
        "Take a car that has someone at the wheel and you walk up to the door with the driver still sitting there. You open the door, reach in, drag them out backwards and throw them to the ground beside the car, then get in and shut the door.",
        "They land a few metres away, get up and run off. It counts as taking a vehicle, as before.",
        "The driver of a traffic car was only a stand-in until now; they become a real person the moment you pull them out.",
        "Works for multiplayer hosts too (the new server zip has it)."
      ]
    },
    {
      "title": "Guests travel to the restaurants",
      "items": [
        "Nobody appears at a restaurant's door any more. Every new party comes by car, by bike or on foot.",
        "By car: the car drives in from somewhere you cannot see, turns into the restaurant's own car park and parks in a free bay. The party gets out and walks round to the front door through the passage beside the building.",
        "When they have eaten they walk back the same way and get in, and the car backs out of the bay onto Foundry Way and drives off. It is an ordinary parked car while they eat: you can steal it, and then they walk home.",
        "By bike: ridden into the car park and left at the side. On foot: they come from 40 to 60 metres down the front and leave the other way.",
        "Parties who were already eating when you arrived leave on foot down the street instead of vanishing at the door.",
        "Daily routine: places are busiest at lunch (11 to 2) and dinner (5 to 9), quieter in the morning and afternoon, and nearly empty late at night. At night more guests come by car.",
        "The cars parked in the car parks stay as before; visitors come and go among them."
      ]
    },
    {
      "title": "Riders and traffic",
      "items": [
        "Up to three riders at a time on the streets near you: bicycles, e-bikes, mopeds and motorbikes, at their own speeds, near the kerb. No planes or helicopters.",
        "The game made its traffic only once, round your first home, so most of the island had almost none. Now cars with the game's own traffic drivers are kept round you wherever you go (about 14 within a few hundred metres), and the ones left far behind are taken away.",
        "In the test the beach front had 13 traffic cars near you instead of 4."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "Speed: more vehicles cost drawing time. On the busy beach front a frame takes about a sixth longer than in V7.6 (41 against 35 thousandths of a second in my test window); at your first home and in the city centre it is the same. I limited it to 14 traffic cars, 3 riders and 6 arriving cars or bikes at a time.",
        "This file starts on a fresh save, like every new file.",
        "Checked in the game: a carjack from start to finish; a car party from arrival to driving off; walking parties; riders; the traffic count; saving at the beach front with all of it about; the map unchanged; the multiplayer host's copies load and build the same map.",
        "Not checked: carjacking on a motorbike, a police car or in multiplayer for real; guests by bike from start to finish; night."
      ]
    },
    {
      "title": "Next",
      "items": [
        "V7.8: the map about half as wide, with some of the shops moved in among the houses and buildings."
      ]
    }
  ]
});
