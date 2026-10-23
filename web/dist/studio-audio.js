import {tempoInfo} from './studio-tempo.js';
import {mappedFrequencies} from './studio-model.js';
// This class is also serialized into the offline-compatible AudioWorklet.
export class StereoRenderer {
  constructor(data,config,sampleRate=44100){this.data=data;this.c=config;this.sr=sampleRate;this.frames=Math.round(config.duration*sampleRate);this.at=0;this.random=config.seed>>>0;this.noise=[0,0];}
  value(array,index,component=0,stride=1){const n=this.data.samples,k=Math.min(n-2,Math.floor(index)),a=index-k;return array[k*stride+component]*(1-a)+array[(k+1)*stride+component]*a;}
  next(count){const out=[new Float32Array(count),new Float32Array(count)],c=this.c,d=this.data,f=c.frequencies,gain=.8*10**(c.level/20),stretch=d.window/c.duration;
    for(let i=0;i<count;i++,this.at++){
      if(this.at>=this.frames)continue;const time=this.at/this.sr,rhythm=c.rhythmAudio,rhythmGain=rhythm?.rhythmEnabled?(1-rhythm.depth)+rhythm.depth*((1+Math.cos(2*Math.PI*rhythm.bpm*time/60))/2)**rhythm.pulsePower:1,index=this.frames===1?0:this.at/(this.frames-1)*(d.samples-1),attack=Math.min(1,this.at/(this.sr*.005)),release=Math.min(1,(this.frames-1-this.at)/(this.sr*.02));
      for(let q=0;q<2;q++){
        if(c.observed!=='both'&&c.observed!=='q'+q)continue;
        const env=this.value(d.env[q],index),loss=1-env;this.random^=this.random<<13;this.random^=this.random>>>17;this.random^=this.random<<5;this.noise[q]=.998*this.noise[q]+.002*((this.random>>>0)/2147483648-1);
        const texture=c.fx*loss*(.65*Math.sin(2*Math.PI*(2.7+q*.8)*time)+3*this.noise[q]),phaseOffset=texture*3;let sample=0;
        if(c.sound==='fid'){const phase=2*Math.PI*f[q===0?0:2]*time+phaseOffset;sample=this.value(d.signal[q],index,0,2)*Math.cos(phase)-this.value(d.signal[q],index,1,2)*Math.sin(phase);}
        else if(c.sound==='transitions'){for(let j=q*2;j<q*2+2;j++){const phase=2*Math.PI*f[j]*time+phaseOffset;sample+=this.value(d.lines[j],index,0,2)*Math.cos(phase)-this.value(d.lines[j],index,1,2)*Math.sin(phase);}}
        else {const p=this.value(d.pop[q],index),base=f[q===0?0:2];sample=p*Math.sin(2*Math.PI*2*base*time+phaseOffset);if(c.sound==='population')sample+=(1-p)*Math.sin(2*Math.PI*base*time+phaseOffset);}
        if(c.fx>0)sample=(1-c.fx*.5)*sample+c.fx*.5*Math.tanh(sample*(1+3*loss));
        out[q][i]=Math.max(-.99,Math.min(.99,sample*gain*attack*release*rhythmGain));
      }
      if(c.stereo==='center'){const mono=(out[0][i]+out[1][i])/(c.observed==='both'?2:1);out[0][i]=out[1][i]=mono;}
    }return out;
  }
}
export function audioConfig(c){const f=mappedFrequencies(c),stretch=c.windowMs/1000/c.duration,max=Math.max(...f)*(['population','excitation'].includes(c.sound)?2:1)+Math.max(...c.qubits.map(q=>Math.abs(q.nu))) *stretch+c.j*stretch/2;if(max>=44100/2)throw Error('This duration/carrier combination exceeds the audio Nyquist limit. Increase duration or lower the root/offsets.');return {...c,frequencies:f,rhythmAudio:tempoInfo(c)};}
export function referenceToneData(){return {samples:2,window:.001,signal:[Float64Array.of(1,0,1,0),new Float64Array(4)],env:[Float64Array.of(1,1),Float64Array.of(1,1)],lines:Array.from({length:4},()=>new Float64Array(4)),pop:[new Float64Array(2),new Float64Array(2)]};}
export function wavHeader(frames,sampleRate=44100){const size=frames*4;if(size>0xffffffff-36)throw Error('WAV exceeds the 4 GB RIFF limit. Reduce duration or export MP3.');const b=new ArrayBuffer(44),v=new DataView(b),word=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};word(0,'RIFF');v.setUint32(4,36+size,true);word(8,'WAVE');word(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,size,true);return b;}
export function pcm16(channels){const n=channels[0].length,interleaved=new Int16Array(n*2),left=new Int16Array(n),right=new Int16Array(n);for(let i=0;i<n;i++)for(let q=0;q<2;q++){const v=Math.round(Math.max(-1,Math.min(1,channels[q][i]))*32767);interleaved[2*i+q]=v;(q?right:left)[i]=v;}return {interleaved,left,right};}
export async function renderFile(data,c,format,{progress=()=>{},signal,encoderFactory}={}){
  const r=new StereoRenderer(data,audioConfig(c)),chunks=[],encoder=format==='mp3'?(encoderFactory?encoderFactory():new globalThis.lamejs.Mp3Encoder(2,44100,128)):null;
  if(format==='wav')chunks.push(wavHeader(r.frames));else if(format!=='mp3')throw Error('Unsupported format.');
  let ticks=0;while(r.at<r.frames){if(signal?.aborted)throw new DOMException('Export cancelled','AbortError');const n=Math.min(format==='mp3'?1152:8192,r.frames-r.at),pcm=pcm16(r.next(n));if(encoder){const b=encoder.encodeBuffer(pcm.left,pcm.right);if(b.length)chunks.push(new Uint8Array(b));}else{const buffer=new ArrayBuffer(n*4),view=new DataView(buffer);for(let i=0;i<pcm.interleaved.length;i++)view.setInt16(i*2,pcm.interleaved[i],true);chunks.push(buffer);}if(++ticks%40===0){progress(r.at/r.frames);await new Promise(resolve=>setTimeout(resolve,0));}}
  if(encoder){const tail=encoder.flush();if(tail.length)chunks.push(new Uint8Array(tail));}progress(1);return new Blob(chunks,{type:format==='wav'?'audio/wav':'audio/mpeg'});
}
export class StudioPlayer {
  constructor(){this.ctx=null;this.node=null;this.running=false;this.generation=0;this.url=null;}
  async play(data,c,onEnd=()=>{}){
    this.stop();const generation=this.generation;const AudioCtx=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AudioCtx)throw Error('Web Audio is unavailable in this browser.');this.ctx??=new AudioCtx({sampleRate:44100});await this.ctx.resume();if(generation!==this.generation)return;if(this.ctx.state!=='running')throw Error('Audio is suspended. Press Play again after enabling browser audio.');
    const config=audioConfig(c),finish=()=>{if(generation===this.generation){this.stop();onEnd();}};
    let useWorklet=!!this.ctx.audioWorklet&&typeof AudioWorkletNode!=='undefined';
    if(useWorklet){
      const source=`const StereoRenderer=${StereoRenderer.toString()};class FIDProcessor extends AudioWorkletProcessor{constructor(o){super();this.r=new StereoRenderer(o.processorOptions.data,o.processorOptions.config,sampleRate);this.done=false;}process(inputs,outputs){const output=outputs[0];if(this.done)return false;const a=this.r.next(output[0].length);output[0].set(a[0]);output[1].set(a[1]);if(this.r.at>=this.r.frames){this.done=true;this.port.postMessage('done');}return true;}}registerProcessor('pundora-fid',FIDProcessor);`;
      if(!this.workletLoaded){const moduleURL=URL.createObjectURL(new Blob([source],{type:'application/javascript'}));this.url=moduleURL;try{await this.ctx.audioWorklet.addModule(moduleURL);this.workletLoaded=true;}catch(error){useWorklet=false;}finally{URL.revokeObjectURL(moduleURL);if(this.url===moduleURL)this.url=null;}}
    }
    if(generation!==this.generation)return;
    if(useWorklet){this.node=new AudioWorkletNode(this.ctx,'pundora-fid',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2],processorOptions:{data,config}});this.node.port.onmessage=finish;
    }else{const r=new StereoRenderer(data,config,this.ctx.sampleRate);this.node=this.ctx.createScriptProcessor(2048,0,2);this.node.onaudioprocess=e=>{const out=r.next(e.outputBuffer.length);e.outputBuffer.copyToChannel(out[0],0);e.outputBuffer.copyToChannel(out[1],1);if(r.at>=r.frames)setTimeout(finish,0);};}
    this.node.connect(this.ctx.destination);this.running=true;
  }
  async pause(){if(this.running&&this.ctx.state==='running')await this.ctx.suspend();else if(this.running)await this.ctx.resume();}
  stop(){this.generation++;if(this.node){this.node.disconnect();if(this.node.port)this.node.port.onmessage=null;else this.node.onaudioprocess=null;this.node=null;}this.running=false;}
}
