var config = {}, tryData = {};

$('#jsonloader').submit(function (evt) {

    evt.preventDefault();
    $('#jsonloader').find('.feedback').html("").fadeIn();  // clear error message

    var jsonPromise = $.getJSON( $(this).find('.url').val() )
        .then(
            function(res) {  // success callback
                clearSocketLog();

                var text = '';
                tryData = {};

                res.forEach(function (elem, dataNum) {  // for each in JSON
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

                            text += '<div class="method_body panel-body collapse" id="'+ idToToggle +'">';

                                text += '<ul class="method__details">';
                                    var s = elem;

                                    for (var v in s) {
                                        var divOrPre = (v === 'parameters' || v === 'flow')? 'pre' : 'div'; // use PRE or DIV tag for description
                                        text += '<li>'
                                            + '<div class="method__item">' + v + '</div>: '
                                            + '<'+ divOrPre + ' class="method__descr">'
                                                + JSON.stringify (s[v], null, 2)
                                            + '</' + divOrPre + '>'
                                            + '</li>';
                                    }

                                text += '</ul>';

                                tryData[dataNum].data[scenarioNum] = s.flow;
                                text += '<button class="btn btn-xs btn-info" onclick="tryScenario ('+ dataNum + ',' + scenarioNum + ')">Try!</button>';

                            text += '</div>';
                        text += '</div>';

                    });

                    text += '</li>';

                });

                setHTML ('data', text);
                $('#jsonloader').find('.feedback').html( "JSON was loaded successfully" ).delay(1000).fadeOut('slow');

            },

            function(error) {  // error callback
                console.log(error);
                $('#jsonloader').find('.feedback').html( "JSON didn't load: URL is probably incorrect" );
            }
        );
});

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
        notifyOnTop ('Друга спроба конекту неможлива :-( Треба перезавантажити сторінку', red);
        return
    }

    iam = true;

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

function tryScenario (dataNum, scenarioNum) {

    var flow = array_ (tryData[dataNum].data[scenarioNum]);

    for (var step of flow) {
        if (step.action === 'connect') {
            tryConnect(dataNum, step.key);

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

function showError (text) {
    $ ('#socketLog').append ($ ('<li>').text ('!!! Error: ' + text).css ('color', 'red'));  //
    ScrollTo();
}

function ScrollTo () {
    var el = document.getElementById ("argumentum");
    if (el) {
        var delta = el.offsetHeight + el.offsetTop - window.innerHeight;
        if (delta > -10) window.scrollTo(0, delta + 10);
        // log(el.offsetHeight, el.offsetTop, window.innerHeight);
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
