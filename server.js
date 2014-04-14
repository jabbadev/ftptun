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
	  rangeHeader = null,
	  cacheControl = null; 
  
  rangeHeader = req.headers['range'];
  cacheControl = req.headers['cache-control'];
  req.setEncoding('utf8');
  req.on('data',function(data){
  	postBody = postBody + data;
  });
  req.on('end',function(){
	var reqOptions = "", getURL = "", req; 
    
	reqOptions = JSON.parse(postBody);
	getURL = reqOptions.method + " http://" + reqOptions.hostname + reqOptions.path; 
	//console.log('Req: %s Range: [ %s ]', getURL, rangeHeader );
	
	if ( reqOptions.method == "HEAD" ) {
		console.log('Req: %s', getURL );
		req = http.request(reqOptions,function(res){
			res.on('data',function(data){});
			res.on('end',function(){
				clientRes.writeHead(200,{'Resource-Content-Length': res.headers['content-length'], 'Content-Length': 0 });
				clientRes.end();
			});
		});
		req.end();
	}
	else {
		console.log('Req: %s Range: [ %s ]', getURL, rangeHeader );
	
		clientRes.writeHead(200,{'Content-Type': 'text/plain'}); 
		if ( rangeHeader && cacheControl ){
			reqOptions.headers = { 'range': rangeHeader, 'cache-control': cacheControl };
		}
		
		req = http.request(reqOptions,function(res){
			res.on('data',function(chunk) {
				var cb64 = new Buffer(chunk.toString('base64'),'base64'),
					cb64cipher = cipher.update(cb64);
				clientRes.write(cb64cipher);
			});
			res.on('end',function(){
				var cb64cipher = cipher.final(), respHeader = {'Content-Type':'text/plain'};
				//if ( rangeHeader && cacheControl ){ respHeader['Resource-Range'] = rangeHeader }
				//clientRes.writeHead(200,respHeader);
				clientRes.end(cb64cipher);
			});
		});
		req.end();
	}
  });
  
}).listen(port,ipaddr);
console.log('Server running at http://' + ipaddr + ':' + port + '/');
