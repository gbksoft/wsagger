import re, os, sys, inspect, traceback

def exceptio (limen = 7, plica = None, mode = 'a'):
   if plica:
      exc = traceback.format_exc (limen)
      print (exc)
      try:
         with open (plica, mode) as op: op.write (exc)
         # buffering=-1, encoding=None, errors=None, newline=None, closefd=True, opener=None         

      except:
         print (traceback.format_exc (limen)) 

   else:
      print (traceback.format_exc (limen)) 

   	
def _ab ():
   return ' <-- '.join (e[1] + '::' + e[3] + '::' + str (e[2]) for e in inspect.stack()[3:])

_re_t = re.compile(r'\s*,\s*')  
   
def _fere (modus, t, arg):
   if isinstance (modus, str) == False: return

   tituli = _re_t.split (t) if isinstance (t, str) else []
   if len (arg) or len (tituli):
      vires = []
      for i in range (max (len (arg), len (tituli))):
         if i < len (tituli): vires.append (tituli[i])
         vires.append ('"None"' if i >= len (arg) else list (arg[i]) if isinstance (arg[i], (tuple, range)) else arg[i])
   
      if modus.find ('f') >= 0: 
         print (*vires)
	
      if modus.find ('n') >= 0: 
         with open ('0.eph', 'a') as op: 
            stdout_, sys.stdout = sys.stdout, op 
            print ('\n### ' + _ab() + '::\n\n', *vires) 
            sys.stdout = stdout_ 

      if modus.find('s') >= 0: 
         input('...')


def fere (*arg, t = None):
   _fere ('fn', t, arg)


def nuntia (*arg, t = None):
   _fere ('fn', t, arg)


def indica (*arg, t = None):
   if not os.environ.get("STATUS_ACTIONIS"): _fere('f', t, arg)


def nota (*arg, t = None):
   _fere ('n', t, arg)


def stupe (*arg, t = None):
   _fere ('sfn', t, arg)
