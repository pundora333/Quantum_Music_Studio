"""Secondary analysis of the attributed Parras (2026) matrix and summary CSV.

Run from the project root: python research/analyse_parras.py
Source versions and verification status are distinguished in provenance.json.
The printed matrix has no experiment ID; it MUST NOT be paired with a row.
Reported summary indicators are retained and used descriptively.
"""
from pathlib import Path
import csv
import json
import sys
import wave

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'python'))
from quantum_studio.config import defaults, validate, EPSILON
from quantum_studio.model import evolve, bloch, DensityMatrix
from qiskit.quantum_info import state_fidelity, concurrence

DATA = ROOT / 'research' / 'parras_2026'
BASIS = ['00', '01', '10', '11']


def summary_consistency(rows, tolerance=1e-6):
    """Check a necessary Bell squared-fidelity/concurrence consistency bound.

    This tests compatibility of reported indicator pairs, not 39 reconstructed
    states. A tolerance of 1e-6 exceeds combined six-decimal rounding error.
    """
    diagnostics = []
    for row in rows:
        f = float(row['Fidelity_reported'])
        c = float(row['Concurrence_reported'])
        upper = (1 + c) / 2
        diagnostics.append(dict(experiment_id=int(row['Experiment_ID']),
                                fidelity_reported=f, concurrence_reported=c,
                                upper_bound=upper, excess=f-upper))
    violations = [d for d in diagnostics if d['excess'] > tolerance]
    return dict(criterion='F <= (1 + C) / 2',
                fidelity_convention='Squared fidelity to the ideal Phi+ Bell state',
                absolute_tolerance=tolerance,
                rows_checked=len(diagnostics), violating_rows=len(violations),
                violating_experiment_ids=[d['experiment_id'] for d in violations],
                min_excess=min((d['excess'] for d in diagnostics), default=None),
                max_excess=max((d['excess'] for d in diagnostics), default=None),
                example=next((d for d in diagnostics if d['experiment_id'] == 22), None),
                interpretation='Reported pairs are used descriptively, not as independently validated physical states. '
                               'Their incompatibility with this necessary bound is consistent with the '
                               'linear-reconstruction caution identified in the supervisor corrections; '
                               'the original CSV values are not altered.')


def research_annotations(rows):
    """Shared annotations for the archived report and future regeneration."""
    provenance = json.loads((DATA / 'provenance.json').read_text(encoding='utf-8'))
    revised = provenance['revised_reference']
    return dict(metadata_revised_on='2026-10-30',
                source_matrix='Parras (2026), revised edition, matrix p. 59 '
                              '(reference supplied in supervisor corrections); '
                              'original transcription source identified in provenance.json',
                source_summary='Author-supplied SpinQ_Bell_state_experiments.csv, received 2026-10-19; '
                               'revised-edition reference: Fig. 6.3.4, p. 61 '
                               '(supplied in supervisor corrections)',
                source_provenance='provenance.json',
                revised_reference_verification=revised['verification_status'],
                summary_updated_on='2026-10-19',
                summary_validation='csv_validation_2026-10-19.json',
                summary_consistency=summary_consistency(rows),
                fidelity_convention='Squared Bell fidelity is used for comparison; '
                                    'psd_fidelity_root is also explicitly provided as its square root.',
                limitations=['One rounded matrix; not 39 complete matrices',
                             'No defensible match of the matrix to a summary Experiment_ID',
                             'Raw matrix is not PSD and has a negative 01 population',
                             'PSD clipping/renormalisation is a sensitivity choice, not recovered measurement data or SGS projection',
                             'All 39 reported pairs violate F <= (1+C)/2 under the stated squared Bell-fidelity convention; descriptive use only',
                             'Revised-edition page references and experimental summary are supplied in supervisor corrections; revised PDF identity/hash not independently verified',
                             'Model epsilon=1e-5 is illustrative, not the physical polarization reported for each nucleus',
                             'Temp_Error is half the endpoint difference, not an estimated standard error',
                             'No uncertainty on matrix elements and no raw tomography files',
                             'No new hardware acquisition or human listening test'])


