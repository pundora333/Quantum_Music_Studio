"""Scientific quadrature data and static figures; no sound normalization of the FID."""
from __future__ import annotations
import json
from pathlib import Path
import numpy as np
from .config import EPSILON, mapped_frequencies
from .model import fft_complex,envelope
from .tempo import tempo_info


def fid_document(data,c):
    f=mapped_frequencies(c)
    return dict(format='pundora-fid-v3',model=c['model'],source=c['source'],
        normalization='signal = physical M / epsilon' if c['model']=='nmr' else 'signal = physical M',
        epsilon=EPSILON if c['model']=='nmr' else 1,physicalWindowMs=c['windowMs'],audioDurationSeconds=c['duration'],
        carrierHz=[f[0],f[2]],levelDb=c['level'],audioGainScale=.8,stereo=c['stereo'],referenceA4Hz=435,observed=c['observed'],audioRhythm=tempo_info(c),
        notes='Raw physical quadratures: no rhythmic envelope. Unity mapping is dry FID carriers. audioRhythm describes browser/Python audio only.',
        timeMs=(data.times*1000).tolist(),q0Re=data.signal[0].real.tolist(),q0Im=data.signal[0].imag.tolist(),
        q1Re=data.signal[1].real.tolist(),q1Im=data.signal[1].imag.tolist(),configuration=c)


def export_data(data,c,directory):
    directory=Path(directory);directory.mkdir(parents=True,exist_ok=True)
    (directory/'session.json').write_text(json.dumps(dict(c,audioRhythm=tempo_info(c)),ensure_ascii=False,indent=2),encoding='utf-8')
    (directory/'fid.json').write_text(json.dumps(fid_document(data,c),ensure_ascii=False,indent=2),encoding='utf-8')
    np.savetxt(directory/'fid.csv',np.column_stack((data.times*1000,data.signal[0].real,data.signal[0].imag,data.signal[1].real,data.signal[1].imag)),
        delimiter=',',header='time_ms,q0_re,q0_im,q1_re,q1_im',comments='',fmt='%.17g')


def save_figure(data,c,path,kind='fid'):
    import matplotlib
    matplotlib.use('Agg')
    from matplotlib import pyplot as plt
    path=Path(path)
    if path.suffix.lower() not in ('.png','.jpg','.jpeg'): raise ValueError('Use .png, .jpg or .jpeg.')
    shown=[q for q in (0,1) if c['observed'] in ('both',f'q{q}')]
    with plt.rc_context({'figure.facecolor':'#14121a','axes.facecolor':'#14121a','axes.edgecolor':'#95819f',
        'axes.labelcolor':'#ddd1e8','xtick.color':'#b7a4c7','ytick.color':'#b7a4c7','text.color':'#ddd1e8','font.size':10}):
        fig,ax=plt.subplots(figsize=(9,3.8),layout='constrained');colors=['#bd91f5','#e57bcc']
        if kind=='fid':
            for q in shown:
                ax.plot(data.times*1000,data.signal[q].real,color=colors[q],label=f'q{q} Re FID')
                ax.plot(data.times*1000,data.signal[q].imag,color=colors[q],ls='--',alpha=.65,label=f'q{q} Im FID')
            ax.set(xlabel='Physical time (ms)',ylabel='M / epsilon' if c['model']=='nmr' else 'Transverse magnetization',title='Synthetic two-spin FID')
        elif kind=='decay':
            for q in shown:
                ax.plot(data.times*1000,data.hom[q],color=colors[q],label=f'q{q} homogeneous T2')
                ax.plot(data.times*1000,data.no_echo[q],color=colors[q],ls='--',label=f'q{q} T2*')
            b=c['qubits'][0];ax.plot(data.times*1000,envelope(data.times,b['t2'],b['star'],True,c['tauMs']/1000),color='#eee4f6',ls=':',label='q0 ideal echo envelope')
            ax.set(xlabel='Physical time (ms)',ylabel='Normalized envelope',title='T2, T2* and Hahn echo (envelope only)')
        elif kind=='spectrum':
            spectrum=fft_complex(data.signal[shown].sum(axis=0),data.dt)
            ax.plot(spectrum['hz'],spectrum['mag'],color=colors[0]);extent=min(1/(2*data.dt),max(100,*map(abs,data.frequencies))*1.8)
            ax.set(xlabel='Rotating-frame offset (Hz)',ylabel='Magnitude (arbitrary units)',title='FFT of complex summed FID',xlim=(-extent,extent))
        else:
            plt.close(fig);raise ValueError('Unknown plot kind.')
        if kind!='spectrum': ax.legend(fontsize=8,labelcolor='#ddd1e8',facecolor='#201b29',edgecolor='#504059')
        ax.grid(alpha=.12);path.parent.mkdir(parents=True,exist_ok=True);fig.savefig(path,dpi=180);plt.close(fig)
    return path
