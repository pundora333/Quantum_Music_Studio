import {defaultConfig} from './quantum.js';
import {MOLECULES} from './studio-model.js';
const copy=x=>JSON.parse(JSON.stringify(x)),r=Math.PI/2;
export const MUSIC_PRESETS=[
 {id:'basic',label:'Independent qubits',fields:['theta0','theta1','phi0','phi1','cnot','circuit','basis0','basis1','mode']},
 {id:'pulse',label:'Psy pulse',fields:['theta0','theta1','phi0','phi1','cnot','circuit','basis0','basis1','mode']},
 {id:'bell',label:'Bell · preparation CNOT',fields:['theta0','theta1','phi0','phi1','cnot','circuit','basis0','basis1','mode']},
 {id:'phase',label:'Phase · X readout',fields:['theta0','theta1','phi0','phi1','cnot','circuit','basis0','basis1','mode']},
 {id:'ground',label:'Ground state',fields:['theta0','theta1','phi0','phi1','cnot','circuit','basis0','basis1','mode']},
 ...[['empty','Empty |00⟩'],['x','X on q0'],['h','H on q0'],['hh','H → H'],['hzh','H → Z → H'],['gate-bell','Bell · H → CNOT']].map(([id,label])=>({id,label,fields:['theta0','theta1','phi0','phi1','cnot','circuit','basis0','basis1','root','degrees','tuning','mode']})),
 {id:'tuning',label:'Bell · Just tuning',fields:['theta0','theta1','phi0','phi1','cnot','circuit','basis0','basis1','mode','tuning']},
 {id:'clean-sine',label:'Clean sine instrument',fields:['fx','wave','cutoff','volume']}
];
export const STUDIO_PRESETS=[...MOLECULES.map(m=>({id:'molecule-'+m.id,label:m.name+' · illustrative molecule',fields:['molecule','j','qubits[].nu','qubits[].t1','qubits[].t2','qubits[].star','source']})),...['single','both','bell','echo'].map(id=>({id,label:{single:'90° strike · q0',both:'90° strike · both',bell:'Bell · silent local FID',echo:'Hahn echo lesson'}[id],fields:['densityInput (removed)','qubits[].theta','qubits[].phi','qubits[].radius','readout','echo','circuit',...(id==='echo'?['j','qubits[].nu','tauMs']:[])]}))];
export function applyPreset(bench,c,id){const n=copy(c);if(bench==='music'){
 if(!MUSIC_PRESETS.some(p=>p.id===id))throw Error('Unknown Music preset');if(id==='clean-sine'){Object.assign(n,{fx:defaultConfig().fx,wave:'sine',cutoff:16000,volume:-12});return n;}
 Object.assign(n,{theta0:r,theta1:r,phi0:0,phi1:0,cnot:false,circuit:[],basis0:'Z',basis1:'Z',mode:'shots'});
 if(id==='pulse')Object.assign(n,{theta1:Math.PI*.32,cnot:true});if(id==='bell'||id==='tuning')Object.assign(n,{theta1:0,cnot:true});if(id==='phase')Object.assign(n,{theta1:0,basis0:'X'});if(id==='ground')Object.assign(n,{theta0:0,theta1:0});if(id==='tuning')n.tuning='just';
 const types={empty:[],x:['X'],h:['H'],hh:['H','H'],hzh:['H','Z','H'],'gate-bell':['H','CNOT']}[id];if(types)Object.assign(n,{theta0:0,theta1:0,root:435*2**(-9/12),degrees:[0,4,7,12],tuning:'equal',circuit:types.map(type=>({type,q:0}))});return n;
 }
 if(!STUDIO_PRESETS.some(p=>p.id===id))throw Error('Unknown NMR preset');if(id.startsWith('molecule-')){const m=MOLECULES.find(m=>m.id===id.slice(9));n.molecule=m.id;n.j=m.j;n.qubits.forEach((q,i)=>Object.assign(q,{nu:m.nu[i],t1:m.t1[i],t2:m.t2[i],star:m.star[i]}));n.source='Illustrative '+m.name+' preset · '+m.source+' · numerical values are not hardware calibrations';return n;}
 delete n.densityInput;n.qubits.forEach(q=>Object.assign(q,{theta:0,phi:0,radius:1}));n.readout='none';n.echo=id==='echo';n.circuit=id==='bell'?[{step:0,q:0,type:'H'},{step:1,q:0,type:'CNOT'}]:id==='single'?[{step:0,q:0,type:'Ry',angle:90}]:[{step:0,q:0,type:'Ry',angle:90},{step:0,q:1,type:'Ry',angle:90}];if(id==='echo'){n.j=0;n.qubits.forEach(q=>q.nu=0);n.tauMs=n.windowMs/4;}return n;
}
export function presetInfo(bench,id){return (bench==='music'?MUSIC_PRESETS:STUDIO_PRESETS).find(p=>p.id===id);}
