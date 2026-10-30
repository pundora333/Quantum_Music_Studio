# Quantum Music Studio

Version **1.7.2** · Author **Panagiota Brousali (Μπρούσαλη Παναγιώτα)** · Creative name **Pundora**.

Quantum Music Studio is an interactive instrument for two-qubit music
sonification and synthetic two-spin NMR free-induction decay. It includes
a JavaScript/Web Audio browser application and a local Python/Qiskit
implementation with the same browser interface and command-line rendering.
It simulates quantum models on a classical computer.

## Start without installation

Open **`web/offline/Quantum_Studio_Offline.html`** in a modern browser.
The application, MP3 encoder and fonts are bundled locally. No Python,
provider account or network connection is needed for this edition.
Press Play to unlock browser audio. English is the default language;
Greek is available from the language selector.

## Run the Python edition

Python 3.12 was used for verification. From the repository root:

Linux/macOS:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python run_studio.py
```

Windows PowerShell:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe run_studio.py
```

Open **http://127.0.0.1:8765** and keep the terminal running. Ctrl+C stops
the server. For a different port, use `python run_studio.py serve --port 8766`.
The server binds only to loopback. Installation downloads dependencies;
runtime does not send audio or configurations to a remote service.

## Use the labs

- **Music Lab:** prepare two ideal qubits, inspect the Bloch spheres and
  probabilities, edit a circuit using 14 named unitary gates, choose a
  musical mapping, audition effects and export WAV/MP3.
- **NMR Lab:** change density-state preparation, relaxation, coupling,
  static broadening and ideal echo; inspect synthetic FID and spectrum;
  export sound, data, figures and session settings.
- **User Guide:** use the in-app guide and contextual explanations. The
  first-visit tour highlights controls without replacing the workspace.

Create sound and Explore a phenomenon share each lab's session. Advanced
controls open on demand. Playback and exports follow the active lab.
The explanation and reference panels reopen from their named buttons.
See [the quick user guide](docs/USER_GUIDE_EN.md).

## Reproduce command-line examples

Use the Python interpreter from your virtual environment:

```sh
python run_studio.py render --session examples/Minimal_Circuit_Session.json --out reproduced/minimal --mp3
python run_studio.py render --session examples/Hahn_Echo_Session.json --out reproduced/echo --mp3
python run_studio.py notes
```

`--duration 12.5` sets audio duration in seconds. `--samples 2048` controls
physical FID samples. Exports include session JSON, complex FID JSON/CSV,
WAV, optional MP3 and figures. Example sessions, rendered outputs and
calibration examples are in `examples/`. T1/T2 preset values remain
illustrative where stated; they are not per-nucleus measurements.

## Model and interpretation

- Basis order is |q0 q1> = 00, 01, 10, 11. Studio q0 maps to Qiskit wire 1.
- Music uses an ideal pure state, X/Y/Z Born probabilities and seeded
  samples. Pure-state concurrence is not a mixed-state NMR measure.
- NMR uses density matrices and either an illustrative pseudo-pure ensemble
  with epsilon=1e-5 or abstract qubits relaxing toward |0>.
- The rotating-frame Hamiltonian is
  H/hbar = pi(nu0 Z0 + nu1 Z1 + J Z0 Z1/2), with nu and J in Hz.
  Relaxation requires T2 <= 2 T1.
- T2* combines exponential T2 decay with Gaussian static broadening.
  Ideal Hahn echo refocuses static offsets, not irreversible T2 loss or
  generally J coupling.
- Synthetic ensemble FID is not hardware bitstrings or complete tomography.
  Local silence can coexist with joint coherence.
- A4=435 Hz anchors the 36 equal-tempered notes C3–B5. Just/custom tunings,
  time stretching, gain, effects and 120–180 BPM model-linked rhythm are
  explicit artistic mappings. RF Larmor frequencies are not played.
- Controlled A/B comparisons declare changed and fixed parameters. Decay
  comparisons can hold the musical rhythm fixed or bypass the pulse.

See [Python methods](docs/Python_Methods_GR.md) and the in-app references.

## Verification and research data

The recorded full verification of version 1.7.2 on 21 October 2026 passed
**94 JavaScript and 41 Python tests**, with no failures or skips. Five
secondary NMR analysis checks are included in the 41. Dated logs and
desktop Chrome verification are in `research/circuit_2026-10-21/`.
These are software checks, not a listener study, a new hardware experiment
or full browser/accessibility certification.

```sh
python -m pip install -r requirements-lock.txt
npm --prefix web ci
npm --prefix web test
python -m pytest python/tests research/test_parras_analysis.py -q
```

Node.js 24 and FFmpeg are used by GitHub CI. Missing prerequisites may
cause explicit test skips; report them separately from passes.
See [the test guide](docs/TEST_GUIDE_GR.md).

The attributed secondary NMR analysis contains **one available matrix and
39 summary records**, not 39 complete matrices. Raw and transformed states
remain distinct. See [data provenance and scope](research/parras_2026/README.md)
and [the research index](research/README.md).
`SOURCE_MANIFEST.json` lists the files and SHA256 hashes of this repository
package, excluding the manifest itself.

## Citation and distribution

The thesis reference release is **Quantum Music Studio 1.7.2 — Thesis edition**,
published on 30 October 2026 and archived in Zenodo:

- Version DOI: **[10.5281/zenodo.23804236](https://doi.org/10.5281/zenodo.23804236)**.
- [GitHub release](https://github.com/pundora333/Quantum_Music_Studio/releases/tag/quantum-music-studio-v1.7.2-thesis-301026).
- Release tag: `quantum-music-studio-v1.7.2-thesis-301026`.
- Archived source commit: `3d2ed241c7f3ef78fee82254b90ac7777ef75cb5`.

Suggested citation:

> Brousali, P. (2026). *Quantum Music Studio 1.7.2 — Thesis edition*
> (Version 1.7.2) [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.23804236

Use `CITATION.cff` for machine-readable citation metadata. The version DOI
identifies the frozen release above. This distribution adds the assigned DOI
to the citation metadata after archiving; executable code, scientific data,
examples and license terms remain those of the archived release. Use the
Zenodo archive to reproduce the thesis reference snapshot.

Original first-party software is subject to **prior written permission** from
Μπρούσαλη Παναγιώτα (Pundora) under [LICENSE](LICENSE), including academic,
non-commercial and commercial reuse. Attribution alone does not grant permission.
Request permission through the repository issue tracker and wait for express
written authorization. Applicable legal exceptions and hosting-platform rights
are preserved. The thesis text has separate copyright terms; scholarly use must
provide the appropriate citation.
Third-party software, fonts and attributed research data retain separate
terms and provenance; see [material scope](docs/RIGHTS_SCOPE.md) and
`THIRD_PARTY_NOTICES.md`. The upstream encoder source and license texts
are included. [AI assistance](docs/AI_ASSISTANCE.md) is disclosed separately.
