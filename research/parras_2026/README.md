# Secondary NMR analysis

Source: Ioannis Parras, *Κβαντική υπολογιστική με πυρηνικό μαγνητικό συντονισμό*,
master's thesis, SEMFE, NTUA, 2026. Fig. 6.3.2, p. 48, supplies one rounded
complex effective density matrix. Fig. 6.3.3, p. 49, and the author-supplied
CSV supply 39 summary/metadata rows. These are **not 39 full matrices**.
`provenance.json` identifies source pages, equations and source-file hashes.

## Files

- `SpinQ_Bell_state_experiments.csv`: original semicolon-delimited source,
  preserved byte for byte.
- `summary_39.csv`: the normalized table, retaining the source numerical
  precision and mapping indicator headers to *_reported.
- `csv_validation_2026-10-19.json`: comparison of 390 fields, correction of
  six earlier transcription values, descriptive results and scope.
- `rho_raw.csv`: the unchanged one-matrix transcription, basis 00,01,10,11.
- `rho_psd.csv`: explicit eigenvalue clipping and trace renormalisation.
- `analysis.json`: raw/PSD metrics, both fidelity conventions and limitations.
- `evolution_configuration.json`: illustrative simulation parameters.
- `fid_comparison.csv` and `comparison.png`: simulated local signals and
  comparison of the transformed example with the ideal Bell state.
- `parras_psd_simulated.wav` and `ideal_bell_simulated.wav`: 8 s, stereo,
  44.1 kHz PCM16, common fixed gain 0.5. The ideal Bell file is silent.

## Interpretation and limits

The raw matrix is not positive semidefinite: its minimum eigenvalue is about
-0.0291. Rounding cannot account for this discrepancy. The raw matrix is
retained; clipping/renormalisation is a declared sensitivity transformation,
not a recovered measurement, maximum-likelihood reconstruction or claimed
nearest trace-one PSD matrix in Frobenius norm.

No defensible Experiment_ID pairs the printed matrix with one of the 39
rows. Complete matrices and paired FID are unavailable for those rows, so
their fidelities cannot be independently recalculated. The source equations
display root fidelity while Appendix Gamma p. 69 squares qutip.fidelity.
Reported CSV values remain unchanged; both conventions are explicit in the
one-matrix analysis. Temp_Error is half the endpoint temperature difference,
not an estimated statistical standard error. The source table does not print
a temperature unit or timezone.

Diagonal readouts and complex off-diagonal reconstruction are distinct;
see source Eqs. 5.2.5–5.2.8 and 5.2.9–5.2.14, pp. 43–44. The basis order is
00,01,10,11. A nucleus assignment for the one printed matrix is not established.
No other unprovided measurements are assumed or analysed.

The transformed state is embedded in (1-epsilon)I/4 + epsilon*rho with
epsilon=1e-5. Shared illustrative settings are J=697.4 Hz; T1=5000 ms,
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
The recorded full 1.7.2 Python suite includes these five scientific checks.
No new hardware acquisition or human listening study is claimed. The source
thesis PDF and complete textbooks are not redistributed in this repository.
