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


var predefinedFunctions = {
  isString:   ((data) => (typeof data === 'string')),
  isBoolean:  ((data) => (typeof data === 'boolean')),
  isEmpty:    ((data) => ((data === null) || (data === undefined) || (data === ''))),
  isNotEmpty: ((data) => ((data !== null) && (data !== undefined) && (data !== ''))),
  isTrue:     ((data) => !!data),
  isFalse:    ((data) => !data),
  isNumber:   ((data) => (typeof data === 'number')),
  isFunction: ((data) => (typeof data === 'function')),
  isArray:    ((data) => (data instanceof Array)),
  isObject:   ((data) => (data && (typeof data === 'object') && !(data instanceof Array)))
}


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
    if (doer) scenario.context['doer.' + doer[0]] = undefined;
  }
}  

function prepareScenarioInChain(scenario) {
  // log('prepareScenarioInChain...');

  scenario            = object_(scenario);
  scenario.data       = array_(scenario[scenario.flow ? 'flow' : 'data']);    

  scenario.inChain    = true;
  scenario.context = object_(scenario.context);

  prepareDoers(scenario);
  if (!('dataOut' in scenario) && scenario.data.length) scenario.dataOut = scenario.data[scenario.data.length - 1].dataOut;

  return scenario;
}


function prepareScenarioInCall(scenario, data) {
  // log('prepareScenarioInCall...');

  scenario      = object_(scenario);
  scenario.data = array_(scenario[scenario.flow ? 'flow' : 'data']);    

  scenario.context = {};
  data                = array_(data);
  var keysIn          = array_(scenario.keysIn);

  for (var i = -1; ++i < keysIn.length;) scenario.context[keysIn[i]] = data[i];  

  prepareDoers(scenario);
  if (!('dataOut' in scenario) && scenario.data.length) scenario.dataOut = scenario.data[scenario.data.length - 1].dataOut;

  return scenario;
}  

function prepareScenario(scenario, variants, selectors, formParameters) {
  // log('prepareScenario...');

  scenario      = object_(scenario);
  scenario.data = array_(scenario[scenario.flow ? 'flow' : 'data']);    

  variants   = object_(variants);
  variantsSc = object_(scenario.variants);

  for (let k in variantsSc) { variants[k] = variantsSc[k]; }

  scenario.context = {};

  if (scenario.parameters instanceof Array) {
    for (var p of scenario.parameters) {
      if (p.name != undefined) {
         if      ('default'      in p) { scenario.context[p.name] = p.default; }  
         else if ('defaultValue' in p) { scenario.context[p.name] = p.defaultValue; }  
      }
    }
  }


  var REST_ = object_(variants.REST_);      
  for (let i = -1; ++i < selectors.length;) {
    if (selectors[i] in REST_) {
      for (var k of ['proto', 'host', 'port', 'path']) scenario.context['REST.' + k] = REST_[selectors[i]][k];
      // selectors.splice(i, 1);  !!! if REST == server
      break;
    }
  }

  var server_ = object_(variants.server_);
  for (let i = -1; ++i < selectors.length;) {
    if (selectors[i] in server_) {
      for (var k of ['proto', 'host', 'port', 'path']) scenario.context['server.' + k] = server_[selectors[i]][k];
      selectors.splice(i, 1);
      break;
    }
  }

  var user_ = object_(variants.user_);
  for (let i = -1; ++i < selectors.length;) {
    if (selectors[i] in user_) {
      for (var k of ['username', 'password', 'id']) scenario.context['user.' + k] = user_[selectors[i]][k];
      selectors.splice(i, 1);
      break;
    }
  }

  VARIANTS:
  for (let p in variants) {
    if (['server_', 'REST_', 'user_'].includes(p)) continue;
    for (let i = selectors.length; --i >= 0;) {
      if (array_(variants[p]).includes(selectors[i])) {
        scenario.context[p] = selectors[i];

        // ??? REST.proto vs. REST.proto from REST_

        selectors.splice(i, 1);
        continue VARIANTS;
      }
    }
  }

  formParameters = object_(formParameters); for (var p in formParameters) { scenario.context[p] = formParameters[p]; }

  prepareDoers(scenario);
  if (!('dataOut' in scenario) && scenario.data.length) scenario.dataOut = scenario.data[scenario.data.length - 1].dataOut;

  return scenario;
}

