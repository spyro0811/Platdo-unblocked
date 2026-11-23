
/* PLATDO City: the smaller map (V7.2, map redesign). Shared by the game and the multiplayer host.
 *
 * Every position in the other files is still written as it was in layout 7. This file is the one rule that says where
 * such a spot is now. Only north-south positions (z) change: everything moves toward the beach front.
 *  - The beach, the coast road and the front row (old z 680 and more) stay where they are.
 *  - The city and the town: the empty strips between the rows of buildings are squeezed to an alley. A strip is given
 *    as [north edge, south edge, new depth]. Between two strips nothing is squeezed, so a building, a shop and
 *    everything in and around it move as one piece and keep their distance to the street they stand on.
 *  - The hills (old z -460 to -1240) are made 0.7 times as deep, so they stand closer behind the city.
 *  - Everything north of the hills (Northhaven, the stunt park, the north shore) moves south as one piece.
 *  - The airport (west of x -900, old z above -300) does not move: it has the sea on its south side.
 * Z(z) takes an old z to the new one, Zinv(z) the other way; F and Finv do the same but leave the airport alone. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.CityCompact=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const ALLEY=5;
const STRIPS=[[596,680,6],[507,525,ALLEY],[417,443,ALLEY],[287,312,ALLEY],[231,253,ALLEY],[79,115,ALLEY],[-1,43,ALLEY],[-133,-113,ALLEY],[-191,-167,ALLEY],[-313,-289,ALLEY],[-372,-348,ALLEY]];
const HILL={south:-460,north:-1240,k:.7};
// Corner points [old z, new z] from the front row northward; between two of them the rule is a straight line.
const B=[[680,680]];
{let o=680,n=680;const to=(old,scale)=>{n-=(o-old)*scale;o=old;B.push([o,n]);};
 for(const[north,south,depth]of STRIPS){if(south<o)to(south,1);to(north,depth/(south-north));}
 to(HILL.south,1);to(HILL.north,HILL.k);}
const LAST=B[B.length-1],NORTH11=LAST[1]-LAST[0],mm=v=>Math.round(v*1000)/1000;
// (to the millimetre, so two roads that meet at one spot get exactly the same number for it)
function Z11(z){if(!(z<B[0][0]))return z;if(z<=LAST[0])return z+NORTH11;for(let i=1;i<B.length;i++)if(z>=B[i][0]){const a=B[i-1],b=B[i];return mm(b[1]+(z-b[0])*(a[1]-b[1])/(a[0]-b[0]));}return z+NORTH11;}
function Z11inv(z){if(!(z<B[0][1]))return z;if(z<=LAST[1])return z-NORTH11;for(let i=1;i<B.length;i++)if(z>=B[i][1]){const a=B[i-1],b=B[i];return mm(b[0]+(z-b[1])*(a[0]-b[0])/(a[1]-b[1]));}return z-NORTH11;}
/* V7.8: the map half as deep. Second step, on the positions of layout 11 (as they were in V7.7):
 * - Exchange Avenue (159) and south of it stay.
 * - The two rows of blocks between the bypass (-129) and Exchange Avenue are taken out: anything in them goes to VOID
 *   (50000 and more) and the world drops it. The bypass lands exactly on Exchange Avenue.
 * - A 40 m strip north of it stays as it is, then the hills are HILL2 times as deep (and as high: see hillScale), the
 *   open land up to Northhaven goes from 130 to 40 m, and everything north of that moves south as one piece. */
const EDGE=159,CUT=-129,VOID=50000,HILL2=1,C2=[[CUT,EDGE],[-169,EDGE-40]];C2.push([-715,C2[1][1]-(715-169)*HILL2]);C2.push([-845,C2[2][1]-40]);
const SHIFT2=C2[C2.length-1][1]-C2[C2.length-1][0];
/* V8.0: the user wanted the map narrower west to east, not shorter, so this step is no longer part of the map (G is
 * the identity again); G12 and G12inv are kept to bring saves from V7.8 and V7.9 (layout 12) back. */
