function setParameter(data, key, value) {
   if (typeof data === 'string') {
      return data.replace(new RegExp('{{' + key + '}}', 'g'), value);
   
   } else if (data instanceof Array) {
      for (var i=-1; ++i < data.length;) {
         data[i] = setParameter(data[i], key, value);
      }

   } else if (data instanceof Object) {
      for (var i in data) {
         data[i] = setParameter(data[i], key, value);
      }

   }
   return data; 
}

function checkData(data, proto, parameters) {
   var checked = true;
   if (typeof proto === 'string') {
      var r = proto.match(/^\{\{!(.*?)\}\}$/);
      if (r)             { 
         parameters[r[1]] = data; 

      } else if (data !== proto) { 
         checked = false; 

      }  

   } else if (proto instanceof Array) {
      if (data instanceof Array) {
         for (var i=-1; ++i < proto.length;) {
            if (!checkData(data[i], proto[i], parameters)) checked = false; 
         }   

      } else {
         checked = false; 

      }
   
   } else if (proto instanceof Object) {
      if (data instanceof Object) {
         for (var i in proto) { 
            if (!checkData(data[i], proto[i], parameters)) checked = false; 
         }

      } else {
         checked = false; 

      }
   
   } else if (data !== proto) {
      checked = false; 

   }

   return checked;
}


// console.log(null instanceof Object);
// console.log(undefined instanceof Object);

// console.log(setParameter(undefined));
// console.log(setParameter(null));
// console.log(setParameter(false));
// console.log(setParameter(true));


var parameters = {};
// var check = checkData([1,   2,   'value3',    'value1',    {1: [1,2,3,4],   2: {1: '{{key}}'}}], 
//                      ['1', '2', '{{!key3}}', '{{!key1}}',  {1: '{{!key2}}', 2: {1: '{{key}}'}}], parameters);

var check = checkData(1, '1', parameters);

console.log(check, parameters);

// console.log(setParameter([1, 2, 3, '  {{key}} swer {{key}} {{ke y}}', {1: '{{key}}', 2: {1: '{{key}}'}}], 'key', 'value'));
