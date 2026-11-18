// Original city art. Every solid structure uses an existing collision footprint.
// Bake once per world; draw only visible 400px tiles. No per-frame texture work.
import {W,H,TAU} from './config.js';
import {roadsX,roadsY} from './geometry.js';
import {rng} from './random.js';

const roofs=['#edddba','#d88967','#9fb9a0','#f1e5ca','#bb7057','#78a89c'];
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h);}
function line(c,color,width,points){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function ellipse(c,color,x,y,rx,ry){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
export function palm(c,x,y,size=1){
  c.save();c.translate(x,y);c.scale(size,size);
  ellipse(c,'#243f3830',13,10,23,7);
  line(c,'#806445',5,[[0,6],[-3,-8],[2,-28]]);
  line(c,'#bd9664',2,[[-2,5],[-5,-9],[0,-27]]);
  for(let i=0;i<7;i++){
    const a=i*TAU/7+.2,dx=Math.cos(a),dy=Math.sin(a);
    c.fillStyle=i%2?'#3d7858':'#579267';c.beginPath();c.moveTo(2,-28);
    c.quadraticCurveTo(2+dx*22-dy*9,-28+dy*20+dx*8,2+dx*32,-24+dy*28);
    c.quadraticCurveTo(2+dx*16+dy*3,-28+dy*14-dx*3,2,-28);c.fill();
    line(c,'#a8b779',.7,[[2,-28],[2+dx*21,-27+dy*20]]);
  }c.restore();
}
function awning(c,x,y,w,color){
  rect(c,'#263e3e30',x+4,y+5,w,19);
  rect(c,color,x,y,w,14);
  for(let i=3;i<w-3;i+=12)rect(c,'#f6e7c5',x+i,y,5,14);
  rect(c,'#314e483c',x,y+11,w,4);
  for(let i=0;i<w;i+=12){c.fillStyle=color;c.beginPath();c.arc(x+i+6,y+14,6,0,Math.PI);c.fill();}
}
function building(c,b,i,safe){
  const {x,y,w,h}=b,depth=14+b.height*.15;
  // A low axonometric extrusion is contained inside the collision footprint.
  c.fillStyle='#193e3730';c.beginPath();c.moveTo(x,y);c.lineTo(x+w+15,y+20);c.lineTo(x+w+15,y+h+20);c.lineTo(x+15,y+h+20);c.closePath();c.fill();
  rect(c,'#9b8466',x,y,w,h);rect(c,'#bea684',x,y+h-depth,w,depth);
  rect(c,'#688b7b',x+w-7,y,7,h);
  const roof=safe?'#a4c5b1':roofs[i%roofs.length];
  rect(c,roof,x,y,w-6,h-depth);
  rect(c,'#fff0cf',x,y,w-6,4);rect(c,'#f4e4bd',x,y,4,h-depth);
  rect(c,'#7d816c',x+5,y+h-depth-5,w-11,5);
  rect(c,'#b5a586',x+w-11,y+4,5,h-depth-8);
  // Three roof families: terracotta tile, terrace with pergola, and service roof.
  if(i%3===1){
    for(let yy=y+9;yy<y+h-depth-7;yy+=8)line(c,'#9c584443',1,[[x+7,yy],[x+w-14,yy]]);
    for(let xx=x+13;xx<x+w-15;xx+=16)line(c,'#f6b68a70',1,[[xx,y+7],[xx,y+h-depth-7]]);
    rect(c,'#f1bb8b',x+w*.48,y+5,5,h-depth-10);
  }else if(i%3===0){
    rect(c,'#baa585',x+12,y+13,w*.45,h*.36);
    for(let xx=x+13;xx<x+w*.52;xx+=9)rect(c,'#f6e7c2',xx,y+12,4,h*.37);
    ellipse(c,'#698d68',x+w-28,y+23,11,9);ellipse(c,'#b6bc7d',x+w-31,y+20,6,5);
    rect(c,'#7b9e95',x+20,y+h*.52,33,16);rect(c,'#d9d5b8',x+22,y+h*.52+2,29,4);
  }else{
    rect(c,'#4f7472',x+16,y+17,40,29);
    for(let yy=0;yy<3;yy++)for(let xx=0;xx<4;xx++)rect(c,'#739b9b',x+18+xx*9,y+19+yy*8,7,6);
    rect(c,'#66766a38',x+w-44,y+25,30,21);rect(c,'#ded9c0',x+w-48,y+20,28,19);
    for(let yy=0;yy<4;yy++)rect(c,'#8e9d91',x+w-44,y+23+yy*3,19,1);
  }
  // Windows and balcony rails belong to the front facade, not a repeated roof grid.
  for(let xx=x+12;xx<x+w-18;xx+=29){
    rect(c,'#315458',xx,y+h-depth+5,16,12);rect(c,'#a4c5bb',xx+2,y+h-depth+6,5,8);
    rect(c,'#ead5b2',xx-2,y+h-5,20,3);
  }
  if(i%2===0){awning(c,x+12,y+h-depth-10,w-32,safe?'#437d70':['#bd634f','#548b7e','#d3a355'][i%3]);}
  else {line(c,'#556c61',2,[[x+9,y+h-7],[x+w-15,y+h-7]]);for(let xx=x+10;xx<x+w-12;xx+=10)rect(c,'#596d61',xx,y+h-13,1,8);}
  if(i%4===0||safe){
    rect(c,'#254e48',x+18,y+11,w-43,22);c.fillStyle='#f5e3b6';c.font='bold 10px Arial';c.textAlign='center';c.fillText(safe?'MARSH LIGHT':b.sign,x+(w-7)/2,y+26);c.textAlign='left';
  }
  if(safe){
    // Lighthouse lantern and stepped roof, wholly on an existing solid building.
    ellipse(c,'#386b6150',x+w-38,y+h*.5,26,17);
    rect(c,'#f6e7c6',x+w-64,y+44,40,45);rect(c,'#ce765b',x+w-64,y+62,40,10);
    rect(c,'#294f4d',x+w-69,y+36,50,12);rect(c,'#a9d6c4',x+w-61,y+23,34,13);
    for(let xx=0;xx<4;xx++)rect(c,'#345a50',x+w-61+xx*10,y+23,2,13);
    c.fillStyle='#cb765d';c.beginPath();c.moveTo(x+w-69,y+23);c.lineTo(x+w-44,y+7);c.lineTo(x+w-19,y+23);c.fill();
  }
}
function coast(c){
  rect(c,'#dfc89b',0,0,678,601);
  const sea=c.createLinearGradient(0,0,650,560);sea.addColorStop(0,'#197580');sea.addColorStop(1,'#48aa9b');
  rect(c,sea,0,0,650,560);
  for(let y=14;y<560;y+=21)for(let x=12;x<647;x+=43){line(c,'#c5e4c01c',1,[[x,y],[x+18,y-2],[x+29,y]]);}
  line(c,'#ecdfb8',4,[[650,0],[650,560],[0,560]]);
  line(c,'#587e6d',2,[[656,0],[656,566],[0,566]]);
  // Marina piers and moored boats stay over the existing solid water.
  for(const y of [96,388]){
    rect(c,'#1b515950',47,y+8,200,14);rect(c,'#b99b70',40,y,215,12);
    for(let x=49;x<254;x+=14)rect(c,'#e0c69a',x,y+1,2,10);
    for(const x of [65,125,185]){
      rect(c,'#ba9f76',x,y,6,53);rect(c,'#eddbb6',x-2,y+45,10,5);
      c.save();c.translate(x+22,y+29);c.rotate(.12);
      c.fillStyle='#f4e4bf';c.beginPath();c.moveTo(0,-21);c.quadraticCurveTo(16,0,5,22);c.lineTo(-5,22);c.quadraticCurveTo(-15,0,0,-21);c.fill();
      rect(c,'#376c73',-5,-8,10,19);line(c,'#d8c9a5',1,[[0,-15],[0,18]]);c.restore();
    }
  }
}
function streets(c){
  // Sidewalk and asphalt extents use the actual road centers and 38px half-width.
  for(const x of roadsX){rect(c,'#d5caac',x-48,0,96,H);rect(c,'#40565a',x-38,0,76,H);}
  for(const y of roadsY){rect(c,'#d5caac',0,y-48,W,96);rect(c,'#40565a',0,y-38,W,76);}
  for(const x of roadsX)for(let y=0;y<H;y+=20)if(!roadsY.some(v=>Math.abs(v-y)<53)){
    rect(c,'#ebddbd',x-40,y,2,19);rect(c,'#ebddbd',x+38,y,2,19);
    rect(c,'#a4a78c',x-47,y,6,1);rect(c,'#a4a78c',x+41,y,6,1);
    rect(c,'#e4c881',x-1,y,2,10);
  }
  for(const y of roadsY)for(let x=0;x<W;x+=20)if(!roadsX.some(v=>Math.abs(v-x)<53)){
    rect(c,'#ebddbd',x,y-40,19,2);rect(c,'#ebddbd',x,y+38,19,2);
    rect(c,'#a4a78c',x,y-47,1,6);rect(c,'#a4a78c',x,y+41,1,6);
    rect(c,'#e4c881',x,y-1,10,2);
  }
  for(const x of roadsX)for(const y of roadsY){
    rect(c,'#40565a',x-38,y-48,76,96);rect(c,'#40565a',x-48,y-38,96,76);
    for(let n=-26;n<=26;n+=10)for(const side of [-1,1]){
      rect(c,'#d5d4b9',x+n,y+side*47-5,6,10);rect(c,'#d5d4b9',x+side*47-5,y+n,10,6);
    }
    ellipse(c,'#314a4e',x+22,y+22,5,4);
  }
}
function market(c){
  // The empty north-east block is a walkable tile courtyard, open toward Mara.
  rect(c,'#d6b694',1149,460,289,139);
  for(let y=462;y<598;y+=12)for(let x=1151;x<1437;x+=12)rect(c,(x+y)%24?'#e7ceaa':'#c99576',x,y,10,10);
  ellipse(c,'#efd9ad',1280,529,49,49);ellipse(c,'#ce9d73',1280,529,41,41);
  ellipse(c,'#e9cb9a',1280,529,37,37);
  c.save();c.translate(1280,529);for(let i=0;i<8;i++){c.rotate(TAU/8);line(c,'#b98768',2,[[9,0],[32,0]]);}c.restore();
  // Painted compass and string bunting leave the courtyard free of obstacles.
  for(const y of [470,589]){
    line(c,'#516d634d',1,[[1155,y],[1240,y+9],[1340,y+9],[1430,y]]);
    for(let x=1164;x<1425;x+=18){c.fillStyle=['#bf684d','#eec875','#468f80'][Math.floor(x/18)%3];c.beginPath();c.moveTo(x,y+4);c.lineTo(x+11,y+5);c.lineTo(x+5,y+16);c.fill();}
  }
  // Sign and striped canopy on the existing market's roof, never across the street.
  rect(c,'#244f49',1156,708,127,28);c.fillStyle='#ffe6ac';c.font='bold 13px Arial';c.textAlign='center';c.fillText('NIGHT MARKET',1219,727);c.textAlign='left';
  awning(c,1160,741,117,'#c96b4c');
  for(let x=1170;x<1270;x+=21){rect(c,'#a56a47',x,768,16,14);ellipse(c,'#dbb64f',x+5,772,3,3);ellipse(c,'#7c9a57',x+10,777,4,3);}
}
export function bakeScenery(w){
  const surface=document.createElement('canvas');surface.width=W;surface.height=H;
  const c=surface.getContext('2d'),r=rng(w.seed+919);
  rect(c,'#b5bd8d',0,0,W,H);
  // Sand, pocket gardens, and sparse stippling are baked, seeded and repeatable.
  for(let i=0;i<22000;i++){
    const x=r()*W,y=r()*H;rect(c,i%3?'#d3c99b45':'#6f956b30',x,y,1+r()*3,1);
  }
  coast(c);streets(c);
  const southMarsh=w.buildings.filter(b=>b.x>1900&&b.y>1200);
  const safe=southMarsh.reduce((best,b)=>b.x>best.x?b:best,southMarsh[0]||w.buildings.at(-1));
  w.buildings.forEach((b,i)=>building(c,b,i,b===safe));market(c);
  // Small clusters are rooftop planters or planted in solid coastal ground.
  w.buildings.forEach((b,i)=>{
    if(i%3===0){palm(c,b.x+b.w-27,b.y+54,.72);ellipse(c,'#648556',b.x+20,b.y+25,8,6);}
    if(i%4===1){rect(c,'#936e4c',b.x+18,b.y+b.h-45,28,18);for(let n=0;n<4;n++)ellipse(c,n%2?'#a3ad6b':'#648462',b.x+20+n*6,b.y+b.h-39,5,7);}
  });
  for(const [x,y,s] of [[620,532,1],[595,530,.8],[630,170,1],[599,192,.75],[52,533,1],[91,531,.8]])palm(c,x,y,s);
  const tiles=[],size=400;
  for(let y=0;y<H;y+=size)for(let x=0;x<W;x+=size){
    const tile=document.createElement('canvas');tile.width=Math.min(size,W-x);tile.height=Math.min(size,H-y);
    tile.getContext('2d').drawImage(surface,x,y,tile.width,tile.height,0,0,tile.width,tile.height);tiles.push({canvas:tile,x,y});
  }
  return (ctx,camera,width,height)=>{for(const t of tiles)if(t.x+size>=camera.x&&t.y+size>=camera.y&&t.x<=camera.x+width&&t.y<=camera.y+height)ctx.drawImage(t.canvas,t.x,t.y);};
}
