import {musicTail} from './music-fx.js';
import {Instrument} from './audio.js';
import {wavHeader,pcm16} from './studio-audio.js';
export const MUSIC_SAMPLE_RATE=44100, MUSIC_TAIL=.3;
export function musicRenderPlan(c,take,variant='processed',preview=false){
  if(!Number.isInteger(c.exportLoops)||c.exportLoops<1||c.exportLoops>16||!Array.isArray(take)||take.length!==(preview?1:16)||take.some(x=>!Number.isInteger(x)||x<0||x>3))throw Error('Choose 1–16 loops of the current 16-step take.');
  if(!Number.isFinite(c.bpm)||c.bpm<60||c.bpm>300||![1,2,4].includes(c.division))throw Error('Invalid tempo or step duration.');
  const step=preview?.5:60/c.bpm/c.division,loops=preview?1:c.exportLoops,duration=take.length*loops*step;
  const tailInfo=musicTail(c,variant);return {step,duration,...tailInfo,frames:Math.round((duration+tailInfo.tail)*MUSIC_SAMPLE_RATE),sampleRate:MUSIC_SAMPLE_RATE,loops};
}
export async function renderMusicBuffer(c,take,{contextFactory,signal,variant='processed',preview=false}={}){
  const plan=musicRenderPlan(c,take,variant,preview),sound=variant==='clean'?{...c,fx:{...c.fx,bypass:true}}:c,lead=.07,leadFrames=Math.round(lead*plan.sampleRate),Context=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;
  if(!contextFactory&&!Context)throw Error('Offline audio rendering is unavailable in this browser. Try a current desktop browser.');
  if(signal?.aborted)throw new DOMException('Export cancelled','AbortError');
  const ctx=contextFactory?contextFactory(2,plan.frames+leadFrames,plan.sampleRate):new Context(2,plan.frames+leadFrames,plan.sampleRate);
  // Reuse the live graph and scheduler: oscillator/envelope -> low-pass -> level
  // -> compressor. The lead is rendered then trimmed to align the first step.
  const instrument=new Instrument(()=>ctx);await instrument.unlock();instrument.controls(sound);
  for(let i=0;i<take.length*plan.loops;i++)instrument.schedule(sound,take[i%take.length],lead+i*plan.step,plan.step);
  const buffer=await ctx.startRendering();if(signal?.aborted)throw new DOMException('Export cancelled','AbortError');
  const channels=[0,1].map(q=>buffer.getChannelData(q).slice(leadFrames,leadFrames+plan.frames));
  if(plan.capped||plan.trimmed){const fade=Math.min(Math.round(.02*plan.sampleRate),plan.frames);for(const channel of channels)for(let i=0;i<fade;i++)channel[channel.length-fade+i]*=1-i/(fade-1);}
  let peak=0;for(const channel of channels)for(const sample of channel)peak=Math.max(peak,Math.abs(sample));
  return {plan,channels,peak,clipped:peak>=1};
}
export async function encodeMusic(channels,format,{signal,progress=()=>{},encoderFactory}={}){
  if(!['wav','mp3'].includes(format))throw Error('Unsupported music export format.');
  const frames=channels[0].length;if(channels.length!==2||channels[1].length!==frames)throw Error('Stereo channel lengths differ.');
  const encoder=format==='mp3'?(encoderFactory?encoderFactory():new globalThis.lamejs.Mp3Encoder(2,MUSIC_SAMPLE_RATE,128)):null,chunks=encoder?[]:[wavHeader(frames,MUSIC_SAMPLE_RATE)];
  for(let at=0,tick=0;at<frames;tick++){
    if(signal?.aborted)throw new DOMException('Export cancelled','AbortError');
    const size=Math.min(encoder?1152:8192,frames-at),pcm=pcm16(channels.map(c=>c.subarray(at,at+size)));
    if(encoder){const bytes=encoder.encodeBuffer(pcm.left,pcm.right);if(bytes.length)chunks.push(new Uint8Array(bytes));}
    else{const bytes=new ArrayBuffer(size*4),view=new DataView(bytes);for(let i=0;i<pcm.interleaved.length;i++)view.setInt16(i*2,pcm.interleaved[i],true);chunks.push(bytes);}
    at+=size;if(tick%30===0){progress(at/frames);await new Promise(r=>setTimeout(r,0));}
  }
  if(encoder){const tail=encoder.flush();if(tail.length)chunks.push(new Uint8Array(tail));}progress(1);
  return new Blob(chunks,{type:encoder?'audio/mpeg':'audio/wav'});
}
export async function exportMusic(c,take,format,options={}){const rendered=await renderMusicBuffer(c,take,options);return {blob:await encodeMusic(rendered.channels,format,options),plan:rendered.plan,peak:rendered.peak,clipped:rendered.clipped};}
