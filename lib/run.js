(require('fundamentum'))('array_', 'object_', 'log', 'error', 'string_');

"use strict";

////////////////////////////////////////

var firstConnect = true;

var fs          = require('fs'),
    querystring = require('querystring'),
    jsonlint    = require('jsonlint'),
    json        = require('comment-json'),
    lib         = require('./lib'),
    runner_     = require('./runner')
;    

var NODE_EXEC_PATH = '/usr/bin/';

// log('\n!!! RUN !!!', process.env.WSAGGER_SCRIPT_PATH, process.argv);

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
  process.env.WSAGGER_SCRIPT_PATH = process.argv[2].replace(/\/[^\/]*$/, '/');      

  var data     = lib.loadObject(process.argv[2]);
  var variants = lib.loadObject('/_variants.json');  

  scenario   = runner_.prepareScenario(data, variants, process.argv.slice(3));
}

var runner = runner_.initScenario(scenario, initNodeLibraries, debugMode, postFinish);

if (runner) runner._run(runner);


function postFinish (runner) {
  var isError = runner.isError;
  console.log('\n' + runner.id + (isError ? ' FAIL ???' : ' SUCCESS !!!'), isError);

  if (runner.inChain) {
    var opes = {}; runner_.storeData(runner, runner.dataOut, runner.parameters, opes)    
    console.log('\nFinishRunNode:\n', JSON.stringify(opes));
  
  } else {
    console.log('\nFinal!' );

  }

  process.exit(isError ? isError : 0);
}


////////////////////////////////////////////////////////////////////////

/*
function _debug() {
  // var data = Array.prototype.slice.call(arguments); [process.pid].concat(data)
  
  console.log('\n', process.pid); 
  console.log.apply(console, arguments); 

}
*/

function initNodeLibraries (runner, debugMode) {
  runner.error  = console.error;
  runner.log    = console.log; 
  runner.debug  = (debugMode ? console.log : () => {});

  if ('doer.ipc'       in runner.parameters) runner.parameters['doer.ipc']       = new ipc_();
  if ('doer.load'      in runner.parameters) runner.parameters['doer.load']      = new load_();
  if ('doer.call'      in runner.parameters) runner.parameters['doer.call']      = new call_();
  if ('doer.exec'      in runner.parameters) runner.parameters['doer.exec']      = new exec_();
  if ('doer.http_'     in runner.parameters) runner.parameters['doer.http_']     = new http_();
  if ('doer.http'      in runner.parameters) runner.parameters['doer.http']      = new http_('http');
  if ('doer.https'     in runner.parameters) runner.parameters['doer.https']     = new http_('https');
  if ('doer.socket_io' in runner.parameters) runner.parameters['doer.socket_io'] = new socket_io_();
}

// function consoleLog() {
//   console.log.apply(console, [' '].concat(Array.prototype.slice.call(arguments)))
// }


function load_() {
  this.loadJSON = loadJSON;
  this.loadFile = loadFile;
  return this;
  
  function loadJSON(runner, step, filename_, expected) {
    var filename = process.env.WSAGGER_SCRIPT_PATH + '/' + filename_;
    runner.debug('\n' + runner.id + ' out --> ' + step.action + ':', filename);

    try {     
      var data_ = fs.readFileSync(filename)
      var data  = JSON.parse(data_);  
      
      runner._callback(runner, step, data, expected);

    } catch (err) {
      runner._callback(runner, step, undefined, expected, err);
    
    }
  }

  function loadFile(runner, step, filename_, encoding, expected) {
    var filename = process.env.WSAGGER_SCRIPT_PATH + '/' + filename_;
    runner.debug('\n' + runner.id + ' out --> ' + step.action + ':', filename);

    try {     
      var data;     
      if (encoding === 'JSON') {
        var data_ = fs.readFileSync(filename)
        data  = JSON.parse(data_);  
      
      } else {
        data = fs.readFileSync(filename, (encoding ? encoding : null));

      }
      runner._callback(runner, step, data, expected);

    } catch (err) {
      runner._callback(runner, step, undefined, expected, err);
    
    }
  }

}


