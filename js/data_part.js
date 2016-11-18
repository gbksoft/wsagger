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
    + '<h5>wsagger</h5> ' +  JSON.stringify (elem.wsagger) + '<br>'
    + '<h5>info</h5> ' + JSON.stringify (elem.info.title) + ' / '  +  JSON.stringify (elem.info.description) + ' / '  +  JSON.stringify (elem.info.version)
    + '</div>';

  elem.scenarios.forEach(function(element, scenarioNum) {   // for each in JSON/scenarios

    var idToToggle = 'id' + scenarioNum;

    text += '<div class="method panel panel-info">';

    text += '<h5 class="method__header panel-heading" data-toggle="collapse" data-target="#'+ idToToggle +'">'
      + '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span>'
      + element.name
      + '</h5>';

    text += '<div class="method__body" id="'+ idToToggle +'">'; // collapse

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

      text += '<h5>' + v + ':' + '</h5>' + '<br>' + '<'+ divOrPre + ' class="method__descr">';

      // showing a form if parametersData is exist or show JSON data if not
      text += parametersData ? parametersData : JSON.stringify (s[v], null, 2);

      text += '</' + divOrPre + '>';
      text += '</li>';
    }

    text += '</ul>';

    text = text.replace('flow:</h5>', 'flow:</h5><button class="btn btn-xs btn-info btn-try" data-scenarionum="'+scenarioNum+'">Try!</button>');

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
      .eq(jsonData.autoStart[0])    // we take 1st item from "autoStart" array
      .find('.method__header').click()
      .siblings('.method__body')
      .find('.btn-try').click();
  }

  testElem = elem;
}

function showFormInMethod(name, descr, placeholder) {
  return '<form class="formData" data-name="' + name + '">' +
    '<div class="formData__name blue">' + name + ': </div>' +
    '<input value="" placeholder="' + placeholder + '" class="formData__name-input">' +
    '<div class="formData__descr">' + descr + '</div>' + '</form>';
}
