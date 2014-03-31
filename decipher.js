#!/bin/env node

var crypto = require('crypto'),
    deipher = crypto.createDecipher('aes-256-cbc',"secret1234")
	fs = require('fs'),
	outStream = fs.createWriteStream('output.bin',{ encoding: "binary" }),
	msg = "";

process.stdin.on('data', function(chunk) {
	console.log('chunk: %s ,size %d',chunk.toString().substr(0,10), chunk.toString().length);
	var chunkB64 = deipher.update(chunk.toString(),'base64','base64');
	console.log('chunkB64: %s ,size %d',chunkB64.toString().substr(0,10), chunkB64.toString().length);
	outStream.write(new Buffer(chunkB64,'base64'));
});

process.stdin.on('end', function() {
  //outStream.write(new Buffer(deipher.final('base64'),'base64'));
  var chunkB64 = deipher.final('base64');
  console.log('final: ',chunkB64);
  outStream.write(chunkB64);
  outStream.close();
});
