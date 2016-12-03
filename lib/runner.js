if (typeof exports !== 'undefined') {
  (require('fundamentum'))('array_', 'object_', 'log', 'error');
  exports.setParameters          = setParameters;
  exports.initScenario           = initScenario;
  exports.prepareDoers           = prepareDoers;
  exports.prepareScenario        = prepareScenario;
  exports.prepareScenarioInCall  = prepareScenarioInCall;
  exports.prepareScenarioInChain = prepareScenarioInChain;
  exports.checkData              = checkData;
}


/// preparation /////////////////////////////////////////////////////////////////////////////////////////////

function doer_(step) {  
  if (step && (typeof step == 'object') && (typeof step.action === 'string')) {
    var dot = step.action.indexOf('.');
    return (dot < 0) ? [step.action, undefined] : [step.action.substr(0, dot), step.action.substr(dot + 1)];
  }
}

function prepareDoers(scenario) {
  scenario.doers = {};    
  for (var step of scenario.data) {
    var doer = doer_(step);
    if (doer) scenario.parameters['doer.' + doer[0]] = undefined;
  }
}  

function prepareScenarioInChain(scenario) {
  log('prepareScenarioInChain...');

  scenario            = object_(scenario);
  scenario.data       = array_(scenario[scenario.flow ? 'flow' : 'data']);    

  scenario.inChain    = true;
  scenario.parameters = object_(scenario.parameters);

  prepareDoers(scenario);
  if (!('dataOut' in scenario) && scenario.data.length) scenario.dataOut = scenario.data[scenario.data.length - 1].dataOut;

  return scenario;
}


function prepareScenarioInCall(scenario, data) {
  log('prepareScenarioInCall...');

  scenario      = object_(scenario);
  scenario.data = array_(scenario[scenario.flow ? 'flow' : 'data']);    

  scenario.parameters = {};
  data                = array_(data);
  var keysIn          = array_(scenario.keysIn);

  for (var i = -1; ++i < keysIn.length;) scenario.parameters[keysIn[i]] = data[i];  

  prepareDoers(scenario);
  if (!('dataOut' in scenario) && scenario.data.length) scenario.dataOut = scenario.data[scenario.data.length - 1].dataOut;

  return scenario;
}  

function prepareScenario(scenario, variants, server, user, addFormData) {
  log('prepareScenario...');

  scenario      = object_(scenario);
  scenario.data = array_(scenario[scenario.flow ? 'flow' : 'data']);    

  variants = object_(variants);
  scenario.parameters = {};
  if (server) {
    var REST_  = object_(variants.REST_);      
    if (REST_[server] && (typeof REST_[server] === 'object')) {
      for (var k of ['proto', 'host', 'port', 'path']) scenario.parameters['REST.' + k] = REST_[server][k];
    } else {
      error('??? REST', REST_, server); 
    }

    var server_  = object_(variants.server_);
    if (server_[server] && (typeof server_[server] === 'object')) {
      for (var k of ['proto', 'host', 'port', 'path']) scenario.parameters['server.' + k] = server_[server][k];
    } else {
      error('??? server', server_, server); 
    }
  }

  if (user) { 
    var user_ = object_(variants.user_);
    if (user_[user] && (typeof user_[user] === 'object')) {
      for (var k of ['username', 'password', 'id']) scenario.parameters['user.' + k] = user_[user][k];
    } else {
      error('??? user', user_, user); 
    }
  }

  if (scenario.parameters_ instanceof Array) {
    for (var p of scenario.parameters_) {
      if (p.name == undefined) { 
        continue; 
        
      } else if (p.in == 'formData') {
        if (addFormData) { } 

      } else if ('in' in p) { 
        scenario.parameters[p.name] = p.in; 
          
      } else if ('default_in' in p) { 
        scenario.parameters[p.name] = p.default_in; 
        
      }
    }
  }

  prepareDoers(scenario);
  if (!('dataOut' in scenario) && scenario.data.length) scenario.dataOut = scenario.data[scenario.data.length - 1].dataOut;
  
  return scenario;
}

function initScenario (scenario, initLibraries, debugMode, callback) { 

  if (scenario) {
    log('initScenario...');

    var runner = scenario;
    runner.id = ((new Date()).getTime() + '').substr(7);
  
    runner.parameters = object_(runner.parameters);  

    if (initLibraries) initLibraries(runner, debugMode);
  
    runner._run         = _run; 
    runner._callback    = _callback;
    runner._finish      = _finish;  
    runner._postFinish  = callback;
  
    runner.debugMode    = debugMode;
    runner.haveToWait   = {};                        // JS timeout
    runner.isError      = false;
    runner.stepNum      = 0;
    runner.numWorkers   = 1;
    
    return runner;

  } else {
    log('/initScenario: no scenario...');

  }

}


function showP(runner) {
   for (var p in runner.parameters) {
    if (p.substr(0,5) != 'doer.') console.log(p + ': ', runner.parameters[p]);
   }
}

/// running /////////////////////////////////////////////////////////////////////////////////////////////


