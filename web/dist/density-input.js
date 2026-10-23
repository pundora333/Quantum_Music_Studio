// Effective two-qubit matrices, basis |00>, |01>, |10>, |11>.
// No automatic repair: non-PSD input can be inspected but requires an explicit
// eigenvalue-clipping choice before use. No claim of MLE or nearest-PSD fitting.
export const BASIS=['00','01','10','11'];
const TOL=1e-10;
function finite(v){return typeof v==='number'&&Number.isFinite(v);}
export function checkMatrix(raw){
  if(!Array.isArray(raw)||raw.length!==32||!raw.every(finite))throw Error('Expected all 16 complex entries as 32 finite numbers.');
  let trace=0,error=0;
  for(let i=0;i<4;i++){trace+=raw[10*i];for(let j=0;j<4;j++){const a=2*(4*i+j),b=2*(4*j+i);error=Math.max(error,Math.abs(raw[a]-raw[b]),Math.abs(raw[a+1]+raw[b+1]));}}
  if(error>TOL)throw Error('Matrix is not Hermitian (tolerance 1e-10).');
  if(Math.abs(trace-1)>TOL)throw Error('Matrix trace must be 1 (tolerance 1e-10). No automatic normalization.');
  return raw;
}
// Real symmetric representation of a complex Hermitian matrix. Jacobi rotations
// diagonalize [Re A,-Im A; Im A,Re A]; each eigenvalue occurs twice.
function spectrum(raw){
  checkMatrix(raw);
  const n=8,a=Array.from({length:n},()=>Array(n).fill(0)),v=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>Number(i===j)));
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){const k=2*(4*i+j),re=(raw[k]+raw[2*(4*j+i)])/2,im=(raw[k+1]-raw[2*(4*j+i)+1])/2;a[i][j]=a[i+4][j+4]=re;a[i][j+4]=-im;a[i+4][j]=im;}
  let converged=false;
  for(let iteration=0;iteration<3000;iteration++){
    let p=0,q=1,largest=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.abs(a[i][j])>largest){largest=Math.abs(a[i][j]);p=i;q=j;}
    if(largest<1e-14){converged=true;break;}
    const tau=(a[q][q]-a[p][p])/(2*a[p][q]),t=(tau>=0?1:-1)/(Math.abs(tau)+Math.hypot(1,tau)),co=1/Math.hypot(1,t),si=t*co,ap=a[p][p],aq=a[q][q],off=a[p][q];
    a[p][p]=ap-t*off;a[q][q]=aq+t*off;a[p][q]=a[q][p]=0;
    for(let k=0;k<n;k++){if(k!==p&&k!==q){const x=a[k][p],y=a[k][q];a[k][p]=a[p][k]=co*x-si*y;a[k][q]=a[q][k]=si*x+co*y;}const x=v[k][p],y=v[k][q];v[k][p]=co*x-si*y;v[k][q]=si*x+co*y;}
  }
  if(!converged)throw Error('Matrix eigensolver did not converge.');
  const values=a.map((row,i)=>row[i]),ordered=[...values].sort((x,y)=>x-y);
  return {values,v,eigenvalues:[0,2,4,6].map(i=>(ordered[i]+ordered[i+1])/2)};
}
export function matrixMetrics(raw){
  const {eigenvalues}=spectrum(raw),valid=eigenvalues[0]>=-TOL;
  const bloch=[2,1].map(mask=>{let x=0,y=0,z=0;for(let i=0;i<4;i++){z+=(i&mask?-1:1)*raw[10*i];if(!(i&mask)){const k=2*((i|mask)*4+i);x+=2*raw[k];y+=2*raw[k+1];}}return [x,y,z];});
  return {eigenvalues,valid,bloch,lengths:bloch.map(v=>Math.hypot(...v)),transverse:bloch.map(v=>Math.hypot(v[0],v[1])),traceSquare:raw.reduce((s,x)=>s+x*x,0),bellFidelitySquared:valid?(raw[0]+raw[30]+raw[6]+raw[24])/2:null};
}
export function clipMatrix(raw){
  const {values,v}=spectrum(raw),weights=values.map(x=>Math.max(0,x)),sum=weights.reduce((a,b)=>a+b,0)/2;
  const real=Array.from({length:8},(_,i)=>Array.from({length:8},(_,j)=>weights.reduce((s,w,k)=>s+w*v[i][k]*v[j][k],0)/sum));
  const out=Array(32).fill(0);for(let i=0;i<4;i++)for(let j=0;j<4;j++){const k=2*(4*i+j);out[k]=(real[i][j]+real[i+4][j+4])/2;out[k+1]=(real[i+4][j]-real[i][j+4])/2;}
  return out;
}
export function validateDensityInput(input){
  if(!input||input.kind!=='effective'||JSON.stringify(input.basis)!==JSON.stringify(BASIS)||typeof input.label!=='string'||!input.label.trim()||input.label.length>300||!['none','clip'].includes(input.treatment))throw Error('Density input requires kind effective, ordered basis, source label and treatment none or clip.');
  checkMatrix(input.raw);
  if(input.treatment==='none'&&!matrixMetrics(input.raw).valid)throw Error('Non-PSD effective matrix: inspect it and explicitly choose eigenvalue clipping before use.');
  return input;
}
export function effectiveMatrix(input){validateDensityInput(input);return input.treatment==='clip'?clipMatrix(input.raw):[...input.raw];}
export function parseDensity(text,label='Imported matrix'){
  if(typeof text!=='string'||text.length>200000)throw Error('Matrix file must be smaller than 200 kB.');
  text=text.replace(/^\uFEFF/,'').trim();let raw;
  if(text.startsWith('{')){const item=JSON.parse(text);if(item.kind!=='effective'||JSON.stringify(item.basis)!==JSON.stringify(BASIS))throw Error('JSON must declare kind effective and basis [00,01,10,11].');raw=item.raw;label=item.label??label;}
  else{
    const lines=text.split(/\r?\n/).filter(x=>x.trim()),separator=lines[0]?.includes(';')?';':',';
    if(lines[0]?.split(separator).map(x=>x.trim()).join(',')!=='row,column,real,imag')throw Error('Use a full matrix CSV: row,column,real,imag. The 39-row summary cannot reconstruct a density matrix.');
    raw=Array(32).fill(0);const seen=new Set();
    for(const line of lines.slice(1)){const parts=line.split(separator).map(x=>x.trim());if(parts.length!==4||parts.some(x=>x===''))throw Error('Each CSV entry needs row,column,real,imag.');const i=BASIS.indexOf(parts[0]),j=BASIS.indexOf(parts[1]),k=4*i+j;if(i<0||j<0||seen.has(k))throw Error('Invalid or repeated CSV basis entry.');seen.add(k);raw[2*k]=Number(parts[2]);raw[2*k+1]=Number(parts[3]);}
    if(seen.size!==16)throw Error('All 16 complex matrix entries are required.');
  }
  if(typeof label!=='string'||!label.trim()||label.length>300)throw Error('Provide a source label of 1–300 characters.');
  checkMatrix(raw);return {kind:'effective',basis:[...BASIS],label,raw,treatment:'none'};
}
export const PARRAS_INPUT={kind:'effective',basis:[...BASIS],label:'Reference matrix (published example); experiment ID and nucleus order unavailable',treatment:'none',raw:[.4852,0,-.0043,.0245,-.019,.0374,.4702,.0191,-.0043,-.0245,-.0046,0,.0031,.0191,-.019,.0063,-.019,-.0374,.0031,-.0191,.0046,0,-.0043,-.0511,.4702,-.0191,-.019,-.0063,-.0043,.0511,.5148,0]};
export const BELL_INPUT={kind:'effective',basis:[...BASIS],label:'Ideal Bell Phi+ reference (simulated)',treatment:'none',raw:[.5,0,0,0,0,0,.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,.5,0,0,0,0,0,.5,0]};
