var schemaFile = 'wsagger.schema.json';

var fs     = require ('fs');
var schema = JSON.parse (fs.readFileSync (schemaFile));
console.log ('SCHEMA IS READED');

var dataFile  = process.argv[2] ? process.argv[2] : 'wsagger.json';


var data   = JSON.parse (fs.readFileSync (dataFile));
console.log ('DATA IS READED: ' + dataFile);

var ajv      = new (require ('ajv')) ({allErrors: true}); 

/*
var validate = ajv.compile(schema);
var valid    = validate(data);
if (!valid) console.log(validate.errors);
*/

console.log (ajv.validateSchema (schema) ? '!!! SCHEMA IS GOOD: ' + schemaFile : ajv.errors);
console.log (ajv.validate (schema, data) ? '!!! DATA IS VALID: ' + dataFile : ajv.errors);