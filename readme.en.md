### 2016-01-16

* Predefined functions are added.
* socket_io.disconnect is added.

### State of the Project 

The initial idea behind WSagger was to create a set of tools for testing Socket.io services. Over the course of development, the toolset has quickly grown to a full-scale project called WSagger. 
 

### Supported Features

* socket.io server requests;
* http/https requests;
* browser and console interfaces;
* description for conditions under which each step is considered as successful (scenario execution stops after the first unsuccessful step);
* subroutine execution (supported in console interface only);
* synchronous and/or asynchronous execution of processes generated (supported in console interface only);
* communication between test processes (UNIX IPC, supported in console interface only);
* files uploading (including subroutine files) to drive (in console interface only).


### Features under development

* "Scenarios tree" Tab in the browser interface for quick access to scenarios;
* Automated conversion of swagger.json and swagger-responses to "expected" scenario parameter (to maximize the automation of API-tests creation);
* access to standard sockets via TCP/WebSocket protocols (without socket.io);
* support of third-party modules for Unit-testing (if these modules use the same scenario formatting and test interface);
* scenario verification according to the description in JSON Schema format (will migrate from the previous version).
 

### Documentation

* [README ukrainian](./readme.md)
* [ukrainian](./manual.md)   
* [english](./manual.en.md)
