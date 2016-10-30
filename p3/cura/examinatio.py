import re, sys, os, importlib, unittest, json, collections

if __name__ == '__main__': sys.path.append ('../')

from cura import *

if re.search ('win', sys.platform, re.I):
   O_BINARY       = os.O_BINARY
   CODEX_PLICARUM = 'cp1251'

else:   
   O_BINARY       = 0
   CODEX_PLICARUM = 'utf-8'
   
  
#####################################


class Scaenarium (unittest.TestCase):
   def __init__ (self, Actio, data = None, exitus = None, modus = None, titulus = 'runTest'):
      if titulus != 'runTest': setattr (self, titulus, self.runTest)
      super (Scaenarium, self).__init__ (titulus)      # python3: super ().__init__ (titulus)
      self.Actio, self.data, self.exitus, self.modus, self.titulus = Actio, data, exitus, modus, titulus
      
   def runTest (self):
      print ('\n\n' + str (self.titulus))

      exitus   = self.Actio (**self.data) if isinstance (self.data, dict) else \
                 self.Actio (*self.data)  if isinstance (self.data, (list, tuple)) else \
                 self.Actio (self.data)  

      if isinstance (self.modus, str) == False:
         self.assertEqual (exitus, self.exitus)
         return
      
      Assertio = getattr (unittest.TestCase, 'assert' + self.modus)
      if self.modus in ('True', 'False', 'None', 'NotNone'): Assertio (self, exitus)
      else                                                 : Assertio (self, exitus, self.exitus)
      

def Lege_descr (descr, plica = ''):

   d = []
   for scaen in descr:
      try:
         if scaen == 'examinatio':
            Scaenarium_ = Scaenarium  
         else:
            s           = scaen.split ('::')
            classis     = s[1] if len (s) > 1 else 'Scaenarium'
            Scaenarium_ = getattr (importlib.import_module (s[0]), classis)

         for act in descr[scaen]:
            if len (act) <= 0 or not isinstance (act[0], str): 
               Actio = None
   
            elif act[0][:1] != '#': 
               a     = act[0].split ('::')
               Actio = getattr (importlib.import_module (a[0]), a[1])

            else:
               # ["#js.notitiae", "dat", "period", "min_"]
               continue
               
            titulus    = act[4] if len (act) > 4 else act[0] if len (act) > 0 else 'runTest'
            modus      = act[3] if len (act) > 3 else None
            exitus     = act[2] if len (act) > 2 else None
            data       = act[1] if len (act) > 1 else None

            if (scaen == 'examinatio') and not isinstance (Actio, collections.Callable): 
               continue

            d.append ([plica, Scaenarium_, Actio, data, exitus, modus, titulus])
            
      except:
         Exceptio0 ()
      
   return d

      
def Praepara_exam_json (locus0 = './', plicae0 = None):

   d = []
   for locus, subloci, plicae in os.walk (locus0):
      for plica_ in plicae:
         if (plicae0 and plica_ in plicae0) or (plica_[-10:] == '.exam.json'): 
            plica = locus + plica_
            print ('praeparo %s...' % plica)
            
            op = None
            try:
               op = os.open (plica, os.O_RDONLY|O_BINARY)
               descr = json.loads (os.read (op, list (os.stat(plica))[6]).decode (CODEX_PLICARUM))
               os.close(op)
               if isinstance (descr, dict): d = d + Lege_descr (descr, plica)
               else                       : print (descr, '??? descr')

            except: 
               if op: os.close(op)
               Exceptio0 ()
        
   return d
 

def Examina_locum (locus = './', plicae = None):
   d = Praepara_exam_json (locus, plicae)

   if d:
      test_suite = unittest.TestSuite()
       
      plica_ = ''
      for plica, Scaenarium_, Actor, data, exitus, modus, titulus in d:
         if plica != plica_:
            print ('examino %s...' % plica)
            plica_ = plica
      
         test_suite.addTest (Scaenarium_ (Actor, data, exitus, modus, titulus))

      runner = unittest.TextTestRunner()
      runner.run (test_suite)   
         
   else:
      print ('Data pro examinatione nulla sunt!')

    
if __name__ == '__main__':
   sys.path.append ('../../')
   Examina_locum ('./', sys.argv[1:])


""" 
   descr = frutex (a_j (m_p (sys.argv[1])))
   actor = importlib.import_module (descr.get('actor'))
   if actor:   
      basis.examinatio.praepara_data (sys.argv[1])
      sys.argv = [sys.argv[0]]
      unittest.main (actor)
""" 
   