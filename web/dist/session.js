import {validateMusicCircuit} from './music-circuit.js';
import {validateMusicFX,musicTail} from './music-fx.js';
import { defaultConfig, prepare, probabilities, makeTake, frequency } from './quantum.js';
const ranges={theta0:[0,Math.PI],theta1:[0,Math.PI],phi0:[-Math.PI,Math.PI],phi1:[-Math.PI,Math.PI],root:[40,2000],bpm:[60,300],gate:[0.2,0.95],cutoff:[300,16000],volume:[-36,-6],seed:[0,4294967295]};
export function validateConfig(candidate) {
  if(!candidate||typeof candidate!=='object')throw new Error('Missing experiment settings.');
  const clean=defaultConfig();
  for(const [key,[low,high]] of Object.entries(ranges)) {
    const v=candidate[key];if(typeof v!=='number'||!Number.isFinite(v)||v<low||v>high)throw new Error(`Invalid ${key}: expected ${low} to ${high}.`);clean[key]=v;
  }
  if(!Number.isInteger(clean.seed))throw new Error('Seed must be an integer.');
  if(typeof candidate.cnot!=='boolean')throw new Error('CNOT must be true or false.');clean.cnot=candidate.cnot;
  for(const [key,allowed] of Object.entries({basis0:['X','Y','Z'],basis1:['X','Y','Z'],tuning:['equal','just','custom'],mode:['shots','chord'],wave:['sine','triangle','sawtooth'],division:[1,2,4]})) {
    if(!allowed.includes(candidate[key]))throw new Error(`Invalid ${key}.`);clean[key]=candidate[key];
  }
  for(const [key,low,high,integer] of [['degrees',0,12,true],['custom',-1200,2400,false]]) {
    const a=candidate[key];if(!Array.isArray(a)||a.length!==4||a.some(v=>typeof v!=='number'||!Number.isFinite(v)||v<low||v>high||(integer&&!Number.isInteger(v))))throw new Error(`Invalid ${key}.`);clean[key]=a.slice();
  }
  if(candidate.exportLoops!==undefined){if(!Number.isInteger(candidate.exportLoops)||candidate.exportLoops<1||candidate.exportLoops>16)throw new Error('Export loops must be an integer from 1 to 16.');clean.exportLoops=candidate.exportLoops;}
  clean.circuit=validateMusicCircuit(candidate.circuit);clean.fx=validateMusicFX(candidate.fx);
  for(const [key,allowed] of Object.entries({exportFlavor:['clean','processed','both'],exportTail:['include','trim']})){if(candidate[key]!==undefined){if(!allowed.includes(candidate[key]))throw Error('Invalid '+key);clean[key]=candidate[key];}}
  return clean;
}
export function exportSession(config) {
  const c=validateConfig(config),state=prepare(c),p=probabilities(state,c.basis0,c.basis1);
  return {application:'Pundora Quantum Music Studio',version:2,createdAt:new Date().toISOString(),referenceA4Hz:435,audioExport:{sampleRateHz:44100,loops:c.exportLoops,sequenceSeconds:16*c.exportLoops*60/c.bpm/c.division,tailSeconds:musicTail(c,c.exportFlavor==='clean'?'clean':'processed').tail,variant:c.exportFlavor,tailPolicy:c.exportTail,tailCapped:musicTail(c,c.exportFlavor==='clean'?'clean':'processed').capped,variantTails:{clean:musicTail(c,'clean').tail,processed:musicTail(c).tail},chain:'oscillator/envelope -> low-pass -> ordered classical FX -> output level -> compressor; clean bypasses FX; same graph as live Music Lab'},model:'Ideal pure-state two-qubit simulation; q0 is left bit; independently re-prepared shots; seeded classical sampling.',config:c,stateAmplitudes:state,probabilities:p,outcomes:makeTake(p,c.seed),frequenciesHz:c.degrees.map((d,i)=>frequency(c.root,d,c.tuning,c.custom[i]))};
}
export function parseSession(text) {const data=JSON.parse(text);if(!['Pundora Quantum Music Studio','Pundora Quantum Music Lab'].includes(data.application)||![1,2].includes(data.version))throw new Error('Use a version 1 or 2 Music studio session.');return validateConfig(data.config);}
