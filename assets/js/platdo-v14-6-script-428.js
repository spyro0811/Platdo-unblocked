
/* PLATDO City apartments: the inside of the homes (V9.2). Game only.
 * The home you are in is built when you arrive and taken down when you leave, so only one is ever drawn. All eight
 * homes of a building share its design; the west homes are the mirror image of the east ones.
 * Every piece of furniture is placed from the shared list in city-apartments.js (layout()), so it stands exactly where
 * its solid box is. Nothing here is a plain coloured box standing in for furniture: cushions are rounded and soft,
 * lamps are turned, tables have real tops and legs, the kitchen has doors, drawers, a sink you can see into and a
 * hob, the bathroom a walk-in shower with a rain head, a bath, a wall-hung toilet and a lit mirror.
 * V9.3: all ten designs. Each design's LOOKS entry says what it is made of and which version of each piece it uses. No two faces lie in one plane: finishes sit a few millimetres in front of walls,
 * rugs above floors, every part that touches another meets it edge to face. */
(function(root){'use strict';
const PI=Math.PI,TAU=PI*2;
const AP=()=>root.CityApartments,LK=()=>root.CityApartmentsLook;
// ---- textures --------------------------------------------------------------------------------------------------------
const SIZE={oak:2.4,walnut:1.2,smoke:1.2,marbleW:1.6,marbleB:1.6,travertine:1.6,linen:.6,boucle:.5,velvet:.8,leather:.8,zellige:.6,tileL:1.2,plaster:3,fluted:.6,terrazzo:1.2,rugStripe:0,rugKilim:0,rugNoir:0,carpet:1,/* V9.3 */terracotta:.9,concrete:3,ash:2.4,stoneL:1.8,brick:1.2,shiplap:1.2,encaustic:.6,subway:.6,marbleG:1.6,marbleP:1.6,oakPale:2.4};
function cv(n){const c=document.createElement('canvas');c.width=c.height=n;return c;}
function spk(g,n,r,count,rgb,a,s=1.4){for(let i=0;i<count;i++){g.fillStyle=`rgba(${rgb},${a*(.3+r()*.7)})`;const z=s*(.4+r()*.8);g.fillRect(r()*n,r()*n,z,z);}}
function veins(g,n,r,count,color,wmax){for(let i=0;i<count;i++){g.strokeStyle=color.replace('A',(.15+r()*.45).toFixed(2));g.lineWidth=.5+r()*wmax;g.beginPath();let x=r()*n,y=-10;g.moveTo(x,y);while(y<n+10){x+=r()*40-20;y+=10+r()*26;g.lineTo(x,y);}g.stroke();}}
function planks(g,n,r,w,len,cols){const rows=Math.round(n/w);for(let j=0;j<rows;j++){let x=-r()*len;while(x<n){const L=len*(.55+r()*.6),t=r(),c=cols[(r()*cols.length)|0];g.fillStyle=`rgb(${c[0]+t*18|0},${c[1]+t*14|0},${c[2]+t*10|0})`;g.fillRect(x,j*w,L,w);for(let k=0;k<5;k++){g.strokeStyle=`rgba(60,35,15,${.05+r()*.1})`;g.lineWidth=.6;g.beginPath();const y=j*w+r()*w;g.moveTo(x,y);g.bezierCurveTo(x+L*.3,y+r()*4-2,x+L*.7,y+r()*4-2,x+L,y);g.stroke();}g.fillStyle='rgba(30,18,8,.35)';g.fillRect(x+L-1,j*w,1,w);x+=L;}g.fillStyle='rgba(30,18,8,.3)';g.fillRect(0,j*w+w-1,n,1);}}
function herring(g,n,r,cols,dark){g.fillStyle=dark;g.fillRect(0,0,n,n);const w=n/16,L=w*4,band=2*L;
 /* a herringbone in two staircases: each plank L by w, horizontal ones stepping (w,w), vertical ones under them; the bands repeat every 2L */
 for(let b=-2;b<=Math.ceil(n/band)+2;b++)for(let i=-20;i<=20;i++){const bx=b*band+i*w,by=i*w;
  for(const[x,y,ww,hh]of[[bx,by,L,w],[bx,by+w,w,L]]){const t=r(),c=cols[(r()*cols.length)|0],col=`rgb(${c[0]+t*16|0},${c[1]+t*12|0},${c[2]+t*9|0})`;
   for(const dx of[-n,0,n])for(const dy of[-n,0,n]){const X=x+dx,Y=y+dy;if(X>n||Y>n||X+ww<0||Y+hh<0)continue;g.fillStyle=col;g.fillRect(X+.8,Y+.8,ww-1.6,hh-1.6);g.strokeStyle='rgba(40,22,10,.12)';g.lineWidth=.6;for(let k=1;k<4;k++){g.beginPath();if(ww>hh){g.moveTo(X+2,Y+hh*k/4);g.lineTo(X+ww-2,Y+hh*k/4+(k-2)*.6);}else{g.moveTo(X+ww*k/4,Y+2);g.lineTo(X+ww*k/4+(k-2)*.6,Y+hh-2);}g.stroke();}}}}}
// Veins that wrap round the texture both ways, soft at the edge.
function veins2(g,n,r,count,rgb,maxw){for(let i=0;i<count;i++){const x0=r()*n,a=[r()*60,r()*30,r()*14],ph=[r()*TAU,r()*TAU,r()*TAU],N=40,pts=[];for(let k=0;k<=N;k++){const y=k/N*n;let x=x0;for(let j=0;j<3;j++)x+=a[j]*Math.sin(TAU*(j+1)*y/n+ph[j]);pts.push([x,y]);}
 for(const[lw,al]of[[maxw*4,.05],[maxw*1.6,.12],[maxw*.6,.35+r()*.3]]){g.strokeStyle=`rgba(${rgb},${al})`;g.lineWidth=lw*(.6+r()*.6);for(const dx of[-n,0,n]){g.beginPath();g.moveTo(pts[0][0]+dx,pts[0][1]);for(let k=1;k<pts.length;k++)g.lineTo(pts[k][0]+dx,pts[k][1]);g.stroke();}}}}
const DRAW={
 oak(g,n,r){planks(g,n,r,n/12,n*.9,[[196,160,118],[205,170,128],[188,152,110]]);},
 walnut(g,n,r){herring(g,n,r,[[110,72,46],[96,62,40],[122,82,52]],'#2a1a10');},
 smoke(g,n,r){herring(g,n,r,[[58,48,42],[48,40,36],[66,54,46]],'#141110');},
 marbleW(g,n,r){g.fillStyle='#efede9';g.fillRect(0,0,n,n);spk(g,n,r,3000,'190,186,180',.08,3);veins2(g,n,r,5,'125,122,118',3);veins2(g,n,r,9,'165,160,154',1.4);},
 marbleB(g,n,r){g.fillStyle='#17181a';g.fillRect(0,0,n,n);spk(g,n,r,3000,'60,60,62',.15,3);veins2(g,n,r,4,'205,172,110',2.4);veins2(g,n,r,7,'225,225,222',1.1);},
 travertine(g,n,r){g.fillStyle='#d9c7a6';g.fillRect(0,0,n,n);for(let y=0;y<n;y+=2+r()*6){g.fillStyle=`rgba(${150+r()*60|0},${120+r()*50|0},${80+r()*40|0},${.06+r()*.1})`;g.fillRect(0,y,n,1+r()*3);}for(let i=0;i<260;i++){g.fillStyle=`rgba(120,95,60,${.2+r()*.3})`;g.fillRect(r()*n,r()*n,1+r()*5,1+r()*1.6);}},
 linen(g,n,r){g.fillStyle='#eae6de';g.fillRect(0,0,n,n);for(let i=0;i<n;i+=2){g.fillStyle=`rgba(0,0,0,${.02+r()*.04})`;g.fillRect(i,0,1,n);g.fillStyle=`rgba(255,255,255,${.03+r()*.05})`;g.fillRect(0,i,n,1);}spk(g,n,r,2500,'90,80,70',.06);},
 boucle(g,n,r){g.fillStyle='#ece6dc';g.fillRect(0,0,n,n);for(let i=0;i<5000;i++){const x=r()*n,y=r()*n,s=1.5+r()*2.5;g.fillStyle=`rgba(${r()<.5?'255,255,255':'120,105,90'},${.08+r()*.18})`;g.beginPath();g.arc(x,y,s,0,TAU);g.fill();}},
 velvet(g,n,r){g.fillStyle='#e8e8e8';g.fillRect(0,0,n,n);for(let i=0;i<40;i++){const x=r()*n,y=r()*n,R=20+r()*60,gr=g.createRadialGradient(x,y,0,x,y,R);gr.addColorStop(0,`rgba(255,255,255,${.04+r()*.06})`);gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(x-R,y-R,R*2,R*2);}spk(g,n,r,2000,'0,0,0',.04);},
 leather(g,n,r){g.fillStyle='#e6e1da';g.fillRect(0,0,n,n);for(let i=0;i<7000;i++){g.fillStyle=`rgba(${r()<.5?'0,0,0':'255,255,255'},${.03+r()*.06})`;const x=r()*n,y=r()*n;g.fillRect(x,y,1+r()*2,1);}for(let i=0;i<30;i++){g.strokeStyle=`rgba(0,0,0,${.04+r()*.05})`;g.beginPath();g.moveTo(r()*n,r()*n);g.lineTo(r()*n,r()*n);g.stroke();}},
 zellige(g,n,r){const k=8,s=n/k;g.fillStyle='#d8d8d2';g.fillRect(0,0,n,n);for(let j=0;j<k;j++)for(let i=0;i<k;i++){const t=r(),gr=g.createLinearGradient(i*s,j*s,i*s+s,j*s+s);gr.addColorStop(0,`rgb(${238+t*12|0},${240+t*10|0},${236+t*12|0})`);gr.addColorStop(1,`rgb(${222+t*14|0},${226+t*12|0},${222+t*14|0})`);g.fillStyle=gr;g.fillRect(i*s+1.5,j*s+1.5,s-3,s-3);}},
 tileL(g,n,r){g.fillStyle='#bdbab3';g.fillRect(0,0,n,n);const k=2,s=n/k;for(let j=0;j<k;j++)for(let i=0;i<k;i++){g.fillStyle='#e6e3dc';g.fillRect(i*s+1,j*s+1,s-2,s-2);}spk(g,n,r,4000,'150,145,138',.12,2);},
 plaster(g,n,r){g.fillStyle='#f0f0f0';g.fillRect(0,0,n,n);for(let i=0;i<50;i++){const x=r()*n,y=r()*n,R=30+r()*80,gr=g.createRadialGradient(x,y,0,x,y,R);gr.addColorStop(0,`rgba(${r()<.5?'0,0,0':'255,255,255'},${.025+r()*.03})`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-R,y-R,R*2,R*2);}},
 fluted(g,n,r){const k=16,s=n/k;for(let i=0;i<k;i++){const gr=g.createLinearGradient(i*s,0,i*s+s,0);gr.addColorStop(0,'#9a9a9a');gr.addColorStop(.5,'#f2f2f2');gr.addColorStop(1,'#8c8c8c');g.fillStyle=gr;g.fillRect(i*s,0,s,n);}},
 terrazzo(g,n,r){g.fillStyle='#e9e5de';g.fillRect(0,0,n,n);for(let i=0;i<900;i++){g.fillStyle=['#b9a48a','#8f9a96','#d3c0a8','#6f6a66','#c98a6a'][(r()*5)|0];g.beginPath();const x=r()*n,y=r()*n,s=1+r()*4;g.moveTo(x,y);g.lineTo(x+s,y+r()*s);g.lineTo(x+r()*s,y+s);g.fill();}},
 carpet(g,n,r){g.fillStyle='#d8d2c8';g.fillRect(0,0,n,n);spk(g,n,r,12000,'120,110,100',.1,1.2);spk(g,n,r,6000,'255,255,255',.15,1.2);},
 rugStripe(g,n,r){g.fillStyle='#efe9dc';g.fillRect(0,0,n,n);for(let i=0;i<9;i++){g.fillStyle=i%3===1?'#1f3f66':'#9fb3c4';g.fillRect(0,n*.08+i*n*.1,n,i%3===1?n*.04:n*.012);}spk(g,n,r,20000,'0,0,0',.05,1.2);g.strokeStyle='#1f3f66';g.lineWidth=6;g.strokeRect(10,10,n-20,n-20);},
 rugKilim(g,n,r){g.fillStyle='#d9c6a6';g.fillRect(0,0,n,n);const k=6,s=n/k;for(let j=0;j<k;j++)for(let i=0;i<k;i++){const cx=(i+.5)*s,cy=(j+.5)*s;g.fillStyle=(i+j)%2?'#a85a32':'#6b4a33';g.beginPath();g.moveTo(cx,cy-s*.36);g.lineTo(cx+s*.36,cy);g.lineTo(cx,cy+s*.36);g.lineTo(cx-s*.36,cy);g.fill();g.fillStyle='#efe2c8';g.beginPath();g.moveTo(cx,cy-s*.14);g.lineTo(cx+s*.14,cy);g.lineTo(cx,cy+s*.14);g.lineTo(cx-s*.14,cy);g.fill();}g.strokeStyle='#4a3020';g.lineWidth=14;g.strokeRect(7,7,n-14,n-14);spk(g,n,r,20000,'0,0,0',.06,1.2);},
 rugNoir(g,n,r){g.fillStyle='#1d1d1f';g.fillRect(0,0,n,n);spk(g,n,r,20000,'255,255,255',.03,1.2);g.strokeStyle='#b8955a';g.lineWidth=3;for(let i=0;i<7;i++){g.beginPath();g.arc(n*.5,n*.5,n*(.08+i*.06),0,TAU);g.stroke();}g.lineWidth=5;g.strokeRect(16,16,n-32,n-32);},
 // V9.3: the seven other designs
 terracotta(g,n,r){g.fillStyle='#8d5a40';g.fillRect(0,0,n,n);const s=n/4,h=s*Math.sqrt(3)/2;for(let j=-1;j<6;j++)for(let i=-1;i<6;i++){const cx=i*s*1.5,cy=j*h*2+(i%2?h:0),t=r();for(const dx of[-n,0,n])for(const dy of[-n,0,n]){g.fillStyle=`rgb(${176+t*30|0},${92+t*22|0},${58+t*14|0})`;g.beginPath();for(let k=0;k<6;k++){const a=k*PI/3;g.lineTo(cx+dx+Math.cos(a)*(s-3),cy+dy+Math.sin(a)*(s-3));}g.fill();}}spk(g,n,r,5000,'60,30,15',.12,2);},
 concrete(g,n,r){g.fillStyle='#a9a8a3';g.fillRect(0,0,n,n);for(let i=0;i<60;i++){const x=r()*n,y=r()*n,R=20+r()*70,gr=g.createRadialGradient(x,y,0,x,y,R);gr.addColorStop(0,`rgba(${r()<.5?'70,70,68':'200,200,196'},${.06+r()*.06})`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-R,y-R,R*2,R*2);}spk(g,n,r,9000,'60,60,58',.08,1.2);g.strokeStyle='rgba(60,60,58,.25)';g.lineWidth=1;g.strokeRect(.5,.5,n-1,n-1);},
 ash(g,n,r){planks(g,n,r,n/16,n*.8,[[222,204,176],[230,214,188],[214,196,168]]);},
 oakPale(g,n,r){planks(g,n,r,n/9,n*.95,[[214,186,148],[222,196,160],[206,178,140]]);},
 stoneL(g,n,r){g.fillStyle='#7d7b77';g.fillRect(0,0,n,n);const k=2,s=n/k;for(let j=0;j<k;j++)for(let i=0;i<k;i++){const t=r();g.fillStyle=`rgb(${120+t*24|0},${118+t*22|0},${114+t*20|0})`;g.fillRect(i*s+1.5,j*s+1.5,s-3,s-3);}spk(g,n,r,9000,'60,58,55',.14,1.6);spk(g,n,r,4000,'190,188,184',.12,1.4);},
 brick(g,n,r){g.fillStyle='#c9bcaa';g.fillRect(0,0,n,n);const rows=16,h=n/rows,w=n/4;for(let j=0;j<rows;j++){const off=j%2?w/2:0;for(let i=-1;i<5;i++){const t=r();g.fillStyle=`rgb(${140+t*50|0},${62+t*30|0},${46+t*20|0})`;g.fillRect(i*w+off+1.5,j*h+1.5,w-3,h-3);g.fillStyle=`rgba(0,0,0,${r()*.15})`;g.fillRect(i*w+off+1.5,j*h+h*.6,w-3,h*.4-1.5);}}spk(g,n,r,4000,'40,25,18',.15,1.4);},
 shiplap(g,n,r){const rows=8,h=n/rows;for(let j=0;j<rows;j++){const t=r();g.fillStyle=`rgb(${242+t*8|0},${240+t*8|0},${234+t*8|0})`;g.fillRect(0,j*h,n,h);g.fillStyle='rgba(0,0,0,.22)';g.fillRect(0,j*h+h-2,n,2);g.fillStyle='rgba(255,255,255,.5)';g.fillRect(0,j*h,n,1);}},
 encaustic(g,n,r){const k=4,s=n/k;for(let j=0;j<k;j++)for(let i=0;i<k;i++){const x=i*s,y=j*s;g.fillStyle='#f2efe6';g.fillRect(x+1,y+1,s-2,s-2);g.fillStyle='#2c5c86';g.beginPath();g.arc(x+s/2,y+s/2,s*.32,0,TAU);g.fill();g.fillStyle='#f2efe6';g.beginPath();g.arc(x+s/2,y+s/2,s*.2,0,TAU);g.fill();g.fillStyle='#2c5c86';for(const[a,b]of[[0,0],[s,0],[0,s],[s,s]]){g.beginPath();g.arc(x+a,y+b,s*.18,0,TAU);g.fill();}g.fillStyle='#e0a84a';g.beginPath();g.arc(x+s/2,y+s/2,s*.07,0,TAU);g.fill();}},
 subway(g,n,r){g.fillStyle='#cfccc6';g.fillRect(0,0,n,n);const rows=8,h=n/rows,w=n/4;for(let j=0;j<rows;j++){const off=j%2?w/2:0;for(let i=-1;i<5;i++){const t=r(),gr=g.createLinearGradient(0,j*h,0,j*h+h);gr.addColorStop(0,`rgb(${246+t*6|0},${246+t*6|0},${244+t*6|0})`);gr.addColorStop(1,`rgb(${232+t*8|0},${232+t*8|0},${230+t*8|0})`);g.fillStyle=gr;g.fillRect(i*w+off+1.5,j*h+1.5,w-3,h-3);}}},
 marbleG(g,n,r){g.fillStyle='#1f4a3a';g.fillRect(0,0,n,n);spk(g,n,r,3000,'20,40,30',.2,3);veins2(g,n,r,6,'220,232,222',1.6);veins2(g,n,r,8,'90,140,110',2.4);},
 marbleP(g,n,r){g.fillStyle='#e8c9c0';g.fillRect(0,0,n,n);spk(g,n,r,3000,'200,160,150',.12,3);veins2(g,n,r,5,'250,240,236',2);veins2(g,n,r,6,'170,120,110',1.2);},
 rugJute(g,n,r){g.fillStyle='#c7ab7c';g.fillRect(0,0,n,n);for(let y=0;y<n;y+=6)for(let x=0;x<n;x+=6){g.fillStyle=`rgba(${(x+y)%12?'90,65,35':'235,215,175'},${.18+r()*.15})`;g.fillRect(x,y,5,5);}g.strokeStyle='#8a6a40';g.lineWidth=10;g.strokeRect(5,5,n-10,n-10);},
 rugPersian(g,n,r){g.fillStyle='#8a2f2a';g.fillRect(0,0,n,n);g.strokeStyle='#1f3550';g.lineWidth=26;g.strokeRect(20,20,n-40,n-40);g.strokeStyle='#d9c08a';g.lineWidth=4;g.strokeRect(40,40,n-80,n-80);g.fillStyle='#1f3550';g.beginPath();g.ellipse(n/2,n/2,n*.2,n*.3,0,0,TAU);g.fill();g.fillStyle='#d9c08a';g.beginPath();g.ellipse(n/2,n/2,n*.08,n*.14,0,0,TAU);g.fill();for(let i=0;i<40;i++){g.fillStyle=['#d9c08a','#1f3550','#5a7a5a'][i%3];g.beginPath();g.arc(60+r()*(n-120),60+r()*(n-120),3+r()*6,0,TAU);g.fill();}spk(g,n,r,30000,'255,255,255',.06,1.2);},
 rugWool(g,n,r){g.fillStyle='#ece8df';g.fillRect(0,0,n,n);g.strokeStyle='#b7b0a3';g.lineWidth=3;for(let i=0;i<8;i++){g.beginPath();g.moveTo(0,i*n/8);for(let x=0;x<=n;x+=n/8)g.lineTo(x,i*n/8+((x/(n/8))%2?n/16:0));g.stroke();}spk(g,n,r,20000,'0,0,0',.04,1.2);},
 rugGrey(g,n,r){g.fillStyle='#c9c7c2';g.fillRect(0,0,n,n);spk(g,n,r,30000,'90,90,88',.08,1.2);spk(g,n,r,20000,'255,255,255',.1,1.2);},
 rugBold(g,n,r){g.fillStyle='#f0e6d8';g.fillRect(0,0,n,n);const c=['#e07a5f','#2a9d8f','#e9c46a','#264653'];for(let i=0;i<7;i++){g.fillStyle=c[i%4];g.beginPath();g.arc(r()*n,r()*n,n*(.08+r()*.14),0,TAU);g.fill();}g.strokeStyle='#264653';g.lineWidth=12;g.strokeRect(6,6,n-12,n-12);},
 rugMed(g,n,r){g.fillStyle='#f3efe5';g.fillRect(0,0,n,n);g.strokeStyle='#2c5c86';g.lineWidth=5;for(let i=1;i<8;i++){g.strokeRect(i*n/16,i*n/16,n-i*n/8,n-i*n/8);}spk(g,n,r,20000,'0,0,0',.04,1.2);}
};
function tex(T,key){const c=tex.cache||(tex.cache={});if(c[key])return c[key];const big=/^rug|^art/.test(key)?512:['marbleW','marbleB','walnut','smoke','oak','marbleG','marbleP','ash','oakPale','terracotta','stoneL','concrete'].includes(key)?1024:256,can=cv(big),g=can.getContext('2d');DRAW[key](g,big,LK().rng(LK().hash(key)));const t=new T.CanvasTexture(can);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;if(SIZE[key])t.repeat.set(1/SIZE[key],1/SIZE[key]);return c[key]=t;}
// Paintings: drawn for each design, never a photograph.
function art(T,key,seed){const c=art.cache||(art.cache={});if(c[key+seed])return c[key+seed];const n=512,can=cv(n),g=can.getContext('2d'),r=LK().rng(LK().hash(key+seed));
 if(key==='sea'){const gr=g.createLinearGradient(0,0,0,n);gr.addColorStop(0,'#cfe0ea');gr.addColorStop(.55,'#9fc1d6');gr.addColorStop(.56,'#2f5f86');gr.addColorStop(1,'#16314d');g.fillStyle=gr;g.fillRect(0,0,n,n);g.fillStyle='#f4e7c9';g.beginPath();g.arc(n*(.3+r()*.4),n*.38,n*.09,0,TAU);g.fill();for(let i=0;i<60;i++){g.strokeStyle=`rgba(255,255,255,${.1+r()*.3})`;g.lineWidth=1+r()*3;g.beginPath();const y=n*.58+r()*n*.4,x=r()*n;g.moveTo(x,y);g.lineTo(x+20+r()*80,y);g.stroke();}}
 else if(key==='earth'){g.fillStyle='#e8d8c0';g.fillRect(0,0,n,n);const cols=['#a85a32','#c98d5a','#6b4a33','#d9b48a'];for(let i=0;i<4;i++){g.fillStyle=cols[(i+seed)%4];const x=n*(.12+i*.2),w=n*.22;g.beginPath();g.moveTo(x,n*.88);g.lineTo(x,n*.45);g.arc(x+w/2,n*.45,w/2,PI,0);g.lineTo(x+w,n*.88);g.fill();}g.fillStyle='#3b2a1e';g.fillRect(n*.08,n*.88,n*.84,n*.02);}
 else if(key==='gold'){g.fillStyle='#121214';g.fillRect(0,0,n,n);for(let i=0;i<5;i++){g.strokeStyle=`rgba(${200+r()*30|0},${160+r()*30|0},${90+r()*30|0},${.6+r()*.4})`;g.lineWidth=3+r()*14;g.beginPath();g.moveTo(r()*n*.3,n*(.2+r()*.6));g.bezierCurveTo(n*.4,r()*n,n*.6,r()*n,n*(.7+r()*.3),n*(.2+r()*.6));g.stroke();}spk(g,n,r,600,'220,190,120',.5,2);}
 else if(key==='arches'){g.fillStyle='#f4efe4';g.fillRect(0,0,n,n);g.fillStyle='#2c5c86';g.fillRect(0,n*.62,n,n*.38);g.fillStyle='#f4efe4';for(let i=0;i<3;i++){const x=n*(.12+i*.28),w=n*.2;g.beginPath();g.moveTo(x,n*.95);g.lineTo(x,n*.55);g.arc(x+w/2,n*.55,w/2,PI,0);g.lineTo(x+w,n*.95);g.fill();}g.fillStyle='#e0a84a';g.beginPath();g.arc(n*.78,n*.2,n*.07,0,TAU);g.fill();}
 else if(key==='surf'){const gr=g.createLinearGradient(0,0,0,n);gr.addColorStop(0,'#f6d8b0');gr.addColorStop(.5,'#f0b896');gr.addColorStop(.52,'#5f9bb0');gr.addColorStop(1,'#2f6f86');g.fillStyle=gr;g.fillRect(0,0,n,n);g.fillStyle='#fff6e2';g.beginPath();g.arc(n*.5,n*.48,n*.12,PI,0);g.fill();for(let i=0;i<5;i++){g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=3;g.beginPath();g.arc(n*(.2+i*.15),n*(.7+(i%2)*.08),n*.06,PI,0);g.stroke();}}
 else if(key==='urban'){g.fillStyle='#2b2b2b';g.fillRect(0,0,n,n);for(let i=0;i<9;i++){g.fillStyle=['#e63946','#f1faee','#a8dadc','#e9c46a','#1d3557'][i%5];g.fillRect(r()*n,r()*n,n*(.1+r()*.3),n*(.04+r()*.1));}g.strokeStyle='#f1faee';g.lineWidth=14;g.beginPath();g.arc(n*.5,n*.5,n*.18,0,TAU);g.stroke();}
 else if(key==='line'){g.fillStyle='#f6f4ef';g.fillRect(0,0,n,n);g.strokeStyle='#2a2a2a';g.lineWidth=3;g.beginPath();g.moveTo(n*.2,n*.7);g.bezierCurveTo(n*.3,n*.2,n*.6,n*.9,n*.8,n*.3);g.stroke();g.fillStyle='#e8c9c0';g.beginPath();g.arc(n*.62,n*.38,n*.1,0,TAU);g.fill();}
 else if(key==='mono'){g.fillStyle='#ececea';g.fillRect(0,0,n,n);g.fillStyle='#1a1a1a';g.fillRect(n*.18,n*.18,n*.3,n*.64);g.fillStyle='#9a9a98';g.fillRect(n*.55,n*.4,n*.26,n*.42);}
 else if(key==='pop'){const c=['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff8fab'];for(let j=0;j<2;j++)for(let i=0;i<2;i++){g.fillStyle=c[(i+j*2+seed)%5];g.fillRect(i*n/2,j*n/2,n/2,n/2);g.fillStyle=c[(i+j*2+seed+2)%5];g.beginPath();g.arc(i*n/2+n/4,j*n/2+n/4,n*.15,0,TAU);g.fill();}}
 else if(key==='strata'){for(let y=0;y<n;){const h=8+r()*40,t=r();g.fillStyle=`rgb(${110+t*80|0},${108+t*76|0},${100+t*70|0})`;g.fillRect(0,y,n,h);y+=h;}g.fillStyle='rgba(60,90,70,.6)';g.beginPath();g.arc(n*.7,n*.3,n*.12,0,TAU);g.fill();}
 else{g.fillStyle='#f1eee8';g.fillRect(0,0,n,n);for(let i=0;i<6;i++){g.fillStyle=['#1f3f66','#9fb3c4','#d8c3a5','#2f4f73','#e9e6df','#c9a24a'][i];g.fillRect(n*r()*.6,n*r()*.6,n*(.2+r()*.4),n*(.1+r()*.3));}}
 const t=new T.CanvasTexture(can);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return c[key+seed]=t;}
// ---- what each design is made of ----------------------------------------------------------------------------------------
const LOOKS={
 // what each design is made of, and which version of each piece it uses (see the kit below)
 coastal:{floor:'oak',bathFloor:'marbleW',wall:'#f3f0e9',feature:null,featureAt:[],ceiling:'#fbfbf9',ceil:'cove',
  wood:'#d4b48c',woodTex:'oak',stone:'marbleW',metal:'brass',fabric:'#e6e1d6',fabricTex:'linen',fabric2:'#2c4a6e',fabric2Tex:'linen',pillow:['#2c4a6e','#9fb3c4','#f2efe8','#c9a77a'],
  cab:'#f4f2ec',cabStyle:'shaker',top:'marbleW',splash:'zellige',uppers:'shelves',hood:'plaster',rug:'rugStripe',art:'sea',bedFrame:'#e7e1d6',bedTex:'linen',linen:'#f8f6f1',throw:'#2c4a6e',tile:'zellige',vanity:'#d4b48c',tub:'#f7f7f5',screen:'#2a2c2e',plant:'olive',curtain:'#f2efe8',chair:'#e6e1d6',lampShade:'#f5f1e6',
  stool:'pedestal',chairStyle:'upholstered',chairLegs:'wood',armchair:'lounge',coffee:'stoneRect',side:'stone',floorlamp:'arc',legs:'metal',sofaBase:'legs',bedLegs:'wood',wardrobe:'shaker',pendant:'cone',media:'fluted'},
 warm:{floor:'walnut',bathFloor:'travertine',wall:'#ece3d4',feature:'travertine',featureAt:['tv'],ceiling:'#f2eadc',ceil:'beams',beams:'#6b4a33',
  wood:'#7a5236',woodTex:'oak',stone:'travertine',metal:'bronze',fabric:'#e4d9c6',fabricTex:'boucle',fabric2:'#a85a32',fabric2Tex:'leather',pillow:['#a85a32','#d9b48a','#6b5a3a','#efe2c8'],
  cab:'#7a5236',cabTex:'oak',cabStyle:'slab',top:'travertine',splash:'travertine',uppers:'shelves',hood:'travertine',rug:'rugKilim',art:'earth',bedFrame:'#6b4a33',bedTex:'oak',linen:'#efe7d8',throw:'#a85a32',tile:'travertine',vanity:'#7a5236',tub:'#d9c7a6',screen:'#2a2522',plant:'fig',curtain:'#e9dcc6',chair:'#a85a32',lampShade:'#efe2c8',
  stool:'wood',chairStyle:'wishbone',chairLegs:'wood',armchair:'sling',coffee:'drum',side:'wood',floorlamp:'tripod',legs:'wood',sofaBase:'legs',bedLegs:'wood',wardrobe:'slats',pendant:'cone',media:'fluted'},
 noir:{floor:'smoke',bathFloor:'marbleB',wall:'#2e2f33',feature:'marbleB',featureAt:['tv'],ceiling:'#1f2023',ceil:'cove',
  wood:'#3b302a',woodTex:'oak',stone:'marbleB',metal:'gold',fabric:'#3a3c42',fabricTex:'velvet',fabric2:'#8a5a34',fabric2Tex:'leather',pillow:['#b8955a','#5a4a6a','#1f2023','#8a5a34'],
  cab:'#1b1c1e',cabStyle:'slab',top:'marbleB',splash:'marbleB',uppers:'glass',hood:'black',rug:'rugNoir',art:'gold',bedFrame:'#2a2b2f',bedTex:'velvet',linen:'#e8e4dc',throw:'#b8955a',tile:'marbleB',vanity:'#1b1c1e',tub:'#1c1d1f',screen:'#0c0c0d',plant:'bird',curtain:'#3a3c42',chair:'#3a3c42',lampShade:'#d8c9a8',
  stool:'pedestal',chairStyle:'upholstered',chairLegs:'metal',armchair:'barrel',coffee:'stoneRect',side:'stone',floorlamp:'ring',legs:'metal',sofaBase:'plinth',bedLegs:'metal',wardrobe:'glass',pendant:'ring',media:'slab'},
 mediterranean:{floor:'terracotta',bathFloor:'terracotta',wall:'#f6f1e6',feature:null,featureAt:[],ceiling:'#f8f4ea',ceil:'beams',beams:'#4a3424',
  wood:'#8a6440',woodTex:'oak',stone:'marbleW',metal:'brass',fabric:'#efe8da',fabricTex:'linen',fabric2:'#2c5c86',fabric2Tex:'linen',pillow:['#2c5c86','#e0a84a','#f4efe4','#6f8a5a'],
  cab:'#7d8f7a',cabStyle:'shaker',top:'marbleW',splash:'encaustic',uppers:'shelves',hood:'plaster',rug:'rugMed',art:'arches',bedFrame:'#efe8da',bedTex:'linen',linen:'#fbf8f1',throw:'#2c5c86',tile:'encaustic',vanity:'#8a6440',tub:'#f7f5ef',screen:'#2a2a2a',plant:'olive',curtain:'#f4efe4',chair:'#c9a46a',lampShade:'#efe2c8',
  stool:'rush',chairStyle:'ladder',chairLegs:'wood',armchair:'rattan',coffee:'woodRound',side:'wood',floorlamp:'rattan',legs:'wood',sofaBase:'legs',bedLegs:'wood',wardrobe:'shaker',pendant:'rattan',media:'wood',tableTop:'wood'},
 california:{floor:'oakPale',bathFloor:'terrazzo',wall:'#f7f5f0',feature:'shiplap',featureAt:['bed','party'],ceiling:'#fbfaf6',ceil:'beams',beams:'#c8a67c',
  wood:'#c8a67c',woodTex:'oak',stone:'marbleW',metal:'brass',fabric:'#ebe4d6',fabricTex:'linen',fabric2:'#7f9a82',fabric2Tex:'linen',pillow:['#7f9a82','#d9b48a','#5f8aa8','#f2ede2'],
  cab:'#f6f4ee',cabStyle:'shaker',top:'marbleW',splash:'subway',uppers:'shelves',hood:'plaster',rug:'rugJute',art:'surf',bedFrame:'#c8a67c',bedTex:'oak',linen:'#fbfaf5',throw:'#7f9a82',tile:'subway',vanity:'#c8a67c',tub:'#f8f7f2',screen:'#2a2c2e',plant:'bird',curtain:'#f6f2e8',chair:'#ebe4d6',lampShade:'#f2ead8',
  stool:'rush',chairStyle:'wishbone',chairLegs:'wood',armchair:'rattan',coffee:'woodRound',side:'wood',floorlamp:'rattan',legs:'wood',sofaBase:'legs',bedLegs:'wood',wardrobe:'shaker',pendant:'rattan',media:'wood'},
 loft:{floor:'concrete',bathFloor:'concrete',wall:'#e9e6e1',feature:'brick',featureAt:['party','bed'],ceiling:'#3a3c3e',ceil:'steel',
  wood:'#5a3a24',woodTex:'oak',stone:'concrete',metal:'black',fabric:'#7a4a2a',fabricTex:'leather',fabric2:'#3d3f42',fabric2Tex:'linen',pillow:['#c9a24a','#3d5a40','#a33b2f','#e9e2d2'],
  cab:'#26282a',cabStyle:'slab',top:'concrete',splash:'subway',uppers:'shelves',hood:'steel',rug:'rugPersian',art:'urban',bedFrame:'#6b4028',bedTex:'leather',linen:'#ece8e0',throw:'#3d3f42',tile:'subway',vanity:'#3a3c3e',tub:'#f4f4f2',screen:'#0f0f10',plant:'fig',curtain:'#9a958c',chair:'#2a2c2e',lampShade:'#2a2c2e',
  stool:'metal',chairStyle:'metal',chairLegs:'black',armchair:'club',coffee:'block',side:'black',floorlamp:'industrial',legs:'black',sofaBase:'legs',bedLegs:'black',wardrobe:'black',pendant:'edison',media:'wood'},
 nordic:{floor:'ash',bathFloor:'tileL',wall:'#f7f7f5',feature:null,featureAt:[],ceiling:'#fbfbfa',ceil:'plain',
  wood:'#d9c4a2',woodTex:'oak',stone:'marbleW',metal:'chrome',fabric:'#c9cbcb',fabricTex:'boucle',fabric2:'#9fb3c4',fabric2Tex:'linen',pillow:['#9fb3c4','#e8c9c0','#f2efe8','#c9cbcb'],
  cab:'#f7f7f5',cabStyle:'flat',top:'oak',splash:'tileL',uppers:'cabinets',hood:'white',rug:'rugWool',art:'line',bedFrame:'#d9c4a2',bedTex:'oak',linen:'#ffffff',throw:'#9fb3c4',tile:'tileL',vanity:'#d9c4a2',tub:'#fbfbf9',screen:'#2a2c2e',plant:'fig',curtain:'#f4f4f2',chair:'#d9c4a2',lampShade:'#fbfaf6',
  stool:'wood',chairStyle:'spindle',chairLegs:'wood',armchair:'lounge',coffee:'woodRound',side:'wood',floorlamp:'globe',legs:'wood',sofaBase:'legs',bedLegs:'wood',wardrobe:'flat',pendant:'globe',media:'wood',tableTop:'wood'},
 minimal:{floor:'stoneL',bathFloor:'stoneL',wall:'#f8f8f7',feature:null,featureAt:[],ceiling:'#ffffff',ceil:'cove',floorTint:'#e9e8e5',
  wood:'#e8e6e2',woodTex:'oak',stone:'marbleW',metal:'chrome',fabric:'#f0eee9',fabricTex:'boucle',fabric2:'#6b6d70',fabric2Tex:'linen',pillow:['#d9d7d2','#6b6d70','#f6f5f2','#b9b7b2'],
  cab:'#fbfbfa',cabStyle:'flat',top:'marbleW',splash:'marbleW',uppers:'cabinets',hood:'white',rug:'rugGrey',art:'mono',bedFrame:'#f2f1ee',bedTex:'linen',linen:'#ffffff',throw:'#b9b7b2',tile:'marbleW',vanity:'#fbfbfa',tub:'#ffffff',screen:'#1a1a1a',plant:'bird',curtain:'#f7f7f5',chair:'#f0eee9',lampShade:'#ffffff',
  stool:'pedestal',chairStyle:'upholstered',chairLegs:'metal',armchair:'lounge',coffee:'block',side:'stone',floorlamp:'globe',legs:'metal',sofaBase:'plinth',bedLegs:'metal',wardrobe:'flat',pendant:'globe',media:'slab'},
 designer:{floor:'terrazzo',bathFloor:'terrazzo',wall:'#1f4f4a',feature:'marbleG',featureAt:['tv'],ceiling:'#f6f1ea',ceil:'coffer',
  wood:'#2a2422',woodTex:'oak',stone:'marbleP',metal:'brass',fabric:'#1f6b52',fabricTex:'velvet',fabric2:'#d99a2b',fabric2Tex:'velvet',pillow:['#e07a5f','#d99a2b','#f2e6d8','#7a5bd0'],
  cab:'#1f4f4a',cabStyle:'slab',top:'marbleG',splash:'marbleG',uppers:'glass',hood:'black',rug:'rugBold',art:'pop',bedFrame:'#c4654a',bedTex:'velvet',linen:'#f6f1ea',throw:'#d99a2b',tile:'marbleP',vanity:'#1f4f4a',tub:'#f6f1ea',screen:'#0f0f10',plant:'bird',curtain:'#e8c9c0',chair:'#e8a598',lampShade:'#f2e6d8',
  stool:'shell',chairStyle:'shell',chairLegs:'metal',armchair:'shell',coffee:'marbleRound',side:'stone',floorlamp:'globe',legs:'metal',sofaBase:'plinth',bedLegs:'metal',wardrobe:'glass',pendant:'chandelier',media:'fluted'},
 stone:{floor:'stoneL',bathFloor:'stoneL',wall:'#d9d6d0',feature:'stoneL',featureAt:['tv','bed'],ceiling:'#f2f0ec',ceil:'slats',
  wood:'#4a3a2c',woodTex:'oak',stone:'stoneL',metal:'black',fabric:'#a9a59d',fabricTex:'linen',fabric2:'#4a5a50',fabric2Tex:'leather',pillow:['#4a5a50','#c9c3b8','#2f3a40','#e9e4da'],
  cab:'#4a3a2c',cabTex:'oak',cabStyle:'flat',top:'stoneL',splash:'stoneL',uppers:'glass',hood:'black',rug:'rugGrey',art:'strata',bedFrame:'#4a3a2c',bedTex:'oak',linen:'#f4f2ee',throw:'#4a5a50',tile:'stoneL',vanity:'#4a3a2c',tub:'#efedea',screen:'#101010',plant:'fig',curtain:'#d9d6d0',chair:'#a9a59d',lampShade:'#e9e4da',
  stool:'metal',chairStyle:'upholstered',chairLegs:'black',armchair:'lounge',coffee:'block',side:'black',floorlamp:'industrial',legs:'black',sofaBase:'legs',bedLegs:'black',wardrobe:'black',pendant:'globe',media:'slab',tableTop:'stone'}
};// ---- materials -----------------------------------------------------------------------------------------------------------
function makeMats(T,L){
 const M={},std=o=>new T.MeshStandardMaterial({roughness:.75,metalness:0,...o});
 const metal={brass:'#c2a064',bronze:'#7a5a3e',gold:'#c9a35e',chrome:'#d8dde0',black:'#2a2b2d'};
 M.floor=std({map:tex(T,L.floor),color:L.floorTint||'#ffffff',roughness:L.floor==='concrete'||L.floor==='stoneL'?.3:L.floor==='terracotta'?.6:.45});M.bathFloor=std({map:tex(T,L.bathFloor),roughness:.25});
 M.wall=std({map:tex(T,'plaster'),color:L.wall,roughness:.9});M.ceiling=std({color:L.ceiling,roughness:.95});
 M.feature=L.feature?std({map:tex(T,L.feature),roughness:.35}):M.wall;M.wood=std({map:tex(T,L.woodTex),color:L.wood,roughness:.55});
 M.stone=std({map:tex(T,L.stone),roughness:.18});M.metal=std({color:metal[L.metal]||metal.brass,roughness:.28,metalness:1});M.chrome=std({color:metal.chrome,roughness:.12,metalness:1});
 M.black=std({color:'#141416',roughness:.4,metalness:.2});M.blackGlass=new T.MeshPhysicalMaterial({color:'#0b0b0c',roughness:.05,metalness:.1,clearcoat:1});
 const fab=(c,t)=>t==='velvet'?new T.MeshPhysicalMaterial({map:tex(T,'velvet'),color:c,roughness:.9,sheen:1,sheenRoughness:.5,sheenColor:new T.Color(c).lerp(new T.Color('#ffffff'),.35)}):std({map:tex(T,t),color:c,roughness:t==='leather'?.5:.95});
 M.fabric=fab(L.fabric,L.fabricTex);M.fabric2=fab(L.fabric2,L.fabric2Tex);M.chair=fab(L.chair,L.fabricTex==='velvet'?'velvet':'linen');
 M.pillows=L.pillow.map((c,i)=>fab(c,i%2?L.fabricTex:'linen'));M.linen=fab(L.linen,'linen');M.throw=fab(L.throw,L.fabricTex==='velvet'?'velvet':'boucle');M.bedFrame=fab(L.bedFrame,L.bedTex==='oak'?'linen':L.bedTex);if(L.bedTex==='oak')M.bedFrame=std({map:tex(T,'oak'),color:L.bedFrame,roughness:.55});
 M.cab=L.cabTex?std({map:tex(T,L.cabTex),color:L.cab,roughness:.5}):std({color:L.cab,roughness:.45});M.rattan=std({map:tex(T,'linen'),color:'#c9a46a',roughness:.85});M.rush=std({map:tex(T,'rugJute'),color:'#d9c08a',roughness:.95});M.blackSteel=std({color:'#1c1d1f',roughness:.5,metalness:.6});M.bulb=std({color:'#ffd9a0',emissive:'#ffb860',emissiveIntensity:2.2,roughness:.2});M.piano=new T.MeshPhysicalMaterial({color:'#0d0d0e',roughness:.08,clearcoat:1});M.keys=std({color:'#f6f4ee',roughness:.3});M.beam=std({map:tex(T,'oak'),color:L.beams||L.wood,roughness:.7});M.duct=std({color:'#8f9497',roughness:.35,metalness:.8});
 M.top=std({map:tex(T,L.top),roughness:.15});M.splash=std({map:tex(T,L.splash),roughness:.15});M.tile=std({map:tex(T,L.tile),roughness:.2});
 M.steel=std({color:'#c9ced1',roughness:.22,metalness:.9});/* V11.1: the lift car's walls are brushed steel that takes the light (they were mirror-bright and showed only sky, so the car looked open) */M.car=std({color:'#aab0b5',roughness:.6,metalness:.35});M.white=std({color:'#f6f6f3',roughness:.3});M.porcelain=new T.MeshPhysicalMaterial({color:'#fbfbf9',roughness:.15,clearcoat:.8});M.tub=new T.MeshPhysicalMaterial({color:L.tub,roughness:.2,clearcoat:.6});
 M.glass=new T.MeshPhysicalMaterial({color:'#dfeef0',roughness:.0,transparent:true,opacity:.09,depthWrite:false,side:T.DoubleSide});
 M.window=new T.MeshPhysicalMaterial({color:'#e8f2f4',roughness:.02,transparent:true,opacity:.07,depthWrite:false,side:T.DoubleSide,envMapIntensity:.6});
 M.mirror=std({color:'#cfd8db',roughness:.02,metalness:1});M.screen=new T.MeshPhysicalMaterial({color:L.screen,roughness:.08,clearcoat:1});
 M.light=std({color:'#fff7e6',emissive:'#ffe9c4',emissiveIntensity:1.6,roughness:.5});M.led=std({color:'#fff3dc',emissive:'#ffdca8',emissiveIntensity:2.2});M.flame=std({color:'#ff9a3c',emissive:'#ff7a1c',emissiveIntensity:2.5,transparent:true,opacity:.92});
 M.shade=new T.MeshStandardMaterial({color:L.lampShade,roughness:.9,emissive:L.lampShade,emissiveIntensity:.35,side:T.DoubleSide});
 M.leaf=std({color:'#3f6b34',roughness:.7,side:T.DoubleSide});M.leaf2=std({color:'#5a8a45',roughness:.7,side:T.DoubleSide});M.olive=std({color:'#7d8f6a',roughness:.8,side:T.DoubleSide});M.bark=std({color:'#5a4a3a',roughness:.9});M.soil=std({color:'#3a2c22',roughness:1});
 M.pot=std({map:tex(T,'terrazzo'),roughness:.4});M.ceramic=new T.MeshPhysicalMaterial({color:L.metal==='gold'?'#1d1d1f':'#efe9dc',roughness:.3,clearcoat:.5});M.book=['#2c4a6e','#a85a32','#e9e2d2','#3d5a40','#6b4a33','#c9a24a','#1f2023','#9fb3c4'].map(c=>std({color:c,roughness:.8}));
 M.rug=std({map:tex(T,L.rug),roughness:.95});M.curtain=new T.MeshStandardMaterial({color:L.curtain,roughness:.95,transparent:true,opacity:.92,side:T.DoubleSide});
 M.towel=fab('#f2efe8','boucle');M.rubber=std({color:'#1a1a1c',roughness:.9});M.oven=new T.MeshPhysicalMaterial({color:'#101011',roughness:.05,clearcoat:1});
 return M;}
// ---- shapes ----------------------------------------------------------------------------------------------------------------
// A box with rounded edges and true smooth normals (cushions, mattresses, table tops).
function rbox(T,w,h,d,r,seg=3){r=Math.min(r,w/2-.001,h/2-.001,d/2-.001);const g=new T.BoxGeometry(w,h,d,seg*2,seg*2,seg*2),P=g.attributes.position,N=g.attributes.normal,hw=w/2-r,hh=h/2-r,hd=d/2-r;
 for(let i=0;i<P.count;i++){let x=P.getX(i),y=P.getY(i),z=P.getZ(i);const cx=Math.max(-hw,Math.min(hw,x)),cy=Math.max(-hh,Math.min(hh,y)),cz=Math.max(-hd,Math.min(hd,z));let nx=x-cx,ny=y-cy,nz=z-cz;const l=Math.hypot(nx,ny,nz);if(l>1e-9){nx/=l;ny/=l;nz/=l;P.setXYZ(i,cx+nx*r,cy+ny*r,cz+nz*r);N.setXYZ(i,nx,ny,nz);}}return g;}
function lathe(T,pts,seg=24){return new T.LatheGeometry(pts.map(p=>new T.Vector2(p[0],p[1])),seg);}
class Room{
 constructor(T,M){this.T=T;this.M=M;this.lists=new Map();this.keep=[];}
 list(m){let L=this.lists.get(m);if(!L){L={p:[],n:[],u:[],i:[]};this.lists.set(m,L);}return L;}
 // Add a geometry moved by a matrix; UVs are projected in metres from the side the face looks at, so wood and stone
 // keep their real size on every piece.
 add(m,g,mx){const T=this.T,L=this.list(m),o=L.p.length/3,P=g.attributes.position,N=g.attributes.normal,v=new T.Vector3(),n=new T.Vector3(),nm=new T.Matrix3().getNormalMatrix(mx);
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(mx);n.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();L.p.push(v.x,v.y,v.z);L.n.push(n.x,n.y,n.z);const ax=Math.abs(n.x),ay=Math.abs(n.y),az=Math.abs(n.z);if(ay>=ax&&ay>=az)L.u.push(v.x,v.z);else if(ax>=az)L.u.push(v.z,v.y);else L.u.push(v.x,v.y);}
  if(g.index)for(let i=0;i<g.index.count;i++)L.i.push(g.index.getX(i)+o);else for(let i=0;i<P.count;i++)L.i.push(o+i);g.dispose();}
 // a mesh that keeps its own UVs (pictures, the television, the rugs)
 own(m,g,mx){const mesh=new this.T.Mesh(g,m);mesh.applyMatrix4(mx);mesh.receiveShadow=true;this.keep.push(mesh);return mesh;}
 build(name){const T=this.T,group=new T.Group();group.name=name;for(const[m,L]of this.lists){if(!L.i.length)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(L.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(L.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(L.u,2));g.setIndex(L.p.length/3>65535?new T.Uint32BufferAttribute(L.i,1):new T.Uint16BufferAttribute(L.i,1));g.computeBoundingSphere();const mesh=new T.Mesh(g,m);const flat=[this.M.wall,this.M.ceiling,this.M.feature,this.M.tile,this.M.light,this.M.led].includes(m);mesh.castShadow=!m.transparent&&!flat;mesh.receiveShadow=!m.transparent&&!flat;group.add(mesh);}for(const k of this.keep)group.add(k);return group;}
}
// An item's own frame: x across its front, z towards its front, y up from the floor; F(x,y,z,rx,ry,rz,sx,sy,sz)
// gives the matrix of a part in the home's coordinates.
function frameOf(T,it){const a=[0,PI/2,PI,-PI/2][it.r],base=new T.Matrix4().makeTranslation(it.x,it.y||0,it.z).multiply(new T.Matrix4().makeRotationY(a));
 return(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>base.clone().multiply(new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz)));}
// ---- the furniture kit ------------------------------------------------------------------------------------------------------
function kit(room,L,design){
 const T=room.T,M=room.M,box=(w,h,d)=>new T.BoxGeometry(w,h,d),cyl=(r1,r2,h,s=20)=>new T.CylinderGeometry(r1,r2,h,s),rb=(w,h,d,r,s)=>rbox(T,w,h,d,r,s);
 const A=(m,g,F,x,y,z,rx,ry,rz,sx,sy,sz)=>room.add(m,g,F(x,y,z,rx,ry,rz,sx,sy,sz));
 const leg=(F,x,z,h,r=.022,m=M.metal)=>A(m,cyl(r,r*.8,h,10),F,x,h/2,z);
 const handle=(F,x,y,z,len,vertical,m=M.metal)=>{if(L.cabStyle==='flat')return;if(vertical)A(m,cyl(.008,.008,len,8),F,x,y,z+.022);else A(m,cyl(.008,.008,len,8),F,x,y,z+.022,0,0,PI/2);for(const e of[-1,1]){const dx=vertical?0:e*len*.42,dy=vertical?e*len*.42:0;A(m,cyl(.006,.006,.022,6),F,x+dx,y+dy,z+.011,PI/2,0,0);}};
 const pillow=(F,x,y,z,w,h,ry,rz,m)=>A(m,rb(w,h,.14,.06,3),F,x,y,z,0,ry,rz);
 // a curved back as a solid piece: the part of a ring between radii r0 and r1, from angle a0 to a1 measured from the back
 const ring=(m,F,x,y0,z,r0,r1,h,a0,a1)=>{const s=new T.Shape(),N=24;for(let i=0;i<=N;i++){const a=a0+(a1-a0)*i/N;i?s.lineTo(Math.sin(a)*r1,Math.cos(a)*r1):s.moveTo(Math.sin(a)*r1,Math.cos(a)*r1);}for(let i=N;i>=0;i--){const a=a0+(a1-a0)*i/N;s.lineTo(Math.sin(a)*r0,Math.cos(a)*r0);}A(m,new T.ExtrudeGeometry(s,{depth:h-.03,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,curveSegments:6}),F,x,y0+.015,z,-PI/2,0,0);};
 // a ceiling light hanging on its cord: the bottom of the light at y (in the item's frame)
 const pend=(F,x,y,z,kind)=>{A(M.black,cyl(.004,.004,3-y-.2,4),F,x,y+.2+(3-y-.2)/2,z);
  if(kind==='ring'){A(M.metal,new T.TorusGeometry(.18,.012,8,24),F,x,y+.14,z,PI/2,0,0);A(M.led,new T.TorusGeometry(.18,.005,6,24),F,x,y+.13,z,PI/2,0,0);}
  else if(kind==='globe'){A(M.light,new T.SphereGeometry(.13,18,12),F,x,y+.08,z);A(M.metal,cyl(.03,.04,.05,12),F,x,y+.22,z);}
  else if(kind==='edison'){A(M.blackSteel,cyl(.025,.03,.06,10),F,x,y+.2,z);A(M.bulb,new T.SphereGeometry(.05,10,8),F,x,y+.1,z,0,0,0,1,1.4,1);for(let i=0;i<3;i++)A(M.blackSteel,new T.TorusGeometry(.07,.004,4,16),F,x,y+.04+i*.06,z,PI/2,0,0);}
  else if(kind==='rattan'){A(M.rattan,new T.SphereGeometry(.22,18,10,0,TAU,0,PI*.5),F,x,y+.02,z);A(M.light,new T.SphereGeometry(.04,8,6),F,x,y+.06,z);}
  else{A(M.metal,lathe(T,[[0,.2],[.03,.2],[.06,.14],[.14,.02],[.15,0],[.145,0],[.135,.02],[.055,.14],[.0,.18]],20),F,x,y,z);A(M.light,new T.SphereGeometry(.045,10,8),F,x,y+.04,z);}};
 return{
 counter(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h,sinkX=-w/2+1.4,hobX=w/2-1.3;
  A(M.black,box(w-.02,.1,d-.1),F,0,.05,-.04);A(M.cab,box(w,h-.14,d-.04),F,0,.1+(h-.14)/2,-.02);
  // doors and drawers on the front (3 mm gaps), with handles or a finger groove
  const fronts=[];let x=-w/2;const widths=[];while(x<w/2-.05){const ww=Math.min(.6,w/2-x);widths.push([x,ww]);x+=ww;}
  for(const[x0,ww]of widths){const cx=x0+ww/2,isHob=Math.abs(cx-hobX)<.35;if(isHob){for(let k=0;k<3;k++){const y0=.12+k*.25;A(M.cab,rb(ww-.006,.24,.02,.003,1),F,cx,y0+.12,d/2-.03);if(L.cabStyle==='shaker')A(M.cab,box(ww-.1,.14,.006),F,cx,y0+.12,d/2-.016);handle(F,cx,y0+.2,d/2-.03,ww*.5,false);}}
   else{A(M.cab,rb(ww-.006,h-.16-.006,.02,.003,1),F,cx,.1+(h-.16)/2,d/2-.03);if(L.cabStyle==='shaker'){A(M.cab,box(ww-.12,h-.36,.006),F,cx,.1+(h-.16)/2,d/2-.016);}handle(F,cx+ww*.36*(Math.round(cx*10)%2?1:-1),h-.28,d/2-.03,.22,true);}}
  // the worktop in four pieces round the sink, the sink bowl, the tap, the hob
  const t=.035,ty=h-t,sw=.62,sd=.42,sz=.02;
  A(M.top,box(sinkX-sw/2+w/2,t,d+.02),F,(-w/2+sinkX-sw/2)/2,ty+t/2,0);A(M.top,box(w/2-(sinkX+sw/2),t,d+.02),F,(sinkX+sw/2+w/2)/2,ty+t/2,0);
  A(M.top,box(sw,t,(d+.02)/2-sd/2+sz),F,sinkX,ty+t/2,(d+.02)/2-((d+.02)/2-sd/2+sz)/2);A(M.top,box(sw,t,(d+.02)/2-sd/2-sz),F,sinkX,ty+t/2,-(d+.02)/2+((d+.02)/2-sd/2-sz)/2);
  {const g=box(sw-.01,.2,sd-.01);const idx=g.index.array.slice();/* drop the top face of the bowl */g.setIndex(Array.from(idx).filter((_,i)=>Math.floor(i/6)!==2));A(M.steel,g,F,sinkX,ty-.1+.0,sz);}
  A(M.metal,cyl(.018,.022,.32,12),F,sinkX,h+.16,-d/2+.12);A(M.metal,new T.TorusGeometry(.12,.014,8,16,PI),F,sinkX,h+.32,-d/2+.12+.12*0,0,PI/2,0);A(M.metal,cyl(.012,.012,.06,8),F,sinkX,h+.29,-d/2+.24);
  A(M.blackGlass,rb(.78,.008,.5,.003,1),F,hobX,h+.004,.02);for(const[dx,dz,rr]of[[-.2,-.11,.09],[.2,-.11,.07],[-.2,.12,.07],[.2,.12,.1]])A(M.steel,new T.TorusGeometry(rr,.003,4,28),F,hobX+dx,h+.0085,.02+dz,PI/2,0,0);
  // the wall behind and what is on it: the splash, shelves or wall cupboards, the hood
  const top=it.lowSplash?1.15:L.uppers==='shelves'?2.15:2.3;A(M.splash,box(w,top-h,.012),F,0,h+(top-h)/2,-d/2+.012);
  /* V9.5: under a window (the houses) the splash stops low and there is nothing on the wall */if(it.lowSplash){}else if(L.uppers==='shelves'){for(const y of[1.55,2.0]){A(M.wood,rb(w*.42,.045,.28,.008,1),F,-w/2+w*.21+.05,y,-d/2+.16);for(let i=0;i<7;i++){const xx=-w/2+.2+i*.27;if(i%3===0){A(M.ceramic,cyl(.11,.11,.025,20),F,xx,y+.035,-d/2+.16);A(M.ceramic,cyl(.1,.1,.025,20),F,xx,y+.06,-d/2+.16);}else if(i%3===1)A(M.ceramic,lathe(T,[[0,0],[.05,0],[.06,.04],[.045,.12],[.035,.14],[0,.14]],14),F,xx,y+.023,-d/2+.16);else A(M.glass,cyl(.035,.03,.12,12),F,xx,y+.083,-d/2+.16);}}}
  else{A(M.cab,box(w-1.0,.75,.36),F,-.5,1.55+.375,-d/2+.2);for(let i=0;i<Math.floor((w-1)/.5);i++){const cx=-w/2+.25+i*.5;A(L.uppers==='glass'?M.blackGlass:M.cab,rb(.494,.73,.02,.003,1),F,cx,1.925,-d/2+.39);}A(M.led,box(w-1.02,.01,.02),F,-.5,1.545,-d/2+.3);}
  if(L.hood==='plaster'||L.hood==='travertine'||L.hood==='white'||L.hood==='steel'){const hm=L.hood==='plaster'?M.wall:L.hood==='travertine'?M.stone:L.hood==='steel'?M.steel:M.white;const g=new T.CylinderGeometry(.42,.62,.75,4,1);A(hm,g,F,hobX,2.15,-d/2+.36,0,PI/4,0,1,1,.62);A(hm,box(.5,.5,.35),F,hobX,2.75,-d/2+.2);}else{A(M.black,box(.9,.06,.48),F,hobX,1.65,-d/2+.26);A(M.black,box(.3,1.25,.25),F,hobX,2.3,-d/2+.14);}},
 tall(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;A(M.cab,box(w,h,d-.04),F,0,h/2,-.02);
  const fw=.9,ow=w-fw;A(M.cab,rb(fw-.006,h-.012,.02,.003,1),F,-w/2+fw/2,h/2,d/2-.03);handle(F,-w/2+fw-.06,1.2,d/2-.03,1.2,true);
  A(M.cab,rb(ow-.006,.7,.02,.003,1),F,w/2-ow/2,.36,d/2-.03);handle(F,w/2-ow/2,.62,d/2-.03,.4,false);
  for(const y of[.75,1.35]){A(M.oven,rb(ow-.04,.56,.025,.004,1),F,w/2-ow/2,y+.28,d/2-.03);A(M.steel,box(ow-.06,.04,.01),F,w/2-ow/2,y+.5,d/2-.012);A(M.chrome,cyl(.01,.01,ow-.2,8),F,w/2-ow/2,y+.45,d/2+.005,0,0,PI/2);}
  A(M.cab,rb(ow-.006,h-1.95-.01,.02,.003,1),F,w/2-ow/2,1.95+(h-1.95)/2,d/2-.03);},
 island(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h,t=it.t==='wood'?.06:it.t==='steel'?.05:.04;
  if(it.t==='waterfall'||it.t==='slab'||it.t==='steel'||it.t==='tiled'){A(M.cab,box(w-.08,h-t-.1,d-.36),F,0,.1+(h-t-.1)/2,-.16);A(M.black,box(w-.12,.1,d-.42),F,0,.05,-.18);for(let i=0;i<Math.floor((w-.1)/.6);i++){const cx=-w/2+.35+i*.6;A(M.cab,rb(.594,h-t-.12,.02,.003,1),F,cx,.11+(h-t-.12)/2,-d/2+.0);handle(F,cx+.22,h-t-.2,-d/2+.0,.2,true);}
   if(it.t==='tiled'){/* tiles on the stool side and the two ends */A(M.splash,box(w-.1,h-t-.12,.015),F,0,.11+(h-t-.12)/2,.1675);for(const e of[-1,1])A(M.splash,box(.015,h-t-.12,d-.38),F,e*(w/2-.0325),.11+(h-t-.12)/2,-.16);}
   if(it.t==='steel'){A(M.steel,box(w,t,d),F,0,h-t/2,0);A(M.steel,box(w-.2,.025,d-.5),F,0,.3,-.16+.0);}
   else{A(M.top,box(w,t,d),F,0,h-t/2,0);if(it.t==='waterfall')for(const e of[-1,1])A(M.top,box(t,h-t,d),F,e*(w/2-t/2),(h-t)/2,0);}}
  else{A(M.cab,box(w-.3,h-t-.1,d-.4),F,0,.1+(h-t-.1)/2,-.12);A(M.black,box(w-.34,.1,d-.44),F,0,.05,-.14);for(let i=0;i<Math.floor((w-.3)/.58);i++){const cx=-(w-.3)/2+.29+i*.58;A(M.cab,rb(.574,h-t-.12,.02,.003,1),F,cx,.11+(h-t-.12)/2,-d/2+.08);}A(M.wood,rb(w,t,d,.01,2),F,0,h-t/2,0);for(const e of[-1,1])A(M.wood,box(.08,h-t,.08),F,e*(w/2-.06),(h-t)/2,d/2-.08);}
  // pendants over the island
  for(const e of[-1,0,1])pend(F,e*w*.3,1.86,0,L.pendant==='chandelier'?'globe':L.pendant);},
 stool(it){const F=frameOf(T,it),h=it.h,S=L.stool,seat=L.fabricTex==='velvet'?M.fabric:M.chair;
  if(S==='wood'){A(M.fabric2,rb(.4,.06,.36,.02,2),F,0,h-.03,0);A(M.wood,cyl(.2,.2,.03,20),F,0,h-.075,0);for(const[x,z]of[[-.15,-.13],[.15,-.13],[-.15,.13],[.15,.13]])A(M.wood,cyl(.018,.015,h-.09,8),F,x,(h-.09)/2,z,z>0?.05:-.05,0,x>0?-.05:.05);A(M.metal,new T.TorusGeometry(.17,.008,6,24),F,0,.28,0,PI/2,0,0);return;}
  if(S==='rush'){/* a wooden stool with a woven rush seat and a low back */A(M.rush,rb(.4,.045,.38,.01,2),F,0,h-.03,0);A(M.wood,box(.44,.04,.42),F,0,h-.07,0);for(const[x,z]of[[-.19,-.17],[.19,-.17],[-.19,.17],[.19,.17]])A(M.wood,cyl(.02,.017,h-.07,8),F,x,(h-.07)/2,z);for(const y of[.25,.45])for(const e of[-1,1]){A(M.wood,box(.36,.025,.025),F,0,y,e*.17);A(M.wood,box(.025,.025,.32),F,e*.19,y,0);}for(const x of[-.19,.19])A(M.wood,cyl(.018,.018,.28,8),F,x,h+.12,-.17);A(M.wood,box(.4,.07,.03),F,0,h+.2,-.17);return;}
  if(S==='metal'){/* an industrial stool: black steel legs, a round wooden seat */A(M.wood,cyl(.19,.19,.04,24),F,0,h-.02,0);for(let i=0;i<4;i++){const a=i/4*TAU+PI/4;A(M.blackSteel,cyl(.012,.012,h-.04,6),F,Math.cos(a)*.13,(h-.04)/2,Math.sin(a)*.13,Math.sin(a)*.12,0,-Math.cos(a)*.12);}A(M.blackSteel,new T.TorusGeometry(.17,.01,6,20),F,0,.3,0,PI/2,0,0);return;}
  if(S==='shell'){/* a velvet shell on thin brass legs */A(M.chair,rb(.44,.08,.42,.035,3),F,0,h-.03,0);ring(M.chair,F,0,h-.01,0,.18,.23,.32,-1.9,1.9);for(const[x,z]of[[-.17,-.15],[.17,-.15],[-.17,.15],[.17,.15]])A(M.metal,cyl(.01,.01,h-.06,6),F,x,(h-.06)/2,z);A(M.metal,new T.TorusGeometry(.17,.007,6,20),F,0,.3,0,PI/2,0,0);return;}
  A(seat,rb(.42,.07,.4,.03,3),F,0,h-.035,0);A(seat,rb(.4,.2,.06,.025,2),F,0,h+.1,-.17,-.12,0,0);A(M.metal,cyl(.025,.025,h-.07,12),F,0,(h-.07)/2,0);A(M.metal,cyl(.2,.22,.02,24),F,0,.01,0);A(M.metal,new T.TorusGeometry(.17,.009,6,24),F,0,.3,0,PI/2,0,0);},
 table(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h,topM=L.tableTop==='wood'?M.wood:M.stone;
  if(it.t==='round'){A(topM,cyl(w/2,w/2,.035,40),F,0,h-.018,0);if(L.tableTop==='wood'){for(let i=0;i<3;i++){const a=i/3*TAU;A(M.wood,cyl(.025,.02,h-.035,8),F,Math.cos(a)*.3,(h-.035)/2,Math.sin(a)*.3,Math.sin(a)*.08,0,-Math.cos(a)*.08);}}else{A(M.metal,cyl(.08,.08,h-.05,16),F,0,(h-.05)/2,0);A(M.metal,cyl(.32,.34,.03,32),F,0,.015,0);}}
  else if(it.t==='oval6'){const s=new T.Shape();s.absellipse(0,0,w/2,d/2,0,TAU,false,0);const g=new T.ExtrudeGeometry(s,{depth:.04,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,curveSegments:40});A(L.tableTop==='wood'?M.wood:M.stone,g,F,0,h-.012,0,PI/2,0,0);for(const e of[-1,1]){A(L.tableTop==='wood'?M.wood:M.metal,cyl(.12,.05,h-.06,20),F,e*w*.25,(h-.06)/2,0);A(L.tableTop==='wood'?M.wood:M.metal,cyl(.25,.25,.02,24),F,e*w*.25,.01,0);}}
  else if(it.t==='trestle'){A(M.wood,rb(w,.06,d,.008,2),F,0,h-.03,0);const lm=L.legs==='black'?M.blackSteel:M.wood;for(const e of[-1,1]){A(lm,box(.09,h-.06,.09),F,e*(w/2-.3),(h-.06)/2,0);A(lm,box(.09,.08,d-.1),F,e*(w/2-.3),h-.1,0);A(lm,box(.1,.07,d-.16),F,e*(w/2-.3),.035,0);}A(lm,box(w-.7,.06,.06),F,0,.3,0);}
  else if(L.tableTop==='stone'){A(M.stone,rb(w,.06,d,.01,2),F,0,h-.03,0);for(const e of[-1,1]){A(M.blackSteel,box(.05,h-.06,d-.2),F,e*(w/2-.35),(h-.06)/2,0);A(M.blackSteel,box(.05,.05,d-.12),F,e*(w/2-.35),.025,0);}}
  else{A(M.wood,rb(w,.04,d,.008,2),F,0,h-.02,0);for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])A(M.wood,cyl(.028,.018,h-.04,10),F,x*(w/2-.1),(h-.04)/2,z*(d/2-.1),z*.04,0,-x*.04);A(M.wood,box(w-.3,.05,.03),F,0,h-.07,d/2-.12);A(M.wood,box(w-.3,.05,.03),F,0,h-.07,-d/2+.12);}
  // what is on the table, and the light over it
  A(M.ceramic,lathe(T,[[0,0],[.08,0],[.11,.06],[.06,.22],[.04,.3],[0,.3]],18),F,0,h,0);for(let i=0;i<5;i++)A(M.leaf2,new T.SphereGeometry(.05,6,5),F,(i-2)*.02,h+.34+(i%2)*.04,(i%3-1)*.02,0,0,0,1,.4,1.6);
  if(L.pendant==='chandelier'){A(M.black,cyl(.004,.004,.75,4),F,0,2.625,0);A(M.metal,new T.TorusGeometry(.5,.016,8,40),F,0,2.2,0,PI/2,0,0);for(let i=0;i<10;i++){const a=i/10*TAU;A(M.metal,cyl(.004,.004,.12,4),F,Math.cos(a)*.5,2.15,Math.sin(a)*.5);A(M.light,new T.SphereGeometry(.07,12,10),F,Math.cos(a)*.5,2.05,Math.sin(a)*.5);}A(M.metal,cyl(.03,.03,.08,12),F,0,2.22,0);for(let i=0;i<4;i++){const a=i/4*TAU+PI/4;A(M.metal,cyl(.006,.006,.47,6),F,Math.cos(a)*.25,2.2,-Math.sin(a)*.25,0,a,PI/2);}}
  else if(it.t==='round')pend(F,0,1.75,0,L.pendant);else for(const e of[-1,1])pend(F,e*w*.22,1.78,0,L.pendant);},
 chair(it){const F=frameOf(T,it),h=it.h,sh=.46,C=L.chairStyle,legM=L.chairLegs==='wood'?M.wood:L.chairLegs==='black'?M.blackSteel:M.metal;
  if(it.t==='desk'){A(M.black,cyl(.27,.27,.03,5),F,0,.05,0);A(M.chrome,cyl(.025,.025,.38,10),F,0,.25,0);A(M.fabric,rb(.48,.08,.46,.03,3),F,0,sh,0);A(M.fabric,rb(.46,.5,.07,.03,3),F,0,sh+.32,-.2,-.1,0,0);return;}
  if(C==='wishbone'){A(M.wood,box(.44,.03,.42),F,0,sh-.015,0);A(design==='warm'?M.fabric2:M.rush,rb(.4,.035,.38,.01,2),F,0,sh+.015,0);for(const[x,z]of[[-.19,-.18],[.19,-.18],[-.19,.18],[.19,.18]])A(M.wood,cyl(.017,.014,sh-.03,8),F,x,(sh-.03)/2,z);A(M.wood,new T.TorusGeometry(.2,.014,6,20,PI),F,0,sh+.3,-.18,0,0,0);for(const x of[-.19,.19])A(M.wood,cyl(.014,.014,.32,8),F,x,sh+.15,-.19);A(M.wood,box(.04,.25,.02),F,0,sh+.15,-.19);return;}
  if(C==='ladder'){A(M.rush,rb(.42,.04,.4,.01,2),F,0,sh,0);A(M.wood,box(.46,.035,.44),F,0,sh-.035,0);for(const[x,z]of[[-.2,-.18],[.2,-.18],[-.2,.18],[.2,.18]])A(M.wood,cyl(.02,.018,z<0?sh+.5:sh-.05,8),F,x,(z<0?sh+.5:sh-.05)/2,z);for(let i=0;i<3;i++)A(M.wood,rb(.4,.055,.022,.008,1),F,0,sh+.18+i*.13,-.18);A(M.wood,box(.4,.022,.022),F,0,.18,.18);A(M.wood,box(.022,.022,.36),F,-.2,.15,0);A(M.wood,box(.022,.022,.36),F,.2,.15,0);return;}
  if(C==='metal'){A(M.wood,rb(.42,.03,.4,.01,2),F,0,sh,0);for(const[x,z]of[[-.19,-.17],[.19,-.17],[-.19,.17],[.19,.17]])A(M.blackSteel,cyl(.011,.011,sh-.015,6),F,x,(sh-.015)/2,z,z>0?.05:-.03,0,x>0?-.04:.04);for(const x of[-.19,.19])A(M.blackSteel,cyl(.011,.011,.42,6),F,x,sh+.2,-.19);A(M.blackSteel,rb(.4,.16,.02,.008,1),F,0,sh+.34,-.2,-.1,0,0);A(M.blackSteel,box(.36,.012,.012),F,0,.16,.17);return;}
  if(C==='spindle'){A(M.wood,new T.CylinderGeometry(.23,.23,.035,24),F,0,sh,0);for(let i=0;i<4;i++){const a=i/4*TAU+PI/4;A(M.wood,cyl(.017,.014,sh-.02,8),F,Math.cos(a)*.17,(sh-.02)/2,Math.sin(a)*.17,Math.sin(a)*.1,0,-Math.cos(a)*.1);}A(M.wood,new T.TorusGeometry(.215,.016,6,24,PI*.9),F,0,sh+.37,0,-PI/2,0,PI*.05);for(let i=0;i<7;i++){const a=PI*(.12+i*.127);A(M.wood,cyl(.008,.008,.36,6),F,Math.cos(a)*.215,sh+.18,-Math.sin(a)*.215+.0);}A(M.fabric2,cyl(.2,.2,.03,20),F,0,sh+.03,0);return;}
  if(C==='shell'){A(M.chair,rb(.46,.09,.44,.04,3),F,0,sh,.01);ring(M.chair,F,0,sh+.02,.02,.2,.25,.44,-1.95,1.95);for(const[x,z]of[[-.18,-.16],[.18,-.16],[-.18,.16],[.18,.16]])A(M.metal,cyl(.011,.009,sh-.045,6),F,x,(sh-.045)/2,z,z>0?.06:-.06,0,x>0?-.05:.05);return;}
  const m=L.fabricTex==='velvet'?M.fabric:M.chair;A(m,rb(.46,.09,.44,.035,3),F,0,sh,0);A(m,rb(.46,.42,.08,.035,3),F,0,sh+.28,-.19,-.12,0,0);
  for(const[x,z]of[[-.19,-.17],[.19,-.17],[-.19,.17],[.19,.17]])A(legM,cyl(.015,.012,sh-.045,8),F,x,(sh-.045)/2,z,z>0?.06:-.08,0,x>0?-.05:.05);},
 sofa(it){const F=frameOf(T,it),m=M.fabric,depth=it.d,ht=it.h,legM=L.legs==='wood'?M.wood:L.legs==='black'?M.blackSteel:M.metal,P=M.pillows;
  if(it.t==='curved'){/* a curved sofa round the coffee table: its parts are sectors of a ring centred towards the table */const R=1.9,ri=1.02,c=1.2,a0=-1.35,a1=1.35,baseY=.1,seatTop=.44;
   const sector=(r0,r1,y0,y1,mat,b0=a0,b1=a1)=>{const s=new T.Shape(),N=28;for(let i=0;i<=N;i++){const a=b0+(b1-b0)*i/N;const p=[Math.sin(a)*r1,Math.cos(a)*r1-c];i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]);}for(let i=N;i>=0;i--){const a=b0+(b1-b0)*i/N;s.lineTo(Math.sin(a)*r0,Math.cos(a)*r0-c);}
    A(mat,new T.ExtrudeGeometry(s,{depth:y1-y0,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:3,curveSegments:8}),F,0,y0+.025,0,-PI/2,0,0);};
   sector(ri,R,baseY,seatTop-.17,m);for(let k=0;k<3;k++){const b0=a0+(a1-a0)*k/3+.01,b1=a0+(a1-a0)*(k+1)/3-.01;sector(ri+.03,R-.27,seatTop-.17,seatTop-.02,m,b0,b1);}sector(R-.26,R-.02,baseY,ht-.05,m);
   if(L.sofaBase==='plinth')sector(ri+.08,R-.08,0,baseY-.05,M.metal);else for(const a of[-1.1,-.4,.4,1.1])A(legM,cyl(.025,.02,baseY,8),F,Math.sin(a)*(R-.3),baseY/2,c-Math.cos(a)*(R-.3));
   for(const[a,i]of[[-.8,0],[-.3,1],[.3,2],[.8,3]])A(P[i],rb(.44,.42,.14,.06,3),F,Math.sin(a)*(R-.42),seatTop+.2,c-Math.cos(a)*(R-.42),-.25,-a,0);return;}
  // the parts of every shape are written as boxes in the item's own frame [x0,x1,z0,z1]: seat runs and back runs
  const runs=[],backs=[],arms=[];
  if(it.t==='l'||it.t==='modular'){runs.push([-it.w/2,it.w/2,-depth/2,depth/2]);runs.push([it.w/2-.95,it.w/2,depth/2,depth/2+1.55]);backs.push([-it.w/2,it.w/2,-depth/2,-depth/2+.24]);arms.push([-it.w/2,-it.w/2+.2,-depth/2,depth/2]);arms.push([it.w/2-.95,it.w/2,depth/2+1.35,depth/2+1.55,'end']);}
  else if(it.t==='u'){runs.push([-it.w/2,it.w/2,-depth/2,depth/2]);runs.push([-it.w/2,-it.w/2+.95,depth/2,depth/2+1.65]);runs.push([it.w/2-.95,it.w/2,depth/2,depth/2+1.65]);backs.push([-it.w/2,it.w/2,-depth/2,-depth/2+.24]);backs.push([-it.w/2,-it.w/2+.22,depth/2,depth/2+1.65]);backs.push([it.w/2-.22,it.w/2,depth/2,depth/2+1.65]);}
  else{runs.push([-it.w/2,it.w/2,-depth/2,depth/2]);backs.push([-it.w/2,it.w/2,-depth/2,-depth/2+.24]);arms.push([-it.w/2,-it.w/2+.2,-depth/2,depth/2]);arms.push([it.w/2-.2,it.w/2,-depth/2,depth/2]);}
  const chester=it.t==='chesterfield',baseY=L.sofaBase==='plinth'?.12:.08,seatTop=.44;
  for(const[x0,x1,z0,z1]of runs){A(m,rb(x1-x0,seatTop-.14-baseY,z1-z0,.04,2),F,(x0+x1)/2,baseY+(seatTop-.14-baseY)/2,(z0+z1)/2);
   // seat cushions about 0.8 m wide, laid along the run's longer side
   const along=(x1-x0)>=(z1-z0),len=along?x1-x0:z1-z0,n=Math.max(1,Math.round(len/.85)),cw=len/n;
   for(let i=0;i<n;i++){const cc=(along?x0:z0)+cw*(i+.5),cx=along?cc:(x0+x1)/2,cz=along?(z0+z1)/2+.06:cc,sw=along?cw-.02:x1-x0-.04,sd=along?z1-z0-.28:cw-.02;A(m,rb(sw,.16,sd,.07,3),F,cx,seatTop-.08,cz);}}
  for(const[x0,x1,z0,z1]of backs){A(m,rb(x1-x0,ht-baseY,z1-z0,.06,2),F,(x0+x1)/2,baseY+(ht-baseY)/2,(z0+z1)/2);}
  // back cushions leaning on the back, or (a Chesterfield) a buttoned back
  {const b=backs[0];if(chester){for(let i=0;i<10;i++)for(let j=0;j<2;j++)A(M.fabric,new T.SphereGeometry(.014,6,4),F,b[0]+.3+(i+j*.5)*(b[1]-b[0]-.6)/9.5,seatTop+.16+j*.17,b[3]+.002);}else{const n=Math.max(1,Math.round((b[1]-b[0])/.85)),cw=(b[1]-b[0])/n;for(let i=0;i<n;i++)A(m,rb(cw-.04,.46,.2,.08,3),F,b[0]+cw*(i+.5),seatTop+.22,b[3]+.08,-.18,0,0);}}
  for(const a of arms){const[x0,x1,z0,z1]=a;if(a[4]==='end')A(m,rb(x1-x0,.28,z1-z0,.06,2),F,(x0+x1)/2,seatTop-.02,(z0+z1)/2);else if(chester){A(m,rb(x1-x0,ht-.06-baseY,z1-z0,.05,2),F,(x0+x1)/2,baseY+(ht-.06-baseY)/2,(z0+z1)/2);A(m,cyl(.11,.11,z1-z0,16),F,(x0+x1)/2+(x0<0?-.02:.02),ht-.08,(z0+z1)/2,PI/2,0,0);}else A(m,rb(x1-x0,ht-.18-baseY,z1-z0,.07,2),F,(x0+x1)/2,baseY+(ht-.18-baseY)/2,(z0+z1)/2);}
  // feet or a plinth
  if(L.sofaBase==='plinth')A(M.metal,box(it.w-.1,.1,depth-.16),F,0,.05,-.01);else for(const[x0,x1,z0,z1]of runs)for(const[x,z]of[[x0+.08,z0+.08],[x1-.08,z0+.08],[x0+.08,z1-.08],[x1-.08,z1-.08]])A(legM,cyl(.025,.02,baseY,8),F,x,baseY/2,z);
  // scatter cushions
  pillow(F,-it.w/2+.45,seatTop+.2,-depth/2+.36,.48,.46,.25,.12,P[0]);pillow(F,-it.w/2+.85,seatTop+.18,-depth/2+.4,.44,.42,-.1,-.08,P[1]);pillow(F,it.w/2-.5,seatTop+.2,-depth/2+.36,.48,.46,-.3,-.1,P[2]);pillow(F,it.w/2-1.0,seatTop+.17,-depth/2+.42,.42,.4,.15,.06,P[3]);
  if(it.t==='l')A(M.throw,rb(.9,.03,.7,.012,2),F,it.w/2-.48,seatTop+.01,depth/2+.9,0,.2,0);},
 armchair(it){const F=frameOf(T,it),w=it.w,d=it.d,S=L.armchair;
  if(S==='sling'){for(const e of[-1,1]){A(M.wood,box(.05,.05,d-.05),F,e*(w/2-.05),.22,0,-.08,0,0);A(M.wood,box(.05,.5,.05),F,e*(w/2-.05),.25,d/2-.1);A(M.wood,box(.05,.62,.05),F,e*(w/2-.05),.31,-d/2+.1,-.2,0,0);A(M.wood,box(.06,.04,d-.1),F,e*(w/2-.05),.52,0);}A(M.fabric2,rb(w-.14,.05,d-.2,.02,2),F,0,.3,.02,-.06,0,0);A(M.fabric2,rb(w-.14,.55,.06,.02,2),F,0,.58,-d/2+.16,-.25,0,0);A(M.fabric,rb(w-.2,.1,d-.3,.04,3),F,0,.37,.04);return;}
  if(S==='barrel'){ring(M.fabric,F,0,.34,0,w/2-.08,w/2,.64,-2.35,2.35);A(M.fabric,rb(w-.16,.14,d-.16,.06,3),F,0,.42,.02);A(M.fabric,cyl(w/2-.02,w/2-.04,.3,32),F,0,.2,0);A(M.metal,new T.TorusGeometry(w/2-.06,.014,8,32),F,0,.04,0,PI/2,0,0);for(let i=0;i<3;i++){const a=i/3*TAU;A(M.metal,cyl(.012,.012,.05,6),F,Math.cos(a)*(w/2-.06),.025,Math.sin(a)*(w/2-.06));}return;}
  if(S==='rattan'){/* a woven rattan armchair with a linen cushion */A(M.rattan,new T.CylinderGeometry(w/2-.02,w/2-.1,.36,28,1,false),F,0,.26,0);ring(M.rattan,F,0,.4,-.02,w/2-.06,w/2,.44,-2.5,2.5);A(M.fabric,rb(w-.2,.12,d-.2,.05,3),F,0,.49,.03);A(M.pillows[1],rb(.4,.32,.12,.05,3),F,0,.68,-d/2+.25,-.2,0,0);for(let i=0;i<4;i++){const a=i/4*TAU+PI/4;A(M.wood,cyl(.018,.015,.1,8),F,Math.cos(a)*(w/2-.14),.05,Math.sin(a)*(w/2-.14));}return;}
  if(S==='club'){/* a leather club chair: deep seat, rolled arms, studs */A(M.fabric,rb(w,.32,d,.07,3),F,0,.22,0);A(M.fabric,rb(w-.3,.14,d-.25,.06,3),F,0,.45,.06);A(M.fabric,rb(w-.08,.48,.2,.08,3),F,0,.66,-d/2+.12,-.08,0,0);for(const e of[-1,1]){A(M.fabric,rb(.17,.36,d-.02,.08,3),F,e*(w/2-.085),.5,0);A(M.fabric,cyl(.09,.09,d-.04,16),F,e*(w/2-.085),.68,0,PI/2,0,0);for(let i=0;i<7;i++)A(M.metal,new T.SphereGeometry(.009,6,4),F,e*(w/2-.17),.42+i*.002,-d/2+.12+i*(d-.24)/6+.0,0,0,0);}for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])A(M.wood,cyl(.025,.02,.06,8),F,x*(w/2-.09),.03,z*(d/2-.09));return;}
  if(S==='shell'){A(M.fabric2,rb(w-.06,.14,d-.1,.06,3),F,0,.42,.04);ring(M.fabric2,F,0,.42,0,w/2-.08,w/2,.54,-2.2,2.2);for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])A(M.metal,cyl(.012,.01,.35,6),F,x*(w/2-.12),.175,z*(d/2-.12),z*.08,0,-x*.08);return;}
  A(M.chair,rb(w,.3,d,.06,3),F,0,.2,0);A(M.chair,rb(w-.26,.14,d-.24,.06,3),F,0,.42,.05);A(M.chair,rb(w,.42,.17,.07,3),F,0,.6,-d/2+.085,-.12,0,0);for(const e of[-1,1])A(M.chair,rb(.13,.3,d-.04,.06,3),F,e*(w/2-.065),.5,0);for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])A(L.legs==='wood'?M.wood:L.legs==='black'?M.blackSteel:M.wood,cyl(.022,.016,.05,8),F,x*(w/2-.08),.025,z*(d/2-.08));A(M.pillows[0],rb(.34,.28,.11,.05,3),F,0,.64,-d/2+.26,-.22,0,0);},
 coffee(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h,S=L.coffee;
  const deco=()=>{A(M.book[0],box(.3,.04,.22),F,-.25,h+.02,0,0,.2,0);A(M.book[2],box(.27,.03,.2),F,-.25,h+.055,0,0,.1,0);A(M.ceramic,lathe(T,[[0,0],[.06,0],[.09,.03],[.1,.07],[0,.07]],18),F,.25,h,.05);A(M.leaf2,new T.SphereGeometry(.04,6,5),F,.25,h+.1,.05,0,0,0,1.4,.6,1.2);};
  if(S==='drum'){A(M.stone,cyl(w/2,w/2,.06,40),F,0,h-.03,0,0,0,0,1,1,d/w);A(M.stone,cyl(w/2-.08,w/2-.08,h-.06,40),F,0,(h-.06)/2,0,0,0,0,1,1,(d-.16)/(w-.16));A(M.ceramic,lathe(T,[[0,0],[.1,0],[.14,.04],[.15,.08],[0,.08]],20),F,.15,h,.05);A(M.book[1],box(.28,.04,.2),F,-.2,h+.02,-.05,0,.3,0);A(M.book[4],box(.24,.035,.18),F,-.2,h+.0575,-.05,0,.15,0);return;}
  if(S==='woodRound'){const r=Math.min(w,d)/2;A(M.wood,cyl(r,r,.045,40),F,0,h-.0225,0,0,0,0,w/(2*r),1,d/(2*r));for(let i=0;i<4;i++){const a=i/4*TAU+PI/4;A(M.wood,cyl(.025,.02,h-.045,8),F,Math.cos(a)*r*.6,(h-.045)/2,Math.sin(a)*r*.6,Math.sin(a)*.1,0,-Math.cos(a)*.1);}deco();return;}
  if(S==='block'){/* one solid block, like a piece of stone */A(M.stone,rb(w,h,d,.02,2),F,0,h/2,0);A(M.ceramic,lathe(T,[[0,0],[.08,0],[.1,.1],[.06,.22],[0,.22]],20),F,.3,h,0);A(M.book[6],box(.3,.035,.22),F,-.25,h+.0175,0,0,.1,0);return;}
  if(S==='marbleRound'){const r=Math.min(w,d)/2;A(M.stone,cyl(r,r,.04,48),F,0,h-.02,0);A(M.metal,cyl(.1,.16,h-.04,24),F,0,(h-.04)/2,0);A(M.ceramic,lathe(T,[[0,0],[.07,0],[.1,.08],[.09,.16],[0,.16]],18),F,.15,h,.05);A(M.leaf2,new T.SphereGeometry(.05,6,5),F,.15,h+.2,.05,0,0,0,1.2,.8,1.2);return;}
  A(M.stone,rb(w,.045,d,.01,2),F,0,h-.0225,0);if(L.metal==='gold'){A(M.metal,box(w-.12,.015,d-.12),F,0,.05,0);for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])A(M.metal,box(.025,h-.06,.025),F,x*(w/2-.06),.06+(h-.06-.06)/2+.0,z*(d/2-.06));}
  else{for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])A(M.metal,box(.022,h-.045,.022),F,x*(w/2-.05),(h-.045)/2,z*(d/2-.05));A(M.metal,box(w-.1,.016,.016),F,0,.12,d/2-.05);A(M.metal,box(w-.1,.016,.016),F,0,.12,-d/2+.05);}
  deco();},
 side(it){const F=frameOf(T,it),w=it.w,h=it.h;if(L.side==='wood'){A(M.wood,cyl(w/2,w/2,h,24),F,0,h/2,0);return;}if(L.side==='black'){A(M.stone,rb(w,.03,w,.006,1),F,0,h-.015,0);for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])A(M.blackSteel,box(.02,h-.03,.02),F,x*(w/2-.03),(h-.03)/2,z*(w/2-.03));A(M.blackSteel,box(w-.06,.015,w-.06),F,0,.15,0);return;}A(M.stone,cyl(w/2,w/2,.03,30),F,0,h-.015,0);A(M.metal,cyl(.02,.02,h-.03,8),F,0,(h-.03)/2,0);A(M.metal,cyl(w/2-.06,w/2-.06,.015,24),F,0,.0075,0);},
 lamp(it){const F=frameOf(T,it),y0=0;A(M.ceramic,lathe(T,[[0,0],[.07,0],[.1,.08],[.08,.22],[.03,.3],[.02,.32],[0,.32]],20),F,0,y0,0);A(M.metal,cyl(.008,.008,.12,6),F,0,y0+.38,0);A(M.shade,new T.CylinderGeometry(.11,.15,.2,24,1,true),F,0,y0+.46,0);A(M.light,new T.SphereGeometry(.03,8,6),F,0,y0+.42,0);},
 floorlamp(it){const F=frameOf(T,it),S=L.floorlamp;
  if(S==='arc'){A(M.stone,cyl(.18,.2,.06,24),F,0,.03,0);const curve=new T.CatmullRomCurve3(Array.from({length:17},(_,i)=>new T.Vector3((1-Math.cos(i/16*PI/2))*1.1,.06+Math.sin(i/16*PI/2)*1.9,0)));A(M.metal,new T.TubeGeometry(curve,24,.012,6,false),F,0,0,0,0,-PI/2,0);A(M.metal,lathe(T,[[0,.22],[.04,.22],[.08,.14],[.18,.0],[.17,0],[.07,.13],[0,.2]],20),F,0,1.75,1.1);A(M.light,new T.SphereGeometry(.05,10,8),F,0,1.8,1.1);return;}
  if(S==='tripod'){for(let i=0;i<3;i++){const a=i/3*TAU;A(M.wood,cyl(.014,.014,1.45,8),F,Math.cos(a)*.15,.7,Math.sin(a)*.15,Math.sin(a)*.1,0,-Math.cos(a)*.1);}A(M.shade,new T.CylinderGeometry(.2,.22,.32,28,1,true),F,0,1.55,0);A(M.light,new T.SphereGeometry(.04,8,6),F,0,1.5,0);return;}
  if(S==='rattan'){A(M.wood,cyl(.15,.17,.04,20),F,0,.02,0);A(M.wood,cyl(.014,.014,1.35,8),F,0,.69,0);A(M.rattan,new T.SphereGeometry(.26,18,10,0,TAU,0,PI*.55),F,0,1.42,0);A(M.light,new T.SphereGeometry(.05,8,6),F,0,1.42,0);return;}
  if(S==='industrial'){A(M.blackSteel,cyl(.16,.18,.03,20),F,0,.015,0);A(M.blackSteel,cyl(.013,.013,1.2,8),F,0,.62,0);A(M.blackSteel,cyl(.011,.011,.6,8),F,0,1.38,.18,-.55,0,0);A(M.blackSteel,lathe(T,[[0,.2],[.03,.2],[.06,.14],[.15,0],[.145,0],[.055,.13],[0,.18]],18),F,0,1.42,.42,.6,0,0);A(M.bulb,new T.SphereGeometry(.04,8,6),F,0,1.47,.44);return;}
  if(S==='globe'){A(M.metal,cyl(.15,.15,.02,24),F,0,.01,0);A(M.metal,cyl(.01,.01,1.4,8),F,0,.71,0);A(M.light,new T.SphereGeometry(.18,20,14),F,0,1.55,0);return;}
  A(M.metal,cyl(.16,.16,.02,24),F,0,.01,0);A(M.black,cyl(.012,.012,1.6,8),F,0,.82,0);A(M.metal,new T.TorusGeometry(.17,.012,8,28),F,0,1.65,0,PI/2,0,0);A(M.led,new T.TorusGeometry(.17,.006,6,28),F,0,1.64,0,PI/2,0,0);},
 media(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;A(M.cab,box(w,h-.1,d),F,0,.1+(h-.1)/2,0);A(M.black,box(w-.1,.1,d-.06),F,0,.05,-.02);
  const n=4,dw=w/n,doorM=L.media==='slab'?M.cab:M.wood;for(let i=0;i<n;i++){const cx=-w/2+dw*(i+.5);A(doorM,rb(dw-.008,h-.12,.02,.003,1),F,cx,.11+(h-.12)/2,d/2+.002);if(L.media==='fluted')for(let k=0;k<9;k++)A(M.wood,cyl(.008,.008,h-.16,6),F,cx-dw/2+.06+k*(dw-.12)/8,.11+(h-.12)/2,d/2+.018);}
  A(M.stone,box(w+.02,.025,d+.02),F,0,h+.0125,0);A(M.ceramic,lathe(T,[[0,0],[.06,0],[.12,.15],[.08,.32],[.05,.36],[0,.36]],20),F,w/2-.3,h+.025,0);A(M.book[3],box(.22,.3,.04),F,-w/2+.3,h+.175,-.07);A(M.book[5],box(.2,.27,.035),F,-w/2+.33,h+.16,-.02,0,0,.08);},
 tv(it){const F=frameOf(T,it),w=it.w,hh=it.h,y0=it.y?0:1;/* (the frame already stands at it.y) */A(M.black,rb(w,hh,.045,.006,1),F,0,y0+hh/2,.0225);const scr=new T.PlaneGeometry(w-.03,hh-.03);room.own(M.screen,scr,F(0,y0+hh/2,.0455));},
 rug(it){const F=frameOf(T,it),g=new T.BoxGeometry(it.w,.012,it.d);room.own(M.rug,g,F(0,.004+.006,0));},
 plant(it){const F=frameOf(T,it),h=it.h,big=h>1.5;const pr=Math.min(it.w,it.d)/2*.85;
  A(M.pot,lathe(T,[[0,0],[pr*.75,0],[pr,big?.5:.3],[pr*.96,big?.52:.32],[0,big?.52:.32]],24),F,0,0,0);A(M.soil,cyl(pr*.92,pr*.92,.01,20),F,0,(big?.5:.3)-.005,0);
  const top=big?.5:.3,r=LK().rng(LK().hash(design+it.x+it.z));
  if(L.plant==='olive'&&big){A(M.bark,cyl(.03,.045,h*.55,8),F,0,top+h*.27,0,0,0,.05);for(let i=0;i<180;i++){const a=r()*TAU,rr=.15+r()*.38,y=top+h*.5+r()*h*.42;A(M.olive,new T.PlaneGeometry(.05,.012),F,Math.cos(a)*rr,y,Math.sin(a)*rr,r()*PI,a,r()*PI);}}
  else if(L.plant==='bird'&&big){for(let i=0;i<9;i++){const a=i/9*TAU+r(),lean=.12+r()*.2,len=h*(.55+r()*.35);A(M.bark,cyl(.008,.012,len,6),F,Math.sin(a)*lean*len*.5,top+len/2,Math.cos(a)*lean*len*.5,Math.cos(a)*lean,0,-Math.sin(a)*lean);const s=new T.Shape();s.moveTo(0,0);s.quadraticCurveTo(.16,.35,0,.75);s.quadraticCurveTo(-.16,.35,0,0);A(M.leaf,new T.ShapeGeometry(s,6),F,Math.sin(a)*lean*len,top+len-.05,Math.cos(a)*lean*len,-.3+Math.cos(a)*.6,a,Math.sin(a)*.3);}}
  else{const n=big?26:12;for(let i=0;i<n;i++){const a=r()*TAU,y=top+(big?.3:.05)+r()*(h-top-(big?.4:.1)),rr=(big?.12:.04)+r()*(big?.3:.12);const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(.12,.06,.14,.24,0,.32);s.bezierCurveTo(-.14,.24,-.12,.06,0,0);A(r()<.5?M.leaf:M.leaf2,new T.ShapeGeometry(s,5),F,Math.cos(a)*rr,y,Math.sin(a)*rr,-.6+r()*.5,a,0,big?1:.6,big?1:.6,1);}if(big)A(M.bark,cyl(.02,.03,h*.6,6),F,0,top+h*.3,0);}},
 fireplace(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;/* a travertine surround with a long gas fire and a mantel; the wall above is stone to the ceiling */
  A(M.feature,box(w,h,d),F,0,h/2,0);A(M.black,box(w-.5,.42,.06),F,0,.42,d/2-.02);A(M.blackGlass,box(w-.52,.4,.01),F,0,.42,d/2+.016);for(let i=0;i<9;i++)A(M.flame,new T.ConeGeometry(.06+((i*7)%3)*.02,.18+((i*5)%4)*.04,8),F,-(w-.7)/2+i*(w-.7)/8,.32,d/2-.01);A(M.stone,box(w+.1,.06,d+.08),F,0,h+.03,0);
  A(M.feature,box(w,3-h-.06-.004,.12),F,0,h+.06+(3-h-.06-.004)/2,-d/2+.06);A(M.ceramic,lathe(T,[[0,0],[.08,0],[.1,.12],[.06,.28],[0,.28]],18),F,-w/2+.35,h+.06,0);A(M.ceramic,lathe(T,[[0,0],[.05,0],[.07,.2],[.04,.4],[0,.4]],18),F,-w/2+.55,h+.06,.02);},
 bar(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;/* a bar cabinet: smoked glass doors, a black marble top, a mirrored back with lit shelves of bottles above */
  A(M.cab,box(w,h-.06,d),F,0,(h-.06)/2+.0,0);for(let i=0;i<4;i++)A(M.blackGlass,rb(w/4-.01,h-.12,.02,.003,1),F,-w/2+w/8+i*w/4,(h-.06)/2,d/2+.006);A(M.stone,box(w+.02,.04,d+.02),F,0,h-.02,0);
  A(M.mirror,box(w,1.2,.01),F,0,h+.75,-d/2+.012);for(const y of[h+.45,h+.95]){A(M.blackGlass,box(w,.02,.22),F,0,y,-d/2+.13);A(M.led,box(w,.006,.01),F,0,y-.014,-d/2+.235);for(let i=0;i<10;i++)A(M.book[i%8],cyl(.035,.035,.26,10),F,-w/2+.12+i*(w-.24)/9,y+.14,-d/2+.12);}
  for(let i=0;i<4;i++)A(M.glass,cyl(.035,.03,.1,12),F,-.3+i*.18,h+.05,.08);A(M.metal,cyl(.05,.045,.22,16),F,.5,h+.11,.05);},
 chaise(it){const F=frameOf(T,it),w=it.w,d=it.d;/* a chaise longue facing the sea: a low base, a long seat, a sloped back, a bolster and a throw */
  A(M.chair,rb(w,.26,d,.06,3),F,0,.16,0);A(M.chair,rb(w-.04,.12,d*.68,.06,3),F,0,.35,d*.14);A(M.chair,rb(w-.04,.14,d*.45,.07,3),F,0,.52,-d*.3,-.75,0,0);A(M.pillows[0],cyl(.09,.09,w-.1,16),F,0,.47,d*.03,0,0,PI/2);A(M.throw,rb(w+.04,.03,.45,.012,2),F,0,.42,d*.36);for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])A(M.wood,cyl(.02,.015,.05,8),F,x*(w/2-.06),.025,z*(d/2-.06));},
 dresser(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;A(L.cabStyle==='shaker'?M.wood:M.cab,box(w,h-.06,d-.02),F,0,.06+(h-.06)/2,-.01);for(const e of[-1,1])A(M.black,cyl(.015,.012,.06,8),F,e*(w/2-.08),.03,0);for(let i=0;i<3;i++){const y=.12+i*.23;for(const e of[-1,1]){A(L.cabStyle==='shaker'?M.wood:M.cab,rb(w/2-.012,.215,.02,.004,1),F,e*w/4,y+.1075,d/2-.01);handle(F,e*w/4,y+.15,d/2-.01,.14,false);}}A(M.stone,box(w+.01,.025,d+.01),F,0,h+.0125,0);A(M.ceramic,lathe(T,[[0,0],[.06,0],[.09,.12],[.05,.26],[.03,.3],[0,.3]],18),F,-w/2+.2,h+.025,0);A(M.metal,box(.3,.012,.2),F,.25,h+.031,.02);A(M.book[2],box(.2,.03,.15),F,.25,h+.052,.02,0,.2,0);},
 // ---- V9.3: the corner piece of each design
 piano(it){/* a grand piano: the curved body, lid propped open, three legs, the keyboard facing the room */const F=frameOf(T,it),w=it.w,d=it.d;const s=new T.Shape();s.moveTo(-w/2,-d/2);s.lineTo(w/2,-d/2);s.lineTo(w/2,d*.05);s.bezierCurveTo(w/2,d*.45,w*.05,d/2,-w*.15,d/2);s.bezierCurveTo(-w*.4,d/2,-w/2,d*.25,-w/2,0);s.lineTo(-w/2,-d/2);
  A(M.piano,new T.ExtrudeGeometry(s,{depth:.3,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,curveSegments:16}),F,0,.62,0,-PI/2,PI,0);A(M.piano,new T.ShapeGeometry(s,16),F,0,.95,0,-PI/2+.55,PI,0);A(M.blackSteel,cyl(.008,.008,.6,6),F,-w*.3,1.2,d*.1,.4,0,0);
  for(const[x,z]of[[-w/2+.12,-d/2+.15],[w/2-.12,-d/2+.15],[-w*.05,d*.38]])A(M.piano,cyl(.05,.04,.62,10),F,x,.31,z);A(M.piano,box(w,.08,.3),F,0,.66,-d/2-.12);A(M.keys,box(w-.1,.025,.16),F,0,.715,-d/2-.18);for(let i=0;i<36;i++)if(i%7!==2&&i%7!==6)A(M.piano,box(.012,.02,.09),F,-w/2+.08+i*(w-.16)/36,.735,-d/2-.14);
  A(M.piano,rb(.6,.08,.34,.02,2),F,0,.48,-d/2-.62);for(const[x,z]of[[-.25,-.12],[.25,-.12],[-.25,.12],[.25,.12]])A(M.piano,cyl(.02,.018,.44,8),F,x,.22,-d/2-.62+z);},
 desk(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;A(M.wood,rb(w,.035,d,.008,1),F,0,h-.0175,0);for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])A(M.wood,cyl(.022,.018,h-.035,8),F,x*(w/2-.06),(h-.035)/2,z*(d/2-.06),z*.04,0,-x*.04);A(M.wood,box(.4,.1,d-.12),F,w/2-.28,h-.085,0);
  A(M.black,box(.34,.012,.24),F,-.1,h+.006,.05);A(M.black,box(.34,.22,.01),F,-.1,h+.12,-.07,-.25,0,0);A(M.screen,new T.PlaneGeometry(.3,.19),F,-.1,h+.125,-.062,-.25,0,0);A(M.ceramic,lathe(T,[[0,0],[.05,0],[.07,.05],[.05,.18],[.02,.22],[0,.22]],16),F,w/2-.2,h,-.1);A(M.shade,new T.CylinderGeometry(.07,.1,.12,20,1,true),F,w/2-.2,h+.3,-.1);A(M.book[3],box(.22,.03,.16),F,.25,h+.015,.1,0,.2,0);},
 bookcase(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h,shelves=6,r=LK().rng(LK().hash(design+'books'));for(const e of[-1,1])A(M.blackSteel,box(.03,h,d),F,e*(w/2-.015),h/2,0);A(M.blackSteel,box(.03,h,d),F,0,h/2,0);
  for(let s=0;s<=shelves;s++){const y=.05+s*(h-.1)/shelves;A(M.wood,box(w-.04,.03,d-.02),F,0,y,0);if(s===shelves)break;let x=-w/2+.05;const top=(h-.1)/shelves-.06;while(x<w/2-.12){if(Math.abs(x)<.03){x+=.05;continue;}if(r()<.12){A(M.ceramic,lathe(T,[[0,0],[.05,0],[.07,.08],[.04,.18],[0,.18]],12),F,x+.08,y+.015,0);x+=.18;continue;}const bw=.025+r()*.03,bh=top*(.65+r()*.35),tilt=r()<.1;A(M.book[(r()*8)|0],box(bw,bh,tilt?d*.66:d*.75),F,x+bw/2+(tilt?.02:0),y+.015+bh/2,tilt?-.01:0,0,0,tilt?.15:0);x+=bw+(tilt?.05:.003);}}},
 winewall(it){/* a glass wine wall: a dark frame, bottles lying in racks, light behind */const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;A(M.blackSteel,box(w,h,.04),F,0,h/2,-d/2+.02);for(const e of[-1,1])A(M.blackSteel,box(.04,h,d),F,e*(w/2-.02),h/2,0);A(M.blackSteel,box(w,.05,d),F,0,h-.025,0);A(M.blackSteel,box(w,.08,d),F,0,.04,0);
  A(M.led,box(w-.1,.01,.02),F,0,h-.07,-d/2+.06);for(let r=0;r<11;r++){const y=.18+r*.21;A(M.blackSteel,box(w-.08,.01,d-.06),F,0,y-.06,0);for(let i=0;i<9;i++){const x=-w/2+.18+i*(w-.36)/8;A(M.book[(r+i)%8===6?1:(r*3+i)%5===0?4:6],cyl(.035,.035,d-.12,10),F,x,y,0,PI/2,0,0);}}A(M.glass,box(w-.08,h-.13,.01),F,0,h/2,d/2-.01);},
 hanging(it){/* a rattan egg chair hanging from a curved stand */const F=frameOf(T,it),w=it.w,h=it.h;A(M.blackSteel,cyl(.38,.4,.05,28),F,0,.025,0);const curve=new T.CatmullRomCurve3([new T.Vector3(0,.05,-.3),new T.Vector3(0,1.2,-.42),new T.Vector3(0,1.85,-.2),new T.Vector3(0,1.9,.05)]);A(M.blackSteel,new T.TubeGeometry(curve,20,.025,8,false),F,0,0,0);A(M.blackSteel,cyl(.005,.005,.4,4),F,0,1.68,.05);
  A(M.rattan,new T.SphereGeometry(.42,22,16,0,TAU,PI*.12,PI*.7),F,0,1.05,.08,-.35,0,0,1,1.25,1);A(M.fabric,rb(.5,.1,.42,.05,3),F,0,.72,.12);A(M.pillows[0],rb(.38,.3,.12,.05,3),F,0,.95,-.08,-.3,0,0);},
 sideboard(it){/* a low wooden sideboard under an arch of plaster on the wall, with pottery in it */const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;A(M.wood,box(w,h-.1,d),F,0,.1+(h-.1)/2,0);for(let i=0;i<3;i++){A(M.wood,rb(w/3-.01,h-.14,.02,.004,1),F,-w/3+i*w/3,.12+(h-.14)/2,d/2+.006);A(M.metal,cyl(.012,.012,.02,8),F,-w/3+i*w/3,.6,d/2+.02,PI/2,0,0);}for(const e of[-1,1])A(M.wood,cyl(.025,.02,.1,8),F,e*(w/2-.08),.05,0);A(M.stone,box(w+.02,.03,d+.02),F,0,h+.015,0);
  const s=new T.Shape();s.moveTo(-w/2-.15,0);s.lineTo(w/2+.15,0);s.lineTo(w/2+.15,1.7);s.lineTo(-w/2-.15,1.7);s.lineTo(-w/2-.15,0);const hole=new T.Path();hole.moveTo(-w/2+.15,.1);hole.lineTo(w/2-.15,.1);hole.lineTo(w/2-.15,.9);hole.absarc(0,.9,w/2-.15,0,PI,false);hole.lineTo(-w/2+.15,.1);s.holes.push(hole);A(M.wall,new T.ExtrudeGeometry(s,{depth:.06,bevelEnabled:false,curveSegments:16}),F,0,h+.03,-d/2-.005);
  for(const[x,hh,r]of[[-.4,.34,.11],[0,.5,.09],[.42,.26,.13]])A(M.ceramic,lathe(T,[[0,0],[r*.7,0],[r,hh*.4],[r*.6,hh*.85],[r*.5,hh],[0,hh]],18),F,x,h+.03,-.02);},
 sculpture(it){/* an abstract sculpture on a plinth: a stone ring on a stacked base */const F=frameOf(T,it),h=it.h;A(M.white,rb(.5,.9,.5,.01,1),F,0,.45,0);A(M.stone,new T.TorusGeometry(.26,.07,16,40),F,0,1.27,0);A(M.blackSteel,box(.12,.12,.12),F,0,.96,0);A(M.stone,new T.SphereGeometry(.07,16,12),F,.08,1.6,0);},
 console(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;A(M.stone,rb(w,.03,d,.006,1),F,0,h-.015,0);for(const e of[-1,1]){A(M.metal,box(.02,h-.03,.02),F,e*(w/2-.03),(h-.03)/2,d/2-.03);A(M.metal,box(.02,h-.03,.02),F,e*(w/2-.03),(h-.03)/2,-d/2+.03);}A(M.metal,box(w-.06,.02,d-.06),F,0,.2,0);
  A(M.mirror,new T.CylinderGeometry(.45,.45,.015,40),F,0,h+.75,-d/2+.012,PI/2,0,0);A(M.metal,new T.TorusGeometry(.455,.012,8,40),F,0,h+.75,-d/2+.015,0,0,0);A(M.ceramic,lathe(T,[[0,0],[.07,0],[.1,.1],[.05,.3],[.04,.36],[0,.36]],18),F,-w/2+.2,h,0);A(M.ceramic,cyl(.14,.1,.06,20),F,w/2-.25,h+.03,0);},
 bed(it){const F=frameOf(T,it),w=it.w,len=it.d,legM=L.bedLegs==='wood'?M.wood:L.bedLegs==='black'?M.blackSteel:M.metal;/* the bed's own frame: x across, z from the headboard (-len/2) to the foot (+len/2) */
  const o=it.t==='platform'?-.12:it.t==='low'?-.14:0;
  if(it.t==='platform'){A(M.bedFrame,box(w+.3,.18,len-.04),F,0,.14,.02);A(M.black,box(w,.05,len-.2),F,0,.025,.02);A(M.bedFrame,box(w+.9,1.0,.06),F,0,.6,-len/2+.03);}
  else if(it.t==='low'){A(M.bedFrame,rb(w+.12,.16,len-.02,.02,2),F,0,.13,.01);for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])A(legM,cyl(.025,.02,.05,8),F,x*(w/2-.05),.025,z*(len/2-.1));A(M.bedFrame,rb(w+.12,.75,.05,.02,2),F,0,.42,-len/2+.04);}
  else{A(M.bedFrame,rb(w+.1,.3,len,.03,2),F,0,.2,.0);for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])A(legM,cyl(.025,.02,.05,8),F,x*(w/2-.05),.025,z*(len/2-.08));
   if(it.t==='canopy'){/* four posts and a frame over the bed, with linen drawn back at the posts */for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])A(M.wood,cyl(.035,.035,2.25,10),F,x*(w/2+.02),1.125,z*(len/2-.04));for(const e of[-1,1]){A(M.wood,box(w+.08,.06,.06),F,0,2.22,e*(len/2-.04));A(M.wood,box(.06,.06,len-.04),F,e*(w/2+.02),2.22,0);}for(const[x,z]of[[-1,1],[1,1]])A(M.curtain,new T.CylinderGeometry(.06,.09,2.1,10,1,true),F,x*(w/2+.02),1.13,z*(len/2-.04));A(M.bedFrame,rb(w+.04,.95,.08,.03,2),F,0,.62,-len/2+.06);}
   else if(it.t==='leather'){A(M.bedFrame,rb(w+.2,1.1,.12,.04,3),F,0,.62,-len/2+.06);for(let i=0;i<8;i++)for(let j=0;j<3;j++)A(M.bedFrame,new T.SphereGeometry(.012,6,4),F,-w/2+.15+(i+(j%2)*.5)*(w-.3)/7.5,.5+j*.2,-len/2+.121);for(const e of[-1,1]){A(M.blackSteel,cyl(.022,.022,1.25,8),F,e*(w/2+.12),.625,-len/2+.06);A(M.blackSteel,new T.SphereGeometry(.035,10,8),F,e*(w/2+.12),1.27,-len/2+.06);}}
   else{A(M.bedFrame,rb(w+.2,1.15,.14,.05,3),F,0,.58,-len/2+.07);for(let i=0;i<5;i++)A(M.bedFrame,rb((w+.1)/5-.02,.9,.05,.025,2),F,-w/2+(w+.1)/5*(i+.5)-.05,.62,-len/2+.155);if(L.metal==='gold')A(M.metal,box(w+.22,.02,.16),F,0,1.16,-len/2+.07);}}
  A(M.linen,rb(w-.04,.22,len-.08,.06,3),F,0,.46+o,.0);A(M.linen,rb(w+.04,.06,len*.62,.03,2),F,0,.585+o,len*.17);A(M.linen,rb(w+.06,.18,.04,.02,2),F,0,.5+o,len/2-.04+.02);for(const e of[-1,1])A(M.linen,rb(.04,.18,len*.62,.02,2),F,e*(w/2+.03),.5+o,len*.17);
  A(M.throw,rb(w+.08,.035,.5,.015,2),F,0,.62+o,len/2-.35);for(const e of[-1,1]){A(M.linen,rb(.66,.16,.42,.07,3),F,e*w/4,.66+o,-len/2+.32,-.5,0,0);A(M.pillows[e>0?0:1],rb(.48,.13,.36,.06,3),F,e*w/4.4,.68+o,-len/2+.52,-.35,0,0);}A(M.pillows[2],rb(.36,.12,.28,.05,3),F,0,.68+o,-len/2+.6,-.3,0,0);},
 nightstand(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;A(L.vanity===L.wood?M.wood:M.cab,rb(w,h-.04,d,.01,2),F,0,.04+(h-.04)/2,0);for(const y of[.16,.36])A(M.wood,rb(w-.04,.17,.02,.004,1),F,0,y,d/2+.008);for(const y of[.2,.4])handle(F,0,y,d/2+.01,.12,false);A(M.stone,box(w+.01,.02,d+.01),F,0,h+.01,0);A(M.book[0],box(.2,.03,.14),F,.08,h+.035,.02,0,.2,0);},
 wardrobe(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h,S=L.wardrobe;A(S==='black'?M.blackSteel:M.cab,box(w,h,d-.03),F,0,h/2,-.015);const n=Math.round(w/.6),dw=w/n;
  for(let i=0;i<n;i++){const cx=-w/2+dw*(i+.5);if(S==='slats'){A(M.wood,rb(dw-.008,h-.02,.02,.003,1),F,cx,h/2,d/2-.01);for(let k=0;k<6;k++)A(M.wood,box(.03,h-.08,.012),F,cx-dw/2+.06+k*(dw-.12)/5,h/2,d/2+.006);}
   else if(S==='glass'){A(M.blackGlass,rb(dw-.008,h-.02,.02,.003,1),F,cx,h/2,d/2-.01);A(M.metal,box(.012,h-.04,.006),F,cx-dw/2+.004,h/2,d/2+.003);}
   else if(S==='black'){A(M.blackSteel,box(dw-.01,h-.02,.02),F,cx,h/2,d/2-.01);A(M.glass,box(dw-.08,h-.12,.01),F,cx,h/2,d/2+.006);for(let k=1;k<4;k++)A(M.blackSteel,box(dw-.08,.02,.012),F,cx,k*h/4,d/2+.007);}
   else if(S==='flat'){A(M.cab,rb(dw-.008,h-.02,.02,.002,1),F,cx,h/2,d/2-.01);A(M.black,box(.006,h-.06,.004),F,cx+dw/2-.004,h/2,d/2+.001);}
   else{A(M.cab,rb(dw-.008,h-.02,.02,.003,1),F,cx,h/2,d/2-.01);A(M.cab,box(dw-.14,h-.3,.006),F,cx,h/2,d/2+.003);}handle(F,cx+(i%2?-1:1)*(dw/2-.07),1.1,d/2-.01,.5,true);}},
 bench(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;A(M.throw,rb(w,.12,d,.05,3),F,0,h-.06,0);for(const[x,z]of[[-1,-1],[1,-1],[-1,1],[1,1]])A(L.legs==='wood'?M.wood:L.legs==='black'?M.blackSteel:M.metal,cyl(.018,.014,h-.12,8),F,x*(w/2-.06),(h-.12)/2,z*(d/2-.06));},
 cabinet(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;A(M.cab,box(w,h,d-.02),F,0,h/2,-.01);for(const e of[-1,1]){A(M.cab,rb(w/2-.006,h-.02,.02,.003,1),F,e*w/4,h/2,d/2-.01);handle(F,e*.04,h*.55,d/2-.01,.3,true);}},
 shower(it){/* walk-in shower in the corner: a stone tray, two glass panels (as the solid boxes), a rain head and a hand shower */
  const F=frameOf(T,it);A(M.tile,box(1.83,.03,1.88),F,0,.015,0);A(M.chrome,box(.9,.004,.06),F,.2,.031,-.6);
  /* V11.1: the fixed pane now stands by the outer wall and the way in is beside the long pane, facing the room (it was squeezed between the glass and the vanity) */A(M.glass,box(.93,2.05,.01),F,.4215,1.055,.94);A(M.glass,box(.01,2.05,1.88),F,-.9,1.055,0);A(M.chrome,box(.93,.025,.025),F,.4215,2.08,.94);A(M.chrome,box(.025,.025,1.88),F,-.9,2.08,0);
  A(M.chrome,cyl(.012,.012,.6,8),F,.1,2.2,-.93+.3,PI/2,0,0);A(M.chrome,cyl(.15,.15,.012,28),F,.1,2.19,-.63+.0);A(M.chrome,cyl(.012,.012,1.1,8),F,.6,1.4,-.93);A(M.chrome,cyl(.02,.025,.16,8),F,.6,1.2,-.9,PI/3,0,0);
  A(M.tile,box(.5,.3,.08),F,-.2,1.3,-.96);},
 tub(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;/* a freestanding oval bath */const pts=[];const N=12;for(let i=0;i<=N;i++){const t=i/N;pts.push([.5*(1-Math.pow(1-t,3))*1+.0, t*h]);}
  const g=new T.LatheGeometry([new T.Vector2(.0,0),new T.Vector2(.42,0),new T.Vector2(.48,.06),new T.Vector2(.5,h*.6),new T.Vector2(.52,h),new T.Vector2(.47,h),new T.Vector2(.45,h*.55),new T.Vector2(.4,.12),new T.Vector2(0,.1)],40);A(M.tub,g,F,0,0,0,0,0,0,(w-.06)/1.04,1,(d-.04)/1.04);
  A(M.chrome,cyl(.015,.015,.75,8),F,w/2-.12,.375,-d/2+.06+.0);A(M.chrome,cyl(.01,.01,.18,8),F,w/2-.12,.75,-d/2+.15,PI/2,0,0);A(M.towel,rb(.5,.04,.32,.015,2),F,-w/2+.35,h+.02,0,0,.1,0);},
 toilet(it){/* V11.2: the seat at a real height (0.44 m) so a person sitting on it has their feet on the floor */const F=frameOf(T,it);A(M.porcelain,rb(.38,.24,.56,.1,3),F,0,.285,.02);A(M.porcelain,rb(.36,.03,.5,.1,3),F,0,.425,.03);/* the water in the bowl, 6 mm above the seat so the two never share a plane */if(!M.looWater)M.looWater=new T.MeshStandardMaterial({color:'#a9c3cc',roughness:.08,metalness:.05});const pool=new T.CircleGeometry(.12,28);pool.scale(1,1.3,1);A(M.looWater,pool,F,0,.446,.05,-PI/2,0,0);A(M.white,box(.5,.9,.05),F,0,.95,-it.d/2+.025);A(M.chrome,rb(.22,.14,.01,.01,1),F,0,1.05,-it.d/2+.055);},
 vanity(it){const F=frameOf(T,it),w=it.w,d=it.d,h=it.h;/* a floating vanity with two basins, a stone top, a long mirror with light round it, and two wall taps */
  A(M.cab,box(w,.45,d-.02),F,0,h-.04-.225,-.01);for(const e of[-1,1]){A(M.wood,rb(w/2-.01,.43,.02,.004,1),F,e*w/4,h-.04-.225,d/2-.01);A(M.metal,box(.25,.012,.02),F,e*w/4,h-.1,d/2+.01);}
  A(M.stone,box(w+.02,.04,d+.02),F,0,h-.02,0);for(const e of(w<1.2?[0]:[-1,1])){A(M.porcelain,lathe(T,[[0,0],[.12,0],[.19,.06],[.2,.13],[.18,.13],[.17,.07],[.1,.02],[0,.02]],28),F,e*w/4,h,.0);A(M.chrome,cyl(.01,.01,.18,8),F,e*w/4,h+.35,-d/2+.09,PI/2,0,0);}
  A(M.mirror,box(w-.1,.9,.012),F,0,h+.75,-d/2+.012);A(M.led,box(w-.08,.012,.012),F,0,h+.75+.46,-d/2+.012);A(M.led,box(w-.08,.012,.012),F,0,h+.75-.46,-d/2+.012);
  A(M.towel,rb(.38,.24,.1,.03,2),F,w/2+.15,h-.2,-d/2+.09);},
 art(it){const F=frameOf(T,it),w=it.w,h=it.h,y0=it.y?0:1.3;A(design==='noir'?M.metal:M.wood,box(w+.06,h+.06,.035),F,0,y0+h/2,.0175+.004);room.own(new T.MeshStandardMaterial({map:art(T,L.art,Math.round(it.x*7+it.z*3)),roughness:.85}),new T.PlaneGeometry(w,h),F(0,y0+h/2,.0395));}
 };}
