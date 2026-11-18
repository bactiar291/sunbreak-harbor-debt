import {blocked,distance,clearLine} from './geometry.js';
import {crime,event,message} from './world.js';

export function fire(w,angle) {
  if(w.paused||w.dead||w.fireCooldown>0||w.reloadTime>0) return;
  if(w.player.ammo<=0) { message(w,'EMPTY · R TO RELOAD');return; }
  w.player.ammo--;w.player.a=angle;w.fireCooldown=.18;crime(w,.3);
  w.bullets.push({x:w.player.x,y:w.player.y,a:angle,speed:720,life:.85,hostile:false});
  event(w,'shot');
}
export function reload(w) {
  if(w.paused||w.dead||w.reloadTime||w.player.ammo===12||w.player.reserve<=0) return;
  w.reloadTime=1.1;message(w,'RELOADING',1.1);
}
function impact(w,b,type) {
  for(let i=0;i<8;i++) w.particles.push({x:b.x,y:b.y,vx:Math.cos(i)*65,vy:Math.sin(i)*65,life:.55,r:3,color:'#ffe6a3'});
  event(w,'impact',type);b.life=0;
}
export function updateCombat(w,dt) {
  w.fireCooldown=Math.max(0,w.fireCooldown-dt);
  if(w.reloadTime>0) {
    w.reloadTime=Math.max(0,w.reloadTime-dt);
    if(w.reloadTime===0) {
      const count=Math.min(12-w.player.ammo,w.player.reserve);
      w.player.ammo+=count;w.player.reserve-=count;event(w,'reload');
    }
  }
  for(const g of w.guards) {
    if(g.hp<=0) continue;
    g.cooldown=Math.max(0,g.cooldown-dt);
    if(w.mission===1&&distance(g,w.player)<240&&clearLine(w,g,w.player,2)&&g.cooldown===0) {
      w.bullets.push({x:g.x,y:g.y,a:Math.atan2(w.player.y-g.y,w.player.x-g.x),speed:330,life:1,hostile:true});
      g.cooldown=1.5;
    }
  }
  for(const b of w.bullets) {
    b.life-=dt;
    const count=Math.ceil(b.speed*dt/4);
    for(let i=0;i<count&&b.life>0;i++) {
      b.x+=Math.cos(b.a)*b.speed*dt/count;b.y+=Math.sin(b.a)*b.speed*dt/count;
      if(blocked(w,b.x,b.y,1)) { impact(w,b,'wall');break; }
      if(b.hostile) {
        if(distance(b,w.player)<(w.player.vehicle?22:12)) { w.player.hp=Math.max(0,w.player.hp-8);impact(w,b,'player'); }
      } else {
        const target=[...w.guards,...w.cars].find(c=>c!==w.player.vehicle&&!c.disabled&&(c.hp??1)>0&&distance(b,c)<(c.speed===undefined?13:22));
        if(target) {
          target.hp=(target.hp??60)-20;
          if(target.hp<=0) { target.disabled=true;target.speed=0;event(w,'disabled',target.id); }
          impact(w,b,target.id||'vehicle');
        }
      }
    }
  }
  w.bullets=w.bullets.filter(b=>b.life>0);
}
