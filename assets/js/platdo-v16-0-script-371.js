
/* PLATDO City sit-down restaurants (V6.3): places where you take a seat, read a menu, and a waiter brings the food.
 * - PLACES: The Copper Kettle (the diner that was already in the City, refitted), Ember & Oak (a steakhouse) and
 *   Nonna Rosa's (an Italian trattoria). Each has its own building, colours, sign, room, menu and menu style.
 *   The names are the game's own.
 * - layout(): the room of each place in the building's own coordinates: tables and their seats, the host stand,
 *   the kitchen, where the waiter waits and where the cook stands. Everything else is drawn from this one list,
 *   so a chair on screen is always a chair you can sit on.
 * - furnish() / solids(): what the world file needs (solid tables, benches, counters and walls; seats; staff).
 * - dress() / interior() / signs() / palette(): the look. city-restaurants.js hands these over (its brand()
 *   also answers for these places, which is how the shop-front code and the map find them).
 * The first half of the file is shared with the multiplayer host; everything from "game only" down needs a page.
 * Sitting, the menu, the waiter and eating are in city-dining-play.js; the dishes are in city-dining-food.js. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CityDining=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const PI=Math.PI,TAU=PI*2;
// A dish: id, name, a line about it, price, hunger and thirst it gives back, menu section, the 3D dish
// (a shape and its colours, see city-dining-food.js) and the seconds it takes in the kitchen.
const M=(id,name,about,price,hunger,thirst,cat,dish,cook=3)=>({id,name,about,price,hunger,thirst,cat,dish,cook,drink:cat==='drink'});
const PLACES=[
 {id:'diner',name:'The Copper Kettle',kind:'diner',style:'laminated',tag:'DINER \u{B7} ALL-DAY BREAKFAST \u{B7} PIE',existing:true,W:32,D:25,H:5,
  blurb:'Open all day and all night since the trams ran.',
  look:{table:'#f4efe6',booth:'#c8242b',counter:'#c9ced1'},
  sections:[['starter','Starters'],['main','Blue Plates'],['side','Sides'],['dessert','Pie Case'],['drink','Fountain']],
  menu:[M('ck-sticks','Mozzarella Sticks','Six, fried golden, with marinara for dipping.',6,22,0,'starter',['sticks'],3),M('ck-chilifries','Chili Cheese Fries','Crinkle fries under chili and melted cheddar.',7,30,0,'starter',['fries','#8a3a22'],3),M('ck-soup','Tomato Soup','A hot bowl with a swirl of cream.',5,18,10,'starter',['soup','#d8482c','#fff3e0'],2),
   M('ck-burger','Kettle Burger Deluxe','Half a pound, cheddar, lettuce, tomato and a heap of fries.',12,62,0,'main',['burger'],5),M('ck-meatloaf','Blue Plate Meatloaf','Two thick slices, mashed potato and brown gravy.',13,66,0,'main',['meatloaf'],5),M('ck-chickwaffle','Chicken and Waffles','Crisp fried chicken on a golden waffle, with syrup.',13,64,0,'main',['waffles'],5),
   M('ck-melt','Tuna Melt','Griddled rye, tuna salad and Swiss cheese.',10,48,0,'main',['sandwich','#c79a5a','#f0d98a'],4),M('ck-breakfast','All-Day Breakfast','Two eggs sunny side up, bacon and hash browns.',11,58,0,'main',['breakfast'],4),M('ck-grilled','Grilled Cheese','Buttered white bread and far too much cheese.',8,40,0,'main',['sandwich','#e3b45a','#f6c93a'],3),
   M('ck-rings','Onion Rings','A tall stack, beer battered.',5,18,0,'side',['rings'],3),M('ck-slaw','Coleslaw','Creamy, cold and crunchy.',3,10,2,'side',['bowl','#e9edd8','#f0a04a'],1),M('ck-hash','Hash Browns','Shredded and crisped on the flat top.',4,16,0,'side',['hash'],3),
   M('ck-pie','Apple Pie a la Mode','A warm slice under a scoop of vanilla.',6,22,0,'dessert',['pie','#c98a3c','#f6efd8'],2),M('ck-split','Banana Split','Three scoops, three sauces, cream and a cherry.',7,24,6,'dessert',['sundae'],3),M('ck-cake','Chocolate Layer Cake','Four layers. Share it, or do not.',6,22,0,'dessert',['cake','#4a2a1c','#2c1810'],1),
   M('ck-coffee','Bottomless Coffee','Fresh pot every twenty minutes.',3,0,30,'drink',['mug','#3a2416'],1),M('ck-malt','Chocolate Malt','Thick enough to stand a straw in.',6,10,34,'drink',['shake','#b9865a'],2),M('ck-cola','Cherry Cola','From the fountain, over crushed ice.',3,0,40,'drink',['glass','#5a1a14'],1),M('ck-lemonade','Fresh Lemonade','Squeezed this morning.',3,0,44,'drink',['glass','#f2df7a'],1),M('ck-water','Ice Water','On the house.',0,0,35,'drink',['glass','#cfe8f2'],1)]},
 {id:'dine-ember-oak',name:'Ember & Oak',kind:'steak',style:'leather',tag:'STEAKHOUSE \u{B7} OAK-FIRED GRILL',x:330,z:153,W:26,D:20,H:5.2,
  blurb:'Prime cuts over a live oak fire.',
  look:{wall:'#3a2b22',stone:'#8d8578',frame:'#1d1512',roof:'#34373c',accent:'#c9a24a',floor:'#5a3d2a',room:'#2e211b',table:'#f4f1ea',booth:'#5a1f1c',counter:'#2a1a12'},
  sections:[['starter','To Begin'],['main','From the Fire'],['side','On the Side'],['dessert','To Finish'],['drink','To Drink']],
  menu:[M('eo-shrimp','Shrimp Cocktail','Five chilled jumbo shrimp, horseradish sauce.',14,20,0,'starter',['shrimp'],2),M('eo-onion','French Onion Soup','Slow onions under a lid of melted cheese.',11,22,8,'starter',['soup','#a8672c','#e9c46a'],3),M('eo-wedge','Wedge Salad','Iceberg, blue cheese, bacon and tomato.',10,16,2,'starter',['salad'],2),M('eo-crab','Crab Cakes','Two cakes, seared, with lemon butter.',15,26,0,'starter',['cakes'],4),
   M('eo-ribeye','Oak-Fired Ribeye','Fourteen ounces, charred outside, pink inside.',42,88,0,'main',['steak'],7),M('eo-filet','Filet Mignon','The most tender cut, with herb butter.',46,80,0,'main',['filet'],7),M('eo-salmon','Cedar Plank Salmon','Roasted on the plank, with lemon.',32,70,0,'main',['salmon'],6),M('eo-ribs','Smokehouse Short Ribs','Twelve hours over oak, falling off the bone.',34,84,0,'main',['ribs'],6),M('eo-chicken','Roast Half Chicken','Crisp skin, pan juices.',26,72,0,'main',['chicken'],6),
   M('eo-potato','Loaded Baked Potato','Butter, sour cream, cheddar, chives and bacon.',8,24,0,'side',['potato'],3),M('eo-spinach','Creamed Spinach','Rich and slow.',8,16,0,'side',['bowl','#5d8a4a','#e8eed8'],2),M('eo-fries','Truffle Fries','Hand cut, with parmesan.',9,22,0,'side',['fries','#f1e6b8'],3),M('eo-asparagus','Grilled Asparagus','With sea salt and lemon.',9,14,0,'side',['asparagus'],3),
   M('eo-cheesecake','New York Cheesecake','Tall, plain and perfect, with berry sauce.',11,22,0,'dessert',['cake','#f1dfae','#b8452f'],1),M('eo-molten','Molten Chocolate Cake','Cut it and it runs.',12,22,0,'dessert',['molten'],4),M('eo-brulee','Creme Brulee','Vanilla custard under burnt sugar.',10,16,0,'dessert',['brulee'],2),
   M('eo-sparkling','Sparkling Water','A cold bottle for the table.',5,0,45,'drink',['bottle','#bfe6d8'],1),M('eo-tea','Iced Tea','Black tea, lemon, lots of ice.',4,0,42,'drink',['glass','#b5682c'],1),M('eo-rootbeer','House Root Beer','Brewed here, served in a frosted glass.',5,0,40,'drink',['glass','#4a2a18','#f1e6cf'],1),M('eo-espresso','Espresso','Short and strong.',4,0,14,'drink',['cup','#2a1a10'],1)]},
 {id:'dine-nonna-rosa',name:"Nonna Rosa's",kind:'italian',style:'trattoria',tag:'TRATTORIA \u{B7} WOOD-OVEN PIZZA \u{B7} PASTA',x:218,z:330,W:26,D:20,H:5,
  blurb:"Nonna's recipes, Nonna's rules.",
  look:{wall:'#e2b56a',stone:'#c9b79a',frame:'#2f5a3d',roof:'#b5532f',accent:'#b3261e',floor:'#b9764a',room:'#f1dfb8',table:'#f6f1e6',booth:'#2f7d4f',counter:'#8a5a34'},
  sections:[['starter','Antipasti'],['pizza','Pizza'],['pasta','Pasta'],['dessert','Dolci'],['drink','Bevande']],
  menu:[M('nr-garlic','Garlic Bread','Toasted, buttery, with parsley.',5,18,0,'starter',['bread'],2),M('nr-bruschetta','Bruschetta','Grilled bread, tomato, basil and olive oil.',7,20,0,'starter',['bruschetta'],2),M('nr-caprese','Caprese Salad','Tomato, fresh mozzarella and basil.',8,18,2,'starter',['caprese'],2),M('nr-minestrone','Minestrone','Nonna\u{2019}s vegetable soup with beans.',7,22,10,'starter',['soup','#c9642c','#7fae5a'],3),
   M('nr-margherita','Pizza Margherita','Tomato, mozzarella and basil. The original.',13,74,0,'pizza',['pizza','basil'],5),M('nr-pepperoni','Pizza Pepperoni','Covered edge to edge.',15,80,0,'pizza',['pizza','pepperoni'],5),M('nr-formaggi','Quattro Formaggi','Four cheeses, no tomato, no regrets.',15,78,0,'pizza',['pizza','cheese'],5),M('nr-funghi','Pizza Funghi','Roasted mushrooms and thyme.',14,74,0,'pizza',['pizza','mushroom'],5),
   M('nr-meatballs','Spaghetti and Meatballs','Three big meatballs in Sunday sauce.',14,76,0,'pasta',['pasta','#c0392b','meatballs'],5),M('nr-alfredo','Fettuccine Alfredo','Butter, cream and parmesan.',13,70,0,'pasta',['pasta','#f3e9c8','plain'],4),M('nr-lasagna','Lasagna al Forno','Seven layers, baked until the edges crisp.',15,82,0,'pasta',['lasagna'],6),M('nr-arrabbiata','Penne Arrabbiata','Tomato, garlic and plenty of chili.',12,66,0,'pasta',['pasta','#d0492e','penne'],4),
   M('nr-tiramisu','Tiramisu','Coffee, mascarpone and cocoa.',7,20,0,'dessert',['tiramisu'],1),M('nr-cannoli','Cannoli','Two crisp shells, sweet ricotta.',6,18,0,'dessert',['cannoli'],1),M('nr-gelato','Gelato','Three scoops: pistachio, strawberry, vanilla.',6,16,8,'dessert',['gelato'],1),
   M('nr-soda','Blood Orange Soda','Sparkling and a little bitter.',4,0,42,'drink',['glass','#e8582a'],1),M('nr-limonata','Limonata','Cloudy lemon, very cold.',4,0,44,'drink',['glass','#f5ea8a'],1),M('nr-cappuccino','Cappuccino','Never after eleven, says Nonna. Order it anyway.',4,4,26,'drink',['mug','#c9a27a','#fbf3e3'],2),M('nr-espresso','Espresso','One sip.',3,0,14,'drink',['cup','#2a1a10'],1),M('nr-acqua','Acqua Minerale','A bottle of still water.',2,0,45,'drink',['bottle','#cfe8f2'],1)]},
 {id:'dine-salty-pelican',name:'The Salty Pelican',kind:'casual',style:'printed',tag:'SEASIDE GRILL \u{B7} FISH \u{B7} BURGERS',x:60,z:694,W:26,D:20,H:4.8,
  blurb:'Sandy feet welcome.',
  look:{wall:'#f4f8f8',stone:'#dfe9ea',frame:'#1f7f8a',roof:'#3a6f8f',accent:'#e8604a',floor:'#d9c7a0',room:'#f4f8f8',table:'#d9c7a0',booth:'#1f7f8a',counter:'#b9925a'},
  sections:[['starter','To Share'],['main','From the Grill'],['side','Sides'],['dessert','Sweet'],['drink','Cold Drinks']],
  menu:[M('sp-tacos','Fish Tacos','Two soft tacos, crisp fish, lime slaw.',9,28,0,'starter',['bruschetta'],3),M('sp-chowder','Clam Chowder','Thick and creamy, with a little bacon.',8,24,8,'starter',['soup','#efe6cf','#c9a25a'],3),M('sp-calamari','Calamari','Fried rings with lemon and garlic mayo.',10,24,0,'starter',['rings'],3),M('sp-shrimp','Coconut Shrimp','Five, with a sweet chili dip.',11,24,0,'starter',['shrimp'],3),
   M('sp-burger','Pelican Burger','Grilled beef, cheddar and pineapple salsa, with fries.',14,62,0,'main',['burger'],5),M('sp-fish','Fish and Chips','Beer-battered cod, thick chips, tartar sauce.',15,68,0,'main',['fish'],5),M('sp-mahi','Grilled Catch','The fish of the day off the grill, with lemon.',18,66,0,'main',['salmon'],5),M('sp-chicken','BBQ Chicken Sandwich','Pulled chicken and slaw on a toasted roll.',13,56,0,'main',['sandwich','#d9a45b','#c8842e'],4),M('sp-bowl','Garden Bowl','Grains, greens, avocado and roasted corn.',12,46,2,'main',['bowl','#7fae5a','#f0a04a'],3),
   M('sp-fries','Sweet Potato Fries','With sea salt.',6,20,0,'side',['fries'],3),M('sp-salad','Side Salad','Leaves, tomato, cucumber.',5,12,2,'side',['salad'],1),M('sp-pups','Hush Puppies','Fried cornmeal, honey butter.',5,16,0,'side',['cakes'],3),
   M('sp-pie','Key Lime Pie','Sharp, sweet and cold.',7,20,0,'dessert',['pie','#d9c98a','#cfe8a0'],1),M('sp-brownie','Brownie Sundae','Warm brownie, cold ice cream.',8,24,4,'dessert',['molten'],3),M('sp-sorbet','Three Sorbets','Mango, lime and raspberry.',6,12,10,'dessert',['gelato'],1),
   M('sp-limeade','Fresh Limeade','Squeezed to order.',4,0,44,'drink',['glass','#cfe89a'],1),M('sp-smoothie','Mango Smoothie','Thick and cold.',6,8,36,'drink',['shake','#f2b84a'],2),M('sp-tea','Iced Tea','With a wedge of lemon.',3,0,42,'drink',['glass','#b5682c'],1),M('sp-brew','Cold Brew','Slow coffee over ice.',4,0,34,'drink',['glass','#3a2416'],1),M('sp-coconut','Coconut Water','Straight from the nut, in a glass.',4,0,48,'drink',['glass','#eef4ea'],1)]}
];
const byId=new Map(PLACES.map(p=>[p.id,p])),DISHES=new Map();for(const p of PLACES)for(const it of p.menu)DISHES.set(it.id,{...it,place:p.id});
/* V12.6: a fast-food copy ('<brand>-2' to '-4') uses its brand's place: the same tables, menu and kitchen */
const baseId=id=>{const m=/^(.+)-([234])$/.exec(String(id));return m&&byId.has(m[1])?m[1]:id;};
const place=id=>byId.get(id)||byId.get(baseId(id))||null,dish=id=>DISHES.get(id)||null;
const services=()=>PLACES.filter(p=>!p.existing).map(p=>[p.id,p.name,'restaurant',p.x,p.z,p.W,p.D,p.H]);
// ---- the rooms -------------------------------------------------------------------------------------------------
// Yaw 0 looks toward the front of the building (+z), so a seat's yaw is the way the person sitting on it faces.
const st=(x,z,yaw,sx,sz)=>({x,z,yaw,stand:{x:sx,z:sz}});
const four=(x,z)=>({kind:'four',x,z,w:1,d:1,seats:[st(x-.8,z,PI/2,x-1.55,z),st(x+.8,z,-PI/2,x+1.55,z),st(x,z-.8,0,x,z-1.55),st(x,z+.8,PI,x,z+1.55)]});
const two=(x,z)=>({kind:'two',x,z,w:.76,d:.76,seats:[st(x-.7,z,PI/2,x-1.45,z),st(x+.7,z,-PI/2,x+1.45,z)]});
// A booth: a table standing out from a wall with a bench each side. axis 'x': the table runs along x and the open
// end is toward the middle of the room (open is -1 or 1, the side of the table the aisle is on).
const booth=(x,z,axis,open)=>axis==='x'?{kind:'booth',axis,x,z,w:1.5,d:.8,open,seats:[st(x,z-.82,0,x+open*1.5,z-.82),st(x,z+.82,PI,x+open*1.5,z+.82)]}:{kind:'booth',axis,x,z,w:.8,d:1.5,open,seats:[st(x-.82,z,PI/2,x-.82,z+open*1.5),st(x+.82,z,-PI/2,x+.82,z+open*1.5)]};
// ---- V6.7: fast-food places take orders at the table too ----------------------------------------------------
// Every fast-food brand of city-restaurants.js gets a place here, made the first time it is furnished: the same
// 22 x 18 m room for all of them (four booths down each side wall, four tables in the middle, the brand's own
// counter and kitchen line), a menu made from the brand's own things at the counter's prices, and the brand's own
// colours. fastDish() picks the category and the 3D dish of each thing from its name.
const DRINK_COLOUR=[[/grape/i,'#6a3fa0'],[/cherry/i,'#c0182a'],[/orange/i,'#f08a2e'],[/lemon|fifty/i,'#f6e04a'],[/tea/i,'#b5682c'],[/peach/i,'#f6b07a'],[/fresca/i,'#f08aa0'],[/peanut/i,'#c9a25a'],[/thick/i,'#f0a0b0'],[/horchata|vanilla|custard|malt|shake/i,'#f6efd8'],[/cola|soda|fountain|fizz|brew/i,'#3a1c10']];
function fastDish(it){
 const n=it.name,is=re=>re.test(n),tint=d=>{for(const[re,c]of DRINK_COLOUR)if(re.test(n))return c;return d;};
 if(it.drink){
  /* V15.6: Wokstar */if(is(/bubble|milk tea/i))return['drink',['boba','#c9a27a'],1];if(is(/jasmine|green tea/i))return['drink',['glass','#d9bf72'],1];
 if(is(/water/i))return['drink',['bottle','#cfe8f0'],1];
  if(is(/espresso/i))return['drink',['cup','#3a1c10'],2];
  if(is(/latte|cocoa|drip|coffee/i))return['drink',['mug',is(/cocoa/i)?'#6b4022':'#5a3320'],2];
  if(is(/shake|malt|horchata/i))return['drink',['shake',tint('#f6efd8')],2];
  return['drink',['glass',tint('#3a1c10')],1];}
 let d=null,sweet=false;
 /* V15.6: Wokstar (before the rules below: 'Spring Rolls' would be onion rings, a rice 'Bowl' a salad) */if(is(/orange chicken/i))d=['ricebowl','#e3812a','chicken'];else if(is(/fried rice/i))d=['ricebowl','#f0d98a','fried'];else if(is(/chow mein|noodle/i))d=['pasta','#7a4a22','spaghetti'];else if(is(/dumpling/i))d=['dumplings'];else if(is(/spring roll/i))d=['springrolls'];
 else if(is(/dozen/i)){d=['donut','#f0a0b0',3];sweet=true;}
 else if(is(/donut/i)){d=['donut',is(/glazed/i)?'#f6e6b8':'#f0a0b0',1];sweet=true;}
 else if(is(/bagel/i))d=['donut','#d9a45b',1];
 else if(is(/churros/i)){d=['sticks'];sweet=true;}
 else if(is(/cannoli/i)){d=['cannoli'];sweet=true;}
 else if(is(/muffin/i)){d=['muffin'];sweet=true;}
 else if(is(/whirlwind|sundae/i)){d=['gelato'];sweet=true;}
 else if(is(/cone/i)){d=['cone',is(/dipped/i)?'#5a3320':'#fffdf6'];sweet=true;}
 else if(is(/banana/i)){d=['sundae'];sweet=true;}
 else if(is(/cookies/i)){d=['cookies'];sweet=true;}
 else if(is(/dog/i))d=['hotdog',is(/chili/i)?'#8a3a22':'#f2c230'];
 else if(is(/slice/i))d=['slice'];
 else if(is(/pie/i))d=['pizza',is(/pepperoni/i)?'pepperoni':'veg'];
 else if(is(/tenders|nibbles|nugget|finger plate/i))d=['nuggets'];
 else if(is(/burger|mick|flame duke|square deal|smoke shed/i))d=['burger'];
 else if(is(/burrito|wrap/i))d=['wrap',is(/garden/i)?'#a9c98a':'#ecd9ac'];
 else if(is(/taco/i))d=['taco',is(/three/i)?3:1];
 else if(is(/quesadilla/i))d=['sandwich','#e9c98a','#f6c21c'];
 else if(is(/nachos|guac/i))d=['nachos',is(/guac/i)?'#7ab85a':'#f6c21c'];
 else if(is(/queso/i))d=['bowl','#f6c21c','#e8762a'];
 else if(is(/sauce/i))d=['bowl','#e9a05a','#c8742a'];
 else if(is(/chili/i))d=['bowl','#8a3a22','#f6c21c'];
 else if(is(/mash/i))d=['bowl','#f1e6c8','#6b4022'];
 else if(is(/footlong|six-inch|sub/i))d=['sub',is(/meatball/i)?'#8a3a22':'#d98a8a'];
 else if(is(/bucket|the box/i))d=['chicken'];
 else if(is(/tenders|nibbles|nugget|finger plate/i))d=['nuggets'];
 else if(is(/sandwich|captain|royale|original|deluxe/i))d=['sandwich','#d9a45b',is(/spicy/i)?'#c8742a':'#e3b45a'];
 else if(is(/fries/i))d=is(/cheese/i)?['fries','#f6c21c']:is(/cajun/i)?['fries','#c8742a']:['fries'];
 else if(is(/ring/i))d=['rings'];
 else if(is(/potato/i))d=['potato'];
 else if(is(/bowl/i))d=['salad'];
 else if(is(/biscuit|toast|knots/i))d=['bread'];
 else d=['sandwich'];
 const cat=sweet?'dessert':it.hunger>=30?'main':'side';return[cat,d,cat==='main'?4:2];
}
function fast(b){
 let p=byId.get(b.id);if(p)return p.fast?p:null;const K=b.look||{};
 const menu=b.menu.map(it=>{const[cat,dish,cook]=fastDish(it);return M(it.id,it.name,it.about,it.price,it.hunger,it.thirst,cat,dish,cook);});
 p={id:b.id,name:b.name,kind:'fast',style:'fast',fast:true,existing:true,tag:b.tag,W:22,D:18,H:4.6,blurb:'Order at the counter to take away, or take a seat and we bring it over.',
  look:{table:K.table||'#f3e3bf',booth:K.booth||'#c8242b',counter:K.counter||'#c8242b',accent:K.accent||'#f6c21c',frame:K.frame||'#3a2a20',room:K.room||'#f3e9d6'},
  sections:[['main','Meals'],['side','Sides'],['dessert','Sweets'],['drink','Drinks']].filter(s=>menu.some(m=>m.cat===s[0])),menu};
 byId.set(p.id,p);for(const it of menu)DISHES.set(it.id,{...it,place:p.id});return p;
}
// The tables, benches and seats of a fast-food room, added to the counter that city-restaurants.js has already put in.
function fastFurnish(s,furn,b){
 const p=fast(b);if(!p)return false;const L=layout(p),c=(kind,x,z,w,h,d,color)=>{const f=furn(kind,x,z,w,h,d,color);f.custom=true;return f;};
 for(const t of L.tables){c('dine-table',t.x,t.z,t.w,.78,t.d,p.look.table);if(t.kind==='booth')for(const q of t.seats)c('dine-bench',q.x,q.z,t.axis==='x'?1.6:.5,1.05,t.axis==='x'?.5:1.6,p.look.booth);}
 s.seats.length=0;const tables=[];
 L.tables.forEach((t,i)=>{const seats=t.seats.map((q,k)=>({id:s.id+':t'+i+'s'+k,table:i,x:s.x+q.x,y:s.y,z:s.z+q.z,yaw:q.yaw,stand:{x:s.x+q.stand.x,z:s.z+q.stand.z}}));for(const q of seats)s.seats.push({x:q.x,y:s.y+.5,z:q.z,yaw:q.yaw});tables.push({kind:t.kind,axis:t.axis,x:s.x+t.x,z:s.z+t.z,w:t.w,d:t.d,out:false,seats});});
 const W=q=>({x:s.x+q.x,y:s.y,z:s.z+q.z,yaw:q.yaw||0});
 s.dining={place:p.id,tables,pass:W(L.pass),gate:W(L.gate),station:W(L.station),cook:W(L.cook),range:W(L.range),plate:W(L.plate),host:W(L.host),kitchenZ:s.z+L.kitchenZ,patio:null,fast:true};
 return true;
}
const layouts=new Map();
function layout(p){
 if(layouts.has(p.id))return layouts.get(p.id);const W=p.W,D=p.D,X=W/2,Z=D/2,tables=[],solid=[];let L;
 if(p.kind==='fast'){
  // V6.7: the room every fast-food brand shares. Four booths down each side wall, four tables in the middle, a
  // clear way from the door to the counter. The counter (front edge at z = -3) and the kitchen line behind it are
  // put in by city-restaurants.js; the tray is handed over the left part of the counter.
  for(const e of[-1,1])for(const z of[-.9,1.3,3.5,5.7])tables.push(booth(e*(X-1.1),z,'x',-e));
  for(const e of[-1,1])for(const z of[1.3,5.3])tables.push(four(e*5,z));
  L={kitchenZ:-3,pass:{x:-4.4,z:-2.45},gate:{x:8.4,z:-3.6},station:{x:8.3,z:-2.6,yaw:0},cook:{x:-2.8,z:-5.7,yaw:0},range:{x:-4.2,z:-6.75,yaw:PI},plate:{x:-4.4,z:-4.85,yaw:0},host:{x:1.6,z:-5.58,yaw:0},greet:{x:0,z:-2.05}};
 }else
 if(p.kind==='steak'){
  for(const z of[-3.6,-.5,2.6])tables.push(booth(X-1.1,z,'x',-1));
  for(const x of[-5.6,0,5.6])for(const z of[-2.8,1.8])tables.push(four(x,z));
  for(const x of[-9,-5.2,5.2,9])tables.push(two(x,8.3));
  // the wall between the dining room and the kitchen: a pass in the middle, a staff door on the right
  solid.push(['wall',-8.1,-6.2,9.8,p.H,.24],['pass',0,-6.2,6.4,1.02,.6],['wall',5.9,-6.2,5.4,p.H,.24],['gate',9.3,-6.2,1.4,2.1,.14],['wall',11.5,-6.2,3,p.H,.24],['bar',-10.5,-1.6,.8,1.12,6.8],['hearth',-X+.62,5.6,1.1,2.4,2.6],['stand',2.6,7.1,.7,1.15,.55]);
  L={kitchenZ:-6.2,pass:{x:0,z:-5.55},gate:{x:9.3,z:-6.2},station:{x:8.2,z:-4.9,yaw:PI},cook:{x:.4,z:-8.2,yaw:0},range:{x:1.2,z:-8.7,yaw:PI},plate:{x:.4,z:-6.95,yaw:0},host:{x:3.5,z:7.3,yaw:-PI/2},greet:{x:1.4,z:7.3},bar:{x:-10.5,z:-1.6,len:6.8}};
 }else if(p.kind==='casual'){
  for(const z of[-3.4,-.6,2.2])tables.push(booth(-X+1.1,z,'x',1));
  for(const x of[-3.6,2,7.6])for(const z of[-2.6,2])tables.push(four(x,z));
  for(const x of[5.4,9.2])tables.push(two(x,8.3));
  // four tables on the deck in front of the building: `out` means outside the walls
  for(const x of[-10,-6,6,10]){const t=four(x,Z+2.7);t.out=true;tables.push(t);}
  solid.push(['wall',-8.1,-6.2,9.8,p.H,.24],['pass',0,-6.2,6.4,1.02,.6],['wall',5.9,-6.2,5.4,p.H,.24],['gate',9.3,-6.2,1.4,2.1,.14],['wall',11.5,-6.2,3,p.H,.24],['stand',-2.6,7.1,.7,1.15,.55]);
  L={kitchenZ:-6.2,pass:{x:0,z:-5.55},gate:{x:9.3,z:-6.2},station:{x:8.2,z:-4.9,yaw:PI},cook:{x:.4,z:-8.2,yaw:0},range:{x:1.2,z:-8.7,yaw:PI},plate:{x:.4,z:-6.95,yaw:0},host:{x:-3.5,z:7.3,yaw:PI/2},greet:{x:-1.4,z:7.3},deck:Z+4.5};
 }else if(p.kind==='italian'){
  for(const x of[-9.2,-5,5,9.2])tables.push(four(x,3.5));
  for(const x of[-9.2,-4.6,0,4.6,9.2])tables.push(four(x,-1.5));
  for(const x of[-7.4,7.4])tables.push(two(x,8.3));
  // an open kitchen: a long counter you can see over, the oven in the back corner, a gate for the staff
  solid.push(['pass',-2.7,-6,20.6,1.1,.75],['gate',8.3,-6,1.4,1.1,.14],['wall',11,-6,4,p.H,.24],['oven',-9.6,-8.4,3.2,2.9,2.8],['stand',-2.8,7.1,.7,1.15,.55]);
  L={kitchenZ:-6,pass:{x:0,z:-5.3},gate:{x:8.3,z:-6},station:{x:9.9,z:-4.6,yaw:PI},cook:{x:-5.6,z:-7.7,yaw:0},range:{x:-7.3,z:-7.5,yaw:-PI/2},plate:{x:-3.4,z:-6.8,yaw:0},host:{x:-3.7,z:7.3,yaw:PI/2},greet:{x:-1.5,z:7.3},oven:{x:-9.6,z:-8.4}};
 }else{
  // The Copper Kettle: booths under the front windows and down both side walls, a long counter with stools
  // in front of the kitchen, and tables in the middle.
  for(const x of[4.4,6.6,8.8,11,13.2]){tables.push(booth(-x,Z-1.2,'z',-1));tables.push(booth(x,Z-1.2,'z',-1));}
  for(const z of[7,4.8,2.6,.4,-1.8])tables.push(booth(-X+1.1,z,'x',1));
  for(const z of[7,4.8,2.6])tables.push(booth(X-1.1,z,'x',-1));
  for(const x of[-9.6,-5.2,5.2,9.6])tables.push(four(x,3.2));
  for(const x of[-7.4,7.4])tables.push(four(x,-1.4));
  solid.push(['wall',-11.5,-8.6,9,p.H,.24],['pass',0,-8.6,14,1.02,.6],['wall',8.7,-8.6,3.4,p.H,.24],['gate',11.1,-8.6,1.4,2.1,.14],['wall',13.9,-8.6,4.2,p.H,.24],['bar',0,-5.9,18,1.08,.8],['stand',3.2,8.6,.9,1.1,.6],['jukebox',X-.75,-3.6,.9,1.6,.7]);
  L={kitchenZ:-8.6,pass:{x:0,z:-7.9},gate:{x:11.1,z:-8.6},station:{x:11.6,z:-7.2,yaw:PI},cook:{x:-.6,z:-10.4,yaw:0},range:{x:1.2,z:-11.1,yaw:PI},plate:{x:-.6,z:-9.35,yaw:0},host:{x:4.4,z:8.6,yaw:-PI/2},greet:{x:2,z:8.9},bar:{x:0,z:-5.9,len:18,along:'x'}};
 }
 L.tables=tables;L.solid=solid;layouts.set(p.id,L);return L;
}
// What the world file gets: solid tables, benches, counters and walls; the seats; where the host stands.
function furnish(s,furn){
 const p=place(s.id);if(!p||p.fast)return false;const L=layout(p),c=(kind,x,z,w,h,d,color)=>{const f=furn(kind,x,z,w,h,d,color);f.custom=true;return f;};
 for(const t of L.tables){if(t.out)continue;/* deck tables are solid through solids() */c('dine-table',t.x,t.z,t.w,.78,t.d,p.look.table);if(t.kind==='booth')for(const q of t.seats)c('dine-bench',q.x,q.z,t.axis==='x'?1.6:.5,1.05,t.axis==='x'?.5:1.6,p.look.booth);}
 for(const q of L.solid)c('dine-'+q[0],q[1],q[2],q[3],q[4],q[5],p.look.counter);
 s.seats.length=0;const tables=[];
 L.tables.forEach((t,i)=>{const seats=t.seats.map((q,k)=>({id:s.id+':t'+i+'s'+k,table:i,x:s.x+q.x,y:s.y,z:s.z+q.z,yaw:q.yaw,stand:{x:s.x+q.stand.x,z:s.z+q.stand.z}}));for(const q of seats)s.seats.push({x:q.x,y:s.y+.5,z:q.z,yaw:q.yaw});tables.push({kind:t.kind,axis:t.axis,x:s.x+t.x,z:s.z+t.z,w:t.w,d:t.d,out:!!t.out,seats});});
 const W=(q,extra)=>({x:s.x+q.x,y:s.y,z:s.z+q.z,yaw:q.yaw||0,...extra});
 s.dining={place:p.id,tables,pass:W(L.pass),gate:W(L.gate),station:W(L.station),cook:W(L.cook),range:W(L.range),plate:W(L.plate),host:W(L.host),kitchenZ:s.z+L.kitchenZ,/* the deck outside the front wall, where there is one */patio:L.deck?{x0:s.x-s.w/2,x1:s.x+s.w/2,z0:s.z+s.d/2,z1:s.z+L.deck}:null};
 s.staff={x:s.x+L.host.x,y:s.y,z:s.z+L.host.z};s.interaction={x:s.x+L.greet.x,y:s.y,z:s.z+L.greet.z};s.mapLabel=p.kind==='diner'?'Diner \u{B7} table service':p.kind==='steak'?'Steakhouse \u{B7} table service':p.kind==='casual'?'Seaside grill \u{B7} table service':'Italian \u{B7} table service';s.signSubtitle=p.tag;s.restaurant=p.kind;s.sitDown=true;return true;
}
// Solid pieces outside each new building, relative to its centre: [key, x, base y, z, width, height, depth, material].
function solids(id,s){
 const p=place(id);if(!p||p.existing)return[];const X=p.W/2,Z=p.D/2,out=[],add=(k,x,y,z,w,h,d,m)=>out.push([k,x,y,z,w,h,d,m||'masonry']);
 if(p.kind==='casual'){for(const x of[-10,-6,6,10])add('deck-table'+x,x,0,Z+2.7,1,.78,1,'wood');for(const e of[-1,1]){add('rail'+e,e*7.45,0,Z+4.5,11.1,1,.14,'wood');add('side'+e,e*X,0,Z+2.4,.14,1,4.2,'wood');}add('pelican',2.9,0,Z+5.3,.4,2.5,.4,'wood');}
 else if(p.kind==='steak'){add('chimney',-X-1.15,0,2.4,2.3,p.H+4.2,2.3);for(const e of[-1,1])for(const z of[Z+1,Z+4.3])add('post'+e+z,e*3.1,0,z,.42,3.5,.42,'wood');for(const e of[-1,1])for(const u of[10.15,4.45])add('planter'+e+u,e*u,0,Z+.75,4.4,.8,.7);}
 else{for(const x of[-12.2,-7.4,-2.6,2.6,7.4,12.2])add('post'+x,x,0,Z+4.5,.26,3.1,.26,'wood');for(const x of[-9.2,9.2])add('table'+x,x,0,Z+2.5,1,.78,1,'wood');for(const e of[-1,1])add('pot'+e,e*2.55,0,Z+1,.8,.8,.8);for(const e of[-1,1])add('wall'+e,e*8.4,0,Z+4.95,9.6,.75,.36);}
 return out;
}
// ---- game only: the look -------------------------------------------------------------------------------------
const palette=id=>{const p=place(id);return p&&!p.existing?{wall:p.look.wall,stone:p.look.stone,frame:p.look.frame,roof:p.look.roof,accent:p.look.accent,floor:p.look.floor,room:p.look.room,family:'dining-'+p.kind}:null;};
// What the furniture of each place is made of.
const STYLE={
 diner:{top:'#f4efe6',edge:'#c9ced1',leg:'#c9ced1',frame:'#c9ced1',seat:'#c8242b',trim:'#f4efe6',cloth:null,shade:'#1f9b96',lamp:'#ffe9b8',wains:'#1f9b96',board:'#f4efe6'},
 steak:{top:'#33221a',edge:'#2a1a12',leg:'#1d1512',frame:'#2a1a12',seat:'#5a1f1c',trim:'#c9a24a',cloth:'#f4f1ea',shade:'#c9a24a',lamp:'#ffcf8a',wains:'#3b2418',board:'#33221a'},
 italian:{top:'#9a6b3f',edge:'#7a5230',leg:'#6b4a2f',frame:'#6b4a2f',seat:'#c9a25a',trim:'#6b4a2f',cloth:'#f6f1e6',shade:'#2f7d4f',lamp:'#ffdf9a',wains:'#c98f5a',board:'#7a5230'},
 casual:{top:'#d9c7a0',edge:'#bfae8a',leg:'#f4f8f8',frame:'#f4f8f8',seat:'#1f7f8a',trim:'#f4f8f8',cloth:null,shade:'#f4f8f8',lamp:'#ffe9b8',wains:'#cfe3e6',board:'#f4f8f8'}
};
// The inside of a place: floor pattern, wainscot, every table and seat from layout(), lamps, the bar or counter,
// the kitchen and the host stand. api.box and api.part draw in the building's own coordinates.
function interior(scene,bt,s,pal,api){
 const p=place(s.id);if(!p)return;const L=layout(p),S=STYLE[p.kind],W=p.W,D=p.D,H=p.H,X=W/2,Z=D/2;
 const B=(c,x,y,z,w,h,d,kind,ry)=>api.box(c,x,y,z,w,h,d,kind||'arch30-interior',ry||0);
 const P=(shape,c,x,y,z,w,h,d,kind,rx,ry,rz)=>api.part(shape,c,x,y,z,w,h,d,rx||0,ry||0,rz||0,kind||'arch30-interior');
 // a point given in a seat's own frame (dx to its right, dz ahead of it) in room coordinates
 const at=(q,dx,dz)=>[q.x+dx*Math.cos(q.yaw)+dz*Math.sin(q.yaw),q.z-dx*Math.sin(q.yaw)+dz*Math.cos(q.yaw)];
 const chair=q=>{const a=(dx,dz)=>at(q,dx,dz);let v=a(0,0);B(S.seat,v[0],.445,v[1],.44,.06,.44,'cloth',q.yaw);B(S.frame,v[0],.405,v[1],.42,.03,.42,'arch30-timber',q.yaw);
  for(const ex of[-.19,.19])for(const ez of[-.19,.19]){v=a(ex,ez);B(S.frame,v[0],ez<0?.47:.2,v[1],.04,ez<0?.94:.4,.04,p.kind==='diner'?'arch30-metal':'arch30-timber',q.yaw);}
  v=a(0,-.2);B(p.kind==='italian'?S.frame:S.seat,v[0],.74,v[1],.4,.3,.035,p.kind==='italian'?'arch30-timber':'cloth',q.yaw);if(p.kind==='italian'){B(S.frame,v[0],.52,v[1],.38,.04,.03,'arch30-timber',q.yaw);}};
 const wallC=p.kind==='diner'?'#e9ecea':p.kind==='steak'?'#2e211b':p.kind==='casual'?'#f4f8f8':'#f1dfb8';
 const lamp=(x,z,drop=2.1)=>{B('#1d1512',x,H-(H-drop-.2)/2-.1,z,.025,H-drop-.3,.025,'arch30-metal');if(p.kind==='steak'){P('cylinder',S.shade,x,drop+.16,z,.34,.3,.34,'arch30-metal');P('sphere',S.lamp,x,drop+.04,z,.2,.16,.2,'glow');}else if(p.kind==='italian'){P('cone',S.shade,x,drop+.2,z,.62,.3,.62,'arch30-metal');P('sphere',S.lamp,x,drop+.06,z,.17,.17,.17,'glow');}else{P('sphere','#f4efe6',x,drop+.14,z,.4,.4,.4,'glow');P('cylinder',S.edge,x,drop+.36,z,.2,.08,.2,'arch30-metal');}};
 // ---- the floor
 if(p.kind==='diner'){for(let i=0;i<Math.ceil(W/1.6);i++)for(let j=0;j<Math.ceil(D/1.6);j++)if((i+j)%2===0){const x=-X+.2+(i+.5)*1.6,z=-Z+.2+(j+.5)*1.6;if(x<X-.6&&z<Z-.6)B('#20262a',x,.022,z,1.6,.012,1.6,'arch30-interior');}}
 else if(p.kind==='steak'){for(let i=0;i<Math.floor((W-.6)/.9);i++)B(i%3===0?'#4a3122':i%3===1?'#5f4230':'#553a29',-X+.3+(i+.5)*.9,.021,0,.86,.012,D-.6,'arch30-timber');B('#6b2a24',0,.03,.5,13.6,.014,8.6,'cloth');B('#c9a24a',0,.034,.5,13,.004,8,'cloth');B('#5a1f1c',0,.037,.5,12.6,.004,7.6,'cloth');}
 else if(p.kind==='casual'){for(let i=0;i<Math.floor((W-.6)/.9);i++)B(i%2?'#cdb78c':'#d3bf95',-X+.3+(i+.5)*.9,.021,0,.86,.012,D-.6,'arch30-timber');B('#1f7f8a',0,.03,.3,9,.014,6,'cloth');B('#f4f8f8',0,.034,.3,8.4,.004,5.4,'cloth');B('#1f7f8a',0,.037,.3,7.6,.004,4.6,'cloth');}
 else{for(let x=-X+1.3;x<X-.5;x+=1.3)B('#8f5636',x,.021,0,.05,.012,D-.6);for(let z=-Z+1.3;z<Z-.5;z+=1.3)B('#8f5636',0,.021,z,W-.6,.012,.05);}
 // ---- wainscot along the side walls and the back of the dining room, and a rail above it
 const wz0=L.kitchenZ+.14,wlen=Z-.3-wz0;for(const e of[-1,1]){B(S.wains,e*(X-.27),.6,wz0+wlen/2,.06,1.2,wlen,p.kind==='diner'?'arch30-panel':'arch30-timber');B(S.edge,e*(X-.3),1.23,wz0+wlen/2,.1,.06,wlen,p.kind==='diner'?'arch30-metal':'arch30-timber');}
 // ---- tables, seats and lamps
 for(const t of L.tables){
  if(t.kind==='booth'){const ax=t.axis==='x',tw=t.w,td=t.d;
   B(S.top,t.x,.755,t.z,tw,.05,td,p.kind==='steak'?'arch30-timber':'arch30-panel');B(S.edge,t.x,.725,t.z,tw+.02,.03,td+.02,'arch30-metal');
   // one leg at the open end, a bracket at the wall end
   const lx=ax?t.x+t.open*(tw/2-.25):t.x,lz=ax?t.z:t.z+t.open*(td/2-.25);P('cylinder',S.leg,lx,.36,lz,.1,.72,.1,'arch30-metal');P('cylinder',S.leg,lx,.02,lz,.5,.04,.5,'arch30-metal');
   for(const q of t.seats){const bw=ax?1.6:.5,bd=ax?.5:1.6,side=ax?Math.sign(q.z-t.z):Math.sign(q.x-t.x);
    B('#2a2a2c',q.x,.13,q.z,bw-.06,.26,bd-.06,'arch30-metal');B(S.seat,q.x,.37,q.z,bw,.2,bd,'cloth');
    // the back stands on the side away from the table
    const bx=ax?q.x:q.x+side*.3,bz=ax?q.z+side*.3:q.z;B(S.seat,bx,.84,bz,ax?bw:.12,.76,ax?.12:bd,'cloth');B(S.trim,bx,1.24,bz,ax?bw+.02:.15,.05,ax?.15:bd+.02,p.kind==='steak'?'arch30-timber':'arch30-metal');
    if(p.kind==='diner')B(S.trim,bx-(ax?0:side*.062),.84,bz-(ax?side*.062:0),ax?.05:.004,.7,ax?.004:.05,'arch30-panel');}
  }else{const r=t.w;
   if(S.cloth){B(S.cloth,t.x,.775,t.z,r+.06,.012,r+.06,'cloth');for(const e of[-1,1]){B(S.cloth,t.x+e*(r/2+.03),.66,t.z,.012,.24,r+.06,'cloth');B(S.cloth,t.x,.66,t.z+e*(r/2+.03),r+.06,.24,.012,'cloth');}
    if(p.kind==='italian')for(let i=0;i<5;i++)for(let j=0;j<5;j++)if((i+j)%2===0)B('#c8242b',t.x-r/2+(i+.5)*r/5,.783,t.z-r/2+(j+.5)*r/5,r/5,.004,r/5,'cloth');}
   B(S.top,t.x,.745,t.z,r,.05,r,p.kind==='diner'?'arch30-panel':'arch30-timber');if(p.kind==='diner')B(S.edge,t.x,.74,t.z,r+.03,.04,r+.03,'arch30-metal');
   P('cylinder',S.leg,t.x,.37,t.z,.1,.74,.1,p.kind==='diner'?'arch30-metal':'arch30-timber');P('cylinder',S.leg,t.x,.025,t.z,.56,.05,.56,p.kind==='diner'?'arch30-metal':'arch30-timber');
   for(const q of t.seats)chair(q);}
  // what stands on a booth table, at the wall end. On the other tables it is put there by city-dining-play.js, which
  // takes it away from the table you sit at so that it is not between you and your food.
  const ty=.782,cx=t.axis==='x'?t.x-t.open*.5:t.x,cz=t.axis==='x'?t.z:t.z-t.open*.5;
  if(t.kind!=='booth'){}else if(p.kind==='casual'){P('cylinder','#b86a4c',cx,ty+.05,cz,.1,.1,.1,'arch30-roof');P('sphere','#6a9a5a',cx,ty+.13,cz,.14,.1,.14,'foliage');P('cylinder','#f4f8f8',cx+.14,ty+.07,cz+.06,.05,.14,.05,'arch30-glass');}else if(p.kind==='diner'){P('cylinder','#c8242b',cx-.08,ty+.09,cz,.055,.18,.055,'arch30-panel');P('cylinder','#f2c230',cx+.06,ty+.09,cz,.055,.18,.055,'arch30-panel');B('#c9ced1',cx,ty+.06,cz+.12,.13,.12,.09,'arch30-metal');P('cylinder','#f4efe6',cx-.02,ty+.05,cz-.12,.045,.1,.045,'arch30-glass');}
  else if(p.kind==='steak'){P('cylinder','#f4f1ea',cx,ty+.05,cz,.07,.1,.07,'arch30-glass');P('sphere','#ffcf8a',cx,ty+.13,cz,.045,.07,.045,'glow');P('cylinder','#1d1512',cx+.14,ty+.07,cz+.06,.04,.14,.04,'arch30-metal');P('cylinder','#f4f1ea',cx+.2,ty+.055,cz-.02,.04,.11,.04,'arch30-panel');}
  else{P('cylinder','#2f5a3d',cx,ty+.09,cz,.08,.18,.08,'arch30-glass');P('cylinder','#c9a25a',cx,ty+.05,cz,.11,.1,.11,'arch30-timber');P('cylinder','#f6f1e6',cx,ty+.24,cz,.022,.12,.022,'arch30-panel');P('sphere','#ffdf9a',cx,ty+.33,cz,.035,.06,.035,'glow');P('cylinder','#f6f1e6',cx+.16,ty+.05,cz+.08,.04,.1,.04,'arch30-glass');}
  if(!t.out)lamp(t.x,t.z,t.kind==='booth'?2.05:2.2);
 }
 // ---- the wall between the room and the kitchen, the pass, the gate
 for(const q of L.solid){const[k,x,z,w,h,d]=q;
  if(k==='wall'){/* V7.6: drawn 5 cm short of the outer walls, so its end does not flicker against the window glass in them */const a=Math.max(x-w/2,-X+.05),b2=Math.min(x+w/2,X-.05),cx=(a+b2)/2,ww=b2-a;B(wallC,cx,h/2,z,ww,h,d,'arch30-interior');B(S.wains,cx,.6,z+d/2+.02,ww,1.2,.04,p.kind==='diner'?'arch30-panel':'arch30-timber');B(S.edge,cx,1.23,z+d/2+.03,ww,.06,.07,p.kind==='diner'?'arch30-metal':'arch30-timber');}
  else if(k==='gate'){B(p.kind==='italian'?'#6b4a2f':'#8a8f92',x,h>1.5?1.02:.6,z,w-.1,h>1.5?1.5:.9,.05,p.kind==='italian'?'arch30-timber':'arch30-metal');if(h>1.5){P('cylinder','#bcd3da',x,1.5,z+.03,.34,.02,.34,'arch30-glass',PI/2);B(wallC,x,(H+2.1)/2,z,w,H-2.1,.24,'arch30-interior');}}
  else if(k==='pass'){const open=p.kind!=='italian';B(p.kind==='diner'?'#c9ced1':S.board,x,h/2,z,w,h,d,p.kind==='diner'?'arch30-metal':'arch30-timber');B(p.kind==='italian'?'#d9d2c2':'#c9ced1',x,h+.025,z,w+.06,.05,d+.14,p.kind==='italian'?'arch30-stone':'arch30-metal');
   if(open){B(wallC,x,(H+2.15)/2,z,w,H-2.15,.24,'arch30-interior');for(let i=0;i<Math.round(w/1.4);i++){const lx=x-w/2+.7+i*1.4;B('#8a8f92',lx,2.0,z+.1,.5,.06,.3,'arch30-metal');P('sphere','#ffb45a',lx,1.93,z+.1,.22,.08,.16,'glow');}
    /* the ticket rail with the orders on it */B('#c9ced1',x,1.86,z+.32,w*.6,.03,.03,'arch30-metal');for(let i=0;i<5;i++)B('#fbf7ea',x-w*.25+i*w*.12,1.76,z+.32,.09,.17,.004,'arch30-panel',0);}
   else{/* a glass screen along the counter and things on it */for(let i=0;i<5;i++)B('#cfe3e6',x-6+i*2.6,h+.33,z+.2,2.3,.5,.02,'arch30-glass');for(let i=0;i<6;i++)B('#8a8f92',x-7.3+i*2.6,h+.33,z+.2,.03,.56,.03,'arch30-metal');
    for(let i=0;i<4;i++){P('cylinder','#f6f1e6',x-5+i*2.6,h+.07,z-.05,.5,.03,.5,'arch30-panel');P('cylinder','#d9a45b',x-5+i*2.6,h+.1,z-.05,.44,.03,.44,'matte');P('cylinder',i%2?'#c93a26':'#f3cf6a',x-5+i*2.6,h+.12,z-.05,.38,.012,.38,'matte');}}}
  else if(k==='bar'){const along=L.bar&&L.bar.along==='x';
   if(p.kind==='steak'){B('#2a1a12',x,h/2,z,w,h,d,'arch30-timber');B('#1d1512',x,h+.03,z,w+.16,.06,d+.1,'arch30-timber');B('#c9a24a',x+w/2+.2,.22,z,.04,.04,d-.4,'arch30-metal');for(let i=0;i<6;i++){const sz=z-d/2+.7+i*(d-1.4)/5,sx=x+w/2+.55;P('cylinder','#5a1f1c',sx,.78,sz,.36,.08,.36,'cloth');P('cylinder','#c9a24a',sx,.39,sz,.05,.78,.05,'arch30-metal');P('cylinder','#c9a24a',sx,.02,sz,.36,.04,.36,'arch30-metal');P('torus','#c9a24a',sx,.3,sz,.3,.3,.03,'arch30-metal',PI/2);}
    // the back bar: shelves of bottles in front of a mirror
    B('#1d1512',-X+.55,1.2,z,.5,2.4,d+.4,'arch30-timber');B('#9fb3b8',-X+.82,1.75,z,.02,1.1,d,'arch30-glass');for(const y of[1.25,1.7,2.15]){B('#33221a',-X+.72,y,z,.3,.04,d+.2,'arch30-timber');for(let i=0;i<16;i++){const c=['#6a8f3a','#b5682c','#2f5a3d','#d9d2c2','#7a1f1c','#c9a24a'][(i*5+Math.round(y*7))%6];P('cylinder',c,-X+.72,y+.15,z-d/2+.2+i*d/16,.07,.26,.07,'arch30-glass');P('cylinder',c,-X+.72,y+.32,z-d/2+.2+i*d/16,.03,.09,.03,'arch30-glass');}}
    for(let i=0;i<3;i++)lamp(x+.3,z-d/2+1.1+i*(d-2.2)/2,2.3);}
   else{/* the diner counter: steel front, cream top, a row of stools, the pie case and the coffee */B('#c9ced1',x,h/2,z,w,h,d,'arch30-metal');B('#f4efe6',x,h+.03,z+.06,w+.1,.06,d+.3,'arch30-panel');B('#c8242b',x,h*.55,z+d/2+.012,w,.16,.02,'arch30-panel');B('#1f9b96',x,h*.3,z+d/2+.012,w,.1,.02,'arch30-panel');B('#c9ced1',x,.18,z+d/2+.22,w-.4,.04,.04,'arch30-metal');
    for(let i=0;i<10;i++){const sx=x-w/2+.9+i*(w-1.8)/9,sz=z+d/2+.62;P('cylinder','#c8242b',sx,.74,sz,.38,.1,.38,'cloth');P('cylinder','#c9ced1',sx,.685,sz,.4,.03,.4,'arch30-metal');P('cylinder','#c9ced1',sx,.34,sz,.06,.68,.06,'arch30-metal');P('cylinder','#c9ced1',sx,.02,sz,.4,.04,.4,'arch30-metal');}
    B('#dfe9ec',x-5.5,h+.3,z,1.5,.48,.5,'arch30-glass');B('#c9ced1',x-5.5,h+.56,z,1.56,.04,.56,'arch30-metal');for(let i=0;i<3;i++){P('cylinder','#f4efe6',x-6+i*.5,h+.09,z,.36,.02,.36,'arch30-panel');P('cylinder',['#c98a3c','#7a2a1c','#f1dfae'][i],x-6+i*.5,h+.15,z,.32,.1,.32,'matte');}
    B('#33383b',x+5.4,h+.27,z-.05,.7,.42,.42,'arch30-metal');for(const e of[-1,1]){P('cylinder','#3a2416',x+5.4+e*.18,h+.18,z+.24,.15,.2,.15,'arch30-glass');P('cylinder','#1d1512',x+5.4+e*.18,h+.3,z+.24,.16,.03,.16,'arch30-metal');}
    B('#c9ced1',x+2,h+.2,z,.34,.28,.3,'arch30-metal');for(let i=0;i<4;i++){P('cylinder','#f4efe6',x-2.6+i*1.3,h+.07,z+.05,.09,.02,.09,'arch30-panel');P('cylinder','#f4efe6',x-2.6+i*1.3,h+.1,z+.05,.07,.07,.07,'arch30-panel');}}
  }else if(k==='hearth'){/* the fireplace: a stone breast up to the ceiling, an arched opening, logs and a fire */B('#8d8578',x,H/2,z,w,H,d,'arch30-stone');B('#1a1412',x+.4,.75,z,.36,1.3,1.5,'matte');B('#6f685c',x+.52,1.5,z,.3,.22,1.9,'arch30-stone');B('#3b2418',x+.6,1.68,z,.42,.1,2.3,'arch30-timber');B('#6f685c',x+.55,.1,z,.9,.2,2.2,'arch30-stone');
   for(let i=0;i<3;i++)P('cylinder','#3b2418',x+.45,.3+i*.05,z-.3+i*.3,.14,1,.14,'arch30-timber',PI/2,i*.5);for(let i=0;i<4;i++)P('cone',i%2?'#ffb03a':'#ff7a2a',x+.45,.62+((i*7)%3)*.07,z-.33+i*.22,.24,.5+((i*5)%3)*.12,.24,'glow');P('sphere','#ff8a3a',x+.45,.36,z,.5,.14,1,'glow');}
  else if(k==='stand'){B(S.board,x,h/2,z,w,h,d,p.kind==='diner'?'arch30-panel':'arch30-timber');B(S.edge,x,h+.02,z,w+.08,.04,d+.08,p.kind==='diner'?'arch30-metal':'arch30-timber');B('#fbf7ea',x,h+.07,z,.36,.02,.28,'arch30-panel',.3);P('sphere',S.lamp,x-.25,h+.2,z,.1,.14,.1,'glow');P('cylinder','#1d1512',x-.25,h+.08,z,.03,.16,.03,'arch30-metal');if(p.kind==='diner'){B('#33383b',x+.22,h+.16,z,.3,.26,.3,'arch30-metal');B('#1f9b96',x+.22,h+.32,z-.05,.26,.12,.04,'arch30-panel');}}
  else if(k==='oven'){/* the wood oven: a brick base, a dome, a glowing mouth and a flue */B('#a5563f',x,.5,z,w,1,d,'arch30-brick');B('#d9d2c2',x,1.03,z,w+.1,.08,d+.1,'arch30-stone');P('sphere','#b86a4c',x,1.1,z-.2,w-.2,2.6,d-.4,'arch30-brick');B('#1a1412',x,1.42,z+d/2-.36,1.1,.5,.3,'matte');P('cylinder','#1a1412',x,1.66,z+d/2-.36,1.1,.3,.5,'matte',PI/2);P('sphere','#ff8a3a',x,1.3,z+d/2-.55,.8,.26,.5,'glow');for(let i=0;i<3;i++)P('cone',i%2?'#ffb03a':'#ff7a2a',x-.25+i*.25,1.42,z+d/2-.6,.16,.3,.16,'glow');
   for(let i=0;i<7;i++)B('#8f4937',x-.66+i*.22,1.78+(i===3?.06:i===2||i===4?.03:0),z+d/2-.2,.2,.12,.14,'arch30-brick');B('#33383b',x,H-.9,z-.4,.5,1.8,.5,'arch30-metal');B('#c9a25a',x+w/2+.25,1.3,z+d/2-.3,.05,2.2,.05,'arch30-timber',0);P('cylinder','#c9a25a',x+w/2+.25,2.4,z+d/2-.3,.46,.02,.46,'arch30-timber',PI/2);}
  else if(k==='jukebox'){B('#7a1f1c',x,.75,z,d,1.5,w,'arch30-panel');P('cylinder','#7a1f1c',x,1.5,z,w,d,w,'arch30-panel',0,0,PI/2);B('#ffcf5a',x-d/2-.01,1.1,z,.02,.5,.6,'glow');B('#5ad1e8',x-d/2-.012,.55,z,.02,.4,.5,'glow');for(const e of[-1,1])B('#ff5aa8',x-d/2-.012,1.0,z+e*.38,.02,1.3,.06,'glow');}
 }
 // ---- the kitchen behind the wall: a range with a hood, a fridge, shelves of pans
 const kz=(L.kitchenZ-Z)/2-Z/2+.0,kzc=(-Z+L.kitchenZ)/2;
 B(p.kind==='italian'?'#d9d2c2':'#dfe3e4',0,.016,kzc,W-.6,.01,L.kitchenZ+Z-.2,'arch30-panel');
 if(p.kind!=='italian'){B('#8a8f92',1.2,.46,-Z+.75,5.2,.92,.9,'arch30-metal');B('#33383b',1.2,.94,-Z+.75,5.2,.04,.9,'arch30-metal');for(let i=0;i<4;i++){P('cylinder','#1a1412',-.4+i*1.1,.97,-Z+.75,.36,.03,.36,'arch30-metal');if(i%2===0)P('cone','#ff8a3a',-.4+i*1.1,1.06,-Z+.75,.2,.16,.2,'glow');}
  P('cylinder','#33383b',.7,1.07,-Z+.78,.42,.14,.42,'arch30-metal');B('#8a8f92',1.2,2.5,-Z+.75,5.6,.6,1.1,'arch30-metal');B('#c9ced1',1.2,2.18,-Z+.75,5.7,.06,1.2,'arch30-metal');B('#c9ced1',-5.6,1.05,-Z+.7,1.5,2.1,.9,'arch30-metal');B('#8a8f92',-5.6,1.05,-Z+1.16,.04,1.5,.03,'arch30-metal');
  B('#c9ced1',6.6,1.9,-Z+.5,3.4,.05,.5,'arch30-metal');for(let i=0;i<5;i++)P('cylinder',i%2?'#8a8f92':'#33383b',5.3+i*.65,2.06,-Z+.5,.4,.26,.4,'arch30-metal');B('#c9ced1',6.6,.46,-Z+.6,3.4,.92,.7,'arch30-metal');}
 else{B('#d9d2c2',2,.46,-Z+.7,10,.92,.8,'arch30-stone');for(let i=0;i<4;i++){P('cylinder','#f6f1e6',-1.6+i*1.5,.95,-Z+.7,.5,.03,.5,'arch30-panel');P('sphere','#f1dfb8',-1.6+i*1.5,1,-Z+.7,.3,.14,.3,'matte');}B('#c9ced1',9,1.05,-Z+.7,1.4,2.1,.9,'arch30-metal');B('#7a5230',3,2.1,-Z+.42,7,.06,.4,'arch30-timber');for(let i=0;i<9;i++)P('cylinder',['#c93a26','#2f5a3d','#f3cf6a'][i%3],0+i*.75,2.28,-Z+.42,.22,.3,.22,'arch30-panel');
  for(let i=0;i<5;i++){B('#6b4a2f',-9.6+((i*37)%20)/10-1,.2+i*.01,-Z+3.4+(i%2)*.3,.18,.18,1.1,'arch30-timber',i*.3);}}
 // ---- what is on the walls
 if(p.kind==='diner'){for(const e of[-1,1])for(let i=0;i<3;i++){B('#1d2326',e*(X-.3),2.4,-6+i*4.4+(e>0?0:1.2),.04,.9,1.2,'arch30-panel');B(['#f6c21c','#1f9b96','#c8242b'][i],e*(X-.33),2.4,-6+i*4.4+(e>0?0:1.2),.02,.76,1.06,'arch30-panel');}
  P('cylinder','#f4efe6',5.4,3.3,L.kitchenZ+.16,.9,.06,.9,'arch30-panel',PI/2);P('torus','#ff5aa8',5.4,3.3,L.kitchenZ+.2,.96,.96,.05,'glow');B('#1d2326',5.4,3.44,L.kitchenZ+.2,.03,.3,.02,'matte');B('#1d2326',5.52,3.3,L.kitchenZ+.2,.24,.03,.02,'matte');
  for(let i=0;i<3;i++)B(['#ff5aa8','#5ad1e8','#ffcf5a'][i],-6.5+i*.02,3.5-i*.22,L.kitchenZ+.16,5-i*.6,.06,.03,'glow');}
 else if(p.kind==='steak'){for(const e of[-1,1])for(let i=0;i<3;i++){const z=-3.4+i*4.4;if(e<0&&z<2.4)continue;B('#c9a24a',e*(X-.3),2.5,z,.04,1.2,1.5,'arch30-metal');B(['#3d4a3a','#4a3a2e','#2e3a44'][i],e*(X-.33),2.5,z,.02,1.06,1.36,'arch30-panel');P('sphere','#ffcf8a',e*(X-.42),3.35,z,.14,.2,.3,'glow');}
  for(let x=-X+2.2;x<X;x+=4.3)B('#1d1512',x,H-.34,(L.kitchenZ+Z)/2,.28,.3,Z-L.kitchenZ-.4,'arch30-timber');
  /* the wine wall by the door */B('#1d1512',-X+.5,1.4,8.6,.6,2.8,2.2,'arch30-timber');for(let i=0;i<5;i++)for(let j=0;j<4;j++)P('cylinder',(i+j)%3?'#2f3a2a':'#5a1f1c',-X+.72,.5+i*.5,7.8+j*.5,.09,.34,.09,'arch30-glass',0,0,PI/2);}
 else if(p.kind==='casual'){
  // white beams, three ceiling fans, life rings and a painted fish on the walls, oars over the pass
  for(let x=-X+2.2;x<X;x+=4.3)B('#f4f8f8',x,H-.3,(L.kitchenZ+Z)/2,.2,.22,Z-L.kitchenZ-.4,'arch30-timber');
  for(const x of[-6,0,6]){B('#8a8f92',x,H-.5,1,.06,.6,.06,'arch30-metal');P('cylinder','#f4f8f8',x,H-.82,1,.3,.14,.3,'arch30-metal');for(let k=0;k<4;k++)B('#b9925a',x+Math.cos(k*PI/2)*.75,H-.86,1+Math.sin(k*PI/2)*.75,1.3,.03,.22,'arch30-timber',-k*PI/2);}
  for(const e of[-1,1]){for(let i=0;i<2;i++){P('torus','#f4f8f8',e*(X-.3),2.6,-2+i*5,1,1,.14,'arch30-panel',0,PI/2);for(let k=0;k<4;k++)B('#e8604a',e*(X-.3),2.6+Math.sin(k*PI/2+.78)*.5,-2+i*5+Math.cos(k*PI/2+.78)*.5,.16,.2,.2,'arch30-panel');}
   P('sphere','#1f7f8a',e*(X-.3),3.2,.5,.08,.6,1.9,'arch30-panel');P('cone','#1f7f8a',e*(X-.3),3.2,1.7,.08,.7,.7,'arch30-panel',PI/2);}
  for(const e of[-1,1])P('box','#b9925a',e*1.2,3.1,L.kitchenZ+.18,.1,2.6,.05,'arch30-timber',0,0,e*.9);
 }
 else{for(let x=-X+2.2;x<X;x+=4.3)B('#6b4a2f',x,H-.3,(L.kitchenZ+Z)/2,.22,.24,Z-L.kitchenZ-.4,'arch30-timber');
  for(const e of[-1,1]){B('#7a5230',e*(X-.4),2.3,1,.28,.05,7,'arch30-timber');for(let i=0;i<9;i++){const c=['#c93a26','#2f5a3d','#f3cf6a','#f6f1e6','#b86a4c'][i%5];P('cylinder',c,e*(X-.4),2.47,-2.1+i*.78,.24,.3,.24,i%4===3?'arch30-glass':'arch30-panel');}
   for(let i=0;i<3;i++){B('#f6f1e6',e*(X-.29),3.3,-2+i*3,.03,.7,.9,'arch30-panel');B(['#b3261e','#2f7d4f','#c98f5a'][i],e*(X-.31),3.3,-2+i*3,.02,.56,.76,'arch30-panel');}}
  /* braids of garlic and peppers over the counter, and a little flag bunting across the room */for(let i=0;i<6;i++){const x=-9+i*2.3;for(let k=0;k<5;k++)P('sphere',i%2?'#f6f1e6':'#c8242b',x,2.9-k*.13,L.kitchenZ+.3,.13,.13,.13,'matte');}
  for(let i=0;i<24;i++){const x=-X+.8+i*(W-1.6)/23;B(['#2f7d4f','#f6f1e6','#c8242b'][i%3],x,H-.9-.25*Math.sin(i/23*PI),4.6,.34,.3,.012,'cloth');}B('#4a3a30',0,H-.74,4.575,W-1.2,.015,.015,'matte');}
 // ---- by the door: a mat, and a sign that tells you what to do
 B(p.kind==='steak'?'#5a1f1c':p.kind==='italian'?'#2f5a3d':'#1f9b96',0,.03,Z-1.4,2.8,.016,1.6,'cloth');
}
// The outside of the two new buildings (and their rooms). The Copper Kettle keeps the front it got in V4.6.
// V6.7: the inside of a fast-food place, in the brand's own colours: a runner on the floor from the door to the
// counter, panelling along the side walls, every booth, table and chair from layout() (so a chair on screen is a
// chair you can sit on), a lamp over every table, sauces and napkins on the booth tables, lit menu boards over the
// kitchen line, pictures, plants, a drinks stand and a tray stand. city-restaurants.js calls it for its brands.
function fastInterior(scene,bt,s,pal,api,b){
 const p=byId.get(s.id)||byId.get(baseId(s.id))/* V12.6 */;if(!p||!p.fast)return;const L=layout(p),K=p.look,W=p.W,D=p.D,H=p.H,X=W/2,Z=D/2,steel='#c9ced1',dark='#22262a',cream='#fffdf6';
 const B=(c,x,y,z,w,h,d,kind,ry)=>api.box(c,x,y,z,w,h,d,kind||'arch30-interior',ry||0);
 const P=(shape,c,x,y,z,w,h,d,kind,rx,ry,rz)=>api.part(shape,c,x,y,z,w,h,d,rx||0,ry||0,rz||0,kind||'arch30-interior');
 const at=(q,dx,dz)=>[q.x+dx*Math.cos(q.yaw)+dz*Math.sin(q.yaw),q.z-dx*Math.sin(q.yaw)+dz*Math.cos(q.yaw)];
 const chair=q=>{let v=at(q,0,0);B(K.booth,v[0],.445,v[1],.44,.06,.44,'cloth',q.yaw);B(steel,v[0],.405,v[1],.42,.03,.42,'arch30-metal',q.yaw);
  for(const ex of[-.19,.19])for(const ez of[-.19,.19]){v=at(q,ex,ez);B(steel,v[0],ez<0?.47:.2,v[1],.035,ez<0?.94:.4,.035,'arch30-metal',q.yaw);}
  v=at(q,0,-.2);B(K.booth,v[0],.76,v[1],.4,.28,.035,'cloth',q.yaw);};
 const lamp=(x,z,drop)=>{B(dark,x,H-(H-drop-.2)/2-.1,z,.025,H-drop-.3,.025,'arch30-metal');P('cone',K.counter,x,drop+.2,z,.56,.3,.56,'arch30-metal');P('sphere','#ffe9b8',x,drop+.06,z,.17,.17,.17,'glow');};
 const plant=(x,z,h=1.5)=>{P('cylinder',dark,x,.28,z,.5,.56,.5,'arch30-metal');P('cylinder','#3a2a20',x,.58,z,.44,.04,.44);P('sphere','#3d8a3a',x,h-.35,z,.8,.9,.8,'foliage');P('sphere','#5a9a44',x+.18,h-.05,z-.1,.55,.6,.55,'foliage');P('cylinder','#5a4028',x,.85,z,.06,.6,.06,'arch30-timber');};
 // ---- the floor: a runner from the door to the counter, edged in the accent colour
 B(K.counter,0,.022,2.95,3,.012,11.5,'cloth');for(const e of[-1,1])B(K.accent,e*1.56,.025,2.95,.1,.012,11.5,'cloth');
 // ---- panelling along both side walls, with a steel rail above it
 for(const e of[-1,1]){B(K.booth,e*(X-.27),.6,2.85,.06,1.2,11.7,'arch30-panel');B(steel,e*(X-.3),1.23,2.85,.1,.06,11.7,'arch30-metal');}
 // ---- tables, seats and lamps
 for(const t of L.tables){
  if(t.kind==='booth'){B(K.table,t.x,.755,t.z,t.w,.05,t.d,'arch30-panel');B(steel,t.x,.725,t.z,t.w+.02,.03,t.d+.02,'arch30-metal');const lx=t.x+t.open*(t.w/2-.25);P('cylinder',steel,lx,.36,t.z,.1,.72,.1,'arch30-metal');P('cylinder',steel,lx,.02,t.z,.5,.04,.5,'arch30-metal');
   for(const q of t.seats){const side=Math.sign(q.z-t.z);B(dark,q.x,.13,q.z,1.54,.26,.44,'arch30-metal');B(K.booth,q.x,.37,q.z,1.6,.2,.5,'cloth');B(K.booth,q.x,.84,q.z+side*.3,1.6,.76,.12,'cloth');B(K.accent,q.x,1.24,q.z+side*.3,1.62,.05,.15,'arch30-panel');}
   // on the table at the wall end: napkins, ketchup, mustard
   const cx=t.x-t.open*.5,ty=.782;B(steel,cx,ty+.06,t.z+.1,.09,.12,.13,'arch30-metal');B(cream,cx,ty+.07,t.z+.1,.095,.08,.11,'arch30-panel');P('cylinder','#c8242b',cx,ty+.08,t.z-.1,.045,.16,.045,'arch30-panel');P('cylinder','#f2c230',cx+.07,ty+.08,t.z-.14,.045,.16,.045,'arch30-panel');
   lamp(t.x,t.z,2.05);}
  else{const r=t.w;B(K.table,t.x,.745,t.z,r,.05,r,'arch30-panel');B(steel,t.x,.74,t.z,r+.03,.04,r+.03,'arch30-metal');P('cylinder',steel,t.x,.37,t.z,.1,.74,.1,'arch30-metal');P('cylinder',steel,t.x,.025,t.z,.56,.05,.56,'arch30-metal');for(const q of t.seats)chair(q);lamp(t.x,t.z,2.2);}}
 // ---- lit menu boards over the kitchen line: a dark rail, four panels, each with three round pictures and lines of text
 const bz=-Z+.5;B(dark,0,3.25,bz-.06,13.4,1.5,.1,'arch30-metal');B(K.accent,0,4.04,bz,13.4,.1,.06,'glow');
 for(let i=0;i<4;i++){const x=-4.95+i*3.3;B(cream,x,3.25,bz+.01,3.05,1.28,.04,'glow');B(K.counter,x,3.79,bz+.04,3.05,.2,.02,'arch30-panel');
  for(let k=0;k<3;k++){const px=x-1+k*1,c=['#d9a45b','#c8342a','#f6c21c','#5a9a44','#6b4022','#f0a0b0'][(i*3+k)%6];P('cylinder','#f4efe6',px,3.36,bz+.045,.56,.02,.56,'arch30-panel',Math.PI/2);P('cylinder',c,px,3.36,bz+.06,.4,.02,.4,'matte',Math.PI/2);B(dark,px,2.93,bz+.045,.62,.05,.01,'matte');B('#8a8f92',px,2.82,bz+.045,.44,.04,.01,'matte');}}
 // ---- pictures between the booths, in the two brand colours
 for(const e of[-1,1])for(let i=0;i<3;i++){const z=.2+i*2.2;B('#1d1512',e*(X-.25),2.25,z,.05,.84,1.24,'arch30-timber');B(i%2?K.counter:K.accent,e*(X-.28),2.25,z,.03,.7,1.1,'arch30-panel');P('cylinder',cream,e*(X-.3),2.25,z,.46,.02,.46,'arch30-panel',0,0,Math.PI/2);P('cylinder',i%2?K.accent:K.counter,e*(X-.315),2.25,z,.3,.02,.3,'matte',0,0,Math.PI/2);}
 // ---- plants in the four corners of the dining room
 plant(-X+.8,Z-.8,1.9);plant(X-.8,Z-.8,1.9);plant(-X+.7,-2.9,1.6);plant(X-.7,-2.9,1.6);
 // ---- by the door: a drinks stand on one side, a tray stand on the other, and a board that says where to sit
 B(steel,-4.3,.5,Z-.75,2.2,1,.7,'arch30-metal');B(K.counter,-4.3,1.03,Z-.75,2.3,.06,.8,'arch30-panel');for(let i=0;i<3;i++){B(dark,-5+i*.7,1.34,Z-.7,.36,.56,.4,'arch30-metal');B(['#c8242b','#f2c230','#3d8a3a'][i],-5+i*.7,1.48,Z-.92,.3,.2,.02,'glow');P('cylinder',cream,-5+i*.7,1.11,Z-1,.1,.1,.1,'arch30-panel');}
 B(K.booth,4.3,.55,Z-.75,1.4,1.1,.7,'arch30-panel');B(dark,4.3,.75,Z-1.11,.9,.3,.02,'matte');for(let i=0;i<3;i++)B('#8a5a34',4.3,1.13+i*.035,Z-.75,1.1,.025,.5,'arch30-timber');
 B(dark,2.2,.6,Z-2,.06,1.2,.06,'arch30-metal');P('cylinder',dark,2.2,.02,Z-2,.5,.04,.5,'arch30-metal');B(K.accent,2.2,1.38,Z-2,.7,.5,.04,'arch30-panel');B(cream,2.2,1.38,Z-2.025,.6,.4,.01,'arch30-panel');for(let i=0;i<3;i++)B(dark,2.2,1.5-i*.12,Z-2.035,.44-i*.08,.04,.005,'matte');
}
function dress(scene,bt,s,pal,api,bays){
 const p=place(s.id);if(!p)return;interior(scene,bt,s,pal,api);if(p.existing)return;
 const W=p.W,D=p.D,H=p.H,X=W/2,Z=D/2,dw=s.doorWidth,F=bays(s);
 const B=(c,x,y,z,w,h,d,kind,ry)=>api.box(c,x,y,z,w,h,d,kind||'arch30-concrete',ry||0);
 const P=(shape,c,x,y,z,w,h,d,kind,rx,ry,rz)=>api.part(shape,c,x,y,z,w,h,d,rx||0,ry||0,rz||0,kind||'arch30-metal');
 if(p.kind==='steak'){
  const stone='#8d8578',dark='#2a1f19',char='#1d1512',slate='#34373c',gold='#c9a24a',cx=-X-1.15,cz=2.4;
  // A long slate roof with its eaves to the street, on a band of dark boards; rough stone below the windows.
  P('roof',slate,0,H+.05,0,D+1.8,3.1,W+1.8,'arch30-roof',0,PI/2);B(char,0,H-.02,Z+.86,W+1.9,.16,.2,'arch30-timber');B(char,0,H-.02,-Z-.86,W+1.9,.16,.2,'arch30-timber');
  B(dark,0,4.25,Z+.14,W+.3,1.9,.2,'arch30-timber');for(let i=0;i<Math.round(W/.65);i++)B(char,-X+.3+i*.65,4.25,Z+.26,.07,1.9,.05,'arch30-timber');
  for(const e of[-1,1]){B(dark,e*(X+.1),4.25,0,.2,1.9,D+.3,'arch30-timber');B(stone,e*(X+.14),.6,0,.3,1.2,D+.4,'arch30-stone');}
  for(const f of F){B(stone,f.u,.52,Z+.2,f.w+1.1,1.04,.36,'arch30-stone');B(char,f.u,1.08,Z+.32,f.w+1.2,.08,.5,'arch30-timber');B(char,f.u,3.22,Z+.3,f.w+.5,.14,.3,'arch30-timber');
   B(dark,f.u,.4,Z+.75,4.4,.8,.7,'arch30-timber');for(let i=0;i<7;i++)P('sphere',i%2?'#2f4a2e':'#3d5f3a',f.u-1.8+i*.6,.98,Z+.75,.74,.62,.66,'foliage');}
  // The porch: a gable on four heavy posts with a truss in it, stone feet under the posts, lanterns on the front pair.
  P('roof',slate,0,3.62,Z+2.45,7.6,2.1,4.2,'arch30-roof');B(char,0,3.56,Z+2.45,7.2,.2,4,'arch30-timber');P('roof','#5a4030',0,3.64,Z+4.6,7,1.9,.05,'arch30-timber');
  for(const e of[-1,1])for(const z of[Z+1,Z+4.3]){B(char,e*3.1,1.95,z,.38,3.3,.38,'arch30-timber');B(stone,e*3.1,.3,z,.62,.6,.62,'arch30-stone');}
  B(char,0,3.5,Z+4.72,7,.3,.26,'arch30-timber');B(char,0,4.1,Z+4.72,.24,1.2,.24,'arch30-timber');for(const e of[-1,1])P('box',char,e*1.5,4.05,Z+4.72,3.2,.2,.22,'arch30-timber',0,0,e*-.54);
  for(const e of[-1,1]){B(char,e*3.1,2.65,Z+4.62,.26,.5,.26,'arch30-metal');P('sphere','#ffc77a',e*3.1,2.65,Z+4.78,.17,.3,.12,'glow');B(char,e*(dw/2+.55),1.65,Z+.28,.4,3.3,.5,'arch30-timber');}
  B(char,0,3.23,Z+.62,dw+3,.2,1.75,'arch30-timber');B('#5a1f1c',0,.03,Z+2.6,2.6,.02,5,'cloth');
  // The chimney: fieldstone, with a cap and a glow in the pot.
  B(stone,cx,(H+4.2)/2,cz,2.3,H+4.2,2.3,'arch30-stone');for(let i=0;i<5;i++)B('#7a7366',cx+((i*37)%7-3)*.12,1+i*1.7,cz+1.16,.9,.5,.04,'arch30-stone');B('#6f685c',cx,H+4.28,cz,2.7,.2,2.7,'arch30-stone');B(char,cx,H+4.6,cz,1.2,.5,1.2,'arch30-metal');P('sphere','#ff8a3a',cx,H+4.84,cz,.8,.2,.8,'glow');
  // Brass posts and a rope on each side of the carpet.
  for(const e of[-1,1]){for(const z of[Z+5.2,Z+6.4]){P('cylinder',gold,e*1.7,.48,z,.07,.96,.07);P('sphere',gold,e*1.7,.98,z,.14,.14,.14);P('cylinder',gold,e*1.7,.02,z,.3,.04,.3);}B('#5a1f1c',e*1.7,.82,Z+5.8,.05,.05,1.2,'cloth');}
 }else if(p.kind==='casual'){
  const white='#f4f8f8',pale='#e6eeee',teal='#1f7f8a',wood='#b9925a',sand='#d9c7a0',coral='#e8604a',px=2.9,pz=Z+5.3;
  // White boards with teal trim under a blue metal roof, and a deck across the front with a rope rail,
  // an umbrella over every table and a string of lights.
  P('roof','#3a6f8f',0,H+.05,0,D+2,2.2,W+2,'arch30-roof',0,PI/2);B(white,0,H-.02,Z+1,W+2.1,.14,.2,'arch30-panel');B(white,0,H-.02,-Z-1,W+2.1,.14,.2,'arch30-panel');
  for(let k=0;k<5;k++)B(k%2?pale:white,0,3.38+k*.3,Z+.13,W+.2,.27,.1,'arch30-timber');for(const e of[-1,1])for(let k=0;k<14;k++)B(k%2?pale:white,e*(X+.07),.5+k*.32,0,.1,.29,D+.2,'arch30-timber');
  for(const f of F){B(teal,f.u,3.18,Z+.3,f.w+.5,.12,.3,'arch30-timber');B(white,f.u,.45,Z+.2,f.w+1.1,.9,.14,'arch30-timber');for(const e of[-1,1])B(teal,f.u+e*(f.w/2+.34),1.9,Z+.27,.46,2.3,.07,'arch30-timber');}
  for(const e of[-1,1])B(teal,e*(dw/2+.55),1.65,Z+.28,.4,3.3,.5,'arch30-timber');B(teal,0,3.23,Z+.62,dw+3,.2,1.75,'arch30-timber');
  B(wood,0,0,Z+2.45,W+.2,.08,4.3,'arch30-timber');for(let i=0;i<Math.round(W/.5);i++)B('#a9834f',-X+.25+i*.5,.043,Z+2.45,.04,.006,4.3,'arch30-timber');
  for(const e of[-1,1]){for(let i=0;i<=6;i++){const x=e*(1.9+i*1.85);P('cylinder',white,x,.56,Z+4.5,.14,1.08,.14,'arch30-timber');P('sphere',white,x,1.12,Z+4.5,.2,.2,.2,'arch30-timber');}
   B(sand,e*7.45,.92,Z+4.5,11.1,.05,.05,'matte');B(sand,e*7.45,.56,Z+4.5,11.1,.05,.05,'matte');for(let i=0;i<3;i++)P('cylinder',white,e*X,.56,Z+.9+i*1.8,.14,1.08,.14,'arch30-timber');B(sand,e*X,.92,Z+2.7,.05,.05,3.6,'matte');}
  /* each umbrella stands on a post at the corner of its table and reaches over it, so nothing stands between you and your plate */[-10,-6,6,10].forEach((x,i)=>{P('cylinder','#d9d4c8',x+.74,1.55,Z+3.44,.07,3.1,.07);P('cylinder','#d9d4c8',x+.74,.03,Z+3.44,.5,.06,.5);B('#d9d4c8',x+.37,3.08,Z+3.07,.06,.06,1.1,'arch30-metal',PI/4);P('cone',i%2?teal:white,x,3.05,Z+2.7,2.9,.7,2.9,'matte');P('cone',i%2?white:teal,x,3.32,Z+2.7,1.4,.4,1.4,'matte');});
  for(let i=0;i<30;i++)P('sphere','#ffe9b8',-X+.6+i*(W-1.2)/29,3.7-.14*Math.sin(i/29*PI*4),Z+4.5,.11,.11,.11,'glow');for(const x of[-X+.2,X-.2,-1.9,1.9])B(white,x,1.9,Z+4.5,.1,3.8,.1,'arch30-timber');
  // the pelican on its post beside the way in, and three surfboards against the wall
  P('cylinder','#8a6a44',px,.9,pz,.36,1.8,.36,'arch30-timber');P('sphere','#f4f1ea',px,2.2,pz,.6,.72,.5,'matte');P('sphere','#f4f1ea',px+.1,2.76,pz,.3,.32,.3,'matte');P('cone','#f2b84a',px+.52,2.72,pz,.2,.7,.16,'matte',0,0,-PI/2);P('sphere','#f2b84a',px+.34,2.57,pz,.32,.22,.14,'matte');for(const e of[-1,1])P('sphere','#d9d4c8',px-.05,2.15,pz+e*.26,.5,.5,.12,'matte');
  [coral,'#f2c230',teal].forEach((c,i)=>P('sphere',c,-X+1.6+i*.8,1.5,Z+.5,.56,2.8,.12,'arch30-panel',0,0,.05*(i-1)));
 }else{
  const stucco=p.look.wall,tile='#b5532f',tileDark='#9c4526',green='#2f5a3d',wood='#6b4a2f',cream='#f6f1e6',red='#b3261e';
  // A low tiled roof with deep eaves and a row of round tiles along the edge.
  P('roof',tile,0,H+.05,0,D+2.6,2.3,W+2.6,'arch30-roof',0,PI/2);B(tileDark,0,H+.02,Z+1.26,W+2.6,.14,.2,'arch30-roof');B(tileDark,0,H+.02,-Z-1.26,W+2.6,.14,.2,'arch30-roof');
  for(let i=0;i<Math.round((W+2.4)/.52);i++)P('cylinder',i%2?tile:tileDark,-X-1.1+i*.52,H+.14,Z+1.2,.26,.5,.26,'arch30-roof',PI/2);for(let i=0;i<9;i++)B('#c9b79a',-X+1.4+i*(W-2.8)/8,H-.3,Z+.66,.2,.26,.9,'arch30-timber');
  B('#c9b79a',0,.3,Z+.12,W+.3,.6,.2,'arch30-stone');for(const e of[-1,1])B('#c9b79a',e*(X+.08),.3,0,.2,.6,D+.3,'arch30-stone');
  // Windows: green shutters, a flower box of geraniums, a striped awning.
  for(const f of F){for(const e of[-1,1]){B(green,f.u+e*(f.w/2+.4),1.85,Z+.27,.6,2.3,.07,'arch30-timber');for(let k=0;k<6;k++)B('#26492f',f.u+e*(f.w/2+.4),.95+k*.37,Z+.31,.48,.05,.02,'arch30-timber');}
   B(wood,f.u,.72,Z+.42,f.w*.9,.2,.34,'arch30-timber');for(let i=0;i<11;i++)P('sphere',i%3===1?'#3d6b3a':'#d8382c',f.u-f.w*.42+i*f.w*.084,.92,Z+.44,.3,.26,.3,'foliage');
   const n=Math.round((f.w+.3)/.5),sw=(f.w+.3)/n;for(let i=0;i<n;i++){const c=[green,cream,red][i%3],ax=f.u-(f.w+.3)/2+(i+.5)*sw;P('box',c,ax,2.86,Z+.84,sw,.05,1.3,'matte',.42);B(c,ax,2.5,Z+1.44,sw,.18,.04,'matte');}}
  // The door: a brick arch, a lamp each side, pots of rosemary.
  for(const e of[-1,1]){B('#a5563f',e*(dw/2+.55),1.65,Z+.28,.42,3.3,.5,'arch30-brick');B('#1f2a2b',e*(dw/2+.55),2.5,Z+.6,.18,.4,.18,'arch30-metal');P('sphere','#ffe2a6',e*(dw/2+.55),2.5,Z+.68,.15,.28,.12,'glow');
   P('cylinder','#b86a4c',e*2.55,.36,Z+1,.8,.72,.8,'arch30-roof');P('cylinder','#3d6b3a',e*2.55,1.1,Z+1,.5,.9,.5,'foliage');P('sphere','#3d6b3a',e*2.55,1.7,Z+1,.62,.6,.62,'foliage');}
  B('#a5563f',0,3.4,Z+.3,dw+1.5,.36,.56,'arch30-brick');B(cream,0,3.23,Z+.62,dw+3,.2,1.75,'arch30-timber');
  // The pergola over the front terrace: posts, beams, slats, vines, a string of lights; two tables under it.
  for(const x of[-12.2,-7.4,-2.6,2.6,7.4,12.2]){B(wood,x,1.55,Z+4.5,.24,3.1,.24,'arch30-timber');B(wood,x,3.16,Z+2.5,.16,.2,4.6,'arch30-timber');}
  B(wood,0,3.02,Z+4.5,W+.2,.2,.2,'arch30-timber');for(let i=0;i<9;i++)B(wood,0,3.3,Z+.7+i*.5,W+.6,.07,.1,'arch30-timber');
  for(let i=0;i<46;i++){const x=-X+((i*53)%(W*10))/10,z=Z+.8+((i*29)%40)/10;P('sphere',i%4===0?'#5a8a3f':i%4===1?'#3d6b3a':'#4a7a40',x,3.42+((i*7)%5)*.03,z,.9,.34,.8,'foliage');if(i%9===0)for(let k=0;k<5;k++)P('sphere','#5a2a6a',x,3.2-k*.09,z,.13-k*.012,.12,.13-k*.012,'foliage');}
  for(let i=0;i<32;i++){const x=-X+.4+i*(W-.8)/31;P('sphere','#ffdf9a',x,2.84-.1*Math.sin(i/31*PI*5),Z+4.5,.11,.11,.11,'glow');}
  for(const x of[-9.2,9.2]){const z=Z+2.5;B(cream,x,.775,z,1.06,.012,1.06,'cloth');for(let i=0;i<5;i++)for(let j=0;j<5;j++)if((i+j)%2===0)B('#c8242b',x-.5+(i+.5)*.2,.783,z-.5+(j+.5)*.2,.2,.004,.2,'cloth');B('#9a6b3f',x,.745,z,1,.05,1,'arch30-timber');P('cylinder',wood,x,.37,z,.1,.74,.1,'arch30-timber');P('cylinder',wood,x,.025,z,.56,.05,.56,'arch30-timber');
   for(const[ex,ez]of[[-.82,0],[.82,0],[0,-.82],[0,.82]]){B('#c9a25a',x+ex,.445,z+ez,.42,.05,.42,'arch30-timber');for(const a of[-.18,.18])for(const b of[-.18,.18])B(wood,x+ex+a,.22,z+ez+b,.04,.44,.04,'arch30-timber');B(wood,x+ex*1.26,.72,z+ez*1.26,ex?.04:.4,.5,ex?.4:.04,'arch30-timber');}
   P('cylinder','#2f5a3d',x,.87,z,.08,.18,.08,'arch30-glass');P('cylinder','#f6f1e6',x,1.02,z,.022,.12,.022,'arch30-panel');P('sphere','#ffdf9a',x,1.11,z,.035,.06,.035,'glow');}
  // A low wall with a tile top round the terrace, open in the middle.
  for(const e of[-1,1]){B(stucco,e*8.4,.34,Z+4.95,9.6,.68,.34,'arch30-concrete');B(tile,e*8.4,.72,Z+4.95,9.8,.08,.46,'arch30-roof');}
  // The hanging sign bracket by the door.
  B('#1f2a2b',dw/2+2.4,3.5,Z+1.2,.06,.06,1.9,'arch30-metal');B('#1f2a2b',dw/2+2.4,3.2,Z+2.05,.04,.5,.04,'arch30-metal');
 }
}
function signs(scene,s,paint,hang){
 const p=place(s.id);if(!p||p.existing)return;const Z=p.D/2,H=p.H,serif='Georgia,"Times New Roman",serif',script='"Brush Script MT","Segoe Script","Lucida Handwriting",cursive',round='"Trebuchet MS","Segoe UI",sans-serif',space=(x,v)=>{try{x.letterSpacing=v;}catch(e){}};
 if(p.kind==='steak'){
  // the name on a board across the front of the porch, and what the place is in gold letters on the boards each side
  hang(paint(1280,220,(x,w,h)=>{x.fillStyle='#1d1512';x.fillRect(0,0,w,h);x.strokeStyle='#c9a24a';x.lineWidth=6;x.strokeRect(12,12,w-24,h-24);x.lineWidth=2;x.strokeRect(24,24,w-48,h-48);x.fillStyle='#c9a24a';x.font='700 136px '+serif;space(x,'12px');x.fillText('EMBER & OAK',w/2,116);}),0,3.46,Z+4.9,6.2,1.06);
  for(const[t,e]of[['STEAKHOUSE',-1],['OAK-FIRED GRILL',1]])hang(paint(1024,128,(x,w,h)=>{x.fillStyle='#c9a24a';x.font='600 76px '+serif;space(x,'16px');x.fillText(t,w/2,h/2+4);}),e*8.3,4.3,Z+.3,6.2,.78,0,{clear:true});
  hang(paint(512,512,(x,w,h)=>{x.fillStyle='#1d1512';x.beginPath();x.arc(w/2,h/2,250,0,7);x.fill();x.strokeStyle='#c9a24a';x.lineWidth=10;x.beginPath();x.arc(w/2,h/2,232,0,7);x.stroke();
   /* a flame over an oak leaf */x.fillStyle='#c9a24a';x.beginPath();x.moveTo(w/2,96);x.bezierCurveTo(w/2+120,220,w/2+70,330,w/2,372);x.bezierCurveTo(w/2-70,330,w/2-120,220,w/2,96);x.fill();x.fillStyle='#1d1512';x.beginPath();x.moveTo(w/2+6,210);x.bezierCurveTo(w/2+62,280,w/2+34,340,w/2,356);x.bezierCurveTo(w/2-34,340,w/2-52,290,w/2+6,210);x.fill();
   x.fillStyle='#c9a24a';x.font='700 54px '+serif;space(x,'6px');x.fillText('E & O',w/2,432);}),0,4.66,Z+4.88,1.2,1.2,0,{clear:true});
 }else if(p.kind==='casual'){
  hang(paint(1536,352,(x,w,h)=>{x.fillStyle='#f4f8f8';x.beginPath();x.roundRect(8,8,w-16,h-16,30);x.fill();x.lineWidth=12;x.strokeStyle='#1f7f8a';x.stroke();x.fillStyle='#1f2a33';x.font='italic 700 170px '+script;x.fillText('The Salty Pelican',w/2,140);x.fillStyle='#e8604a';x.font='800 40px '+round;space(x,'10px');x.fillText('SEASIDE GRILL  \u{B7}  FISH  \u{B7}  BURGERS',w/2,286);}),0,4.05,Z+.3,8.8,2.02,0,{clear:true});
 }else{
  hang(paint(1536,360,(x,w,h)=>{x.fillStyle='#f6f1e6';x.beginPath();x.roundRect(8,8,w-16,h-16,60);x.fill();x.lineWidth=10;x.strokeStyle='#2f5a3d';x.stroke();x.lineWidth=4;x.strokeStyle='#b3261e';x.beginPath();x.roundRect(28,28,w-56,h-56,44);x.stroke();
   x.fillStyle='#b3261e';x.font='italic 700 190px '+script;x.fillText("Nonna Rosa's",w/2,150);x.fillStyle='#2f5a3d';x.font='800 40px '+round;space(x,'10px');x.fillText('TRATTORIA  \u{B7}  WOOD-OVEN PIZZA  \u{B7}  PASTA',w/2,292);}),0,3.9,Z+4.66,7.2,1.69,0,{clear:true});
  hang(paint(512,512,(x,w,h)=>{x.fillStyle='#2f5a3d';x.beginPath();x.arc(w/2,h/2,250,0,7);x.fill();x.fillStyle='#f6f1e6';x.beginPath();x.arc(w/2,h/2,226,0,7);x.fill();
   /* a tomato with a leaf */x.fillStyle='#c8242b';x.beginPath();x.ellipse(w/2,h/2-10,112,100,0,0,7);x.fill();x.fillStyle='#2f7d4f';for(let i=0;i<5;i++){x.save();x.translate(w/2,h/2-104);x.rotate(i*TAU/5);x.beginPath();x.ellipse(0,-30,13,36,0,0,7);x.fill();x.restore();}
   x.fillStyle='#b3261e';x.font='italic 700 82px '+script;x.fillText('Nonna',w/2,402);x.fillStyle='#2f5a3d';x.font='800 30px '+round;space(x,'5px');x.fillText('DAL 1962',w/2,460);}),s.doorWidth/2+2.4,2.3,Z+2.05,1.3,1.3,0,{both:true,gap:.03,clear:true});
 }
}
return{PLACES,DISHES,STYLE,place,dish,services,layout,furnish,solids,palette,interior,dress,signs,fast,fastDish,fastFurnish,fastInterior};
});
