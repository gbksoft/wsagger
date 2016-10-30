#coding=cp1251

# from __future__ import division

import sys, math, cmath

from cura         import *
from basis        import *
from basis.plicae import *

for i in '01','02','12','13','23','04','24','34','05','15','35','45': d[i] = lege_dij (i)

p0  = [0,       0, 0]
p1  = [d['01'], 0, 0]
p2  = triangulum_ab_dij (d['01'], d['02'], d['12']); p2.append (0)

p3_ = triangulum_ab_dij (d['12'], d['13'], d['23']); 
p4_ = triangulum_ab_dij (d['02'], d['24'], d['04']); 
p5_ = triangulum_ab_dij (d['01'], d['05'], d['15']); 


def p_alpha (p0, p1, p2_, alpha):
   return 0

   
def distantia_3_ (p3, p0, p1, p2_, alpha2):
   return distantia (p3, p_alpha (p0, p1, p2_, alpha2)


def distantia_45 (p0, p1, p2, p3_, p4_, p5_, alpha3):
   p3 = p_alpha (p0, p1, p3_, alpha3)
   alpha4 = divide_by_2 (-pi/2, pi/2, lambda alpha4: (distantia_3_ (p3, p2, p0, p4_, alpha4) - d['34']))
   alpha5 = divide_by_2 (-pi/2, pi/2, lambda alpha5: (distantia_3_ (p3, p0, p1, p5_, alpha5) - d['35']))
   return distantia (p_alpha (p2, p0, p4_, alpha4), p_alpha (p0, p1, p5_, alpha5))

   
alpha3 = divide_by_2 (-pi/2, pi/2, distantia_45 (p0, p1, p2, p3_, p4_, p5_, alpha3) - d['45'])