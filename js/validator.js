if (typeof exports !== 'undefined') {
   exports.schemaErrors = ajvSchemaErrors;
   exports.dataErrors   = ajvDataErrors;

   Ajv = require('ajv'); 
}

const ajv = new Ajv({allErrors: true}); 

function ajvSchemaErrors(schema) {
   return ajv.validateSchema(schema) ? false : ajv.errors;

}

function ajvDataErrors(schema, data) {
   return ajv.validate(schema, data) ? false : ajv.errors;

}
