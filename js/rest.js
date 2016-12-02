var fs    = require('fs'),
    http  = require('http'),
    https = require('https')
;

// var SSL_KEY_PATH  = "/data/home/user/0/game/auth/key";
// var SSL_CERT_PATH = "/data/home/user/0/game/auth/crt";

// var ssl_key  = fs.readFileSync(SSL_KEY_PATH);
// var ssl_cert = fs.readFileSync(SSL_CERT_PATH);

function restQuery(method, proto, host, port, queryPath, queryData, headers, callback) {

   headers['User-Agent'] = 'GBK node.js';

   var options = {
      'method':   method,
      'hostname': host,
      'port':     port,
      'path':     queryPath,
      'headers':  headers
   };


   var http_;
   if (proto == 'https://') {
      http_ = https;
      options.rejectUnauthorized = false;
      // options.key                = ssl_key;
      // options.cert               = ssl_cert;

   } else {
      http_ = http;

   }

   console.log (11111111111111, options, queryData);

   var req = http_.request(options, function(res) {

      var responseData = '';
      res.setEncoding('utf8');
      res.on('error', (err)   => { callback({error: ['REST problem', err]}); });
      res.on('data',  (chunk) => { responseData += chunk; });
      res.on('end',   ()      => {

         console.log (22222222222, responseData);

         try         { callback(JSON.parse(responseData)); }
         catch (err) { callback({error: ['REST data problem: ', responseData, 'error:', err]});  }
      });
   });
   req.end(queryData, 'utf8');
}

// restQuery('POST', 'chat-nodejs.dev.gbksoft.net', 28781, '/rest/v1/user/login', 'username=pavlo&password=pavlo&remember_me=0', console.log);

// restQuery('POST', 'localhost', 28780, '/rest/v1/user/login', 'username=pavlo&password=pavlo', console.log);


function tryLogin(proto, host, port, path_, path2, data, callback) {
   var headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      // 'Content-Type': 'application/json',
      'Accept': 'application/json'
   };

   restQuery('POST', proto, host, port, path_ + path2, data, headers, (response) => {
      if (response.result) {
         if (response.result.token) {
            callback(response.result.token);
            return;

         } else if (response.result.accessToken && response.result.accessToken.token) {
            callback(response.result.accessToken.token);
            return;

         }
      }
      // console.error('/tryLogin (response): ', response);
   });
}


function tryLoginCID(proto, host, port, path_, data, callback) {

   var path2     = data.path;
   var queryData = data.queryData;
   var CID_rest  = data.CID_rest;
   var CID_node  = data.CID_node;


   var headers1 = {
      'Content-Type': 'application/x-www-form-urlencoded',
      // 'Content-Type': 'application/json',
      'Accept': 'application/json'
   };

   restQuery('POST', proto, host, port, path_ + path2, queryData, headers1, (response) => {
      if (response.result) {
         var token = response.result.token || (response.result.accessToken ? response.result.accessToken.token : '');


         if (token) {
            var node_token = CID_node + token;

            var headers2 = {
               'Content-Type': 'application/json',
               'Accept': 'application/json',
               'Authorization': 'Bearer ' + token
            };

            restQuery('POST', proto, host, port, path_ + '/v1/connections', JSON.stringify({"connection_id": CID_rest}), headers2, (response) => {
               callback(node_token);
               return;
            });
         }
      }
      // console.error('/tryLogin (response): ', response);
   });
}

exports.restQuery   = restQuery;
exports.tryLogin    = tryLogin;
exports.tryLoginCID = tryLoginCID;

//                "action": "login_and_register_cid_and_connect", "data": [{"CID_rest": "{{CID_rest}}", "CID_node": "{{CID_node}}", "path": "/v1/users/login", "queryData": "{\"email\": \"{{username}}\", \"password\": \"{{password}}\"}"}],
