bootstrap (io);

var config = {},
    fileInUrl = getUrlParamByName('url'),
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

var selectedKeys = {}, select_ = {}, selectors = [];

function select(source) {
    var el = document.getElementById(source + '_');
    if (el) selectedKeys[source] = el.options[el.selectedIndex].value;
}

function jsonLoadSuccessHandler(res) {  // success callback
    clearSocketLog();
    jsonData = res; // save JSON globally, for future use

    var text = '';
    tryData = {};

    if (select_.REST   = res.REST_)   selectors.push('REST');
    if (select_.server = res.server_) selectors.push('server');
    if (select_.user   = res.user_)   selectors.push('user');
    
    elem = res;
    dataNum = 0;

    tryData[dataNum] = {server: elem.server, data: {}};

    for (var sel of selectors ) {
       var options = Object.keys(res[sel + '_']).map((o) => { return '<option>' + o + '</option>'; }).join('\n');
       document.getElementById('select_' + sel).innerHTML = '<select id="' + sel + '_" onchange="select(\'' + sel + '\')">' + options + '</select>';
       select(sel);
    }


    text += '<div class="wsagger__summary">'
          + '<p><span class="wsagger__title">wsagger</span> ' +  JSON.stringify (elem.wsagger)
          + '<p><span class="wsagger__title">info</span> ' + JSON.stringify (elem.info.title) + ' / '  +  JSON.stringify (elem.info.description) + ' / '  +  JSON.stringify (elem.info.version) 
          + '</div>';

    elem.scenarios.forEach(function(elem, scenarioNum){   // for each in JSON/scenarios

        var idToToggle = 'id' + scenarioNum;

        text += '<div class="method panel panel-info">';

        text += '<h5 class="method__header panel-heading" data-toggle="collapse" data-target="#'+ idToToggle +'">'
                + '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span>'
                + elem.name
                + '</h5>';

        text += '<div class="method__body panel-body " id="'+ idToToggle +'">'; // collapse

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
        // text += '<button class="btn btn-xs btn-info" onclick="select('REST'); select('server'); select('user'); tryScenario ('+ dataNum + ',' + scenarioNum + ')">Try!</button>';
        text += '<button class="btn btn-xs btn-info btn-try" data-datanum="'+dataNum+'" data-scenarionum="'+scenarioNum+'">Try!</button>';
        text += '<span class="red">Pls establish socket connect first</span>';

        text += '</div>';
        text += '</div>';

    });

    setHTML ('data', text);
    $('#jsonloader').find('.feedback').html( "JSON was loaded successfully" ).delay(1000).fadeOut('slow');

    announce('dombuiltfromjson'); // custom event

    // autostart certain scenario (method) of WSagger
    if (jsonData.autoStart && jsonData.autoStart.length) {
        $('#data').find('.method')
            .eq( jsonData.autoStart[0] )    // we take 1st item from "autoStart" array
            .find('.method__header').click()
            .siblings('.method__body')
            .find('.btn-try').click();
    }
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

    // JSON auto-load, if URL query contains file url, like this:   http://wsagger.com/?url=w.json
    if (fileInUrl) {
        $('#jsonloader')
            .find('input[value=text]').prop('checked', true).end()
            .find('.json-url input').val(fileInUrl).end();
        $('#jsonloader').trigger('submit');
    };



    // handler for custom events. Fire on DOM built from JSON, connect and disconnect
    $('body').on('connect disconnect dombuiltfromjson', function (evt) {

        jsonData.scenarios.forEach(function (el, c) {
            if (el.condition === 'connect') {
                $('#data').find('.method')
                            .eq(c)
                            .toggleClass('panel-default panel-info')
                            .find('.btn-try').attr('disabled', function(_, attr){ return !attr});
            }
        });

    });

    // TRY button >>>
    $('body').on('click', '.btn-try', function () {

        var tryDataNum     = $(this).data("datanum"),
            tryScenarioNum = $(this).data("scenarionum");

        var parameters    = elem.scenarios[tryDataNum].parameters, 
        parametersForms   = $(this).prev().find('.parameters').find('form')
        updatedParameters = {};
        
        parametersForms.each(function (ii, el) { 
            var newValue = $(el).find('input').val();
            if ((newValue != '') && (newValue != undefined)) { updatedParameters[parameters[ii].name] = newValue; }
            else if (parameters[ii].in != 'formData')        { updatedParameters[parameters[ii].name] = parameters[ii].in; }
        });

        for (var sel of selectors ) select(sel);

        log (555555, selectors);
        tryScenario(select_, selectedKeys, updatedParameters, tryDataNum, tryScenarioNum);

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

function announce(evtName, domEl){
    var domEl = domEl || $('body');
    domEl.trigger(evtName);
}

function tryLogin(dataNum, proto, host, port, path_, path2, data, callback) {
    var options = {
        method: "POST",
        url: proto + host + ':' + port + path_ + path2,
        data: data
    };
    
    $.ajax(options).done(function(msg) {
        var token = msg.result.token ? msg.result.token : msg.result.accessToken.token;
        callback(dataNum, token);
    });
}


function setHTML(id, html) {
    if (el = document.getElementById(id)) el.innerHTML = html;
}

function getUrlParamByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
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

