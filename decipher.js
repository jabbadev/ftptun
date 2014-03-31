#!/bin/env node

var crypto = require('crypto'),
    deipher = crypto.createDecipher('aes-256-cbc',"secret1234")
	fs = require('fs'),
	outStream = fs.createWriteStream('output.bin',{ encoding: "binary" }),
	msg = "";

process.stdin.on('data', function(chunk) {
	var chunkB64 = deipher.update(chunk.toString(),'base64','base64')
	outStream.write(new Buffer(chunkB64,'base64'));
});

process.stdin.on('end', function() {
  outStream.write(new Buffer(deipher.final('base64'),'base64'));
  outStream.close();
});
