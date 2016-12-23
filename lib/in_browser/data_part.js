var pages = ['Scenario', 'Expectations', 'Scenarios tree'];

var scenario, variants, expectations, scenarios_tree;

var noVariantsText = '\xA0<br><font color=red>No variants data (REST server, socket server, user, etc.) are loaded!!!</font>';
var noScenarioText = '\xA0<br><font color=red>No scenario is loaded!!!</font>';

$('body').on('click', '.btn-try', () => {
  if (!scenario) { 
    $('#Scenario').html('<b>' + noScenarioText + '</b>'); 
    return;
  }

  if (!(variants || (variants = scenario._variants))) { 
    $('#Variants').html('<b>' + noVariantsText + '</b>'); 
    return;
  }


  $('#tab-flow').addClass('active').siblings().removeClass('active').closest('div.status-container')
  .find('div.tabs-content').removeClass('active').eq($(this).index('#tab-flow')).addClass('active')
  ;

  var formParameters = {};

  if (scenario.parameters_) {
    for (var p of array_(scenario.parameters_)) {
      var value = $('#parameters.' + p.name).val();
      if ((value != undefined) && (value != '')) { formParameters[p.name] = value; }
    }
  }
 
  var selectors = [];

  for (var v in variants) {
    if (['wsagger', 'info'].indexOf(v) >= 0) continue;   
    selectors.push($('#variants_' + v).val());    
  }

  tryScenario(scenario, variants, selectors, formParameters);

});


selectPage('Scenario');

function selectPage(pageName) {
  pageName += '';
  var menuText = '';
  for (var page of pages) {
    var pageName_ = page.replace(' ', '_');
    var el = document.getElementById(pageName_);
    if (pageName_ === pageName) {
      menuText += '[<b>' + page + '</b>] \xA0 '
      if (el) {
        el.style.visibility = 'visible';
        el.style.position   = 'relative';
      }
   
    } else {
      menuText += '[<a href=# onclick=selectPage("' + pageName_ + '")>' + page + '</a>] \xA0 '
      if (el) {
        el.style.visibility = 'hidden';
        el.style.position   = 'absolute';

      }
    }  
  }
  var elV = document.getElementById('Variants');
  if (elV) {
    if (pageName === 'Scenario') {
      elV.style.visibility = 'visible';
      elV.style.position   = 'relative';
    
    } else {
      elV.style.visibility = 'hidden';
      elV.style.position   = 'absolute';

    }
  }

  $('#page_menu').html(menuText);
}

function select(source) {
  var el = document.getElementById(source + '_');
  if (el) selectedKeys[source] = el.options[el.selectedIndex].value;
}

function showVariants(variants) { 
  selectPage('Scenario');
  variants = object_(variants);
  var t = '';
  
  for (var s in variants) {
    if (['wsagger', 'info'].indexOf(s) >= 0) continue;  
    var variantKeys = variants[s] ? (variants[s] instanceof Array) ? variants[s] : Object.keys(object_(variants[s])) : []; 
    var options = variantKeys.map((o) => { return '<option>' + o + '</option>'; }).join('\n');    
    t += '<tr><td> Select ' + s.replace(/_$/, '') + ':</td><td align=right><select style="width:250px;" id="variants_' + s + '" onchange="select(\'' + s + '\')">' + options.replace('<option>', '<option selected>') + '</select></td></tr>';
  }

  $('#Variants').html('<table width=100%>' + t + '</table>\n');
}

function showExpectations(expectations) { 
  expectations = object_(expectations);
  var t = '';
  
  for (var e in expectations) {
    t += '<h5><b>' + e + ':</b></h5><br><pre class="method_descr">'
          + JSON.stringify (expectations[e], null, 2)
          + '\n</pre>\n'
    ;      
  }

  $('#Expectations').html(t);
}


