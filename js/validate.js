const fs  = require('fs'),
validator = require('../js/validator');

const schemaFile = 'schema/wsagger.schema.json',
      schema = JSON.parse(fs.readFileSync(schemaFile));

let schemaErrors = validator.schemaErrors(schema);

if (schemaErrors) {
   console.log ( '??? SCHEMA IS BAD: ', schemaErrors);
   process.exit();
}

console.log ('!!! SCHEMA IS GOOD !!!');

const dataFile0 = process.argv[2] ? process.argv[2] : 'wsagger.json';

let dataFileStat, data, dataErrors, errorDataFiles = [];

try {
   dataFileStat = fs.statSync(dataFile0);

} catch (err) {
   console.log('??? NO SUCH FILE: ', dataFile0);
   process.exit();
}

let dataFilesList = dataFileStat.isDirectory()
                  ? fs.readdirSync(dataFile0)
                      .filter((f) => { return (f.substr(-13) === '.wsagger.json'); }).map((f) => { return dataFile0 + '/' + f; })
                  : [dataFile0];

for (let dataFile of dataFilesList) {
   if (fs.statSync(dataFile).isFile()) {
      console.log(dataFile);
      try {
         data = JSON.parse(fs.readFileSync(dataFile));

      } catch (err) {
         console.log('??? READING ERROR: ', err);
         continue;

      }
      dataErrors = validator.dataErrors(schema, data);
      if (dataErrors) {
         console.log ('??? DATA IS BAD: ', dataErrors);
         errorDataFiles.push(dataFile);
      } else {
         console.log ('OK');

      }
   }
}


if (errorDataFiles.length) console.log ('\n??? BAD DATA FILES:\n', errorDataFiles);

