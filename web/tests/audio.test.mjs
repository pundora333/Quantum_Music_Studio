import test from 'node:test';
import assert from 'node:assert/strict';
import { Instrument } from '../dist/audio.js';
import { defaultConfig,prepare,probabilities,makeTake,frequency } from '../dist/quantum.js';
function fakeContext() {
  const param=()=>({value:0,calls:[],setValueAtTime(v,t){this.calls.push(['set',v,t]);},linearRampToValueAtTime(v,t){this.calls.push(['ramp',v,t]);},setTargetAtTime(v,t,k){this.calls.push(['target',v,t,k]);},cancelScheduledValues(t){this.calls.push(['cancel',t]);}});
  const node=()=>({connect(){},disconnect(){}});
  const ctx={state:'suspended',currentTime:0,destination:{},oscillators:[],gains:[],resume(){this.state='running';return Promise.resolve();},createBiquadFilter(){return {...node(),frequency:param()};},createGain(){const n={...node(),gain:param()};this.gains.push(n);return n;},createDynamicsCompressor(){return {...node(),threshold:param(),ratio:param()};},createAnalyser(){return {...node(),getByteTimeDomainData(a){a.fill(128);}};},createOscillator(){const o={...node(),frequency:param(),start(t){this.started=t;},stop(t){this.stopped=t;}};this.oscillators.push(o);return o;}};
  return ctx;
}
const getConfig=()=>{const c=defaultConfig();c.tuning='just';return {...c,probs:probabilities(prepare(c))};};
test('Scheduling creates finite positive-frequency oscillators with attack and release',async()=>{
  const ctx=fakeContext(),i=new Instrument(()=>ctx);await i.unlock();const c=getConfig();i.controls(c);i.schedule(c,2,.1,.2);
  assert.equal(ctx.oscillators.length,1);const o=ctx.oscillators[0];assert.equal(o.type,'triangle');assert.equal(o.frequency.calls[0][1],frequency(c.root,7,'just'));assert.ok(o.started<o.stopped);
  const calls=ctx.gains.at(-1).gain.calls;assert.deepEqual(calls[0],['set',0,.1]);assert.equal(calls.at(-1)[1],0);assert.ok(calls.every(call=>Number.isFinite(call[1])&&call[1]>=0));
});
test('Playback produces a take, stop cancels scheduled nodes and fades master',async()=>{
  const ctx=fakeContext(),i=new Instrument(()=>ctx),c=getConfig(),take=makeTake(c.probs,c.seed);
  await i.play(()=>c,()=>take);assert.equal(i.running,true);assert.ok(i.events.length>0);assert.ok(ctx.oscillators.length>0);
  i.stop();assert.equal(i.running,false);assert.equal(i.timer,null);assert.equal(i.events.length,0);assert.equal(ctx.gains[0].gain.calls.at(-1)[1],0);assert.ok(ctx.oscillators.every(o=>o.stopped===.04));
});
test('A/B preserves outcomes and parameters while changing only tuning',async()=>{
  const ctx=fakeContext(),i=new Instrument(()=>ctx),c=getConfig(),take=makeTake(c.probs,c.seed);let finished=false;
  await i.play(()=>c,()=>take,{compare:true,onFinish:()=>finished=true});const timer=i.timer;
  // Advance simulated audio time while the real scheduler pumps the finite comparison.
  ctx.currentTime=6.6;await new Promise(r=>setTimeout(r,35));
  const events=i.events.slice();assert.equal(events.length,32);assert.deepEqual(events.slice(0,16).map(e=>e.outcome),events.slice(16).map(e=>e.outcome));
  assert.ok(events.slice(0,16).every(e=>e.section==='A · 12-TET'));assert.ok(events.slice(16).every(e=>e.section==='B · Just intonation'));
  const expected=take.map(n=>frequency(c.root,c.degrees[n],'equal'));
  ctx.oscillators.slice(0,16).forEach((o,n)=>assert.ok(Math.abs(o.frequency.calls[0][1]-expected[n])<1e-8));
  ctx.oscillators.slice(16,32).forEach((o,n)=>assert.ok(Math.abs(o.frequency.calls[0][1]-frequency(c.root,c.degrees[take[n]],'just'))<1e-8));
  ctx.currentTime=8;i.consume();assert.equal(finished,true);assert.equal(i.running,false);assert.equal(i.timer,null);i.stop();
});
test('Stop during audio unlock prevents late playback',async()=>{
  const ctx=fakeContext();let done;ctx.resume=()=>new Promise(r=>{done=()=>{ctx.state='running';r();};});const i=new Instrument(()=>ctx),c=getConfig();
  const pending=i.play(()=>c,()=>makeTake(c.probs,c.seed));i.stop();done();await pending;assert.equal(i.running,false);assert.equal(ctx.oscillators.length,0);
});
test('Suspended audio reports failure instead of claiming playback',async()=>{
  const ctx=fakeContext();ctx.resume=()=>Promise.resolve();const i=new Instrument(()=>ctx);await assert.rejects(i.unlock(),/suspended/);assert.equal(i.running,false);
});
