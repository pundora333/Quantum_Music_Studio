"""Streaming sonification. Musical carriers are mappings, not nuclear RF frequencies."""
from __future__ import annotations
import math
import wave
from pathlib import Path
import numpy as np
from .config import mapped_frequencies,validate
from .tempo import tempo_info

SAMPLE_RATE=44100


def audio_config(config):
    c=validate(config);f=mapped_frequencies(c)
    stretch=c['windowMs']/1000/c['duration']
    maximum=max(f)*(2 if c['sound'] in ('population','excitation') else 1)+max(abs(q['nu']) for q in c['qubits'])*stretch+c['j']*stretch/2
    if maximum>=SAMPLE_RATE/2: raise ValueError('Audio Nyquist limit exceeded; increase duration or lower frequencies.')
    return c,f


def render_chunks(data,configuration,chunk_size=8192):
    """Float32 stereo blocks, with seeded creative texture and browser-equivalent gain."""
    c,f=audio_config(configuration)
    if max(abs(v) for v in data.frequencies)>=1/(2*data.dt): raise ValueError('Acquisition Nyquist limit exceeded.')
    frames=math.floor(c['duration']*SAMPLE_RATE+.5)
    if type(chunk_size) is not int or chunk_size<1: raise ValueError('Invalid chunk size.')
    rhythm=tempo_info(c)
    gain=.8*10**(c['level']/20);n=int(c['seed'])&0xffffffff;noise=[0.,0.]
    observed=[q for q in (0,1) if c['observed'] in ('both',f'q{q}')]
    for start in range(0,frames,chunk_size):
        stop=min(frames,start+chunk_size);indices=np.arange(start,stop,dtype=float)
        t=indices/SAMPLE_RATE;index=indices/(frames-1)*(data.samples-1) if frames>1 else indices*0
        k=np.minimum(data.samples-2,np.floor(index).astype(int));fraction=index-k
        def value(array): return array[k]*(1-fraction)+array[k+1]*fraction
        texture=np.zeros((2,stop-start))
        # Noise update order q0,q1 for each frame is part of reproducibility.
        if c['fx']:
            for i in range(stop-start):
                for q in observed:
                    n^=(n<<13)&0xffffffff;n^=n>>17;n^=(n<<5)&0xffffffff;n&=0xffffffff
                    noise[q]=.998*noise[q]+.002*(n/2147483648-1)
                    texture[q,i]=noise[q]
        rhythm_gain=(1-rhythm['depth'])+rhythm['depth']*((1+np.cos(2*np.pi*rhythm['bpm']*t/60))/2)**rhythm['pulsePower'] if rhythm['rhythmEnabled'] else 1
        attack=np.minimum(1,indices/(SAMPLE_RATE*.005));release=np.minimum(1,(frames-1-indices)/(SAMPLE_RATE*.02))
        out=np.zeros((stop-start,2),np.float32)
        for q in observed:
            loss=1-value(data.env[q]);offset=3*c['fx']*loss*(.65*np.sin(2*np.pi*(2.7+q*.8)*t)+3*texture[q])
            if c['sound']=='fid':
                s=value(data.signal[q]);phase=2*np.pi*f[2*q]*t+offset
                sound=s.real*np.cos(phase)-s.imag*np.sin(phase)
            elif c['sound']=='transitions':
                sound=np.zeros(stop-start)
                for j in (2*q,2*q+1):
                    s=value(data.lines[j]);phase=2*np.pi*f[j]*t+offset
                    sound+=s.real*np.cos(phase)-s.imag*np.sin(phase)
            else:
                p=value(data.pop[q]);phase=2*np.pi*2*f[2*q]*t+offset
                sound=p*np.sin(phase)
                if c['sound']=='population': sound+=(1-p)*np.sin(2*np.pi*f[2*q]*t+offset)
            if c['fx']:
                sound=(1-c['fx']*.5)*sound+c['fx']*.5*np.tanh(sound*(1+3*loss))
            out[:,q]=np.clip(sound*gain*attack*release*rhythm_gain,-.99,.99)
        if c['stereo']=='center':
            mono=(out[:,0].astype(float)+out[:,1])/(2 if c['observed']=='both' else 1)
            out[:,0]=out[:,1]=mono
        yield out


def pcm16(samples):
    # Match JavaScript Math.round (ties toward +infinity), not NumPy banker's rounding.
    return np.floor(np.clip(samples.astype(float),-1,1)*32767+.5).astype('<i2')


def export_audio(data,configuration,path):
    path=Path(path);suffix=path.suffix.lower();c,_=audio_config(configuration)
    frames=math.floor(c['duration']*SAMPLE_RATE+.5)
    if suffix not in ('.wav','.mp3'): raise ValueError('Use .wav or .mp3.')
    if suffix=='.wav' and frames*4>0xffffffff-36: raise ValueError('WAV exceeds the 4 GB RIFF limit.')
    path.parent.mkdir(parents=True,exist_ok=True)
    # Atomic replacement prevents a failed export leaving a plausible partial file.
    temporary=path.with_name(path.name+'.part')
    try:
        if suffix=='.wav':
            with wave.open(str(temporary),'wb') as output:
                output.setnchannels(2);output.setsampwidth(2);output.setframerate(SAMPLE_RATE)
                for block in render_chunks(data,c): output.writeframesraw(pcm16(block).tobytes())
        else:
            import lameenc
            encoder=lameenc.Encoder();encoder.set_bit_rate(128);encoder.set_in_sample_rate(SAMPLE_RATE);encoder.set_channels(2);encoder.set_quality(2)
            with temporary.open('wb') as output:
                for block in render_chunks(data,c): output.write(encoder.encode(pcm16(block).tobytes()))
                output.write(encoder.flush())
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)
    return path
