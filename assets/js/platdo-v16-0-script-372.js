
/* PLATDO City dishes (V6.3): every plate, bowl, glass and cup the sit-down restaurants serve, built from simple
 * shapes at real size (metres), standing on the table at y = 0.
 * - build(spec) makes one dish. spec is the `dish` list of a menu item in city-dining.js: a shape name and its
 *   colours. The group remembers what is food (it goes when you eat it), what is the plate or glass (it stays),
 *   and for drinks the liquid, so a glass can be seen to empty.
 * - picture(scene, spec) draws the same dish from above for the menu, so the menu shows the real thing.
 * Game only (it needs the 3D library). */
(function(root){'use strict';
const TAU=Math.PI*2,HALF=Math.PI/2,G={},mats=new Map(),pictures=new Map();
const geo=n=>{const T=root.THREE;return G[n]||(G[n]=n==='cyl'?new T.CylinderGeometry(.5,.5,1,24):n==='cup'?new T.CylinderGeometry(.5,.36,1,24):n==='sph'?new T.SphereGeometry(.5,18,12):n==='dome'?new T.SphereGeometry(.5,18,8,0,TAU,0,HALF):n==='box'?new T.BoxGeometry(1,1,1):n==='wedge'?new T.CylinderGeometry(.5,.5,1,8,1,false,0,.98):new T.TorusGeometry(.5,.12,8,22));};
const mat=(c,kind)=>{const k=c+'|'+(kind||''),T=root.THREE;let m=mats.get(k);if(!m){m=kind==='glass'?new T.MeshStandardMaterial({color:c,roughness:.06,transparent:true,opacity:.3,depthWrite:false}):kind==='liquid'?new T.MeshStandardMaterial({color:c,roughness:.2,transparent:true,opacity:.88}):new T.MeshStandardMaterial({color:c,roughness:kind==='gloss'?.22:kind==='china'?.3:.78});mats.set(k,m);}return m;};
const WHITE='#f7f4ec',BREAD='#d9a45b',CRUST='#c98a3c',GREEN='#5a9a44',RED='#d8382c',CREAM='#f6efd8';
// One dish under construction. a() adds a piece of food, w() a piece of crockery; both take a shape, a colour,
// a position, a size and optionally a finish and a rotation.
function maker(){
 const T=root.THREE,g=new T.Group();g.userData={food:[],ware:[],liquid:null,radius:.13,height:.06};let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 const put=(list,n,c,x,y,z,sx,sy,sz,kind,rx,ry,rz)=>{const m=new T.Mesh(geo(n),mat(c,kind));m.position.set(x,y,z);m.scale.set(sx,sy,sz);if(rx||ry||rz)m.rotation.set(rx||0,ry||0,rz||0);g.add(m);list.push(m);return m;};
 const a=(...q)=>put(g.userData.food,...q),w=(...q)=>put(g.userData.ware,...q);
 const plate=(r=.13,c=WHITE)=>{/* V13.4: marked, so a dish can be shown without its plate (the drive-through throws the food alone) */w('cyl',c,0,.006,0,r*2,.012,r*2,'china').userData.plate=true;w('tor',c,0,.014,0,r*1.84,r*1.84,.07,'china',HALF).userData.plate=true;g.userData.radius=r;};
 const bowl=(d=.14,h=.05,c=WHITE)=>{w('cup',c,0,h/2,0,d,h,d,'china');g.userData.radius=d/2;g.userData.height=h+.03;};
 const leaf=(x,y,z,s=.03,c=GREEN)=>a('sph',c,x,y,z,s,.006,s*.6,'',0,rnd()*TAU);
 return{g,a,w,plate,bowl,leaf,rnd};
}
const SHAPES={
 burger(k){k.plate(.14);const x=-.035;k.a('cyl',CRUST,x,.024,0,.1,.022,.1);k.a('cyl','#5a3320',x,.045,0,.106,.02,.106);k.a('box','#f6c21c',x,.057,0,.108,.006,.108,'',0,.78);k.a('cyl',GREEN,x,.064,0,.116,.008,.116);k.a('cyl',RED,x,.072,0,.092,.008,.092);k.a('dome','#dca75e',x,.076,0,.102,.07,.102,'gloss');for(let i=0;i<5;i++)k.a('sph','#fff6df',x+Math.cos(i*2.4)*.02,.106,Math.sin(i*2.4)*.02,.007,.004,.01);
  for(let i=0;i<11;i++)k.a('box','#f0c55a',.072+(k.rnd()-.5)*.05,.02+i*.004,(k.rnd()-.5)*.09,.012,.012,.07,'',(k.rnd()-.5)*.5,k.rnd()*3);k.g.userData.height=.12;},
 steak(k){k.plate(.15);k.a('sph','#6b3a22',-.02,.03,.01,.15,.036,.105,'gloss');for(let i=0;i<4;i++)k.a('box','#3a1c10',-.065+i*.03,.049,.01,.008,.004,.08,'',0,.5);k.a('box','#f1e3a0',-.02,.054,.01,.026,.01,.026);
  for(let i=0;i<4;i++)k.a('cyl',GREEN,.085,.02+i*.004,-.045+i*.022,.012,.11,.012,'',HALF,.5);k.a('sph','#e8d9a8',.07,.03,.065,.05,.04,.045);k.g.userData.height=.08;},
 filet(k){k.plate(.14);k.a('sph','#4a1f14',0,.016,0,.15,.008,.11,'gloss');k.a('cyl','#5a2f1c',-.01,.036,0,.078,.046,.078,'gloss');k.a('cyl','#f1e3a0',-.01,.063,0,.04,.008,.04);k.leaf(-.01,.07,0,.02);for(let i=0;i<5;i++)k.a('sph',i%2?GREEN:'#7ab85a',.07+k.rnd()*.02,.03,-.04+i*.02,.04,.03,.04);k.g.userData.height=.09;},
 salmon(k){k.w('box','#9a6b3f',0,.008,0,.24,.016,.12);k.a('box','#f08a6a',-.02,.032,0,.13,.03,.066,'gloss');for(let i=0;i<5;i++)k.a('box','#f6b39a',-.07+i*.025,.048,0,.004,.003,.06);for(let i=0;i<3;i++)k.a('cyl','#f6e04a',.075,.02+i*.004,-.03+i*.03,.045,.006,.045);k.leaf(-.02,.052,0,.03);k.g.userData.radius=.13;k.g.userData.height=.07;},
 ribs(k){k.plate(.15);for(let i=0;i<5;i++){k.a('box','#5a2a18',-.06+i*.03,.034,0,.028,.036,.11,'gloss');k.a('cyl','#efe6d2',-.06+i*.03,.034,.064,.012,.02,.012,'',HALF);}k.w('cup',WHITE,.09,.03,-.05,.05,.036,.05,'china');k.a('cyl','#e9edd8',.09,.051,-.05,.044,.006,.044);k.g.userData.height=.08;},
 chicken(k){k.plate(.15);k.a('sph','#c88a3c',-.02,.05,0,.13,.08,.1,'gloss');k.a('sph','#b9772e',.045,.04,.045,.06,.05,.05,'gloss');k.a('cyl','#efe6d2',.08,.04,.06,.014,.04,.014,'',HALF,.6);for(let i=0;i<4;i++)k.a('sph','#e8d9a8',.06+k.rnd()*.03,.025,-.07+i*.02,.03,.026,.03);k.leaf(-.02,.092,0,.03);k.g.userData.height=.11;},
 meatloaf(k){k.plate(.14);for(let i=0;i<2;i++)k.a('box','#6a3b26',-.045+i*.03,.04,.02,.022,.062,.085,'',0,0,.3);k.a('sph','#f1e6c8',.05,.035,-.03,.085,.06,.085);k.a('sph','#6b4022',.05,.058,-.03,.05,.016,.05,'gloss');for(let i=0;i<9;i++)k.a('sph',GREEN,.03+k.rnd()*.07,.02,.045+k.rnd()*.04,.012,.012,.012);k.g.userData.height=.09;},
 waffles(k){k.plate(.14);k.a('box','#e0a84a',0,.022,0,.13,.018,.13);for(let i=0;i<4;i++){k.a('box','#c98a3c',-.045+i*.03,.033,0,.005,.004,.125);k.a('box','#c98a3c',0,.033,-.045+i*.03,.125,.004,.005);}for(const[x,z]of[[-.02,-.015],[.025,.02]])k.a('sph','#c8842e',x,.055,z,.07,.045,.058,'gloss');k.a('box','#f1e3a0',.045,.04,-.04,.02,.01,.02);k.g.userData.height=.09;},
 sandwich(k,bread,fill){k.plate(.14);for(const[x,ry]of[[-.035,.2],[.03,2.6]]){k.a('wedge',bread||BREAD,x,.02,0,.2,.016,.2,'',0,ry);k.a('wedge',fill||'#f0d98a',x,.033,0,.196,.012,.196,'',0,ry);k.a('wedge',bread||BREAD,x,.046,0,.2,.016,.2,'',0,ry);}for(let i=0;i<6;i++)k.a('sph','#f0c55a',.07+k.rnd()*.03,.018+i*.003,-.06+k.rnd()*.04,.04,.006,.034,'',0,k.rnd()*3);k.a('cyl',GREEN,-.085,.018,.07,.016,.05,.016,'',HALF,.7);k.g.userData.height=.07;},
 breakfast(k){k.plate(.14);for(const x of[-.05,.0]){k.a('cyl','#fbf8f0',x,.016,.03,.062,.008,.062);k.a('dome','#f6b21c',x,.02,.03,.026,.03,.026,'gloss');}for(let i=0;i<3;i++)k.a('box','#a8432a',.005,.02+i*.002,-.05+i*.022,.11,.005,.018,'gloss',0,.12*i,0);k.a('box','#d9a04a',.07,.02,.04,.05,.016,.07);k.g.userData.height=.05;},
 sticks(k){k.plate(.13);for(let r=0;r<3;r++)for(let i=0;i<3-r;i++)k.a('box','#d9a04a',-.04+r*.011+i*.022,.024+r*.02,-.01,.02,.02,.085,'',0,.1*r);k.w('cup',WHITE,.07,.022,.04,.05,.032,.05,'china');k.a('cyl','#c0392b',.07,.037,.04,.044,.006,.044,'gloss');k.g.userData.height=.08;},
 fries(k,top){k.w('cup','#c8242b',0,.045,0,.085,.09,.085);for(let i=0;i<16;i++)k.a('box','#f0c55a',(k.rnd()-.5)*.055,.1+k.rnd()*.03,(k.rnd()-.5)*.055,.011,.075,.011,'',(k.rnd()-.5)*.6,0,(k.rnd()-.5)*.6);if(top){k.a('sph',top,0,.115,0,.07,.03,.07,'gloss');if(top==='#8a3a22')for(let i=0;i<6;i++)k.a('box','#f6c21c',(k.rnd()-.5)*.05,.13,(k.rnd()-.5)*.05,.02,.004,.006,'',0,k.rnd()*3);}k.g.userData.radius=.06;k.g.userData.height=.15;},
 rings(k){k.plate(.12);for(let i=0;i<5;i++)k.a('tor','#d9a04a',(k.rnd()-.5)*.02,.03+i*.02,(k.rnd()-.5)*.02,.082,.082,.15,'',HALF+(k.rnd()-.5)*.25);k.g.userData.height=.13;},
 hash(k){k.plate(.11);for(const[x,z,r]of[[-.025,0,.2],[.03,.01,-.3]])k.a('box','#d9a04a',x,.022,z,.06,.016,.085,'',0,r);k.g.userData.height=.04;},
 bowl(k,c,dots){k.bowl(.12,.05);k.a('cyl',c,0,.052,0,.108,.008,.108);for(let i=0;i<7;i++)k.a('sph',dots||WHITE,(k.rnd()-.5)*.07,.058,(k.rnd()-.5)*.07,.014,.008,.014);},
 soup(k,c,top){k.plate(.13);k.w('cup',WHITE,0,.036,0,.15,.05,.15,'china');k.a('cyl',c,0,.063,0,.136,.006,.136,'gloss');if(top==='#e9c46a'){k.a('dome',top,0,.064,0,.13,.03,.13,'gloss');for(let i=0;i<5;i++)k.a('sph','#b8742c',(k.rnd()-.5)*.07,.076,(k.rnd()-.5)*.07,.02,.004,.02);}else{k.a('tor',top||CREAM,0,.067,0,.06,.06,.03,'',HALF);for(let i=0;i<4;i++)k.leaf((k.rnd()-.5)*.06,.069,(k.rnd()-.5)*.06,.016);}k.g.userData.height=.07;},
 salad(k){k.plate(.14);k.a('wedge','#bfe08f',-.01,.04,-.02,.19,.07,.19,'',0,.4);k.a('wedge','#d8efae',-.01,.04,-.02,.15,.074,.15,'',0,.4);for(let i=0;i<7;i++)k.a('box','#f4f1e4',-.02+k.rnd()*.07,.078,k.rnd()*.07,.012,.008,.012);for(let i=0;i<5;i++)k.a('box','#a8432a',-.03+k.rnd()*.08,.08,k.rnd()*.07,.012,.005,.006,'',0,k.rnd()*3);for(let i=0;i<4;i++)k.a('sph',RED,-.06+i*.035,.026,.075,.026,.022,.026,'gloss');k.g.userData.height=.09;},
 shrimp(k){k.w('cyl','#dfeef2',0,.004,0,.07,.008,.07,'glass');k.w('cyl','#dfeef2',0,.04,0,.012,.07,.012,'glass');k.w('cup','#dfeef2',0,.1,0,.11,.05,.11,'glass');k.a('cyl','#b8322a',0,.116,0,.07,.01,.07,'gloss');for(let i=0;i<5;i++){const t=i/5*TAU;k.a('tor','#f4a48a',Math.cos(t)*.05,.126,Math.sin(t)*.05,.04,.04,.1,'gloss',0,-t,0);}k.a('wedge','#f6e04a',.04,.13,0,.05,.012,.05,'',HALF);k.g.userData.radius=.06;k.g.userData.height=.15;},
 cakes(k){k.plate(.13);for(const[x,z]of[[-.035,-.01],[.035,.02]])k.a('cyl','#d9a04a',x,.03,z,.066,.028,.066);k.a('sph','#f1e3a0',0,.048,.005,.036,.012,.03,'gloss');k.a('wedge','#f6e04a',.075,.022,-.05,.07,.02,.07);for(let i=0;i<4;i++)k.leaf(-.08+k.rnd()*.03,.02,.04+k.rnd()*.04,.03);k.g.userData.height=.06;},
 potato(k){k.plate(.12);k.a('sph','#b98a5a',0,.045,0,.13,.075,.085);k.a('sph',CREAM,0,.078,0,.07,.03,.045);for(let i=0;i<8;i++)k.a('box','#f6c21c',(k.rnd()-.5)*.07,.09,(k.rnd()-.5)*.03,.018,.003,.005,'',0,k.rnd()*3);for(let i=0;i<8;i++)k.a('sph',i%2?GREEN:'#a8432a',(k.rnd()-.5)*.07,.094,(k.rnd()-.5)*.03,.007,.006,.007);k.g.userData.height=.1;},
 asparagus(k){k.plate(.13);for(let i=0;i<7;i++){k.a('cyl','#5d9a4a',0,.02+(i%2)*.006,-.045+i*.015,.012,.15,.012,'',HALF,.08*(i%3-1),HALF);k.a('sph','#4a8238',.078,.02+(i%2)*.006,-.045+i*.015,.022,.014,.014);}k.a('wedge','#f6e04a',-.07,.022,.06,.06,.016,.06);k.g.userData.height=.04;},
 pie(k,crust,top){k.plate(.12);k.a('wedge',crust||CRUST,-.04,.03,-.04,.2,.036,.2,'',0,.1);k.a('wedge','#dca75e',-.04,.05,-.04,.204,.008,.204,'',0,.1);k.a('sph',top||CREAM,.045,.04,.03,.055,.05,.055);k.g.userData.height=.07;},
 cake(k,body,top){k.plate(.12);const light=body==='#f1dfae';if(light)k.a('wedge','#c9a05a',-.045,.018,-.045,.2,.012,.2,'',0,.1);for(let i=0;i<(light?1:3);i++){k.a('wedge',body,-.045,(light?.045:.026)+i*.024,-.045,.2,light?.044:.018,.2,'',0,.1);if(!light)k.a('wedge',top,-.045,.038+i*.024,-.045,.202,.006,.202,'',0,.1);}k.a('wedge',top,-.045,light?.07:.088,-.045,.2,.006,.2,'gloss',0,.1);k.a('sph',light?RED:'#f7f4ec',.02,light?.08:.098,.01,.02,.02,.02,'gloss');k.g.userData.height=.1;},
 sundae(k){k.w('box','#dfeef2',0,.012,0,.21,.024,.075,'glass');for(const z of[-.03,.03])k.a('sph','#f6e08a',0,.035,z,.2,.03,.03);[['#f6efd8',-.055],['#6b4022',0],['#f0a0b0',.055]].forEach(([c,x])=>{k.a('sph',c,x,.062,0,.052,.052,.052);k.a('sph','#fffdf6',x,.092,0,.03,.024,.03);k.a('sph','#c0182a',x,.108,0,.014,.014,.014,'gloss');});k.g.userData.radius=.11;k.g.userData.height=.12;},
 molten(k){k.plate(.12);k.a('cup','#3a2016',-.01,.036,0,.07,.05,.07,'',Math.PI);k.a('cyl','#f7f4ec',-.01,.062,0,.05,.003,.05);k.a('sph','#2a120c',.03,.016,.03,.07,.008,.05,'gloss');for(let i=0;i<3;i++)k.a('sph','#c0182a',.055+i*.012,.026,-.03-i*.012,.016,.016,.016,'gloss');k.leaf(.05,.03,-.055,.024);k.g.userData.height=.07;},
 brulee(k){k.plate(.1);k.w('cup',WHITE,0,.032,0,.092,.036,.092,'china');k.a('cyl','#d9942e',0,.051,0,.084,.004,.084,'gloss');for(let i=0;i<5;i++)k.a('sph','#8a4a14',(k.rnd()-.5)*.05,.054,(k.rnd()-.5)*.05,.018,.002,.014);k.a('sph','#c0182a',.015,.062,.01,.016,.016,.016,'gloss');k.g.userData.height=.07;},
 pizza(k,top){k.w('cyl','#9a6b3f',0,.007,0,.34,.014,.34);k.a('cyl',BREAD,0,.022,0,.3,.016,.3);k.a('cyl',top==='cheese'?'#f6efd8':'#c93a26',0,.032,0,.268,.005,.268);k.a('cyl','#f3cf6a',0,.036,0,.256,.005,.256,'gloss');
  if(top==='pepperoni')for(let i=0;i<11;i++){const t=i*2.4,r=.03+i*.008;k.a('cyl','#b3261e',Math.cos(t)*r,.041,Math.sin(t)*r,.036,.004,.036,'gloss');}
  else if(top==='basil'){for(let i=0;i<6;i++){const t=i*1.05,r=.07;k.a('cyl','#fbf8f0',Math.cos(t)*r,.041,Math.sin(t)*r,.05,.005,.05);}for(let i=0;i<6;i++){const t=i*1.05+.5;k.leaf(Math.cos(t)*.05,.045,Math.sin(t)*.05,.036,'#3d8a3a');}}
  else if(top==='mushroom')for(let i=0;i<12;i++){const t=i*2.4,r=.025+i*.008;k.a('dome','#c9a67a',Math.cos(t)*r,.04,Math.sin(t)*r,.034,.02,.026,'',0,t);}
  else for(let i=0;i<8;i++){const t=i*.79,r=.05+(i%2)*.04;k.a('sph',['#fbf8f0','#f6c21c','#f0a04a','#e9ecd8'][i%4],Math.cos(t)*r,.04,Math.sin(t)*r,.06,.008,.05,'gloss');}
  k.g.userData.radius=.17;k.g.userData.height=.05;k.g.userData.big=true;},
 pasta(k,sauce,kind){k.plate(.14);k.w('cup',WHITE,0,.02,0,.2,.024,.2,'china');const noodle=kind==='penne'?'#f0d98a':'#f3e2a0';
  if(kind==='penne')for(let i=0;i<18;i++)k.a('cyl',noodle,(k.rnd()-.5)*.11,.04+k.rnd()*.02,(k.rnd()-.5)*.11,.016,.04,.016,'',HALF,k.rnd()*3);
  else for(let i=0;i<6;i++)k.a('tor',noodle,(k.rnd()-.5)*.02,.036+i*.008,(k.rnd()-.5)*.02,.13-i*.016,.13-i*.016,.09,'',HALF+(k.rnd()-.5)*.3,k.rnd()*3);
  k.a('sph',sauce,0,.07,0,.09,.022,.09,'gloss');if(kind==='meatballs')for(let i=0;i<3;i++)k.a('sph','#6a3320',Math.cos(i*2.1)*.03,.086,Math.sin(i*2.1)*.03,.038,.036,.038);for(let i=0;i<8;i++)k.a('box','#fbf8f0',(k.rnd()-.5)*.07,.09,(k.rnd()-.5)*.07,.01,.002,.004,'',0,k.rnd()*3);k.leaf(0,.1,0,.03,'#3d8a3a');k.g.userData.height=.11;},
 lasagna(k){k.plate(.14);for(let i=0;i<4;i++){k.a('box','#f0d98a',0,.022+i*.016,0,.11,.008,.085);k.a('box','#c0392b',0,.03+i*.016,0,.106,.008,.081,'gloss');}k.a('box','#f3cf6a',0,.086,0,.112,.008,.087,'gloss');for(let i=0;i<5;i++)k.a('sph','#c9862e',(k.rnd()-.5)*.08,.091,(k.rnd()-.5)*.06,.024,.003,.02);k.a('sph','#c0392b',.06,.018,.045,.07,.008,.05,'gloss');k.leaf(0,.094,0,.03,'#3d8a3a');k.g.userData.height=.1;},
 bread(k){k.w('cup','#c9a25a',0,.02,0,.2,.04,.13);for(let i=0;i<4;i++){k.a('box','#e3b45a',-.06+i*.04,.055,0,.022,.05,.1,'',0,0,.35);k.a('box','#f1e3a0',-.053+i*.04,.058,0,.004,.044,.09,'',0,0,.35);for(let j=0;j<3;j++)k.a('sph','#7fae5a',-.05+i*.04,.05+j*.012,-.03+j*.03,.006,.006,.006);}k.g.userData.radius=.11;k.g.userData.height=.09;},
 bruschetta(k){k.plate(.13);for(let i=0;i<3;i++){const z=-.055+i*.055;k.a('box',BREAD,0,.022,z,.1,.016,.046,'',0,.25);for(let j=0;j<7;j++)k.a('box',j%3===2?'#3d8a3a':RED,-.035+k.rnd()*.07,.036,z-.014+k.rnd()*.028,.012,.01,.012);}k.g.userData.height=.05;},
 caprese(k){k.plate(.13);for(let i=0;i<8;i++){const t=i/8*TAU;k.a('cyl',i%2?'#fbf8f0':RED,Math.cos(t)*.06,.022+i*.0012,Math.sin(t)*.06,.056,.008,.056,'gloss',.25,-t,0);}for(let i=0;i<5;i++)k.leaf(Math.cos(i*1.3)*.03,.04,Math.sin(i*1.3)*.03,.034,'#3d8a3a');for(let i=0;i<6;i++)k.a('sph','#3a1c10',(k.rnd()-.5)*.16,.014,(k.rnd()-.5)*.16,.008,.003,.008,'gloss');k.g.userData.height=.05;},
 tiramisu(k){k.plate(.11);[['#6b4a2f',.022],['#e9dcc0',.036],['#6b4a2f',.05],['#e9dcc0',.064]].forEach(([c,y])=>k.a('box',c,0,y,0,.085,.014,.065));k.a('box','#4a2a1c',0,.073,0,.087,.004,.067);k.leaf(.01,.078,0,.022);k.g.userData.height=.08;},
 cannoli(k){k.plate(.12);for(const[z,r]of[[-.025,.15],[.03,-.2]]){k.a('cyl',CRUST,0,.03,z,.036,.11,.036,'',HALF,r,HALF);for(const e of[-1,1]){k.a('sph','#fbf8f0',e*.055*Math.cos(r),.03,z-e*.055*Math.sin(r),.032,.032,.032);k.a('sph','#3a2016',e*.066*Math.cos(r),.034,z-e*.066*Math.sin(r),.008,.008,.008);}}k.g.userData.height=.05;},
 gelato(k){k.w('cyl','#dfeef2',0,.004,0,.07,.008,.07,'glass');k.w('cyl','#dfeef2',0,.03,0,.012,.05,.012,'glass');k.w('cup','#dfeef2',0,.078,0,.11,.05,.11,'glass');[['#a9c98a',-.022,-.012],['#f0a0b0',.024,-.01],['#f6efd8',0,.024]].forEach(([c,x,z])=>k.a('sph',c,x,.112,z,.05,.05,.05));k.a('box','#d9a45b',.03,.14,.01,.035,.05,.004,'',0,.4,.3);k.g.userData.radius=.06;k.g.userData.height=.16;},
 glass(k,c,foam){k.w('cup','#dfeef2',0,.065,0,.075,.13,.075,'glass');k.g.userData.liquid=k.a('cup',c,0,.06,0,.066,.106,.066,'liquid');if(foam)k.a('cyl',foam,0,.118,0,.066,.014,.066);else for(let i=0;i<3;i++)k.a('box','#eaf6fa',(k.rnd()-.5)*.03,.1+i*.006,(k.rnd()-.5)*.03,.018,.018,.018,'glass',k.rnd(),k.rnd());k.w('cyl',RED,.012,.09,0,.006,.19,.006,'',0,0,-.16);k.g.userData.radius=.045;k.g.userData.height=.19;k.g.userData.drink=true;/* V7.9: [x,y,z] of what goes to the lips (here the tip of the straw) and how far it tips */k.g.userData.lip=[.027,.184,0,.3];},
 /* V15.6: Wokstar. A bowl of steamed rice under orange chicken (or fried rice with peas, carrot and egg) */
 ricebowl(k,c,kind){k.bowl(.13,.055);k.a('dome','#f7f2e4',0,.046,0,.118,.034,.118);
  if(kind==='chicken'){for(let i=0;i<9;i++)k.a('sph',c,(k.rnd()-.5)*.07,.064+k.rnd()*.012,(k.rnd()-.5)*.07,.03,.024,.028,'gloss',k.rnd(),k.rnd()*3);for(let i=0;i<6;i++)k.a('box','#4e8a3a',(k.rnd()-.5)*.08,.074,(k.rnd()-.5)*.08,.012,.004,.01,'',0,k.rnd()*3);for(let i=0;i<8;i++)k.a('sph','#f6efd8',(k.rnd()-.5)*.07,.08,(k.rnd()-.5)*.07,.004,.003,.004);}
  else{k.a('dome',c,0,.05,0,.122,.034,.122);for(let i=0;i<12;i++)k.a('sph',i%3?'#5aa040':'#e8762a',(k.rnd()-.5)*.08,.07,(k.rnd()-.5)*.08,.011,.008,.011);for(let i=0;i<5;i++)k.a('box','#fff3b0',(k.rnd()-.5)*.07,.072,(k.rnd()-.5)*.07,.018,.005,.012,'',0,k.rnd()*3);}
  k.g.userData.height=.1;},
 /* six pan-fried dumplings round a little dish of soy */
 dumplings(k){k.plate(.13);for(let i=0;i<6;i++){const a=i*TAU/6,x=Math.cos(a)*.064,z=Math.sin(a)*.064;k.a('dome','#f1e3c4',x,.013,z,.054,.05,.036,'',0,-a);k.a('box','#c98a3c',x,.0135,z,.05,.003,.032,'',0,-a);}k.w('cup',WHITE,0,.016,0,.044,.012,.044,'china');k.a('cyl','#3a2010',0,.021,0,.038,.004,.038,'gloss');k.g.userData.height=.05;},
 /* two golden spring rolls and a dish of sweet chilli */
 springrolls(k){k.plate(.12);for(const[z,r]of[[-.024,.14],[.022,-.1]]){k.a('cyl','#d9a04a',-.01,.03,z,.032,.13,.032,'',0,r,HALF);for(let i=0;i<3;i++)k.a('cyl','#c98a3c',-.05+i*.04,.03,z,.0335,.005,.0335,'',0,r,HALF);}k.w('cup',WHITE,.072,.014,.052,.04,.018,.04,'china');k.a('cyl','#e05a2a',.072,.024,.052,.034,.004,.034,'gloss');k.g.userData.height=.06;},
 /* bubble tea: milk tea with dark tapioca pearls at the bottom and a fat black straw */
 boba(k,c){k.w('cup','#dfeef2',0,.085,0,.08,.17,.08,'glass');k.w('cyl','#dfeef2',0,.004,0,.07,.008,.07,'glass');k.g.userData.liquid=k.a('cup',c,0,.082,0,.07,.15,.07,'liquid');for(let i=0;i<16;i++)k.a('sph','#2a1810',(k.rnd()-.5)*.046,.02+k.rnd()*.022,(k.rnd()-.5)*.046,.014,.014,.014,'gloss');k.w('cyl','#1c1c1e',.016,.13,0,.012,.23,.012,'',0,0,-.12);k.g.userData.radius=.045;k.g.userData.height=.24;k.g.userData.drink=true;k.g.userData.lip=[.03,.243,0,.3];},
 shake(k,c){k.w('cup','#dfeef2',0,.085,0,.08,.17,.08,'glass');k.w('cyl','#dfeef2',0,.004,0,.07,.008,.07,'glass');k.g.userData.liquid=k.a('cup',c,0,.082,0,.07,.15,.07,'liquid');for(let i=0;i<5;i++)k.a('sph','#fffdf6',Math.cos(i*1.26)*.018,.172,Math.sin(i*1.26)*.018,.036,.03,.036);k.a('sph','#fffdf6',0,.192,0,.03,.03,.03);k.a('sph','#c0182a',0,.212,0,.016,.016,.016,'gloss');k.w('cyl',RED,.02,.13,0,.007,.22,.007,'',0,0,-.14);k.g.userData.radius=.045;k.g.userData.height=.24;k.g.userData.drink=true;k.g.userData.lip=[.035,.239,0,.3];},
 mug(k,c,foam){if(foam)k.plate(.075);k.w('cyl',WHITE,0,.048+(foam?.01:0),0,.08,.086,.08,'china');k.w('tor',WHITE,.05,.05+(foam?.01:0),0,.05,.05,.1,'china');k.g.userData.liquid=k.a('cyl',foam||c,0,.0905+(foam?.01:0),0,.07,.006,.07,foam?'':'gloss');if(foam)k.a('sph',c,0,.105,0,.03,.002,.036);k.g.userData.radius=foam?.085:.075;k.g.userData.height=.1;k.g.userData.drink=true;k.g.userData.lip=[0,.091+(foam?.01:0),-.037,.95];},
 cup(k,c){k.plate(.062);k.w('cup',WHITE,0,.036,0,.056,.046,.056,'china');k.w('tor',WHITE,.034,.038,0,.03,.03,.1,'china');k.g.userData.liquid=k.a('cyl',c,0,.0595,0,.048,.004,.048,'gloss');k.w('box','#c9ced1',-.04,.016,.03,.008,.003,.06,'china',0,.5);k.g.userData.radius=.062;k.g.userData.height=.07;k.g.userData.drink=true;k.g.userData.lip=[0,.059,-.025,.95];},
 bottle(k,c){k.w('cyl',c,0,.085,0,.062,.17,.062,'glass');k.w('cyl',c,0,.2,0,.026,.07,.026,'glass');k.w('cyl','#c9ced1',0,.24,0,.03,.012,.03);k.w('cyl','#f7f4ec',0,.09,0,.064,.06,.064);k.g.userData.liquid=k.a('cyl','#dff3f8',0,.07,0,.054,.13,.054,'liquid');k.g.userData.radius=.04;k.g.userData.height=.25;k.g.userData.drink=true;k.g.userData.lip=[0,.246,-.008,1.45];},
 // V6.7: what the fast-food places serve
 wrap(k,c){k.plate(.13);const w=c||'#ecd9ac';k.a('cyl',w,.02,.05,0,.076,.19,.076,'',0,0,HALF);k.a('sph',w,-.075,.05,0,.076,.076,.076);k.a('cyl','#c9ced1',-.045,.05,0,.08,.1,.08,'gloss',0,0,HALF);k.a('cyl','#5a9a44',.117,.05,0,.062,.006,.062,'',0,0,HALF);for(let i=0;i<4;i++)k.a('sph',i%2?RED:'#f6c21c',.121,.05+(k.rnd()-.5)*.03,(k.rnd()-.5)*.03,.014,.014,.014);k.g.userData.height=.1;},
 taco(k,n){k.plate(.14);const m=n||1;for(let i=0;i<m;i++){const z=m>1?-.075+i*.075:0,x=m>1?(i-1)*.012:0;k.a('dome','#e9b949',x,.082,z,.14,.12,.05,'',Math.PI);k.a('box','#6a3320',x,.068,z,.1,.016,.03);k.a('box','#5a9a44',x,.082,z,.115,.012,.036);for(let j=0;j<4;j++)k.a('box',j%2?RED:'#f6c21c',x-.04+j*.027,.09,z+(k.rnd()-.5)*.012,.016,.008,.012);}k.a('wedge','#bfe08f',.085,.022,.07,.06,.016,.06);k.g.userData.height=.1;},
 slice(k){k.plate(.12);k.a('wedge',BREAD,-.07,.02,-.085,.36,.014,.36,'',0,.2);k.a('wedge','#f3cf6a',-.062,.03,-.074,.31,.008,.31,'gloss',0,.2);for(const r of[.07,.11,.135])k.a('cyl','#b3261e',-.062+r*.636+(r>.1?(r>.12?.022:-.02):0),.036,-.074+r*.771,.032,.004,.032,'gloss');k.g.userData.height=.05;},
 nuggets(k){k.plate(.13);for(let i=0;i<6;i++){const t=i*1.05;k.a('sph',i%2?'#d9a04a':'#c98a3c',-.025+Math.cos(t)*.048,.032+(i%3)*.006,Math.sin(t)*.048,.056,.032,.042,'',0,k.rnd()*3);}k.w('cup',WHITE,.078,.022,.045,.05,.032,.05,'china');k.a('cyl','#c0392b',.078,.037,.045,.044,.006,.044,'gloss');k.g.userData.height=.06;},
 donut(k,c,n){k.plate(.115);const m=n||1,ring=(x,z,ic)=>{k.a('cyl','#d9a45b',x,.028,z,.092,.032,.092);k.a('cyl',ic,x,.046,z,.082,.008,.082,'gloss');k.a('cyl','#f7f4ec',x,.048,z,.026,.012,.026);if(ic==='#f0a0b0')for(let i=0;i<6;i++)k.a('box',['#fffdf6','#3d8a3a','#f6c21c','#2a5fa8'][i%4],x+Math.cos(i*1.05)*.027,.052,z+Math.sin(i*1.05)*.027,.012,.004,.004,'',0,k.rnd()*3);};
  if(m>1){ring(-.045,-.02,c);ring(.045,-.02,'#5a3320');ring(0,.05,'#f6e6b8');}else ring(0,0,c||'#f0a0b0');k.g.userData.height=.06;},
 muffin(k){k.plate(.1);k.a('cup','#c9a25a',0,.035,0,.07,.046,.07);k.a('dome','#b8743a',0,.054,0,.088,.07,.088);for(let i=0;i<6;i++)k.a('sph','#3a3f8a',Math.cos(i*1.05)*.026,.078+(i%2)*.008,Math.sin(i*1.05)*.026,.014,.012,.014,'gloss');k.g.userData.height=.1;},
 cookies(k){k.plate(.11);[[-.035,-.02,.02],[.04,-.01,.026],[0,.045,.032]].forEach(([x,z,y],j)=>{k.a('cyl','#c9903f',x,y,z,.078,.012,.078);for(let i=0;i<5;i++)k.a('sph','#3a2016',x+Math.cos(i*1.26+j)*.022,y+.007,z+Math.sin(i*1.26+j)*.022,.012,.008,.012);});k.g.userData.height=.05;},
 cone(k,c){k.w('cup','#dfeef2',0,.03,0,.066,.06,.066,'glass');k.w('cyl','#dfeef2',0,.003,0,.07,.006,.07,'glass');k.a('cup','#d9a45b',0,.095,0,.058,.11,.058);k.a('sph',c||'#fffdf6',0,.158,0,.072,.05,.072);k.a('sph',c||'#fffdf6',0,.19,0,.056,.044,.056);k.a('sph',c||'#fffdf6',0,.218,0,.036,.04,.036);k.g.userData.radius=.05;k.g.userData.height=.24;},
 hotdog(k,top){k.w('box','#f4efe6',0,.008,0,.22,.016,.1,'china');k.a('cyl','#d9a45b',0,.04,-.014,.046,.17,.046,'',0,0,HALF);k.a('cyl','#d9a45b',0,.04,.014,.046,.17,.046,'',0,0,HALF);k.a('cyl','#a8432a',0,.056,0,.032,.19,.032,'gloss',0,0,HALF);for(let i=0;i<7;i++)k.a('box',top||'#f2c230',-.066+i*.022,.074,(i%2?.006:-.006),.016,.006,.012);k.g.userData.radius=.11;k.g.userData.height=.08;},
 sub(k,meat){k.w('box','#f4efe6',0,.006,0,.32,.012,.12,'china');k.a('cyl',BREAD,0,.036,0,.062,.27,.07,'',0,0,HALF);k.a('box','#bfe08f',0,.058,0,.26,.008,.076);k.a('box',meat||'#d98a8a',0,.066,0,.255,.01,.068);for(let i=0;i<5;i++)k.a('cyl',RED,-.1+i*.05,.074,.006,.04,.006,.04,'gloss');k.a('box','#f6c21c',0,.08,0,.25,.004,.06);k.a('cyl',CRUST,0,.098,-.006,.056,.27,.064,'',0,0,HALF);k.g.userData.radius=.16;k.g.userData.height=.13;},
 nachos(k,c){k.plate(.14);for(let i=0;i<11;i++){const t=i*.57;k.a('wedge','#e9b949',Math.cos(t)*.055,.022+(i%3)*.012,Math.sin(t)*.055,.12,.006,.12,'',(k.rnd()-.5)*.5,t);}k.a('sph',c||'#f6c21c',0,.05,0,.09,.03,.08,'gloss');for(let i=0;i<5;i++)k.a('sph','#5a9a44',(k.rnd()-.5)*.07,.064,(k.rnd()-.5)*.06,.012,.008,.012);k.g.userData.height=.08;},
 'centre-fast'(k){k.w('box','#c9ced1',0,.06,0,.09,.12,.13,'china');k.w('box','#fffdf6',0,.07,0,.095,.08,.11,'china');k.w('cyl','#c8242b',-.1,.08,.02,.045,.16,.045,'gloss');k.w('cyl','#f2c230',.1,.08,.02,.045,.16,.045,'gloss');},
 // not dishes: what stands in the middle of a table in each place
 'centre-diner'(k){k.w('cyl','#c8242b',-.08,.09,0,.055,.18,.055,'gloss');k.w('cyl','#f2c230',.06,.09,0,.055,.18,.055,'gloss');k.w('box','#c9ced1',0,.06,.12,.13,.12,.09,'china');k.w('cyl','#f4efe6',-.02,.05,-.12,.045,.1,.045,'glass');},
 'centre-steak'(k){k.w('cyl','#f4f1ea',0,.05,0,.07,.1,.07,'glass');k.w('sph','#ffcf8a',0,.07,0,.04,.06,.04,'gloss');k.w('cyl','#1d1512',.14,.07,.06,.04,.14,.04);k.w('cyl','#f4f1ea',.2,.055,-.02,.04,.11,.04,'china');},
 fish(k){k.plate(.15);for(const[x,z,r]of[[-.04,-.02,.3],[-.01,.035,-.2]])k.a('sph','#d9a04a',x,.04,z,.15,.045,.07,'',0,r);for(let i=0;i<10;i++)k.a('box','#f0c55a',.075+(k.rnd()-.5)*.05,.02+i*.004,(k.rnd()-.5)*.1,.016,.016,.07,'',(k.rnd()-.5)*.4,k.rnd()*3);k.w('cup',WHITE,-.085,.022,.075,.05,.032,.05,'china');k.a('cyl','#f4f1e4',-.085,.039,.075,.044,.006,.044);k.a('wedge','#f6e04a',.02,.022,-.09,.07,.02,.07);k.g.userData.height=.08;},
 'centre-casual'(k){k.w('cyl','#b86a4c',0,.05,0,.1,.1,.1);k.w('sph','#6a9a5a',0,.13,0,.14,.1,.14);k.w('cyl','#dfeef2',.15,.07,.05,.06,.14,.06,'glass');k.w('sph','#ffe9b8',.15,.06,.05,.03,.05,.03,'gloss');k.w('cyl','#c8342a',-.14,.07,.06,.035,.14,.035,'gloss');},
 'centre-italian'(k){k.w('cyl','#c9a25a',0,.05,0,.11,.1,.11);k.w('cyl','#2f5a3d',0,.13,0,.07,.14,.07,'glass');k.w('cyl','#f6f1e6',0,.24,0,.022,.1,.022);k.w('sph','#ffdf9a',0,.31,0,.03,.05,.03,'gloss');k.w('cyl','#f6f1e6',.16,.05,.08,.04,.1,.04,'glass');}
};
// V6.6: how a hand takes hold of a dish that is not on a plain plate: wrapped round its side at a radius and a
// height, or held by its rim at a radius (see grip() in city-dining-play.js). Plates need no entry.
const GRIPS={glass:['wrap',.036,.07],shake:['wrap',.038,.09],/* V15.6 */boba:['wrap',.038,.09],ricebowl:['wrap',.06,.03],bottle:['wrap',.031,.085],mug:['wrap',.041,.05],cup:['rim',.066,.014],fries:['wrap',.037,.05],shrimp:['wrap',.013,.042],gelato:['wrap',.013,.034],bowl:['wrap',.056,.028],sundae:['rim',.1,.024],salmon:['rim',.118,.016],bread:['wrap',.066,.022],pizza:['rim',.172,.014],cone:['wrap',.027,.09],hotdog:['rim',.1,.016],sub:['rim',.15,.012]};
function build(spec){const k=maker(),f=SHAPES[spec&&spec[0]];if(f)f(k,spec[1],spec[2]);else{k.plate();k.a('sph','#c98a3c',0,.04,0,.1,.06,.1);}for(const m of k.g.children)m.castShadow=true;k.g.userData.spec=spec;
 const G=spec&&(spec[0]==='mug'&&spec[2]?['rim',.08,.014]:GRIPS[spec[0]]);if(G)k.g.userData.grip={kind:G[0],r:G[1],y:G[2]};return k.g;}
// A picture of a dish for the menu: the same model, lit from the front left, seen from a little above.
function picture(scene,spec,size=200){
 const key=spec.join('|')+'@'+size;if(pictures.has(key))return pictures.get(key);const T=root.THREE,r=scene&&scene.renderer;if(!T||!r)return'';
 try{const S=size*2,rt=new T.WebGLRenderTarget(S,S),sc=new T.Scene(),cam=new T.PerspectiveCamera(26,1,.05,6),g=build(spec),u=g.userData,rad=Math.max(u.radius*1.25,u.height*.75),dist=rad/Math.sin(13*Math.PI/180)*1.02,sun=new T.DirectionalLight('#fff4e2',3.2);
  sun.position.set(-.5,1.1,.7);sc.add(g,sun,new T.HemisphereLight('#ffffff','#c9b79a',1.5));const cy=u.height*.42;cam.position.set(dist*.22,cy+dist*.62,dist*.75);cam.lookAt(0,cy,0);
  const prevT=r.getRenderTarget(),col=new T.Color(),alpha=r.getClearAlpha();r.getClearColor(col);r.setRenderTarget(rt);r.setClearColor(0,0);r.clear(true,true,true);r.render(sc,cam);
  const px=new Uint8Array(S*S*4);r.readRenderTargetPixels(rt,0,0,S,S,px);r.setRenderTarget(prevT);r.setClearColor(col,alpha);rt.dispose();
  const lut=new Uint8Array(256);for(let i=0;i<256;i++){const v=i/255;lut[i]=Math.round(255*(v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055));}
  const big=document.createElement('canvas');big.width=big.height=S;const bx=big.getContext('2d'),im=bx.createImageData(S,S),d=im.data;
  for(let y=0;y<S;y++){const from=(S-1-y)*S*4,to=y*S*4;for(let x=0;x<S*4;x+=4){d[to+x]=lut[px[from+x]];d[to+x+1]=lut[px[from+x+1]];d[to+x+2]=lut[px[from+x+2]];d[to+x+3]=px[from+x+3];}}
  bx.putImageData(im,0,0);const cv=document.createElement('canvas');cv.width=cv.height=size;const x=cv.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(big,0,0,size,size);const url=cv.toDataURL('image/png');pictures.set(key,url);return url;
 }catch(e){pictures.set(key,'');return'';}
}
root.CityDiningFood={build,picture,shapes:Object.keys(SHAPES)};
})(typeof globalThis!=='undefined'?globalThis:this);
/* PLATDO City restaurant menu (V6.3): the menu you read at the table.
 * It is a book lying in front of you, built in the page with 3D transforms:
 * - it leans toward the pointer, and the shine on its pages moves as it leans;
 * - the corner of a page lifts under the pointer, and a page turns as a bending sheet (six strips hinged to
 *   each other), with a moving shadow and the other side of the sheet on its back;
 * - each place has its own book: a glossy laminated card at the diner, a leather folder at the steakhouse,
 *   a clipboard of kraft paper at the trattoria;
 * - a dish shows its picture (the real 3D dish, drawn once), what it is and what it gives you when the pointer
 *   is on it; a click writes it on the order slip beside the book.
 * city-dining-play.js opens it, gives it the frame clock (frame) and is told what you choose. Game only. */
