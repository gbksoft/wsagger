import sys, os, re, importlib

if __name__ == '__main__': sys.path.append ('../')

from cura         import *
from basis        import *
from basis.plicae import *


def setParameters (data, parameters):
   if isinstance (data, str):
      if (data[:2] == '{{') and (data[-2:] == '}}'):
         data = parameters.get (data[2:-2])

      else:
         for key in parameters: data = re.sub ('{{' + key + '}}', parameters.get (key), data)

   elif isinstance (data, list):
      for i in range (len (data)): data[i] = setParameters (data[i], parameters)

   elif isinstance (data, dict):
      for i in data: data[i] = setParameters (data[i], parameters)

   return data 
   

def checkData (data, proto, parameters):
   checked = True

   if isinstance (proto, str):
      r = re.match (r'\{\{!(.*?)\}\}$', proto)
      if r:
         parameters[r.group (1)] = data 

      elif data != proto:
         checked = False 

   elif isinstance (proto, list):
      if isinstance (data, list) and len (data) >= len (proto):
         for i in range (len (proto)):
            if not checkData (data[i], proto[i], parameters): checked = False 

      else:
         checked = False 

   elif isinstance (proto, dict):
      if isinstance (data, dict):
         for i in proto:
            if not checkData (data[i], proto[i], parameters): checked = False 

      else:
         checked = False 

   
   elif data != proto:
      checked = False 


   return checked

if len (sys.argv) <= 1 or not os.path.isfile (sys.argv[1]):
   print ('What file?') 
   
else:
   with open (sys.argv[1], 'r') as op:
      data_ = op.read ()
      data = a_j (data_)
      num = 0 if len (sys.argv) <= 2 else numerus (sys.argv[2])
      scenario = data['scenarios'][num]

      parameters = {}
      for p in scenario['parameters']: parameters[p['name']] = p['in']

      # stupe (parameters)

      successus = False

      for step in scenario['flow']:
         if step['action'] == 'request':
            a = step['key'].split ('::')
            actor = getattr (importlib.import_module (re.sub ('/', '.', a[0])), a[1]) 
            data = setParameters (step['data'], parameters); data = omnes (data)
            # stupe (data)
            
            vis = actor (*data)
            if step['response']:
               if not checkData (vis, step['response']['data'], parameters):
                  print (':-(((')
                  break

      else:
         print ('successus: ', parameters.get ('successus'))