"""Declared classical rhythm mapping; never modifies acquired FID samples."""
import math

MAPPING='bounded-inverse-v1'

def tempo_defaults():
    return dict(bpm=150,beats=16,sync=False,mode='model',source='t2',qubit=0,referenceMs=160,rhythm=True,depth=.75,mapping=MAPPING)

def normalize_tempo(c):
    if 'tempo' not in c and c['version']==5: raise ValueError('Missing NMR tempo configuration.')
    t=c.setdefault('tempo',dict(bpm=150,beats=16,sync=False))
    if not isinstance(t,dict): raise ValueError('Invalid NMR musical tempo.')
    if c['version']<5:
        for k,v in dict(tempo_defaults(),mode='fixed',rhythm=False).items(): t.setdefault(k,v)
    def finite(x,a,b): return type(x) in (int,float) and math.isfinite(x) and a<=x<=b
    if not (finite(t.get('bpm'),120 if c['version']==5 else 60,180 if c['version']==5 else 300) and type(t.get('sync')) is bool and type(t.get('beats')) is int and t['beats'] in (4,8,16,32,64) and t.get('mode') in ('fixed','model') and t.get('source') in ('t2','star') and type(t.get('qubit')) is int and t['qubit'] in (0,1) and finite(t.get('referenceMs'),.01,200000) and type(t.get('rhythm')) is bool and finite(t.get('depth'),0,1) and t.get('mapping')==MAPPING): raise ValueError('Invalid NMR musical tempo.')
    if c['version']<5 and (t['mode']!='fixed' or t['rhythm']): raise ValueError('Rhythmic sonification requires NMR session version 5.')
    if (t['mode']=='model' or t['rhythm']) and t['sync']: raise ValueError('Keep audio seconds independent of BPM for rhythmic comparisons.')
    return t

def tempo_info(c):
    t=c.get('tempo',dict(bpm=150));q=t.get('qubit',0);source=t.get('source','t2');reference=t.get('referenceMs',160);time=c['qubits'][q][source]
    bpm=120+60/(1+time/reference) if t.get('mode')=='model' else t['bpm']
    return dict(mapping=MAPPING,mode=t.get('mode','fixed'),bpm=bpm,fixedBpm=t['bpm'],rangeBpm=[120,180],source=source,qubit=q,timeMs=time,referenceMs=reference,rhythmEnabled=t.get('rhythm',False),depth=t.get('depth',.75),pulsePower=4,formula='120 + 60 / (1 + T / Tref)',envelope='(1-depth) + depth * ((1+cos(2*pi*BPM*t_audio/60))/2)^4',physicalWindowMs=c['windowMs'],audioDurationSeconds=c['duration'],physicalSecondsPerAudioSecond=c['windowMs']/1000/c['duration'])
