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
