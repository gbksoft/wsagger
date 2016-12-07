(require('fundamentum'))('array_', 'object_', 'log', 'error', 'string_');

////////////////////////////////////////

"use strict";

var fs          = require ('fs'),
    jsonlint    = require ('jsonlint'),
    querystring = require('querystring')
;    

var simplyMovedKeys = ['name', 'type', 'enum', 'format', 'required', 'description', 'default'];

var origin   = fs.readFileSync('0.json', 'utf8');
var prepared = prepare(jsonlint.parse(origin)); if (!prepared) return;
var r        = convert(prepared, {'REST.host': 'gambling-game-api.dev.gbksoft.net' });

fs.writeFileSync('0.index.json', JSON.stringify(r.index, null, 3));
for (var scenario of r.scenarios) fs.writeFileSync(scenario.url, JSON.stringify(scenario, null, 3));



//////////////////////////////////////////////////////////////////////

function convert(prepared, options0) {
  var r = {index: {}, scenarios: []}, scenarioNum = 0, prefix = '0000'; 
  for (var ps of prepared.scenarios) {
    var sn   = '' + ++scenarioNum;
    var url  = prefix.substr(sn.length) + sn + (ps.operationId ? '.' + ps.operationId : '')  + '.wsagger.json';
    var name = ps.summary ? ps.summary : url;

    r.index[url] = {
      tags: ps.tags,
      name: name
    };

    var sc = {
      wsagger    : "1.0.0", 
      origin     : { type: prepared.origin, info: prepared.info }, 
      name       : name,
      data       : [],
      url        : url,
      parameters : []
    }; 

    if (ps.description) { sc.description = ps.description; r.index[url].description = ps.description; }

    var d = {
      action: prepared.variants.schemes[0] + '.request',
      data: {
        method    : ps.method.toUpperCase(), 
        host      : options0['REST.host'], 
        path      : prepared.parameters.basePath + ps.path + '', 
        headers   : {},
        queryData : ''    
      },          
      wait: { delay: 3000 },
      // expected: { "result": { "accessToken": {"token": "{{!token}}"}}}

    };

    var p_ = {};

    for (var p of ps.parameters) { 
      if (!(p.in in p_)) p_[p.in] = {};
      (p.in === 'body' ? convertBodyParameter : convertParameter)(p, sc.parameters, p_[p.in]); 
    }

    if (p_.path)  { d.data.path = d.data.path.replace(/\{[^}]*\}/g, (x) => { x = x.substr(1, x.length - 2); return (x in p_.path) ? p_.path[x] : '{' + x + '}'; }); }
    if (p_.query) { d.data.path += '?' + querystring.stringify(p_.query); }
    if (p_.body)  { d.data.queryData_ = p_.body; }

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
          prepareResponses(s0.responses, scenario.responses, path, method, key);

        } else {
          throw new Error(JSON.stringify({ error: 'bad key in /[[' + path + ']]/[[' + method + ']]/', key: key, value: s0[key] }));
        
        }
      } 
      scenarios.push(scenario);

      // log(scenarios);
    }   
  }
}

function convertParameter(p0, parameters, p__) { 

  var p = { name: p0.name }; 
  for (var k of simplyMovedKeys.concat(['schema'])) { 
    // ??? but other

    if (k in p0) { p[k] = p0[k]; } 
  }  

  parameters.push(p);
  p__[p.name] = '{{' + p.name + '}}';
   
  // if (p0.in === 'body') 
  // { "name": "messageText", "in": "2_send_message_messageText" }

} 

function convertBodyParameter(p0, parameters, p__) { 

  if (p0.schema && (typeof p0.schema === 'object') && p0.schema.properties && (typeof p0.schema.properties === 'object')) {
    var schema = p0.schema; delete p0.schema;
    for (var p in schema.properties) {
      var pp = schema.properties[p];
      p0_ = p0;
      for (var k of simplyMovedKeys.concat(['schema'])) { 
        // ??? but other
        
        if (k in pp) { p0_[k] = pp[k]; } 
        else         { delete p0_[k]; }

      }  

      p0_.name = p;                                                 // !!! on last step only
      convertParameter(p0_, parameters, p__)
    }

  } else {
     convertParameter(p0, parameters, p__)

   }
}

function prepareParameters(parameters0, parameters) {

  for (var p0 of parameters0) {
    var p = {};
    for (var key in p0) {
      if (key === 'in') {
        p[key] = p0[key];
      
      } else if (simplyMovedKeys.indexOf(key) >= 0) {
        p[key] = p0[key];

      } else if (key === 'schema') {
        prepareParameterSchema(p0.schema, p.schema = {}, p0);

      } else {
        throw new Error(JSON.stringify({ error: 'bad key in parameter', parameter: p0, key: key, value: p0[key] }));
      
      } 
    }   

    if (('schema' in p) && (('type' in p) || ('enum' in p))) {
      throw new Error(JSON.stringify({ error: 'bad keys set (schema, type, enum) in parameter', parameter: p }));
       
    } else if (!('name' in p)) {
      throw new Error(JSON.stringify({ error: 'no name in parameter', parameter: p }));

    } else if (!(('schema' in p) || ('type' in p) || ('enum' in p))) {
      throw new Error(JSON.stringify({ error: 'no keys set (schema, type, enum) in parameter', parameter: p }));

    }

    parameters.push(p);
  }
}

function prepareParameterSchema(schema0, schema, p0) {
  if (!(schema0 && (typeof schema0 === 'object'))) throw new Error(JSON.stringify({ error: 'bad parameter schema', parameter: p0 }));    
  
  for (var k in schema0) {
    if ((k === 'properties') && schema0[k] && (typeof schema0[k] === 'object')) {
      schema.properties = {};
      for (var name in schema0.properties) {
        var sch_ = schema0.properties[name];
        if (sch_ && (typeof sch_ === 'object')) {
          schema.properties[name] = {};
          
          for (var key in sch_) {
            if (['type', 'enum', 'required', 'description', 'format'].indexOf(key) >= 0) {
              schema.properties[name][key] = sch_[key];

            } else {
              throw new Error(JSON.stringify({ error: 'bad key in parameter schema properties', parameter: p0, name: name, key: key }));
      
            } 
          }

        } else {
          throw new Error(JSON.stringify({ error: 'bad object in parameter schema properties', schema: schema0, name: name }));
        
        }  
      }

    } else if ((k === "type") && (schema0[k] === 'object')) {

    } else if (k === "$ref") {
      schema[k] = schema0[k];

    } else if (k === 'required') {
      schema[k] = schema0[k];

    } else if (['format'].indexOf(k) >= 0) {
      schema[k] = schema0[k];


    } else {
      throw new Error(JSON.stringify({ error: 'bad key in parameter schema', schema: schema0, key: k }));

    }
  }

}


function prepareResponses(responses0, responses, path, method, key) {
  if (!(responses0 && (typeof responses0 === 'object'))) throw new Error(JSON.stringify({ error: 'bad responses', path: path, method: method, key: key, responses: responses0 }));    
  
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