(function(root){'use strict';
const doc=root.document,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]),money=n=>n?'$'+Math.round(n).toLocaleString('en-US'):'Free';
const Food=()=>root.CityDiningFood,N=6;
let host=null,api=null,el=null,S=null;
const LOOKS={
 laminated:{cls:'dm-lam',paper:'#fff8e8',ink:'#2a2320',accent:'#c8242b',accent2:'#1f9b96',head:'"Brush Script MT","Segoe Script","Lucida Handwriting",cursive',body:'"Trebuchet MS","Segoe UI",sans-serif',gloss:.5},
 leather:{cls:'dm-lea',paper:'#f6f0e0',ink:'#2a1f18',accent:'#8a6a2a',accent2:'#5a1f1c',head:'Georgia,"Times New Roman",serif',body:'Georgia,"Times New Roman",serif',gloss:.16},
 printed:{cls:'dm-pri',paper:'#fdfdfa',ink:'#1f2a33',accent:'#e8604a',accent2:'#1f7f8a',head:'"Trebuchet MS","Segoe UI",sans-serif',body:'"Trebuchet MS","Segoe UI",sans-serif',gloss:.22},
 trattoria:{cls:'dm-tra',paper:'#fbf2dc',ink:'#33261c',accent:'#b3261e',accent2:'#2f7d4f',head:'"Brush Script MT","Segoe Script","Lucida Handwriting",cursive',body:'Georgia,"Times New Roman",serif',gloss:.1}
};
const CSS=`.dm-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:2.2vw;background:radial-gradient(ellipse at 50% 55%,#0006,#000c);backdrop-filter:blur(5px);perspective:1900px;perspective-origin:50% 38%;opacity:0;transition:opacity .28s ease;pointer-events:auto;cursor:default;user-select:none;-webkit-user-select:none}
.dm-wrap img{-webkit-user-drag:none}.dm-book{touch-action:none}
.dm-wrap.in{opacity:1}
.dm-book{position:relative;width:min(66vw,calc(78vh*1.46));aspect-ratio:1.46;transform-style:preserve-3d;transform:translateY(18px) rotateX(calc(9deg + var(--rx,0deg))) rotateY(var(--ry,0deg)) scale(.94);transition:transform .5s cubic-bezier(.2,.8,.2,1);will-change:transform;color:var(--ink);font-family:var(--body)}
.dm-wrap.in .dm-book{transform:rotateX(calc(9deg + var(--rx,0deg))) rotateY(var(--ry,0deg))}
.dm-wrap.live .dm-book{transition:none}
.dm-shadow{position:absolute;left:3%;right:3%;top:8%;bottom:-6%;border-radius:40px;background:#000;filter:blur(34px);opacity:.55;transform:translate3d(var(--sx,0px),var(--sy,26px),-60px)}
.dm-board{position:absolute;inset:-2.2%;border-radius:18px;transform:translateZ(-9px);box-shadow:0 2px 0 #0006}
[data-dm-pages]{position:absolute;inset:0;transform-style:preserve-3d}
.dm-page{position:absolute;top:0;width:50%;height:100%;background:var(--paper);overflow:hidden;transform-style:flat}
.dm-page.l{left:0;border-radius:var(--rad) 3px 3px var(--rad);box-shadow:-1px 1px 0 #d8cdb4,-2px 2px 0 #cfc4ab,-3px 3px 0 #c5baa2,-4px 4px 0 #b9ae96,inset -18px 0 22px -18px #0000004d}
.dm-page.r{left:50%;border-radius:3px var(--rad) var(--rad) 3px;box-shadow:1px 1px 0 #d8cdb4,2px 2px 0 #cfc4ab,3px 3px 0 #c5baa2,4px 4px 0 #b9ae96,inset 18px 0 22px -18px #0000004d}
.dm-in{position:absolute;inset:0;padding:5.2% 7% 7%;display:flex;flex-direction:column;box-sizing:border-box}
.dm-gloss{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 70% 55% at var(--gx,40%) var(--gy,18%),rgba(255,255,255,var(--ga,.2)),rgba(255,255,255,0) 62%),linear-gradient(105deg,rgba(255,255,255,0) calc(var(--gx,40%) - 16%),rgba(255,255,255,calc(var(--ga,.2)*.7)) var(--gx,40%),rgba(255,255,255,0) calc(var(--gx,40%) + 16%));mix-blend-mode:screen}
.dm-lite .dm-gloss{background:linear-gradient(115deg,rgba(255,255,255,.14),rgba(255,255,255,0) 45%)}.dm-lite .dm-shadow{filter:none;opacity:.35;border-radius:50%}.dm-lite.dm-wrap{backdrop-filter:none}
.dm-cast{position:absolute;inset:0;pointer-events:none;opacity:0}.dm-page.l .dm-cast{background:linear-gradient(270deg,#000a,#0000 70%)}.dm-page.r .dm-cast{background:linear-gradient(90deg,#000a,#0000 70%)}
.dm-h{font-family:var(--head);color:var(--accent);margin:0 0 .25em;line-height:1;font-size:clamp(24px,4.2vh,48px);font-weight:700;text-align:center}
.dm-rule{height:2px;margin:0 8% 3%;background:linear-gradient(90deg,transparent,var(--accent2),transparent);flex:none}
.dm-list{display:flex;flex-direction:column;justify-content:space-evenly;flex:1;min-height:0}
.dm-item{position:relative;display:grid;grid-template-columns:auto 1fr;column-gap:.7em;align-items:center;align-content:center;flex:1 1 0;min-height:0;max-height:clamp(84px,11.5vh,124px);padding:.32em .5em;border-radius:10px;cursor:pointer;transition:background .14s ease,box-shadow .14s}
.dm-item>*{pointer-events:none}
.dm-item.hot{background:color-mix(in srgb,var(--accent) 12%,transparent);box-shadow:0 2px 10px #0000001f,inset 3px 0 0 var(--accent)}
.dm-item.press{background:color-mix(in srgb,var(--accent) 27%,transparent)}
.dm-pic{width:clamp(38px,6.8vh,76px);height:clamp(38px,6.8vh,76px);grid-row:1/3;object-fit:contain;filter:drop-shadow(0 3px 3px #0004);transition:transform .2s}.dm-item.hot .dm-pic{transform:scale(1.16) rotate(-4deg)}.dm-item.press .dm-pic{transform:scale(1.3) rotate(5deg)}
.dm-row{display:flex;align-items:baseline;gap:.4em;font-size:clamp(13px,1.95vh,20px);font-weight:700}.dm-item.hot .dm-name{color:var(--accent)}
.dm-dots{flex:1;border-bottom:2px dotted color-mix(in srgb,var(--ink) 35%,transparent);transform:translateY(-.25em);min-width:10px}
.dm-price{font-variant-numeric:tabular-nums;color:var(--accent2)}
.dm-about{grid-column:2;font-size:clamp(10.5px,1.42vh,14.5px);line-height:1.25;opacity:.74;font-style:italic}
.dm-n{position:absolute;z-index:3;right:-6px;top:-7px;min-width:24px;height:24px;border-radius:12px;background:var(--accent);color:#fff;font:700 13px/24px "Segoe UI",sans-serif;text-align:center;padding:0 5px;box-sizing:border-box;box-shadow:0 2px 6px #0006;transform:scale(0);transition:transform .25s cubic-bezier(.3,1.6,.5,1)}.dm-item[data-n]:not([data-n="0"]) .dm-n{transform:scale(1)}
.dm-corner{position:absolute;bottom:0;width:12%;aspect-ratio:1;z-index:3;pointer-events:none}.dm-page.r .dm-corner{right:0}.dm-page.l .dm-corner{left:0}
.dm-corner b{position:absolute;inset:0;pointer-events:auto;cursor:pointer;clip-path:polygon(100% 100%,100% 0,0 100%)}.dm-page.l .dm-corner b{clip-path:polygon(0 100%,0 0,100% 100%)}
.dm-corner:before{content:"";position:absolute;inset:0;transition:all .22s ease;background:linear-gradient(315deg,#0000 49%,#00000026 50%,color-mix(in srgb,var(--paper) 86%,#000) 56%,var(--paper) 100%);clip-path:polygon(100% 100%,100% 78%,78% 100%);filter:drop-shadow(-2px -2px 3px #0005)}
.dm-page.l .dm-corner:before{transform:scaleX(-1)}
.dm-corner.lift:before{clip-path:polygon(100% 100%,100% 30%,30% 100%)}
.dm-corner span{position:absolute;bottom:9%;font:700 11px "Segoe UI",sans-serif;letter-spacing:1px;opacity:.5;white-space:nowrap}.dm-page.r .dm-corner span{right:105%}.dm-page.l .dm-corner span{left:105%}
.dm-edge{position:absolute;top:0;bottom:0;width:7.5%;z-index:2;pointer-events:none}.dm-page.r .dm-edge{right:0}.dm-page.l .dm-edge{left:0}
.dm-edge:before{content:"";position:absolute;inset:0;opacity:.7;transition:opacity .2s ease;background:linear-gradient(270deg,rgba(255,196,20,.42),rgba(255,206,50,.16) 40%,rgba(255,214,70,0) 100%);box-shadow:inset -3px 0 8px -2px rgba(255,186,0,.55)}.dm-page.l .dm-edge:before{background:linear-gradient(90deg,rgba(255,196,20,.42),rgba(255,206,50,.16) 40%,rgba(255,214,70,0) 100%);box-shadow:inset 3px 0 8px -2px rgba(255,186,0,.55)}
.dm-edge:after{content:"\u{203A}";position:absolute;top:calc(50% - 30px);left:0;right:0;text-align:center;font:700 40px/60px Georgia,serif;color:#a67800;opacity:0;transition:opacity .2s ease}.dm-page.l .dm-edge:after{content:"\u{2039}"}
.dm-edge.lift:before{opacity:1}.dm-edge.lift:after{opacity:.55}
.dm-folio{position:absolute;bottom:2.4%;left:0;right:0;text-align:center;font-size:11px;letter-spacing:2px;opacity:.45}
.dm-leaf{position:absolute;top:0;left:50%;width:50%;height:100%;transform-style:preserve-3d;z-index:5;pointer-events:none}
.dm-strip{position:absolute;top:0;left:0;height:100%;transform-origin:0 50%;transform-style:preserve-3d}.dm-strip .dm-strip{left:100%}
.dm-face{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:var(--paper)}.dm-face.b{transform:rotateY(180deg)}
.dm-face>.dm-slice{position:absolute;top:0;height:100%}.dm-slice>.dm-page{left:0;width:100%}.dm-leaf,.dm-leaf *{pointer-events:none!important}.dm-face>i{position:absolute;inset:0;background:#000;opacity:0;pointer-events:none}
.dm-intro{align-items:center;justify-content:center;text-align:center;gap:2.2%}
.dm-logo{font-family:var(--head);color:var(--accent);font-size:clamp(34px,6.6vh,78px);line-height:.95;font-weight:700}
.dm-tag{font-size:clamp(10px,1.4vh,14px);letter-spacing:.32em;color:var(--accent2);font-weight:700;font-family:"Trebuchet MS","Segoe UI",sans-serif}
.dm-blurb{font-style:italic;font-size:clamp(13px,1.9vh,20px);opacity:.8;max-width:80%}
.dm-how{font-size:clamp(11px,1.5vh,15px);line-height:1.5;opacity:.7;margin-top:3%;font-family:"Trebuchet MS","Segoe UI",sans-serif}
.dm-orn{width:46%;height:12px;background:radial-gradient(circle,var(--accent2) 3px,transparent 4px) 50%/16px 12px repeat-x;opacity:.8}
.dm-side{position:relative;width:min(24vw,290px);display:flex;flex-direction:column;gap:14px;transform:translateZ(0)}
.dm-card{background:#fffdf6;color:#2a2019;border-radius:16px;padding:14px 16px 16px;box-shadow:0 18px 40px #0009;height:clamp(236px,32vh,304px);box-sizing:border-box;overflow:hidden;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.dm-card img{width:min(150px,15vh);height:min(150px,15vh);flex:none;object-fit:contain;filter:drop-shadow(0 8px 8px #0004);transition:transform .35s cubic-bezier(.3,1.5,.5,1)}.dm-card.pop img{transform:scale(1.08) rotate(-3deg)}
.dm-card b{font-size:18px;line-height:1.15;margin-top:2px}.dm-card p{margin:5px 0 8px;font-size:13.5px;line-height:1.3;opacity:.8;font-style:italic;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.dm-pager{display:flex;align-items:center;gap:8px;background:#fffdf6;color:#5a4a3a;border-radius:12px;padding:6px 8px;box-shadow:0 10px 26px #0008;font:700 13px "Segoe UI",sans-serif}.dm-pager span{flex:1;text-align:center;letter-spacing:1px}
#dineMenu .dm-pager button{all:unset;cursor:pointer;padding:8px 13px;border-radius:9px;background:#eadfcb;color:#5a3d1c;font:700 13px "Segoe UI",sans-serif}#dineMenu .dm-pager button:hover{background:#d8c8a8}#dineMenu .dm-pager button[disabled]{opacity:.35;cursor:default;background:#eadfcb}
.dm-vals{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;font:700 13px "Segoe UI",sans-serif}.dm-vals span{padding:4px 9px;border-radius:12px;background:#e8f3e4;color:#2f6a2c}.dm-vals span.p{background:#f3ead6;color:#6a4a1c}
.dm-card .dm-empty{margin:auto;opacity:.55;font-size:14px;font-style:italic}
.dm-slip{background:#fffdf6;color:#2a2019;border-radius:4px 4px 14px 14px;padding:16px 16px 14px;box-shadow:0 18px 40px #0009;font:14px/1.35 "Courier New",monospace;position:relative}
.dm-slip:before{content:"";position:absolute;left:0;right:0;top:-7px;height:8px;background:radial-gradient(circle at 6px 0,transparent 5px,#fffdf6 5.500px) 0 0/12px 8px repeat-x}
.dm-slip-h{margin:0 0 8px;font:700 13px "Segoe UI",sans-serif;letter-spacing:2.5px;text-transform:uppercase;color:#8a6a4a}
.dm-lines{max-height:22vh;overflow:auto;margin-bottom:8px}.dm-line{display:flex;gap:6px;align-items:center;padding:2px 0}.dm-line span{flex:1}#dineMenu .dm-line button{all:unset;cursor:pointer;width:22px;height:22px;border-radius:11px;background:#eadfcb;text-align:center;font:700 15px/22px "Segoe UI",sans-serif;color:#6a4a1c}#dineMenu .dm-line button:hover{background:#d8c8a8}
.dm-total{display:flex;justify-content:space-between;border-top:1px dashed #b9a98c;padding-top:7px;font-weight:700}.dm-small{font-size:12px;opacity:.72;margin-top:3px;font-family:"Segoe UI",sans-serif}
.dm-note{min-height:1.3em;color:#a8241c;font:600 12.5px/1.3 "Segoe UI",sans-serif;margin:7px 0 2px}
#dineMenu .dm-go{all:unset;box-sizing:border-box;display:block;width:100%;text-align:center;cursor:pointer;padding:12px 10px;border-radius:12px;font:700 15px "Segoe UI",sans-serif;background:#2f7d4f;color:#fff;box-shadow:0 4px 0 #1f5a37;transition:transform .1s,box-shadow .1s,filter .15s;margin-top:6px}#dineMenu .dm-go:hover{filter:brightness(1.1)}#dineMenu .dm-go:active{transform:translateY(3px);box-shadow:0 1px 0 #1f5a37}#dineMenu .dm-go[disabled]{background:#b9b3a6;box-shadow:0 4px 0 #8f8a7e;cursor:default;filter:none}
#dineMenu .dm-shut{all:unset;box-sizing:border-box;display:block;width:100%;text-align:center;cursor:pointer;padding:9px;border-radius:12px;font:600 14px "Segoe UI",sans-serif;color:#5a4a3a;margin-top:6px}#dineMenu .dm-shut:hover{background:#eadfcb}
/* the laminated card of the diner */
.dm-lam{--rad:16px}.dm-lam .dm-board{display:none}.dm-lam .dm-page{border:5px solid #fff;box-sizing:border-box;box-shadow:0 0 0 1px #d9d2c2,0 3px 0 #cfc8b8,0 5px 0 #bdb6a6}
.dm-lam .dm-in{background:linear-gradient(#c8242b,#c8242b) top/100% 3.4% no-repeat,repeating-linear-gradient(90deg,#1d2326 0 3.4%,#fff 0 6.8%) 0 3.4%/100% 2% no-repeat,linear-gradient(#1f9b96,#1f9b96) bottom/100% 1.6% no-repeat;padding-top:9%}
.dm-lam .dm-h{transform:rotate(-2deg);text-shadow:2px 2px 0 #fff,3px 3px 0 #1f9b9655;font-size:clamp(26px,4.3vh,48px)}.dm-lam .dm-price{background:#c8242b;color:#fff;border-radius:12px;padding:0 .5em;font-size:.86em}
.dm-lam .dm-logo{text-shadow:3px 3px 0 #fff,5px 5px 0 #1f9b9666;transform:rotate(-3deg)}
/* the leather folder of the steakhouse */
.dm-lea{--rad:5px}.dm-lea .dm-board{background:radial-gradient(ellipse at 30% 20%,#7a2c26,#4a1612 70%,#34100d),repeating-radial-gradient(circle at 20% 30%,#0000 0 2px,#0001 3px);box-shadow:inset 0 0 0 2px #c9a24a66,inset 0 0 0 9px #0000,inset 0 0 0 10px #c9a24a33,0 3px 0 #1d0907,0 6px 0 #140605}
.dm-lea .dm-board:after{content:"";position:absolute;inset:7px;border:1.500px dashed #c9a24a8c;border-radius:12px}
.dm-lea .dm-in{background:repeating-linear-gradient(0deg,#0000 0 3px,#8a6a2a09 3px 4px)}.dm-lea .dm-in:before{content:"";position:absolute;inset:3.2% 4.5%;border:1px solid #8a6a2a80;outline:1px solid #8a6a2a40;outline-offset:3px;pointer-events:none}
.dm-lea .dm-in{padding-top:8.5%}.dm-lea .dm-h{font-variant:small-caps;letter-spacing:.14em;font-weight:400;font-size:clamp(24px,4vh,46px)}.dm-lea .dm-row{font-weight:400;font-variant:small-caps;letter-spacing:.04em}.dm-lea .dm-logo{font-variant:small-caps;letter-spacing:.08em;font-weight:400;font-size:clamp(30px,5.6vh,66px)}
/* the printed card of the seaside grill */
.dm-pri{--rad:10px}.dm-pri .dm-board{background:#1f2a33;inset:-1.1%;border-radius:14px}.dm-pri .dm-in{background:linear-gradient(#1f7f8a,#1f7f8a) top/100% 1.6% no-repeat,linear-gradient(#e8604a,#e8604a) 0 1.6%/100% .5% no-repeat;padding-top:7.5%}
.dm-pri .dm-h{text-transform:uppercase;letter-spacing:.2em;font-size:clamp(20px,3.3vh,38px);text-align:left;padding-left:.5em;border-left:.22em solid var(--accent)}.dm-pri .dm-rule{display:none}.dm-pri .dm-about{font-style:normal}.dm-pri .dm-logo{font-size:clamp(30px,5.6vh,66px);letter-spacing:-.01em}.dm-pri .dm-price{font-weight:800}
/* V6.7: the bright card of a fast-food place: a band of its colour across the top, heavy slanted headings, prices on tabs */
.dm-fast{--rad:14px}.dm-fast .dm-board{background:var(--accent);inset:-1.5%;border-radius:20px}.dm-fast .dm-page{border:4px solid #fff;box-sizing:border-box}
.dm-fast .dm-in{background:linear-gradient(var(--accent),var(--accent)) top/100% 4.6% no-repeat,linear-gradient(var(--accent2),var(--accent2)) 0 4.6%/100% 1% no-repeat;padding-top:9%}
.dm-fast .dm-h{text-transform:uppercase;font-style:italic;letter-spacing:.01em;font-size:clamp(22px,3.7vh,42px)}.dm-fast .dm-rule{height:5px;margin:0 32% 3%;border-radius:3px;background:var(--accent2)}
.dm-fast .dm-price{background:var(--accent);color:#fff;border-radius:8px;padding:0 .5em;font-size:.9em}.dm-fast .dm-about{font-style:normal}.dm-fast .dm-logo{text-transform:uppercase;font-style:italic;font-size:clamp(28px,5.2vh,62px);line-height:1}
/* the clipboard of the trattoria */
.dm-tra{--rad:4px}.dm-tra .dm-board{background:linear-gradient(90deg,#a9743f,#c08a4e 20%,#b07c44 50%,#c59055 80%,#a9743f);box-shadow:0 3px 0 #6b4a2f,0 6px 0 #5a3d26}
.dm-tra .dm-board:before{content:"";position:absolute;left:50%;top:-1.5%;width:15%;height:6%;margin-left:-7.500%;border-radius:6px 6px 3px 3px;background:linear-gradient(#e3e6e8,#9aa0a4);box-shadow:0 2px 3px #0007;z-index:9}
.dm-tra .dm-in{background:repeating-conic-gradient(#c8242b 0 25%,#fff 0 50%) top left/5.600% 2.8% repeat-x;background-size:5.6% 2.8%;padding-top:8.5%}
.dm-tra .dm-h{font-size:clamp(26px,4.2vh,46px)}.dm-tra .dm-h:after{content:"";display:block;width:34%;height:3px;margin:.12em auto 0;border-radius:2px;background:var(--accent2)}.dm-tra .dm-rule{display:none}`;
function pic(spec,size){try{/* V13.1: a dealership catalog brings its own pictures */if(api.pic)return api.pic(spec,size)||'';return Food()?.picture(api.scene,spec,size)||'';}catch(e){return'';}}
// The pages of a place: a first page with its name, then one page for each part of the menu.
function pagesOf(p){
 /* V13.1: the same book can carry other things than dishes (a dealership's vehicles): their own pages */if(api.pagesOf)return api.pagesOf(p,{esc,money,pic});
 const out=[`<div class="dm-in dm-intro"><div class="dm-tag">${esc(p.tag)}</div><div class="dm-orn"></div><div class="dm-logo">${esc(p.name)}</div><div class="dm-orn"></div><div class="dm-blurb">${esc(p.blurb||'')}</div><div class="dm-how">Click a dish to add it to your order.<br>Turn the page at its bottom corner, with Back and Next, or with the arrow keys.<br>When you are ready, send the order to the kitchen.</div></div>`];
 for(const[cat,title]of p.sections){const items=p.menu.filter(m=>m.cat===cat);out.push(`<div class="dm-in"><div class="dm-h">${esc(title)}</div><div class="dm-rule"></div><div class="dm-list">${items.map(it=>`<div class="dm-item" data-id="${it.id}" data-n="0"><img class="dm-pic" alt="" draggable="false" src="${pic(it.dish,96)}"><div class="dm-row"><span class="dm-name">${esc(it.name)}</span><span class="dm-dots"></span><span class="dm-price">${money(it.price)}</span></div><div class="dm-about">${esc(it.about)}</div><span class="dm-n"></span></div>`).join('')}</div></div>`);}
 if(out.length%2)out.push(`<div class="dm-in dm-intro"><div class="dm-orn"></div><div class="dm-blurb">Thank you for dining with us.</div><div class="dm-tag">${esc(p.name)}</div><div class="dm-orn"></div></div>`);
 return out;
}
const side=(i,html,spreads)=>`<div class="dm-page ${i%2?'r':'l'}" data-page="${i}">${html}<div class="dm-gloss"></div><div class="dm-cast"></div>${i%2?(i<spreads*2-1?'<div class="dm-edge" data-turn="1"></div><div class="dm-corner" data-turn="1"><b></b><span>NEXT</span></div>':''):(i>0?'<div class="dm-edge" data-turn="-1"></div><div class="dm-corner" data-turn="-1"><b></b><span>BACK</span></div>':'')}<div class="dm-folio">${i?'\u{2014} '+i+' \u{2014}':''}</div></div>`;
function build(){
 /* V6.7: a fast-food place has a bright card in its own two colours */
 const p=api.place,L=api.look?api.look:p.style==='fast'?{cls:'dm-fast',paper:'#fffdf7',ink:'#231f1c',accent:p.look.counter,accent2:p.look.accent,head:'"Arial Black","Trebuchet MS","Segoe UI",sans-serif',body:'"Trebuchet MS","Segoe UI",sans-serif',gloss:.34}:LOOKS[p.style]||LOOKS.laminated;if(!doc.getElementById('dineMenuCss')){const s=doc.createElement('style');s.id='dineMenuCss';s.textContent=CSS;doc.head.append(s);}
 el=doc.createElement('div');el.id='dineMenu';el.className='dm-wrap '+L.cls+(api.lite?' dm-lite':'');el.style.cssText=`--paper:${L.paper};--ink:${L.ink};--accent:${L.accent};--accent2:${L.accent2};--head:${L.head};--body:${L.body};--ga:${L.gloss}`;
 el.innerHTML=`<div class="dm-book"><div class="dm-shadow"></div><div class="dm-board"></div><div data-dm-pages></div></div><div class="dm-side"><div class="dm-card"><div class="dm-empty">${api.labels?.empty||'Point at a dish to see it.<br>Click the side of a page to turn it.'}</div></div><div class="dm-pager"><button data-dm="prev">\u{2039} Back</button><span data-dm-page></span><button data-dm="next">Next \u{203A}</button></div><div class="dm-slip"><div class="dm-slip-h">${api.labels?.slip||'Your order'}</div><div class="dm-lines"></div><div class="dm-total"><span>Total</span><span data-dm-total>$0</span></div><div class="dm-small" data-dm-small></div><div class="dm-note"></div><button class="dm-go" data-dm="order" disabled>${api.labels?.go||'Send to the kitchen'}</button><button class="dm-shut" data-dm="close">${api.labels?.close||'Close the menu'}</button></div></div>`;
 host.append(el);S={pages:pagesOf(p),spread:0,flip:null,rx:0,ry:0,tx:0,ty:0,hover:null,look:L,lastTick:0,note:'',noteUntil:0};S.spreads=S.pages.length/2;
 // The pointer is measured against the place the book has in the page, not against its leaning outline, so the
 // lean cannot feed back into itself.
 const at=e=>{S.px=e.clientX;S.py=e.clientY;const bk=el.querySelector('.dm-book'),r=el.getBoundingClientRect(),w=bk.offsetWidth||1,h=bk.offsetHeight||1;S.tx=clamp((e.clientX-(r.left+bk.offsetLeft+w/2))/w,-.7,.7);S.ty=clamp((e.clientY-(r.top+bk.offsetTop+h/2))/h,-.7,.7);el.classList.add('live');};
 el.addEventListener('pointermove',e=>{at(e);aim();});
 el.addEventListener('pointerleave',()=>{if(S){S.px=null;aim();}});
 // A dish is added and a page is turned the moment the button goes down, on whatever is lit under the pointer.
 el.addEventListener('pointerdown',e=>{e.stopPropagation();if(e.button)return;at(e);const a=aim();if(!a)return;
  if(a.corner){e.preventDefault();turn(Number(a.corner.dataset.turn));return;}
  if(a.it){e.preventDefault();add(a.it);}});
 el.addEventListener('click',e=>{const t=e.target;e.stopPropagation();
  const minus=t.closest('[data-dm-less]');if(minus){api.chose(minus.dataset.dmLess,-1);refresh();return;}
  const b=t.closest('[data-dm]');if(!b)return;const k=b.dataset.dm;if(k==='order'){if(!api.order())say(api.labels?.none||'Choose a dish first.');}else if(k==='next')turn(1);else if(k==='prev')turn(-1);else api.close();});
 root.addEventListener('keydown',keys,true);
 paint();refresh();requestAnimationFrame(()=>el&&el.classList.add('in'));setTimeout(()=>el&&el.classList.add('in'),60);
}
function keys(e){if(!el)return;if(e.code==='ArrowRight'||e.code==='KeyD'){turn(1);e.preventDefault();e.stopPropagation();}else if(e.code==='ArrowLeft'||e.code==='KeyA'){turn(-1);e.preventDefault();e.stopPropagation();}}
const say=m=>{S.note=m;S.noteUntil=performance.now()+3200;const n=el.querySelector('.dm-note');if(n)n.textContent=m;};
function paint(){const box=el.querySelector('[data-dm-pages]'),a=S.spread*2;box.innerHTML=side(a,S.pages[a],S.spreads)+side(a+1,S.pages[a+1],S.spreads);S.hotEl=null;S.cornerEl=null;marks();pager();}
function pager(){const p=el.querySelector('[data-dm-page]');if(!p)return;const s=S.flip?S.flip.to:S.spread;p.textContent='Page '+(s+1)+' of '+S.spreads;el.querySelector('[data-dm="prev"]').disabled=s<=0;el.querySelector('[data-dm="next"]').disabled=s>=S.spreads-1;}
// Which dish and which page corner are under the pointer. Asked again every frame, because the book leans and
// its dishes move under a pointer that is standing still. Nothing in the book that takes the pointer may carry
// a transform of its own: inside the leaning book the browser then no longer finds it under the pointer. That
// was the fault in V6.3 to V6.5: a dish lost the pointer the moment its hover effect began, so it flickered,
// and about half of all clicks did nothing (worst low on a page). So a dish is lit with a class, not with
// :hover, and only its picture, which the pointer passes through, moves.
function aim(){
 if(!el||!S)return null;if(S.hotEl&&!S.hotEl.isConnected)S.hotEl=null;if(S.cornerEl&&!S.cornerEl.isConnected)S.cornerEl=null;let it=null,corner=null;
 if(S.px!=null){const u=doc.elementFromPoint(S.px,S.py);if(u&&el.contains(u)&&u.closest){it=u.closest('.dm-item');corner=u.closest('[data-turn]');
  // V7.6: the outer side of a page turns it, wherever no dish is under the pointer (measured on the page's outline, since the strip itself takes no pointer)
  if(!it&&!corner){const inPage=p=>{const r=p.getBoundingClientRect();return S.px>=r.left-16&&S.px<=r.right+16&&S.py>=r.top-4&&S.py<=r.bottom+4;},pg=u.closest('.dm-page')||[...el.querySelectorAll('.dm-page')].find(inPage),edge=pg&&pg.querySelector('.dm-edge');if(edge){const r=pg.getBoundingClientRect(),right=pg.classList.contains('r'),f=(right?r.right-S.px:S.px-r.left)/(r.width||1);if(f<.075&&f>-.03)corner=edge;}}
  // in the narrow space between two dishes the one that was lit stays lit, so the light does not blink on the way down a page
  if(!it&&!corner&&S.hotEl&&S.hotEl.parentNode===u)it=S.hotEl;
  // while a page turns, the page the sheet is over cannot be chosen from
  if(it&&S.flip){const pg=it.closest('.dm-page'),over=(S.flip.t<.5)===(S.flip.dir>0)?'r':'l';if(!pg||pg.classList.contains(over))it=null;}}}
 if(it!==S.hotEl){if(S.hotEl)S.hotEl.classList.remove('hot');S.hotEl=it;if(it){it.classList.add('hot');if(it.dataset.id!==S.hover){S.hover=it.dataset.id;showCard(S.hover);const now=performance.now();if(now-S.lastTick>70){S.lastTick=now;api.sound?.('tick');}}}}
 if(corner!==S.cornerEl){if(S.cornerEl)S.cornerEl.classList.remove('lift');S.cornerEl=corner;if(corner)corner.classList.add('lift');}
 return{it,corner};
}
function add(it){const r=api.chose(it.dataset.id,1);if(r&&!r.ok&&r.message){say(r.message);api.sound?.('no');}else{it.classList.remove('press');void it.offsetWidth;it.classList.add('press');setTimeout(()=>it.classList.remove('press'),240);}showCard(it.dataset.id,true);refresh();}
// The little numbers on the dishes that are on the order, the slip, the button.
function marks(){for(const it of el.querySelectorAll('.dm-item')){const n=api.cart[it.dataset.id]||0;it.dataset.n=n;const b=it.querySelector('.dm-n');if(b)b.textContent='\u{D7}'+n;}}
function refresh(){
 if(!el)return;marks();
 /* V13.1: the caller fills the slip itself */if(api.slip){const s=api.slip();el.querySelector('.dm-lines').innerHTML=s.lines;el.querySelector('[data-dm-total]').textContent=s.total;el.querySelector('[data-dm-small]').innerHTML=s.small;el.querySelector('[data-dm="order"]').disabled=!s.ready;return;}
 const D=root.CityDining,rows=Object.entries(api.cart).filter(e=>e[1]>0).map(([id,n])=>[D.dish(id),n]).filter(r=>r[0]),sum=rows.reduce((s,[it,n])=>s+it.price*n,0),count=rows.reduce((s,r)=>s+r[1],0);
 el.querySelector('.dm-lines').innerHTML=rows.length?rows.map(([it,n])=>`<div class="dm-line"><span>${n} \u{D7} ${esc(it.name)}</span><b>${it.price?'$'+it.price*n:'free'}</b><button data-dm-less="${it.id}" aria-label="One less ${esc(it.name)}">\u{2212}</button></div>`).join(''):'<div class="dm-small">Nothing yet.</div>';
 el.querySelector('[data-dm-total]').textContent='$'+sum;const wallet=root.PlatdoCity?.sim?.profile?.wallet??api.wallet;
 el.querySelector('[data-dm-small]').innerHTML=(api.tab?'Bill so far $'+api.tab+'<br>':'')+'You have $'+Math.round(wallet).toLocaleString('en-US')+' \u{B7} room on the table for '+Math.max(0,api.free-count)+' more';
 el.querySelector('[data-dm="order"]').disabled=!count;
}
function showCard(id,pop){/* V13.1 */if(api.card){const c=el&&el.querySelector('.dm-card');if(c){c.innerHTML=api.card(id);if(pop){c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop');}}return;}const it=root.CityDining.dish(id),c=el&&el.querySelector('.dm-card');if(!it||!c)return;c.innerHTML=`<img alt="" src="${pic(it.dish,300)}"><b>${esc(it.name)}</b><p>${esc(it.about)}</p><div class="dm-vals">${it.hunger?`<span>+${it.hunger} hunger</span>`:''}${it.thirst?`<span>+${it.thirst} thirst</span>`:''}<span class="p">${money(it.price)}</span></div>`;if(pop){c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop');}}
// Turning a page: a sheet of six hinged strips. Forward, it lifts off the right and comes down on the left.
function turn(dir){
 if(!el||S.flip)return;const to=S.spread+dir;if(to<0||to>=S.spreads)return;const box=el.querySelector('[data-dm-pages]'),from=S.spread,rightPage=box.querySelector('.dm-page.r'),pw=rightPage.getBoundingClientRect().width/(el.querySelector('.dm-book').getBoundingClientRect().width/el.querySelector('.dm-book').offsetWidth)||rightPage.offsetWidth,W=rightPage.offsetWidth,sw=W/N;
 /* (V7.9: each side of the sheet is the whole page, as it lies flat) */const fi=dir>0?from*2+1:to*2+1,bi=dir>0?to*2:from*2,front=side(fi,S.pages[fi],S.spreads),back=side(bi,S.pages[bi],S.spreads);
 // under the sheet: the page that is being uncovered is already the new one
 if(dir>0)box.querySelector('.dm-page.r').outerHTML=side(to*2+1,S.pages[to*2+1],S.spreads);else box.querySelector('.dm-page.l').outerHTML=side(to*2,S.pages[to*2],S.spreads);
 const leaf=doc.createElement('div');leaf.className='dm-leaf';let html='';
 for(let i=N-1;i>=0;i--)html=`<div class="dm-strip" style="width:${sw}px"><div class="dm-face f"><div class="dm-slice" style="left:${-i*sw}px;width:${W}px">${front}</div><i></i></div><div class="dm-face b"><div class="dm-slice" style="left:${-(N-1-i)*sw}px;width:${W}px">${back}</div><i></i></div>${html}</div>`;
 leaf.innerHTML=html;box.append(leaf);S.flip={dir,to,t:0,leaf,strips:[...leaf.querySelectorAll('.dm-strip')]};marks();pager();pose(0);api.sound?.('page');
}
function pose(t){
 /* V7.9: the outer edge leads, as when a page is turned by its edge: each strip starts DELAY later than the one outside
  * it, so the sheet curls over smoothly and every strip stays between flat on the right (0) and flat on the left (-180) */
 const f=S.flip,k=f.dir>0?t:1-t,e=ease(k),DELAY=.3,abs=[];
 for(let i=0;i<N;i++){const u=i/(N-1),q=ease((t-(1-u)*DELAY)/(1-DELAY));abs.push(f.dir>0?-180*q:-180*(1-q));}
 f.strips.forEach((s,i)=>{const a=i?abs[i]-abs[i-1]:abs[0];s.style.transform='rotateY('+a.toFixed(2)+'deg)';const shade=.34*Math.abs(Math.sin(abs[i]*Math.PI/180));s.children[0].lastElementChild.style.opacity=(shade+.06*Math.sin(Math.PI*k)).toFixed(3);s.children[1].lastElementChild.style.opacity=(shade*.9+.1*Math.sin(Math.PI*k)).toFixed(3);});
 const box=el.querySelector('[data-dm-pages]'),cast=.5*Math.sin(Math.PI*k),L=box.querySelector(':scope>.dm-page.l .dm-cast'),R=box.querySelector(':scope>.dm-page.r .dm-cast');if(L)L.style.opacity=(cast*clamp((e-.35)*2.4,0,1)).toFixed(3);if(R)R.style.opacity=(cast*clamp((.65-e)*2.4,0,1)).toFixed(3);
}
function frame(dt){
 if(!el||!S)return;const k=1-Math.exp(-dt*9);S.rx+=(-S.ty*5-S.rx)*k;S.ry+=(S.tx*6.5-S.ry)*k;const st=el.style;if(S.px!=null)aim();st.setProperty('--rx',S.rx.toFixed(2)+'deg');st.setProperty('--ry',S.ry.toFixed(2)+'deg');
 if(!api.lite){st.setProperty('--gx',(42-S.ry*4.2).toFixed(1)+'%');st.setProperty('--gy',(20+S.rx*4.4).toFixed(1)+'%');st.setProperty('--sx',(-S.ry*2.6).toFixed(1)+'px');st.setProperty('--sy',(26+S.rx*2.2).toFixed(1)+'px');}
 if(S.flip){S.flip.t=Math.min(1,S.flip.t+dt/.62);pose(S.flip.t);if(S.flip.t>=1){S.spread=S.flip.to;S.flip=null;paint();}}
 if(S.note&&performance.now()>S.noteUntil){S.note='';const n=el.querySelector('.dm-note');if(n)n.textContent='';}
}
function mount(h){host=h;}
function open(a){api=a;if(!host)return;if(el&&el.isConnected){refresh();return;}el=null;build();}
function close(){if(el){root.removeEventListener('keydown',keys,true);el.remove();}el=null;S=null;}
root.CityDiningMenu={mount,open,close,frame,turn,refresh,isOpen:()=>!!el,state:()=>S?{spread:S.spread,spreads:S.spreads,flipping:!!S.flip,rx:S.rx,ry:S.ry}:null};
})(typeof globalThis!=='undefined'?globalThis:this);
/* PLATDO City table service (V6.3): sitting down at a restaurant, the menu, the waiter, eating, and paying.
 * Single player. The City is paused while you are at the table (screen 'dining'); this file moves the people it
 * owns, the camera and the food itself.
 * - seatNear() / sit(): the "Sit down" prompt at a free seat, and what the interact key does there.
 * - Rooms: the people each place always has (guests at some tables, a waiter, a cook) and the plates in front of
 *   the guests. They are drawn through wrap(), which adds them to whatever the game was going to draw.
 * - The meal (D): sit -> menu -> the waiter comes, takes the order and goes -> the kitchen -> the waiter brings the
 *   tray and sets the table -> eat (drag a dish to your mouth) -> menu again or pay and stand up.
 * - The menu is built in the page (see city-dining-menu.js) and reports back through chose() and closed().
 * Hooks: wrap() and tick() from the City's frame, draw() and pose() from the scene's render, render() when the
 * screen opens. */
