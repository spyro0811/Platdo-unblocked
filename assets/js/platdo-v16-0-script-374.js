
/* PLATDO City restaurants (V5.0, first stage of the food and delivery work).
 * - BRANDS: six places to eat, each with its own building, sign, colours and menu. The names are the game's own.
 * - ITEMS: the food and drink catalogue: price, what it does for hunger and thirst, a short description.
 * - services() / furnish(): the buildings as the world file wants them (walls, door, counter, booths, seats, staff).
 * - Hunger and thirst (single player for now): two meters that run down while you play the City. At zero you
 *   start to lose health every two minutes, more each time. Food is bought at a counter, kept in a bag, eaten later.
 * - dress() / signs() / solids() / palette(): the outside of each building. city-storefronts.js hands these over.
 * - hud() / render() / click(): the two round meters beside the minimap, the ordering screen, the food bag.
 * The first half of the file is shared with the multiplayer host; everything from "game only" down needs a page. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityRestaurants=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const W=22,D=18,H=4.6,TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const I=(id,name,about,price,hunger,thirst,icon)=>({id,name,about,price,hunger,thirst,icon,drink:thirst>hunger});
const BRANDS=[
 {id:'eat-big-micks',name:"Big Mick's",kind:'burger',tag:'BURGERS · FRIES · SHAKES',x:-335,z:156,
  look:{wall:'#f1e7d4',stone:'#e2d6bd',frame:'#7a2a24',roof:'#8a8d8a',accent:'#f6c21c',floor:'#c9b79a',room:'#f3e9d6',counter:'#c8242b',booth:'#c8242b',table:'#f3e3bf'},
  menu:[I('mick-burger','Big Mick','Two patties, cheese, pickles and house sauce.',6,45,0,'\u{1F354}'),I('mick-cheese','Cheese Mick','One patty with melted cheese.',4,32,0,'\u{1F354}'),I('mick-nibbles','Mick Nibbles','Six crispy chicken bites.',4,24,0,'\u{1F357}'),I('mick-fries','Crinkle Fries','Salted and hot.',3,18,0,'\u{1F35F}'),I('mick-shake','Thick Shake','Vanilla, cold and slow to drink.',4,10,30,'\u{1F964}'),I('mick-cola','Fizz Cola','A large cup with ice.',2,0,38,'\u{1F964}')]},
 {id:'eat-captain-clucks',name:"Captain Cluck's",kind:'chicken',tag:'FRIED CHICKEN · SEASIDE RECIPE',x:-5,z:156,
  look:{wall:'#f4f1ea',stone:'#e4dfd2',frame:'#1f3a5f',roof:'#8f979a',accent:'#c8242b',floor:'#b9a98c',room:'#f2efe6',counter:'#1f3a5f',booth:'#c8242b',table:'#efe6d2'},
  menu:[I('cluck-bucket','Deck Bucket','Eight pieces of fried chicken.',12,80,0,'\u{1F357}'),I('cluck-sandwich','Crispy Captain','A fried fillet in a soft bun.',6,42,0,'\u{1F96A}'),I('cluck-tenders','Crew Tenders','Four tenders with dip.',6,40,0,'\u{1F357}'),I('cluck-mash','Mash and Gravy','A warm side.',3,20,0,'\u{1F963}'),I('cluck-biscuit','Butter Biscuit','Fresh from the oven.',2,12,0,'\u{1F9C8}'),I('cluck-lemonade','Sea Breeze Lemonade','Sharp and cold.',3,0,45,'\u{1F34B}')]},
 {id:'eat-pizza-shack',name:'Pizza Shack',kind:'pizza',tag:'WOOD-FIRED PIZZA',x:25,z:-87,
  look:{wall:'#a5563f',stone:'#8f4937',frame:'#2f5a3d',roof:'#b3261e',accent:'#2f7d4f',floor:'#b98f6a',room:'#f0dfc4',counter:'#6b4a2f',booth:'#2f7d4f',table:'#f3ead8'},
  menu:[I('shack-pepperoni','Pepperoni Pie','A whole pizza with pepperoni.',11,75,0,'\u{1F355}'),I('shack-garden','Garden Pie','A whole pizza with peppers, olives and mushrooms.',11,70,0,'\u{1F355}'),I('shack-slice','Cheese Slice','One big slice.',3,22,0,'\u{1F355}'),I('shack-knots','Garlic Knots','Six knots with butter.',4,25,0,'\u{1F9C4}'),I('shack-cannoli','Cannoli','Crisp shell, sweet filling.',3,14,0,'\u{1F9C1}'),I('shack-orange','Orange Soda','In a glass bottle.',2,0,38,'\u{1F9C3}')]},
 {id:'eat-taco-chime',name:'Taco Chime',kind:'taco',tag:'TACOS · BURRITOS · NACHOS',x:175,z:333,
  look:{wall:'#ecd0a4',stone:'#e2c08e',frame:'#6b4a2f',roof:'#b5532f',accent:'#6a3fa0',floor:'#c98f63',room:'#f4e2c0',counter:'#1f9b96',booth:'#6a3fa0',table:'#f1d9a8'},
  menu:[I('chime-burrito','Bell-Ringer Burrito','Rice, beans, grilled meat and salsa.',6,50,0,'\u{1F32F}'),I('chime-nachos','Loaded Nachos','Chips under cheese and beans.',5,34,0,'\u{1F9C0}'),I('chime-quesadilla','Cheese Quesadilla','Folded and toasted.',4,30,0,'\u{1FAD3}'),I('chime-taco','Crunchy Taco','One hard-shell taco.',2,16,0,'\u{1F32E}'),I('chime-churros','Churros','Cinnamon sugar.',3,15,0,'\u{1F369}'),I('chime-horchata','Horchata','Sweet rice milk over ice.',3,5,40,'\u{1F95B}')]},
 {id:'eat-moonbeans',name:'Moonbeans Coffee',kind:'coffee',tag:'COFFEE · TEA · BAKERY',/* V7.0: on the front row, facing the sea */x:-322,z:695,
  look:{wall:'#d9d2c2',stone:'#c9c0ac',frame:'#2c3134',roof:'#5f6b66',accent:'#1f4a3c',floor:'#9a7a58',room:'#ece4d2',counter:'#1f4a3c',booth:'#9a6b3f',table:'#d9c3a0'},
  menu:[I('moon-water','Bottled Water','Plain and cold.',1,0,55,'\u{1F4A7}'),I('moon-tea','Iced Peach Tea','A tall glass.',3,0,50,'\u{1F9CB}'),I('moon-cold','Cold Brew','Strong, over ice.',4,0,45,'\u{1F9CA}'),I('moon-latte','Moon Latte','Espresso with steamed milk.',4,3,35,'☕'),I('moon-espresso','Double Espresso','Small and quick.',3,0,15,'☕'),I('moon-sandwich','Breakfast Sandwich','Egg and cheese on a roll.',5,36,0,'\u{1F96A}'),I('moon-muffin','Blueberry Muffin','Baked this morning.',3,20,0,'\u{1F9C1}')]},
 {id:'eat-dippin-donuts',name:"Dippin' Donuts",kind:'donut',tag:'DONUTS · BAGELS · COFFEE',/* V7.0: on the front row, facing the sea */x:-292,z:695,
  look:{wall:'#fbf3ea',stone:'#f3e3d2',frame:'#b84a7c',roof:'#a39a92',accent:'#f06fa6',floor:'#d9b89a',room:'#fdf0e4',counter:'#f06fa6',booth:'#f59a2e',table:'#fff3df'},
  menu:[I('dip-dozen','Dozen Box','Twelve assorted donuts.',10,70,0,'\u{1F369}'),I('dip-bagel','Everything Bagel','Toasted, with cream cheese.',3,24,0,'\u{1F96F}'),I('dip-sprinkle','Sprinkle Donut','Pink icing and sprinkles.',2,13,0,'\u{1F369}'),I('dip-glazed','Glazed Donut','The plain classic.',2,12,0,'\u{1F369}'),I('dip-cocoa','Hot Cocoa','With a little foam.',3,6,28,'☕'),I('dip-coffee','Drip Coffee','A fresh cup.',2,0,30,'☕')]},
 /* V6.4: six more brands. kind picks the building; cat is the DingDash category. */
 {id:'eat-burger-duke',name:'Burger Duke',kind:'duke',cat:'burger',tag:'FLAME-GRILLED BURGERS',x:-518,z:156,
  look:{wall:'#f0e6d2',stone:'#cfc3aa',frame:'#3b2a20',roof:'#8a7a66',accent:'#e8762a',floor:'#b98f6a',room:'#f3e7d0',counter:'#e8762a',booth:'#2a5fa8',table:'#f1dfbf'},
  menu:[I('duke-flame','Flame Duke','Two patties off the open flame, with smoky sauce.',7,50,0,'\u{1F354}'),I('duke-royale','Chicken Royale','A long crispy fillet with lettuce and mayo.',6,44,0,'\u{1F96A}'),I('duke-crown','Onion Ring Crown','A ring of rings.',4,20,0,'\u{1F9C5}'),I('duke-fries','Royal Fries','Thick cut and salted.',3,18,0,'\u{1F35F}'),I('duke-sundae','Fudge Sundae','Soft serve under hot fudge.',4,14,6,'\u{1F368}'),I('duke-slush','Grape Slush','Purple and very cold.',3,0,40,'\u{1F964}')]},
 {id:'eat-mandys',name:"Mandy's",kind:'mandy',cat:'burger',tag:'SQUARE BURGERS \u{B7} FROZEN CUSTARD',x:-230,z:-87,
  look:{wall:'#f6efe0',stone:'#e6dcc8',frame:'#a8241c',roof:'#5a6b78',accent:'#f2c230',floor:'#c9b79a',room:'#f7efe0',counter:'#a8241c',booth:'#2f6f8f',table:'#f3e3bf'},
  menu:[I('mandy-single','Square Deal','One square patty that hangs over the bun.',5,40,0,'\u{1F354}'),I('mandy-double','Double Square Deal','Two square patties and two slices of cheese.',7,55,0,'\u{1F354}'),I('mandy-potato','Baked Potato','With butter and chives.',3,24,0,'\u{1F954}'),I('mandy-chili','Cup of Chili','Slow cooked, with beans.',3,22,4,'\u{1F963}'),I('mandy-nuggets','Chicken Nuggets','Six, with honey mustard.',4,24,0,'\u{1F357}'),I('mandy-custard','Frozen Custard Malt','Too thick for a straw, so it comes with a spoon.',3,8,30,'\u{1F366}')]},
 {id:'eat-chick-phil-b',name:'Chick-Phil-B',kind:'phil',cat:'chicken',tag:'CHICKEN SANDWICHES \u{B7} WAFFLE FRIES',x:137,z:333,
  look:{wall:'#f4f1ea',stone:'#e2ddd0',frame:'#b3261e',roof:'#8f979a',accent:'#b3261e',floor:'#d2c2a4',room:'#f7f3ea',counter:'#b3261e',booth:'#b3261e',table:'#efe6d2'},
  menu:[I('phil-original','Phil\u{2019}s Original','A pressure-fried fillet, two pickles, a buttered bun.',5,42,0,'\u{1F96A}'),I('phil-spicy','Spicy Deluxe','The original with pepper, lettuce, tomato and cheese.',6,46,0,'\u{1F336}'),I('phil-nuggets','Nugget Box','Eight nuggets and a sauce.',5,34,0,'\u{1F357}'),I('phil-waffle','Waffle Fries','Cut like a waffle, salted.',3,20,0,'\u{1F35F}'),I('phil-tea','Sweet Tea','Brewed all day.',2,0,42,'\u{1F9CB}'),I('phil-shake','Peach Shake','Hand spun, with cream and a cherry.',4,8,30,'\u{1F351}')]},
 {id:'eat-tubeway',name:'Tubeway Subs',kind:'tube',cat:'sandwich',tag:'SUBS BUILT YOUR WAY',x:-163,z:333,
  look:{wall:'#f2f0e6',stone:'#dedbcc',frame:'#1f6b3a',roof:'#8e9794',accent:'#f2c230',floor:'#cfc6ae',room:'#f6f4ea',counter:'#1f6b3a',booth:'#f2c230',table:'#efe9d6'},
  menu:[I('tube-italian','Footlong Italian','Salami, ham, cheese and everything from the garden.',8,62,0,'\u{1F956}'),I('tube-turkey','Six-Inch Turkey','Turkey, lettuce and tomato on wheat.',5,38,0,'\u{1F96A}'),I('tube-meatball','Meatball Sub','Meatballs in red sauce under melted cheese.',6,46,0,'\u{1F96A}'),I('tube-wrap','Garden Wrap','Every vegetable on the line, rolled up.',5,32,0,'\u{1F32F}'),I('tube-cookies','Three Cookies','Chocolate chip, still soft.',2,14,0,'\u{1F36A}'),I('tube-drink','Fountain Drink','Help yourself.',2,0,38,'\u{1F964}')]},
 {id:'eat-chilipot',name:'Chili Pot',kind:'bowl',cat:'taco',tag:'BURRITOS \u{B7} BOWLS \u{B7} FRESH SALSA',x:110,z:-1394,
  look:{wall:'#e9e2d4',stone:'#cfc8b8',frame:'#2a2a2a',roof:'#3a3a3a',accent:'#c8342a',floor:'#9a9a94',room:'#e9e2d4',counter:'#2a2a2a',booth:'#c8342a',table:'#c9a57a'},
  menu:[I('pot-burrito','Burrito Grande','Rice, beans, grilled meat, cheese and salsa, wrapped tight.',8,64,0,'\u{1F32F}'),I('pot-bowl','Chicken Bowl','Everything in a burrito, without the wrap.',7,54,0,'\u{1F957}'),I('pot-tacos','Three Steak Tacos','Soft corn tortillas, onion and cilantro.',7,46,0,'\u{1F32E}'),I('pot-guac','Chips and Guac','Made this hour.',4,22,0,'\u{1F951}'),I('pot-queso','Queso Dip','Warm cheese with green chili.',3,16,0,'\u{1F9C0}'),I('pot-agua','Agua Fresca','Watermelon and lime.',3,0,42,'\u{1F349}')]},
 {id:'eat-dairy-duchess',name:'Dairy Duchess',kind:'duchess',cat:'dessert',tag:'SOFT SERVE \u{B7} SHAKES \u{B7} HOT DOGS',x:-160,z:695,
  look:{wall:'#fdf6ec',stone:'#f0e2d0',frame:'#c8242b',roof:'#c8242b',accent:'#3a8fd0',floor:'#e6d9c2',room:'#fff6ea',counter:'#3a8fd0',booth:'#c8242b',table:'#fff3df'},
  menu:[I('duchess-whirl','Cookie Whirlwind','Soft serve whipped with cookie pieces, served upside down.',5,20,10,'\u{1F368}'),I('duchess-cone','Soft Serve Cone','With the curl on top.',2,10,6,'\u{1F366}'),I('duchess-dipped','Dipped Cone','The same, in a chocolate shell.',3,13,5,'\u{1F366}'),I('duchess-boat','Banana Boat','Three swirls, three toppings and a banana.',5,24,6,'\u{1F34C}'),I('duchess-dog','Chili Dog','A hot dog under chili and onions.',4,30,0,'\u{1F32D}'),I('duchess-slush','Cherry Slush','Bright red.',2,0,40,'\u{1F352}')]},
 /* V6.5: the three brands that were still missing from the list. */
 {id:'eat-five-pals',name:'Five Pals',kind:'pals',cat:'burger',tag:'BURGERS \u{B7} FRIES \u{B7} FREE PEANUTS',x:62,z:-87,
  look:{wall:'#f7f5ef',stone:'#e6e2d8',frame:'#c8242b',roof:'#8f979a',accent:'#c8242b',floor:'#d9d5ca',room:'#f7f5ef',counter:'#c8242b',booth:'#c8242b',table:'#f3ecdc'},
  menu:[I('pals-burger','Pals Burger','Two patties, and every topping is free.',8,56,0,'\u{1F354}'),I('pals-little','Little Pals Burger','One patty. Still not little.',6,40,0,'\u{1F354}'),I('pals-dog','Bacon Dog','A split hot dog with bacon.',6,38,0,'\u{1F32D}'),I('pals-fries','Cajun Fries','A cup, and the same again loose in the bag.',4,24,0,'\u{1F35F}'),I('pals-shake','Peanut Butter Shake','Hand spun.',5,10,30,'\u{1F95C}'),I('pals-soda','Bottomless Soda','Fill it as often as you like.',3,0,40,'\u{1F964}')]},
 {id:'eat-shake-shed',name:'Shake Shed',kind:'shed',cat:'burger',tag:'BURGERS \u{B7} CRINKLE FRIES \u{B7} SHAKES',x:880,z:156,
  look:{wall:'#3a4a44',stone:'#2f3d38',frame:'#1f2a26',roof:'#55605b',accent:'#7ed957',floor:'#a7a79f',room:'#e9ebe4',counter:'#1f2a26',booth:'#7ed957',table:'#c9a57a'},
  menu:[I('shed-burger','Shed Burger','A smashed patty with the house sauce.',7,50,0,'\u{1F354}'),I('shed-smoke','Smoke Shed','The same with bacon and chopped pepper.',8,56,0,'\u{1F953}'),I('shed-fries','Crinkle Fries','Crisp outside, soft inside.',4,20,0,'\u{1F35F}'),I('shed-cheese','Cheese Fries','Under a blanket of cheese sauce.',5,26,0,'\u{1F9C0}'),I('shed-shake','Vanilla Shake','Frozen custard, spun to order.',5,8,32,'\u{1F964}'),I('shed-fifty','Fifty-Fifty','Half lemonade, half iced tea.',3,0,44,'\u{1F34B}')]},
 {id:'eat-braising-waynes',/* V6.81: spelled the way the player's own banner spells it (the id keeps the old spelling, so saves and orders still find the place) */name:"Brasing Wayne's",kind:'wayne',cat:'chicken',tag:'CHICKEN FINGERS \u{B7} TOAST \u{B7} SAUCE',x:-207,z:-444,
  look:{wall:'#9a4a38',stone:'#7f3c2e',frame:'#1d1d1f',roof:'#6f6a62',accent:'#f2c230',floor:'#b9a98c',room:'#f4ead8',counter:'#c8242b',booth:'#f2c230',table:'#efe6d2'},
  menu:[I('wayne-box','The Box','Four fingers, fries, toast, slaw and sauce.',9,70,0,'\u{1F357}'),I('wayne-three','Three Finger Plate','Three fingers, fries, toast and sauce.',7,50,0,'\u{1F357}'),I('wayne-sandwich','Finger Sandwich','Three fingers and sauce in a soft roll.',7,48,0,'\u{1F96A}'),I('wayne-toast','Buttered Toast','Thick, soft and griddled.',2,12,0,'\u{1F35E}'),I('wayne-sauce','Extra Sauce','You will want it.',1,4,0,'\u{1F963}'),I('wayne-lemonade','Sweet Lemonade','Squeezed here.',3,0,44,'\u{1F34B}')]},
 /* V15.6: on Lantern Street in Old Quay, where the first house stood. single: one place only (no copies elsewhere) */
 {id:'eat-wokstar',name:'Wokstar',kind:'wok',cat:'asian',single:true,tag:'NOODLES \u{B7} ORANGE CHICKEN \u{B7} DUMPLINGS',x:-180,z:150,
  look:{wall:'#f3ece0',stone:'#3b3836',frame:'#b3201f',roof:'#2b2b2e',accent:'#e8b23a',floor:'#8e6b4f',room:'#f4ead8',counter:'#b3201f',booth:'#e8b23a',table:'#5b3a29'},
  menu:[I('wok-orange','Orange Chicken Bowl','Crispy chicken in a sticky orange glaze, on steamed rice.',8,55,0,'\u{1F35B}'),I('wok-chowmein','Chow Mein','Noodles stir-fried with cabbage and onion.',6,40,0,'\u{1F35C}'),I('wok-rice','Fried Rice','Egg, peas and carrot, tossed in the wok.',5,34,0,'\u{1F35A}'),I('wok-dumplings','Pork Dumplings','Six, pan-fried, with soy and vinegar.',6,32,0,'\u{1F95F}'),I('wok-rolls','Spring Rolls','Two crisp rolls with sweet chilli dip.',3,16,0,'\u{1F32F}'),I('wok-bubble','Bubble Tea','Milk tea with chewy tapioca pearls.',4,8,34,'\u{1F9CB}'),I('wok-jasmine','Jasmine Iced Tea','Cold and lightly sweet.',2,0,40,'\u{1F375}')]}
];
const byId=new Map(BRANDS.map(b=>[b.id,b])),ITEMS=new Map();for(const b of BRANDS)for(const it of b.menu)ITEMS.set(it.id,{...it,brand:b.id});
/* V6.3: the sit-down restaurants live in dining.js. brand() answers for the new ones too, so the shop-front code, the
 * staff and the map treat them as restaurants; the flag sit tells the rest of this file to leave them to dining.js. */
