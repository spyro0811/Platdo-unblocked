window.PlatdoReleaseData.unshift({
  "id": "v6-3-sit-down-restaurants",
  "version": 6.3,
  "date": "2026-11-18",
  "major": true,
  "title": "Sit-down restaurants: take a seat, read the menu, a waiter brings your food",
  "thumbnail": "assets/images/4ce429693f4edcab4d71.jpg",
  "thumbnailAlt": "Two pictures side by side. Left: the open leather menu of Ember & Oak, with the pages From the Fire and On the Side and a small picture beside every dish. Right: your character in a red booth at The Copper Kettle with a burger and fries, onion rings, a chocolate malt, a coffee and a slice of pie on the table",
  "summary": "The restaurants with the menu and the ordering that you asked about. Platdo City now has three places where you sit down, read a menu that turns its pages, give your order to a waiter, wait while the kitchen cooks it, and eat it by dragging each dish to your mouth. This is the first part: more restaurants and more fast-food brands come next. It also fixes a fault that stopped the game saving in the south of the city.",
  "sections": [
    {
      "title": "Three places with table service",
      "items": [
        "The Copper Kettle, the diner that was already in the City. Its room is new: red booths under the front windows and along both side walls, a long counter with ten stools in front of the kitchen, tables in the middle, a black and white floor, a jukebox. Before, its three booths stood four metres away from their tables. It keeps the front it got in V4.6. 60 seats.",
        "Ember & Oak, a steakhouse. New building on the same street as The Copper Kettle and Captain Cluck's, further east, just past the last city block. Dark timber, a slate roof, a stone chimney, a porch on heavy posts with a red carpet. Inside: white tablecloths, leather booths, a bar with brass stools, a fireplace, a wine wall, brass lamps. 38 seats.",
        "Nonna Rosa's, an Italian trattoria. New building next to Taco Chime, on its east side. Ochre walls, a tiled roof, green shutters, flower boxes, striped awnings, and a pergola with vines and a string of lights over a front terrace. Inside: checked tablecloths, wooden chairs, an open kitchen with a brick wood oven. 40 seats.",
        "Each has its own menu of 20 dishes, 60 in all. Every dish is its own small 3D model: the dish on your table is the dish in the menu's picture.",
        "Each place has guests at about a third of its tables, a waiter and a cook. The two new places also have a host at a stand by the door, who greets you."
      ]
    },
    {
      "title": "Sitting down",
      "items": [
        "Walk up to any free chair or booth seat. The prompt says Sit down. Press the interact key (F unless you changed it).",
        "A table that already has guests is taken. Choose an empty one.",
        "You walk to the seat and sit, and the menu opens. You stay seated until you leave: there is no walking about in the middle of a meal.",
        "Opening the pause menu does not end the meal. When you close it you are back at your table."
      ]
    },
    {
      "title": "The menu",
      "items": [
        "The menu is a book lying in front of you, not a list of buttons. It leans toward the pointer as you move it, and the shine on its pages moves as it leans.",
        "Each place has its own: a glossy laminated card with a checkered band at The Copper Kettle, a stitched leather folder with cream pages and gold lines at Ember & Oak, and a wooden clipboard with a checked border at Nonna Rosa's.",
        "Turn the page at the bottom corner, or with the left and right arrow keys. The corner lifts under the pointer. The page turns as a bending sheet with the next page on its back and a shadow moving under it.",
        "Point at a dish and its name lights up, with a soft tick, and a card beside the book shows a large picture, what it is, how much hunger and thirst it gives back, and the price.",
        "Click a dish to add it. A number appears on it and it is written on the order slip beside the book, with the total, the bill so far, your money and how much room is left on your table. The minus on the slip takes one off.",
        "On the lowest two graphics settings the moving shine and the soft shadow are switched off."
      ]
    },
    {
      "title": "The waiter and the kitchen",
      "items": [
        "Press Send to the kitchen. The waiter walks to your table, you give your order (it shows above your head), the waiter writes it down, nods, and goes to the kitchen.",
        "The view cuts to the kitchen: the cook works at the stove, then at the pass, and the dishes on the order are ticked off as they are ready. This takes 2.4 to 6.5 seconds, longer for a steak than for a glass of water.",
        "The waiter comes back with everything on a tray and sets each dish down in front of you.",
        "The whole thing takes 15 to 25 seconds. Hold the mouse button to run it three times as fast.",
        "The waiter finds a way between the tables and chairs. A long walk across the big diner is cut short, the way a film cuts it."
      ]
    },
    {
      "title": "Eating",
      "items": [
        "Your food is on the table in front of you. Take a dish with the pointer and drag it to your mouth. It lifts, follows with a little weight, and your hand goes with it. A ring shows where your mouth is and lights up when the dish is there.",
        "Let go there and you eat it in one go: your character leans in, chews and wriggles, a word such as Yum pops up with what you gained, and the empty plate goes back and is cleared.",
        "A drink tips as it nears your mouth. Let go and your head goes back, the glass tips up and empties, with three gulps.",
        "Let go anywhere else and the dish goes back to its place.",
        "Point at a dish to see its name and what it gives. Hunger and thirst stop at 100.",
        "The Menu button at the top left opens the menu again, so you can order more. The table holds six dishes at a time."
      ]
    },
    {
      "title": "The bill",
      "items": [
        "Everything you order goes on one bill. You cannot order more than you can pay for: each order is checked against your money and the bill so far.",
        "The red button at the top left says Leave and Pay with the amount. Press it: you pay once, the table is cleared, and you stand up beside your seat. You pay for everything you ordered, eaten or not.",
        "If you have ordered nothing, the button says Leave and it costs nothing.",
        "If the game is closed while you are at the table, the bill is kept in your save and charged the next time you sit down anywhere, with a message."
      ]
    },
    {
      "title": "House rules",
      "items": [
        "Inside any restaurant or diner, the six fast-food places included, you cannot jump, and you cannot draw, aim, fire or throw a weapon. A weapon in your hand is put away as you walk in. This holds whatever your wanted level is.",
        "It does not apply in the 6-7 stores, where robbing the cashier still works, or during a mission, in case the mission needs its fight.",
        "The guests, the waiter and the cook cannot be walked into or knocked over, and they cannot knock you over."
      ]
    },
    {
      "title": "Fixed: the game would not save in the south of the city",
      "items": [
        "This fault was already in earlier versions. The beach has 362 people of its own, and a save may hold 180 people at most. The beach crowd appears when you come within 430 metres of the beach and stays until you are 600 metres away, which covers the southern half of the city. In all that area every save failed with the message Save failed: Invalid citizens limit.",
        "Beach people and the beach's pedal boats are now left out of the save. They were never read back from a save anyway: the beach fills itself again when you come near.",
        "If you saw that message, save again in this version and your progress is kept."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "Multiplayer hosts need the new server zip (V6.3). The two new buildings, the diner's new room, the rules indoors and the save fix are part of what the host shares.",
        "Table service is single player only for now. In a multiplayer room the buildings and furniture are there, but there are no guests, no waiter and no Sit down prompt.",
        "Not built yet from what you asked for: guests who arrive and leave (they sit and eat the whole time), alcohol, bars, the drive-through, the casual and the fine-dining restaurant, the other fast-food brands, eating together in multiplayer, and the rule that walking into people indoors never knocks you over (only the restaurant's own people follow it so far).",
        "The staff wear ordinary clothes from the game's wardrobe, not a uniform for each place yet. The menu and eating sounds are made by the game, not recordings.",
        "Checked in the game: all three rooms and both new fronts in pictures; sitting at a booth, a table for four and a table for two; all three menus, turning pages, adding and removing dishes; a full table and not enough money; the whole order at each place; eating, drinking and missing the mouth; ordering again; paying; leaving for nothing; the pause menu during a meal; an unpaid bill after a reload; the rules indoors; saving beside and on the beach; the fast-food counters and the diner's own till still working.",
        "Not checked: the multiplayer host, which cannot be run here; a touch screen; the sounds by ear; the two lowest graphics settings; story mode."
      ]
    }
  ]
});
