(require('fundamentum'))('array_', 'object_', 'log', 'error', 'string_');

////////////////////////////////////////

"use strict";

var fs       = require ('fs'),
    jsonlint = require ('jsonlint')
;    

var origin = fs.readFileSync('0.json', 'utf8');

// var result = JSON.stringify(prepare(jsonlint.parse(origin)));
// var result = JSON.stringify(prepare(jsonlint.parse(origin)), null, 3);

var prepared = prepare(jsonlint.parse(origin)); if (!prepared) return;
var r        = convert(prepared);

fs.writeFileSync('0.index.json', JSON.stringify(r.index, null, 3));
for (var scenario of r.scenarios) fs.writeFileSync(scenario.key + '.wsagger.json', JSON.stringify(scenario, null, 3));

function convert(prepared) {
  var r = {index: {}, scenarios: []}, scenarioNum = 0, prefix = '0000'; 
  for (var ps of prepared.scenarios) {
    var sn  = '' + ++scenarioNum;
    var key = prefix.substr(sn.length) + sn + (ps.operationId ? '.' + ps.operationId : '');
    r.index[key] = {tags: ps.tags};

    var sc = {
      wsagger: "1.0.0", 
      origin: { type: prepared.origin, info: prepared.info }, 
      name: ps.summary,
      description: ps.description,
      data: []
    }; 

    var d = {
      action: prepared.variants.schemes[0] + '.request',
      data: {
        method: ps.method.toUpperCase(), 
        host: "{{REST.host}}", 
        port: "{{REST.port}}", 
        path: prepared.parameters.basePath + ps.path, 
        headers: {},
        queryData: ''
      },          
      wait: {delay: 3000},     
      // expected: { "result": { "accessToken": {"token": "{{!token}}"}}}

    };

    if (ps.consumes && ps.consumes.length) d.data.headers['Content-Type'] = ps.consumes[0];
    if (ps.produces && ps.produces.length) d.data.headers['Accept']       = ps.produces[0];

    sc.data.push(d);

    r.scenarios.push(sc);
  }
  return r;
}

function prepare(data) {
  var prepared = {  
    scenarios:   [ ],        
    variants:    { schemes: ['http'] },
    parameters:  { basePath: '' },
    definitions: { }
  }; 
   
  try {
    for (var key in data) {
      if (key === 'swagger') {
        prepared.origin = ['swagger', data.swagger];
      
      } else if (key === 'info') {
        prepared.info = object_(data.info);

      } else if (key === 'basePath') {
        prepared.parameters.basePath = string_(data.basePath);

      } else if (key === 'schemes') {
      	prepared.variants.schemes = array_(data.schemes);

      } else if (key === 'paths') {
      	preparePaths(object_(data.paths), prepared.scenarios);

      } else if (key === 'definitions') {
        prepared.definitions = data.definitions;
    
      } else {
        error('/prepare: ', { error: 'bad top key', key: key, value: data[key] });
        return;

      }
    }
  
  } catch (err) {
    error('/prepare: ', err.name, err.message, err);
    return;

  }

  return prepared;
}

function	preparePaths(paths, scenarios) {
  for (var path in paths) {
    log(path);
    for (var method in paths[path]) {
      log(method);
      
      var scenario = {path: path, method: method, parameters: [], responses: {}};
      var s0 = paths[path][method];
      for (var key in s0) {
        if (['summary', 'description', 'operationId'].indexOf(key) >= 0) {
          scenario[key] = s0[key];

        } else if (['tags', 'consumes', 'produces'].indexOf(key) >= 0) {
          scenario[key] = array_(s0[key]);

        } else if (key === 'parameters') {
          prepareParameters(array_(s0.parameters), scenario.parameters);

        } else if (key === 'responses') {
          prepareResponses(s0.responses, scenario.responses);

        } else {
          throw new Error(JSON.stringify({ error: 'bad key in /[[' + path + ']]/[[' + method + ']]/', key: key, value: s0[key] }));
        
        }
      } 
      scenarios.push(scenario);

      // log(scenarios);
    }   
  }
}


function  prepareParameters(parameters0, parameters) {
  for (var p0 of parameters0) {
    var p = {};
    for (var key in p0) {
      if (['in', 'name', 'type', 'enum', 'required', 'description', 'schema'].indexOf(key) >= 0) {
        p[key] = p0[key];

      } else {
        throw new Error(JSON.stringify({ error: 'bad key in parameter', parameter: p0, key: key, value: p0[key] }));
      
      } 
    }   
    parameters.push(p);
  }
}


function prepareResponses(responses0, responses) {
  if (!(responses && (typeof responses == 'object'))) throw new Error(JSON.stringify({ error: 'bad responses', responses: responses }));    
  
  for (var rk in responses0) {
    var r = {}, r0 = responses0[rk];
    if (!(r0 && (typeof r0 == 'object'))) throw new Error(JSON.stringify({ error: 'bad response type', key: rk, value: responses[rk] }));    

    for (var key in r0) {
      if (['schema', 'description'].indexOf(key) >= 0) {
        r[key] = r0[key];

      } else {
        throw new Error(JSON.stringify({ error: 'bad key in response', key: key, value: r0[key] }));
      
      } 
    }   
    responses[rk] = r;
  }
}

/*
var data0 = {
   				{ 
   					"schema": {
   						"properties": {
   							"connection_id": {
   							   "type": "string"
   							}
   						}
   					}
   				}

*/