import { DEFAULT_ROOT } from "./notes.js";
export const EPSILON = 1e-5;
export const MOLECULES = [
  { id: "chloroform", name: "¹³C-labelled chloroform", formula: "¹³CHCl₃", spins: ["¹H", "¹³C"], chord: [0, 4, 7, 12], nu: [18, -32], j: 210, t1: [800, 1e3], t2: [160, 240], star: [55, 80], source: "Jones, Quantum Computing with NMR (2011)" },
  { id: "phosphite", name: "Dimethyl phosphite", formula: "(CH₃O)₂P(O)H", spins: ["¹H (P–H)", "³¹P"], chord: [0, 3, 7, 12], nu: [-24, 42], j: 120, t1: [700, 900], t2: [140, 220], star: [45, 70], source: "Hou et al., SpinQ Gemini (2021)" },
  { id: "formate", name: "¹³C-labelled sodium formate", formula: "H¹³COO⁻ Na⁺", spins: ["¹H", "¹³C"], chord: [0, 5, 7, 10], nu: [28, -16], j: 160, t1: [900, 1100], t2: [200, 300], star: [65, 95], source: "Leung et al., PRA 60, 1924 (1999)" }
];
const C = (r = 0, i = 0) => [r, i], add = (a, b) => C(a[0] + b[0], a[1] + b[1]), mul = (a, b) => C(a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]);
const fromRows = (rows) => Float64Array.from(rows.flat(2));
export const I2 = fromRows([[C(1), C()], [C(), C(1)]]);
export const X = fromRows([[C(), C(1)], [C(1), C()]]), Y = fromRows([[C(), C(0, -1)], [C(0, 1), C()]]), Z = fromRows([[C(1), C()], [C(), C(-1)]]);
export const GATES = {
  H: { matrix: "1/√2 · [[1, 1], [1, −1]]", help: "Exchanges Z and X axes. It can create transverse coherence; the FID depends on the input state." },
  X: { matrix: "[[0, 1], [1, 0]]", help: "π rotation about x (up to global phase); swaps populations. Refocuses static offsets only in an echo sequence." },
  Y: { matrix: "[[0, −i], [i, 0]]", help: "π rotation about y (up to global phase); swaps populations and reverses x and z." },
  Z: { matrix: "[[1, 0], [0, −1]]", help: "π phase flip; reverses transverse coherence without changing Z populations." },
  S: { matrix: "[[1, 0], [0, i]]", help: "Relative phase +π/2; rotates transverse magnetization from x toward y." },
  "S†": { matrix: "[[1, 0], [0, −i]]", help: "Relative phase −π/2. Together with H it selects a Y measurement basis." },
  T: { matrix: "[[1, 0], [0, exp(iπ/4)]]", help: "Relative phase +π/4; changes FID quadrature, not the Z populations." },
  Rx: { matrix: "[[cos(a/2), −i sin(a/2)], [−i sin(a/2), cos(a/2)]]", help: "Rₓ(a)=exp(−iaX/2). Pulse angle a is editable; rotates y and z." },
  Ry: { matrix: "[[cos(a/2), −sin(a/2)], [sin(a/2), cos(a/2)]]", help: "Rᵧ(a)=exp(−iaY/2). A +90° pulse maps +z to +x and starts an FID." },
  Rz: { matrix: "[[exp(−ia/2), 0], [0, exp(ia/2)]]", help: "Rz(a)=exp(−iaZ/2). Rotates transverse phase; populations stay unchanged." },
  P: { matrix: "[[1, 0], [0, exp(ia)]]", help: "Phase gate; equivalent to Rz(a) up to global phase. Changes x/y coherence." },
  CNOT: { matrix: "q0 control: [[1,0,0,0],[0,1,0,0],[0,0,0,1],[0,0,1,0]]", help: "The row where you drop the gate is the control; the other row is the target. Can produce correlations and entanglement." },
  CZ: { matrix: "diag(1, 1, 1, −1)", help: "Adds a π phase to |11⟩. Its effect on the local FID depends on the joint state." },
  SWAP: { matrix: "[[1,0,0,0],[0,0,1,0],[0,1,0,0],[0,0,0,1]]", help: "Exchanges the two quantum states. Stereo follows the observed spin labels, not a physical spatial motion." },
  Wait: { matrix: "ρ → EΔt(ρ), with H/ℏ=πν₀Z₀+πν₁Z₁+(πJ/2)Z₀Z₁", help: "A global delay: coupling, rotating-frame precession, T₁ and T₂ act on both spins. This is a channel, not a unitary gate." },
  MZ: { matrix: "E(ρ)=P₀ρP₀+P₁ρP₁; P₀=diag(1,0), P₁=diag(0,1)", help: "Nonselective computational measurement on this qubit. Removes its Z-basis coherence; no bitstring is sampled. This is not an NMR detection pulse." }
};
export const twoQ = (type) => ["CNOT", "CZ", "SWAP", "Wait"].includes(type);
export function kron(a, b) {
  const out = new Float64Array(32);
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) for (let l = 0; l < 2; l++) {
    const v = mul([a[2 * (i * 2 + j)], a[2 * (i * 2 + j) + 1]], [b[2 * (k * 2 + l)], b[2 * (k * 2 + l) + 1]]), p = 2 * ((i * 2 + k) * 4 + j * 2 + l);
    out[p] = v[0];
    out[p + 1] = v[1];
  }
  return out;
}
export function gateMatrix(type, angle = 90, q = 0) {
  const a = angle * Math.PI / 180, c = Math.cos(a / 2), s = Math.sin(a / 2);
  let m;
  if (type === "H") m = fromRows([[C(Math.SQRT1_2), C(Math.SQRT1_2)], [C(Math.SQRT1_2), C(-Math.SQRT1_2)]]);
  else if (type === "X") m = X;
  else if (type === "Y") m = Y;
  else if (type === "Z") m = Z;
  else if (["S", "S†", "T", "P", "Rz"].includes(type)) {
    const phase = type === "S" ? Math.PI / 2 : type === "S†" ? -Math.PI / 2 : type === "T" ? Math.PI / 4 : a;
    m = fromRows([[type === "Rz" ? C(Math.cos(-a / 2), Math.sin(-a / 2)) : C(1), C()], [C(), type === "Rz" ? C(Math.cos(a / 2), Math.sin(a / 2)) : C(Math.cos(phase), Math.sin(phase))]]);
  } else if (type === "Rx") m = fromRows([[C(c), C(0, -s)], [C(0, -s), C(c)]]);
  else if (type === "Ry") m = fromRows([[C(c), C(-s)], [C(s), C(c)]]);
  else if (type === "CNOT" || type === "CZ" || type === "SWAP") {
    const out = new Float64Array(32);
    for (let col = 0; col < 4; col++) {
      let row = col, sign = 1;
      if (type === "CNOT" && col & (q === 0 ? 2 : 1)) row = col ^ (q === 0 ? 1 : 2);
      if (type === "SWAP") row = (col & 1) << 1 | (col & 2) >> 1;
      if (type === "CZ" && col === 3) sign = -1;
      out[2 * (row * 4 + col)] = sign;
    }
    return out;
  } else throw Error("Unknown unitary gate: " + type);
  return q === 0 ? kron(m, I2) : kron(I2, m);
}
export function unitary(rho, u) {
  const tmp = new Float64Array(32), out = new Float64Array(32);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) {
    const p = 2 * (i * 4 + j), a = 2 * (i * 4 + k), b = 2 * (k * 4 + j);
    tmp[p] += u[a] * rho[b] - u[a + 1] * rho[b + 1];
    tmp[p + 1] += u[a] * rho[b + 1] + u[a + 1] * rho[b];
  }
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) {
    const p = 2 * (i * 4 + j), a = 2 * (i * 4 + k), b = 2 * (j * 4 + k);
    out[p] += tmp[a] * u[b] + tmp[a + 1] * u[b + 1];
    out[p + 1] += tmp[a + 1] * u[b] - tmp[a] * u[b + 1];
  }
  return out;
}
export function initialDensity(c) {
  const local = c.qubits.map((b) => {
    const th = b.theta * Math.PI / 180, ph = b.phi * Math.PI / 180, x = b.radius * Math.sin(th) * Math.cos(ph), y = b.radius * Math.sin(th) * Math.sin(ph), z = b.radius * Math.cos(th);
    return fromRows([[C((1 + z) / 2), C(x / 2, -y / 2)], [C(x / 2, y / 2), C((1 - z) / 2)]]);
  });
  const out = kron(...local);
  if (c.model === "nmr") {
    for (let i = 0; i < 32; i++) out[i] *= EPSILON;
    for (let i = 0; i < 4; i++) out[2 * (i * 4 + i)] += (1 - EPSILON) / 4;
  }
  return out;
}
export function bloch(rho, q) {
  const mask = q === 0 ? 2 : 1;
  let x = 0, y = 0, z = 0;
  for (let i = 0; i < 4; i++) {
    z += (i & mask ? -1 : 1) * rho[2 * (i * 4 + i)];
    if (!(i & mask)) {
      const p = 2 * ((i | mask) * 4 + i);
      x += 2 * rho[p];
      y += 2 * rho[p + 1];
    }
  }
  return [x, y, z];
}
export function purity(rho) {
  let sum = 0;
  for (let i = 0; i < 32; i++) sum += rho[i] * rho[i];
  return sum;
}
export function dephase(rho, q, factor = 0) {
  const out = new Float64Array(rho), mask = q === 0 ? 2 : 1;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i & mask) !== (j & mask)) {
    const p = 2 * (i * 4 + j);
    out[p] *= factor;
    out[p + 1] *= factor;
  }
  return out;
}
export function relax(rho, q, dt, t1ms, t2ms, zeq = 1) {
  if (!(t1ms > 0 && t2ms > 0 && t2ms <= 2 * t1ms + 1e-10)) throw Error("The Markovian model requires 0 < T₂ ≤ 2T₁.");
  const g = -Math.expm1(-dt / (t1ms / 1e3)), p = (1 + zeq) / 2, f = Math.exp(-dt / (t2ms / 1e3)), mask = q === 0 ? 2 : 1, out = new Float64Array(rho);
  for (let i = 0; i < 4; i++) if (!(i & mask)) {
    for (let j = 0; j < 4; j++) if (!(j & mask)) {
      const a = 2 * (i * 4 + j), d = 2 * ((i | mask) * 4 + (j | mask));
      for (let k = 0; k < 2; k++) {
        out[a + k] = (1 - (1 - p) * g) * rho[a + k] + p * g * rho[d + k];
        out[d + k] = (1 - p) * g * rho[a + k] + (1 - p * g) * rho[d + k];
      }
    }
  }
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i & mask) !== (j & mask)) {
    const k = 2 * (i * 4 + j);
    out[k] *= f;
    out[k + 1] *= f;
  }
  return out;
}
function precess(rho, dt, c) {
  const energies = [0, 1, 2, 3].map((i) => {
    const a = i & 2 ? -1 : 1, b = i & 1 ? -1 : 1;
    return Math.PI * (c.qubits[0].nu * a + c.qubits[1].nu * b + c.j * a * b / 2);
  }), out = new Float64Array(32);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    const p = 2 * (i * 4 + j), ph = -(energies[i] - energies[j]) * dt, co = Math.cos(ph), si = Math.sin(ph);
    out[p] = rho[p] * co - rho[p + 1] * si;
    out[p + 1] = rho[p] * si + rho[p + 1] * co;
  }
  return out;
}
export function evolve(rho, seconds, c, maxStep = 1e-4) {
  const n = Math.max(1, Math.ceil(seconds / maxStep)), dt = seconds / n;
  let out = rho;
  for (let i = 0; i < n; i++) {
    out = precess(out, dt / 2, c);
    for (let q = 0; q < 2; q++) out = relax(out, q, dt, c.qubits[q].t1, c.qubits[q].t2, c.model === "nmr" ? EPSILON : 1);
    out = precess(out, dt / 2, c);
  }
  return out;
}
export function circuitDensity(c) {
  let rho = initialDensity(c);
  for (const g of [...c.circuit].sort((a, b) => a.step - b.step || a.q - b.q)) {
    if (g.type === "Wait") rho = evolve(rho, g.ms / 1e3, c);
    else if (g.type === "MZ") rho = dephase(rho, g.q);
    else rho = unitary(rho, gateMatrix(g.type, g.angle, g.q));
  }
  return rho;
}
export function starSigma(t2ms, starms) {
  if (!(starms > 0 && starms <= t2ms)) throw Error("T₂* must be positive and at most T₂.");
  const t = starms / 1e3;
  return Math.sqrt(Math.max(0, 1 - starms / t2ms)) / (Math.SQRT2 * Math.PI * t);
}
export function envelope(t, t2ms, starms, echo = false, tau = 0) {
  const q = echo && t > tau ? 2 * tau - t : t, s = starSigma(t2ms, starms);
  return Math.exp(-t / (t2ms / 1e3) - 2 * Math.PI * Math.PI * s * s * q * q);
}
export function acquire(c, { samples = 2048, maxStep = 1e-4, forceEcho } = {}) {
  let rho = circuitDensity(c);
  const beforeReadout = new Float64Array(rho);
  for (let q = 0; q < 2; q++) if (c.readout === "both" || c.readout === "q" + q) rho = unitary(rho, gateMatrix("Ry", 90, q));
  const initial = new Float64Array(rho), window = c.windowMs / 1e3, tau = c.tauMs / 1e3, echo = forceEcho ?? c.echo, scale = c.model === "nmr" ? 1 / EPSILON : 1;
  const lines = Array.from({ length: 4 }, () => new Float64Array(samples * 2)), signal = Array.from({ length: 2 }, () => new Float64Array(samples * 2)), pop = Array.from({ length: 2 }, () => new Float64Array(samples)), z = Array.from({ length: 2 }, () => new Float64Array(samples));
  const env = Array.from({ length: 2 }, () => new Float64Array(samples)), hom = Array.from({ length: 2 }, () => new Float64Array(samples)), noEcho = Array.from({ length: 2 }, () => new Float64Array(samples)), pairs = [[2, 0], [3, 1], [1, 0], [3, 2]];
  let previous = 0, pulsed = false;
  for (let n = 0; n < samples; n++) {
    const t = n * window / (samples - 1);
    if (echo && !pulsed && t >= tau) {
      rho = evolve(rho, Math.max(0, tau - previous), c, maxStep);
      rho = unitary(unitary(rho, gateMatrix("X", 180, 0)), gateMatrix("X", 180, 1));
      previous = tau;
      pulsed = true;
    }
    rho = evolve(rho, t - previous, c, maxStep);
    previous = t;
    for (let q = 0; q < 2; q++) {
      const b = bloch(rho, q), path = echo && t > tau ? 2 * tau - t : t, sigma = starSigma(c.qubits[q].t2, c.qubits[q].star), staticFactor = Math.exp(-2 * Math.PI * Math.PI * sigma * sigma * path * path);
      z[q][n] = b[2];
      pop[q][n] = (1 - b[2]) / 2;
      env[q][n] = envelope(t, c.qubits[q].t2, c.qubits[q].star, echo, tau);
      hom[q][n] = Math.exp(-t / (c.qubits[q].t2 / 1e3));
      noEcho[q][n] = envelope(t, c.qubits[q].t2, c.qubits[q].star, false, tau);
      for (let l = q * 2; l < q * 2 + 2; l++) {
        const [i, j] = pairs[l], p = 2 * (i * 4 + j);
        lines[l][2 * n] = 2 * rho[p] * staticFactor * scale;
        lines[l][2 * n + 1] = 2 * rho[p + 1] * staticFactor * scale;
        signal[q][2 * n] += lines[l][2 * n];
        signal[q][2 * n + 1] += lines[l][2 * n + 1];
      }
    }
  }
  let final = new Float64Array(rho);
  for (let q = 0; q < 2; q++) {
    const path = echo ? 2 * tau - window : window, sigma = starSigma(c.qubits[q].t2, c.qubits[q].star);
    final = dephase(final, q, Math.exp(-2 * Math.PI * Math.PI * sigma * sigma * path * path));
  }
  return { samples, window, dt: window / (samples - 1), scale, lines, signal, pop, z, env, hom, noEcho, initial, beforeReadout, final, frequencies: [c.qubits[0].nu + c.j / 2, c.qubits[0].nu - c.j / 2, c.qubits[1].nu + c.j / 2, c.qubits[1].nu - c.j / 2] };
}
export function fftComplex(input, dt) {
  const n = input.length / 2, re = new Float64Array(n), im = new Float64Array(n);
  if ((n & n - 1) !== 0) throw Error("FFT length must be a power of two.");
  for (let i = 0; i < n; i++) {
    let j = 0, k = i;
    for (let b = 1; b < n; b <<= 1) {
      j = j << 1 | k & 1;
      k >>= 1;
    }
    re[j] = input[2 * i];
    im[j] = input[2 * i + 1];
  }
  for (let len = 2; len <= n; len <<= 1) for (let start = 0; start < n; start += len) for (let j = 0; j < len / 2; j++) {
    const angle = -2 * Math.PI * j / len, co = Math.cos(angle), si = Math.sin(angle), a = start + j, b = a + len / 2, tr = co * re[b] - si * im[b], ti = si * re[b] + co * im[b];
    re[b] = re[a] - tr;
    im[b] = im[a] - ti;
    re[a] += tr;
    im[a] += ti;
  }
  return Array.from({ length: n }, (_, j) => {
    const k = (j + n / 2) % n;
    return { hz: (j - n / 2) / (n * dt), re: re[k] / n, im: im[k] / n, mag: Math.hypot(re[k], im[k]) / n };
  });
}
export function defaults() {
  const m = MOLECULES[0];
  return { version: 3, molecule: m.id, model: "nmr", qubits: m.spins.map((_, q) => ({ theta: 0, phi: 0, radius: 1, t1: m.t1[q], t2: m.t2[q], star: m.star[q], nu: m.nu[q] })), j: m.j, windowMs: 400, tauMs: 100, echo: false, readout: "none", observed: "both", stereo: "split", columns: 10, circuit: [{ step: 0, q: 0, type: "Ry", angle: 90 }, { step: 0, q: 1, type: "Ry", angle: 90 }], root: DEFAULT_ROOT, tuning: "equal", custom: [0, 386.3137, 701.955, 1200], sound: "fid", duration: 8, level: -6, fx: 0, seed: 271828, source: "Illustrative simulation; not measured hardware data" };
}
export function validate(c) {
  if (!c || ![2, 3].includes(c.version) || !MOLECULES.some((m) => m.id === c.molecule) || !["nmr", "qubit"].includes(c.model)) throw Error("Unsupported studio session.");
  if (c.version === 2) {
    c.version = 3;
    c.stereo ??= "split";
  }
  if (!["split", "center"].includes(c.stereo)) throw Error("Invalid listening route.");
  const number = (v, lo, hi, name) => {
    if (!Number.isFinite(v) || v < lo || v > hi) throw Error("Invalid " + name + ".");
  };
  if (!Array.isArray(c.qubits) || c.qubits.length !== 2) throw Error("Two qubits are required.");
  for (const q of c.qubits) {
    for (const [key, lo, hi] of [["theta", 0, 180], ["phi", -180, 180], ["radius", 0, 1], ["t1", 0.1, 1e5], ["t2", 0.1, 2e5], ["star", 0.01, 2e5], ["nu", -1e4, 1e4]]) number(q[key], lo, hi, key);
    if (q.t2 > 2 * q.t1 || q.star > q.t2) throw Error("Require T₂ ≤ 2T₁ and T₂* ≤ T₂.");
  }
  number(c.j, 0, 1e4, "J");
  number(c.windowMs, 1, 1e4, "window");
  number(c.tauMs, 0, c.windowMs / 2, "echo delay");
  number(c.columns, 1, 64, "columns");
  if (!Number.isInteger(c.columns)) throw Error("Invalid columns.");
  if (!["none", "q0", "q1", "both"].includes(c.readout) || !["q0", "q1", "both"].includes(c.observed) || typeof c.echo !== "boolean") throw Error("Invalid readout.");
  if (!Array.isArray(c.circuit) || c.circuit.length > 128) throw Error("Invalid circuit.");
  const occupied = /* @__PURE__ */ new Set();
  for (const g of c.circuit) {
    if (!Object.hasOwn(GATES, g.type) || !Number.isInteger(g.step) || g.step < 0 || g.step >= c.columns || ![0, 1].includes(g.q)) throw Error("Invalid gate.");
    if (["Rx", "Ry", "Rz", "P"].includes(g.type)) number(g.angle, -3600, 3600, "angle");
    if (g.type === "Wait") number(g.ms, 0, 1e4, "delay");
    for (const q of twoQ(g.type) ? [0, 1] : [g.q]) {
      const k = g.step + ":" + q;
      if (occupied.has(k)) throw Error("Overlapping gates.");
      occupied.add(k);
    }
  }
  number(c.root, 20, 2e3, "root");
  number(c.duration, 0.01, Number.MAX_SAFE_INTEGER / 44100, "duration");
  number(c.level, -60, -3, "level");
  number(c.fx, 0, 1, "texture");
  number(c.seed, 0, 4294967295, "seed");
  if (!["equal", "just", "custom"].includes(c.tuning) || !["fid", "transitions", "population", "excitation"].includes(c.sound)) throw Error("Invalid sound mapping.");
  if (!Array.isArray(c.custom) || c.custom.length !== 4) throw Error("Four custom intervals required.");
  c.custom.forEach((v) => number(v, -2400, 3600, "cents"));
  if (typeof c.source !== "string" || c.source.length > 500) throw Error("Invalid source label.");
  return c;
}
export const RATIOS = [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8, 2];
export function mappedFrequencies(c) {
  const m = MOLECULES.find((m2) => m2.id === c.molecule);
  return m.chord.map((d, i) => c.root * (c.tuning === "equal" ? 2 ** (d / 12) : c.tuning === "custom" ? 2 ** (c.custom[i] / 1200) : RATIOS[d]));
}
