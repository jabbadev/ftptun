#!/bin/env node

var http = require('http'),
    crypto = require('crypto');

var ipaddr  = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port    = process.env.OPENSHIFT_NODEJS_PORT || 1337;
	
	

http.createServer(function (req,clientRes) {
  var postBody = "",
      cipher = crypto.createCipher('aes-256-cbc',"secret1234"),
	  msg = [];
	  
  clientRes.writeHead(200,{'Content-Type': 'text/plain'}); 
  req.setEncoding('utf8');
  req.on('data',function(data){
  	postBody = postBody + data;
  });
  req.on('end',function(){
     var reqOptions = JSON.parse(postBody),
	     getURL = "http://" + reqOptions.hostname + reqOptions.path ;
     
	 console.log('Req to: ' + getURL );
	 http.get(getURL,function(res){
		res.on('data',function(chunk) {
			var chunkB64 = chunk.toString('base64');
			var cb64 = new Buffer(chunkB64,'base64');
			console.log('xxxxxxx ',cb64);
			//console.log('chunk: %s, size: %d',chunkB64.toString().substr(chunkB64.toString().length,-10),chunkB64.length);
			var chunkB64cipher = cipher.update(cb64);
			//console.log('chunkB64cipher: %s, size: %d',chunkB64cipher.toString().substr(chunkB64cipher.toString().length,-10),chunkB64cipher.length);
			clientRes.write(chunkB64cipher);
		});
		res.on('end',function(){
			clientRes.write(cipher.final());
			clientRes.end();
		});
	 });
     
  });
  
}).listen(port,ipaddr);
console.log('Server running at http://' + ipaddr + ':' + port + '/');
