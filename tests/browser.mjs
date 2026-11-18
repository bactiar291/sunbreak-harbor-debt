import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_CORE_PATH||'playwright-core');
const review=process.env.REVIEW_DIR;
if(!review)throw Error('Set REVIEW_DIR to a directory outside the repository');
const baseURL=process.env.GAME_URL||'http://127.0.0.1:8097/';
const screenshots=new URL('../screenshots/',import.meta.url);
mkdirSync(review,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:720}});
const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('requestfailed',r=>errors.push(r.url()+': '+r.failure()?.errorText));
page.on('request',r=>{if(!r.url().startsWith(baseURL)&&!r.url().startsWith('data:'))errors.push('external '+r.url());});
const snap=()=>page.evaluate(()=>window.sunbreak.snapshot());
const wait=ms=>page.waitForTimeout(ms);
async function key(k,ms=70){await page.keyboard.down(k);await wait(ms);await page.keyboard.up(k);await wait(45);}
function pass(name,evidence){checks.push({name,evidence});console.log('PASS '+name+' '+JSON.stringify(evidence));}
async function walk(x,y){
  await page.keyboard.down('Shift');
  let active=null;
  try {
    for(let i=0;i<400;i++){
      const s=await snap();assert.ok(!s.dead,'died walking');assert.equal(s.player.vehicle,null);
      const dx=x-s.player.x,dy=y-s.player.y;
      if(Math.hypot(dx,dy)<9)return;
      const axis=Math.abs(dx)>Math.abs(dy)?'x':'y',delta=axis==='x'?dx:dy;
      const k=axis==='x'?(delta>0?'d':'a'):(delta>0?'s':'w');
      if(k!==active){if(active)await page.keyboard.up(active);await page.keyboard.down(k);active=k;}
      await wait(Math.max(12,Math.min(80,Math.abs(delta)/235*1000)));
    }
    throw Error('walk stuck '+JSON.stringify((await snap()).player)+' target '+x+','+y);
  } finally {if(active)await page.keyboard.up(active);await page.keyboard.up('Shift');}
}
async function capture(name){
  const before=await snap();validateCapture(before,name);
  await page.screenshot({path:fileURLToPath(new URL(name+'.jpg',screenshots)),type:'jpeg',quality:82});
  const after=await snap();validateCapture(after,name);
  assert.ok(after.tick>=before.tick);
  writeFileSync(`${review}/${name}-capture.json`,JSON.stringify({quality:82,viewport:page.viewportSize(),before,after},null,2));
}
function validateCapture(s,name){
  assert.ok(!s.dead&&s.player.hp>0&&!s.paused);assert.equal(s.mode,'play');
  if(name==='1-chase'){
    assert.ok(s.player.vehicle&&s.player.heat>0);
    assert.ok(s.cars.some(c=>c.police&&!c.disabled&&c.x-s.camera.x>30&&c.x-s.camera.x<1250&&c.y-s.camera.y>150&&c.y-s.camera.y<620),'live patrol visible');
  }
  if(name==='2-on-foot-action')assert.equal(s.player.vehicle,null);
  if(name==='3-driving-city'){assert.equal(s.player.vehicle,'syndicate');assert.equal(s.mission,1);}
  if(name==='4-complete'){assert.equal(s.mission,2);assert.equal(s.player.cash,2300);}
}
try{
  await page.goto(baseURL);await page.waitForFunction(()=>window.sunbreak);
  assert.equal((await snap()).mode,'title');await page.click('#play');const start=await snap();
  await walk(750,650);const walked=await snap();
  pass('normal title and walking',{distance:Math.hypot(walked.player.x-start.player.x,walked.player.y-start.player.y)});
  await key('e');assert.equal((await snap()).player.vehicle,'courier');
  await key('k');await page.reload();await page.click('#load');
  const vehicleRestored=await snap();assert.equal(vehicleRestored.player.vehicle,'courier');
  assert.equal(vehicleRestored.player.x,760);assert.equal(vehicleRestored.player.y,650);
  pass('save reload selected vehicle',{vehicle:vehicleRestored.player.vehicle,x:vehicleRestored.player.x,y:vehicleRestored.player.y});
  const beforeDrive=await snap();await key('w',1200);await key(' ',500);const driven=await snap();
  assert.ok(driven.player.x-beforeDrive.player.x>80);

  const copStart=await snap(),cop=copStart.cars.find(c=>c.police);assert.ok(cop);
  const gap0=Math.hypot(cop.x-copStart.player.x,cop.y-copStart.player.y);
  await wait(1000);const chased=await snap(),copNow=chased.cars.find(c=>c.id===cop.id);
  const gap1=Math.hypot(copNow.x-chased.player.x,copNow.y-chased.player.y);
  assert.ok(gap1<gap0-30);pass('police closes gap',{before:gap0,after:gap1});
  await capture('1-chase');
  await key('e');assert.equal((await snap()).player.vehicle,null);
  pass('enter drive exit',{distance:driven.player.x-beforeDrive.player.x});
  // Stand and fight the pursuing patrol before continuing the contract.
  for(let i=0;i<8;i++) {
    const s=await snap(),target=s.cars.find(c=>c.police&&!c.disabled);
    if(!target)break;
    await page.mouse.move(target.x-s.camera.x,target.y-s.camera.y);
    await page.mouse.down();await wait(200);await page.mouse.up();await wait(80);
  }
  assert.ok((await snap()).cars.some(c=>c.police&&c.disabled),'patrol disabled through firing');
  await key('r');
  const first=start.cars.find(c=>c.id==='traffic-0'),traffic=chased.cars.find(c=>c.id===first.id);
  const travel=Math.hypot(first.x-traffic.x,first.y-traffic.y);assert.ok(travel>20);pass('traffic movement',{distance:travel});
  await walk((await snap()).player.x,650);await walk(1100,650);await key('f');
  assert.equal((await snap()).missionStage,1);
  await walk(1500,650);await key('e');assert.equal((await snap()).player.vehicle,'syndicate');
  // Coupe faces west. Brake well before Mara and approach with short throttle pulses.
  await key('w',1700);await key(' ',500);
  for(let i=0;i<30;i++){
    const s=await snap();if(Math.abs(s.player.x-1100)<55)break;
    await key(s.player.x>1100?'w':'s',200);await key(' ',200);
  }
  await key('f');assert.equal((await snap()).mission,1);assert.equal((await snap()).player.cash,1100);
  await key('f');assert.equal((await snap()).player.cash,1100);pass('marked coupe contract and reward once',{cash:1100});
  await capture('3-driving-city');
  await key('e');await walk((await snap()).player.x,650);await walk(1900,650);await walk(1900,820);
  // Aim at the actual guard's screen position as camera smoothing settles.
  await wait(300);
  for(let i=0;i<12;i++){
    const s=await snap(),g=s.guards[0];if(g.hp<=0)break;
    await page.mouse.move(g.x-s.camera.x,g.y-s.camera.y);await page.mouse.down();await wait(220);await page.mouse.up();await wait(100);
  }
  assert.ok((await snap()).guards[0].hp<=0,'guard must be disabled by bullets');
  assert.ok((await snap()).events.some(e=>e.type==='impact'));pass('shoot impact and disable guard',{ammo:(await snap()).player.ammo});
  await capture('2-on-foot-action');await walk(1900,1050);await key('f');assert.equal((await snap()).missionStage,1);
  await walk(2300,1050);await walk(2300,1450);
  // Keep sprinting the road grid until the patrol loses sight for its cooldown.
  const escapeRoute=[[1900,1450],[1500,1450],[1100,1450],[700,1450],[300,1450],[300,1050],[700,1050]];
  for(const [x,y] of escapeRoute) {if((await snap()).player.heat===0)break;await walk(x,y);}
  assert.equal((await snap()).player.heat,0,'escape must clear heat');
  const escaped=await snap();pass('escape cooldown',{heat:escaped.player.heat,escapeTime:escaped.escapeTime});
  await walk(escaped.player.x,1450);await walk(2300,1450);
  await key('f');assert.equal((await snap()).mission,2);assert.equal((await snap()).player.cash,2300);
  await key('f');assert.equal((await snap()).player.cash,2300);
  pass('ledger escape delivery and reward once',{cash:2300});await capture('4-complete');
  await key('k');await key('Escape');const frozen=await snap();
  await key('e');await key('f');await key('w',400);await page.mouse.click(700,400);await wait(300);
  assert.equal((await snap()).tick,frozen.tick);assert.deepEqual((await snap()).player,frozen.player);pass('pause freezes simulation and actions',{tick:frozen.tick});
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('sunbreak-harbor-debt-v1')));
  await page.reload();await page.click('#load');await key('Escape');const restored=await snap();
  for(const field of ['x','y','hp','cash','ammo','reserve','vehicle'])assert.equal(restored.player[field],stored.world.player[field],field);
  assert.equal(restored.mission,2);pass('save reload exact milestone',{mission:restored.mission,cash:restored.player.cash});
  await key('Escape');
  // A fresh real run deliberately stands under patrol fire until defeat.
  await page.reload();await page.click('#play');await walk(750,650);await key('e');await key('e');
  for(let i=0;i<100&&!(await snap()).dead;i++)await wait(500);
  assert.equal((await snap()).dead,true);await key('Enter');const restarted=await snap();
  assert.equal(restarted.dead,false);assert.equal(restarted.player.hp,100);assert.equal(restarted.mission,0);
  pass('defeat and restart',{hp:restarted.player.hp,mission:restarted.mission});
  for(const size of [{width:1440,height:900},{width:1024,height:600}]){
    await page.setViewportSize(size);await wait(200);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  }
  pass('viewport and performance',(await snap()).performance);
  assert.deepEqual(errors,[]);pass('browser errors and external requests',{errors});
  writeFileSync(`${review}/browser-result.json`,JSON.stringify({pass:true,checks,errors},null,2));
  console.log(`RESULT ${checks.length} browser checks passed`);
}catch(e){
  const state=await snap().catch(()=>null);
  writeFileSync(`${review}/browser-failure.json`,JSON.stringify({error:e.stack,checks,errors,state},null,2));
  console.error(e);process.exitCode=1;
}finally{await browser.close();}
