$('.filters').on('click', 'input', function(){
  var color = $(this).val();
  $('#argumentum').toggleClass('hide-' + color);
});

var debugMode = true;

runner_.bootstrap(initBrowserLibraries, debugMode);

function tryScenario(variants, selected, parameters) {
  var scenario_  = runner_.prepareScenario(scenario, variants, selected);
  
  log(scenario_);
  runner = runner_.initScenario(scenario_, initBrowserLibraries, debugMode, postFinish);
  if (runner) runner._run(runner);

}


function postFinish (runner) {
  var isError = runner.isError;
  console.log('\n' + runner.id + (isError ? ' FAIL ???' : ' SUCCESS !!!'), isError);

  if (runner.inChain) {
    // var opes = {}; runner_.storeData(runner, runner.dataOut, runner.parameters, opes)    
    console.log('\nFinishRunInChain:\n');
  
  } else {
    console.log('\nFinal!' );

  }

  // process.exit(isError ? isError : 0);
}

function initBrowserLibraries (runner, debugMode) {
  runner.error  = console.error;
  runner.log    = console.log; 
  runner.debug  = (debugMode ? console.log : () => {});

  /*
  !!!
  if ('doer.ipc'       in runner.parameters) runner.parameters['doer.ipc']       = new ipc_();
  if ('doer.load'      in runner.parameters) runner.parameters['doer.load']      = new load_();
  if ('doer.exec'      in runner.parameters) runner.parameters['doer.exec']      = new exec_();
  */
  
  if ('doer.call'      in runner.parameters) runner.parameters['doer.call']      = new runner_.call_();
  if ('doer.http_'     in runner.parameters) runner.parameters['doer.http_']     = new http_.connect_();
  if ('doer.http'      in runner.parameters) runner.parameters['doer.http']      = new http_.connect_('http');
  if ('doer.https'     in runner.parameters) runner.parameters['doer.https']     = new http_.connect_('https');
  if ('doer.socket_io' in runner.parameters) runner.parameters['doer.socket_io'] = new socket_io_.connect_();
}


function showMessage (text, type, color) {
  text = text.replace(/,/g, ', ');
  if (color) {
    $('#' + type).append($('<li>').text(text).addClass (color));
  } else {
    $('#' + type).append($('<li>').text(text));
  }
  ScrollTo ();
}

function clearSocketLog () {
  setHTML ('socketLog', '')
}

function showError (text) {
  $ ('#socketLog').append ($ ('<li>').text ('!!! Error: ' + text).css ('color', 'red'));  //
  ScrollTo();
}

function ScrollTo () {
  var el = document.getElementById('socketLog');
  if (el) {
    // el.scrollTop = el.scrollHeight;  // immediate scroll to end
    $(el).scrollTo('max'); // scroll to end
  }
}

function notifyOnTop (message, color) {
  var text = (message && (typeof message == 'object')) ? JSON.stringify (message) : message;
  setHTML ('status', color ? '<font color = "' + color + '">' + text + '</font>' : text);
}
