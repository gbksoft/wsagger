if (typeof exports !== 'undefined') {
  (require('fundamentum'))('array_', 'object_', 'log', 'error');
  exports.loadObject = loadObject;

}

let fs       = require('fs'),
    jsonlint = require('jsonlint');

function loadObject(dataFile) { 
  try {
    if (fs.statSync(dataFile).isFile()) return jsonlint.parse(fs.readFileSync(dataFile, {encoding: 'utf8'}), null, true);     
    log('NOT A FILE: ' + dataFile);

  } catch (err) {
    log('OBJECT LOADING ERROR: ' + dataFile, err);

  }
  return {};
}
