(require('fundamentum'))('array_', 'object_', 'log', 'error');

////////////////////////////////////////

var firstConnect = true;

var fs       = require ('fs'),
    jsonlint = require ('jsonlint'),
    runner_  = require ('./runner')
;

// var SSL_KEY_PATH  = "/home/pavlo/.ssl/key";
// var SSL_CERT_PATH = "/home/pavlo/.ssl/crt";

var NODE_EXEC_PATH = '/usr/bin/';

log('\n!!! RUN !!!', process.env.WSAGGER_SCRIPT_PATH, process.argv);

var debugMode = false, inChain = false;
for (var i = process.argv.length; --i > 1 ;) {
  if (process.argv[i] == '--debug') {
    debugMode = true;
    process.argv.splice(i, 1);
  } else if (process.argv[i] == '--chain') {
    inChain = true;
    process.argv.splice(i, 1);
  } 
}

var scenario;

if (inChain) {
  var scenario = JSON.parse(process.argv[2]);
  runner_.prepareDoers(scenario);
  scenario.inChain = true;

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

var runner = runner_.initScenario(scenario, initNodeLibraries, debugMode, finishRunNode);

runner._run(runner);


////////////////////////////////////////////////////////////////////////

function initNodeLibraries (runner, debugMode) {
  runner.error  = console.error;
  runner.log    = console.log; 
  runner.debug  = (debugMode ? console.log : (() => {}));

  if ('load'      in runner.doers) runner.doers.load      = new load_();
  if ('call'      in runner.doers) runner.doers.call      = new call_();
  if ('exec'      in runner.doers) runner.doers.exec      = new exec_();
  if ('http'      in runner.doers) runner.doers.http      = new http_('http');
  if ('https'     in runner.doers) runner.doers.https     = new http_('https');
  if ('socket_io' in runner.doers) runner.doers.socket_io = new socket_io_();
}

// function consoleLog() {
//   console.log.apply(console, [' '].concat(Array.prototype.slice.call(arguments)))
// }

function divideStdout(stdout) {
   var r = stdout.match(/([^\n]*)\n$/);
   if (r) {
      try         { return [object_(jsonlint.parse(r[1])), stdout.substr(0, stdout.length - r[0].length - 1)]; }
      catch (err) { return [undefined, stdout, err]; }
   } 
   return [undefined, stdout];
} 


function finishRunNode(runner) {
  if (runner.inChain) console.log(runner.parameters);
  process.exit(runner.isError ? runner.isError : 0);
}


function load_() {
  this.loadJSON = loadJSON;
  return this;
  
  function loadJSON(runner, filename_, expected, key) {
    try {
      var filename = process.env.WSAGGER_SCRIPT_PATH + '/' + filename_;
      runner.debug ('\nout --> loadJSON:', filename);
      
      var data_ = fs.readFileSync(filename)
      var data  = JSON.parse(data_);  

      runner.debug ('\n<-- in: loadJSON', data, typeof data);
     
      if (key != undefined) runner.parameters[key] = data; 

      runner._callback(runner, data, expected);

    } catch (err) {
      runner._callback(runner, undefined, expected, err);
    
    }
  }
}


function call_() {
  this.callWsagger = callWsagger;
  return this;
  
  function callWsagger(runner, wsaggerScript, expected, key) {
    try {
      runner.debug ('\nout --> callWsagger:', wsaggerScript);    
      var scenario = runner_.prepareScenarioCall(wsaggerScript, 0, runner.parameters);    
      var runner1  = runner_.initScenario(scenario, initNodeLibraries, debugMode, (runner, data) => {
        runner.debug ('\n<-- in: callWsagger', data);
        if (runner.isError) {
          // runner._callback(runner, undefined, expected, 'calling error');
  
        } else {
          if (key != undefined) runner.parameters[key] = data; 
          // !!! remove the crutch - all assignment must be done later in runner._callback :: checkParameters 
          runner._callback(runner, data, expected);
        
        }
      });
      runner1._run(runner1);

    } catch (err) {
      runner._callback(runner, undefined, expected, err);
    
    }
  }

}


function exec_() {
  this.node_    = require ('child_process'); 
  this.execSync = execSync;
  return this;
  
  function execSync(runner, data, expected) {
    try {
      var scenario = JSON.stringify({parameters: runner.parameters, flow: array_(data)}).replace(/"/g, '\\"');
      
      var command = 'WSAGGER_SCRIPT_PATH=' + process.env.WSAGGER_SCRIPT_PATH 
                  + ' ' + NODE_EXEC_PATH + 'node lib/run.js --chain' 
                  + (debugMode ? ' --debug' : '') 
                  + ' "' + scenario + '"'
      ;

      runner.debug ('\nout -->', command);

      var stdout = this.node_.execSync(command, {encoding: 'utf8'} );

      var data_ = divideStdout(stdout);      
      var parameters = data_[0];

      runner.debug(data_[1]); if (data_[2]) runner.error(data_[2]);      
      runner.debug ('\n<-- in: exec_', parameters);
     
      for (var k in parameters) runner.parameters[k] = parameters[k]; 
      // !!! remove the crutch - all assignment must be done later in runner._callback :: checkParameters 

      runner._callback(runner, parameters, expected);

    } catch (err) {
      runner._callback(runner, undefined, expected, err);
    
    }
  }
}


function http_(proto) {

  if (proto === 'https') {
     this.node_    = require(this.proto = 'https'); 
     // this.ssl_key  = fs.readFileSync(SSL_KEY_PATH);
     // this.ssl_cert = fs.readFileSync(SSL_CERT_PATH);
  
  } else {
     this.node_    = require(this.proto = 'http'); 
  
  }
  
  this.request = request;
  return this;
  
  function request(runner, data, expected) {
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
      // options.key                = this.ssl_key;
      // options.cert               = this.ssl_cert;
    }
    
    runner.debug ('\nout -->', this.proto, '\n', options, '\n', data.queryData);

    var req = this.node_.request(options, function(res) {
      var responseData = '';
      res.setEncoding('utf8');
      res.on('error', (err)   => { runner._callback(runner, undefined, expected, ['/http: ', err]); });
      res.on('data',  (chunk) => { responseData += chunk; });
      res.on('end',   ()      => {
         runner.debug ('\n<-- in: http_', responseData);
         try         { runner._callback(runner, jsonlint.parse(responseData), expected); }
         catch (err) { runner._callback(runner, undefined, expected, ['/http (bad response): ', responseData, err]); }
      });
    });
    req.end(data.queryData, 'utf8');
  }
}

function socket_io_() {

  var socket_io     = this;

  socket_io.node_   = require ('socket.io-client'); 
  socket_io.connect = connect;
  socket_io.emit    = emit;
  socket_io.expect  = expect;

  return socket_io;
  
  function connect(runner, data, expected) {
    runner.debug ('\nout --> socket.io.connect', data);
    
    socket_io.expected = expected;        
    socket_io.socket = socket_io.node_(data.url, data.query);

    if (socket_io.socket && firstConnect) { 
      firstConnect = false;
      var onevent = socket_io.socket.onevent;
      socket_io.socket.onevent = function (packet) {
        var args = packet.data || [];
        onevent.call (this, packet);      // original call
        packet.data = ["*"].concat([runner]).concat(args); //  
        onevent.call (this, packet);      // additional call to catch-all
      };
      socket_io.socket.on ("*", onInputEvent);
    }
  }

  function emit(runner, data, expected) {
    runner.debug ('\nout --> socket.io.emit', data);
    socket_io.expected = expected;    
    socket_io.socket.emit.apply(socket_io.socket, data);
  }

  function expect(runner, data, expected) {
    runner.debug ('\nout --> socket.io.expect');
    socket_io.expected = expected;    
  }

  function onInputEvent(runner, event, data) {  // 
    runner.debug ('\n<-- in: socket.io', event, JSON.stringify (data));
    for (var i=-1; ++i < socket_io.expected.length;) {
      if (runner_.checkData([event, data], socket_io.expected[i], runner.parameters)) {
        socket_io.expected.splice(i, 1);
        break;
      } else {
        // log ('checkData failed', [event, data], waitingFor[i]);
      }
    }
    
    if (runner.haveToWait && (socket_io.expected.length < 1)) {
      clearTimeout(runner.haveToWait);
      runner.haveToWait = false;
      runner._run(runner);
    }
  }

}