const Dine=()=>root.CityDining||(typeof require==='function'?(()=>{try{return require('./dining.js');}catch(e){return null;}})():null);
const sitBrand=id=>{const p=Dine()?.place(id);return p&&!p.existing?{id:p.id,name:p.name,kind:p.kind,tag:p.tag,look:p.look,menu:[],sit:true}:null;};
/* V12.6: every fast-food brand stands in four places: its own id and '<id>-2', '-3', '-4' (the copies). brandOf turns a
 * place's id into its brand's; brand() answers for a copy with its brand, so the building, its sign, inside, staff and
 * menu are the same. */
const brandOf=id=>{const m=/^(.+)-([234])$/.exec(String(id));return m&&byId.has(m[1])?m[1]:id;};
const brand=id=>byId.get(id)||byId.get(brandOf(id))||sitBrand(id),item=id=>ITEMS.get(id)||null;
// Other sellers of food (the 6-7 stores) add their goods to the same catalogue, so the food bag can hold and eat them.
function register(owner,list){for(const it of list||[])ITEMS.set(it.id,{...it,brand:owner});}
const services=()=>[...BRANDS.map(b=>[b.id,b.name,'restaurant',b.x,b.z,W,D,H]),/* V12.6: the copies (island-layout.js says where they stand) */...BRANDS.filter(b=>!b.single).flatMap(b=>[2,3,4].map(n=>[b.id+'-'+n,b.name,'restaurant',b.x,b.z,W,D,H])),...(Dine()?.services()||[])];
/* V12.6: the drive-through of a fast-food place: a one-way lane round the building, 4.4 m wide (4.1 under Chick-Phil-B's
 * canopies), in three strips that only meet at their edges: up the east side, across the back, down the west side to just
 * short of the front, where the car parks and streets are. The menu board is on the east wall, the pick-up window on the
 * west wall, both on the driver's side. A lane keeps clear of the brand's own things beside the walls (Captain Cluck's
 * lighthouse, Burger Duke's towers). stops: where a car waits to order (menu) and to pay and collect (window). */
function driveThru(s){const b=s&&brand(s.id);if(!b||b.sit||s.type!=='restaurant')return null;const hw=(s.w||W)/2,hd=(s.d||D)/2,x=s.x,z=s.z,
  cw=b.kind==='chicken'?2.9:b.kind==='duke'?1.6:.15,ce=b.kind==='duke'?1.6:.15,Lw=b.kind==='phil'?4.1:4.4,Le=4.4,Lb=4.4,
  xw=x-hw-cw-Lw/2,xe=x+hw+ce+Le/2,zb=z-hd-Lb/2,zf=z+hd-1;
 return{strips:[{id:'east',a:{x:xe,z:zf},b:{x:xe,z:z-hd},w:Le},{id:'back',a:{x:x+hw+ce+Le,z:zb},b:{x:x-hw-cw-Lw,z:zb},w:Lb},{id:'west',a:{x:xw,z:z-hd},b:{x:xw,z:zf},w:Lw}],
  menu:{x:x+hw+.06,y:s.y,z:z-2,face:1},window:{x:x-hw-.06,y:s.y,z:z+2.5,face:-1},stops:[{x:xe,z:z-2,kind:'menu'},{x:xw,z:z+2.5,kind:'window'}],entry:{x:xe,z:zf},exit:{x:xw,z:zf}};}
// The world file asks this for The Copper Kettle, whose service type is still 'diner'.
const sitDown=(s,furn)=>!!Dine()?.furnish(s,furn);
// The inside: an ordering counter, a kitchen line behind it, and two booths with a table on each side of the aisle.
function furnish(s,furn){
 if(sitDown(s,furn))return;const b=brand(s.id);if(!b)return;const L=b.look;
 furn('counter',0,-D*.2,W*.6,1.1,1.2,L.counter);furn('counter',0,-D*.42,W*.82,1,.9,'#8f979a');
 /* V6.7: booths and tables you can sit at and order from (dining.js). The old fixed booths only if that file is missing. */
 if(!Dine()?.fastFurnish?.(s,furn,b))for(const side of[-1,1])for(let n=0;n<2;n++){const fx=side*W*.31,fz=D*.02+n*3.9,t=furn('diner-table',fx,fz,2.4,.8,1.5,L.table);furn('booth',fx-1.85,fz,1,1.1,1.9,L.booth);furn('booth',fx+1.85,fz,1,1.1,1.9,L.booth);s.seats.push({x:t.x-1.85,y:s.y+.5,z:t.z,yaw:Math.PI/2},{x:t.x+1.85,y:s.y+.5,z:t.z,yaw:-Math.PI/2});}
 s.staff={x:s.x+1.6,y:s.y,z:s.z-D*.31};s.interaction={x:s.x,y:s.y,z:s.z-D*.2+1.55};s.mapLabel=b.tag;s.signSubtitle=b.tag;s.restaurant=b.kind;
}
// ---- hunger and thirst ----------------------------------------------------------------------------------
const FULL=100,HUNGER_TIME=20*60,THIRST_TIME=15*60,HURT_EVERY=120,EAT_TIME=1.5;
function survival(sim){return survivalOf(sim?.profile);}
/* V14.3: the meters and the food bag of one profile (online the room host keeps one for each player) */
function survivalOf(p){if(!p||typeof p!=='object')return null;const s=p.survival&&typeof p.survival==='object'?p.survival:(p.survival={});for(const k of['hunger','thirst'])if(!Number.isFinite(s[k]))s[k]=FULL;if(!Number.isFinite(s.empty))s.empty=0;if(!Number.isFinite(s.strikes))s.strikes=0;if(!s.food||typeof s.food!=='object')s.food={};return s;}
/* V14.3: what food or drink does: both meters go up (never past full), and once neither is empty the hurting stops */
function feed(s,hunger,thirst){if(!s)return false;s.hunger=clamp(s.hunger+(Number(hunger)||0),0,FULL);s.thirst=clamp(s.thirst+(Number(thirst)||0),0,FULL);if(s.hunger>0&&s.thirst>0){s.empty=0;s.strikes=0;}return true;}
/* V14.3: one step of hunger and thirst for one player p with the meters s. Alone the game's step below runs it; online the
 * room host runs it for every player. emit(type, data) hears a hunger or thirst hit. True when something worth saving changed. */
function tick(s,p,dt,emit){if(!s||!p||!(dt>0))return false;let changed=false;
 if(p.eatT!==undefined){p.eatT+=dt/EAT_TIME;if(p.eatT>=1){delete p.eatT;delete p.eatIcon;}}
 if(p.health<=0){s.dead=true;return false;}
 // Coming back from a death: half full on both, whatever they were before.
 if(s.dead){s.dead=false;s.hunger=s.thirst=50;s.empty=0;s.strikes=0;changed=true;}
 s.hunger=Math.max(0,s.hunger-FULL/HUNGER_TIME*dt);s.thirst=Math.max(0,s.thirst-FULL/THIRST_TIME*dt);
 if(s.hunger<=0||s.thirst<=0){s.empty+=dt;if(s.empty>=HURT_EVERY){s.empty=0;s.strikes++;const hit=6+4*s.strikes,source=s.hunger<=0?'hunger':'thirst';p.health=Math.max(0,p.health-hit);changed=true;emit?.('damage',{amount:hit,source});if(p.health<=0)emit?.('defeated',{cause:source});}}
 else{s.empty=0;s.strikes=0;}
 return changed;}
function step(sim,dt){
 if(typeof document==='undefined'||!sim||sim.onlineRoom||sim.paused||!(dt>0))return;const s=survival(sim),p=sim.player;if(!s||!p)return;
 if(tick(s,p,dt,(type,data)=>{sim.dirty=true;sim.emit?.(type,data);}))sim.dirty=true;
}
function canOrder(sim,serviceId){const s=sim.world.serviceById?.[serviceId]||sim.world.services.find(q=>q.id===serviceId),p=sim.player;if(!s||!brand(serviceId))return{ok:false,message:'This is not a restaurant.'};
 /* V12.6: from a car or a bike at the drive-through's menu board or window */if(p.vehicleId&&s.driveThru){const v=sim.vehicles?.find(q=>q.id===p.vehicleId);if(p.health>0&&v&&s.driveThru.stops.some(q=>Math.hypot(v.x-q.x,v.z-q.z)<6))return{ok:true,service:s,drive:true};return{ok:false,message:'Drive up to the menu board or the window.'};}if(p.health<=0||p.mode!=='onFoot'||p.transition||p.physical)return{ok:false,message:'You must be standing on foot to order.'};if(Math.hypot(p.x-s.interaction.x,p.z-s.interaction.z)>3.4)return{ok:false,message:'Move to the counter.'};return{ok:true,service:s};}