(function(root){'use strict';
const PI=Math.PI,TAU=PI*2,doc=root.document,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);},bump=(t,a,b,c,d)=>ease((t-a)/(b-a))*(1-ease((t-c)/(d-c)));
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const Dn=()=>root.CityDining,Food=()=>root.CityDiningFood,Eat=()=>root.CityRestaurants,PMo=()=>root.CityPeopleModels,Menu=()=>root.CityDiningMenu;
const money=n=>'$'+Math.round(n).toLocaleString('en-US'),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
let D=null,ctx=null,ui=null,trayMat=null,trayGeo=null;const rooms=new Map(),SEED=new Date().toDateString();
// A point given in a seat's own frame: r to the sitter's right, u up from the floor, f ahead (toward the table).
const at=(q,r,u,f)=>{const s=Math.sin(q.yaw),c=Math.cos(q.yaw);return{x:q.x+c*r+s*f,y:q.y+u,z:q.z-s*r+c*f};};
const xyz=q=>({x:q.x,y:q.y,z:q.z,yaw:q.yaw||0});
// Where a dish stands in front of a seat: to the right, ahead. Big dishes take the middle.
const SLOTS=[[0,.63],[-.29,.58],[.29,.58],[-.3,.86],[.3,.86],[0,.99]],SLOT_ORDER={main:[0,5,3,4,1,2],pizza:[0,5,3,4,1,2],pasta:[0,5,3,4,1,2],starter:[1,3,0,4,2,5],dessert:[3,1,0,4,2,5],side:[2,4,1,3,5,0],drink:[4,2,5,3,1,0]},TOP=.786;
// ---- the people and plates a place has -------------------------------------------------------------------------
// V6.6: guests come and go. A party walks up to the door, goes to a free table and sits down; the room's second
// waiter takes the order, fetches it from the pass and sets it down; the party eats, gets up and walks out; the
// plates stay until that waiter has cleared them, and only then is the table free again. It is all for show: the
// game's own people are not involved, nothing of it is saved, and it runs only for rooms near the player.
let dineClock=0,serial=0;const Vis=()=>root.CityVisitors;const rnd=(a,b)=>a+Math.random()*(b-a),FAMS=['weekend','business-casual','street-casual','nightlife','formal-office','beach-leisure','athletic'];
function room(sim,svc){
 let R=rooms.get(svc.id);if(R)return R;const p=Dn().place(svc.id),cat=root.CityPeople?.catalog||[];
 const pick=(key,fams)=>{const i=hash(key)%Math.max(1,cat.length);for(let n=0;n<600;n++){const a=cat[(i+n*13)%cat.length];if(a&&(!fams||fams.includes(a.family)))return a;}return cat[i];};
 const st=svc.dining.station,ck=svc.dining.cook,staff=p.kind==='steak'?['formal-office']:['service'],person=(kind,where,fams)=>({kind,ent:{id:'dn:'+svc.id+':'+kind,...xyz(where),appearance:pick(svc.id+':'+kind,fams),health:100,mode:'idle',speed:0}});
 const waiter=person('waiter',st,staff),cook=person('cook',ck,['service']);
 // the second waiter, who looks after the other guests, waits a step away from the first
 let home2=null;for(const[dx,dz]of[[-1.2,0],[1.2,0],[0,1.2],[0,-1.2],[-1.2,1.2],[1.2,1.2]]){const pt={x:st.x+dx,z:st.z+dz};if(openAt(svc,pt)){home2={x:pt.x,y:st.y,z:pt.z,yaw:st.yaw||0};break;}}
 const server=person('server',home2||st,staff);server.home=home2||{x:st.x,y:st.y,z:st.z,yaw:st.yaw||0};server.job=null;server.carry=null;waiter.home={x:st.x,y:st.y,z:st.z,yaw:st.yaw||0};waiter.job=null;waiter.carry=null;
 /* a save from before V6.3 has the diner's cashier standing where the old counter was: they move to the new till */
 if(svc.id==='diner'){const old=sim.npcs.find(n=>n.id==='staff-diner');if(old&&Math.hypot(old.x-(svc.x+svc.w*.4),old.z-svc.z)<1.5){old.x=svc.staff.x;old.z=svc.staff.z;old.yaw=svc.dining.host.yaw;}}
 R={svc,place:p,people:[waiter,cook,server],waiter,server,taken:new Set(),parties:[],jobs:[],group:null,pick,last:null,next:rnd(3,9)};rooms.set(svc.id,R);
 // the room is not empty when you first see it: some parties are already eating
 for(let k=Math.max(2,Math.round(svc.dining.tables.length*.27));k>0;k--)if(!seatParty(sim,R,true))break;
 return R;
}
function nearRooms(sim){const p=sim.player,out=[];for(const s of sim.world.services)if(s.dining&&Math.hypot(p.x-s.x,p.z-s.z)<70)out.push(room(sim,s));return out;}
// Is this spot of the floor free to stand on?
function openAt(svc,pt){const G=grid(svc),i=Math.floor((pt.x-G.x0)/G.c),j=Math.floor((pt.z-G.z0)/G.c);return i>=0&&j>=0&&i<G.nx&&j<G.nz&&!G.shut[i+j*G.nx];}
// Where a waiter stands to serve a table: beside its first seat, on whichever side is free.
function sideSpot(svc,q){for(const s of[1,-1])for(const r of[1.05,1.25]){const pt=at(q,s*r,0,.72);if(openAt(svc,pt))return pt;}return{x:q.stand.x,z:q.stand.z};}
// The door of a place (always in its south wall): a point just inside, one just outside (beyond the deck where
// there is one), and one out on the pavement where guests appear and disappear.
function doorOf(sim,svc){
 if(svc._dineDoor)return svc._dineDoor;const d=sim.world.doors?.find(k=>k.serviceId===svc.id),zw=svc.z+svc.d/2,x=d?d.x:svc.x,deck=svc.dining.patio,a=svc.approach,out=(deck?deck.z1:zw)+1.4;
 return svc._dineDoor={inside:{x,z:zw-1.2},outside:{x,z:out},far:{x:a?a.x:x,z:Math.max(a?a.z:0,out+4.2)},deck:!!deck};
}
const freeTables=R=>{const out=[];R.svc.dining.tables.forEach((t,i)=>{if(!R.taken.has(i)&&!(D&&D.svc===R.svc&&D.ti===i))out.push(i);});return out;};
// A new party for a free table. `already` puts it at the table in the middle of its meal (for a room first seen).
function seatParty(sim,R,already){
 const svc=R.svc,free=freeTables(R);if(!free.length)return null;const ti=free[Math.floor(Math.random()*free.length)],t=svc.dining.tables[ti],max=t.seats.length,size=Math.min(max,t.kind==='two'?(Math.random()<.7?2:1):2+Math.floor(Math.random()*Math.min(3,max-1))),id=++serial,door=doorOf(sim,svc);
 const foods=R.place.menu.filter(m=>m.cat!=='drink'&&m.cat!=='side'),drinks=R.place.menu.filter(m=>m.cat==='drink');
 const P={id,ti,table:t,state:already?'eat':'arrive',t:already?rnd(0,40):0,eat:already?rnd(45,110):rnd(60,125),members:[],group:null,served:!!already,dirty:false,cleared:false,done:false};
 for(let k=0;k<size;k++){const q=t.seats[k],it=foods[Math.floor(Math.random()*foods.length)],dr=drinks[Math.floor(Math.random()*drinks.length)];
  const e={id:'dn:'+svc.id+':g'+id+':'+k,x:already?q.x:door.far.x+rnd(-.6,.6),y:q.y,z:already?q.z:door.far.z+k*.8,yaw:already?q.yaw:PI,appearance:R.pick('g'+id+':'+k+':'+Math.random(),FAMS),health:100,mode:'idle',speed:0};if(already)e.animation={mode:'sitting'};
  P.members.push({ent:e,seat:q,state:already?'seated':'wait',delay:k*.75,phase:Math.random()*11,dishes:[[it.dish,0],[dr.dish,4]],path:null,t:0});}
 R.taken.add(ti);R.parties.push(P);
 /* V7.7: a new party comes by car, by bike or on foot (city-visitors.js); until it is here its people are not shown */
 if(!already){P.trip=Vis()?.plan?.(sim,svc,size)||null;if(P.trip)for(const m of P.members)m.state='trip';}
 return P;
}
// One step of a room: who arrives, who is walking, who is eating, who leaves; then the second waiter's round.
function stepRoom(sim,R,dt){
 const svc=R.svc,door=doorOf(sim,svc),want=Math.max(2,Math.round(svc.dining.tables.length*.36));
 /* a new party only when tables are to spare (a table not yet cleared counts as taken) and the waiters are keeping up */
 /* V7.7: busier at lunch and dinner, quiet at night */const rs=Vis()?.rush?.(sim);
 R.next-=dt;if(R.next<=0){R.next=rs?rs[0]:rnd(12,30);const cap=rs?Math.max(1,Math.round(svc.dining.tables.length*rs[1])):want;if(R.taken.size<cap&&R.jobs.length<3)seatParty(sim,R,false);}
 for(const P of R.parties){P.t+=dt;if(P.trip)Vis()?.keep?.(P.trip);
  if(P.state==='arrive'){let all=true;for(const m of P.members){const e=m.ent,q=m.seat;
    if(m.state==='trip'){all=false;/* V12.1: a ride that gave up while you were away (city-visitors ends it after 10 s unwatched) left its party standing on the pavement for ever, drawn but not really there: they come on foot from the pavement instead */if(P.trip&&P.trip.state==='done'){P.trip=null;for(const q2 of P.members)if(q2.state==='trip')q2.state='wait';continue;}if(Vis()?.ready?.(P.trip)){m.delay-=dt;if(m.delay<=0){const st=Vis().start(sim,P.trip,P.members.indexOf(m));e.x=st.x;e.z=st.z;e.yaw=st.yaw||0;m.path=[...st.path.slice(1),...route(svc,door.deck?door.outside:door.inside,q.stand)].map(k=>({x:k.x,z:k.z}));m.state='walk';}}}
    else if(m.state==='wait'){m.delay-=dt;if(m.delay<=0){m.state='walk';m.path=[...(door.deck?[]:[door.outside]),...route(svc,door.deck?door.outside:door.inside,q.stand)].map(k=>({x:k.x,z:k.z}));}all=false;}
    else if(m.state==='walk'){if(walk(m,dt,1.3)){m.state='sit';m.t=0;m.from={x:e.x,z:e.z,yaw:e.yaw};}all=false;}
    else if(m.state==='sit'){m.t+=dt;const k=ease(m.t/.6);e.x=mix(m.from.x,q.x,k);e.z=mix(m.from.z,q.z,k);let dy=q.yaw-m.from.yaw;while(dy>PI)dy-=TAU;while(dy<-PI)dy+=TAU;e.yaw=m.from.yaw+dy*k;e.mode='idle';e.speed=0;if(m.t>=.6){m.state='seated';e.x=q.x;e.z=q.z;e.yaw=q.yaw;e.animation={mode:'sitting'};}else all=false;}}
   if(all){P.state='read';P.t=0;P.wait=rnd(5,11);}}
  else if(P.state==='read'){if(P.t>P.wait){P.state='order';R.jobs.push({kind:'order',P});}}
  /* 'order' waits for a waiter; then the kitchen cooks while the waiters do other tables */
  else if(P.state==='cook'){if(P.t>P.cook){P.state='ready';R.jobs.push({kind:'serve',P});}}
  else if(P.state==='eat'){for(const m of P.members){const u=(P.t+m.phase)%11;if(u<1.7)m.ent.eatT=u/1.7;else delete m.ent.eatT;}
   if(P.t>P.eat){P.state='leave';P.t=0;P.dirty=true;for(const m of P.members){delete m.ent.eatT;m.state='stand';m.t=-m.delay*.7;}}}
  else if(P.state==='leave'){let gone=true;for(const m of P.members){const e=m.ent,q=m.seat;
    if(m.state==='stand'){m.t+=dt;if(m.t>=0){const k=ease(m.t/.55);delete e.animation;e.mode='idle';e.speed=0;e.x=mix(q.x,q.stand.x,k);e.z=mix(q.z,q.stand.z,k);if(m.t>=.55){m.state='out';/* V7.7: back the way they came: to their car or bike, or off down the street */if(!P.trip)P.trip=Vis()?.walker?.(sim,svc)||null;const home=P.trip?Vis()?.homeward?.(sim,P.trip,P.members.indexOf(m)):null;m.path=[...route(svc,q.stand,door.deck?door.outside:door.inside).slice(1),...(door.deck?[]:[door.outside]),...(home?home.slice(1):[door.far])].map(k2=>({x:k2.x,z:k2.z}));}}gone=false;}
    else if(m.state==='out'){if(walk(m,dt,1.35))m.state='gone';else gone=false;}}
   if(gone){P.state='gone';R.jobs.push({kind:'clear',P});/* V7.7: everyone is in: the car or bike leaves */Vis()?.depart?.(sim,P.trip);}}}
 for(const s of waiters(R))stepServer(sim,R,s,dt);R.parties=R.parties.filter(P=>!(P.done&&!P.group));
}
// The waiters who look after the other guests: the second waiter always, the first one too while they are not
// serving you. They share one list of jobs: bring what the kitchen has ready, take an order, clear a left table.
const waiters=R=>D&&D.svc===R.svc?[R.server]:[R.server,R.waiter];
function takeJob(R){for(const kind of['rack','serve','order','clear']){const i=R.jobs.findIndex(j=>j.kind===kind);if(i>=0)return R.jobs.splice(i,1)[0];}return null;}
function stepServer(sim,R,s,dt){
 const svc=R.svc,dn=svc.dining,e=s.ent,pace=1.5;let j=s.job;
 if(!j){j=s.job=takeJob(R);if(!j){if(walk(s,dt,1.25)){let dy=(s.home.yaw||0)-e.yaw;while(dy>PI)dy-=TAU;while(dy<-PI)dy+=TAU;e.yaw+=dy*(1-Math.exp(-dt*6));}return;}
  j.t=0;j.spot=j.kind==='rack'?j.to:sideSpot(svc,j.P.table.seats[0]);if(j.kind==='serve'||j.kind==='rack'){j.step='toPass';s.path=route(svc,e,j.from||dn.pass).slice(1);}else{j.step='go';s.path=route(svc,e,j.spot).slice(1);}}
 j.t+=dt;const P=j.P,tb=P?P.table:{x:j.to.x,z:j.to.z+.8},finish=()=>{s.job=null;s.carry=null;s.bag=false;s.path=R.jobs.length?null:route(svc,e,s.home).slice(1);};
 if(j.step==='toPass'){if(walk(s,dt,pace)){j.step='load';j.t=0;}}
 else if(j.step==='load'){face(e,j.from?j.from.x:dn.plate.x,j.from?j.from.z-2:dn.plate.z,dt);if(j.t>.9){if(j.kind==='rack')s.bag=true;else s.carry=P;j.step='go';s.path=route(svc,e,j.spot).slice(1);}}
 else if(j.step==='go'){if(walk(s,dt,s.carry||s.bag?1.25:pace)){j.step='at';j.t=0;}}
 else{face(e,tb.x,tb.z,dt);
  if(j.kind==='rack'){/* V6.8: a DingDash bag goes onto the rack by the door */if(j.t>.8){try{j.done?.();}catch(error){}finish();}}
  else if(j.kind==='order'){if(j.t>1.9){P.state='cook';P.t=0;P.cook=rnd(9,16);finish();}}
  else if(j.kind==='serve'){if(j.t>1){P.served=true;P.state='eat';P.t=0;finish();}}
  else if(j.t>1.2){P.cleared=true;P.done=true;R.taken.delete(P.ti);finish();}}
}// V6.8: city-delivery.js asks for a DingDash bag to be carried from the kitchen to the rack. Answers false when
// the room is not being played out (you are not near), so the bag is simply put there on time.
function rackJob(id,to,done){const R=rooms.get(id),sim=root.PlatdoCity?.sim;if(!R||!to||!sim||sim.onlineRoom||Math.hypot(sim.player.x-R.svc.x,sim.player.z-R.svc.z)>70||!openAt(R.svc,{x:to.x,z:to.z-.8}))return false;const near={x:R.svc.x+5.7,z:R.svc.z-2.45};R.jobs.push({kind:'rack',P:null,to:{x:to.x,z:to.z-.8},from:openAt(R.svc,near)?near:null,done});return true;}
// Everybody the rooms near the player add to the picture. The rooms move on by the City's clock while you walk
// about, and by the time spent at the table while you sit (the City's own clock stands still there).
function ambient(sim){
 const out=[],now=(sim.time||0)+dineClock;
 for(const R of nearRooms(sim)){if(R.last===null||now<R.last)R.last=now;const dt=Math.min(now-R.last,.1);R.last=now;if(dt>0)stepRoom(sim,R,dt);
  for(const a of R.people)out.push(a.ent);for(const P of R.parties)for(const m of P.members)if(m.state!=='gone'&&m.state!=='wait'&&m.state!=='trip'/* V12.1: still on their way: not shown until they get out of their car or off their bike */)out.push(m.ent);}
 return out;
}
// ---- the seat prompt -------------------------------------------------------------------------------------------
function seatNear(sim){
 if(!doc||!sim||sim.onlineRoom||D)return null;const p=sim.player;if(!p||p.health<=0||p.mode!=='onFoot'||p.transition||p.physical)return null;
 /* V6.5: a seat can be on a deck outside the walls */const here=sim.world.interiorAt?.(p.x,p.z,(p.y||0)+1)||sim.world.services.find(s=>s.dining?.patio&&p.x>s.dining.patio.x0-.5&&p.x<s.dining.patio.x1+.5&&p.z>s.dining.patio.z0-.2&&p.z<s.dining.patio.z1+1.3);if(!here||!here.dining)return null;const R=room(sim,here);let best=null,bd=1.45;
 here.dining.tables.forEach((t,i)=>{if(R.taken.has(i))return;for(const q of t.seats){const d=Math.min(Math.hypot(p.x-q.x,p.z-q.z),Math.hypot(p.x-q.stand.x,p.z-q.stand.z)+.3);if(d<bd){bd=d;best={svc:here,table:i,seat:q};}}});
 return best;
}
function sit(sim){const q=seatNear(sim);if(!q)return false;if(sim.wanted?.level){sim.emit('notice',{message:'Service is unavailable during an active pursuit.'});return true;}sim.emit('dining',{service:q.svc.id,table:q.table,seat:q.seat.id});return true;}
// ---- the way across a room: a grid of 40 cm squares, closed where furniture and chairs stand ----------------
function grid(svc){
 if(svc._dineGrid)return svc._dineGrid;const c=.4,x0=svc.x-svc.w/2,z0=svc.z-svc.d/2,deck=svc.dining.patio,nx=Math.ceil(svc.w/c),nz=Math.ceil(((deck?deck.z1:svc.z+svc.d/2)-z0)/c),shut=new Uint8Array(nx*nz);
 const mark=(x,z,w,d,pad)=>{const a=Math.max(0,Math.floor((x-w/2-pad-x0)/c)),b=Math.min(nx-1,Math.floor((x+w/2+pad-x0)/c)),e=Math.max(0,Math.floor((z-d/2-pad-z0)/c)),f=Math.min(nz-1,Math.floor((z+d/2+pad-z0)/c));for(let i=a;i<=b;i++)for(let j=e;j<=f;j++)shut[i+j*nx]=1;};
 for(const f of svc.furnishings)if(f.kind!=='dine-gate'&&f.h>.2)mark(f.x,f.z,f.w,f.d,.2);
 for(const t of svc.dining.tables)if(t.kind!=='booth')for(const q of t.seats)mark(q.x,q.z,.44,.44,.16);
 for(const t of svc.dining.tables)if(t.out)mark(t.x,t.z,t.w,t.d,.2);
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)if(i<1||j<1||i>nx-2||j>nz-2)shut[i+j*nx]=1;
 /* V6.5: with a deck, the front wall is inside the grid: closed, except the doorway */if(deck){const jw=Math.floor((svc.z+svc.d/2-z0)/c);for(let i=0;i<nx;i++)for(const j of[jw-1,jw])if(j>=0&&j<nz)shut[i+j*nx]=Math.abs(x0+(i+.5)*c-svc.x)>(svc.doorWidth||3.2)/2-.3?1:0;}
 return svc._dineGrid={c,x0,z0,nx,nz,shut};
}
function route(svc,a,b){
 const G=grid(svc),{c,x0,z0,nx,nz,shut}=G,cell=q=>[clamp(Math.floor((q.x-x0)/c),0,nx-1),clamp(Math.floor((q.z-z0)/c),0,nz-1)],open=(i,j)=>i>=0&&j>=0&&i<nx&&j<nz&&!shut[i+j*nx];
 const nearest=q=>{const[ci,cj]=cell(q);if(open(ci,cj))return[ci,cj];let best=null,bd=1e9;for(let r=1;r<8&&!best;r++)for(let i=ci-r;i<=ci+r;i++)for(let j=cj-r;j<=cj+r;j++)if(open(i,j)){const d=(i-ci)**2+(j-cj)**2;if(d<bd){bd=d;best=[i,j];}}return best||[ci,cj];};
 const s=nearest(a),g=nearest(b),prev=new Int32Array(nx*nz).fill(-1),queue=[s[0]+s[1]*nx];prev[queue[0]]=queue[0];
 for(let h=0;h<queue.length;h++){const k=queue[h],i=k%nx,j=(k-i)/nx;if(i===g[0]&&j===g[1])break;for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const ni=i+di,nj=j+dj;if(!open(ni,nj)||prev[ni+nj*nx]>=0)continue;if(di&&dj&&(!open(i+di,j)||!open(i,j+dj)))continue;prev[ni+nj*nx]=k;queue.push(ni+nj*nx);}}
 const goal=g[0]+g[1]*nx;if(prev[goal]<0)return[{x:a.x,z:a.z},{x:b.x,z:b.z}];const cells=[];for(let k=goal;;k=prev[k]){cells.push(k);if(prev[k]===k)break;}cells.reverse();
 const pts=cells.map(k=>({x:x0+(k%nx+.5)*c,z:z0+(Math.floor(k/nx)+.5)*c})),clear=(u,v)=>{const n=Math.ceil(Math.hypot(v.x-u.x,v.z-u.z)/.15);for(let i=1;i<n;i++){const x=mix(u.x,v.x,i/n),z=mix(u.z,v.z,i/n);if(!open(Math.floor((x-x0)/c),Math.floor((z-z0)/c)))return false;}return true;};
 const out=[{x:a.x,z:a.z}];let from=0;while(from<pts.length-1){let to=pts.length-1;while(to>from+1&&!clear(pts[from],pts[to]))to--;out.push(pts[to]);from=to;}
 return out;
}
// Move a person along a path. Returns true when they have arrived.
function walk(a,dt,speed=1.35){const e=a.ent,path=a.path;if(!path||!path.length){e.speed=0;e.mode='idle';return true;}const t=path[0],dx=t.x-e.x,dz=t.z-e.z,d=Math.hypot(dx,dz),step=speed*dt;
 if(d<=step){e.x=t.x;e.z=t.z;path.shift();if(!path.length){e.speed=0;e.mode='idle';return true;}return false;}
 e.x+=dx/d*step;e.z+=dz/d*step;const want=Math.atan2(dx,dz);let dy=want-e.yaw;while(dy>PI)dy-=TAU;while(dy<-PI)dy+=TAU;e.yaw+=dy*(1-Math.exp(-dt*9));e.speed=speed;e.mode='walk';return false;}
