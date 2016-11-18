bootstrap (io);

var config = {},
  fileInUrl = getUrlParamByName('url'),
  jsonData,
  testElem;

$(function(){
  // Initialize on page load
  updateFileTypeSelect();
  submitInOneTouch();
});

var selectedKeys = {}, select_ = {}, selectors = [];

function select(source) {
  var el = document.getElementById(source + '_');
  if (el) selectedKeys[source] = el.options[el.selectedIndex].value;
}

function jsonLoadErrorHandler(error) {  // error callback
  var message =  (error === "text")? 'Incorrect URL' : 'File not selected';
  $('#jsonloader').find('.feedback').html(message);
}

function clearFeedback(){
  $('#jsonloader').find('.feedback').html("").fadeIn(); // clear JSON message
}

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

//tabs toggling
$('ul.tabs-caption').on('click', 'li:not(.active)', function() {
  $(this).addClass('active').siblings().removeClass('active').closest('div.status-container')
  .find('div.tabs-content').removeClass('active').eq($(this).index()).addClass('active');
});
