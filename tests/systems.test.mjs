import assert from 'node:assert/strict';
import {makeWorld,stepWorld,blocked,toggleCar} from '../game/src/world.js';
import {interact,MARA,CACHE,SAFEHOUSE} from '../game/src/missions.js';
import {fire,reload} from '../game/src/combat.js';
import {encodeSave,decodeSave} from '../game/src/save.js';
const idle={held:()=>false};
let passed=0,failed=0;
function test(name,fn){try{fn();passed++;console.log('PASS '+name);}catch(e){failed++;console.log('FAIL '+name+': '+e.message);}}
const advance=(w,seconds)=>{for(let i=0;i<seconds*60;i++)stepWorld(w,1/60,idle);};
test('mission gates reject distant interactions and wrong cars',()=>{
 const w=makeWorld();interact(w);assert.equal(w.missionStage,0);
 Object.assign(w.player,MARA);interact(w);assert.equal(w.missionStage,1);
 w.player.vehicle=w.cars.find(c=>c.id==='courier');interact(w);assert.equal(w.mission,0);
 w.player.vehicle=w.cars.find(c=>c.id==='syndicate');interact(w);interact(w);
 assert.equal(w.player.cash,1100);assert.equal(w.mission,1);
 w.player.vehicle=null;Object.assign(w.player,CACHE);interact(w);assert.equal(w.missionStage,0);
 w.guards[0].hp=0;interact(w);assert.equal(w.missionStage,1);
 Object.assign(w.player,SAFEHOUSE);interact(w);assert.equal(w.mission,1);
 w.player.heat=0;interact(w);interact(w);assert.equal(w.mission,2);assert.equal(w.player.cash,2300);
});
test('save preserves vehicle reference, progress, ammo and pursuit timers',()=>{
 const w=makeWorld();Object.assign(w.player,{x:760,y:650});toggleCar(w);
 w.player.hp=61;w.escapeTime=3;w.reloadTime=.5;w.player.ammo=4;
 const saved=decodeSave(encodeSave(w));assert.ok(saved);
 assert.equal(saved.player.vehicle,saved.cars.find(c=>c.id==='courier'));
 assert.equal(saved.player.hp,61);assert.equal(saved.reloadTime,.5);assert.equal(saved.escapeTime,3);
 assert.equal(saved.player.ammo,4);assert.equal(saved.seed,17);
});
test('save rejects corrupt, invalid and inconsistent data',()=>{
 assert.equal(decodeSave('{bad'),null);assert.equal(decodeSave('{}'),null);
 for(const mutate of [s=>s.world.player.hp=-1,s=>s.world.player.x=Infinity,s=>s.world.mission=9,s=>s.version=1,s=>s.world.player.vehicle='missing',s=>s.world.complete=[true,true]]){
  const s=JSON.parse(encodeSave(makeWorld()));mutate(s);assert.equal(decodeSave(JSON.stringify(s)),null);
 }
});
test('safe exits preserve stolen cars where parked',()=>{
 const w=makeWorld();Object.assign(w.player,{x:760,y:650});toggleCar(w);
 const c=w.player.vehicle;toggleCar(w);assert.equal(blocked(w,w.player.x,w.player.y),false);
 const point={x:c.x,y:c.y};advance(w,2);assert.deepEqual({x:c.x,y:c.y},point);
});
test('bullets hit walls, reload consumes finite reserve, patrols stay disabled',()=>{
 const w=makeWorld(),b=w.buildings.find(b=>b.y>600);
 Object.assign(w.player,{x:b.x-25,y:b.y+60});fire(w,0);advance(w,.3);
 assert.ok(w.events.some(e=>e.type==='impact'&&e.detail==='wall'));
 const total=w.player.ammo+w.player.reserve;reload(w);advance(w,1.2);
 assert.equal(w.player.ammo,12);assert.equal(w.player.ammo+w.player.reserve,total);
 const cop=w.cars.find(c=>c.police);cop.disabled=true;cop.hp=0;cop.speed=0;
 const position={x:cop.x,y:cop.y};advance(w,3);assert.deepEqual({x:cop.x,y:cop.y},position);
});
test('police routes around blocks and all actors respect solids across seeds',()=>{
 for(const seed of [7,17,42,99,2026]){
  const w=makeWorld(seed);w.player.x=1100;w.player.y=1050;w.player.heat=2;
  const cop={id:'test-cop',x:700,y:650,a:0,speed:120,police:true,hp:80};w.cars.push(cop);
  const before=Math.hypot(cop.x-w.player.x,cop.y-w.player.y);
  for(let i=0;i<240;i++){
   stepWorld(w,1/60,idle);
   for(const c of w.cars)assert.equal(blocked(w,c.x,c.y,22),false,c.id);
   for(const p of w.people)assert.equal(blocked(w,p.x,p.y,5),false,'pedestrian');
  }
  assert.ok(Math.hypot(cop.x-w.player.x,cop.y-w.player.y)<before-100);
 }
});
test('patrol approaches a foot-only gap without stalling at road node',()=>{
 const w=makeWorld(17);Object.assign(w.player,{x:925.5,y:692,heat:2});
 const cop={id:'gap-patrol',x:700,y:648.84,a:Math.PI/2,speed:135,police:true,hp:80};w.cars.push(cop);
 const before=Math.hypot(cop.x-w.player.x,cop.y-w.player.y);advance(w,1);
 assert.ok(Math.hypot(cop.x-w.player.x,cop.y-w.player.y)<before-30);
 assert.equal(blocked(w,cop.x,cop.y,22),false);
});
console.log(`RESULT ${passed} systems checks passed, ${failed} failed`);if(failed)process.exitCode=1;
