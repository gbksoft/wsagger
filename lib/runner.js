

var runner_, initLibraries, debugMode;

if (typeof exports !== 'undefined') {
  (require('fundamentum'))('array_', 'object_', 'log', 'error');
  runner_ = exports;

} else {
  runner_ = {};

}  

runner_.bootstrap              = bootstrap;
runner_.setParameters          = setParameters;
runner_.initScenario           = initScenario;
runner_.prepareDoers           = prepareDoers;
runner_.prepareScenario        = prepareScenario;
runner_.prepareScenarioInCall  = prepareScenarioInCall;
runner_.prepareScenarioInChain = prepareScenarioInChain;
runner_.checkData              = checkData;
runner_.storeData              = storeData;
runner_.initAsync              = initAsync;
runner_.onInputEvent           = onInputEvent;
runner_.call_                  = call_;


function bootstrap (initLibraries_, debugMode_) {
   initLibraries = initLibraries_;
   debugMode     = debugMode_;
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
  // log('prepareScenarioInChain...');

  scenario            = object_(scenario);
  scenario.data       = array_(scenario[scenario.flow ? 'flow' : 'data']);    

  scenario.inChain    = true;
  scenario.parameters = object_(scenario.parameters);

  prepareDoers(scenario);
  if (!('dataOut' in scenario) && scenario.data.length) scenario.dataOut = scenario.data[scenario.data.length - 1].dataOut;

  return scenario;
}


