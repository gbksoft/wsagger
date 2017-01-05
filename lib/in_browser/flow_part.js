$('.filters').on('click', 'input', function(){
  var color = $(this).val();
  $('#argumentum').toggleClass('hide-' + color);
});

var debugMode = true;

runner_.bootstrap(initBrowserLibraries, debugMode);

function tryScenario(scenario, variants, selected, formParameters) {

  var scenario_  = runner_.prepareScenario(scenario, variants, selected, formParameters);
  runner = copia(runner_.initScenario(scenario_, initBrowserLibraries, debugMode, postFinish));
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
  runner.error    = (function () { showMessage(Array.prototype.slice.call(arguments), 'red'); });
  runner.log      = (function () { showMessage(Array.prototype.slice.call(arguments), 'black'); }); 
  runner.debug    = (debugMode ? (function () { showMessage(Array.prototype.slice.call(arguments), 'black'); }) : () => {});
  runner.debugOut = (debugMode ? (function () { showMessage(Array.prototype.slice.call(arguments), 'brown'); }) : () => {});
  runner.debugExp = (debugMode ? (function () { showMessage(Array.prototype.slice.call(arguments), 'green'); }) : () => {});


  
  // runner.error  = console.log; 
  // runner.log    = console.log; 
  // runner.debug  = (debugMode ? console.log : () => {});

  // var text = Array.prototype.slice.call(data).map((e) => ((e === null || e === undefined) ? '' : (typeof e !== 'object') ? string_(e) : JSON.stringify(e))).join(', ');



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


function showMessage (data, color) {
  var isObject = false, text = '';

  for (var e of array_(data)) {
    if (e && (typeof e === 'object')) {
      isObject = true;
      text += JSON.stringify(e, null, 3) + '\n';

    } else {
      text += e;

    }
  }

  if (!color) { color = 'black'; }

  var li = $('<li>').text (text).addClass (color); if (isObject) { li.css('white-space', 'pre'); }  // .css('font-family', 'monospace')

  $('#socketLog').append (li);
  ScrollTo ();
}

function clearSocketLog () {
  $("#socketLog").html('');
}

function ScrollTo () {
  // el.scrollTop = el.scrollHeight;  // immediate scroll to end
  $("#socketLog").scrollTo('max'); // scroll to end
}

