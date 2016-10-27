/* jQuery handlers for custom events */

// fire on DOM built from JSON, connect and disconnect
$('body').on('connect disconnect dombuiltfromjson', function (evt) {
    var self = $(this);

    jsonData.scenarios.forEach(function (el, c) {
        if (el.condition === 'connect') {
            self.find('.method')
                .eq(c)
                .toggleClass('panel-default panel-info')
                .find('.btn-try').attr('disabled', function(_, attr){ return !attr});
        }
    });

});

var config = {},
    tryData = {},
    jsonData;

/* --- JSON radio buttons --- */
$('#jsonloader').on('change', 'input[type=radio]', function(){
    var val = $(this).val();
    $('div.json-url').find('input').attr({'type':val});
    clearFeedback();
});

/* JSON loading and parsing >>> */
$('#jsonloader').submit(function (evt) {

    evt.preventDefault();
    clearFeedback();

    var localOrRemote = $('#jsonloader').find('.json-url').find('input').attr('type');

    if (localOrRemote === 'text') {  // if remote JSON

        var jsonPromise = $.getJSON( $(this).find('.url').val() )
            .then( jsonLoadSuccessHandler,jsonLoadErrorHandler(localOrRemote) );

    } else {  // if local JSON

        var reader = new FileReader();
        reader.addEventListener('load', function() {
            jsonLoadSuccessHandler(JSON.parse(this.result));
        });

        if (document.forms[0][2].files[0]) {
            reader.readAsText(document.forms[0][2].files[0]);
        } else {
            jsonLoadErrorHandler(localOrRemote)
        }

    }

});

function jsonLoadSuccessHandler(res) {  // success callback
    clearSocketLog();
    jsonData = res; // save JSON globally, for future use

    var text = '';
    tryData = {};

    // res.forEach(function (elem, dataNum) {  // for each in JSON

    
    elem = res;
    dataNum = 0;



        tryData[dataNum] = {server: elem.server, data: {}};

        text += '<li class="wsagger">'

        /* WSagger version & info  */

        text += '<div class="wsagger__summary">'
            + '<div class="wsagger__title">wsagger</div> <p>' +  JSON.stringify (elem.wsagger) + '</p>'
            + '<div class="wsagger__title">info</div> '
            + '<p>'
            +  JSON.stringify (elem.info.title) + '<br>'
            +  JSON.stringify (elem.info.description) + '<br>'
            +  JSON.stringify (elem.info.version) + '<br>'
            + '</p>'
            + '</div>';


        text += '<b>server</b> <br> <p>';
        for (var k of ['proto', 'host', 'port', 'path']) {
            text += k + ': ' + JSON.stringify (elem.server[k]) + '<br>';
        }
        text += '</p>';

        /* WSagger methods */

        elem.scenarios.forEach(function(elem, scenarioNum){   // for each in JSON/scenarios

            var idToToggle = 'id' + scenarioNum;

            text += '<div class="method panel panel-info">';

            text += '<h5 class="method__header panel-heading" data-toggle="collapse" data-target="#'+ idToToggle +'">'
                + '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span>'
                + elem.name
                + '</h5>';

            text += '<div class="method__body panel-body collapse" id="'+ idToToggle +'">';

            text += '<ul class="method__details">';
            var s = elem;

            for (var v in s) {
                var divOrPre = (v === 'parameters' || v === 'flow')? 'pre' : 'div'; // use PRE or DIV tag for description
                var hasFormdata = (  s[v][0] && s[v][0].in === 'formData' );  // if scenarios.parameters.in === formData
                text += (v === "parameters")?
                        "<li class='parameters'>" : "<li>";

                            text += '<div class="method__item">' + v + '</div>:<br>'
                                + '<'+ divOrPre + ' class="method__descr">';
                                if (hasFormdata) {    // we either show a form...

                                    s[v].forEach(function (item, formDataItemNum) {   // for each in JSON/scenarios/parameters
                                        text += showFormInMethod( item.name, item.description );
                                    });

                                } else {              // or show JSON data
                                    text += JSON.stringify (s[v], null, 2);
                                }

                            text += '</' + divOrPre + '>';

                text += '</li>';
            }

            text += '</ul>';

            tryData[dataNum].data[scenarioNum] = s.flow;
            // text += '<button class="btn btn-xs btn-info" onclick="tryScenario ('+ dataNum + ',' + scenarioNum + ')">Try!</button>';
            text += '<button class="btn btn-xs btn-info btn-try" data-datanum="'+dataNum+'" data-scenarionum="'+scenarioNum+'">Try!</button>';
            text += '<span class="red">Pls establish socket connect first</span>';

            text += '</div>';
            text += '</div>';

        });

        text += '</li>';

    // });

    setHTML ('data', text);
    $('#jsonloader').find('.feedback').html( "JSON was loaded successfully" ).delay(1000).fadeOut('slow');

    announce('dombuiltfromjson'); // custom event
}

