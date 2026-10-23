import json,subprocess,shutil
from copy import deepcopy
from pathlib import Path
import numpy as np
import pytest
from quantum_studio.config import defaults,validate,note_bank,EPSILON,import_calibration
from quantum_studio.model import initial_density,bloch,evolve,acquire,envelope,star_sigma,purity,gate_matrix,dephase,fft_complex,interleaved
from quantum_studio.music import music_snapshot,seeded_take
ROOT=Path(__file__).resolve().parents[2]


def ground():
    c=defaults();c.update(model='qubit',circuit=[],j=0)
    for b in c['qubits']: b.update(theta=0,phi=0,radius=1,nu=0)
    return c


def reference(**request):
    if not shutil.which('node'): pytest.skip('Node.js required for cross-language checks.')
    return json.loads(subprocess.run(['node',str(ROOT/'research/reference.mjs')],input=json.dumps(request),text=True,capture_output=True,check=True).stdout)


def test_analytic_t1_t2_and_thermal_equilibrium():
    c=ground();b=c['qubits'][0];b.update(theta=90,t1=200,t2=100,star=100)
    r=evolve(initial_density(c),.07,c);np.testing.assert_allclose(bloch(r,0),[np.exp(-.7),0,1-np.exp(-.35)],atol=2e-14)
    b['theta']=180;r=evolve(initial_density(c),.07,c)
    assert (1-bloch(r,0)[2])/2==pytest.approx(np.exp(-.35),abs=2e-14)
    c['model']='nmr';b['theta']=0
    assert bloch(evolve(initial_density(c),.1,c),0)[2]==pytest.approx(EPSILON,abs=1e-13)
    assert purity(initial_density(c))==pytest.approx(.25+.75*EPSILON**2,abs=1e-14)


def test_every_gate_and_order_matches_original():
    gates=[(g,73,q) for g in ['H','X','Y','Z','S','S†','T','Rx','Ry','Rz','P','CNOT','CZ','SWAP'] for q in (0,1)]
    values=reference(action='gates',gates=gates)
    for gate in gates:
        np.testing.assert_allclose(interleaved(gate_matrix(*gate)),values[','.join(map(str,gate))],atol=2e-15)
    c=ground();c['circuit']=[dict(type='H',q=0,step=0),dict(type='CNOT',q=0,step=1)]
    d=acquire(c,128);assert np.max(abs(d.signal))<1e-13;assert abs(d.before_readout.data[0,3])==pytest.approx(.5)


def test_echo_gaussian_and_readout():
    assert envelope(.05,150,50)==pytest.approx(np.exp(-1))
    assert envelope(.1,150,50,True,.05)==pytest.approx(np.exp(-.1/.15))
    assert star_sigma(150,150)==0
    c=ground();assert acquire(c,16).signal[0,0]==0
    c['readout']='q0';assert acquire(c,16).signal[0,0]==pytest.approx(1)
    c.update(readout='none',echo=True,windowMs=100,tauMs=50,circuit=[dict(type='Ry',angle=90,q=0,step=0)])
    c['qubits'][0].update(t2=150,star=50)
    assert acquire(c,257).signal[0,-1].real==pytest.approx(np.exp(-.1/.15),abs=1e-12)


def test_varied_mixed_states_remain_physical():
    for k in range(25):
        c=ground();c.update(model='nmr' if k%2 else 'qubit',j=211)
        for q,b in enumerate(c['qubits']): b.update(theta=(k*47+q*79)%181,phi=(k*71+q*31)%361-180,radius=((k*13+q*7)%101)/100,t1=100+q*31,t2=50+q*17,star=40)
        r=evolve(initial_density(c),.17,c)
        assert np.min(np.linalg.eigvalsh(r.data))>=-1e-12
        np.testing.assert_allclose(r.data,r.data.conj().T,atol=1e-13)
        assert np.trace(r.data)==pytest.approx(1,abs=1e-12)
        assert .25-1e-12<=purity(r)<=1+1e-12


def test_nonselective_measurement_removes_only_target_coherence():
    c=ground();c['qubits'][0]['theta']=90;c['qubits'][1]['theta']=90
    r=dephase(initial_density(c),0)
    np.testing.assert_allclose(bloch(r,0),[0,0,0],atol=1e-14)
    np.testing.assert_allclose(bloch(r,1),[1,0,0],atol=1e-14)


def test_splitting_converges_toward_independent_lindblad_solution():
    c=ground();c['qubits'][0]['theta']=83;c['qubits'][1]['theta']=47;c['j']=211
    exact=np.asarray(interleaved(evolve(initial_density(c),.05,c)))
    errors=[np.linalg.norm(exact-reference(action='evolve',configuration=c,seconds=.05,maxStep=s)) for s in (.0002,.0001,.00005)]
    assert errors[1]<errors[0]/3 and errors[2]<errors[1]/3
    assert errors[-1]<2e-6


@pytest.mark.parametrize('name',['Minimal_Circuit_Session.json','Hahn_Echo_Session.json','Free_FID_Both_Session.json'])
def test_acquisition_matches_original_examples(name):
    c=json.loads((ROOT/'examples'/name).read_text());d=acquire(c,256)
    js=reference(action='acquire',configuration=c,options=dict(samples=256,maxStep=.000025))
    for key in ('signal','lines','z','pop','env','hom','noEcho','initial','beforeReadout','final'):
        np.testing.assert_allclose(d.browser_data()[key],js[key],atol=2e-6,rtol=1e-6)


def test_music_qiskit_all_bases_seeded_sampling():
    for k in range(9):
        c=dict(theta0=.3+k*.23,phi0=.1+k*.29,theta1=.2+k*.19,phi1=-k*.1,cnot=bool(k%2),basis0='XYZ'[k%3],basis1='XYZ'[k//3])
        py=music_snapshot(c);js=reference(action='music',configuration=c,seed=271828)
        for key in ('state','probabilities','bloch','concurrence'): np.testing.assert_allclose(py[key],js[key],atol=2e-15)
        assert seeded_take(py['probabilities'],271828)==js['take']


def test_fft_sign_and_note_bank():
    t=np.arange(1024)*.001;result=fft_complex(np.exp(2j*np.pi*125*t),.001)
    index=np.argmax(result['mag']);assert result['hz'][index]==125;assert result['mag'][index]==pytest.approx(1)
    notes=note_bank();assert len(notes)==36;assert notes[21]['hz']==435;assert notes[12]['hz']==pytest.approx(435*2**(-9/12),abs=1e-13)
    assert notes[24]['hz']==2*notes[12]['hz']


def test_configuration_calibration_and_physics_rejections():
    c=defaults();assert validate(c)==c
    for mutate in [lambda x:x['qubits'][0].update(t2=2*x['qubits'][0]['t1']+1),lambda x:x['qubits'][0].update(star=10000),lambda x:x.update(duration=float('nan')),lambda x:x['circuit'].append(dict(type='X',q=0,step=0))]:
        bad=deepcopy(c);mutate(bad)
        with pytest.raises(ValueError): validate(bad)
    good=dict(unit='s',label='illustrative',qubits=[dict(t1=.8,t2=.16),dict(t1=1,t2=.24)])
    assert import_calibration(c,good)['qubits'][0]['star']==160
    del good['qubits'][0]['t1']
    with pytest.raises(ValueError): import_calibration(c,good)
