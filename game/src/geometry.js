import {W,H} from './config.js';
export const roadsX = [300,700,1100,1500,1900,2300];
export const roadsY = [250,650,1050,1450];
export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

export function blocked(w,x,y,radius=12) {
  if(x<radius || y<radius || x>W-radius || y>H-radius) return true;
  // The coastal grid is elevated on bridges; water between bridges is solid.
  const bridge = roadsX.some(v=>Math.abs(x-v)<=38-radius) || roadsY.some(v=>Math.abs(y-v)<=38-radius);
  if(x<650+radius && y<560+radius && !bridge) return true;
  return w.buildings.some(b=>x>b.x-radius && x<b.x+b.w+radius && y>b.y-radius && y<b.y+b.h+radius);
}

// Substeps prevent a fast car or bullet from tunnelling through a thin wall.
export function moveBody(w,body,dx,dy,radius=12,slide=true) {
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5));
  let hit=false;
  for(let i=0;i<steps;i++) {
    const x=body.x+dx/steps,y=body.y+dy/steps;
    if(!blocked(w,x,y,radius)) { body.x=x;body.y=y;continue; }
    hit=true;
    if(!slide) break;
    if(!blocked(w,x,body.y,radius)) body.x=x;
    if(!blocked(w,body.x,y,radius)) body.y=y;
  }
  return !hit;
}

export function clearLine(w,a,b,radius=22) {
  const steps=Math.ceil(distance(a,b)/10);
  for(let i=0;i<=steps;i++) {
    const t=steps?i/steps:0;
    if(blocked(w,a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,radius)) return false;
  }
  return true;
}

export function safeRoad(w,desired,radius=12) {
  const candidates=roadsX.flatMap(x=>roadsY.map(y=>({x,y})));
  candidates.sort((a,b)=>distance(a,desired)-distance(b,desired));
  return candidates.find(p=>!blocked(w,p.x,p.y,radius));
}

// Visibility graph over the connected road intersections. The first waypoint
// may be a projection onto a road, so patrols do not cut through city blocks.
export function roadWaypoint(w,from,to) {
  if(blocked(w,to.x,to.y,22)) {
    const projections=[...roadsX.map(x=>({x,y:to.y})),...roadsY.map(y=>({x:to.x,y}))]
      .filter(p=>!blocked(w,p.x,p.y,22)).sort((a,b)=>distance(a,to)-distance(b,to));
    to=projections[0]||safeRoad(w,to,22);
  }
  if(clearLine(w,from,to)) return to;
  const nodes=roadsX.flatMap(x=>roadsY.map(y=>({x,y})));
  const costs=nodes.map(n=>clearLine(w,from,n)?distance(from,n):Infinity);
  const first=nodes.map((_,i)=>i), visited=new Set();
  let best=-1,bestCost=Infinity;
  for(let round=0;round<nodes.length;round++) {
    let i=-1;
    for(let j=0;j<nodes.length;j++) if(!visited.has(j)&&(i<0||costs[j]<costs[i])) i=j;
    if(i<0||!Number.isFinite(costs[i])) break;
    visited.add(i);
    if(clearLine(w,nodes[i],to)&&costs[i]+distance(nodes[i],to)<bestCost) {
      best=i;bestCost=costs[i]+distance(nodes[i],to);
    }
    for(let j=0;j<nodes.length;j++) {
      if(nodes[i].x!==nodes[j].x && nodes[i].y!==nodes[j].y) continue;
      const cost=costs[i]+distance(nodes[i],nodes[j]);
      if(cost<costs[j]) { costs[j]=cost;first[j]=distance(from,nodes[first[i]])<3?j:first[i]; }
    }
  }
  return best<0?safeRoad(w,from,22):nodes[first[best]];
}
