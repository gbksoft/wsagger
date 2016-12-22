var pages = ['Scenario', 'Scenarios tree'];

var scenario, variants, scenarios_tree;

variants = {
        REST_: {
          loc: {
            proto: "https", 
            host:  "tickertocker-php-backend.ory.gbksoft.net",
            port:  443, 
            path:  "/api" 
          }
        },
   
        user_ : {
          user1: { 
            username: "admin@example.com", 
            password: "DjhjuYtDuflf'!"           
          }
        }      
};

var noVariantsText = '\xA0<br><font color=red>No variants data (REST server, socket server, user, etc.) are loaded!!!</font>';
var noScenarioText = '\xA0<br><font color=red>No scenario is loaded!!!</font>';

$('body').on('click', '.btn-try', () => {
  if (!variants) { 
    $('#Variants').html('<b>' + noVariantsText + '</b>'); 
    return;
  }

  if (!scenario) { 
    $('#Scenario').html('<b>' + noScenarioText + '</b>'); 
    return;
  }

  $('#tab-flow').addClass('active').siblings().removeClass('active').closest('div.status-container')
  .find('div.tabs-content').removeClass('active').eq($(this).index('#tab-flow')).addClass('active')
  ;

  var parameters_ = array_(scenario.parameters_), 
      parameters = {} 
  ;

  /*
  parametersForms = $(this).prev().find('.parameters').find('form')

  updatedParameters = {};

  parametersForms.each(function (ii, el) {
    var newValue = $(el).find('input').val();
    if ((newValue != '') && (newValue != undefined)) { updatedParameters[parameters[ii].name] = newValue; }
    else if (parameters[ii].in != 'formData')        { updatedParameters[parameters[ii].name] = parameters[ii].in; }
    else if ('default_in' in parameters[ii])         { updatedParameters[parameters[ii].name] = parameters[ii].default_in; }
  });
 
  for (var sel of selectors ) select(sel);
  */
  
  tryScenario(variants, ['loc', 'user1'], parameters);

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
       if (el) el.style.visibility = 'visible';
    
    } else {
       menuText += '[<a href=# onclick=selectPage("' + pageName_ + '")>' + page + '</a>] \xA0 '
       if (el) el.style.visibility = 'hidden';

    }  
  }
  // console.log(menuText, $('#page_menu'));

  $('#page_menu').html(menuText);
}

function select(source) {
  var el = document.getElementById(source + '_');
  if (el) selectedKeys[source] = el.options[el.selectedIndex].value;
}

function showVariants(elem) { 
  selectPage('Scenario');
  var el = document.getElementById('Variants');
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
  selectPage('Scenario');

  scenario = elem;  
  if (elem._variants) { showVariants(elem._variants); }

  if (!variants) { $('#Variants').html(noVariantsText); }
   
  var text = '<ul class="method_details">'
    + '\xA0<li><h5><b>wsagger:</b></h5><br>' +  JSON.stringify (elem.wsagger) + '<button class="btn btn-xs btn-info btn-try">Try!</button></li>\xA0'
    + '<li><h5><b>info:</b></h5><br>' + JSON.stringify (elem.info.title) + ' / '  +  JSON.stringify (elem.info.description) + ' / '  +  JSON.stringify (elem.info.version) + '</li>\xA0'
    
  ;

  for (var v in elem) {
    var divOrPre = '',
      parametersData = '',
      placeholderData = '';  // using PRE or DIV tag for description

    if (['wsagger', 'info'].indexOf(v) >= 0) {
      continue;
    
    } else if (v === 'parameters') {
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
    
    } else if (v === 'data') {
      divOrPre = 'pre';
    
    } else {
      divOrPre = 'div';
      text += '<li>';
    }


    text += '<h5><b>' + v + ':</b>' + '</h5>' + '<br>' + '<'+ divOrPre + ' class="method_descr">'
          + (parametersData ? parametersData : JSON.stringify (elem[v], null, 2))
          + '</' + divOrPre + '>'
          + '</li>'
          + ((divOrPre === 'div') ? '\xA0' : '')
    ;

  }

  text += '</ul></div></div>';

  setHTML ('Scenario', text);
  $('#jsonloader').find('.feedback').html( "JSON was loaded successfully" ).delay(1000).fadeOut('slow');

  announce('dombuiltfromjson'); // custom event

  /*
  if (jsonData.autoStart && jsonData.autoStart.length) {
    $('#scenario').find('.method')
      .eq(jsonData.autoStart[0])    // we take 1st item from "autoStart" array
      .find('.method_header').click()
      .siblings('.method_body')
      .find('.btn-try').click();
  }
  */
}

function showFormInMethod(name, descr, placeholder) {
  return '<div><form class="formData" data-name="' + name + '">' 
    + '<span class="formData__name blue">' + name + '</span>' 
    + ' <span class="formData__descr">(' + descr + ')</span>:'
    + '<br><input value="" placeholder="' + placeholder + '" class="formData__name-input">' 
    + '</form></div>';
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