// A long walk is cut short, the way a film cuts it: the walker starts keep metres from the end of the path.
function shorten(a,path,keep){let len=0;for(let i=path.length-1;i>0;i--){const d=Math.hypot(path[i].x-path[i-1].x,path[i].z-path[i-1].z);if(len+d>keep){const k=(keep-len)/d,x=mix(path[i].x,path[i-1].x,k),z=mix(path[i].z,path[i-1].z,k);a.ent.x=x;a.ent.z=z;a.ent.yaw=Math.atan2(path[i].x-x,path[i].z-z);return path.slice(i);}len+=d;}return path;}
const face=(e,x,z,dt)=>{let dy=Math.atan2(x-e.x,z-e.z)-e.yaw;while(dy>PI)dy-=TAU;while(dy<-PI)dy+=TAU;e.yaw+=dy*(1-Math.exp(-dt*7));};
// ---- sounds: small, made here, played through the game's own effects volume --------------------------------
function sound(kind){
 const a=ctx?.audio,ac=a?.context,out=a?.buses?.sfx||ac?.destination;if(!ac||!out||ac.state!=='running')return;
 /* V6.6: the player's own recordings: the pointer coming onto a dish, choosing a dish, sending the order, a small
  * bite, a big bite, a gulp. Paying rings the till, which the City does for anything bought in person. */
 const own={tick:'menuHover',select:'menuClick',order:'sendOrder',chew:'eatSmall',chewBig:'eatBig',gulp:'drinkGulp'}[kind];if(own&&a.sample?.(own,1,0))return;if(kind==='pay')return;if(kind==='chewBig')kind='chew';
 const t=ac.currentTime;
 const tone=(f,dur,vol,type='sine',f2=0,at=0)=>{const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t+at);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+at+dur);g.gain.setValueAtTime(.0001,t+at);g.gain.exponentialRampToValueAtTime(vol,t+at+.006);g.gain.exponentialRampToValueAtTime(.0001,t+at+dur);o.connect(g);g.connect(out);o.start(t+at);o.stop(t+at+dur+.02);};
 const noise=(dur,vol,f1,f2,q=1.2,at=0)=>{const n=Math.ceil(ac.sampleRate*dur),buf=ac.createBuffer(1,n,ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=buf;f.type='bandpass';f.Q.value=q;f.frequency.setValueAtTime(f1,t+at);if(f2)f.frequency.exponentialRampToValueAtTime(f2,t+at+dur);g.gain.setValueAtTime(vol,t+at);s.connect(f);f.connect(g);g.connect(out);s.start(t+at);};
 if(kind==='tick'){tone(2100,.018,.012);noise(.012,.02,3200,0,2);}
 else if(kind==='select'){tone(220,.05,.03);tone(880,.09,.028,'sine',0,.012);tone(1320,.12,.018,'sine',0,.05);}
 else if(kind==='remove'){tone(520,.07,.02,'sine',330);}
 else if(kind==='page'){noise(.3,.085,900,3200,.8);noise(.12,.04,2400,1200,1.4,.2);}
 else if(kind==='order'){[523,659,784].forEach((f,i)=>tone(f,.22,.03,'triangle',0,i*.08));}
 else if(kind==='plate'){noise(.05,.09,300,0,.8);tone(2300,.07,.012,'sine',0,.01);}
 else if(kind==='lift'){noise(.05,.03,1500,2600,1);}
 else if(kind==='chew'){for(let i=0;i<4;i++)noise(.06,.07,900+i*90,0,1.6,.1+i*.17);}
 else if(kind==='gulp'){for(let i=0;i<3;i++)tone(330,.09,.045,'sine',170,.18+i*.24);}
 else if(kind==='pay'){tone(1318,.09,.03,'triangle');tone(1760,.2,.03,'triangle',0,.08);}
 else if(kind==='no'){tone(196,.12,.03,'triangle',150);}
 else if(kind==='sit'){noise(.14,.03,500,250,.7);}
}
// ---- the meal ---------------------------------------------------------------------------------------------------
function begin(sim,e,c){
 const svc=sim.world.serviceById?.[e.service];if(!svc?.dining||D)return false;const t=svc.dining.tables[e.table],q=t&&t.seats.find(s=>s.id===e.seat);if(!q)return false;
 ctx=c;const R=room(sim,svc),p=sim.player,cam=c.scene?.camera,sv=Eat()?.survival(sim);
 // a bill from a meal that was never paid (the game was closed at the table) is settled first
 if(sv?.tab?.amount>0){const owed=sv.tab.amount;if(sim.commit('dine:late:'+sim.uid('dine'),-Math.min(owed,Math.max(0,sim.profile.wallet)),'Unpaid meal'))c.toast?.('Your unpaid bill of '+money(owed)+' from last time has been charged.');delete sv.tab;sim.dirty=true;}
 let from=null;if(cam){const T=root.THREE,dir=cam.getWorldDirection(new T.Vector3());from={pos:{x:cam.position.x,y:cam.position.y,z:cam.position.z},tgt:{x:cam.position.x+dir.x*3,y:cam.position.y+dir.y*3,z:cam.position.z+dir.z*3},fov:cam.fov};}
 const waiter=R.people.find(a=>a.kind==='waiter'),cook=R.people.find(a=>a.kind==='cook');if(waiter.job){/* V6.6: your waiter hands the other table back to the list */R.jobs.unshift({kind:waiter.job.kind,P:waiter.job.P,to:waiter.job.to,from:waiter.job.from,done:waiter.job.done});waiter.job=null;waiter.carry=null;waiter.bag=false;}
 // which side of the seat the waiter can stand on
 const G=grid(svc),free=pt=>{const i=Math.floor((pt.x-G.x0)/G.c),j=Math.floor((pt.z-G.z0)/G.c);return i>=0&&j>=0&&i<G.nx&&j<G.nz&&!G.shut[i+j*G.nx];};let side=1;
 for(const s of[1,-1]){if(free(at(q,s*1.02,0,.72))||free(at(q,s*1.25,0,.72))){side=s;break;}}
 D={sim,svc,R,place:R.place,table:t,ti:e.table,seat:q,side,state:'sit',t:0,clock:0,cart:{},tab:0,items:[],pending:[],from:{x:p.x,y:p.y,z:p.z,yaw:p.yaw},cam:from||null,camFrom:from,camTo:null,camK:0,camDur:.9,shot:'',waiter,cook,held:null,bite:null,pointer:{x:0,y:0,has:false},said:null,fade:0,pops:[],ate:0,done:false,sinceServe:0};
 setShot('menu',.9);sound('sit');return true;
}
function shotOf(name){
 const q=D.seat,s=D.side,w=D.waiter.ent,dn=D.svc.dining;
 if(name==='menu')return{pos:at(q,-s*.5,1.5,-.8),tgt:at(q,s*.1,.86,.78),fov:50};
 if(name==='order')return{pos:at(q,-s*.55,1.42,2),tgt:at(q,s*.3,1.08,.1),fov:54};
 if(name==='waiter')return{pos:at(q,-s*.46,1.52,1.62),tgt:{x:mix(q.x,w.x,.78),y:q.y+1.02,z:mix(q.z,w.z,.78)},fov:54};
 if(name==='kitchen')return{pos:{x:dn.plate.x+1.5,y:q.y+1.6,z:dn.pass.z+1.9},tgt:{x:mix(dn.plate.x,dn.range.x,.45),y:q.y+1.22,z:mix(dn.plate.z,dn.range.z,.45)},fov:46};
 return{pos:at(q,.08,1.46,1.92),tgt:at(q,0,.87,.26),fov:40};
}
function setShot(name,dur=.8){D.shot=name;D.camFrom=D.cam?{pos:{...D.cam.pos},tgt:{...D.cam.tgt},fov:D.cam.fov}:null;D.camK=D.camFrom&&dur>0?0:1;D.camDur=dur||.01;}
function stepCamera(dt){const to=shotOf(D.shot);D.camK=Math.min(1,D.camK+dt/D.camDur);const k=ease(D.camK),f=D.camFrom;
 D.cam=f&&k<1?{pos:{x:mix(f.pos.x,to.pos.x,k),y:mix(f.pos.y,to.pos.y,k),z:mix(f.pos.z,to.pos.z,k)},tgt:{x:mix(f.tgt.x,to.tgt.x,k),y:mix(f.tgt.y,to.tgt.y,k),z:mix(f.tgt.z,to.tgt.z,k)},fov:mix(f.fov,to.fov,k)}:to;}