function showScenario(elem) {  
  selectPage('Scenario');

  scenario = elem;  
  if (elem._variants) { showVariants(elem._variants); }

  showExpectations(elem.responses);

  if (!(variants || scenario._variants)) { $('#Variants').html(noVariantsText); }
   
  var text = '<ul class="method_details">'
    + '\xA0<li><h5><b>wsagger:</b></h5><br>' + JSON.stringify (elem.wsagger) + '<button class="btn btn-xs btn-info btn-try">Try!</button></li>\xA0'   
  ;

  if (elem.info) {
    elem.info = object_(elem.info);
    text += '<li><h5><b>info:</b></h5><br>' + JSON.stringify (elem.info.title) + ' / ' + JSON.stringify (elem.info.description) + ' / '  +  JSON.stringify (elem.info.version) + '</li>\xA0';
  }
  
  var parametersData = '';
  
  if (elem.parameters_) {
    parametersData += '<li class="parameters"><h5><b>Parameters:</b></h5><br><pre class="method_descr">';
    for (var i = 0; i < elem.parameters_.length; i++) {
      var itemObj = elem.parameters_[i];

      placeholderData = '';

      parametersData 
        += '<div><form class="formData" data-name="' + itemObj.name + '">' 
        +  '<span class="formData__name blue">' + itemObj.name + '</span>' 
        + ' <span class="formData__descr">('  
          + (itemObj.type ? itemObj.type + ' / ' : '')
          + (itemObj.required ? 'required / ' : '')
          + string_(itemObj.description) 
        + ')</span>:'
        + '<br><input id="parameters.' + itemObj.name + '" value="" placeholder="' + (itemObj.defaultValue ? string_(itemObj.defaultValue) : '') + '" class="formData__name-input">' 
        + '</form></div>';

    }
    parametersData += '</pre></li>';
  }

  for (var v in elem) {
    var divOrPre = '';

    if (['wsagger', 'info', 'scPath', '_variants', 'responses', 'parameters_'].includes(v)) {
      continue;
    
    } else if (v === 'data') {
      divOrPre = 'pre';
    
    } else {
      divOrPre = 'div';
      text += '<li>';
    }


    text += (v === 'data' ? parametersData : '') 
          + '<h5><b>' + v + ':</b></h5><br><'+ divOrPre + ' class="method_descr">'
          + JSON.stringify (elem[v], null, 2)
          + '</' + divOrPre + '>'
          + '</li>'
          + ((divOrPre === 'div') ? '\xA0' : '')
    ;

  }

  text += '</ul></div></div>';


  $('#Scenario').html(text);

  $('#jsonloader').find('.feedback').html( "JSON was loaded successfully" ).delay(1000).fadeOut('slow');

  announce('dombuiltfromjson'); // custom event

}



function showTree(schema) {
  scenarios_tree = schema;
  selectPage('Scenarios_tree');
 
  var text ='',
      title = '';

  title = '<h5>Arbor</h5> ' + schema.arbor + '<br>'
    + '<h5>Info</h5> ' + schema.info.title + ' / ' + schema.info.description + ' / ' + schema.info.version;

  setHTML('schema-info', title);

  text += '<ul class="json-menu">';

  schema.servers.forEach(function(item) {   // for each in JSON/servers

    var serverName = Object.keys(item)[0];
    var modules = item[serverName].modules;

    text += '<li><a>' + serverName + '</a>';

    if (modules && modules.length > 0) {
      text += '<ul class="js-hideElement json-module">';

      modules.forEach(function(item) {

        var moduleName = Object.keys(item)[0];
        var cases = item[moduleName].cases;

        text += '<li><a>' + moduleName + '</a>';

        if (cases && cases.length > 0) {
          text += '<ul class="js-hideElement json-case">';

          cases.forEach(function(item) {
            text += '<li><a href="#">' + item.name + '</a></li>';
          })

          text += '</ul>';
        }

        text += '</li>';

      });
      text += '</ul>';
    }

    text += '</li>';

  });

  text += '</ul>';

  $('#nav').css({ display: "block" });

  setHTML('nav', text);

  // add plus mark to li that have a sub menu
  $('li:has("ul") > a').append('<span class="plusMark">+</span>');
}

$('.json-open input').on('click', function() {
  $('.json-open').submit();
});

$('json-open').submit(function (evt) {

  evt.preventDefault();

  var localOrRemote = $('.json-open').find('input');

  // if (localOrRemote === 'text') {  // if remote JSON

  //   var jsonPromise = $.getJSON($(this).find('.url').val())
  //     .then(jsonLoadSuccessHandler, jsonLoadErrorHandler(localOrRemote));

  // } else {  // if local JSON

  //   var reader = new FileReader();

  //   reader.addEventListener('load', function() {
  //     var json = safelyParseJSON(this.result);
  //     if (json) jsonLoadSuccessHandler(json);
  //   });

  //   var fileObj = $('#jsonloader :file')[0].files[0];

  //   if (fileObj) {
  //     reader.readAsText(fileObj);
  //   } else {
  //     jsonLoadErrorHandler(localOrRemote);
  //   }
  // }
});

//if li has a sub menu
$('#nav').on('click', 'li:has("ul")', function(e) {

  if ($(this).children('a').hasClass('js-openSubMenu')) {

    $(this).children('a').find('.plusMark').empty().html('+');
    $(this).children('a').removeClass('js-openSubMenu');
    $(this).children('ul').removeClass('js-showElement');
    $(this).children('ul').addClass('js-hideElement');
    e.stopPropagation();

  } else {

    $(this).children('a').find('.plusMark').empty().html('-');
    $(this).children('a').addClass('js-openSubMenu');
    $(this).children('ul').removeClass('js-hideElement');
    $(this).children('ul').addClass('js-showElement');
    e.stopPropagation();

  }

});
