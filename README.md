[README.md]
# Pundora Quantum Music Studio

An owner-private browser instrument with two benches. Music studio retains the original pure-state music model. Circuit & NMR studio adds a 4×4 density matrix, circuit drag/drop, local T1/T2 channels, synthetic complex FID, Gaussian T2* inhomogeneity and ideal Hahn refocusing. All runtime code, including MP3 encoding and the gothic font, is local; no analytics, QPU backend or audio uploads. Authentication is enforced by Sites hosting. The standalone HTML runs without hosting or networking. The left footer preserves its original LAB wording at the owner's request.

## Version 1 studio

The 36-note bank covers C3–B5 in scientific pitch notation, with A4=435 Hz and exact 12-TET frequencies. Both benches offer note selection. Classical one-second reference tests are independent of the quantum state. Root-relative just/custom tunings retain their own actual frequencies. Split or centered listening uses the same renderer for live audio and file exports; v3 dry gain is 0.8×10^(level/20). The FID panel includes a prominent image-format/download control. Old version-2 studio sessions migrate without changing their saved root or level.

Gate palette: H/X/Y/Z/S/S†/T/Rx/Ry/Rz/P/CNOT/CZ/SWAP/Wait/MZ; matrices appear on hover/focus. q0 is the left bit; dropping CNOT chooses its control row. Readout can rotate either/both spins. Local Bloch controls include initial radius and independent T1/T2/T2*, with T2 ≤ 2 T1. Abstract qubits relax to |0>; the illustrative NMR ensemble uses a full PPS with epsilon=1e-5 and relaxation toward weak thermal polarization. Physical purity is reported; no pure-state concurrence is used on mixed states.

Rotating-frame H/hbar = pi nu0 Z0 + pi nu1 Z1 + (pi J/2) Z0 Z1. Symmetric Hamiltonian/channel splitting uses internal steps ≤0.1 ms. Static independent Gaussian offsets are introduced during acquisition, with T2* defined as its combined 1/e envelope time. A Hahn pulse refocuses the static part but not irreversible T2; simultaneous pi pulses do not reverse ZZ coupling. Logical gates are instantaneous; no RF compiler, gradients, strong coupling or hardware calibration is claimed.

Molecule presets identify labelled chloroform, dimethyl phosphite and labelled sodium formate active two-spin examples. Their numeric times/offsets/J and assigned musical chords are illustrative. Calibration JSON imports are marked user-provided/unverified. FID carriers, four transition voices, population tones and excitation-gain mappings are explicitly separate artistic choices. FID RF signals are not intrinsically audible. WAV is stereo 44.1 kHz/16 bit, MP3 128 kbps; positive durations are user-selected within device/RIFF constraints. Canvas plots export PNG/JPG/JPEG. JSON/CSV preserve complex quadratures; Unity mapping is included under Unity/.

Run `npm run build` to copy the local encoder and produce `offline/Quantum_Studio_Offline.html`. Open that file directly in a modern browser. No local server is needed. The generated HTML and dependencies are reproducible from this repository; the dependency lockfile is committed. The offline delivery includes LAME source/license for LGPL compliance.

## Physics

Ordering is |q0 q1>, with q0 the left bit. Preparation is Ry(theta), P(phi) per qubit, followed by optional CNOT q0 -> q1. The circuit spans a family of pure two-qubit states, not all possible states. X readout rotates with H; Y readout rotates with S-dagger then H. Concurrence is valid for this pure-state model. Reduced Bloch vectors show local mixedness after entanglement. Shots use independently re-prepared states and seeded classical sampling.

## Instrument

Four independently mapped outcomes; root frequency; 12-TET, one reference-fixed chromatic 5-limit JI palette, or custom cents. Measured melody uses one sampled note per onset. Probability chord uses normalized sqrt(probability) voice amplitudes. Oscillator waveform, low-pass cutoff, tempo, subdivision, gate and output level are adjustable. A/B plays the same 16-step take in 12-TET and the selected non-equal tuning with a frozen parameter snapshot. Settings and seed can be saved locally or exported/imported as JSON.

## Validation

Run `npm run build && npm test`. Tests cover the retained Music lab plus mixed-state dynamics, thermal fixed point, PPS purity, J doublets, Gaussian T2* definition, echo, splitting convergence, FFT sign, exact PCM duration, decodable MP3, live/export renderer identity, audio unlock/stop, DOM circuit interaction and standalone boot without script/style fetch. DOM/canvas/audio mocks verify logic; actual browser layout and speaker output were not verified because browser testing was unavailable. Unity C# was not compiled in Unity.

## Sources

- IBM Quantum Learning, multiple-system quantum information: https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information/multiple-systems/quantum-information
- SFU Handbook for Acoustic Ecology, Just Tuning: https://www.sfu.ca/sonic-studio-webdav/handbook/Just_Tuning.html
- SFU Handbook for Acoustic Ecology, Equal Temperament: https://www.sfu.ca/sonic-studio-webdav/handbook/Equal_Temperament.html
- Jones, Quantum Computing with NMR: https://arxiv.org/abs/1011.1382
- Hou et al., SpinQ Gemini: https://arxiv.org/abs/2101.10017
- Leung et al., two-spin phase damping code: https://arxiv.org/abs/quant-ph/9811068
- Hahn, Spin Echoes: https://doi.org/10.1103/PhysRev.80.580
ing README.md…]()
