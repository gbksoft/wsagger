if (typeof exports !== 'undefined') {
  (require('fundamentum'))('array_', 'object_', 'log', 'error');
  exports.initScenario    = initScenario;
  exports.prepareScenario = prepareScenario;
}

function doer_(step) {  
  if (step && (step instanceof Object) && (typeof step.action === 'string')) {
    var dot = step.action.indexOf('.');
    return (dot < 0) ? [step.action, undefined] : [step.action.substr(0, dot), step.action.substr(dot + 1)];
  }
}

function prepareScenario(data, scenarioNum, server, user, addFormData) {
  data = object_(data);

  var scenario = {parameters: {}};

  var s_ = array_(data.scenarios);
  if (s_[scenarioNum] && (typeof s_[scenarioNum] === 'object') && s_[scenarioNum].flow) {
    scenario.flow  = array_(s_[scenarioNum].flow);
    scenario.doers = {};
    
    for (var step of scenario.flow) {
      var doer = doer_(step);
      if (doer) scenario.doers[doer[0]] = undefined;
    }


    var REST_  = object_(data.REST_);      
    if (REST_[server] && (REST_[server] instanceof Object)) {
      for (var k of ['proto', 'host', 'port', 'path']) scenario.parameters['REST.' + k] = REST_[server][k];
    } else if (data.REST_) {
      error('??? REST', REST_, server); 
    }

    var server_  = object_(data.server_);
    if (server_[server] && (server_[server] instanceof Object)) {
      for (var k of ['proto', 'host', 'port', 'path']) scenario.parameters['server.' + k] = server_[server][k];
    } else if (data.server_) {
      error('??? server', server_, server); 
    }

    var user_ = object_(data.user_);
    if (user_[user] && (user_[user] instanceof Object)) {
      for (var k of ['username', 'password', 'id']) scenario.parameters['user.' + k] = user_[user][k];
    } else if (data.user_) {
      error('??? user', user_, user); 
    }

    if (s_[scenarioNum].parameters instanceof Array) {
      for (var p of s_[scenarioNum].parameters) {
        if (p.name == undefined) { 
          continue; 
        
        } else if (p.in == 'formData') {
          if (addFormData) {
          
          } 

        } else if ('in' in p) { 
          scenario.parameters[p.name] = p.in; 
          
        } else if ('default_in' in p) { 
          scenario.parameters[p.name] = p.default_in; 
        
        }
      }
    }
  }
  
  return scenario;
}


function initScenario (scenario, initLibraries, debugMode) { 

  var runner = scenario;
  
  runner.parameters = object_(runner.parameters);  
  runner.doers      = object_(runner.doers);  
  runner.flow       = array_(runner.flow);  
  
  if (initLibraries) initLibraries(runner, debugMode);
  
  runner._run          = runScenario; 
  runner._callback     = callbackScenario;  
  if (!runner._finish) runner._finish = (() => {});
  
  runner.debugMode    = debugMode;
  runner.haveToWait   = false;  
  runner.isError      = false;
  runner.stepNum      = 0;
  runner.numWorkers   = 1;
  // runner.haveToWait - JS timeout
  
 
  return runner;
}

function runScenario(runner) {
  if (runner.haveToWait) {
    error('\n/runScenario: runner.haveToWait', runner); 
    return;
  }

  var step;
  while (step = runner.flow.shift()) {
    log ("\nSTEP ", ++runner.stepNum, '\n', step, '\n');

    doStep(runner, step);
    if (runner.haveToWait) return;
  }

  finishScenario(runner, true);
}