function prepareScenarioInCall(scenario, data) {
  // log('prepareScenarioInCall...');

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

function prepareScenario(scenario, variants, selectors, formParameters) {
  // log('prepareScenario...');

  scenario      = object_(scenario);
  scenario.data = array_(scenario[scenario.flow ? 'flow' : 'data']);    

  variants   = object_(variants);
  variantsSc = object_(scenario._variants);

  for (let k in variantsSc) { variants[k] = variantsSc[k]; }

  scenario.parameters = {};

  if (scenario.parameters_ instanceof Array) {
    for (var p of scenario.parameters_) {
      if ((p.name != undefined) && ('defaultValue' in p)) { scenario.parameters[p.name] = p.defaultValue; }
    }
  }


  var REST_ = object_(variants.REST_);      
  for (let i = -1; ++i < selectors.length;) {
    if (selectors[i] in REST_) {
      for (var k of ['proto', 'host', 'port', 'path']) scenario.parameters['REST.' + k] = REST_[selectors[i]][k];
      // selectors.splice(i, 1);  !!! if REST == server
      break;
    }
  }

  var server_ = object_(variants.server_);
  for (let i = -1; ++i < selectors.length;) {
    if (selectors[i] in server_) {
      for (var k of ['proto', 'host', 'port', 'path']) scenario.parameters['server.' + k] = server_[selectors[i]][k];
      selectors.splice(i, 1);
      break;
    }
  }

  var user_ = object_(variants.user_);
  for (let i = -1; ++i < selectors.length;) {
    if (selectors[i] in user_) {
      for (var k of ['username', 'password', 'id']) scenario.parameters['user.' + k] = user_[selectors[i]][k];
      selectors.splice(i, 1);
      break;
    }
  }

  VARIANTS:
  for (let p in variants) {
    if (['server_', 'REST_', 'user_'].includes(p)) continue;
    for (let i = selectors.length; --i >= 0;) {
      if (array_(variants[p]).includes(selectors[i])) {
        scenario.parameters[p] = selectors[i];

        // ??? REST.proto vs. REST.proto from REST_

        selectors.splice(i, 1);
        continue VARIANTS;
      }
    }
  }

  formParameters = object_(formParameters); for (var p in formParameters) { scenario.parameters[p] = formParameters[p]; }

  prepareDoers(scenario);
  if (!('dataOut' in scenario) && scenario.data.length) scenario.dataOut = scenario.data[scenario.data.length - 1].dataOut;

  return scenario;
}

function initScenario (scenario, initLibraries, debugMode, callback) { 

  if (scenario) {
    // log('initScenario...');

    var runner = scenario;
    runner.id = ((new Date()).getTime() + '').substr(7);
  
    runner.parameters = object_(runner.parameters);  
    runner.functions  = object_(runner.functions);  

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
    error('/initScenario: no scenario...');

  }

}


function showP(runner) {
   for (var p in runner.parameters) {
    if (p.substr(0,5) != 'doer.') console.log(p + ': ', runner.parameters[p]);
   }
}

/// running /////////////////////////////////////////////////////////////////////////////////////////////


function _run(runner) {

  while (runner.step = runner.data.shift()) {
    runner.step = object_(runner.step);
    if (runner.step.waitForResponse)                    { runner.step.wait     = runner.step.waitForResponse; delete runner.step.waitForResponse; }
    if (runner.step.wait && runner.step.wait.data )     { runner.step.expected = runner.step.wait.data;       delete runner.step.wait.data; }
    if (runner.step.wait && runner.step.wait.expected ) { runner.step.expected = runner.step.wait.expected;   delete runner.step.wait.expected; }

    runner.debug('\n' + runner.id + ' STEP ', (runner.step.num = ++runner.stepNum), '\n\n', runner.step);

    // showP(runner);

    runner.step.expected = setParameters(runner.step.expected, runner.parameters);

    if (runner.step.wait)      runner.haveToWait[runner.step.num] = _stopWaiting(runner, runner.step.expected, runner.step.wait.delay,      runner.step.num);
    if (runner.step.waitAsync) runner.haveToWait[runner.step.num] = _stopWaiting(runner, runner.step.expected, runner.step.waitAsync.delay, runner.step.num);

    if (runner.step.action) {
      runner.step.data = setParameters(runner.step.data, runner.parameters);  
      
      var doer = doer_(runner.step);
      
      if (doer && runner.parameters['doer.' + doer[0]]) {
        if (doer[1]) {
          var action = runner.parameters['doer.' + doer[0]][doer[1]];
          action.apply(runner.parameters['doer.' + doer[0]], [runner, runner.step, runner.step.data, runner.step.expected] );
    
        } else {
          runner.parameters['doer.' + doer[0]].apply([runner, runner.step, runner.step.data, runner.step.expected]);

        } 
      } 
    }  

    if (runner.step.wait) return; 
  }

  if (Object.keys(runner.haveToWait).length < 1) runner._finish(runner, true);
}


function storeData(runner, dataOut, data, opes) {
  if (dataOut) { 
    if (dataOut instanceof Array) {
      if (data && (typeof data == 'object')) {
        for (var k of dataOut) {
          runner.debug('\n' + runner.id + ' store ', ((data[k] && (k.substr(0, 5) === 'doer.')) ? k + ': {...}' : data[k]), ' --> ', k);
          opes[k] = data[k]; 
        }
      }   

    } else if (dataOut && ((typeof dataOut) == 'object')) {
      if (data && (typeof data == 'object')) {
        for (var k in dataOut) {
          runner.debug('\n' + runner.id + ' store ', data[k], ' --> ', k);
          opes[k] = setParameters(dataOut[k], data); 
        }
      }
    

    } else {
      runner.debug('\n' + runner.id + ' store all data --> ', dataOut);
      opes[dataOut] = data; 
    }
  }
}

  
function _callback(runner, step, data, expected, err) {
  runner.debug('\n' + runner.id + ' <-- in ' + step.action + ':', data, typeof data, '\nfrom step:', step);

  storeData(runner, step.dataOut, data, runner.parameters);
     
  if (runner.haveToWait[step.num]) {
    clearTimeout(runner.haveToWait[step.num]);
    delete runner.haveToWait[step.num]; 
  }

  if (runner.isError) {
    runner.error('\n' + runner.id + ' /runner.isError:', runner.isError);
    runner._finish(runner, false);
    
  } else if (err) {
    var err_ = string_(err.toString ? err.toString() : err);
    runner.error('\n' + runner.id + ' /_callback(...err):', err_); // ((err_.length > 1000) ? err_.substr(0, 1000) + '...............' : err_));
    runner._finish(runner, false);
    
  } else if (checkData(data, expected, runner.parameters, runner.functions)) {  
    runner.debugExp('\nEXPECTED');
    runner._run(runner); 
    
  } else {
    runner.error('\n' + runner.id + ' unexpected data:', data, 'expectations:', expected);
    runner._finish(runner, false);
    
  }
}


function _stopWaiting(runner, expected, delay, stepNum) {
  
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
        runner.debug('\n' + runner.id + ' !!! wait timeout ' + stepNum + ' !!!! failed');
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
    runner.debug('\n' + runner.id + ' !!! SUCCESS !!!\n');
      
  } else {
    runner.isError = 1;
    runner.debug('\n' + runner.id + ' ??? FAIL ???\n');
  }

  if (runner._postFinish) runner._postFinish(runner);
}


