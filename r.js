var io       = require ('socket.io-client');
var frontUrl = 'http://chat-nodejs.dev.gbksoft.net:28781/front_space';
var frontUrl = 'http://localhost:28780/front_space';
var query    = {query: "token=2"};
var socket   = io (frontUrl, query);

socket.on ('connect', function () {
    socket.emit("sendMessage", {"type": "group", "groupId": "1", "messageText": "{{messageText}}"});

});

