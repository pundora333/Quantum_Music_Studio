import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultConfig,prepare,probabilities,bloch,concurrence,makeTake,seeded,sample,frequency,centsFor,voicePlan,ratios } from '../dist/quantum.js';
import { exportSession,parseSession,validateConfig } from '../dist/session.js';
const close=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const arrayClose=(a,b)=>a.forEach((x,i)=>close(x,b[i]));
const cfg=overrides=>({...defaultConfig(),...overrides});
test('Computational basis states, left-bit CNOT and normalization',()=>{
  arrayClose(probabilities(prepare(cfg({theta0:0,theta1:0}))),[1,0,0,0]);
  arrayClose(probabilities(prepare(cfg({theta0:Math.PI,theta1:0,cnot:false}))),[0,0,1,0]);
  arrayClose(probabilities(prepare(cfg({theta0:Math.PI,theta1:0,cnot:true}))),[0,0,0,1]);
  arrayClose(probabilities(prepare(cfg({theta0:0,theta1:Math.PI,cnot:true}))),[0,1,0,0]);
});
test('Bell correlations differ between ZZ, XX, YY and cross-basis measurement',()=>{
  const s=prepare(cfg({theta0:Math.PI/2,theta1:0,phi0:0,cnot:true}));
  arrayClose(probabilities(s,'Z','Z'),[.5,0,0,.5]);
  arrayClose(probabilities(s,'X','X'),[.5,0,0,.5]);
  arrayClose(probabilities(s,'Y','Y'),[0,.5,.5,0]);
  arrayClose(probabilities(s,'X','Z'),[.25,.25,.25,.25]);
  close(concurrence(s),1);arrayClose(bloch(s,0),[0,0,0]);arrayClose(bloch(s,1),[0,0,0]);
});
test('Relative phase leaves Z unchanged and changes X or Y statistics',()=>{
  const base={theta0:Math.PI/2,theta1:0,cnot:false};
  const plus=prepare(cfg({...base,phi0:0})),minus=prepare(cfg({...base,phi0:Math.PI})),plusI=prepare(cfg({...base,phi0:Math.PI/2}));
  arrayClose(probabilities(plus),[.5,0,.5,0]);arrayClose(probabilities(minus),[.5,0,.5,0]);
  arrayClose(probabilities(plus,'X','Z'),[1,0,0,0]);arrayClose(probabilities(minus,'X','Z'),[0,0,1,0]);
  arrayClose(probabilities(plusI,'Y','Z'),[1,0,0,0]);arrayClose(bloch(plusI,0),[0,1,0]);
});
test('1000 varied states satisfy Born normalization and pure bipartite identities',()=>{
  const r=seeded(90210);
  for(let n=0;n<1000;n++) {
    const s=prepare(cfg({theta0:r()*Math.PI,theta1:r()*Math.PI,phi0:(2*r()-1)*Math.PI,phi1:(2*r()-1)*Math.PI,cnot:n%2===0}));
    close(s.reduce((a,b)=>a+b[0]**2+b[1]**2,0),1);
    for(const b0 of ['X','Y','Z'])for(const b1 of ['X','Y','Z']){const p=probabilities(s,b0,b1);close(p.reduce((a,b)=>a+b,0),1);assert.ok(p.every(x=>x>=0&&x<=1+1e-12));}
    const ent=concurrence(s);for(const q of [0,1])close(Math.hypot(...bloch(s,q))**2+ent**2,1);
    if(n%2)close(ent,0);
  }
});
test('Seeded takes reproduce exactly and sampling matches Born statistics',()=>{
  const p=[.1,.2,.3,.4];assert.deepEqual(makeTake(p,123),makeTake(p,123));assert.notDeepEqual(makeTake(p,123),makeTake(p,124));
  const r=seeded(123),counts=[0,0,0,0];for(let i=0;i<100000;i++)counts[sample(p,r())]++;
  counts.forEach((n,i)=>assert.ok(Math.abs(n/100000-p[i])<.006));
  assert.deepEqual(makeTake([0,0,1,0],4),Array(16).fill(2));
});
test('12-TET, just and custom frequencies: octave and third are correct',()=>{
  close(frequency(440,12,'equal'),880);close(frequency(440,12,'just'),880);
  close(frequency(440,4,'just'),550);close(frequency(440,4,'equal'),440*2**(1/3));
  close(centsFor(4,'just')-400,-13.6862861351652,1e-8);
  close(frequency(440,4,'custom',1200*Math.log2(5/4)),550);
  close(frequency(440,0,'custom',-1200),220);
});
test('Chord and shot voice plans never exceed bounded total amplitude',()=>{
  const c={...defaultConfig(),probs:[.25,.25,.25,.25],mode:'chord'};
  const v=voicePlan(c,0);assert.equal(v.length,4);close(v.reduce((a,b)=>a+b.amplitude,0),.28);
  const one=voicePlan({...c,mode:'shots'},2);assert.equal(one.length,1);close(one[0].frequency,frequency(c.root,7,c.tuning));
  const bell=voicePlan({...c,probs:[.5,0,0,.5]},0);assert.equal(bell.length,2);
});
test('Export/import preserves experiment and rejects malformed settings',()=>{
  const c=defaultConfig(),session=exportSession(c);assert.deepEqual(parseSession(JSON.stringify(session)),c);
  assert.deepEqual(session.outcomes,makeTake(session.probabilities,c.seed));assert.equal(session.stateAmplitudes.length,4);
  for(const value of [NaN,Infinity,-1,2001])assert.throws(()=>validateConfig({...c,root:value}));
  assert.throws(()=>validateConfig({...c,degrees:[0,4,7,13]}));assert.throws(()=>validateConfig({...c,wave:'<script>'}));
  assert.throws(()=>parseSession('{}'));assert.throws(()=>validateConfig({...c,custom:[0,0,0,99999]}));
});
