#########1ο attemp gia haas




import numpy as np
import sounddevice as sd
from qiskit import QuantumCircuit
from qiskit_aer import Aer

def run_quantum_haas(apply_haas=True, note_freq=440.0, duration=10.0):
    fs = 44100  # Sample rate
    t = np.linspace(0, duration, int(fs * duration), False)
    
    # --- 1. ΚΒΑΝΤΙΚΟ ΜΕΡΟΣ (Qiskit) ---
    # Δημιουργούμε ένα κύκλωμα με 1 Qubit
    qc = QuantumCircuit(1)
    
    if apply_haas:
        # Η γωνία theta ελέγχει το Panning (ισορροπία αριστερά/δεξιά)
        # pi/2 σημαίνει 50/50 split (υπέρθεση)
        theta = np.pi / 2 
        qc.ry(theta, 0)
        
        # Η πύλη Phase (P) εισάγει την κβαντική διαφορά φάσης
        # Αυτή η φάση θα μεταφραστεί σε χρονική καθυστέρηση (Haas)
        phi = np.pi / 4  # Η "κβαντική" καθυστέρηση
        qc.p(phi, 0)
    else:
        # Αν το Haas είναι κλειστό, το qubit μένει στην κατάσταση |0> (μόνο αριστερό κανάλι)
        pass

    # Παίρνουμε το Statevector (την κυματοσυνάρτηση)
    backend = Aer.get_backend('statevector_simulator')
    statevector = backend.run(qc).result().get_statevector()
    
    # Εξαγωγή κβαντικών παραμέτρων
    a = statevector[0] # Πλάτος για το |0> (Αριστερό)
    b = statevector[1] # Πλάτος για το |1> (Δεξί)
    
    # --- 2. ΠΑΡΑΓΩΓΗ ΗΧΟΥ (DSP) ---
    # Το αριστερό κανάλι χρησιμοποιεί το πλάτος της κατάστασης |0>
    left_channel = np.real(a) * np.sin(2 * np.pi * note_freq * t)
    
    # Το δεξί κανάλι χρησιμοποιεί το πλάτος της κατάστασης |1>
    # και την κβαντική φάση phi για να δημιουργήσει το Haas Effect (delay)
    if apply_haas:
        # Μετατρέπουμε τη φάση σε καθυστέρηση samples (περίπου 1-20ms)
        # Εδώ η φάση του qubit καθορίζει τη μετατόπιση του ημιτόνου
        phase_shift = np.angle(b)
        right_channel = np.abs(b) * np.sin(2 * np.pi * note_freq * t + phase_shift)
    else:
        right_channel = np.zeros_like(t)

    # Συνένωση καναλιών (Stereo)
    audio_out = np.vstack((left_channel, right_channel)).T
    
    # Normalization για να μην έχουμε clipping
    if np.max(np.abs(audio_out)) > 0:
        audio_out = audio_out / np.max(np.abs(audio_out))
        
    return audio_out, fs

# --- ΡΥΘΜΙΣΕΙΣ ΚΑΙ ΕΚΤΕΛΕΣΗ ---
print("1. Παραγωγή ήχου ΧΩΡΙΣ Κβαντικό Haas (Μόνο Αριστερά)...")
audio_off, fs = run_quantum_haas(apply_haas=False, note_freq=440.0)
sd.play(audio_off, fs)
sd.wait()

print("2. Παραγωγή ήχου ΜΕ Κβαντικό Haas (Stereo Width)...")
# Εδώ το "διακόπτης" apply_haas είναι True
audio_on, fs = run_quantum_haas(apply_haas=True, note_freq=440.0)
sd.play(audio_on, fs)
sd.wait()

print("Τέλος Πειράματος.")