function call_() {
  this.callWsagger     = callWsagger;
  this.callWsaggerFile = callWsaggerFile;
  return this;
  
  function callWsagger(runner, step, data, expected, fromFile) {
    // runner._callback(runner, step, undefined, undefined, 1);
    // return;

    data = array_(data);
     
    var wsagger_ = data.shift();
    try {
      var wsaggerScript;
      if (fromFile) {
         var filename = process.env.WSAGGER_SCRIPT_PATH + '/' + wsagger_;

         runner.debug('\nfrom file <-- :', filename);    
         var wsaggerScript_ = fs.readFileSync(filename, { encoding: "utf8"});
         wsaggerScript = JSON.parse(wsaggerScript_);

      } else {
         wsaggerScript = wsagger_;
      
      }

    } catch (err) {
      runner._callback(runner, step, undefined, expected, err);
    
    }

    try {
      data = runner_.setParameters(data, runner.parameters);
      runner.debug('\n' + runner.id + ' out --> ' + step.action + ':', wsaggerScript, data);    
     
      var scenario = runner_.prepareScenarioInCall(wsaggerScript, data);    
      var runner1  = runner_.initScenario(scenario, initNodeLibraries, debugMode, (_runner1) => {
        if (_runner1.isError) {
          runner._finish(runner, false);

        } else {
          runner._callback(runner, step, _runner1.parameters, expected);

        }
      
      });
      
      if (runner1) runner1._run(runner1);

    } catch (err) {
      runner._callback(runner, step, undefined, expected, err);
    
    }
  }

  function callWsaggerFile(runner, step, data, expected) { 
    callWsagger(runner, step, data, expected, true); 
  }

}


