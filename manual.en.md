### Browser interface

Runs from the project’s root as a static index.html.

It works as followed:

0. Upload the scenario file (URL/disk) in the left window of the interface. 

1. Additionally, you can upload _variants.json file with servers/users data that will be used in testing (this data also can be included in the scenario itself). If no file uploaded the message appear: "No variants data (REST server, socket server, user, etc.) are loaded !!!"

2. Upon http-scenarios uploading, all variants of responses are available for viewing in “Expectations” tab (if described).

3. Parameters for scenario execution are defined as followed:
    First - defaultValue from the scenario.parameters (formatting is same for scenario.parameters and parameters swagger);
    Second - data from selectors (selectors are formed according to variants. see #1)
    Third - data from fields that are filled by the user.

4. You can review scenario execution results in the right window of the browser interface.
   

### Local installation and launch in console

    $ git clone {the_repository}
    $ cd wsagger
    $ npm install


Script execution

    ./w {{filename}} 
    ./w {{filename}} --debug 


Execution of scenarios directory

    ./wa {{dirname}} 


### Script examples for http-requests

    examples/test_http_success.wsagger.json — test for successful access to http-page
    examples/test_http_fail.wsagger.json    — test for unsuccessful access to http-page


Launch in browser — load file examples/test_http_success.wsagger.json and "Try!". Parameters in left panel:

    host: infomincer.net   
    path: /


Launch in console

    ./w examples/test_http_success.wsagger.json 
    ./w examples/test_http_fail.wsagger.json --debug 

Batch launch in console

    ./wa examples


### Script examples for socket.io

Test server launch:

    cd examples/socket-server
    node start.js

Server is running on 10002 port and can perform next functions:

* Upon connection — emits notification to the client 'connectedTo' {socketId: ...};
* Server response for 'message' notification - the message itself and its 'message_'-copy. 

Scripts:

    examples/test_socket.io_connect.wsagger.json — test for successful access to socket.io
    examples/test_socket.io_emit.wsagger.json    — test for notification to socket.io


### Scripting format

#### "wsagger" field

    == "variants"   — means that this file contains variant-tree (contains data for other scenarios execution - server choice, user, protocol, etc.);
    == "index"      — means that this file contains the scenarios tree in order to select one of them;
    any other value — means that this file contains wsagger scenario (scenario).

#### "origin" field

    Information about scenarios that was imported after converting swagger.json.

#### "name" field

    The name of the scenario.

#### "variants" field

    Variant tree (contains all data for execution of the scenario - server choice, user, protocol, etc.). This data can be stored in a separate file _variants.json.

#### "parameters" field

    Format of description for parameters is pretty much the same as in swagger-format. This one is used in the browser interface.
    name          // this naming is used as a key for execution (see. "Sharing of values between scenario and context")
    type          // not processed yet
    required      // not processed yet
    description   // for notation
    default       // this value is used if no other valuer for the parameter is set

#### "responses" field

    Containss the results of importing from swagger.json (not in use temporarily, but the interface is present in a browser tab [Expectations]).


#### "functions" field - user functions 

You can describe any JS-functions in the scenario. Each of them will be called with two parameters (data, context):

    data    — "current object"
    context — general scenario context

Example:

    "functions": {
      "isString":   "function (data)          { return typeof data === 'string'; }",  // ? if the current value is a string
      "inContext":  "function (data, context) { return data in context; }"            // ? if the current value is key in context  
    }

In this case each element like "{{*isString}}" or "{{*inContext}}" in the “expected”-object will run corresponding verification of the object’s data.

#### "data" field 

    The object or list of objects ("scenario steps"), each of which may contain the following fields.

#### "(data.)action" field

Possible values:
"http.request"
"https.request"
"http_.request"
"socket_io.connect"
"socket_io.emit"
"socket_io.expect"

#### "(data.)data" field

The object or list of objects in role arguments for (data.)action.

###### (data.)data for http.request / https.request

An object with data for http/https request. For example:

    { 
      "action": "http.request",
      "data": {
        "method": "POST", 
        "host": "abc.ru", 
        "port": 80, 
        "path": "/login", 
        "headers": {
          "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
          "queryData":"username={{user.username}}&password={{user.password}}"
        }  
      },          
      ...
    }


###### (data.)data for http_.request

A pair [{{proto}}, {{data for request}}], for example:

    { 
      "action": "http_.request",
      "data": [
        "https", 
        {
          "method": "GET", 
          "host": "abc.ru", 
          "port": 443, 
          "path": "/", 
        }  
      ],  
      ...
    }


###### (data.)data for socket_io.connect

An object with fields "url" and "query" (not necessarily), for example:

    {
      "action": "socket_io.connect",           
      "data": { 
        "url": "http://{{server.host}}:{{server.port}}{{server.path}}",            
        "query": { "query": "token={{token}}" }
      },
      ...
    }


###### (data.)data for socket_io.emit

An array, first element of which — event name, other — arguments for event handler, for example:

    { 
      "action"  : "socket_io.emit",
      "data"    : [
        "sendMessage", 
        {
          "type"       : "user", 
          "recipientId": "{{recipientId}}", 
          "messageText": "{{messageText}}"
        }
      ],
      ...  
    } 


###### (data.)data for socket_io.expect

Any value for (data.)data for socket_io.expect is not necessary.


###### (data.)data for call.callWsaggerFile (calling subroutine from file)

A list, first element of — filename for calling, other — arguments for call. Example: examples/test_socket.io_emit.wsagger.json

To exchange data between main scenario and subroutine you must:

* define field "keysIn" in subroutine-scenario — arguments list (to assign input values to context fields named in);

* define field "dataOut" in subroutine-scenario — way to convert subroutine context values into data object to transfer into main scenario;

* define field "dataOut" in main scenario — way to convert data object transferred from subroutine into context values of the main scenario.

Field "dataOut" can be:

* array  — list of the fields  to transfewr values directly;
* object — keys of are interpreted as data object keys, values — as expressions to substituter into corresponding target object fields;
* any other is interpreted as a field name of the target object in which entire transferred object will be assigned.


#### "(data.)wait" field

    { "delay": ... } — timeout time in milliseconds

#### "(data.)expected" field

The object or list of objects that should be obtained after scenario execution (for http_ - one object; for socket_io - may be a list of objects). You can run scenario in browser or in console with --debug argument to chek what scenario step really returns and describe "expected" in accordance to.


#### Values exchange between scenario step and context

All steps of the scenario are performed in the context of the fixed object which is named "context". 

While running the scenario from browser mode all initial values in the context fields are defined according to parameters.   

While running the scenario from console mode all initial values in the context fields are defined according to console arguments.

You can use templates for “data” and “expected” fields :

    {{key}}     // in this case, the substitution of value in the scenario field is applied from the appropriate context field.
    !!! If in the line "out ->" (Flow-window) is present fragments like "{{...}}", than some parameter’s value have not been applied.

    You can use templates for “expected” field:
    {{!key}}    // in this case, the substitution of value in the object data field is applied from the appropriate context field.

    {{*key}}    // in this case, the substitution of value in the object data field is  examined with the specified function from scenario-defined functions.


#### Variants - parameters variants description 

You can set optional parameters in the structure of variants-object (in scenario or in separate _variants.json). You can choose those parameters from the 
browser with the appropriate list boxes or from console using their keys.

Example - in examples/test_socket.io_connect.wsagger.json




