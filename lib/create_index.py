import os, sys, json

path = (sys.argv[1] if len(sys.argv) > 1 else '.')

w_index = {
   'tags': {},
   'wsagger': 'index'
}

for path_, subpaths, files in os.walk(path): 
   for file_ in files:
      if file_[-13:] == '.wsagger.json':
         file = path_ + '/' + file_
         print (file)
         with open (file) as f:
            w = json.loads(f.read())
            if w.get ('tags'):
               if not w['tags']: 
                  tags = ['???'] 
               
               else:
                  tags = w['tags'] if isinstance (w['tags'], list) else [w['tags']]  
            
            else:
               tags = ['???'] 

            _file = file[len(path):]

            for t in tags:
               if not (t in w_index['tags']): w_index['tags'][t] = []
               if w.get('name'): 
                  name = w['name'] 
               else: 
                  name = _file 

               w_index['tags'][t].append ({"file": _file, "name": name})

wsagger_path = path + 'wsagger/' if os.path.isdir (path + 'wsagger/') else path

with open (wsagger_path + 'wsagger.index.json', 'w') as f:
   f.write(json.dumps(w_index, indent = 3))

