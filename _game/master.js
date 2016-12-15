var child_process  = require ('child_process'); 

try {
   var stdout = child_process.execSync('/usr/bin/node slave.js');
   console.log(22222, stdout);

} catch (err) {
   console.log(33333, err.status, err.output[1].toString(), err.output[2].toString());

}