import {makeWorld,blocked} from './world.js';
import {W,H} from './config.js';
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const point=p=>p&&finite(p.x,0,W)&&finite(p.y,0,H);
export function encodeSave(w) {
  return JSON.stringify({version:2,world:{...w,paused:false,player:{...w.player,vehicle:w.player.vehicle?.id??null}}});
}
export function decodeSave(text) {
  try {
    const data=JSON.parse(text),s=data?.world;
    if(data?.version!==2||!s||!Number.isInteger(s.seed)||!point(s.player)) return null;
    const p=s.player;
    if(!finite(p.hp,1,100)||!finite(p.cash,0,1e8)||!finite(p.ammo,0,12)||!finite(p.reserve,0,10000)||!finite(p.heat,0,5)||!finite(p.a,-1e6,1e6)) return null;
    if(![0,1,2].includes(s.mission)||![0,1].includes(s.missionStage)||!Array.isArray(s.complete)||s.complete.length!==2||s.complete.some(v=>typeof v!=='boolean')) return null;
    if(s.complete[0]!== (s.mission>=1)||s.complete[1]!== (s.mission===2)) return null;
    for(const key of ['clock','tick','escapeTime','fireCooldown','reloadTime','toastTime']) if(!finite(s[key],0,1e9)) return null;
    if(!Array.isArray(s.cars)||s.cars.length>100||!Array.isArray(s.guards)||s.guards.length!==1) return null;
    if(s.cars.some(c=>!point(c)||typeof c.id!=='string'||!finite(c.a,-1e6,1e6)||!finite(c.speed,-400,400)||!finite(c.hp,-100,100)||
      (c.cooldown!==undefined&&!finite(c.cooldown,0,10))||(c.cleanup!==undefined&&!finite(c.cleanup,0,1e9)))) return null;
    if(new Set(s.cars.map(c=>c.id)).size!==s.cars.length||!s.cars.some(c=>c.id==='syndicate')) return null;
    if(s.guards.some(g=>!point(g)||!finite(g.hp,-100,100)||!finite(g.cooldown,0,10))) return null;
    const w=makeWorld(s.seed);
    if(blocked(w,p.x,p.y,p.vehicle?22:12)||s.cars.some(c=>blocked(w,c.x,c.y,22))) return null;
    Object.assign(w,{player:{...p},cars:s.cars,guards:s.guards,mission:s.mission,missionStage:s.missionStage,complete:s.complete,
      clock:s.clock,tick:s.tick,escapeTime:s.escapeTime,fireCooldown:s.fireCooldown,reloadTime:s.reloadTime});
    if(p.vehicle!==null&&!s.cars.some(c=>c.id===p.vehicle&&c.owned&&!c.disabled)) return null;
    w.player.vehicle=w.cars.find(c=>c.id===p.vehicle)||null;
    if(w.player.vehicle&&(w.player.vehicle.x!==p.x||w.player.vehicle.y!==p.y)) return null;
    // Persist moving atmosphere too, so restoring does not reset the city around Ren.
    if(!Array.isArray(s.people)||s.people.length>100||s.people.some(n=>!point(n)||!finite(n.a,-1e6,1e6)||!finite(n.speed,0,100)||blocked(w,n.x,n.y,5))) return null;
    w.people=s.people;
    // Restore only validated transient arrays, never executable data or geometry.
    if(!Array.isArray(s.bullets)||s.bullets.length>200||s.bullets.some(b=>!point(b)||!finite(b.a,-1e6,1e6)||!finite(b.speed,0,1000)||!finite(b.life,0,2))) return null;
    w.bullets=s.bullets;
    return w;
  } catch { return null; }
}
