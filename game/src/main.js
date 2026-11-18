import {STEP,SAVE_KEY} from './config.js';
import {makeWorld,stepWorld,toggleCar,message} from './world.js';
import {interact,objective} from './missions.js';
import {fire,reload} from './combat.js';
import {encodeSave,decodeSave} from './save.js';
import {createRenderer} from './render.js';
import {createInput} from './input.js';
import {createAudio} from './audio.js';

const canvas=document.getElementById('game'),menu=document.getElementById('menu');
const input=createInput(canvas),draw=createRenderer(canvas),audio=createAudio();
let world=makeWorld(17),mode='title',last=performance.now(),acc=0;
const frameTimes=[];
function savedWorld() { try{return decodeSave(localStorage.getItem(SAVE_KEY));}catch{return null;} }
function refreshLoad() {
  const exists=!!savedWorld();
  document.getElementById('load').disabled=!exists;
  document.getElementById('load').textContent=exists?'Continue saved game':'No valid saved city';
}
function start(fresh=true) {
  if(fresh) world=makeWorld(17);
  mode='play';world.paused=false;menu.hidden=true;input.reset();acc=0;audio.unlock();
}
document.getElementById('play').onclick=()=>start();
document.getElementById('load').onclick=()=>{const saved=savedWorld();if(saved){world=saved;start(false);message(world,'SAVE RESTORED');}};
refreshLoad();
function save() {
  try {localStorage.setItem(SAVE_KEY,encodeSave(world));message(world,'CITY PROGRESS SAVED');}
  catch {message(world,'SAVE UNAVAILABLE');}
}
function load() {
  const saved=savedWorld();
  if(saved){world=saved;input.reset();message(world,'SAVE RESTORED');}
  else message(world,'NO VALID SAVED CITY');
}
function controls() {
  if(mode!=='play') {input.clear();return;}
  if(world.dead) {if(input.tap('enter')) start();input.clear();return;}
  if(input.tap('escape')) {world.paused=!world.paused;input.reset();}
  if(world.paused) {input.clear();return;}
  if(input.tap('e')) toggleCar(world);
  if(input.tap('f')) interact(world);
  if(input.tap('r')) reload(world);
  if(input.tap('k')) save();
  if(input.tap('l')) load();
  if(input.tap('m')) message(world,audio.toggle()?'AUDIO MUTED':'AUDIO ON');
  if(input.mouse().down) {
    const mouse=input.mouse(),camera=draw.camera;
    fire(world,Math.atan2(mouse.y+camera.y-world.player.y,mouse.x+camera.x-world.player.x));
  }
  input.clear();
}
// Inspection only: callers receive a detached snapshot, never the live world.
Object.defineProperty(window,'sunbreak',{value:Object.freeze({snapshot:()=>JSON.parse(JSON.stringify({
  mode,tick:world.tick,clock:world.clock,paused:world.paused,dead:world.dead,seed:world.seed,
  player:{...world.player,vehicle:world.player.vehicle?.id??null},cars:world.cars,guards:world.guards,
  mission:world.mission,missionStage:world.missionStage,complete:world.complete,events:world.events,
  objective:objective(world),escapeTime:world.escapeTime,camera:draw.camera,
  performance:{frames:frameTimes.length,meanMs:frameTimes.reduce((a,b)=>a+b,0)/(frameTimes.length||1)}
}))}),writable:false,configurable:false});
let lastSoundTick=-1;
function frame(now) {
  const elapsed=Math.min((now-last)/1000,.1);last=now;
  frameTimes.push(elapsed*1000);if(frameTimes.length>300)frameTimes.shift();
  controls();
  if(mode==='play'&&!world.paused&&!world.dead) {
    acc+=elapsed;
    while(acc>=STEP){stepWorld(world,STEP,input);acc-=STEP;}
  } else acc=0;
  for(const e of world.events) if(e.tick>lastSoundTick&&['shot','impact','reward'].includes(e.type)) audio.play(e.type);
  lastSoundTick=world.tick;
  draw(world,input);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