/* V8.7: the warehouse row (Harbor Avenue z 472 to Foundry Way z 658) is taken out and everything north of it moves
 * ROW metres south. G and Ginv work on positions of layout 14 (as they lay in V8.0 to V8.6). */
const ROW_N=472,ROW_S=658,ROW=ROW_S-ROW_N;
const G=z=>z>=ROW_S?z:z>=ROW_N?VOID+z:mm(z+ROW),Ginv=z=>z>=VOID/2?z-VOID:z>=ROW_S?z:mm(z-ROW),NORTH=NORTH11+ROW;
// For a position written as it lies (the coastline, the runway, ...): the row itself is squeezed onto Foundry Way.
const GL=z=>z>=ROW_S?z:z>=ROW_N?ROW_S:mm(z+ROW);
function G12(z){if(z>=EDGE)return z;if(z>CUT)return VOID+z;for(let i=1;i<C2.length;i++)if(z>=C2[i][0]){const a=C2[i-1],b=C2[i];return mm(b[1]+(z-b[0])*(a[1]-b[1])/(a[0]-b[0]));}return mm(z+SHIFT2);}
function G12inv(z){if(z>=VOID/2)return z-VOID;if(z>=EDGE)return z;for(let i=1;i<C2.length;i++)if(z>=C2[i][1]){const a=C2[i-1],b=C2[i];return mm(b[0]+(z-b[1])*(a[0]-b[0])/(a[1]-b[1]));}return mm(z-SHIFT2);}
const isVoid=z=>z>=VOID/2;
/* V8.3: east of here is sea now (Larkspan and the hill mansions are gone): x beyond 470, or 540 north of z -700
 * (Northhaven and the airport). Asked with positions as they lie. */
/* V11.8: and Larkspan's four bare blocks with the strip of houses east of them: from just east of the city's last street
 * (x 260) out to sea, between the Northern City Bypass (z 57) and Foundry Way (z 658). Asked with positions as they lie. */
const isBay=(x,z)=>x>272&&x<640&&z>72&&z<642;
const isCut=(x,z)=>x>(z<-700+ROW?540:440)||isBay(x,z);
function Z(z){return G(Z11(z));}
function Zinv(z){return Z11inv(Ginv(z));}
const airport=(x,z)=>x<-900&&z>-300;
const F=(x,z)=>airport(x,z)?z:Z(z),Finv=(x,z)=>airport(x,z)?z:Zinv(z);
// (V7.8: where a spot of layout 7 was in layout 11, as in V7.7, for bringing old saves over one step at a time)
const F11=(x,z)=>airport(x,z)?z:Z11(z);
// The hills are shaped by their old z. For a new z this gives that old z, or null where there is no hill.
const HILL_NEW={south:Z11(-440),north:Z11(HILL.north),edge:Z11(HILL.south)};
// (V7.8: asked with a position of now, it first goes back to layout 11)
function hillOld(z){z=Ginv(z);if(z>=HILL_NEW.south||z<=HILL_NEW.north)return null;return z>=HILL_NEW.edge?z-(HILL_NEW.edge-HILL.south):HILL.south+(z-HILL_NEW.edge)/HILL.k;}
// V7.8: the hills are as much lower as they are less deep, so a climb over them is no steeper than it was
const hillScale=HILL2;
// A whole list of [x,z] or [x,z,height] road points.
// (V7.8: a point with its own height north of Exchange Avenue goes down with the hills)
const lower=(z,y)=>z<EDGE&&y>2.6?mm(2.5+(y-2.5)*HILL2):y;
const points=list=>list.map(p=>{if(p.length>2){const z=F(p[0],p[1]);return[p[0],z,lower(z,p[2]),...p.slice(3)];}return[p[0],F(p[0],p[1])];});
return{LAYOUT:15,isBay,GL,ROW,ROW_N,ROW_S,isCut,G12,G12inv,STRIPS,HILL,ALLEY,NORTH,Z,Zinv,F,Finv,F11,Z11,hillOld,hillScale,points,lower,corners:B,VOID,isVoid,G,Ginv,EDGE,CUT};
});
