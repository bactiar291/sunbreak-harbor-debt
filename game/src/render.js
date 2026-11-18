import {W,H,COLORS,TAU} from './config.js';
import {district,roadsX,roadsY} from './world.js';
import {objective,contextPrompt} from './missions.js';
export function createRenderer(canvas) {
let ctx=canvas.getContext('2d');
const screen=ctx,camera={x:0,y:0};
let cw=0,ch=0,dpr=1,tint,scenery=null,sceneryWorld=null;
function resize() {
  dpr=Math.min(devicePixelRatio||1,1.5);cw=innerWidth;ch=innerHeight;
  canvas.width=cw*dpr;canvas.height=ch*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  tint=ctx.createLinearGradient(0,0,0,ch);tint.addColorStop(0,'#10222b18');tint.addColorStop(1,'#111a2070');
  scenery=null;
}
window.addEventListener('resize',resize);resize();
function draw(w,input) {
const p=w.player;
camera.x+=(Math.max(0,Math.min(W-cw,p.x-cw/2))-camera.x)*.16;
camera.y+=(Math.max(0,Math.min(H-ch,p.y-ch/2))-camera.y)*.16;
const camX=camera.x,camY=camera.y;
ctx.clearRect(0,0,cw,ch);ctx.save();ctx.translate(-camX,-camY);
if(!scenery||sceneryWorld!==w) {
scenery=document.createElement('canvas');scenery.width=W;scenery.height=H;
ctx=scenery.getContext('2d');sceneryWorld=w;
ctx.fillStyle='#406b59';ctx.fillRect(0,0,W,H);
// Waterfront inlet, boardwalk and beach
ctx.fillStyle='#14505b';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(730,0);ctx.lineTo(690,120);ctx.lineTo(770,225);ctx.lineTo(650,320);ctx.lineTo(710,455);ctx.lineTo(600,590);ctx.lineTo(0,560);ctx.closePath();ctx.fill();ctx.fillStyle='#c6a56b';ctx.fillRect(0,560,630,18);ctx.fillStyle='#d7bd83';ctx.fillRect(0,578,560,26);
// Road grid and markings
ctx.fillStyle='#26343a';for(const x of roadsX)ctx.fillRect(x-38,0,76,H);for(const y of roadsY)ctx.fillRect(0,y-38,W,76);ctx.strokeStyle='#b6ae82';ctx.lineWidth=2;ctx.setLineDash([18,20]);for(const x of roadsX){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(const y of roadsY){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}ctx.setLineDash([]);
// district color accents, plazas and palms
for(let i=0;i<28;i++){let x=(i*137+90)%W,y=(i*223+80)%H;if(!roadsX.some(a=>Math.abs(x-a)<62)&&!roadsY.some(a=>Math.abs(y-a)<62)){ctx.fillStyle=i%2?'#518064':'#6c8c66';ctx.beginPath();ctx.arc(x,y,20+(i%4)*5,0,TAU);ctx.fill();ctx.strokeStyle='#75573c';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+3,y+23);ctx.stroke()}}
for(const b of w.buildings){ctx.fillStyle='#12232a55';ctx.fillRect(b.x+9,b.y+13,b.w,b.h);ctx.fillStyle=b.color;ctx.fillRect(b.x,b.y-b.height*.32,b.w,b.h);ctx.fillStyle='#d9c998';ctx.fillRect(b.x-3,b.y-5,b.w+6,8);ctx.fillStyle='#17292c';for(let xx=b.x+12;xx<b.x+b.w-10;xx+=25)for(let yy=b.y+12;yy<b.y+b.h-10;yy+=24)ctx.fillRect(xx,yy,10,8);ctx.fillStyle='#f8d27a';ctx.fillRect(b.x+b.w*.25,b.y+b.h*.5,Math.min(b.w*.5,65),13);ctx.fillStyle='#203236';ctx.font='bold 9px Arial';ctx.fillText(b.sign,b.x+b.w*.25+4,b.y+b.h*.5+10)}
// landmarks
ctx.fillStyle='#e8c874';ctx.fillRect(360,77,210,32);ctx.fillStyle='#14262a';ctx.font='bold 13px Arial';ctx.fillText('SOL HOUSE PIER',390,98);ctx.fillStyle='#d5795d';ctx.fillRect(1210,740,130,105);ctx.fillStyle='#fff1c5';ctx.fillText('NIGHT MARKET',1216,793);ctx.fillStyle='#d7d0ac';ctx.beginPath();ctx.arc(2085,1220,62,0,TAU);ctx.fill();ctx.fillStyle='#396057';ctx.beginPath();ctx.arc(2085,1220,42,0,TAU);ctx.fill();ctx.fillStyle='#172d30';ctx.fillText('MARSH LIGHT',2043,1225);
ctx=screen;
}
ctx.drawImage(scenery,0,0);
for(const guard of w.guards) {
  ctx.fillStyle=guard.hp>0?'#db5652':'#5c6262';ctx.fillRect(guard.x-9,guard.y-9,18,18);
  ctx.fillStyle='#ffe3a3';ctx.font='10px Arial';ctx.fillText(guard.hp>0?'GUARD':'DISABLED',guard.x-22,guard.y-17);
}
for(const n of w.people){ctx.fillStyle='#10202066';ctx.beginPath();ctx.ellipse(n.x+3,n.y+5,7,3,0,0,TAU);ctx.fill();ctx.fillStyle='#efc29b';ctx.beginPath();ctx.arc(n.x,n.y-8,4,0,TAU);ctx.fill();ctx.fillStyle=n.shirt;ctx.fillRect(n.x-4,n.y-5,8,11);ctx.strokeStyle='#283d42';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(n.x,n.y+6);ctx.lineTo(n.x-3,n.y+12);ctx.moveTo(n.x,n.y+6);ctx.lineTo(n.x+4,n.y+12);ctx.stroke()}
for(const c of w.cars){ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.a);ctx.fillStyle='#0006';ctx.fillRect(-20,-8,45,21);ctx.fillStyle=c.color;ctx.fillRect(-22,-10,44,20);ctx.fillStyle='#9cb9b5';ctx.fillRect(-8,-8,17,16);ctx.fillStyle='#26383b';ctx.fillRect(-20,-11,8,3);ctx.fillRect(12,-11,8,3);if(c.police){ctx.fillStyle=w.clock%1>.5?'#ef5950':'#67caff';ctx.fillRect(-5,-13,10,4);ctx.fillStyle='#18333b';ctx.font='bold 6px Arial';ctx.fillText('CIVIC',-12,2)}ctx.restore()}
for(const b of w.bullets){ctx.fillStyle='#ffed9c';ctx.beginPath();ctx.arc(b.x,b.y,4,0,TAU);ctx.fill()}for(const e of w.particles){ctx.globalAlpha=Math.max(0,e.life);ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,TAU);ctx.fill();ctx.globalAlpha=1}
if(!p.vehicle){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.fillStyle='#090f12aa';ctx.beginPath();ctx.ellipse(2,5,12,7,0,0,TAU);ctx.fill();ctx.fillStyle='#e4b184';ctx.beginPath();ctx.arc(0,-4,5,0,TAU);ctx.fill();ctx.fillStyle='#df7f60';ctx.fillRect(-6,0,12,12);ctx.strokeStyle='#253438';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-3,10);ctx.lineTo(-5,17);ctx.moveTo(3,10);ctx.lineTo(6,17);ctx.stroke();ctx.restore()}
// mission destination beacon
const marker=objective(w);if(w.mission<2||!w.complete[1]){const pulse=22+Math.sin(w.clock*3)*5;ctx.strokeStyle='#ffcf62';ctx.lineWidth=3;ctx.beginPath();ctx.arc(marker.x,marker.y,pulse,0,TAU);ctx.stroke();ctx.fillStyle='#ffcf62';ctx.font='bold 11px Arial';ctx.fillText(marker.label,marker.x-22,marker.y-30)}ctx.restore();
// ambient tint, HUD
ctx.fillStyle=tint;ctx.fillRect(0,0,cw,ch);
const aim=input.mouse();ctx.strokeStyle='#ffe5a3';ctx.lineWidth=1;
ctx.beginPath();ctx.arc(aim.x,aim.y,9,0,TAU);ctx.moveTo(aim.x-14,aim.y);ctx.lineTo(aim.x+14,aim.y);ctx.stroke();
const hp=p.hp;ctx.fillStyle='#111b20dd';ctx.fillRect(30,ch-117,194,70);ctx.fillStyle='#d7e0d9';ctx.font='bold 10px Arial';ctx.fillText('VITALS',43,ch-96);ctx.fillStyle='#35423e';ctx.fillRect(43,ch-84,165,10);ctx.fillStyle=hp>35?'#76c79f':'#f27863';ctx.fillRect(43,ch-84,165*hp/100,10);ctx.fillStyle='#ffcf62';ctx.font='bold 16px Arial';ctx.fillText('$'+p.cash.toLocaleString(),43,ch-58);ctx.fillStyle='#d8e3dc';ctx.font='12px Arial';ctx.fillText('AMMO '+p.ammo+' / '+p.reserve,245,ch-57);
// minimap
const mx=cw-204,my=ch-194,ms=170;ctx.fillStyle='#061318dd';ctx.fillRect(mx-7,my-7,ms+14,ms+14);ctx.save();ctx.beginPath();ctx.rect(mx,my,ms,ms);ctx.clip();ctx.fillStyle='#48715e';ctx.fillRect(mx,my,ms,ms);ctx.fillStyle='#174d56';ctx.fillRect(mx,my,ms*.34,ms*.32);ctx.fillStyle='#344348';for(const x of roadsX)ctx.fillRect(mx+x/W*ms-3,my,6,ms);for(const y of roadsY)ctx.fillRect(mx,my+y/H*ms-3,ms,6);for(const b of w.buildings){ctx.fillStyle='#a77b5d';ctx.fillRect(mx+b.x/W*ms,my+b.y/H*ms,b.w/W*ms,b.h/H*ms)}for(const c of w.cars){ctx.fillStyle=c.police?'#6ed9ff':'#e7d79a';ctx.fillRect(mx+c.x/W*ms-1,my+c.y/H*ms-1,3,3)}ctx.fillStyle='#ffcf62';ctx.beginPath();ctx.arc(mx+p.x/W*ms,my+p.y/H*ms,4,0,TAU);ctx.fill();ctx.restore();ctx.fillStyle='#d8e1d8';ctx.font='9px Arial';ctx.fillText('N',mx+ms-12,my-10);
// wanted level
ctx.fillStyle='#081115bb';ctx.fillRect(cw-250,26,220,34);ctx.fillStyle='#ed5e52';ctx.font='15px Arial';ctx.fillText('✦ '.repeat(Math.ceil(p.heat)),cw-238,49);ctx.fillStyle='#72817b';ctx.font='12px Arial';ctx.fillText('○ '.repeat(Math.max(0,5-Math.ceil(p.heat))),cw-238+Math.ceil(p.heat)*22,49);
document.getElementById('district').textContent=district(p.x,p.y);
const title=['01 / BORROWED TIME','02 / SALT IN THE WOUND','CITY / DEBT CLEARED'][w.mission];
document.getElementById('contract').textContent=title+' — '+marker.text;
document.getElementById('stats').textContent=p.vehicle?'DRIVING · '+Math.round(Math.abs(p.vehicle.speed))+' KM/H':'ON FOOT';
document.getElementById('toast').textContent=w.toastTime>0?w.toast:'';
document.getElementById('prompt').textContent=contextPrompt(w);
ctx.fillStyle='#ffcf62';ctx.fillRect(mx+marker.x/W*ms-3,my+marker.y/H*ms-3,6,6);
if(w.paused||w.dead) {
  ctx.fillStyle='#071015d9';ctx.fillRect(cw/2-260,ch/2-90,520,180);
  ctx.textAlign='center';ctx.fillStyle='#ffcf62';ctx.font='bold 32px Arial';
  ctx.fillText(w.dead?'DEFEATED':'CITY PAUSED',cw/2,ch/2-25);
  ctx.fillStyle='#e0e9e3';ctx.font='16px Arial';
  ctx.fillText(w.dead?'Enter · restart with a clean slate':'Esc · resume',cw/2,ch/2+10);
  ctx.font='12px Arial';ctx.fillText('WASD move / drive · E vehicle · F contract · R reload',cw/2,ch/2+42);
  ctx.textAlign='left';
}
}
draw.camera=camera;
return draw;
}
