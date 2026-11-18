import {distance} from './geometry.js';
import {crime,event,message,nearest} from './world.js';
export const MARA={x:1100,y:650,label:'MARA · NIGHT MARKET'};
export const CACHE={x:1900,y:1050,label:'GUARDED LEDGER'};
export const SAFEHOUSE={x:2300,y:1450,label:'MARSH SAFEHOUSE'};

export function objective(w) {
  if(w.mission===0) {
    if(w.missionStage===0) return {...MARA,text:'Meet Mara at the Night Market. Press F nearby.'};
    const car=w.cars.find(c=>c.id==='syndicate');
    if(w.player.vehicle!==car) return {...car,label:'SYNDICATE COUPE',text:'Take the marked rose coupe. Only this car pays the debt.'};
    return {...MARA,text:'Deliver the syndicate coupe to Mara. Press F nearby.'};
  }
  if(w.mission===1) {
    if(w.missionStage===0) return {...CACHE,text:'Reach Marsh Light. Disable the guard and collect the ledger on foot.'};
    if(w.player.heat>0) return {...SAFEHOUSE,text:'Lose the patrol. Stay unseen for eight seconds, then deliver the ledger.'};
    return {...SAFEHOUSE,text:'Deliver the ledger at the safehouse. Press F on foot.'};
  }
  return {...SAFEHOUSE,label:'DEBT CLEARED',text:'Both contracts complete. Sunbreak is yours to explore.'};
}
export function interact(w) {
  if(w.paused||w.dead) return;
  const p=w.player;
  if(w.mission===0&&distance(p,MARA)<65) {
    if(w.missionStage===0) {
      w.missionStage=1;message(w,'MARA: THE ROSE COUPE. BRING IT BACK.',4);event(w,'mara-met');
    } else if(p.vehicle?.id==='syndicate'&&!w.complete[0]) {
      w.complete[0]=true;w.mission=1;w.missionStage=0;p.cash+=650;
      message(w,'BORROWED TIME COMPLETE · +$650 · FIND THE LEDGER',4);event(w,'reward','650');
    } else message(w,'MARA: I NEED THE MARKED SYNDICATE COUPE.');
  } else if(w.mission===1&&w.missionStage===0&&distance(p,CACHE)<60&&!p.vehicle) {
    if(w.guards.some(g=>g.hp>0)) { message(w,'CACHE GUARDED · DISABLE THE GUARD');return; }
    w.missionStage=1;crime(w,2);message(w,'LEDGER SECURED · LOSE THE PATROL',4);event(w,'ledger');
  } else if(w.mission===1&&w.missionStage===1&&distance(p,SAFEHOUSE)<65&&!p.vehicle) {
    if(p.heat>0) { message(w,'SHAKE THE PATROL BEFORE DELIVERING');return; }
    if(!w.complete[1]) {
      w.complete[1]=true;w.mission=2;w.missionStage=0;p.cash+=1200;
      message(w,'HARBOR DEBT CLEARED · +$1,200 · FREE ROAM',6);event(w,'reward','1200');
    }
  }
}
export function contextPrompt(w) {
  if(w.dead) return 'DEFEATED · ENTER TO RESTART';
  if(w.paused) return 'PAUSED · ESC TO RESUME';
  const target=objective(w);
  if(w.mission<2&&distance(w.player,target)<65) return `F · ${target.label}`;
  if(w.player.vehicle) return 'E · EXIT VEHICLE';
  if(nearest(w)) return 'E · ENTER VEHICLE';
  return 'SHIFT · SPRINT';
}
