var fs       = require ('fs'),
    execFile = require ('child_process').execFile;
  
var dataPath = process.argv[2];
var server   = process.argv[3] || 'loc';
var user     = process.argv[4] || '2';

var numSuccess = 0, numFail = 0, finished = {}, timeout;

var files = fs.readdirSync(dataPath).filter((f) => { return (f.substr(-13) === '.wsagger.json'); });

console.log(files);

rundataFile();

function rundataFile() {

   if (files.length) {
      var dataFile = files.shift();
      if (fs.statSync(dataPath + '/' + dataFile).isFile()) {
         console.log(dataFile + '...');
         finished[dataFile] = '';
         var parameters = ['js/run.js', dataPath + '/' + dataFile, server, user]; 
         execFile('node', parameters, (error, stdout, stderr) => {
            finish(dataFile, error, stdout, stderr); 
         });
         timeout = setTimeout (rundataFile, 10000);
      }
   
   } else {
      var notFinished = Object.keys(finished).filter((k) => { return !finished[k]; });
      console.log("numSuccess: " + numSuccess + "\nnumFail: " + numFail + (notFinished.length ? ("\nnotFinished: ", notFinished) : '')); 
      process.exit(); 
   }
}

function finish (dataFile, error, stdout, stderr) {              // result, flowOrigin, flow, waitingFor
   finished[dataFile] = 1;
   if (error) {
      ++numFail;
      console.log(dataFile + ': FAIL???\n');

   } else {
      ++numSuccess;
      console.log(dataFile + ': SUCCESS!!!\n');

   }  
   clearTimeout(timeout);
   rundataFile();
}


