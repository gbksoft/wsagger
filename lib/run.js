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

if (!debugMode) log('\n!!! WITHOUT DEBUG INFO !!!');

var scenario;

if (inChain) {
  scenario = runner_.prepareScenarioInChain(JSON.parse(process.argv[2])); 

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


var runner = runner_.initScenario(scenario, initNodeLibraries, debugMode, (runner) => {
  if (runner.inChain) {
    var data = {};
    for (var k of array_(('keysOut' in runner) ? runner.keysOut : runner.lastStepKeysOut)) data[k] = runner.parameters[k];
    console.log('finishRunNode:\n', JSON.stringify(data));
  }

  process.exit(runner.isError ? runner.isError : 0);
});

if (runner) runner._run(runner);


////////////////////////////////////////////////////////////////////////

function initNodeLibraries (runner, debugMode) {
  runner.error  = console.error;
  runner.log    = console.log; 
  runner.debug  = (debugMode ? console.log : (() => {}));

  if ('doer.load'      in runner.parameters) runner.parameters['doer.load']      = new load_();
  if ('doer.call'      in runner.parameters) runner.parameters['doer.call']      = new call_();
  if ('doer.exec'      in runner.parameters) runner.parameters['doer.exec']      = new exec_();
  if ('doer.http'      in runner.parameters) runner.parameters['doer.http']      = new http_('http');
  if ('doer.https'     in runner.parameters) runner.parameters['doer.https']     = new http_('https');
  if ('doer.socket_io' in runner.parameters) runner.parameters['doer.socket_io'] = new socket_io_();
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





function load_() {
  this.loadJSON = loadJSON;
  return this;
  
  function loadJSON(runner, step, filename_, expected) {
    var filename = process.env.WSAGGER_SCRIPT_PATH + '/' + filename_;
    runner.debug ('\nout --> ' + step.action + ':', filename);

    try {     
      var data_ = fs.readFileSync(filename)
      var data  = JSON.parse(data_);  
      runner._callback(runner, step, data, expected);

    } catch (err) {
      runner._callback(runner, step, undefined, expected, err);
    
    }
  }
}


function call_() {
  this.callWsagger = callWsagger;
  return this;
  
  function callWsagger(runner, step, wsaggerScript, expected) {
    try {
      runner.debug ('\nout --> ' + step.action + ':', wsaggerScript);    
      var scenario = runner_.prepareScenarioCall(wsaggerScript, 0, runner.parameters);    
      var runner1  = runner_.initScenario(scenario, initNodeLibraries, debugMode, (_runner1) => {
        var data = {};

        for (var k of array_(('keysOut' in _runner1) ? _runner1.keysOut : _runner1.lastStepKeysOut)) {
           data[k] = _runner1.parameters[k];
        }
        runner._callback(runner, step, data, expected);
      });
      
      if (runner1) runner1._run(runner1);

    } catch (err) {
      runner._callback(runner, step, undefined, expected, err);
    
    }
  }

}


function exec_() {
  this.node_    = require ('child_process'); 
  this.execSync = execSync;
  return this;
  
  function execSync(runner, step, data, expected) {   
    try {
      var scenario = JSON.stringify({parameters: runner.parameters, data: array_(data)}).replace(/"/g, '\\"');
      
      var command = 'WSAGGER_SCRIPT_PATH=' + process.env.WSAGGER_SCRIPT_PATH 
                  + ' ' + NODE_EXEC_PATH + 'node lib/run.js --chain' 
                  + (debugMode ? ' --debug' : '') 
                  + ' "' + scenario + '"'
      ;

      runner.debug ('\nout --> ' + step.action + ':', command);
      var stdout      = this.node_.execSync(command, {encoding: 'utf8'} );
      var data_       = divideStdout(stdout);      
      var parameters_ = data_[0];
      runner.debug('execSync (data):', data_[1]); 
      if (data_[2]) runner.error('/execSync (err):', data_[2]);      

      runner._callback(runner, step, parameters_, expected);

    } catch (err) {
      runner._callback(runner, step, undefined, expected, err);
    
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
  
  function request(runner, step, data, expected) {
    data = object_(data);
    var headers = data.headers; headers['User-Agent'] = 'wsagger';
    var options = {
      'method':   data.method,
      'hostname': data.host,
      'port':     data.port,
      'path':     data.path,
      'headers':  headers
    };

    if (this.proto == 'https') options.rejectUnauthorized = false;
    
    runner.debug ('\nout --> ' + step.action + ':', this.proto, '\n', options, '\n', data.queryData);

    var req = this.node_.request(options, (res) => {
      var responseData = '';
      res.setEncoding('utf8');
      res.on('error', (err)   => { runner._callback(runner, step, undefined, expected, ['/http: ', err]); });
      res.on('data',  (chunk) => { responseData += chunk; });
      res.on('end',   ()      => {
        var response;
        try         { response = JSON.parse(responseData); }
        catch (err) { runner._callback(runner, step, undefined, expected, ['/http (bad response): ', responseData, err]); }
        runner._callback(runner, step, response, expected);       
      
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
  
  function connect(runner, step, data, expected) {
    runner.debug ('\nout --> ' + step.action + ':', data);
    
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

  function emit(runner, step, data, expected) {
    runner.debug ('\nout --> ' + step.action + ':', data);
    socket_io.expected = expected;    
    socket_io.socket.emit.apply(socket_io.socket, data);
  }

  function expect(runner, step, data, expected) {
    runner.debug ('\nout --> ' + step.action + ':');
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
      delete runner.haveToWait;
      runner._run(runner);
    }
  }
}