function jsonLoadErrorHandler(error) {  // error callback
    var message =  (error === "text")? 'Incorrect URL' : 'File not selected';
    $('#jsonloader').find('.feedback').html(message);
}

function clearFeedback(){
    $('#jsonloader').find('.feedback').html("").fadeIn(); // clear JSON message
}
/* <<< JSON loading and parsing */


/* jQuery handlers >>> */
    // TRY button >>>
    $('body').on('click', '.btn-try', function () {
        var a = $(this).data("datanum"),
            b = $(this).data("scenarionum");

        tryScenario(a,b);


        // get copy of original elem/scenario/parameters. Create object A.
        var updatedParams = elem.scenarios[a].parameters;

        // get forms with user's data in their inputs.
        var paramsForms = $(this).prev().find('.parameters').find('form');

        // in each form, we find user's input
        paramsForms.each(function (ii, el) {
            var paramValue = $(el).find('input').val();
            // In ii-th object of parameters, we substitute 'in' property value with what user has entered.
            updatedParams[ii]['in'] = paramValue;
        });

        // ----------  this is updated 'parameters' object -----------
        console.log('updatedParams = ', updatedParams);
    });
    // <<< TRY button

    // filters section
    $('.filters').on('click', 'input', function(){
        var color = $(this).val();
        $('#argumentum').toggleClass('hide-' + color);
    });

    // adding +/- to methods
    $('body').on('click', '.method__header', function(){
        $(this).find('span').toggleClass('glyphicon-plus glyphicon-minus');
    });

/* <<< jQuery handlers */


var socket, reload_, iam;

function tryConnect (dataNum, token) {

    var server = tryData[dataNum].server;

    // var frontUrl = 'http://' + window.location.hostname + ':' + config.port + config.namespace;

    var frontUrl = 'http://' + server.host + ':' + server.port + server.path;

    if (iam) {
        notifyOnTop ('Друга спроба конекту неможлива :-( Треба перезавантажити сторінку', "red");
        return
    }

    iam = true;

    log (token);


    var query = {query: "token=" + token};
    socket    = io (frontUrl, query);

    if (socket) {

        var onevent = socket.onevent;
        socket.onevent = function (packet) {
            var args = packet.data || [];
            onevent.call (this, packet);    // original call
            packet.data = ["*"].concat(args);
            onevent.call (this, packet);      // additional call to catch-all
        };

        socket
            .on ("*", function (event, data) {
                showMessage ('in: ' + event + ' / ' + JSON.stringify (data), 'socketLog', 'gray');
            })
            .on ('connected',   onConnected)
            .on ('serverError', onServerError)
        ;

        reload_ = config.autoreload ? window.setTimeout (function () { location.reload (); }, 2000) : undefined;

        socket.on ('connect', function () {
            if (socket.connected) {
                if (reload_) window.clearTimeout (reload_);
                notifyOnTop ('Socket connected to ' + frontUrl, 'green');
                setHTML ('connect', '');
                announce('connect'); // custom event
            } else {
                notifyOnTop("New socket is disconnected :-(", 'red');

            }

        });
        socket.on ('error',      function () {
            notifyOnTop ('status', "Error connecting to socket", 'red');
            announce('socketerror'); // custom event
        });
        socket.on ('disconnect', function () {
            notifyOnTop ("Socket is disconnected", 'red');
            announce('disconnect'); // custom event
        });

    } else {
        notifyOnTop ("Can't connect to socket", 'red');

    }
}

