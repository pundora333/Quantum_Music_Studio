import {MusicFXRack} from './music-fx.js';
import { voicePlan } from './quantum.js';
export class Instrument {
  constructor(createContext) {this.createContext=createContext;this.ctx=null;this.nodes=new Set();this.events=[];this.running=false;this.timer=null;this.generation=0;}
  async unlock() {
    if(!this.ctx) {
      const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!this.createContext&&!Context)throw new Error('This browser does not support Web Audio. Try a current desktop browser.');
      this.ctx=this.createContext?this.createContext():new Context();
      this.filter=this.ctx.createBiquadFilter();this.filter.type='lowpass';
      this.master=this.ctx.createGain();this.master.gain.value=0;
      this.compressor=this.ctx.createDynamicsCompressor();this.compressor.threshold.value=-8;this.compressor.ratio.value=8;
      this.analyser=this.ctx.createAnalyser();this.analyser.fftSize=1024;
      this.rack=new MusicFXRack(this.ctx,this.filter,this.master);this.master.connect(this.compressor);this.compressor.connect(this.analyser);this.analyser.connect(this.ctx.destination);
    }
    if(typeof this.ctx.startRendering==='function')return;
    await this.ctx.resume();
    if(this.ctx.state!=='running')throw new Error('Audio is suspended. Press Play again to enable sound.');
  }
  controls(c) {this.rack.configure(c);const t=this.ctx.currentTime;this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(10**(c.volume/20),t,0.015);this.filter.frequency.setTargetAtTime(c.cutoff,t,0.02);}
  schedule(config,outcome,start,stepDuration) {
    const end=start+stepDuration*config.gate, release=Math.min(0.065,stepDuration*0.25), attack=Math.min(0.01,stepDuration*0.1);
    for(const v of voicePlan(config,outcome)) {
      const osc=this.ctx.createOscillator(), env=this.ctx.createGain();osc.type=config.wave;osc.frequency.setValueAtTime(v.frequency,start);
      env.gain.setValueAtTime(0,start);env.gain.linearRampToValueAtTime(v.amplitude,start+attack);env.gain.setValueAtTime(v.amplitude,Math.max(start+attack,end-release));env.gain.linearRampToValueAtTime(0,end);
      osc.connect(env);env.connect(this.filter);this.nodes.add(osc);osc.onended=()=>{this.nodes.delete(osc);osc.disconnect();env.disconnect();};osc.start(start);osc.stop(end+0.005);
    }
  }
  async play(getConfig,getTake,{compare=false,steps=Infinity,onFinish=()=>{}}={}) {
    this.stop();const generation=++this.generation;await this.unlock();if(generation!==this.generation)return;
    this.running=true;this.events=[];let step=0,next=this.ctx.currentTime+0.07;
    const snapshot=compare?structuredClone(getConfig()):null, takeSnapshot=compare?getTake().slice():null;
    const tick=()=>{
      if(!this.running)return;
      while(next<this.ctx.currentTime+0.12) {
        if((compare&&step>=32)||step>=steps){clearInterval(this.timer);this.timer=null;this.finishAt=next;this.onFinish=onFinish;return;}
        const c=compare?{...snapshot,tuning:step<16?'equal':snapshot.tuning}:getConfig(), take=compare?takeSnapshot:getTake();
        const duration=60/c.bpm/c.division,outcome=take[step%16];this.controls(c);this.schedule(c,outcome,next,duration);
        this.events.push({time:next,step:step%16,outcome,section:compare?(step<16?'A · 12-TET':'B · '+(snapshot.tuning==='just'?'Just intonation':'Custom cents')):null});
        next+=duration;step++;
      }
    };tick();this.timer=setInterval(tick,25);
  }
  async one(config,outcome) {this.stop();const generation=++this.generation;await this.unlock();if(generation!==this.generation)return;this.controls(config);this.schedule(config,outcome,this.ctx.currentTime+0.025,0.5);}
  stop() {
    this.generation++;this.running=false;clearInterval(this.timer);this.timer=null;this.events=[];this.finishAt=null;
    if(this.ctx){this.rack?.clear();const t=this.ctx.currentTime;this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(0,t,0.006);for(const n of this.nodes){try{n.stop(t+0.04);}catch{}}}
  }
  consume() {const due=[];if(!this.ctx)return due;while(this.events.length&&this.events[0].time<=this.ctx.currentTime)due.push(this.events.shift());if(this.finishAt&&this.ctx.currentTime>=this.finishAt){this.finishAt=null;this.running=false;this.onFinish?.();}return due;}
}
