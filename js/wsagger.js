var config = {}, tryData = {};

$('#jsonloader').on('change', 'input[type=radio]', function(){
    var val = $(this).val();
    $('div.json-url').find('input').attr({'type':val});


});

$('#jsonloader').submit(function (evt) {

    evt.preventDefault();
    $('#jsonloader').find('.feedback').html("").fadeIn();  // clear error message

    var localOrRemote = $('#jsonloader').find('.json-url').find('input').attr('type');
    console.log(localOrRemote);


    if (localOrRemote === 'text') {  // if remote JSON

        var jsonPromise = $.getJSON( $(this).find('.url').val() )
            .then( jsonLoadSuccessHandler,jsonLoadErrorHandler );

    } else {  // if local JSON

        var reader = new FileReader();
        reader.addEventListener('load', function() {
            jsonLoadSuccessHandler(JSON.parse(this.result));
        });
        reader.readAsText(document.forms[0][2].files[0]);
    }

});

function jsonLoadSuccessHandler(res) {  // success callback
    clearSocketLog();

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

        elem.scenarios.forEach(function(elem, scenarioNum){
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
                text += '<li>'
                    + '<div class="method__item">' + v + '</div>:<br>'
                    + '<'+ divOrPre + ' class="method__descr">';
                if (hasFormdata) {    // we either show a form...
                    text += showFormInMethod( s[v][0].name, s[v][0].description );
                } else {              // or show JSON data
                    text += JSON.stringify (s[v], null, 2);
                }

                text += '</' + divOrPre + '>';
                text += '</li>';
            }

            text += '</ul>';

            tryData[dataNum].data[scenarioNum] = s.flow;
            text += '<button class="btn btn-xs btn-info" onclick="tryScenario ('+ dataNum + ',' + scenarioNum + ')">Try!</button>';

            text += '</div>';
            text += '</div>';

        });

        text += '</li>';

    // });

    setHTML ('data', text);
    $('#jsonloader').find('.feedback').html( "JSON was loaded successfully" ).delay(1000).fadeOut('slow');

}

function jsonLoadErrorHandler(error) {  // error callback
    console.log(error);
    $('#jsonloader').find('.feedback').html( "JSON didn't load: URL is probably incorrect" );
}

/* FILTERS section */

$('.filters').on('click', 'input', function(){
    var color = $(this).val();
    $('#argumentum').toggleClass('hide-' + color);
});

$('body').on('click', '.method__header', function(){
    $(this).find('span').toggleClass('glyphicon-plus glyphicon-minus');
});


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

            } else {
                notifyOnTop("New socket is disconnected :-(", 'red');

            }

        });
        socket.on ('error',      function () { notifyOnTop ('status', "Error connecting to socket", 'red'); });
        socket.on ('disconnect', function () { notifyOnTop ("Socket is disconnected",               'red'); });

    } else {
        notifyOnTop ("Can't connect to socket", 'red');

    }
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
    return '<form class="formData">' +
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
