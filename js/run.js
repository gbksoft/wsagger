var fs            = require ('fs'),
    io            = require ('socket.io-client'),
    child_process = require ('child_process'),
    rest          = require ('../js/rest'),
    runner        = require ('../js/runner');
  
var dataFile    = process.argv[2];
var server      = process.argv[3] || 'loc';
var user        = process.argv[4] || '2';
var worker      = process.argv[5] || '';
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

runner.bootstrap (io, rest.tryLogin, tryData, true, captureNot, capture, captureNot);

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


var success = true, numWorkers;

if (worker) {
   numWorkers = 1;
   runner.tryScenario (variants, selected, parameters, 0, worker, finish);

} else {
   var flow_ = runner.divideFlow (tryData.data[0]);
   numWorkers = Object.keys(flow_).length;
   if (numWorkers >= 1) {
      var workers = []; for (var worker in flow_) { if (worker) workers.push(worker); }
      if (0 in flow_) workers.push(0); 

      for (var i = -1; ++i < workers.length;) {
         if (i < workers.length - 1) {
            // var parameters = ['js/run.js'].concat(process.argv.slice(2,5)).concat([workers[i]]); 
            // child_process.execFile('node', parameters, (error, stdout, stderr) => { finish(!error, 'fron execFile:', stdout); });
            
            var command = 'node js/run.js ' + process.argv.slice(2,5).concat([workers[i]]).join(' '); 
            child_process.exec(command, (error, stdout, stderr) => { finish(dataFile, error, stdout, stderr); });

         } else {
            runner.tryScenario (variants, selected, tryData.parameters[scenarioNum], scenarioNum, worker, finish);

         }
      }
   } else {
	   
   }
} 


function capture () {
   console.log.apply (console, arguments);
}   


function captureNot () {
}   


function finish () {              
   --numWorkers; if (!arguments[0]) success = false;
   
   if (!numWorkers) {
      console.log(success ? '!!! SUCCESS !!!' : '??? FAIL ???');
      process.exit(success ? 0 : 1);
   }
}


function prepareParameters(parameters_) {
   var parameters = {};   
   for (var p of parameters_) {
      if      (p.in != 'formData') { parameters[p.name] = p.in; } 
      else if ('default_in' in p)  { parameters[p.name] = p.default_in; } 
   }
   return parameters;
}

function prepareData (data) {

   var tryData = {data: {}, parameters: {}};

   data.scenarios.forEach(function(s, scenarioNum){   
      tryData.parameters[scenarioNum] = prepareParameters(s.parameters);
      tryData.data[scenarioNum]       = s.flow;
   });

   return tryData;
}   
