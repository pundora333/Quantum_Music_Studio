// Classical electronic audio effects, shared by live Music audio and export.
export function defaultMusicFX(){return {bypass:false,order:['drive','delay','reverb'],drive:{enabled:false,amount:3,mix:.5},delay:{enabled:false,beats:.5,feedback:.35,mix:.25},reverb:{enabled:false,seconds:1.6,mix:.2}};}
export function validateMusicFX(value){
 if(value===undefined)return defaultMusicFX();const f=JSON.parse(JSON.stringify(value));
 if(typeof f.bypass!=='boolean'||!Array.isArray(f.order)||f.order.length!==3||new Set(f.order).size!==3||f.order.some(x=>!['drive','delay','reverb'].includes(x)))throw Error('Invalid FX order or bypass.');
 for(const [name,ranges] of Object.entries({drive:{amount:[1,20],mix:[0,1]},delay:{beats:[.25,2],feedback:[0,.75],mix:[0,1]},reverb:{seconds:[.2,4],mix:[0,1]}})){
  if(!f[name]||typeof f[name].enabled!=='boolean')throw Error('Invalid '+name+' switch.');for(const [key,[lo,hi]] of Object.entries(ranges)){const v=f[name][key];if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw Error('Invalid '+name+' '+key+'.');}
 }return f;
}
export function activeMusicFX(c){const f=validateMusicFX(c.fx);return !f.bypass&&f.order.some(x=>f[x].enabled&&f[x].mix>0);}
export function musicTail(c,variant='processed'){
 let requested=.3;const f=validateMusicFX(c.fx);
 if(variant!=='clean'&&!f.bypass){if(f.delay.enabled&&f.delay.mix>0){const repeats=f.delay.feedback>0?Math.ceil(Math.log(.001)/Math.log(f.delay.feedback))+1:1;requested+=repeats*60/c.bpm*f.delay.beats;}if(f.reverb.enabled&&f.reverb.mix>0)requested+=f.reverb.seconds;}
 const included=c.exportTail!=='trim',tail=included?Math.min(12,requested):.3;
 return {tail,requested,capped:included&&requested>12,trimmed:!included&&requested>.3};
}
export function distortionCurve(amount,length=4097){return Float32Array.from({length},(_,i)=>Math.tanh(amount*(2*i/(length-1)-1))/Math.tanh(amount));}
export function reverbImpulse(ctx,seconds,seed=13579){
 const length=Math.max(1,Math.ceil(seconds*ctx.sampleRate)),b=ctx.createBuffer(2,length,ctx.sampleRate);let n=seed>>>0;
 for(let q=0;q<2;q++){const a=b.getChannelData(q);let energy=0;for(let i=0;i<length;i++){n=(Math.imul(n,1664525)+1013904223)>>>0;a[i]=(n/2147483648-1)*Math.exp(-6.9*i/length);energy+=a[i]*a[i];}const scale=1/Math.sqrt(energy||1);for(let i=0;i<length;i++)a[i]*=scale;}return b;
}
// Persistent dry/wet stages retain live delay memory during parameter changes.
export class MusicFXRack{
 constructor(ctx,input,output){this.ctx=ctx;this.input=input;this.output=output;this.graph=null;this.retiring=new Set();this.timers=new Set();}
 smooth(p,v,initial=false){const t=this.ctx.currentTime||0;if(initial||!p.setTargetAtTime)p.value=v;else{p.cancelScheduledValues?.(t);p.setTargetAtTime(v,t,.025);}}
 dispose(g){if(!g)return;try{this.input.disconnect(g.entry);}catch{}for(const n of g.nodes)try{n.disconnect();}catch{}this.retiring.delete(g);}
 later(fn){const id=setTimeout(()=>{this.timers.delete(id);fn();},180);this.timers.add(id);}
 clear(){for(const t of this.timers)clearTimeout(t);this.timers.clear();this.dispose(this.graph);for(const g of this.retiring)this.dispose(g);this.graph=null;}
 build(order){const ctx=this.ctx,g={nodes:[],stages:{},order:order.join(',')},keep=n=>(g.nodes.push(n),n),gain=v=>{const n=keep(ctx.createGain());n.gain.value=v;return n;};g.entry=gain(1);this.input.connect(g.entry);let current=g.entry;
 for(const name of order){const dry=gain(1),wet=gain(0),sum=gain(1),s={dry,wet};current.connect(dry);dry.connect(sum);wet.connect(sum);
 if(name==='drive'){const pre=gain(1),post=gain(1),shaper=keep(ctx.createWaveShaper());shaper.curve=distortionCurve(20,32769);shaper.oversample='2x';current.connect(pre);pre.connect(shaper);shaper.connect(post);post.connect(wet);Object.assign(s,{pre,post});}
 else if(name==='delay'){const delay=keep(ctx.createDelay(4)),feedback=gain(0);current.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(wet);Object.assign(s,{delay,feedback});}
 else Object.assign(s,{source:current,convolver:null,seconds:null});g.stages[name]=s;current=sum;}g.exit=gain(1);current.connect(g.exit);g.exit.connect(this.output);return g;}
 configure(c){const f=validateMusicFX(c.fx),ctx=this.ctx;if(!ctx.createWaveShaper||!ctx.createDelay||!ctx.createConvolver){if(activeMusicFX(c))throw Error('Audio effects unavailable.');if(!this.graph){const entry=ctx.createGain();this.input.connect(entry);entry.connect(this.output);this.graph={entry,nodes:[entry],stages:{},order:''};}return;}
 let initial=!this.graph;if(!this.graph||this.graph.order!==f.order.join(',')){const old=this.graph;this.graph=this.build(f.order);if(old){this.graph.exit.gain.value=0;this.smooth(this.graph.exit.gain,1);this.smooth(old.exit.gain,0);this.retiring.add(old);this.later(()=>this.dispose(old));}initial=true;}
 const g=this.graph;for(const name of f.order){const p=f[name],s=g.stages[name],mix=!f.bypass&&p.enabled?p.mix:0;this.smooth(s.dry.gain,1-mix,initial);this.smooth(s.wet.gain,mix,initial);
 if(name==='drive'){this.smooth(s.pre.gain,p.amount/20,initial);this.smooth(s.post.gain,Math.tanh(20)/Math.tanh(p.amount),initial);}
 if(name==='delay'){this.smooth(s.delay.delayTime,60/c.bpm*p.beats,initial);this.smooth(s.feedback.gain,p.feedback,initial);}
 if(name==='reverb'&&s.seconds!==p.seconds){const old=s.convolver,conv=ctx.createConvolver(),gain=ctx.createGain();conv.normalize=false;conv.buffer=reverbImpulse(ctx,p.seconds);gain.gain.value=initial?1:0;s.source.connect(conv);conv.connect(gain);gain.connect(s.wet);g.nodes.push(conv,gain);s.convolver={conv,gain};s.seconds=p.seconds;if(!initial)this.smooth(gain.gain,1);if(old){this.smooth(old.gain.gain,0);this.later(()=>{try{s.source.disconnect(old.conv);old.conv.disconnect();old.gain.disconnect();}catch{}g.nodes=g.nodes.filter(n=>n!==old.conv&&n!==old.gain);});}}}
 }
}
