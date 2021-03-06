if (typeof exports !== 'undefined') {
  (require('fundamentum'))('array_', 'object_', 'string_', 'log', 'error');

  runner_          = require('./runner');
  exports.connect_ = connect_node;

} else {
  http_ = {connect_: connect_ajax};

}

// if (http_.proto == 'https') { options.rejectUnauthorized = false; }
 

function connect_node(proto) {
  var http_ = this;
  init(http_, proto);  
  http_.request = request;
  return http_; 

  function request(runner, step, data_, expected) {   
    var options = inputParameters(runner, step, http_, data_);    
    
    if (!(http_.node_)) { http_.node_ = require(http_.proto); }
    var queryData = options.queryData; delete options.queryData;
    
    var req = http_.node_.request(options, (res) => {
      var responseData = '';
      res.setEncoding('utf8');
      res.on('error', (err)   => { runner._callback(runner, step, undefined, expected, ['/http: ', err]); });
      res.on('data',  (chunk) => { responseData += chunk; });
      res.on('end',   ()      => {
        var data = { status: res.status, statusCode: res.statusCode, headers: res.headers, body: responseData };
        correctCallback(runner, step, data, expected);   
      });
    });
    req.end(queryData, 'utf8');
  }
}

function connect_ajax(proto) {
  var http_ = this;
  init(http_, proto);  
  http_.request = request;

  return http_; 

  function request(runner, step, data_, expected) {
    var options = inputParameters(runner, step, http_, data_);  
    
    /*
    options.url = http_.proto + '://' + options.hostname + (options.port ? ':' + options.port : '') + options.path;
    delete options.hostname; delete options.port; delete options.path;

    $.ajax(options)
    .done((responseData, status, xhr) => {
      var data = { statusCode: xhr.status, status: status, statusText: xhr.statusText, headers: xhr.getAllResponseHeaders(), body: responseData };  
      if (responseData && (typeof responseData === 'object')) { data.parsed = responseData; }
      correctCallback(runner, step, data, expected);

    })
    .fail((xhr, textStatus, errorThrown) => {
      var data = { status: xhr.status, textStatus: textStatus, body: xhr.responseText, headers: xhr.getAllResponseHeaders(), errorThrown: errorThrown };  
      correctCallback(runner, step, data, expected);
    
    });
    */

    var req = newXMLHttpRequest();
    
    req.open(options.method, http_.proto + '://' + options.hostname + (options.port ? ':' + options.port : '') + options.path, true);
    
    // req.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT");  

    for (var h in options.headers) { req.setRequestHeader(h, options.headers[h]); }
 
    // console.error = console.log = function () {alert(JSON.stringify(arguments))};

    try {
       req.send(options.queryData);
    
    } catch (err) {
       error ('/req.send:', err);

    }
    req._checker = setInterval(() => { checkResponse (runner, step, req, expected); }, 100);
  }  
}  

function checkResponse(runner, step, req, expected) {

  if ((req.readyState != 4) || !req._checker) { return; } 
  clearInterval(req._checker);

  log (req);
  var data = { statusCode: (req.status == 0 ? 404 : req.status), status: req.statusText, headers: req.getAllResponseHeaders(), body: req.responseText };  
  correctCallback(runner, step, data, expected);
}


function init(http_, proto) {
  if (proto === 'https') { http_.proto = 'https';}  
  else if (proto)        { http_.proto = 'http';}  
}

function inputParameters(runner, step, http_, data_) {
  data_ = array_(data_); if (!http_.proto) { init(http_, data_.shift()); }

  var data    = object_(data_.shift());
  var headers = object_(data.headers); 

  if (typeof exports !== 'undefined') { headers['User-Agent'] = 'node-XMLHttpRequest'; }
    
  if ((!data.queryData) && data.queryData_) {
    if (!headers['Content-Type']) { options.headers['Content-Type'] = ''; }
    if (typeof data.queryData_ !== 'object') {
      data.queryData = data.queryData_;      

    } else if (headers['Content-Type'].indexOf('application/x-www-form-urlencoded') >= 0) {
      data.queryData = stringifyQuery(data.queryData_);

    } else if (headers['Content-Type'].indexOf('application/form-data') >= 0) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      data.queryData = stringifyQuery(data.queryData_);

    } else {
      data.queryData = JSON.stringify(data.queryData_);
      if (headers['Content-Type'].indexOf('application/json') < 0) { headers['Content-Type'] = 'application/json'; }
    }
  }

  var options = {                                          
    method   : data.method,                                 
    hostname : data.host,                                   
    path     : data.path,                                   
    headers  : headers,
    queryData: string_(data.queryData)
  };                                                       
  if (data.port) { options.port = data.port; }             
  
  runner.debugOut('\n' + runner.id + ' out --> ' + step.action + ':', http_.proto, '\n', options);

  return options;
}   


function correctCallback(runner, step, data, expected) { 
  var contentType = (typeof data.headers === 'string') ? data.headers : data.headers ? string_ (data.headers['content-type']) : '';

  /*
  if (data.body && (typeof data.body === 'object')) {
    data.parsed = data.body;
    delete data.body;
    runner._callback(runner, step, data, expected);

  } else 
  */

  if (contentType.indexOf('application/json') >= 0) {  
    try         { data.parsed = JSON.parse(data.body); runner._callback(runner, step, data, expected); }
    catch (err) { runner._callback(runner, step, data, expected, ['/http (bad response): ', data.body, err]); }          
        
  } else if (contentType.indexOf('application/x-www-form-urlencoded') >= 0) {  
    data.parsed = parseQuery(responseData);
    runner._callback(runner, step, data, expected);       
  
  } else {
    runner._callback(runner, step, data, expected);         

  }
}  

var escape_ = (typeof exports === 'undefined') ? encodeURIComponent : require('querystring').escape;

function stringifyQuery(data) {
  return Object.keys(data).map((k) => (k + '=' + escape_(data[k]))).join('&');
}

function parseQuery(data) {
  if (typeof exports === 'undefined') {
    data = string_(data);
    var result = {}, key, val;
    for (var component of data.split('&')) {
      var eq = component.indexOf('=');
      if (eq >= 0) {
        key = decodeURIComponent(component.substr(0, eq));
        val = decodeURIComponent(component.substr(eq + 1));      
      } else {
        key = decodeURIComponent(component);
        val = undefined; 
      }
      if (result[key] instanceof Array) { result[key].push(val); }
      else if (key in result)           { result[key] = [result[key], val]; }
      else                              { result[key] = val; }
    }
    return result;
  
  } else {
    return require('querystring').parse(data);

  }
}


function newXMLHttpRequest () {
  if (typeof XMLHttpRequest === 'undefined') {
    XMLHttpRequest = function() {
      try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch(e) {}
      try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch(e) {}
      try { return new ActiveXObject("Msxml2.XMLHTTP");     } catch(e) {}
      try { return new ActiveXObject("Microsoft.XMLHTTP");  } catch(e) {}
      throw new Error("This browser does not support XMLHttpRequest.");
    };
  }
  return new XMLHttpRequest();
}