// ---- the room itself ---------------------------------------------------------------------------------------------------------
function shell(room,L,A){
 const T=room.T,M=room.M,UW=A.UW,UD=A.UD,C=A.CEIL,W=A.WING,P=A.PART;const add=(m,g,mx)=>room.add(m,g,mx),at=(x,y,z,rx=0,ry=0,rz=0)=>new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(1,1,1));
 const plane=(m,w,h,x,y,z,rx,ry)=>add(m,new T.PlaneGeometry(w,h),at(x,y,z,rx,ry,0));
 const bx=(m,x0,x1,y0,y1,z0,z1)=>add(m,new T.BoxGeometry(x1-x0,y1-y0,z1-z0),at((x0+x1)/2,(y0+y1)/2,(z0+z1)/2));
 // floors: the living space and the bedroom wing in the design's floor, the bathroom in stone
 const fy=.003,CORR=A.CORR_V+P;plane(M.floor,W,UD,W/2,fy,UD/2,-PI/2,0);plane(M.floor,UW-W-P,UD-A.BATH_V-P,(W+P+UW)/2,fy,(A.BATH_V+P+UD)/2,-PI/2,0);plane(M.bathFloor,UW-W-P,A.BATH_V,(W+P+UW)/2,fy,A.BATH_V/2,-PI/2,0);
 // ceilings, with a recessed cove of light round the living room in some designs, timber beams in others
 const cy=C-.003;plane(M.ceiling,UW,UD,UW/2,cy,UD/2,PI/2,0);
 // the ceiling of the living space: a cove of light round it, timber beams, black steel beams with a duct, a slatted
 // timber panel, or a grid of coffers; some designs keep it plain
 if(L.ceil==='cove'){bx(M.ceiling,0,W,C-.32,cy-.0,7.4,7.7);bx(M.ceiling,0,W,C-.32,cy,UD-.3,UD-.06);bx(M.ceiling,W-.3,W-.004,C-.32,cy,7.7,UD-.3);add(M.led,new T.BoxGeometry(W-.4,.012,.02),at(W/2-.15,C-.31,7.72));add(M.led,new T.BoxGeometry(.02,.012,UD-8.1),at(W-.32,C-.31,(7.7+UD-.3)/2));}
 else if(L.ceil==='beams'){for(const v of[2.2,4.6,7.0,9.4,11.8])add(M.beam,new T.BoxGeometry(W-.02,.2,.16),at(W/2,C-.1-.003,v));for(const v of[8.2,11.2])add(M.beam,new T.BoxGeometry(UW-W-P-.02,.16,.14),at((W+P+UW)/2,C-.08-.003,v));}
 else if(L.ceil==='steel'){for(const v of[2.6,6.2,9.8,13.2]){add(M.blackSteel,new T.BoxGeometry(W-.02,.276,.012),at(W/2,C-.153,v));for(const e of[-1,1])add(M.blackSteel,new T.BoxGeometry(W-.02,.012,.14),at(W/2,C-.003-.006-(e>0?0:.288),v));}const duct=new T.CylinderGeometry(.18,.18,12.65,16);add(M.duct,duct,at(9.2,C-.52,7.225,PI/2,0,0));for(let i=0;i<6;i++)add(M.blackSteel,new T.CylinderGeometry(.006,.006,.33,4),at(9.2,C-.17,1.6+i*2.3));}
 else if(L.ceil==='slats'){const sm=new T.MeshStandardMaterial({map:tex(T,'oak'),color:L.beams||'#b08a60',roughness:.7});for(let u=.3;u<W-.2;u+=.12)add(sm,new T.BoxGeometry(.06,.04,UD-.5),at(u,C-.024,UD/2+.1));}
 else if(L.ceil==='coffer'){const cm=M.ceiling;for(let u=1.2;u<W-.5;u+=2.2)add(cm,new T.BoxGeometry(.16,.247,UD-.4),at(u,C-.003-.1235,UD/2));for(let v=1.4;v<UD-.3;v+=2.2)add(cm,new T.BoxGeometry(W-.02,.247,.16),at(W/2,C-.008-.1235,v));for(let u=1.2;u<W-.5;u+=2.2)add(M.metal,new T.BoxGeometry(.012,.012,UD-.4),at(u,C-.256,UD/2));} // recessed lights
 for(const[u,v]of[[2,9.2],[2,12.4],[6,9.2],[6,12.4],[8.4,5.8],[6.2,1.6],[1.7,1.4],[12.6,8],[12.6,11.6],[12.6,2.2],[12.6,5.15]])if(!(['slats','coffer'].includes(L.ceil)&&u<W))add(M.light,new T.CylinderGeometry(.06,.06,.01,16),at(u,C-.012,v));
 // the walls of the home: the party wall, the outer wall and the back wall (with the lift door), in front of the
 // building's own walls; the walls inside are boxes where the solid walls are
 plane(M.wall,UD,C,.002,C/2,UD/2,0,PI/2);plane(M.wall,UD,C,UW-.002,C/2,UD/2,0,-PI/2);
 const L0=A.LIFT.u0,L1=A.LIFT.u1;plane(M.wall,L0,C,L0/2,C/2,.002,0,0);plane(M.wall,UW-L1,C,(L1+UW)/2,C/2,.002,0,0);plane(M.wall,L1-L0,C-2.25,(L0+L1)/2,2.25+(C-2.25)/2,.002,0,0);
 // a feature wall: behind the television, along the whole party wall, or behind the bed
 const fa=L.featureAt||[];if(L.feature){if(fa.includes('party'))bx(M.feature,.004,.009,0,C-.004,.004,UD-.004);else if(fa.includes('tv'))bx(M.feature,.004,.009,0,C-.004,8.9,12.9);if(fa.includes('bed'))bx(M.feature,W+P+.004,W+P+.009,0,C-.004,CORR+.01,UD-.004);}
 for(const[,u0,v0,u1,v1]of A.WALLS)bx(M.wall,u0,u1,0,C-.004,v0,v1);
 for(const[,u,v,axis,w]of A.DOORS){if(axis)bx(M.wall,u-P/2,u+P/2,2.25,C-.004,v-w/2,v+w/2);else bx(M.wall,u-w/2,u+w/2,2.25,C-.004,v-P/2,v+P/2);
  // door frames: a thin lining on the three faces of the opening
  const fm=L.cove&&L.wall<'#5'?M.black:M.wood,t=.012;if(axis){for(const e of[-1,1])bx(fm,u-P/2-.006,u+P/2+.006,0,2.25,v+e*(w/2)-(e>0?t:0),v+e*(w/2)+(e<0?t:0));bx(fm,u-P/2-.006,u+P/2+.006,2.25-t,2.25,v-w/2+t,v+w/2-t);/* V11.1: a threshold strip under the doorway (there was no floor there, so you saw down through it) */bx(fm,u-P/2-.006,u+P/2+.006,0,.006,v-w/2+t,v+w/2-t);}
  else{for(const e of[-1,1])bx(fm,u+e*(w/2)-(e>0?t:0),u+e*(w/2)+(e<0?t:0),0,2.25,v-P/2-.006,v+P/2+.006);bx(fm,u-w/2+t,u+w/2-t,2.25-t,2.25,v-P/2-.006,v+P/2+.006);/* V11.1 */bx(fm,u-w/2+t,u+w/2-t,0,.006,v-P/2-.006,v+P/2+.006);}}
 // skirting along the walls
 const sk=L.feature==='marbleB'?M.black:M.white;for(const[u0,u1,v0,v1]of[[.004,.018,0,UD],[UW-.018,UW-.004,A.BATH_V+P,UD],[0,L0,.004,.018],[L1,W,.004,.018]])bx(sk,u0,u1,0,.09,v0,v1);
 // the bathroom walls are tiled to the ceiling
 bx(M.tile,W+P,W+P+.008,0,C-.004,.01,A.BATH_V-.01);bx(M.tile,W+P+.01,UW-.01,0,C-.004,.004,.012);bx(M.tile,UW-.012,UW-.004,0,C-.004,.01,A.BATH_V-.01);bx(M.tile,W+P+.01,11.9-.01,0,C-.004,A.BATH_V-.008,A.BATH_V);bx(M.tile,12.81,UW-.01,0,C-.004,A.BATH_V-.008,A.BATH_V);
 // the lift: steel walls and a stone floor in the car, a handrail, a panel, a light, and its doors
 const cu0=A.LIFT.c0+.01,cu1=A.LIFT.c1-.01,cv0=A.LIFT.back-.24,cv1=-.31;plane(M.stone,cu1-cu0,cv1-cv0,(cu0+cu1)/2,.003,(cv0+cv1)/2,-PI/2,0);
 const steel=M.car||M.steel;plane(steel,cv1-cv0,2.5,cu0,1.25,(cv0+cv1)/2,0,PI/2);plane(steel,cv1-cv0,2.5,cu1,1.25,(cv0+cv1)/2,0,-PI/2);plane(steel,cu1-cu0,2.5,(cu0+cu1)/2,1.25,cv0,0,0);plane(M.light,cu1-cu0,cv1-cv0,(cu0+cu1)/2,2.497,(cv0+cv1)/2,PI/2,0);
 plane(steel,L0-cu0,2.5,(cu0+L0)/2,1.25,cv1,0,PI);plane(steel,cu1-L1,2.5,(L1+cu1)/2,1.25,cv1,0,PI);plane(steel,L1-L0,.25,(L0+L1)/2,2.375,cv1,0,PI);
 bx(M.chrome,cu0+.02,cu0+.06,.9,.94,cv0+.2,cv1-.2);bx(M.chrome,cu1-.06,cu1-.02,.9,.94,cv0+.2,cv1-.2);bx(M.black,cu1-.03,cu1-.012,1.0,1.5,cv1-.45,cv1-.25);for(let i=0;i<6;i++)add(M.led,new T.CylinderGeometry(.012,.012,.006,10),at(cu1-.034,1.08+i*.07,cv1-.35,0,0,PI/2));
 // the reveal of the lift doorway through the back wall
 bx(M.steel,L0-.02,L0,0,2.25,-.3,0);bx(M.steel,L1,L1+.02,0,2.25,-.3,0);bx(M.steel,L0,L1,2.23,2.25,-.3,0);/* V11.1: the sill of the lift doorway (there was no floor between the car and the hall) */bx(M.steel,L0,L1,0,.006,-.31,0);
 // the glass of the home (the building's frames stand in it), and sheer curtains gathered at the bedroom glass
 plane(M.window,UW,C,UW/2,C/2,UD+.05,0,0);
 for(const u of[W+P+.25,UW-.28])for(let i=0;i<5;i++)add(M.curtain,new T.CylinderGeometry(.05,.06,C-.1,10,1,true),at(u+(i-2)*.07,(C-.1)/2,UD-.1-(i%2)*.04));
 bx(M.metal,W+P+.05,UW-.05,C-.06,C-.04,UD-.13,UD-.11);}
