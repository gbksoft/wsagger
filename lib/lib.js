if (typeof exports !== 'undefined') {
  (require('fundamentum'))('array_', 'object_', 'log', 'error');
  exports.loadObject = loadObject;

}


function loadObject(dataFile_) {
  
  var dataFile = process.env.WSAGGER_SCRIPT_PATH + dataFile_;

  try {
    if (fs.statSync(dataFile).isFile()) return jsonlint.parse(fs.readFileSync(dataFile, {encoding: 'utf8'}), null, true);     
    log('NOT A FILE: ' + dataFile);

  } catch (err) {
    log('OBJECT LOADING ERROR: ' + dataFile, err);

  }
  process.exit();
}
