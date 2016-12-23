if (typeof exports !== 'undefined') {
  (require('fundamentum'))('array_', 'object_', 'log', 'error');
  runner_  = require('./runner');
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
    var queryData_ = options.data; delete options.data;
    
    var req = http_.node_.request(options, (res) => {
      var responseData = '';
      res.setEncoding('utf8');
      res.on('error', (err)   => { runner._callback(runner, step, undefined, expected, ['/http: ', err]); });
      res.on('data',  (chunk) => { responseData += chunk; });
      res.on('end',   ()      => {
        var data = { status: res.status, headers: res.headers, body: responseData };
        correctCallback(runner, step, data, expected);   
      });
    });
    req.end(queryData_, 'utf8');
  }
}

function connect_ajax(proto) {
  var http_ = this;
  init(http_, proto);  
  http_.request = request;
  return http_; 

  function request(runner, step, data_, expected) {
    var options = inputParameters(runner, step, http_, data_);    

    // options.type = options.method; 
    options.url  = http_.proto + '://' + options.hostname + (options.port ? ':' + options.port : '') + options.path;
    delete options.hostname; delete options.port; delete options.path;

    $.ajax(options).done((responseData, status, xhr) => {
      var data = { status: status, headers: xhr.getAllResponseHeaders(), body: responseData };  
      correctCallback(runner, step, data, expected);
    });
  }  
}  

function init(http_, proto) {

  log (proto);
  if (proto === 'https') { http_.proto = 'https';}  
  else if (proto)        { http_.proto = 'http';}  
}

function inputParameters(runner, step, http_, data_) {

  data_ = array_(data_);
  if (!http_.proto) { 
    init(http_, data_.shift()); 
  }
  var data = object_(data_.shift());

  var headers = object_(data.headers); headers['User-Agent'] = 'wsagger';
    
  if ((!data.queryData) && data.queryData_) {
    if (!headers['Content-Type']) { options.headers['Content-Type'] = ''; }
    if (typeof data.queryData_ !== 'object') {
      data.queryData = data.queryData_;      

    } else if ((headers['Content-Type'].indexOf('application/x-www-form-urlencoded') >= 0) || (headers['Content-Type'].indexOf('application/form-data') >= 0)) {
      data.queryData = querystring.stringify(data.queryData_);      

    } else {
      data.queryData = JSON.stringify(data.queryData_);
      if (headers['Content-Type'].indexOf('application/json') < 0) { headers['Content-Type'] = 'application/json'; }
    }
  }

  var options = {                                          
    method:   data.method,                                 
    hostname: data.host,                                   
    path:     data.path,                                   
    headers:  headers,
    data:     string_(data.queryData)
  };                                                       
  if (data.port) { options.port = data.port; }             
  
  runner.debug('\n' + runner.id + ' out --> ' + step.action + ':', http_.proto, '\n', options);

  return options;
}   


function correctCallback(runner, step, data, expected) {
  
  if (data.headers['content-type'] && (data.headers['content-type'].indexOf('application/json') >= 0)) {  
    try         { data.parsed = JSON.parse(data.body); runner._callback(runner, step, data, expected); }
    catch (err) { runner._callback(runner, step, data, expected, ['/http (bad response): ', data.body, err]); }          
        
  /*
  } else if (data.headers['content-type'] && (data.headers['content-type'].indexOf('application/x-www-form-urlencoded') >= 0)) {  
    data.parsed = querystring.parse(responseData);
    runner._callback(runner, step, data, expected);       
  */  

  } else {
    runner._callback(runner, step, data, expected);         

  }
}  
