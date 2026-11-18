// Canvas orchestration only. Projection remains world minus camera, at 1:1 scale.
import {W,H,TAU} from './config.js';
import {objective} from './missions.js';
import {bakeScenery} from './scenery.js';
import {drawActors} from './actors.js';
import {createHUD} from './hud.js';
export function createRenderer(canvas){
  const ctx=canvas.getContext('2d'),camera={x:0,y:0},hud=createHUD();
  let cw=0,ch=0,dpr=1,scenery=null,sceneryWorld=null;
  function resize(){
    dpr=Math.min(devicePixelRatio||1,1.5);cw=innerWidth;ch=innerHeight;
    canvas.width=cw*dpr;canvas.height=ch*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize',resize);resize();
  function draw(w,input){
    const p=w.player;
    camera.x+=(Math.max(0,Math.min(W-cw,p.x-cw/2))-camera.x)*.16;
    camera.y+=(Math.max(0,Math.min(H-ch,p.y-ch/2))-camera.y)*.16;
    if(!scenery||sceneryWorld!==w){scenery=bakeScenery(w);sceneryWorld=w;}
    ctx.clearRect(0,0,cw,ch);ctx.save();ctx.translate(-camera.x,-camera.y);
    scenery(ctx,camera,cw,ch);
    const marker=objective(w);
    if(w.mission<2){
      const pulse=24+Math.sin(w.clock*3)*2;
      ctx.strokeStyle='#fff0ad';ctx.lineWidth=2;ctx.setLineDash([5,5]);
      ctx.beginPath();ctx.arc(marker.x,marker.y,pulse,0,TAU);ctx.stroke();ctx.setLineDash([]);
    }
    drawActors(ctx,w,input,camera,cw,ch);ctx.restore();
    hud(ctx,w,input,marker,cw,ch);
  }
  draw.camera=camera;return draw;
}
