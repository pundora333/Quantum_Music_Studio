import { DEFAULT_ROOT } from "./notes.js";
export const labels = ["00", "01", "10", "11"];
export const intervals = ["1", "m2", "M2", "m3", "M3", "4", "TT", "5", "m6", "M6", "m7", "M7", "8"];
export const ratios = [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8, 2];
export const ratioNames = ["1/1", "16/15", "9/8", "6/5", "5/4", "4/3", "45/32", "3/2", "8/5", "5/3", "9/5", "15/8", "2/1"];
const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const scale = (a, k) => [a[0] * k, a[1] * k];
const conj = (a) => [a[0], -a[1]];
const norm2 = (a) => a[0] * a[0] + a[1] * a[1];
export function prepare({ theta0, phi0, theta1, phi1, cnot }) {
  const qubit = (theta, phi) => [[Math.cos(theta / 2), 0], [Math.sin(theta / 2) * Math.cos(phi), Math.sin(theta / 2) * Math.sin(phi)]];
  const a = qubit(theta0, phi0), b = qubit(theta1, phi1);
  const state = [mul(a[0], b[0]), mul(a[0], b[1]), mul(a[1], b[0]), mul(a[1], b[1])];
  if (cnot) [state[2], state[3]] = [state[3], state[2]];
  return state;
}
function localBasis(state, q, basis) {
  const out = state.map((a) => a.slice()), bit = q === 0 ? 2 : 1;
  for (let i = 0; i < 4; i++) if (!(i & bit)) {
    const j = i | bit, a = state[i], b = basis === "Y" ? mul([0, -1], state[j]) : state[j];
    if (basis !== "Z") {
      out[i] = scale(add(a, b), Math.SQRT1_2);
      out[j] = scale(sub(a, b), Math.SQRT1_2);
    }
  }
  return out;
}
export function measurementAmplitudes(state, basis0 = "Z", basis1 = "Z") {
  return localBasis(localBasis(state, 0, basis0), 1, basis1);
}
export function probabilities(state, basis0 = "Z", basis1 = "Z") {
  const p = measurementAmplitudes(state, basis0, basis1).map(norm2), sum = p.reduce((a, b) => a + b, 0);
  return p.map((x) => Math.max(0, x / sum));
}
export function concurrence(s) {
  return Math.min(1, 2 * Math.sqrt(norm2(sub(mul(s[0], s[3]), mul(s[1], s[2])))));
}
export function bloch(s, q) {
  const bit = q === 0 ? 2 : 1;
  let z = 0, coherence = [0, 0];
  for (let i = 0; i < 4; i++) {
    z += (i & bit ? -1 : 1) * norm2(s[i]);
    if (!(i & bit)) coherence = add(coherence, mul(conj(s[i]), s[i | bit]));
  }
  return [2 * coherence[0], 2 * coherence[1], z];
}
export function seeded(seed) {
  let n = seed >>> 0;
  return () => {
    n += 1831565813;
    let t = n;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function sample(p, u) {
  let total = 0;
  for (let i = 0; i < p.length; i++) {
    total += p[i];
    if (u < total) return i;
  }
  return p.length - 1;
}
export function makeTake(p, seed, length = 16) {
  const rng = seeded(seed);
  return Array.from({ length }, () => sample(p, rng()));
}
export function centsFor(degree, tuning, customCents = 0) {
  return tuning === "equal" ? degree * 100 : tuning === "just" ? 1200 * Math.log2(ratios[degree]) : Number(customCents);
}
export function frequency(root, degree, tuning, customCents = 0) {
  return root * 2 ** (centsFor(degree, tuning, customCents) / 1200);
}
export function voicePlan(config, outcome) {
  const weights = config.mode === "chord" ? config.probs.map(Math.sqrt) : config.probs.map((_, i) => i === outcome ? 1 : 0);
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  return weights.flatMap((w, i) => w > 1e-8 ? [{ outcome: i, frequency: frequency(config.root, config.degrees[i], config.tuning, config.custom[i]), amplitude: 0.28 * w / sum }] : []);
}
export function defaultConfig() {
  return { theta0: Math.PI / 2, phi0: 0, theta1: Math.PI * 0.32, phi1: 0, cnot: true, basis0: "Z", basis1: "Z", root: DEFAULT_ROOT, degrees: [0, 4, 7, 12], custom: [0, 386.313714, 701.955001, 1200], tuning: "just", mode: "shots", bpm: 150, division: 2, gate: 0.7, wave: "triangle", cutoff: 3200, volume: -12, seed: 271828 };
}