const say=(who,text,time=2.4)=>{D.said={who,text,until:D.clock+time};};
const tableItems=()=>D.items.filter(m=>m.state!=='gone');
const cartList=()=>Object.entries(D.cart).filter(([,n])=>n>0).map(([id,n])=>[Dn().dish(id),n]).filter(r=>r[0]);
const cartTotal=()=>cartList().reduce((s,[it,n])=>s+it.price*n,0),cartCount=()=>cartList().reduce((s,[,n])=>s+n,0);
// What the menu asks: add or remove a dish from the order being written.
function chose(id,delta){
 const it=Dn().dish(id);if(!it||!D||D.state!=='menu')return{ok:false};const have=D.cart[id]||0;
 if(delta>0){if(tableItems().length+cartCount()>=SLOTS.length)return{ok:false,message:'Your table is full. Eat something first.'};if(D.sim.profile.wallet<D.tab+cartTotal()+it.price)return{ok:false,message:'You cannot afford that. You have '+money(D.sim.profile.wallet)+(D.tab?' and a bill of '+money(D.tab)+' so far.':'.')};D.cart[id]=have+1;sound('select');}
 else if(have>0){D.cart[id]=have-1;if(!D.cart[id])delete D.cart[id];sound('remove');}
 return{ok:true};
}
function placeOrder(){
 if(!D||D.state!=='menu'||!cartCount())return false;const sim=D.sim,sum=cartTotal(),sv=Eat()?.survival(sim);if(sim.profile.wallet<D.tab+sum)return false;
 D.pending=[];for(const[it,n]of cartList())for(let i=0;i<n;i++)D.pending.push(it);D.cart={};D.tab+=sum;if(sv){sv.tab={place:D.place.id,amount:D.tab};sim.dirty=true;ctx.saveNow?.();}
 sound('order');Menu()?.close();D.state='approach';D.t=0;setShot('order',.9);
 D.waiter.path=shorten(D.waiter,route(D.svc,D.waiter.ent,at(D.seat,D.side*1.05,0,.72)),4.4);return true;
}
function closeMenu(){if(!D||D.state!=='menu')return;Menu()?.close();D.cart={};D.state='eat';D.t=0;setShot('eat',.8);}
function openMenu(){if(!D||D.state!=='eat'||D.held||D.bite)return;D.state='menu';D.t=0;setShot('menu',.7);Menu()?.open(menuApi());sound('page');}
const menuApi=()=>({place:D.place,scene:ctx.scene,cart:D.cart,tab:D.tab,wallet:D.sim.profile.wallet,free:SLOTS.length-tableItems().length,chose,order:placeOrder,close:closeMenu,sound,lite:['potato','low'].includes(ctx.scene?.graphics?.id)});
// A free place on the table for a dish.
function slotFor(it){const used=new Set(tableItems().map(m=>m.slot));for(const i of SLOT_ORDER[it.cat]||SLOT_ORDER.main)if(!used.has(i))return i;return -1;}
function leave(){if(!D||D.done||!['eat','menu'].includes(D.state))return;Menu()?.close();if(D.held){D.held.state='table';D.held=null;}for(const m of D.items)if(m.state==='wait')m.state='table';D.bite=null;D.state='pay';D.t=0;setShot('order',.7);
 const sim=D.sim,sv=Eat()?.survival(sim);if(D.tab>0){if(sim.commit('dine:'+D.place.id+':'+sim.uid('dine'),-D.tab,'Meal at '+D.place.name))sound('pay');say('waiter','Thank you. That comes to '+money(D.tab)+'.',2);}if(sv){delete sv.tab;sim.dirty=true;}D.paid=D.tab;D.tab=0;}
