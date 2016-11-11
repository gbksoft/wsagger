var http = require('http');


function restQuery(method, host, port, queryPath, queryData, callback) {
   var options = {
      'method':   method,
      'hostname': host,
      'port':     port,
      'path':     queryPath,
      'headers': {
         'Content-Type': 'application/x-www-form-urlencoded',
         'Accept': 'application/json'
      },
   };

   console.log (options, '', queryData);

   var req = http.request(options, function(res) {
      var responseData = '';
      res.setEncoding('utf8');
      res.on('error', function (err) { callback({error: ['REST problem', err]}); });
      res.on('data', function(chunk) { responseData += chunk; });
      res.on('end', function () {
         console.log(res.headers, responseData);
         try         { callback(JSON.parse(responseData)); } 
         catch (err) { callback({error: ['REST data problem: ', responseData, 'error:', err]});  }
      });
   });
   req.end(queryData, 'utf8');
}

restQuery('POST', 'chat-nodejs.dev.gbksoft.net', 28781, '/rest/v1/user/login', 'username=pavlo&password=pavlo&remember_me=0', console.log);

