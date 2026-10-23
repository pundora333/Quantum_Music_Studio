import test from 'node:test';import assert from 'node:assert/strict';
import {defaultConfig,prepare,probabilities,makeTake} from '../dist/quantum.js';
import {exportSession,parseSession} from '../dist/session.js';
import {musicRenderPlan,renderMusicBuffer,encodeMusic} from '../dist/music-export.js';
function snapshot(){const c=defaultConfig();c.probs=probabilities(prepare(c));return {c,take:makeTake(c.probs,c.seed)};}
test('beginner preparation is unentangled, equal-tempered and restores older sessions',()=>{
 const {c}=snapshot();assert.equal(c.cnot,false);assert.equal(c.tuning,'equal');c.probs.forEach(p=>assert.ok(Math.abs(p-.25)<1e-14));const old=exportSession(c);delete old.config.exportLoops;assert.equal(parseSession(JSON.stringify(old)).exportLoops,1);const saved=exportSession({...c,exportLoops:3});assert.equal(saved.audioExport.sequenceSeconds,9.6);assert.equal(parseSession(JSON.stringify(saved)).exportLoops,3);
});
test('loop plan is tempo-aligned, finite, stereo PCM-safe and validates loop count',()=>{
 const {c,take}=snapshot(),p=musicRenderPlan(c,take);assert.equal(p.duration,3.2);assert.equal(p.frames,154350);assert.equal(p.sampleRate,44100);assert.equal(musicRenderPlan({...c,bpm:120,division:4,exportLoops:2},take).duration,4);
 for(const n of [0,1.5,17,NaN])assert.throws(()=>musicRenderPlan({...c,exportLoops:n},take));assert.throws(()=>musicRenderPlan(c,[0]));
});
test('offline render schedules the live oscillator graph and trims only its scheduling lead',async()=>{
 const {c,take}=snapshot();c.wave='sine';let ctx,params;const events=[],param=()=>({value:0,setValueAtTime(v,t){events.push([v,t]);},linearRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}}),node=()=>({connect(){},disconnect(){}});
 const result=await renderMusicBuffer(c,take,{contextFactory:(channels,frames,sr)=>{params={channels,frames,sr};ctx={destination:{},currentTime:0,createBiquadFilter:()=>({...node(),frequency:param()}),createGain:()=>({...node(),gain:param()}),createDynamicsCompressor:()=>({...node(),threshold:{},ratio:{}}),createAnalyser:()=>({...node()}),createOscillator:()=>({...node(),frequency:param(),start(t){events.push(['start',t]);},stop(){}}),startRendering:async()=>({getChannelData:q=>Float32Array.from({length:frames},(_,i)=>i/sr+q)})};return ctx;}});
 assert.equal(params.channels,2);assert.equal(params.sr,44100);assert.equal(events.filter(e=>e[0]==='start').length,16);assert.equal(result.channels[0].length,result.plan.frames);assert.ok(Math.abs(result.channels[0][0]-.07)<1e-7);assert.ok(Math.abs(result.channels[1][0]-result.channels[0][0]-1)<1e-6);
});
test('WAV encoding has exact frame count and little-endian PCM; cancellation produces no file',async()=>{
 const channels=[Float32Array.of(-.5,0,.5),Float32Array.of(.25,0,-.25)],blob=await encodeMusic(channels,'wav'),b=new DataView(await blob.arrayBuffer());assert.equal(blob.size,44+3*4);assert.equal(b.getUint16(22,true),2);assert.equal(b.getUint32(24,true),44100);assert.equal(b.getUint32(40,true),12);assert.equal(b.getInt16(44,true),-16383);assert.equal(b.getInt16(46,true),8192);
 const a=new AbortController();a.abort();await assert.rejects(encodeMusic(channels,'wav',{signal:a.signal}),e=>e.name==='AbortError');
});
