"""Portable studio schema v5; legacy v2/v3/v4 supported. Angles in degrees, relaxation and delay in ms."""
from __future__ import annotations
from copy import deepcopy
import math
from .tempo import tempo_defaults, normalize_tempo

EPSILON = 1e-5
REFERENCE_A4 = 435.0
DEFAULT_ROOT = REFERENCE_A4 * 2 ** (-9 / 12)
RATIOS = (1, 16/15, 9/8, 6/5, 5/4, 4/3, 45/32, 3/2, 8/5, 5/3, 9/5, 15/8, 2)
MOLECULES = [
    dict(id='chloroform', name='¹³C-labelled chloroform', spins=['¹H','¹³C'], chord=[0,4,7,12], nu=[18,-32], j=210, t1=[800,1000], t2=[160,240], star=[55,80]),
    dict(id='phosphite', name='Dimethyl phosphite', spins=['¹H (P–H)','³¹P'], chord=[0,3,7,12], nu=[-24,42], j=697.4, t1=[5000,5000], t2=[200,200], star=[45,70]),
    dict(id='formate', name='¹³C-labelled sodium formate', spins=['¹H','¹³C'], chord=[0,5,7,10], nu=[28,-16], j=160, t1=[900,1100], t2=[200,300], star=[65,95]),
]
GATES = ('H','X','Y','Z','S','S†','T','Rx','Ry','Rz','P','CNOT','CZ','SWAP','Wait','MZ')
TWO_QUBIT = ('CNOT','CZ','SWAP','Wait')

def number(value, low, high, name):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
        raise ValueError(f'Invalid {name}: expected a finite number in [{low}, {high}].')
    return value

def defaults():
    m = MOLECULES[0]
    return dict(version=5, molecule=m['id'], model='nmr',
        qubits=[dict(theta=0, phi=0, radius=1, t1=m['t1'][q], t2=m['t2'][q], star=m['star'][q], nu=m['nu'][q]) for q in range(2)],
        j=m['j'], windowMs=400, tauMs=100, echo=False, readout='none', observed='both', stereo='split', columns=10,
        circuit=[dict(step=0, q=q, type='Ry', angle=90) for q in range(2)],
        root=DEFAULT_ROOT, tuning='equal', custom=[0,386.3137,701.955,1200], sound='fid',
        duration=8, tempo=tempo_defaults(), level=-6, fx=0, seed=271828, source='Illustrative simulation; not measured hardware data')

def validate(config):
    """Return a detached validated configuration; migrate v2 without retuning it."""
    if not isinstance(config, dict):
        raise ValueError('Configuration must be a JSON object.')
    c = deepcopy(config)
    try:
        if c['version'] not in (2,3,4,5) or c['molecule'] not in [m['id'] for m in MOLECULES] or c['model'] not in ('nmr','qubit'):
            raise ValueError('Unsupported studio session.')
        if c['version'] == 2:
            c['version'] = 3
            c.setdefault('stereo','split')
        c.pop('audioRhythm',None)
        normalize_tempo(c)
        if c.get('densityInput'):
            if c['version'] < 4: raise ValueError('Imported matrices require session version 4 or later.')
            from .density_input import effective_matrix
            effective_matrix(c['densityInput'])
        if c['stereo'] not in ('split','center'): raise ValueError('Invalid listening route.')
        if not isinstance(c['qubits'], list) or len(c['qubits']) != 2: raise ValueError('Two qubits required.')
        for q in c['qubits']:
            for key, lo, hi in [('theta',0,180),('phi',-180,180),('radius',0,1),('t1',.1,100000),('t2',.1,200000),('star',.01,200000),('nu',-10000,10000)]:
                number(q[key],lo,hi,key)
            if q['t2'] > 2*q['t1'] or q['star'] > q['t2']: raise ValueError('Require T2 <= 2 T1 and T2* <= T2.')
        for key,lo,hi in [('j',0,10000),('windowMs',1,10000),('tauMs',0,c['windowMs']/2),('columns',1,64),('root',20,2000),('duration',.01,(2**53-1)/44100),('level',-60,-3),('fx',0,1),('seed',0,2**32-1)]:
            number(c[key],lo,hi,key)
        if int(c['columns']) != c['columns']: raise ValueError('Columns must be an integer.')
        if c['readout'] not in ('none','q0','q1','both') or c['observed'] not in ('q0','q1','both') or type(c['echo']) is not bool:
            raise ValueError('Invalid readout or echo.')
        if not isinstance(c['circuit'], list) or len(c['circuit']) > 128: raise ValueError('Invalid circuit.')
        occupied = set()
        for g in c['circuit']:
            if g['type'] not in GATES or type(g['step']) is not int or not 0 <= g['step'] < c['columns'] or type(g['q']) is not int or g['q'] not in (0,1): raise ValueError('Invalid gate.')
            if g['type'] in ('Rx','Ry','Rz','P'): number(g['angle'],-3600,3600,'angle')
            if g['type'] == 'Wait': number(g['ms'],0,10000,'delay')
            for q in (0,1) if g['type'] in TWO_QUBIT else (g['q'],):
                position = g['step'],q
                if position in occupied: raise ValueError('Overlapping gates.')
                occupied.add(position)
        if c['tuning'] not in ('equal','just','custom') or c['sound'] not in ('fid','transitions','population','excitation'): raise ValueError('Invalid sound mapping.')
        if not isinstance(c['custom'],list) or len(c['custom']) != 4: raise ValueError('Four intervals required.')
        for v in c['custom']: number(v,-2400,3600,'cents')
        if not isinstance(c['source'],str) or len(c['source']) > 500: raise ValueError('Invalid source label.')
    except (KeyError, TypeError) as error:
        raise ValueError(f'Incomplete studio configuration: {error}') from error
    return c

def mapped_frequencies(c):
    m = next(m for m in MOLECULES if m['id'] == c['molecule'])
    return [c['root'] * (2**(degree/12) if c['tuning']=='equal' else 2**(c['custom'][i]/1200) if c['tuning']=='custom' else RATIOS[degree]) for i,degree in enumerate(m['chord'])]

def note_bank():
    names = ('C','C♯/D♭','D','D♯/E♭','E','F','F♯/G♭','G','G♯/A♭','A','A♯/B♭','B')
    return [dict(midi=m, pitchClass=names[m%12], octave=m//12-1, hz=REFERENCE_A4*2**((m-69)/12)) for m in range(48,84)]

def import_calibration(c, item):
    if not isinstance(item,dict) or item.get('unit') not in ('ms','s') or not isinstance(item.get('label'),str) or len(item['label'])>300 or len(item.get('qubits',[]))!=2:
        raise ValueError('Calibration requires unit, label and two qubits.')
    out = deepcopy(c);factor=1000 if item['unit']=='s' else 1
    for q,values in zip(out['qubits'],item['qubits']):
        for target,source in [('t1','t1'),('t2','t2'),('star','t2star')]:
            q[target] = number(values.get(source, values.get('t2') if source=='t2star' else None),.000001,200000,source)*factor
    out['source']='User-provided, unverified calibration: '+item['label']
    return validate(out)
