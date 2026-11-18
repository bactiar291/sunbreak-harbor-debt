import assert from 'node:assert/strict';
import {makeWorld, stepWorld, blocked} from '../game/src/world.js';
const idle = {held:()=>false};
let failures = 0;
function test(name, run) {
  try { run(); console.log(`PASS ${name}`); }
  catch (e) { failures++; console.log(`FAIL ${name}: ${e.message}`); }
}
test('safe spawn across seeds', () => {
  for (const seed of [7,17,42,99,2026]) {
    const w = makeWorld(seed);
    assert.equal(blocked(w,w.player.x,w.player.y),false);
  }
});
test('both traffic axes advance without entering buildings', () => {
  const w=makeWorld(17), starts=w.cars.map(c=>({...c})),travel=starts.map(()=>0);
  for(let i=0;i<180;i++) {
    const before=w.cars.map(c=>({...c}));
    stepWorld(w,1/60,idle);
    w.cars.forEach((c,j)=>{
      travel[j]+=Math.hypot(c.x-before[j].x,c.y-before[j].y);
      assert.equal(blocked(w,c.x,c.y),false,`${c.id} intersects solid terrain`);
    });
  }
  for(let i=0;i<starts.length;i++) if(!starts[i].owned) assert.ok(travel[i]>20);
});
test('paused simulation is frozen',()=>{
  const w=makeWorld(7); w.paused=true; const before=JSON.stringify(w);
  stepWorld(w,1/60,idle); assert.equal(JSON.stringify(w),before);
});
test('defeat persists for restart',()=>{
  const w=makeWorld(7); w.player.hp=0; stepWorld(w,1/60,idle);
  assert.equal(w.player.hp,0); assert.equal(w.dead,true);
});
console.log(`RESULT ${4-failures} passed, ${failures} failed`);
if(failures) process.exitCode=1;