function finish(){
 const sim=D.sim,p=sim.player,q=D.seat;clearTable(true);p.x=q.stand.x;p.z=q.stand.z;p.y=q.y+.02;p.yaw=q.yaw+PI;p.vx=p.vy=p.vz=0;p.lastSafe={x:p.x,y:p.y,z:p.z};
 D.waiter.path=null;Object.assign(D.waiter.ent,xyz(D.svc.dining.station),{mode:'idle',speed:0});Object.assign(D.cook.ent,xyz(D.svc.dining.cook),{mode:'idle',speed:0});
 const paid=D.paid,name=D.place.name;D=null;relax();removeUi();ctx.saveNow?.();ctx.setScreen('play');if(paid>0)ctx.toast?.('You paid '+money(paid)+' at '+name+'.');
}
// The screen was closed some other way (Escape, a menu): pay what is owed and put everything back.
function abort(sim){if(!D)return;const sv=Eat()?.survival(sim),p=sim.player,q=D.seat;if(D.tab>0&&sim.commit('dine:'+D.place.id+':'+sim.uid('dine'),-D.tab,'Meal at '+D.place.name))ctx?.toast?.('You paid '+money(D.tab)+' at '+D.place.name+'.');if(sv){delete sv.tab;sim.dirty=true;}
 Menu()?.close();clearTable(true);p.x=q.stand.x;p.z=q.stand.z;p.y=q.y+.02;p.vx=p.vy=p.vz=0;D.waiter.path=null;Object.assign(D.waiter.ent,xyz(D.svc.dining.station),{mode:'idle',speed:0});Object.assign(D.cook.ent,xyz(D.svc.dining.cook),{mode:'idle',speed:0});D=null;relax();removeUi();}
