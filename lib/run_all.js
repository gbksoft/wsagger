let fs            = require ('fs'),
    child_process = require ('child_process');
  
let dataPath   = process.argv[2],
    numSuccess = 0, 
    numFail    = 0, 
    finished = {}, 
    timeout
;

let files = fs.readdirSync(dataPath).filter((f) => { return (f.substr(-13) === '.wsagger.json'); });

// console.log(files);

rundataFile();

function rundataFile() {

   if (files.length) {
      var dataFile = files.shift();
      if (fs.statSync(dataPath + '/' + dataFile).isFile()) {
         console.log(dataFile + '...');
         finished[dataFile] = '';
         
         // var parameters = ['lib/run.js', dataPath + '/' + dataFile, server, user]; 
         // child_process.execFile('node', parameters, (error, stdout, stderr) => { finish(dataFile, error, stdout, stderr); });
         
         var command = 'node lib/run.js ' + dataPath + '/' + dataFile + ' ' + process.argv.slice(2).join(' '); 

         child_process.exec(command, (error, stdout, stderr) => { finish(dataFile, error, stdout, stderr); });

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