/// events /////////////////////////////////////////////////////////////////////////////////////////////////////

function initAsync(doer, runner, step, data, expected) {
  runner.debugOut('\n' + runner.id + ' out --> ' + step.action + ':', data);    
  doer.runner   = runner;    
  doer.expected = expected;        
  doer.stepNum  = step.num;
}

function onInputEvent(doer, event, data) {  // 
  var runner = doer.runner;
  runner.debug('\n' + runner.id + ' <-- in: ' + doer.name, ' ', event, ' ', data);
    
  if (doer.expected instanceof Array) {
    for (var i=-1; ++i < doer.expected.length;) {

      if (runner_.checkData([event, data], doer.expected[i], runner.parameters, runner.functions)) {
        doer.expected.splice(i, 1);
        runner.debugExp('onInputEvent: expected! ' + doer.expected.length + ' remains');
        break;

      } else {
        runner.debug('onInputEvent: checkData failed???', doer.expected[i]);
      }
    }

    if (doer.expected.length < 1) {
      runner.debug('onInputEvent: all expected is received!');

      if (runner.haveToWait[doer.stepNum]) {
        clearTimeout(runner.haveToWait[doer.stepNum]);
        delete runner.haveToWait[doer.stepNum];     
      }

      runner._run(runner);
    }
   
  } else {
    runner.debug('onInputEvent: no expectations', doer.expected);

  }
}

/// call-doer ////////////////////////////////////////////////////////////////////////////////////////////

function call_() {
  this.callWsagger     = callWsagger;
  this.callWsaggerFile = callWsaggerFile;
  return this;
  
  function callWsagger(runner, step, data, expected, fromFile) {
    // runner._callback(runner, step, undefined, undefined, 1);
    // return;

    data = array_(data);
     
    var wsagger_ = data.shift();
    try {
      var wsaggerScript;
      if (fromFile) {
         var filename = process.env.WSAGGER_SCRIPT_PATH + '/' + wsagger_;

         runner.debug('\nfrom file <-- :', filename);    
         
         // !!! kostyl !!!
         var fs = require('fs');
         // !!! kostyl !!!

         var wsaggerScript_ = fs.readFileSync(filename, { encoding: "utf8"});
         wsaggerScript = JSON.parse(wsaggerScript_);

      } else {
         wsaggerScript = wsagger_;
      
      }

    } catch (err) {
      runner._callback(runner, step, undefined, expected, err);
    
    }

    try {
      data = runner_.setParameters(data, runner.parameters);
      runner.debugOut('\n' + runner.id + ' out --> ' + step.action + ':', wsaggerScript, data);    
     
      var scenario = runner_.prepareScenarioInCall(wsaggerScript, data);    
      var runner1  = runner_.initScenario(scenario, initLibraries, debugMode, (_runner1) => {
        if (_runner1.isError) {
          runner._finish(runner, false);

        } else {
          runner._callback(runner, step, _runner1.parameters, expected);

        }
      
      });
      
      if (runner1) runner1._run(runner1);

    } catch (err) {
      runner._callback(runner, step, undefined, expected, err);
    
    }
  }

  function callWsaggerFile(runner, step, data, expected) { 
    callWsagger(runner, step, data, expected, true); 
  }

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


function checkData(data, proto, parameters, func_) {
   
   if (proto === undefined) return true;
   
   var checked = true;
   if (typeof proto === 'string') {
      var r = proto.match(/^\{\{([!*])(.*?)\}\}$/);
      if (r) { 
        if (r[1] === '!') {
           parameters[r[2]] = data; 
        
        } else if (r[2] in func_) {
           checked = eval(func_[r[2]])(data, parameters); 
      
        } else {
           checked = false; 

        }
      
      } else if (data !== proto) { 
        checked = false; 
      
      }

   } else if (proto instanceof Array) {
      if ((data instanceof Array) && (data.length >= proto.length)) {
         for (var i=-1; ++i < proto.length;) {
            if (!checkData(data[i], proto[i], parameters, func_)) checked = false;
         }

      } else {
         checked = false;

      }

   } else if (proto && (typeof proto === 'object')) {
      if (data && (typeof data === 'object')) {
         for (var i in proto) {
            if (!checkData(data[i], proto[i], parameters, func_)) checked = false;
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

   } else if (data && (typeof data === 'object')) {
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

