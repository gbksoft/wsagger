function aaa () {
   return this;
}

var proto = new aaa();

console.log(proto instanceof Object);