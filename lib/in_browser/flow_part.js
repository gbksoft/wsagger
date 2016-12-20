$('.filters').on('click', 'input', function(){
  var color = $(this).val();
  $('#argumentum').toggleClass('hide-' + color);
});

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

// TRY button
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
