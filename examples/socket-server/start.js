var app = require('http').createServer()
var io  = require('socket.io')(app);

app.listen(10002); console.log ('listening on :10002')
app.listen(10003); console.log ('listening on :10003')


/*
var fs = require('fs');
function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}
*/

io.on('connection', (socket) => {
  socket.emit('connectedTo', { socketId: socket.id });
  // socket.on('error', console.log);
  
  socket.on('message', (data) => {
    socket.emit('message',  data);
    socket.emit('message_', data);
  
    console.log('socket.on:', 'message', data);
  });
});