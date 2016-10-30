import sys, math, cmath

from cura         import *
from basis        import *
from basis.plicae import *

from geometria    import *

indiligentia = 0.000001


### calculatio recta #############################################

def corrige_A (A):
   if A <= -math.pi:
      A = A + 2 * math.pi
      while A <= -math.pi: A = A + 2 * math.pi
   
   else:
      while A >   math.pi: A = A - 2 * math.pi 
      
   return A


def calcula_t (p, A, X_Y, Z, V_S, V_G):

   # $l_0_ - distance Ox - p* against bullet direction
   # $l_1  - distance p* - p_r along bullet direction
 
   x, y, z = p[0], p[1], p[2]
   
   cos_A = cos (A)

   if abs (cos_A) > indiligentia:
      X = X_Y / cos_A 
      X_   = (y * tan (A)) + X 
      r_xy = (X_ - x) * cos_A
      l_0_ = y / cos_A
   
   else:
      r_xy = X_Y - y
      
   r = sqrt ((z - Z) ** 2 + r_xy ** 2

   if r == 0: return 0 
   
   M   = V_G / V_S
   l_M = r * sqrt (M * M - 1)
   l_1 = (X_ - x) * sin (A)
   
   return (l_M - l_0_ + l_1) / V_G
