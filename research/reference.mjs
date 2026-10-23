// Machine-readable reference runner for cross-language tests; stdin is JSON.
import fs from 'node:fs';
import * as nmr from '../web/dist/studio-model.js';
import * as music from '../web/dist/quantum.js';
import {StereoRenderer,audioConfig} from '../web/dist/studio-audio.js';
const request=JSON.parse(fs.readFileSync(0,'utf8'));
let result;
if(request.action==='music'){
 const c=request.configuration,s=music.prepare(c),p=music.probabilities(s,c.basis0,c.basis1);
 result={state:s,probabilities:p,bloch:[music.bloch(s,0),music.bloch(s,1)],concurrence:music.concurrence(s),take:music.makeTake(p,request.seed??271828)};
}else if(request.action==='evolve'){
 result=Array.from(nmr.evolve(nmr.initialDensity(request.configuration),request.seconds,request.configuration,request.maxStep));
}else if(request.action==='gates'){
 result=Object.fromEntries(request.gates.map(g=>[g.join(','),Array.from(nmr.gateMatrix(...g))]));
}else{
 const d=nmr.acquire(request.configuration,request.options||{});
 if(request.action==='audio'){
  const renderer=new StereoRenderer(d,audioConfig(request.configuration));const blocks=renderer.next(Math.min(renderer.frames,request.frames||44100));result=blocks.map(a=>Array.from(a));
 }else result=Object.fromEntries(Object.entries(d).map(([k,v])=>[k,ArrayBuffer.isView(v)?Array.from(v):Array.isArray(v)?v.map(a=>ArrayBuffer.isView(a)?Array.from(a):a):v]));
}
process.stdout.write(JSON.stringify(result));
