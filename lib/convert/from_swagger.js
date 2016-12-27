(require('fundamentum'))('array_', 'object_', 'log', 'error', 'string_');

////////////////////////////////////////

"use strict";

let fs          = require('fs'),
    jsonlint    = require('jsonlint'),
    url         = require('url'),
    querystring = require('querystring'),
    lib         = require('../lib')
;    

let simplyMovedKeys = ['name', 'type', 'enum', 'format', 'required', 'description', 'default'];
let loginActionPath = 'login';
let loginAction = {
  action  : "call.callWsaggerFile",
  data    : [ './' + loginActionPath + '.wsagger.json', "{{REST.proto}}", "{{REST.host}}", "{{REST.port}}", "{{REST.path}}", "{{user.username}}", "{{user.password}}" ],
  wait    : { delay: 3000 }, 
  expected: { token: "{{!token}}" }
};

let origin   = fs.readFileSync('swagger.json', 'utf8');
let variants = object_(lib.loadObject('_variants.json'));  
let options0 = { 'url': 'https://gambling-game-api.dev.gbksoft.net/swagger/'};

if (!options0.loginPaths) options0.loginPaths = ['/v1/users/login', '/user/login'];

let prepared = prepare(jsonlint.parse(origin)); if (!prepared) { log('/!prepared'); return; }  
prepared.definitions = object_(prepared.definitions);

fs.writeFileSync(
  '_definitions.json', 
  JSON.stringify(prepared.definitions, null, 3)
);

if (prepared.securityDefinitions) {
  fs.writeFileSync(
    '_securityDefinitions.json', 
    JSON.stringify(prepared.securityDefinitions, null, 3)
  );
}

let r = convert(prepared, variants, options0);
fs.writeFileSync(
  'index.json', 
  JSON.stringify(r.index, null, 3)
);

let index = '';
for (let path in r.index) {
  if (path === 'wsagger') { continue; }
  item = object_(r.index[path]);
  index += '\n<p><b>' + array_(item.tags).join(', ') + ':</b> <a href="http://wsagger.dev.gbksoft.net/?url=' + path + '">' + item.name + ' / ' + path + '</a> ' + string_(item.description) + '</p>\n'; 
}

let info = object_(prepared.info);
fs.writeFileSync(
  'index.html',
  '<html><head><title>' + string_(info.title) + '/' + string_(info.version) + '/' + string_(info.description) + '</title></head><body>' + index + '</body></html>'
);

for (let scenario of r.scenarios) {
  for (let key in r._variants) {
    if (!(key in scenario._variants)) { scenario._variants[key] = r._variants[key]; }
  }
  fs.writeFileSync(scenario.scPath, JSON.stringify(scenario, null, 3));
}


//////////////////////////////////////////////////////////////////////



