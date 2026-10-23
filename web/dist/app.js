import {announceTake,frozenTake} from './lab-takes.js';
import {musicTail} from './music-fx.js';
import { defaultConfig, prepare, probabilities, concurrence, bloch, makeTake, seeded, sample, labels, intervals, ratios, ratioNames, frequency, centsFor } from './quantum.js';
import { Instrument } from './audio.js';
import { exportSession, parseSession, validateConfig } from './session.js';
import {exportMusic,musicRenderPlan,renderMusicBuffer} from './music-export.js';
import {noteFrequency,noteOptions,matchedNote} from './notes.js';
const $=id=>document.getElementById(id), deg=Math.PI/180, storageKey='pundora-quantum-lab-v1';
let c=defaultConfig(), state, p, take, shotRng=seeded(c.seed+1), comparing=false, pendingPlay=false;
const synth=new Instrument();
let noticeTimer,fxCompareGeneration=0,fxCompareSources=[],fxCompareTimers=[],auditioning=false;
function notice(message,error=false) {clearTimeout(noticeTimer);$('notice').textContent=message;$('notice').hidden=false;$('notice').style.borderColor=error?'#9d5c70':'';noticeTimer=setTimeout(()=>{$('notice').hidden=true;},8000);}
function round(n,places=3){return Number(n.toFixed(places));}
function showBloch(q) {
  const [x,y,z]=bloch(state,q), color=q===0?'#c4a3f0':'#ed7bb4';
  const px=85+48*x+18*y, py=65-48*z+12*y, len=Math.hypot(x,y,z);
  $('bloch'+q).innerHTML=`<svg viewBox="0 0 170 140" aria-hidden="true"><defs><radialGradient id="sphere${q}" cx="40%" cy="30%"><stop offset="0" stop-color="${color}" stop-opacity=".1"/><stop offset="1" stop-color="${color}" stop-opacity=".01"/></radialGradient><marker id="arrow${q}" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L6 3L0 6" fill="${color}"/></marker></defs><circle cx="85" cy="65" r="48" fill="url(#sphere${q})" stroke="${color}" stroke-opacity=".25"/><ellipse cx="85" cy="65" rx="48" ry="15" fill="none" stroke="${color}" stroke-opacity=".2"/><ellipse cx="85" cy="65" rx="19" ry="48" fill="none" stroke="${color}" stroke-opacity=".15"/><path d="M85 13V117M30 65H139M64 50L110 83" stroke="${color}" stroke-opacity=".13" stroke-dasharray="3 3"/><text x="81" y="9" fill="${color}" opacity=".9" font-size="10">z</text><text x="140" y="68" fill="${color}" opacity=".9" font-size="10">x</text><text x="114" y="89" fill="${color}" opacity=".9" font-size="10">y</text>${len>.005?`<line x1="85" y1="65" x2="${px}" y2="${py}" stroke="${color}" stroke-width="2" marker-end="url(#arrow${q})"/>`:''}<circle cx="${px}" cy="${py}" r="3" fill="${color}"/><text x="85" y="134" text-anchor="middle" fill="${color}" opacity=".9" font-family="SpaceGrotesk, sans-serif" font-size="10">|r| = ${len.toFixed(3)}</text></svg>`;
  $('bloch'+q).setAttribute('aria-label',`Qubit ${q} reduced Bloch vector: x ${x.toFixed(3)}, y ${y.toFixed(3)}, z ${z.toFixed(3)}; length ${len.toFixed(3)}.`);
}
function renderMapping() {
  const custom=c.tuning==='custom';
  $('mapping-rows').innerHTML=labels.map((label,i)=>`<tr><td>|${label}⟩</td><td>${custom?`<input class="custom-input" id="custom${i}" data-map="custom" data-index="${i}" type="number" min="-1200" max="2400" step="0.001" value="${round(c.custom[i])}" aria-label="Outcome ${label} cents from root">`:`<select data-map="degree" data-index="${i}" aria-label="Outcome ${label} musical interval">${intervals.map((name,j)=>`<option value="${j}" ${j===c.degrees[i]?'selected':''}>${name} · ${c.tuning==='just'?ratioNames[j]:j+' semitones'}</option>`).join('')}</select>`}</td><td class="hz" id="hz${i}"></td><td class="delta" id="delta${i}"></td></tr>`).join('');
  for(let i=0;i<4;i++) updateFrequency(i);
  $('tuning-formula').textContent=c.tuning==='equal'?'f = f₀ × 2^(n/12)':c.tuning==='just'?'f = f₀ × ratio':'f = f₀ × 2^(cents/1200)';
  $('tuning-note').textContent=c.tuning==='equal'?'Twelve equal logarithmic steps per octave.':c.tuning==='just'?'Root-relative 5-limit ratios; one JI choice.':'User-defined cents from the reference frequency.';
  $('compare').disabled=c.tuning==='equal';
  $('compare').title=c.tuning==='equal'?'Choose just intonation or custom cents to compare with 12-TET.':'Play A in 12-TET, then B in the selected tuning.';
}
function updateFrequency(i) {
  const freq=frequency(c.root,c.degrees[i],c.tuning,c.custom[i]),delta=centsFor(c.degrees[i],c.tuning,c.custom[i])-c.degrees[i]*100;
  $('hz'+i).textContent=freq.toFixed(2)+' Hz';$('delta'+i).textContent=(Math.abs(delta)<.0005?'0.00':(delta>0?'+':'')+delta.toFixed(2))+' ¢';
}
function renderTake() {
  $('steps').innerHTML=take.map((n,i)=>`<button class="step" data-step="${i}" data-outcome="${n}" aria-label="Step ${i+1}, outcome ${labels[n]}, ${frequency(c.root,c.degrees[n],c.tuning,c.custom[n]).toFixed(2)} hertz"><small>${String(i+1).padStart(2,'0')}</small><span>${labels[n]}</span><span>${c.tuning==='custom'?round(c.custom[n],1)+'¢':intervals[c.degrees[n]]}</span></button>`).join('');
  $('seed-display').textContent='SEED '+c.seed;
  const counts=labels.map((label,i)=>label+': '+take.filter(n=>n===i).length).join('  ·  ');
  $('take-counts').textContent='Observed counts in 16 independent preparations: '+counts;
}
function compute() {
  state=prepare(c);p=probabilities(state,c.basis0,c.basis1);take=makeTake(p,c.seed);shotRng=seeded(c.seed+1);
  $('probabilities').innerHTML=p.map((v,i)=>`<div class="prob-column"><output>${(v*100).toFixed(1)}%</output><div class="prob-bar" style="height:${v*128}px"></div><label>|${labels[i]}⟩</label></div>`).join('');
  $('probabilities').setAttribute('aria-label','Exact probabilities: '+labels.map((l,i)=>l+' '+(p[i]*100).toFixed(1)+' percent').join(', '));
  $('basis-caption').textContent=`Joint measurement in ${c.basis0} ⊗ ${c.basis1}`;$('prob-sum').textContent=p.reduce((a,b)=>a+b,0).toFixed(3);
  const ent=concurrence(state);$('concurrence').textContent=ent.toFixed(3);$('entanglement-label').textContent=ent<1e-8?'Product state':ent>1-1e-8?'Maximal':'Entangled';
  $('circuit-text').textContent='|00⟩ → Ry(θ₀) ⊗ Ry(θ₁) → P(φ₀) ⊗ P(φ₁)'+(c.cnot?' → CNOT₀→₁':'')+c.circuit.map(g=>' → '+g.type+' q'+g.q+(g.angle!==undefined?'('+g.angle+'°)':'')).join('');
  $('state-vector').textContent='|ψ⟩ = '+state.map((a,i)=>`(${a[0].toFixed(4)} ${a[1]<0?'−':'+'} ${Math.abs(a[1]).toFixed(4)}i)|${labels[i]}⟩`).join(' + ');
  document.dispatchEvent(new window.CustomEvent('music:configuration',{detail:JSON.parse(JSON.stringify(c))}));showBloch(0);showBloch(1);renderTake();return true;
}
function syncInputs() {
  for(const name of ['theta0','phi0','theta1','phi1']) {$(name).value=round(c[name]/deg,2);$(name+'-val').textContent=round(c[name]/deg,1)+'°';}
  for(const name of ['basis0','basis1','tuning','mode','bpm','division','wave','volume','cutoff']) {if($(name))$(name).value=c[name];}
  $('root').value=round(c.root);$('root-note').value=matchedNote(c.root);$('gate').value=c.gate*100;$('cnot').checked=c.cnot;
  $('music-loops').value=c.exportLoops;updateMusicDuration();
  $('volume-val').textContent=c.volume+' dB';$('cutoff-val').textContent=(c.cutoff/1000).toFixed(1)+' kHz';$('gate-val').textContent=Math.round(c.gate*100)+'%';
  document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===c.mode);b.setAttribute('aria-pressed',b.dataset.mode===c.mode?'true':'false');});
  $('mode-explanation').textContent=c.mode==='shots'?'Each step simulates a new preparation and measurement. The 16-shot take repeats; it is not repeated collapse of one qubit pair.':'A deterministic chord from exact simulated probabilities: voice amplitude ∝ √p. This uses ensemble information, not one measurement.';
}
function clearPreset() {document.querySelectorAll('[data-preset]').forEach(b=>b.classList.remove('active'));}
function stop(message='Ready to explore') {fxCompareGeneration++;for(const source of fxCompareSources)try{source.stop();source.disconnect();}catch{}fxCompareSources=[];fxCompareTimers.forEach(clearTimeout);fxCompareTimers=[];auditioning=false;synth.stop();comparing=false;pendingPlay=false;$('play').disabled=false;setTransport(false,message);document.querySelectorAll('.step').forEach(b=>b.classList.remove('playing'));}
function onEdit() {if(auditioning)stop('Preview stopped');if(comparing){stop('Comparison stopped');notice('Settings changed. Press Listen A / B to start a new controlled comparison.');}clearPreset();}
function config() {return {...c,probs:p.slice()};}
function setTransport(active,message) {
  $('play').querySelector('span').textContent=active?'Pause':'Play';$('play').setAttribute('aria-label',active?'Pause playback':'Start playback');
  $('playback-status').textContent=message??(active?'Experiment in motion':'Ready to explore');
  $('playback-detail').textContent=active?(comparing?'Same take · fixed parameters · alternate tunings':`${c.bpm} BPM · ${c.mode==='shots'?'independent shot melody':'probability chord'} · 16-step loop`):'Audio starts only when you press Play.';
  $('scope-status').textContent=active?'OUTPUT MONITOR / LIVE':'OUTPUT MONITOR / IDLE';
}
async function start(compare=false) {
  if(pendingPlay)return;if(synth.running&&!compare){stop('Paused');return;}
  stop();const generation=fxCompareGeneration;comparing=compare;pendingPlay=true;$('play').disabled=true;
  try {await synth.play(config,()=>take,{compare,onFinish:()=>{comparing=false;setTransport(false,'A / B complete');document.querySelectorAll('.step').forEach(b=>b.classList.remove('playing'));}});if(synth.running)setTransport(true,compare?'A · 12-TET':'Experiment in motion');}
  catch(error){stop('Audio unavailable');notice(error.message,true);}finally{pendingPlay=false;$('play').disabled=false;}
}
$('play').addEventListener('click',()=>start());$('stop').addEventListener('click',()=>stop('Stopped'));
$('compare').addEventListener('click',()=>{if(c.tuning!=='equal')start(true);});
for(const key of ['theta0','phi0','theta1','phi1']) $(key).addEventListener('input',()=>{onEdit();c[key]=Number($(key).value)*deg;$(key+'-val').textContent=$(key).value+'°';compute();});
$('cnot').addEventListener('change',()=>{onEdit();c.cnot=$('cnot').checked;compute();});
for(const key of ['basis0','basis1']) $(key).addEventListener('change',()=>{onEdit();c[key]=$(key).value;compute();});
for(const key of ['bpm','root']) $(key).addEventListener('input',()=>{
  const v=Number($(key).value),[lo,hi]=key==='root'?[40,2000]:[60,300],valid=$(key).value!==''&&Number.isFinite(v)&&v>=lo&&v<=hi;
  $(key).classList.toggle('input-invalid',!valid);$(key).setAttribute('aria-invalid',valid?'false':'true');if(!valid)return;
  onEdit();c[key]=v;if(key==='root'){$('root-note').value=matchedNote(c.root);for(let i=0;i<4;i++)updateFrequency(i);renderTake();}if(synth.running)setTransport(true);updateMusicDuration();
});
for(const key of ['division','wave','tuning']) $(key).addEventListener('change',()=>{onEdit();c[key]=key==='division'?Number($(key).value):$(key).value;if(key==='tuning'){renderMapping();renderTake();}updateMusicDuration();});
for(const key of ['volume','cutoff','gate']) $(key).addEventListener('input',()=>{onEdit();c[key]=Number($(key).value)/(key==='gate'?100:1);$(key+'-val').textContent=key==='volume'?c.volume+' dB':key==='cutoff'?(c.cutoff/1000).toFixed(1)+' kHz':Math.round(c.gate*100)+'%';if(synth.ctx)synth.controls(config());});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{onEdit();c.mode=b.dataset.mode;syncInputs();if(synth.running)setTransport(true);}));
$('mapping-rows').addEventListener('input',e=>{const input=e.target;if(!input.dataset.map)return;const i=Number(input.dataset.index),v=Number(input.value);if(input.dataset.map==='custom'&&(input.value===''||!Number.isFinite(v)||v< -1200||v>2400)){input.classList.add('input-invalid');input.setAttribute('aria-invalid','true');return;}input.classList.remove('input-invalid');input.setAttribute('aria-invalid','false');onEdit();if(input.dataset.map==='custom')c.custom[i]=v;else c.degrees[i]=v;updateFrequency(i);renderTake();});
document.querySelectorAll('[data-root]').forEach(b=>b.addEventListener('click',()=>{onEdit();c.root=Number(b.dataset.root);syncInputs();renderMapping();renderTake();}));
$('root-note').innerHTML=noteOptions();$('root-note').addEventListener('change',()=>{if($('root-note').value==='')return;onEdit();c.root=noteFrequency(Number($('root-note').value));syncInputs();renderMapping();renderTake();});
function mapChord(degrees) {onEdit();c.degrees=degrees;c.custom=degrees.map(d=>1200*Math.log2(ratios[d]));renderMapping();renderTake();}
$('map-major').addEventListener('click',()=>mapChord([0,4,7,12]));$('map-minor').addEventListener('click',()=>mapChord([0,3,7,12]));
document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{
  stop();const presets={pulse:{theta0:Math.PI/2,theta1:Math.PI*.32,phi0:0,phi1:0,cnot:true,basis0:'Z',basis1:'Z',mode:'shots'},bell:{theta0:Math.PI/2,theta1:0,phi0:0,phi1:0,cnot:true,basis0:'Z',basis1:'Z',mode:'shots'},phase:{theta0:Math.PI/2,theta1:0,phi0:0,phi1:0,cnot:false,basis0:'X',basis1:'Z',mode:'shots'},ground:{theta0:0,theta1:0,phi0:0,phi1:0,cnot:false,basis0:'Z',basis1:'Z',mode:'shots'}};
  Object.assign(c,presets[b.dataset.preset],{circuit:[]});clearPreset();b.classList.add('active');syncInputs();compute();notice(b.dataset.preset==='phase'?'Phase lab: move q0 phase from 0° to 180°. X outcomes shift from 00 to 10. In Z, their probabilities stay 50/50.':b.dataset.preset==='bell'?'Bell pair: only 00 and 11 appear in Z ⊗ Z. Try X ⊗ X, then X ⊗ Z.':'State prepared. Your tuning and sound settings are retained.');
}));
$('new-take').addEventListener('click',()=>{onEdit();c.seed=(c.seed+1)>>>0;compute();});
$('sample').addEventListener('click',async()=>{const outcome=sample(p,shotRng());stop('One independent shot');$('sample-result').textContent=`Outcome ${labels[outcome]} · ${frequency(c.root,c.degrees[outcome],c.tuning,c.custom[outcome]).toFixed(2)} Hz`;try{announceTake(frozenTake('music','Single outcome '+labels[outcome],{...config(),mode:'shots'},{sequence:[outcome],variant:'processed'}));await synth.one({...config(),mode:'shots'},outcome);}catch(error){notice(error.message,true);}});
$('steps').addEventListener('click',async e=>{const b=e.target.closest('[data-step]');if(!b)return;const outcome=take[Number(b.dataset.step)];stop('Auditioning outcome '+labels[outcome]);b.classList.add('playing');try{announceTake(frozenTake('music','Single outcome '+labels[outcome],{...config(),mode:'shots'},{sequence:[outcome],variant:'processed'}));await synth.one({...config(),mode:'shots'},outcome);}catch(error){notice(error.message,true);}setTimeout(()=>b.classList.remove('playing'),550);});
$('save').addEventListener('click',()=>{try{localStorage.setItem(storageKey,JSON.stringify(exportSession(c)));notice('Experiment saved on this device. Settings and seed are preserved.');}catch(error){notice('Could not save locally: '+error.message,true);}});
function restore(text) {const next=parseSession(text);stop();c=next;clearPreset();syncInputs();renderMapping();compute();notice('Experiment restored. Settings, exact probabilities and the seeded take have been recomputed.');}
$('load').addEventListener('click',()=>{try{const data=localStorage.getItem(storageKey);if(!data)throw new Error('No saved experiment on this device yet.');restore(data);}catch(error){notice(error.message,true);}});
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(exportSession(c),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pundora-quantum-session.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Session exported with settings, state, probabilities, frequencies and the 16-shot take.');});
$('import').addEventListener('click',()=>{$('import-file').value='';$('import-file').click();});
$('import-file').addEventListener('change',async()=>{const f=$('import-file').files[0];if(!f)return;try{if(f.size>100000)throw new Error('Session file is too large.');restore(await f.text());}catch(error){notice('Could not import: '+error.message,true);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(synth.running||pendingPlay)){stop('Paused in background');}});
window.addEventListener('pagehide',()=>synth.stop());

let musicAbort=null;
function musicDownload(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function updateMusicDuration(){const plan=musicRenderPlan(c,Array(16).fill(0),c.exportFlavor==='clean'?'clean':'processed');$('music-export-duration').textContent=`Total ${(plan.frames/plan.sampleRate).toFixed(2)} s · ${plan.duration.toFixed(2)} s sequence + ${plan.tail.toFixed(2)} s tail${plan.capped?' (12 s cap)':''}${plan.trimmed?' (FX tail trimmed)':''} · 44.1 kHz stereo`;}
$('music-loops').addEventListener('change',()=>{const n=Number($('music-loops').value);if(!Number.isInteger(n)||n<1||n>16){notice('Choose a whole number of loops from 1 to 16.',true);$('music-loops').value=c.exportLoops;return;}onEdit();c.exportLoops=n;updateMusicDuration();});
for(const format of ['wav','mp3'])$('music-'+format).addEventListener('click',async()=>{if(musicAbort)return;musicAbort=new AbortController();try{if(document.querySelector('#music-workbench [aria-invalid="true"]'))throw Error('Fix highlighted settings before export.');if(!await compute())throw Error('The current state could not be calculated.');stop();const snapshot=structuredClone(config()),sequence=take.slice();$('music-cancel').hidden=false;$('music-wav').disabled=$('music-mp3').disabled=true;const variants=snapshot.exportFlavor==='both'?['clean','processed']:[snapshot.exportFlavor];for(const variant of variants){$('music-export-status').textContent='Rendering '+variant+' snapshot…';const result=await exportMusic(snapshot,sequence,format,{variant,signal:musicAbort.signal,progress:v=>$('music-export-status').textContent=`Encoding ${variant} ${format.toUpperCase()} · ${Math.round(v*100)}%`});musicDownload(result.blob,`Quantum_Music_${variant}_${snapshot.exportLoops}loops_${snapshot.bpm}bpm.${format}`);window.quantumWorkflow?.exported(frozenTake('music','Final circuit',snapshot,{sequence,variant}),format);$('music-export-status').textContent=`${format.toUpperCase()} exported · ${variant} · ${result.plan.duration.toFixed(2)} s sequence + ${result.plan.tail.toFixed(2)} s tail${result.plan.capped?' (12 s cap)':''}${result.plan.trimmed?' (trimmed)':''}. Settings and take frozen. Peak ${(20*Math.log10(Math.max(1e-12,result.peak))).toFixed(1)} dBFS${result.clipped?' · clipping detected; lower the level':''}.`;}}catch(e){$('music-export-status').textContent=e.name==='AbortError'?'Export cancelled.':e.message;}finally{musicAbort=null;$('music-cancel').hidden=true;$('music-wav').disabled=$('music-mp3').disabled=false;}});
$('music-cancel').addEventListener('click',()=>musicAbort?.abort());
$('music-csv').addEventListener('click',async()=>{if(!await compute())return;const session=exportSession(c),rows=['outcome,probability,frequency_hz,count_in_16_step_take,basis_q0,basis_q1,seed'];labels.forEach((label,i)=>rows.push([label,p[i],session.frequenciesHz[i],take.filter(x=>x===i).length,c.basis0,c.basis1,c.seed].join(',')));musicDownload(new Blob([rows.join('\n')],{type:'text/csv'}),'Quantum_Music_Probabilities.csv');notice('Probabilities, mapped frequencies and take counts exported.');});
$('music-diagram').addEventListener('click',async()=>{if(!await compute())return;const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=720;const g=canvas.getContext('2d');g.fillStyle='#100b18';g.fillRect(0,0,1200,720);g.fillStyle='#f4eefa';g.font='28px SpaceGrotesk, sans-serif';g.fillText('Music Lab · exact simulated probabilities',65,58);g.font='20px SpaceGrotesk, sans-serif';g.fillText(`Basis ${c.basis0} ⊗ ${c.basis1} · seed ${c.seed} · independent preparations`,65,96);for(let i=0;i<4;i++){const x=130+i*260,h=p[i]*430;g.fillStyle=['#b99aef','#d878d4','#ee99c8','#85a5ed'][i];g.fillRect(x,580-h,150,h);g.fillStyle='#f4eefa';g.fillText((p[i]*100).toFixed(2)+'%',x+30,560-h);g.fillText('|'+labels[i]+'⟩',x+45,620);g.font='17px SpaceGrotesk, sans-serif';g.fillText(frequency(c.root,c.degrees[i],c.tuning,c.custom[i]).toFixed(2)+' Hz',x+20,655);g.font='20px SpaceGrotesk, sans-serif';}canvas.toBlob(blob=>{if(blob)musicDownload(blob,'Quantum_Music_Probabilities.png');else notice('Could not create the diagram.',true);},'image/png');});

// Kept available for reproducibility and DOM-level smoke checks, without exposing credentials.
async function audition(candidate,label='circuit preview'){stop();window.quantumStudio?.stop();const checked=validateConfig(candidate),probs=probabilities(prepare(checked),checked.basis0,checked.basis1),sequence=makeTake(probs,checked.seed);announceTake(frozenTake('music',label,{...checked,probs,exportLoops:1},{sequence,variant:'processed'}));auditioning=true;try{await synth.play(()=>({...checked,probs}),()=>sequence,{steps:16,onFinish:()=>stop('Preview complete')});setTransport(true,'Clean '+label);}catch(e){stop();notice(e.message,true);}}
async function compareFX(){stop();const generation=fxCompareGeneration;window.quantumStudio?.stop();if(!await compute()||generation!==fxCompareGeneration)return;const snapshot=structuredClone(config()),sequence=take.slice();auditioning=true;$('playback-status').textContent='Preparing controlled Clean / Processed comparison…';try{const a=await renderMusicBuffer(snapshot,sequence,{variant:'clean'}),b=await renderMusicBuffer(snapshot,sequence,{variant:'processed'});if(generation!==fxCompareGeneration)return;await synth.unlock();if(generation!==fxCompareGeneration)return;const ctx=synth.ctx,first=ctx.currentTime+.07;let at=first;for(const [index,rendered] of [a,b].entries()){const buffer=ctx.createBuffer(2,rendered.plan.frames,44100);rendered.channels.forEach((channel,q)=>buffer.copyToChannel(channel,q));const source=ctx.createBufferSource();source.buffer=buffer;source.connect(synth.analyser);source.start(at);fxCompareSources.push(source);if(index===1){fxCompareTimers.push(setTimeout(()=>{$('playback-status').textContent='B · Processed · same take';},Math.max(0,(at-ctx.currentTime)*1000)));source.onended=()=>{if(generation===fxCompareGeneration)stop('Clean / Processed complete');};}at+=buffer.duration+.15;}setTransport(true,'A · Clean · same take');}catch(e){if(generation===fxCompareGeneration){stop();notice(e.message,true);}}}
function edit(patch,{liveFX=false}={}){const next=validateConfig({...c,...patch}),keep=liveFX&&synth.running&&!auditioning&&!comparing;if(!keep)stop();c=next;if(keep)synth.controls(config());clearPreset();syncInputs();renderMapping();compute();}
window.quantumLab={getSession:()=>exportSession(c),restore,stop,edit,audition,compareFX};
syncInputs();renderMapping();compute();
const canvas=$('scope'),ctx=canvas.getContext('2d'),waveData=new Uint8Array(1024);
function frame() {
  for(const e of synth.consume()) {if(auditioning)continue;document.querySelectorAll('.step').forEach(b=>b.classList.toggle('playing',Number(b.dataset.step)===e.step));if(e.section)$('playback-status').textContent=e.section;}
  if($('m-output-meter')&&synth.ctx){let peak=0;for(const v of waveData)peak=Math.max(peak,Math.abs(v-128)/128);$('m-output-meter').textContent='Output sample peak · '+(peak>0?(20*Math.log10(peak)).toFixed(1)+' dBFS':'silent')+(peak>=.98?' · near full scale':'');}
  if(ctx) {ctx.clearRect(0,0,700,180);ctx.strokeStyle=(synth.running||auditioning)?'#e884bc':'#9073ad';ctx.lineWidth=1.6;ctx.beginPath();if(synth.ctx)synth.analyser.getByteTimeDomainData(waveData);else waveData.fill(128);for(let i=0;i<waveData.length;i++){const x=i/(waveData.length-1)*700,y=90+(waveData[i]-128)/128*70;i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
  requestAnimationFrame(frame);
}requestAnimationFrame(frame);
