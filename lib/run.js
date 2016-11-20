(require('fundamentum'))('array_', 'object_', 'log', 'error');

////////////////////////////////////////

var fs       = require ('fs'),
    jsonlint = require ('jsonlint'),
    runner_  = require ('./runner')
;

var SSL_KEY_PATH  = "/home/pavlo/.ssl/key";
var SSL_CERT_PATH = "/home/pavlo/.ssl/crt";


log('!!! RUN !!!', process.argv);

var debugMode = false, chain = false;
for (var i = process.argv.length; --i > 1 ;) {
  if (process.argv[i] == '--debug') {
    debugMode = true;
    process.argv.splice(i, 1);
  } else if (process.argv[i] == '--chain') {
    chain = true;
    process.argv.splice(i, 1);
  } 
}

var scenario;

if (chain) {

} else {
  var data;
  try {
    var dataFile = process.argv[2];
    var isFile = fs.statSync(dataFile).isFile();
    if (!isFile) {
      log('NOT A FILE: ' + dataFile);
      process.exit();
    }
    // data = jsonlint.parse(fs.readFileSync(dataFile));  
    data = JSON.parse(fs.readFileSync(dataFile));  

  } catch (err) {
    log('SCENARIO LOADING ERROR: ' + dataFile, err);
    process.exit();

  }
 
  var server      = process.argv[3];
  var user        = process.argv[4];
  var scenarioNum = 0;

  scenario = runner_.prepareScenario(data, scenarioNum, server, user);

}

var runner = runner_.initScenario(scenario, initNodeLibraries, debugMode);

runner._run(runner);


////////////////////////////////////////////////////////////////////////

function initNodeLibraries (runner, parameters, debugMode) {
  runner.error   = console.error;
  runner.log     = console.log;
  runner.debug   = debugMode ? console.log : (() => {});
  runner._finish = finishRunNode;

  if ('exec'      in runner.doers) runner.doers.exec   = new exec_();
  if ('http'      in runner.doers) runner.doers.http   = new http_('http');
  if ('https'     in runner.doers) runner.doers.https  = new http_('https');
  if ('socket.io' in runner.doers) runner.doers.socket = new (require ('./socket_io'))();
}


// function consoleLog() {
//   console.log.apply(console, [' '].concat(Array.prototype.slice.call(arguments)))
// }

function divideStdout(stdout) {
   var r = stdout.match(/([^\n]*)\n$/);
   if (r) {
      try         { return [object_(jsonlint.parse(r[1])), stdout.substr(0, stdout.length - r[0].length)]; }
      catch (err) { return [undefined, stdout, err]; }
   } 
   return [undefined, stdout];
} 


function finishRunNode(runner) {
  for (var p in runner.parameters) { if (p[0] === '_') delete runner.parameters[p]; }
  console.log(JSON.stringify(runner.parameters));
  process.exit(runner.isError ? runner.isError : 0);
}


function exec_() {
  this.node_    = require ('child_process'); 
  this.execSync = execSync;
  return this;
  
  function execSync(runner, data) {
    runner.haveToWait = true;

    // !!! stdin

    this.node_.execSync('node lib/run.js --chain ' + (debug ? ' --debug' : ''), (err, stdout, stderr) => {      
      var data_ = divideStdout(stdout); 
      runner.log(data_[1]); if (data_[2]) runner.error(data_[2]);      
      runner.error(stderr);
      runner._callback(runner, data_[0], err);
    });
  }
}


function http_(proto) {

  if (proto === 'https') {
     this.node_    = require(this.proto = 'https'); 
     this.ssl_key  = fs.readFileSync(SSL_KEY_PATH);
     this.ssl_cert = fs.readFileSync(SSL_CERT_PATH);
  
  } else {
     this.node_    = require(this.proto = 'http'); 
  
  }
  
  this.request = request;
  return this;
  
  function request(runner, data) {
    runner.haveToWait = true;
    data = object_(data);
    var headers = data.headers; headers['User-Agent'] = 'wsagger';
    var options = {
      'method':   data.method,
      'hostname': data.host,
      'port':     data.port,
      'path':     data.path,
      'headers':  headers
    };

    if (this.proto == 'https') {
      options.rejectUnauthorized = false;
      options.key                = this.ssl_key;
      options.cert               = this.ssl_cert;
    }
    
    // runner.debug (111111111111, this.proto, options, data.queryData);

    log (888888888, this.proto, options, data.queryData);

    var req = this.node_.request(options, function(res) {
      var responseData = '';
      res.setEncoding('utf8');
      res.on('error', (err)   => { runner._callback(runner, undefined, ['/http: ', err]); });
      res.on('data',  (chunk) => { responseData += chunk; });
      res.on('end',   ()      => {
         runner.debug ('<-- http', responseData);
         try         { runner._callback(runner, jsonlint.parse(responseData)); }
         catch (err) { runner._callback(runner, undefined, ['/http (bad response): ', responseData, err]); }
      });
    });
    req.end(data.queryData, 'utf8');
  }
}
