"""Two-spin NMR model using Qiskit states/gates and exact Lindblad propagation.

Public basis |q0 q1> = |00>,|01>,|10>,|11>. Display q0 -> Qiskit wire 1.
All Hamiltonian frequencies are rotating-frame Hz, not RF Larmor frequencies.
"""
from __future__ import annotations
from functools import lru_cache
from dataclasses import dataclass
import math
import numpy as np
from scipy.linalg import expm
from qiskit import QuantumCircuit
from qiskit.quantum_info import DensityMatrix, Operator, Kraus
from .config import EPSILON, validate

I = np.eye(2,dtype=complex)
X = np.array([[0,1],[1,0]],dtype=complex)
Y = np.array([[0,-1j],[1j,0]],dtype=complex)
Z = np.diag([1,-1]).astype(complex)
ZOPS = [np.kron(Z,I),np.kron(I,Z)]
XOPS = [np.kron(X,I),np.kron(I,X)]
YOPS = [np.kron(Y,I),np.kron(I,Y)]


def gate_circuit(kind, angle=90, q=0):
    """Qiskit unitary circuit whose matrix is already in the studio's order."""
    if q not in (0,1): raise ValueError('Qubit must be 0 or 1.')
    wire=1-q;other=q;qc=QuantumCircuit(2,name=kind)
    methods={'H':'h','X':'x','Y':'y','Z':'z','S':'s','S†':'sdg','T':'t'}
    if kind in methods: getattr(qc,methods[kind])(wire)
    elif kind in ('Rx','Ry','Rz','P'): getattr(qc,kind.lower())(math.radians(angle),wire)
    elif kind=='CNOT': qc.cx(wire,other)
    elif kind=='CZ': qc.cz(wire,other)
    elif kind=='SWAP': qc.swap(0,1)
    else: raise ValueError(f'{kind} is not a unitary gate.')
    return qc


def gate_matrix(kind, angle=90, q=0):
    return Operator(gate_circuit(kind,angle,q)).data


def initial_density(c):
    matrices=[]
    for b in c['qubits']:
        th,ph=math.radians(b['theta']),math.radians(b['phi'])
        x=b['radius']*math.sin(th)*math.cos(ph)
        y=b['radius']*math.sin(th)*math.sin(ph)
        z=b['radius']*math.cos(th)
        matrices.append((I+x*X+y*Y+z*Z)/2)
    if c.get('densityInput'):
        from .density_input import effective_matrix
        effective=effective_matrix(c['densityInput'])
    else:
        effective=np.kron(*matrices)
    return DensityMatrix((1-EPSILON)*np.eye(4)/4+EPSILON*effective if c['model']=='nmr' else effective)


def bloch(rho,q):
    d=rho if isinstance(rho,DensityMatrix) else DensityMatrix(rho)
    return np.real([d.expectation_value(Operator(op)) for op in (XOPS[q],YOPS[q],ZOPS[q])])


def purity(rho):
    a=rho.data if isinstance(rho,DensityMatrix) else np.asarray(rho)
    return float(np.trace(a@a).real)


def dephase(rho,q,factor=0):
    if not 0 <= factor <= 1: raise ValueError('Invalid dephasing factor.')
    channel=Kraus([math.sqrt((1+factor)/2)*I,math.sqrt((1-factor)/2)*Z])
    return rho.evolve(channel,qargs=[1-q])


def _parameters(c):
    return (c['model'],c['j'],*[v for b in c['qubits'] for v in (b['nu'],b['t1'],b['t2'])])


@lru_cache(maxsize=64)
def _generator(parameters):
    """Column-major vec convention. Generator has units s^-1."""
    model,j,nu0,t10,t20,nu1,t11,t21=parameters
    h=math.pi*(nu0*ZOPS[0]+nu1*ZOPS[1]+j/2*(ZOPS[0]@ZOPS[1]))
    ident=np.eye(4,dtype=complex)
    L=-1j*(np.kron(ident,h)-np.kron(h.T,ident))
    zeq=EPSILON if model=='nmr' else 1.0
    lowering=np.array([[0,1],[0,0]],dtype=complex)
    for q,t1,t2 in [(0,t10/1000,t20/1000),(1,t11/1000,t21/1000)]:
        phi=max(0.,1/t2-1/(2*t1))
        local=[math.sqrt((1+zeq)/(2*t1))*lowering,
               math.sqrt((1-zeq)/(2*t1))*lowering.conj().T,
               math.sqrt(phi/2)*Z]
        for a in local:
            op=np.kron(a,I) if q==0 else np.kron(I,a)
            normal=op.conj().T@op
            L+=np.kron(op.conj(),op)-.5*(np.kron(ident,normal)+np.kron(normal.T,ident))
    L.setflags(write=False)
    return L


@lru_cache(maxsize=256)
def _propagator(parameters, seconds):
    out=expm(_generator(parameters)*seconds);out.setflags(write=False);return out


def evolve(rho,seconds,c):
    if not math.isfinite(seconds) or seconds < -1e-13: raise ValueError('Negative or invalid delay.')
    if seconds <= 0: return DensityMatrix(rho.data.copy())
    # Quantize only roundoff of interval subtraction, at a femtosecond scale.
    vector=_propagator(_parameters(c),round(seconds,15))@rho.data.reshape(16,order='F')
    return DensityMatrix(vector.reshape((4,4),order='F'))


