#!/bin/env node

var http = require('http'),
    crypto = require('crypto'),
	fs = require('fs'),
	url = require('url'),
	ipaddr  = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1",
	port    = process.env.OPENSHIFT_NODEJS_PORT || 1337;

http.createServer(function (req,clientRes) {
  var postBody = "",
      cipher = crypto.createCipher('aes-256-cbc',"secret1234"),
	  msg = [];
	  
  //clientRes.writeHead(200,{'Content-Type': 'text/plain'}); 
  req.setEncoding('utf8');
  req.on('data',function(data){
  	postBody = postBody + data;
  });
  req.on('end',function(){
     var reqOptions = JSON.parse(postBody),
	     getURL = "http://" + reqOptions.hostname + reqOptions.path ;
     
	console.log('Req to: ' + getURL );
	
	if ( reqOptions.method == "HEAD" ) {
		var req = http.request(reqOptions,function(res){
			res.on('end',function(){clientRes.writeHead(200,{'Content-Length': res.headers['content-length']})});
		});
		req.end();
	}
	else {
		clientRes.writeHead(200,{'Content-Type': 'text/plain'}); 
		http.get(getURL,function(res){
			res.on('data',function(chunk) {
				var cb64 = new Buffer(chunk.toString('base64'),'base64'),
					cb64cipher = cipher.update(cb64);
				clientRes.write(cb64cipher);
			});
			res.on('end',function(){
				var cb64cipher = cipher.final();
				clientRes.end(cb64cipher);
			});
		});
	}
  });
  
}).listen(port,ipaddr);
console.log('Server running at http://' + ipaddr + ':' + port + '/');
