var scenarioNum = 0, idToToggle = 0;

function select(source) {
  var el = document.getElementById(source + '_');
  if (el) selectedKeys[source] = el.options[el.selectedIndex].value;
}

var variants = {};

function showVariants(elem) { 
  var el = document.getElementById('variants');
  if (el) {
    variants = object_(elem);
    var t = '';
  
    for (var s in variants) {
      if (['wsagger', 'info'].indexOf(s) >= 0) continue;   
      var s_      = s.replace(/_$/, ''); 
      var options = Object.keys(object_(variants[s])).map((o) => { return '<option>' + o + '</option>'; }).join('\n');
      t += '<tr><td> Select ' + s_ + ':</td><td><select id="select_' + s + '" onchange="select(\'' + s + '\')">' + options + '</select></td></tr>';
    }
    el.innerHTML = '<table width=100%>' + t + '</table>\n';
  }
}

function showScenario(elem) {  

  jsonData = elem; 
  if (elem._variants) { showVariants(elem._variants); }

  var text = '';
  tryData = {data: {}};

  text += '<div class="wsagger__summary">'
    + '<h5>wsagger</h5> ' +  JSON.stringify (elem.wsagger) + '<br>'
    + '<h5>info</h5> ' + JSON.stringify (elem.info.title) + ' / '  +  JSON.stringify (elem.info.description) + ' / '  +  JSON.stringify (elem.info.version)
    + '</div>';

  text += '<div class="method panel panel-info">';

  text += '<h5 class="method__header panel-heading" data-toggle="collapse" data-target="#'+ idToToggle +'">'
    + '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span>'
    + elem.name
    + '</h5>';

  text += '<div class="method__body" id="'+ idToToggle +'">'; // collapse

  text += '<ul class="method__details">';

  for (var v in elem) {

    var divOrPre = '',
      parametersData = '',
      placeholderData = '';  // using PRE or DIV tag for description

    if (v === 'parameters') {
      divOrPre = 'pre';
      text += '<li class="parameters">';
      for (var i = 0; i < elem[v].length; i++) {
        var itemObj = elem[v][i];
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
    text += parametersData ? parametersData : JSON.stringify (elem[v], null, 2);

    text += '</' + divOrPre + '>';
    text += '</li>';
  }

  text += '</ul>';

  text = text.replace('flow:</h5>', 'flow:</h5><button class="btn btn-xs btn-info btn-try" data-scenarionum="'+scenarioNum+'">Try!</button>');

  tryData.data[scenarioNum] = elem.data;

  text += '</div>';
  text += '</div>';

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