function doStep(runner, step) {

  step = object_(step);

  if (step.waitForResponse)         { step.wait = step.waitForResponse;    delete step.waitForResponse; }
  if (step.wait && step.wait.data ) { step.wait.expected = step.wait.data; delete step.wait.data; }

  if (step.wait) {
    if (step.wait.expected) {
      runner.waitingFor = setParameters(step.wait.expected, runner.parameters);

    } else {
      waitingFor = [];

    }
    // !!! show message

    runner.haveToWait = setTimeout(function () { stopWaiting(runner); }, step.wait.delay);
    
  }
  
  if (step.action) {
    var data = array_(setParameters(step.data, runner.parameters));
   
    var doer = doer_(step);

    log (data);

    if (doer && runner.doers[doer[0]]) {
      if (doer[1]) {
        var action = runner.doers[doer[0]][doer[1]];
        action.apply(runner.doers[doer[0]], [runner].concat(data));
    
      } else {
        runner.doers[doer[0]].apply([runner].concat(data));

      }
    } 
  
    // !!! show message

    /*
    showMessage(
       '--> out : ' + (step.action ? step.action + ' / ' + str_(step.data) : '')
       + (step.wait ? ' : wait : ' + JSON.stringify(step.wait) : ''),
       'socketLog',
       'brown');
    */
  }
}

function callbackScenario(runner, data, err) {
  if (err) {
    runner.error(err);
    runner._finish(runner);
    
  } else {
    delete runner.haveToWait; 
    
    // !!! check expected
    
    runner.run(runner); 
  }
}

function waitResults(runner, data) {

}

function stopWaiting(runner) {

}

function finishScenario(runner, error, stdout, stderr) {
   --runner.numWorkers; if (error) runner.IsError = error;

   if (!runner.numWorkers) {
      log(runner.error ? '??? FAIL ???' : '!!! SUCCESS !!!');
      if (runner.parameters._finish) runner.parameters._finish(runner);
   }
}


function setParameters(data, parameters) {
   if (typeof data === 'string') {
      if ((data.substr(0, 2) == '{{') && (data.substr(-2) == '}}')) {
         var key = data.substr(2, data.length - 4);
         if (key in parameters) data = parameters[key];

      } else {
         // for (var key in parameters) data = data.replace(new RegExp('{{' + key + '}}', 'g'), str_ (parameters[key]));
         for (var key in parameters) data = data.replace(new RegExp('{{' + key + '}}', 'g'),         parameters[key]);
      }

   } else if (data instanceof Array) {
      for (var i=-1; ++i < data.length;) {
         data[i] = setParameters(data[i], parameters);
      }

   } else if (data instanceof Object) {
      for (var i in data) {
         data[i] = setParameters(data[i], parameters);
      }

   }
   return data;
}

function checkData(data, proto, parameters) {
   var checked = true;
   if (typeof proto === 'string') {
      var r = proto.match(/^\{\{!(.*?)\}\}$/);
      if (r)                   { parameters[r[1]] = data; }
      else if (data !== proto) { checked = false; }

   } else if (proto instanceof Array) {
      if ((data instanceof Array) && (data.length >= proto.length)) {
         for (var i=-1; ++i < proto.length;) {
            if (!checkData(data[i], proto[i], parameters)) checked = false;
         }

      } else {
         checked = false;

      }

   } else if (proto instanceof Object) {
      if (data instanceof Object) {
         for (var i in proto) {
            if (!checkData(data[i], proto[i], parameters)) checked = false;
         }

      } else {
         checked = false;

      }

   } else if (data !== proto) {
      checked = false;

   }
   return checked;
}

function copia(data) {
   if (typeof data === 'string') {
      return '' + data;

   } else if (data instanceof Array) {
      return data.map((e) => {return copia(e); });

   } else if (data instanceof Object) {
      var data_ = {}; for (var i in data) data_[i] = copia(data[i]);
      return data_;

   }
   return data;
}





/*
function test() {
  var runner = {
    flow: [
      1,
      2,
      3
    ]  
  }  
  
  function run (runner, step) {
    runner.haveToWait = setTimeout(() => { 
      delete runner.haveToWait; 
      runner.runScenario(runner); 
    }, 2000);      
  }

  function callback (runner, success) {
    log(success ? '!!! SUCCESS !!!' : '??? FAIL ???');      
  }
  
  initScenario(runner, run, callback);
  runScenario(runner);
    
}

test();
*/

