import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {JSDOM} from '../web/node_modules/jsdom/lib/api.js';
const url=process.argv[2],realFetch=globalThis.fetch,temp=await fs.mkdtemp(path.join(os.tmpdir(),'quantum-studio-dom-'));
let dom,calls=[];
try{
 for(const name of ['lab-locale.js','lab-interface.js','lab-language.js','lab-takes.js','take-renderer.js','edit-history.js','lab-presets.js','circuit-pipeline.js','lab-auditions.js','lab-workflow.js','lab-history.js','app.js','studio.js','studio-model.js','studio-model-original.js','density-input.js','music-export.js','music-circuit.js','music-fx.js','music-controls.js','ui.js','python-bridge.js','studio-audio.js','studio-tempo.js','notes.js','quantum.js','audio.js','session.js'])
  await fs.writeFile(path.join(temp,name),await (await realFetch(url+'/'+name)).text());
 await fs.writeFile(path.join(temp,'package.json'),'{"type":"module"}');
 const html=await (await realFetch(url)).text();dom=new JSDOM(html,{url,pretendToBeVisual:true});
 const w=dom.window,ctx=new Proxy({}, {get:(t,k)=>k==='measureText'?()=>({width:50}):k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
 w.HTMLCanvasElement.prototype.getContext=()=>ctx;w.HTMLCanvasElement.prototype.toBlob=function(cb,type){cb(new Blob(['image'],{type}));};
 w.requestAnimationFrame=()=>0;globalThis.requestAnimationFrame=()=>0;
 for(const k of ['window','document','localStorage'])globalThis[k]=w[k];
 const downloads=[];w.HTMLAnchorElement.prototype.click=function(){if(this.download)downloads.push(this.download);else this.dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));};
 URL.createObjectURL=()=> 'blob:mock';URL.revokeObjectURL=()=>{};
 globalThis.fetch=(route,...args)=>{calls.push(route);return realFetch(new URL(route,url),...args);};
 const oldTimeout=globalThis.setTimeout;globalThis.setTimeout=(fn,ms,...args)=>{const t=oldTimeout(fn,ms,...args);if(ms>=8000)t.unref();return t;};
 await import('file://'+path.join(temp,'app.js'));await import('file://'+path.join(temp,'studio.js'));await import('file://'+path.join(temp,'music-controls.js'));localStorage.setItem('pundora-guide-seen-v1','seen');await import('file://'+path.join(temp,'ui.js'));await import('file://'+path.join(temp,'lab-auditions.js'));await import('file://'+path.join(temp,'lab-workflow.js'));await import('file://'+path.join(temp,'lab-history.js'));await import('file://'+path.join(temp,'lab-interface.js')); 
 const $=id=>document.getElementById(id),s=w.quantumStudio;assert.ok(await s.compute());
 assert.match($('s-status').textContent,/Python \/ Qiskit/);
 $('s-clear').click();await s.compute();document.querySelector('[data-palette="H"]').click();document.querySelector('[data-q="0"][data-step="0"]').click();
 const drop=new w.Event('drop',{bubbles:true,cancelable:true});Object.defineProperty(drop,'dataTransfer',{value:{getData:()=> 'CNOT'}});
 document.querySelector('[data-q="0"][data-step="1"]').dispatchEvent(drop);await s.compute();
 let fid=await s.getFID();assert.ok(Math.max(...fid.q0Re.map(Math.abs))<1e-8);assert.equal(s.getConfiguration().circuit.length,2);
 const palette=document.querySelector('[data-palette="Ry"]');palette.focus();assert.equal($('s-tooltip').hidden,false);palette.blur();assert.equal($('s-tooltip').hidden,true);
 $('s-strike').click();await s.compute();fid=await s.getFID();assert.ok(fid.q0Re[0]>.99);
 // Resolve competing requests and verify the newest configuration is displayed.
 const a=s.getConfiguration(),b=structuredClone(a);b.qubits[0].theta=180;b.circuit=[];
 s.setConfiguration(a);s.setConfiguration(b);await s.compute();fid=await s.getFID();assert.ok(Math.abs(fid.q0Re[0])<1e-8);
 const before=downloads.length;$('s-fid-json').click();$('s-fid-csv').click();$('s-download-fid').click();
 for(let i=0;i<100&&downloads.length<before+3;i++)await new Promise(r=>oldTimeout(r,20));
 assert.ok(downloads.includes('Quantum_Studio_FID_Unity.json'));assert.ok(downloads.includes('Quantum_Studio_FID.csv'));assert.ok(downloads.some(x=>x.endsWith('.png')));
 // Music preparation and displayed probabilities pass through the Qiskit endpoint.
 document.querySelector('[data-preset="bell"]').click();
 for(let i=0;i<100&&!$('concurrence').textContent.startsWith('1.000');i++)await new Promise(r=>oldTimeout(r,20));
 assert.equal($('concurrence').textContent,'1.000');assert.match($('probabilities').textContent,/50.0%/);
 assert.ok(calls.includes('/api/music')&&calls.includes('/api/acquire'));
 assert.equal(document.querySelectorAll('[data-palette]').length,16);
 $('s-rho-parras').click();assert.equal($('s-rho-use').disabled,true);$('s-rho-clip').click();await s.compute();fid=await s.getFID();assert.equal(fid.configuration.densityInput.treatment,'clip');assert.ok(Math.abs(fid.q0Re[0]+.06837676)<1e-8);
 $('s-rho-bell').click();$('s-rho-use').click();await s.compute();fid=await s.getFID();assert.ok(Math.max(...fid.q0Re.map(Math.abs))<1e-8);
 $('s-tempo-mode').value='fixed';$('s-tempo-mode').dispatchEvent(new w.Event('change'));$('s-bpm').value='140';$('s-bpm').dispatchEvent(new w.Event('input'));await s.compute();assert.equal((await s.getFID()).audioRhythm.bpm,140);assert.equal(s.getConfiguration().duration,8);s.stop();w.quantumLab.stop();console.log('Python DOM integration passed: API, circuit drag/drop, density import/PSD/Bell, tooltips, stale-request handling, data/image export and Music states.');
}finally{dom?.window.close();await fs.rm(temp,{recursive:true,force:true});}
