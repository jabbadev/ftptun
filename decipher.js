#!/bin/env node

var crypto = require('crypto'),
    deipher = crypto.createDecipher('aes-256-cbc',"secret1234")
	fs = require('fs'),
	outStream = fs.createWriteStream('output.bin',{ encoding: "binary" }),
	msg = "";

process.stdin.on('data', function(chunk) {
	var chunkB64 = deipher.update(chunk.toString(),'base64','base64')
	outStream.write(new Buffer(chunkB64,'base64'));
	//outStream.write(deipher.update(chunk,'base64','base64'));
	//outStream.write(chunk);
});

process.stdin.on('end', function() {
  //msg = deipher.final('binary');
  //var chunkB64 = deipher.final('base64');
  outStream.write(new Buffer(deipher.final('base64'),'base64'));
  //outStream.write(chunkB64);
  //outStream.write(deipher.final('binary'));
  outStream.close();
});
