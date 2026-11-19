
/* PLATDO City 6-7 convenience stores (V5.2).
 * - Five stores of one chain: the same name, sign, colours and stock, with small differences outside and one
 *   item of its own in each. Service type 'six-seven' (the door ring from V4.91 listens for it).
 * - Inside: checkout with a register and one cashier, two long snack shelves, a candy stand, a wall of drink
 *   fridges, a drinks chest and a hot-food counter. No customers, wide aisles.
 * - Shopping at the cashier: item browser with quantities (plus, minus or typed), a cart and one checkout.
 *   What you buy goes into the food bag.
 * - Robbery (single player for now): aim a weapon at the cashier and they hand over a bag of $220 to $500;
 *   or shoot the cashier and empty the register yourself. The cashier may hit a panic button, which is the
 *   only thing that calls the police for the robbery itself. Afterwards the store is closed, locks once you are
 *   outside, and resets with a new cashier when you are far away. Each store keeps its own state.
 * The first half of the file is shared with the multiplayer host; from "game only" down it needs a page. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;root.CitySixSeven=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const W=20,D=16,H=4.4,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const Eat=()=>root.CityRestaurants||(typeof require==='function'?(()=>{try{return require('./restaurants.js');}catch(e){return null;}})():null);
const SITES=[['six-seven-1',-200,337,'Old Quay'],['six-seven-2',-200,-83,'Glassline'],['six-seven-3',-560,157,'Redbrick Heights'],/* V7.0: on the front row */['six-seven-4',-196,696,'Palmstrand'],['six-seven-5',990,-218,'Eastbank']];
const GREEN='#0b7a4b',ORANGE='#f28c28',RED='#d83a34',WHITE='#fbfbf7';
const LOOK={wall:'#eef0ea',stone:'#d9ddd4',frame:GREEN,roof:'#8e9794',accent:ORANGE,floor:'#d8d5c9',room:'#f4f3ee'};
const I=(id,name,about,price,hunger,thirst,icon)=>({id,name,about,price,hunger,thirst,icon,drink:thirst>hunger});
const COMMON=[
 I('six-chips','Sea Salt Chips','A crinkly bag of salted chips.',2,12,0,'\u{1F954}'),I('six-pretzels','Twist Pretzels','Crunchy, salty twists.',2,11,0,'\u{1F968}'),I('six-candy','Choco Crunch Bar','Chocolate over crisped rice.',1,8,0,'\u{1F36B}'),I('six-gummies','Sour Gummy Worms','Sour first, sweet after.',2,7,0,'\u{1F36C}'),
 I('six-jerky','Peppered Jerky','A strip of dried beef.',4,20,0,'\u{1F953}'),I('six-hotdog','Roller Hot Dog','Straight off the roller grill.',3,26,0,'\u{1F32D}'),I('six-taquito','Cheese Taquito','Rolled, fried and hot.',2,18,0,'\u{1F32F}'),I('six-sandwich','Deli Sandwich','Ham and cheese, wrapped this morning.',4,32,0,'\u{1F96A}'),
 I('six-cupcakes','Snack Cupcakes','Two to a pack.',2,13,0,'\u{1F9C1}'),I('six-water','Spring Water','A cold bottle.',1,0,50,'\u{1F4A7}'),I('six-cola','Cola Bottle','Half a litre, ice cold.',2,0,40,'\u{1F964}'),I('six-energy','Bolt Energy Drink','Loud can, lots of sugar.',3,2,34,'\u{26A1}'),
 I('six-icedcoffee','Canned Iced Coffee','Sweet milk coffee in a can.',3,3,32,'\u{2615}'),I('six-slush','Brain Freeze Slush','Blue, icy and far too big.',2,2,44,'\u{1F9CA}')];
