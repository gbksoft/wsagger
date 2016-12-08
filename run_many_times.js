(require('fundamentum'))('array_', 'object_', 'log', 'error', 'string_');

"use strict";

/////////////////////////////////////////////////////////////////////////

let child_process       = require ('child_process'); 

let NODE_EXEC_PATH      = '/usr/bin/node';
let SCRIPT_PATH         = 'lib/run.js';
let WSAGGER_SCRIPT_PATH = '_game/get_users_online.wsagger.json';
let serverId            = 'loc';
let userId              = '59';
      
var command = NODE_EXEC_PATH + ' ' + SCRIPT_PATH + ' ' + WSAGGER_SCRIPT_PATH + ' ' + serverId + ' ' + userId + ' --debug'

var numWorkers = 0, numSuccess = 0, numFail = 0;

for (let i=-1; ++i < process.argv[2];) {

  ++numWorkers;
  child_process.exec(
    command, 
    (err, stdout, stderr) => { 
      --numWorkers; 
      if (err) { 
    	  ++numFail; 
        console.log(stdout, stderr);

      } else { 
    	  ++numSuccess; 

      }

      if (numWorkers <= 0) { finish(); }
    }
  );

}

setInterval(finish, 5000);

function finish() {
  console.log("not finished: " + numWorkers + "\tsuccesses: " + numSuccess + "\tfails: " + numFail) ;
}

