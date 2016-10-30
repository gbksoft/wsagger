import json, re

if __name__ == '__main__': import sys; sys.path.append ('../')

# from cura import *


################################

def nn (a):
   return a if a != None else ''


def numerus (a):
   return a if isinstance (a, int) else int (a) if isinstance (a, str) and re.match (r'-?\d+$', a) else 0


def omnes (a):
   return [a] if isinstance (a, (dict, str, bytes, bytearray, memoryview)) else list (a) if hasattr (a, '__iter__') else [] if a == None else [a] 


def omnes_2 (a):
   return [[a]] if isinstance (a, (dict, str, bytes, bytearray, memoryview)) else [omnes (e) for e in a] if hasattr (a, '__iter__') else [] if a == None else [[a]] 
   

def omnes_ (a):
   return iter ([a]) if isinstance (a, dict) else a if hasattr (a, '__iter__') else [] if a == None else [a] 
   

def sunt (a):
   return isinstance (a, (list, tuple)) and len (a) 
   

def intersectio_ (A, B): 	
   if hasattr (A, '__len__') and hasattr(B, '__len__'):
      for a in A:
         if a in B: return True

   return False
   
   
def primum (a, num = 0):  
   if isinstance (a, (str, bytes, memoryview)):
      return a

   elif isinstance (a, (list, tuple)):
      return a[num] if len(a) > num else None
   
   elif hasattr (a, '__iter__'):
      try:
         if num:
            for i in range (num): next (a)
         return next(a)

      except:	
         exceptio ()
         return None

   else:
      return None if num else a


def primum_minus (a):  
   if isinstance (a, (str, bytes, memoryview)):
      return a

   elif isinstance (a, (list)):
      if len(a): 
         p = a[0]; 
         del a[0]; 
         return p

      else:
         return None
   
   elif hasattr (a, '__iter__'):
      try: 
         return next(a)
      except: 
         exceptio ()
         return None

   else:
      return a


def corrige_claves (a, actio):
   return a

	  
def frutex (a, actio = None):
   if isinstance (a, dict):
      return corrige_claves (a, actio) if actio else a  
      
   elif isinstance (a, (str, int, float)):
      return {'': a}
   
   elif isinstance (a, (list,tuple)):
      ex = {}
      for e in a:
         if not isinstance (a, (list,tuple)): 
            if actio: e = actio (e)
            ex[e] = ex.get(e)

         elif len(e):
            cl = actio (e[0]) if actio else e[0]
            if len (e) == 2:
               if ex.get(cl) == None         : ex[cl] = e[1]
               elif isinstance (ex[cl], list): ex[cl].append(e[1])
               else                          : ex[cl] = [ex[cl], e[1]]

            elif len (e) > 2:
               ex[cl] = omnes (ex.get(cl)) + e[1:]
               
            else: 
               ex[cl] = ex.get(cl)

      return ex            

   else:
      return {}


def geminus (A):
   if isinstance (A, tuple):
      return tuple(geminus(e) for e in A)

   elif isinstance (A, list):
      return list(geminus(e) for e in A)

   elif isinstance (A, dict):
      return dict ([e, geminus(A[e])] for e in A)
      # ??? [geminus(e), geminus(A[e])]
   else:
      return A

def a_j (j):
   if   isinstance (j, str) == False: return j
   elif len (j) == 0                : return None   
   
   try:    
      return json.loads (j)

   except: 
      exceptio ()
      return None  #  ValueError, JSONDecodeError - from version 3.5
      

def j_a (a, **kargs):
   if isinstance (a , (dict, list)) == False: return ''

   try:    
      return json.dumps(a, **kargs)

   except: 
      exceptio ()
      return ''


### textus ################################
      
purga_s  = re.compile(r'^\s+')
purga_d  = re.compile(r'\s+$')
purga__  = re.compile(r'\s+')

def purga (t, modus = None):
   return (''                                                        if t == None             
     else purga__.sub(' ', purga_d.sub('', purga_s.sub('', str(t)))) if hasattr (t, '__str__') 
     else ''
   )

def linea (t):
   return (''    if t == None 
     else str(t) if hasattr(t, '__str__')
     else ''
   )

