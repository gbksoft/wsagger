(require('fundamentum'))('array_', 'object_', 'log', 'error');

function initScenario (scenario, runStep, callback) {
  scenario.runScenario = runScenario; 
  scenario.callback    = (callback ? callback : console.log); 
  scenario.runStep     = (runStep  ? runStep  : console.log); 
  scenario.stepNum     = 0;
  scenario.flow_       = array_(scenario.flow);
  // scenario.haveToWait - JS timeout
}

function runScenario(scenario) {

  if (scenario.haveToWait) {
    console.error('/runScenario: scenario.haveToWait', scenario.haveToWait); 
    return;
  }

  var step;
  while (step = scenario.flow_.shift()) {

    ++scenario.stepNum;
    log ("\nSTEP ", (step.num ? step.num : scenario.stepNum), step, '\n');

    scenario.runStep(scenario, step);
    if (scenario.haveToWait) return;

    console.log(111111111111, scenario);
  }

  scenario.callback(scenario, true);
}

function test() {
  var scenario = {
    flow: [
      1,
      2,
      3
    ]  
  }  
  
  function run (scenario, step) {
    scenario.haveToWait = setTimeout(() => { 
      delete scenario.haveToWait; 
      scenario.runScenario(scenario); 
    }, 2000);      
  }

  function callback (scenario, success) {
    console.log(success ? '!!! SUCCESS !!!' : '??? FAIL ???');      
  }
  
  initScenario(scenario, run, callback);
  runScenario(scenario);
    
}

// test();

exports.initScenario = initScenario;
exports.runScenario  = runScenario;
