# Secondary NMR analysis

Source: Ioannis Parras, *Κβαντική υπολογιστική με πυρηνικό μαγνητικό συντονισμό*,
master's thesis, SEMFE, NTUA, 2026. The analysis uses **one rounded effective
density matrix and 39 author-supplied summary/metadata rows**, not 39 full matrices.

## Source versions and revised references

The revised-edition references supplied in the supervisor corrections are:
the matrix on p. 59, the 39 rows in Fig. 6.3.4 on p. 61, and CHSH on p. 69.
Those corrections report a mean S = 2.57 +/- 0.07 from 19 executions;
S = 2.7216 refers to one execution. These are attributed source results,
not measurements or CHSH estimates produced by this software.

The revised PDF's identity and hash have not been independently verified in
this package. The source actually used for the original matrix transcription
is separately identified by filename and SHA256 in `provenance.json`:
Fig. 6.3.2, p. 48; its summary comparison was Fig. 6.3.3, p. 49.
These original-transcription references are retained for traceability and are
not presented as page numbers of the revised edition. The normalized 39-row
table comes directly from the author CSV received on 19 October 2026.

## Files

- `SpinQ_Bell_state_experiments.csv`: original semicolon-delimited source,
  preserved byte for byte.
- `summary_39.csv`: the normalized table, retaining the source numerical
  precision and mapping indicator headers to *_reported.
- `csv_validation_2026-10-19.json`: comparison of 390 fields, correction of
  six earlier transcription values, descriptive results and scope.
- `rho_raw.csv`: the unchanged one-matrix transcription, basis 00,01,10,11.
- `rho_psd.csv`: explicit eigenvalue clipping and trace renormalisation.
- `analysis.json`: raw/PSD metrics, explicitly labelled squared/root fidelity,
  descriptive consistency diagnostics and limitations.
- `evolution_configuration.json`: illustrative simulation parameters.
- `fid_comparison.csv` and `comparison.png`: simulated local signals and
  comparison of the transformed example with the ideal Bell state.
- `parras_psd_simulated.wav` and `ideal_bell_simulated.wav`: 8 s, stereo,
  44.1 kHz PCM16, common fixed gain 0.5. The ideal Bell file is silent.

## Interpretation and limits

The raw matrix is not positive semidefinite: its minimum eigenvalue is about
-0.0291, and the diagonal population rho[01,01] = -0.0046 is also negative.
Rounding cannot account for this discrepancy. The raw matrix is
retained; clipping/renormalisation is a declared sensitivity transformation,
not a recovered measurement, maximum-likelihood reconstruction or claimed
nearest trace-one PSD matrix in Frobenius norm.
Clipping is retained as the documented sensitivity baseline of version 1.7.2
so that this discussion remains consistent with its archived simulated audio;
it is not described as the SGS nearest-state projection.

No defensible Experiment_ID pairs the printed matrix with one of the 39
rows. Complete matrices and paired FID are unavailable for those rows, so
their fidelities cannot be independently recalculated. For the comparison with
the ideal Phi+ Bell state, F denotes squared fidelity; the one-matrix report
also explicitly supplies its square root as `psd_fidelity_root`.

All 39 reported pairs fail the necessary physical-state relation
F <= (1+C)/2 under that squared Bell-fidelity interpretation, even allowing
1e-6 for rounding. For example, Experiment 22 reports F = 1 and C = 0.965209,
giving an upper bound of 0.9826045. This is consistent with the caution about
linear reconstruction identified in the supervisor corrections. The rows are
therefore presented descriptively; their reported values are preserved, and
are not treated as 39 independently validated density matrices or as evidence
that a unique reconstruction error has been identified.
`analysis.json` records the diagnostic and `analyse_parras.py` reproduces it.

Temp_Error is half the endpoint temperature difference,
not an estimated statistical standard error. The source table does not print
a temperature unit or timezone.

Diagonal readouts and complex off-diagonal reconstruction are distinct;
see source Eqs. 5.2.5–5.2.8 and 5.2.9–5.2.14, pp. 43–44 of the original
transcription PDF identified in `provenance.json`. The basis order is
00,01,10,11. A nucleus assignment for the one printed matrix is not established.
No other unprovided measurements are assumed or analysed.

The transformed state is embedded in (1-epsilon)I/4 + epsilon*rho with
the **illustrative model value epsilon=1e-5**. The supervisor corrections
place the physical polarization at order 1e-6, with approximate per-nucleus
values 1H: 2e-6 and 31P: 0.9e-6; these are not calibrations performed here.
For any valid two-qubit effective density matrix, the sufficient separability
bound of Braunstein et al. (1999), epsilon <= 1/9, applies to this PPS form;
see [their general construction](https://arxiv.org/abs/quant-ph/9811018).
It covers arbitrary valid effective components, whereas the exact 1/3
threshold is specific to the Bell-plus-white-noise family. The general bound
applies after a valid effective state has been specified, not to the invalid
raw reconstruction as if it were a density matrix. Entanglement indicators
of an effective reconstruction do not establish entanglement of the weakly
polarized physical PPS.

Shared illustrative settings are J=697.4 Hz; T1=5000 ms,
T2=T2*=200 ms for both basis positions; offsets -24 and 42 Hz; no readout
pulse, echo or static spread. Physical time 0.4 s maps to 8 s of audio;
carriers are 435 and 652.5 Hz, q0 left and q1 right, with 10 ms endpoint
fades. These are controlled simulation choices, not recovered acquisition
metadata or per-nucleus calibration. The two files use the same gain.

## Reproduce

From the repository root, with the locked Python dependencies:

```sh
python research/analyse_parras.py
python -m pytest research/test_parras_analysis.py -q
```

Running the analysis can overwrite generated outputs. Keep a separate copy
for comparison. Matrix/evolution/audio outputs retain their 17 October date;
summary ingestion and descriptive values were updated on 19 October.
Source-reference annotations and the reported-pair diagnostic were updated
on 30 October. The underlying CSV, matrix, simulated FID, WAV and plot files
are retained; these metadata corrections do not constitute new acquisition.
The recorded full 1.7.2 Python suite includes these five scientific checks.
No new hardware acquisition or human listening study is claimed. The source
thesis PDF and complete textbooks are not redistributed in this repository.
