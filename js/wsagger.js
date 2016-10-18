//      var config = {{{frontConfigJson}}};
var config = {
    port: 25780,
    namespace: '/front_space'
};

var data = {};

$('#jsonloader').submit(function (evt) {

    evt.preventDefault();
    $('#jsonloader').find('.error').html("").fadeIn();  // clear error message

    var jsonPromise = $.getJSON( $(this).find('.url').val() )
        .then(
            function(res) {  // success callback
                data = res;
                config.data = res;

                var text   = '', tryNum = 0, tryData = {};

                text += '<b>wsagger</b> <br> <p>' +  JSON.stringify (data.wsagger) + '</p>';
                text += '<b>info</b> <br> '
                        + '<p>'
                        +  JSON.stringify (data.info.title) + '<br>'
                        +  JSON.stringify (data.info.description) + '<br>'
                        +  JSON.stringify (data.info.version) + '<br>'
                        + '</p>';


                    var scenarios = data.scenarios;

                    scenarios.forEach(function(elem, i){
                        text += '<div class="method"><br><h5>' + elem.name + '</h5><br>';

                        var s = elem;
                        for (var v in s) {
                            text += v + ': '+ JSON.stringify (s[v]) + '\n<br>';
                        }

                        tryData[++tryNum] = s.flow;
                        text += '<button class="btn btn-xs btn-info" onclick="tryScenario ('+ tryNum + ')">Try!</button><br></div>';

                    });

                setHTML ('data', text);

                $('#jsonloader').find('.error').html( "JSON was loaded successfully" ).delay(1000).fadeOut('slow');

            },

            function(error) {  // error callback
                console.log(error);
                $('#jsonloader').find('.error').html( "JSON failed to load: URL is probably incorrect" );
            }
        );
});






var frontUrl = 'http://' + window.location.hostname + ':' + config.port + config.namespace;
var groupId  = '';
var groups   = {};

var socket, reload_, iam;

function Connect () {
    if (iam) {
        notifyOnTop ('Друга спроба конекту неможлива :-( Треба перезавантажити сторінку', red);
        return
    }

    iam = true;

    var el       = document.getElementById ("login");
    var login    = el.value;

    var query = {query: "token=" + login};
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
                showMessage ('in: ' + event + ' / ' + JSON.stringify (data), 'socketLog', 'green');
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

function tryScenario (tryNum) {
    if (!socket) return;
    var flow = array_ (tryData[tryNum]);
    log (flow);
    for (var step of flow) {
        if (step[0] === 'request') {
            if (step.length > 3) {
                showMessage ('out: ' + step[1] + ' / ' + JSON.stringify (step[2]) + ' / ' + JSON.stringify (step[3]), 'socketLog', 'brown');
                socket.emit (step[1], step[2], step[3]);
            } else {
                showMessage ('out: ' + step[1] + ' / ' + JSON.stringify (step[2]), 'socketLog', 'brown');
                socket.emit (step[1], step[2]);
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
    if (color) { $ ('#' + type).append ($ ('<li>').text (text).css ('color', color)); }
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