function announce(evtName, domEl){
    var domEl = domEl || $('body');
    domEl.trigger(evtName);
}

function tryLoginAndConnect(dataNum, username, password) {
    var server = tryData[dataNum].server;
    $.ajax({
        method: "POST",
        url: "http://" + server.host + ':' + server.port + "/rest/v1/user/login",
        data: {username: username, password: password}
    })
    .done(function(msg) {
        tryConnect(dataNum, msg.result.token);
    });
}


function tryScenario (dataNum, scenarioNum) {

    var flow = array_ (tryData[dataNum].data[scenarioNum]);

    for (var step of flow) {
        if (step.action === 'connect') {
            tryConnect(dataNum, step.key);

        } if (step.action === 'login_and_connect') {
            tryLoginAndConnect(dataNum, step.key, step.key);

        } else if (step.action === 'request') {
            if (!socket) return;
            if (step.data.length > 1) {
                showMessage ('out: ' + step.key + ' / ' + JSON.stringify (step.data[0]) + ' / ' + JSON.stringify (step.data[1]), 'socketLog', 'brown');
                socket.emit (step.key, step.data[0], step.data[1]);
            } else {
                showMessage ('out: ' + step.key + ' / ' + JSON.stringify (step.data[0]), 'socketLog', 'brown');
                socket.emit (step.key, step.data[0]);
            }
        }
    }
}

function onConnected (message) {
    if (message.userId)   { setHTML ('userId', (userId = message.userId)); }
    if (message.socketId) { setHTML ('socketId', message.socketId); }

}

function onServerError (message) {
    if (message.error) { notifyOnTop (message.error, 'red'); }
}


function setHTML (id, html) {
    if (el = document.getElementById(id)) el.innerHTML = html;
}

function notifyOnTop (message, color) {
    var text = (message && (typeof message == 'object')) ? JSON.stringify (message) : message;
    setHTML ('status', color ? '<font color = "' + color + '">' + text + '</font>' : text);
}

function showMessage (text, type, color) {
    if (color) { $ ('#' + type).append ($ ('<li>').text (text).addClass (color)); }
    else       { $ ('#' + type).append ($ ('<li>').text (text)); }
    ScrollTo ();
}

function clearSocketLog () {
    setHTML ('socketLog', '')
}

function showFormInMethod(name, descr) {
    return '<form class="formData" data-name="' + name + '">' +
                '<div class="formData__name blue">' + name + ': </div>' +
                '<input value="" class="formData__name-input">' +
                '<div class="formData__descr">' + descr + '</div>' +
           '</form>';
}

function showError (text) {
    $ ('#socketLog').append ($ ('<li>').text ('!!! Error: ' + text).css ('color', 'red'));  //
    ScrollTo();
}

function ScrollTo () {
    var el = document.getElementById ("argumentum");
    if (el) {
        // el.scrollTop = el.scrollHeight;  // immediate scroll to end
        $(el).scrollTo('max', 400); // smooth scroll to end
    }
}

function log () {
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
    return (A === null || A === undefined) ? {} : (typeof A !== 'object') ? {}  : ('length' in A) ? {} : A;
}

function array_ (A) {
    return (A === null || A === undefined) ? [] : (typeof A !== 'object') ? [A] : ('length' in A) ? A : [A];
}
