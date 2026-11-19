
/* PLATDO trees and rocks (V4.7). Shapes shared by Platdo City and Platdo Drive.
 * - leaf(): a clump of foliage. It used to be one faceted ball; it is now several overlapping lobes with a
 *   lumpy surface and soft shading, so a crown reads as leaves and not as a balloon.
 * - rock(): a boulder. A lumpy ball with flat chiselled faces cut into it and a flat underside, shaded in facets.
 * - cityTree(): the City's trees. Every tree used to be the same five balls on sticks. There are now four kinds
 *   (broadleaf, conifer, birch, poplar), each built from the prop's own seed, so no two are alike. The trunk and
 *   crown stay inside the same space as before, so what you bump into has not changed.
 * Nothing here decides collisions: Drive rescales these shapes into the old outline, and the City's tree
 * colliders come from the world file as before. */
(function(root){'use strict';
if(root.PlatdoFlora)return;
const TAU=Math.PI*2;
const rng=seed=>{let s=(seed>>>0)||1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};};
const hashText=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
// Smooth noise in space: random values on a grid, blended between the corners. Returns 0..1.
const lattice=(x,y,z,seed)=>{let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,2147483647)^Math.imul(seed,1274126177);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;};
function noise(x,y,z,seed){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),fx=x-xi,fy=y-yi,fz=z-zi,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz),L=(a,b,c)=>lattice(xi+a,yi+b,zi+c,seed),mix=(a,b,t)=>a+(b-a)*t;
 return mix(mix(mix(L(0,0,0),L(1,0,0),u),mix(L(0,1,0),L(1,1,0),u),v),mix(mix(L(0,0,1),L(1,0,1),u),mix(L(0,1,1),L(1,1,1),u),v),w);}
const cache=new Map();
function finish(T,positions,normals){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));if(normals)g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));else g.computeVertexNormals();
 const uv=new Float32Array(positions.length/3*2);for(let i=0;i<uv.length/2;i++){uv[i*2]=positions[i*3]*.5+.5;uv[i*2+1]=positions[i*3+1]*.5+.5;}g.setAttribute('uv',new T.BufferAttribute(uv,2));g.computeBoundingBox();g.computeBoundingSphere();return g;}
