import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,validate,acquire} from '../dist/studio-model.js';
import {tempoInfo} from '../dist/studio-tempo.js';
import {StereoRenderer,audioConfig,referenceToneData} from '../dist/studio-audio.js';
test('bounded inverse tempo has reference, octave examples, monotonicity and independent source selection',()=>{
 const c=defaults();assert.equal(c.version,5);assert.equal(tempoInfo(c).bpm,150);
 const values=[.1,80,160,320,200000].map(t=>{c.qubits[0].t2=t;return tempoInfo(c).bpm;});
 assert.deepEqual(values.slice(1,4),[160,150,140]);assert.ok(values.every(v=>v>=120&&v<=180));assert.ok(values.every((v,i)=>!i||v<values[i-1]));
 c.tempo.qubit=1;c.tempo.source='star';c.tempo.referenceMs=80;assert.equal(tempoInfo(c).bpm,150);
 c.qubits[0].star=1;assert.equal(tempoInfo(c).bpm,150);c.tempo.mode='fixed';c.tempo.bpm=132;assert.equal(tempoInfo(c).bpm,132);
});
test('legacy v2/v3/v4 sessions keep old duration and bypass rhythm; v5 validates mapping and range',()=>{
 for(const version of [2,3,4]){const c=defaults();c.version=version;c.tempo={bpm:100,beats:8,sync:true};c.duration=4.8;validate(c);assert.equal(c.tempo.rhythm,false);assert.equal(c.tempo.mode,'fixed');assert.equal(c.duration,4.8);assert.equal(tempoInfo(c).bpm,100);}
 for(const [key,value] of [['bpm',119],['bpm',181],['qubit',2],['referenceMs',0],['depth',NaN],['mapping','unknown'],['source','t1'],['sync',true]]){const c=defaults();c.tempo[key]=value;assert.throws(()=>validate(c));}
 const c=defaults();delete c.tempo;assert.throws(()=>validate(c));
});
test('tempo edits change neither acquisition nor fixed physical-to-audio scaling',()=>{
 const c=defaults(),a=acquire(c,{samples:64}),initial=tempoInfo(c);c.tempo={...c.tempo,mode:'fixed',bpm:180,depth:1,referenceMs:12};const b=acquire(c,{samples:64});
 for(const k of ['signal','lines','env','initial','final'])assert.deepEqual(a[k],b[k]);assert.equal(tempoInfo(c).physicalSecondsPerAudioSecond,initial.physicalSecondsPerAudioSecond);assert.equal(c.duration,8);
});
test('pulse repeats at the declared beat period, bypass/depth-zero are exact and chunking is deterministic',()=>{
 const c=defaults();Object.assign(c,{root:400,j:0,observed:'q0',stereo:'center',duration:2});c.qubits.forEach(q=>q.nu=0);c.tempo.mode='fixed';c.tempo.bpm=120;c.tempo.depth=1;
 const d=referenceToneData(),a=new StereoRenderer(d,audioConfig(c)).next(88200),energy=t=>{const start=Math.round(t*44100);return Math.sqrt(a[0].slice(start,start+441).reduce((s,x)=>s+x*x,0)/441);};
 assert.ok(energy(.5)>100*energy(.25));assert.ok(Math.abs(energy(.5)-energy(1))<1e-7);
 const render=()=>new StereoRenderer(d,audioConfig(c)).next(88200);c.tempo.rhythm=false;const dry=render();c.tempo.rhythm=true;c.tempo.depth=0;assert.deepEqual(render(),dry);
 c.tempo.depth=.8;const whole=render(),r=new StereoRenderer(d,audioConfig(c)),chunks=[[],[]];for(let i=0;i<88200;i+=137){const block=r.next(Math.min(137,88200-i));for(let q=0;q<2;q++)chunks[q].push(...block[q]);}for(let q=0;q<2;q++)assert.deepEqual(Float32Array.from(chunks[q]),whole[q]);
});
