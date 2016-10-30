import sys, re, os, time

if __name__ == '__main__': sys.path.append ('../')

from cura         import *
from basis        import *
from basis.formae import *

O_BINARY       = os.O_BINARY if re.search ('win', sys.platform, re.I) else 0
CODEX_PLICARUM = 'utf-8'

def nomen_loci_unicum (locus = '', ext = ''): 
   if ext and ext[:1] != '.': ext = '.' + ext
   n = '_' + str (int (time.time()))
   for add in ([''] + list (range (100))):
      l_ = locus + n + ('_' + str( add) if add else '') + ext;
      if not os.path.exists (l_): return l_


def locus (l_):
	
	# if l_ == '../'
	l = os.path.dirname(linea(l_))
	
	# l =~ s(/+$)()o; 

	if   os.path.isdir(l)  : return l + '/'  
	elif os.path.isfile(l) : return os.path.dirname(l) + '/'   # return ''
	elif l == ''           : return './'
	else				   : os.makedirs(l, exist_ok = True); return l + '/' if os.path.isdir(l) else '' 
	
	# !!! makedirs() will become confused if the path elements to create include pardir (eg. ".." on UNIX systems).
	
	# r = re.search('/([^/]*)$', l)
	# if r: l = locus(l[:r.start(0)] + '/') + l[r.end(0):]
	# return l + '/' if os.mkdir (l) else '' 

	

def forma_p (plica, forma = None):
   if forma == None:
      plica = linea (plica)
      if os.path.isdir (plica): return {'': ''} 
      r = re.search (r'.\.([^.]*)$', plica)
      forma = r.group(1).lower() if r else '' 

   else:
      forma = linea (forma).lower()
      forma = re.sub (r'^\.+', '', forma)

   if forma in FORMAE: 
      if 's' in FORMAE[forma]: forma = FORMAE[forma]['s']   # and FORMAE[forma]['s'] in FORMAE
      FORMAE[forma][''] = forma
      return FORMAE[forma]
      
   return {'': forma}	

   
def m_p (plica, codex = CODEX_PLICARUM):
   # if codex == None: examina FORMAE
   
   if os.path.isfile(plica):
      try:
         if codex:
            op = os.open (plica, os.O_RDONLY|O_BINARY)
            t = os.read (op, list(os.stat(plica))[6]).decode (codex)

         else:			
            op = os.open (plica, os.O_RDONLY|O_BINARY)
            t = os.read (op, list(os.stat(plica))[6])	
            
         os.close(op)
         return t
         
      except:
         exceptio ()
	
   return '' if codex else b''


def crea_p (plica, binary = None):
	r = re.search('/([^/]*)$', plica)
	if r: 
		plica_ = locus(plica[:r.start(0)] + '/') 
		if not plica_: return (None, plica)
		plica = plica_ + r.group(1)
	
	return (os.open (plica, os.O_CREAT|os.O_WRONLY|O_BINARY if binary else os.O_CREAT|os.O_WRONLY), plica)  

	
def p_m (plica, contentus, codex = None):
   try:
      binary = isinstance (contentus, (bytes, bytearray, memoryview))
      (op, plica) = crea_p (plica, binary)  
      if op: 
         os.write (op, contentus if binary else linea (contentus).encode (codex if codex else CODEX_PLICARUM))
         os.close (op)
         return plica

   except:
      exceptio ()

   return ''
