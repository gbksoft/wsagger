var schemaFile = 'wsagger.schema.json';
var dataFile   = 'wsagger.json';

var fs     = require ('fs');
var schema = JSON.parse (fs.readFileSync (schemaFile));
console.log ('SCHEMA IS READED');

var data   = JSON.parse (fs.readFileSync (dataFile));
console.log ('DATA IS READED');

var ajv      = new (require ('ajv')) ({allErrors: true}); 

/*
var validate = ajv.compile(schema);
var valid    = validate(data);
if (!valid) console.log(validate.errors);
*/

console.log (ajv.validateSchema (schema) ? '!!! SCHEMA IS GOOD: ' + schemaFile : ajv.errors);
console.log (ajv.validate (schema, data) ? '!!! DATA IS VALID: ' + dataFile : ajv.errors);