#!/bin/env node

var crypto = require('crypto'),
    deipher = crypto.createDecipher('aes-256-cbc',"secret1234")
	fs = require('fs'),
	outStream = fs.createWriteStream('output_decipher.bin',{ encoding: "binary" }),
	msg = "";
	
//var inf = fs.createReadStream('orig_file_cipher.tar.gz');

outStream.on('finish',function(){
	outStream.close();
});

process.stdin.on('data', function(chunk) {
//inf.on('data', function(chunk) {
	var chunkB64 = deipher.update(chunk);
	outStream.write(new Buffer(chunkB64,'base64'));
});

process.stdin.on('end', function() {
//inf.on('end', function() {
  var chunkB64 = deipher.final();
  outStream.end(new Buffer(chunkB64,'base64'));
});
