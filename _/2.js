const execFile = require ('child_process').execFile;

const child = execFile('node', ['1.js'], (error, stdout, stderr) => {
  if (error) {
    throw error;
  }
  console.log (1111 + stdout + 11111);
});