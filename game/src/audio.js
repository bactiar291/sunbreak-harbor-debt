// Small local synthesizer: no downloaded assets or network audio.
export function createAudio() {
  let context=null,muted=false;
  return {
    unlock(){context??=new AudioContext();context.resume();},
    toggle(){muted=!muted;return muted;},
    play(type){
      if(!context||muted||context.state!=='running') return;
      const oscillator=context.createOscillator(),gain=context.createGain(),now=context.currentTime;
      oscillator.type=type==='shot'?'sawtooth':'sine';
      oscillator.frequency.setValueAtTime(type==='shot'?150:type==='impact'?90:520,now);
      oscillator.frequency.exponentialRampToValueAtTime(45,now+.12);
      gain.gain.setValueAtTime(.035,now);gain.gain.exponentialRampToValueAtTime(.001,now+.16);
      oscillator.connect(gain).connect(context.destination);oscillator.start();oscillator.stop(now+.17);
    }
  };
}
