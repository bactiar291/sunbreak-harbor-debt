export function createInput(canvas) {
  const keys=new Set(),pressed=new Set();
  const mouse={x:0,y:0,down:false};
  const reset=()=>{keys.clear();pressed.clear();mouse.down=false;};
  window.addEventListener('keydown',e=>{
    const k=e.key.toLowerCase();
    if(!keys.has(k)) pressed.add(k);
    keys.add(k);
    if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) e.preventDefault();
  });
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',reset);
  canvas.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;});
  canvas.addEventListener('mousedown',()=>mouse.down=true);
  window.addEventListener('mouseup',()=>mouse.down=false);
  return {held:k=>keys.has(k),tap:k=>{const value=pressed.has(k);pressed.delete(k);return value;},mouse:()=>mouse,clear:()=>pressed.clear(),reset};
}