def load_matrix(path=DATA / 'rho_raw.csv'):
    a = np.zeros((4, 4), complex)
    seen = set()
    with path.open() as f:
        for row in csv.DictReader(f):
            i, j = BASIS.index(row['row']), BASIS.index(row['column'])
            if (i, j) in seen:
                raise ValueError('Duplicate matrix element')
            seen.add((i, j))
            a[i, j] = float(row['real']) + 1j * float(row['imag'])
    if len(seen) != 16:
        raise ValueError('A complete complex 4x4 matrix is required')
    return a


def validate_density(a, tol=1e-10):
    if a.shape != (4, 4) or not np.all(np.isfinite(a)):
        raise ValueError('Invalid matrix shape or values')
    if not np.allclose(a, a.conj().T, atol=tol, rtol=0):
        raise ValueError('Matrix is not Hermitian')
    if abs(np.trace(a) - 1) > tol:
        raise ValueError('Matrix trace is not one')
    if np.linalg.eigvalsh(a).min() < -tol:
        raise ValueError('Matrix is not positive semidefinite')
    return a


def clip_and_renormalise(a):
    # Explicit sensitivity transformation, NOT maximum-likelihood tomography
    # and NOT claimed to be the nearest trace-one PSD matrix in Frobenius norm.
    values, vectors = np.linalg.eigh(a)
    values = np.maximum(values, 0)
    if values.sum() <= 0:
        raise ValueError('No positive spectrum')
    return validate_density((vectors * (values / values.sum())) @ vectors.conj().T)


def linear_metrics(a):
    b = np.array([bloch(a, q) for q in (0, 1)])
    return dict(eigenvalues=np.linalg.eigvalsh(a).tolist(),
                trace=float(np.trace(a).real),
                hermiticity_error=float(np.linalg.norm(a - a.conj().T)),
                trace_square=float(np.trace(a @ a).real),
                bloch=b.tolist(), bloch_lengths=np.linalg.norm(b, axis=1).tolist(),
                transverse_abs=np.linalg.norm(b[:, :2], axis=1).tolist(),
                mplus=[[float(x), float(y)] for x, y, _ in b])


def configuration():
    c = defaults()
    c.update(molecule='phosphite', j=697.4, windowMs=400, circuit=[],
             readout='none', echo=False, duration=8,
             source='Secondary analysis: Parras (2026), original matrix transcription; '
                    'see provenance.json; PSD-transformed matrix, illustrative evolution')
    for q, nu in zip(c['qubits'], [-24, 42]):
        q.update(t1=5000, t2=200, star=200, nu=nu)
    # Preserve the archived research example's unpulsed audio interpretation,
    # rather than inheriting the interactive Studio's model-linked rhythm.
    c['tempo'].update(mode='fixed', rhythm=False)
    return validate(c)


def fid(effective, c, samples=1025):
    validate_density(effective)
    physical = (1 - EPSILON) * np.eye(4) / 4 + EPSILON * effective
    rho = DensityMatrix(validate_density(physical))
    times = np.linspace(0, c['windowMs'] / 1000, samples)
    signal = np.empty((2, samples), complex)
    previous = 0.
    for n, t in enumerate(times):
        rho = evolve(rho, float(t - previous), c)
        previous = float(t)
        for q in (0, 1):
            b = bloch(rho, q) / EPSILON
            signal[q, n] = b[0] + 1j * b[1]
    return times, signal


