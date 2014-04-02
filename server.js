#!/bin/env node

var http = require('http'),
    crypto = require('crypto'),
	fs = require('fs'),
	ipaddr  = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1",
	port    = process.env.OPENSHIFT_NODEJS_PORT || 1337;

var of = fs.createWriteStream('orig_file.tar.gz');
var ofc = fs.createWriteStream('orig_file_cipher.tar.gz');

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
	 
	 of.on('finish',function(){
		of.close();
	 });
	 ofc.on('finish',function(){
		ofc.close();
	 });
	 /*
	 clientRes.on('finish',function(){
		console.log('all data send');
	 });
	 */
	 
	 http.get(getURL,function(res){
		res.on('data',function(chunk) {
			of.write(chunk);
			
			var cb64 = new Buffer(chunk.toString('base64'),'base64'),
			    cb64cipher = cipher.update(cb64);
			clientRes.write(cb64cipher);
			ofc.write(cb64cipher);
		});
		res.on('end',function(){
			cipher.setAutoPadding(true);
			var cb64cipher = cipher.final();
			of.end();
			ofc.end(cb64cipher);
			clientRes.end(cb64cipher);
		});
	 });
     
  });
  
}).listen(port,ipaddr);
console.log('Server running at http://' + ipaddr + ':' + port + '/');
