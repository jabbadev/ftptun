#!/bin/env node

var http = require('http'),
    crypto = require('crypto');

var ipaddr  = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port    = process.env.OPENSHIFT_NODEJS_PORT || 1337;
	
http.createServer(function (req,clientRes) {
  var postBody = "",
      cipher = crypto.createCipher('aes192',"secret1234"),
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
			clientRes.write(cipher.update(chunk,'binary','hex'));
		});
		res.on('end',function(){
			clientRes.write(cipher.final('hex'));
			clientRes.end();
		});
	 });
     
  });
  
}).listen(port,ipaddr);
console.log('Server running at http://' + ipaddr + ':' + port + '/');