def write_audio(path, times, signal, seconds=8, rate=44100):
    # u=t/0.05; fixed 0.5 gain for BOTH files, no peak/RMS normalisation.
    u = np.arange(round(seconds * rate)) / rate
    t = u * times[-1] / seconds
    out = np.zeros((len(u), 2))
    fade = np.minimum(1, np.minimum(u, seconds - u) / .01)
    for q, carrier in enumerate([435., 652.5]):
        m = np.interp(t, times, signal[q].real) + 1j * np.interp(t, times, signal[q].imag)
        out[:, q] = .5 * fade * np.real(m * np.exp(2j * np.pi * carrier * u))
    if abs(out).max() > 1:
        raise ValueError('Audio clipping')
    pcm = np.rint(out * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as f:
        f.setparams((2, 2, rate, 0, 'NONE', 'not compressed'))
        f.writeframes(pcm.tobytes())
    return float(np.sqrt(np.mean((pcm.astype(float)/32767) ** 2)))


def main():
    raw = load_matrix()
    projected = clip_and_renormalise(raw)
    bell = np.outer([1, 0, 0, 1], [1, 0, 0, 1]) / 2
    report = dict(date='2026-10-17',
                  source_matrix_experiment_id=None,
                  raw=linear_metrics(raw), psd=linear_metrics(projected),
                  transformation='Negative eigenvalues set to zero; remaining eigenvalues divided by their sum',
                  frobenius_change=float(np.linalg.norm(projected - raw)),
                  raw_bell_overlap=float(np.trace(raw @ bell).real),
                  raw_overlap_is_valid_fidelity=False,
                  psd_fidelity_squared=float(state_fidelity(projected, bell)),
                  psd_fidelity_root=float(np.sqrt(state_fidelity(projected, bell))),
                  psd_concurrence=float(concurrence(projected)))
    with (DATA / 'rho_psd.csv').open('w') as f:
        out = csv.writer(f); out.writerow(['row', 'column', 'real', 'imag'])
        for i in range(4):
            for j in range(4):
                out.writerow([BASIS[i], BASIS[j], projected[i, j].real, projected[i, j].imag])
    with (DATA / 'summary_39.csv').open() as f:
        rows = list(csv.DictReader(f))
    report.update(research_annotations(rows))
    report['summary_rows'] = len(rows)
    report['summary_descriptive'] = {}
    for key in ['Fidelity_reported', 'Concurrence_reported', 'Entropy_reported', 'Duration_sec', 'Temp_average']:
        a = np.array([float(row[key]) for row in rows])
        report['summary_descriptive'][key] = dict(min=float(a.min()), max=float(a.max()), mean=float(a.mean()))
    c = configuration()
    (DATA / 'evolution_configuration.json').write_text(json.dumps(c, ensure_ascii=False, indent=2) + '\n')
    times, signal = fid(projected, c)
    _, ideal = fid(bell, c)
    with (DATA / 'fid_comparison.csv').open('w') as f:
        out = csv.writer(f);out.writerow(['t_s', 'q0_real_psd', 'q0_imag_psd', 'q1_real_psd', 'q1_imag_psd', 'q0_real_bell', 'q0_imag_bell', 'q1_real_bell', 'q1_imag_bell'])
        for n, t in enumerate(times):
            out.writerow([t, signal[0,n].real, signal[0,n].imag, signal[1,n].real, signal[1,n].imag, ideal[0,n].real, ideal[0,n].imag, ideal[1,n].real, ideal[1,n].imag])
    report['audio'] = dict(duration_seconds=8, sample_rate=44100, channels=['q0 left', 'q1 right'], gain=.5,
                           carriers_hz=[435, 652.5], physical_seconds_per_audio_second=.05,
                           per_file_normalisation=False,
                           psd_rms=write_audio(DATA / 'parras_psd_simulated.wav', times, signal),
                           bell_rms=write_audio(DATA / 'ideal_bell_simulated.wav', times, ideal),
                           ideal_max_abs=float(abs(ideal).max()))
    fig, ax = plt.subplots(3, 1, figsize=(7, 6.7), constrained_layout=True)
    x=np.arange(2)
    ax[0].bar(x-.19,report['raw']['bloch_lengths'],width=.36,label='Raw reconstruction',color='#64748b')
    ax[0].bar(x+.19,report['psd']['bloch_lengths'],width=.36,label='PSD transformation',color='#167d8d')
    ax[0].set(xticks=x,xticklabels=['q0','q1'],ylabel='Local Bloch-vector length',ylim=(0,.145))
    ax[0].legend(fontsize=8,frameon=False)
    for q, color in enumerate(['#167d8d','#ab522d']):
        ax[q+1].plot(times*1000,abs(signal[q]),color=color,lw=.7,label=f'PSD, q{q}')
        ax[q+1].plot(times*1000,abs(ideal[q]),'--',color='#333333',label='Ideal Bell')
        ax[q+1].set(xlabel='Simulated acquisition time (ms)',ylabel=f'Effective |M+{q}(t)|')
        ax[q+1].legend(fontsize=8,frameon=False)
    for a in ax:
        a.spines[['top','right']].set_visible(False)
        a.grid(axis='y',alpha=.2)
    fig.savefig(DATA / 'comparison.png',dpi=220)
    plt.close(fig)
    (DATA / 'analysis.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
