#coding=cp1251

# from __future__ import division

import sys, math, cmath

from cura         import *
from basis        import *
from basis.plicae import *


def distantia (p1, p2):
   return math.sqrt ((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)


def th_ (rxy, z):
   return math.pi/2                           if z == 0 \
     else math.pi - math.atan (abs (rxy / z)) if z <  0 \
     else math.atan (abs (rxy / z))


def ph_ (x, y):
   return math.pi + math.atan (y / x)        if x <  0 \
     else math.pi * (0.5 if y >= 0 else 1.5) if x == 0 \
     else math.atan (y / x)                  if y >= 0 \
     else math.pi * 2 + math.atan (y / x) 


def corrige_ph (ph):
   if ph < 0:
      ph = ph + 2 * math.pi
      while ph < 0: ph = ph + 2 * math.pi

   else:
      while ph >= 2 * math.pi: ph = ph - 2 * math.pi

   return ph


def eucl_sph (r, th, ph, p0 = None):
   if th < 0: 
      th = -th
      ph = ph + math.pi

   while th > math.pi:
      th = th - math.pi
      ph = ph + math.pi
   
   r_xy = r * math.sin (th)
   p = (r_xy * math.cos (ph), r_xy * math.sin (ph), r * math.cos (th))

   if p0:
      for i in range (3): p[i] = p[i] + p0[i]
   
   return p


def sph_eucl (x, y, z):
   r   = math.sqrt (x*x + y*y + z*z)
   rxy = math.sqrt (x*x + y*y)
   th  = th_ (rxy, z)
   
   return (r, th, (0 if th == 0 or th == math.pi else ph_ (x, y)))


def verte_OY (r, th, ph, delta):
   (x, y, z) = eucl_sph (r, th, ph)
   
   rxz   = math.sqrt (x*x + z*z)
   th_xz = th_ (x, z) 
 
   a0_xz = th_xz if x >= 0 else -th_xz 
   a1_xz = a0_xz + delta
   
   return sph_eucl (rxz * math.sin (a1_xz), y, rxz * math.cos (a1_xz))


def verte_OZ (r, th, ph, delta):
   if th == 0 or th == math.pi/2: return (r, th, 0) 
   
   ph = ph + delta

   if ph < 0:
      ph += 2 * math.pi
      while ph < 0: ph += 2 * math.pi   
      return (r, th, ph)


   while ph >= 2 * math.pi:
      ph = ph - 2 * math.pi

   return (r, th, ph)
   
                                            
def th_ph_media (p_):
   if not p_: return (0, 0, 0)

   cp_ = tuple (eucl_sph (p[0], p[1], p[2]) for p in p_)
   
   x = 0
   y = 0
   z = 0
   num = len (p)

   for cp in cp_:
      x = x + cp[0]
      y = y + cp[1]
      z = z + cp[2]

   return sph_eucl (x/num, y/num, z/num)
            