function clearTable(all){if(!D)return;for(const m of D.items)if(all||m.state==='gone'){m.mesh?.parent?.remove(m.mesh);m.mesh=null;}if(all)D.items=[];if(D.tray){D.tray.parent?.remove(D.tray);D.tray=null;}if(D.pad){D.pad.parent?.remove(D.pad);D.pad=null;}}
// One step of the meal. dt is real time: the City itself is paused.
function tick(sim,dt){
 if(!D)return;dt=Math.min(dt,.05);if(D.fast&&!['eat','menu','pay'].includes(D.state))dt*=3;D.t+=dt;D.clock+=dt;dineClock+=dt;const q=D.seat,w=D.waiter,dn=D.svc.dining,T=root.THREE;stepCamera(dt);
 if(D.said&&D.clock>D.said.until)D.said=null;
 if(D.state==='sit'){if(D.t>1.05){D.state='menu';D.t=0;Menu()?.open(menuApi());sound('page');}}
 else if(D.state==='approach'){if(walk(w,dt)){face(w.ent,q.x,q.z,dt);if(!D.arrived){D.arrived=D.t;}if(D.t-D.arrived>.35){D.state='take';D.t=0;D.arrived=0;const names={};for(const it of D.pending)names[it.name]=(names[it.name]||0)+1;D.ticket=Object.entries(names).map(([n,k])=>(k>1?k+' \u{D7} ':'')+n);say('you',D.ticket.join('\n'),2.3);}}}
 else if(D.state==='take'){face(w.ent,q.x,q.z,dt);if(D.t>2.3&&!D.acked){D.acked=true;say('waiter',D.pending.length>3?'Excellent choices. Coming right up.':D.pending.length>1?'Very good. Coming right up.':'Good choice. Coming right up.',1.5);}
  if(D.t>3.9){D.acked=false;D.state='leave';D.t=0;w.path=route(D.svc,w.ent,dn.pass);}}
 else if(D.state==='leave'){walk(w,dt);if(D.t>1.7){/* the cut to the kitchen: the waiter is at the pass by now */w.path=null;Object.assign(w.ent,{x:dn.pass.x,z:dn.pass.z,yaw:Math.atan2(dn.plate.x-dn.pass.x,dn.plate.z-dn.pass.z),speed:0,mode:'idle'});D.state='cook';D.t=0;D.cookTime=clamp(Math.max(...D.pending.map(it=>it.cook||3))*.8+.3*(D.pending.length-1),2.4,6.5);D.fade=1;setShot('kitchen',0);D.cook.path=[{x:dn.range.x,z:dn.range.z}];D.cooked=0;}}
 else if(D.state==='cook'){const c=D.cook,k=D.t/D.cookTime;
  if(k<.62){if(walk(c,dt,1.1)){let dy=dn.range.yaw-c.ent.yaw;while(dy>PI)dy-=TAU;while(dy<-PI)dy+=TAU;c.ent.yaw+=dy*(1-Math.exp(-dt*8));}}
  else{if(!D.plating){D.plating=true;c.path=[{x:dn.plate.x,z:dn.plate.z}];}if(walk(c,dt,1.1)){let dy=dn.plate.yaw-c.ent.yaw;while(dy>PI)dy-=TAU;while(dy<-PI)dy+=TAU;c.ent.yaw+=dy*(1-Math.exp(-dt*8));}}
  const ready=Math.floor(clamp((k-.66)/.3,0,1)*D.pending.length+.001);if(ready>D.cooked){D.cooked=ready;sound('plate');}
  if(k>=1){D.plating=false;D.state='return';D.t=0;D.fade=1;setShot('waiter',0);c.path=[{x:dn.cook.x,z:dn.cook.z}];loadTray();w.path=shorten(w,route(D.svc,w.ent,at(q,D.side*1.05,0,.72)),6.2);}}
 else if(D.state==='return'){walk(D.cook,dt,1);if(walk(w,dt,1.2)){face(w.ent,q.x,q.z,dt);if(!D.arrived)D.arrived=D.t;if(D.t-D.arrived>.3){D.arrived=0;D.state='serve';D.t=0;D.served=0;setShot('eat',1.1);}}}
 else if(D.state==='serve'){face(w.ent,q.x,q.z,dt);const each=.42,onTray=D.items.filter(m=>m.state==='tray');
  if(onTray.length&&D.t>.25+D.served*each){const m=onTray[0];m.state='fly';m.t=0;m.from=m.mesh.getWorldPosition(new T.Vector3());D.served++;}
  if(!onTray.length&&!D.items.some(m=>m.state==='fly')){if(!D.enjoy){D.enjoy=D.t;say('waiter','Enjoy your meal.',1.5);}if(D.t-D.enjoy>1.1){D.enjoy=0;D.state='eat';D.t=0;D.sinceServe=0;if(D.tray){D.tray.parent?.remove(D.tray);D.tray=null;}w.path=route(D.svc,w.ent,dn.station);}}}
 else if(D.state==='eat'||D.state==='menu'){walk(w,dt);walk(D.cook,dt,1);D.sinceServe+=dt;}
 else if(D.state==='pay'){walk(w,dt);if(D.t>1.5&&!D.done){D.done=true;D.fadeOut=true;}if(D.done){D.fade=Math.min(1,D.fade+dt*4);if(D.fade>=1){finish();return;}}}
 if(D.fade>0&&!D.fadeOut)D.fade=Math.max(0,D.fade-dt*3.2);
 // dishes: flying from the tray to the table, being dragged, being eaten, an empty plate fading
 for(const m of D.items){
  if(m.state==='fly'){m.t+=dt/.4;const k=ease(m.t),h=m.home;m.pos.set(mix(m.from.x,h.x,k),mix(m.from.y,h.y,k)+.12*4*k*(1-k),mix(m.from.z,h.z,k));m.scale=mix(.8,1,k);if(m.t>=1){m.state='table';m.pos.copy(h);m.scale=1;sound('plate');}}
  else if(m.state==='held'){const tg=m.target,f=m.vel;f.x+=((tg.x-m.pos.x)*170-f.x*21)*dt;f.y+=((tg.y-m.pos.y)*170-f.y*21)*dt;f.z+=((tg.z-m.pos.z)*170-f.z*21)*dt;m.pos.addScaledVector(f,dt);m.scale=mix(m.scale,1.14,1-Math.exp(-dt*12));}
  else if(m.state==='table'){m.pos.lerp(m.home,1-Math.exp(-dt*14));m.scale=mix(m.scale,1,1-Math.exp(-dt*12));m.tilt=mix(m.tilt||0,0,1-Math.exp(-dt*10));}
  else if(m.state==='mouth'){const was=m.t;m.t+=dt/(m.it.drink?1.25:.22);if(m.it.drink){/* V6.6: two gulps while the glass empties */for(const g of[.3,.62])if(was<g&&m.t>=g)sound('gulp');/* V7.9: the lip of the cup, the neck of the bottle or the tip of the straw goes to the lips (lipBase) and stays on them as the head goes back */const V=vessel(m),k=ease(m.t/.18);m.tilt=Math.max(V.tilt*bump(m.t,.1,.3,.8,.98),(m.tilt0||0)*(1-ease(m.t/.15)));m.scale=mix(m.scale||1,1,1-Math.exp(-dt*10));m.pos.lerpVectors(m.from,lipBase(m,V,D.lips||D.mouth),k);const L=m.mesh.userData.liquid;if(L)L.scale.y=m.liquid0*Math.max(.04,1-ease((m.t-.25)/.55));}else{const k=ease(m.t);m.pos.lerpVectors(m.from,m.to,k);m.scale=mix(1.14,.35,k);}
   if(m.t>=1){swallow(m);}}
  else if(m.state==='wait'){/* V7.9: a second dish waits by the chin, in the other hand, while the first one is at the mouth */const L=D.mouth;if(L){const sx=m.hand==='L'?-1:1,yw=D.seat.yaw;m.wait=m.wait||new T.Vector3();m.wait.set(L.x+Math.cos(yw)*.17*sx+Math.sin(yw)*.13,L.y-.13,L.z-Math.sin(yw)*.17*sx+Math.cos(yw)*.13);m.pos.lerp(m.wait,1-Math.exp(-dt*9));}if(m.it.drink)m.tilt=mix(m.tilt||0,.15,1-Math.exp(-dt*8));if(!D.items.some(o=>o!==m&&o.state==='mouth'))toMouth(m);}
  else if(m.state==='empty'){m.t+=dt;m.pos.lerp(m.home,1-Math.exp(-dt*9));m.tilt=mix(m.tilt||0,0,1-Math.exp(-dt*9));m.scale=m.t<2?1:Math.max(0,1-(m.t-2)/.4);if(m.t>=2.4){m.state='gone';m.mesh?.parent?.remove(m.mesh);m.mesh=null;}}
 }
 if(D.bite){D.bite.t+=dt;if(D.bite.t>(D.bite.dur||1.3))D.bite=null;}
 for(const p of D.pops)p.t+=dt;D.pops=D.pops.filter(p=>p.t<1.3);
 Menu()?.frame(dt);drawUi();
}
// The dishes of the order stand on the waiter's tray.
function loadTray(){
 const T=root.THREE,env=ctx.scene?.environment;if(!T||!env)return;const tray=new T.Group(),disc=new T.Mesh(new T.CylinderGeometry(.27,.27,.014,26),new T.MeshStandardMaterial({color:D.place.kind==='steak'?'#c9ced1':D.place.kind==='italian'?'#8a5a34':'#7a4a2a',roughness:.4,metalness:D.place.kind==='steak'?.6:0}));tray.add(disc);env.add(tray);D.tray=tray;
 D.pending.forEach((it,i)=>{const slot=slotFor(it),mesh=Food().build(it.dish),n=D.pending.length,r=n===1?0:.13+.02*n,a=i/n*TAU;
  // a dish that cannot find a place on the table stays in the kitchen (the menu does not let this happen)
  if(slot<0){return;}const h=at(D.seat,SLOTS[slot][0],TOP,SLOTS[slot][1]);
  const m={it,mesh,slot,state:'tray',t:0,pos:new T.Vector3(),vel:new T.Vector3(),home:new T.Vector3(h.x,h.y,h.z),target:new T.Vector3(),scale:.8,tilt:0,off:[Math.cos(a)*r,Math.sin(a)*r],liquid0:mesh.userData.liquid?mesh.userData.liquid.scale.y:1};
  mesh.rotation.order='YXZ';env.add(mesh);D.items.push(m);});
 D.pending=[];
}
// V7.9: a dish starts for the mouth (when it is let go at the mouth, or when it has waited by the chin)
function toMouth(m){const T=root.THREE;m.state='mouth';m.t=0;m.from=m.pos.clone();m.tilt0=m.tilt||0;m.to=new T.Vector3(D.mouth.x,D.mouth.y-(m.it.drink?m.mesh.userData.height*.75:.02),D.mouth.z);if(m.it.drink){m.to.x+=Math.sin(D.seat.yaw)*.07;m.to.z+=Math.cos(D.seat.yaw)*.07;}}
// V7.9: the hand that can take the next dish: the right one, or the left one while the right is busy (holding a dish,
// at the mouth, or putting an empty plate back); none when both are busy
function freeHand(){if(!D)return null;const busy=s=>D.items.some(m=>m.hand===s&&(m.state==='held'||m.state==='wait'||m.state==='mouth'||(m.state==='empty'&&m.t<.4)));return!busy('R')?'R':!busy('L')?'L':null;}
function swallow(m){
 const sim=D.sim,sv=Eat()?.survival(sim),it=m.it;if(sv){sv.hunger=clamp(sv.hunger+it.hunger,0,100);sv.thirst=clamp(sv.thirst+it.thirst,0,100);if(sv.hunger>0&&sv.thirst>0){sv.empty=0;sv.strikes=0;}sim.dirty=true;}
 for(const f of m.mesh.userData.food)if(f!==m.mesh.userData.liquid)f.visible=false;if(m.mesh.userData.liquid)m.mesh.userData.liquid.visible=false;
 /* V6.6: a main course, a pizza or a pasta is a big bite (a longer chew); the gulps of a drink are heard while it empties */
 const big=!it.drink&&['main','pizza','pasta'].includes(it.cat);m.state='empty';m.t=0;m.scale=1;D.ate++;D.bite={t:0,drink:!!it.drink,dur:it.drink?1.45:big?2.05:1.3};if(!it.drink)sound(big?'chewBig':'chew');
 D.pops.push({t:0,text:(it.hunger?'+'+it.hunger+' hunger':'')+(it.hunger&&it.thirst?'  ':'')+(it.thirst?'+'+it.thirst+' thirst':''),big:['Mmm!','Yum!','Delicious!','So good!','Tasty!'][D.ate%5]});
}
// ---- what the game draws while you are at the table (and the guests and staff at any time) -----------------
function view(sim){
 const v=Object.create(sim),q=D.seat,p=sim.player;let x=q.x,y=q.y,z=q.z,yaw=q.yaw,mode='sitting',speed=0;
 if(D.state==='sit'){const k=ease(D.t/.6);x=mix(D.from.x,q.x,k);z=mix(D.from.z,q.z,k);let dy=q.yaw-D.from.yaw;while(dy>PI)dy-=TAU;while(dy<-PI)dy+=TAU;yaw=D.from.yaw+dy*k;if(D.t<.5){mode='idle';speed=1.2;y=mix(D.from.y,q.y,k);}else y=q.y+.26*(1-ease((D.t-.5)/.4));}
 else if(D.state==='pay'&&D.t>.9){const k=ease((D.t-.9)/.55);mode=k>.5?'idle':'sitting';y=q.y+(k<=.5?.26*ease(k*2):0);x=mix(q.x,q.stand.x,ease((k-.4)/.6));z=mix(q.z,q.stand.z,ease((k-.4)/.6));}
 v.time=(sim.time||0)+D.clock;v.player={...p,x,y,z,yaw,vx:0,vy:0,vz:0,speed,grounded:true,weapon:'holstered',aiming:false,reload:null,eatT:undefined,animation:{mode,speed}};delete v.player.eatT;delete v.player.pose;
 v.npcs=[...(sim.npcs||[]),...ambient(sim)];if(D.cam)v.menuCamera={position:D.cam.pos,target:D.cam.tgt,fov:D.cam.fov};
 return v;
}
function wrap(base,sim,screen){
 if(!doc||!sim||sim.onlineRoom||!sim.world?.services)return base;
 // Another screen over the meal (the pause menu, settings) does not end it: when that screen closes you are back at
 // the table. Leaving the City altogether settles the bill.
 if(D&&(D.sim!==sim||screen==='title'||screen==='defeated'))abort(D.sim);
 if(D&&screen==='play'&&!D.back){D.back=true;setTimeout(()=>{if(D){D.back=false;ctx.setScreen('dining');}},0);}
 if(D)return view(sim);
 const extra=ambient(sim);if(!extra.length)return base;const v=Object.create(base);v.npcs=[...(base.npcs||base.people||[]),...extra];return v;
}
// The plates in front of the guests, and the dishes of your own meal.
function draw(scene){
 const T=root.THREE,env=scene.environment,sim=root.PlatdoCity?.sim;if(!T||!env||!sim||sim.onlineRoom||!Food())return;const p=sim.player;
 for(const R of rooms.values()){const close=Math.hypot(p.x-R.svc.x,p.z-R.svc.z)<70;
  if(close&&!R.group){R.group=new T.Group();R.centres=new Map();R.svc.dining.tables.forEach((t,i)=>{if(t.kind==='booth')return;const g=Food().build(['centre-'+R.place.kind]);g.position.set(t.x,R.svc.y+(R.place.kind==='diner'?.772:.786),t.z);R.group.add(g);R.centres.set(i,g);});env.add(R.group);}
  if(R.group){/* V8.5: only from close by */R.group.visible=close&&Math.hypot(p.x-R.svc.x,p.z-R.svc.z)<32&&(root.CityInside?.isLoaded(scene,'service:'+R.svc.id)??true)/* V11.3: not before the tables are built */;for(const[i,g]of R.centres)g.visible=!(D&&D.svc===R.svc&&D.ti===i);
   /* V6.6: a party's dishes come with the waiter, are left empty when the party goes, and are gone once the table is cleared */
   for(const P of R.parties){
    if(P.served&&!P.cleared&&!P.group){P.group=new T.Group();for(const m of P.members)for(const[spec,slot]of m.dishes){const g=Food().build(spec),h=at(m.seat,SLOTS[slot][0],TOP,SLOTS[slot][1]);g.position.set(h.x,h.y,h.z);g.rotation.y=m.seat.yaw;P.group.add(g);}R.group.add(P.group);}
    if(P.group&&P.dirty&&!P.emptied){P.emptied=true;for(const g of P.group.children)for(const part of g.userData.food||[])part.visible=false;}
    if(P.group&&P.cleared){R.group.remove(P.group);P.group=null;}}
   /* the tray the second waiter carries from the pass */
   for(const s of[R.server,R.waiter]){
    if(s.carry&&!s.tray){trayMat=trayMat||new T.MeshStandardMaterial({color:'#7a4a2a',roughness:.45});trayGeo=trayGeo||new T.CylinderGeometry(.27,.27,.014,26);s.tray=new T.Group();s.tray.add(new T.Mesh(trayGeo,trayMat));const ds=s.carry.members.flatMap(m=>m.dishes).slice(0,4);ds.forEach(([spec],i)=>{const g=Food().build(spec),a=i/ds.length*TAU,rr=ds.length>1?.14:0;g.position.set(Math.cos(a)*rr,.008,Math.sin(a)*rr);g.scale.setScalar(.8);s.tray.add(g);});R.group.add(s.tray);}
    if(s.tray&&!s.carry){R.group.remove(s.tray);s.tray=null;}
    if(s.tray){const e=s.ent;s.tray.position.set(e.x+Math.sin(e.yaw)*.36,(e.y||R.svc.y)+1.16,e.z+Math.cos(e.yaw)*.36);s.tray.rotation.y=e.yaw;}
    /* V6.8: a DingDash bag on its way to the rack */
    if(s.bag&&!s.bagMesh){s.bagMesh=new T.Group();const box=new T.Mesh(new T.BoxGeometry(.26,.3,.15),new T.MeshLambertMaterial({color:0xc79f63})),tex=root.CityDelivery?.receipt?.(T),mark=new T.Mesh(new T.PlaneGeometry(.2,.3),new T.MeshBasicMaterial(tex?{map:tex}:{color:0xfffdf6}));box.position.y=.15;mark.position.set(0,.165,.0762);s.bagMesh.add(box,mark);R.group.add(s.bagMesh);}
    if(s.bagMesh&&!s.bag){R.group.remove(s.bagMesh);s.bagMesh=null;}
    if(s.bagMesh){const e=s.ent;s.bagMesh.position.set(e.x+Math.sin(e.yaw)*.34,(e.y||R.svc.y)+.98,e.z+Math.cos(e.yaw)*.34);s.bagMesh.rotation.y=e.yaw;}}}}
 if(!D)return;
 for(const m of D.items){if(!m.mesh)continue;m.mesh.position.copy(m.pos);m.mesh.rotation.set(-(m.tilt||0),D.seat.yaw,0);m.mesh.scale.setScalar(m.scale);}
}
// V6.6: how the right hand takes hold of a dish. A glass, a cup of fries or a small bowl is wrapped: the palm against
// its side, the fingers round the far side, the thumb on top. A plate, a board or a pizza is held by its rim: the
// fingers flat underneath, the thumb over the edge. It is worked out in the dish's own frame (x to the sitter's
// right, y up, z ahead; the frame leans with a glass as it is tipped to drink) and comes back as a wrist position
// in the world and two directions in the model's frame, which is the seat's frame: the sitter faces the table.
function grip(m,side){
 const u=m.mesh.userData,g=u.grip||(u.drink||u.radius<=.075?{kind:'wrap',r:Math.min(.038,u.radius*.8),y:Math.min(u.height*.45,.09)}:{kind:'rim',r:u.radius*1.08,y:.014}),s=m.scale||1,t=m.tilt||0,ct=Math.cos(t),st=Math.sin(t);
 const lean=p=>[p[0],p[1]*ct+p[2]*st,-p[1]*st+p[2]*ct];let wrist,fingers,palm,curl,thumb;
 /* (V7.9: the left hand holds the mirror image) */const sx=side==='L'?-1:1;if(g.kind==='wrap'){const h=[.8*sx,0,-.6],F=[.6*sx,.14,.8],R=g.r*s+.017;wrist=[h[0]*R-F[0]*.06,g.y*s-F[1]*.06,h[2]*R-F[2]*.06];fingers=F;palm=[-h[0],0,-h[2]];curl=clamp(1.3-g.r*9,.75,1.5);thumb=.5;}
 else{const h=[.82*sx,0,-.57],R=g.r*s+.03;wrist=[h[0]*R,-.018,h[2]*R];fingers=[-h[0],.04,-h[2]];palm=[0,1,0];curl=-.3;thumb=.62;}
 const w=lean(wrist);return{wrist:at({x:m.pos.x,y:m.pos.y,z:m.pos.z,yaw:D.seat.yaw},w[0],w[1],w[2]),fingers:lean(fingers),palm:lean(palm),curl,thumb};
}
// V7.9: the part of a drink that goes to the lips, in its own frame ([x, y, z, how far it tips]): the rim nearest the
// face for a mug or a cup, the neck of a bottle, the tip of the straw for a glass or a shake.
function vessel(m){const u=m.mesh?.userData||{},l=u.lip||[0,u.height||.1,-(u.radius||.04)*.8,.9];return{p:l,tilt:l[3]||.9};}
// Where a drink must stand for its lip to be at L at its present tilt and size (the mesh turns by the seat's yaw, then
// tips by -tilt about its x axis).
function lipBase(m,V,L){const T=root.THREE,t=m.tilt||0,s=m.scale||1,[px,py,pz]=V.p,ct=Math.cos(t),st=Math.sin(t),ox=px*s,oy=(py*ct+pz*st)*s,oz=(-py*st+pz*ct)*s,yw=D.seat.yaw,rt=[Math.cos(yw),-Math.sin(yw)],fw=[Math.sin(yw),Math.cos(yw)];return new T.Vector3(L.x-rt[0]*ox-fw[0]*oz,L.y-oy,L.z-rt[1]*ox-fw[1]*oz);}
// The fingers go back to how the game leaves them.
function relax(){const r=ctx?.scene?.playerMesh?.userData?.rig;if(!r)return;for(const s of['L','R']){for(const f of r['fingers'+s]||[])f.rotation.x=-.22;r['thumb'+s]?.rotation.set(0,0,0);}}
// After the game has posed everybody: hands on the table, the hand that follows the dish, the bite, the waiter's
// pad and tray, the cook at the stove.
function pose(scene,sim,dt){
 const T=root.THREE,P=PMo();if(!T||!P?.aimArm)return;const rec=id=>scene.meshes?.people?.get(id)?.mesh,v=new T.Vector3();
 /* V6.6: the second waiter holds the tray with both hands */
 for(const R of rooms.values())for(const s of[R.server,R.waiter]){if(!s?.carry&&!s?.bag)continue;const wm=rec(s.ent.id),we=s.ent;if(!wm)continue;wm.updateWorldMatrix(true,true);const fw=[Math.sin(we.yaw),Math.cos(we.yaw)],rt=[Math.cos(we.yaw),-Math.sin(we.yaw)],pt=(r2,u,f)=>new T.Vector3(we.x+rt[0]*r2+fw[0]*f,(we.y||0)+u,we.z+rt[1]*r2+fw[1]*f);P.aimArm(wm,'L',pt(-.2,1.14,.34),null);P.aimArm(wm,'R',pt(.2,1.14,.34),null);}
 if(!D)return;const q=D.seat;
 const me=scene.playerMesh,r=me?.userData?.rig;
 if(me&&r&&D.state!=='sit'&&!(D.state==='pay'&&D.t>.9)){
  me.updateWorldMatrix(true,true);/* V7.9: each hand has its own dish */const inHand=s=>D.items.find(m=>m.mesh&&m.hand===s&&(m.state==='held'||m.state==='wait'||m.state==='mouth'))||D.items.find(m=>m.mesh&&m.hand===s&&m.state==='empty'&&m.t<.4),rest=s=>at(q,s*.2,.83,.4),b=D.bite;
  const hand=(side,pt)=>P.aimArm(me,side,v.set(pt.x,pt.y,pt.z).clone(),null);
  const close=(side,curl,thumb)=>{for(const f of r['fingers'+side]||[])f.rotation.x=curl;const th=r['thumb'+side];if(th)th.rotation.set(thumb,0,0);};
  /* V6.6: the right hand takes hold of the dish (see grip): the wrist goes where the hold puts it, the hand is turned
   * to it, and the fingers close over a tenth of a second. Both hands otherwise lie flat on the table. */
  for(const s of['R','L']){const it=inHand(s),sx=s==='R'?1:-1,key='grip'+s;D[key]=mix(D[key]||0,it?1:0,1-Math.exp(-(dt||.016)*18));
   if(it){const G=grip(it,s);hand(s,G.wrist);P.orientHand?.(me,s,G.fingers,G.palm);close(s,mix(.25,G.curl,D[key]),mix(.2,G.thumb,D[key]));}
   else{hand(s,rest(sx));P.orientHand?.(me,s,[.12*sx,-.16,1],[0,-1,.1]);close(s,mix(.25,.8,D[key]),.2);}}
  // the head: toward what is in the hand or who is speaking, then the bite or the drink
  let hx=0,hy=0;if(D.held&&D.held.state==='held'){hx=-.12;}
  /* V7.9: looking at the waiter means at the waiter's face: the turn is worked out in the frame the head turns in (before, it was a fixed turn, to the wrong side) */
  D.lookK=mix(D.lookK||0,['take','approach','serve'].includes(D.state)?1:0,1-Math.exp(-(dt||.016)*6));if(D.lookK>.002&&r.head.parent){const we=D.waiter.ent,tg=new T.Vector3(we.x,(we.y??q.y)+1.6,we.z);r.head.parent.updateWorldMatrix(true,false);const lp=r.head.parent.worldToLocal(tg).sub(r.head.position),yaw=clamp(Math.atan2(lp.x,lp.z),-1.25,1.25),pitch=clamp(-Math.atan2(lp.y-.12,Math.hypot(lp.x,lp.z)),-.5,.35);r.head.rotation.y=mix(r.head.rotation.y,yaw,D.lookK);r.head.rotation.x=mix(r.head.rotation.x,pitch,D.lookK);}
  /* V7.9: the head goes back as the cup or bottle tips, not after it */const sip=D.items.find(m=>m.state==='mouth'&&m.it.drink&&m.mesh);if(sip){const V=vessel(sip);hx-=(V.tilt>1?.4:V.tilt>.6?.28:.06)*clamp((sip.tilt||0)/V.tilt,0,1);}
  if(b){const bt=b.drink?b.t:b.t*1.3/(b.dur||1.3);if(b.drink){/* (V7.9: the head went back while drinking; now only a small swallow) */hx+=.05*bump(b.t,0,.08,.2,.35);}else{hx+=.3*bump(bt,0,.08,.14,.3)+.11*Math.sin(b.t*27)*bump(bt,.15,.25,.95,1.2);r.spine.rotation.x+=.16*bump(bt,0,.1,.2,.4);r.spine.rotation.z+=.07*Math.sin(b.t*13)*bump(bt,.7,.85,1.15,1.3);}}
  r.head.rotation.x+=hx;r.head.rotation.y+=hy;me.updateWorldMatrix(true,true);
  // where the mouth is, for the drag
  const hp=r.head.getWorldPosition(v);D.mouth={x:hp.x+Math.sin(q.yaw)*.1,y:hp.y+.045,z:hp.z+Math.cos(q.yaw)*.1};/* V7.9: the lips themselves, on the head as it is turned (head frame: y up from the chin line, z out of the face) */D.lips=r.head.localToWorld(new T.Vector3(0,.042,.087));
 }
 const wm=rec(D.waiter.ent.id),we=D.waiter.ent;
 if(wm){wm.updateWorldMatrix(true,true);const fw=[Math.sin(we.yaw),Math.cos(we.yaw)],rt=[Math.cos(we.yaw),-Math.sin(we.yaw)],pt=(r2,u,f)=>new T.Vector3(we.x+rt[0]*r2+fw[0]*f,we.y+u,we.z+rt[1]*r2+fw[1]*f);
  if(D.state==='take'){const writing=D.t>.3&&D.t<2.5,wob=writing?Math.sin(D.t*17)*.02:0;P.aimArm(wm,'L',pt(-.1,1.12,.3),null);P.aimArm(wm,'R',pt(.04+wob,1.14+wob*.5,.3),null);
   if(!D.pad){D.pad=new T.Mesh(new T.BoxGeometry(.1,.14,.012),new T.MeshStandardMaterial({color:'#fbf7ea',roughness:.9}));scene.environment.add(D.pad);}const c=pt(-.06,1.13,.33);D.pad.position.copy(c);D.pad.rotation.set(-.9,we.yaw,0,'YXZ');D.pad.visible=true;
   if(D.acked&&wm.userData.rig)wm.userData.rig.head.rotation.x+=.22*Math.max(0,Math.sin((D.t-2.3)*9));}
  else if(D.pad)D.pad.visible=false;
  if(D.tray){const c=pt(0,1.16,.36);P.aimArm(wm,'L',pt(-.2,1.14,.34),null);P.aimArm(wm,'R',pt(.2,1.14,.34),null);D.tray.position.copy(c);D.tray.rotation.y=we.yaw;
   for(const m of D.items)if(m.state==='tray'){m.pos.set(c.x+rt[0]*m.off[0]+fw[0]*m.off[1],c.y+.008,c.z+rt[1]*m.off[0]+fw[1]*m.off[1]);}}
 }
 const cm=rec(D.cook.ent.id),ce=D.cook.ent;
 if(cm&&D.state==='cook'&&!D.cook.path?.length){cm.updateWorldMatrix(true,true);const fw=[Math.sin(ce.yaw),Math.cos(ce.yaw)],rt=[Math.cos(ce.yaw),-Math.sin(ce.yaw)],a=D.t*9,pt=(r2,u,f)=>new T.Vector3(ce.x+rt[0]*r2+fw[0]*f,ce.y+u,ce.z+rt[1]*r2+fw[1]*f);
  P.aimArm(cm,'R',pt(.16+Math.cos(a)*.07,1.08+(D.plating?Math.abs(Math.sin(a*.6))*.08:0),.42+Math.sin(a)*.07),null);P.aimArm(cm,'L',pt(-.2,1.02,.38),null);}
}
// ---- the page over the game: buttons, speech, the mouth ring, numbers ----------------------------------------
const CSS=`#dineUi{position:absolute;inset:0;z-index:30;font-family:"Segoe UI",system-ui,sans-serif;color:#fff;user-select:none;-webkit-user-select:none;touch-action:none;overflow:hidden}
#dineUi .dn-fade{position:absolute;inset:0;background:#000;pointer-events:none;opacity:0}
#dineUi .dn-bars i{position:absolute;left:0;right:0;height:7vh;background:#000;transition:transform .5s ease;pointer-events:none}#dineUi .dn-bars i:first-child{top:0;transform:translateY(-100%)}#dineUi .dn-bars i:last-child{bottom:0;transform:translateY(100%)}#dineUi.dn-film .dn-bars i{transform:none}
#dineUi .dn-top{position:absolute;left:18px;top:16px;display:flex;gap:10px;align-items:center;transition:opacity .3s}
#dineUi button.dn-btn{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:9px;height:46px;padding:0 16px 0 12px;border-radius:23px;background:#141a1dcc;border:1px solid #ffffff38;font-weight:650;font-size:15px;backdrop-filter:blur(8px);box-shadow:0 6px 18px #0005;transition:transform .12s,background .15s}
#dineUi button.dn-btn:hover{background:#232c31e6;transform:translateY(-1px)}#dineUi button.dn-btn:active{transform:scale(.96)}#dineUi button.dn-btn svg{width:22px;height:22px;flex:none}
#dineUi .dn-x{background:#7a1f1ccc!important}#dineUi .dn-x:hover{background:#9a2a26e6!important}
#dineUi .dn-right{position:absolute;right:18px;top:16px;display:flex;gap:10px;align-items:center;padding:8px 14px;border-radius:23px;background:#141a1dcc;border:1px solid #ffffff38;font-size:14px;font-weight:600;backdrop-filter:blur(8px)}
#dineUi .dn-meter{display:flex;align-items:center;gap:6px}#dineUi .dn-meter b{display:block;width:74px;height:8px;border-radius:4px;background:#ffffff26;overflow:hidden}#dineUi .dn-meter b i{display:block;height:100%;border-radius:4px;transition:width .5s ease,background .5s}
#dineUi .dn-hint{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);padding:9px 18px;border-radius:20px;background:#141a1db8;font-size:15px;font-weight:600;white-space:nowrap;pointer-events:none;transition:opacity .4s}
#dineUi .dn-say{position:absolute;max-width:340px;padding:13px 18px;border-radius:18px;background:#fffdf6;color:#2a2019;font-size:16px;line-height:1.35;font-weight:600;box-shadow:0 10px 30px #0006;white-space:pre-line;pointer-events:none;transform:translate(-50%,-100%);transition:opacity .2s}
#dineUi .dn-say:after{content:"";position:absolute;left:50%;bottom:-9px;margin-left:-9px;border:9px solid transparent;border-top-color:#fffdf6;border-bottom:0}
#dineUi .dn-say small{display:block;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#8a6a4a;margin-bottom:3px}
#dineUi .dn-ring{position:absolute;width:10px;height:10px;margin:-5px;border-radius:50%;border:3px dashed #ffffffb0;pointer-events:none;opacity:0;transition:opacity .2s,border-color .15s,box-shadow .15s}#dineUi .dn-ring.on{opacity:1}#dineUi .dn-ring.hot{border-color:#ffe08a;border-style:solid;box-shadow:0 0 0 6px #ffe08a40,0 0 26px #ffe08a}
#dineUi .dn-tip{position:absolute;padding:8px 12px;border-radius:12px;background:#141a1de6;border:1px solid #ffffff30;font-size:13.5px;line-height:1.3;pointer-events:none;transform:translate(-50%,-125%);white-space:nowrap;opacity:0;transition:opacity .15s}#dineUi .dn-tip b{font-size:15px}#dineUi .dn-tip span{color:#bfe8c8}
#dineUi .dn-pop{position:absolute;pointer-events:none;transform:translate(-50%,-50%);text-align:center;font-weight:800;text-shadow:0 2px 8px #000a;white-space:nowrap}#dineUi .dn-pop b{display:block;font-size:clamp(30px,5.4vh,60px);color:#ffe08a}#dineUi .dn-pop span{font-size:clamp(15px,2.4vh,26px);color:#bfe8c8}
#dineUi .dn-cook{position:absolute;left:50%;bottom:12vh;transform:translateX(-50%);min-width:260px;padding:14px 18px;border-radius:14px;background:#fffdf6;color:#2a2019;box-shadow:0 10px 30px #0006;font-size:15px;font-weight:600;pointer-events:none}#dineUi .dn-cook small{display:block;font-size:11px;letter-spacing:2px;color:#8a6a4a;margin-bottom:6px}#dineUi .dn-cook div{display:flex;gap:8px;align-items:center;opacity:.45;transition:opacity .3s}#dineUi .dn-cook div.ok{opacity:1}#dineUi .dn-cook div i{width:14px;height:14px;border-radius:50%;border:2px solid #8a6a4a;flex:none}#dineUi .dn-cook div.ok i{background:#3d8a3a;border-color:#3d8a3a}
#dineUi.dn-grab{cursor:grab}#dineUi.dn-grabbing{cursor:grabbing}`;
function ensureUi(){
 if(ui&&ui.root.isConnected)return ui;const host=ctx?.overlay||doc.getElementById('cityRoot')||doc.body;if(!doc.getElementById('dineCss')){const s=doc.createElement('style');s.id='dineCss';s.textContent=CSS;doc.head.append(s);}
 const el=doc.createElement('div');el.id='dineUi';
 el.innerHTML=`<div class="dn-bars"><i></i><i></i></div><div class="dn-top"><button class="dn-btn dn-x" data-dn="leave" aria-label="Leave and pay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg><span data-dn-leave>Leave</span></button><button class="dn-btn" data-dn="menu" aria-label="Open the menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 5h7v15H4zM13 5h7v15h-7zM6.500 9h2.500M6.500 12h2.500M15 9h2.500M15 12h2.500"/></svg><span>Menu</span></button></div>
 <div class="dn-right"><span data-dn-wallet></span><span class="dn-meter" title="Hunger">\u{1F357}<b><i data-dn-hunger></i></b></span><span class="dn-meter" title="Thirst">\u{1F4A7}<b><i data-dn-thirst></i></b></span></div>
 <div class="dn-hint"></div><div class="dn-cook" hidden></div><div class="dn-say" hidden></div><div class="dn-ring"></div><div class="dn-tip"></div><div class="dn-pops"></div><div data-dn-menu></div><div class="dn-fade"></div>`;
 host.append(el);ui={root:el,q:s=>el.querySelector(s)};
 el.addEventListener('click',e=>{const b=e.target.closest('[data-dn]');if(!b||!D)return;e.stopPropagation();if(b.dataset.dn==='leave')leave();else if(b.dataset.dn==='menu')openMenu();});
 el.addEventListener('pointerdown',e=>{if(D&&!['eat','menu','pay'].includes(D.state)){D.fast=true;return;}if(!D||D.state!=='eat'||e.target.closest('button')||D.held)return;/* V7.9: while one hand is busy the other one takes the next dish, so you can eat and drink faster */const hand=freeHand(),m=hand&&pickAt(e.clientX,e.clientY);D.pointer={x:e.clientX,y:e.clientY,has:true};if(!m)return;e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(err){}D.held=m;m.hand=hand;m.state='held';m.vel.set(0,0,0);aim(m,e.clientX,e.clientY);sound('lift');});
 el.addEventListener('pointermove',e=>{if(!D)return;D.pointer={x:e.clientX,y:e.clientY,has:true};if(D.held)aim(D.held,e.clientX,e.clientY);});
 const drop=e=>{if(D)D.fast=false;if(!D||!D.held)return;const m=D.held;D.held=null;try{el.releasePointerCapture(e.pointerId);}catch(err){}const z=mouthZone();
  if(z&&Math.hypot(e.clientX-z.x,e.clientY-z.y)<z.r*1.25&&D.mouth){/* V7.9: if the other hand has something at the mouth, this one waits by the chin */if(D.items.some(o=>o!==m&&o.state==='mouth'))m.state='wait';else toMouth(m);}
  else{m.state='table';sound('plate');}};
 el.addEventListener('pointerup',drop);el.addEventListener('pointercancel',drop);
 return ui;
}
function removeUi(){Menu()?.close();if(ui){ui.root.remove();ui=null;}}
// Screen position of a point in the world, in page pixels.
function screenOf(pt){const sc=ctx?.scene,T=root.THREE;if(!sc?.camera||!T)return null;const cv=sc.canvas||sc.renderer?.domElement,rect=cv.getBoundingClientRect(),v=new T.Vector3(pt.x,pt.y,pt.z).project(sc.camera);if(v.z>1)return null;return{x:rect.left+(v.x*.5+.5)*rect.width,y:rect.top+(-v.y*.5+.5)*rect.height,h:rect.height,rect};}
function mouthZone(){if(!D?.mouth)return null;const s=screenOf(D.mouth);return s?{x:s.x,y:s.y,r:s.h*.085}:null;}
function pickAt(x,y){let best=null,bd=1e9;for(const m of D.items){if(m.state!=='table'||!m.mesh)continue;const u=m.mesh.userData,s=screenOf({x:m.pos.x,y:m.pos.y+u.height*.45,z:m.pos.z});if(!s)continue;const cam=ctx.scene.camera,dist=Math.hypot(cam.position.x-m.pos.x,cam.position.y-m.pos.y,cam.position.z-m.pos.z),px=Math.max(u.radius,u.height*.5)/dist*(s.h/2)/Math.tan(cam.fov*PI/360),d=Math.hypot(x-s.x,y-s.y);if(d<Math.max(34,px*1.2)&&d<bd){bd=d;best=m;}}return best;}
// Where a held dish wants to be: under the pointer, on a sheet facing the camera at the depth the dish started at.
function aim(m,x,y){const sc=ctx.scene,T=root.THREE,cam=sc.camera,cv=sc.canvas||sc.renderer.domElement,rect=cv.getBoundingClientRect(),n=cam.getWorldDirection(new T.Vector3()),far=new T.Vector3((x-rect.left)/rect.width*2-1,-((y-rect.top)/rect.height*2-1),.5).unproject(cam),dir=far.sub(cam.position).normalize(),k=m.home.clone().sub(cam.position).dot(n)/Math.max(.05,dir.dot(n));
 m.target.copy(cam.position).addScaledVector(dir,k);/* V6.6: high enough for the fingers under a plate */m.target.y=Math.max(m.home.y+.04,m.target.y+.02);
 const z=mouthZone(),close=z?clamp(1-Math.hypot(x-z.x,y-z.y)/(z.r*4.5),0,1):0;if(close>0&&D.mouth){const u=ease(close)*.72;m.target.x=mix(m.target.x,D.mouth.x,u);m.target.y=mix(m.target.y,D.mouth.y-(m.it.drink?m.mesh.userData.height*.6:.03),u);m.target.z=mix(m.target.z,D.mouth.z,u);}
 if(m.it.drink)m.tilt=close*.75;}
