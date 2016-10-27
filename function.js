function setParameter(data, key, value) {
   if (data) {
      if (data instanceof Array) {
         for (var i=-1; ++i < in data.length;) {
            data[i] = setParameter(data[i], key, value);
         }

      } else if (data instanceof String) {
         return data.replace('{{' + key + '}}', value);
   
      } else if (data instanceof Object) {
         for (var i in data) {
            data[i] = setParameter(data[i], key, value);
         }

      }
   }   
   return data; 
}
