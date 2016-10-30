var fs       = require ('fs'),
    io       = require ('socket.io-client'),
    runner   = require ('./js/runner');
    
var dataFile = process.argv[2] ? process.argv[2] : '_chat/wsagger.json';
var data     = JSON.parse (fs.readFileSync (dataFile));
var exitus   = [];

console.log('DATA IS READED: ' + dataFile);

runner.bootstrap (io, prepareData(data), capture, capture, capture, capture);
runner.tryScenario (0, 0);


function capture () {
   console.log (arguments);
   // exitus.push (arguments);
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