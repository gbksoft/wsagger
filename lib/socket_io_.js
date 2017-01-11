var socket_io_;
if (typeof exports !== 'undefined') {
  (require('fundamentum'))('array_', 'object_', 'log', 'error');
  runner_    = require('./runner');
  socket_io_ = exports;

} else {
  socket_io_ = { };

}

socket_io_.connect_ = connect_;

function connect_() {

  var socket_io     = this;

  socket_io.node_   = (typeof exports !== 'undefined') ? require ('socket.io-client') : io; 

  socket_io.connect = connect;
  socket_io.emit    = emit;
  socket_io.expect  = expect;
  socket_io.name    = 'socket_io';

  return socket_io;
  
  function connect(runner, step, data, expected) {
    runner_.initAsync(socket_io, runner, step, data, expected);   
 
    var query = object_ (data.query); query.forceNew = true;
    // log (query);

    socket_io.socket = socket_io.node_(data.url, query);
    
    if (socket_io.socket) { 
      var onevent = socket_io.socket.onevent;
      socket_io.socket.onevent = function (packet) {
        var args = packet.data || [];
        onevent.call (this, packet);      // original call
        packet.data = ["*"].concat([socket_io]).concat(args); //  
        onevent.call (this, packet);      // additional call to catch-all
      };
      socket_io.socket.on ("*", runner_.onInputEvent);
    }
  }

  function emit(runner, step, data, expected) {
    runner_.initAsync(socket_io, runner, step, data, expected);   
    socket_io.socket.emit.apply(socket_io.socket, data);
  }

  function expect(runner, step, data, expected) {
    runner_.initAsync(socket_io, runner, step, data, expected);   
  }
}
