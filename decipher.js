#!/bin/env node

var crypto = require('crypto'),
    deipher = crypto.createDecipher('aes-256-cbc',"secret1234")
	fs = require('fs'),
	outStream = ((process.argv[2]) && fs.createWriteStream(process.argv[2]))||process.stdout;
	
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
