#!/bin/env node

var fs = require('fs'), 
	FTPTUN_CONFIG = { 
		'system': "/etc/ftptun/client.conf",
		'user': process.env['HOME'] + "/.config/ftptun/client.conf",
		'local': process.cwd() + "/client.conf" },
	config = null,
	cf = null;

fs.readFile(FTPTUN_CONFIG['local'],function (err,data) {
	if (err) {
		fs.readFile(FTPTUN_CONFIG['user'], function (err,data) {
			if( err ){
				fs.readFile(FTPTUN_CONFIG['system'], function (err,data) {
					if(err)throw err;
					
					Main(JSON.parse(data));
				});
			}
			else {
				Main(JSON.parse(data));
			}
		});
	}
	else {
		ParseCmdParams(Main,JSON.parse(data));
	}
});

function ParseCmdParams(mainCallBack,config) {
	var cmdopt = {}, argv = process.argv.slice(2);
	
	argv.forEach(
		function(item,i){
			console.log(item,i,argv.length);
			if( argv.length-1 == i ) {
				mainCallBack(cmdopt,config);
			}
		}
	);
}

function Main(cmdopt,config){
	console.log(cmdopt,config);
}




/*
var crypto = require('crypto'),
    deipher = crypto.createDecipher('aes-256-cbc',"secret1234")
	fs = require('fs'),
	url = require('url'),
	urlInfo = "",
	outStream = ((process.argv[2]) && fs.createWriteStream(process.argv[2]))||process.stdout;


urlInfo = url.parse(process.argv[2]);
console.log(urlInfo);

outStream.on('finish',function(){
	outStream.close();
});

process.stdin.on('data', function(chunk) {
	var chunkB64 = deipher.update(chunk);
	outStream.write(new Buffer(chunkB64,'base64'));
});

process.stdin.on('end', function() {
  var chunkB64 = deipher.final();
  if ( process.argv[2] ){
	outStream.end(new Buffer(chunkB64,'base64'));
  }
  else {
	outStream.write(new Buffer(chunkB64,'base64'));
  }
});

*/
