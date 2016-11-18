bootstrap (io);

var config = {},
  fileInUrl = getUrlParamByName('url'),
  jsonData,
  testElem;

function updateFileTypeSelect() {
  var val = $('#jsonloader input:checked[name=optradio]').val();

  var controls = {
    'text': $('.show-if-json-text').hide(),
    'file': $('.show-if-json-file').hide()
  };

  controls[val].show();
}

$(function(){
  // Initialize on page load
  updateFileTypeSelect();

  /* --- JSON radio buttons --- */
  $('#jsonloader input[type=radio]').on('change', updateFileTypeSelect);

  $('#jsonloader :file').on('change', function() {
    $('#jsonloader').submit();
  });
});

/* JSON loading and parsing >>> */
$('#jsonloader').submit(function (evt) {

  evt.preventDefault();
  clearFeedback();

  var localOrRemote = $('#jsonloader').find('.form-check-inline').find('input:checked').val();

  if (localOrRemote === 'text') {  // if remote JSON

    var jsonPromise = $.getJSON($(this).find('.url').val())
      .then(jsonLoadSuccessHandler, jsonLoadErrorHandler(localOrRemote));

  } else {  // if local JSON

    var reader = new FileReader();

    reader.addEventListener('load', function() {
      var json = safelyParseJSON(this.result);
      if (json) jsonLoadSuccessHandler(json);
    });

    var fileObj = $('#jsonloader :file')[0].files[0];

    if (fileObj) {
      reader.readAsText(fileObj);
    } else {
      jsonLoadErrorHandler(localOrRemote);
    }
  }
});

var selectedKeys = {}, select_ = {}, selectors = [];

function select(source) {
  var el = document.getElementById(source + '_');
  if (el) selectedKeys[source] = el.options[el.selectedIndex].value;
}

function jsonLoadSuccessHandler(elem) {  // success callback
  clearSocketLog();
  jsonData = elem; // save JSON globally, for future use

  var text = '';

  if (select_.REST = elem.REST_) {
    selectors.push('REST');
  }
  if (select_.server = elem.server_) {
    selectors.push('server');
  }
  if (select_.user = elem.user_) {
    selectors.push('user');
  }

  tryData = {data: {}};

  for (var sel of selectors ) {
    var options = Object.keys(elem[sel + '_']).map((o) => { return '<option>' + o + '</option>'; }).join('\n');
    document.getElementById('select_' + sel).innerHTML = '<select id="' + sel + '_" onchange="select(\'' + sel + '\')">' + options + '</select>';
    select(sel);
  }

  text += '<div class="wsagger__summary">'
    + '<p><span class="wsagger__title">wsagger</span> ' +  JSON.stringify (elem.wsagger)
    + '<p><span class="wsagger__title">info</span> ' + JSON.stringify (elem.info.title) + ' / '  +  JSON.stringify (elem.info.description) + ' / '  +  JSON.stringify (elem.info.version)
    + '</div>';

  elem.scenarios.forEach(function(element, scenarioNum) {   // for each in JSON/scenarios

    var idToToggle = 'id' + scenarioNum;

    text += '<div class="method panel panel-info">';

    text += '<h5 class="method__header panel-heading" data-toggle="collapse" data-target="#'+ idToToggle +'">'
      + '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span>'
      + element.name
      + '</h5>';

    text += '<div class="method__body panel-body " id="'+ idToToggle +'">'; // collapse

    text += '<ul class="method__details">';
    var s = element;

    for (var v in s) {

      var divOrPre = '',
          parametersData = '',
          placeholderData = '';  // using PRE or DIV tag for description

      if (v === 'parameters') {
        divOrPre = 'pre';
        text += '<li class="parameters">';
        for (var i = 0; i < s[v].length; i++) {
          var itemObj = s[v][i];
          if (itemObj.hasOwnProperty('in')) {
            if (itemObj.hasOwnProperty('default_in')) {
              placeholderData = itemObj.default_in;
            }
            parametersData += showFormInMethod(itemObj.name, itemObj.description, placeholderData);
          }
        }
      } else {
        divOrPre = 'div';
        text += '<li>';
      }

      if (v === 'flow') {
        divOrPre = 'pre';
      }

      text += '<div class="method__item">' + v + '</div>:' + '<br>' + '<'+ divOrPre + ' class="method__descr">';

      // showing a form if parametersData is exist or show JSON data if not
      text += parametersData ? parametersData : JSON.stringify (s[v], null, 2);

      text += '</' + divOrPre + '>';
      text += '</li>';
    }

    text += '</ul>';

    text = text.replace('flow</div>:', 'flow</div>: <button class="btn btn-xs btn-info btn-try" data-scenarionum="'+scenarioNum+'">Try!</button>');

    tryData.data[scenarioNum] = s.flow;
    // text += '<button class="btn btn-xs btn-info" onclick="select('REST'); select('server'); select('user'); tryScenario (' + scenarioNum + ')">Try!</button>';
    text += '<span class="red">Please establish socket connect first</span>';

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

  testElem = elem;
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

  $('#tab-flow').addClass('active').siblings().removeClass('active').closest('div.status-container')
  .find('div.tabs-content').removeClass('active').eq($(this).index('#tab-flow')).addClass('active');

  var tryScenarioNum = $(this).data("scenarionum");

  var parameters = testElem.scenarios[tryScenarioNum].parameters,
  parametersForms = $(this).prev().find('.parameters').find('form')
  updatedParameters = {};

  parametersForms.each(function (ii, el) {
    var newValue = $(el).find('input').val();
    if ((newValue != '') && (newValue != undefined)) { updatedParameters[parameters[ii].name] = newValue; }
    else if (parameters[ii].in != 'formData')        { updatedParameters[parameters[ii].name] = parameters[ii].in; }
    else if ('default_in' in parameters[ii])         { updatedParameters[parameters[ii].name] = parameters[ii].default_in; }
  });

  for (var sel of selectors ) select(sel);

  tryScenario(select_, selectedKeys, updatedParameters, tryScenarioNum);

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

function tryLogin(proto, host, port, path_, path2, data, callback) {
  var options = {
    method: "POST",
    url: proto + host + ':' + port + path_ + path2,
    data: data
  };

  $.ajax(options).done(function(msg) {
    var token = msg.result.token ? msg.result.token : msg.result.accessToken.token;
    callback(token);
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

function showFormInMethod(name, descr, placeholder) {
  return '<form class="formData" data-name="' + name + '">' +
    '<div class="formData__name blue">' + name + ': </div>' +
    '<input value="" placeholder="' + placeholder + '" class="formData__name-input">' +
    '<div class="formData__descr">' + descr + '</div>' + '</form>';
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

//tabs toggling
$('ul.tabs-caption').on('click', 'li:not(.active)', function() {
  $(this).addClass('active').siblings().removeClass('active').closest('div.status-container')
  .find('div.tabs-content').removeClass('active').eq($(this).index()).addClass('active');
});

function safelyParseJSON (json) {
  var parsed;

  try {
    parsed = jsonlint.parse(json);
    $('.error-message').remove();
  } catch (e) {
    console.error('Error:', e.message);
    $('.show-if-json-file').after($('<div>').text (e.message).css('color', 'red').css('clear', 'both').addClass('error-message'));  // show error info
    setHTML ('data', '');
    $('select').remove();
  }

  return parsed;
}

