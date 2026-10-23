// Ordered, instantaneous ideal unitaries; q0 is the left computational bit.
export const MUSIC_GATES=['H','X','Y','Z','S','S†','T','Rx','Ry','Rz','P','CNOT','CZ','SWAP'];
export function validateMusicCircuit(value=[]){
 if(!Array.isArray(value)||value.length>32)throw Error('Music circuits support at most 32 ordered gates.');
 return value.map(g=>{if(!g||!MUSIC_GATES.includes(g.type)||!Number.isInteger(g.q)||![0,1].includes(g.q))throw Error('Invalid Music gate or wire.');const out={type:g.type,q:g.q};if(['Rx','Ry','Rz','P'].includes(g.type)){if(typeof g.angle!=='number'||!Number.isFinite(g.angle)||Math.abs(g.angle)>3600)throw Error('Rotation angle must be between −3600° and 3600°.');out.angle=g.angle;}return out;});
}
const mult=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],plus=(a,b)=>[a[0]+b[0],a[1]+b[1]];
export function applyMusicGate(state,g){
 const out=state.map(a=>a.slice()),bit=g.q===0?2:1;
 if(g.type==='CZ'){out[3]=out[3].map(v=>-v);return out;}
 if(g.type==='SWAP'){out[1]=state[2].slice();out[2]=state[1].slice();return out;}
 if(g.type==='CNOT'){const target=g.q===0?1:2;for(let i=0;i<4;i++)if((i&bit)&&!(i&target)){const j=i|target;out[i]=state[j].slice();out[j]=state[i].slice();}return out;}
 const a=(g.angle||0)*Math.PI/360,c=Math.cos(a),s=Math.sin(a),z=[0,0],one=[1,0],minus=[-1,0],h=Math.SQRT1_2;
 const matrices={H:[[[h,0],[h,0]],[[h,0],[-h,0]]],X:[[z,one],[one,z]],Y:[[z,[0,-1]],[[0,1],z]],Z:[[one,z],[z,minus]],S:[[one,z],[z,[0,1]]],'S†':[[one,z],[z,[0,-1]]],P:[[one,z],[z,[Math.cos(2*a),Math.sin(2*a)]]],T:[[one,z],[z,[h,h]]],Rx:[[[c,0],[0,-s]],[[0,-s],[c,0]]],Ry:[[[c,0],[-s,0]],[[s,0],[c,0]]],Rz:[[[c,-s],z],[z,[c,s]]]};
 const m=matrices[g.type];if(!m)throw Error('Unknown Music gate.');
 for(let i=0;i<4;i++)if(!(i&bit)){const j=i|bit;out[i]=plus(mult(m[0][0],state[i]),mult(m[0][1],state[j]));out[j]=plus(mult(m[1][0],state[i]),mult(m[1][1],state[j]));}return out;
}
export function applyMusicCircuit(state,circuit=[]){return validateMusicCircuit(circuit).reduce(applyMusicGate,state);}
export const musicGateNames={H:'Hadamard',X:'Bit flip · X',Y:'Bit and phase flip · Y',Z:'Phase flip · Z',S:'Phase +90°',
 'S†':'Phase −90°',T:'Phase +45°',Rx:'X rotation',Ry:'Y rotation',Rz:'Z rotation',P:'Phase angle',CNOT:'Controlled NOT',CZ:'Controlled phase',SWAP:'Swap states'};
export const gateMeaning={
 H:'Mixes the computational amplitudes. On |0⟩ it creates equal 0/1 probabilities; a later H can convert relative phase into populations.',
 X:'Exchanges |0⟩ and |1⟩ amplitudes on this wire. In Z readout this exchanges the corresponding outcome populations.',
 Y:'Exchanges the amplitudes with relative phase factors. Its audible result depends on the input and readout; on |0⟩ it has the same Z populations as X.',
 Z:'Changes the sign of the |1⟩ amplitude. Alone it preserves Z populations; X/Y readout or a later mixing gate can reveal the phase.',
 'S†':'Adds −90° relative phase to |1⟩. It reverses S and preserves Z populations when applied last.',
 P:'Adds an editable relative phase to |1⟩. Like Rz it preserves Z populations when applied last; a mixing gate or X/Y readout can reveal the phase.',
 CZ:'Changes the sign of |11⟩ only. It can entangle a superposition, while preserving the current Z populations.',
 SWAP:'Exchanges the states of q0 and q1. It exchanges the |01⟩ and |10⟩ amplitudes; whether the sound changes depends on the readout and note mapping.',
 S:'Adds +90° relative phase to |1⟩. It preserves Z populations when applied last.',
 T:'Adds +45° relative phase to |1⟩. It preserves Z populations when applied last.',
 Rx:'Rotates the state about the Bloch x axis. The angle and input determine both phase and populations.',
 Ry:'Rotates about the Bloch y axis; on |0⟩, Z probabilities are cos²(angle/2) and sin²(angle/2).',
 Rz:'Rotates about the Bloch z axis. It preserves Z populations when applied last, while changing relative phase.',
 CNOT:'Flips the other wire when the selected control is 1. It can create joint correlations or entanglement, depending on the input.'
};
