$('.filters').on('click', 'input', function(){
  var color = $(this).val();
  $('#argumentum').toggleClass('hide-' + color);
});

var debugMode = true;

runner_.bootstrap(initBrowserLibraries, debugMode);

function tryScenario(scenario, variants, selected, formParameters) {

  var scenario_  = runner_.prepareScenario(scenario, variants, selected, formParameters);
  runner = copia(runner_.initScenario(scenario_, initBrowserLibraries, debugMode, postFinish));

  if (runner) {
    showMessage ('SCENARIO IS STARTING: ' + scenario.name , 'blue');
    runner._run(runner);
  }
}


function postFinish (runner) {
  if (runner.inChain) {
    // var opes = {}; runner_.storeData(runner, runner.dataOut, runner.context, opes)    
    console.log('\nChild runner ' + runner.id + ' finished...');
  
  } else {
    console.log('\nMain runner '  + runner.id + ' finished!');

  }

  // process.exit(isError ? isError : 0);
}

function initBrowserLibraries (runner, debugMode) {
  
  // !!! "function" instead "=>" because of "arguments" in body 
  
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
  if ('doer.ipc'       in runner.context) runner.context['doer.ipc']       = new ipc_();
  if ('doer.load'      in runner.context) runner.context['doer.load']      = new load_();
  if ('doer.exec'      in runner.context) runner.context['doer.exec']      = new exec_();
  */
  
  if ('doer.call'      in runner.context) runner.context['doer.call']      = new runner_.call_();
  if ('doer.http_'     in runner.context) runner.context['doer.http_']     = new http_.connect_();
  if ('doer.http'      in runner.context) runner.context['doer.http']      = new http_.connect_('http');
  if ('doer.https'     in runner.context) runner.context['doer.https']     = new http_.connect_('https');
  if ('doer.socket_io' in runner.context) runner.context['doer.socket_io'] = new socket_io_.connect_();
}

var flowNum = -1;

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

  var arr = text.split(/[\n\r]/g);
  var num = -1;
  for (var i = -1; ++i < arr.length;) {
     if (arr[i].match (/\S/)) {
        if (num >= 0) {
           ++flowNum;
           text = arr.slice (0, num + 1).join ('\r\n') + '  <img src="img/plus.png" onclick="OpenClose(this, \'flow_' + flowNum + '\');"><span id="flow_' + flowNum + '" style="visibility:hidden;position:absolute;">\r\n' + arr.slice (num + 1).join ('\r\n') + '</span>' ;
        } else {
           num = i;
        }
     }
  }

  /*
  r = text.match (/^(.*?)\S.*?[\n\r]/g);
  if (r) {
     text = text.substr (0, r[1].length)  + '!!!' + text.substr (r[1].length)
  }
  */

  if (!color) { color = 'black'; }

  var li;

  /*
  if (isObject) {
    li = $('<li/>').html('<pre style="overflow:auto;width:100%">' + text + '</pre>').addClass(color); 

  } else {
  
  } 
  */

  li = $('<li>').html (text).addClass (color); 

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

function OpenClose (img, id) {
   if (el = document.getElementById (id)) {
      if (el.style.visibility == "hidden") {
        el.style.visibility = "visible";
        el.style.position   = "static";
        el.style['white-space'] = "pre";
        if (img) img.src = "img/minus.png";

      } else {
        el.style.visibility = "hidden";
        el.style.position   = "absolute";
        if (img) img.src = "img/plus.png";
         
      }
   }
}