function convert(prepared, variants, options0) {
  let scenarioNum = 0, prefix = '0000'; 
  let r = {
    _variants : object_(variants),
    index    : { wsagger: 'index' }, 
    scenarios: []
  }; 
  
  for (let k in prepared._variants) { r._variants[k] = prepared._variants[k]; }
  addRESTUrl(r, prepared, options0);
  
  for (let ps of prepared.scenarios) {
    let sn     = '' + ++scenarioNum;
    let scPath = (options0.loginPaths.includes(ps.path) ? loginActionPath : (prefix.substr(sn.length) + sn + (ps.operationId ? '.' + ps.operationId : ''))) 
               + '.wsagger.json';
    
    let name   = ps.summary ? ps.summary : scPath;

    r.index[scPath] = {
      tags: ps.tags,
      name: name
    };

    let sc = {
      wsagger    : "1.0.0", 
      origin     : { type: prepared.origin, info: prepared.info }, 
      name       : name,
      data       : [],
      scPath     : scPath,
      _variants  : {},
      parameters_: [],
      responses  : insertDefinitions(insertDefinitions(ps.responses, prepared.definitions), prepared.definitions)
      // !!! recoursion is required (restricted, to prevent cycles)
    }; 

    if (ps.description) { sc.description = ps.description; r.index[scPath].description = ps.description; }

    let headers = {};
    let d = {
      action: 'http_.request',
      data: [
        "{{REST.proto}}",
        {
          method    : ps.method.toUpperCase(), 
          host      : '{{REST.host}}',
          path      : prepared.basePath + ps.path, 
          headers   : headers,
          queryData : ''    
        }
      ],          
      wait: { delay: 3000 },
      expected: { }

    };

    let p_ = {};

    for (let p of ps.parameters_) { 
      if (!(p.in in p_)) p_[p.in] = {};
      (p.in === 'body' ? convertBodyParameter : convertParameter)(p, sc.parameters_, p_[p.in], options0.loginPaths.includes(ps.path)); 
    }

    if (p_.formData) {
       let target = (ps.method.toUpperCase() === 'GET') ? 'query' : 'body';
       if (!p_[target]) { p_[target] = {}; }
       for (let k in p_.formData) { if (!(k in p_[target])) { p_[target][k] = p_.formData[k]; } }
    }
    if (p_.path)  { d.data[1].path = d.data[1].path.replace(/\{[^}]*\}/g, (x) => { x = x.substr(1, x.length - 2); return (x in p_.path) ? p_.path[x] : '{' + x + '}'; }); }
    if (p_.query) { d.data[1].path += '?' + querystring.stringify(p_.query); }
    if (p_.body)  { d.data[1].queryData_ = p_.body; }

    if (ps.consumes) {
      if      (ps.consumes.length >  1) { headers['Content-Type'] = '{{Content-Type}}'; sc._variants['Content-Type'] = ps.consumes; } 
      else if (ps.consumes.length == 1) { headers['Content-Type'] = ps.consumes[0]; }
    }
    
    if (ps.produces) {
      if      (ps.produces.length >  1) { headers['Accept'] = '{{Accept}}'; sc._variants['Accept'] = ps.produces; } 
      else if (ps.produces.length == 1) { headers['Accept'] = ps.produces[0]; }
    }

    if (options0.loginPaths.includes(ps.path)) {

      // !!! kostyl !!!

      /*
      if      (!d.expected.parsed)                          { d.expected.parsed = { result: {'accessToken': {'token': '{{!token}}'}}}; } 
      if      (!d.expected.parsed.result)                   { d.expected.parsed.result = { 'accessToken': {'token': '{{!token}}'}}; } 
      else if (!d.expected.parsed.result.accessToken)       { d.expected.parsed.result.accessToken = {'token': '{{!token}}'}; }
      else if (!d.expected.parsed.result.accessToken.token) { d.expected.parsed.result.accessToken.token = '{{!token}}'; }
      */

      if      (!d.expected.parsed)              { d.expected.parsed = { result: { 'token': '{{!token}}'}}; } 
      if      (!d.expected.parsed.result)       { d.expected.parsed.result = { 'token': '{{!token}}'}; } 
      else if (!d.expected.parsed.result.token) { d.expected.parsed.result.token = '{{!token}}'; }
      
      // !!! kostyl finished !!!


      sc.keysIn  = [ "REST.proto", "REST.host", "REST.port", "REST.path", "user.username", "user.password" ];
      sc.dataOut = [ "token" ];

    } else {
      sc.data.push(loginAction);
      headers.Authorization = "Bearer {{token}}";

    }  
    sc.data.push(d);

    r.scenarios.push(sc);
  }
  return r;
}

