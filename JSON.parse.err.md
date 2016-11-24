Видача від JSON.parse:

    data = JSON.parse(fs.readFileSync(dataFile));  


/data/home/user/0/wsagger/game.new/test_login_CID.wsagger.json SyntaxError: Unexpected token } in JSON at position 1191
    at Object.parse (native)
    at Object.<anonymous> (/data/home/user/0/wsagger/lib/run.js:47:17)
    at Module._compile (module.js:570:32)
    at Object.Module._extensions..js (module.js:579:10)
    at Module.load (module.js:487:32)
    at tryModuleLoad (module.js:446:12)
    at Function.Module._load (module.js:438:3)
    at Module.runMain (module.js:604:10)
    at run (bootstrap_node.js:394:7)
    at startup (bootstrap_node.js:149:9


Видача від jsonlint.parse:

    data = jsonlint.parse(fs.readFileSync(dataFile));  


/data/home/user/0/wsagger/game.new/test_login_CID.wsagger.json TypeError: this._input.match is not a function
    at Object.next (/data/home/user/0/wsagger/node_modules/jsonlint/lib/jsonlint.js:316:37)
    at Object.lex (/data/home/user/0/wsagger/node_modules/jsonlint/lib/jsonlint.js:349:22)
    at lex (/data/home/user/0/wsagger/node_modules/jsonlint/lib/jsonlint.js:91:28)
    at Object.parse (/data/home/user/0/wsagger/node_modules/jsonlint/lib/jsonlint.js:109:26)
    at Object.exports.parse (/data/home/user/0/wsagger/node_modules/jsonlint/lib/jsonlint.js:417:53)
    at Object.<anonymous> (/data/home/user/0/wsagger/lib/run.js:46:21)
    at Module._compile (module.js:570:32)
    at Object.Module._extensions..js (module.js:579:10)
    at Module.load (module.js:487:32)
    at tryModuleLoad (module.js:446:12)
