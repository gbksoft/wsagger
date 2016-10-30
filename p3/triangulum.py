#coding=cp1251

# from __future__ import division

import sys, math, cmath

from cura         import *
from basis        import *
from basis.plicae import *

def triangulum_ab_dij (d01, d02, d12):
   try:    
      x1 = -d12 * 0.5
      x2 = -x1
      x0 = 0.5 * ((d01*d01 - x1*x1) - (d02*d02 - x2*x2)) / (x2 - x1)
      return [[x0, math.sqrt(d01*d01 - (x0 - x1)**2)], [x1, 0], [x2, 0]]

   except:
      exceptio ()
      return [0,0], [0,0], [0,0]
   

"""
def directio_ab_t1_t2 (t1, t2):
   return -cmath.acos (1 / math.sqrt(1 + 3*((t1/t2-1)/(t1/t2+1))**2)).real if t1 < t2 else \
          cmath.acos  (1 / math.sqrt(1 + 3*((t2/t1-1)/(t2/t1+1))**2)).real if t1 > t2 else \
          0                                                           
"""
   