function _run(runner) {

  var step;
  while (step = runner.data.shift()) {
    step = object_(step);
    if (step.waitForResponse)             { step.wait     = step.waitForResponse; delete step.waitForResponse; }
    if (step.wait && step.wait.data )     { step.expected = step.wait.data;       delete step.wait.data; }
    if (step.wait && step.wait.expected ) { step.expected = step.wait.expected;   delete step.wait.expected; }

    runner.debug('\n' + runner.id + ' STEP ', (step.num = ++runner.stepNum), '\n\n', step);

    // showP(runner);

    var expected = setParameters(step.expected, runner.parameters);

    if (step.wait)      runner.haveToWait[step.num] = _stopWaiting(runner, step, expected, step.wait.delay,      step.num);
    if (step.waitAsync) runner.haveToWait[step.num] = _stopWaiting(runner, step, expected, step.waitAsync.delay, step.num);

    if (step.action) {
      var data = setParameters(step.data, runner.parameters);  

      var doer = doer_(step);
      if (doer && runner.parameters['doer.' + doer[0]]) {
        if (doer[1]) {
          var action = runner.parameters['doer.' + doer[0]][doer[1]];
          action.apply(runner.parameters['doer.' + doer[0]], [runner, step, data, expected] );
    
        } else {
          runner.parameters['doer.' + doer[0]].apply([runner, step, data, expected]);

        } 
      } 
    }  

    if (step.wait) return;
  }

  if (Object.keys(runner.haveToWait).length < 1) runner._finish(runner, true);
}
  
function _callback(runner, step, data, expected, err) {
  runner.debug('\n' + runner.id + ' <-- in ' + step.action + ':', data, typeof data, '\nfrom step:', step);
     
  if (step.dataOut != undefined) {

    if (step.dataOut instanceof Array) {
      if (data && (typeof data == 'object')) {
        

        for (var k of step.dataOut) {
          runner.debug('\n' + runner.id + ' store ', data[k], ' --> ', k);
          runner.parameters[k] = data[k]; 
        }
      }   

    } else if (step.dataOut && ((typeof step.dataOut) == 'object')) {
      if (data && (typeof data == 'object')) {
        for (var k in step.dataOut) {
          runner.debug('\n' + runner.id + ' store ', data[k], ' --> ', k);
          runner.parameters[k] = setParameters(step.dataOut[k], data); 
        }
      }
    

    } else {
      runner.debug('\n' + runner.id + ' store all data --> ', step.dataOut);
      runner.parameters[step.dataOut] = data; 
    }

  }

  if (runner.haveToWait[step.num]) {
    clearTimeout(runner.haveToWait[step.num]);
    delete runner.haveToWait[step.num]; 
  }

  if (runner.isError) {
    runner.error('\n' + runner.id + ' /runner.isError:', runner.isError);
    runner._finish(runner, false);
    
  } else if (err) {
    runner.error('\n' + runner.id + ' /_callback(...err):', (((typeof err === 'string') && err.length > (1000)) ? err.substr(0, 1000) + '...............' : err));
    runner._finish(runner, false);
    
  } else if (checkData(data, expected, runner.parameters)) {  
    runner._run(runner); 
    
  } else {
    runner.error('\n' + runner.id + ' unexpected data:', data, expected);
    runner._finish(runner, false);
    
  }
}

function _stopWaiting(runner, step, expected, delay, stepNum) {
  
    runner.debug('\n' + runner.id + ' setting wait timeout ' + stepNum);
  return setTimeout(
    () => { 
      runner.debug('\n' + runner.id + ' !!! wait timeout ' + stepNum + ' !!!!', expected);
      if (runner.haveToWait[stepNum]) {
        clearTimeout(runner.haveToWait[stepNum]);
        delete runner.haveToWait[stepNum]; 
      }

      if (!expected ||((expected instanceof Array) && (expected.length < 1))) {
        runner._run(runner); 
      
      } else {
        runner._finish(runner, false); 
      
      }  
    }, 
    delay
  );    
}


function _finish(runner, success) {
  if (success) {
    if (--runner.numWorkers) {
      runner.debug('\n' + runner.id + ' !!! worker finished successfully !!! ' + runner.numWorkers + ' remains\n');       
      return;
    }
    delete runner.isError;
    runner.log('\n' + runner.id + ' !!! SUCCESS !!!\n');
      
  } else {
    runner.isError = 1;
    runner.log('\n' + runner.id + ' ??? FAIL ???\n');
  }

  if (runner._postFinish) runner._postFinish(runner);
}


/// utilities //////////////////////////////////////////////////////////////////////////////////////////////////////////


function setParameters(data, parameters) {
   if (typeof data === 'string') {
      if ((data.substr(0, 2) == '{{') && (data.substr(-2) == '}}' && (data.substr(2).indexOf('{{') < 0))) {
         var key = data.substr(2, data.length - 4);
         if (key in parameters) data = parameters[key];

      } else {
         // for (var key in parameters) data = data.replace(new RegExp('{{' + key + '}}', 'g'), str_ (parameters[key]));
         for (var key in parameters) {
            key += '';
            if (!key.match(/^\d+$/)) data = data.replace(new RegExp('{{' + key + '}}', 'g'),         parameters[key]);
         }
      }

   } else if (data instanceof Array) {
      for (var i=-1; ++i < data.length;) {
         data[i] = setParameters(data[i], parameters);
      }

   } else if (data && (typeof data === 'object')) {
      for (var i in data) {
         data[i] = setParameters(data[i], parameters);
      }

   }
   return data;
}


// console.log (setParameters(data, parameters));


function checkData(data, proto, parameters) {
   
   if (proto === undefined) return true;
   
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

   } else if (proto && (typeof proto === 'object')) {
      if (data && (typeof data === 'object')) {
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

// log (checkData([ 'CID', { CID_node: 'yRascmuR9U74EYuAAAJ8', CID_rest: 'RRs7A129ac4A4UEmY8' } ], [ 'CID', { CID_rest: '{{!CID_rest}}', CID_node: '{{!CID_node}}' } ], {})) 


function copia(data) {
   if (typeof data === 'string') {
      return '' + data;

   } else if (data instanceof Array) {
      return data.map((e) => {return copia(e); });

   } else if (data && (data === 'object')) {
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
  
  initScenario(runner, run, debugMode, callback);
  runScenario(runner);
    
}

test();
*/

