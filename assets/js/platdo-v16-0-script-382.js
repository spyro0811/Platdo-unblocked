
/* PLATDO City painted map (V4.8). The island map and the minimap share one picture of the island. It used to be
 * flat fills with 30-metre squares for the hills. This paints it like an illustrated map instead:
 * - the real shoreline, read from the ground itself, with pale shallows, a foam line and a soft outline;
 * - land coloured by height (wet sand, sand, meadow, hill, rock, summit) and shaded as if lit from the north-west;
 * - the beach and the motocross park in their own sand and earth colours;
 * - roads as cream ribbons with a brown edge and a dashed centre line; bridges, runway and tracks outlined;
 * - buildings as little blocks with a roof, a front face and a shadow, coloured by kind; round trees with a highlight;
 * - brush blotches, paper grain, wave strokes on the sea, sailboats and a compass rose.
 * badge() draws a place marker: a coloured disc with a picture. label() draws a name with a thick cream edge.
 * Only the look is here. Picking, routes, panning and the minimap's turning stay in the map module. */
(function(root){'use strict';
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const rng=seed=>{let s=(seed>>>0)||1;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};};
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
// Colour ramps: [height in metres, colour]. Heights below zero are sea.
// (The town stands at about 2.5 m, so sand ends just below that, as it does on the ground itself.)
const LAND=[[0,'#e2c784'],[1.1,'#f3dc98'],[2.1,'#f1dc9a'],[2.42,'#a5d674'],[9,'#9bd06e'],[24,'#8cc466'],[44,'#7fb55e'],[64,'#8daf68'],[84,'#a5a97c'],[104,'#b7ab8a'],[130,'#cdc1a3']].map(([h,c])=>[h,hex(c)]);
const SEA=[[0,'#e8fbf4'],[.35,'#a4ebe0'],[2.5,'#7fd9e2'],[7,'#55bfe6'],[14,'#3fa7df'],[40,'#3a9bd8']].map(([h,c])=>[h,hex(c)]);
function ramp(table,v,out){let i=1;while(i<table.length-1&&v>table[i][0])i++;const a=table[i-1],b=table[i],t=clamp((v-a[0])/(b[0]-a[0]||1),0,1);out[0]=mix(a[1][0],b[1][0],t);out[1]=mix(a[1][1],b[1][1],t);out[2]=mix(a[1][2],b[1][2],t);return out;}
const ROOFS={tower:['#b7c6d6','#8296ab'],brick:['#dc7c5c','#b55c44'],townhouse:['#e08f5a','#b96c3f'],industrial:['#aab6b0','#7f8d87'],coast:['#f2c66d','#d09f45'],hill:['#c9b28a','#a08a62'],safehouse:['#f0a35a','#c77b3a'],garage:['#9fb1bd','#74889a'],warehouse:['#b5a78d','#8d7f66'],hangar:['#c3ccd0','#93a0a8'],terminal:['#d7dde0','#a3afb6'],clothing:['#f39ac0','#c96a95'],equipment:['#9bb07a','#6f8552'],diner:['#e2574a','#b03a30'],restaurant:['#f39c3d','#c9761f'],'six-seven':['#3fb27f','#1f8a5b'],marina:['#6fc2c9','#3f97a0'],relay:['#c3c7ba','#93988a'],casino:['#f1c84b','#c79a22'],'premium-home':['#f6efe0','#c9bfa6']};
// V5.7: the same picture can be painted again for one small square of the island at many more pixels per metre
// (options.tile), so the minimap and a zoomed-in map stay sharp. Everything that used to be scattered at random
// over the sheet (tufts, brush blotches, wave strokes, sailboats, the compass) is remembered in world positions
// when the whole island is painted, and a tile draws the ones that fall on it: a tile is the island picture, sharper.
const decor=new WeakMap(),NONE={tufts:[],blots:[],waves:[],boats:[],compass:null};
function paint(world,bounds,width,options){
 const doc=root.document,spanX=bounds.right-bounds.left,spanZ=bounds.bottom-bounds.top,W=width,H=Math.round(W*spanZ/spanX),s=W/spanX,X=x=>(x-bounds.left)*s,Z=z=>(z-bounds.top)*s;
 const canvas=doc.createElement('canvas');canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');c.lineJoin='round';c.lineCap='round';
 const Beach=root.CityBeach,Park=root.CityRecreation,R=rng(60417),tile=!!options?.tile,D=tile?decor.get(world)||NONE:{tufts:[],blots:[],waves:[],boats:[],compass:null};
 const near=(x,z,m)=>!tile||(x>bounds.left-m&&x<bounds.right+m&&z>bounds.top-m&&z<bounds.bottom+m),wx=x=>bounds.left+x/s,wz=y=>bounds.top+y/s;
 // ---- 1. ground: one sample every four pixels, coloured and shaded, then drawn enlarged so it blends like paint
 const gw=Math.ceil(W/4)+1,gh=Math.ceil(H/4)+1,step=4/s,ht=new Float32Array(gw*gh),hx=i=>bounds.left+i*step,hz=j=>bounds.top+j*step;
 for(let j=0;j<gh;j++)for(let i=0;i<gw;i++)ht[j*gw+i]=world.terrainHeight(hx(i),hz(j));
 const small=doc.createElement('canvas');small.width=gw;small.height=gh;const sc=small.getContext('2d'),img=sc.createImageData(gw,gh),px=img.data,col=[0,0,0];
 /* the light on a slope is the same whatever the size of a sample; a tile reads the ground beyond its own edge so its shading meets its neighbour's */
 const slope=tile?.1125/step:.75*.03/Math.max(.6,step/5),out=(i,j)=>world.terrainHeight(hx(i),hz(j));
 for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){const k=j*gw+i,h=ht[k],o=k*4;
  if(h<=0){ramp(SEA,-h,col);const far=clamp((-h-9)/6,0,1)*.06;col[0]*=1-far;col[1]*=1-far*.6;}
  else{/* hills are painted in steps of ten metres, softened, like layers of colour */ramp(LAND,h>12?mix(h,Math.round(h/10)*10,.65):h,col);const x=hx(i),z=hz(j);
   if(Beach?.weight){const wgt=Beach.weight(x,z);if(wgt>0&&h>.9){const sand=h<1.6?[236,212,146]:[246,226,160];for(let q=0;q<3;q++)col[q]=mix(col[q],sand[q],clamp(wgt*1.4,0,1));}}
   if(Park?.groundTint){const t=Park.groundTint(x,z);if(t)for(let q=0;q<3;q++)col[q]=mix(col[q],clamp(t.c[q]*255*1.12+18,0,255),clamp(t.w,0,1));}
   const l=i>0?ht[k-1]:tile?out(i-1,j):h,r=i<gw-1?ht[k+1]:tile?out(i+1,j):h,u=j>0?ht[k-gw]:tile?out(i,j-1):h,d=j<gh-1?ht[k+gw]:tile?out(i,j+1):h,shade=clamp(1+((l-r)+(u-d))*slope,.84,1.13);
   col[0]*=shade;col[1]*=shade;col[2]*=shade*(shade<1?1.03:1);}
  px[o]=clamp(col[0],0,255);px[o+1]=clamp(col[1],0,255);px[o+2]=clamp(col[2],0,255);px[o+3]=255;}
 sc.putImageData(img,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(small,0,0,gw,gh,-2,-2,gw*4,gh*4);/* shifted half a sample so each sample sits on its own spot */
 // ---- 2. lines of equal height, as short strokes: the shoreline (foam first, then the edge) and hill contours
 const contour=level=>{const out=[];for(let j=0;j<gh-1;j++)for(let i=0;i<gw-1;i++){const a=ht[j*gw+i]-level,b=ht[j*gw+i+1]-level,e=ht[(j+1)*gw+i+1]-level,d=ht[(j+1)*gw+i]-level,code=(a>0?1:0)|(b>0?2:0)|(e>0?4:0)|(d>0?8:0);if(!code||code===15)continue;
  const t=(p,q)=>clamp(p/(p-q),0,1),top=[i+t(a,b),j],right=[i+1,j+t(b,e)],bottom=[i+t(d,e),j+1],left=[i,j+t(a,d)],seg=(p,q)=>out.push(p[0]*4,p[1]*4,q[0]*4,q[1]*4);
  switch(code){case 1:case 14:seg(left,top);break;case 2:case 13:seg(top,right);break;case 4:case 11:seg(right,bottom);break;case 8:case 7:seg(bottom,left);break;case 3:case 12:seg(left,right);break;case 6:case 9:seg(top,bottom);break;case 5:seg(left,top);seg(right,bottom);break;case 10:seg(top,right);seg(bottom,left);break;}}return out;};
 const strokeLines=(lines,w,style)=>{c.strokeStyle=style;c.lineWidth=w;c.beginPath();for(let i=0;i<lines.length;i+=4){c.moveTo(lines[i],lines[i+1]);c.lineTo(lines[i+2],lines[i+3]);}c.stroke();};
 for(let level=20;level<=120;level+=20)strokeLines(contour(level),Math.max(.9,1.3*s),level%40?'rgba(96,84,50,.2)':'rgba(96,84,50,.34)');
 const shore=contour(0);strokeLines(shore,Math.max(3,7*s),'rgba(255,255,255,.55)');strokeLines(shore,Math.max(1.2,2.2*s),'rgba(120,96,58,.55)');
 // Tufts of grass and a few flowers on open low ground, so the meadows are not blank.
 const tuft=(x,y,i)=>{const k=s*1.5;
  if(i%9===0){c.fillStyle=['#fff6c9','#ffd0e0','#ffe08a'][i%3];c.beginPath();c.arc(x,y,1.5*k,0,TAU);c.fill();return;}
  c.strokeStyle='rgba(58,120,52,.4)';c.lineWidth=Math.max(.8,1.1*s);c.beginPath();c.moveTo(x-2.6*k,y);c.lineTo(x-1.2*k,y-3.4*k);c.moveTo(x,y);c.lineTo(x,y-4.4*k);c.moveTo(x+2.6*k,y);c.lineTo(x+1.2*k,y-3.4*k);c.stroke();};
 if(tile){const T=D.tufts;for(let n=0;n<T.length;n+=3)if(near(T[n],T[n+1],8))tuft(X(T[n]),Z(T[n+1]),T[n+2]);}
 else for(let i=0;i<5200;i++){const x=R()*W,y=R()*H,gi=Math.min(gw-1,Math.round(x/4)),gj=Math.min(gh-1,Math.round(y/4)),h=ht[gj*gw+gi];if(h<2.7||h>60)continue;D.tufts.push(wx(x),wz(y),i);tuft(x,y,i);}
 // ---- 3. brush blotches on everything, wave strokes on open water
 const blot=(x,y,r,q,turn,light)=>{c.fillStyle=light?'rgba(255,255,255,.035)':'rgba(20,40,30,.028)';c.beginPath();c.ellipse(x,y,r,r*q,turn,0,TAU);c.fill();};
 if(tile){for(const b of D.blots)if(near(b[0],b[1],b[2]))blot(X(b[0]),Z(b[1]),b[2]*s,b[3],b[4],b[5]);}
 else for(let i=0;i<520;i++){const x=R()*W,y=R()*H,r=(18+R()*70)*s*1.6,light=R()<.5,q=.5+R()*.5,turn=R()*3;D.blots.push([wx(x),wz(y),r/s,q,turn,light]);blot(x,y,r,q,turn,light);}
 c.strokeStyle='rgba(255,255,255,.42)';c.lineWidth=Math.max(1,1.7*s);
 const wave=(x,y,len)=>{c.beginPath();c.moveTo(x-len,y);c.quadraticCurveTo(x-len/2,y-len*.42,x,y);c.quadraticCurveTo(x+len/2,y+len*.42,x+len,y);c.stroke();};
 if(tile){for(const v of D.waves)if(near(v[0],v[1],v[2]+3))wave(X(v[0]),Z(v[1]),v[2]*s);}
 else for(let i=0;i<1500;i++){const x=R()*W,y=R()*H,gi=Math.min(gw-1,Math.round(x/4)),gj=Math.min(gh-1,Math.round(y/4));if(ht[gj*gw+gi]>-3.5)continue;const len=(9+R()*10)*s*1.5;D.waves.push([wx(x),wz(y),len/s]);wave(x,y,len);}
 // ---- 4. parks
 for(const park of world.parks||[]){if(!near(park.x,park.z,Math.max(park.w,park.d)))continue;const x=X(park.x-park.w/2),y=Z(park.z-park.d/2),w=park.w*s,h=park.d*s;c.fillStyle='#b4e384';c.strokeStyle='#5f9b4b';c.lineWidth=Math.max(1.2,2*s);c.beginPath();c.roundRect(x,y,w,h,Math.min(w,h)*.18);c.fill();c.stroke();
  c.strokeStyle='#f3e7c0';c.lineWidth=Math.max(1,2.2*s);c.beginPath();c.moveTo(x+w*.08,y+h/2);c.lineTo(x+w*.92,y+h/2);c.moveTo(x+w/2,y+h*.08);c.lineTo(x+w/2,y+h*.92);c.stroke();}
 // ---- 5. tracks and other drawn surfaces, runway, roads: a dark pass underneath gives every ribbon an edge
 const ribbon=(points,w,color)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();points.forEach((p,i)=>i?c.lineTo(X(p.x),Z(p.z)):c.moveTo(X(p.x),Z(p.z)));c.stroke();};
 for(const pass of[0,1])for(const surface of world.facilitySurfaces||[]){if(surface.width<1||!surface.points?.length)continue;const w=Math.max(1.6,surface.width*s);ribbon(surface.points,pass?w:w+Math.max(1.4,2.4*s),pass?(surface.color||'#b98a5e'):'rgba(92,66,40,.75)');}
 const island=root.CityIsland,rw=world.runway;if(rw&&island?.runwayPoint){const ends=[island.runwayPoint(world,-rw.length/2),island.runwayPoint(world,rw.length/2)];c.lineCap='butt';ribbon(ends,rw.width*s+Math.max(2,3*s),'#3f4a4c');ribbon(ends,rw.width*s,'#6f7b7c');c.setLineDash([9*s*1.5,7*s*1.5]);ribbon(ends,Math.max(1,1.6*s),'#fbf6da');c.setLineDash([]);c.lineCap='round';}
 const line=r=>[r.a,r.b],reach=r=>{const m=r.width+6;return Math.max(r.a.x,r.b.x)>bounds.left-m&&Math.min(r.a.x,r.b.x)<bounds.right+m&&Math.max(r.a.z,r.b.z)>bounds.top-m&&Math.min(r.a.z,r.b.z)<bounds.bottom+m;},roads=tile?(world.roads||[]).filter(reach):world.roads||[];
 for(const r of roads)ribbon(line(r),Math.max(2.4,r.width*s)+Math.max(1.6,2.6*s),r.layer==='bridge'?'#5b6f7a':'#8a6c48');
 for(const r of roads)ribbon(line(r),Math.max(2.4,r.width*s),r.layer==='bridge'?'#e9dcc0':'#fff4d2');
 c.setLineDash([5*s*1.5,5*s*1.5]);c.lineCap='butt';for(const r of roads)if(r.width>=9)ribbon(line(r),Math.max(.8,1.1*s),'#e3b95a');c.setLineDash([]);c.lineCap='round';
 // ---- 6. buildings, back to front, each a block with a shadow, a front face and a roof
 const blocks=(world.buildings||[]).filter(b=>near(b.x,b.z,Math.max(b.w,b.d)/2+20)).sort((a,b)=>(a.z+a.d/2)-(b.z+b.d/2));
 for(const b of blocks){const x=X(b.x-b.w/2),y=Z(b.z-b.d/2),w=b.w*s,h=b.d*s,lift=s>1?clamp((b.h||6)*.42,1.97,14.5)*s:clamp((b.h||6)*s*.42,1.5,11),pal=ROOFS[b.house?'townhouse':/* V9.5: the houses keep the house colours */b.customHome?'premium-home':b.interior?b.type||b.style:b.style]||ROOFS.brick;
  c.fillStyle='rgba(30,50,45,.22)';c.fillRect(x+lift*.7,y+lift*.2,w,h);
  c.fillStyle=pal[1];c.fillRect(x,y+h-lift*.45,w,lift*.5);
  c.fillStyle=pal[0];c.strokeStyle='rgba(60,45,35,.75)';c.lineWidth=Math.max(.8,1.1*s);c.beginPath();c.rect(x,y-lift*.45,w,h);c.fill();c.stroke();
  if(w>7&&h>7){c.strokeStyle='rgba(255,255,255,.35)';c.beginPath();c.moveTo(x+w*.12,y-lift*.45+h*.5);c.lineTo(x+w*.88,y-lift*.45+h*.5);c.stroke();}}
 /* V5.9: the hill mansions: the platform, the house on it and the pool */
 for(const m of world.hillHomes||[]){if(!near(m.x,m.z,30))continue;const x=X(m.x-m.w/2),y=Z(m.z-m.d/2),w=m.w*s,h=m.d*s;c.fillStyle='rgba(30,50,45,.2)';c.fillRect(x+2*s,y+2*s,w,h);c.fillStyle='#d9c7a6';c.strokeStyle='rgba(60,45,35,.7)';c.lineWidth=Math.max(.8,1.1*s);c.beginPath();c.rect(x,y,w,h);c.fill();c.stroke();c.fillStyle='#f6efe0';c.fillRect(X(m.x-11),Z(m.z-4.5),22*s,9*s);c.strokeRect(X(m.x-11),Z(m.z-4.5),22*s,9*s);if(m.pool){c.fillStyle='#4cc3e0';c.fillRect(X(m.pool.x0),Z(m.pool.z0),(m.pool.x1-m.pool.x0)*s,(m.pool.z1-m.pool.z0)*s);}}
 // ---- 7. trees
 const blob=(x,y,r,dark,light)=>{c.fillStyle=dark;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.fillStyle=light;c.beginPath();c.arc(x-r*.22,y-r*.25,r*.62,0,TAU);c.fill();c.strokeStyle='rgba(30,70,40,.65)';c.lineWidth=Math.max(.7,s);c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();};
 for(const p of world.props||[]){if(!near(p.x,p.z,(p.w||4)+3))continue;if(p.kind==='tree')blob(X(p.x),Z(p.z),Math.max(2.6,p.w*.52*s),'#3f8a4c','#6cba63');else if(p.kind==='palm')blob(X(p.x),Z(p.z),Math.max(2.2,p.w*.6*s),'#4f9a5e','#8ed17a');}
 // ---- 8. sailboats and a compass rose, only where there is open water
 const deep=(x,y)=>{const gi=clamp(Math.round(x/4),0,gw-1),gj=clamp(Math.round(y/4),0,gh-1);return ht[gj*gw+gi]<-6;};
 const boat=(x,y)=>{const k=s*1.9;
  c.fillStyle='#8a5a3c';c.beginPath();c.moveTo(x-11*k,y);c.lineTo(x+11*k,y);c.lineTo(x+7*k,y+5*k);c.lineTo(x-7*k,y+5*k);c.closePath();c.fill();c.fillStyle='#fffdf2';c.strokeStyle='rgba(80,90,100,.6)';c.lineWidth=Math.max(.7,s);c.beginPath();c.moveTo(x,y-18*k);c.lineTo(x+9*k,y-2*k);c.lineTo(x,y-2*k);c.closePath();c.fill();c.stroke();c.fillStyle='#f06b58';c.beginPath();c.moveTo(x-1.5*k,y-15*k);c.lineTo(x-8*k,y-2*k);c.lineTo(x-1.5*k,y-2*k);c.closePath();c.fill();
  c.strokeStyle='rgba(255,255,255,.7)';c.beginPath();c.moveTo(x-16*k,y+8*k);c.quadraticCurveTo(x,y+12*k,x+16*k,y+8*k);c.stroke();};
 if(tile){for(const b of D.boats)if(near(b[0],b[1],45))boat(X(b[0]),Z(b[1]));}
 else for(let i=0,placed=0;i<60&&placed<5;i++){const x=W*(.06+R()*.88),y=H*(.06+R()*.88),k=s*1.9;if(!deep(x,y)||!deep(x+40*k,y)||!deep(x-40*k,y)||!deep(x,y+30*k)||!deep(x,y-30*k))continue;placed++;D.boats.push([wx(x),wz(y)]);boat(x,y);}
 const rose=(cx,cy,r)=>{
  c.fillStyle='rgba(255,250,232,.82)';c.strokeStyle='#8a6c48';c.lineWidth=Math.max(1.2,2*s);c.beginPath();c.arc(cx,cy,r,0,TAU);c.fill();c.stroke();c.beginPath();c.arc(cx,cy,r*.78,0,TAU);c.stroke();
  for(let i=0;i<8;i++){const a=i*TAU/8-Math.PI/2,len=i%2?r*.5:r*.95,wd=i%2?r*.1:r*.16;c.fillStyle=i%2?'#e0b45a':i===0?'#f06b58':'#3f7f96';c.beginPath();c.moveTo(cx+Math.cos(a)*len,cy+Math.sin(a)*len);c.lineTo(cx+Math.cos(a+Math.PI/2)*wd,cy+Math.sin(a+Math.PI/2)*wd);c.lineTo(cx+Math.cos(a-Math.PI/2)*wd,cy+Math.sin(a-Math.PI/2)*wd);c.closePath();c.fill();c.stroke();}
  c.fillStyle='#5b4632';c.font='900 '+Math.round(r*.36)+'px "Trebuchet MS","Segoe UI",system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('N',cx,cy-r*1.22);c.textBaseline='alphabetic';};
 if(tile){const q=D.compass;if(q&&near(q[0],q[1],q[2]*1.7))rose(X(q[0]),Z(q[1]),q[2]*s);}
 else{let cx=W-150*s*1.6,cy=H-150*s*1.6;const r=78*s*1.6;for(const[ax,ay]of[[W-150*s*1.6,H-150*s*1.6],[150*s*1.6,H-150*s*1.6],[W-150*s*1.6,150*s*1.6],[150*s*1.6,150*s*1.6]])if(deep(ax,ay)&&deep(ax-r,ay)&&deep(ax+r,ay)&&deep(ax,ay-r)&&deep(ax,ay+r)){cx=ax;cy=ay;break;}
  D.compass=[wx(cx),wz(cy),r/s];rose(cx,cy,r);}
 // ---- 9. paper grain over the whole sheet
 const grain=doc.createElement('canvas');grain.width=grain.height=128;const gc=grain.getContext('2d'),gi=gc.createImageData(128,128);for(let i=0;i<gi.data.length;i+=4){const v=118+R()*40;gi.data[i]=gi.data[i+1]=gi.data[i+2]=v;gi.data[i+3]=255;}gc.putImageData(gi,0,0);
 c.globalCompositeOperation='soft-light';c.globalAlpha=.5;c.fillStyle=c.createPattern(grain,'repeat');c.fillRect(0,0,W,H);c.globalCompositeOperation='source-over';c.globalAlpha=1;
 if(!tile)decor.set(world,D);
 return canvas;
}
// ---- place markers and names -----------------------------------------------------------------------------
const BADGES={'premium-home':['\u{1F48E}','#e9c46a'],safehouse:['\u{1F3E0}','#5cb87a'],garage:['\u{1F527}','#7d93a8'],clothing:['\u{1F455}','#ee7fb0'],equipment:['\u{1F3AF}','#8fa663'],diner:['\u{1F354}','#e2574a'],restaurant:['\u{1F374}','#f39c3d'],'six-seven':['\u{1F3EA}','#0b7a4b'],marina:['⚓','#3fa7b5'],hangar:['✈️','#6f8fd0'],terminal:['\u{1F6EB}','#6f8fd0'],relay:['\u{1F4E1}','#9a8fc8'],warehouse:['\u{1F4E6}','#b9966a'],park:['\u{1F333}','#69b65a'],track:['\u{1F3C1}','#c98b57'],ramp:['\u{1F6F9}','#e0934a'],beach:['\u{1F3D6}️','#f0c75e'],casino:['\u{1F3B0}','#d4a82c'],/* V11.1 */shelter:['\u{1F6CF}','#6fa3c7']};
const EMOJI='"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
function badge(c,m,q,o={}){
 const b=BADGES[m.type]||['⭐','#8aa0a8'],color=o.selected?'#f06b58':m.currentHome?'#5cb87a':b[1],r=o.mini?5.5:o.selected?15:12.5;
 c.save();c.shadowColor='rgba(20,40,50,.45)';c.shadowBlur=o.mini?2:5;c.shadowOffsetY=o.mini?1:2;c.fillStyle='#fffaf0';c.beginPath();c.arc(q.x,q.y,r,0,TAU);c.fill();c.restore();
 c.fillStyle=color;c.beginPath();c.arc(q.x,q.y,r-(o.mini?1.6:2.4),0,TAU);c.fill();
 if(!o.mini){c.font=Math.round(r*1.02)+'px '+EMOJI;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#fff';c.fillText(b[0],q.x,q.y+1);c.textBaseline='alphabetic';}
 return r;
}
function label(c,text,x,y,o={}){
 c.save();c.font=(o.weight||800)+' '+(o.size||13)+'px "Trebuchet MS","Segoe UI",system-ui,sans-serif';c.textAlign=o.align||'left';c.lineJoin='round';c.lineWidth=o.edge||4;c.strokeStyle=o.paper||'#fff7dc';c.strokeText(text,x,y);c.fillStyle=o.ink||'#3d3226';c.fillText(text,x,y);c.restore();
}
root.CityMapPaint={paint,badge,label,BADGES};
})(typeof globalThis!=='undefined'?globalThis:this);