def circuit_density(c):
    rho=initial_density(c)
    for g in sorted(c['circuit'],key=lambda g:(g['step'],g['q'])):
        if g['type']=='Wait': rho=evolve(rho,g['ms']/1000,c)
        elif g['type']=='MZ': rho=dephase(rho,g['q'])
        else: rho=rho.evolve(gate_circuit(g['type'],g.get('angle',90),g['q']))
    return rho


def star_sigma(t2ms,starms):
    if not 0 < starms <= t2ms: raise ValueError('Require 0 < T2* <= T2.')
    return math.sqrt(max(0,1-starms/t2ms))/(math.sqrt(2)*math.pi*starms/1000)


def envelope(times,t2ms,starms,echo=False,tau=0):
    t=np.asarray(times);path=np.where(t>tau,2*tau-t,t) if echo else t
    return np.exp(-t/(t2ms/1000)-2*math.pi**2*star_sigma(t2ms,starms)**2*path**2)


def interleaved(values):
    a=np.asarray(values);return np.stack((a.real,a.imag),axis=-1).reshape(-1).tolist()


@dataclass
class Acquisition:
    times: np.ndarray
    lines: np.ndarray
    signal: np.ndarray
    pop: np.ndarray
    z: np.ndarray
    env: np.ndarray
    hom: np.ndarray
    no_echo: np.ndarray
    initial: DensityMatrix
    before_readout: DensityMatrix
    final: DensityMatrix
    frequencies: list[float]
    scale: float

    @property
    def samples(self): return len(self.times)
    @property
    def window(self): return float(self.times[-1])
    @property
    def dt(self): return float(self.times[1]-self.times[0])
    def browser_data(self):
        """Exact field/array layout expected by the existing Web Audio interface."""
        return dict(samples=self.samples,window=self.window,dt=self.dt,scale=self.scale,
            lines=[interleaved(a) for a in self.lines],signal=[interleaved(a) for a in self.signal],
            pop=self.pop.tolist(),z=self.z.tolist(),env=self.env.tolist(),hom=self.hom.tolist(),noEcho=self.no_echo.tolist(),
            initial=interleaved(self.initial.data),beforeReadout=interleaved(self.before_readout.data),final=interleaved(self.final.data),frequencies=self.frequencies)


def acquire(configuration, samples=None, force_echo=None):
    c=validate(configuration)
    if samples is None:
        samples=2048;highest=max(1,*[abs(b['nu'])+c['j']/2 for b in c['qubits']])
        while samples < 8*highest*c['windowMs']/1000 and samples < 65536: samples*=2
    if type(samples) is not int or not 2 <= samples <= 65536: raise ValueError('Samples must be an integer from 2 to 65536.')
    if force_echo is not None and type(force_echo) is not bool: raise ValueError('Echo override must be boolean.')
    echo=c['echo'] if force_echo is None else force_echo
    rho=circuit_density(c);before=DensityMatrix(rho.data.copy())
    for q in range(2):
        if c['readout'] in ('both',f'q{q}'): rho=rho.evolve(gate_circuit('Ry',90,q))
    initial=DensityMatrix(rho.data.copy())
    times=np.linspace(0,c['windowMs']/1000,samples);tau=c['tauMs']/1000
    scale=1/EPSILON if c['model']=='nmr' else 1.0
    lines=np.zeros((4,samples),complex);pop=np.zeros((2,samples));z=np.zeros_like(pop)
    env=np.array([envelope(times,b['t2'],b['star'],echo,tau) for b in c['qubits']])
    hom=np.array([np.exp(-times/(b['t2']/1000)) for b in c['qubits']])
    no_echo=np.array([envelope(times,b['t2'],b['star']) for b in c['qubits']])
    paths=np.where(times>tau,2*tau-times,times) if echo else times
    static=np.array([np.exp(-2*math.pi**2*star_sigma(b['t2'],b['star'])**2*paths**2) for b in c['qubits']])
    pairs=((2,0),(3,1),(1,0),(3,2));previous=0.;pulsed=False
    flip=Operator(gate_circuit('X',q=0).compose(gate_circuit('X',q=1)))
    for n,t in enumerate(times):
        if echo and not pulsed and t>=tau:
            rho=evolve(rho,max(0,tau-previous),c).evolve(flip);previous=tau;pulsed=True
        rho=evolve(rho,max(0,float(t)-previous),c);previous=float(t)
        for q in (0,1):
            z[q,n]=float(np.trace(rho.data@ZOPS[q]).real);pop[q,n]=(1-z[q,n])/2
            for l in (2*q,2*q+1):
                i,j=pairs[l];lines[l,n]=2*rho.data[i,j]*static[q,n]*scale
    signal=np.array([lines[0]+lines[1],lines[2]+lines[3]])
    final=rho
    for q in (0,1): final=dephase(final,q,float(static[q,-1]))
    freqs=[c['qubits'][q]['nu']+sign*c['j']/2 for q in (0,1) for sign in (1,-1)]
    return Acquisition(times,lines,signal,pop,z,env,hom,no_echo,initial,before,final,freqs,scale)


def fft_complex(values,dt):
    a=np.asarray(values,complex);n=a.size
    if n<2 or n&(n-1): raise ValueError('FFT length must be a power of two.')
    if not math.isfinite(dt) or dt<=0: raise ValueError('Invalid sample interval.')
    result=np.fft.fftshift(np.fft.fft(a))/n
    frequency=np.fft.fftshift(np.fft.fftfreq(n,dt))
    return dict(hz=frequency,re=result.real,im=result.imag,mag=np.abs(result))
