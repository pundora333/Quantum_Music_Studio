"""Adapt preserved browser modules in memory to asynchronous Python model calls.

The original web/ snapshot remains byte-for-byte unchanged. Asserted replacements
fail visibly if a future snapshot no longer has the expected call sites.
"""
from pathlib import Path

BRIDGE = r"""
export async function postModel(route,payload){
  const response=await fetch(route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const value=await response.json();if(!response.ok)throw Error(value.error||'Python model request failed');return value;
}
"""
MODEL = r"""
export * from './studio-model-original.js';
import {postModel} from './python-bridge.js';
export async function acquire(configuration,options={}){
  const d=await postModel('/api/acquire',{configuration,options});
  for(const key of ['lines','signal','pop','z','env','hom','noEcho'])d[key]=d[key].map(a=>Float64Array.from(a));
  for(const key of ['initial','beforeReadout','final'])d[key]=Float64Array.from(d[key]);return d;
}
"""


def replace_once(source,old,new):
    if source.count(old)!=1: raise RuntimeError(f'Frontend snapshot mismatch at {old[:70]!r}')
    return source.replace(old,new,1)


def studio_module(source):
    source="import {postModel} from './python-bridge.js';\n"+source
    old=source[source.index('function compute(){'):source.index("document.querySelectorAll('#studio-workbench [data-key]')")]
    new=r"""const pendingModels=new Map();
async function compute(){clearTimeout(timer);try{
  validate(c);const snapshot=JSON.stringify(c),highest=Math.max(1,...c.qubits.map(q=>Math.abs(q.nu)+c.j/2));
  let samples=2048;while(samples<8*highest*c.windowMs/1000&&samples<65536)samples*=2;
  if(!pendingModels.has(snapshot))pendingModels.set(snapshot,acquire(JSON.parse(snapshot),{samples}).finally(()=>pendingModels.delete(snapshot)));
  const result=await pendingModels.get(snapshot);if(JSON.stringify(c)!==snapshot)return compute();
  data=result;plots();inspect();mapping();$('s-status').textContent='Ready · Python / Qiskit · '+(c.model==='nmr'?'synthetic NMR':'abstract qubits');return data;
}catch(e){message(e.message,true);$('s-status').textContent='Python model error';return null;}}
"""
    source=replace_once(source,old,new)
    source=replace_once(source,'function audioReady(){','async function audioReady(){')
    source=replace_once(source,'compute();validate(c);if(Math.max(...data.frequencies','if(!await compute())throw Error(\'Python model is unavailable. Check the terminal.\');validate(c);if(Math.max(...data.frequencies')
    source=source.replace('audioReady();','await audioReady();')
    source=source.replace('da=acquire(a,sampling);db=acquire(b,sampling);','da=await acquire(a,sampling);db=await acquire(b,sampling);')
    source=replace_once(source,'function saveDiagram(id,ext){compute();',"async function saveDiagram(id,ext){if(!await compute())return;")
    source=replace_once(source,'export function fidDocument(){','export async function fidDocument(){')
    source=replace_once(source,"$('s-fid-json').addEventListener('click',()=>", "$('s-fid-json').addEventListener('click',async()=>")
    source=replace_once(source,'JSON.stringify(fidDocument(),null,2)','JSON.stringify(await fidDocument(),null,2)')
    source=replace_once(source,"$('s-fid-csv').addEventListener('click',()=>", "$('s-fid-csv').addEventListener('click',async()=>")
    source=replace_once(source,'const d=fidDocument(),rows=', 'const d=await fidDocument(),rows=')
    source=source.replace('Ready · synthetic NMR','Ready · Python / Qiskit')
    source=source.replace('State calculations, sound and session storage run in your browser.', 'State calculations run on this computer in Python/Qiskit; audio and session storage run in this browser.')
    return source


def music_module(source):
    source="import {postModel} from './python-bridge.js';\nlet pythonSnapshot;\nconst pendingMusic=new Map();\n"+source
    source=replace_once(source,'const [x,y,z]=bloch(state,q)', 'const [x,y,z]=pythonSnapshot.bloch[q]')
    source=replace_once(source,'function compute() {\n  state=prepare(c);p=probabilities(state,c.basis0,c.basis1);',r"""async function compute() {try{
  const snapshot=JSON.stringify(c);
  if(!pendingMusic.has(snapshot))pendingMusic.set(snapshot,postModel('/api/music',{configuration:JSON.parse(snapshot)}).finally(()=>pendingMusic.delete(snapshot)));
  const result=await pendingMusic.get(snapshot);if(JSON.stringify(c)!==snapshot)return compute();
  pythonSnapshot=result;state=result.state;p=result.probabilities;""")
    source=replace_once(source,'const ent=concurrence(state);','const ent=pythonSnapshot.concurrence;')
    source=replace_once(source,'showBloch(0);showBloch(1);renderTake();\n}',"showBloch(0);showBloch(1);renderTake();return true;\n}catch(error){notice(error.message,true);return false;}\n}")
    source=replace_once(source,'try {await synth.play(',"try {if(!await compute())throw Error('Python model is unavailable.');await synth.play(")
    # A single-shot click waits for current Born probabilities, then uses the seeded RNG.
    source=replace_once(source,"async()=>{const outcome=sample(p,shotRng());", "async()=>{if(!await compute())return;const outcome=sample(p,shotRng());")
    # Preserve successive one-shot RNG advancement instead of resetting on every click.
    source=source.replace('shotRng=seeded(c.seed+1);\n  $(\'probabilities\')',"if(globalThis.__musicShotKey!==snapshot){shotRng=seeded(c.seed+1);globalThis.__musicShotKey=snapshot;}\n  $('probabilities')")
    source=replace_once(source,"const outcome=take[Number(b.dataset.step)];", "if(!await compute())return;const outcome=take[Number(b.dataset.step)];")
    # Controls may be used before the initial asynchronous response is available.
    source=source.replace('function renderTake() {','function renderTake() {if(!take)return;')
    return source


def index_page(source):
    source=source.replace('<head>', '<head><meta name="referrer" content="no-referrer">',1)
    source=source.replace('<title>Pundora / Quantum Music Studio</title>','<title>Pundora / Quantum Music Studio · Python</title>')
    source=source.replace('This site is hosted with owner-only access.', 'This local Python edition is served only on 127.0.0.1 on this computer.')
    source=source.replace('State calculations, sound and session storage run in your browser.', 'State calculations run locally in Python/Qiskit. Sound and session storage run in your browser.')
    source=source.replace('There are no analytics, external fonts, audio uploads, or quantum-provider calls.', 'There are no analytics, external fonts, audio uploads or quantum-provider calls. Model data is exchanged only with this local Python server.')
    source=source.replace('</header>', '</header><p style="margin:10px auto;max-width:1400px;padding:8px 22px;color:#c4a3f0;font-size:12px" role="note">LOCAL PYTHON EDITION · Qiskit states and gates / SciPy open dynamics · Keep this terminal running. No QPU connection.</p>',1)
    return source


def generated_assets(dist):
    dist=Path(dist)
    return {'/python-bridge.js':BRIDGE,'/studio-model.js':MODEL,
            '/studio.js':studio_module((dist/'studio.js').read_text()),
            '/app.js':music_module((dist/'app.js').read_text()),
            '/index.html':index_page((dist/'index.html').read_text())}
