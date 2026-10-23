import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseDensity,matrixMetrics,effectiveMatrix,PARRAS_INPUT,BELL_INPUT} from '../dist/density-input.js';
import {defaults,validate,initialDensity,acquire,EPSILON} from '../dist/studio-model.js';
const close=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} vs ${b}`);
const input=()=>structuredClone(PARRAS_INPUT);
test('Parras complex input independently matches NumPy analysis, with explicit PSD treatment',()=>{
 const expected=JSON.parse(fs.readFileSync('../research/parras_2026/analysis.json','utf8')),raw=matrixMetrics(input().raw);
 raw.eigenvalues.forEach((v,i)=>close(v,expected.raw.eigenvalues[i]));assert.equal(raw.valid,false);assert.equal(raw.bellFidelitySquared,null);
 raw.bloch.flat().forEach((v,i)=>close(v,expected.raw.bloch.flat()[i]));assert.throws(()=>effectiveMatrix(input()),/Non-PSD/);
 const projected=effectiveMatrix({...input(),treatment:'clip'}),m=matrixMetrics(projected);
 assert.equal(m.valid,true);close(m.bellFidelitySquared,.9428338676806,2e-10);close(Math.hypot(...projected.map((v,i)=>v-input().raw[i])),.0400947517,1e-10);
 const csv=parseDensity(fs.readFileSync('../research/parras_2026/rho_psd.csv','utf8')).raw;projected.forEach((v,i)=>close(v,csv[i],2e-10));
});
test('strict CSV/JSON structure, basis, Hermiticity, trace and finite values',()=>{
 assert.deepEqual(parseDensity(fs.readFileSync('../research/parras_2026/rho_raw.csv','utf8')).raw,input().raw);
 assert.deepEqual(parseDensity(JSON.stringify(input())),input());
 for(const text of ['Experiment_ID;Fidelity\n1;0.9','row,column,real,imag\n00,00,1,0','row,column,real,imag\n00,00,1,0\n00,00,1,0'])assert.throws(()=>parseDensity(text));
 for(const mutate of [x=>x.basis.reverse(),x=>x.raw[1]=.1,x=>x.raw[0]=.7,x=>x.raw[0]=null,x=>x.raw.pop(),x=>x.raw[0]='0.4852']){const x=input();mutate(x);assert.throws(()=>parseDensity(JSON.stringify(x)));}
});
test('portable v4 import controls initial effective state, NMR embedding, gates and FID',()=>{
 const c=defaults();c.version=4;c.tempo.mode='fixed';c.tempo.rhythm=false;c.densityInput=structuredClone(BELL_INPUT);c.circuit=[];validate(c);const r=initialDensity(c);close(r[0],(1-EPSILON)/4+EPSILON/2);close(r[6],EPSILON/2);
 const d=acquire(c,{samples:16});d.signal.flatMap(x=>Array.from(x)).forEach(v=>close(v,0));
 c.densityInput={...input(),treatment:'clip'};const restored=validate(JSON.parse(JSON.stringify(c)));assert.deepEqual(restored,c);close(acquire(restored,{samples:16}).signal[0][0],-.06837676,1e-8);
 c.densityInput.treatment='none';assert.throws(()=>validate(c));c.densityInput.treatment='clip';c.version=3;assert.throws(()=>validate(c),/version 4/);
});
test('degenerate complex pure states, maximally mixed state and clipping preserve eigenvectors',()=>{
 for(let k=0;k<20;k++){const psi=Array.from({length:4},(_,j)=>[Math.sin(k*7+j+1),Math.cos(k+j*3)]),norm=Math.sqrt(psi.flat().reduce((s,x)=>s+x*x,0));psi.forEach(z=>{z[0]/=norm;z[1]/=norm;});const raw=[];for(const [a,b] of psi)for(const [c,d] of psi)raw.push(a*c+b*d,b*c-a*d);
 const m=matrixMetrics(raw);close(m.eigenvalues[3],1);m.eigenvalues.slice(0,3).forEach(v=>close(v,0));const clipped=effectiveMatrix({kind:'effective',basis:['00','01','10','11'],label:'complex pure fixture',raw,treatment:'clip'});clipped.forEach((v,i)=>close(v,raw[i]));}
 const mixed=Array(32).fill(0);for(let i=0;i<4;i++)mixed[10*i]=.25;matrixMetrics(mixed).eigenvalues.forEach(v=>close(v,.25));
});
