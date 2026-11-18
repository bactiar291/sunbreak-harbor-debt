import {W,H,TAU} from './config.js';
import {rng,pick} from './random.js';
import {blocked,roadsX,roadsY,moveBody,safeRoad,distance,clearLine,roadWaypoint} from './geometry.js';
import {updateCombat} from './combat.js';
export {blocked,roadsX,roadsY};

export function event(w,type,detail='') {
  w.events.push({tick:w.tick,type,detail});
  if(w.events.length>100) w.events.shift();
}
export function message(w,text,time=3) { w.toast=text;w.toastTime=time; }
export function crime(w,amount) {
  w.player.heat=Math.min(5,w.player.heat+amount);w.escapeTime=0;
}

export function makeWorld(seed=17) {
  const r=rng(seed),buildings=[],cars=[],people=[];
  // Preserve Sunbreak's original seeded blocks, palette and district layout.
  for(let yi=0;yi<roadsY.length-1;yi++) for(let xi=0;xi<roadsX.length-1;xi++) {
    const x=roadsX[xi]+48,y=roadsY[yi]+48,w=304,h=304;
    const count=2+Math.floor(r()*3);
    for(let n=0;n<count;n++) {
      const bw=Math.min(125+r()*80,142),bh=Math.min(110+r()*80,142);
      const bx=x+(n%2)*(w/2)+r()*8,by=y+Math.floor(n/2)*(h/2)+r()*8;
      buildings.push({x:bx,y:by,w:bw,h:bh,color:pick(r,['#a95f47','#c18f57','#54766d','#45616a','#d4bd8c','#745c4c']),height:25+r()*55,sign:pick(r,['MOTEL','PALMA','MARINA','MARKET','SUN','TIDES'])});
    }
  }
  for(let i=0;i<40;i++) {
    const vertical=i%2===0,road=pick(r,vertical?roadsX:roadsY),direction=i%4<2?1:-1;
    cars.push({id:`traffic-${i}`,x:vertical?road:50+r()*(W-100),y:vertical?50+r()*(H-100):road,
      a:vertical?direction*Math.PI/2:direction===1?0:Math.PI,speed:45+r()*35,
      color:pick(r,['#d65542','#e4c56e','#568c88','#d5d8cd','#6c7790','#252d32']),police:false,owned:false,hp:60});
  }
  cars.push({id:'courier',x:760,y:650,a:0,speed:0,color:'#d5d8cd',owned:true,hp:60});
  cars.push({id:'syndicate',x:1500,y:650,a:Math.PI,speed:0,color:'#bc5974',owned:true,hp:80});
  const world={player:{x:365,y:335,a:0,hp:100,cash:450,ammo:12,reserve:60,vehicle:null,heat:0},
    buildings,cars,people,guards:[{id:'ledger-guard',x:1900,y:990,hp:60,cooldown:0}],bullets:[],particles:[],
    mission:0,missionStage:0,complete:[false,false],paused:false,dead:false,clock:0,tick:0,
    toast:'',toastTime:0,seed,escapeTime:0,fireCooldown:0,reloadTime:0,events:[]};
  // A connected road is always preferred over an unvalidated authored coordinate.
  Object.assign(world.player,safeRoad(world,{x:700,y:650}));
  for(let i=0;i<64;i++) {
    const y=pick(r,roadsY)+30,x=70+r()*(W-140);
    if(!blocked(world,x,y,5)) people.push({x,y,a:i%2?0:Math.PI,speed:17+r()*10,shirt:pick(r,['#f2b95e','#c36b54','#d7dbce','#72a895','#8ba6b2'])});
  }
  return world;
}

export function district(x,y) {
  if(x>1700&&y>900) return 'PELICAN MARSH';
  if(x<700&&y>1000) return 'OLD QUARTER';
  if(y<600) return 'GLASS TIDE';
  if(x>1500) return 'VEGA MARKET';
  return 'PALM GARDENS';
}

function movePlayer(w,dt,input) {
  const p=w.player,c=p.vehicle;
  if(c) {
    const throttle=Number(input.held('w'))-Number(input.held('s'));
    c.speed=Math.max(-110,Math.min(300,c.speed+throttle*230*dt));
    c.speed*=Math.pow(input.held(' ')?0.78:0.994,dt*60);
    c.a+=(Number(input.held('d'))-Number(input.held('a')))*dt*(1.1+Math.abs(c.speed)/160);
    if(!moveBody(w,c,Math.cos(c.a)*c.speed*dt,Math.sin(c.a)*c.speed*dt,22,false)) {
      if(Math.abs(c.speed)>80) { p.hp=Math.max(0,p.hp-3);event(w,'car-impact'); }
      c.speed=0;
    }
    if(input.held(' ')&&Math.abs(c.speed)>35&&w.tick%4===0) {
      w.particles.push({x:c.x-Math.cos(c.a)*18,y:c.y-Math.sin(c.a)*18,vx:0,vy:0,life:.7,r:4,color:'#b4ac8a'});
    }
    p.x=c.x;p.y=c.y;
  } else {
    let dx=Number(input.held('d'))-Number(input.held('a')),dy=Number(input.held('s'))-Number(input.held('w'));
    const length=Math.hypot(dx,dy)||1,speed=input.held('shift')?235:160;
    moveBody(w,p,dx/length*speed*dt,dy/length*speed*dt);
    if(dx||dy) p.a=Math.atan2(dy,dx);
  }
}