// The lift doors of the home: two steel leaves that slide into the wall.
function liftDoors(room,A){const T=room.T,M=room.M,g=new T.Group(),L0=A.LIFT.u0,L1=A.LIFT.u1,w=(L1-L0)/2;const leaves=[];for(const e of[-1,1]){const m=new T.Mesh(new T.BoxGeometry(w,2.24,.03),M.steel);m.position.set((L0+L1)/2+e*w/2,1.12,-.16);m.userData={e,x:(L0+L1)/2+e*w/2};g.add(m);leaves.push(m);}return{group:g,leaves};}
// ---- V9.5: the inside of a house (city-houses.js gives the plan) -----------------------------------------------------------
function houseShell(room,L,H){
 const T=room.T,M=room.M,IX=H.IX,IZ=H.IZ,UP=H.UP,C1=H.CEIL,C2=H.CEIL2,PART=H.PART,S=H.STAIR;
 const at=(x,y,z,rx=0,ry=0,rz=0)=>new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(1,1,1));
 const plane=(m,w,h,x,y,z,rx,ry)=>{if(w>.004&&h>.004)room.add(m,new T.PlaneGeometry(w,h),at(x,y,z,rx,ry,0));};
 const bx=(m,x0,x1,y0,y1,z0,z1)=>{if(x1-x0>.002&&y1-y0>.002&&z1-z0>.002)room.add(m,new T.BoxGeometry(x1-x0,y1-y0,z1-z0),at((x0+x1)/2,(y0+y1)/2,(z0+z1)/2));};
 const floorAt=(m,x0,x1,z0,z1,y)=>plane(m,x1-x0,z1-z0,(x0+x1)/2,y,(z0+z1)/2,-PI/2,0),ceilAt=(m,x0,x1,z0,z1,y)=>plane(m,x1-x0,z1-z0,(x0+x1)/2,y,(z0+z1)/2,PI/2,0);
 // floors: the toilet and the bathroom in stone or tile, the rest in the design's floor; the stairwell left open upstairs
 floorAt(M.floor,-IX,4.48,-IZ,IZ,.003);floorAt(M.floor,4.48,IX,-2.48,IZ,.003);floorAt(M.bathFloor,4.6,IX,-IZ,-2.6,.003);
 floorAt(M.floor,S.x1,IX,S.z1,IZ,UP+.003);floorAt(M.floor,-1.0,IX,-IZ,-1.52,UP+.003);floorAt(M.floor,-IX,IX,-1.52,S.z1,UP+.003);floorAt(M.bathFloor,-IX,-1.12,-IZ,-1.52,UP+.003);
 // ceilings, and the edge of the upper floor round the stairwell
 ceilAt(M.ceiling,-IX,IX,-IZ,S.z1,C1-.003);ceilAt(M.ceiling,S.x1,IX,S.z1,IZ,C1-.003);ceilAt(M.ceiling,-IX,IX,-IZ,IZ,C2-.003);
 plane(M.wall,IZ-S.z1,UP-C1,S.x1-.002,(C1+UP)/2,(S.z1+IZ)/2,0,-PI/2);plane(M.wall,S.x1+IX,UP-C1,(S.x1-IX)/2,(C1+UP)/2,S.z1+.002,0,0);
 // the walls of the house from inside, with the windows and the front door cut out; tiles in the bathrooms
 const sides={f:{along:'x',c:IZ-.002,ry:PI},b:{along:'x',c:-IZ+.002,ry:0},l:{along:'z',c:-IX+.002,ry:PI/2},r:{along:'z',c:IX-.002,ry:-PI/2}};
 const panel=(m,key,a,b,y0,y1,inset=0)=>{const sd=sides[key],ops=H.WINDOWS.filter(o=>o[0]===key&&o[3]<y1&&o[4]>y0).map(o=>[o[1],o[2],o[3],o[4]]);if(key==='f'&&y0<1)ops.push([H.DOOR[0],H.DOOR[1],0,H.DOOR[3]]);ops.sort((p,q)=>p[0]-q[0]);
  const c=sd.c+(key==='f'?-inset:key==='b'?inset:key==='l'?inset:-inset),piece=(u0,u1,v0,v1)=>{u0=Math.max(u0,a);u1=Math.min(u1,b);v0=Math.max(v0,y0);v1=Math.min(v1,y1);if(u1-u0<.004||v1-v0<.004)return;const w=u1-u0,h=v1-v0,u=(u0+u1)/2,v=(v0+v1)/2;if(sd.along==='x')plane(m,w,h,u,v,c,0,sd.ry);else plane(m,w,h,c,v,u,0,sd.ry);};
  let cur=a;for(const o of ops){if(o[1]<=a||o[0]>=b)continue;piece(cur,o[0],y0,y1);piece(o[0],o[1],y0,o[2]);piece(o[0],o[1],o[3],y1);cur=Math.max(cur,o[1]);}piece(cur,b,y0,y1);};
 for(const[y0,y1]of[[0,C1],[UP,C2]])for(const k of['f','b','l','r']){const lim=k==='f'||k==='b'?IX:IZ;panel(M.wall,k,-lim,lim,y0,y1);}
 /* V11.6: over the stairwell there is no ceiling or floor to hide the band of outer wall between the two storeys, so it
    gets its own wall there (on the side wall and on the front wall); before, you saw sky or grass through it */
 panel(M.wall,'l',S.z1,IZ,C1,UP);panel(M.wall,'f',-IX,S.x1,C1,UP);
 panel(M.tile,'r',-IZ,-2.6,0,C1,.006);panel(M.tile,'b',4.6,IX,0,C1,.006);panel(M.tile,'l',-IZ,-1.52,UP,C2,.006);panel(M.tile,'b',-IX,-1.12,UP,C2,.006);
 bx(M.tile,4.6,4.608,0,C1-.004,-IZ+.01,-2.61);bx(M.tile,4.61,4.95,0,C1-.004,-2.608,-2.6);bx(M.tile,5.75,IX-.01,0,C1-.004,-2.608,-2.6);
 bx(M.tile,-1.128,-1.12,UP,C2-.004,-IZ+.01,-1.53);bx(M.tile,-IX+.01,-3.6,UP,C2-.004,-1.528,-1.52);bx(M.tile,-2.7,-1.13,UP,C2-.004,-1.528,-1.52);
 // glass in every window (the house's own panes are hidden while you are inside) and a sill under it
 const mid={f:(H.IZ+H.HZ)/2,b:-(H.IZ+H.HZ)/2,l:-(H.IX+H.HX)/2,r:(H.IX+H.HX)/2};
 for(const[k,a,b,y0,y1]of H.WINDOWS){const sd=sides[k],w=b-a,u=(a+b)/2;if(sd.along==='x'){plane(M.window,w,y1-y0,u,(y0+y1)/2,mid[k],0,0);const z0=k==='f'?IZ-.06:-IZ,z1=k==='f'?IZ:-IZ+.06;bx(M.white,a-.04,b+.04,y0-.03,y0,z0,z1);}
  else{plane(M.window,w,y1-y0,mid[k],(y0+y1)/2,u,0,PI/2);const x0=k==='r'?IX-.06:-IX,x1=k==='r'?IX:-IX+.06;bx(M.white,x0,x1,y0-.03,y0,a-.04,b+.04);}}
 // walls inside, the heads over the doors, frames round every doorway
 for(const[,x0,z0,x1,z1,f]of H.WALLS)bx(M.wall,x0,x1,f?UP:0,(f?C2:C1)-.004,z0,z1);
 const fm=L.wall<'#5'?M.black:M.wood,t=.012;
 for(const[,x,z,axis,w,f]of H.DOORS){const y=f?UP:0,top=(f?C2:C1)-.004;bx(M.wall,x-w/2,x+w/2,y+2.2,top,z-PART/2,z+PART/2);for(const e of[-1,1])bx(fm,x+e*(w/2)-(e>0?t:0),x+e*(w/2)+(e<0?t:0),y,y+2.2,z-PART/2-.006,z+PART/2+.006);bx(fm,x-w/2+t,x+w/2-t,y+2.2-t,y+2.2,z-PART/2-.006,z+PART/2+.006);}
 for(const e of[-1,1])bx(fm,H.DOOR[e<0?0:1]+(e<0?0:-t),H.DOOR[e<0?0:1]+(e<0?t:0),0,H.DOOR[3],IZ-.01,IZ);
 // the stairs: plastered steps with wooden treads, a handrail on balusters along the open side
 const run=(S.z0-S.z1)/S.steps;for(let k=0;k<S.steps;k++){const top=(k+1)*UP/S.steps,z1=S.z0-k*run,z0=z1-run;bx(M.wall,S.x0+.004,S.x1,0,top-.035,z0,z1);bx(M.wood,S.x0+.004,S.x1+.012,top-.035,top,z0,Math.min(z1+.02,S.z0+.02));}
 const railTop=z=>(S.z0-z)/(S.z0-S.z1)*UP+.95;{const zA=3.6,zB=S.z1+.05,yA=railTop(zA),yB=railTop(zB),len=Math.hypot(zA-zB,yA-yB),ang=Math.atan2(yB-yA,zA-zB);room.add(M.wood,new T.CylinderGeometry(.025,.025,len,10),at(S.x1+.0,(yA+yB)/2,(zA+zB)/2,ang-PI/2,0,0));
  for(let z=zA;z>zB;z-=.3){const foot=(S.z0-z)/(S.z0-S.z1)*UP,top=railTop(z);room.add(M.wood,new T.CylinderGeometry(.012,.012,top-foot,6),at(S.x1+.0,(foot+top)/2,z));}room.add(M.wood,new T.BoxGeometry(.06,1.05,.06),at(S.x1,.525,zA));}
 // lights in the ceilings
 for(const[x,y,z]of[[2.5,C1,1.5],[-3.2,C1,-2.9],[2,C1,-2.3],[-2.6,C2,2.5],[3.8,C2,2.4],[2.8,C2,-3.2],[-3.6,C2,-3.2],[0,C2,-.6],[5.4,C1,-3.7]])room.add(M.light,new T.CylinderGeometry(.07,.07,.01,16),at(x,y-.012,z));}
