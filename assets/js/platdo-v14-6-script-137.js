window.PlatdoReleaseData.unshift({
  "id": "v6-6-menu-fix-sounds-guests",
  "version": 6.6,
  "date": "2026-11-19",
  "major": true,
  "title": "The menu fixed, thirteen of your sounds, guests who come and go, a hand that grips, hands up done right, and nine banners",
  "thumbnail": "assets/images/2f74edd69035104bf5f6.jpg",
  "thumbnailAlt": "Left: your character at a diner table holding a plate with a burger and fries by its rim, thumb over the edge. Right, three small pictures from top to bottom: the diner with guests at several tables and people walking in; a 6-7 cashier with both hands up, arms out and bent, palms forward; the diner's menu with one dish lit and the new Back and Next buttons",
  "summary": "The restaurant menu no longer flickers or swallows clicks. Thirteen recordings you sent are in the game, each where you said. Guests now walk in, are served, eat and leave. Your hand closes round what it picks up. People who put their hands up do it properly. Nine more DingDash banners are in.",
  "sections": [
    {
      "title": "The menu at the table: the fault and the fix",
      "items": [
        "The fault was real and it was in V6.3, V6.4 and V6.5. Inside the leaning book, the browser lost a dish the moment that dish started its hover effect, so the dish flickered, and a click often landed on the page behind it. Low on a page it was worst.",
        "Measured with real mouse clicks on every dish of the diner's menu, at nine places on each: before, about half of the clicks did nothing. Now all 180 add the dish.",
        "A dish is added the moment the mouse button goes down. The dish that is lit is always the one you get.",
        "Which dish is under the pointer is worked out again on every frame, so the light stays right while the book leans. Between two dishes the light stays on the last one and does not blink.",
        "The page corner that turns the page is now a small triangle and no longer covers the end of the last dish. There are also Back and Next buttons with the page number beside the book, and the arrow keys still work.",
        "Text in the menu can no longer be selected by a double click, a dish picture can no longer be dragged away, and the card that shows a dish keeps one size, so the order slip does not jump.",
        "The book leans a little less than before."
      ]
    },
    {
      "title": "Your sounds",
      "items": [
        "Money pickup: plays when you pick up money from a dead person. It also plays for the other cash you pick up the same way: the money bag at a 6-7 and an emptied register.",
        "Cashier ka-ching: plays when you buy something in person. That is a fast-food counter, a 6-7, the bill at a restaurant table, a clothing or equipment store, and the mechanic. Orders made on the phone stay quiet.",
        "Keypad beep: in a 6-7 robbery the cashier now hurries to the register, leans over it and keys it open, with eight beeps, before taking the bag out and throwing it. The whole robbery takes about two seconds longer.",
        "Door bell: rings at your house when a DingDash order is left at the door. You hear it up to 70 metres from the door, quieter the further you are. The phone also gets a notification, DingDash: your order is at your door.",
        "Mouse click: plays when you choose an item in a food menu: a dish in a restaurant menu, Buy or Eat now at a counter, the plus at a 6-7, the plus in DingDash.",
        "Soft click: plays when the pointer comes onto an item in any of those menus.",
        "Button click: plays for Send to the kitchen, and for placing a DingDash order.",
        "Eating, short: a starter, a side or a dessert at a table. Eating chips: a main course, a pizza or a pasta at a table; the chewing lasts longer to match.",
        "Gulp: a drink at a table, twice while the glass empties.",
        "Eat from the bag: eating or drinking anything from your food bag.",
        "Squish: each of the two times delivery food goes into your face. Mmm: when you wipe it off.",
        "None of these has a fade or any other change. Each starts where its sound starts in the file, so there is no wait.",
        "I set the loudness of each from measurements of the file. I cannot hear them, so tell me which are too loud or too quiet."
      ]
    },
    {
      "title": "The sound stays on in a restaurant",
      "items": [
        "Before, the game switched all sound off as soon as you sat down, opened a counter or a shop screen. That is why the restaurant recording stopped while you ate, and why none of the table sounds were ever heard.",
        "Now the sound stays on at a restaurant table, at a fast-food counter, in a 6-7, in a shop screen, in DingDash and in the food bag. The restaurant recording plays the whole time you are inside, also on the deck of The Salty Pelican."
      ]
    },
    {
      "title": "Guests come and go",
      "items": [
        "In all four table-service places, parties of one to four now arrive on the pavement, walk in through the door, go to a free table and sit down.",
        "A waiter comes for the order. The kitchen cooks while the waiters see to other tables. A waiter fetches the tray from the pass, carries it over with both hands and sets the dishes down.",
        "The party eats for one to two minutes, gets up and walks out. The empty plates stay until a waiter has cleared them. Only then is the table free again, for them or for you.",
        "Each place now has two waiters. The first one is yours as soon as you sit down; until then both look after the other guests.",
        "A new party only comes in while there are tables to spare and the waiters are keeping up, so the room stays about a third full.",
        "The guests are for show: you walk through them, they do not react to you, and nothing about them is saved."
      ]
    },
    {
      "title": "The hand grips what it picks up",
      "items": [
        "A plate, a board or a pizza is held by its rim: the fingers flat underneath, the thumb over the edge.",
        "A glass, a shake, a bottle, a mug, a cup of fries or a small bowl is wrapped: the palm against its side, the fingers round the far side, the thumb on top. The hand stays on a glass as it tips to drink.",
        "The fingers close as the dish is lifted and open again when it is set down. The hand also puts an empty plate or glass back.",
        "Both hands now lie flat on the table when they hold nothing."
      ]
    },
    {
      "title": "Hands up",
      "items": [
        "People who raise their hands now hold each arm out to its own side and up, bent at the elbow by 45 degrees, with the hands above the head, the palms forward and the fingers straight.",
        "Before, the two arm angles were the wrong way round, which is why the arms crossed over the head."
      ]
    },
    {
      "title": "DingDash banners",
      "items": [
        "Your nine banners are in: Mandy's, Chick-Phil-B, Tubeway Subs, Chili Pot, Dairy Duchess, Five Pals, Burger Duke, Shake Shed and Braising Wayne's. Every place in DingDash now has a banner.",
        "Your banner writes Chili Pot as two words, so the name in the game and the sign on the building now say Chili Pot too.",
        "Your banner writes Brasing Wayne's, without the letter i. The building still says Braising Wayne's. Tell me which spelling you want and I will make the other one match."
      ]
    },
    {
      "title": "Good to know",
      "items": [
        "Multiplayer hosts need the new server zip (V6.6): the 6-7 and the restaurant files are shared with the host.",
        "Checked in the game: every dish of one menu with real mouse clicks; both page corners, Back and Next, the minus on the slip; a 6-7 robbery from start to finish, twice, with the beeps counted; the money bag pickup; a full meal at the diner with each sound counted; buying and eating at a counter; a DingDash order from the kitchen to the door, the bell, and the feast; pictures of the grip on a plate and on a glass, of the hands-up pose, and of the diner with guests.",
        "Not checked: how anything sounds, because I cannot listen; the guests at the three other places one by one (they run the same code); a touch screen; the multiplayer host, which cannot be run here.",
        "Next: ordering from a menu at a table in the fast-food places, with guests and better rooms there too. After that the remaining mechanics. No new buildings until the map has been redrawn to your picture."
      ]
    }
  ]
});
