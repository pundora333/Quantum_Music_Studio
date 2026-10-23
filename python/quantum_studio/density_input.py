"""Validate effective 4x4 imports; preserve raw input and explicit treatment.

The browser uses a Jacobi eigensolver; this backend independently uses LAPACK
through NumPy. Eigenvalue clipping is a sensitivity transformation, not MLE.
"""
import math
import numpy as np

def effective_matrix(item):
    if (not isinstance(item,dict) or item.get('kind') != 'effective'
        or item.get('basis') != ['00','01','10','11']
        or not isinstance(item.get('label'),str) or not item['label'].strip()
        or len(item['label'])>300 or item.get('treatment') not in ('none','clip')):
        raise ValueError('Effective matrix requires ordered basis, source label and explicit treatment.')
    raw=item.get('raw')
    if (not isinstance(raw,list) or len(raw)!=32
        or any(isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) for x in raw)):
        raise ValueError('Expected 32 finite real/imaginary numbers.')
    a=np.asarray(raw).reshape(4,4,2);rho=a[:,:,0]+1j*a[:,:,1]
    if np.max(np.maximum(abs(rho.real-rho.real.T),abs(rho.imag+rho.imag.T)))>1e-10:
        raise ValueError('Matrix must be Hermitian.')
    if abs(np.trace(rho).real-1)>1e-10: raise ValueError('Matrix must have trace 1. No automatic normalization.')
    values,vectors=np.linalg.eigh((rho+rho.conj().T)/2)
    if item['treatment']=='none':
        if values[0]<-1e-10: raise ValueError('Non-PSD effective matrix requires explicit clipping.')
        return rho
    weights=np.maximum(values,0);weights/=weights.sum()
    return (vectors*weights)@vectors.conj().T