function buildHouseInside(scene,h){
 const T=scene.T,H=root.CityHouses,design=h.design,L=LOOKS[design];if(!L||!H)return null;
 const M=cache[design]?.M||makeMats(T,L);cache[design]={M};
 const room=new Room(T,M),K=kit(room,L,design);houseShell(room,L,H);
 for(const it of H.layout(design)){const f=K[it.k];if(f)try{f(it);}catch(e){scene.apartmentRoomError=(scene.apartmentRoomError||'')+'house '+it.k+': '+(e&&e.message)+'; ';}}
 const group=room.build('house-inside:'+h.id);group.position.set(h.x,h.y,h.z);group.rotation.y=H.yawOf(h);
 const lights=[];for(const[x,y,z,i]of[[2.5,2.6,1.5,.9],[0,2.6,-2.6,.8],[-1.5,5.9,2.3,.7],[2.5,5.9,-2.6,.6]]){const l=new T.PointLight('#ffe7c8',i,9,2);l.position.set(x,y,z);l.userData.base=i;group.add(l);lights.push(l);}
 return{id:'house:'+h.id,house:true,group,doors:{leaves:[]},lights,design};}
// ---- building one home and keeping it up to date ---------------------------------------------------------------------------
const cache={};
function buildHome(scene,unitId){
 const T=scene.T,A=AP(),p=A.parseUnit(unitId),s=A.site(p.site),design=s[3],L=LOOKS[design];if(!L)return null;
 const M=cache[design]?.M||makeMats(T,L);cache[design]={M};
 const room=new Room(T,M),K=kit(room,L,design);shell(room,L,A);
 for(const it of A.layout(design)){const f=K[it.k];if(f)try{f(it);}catch(e){scene.apartmentRoomError=(scene.apartmentRoomError||'')+it.k+': '+(e&&e.message)+'; ';}}
 const group=room.build('apt-home:'+unitId),k=A.sideSign(p.side),doors=liftDoors(room,A);group.add(doors.group);
 group.position.set(s[2]+k*.1,A.G+A.level(p.floor),(A.zfOf?A.zfOf(s):A.ZF)+A.BACK);group.scale.x=k;
 // lights: the living room, the kitchen, the bedroom and the bathroom (warm, brighter at night)
 const lights=[];for(const[u,v,i]of[[3.2,10.6,1],[6.2,3.2,.8],[12.6,9.6,.8],[12.6,2.4,.6],[2,-1.4,.35]]){const l=new T.PointLight('#ffe7c8',i,9,2);l.position.set(u,2.6,v);l.userData.base=i;group.add(l);lights.push(l);}
 return{id:unitId,group,doors,lights,design};}