const SPECIAL={'six-seven-1':I('six-fishcake','Quay Fish Cake','A warm fish cake from the hot case.',3,24,0,'\u{1F41F}'),'six-seven-2':I('six-sushi','Tray of Sushi Rolls','Eight rolls with soy sauce.',5,34,0,'\u{1F363}'),'six-seven-3':I('six-pie','Hand Pie','Apple, still warm.',3,22,0,'\u{1F967}'),'six-seven-4':I('six-chili','Cup of Chili','Thick and spicy.',4,30,4,'\u{1F963}'),'six-seven-5':I('six-trailmix','Trail Mix','Nuts, raisins and chocolate.',3,19,0,'\u{1F95C}')};
const site=id=>SITES.find(s=>s[0]===id)||null,index=id=>SITES.findIndex(s=>s[0]===id);
const menu=id=>[...COMMON,...(SPECIAL[id]?[SPECIAL[id]]:[])];
{const R=Eat();if(R?.register)R.register('six-seven',[...COMMON,...Object.values(SPECIAL)]);}
// A store as the delivery app and the shop-front code see it.
const brand=id=>{const s=site(id);return s?{id,name:'6-7',kind:'store',tag:'SNACKS \u{B7} DRINKS \u{B7} OPEN 24 HOURS',place:s[3],look:{...LOOK,accent:GREEN},menu:menu(id)}:null;};
const services=()=>SITES.map(s=>[s[0],'6-7','six-seven',s[1],s[2],W,D,H]);
// The inside. Everything keeps clear of the way in from the door and of the aisle to the counter.
function furnish(s,furn){
 if(!site(s.id))return;
 furn('counter',-7.2,2.5,1.3,1.05,4.6,GREEN);furn('shelf',3,1.6,7,1.7,1.1,'#d9ddd4');furn('shelf',3,-1.5,7,1.7,1.1,'#d9ddd4');furn('display',6.6,5.2,2.4,1.3,.8,ORANGE);furn('counter',-6.3,-7,6.4,1,1.2,'#aeb5b2');
 s.staff={x:s.x-8.7,y:s.y,z:s.z+2.5};s.interaction={x:s.x-5.6,y:s.y,z:s.z+2.5};s.register={x:s.x-8.6,y:s.y,z:s.z+4.1};s.mapLabel='6-7 convenience store';s.signSubtitle='OPEN 24 HOURS';s.sixSeven=site(s.id)[3];
}
// Solid pieces, relative to the building: [key, x, base y, z, width, height, depth, material].
function solids(id,s){
 const n=index(id);if(n<0)return[];const Z=D/2,out=[],add=(k,x,y,z,w,h,d,m)=>out.push([k,x,y,z,w,h,d,m||'metal']),side=n%2?1:-1;
 add('fridges',3.15,0,-Z+.78,12.3,2.3,1.05);add('chest',W/2-.85,0,1.2,1.1,1,4.6);
 add('pole',side*(W/2+1.3),0,Z+4.6,.34,7.4,.34);add('bin',2.75,0,Z+.9,.55,.9,.55);
 if(n%2===0)add('ice',-side*(W/2-2.6),0,Z+.72,2.2,1.4,.9);else add('propane',-side*(W/2-2.2),0,Z+.62,1.7,1.5,.75);
 for(const x of[-8,-5.4,5.4,8])add('bollard'+x,x,0,Z+2.3,.22,.95,.22);
 return out;
}
// ---- game only: the outside and the fittings the furniture list cannot draw -----------------------------------
const palette=id=>site(id)?{...LOOK,family:'six-seven'}:null;
function dress(scene,bt,s,p,api,bays){
 const n=index(s.id);if(n<0)return;const Z=D/2,dw=s.doorWidth,F=bays(s),side=n%2?1:-1;
 const B=(c,x,y,z,w,h,d,kind,ry)=>api.box(c,x,y,z,w,h,d,kind||'arch30-concrete',ry||0);
 const P=(shape,c,x,y,z,w,h,d,kind,rx,ry,rz)=>api.part(shape,c,x,y,z,w,h,d,rx||0,ry||0,rz||0,kind||'arch30-metal');
 // The chain's front: a white band across the top with three stripes, green door posts and a flat hood.
 B(WHITE,0,4.0,Z+.16,W+.5,1.2,.26,'arch30-panel');for(const[c,y]of[[ORANGE,3.5],[GREEN,3.66],[RED,3.82]])B(c,0,y,Z+.31,W+.52,.15,.05,'arch30-panel');B(GREEN,0,4.64,Z+.18,W+.6,.12,.34,'arch30-metal');
 for(const e of[-1,1]){B(WHITE,e*(W/2+.03),4.0,Z-1.4,.26,1.2,3.2,'arch30-panel');for(const[c,y]of[[ORANGE,3.5],[GREEN,3.66],[RED,3.82]])B(c,e*(W/2+.17),y,Z-1.4,.05,.15,3.2,'arch30-panel');}
 for(const e of[-1,1])B(GREEN,e*(dw/2+.55),1.65,Z+.28,.38,3.3,.48,'arch30-metal');B(GREEN,0,3.23,Z+.62,dw+3,.2,1.75,'arch30-metal');B(ORANGE,0,3.1,Z+1.5,dw+3,.07,.05,'arch30-panel');
 for(const f of F){B(GREEN,f.u,.42,Z+.07,f.w+.3,.84,.14,'arch30-panel');B('#dfe3dc',f.u,.86,Z+.09,f.w+.36,.06,.2,'arch30-stone');}
 B('#2f3a3d',0,.03,Z+1.1,dw+.6,.05,1.5,'matte');
 // Yellow posts in front of the glass, a bin by the door.
 for(const x of[-8,-5.4,5.4,8]){P('cylinder','#f2c230',x,.475,Z+2.3,.2,.95,.2);P('sphere','#f2c230',x,.95,Z+2.3,.2,.12,.2);P('cylinder','#2f3a3d',x,.6,Z+2.3,.21,.1,.21);}
 P('cylinder','#3f4d51',2.75,.45,Z+.9,.52,.9,.52);P('cylinder','#2a3336',2.75,.92,Z+.9,.56,.06,.56);
 // The sign pole at one corner: a lit box with the name, and a smaller box under it.
 const px=side*(W/2+1.3),pz=Z+4.6;P('cylinder','#4a5558',px,3.7,pz,.3,7.4,.3);B(WHITE,px,6.35,pz,3.1,1.9,.42,'arch30-panel');B(GREEN,px,7.36,pz,3.2,.14,.5,'arch30-metal');B(GREEN,px,5.34,pz,3.2,.14,.5,'arch30-metal');B(ORANGE,px,4.72,pz,2.5,.7,.36,'arch30-panel');P('cylinder','#39464a',px,.12,pz,.8,.24,.8);
 // An ice chest on one side of the door or a gas-bottle cage on the other, by store.
 if(n%2===0){const x=-side*(W/2-2.6),z=Z+.72;B('#f4f6f5',x,.7,z,2.2,1.4,.9,'arch30-panel');B('#2f6fb5',x,1.45,z,2.26,.1,.96,'arch30-metal');for(const e of[-1,1])B('#dfe6ea',x+e*.55,.75,z+.46,.95,1.05,.04,'arch30-metal');for(const e of[-1,1])P('cylinder','#8a9498',x+e*.1,.8,z+.5,.04,.5,.04);}
 else{const x=-side*(W/2-2.2),z=Z+.62;B('#59666a',x,.06,z,1.7,.12,.75,'arch30-metal');B('#59666a',x,1.47,z,1.7,.08,.75,'arch30-metal');for(const e of[-1,-.33,.33,1])B('#7b878b',x+e*.82,.76,z+.36,.05,1.4,.05,'arch30-metal');for(let i=0;i<4;i++)B('#7b878b',x,.3+i*.36,z+.36,1.7,.03,.03,'arch30-metal');for(const ix of[-.5,0,.5])for(const y of[.4,1.02]){P('cylinder','#e9ecea',x+ix,y,z,.32,.42,.32);P('cylinder','#b5412f',x+ix,y+.25,z,.14,.1,.14);}}
 // Roof plant, different on every store.
 B('#b9c0bd',4-n*1.3,H+.78,-2.4,2.3,.95,1.6,'arch30-metal');B('#8e9794',4-n*1.3,H+1.28,-2.4,1.5,.08,1,'arch30-metal');if(n%3===0)P('cylinder','#aab2ae',-5,H+.7,1.5,.9,.8,.9);if(n%2)B('#b9c0bd',-6.5,H+.6,-4,1.4,.6,1.4,'arch30-metal');
 // ---- inside ----
 // The fridge wall: a dark cabinet with six glass doors, shelves and rows of bottles and cans.
 const fz=-Z+.78,cols=['#e6483d','#2f8fd6','#f2c230','#3aa861','#f28c28','#7d5bd0','#f4f4f0','#17a5a0'];
 /* the cabinet is a shallow box at the back; the lining, shelves, bottles and glass stand in front of it, all inside the solid piece */
 B('#2b3437',3.15,1.15,fz-.3,12.3,2.3,.45,'arch30-metal');B('#2b3437',3.15,.09,fz+.1,12.3,.18,.85,'arch30-metal');B('#f5f7f6',3.15,2.42,fz+.05,12.4,.26,1.1,'arch30-panel');B(GREEN,3.15,2.6,fz+.05,12.46,.1,1.14,'arch30-metal');for(const e of[-1,1])B('#2b3437',3.15+e*6.1,1.15,fz+.1,.1,2.3,.85,'arch30-metal');
 for(let i=0;i<6;i++){const x=3.15-5.125+i*2.05;/* a lit white lining behind the bottles */B('#f4f8f8',x,1.2,fz-.06,1.96,2.0,.03,'arch30-interior');B('#fffdf0',x,2.2,fz+.2,1.7,.05,.3,'glow');for(let r=0;r<4;r++){B('#aeb7ba',x,.3+r*.5,fz+.2,1.9,.03,.44,'arch30-metal');for(let k=0;k<6;k++)P('cylinder',cols[(i*3+r*5+k)%cols.length],x-.75+k*.3,.44+r*.5,fz+.26,.2,.24,.2,'matte');}
  /* open-fronted coolers: the game's glass is too cloudy to see the bottles through */B('#59666a',x+.86,1.2,fz+.52,.05,.8,.05,'arch30-metal');for(const e of[-1,1])B('#3a4649',x+e*1.0,1.2,fz+.46,.08,2.05,.1,'arch30-metal');}
 // Stock on the two long shelves, both faces, three levels: boxes, bags and tubs in the chain's packaging colours.
 for(const gz of[1.6,-1.5])for(let level=0;level<3;level++)for(const face of[-1,1])for(let k=0;k<17;k++){const q=(k*7+level*5+(face>0?3:0)+(gz>0?1:4))%cols.length,tall=(k+level)%3===0,ww=tall?.24:.3,hh=tall?.36:.22,x=3-3.2+k*.4,y=.12+level*.527+hh/2,z=gz+face*.3;if((k+level*2+(face>0?1:0))%11===0)continue;B(cols[q],x,y,z,ww,hh,.2,'matte');if(!tall)B('#ffffff',x,y+.02,z+face*.101,ww*.7,hh*.4,.005,'matte');}
 // Candy on the stand by the window, and price strips along the shelf edges.
 for(let k=0;k<8;k++)for(let r=0;r<3;r++)B(cols[(k+r*3)%cols.length],6.6-.98+k*.28,.2+r*.42,5.2+.12,.2,.14,.3,'matte');
 for(const gz of[1.6,-1.5])for(let level=0;level<3;level++)for(const face of[-1,1])B(WHITE,3,.11+level*.527,gz+face*.56,6.8,.05,.01,'matte');
 // Ceiling lights in three rows.
 for(const lz of[-4.6,-.2,4.2])for(const lx of[-6.4,-2.2,2,6.2])B('#fffbe8',lx,H-.16,lz,2.6,.05,.42,'glow');
 // The open drinks chest along the right wall.
 const cx=W/2-.85;B('#f4f6f5',cx,.5,1.2,1.1,1,4.6,'arch30-panel');B(RED,cx-.56,.72,1.2,.03,.36,4.6,'arch30-panel');B('#bcd9e6',cx,.96,1.2,.9,.06,4.4,'arch30-interior');for(let i=0;i<13;i++)for(const e of[-.22,.22])P('cylinder',cols[(i+(e>0?3:0))%cols.length],cx+e,1.1,1.2-2.05+i*.34,.2,.26,.2,'matte');
 // The checkout: register, card reader, a tray of lighters and a lottery stand.
 const kx=-7.2;B('#22292b',kx,1.24,3.9,.5,.36,.46,'arch30-metal');B('#111618',kx-.1,1.56,3.9,.42,.3,.04,'arch30-metal',.25);B('#3fd08b',kx-.1,1.56,3.925,.36,.22,.02,'glow',.25);B('#2f3a3d',kx+.3,1.1,3.2,.14,.06,.2,'arch30-metal');B(ORANGE,kx,1.16,1.3,.7,.2,.5,'arch30-panel');for(let i=0;i<5;i++)B(cols[i],kx-.2+i*.1,1.3,1.3,.07,.12,.3,'matte');B(WHITE,kx+.1,1.42,.5,.5,.7,.3,'arch30-panel');
 // The hot-food counter at the back: a roller grill, two coffee urns and cups.
 const hx=-6.3,hz=-7;B('#3b4649',hx-1.8,1.14,hz,1.5,.26,.8,'arch30-metal');for(let i=0;i<6;i++)P('cylinder','#b5532f',hx-1.8,1.3,hz-.3+i*.12,.09,1.3,.09,'matte',0,0,Math.PI/2);B('#cfe6f2',hx-1.8,1.5,hz+.3,1.5,.5,.03,'glass');
 for(const e of[.2,1.1]){P('cylinder','#bfc6c4',hx+e,1.38,hz,.5,.74,.5);P('cylinder','#22292b',hx+e,1.78,hz,.4,.08,.4);B('#22292b',hx+e,1.12,hz+.3,.1,.1,.14,'arch30-metal');}
 for(let i=0;i<3;i++)P('cylinder',WHITE,hx+2.2+i*.24,1.2,hz+.1,.16,.36,.16,'matte');B(RED,hx,2.3,hz-.52,6.2,.5,.06,'arch30-panel');
 // A door mat inside.
 B('#3b4548',0,.02,Z-1.2,dw+.4,.03,1.6,'matte');
}
function signs(scene,s,paint,hang){
 const n=index(s.id);if(n<0)return;const Z=D/2,side=n%2?1:-1,heavy='Impact,"Arial Black",sans-serif',round='"Trebuchet MS","Segoe UI",sans-serif';
 /* V5.8: the chain's new logo (the user's own design, redrawn here as shapes from their picture): a slanted 6 and 7,
  * each filled red on the left to orange on the right, with a thick dark green outline, a round hole in the 6, and
  * a solid dark green bar between them. It replaces the old lettering in orange, green and red. The numbers below
  * are the picture's own pixels; the logo is 1877 wide and 1040 tall there. k=1 draws it 172 pixels tall. */
 const INK='#2f6419',logo=(x,w,h,cx,cy,k)=>{const s=172*k/1040,ox=cx-1877*s/2,oy=cy-1040*s/2,X=v=>ox+(v-55)*s,Y=v=>oy+(v-322)*s,blend=(a,b)=>{const g=x.createLinearGradient(X(a),0,X(b),0);g.addColorStop(0,'#ff3a33');g.addColorStop(1,'#ff914d');return g;};
  x.save();x.lineJoin='miter';x.miterLimit=6;x.lineWidth=47*s;x.strokeStyle=INK;
  x.beginPath();x.moveTo(X(453),Y(346));x.lineTo(X(776),Y(346));x.lineTo(X(508),Y(655));x.bezierCurveTo(X(640),Y(665),X(838),Y(790),X(838),Y(1000));x.bezierCurveTo(X(838),Y(1210),X(690),Y(1339),X(468),Y(1339));x.bezierCurveTo(X(240),Y(1339),X(77),Y(1200),X(77),Y(1000));x.bezierCurveTo(X(77),Y(850),X(130),Y(740),X(226),Y(617));x.closePath();
  x.moveTo(X(578),Y(1000));x.arc(X(460),Y(1000),118*s,0,Math.PI*2,true);x.closePath();x.fillStyle=blend(77,838);x.fill('evenodd');x.stroke();
  x.fillStyle=INK;x.fillRect(X(871),Y(781),345*s,163*s);
  x.beginPath();x.moveTo(X(1139),Y(346));x.lineTo(X(1909),Y(346));x.lineTo(X(1909),Y(471));x.lineTo(X(1403),Y(1339));x.lineTo(X(1093),Y(1339));x.lineTo(X(1528),Y(583));x.lineTo(X(1139),Y(583));x.closePath();x.fillStyle=blend(1139,1909);x.fill();x.stroke();
  x.restore();};
 // over the door
 hang(paint(768,320,(x,w,h)=>{x.fillStyle=WHITE;x.beginPath();x.roundRect(8,8,w-16,h-16,46);x.fill();x.lineWidth=12;x.strokeStyle=INK;x.stroke();logo(x,w,h,w/2,h/2-22,1.1);x.fillStyle=INK;x.font='800 40px '+round;x.fillText('OPEN 24 HOURS',w/2,h-52);}),0,4.03,Z+.34,2.7,1.12);
 for(const e of[-1,1])hang(paint(1024,128,(x,w,h)=>{x.fillStyle=GREEN;x.font='800 66px '+round;try{x.letterSpacing='10px';}catch(err){}x.fillText(e<0?'SNACKS  \u{B7}  DRINKS':'HOT FOOD  \u{B7}  ICE',w/2,h/2);}),e*6.1,4.2,Z+.3,5.6,.7,0,{clear:true});
 // the pole sign, readable from both sides
 hang(paint(512,320,(x,w,h)=>{x.fillStyle=WHITE;x.fillRect(0,0,w,h);logo(x,w,h,w/2,h/2,1.05);}),side*(W/2+1.3),6.35,Z+4.6,2.9,1.8,0,{both:true,gap:.22});
 hang(paint(512,144,(x,w,h)=>{x.fillStyle=ORANGE;x.fillRect(0,0,w,h);x.fillStyle='#fff';x.font='900 84px '+heavy;x.fillText('OPEN 24 HRS',w/2,h/2+4);}),side*(W/2+1.3),4.72,Z+4.6,2.4,.66,0,{both:true,gap:.19});
 /* V6.7: the player's own poster on the outside of the front window, right beside the entrance doors of every store. The picture comes from the page (window.CitySixSevenPoster), so the multiplayer host's copy of this file carries no picture. */
 if(root.CitySixSevenPoster){let tex=null;tex=paint(600,800,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);const im=new Image();im.onload=()=>{x.drawImage(im,0,0,w,h);if(tex)tex.needsUpdate=true;};im.src=root.CitySixSevenPoster;});hang(tex,s.doorWidth/2+1.55,1.8,Z+.13,1.2,1.6);}
 // posters in the windows
 const posters=[['COLD DRINKS','2 FOR $3','#2f8fd6'],['HOT DOGS','FRESH OFF THE ROLLER','#d83a34'],['SLUSH','BRAIN FREEZE  $2','#17a5a0'],['SNACKS','CHIPS \u{B7} CANDY \u{B7} JERKY','#f28c28']];
 for(const e of[-1,1]){const q=posters[(n+(e>0?1:0))%posters.length];hang(paint(384,512,(x,w,h)=>{x.fillStyle=q[2];x.fillRect(0,0,w,h);x.fillStyle='#fff';x.fillRect(18,18,w-36,h-36);x.fillStyle=q[2];x.font='900 78px '+heavy;const words=q[0].split(' ');words.forEach((t,i)=>x.fillText(t,w/2,150+i*84));x.fillStyle='#22292b';x.font='800 30px '+round;x.fillText(q[1],w/2,h-90);logo(x,w,h,w/2,h-180,.32);}),e*7.6,1.9,Z+.12,1.05,1.4);}
 if(n%2===0)hang(paint(384,160,(x,w,h)=>{x.fillStyle='#2f6fb5';x.fillRect(0,0,w,h);x.fillStyle='#fff';x.font='900 120px '+heavy;x.fillText('ICE',w/2,h/2+6);}),-side*(W/2-2.6),1.05,Z+1.19,1.5,.6);
 // inside
 hang(paint(1024,128,(x,w,h)=>{x.fillStyle='#fff';x.font='900 84px '+heavy;try{x.letterSpacing='8px';}catch(err){}x.fillText('HOT FOOD  \u{B7}  COFFEE',w/2,h/2+4);}),-6.3,2.3,-7.48,5.6,.42,0,{clear:true});
 hang(paint(1024,128,(x,w,h)=>{x.fillStyle=GREEN;x.fillRect(0,0,w,h);x.fillStyle='#fff';x.font='900 92px '+heavy;try{x.letterSpacing='10px';}catch(err){}x.fillText('COLD DRINKS',w/2,h/2+5);}),3.15,2.43,-Z+1.39,3.4,.3);
 hang(paint(512,128,(x,w,h)=>{x.fillStyle=ORANGE;x.fillRect(0,0,w,h);x.fillStyle='#fff';x.font='900 86px '+heavy;x.fillText('PAY HERE',w/2,h/2+5);}),-9.72,2.55,2.5,2.4,.6,Math.PI/2);
}
// ---- game only: the cashier's till -------------------------------------------------------------------------
const RESET=260,MAXQ=20,money=n=>'$'+Math.round(n).toLocaleString('en-US');
const cart={};let shopId=null,note='';
function st(sim,id){const all=sim.sixSeven||(sim.sixSeven={});return all[id]||(all[id]={state:'open',aim:0,t:0,register:true,alarmAt:null,alarm:false,bag:null,gen:0,warned:0});}
const cashier=(sim,id)=>sim.npcs.find(n=>n.id==='staff-'+id)||null;
// Shop staff are never killed outright: a shot one drops to the floor (incapacitated) and gets up later.
const gone=c=>!!c&&(c.health<=0||c.mode==='incapacitated'||c.mode==='dead');
const rows=id=>menu(id).map(it=>[it,clamp(Math.floor(Number(cart[it.id])||0),0,MAXQ)]).filter(r=>r[1]>0);
const total=id=>rows(id).reduce((s,[it,n])=>s+it.price*n,0);
function opened(sim,id){shopId=id;note='';for(const k of Object.keys(cart))delete cart[k];}
function status(sim,id){const q=st(sim,id),c=cashier(sim,id);if(q.state!=='open')return'This 6-7 is closed after a robbery. It opens again once you have been away for a while.';if(gone(c))return'Nobody is at the counter.';return'';}
function buy(sim,id){const Rr=Eat(),sv=Rr?.survival(sim),list=rows(id),sum=total(id),blockedBy=status(sim,id);if(blockedBy)return{ok:false,message:blockedBy};if(!sv)return{ok:false,message:'No save to charge.'};if(!list.length)return{ok:false,message:'Your cart is empty.'};
 if(!(sim.profile.wallet>=sum))return{ok:false,message:'You need '+money(sum)+' for that.'};if(!sim.commit('six:'+sim.uid('six'),-sum,'6-7 purchase'))return{ok:false,message:'The payment did not go through.'};
 let count=0;for(const[it,n]of list){sv.food[it.id]=(sv.food[it.id]||0)+n;count+=n;}for(const k of Object.keys(cart))delete cart[k];sim.dirty=true;return{ok:true,message:'Bought '+count+(count===1?' item':' items')+' for '+money(sum)+'. They are in your food bag: pause menu, Food and drink.'};}