// level 0..5 is the game's model detail. radius is the size of the finished shape (1 for Drive, .5 for the City).
function leaf(T,level=5,radius=1){
 const key='leaf/'+level+'/'+radius;if(cache.has(key))return cache.get(key).clone();
 // One lobe on the lowest settings, three in the middle, four at the top: 80, 240 or 320 triangles a clump.
 const lobes=level<=1?[[0,0,0,1]]:level<=3?[[0,-.06,0,.82],[.4,.16,.14,.56],[-.36,.2,-.24,.54]]:[[0,-.06,0,.8],[.42,.12,.1,.56],[-.36,.2,-.26,.55],[-.05,.3,.42,.5]];
 const source=new T.IcosahedronGeometry(1,1),a=source.attributes.position,positions=[],normals=[];
 for(let k=0;k<lobes.length;k++){const[cx,cy,cz,r]=lobes[k];
  for(let i=0;i<a.count;i++){let x=a.getX(i),y=a.getY(i),z=a.getZ(i);const n=.82+.36*noise(x*1.9+k*7.3,y*1.9+3.1,z*1.9-k*2.7,17+k),px=cx+x*r*n,py=cy+y*r*n*.86,pz=cz+z*r*n;positions.push(px*radius,py*radius,pz*radius);
   // Shading follows the lobe's own roundness, leaning a little toward the clump's centre so lobes blend.
   let nx=x*.75+px*.4,ny=y*.75+py*.4+.1,nz=z*.75+pz*.4;const l=Math.hypot(nx,ny,nz)||1;normals.push(nx/l,ny/l,nz/l);}}
 source.dispose();const g=finish(T,positions,normals);g.userData.citySharedShape='flora-leaf';cache.set(key,g);return g.clone();
}
function rock(T,level=5,radius=1){
 const key='rock/'+level+'/'+radius;if(cache.has(key))return cache.get(key).clone();
 const source=new T.IcosahedronGeometry(1,level<=2?1:2),a=source.attributes.position,positions=[],R=rng(4471),cuts=[];
 for(let i=0;i<15;i++){const t=R()*TAU,u=R()*1.5-.45,c=Math.sqrt(Math.max(0,1-u*u*.6));cuts.push([Math.cos(t)*c,u*.78,Math.sin(t)*c,.7+R()*.22]);}
 for(const c of cuts){const l=Math.hypot(c[0],c[1],c[2])||1;c[0]/=l;c[1]/=l;c[2]/=l;}
 for(let i=0;i<a.count;i++){let x=a.getX(i),y=a.getY(i),z=a.getZ(i);const n=.84+.3*noise(x*1.4+5,y*1.4+9,z*1.4+2,91)+.16*noise(x*3.4,y*3.4,z*3.4,57)+.08*noise(x*7.1,y*7.1,z*7.1,23);x*=n;y*=n*.82;z*=n*.94;
  // Each cut is a flat face: anything beyond it is pressed back onto it, like a break in the stone.
  for(const c of cuts){const over=x*c[0]+y*c[1]+z*c[2]-c[3];if(over>0){x-=c[0]*over;y-=c[1]*over;z-=c[2]*over;}}
  if(y<-.52)y=-.52;positions.push(x*radius,y*radius,z*radius);}
 source.dispose();const g=finish(T,positions,null);g.userData.citySharedShape='flora-rock';cache.set(key,g);return g.clone();
}
// Shapes for the City's shared-geometry table. null for a type that is not ours.
function cityGeometry(scene,type){
 if(type!=='flora-leaf'&&type!=='flora-rock')return null;
 const g=type==='flora-leaf'?leaf(scene.T,scene.modelDetail??5,.5):rock(scene.T,scene.modelDetail??5,.5);g.userData.citySharedShape=type;return g;
}
// ---- City trees -----------------------------------------------------------------------------------------
const GREENS=[['#4b7a3c','#5c8b46','#6d9c52','#3c6a33'],['#567f44','#67904d','#79a45b','#476f39'],['#587a50','#688b5a','#7b9e66','#476943'],['#63803f','#759247','#88a552','#526f36']];
function cityTree(scene,b,p){
 const T=scene.T,x=p.x,y=p.y,z=p.z,w=p.w||7,h=p.h||10,R=rng(hashText(String(p.id||x+','+z))),pick=R(),size=.9+R()*.2,up=new T.Vector3(0,1,0),dir=new T.Vector3(),quat=new T.Quaternion(),euler=new T.Euler();
 // A round limb from a to c, thicker at a.
 const limb=(a,c,r,color)=>{dir.set(c[0]-a[0],c[1]-a[1],c[2]-a[2]);const len=dir.length();if(len<.01)return;quat.setFromUnitVectors(up,dir.normalize());euler.setFromQuaternion(quat);scene.part(b,'cylinder',color,(a[0]+c[0])/2,(a[1]+c[1])/2,(a[2]+c[2])/2,r*2,len,r*2,euler.x,euler.y,euler.z,'matte');};
 const clump=(cx,cy,cz,s,color,squash=.82)=>scene.part(b,'flora-leaf',color,cx,cy,cz,s,s*squash,s,0,R()*TAU,0,'foliage');
 if(pick<.52){
  // Broadleaf: a short thick trunk, a ring of rising limbs, and a crown of many clumps, darker inside and below.
  const bark='#6b5946',G=GREENS[Math.floor(R()*GREENS.length)],W=w*size,fork=[x+(R()-.5)*.3,y+h*.34,z+(R()-.5)*.3],n=4+Math.floor(R()*2),start=R()*TAU;
  limb([x,y-.1,z],fork,.2+W*.022,bark);
  for(let i=0;i<4;i++){const a=start+i*TAU/4;limb([x+Math.cos(a)*.55,y-.05,z+Math.sin(a)*.55],[x+Math.cos(a)*.1,y+.75,z+Math.sin(a)*.1],.13,bark);}
  clump(x,y+h*.66,z,W*.64,G[3],.9);
  for(let i=0;i<n;i++){const a=start+i*TAU/n+(R()-.5)*.5,reach=W*(.22+R()*.07),mid=[fork[0]+Math.cos(a)*reach*.5,fork[1]+h*.15,fork[2]+Math.sin(a)*reach*.5],tip=[x+Math.cos(a)*reach,y+h*(.58+R()*.08),z+Math.sin(a)*reach];
   limb(fork,mid,.13,bark);limb(mid,tip,.085,bark);
   clump(tip[0],tip[1]+h*.03,tip[2],W*(.46+R()*.09),G[i%3]);
   clump(tip[0]+Math.cos(a+.6)*W*.1,tip[1]+h*.12,tip[2]+Math.sin(a+.6)*W*.1,W*(.34+R()*.07),G[(i+1)%3]);
   clump(tip[0]+Math.cos(a-.5)*W*.14,tip[1]-h*.06,tip[2]+Math.sin(a-.5)*W*.14,W*(.32+R()*.06),G[3]);}
  limb(fork,[x,y+h*.76,z],.11,bark);
  for(let i=0;i<3;i++){const a=start+1+i*TAU/3;clump(x+Math.cos(a)*W*.11,y+h*(.8+R()*.05),z+Math.sin(a)*W*.11,W*(.4+R()*.07),G[2-(i%2)]);}
  clump(x,y+h*.9,z,W*.34,G[2]);
 }else if(pick<.7){
  // Conifer: a straight trunk and six skirts of needles, each narrower and paler than the one below.
  const bark='#5a4636',G=['#2c5539','#30603e','#356a44','#3b744a','#427e50','#4a8958'],W=w*size*.78,n=6,turn=R()*TAU;
  limb([x,y-.1,z],[x,y+h*.9,z],.17,bark);
  for(let i=0;i<n;i++){const t=i/(n-1),r=W*.5*(1-t*.8)+.2,ch=h*.27*(1-t*.3),cy=y+h*(.17+.66*t);scene.part(b,'cone',G[i],x,cy+ch/2,z,r*2,ch,r*2,0,turn+i*.9,0,'foliage');}
 }else if(pick<.86){
  // Birch: two or three pale leaning stems with dark bands and a light, airy crown.
  const G=['#7da556','#8cb463','#9bc272','#6c9449'],W=w*size,stems=2+Math.floor(R()*2),start=R()*TAU;
  for(let s=0;s<stems;s++){const a=start+s*TAU/stems+(R()-.5)*.6,foot=[x+Math.cos(a)*.25,y-.1,z+Math.sin(a)*.25],top=[x+Math.cos(a)*W*(.2+R()*.12),y+h*(.82+R()*.12),z+Math.sin(a)*W*(.2+R()*.12)],at=t=>[foot[0]+(top[0]-foot[0])*t,foot[1]+(top[1]-foot[1])*t,foot[2]+(top[2]-foot[2])*t];
   limb(foot,top,.1,'#e6e2d6');
   for(let k=0;k<5;k++){const t=.08+k*.1+R()*.04;limb(at(t),at(t+.01),.104,'#3d3b36');}
   // Small side branches carry the leaves, so the crown hangs round the stem instead of sitting on it.
   for(let k=0;k<8;k++){const t=.42+k*.075,q=at(t),o=a+k*2.4+R()*.6,reach=W*(.17-k*.012),e=[q[0]+Math.cos(o)*reach,q[1]+.25+R()*.3,q[2]+Math.sin(o)*reach];limb(q,e,.035,'#cfcabb');clump(e[0],e[1],e[2],W*(.25-k*.014)+R()*.15,G[(k+s)%4],.8);}
   clump(top[0],top[1]+.15,top[2],W*.22,G[2],.9);}
 }else{
  // Poplar: tall and narrow, a column of clumps tapering to a point.
  const bark='#5f5140',G=GREENS[1],W=w*size*.4,profile=[.6,.86,1,1,.96,.88,.74,.56,.34];
  limb([x,y-.1,z],[x,y+h*.34,z],.16,bark);
  for(let i=0;i<profile.length;i++)clump(x+(R()-.5)*.3,y+h*(.2+i*.092),z+(R()-.5)*.3,W*profile[i],G[(i+(i>5?1:0))%3],1.4);
 }
}
root.PlatdoFlora={leaf,rock,cityGeometry,cityTree,noise};
})(typeof globalThis!=='undefined'?globalThis:this);
