import re

def setParameters (data, parameters):
   if isinstance (data, str):
      for key in parameters: data = re.sub ('{{' + key + '}}', parameters[key], data)

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


# print (setParameters ([1, 2, 3, '  {{key}} swer {{key2}} {{ke y}}', {1: '{{key}}', 2: {1: '{{key}}'}}], {'key': 'value', 'key2': 'value2'}))

"""
parameters = {}
check = checkData ([1, 2,  'value3',    'value1',    {1: [1,2,3,4],  2: {1: '{{key}}'}}], 
                   [1, 2, '{{!key3}}', '{{!key1}}', {1: '{{!key2}}', 2: {1: '{{key}}'}}], parameters)

check = checkData (1, '1', parameters)
print (check, parameters)
"""

