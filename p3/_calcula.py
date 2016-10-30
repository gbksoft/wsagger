import sys, os, re

from cura         import *
from basis        import *
from basis.plicae import *

from measure      import lege, praepara_data, scala, calcula_deltas

if len (sys.argv) > 1 and os.path.isdir (sys.argv[1]):
   print ('Path: %s/' % sys.argv[1]) 

   d_ = {}
   for p0_ in os.listdir (sys.argv[1]):
      if not re.match (r'^\d-\d$', p0_): 
         continue

      for p_ in os.listdir (sys.argv[1] + '/' + p0_):
         if p_[:5] == 'data.' or p_[:1] == '_': continue
      
         p = '%s/%s/%s' % (sys.argv[1], p0_, p_); print (p) 
         data, len_ch, error = lege (p)
      
         if data:
            print ('+')
            with open ('%s/data.%s.%s' % (sys.argv[1], p0_, p_), mode = 'w') as op:
               print                          ('\t'.join (str (fl)          for fl in data), file = op)
               for i in range (len_ch): print ('\t'.join (str (data[fl][i]) for fl in data), file = op)
               
            d_[p_] = {}
            for fl in data:
               d_[p_][fl] = praepara_data (data[fl])
               # alt_max, first_max, alt_med, first_med, periodus, vires
 
         else:
            fere ('WTF? %s' % error)

            
      media = []
      with open ('%s/_index.%s.xls' % (sys.argv[1], p0_), mode = 'w') as op:
         print ('\tflumen\talt_max\tfirst_max\talt_med\tfirst_med\tperiodus\tlongitudo\tdelta_first_med', file = op)
         for p_ in d_:
            print (p_) 
            d = d_[p_]
            for fl in d:
               print ('\t%s\t%s\t%s\t%s\t%s\t%s\t%s' % (fl, d[fl][0], d[fl][1], d[fl][2], d[fl][3], d[fl][4], len (d[fl][5])), file = op)

            delta_m = d['0'][3] - d['1'][3]
            print ('%s\t\t\t\t\t\t\t\t%s\n' % (p_, delta_m), file = op)        
            media.append ([p_, delta_m])
         
         """
         deltae, delta1 = calcula_deltas (d['1'][4], d['0'][4])
         with open ('%s/data.deltae.%s' % (sys.argv[1], p_), mode = 'w') as op_d:
            for i in range (len (deltae)):
               print ('%s\t%u\n' % ((delta0 + delta1 + i), deltae[i]), file = op_d)
         """
        
      with open ('%s/_media.%s.xls' % (sys.argv[1], p0_), mode = 'w') as op:
         for m in sorted (media, key = lambda x: x[1]):
            # print ('%s\t%s' % (m[0], m[1]))
            print ('%s\t%s' % (m[0], m[1]), file = op)        

         
else:
   print ('What path is?') 


   