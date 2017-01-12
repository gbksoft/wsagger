(require('fundamentum'))('array_', 'object_', 'log', 'error', 'string_');

////////////////////////////////////////

var fs          = require('fs'),
    querystring = require('querystring'),
    jsonlint    = require('jsonlint'),
    json        = require('comment-json'),
    lib         = require('./lib'),
    runner_     = require('./runner'),
    http_       = require('./http_')
    socket_io_  = require('./socket_io_')
;    

var NODE_EXEC_PATH = '/usr/bin/';

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

runner_.bootstrap(initNodeLibraries, debugMode);

var scenario;

if (inChain) {
  scenario = runner_.prepareScenarioInChain(JSON.parse(process.argv[2]));

} else {

  var scriptPath = string_(process.argv[2]).replace(/\/[^\/]*$/, '/'); 
  if ((scriptPath[0] === '/') || !process.env.WSAGGER_SCRIPT_PATH) {
    process.env.WSAGGER_SCRIPT_PATH = scriptPath;
  
  } else {
    process.env.WSAGGER_SCRIPT_PATH = string_(process.env.WSAGGER_SCRIPT_PATH); 
    var l = process.env.WSAGGER_SCRIPT_PATH.length;
    process.env.WSAGGER_SCRIPT_PATH += ((l && (process.env.WSAGGER_SCRIPT_PATH[l-1] !== '/')) ? '/' : '') + scriptPath;
  
  }

  // process.env.WSAGGER_SCRIPT_PATH = __dirname + '/';

  var data     = lib.loadObject(process.argv[2]);
  var variants = lib.loadObject(process.env.WSAGGER_SCRIPT_PATH + '/_variants.json');  
  scenario   = runner_.prepareScenario(data, variants, process.argv.slice(3));
}

var runner = runner_.initScenario(scenario, initNodeLibraries, debugMode, postFinish);

if (runner) runner._run(runner);


function postFinish (runner) {
  var isError = runner.isError;

  if (runner.inChain) {
    var opes = {}; runner_.storeData(runner, runner.dataOut, runner.context, opes)    
    console.log(JSON.stringify(opes));
  
  } else {
    console.log('\nAll finished: ' + (isError ? 'FAIL' : 'SUCCESS'));

  }

  process.exit(isError ? isError : 0);
}

function initNodeLibraries (runner, debugMode) {
  runner.error  = console.error;
  runner.log    = console.log; 
  runner.debug    = (debugMode ? console.log : () => {});
  runner.debugOut = runner.debug;
  runner.debugExp = runner.debug;

  if ('doer.ipc'       in runner.context) runner.context['doer.ipc']       = new ipc_();
  if ('doer.load'      in runner.context) runner.context['doer.load']      = new load_();
  if ('doer.call'      in runner.context) runner.context['doer.call']      = new runner_.call_();
  if ('doer.exec'      in runner.context) runner.context['doer.exec']      = new exec_();
  if ('doer.http_'     in runner.context) runner.context['doer.http_']     = new http_.connect_();
  if ('doer.http'      in runner.context) runner.context['doer.http']      = new http_.connect_('http');
  if ('doer.https'     in runner.context) runner.context['doer.https']     = new http_.connect_('https');
  if ('doer.socket_io' in runner.context) runner.context['doer.socket_io'] = new socket_io_.connect_();
}

////////////////////////////////////////////////////////////////////////


function load_() {
  this.loadJSON = loadJSON;
  this.loadFile = loadFile;
  return this;
  
  function loadJSON(runner, step, filename_, expected) {
    var filename = process.env.WSAGGER_SCRIPT_PATH + '/' + filename_;
    runner.debugOut('\n' + runner.id + ' out --> ' + step.action + ':\n', filename);

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
    runner.debugOut('\n' + runner.id + ' out --> ' + step.action + ':\n', filename);

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
    var context = {}; for (var k in runner.context) { if (k.substr(0,5) !== 'doer.') context[k] = runner.context[k]; }

    var scenario = JSON.stringify({ context: context, data: array_(data)}).replace(/"/g, '\\"');
      
    var command = ' WSAGGER_SCRIPT_PATH=' + process.env.WSAGGER_SCRIPT_PATH 
                + ' ' + NODE_EXEC_PATH + 'node lib/run.js --chain' 
                + (debugMode ? ' --debug' : '') 
                + ' "' + scenario + '"'
    ;

    runner.debugOut('\n' + runner.id + ' out --> ' + step.action + ':\n', command);

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


function ipc_() {
  var ipc    = this;
  ipc.node_  = require ('node-ipc'); 

  ipc.serve  = serve;
  ipc.send   = send;
  ipc.expect = expect;
  ipc.name   = 'ipc';

  return ipc;

  function serve(runner, step, data, expected) {
    runner_.initAsync(ipc, runner, step, data, expected);   

    ipc.node_.config.id    = array_(data)[0];
    ipc.node_.config.retry = 1500;
    ipc.node_.serve(() => {});
    ipc.node_.server.start();

    ipc.node_.server.on('message', (data, socket) => {
       try         { data = JSON.parse(data); } 
       catch (err) { data = {data_: data, error: err}; }
       runner_.onInputEvent(ipc, 'message', data);
    });

  }

  function send(runner, step, data, expected) {
    runner_.initAsync(ipc, runner, step, data, expected);   

    data = array_(data);
    
    var serverId = data[0];
    var message  = object_(data[1]);
    ipc.node_.connectTo(serverId, () => { 
      ipc.node_.of[serverId].emit('message', JSON.stringify(message));
      // ipc.node_.disconnect(serverId);
    });   
  }    

  function expect(runner, step, data, expected) {
    runner_.initAsync(ipc, runner, step, data, expected);   
  }
}


