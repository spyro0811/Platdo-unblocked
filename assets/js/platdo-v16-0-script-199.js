window.PlatdoReleaseData.unshift({
  "id": "v12-7-drive-thru-scenes-fixes",
  "version": 12.7,
  "date": "2026-11-21",
  "major": false,
  "title": "Drive-throughs that play out: money in, food in your face. Yell, a red DingDash, and a lot of fixes",
  "thumbnail": "assets/images/d3fac85f0d34655605ef.jpg",
  "thumbnailAlt": "Seen from the driver's seat at a pick-up window: sauce, mustard and lettuce splattered over the screen with SPLAT! in big letters",
  "summary": "The drive-throughs work the way you described them before: drive under the new DRIVE THRU gate and the game takes the wheel, drives you to the menu board, you order, it drives you to the window, you throw your money in and your food is thrown back at your face. The Food app is called Yell, DingDash is red and white, both with your logos. Fixed: getting hurt or losing a leg walking round a house, invisible walls, the mountain's ground, house paths running through other houses, and the drone pausing the game. Hold P to keep pooping, beds only work after 6 pm, X hides the drone's screen, and jumping out of a moving car is a head-first dive.",
  "sections": [
    {
      "title": "Drive-throughs",
      "items": [
        "Every fast-food place has a gate over the way into its lane: two posts and a lit DRIVE THRU beam. Drive under it the right way in a car or on a bike and the game takes the wheel and drives your own vehicle down the lane to the menu board.",
        "The menu opens at the board: the place's own food and drinks with what each one does for hunger and thirst and its price. Add as many as you like with + and -, then Order and pay (one payment), or Drive on without ordering.",
        "The game drives you round to the pick-up window. You see it from the driver's seat: someone is at the window, you throw your money in (the till rings), and your order is thrown straight back at your face. SPLAT: sauce and mustard all over the screen. You eat the lot there and then (it does not go in your bag) and your hunger and thirst go up by what you ordered.",
        "Then the game drives you out of the lane and gives you the wheel back. The map, meters and prompts are hidden while it plays. You cannot get out or steer while the game drives.",
        "Online the drive-throughs still take orders with the interact key at the board or the window, as in V12.6; the scene is single player for now."
      ]
    },
    {
      "title": "Fixed",
      "items": [
        "Getting hurt, or losing a leg, walking round a house. Standing on something the game did not count as ground (the edge of the bottom stair in the first house, furniture) made it think you were falling the whole time, and stepping off charged you for the fall (71 damage to a leg). Now anything solid you stand on counts. Checked with nearly 800 walks round the inside of every house after the fix: nobody got hurt.",
        "Invisible walls. The seven look-only buildings made smaller for the drive-through lanes in V12.6 had lost their shape but kept a solid box, so the drone and cars hit nothing you could see (four of them 30 to 60 m tall). They are built again at the smaller size, drawn and solid in the same places.",
        "The mountain's ground. On the steep hills the drawn ground was up to 4 m away from the ground you walk on, so you sank to the shoulders in places and walked on air in others. Those parts are drawn far more finely now and match within half a metre (spots more than 1 m off went from 264 to 12, the rest at the foot of near-vertical cliffs). The ground you walk on did not change.",
        "House paths through other houses: 13 houses in a back row drew their front path 40 to 60 m long, straight through the house in front and its floor. Paths and driveways now stop where another garden begins.",
        "Footpaths no longer lie on top of the drive-through lanes or the car parks of apartment buildings 11 and 12.",
        "Flying the drone no longer pauses the game: traffic and riders round you, restaurant guests, deliveries, the 6-7s and the apartments carry on, even when your character is not standing on flat ground."
      ]
    },
    {
      "title": "New",
      "items": [
        "Hold the poop key (P) and your character keeps pooping until you let go, on the ground or on a toilet. A tap still gives 2 or 3.",
        "Beds only work from 6 pm until 6 am (first house, mansion, houses, apartments, the shelter); in the day the bed says Sleep (after 6 pm). Online it goes by the room's clock.",
        "Drone: press X to hide the drone's whole screen and the propellers in view, so it is just the camera picture. Press X again to bring them back. Every flight starts with them shown. On a touch screen a small eye button does the same and the touch controls stay.",
        "Getting out of a moving car throws the door open and you dive out head first, out of the door and along the way the car was going, then tumble and get up."
      ]
    },
    {
      "title": "Yell and DingDash",
      "items": [
        "The Food app is called Yell, with your Yell logo as its phone icon and at the top of the app.",
        "DingDash is red and white instead of teal: its phone icon is your new DingDash logo, which is also the logo inside the app, and its buttons, banners, receipt, map route, signs and vehicles are red."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "New multiplayer server zip (V12.7): standing on things, diving out of a car, holding P, beds after 6 pm and the restored buildings are the same on the host. Checked: all 75 host tests pass, the host gives the same result when the same game is played twice, and a live test with three players passed (moving smoothly, leaving and the owner ending the session).",
        "Next: your drone's view on the phone your character holds sideways (others nearby can see it, online too), more sensible driving for the people in cars, a better GPS, people on foot who keep out of the road without walking such strict lines, drivers who park in free spaces instead of cars appearing in them, then shadows on everything and street corners that make sense.",
        "This file starts on a fresh save, like every new file."
      ]
    }
  ]
});