function sums(ctx){const doc=root.document,sim=ctx.sim,sum=total(shopId),el=doc?.getElementById('sixTotal'),btn=doc?.querySelector('[data-action="sixBuy"]');if(el)el.textContent=rows(shopId).reduce((s,r)=>s+r[1],0)+' items \u{B7} '+money(sum);if(btn)btn.disabled=!sum||sim.profile.wallet<sum;}
let lastCtx=null;
function typed(el){const id=el?.dataset?.six;if(!id)return;const n=clamp(Math.floor(Number(el.value)||0),0,MAXQ);if(n)cart[id]=n;else delete cart[id];if(lastCtx)sums(lastCtx);}
function render(ctx){
 lastCtx=ctx;const sim=ctx.sim,id=shopId||ctx.serviceId,s=site(id);if(!s){ctx.setScreen('play');return;}const why=status(sim,id),sum=total(id),sv=Eat()?.survival(sim);
 const head=`<p class="fine" style="letter-spacing:2px;margin:0 0 8px">${ctx.esc(s[3].toUpperCase())} \u{B7} OPEN 24 HOURS \u{B7} YOU HAVE ${money(sim.profile.wallet)}</p>`+(sv?`<p class="fine" style="margin:0 0 10px">\u{1F357} Hunger ${Math.round(sv.hunger)} / 100 \u{B7} \u{1F4A7} Thirst ${Math.round(sv.thirst)} / 100</p>`:'')+(note?`<p style="margin:0 0 10px;color:#ffe1a5">${ctx.esc(note)}</p>`:'');
 if(why){ctx.panel('6-7',head+`<p>${ctx.esc(why)}</p><div class="row">${ctx.btn('sixClose','Leave','primary')}</div>`);return;}
 const cards=menu(id).map(it=>{const n=clamp(Math.floor(Number(cart[it.id])||0),0,MAXQ);return `<div data-food-item="${it.id}" style="display:flex;flex-direction:column;gap:6px;padding:12px;background:#ffffff12;border-radius:10px"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:34px;width:44px;height:44px;display:grid;place-items:center;background:#ffffff1a;border-radius:10px">${it.icon}</span><span><b>${ctx.esc(it.name)}</b><br><span class="fine">${ctx.esc(it.about)}</span></span></div><span class="fine" style="color:#bfe8c8">${[it.hunger?'+'+it.hunger+' hunger':'',it.thirst?'+'+it.thirst+' thirst':''].filter(Boolean).join(' \u{B7} ')} \u{B7} ${money(it.price)} each</span><div class="row" style="align-items:center">${ctx.btn('sixMinus','\u{2212}','',`data-value="${it.id}" aria-label="One less ${ctx.esc(it.name)}"`)}<input type="number" inputmode="numeric" min="0" max="${MAXQ}" step="1" value="${n}" data-six="${it.id}" oninput="CitySixSeven.typed(this)" aria-label="How many ${ctx.esc(it.name)}" style="width:64px;padding:8px 6px;text-align:center;border-radius:8px;border:1px solid #ffffff33;background:#0000004d;color:inherit;font:inherit">${ctx.btn('sixPlus','+','primary',`data-value="${it.id}" aria-label="One more ${ctx.esc(it.name)}"`)}</div></div>`;}).join('');
 ctx.panel('6-7',head+`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px">${cards}</div><div style="margin:14px 0 0;padding:12px;border-radius:10px;background:#0b7a4b40;border:1px solid #0b7a4b"><b>Cart</b> \u{B7} <span id="sixTotal">${rows(id).reduce((a,r)=>a+r[1],0)} items \u{B7} ${money(sum)}</span><span class="fine"> \u{B7} up to ${MAXQ} of each</span><div class="row" style="margin-top:10px">${ctx.btn('sixBuy','Buy everything in the cart','primary',sum&&sim.profile.wallet>=sum?'':'disabled')}${ctx.btn('sixClear','Empty the cart')}${ctx.btn('sixClose','Leave the counter')}</div></div>`);
}
function click(action,value,ctx){
 const sim=ctx.sim,id=shopId||ctx.serviceId;note='';
 for(const el of root.document?.querySelectorAll('input[data-six]')||[]){const n=clamp(Math.floor(Number(el.value)||0),0,MAXQ);if(n)cart[el.dataset.six]=n;else delete cart[el.dataset.six];}
 if(action==='sixClose'){ctx.setScreen('play');return;}
 if(action==='sixPlus')cart[value]=clamp((Number(cart[value])||0)+1,0,MAXQ);else if(action==='sixMinus'){const n=(Number(cart[value])||0)-1;if(n>0)cart[value]=n;else delete cart[value];}
 else if(action==='sixClear'){for(const k of Object.keys(cart))delete cart[k];}
 else if(action==='sixBuy'){const r=buy(sim,id);note=r.message;if(r.ok){/* V6.6: the till rings (the City's tillWatch) */ctx.saveNow?.();}}
 ctx.render();
}
// ---- game only: robbery, closing and reset -----------------------------------------------------------------
/* V6.22: the cashier's move with the money bag. It starts THROW.start seconds after the register opens and lasts
 * THROW.length; the bag is in the hand from THROW.take and leaves it at THROW.release (both as parts of the move),
 * then flies for THROW.fly seconds. */
