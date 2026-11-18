// Screen-space UI; never participates in world projection or simulation.
import {W,H,TAU} from './config.js';
import {roadsX,roadsY,district} from './world.js';
import {contextPrompt} from './missions.js';
export function createHUD(){
  const elements=Object.fromEntries(['district','contract','stats','toast','prompt'].map(id=>[id,document.getElementById(id)]));
  function text(id,value){if(elements[id].textContent!==value)elements[id].textContent=value;}
  return function drawHUD(c,w,input,marker,cw,ch){
    const p=w.player,short=ch<=650;
    c.fillStyle='#102f32ed';c.fillRect(24,ch-111,270,68);
    c.fillStyle='#e9ddbc';c.font='bold 10px Arial';c.fillText('REN VALE',37,ch-92);
    c.textAlign='right';c.fillText(Math.ceil(p.hp)+' HP',281,ch-92);c.textAlign='left';
    c.fillStyle='#405d57';c.fillRect(37,ch-83,244,5);c.fillStyle=p.hp>35?'#92cead':'#f29473';c.fillRect(37,ch-83,244*p.hp/100,5);
    c.fillStyle='#ffdb92';c.font='bold 17px Arial';c.fillText('$'+p.cash.toLocaleString(),37,ch-56);
    c.fillStyle='#e5e6cf';c.font='12px Arial';c.fillText(w.reloadTime>0?'RELOADING':p.ammo+' / '+p.reserve+'  AMMO',177,ch-57);
    const ms=short?136:154,mx=cw-ms-30,my=ch-ms-48;
    c.fillStyle='#102f32ed';c.fillRect(mx-6,my-24,ms+12,ms+30);
    c.fillStyle='#e2d7b7';c.font='bold 9px Arial';c.fillText('SUNBREAK / N ↑',mx+4,my-10);
    c.save();c.beginPath();c.rect(mx,my,ms,ms);c.clip();
    c.fillStyle='#b5bd8d';c.fillRect(mx,my,ms,ms);c.fillStyle='#35998f';c.fillRect(mx,my,650/W*ms,560/H*ms);
    c.fillStyle='#5b6c67';for(const x of roadsX)c.fillRect(mx+x/W*ms-2,my,4,ms);for(const y of roadsY)c.fillRect(mx,my+y/H*ms-2,ms,4);
    c.fillStyle='#d1b58b';for(const b of w.buildings)c.fillRect(mx+b.x/W*ms,my+b.y/H*ms,b.w/W*ms,b.h/H*ms);
    for(const v of w.cars)if(v.police&&!v.disabled){c.fillStyle='#97edff';c.fillRect(mx+v.x/W*ms-2,my+v.y/H*ms-2,4,4);}
    if(w.mission<2){c.fillStyle='#ffe28e';c.fillRect(mx+marker.x/W*ms-3,my+marker.y/H*ms-3,6,6);}
    c.fillStyle='#153f40';c.beginPath();c.arc(mx+p.x/W*ms,my+p.y/H*ms,5,0,TAU);c.fill();
    c.fillStyle='#fff4cc';c.beginPath();c.arc(mx+p.x/W*ms,my+p.y/H*ms,3,0,TAU);c.fill();c.restore();
    c.fillStyle='#102f32ed';c.fillRect(cw-229,24,205,43);
    c.fillStyle='#e6d7b7';c.font='bold 9px Arial';c.fillText(p.heat>0?'WANTED / '+(w.escapeTime>0?'LOSING SIGHT':'PURSUIT'):'WANTED / CLEAR',cw-217,39);
    for(let i=0;i<5;i++){c.fillStyle=i<Math.ceil(p.heat)?'#f29170':'#4c6964';c.font='16px Arial';c.fillText('✦',cw-217+i*24,59);}
    const aim=input.mouse();c.strokeStyle='#fff0c4';c.lineWidth=1;
    c.beginPath();c.arc(aim.x,aim.y,6,0,TAU);for(const sign of [-1,1]){c.moveTo(aim.x+sign*9,aim.y);c.lineTo(aim.x+sign*13,aim.y);c.moveTo(aim.x,aim.y+sign*9);c.lineTo(aim.x,aim.y+sign*13);}c.stroke();
    text('district',district(p.x,p.y));
    const title=['01 / BORROWED TIME','02 / SALT IN THE WOUND','CITY / DEBT CLEARED'][w.mission];
    text('contract',title+'\n'+marker.text);
    text('stats',p.vehicle?'DRIVING · '+Math.round(Math.abs(p.vehicle.speed))+' KM/H':'ON FOOT');
    text('toast',w.toastTime>0?w.toast:'');text('prompt',contextPrompt(w));
    if(w.paused||w.dead){
      c.fillStyle='#0b272deb';c.fillRect(cw/2-250,ch/2-85,500,170);
      c.textAlign='center';c.fillStyle='#ffe0a0';c.font='bold 30px Arial';c.fillText(w.dead?'DEFEATED':'CITY PAUSED',cw/2,ch/2-25);
      c.fillStyle='#ede4c9';c.font='16px Arial';c.fillText(w.dead?'Enter · restart with a clean slate':'Esc · resume',cw/2,ch/2+10);
      c.font='12px Arial';c.fillText('WASD move / drive · E vehicle · F contract · R reload',cw/2,ch/2+40);c.textAlign='left';
    }
  };
}
