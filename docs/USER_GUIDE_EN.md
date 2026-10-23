# Quick user guide

Open `web/offline/Quantum_Studio_Offline.html`, or start the Python edition
using the project README. Click Play to enable audio. Choose English or
Greek with the language selector; the in-app guide follows that choice.

## Create a sound in Music Lab

1. Start with a library example and read which settings it replaces.
2. Inspect the two Bloch spheres, probabilities and active circuit.
3. Select a named gate and place it on the required wire. Click a placed
   gate to inspect, edit, move or remove it. For CNOT the placement wire
   is the control. Rotation and phase gates expose an angle.
4. Choose a mapping, tuning, instrument and tempo, then Play.
5. Change one parameter and compare what you hear with the probabilities
   and the selected measurement basis. A phase change can leave Z
   probabilities unchanged while changing X or Y results.
6. Add effects if desired. Live Music effects update smoothly during
   playback. Undo/Redo returns to earlier settings.
7. Select the sound source and use the WAV or MP3 button near playback.

## Explore NMR

Choose a state/example and inspect the circuit beside the Bloch spheres.
Physical controls govern the synthetic model: preparation, T1, T2, T2*,
frequency offsets, J coupling, acquisition window and echo.
Changing a physical parameter creates a new simulation. Audition that
configuration before exporting. Keep physical time in milliseconds,
audio duration in seconds and musical BPM distinct.

Model-linked rhythm maps the selected times to 120–180 BPM as a creative
choice. For scientific decay comparisons, use fixed rhythm or no pulse.
The comparison details identify what changes, what stays fixed and what
to observe. They can be opened and closed by the user. A comparison TXT
description can accompany exported audio.

An imported effective density matrix is checked for structure, trace,
Hermiticity and positivity. Invalid input is reported. Any clipping and
renormalisation is an explicit transformation, not a recovered measurement.

## Preview and export

The shared bar follows the active lab. Check the displayed audio source
before exporting: the main session or a named frozen preview.
Preview export uses the selected frozen configuration without replacing
the main circuit or saved settings. It does not record earlier live knob
movements or the previous internal state of an effect.

- **With effects:** the selected instrument and processing.
- **Without effects:** the same instrument with effects bypassed.
- **Both versions:** two separate audio files.

The clean sine example also changes instrument/filter settings, so it is
a different example from bypassing effects on the current instrument.
Choose whether to preserve the effect tail and inspect the total duration.
Data, figures and session exports are separate from audio export.

## Save settings and find explanations

Browser save stores settings locally in that browser. It does not create
an audio file or upload a session. Export JSON for a portable session or
separate backup. Music and NMR settings are kept independently.

Reopen a closed explanation panel with its named bar button. Reference
equations and sources reopen from their named reference button. The User
Guide tab remains available. Advanced settings open where needed; changing
Create/Explore view preserves the current lab session.

## Interpret results

All quantum evolution here is simulated. NMR signals are synthetic ensemble
observables, not direct QPU bitstrings or complete tomography. Time stretching,
musical tuning and audio effects are mappings of model output into sound.
Illustrative preset relaxation times are not per-nucleus calibrations.
A silent Bell example can be a valid zero local transverse signal; check
the audio device using a non-silent reference before interpreting silence.