function initScenario (scenario, initLibraries, debugMode, callback) { 

  if (scenario) {
    // log('initScenario...');

    var runner = scenario;
    runner.id = Date.now().toString().substr(7);
  
    runner.context     = object_(runner.context);  
    runner.functions   = object_(runner.functions);  
    for (var f in predefinedFunctions) {
       if (!(f in runner.functions)) { runner.functions[f] = predefinedFunctions[f]; }
    }

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
   for (var p in runner.context) {
    if (p.substr(0,5) != 'doer.') console.log(p + ': ', runner.context[p]);
   }
}

/// running /////////////////////////////////////////////////////////////////////////////////////////////

var defaultDelay = 3000;

function _run(runner) {

  if (runner.step && runner.step.async) { return; }

  while (runner.step = runner.data.shift()) {
    runner.step = object_(runner.step);
    runner.debug('\n' + runner.id + ' STEP ', (runner.step.num = ++runner.stepNum), '\n\n', runner.step);

    runner.step.expected = setParameters(runner.step.expected, runner.context);
   
    var delay = (runner.step.wait      && (runner.step.wait.delay      > 0)) ? runner.step.wait.delay 
              : (runner.step.waitAsync && (runner.step.waitAsync.delay > 0)) ? runner.step.waitAsync.delay 
              : defaultDelay;

    runner.haveToWait[runner.step.num] = _stopWaiting(runner, runner.step.expected, delay, runner.step.num);    

    if (runner.step.action) {
      runner.step.data = setParameters(runner.step.data, runner.context);  
      
      var doer = doer_(runner.step);
      
      if (doer && runner.context['doer.' + doer[0]]) {
        if (doer[1]) {
          var action = runner.context['doer.' + doer[0]][doer[1]];
          action.apply(runner.context['doer.' + doer[0]], [runner, runner.step, runner.step.data, runner.step.expected] );
    
        } else {
          runner.context['doer.' + doer[0]].apply([runner, runner.step, runner.step.data, runner.step.expected]);

        } 
      } 
    }  
    
    if (!runner.step.async) { return; }
  
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

function show_ (data) {
  if (data && (typeof data === 'object') && !(data instanceof Array)) {
    var data_ = {};
    for (var key in data) {
      data_[key] = (key.substr(0,5) == 'doer.') ? '...' : data[key];
    }

  } else {
    return data;

  }
}
  
function _callback(runner, step, data, expected, err) {
  runner.debug('\n' + runner.id + ' <-- in ' + step.action + ' (' + typeof data + ' from step ' + step.num + '):\n', show_ (data));
  storeData(runner, step.dataOut, data, runner.context);
     
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
    
  } else if (checkData(data, expected, runner.context, runner.functions)) {  
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
    runner.debug('\n' + runner.id + ' SUCCESS\n');
      
  } else {
    runner.isError = 1;
    runner.debug('\n' + runner.id + ' FAIL\n');
  }

  if (runner._postFinish) runner._postFinish(runner);
}


/// events /////////////////////////////////////////////////////////////////////////////////////////////////////

function initAsync(doer, runner, step, data, expected) {
  runner.debugOut('\n' + runner.id + ' out --> ' + step.action + ':\n', data);    
  doer.runner   = runner;    
  doer.expected = expected;        
  doer.stepNum  = step.num;
}

function onInputEvent(doer, event, data) {  // 
  var runner = doer.runner; if (!runner) return;

  runner.debug('\n' + runner.id + ' <-- in: ([event, data] from ' + doer.name + ')\n', event, '\n', data);
    
  if (doer.expected instanceof Array) {
    for (var i=-1; ++i < doer.expected.length;) {

      if (runner_.checkData([event, data], doer.expected[i], runner.context, runner.functions)) {
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

      delete doer.runner;            // to prevent scenario continuation on next input events...
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
      data = runner_.setParameters(data, runner.context);
      runner.debugOut('\n' + runner.id + ' out --> ' + step.action + ':\n', wsaggerScript, '\ndata:\n', data);    
     
      var scenario = runner_.prepareScenarioInCall(wsaggerScript, data);    
      var runner1  = runner_.initScenario(scenario, initLibraries, debugMode, (_runner1) => {
        if (_runner1.isError) {
          runner._finish(runner, false);

        } else {
          runner._callback(runner, step, _runner1.context, expected);

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


function setParameters(data, context) {
   if (typeof data === 'string') {
      if ((data.substr(0, 2) == '{{') && (data.substr(-2) == '}}' && (data.substr(2).indexOf('{{') < 0))) {
         var key = data.substr(2, data.length - 4);
         if (key in context) data = context[key];

      } else {
         // for (var key in context) data = data.replace(new RegExp('{{' + key + '}}', 'g'), str_ (context[key]));
         for (var key in context) {
            key += '';
            if (!key.match(/^\d+$/)) data = data.replace(new RegExp('{{' + key + '}}', 'g'),         context[key]);
         }
      }

   } else if (data instanceof Array) {
      for (var i=-1; ++i < data.length;) {
         data[i] = setParameters(data[i], context);
      }

   } else if (data && (typeof data === 'object')) {
      for (var i in data) {
         data[i] = setParameters(data[i], context);
      }

   }
   return data;
}


// console.log (setParameters(data, context));


function checkData(data, proto, context, func_) {
   
  if (proto === undefined) return true;
   
  var checked = true;
  if (typeof proto === 'string') {
    var r = proto.match(/^\{\{([!*])(.*?)\}\}$/);
    if (r) { 
      if (r[1] === '!') {
        context[r[2]] = data; 
        
      } else if (r[2] in func_) {
        checked = eval(func_[r[2]])(data, context); 
        if (!checked) {
          log ('/checkData (data, proto, checked)', data, typeof data, proto, checked);

        }
      
      } else {
        log ('/checkData (data, proto)', data, typeof data, proto, typeof proto);
        checked = false; 

      }
      
    } else if (data !== proto) { 
      log ('/checkData (data, proto)', data, typeof data, proto, typeof proto);
      checked = false; 
      
    }

  } else if (proto instanceof Array) {
    if ((data instanceof Array) && (data.length >= proto.length)) {
      for (var i=-1; ++i < proto.length;) {
        if (!checkData(data[i], proto[i], context, func_)) { 
          checked = false; 
          break;
        }
      }

    } else {
      log ('/checkData (data, proto)', data, typeof data, proto, typeof proto);
      checked = false;

    }

  } else if (proto && (typeof proto === 'object')) {
    if (data && (typeof data === 'object')) {
      for (var i in proto) {
        if (!checkData(data[i], proto[i], context, func_)) {
          checked = false;
          break;
        }  
      }

    } else {
      log ('/checkData (data, proto)', data, typeof data, proto, typeof proto);
      checked = false;

    }

  } else if (data !== proto) {
    log ('/checkData (data, proto)', data, typeof data, proto, typeof proto);
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

