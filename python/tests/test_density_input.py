import json
from copy import deepcopy
import numpy as np
import pytest
from quantum_studio.config import defaults,validate,EPSILON
from quantum_studio.density_input import effective_matrix
from quantum_studio.model import initial_density,acquire,interleaved
from test_physics import ROOT,reference

def fixture():
    rows=np.loadtxt(ROOT/'research/parras_2026/rho_raw.csv',delimiter=',',skiprows=1,usecols=(2,3))
    return dict(kind='effective',basis=['00','01','10','11'],label='Parras p48 fixture',raw=rows.ravel().tolist(),treatment='clip')

def test_projection_matches_independent_saved_analysis_and_embedding():
    item=fixture();rho=effective_matrix(item)
    expected=np.loadtxt(ROOT/'research/parras_2026/rho_psd.csv',delimiter=',',skiprows=1,usecols=(2,3)).reshape(4,4,2)
    np.testing.assert_allclose(rho,expected[:,:,0]+1j*expected[:,:,1],atol=2e-10)
    c=defaults();c['tempo'].update(mode='fixed',rhythm=False);c.update(version=4,densityInput=item,circuit=[])
    np.testing.assert_allclose(initial_density(validate(c)).data,(1-EPSILON)*np.eye(4)/4+EPSILON*rho,atol=1e-14)
    item['treatment']='none'
    with pytest.raises(ValueError,match='Non-PSD'):validate(c)

@pytest.mark.parametrize('model',['nmr','qubit'])
def test_imported_complex_state_cross_language_dynamics(model):
    c=defaults();c['tempo'].update(mode='fixed',rhythm=False);c.update(version=4,model=model,densityInput=fixture(),circuit=[],windowMs=20,tauMs=5,j=31)
    for q in c['qubits']:q.update(t1=5000,t2=200,star=200)
    py=acquire(c,64).browser_data();js=reference(action='acquire',configuration=c,options=dict(samples=64,maxStep=.000025))
    for key in ['initial','beforeReadout','final','signal','pop','z']:
        np.testing.assert_allclose(py[key],js[key],atol=4e-7,rtol=1e-5)
    restored=validate(json.loads(json.dumps(c)));assert restored==c

def test_import_validation_rejects_bad_schema_basis_and_numbers():
    for change in [lambda x:x.update(basis=['11','10','01','00']),lambda x:x['raw'].__setitem__(1,.01),lambda x:x['raw'].__setitem__(0,.6),lambda x:x['raw'].__setitem__(0,True),lambda x:x['raw'].pop(),lambda x:x.update(treatment='silent-fix')]:
        item=fixture();change(item)
        with pytest.raises(ValueError):effective_matrix(item)
    c=defaults();c['tempo'].update(mode='fixed',rhythm=False);c['version']=3;c['densityInput']=fixture()
    with pytest.raises(ValueError,match='version 4'):validate(c)
