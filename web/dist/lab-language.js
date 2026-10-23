// Interface language is a browser preference, never part of a scientific session.
import {localePairs} from './lab-locale.js';
let language='en';try{language=localStorage.getItem('pundora-ui-language')==='el'?'el':'en';}catch{}
const pairs=`
PURE STATE :: Καθαρή κατάσταση
Rotate each qubit, then optionally couple the pair. :: Περίστρεψε κάθε qubit και προαιρετικά εφάρμοσε CNOT.
LEFT BIT :: Αριστερό bit
RIGHT BIT :: Δεξί bit
CNOT coupling :: Σύζευξη CNOT
Control q0 → target q1 :: Έλεγχος q0 → στόχος q1
CONCURRENCE :: Δείκτης εμπλοκής C
Product state :: Κατάσταση γινομένου
Preparation controls are marked in purple. Click them to focus the matching slider. Added gates keep their order; selecting one opens inspection. :: Τα μωβ στοιχεία ελέγχονται από sliders προετοιμασίας. Επίλεξέ τα για να εστιάσεις στο αντίστοιχο πεδίο. Οι πρόσθετες πύλες διατηρούν τη σειρά τους και ανοίγουν επιθεώρηση.
Measurement :: Μέτρηση
The spheres show each qubit's reduced state after coupling. A shorter arrow means a mixed local state. :: Οι σφαίρες δείχνουν τις μειωμένες καταστάσεις μετά το πλήρες κύκλωμα. Μικρότερο βέλος σημαίνει τοπική ανάμιξη.
BORN RULE :: Κανόνας Born
Change the measurement basis to reveal phase. :: Άλλαξε τη βάση μέτρησης για να εξερευνήσεις τη φάση.
Each step simulates a new preparation and measurement. The 16-shot take repeats; it is not repeated collapse of one qubit pair. :: Κάθε βήμα προσομοιώνει νέα προετοιμασία και μέτρηση. Η ακολουθία 16 δειγμάτων επαναλαμβάνεται· δεν πρόκειται για διαδοχική κατάρρευση του ίδιου ζεύγους.
Seeded classical sampling :: Κλασική δειγματοληψία με seed
CLASSICAL DSP :: Κλασική επεξεργασία ήχου
BLOCH VECTORS :: Διανύσματα Bloch
Local input · radius slider :: Τοπική είσοδος από ακτίνα Bloch
Acquisition · physical time :: Απόκτηση στον φυσικό χρόνο
This Markovian model enforces T₂ ≤ 2T₁ and T₂* ≤ T₂. T₂ decay changes the transverse coherence, not the mean phase angle. T₁ can eventually restore a pure ground state; the Bloch radius need not decrease monotonically. :: Το Markovian μοντέλο απαιτεί T₂ ≤ 2T₁ και T₂* ≤ T₂. Η T₂ αλλάζει την εγκάρσια συνοχή, όχι τη μέση γωνία φάσης. Η T₁ μπορεί τελικά να αποκαταστήσει καθαρή θεμελιώδη κατάσταση· η ακτίνα Bloch δεν μειώνεται υποχρεωτικά μονότονα.
COMPLEX SIGNAL :: Μιγαδικό σήμα
q0 PURPLE / q1 FUCHSIA / SUM GRAY :: q0 μωβ / q1 φούξια / άθροισμα γκρι
Synthetic rotating-frame FID. RF detection is electromagnetic; an audible carrier is added separately. A silent local FID does not prove an absence of quantum coherence in the joint state. :: Συνθετικό FID σε περιστρεφόμενο πλαίσιο. Η πραγματική ανίχνευση RF είναι ηλεκτρομαγνητική· ο ακουστός φορέας προστίθεται χωριστά. Μηδενικό τοπικό FID δεν αποδεικνύει απουσία κοινής κβαντικής συνοχής.
Temporary list: auditions are lost when this page closes. Download sound or its description to keep a version. :: Προσωρινή λίστα: οι δοκιμές χάνονται όταν κλείσει η σελίδα. Κατέβασε τον ήχο ή την περιγραφή του για να κρατήσεις μια εκδοχή.
90° strike · q0 :: Διέγερση 90° στο q0
90° strike · both :: Διέγερση 90° και στα δύο spins
Bell · silent local FID :: Bell · μηδενικό τοπικό FID
Hahn echo lesson :: Παράδειγμα echo Hahn
Music Lab :: Music Lab
NMR Lab :: NMR Lab
User Guide :: Οδηγός χρήσης
Create sound :: Δημιουργία ήχου
Explore a phenomenon :: Πειράματα
Play :: Ακρόαση
Pause :: Παύση
Stop :: Διακοπή
▶ Play FID :: Ακρόαση σήματος
Apply & audition :: Άκου τη νέα ρύθμιση
Ⅱ Pause / resume :: Παύση / συνέχεια
■ Stop :: Διακοπή
Export :: Λήψεις αρχείων
WAV ↓ :: Λήψη WAV
MP3 ↓ :: Λήψη MP3
Audio options :: Ρυθμίσεις λήψης
Audio export options :: Ρυθμίσεις λήψης ήχου
WAV + explanation TXT :: WAV μαζί με περιγραφή TXT
Undo :: Αναίρεση
Redo :: Επανάληψη
Audio :: Ήχος
Audio version :: Εκδοχή ήχου
Processed · current FX :: Με τα επιλεγμένα FX
Clean · bypass FX :: Χωρίς FX · ίδιο όργανο
Both · two separate files :: Και οι δύο · χωριστά αρχεία
Tail policy :: Ουρά εφέ
Include FX tail · up to 12 s :: Διατήρηση ουράς · έως 12 s
Trim to 0.30 s release :: Σύντομο τελείωμα · 0,30 s
16-step loops :: Επαναλήψεις 16 βημάτων
Export WAV :: Λήψη WAV
Export MP3 :: Λήψη MP3
Cancel export :: Ακύρωση λήψης
Download current description TXT :: Περιγραφή κύριας εκδοχής TXT
Preview only · choose what to keep :: Δοκιμαστικές ακροάσεις
Saved audition :: Επιλεγμένη δοκιμή
Listen to this preview :: Άκου αυτή τη δοκιμή
Export this preview · WAV :: Λήψη αυτής της δοκιμής · WAV
Description :: Εξήγηση
TXT ↓ :: Περιγραφή TXT
Remove selected :: Αφαίρεση δοκιμής
Export from Music Lab :: Δεδομένα και συνεδρία Music Lab
Export from NMR Lab :: Δεδομένα και συνεδρία NMR Lab
Data :: Δεδομένα
Probabilities CSV :: Πιθανότητες και νότες CSV
Diagram :: Διάγραμμα
Diagrams :: Διαγράμματα
Probabilities PNG :: Διάγραμμα πιθανοτήτων PNG
Session :: Συνεδρία και επαναφορά
Export session JSON :: Αποθήκευση εργασίας σε αρχείο
Import session JSON :: Άνοιγμα αρχείου εργασίας
Save in this browser :: Φύλαξη στον browser
Restore browser save :: Άνοιγμα φύλαξης browser
Export studio JSON :: Αποθήκευση εργασίας σε αρχείο
Import studio JSON :: Άνοιγμα αρχείου εργασίας
Save studio locally :: Φύλαξη στον browser
Restore studio :: Άνοιγμα φύλαξης browser
TEMPO :: Ρυθμός
STEP :: Υποδιαίρεση
LEVEL :: Στάθμη
¼ note :: Τέταρτα
⅛ note :: Όγδοα
¹⁄₁₆ note :: Δέκατα έκτα
Psy pulse :: Ρυθμικό παράδειγμα
Bell pair :: Ζεύγος Bell
Phase interference :: Συμβολή φάσης
Ground state :: Θεμελιώδης κατάσταση
How do probabilities change? :: Πώς αλλάζουν οι πιθανότητες;
When can I hear relative phase? :: Πότε ακούγεται η σχετική φάση;
What changes with Bell correlations? :: Τι αλλάζει με τις συσχετίσεις Bell;
What changes only with tuning? :: Τι αλλάζει μόνο από το κούρδισμα;
How does decay sound? :: Πώς ακούγεται η απόσβεση;
What does spin echo restore? :: Τι επαναφέρει το spin echo;
Example library · preparation, circuits & instruments :: Βιβλιοθήκη παραδειγμάτων
Example :: Παράδειγμα
Independent qubits :: Ανεξάρτητα qubits
Bell · preparation CNOT :: Bell · προετοιμασία με CNOT
Phase · X readout :: Φάση · μέτρηση στη βάση X
Empty |00⟩ :: Αρχική κατάσταση |00⟩
X on q0 :: X στο q0
H on q0 :: H στο q0
Bell · Just tuning :: Bell · φυσικό κούρδισμα
Clean sine instrument :: Ημιτονοειδές όργανο χωρίς FX
Load selected example :: Φόρτωση παραδείγματος
Return before preset :: Επιστροφή πριν το παράδειγμα
State preparation :: Προετοιμασία κατάστασης
Qubit 0 :: Qubit 0
Qubit 1 :: Qubit 1
Polar angle :: Πολική γωνία
Relative phase :: Σχετική φάση
Complete preparation → operations → readout :: Προετοιμασία → πύλες → μέτρηση
Listen to the outcomes :: Πιθανότητες αποτελεσμάτων
Measured melody :: Μελωδία από μετρήσεις
One sampled outcome → one note :: Ένα αποτέλεσμα → μία νότα
Probability chord :: Συγχορδία πιθανοτήτων
Four probabilities → voice levels :: Οι πιθανότητες καθορίζουν τις στάθμες
Sample one shot ↗ :: Δείγμα μίας μέτρησης
Sample one shot :: Δείγμα μίας μέτρησης
New take ↻ :: Νέα παραλλαγή
New take :: Νέα παραλλαγή
Advanced · gate editor & inspection :: Επεξεργασία πρόσθετων πυλών
Build a state. Hear its consequences. :: Πρόσθετες πύλες κυκλώματος
Gate :: Πύλη
Wire / CNOT control :: Qubit / έλεγχος CNOT
q0 · left bit :: q0 · αριστερό bit
q1 · right bit :: q1 · δεξί bit
Angle (degrees) :: Γωνία σε μοίρες
Add gate :: Προσθήκη πύλης
Undo edit :: Αναίρεση
Clear added gates :: Αφαίρεση πρόσθετων πυλών
New |00⟩ circuit :: Νέα προετοιμασία |00⟩
Advanced · tuning & note mapping :: Κούρδισμα και νότες αποτελεσμάτων
Map a musical space :: Αντιστοίχιση αποτελεσμάτων σε νότες
Root / reference :: Βασική νότα / αναφορά
Tuning :: Κούρδισμα
12-TET · equal temperament :: 12-TET · συγκερασμένο
Just intonation · 5-limit :: Φυσικό κούρδισμα · λόγοι 5-limit
Just intonation · selected 5-limit ratios :: Φυσικό κούρδισμα · επιλεγμένοι λόγοι
Custom · cents from root :: Προσωπικό · cents από τη βάση
Note bank · A4 = 435 Hz (12-TET) :: Νότες αναφοράς · A4 = 435 Hz
Custom frequency :: Προσωπική συχνότητα
Edit the four outcome notes :: Αλλαγή των τεσσάρων νοτών
Major + octave :: Μείζονα και οκτάβα
Minor + octave :: Ελάσσονα και οκτάβα
Listen A / B ⇄ :: Σύγκριση κουρδισμάτων A/B
Listen A / B :: Σύγκριση κουρδισμάτων A/B
Comparison details :: Τι συγκρίνουμε;
From clean to psychedelic. :: Επεξεργασία του ήχου
Clean sine preset :: Ημιτονοειδές όργανο χωρίς FX
Bypass all FX :: Παράκαμψη όλων των FX
Listen Clean / Processed :: Σύγκριση χωρίς / με FX
Drive / distortion :: Drive / παραμόρφωση
Enabled :: Ενεργό
Advanced · effect parameters :: Περισσότερες ρυθμίσεις εφέ
Drive :: Ένταση παραμόρφωσης
Earlier :: Νωρίτερα στην αλυσίδα
Later :: Αργότερα στην αλυσίδα
Wet / dry :: Ποσότητα εφέ
Delay / echo :: Delay / επαναλήψεις
Delay in beats :: Απόσταση σε παλμούς
Feedback :: Ανατροφοδότηση
Reverb :: Reverb / αντήχηση
Room tail (s) :: Χρόνος αντήχησης σε s
Sound design · oscillator, filter & note length :: Όργανο φίλτρο και μήκος νότας
Shape the sound :: Όργανο και φίλτρο
Oscillator :: Κυματομορφή
Sine · pure :: Ημίτονο · απλός τόνος
Triangle · soft harmonics :: Τρίγωνο · ήπιες αρμονικές
Saw · rich harmonics :: Πριονωτή · πλούσιες αρμονικές
Low-pass filter :: Χαμηλοπερατό φίλτρο
Note length :: Μήκος νότας
16 possibilities, on repeat. :: Μελωδία 16 βημάτων
Advanced · equations & methods :: Εξισώσεις παραδοχές και πηγές
What is quantum here? :: Τι προσομοιώνεται κβαντικά;
State preparation & measurement :: Προετοιμασία και μέτρηση
Entanglement, phase & what you can hear :: Εμπλοκή φάση και ακουστικό αποτέλεσμα
Sonification, tuning & comparison :: Ηχοποίηση κούρδισμα και σύγκριση
Privacy, reproducibility & sources :: Ιδιωτικότητα αναπαραγωγιμότητα και πηγές
TEMPO MODE :: Τρόπος ρυθμού
Model-linked BPM :: Ρυθμός από το μοντέλο
Fixed BPM :: Σταθερός ρυθμός
MUSICAL TEMPO :: Μουσικός ρυθμός
Audible pulse :: Μουσικός παλμός
AUDIO DURATION :: Διάρκεια ήχου
Rhythm mapping & comparison :: Αντιστοίχιση χρόνων σε ρυθμό
Time source :: Πηγή χρόνου
T₂ · homogeneous coherence :: T₂ · εγκάρσια χαλάρωση
T₂* · FID 1/e time :: T₂* · ενεργός χρόνος απόσβεσης
Source qubit :: Qubit αναφοράς
Reference Tref (ms) :: Σταθερή αναφορά Tref σε ms
Fixed comparison (BPM) :: Σταθερός ρυθμός σύγκρισης σε BPM
Pulse depth :: Βάθος μουσικού παλμού
Listen A/B · Fixed / model :: Σύγκριση σταθερού / παράγωγου ρυθμού
▶ Without pulse :: Ακρόαση χωρίς μουσικό παλμό
Fit duration to beats · pulse off / Fixed only :: Διάρκεια σε παλμούς · μόνο σταθερός ρυθμός χωρίς παλμό
Length :: Μήκος
Export FID + Unity JSON :: Σήμα FID και αντιστοίχιση Unity JSON
Export quadratures CSV :: Μιγαδικό σήμα FID σε CSV
Download 36-note table CSV :: Πίνακας 36 νοτών CSV
Image format :: Μορφή εικόνας
↓ Download FID diagram :: Λήψη διαγράμματος FID
More diagram formats :: Περισσότερες μορφές διαγραμμάτων
Advanced · physical model & molecule :: Φυσικό μοντέλο και ενδεικτικό μόριο
Choose your model & molecule :: Φυσικό μοντέλο και μόριο
Physical model :: Φυσικό μοντέλο
NMR ensemble · illustrative pseudo-pure state :: Ensemble NMR · ενδεικτική ψευδοκαθαρή κατάσταση
Abstract qubits · relaxation toward |0⟩ :: Αφηρημένα qubits · χαλάρωση προς |0⟩
Observed FID channels :: Παρατηρούμενα spins
Both spins · stereo :: Και τα δύο spins
q0 only · left :: Μόνο q0
q1 only · right :: Μόνο q1
Molecule presets · illustrative values :: Μοριακά παραδείγματα με ενδεικτικές τιμές
Prepare & relax each qubit :: Προετοιμασία και χαλάρωση
Advanced · physical numerical readout :: Φυσικές αριθμητικές τιμές
Advanced · initial state, T₁ & offsets :: Αρχική κατάσταση T₁ και αποκλίσεις
Initial polar angle θ :: Αρχική πολική γωνία θ
Initial relative phase φ :: Αρχική σχετική φάση φ
Initial Bloch radius r :: Αρχική ακτίνα Bloch r
T₁ · population relaxation (ms) :: Χαλάρωση πληθυσμών T₁ σε ms
Rotating-frame offset ν (Hz) :: Απόκλιση περιστρεφόμενου πλαισίου ν σε Hz
T₂ · homogeneous coherence (ms) :: Εγκάρσια χαλάρωση T₂ σε ms
T₂* · FID 1/e time (ms) :: Ενεργός χρόνος απόσβεσης T₂* σε ms
Inspect acquisition time :: Χρόνος αριθμητικής παρατήρησης
Acquire the FID :: Συνθετικό σήμα FID
Advanced · acquisition window, readout, J & echo :: Παράθυρο μέτρησης readout J και echo
Readout rotation Ry(+90°) :: Περιστροφή ανάγνωσης Ry(+90°)
None · detect existing x/y coherence :: Χωρίς περιστροφή · υπάρχουσα x/y συνοχή
q0 · convert its Z to X :: q0 · μετατροπή Z σε X
q1 · convert its Z to X :: q1 · μετατροπή Z σε X
Both · convert Z to X :: Και τα δύο · μετατροπή Z σε X
Physical acquisition window (ms) :: Φυσικό παράθυρο απόκτησης σε ms
Weak scalar coupling J (Hz) :: Ασθενής βαθμωτή σύζευξη J σε Hz
Echo delay τ (ms), π pulse at τ :: Χρόνος παλμού echo τ σε ms
Ideal Hahn refocusing · Xπ on both spins at τ :: Ιδανικό echo Hahn · Xπ και στα δύο spins στο τ
FID waveform · Re M₊ :: Κυματομορφή FID · Re M₊
Build the quantum circuit :: Κβαντικό κύκλωμα
+ Time slot :: Προσθήκη χρονικής θέσης
Clear circuit :: Αφαίρεση πράξεων κυκλώματος
Import an effective density matrix · experimental / reference :: Εισαγωγή effective μήτρας πυκνότητας
Import an effective density matrix :: Εισαγωγή effective μήτρας πυκνότητας
Inspect matrix CSV / JSON :: Έλεγχος μήτρας CSV / JSON
Inspect Parras matrix :: Έλεγχος μήτρας Παρρά
Inspect ideal Bell reference :: Έλεγχος ιδανικής αναφοράς Bell
Return to Bloch preparation :: Επιστροφή στην προετοιμασία Bloch
Use original valid matrix :: Χρήση αρχικής έγκυρης μήτρας
Clip negative eigenvalues & use :: Ρητή αποκοπή αρνητικών ιδιοτιμών και χρήση
Explore T₂, T₂* & ideal spin echo :: Απόσβεση και ιδανικό spin echo
T₂ vs T₂* & spin echo :: T₂ T₂* και spin echo
Normalized single-spin envelopes :: Κανονικοποιημένες περιβάλλουσες ενός spin
Study decay · fixed BPM / no pulse :: Μελέτη απόσβεσης χωρίς μουσικό παλμό
Listen A/B · T₂ then T₂* :: Σύγκριση T₂ / T₂*
Listen A/B · FID then echo :: Σύγκριση ελεύθερου FID / echo
Explore the Fourier spectrum :: Φάσμα Fourier
Fourier spectrum :: Φάσμα Fourier
Complex FID spectrum · magnitude :: Μέτρο φάσματος μιγαδικού FID
Advanced · pitch mapping & listening route :: Νότες κούρδισμα και δρομολόγηση
Translate physics into music :: Μουσική αντιστοίχιση NMR
Sonification object :: Τρόπος ηχοποίησης
FID carriers · complex magnetization → audio :: FID · μιγαδική μαγνήτιση σε ήχο
Transition chord · four coherence voices :: Συγχορδία τεσσάρων συνοχών
Population tones · |0⟩ base / |1⟩ octave :: Πληθυσμοί · |0⟩ βάση / |1⟩ οκτάβα
Excitation decay · p(1) controls upper-note gain :: Διέγερση · στάθμη από p(1)
Root / carrier reference (Hz) :: Βάση μουσικών φορέων σε Hz
Musical tuning :: Μουσικό κούρδισμα
Creative texture · unrelated to a calibrated noise bath :: Δημιουργική υφή ήχου
Listening route :: Δρομολόγηση ακρόασης
Split · q0 left / q1 right :: Χωριστά · q0 αριστερά / q1 δεξιά
Centered mix · both speakers :: Κεντραρισμένη μίξη · και στα δύο ηχεία
♪ Test selected root · 1 s :: Έλεγχος βασικής νότας · 1 s
♪ Test A4 · 435 Hz :: Έλεγχος A4 · 435 Hz
All 36 reference notes · C3 to B5 :: Και οι 36 νότες αναφοράς C3 έως B5
▶ Dry :: Ακρόαση χωρίς υφή
▶ With texture :: Ακρόαση με υφή
Listen A/B · dry / texture :: Σύγκριση χωρίς / με υφή
Listen A/B · 12-TET / selected tuning :: Σύγκριση κουρδισμάτων A/B
Methods, assumptions & session tools :: Μέθοδοι παραδοχές και εργαλεία συνεδρίας
NMR measurement, annotated with sound :: Ανάγνωση NMR και αντιστοίχιση ήχου
What is measured, and what is simulated? :: Τι μετριέται και τι προσομοιώνεται;
Exact decay model & assumptions :: Μοντέλο απόσβεσης και παραδοχές
Sound and music theory :: Ήχος και μουσική θεωρία
Offline use, formats & data import :: Τοπική χρήση αρχεία και εισαγωγές
Primary references :: Πρωτογενείς αναφορές
Import T₁/T₂ calibration :: Εισαγωγή βαθμονόμησης T₁/T₂
Reset studio :: Επαναφορά αρχικών ρυθμίσεων
Skip tour :: Παράλειψη οδηγού
Back :: Προηγούμενο
Next :: Επόμενο
Start exploring :: Ξεκίνα
Download explanation TXT :: Λήψη εξήγησης TXT
What changes · Τι αλλάζει :: Τι αλλάζει
Held fixed · Τι παραμένει σταθερό :: Τι παραμένει σταθερό
Observe · Τι να παρατηρήσω :: Τι να παρατηρήσω
Load this example :: Φόρτωση αυτής της αναφοράς
Selected gate :: Επιλεγμένη πύλη
Delete gate :: Αφαίρεση πύλης
Remove gate :: Αφαίρεση πύλης
Apply angle :: Εφαρμογή γωνίας
Rotation angle (degrees) :: Γωνία περιστροφής σε μοίρες
Move earlier :: Μετακίνηση νωρίτερα
Move later :: Μετακίνηση αργότερα
Audition before · clean :: Άκου πριν από την πύλη · χωρίς FX
Audition after · clean :: Άκου μετά την πύλη · χωρίς FX
Outcome :: Αποτέλεσμα
Before :: Πριν
After :: Μετά
Mapped Hz :: Μουσική συχνότητα Hz
No earlier configuration :: Δεν υπάρχει προηγούμενη ρύθμιση
Input :: Είσοδος
Preparation · slider :: Προετοιμασία από slider
Phase · slider :: Φάση από slider
Preparation CNOT :: CNOT προετοιμασίας
Readout :: Βάση ανάγνωσης
Thermal embedding :: Ανάμιξη σε φυσικό ensemble
Acquisition :: Απόκτηση σήματος
Free FID · no echo :: Ελεύθερο FID χωρίς echo
none :: Χωρίς
Export cancelled. :: Η λήψη ακυρώθηκε.
Ready to explore :: Έτοιμο για ακρόαση
Ready · synthetic NMR :: Έτοιμη συνθετική προσομοίωση NMR
Stopped. :: Ο ήχος σταμάτησε.
Playing :: Αναπαραγωγή
Paused :: Σε παύση
Preview complete · export the selected frozen version. :: Η δοκιμή ολοκληρώθηκε. Μπορείς να κατεβάσεις αυτή την εκδοχή.
Preview only · choose a frozen version to audition or export. :: Διάλεξε τη δοκιμή που θέλεις να ακούσεις ή να κατεβάσεις.
Preparing frozen preview… :: Προετοιμασία δοκιμαστικής ακρόασης…
Rendering selected preview… :: Παραγωγή αρχείου της επιλεγμένης δοκιμής…
Fix highlighted settings before audition/export. :: Διόρθωσε τα επισημασμένα πεδία πριν από ακρόαση ή λήψη.
Fix highlighted settings before export. :: Διόρθωσε τα επισημασμένα πεδία πριν από τη λήψη.
Select a placed gate to edit or delete it. :: Επίλεξε τοποθετημένη πύλη για αλλαγή ή αφαίρεση.
Select a placed gate to see its transformation and audition a clean before/after take. Gate effects depend on the input and readout. :: Επίλεξε πύλη για να δεις τις πιθανότητες πριν και μετά και να ακούσεις τη διαφορά χωρίς FX. Το αποτέλεσμα εξαρτάται από την είσοδο και τη μέτρηση.
Controlled by a preparation slider or switch :: Ελέγχεται από slider ή διακόπτη προετοιμασίας
Current readout probabilities are unchanged. This gate is inaudible in this probability-based mapping at this step; a later gate or another basis may reveal it. :: Οι πιθανότητες στην επιλεγμένη βάση παραμένουν ίδιες. Σε αυτό το βήμα η πύλη δεν ακούγεται με αυτή την αντιστοίχιση· επόμενη πύλη ή άλλη βάση μπορεί να αποκαλύψει τη διαφορά.
The selected readout changes the outcome probabilities. Distinct mapped notes make that redistribution audible; repeated notes can hide it. :: Οι πιθανότητες μεταβάλλονται. Διαφορετικές νότες ανά αποτέλεσμα βοηθούν να ακουστεί η αλλαγή· ίδιες νότες μπορεί να την κρύψουν.
Phase can change while Z probabilities stay identical. Try basis X for q0. :: Η φάση αλλάζει ενώ οι πιθανότητες στη Z παραμένουν ίδιες. Δοκίμασε βάση X στο q0.
X/Y readout can reveal phase through changed probabilities; distinct mapped notes are needed to hear it. :: Η μέτρηση X/Y μπορεί να αποκαλύψει τη φάση μέσω των πιθανοτήτων. Χρειάζονται διακριτές νότες για να ακουστεί.
Additional gates/coupling are active. Load the reference to isolate local phase. :: Υπάρχουν πρόσθετες πύλες ή σύζευξη. Φόρτωσε την αναφορά για να απομονώσεις την τοπική φάση.
Change one parameter, compare, then export the chosen version. :: Άλλαξε μία παράμετρο σύγκρινε και κατέβασε την επιλεγμένη εκδοχή.
Adds nonlinear harmonic content. :: Προσθέτει αρμονικές με μη γραμμική παραμόρφωση.
Repeats generated audio. 1 beat = 60/BPM seconds. :: Επαναλαμβάνει τον ήχο. Ένας παλμός διαρκεί 60/BPM δευτερόλεπτα.
Deterministic synthetic stereo impulse response. :: Συνθετική στερεοφωνική αντήχηση με επαναλήψιμη απόκριση.
Privacy, sources and licenses :: Ιδιωτικότητα πηγές και άδειες
Copyright and third-party licenses :: Πνευματικά δικαιώματα και άδειες τρίτων
`;
export const translations=new Map(pairs.trim().split('\n').map(s=>s.split(' :: ')));
for(const pair of localePairs)translations.set(...pair);
for(const pair of [
 ['Language','Γλώσσα'],['English','Αγγλικά'],['Greek','Ελληνικά'],
 ['Change one parameter','Άλλαξε μία παράμετρο'],['Keep your sound','Κράτησε τον ήχο σου'],['Keep a version','Κράτησε μια εκδοχή'],['Change coherence time','Άλλαξε τον χρόνο συνοχής'],['Listen to the simulated FID','Άκουσε το προσομοιωμένο FID'],
 ['Move θ0 and compare probabilities and note occurrence rates. Phase may require X/Y readout.','Άλλαξε τη θ0 και σύγκρινε πιθανότητες και συχνότητες εμφάνισης νοτών. Για τη φάση μπορεί να χρειάζεται μέτρηση X/Y.'],
 ['WAV/MP3 exports the current circuit. Audio options selects loops, Clean/Processed and tail. Saved auditions have their own Export this preview.','Τα WAV/MP3 εξάγουν το τρέχον κύκλωμα. Στις Ρυθμίσεις λήψης επιλέγεις επαναλήψεις, ήχο με ή χωρίς εφέ και ουρά. Οι παγωμένες ακροάσεις εξάγονται και χωριστά.'],
 ['Press Play FID. Changing a physical parameter creates a new simulation; Apply & audition listens to it.','Πάτησε Ακρόαση. Η αλλαγή φυσικής παραμέτρου δημιουργεί νέα προσομοίωση· το κουμπί ακρόασης παίζει το νέο αποτέλεσμα.'],
 ['Change T₂* and listen again. Explore decay freezes rhythm for controlled comparison. Creative Model-linked BPM remains at 120–180.','Άλλαξε το T₂* και άκουσε ξανά. Η μελέτη απόσβεσης κρατά σταθερό ρυθμό για ελεγχόμενη σύγκριση. Η δημιουργική σύνδεση χρόνου με ρυθμό παραμένει στα 120–180 BPM.'],
 ['WAV/MP3 uses current NMR settings. Frozen Preview only versions can be exported separately with a companion explanation TXT.','Τα WAV/MP3 χρησιμοποιούν τις τρέχουσες ρυθμίσεις NMR. Οι παγωμένες δοκιμές εξάγονται χωριστά με προαιρετικό επεξηγηματικό TXT.'],
 ['2 · Change one parameter','2 · Αλλαγή μίας παραμέτρου'],['3 · Export','3 · Εξαγωγή'],
 ['What changes','Τι αλλάζει'],['Held fixed','Τι παραμένει σταθερό'],['Observe','Τι να παρατηρήσω'],
 ['Explanation & files','Εξήγηση και αρχεία'],['Equations & sources','Εξισώσεις και πηγές'],['Close equations and sources','Κλείσιμο εξισώσεων και πηγών'],
 ['State from a density matrix','Κατάσταση από μήτρα πυκνότητας'],['Inspect reference matrix','Έλεγχος μήτρας αναφοράς'],
 ['Reference matrix (published example); experiment ID and nucleus order unavailable','Μήτρα αναφοράς δημοσιευμένου παραδείγματος· άγνωστη ταυτότητα πειράματος και σειρά πυρήνων'],
 ['Sound to download','Ήχος προς λήψη'],['With effects','Με εφέ'],['Without effects — same instrument','Χωρίς εφέ — ίδιο όργανο'],['Both versions — two separate files','Και οι δύο εκδοχές — δύο χωριστά αρχεία'],
 ['Keep reverb and delay tails (up to 12 s)','Διατήρηση αντήχησης και επαναλήψεων (έως 12 s)'],['Short ending (0.30 s)','Σύντομο τελείωμα (0,30 s)'],
 ['With effects uses your enabled FX. Without effects keeps the instrument and bypasses FX. Both downloads the two versions separately.','Με εφέ: χρησιμοποιεί τα ενεργά εφέ. Χωρίς εφέ: διατηρεί το όργανο και παρακάμπτει τα εφέ. Και οι δύο: λαμβάνει χωριστά τις δύο εκδοχές.'],
 ['Keeping tails lets reverb and delay fade after the notes. Short ending limits the release to 0.30 seconds. The total duration is shown below.','Η διατήρηση ουράς αφήνει αντήχηση και επαναλήψεις να σβήσουν μετά τις νότες. Το σύντομο τελείωμα περιορίζει την αποδέσμευση σε 0,30 s. Η συνολική διάρκεια εμφανίζεται παρακάτω.'],
 ['Save in this browser','Αποθήκευση στον browser'],['Save locally','Αποθήκευση στον browser'],['Save studio locally','Αποθήκευση στον browser'],['Restore browser save','Επαναφορά αποθήκευσης browser'],['Restore studio','Επαναφορά αποθήκευσης browser'],['State from a density matrix · active','Κατάσταση από μήτρα πυκνότητας · ενεργή'],
 ['This stores the current lab settings in this browser on this device. It does not save an audio file or upload anything. Use Session JSON for a portable backup.','Αποθηκεύει τις τρέχουσες ρυθμίσεις αυτού του εργαστηρίου στον browser αυτής της συσκευής. Δεν αποθηκεύει αρχείο ήχου ούτε στέλνει δεδομένα. Για μεταφερόμενο αντίγραφο χρησιμοποίησε JSON συνεδρίας.']
])translations.set(...pair);
// Earlier pages contained bilingual headings. Normalize them before either locale.
const canonical=new Map([['What changes · Τι αλλάζει','What changes'],['Held fixed · Τι παραμένει σταθερό','Held fixed'],['Observe · Τι να παρατηρήσω','Observe']]);
let reverse=new Map(),reverseSize=-1;
export function getLanguage(){return language;}
export function t(text){let s=String(text),key=s.trim().replace(/\s+/g,' ');key=canonical.get(key)||key;
 if(reverseSize!==translations.size){reverse=new Map([...translations].map(([en,el])=>[el,en]));reverseSize=translations.size;}
 if(language==='en'){return canonical.get(s.trim())||reverse.get(key)||s;}
 for(const label of ['What changes','Held fixed','Observe'])if(key.startsWith(label+': '))return t(label)+': '+t(key.slice(label.length+2));
 if(/^Circuit editor · (\d+) active gates?$/.test(key))return key.replace(/^Circuit editor · (\d+) active gates?$/,'Επεξεργασία κυκλώματος · $1 ενεργές πύλες');
 if(key.startsWith('Physical joint populations before readout'))return key.replace('Physical joint populations before readout','Φυσικοί κοινοί πληθυσμοί πριν την ανάγνωση');
 const exact=translations.get(key);if(exact)return exact.replace(/NMR Lab/g,'Εργαστήριο NMR').replace(/Music Lab/g,'Μουσικό εργαστήριο').replace(/sliders?/g,'ρυθμιστικά').replace(/(^|\s)effective(?=\s|$)/g,'$1ισοδύναμη').replace(/Markovian/g,'Μαρκοβιανό').replace(/Ensemble/g,'Σύνολο spins').replace(/ensemble/g,'σύνολο spins').replace(/readout/g,'ανάγνωση').replace(/echo/g,'ηχώ').replace(/\bDry\b/g,'Χωρίς υφή').replace(/φυλάσσει/g,'αποθηκεύει').replace(/Φύλαξη/g,'Αποθήκευση').replace(/φύλαξη/g,'αποθήκευση');
 s=s.replace(/\bParras\b[^;]*(; experiment ID and nucleus order unavailable)?/g,'Μήτρα αναφοράς δημοσιευμένου παραδείγματος').replace(/φυλάσσει/g,'αποθηκεύει').replace(/Φύλαξη/g,'Αποθήκευση').replace(/φύλαξη/g,'αποθήκευση');
 s=s.replace(/FIRST VISIT/g,'ΠΡΩΤΗ ΧΡΗΣΗ').replace(/Current simulated pure-state concurrence:/g,'Δείκτης εμπλοκής προσομοιωμένης καθαρής κατάστασης:').replace(/A note sequence is not an entanglement test\./g,'Η ακολουθία νοτών δεν αποτελεί έλεγχο εμπλοκής.').replace(/Physical joint purity Tr ρ²:/g,'Κοινή φυσική καθαρότητα Tr ρ²:').replace(/before readout/g,'πριν την ανάγνωση').replace(/acquisition end/g,'τέλος απόκτησης').replace(/two-qubit minimum/g,'ελάχιστο δύο qubits').replace(/Physical \(x,y,z\)/g,'Φυσικές συνιστώσες (x,y,z)').replace(/Observed counts in 16 independent preparations:/g,'Καταμετρήσεις σε 16 ανεξάρτητες προετοιμασίες:').replace(/Signal chain:/g,'Αλυσίδα ήχου:').replace(/oscillator \/ low-pass/g,'ταλαντωτής / χαμηλοπερατό φίλτρο').replace(/drive/g,'παραμόρφωση').replace(/delay/g,'επαναλήψεις').replace(/reverb/g,'αντήχηση').replace(/bypassed/g,'εκτός').replace(/level \/ compressor/g,'στάθμη / συμπιεστής').replace(/\bactive\b/g,'ενεργό').replace(/Output peak/g,'Κορυφή εξόδου').replace(/\bidle\b/g,'αναμονή').replace(/added gates/g,'πρόσθετες πύλες').replace(/preparation θ/g,'προετοιμασία θ').replace(/\bTotal\b/g,'Σύνολο').replace(/\bsequence\b/g,'ακολουθία').replace(/\btail\b/g,'ουρά').replace(/\bstereo\b/g,'στερεοφωνία').replace(/complex samples/g,'μιγαδικά δείγματα').replace(/no carrier frequency in this plot\./g,'χωρίς ακουστικό φορέα σε αυτό το γράφημα.').replace(/Frequency-bin spacing/g,'Απόσταση συχνοτικών δειγμάτων').replace(/sampling Nyquist/g,'όριο Nyquist').replace(/\bneighbour\b/g,'με γείτονα').replace(/\bSEED\b/g,'Seed').replace(/Select (.+) gate/g,'Επιλογή πύλης $1').replace(/, slot (\d+)/g,', θέση $1').replace(/, empty, click to place /g,', κενή· πάτησε για ').replace(/Qubit (\d) reduced Bloch vector:/g,'Μειωμένο διάνυσμα Bloch qubit $1:').replace(/; length /g,'· μήκος ').replace(/Exact probabilities:/g,'Ακριβείς πιθανότητες:').replace(/ percent/g,' τοις εκατό').replace(/\bExplain /g,'Εξήγηση: ').replace(/\bClose /g,'Κλείσιμο: ').replace(/\bEcho at /g,'Ηχώ στα ').replace(/\. A\/B holds /g,'. Η A/B κρατά ').replace(/ in both halves\./g,' και στα δύο σκέλη.').replace(/pulse on with identical depth/g,'παλμός ενεργός με ίδιο βάθος').replace(/pulse off with identical depth/g,'παλμός κλειστός με ίδιο βάθος').replace(/Use transverse FID to study T₂ loss\./g,'Χρησιμοποίησε εγκάρσιο FID για την απώλεια T₂.').replace(/\bGaussian\b/g,'κατανομή Gauss').replace(/\bdry\b/g,'χωρίς υφή').replace(/audible pulse ON/g,'ακουστός παλμός ενεργός').replace(/audible pulse OFF/g,'ακουστός παλμός κλειστός').replace(/\breference\b/g,'αναφορά').replace(/\baudio\b/g,'ήχος').replace(/Total audio duration:/g,'Συνολική διάρκεια ήχου:').replace(/Eigenvalues:/g,'Ιδιοτιμές:').replace(/If explicitly selected:/g,'Αν επιλεγεί ρητά:').replace(/squared Bell fidelity/g,'Τετραγωνισμένο fidelity Bell').replace(/Frobenius change/g,'Μεταβολή Frobenius').replace(/Valid effective state \(numerical tolerance 1e-10\)\. Squared fidelity to ideal Phi\+:/g,'Έγκυρη ισοδύναμη κατάσταση (ανοχή 1e-10). Τετραγωνισμένο fidelity ως προς ιδανική Φ+:').replace(/silence/g,'σιωπή');
 return s.replace(/Joint measurement in/g,'Κοινή μέτρηση στη βάση').replace(/Physical joint populations before readout/g,'Φυσικοί κοινοί πληθυσμοί πριν την ανάγνωση').replace(/Advanced · /g,'Περισσότερα · ').replace(/Z basis/g,'Βάση Z').replace(/X basis/g,'Βάση X').replace(/Y basis/g,'Βάση Y').replace(/(\d+) beats/g,'$1 παλμοί').replace(/(\d+) semitones/g,'$1 ημιτόνια').replace(/Octave (\d)/g,'Οκτάβα $1').replace(/Voice (\d) cents/g,'Φωνή $1 σε cents').replace(/Circuit editor · (\d+) active gates?/g,'Επεξεργασία κυκλώματος · $1 πύλες').replace(/Slot (\d+)/g,'Θέση $1').replace(/Step (\d+)/g,'Βήμα $1').replace(/FIRST VISIT/g,'ΠΡΩΤΗ ΧΡΗΣΗ').replace(/Undo: /g,'Αναίρεση: ').replace(/Replaces: /g,'Αντικαθιστά: ').replace(/Other settings stay as selected\./g,'Οι υπόλοιπες ρυθμίσεις διατηρούνται.').replace(/Processed/g,'Με FX').replace(/Clean/g,'Χωρίς FX').replace(/Final circuit/g,'Κύρια εκδοχή').replace(/Preview only/g,'Δοκιμαστική ακρόαση').replace(/Pulse on/g,'Παλμός ενεργός').replace(/Pulse off/g,'Χωρίς παλμό').replace(/\bDry\b/g,'Χωρίς υφή').replace(/NMR Lab/g,'Εργαστήριο NMR').replace(/Music Lab/g,'Μουσικό εργαστήριο');
}
const textRecords=new WeakMap(),attrRecords=new WeakMap();let observer;
export function translate(root=null,force=false){
 if(!window.document?.body)return;root??=document.body;
 const walk=document.createTreeWalker(root,window.NodeFilter.SHOW_TEXT);let node;
 while((node=walk.nextNode())){const el=node.parentElement;if(!el||el.closest('script,style,pre,code,[data-no-translate]'))continue;const value=node.nodeValue;if(!value.trim())continue;const record=textRecords.get(node);if(record&&record.last===value&&!force)continue;const source=record&&record.last===value?record.source:value,target=t(source);textRecords.set(node,{source,last:target});if(value!==target)node.nodeValue=target;}
 for(const el of [root,...root.querySelectorAll('[aria-label],[data-help],[title],[placeholder]')]){if(!el.getAttribute||el.closest('[data-no-translate]'))continue;let records=attrRecords.get(el);if(!records){records={};attrRecords.set(el,records);}for(const key of ['aria-label','data-help','title','placeholder']){const value=el.getAttribute(key);if(!value)continue;const r=records[key];if(r&&r.last===value&&!force)continue;const source=r&&r.last===value?r.source:value,target=t(source);records[key]={source,last:target};if(value!==target)el.setAttribute(key,target);}}
}
export function setLanguage(value){language=value==='en'?'en':'el';try{localStorage.setItem('pundora-ui-language',language);}catch{}if(typeof document==='undefined')return;document.documentElement.lang=language;translate(document.body,true);document.dispatchEvent(new window.CustomEvent('lab:language',{detail:language}));}
export function startLanguage(){document.documentElement.lang=language;translate();observer=new window.MutationObserver(records=>{const roots=new Set();for(const r of records){const el=r.target.nodeType===3?r.target.parentElement:r.target;if(el?.nodeType===1&&!el.closest('script,style,pre,code,[data-no-translate]'))roots.add(el);}for(const root of roots)translate(root);});observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','data-help','title','placeholder']});}
