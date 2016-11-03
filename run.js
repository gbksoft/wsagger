var fs       = require ('fs'),
    io       = require ('socket.io-client'),
    execFile = require ('child_process').execFile,
    runner   = require ('./js/runner');
  
var dataFile = process.argv[2];
var server   = process.argv[3] || 'loc';
var user     = process.argv[4] || '2';
var worker   = process.argv[5] || '';

var data     = JSON.parse (fs.readFileSync (dataFile));

// console.log('DATA IS READED: ' + dataFile);

var tryData = prepareData(data);

runner.bootstrap (io, tryData, captureNot, captureNot, capture, captureNot);

var variants = {
   server: data.server_,
   user  : data.user_
}


var selected = {
   server: server, 
   user: user 
}


var success = true, numWorkers;

if (worker) {
   numWorkers = 1;
   runner.tryScenario (variants, selected, {}, 0, 0, worker, finish);

} else {
   var flow_ = runner.divideFlow (tryData[0].data[0]);
   numWorkers = Object.keys(flow_).length;
   if (numWorkers >= 1) {
      var workers = []; for (var worker in flow_) { if (worker) workers.push(worker); }
      if (0 in flow_) workers.push(0); 

      for (var i = -1; ++i < workers.length;) {
         if (i < workers.length - 1) {

            var parameters = ['run.js'].concat(process.argv.slice(2,5)).concat([workers[i]]); 
         
            execFile('node', parameters, (error, stdout, stderr) => {
               finish(!error, 'fron execFile:', stdout); 
            });

         } else {
            runner.tryScenario (variants, selected, {}, 0, 0, worker, finish);

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


function finish () {              // result, flowOrigin, flow, waitingFor
   --numWorkers; if (!arguments[0]) success = false;
   
   // console.log(arguments);
   
   if (!numWorkers) {
      console.log(success ? '!!! SUCCESS !!!' : '??? FAIL ???');
      process.exit(success ? 0 : 1);
   }
}


function prepareData (data) {

   var tryData = {};
   elem = data;
   dataNum = 0;

   tryData[dataNum] = {server: elem.server, data: {}};

   elem.scenarios.forEach(function(s, scenarioNum){   // for each in JSON/scenarios
      tryData[dataNum].data[scenarioNum] = s.flow;
   });

   return tryData;
}   
