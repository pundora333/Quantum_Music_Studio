// Explicit artistic mapping. Relaxation constants are not physical beat periods.
export const TEMPO_MAPPING='bounded-inverse-v1';
export function tempoDefaults(){return {bpm:150,beats:16,sync:false,mode:'model',source:'t2',qubit:0,referenceMs:160,rhythm:true,depth:.75,mapping:TEMPO_MAPPING};}
export function normalizeTempo(c){
  if(c.tempo===undefined&&c.version===5)throw Error('Missing NMR tempo configuration.');
  c.tempo??={bpm:150,beats:16,sync:false};
  const t=c.tempo;
  if(!t||typeof t!=='object'||Array.isArray(t))throw Error('Invalid NMR musical tempo.');
  if(c.version<5){for(const [k,v] of Object.entries({...tempoDefaults(),mode:'fixed',rhythm:false}))if(t[k]===undefined)t[k]=v;}
  const finite=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
  // Older portable sessions may retain fixed tempos outside the new control range.
  if(!finite(t.bpm,c.version===5?120:60,c.version===5?180:300)||typeof t.sync!=='boolean'||![4,8,16,32,64].includes(t.beats)||!['fixed','model'].includes(t.mode)||!['t2','star'].includes(t.source)||![0,1].includes(t.qubit)||!Number.isInteger(t.qubit)||!finite(t.referenceMs,.01,200000)||typeof t.rhythm!=='boolean'||!finite(t.depth,0,1)||t.mapping!==TEMPO_MAPPING)throw Error('Invalid NMR musical tempo.');
  if(c.version<5&&(t.mode!=='fixed'||t.rhythm))throw Error('Rhythmic sonification requires NMR session version 5.');
  if((t.mode==='model'||t.rhythm)&&t.sync)throw Error('Keep audio seconds independent of BPM for rhythmic comparisons.');
  return t;
}
export function tempoInfo(c){
  const t=c.tempo||{bpm:150},model=t.mode==='model',timeMs=c.qubits[t.qubit??0][t.source??'t2'],referenceMs=t.referenceMs??160;
  const bpm=model?120+60/(1+timeMs/referenceMs):t.bpm;
  return {mapping:TEMPO_MAPPING,mode:t.mode??'fixed',bpm,fixedBpm:t.bpm,rangeBpm:[120,180],source:t.source??'t2',qubit:t.qubit??0,timeMs,referenceMs,rhythmEnabled:!!t.rhythm,depth:t.depth??.75,pulsePower:4,formula:'120 + 60 / (1 + T / Tref)',envelope:'(1-depth) + depth * ((1+cos(2*pi*BPM*t_audio/60))/2)^4',physicalWindowMs:c.windowMs,audioDurationSeconds:c.duration,physicalSecondsPerAudioSecond:c.windowMs/1000/c.duration};
}