function order(sim,serviceId,itemId,eatNow=false){
 const allowed=canOrder(sim,serviceId);if(!allowed.ok)return allowed;const it=item(itemId),s=survival(sim);if(!it||it.brand!==brandOf(serviceId)/* V12.6: the copies sell the same menu */)return{ok:false,message:'That is not on this menu.'};if(!s)return{ok:false,message:'No save to charge.'};
 if(!(sim.profile.wallet>=it.price))return{ok:false,message:'You need $'+it.price+' for that.'};
 if(!sim.commit('food:'+it.id+':'+sim.uid('food'),-it.price,'Food: '+it.name))return{ok:false,message:'The payment did not go through.'};
 s.food[it.id]=(s.food[it.id]||0)+1;sim.dirty=true;if(eatNow){const r=eat(sim,it.id);return r.ok?r:{ok:true,message:it.name+' is in your bag. '+r.message,item:it};}return{ok:true,message:it.name+' added to your bag.',item:it};
}
function eat(sim,itemId){
 const it=item(itemId),s=survival(sim),p=sim.player;if(!it||!s||!(s.food[itemId]>0))return{ok:false,message:'You do not have that.'};if(p.health<=0)return{ok:false,message:'Not now.'};if(p.eatT!==undefined)return{ok:false,message:'Finish what you are eating first.'};
 if(--s.food[itemId]<=0)delete s.food[itemId];s.hunger=clamp(s.hunger+it.hunger,0,FULL);s.thirst=clamp(s.thirst+it.thirst,0,FULL);if(s.hunger>0&&s.thirst>0){s.empty=0;s.strikes=0;}
 p.eatT=0;p.eatIcon=it.icon;sim.dirty=true;sim.emit?.('ate',{item:it.id,drink:it.drink});return{ok:true,message:(it.drink?'You drink the ':'You eat the ')+it.name+'.',item:it};
}
// Solid pieces of each building, relative to its centre: [key, x, base y, z, width, height, depth, material].
function solids(id,s){
 const b=brand(id);if(!b)return[];if(b.sit)return Dine().solids(id,s);const Z=D/2,out=[],add=(k,x,y,z,w,h,d,m)=>out.push([k,x,y,z,w,h,d,m||'masonry']);
 if(b.kind==='burger'){/* V12.6: the sign pole stands past the drive-through lane (it was at W/2+1.6) */add('pole',W/2+6.4,0,Z+3.2,.4,8.6,.4,'metal');add('table',-7.2,0,Z+3.4,1.8,.8,1.9,'wood');}
 else if(b.kind==='chicken'){add('tower',-W/2-1.4,0,Z-1.4,2.6,9.6,2.6);add('bucket',W*.28,H+.3,Z-2.4,3,2.8,3,'metal');}
 else if(b.kind==='pizza')add('table',7,0,Z+3.3,1.6,.8,1.6,'wood');
 else if(b.kind==='taco'){for(const e of[-1,1]){add('post'+e,e*2.95,0,Z+1.65,.24,3.2,.24,'wood');add('cactus'+e,e*9.7,0,Z+1.4,.8,1.9,.8);}}
 else if(b.kind==='coffee'){for(const e of[-1,1]){/* V11.4: the awning is 1.5 m deep, so its posts and the tables stay out of the car park 1.6 m in front */add('post'+e,e*9,0,Z+1.3,.2,3.4,.2,'metal');add('table'+e,e*6.3,0,Z+.95,1,.8,1);}add('cup',-6.5,H+.3,Z-2.2,2,2.6,2);}
 else if(b.kind==='donut'){add('bench',6.6,0,Z+1.3,1.9,.5,.6,'wood');
  /* V12.4: the giant donut (ring centre H+4.4, 2.6 m out, 1.3 m hole) is four blocks round a clear 1.84 m square and its two legs, so the drone (0.38 m round) can fly through the hole; it was one block over the whole donut */
  const cy=H+4.4,dz=Z-1.2,o=2.6,i=.92;add('donutBottom',0,cy-o,dz,2*o,o-i,1.4,'metal');add('donutTop',0,cy+i,dz,2*o,o-i,1.4,'metal');add('donutLeft',-(o+i)/2,cy-i,dz,o-i,2*i,1.4,'metal');add('donutRight',(o+i)/2,cy-i,dz,o-i,2*i,1.4,'metal');for(const e of[-1,1])add('donutLeg'+e,e*1.3,H+.25,dz-.2,.16,cy-o-H-.25,.16,'metal');}
 else if(b.kind==='duke'){for(const e of[-1,1])add('tower'+e,e*(W/2+.3),0,Z+.3,2.4,6.8,2.4);}
 else if(b.kind==='mandy'){/* V12.6: past the drive-through lane (it was at W/2+1.5) */add('pole',W/2+6.4,0,Z+3.6,.4,9,.4,'metal');add('sunroom',-6.5,0,Z+3.1,7.2,1,.12,'metal');}
 else if(b.kind==='phil'){for(const z of[-2.5,3])for(const e of[-1,1])add('post'+z+e,-W/2-4.4,0,z+e*1.4,.16,3.3,.16,'metal');add('cow',-6.4,0,Z+3.2,2,1.7,.9);}
 else if(b.kind==='bowl'){for(const x of[-8.5,-5])add('planter'+x,x,0,Z+2.4,1.4,.7,1.4);}
 else if(b.kind==='duchess'){for(const x of[-7,7])add('table'+x,x,0,Z+3.6,1.8,.8,1.9,'wood');for(const e of[-1,1])add('post'+e,e*W/2,0,Z+3.2,.1,4.2,.1,'metal');}
 else if(b.kind==='pals'){add('sacks',-7.6,0,Z+1.2,2.4,1.3,1.2);add('cup',6,H+.3,Z-2.4,2.6,5,2.6,'metal');}
 else if(b.kind==='shed'){for(const x of[-7,7])add('bench'+x,x,0,Z+3.5,2.2,.8,1.9,'wood');}
 else if(b.kind==='wayne'){add('pole',-W/2+2,H+.3,Z-2,.3,3.2,.3,'metal');}
  else if(b.kind==='wok'){for(const e of[-1,1]){add('lantern'+e,e*4.6,0,Z+2.4,.62,4.3,.62);add('table'+e,e*7.4,0,Z+3.7,1.3,.8,1.3,'wood');}}
 return out;
}
// ---- game only: the outside of each building ------------------------------------------------------------
const palette=id=>{const b=brand(id);return b?(b.sit?Dine().palette(id):{...b.look,family:'restaurant-'+b.kind}):null;};
function dress(scene,bt,s,p,api,bays){
 const b=brand(s.id);if(!b)return;if(b.sit){Dine().dress(scene,bt,s,p,api,bays);return;}/* V6.7: the tables, lamps and fittings of the room */Dine()?.fastInterior?.(scene,bt,s,p,api,b);const Z=D/2,dw=s.doorWidth,F=bays(s);
 const B=(c,x,y,z,w,h,d,kind,ry)=>api.box(c,x,y,z,w,h,d,kind||'arch30-concrete',ry||0);
 /* V11.1: where the building stands back from its car park, the strip in between is a paved patio for its tables */{const lot=(scene.world?.parkingLots||[]).find(l=>l.id==='carpark-'+s.id),gap=lot&&!s.worldYaw?lot.z1-(s.z+Z):0;if(gap>3&&gap<9)api.box('#d6cfc2',0,.04,Z+gap/2,W+1.2,.08,gap-.12,'arch30-stone',0);}
 const P=(shape,c,x,y,z,w,h,d,kind,rx,ry,rz)=>api.part(shape,c,x,y,z,w,h,d,rx||0,ry||0,rz||0,kind||'arch30-metal');
 const awning=(x,w,cols,y=3.1,depth=1.4,tilt=.44)=>{const n=Math.max(4,Math.round(w/.5)),sw=w/n,cz=Z+.25+Math.cos(tilt)*depth/2,cy=y-Math.sin(tilt)*depth/2,ez=Z+.25+Math.cos(tilt)*depth,ey=y-Math.sin(tilt)*depth;for(let i=0;i<n;i++){const ax=x-w/2+(i+.5)*sw,c=cols[i%cols.length];P('box',c,ax,cy,cz,sw,.05,depth,'matte',tilt);B(c,ax,ey-.1,ez,sw,.2,.04,'matte');}};
 const bulbs=(x0,x1,y,z,step=.55,c='#ffdf9a')=>{const n=Math.max(2,Math.round((x1-x0)/step));for(let i=0;i<=n;i++)P('sphere',c,x0+(x1-x0)*i/n,y,z,.13,.13,.13,'glow');};
 // The door has solid posts and a solid hood in the world file; every building draws something on them.
 const doorway=(post,hood,kind)=>{for(const e of[-1,1])B(post,e*(dw/2+.55),1.65,Z+.28,.38,3.3,.48,kind);B(hood,0,3.23,Z+.62,dw+3,.2,1.75,kind);};
 const table=(x,z,top,leg)=>{B(top,x,.78,z,1.8,.08,.9,'arch30-timber');for(const e of[-1,1]){B(top,x,.46,z+e*.75,1.8,.07,.34,'arch30-timber');B(leg,x+e*.7,.39,z,.08,.78,1.7,'arch30-timber');}};
 const umbrella=(x,z,c1,c2,h=2.6)=>{P('cylinder','#d9d4c8',x,h/2,z,.07,h,.07);P('cone',c1,x,h+.25,z,3,.75,3,'matte');P('cone',c2,x,h+.5,z,1.5,.42,1.5,'matte');};
 if(b.kind==='burger'){
  const red='#c8242b',yellow='#f6c21c',cream='#f3ead8',sx=W/2+6.4/* V12.6 */,sz=Z+3.2;
  // Mansard: a sloping red skirt round the top of the walls, yellow trim under it and a flat cap on it.
  P('box',red,0,H+.85,Z+.42,W+1.1,1.95,.16,'arch30-panel',-.42);P('box',red,0,H+.85,-Z-.42,W+1.1,1.95,.16,'arch30-panel',.42);P('box',red,W/2+.42,H+.85,0,.16,1.95,D+1.1,'arch30-panel',0,0,.42);P('box',red,-W/2-.42,H+.85,0,.16,1.95,D+1.1,'arch30-panel',0,0,-.42);
  for(let i=0;i<12;i++)P('box','#a81d24',-W/2+(i+.5)*W/12,H+.86,Z+.5,.08,1.9,.06,'arch30-metal',-.42);
  B(yellow,0,H+.02,Z+.86,W+1.9,.16,.22);B(yellow,0,H+.02,-Z-.86,W+1.9,.16,.22);for(const e of[-1,1])B(yellow,e*(W/2+.86),H+.02,0,.22,.16,D+1.9);B('#e9dfc8',0,H+1.72,0,W-.5,.12,D-.5);
  doorway(yellow,red,'arch30-metal');for(const f of F)awning(f.u,f.w+.2,[red,'#ffffff']);
  for(const f of F)B('#8a4b32',f.u,.37,Z+.245,f.w+1.2,.74,.06,'arch30-brick');
  B(red,0,3.95,Z+1.32,6.6,1.2,.14,'arch30-panel');B(yellow,0,3.95,Z+1.3,6.8,1.4,.08);
  // The sign pole: a burger as big as a car.
  P('cylinder','#3a3f44',sx,3,sz,.34,6,.34);P('cylinder','#3a3f44',sx,.12,sz,1,.24,1);B(red,sx,5.3,sz,2.7,1.15,.22,'arch30-panel');
  P('cylinder','#d9a45b',sx,6.42,sz,2.7,.5,2.7,'matte');P('cylinder','#5a3320',sx,6.84,sz,2.86,.34,2.86,'matte');P('box',yellow,sx,7.04,sz,2.55,.07,2.55,'matte',0,.785);P('cylinder','#58a23f',sx,7.15,sz,3.02,.14,3.02,'matte');P('cylinder','#d8382c',sx,7.29,sz,2.62,.14,2.62,'matte');P('sphere','#dca75e',sx,7.42,sz,2.76,1.8,2.76,'matte');
  for(let i=0;i<10;i++){const a=i*2.4,r=.25+.085*i;P('sphere','#fff6df',sx+Math.cos(a)*r,8.3-r*r*.32,sz+Math.sin(a)*r,.13,.07,.2,'matte',0,a);}
  table(-7.2,Z+3.4,'#b9895a','#6b4a2f');umbrella(-7.2,Z+3.4,red,yellow);
  /* (V12.6: the old drive-through board on posts here stood in the lane; every drive-through has a menu board and a window on its walls now, city-drive-thru.js) */
 }else if(b.kind==='chicken'){
  const white='#f4f1ea',red='#c8242b',navy='#1f3a5f',tx=-W/2-1.4,tz=Z-1.4,bx=W*.28,bz=Z-2.4;
  for(let i=0;i<22;i++)B(i%2?white:red,-W/2+(i+.5),H+.35,Z+.3,1,1.9,.16,'arch30-panel');B(navy,0,H+1.37,Z+.3,W+.3,.14,.3);B(navy,0,H-.67,Z+.3,W+.3,.14,.3);
  // The lighthouse at the corner.
  B(white,tx,3.9,tz,2.6,7.8,2.6,'arch30-panel');for(const y of[1.3,3.4,5.5])B(red,tx,y,tz,2.66,.9,2.66,'arch30-panel');B(navy,tx,7.86,tz,3.2,.14,3.2);for(const a of[-1,1])for(const c of[-1,1])B(navy,tx+a*1.5,8.2,tz+c*1.5,.06,.6,.06);
  B('#bfe3ee',tx,8.5,tz,1.9,1.1,1.9,'arch30-glass');P('sphere','#fff2b0',tx,8.5,tz,.7,.7,.7,'glow');B(navy,tx,9.1,tz,2.2,.12,2.2);P('cone',red,tx,9.8,tz,2.6,1.3,2.6,'arch30-panel');P('sphere','#d9b25a',tx,10.55,tz,.24,.24,.24);
  // The bucket on the roof.
  for(let k=0;k<4;k++)P('cylinder',k%2?white:red,bx,H+.58+k*.56,bz,2.1+k*.24,.56,2.1+k*.24,'arch30-panel');P('cylinder',white,bx,H+2.6,bz,3.05,.12,3.05,'arch30-panel');
  for(let i=0;i<6;i++){const a=i*1.05;P('sphere','#c88a3c',bx+Math.cos(a)*.75,H+2.85,bz+Math.sin(a)*.75,.95,.7,.8,'matte',0,a);}P('sphere','#d39a48',bx,H+3.1,bz,1,.75,.9,'matte');
  doorway(navy,white,'arch30-panel');B(red,0,3.14,Z+1.5,dw+3.04,.06,.06);for(const f of F)awning(f.u,f.w+.2,[navy,white]);
  // Rope fence along the front.
  for(let i=0;i<7;i++){const x=-W/2+1+i*(W-2)/6;if(Math.abs(x)<3)continue;P('cylinder',navy,x,.5,Z+2.7,.2,1,.2);P('sphere','#d9b25a',x,1.05,Z+2.7,.26,.26,.26);}
  for(const e of[-1,1])B('#d9c9a3',e*6.7,.78,Z+2.7,6.4,.07,.07,'matte');
 }else if(b.kind==='pizza'){
  const roof='#b3261e',green='#2f7d4f',cream='#f1e6cf',brick='#a5563f';
  // One big roof with its ridge running front to back, so the front is a gable.
  P('roof',roof,0,H+.25,0,W+1.6,3.5,D+1.4,'arch30-roof');P('roof',cream,0,H+.3,Z+.74,W+.2,3.15,.08,'arch30-panel');B('#7a1a15',0,H+.3,Z+.8,W+1.7,.2,.22);
  B(brick,-6,H+2.7,-4,1.3,3.4,1.3,'arch30-brick');B('#d8c9a8',-6,H+4.45,-4,1.6,.16,1.6,'arch30-stone');for(const q of[[.2,5,.6],[.5,5.7,.85],[.3,6.6,1.15]])P('sphere','#f1f1ec',-6+q[0],H+q[1],-4,q[2],q[2]*.9,q[2],'matte');
  for(const f of F){for(const e of[-1,1]){B(green,f.u+e*(f.w/2+.42),1.82,Z+.27,.62,2.35,.08,'arch30-timber');for(let k=0;k<5;k++)B('#266b42',f.u+e*(f.w/2+.42),.9+k*.46,Z+.32,.5,.05,.02);}
   B('#6b4a2f',f.u,.66,Z+.44,f.w*.82,.22,.36,'arch30-timber');for(let i=0;i<9;i++)P('sphere',['#d8382c','#f6c21c','#f4f1ea'][i%3],f.u-f.w*.36+i*f.w*.09,.86,Z+.46,.3,.26,.3,'foliage');}
  doorway(green,cream,'arch30-timber');awning(0,dw+3,[green,'#ffffff',roof],3.12,1.7,.36);
  for(const e of[-1,1]){B('#1f2a2b',e*(dw/2+.55),2.5,Z+.6,.2,.44,.2);P('sphere','#ffe2a6',e*(dw/2+.55),2.5,Z+.66,.16,.3,.16,'glow');}
  table(7,Z+3.3,'#b9895a','#6b4a2f');for(let i=0;i<4;i++)for(let j=0;j<2;j++)B((i+j)%2?'#d8382c':'#ffffff',7-.675+i*.45,.83,Z+3.3-.225+j*.45,.45,.02,.45,'matte');
 }else if(b.kind==='taco'){
  const stucco='#ecd0a4',tile='#b5532f',purple='#6a3fa0',teal='#1f9b96',wood='#6b4a2f',gold='#d9a83c';
  // The bell gable: a block with a round top and an arch that holds a bell, and steps down to each side.
  B(stucco,0,H+1.3,Z,6.4,2.6,.6);P('cylinder',stucco,0,H+2.6,Z,6.4,.56,6.4,'arch30-concrete',Math.PI/2);
  B('#3a2a20',0,H+1.7,Z+.03,1.6,1.5,.62);P('cylinder','#3a2a20',0,H+2.45,Z+.03,1.6,.6,1.6,'arch30-concrete',Math.PI/2);P('cone',gold,0,H+2,Z+.1,1,.95,1);P('sphere',gold,0,H+1.48,Z+.1,.26,.26,.26);B(wood,0,H+2.55,Z+.1,1.5,.1,.14,'arch30-timber');
  for(const e of[-1,1]){B(stucco,e*4.5,H+.75,Z,2.7,1.5,.6);B(stucco,e*7.1,H+.45,Z,2.6,.9,.6);B(stucco,e*9.6,H+.22,Z,2.6,.44,.6);B(tile,e*4.5,H+1.56,Z,2.9,.12,.76,'arch30-roof');B(tile,e*7.1,H+.96,Z,2.8,.12,.76,'arch30-roof');B(tile,e*9.6,H+.5,Z,2.76,.12,.76,'arch30-roof');}
  for(let x=-9.5;x<=9.6;x+=1.9)if(Math.abs(x)>4.2)P('cylinder',wood,x,H-.5,Z+.5,.26,.9,.26,'arch30-timber',Math.PI/2);
  // A tiled porch over the door on two posts.
  P('box',tile,0,3.42,Z+1.05,dw+3.4,.16,2.5,'arch30-roof',.2);for(let i=0;i<8;i++)P('box','#9c4526',-(dw+3.2)/2+(i+.5)*(dw+3.2)/8,3.46,Z+1.05,.1,.1,2.5,'arch30-roof',.2);
  for(const e of[-1,1]){B(wood,e*2.95,1.6,Z+1.65,.24,3.2,.24,'arch30-timber');B(stucco,e*(dw/2+.55),1.65,Z+.28,.38,3.3,.48);}
  for(const f of F){for(let i=0,n=Math.round(f.w/.5);i<n;i++)B([teal,purple,gold,'#f4ead0'][i%4],f.u-f.w/2+(i+.5)*f.w/n,.5,Z+.245,f.w/n,.5,.05,'arch30-panel');B(tile,f.u,3.05,Z+.42,f.w+.4,.12,.5,'arch30-roof');}
  for(const e of[-1,1]){const x=e*9.7,z=Z+1.4;P('cylinder',tile,x,.3,z,.8,.6,.8,'arch30-roof');P('cylinder','#3f7d4a',x,1.2,z,.42,1.5,.42,'foliage');P('sphere','#3f7d4a',x,1.96,z,.42,.4,.42,'foliage');for(const k of[-1,1]){P('cylinder','#3f7d4a',x+k*.38,1.15,z,.22,.22,.22,'foliage',0,0,Math.PI/2);P('cylinder','#3f7d4a',x+k*.5,1.45,z,.24,.6,.24,'foliage');}}
  for(let i=0;i<15;i++){const x=-6.5+i*13/14;P('box',[purple,teal,gold,'#e84a8a','#f07f3c'][i%5],x,3.86-.12*Math.sin(i/14*Math.PI),Z+2.75,.5,.4,.02,'matte');}B('#4a3a30',0,4.04,Z+2.72,13.4,.02,.02,'matte');for(const e of[-1,1])B(wood,e*6.8,2.05,Z+2.75,.1,4.1,.1,'arch30-timber');
 }else if(b.kind==='coffee'){
  const green='#1f4a3c',timber='#9a6b3f',coal='#2c3134',cream='#f1e9d6';
  for(let k=0;k<7;k++)B(k%2?'#8a5e36':timber,0,H-.82+k*.27,Z+.28,W+.2,.21,.1,'arch30-timber');for(const e of[-1,1])for(let k=0;k<7;k++)B(k%2?'#8a5e36':timber,e*(W/2+.06),H-.82+k*.27,Z-3,.1,.21,6.4,'arch30-timber');
  B(coal,0,H+1.12,Z+.28,W+.4,.12,.4);B(green,-3.2,H+.02,Z+.36,10.6,1.05,.08,'arch30-panel');
  // A wide flat canopy on two thin posts, with tables under it.
  /* V11.4: 1.5 m deep (it was 3.7 m and stood in the car park); posts, planters, tables and lights under it */B(coal,0,3.36,Z+.85,W-2,.16,1.3);B(timber,0,3.26,Z+.85,W-2.3,.05,1.1,'arch30-timber');for(const e of[-1,1]){B(coal,e*9,1.64,Z+1.3,.18,3.28,.18);for(const f of[-1,1])B(green,e*(dw/2+.55),1.65,Z+.28,.38,3.3,.48,'arch30-panel');}
  for(const e of[-1,1]){const x=e*6.3,z=Z+.95;P('cylinder',timber,x,.78,z,1,.06,1,'arch30-timber');P('cylinder',coal,x,.39,z,.1,.78,.1);P('cylinder',coal,x,.03,z,.56,.06,.56);for(const k of[-1,1]){P('cylinder',green,x+k*.86,.46,z+.1*k,.42,.06,.42,'arch30-panel');P('cylinder',coal,x+k*.86,.23,z+.1*k,.06,.46,.06);}B(cream,e*9.75,.45,Z+.85,.9,.9,.5);P('sphere','#3c6b3f',e*9.75,1.15,Z+.85,.95,.7,.6,'foliage');}
  for(const f of F)B(green,f.u,.37,Z+.245,f.w+1.2,.74,.06,'arch30-panel');bulbs(-W/2+1.6,W/2-1.6,3.2,Z+1.42,.7);
  // The sign disc at one corner of the roof and a paper cup as tall as a person at the other.
  B(coal,7.6,H+.9,Z+.1,.16,1.6,.16);P('cylinder',green,7.6,H+2.45,Z+.12,3,.24,3,'arch30-panel',Math.PI/2);P('cylinder',cream,7.6,H+2.45,Z+.14,2.76,.24,2.76,'arch30-panel',Math.PI/2);
  P('cylinder',cream,-6.5,H+1.45,Z-2.2,1.9,2.3,1.9,'arch30-panel');P('cylinder',timber,-6.5,H+1.4,Z-2.2,1.96,.95,1.96,'arch30-timber');P('cylinder',coal,-6.5,H+2.68,Z-2.2,2.06,.16,2.06);P('cylinder',coal,-6.5,H+2.8,Z-2.2,1.5,.1,1.5);for(const q of[[.1,3.3,.5],[-.15,3.9,.7],[.2,4.7,.95]])P('sphere','#f4f4ef',-6.5+q[0],H+q[1],Z-2.2,q[2],q[2]*.9,q[2],'matte');
 }else if(b.kind==='donut'){
  const pink='#f06fa6',orange='#f59a2e',white='#fffaf2',dough='#d9a45b',cy=H+4.4,dz=Z-1.2,C=['#39b6e0','#f6c445','#7a5cc7','#ffffff','#58c46a','#f07f3c'];
  B(white,0,H+.6,Z+.14,W+.5,2,.7,'arch30-panel');for(const e of[-1,1])B(white,e*(W/2+.02),H+.6,Z-2.4,.5,2,5.2,'arch30-panel');B(pink,0,H-.2,Z+.2,W+.6,.3,.9,'arch30-panel');B(orange,0,H+.12,Z+.2,W+.6,.12,.9,'arch30-panel');B(pink,0,H+1.66,Z+.14,W+.62,.12,.8,'arch30-panel');
  // The donut: a ring of dough with icing on the front and sprinkles on the icing, on two legs.
  for(let i=0;i<20;i++){const a=i/20*TAU,x=Math.cos(a)*1.95,y=cy+Math.sin(a)*1.95;P('sphere',dough,x,y,dz,1.3,1.3,1.25,'matte');P('sphere',pink,x,y,dz+.3,1.16,1.16,.8,'matte');}
  for(let i=0;i<44;i++){const a=i*2.399,r=1.6+((i*37)%70)/100;P('box',C[i%6],Math.cos(a)*r,cy+Math.sin(a)*r,dz+.71,.22,.07,.04,'matte',0,0,a*1.7);}
  for(const e of[-1,1])B('#8f979a',e*1.3,H+1.25,dz-.2,.16,2,.16);
  doorway(pink,white,'arch30-panel');for(const f of F)awning(f.u,f.w+.2,[pink,white],3.1,1.3,.48);for(let i=0;i<9;i++)P('sphere',i%2?orange:pink,-(dw+3)/2+(i+.5)*(dw+3)/9,3.12,Z+1.5,.66,.46,.2,'arch30-panel');
  for(const f of F)for(let i=0;i<7;i++)P('cylinder',C[i%6],f.u-f.w*.42+i*f.w*.14,.4,Z+.25,.36,.05,.36,'arch30-panel',Math.PI/2);
  B(pink,6.6,.45,Z+1.3,1.9,.08,.5,'arch30-panel');B(pink,6.6,.78,Z+1.08,1.9,.5,.07,'arch30-panel');for(const e of[-1,1])B(white,6.6+e*.8,.22,Z+1.3,.08,.44,.46,'arch30-panel');
  // Pick-up window on the side.
  B(white,W/2+.9,3.1,-2,1.6,.14,3,'arch30-panel');B(pink,W/2+1.68,3.1,-2,.08,.3,3.04,'arch30-panel');
 }else if(b.kind==='duke'){
  const cream='#f0e6d2',stone='#cfc3aa',orange='#e8762a',blue='#2a5fa8',brown='#3b2a20',gold='#e0b23a',cy=H+1.2;
  // A little keep: battlements all round the roof, a round tower at each front corner, a coronet on top.
  B(stone,0,H+.17,Z+.2,W+.9,.34,.5,'arch30-stone');B(stone,0,H+.17,-Z-.2,W+.9,.34,.5,'arch30-stone');for(const e of[-1,1])B(stone,e*(W/2+.2),H+.17,0,.5,.34,D+.9,'arch30-stone');
  for(let i=0;i<11;i++){B(stone,-W/2+1+i*2,H+.75,Z+.2,1.1,.9,.5,'arch30-stone');B(stone,-W/2+1+i*2,H+.75,-Z-.2,1.1,.9,.5,'arch30-stone');}
  for(let i=0;i<9;i++)for(const e of[-1,1])B(stone,e*(W/2+.2),H+.75,-Z+1+i*2,.5,.9,1.1,'arch30-stone');
  for(const e of[-1,1]){const tx=e*(W/2+.3),tz=Z+.3;P('cylinder',cream,tx,3.4,tz,2.4,6.8,2.4,'arch30-stone');P('cylinder',stone,tx,6.95,tz,2.8,.3,2.8,'arch30-stone');
   for(let k=0;k<6;k++){const a=k*1.047;B(stone,tx+Math.cos(a)*1.2,7.4,tz+Math.sin(a)*1.2,.5,.6,.5,'arch30-stone',-a);}
   P('cone',blue,tx,8.5,tz,2.6,2.6,2.6,'arch30-roof');B(brown,tx,10.3,tz,.06,1.2,.06,'arch30-metal');B(orange,tx+.42,10.6,tz,.8,.5,.03,'matte');for(const y of[2.3,4.5])B('#2a2018',tx,y,tz+1.2,.3,.9,.06,'matte');}
  /* the coronet stands on a block at the front of the roof, clear of the battlements */const kz=Z-3.2,ky=cy+1.1;B(stone,0,H+1.15,kz,4.4,2,4.4,'arch30-stone');P('cylinder',gold,0,ky+.6,kz,4.4,1.2,4.4,'arch30-metal');P('sphere','#a8241c',0,ky+1.5,kz,3.9,2.3,3.9,'matte');for(let k=0;k<8;k++){const a=k*.785;P('cone',gold,Math.cos(a)*2.1,ky+1.85,kz+Math.sin(a)*2.1,.6,1.4,.6,'arch30-metal');P('sphere',k%2?blue:'#c8242b',Math.cos(a)*2.1,ky+2.62,kz+Math.sin(a)*2.1,.36,.36,.36,'glow');}P('sphere',gold,0,ky+2.85,kz,.6,.6,.6,'arch30-metal');
  doorway(brown,orange,'arch30-timber');for(const f of F){awning(f.u,f.w+.2,[orange,cream]);B(stone,f.u,.37,Z+.245,f.w+1.2,.74,.06,'arch30-stone');}
  for(const e of[-1,1]){const x=e*(dw/2+1.5);B(brown,x,1.5,Z+.5,.12,3,.12,'arch30-metal');P('cone',brown,x,3.05,Z+.5,.4,.4,.4,'arch30-metal',Math.PI);P('cone','#ffb03a',x,3.55,Z+.5,.34,.7,.34,'glow');P('cone','#ff7a2a',x,3.45,Z+.5,.2,.5,.2,'glow');}
  B(brown,0,4.0,Z+.3,7.7,1.5,.08,'arch30-timber');B(orange,0,4.0,Z+.34,7.4,1.3,.12,'arch30-panel');
 }else if(b.kind==='mandy'){
  const red='#a8241c',yellow='#f2c230',cream='#f6efe0',brick='#9a5a44',slate='#5a6b78',glass='#bfe0ea',sx=-6.5,sw=7.2,px=W/2+6.4/* V12.6 */,pz=Z+3.6;
  // Brick under the windows, a yellow band, a low slate roof, and a glass sun room along the front with tables in it.
  for(const f of F)B(brick,f.u,.42,Z+.245,f.w+1.2,.84,.06,'arch30-brick');B(yellow,0,H-.25,Z+.3,W+.4,.5,.2,'arch30-panel');B(red,0,H+.06,Z+.3,W+.6,.14,.3,'arch30-panel');
  P('roof',slate,0,H+.1,0,D+1.2,1.9,W+1.2,'arch30-roof',0,Math.PI/2);
  for(let i=0;i<=4;i++){const x=sx-sw/2+i*sw/4;B(red,x,1.3,Z+3.1,.1,2.6,.1,'arch30-metal');P('box',red,x,3.05,Z+1.7,.1,.1,3.1,'arch30-metal',-.32);}
  B(red,sx,2.6,Z+3.1,sw+.1,.1,.1,'arch30-metal');B(red,sx,.5,Z+3.1,sw+.1,1,.08,'arch30-panel');P('box',glass,sx,3.07,Z+1.7,sw,.03,3.1,'arch30-glass',-.32);B(glass,sx,1.8,Z+3.1,sw,1.5,.03,'arch30-glass');for(const e of[-1,1])B(glass,sx+e*sw/2,1.6,Z+1.7,.03,2.2,2.8,'arch30-glass');
  for(let i=0;i<2;i++){const x=sx-sw/4+i*sw/2;P('cylinder',cream,x,.78,Z+1.8,.9,.06,.9,'arch30-panel');P('cylinder','#8a8f92',x,.39,Z+1.8,.1,.78,.1);for(const k of[-1,1]){P('cylinder',red,x+k*.75,.46,Z+1.8,.4,.06,.4,'arch30-panel');P('cylinder','#8a8f92',x+k*.75,.23,Z+1.8,.06,.46,.06);}}
  doorway(red,cream,'arch30-panel');for(const f of F)if(f.u>0){awning(f.u,f.w+.2,[red,cream]);B('#6b4a2f',f.u,.66,Z+.44,f.w*.82,.22,.36,'arch30-timber');for(let i=0;i<9;i++)P('sphere',i%2?'#f2c230':'#f6efe0',f.u-f.w*.36+i*f.w*.09,.86,Z+.46,.3,.26,.3,'foliage');}
  /* (V7.8: 2 cm in front of the yellow band) */B(cream,0,3.95,Z+.36,6.2,1.2,.12,'arch30-panel');B(red,0,3.95,Z+.3,6.5,1.5,.08,'arch30-panel');
  // The sign post: a square board with the girl on it, and a yellow board under it.
  /* (V7.8: thinner than the sign it holds, so its front is not where the lettering is) */B('#4a5558',px,3.4,pz,.4,6.8,.32,'arch30-metal');B(red,px,7.4,pz,3.5,3.5,.3,'arch30-panel');B(cream,px,7.4,pz,3.2,3.2,.4,'arch30-panel');B(yellow,px,5.2,pz,3.2,.6,.36,'arch30-panel');P('cylinder','#39464a',px,.12,pz,.9,.24,.9);
 }else if(b.kind==='phil'){
  const white='#f4f1ea',red='#b3261e',dark='#2a2a2c',grey='#8f979a',tx=W/2-1.6,tz=Z+.2,cx=-6.4,cz=Z+3.2;
  // White brick, a red roof edge all round, a red tower at the corner, and two red roofs over the drive-through.
  B(red,0,H-.1,Z+.6,W+1.6,.22,1.6,'arch30-metal');B(dark,0,H-.26,Z+.6,W+1.7,.1,1.7,'arch30-metal');for(const e of[-1,1])B(red,e*(W/2+.6),H-.1,0,1.6,.22,D+.4,'arch30-metal');
  B(white,0,H+.5,Z+.1,W+.3,1,.3,'arch30-brick');B(dark,0,H+1.04,Z+.1,W+.5,.1,.4,'arch30-metal');
  B(red,tx+.13,(H+3.6)/2,tz,3.46,H+3.6,2.4,'arch30-panel');B(dark,tx+.13,H+3.66,tz,3.66,.12,2.6,'arch30-metal');
  for(const f of F){B(white,f.u,.4,Z+.245,f.w+1.2,.8,.06,'arch30-brick');}
  doorway(dark,red,'arch30-metal');for(const e of[-1,1]){B(dark,e*(dw/2+.55),2.6,Z+.62,.2,.5,.2,'arch30-metal');P('sphere','#ffe2a6',e*(dw/2+.55),2.6,Z+.7,.16,.3,.14,'glow');}
  for(const z of[-2.5,3]){B(red,-W/2-2.6,3.3,z,4.4,.2,3.4,'arch30-metal');B(dark,-W/2-2.6,3.16,z,4.5,.08,3.5,'arch30-metal');for(const e of[-1,1])B(grey,-W/2-4.4,1.65,z+e*1.4,.16,3.3,.16,'arch30-metal');B('#2b2f33',-W/2-.3,1.9,z,.14,1.6,1.8,'arch30-panel');}
  // The cow by the door, holding up a board.
  P('sphere','#f7f5ee',cx,1.05,cz,1.7,.95,.85,'matte');P('sphere','#f7f5ee',cx+.95,1.5,cz,.6,.62,.5,'matte');P('sphere','#f1b8b0',cx+1.2,1.38,cz,.34,.3,.36,'matte');for(const[a,c,r]of[[-.3,.2,.5],[.3,-.25,.42],[-.6,-.2,.36]])P('sphere','#1d1d1f',cx+a,1.25+c*.4,cz+(c>0?.3:-.3),r,r*.8,.3,'matte');
  for(const a of[-.55,.55])for(const c of[-.25,.25])P('cylinder','#f7f5ee',cx+a,.32,cz+c,.2,.64,.2,'matte');for(const e of[-1,1]){P('cone','#e9dcc0',cx+1,1.86,cz+e*.2,.1,.24,.1,'matte');P('sphere','#f7f5ee',cx+.85,1.7,cz+e*.32,.22,.12,.16,'matte');}
  B('#6b4a2f',cx-.2,1.5,cz+.6,.08,3,.08,'arch30-timber');B(white,cx-.2,2.7,cz+.62,2.2,1.1,.06,'arch30-panel');B(dark,cx-.2,2.7,cz+.6,2.32,1.22,.04,'arch30-panel');
 }else if(b.kind==='tube'){
  const green='#1f6b3a',yellow='#f2c230',white='#f2f0e6',dark='#22302a',bread='#d9a45b',sy=H+2.75,sz=-1.5;
  // The roof of a railway carriage: a long round top with a yellow stripe and a row of round windows.
  P('cylinder',green,0,H-.5,0,3.4,W+.8,D+.8,'arch30-panel',0,0,Math.PI/2);B(yellow,0,H-.2,Z+.43,W+.8,.34,.08,'arch30-panel');B(dark,0,H-.48,Z+.43,W+.8,.1,.08,'arch30-metal');
  for(let i=0;i<9;i++){const x=-W/2+1.4+i*(W-2.8)/8;P('cylinder','#cfe3e6',x,H+.28,Z+.36,.62,.08,.62,'arch30-glass',Math.PI/2);P('torus',yellow,x,H+.28,Z+.4,.7,.7,.06,'arch30-metal');}
  // A sub as long as a bus on the roof.
  P('cylinder',bread,0,sy,sz,1.5,9,1.6,'matte',0,0,Math.PI/2);for(const e of[-1,1])P('sphere',bread,e*4.5,sy,sz,1.4,1.5,1.6,'matte');P('cylinder','#f0d98a',0,sy+.06,sz+.1,1.1,9.4,1.5,'matte',0,0,Math.PI/2);
  for(let i=0;i<14;i++){const x=-4.3+i*.66;P('sphere','#58a23f',x,sy+.1,sz+.72,.8,.5,.34,'foliage');if(i%2)P('cylinder','#d8382c',x,sy+.2,sz+.8,.7,.1,.7,'matte',Math.PI/2);else P('box','#f6c21c',x,sy-.05,sz+.8,.6,.6,.06,'matte',0,0,.785);}
  for(const e of[-1,1])B('#8f979a',e*3,H+1.6,sz,.16,1.4,.16,'arch30-metal');
  doorway(green,yellow,'arch30-panel');for(const f of F){awning(f.u,f.w+.2,[green,white]);B(green,f.u,.4,Z+.245,f.w+1.2,.8,.06,'arch30-panel');}
  // The sign over the door: a yellow bar with an arrow at each end.
  B(yellow,0,3.95,Z+.34,6.4,1.05,.12,'arch30-panel');for(const e of[-1,1])P('cone',yellow,e*3.75,3.95,Z+.34,1.5,1.1,.12,'arch30-panel',0,0,-e*Math.PI/2);
 }else if(b.kind==='bowl'){
  const rust='#7a4a34',steel='#8a8f92',dark='#2a2a2a',red='#c8342a',wood='#b98a5a';
  // Rusty ribbed metal above the glass, a screen of wooden slats, a steel shelter on rods, ducts on the roof.
  for(let i=0;i<Math.round(W/.35);i++)B(i%2?'#6e4230':rust,-W/2+.17+i*.35,H-.55,Z+.26,.3,1.5,.08,'arch30-metal');
  for(let i=0;i<13;i++)B(wood,W/2-4+i*.3,2.2,Z+.42,.12,4.2,.1,'arch30-timber');
  B(dark,-2.6,3.25,Z+1.7,W-7,.14,3,'arch30-metal');for(const x of[-9.6,-2.6,4.4]){P('box',steel,x,3.9,Z+1.5,.04,1.9,.04,'arch30-metal',.75);}
  P('cylinder',steel,3,H+.8,-2,.9,7,.9,'arch30-metal',0,0,Math.PI/2);B(steel,-5,H+.7,-4,2,1.2,1.6,'arch30-metal');P('cylinder',steel,-5,H+1.7,-4,.7,.8,.7,'arch30-metal');
  // The chili: a red pepper three metres long on the corner of the roof.
  for(let k=0;k<9;k++){const t=k/8,r=1.15-t*.95;P('sphere',red,-W/2+1.6+t*3.4,H+1.2+Math.sin(t*2.6)*.9,Z-1.2,r*1.3,r,r,'arch30-panel');}P('cylinder','#3d7a35',-W/2+1,H+1.7,Z-1.2,.3,.9,.3,'foliage',0,0,.7);P('sphere','#3d7a35',-W/2+1.4,H+1.4,Z-1.2,.7,.4,.7,'foliage');
  doorway(dark,steel,'arch30-metal');for(const f of F)B(dark,f.u,.3,Z+.245,f.w+1.2,.6,.06,'arch30-metal');bulbs(-W/2+1.4,W/2-5,3.05,Z+3.1,.6);
  for(const x of[-8.5,-5]){B('#b9b9b2',x,.35,Z+2.4,1.4,.7,1.4,'arch30-concrete');for(let k=0;k<7;k++)P('cone','#5a8a6a',x+Math.cos(k*.9)*.3,1.1,Z+2.4+Math.sin(k*.9)*.3,.3,1.1,.3,'foliage',Math.sin(k*.9)*.5,0,-Math.cos(k*.9)*.5);}
 }else if(b.kind==='duchess'){
  const red='#c8242b',white='#fdf6ec',blue='#3a8fd0',wafer='#d9a45b',cx=-5.5,cz=Z-2.6,cy=H+2.3;
  // A red barn roof with a white gable to the road, and a soft-serve cone as tall as the building on top of it.
  P('roof',red,0,H+.1,0,W+1.6,2.6,D+1.2,'arch30-roof');P('roof',white,0,H+.14,Z+.64,W+.3,2.3,.08,'arch30-panel');B(white,0,H+.05,Z+.7,W+1.8,.2,.24,'arch30-panel');
  P('cone',wafer,cx,cy,cz,1.9,2.8,1.9,'matte',Math.PI);for(let k=0;k<8;k++)P('torus','#b98a4a',cx,cy-1+k*.3,cz,.3+k*.2,.3+k*.2,.05,'matte',Math.PI/2);
  for(let k=0;k<5;k++)P('sphere','#fffaf0',cx+(k%2?.06:-.06),cy+1.6+k*.56,cz,2.15-k*.38,.82,2.15-k*.38,'matte');P('sphere','#fffaf0',cx+.14,cy+4.4,cz,.5,.62,.5,'matte');P('sphere',red,cx+.22,cy+4.86,cz,.34,.34,.34,'glow');
  doorway(red,white,'arch30-panel');for(const f of F){awning(f.u,f.w+.2,[red,white,blue],3.1,1.5,.46);B(blue,f.u,.4,Z+.245,f.w+1.2,.8,.06,'arch30-panel');}
  for(let i=0;i<19;i++)P('box',[red,white,blue][i%3],-W/2+i*W/18,3.95-.2*Math.sin(i/18*Math.PI),Z+3.2,.5,.44,.02,'matte');B('#4a3a30',0,4.18,Z+3.17,W,.02,.02,'matte');for(const e of[-1,1])B(white,e*W/2,2.1,Z+3.2,.1,4.2,.1,'arch30-panel');
  for(const x of[-7,7]){table(x,Z+3.6,'#f6efe0',red);umbrella(x,Z+3.6,x<0?red:blue,white);}
 }else if(b.kind==='pals'){
  const white='#f7f5ef',red='#c8242b',sack='#b99a6a',cx=6,cz=Z-2.4,cy=H+.3;
  // White tile with a red and white check band along the top and under the windows, and a red board over the door.
  for(let i=0;i<Math.round((W+.4)/.45);i++)for(let j=0;j<2;j++)B((i+j)%2?red:white,-W/2-.2+(i+.5)*.45,H-.2-j*.45,Z+.28,.45,.45,.08,'arch30-panel');
  for(const f of F)for(let i=0;i<Math.round((f.w+1.2)/.4);i++)for(let j=0;j<2;j++)B((i+j)%2?red:white,f.u-(f.w+1.2)/2+(i+.5)*.4,.6-j*.4,Z+.245,.4,.4,.06,'arch30-panel');
  B(white,0,H+.5,Z+.1,W+.3,1,.3,'arch30-panel');B(red,0,H+1.04,Z+.1,W+.5,.1,.4,'arch30-metal');doorway(red,white,'arch30-panel');
  B(red,0,3.95,Z+.34,7,1.25,.12,'arch30-panel');
  // Sacks of potatoes by the door, and a cup of fries as tall as a person on the roof.
  for(let k=0;k<7;k++){const row=k<4?0:1,x=-8.5+(k%4)*.62+row*.3;P('sphere',sack,x,.3+row*.5,Z+1.2+(k%2)*.1,.7,.5,1,'matte',0,.2*k);}
  P('cylinder',red,cx,cy+1.1,cz,2.5,2.2,2.5,'arch30-panel');P('cylinder',white,cx,cy+1.1,cz,2.54,.5,2.54,'arch30-panel');P('cylinder',white,cx,cy+2.24,cz,2.7,.12,2.7,'arch30-panel');
  for(let k=0;k<18;k++){const a=k*2.4,r=.2+(k%5)*.18;P('box','#f0c55a',cx+Math.cos(a)*r,cy+3+((k*7)%5)*.22,cz+Math.sin(a)*r,.22,2.2,.22,'matte',Math.sin(a)*.18,0,-Math.cos(a)*.18);}
 }else if(b.kind==='shed'){
  const green='#3a4a44',dark='#1f2a26',neon='#7ed957',wood='#b98a5a',steel='#8a8f92';
  // A shed: ribbed dark green walls and one roof that slopes up to the street, standing on thin steel posts.
  for(let i=0;i<Math.round(W/.4);i++)B(i%2?'#33423c':green,-W/2+.2+i*.4,H-.5,Z+.26,.34,1.4,.08,'arch30-metal');
  P('box',dark,0,H+1.25,.6,W+2.4,.2,D+4.4,'arch30-metal',-.13);P('box',wood,0,H+1.13,.6,W+2.2,.06,D+4.2,'arch30-timber',-.13);B('#bfe0ea',0,H+1.1,Z+.05,W,2.2,.06,'arch30-glass');for(let i=0;i<6;i++)B(dark,-W/2+i*W/5,H+1.1,Z+.08,.1,2.2,.1,'arch30-metal');for(const e of[-1,1]){B(steel,e*(W/2+.9),3.6,Z+2.4,.14,7.2,.14,'arch30-metal');B(steel,e*(W/2+.9),2.2,-Z-1.2,.14,4.4,.14,'arch30-metal');}
  doorway(dark,steel,'arch30-metal');for(const f of F)B(dark,f.u,.3,Z+.245,f.w+1.2,.6,.06,'arch30-metal');
  // The neon burger over the door, a string of lights, and two picnic benches.
  for(const[y,w2,c]of[[4.95,2.2,neon],[4.5,2.6,'#f6e36a'],[4.2,2.6,neon],[3.9,2.3,neon]])B(c,-5.6,y,Z+.36,w2,.12,.06,'glow');/* (V7.8: in front of the bars) */P('torus',neon,-5.6,5.02,Z+.39,2.2,1,.06,'glow');
  bulbs(-W/2+1,W/2-1,3.4,Z+3.6,.6,'#eaffd6');for(const e of[-1,1])B(steel,e*(W/2-1),1.7,Z+3.6,.08,3.4,.08,'arch30-metal');
  for(const x of[-7,7])table(x,Z+3.5,wood,dark);
 }else if(b.kind==='wayne'){
  const brick='#9a4a38',yellow='#f2c230',black='#1d1d1f',red='#c8242b',px=-W/2+2,pz=Z-2;
  // Red brick, a yellow and black check band, yellow awnings, a red board with the name, and a mirror ball on the roof.
  for(let i=0;i<Math.round((W+.4)/.5);i++)B(i%2?yellow:black,-W/2-.2+(i+.5)*.5,H-.2,Z+.28,.5,.4,.08,'arch30-panel');
  B(brick,0,H+.5,Z+.1,W+.3,1,.3,'arch30-brick');B(black,0,H+1.04,Z+.1,W+.5,.1,.4,'arch30-metal');
  doorway(black,yellow,'arch30-metal');for(const f of F){awning(f.u,f.w+.2,[yellow,black]);B(brick,f.u,.4,Z+.245,f.w+1.2,.8,.06,'arch30-brick');}
  B(red,0,3.95,Z+.34,7.6,1.3,.12,'arch30-panel');B(yellow,0,3.95,Z+.3,7.9,1.6,.08,'arch30-panel');
  B('#8a8f92',px,H+1.9,pz,.3,3.2,.3,'arch30-metal');P('sphere','#dfe6ea',px,H+4.4,pz,2.4,2.4,2.4,'arch30-metal');for(let k=0;k<26;k++){const a=k*2.4,v=-.8+(k%9)*.2,r=Math.sqrt(Math.max(0,1-v*v))*1.22;P('box',['#ffffff','#ffe9b8','#bfe6ff','#ffc7e0'][k%4],px+Math.cos(a)*r,H+4.4+v*1.22,pz+Math.sin(a)*r,.26,.26,.05,'glow',0,-a+Math.PI/2);}
  // The painted wall at the side.
  B('#f4ead8',W/2+.06,2.6,0,.06,3.2,8,'arch30-panel');
 }else if(b.kind==='wok'){
   const red='#b3201f',deep='#7d1414',gold='#e8b23a',char='#2b2b2e',wood='#5b3a29',cream='#f3ece0',paper='#ff5a3c',bamboo='#6f9a3e';
   // Two tiers of black eaves with gold edging and gold finials at the corners: a wide one round the top of the walls and a
   // smaller one round a raised clerestory.
   const eaves=(y,w,d,depth,tilt)=>{const hw=w/2,hd=d/2,c=Math.cos(tilt),sn=Math.sin(tilt);
     P('box',char,0,y,hd+depth/2*c,w+depth*2*c,.16,depth,'arch30-panel',tilt);P('box',char,0,y,-hd-depth/2*c,w+depth*2*c,.16,depth,'arch30-panel',-tilt);
     P('box',char,hw+depth/2*c,y+.01,0,depth,.16,d,'arch30-panel',0,0,-tilt);P('box',char,-hw-depth/2*c,y+.01,0,depth,.16,d,'arch30-panel',0,0,tilt);
     const ey=y-depth*sn-.06,ox=hw+depth*c,oz=hd+depth*c;B(gold,0,ey,oz+.04,w+depth*2*c+.2,.1,.1,'arch30-metal');B(gold,0,ey,-oz-.04,w+depth*2*c+.2,.1,.1,'arch30-metal');B(gold,ox+.04,ey,0,.1,.1,d+depth*2*c,'arch30-metal');B(gold,-ox-.04,ey,0,.1,.1,d+depth*2*c,'arch30-metal');
     for(const sx of[-1,1])for(const sz of[-1,1])P('cone',gold,sx*(ox+.05),ey+.35,sz*(oz+.05),.28,.62,.28,'arch30-metal');};
   eaves(H+.55,W,D,1.9,.3);B(cream,0,H+1.15,0,W-7,1.2,D-7,'arch30-panel');for(let i=0;i<8;i++)B(deep,-(W-7)/2+.5+i*(W-8)/7,H+1.15,(D-7)/2+.04,.1,1.1,.06,'arch30-timber');eaves(H+1.85,W-7,D-7,1.2,.3);
   // Red lacquer posts at the corners of the front, the door, a lattice over every window and a dark base under it.
   for(const e of[-1,1])B(red,e*(W/2-.25),H/2,Z+.36,.42,H,.42,'arch30-panel');doorway(red,char,'arch30-panel');
   for(const f of F){const n=Math.max(3,Math.round(f.w/.45));for(let i=0;i<=n;i++)B(deep,f.u-f.w/2+i*f.w/n,3.62,Z+.31,.06,.62,.05,'arch30-timber');B(deep,f.u,3.32,Z+.31,f.w+.1,.06,.05,'arch30-timber');B(deep,f.u,3.92,Z+.31,f.w+.1,.06,.05,'arch30-timber');B(char,f.u,.37,Z+.245,f.w+1.2,.74,.06,'arch30-panel');}
   // Round paper lanterns under the front eave (clear of the name board), on gold cords.
   for(const x of[-9.2,-7.4,-5.6,5.6,7.4,9.2]){P('cylinder',gold,x,H-.12,Z+1.25,.04,.36,.04,'arch30-metal');P('cylinder',gold,x,H-.33,Z+1.25,.26,.07,.26,'arch30-metal');P('sphere',paper,x,H-.72,Z+1.25,.66,.72,.66,'glow');P('cylinder',gold,x,H-1.1,Z+1.25,.26,.07,.26,'arch30-metal');P('cylinder',deep,x,H-1.28,Z+1.25,.05,.26,.05,'matte');}
   // Two stone lanterns by the path, bamboo in black planters at the front corners, two round tables with stools.
   for(const e of[-1,1]){const x=e*4.6,z=Z+2.4;B('#8f8a82',x,.2,z,.62,.4,.62,'arch30-stone');B('#8f8a82',x,1.25,z,.26,1.7,.26,'arch30-stone');/* (the light 1 cm clear of the stone slats and the cap, so no two faces share a plane) */B('#fff1c9',x,2.42,z,.42,.58,.42,'glow');for(const q of[-1,1])B('#8f8a82',x+q*.25,2.42,z,.06,.62,.54,'arch30-stone');P('cone',char,x,3.0,z,.95,.52,.95,'arch30-panel');P('sphere',gold,x,3.3,z,.14,.14,.14,'arch30-metal');}
   for(const e of[-1,1]){const px=e*(W/2-1.7),pz=Z+1.05;B(char,px,.35,pz,2.4,.7,.7,'arch30-panel');B('#3d2b1f',px,.71,pz,2.24,.03,.56,'matte');for(let k=0;k<7;k++){const dx=-.95+k*.32,dz=(k%3-1)*.14,h2=2.1+(k%3)*.45;P('cylinder',bamboo,px+dx,.72+h2/2,pz+dz,.07,h2,.07,'matte');P('sphere','#5d8f34',px+dx+.12,.72+h2+.05,pz+dz,.5,.28,.34,'matte');}}
   for(const e of[-1,1]){const x=e*7.4,z=Z+3.7;P('cylinder',wood,x,.77,z,1.3,.06,1.3,'arch30-timber');P('cylinder',char,x,.38,z,.12,.76,.12,'arch30-metal');P('cylinder',char,x,.03,z,.6,.05,.6,'arch30-metal');for(let k=0;k<3;k++){const a=k*TAU/3+.5;P('cylinder',red,x+Math.cos(a)*1.05,.46,z+Math.sin(a)*1.05,.42,.06,.42,'matte');P('cylinder',char,x+Math.cos(a)*1.05,.22,z+Math.sin(a)*1.05,.06,.44,.06,'arch30-metal');}}
   // On the roof: a big wok with its handles and three flames.
   {const y=H+2.55;P('sphere',char,0,y+.15,0,3.6,1.3,3.6,'arch30-metal');P('torus','#55585c',0,y+.62,0,3.6,3.6,.12,'arch30-metal',Math.PI/2);for(const e of[-1,1])B(wood,e*2.35,y+.6,0,1.2,.16,.2,'arch30-timber');for(const[x,z,h2,c]of[[-.6,.2,1.5,'#ff7a1a'],[.3,-.3,1.9,'#ff9a2a'],[.7,.5,1.3,'#ff7a1a']]){P('cone',c,x,y+.8+h2/2,z,.7,h2,.7,'glow');P('cone','#ffd23a',x,y+.7+h2*.32,z,.38,h2*.55,.38,'glow');}}
 }
}
function signs(scene,s,paint,hang){
 const b=brand(s.id);if(!b)return;if(b.sit){Dine().signs(scene,s,paint,hang);return;}const Z=D/2,script='"Brush Script MT","Segoe Script","Lucida Handwriting",cursive',heavy='Impact,"Arial Black",sans-serif',round='"Trebuchet MS","Segoe UI",sans-serif',tag=b.tag;
 const space=(x,v)=>{try{x.letterSpacing=v;}catch(e){}};
 if(b.kind==='burger'){
  hang(paint(1024,192,(x,w,h)=>{x.font='italic 700 150px '+script;x.lineJoin='round';x.lineWidth=14;x.strokeStyle='#7a1418';x.strokeText("Big Mick's",w/2,96);x.fillStyle='#f6c21c';x.fillText("Big Mick's",w/2,96);}),0,3.95,Z+1.4,6.3,1.18,0,{clear:true});
  hang(paint(512,224,(x,w,h)=>{x.fillStyle='#c8242b';x.fillRect(0,0,w,h);x.strokeStyle='#f6c21c';x.lineWidth=10;x.strokeRect(10,10,w-20,h-20);x.fillStyle='#fff6df';x.font='900 92px '+heavy;x.fillText("BIG MICK'S",w/2,92);x.fillStyle='#f6c21c';x.font='800 34px '+round;x.fillText('BURGERS  •  OPEN 24 HRS',w/2,170);}),W/2+6.4/* V12.6 */,5.3,Z+3.2,2.62,1.1,0,{both:true,gap:.12});
  /* (V12.6: the printed DRIVE THRU menu of the old board went with it; each drive-through has its own menu board now) */
 }else if(b.kind==='chicken'){
  hang(paint(1280,256,(x,w,h)=>{x.fillStyle='#fffaf0';x.beginPath();x.ellipse(w/2,h/2,w/2-10,h/2-10,0,0,7);x.fill();x.lineWidth=12;x.strokeStyle='#c8242b';x.stroke();x.lineWidth=4;x.strokeStyle='#1f3a5f';x.beginPath();x.ellipse(w/2,h/2,w/2-30,h/2-30,0,0,7);x.stroke();
   x.fillStyle='#1f3a5f';x.font='italic 700 128px '+script;x.fillText("Captain Cluck's",w/2,112);x.fillStyle='#c8242b';x.font='800 30px '+round;space(x,'5px');x.fillText(tag,w/2,198);}),0,H+.36,Z+.42,9,1.8,0,{clear:true});
 }else if(b.kind==='pizza'){
  hang(paint(512,512,(x,w,h)=>{x.fillStyle='#d9a45b';x.beginPath();x.arc(w/2,h/2,246,0,7);x.fill();x.fillStyle='#c93a26';x.beginPath();x.arc(w/2,h/2,214,0,7);x.fill();x.fillStyle='#f3cf6a';x.beginPath();x.arc(w/2,h/2,196,0,7);x.fill();
   for(let i=0;i<9;i++){const a=i*2.3,r=40+((i*53)%120);x.fillStyle='#b3261e';x.beginPath();x.arc(w/2+Math.cos(a)*r,h/2+Math.sin(a)*r,30,0,7);x.fill();}for(let i=0;i<14;i++){const a=i*1.9+.5,r=30+((i*71)%150);x.fillStyle=i%2?'#2f7d4f':'#3a2a20';x.beginPath();x.arc(w/2+Math.cos(a)*r,h/2+Math.sin(a)*r,10,0,7);x.fill();}
   x.strokeStyle='rgba(120,70,30,.5)';x.lineWidth=5;for(let i=0;i<4;i++){const a=i*Math.PI/4;x.beginPath();x.moveTo(w/2+Math.cos(a)*200,h/2+Math.sin(a)*200);x.lineTo(w/2-Math.cos(a)*200,h/2-Math.sin(a)*200);x.stroke();}}),0,H+2.05,Z+.8,2.5,2.5,0,{clear:true});
  hang(paint(1280,160,(x,w,h)=>{x.fillStyle='#f1e6cf';x.fillRect(0,0,w,h);for(const[c,x0]of[['#2f7d4f',0],['#b3261e',w-26]]){x.fillStyle=c;x.fillRect(x0,0,26,h);}x.fillStyle='#b3261e';x.font='900 112px '+heavy;space(x,'10px');x.fillText('PIZZA SHACK',w/2,70);x.fillStyle='#2f7d4f';x.font='800 28px '+round;space(x,'6px');x.fillText(tag,w/2,136);}),0,H-.48,Z+.3,8.6,1.08);
 }else if(b.kind==='taco'){
  hang(paint(1280,192,(x,w,h)=>{x.fillStyle='#6a3fa0';x.beginPath();x.roundRect(6,6,w-12,h-12,40);x.fill();x.lineWidth=8;x.strokeStyle='#f6c445';x.stroke();x.font='900 118px '+heavy;space(x,'8px');x.fillStyle='#19c3bb';x.fillText('TACO',w/2-190,84);x.fillStyle='#f6c445';x.fillText('CHIME',w/2+170,84);x.fillStyle='#fff';x.font='800 26px '+round;space(x,'5px');x.fillText(tag,w/2,160);}),0,4.18,Z+.42,7.2,1.08)/* V8.9: in front of the gable face and above the porch */;
 }else if(b.kind==='coffee'){
  hang(paint(1280,128,(x,w,h)=>{x.fillStyle='#f1e9d6';x.font='700 84px '+round;space(x,'12px');x.fillText('MOONBEANS COFFEE',w/2,66);}),-3.2,H+.02,Z+.41,10,.98,0,{clear:true});
  hang(paint(512,512,(x,w,h)=>{x.fillStyle='#f1e9d6';x.beginPath();x.arc(w/2,h/2,250,0,7);x.fill();x.fillStyle='#1f4a3c';x.beginPath();x.arc(w/2,h/2,222,0,7);x.fill();x.fillStyle='#f1e9d6';x.beginPath();x.arc(w/2-10,h/2-20,128,0,7);x.fill();x.fillStyle='#1f4a3c';x.beginPath();x.arc(w/2+44,h/2-48,112,0,7);x.fill();
   x.save();x.translate(w/2+60,h/2+70);x.rotate(-.5);x.fillStyle='#9a6b3f';x.beginPath();x.ellipse(0,0,52,34,0,0,7);x.fill();x.strokeStyle='#5a3a1e';x.lineWidth=6;x.beginPath();x.moveTo(-44,0);x.quadraticCurveTo(0,14,44,0);x.stroke();x.restore();}),7.6,H+2.45,Z+.27,2.7,2.7,0,{clear:true});
 }else if(b.kind==='donut'){
  hang(paint(1536,192,(x,w,h)=>{x.font='900 132px '+round;x.lineJoin='round';const a=x.measureText("Dippin' ").width,c=x.measureText('Donuts').width,x0=(w-a-c)/2;x.textAlign='left';x.lineWidth=16;x.strokeStyle='#fff';x.strokeText("Dippin'",x0,84);x.strokeText('Donuts',x0+a,84);x.fillStyle='#f06fa6';x.fillText("Dippin'",x0,84);x.fillStyle='#f59a2e';x.fillText('Donuts',x0+a,84);x.textAlign='center';x.fillStyle='#b84a7c';x.font='800 26px '+round;space(x,'6px');x.fillText(tag,w/2,168);}),0,H+.72,Z+.51,12.4,1.55,0,{clear:true});
 }else if(b.kind==='duke'){
  hang(paint(1280,224,(x,w,h)=>{x.font='900 150px '+heavy;space(x,'6px');x.lineJoin='round';x.lineWidth=16;x.strokeStyle='#3b2a20';x.strokeText('BURGER DUKE',w/2,104);x.fillStyle='#fff3d6';x.fillText('BURGER DUKE',w/2,104);x.fillStyle='#3b2a20';x.font='800 32px '+round;space(x,'8px');x.fillText(tag,w/2,196);}),0,4.0,Z+.42,7.2,1.26,0,{clear:true});
 }else if(b.kind==='mandy'){
  hang(paint(1024,208,(x,w,h)=>{x.fillStyle='#a8241c';x.font='italic 700 150px '+script;x.fillText("Mandy's",w/2,88);x.fillStyle='#5a6b78';x.font='800 28px '+round;space(x,'6px');x.fillText(tag,w/2,180);}),0,3.95,/* (V8.4: in front of the board) */Z+.44,5.9,1.2,0,{clear:true});
  hang(paint(512,512,(x,w,h)=>{x.fillStyle='#f6efe0';x.fillRect(0,0,w,h);x.fillStyle='#f2c230';x.beginPath();x.arc(w/2,220,170,0,7);x.fill();
   /* a girl with two bunches and a bow */x.fillStyle='#a8241c';for(const e of[-1,1]){x.beginPath();x.ellipse(w/2+e*120,250,44,70,e*.3,0,7);x.fill();}x.beginPath();x.arc(w/2,200,104,Math.PI,0);x.fill();x.fillStyle='#f6d9c0';x.beginPath();x.arc(w/2,226,84,0,7);x.fill();x.fillStyle='#a8241c';x.beginPath();x.arc(w/2,196,88,Math.PI*1.08,Math.PI*1.92);x.lineTo(w/2,170);x.fill();
   x.fillStyle='#2f6f8f';for(const e of[-1,1]){x.beginPath();x.moveTo(w/2,112);x.lineTo(w/2+e*62,84);x.lineTo(w/2+e*62,140);x.fill();}x.fillStyle='#3a2a20';for(const e of[-1,1]){x.beginPath();x.arc(w/2+e*30,222,8,0,7);x.fill();}x.strokeStyle='#a8241c';x.lineWidth=6;x.beginPath();x.arc(w/2,244,34,.25,Math.PI-.25);x.stroke();
   x.fillStyle='#a8241c';x.font='italic 700 104px '+script;x.fillText("Mandy's",w/2,440);}),W/2+6.4/* V12.6 */,7.4,Z+3.6,3.1,3.1,0,{both:true,gap:.22});
  hang(paint(512,96,(x,w,h)=>{x.fillStyle='#a8241c';x.font='900 52px '+heavy;space(x,'3px');x.fillText('SQUARE BURGERS',w/2,h/2+3);}),W/2+6.4/* V12.6 */,5.2,Z+3.6,3.1,.56,0,{both:true,gap:.2,clear:true});
 }else if(b.kind==='phil'){
  hang(paint(512,640,(x,w,h)=>{x.fillStyle='#b3261e';x.fillRect(0,0,w,h);
   /* a hen in white, in one piece: body, tail, head, comb, beak */x.fillStyle='#fff';x.beginPath();x.ellipse(w/2-10,260,130,100,0,0,7);x.fill();x.beginPath();x.moveTo(w/2-120,240);x.quadraticCurveTo(w/2-220,150,w/2-160,90);x.quadraticCurveTo(w/2-130,180,w/2-60,190);x.fill();x.beginPath();x.arc(w/2+110,160,58,0,7);x.fill();x.fillStyle='#f2c230';x.beginPath();x.moveTo(w/2+160,150);x.lineTo(w/2+214,168);x.lineTo(w/2+160,184);x.fill();
   x.fillStyle='#fff';for(let i=0;i<3;i++){x.beginPath();x.arc(w/2+86+i*26,104-(i===1?10:0),20,0,7);x.fill();}x.fillStyle='#b3261e';x.beginPath();x.arc(w/2+124,152,8,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=10;for(const e of[-1,1]){x.beginPath();x.moveTo(w/2-10+e*36,350);x.lineTo(w/2-10+e*36,410);x.stroke();}
   x.fillStyle='#fff';x.font='italic 700 92px '+script;x.fillText('Chick-Phil-B',w/2,520);x.font='800 26px '+round;space(x,'4px');x.fillText('SINCE THE FIRST SANDWICH',w/2,600);}),W/2-1.6,H+1.4,Z+1.42,2.9,3.6);
  hang(paint(1280,128,(x,w,h)=>{x.fillStyle='#b3261e';x.font='900 84px '+heavy;space(x,'10px');x.fillText('CHICK-PHIL-B',w/2,h/2+4);}),-3,H+.5,Z+.27,9.5,.82,0,{clear:true});
  hang(paint(512,256,(x,w,h)=>{x.fillStyle='#f7f5ee';x.fillRect(0,0,w,h);x.fillStyle='#1d1d1f';x.font='900 64px '+heavy;x.fillText('TRY THE',w/2,70);x.fillText('CHICKEN',w/2,140);x.font='italic 700 40px '+script;x.fillText('says the cow',w/2,212);}),-6.6,2.7,Z+3.86,2.1,1.05);
 }else if(b.kind==='tube'){
  hang(paint(1280,208,(x,w,h)=>{x.font='900 150px '+heavy;space(x,'10px');x.fillStyle='#1f6b3a';x.fillText('TUBEWAY',w/2-110,h/2+6);x.fillStyle='#fff';x.lineWidth=10;x.strokeStyle='#1f6b3a';x.lineJoin='round';x.font='900 96px '+heavy;x.strokeText('SUBS',w/2+430,h/2+8);x.fillText('SUBS',w/2+430,h/2+8);}),0,3.95,Z+.42,6.2,1,0,{clear:true});
  hang(paint(1024,96,(x,w,h)=>{x.fillStyle='#22302a';x.font='800 50px '+round;space(x,'8px');x.fillText(tag,w/2,h/2+3);}),0,H-.2,Z+.49,7,.3,0,{clear:true});
 }else if(b.kind==='bowl'){
  hang(paint(1280,256,(x,w,h)=>{x.font='900 190px '+heavy;space(x,'14px');x.fillStyle='#fff';x.fillText('CHILI POT',w/2,112);x.fillStyle='#f2c230';x.font='800 36px '+round;space(x,'9px');x.fillText(tag,w/2,222);}),-2,H-.5,Z+.33,9.6,1.44,0,{clear:true});
 }else if(b.kind==='duchess'){
  hang(paint(1280,512,(x,w,h)=>{x.fillStyle='#c8242b';x.beginPath();x.ellipse(w/2,h/2,w/2-14,h/2-14,0,0,7);x.fill();x.lineWidth=14;x.strokeStyle='#3a8fd0';x.stroke();x.lineWidth=5;x.strokeStyle='#fff';x.beginPath();x.ellipse(w/2,h/2,w/2-40,h/2-40,0,0,7);x.stroke();
   /* a small coronet over the name */x.fillStyle='#f2c230';x.beginPath();x.moveTo(w/2-80,150);x.lineTo(w/2-80,96);x.lineTo(w/2-44,128);x.lineTo(w/2,80);x.lineTo(w/2+44,128);x.lineTo(w/2+80,96);x.lineTo(w/2+80,150);x.fill();
   x.fillStyle='#fff';x.font='italic 700 190px '+script;x.fillText('Dairy Duchess',w/2,290);x.font='800 36px '+round;space(x,'8px');x.fillText(tag,w/2,410);}),3,H+1.2,Z+.72,7.6,3,0,{clear:true});
 }else if(b.kind==='pals'){
  hang(paint(1280,224,(x,w,h)=>{x.fillStyle='#fff';x.font='900 150px '+heavy;space(x,'12px');x.fillText('FIVE PALS',w/2,104);x.font='800 30px '+round;space(x,'8px');x.fillText(tag,w/2,194);}),0,3.95,Z+.42,6.8,1.19,0,{clear:true});
 }else if(b.kind==='shed'){
  hang(paint(1280,256,(x,w,h)=>{x.shadowColor='#7ed957';x.shadowBlur=26;x.strokeStyle='#b6ff8a';x.lineWidth=7;x.lineJoin='round';x.font='900 170px '+round;space(x,'10px');x.strokeText('SHAKE SHED',w/2,118);x.shadowBlur=0;x.fillStyle='#eaffd6';x.font='800 34px '+round;space(x,'10px');x.fillText(tag,w/2,226);}),2.6,4.1,Z+.36,9.4,1.88,0,{clear:true});
 }else if(b.kind==='wayne'){
  hang(paint(1280,224,(x,w,h)=>{x.fillStyle='#fff';x.font='italic 700 150px '+script;x.fillText("Brasing Wayne's",w/2,96);x.fillStyle='#f2c230';x.font='800 30px '+round;space(x,'8px');x.fillText(tag,w/2,192);}),0,3.95,Z+.42,7.4,1.3,0,{clear:true});
  hang(paint(1024,512,(x,w,h)=>{x.fillStyle='#f4ead8';x.fillRect(0,0,w,h);x.fillStyle='#c8242b';x.font='900 150px '+heavy;x.fillText('FINGERS.',w/2,100);x.fillStyle='#1d1d1f';x.fillText('TOAST.',w/2,256);x.fillStyle='#c8242b';x.fillText('SAUCE.',w/2,412);}),W/2+.1,2.6,0,7.8,3.1,Math.PI/2);
 }else if(b.kind==='wok'){
   const flame=(x,cx,base,fh,w)=>{x.fillStyle='#ff7a1a';x.beginPath();x.moveTo(cx-w,base);x.quadraticCurveTo(cx-w*1.2,base-fh*.6,cx,base-fh);x.quadraticCurveTo(cx+w*1.2,base-fh*.6,cx+w,base);x.fill();x.fillStyle='#ffd23a';x.beginPath();x.moveTo(cx-w*.45,base);x.quadraticCurveTo(cx-w*.55,base-fh*.35,cx,base-fh*.6);x.quadraticCurveTo(cx+w*.55,base-fh*.35,cx+w*.45,base);x.fill();};
   // The name over the door: gold letters on a red board, with a wok and its flames on the left.
   hang(paint(1280,256,(x,w,h)=>{x.fillStyle='#b3201f';x.fillRect(0,0,w,h);x.strokeStyle='#e8b23a';x.lineWidth=10;x.strokeRect(14,14,w-28,h-28);for(const[cx,fh]of[[130,72],[176,98],[222,72]])flame(x,cx,150,fh,24);x.fillStyle='#2b2b2e';x.beginPath();x.arc(176,150,84,0,Math.PI);x.fill();x.fillRect(250,141,100,17);x.fillStyle='#e8b23a';x.font='900 148px '+heavy;space(x,'12px');x.fillText('WOKSTAR',790,112);x.fillStyle='#fff3d6';x.font='800 29px '+round;space(x,'7px');x.fillText(tag,790,212);}),0,3.95,Z+.42,7.6,1.52,0);
   // A tall red sign on the roof, read from along the street.
   hang(paint(256,1024,(x,w,h)=>{x.fillStyle='#b3201f';x.fillRect(0,0,w,h);x.strokeStyle='#e8b23a';x.lineWidth=12;x.strokeRect(12,12,w-24,h-24);x.fillStyle='#e8b23a';x.font='900 140px '+heavy;'WOKSTAR'.split('').forEach((c,i)=>x.fillText(c,w/2,88+i*138));}),W/2-1.3,H+3.4,Z-1.4,.9,3.6,Math.PI/2);
   // The side wall: a long banner above the side windows (their glass stands out from the wall):
   // a bowl of noodles with chopsticks and the three things on the menu, at the front end, clear of the drive-through's menu board.
   hang(paint(1440,200,(x,w,h)=>{x.fillStyle='#f3ece0';x.fillRect(0,0,w,h);x.fillStyle='#b3201f';x.fillRect(0,0,w,14);x.fillRect(0,h-14,w,14);x.strokeStyle='#c9c2b5';x.lineWidth=6;for(const sx of[92,120,148]){x.beginPath();x.moveTo(sx,92);x.bezierCurveTo(sx-16,74,sx+16,58,sx,38);x.stroke();}x.fillStyle='#e8d28a';x.fillRect(48,98,144,10);x.fillStyle='#b3201f';x.beginPath();x.arc(120,104,74,0,Math.PI);x.fill();x.fillStyle='#e8b23a';x.fillRect(44,100,152,7);x.strokeStyle='#5b3a29';x.lineWidth=7;x.beginPath();x.moveTo(160,44);x.lineTo(232,150);x.moveTo(176,40);x.lineTo(240,144);x.stroke();x.fillStyle='#b3201f';x.font='900 78px '+heavy;space(x,'3px');x.fillText('NOODLES \u{B7} RICE \u{B7} DUMPLINGS',850,104);}),W/2+.45,4.02,4.6,6.5,.9,Math.PI/2)/* (the side wall's face stands about 0.3 m out from W/2) */;
 }
}
// ---- game only: meters, ordering screen, food bag -------------------------------------------------------
const tone=v=>v>60?'#7fd67a':v>35?'#f0d24a':v>15?'#f09a3a':'#e5483f';
function hud(){
 const sim=root.PlatdoCity?.sim,doc=root.document;if(!doc)return;let box=doc.getElementById('citySurvival');const left=doc.querySelector('#cityHud .hud-left');if(!left)return;
 if(!box){box=doc.createElement('div');box.id='citySurvival';box.style.cssText='display:flex;gap:12px;align-items:center;margin:2px 0 8px';
  box.innerHTML=['hunger','thirst'].map(k=>`<div data-meter="${k}" title="${k==='hunger'?'Hunger':'Thirst'}" style="position:relative;width:44px;height:44px"><svg viewBox="0 0 44 44" width="44" height="44" style="transform:rotate(-90deg)"><circle cx="22" cy="22" r="18" fill="#09252cb0" stroke="#ffffff26" stroke-width="5"/><circle data-ring cx="22" cy="22" r="18" fill="none" stroke="#7fd67a" stroke-width="5" stroke-linecap="round" stroke-dasharray="113.1" stroke-dashoffset="0"/></svg><span style="position:absolute;inset:0;display:grid;place-items:center;font-size:19px;line-height:1">${k==='hunger'?'\u{1F357}':'\u{1F4A7}'}</span></div>`).join('');
  left.insertBefore(box,left.querySelector('.bar'));}
 /* V14.3: online too, from the room host's numbers (sim.onlineSurvival) */const s=sim&&(!sim.onlineRoom||sim.onlineSurvival)?survival(sim):null;box.style.display=s?'flex':'none';if(!s)return;
 for(const k of['hunger','thirst']){const ring=box.querySelector(`[data-meter="${k}"] [data-ring]`),v=clamp(s[k],0,FULL),key=Math.round(v*2);if(ring.dataset.v==key)continue;ring.dataset.v=key;ring.setAttribute('stroke-dashoffset',(113.1*(1-v/FULL)).toFixed(1));ring.setAttribute('stroke',tone(v));}
}
const gain=it=>[it.hunger?'+'+it.hunger+' hunger':'',it.thirst?'+'+it.thirst+' thirst':''].filter(Boolean).join(' · ');
function bag(sim,ctx){const s=survival(sim),rows=Object.entries(s?.food||{}).map(([id,n])=>[item(id),n]).filter(r=>r[0]&&r[1]>0);
 if(!rows.length)return '<p class="fine">Your food bag is empty.</p>';
 return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px">'+rows.map(([it,n])=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#ffffff12;border-radius:8px"><span style="font-size:26px">${it.icon}</span><span style="flex:1"><b>${ctx.esc(it.name)}</b> × ${n}<br><span class="fine">${gain(it)}</span></span>${ctx.btn('foodEat',it.drink?'Drink':'Eat','primary',`data-value="${it.id}"`)}</div>`).join('')+'</div>';}
function meters(sim){const s=survival(sim);return s?`<div class="fine" style="display:flex;gap:18px;margin:4px 0 12px"><span>\u{1F357} Hunger <b style="color:${tone(s.hunger)}">${Math.round(s.hunger)}</b> / 100</span><span>\u{1F4A7} Thirst <b style="color:${tone(s.thirst)}">${Math.round(s.thirst)}</b> / 100</span></div>`:'';}
let note='';
function render(ctx){
 const sim=ctx.sim,b=ctx.screen==='restaurant'?brand(ctx.serviceId):null,head=meters(sim)+(note?`<p style="margin:0 0 10px;color:#ffe1a5">${ctx.esc(note)}</p>`:'');
 /* V12.7: at the drive-through's menu board: pick as many things as you like, pay once, then the window */const dt=b&&root.CityDriveThru?.menuFor?.(sim);
 /* V13.3: the place's own menu picture with items to point at (city-drive-board.js); the list below when there is none */if(dt&&root.CityDriveBoard?.render?.(ctx,b))return;
 if(dt){const DT=root.CityDriveThru,list=DT.itemsOf(dt),total=list.reduce((a,it)=>a+it.price,0);
  const cards=b.menu.map(it=>{const n=dt.cart[it.id]||0;return`<div data-food-item="${it.id}" style="display:flex;flex-direction:column;gap:6px;padding:12px;background:${n?'#ffffff22':'#ffffff12'};border-radius:10px;outline:${n?'2px solid #ffd23f':'none'}"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:34px">${it.icon}</span><span><b style="font-size:16px">${ctx.esc(it.name)}</b><br><span class="fine">${ctx.esc(it.about)}</span></span></div><div class="fine" style="color:#bfe8c8">${gain(it)} · ${ctx.money(it.price)}</div><div class="row" style="align-items:center">${ctx.btn('foodDtSub','−','',`data-value="${it.id}" aria-label="One less ${ctx.esc(it.name)}" ${n?'':'disabled'}`)}<b style="min-width:26px;text-align:center;font-size:18px">${n}</b>${ctx.btn('foodDtAdd','+','',`data-value="${it.id}" aria-label="One more ${ctx.esc(it.name)}" ${n>=9?'disabled':''}`)}</div></div>`;}).join('');
  ctx.panel(ctx.esc(b.name)+' · Drive-through',`<p class="fine" style="letter-spacing:2px;margin:0 0 6px">ORDER AT THE BOARD · YOU HAVE ${ctx.money(sim.profile.wallet)}</p>`+head+`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px">${cards}</div><p style="margin:14px 0 0;font-size:16px"><b>Your order:</b> ${list.length?list.length+' item'+(list.length>1?'s':'')+' · '+ctx.money(total):'nothing yet'}</p><div class="row" style="margin-top:12px">${ctx.btn('foodDtPay',list.length?'Order and pay · '+ctx.money(total):'Order and pay','primary',list.length&&sim.profile.wallet>=total?'':'disabled')}${ctx.btn('foodDtSkip','Drive on without ordering')}</div>`);
  return;}
 if(!b){ctx.panel('Food and drink',head+bag(sim,ctx)+`<div class="row" style="margin-top:14px">${ctx.btn('foodClose','Close','primary')}</div>`);return;}
 const cards=b.menu.map(it=>`<div data-food-item="${it.id}" style="display:flex;flex-direction:column;gap:6px;padding:12px;background:#ffffff12;border-radius:10px"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:34px">${it.icon}</span><span><b style="font-size:16px">${ctx.esc(it.name)}</b><br><span class="fine">${ctx.esc(it.about)}</span></span></div><div class="fine" style="color:#bfe8c8">${gain(it)}</div><div class="row">${ctx.btn('foodBuy','Buy · '+ctx.money(it.price),'',`data-value="${it.id}" ${sim.profile.wallet>=it.price?'':'disabled'}`)}${ctx.btn('foodNow',it.drink?'Drink now':'Eat now','primary',`data-value="${it.id}" ${sim.profile.wallet>=it.price?'':'disabled'}`)}</div></div>`).join('');
 ctx.panel(ctx.esc(b.name),`<p class="fine" style="letter-spacing:2px;margin:0 0 6px">${ctx.esc(b.tag)} · YOU HAVE ${ctx.money(sim.profile.wallet)}</p>`+head+`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px">${cards}</div><h3 style="margin:16px 0 8px">Your food bag</h3>`+bag(sim,ctx)+`<div class="row" style="margin-top:14px">${ctx.btn('foodClose','Leave the counter','primary')}</div>`);
}
/* V14.3: a counter or the food bag in an online room: the room host checks it, takes the money, keeps the bag and fills the meters */
let sending=false;
function online(action,value,ctx){const sim=ctx.sim,F=root.PlatdoFriends,open=()=>!!root.document?.querySelector('[data-action="foodClose"]'),again=()=>{if(open())ctx.render();};
 if(!sim.onlineSurvival||!F?.action){note=F?.action?'The host of this room needs the newest server files before you can buy food here.':'Not connected to the room.';ctx.render();return;}
 if(sending)return;sending=true;
 F.action('cityTool',{tool:'food',kind:action==='foodEat'?'eat':'buy',service:typeof ctx.serviceId==='string'?ctx.serviceId:'',item:String(value||''),now:action==='foodNow'}).then(r=>{sending=false;note=r?.message||'';if(action==='foodEat'&&!ctx.audio?.sample?.('bagEat',1,0))ctx.audio?.tone?.(520,.12,.05,'sine','sfx',300);again();/* the bag comes with the next update from the host */setTimeout(again,300);},e=>{sending=false;note=e?.message||'That did not go through.';again();});}