function moveTraffic(w,c,dt) {
  if(c.owned||c.disabled) return;
  const dx=Math.cos(c.a)*c.speed*dt,dy=Math.sin(c.a)*c.speed*dt;
  if(!moveBody(w,c,dx,dy,22,false)) {
    // Turn around at city boundaries; never teleport across a solid block.
    c.a=(c.a+Math.PI)%TAU;
  }
}

function movePolice(w,c,dt) {
  if(c.disabled||c.owned||w.player.heat<=0) { c.speed=0;return; }
  const p=w.player,target=roadWaypoint(w,c,p),d=distance(c,target);
  c.a=Math.atan2(target.y-c.y,target.x-c.x);c.speed=125+12*p.heat;
  if(d>2) moveBody(w,c,Math.cos(c.a)*Math.min(d,c.speed*dt),Math.sin(c.a)*Math.min(d,c.speed*dt),22,false);
  c.cooldown=Math.max(0,(c.cooldown||0)-dt);
  if(distance(c,p)<180&&clearLine(w,c,p,2)&&c.cooldown===0) {
    w.bullets.push({x:c.x,y:c.y,a:Math.atan2(p.y-c.y,p.x-c.x),speed:380,life:1,hostile:true});
    c.cooldown=1.2;
  }
  if(distance(c,p)<32) p.hp=Math.max(0,p.hp-9*dt);
}

function updateWanted(w,dt) {
  const p=w.player;
  for(const c of w.cars) if(c.police&&c.disabled) c.cleanup=(c.cleanup||0)+dt;
  w.cars=w.cars.filter(c=>!(c.police&&c.disabled&&c.cleanup>15&&distance(c,p)>450));
  if(p.heat<=0) return;
  const patrols=w.cars.filter(c=>c.police&&!c.disabled&&!c.owned);
  if(!patrols.length&&!w.cars.some(c=>c.police)) {
    const candidates=roadsX.flatMap(x=>roadsY.map(y=>({x,y}))).filter(n=>distance(n,p)>360);
    candidates.sort((a,b)=>distance(a,p)-distance(b,p));
    const spawn=candidates[0];
    w.cars.push({...spawn,id:`patrol-${w.tick}`,a:0,speed:140,color:'#dfeee6',police:true,owned:false,hp:80,cooldown:1});
    event(w,'police-dispatched');
  }
  const seen=patrols.some(c=>distance(c,p)<320&&clearLine(w,c,p,2));
  w.escapeTime=seen?0:w.escapeTime+dt;
  if(w.escapeTime>=8) { p.heat=0;event(w,'escaped');message(w,'PURSUIT LOST · KEEP MOVING'); }
}

export function stepWorld(w,dt,input) {
  if(w.paused||w.dead) return;
  if(w.player.hp<=0) { w.dead=true;event(w,'defeat');return; }
  w.clock+=dt;w.tick++;w.toastTime=Math.max(0,w.toastTime-dt);
  movePlayer(w,dt,input);
  for(const c of w.cars) if(c!==w.player.vehicle) {
    if(c.police) movePolice(w,c,dt);else moveTraffic(w,c,dt);
  }
  for(const n of w.people) if(!moveBody(w,n,Math.cos(n.a)*n.speed*dt,0,5,false)) n.a+=Math.PI;
  updateWanted(w,dt);updateCombat(w,dt);
  for(const e of w.particles) { e.x+=e.vx*dt;e.y+=e.vy*dt;e.life-=dt; }
  w.particles=w.particles.filter(e=>e.life>0);
  if(w.player.hp<=0) { w.player.hp=0;w.dead=true;event(w,'defeat'); }
}

export function nearest(w) {
  let best=null,dist=65;
  for(const c of w.cars) {
    const d=distance(w.player,c);
    if(!c.disabled&&d<dist) { best=c;dist=d; }
  }
  return best?{type:'car',obj:best,d:dist}:null;
}

export function toggleCar(w) {
  if(w.paused||w.dead) return;
  const p=w.player;
  if(p.vehicle) {
    const c=p.vehicle;
    for(const offset of [Math.PI/2,-Math.PI/2,Math.PI,0]) {
      const point={x:c.x+Math.cos(c.a+offset)*42,y:c.y+Math.sin(c.a+offset)*42};
      if(!blocked(w,point.x,point.y)) {
        c.speed=0;c.owned=true;p.vehicle=null;Object.assign(p,point);
        event(w,'exit',c.id);message(w,'ON FOOT');return;
      }
    }
    message(w,'NO SAFE EXIT · MOVE THE CAR');return;
  }
  const n=nearest(w);
  if(n) {
    p.vehicle=n.obj;n.obj.owned=true;n.obj.speed=0;p.x=n.obj.x;p.y=n.obj.y;
    crime(w,.85);event(w,'enter',n.obj.id);message(w,'VEHICLE TAKEN · WANTED');
  }
}
