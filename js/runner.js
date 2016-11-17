

if (typeof exports !== 'undefined') {
   exports.bootstrap   = bootstrap;
   exports.tryScenario = tryScenario;
   exports.divideFlow  = divideFlow;
   config = {};
}

var socket, reload_, tryData = {}, io_client, theWorker, received = [], tryLogin, showMessage, setHTML, notifyOnTop, announce;

function addToReceived () {
   received.push([arguments]);
}

function bootstrap (io_client_, tryLogin_, tryData_, showMessage_, setHTML_, notifyOnTop_, announce_) {
   io_client = io_client_;

   if (tryData_)      tryData            = tryData_;
   if (tryLogin_)     tryLogin           = tryLogin_
   if (showMessage_)  showMessage        = showMessage_;
   if (setHTML_)      setHTML            = setHTML_;
   if (notifyOnTop_)  notifyOnTop        = notifyOnTop_;
   if (announce_)     announce           = announce_;

}

function onConnected (message) {
   if (message.userId)   { setHTML ('userId', (userId = message.userId)); }
   if (message.socketId) { setHTML ('socketId', message.socketId); }

}

function onServerError(message) {
   if (message.error) { notifyOnTop (message.error, 'red'); }
}

var firstTime = true;

function tryConnect (token) {
   var server = tryData.server;

   var frontUrl = 'http://' + server.host + ':' + server.port + server.path;

   if (socket) {
      console.log('!!! DISCONNECTING !!!');
      socket.io.disconnect();
      socket.io.opts.query    = "token=" + token;

      // socket.io.opts.host     = server.host;
      // socket.io.opts.hostname = server.host;
      // socket.io.opts.port     = server.port;
      // socket.io.opts.path     = server.path;

      console.log('!!! RECONNECTING !!!');
      socket.io.connect();

   } else {
      var query = {query: "token=" + token};
      socket = io_client(frontUrl, query);

   }

   if (socket) {
     if (firstTime) {
        firstTime = false;
        var onevent = socket.onevent;
        socket.onevent = function (packet) {
            var args = packet.data || [];
            onevent.call (this, packet);    // original call
            packet.data = ["*"].concat(args);
            onevent.call (this, packet);      // additional call to catch-all
        };

        socket
            .on ("*",           onInputEvent)
            .on ('connected',   onConnected)
            .on ('serverError', onServerError)
        ;

        reload_ = config.autoreload ? window.setTimeout (function () { location.reload (); }, 2000) : undefined;

        socket.on ('connect', function () {

            // socket.emit("sendMessage", {"type": "group", "groupId": "1", "messageText": "{{messageText}}"});

            if (reload_) window.clearTimeout (reload_);
            notifyOnTop ('Socket connected to ' + frontUrl, 'green');
            setHTML ('connect', '');
            announce('connect'); // custom event

        });
        socket.on ('error',      function () {
            notifyOnTop ('status', "Error connecting to socket", 'red');
            announce('socketerror'); // custom event
        });
        socket.on ('disconnect', function () {
            notifyOnTop ("Socket is disconnected", 'red');
            announce('disconnect'); // custom event
        });

      }

   } else {
        notifyOnTop ("Can't connect to socket", 'red');

   }
}

var num = 0;

function scenarioCallbackDefault (flowOrigin, error, flow, waitingFor, callback) {
  log('scenarioCallbackDefault --> callback');
  showMessage(
     ('!!! tryScenario ' + (error ? 'failed :-(' : 'finished successfully.')) + ' / flowOrigin: ' + (flowOrigin ? JSON.stringify(flowOrigin) : '') + ' / flow: ' + (flow ? JSON.stringify(flow) : ''),
     'socketLog',
     'blue'
  );

  if (callback) callback(flowOrigin, error, flow, waitingFor);
};

var waiting, waitingFor = [], parameters = {}, flow = [], flowOrigin = [], scenarioCallback = scenarioCallbackDefault, inScenario;
var num = 0;

function tryScenario (variants, selected, updatedParameters, scenarioNum, worker, callback) {

    if (inScenario) {
       alert ('!!! tryScenario simultaneously running is not allowed!');
       return;
    }
    scenarioCallback = function (flowOrigin, error, flow, waitingFor) { log('--> scenarioCallback'); scenarioCallbackDefault (flowOrigin, error, flow, waitingFor, callback); }
    inScenario = true;
    parameters = {};

    for (var s of ['REST', 'server']) {
       tryData[s] = {};
       if (variants[s] && variants[s][selected[s]]) {
          for (var key of ['proto', 'host', 'port', 'path']) tryData[s][key] = variants[s][selected[s]][key];
       }
    }

    // console.log (22222222222, variants.user, selected.user);

    if (variants.user && variants.user[selected.user]) {
       parameters.userId   = variants.user[selected.user].userId;
       parameters.token    = variants.user[selected.user].token;
       parameters.username = variants.user[selected.user].username;
       parameters.password = variants.user[selected.user].password;
    }
    for (var key in updatedParameters) parameters[key] = updatedParameters[key];

    theWorker = worker;

    flowOrigin = tryData.data[scenarioNum];
    flow = array_(divideFlow(flowOrigin)[worker ? worker : 0]);

    num = 0;
    doStep ();
}

