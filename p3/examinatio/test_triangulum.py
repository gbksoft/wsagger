import unittest

if __name__ == '__main__':
   import sys
   sys.path.append ('C:/!pavlo/P/')
   sys.path.append ('C:/!pavlo/C/python_calculatio/')

from   mathematica  import *
from   triangulum   import *

import cura.examinatio

indiligentia = 0.0001

class Scaenarium (basis.examinatio.Scaenarium):
   def Test_triangulum_ab_dij (self):
      exitus = Triangulum_ab_dij (*self.data)
      self.assertFalse (apprecia_errorem (exitus, self.exitus, indiligentia, *self.data))

if __name__ == '__main__':
   cura.examinatio.Examina_locum ('.', sys.argv[1:])
