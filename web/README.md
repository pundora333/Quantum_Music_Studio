# Browser application

Quantum Music Studio 1.7.2 has three tabs: Music Lab, NMR Lab and User Guide.
English is the default; Greek is selectable. Both labs have independent
sessions and a shared playback/export bar that follows the active lab.

Open `offline/Quantum_Studio_Offline.html` directly for the self-contained
edition. All runtime scripts, the MP3 encoder and fonts are local. Browser
audio starts after a user interaction. No hosted login service, analytics,
quantum-provider calls or audio uploads are included in this repository.

The canonical browser modules and assets are in `dist/`. To install test
dependencies and run tests from the repository root:

```sh
npm --prefix web ci
npm --prefix web test
```

To rebuild the offline HTML after editing browser source:

```sh
npm --prefix web run build
```

The build consumes the existing local assets and packages an independent
HTML file. Keep the bundled license notices and encoder source.
Python's `frontend.py` adapts selected modules in memory for the local
Python/Qiskit server; it does not overwrite the browser sources.

Music Lab exposes the 14 ideal unitary gates H, X, Y, Z, S, S†, T, Rx, Ry,
Rz, P, CNOT, CZ and SWAP. NMR also supports its non-unitary Wait/MZ
operations. The UI distinguishes these models and uses left-bit q0 order.
The Unity adapter in `Unity/` consumes exported complex FID JSON and
implements the declared dry FID/carrier mapping; compilation in Unity
is not claimed by the recorded browser/Python checks.

See the [project README](../README.md), [quick user guide](../docs/USER_GUIDE_EN.md)
and the built-in User Guide for controls, mappings and scientific limits.
