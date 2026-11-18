// Dynamic silhouettes and effects. Reads simulation state without changing it.
import {TAU} from './config.js';
import {MARA} from './missions.js';
function box(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h);}
function disc(c,color,x,y,r){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();}
function person(c,n,time,moving,player=false){
  c.save();c.translate(n.x,n.y);
  c.fillStyle='#153a354d';c.beginPath();c.ellipse(5,6,10,5,.3,0,TAU);c.fill();
  c.rotate(n.a||0);
  const step=moving?Math.sin(time*12)*3.5:0;
  // Faces +X, the exact simulation aim direction. Feet alternate along travel.
  box(c,'#213c42',-4+step,-6,8,4);box(c,'#213c42',-4-step,2,8,4);
  c.fillStyle=player?'#ee8c65':n.shirt||'#be6854';c.strokeStyle='#274b47';c.lineWidth=1.4;
  c.beginPath();c.roundRect(-6,-7,11,14,4);c.fill();c.stroke();
  box(c,'#e6b98b',2,-9,5,3);box(c,'#e6b98b',2,6,5,3);
  disc(c,'#f1c798',1,-1,4);c.fillStyle='#4b4235';c.beginPath();c.arc(0,-1,4,Math.PI/2,Math.PI*1.5);c.fill();
  if(player){box(c,'#f2ddb8',-3,-5,2,10);box(c,'#263d42',7,4,10,3);}
  c.restore();
}
function selection(c,x,y,r,car=false){
  c.strokeStyle='#173d3e';c.lineWidth=4;c.beginPath();c.arc(x,y,r,.2,Math.PI-.2);c.arc(x,y,r,Math.PI+.2,TAU-.2);c.stroke();
  c.strokeStyle='#ffe3a1';c.lineWidth=1.5;c.stroke();
  c.fillStyle='#fff0c6';c.beginPath();c.moveTo(x,y-r-5);c.lineTo(x-4,y-r-11);c.lineTo(x+4,y-r-11);c.fill();
}
function vehicle(c,v,w){
  c.save();c.translate(v.x,v.y);c.rotate(v.a);
  const variant=v.id==='syndicate'?0:v.id==='courier'?2:Number(v.id.split('-').at(-1))%3;
  const long=variant===1?24:22,wide=variant===1?11:10;
  box(c,'#12333155',-long+5,-wide+6,long*2+3,wide*2+3);
  for(const x of [-15,12])for(const y of [-wide-2,wide-1])box(c,'#172e33',x,y,9,4);
  c.fillStyle=v.disabled?'#7c8276':v.color;c.strokeStyle='#244345';c.lineWidth=1.5;
  c.beginPath();c.roundRect(-long,-wide,long*2,wide*2,4);c.fill();c.stroke();
  box(c,'#fff0bd90',-long+4,-wide+1,long*2-8,1);
  box(c,'#253f48',-9,-wide+2,19,wide*2-4);
  box(c,'#a2c7c3',6,-wide+3,5,wide*2-6);box(c,'#6da4aa',-10,-wide+3,4,wide*2-6);
  box(c,v.police?'#304c52':v.color,-4,-wide+2,10,wide*2-4);
  box(c,'#e9dec187',-2,-wide+3,5,2);
  if(variant===2&&!v.police){box(c,'#68817b',-19,-7,8,14);box(c,'#aab5a0',-18,-6,6,1);}
  for(const y of [-8,5]){box(c,'#ffe8a8',long-3,y,3,3);box(c,'#dc6655',-long,y,3,3);}
  box(c,'#c5c9ad',long-1,-4,2,8);box(c,'#485c5b',-long-1,-5,2,10);
  for(const y of [-wide-3,wide])box(c,v.color,6,y,4,3);
  if(v.id==='syndicate'){box(c,'#f5be9a',12,-2,8,4);box(c,'#543c48',-20,-11,3,22);}
  if(v.police){
    box(c,'#f5e8c4',-13,-8,6,16);box(c,'#253f48',-3,-9,5,18);
    const active=w.player.heat>0&&!v.disabled&&!v.owned,phase=Math.floor(w.clock*8)%2;
    box(c,active&&phase?'#ff7b68':'#8a5554',-2,-8,3,7);box(c,active&&!phase?'#a5e8f3':'#528695',-2,1,3,7);
    if(active){c.globalAlpha=.19;disc(c,phase?'#ff7b68':'#a5e8f3',0,phase?-8:8,14);c.globalAlpha=1;}
  }
  if(v.disabled){box(c,'#364441',10,-5,8,10);c.strokeStyle='#192f31';c.lineWidth=2;c.beginPath();c.moveTo(6,-6);c.lineTo(11,1);c.lineTo(6,6);c.stroke();}
  c.restore();
}
export function drawActors(c,w,input,camera,width,height){
  const visible=(n,pad=50)=>n.x>camera.x-pad&&n.x<camera.x+width+pad&&n.y>camera.y-pad&&n.y<camera.y+height+pad;
  const p=w.player;
  for(const n of w.people)if(visible(n))person(c,n,w.clock+n.x*.01,true);
  if(visible(MARA)){
    person(c,{...MARA,a:Math.PI/2,shirt:'#4f8e85'},w.clock,false);
    c.fillStyle='#244f48';c.fillRect(MARA.x-23,MARA.y-34,46,14);c.fillStyle='#ffe6b2';c.font='bold 9px Arial';c.textAlign='center';c.fillText('MARA',MARA.x,MARA.y-24);c.textAlign='left';
  }
  for(const g of w.guards)if(visible(g)){
    if(g.hp>0){person(c,{...g,a:Math.atan2(p.y-g.y,p.x-g.x),shirt:'#b84f46'},w.clock,false);box(c,'#293c37',g.x-14,g.y-21,28,3);box(c,'#dd845b',g.x-14,g.y-21,28*g.hp/60,3);}
    else {c.save();c.translate(g.x,g.y);c.rotate(.4);box(c,'#575e51',-10,-4,20,8);c.restore();}
  }
  for(const v of w.cars)if(visible(v)){if(p.vehicle===v)selection(c,v.x,v.y,31,true);vehicle(c,v,w);}
  if(!p.vehicle){selection(c,p.x,p.y,19);person(c,{...p,a:p.a},w.clock,['w','a','s','d'].some(k=>input.held(k)),true);}
  for(const b of w.bullets)if(visible(b)){
    c.strokeStyle=b.hostile?'#f4ad76':'#ffebaa';c.lineWidth=2;c.beginPath();c.moveTo(b.x-Math.cos(b.a)*7,b.y-Math.sin(b.a)*7);c.lineTo(b.x,b.y);c.stroke();
  }
  // Only actual combat cooldowns/events light the muzzle; no decorative gunfire.
  if(w.fireCooldown>.11){c.save();c.translate(p.x,p.y);c.rotate(p.a);c.fillStyle='#ffe6a0';c.beginPath();c.moveTo(17,4);c.lineTo(26,0);c.lineTo(23,5);c.lineTo(27,8);c.lineTo(17,7);c.fill();c.restore();}
  for(const g of w.guards)if(g.hp>0&&g.cooldown>1.43&&visible(g))disc(c,'#ffdd92',g.x+Math.cos(Math.atan2(p.y-g.y,p.x-g.x))*12,g.y+Math.sin(Math.atan2(p.y-g.y,p.x-g.x))*12,3);
  for(const v of w.cars)if(v.police&&!v.disabled&&v.cooldown>1.13&&visible(v))disc(c,'#ffe5a3',v.x,v.y,4);
  for(const e of w.particles)if(visible(e)){
    c.globalAlpha=Math.min(.8,Math.max(0,e.life*1.8));c.fillStyle=e.color;
    if(e.vx||e.vy){c.save();c.translate(e.x,e.y);c.rotate(Math.atan2(e.vy,e.vx));c.fillRect(-3,-.7,5,1.4);c.restore();}
    else {c.beginPath();c.arc(e.x,e.y,e.r,0,TAU);c.fill();}c.globalAlpha=1;
  }
}
