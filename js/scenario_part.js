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