function click(action,value,ctx){
 const sim=ctx.sim;let r=null;
 if(sim.onlineRoom&&['foodBuy','foodNow','foodEat'].includes(action)){online(action,value,ctx);return;}
 /* V12.7: the drive-through menu */if(root.CityDriveThru?.menuFor?.(sim)){const DT=root.CityDriveThru;if(action==='foodDtAdd'||action==='foodDtSub'){DT.cart(sim,value,action==='foodDtAdd'?1:-1);ctx.render();return;}if(action==='foodDtPay'){/* V13.4: online the answer comes from the host */Promise.resolve(DT.pay(sim)).then(q=>{note=q.ok?'':(q.message||'');if(q.ok){ctx.saveNow?.();note='';ctx.setScreen('play');}else ctx.render();});return;}if(action==='foodDtSkip'||action==='foodClose'){DT.skip?.(sim);note='';ctx.setScreen('play');return;}}
 if(action==='foodOpen'){note='';ctx.setScreen('food');return;}
 if(action==='foodClose'){note='';ctx.setScreen('play');return;}
 if(action==='foodBuy')r=order(sim,ctx.serviceId,value,false);else if(action==='foodNow')r=order(sim,ctx.serviceId,value,true);else if(action==='foodEat')r=eat(sim,value);
 if(r){note=r.message||'';if(r.ok){/* V6.6: a purchase rings the till (the City's tillWatch); eating from the bag keeps its own small sound */if(action==='foodEat'&&!ctx.audio?.sample?.('bagEat',1,0))ctx.audio?.tone?.(520,.12,.05,'sine','sfx',300);ctx.saveNow?.();}}
 ctx.render();
}
function opened(){note='';}
return{W,D,H,BRANDS,ITEMS,brand,item,register,services,dining:Dine,sitDown,furnish,survival,/* V14.3 */survivalOf,feed,tick,step,canOrder,order,eat,solids,palette,dress,signs,hud,render,click,opened,/* V12.6 */brandOf,driveThru};
});