function doStep () {

  var step;
  while (step = flow.shift()) {

    log ("\nSTEP ", num++, step, '\n');

    if (step.waitForResponse)         { step.wait = step.waitForResponse;    delete step.waitForResponse; }
    if (step.wait && step.wait.data ) { step.wait.expected = step.wait.data; delete step.wait.data; }


    // log (step.wait);
    setParameters(step.data, parameters);
    received = [];

    if (step.wait) {
      // log(11)
      if (step.wait.expected) {

        // log(22)
        waitingFor = setParameters(step.wait.expected, parameters);

      } else {
        // log(33)
        waitingFor = [];

      }
      // log(44)
      waiting = setTimeout(finishWaiting, step.wait.delay);
    }

    showMessage(
       '--> out : ' + (step.action ? step.action + ' / ' + str_(step.data) : '')
       + (step.wait ? ' : wait : ' + JSON.stringify(step.wait) : ''),
       'socketLog',
       'brown');

    // log(1);
    if (step.action === 'connect') {
      tryConnect(step.data[0].token);


    } else if (step.action === 'disconnect') {

      // log(3);

      if (!socket) { showMessage('abort: no socket found :-(', 'socketLog', 'red'); return; }
      socket.io.disconnect();

    } else if (step.action === 'login_and_connect') {

      // log(4);

      var REST = tryData.REST;
      tryLogin(REST.proto, REST.host, REST.port, REST.path, step.data[0].path, step.data[0].queryData, tryConnect);
      // log(555555555);

    } else if (step.action === 'request') {

      // log(5);

      if (!socket) { showMessage('abort: no socket found :-(', 'socketLog', 'red'); return; }

      var p = setParameters(step.data, parameters);
      socket.emit.apply(socket, p);

      // socket.emit("sendMessage", {"type": "group", "groupId": "1", "messageText": "{{messageText}}"});
      // socket.emit(p[0], p[1]);

    }
    // log(6);
    if (step.wait) return;
  }


  // log(777777777);
  if (waiting) clearTimeout(waiting);
  inScenario = false;
  var _scenarioCallback = scenarioCallback; scenarioCallback = scenarioCallbackDefault;
  _scenarioCallback(flowOrigin, false, [], []);
}


function onInputEvent(event, data) {
    // log ('onInputEvent', event, data);
    var color = 'gray';
    for (var i=-1; ++i < waitingFor.length;) {
       if (checkData([event, data], waitingFor[i], parameters)) {
          waitingFor.splice(i, 1);
          color = 'green';
          break;
       } else {
          // log ('checkData failed', [event, data], waitingFor[i]);
       }
    }
    showMessage ('<-- in : ' + event + ' / ' + JSON.stringify (data), 'socketLog', color);

    if (inScenario && waitingFor.length < 1) {
       // log ('onInputEvent: !waitingFor.length', waiting);

       if (waiting) clearTimeout(waiting);
       doStep();
    }
}

function finishWaiting() {
   clearTimeout(waiting);
   if (waitingFor.length) {
      console.log('\n\n!!! FAILED WAITING: ', waitingFor, 'RECEIVED: ', received);

      waitingFor = [];

      inScenario = false;
      var _scenarioCallback = scenarioCallback; scenarioCallback = scenarioCallbackDefault;
      _scenarioCallback(flowOrigin, true, flow, waitingFor);

   } else {
      doStep();

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


function divideFlow(A) {
    var flow_ = { };
    for (var step of array_(A)) {
       if (step && (typeof step == 'object')) {
          var worker = step.worker ? step.worker : 0;
          if (worker in flow_) { 
            flow_[worker].push(copia(step)); 

          } else { 
            flow_[worker] = [copia(step)];
          }
       }
    }

    return flow_;
}

function str_ (data) {
   return ((typeof data === 'object') && data) ? JSON.stringify(data) : data;

}

function log() {
    var t = '', a;
    for (var i = -1; ++i < arguments.length;) {
        var a = arguments[i];
        if (a && (typeof(a) == 'object')) {
            if (t) { console.log(t, a); } else { console.log(a);}
            t = '';

        } else {
            t +=  (t ? ' :: ' : '') + a;
        }
    }
    if (t) console.log(t);
    // ??? show caller.line
}

function dict_ (A) {
    return (A === null || A === undefined) ? {} : (typeof A !== 'object') ? { } : ('length' in A) ? {} :  A ;
}

function array_ (A) {
    return (A === null || A === undefined) ? [] : (typeof A !== 'object') ? [A] : ('length' in A) ? A  : [A];
}
