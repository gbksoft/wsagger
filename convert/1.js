
var d = '{a}saert {bc} saer {a}'
var p = { a: '{{a}}', bc: '{{bc}}' };

d = d.replace(/\{[^}]*\}/g, (x) => { x.substr(1, x.length - 2); return (x in p) ? p[x] : '{' + x + '}'; }); 


console.log(d);
