import re, math, statistics

re_dig  = re.compile (r'[01]$')
re_num  = re.compile (r'(\d+)')

def lege (p):
   with open (p) as op:
      values = {}   
      for l_ in op:
         l = l_.split ('\t')
         if len (l) > 1 and re_dig.match(l[0]):
            # !!! re_dig - selectio pro flumina
            
            n = re_num.match (l[1])
            if n:
               if not l[0] in values: values[l[0]] = []
               values[l[0]].append (int (n.group (1)))


      if values == {}: return None, None, 'no channels :-('               

      len_ch = None     
      for ch in values:
         if   len_ch == None            : len_ch = len (values[ch])
         elif len_ch != len (values[ch]): return None, None, 'not equal channel data lench :-(' 

      if len_ch == 0: return None, None, 'no data :-('

      return values, len_ch, None

   return None, None, "file wasn't open :-("

   
def praepara_data (dat_, min_ = 0):
   alt_med = statistics.mean (dat_)
   alt_max = alt_med
   dat     = []
   i       = 0
   for d in dat_:
      dat.append (d - alt_med)
      if d > alt_max: 
         alt_max   = d
         first_max = i
      i = i + 1

   first_med  = 0   
   for i in range (first_max, len (dat)):
      if dat[i] <= 0:
         first_med = i
         break

   periodus = 500      
   
   initium = first_max - 100 if first_max >= 100 else 0
   return (alt_max, first_max, alt_med, first_med, periodus, dat[initium:], initium)
   
   """
            limen  = calcula_limen values[ch]
            data[p][ch] = {'start': margin0 + margin1 + i, 'values': values[ch]}
            print ('limen in ch%s = %u' % (ch, limen))

            for i in range (margin0, len_ch):
               if values[ch][i] > limen: 
                  data[p][ch] = {'start': margin0 + margin1 + i, 'values': values[ch]}
                  break

            else:
               return 0, 0, 'no peak in channel %s :-(' % ch
            

      
   """

            
               
margin0 = 700
margin1 = 250
period  = 500
over_period = 50

def statura (dat, period):
   max_plus_1 = 0
   while max_plus_1 <= len (dat): max_plus_1 = max_plus_1 + period
   max_plus_1 = max_plus_1 - period

   return (0, 0) if max_plus_1 < 1 else (sum (abs (d) for d in dat[:max_plus_1]) / max_plus_1, max_plus_1)
 

def scala (dat0_, dat1_, period):
   if not (isinstance (dat0_, list) and isinstance (dat1_, list)):  # and max_ + len (dat1_) <= len (dat0_))
      return None, None

   statura0, long0 = statura (dat0_, period)
   statura1, long1 = statura (dat1_, period)
   proportio       = statura0 / statura1

   return [d * proportio for d in dat1_], long1


def calcula_deltas (dat0, dat1):

   # dat0 - longa
   # dat1 - breve
  
   period_2 = math.floor ((period + over_period) / 2) 
   initium_ = math.floor (period * 0.8) 
   len_dat0     = len (dat0)
   len_dat1_max = len_dat0 - period_2
   
   dat1, long1  = scala (dat0, dat1, period)
   
   deltae = []
   for d in range (-period_2, period_2): 
      deltae.append (sum (abs (dat1[i] - dat0[i + d]) for i in range (initium_, len (dat1) - 1000)))

   return deltae, -period_2   



"""
         


         """

   


"""
dat0 = [math.sin(x) for x in range (100)]   
dat1 = [math.sin(x) for x in range (50)]   

with open ('1.xls',mode = 'w') as f:
   print (*calcula_deltas (dat0, dat1, 0, 30), sep = '\n', file = f)
"""