function prepare(data) {
  let prepared = {  
    scenarios  : [ ],        
    _variants  : { proto: ['http'] } ,
    basePath   : '',
    definitions: { }
  }; 
   
  try {
    for (let key in data) {
      if (key === 'swagger') {
        prepared.origin = ['swagger', data.swagger];
      
      } else if (key === 'info') {
        prepared.info = object_(data.info);

      } else if (key === 'basePath') {
        prepared.basePath = string_(data.basePath);

      } else if (key === 'schemes') {
      	let schemes = array_(data.schemes);
        if (schemes.length) { prepared._variants.proto = schemes; }

      } else if (key === 'paths') {
      	preparePaths(object_(data.paths), prepared.scenarios);

      } else if (key === 'definitions') {
        prepared.definitions = data.definitions;

      } else if (key === 'securityDefinitions') {
        prepared.securityDefinitions = data.securityDefinitions;
    
      } else if (!(['tags'].includes(key))) {
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
  for (let path in paths) {
    log(path);
    for (let method in paths[path]) {
      log(method);
      
      let scenario = {path: path, method: method, parameters_: [], responses: {}};
      let s0 = paths[path][method];
      for (let key in s0) {
        if (['summary', 'description', 'operationId'].indexOf(key) >= 0) {
          scenario[key] = s0[key];

        } else if (['tags', 'consumes', 'produces'].indexOf(key) >= 0) {
          scenario[key] = array_(s0[key]);

        } else if (key === 'parameters') {
          prepareParameters(array_(s0.parameters), scenario.parameters_);

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

function convertParameter(p0, parameters_, p__, correctName) { 

  let p = { name: p0.name }; 
  for (let k of simplyMovedKeys.concat(['schema'])) { 
    // ??? but other

    if (k in p0) { p[k] = p0[k]; } 
  }  

  if (correctName) {
    if (p.name === 'email')         { p.name = 'user.username'; p.name_= 'email'; }
    else if (p.name === 'password') { p.name = 'user.password'; p.name_= 'password'; }
  }

  parameters_.push(p);
  p__[p.name_ ? p.name_ : p.name] = '{{' + p.name + '}}';
   
} 

function convertBodyParameter(p0, parameters_, p__, correctName) { 

  if (p0.schema && (typeof p0.schema === 'object') && p0.schema.properties && (typeof p0.schema.properties === 'object')) {
    let schema = p0.schema; delete p0.schema;
    for (let p in schema.properties) {
      let pp = schema.properties[p];
      p0_ = p0;
      for (let k of simplyMovedKeys.concat(['schema'])) { 
        // ??? but other
        
        if (k in pp) { p0_[k] = pp[k]; } 
        else         { delete p0_[k]; }

      }  

      p0_.name = p;                                                 // !!! on last step only
      convertParameter(p0_, parameters_, p__, correctName)
    }

  } else {
     convertParameter(p0, parameters_, p__, correctName)

   }
}

function prepareParameters(parameters0, parameters_) {

  for (let p0 of parameters0) {
    let p = {};
    for (let key in p0) {
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

    parameters_.push(p);
  }
}

function prepareParameterSchema(schema0, schema, p0) {
  if (!(schema0 && (typeof schema0 === 'object'))) throw new Error(JSON.stringify({ error: 'bad parameter schema', parameter: p0 }));    
  
  for (let k in schema0) {
    if ((k === 'properties') && schema0[k] && (typeof schema0[k] === 'object')) {
      schema.properties = {};
      for (let name in schema0.properties) {
        let sch_ = schema0.properties[name];
        if (sch_ && (typeof sch_ === 'object')) {
          schema.properties[name] = {};
          
          for (let key in sch_) {
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
  
  for (let rk in responses0) {
    let r = {}, r0 = responses0[rk];
    if (!(r0 && (typeof r0 == 'object'))) throw new Error(JSON.stringify({ error: 'bad response type', key: rk, value: responses[rk] }));    

    for (let key in r0) {
      if (['schema', 'description'].indexOf(key) >= 0) {
        r[key] = r0[key];

      } else {
        throw new Error(JSON.stringify({ error: 'bad key in response', key: key, value: r0[key] }));
      
      } 
    }   
    responses[rk] = r;
  }
}

function addRESTUrl(r, prepared, options0) {
  if (options0.url && (typeof options0.url === 'string')) {

    let urlObject = url.parse(options0.url);
    let host = (urlObject ? urlObject.hostname : undefined);
    
    r._variants = object_(r._variants);

    if (host) {
      r._variants.REST_ = object_(r._variants.REST_);
      if (0 >= Object.keys(r._variants.REST_).filter((k) => { return string_(r._variants.REST_[k]).toLowerCase() === host; }).length) {
        var key = host;
        if (key in r._variants.REST_) {
          for (let i = -1; ++i < Object.keys(r._variants.REST_).length;) {
            if (!(((key + i) in r._variants.REST_))) {
              key += i;
              break;

            } else if ((r._variants.REST_[key+i].host == host) && (r._variants.REST_[key+i].path == string_(prepared.basePath))) {
              return;  

            }
          }
        }
        r._variants.REST_[key] = { 
          host: host, 
          path: string_(prepared.basePath)
        }
      }
    }
  }
}


function insertDefinitions(data, definitions) {
  if (typeof data === 'string') {
    return data;

  } else if (data instanceof Array) {
    return data.map((e) => {return insertDefinitions(e, definitions); });

  } else if (data && (typeof data === 'object')) {
    if (typeof data['$ref'] === 'string' && (data['$ref'].substr(0,14) === '#/definitions/')) {
      return definitions[data['$ref'].substr(14)];
    
    } else {
      var data_ = {}; for (var k in data) { data_[k] = insertDefinitions(data[k], definitions); }
      return data_;

    }
  } 
     
  return data;
}