function exec_() {
  var exec = this;

  exec.node_     = require ('child_process'); 
  exec.execSync  = execSync;
  exec.execAsync = execAsync;
  return exec;

  function processStdio(label, runner, step, stdout, stderr, expected, err) {


    var r = stdout.match(/([^\n]*)\n$/), data_;
    
    if (r) {
      try          { data_ = [object_(jsonlint.parse(r[1])), stdout.substr(0, stdout.length - r[0].length - 1)]; }
      catch (err1) { data_ = [undefined, stdout, err1]; }
    
    } else {
      data_ = [undefined, stdout];
    
    } 

    runner.debug(label + ' (data):', data_[1]); 
    
    if (err)      runner.error('/' + label + ' (err):',                err);      
    
    if (stderr)   runner.error('/' + label + ' (stderr):',             stderr);      
    if (data_[2]) runner.error('/' + label + ' (stdout parsing err):', data_[2]);      
    
    runner._callback(runner, step, data_[0], expected, err);
  } 

 
  function exec_(runner, step, data, expected, async) {   
    var parameters = {}; for (var k in runner.parameters) { if (k.substr(0,5) !== 'doer.') parameters[k] = runner.parameters[k]; }

    var scenario = JSON.stringify({ parameters: parameters, data: array_(data)}).replace(/"/g, '\\"');
      
    var command = ' WSAGGER_SCRIPT_PATH=' + process.env.WSAGGER_SCRIPT_PATH 
                + ' ' + NODE_EXEC_PATH + 'node lib/run.js --chain' 
                + (debugMode ? ' --debug' : '') 
                + ' "' + scenario + '"'
    ;

    runner.debug('\n' + runner.id + ' out --> ' + step.action + ':', command);

    if (async) {
      runner.numWorkers++;
      var child = exec.node_.exec(
        command, 
        (err, stdout, stderr) => { runner.numWorkers--; processStdio('execAsync', runner, step, stdout, stderr, expected, err); }
      );

    } else {
      try {
        var stdout = exec.node_.execSync(command, {encoding: 'utf8'});
        processStdio('execSync', runner, step, stdout, undefined, expected);
         
      } catch (err) {
        processStdio('execSync', runner, step, err.output[1].toString(), err.output[2].toString(), expected, (err.status || 1));

      }   
    }
  }

  function execSync(runner, step, data, expected) { exec_(runner, step, data, expected, false); }  

  function execAsync(runner, step, data, expected) { exec_(runner, step, data, expected, true); }  
}


function http_(proto) {

  var http_ = this;

  init(proto);  
  http_.request = request;
  return http_; 

  function init(proto) {
     if (proto === 'https') { http_.node_ = require(http_.proto = 'https'); } 
     else if (proto)        { http_.node_ = require(http_.proto = 'http');  }
  }

  function request(runner, step, data_, expected) {
    data_ = array_(data_);
    if (!this.node_) { init(data_.shift()); }
    var data = object_(data_.shift());

    var headers = data.headers; headers['User-Agent'] = 'wsagger';
    var options = {
      'method':   data.method,
      'hostname': data.host,
      'path':     data.path,
      'headers':  headers
    };

    if (data.port)             { options.port = data.port; }               // default corresponding to this.proto ???
    if (http_.proto == 'https') { options.rejectUnauthorized = false; }
    
    if ((!data.queryData) && data.queryData_) {

      if (!options.headers['Content-Type']) { options.headers['Content-Type'] = ''; }

      if (typeof data.queryData_ !== 'object') {
        data.queryData = data.queryData_;
      
      } else if (options.headers['Content-Type'].indexOf('application/x-www-form-urlencoded') >= 0) {
        data.queryData = querystring.stringify(data.queryData_);
      
      } else {
        data.queryData = JSON.stringify(data.queryData_);
        if (options.headers['Content-Type'].indexOf('application/json') < 0) { options.headers['Content-Type'] = 'application/json'; }

      }
    }

    runner.debug('\n' + runner.id + ' out --> ' + step.action + ':', http_.proto, '\n', options, '\n', data.queryData);

    var req = http_.node_.request(options, (res) => {
      var responseData = '';
      res.setEncoding('utf8');
      res.on('error', (err)   => { runner._callback(runner, step, undefined, expected, ['/http: ', err]); });
      res.on('data',  (chunk) => { responseData += chunk; });
      res.on('end',   ()      => {
        
        // log(res.headers);
        var data = { status: res.status, headers: res.headers, body: responseData };

        if (res.headers['content-type'] && (res.headers['content-type'].indexOf('application/json') >= 0)) {  
           try         { data.parsed = JSON.parse(responseData); runner._callback(runner, step, data, expected); }
           catch (err) { runner._callback(runner, step, data, expected, ['/http (bad response): ', responseData, err]); }          
        
        } else if (res.headers['content-type'] && (res.headers['content-type'].indexOf('application/x-www-form-urlencoded') >= 0)) {  
           data.parsed = querystring.parse(responseData);
           runner._callback(runner, step, data, expected);       

        } else {
           runner._callback(runner, step, data, expected);         

        }
      
      });
    });
    req.end(string_(data.queryData), 'utf8');
  }
}

function initAsync(doer, runner, step, data, expected) {
  runner.debug('\n' + runner.id + ' out --> ' + step.action + ':', data);    
  doer.runner   = runner;    
  doer.expected = expected;        
  doer.stepNum  = step.num;
}

function socket_io_() {

  var socket_io     = this;

  socket_io.node_   = require ('socket.io-client'); 
  socket_io.connect = connect;
  socket_io.emit    = emit;
  socket_io.expect  = expect;
  socket_io.name    = 'socket_io';

  return socket_io;
  
  function connect(runner, step, data, expected) {
    initAsync(socket_io, runner, step, data, expected);   
    socket_io.socket = socket_io.node_(data.url, data.query);

    if (socket_io.socket && firstConnect) { 
      firstConnect = false;
      var onevent = socket_io.socket.onevent;
      socket_io.socket.onevent = function (packet) {
        var args = packet.data || [];
        onevent.call (this, packet);      // original call
        packet.data = ["*"].concat([socket_io]).concat(args); //  
        onevent.call (this, packet);      // additional call to catch-all
      };
      socket_io.socket.on ("*", onInputEvent);
    }
  }

  function emit(runner, step, data, expected) {
    initAsync(socket_io, runner, step, data, expected);   
    socket_io.socket.emit.apply(socket_io.socket, data);
  }

  function expect(runner, step, data, expected) {
    initAsync(socket_io, runner, step, data, expected);   
  }
}


function ipc_() {
  var ipc    = this;
  ipc.node_  = require ('node-ipc'); 

  ipc.serve  = serve;
  ipc.send   = send;
  ipc.expect = expect;
  ipc.name   = 'ipc';

  return ipc;

  function serve(runner, step, data, expected) {
    initAsync(ipc, runner, step, data, expected);   

    ipc.node_.config.id    = array_(data)[0];
    ipc.node_.config.retry = 1500;
    ipc.node_.serve(() => {});
    ipc.node_.server.start();

    ipc.node_.server.on('message', (data, socket) => {
       try         { data = JSON.parse(data); } 
       catch (err) { data = {data_: data, error: err}; }
       onInputEvent(ipc, 'message', data);
    });

  }

  function send(runner, step, data, expected) {
    initAsync(ipc, runner, step, data, expected);   

    data = array_(data);
    
    var serverId = data[0];
    var message  = object_(data[1]);
    ipc.node_.connectTo(serverId, () => { 
      ipc.node_.of[serverId].emit('message', JSON.stringify(message));
      // ipc.node_.disconnect(serverId);
    });   
  }    

  function expect(runner, step, data, expected) {
    initAsync(ipc, runner, step, data, expected);   
  }
}


function onInputEvent(doer, event, data) {  // 
  var runner = doer.runner;
  runner.debug('\n' + runner.id + ' <-- in: ' + doer.name, event, JSON.stringify (data));
    
  if (doer.expected instanceof Array) {
    for (var i=-1; ++i < doer.expected.length;) {

      if (runner_.checkData([event, data], doer.expected[i], runner.parameters)) {
        doer.expected.splice(i, 1);
        runner.debug('onInputEvent: expected! ' + doer.expected.length + ' remains');
        break;

      } else {
        runner.debug('onInputEvent: checkData failed???', doer.expected[i]);
      }
    }

    if (doer.expected.length < 1) {
      runner.debug('onInputEvent: all expected is received!');

      if (runner.haveToWait[doer.stepNum]) {
        clearTimeout(runner.haveToWait[doer.stepNum]);
        delete runner.haveToWait[doer.stepNum];     
      }

      runner._run(runner);
    }
   
  } else {
    runner.debug('onInputEvent: no expectations', doer.expected);

  }
}


// !!! w 2_send_message.wsagger.json loc pavlo --debug | tee aaa.txt

