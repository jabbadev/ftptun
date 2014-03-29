#!/bin/env node

var crypto = require('crypto'),
    deipher = crypto.createDecipher('aes192',"secret1234")
	fs = require('fs'),
	outStream = fs.createWriteStream('output'),
	msg = [];

process.stdin.setEncoding('hex');
process.stdin.on('readable', function(chunk) {
  
  while(null !== (chunk = process.stdin.read() )) {
  	 var cb = new Buffer(chunk,'hex');
    msg.push(deipher.update(cb,'hex','binary'));
  }
});

process.stdin.on('end', function() {
  msg.push(deipher.final('binary'));
  fs.appendFile('output',msg.join());
});