function drawUi(){
 if(!D)return;const U=ensureUi(),sim=D.sim,sv=Eat()?.survival(sim),el=U.root,eat=D.state==='eat',film=['approach','take','leave','cook','return','serve','pay','sit'].includes(D.state);
 el.classList.toggle('dn-film',film);U.q('.dn-fade').style.opacity=D.fade.toFixed(3);
 const top=U.q('.dn-top');top.style.opacity=eat?1:0;top.style.pointerEvents=eat?'auto':'none';U.q('[data-dn-leave]').textContent=D.tab>0?'Leave & Pay \u{B7} '+money(D.tab):'Leave';
 const right=U.q('.dn-right');right.style.opacity=D.state==='menu'||D.state==='cook'?0:1;U.q('[data-dn-wallet]').textContent=money(sim.profile.wallet)+(D.tab?'  \u{B7}  bill '+money(D.tab):'');
 if(sv)for(const k of['hunger','thirst']){const i=U.q('[data-dn-'+k+']'),v=clamp(sv[k],0,100);i.style.width=v+'%';i.style.background=v>60?'#7fd67a':v>35?'#f0d24a':v>15?'#f09a3a':'#e5483f';}
 const hint=U.q('.dn-hint'),left=D.items.filter(m=>m.state==='table'||m.state==='held').length;hint.style.opacity=(eat&&!D.bite)||(film&&D.state!=='sit'&&D.state!=='pay')?1:0;hint.textContent=film?'Hold the mouse button to speed up':left?(D.ate?'Drag a dish to your mouth':'Drag a dish to your mouth to eat it'):D.tab>0?'All done. Open the menu for more, or Leave & Pay.':'Open the menu to order, or leave.';
 // speech
 const say=U.q('.dn-say');if(D.said){const who=D.said.who,head=who==='you'?(D.mouth||at(D.seat,0,1.3,0)):{x:D.waiter.ent.x,y:D.seat.y+1.78,z:D.waiter.ent.z},s=screenOf({x:head.x,y:head.y+(who==='you'?.22:0),z:head.z});if(s){say.hidden=false;say.style.left=clamp(s.x,180,innerWidth-180)+'px';say.style.top=Math.max(90,s.y-14)+'px';say.innerHTML='<small>'+(who==='you'?'Your order':esc(D.place.name))+'</small>'+esc(D.said.text);}}else say.hidden=true;
 // the kitchen ticket
 const cook=U.q('.dn-cook');if(D.state==='cook'&&D.ticket){cook.hidden=false;cook.innerHTML='<small>IN THE KITCHEN</small>'+D.ticket.map((t,i)=>'<div class="'+(i<Math.round((D.pending.length?D.cooked/D.pending.length:1)*D.ticket.length)?'ok':'')+'"><i></i>'+esc(t)+'</div>').join('');}else cook.hidden=true;
 // the mouth ring, the tip under the pointer, the hand
 const ring=U.q('.dn-ring'),z=eat?mouthZone():null,tip=U.q('.dn-tip');let hot=false,over=null;
 if(z&&D.held){ring.classList.add('on');ring.style.left=z.x+'px';ring.style.top=z.y+'px';ring.style.width=ring.style.height=z.r*2+'px';ring.style.margin=-z.r+'px';hot=Math.hypot(D.pointer.x-z.x,D.pointer.y-z.y)<z.r*1.25;}else ring.classList.remove('on');ring.classList.toggle('hot',hot);
 if(eat&&!D.held&&D.pointer.has&&freeHand())over=pickAt(D.pointer.x,D.pointer.y);el.classList.toggle('dn-grab',!!over);el.classList.toggle('dn-grabbing',!!D.held);
 if(over){const it=over.it;tip.style.opacity=1;tip.style.left=D.pointer.x+'px';tip.style.top=D.pointer.y+'px';tip.innerHTML='<b>'+esc(it.name)+'</b><br><span>'+[it.hunger?'+'+it.hunger+' hunger':'',it.thirst?'+'+it.thirst+' thirst':''].filter(Boolean).join(' \u{B7} ')+'</span>';}else tip.style.opacity=0;
 const pops=U.q('.dn-pops'),mz=mouthZone();pops.innerHTML=mz?D.pops.map(p=>'<div class="dn-pop" style="left:'+(mz.x+mz.r*2.3)+'px;top:'+(mz.y-p.t*70)+'px;opacity:'+clamp(1.3-p.t,0,1)*clamp(p.t*8,0,1)+'"><b>'+p.big+'</b><span>'+p.text+'</span></div>').join(''):'';
}
function render(c){ctx=c||ctx;if(!D){c?.setScreen?.('play');return;}ensureUi();const host=ui.q('[data-dn-menu]');Menu()?.mount(host);if(D.state==='menu')Menu()?.open(menuApi());drawUi();}
const state=()=>D?{state:D.state,t:D.t,tab:D.tab,items:D.items.map(m=>({id:m.it.id,state:m.state,slot:m.slot})),cart:{...D.cart},shot:D.shot,place:D.place.id}:null;
root.CityDiningPlay={seatNear,sit,begin,tick,wrap,draw,pose,render,leave,openMenu,placeOrder,chose,state,rooms,route,rackJob,_d:()=>D};
})(typeof globalThis!=='undefined'?globalThis:this);
