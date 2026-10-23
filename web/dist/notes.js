// Scientific pitch notation: MIDI 48 = C3, 60 = C4, 69 = A4.
export const A4_HZ=435;
export const NOTE_NAMES=['C','C♯/D♭','D','D♯/E♭','E','F','F♯/G♭','G','G♯/A♭','A','A♯/B♭','B'];
export const noteFrequency=midi=>A4_HZ*2**((midi-69)/12);
export const NOTE_BANK=Array.from({length:36},(_,i)=>{const midi=48+i,octave=Math.floor(midi/12)-1,pc=midi%12;return {midi,octave,name:NOTE_NAMES[pc].split('/').map(n=>n+octave).join('/'),hz:noteFrequency(midi)};});
export const DEFAULT_ROOT=noteFrequency(60);
export const noteOptions=()=>'<option value="">Custom frequency</option>'+NOTE_BANK.map(n=>`<option value="${n.midi}">${n.name} · ${n.hz.toFixed(3)} Hz</option>`).join('');
export function matchedNote(hz){return NOTE_BANK.find(n=>Math.abs(n.hz-hz)<.0006)?.midi??'';}
export function noteCSV(){return 'note,midi,frequency_hz,reference_a4_hz\n'+NOTE_BANK.map(n=>`${n.name},${n.midi},${n.hz.toFixed(9)},${A4_HZ}`).join('\n');}