const THROW={start:2.5,length:2.1,take:.3,release:.76,fly:.45},throwReleaseAt=THROW.start+THROW.length*THROW.release,throwLandAt=throwReleaseAt+THROW.fly;
const bagSpot=s=>({x:s.interaction.x-.55,y:s.y+.1,z:s.interaction.z});
/* V6.6: before the bag, the cashier hurries to the register and keys it open: there by TILL.at seconds, then
 * TILL.keys presses between TILL.from and TILL.to, each with the player's keypad beep. The register stands on the
 * counter at (-7.2, 3.9) from the middle of the store; the cashier stops where an arm reaches it. */
const TILL={go:.12,at:.8,from:.95,to:2.3,keys:8},tillSpot=s=>({x:s.x-7.98,z:s.z+3.9}),tillAt=s=>({x:s.x-7.2,z:s.z+3.9}),tillKey=i=>TILL.from+(TILL.to-TILL.from)*(i+.5)/TILL.keys;
// Anyone but the cashier inside the walls or in the doorway (the door is in the south wall).
function occupied(sim,s,id,playerInside){const p=sim.player,inBox=e=>Math.abs(e.x-s.x)<s.w/2+.4&&e.z>s.z-s.d/2-.4&&e.z<s.z+s.d/2+1.7&&Math.abs((e.y||0)-s.y)<3.2;return playerInside||p.health>0&&inBox(p)||sim.npcs.some(n=>n.id!=='staff-'+id&&!gone(n)&&inBox(n));}
function lockDoor(sim,id,shut){const w=sim.world,d=w.doors.find(q=>q.serviceId===id);if(!d)return;if(shut){if(d.open)w.setDoorOpen(d.id,false);d.locked=true;}else{d.locked=false;if(!d.open)w.setDoorOpen(d.id,true);}}
function step(sim,dt,audio){
 if(typeof document==='undefined'||!sim||sim.onlineRoom||!(dt>0))return;const w=sim.world,p=sim.player,here=w.interiorAt(p.x,p.z,(p.y||0)+1)?.id;
 for(const[id]of SITES){const s=w.serviceById?.[id];if(!s)continue;const q=st(sim,id),c=cashier(sim,id),inside=here===id,away=Math.hypot(p.x-s.x,p.z-s.z);if(c&&['bagthrow','tilltype','walk'].includes(c.animState)&&q.state!=='robbing')c.animState=null;
  if(q.state==='open'){
   if(gone(c)){q.state='robbed';q.t=0;q.shot=true;sim.emit?.('notice',{message:'The cashier is down. The register is behind the counter.'});}
   else if(inside&&c&&!gone(c)&&p.aiming&&p.weapon&&p.weapon!=='unarmed'&&p.health>0){const yaw=sim.camera?.yaw??p.yaw,fx=Math.sin(yaw),fz=Math.cos(yaw),on=t=>{const dx=t.x-p.x,dz=t.z-p.z,L=Math.hypot(dx,dz)||1;return L<13&&(dx*fx+dz*fz)/L>.955;};
    if(on(c)||on(s.register)){q.aim+=dt;if(q.aim>.25){c.mode='handsup';c.speed=0;}if(q.aim>.9){q.state='robbing';q.t=0;q.alarmAt=Math.random()<.55?1.2+Math.random()*2.6:null;q.alarm=false;q.keys=0;q.opened=false;q.from=null;sim.emit?.('notice',{message:'The cashier goes to the register.'});}}else q.aim=Math.max(0,q.aim-dt*2);}
   else q.aim=Math.max(0,q.aim-dt*2);}
  else if(q.state==='robbing'){q.t+=dt;const act=(q.t-THROW.start)/THROW.length,spot=bagSpot(s);
   /* V6.22: hands up, then the cashier takes a bag from under the counter and throws it over to you */
   if(c&&!gone(c)){c.mode='handsup';c.speed=0;const ts=tillSpot(s),reg=tillAt(s);
    if(q.t<TILL.at){/* V6.6: to the register, quickly */const k=clamp((q.t-TILL.go)/(TILL.at-TILL.go),0,1),e=k*k*(3-2*k),a=q.from||(q.from={x:c.x,z:c.z});c.x=a.x+(ts.x-a.x)*e;c.z=a.z+(ts.z-a.z)*e;if(k>0&&k<1){c.animState='walk';c.speed=2.4;c.yaw=Math.atan2(ts.x-a.x,ts.z-a.z);}else c.animState=null;}
    else if(q.t<THROW.start){/* V6.6: keying it open, one beep for each key */c.x=ts.x;c.z=ts.z;c.yaw=Math.atan2(reg.x-c.x,reg.z-c.z);c.animState='tilltype';c.tillType=clamp((q.t-TILL.at)/(THROW.start-TILL.at),0,1);
     while((q.keys||0)<TILL.keys&&q.t>=tillKey(q.keys||0)){q.keys=(q.keys||0)+1;const d=Math.hypot(p.x-reg.x,p.z-reg.z);if(!audio?.sample?.('keyBeep',(.85+Math.random()*.3)/(1+d*.1),0))audio?.tone?.(1900,.05,.03,'square','sfx');}
     if(!q.opened&&q.t>=TILL.to+.05){q.opened=true;sim.emit?.('notice',{message:'The cashier opens the register.'});audio?.tone?.(520,.1,.05,'square','sfx',380);}}
    else if(act>0&&act<1){c.animState='bagthrow';c.bagThrow=act;c.yaw=Math.atan2(spot.x-c.x,spot.z-c.z);}else c.animState=null;}
   else if(!q.bag&&q.t<throwReleaseAt){/* down before the bag left their hand: the money is still in the register */q.state='robbed';q.t=0;q.shot=true;sim.emit?.('notice',{message:'The cashier is down. The register is behind the counter.'});continue;}
   if(q.t>throwLandAt&&!q.bag){const amount=220+Math.floor(Math.random()*281),drop={id:'cash:six-'+id+'-'+q.gen+'-'+Math.floor(sim.time*10),amount,x:spot.x,y:spot.y,z:spot.z,age:0,claimed:false};sim.drops.push(drop);q.bag=drop.id;q.register=false;sim.emit?.('notice',{message:'The cashier throws a bag of money onto the floor. Walk into it.'});audio?.tone?.(180,.12,.07,'triangle','sfx',90);}
   if(q.alarmAt!==null&&!q.alarm&&q.t>=q.alarmAt&&c&&!gone(c)){q.alarm=true;sim.reportIncident?.({x:s.x,y:s.y,z:s.z},'robbery',6,true);sim.emit?.('notice',{message:'The cashier hit the panic button!'});audio?.tone?.(880,.5,.06,'square','sfx',660);}
   if(q.t>throwLandAt+1.1)q.state='robbed';}
  else if(q.state==='robbed'){q.t+=dt;if(c&&!gone(c)){c.mode='handsup';c.speed=0;}
   if(q.register&&(q.shot||gone(c))&&Math.hypot(p.x-s.register.x,p.z-s.register.z)<1.5&&p.mode==='onFoot'){const amount=220+Math.floor(Math.random()*281);if(sim.commit('six-register:'+id+':'+q.gen+':'+sim.uid('till'),amount,'6-7 register')){q.register=false;sim.emit?.('cash',{amount});sim.emit?.('notice',{message:'You empty the register: '+money(amount)+'.'});}}
   /* V6.22: the door locks 5 seconds after the last person has left, never while anyone is inside or in the doorway */
   q.out=occupied(sim,s,id,inside)?0:(q.out||0)+dt;if(q.out>=5&&q.t>.5){q.state='closed';q.out=0;lockDoor(sim,id,true);sim.emit?.('notice',{message:'The 6-7 locks its doors.'});}}
  else if(q.state==='closed'){const d=w.doors.find(k=>k.serviceId===id);/* V6.22: nobody is ever locked in */if(occupied(sim,s,id,inside)){q.state='robbed';q.out=0;lockDoor(sim,id,false);continue;}if(d&&(d.open||!d.locked)){lockDoor(sim,id,true);if(sim.time-(q.warned||0)>4&&away<24){q.warned=sim.time;sim.emit?.('notice',{message:'This 6-7 is closed after a robbery.'});}}if(c&&!gone(c)){c.mode='handsup';c.speed=0;}
   if(away>RESET){const i=sim.npcs.findIndex(n=>n.id==='staff-'+id);if(i>=0)sim.npcs.splice(i,1);const cat=root.CityPeople?.catalog||[],gen=q.gen+1;try{sim.spawnNPC({id:'staff-'+id,...s.staff,role:'staff',persistent:true,name:'6-7 staff',service:id,appearance:cat[(hash(id)+gen*37)%Math.max(1,cat.length)]});}catch(e){}
    sim.drops=sim.drops.filter(k=>!String(k.id).startsWith('cash:six-'+id+'-'));lockDoor(sim,id,false);sim.sixSeven[id]={state:'open',aim:0,t:0,register:true,alarmAt:null,alarm:false,bag:null,gen,warned:0};}}
 }
}
// A roller shutter over the door of a closed store, and a sack round each money bag still on the floor.
const made={};
function draw(scene){const sim=root.PlatdoCity?.sim,T=scene?.T;if(!sim||!T||!scene.environment||sim.onlineRoom)return;const w=sim.world;
 for(const[id]of SITES){const s=w.serviceById?.[id],q=sim.sixSeven?.[id];if(!s)continue;const shut=q?.state==='closed',bag=q?.bag?sim.drops.find(k=>k.id===q.bag&&!k.claimed):null,moving=q?.state==='robbing'&&!q.bag;let m=made[id];
  if(!m){if(!shut&&!bag&&!moving)continue;m=made[id]={};const g=new T.Group(),metal=new T.MeshLambertMaterial({color:0x8d979a}),dark=new T.MeshLambertMaterial({color:0x5c676b}),sign=new T.MeshLambertMaterial({color:0xd83a34});
   const sheet=new T.Mesh(new T.BoxGeometry(s.doorWidth+.1,2.85,.08),metal);sheet.position.y=1.43;g.add(sheet);for(let i=0;i<9;i++){const rib=new T.Mesh(new T.BoxGeometry(s.doorWidth+.1,.05,.11),dark);rib.position.y=.25+i*.3;g.add(rib);}const plate=new T.Mesh(new T.BoxGeometry(1.5,.42,.05),sign);plate.position.set(0,1.75,.09);g.add(plate);
   g.position.set(s.x,s.y,s.z+s.d/2+.06);g.name='six-shutter:'+id;m.shutter=g;
   const sack=new T.Group(),cloth=new T.MeshLambertMaterial({color:0x8c7a4f}),tie=new T.MeshLambertMaterial({color:0x3a3324}),body=new T.Mesh(new T.SphereGeometry(.24,12,10),cloth);body.scale.set(1,.85,1);body.position.y=.2;sack.add(body);const neck=new T.Mesh(new T.CylinderGeometry(.07,.11,.14,10),cloth);neck.position.y=.43;sack.add(neck);const band=new T.Mesh(new T.TorusGeometry(.085,.02,6,12),tie);band.rotation.x=Math.PI/2;band.position.y=.38;sack.add(band);sack.name='six-bag:'+id;m.sack=sack;}
  for(const o of[m.shutter,m.sack])if(o.parent!==scene.environment)scene.environment.add(o);
  m.shutter.visible=shut;let show=!!bag;m.sack.rotation.set(0,0,0);m.sack.scale.setScalar(1);if(bag)m.sack.position.set(bag.x,s.y+.02,bag.z);
  else if(moving){/* V6.22: in the cashier's hand, then through the air to where it will lie */const act=(q.t-THROW.start)/THROW.length,spot=bagSpot(s),c=cashier(sim,id),hand=c&&scene.meshes?.people?.get(c.id)?.mesh?.userData?.rig?.handR;
   if(act>=THROW.take&&q.t<throwReleaseAt&&hand){const v=hand.getWorldPosition(m.at||(m.at=new T.Vector3()));m.sack.scale.setScalar(.72);m.sack.position.set(v.x,v.y-.36,v.z);m.from=[v.x,v.y-.36,v.z];show=true;}
   else if(q.t>=throwReleaseAt&&m.from){const k=clamp((q.t-throwReleaseAt)/THROW.fly,0,1),h=1.05*4*k*(1-k);m.sack.scale.setScalar(.72+.28*k);m.sack.position.set(m.from[0]+(spot.x-m.from[0])*k,m.from[1]+(s.y+.02-m.from[1])*k+h,m.from[2]+(spot.z-m.from[2])*k);m.sack.rotation.set(k*5.5,0,k*1.3);show=true;}}
  if(!moving)m.from=null;m.sack.visible=show;}
}
// The delivery app lists one 6-7: the open store nearest the player's home.
function brands(sim){const h=root.CityDelivery?.home?.(sim),w=sim?.world;if(!w)return[];const open=SITES.filter(s=>w.serviceById?.[s[0]]&&st(sim,s[0]).state==='open'&&!gone(cashier(sim,s[0])));if(!open.length)return[];const from=h?h.door:sim.player;open.sort((a,b)=>Math.hypot(a[1]-from.x,a[2]-from.z)-Math.hypot(b[1]-from.x,b[2]-from.z));return[brand(open[0][0])];}
return{W,D,H,SITES,COMMON,SPECIAL,site,brand,menu,services,furnish,solids,palette,dress,signs,opened,render,click,typed,step,draw,brands,state:st,status,buy,cart};
});
