(require('fundamentum'))('array_', 'object_', 'log', 'error');

log('!!! RUN !!!');

var fs          = require ('fs'),
  io            = require ('socket.io-client'),
  child_process = require ('child_process'),
  rest          = require ('./rest'),
  runner        = require ('./runner'),
  runner_logics = require ('./runner_logics')
  // traceback  = require ('traceback')
;

var debug = false;
for (var i = process.argv.length; --i > 1 ;) {
  if (process.argv[i] == '--debug') {
    debug = true;
    process.argv.splice(i, 1);
  }
}

var dataFile    = process.argv[2];
var server      = process.argv[3] || 'loc';
var user        = process.argv[4] || '2';
var worker      = process.argv[5];
var scenarioNum = 0;

var isFile;

try {
  isFile = fs.statSync(dataFile).isFile();
  if (!isFile) {
    console.log('NOT A FILE: ' + dataFile);
    process.exit();
  }

} catch (err) {
  console.log('NOT A FILE: ' + dataFile, err);
  process.exit();

}

var data    = JSON.parse(fs.readFileSync(dataFile));
var tryData = prepareData(data);

if (debug) {
  runner.bootstrap (io, rest.tryLogin, tryData, capture,    capture,    capture,    capture,    rest.tryLoginCID);

} else {
  runner.bootstrap (io, rest.tryLogin, tryData, captureNot, captureNot, captureNot, captureNot, rest.tryLoginCID);

}

var variants = {
  REST  : data.REST_,
  server: data.server_,
  user  : data.user_
}

var selected = {
  REST:   server,
  server: server,
  user:   user
}

var scenarioNum = 0;
var flow_       = runner.divideFlow (tryData.data[0]);
var workers     = Object.keys(flow_).map((worker) => {return (worker == undefined) ? '0' : worker;}).sort((a,b) => {return a < b ? -1 : 1;});
var numWorkers  = workers.length;

// !!!     zero worker must be final
// !!!     var workers = []; for (var worker in flow_) { if (worker) workers.push(worker); }
// !!!     if (0 in flow_) workers.push(0);

var success     = true;

if ((worker != undefined) || numWorkers < 2) {
  numWorkers = 1; 
  runner.tryScenario (variants, selected, tryData.parameters[scenarioNum], scenarioNum, ((worker == undefined) ? '0' : worker), finishAll);

} else {
  var scenario = {
    flow: workers.map((worker) => { return {data: 'node js/run.js ' + process.argv.slice(2,5).concat([worker]).join(' ') + (debug ? ' --debug' : '')};})
  };


  runner_logics.initScenario(scenario, runExec, finishAll);
  runner_logics.runScenario(scenario);
}


function runExec(scenario, step) {
  scenario.haveToWait = true;
   
  log('runExec: ', scenario);
  
  child_process.exec(step.data, (err, stdout, stderr) => { 
    log(stdout);
    if (err) {
      error(err, stderr);
      scenario.callback(scenario, err, stdout, stderr);
    
    } else {
      delete scenario.haveToWait; 
      log(22222222222222);
      scenario.runScenario(scenario); 
    }
  });
}


function finishAll (scenario, error, stdout, stderr) {
   // console.log(traceback());

   --numWorkers; if (error) success = false;

   if (!numWorkers) {
      console.log(success ? '!!! SUCCESS !!!' : '??? FAIL ???');
      process.exit(success ? 0 : 1);
   }
}



function capture () {
   console.log.apply (console, arguments);
}


function captureNot () {
}


function prepareParameters(parameters_) {
   var parameters = {};
   for (var p of parameters_) {
      if      (p.in != 'formData') { parameters[p.name] = p.in; }
      else if ('default_in' in p)  { parameters[p.name] = p.default_in; }
   }
   return parameters;
}

function prepareData(data) {

   var tryData = {data: {}, parameters: {}};

   data.scenarios.forEach(function(s, scenarioNum){
      tryData.parameters[scenarioNum] = prepareParameters(s.parameters);
      tryData.data[scenarioNum]       = s.flow;
   });

   return tryData;
}


