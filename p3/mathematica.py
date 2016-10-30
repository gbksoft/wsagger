# from __future__ import division

import sys, math, cmath

from cura         import *
from basis        import *
from basis.plicae import *

def apprecia_errorem (p0, p1, indiligentia, vires):
   vires = omnes(vires)
   
   limen = indiligentia * min (abs(v) for v in vires)
   for num in range(len (p0)):
      for dim in range (len (p0[0])):
         delta = abs (p0[num][dim] - p1[num][dim])
         if delta >= limen: return delta 

   return 0

   
# stupe (apprecia_errorem ([[1,1], [2,2], [3,3]], [[1,1.1], [2,2.1], [3,3]], 0.2, 1,1111,22222)) 