function convert(data) {
  var index       = { }, 
      scenarios   = [ ],        
      variants    = { schemes: ['http'] },
      parameters_ = { basePath: '' }
  ; 
   
  for (var key in data) {
    if (key === 'swagger') {
         index.origin = ['swagger', data.swagger];
      
    } else if (key === 'info') {
         index.info = object_(data.info);

    } else if (key === 'basePath') {
         parameters_.basePath = string_(data.basePath);

    } else if (key === 'schemes') {
      	variants.schemes = array_(data.schemes);

    } else if (key === 'paths') {
      	convertPaths(data, index, scenarios);

    } else {
      throw new Error({ error: 'bad top key', key: key, value: data.key });

    }
  };
  return result;
}

function	convertPaths(data, index, scenarios) {
  var paths = object_(data.paths);
  for (var path in paths) {
    for (var method in paths.path) {
      var scenario = {};
      var s0 = paths.path.method;
      for (var key in s0) {
        if (key === 'summary') {

        } else if (key === 'tags') {
    
        } else if (key === 'consumes') {

        } else if (key === 'produces') {

        } else if (key === 'operationId') {

        } else if (key === 'parameters') {

        } else if (key === 'responses') {

        } else {
          throw new Error({ error: 'bad key in /path/method/', path: path, method: method, key: key, value: s0.key });
        
        }
      } 
      scenarios.push(scenario);
    }   
  }
}

var data0 = {
	"swagger":"2.0",
	"info": {
	   "title":"GAMBLING GAME API",
	   "version":"1.0.4",
	   "description":""
	},
   "basePath": "/rest",
   "schemes": ["https"],
   "paths": {
   	"/v1/connections": {
   		"post": {
   			"summary": "Create connection for current token",
   			"tags": ["Node"], 
   			"consumes": ["application/json"],
   			"produces": ["application/json"],
   			"operationId": "userCreateConnection",
   			"parameters": [
   				{ 
   					"in": "body",
   					"name":"body",
   					"required": true,
   					"description": "",
   					"schema": {
   						"properties": {
   							"connection_id": {
   							   "type": "string"
   							}
   						}
   					}
   				}
   			],
   			"responses": {
   				"200": {
   					"description": "OK", 
   					"schema": {
   					   "$ref": "#/definitions/Success200Empty"
   					}
   				},

   				"401": {
   				   "description": "Unauthorized"
   				},

   				"422": {
   					"description": "Data Validation Failed.",
   					"schema": {
   					   "$ref": "#/definitions/ErrorModel"
   					}
   				}
   			}
   		},

   		"delete": {
   			"summary": "Delete connection",
   			"tags": ["Node"],
   			"consumes": ["application/json"],
   			"produces": ["application/json"],
   			"operationId": "userDeleteConnection",
   			"parameters": [],
   			"responses": {
   				"200": {
   					"description": "OK",
   					"schema": {
   					   "$ref": "#/definitions/Success200Empty"
   					}
   				},

   				"401": {
   				   "description": "Unauthorized"
   				}
   			}
   		}
   	}
   }	
}

console.log(convert(data0));