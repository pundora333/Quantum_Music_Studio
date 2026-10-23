import json
from copy import deepcopy
import numpy as np
import pytest
from quantum_studio.config import defaults,validate
from quantum_studio.tempo import tempo_info
from quantum_studio.model import acquire
from quantum_studio.audio import render_chunks
from test_physics import reference

def test_mapping_and_legacy_migration():
    c=defaults();assert tempo_info(c)['bpm']==150
    values=[]
    for t in [.1,80,160,320,200000]:
        c['qubits'][0]['t2']=t;values.append(tempo_info(c)['bpm'])
    assert values[1:4]==[160,150,140]
    assert all(120<=v<=180 for v in values) and all(a>b for a,b in zip(values,values[1:]))
    c['tempo'].update(source='star',qubit=1,referenceMs=80);assert tempo_info(c)['bpm']==150
    for version in (2,3,4):
        old=defaults();old.update(version=version,tempo=dict(bpm=100,beats=8,sync=True))
        migrated=validate(old);assert not migrated['tempo']['rhythm'];assert tempo_info(migrated)['bpm']==100

def test_invalid_rhythm_and_v5_range():
    for k,v in [('bpm',119),('bpm',181),('qubit',True),('referenceMs',0),('depth',float('nan')),('mapping','unknown'),('source','t1'),('sync',True)]:
        c=defaults();c['tempo'][k]=v
        with pytest.raises(ValueError):validate(c)

def test_rhythm_controls_preserve_physical_data_and_stretch():
    c=defaults();a=acquire(c,64);before=tempo_info(c);c['tempo'].update(mode='fixed',bpm=180,depth=1,referenceMs=12);b=acquire(c,64)
    np.testing.assert_array_equal(a.signal,b.signal)
    assert tempo_info(c)['physicalSecondsPerAudioSecond']==before['physicalSecondsPerAudioSecond']

def test_python_browser_rhythm_parity_across_multiple_beats():
    c=defaults();c.update(duration=1.25,windowMs=40,tauMs=10,j=0)
    c['qubits'][0].update(t2=80,star=55,nu=0);c['qubits'][1]['nu']=0
    d=acquire(c,64);py=np.concatenate(list(render_chunks(d,c,137)))
    js=reference(action='audio',configuration=c,options=dict(samples=64,maxStep=.000025),frames=len(py))
    np.testing.assert_allclose(py,np.asarray(js).T,atol=3e-6,rtol=2e-5)
    assert tempo_info(c)['bpm']==160

def test_depth_zero_and_bypass_match_and_session_roundtrips():
    c=defaults();c['duration']=.05;d=acquire(c,256);c['tempo']['rhythm']=False
    a=np.concatenate(list(render_chunks(d,c)))
    c['tempo'].update(rhythm=True,depth=0);b=np.concatenate(list(render_chunks(d,c,137)))
    np.testing.assert_array_equal(a,b);assert validate(json.loads(json.dumps(c)))==c