function update(scene){
 const sim=root.PlatdoCity?.sim,A=AP();if(!sim||!A)return;const p=sim.player,u=A.unitAt(p.x,p.y,p.z);
 // keep the home you are in (and the one the camera is in during the lift's short film) built
 let want=u?u.id:null,house=null;
 /* V9.5: or the house you are in, or the house of yours whose front door you are near (so the open door shows its rooms) */
 const HS=root.CityHouses;if(!want&&HS){const hit=HS.houseAt(sim.world,p.x,p.y,p.z);if(hit)house=hit.house;else if(!sim.onlineRoom)for(const id of HS.ownedList(sim)){const q=HS.byId(sim.world,id);if(!q)continue;const d=HS.toWorld(q,0,0,HS.HZ);if(Math.hypot(p.x-d.x,p.z-d.z)<12){house=q;break;}}if(house)want='house:'+house.id;}
 let h=scene.apartmentHome;
 if(h&&h.id!==want){h.group.removeFromParent();h.group.traverse(o=>{if(o.geometry)o.geometry.dispose();});scene.apartmentHome=h=null;}
 if(!h&&want){h=house?buildHouseInside(scene,house):buildHome(scene,want);if(h){scene.scene.add(h.group);scene.apartmentHome=h;}}
 if(!h)return;const open=root.CityApartmentsLife?.carDoor?.()||0;for(const m of h.doors.leaves)m.position.x=m.userData.x+m.userData.e*open*(.55);
 const night=sim.dayTime<.27||sim.dayTime>.77;for(const l of h.lights)l.intensity=l.userData.base*(night?1.5:.55);}
root.CityApartmentsRooms={buildHome,buildHouseInside,update,LOOKS,kit,makeMats,rbox,tex};
})(typeof globalThis!=='undefined'?globalThis:this);
