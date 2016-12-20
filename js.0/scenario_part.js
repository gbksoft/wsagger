function updateFileTypeSelect() {
  var val = $('#jsonloader input:checked[name=optradio]').val();

  var controls = {
    'text': $('.show-if-json-text').hide(),
    'file': $('.show-if-json-file').hide()
  };

  controls[val].show();
}

function submitInOneTouch () {
  /* --- JSON radio buttons --- */
  $('#jsonloader input[type=radio]').on('change', updateFileTypeSelect);

  $('#jsonloader :file').on('change', function() {
    $('#jsonloader').submit();
  });
}

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

////////////////////

$('.load-schema :file').on('change', function() {
  $('.load-schema').submit();
});

/* JSON Schema loading and parsing >>> */
$('.load-schema').submit(function (evt) {

  evt.preventDefault();

  var reader = new FileReader();

  reader.addEventListener('load', function() {
    var json = safelyParseJSON(this.result);
    if (json) parseSchema(json);
    console.log(json);
  });

  var fileObj = $('.load-schema :file')[0].files[0];

  if (fileObj) {
    reader.readAsText(fileObj);
  }
});

function parseSchema(schema) {

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

