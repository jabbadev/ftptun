#!/bin/env node

var Config = require('./lib/clientInit.js'),
	Downloader = require('./lib/downloader.js')
	finish = false,

clientConf = new Config();
clientConf.loadConfig(Main);

function Main(conf){
	console.log(conf);
	var downloader = new Downloader(conf,process.argv[2]);
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
