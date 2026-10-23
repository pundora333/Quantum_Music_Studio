"""Ideal two-qubit music preparation, computed by Qiskit (angles in radians)."""
from __future__ import annotations
import math
import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector, DensityMatrix
from .config import number
from .model import bloch


def music_snapshot(config):
    if not isinstance(config, dict): raise ValueError('Music configuration must be an object.')
    try:
        for key in ('theta0','theta1'): number(config[key],0,math.pi,key)
        for key in ('phi0','phi1'): number(config[key],-2*math.pi,2*math.pi,key)
        if type(config['cnot']) is not bool: raise ValueError('CNOT must be boolean.')
        qc=QuantumCircuit(2)
        for q in (0,1):
            qc.ry(config[f'theta{q}'],1-q);qc.p(config[f'phi{q}'],1-q)
        if config['cnot']: qc.cx(1,0)
        gates=config.get('circuit',[])
        if not isinstance(gates,list) or len(gates)>32: raise ValueError('Music circuits support at most 32 gates.')
        for g in gates:
            if not isinstance(g,dict) or type(g.get('q')) is not int or g['q'] not in (0,1): raise ValueError('Invalid Music gate wire.')
            q=1-g['q'];kind=g.get('type')
            if kind in ('H','X','Y','Z','S','T'): getattr(qc,kind.lower())(q)
            elif kind=='S†': qc.sdg(q)
            elif kind in ('Rx','Ry','Rz','P'):
                number(g.get('angle'),-3600,3600,'rotation angle');getattr(qc,kind.lower())(g['angle']*math.pi/180,q)
            elif kind=='CNOT': qc.cx(q,1-q)
            elif kind=='CZ': qc.cz(q,1-q)
            elif kind=='SWAP': qc.swap(q,1-q)
            else: raise ValueError('Invalid Music gate.')
        state=Statevector.from_instruction(qc)
        basis=QuantumCircuit(2)
        for q in (0,1):
            value=config[f'basis{q}']
            if value not in ('X','Y','Z'): raise ValueError('Unknown measurement basis.')
            if value=='Y': basis.sdg(1-q)
            if value!='Z': basis.h(1-q)
        p=state.evolve(basis).probabilities();p/=p.sum()
        return dict(state=np.stack((state.data.real,state.data.imag),axis=1).tolist(),
                    probabilities=p.tolist(),bloch=[bloch(DensityMatrix(state),q).tolist() for q in (0,1)],
                    concurrence=float(min(1,2*abs(state.data[0]*state.data[3]-state.data[1]*state.data[2]))))
    except (KeyError,TypeError) as error:
        raise ValueError(f'Incomplete music configuration: {error}') from error


def seeded_take(probabilities,seed,length=16):
    """Mulberry32 and inverse CDF, identical to the original browser's shot take."""
    p=np.asarray(probabilities,float)
    if p.shape!=(4,) or np.any(p<0) or not np.isfinite(p).all() or abs(p.sum()-1)>1e-10:
        raise ValueError('Four normalized Born probabilities required.')
    if type(length) is not int or not 1<=length<=1000000: raise ValueError('Invalid take length.')
    number(seed,0,2**32-1,'seed');n=int(seed)&0xffffffff;out=[]
    for _ in range(length):
        n=(n+0x6D2B79F5)&0xffffffff;t=n
        t=((t^(t>>15))*(t|1))&0xffffffff
        t^=(t+(((t^(t>>7))*(t|61))&0xffffffff))&0xffffffff
        u=((t^(t>>14))&0xffffffff)/4294967296
        out.append(min(3,int(np.searchsorted(np.cumsum(p),u,side='right'))))
    return out
