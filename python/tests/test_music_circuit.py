import json, subprocess
from pathlib import Path
import numpy as np
import pytest
from quantum_studio.music import music_snapshot
from quantum_studio.config import defaults,validate
ROOT=Path(__file__).resolve().parents[2]
def config():
    return dict(theta0=0,theta1=0,phi0=0,phi1=0,cnot=False,basis0='Z',basis1='Z',circuit=[])
def test_music_interference_and_reverse_cnot():
    for types,want in [(['H','H'],[1,0,0,0]),(['H','Z','H'],[0,0,1,0])]:
        c=config();c['circuit']=[dict(type=g,q=0) for g in types]
        np.testing.assert_allclose(music_snapshot(c)['probabilities'],want,atol=1e-14)
    c=config();c['circuit']=[dict(type='H',q=1),dict(type='CNOT',q=1)]
    s=music_snapshot(c);assert s['concurrence']==pytest.approx(1)
    np.testing.assert_allclose(s['probabilities'],[.5,0,0,.5],atol=1e-14)
def test_music_circuit_python_javascript_parity():
    configs=[];gates=['H','X','Y','Z','S','S†','T','Rx','Ry','Rz','P','CNOT','CZ','SWAP']
    for i in range(18):
        c=config();c.update(theta0=.17*i,theta1=.14*i,phi0=.21*i,phi1=-.11*i,basis0=['X','Y','Z'][i%3],basis1=['Z','X','Y'][i%3])
        c['circuit']=[dict(type=gates[(i+j)%len(gates)],q=(i+j)%2,angle=(-1)**j*(i+j)*17) for j in range(12)]
        configs.append(c)
    script="import {prepare,probabilities,bloch,concurrence} from './web/dist/quantum.js';let x='';for await(const v of process.stdin)x+=v;console.log(JSON.stringify(JSON.parse(x).map(c=>{const s=prepare(c);return {state:s,probabilities:probabilities(s,c.basis0,c.basis1),bloch:[bloch(s,0),bloch(s,1)],concurrence:concurrence(s)};})));"
    r=subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,input=json.dumps(configs),capture_output=True,text=True,check=True)
    for c,j in zip(configs,json.loads(r.stdout)):
        for k,v in music_snapshot(c).items():np.testing.assert_allclose(v,j[k],atol=3e-14)
def test_invalid_gates_and_nmr_tempo_are_rejected():
    for g in [dict(type='Wait',q=0),dict(type='Rx',q=0,angle=float('inf')),dict(type='X',q=2)]:
        c=config();c['circuit']=[g]
        with pytest.raises(ValueError):music_snapshot(c)
    c=defaults();c['tempo'].update(mode='fixed',rhythm=False);c['tempo']['bpm']=120;c['tempo']['sync']=True
    assert validate(c)['tempo']['bpm']==120
    c['tempo']['bpm']=float('nan')
    with pytest.raises(ValueError):validate(c)
