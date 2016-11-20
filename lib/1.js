function http_(proto) {
  this.node_ = 1111111; 
  this.proto = proto; 
  this.request = request;

  return this;
  
  function request(runner, data) {
    console.log(this);
  }  
}

var aaa = new http_('!!!');

aaa.request(1,2);
