"""Scientific checks for the separately labelled secondary-data workflow."""
import csv
import wave
import numpy as np
import pytest
from analyse_parras import (DATA, load_matrix, validate_density,
                           clip_and_renormalise, linear_metrics, fid, configuration)


def test_invalid_source_is_rejected_without_silent_repair():
    a = load_matrix()
    with pytest.raises(ValueError, match='positive semidefinite'):
        validate_density(a)
    assert abs(np.linalg.eigvalsh(a)[0] - (-.0291)) < .00005
    assert abs(np.trace(a @ a).real - .954967) < .00005


def test_local_observables_against_independent_partial_traces():
    a = load_matrix()
    tensor = a.reshape(2, 2, 2, 2)
    reduced = [np.trace(tensor, axis1=1, axis2=3), np.trace(tensor, axis1=0, axis2=2)]
    for q, local in enumerate(reduced):
        expected = [2 * local[1, 0].real, 2 * local[1, 0].imag, (local[0, 0] - local[1, 1]).real]
        np.testing.assert_allclose(linear_metrics(a)['bloch'][q], expected, atol=1e-14)


def test_psd_transform_retains_raw_and_preserves_physical_pps():
    a=load_matrix(); original=a.copy(); p=clip_and_renormalise(a)
    np.testing.assert_array_equal(a, original)
    validate_density(p)
    assert np.linalg.norm(a-p) > .04
    physical=(1-1e-5)*np.eye(4)/4+1e-5*p
    validate_density(physical)
    assert np.linalg.eigvalsh(physical).min() > .24999


def test_metadata_ids_and_endpoint_derived_temperatures():
    with (DATA/'summary_39.csv').open() as f:rows=list(csv.DictReader(f))
    assert [int(r['Experiment_ID']) for r in rows] == list(range(1,40))
    for r in rows:
        start,end,avg,err=[float(r[k]) for k in ['Temp_Start','Temp_End','Temp_average','Temp_Error']]
        assert abs(avg-(start+end)/2) < .00051
        assert abs(err-abs(start-end)/2) < .00051


def test_bell_null_signal_and_projected_initial_fid():
    c=configuration();bell=np.outer([1,0,0,1],[1,0,0,1])/2
    _, silent=fid(bell,c,samples=17)
    assert abs(silent).max() < 1e-12
    p=clip_and_renormalise(load_matrix());_, signal=fid(p,c,samples=17)
    b=np.array(linear_metrics(p)['bloch'])
    np.testing.assert_allclose(signal[:,0],b[:,0]+1j*b[:,1],atol=1e-12)
    decoded=[]
    for name in ['ideal_bell_simulated.wav','parras_psd_simulated.wav']:
        with wave.open(str(DATA/name)) as f:
            assert (f.getnchannels(),f.getsampwidth(),f.getframerate(),f.getnframes()) == (2,2,44100,8*44100)
            decoded.append(np.frombuffer(f.readframes(f.getnframes()),dtype='<i2'))
    assert not decoded[0].any()
    assert np.max(abs(decoded[1])) > 0
    assert np.max(abs(decoded[1])) < 32767
